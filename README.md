# MC Miaki Coffee · site

Site estático de prospecção para a MC Miaki Coffee (cafés especiais, Chapadão de Ferro, Patrocínio, MG).
Sem build: tudo que vai ao ar está em `dist/`.

- Site antigo: https://mcmiaki.coffee (WordPress de 2021, conteúdo completo mas desatualizado)
- Instagram: https://www.instagram.com/mcmiaki/
- Domínio provisório: https://mcmiaki.achillesmedia.com.br

## Estrutura
- `dist/index.html` página única: abertura (altímetro até 1.250 m), hero com fotos aéreas reais e curvas de nível vivas em canvas, manifesto, terroir (corte do vulcão em 4 etapas pela rolagem), história (linha do tempo horizontal), família, núcleos (gráfico de altitude + ficha técnica), processo da muda à xícara (horizontal), quatro processos, sustentabilidade e selos, prêmios, Cafeeira Porta do Céu, galeria, contato.
- `dist/styles.css` e `dist/app.js` versionados com `?v=N` no HTML. **A cada deploy que mexe em CSS ou JS, suba o N.**
- `dist/assets/img/` fotos reais do acervo do site antigo, redimensionadas (máx. 1800 px).
- `dist/assets/selos/` selos de certificação do site antigo.
- `_raw/` site antigo baixado e originais (fora do git).
- Dados dos núcleos ficam no array `NUCLEOS` do `app.js`.

## Fontes do conteúdo
- Site antigo: história, terroir, fichas dos 6 núcleos, certificações, prêmios até 2020, Cafeeira Porta do Céu.
- Instagram (até 11/2025): endereço novo (Av. Faria Pereira, 4153, Distrito Industrial), prêmio de produtividade do 33º Seminário do Café da ACARPA (2025), agricultura regenerativa com braquiária, irrigação, treinamentos de NR, fauna.

## Validar com o cliente antes de vender
- [ ] Datas da linha do tempo: o site antigo lista Anos 30, Anos 70, 1978, Anos 90, 2000, 2015, 2018 e 2019 sem casar todos os textos. Usei 1935 para a primeira propriedade e 2018 para a Miaki Agronegócios.
- [ ] Área: o texto fala em 2.665 ha de café; a soma das fichas cultivadas dá cerca de 2.418 ha (dados de épocas diferentes).
- [ ] Qual foi o concurso de qualidade de outubro de 2025 citado pela Amanda (entraria em Prêmios).
- [ ] WhatsApp comercial (hoje só telefone fixo e e-mail; o formulário abre o e-mail com a mensagem pronta).
- [ ] Se querem versão em inglês para compradores de fora (o site antigo tinha bandeira dos EUA).
- [ ] Vídeo de drone próprio para o hero (o YouTube deles tem voos; hoje o hero usa fotos aéreas).
