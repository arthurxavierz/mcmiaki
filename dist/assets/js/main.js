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

  /* ---------- Hero: partículas brancas de café flutuando ----------
     Cada peça é desenhada uma vez num canvas próprio (nítida e desfocada)
     e depois só é movida; as do fundo ficam menores, mais lentas e desfocadas. */
  var graosCv = $("[data-graos]");
  if (graosCv && graosCv.getContext) (function () {
    var ctx = graosCv.getContext("2d"), hero = graosCv.parentElement;
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var S = 128; // tamanho do sprite

    function sprite(desenha, blur) {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var g = c.getContext("2d");
      if (blur) g.filter = "blur(" + blur + "px)";
      g.translate(S / 2, S / 2); desenha(g); return c;
    }
    /* peças brancas minimalistas: grão chapado com o sulco vazado, folha em traço e pontos de luz */
    function grao(g) {
      g.rotate(-.35);
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(0, 0, 28, 38, 0, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = "destination-out";
      g.lineWidth = 6; g.lineCap = "round";
      g.beginPath(); g.moveTo(-2, -30); g.bezierCurveTo(10, -10, -11, 10, 2, 30); g.stroke();
    }
    function folha(g) {
      g.rotate(-.5);
      g.strokeStyle = "#fff"; g.lineWidth = 3.4; g.lineJoin = "round"; g.lineCap = "round";
      g.beginPath(); g.moveTo(-54, 0);
      g.bezierCurveTo(-34, -24, 22, -28, 54, 0);
      g.bezierCurveTo(22, 28, -34, 24, -54, 0); g.stroke();
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(-62, 0); g.quadraticCurveTo(0, -2, 46, 0); g.stroke();
    }
    function ponto(g) {
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, 30);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
    }
    var tipos = [
      { d: grao, p: .34, base: 15 },    // grão de café
      { d: folha, p: .26, base: 30 },   // folha em traço
      { d: ponto, p: .4, base: 6 },     // ponto de luz
    ];
    tipos.forEach(function (tp) { tp.n = sprite(tp.d, 0); tp.b = sprite(tp.d, 3.2); });
    var escolhe = function () { var r = rnd(), a = 0; for (var i = 0; i < tipos.length; i++) { a += tipos[i].p; if (r <= a) return tipos[i]; } return tipos[0]; };

    var parts = [];
    function nova(p, topo) {
      var z = .35 + rnd() * .65;                         // profundidade: 1 = perto
      var mob = W < 760;
      p.t = escolhe(); p.z = z;
      p.s = p.t.base * (mob ? .8 : 1) * (.55 + z * .75);
      p.x = mob ? rnd() * W : W * (.5 + Math.pow(rnd(), .8) * .52);
      p.y = topo ? -p.s * 2 - rnd() * H * .3 : rnd() * H;
      p.vy = (10 + rnd() * 16) * (.5 + z * .7);
      p.rot = rnd() * Math.PI * 2; p.vr = (rnd() - .5) * (p.t.d === folha ? 1.1 : .7);
      p.fase = rnd() * Math.PI * 2; p.amp = (p.t.d === folha ? 26 : p.t.d === ponto ? 18 : 10) * z;
      p.a = (mob ? .4 : .55) * (.45 + z * .55);
      return p;
    }
    function medir() {
      var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      graosCv.width = Math.round(W * DPR); graosCv.height = Math.round(H * DPR);
      graosCv.style.width = W + "px"; graosCv.style.height = H + "px";
      var alvo = W < 760 ? 12 : W < 1200 ? 18 : 24;
      while (parts.length < alvo) parts.push(nova({}, false));
      parts.length = alvo;
    }

    var mx = 0, my = 0, tx = 0, ty = 0;
    if (window.matchMedia("(hover: hover)").matches) hero.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - .5); ty = (e.clientY / window.innerHeight - .5);
    });

    function pinta(dt, now) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      parts.sort(function (a, b) { return a.z - b.z; });
      parts.forEach(function (p) {
        p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.y > H + p.s * 2) nova(p, true);
        var x = p.x + Math.sin(now / 1800 + p.fase) * p.amp - mx * 40 * p.z;
        var y = p.y - my * 24 * p.z;
        var img = p.z < .55 ? p.t.b : p.t.n, k = p.s / (S * .32);
        ctx.globalAlpha = p.a;
        ctx.setTransform(DPR * k * Math.cos(p.rot), DPR * k * Math.sin(p.rot), -DPR * k * Math.sin(p.rot), DPR * k * Math.cos(p.rot), DPR * x, DPR * y);
        ctx.drawImage(img, -S / 2, -S / 2);
      });
      ctx.globalAlpha = 1;
    }

    medir();
    var rz = 0;
    window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(medir, 150); });
    if (reduce) { pinta(0, 0); return; }
    var last = 0, visivel = true, raf = 0;
    function loop(now) {
      raf = 0;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      pinta(dt, now);
      if (visivel) raf = requestAnimationFrame(loop);
    }
    if (hasIO) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; if (visivel && !raf) { last = 0; raf = requestAnimationFrame(loop); } }).observe(hero);
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
