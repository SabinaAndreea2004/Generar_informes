// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export interface WordPressPlugin {
  id: string;
  name: string;
  plugin: string;
  status: 'active' | 'inactive';
  version: string;
  description: {
    rendered: string;
  };
  author: string;
  author_uri: string;
  text_domain: string;
  requires_wp: string;
  requires_php: string;
  update?: {
    new_version: string;
    package: string;
    slug: string;
  };
}

export interface PluginResponse {
  success: boolean;
  plugins?: Array<{
    id: string;
    name: string;
    version: string;
    status: 'active' | 'inactive';
    hasUpdate: boolean;
    newVersion?: string;
    author: string;
    description: string;
  }>;
  error?: string;
  errorType?: 'connection' | 'authentication' | 'not_wordpress' | 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wpUrl = searchParams.get('wpUrl');
    const wpUsername = searchParams.get('wpUsername');
    const wpAppPassword = searchParams.get('wpAppPassword');
    const authToken = searchParams.get('authToken');

    if (!wpUrl) {
      return NextResponse.json<PluginResponse>(
        { success: false, error: 'Se requiere la URL de WordPress', errorType: 'unknown' },
        { status: 400 }
      );
    }

    if ((!wpUsername || !wpAppPassword) && !authToken) {
      return NextResponse.json<PluginResponse>(
        { success: false, error: 'Se requieren credenciales de autenticación', errorType: 'authentication' },
        { status: 400 }
      );
    }

    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/$/, '');

    let authHeader: string;
    if (authToken) {
      authHeader = `Basic ${authToken}`;
    } else {
      authHeader = `Basic ${Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')}`;
    }

    let response: Response;
    try {
      response = await fetch(`${cleanUrl}/wp-json/wp/v2/plugins?context=edit&per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      });
    } catch (fetchError) {
      const error = fetchError as Error;
      
      if (error.name === 'AbortError') {
        return NextResponse.json<PluginResponse>(
          { success: false, error: 'Tiempo de espera agotado al conectar con el sitio', errorType: 'connection' },
          { status: 504 }
        );
      }

      return NextResponse.json<PluginResponse>(
        { success: false, error: 'No se pudo conectar con el sitio WordPress. Verifica la URL.', errorType: 'connection' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json<PluginResponse>(
          { success: false, error: 'Credenciales inválidas. Verifica el Application Password.', errorType: 'authentication' },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json<PluginResponse>(
          { success: false, error: 'Permisos insuficientes. El usuario necesita capacidad de manage_plugins.', errorType: 'authentication' },
          { status: 403 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json<PluginResponse>(
          { success: false, error: 'No se encontró la API REST de WordPress. Verifica que la URL sea correcta.', errorType: 'not_wordpress' },
          { status: 404 }
        );
      }

      let errorMessage = `Error del servidor: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {}

      return NextResponse.json<PluginResponse>(
        { success: false, error: errorMessage, errorType: 'unknown' },
        { status: response.status }
      );
    }

    let pluginsData: WordPressPlugin[];
    try {
      pluginsData = await response.json();
    } catch (parseError) {
      return NextResponse.json<PluginResponse>(
        { success: false, error: 'Respuesta inválida de WordPress. El sitio puede no ser un WordPress válido.', errorType: 'not_wordpress' },
        { status: 500 }
      );
    }

    if (!Array.isArray(pluginsData)) {
      return NextResponse.json<PluginResponse>(
        { success: false, error: 'Formato de respuesta inesperado', errorType: 'not_wordpress' },
        { status: 500 }
      );
    }

    const activeFirst = [...pluginsData].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (a.update && !b.update) return -1;
      if (!a.update && b.update) return 1;
      return a.name.localeCompare(b.name);
    });

    const normalizedPlugins = activeFirst.map((plugin) => ({
      id: plugin.plugin,
      name: plugin.name,
      version: plugin.version,
      status: plugin.status as 'active' | 'inactive',
      hasUpdate: !!plugin.update,
      newVersion: plugin.update?.new_version,
      author: plugin.author.replace(/<[^>]*>/g, '').trim(),
      description: plugin.description?.rendered?.replace(/<[^>]*>/g, '').trim().substring(0, 150) || '',
    }));

    return NextResponse.json<PluginResponse>({
      success: true,
      plugins: normalizedPlugins,
    });
  } catch (error) {
    console.error('WordPress API Error:', error);
    return NextResponse.json<PluginResponse>(
      { success: false, error: 'Error interno al procesar la solicitud', errorType: 'unknown' },
      { status: 500 }
    );
  }
}
