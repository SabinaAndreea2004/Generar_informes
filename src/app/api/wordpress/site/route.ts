// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export interface SiteInfo {
  name: string;
  description: string;
  url: string;
  home: string;
  timezoneString: string;
  gmtOffset: number;
  namespaces: string[];
  authentication: {
    rest: {
      supported: string[];
    };
  };
}

export interface SiteCheckResponse {
  success: boolean;
  siteInfo?: {
    name: string;
    description: string;
    url: string;
    timezone: string;
    isAccessible: boolean;
    hasRestApi: boolean;
    wpVersion: string;
  };
  error?: string;
  errorType?: 'connection' | 'not_wordpress' | 'unknown';
}

function extractWpVersion(headers: Headers): string {
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    const match = poweredBy.match(/WordPress\/([\d.]+)/i);
    if (match) return match[1];
  }
  return 'Desconocida';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get('wpUrl');

    if (!wpUrl) {
      return NextResponse.json<SiteCheckResponse>(
        { success: false, error: 'Se requiere la URL de WordPress', errorType: 'unknown' },
        { status: 400 }
      );
    }

    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/wp-json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      });
    } catch (fetchError) {
      const error = fetchError as Error;
      
      if (error.name === 'AbortError') {
        return NextResponse.json<SiteCheckResponse>(
          { success: false, error: 'Tiempo de espera agotado', errorType: 'connection' },
          { status: 504 }
        );
      }

      try {
        const headResponse = await fetch(cleanUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        });
        
        if (headResponse.ok) {
          const wpVersion = extractWpVersion(headResponse.headers);
          return NextResponse.json<SiteCheckResponse>({
            success: true,
            siteInfo: {
              name: 'Sitio WordPress',
              description: '',
              url: cleanUrl,
              timezone: 'UTC',
              isAccessible: true,
              hasRestApi: false,
              wpVersion: wpVersion,
            },
          });
        }
      } catch {}

      return NextResponse.json<SiteCheckResponse>(
        { success: false, error: 'No se pudo conectar con el sitio. Verifica la URL.', errorType: 'connection' },
        { status: 502 }
      );
    }

    const wpVersion = extractWpVersion(response.headers);

    if (!response.ok) {
      return NextResponse.json<SiteCheckResponse>({
        success: true,
        siteInfo: {
          name: 'Sitio WordPress',
          description: '',
          url: cleanUrl,
          timezone: 'UTC',
          isAccessible: true,
          hasRestApi: false,
          wpVersion,
        },
      });
    }

    let siteData: SiteInfo | null = null;
    try {
      siteData = await response.json();
    } catch {
      return NextResponse.json<SiteCheckResponse>({
        success: true,
        siteInfo: {
          name: 'Sitio WordPress',
          description: '',
          url: cleanUrl,
          timezone: 'UTC',
          isAccessible: true,
          hasRestApi: true,
          wpVersion,
        },
      });
    }

    return NextResponse.json<SiteCheckResponse>({
      success: true,
      siteInfo: {
        name: siteData.name || 'Sitio WordPress',
        description: siteData.description || '',
        url: siteData.url || cleanUrl,
        timezone: siteData.timezoneString || 'UTC',
        isAccessible: true,
        hasRestApi: true,
        wpVersion,
      },
    });
  } catch (error) {
    console.error('Site check error:', error);
    return NextResponse.json<SiteCheckResponse>(
      { success: false, error: 'Error interno al procesar la solicitud', errorType: 'unknown' },
      { status: 500 }
    );
  }
}
