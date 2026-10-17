/**
 * Cloudflare Worker Proxy for HLS Streams (.m3u8 and .ts)
 * Bypasses CORS and injects Referer/Origin headers for media providers.
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const urlObj = new URL(request.url);
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  const targetUrl = urlObj.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  try {
    const targetParsed = new URL(targetUrl);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': `${targetParsed.protocol}//${targetParsed.hostname}/`,
      'Origin': `${targetParsed.protocol}//${targetParsed.hostname}`,
      'Accept': '*/*'
    };

    const upstreamResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: headers
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';
    
    // If it's an .m3u8 manifest, rewrite internal URIs to go through this worker proxy
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl')) {
      let text = await upstreamResponse.text();
      const workerBase = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewritten = text.split('\n').map(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) {
          if (line.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
              const absUri = uri.startsWith('http') ? uri : new URL(uri, baseUrl).href;
              return `URI="${workerBase}?url=${encodeURIComponent(absUri)}"`;
            });
          }
          return line;
        }
        const absUri = line.startsWith('http') ? line : new URL(line, baseUrl).href;
        return `${workerBase}?url=${encodeURIComponent(absUri)}`;
      }).join('\n');

      return new Response(rewritten, {
        status: upstreamResponse.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Binary stream (.ts segments, etc.)
    const newHeaders = new Headers(upstreamResponse.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: newHeaders
    });

  } catch (err) {
    return new Response('Proxy Error: ' + err.message, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
