# MC Miaki Coffee · site

Site institucional da MC Miaki Coffee (cafés especiais, Chapadão de Ferro, Patrocínio, MG), no molde do site do Escritório Eficaz: várias páginas, gerador em Python, sem framework.

- No ar: https://mcmiaki.achillesmedia.com.br (GitHub `arthurxavierz/mcmiaki` → Netlify `mcmiaki` → CNAME na Cloudflare, DNS only)
- Site antigo: https://mcmiaki.coffee · Instagram: https://www.instagram.com/mcmiaki/

## Como editar
1. Dados (contato, núcleos, prêmios, galeria, vídeos, links úteis) ficam no topo de `src/build.py`.
2. Textos de cada página ficam em `src/pages/*.html`.
3. Rode `python src/build.py`. Ele gera `dist/*.html` e o `sitemap.xml`, e recusa travessão no texto.
4. Mudou CSS ou JS (`dist/assets/css/style.css`, `dist/assets/js/main.js`)? Suba o `V` no `build.py` e rode de novo.
5. Push na `main` publica no Netlify.

Preview local: config `mcmiaki` (porta 5290) no `.claude/launch.json` da pasta da agência.

## Páginas
Início, Sobre (gestão, terroir com o corte do vulcão, sustentabilidade, certificações, Cafeeira Porta do Céu), História (linha do tempo e prêmios), Fazendas (gráfico de altitude e fichas dos 6 núcleos), Qualidade (4 processamentos e 12 etapas), Fotos e vídeos (galeria com filtro e filmes do YouTube), Links úteis (busca e filtro) e Contato (canais, formulário que abre o e-mail, mapa).

## Identidade
Tirada da logo: verde `#007947`, grafite e creme. O vermelho fica só na cereja da marca. Anton nos títulos, Geist no texto, Geist Mono em rótulos.

## Mídia
- Vídeos de drone em `dist/assets/video/` são cortes dos filmes do próprio canal da MC Miaki no YouTube (originais em `_raw/yt`, fora do git). O hero junta 5 tomadas (`hero.mp4` 1440 px e `hero-m.mp4` vertical).
- Fotos em `dist/assets/img/` vêm do acervo do site antigo.

## Validar com o cliente antes de vender
- [ ] Datas da linha do tempo (o site antigo não casa todas as datas com os textos). Usei 1935 para a primeira propriedade e 2018 para a Miaki Agronegócios.
- [ ] Área: o texto oficial fala em 2.665 ha de café; a soma das fichas cultivadas dá cerca de 2.418 ha (dados de épocas diferentes).
- [ ] Concurso de qualidade de outubro de 2025 citado pela Amanda (entraria em Prêmios).
- [ ] WhatsApp comercial e horário de atendimento (hoje só telefone fixo e e-mail).
- [ ] Fotos da família para os cartões da gestão (hoje usam iniciais).
- [ ] Versão em inglês para compradores de fora.
