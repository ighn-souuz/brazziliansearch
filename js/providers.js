/**
 * Provedores de streaming baseados em TMDb com foco em PT-BR (Dublado)
 */
const providers = [
  {
    id: 'superflix',
    label: 'SuperFlix API',
    resolve: async function (tmdbId, type, season = 1, episode = 1) {
      const baseUrl = type === 'movie' 
        ? `https://superflixapi.top/filme/${tmdbId}`
        : `https://superflixapi.top/serie/${tmdbId}/${season}/${episode}`;
      
      try {
        const response = await fetch(baseUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            const url = data.url || data.stream_url || data.video_url || data.m3u8;
            if (url) return url;
          } else {
            const text = await response.text();
            const match = text.match(/https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/);
            if (match) return match[0];
          }
        }
      } catch (e) {
        console.warn('SuperFlix API falhou:', e);
      }
      return null;
    }
  },
  {
    id: 'embedder',
    label: 'WarezCDN / Embedder',
    resolve: async function (tmdbId, type, season = 1, episode = 1) {
      const baseUrl = type === 'movie'
        ? `https://embedder.net/e/movie?tmdb=${tmdbId}&lang=pt`
        : `https://embedder.net/e/tv?tmdb=${tmdbId}&sea=${season}&epi=${episode}&lang=pt`;
      
      try {
        const response = await fetch(baseUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const match = html.match(/src="([^"]+\.m3u8[^"]*)"/) || html.match(/'([^']+\.m3u8[^']*)'/) || html.match(/https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/);
          if (match) return match[1] || match[0];
        }
      } catch (e) {
        console.warn('WarezCDN / Embedder falhou:', e);
      }
      return null;
    }
  },
  {
    id: 'vidsrc2embed',
    label: 'Vidsrc / 2Embed BR Fallback',
    resolve: async function (tmdbId, type, season = 1, episode = 1) {
      const baseUrl = type === 'movie'
        ? `https://2embed.cc/embed/movie/${tmdbId}`
        : `https://2embed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      
      try {
        const response = await fetch(baseUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const match = html.match(/src="([^"]+\.m3u8[^"]*)"/) || html.match(/'([^']+\.m3u8[^']*)'/) || html.match(/https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/);
          if (match) return match[1] || match[0];
        }
      } catch (e) {
        console.warn('2Embed Fallback falhou:', e);
      }
      return null;
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = providers;
}
if (typeof window !== 'undefined') {
  window.providers = providers;
}
