(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* the Spanish pages live in /es/ with <html lang="es">; strings built here follow the page */
  const ES = /^es\b/i.test(root.lang || '');
  const t = (en, es) => (ES ? es : en);

  /* ---------- reveal on scroll (home only, content visible by default without JS/IO) ---------- */
  let io = null;
  if ('IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  }
  const armReveals = (scope) => {
    scope.querySelectorAll('.reveal:not(.in)').forEach((n) => (io ? io.observe(n) : n.classList.add('in')));
  };

  /* ---------- horizontal scroll regions: focusable only when they actually scroll ---------- */
  const updateEdge = (el) => el.classList.toggle('at-end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  const updateScrollable = (el) => {
    const can = el.scrollWidth > el.clientWidth + 1;
    el.classList.toggle('can-scroll', can);
    if (can) {
      el.tabIndex = 0;
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', el.dataset.label || t('Scrollable content', 'Contenido desplazable'));
      updateEdge(el);
    } else {
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
      el.removeAttribute('aria-label');
    }
  };
  const ro = 'ResizeObserver' in window ? new ResizeObserver((list) => list.forEach((e) => updateScrollable(e.target.closest('[data-scroll]') || e.target))) : null;
  const bindScrollables = () => {
    document.querySelectorAll('[data-scroll]').forEach((el) => {
      if (ro && !el.__bound) {
        el.__bound = true;
        ro.observe(el);
        el.addEventListener('scroll', () => updateEdge(el), { passive: true });
        Array.from(el.children).forEach((c) => ro.observe(c));
      }
      updateScrollable(el);
    });
  };

  /* ---------- nav glass: rests bare over the home hero, materialises when content scrolls under it,
     and switches tone (dark glass / light glass) with whatever sits beneath, like Apple's regular glass ---------- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const isHome = root.dataset.view === 'home';
    const DARK = '.on-dark, .bg-ink, .bg-plum, .navbg';
    let queued = false;
    const update = () => {
      queued = false;
      const r = nav.getBoundingClientRect();
      const y = r.top + r.height / 2;
      let under = null;
      for (const el of document.elementsFromPoint(window.innerWidth / 2, y)) {
        if (!nav.contains(el)) { under = el; break; }
      }
      // .on-light marks a light island inside a dark area (the resume pages over the shader): nearest wins
      const tone = under && under.closest(DARK + ', .on-light');
      const light = !!under && (!tone || tone.matches('.on-light'));
      nav.classList.toggle('is-on-light', light);
      nav.classList.toggle('is-resting', isHome && window.scrollY < 24);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    update();
  }

  /* ---------- liquid lens for the nav ----------
     Optical model ported from liquid-glass-js (MIT, Armagan Amcalar): pill signed distance + surface normal,
     edge and rim refraction with exponential falloff, a boost toward the caps, and a white-to-grey tint.
     Instead of html2canvas + WebGL (static page snapshot, texture limits on long pages), the same maths bakes
     two small maps once per nav size:
       - a displacement map fed to backdrop-filter (live refraction of whatever is really behind), Chromium only;
       - a specular map (rim reflections lit from the top-left), painted as a background, every browser. */
  const LENS = {
    edge: 14, edgeFall: 0.15,   // px of refraction at the edge, decay per px inward   (edgeIntensity / edgeDistance)
    rim: 9, rimFall: 0.8,       // sharp lensing right on the rim                      (rimIntensity / rimDistance)
    corner: 6, cornerFall: 0.3, // extra bend toward the rounded caps                   (cornerBoost)
    blur: 3, sat: 1.8,
  };
  const pill = (x, y, w, h) => {
    const r = h / 2;
    const cx = Math.min(Math.max(x, r), w - r);
    const dx = x - cx, dy = y - r;
    const len = Math.hypot(dx, dy) || 1e-4;
    return { d: r - len, nx: dx / len, ny: dy / len };
  };
  const bakeDisplacement = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(w, h); const px = img.data;
    const max = LENS.edge + LENS.rim + LENS.corner, scale = max * 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const { d, nx, ny } = pill(x + 0.5, y + 0.5, w, h);
      const dd = Math.max(d, 0);
      const cap = Math.min(x, w - x);
      const k = LENS.edge * Math.exp(-dd * LENS.edgeFall) + LENS.rim * Math.exp(-dd * LENS.rimFall) +
        LENS.corner * Math.exp(-cap * LENS.cornerFall * 0.1) * Math.exp(-dd * 0.3);
      // sample inward (toward the axis): the rim magnifies what's behind, like the edge of a thick lens
      const i = (y * w + x) * 4;
      px[i] = 128 + (-nx * k / scale) * 255; px[i + 1] = 128 + (-ny * k / scale) * 255; px[i + 2] = 128; px[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return { url: c.toDataURL(), scale };
  };
  const bakeSpecular = (w, h) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(W, H); const px = img.data;
    const lx = -0.55, ly = -0.83; // light from the top-left
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const { d, nx, ny } = pill((x + 0.5) / dpr, (y + 0.5) / dpr, w, h);
      if (d < -1) continue;
      const lit = Math.max(0, nx * lx + ny * ly), back = Math.max(0, -(nx * lx + ny * ly));
      let a = 0.85 * lit * lit * Math.exp(-Math.max(d, 0) * 0.55)   // key reflection
            + 0.4 * back * back * Math.exp(-Math.max(d, 0) * 0.7)   // bounce on the opposite rim
            + 0.22 * Math.exp(-Math.max(d, 0) * 1.6);               // thin even rim
      a *= Math.min(Math.max(d + 0.5, 0), 1);                       // anti-aliased outer edge
      const i = (y * W + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = Math.min(255, a * 255);
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  };
  let chromium = false;
  try { chromium = ((navigator.userAgentData && navigator.userAgentData.brands) || []).some((b) => /Chromium/i.test(b.brand)); } catch (_) {}
  const noFx = window.matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)');
  if (nav && !noFx.matches) {
    const NS = 'http://www.w3.org/2000/svg';
    let feImg = null, feMap = null, lensScale = 0, shown = 0, anim = 0, goal = -1;
    if (chromium) {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.innerHTML = '<filter id="nav-lens" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
        '<feImage result="map" preserveAspectRatio="none"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
      document.body.appendChild(svg);
      feImg = svg.querySelector('feImage'); feMap = svg.querySelector('feDisplacementMap');
    }
    // the lens "forms" when the glass materialises: displacement scale eases from 0 to full
    const setShown = (target) => {
      if (!feMap) return;
      // the observer fires on every class change (light/dark tone too): only animate when the target really changes,
      // otherwise each tone switch rewrote the filter for 360ms and re-ran the backdrop refraction every frame
      if (target === goal) return;
      goal = target;
      cancelAnimationFrame(anim);
      if (reduceMotion.matches) { shown = target; feMap.setAttribute('scale', (shown * lensScale).toFixed(2)); return; }
      const from = shown, t0 = performance.now(), dur = 360;
      const step = (t) => {
        const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        shown = from + (target - from) * e;
        feMap.setAttribute('scale', (shown * lensScale).toFixed(2));
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    let lastW = 0, lastH = 0;
    const bake = () => {
      const w = Math.round(nav.offsetWidth), h = Math.round(nav.offsetHeight);
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      nav.style.setProperty('--lens-spec', 'url("' + bakeSpecular(w, h) + '")');
      if (feImg) {
        const m = bakeDisplacement(w, h);
        lensScale = m.scale;
        ['x', 'y'].forEach((a) => feImg.setAttribute(a, '0'));
        feImg.setAttribute('width', w); feImg.setAttribute('height', h);
        feImg.setAttribute('href', m.url);
        feMap.setAttribute('scale', (shown * lensScale).toFixed(2));
        nav.classList.add('has-refraction');
      }
      nav.classList.add('has-lens');
    };
    const sync = () => setShown(nav.classList.contains('is-resting') ? 0 : 1);
    new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ['class'] });
    if ('ResizeObserver' in window) new ResizeObserver(bake).observe(nav);
    const start = () => { bake(); sync(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  }

  /* ---------- language switch (desktop): EN | ES, its own piece of glass in the top-right corner ----------
     Built only where the page declares both alternates (<link rel="alternate" hreflang>), so a page without a twin
     shows nothing. Two links, not buttons: each goes to the same page in the other language, keeping the #section.
     Pressing lifts the selection into a lens; it can be dragged across and settles on a spring that inherits the
     drag's velocity (critically damped for taps and keys, a little bounce after a throw). Reduced motion: no slide. */
  const altOf = (l) => document.querySelector('link[rel="alternate"][hreflang="' + l + '"]');
  if (nav && altOf('en') && altOf('es')) {
    const LANGS = [['en', 'EN', 'English'], ['es', 'ES', 'Español']];
    const curIdx = ES ? 1 : 0;
    const sw = document.createElement('div');
    sw.className = 'lang glass glass--interactive';
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', t('Language', 'Idioma'));
    sw.innerHTML = '<span class="lang-thumb" aria-hidden="true"></span>' + LANGS.map(([code, label, name], i) =>
      '<a href="' + new URL(altOf(code).href).pathname + '" hreflang="' + code + '" lang="' + code + '" aria-label="' + name + '"' +
      (i === curIdx ? ' aria-current="true"' : '') + '>' + label + '</a>').join('');
    const header = nav.closest('header') || nav;
    header.parentNode.insertBefore(sw, header.nextSibling);   // tab order: right after the nav links
    const thumb = sw.querySelector('.lang-thumb');
    const links = [...sw.querySelectorAll('a')];

    // same tone as the nav: bare over the home hero, dark or light glass with whatever is underneath
    const tone = () => {
      sw.classList.toggle('glass--light', nav.classList.contains('is-on-light'));
      sw.classList.toggle('is-resting', nav.classList.contains('is-resting'));
    };
    new MutationObserver(tone).observe(nav, { attributes: true, attributeFilter: ['class'] });
    tone();

    // springs (mass 1): stiffness (2π/response)², damping 4π·ζ/response, as in SwiftUI
    let seg = 0;
    const S = { x: 0, v: 0, to: 0, damp: 1, s: 1, sv: 0, sto: 1 };
    const paint = () => { thumb.style.transform = 'translateX(' + S.x.toFixed(2) + 'px) scale(' + S.s.toFixed(4) + ')'; };
    const measure = () => {
      seg = links[1].offsetLeft - links[0].offsetLeft;
      if (!raf && !drag) { S.x = S.to = links.findIndex((a) => a.hasAttribute('aria-current')) * seg; paint(); }
    };
    let raf = 0, last = 0, drag = null, swallowClick = false;
    const spring = (p, v, to, response, zeta, dt) => {
      const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * zeta) / response;
      v += (-k * (p - to) - c * v) * dt;
      return [p + v * dt, v];
    };
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      if (!drag) [S.x, S.v] = spring(S.x, S.v, S.to, 0.36, S.damp, dt);
      [S.s, S.sv] = spring(S.s, S.sv, S.sto, 0.24, 1, dt);
      const still = Math.abs(S.x - S.to) < 0.15 && Math.abs(S.v) < 3 && Math.abs(S.s - S.sto) < 0.001 && Math.abs(S.sv) < 0.02;
      if (still && !drag) { S.x = S.to; S.s = S.sto; S.v = S.sv = 0; raf = 0; } else raf = requestAnimationFrame(step);
      paint();
    };
    const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

    const commit = (idx, thrown) => {
      S.to = idx * seg; S.damp = thrown ? 0.8 : 1; S.sto = 1;
      if (idx === links.findIndex((a) => a.hasAttribute('aria-current'))) { run(); return; }
      links.forEach((a, i) => { if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      const url = links[idx].getAttribute('href') + location.hash;
      if (reduceMotion.matches) { location.href = url; return; }
      run();
      setTimeout(() => { location.href = url; }, 300);   // the thumb has all but arrived; the page follows
    };

    links.forEach((a, i) => a.addEventListener('click', (e) => {
      e.preventDefault();
      if (swallowClick) return;
      if (!seg) measure();
      commit(i, false);
    }));

    sw.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || reduceMotion.matches) return;
      measure();
      drag = { id: e.pointerId, x0: e.clientX, base: S.x, moved: false, lx: e.clientX, lt: performance.now(), vel: 0 };
      S.sto = 1.16; sw.classList.add('is-lifted'); run();   // highlight on touch-down: the selection lifts into a lens
    });
    sw.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      if (!drag.moved) {
        if (Math.abs(dx) < 4) return;
        drag.moved = true; sw.setPointerCapture(e.pointerId);
      }
      let x = drag.base + dx;                                    // glued to the pointer, from where it was grabbed
      if (x < 0) x /= 3; else if (x > seg) x = seg + (x - seg) / 3; // rubber band past the ends
      const now = performance.now();
      drag.vel = (e.clientX - drag.lx) / Math.max((now - drag.lt) / 1000, 0.001);
      drag.lx = e.clientX; drag.lt = now;
      S.x = x; S.v = 0;
    });
    const release = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      sw.classList.remove('is-lifted');
      if (!d.moved) { S.sto = 1; run(); return; }               // a plain press: the click commits
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      S.v = d.vel;                                               // hand the drag's velocity to the spring
      const home = links.findIndex((a) => a.hasAttribute('aria-current'));
      commit(cancelled ? home : (S.x + d.vel * 0.08 > seg / 2 ? 1 : 0), true);
    };
    sw.addEventListener('pointerup', (e) => release(e, false));
    sw.addEventListener('pointercancel', (e) => release(e, true));

    const desktop = window.matchMedia('(min-width: 1024px)');
    if (desktop.addEventListener) desktop.addEventListener('change', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure); else measure();
    window.addEventListener('pageshow', (e) => {                // back/forward cache: undo a half-finished switch
      if (!e.persisted) return;
      links.forEach((a, i) => { if (i === curIdx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      cancelAnimationFrame(raf); raf = 0; S.s = S.sto = 1; measure();
    });
  }

  /* ---------- interactive glass: the specular highlight follows the pointer (fine pointers only) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.glass--interactive').forEach((el) => {
      let raf = 0, px = 0, py = 0;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top;
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; el.style.setProperty('--mx', px + 'px'); el.style.setProperty('--my', py + 'px'); });
      }, { passive: true });
    });
  }

  /* ---------- nav "Mail" and footer address: copy the address instead of opening a mail client, and say so with a tooltip ----------
     (only with a mouse; on touch screens both open the mail app)
     The link keeps its mailto: href, so without JS (or if copying is blocked) it still opens the mail app. */
  const mailLinks = document.querySelectorAll('[data-copy-email]');
  if (mailLinks.length) {
    const tip = document.createElement('div');
    tip.className = 'copy-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    tip.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span></span>';
    document.body.appendChild(tip);
    const tipText = tip.querySelector('span');
    let hideTimer = 0;

    const copyText = async (text) => {
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
      } catch (_) { /* fall through to the legacy path */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.select(); ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (_) { return false; }
    };

    // sits under the nav, centred on the Mail item, kept 12px inside the screen edges; the arrow keeps pointing at the item
    const placeTip = (link) => {
      const navRect = (link.closest('.nav') || link).getBoundingClientRect();
      const r = link.getBoundingClientRect();
      const w = tip.offsetWidth, vw = document.documentElement.clientWidth;
      const cx = r.left + r.width / 2;
      const left = Math.min(Math.max(cx - w / 2, 12), Math.max(12, vw - w - 12));
      tip.style.left = left + 'px';
      tip.style.top = Math.round(navRect.bottom + 12) + 'px';
      tip.style.setProperty('--arrow-x', Math.min(Math.max(cx - left, 16), w - 16) + 'px');
    };

    const showTip = (link) => {
      clearTimeout(hideTimer);
      tipText.textContent = '';                                   // re-set so screen readers announce every copy
      requestAnimationFrame(() => { tipText.textContent = t('Email copied', 'Email copiado'); placeTip(link); tip.classList.add('is-on'); });
      hideTimer = setTimeout(() => tip.classList.remove('is-on'), 2200);
    };

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)'); // same test as the CSS that swaps the icon
    mailLinks.forEach((link) => {
      link.addEventListener('click', async (e) => {
        // copying is for mouse users; on touch screens the link stays a plain mailto: and opens the mail app
        if (!finePointer.matches) return;
        e.preventDefault();
        const email = (link.getAttribute('href') || '').replace(/^mailto:/i, '').split('?')[0];
        const ok = email && await copyText(email);
        if (ok) showTip(link); else window.location.href = link.href;   // can't copy: open the mail app as before
      });
    });
    window.addEventListener('scroll', () => { if (tip.classList.contains('is-on')) tip.classList.remove('is-on'); }, { passive: true });
  }

  /* ---------- case study progress (desktop) + back to top (mobile) ----------
     Both are built here so every page gets them from one place. The bar reads the case as an execution:
     one tick per [data-chapter] section. Below 768px it's replaced by a glass back-to-top button. */
  const DARK_TONE = '.on-dark, .bg-ink, .bg-plum, .navbg';
  const isLightAt = (el, x, y) => {
    let under = null;
    for (const n of document.elementsFromPoint(x, y)) { if (!el.contains(n)) { under = n; break; } }
    const tone = under && under.closest(DARK_TONE + ', .on-light');
    return !!under && (!tone || tone.matches('.on-light'));
  };
  const mobile = window.matchMedia('(max-width: 767.98px)');

  const chapters = [...document.querySelectorAll('[data-chapter]')];
  let bar = null;
  if (chapters.length > 1) {
    bar = document.createElement('nav');
    bar.className = 'cs-bar glass';
    bar.setAttribute('aria-label', t('Case study progress', 'Progreso del proyecto'));
    bar.hidden = true;
    bar.innerHTML = '<span class="cs-bar-dot" aria-hidden="true"></span><span class="cs-bar-text" aria-live="polite"></span><ol class="cs-bar-ticks"></ol>';
    const text = bar.querySelector('.cs-bar-text');
    const list = bar.querySelector('.cs-bar-ticks');
    const links = chapters.map((c, i) => {
      if (!c.id) c.id = 'ch-' + (i + 1);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + c.id;
      a.setAttribute('aria-label', c.dataset.chapter + ', ' + (i + 1) + t(' of ', ' de ') + chapters.length);
      li.appendChild(a); list.appendChild(li);
      return a;
    });
    document.body.appendChild(bar);   // outside .view: its entrance transform would trap position: fixed
    const hero = document.querySelector('.case-hero');
    const end = document.querySelector('.next-case') || document.querySelector('.site-footer');
    let current = -1;
    bar.__update = () => {
      const vh = window.innerHeight;
      const pastHero = hero ? hero.getBoundingClientRect().bottom < vh * 0.4 : window.scrollY > vh * 0.5;
      const atEnd = end ? end.getBoundingClientRect().top < vh * 0.9 : false;
      bar.hidden = mobile.matches || !pastHero || atEnd;
      let idx = 0;
      chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < vh * 0.5) idx = i; });
      if (idx === current) return;
      current = idx;
      const last = idx === chapters.length - 1;
      bar.classList.toggle('is-finished', last);
      text.textContent = last ? t('Finished', 'Terminado') : chapters[idx].dataset.chapter + ', ' + (idx + 1) + t(' of ', ' de ') + chapters.length;
      links.forEach((a, i) => {
        a.classList.toggle('is-past', i < idx);
        if (i === idx) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
    };
  }

  const top = document.createElement('button');
  top.type = 'button';
  top.className = 'to-top glass glass--interactive';
  top.setAttribute('aria-label', t('Back to top', 'Volver arriba'));
  top.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  top.tabIndex = -1;
  document.body.appendChild(top);
  top.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    const target = document.getElementById('main');
    if (target) target.focus({ preventScroll: true });
  });
  const updateTop = () => {
    const on = mobile.matches && window.scrollY > window.innerHeight * 0.9;
    top.classList.toggle('is-on', on);
    top.tabIndex = on ? 0 : -1;
    top.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) {
      const r = top.getBoundingClientRect();
      top.classList.toggle('glass--light', isLightAt(top, r.left + r.width / 2, r.top + r.height / 2));
    }
  };

  let floatQueued = false;
  const floatUpdate = () => { floatQueued = false; if (bar) bar.__update(); updateTop(); };
  const floatQueue = () => { if (!floatQueued) { floatQueued = true; requestAnimationFrame(floatUpdate); } };
  window.addEventListener('scroll', floatQueue, { passive: true });
  window.addEventListener('resize', floatQueue, { passive: true });
  if (mobile.addEventListener) mobile.addEventListener('change', floatQueue);
  floatUpdate();

  /* ---------- page load: reveal + scroll regions ---------- */
  armReveals(document);
  bindScrollables();
  window.addEventListener('load', bindScrollables);
})();

/* images: no right-click menu and no dragging them out of the page (text and the rest of the page stay normal) */
document.addEventListener('contextmenu', (e) => { if (e.target instanceof Element && e.target.closest('img')) e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (e.target instanceof Element && e.target.tagName === 'IMG') e.preventDefault(); });
