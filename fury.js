/* Fury case study: the project run lights up once, and the pipeline wizard switches steps.
   Everything is readable without this script. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- project run: modules finish in order, once, when the run comes into view ---------- */
  const run = document.querySelector('[data-run]');
  if (run) {
    run.querySelectorAll('.fx-mod').forEach((m, i) => m.style.setProperty('--i', i));
    if (reduce.matches || !('IntersectionObserver' in window)) run.classList.add('is-done');
    else {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { run.classList.add('is-done'); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(run);
    }
  }

})();

/* ---------- pipeline wizard: tabs with arrow keys, no autoplay ---------- */
(() => {
  const wz = document.querySelector('[data-wizard]');
  if (!wz) return;
  const tabs = [...wz.querySelectorAll('[role="tab"]')];
  const select = (t, focus) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', on);
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const k = e.key;
      let n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
})();
