export interface ParsedPlugin {
  name: string;
  version: string;
  author: string;
  status: 'active' | 'inactive';
  hasUpdate: boolean;
  newVersion?: string;
}

export interface ParsedWpHealth {
  wpVersion: string;
  siteUrl: string;
  homeUrl: string;
  activeTheme: string;
  activeThemeVersion: string;
  activePlugins: ParsedPlugin[];
  inactivePlugins: ParsedPlugin[];
  rawText: string;
}

export function parseWordPressHealthInfo(text: string): ParsedWpHealth {
  const result: ParsedWpHealth = {
    wpVersion: '',
    siteUrl: '',
    homeUrl: '',
    activeTheme: '',
    activeThemeVersion: '',
    activePlugins: [],
    inactivePlugins: [],
    rawText: text,
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let currentSection = '';
  let inActivePlugins = false;
  let inInactivePlugins = false;

  const wpPluginPattern = /^(.+?):\s*version:\s*([\d.a-zA-Z-]+),?\s*(?:author:\s*(.+?))?(?:,|$)/i;
  
  const fallbackPatterns = [
    /^(.+?)\s+\(([\d.a-zA-Z-]+)\)\s+[–\-—]\s+(.+)$/,
    /^(.+?)\s+:\s+([\d.a-zA-Z-]+)\s*[,;]\s*(.+)$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('###') && line.endsWith('###')) {
      currentSection = line.replace(/###/g, '').trim().toLowerCase();
      
      const sectionLower = currentSection.toLowerCase();
      if (sectionLower.includes('wp-plugins-active') || 
          sectionLower.includes('plugins activos') || 
          sectionLower.includes('active plugins')) {
        inActivePlugins = true;
        inInactivePlugins = false;
      } else if (sectionLower.includes('wp-plugins-inactive') || 
                 sectionLower.includes('plugins inactivos') || 
                 sectionLower.includes('inactive plugins')) {
        inActivePlugins = false;
        inInactivePlugins = true;
      } else {
        inActivePlugins = false;
        inInactivePlugins = false;
      }
      continue;
    }

    if (inActivePlugins || inInactivePlugins) {
      let matched = false;
      
      const wpMatch = line.match(wpPluginPattern);
      if (wpMatch) {
        const plugin: ParsedPlugin = {
          name: wpMatch[1].trim(),
          version: wpMatch[2].trim(),
          author: wpMatch[3]?.trim() || '',
          status: inActivePlugins ? 'active' : 'inactive',
          hasUpdate: false,
        };
        
        if (inActivePlugins) {
          result.activePlugins.push(plugin);
        } else {
          result.inactivePlugins.push(plugin);
        }
        matched = true;
      }

      if (!matched) {
        for (const pattern of fallbackPatterns) {
          const match = line.match(pattern);
          if (match) {
            const plugin: ParsedPlugin = {
              name: match[1].trim(),
              version: match[2].trim(),
              author: match[3]?.trim() || '',
              status: inActivePlugins ? 'active' : 'inactive',
              hasUpdate: false,
            };
            
            if (inActivePlugins) {
              result.activePlugins.push(plugin);
            } else {
              result.inactivePlugins.push(plugin);
            }
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const simplePattern = /^(.+?)\s*\(\s*([\d.a-zA-Z-]+)\s*\)/;
        const simpleMatch = line.match(simplePattern);
        if (simpleMatch) {
          const plugin: ParsedPlugin = {
            name: simpleMatch[1].trim(),
            version: simpleMatch[2].trim(),
            author: '',
            status: inActivePlugins ? 'active' : 'inactive',
            hasUpdate: false,
          };
          
          if (inActivePlugins) {
            result.activePlugins.push(plugin);
          } else {
            result.inactivePlugins.push(plugin);
          }
        }
      }
    }

    if (line.toLowerCase().includes('version:') || 
        line.toLowerCase().includes('versión:')) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('wp-core') || !result.wpVersion) {
        const versionMatch = line.match(/version:\s*([\d.a-zA-Z-]+)/i);
        if (versionMatch && currentSection.includes('wp-core')) {
          result.wpVersion = versionMatch[1].trim();
        }
      }
    }

    if (line.toLowerCase().includes('home_url:') || 
        line.toLowerCase().includes('site_url:')) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('home_url:')) {
        const urlMatch = line.match(/home_url:\s*(.+)/i);
        if (urlMatch) {
          result.homeUrl = urlMatch[1].trim();
        }
      }
      if (lowerLine.includes('site_url:')) {
        const urlMatch = line.match(/site_url:\s*(.+)/i);
        if (urlMatch) {
          result.siteUrl = urlMatch[1].trim();
        }
      }
    }

    if (currentSection.includes('wp-active-theme')) {
      if (line.toLowerCase().startsWith('name:')) {
        const nameMatch = line.match(/name:\s*(.+?)\s*\(/i);
        if (nameMatch) {
          result.activeTheme = nameMatch[1].trim();
        }
      }
      if (line.toLowerCase().startsWith('version:')) {
        const versionMatch = line.match(/version:\s*([\d.a-zA-Z-]+)/i);
        if (versionMatch) {
          result.activeThemeVersion = versionMatch[1].trim();
        }
      }
    }
  }

  return result;
}

export function formatHealthImport(
  text: string
): { 
  success: boolean; 
  plugins: Array<{
    id: string;
    name: string;
    version: string;
    status: 'active' | 'inactive';
    hasUpdate: boolean;
    isUpdated: boolean;
    author?: string;
  }>;
  info: {
    wpVersion: string;
    activePlugins: number;
    inactivePlugins: number;
  };
  error?: string;
} {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      plugins: [],
      info: { wpVersion: '', activePlugins: 0, inactivePlugins: 0 },
      error: 'El texto está vacío',
    };
  }

  const parsed = parseWordPressHealthInfo(text);
  const allPlugins = [...parsed.activePlugins, ...parsed.inactivePlugins];

  if (allPlugins.length === 0) {
    return {
      success: false,
      plugins: [],
      info: { wpVersion: parsed.wpVersion, activePlugins: 0, inactivePlugins: 0 },
      error: 'No se encontraron plugins en el texto. Asegúrate de:\n\n1. Ir a WordPress → Herramientas → Salud del Sitio\n2. Hacer clic en la pestaña "Información"\n3. Hacer clic en "Copiar información al portapapeles"\n4. Pegar todo el texto aquí',
    };
  }

  const plugins = allPlugins.map((p, index) => ({
    id: `imported-${Date.now()}-${index}`,
    name: p.name,
    version: p.version,
    status: p.status,
    hasUpdate: false,
    isUpdated: true,
    author: p.author,
  }));

  return {
    success: true,
    plugins,
    info: {
      wpVersion: parsed.wpVersion,
      activePlugins: parsed.activePlugins.length,
      inactivePlugins: parsed.inactivePlugins.length,
    },
  };
}
