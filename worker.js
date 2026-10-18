/**
 * Cloudflare Worker Proxy & Stream Extractor with Header Injection & CORS
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  const extractUrl = url.searchParams.get('extract');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Stream Extractor endpoint
  if (extractUrl) {
    try {
      const parsedTarget = new URL(extractUrl);
      const resp = await fetch(extractUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': parsedTarget.origin + '/',
          'Origin': parsedTarget.origin
        }
      });
      const html = await resp.text();

      const m3u8Match = html.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
      const mp4Match = html.match(/https?:\/\/[^"']+\.mp4[^"']*/);

      const finalStream = m3u8Match ? m3u8Match[0] : (mp4Match ? mp4Match[0] : extractUrl);

      return new Response(JSON.stringify({ url: finalStream, original: extractUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ url: extractUrl, error: err.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Standard Proxy endpoint (?url=...) with header injection
  if (!targetUrl) {
    return new Response('Brazilian Search Proxy Active. Use ?url=... or ?extract=...', { headers: corsHeaders });
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const modifiedRequest = new Request(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': parsedTarget.origin + '/',
        'Origin': parsedTarget.origin,
        'Accept': '*/*'
      },
      method: request.method,
      redirect: 'follow'
    });

    const response = await fetch(modifiedRequest);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    });

    return newResponse;
  } catch (e) {
    return new Response('Proxy Error: ' + e.message, { status: 500, headers: corsHeaders });
  }
}

// force sync 1792286181.3589003