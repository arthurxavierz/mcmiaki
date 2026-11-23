/* MC Miaki Coffee · Achilles Media */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var EN = /^en/i.test(doc.lang);
  var fmt = function (n) { return Math.round(n).toLocaleString(EN ? "en-US" : "pt-BR"); };
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Cortina: altímetro sobe até 1.250 m ---------- */
  var alt = $("[data-alt]");
  if (alt && doc.classList.contains("intro")) {
    var t0 = null;
    var stepAlt = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
      alt.textContent = String(Math.round(e * 1250)).padStart(4, "0");
      if (p < 1) requestAnimationFrame(stepAlt);
    };
    requestAnimationFrame(stepAlt);
  }

  /* ---------- Cabeçalho, progresso e paralaxe ---------- */
  var header = $(".site-header"), bar = $(".progress-bar"), last = 0;
  var heroMedia = $(".hero-media video, .page-hero .ph-media video, .page-hero .ph-media img");
  var paras = $$("[data-parallax], .banner-media img");
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-solid", y > 40);
    var hide = y > 600 && y > last + 4 && !document.body.classList.contains("menu-open");
    if (hide) header.classList.add("is-hidden"); else if (y < last - 4 || y < 600) header.classList.remove("is-hidden");
    last = y;
    if (bar) bar.style.setProperty("--p", h > 0 ? (y / h).toFixed(4) : 0);
    if (reduce) return;
    if (heroMedia && y < window.innerHeight * 1.2) heroMedia.style.setProperty("--hy", (y * 0.25).toFixed(1) + "px");
    var vh = window.innerHeight;
    paras.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var k = +(img.getAttribute("data-parallax") || 60);
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = "translateY(" + (c * -k).toFixed(1) + "px) scale(1.12)";
    });
    timelineProgress();
    sweep();
  }
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });

  /* ---------- Menu tela cheia ---------- */
  var toggle = $(".menu-toggle"), overlay = $(".overlay");
  function setMenu(open) {
    overlay.setAttribute("data-open", open ? "true" : "false");
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) overlay.removeAttribute("inert"); else overlay.setAttribute("inert", "");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
    $(".t", toggle).textContent = open ? (toggle.getAttribute("data-l-close") || "Fechar") : (toggle.getAttribute("data-l-open") || "Menu");
  }
  if (toggle && overlay) {
    toggle.addEventListener("click", function () { setMenu(overlay.getAttribute("data-open") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    $$("a", overlay).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* ---------- Vídeo do hero: versão certa para a tela ---------- */
  $$("video[data-desktop]").forEach(function (v) {
    var src = window.innerWidth < 760 && v.getAttribute("data-mobile") ? v.getAttribute("data-mobile") : v.getAttribute("data-desktop");
    var save = navigator.connection && navigator.connection.saveData;
    if (reduce || save) return;
    v.src = src;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });
  /* vídeos que só carregam perto da tela e pausam quando saem dela */
  var playV = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
  if (!reduce) {
    var vio = hasIO ? new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (!v.getAttribute("src")) v.src = v.getAttribute("data-src"); playV(v); }
        else if (v.getAttribute("src")) v.pause();
      });
    }, { rootMargin: "200px 0px" }) : null;
    $$("video[data-src]").forEach(function (v) {
      if (vio) vio.observe(v); else { v.src = v.getAttribute("data-src"); playV(v); }
    });
  }

  /* ---------- Título do hero letra a letra ---------- */
  var title = $(".hero-title");
  if (title) {
    var i = 0;
    $$(".line", title).forEach(function (line) {
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            Array.from(n.textContent.normalize("NFC")).forEach(function (c) {
              var s = document.createElement("span");
              s.className = "ch"; s.style.setProperty("--i", i++);
              s.textContent = c === " " ? " " : c;
              frag.appendChild(s);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(line);
    });
  }

  /* ---------- Títulos grandes sempre cabem na largura ----------
     Se a linha mais longa passar do espaço, a fonte encolhe na medida certa. */
  var fitEls = $$(".hero-title, .page-hero h1.mega");
  function fitTitles() {
    fitEls.forEach(function (el) {
      el.style.fontSize = "";
      var lines = $$(".line", el);
      if (!lines.length) return;
      for (var volta = 0; volta < 5; volta++) {
        var falta = 1;
        lines.forEach(function (l) { if (l.scrollWidth > l.clientWidth + 1) falta = Math.min(falta, l.clientWidth / l.scrollWidth); });
        if (falta >= 1) break;
        el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * falta * .97).toFixed(1) + "px";
      }
    });
  }
  fitTitles();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", fitTitles);
  window.addEventListener("load", fitTitles);
  var fitT = 0;
  window.addEventListener("resize", function () { clearTimeout(fitT); fitT = setTimeout(fitTitles, 120); });

  /* ---------- Ciclo da safra: galho de café do Chapadão ---------- */
  var ciclo = $("[data-ciclo]");
  if (ciclo) (function () {
    var cfg = JSON.parse(ciclo.getAttribute("data-ciclo"));
    var svg = $("[data-ramo]", ciclo), NS = "http://www.w3.org/2000/svg";
    var mk = function (tag, at, pai) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
    var seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var sm = function (a, b, x) { var p = clamp((x - a) / (b - a)); return p * p * (3 - 2 * p); };

    var defs = mk("defs", {}, svg);
    var gl = mk("linearGradient", { id: "fl", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
    mk("stop", { offset: "0", "stop-color": "#1d4a2a" }, gl); mk("stop", { offset: ".55", "stop-color": "#2f6d3a" }, gl); mk("stop", { offset: "1", "stop-color": "#3f8446" }, gl);
    var sway = mk("g", {}, svg);
    var D = "M378 6 C 340 62, 312 112, 276 168 S 204 284, 156 344 S 74 430, 22 464";
    var casca = mk("path", { d: D, fill: "none", stroke: "#4b3a22", "stroke-width": "7", "stroke-linecap": "round", "stroke-dasharray": "1", "stroke-dashoffset": "1", pathLength: "1" }, sway);
    var galho = mk("path", { d: D, fill: "none", stroke: "#8a7040", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-dasharray": "1", "stroke-dashoffset": "1", pathLength: "1", opacity: ".8" }, sway);
    var tot = galho.getTotalLength();
    var at = function (f) { var p = galho.getPointAtLength(tot * f), q = galho.getPointAtLength(Math.min(tot, tot * f + 1)); return { x: p.x, y: p.y, a: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI }; };

    var gFolhas = mk("g", {}, sway), gFrutos = mk("g", {}, sway), gFlores = mk("g", {}, sway);
    var folhas = [], frutos = [], flores = [];
    var leaf = function (L, w) { return "M0 0 C " + L * .25 + " " + -w + ", " + L * .7 + " " + -w * .9 + ", " + L + " 0 C " + L * .7 + " " + w * .9 + ", " + L * .25 + " " + w + ", 0 0Z"; };
    var nos = [.09, .22, .36, .5, .64, .78, .9];
    nos.forEach(function (f, k) {
      var n = at(f), L = 96 - k * 7, w = L * .26;
      [-1, 1].forEach(function (lado, j) {
        var ang = n.a + lado * (62 - k * 2) + 12;
        var g = mk("g", { transform: "translate(" + n.x.toFixed(1) + " " + n.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")" }, gFolhas);
        var inner = mk("g", {}, g);
        mk("path", { d: leaf(L, w), fill: "url(#fl)" }, inner);
        mk("path", { d: "M2 0 Q " + L * .5 + " " + (lado * -2) + " " + (L - 4) + " 0", stroke: "rgba(220,240,210,.28)", "stroke-width": "1.1", fill: "none" }, inner);
        folhas.push({ el: inner, d: .15 + k * .13 + j * .06 });
      });
      var nf = 6 + (k % 2);
      for (var c = 0; c < nf; c++) {
        var ang2 = (c / nf) * Math.PI * 2 + rnd() * .5, dist = 7 + rnd() * 8, r = 6.2 + rnd() * 2.2;
        var x = n.x + Math.cos(ang2) * dist, y = n.y + Math.sin(ang2) * dist * .8 + 5;
        var g2 = mk("g", { transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")" }, gFrutos);
        var inn = mk("g", {}, g2);
        var corpo = mk("circle", { r: r.toFixed(1), fill: "#6f9a3a" }, inn);
        mk("circle", { cx: (-r * .34).toFixed(1), cy: (-r * .36).toFixed(1), r: (r * .3).toFixed(1), fill: "#fff", opacity: ".38" }, inn);
        mk("circle", { cx: (r * .42).toFixed(1), cy: (r * .45).toFixed(1), r: "1", fill: "rgba(20,12,8,.45)" }, inn);
        frutos.push({ el: inn, body: corpo, off: (rnd() - .5) * .9, queda: 9.25 + rnd() * 2.1, dx: (rnd() - .5) * 40, rot: (rnd() - .5) * 220 });
      }
      for (var fl = 0; fl < 5; fl++) {
        var a3 = (fl / 5) * Math.PI * 2 + rnd(), d3 = 10 + rnd() * 9;
        var fx = n.x + Math.cos(a3) * d3, fy = n.y + Math.sin(a3) * d3 * .8 + 3, s = 6 + rnd() * 3;
        var g3 = mk("g", { transform: "translate(" + fx.toFixed(1) + " " + fy.toFixed(1) + ") rotate(" + (rnd() * 72).toFixed(0) + ")" }, gFlores);
        var in3 = mk("g", {}, g3);
        for (var pp = 0; pp < 5; pp++) mk("ellipse", { cx: "0", cy: (-s * .62).toFixed(1), rx: (s * .32).toFixed(1), ry: (s * .62).toFixed(1), fill: "#fbfaf4", transform: "rotate(" + pp * 72 + ")" }, in3);
        mk("circle", { r: (s * .22).toFixed(1), fill: "#e9d98a" }, in3);
        flores.push({ el: in3, off: rnd() * .5, dy: 8 + rnd() * 18 });
      }
    });

    /* verde > amarelo > vermelho cereja > passa */
    var cores = [[111, 154, 58], [201, 177, 58], [214, 92, 44], [176, 28, 42], [110, 22, 30]];
    var cor = function (p) {
      var x = clamp(p) * (cores.length - 1), i = Math.min(cores.length - 2, Math.floor(x)), f = x - i, a = cores[i], b = cores[i + 1];
      return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," + Math.round(a[1] + (b[1] - a[1]) * f) + "," + Math.round(a[2] + (b[2] - a[2]) * f) + ")";
    };

    var reg = $("[data-reg]", ciclo), pos = $("[data-pos]", ciclo);
    cfg.meses.forEach(function (m) { var s = document.createElement("span"); s.textContent = m.charAt(0); reg.insertBefore(s, pos); });
    var elMes = $("[data-mes]", ciclo), elFase = $("[data-fase]", ciclo), elTxt = $("[data-fase-txt]", ciclo), faseAt = 0, mesAt = 0;
    var setFase = function (m) {
      var k = 0; cfg.fases.forEach(function (f, i) { if (m >= f.m) k = i; });
      var mi = Math.floor(m) % 12;
      if (mi !== mesAt) { mesAt = mi; elMes.textContent = cfg.meses[mi]; }
      if (k !== faseAt) {
        faseAt = k; ciclo.classList.add("troca");
        setTimeout(function () { elFase.textContent = cfg.fases[k].n; elTxt.textContent = cfg.fases[k].t; ciclo.classList.remove("troca"); }, 260);
      }
      pos.style.left = (m / 12 * 100).toFixed(2) + "%";
    };

    var draw = function (m, crescer) {
      folhas.forEach(function (o) { var s = sm(o.d, o.d + .6, crescer); o.el.setAttribute("transform", "scale(" + s.toFixed(3) + ")"); });
      var g0 = (1 - sm(0, .9, crescer)).toFixed(3);
      casca.setAttribute("stroke-dashoffset", g0); galho.setAttribute("stroke-dashoffset", g0);
      flores.forEach(function (o) {
        var abre = sm(.05 + o.off, .7 + o.off, m), cai = sm(1.3 + o.off, 1.95 + o.off, m);
        var s = m > 2.3 ? 0 : abre;
        o.el.setAttribute("transform", "translate(0 " + (cai * o.dy).toFixed(1) + ") scale(" + s.toFixed(3) + ")");
        o.el.setAttribute("opacity", (1 - cai).toFixed(2));
      });
      frutos.forEach(function (o) {
        var s = sm(1.8, 2.9, m) * .36 + sm(4, 6.6, m) * .64;
        var q = clamp((m - o.queda) / .5), y = q * q * 300, rot = q * o.rot;
        if (m < 1.7 || m > 11.9) s = 0;
        o.el.setAttribute("transform", "translate(" + (q * o.dx).toFixed(1) + " " + y.toFixed(1) + ") rotate(" + rot.toFixed(0) + ") scale(" + s.toFixed(3) + ")");
        o.el.setAttribute("opacity", (1 - q * q).toFixed(2));
        o.body.setAttribute("fill", cor(sm(6.8 + o.off, 8.7 + o.off, m) * .78 + sm(10.6, 11.6, m) * .22));
      });
    };

    if (reduce) { draw(8.6, 3); setFase(8.6); return; }
    var T = 1250, inicio = (doc.classList.contains("intro") ? 1500 : 0) + 900, t0 = null, visivel = true, raf = 0;
    function loop(now) {
      raf = 0;
      if (!t0) t0 = now;
      var el = now - t0, crescer = el / 1000, m = Math.max(0, (el - inicio) / T) % 12;
      draw(m, crescer); setFase(m);
      sway.setAttribute("transform", "rotate(" + (Math.sin(now / 1400) * 1.3).toFixed(2) + " 378 6)");
      if (visivel) raf = requestAnimationFrame(loop);
    }
    if (hasIO) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel && !raf) raf = requestAnimationFrame(loop); }).observe(ciclo);
    raf = requestAnimationFrame(loop);
  })();

  /* ---------- Manifesto lido na rolagem ---------- */
  var words = [];
  $$("[data-words]").forEach(function (p) {
    var html = "";
    p.childNodes.forEach(function (node) {
      var hl = node.nodeType === 1;
      (node.textContent || "").split(/(\s+)/).forEach(function (w) {
        if (!w.trim()) { html += w; return; }
        html += '<span class="w' + (hl ? " hl" : "") + '">' + w + "</span>";
      });
    });
    p.innerHTML = html;
    words = words.concat($$(".w", p).map(function (w) { return { el: w, box: p }; }));
  });
  function paintWords() {
    if (!words.length) return;
    var vh = window.innerHeight;
    var groups = {};
    words.forEach(function (o) { var r = o.box.getBoundingClientRect(); var prog = Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .3))); o.box._p = prog; });
    var counts = new Map();
    words.forEach(function (o) {
      var arr = counts.get(o.box) || []; arr.push(o.el); counts.set(o.box, arr);
    });
    counts.forEach(function (arr, box) { var n = Math.round(box._p * arr.length); arr.forEach(function (w, k) { w.classList.toggle("on", k < n); }); });
    void groups;
  }
  if (reduce) $$(".w").forEach(function (w) { w.classList.add("on"); });
  else { window.addEventListener("scroll", function () { requestAnimationFrame(paintWords); }, { passive: true }); paintWords(); }

  /* ---------- Títulos que sobem palavra a palavra ---------- */
  var splitEls = $$("[data-split]");
  splitEls.forEach(function (el) {
    var w = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            var o = document.createElement("span"); o.className = "wd";
            var s = document.createElement("span"); s.textContent = part; s.style.setProperty("--w", w++);
            o.appendChild(s); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
  });

  /* ---------- Corte do Chapadão: minerais e pés de café ---------- */
  var corte = $(".corte");
  if (corte) {
    var NS = "http://www.w3.org/2000/svg", seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var gm = $("[data-minerais]", corte), cores = ["#d8b46a", "#c7c2b4", "#a8643f", "#efe0b6", "#7b6a5c"];
    for (var m = 0; m < 220; m++) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", (rnd() * 1000).toFixed(1)); c.setAttribute("cy", (140 + rnd() * 260).toFixed(1));
      c.setAttribute("r", (1 + rnd() * 2.8).toFixed(1)); c.setAttribute("fill", cores[m % cores.length]);
      c.style.transitionDelay = (0.6 + rnd() * 1.2).toFixed(2) + "s";
      gm.appendChild(c);
    }
    var perfil = $(".perfil", corte), tot = perfil.getTotalLength(), am = [];
    for (var a = 0; a <= 500; a++) { var pt = perfil.getPointAtLength(tot * a / 500); am.push([pt.x, pt.y]); }
    var yEm = function (x) { return am.reduce(function (b, q) { return Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b; })[1]; };
    var gp = $("[data-pes]", corte);
    [300, 322, 344, 366, 390, 414, 586, 610, 634, 656, 678, 700, 270, 730].forEach(function (x, k) {
      var y = yEm(x) - 8, g = document.createElementNS(NS, "g");
      g.setAttribute("class", "pe"); g.style.transitionDelay = (1.6 + k * .07).toFixed(2) + "s";
      g.innerHTML = '<circle cx="' + x + '" cy="' + y + '" r="8"/><circle cx="' + (x - 6) + '" cy="' + (y + 4) + '" r="5.5"/><circle cx="' + (x + 6) + '" cy="' + (y + 4) + '" r="5.5"/>';
      gp.appendChild(g);
    });
  }

  /* ---------- Revelação ----------
     O observador revela o que entra na tela; a varredura na rolagem garante que nada
     fique escondido (rolagem rápida, link para âncora, aba que volta do segundo plano). */
  var revealSel = ".reveal, .img-reveal, .alt-chart, .corte-wrap, .procc, [data-split]";
  var pend = $$(revealSel);
  var show = function (el) { el.classList.add(el.hasAttribute("data-split") ? "split-in" : "in"); if (el.classList.contains("procc")) el.classList.add("in"); };
  function sweep() {
    if (!pend.length) return;
    var lim = window.innerHeight * .94;
    pend = pend.filter(function (el) { if (el.getBoundingClientRect().top < lim) { show(el); return false; } return true; });
  }
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    pend.forEach(function (el) { io.observe(el); });
    window.addEventListener("load", sweep);
    window.addEventListener("resize", sweep);
    window.addEventListener("scroll", sweep, { passive: true });
    document.addEventListener("visibilitychange", sweep);
    var guarda = setInterval(function () { sweep(); if (!pend.length) clearInterval(guarda); }, 600);
  } else {
    pend.forEach(show); pend = [];
  }

  /* ---------- Contadores ---------- */
  function runCount(el) {
    var end = +el.getAttribute("data-count");
    if (reduce) { el.textContent = fmt(end); return; }
    var s0 = null, dur = 1500;
    var f = function (t) { if (!s0) s0 = t; var p = Math.min(1, (t - s0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(e * end); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  var counts = $$("[data-count]");
  if (hasIO) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } }); }, { threshold: .6 });
    counts.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Foto que segue o cursor (núcleos e prêmios) ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    $$("[data-img]").forEach(function (row) {
      var peek = row.parentElement.parentElement.querySelector(".nrow-peek");
      if (!peek) return;
      var img = $("img", peek);
      row.addEventListener("pointerenter", function () { img.src = row.getAttribute("data-img"); peek.classList.add("on"); });
      row.addEventListener("pointerleave", function () { peek.classList.remove("on"); });
      row.addEventListener("pointermove", function (e) { peek.style.left = (e.clientX + 180) + "px"; peek.style.top = e.clientY + "px"; });
    });
  }

  /* ---------- Linha do tempo ---------- */
  var tl = $(".timeline");
  var tls = $$(".tl");
  if (tls.length && hasIO) {
    var tio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) en.target.classList.add("on"); }); }, { rootMargin: "0px 0px -40% 0px" });
    tls.forEach(function (li) { tio.observe(li); });
  }
  function timelineProgress() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh * .6 - r.top) / r.height));
    tl.style.setProperty("--tp", (p * 100).toFixed(1) + "%");
  }

  /* ---------- Índice lateral dos núcleos ---------- */
  var navLinks = $$(".nuc-nav a");
  if (navLinks.length && hasIO) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); }); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$(".nuc").forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Galeria: filtro e ampliação ---------- */
  var gal = $("[data-gal]");
  if (gal) {
    var gbtns = $$(".filter", gal.parentElement);
    gbtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        gbtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(".g", gal).forEach(function (g) { g.hidden = !(f === "todas" || g.getAttribute("data-cat") === f); });
      });
    });
  }
  var lb = $(".lightbox");
  if (lb && lb.showModal) {
    $$(".g, [data-zoom]").forEach(function (b) {
      b.addEventListener("click", function () {
        var im = $("img", b);
        $("img", lb).src = im.currentSrc || im.src; $("img", lb).alt = im.alt; $("p", lb).textContent = im.alt;
        lb.showModal();
      });
    });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- Vídeos do YouTube em modal ---------- */
  /* ---------- Sala de cinema da home ---------- */
  var cine = $("[data-cine]");
  if (cine) {
    var cv = $(".cine-screen video", cine), cplay = $(".cine-play", cine), ctit = $("[data-cine-title]", cine), cmeta = $("[data-cine-meta]", cine);
    var base = cv.getAttribute("data-src").replace(/[^/]+\.mp4$/, "");
    var hover = window.matchMedia("(hover: hover)").matches;
    var citems = $$(".cine-item", cine);
    var pick = function (b) {
      if (b.classList.contains("is-on")) return;
      citems.forEach(function (x) { x.classList.toggle("is-on", x === b); });
      var id = b.getAttribute("data-id");
      cine.classList.add("troca");
      setTimeout(function () {
        cv.poster = base + id + ".jpg";
        cv.setAttribute("data-src", base + id + ".mp4");
        if (!reduce) { cv.src = base + id + ".mp4"; playV(cv); }
        ctit.textContent = b.getAttribute("data-title"); cmeta.textContent = b.getAttribute("data-meta");
        cplay.setAttribute("data-yt", id); cplay.setAttribute("data-title", b.getAttribute("data-title"));
        cine.classList.remove("troca");
      }, 180);
    };
    citems.forEach(function (b) {
      if (hover) b.addEventListener("pointerenter", function () { pick(b); });
      b.addEventListener("focus", function () { pick(b); });
      b.addEventListener("click", function () {
        if (!hover && !b.classList.contains("is-on")) { pick(b); return; }
        openVideo(b.getAttribute("data-id"), b.getAttribute("data-title"));
      });
    });
  }

  var vm = $("#vmodal");
  function openVideo(id, t) {
    $(".vmodal-frame", vm).innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + t + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    $(".vmodal-title", vm).textContent = t;
    $(".vmodal-link", vm).href = "https://www.youtube.com/watch?v=" + id;
    vm.classList.add("open"); vm.removeAttribute("inert"); vm.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeVideo() {
    vm.classList.remove("open"); vm.setAttribute("inert", ""); vm.setAttribute("aria-hidden", "true");
    $(".vmodal-frame", vm).innerHTML = ""; document.body.style.overflow = "";
  }
  if (vm) {
    $$("[data-yt]").forEach(function (b) { b.addEventListener("click", function () { openVideo(b.getAttribute("data-yt"), b.getAttribute("data-title") || "Vídeo"); }); });
    $(".vmodal-close", vm).addEventListener("click", closeVideo);
    vm.addEventListener("click", function (e) { if (e.target === vm) closeVideo(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && vm.classList.contains("open")) closeVideo(); });
  }

  /* ---------- Links úteis: busca e filtro ---------- */
  var links = $("[data-links]");
  if (links) {
    var cards = $$(".link-card", links), busca = $("[data-busca]"), vazio = $("[data-vazio]"), cat = "todos";
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var q = norm(busca.value.trim()), n = 0;
      cards.forEach(function (c) {
        var ok = (cat === "todos" || c.getAttribute("data-cat") === cat) && (!q || norm(c.textContent).indexOf(q) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      vazio.hidden = n > 0;
    };
    busca.addEventListener("input", apply);
    $$(".filter", links.parentElement).forEach(function (b) {
      b.addEventListener("click", function () {
        cat = b.getAttribute("data-f");
        $$(".filter", links.parentElement).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        apply();
      });
    });
  }

  /* ---------- Contato: monta o e-mail ---------- */
  var form = $("[data-form]");
  if (form) {
    var params = new URLSearchParams(location.search);
    var pre = params.get("assunto");
    if (pre) { var r = form.querySelector('input[name="assunto"][value="' + pre + '"]'); if (r) r.checked = true; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["nome", "mensagem"].forEach(function (k) {
        var el = form.elements[k], bad = !el.value.trim();
        el.classList.toggle("is-err", bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      var note = $("[data-note]", form);
      if (!ok) { note.textContent = form.getAttribute("data-msg-err") || "Preencha nome e mensagem, por favor."; return; }
      var f = form.elements;
      var assunto = (form.querySelector('input[name="assunto"]:checked') || {}).value || form.getAttribute("data-default") || "Contato pelo site";
      var corpo = f.mensagem.value.trim() + "\n\n" + f.nome.value.trim() + (f.empresa.value.trim() ? "\n" + f.empresa.value.trim() : "") + (f.fone.value.trim() ? "\n" + f.fone.value.trim() : "") + "\n\n" + (form.getAttribute("data-sign") || "(enviado pelo site)");
      location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(assunto + " · " + f.nome.value.trim()) + "&body=" + encodeURIComponent(corpo);
      note.textContent = form.getAttribute("data-msg-ok") || "Seu e-mail foi aberto com a mensagem pronta. É só enviar.";
    });
  }

  /* ---------- Diversos ---------- */
  $$("[data-top]").forEach(function (b) { b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }); });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  onScroll();
})();
