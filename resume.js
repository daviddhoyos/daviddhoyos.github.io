/* Resume preview: draws each page of the PDF as a sheet of paper over the shader, with PDF.js (Mozilla, Apache-2.0),
   loaded only on this page from cdnjs at a pinned version. Every browser gets the same preview: no built-in PDF viewer
   chrome, and it works on Android, where an <iframe> or <embed> of a PDF shows nothing.
   - Crisp: each page is re-rasterised for its real width x device pixel ratio, again when that width changes.
   - Links in the PDF (email, LinkedIn) stay clickable, as transparent links over the page.
   - Screen readers get the page text (visually hidden), not just a picture of it.
   - If anything fails, the sheet turns into a link to the PDF; the Download button always works. */
(() => {
  'use strict';
  const host = document.querySelector('[data-resume]');
  if (!host) return;
  const ES = /^es\b/i.test(document.documentElement.lang);
  let SRC = host.dataset.src;
  const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

  const fail = () => {
    host.removeAttribute('aria-busy');
    host.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'resume-fallback';
    p.innerHTML = (ES ? 'No se pudo cargar la vista previa. <a href="' : 'The preview couldn’t load. <a href="') + SRC + '" target="_blank" rel="noopener">' + (ES ? 'Abrir el CV en PDF' : 'Open the resume as a PDF') + '</a>.';
    host.appendChild(p);
  };

  const loadLib = () => new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const s = document.createElement('script');
    s.src = LIB + 'pdf.min.js'; s.crossOrigin = 'anonymous';
    s.onload = () => (window.pdfjsLib ? resolve(window.pdfjsLib) : reject(new Error('pdf.js missing')));
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const sheets = []; // { page, base, el, canvas, task, width }

  const draw = (sheet) => {
    const cssW = sheet.el.clientWidth;
    if (!cssW || Math.abs(cssW - sheet.width) < 1) return;
    sheet.width = cssW;
    if (sheet.task) sheet.task.cancel();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const vp = sheet.page.getViewport({ scale: (cssW / sheet.base.width) * dpr });
    // draw into a fresh canvas and swap when done, so a resize never flashes a blank sheet
    const next = document.createElement('canvas');
    next.width = Math.floor(vp.width); next.height = Math.floor(vp.height);
    next.setAttribute('aria-hidden', 'true');
    const task = sheet.page.render({ canvasContext: next.getContext('2d', { alpha: false }), viewport: vp });
    sheet.task = task;
    task.promise.then(() => {
      if (sheet.task !== task) return;
      sheet.task = null;
      if (sheet.canvas) sheet.canvas.replaceWith(next); else sheet.el.prepend(next);
      sheet.canvas = next;
      sheet.el.classList.remove('is-loading');
    }).catch(() => {}); // cancelled by a newer size
  };

  const build = async (pdf) => {
    sheets.forEach((s) => { if (s.task) s.task.cancel(); });
    sheets.length = 0;
    host.innerHTML = '';
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const el = document.createElement('div');
      el.className = 'resume-page on-light is-loading';
      el.style.aspectRatio = base.width + ' / ' + base.height;
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', (ES ? 'Página ' : 'Page ') + n + (ES ? ' de ' : ' of ') + pdf.numPages);
      host.appendChild(el);
      const sheet = { page, base, el, canvas: null, task: null, width: 0 };
      sheets.push(sheet);
      draw(sheet);

      // links, placed in % of the page so they follow every size without recomputing
      page.getAnnotations().then((annots) => {
        annots.filter((a) => a.subtype === 'Link' && a.url).forEach((a) => {
          const [x1, y1, x2, y2] = base.convertToViewportRectangle(a.rect);
          const link = document.createElement('a');
          link.className = 'resume-link';
          link.href = a.url;
          if (!/^mailto:/i.test(a.url)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
          link.setAttribute('aria-label', a.url.replace(/^mailto:/i, '').replace(/^https?:\/\/(www\.)?/i, ''));
          Object.assign(link.style, {
            left: (Math.min(x1, x2) / base.width) * 100 + '%',
            top: (Math.min(y1, y2) / base.height) * 100 + '%',
            width: (Math.abs(x2 - x1) / base.width) * 100 + '%',
            height: (Math.abs(y2 - y1) / base.height) * 100 + '%',
          });
          el.appendChild(link);
        });
      }).catch(() => {});

      // the text, for screen readers and find-in-page
      page.getTextContent().then((tc) => {
        const text = document.createElement('div');
        text.className = 'sr-only';
        text.textContent = tc.items.map((i) => i.str + (i.hasEOL ? '\n' : '')).join('');
        el.appendChild(text);
      }).catch(() => {});
    }
    host.removeAttribute('aria-busy');
  };

  let lib = null, observed = false, loadId = 0;
  const load = async () => {
    const id = ++loadId;
    try {
      if (!lib) { lib = await loadLib(); lib.GlobalWorkerOptions.workerSrc = LIB + 'pdf.worker.min.js'; }
      const pdf = await lib.getDocument({ url: SRC }).promise;
      if (id !== loadId) return;                       // a newer choice already started
      await build(pdf);
    } catch (e) { if (id === loadId) fail(); return; }
    host.classList.remove('is-switching');
    if (observed) return;
    observed = true;
    let t = 0;
    const redraw = () => { clearTimeout(t); t = setTimeout(() => sheets.forEach(draw), 120); };
    if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(host);
    else window.addEventListener('resize', redraw, { passive: true });
  };

  /* which CV: English or Spanish, whatever language the site is in. Starts on the page's language.
     A radio group: arrows move and select, the preview and the Download button follow. */
  const group = document.querySelector('[data-cv-lang]');
  const dl = document.querySelector('[data-cv-download]');
  if (group) {
    const radios = [...group.querySelectorAll('[role="radio"]')];
    const select = (r, focus) => {
      const i = radios.indexOf(r);
      radios.forEach((x) => { x.setAttribute('aria-checked', x === r); x.tabIndex = x === r ? 0 : -1; });
      group.style.setProperty('--cv-i', i);
      if (focus) r.focus();
      if (dl) { dl.href = r.dataset.src; dl.setAttribute('download', r.dataset.file); }
      if (r.dataset.src === SRC) return;
      SRC = r.dataset.src; host.dataset.src = SRC;
      host.classList.add('is-switching');
      load();
    };
    radios.forEach((r, i) => {
      r.addEventListener('click', () => select(r));
      r.addEventListener('keydown', (e) => {
        const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select(radios[(i + k + radios.length) % radios.length], true); }
      });
    });
    const initial = radios.find((r) => r.lang === (ES ? 'es' : 'en')) || radios[0];
    radios.forEach((x) => { x.setAttribute('aria-checked', x === initial); x.tabIndex = x === initial ? 0 : -1; });
    group.style.setProperty('--cv-i', radios.indexOf(initial));
    if (dl) { dl.href = initial.dataset.src; dl.setAttribute('download', initial.dataset.file); }
    SRC = initial.dataset.src; host.dataset.src = SRC;
  }
  load();
})();
