# Estado do Projeto - Brazilian Search
Versão atual: 156 (`156_player_hls_config_fixed.html`)
- Corrigido carregamento de `js/config.js` para evitar erro 404 e undefined em API_KEY/BASE_URL.
- Player HLS dinâmico com Cloudflare Worker Proxy (`https://minha-proxy.meucu0108.workers.dev/?url=`) e fallback sequencial.
- Integrado e testado com GitHub Pages e Vercel.
