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

  /* ---------- Do grão à muda: um cafezinho nascendo no hero ----------
     Corte de terra roxa com as fases reais da muda de café:
     semente, palito de fósforo, soldadinho, orelha de onça e muda. */
  var muda = $("[data-muda]");
  if (muda) (function () {
    var fases = JSON.parse(muda.getAttribute("data-muda"));
    var svg = $("[data-muda-svg]", muda), NS = "http://www.w3.org/2000/svg";
    var mk = function (tag, at, pai) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var sm = function (a, b, x) { var p = clamp((x - a) / (b - a)); return p * p * (3 - 2 * p); };
    var lerp = function (a, b, p) { return a + (b - a) * p; };
    var seed = 5, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var grad = function (id, stops, x2, y2) {
      var g = mk("linearGradient", { id: id, x1: "0", y1: "0", x2: x2 || "0", y2: y2 || "1" }, defs);
      stops.forEach(function (s) { mk("stop", { offset: s[0], "stop-color": s[1] }, g); });
    };

    var defs = mk("defs", {}, svg);
    grad("m-solo", [["0", "#8a3d24"], [".35", "#5c2516"], ["1", "#2a110a"]]);
    grad("m-folha", [["0", "#3f8f4a"], ["1", "#1e5a2e"]], "1", "1");
    grad("m-orelha", [["0", "#7cb35a"], ["1", "#3f8238"]], "1", "1");
    grad("m-grao", [["0", "#e3cc9a"], ["1", "#b48d55"]], "1", "1");
    var rg = mk("radialGradient", { id: "m-sol", cx: ".5", cy: ".5", r: ".5" }, defs);
    mk("stop", { offset: "0", "stop-color": "rgba(255,226,160,.55)" }, rg); mk("stop", { offset: "1", "stop-color": "rgba(255,226,160,0)" }, rg);
    var cp = mk("clipPath", { id: "m-clip" }, defs); mk("rect", { width: "320", height: "400", rx: "14" }, cp);

    var cena = mk("g", { "clip-path": "url(#m-clip)" }, svg);
    var sol = mk("circle", { cx: "262", cy: "58", r: "120", fill: "url(#m-sol)" }, cena);
    var SUP = "M0 262 C 60 256, 110 266, 160 261 S 260 256, 320 262";
    mk("path", { d: SUP + " L320 400 L0 400Z", fill: "url(#m-solo)" }, cena);
    var cores = ["#a2533a", "#6e2c1a", "#c27a52", "#3a170d", "#8f4a2e"];
    for (var i = 0; i < 90; i++) mk("circle", { cx: (rnd() * 320).toFixed(1), cy: (268 + rnd() * 130).toFixed(1), r: (.6 + rnd() * 1.8).toFixed(1), fill: cores[i % 5], opacity: (.5 + rnd() * .5).toFixed(2) }, cena);
    for (var j = 0; j < 4; j++) mk("ellipse", { cx: (30 + rnd() * 260).toFixed(0), cy: (300 + rnd() * 80).toFixed(0), rx: (5 + rnd() * 6).toFixed(1), ry: (3 + rnd() * 3).toFixed(1), fill: "#9a6a48", opacity: ".55" }, cena);
    var umido = mk("ellipse", { cx: "160", cy: "290", rx: "70", ry: "34", fill: "#1a0a05", opacity: "0" }, cena);
    mk("path", { d: SUP, fill: "none", stroke: "rgba(255,220,190,.18)", "stroke-width": "1.2" }, cena);

    /* raízes */
    var gRaiz = mk("g", { fill: "none", stroke: "#e9d7b8", "stroke-linecap": "round" }, cena);
    var raiz = mk("path", { d: "M160 290 C 158 312, 165 336, 159 360 S 156 384, 158 398", "stroke-width": "2.4", pathLength: "1", "stroke-dasharray": "1", "stroke-dashoffset": "1" }, gRaiz);
    var lat = [["M159 312 C 150 318, 140 320, 128 330", 4.2], ["M161 326 C 172 332, 184 334, 194 346", 4.8], ["M159 346 C 148 352, 140 360, 134 372", 5.6], ["M160 362 C 170 368, 176 378, 182 390", 6.2]].map(function (l) {
      return { el: mk("path", { d: l[0], "stroke-width": "1.2", pathLength: "1", "stroke-dasharray": "1", "stroke-dashoffset": "1", opacity: ".85" }, gRaiz), t: l[1] };
    });

    /* planta: caule, orelhas de onça, folhas, grão */
    var planta = mk("g", {}, cena);
    var caule = mk("path", { fill: "none", "stroke-width": "4.2", "stroke-linecap": "round" }, planta);
    var folhaD = function (L, w) { return "M0 0 C " + L * .25 + " " + -w + ", " + L * .7 + " " + -w * .9 + ", " + L + " 0 C " + L * .7 + " " + w * .9 + ", " + L * .25 + " " + w + ", 0 0Z"; };
    var ORELHA = "M0 0 C 4 -15, 30 -22, 42 -9 C 49 -1, 40 13, 22 12 C 11 11, 3 6, 0 0Z";
    var orelhas = [-1, 1].map(function (lado) {
      var g = mk("g", {}, planta), inner = mk("g", {}, g);
      mk("path", { d: ORELHA, fill: "url(#m-orelha)" }, inner);
      mk("path", { d: "M2 0 Q 20 -4 38 -6", stroke: "rgba(230,245,210,.35)", "stroke-width": "1", fill: "none" }, inner);
      return { g: g, inner: inner, lado: lado };
    });
    var folhas = [[-1, 60, 15], [1, 60, 15], [-1, 30, 8], [1, 30, 8]].map(function (f) {
      var g = mk("g", {}, planta), inner = mk("g", {}, g);
      mk("path", { d: folhaD(f[1], f[2]), fill: "url(#m-folha)" }, inner);
      mk("path", { d: "M3 0 Q " + f[1] * .5 + " -1.5 " + (f[1] - 4) + " 0", stroke: "rgba(220,240,210,.3)", "stroke-width": "1", fill: "none" }, inner);
      return { g: g, inner: inner, lado: f[0], L: f[1] };
    });
    var grao = mk("g", {}, planta);
    var graoIn = mk("g", {}, grao);
    mk("ellipse", { rx: "11", ry: "8", fill: "url(#m-grao)" }, graoIn);
    mk("path", { d: "M-8 0 C -3 -2, 3 2, 8 0", stroke: "#8a6634", "stroke-width": "1.3", fill: "none", "stroke-linecap": "round" }, graoIn);

    /* gotas de água */
    var gotas = [0, 1, 2].map(function (k) {
      return { el: mk("path", { d: "M0 -7 C 3 -2, 5 1, 5 3 A 5 5 0 0 1 -5 3 C -5 1, -3 -2, 0 -7Z", fill: "#bfe3f2", opacity: "0" }, cena), x: 132 + k * 26, t: .15 + k * .5 };
    });

    /* formas do caule: base no colo da raiz, ponta segura o grão */
    var B = [160, 290];
    var ARCO = [[160, 246], [190, 236], [188, 264]];
    var RETO = [[160, 262], [160, 232], [160, 204]];
    var ALTO = [[160, 240], [160, 180], [160, 126]];

    var info = { n: $("[data-muda-n]", muda), f: $("[data-muda-fase]", muda), t: $("[data-muda-txt]", muda), bar: $$("[data-muda-bar] i", muda) };
    var faseAt = 0;
    var CORTES = [0, 2.6, 5.4, 8.0, 11.0], FIM = 15.2, CICLO = 16.4;
    var setInfo = function (t) {
      var k = 0; CORTES.forEach(function (c, i) { if (t >= c) k = i; });
      info.bar.forEach(function (b, i) {
        var p = i < k ? 1 : i > k ? 0 : clamp((t - CORTES[k]) / ((CORTES[k + 1] || FIM) - CORTES[k]));
        b.style.setProperty("--p", p.toFixed(3));
      });
      if (k !== faseAt) {
        faseAt = k; muda.classList.add("troca");
        setTimeout(function () { info.f.textContent = fases[k].n; info.t.textContent = fases[k].t; info.n.textContent = "0" + (k + 1) + " / 05"; muda.classList.remove("troca"); }, 260);
      }
    };

    var draw = function (t, now) {
      /* água e solo úmido */
      gotas.forEach(function (g) {
        var q = clamp((t - g.t) / .7), y = lerp(24, 258, q * q);
        g.el.setAttribute("transform", "translate(" + g.x + " " + y.toFixed(1) + ")");
        g.el.setAttribute("opacity", (q > 0 && q < 1 ? .9 : 0).toString());
      });
      var some = sm(FIM - 1, FIM, t);
      umido.setAttribute("opacity", (sm(.6, 2.2, t) * .45 * (1 - some)).toFixed(3));

      /* raízes */
      raiz.setAttribute("stroke-dashoffset", (1 - sm(1.3, 5.2, t)).toFixed(3));
      lat.forEach(function (l) { l.el.setAttribute("stroke-dashoffset", (1 - sm(l.t, l.t + 1.6, t)).toFixed(3)); });
      gRaiz.setAttribute("opacity", (1 - some).toFixed(3));

      /* caule: nasce, faz o arco, endireita e cresce */
      var a = sm(2.6, 4.6, t), r = sm(5.4, 7.2, t), h = sm(11.0, 13.4, t);
      var pts = [0, 1, 2].map(function (i) {
        var ax = lerp(B[0], ARCO[i][0], a), ay = lerp(B[1], ARCO[i][1], a);
        var rx = lerp(ax, RETO[i][0], r), ry = lerp(ay, RETO[i][1], r);
        return [lerp(rx, ALTO[i][0], h), lerp(ry, ALTO[i][1], h)];
      });
      caule.setAttribute("d", "M" + B[0] + " " + B[1] + " C " + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(", "));
      caule.setAttribute("stroke", a < .02 ? "transparent" : (r > .5 ? "#5e9a45" : "#a9c97a"));
      caule.setAttribute("stroke-width", (3 + r * 1.2 + h * .8).toFixed(2));
      var ponta = pts[2];

      /* grão: incha, sobe na ponta e cai quando a orelha de onça abre */
      var incha = 1 + .14 * sm(.8, 2.2, t);
      var cai = sm(8.0, 9.2, t);
      var gx = a > 0 ? ponta[0] : 160, gy = a > 0 ? ponta[1] : 290;
      var ang = lerp(90, 0, r) * (a > 0 ? 1 : 0);
      grao.setAttribute("transform", "translate(" + (gx + cai * 26).toFixed(1) + " " + (gy - 6 * (1 - cai) * r + cai * cai * 70).toFixed(1) + ") rotate(" + (ang + cai * 130).toFixed(1) + ")");
      graoIn.setAttribute("transform", "scale(" + incha.toFixed(3) + ")");
      grao.setAttribute("opacity", (1 - sm(8.6, 9.4, t)).toFixed(3));

      /* orelhas de onça: abrem na ponta do soldadinho e ficam no nó */
      var abre = sm(8.0, 9.6, t), noY = lerp(RETO[2][1], 206, h);
      orelhas.forEach(function (o) {
        var rot = lerp(-80, -8, abre);
        o.g.setAttribute("transform", "translate(160 " + noY.toFixed(1) + ") scale(" + o.lado + " 1) rotate(" + rot.toFixed(1) + ")");
        o.inner.setAttribute("transform", "scale(" + (abre * (1 + h * .15)).toFixed(3) + ")");
      });

      /* primeiras folhas verdadeiras no alto */
      folhas.forEach(function (f, i) {
        var ini = i < 2 ? 11.4 : 12.6, s = sm(ini, ini + 1.6, t);
        var y = i < 2 ? ponta[1] + 14 : ponta[1] + 2;
        f.g.setAttribute("transform", "translate(160 " + y.toFixed(1) + ") scale(" + f.lado + " 1) rotate(" + lerp(-70, i < 2 ? -24 : -48, s).toFixed(1) + ")");
        f.inner.setAttribute("transform", "scale(" + s.toFixed(3) + ")");
      });

      /* brisa e saída */
      var brisa = Math.sin(now / 1500) * 1.6 * r;
      planta.setAttribute("transform", "rotate(" + brisa.toFixed(2) + " 160 290) translate(160 290) scale(1.22) translate(-160 -290)");
      planta.setAttribute("opacity", (1 - some).toFixed(3));
      sol.setAttribute("opacity", (.6 + Math.sin(now / 2600) * .25).toFixed(3));
      setInfo(t);
    };

    var fixo = /[?&]muda=([\d.]+)/.exec(location.search);
    if (fixo) { draw(+fixo[1], 0); return; }
    if (reduce) { draw(14, 0); return; }
    var inicio = (doc.classList.contains("intro") ? 1500 : 0) + 900, t0 = null, visivel = true, raf = 0;
    function loop(now) {
      raf = 0;
      if (!t0) t0 = now;
      var el = Math.max(0, now - t0 - inicio) / 1000;
      draw(el % CICLO, now);
      if (visivel) raf = requestAnimationFrame(loop);
    }
    if (hasIO) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel && !raf) raf = requestAnimationFrame(loop); }).observe(muda);
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
