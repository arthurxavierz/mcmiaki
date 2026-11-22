/* MC Miaki Coffee · Achilles Media */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('pt-BR'); };
  var mobile = function () { return window.innerWidth <= 960; };
  if (reduz) doc.classList.add('sem-mov');

  function guarda(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- Abertura ---------------- */
  var intro = $('.intro');
  function pronto() {
    doc.classList.add('is-pronto');
    sobeAltimetro();
    contaHero();
  }
  if (!intro || reduz || guarda('mcm-intro')) {
    doc.classList.add('sem-intro');
    requestAnimationFrame(pronto);
  } else {
    var alvo = $('[data-intro-alt]'), t0 = null, dur = 1500;
    var passo = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      alvo.textContent = String(Math.round(e * 1250)).padStart(4, '0');
      if (p < 1) requestAnimationFrame(passo);
      else setTimeout(function () {
        intro.classList.add('is-fora'); guarda('mcm-intro', '1');
        setTimeout(pronto, 250);
        setTimeout(function () { intro.remove(); }, 1300);
      }, 380);
    };
    setTimeout(function () { requestAnimationFrame(passo); }, 350);
  }

  /* ---------------- Topo ---------------- */
  var topo = $('[data-topo]'), ultimoY = 0;
  var escuros = $$('.hero, .escuro, .escuro-verde, .cafeeira, .rodape');
  function topoRola() {
    var y = window.scrollY;
    topo.classList.toggle('is-solido', y > 40);
    topo.classList.toggle('is-escondido', y > 700 && y > ultimoY + 4 && !document.body.classList.contains('menu-aberto'));
    if (y < ultimoY - 4 || y < 700) topo.classList.remove('is-escondido');
    ultimoY = y;
    var sobre = escuros.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom >= 40; });
    topo.classList.toggle('is-sobre-escuro', sobre);
  }

  var btnMenu = $('[data-menu]'), gaveta = $('[data-gaveta]');
  function menu(abre) {
    btnMenu.setAttribute('aria-expanded', abre ? 'true' : 'false');
    btnMenu.setAttribute('aria-label', abre ? 'Fechar menu' : 'Abrir menu');
    gaveta.hidden = !abre;
    document.body.classList.toggle('menu-aberto', abre);
  }
  btnMenu.addEventListener('click', function () { menu(gaveta.hidden); });
  $$('a', gaveta).forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gaveta.hidden) menu(false); });

  /* link ativo */
  var links = $$('.topo-nav a');
  if ('IntersectionObserver' in window) {
    var ioNav = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-ativo', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) ioNav.observe(s); });
  }

  /* ---------------- Hero ---------------- */
  var hero = $('[data-hero]');
  var fotos = $$('.hf');
  var fi = 0;
  if (!reduz && fotos.length > 1) {
    setInterval(function () {
      if (document.hidden) return;
      fotos[fi].classList.remove('is-on');
      fi = (fi + 1) % fotos.length;
      fotos[fi].classList.add('is-on');
    }, 6500);
  }

  function sobeAltimetro() {
    var reg = $('.altimetro'), out = $('[data-alt]');
    if (!reg || !out) return;
    var t0 = null, dur = 1800;
    reg.style.setProperty('--alt-p', 1250 / 1400);
    if (reduz) return;
    var f = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      out.textContent = fmt(e * 1250);
      if (p < 1) requestAnimationFrame(f);
    };
    reg.style.setProperty('--alt-p', 0);
    requestAnimationFrame(function () { reg.style.setProperty('--alt-p', 1250 / 1400); requestAnimationFrame(f); });
  }

  function contaHero() {
    $$('[data-conta]', hero).forEach(function (el, i) {
      var fim = +el.dataset.conta;
      if (reduz) { el.textContent = fmt(fim); return; }
      var t0 = null, dur = 1600 + i * 150;
      var f = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(e * fim);
        if (p < 1) requestAnimationFrame(f);
      };
      setTimeout(function () { requestAnimationFrame(f); }, 700);
    });
  }

  /* ---------------- Topografia viva (curvas de nível da cratera) ---------------- */
  (function topografia() {
    var cv = $('[data-topografia]');
    if (!cv || !cv.getContext) return;
    var cx = cv.getContext('2d');
    var W, H, dpr, cols, rows, cel, campo, mx = -1e4, my = -1e4, mxs = -1e4, mys = -1e4, visivel = true, quadro = 0;

    // ruído gradiente 2D
    var perm = new Uint8Array(512), gx = [], gy = [];
    (function () {
      var p = [], s = 1250;
      for (var i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; var j = s % (i + 1); var t = p[i]; p[i] = p[j]; p[j] = t; }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255];
      for (i = 0; i < 256; i++) { var a = i / 256 * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
    })();
    function ruido(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      xi &= 255; yi &= 255;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = perm[xi + perm[yi]], b = perm[xi + 1 + perm[yi]], c = perm[xi + perm[yi + 1]], d = perm[xi + 1 + perm[yi + 1]];
      var n00 = gx[a] * xf + gy[a] * yf, n10 = gx[b] * (xf - 1) + gy[b] * yf;
      var n01 = gx[c] * xf + gy[c] * (yf - 1), n11 = gx[d] * (xf - 1) + gy[d] * (yf - 1);
      var x1 = n00 + u * (n10 - n00), x2 = n01 + u * (n11 - n01);
      return x1 + v * (x2 - x1);
    }

    function medir() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cel = W < 700 ? 9 : 8;
      cols = Math.ceil(W / cel) + 1; rows = Math.ceil(H / cel) + 1;
      campo = new Float32Array(cols * rows);
    }

    function calcula(t) {
      var ccx = W < 700 ? W * .62 : W * .7, ccy = H * .52, esc = Math.min(W, H) * (W < 700 ? .5 : .42);
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = i * cel, y = j * cel;
          var dx = (x - ccx) / esc, dy = (y - ccy) / (esc * .82);
          var r = Math.sqrt(dx * dx + dy * dy);
          var borda = Math.exp(-((r - 1) * (r - 1)) / .09);
          var bacia = -.55 * Math.exp(-(r * r) / .14);
          var n = ruido(x * .0042 + t * .06, y * .0042 - t * .04) * .5 + ruido(x * .011 - t * .05, y * .011) * .18;
          var mdx = x - mxs, mdy = y - mys;
          var lupa = .55 * Math.exp(-(mdx * mdx + mdy * mdy) / 16000);
          campo[j * cols + i] = borda * 1.15 + bacia - r * .32 + n + lupa;
        }
      }
    }

    function desenha(t) {
      calcula(t);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      var min = -1.1, max = 1.5, passo = .085, destaque = 0.86;
      for (var lv = min; lv < max; lv += passo) {
        var forte = Math.abs(lv - destaque) < passo / 2;
        cx.beginPath();
        for (var j = 0; j < rows - 1; j++) {
          for (var i = 0; i < cols - 1; i++) {
            var k = j * cols + i;
            var a = campo[k], b = campo[k + 1], c = campo[k + cols + 1], d = campo[k + cols];
            var id = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
            if (id === 0 || id === 15) continue;
            var x = i * cel, y = j * cel;
            var top = x + cel * (lv - a) / (b - a), dir = y + cel * (lv - b) / (c - b);
            var bai = x + cel * (lv - d) / (c - d), esq = y + cel * (lv - a) / (d - a);
            switch (id) {
              case 1: case 14: cx.moveTo(x, esq); cx.lineTo(bai, y + cel); break;
              case 2: case 13: cx.moveTo(bai, y + cel); cx.lineTo(x + cel, dir); break;
              case 3: case 12: cx.moveTo(x, esq); cx.lineTo(x + cel, dir); break;
              case 4: case 11: cx.moveTo(top, y); cx.lineTo(x + cel, dir); break;
              case 5: cx.moveTo(x, esq); cx.lineTo(top, y); cx.moveTo(bai, y + cel); cx.lineTo(x + cel, dir); break;
              case 6: case 9: cx.moveTo(top, y); cx.lineTo(bai, y + cel); break;
              case 7: case 8: cx.moveTo(x, esq); cx.lineTo(top, y); break;
              case 10: cx.moveTo(top, y); cx.lineTo(x + cel, dir); cx.moveTo(x, esq); cx.lineTo(bai, y + cel); break;
            }
          }
        }
        if (forte) { cx.strokeStyle = 'rgba(255, 96, 76, .85)'; cx.lineWidth = 1.4; }
        else { cx.strokeStyle = 'rgba(243, 236, 225, ' + (.1 + Math.max(0, lv) * .12).toFixed(3) + ')'; cx.lineWidth = .8; }
        cx.stroke();
      }
    }

    var t0 = performance.now();
    function laco(now) {
      if (visivel && !document.hidden) {
        quadro++;
        mxs += (mx - mxs) * .08; mys += (my - mys) * .08;
        if (quadro % 2 === 0) desenha((now - t0) / 1000);
      }
      requestAnimationFrame(laco);
    }
    medir();
    window.addEventListener('resize', function () { medir(); if (reduz) desenha(0); });
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (mxs < -1000) { mxs = mx; mys = my; } });
    hero.addEventListener('pointerleave', function () { mx = -1e4; my = -1e4; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }).observe(hero);
    if (reduz) desenha(0); else requestAnimationFrame(laco);
  })();

  /* ---------------- Manifesto palavra por palavra ---------------- */
  var poema = $('[data-palavras]'), palavras = [];
  if (poema) {
    poema.innerHTML = poema.textContent.trim().split(/\s+/).map(function (w) { return '<span class="p">' + w + '</span>'; }).join(' ');
    palavras = $$('.p', poema);
  }
  function poemaRola() {
    if (!palavras.length || reduz) return;
    var r = poema.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * .82 - r.top) / (r.height + vh * .35);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * palavras.length);
    palavras.forEach(function (w, i) { w.classList.toggle('is-on', i < n); });
  }

  /* ---------------- Paralaxe ---------------- */
  var para = $$('[data-para]');
  function paraRola() {
    if (reduz) return;
    var vh = window.innerHeight;
    para.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2 - vh / 2);
      var alvo = el.tagName === 'FIGURE' ? el : el.querySelector('img');
      alvo.style.setProperty('--py', (c * +el.dataset.para).toFixed(1) + 'px');
    });
  }

  /* ---------------- Terroir: corte do vulcão ---------------- */
  var corte = $('[data-corte]'), palco = $('[data-terroir]'), passos = $$('.ter-passo');
  var NS = 'http://www.w3.org/2000/svg';
  if (corte) {
    // minerais espalhados no solo
    var gm = $('[data-minerais]'), s = 7, rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
    var cores = ['#d9a441', '#c2c7cc', '#8c4b2f', '#e8d6a8', '#b0412a', '#6f7c84'];
    for (var i = 0; i < 170; i++) {
      var x = rnd() * 800, y = 200 + rnd() * 270;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', (1.2 + rnd() * 3.2).toFixed(1));
      c.setAttribute('fill', cores[i % cores.length]);
      c.style.transitionDelay = (rnd() * .9).toFixed(2) + 's';
      gm.appendChild(c);
    }
    // pés de café nas encostas internas e externas próximas da borda
    var gc = $('[data-cafezais]');
    // acha o y da curva para cada x, para assentar os pés no terreno
    var linha = $('.perfil', corte), tot = linha.getTotalLength(), amostra = [];
    for (var a = 0; a <= 400; a++) { var pt = linha.getPointAtLength(tot * a / 400); amostra.push([pt.x, pt.y]); }
    var yEm = function (x) { var m = amostra.reduce(function (b, q) { return Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b; }); return m[1]; };
    var pontos = [222, 240, 258, 284, 300, 316, 332, 468, 484, 500, 516, 542, 560, 578].map(function (x) { return [x, yEm(x) + 2]; });
    pontos.forEach(function (p, k) {
      var g = document.createElementNS(NS, 'g');
      g.style.transitionDelay = (k * .06).toFixed(2) + 's';
      var y = p[1] - 9;
      g.innerHTML = '<circle cx="' + p[0] + '" cy="' + y + '" r="8"/><circle cx="' + (p[0] - 5) + '" cy="' + (y + 4) + '" r="5.5"/><circle cx="' + (p[0] + 5) + '" cy="' + (y + 4) + '" r="5.5"/><circle class="fr" cx="' + (p[0] + 2) + '" cy="' + (y + 2) + '" r="1.8"/><circle class="fr" cx="' + (p[0] - 3) + '" cy="' + (y + 5) + '" r="1.6"/>';
      gc.appendChild(g);
    });
  }
  var passoAtual = 0;
  function definePasso(n) {
    if (n === passoAtual) return;
    passoAtual = n;
    corte.setAttribute('data-passo', n);
    passos.forEach(function (p) { p.classList.toggle('is-on', +p.dataset.passo === n); });
  }
  function terroirRola() {
    if (!palco || mobile()) return;
    var r = palco.getBoundingClientRect(), vh = window.innerHeight;
    var p = (-r.top) / (r.height - vh);
    var n = p < -.25 ? 0 : p < .22 ? 1 : p < .47 ? 2 : p < .72 ? 3 : 4;
    if (r.top < vh * .6 && n === 0) n = 1;
    definePasso(n);
  }
  if (passos.length && 'IntersectionObserver' in window) {
    var ioPasso = new IntersectionObserver(function (es) {
      if (!mobile()) return;
      es.forEach(function (e) { if (e.isIntersecting) definePasso(+e.target.dataset.passo); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    passos.forEach(function (p) { ioPasso.observe(p); });
  }
  if (reduz && corte) definePasso(4);

  /* ---------------- Linhas horizontais presas na rolagem ---------------- */
  var horizontais = $$('[data-horizontal]').map(function (sec) {
    return { sec: sec, trilho: $('[data-trilho]', sec), barra: $('[data-lt-barra]', sec), dist: 0 };
  });
  function horizMede() {
    horizontais.forEach(function (h) {
      if (mobile() || reduz) { h.sec.style.height = ''; h.trilho.style.transform = ''; h.dist = 0; return; }
      h.dist = Math.max(0, h.trilho.scrollWidth - window.innerWidth);
      h.sec.style.height = (window.innerHeight + h.dist) + 'px';
    });
  }
  function horizRola() {
    horizontais.forEach(function (h) {
      var p;
      if (mobile() || reduz) {
        var max = h.trilho.scrollWidth - h.trilho.clientWidth;
        p = max > 0 ? h.trilho.scrollLeft / max : 0;
      } else {
        var r = h.sec.getBoundingClientRect();
        p = Math.max(0, Math.min(1, -r.top / Math.max(1, h.dist)));
        h.trilho.style.transform = 'translate3d(' + (-p * h.dist).toFixed(1) + 'px,0,0)';
      }
      if (h.barra) h.barra.style.setProperty('--lt', p.toFixed(4));
    });
  }
  horizontais.forEach(function (h) { h.trilho.addEventListener('scroll', horizRola, { passive: true }); });

  /* ---------------- Núcleos ---------------- */
  var NUCLEOS = [
    { id: 'recanto', nome: 'Recanto', regiao: 'Chapadão de Ferro', foto: 'arco-iris', faz: 'Fazendas Nossa Senhora de Fátima, Nossa Senhora Aparecida e Recanto', alt: [1250, 1250], total: '538,31', cult: '493', prod: '35', var: 'Icatu, Tupi, Catuaí, Mundo Novo e outras', colheita: '97,8% mecanizada e 2,2% manual', proc: [1, 46, 53], sec: 'Parte em terreiro e parte no secador' },
    { id: 'portadoceu', nome: 'Porta do Céu', regiao: 'Chapadão de Ferro', foto: 'porta-do-ceu', faz: 'Fazendas Chapadão de Ferro e Porta do Céu', alt: [1170, 1235], total: '465,2', cult: '333', prod: '35', var: 'Catuaí 99, IAC, IBC 12, Topázio, Mundo Novo e outras', colheita: '85% mecanizada e 15% manual', proc: [5, 70, 25], sec: 'Parte em terreiro e parte no secador' },
    { id: 'shalom', nome: 'Shalom', regiao: 'Chapadão de Ferro', foto: 'sao-matheus', faz: 'Fazendas Centenário, Shalom e São Matheus', alt: [1200, 1200], total: '732,05', cult: '610,06', prod: '35', var: 'Catuaí 99, Catuaí 62, Catuaí, Topázio, Mundo Novo, IBC 12 e outras', colheita: '100% mecanizada', proc: [0, 80, 20], sec: 'Parte em terreiro e parte no secador' },
    { id: 'abadia', nome: 'Abadia', regiao: 'Tejuco · Cerrado Mineiro', foto: 'abadia', faz: 'Fazendas Abadia I, Abadia II e Abadia III', alt: [980, 1050], total: '234,98', cult: '196', prod: '40', var: 'Topázio e outras', colheita: '100% mecanizada', proc: null, procTxt: 'Natural, cereja descascado e despolpado', sec: 'Parte em terreiro e parte no secador' },
    { id: 'bomjardim', nome: 'Bom Jardim', regiao: 'Cerrado Mineiro', foto: 'bom-jardim', faz: 'Fazenda Bom Jardim', alt: [900, 996], total: '380', cult: '285', prod: null, var: 'Catuaí 62, Catuaí 144, Catuaí 99, Guará, Topázio, Arara, Castillo, IBC 12 e outras', colheita: 'Manual', proc: null, sec: null },
    { id: 'lajinha', nome: 'Lajinha', regiao: 'Lajinha · Cerrado Mineiro', foto: 'sao-jose', faz: 'Fazendas São José, Santos Reis I, II e III, Lajinha e Nossa Senhora da Guia', alt: [850, 914], total: '851,56', cult: '501', prod: '40', var: 'Catuaí 99, Catuaí 62, Catuaí 144, Topázio, Mundo Novo, IBC 12, Acaiá, Acauã e outras', colheita: '100% mecanizada', proc: [9, 0, 91], sec: 'Parte em terreiro e parte no secador' }
  ];
  var PROC = [['Natural', '#c41e24'], ['Cereja descascado', '#e0a83d'], ['Despolpado', '#6f8f4e']];
  var perfil = $('[data-perfil]'), abas = $('[data-abas]'), ficha = $('[data-ficha]');
  var altTxt = function (a) { return a[0] === a[1] ? fmt(a[0]) + ' m' : fmt(a[0]) + ' a ' + fmt(a[1]) + ' m'; };

  function montaPerfil() {
    if (!perfil) return;
    var L = 50, R = 10, T = 18, B = 44, Wv = 640, Hv = 360, y0 = 800, y1 = 1300;
    var ys = function (v) { return T + (Hv - T - B) * (1 - (v - y0) / (y1 - y0)); };
    var h = '';
    h += '<rect class="chap" x="' + L + '" y="' + ys(1300) + '" width="' + (Wv - L - R) + '" height="' + (ys(1170) - ys(1300)) + '"/>';
    h += '<text class="chap-t" x="' + (Wv - R - 8) + '" y="' + (ys(1300) + 16) + '" text-anchor="end">CHAPADÃO DE FERRO · ACIMA DE 1.170 M</text>';
    for (var v = 800; v <= 1300; v += 100) {
      h += '<line class="grade-l" x1="' + L + '" x2="' + (Wv - R) + '" y1="' + ys(v) + '" y2="' + ys(v) + '"/>';
      h += '<text class="grade-t" x="' + (L - 10) + '" y="' + (ys(v) + 4) + '" text-anchor="end">' + fmt(v) + '</text>';
    }
    var col = (Wv - L - R) / NUCLEOS.length, bw = Math.min(54, col * .5);
    NUCLEOS.forEach(function (n, i) {
      var cxp = L + col * i + col / 2, topo = ys(n.alt[1]), base = ys(y0);
      h += '<g class="barra-g" data-id="' + n.id + '" tabindex="-1">';
      h += '<rect class="barra" x="' + (cxp - bw / 2) + '" y="' + topo + '" width="' + bw + '" height="' + (base - topo) + '" rx="3" style="transition-delay:' + (i * .08) + 's"/>';
      if (n.alt[0] !== n.alt[1]) h += '<line x1="' + (cxp - bw / 2 - 5) + '" x2="' + (cxp + bw / 2 + 5) + '" y1="' + ys(n.alt[0]) + '" y2="' + ys(n.alt[0]) + '" stroke="rgba(243,236,225,.55)" stroke-dasharray="3 3"/>';
      h += '<text class="barra-v" x="' + cxp + '" y="' + (topo - 8) + '">' + fmt(n.alt[1]) + '</text>';
      h += '<text class="barra-n" x="' + cxp + '" y="' + (Hv - 18) + '">' + n.nome + '</text>';
      h += '</g>';
    });
    perfil.innerHTML = h;
    $$('.barra-g', perfil).forEach(function (g) { g.addEventListener('click', function () { escolhe(g.dataset.id, true); }); });
    abas.innerHTML = NUCLEOS.map(function (n) { return '<button type="button" role="tab" aria-selected="false" data-id="' + n.id + '">' + n.nome + '</button>'; }).join('');
    $$('button', abas).forEach(function (b) { b.addEventListener('click', function () { escolhe(b.dataset.id, true); }); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { perfil.classList.add('is-visto'); o.disconnect(); } }, { threshold: .3 }).observe(perfil);
    } else perfil.classList.add('is-visto');
    escolhe('portadoceu');
  }

  function escolhe(id, manual) {
    var n = NUCLEOS.filter(function (x) { return x.id === id; })[0];
    if (!n) return;
    $$('.barra-g', perfil).forEach(function (g) { g.classList.toggle('is-sel', g.dataset.id === id); });
    $$('button', abas).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'); });
    var dados = '<div><dt>Altitude</dt><dd>' + altTxt(n.alt) + '</dd></div>' +
      '<div><dt>Área total</dt><dd>' + n.total + ' ha</dd></div>' +
      '<div><dt>Área cultivada</dt><dd>' + n.cult + ' ha</dd></div>' +
      (n.prod ? '<div><dt>Produtividade média</dt><dd>' + n.prod + ' sc/ha</dd></div>' : '') +
      '<div><dt>Colheita</dt><dd>' + n.colheita.replace(' e ', '<br>e ') + '</dd></div>' +
      '<div><dt>Município</dt><dd>Patrocínio, MG</dd></div>';
    var proc = '';
    if (n.proc) {
      proc = '<div class="proc-barra"><span class="mono">Tipos de processamento</span><div class="proc-faixa">' +
        n.proc.map(function (v, k) { return v ? '<i style="width:' + v + '%;background:' + PROC[k][1] + '" title="' + PROC[k][0] + ' ' + v + '%"></i>' : ''; }).join('') +
        '</div><div class="proc-leg">' +
        n.proc.map(function (v, k) { return v ? '<span style="--c:' + PROC[k][1] + '">' + PROC[k][0] + ' ' + v + '%</span>' : ''; }).join('') + '</div></div>';
    } else if (n.procTxt) {
      proc = '<p class="linha-info"><b>Processamento:</b> ' + n.procTxt + '</p>';
    }
    ficha.innerHTML =
      '<div class="ficha-foto"><img src="assets/img/' + n.foto + '.jpg" alt="Lavouras do núcleo ' + n.nome + '"><span class="mono">' + n.regiao + '</span></div>' +
      '<div class="ficha-corpo"><h3>Núcleo ' + n.nome + '</h3><p class="faz">' + n.faz + '</p><dl>' + dados + '</dl>' +
      proc +
      '<p class="linha-info"><b>Variedades:</b> ' + n.var + '</p>' +
      (n.sec ? '<p class="linha-info"><b>Secagem:</b> ' + n.sec + '</p>' : '') +
      '<p class="linha-info"><b>Certificações:</b> Rainforest Alliance, Nespresso AAA e C.A.F.E. Practices</p></div>';
    if (manual && mobile()) ficha.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
  }
  montaPerfil();

  /* ---------------- Prêmios: foto que segue o cursor ---------------- */
  var placar = $('[data-placar]'), pf = $('[data-placar-foto]');
  if (placar && pf && window.matchMedia('(hover: hover)').matches) {
    var pimg = $('img', pf), px = 0, py = 0, fx = 0, fy = 0, ativo = false;
    $$('li', placar).forEach(function (li) {
      li.addEventListener('pointerenter', function () { pimg.src = li.dataset.foto; pf.classList.add('is-on'); ativo = true; });
      li.addEventListener('pointerleave', function () { pf.classList.remove('is-on'); ativo = false; });
    });
    placar.addEventListener('pointermove', function (e) { px = e.clientX + 170; py = e.clientY; if (!fx) { fx = px; fy = py; } });
    (function segue() {
      fx += (px - fx) * .14; fy += (py - fy) * .14;
      if (ativo) pf.style.left = fx + 'px', pf.style.top = fy + 'px';
      requestAnimationFrame(segue);
    })();
  }

  /* ---------------- Revelação ---------------- */
  $$('.cab, .fam-foto, .fam-texto, .nuc-grafico, .ficha, .cafe, .b, .selos-lista li, .placar li, .m, .ct-info, .ct-form, .ter-final > *').forEach(function (el) { el.setAttribute('data-rev', ''); });
  if ('IntersectionObserver' in window && !reduz) {
    var ioRev = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var irmaos = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
        e.target.style.transitionDelay = Math.min(irmaos, 6) * 70 + 'ms';
        e.target.classList.add('is-visto');
        ioRev.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    $$('[data-rev]').forEach(function (el) { ioRev.observe(el); });
    // cafés: a cereja perde as camadas quando aparece
    var ioCafe = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setTimeout(function () { e.target.classList.add('is-visto'); }, 500); }); }, { threshold: .6 });
    $$('.cafe').forEach(function (c) { ioCafe.observe(c); });
  } else {
    $$('[data-rev], .cafe').forEach(function (el) { el.classList.add('is-visto'); });
  }

  /* ---------------- Galeria ---------------- */
  var lb = $('.lightbox');
  if (lb && lb.showModal) {
    var lbImg = $('img', lb), lbTxt = $('p', lb);
    $$('[data-mosaico] .m').forEach(function (b) {
      b.addEventListener('click', function () {
        var im = $('img', b);
        lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbTxt.textContent = im.alt;
        lb.showModal();
      });
    });
    $('.lb-fechar', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------------- Formulário (abre o e-mail) ---------------- */
  var form = $('[data-form]');
  $$('[data-assunto]').forEach(function (a) {
    a.addEventListener('click', function () {
      var r = form && form.querySelector('input[name="assunto"][value="' + a.dataset.assunto + '"]');
      if (r) r.checked = true;
    });
  });
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['nome', 'mensagem'].forEach(function (k) {
        var el = form.elements[k];
        var vazio = !el.value.trim();
        el.classList.toggle('is-erro', vazio);
        if (vazio && ok) { el.focus(); ok = false; }
      });
      if (!ok) { $('[data-form-obs]').textContent = 'Preencha nome e mensagem, por favor.'; return; }
      var f = form.elements;
      var assunto = (form.querySelector('input[name="assunto"]:checked') || {}).value || 'Contato pelo site';
      var corpo = f.mensagem.value.trim() + '\n\n' + f.nome.value.trim() + (f.empresa.value.trim() ? '\n' + f.empresa.value.trim() : '') + '\n\n(enviado pelo site mcmiaki)';
      window.location.href = 'mailto:contato@mcmiaki.coffee?subject=' + encodeURIComponent(assunto + ' · ' + f.nome.value.trim()) + '&body=' + encodeURIComponent(corpo);
      $('[data-form-obs]').textContent = 'Seu e-mail foi aberto com a mensagem pronta. É só enviar.';
    });
  }

  $$('.ano').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------- Laço de rolagem ---------------- */
  var pedido = false;
  function rola() {
    pedido = false;
    topoRola();
    if (hero) {
      var p = Math.max(0, Math.min(1, window.scrollY / (hero.offsetHeight * .8)));
      hero.style.setProperty('--rolagem', reduz ? 0 : p.toFixed(3));
    }
    poemaRola(); paraRola(); terroirRola(); horizRola();
  }
  function pede() { if (!pedido) { pedido = true; requestAnimationFrame(rola); } }
  window.addEventListener('scroll', pede, { passive: true });
  window.addEventListener('resize', function () { horizMede(); pede(); });
  window.addEventListener('load', function () { horizMede(); pede(); });
  horizMede(); rola();
})();
