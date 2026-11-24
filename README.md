# MC Miaki Coffee · site

Site institucional da MC Miaki Coffee (cafés especiais, Chapadão de Ferro, Patrocínio, MG), no molde do site do Escritório Eficaz: várias páginas, gerador em Python, sem framework. Em português e inglês (bandeiras no canto superior direito de todas as páginas; a versão em inglês fica em `/en/`).

- No ar: https://mcmiaki.achillesmedia.com.br (GitHub `arthurxavierz/mcmiaki` → Netlify `mcmiaki` → CNAME na Cloudflare, DNS only)
- Site antigo: https://mcmiaki.coffee · Instagram: https://www.instagram.com/mcmiaki/

## Como editar
1. Dados (contato, núcleos, prêmios, galeria, vídeos, links úteis) ficam no topo de `src/build.py`.
2. Textos de cada página ficam em `src/pages/*.html` (português) e `src/pages/en/*.html` (inglês, mesmo nome de arquivo). Os textos que vêm dos dados são traduzidos em `src/i18n_en.py`; o build avisa se faltar tradução.
3. Rode `python src/build.py`. Ele gera `dist/*.html`, `dist/en/*.html` e o `sitemap.xml`, e recusa travessão no texto.
4. Mudou CSS ou JS (`dist/assets/css/style.css`, `dist/assets/js/main.js`)? Suba o `V` no `build.py` e rode de novo.
5. Push na `main` publica no Netlify.

Preview local: config `mcmiaki` (porta 5290) no `.claude/launch.json` da pasta da agência.

## Páginas
Início, Sobre (gestão, terroir com o corte do vulcão, sustentabilidade, certificações, Cafeeira Porta do Céu), História (linha do tempo e prêmios), Fazendas (gráfico de altitude e fichas dos 6 núcleos), Qualidade (4 processamentos e 12 etapas), Fotos e vídeos (galeria com filtro e filmes do YouTube), Certificações (os 5 selos em detalhe, o que garantem e os prêmios) e Contato (canais, formulário que abre o e-mail, mapa).

## Identidade
Tirada da logo: verde `#007947`, grafite e creme. O vermelho fica só na cereja da marca. Anton nos títulos, Geist no texto, Geist Mono em rótulos.

## Mídia
- Vídeos de drone em `dist/assets/video/` são cortes dos filmes do próprio canal da MC Miaki no YouTube (originais em `_raw/yt`, fora do git). O hero junta 5 tomadas (`hero.mp4` 1440 px e `hero-m.mp4` vertical).
- `dist/assets/video/films/{id}.mp4` são recortes mudos de 7 s de cada filme (lista `VIDEOS` no `build.py`), usados como prévia em movimento na sala de filmes da home, nos filmes em destaque (Sobre, História, Qualidade) e na grade de Fotos e vídeos. O clique abre o filme completo do YouTube.
- A animação do hero ("Do grão à muda": semente, palito de fósforo, soldadinho, orelha de onça e muda) é desenhada em código no `main.js`; os textos de cada fase ficam no atributo `data-muda` da home. Para inspecionar uma fase parada, abra `index.html?muda=8` (segundos do ciclo de 16 s).
- Fotos em `dist/assets/img/` vêm do acervo do site antigo.

## Validar com o cliente antes de vender
- [ ] Datas da linha do tempo (o site antigo não casa todas as datas com os textos). Usei 1935 para a primeira propriedade e 2018 para a Miaki Agronegócios.
- [ ] Área: o texto oficial fala em 2.665 ha de café; a soma das fichas cultivadas dá cerca de 2.418 ha (dados de épocas diferentes).
- [ ] Concurso de qualidade de outubro de 2025 citado pela Amanda (entraria em Prêmios).
- [ ] WhatsApp comercial e horário de atendimento (hoje só telefone fixo e e-mail).
- [ ] Fotos da família para os cartões da gestão (hoje usam iniciais).
- [ ] Versão em inglês para compradores de fora.
