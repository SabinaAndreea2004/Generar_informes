import { NextRequest, NextResponse } from "next/server";
import type { WPPlugin } from "@/types/mantenimiento";

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url.replace(/\/$/, "");
}

function extractSlug(pluginField: string): string {
  return pluginField.split("/")[0] || pluginField;
}

function extractVersionFromReadme(text: string): string | null {
  const stableMatch = text.match(/^stable tag:\s*([^\s]+)/im);
  if (stableMatch) return stableMatch[1];
  const versionMatch = text.match(/^version:\s*([^\s]+)/im);
  return versionMatch ? versionMatch[1] : null;
}

function extractNameFromReadme(text: string, fallback: string): string {
  const match = text.match(/===\s*(.+?)\s*===/);
  return match ? match[1].trim() : fallback;
}

function cleanVersion(v: string): string {
  return v.replace(/^v/i, "").trim();
}

function compareVersions(current: string, latest: string | null): boolean {
  if (!latest) return false;
  const c = cleanVersion(current);
  const l = cleanVersion(latest);
  if (!c || c === "0.0.0") return false;
  return c !== l;
}

// ─── Detection – Method 1: Native WordPress REST API ────────────────────

interface RawPlugin {
  name: string;
  slug: string;
  status: "active" | "inactive";
  version_actual: string;
}

async function detectViaRestApi(wpUrl: string): Promise<RawPlugin[] | null> {
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/plugins?context=edit&per_page=100`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map((p: Record<string, unknown>) => ({
      name: String(p.name ?? ""),
      slug: extractSlug(String(p.plugin ?? "")),
      status: p.status === "active" ? ("active" as const) : ("inactive" as const),
      version_actual: String(p.version ?? "0.0.0"),
    }));
  } catch {
    return null;
  }
}

// ─── Detection – Method 2: Probing readme.txt files ─────────────────────

const COMMON_PLUGINS: Array<{ slug: string; name: string }> = [
  { slug: "akismet", name: "Akismet" },
  { slug: "wordpress-seo", name: "Yoast SEO" },
  { slug: "jetpack", name: "Jetpack" },
  { slug: "contact-form-7", name: "Contact Form 7" },
  { slug: "wordfence", name: "Wordfence Security" },
  { slug: "woocommerce", name: "WooCommerce" },
  { slug: "elementor", name: "Elementor" },
  { slug: "w3-total-cache", name: "W3 Total Cache" },
  { slug: "wp-super-cache", name: "WP Super Cache" },
  { slug: "updraftplus", name: "UpdraftPlus" },
  { slug: "all-in-one-wp-migration", name: "All-in-One WP Migration" },
  { slug: "redirection", name: "Redirection" },
  { slug: "wp-smushit", name: "Smush" },
  { slug: "wpforms-lite", name: "WPForms" },
  { slug: "google-analytics-for-wordpress", name: "MonsterInsights" },
  { slug: "duplicate-post", name: "Duplicate Post" },
  { slug: "classic-editor", name: "Classic Editor" },
  { slug: "litespeed-cache", name: "LiteSpeed Cache" },
  { slug: "autoptimize", name: "Autoptimize" },
  { slug: "really-simple-ssl", name: "Really Simple SSL" },
  { slug: "limit-login-attempts-reloaded", name: "Limit Login Attempts Reloaded" },
  { slug: "better-wp-security", name: "iThemes Security" },
  { slug: "mainwp-child", name: "MainWP Child" },
  { slug: "loco-translate", name: "Loco Translate" },
  { slug: "custom-post-type-ui", name: "Custom Post Type UI" },
  { slug: "advanced-custom-fields", name: "Advanced Custom Fields" },
  { slug: "polylang", name: "Polylang" },
  { slug: "sitepress-multilingual-cms", name: "WPML" },
  { slug: "mailpoet", name: "MailPoet" },
  { slug: "wp-mail-smtp", name: "WP Mail SMTP" },
  { slug: "easy-wp-smtp", name: "Easy WP SMTP" },
  { slug: "disable-comments", name: "Disable Comments" },
  { slug: "svg-support", name: "SVG Support" },
  { slug: "regenerate-thumbnails", name: "Regenerate Thumbnails" },
  { slug: "imagify", name: "Imagify" },
  { slug: "shortpixel-image-optimiser", name: "ShortPixel" },
  { slug: "webp-express", name: "WebP Express" },
  { slug: "ewww-image-optimizer", name: "EWWW Image Optimizer" },
  { slug: "seo-by-rank-math", name: "Rank Math SEO" },
  { slug: "all-in-one-seo-pack", name: "All in One SEO" },
  { slug: "header-footer-elementor", name: "Header Footer Elementor" },
  { slug: "essential-addons-for-elementor-lite", name: "Essential Addons for Elementor" },
  { slug: "happy-elementor-addons", name: "Happy Elementor Addons" },
  { slug: "beaver-builder-lite-version", name: "Beaver Builder" },
  { slug: "tablepress", name: "TablePress" },
  { slug: "pretty-link", name: "Pretty Links" },
  { slug: "thirstyaffiliates", name: "ThirstyAffiliates" },
  { slug: "gp-premium", name: "GeneratePress Premium" },
  { slug: "astra-addon", name: "Astra Pro" },
  { slug: "spectra", name: "Spectra" },
  { slug: "kadence-blocks", name: "Kadence Blocks" },
  { slug: "coblocks", name: "CoBlocks" },
  { slug: "smart-slider-3", name: "Smart Slider 3" },
  { slug: "revslider", name: "Slider Revolution" },
  { slug: "cookie-law-info", name: "GDPR Cookie Consent" },
  { slug: "complianz-gdpr", name: "Complianz GDPR" },
  { slug: "user-role-editor", name: "User Role Editor" },
  { slug: "members", name: "Members" },
  { slug: "intuitive-custom-post-order", name: "Intuitive Custom Post Order" },
  { slug: "admin-menu-editor", name: "Admin Menu Editor" },
  { slug: "loginizer", name: "Loginizer" },
  { slug: "two-factor", name: "Two Factor" },
  { slug: "wp-2fa", name: "WP 2FA" },
  { slug: "maintenance", name: "Maintenance" },
  { slug: "coming-soon", name: "Coming Soon Page" },
  { slug: "under-construction-page", name: "Under Construction" },
  { slug: "broken-link-checker", name: "Broken Link Checker" },
  { slug: "google-sitemap-generator", name: "Google XML Sitemaps" },
  { slug: "wp-optimize", name: "WP-Optimize" },
  { slug: "sg-cachepress", name: "SiteGround Optimizer" },
  { slug: "nitropack", name: "NitroPack" },
  { slug: "breeze", name: "Breeze" },
  { slug: "perfmatters", name: "Perfmatters" },
  { slug: "query-monitor", name: "Query Monitor" },
  { slug: "wp-migrate-db", name: "WP Migrate DB" },
  { slug: "duplicator", name: "Duplicator" },
  { slug: "backwpup", name: "BackWPup" },
  { slug: "child-theme-configurator", name: "Child Theme Configurator" },
  { slug: "code-snippets", name: "Code Snippets" },
  { slug: "insert-headers-and-footers", name: "Insert Headers and Footers" },
  { slug: "simple-history", name: "Simple History" },
  { slug: "activity-log", name: "Activity Log" },
  { slug: "enable-media-replace", name: "Enable Media Replace" },
  { slug: "pdf-embedder", name: "PDF Embedder" },
  { slug: "download-monitor", name: "Download Monitor" },
  { slug: "easy-digital-downloads", name: "Easy Digital Downloads" },
  { slug: "give", name: "GiveWP" },
  { slug: "ninja-forms", name: "Ninja Forms" },
  { slug: "formidable", name: "Formidable Forms" },
  { slug: "fluentform", name: "Fluent Forms" },
  { slug: "everest-forms", name: "Everest Forms" },
  { slug: "gravityforms", name: "Gravity Forms" },
  { slug: "wp-event-manager", name: "WP Event Manager" },
  { slug: "the-events-calendar", name: "The Events Calendar" },
  { slug: "event-tickets", name: "Event Tickets" },
  { slug: "modern-events-calendar-lite", name: "Modern Events Calendar" },
  { slug: "learnpress", name: "LearnPress" },
  { slug: "tutor", name: "Tutor LMS" },
  { slug: "learndash", name: "LearnDash" },
  { slug: "sensei-lms", name: "Sensei LMS" },
  { slug: "bbpress", name: "bbPress" },
  { slug: "wpforo", name: "wpForo" },
  { slug: "buddyboss-platform", name: "BuddyBoss" },
  { slug: "tawkto-live-chat", name: "Tawk.to Live Chat" },
  { slug: "popup-maker", name: "Popup Maker" },
  { slug: "hustle", name: "Hustle" },
  { slug: "optinmonster", name: "OptinMonster" },
  { slug: "fluent-crm", name: "FluentCRM" },
  { slug: "mailchimp-for-wp", name: "MC4WP" },
  { slug: "wpvivid-backuprestore", name: "WPvivid Backup" },
  { slug: "backuply", name: "Backuply" },
  { slug: "blogvault", name: "BlogVault" },
  { slug: "wp-staging", name: "WP Staging" },
  { slug: "migrate-guru", name: "Migrate Guru" },
  { slug: "vaultpress", name: "VaultPress" },
  { slug: "tiny-compress-images", name: "TinyPNG" },
  { slug: "redis-cache", name: "Redis Cache" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "sucuri-scanner", name: "Sucuri Security" },
  { slug: "defender-security", name: "Defender Security" },
  { slug: "secupress", name: "SecuPress" },
  { slug: "all-404-redirects-to-homepage", name: "All 404 Redirect to Homepage" },
  { slug: "safe-redirect-manager", name: "Safe Redirect Manager" },
  { slug: "page-links-to", name: "Page Links To" },
  { slug: "add-to-any", name: "AddToAny Share Buttons" },
  { slug: "social-icons-widget-by-wpzoom", name: "Social Icons Widget" },
  { slug: "blogger-image-import", name: "Blogger Image Import" },
  { slug: "fakerpress", name: "FakerPress" },
  { slug: "ssl-insecure-content-fixer", name: "SSL Insecure Content Fixer" },
  { slug: "really-simple-ssl", name: "Really Simple SSL" },
  { slug: "https-redirection", name: "HTTPS Redirection" },
  { slug: "flexible-checkout-fields", name: "Flexible Checkout Fields" },
  { slug: "checkout-field-editor-and-decorator", name: "Checkout Field Editor" },
  { slug: "woocommerce-gateway-stripe", name: "WooCommerce Stripe" },
  { slug: "woocommerce-paypal-payments", name: "WooCommerce PayPal" },
  { slug: "woocommerce-subscriptions", name: "WooCommerce Subscriptions" },
  { slug: "woocommerce-memberships", name: "WooCommerce Memberships" },
  { slug: "woocommerce-bookings", name: "WooCommerce Bookings" },
  { slug: "yith-woocommerce-wishlist", name: "YITH WooCommerce Wishlist" },
  { slug: "yith-woocommerce-compare", name: "YITH WooCommerce Compare" },
  { slug: "dokan-lite", name: "Dokan Multivendor" },
  { slug: "wc-multivendor-marketplace", name: "WCFM Marketplace" },
  { slug: "wpeka-cookie-consent", name: "Cookie Consent by WPEka" },
  { slug: "woocommerce-google-analytics-integration", name: "WooCommerce Google Analytics" },
  { slug: "woocommerce-services", name: "WooCommerce Shipping" },
  { slug: "check-pincode-for-woocommerce", name: "Check Pincode for WooCommerce" },
  { slug: "codazon-ajax-layered-nav", name: "Codazon AJAX Layered Nav" },
  { slug: "woo-variation-swatches", name: "WooCommerce Variation Swatches" },
  { slug: "currency-switcher-woocommerce", name: "Currency Switcher" },
];

const CHUNK_SIZE = 15;
const PROBE_TIMEOUT_MS = 4_000;

async function detectViaReadmeProbe(wpUrl: string): Promise<RawPlugin[]> {
  const found: RawPlugin[] = [];

  for (let i = 0; i < COMMON_PLUGINS.length; i += CHUNK_SIZE) {
    const chunk = COMMON_PLUGINS.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map(async ({ slug, name }) => {
        try {
          const res = await fetch(`${wpUrl}/wp-content/plugins/${slug}/readme.txt`, {
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
            cache: "no-store",
          });
          if (!res.ok) return null;
          const text = await res.text();
          if (!text) return null;
          return {
            name: extractNameFromReadme(text, name),
            slug,
            status: "active" as const,
            version_actual: extractVersionFromReadme(text) || "0.0.0",
          };
        } catch {
          return null;
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        found.push(r.value);
      }
    }
  }

  return found;
}

// ─── WordPress.org API Enrichment ────────────────────────────────────────

interface WpOrgInfo {
  version: string;
  name: string;
}

async function fetchWpOrgPluginInfo(slug: string): Promise<WpOrgInfo | null> {
  try {
    const res = await fetch(
      `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&slug=${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(8_000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data: Record<string, unknown> = await res.json();
    if (typeof data.version === "string" && data.version) {
      return { version: data.version, name: String(data.name ?? slug) };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Detect WordPress Version from <meta generator> ─────────────────────

async function detectWpVersion(wpUrl: string): Promise<string | null> {
  try {
    const res = await fetch(wpUrl, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(
      /<meta\s+name=["']generator["']\s+content=["']WordPress\s+([^"']+)["']/i
    );
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

// ─── Response Types ──────────────────────────────────────────────────────

export interface ScanResponse {
  success: boolean;
  plugins: WPPlugin[];
  wpVersion?: string;
  detectionMethod: "rest_api" | "readme_probe" | "none";
  error?: string;
  stats?: {
    totalDetected: number;
    withUpdates: number;
  };
}

// ─── GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse<ScanResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get("wpUrl");

    if (!wpUrl) {
      return NextResponse.json(
        { success: false, plugins: [], detectionMethod: "none", error: "Se requiere la URL del WordPress" },
        { status: 400 }
      );
    }

    const cleanUrl = normalizeUrl(wpUrl);

    // ── Phase 1: Detect plugins ──────────────────────────────────────
    let rawPlugins: RawPlugin[] | null = await detectViaRestApi(cleanUrl);
    let detectionMethod: ScanResponse["detectionMethod"] = "rest_api";

    if (!rawPlugins || rawPlugins.length === 0) {
      rawPlugins = await detectViaReadmeProbe(cleanUrl);
      detectionMethod = "readme_probe";
    }

    if (!rawPlugins || rawPlugins.length === 0) {
      return NextResponse.json({
        success: false,
        plugins: [],
        detectionMethod: "none",
        error:
          "No se pudieron detectar plugins automáticamente. " +
          "Verifica que la URL sea correcta y que el sitio WordPress sea accesible públicamente.",
      });
    }

    // ── Phase 2: Enrich with WordPress.org API ────────────────────────
    const enrichResults = await Promise.allSettled(
      rawPlugins.map(async (raw) => {
        const wpOrg = await fetchWpOrgPluginInfo(raw.slug);
        const versionNueva = wpOrg?.version ?? null;
        const plugin: WPPlugin = {
          name: wpOrg?.name ?? raw.name,
          slug: raw.slug,
          status: raw.status,
          version_actual: raw.version_actual,
          version_nueva: versionNueva,
          requiere_actualizacion: compareVersions(raw.version_actual, versionNueva),
        };
        return plugin;
      })
    );

    const plugins: WPPlugin[] = [];
    for (const r of enrichResults) {
      if (r.status === "fulfilled") plugins.push(r.value);
    }

    // ── Phase 3: Detect WP version (best-effort) ─────────────────────
    const wpVersion = await detectWpVersion(cleanUrl);

    return NextResponse.json({
      success: true,
      plugins,
      wpVersion: wpVersion ?? undefined,
      detectionMethod,
      stats: {
        totalDetected: plugins.length,
        withUpdates: plugins.filter((p) => p.requiere_actualizacion).length,
      },
    });
  } catch (error) {
    console.error("GET /api/mantenimiento/scan error:", error);
    return NextResponse.json(
      { success: false, plugins: [], detectionMethod: "none", error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
