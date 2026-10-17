// TMDB API Configuration (Example / Template)
const API_KEY = "SUA_CHAVE_TMDB_AQUI";
const BASE_URL = "https://api.themoviedb.org/3";
const LANGUAGE = "pt-BR";

if (typeof module !== 'undefined' && module.exports){
  module.exports = { API_KEY, BASE_URL, LANGUAGE };
}

if (typeof window !== 'undefined'){
  window.API_KEY = API_KEY;
  window.BASE_URL = BASE_URL;
  window.LANGUAGE = LANGUAGE;
}
