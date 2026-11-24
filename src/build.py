"""
Gera o site da MC Miaki Coffee em português (dist/) e inglês (dist/en/).

Páginas em português ficam em src/pages/*.html e as em inglês em src/pages/en/*.html,
com o mesmo nome de arquivo. Os textos dos blocos de dados (núcleos, prêmios, galeria,
links...) são traduzidos pelo dicionário de src/i18n_en.py; o build falha se faltar
alguma tradução.

Cada página começa com um comentário de metadados:
<!--meta {"title": "...", "description": "...", "nav": "sobre", "theme": "dark"} -->

Marcadores disponíveis dentro das páginas:
  {{ARROW}}             seta dos botões
  {{ICON:nome}}         ícone
  {{NUCLEOS_LISTA}}     lista de núcleos com prévia de foto (home)
  {{NUCLEOS_FICHAS}}    fichas completas dos seis núcleos (página Fazendas)
  {{NUCLEOS_NAV}}       índice lateral dos núcleos
  {{ALTITUDES}}         gráfico de altitude dos núcleos
  {{PREMIOS}}           lista de prêmios
  {{SELOS}}             selos de certificação
  {{GALERIA}}           galeria completa com filtros
  {{CINE}}              sala de cinema: tela grande + lista dos primeiros filmes (home)
  {{FILME:id}}          um filme em destaque, largo, com prévia em movimento
  {{VIDEOS}}            todos os filmes em grade, com prévia em movimento
  {{CERTS}}             cartões completos das certificações
  {{CANAIS}}            grade de canais de contato
  {{MAPA}}              mapa com botões de rota

Uso:  python src/build.py
"""
import json
import pathlib
import re
import sys
from urllib.parse import quote_plus

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from i18n_en import EN  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "pages"
OUT = ROOT / "dist"
SITE = "https://mcmiaki.achillesmedia.com.br"
V = "8"  # versão dos arquivos estáticos; aumente a cada publicação de CSS ou JS

LANG = "pt"
FALTANDO = set()


def t(s):
    """Traduz um texto dos dados. Em português devolve o próprio texto."""
    if LANG == "pt":
        return s
    if s not in EN:
        FALTANDO.add(s)
        return s
    return EN[s]


def dec(s):
    """Número decimal escrito em português ("465,2") no formato do idioma."""
    return s.replace(",", ".") if LANG == "en" else s


def fmt(n):
    return f"{n:,}" if LANG == "en" else f"{n:,}".replace(",", ".")


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
    ("certificacoes", "Certificações", "certificacoes.html", True),
    ("fotos", "Fotos e vídeos", "fotos.html", True),
    ("contato", "Contato", "contato.html", False),
]

# Certificações e programas: (logo, nome, quem emite, o que é, pilares, site oficial)
CERTS = [
    ("logo-rainforest", "Rainforest Alliance", "Rainforest Alliance",
     "Selo internacional de agricultura sustentável. Auditorias independentes verificam, fazenda por fazenda, o cuidado com a floresta, a água, o solo e as pessoas que trabalham no campo.",
     ["Proteção da biodiversidade e da mata nativa", "Uso responsável de água, solo e defensivos", "Direitos e bem-estar dos trabalhadores"],
     "https://www.rainforest-alliance.org/pt-br/"),
    ("logo-AAA", "Nespresso AAA", "Programa AAA de Qualidade Sustentável da Nespresso",
     "Programa da Nespresso que une qualidade de xícara e sustentabilidade. Só entram fazendas que entregam cafés de alto padrão e seguem práticas responsáveis acompanhadas por técnicos de campo.",
     ["Qualidade de xícara de alto padrão", "Boas práticas agrícolas acompanhadas no campo", "Relação de longo prazo com o produtor"],
     "https://www.sustainability.nespresso.com/"),
    ("logo-CAFE", "C.A.F.E. Practices", "Starbucks · Coffee and Farmer Equity",
     "Diretrizes de compra ética da Starbucks, verificadas por organizações independentes. Avaliam qualidade, transparência econômica, responsabilidade social e liderança ambiental.",
     ["Qualidade do produto", "Responsabilidade social e econômica", "Liderança ambiental"],
     "https://www.starbucks.com/responsibility/sourcing/coffee/"),
    ("logo-UTZ", "UTZ Certified", "Hoje parte da Rainforest Alliance",
     "Programa de café sustentável que as fazendas do grupo seguiram por anos. Em 2018 a UTZ se uniu à Rainforest Alliance, e seus critérios continuam valendo dentro do selo atual.",
     ["Boas práticas agrícolas e de gestão", "Rastreabilidade do lote", "Condições de trabalho seguras"],
     "https://www.rainforest-alliance.org/pt-br/"),
    ("logo-cerrado", "Região do Cerrado Mineiro", "Federação dos Cafeicultores do Cerrado",
     "Primeira Denominação de Origem de café do Brasil. O selo garante que o café foi produzido na região, por produtores cadastrados, com origem e qualidade comprovadas lote a lote.",
     ["Origem geográfica protegida", "Produtor e lote identificados", "Qualidade avaliada para usar o selo"],
     "https://www.cerradomineiro.org"),
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

# Filmes do canal da MC Miaki: (id do YouTube, título, duração, tipo)
# Cada um tem um recorte mudo de 7 s em assets/video/films/{id}.mp4 (+ .jpg) para a prévia em movimento.
VIDEOS = [
    ("J2TCDFKhamA", "Institucional Chapadão de Ferro", "4:31", "Filme"),
    ("UqDBg9EhEfo", "Institucional MC Miaki Coffee", "5:51", "Filme"),
    ("qNJ5kzVtc44", "Colheita mecanizada vista do alto", "0:20", "Drone"),
    ("gYYmrDOHoHc", "Rodagem de café no terreiro", "6:12", "Drone"),
    ("w06Wy5Tp_8g", "Terreiros e sede vistos do alto", "1:18", "Drone"),
    ("AqDVGYQS4bw", "Lavoura, terreiro e instalações", "0:14", "Drone"),
    ("35SHwzzTxpY", "Terreiro e lavoura", "0:18", "Drone"),
    ("biK3VjIsVsQ", "Secagem em terreiro", "0:22", "Drone"),
]

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


def _flag_us():
    h = 20 / 13
    faixas = "".join(f'<rect y="{k * h:.3f}" width="28" height="{h:.3f}" fill="#b22234"/>' for k in range(0, 13, 2))
    estrelas = "".join(f'<circle cx="{1.3 + c * 1.9 + (0.95 if r % 2 else 0):.2f}" cy="{1.2 + r * 1.75:.2f}" r=".42" fill="#fff"/>'
                       for r in range(6) for c in range(6 if r % 2 == 0 else 5))
    return (f'<svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="#fff"/>{faixas}'
            f'<rect width="12" height="{7 * h:.3f}" fill="#3c3b6e"/>{estrelas}</svg>')


FLAG_BR = ('<svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="#009c3b"/>'
           '<path d="M14 2.4 25.6 10 14 17.6 2.4 10z" fill="#ffdf00"/><circle cx="14" cy="10" r="4.7" fill="#002776"/>'
           '<path d="M9.5 9.2c3-.6 6.2-.1 9 1.4" stroke="#fff" stroke-width=".9" fill="none"/></svg>')
FLAG_US = _flag_us()


def enc(s):
    return quote_plus(s)


def map_embed():
    hl = "&amp;hl=en" if LANG == "en" else ""
    return f"https://maps.google.com/maps?q={enc(EMPRESA['q'])}&amp;z=15{hl}&amp;output=embed"


def map_link():
    return f"https://www.google.com/maps/search/?api=1&amp;query={enc(EMPRESA['q'])}"


def route_link():
    return f"https://www.google.com/maps/dir/?api=1&amp;destination={enc(EMPRESA['q'])}"


def alt_txt(a):
    sep = " to " if LANG == "en" else " a "
    return f"{fmt(a[0])} m" if a[0] == a[1] else f"{fmt(a[0])}{sep}{fmt(a[1])} m"


def amostras_mail():
    assunto = "Coffee%20samples" if LANG == "en" else "Amostras%20de%20caf%C3%A9"
    return f"mailto:{EMPRESA['email']}?subject={assunto}"


def telefone():
    return EMPRESA["telefone"] if LANG == "pt" else "+55 34 3831-1481"


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
          <span class="nrow-alt"><b>{alt_txt(n['alt'])}</b><small>{t('altitude')}</small></span>
          <span class="nrow-ha"><b>{dec(n['cult'])} ha</b><small>{t('cultivados')}</small></span>
          <span class="nrow-go">{ARROW}</span>
        </a>
      </li>""")
    return '<ol class="nrows">\n      ' + "\n      ".join(rows) + '\n    </ol>\n    <div class="nrow-peek" aria-hidden="true"><img alt=""></div>'


def proc_bar(n):
    rot = t("Tipos de processamento")
    if n["proc"]:
        faixa = "".join(f'<i style="width:{v}%;background:{PROC[k][1]}"></i>' for k, v in enumerate(n["proc"]) if v)
        leg = "".join(f'<span style="--c:{PROC[k][1]}">{t(PROC[k][0])} <b>{v}%</b></span>' for k, v in enumerate(n["proc"]) if v)
        return f'<div class="proc"><span class="label muted">{rot}</span><div class="proc-faixa">{faixa}</div><div class="proc-leg">{leg}</div></div>'
    if n["proc_txt"]:
        return f'<div class="proc"><span class="label muted">{rot}</span><p>{t(n["proc_txt"])}</p></div>'
    return ""


def nucleo_nome(n):
    return f"{n['nome']} {t('Núcleo')}" if LANG == "en" else f"Núcleo {n['nome']}"


def nucleos_fichas():
    out = []
    for k, n in enumerate(NUCLEOS):
        dados = [(t("Altitude"), alt_txt(n["alt"])), (t("Área total"), f"{dec(n['total'])} ha"), (t("Área cultivada"), f"{dec(n['cult'])} ha")]
        if n["prod"]:
            dados.append((t("Produtividade média"), f"{n['prod']} {t('sc/ha')}"))
        dados.append((t("Colheita"), t(n["colheita"])))
        if n["sec"]:
            dados.append((t("Secagem"), t(n["sec"])))
        dl = "".join(f"<div><dt>{a}</dt><dd>{b}</dd></div>" for a, b in dados)
        faz = "".join(f"<li>{f}</li>" for f in n["faz"])
        titulo = f"{n['nome']}<br>{t('Núcleo')}" if LANG == "en" else f"Núcleo<br>{n['nome']}"
        out.append(f"""<article class="nuc" id="{n['id']}">
        <figure class="nuc-foto img-reveal"><img src="assets/img/{n['foto']}.jpg" alt="{t('Lavouras do núcleo')} {n['nome']}" loading="lazy" data-parallax="40"><figcaption class="label">{n['regiao']}</figcaption></figure>
        <div class="nuc-body">
          <header><span class="nuc-n">{k + 1:02d}</span><h2 class="display lg">{titulo}</h2></header>
          <p class="nuc-intro">{t(n['texto'])}</p>
          <ul class="nuc-faz">{faz}</ul>
          <dl class="ficha">{dl}</dl>
          {proc_bar(n)}
          <p class="nuc-var"><span class="label muted">{t('Variedades')}</span>{t(n['var'])}</p>
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
        cols.append(f'<a class="alt-col" href="#{n["id"]}" style="--h:{top:.1f}%;--l:{low:.1f}%" aria-label="{nucleo_nome(n)}, {alt_txt(n["alt"])}"><span class="alt-bar"><i></i></span>{minl}<b>{fmt(n["alt"][1])}</b><small>{n["nome"]}</small></a>')
    linhas = "".join(f'<span style="bottom:{(v - y0) / (y1 - y0) * 100:.1f}%">{fmt(v)}</span>' for v in range(800, 1301, 100))
    chap = (1170 - y0) / (y1 - y0) * 100
    return f"""<div class="alt-chart reveal">
      <div class="alt-axis" aria-hidden="true">{linhas}</div>
      <div class="alt-zone" style="bottom:{chap:.1f}%" aria-hidden="true"><span class="label">{t('Chapadão de Ferro · acima de 1.170 m')}</span></div>
      <div class="alt-cols">{''.join(cols)}</div>
    </div>"""


def premios():
    lis = []
    for ano, tit, d, dest, foto in PREMIOS:
        lis.append(f'<li class="prem reveal" data-img="assets/img/{foto}.jpg"><span class="label">{t(ano)}</span><div><h3>{t(tit)}</h3><p>{t(d)}</p></div><b class="prem-d">{t(dest)}</b></li>')
    return '<ol class="prems">' + "".join(lis) + '</ol>\n    <div class="nrow-peek" aria-hidden="true"><img alt=""></div>'


def selos():
    return '<ul class="selos">' + "".join(
        f'<li class="reveal reveal-d{k % 4}"><img src="assets/selos/{f}.png" alt="{t(n)}" loading="lazy"><strong>{t(n)}</strong><small>{t(s)}</small></li>'
        for k, (f, n, s) in enumerate(SELOS)) + "</ul>"


def galeria():
    chips = "".join(f'<button class="filter" type="button" data-f="{c}" aria-pressed="{"true" if c == "todas" else "false"}">{t(l)}</button>' for c, l in GAL_CATS)
    items = "".join(
        f'<button type="button" class="g {fmt_}" data-cat="{cat}"><img src="assets/img/{f}.jpg" alt="{t(leg)}" loading="lazy"><span>{t(leg)}</span></button>'
        for f, cat, leg, fmt_ in GALERIA)
    return f'<div class="filters" role="group" aria-label="{t("Filtrar fotos")}">{chips}</div>\n    <div class="gal" data-gal>{items}</div>'


def clip(i):
    """Vídeo mudo em loop que só carrega e toca quando aparece na tela."""
    return (f'<video muted loop playsinline preload="none" poster="assets/video/films/{i}.jpg" '
            f'data-src="assets/video/films/{i}.mp4"></video>')


def video(i):
    for v in VIDEOS:
        if v[0] == i:
            return v
    raise SystemExit(f"filme {i} não está em VIDEOS")


def cine():
    films = VIDEOS[:5]
    i0, t0, d0, k0 = films[0]
    items = "".join(
        f'<li><button type="button" class="cine-item{" is-on" if n == 0 else ""}" data-id="{i}" data-title="{t(tt)}" data-meta="{t(k)} · {d}">'
        f'<span class="cine-n">{n + 1:02d}</span><span class="cine-t"><strong>{t(tt)}</strong><small>{t(k)} · {d}</small></span>'
        f'<span class="cine-ico">{ICONS["play"]}</span></button></li>'
        for n, (i, tt, d, k) in enumerate(films))
    return f"""<div class="cine reveal" data-cine>
      <div class="cine-screen">
        {clip(i0)}
        <span class="cine-shade" aria-hidden="true"></span>
        <span class="cine-rec label" aria-hidden="true"><i></i>{t('Prévia')}</span>
        <div class="cine-info"><span class="label" data-cine-meta>{t(k0)} · {d0}</span><strong class="display" data-cine-title>{t(t0)}</strong></div>
        <button class="cine-play" type="button" data-yt="{i0}" data-title="{t(t0)}"><span class="cine-play-i">{ICONS['play']}</span><span>{t('Assistir ao filme')}</span></button>
      </div>
      <ol class="cine-list" aria-label="{t('Filmes')}">{items}</ol>
    </div>"""


def filme(i):
    _, tt, d, k = video(i)
    return f"""<button type="button" class="filme reveal" data-yt="{i}" data-title="{t(tt)}">
      {clip(i)}
      <span class="filme-shade" aria-hidden="true"></span>
      <span class="filme-txt"><span class="label">{t(k)} · {d}</span><strong class="display">{t(tt)}</strong></span>
      <span class="filme-play"><i>{ICONS['play']}</i>{t('Assistir ao filme')}</span>
    </button>"""


def videos():
    return '<div class="vids">' + "".join(
        f'<button type="button" class="vid reveal reveal-d{n % 4}" data-yt="{i}" data-title="{t(tt)}"><span class="vid-img">{clip(i)}'
        f'<span class="vid-play">{ICONS["play"]}</span><span class="vid-dur label">{d}</span></span><strong>{t(tt)}</strong><small class="label muted">{t(k)}</small></button>'
        for n, (i, tt, d, k) in enumerate(VIDEOS)) + "</div>"


def certs():
    """Cartões completos das certificações (página Certificações)."""
    out = []
    for k, (logo, nome, emissor, desc, pilares, url) in enumerate(CERTS):
        lis = "".join(f"<li>{ICONS['shield']}<span>{t(x)}</span></li>" for x in pilares)
        host = url.split("//")[1].split("/")[0].replace("www.", "")
        out.append(f"""<article class="cert reveal" id="{logo.replace('logo-', '').lower()}">
        <div class="cert-logo"><img src="assets/selos/{logo}.png" alt="{t(nome)}" loading="lazy"><span class="label muted">{k + 1:02d} / {len(CERTS):02d}</span></div>
        <div class="cert-body">
          <span class="label accent">{t(emissor)}</span>
          <h2 class="display">{t(nome)}</h2>
          <p>{t(desc)}</p>
          <ul class="cert-pil">{lis}</ul>
          <div class="cert-foot"><span class="cert-scope">{t('Nos 6 núcleos')}</span><a href="{url}" target="_blank" rel="noopener">{host} {ICONS['out']}</a></div>
        </div>
      </article>""")
    return '<div class="certs">\n      ' + "\n      ".join(out) + "\n    </div>"


def canais():
    items = [
        ("phone", t("Telefone"), f'<a href="tel:{EMPRESA["tel"]}">{telefone()}</a>', t("Escritório em Patrocínio")),
        ("mail", "E-mail", f'<a href="mailto:{EMPRESA["email"]}">{EMPRESA["email"]}</a>', t("Comercial e atendimento")),
        ("pin", t("Endereço"), f'{EMPRESA["rua"]}<br>{EMPRESA["cidade"]} · {EMPRESA["cep"]}', f'<a href="{route_link()}" target="_blank" rel="noopener">{t("Traçar rota")}</a>'),
        ("instagram", "Instagram", f'<a href="{EMPRESA["instagram"]}" target="_blank" rel="noopener">{EMPRESA["instagram_user"]}</a>', t("O dia a dia da fazenda")),
        ("facebook", "Facebook", f'<a href="{EMPRESA["facebook"]}" target="_blank" rel="noopener">/mcmiaki</a>', t("Página oficial")),
        ("youtube", "YouTube", f'<a href="{EMPRESA["youtube"]}" target="_blank" rel="noopener">MC Miaki Coffee</a>', t("Filmes e voos de drone")),
        ("box", "Cafeeira Porta do Céu", f'<a href="sobre.html#cafeeira">{t("Armazenagem e preparo")}</a>', t("Para outros produtores")),
        ("leaf", t("Compradores"), f'<a href="{amostras_mail()}">{t("Pedir amostras")}</a>', t("Lotes rastreáveis")),
    ]
    cells = "".join(
        f'<div class="channel reveal"><span class="ch-ico">{ICONS[i]}</span><span class="label muted">{tt}</span><p>{v}</p><small>{s}</small></div>'
        for i, tt, v, s in items)
    return f'<div class="channels">{cells}</div>'


def mapa():
    return f"""<figure class="map-card reveal">
      <div class="map-wrap"><iframe class="map-frame" title="{t('Mapa')}: {EMPRESA['rua']}, {EMPRESA['cidade']}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="{map_embed()}"></iframe></div>
      <figcaption>
        <div><span class="label accent">{t('Escritório')}</span><h3>Patrocínio, MG</h3><p>{EMPRESA['rua']} · CEP {EMPRESA['cep']}</p></div>
        <div class="map-actions">
          <a class="btn btn-solid btn-sm" href="{route_link()}" target="_blank" rel="noopener">{t('Traçar rota')} {ICONS['route']}</a>
          <a class="btn btn-ghost btn-sm" href="{map_link()}" target="_blank" rel="noopener">{t('Abrir no Google Maps')}</a>
        </div>
      </figcaption>
    </figure>"""


# ------------------------------------------------------------------
# Casca
# ------------------------------------------------------------------
def cur(key, current):
    return ' aria-current="page"' if key == current else ""


def lang_switch(name):
    pt = f"{name}.html" if LANG == "pt" else f"../{name}.html"
    en = f"en/{name}.html" if LANG == "pt" else f"{name}.html"
    on_pt = ' aria-current="true"' if LANG == "pt" else ""
    on_en = ' aria-current="true"' if LANG == "en" else ""
    return (f'<div class="lang" role="group" aria-label="Idioma · Language">'
            f'<a href="{pt}" hreflang="pt-BR" lang="pt-BR" title="Português" aria-label="Português"{on_pt}>{FLAG_BR}</a>'
            f'<a href="{en}" hreflang="en" lang="en" title="English" aria-label="English"{on_en}>{FLAG_US}</a></div>')


def header(current, theme, name):
    links = "".join(f'<a class="nav-link" href="{h}"{cur(k, current)}>{t(l)}</a>' for k, l, h, top in NAV if top)
    over = "".join(f'<li><a href="{h}"{cur(k, current)}>{t(l)}</a></li>' for k, l, h, _ in NAV)
    return f"""<a class="skip" href="#conteudo">{t('Pular para o conteúdo')}</a>
<div class="progress-bar" aria-hidden="true"></div>
<header class="site-header" data-theme="{theme}">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="{t('MC Miaki Coffee, página inicial')}">{LOGO_ESCURO}{LOGO_CLARO}</a>
    <nav class="nav" aria-label="{t('Principal')}">
      {links}
      <a class="btn btn-solid btn-sm" href="contato.html">{t('Fale conosco')} {ARROW}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu" data-l-open="{t('Menu')}" data-l-close="{t('Fechar')}"><span class="t">{t('Menu')}</span><span class="bars"></span></button>
    </nav>
    {lang_switch(name)}
  </div>
</header>
<div class="overlay" id="menu" data-open="false" aria-hidden="true" inert>
  <ol>{over}</ol>
  <div class="overlay-foot">
    <a href="tel:{EMPRESA['tel']}">{ICONS['phone']} {telefone()}</a>
    <a href="mailto:{EMPRESA['email']}">{ICONS['mail']} {EMPRESA['email']}</a>
    <a href="{EMPRESA['instagram']}" target="_blank" rel="noopener">{ICONS['instagram']} Instagram</a>
  </div>
</div>
"""


def footer():
    navs = "".join(f'<li><a href="{h}">{t(l)}</a></li>' for _, l, h, _t in NAV)
    nucs = "".join(f'<li><a href="fazendas.html#{n["id"]}">{nucleo_nome(n)}</a></li>' for n in NUCLEOS)
    pais = ", Brazil" if LANG == "en" else ""
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-cta">
        <p class="label muted">{t('Vamos conversar')}</p>
        <p class="foot-lead">{t('Procura cafés especiais, sustentáveis e rastreáveis do Cerrado Mineiro? Fale com a família que produz.')}</p>
        <div class="foot-actions">
          <a class="btn btn-solid" href="contato.html">{t('Entrar em contato')} {ARROW}</a>
          <a class="btn btn-ghost" href="{amostras_mail()}">{t('Pedir amostras')}</a>
        </div>
      </div>
      <div class="foot-social" aria-label="{t('Redes sociais')}">
        <a href="{EMPRESA['instagram']}" target="_blank" rel="noopener" aria-label="Instagram">{ICONS['instagram']}</a>
        <a href="{EMPRESA['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{ICONS['facebook']}</a>
        <a href="{EMPRESA['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{ICONS['youtube']}</a>
        <a href="mailto:{EMPRESA['email']}" aria-label="E-mail">{ICONS['mail']}</a>
      </div>
    </div>
    <div class="foot-grid">
      <div class="intro">
        <a class="brand" href="index.html" aria-label="MC Miaki Coffee">{LOGO_CLARO}</a>
        <p>{t('Cafés especiais, sustentáveis e 100% rastreáveis de um terroir vulcânico único, o Chapadão de Ferro, em Patrocínio, no Cerrado Mineiro.')}</p>
      </div>
      <div><h4>{t('Navegação')}</h4><ul>{navs}</ul></div>
      <div><h4>{t('Fazendas')}</h4><ul>{nucs}</ul></div>
      <div><h4>{t('Contato')}</h4><ul>
        <li><a href="tel:{EMPRESA['tel']}">{telefone()}</a></li>
        <li><a href="mailto:{EMPRESA['email']}">{EMPRESA['email']}</a></li>
        <li>{EMPRESA['rua']}<br>{EMPRESA['cidade']} · {EMPRESA['cep']}</li>
        <li><a class="foot-route" href="{route_link()}" target="_blank" rel="noopener">{ICONS['route']} {t('Como chegar')}</a></li>
      </ul></div>
      <div><h4>{t('Certificações')}</h4><ul class="creds">
        <li><a href="certificacoes.html#rainforest">Rainforest Alliance</a></li><li><a href="certificacoes.html#aaa">Nespresso AAA</a></li><li><a href="certificacoes.html#cafe">C.A.F.E. Practices</a></li><li><a href="certificacoes.html#cerrado">{t('Região do Cerrado Mineiro')}</a></li>
      </ul></div>
    </div>
  </div>
  <div class="foot-word" aria-hidden="true"><i>MC</i> Miaki</div>
  <div class="wrap">
    <div class="foot-bottom">
      <span>&copy; <span data-year>2026</span> MC Miaki Coffee · Patrocínio, Minas Gerais{pais}</span>
      <a class="dev-by" href="https://achillesmedia.com.br" target="_blank" rel="noopener">{t('Desenvolvido por')} <strong>Achilles</strong></a>
      <button class="to-top" type="button" data-top>{t('Voltar ao topo')} {ICONS['up']}</button>
    </div>
  </div>
</footer>
<div class="vmodal" id="vmodal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="{t('Vídeo')}" inert>
  <div class="vmodal-box"><div class="vmodal-frame"></div><div class="vmodal-bar"><strong class="vmodal-title"></strong><a class="vmodal-link" href="{EMPRESA['youtube']}" target="_blank" rel="noopener">{ICONS['youtube']} {t('Ver no YouTube')}</a></div></div>
  <button class="vmodal-close" type="button" aria-label="{t('Fechar vídeo')}">{ICONS['close']}</button>
</div>
<dialog class="lightbox" aria-label="{t('Foto ampliada')}"><img src="" alt=""><p class="label"></p><button type="button" class="lb-close" aria-label="{t('Fechar')}">{ICONS['close']}</button></dialog>
"""


def page_url(name, lang):
    base = f"{SITE}/" if lang == "pt" else f"{SITE}/en/"
    return base if name == "index" else f"{base}{name}.html"


def page(meta, body, name):
    title = meta["title"]
    full = f"{title} | MC Miaki Coffee" if name != "index" else title
    url = page_url(name, LANG)
    ld = {"@context": "https://schema.org", "@type": "Organization", "name": EMPRESA["nome"], "url": SITE,
          "logo": f"{SITE}/assets/logo-mcmiaki.svg", "email": EMPRESA["email"], "telephone": "+55 34 3831-1481",
          "address": {"@type": "PostalAddress", "streetAddress": EMPRESA["rua"], "addressLocality": "Patrocínio",
                      "addressRegion": "MG", "postalCode": EMPRESA["cep"], "addressCountry": "BR"},
          "sameAs": [EMPRESA["instagram"], EMPRESA["facebook"], EMPRESA["youtube"]]}
    html_lang = "en" if LANG == "en" else "pt-BR"
    locale = "en_US" if LANG == "en" else "pt_BR"
    html = f"""<!doctype html>
<html lang="{html_lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full}</title>
<meta name="description" content="{meta['description']}">
<meta name="theme-color" content="#10130f">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="pt-BR" href="{page_url(name, 'pt')}">
<link rel="alternate" hreflang="en" href="{page_url(name, 'en')}">
<link rel="alternate" hreflang="x-default" href="{page_url(name, 'pt')}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{locale}">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{meta['description']}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-mcmiaki.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Geist:wght@200..600&family=Geist+Mono:wght@300..500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v={V}">
<script>document.documentElement.classList.replace('no-js','js')</script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{meta.get('head', '')}</head>
<body data-page="{name}">
{header(meta.get('nav', name), meta.get('theme', 'light'), name)}
<main id="conteudo">
{body.strip()}
</main>
{footer()}<script src="assets/js/main.js?v={V}" defer></script>
</body>
</html>
"""
    if LANG == "en":
        # as páginas em inglês ficam em /en/: os arquivos estáticos sobem um nível
        html = re.sub(r'(=["\'])assets/', r"\1../assets/", html)
    return html


def render(body):
    rep = {
        "{{ARROW}}": lambda: ARROW, "{{NUCLEOS_LISTA}}": nucleos_lista, "{{NUCLEOS_FICHAS}}": nucleos_fichas,
        "{{NUCLEOS_NAV}}": nucleos_nav, "{{ALTITUDES}}": altitudes, "{{PREMIOS}}": premios,
        "{{SELOS}}": selos, "{{GALERIA}}": galeria, "{{VIDEOS}}": videos, "{{CINE}}": cine, "{{CERTS}}": certs,
        "{{CANAIS}}": canais, "{{MAPA}}": mapa, "{{EMAIL}}": lambda: EMPRESA["email"], "{{TEL}}": lambda: EMPRESA["tel"],
        "{{TELEFONE}}": telefone, "{{INSTAGRAM}}": lambda: EMPRESA["instagram"], "{{YOUTUBE}}": lambda: EMPRESA["youtube"],
        "{{ROTA}}": route_link,
    }
    for a, f in rep.items():
        if a in body:
            body = body.replace(a, f())
    body = re.sub(r"\{\{FILME:([\w-]+)\}\}", lambda m: filme(m.group(1)), body)
    return re.sub(r"\{\{ICON:(\w+)\}\}", lambda m: ICONS[m.group(1)], body)


def build_lang(lang):
    global LANG
    LANG = lang
    src_dir = PAGES if lang == "pt" else PAGES / "en"
    out_dir = OUT if lang == "pt" else OUT / "en"
    out_dir.mkdir(exist_ok=True)
    urls = []
    for src in sorted(src_dir.glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->", raw, re.S)
        if not m:
            raise SystemExit(f"{lang}/{src.name}: faltando bloco <!--meta-->")
        meta = json.loads(m.group(1))
        html = page(meta, render(raw[m.end():]), src.stem)
        for bad in ("—", "–"):
            if bad in html:
                raise SystemExit(f"{lang}/{src.name}: contém travessão ({bad!r}); troque por outra pontuação")
        if "{{" in html:
            raise SystemExit(f"{lang}/{src.name}: marcador não substituído")
        (out_dir / f"{src.stem}.html").write_text(html, encoding="utf-8")
        urls.append(page_url(src.stem, lang))
        print("ok", lang, src.stem + ".html")
    return urls


def main():
    pt = {p.stem for p in PAGES.glob("*.html")}
    en = {p.stem for p in (PAGES / "en").glob("*.html")}
    if pt != en:
        raise SystemExit(f"páginas sem par entre os idiomas: {sorted(pt ^ en)}")
    urls = build_lang("pt") + build_lang("en")
    if FALTANDO:
        raise SystemExit("faltam traduções em src/i18n_en.py:\n  " + "\n  ".join(sorted(FALTANDO)))
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + "".join(f"<url><loc>{u}</loc></url>" for u in urls) + "</urlset>\n", encoding="utf-8")


if __name__ == "__main__":
    main()
