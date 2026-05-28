// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

interface PluginCheck {
  name: string;
  version: string;
}

interface PluginUpdateResult {
  name: string;
  installedVersion: string;
  latestVersion: string | null;
  status: "updated" | "outdated" | "unknown";
}

const VERSION_CACHE = new Map<string, { version: string; timestamp: number }>();
const CACHE_TTL = 3600000;

async function fetchLatestVersion(slug: string): Promise<string | null> {
  const cached = VERSION_CACHE.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.version;
  }
  const url = `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${encodeURIComponent(slug)}&format=json`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    if (data?.error) return null;
    const version = typeof data?.version === 'string' ? data.version : null;
    if (version) {
      VERSION_CACHE.set(slug, { version, timestamp: Date.now() });
    }
    return version;
  } catch {
    return null;
  }
  return null;
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ\- ]/g, '')
    .replace(/[á]/g, 'a')
    .replace(/[é]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[ó]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const KNOWN_SLUGS: Record<string, string> = {
  'elementor pro': 'elementor',
  'advanced custom fields': 'advanced-custom-fields',
  'acf': 'advanced-custom-fields',
  'woocommerce payments': 'woocommerce',
  'woocommerce': 'woocommerce',
  'rank math seo': 'seo-by-rank-math',
  'rank math': 'seo-by-rank-math',
  'wordfence security': 'wordfence',
  'wordfence': 'wordfence',
  'yoast seo': 'wordpress-seo',
  'contact form 7': 'contact-form-7',
  'jetpack': 'jetpack',
  'wp rocket': 'wp-rocket',
  'wpbakery page builder': 'js_composer',
  'visual composer': 'js_composer',
  'w3 total cache': 'w3-total-cache',
  'wp super cache': 'wp-super-cache',
  'litespeed cache': 'litespeed-cache',
  'akismet': 'akismet',
  'woocommerce subscriptions': 'woocommerce-subscriptions',
  'woocommerce memberships': 'woocommerce-memberships',
  'the events calendar': 'the-events-calendar',
  'event tickets': 'event-tickets',
  'gravity forms': 'gravityforms',
  'ninja forms': 'ninja-forms',
  'wpforms': 'wpforms-lite',
  'redirection': 'redirection',
  'updraftplus': 'updraftplus',
  'backupbuddy': 'backupbuddy',
  'all in one wp migration': 'all-in-one-wp-migration',
  'maintenance': 'maintenance',
  'maintenance switch': 'maintenance',
  'wordpress seo': 'wordpress-seo',
  'elementor': 'elementor',
  'google site kit': 'google-site-kit',
  'site kit': 'google-site-kit',
  'woocommerce product addons': 'woocommerce-product-addons',
  'polylang': 'polylang',
  'wp migrate': 'wp-migrate-db',
  'better search replace': 'better-search-replace',
  'duplicate post': 'duplicate-post',
  'duplicate page': 'duplicate-page',
  'post duplicator': 'post-duplicator',
  'classic editor': 'classic-editor',
  'classic widgets': 'classic-widgets',
  'disable comments': 'disable-comments',
  'really simple ssl': 'really-simple-ssl',
  'limit login attempts': 'limit-login-attempts-reloaded',
  'all in one seo': 'all-in-one-seo-pack',
  'all in one seo pack': 'all-in-one-seo-pack',
  'smush': 'wp-smushit',
  'wp smush': 'wp-smushit',
  'shortpixel': 'shortpixel-image-optimiser',
  'imagify': 'imagify',
  'wp optimize': 'wp-optimize',
  'autoptimize': 'autoptimize',
  'wp fastest cache': 'wp-fastest-cache',
  'sg optimizer': 'sg-cachepress',
  'siteground optimizer': 'sg-cachepress',
  'monsterinsights': 'google-analytics-for-wordpress',
  'google analytics': 'google-analytics-for-wordpress',
  'facebook for woocommerce': 'facebook-for-woocommerce',
  'mailchimp for woocommerce': 'mailchimp-for-woocommerce',
  'klarna payments': 'klarna-payment-gateway',
  'stripe payments': 'stripe',
  'paypal payments': 'paypal-for-woocommerce',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plugins: PluginCheck[] = body.plugins;

    if (!Array.isArray(plugins) || plugins.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere un array de plugins' }, { status: 400 });
    }

    const results: PluginUpdateResult[] = await Promise.all(
      plugins.map(async (plugin) => {
        const lowerName = plugin.name.toLowerCase().trim();
        const cleanName = lowerName.replace(/^(pro|premium)\s+/i, '').replace(/\s+(pro|premium)$/i, '');
        const knownSlug = KNOWN_SLUGS[cleanName] || KNOWN_SLUGS[lowerName] || nameToSlug(plugin.name);
        const latestVersion = await fetchLatestVersion(knownSlug);
        let status: "updated" | "outdated" | "unknown";
        if (latestVersion === null) {
          status = "unknown";
        } else {
          status = latestVersion !== plugin.version ? "outdated" : "updated";
        }
        return {
          name: plugin.name,
          installedVersion: plugin.version,
          latestVersion,
          status,
        };
      })
    );

    return NextResponse.json({ success: true, results });
  } catch {
    return NextResponse.json({ success: false, error: 'Error al verificar actualizaciones' }, { status: 500 });
  }
}
