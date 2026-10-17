# ESTADO DO PROJETO - Brazilian Search

Atualizado: 2026-10-10 18:46
Arquivo atual: `155_player_hls_stream_dinamico.html` (v155)

### Novo Módulo Proxy:

- `proxy.js` — Módulo proxy Node.js para requisições HLS (.m3u8 e .ts), injetando cabeçalhos de Referer e Origin automaticamente para evitar loops de CORS e erros 403.
- `js/player.js` — Atualizado com `xhrSetup` direcionando o tráfego Hls.js para o proxy local (`http://localhost:3001/proxy`).


### Versão Atual:

- `155_player_hls_stream_dinamico.html` - ATUAL, sistema dinâmico de resolução de streams HLS (.m3u8) dubladas (PT-BR) via TMDb ID com fallback em sequência (SuperFlix, WarezCDN/Embedder, Vidsrc/2Embed) e Hls.js.


Arquivo anterior: `115_menu_vermelho_sem_bordas.html` (92793 bytes, md5 b031992b5dfbd6c401c558c79b8645ec)

## ONDE ESTAMOS

Ordem de entrega (numero = ordem; NUNCA editar versao antiga, gerar proxima):
- `113_detalhe_producao_status_duracao_fix.html` - detalhe producao/status/duracao
- `114_doar_meta_versiculo_fix.html` - adicionou meta de doacao + versiculo (BASE)
- `115_menu_vermelho_sem_bordas.html` - ATUAL, aprovado, navegador real sem erro

### Mudancas reais de `115` (medidas no navegador, nao chute)

1. **Menu 3 barras centralizado.** `.ib-menu` = 36x36 px, fixo em (16,16), z-index 145,
   `display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px`.
   Barras com centros em y = 20 / 34 / 48; centro do botao = 34 = centro das barras.
   As regras `translateY(+/-6px)` que desalinhavam foram removidas.
2. **`#btnDonate` vermelho, sem moldura.** `linear-gradient(135deg,#e11d2e,#b3121f)`,
   `border:0px`, `color:#fff`, hover com sombra vermelha (nao neon dourado).
3. **Meta de doacao REMOVIDA por completo (estrutural, nao display:none).**
   Zerados: `#dmMeta`, `.dm-meta`, `.dm-meta-bar`, `META_KEY`, `donateMeta`,
   `fmtBRL`, `saveDonateMeta`, `addDonation`, `renderDonateMeta`, `registerDonation`,
   `case 'donateAdd'`, `META_DEFAULT`, texto `Meta do projeto`, `bs_donate_meta_v1`.
   Nada mais e gravado em localStorage para a meta.
4. **Molduras de botao removidas.** `border:0` em `.dm-opt` (PIX/QRCode/Cartao/Cripto),
   `.dm-btn`, `.dm-verse`, `.dm-pane`, `.readonly`, `.dm-row`, `.dm-pending`,
   `.dm-note`, `.dm-sub`. `border-radius` 13px foi MANTIDO de proposito:
   arredonda o botao, nao cria moldura. Removido tambem `.dm-opt:hover{border-color}`.

### Preservado (nao mexer)

- Versiculo `#dmVerse`: "Tudo posso Cristo, que fortalece." / "Filipenses 4:13".
  Agora DENTRO de `.dm-bx` (antes faltava um `</div>` e ficava fora do modal).
  Marcador `.vs-mark` presente, `border:0`, sem icone decorativo `<span class="ic">`.
- 4 metodos de doacao: `pix`, `qrcode`, `card`, `crypto` - todos navegam e renderizam.
- Sidebar: ciclo `left -330 -> 0`, vira X quando aberto.
- `data-act` ativos: home, cat, goSearch, amoled, side, list, surprise, clear,
  open, watch, srTab, legal, closeDetail, donate, donateClose, donateTab.

## PENDENCIAS (nao pedidas ainda)

1. **Nao e AMOLED puro.** `getComputedStyle(document.body).backgroundColor` =
   `rgb(12, 17, 27)`, nao `#000000`. Se pedirem AMOLED preto puro, mexer nas variaveis
   `--bg`, `--card`, `--line` em UM unico patch, nunca reescrever o CSS inteiro.
2. **Credencial no arquivo.** Existe `API_KEY` embutida em `115`. Nunca logar, nunca colar
   em chat, nunca gravar em nota. Sempre `[REDACTED]`.
3. Bordas restantes em `header`, `.side`, `.footer` sao divisórias de LAYOUT, nao moldura
   de botao. Nao remover sem o usuario pedir (regressao).

## COMO VERIFICAR

```
# 1. sintaxe dos scripts inline ANTES do navegador
python C:\Users\souuz\AppData\Local\hermes\skills\software-development\frontend-artifact-delivery\scripts\check_inline_js.py 115_menu_vermelho_sem_bordas.html

# 2. abrir via file:// (localhost desativado neste projeto) e rodar no console:
```

```js
window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));
const m=document.querySelector('.ib-menu').getBoundingClientRect();
[...document.querySelectorAll('.ib-menu i')].map(x=>{const r=x.getBoundingClientRect();
  return Math.round(r.y+r.height/2);});
const b=getComputedStyle(document.getElementById('btnDonate'));
console.log(b.backgroundImage,b.borderTopWidth,b.boxShadow);
console.log(!!document.getElementById('dmMeta'),localStorage.getItem('bs_donate_meta_v1'));
console.log(document.querySelector('#dmVerse .vs-txt').textContent);
```

## PROXIMA SESSAO - prompt pronto pra colar

---

Continuo no projeto Brazilian Search (pasta `C:\projetos\brazilian search`).
Arquivo atual aprovado: `115_menu_vermelho_sem_bordas.html`.
NUNCA editar versao antiga: cada mudanca gera arquivo novo `116_...`, `117_...`.
Este arquivo tem:
  - menu 3 barras fixo 36x36 (16,16) centralizado (flex column, gap 4px)
  - `#btnDonate` vermelho (#e11d2e -> #b3121f), border 0, sem moldura
  - meta de doacao REMOVIDA por completo (HTML/CSS/JS/localStorage)
  - molduras de botao removidas (border-radius 13px mantido)
  - versiculo "Filipenses 4:13" preservado DENTRO do modal
  - 4 metodos de doacao: pix, qrcode, card, crypto
Leia `115` antes de mexer. Leia `_estado/ESTADO_PROJETO.md` se eu falar "estado do projeto".
Minhas regras: arquivo novo a cada revisao, "nada mais muda na pagina", nenhuma
credencial fora de `[REDACTED]`. Verifica no navegador antes de entregar
(so me mande quando funcionar 100%).

---

## O QUE JA FALHOU (nao repetir)

- **Nao editar `114` nem `113`.** So novas revisoes.
- **Anchor literal multilinha quebra** (CRLF + indentacao). Use predicate por LINHA
  (`x.strip().startswith(".ib-menu{")`), nao string multi-linha.
- **`patch` tool come espacos** em scripts Python. Escreva sempre com `write_file`,
  arquivo NOVO com nome NOVO (write_file recusa sobrescrever sem re-leitura).
- **Resultado de tool que parece corrompido** (`constMETA_KEY`, `solidvar(`, `media(`
  sem `@`) e SO APRESENTACAO de render. Confirme byte-level: `repr()`,
  `.encode("unicode_escape")`, contagem literal. `node --check` e a fonte da verdade.
  NAO "conserte" arquivo que esta bom - isso introduzia bug real.
- **Gerador Python via heredoc no bash falha** em aspas/unicode. Use `write_file`.

## UTILITARIOS (scratch)

- `b115v2.py` - builder que gerou `115`. Funciona; copiar para gerar a proxima revisao.
- `sc115.py` - extrai scripts inline de um html para `s115.N.js` (roda `node --check`).
- `v115.py` / `v115b.py` - auditoria de bordas / versiculo / estrutura.
- `b115.txt` / `v115.txt` / `v115b.txt` - relatorios da ultima build.
