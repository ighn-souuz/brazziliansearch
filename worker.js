/**
 * Cloudflare Worker Proxy for HLS Streams and TMDb API with secure API Key injection
 */
const TMDB_API_KEY = "9682b1ce677951d528cfd7ea0d9e642a";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const urlObj = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  let targetUrl = urlObj.searchParams.get('url');
  if (!targetUrl && urlObj.pathname.startsWith('/3/')) {
    targetUrl = 'https://api.themoviedb.org' + urlObj.pathname + urlObj.search;
  }

  // If requesting TMDb API directly without key or via proxy, ensure API key is present
  if (targetUrl && targetUrl.includes('api.themoviedb.org')) {
    if (!targetUrl.includes('api_key=')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}api_key=${TMDB_API_KEY}`;
    }
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing ?url= or /3/ path" }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl'
        }
      });
    }

    const newHeaders = new Headers(upstreamResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: newHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
