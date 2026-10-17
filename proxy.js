/**
 * Stream Proxy Server (Node.js)
 * Proxies .m3u8 and .ts requests, injecting Referer and Origin headers to bypass CORS and 403 blocks.
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const targetUrl = parsedUrl.query.url;

    if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing ?url= parameter');
        return;
    }

    try {
        const targetParsed = new URL(targetUrl);
        const client = targetParsed.protocol === 'https:' ? https : http;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `${targetParsed.protocol}//${targetParsed.hostname}/`,
            'Origin': `${targetParsed.protocol}//${targetParsed.hostname}`,
            'Accept': '*/*'
        };

        const proxyReq = client.request(targetUrl, { method: 'GET', headers }, (proxyRes) => {
            // Rewrite absolute/relative URLs in .m3u8 manifests so segment requests also go through proxy
            let contentType = proxyRes.headers['content-type'] || '';
            
            if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl')) {
                let data = '';
                proxyRes.on('data', chunk => data += chunk);
                proxyRes.on('end', () => {
                    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                    const rewritten = data.split('\n').map(line => {
                        line = line.trim();
                        if (!line || line.startsWith('#')) {
                            // Check for URI inside tags like #EXT-X-MAP or #EXT-X-KEY
                            if (line.includes('URI="')) {
                                return line.replace(/URI="([^"]+)"/, (match, uri) => {
                                    let absoluteUri = uri.startsWith('http') ? uri : new URL(uri, baseUrl).href;
                                    return `URI="http://localhost:3001/proxy?url=${encodeURIComponent(absoluteUri)}"`;
                                });
                            }
                            return line;
                        }
                        // Segment URL
                        let absoluteUri = line.startsWith('http') ? line : new URL(line, baseUrl).href;
                        return `http://localhost:3001/proxy?url=${encodeURIComponent(absoluteUri)}`;
                    }).join('\n');

                    res.writeHead(proxyRes.statusCode, {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(rewritten);
                });
            } else {
                // Stream binary chunks (.ts, etc.) directly
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            }
        });

        proxyReq.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy Error: ' + err.message);
        });

        proxyReq.end();
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid target URL: ' + e.message);
    }
});

server.listen(PORT, () => {
    console.log(`Stream Proxy running on http://localhost:${PORT}`);
});
