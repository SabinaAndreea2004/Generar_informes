import type { WPPlugin } from "@/types/mantenimiento";

export interface SiteHealthParseResult {
  success: boolean;
  plugins: WPPlugin[];
  wpVersion: string | null;
  info?: { method: string; sections: string[] };
  error?: string;
}

// ─── Section extraction ──────────────────────────────────────────────────

const SECTION_RX = /###\s*(wp-\S+?)\s*(?:\((\d+)\))?\s*###\s*\n([\s\S]*?)(?=\n###\s|$)/gi;

function extractSections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = SECTION_RX.exec(text)) !== null) {
    map.set(match[1].toLowerCase(), match[3].trim());
  }
  return map;
}

// ─── Name → slug ─────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// ─── Build slug from the end of the name (most specific part) ────────────

function deriveSlug(name: string): string {
  const clean = name.replace(/\s*[:–—|]\s*.*$/, "").trim();
  return nameToSlug(clean);
}

// ─── Parse single-line compact format (WordPress 6.x+) ───────────────────

/*
  Formato real de Salud del Sitio:
    Plugin Name: Description: version: X.Y.Z, author: Author (latest version: X.Y.Z)

  Ejemplos:
    "Akismet Anti-spam: Spam Protection: version: 5.6, author: Automattic - Anti-spam Team (latest version: 5.7), Actualizaciones automáticas desactivadas"
    "Hello Dolly: version: 1.7.2, author: Matt Mullenweg, Actualizaciones automáticas desactivadas"
*/

function parseCompactLine(line: string, status: "active" | "inactive"): WPPlugin | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  // Detect the "version: X.Y.Z" field inside the line
  const versionMatch = trimmed.match(/version:\s*(\d[\d.]*(?:rc\d|beta\d|alpha\d)?)/i);
  if (!versionMatch) return null;
  const versionActual = versionMatch[1];

  // Check for update indicator: (latest version: X.Y.Z) or similar
  let versionNueva: string | null = null;
  const latestMatch = trimmed.match(/\(latest\s+version:\s*([^)]+)\)/i);
  if (latestMatch) {
    versionNueva = latestMatch[1].trim();
  }

  // Also handle other common patterns
  if (!versionNueva) {
    const availMatch = trimmed.match(/\(([\d.]+)\s+available\)/i);
    if (availMatch) versionNueva = availMatch[1];
  }
  if (!versionNueva) {
    const updateMatch = trimmed.match(/update:\s*(\d[\d.]*(?:rc\d|beta\d|alpha\d)?)/i);
    if (updateMatch) versionNueva = updateMatch[1];
  }

  // Extract name: everything before the first "version:" field
  const verFieldIndex = trimmed.toLowerCase().indexOf("version:");
  const beforeVersion = verFieldIndex > 0 ? trimmed.substring(0, verFieldIndex).trim() : trimmed;

  // Clean up the name part: remove trailing commas, colons, dashes
  let name = beforeVersion.replace(/[,;:\s]+$/, "").trim();

  // Try to extract a cleaner name by stripping known metadata prefixes
  // If the name looks like "Something: subtitle", keep the full thing
  if (!name) name = trimmed.split(",")[0].trim() || trimmed.substring(0, 60);

  const slug = deriveSlug(name);

  return {
    name,
    slug,
    status,
    version_actual: versionActual,
    version_nueva: versionNueva,
    requiere_actualizacion: !!versionNueva,
  };
}

// ─── Parse multi-line key-value format (older WordPress) ─────────────────

function parseMultilineEntry(lines: string[], status: "active" | "inactive"): WPPlugin | null {
  if (lines.length < 2) return null;

  const firstLine = lines[0].trim();
  if (!firstLine || firstLine.startsWith("#") || firstLine.startsWith("Plugin")) return null;

  const data: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const kv = lines[i].match(/^([^:]+):\s*(.+)$/);
    if (kv) data[kv[1].trim()] = kv[2].trim();
  }

  const name = data["Plugin Name"] || firstLine;
  const rawVersion = data["Version"] || "0.0.0";

  // Handle "Version: 1.0.0 (1.1.0 available)" inline update
  const paren = rawVersion.match(
    /^(.+?)\s*\(\s*(?:(?:version\s*)?(?::\s*)?)?(\d[\d.]*)\s*(?:available)?\s*\)$/i
  );
  let versionActual = rawVersion;
  let versionNueva: string | null = null;
  if (paren) {
    versionActual = paren[1].trim();
    versionNueva = paren[2];
  }
  if (data["Update"]) {
    versionNueva = data["Update"];
  }

  return {
    name,
    slug: firstLine.split("/")[0].trim(),
    status,
    version_actual: versionActual,
    version_nueva: versionNueva,
    requiere_actualizacion: !!versionNueva,
  };
}

// ─── Parse a section that contains compact single-line entries ───────────

function parseCompactSection(section: string, status: "active" | "inactive"): WPPlugin[] {
  const plugins: WPPlugin[] = [];
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const p = parseCompactLine(line, status);
    if (p) plugins.push(p);
  }
  return plugins;
}

// ─── Parse a section that contains multi-line block entries ──────────────

function parseMultilineSection(section: string, status: "active" | "inactive"): WPPlugin[] {
  const plugins: WPPlugin[] = [];
  const rawEntries = section.split(/\n{2,}/);
  for (const raw of rawEntries) {
    const lines = raw.trim().split("\n");
    if (lines.length < 2) continue;
    if (!lines[0].trim() || lines[0].trim().startsWith("Plugin")) continue;
    const p = parseMultilineEntry(lines, status);
    if (p) plugins.push(p);
  }
  return plugins;
}

// ─── Detect format and delegate ──────────────────────────────────────────

function parseSection(section: string, status: "active" | "inactive"): WPPlugin[] {
  // If the section has key:value pairs on separate lines, use multiline parser
  // Otherwise treat each line as a compact entry
  const hasMultiLineBlocks = section.split(/\n{2,}/).some(
    (block) => block.trim().split("\n").length >= 3
  );
  return hasMultiLineBlocks
    ? parseMultilineSection(section, status)
    : parseCompactSection(section, status);
}

// ─── Extract WP version ──────────────────────────────────────────────────

function extractWpVersion(sections: Map<string, string>): string | null {
  const core = sections.get("wp-core");
  if (!core) return null;
  const m = core.match(/^version:\s*(.+)$/im);
  return m ? m[1].trim() : null;
}

// ─── Main entry point ────────────────────────────────────────────────────

export function parseSiteHealth(text: string): SiteHealthParseResult {
  if (!text || text.trim().length === 0) {
    return { success: false, plugins: [], wpVersion: null, error: "El texto pegado está vacío." };
  }

  const sections = extractSections(text);

  const foundSections: string[] = [];
  const sectionNames = [
    "wp-plugins-active",
    "wp-plugins-inactive",
  ];

  const plugins: WPPlugin[] = [];

  for (const name of sectionNames) {
    const content = sections.get(name);
    if (content) {
      foundSections.push(name);
      const status = name === "wp-plugins-active" ? "active" : "inactive";
      const parsed = parseSection(content, status);
      plugins.push(...parsed);
    }
  }

  if (foundSections.length === 0) {
    return {
      success: false,
      plugins: [],
      wpVersion: null,
      error:
        "No se encontraron las secciones 'wp-plugins-active' ni 'wp-plugins-inactive'. " +
        "Asegúrate de copiar la información desde Herramientas → Salud del Sitio → Información → " +
        "'Copiar la información del sitio en el portapapeles'.",
    };
  }

  const wpVersion = extractWpVersion(sections);

  return {
    success: true,
    plugins,
    wpVersion,
    info: { method: "site-health", sections: foundSections },
  };
}
