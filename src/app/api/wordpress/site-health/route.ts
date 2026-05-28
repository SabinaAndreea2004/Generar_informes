// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export interface SiteHealthResponse {
  success: boolean;
  health?: {
    wpVersion: string;
    siteName: string;
    siteUrl: string;
    timezone: string;
    isAccessible: boolean;
    hasRestApi: boolean;
    restNamespaces: string[];
    serverSoftware: string;
    phpVersion: string;
    wordPressPaths: {
      restApiRoot: boolean;
      wpAdmin: boolean;
    };
    activeTheme?: string;
    siteStats?: {
      posts?: number;
      pages?: number;
      users?: number;
      media?: number;
    };
  };
  error?: string;
}

function extractWpVersion(headers: Headers): string {
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    const match = poweredBy.match(/WordPress\/([\d.]+)/i);
    if (match) return match[1];
    const phpMatch = poweredBy.match(/PHP\/([\d.]+)/i);
    if (phpMatch) return phpMatch[1];
  }
  return 'Desconocida';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get('wpUrl');

    if (!wpUrl) {
      return NextResponse.json<SiteHealthResponse>(
        { success: false, error: 'Se requiere la URL de WordPress' },
        { status: 400 }
      );
    }

    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');

    let wpVersion = 'Desconocida';
    let serverSoftware = 'Desconocido';
    let phpVersion = 'Desconocida';
    let isAccessible = false;
    let hasRestApi = false;
    let restNamespaces: string[] = [];
    let siteName = '';
    let timezone = 'UTC';

    try {
      const headRes = await fetch(cleanUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      if (headRes.ok) {
        isAccessible = true;
        wpVersion = extractWpVersion(headRes.headers);
        serverSoftware = headRes.headers.get('server') || 'Desconocido';
      }
    } catch {}

    try {
      const restRes = await fetch(`${cleanUrl}/wp-json/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (restRes.ok) {
        hasRestApi = true;
        wpVersion = extractWpVersion(restRes.headers);
        const data = await restRes.json();
        siteName = data.name || '';
        timezone = data.timezoneString || 'UTC';
        restNamespaces = data.namespaces || [];
      } else {
        wpVersion = extractWpVersion(restRes.headers);
      }
    } catch {}

    try {
      const indexRes = await fetch(`${cleanUrl}/wp-json/wp/v2/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (indexRes.ok) {
        const data = await indexRes.json();
        if (data?.namespaces) {
          restNamespaces = [...new Set([...restNamespaces, ...data.namespaces])];
        }
      }
    } catch {}

    let activeTheme: string | undefined;
    try {
      const themesRes = await fetch(`${cleanUrl}/wp-json/wp/v2/themes?per_page=1&status=active`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      if (themesRes.ok) {
        const themes = await themesRes.json();
        if (Array.isArray(themes) && themes.length > 0) {
          activeTheme = themes[0].name?.rendered || themes[0].name || undefined;
        }
      }
    } catch {}

    let siteStats: { posts?: number; pages?: number; users?: number; media?: number } | undefined;
    try {
      const [postsRes, pagesRes, usersRes, mediaRes] = await Promise.allSettled([
        fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=1&_fields=id`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${cleanUrl}/wp-json/wp/v2/pages?per_page=1&_fields=id`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${cleanUrl}/wp-json/wp/v2/users?per_page=1&_fields=id`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${cleanUrl}/wp-json/wp/v2/media?per_page=1&_fields=id`, { signal: AbortSignal.timeout(5000) }),
      ]);

      siteStats = {};

      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const total = postsRes.value.headers.get('X-WP-Total');
        if (total) siteStats.posts = parseInt(total, 10);
      }
      if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
        const total = pagesRes.value.headers.get('X-WP-Total');
        if (total) siteStats.pages = parseInt(total, 10);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const total = usersRes.value.headers.get('X-WP-Total');
        if (total) siteStats.users = parseInt(total, 10);
      }
      if (mediaRes.status === 'fulfilled' && mediaRes.value.ok) {
        const total = mediaRes.value.headers.get('X-WP-Total');
        if (total) siteStats.media = parseInt(total, 10);
      }

      if (Object.keys(siteStats).length === 0) siteStats = undefined;
    } catch {}

    const wpAdminCheck = await fetch(`${cleanUrl}/wp-admin/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok).catch(() => false);

    return NextResponse.json<SiteHealthResponse>({
      success: true,
      health: {
        wpVersion,
        siteName: siteName || 'Sitio WordPress',
        siteUrl: cleanUrl,
        timezone,
        isAccessible,
        hasRestApi,
        restNamespaces,
        serverSoftware,
        phpVersion,
        wordPressPaths: {
          restApiRoot: hasRestApi,
          wpAdmin: wpAdminCheck,
        },
        activeTheme,
        siteStats,
      },
    });
  } catch (error) {
    console.error('Site health error:', error);
    return NextResponse.json<SiteHealthResponse>(
      { success: false, error: 'Error interno al procesar la solicitud' },
      { status: 500 }
    );
  }
}
