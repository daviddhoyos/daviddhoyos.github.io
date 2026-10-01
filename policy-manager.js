/* Policy Manager case study: message anatomy, before/after toggles, screen tabs, step viewers and the approval demo. */
(() => {
  /* the image itself, or the .zoom-wrap lightbox.js puts around it */
  const layer = (img) => (img.parentElement.classList.contains('zoom-wrap') ? img.parentElement : img);
  // lightbox.js may run after this file: move the initial is-on from the image to its wrapper once it exists
  const syncLayers = () => document.querySelectorAll('.pm-ba-frame img.is-on, .pm-viewer-frame img.is-on').forEach((img) => {
    const l = layer(img); if (l !== img) { img.classList.remove('is-on'); l.classList.add('is-on'); }
  });
  syncLayers(); window.addEventListener('load', syncLayers);

  /* ---------- message anatomy: point at a part of the legend to find it in the sentence ---------- */
  document.querySelectorAll('[data-msg]').forEach((box) => {
    const set = (part) => { if (part) box.dataset.active = part; else delete box.dataset.active; };
    box.querySelectorAll('[data-show-part]').forEach((b) => {
      const part = b.dataset.showPart;
      ['pointerenter', 'focus'].forEach((ev) => b.addEventListener(ev, () => set(part)));
      ['pointerleave', 'blur'].forEach((ev) => b.addEventListener(ev, () => set(null)));
      b.addEventListener('click', () => set(box.dataset.active === part ? null : part));
    });
  });

  /* ---------- before / after ---------- */
  document.querySelectorAll('[data-ba]').forEach((ba) => {
    const btns = [...ba.querySelectorAll('[data-ba-show]')];
    const imgs = [...ba.querySelectorAll('[data-ba-img]')];
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
      imgs.forEach((i) => layer(i).classList.toggle('is-on', i.dataset.baImg === b.dataset.baShow));
    }));
  });

  /* ---------- step viewers (three screens of one flow) ---------- */
  document.querySelectorAll('[data-viewer]').forEach((v) => {
    const btns = [...v.querySelectorAll('[data-step-show]')];
    const imgs = [...v.querySelectorAll('[data-step-img]')];
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
      imgs.forEach((i) => layer(i).classList.toggle('is-on', i.dataset.stepImg === b.dataset.stepShow));
    }));
  });

  /* ---------- screen by screen tabs ---------- */
  document.querySelectorAll('[data-screens]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const select = (t, focus) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });

  /* ---------- approval demo: one click is one step, both flows advance together ---------- */
  document.querySelectorAll('[data-demo]').forEach((demo) => {
    const tracks = [...demo.querySelectorAll('[data-track]')].map((el) => ({
      el, total: +el.dataset.total, dots: [...el.querySelectorAll('.pm-dots li')], status: el.querySelector('[data-status]'),
    }));
    const next = demo.querySelector('[data-demo-next]');
    const reset = demo.querySelector('[data-demo-reset]');
    const live = demo.querySelector('[data-demo-live]');
    const max = Math.max(...tracks.map((t) => t.total));
    let n = 0;
    const render = () => {
      tracks.forEach((t) => {
        const done = Math.min(n, t.total);
        t.dots.forEach((d, i) => d.classList.toggle('is-done', i < done));
        t.el.classList.toggle('is-complete', n >= t.total);
        t.status.textContent = n === 0 ? `${t.total} steps to approve`
          : n >= t.total ? `Approved in ${t.total} steps`
          : `Step ${n} of ${t.total}, ${t.total - n} to go`;
      });
      reset.hidden = n === 0;
      next.hidden = n >= max;
      live.textContent = n === 0 ? '' : tracks.map((t) => `${t.el.querySelector('b').textContent}: ${t.status.textContent}`).join('. ');
    };
    next.addEventListener('click', () => { n = Math.min(max, n + 1); render(); if (n >= max) reset.focus(); });
    reset.addEventListener('click', () => { n = 0; render(); next.focus(); });
    render();
  });
})();
