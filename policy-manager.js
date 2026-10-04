/* Policy Manager case study: message anatomy, screen tabs and the approval demo. */
(() => {
  const ES = /^es\b/i.test(document.documentElement.lang);
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
        t.status.textContent = ES
          ? (n === 0 ? `${t.total} pasos para aprobar` : n >= t.total ? `Aprobada en ${t.total} pasos` : `Paso ${n} de ${t.total}, faltan ${t.total - n}`)
          : (n === 0 ? `${t.total} steps to approve` : n >= t.total ? `Approved in ${t.total} steps` : `Step ${n} of ${t.total}, ${t.total - n} to go`);
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
