// @ts-nocheck
export interface WordPressSiteInfo {
  name: string;
  description: string;
  url: string;
  home: string;
  gmtOffset: number;
  timezoneString: string;
  namespaces: string[];
  authentication: {
    rest: {
      supported: string[];
    };
  };
}

export interface WordPressHealthCheck {
  status: string;
  description: string;
  tests: {
    direct: Array<{
      label: string;
      status: string;
      description: string;
    }>;
    async: Array<{
      label: string;
      status: string;
      description: string;
    }>;
  };
}

export interface SiteCheckResult {
  success: true;
  data: {
    siteName: string;
    description: string;
    wpVersion: string;
    timezone: string;
    isReachable: boolean;
    hasRestApi: boolean;
    healthStatus?: 'good' | 'recommended' | 'critical';
  };
}

export interface SiteCheckError {
  success: false;
  error: string;
}

function extractWpVersion(headers: Headers): string | null {
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    const match = poweredBy.match(/WordPress\/([\d.]+)/i);
    if (match) return match[1];
  }
  return null;
}

export async function checkWordPressSite(
  baseUrl: string
): Promise<SiteCheckResult | SiteCheckError> {
  try {
    let cleanUrl = baseUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');

    let siteInfo: WordPressSiteInfo | null = null;
    let wpVersion = 'Desconocido';
    let siteName = 'Sitio WordPress';
    let description = '';
    let timezone = 'UTC';
    let isReachable = false;
    let hasRestApi = false;

    try {
      const response = await fetch(`${cleanUrl}/wp-json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        isReachable = true;
        hasRestApi = true;

        const versionFromHeader = extractWpVersion(response.headers);
        if (versionFromHeader) {
          wpVersion = versionFromHeader;
        }

        try {
          siteInfo = await response.json();
          siteName = siteInfo.name || siteName;
          description = siteInfo.description || description;
          timezone = siteInfo.timezoneString || timezone;
        } catch (e) {
        }
      } else {
        isReachable = response.status !== 0;
      }
    } catch (fetchError) {
      isReachable = false;
    }

    if (!isReachable) {
      try {
        const response = await fetch(cleanUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        isReachable = response.ok;
        const versionFromHeader = extractWpVersion(response.headers);
        if (versionFromHeader) {
          wpVersion = versionFromHeader;
        }
      } catch (e) {
        isReachable = false;
      }
    }

    return {
      success: true,
      data: {
        siteName,
        description,
        wpVersion,
        timezone,
        isReachable,
        hasRestApi,
      },
    };
  } catch (error) {
    console.error('WordPress check error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: `No se pudo verificar el sitio: ${message}`,
    };
  }
}

export const maintenanceTasks = [
  { id: 'wp_core', label: 'Actualización WordPress Core', defaultChecked: true },
  { id: 'db_optimize', label: 'Optimización Base de Datos', defaultChecked: true },
  { id: 'backup', label: 'Copia de Seguridad Mensual', defaultChecked: true },
  { id: 'security', label: 'Revisión de Seguridad', defaultChecked: true },
  { id: 'performance', label: 'Optimización Rendimiento', defaultChecked: false },
  { id: 'themes', label: 'Actualización Temas', defaultChecked: false },
  { id: 'plugins', label: 'Actualización Plugins', defaultChecked: false },
  { id: 'comments', label: 'Limpieza Comentarios Spam', defaultChecked: false },
] as const;

export type MaintenanceTaskId = typeof maintenanceTasks[number]['id'];
