/**
 * Cloudflare Worker Proxy & Stream Extractor for Brazilian Streaming Hub
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
      // Fetch target provider page to extract .m3u8 or .mp4
      const resp = await fetch(extractUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': new URL(extractUrl).origin
        }
      });
      const html = await resp.text();

      // Simple regex extraction for .m3u8 or .mp4 links in the page
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

  // Standard Proxy endpoint (?url=...)
  if (!targetUrl) {
    return new Response('Brazilian Search Proxy Active. Use ?url=... or ?extract=...', { headers: corsHeaders });
  }

  try {
    const modifiedRequest = new Request(targetUrl, {
      headers: request.headers,
      method: request.method,
      redirect: 'follow'
    });
    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    Object.keys(corsHeaders).forEach(key => {
      newResponse.headers.set(key, corsHeaders[key]);
    });
    return newResponse;
  } catch (e) {
    return new Response('Proxy Error: ' + e.message, { status: 500, headers: corsHeaders });
  }
}
