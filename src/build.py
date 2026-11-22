"""
Gera o site da MC Miaki Coffee a partir de src/pages/*.html para dist/.

Cada página começa com um comentário de metadados:
<!--meta {"title": "...", "description": "...", "nav": "sobre", "theme": "dark"} -->

Marcadores disponíveis dentro das páginas:
  {{ARROW}}             seta dos botões
  {{ICON:nome}}         ícone (phone, mail, instagram, facebook, youtube, pin, route, up, play, close, leaf, drop, sun, shield, search)
  {{NUCLEOS_LISTA}}     lista de núcleos com prévia de foto (home)
  {{NUCLEOS_FICHAS}}    fichas completas dos seis núcleos (página Fazendas)
  {{NUCLEOS_NAV}}       índice lateral dos núcleos
  {{ALTITUDES}}         gráfico de altitude dos núcleos
  {{PREMIOS}}           lista de prêmios
  {{SELOS}}             selos de certificação
  {{GALERIA}}           galeria completa com filtros
  {{VIDEOS}}            vídeos do YouTube da fazenda
  {{LINKS}}             links úteis com busca e filtros
  {{CANAIS}}            grade de canais de contato
  {{MAPA}}              mapa com botões de rota

Uso:  python src/build.py
"""
import json
import pathlib
import re
from urllib.parse import quote_plus

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "pages"
OUT = ROOT / "dist"
SITE = "https://mcmiaki.achillesmedia.com.br"
V = "2"  # versão dos arquivos estáticos; aumente a cada publicação de CSS ou JS

# ------------------------------------------------------------------
# Dados da empresa. Altere aqui e rode o build de novo.
# ------------------------------------------------------------------
EMPRESA = {
    "nome": "MC Miaki Coffee",
    "telefone": "(34) 3831-1481",
    "tel": "+553438311481",
    "email": "contato@mcmiaki.coffee",
    "rua": "Av. Faria Pereira, 4153, Distrito Industrial",
    "cidade": "Patrocínio, MG",
    "cep": "38740-000",
    "q": "Av. Faria Pereira, 4153, Distrito Industrial, Patrocínio, MG, 38740-000",
    "instagram": "https://www.instagram.com/mcmiaki/",
    "instagram_user": "@mcmiaki",
    "facebook": "https://facebook.com/mcmiaki",
    "youtube": "https://www.youtube.com/channel/UCtDmdTN7999k68x99sFEefA",
}

NAV = [
    ("index", "Início", "index.html", False),
    ("sobre", "Sobre", "sobre.html", True),
    ("historia", "História", "historia.html", True),
    ("fazendas", "Fazendas", "fazendas.html", True),
    ("qualidade", "Qualidade", "qualidade.html", True),
    ("fotos", "Fotos e vídeos", "fotos.html", True),
    ("links", "Links úteis", "links-uteis.html", True),
    ("contato", "Contato", "contato.html", False),
]

# Fichas técnicas dos núcleos (fonte: site institucional antigo)
NUCLEOS = [
    {"id": "porta-do-ceu", "nome": "Porta do Céu", "regiao": "Chapadão de Ferro", "foto": "porta-do-ceu",
     "faz": ["Fazenda Chapadão de Ferro", "Fazenda Porta do Céu"], "alt": (1170, 1235), "total": "465,2", "cult": "333",
     "prod": "35", "var": "Catuaí 99, IAC, IBC 12, Topázio, Mundo Novo e outras", "colheita": "85% mecanizada, 15% manual",
     "proc": (5, 70, 25), "proc_txt": None, "sec": "Parte em terreiro, parte no secador",
     "texto": "Coração do grupo, no alto do Chapadão. É daqui que vem boa parte dos lotes de cereja descascado."},
    {"id": "recanto", "nome": "Recanto", "regiao": "Chapadão de Ferro", "foto": "arco-iris",
     "faz": ["Fazenda Nossa Senhora de Fátima", "Fazenda Nossa Senhora Aparecida", "Fazenda Recanto"], "alt": (1250, 1250),
     "total": "538,31", "cult": "493", "prod": "35", "var": "Icatu, Tupi, Catuaí, Mundo Novo e outras",
     "colheita": "97,8% mecanizada, 2,2% manual", "proc": (1, 46, 53), "proc_txt": None, "sec": "Parte em terreiro, parte no secador",
     "texto": "O ponto mais alto do grupo, a 1.250 metros. Finalista do Prêmio Região do Cerrado Mineiro com cereja descascado."},
    {"id": "shalom", "nome": "Shalom", "regiao": "Chapadão de Ferro", "foto": "sao-matheus",
     "faz": ["Fazenda Centenário", "Fazenda Shalom", "Fazenda São Matheus"], "alt": (1200, 1200), "total": "732,05",
     "cult": "610,06", "prod": "35", "var": "Catuaí 99, Catuaí 62, Catuaí, Topázio, Mundo Novo, IBC 12 e outras",
     "colheita": "100% mecanizada", "proc": (0, 80, 20), "proc_txt": None, "sec": "Parte em terreiro, parte no secador",
     "texto": "O maior núcleo em área cultivada. Finalista do Prêmio Região do Cerrado Mineiro na categoria Natural."},
    {"id": "abadia", "nome": "Abadia", "regiao": "Tejuco · Cerrado Mineiro", "foto": "abadia",
     "faz": ["Fazenda Abadia I", "Fazenda Abadia II", "Fazenda Abadia III"], "alt": (980, 1050), "total": "234,98",
     "cult": "196", "prod": "40", "var": "Topázio e outras", "colheita": "100% mecanizada", "proc": None,
     "proc_txt": "Natural, cereja descascado e despolpado", "sec": "Parte em terreiro, parte no secador",
     "texto": "Na região do Tejuco, com plantio feito em sulcos abertos com GPS e produtividade média de 40 sacas por hectare."},
    {"id": "bom-jardim", "nome": "Bom Jardim", "regiao": "Cerrado Mineiro", "foto": "bom-jardim",
     "faz": ["Fazenda Bom Jardim"], "alt": (900, 996), "total": "380", "cult": "285", "prod": None,
     "var": "Catuaí 62, Catuaí 144, Catuaí 99, Guará, Topázio, Arara, Castillo, IBC 12 e outras", "colheita": "Manual",
     "proc": None, "proc_txt": None, "sec": None,
     "texto": "Colheita feita à mão, fruto a fruto. Também é o campo das variedades novas, como a colombiana Castillo."},
    {"id": "lajinha", "nome": "Lajinha", "regiao": "Lajinha · Cerrado Mineiro", "foto": "lajinha",
     "faz": ["Fazenda São José", "Fazendas Santos Reis I, II e III", "Fazenda Lajinha", "Fazenda Nossa Senhora da Guia"],
     "alt": (850, 914), "total": "851,56", "cult": "501", "prod": "40",
     "var": "Catuaí 99, Catuaí 62, Catuaí 144, Topázio, Mundo Novo, IBC 12, Acaiá, Acauã e outras",
     "colheita": "100% mecanizada", "proc": (9, 0, 91), "proc_txt": None, "sec": "Parte em terreiro, parte no secador",
     "texto": "Seis fazendas reunidas no maior núcleo em área total. Quase toda a produção sai despolpada."},
]
PROC = [("Natural", "#b98a3e"), ("Cereja descascado", "#0a7a48"), ("Despolpado", "#7fb28f")]

PREMIOS = [
    ("2025", "33º Seminário do Café · ACARPA", "3º lugar no Prêmio Produtividade em duas categorias: sequeiro (116 sc/ha) e irrigado (104 sc/ha).", "2× 3º", "cerejas-terreiro"),
    ("2020", "illy · Fornecedor Sustentável do Ano", "Reconhecimento à cafeicultura sustentável praticada em todos os núcleos.", "Destaque", "illy-1"),
    ("2012 a 2020", "Prêmio Ernesto Illy de Qualidade", "Finalista em 8 edições: 2012, 2013, 2014, 2015, 2016, 2018, 2019 e 2020.", "8×", "degusta-2"),
    ("2013", "Prêmio Ernesto Illy de Qualidade", "Campeão nacional.", "1º", "xicara"),
    ("Safra 2017/18", "V Prêmio Região do Cerrado Mineiro", "Núcleo Recanto finalista na categoria Cereja Descascado.", "Finalista", "cerrado-premio"),
    ("Safra 2015/16", "III Prêmio Região do Cerrado Mineiro", "Núcleo Shalom finalista na categoria Natural.", "Finalista", "shalom"),
]

SELOS = [
    ("logo-rainforest", "Rainforest Alliance", "Fazendas certificadas"),
    ("logo-AAA", "Nespresso AAA", "Programa de qualidade sustentável"),
    ("logo-CAFE", "C.A.F.E. Practices", "Starbucks"),
    ("logo-UTZ", "UTZ Certified", "Hoje parte da Rainforest Alliance"),
    ("logo-cerrado", "Região do Cerrado Mineiro", "Denominação de origem"),
]

# Galeria: (arquivo, categoria, legenda, formato) formato: "" | "alta" | "larga"
GALERIA = [
    ("aereo-chapadao", "aereas", "Cafezais do Chapadão de Ferro vistos de cima", "larga"),
    ("muda-ceu", "lavoura", "Muda nova em solo vermelho", "alta"),
    ("flor-2", "florada", "Flor do café", ""),
    ("graos-maduros", "colheita", "Galho carregado de cerejas maduras", ""),
    ("arco-iris", "lavoura", "Arco-íris sobre a Fazenda Recanto", "larga"),
    ("colheita-noite", "colheita", "Colhedora trabalhando ao entardecer", "alta"),
    ("terreiro", "pos", "Secagem em terreiro", ""),
    ("aereo-terreiro", "aereas", "Terreiros e instalações vistos de cima", "larga"),
    ("florada", "florada", "Florada branca do cafeeiro", "alta"),
    ("peneira", "colheita", "Abanação na peneira", ""),
    ("blends", "pos", "Prova de xícara na criação de blends", ""),
    ("gps-1", "aereas", "Sulcos de plantio abertos com GPS", "larga"),
    ("marcos", "pessoas", "Marcos Cézar Miaki na lavoura", "alta"),
    ("graos-verdes", "lavoura", "Grãos verdes em granação", ""),
    ("ponto", "colheita", "Cerejas no ponto ideal de colheita", ""),
    ("rebeneficio", "pos", "Rebenefício e seleção de grãos", ""),
    ("mirante", "lavoura", "Mirante com vista para os cafezais", ""),
    ("aereo-lagoa", "aereas", "Reservatório entre os cafezais", ""),
    ("botao", "florada", "Botões florais", ""),
    ("treinamento", "pessoas", "Capacitação da equipe", ""),
    ("lajinha", "colheita", "Topázio amarelo seguindo para o despolpador", "alta"),
    ("tulha", "pos", "Armazém da Cafeeira Porta do Céu", "larga"),
    ("flor-1", "florada", "Flores do café em close", ""),
    ("colheita-mec", "colheita", "Colheita mecanizada de Catuaí Vermelho", ""),
    ("plantio-equipe", "pessoas", "Equipe no plantio da Fazenda Bom Jardim", ""),
    ("gps-3", "aereas", "Preparo de solo na Fazenda Nossa Senhora da Abadia", ""),
    ("cerejas-terreiro", "pos", "Cerejas recém-chegadas ao terreiro", ""),
    ("sao-jose", "aereas", "Fazenda São José, núcleo Lajinha", "larga"),
    ("degusta", "pos", "O momento mágico: a degustação", ""),
    ("plantio", "lavoura", "Plantio na Fazenda Bom Jardim", "alta"),
    ("colheita-graos", "colheita", "Café descarregado da colhedora", ""),
    ("maos-graos", "pos", "Grãos de cereja descascado", ""),
]
GAL_CATS = [("todas", "Todas"), ("aereas", "Aéreas"), ("lavoura", "Lavoura"), ("florada", "Florada"),
            ("colheita", "Colheita"), ("pos", "Pós-colheita"), ("pessoas", "Pessoas")]

VIDEOS = [
    ("J2TCDFKhamA", "Institucional Chapadão de Ferro"),
    ("UqDBg9EhEfo", "Institucional MC Miaki Coffee"),
    ("AqDVGYQS4bw", "Lavoura, terreiro e instalações"),
    ("qNJ5kzVtc44", "Colheita mecanizada vista do alto"),
    ("35SHwzzTxpY", "Terreiro e lavoura"),
    ("w06Wy5Tp_8g", "Terreiros e sede vistos do alto"),
    ("biK3VjIsVsQ", "Secagem em terreiro"),
    ("gYYmrDOHoHc", "Rodagem de café no terreiro"),
]

LINKS = [
    ("regiao", "Região do Cerrado Mineiro", "Federação dos Cafeicultores do Cerrado e a Denominação de Origem.", "https://www.cerradomineiro.org"),
    ("regiao", "Expocaccer", "Cooperativa dos cafeicultores do Cerrado, em Patrocínio.", "https://www.expocaccer.com.br"),
    ("regiao", "CCCMG", "Centro do Comércio de Café do Estado de Minas Gerais.", "https://www.cccmg.com.br"),
    ("regiao", "Prefeitura de Patrocínio", "Serviços e notícias do município.", "https://www.patrocinio.mg.gov.br"),
    ("cert", "Rainforest Alliance", "Certificação de sustentabilidade presente em todas as fazendas.", "https://www.rainforest-alliance.org/pt-br/"),
    ("cert", "C.A.F.E. Practices", "Programa de compra ética e sustentável da Starbucks.", "https://www.starbucks.com/responsibility/sourcing/coffee/"),
    ("cert", "BSCA", "Associação Brasileira de Cafés Especiais.", "https://bsca.com.br"),
    ("cert", "SCA", "Specialty Coffee Association e o protocolo de prova.", "https://www.sca.coffee"),
    ("mercado", "Indicador do café · CEPEA", "Preço de referência do café arábica, atualizado diariamente.", "https://www.cepea.esalq.usp.br/br/indicador/cafe.aspx"),
    ("mercado", "Cotações do café · Notícias Agrícolas", "Bolsa de Nova York, BM&F e praças do Cerrado.", "https://www.noticiasagricolas.com.br/cotacoes/cafe"),
    ("mercado", "Cecafé", "Conselho dos Exportadores de Café do Brasil.", "https://www.cecafe.com.br"),
    ("mercado", "ICO", "Organização Internacional do Café.", "https://www.ico.org"),
    ("mercado", "ABIC", "Associação Brasileira da Indústria de Café.", "https://www.abic.com.br"),
    ("clima", "INMET", "Previsão, alertas e dados das estações meteorológicas.", "https://portal.inmet.gov.br"),
    ("pesquisa", "Fundação Procafé", "Pesquisa e recomendações técnicas para a cafeicultura.", "https://www.fundacaoprocafe.com.br"),
    ("pesquisa", "EPAMIG", "Empresa de Pesquisa Agropecuária de Minas Gerais.", "https://www.epamig.br"),
    ("pesquisa", "EMATER-MG", "Assistência técnica e extensão rural em Minas.", "https://www.emater.mg.gov.br"),
    ("pesquisa", "Ministério da Agricultura", "Normas, registros e programas do MAPA.", "https://www.gov.br/agricultura"),
]
LINK_CATS = [("todos", "Todos"), ("regiao", "Região"), ("cert", "Certificações"), ("mercado", "Mercado"),
             ("clima", "Clima"), ("pesquisa", "Pesquisa e governo")]

_S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
ICONS = {
    "arrow": f'<svg {_S.replace("1.6", "2")}><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "out": f'<svg {_S.replace("1.6", "2")}><path d="M7 17 17 7M9 7h8v8"/></svg>',
    "phone": f'<svg {_S}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    "mail": f'<svg {_S}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    "instagram": f'<svg {_S}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>',
    "facebook": f'<svg {_S}><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/></svg>',
    "youtube": f'<svg {_S}><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/></svg>',
    "pin": f'<svg {_S}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "route": f'<svg {_S}><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/></svg>',
    "up": f'<svg {_S.replace("1.6", "2")}><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    "play": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    "close": f'<svg {_S.replace("1.6", "2")}><path d="M6 6l12 12M18 6 6 18"/></svg>',
    "leaf": f'<svg {_S}><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 14 10"/></svg>',
    "drop": f'<svg {_S}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
    "sun": f'<svg {_S}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "shield": f'<svg {_S}><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    "search": f'<svg {_S}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    "people": f'<svg {_S}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/></svg>',
    "gps": f'<svg {_S}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    "box": f'<svg {_S}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
}
ARROW = ICONS["arrow"]

LOGO_ESCURO = '<img class="logo-d" src="assets/logo-mcmiaki.svg" alt="" width="100" height="92">'
LOGO_CLARO = '<img class="logo-l" src="assets/logo-mcmiaki-w-2.svg" alt="" width="100" height="92">'


def enc(s):
    return quote_plus(s)


def map_embed():
    return f"https://maps.google.com/maps?q={enc(EMPRESA['q'])}&amp;z=15&amp;output=embed"


def map_link():
    return f"https://www.google.com/maps/search/?api=1&amp;query={enc(EMPRESA['q'])}"


def route_link():
    return f"https://www.google.com/maps/dir/?api=1&amp;destination={enc(EMPRESA['q'])}"


def fmt(n):
    return f"{n:,}".replace(",", ".")


def alt_txt(a):
    return f"{fmt(a[0])} m" if a[0] == a[1] else f"{fmt(a[0])} a {fmt(a[1])} m"


# ------------------------------------------------------------------
# Blocos
# ------------------------------------------------------------------
def nucleos_lista():
    rows = []
    for k, n in enumerate(NUCLEOS):
        rows.append(f"""<li class="nrow reveal" data-img="assets/img/{n['foto']}.jpg">
        <a href="fazendas.html#{n['id']}">
          <span class="nrow-n label">{k + 1:02d}</span>
          <span class="nrow-t"><strong>{n['nome']}</strong><small>{n['regiao']}</small></span>
          <span class="nrow-alt"><b>{alt_txt(n['alt'])}</b><small>altitude</small></span>
          <span class="nrow-ha"><b>{n['cult']} ha</b><small>cultivados</small></span>
          <span class="nrow-go">{ARROW}</span>
        </a>
      </li>""")
    return '<ol class="nrows">\n      ' + "\n      ".join(rows) + '\n    </ol>\n    <div class="nrow-peek" aria-hidden="true"><img alt=""></div>'


def proc_bar(n):
    if n["proc"]:
        faixa = "".join(f'<i style="width:{v}%;background:{PROC[k][1]}"></i>' for k, v in enumerate(n["proc"]) if v)
        leg = "".join(f'<span style="--c:{PROC[k][1]}">{PROC[k][0]} <b>{v}%</b></span>' for k, v in enumerate(n["proc"]) if v)
        return f'<div class="proc"><span class="label muted">Tipos de processamento</span><div class="proc-faixa">{faixa}</div><div class="proc-leg">{leg}</div></div>'
    if n["proc_txt"]:
        return f'<div class="proc"><span class="label muted">Tipos de processamento</span><p>{n["proc_txt"]}</p></div>'
    return ""


def nucleos_fichas():
    out = []
    for k, n in enumerate(NUCLEOS):
        dados = [("Altitude", alt_txt(n["alt"])), ("Área total", f"{n['total']} ha"), ("Área cultivada", f"{n['cult']} ha")]
        if n["prod"]:
            dados.append(("Produtividade média", f"{n['prod']} sc/ha"))
        dados.append(("Colheita", n["colheita"]))
        if n["sec"]:
            dados.append(("Secagem", n["sec"]))
        dl = "".join(f"<div><dt>{a}</dt><dd>{b}</dd></div>" for a, b in dados)
        faz = "".join(f"<li>{f}</li>" for f in n["faz"])
        out.append(f"""<article class="nuc" id="{n['id']}">
        <figure class="nuc-foto img-reveal"><img src="assets/img/{n['foto']}.jpg" alt="Lavouras do núcleo {n['nome']}" loading="lazy" data-parallax="40"><figcaption class="label">{n['regiao']}</figcaption></figure>
        <div class="nuc-body">
          <header><span class="nuc-n">{k + 1:02d}</span><h2 class="display lg">Núcleo<br>{n['nome']}</h2></header>
          <p class="nuc-intro">{n['texto']}</p>
          <ul class="nuc-faz">{faz}</ul>
          <dl class="ficha">{dl}</dl>
          {proc_bar(n)}
          <p class="nuc-var"><span class="label muted">Variedades</span>{n['var']}</p>
          <p class="nuc-cert">{ICONS['shield']} Rainforest Alliance · Nespresso AAA · C.A.F.E. Practices</p>
        </div>
      </article>""")
    return "\n      ".join(out)


def nucleos_nav():
    return '<ol>' + "".join(f'<li><a href="#{n["id"]}"><span>{k + 1:02d}</span>{n["nome"]}</a></li>' for k, n in enumerate(NUCLEOS)) + '</ol>'


def altitudes():
    y0, y1 = 800, 1300
    cols = []
    for n in sorted(NUCLEOS, key=lambda x: -x["alt"][1]):
        top = (n["alt"][1] - y0) / (y1 - y0) * 100
        low = (n["alt"][0] - y0) / (y1 - y0) * 100
        minl = '<em class="alt-min"></em>' if n["alt"][0] != n["alt"][1] else ""
        cols.append(f'<a class="alt-col" href="#{n["id"]}" style="--h:{top:.1f}%;--l:{low:.1f}%" aria-label="Núcleo {n["nome"]}, {alt_txt(n["alt"])}"><span class="alt-bar"><i></i></span>{minl}<b>{fmt(n["alt"][1])}</b><small>{n["nome"]}</small></a>')
    linhas = "".join(f'<span style="bottom:{(v - y0) / (y1 - y0) * 100:.1f}%">{fmt(v)}</span>' for v in range(800, 1301, 100))
    chap = (1170 - y0) / (y1 - y0) * 100
    return f"""<div class="alt-chart reveal">
      <div class="alt-axis" aria-hidden="true">{linhas}</div>
      <div class="alt-zone" style="bottom:{chap:.1f}%" aria-hidden="true"><span class="label">Chapadão de Ferro · acima de 1.170 m</span></div>
      <div class="alt-cols">{''.join(cols)}</div>
    </div>"""


def premios():
    lis = []
    for k, (ano, t, d, dest, foto) in enumerate(PREMIOS):
        lis.append(f'<li class="prem reveal" data-img="assets/img/{foto}.jpg"><span class="label">{ano}</span><div><h3>{t}</h3><p>{d}</p></div><b class="prem-d">{dest}</b></li>')
    return '<ol class="prems">' + "".join(lis) + '</ol>\n    <div class="nrow-peek" aria-hidden="true"><img alt=""></div>'


def selos():
    return '<ul class="selos">' + "".join(
        f'<li class="reveal reveal-d{k % 4}"><img src="assets/selos/{f}.png" alt="{n}" loading="lazy"><strong>{n}</strong><small>{s}</small></li>'
        for k, (f, n, s) in enumerate(SELOS)) + "</ul>"


def galeria():
    chips = "".join(f'<button class="filter" type="button" data-f="{c}" aria-pressed="{"true" if c == "todas" else "false"}">{l}</button>' for c, l in GAL_CATS)
    items = "".join(
        f'<button type="button" class="g {fmt_}" data-cat="{cat}"><img src="assets/img/{f}.jpg" alt="{leg}" loading="lazy"><span>{leg}</span></button>'
        for f, cat, leg, fmt_ in GALERIA)
    return f'<div class="filters" role="group" aria-label="Filtrar fotos">{chips}</div>\n    <div class="gal" data-gal>{items}</div>'


def videos():
    return '<div class="vids">' + "".join(
        f'<button type="button" class="vid reveal reveal-d{k % 4}" data-yt="{i}" data-title="{t}"><span class="vid-img"><img src="assets/video/thumbs/{i}.jpg" alt="" loading="lazy"><span class="vid-play">{ICONS["play"]}</span></span><strong>{t}</strong></button>'
        for k, (i, t) in enumerate(VIDEOS)) + "</div>"


def links_block():
    chips = "".join(f'<button class="filter" type="button" data-f="{c}" aria-pressed="{"true" if c == "todos" else "false"}">{l}</button>' for c, l in LINK_CATS)
    nomes = dict(LINK_CATS)
    cards = "".join(
        f'<a class="link-card" data-cat="{c}" href="{u}" target="_blank" rel="noopener"><span class="label accent">{nomes[c]}</span><strong>{t}</strong><p>{d}</p><span class="link-go">{u.split("//")[1].split("/")[0].replace("www.", "")} {ICONS["out"]}</span></a>'
        for c, t, d, u in LINKS)
    return f"""<label class="search">{ICONS['search']}<input type="search" placeholder="Buscar um link" data-busca aria-label="Buscar links"></label>
    <div class="filters" role="group" aria-label="Filtrar links">{chips}</div>
    <div class="links" data-links>{cards}</div>
    <p class="links-vazio muted" data-vazio hidden>Nenhum link encontrado.</p>"""


def canais():
    items = [
        ("phone", "Telefone", f'<a href="tel:{EMPRESA["tel"]}">{EMPRESA["telefone"]}</a>', "Escritório em Patrocínio"),
        ("mail", "E-mail", f'<a href="mailto:{EMPRESA["email"]}">{EMPRESA["email"]}</a>', "Comercial e atendimento"),
        ("pin", "Endereço", f'{EMPRESA["rua"]}<br>{EMPRESA["cidade"]} · {EMPRESA["cep"]}', f'<a href="{route_link()}" target="_blank" rel="noopener">Traçar rota</a>'),
        ("instagram", "Instagram", f'<a href="{EMPRESA["instagram"]}" target="_blank" rel="noopener">{EMPRESA["instagram_user"]}</a>', "O dia a dia da fazenda"),
        ("facebook", "Facebook", f'<a href="{EMPRESA["facebook"]}" target="_blank" rel="noopener">/mcmiaki</a>', "Página oficial"),
        ("youtube", "YouTube", f'<a href="{EMPRESA["youtube"]}" target="_blank" rel="noopener">MC Miaki Coffee</a>', "Filmes e voos de drone"),
        ("box", "Cafeeira Porta do Céu", '<a href="sobre.html#cafeeira">Armazenagem e preparo</a>', "Para outros produtores"),
        ("leaf", "Compradores", f'<a href="mailto:{EMPRESA["email"]}?subject=Amostras%20de%20caf%C3%A9">Pedir amostras</a>', "Lotes rastreáveis"),
    ]
    cells = "".join(
        f'<div class="channel reveal"><span class="ch-ico">{ICONS[i]}</span><span class="label muted">{t}</span><p>{v}</p><small>{s}</small></div>'
        for i, t, v, s in items)
    return f'<div class="channels">{cells}</div>'


def mapa():
    return f"""<figure class="map-card reveal">
      <div class="map-wrap"><iframe class="map-frame" title="Mapa: {EMPRESA['rua']}, {EMPRESA['cidade']}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="{map_embed()}"></iframe></div>
      <figcaption>
        <div><span class="label accent">Escritório</span><h3>Patrocínio, MG</h3><p>{EMPRESA['rua']} · CEP {EMPRESA['cep']}</p></div>
        <div class="map-actions">
          <a class="btn btn-solid btn-sm" href="{route_link()}" target="_blank" rel="noopener">Traçar rota {ICONS['route']}</a>
          <a class="btn btn-ghost btn-sm" href="{map_link()}" target="_blank" rel="noopener">Abrir no Google Maps</a>
        </div>
      </figcaption>
    </figure>"""


# ------------------------------------------------------------------
# Casca
# ------------------------------------------------------------------
def cur(key, current):
    return ' aria-current="page"' if key == current else ""


def header(current, theme):
    links = "".join(f'<a class="nav-link" href="{h}"{cur(k, current)}>{l}</a>' for k, l, h, top in NAV if top)
    over = "".join(f'<li><a href="{h}"{cur(k, current)}>{l}</a></li>' for k, l, h, _ in NAV)
    return f"""<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<div class="progress-bar" aria-hidden="true"></div>
<div class="curtain" aria-hidden="true"><img class="curtain-mark" src="assets/logo-mcmiaki-w-2.svg" alt=""><span class="curtain-alt label"><b data-alt>0000</b> m · Chapadão de Ferro</span></div>
<header class="site-header" data-theme="{theme}">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="MC Miaki Coffee, página inicial">{LOGO_ESCURO}{LOGO_CLARO}</a>
    <nav class="nav" aria-label="Principal">
      {links}
      <a class="btn btn-solid btn-sm" href="contato.html">Fale conosco {ARROW}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu"><span class="t">Menu</span><span class="bars"></span></button>
    </nav>
  </div>
</header>
<div class="overlay" id="menu" data-open="false" aria-hidden="true" inert>
  <ol>{over}</ol>
  <div class="overlay-foot">
    <a href="tel:{EMPRESA['tel']}">{ICONS['phone']} {EMPRESA['telefone']}</a>
    <a href="mailto:{EMPRESA['email']}">{ICONS['mail']} {EMPRESA['email']}</a>
    <a href="{EMPRESA['instagram']}" target="_blank" rel="noopener">{ICONS['instagram']} Instagram</a>
  </div>
</div>
"""


def footer():
    navs = "".join(f'<li><a href="{h}">{l}</a></li>' for _, l, h, _t in NAV)
    nucs = "".join(f'<li><a href="fazendas.html#{n["id"]}">Núcleo {n["nome"]}</a></li>' for n in NUCLEOS)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-cta">
        <p class="label muted">Vamos conversar</p>
        <p class="foot-lead">Procura cafés especiais, sustentáveis e rastreáveis do Cerrado Mineiro? Fale com a família que produz.</p>
        <div class="foot-actions">
          <a class="btn btn-solid" href="contato.html">Entrar em contato {ARROW}</a>
          <a class="btn btn-ghost" href="mailto:{EMPRESA['email']}?subject=Amostras%20de%20caf%C3%A9">Pedir amostras</a>
        </div>
      </div>
      <div class="foot-social" aria-label="Redes sociais">
        <a href="{EMPRESA['instagram']}" target="_blank" rel="noopener" aria-label="Instagram">{ICONS['instagram']}</a>
        <a href="{EMPRESA['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{ICONS['facebook']}</a>
        <a href="{EMPRESA['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{ICONS['youtube']}</a>
        <a href="mailto:{EMPRESA['email']}" aria-label="E-mail">{ICONS['mail']}</a>
      </div>
    </div>
    <div class="foot-grid">
      <div class="intro">
        <a class="brand" href="index.html" aria-label="MC Miaki Coffee">{LOGO_CLARO}</a>
        <p>Cafés especiais, sustentáveis e 100% rastreáveis de um terroir vulcânico único, o Chapadão de Ferro, em Patrocínio, no Cerrado Mineiro.</p>
      </div>
      <div><h4>Navegação</h4><ul>{navs}</ul></div>
      <div><h4>Fazendas</h4><ul>{nucs}</ul></div>
      <div><h4>Contato</h4><ul>
        <li><a href="tel:{EMPRESA['tel']}">{EMPRESA['telefone']}</a></li>
        <li><a href="mailto:{EMPRESA['email']}">{EMPRESA['email']}</a></li>
        <li>{EMPRESA['rua']}<br>{EMPRESA['cidade']} · {EMPRESA['cep']}</li>
        <li><a class="foot-route" href="{route_link()}" target="_blank" rel="noopener">{ICONS['route']} Como chegar</a></li>
      </ul></div>
      <div><h4>Certificações</h4><ul class="creds">
        <li>Rainforest Alliance</li><li>Nespresso AAA</li><li>C.A.F.E. Practices</li><li>Região do Cerrado Mineiro</li>
      </ul></div>
    </div>
  </div>
  <div class="foot-word" aria-hidden="true"><i>MC</i> Miaki</div>
  <div class="wrap">
    <div class="foot-bottom">
      <span>&copy; <span data-year>2026</span> MC Miaki Coffee · Patrocínio, Minas Gerais</span>
      <a class="dev-by" href="https://achillesmedia.com.br" target="_blank" rel="noopener">Desenvolvido por <strong>Achilles</strong></a>
      <button class="to-top" type="button" data-top>Voltar ao topo {ICONS['up']}</button>
    </div>
  </div>
</footer>
<div class="vmodal" id="vmodal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Vídeo" inert>
  <div class="vmodal-box"><div class="vmodal-frame"></div><div class="vmodal-bar"><strong class="vmodal-title"></strong><a class="vmodal-link" href="{EMPRESA['youtube']}" target="_blank" rel="noopener">{ICONS['youtube']} Ver no YouTube</a></div></div>
  <button class="vmodal-close" type="button" aria-label="Fechar vídeo">{ICONS['close']}</button>
</div>
<dialog class="lightbox" aria-label="Foto ampliada"><img src="" alt=""><p class="label"></p><button type="button" class="lb-close" aria-label="Fechar">{ICONS['close']}</button></dialog>
"""


def page(meta, body, name):
    title = meta["title"]
    full = f"{title} | MC Miaki Coffee" if name != "index" else title
    url = f"{SITE}/" if name == "index" else f"{SITE}/{name}.html"
    ld = {"@context": "https://schema.org", "@type": "Organization", "name": EMPRESA["nome"], "url": SITE,
          "logo": f"{SITE}/assets/logo-mcmiaki.svg", "email": EMPRESA["email"], "telephone": "+55 34 3831-1481",
          "address": {"@type": "PostalAddress", "streetAddress": EMPRESA["rua"], "addressLocality": "Patrocínio",
                      "addressRegion": "MG", "postalCode": EMPRESA["cep"], "addressCountry": "BR"},
          "sameAs": [EMPRESA["instagram"], EMPRESA["facebook"], EMPRESA["youtube"]]}
    return f"""<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full}</title>
<meta name="description" content="{meta['description']}">
<meta name="theme-color" content="#10130f">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{meta['description']}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-mcmiaki.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Geist:wght@200..600&family=Geist+Mono:wght@300..500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v={V}">
<script>document.documentElement.classList.replace('no-js','js')</script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{meta.get('head', '')}</head>
<body data-page="{name}">
{header(meta.get('nav', name), meta.get('theme', 'light'))}
<main id="conteudo">
{body.strip()}
</main>
{footer()}<script src="assets/js/main.js?v={V}" defer></script>
</body>
</html>
"""


def render(body):
    rep = {
        "{{ARROW}}": ARROW, "{{NUCLEOS_LISTA}}": nucleos_lista(), "{{NUCLEOS_FICHAS}}": nucleos_fichas(),
        "{{NUCLEOS_NAV}}": nucleos_nav(), "{{ALTITUDES}}": altitudes(), "{{PREMIOS}}": premios(),
        "{{SELOS}}": selos(), "{{GALERIA}}": galeria(), "{{VIDEOS}}": videos(), "{{LINKS}}": links_block(),
        "{{CANAIS}}": canais(), "{{MAPA}}": mapa(), "{{EMAIL}}": EMPRESA["email"], "{{TEL}}": EMPRESA["tel"],
        "{{TELEFONE}}": EMPRESA["telefone"], "{{INSTAGRAM}}": EMPRESA["instagram"], "{{YOUTUBE}}": EMPRESA["youtube"],
        "{{ROTA}}": route_link(),
    }
    for a, b in rep.items():
        body = body.replace(a, b)
    return re.sub(r"\{\{ICON:(\w+)\}\}", lambda m: ICONS[m.group(1)], body)


def main():
    urls = []
    for src in sorted(PAGES.glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->", raw, re.S)
        if not m:
            raise SystemExit(f"{src.name}: faltando bloco <!--meta-->")
        meta = json.loads(m.group(1))
        html = page(meta, render(raw[m.end():]), src.stem)
        for bad in ("—", "–"):
            if bad in html:
                raise SystemExit(f"{src.name}: contém travessão ({bad!r}); troque por outra pontuação")
        if "{{" in html:
            raise SystemExit(f"{src.name}: marcador não substituído")
        (OUT / f"{src.stem}.html").write_text(html, encoding="utf-8")
        urls.append(f"{SITE}/" if src.stem == "index" else f"{SITE}/{src.stem}.html")
        print("ok", src.stem + ".html")
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(f"<url><loc>{u}</loc></url>" for u in urls) + "</urlset>\n", encoding="utf-8")


if __name__ == "__main__":
    main()
