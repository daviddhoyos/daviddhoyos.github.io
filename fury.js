/* Fury case study: the project run lights up once, and the pipeline wizard switches steps.
   Everything is readable without this script. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- project run: modules finish one by one (slowly), hold, reset and play again while in view ---------- */
  const run = document.querySelector('[data-run]');
  if (run) {
    const mods = run.querySelectorAll('.fx-mod');
    mods.forEach((m, i) => m.style.setProperty('--i', i));
    const STEP = 520;                                  // ms between modules (matches the 520ms delay per module in styles.css)
    const FILL = mods.length * STEP + 700;             // time until the last check has landed
    const HOLD = 2600;                                 // everything lit, before it restarts
    const REST = 900;                                  // empty, before the next pass
    let timer = 0;
    const clear = () => { clearTimeout(timer); timer = 0; };
    const empty = () => {                              // back to the start with no transition
      run.classList.add('is-reset'); run.classList.remove('is-done'); void run.offsetWidth;
    };
    const play = () => {
      run.classList.remove('is-reset'); void run.offsetWidth;
      run.classList.add('is-done');
      timer = setTimeout(() => { empty(); timer = setTimeout(play, REST); }, FILL + HOLD);
    };
    if (reduce.matches || !('IntersectionObserver' in window)) run.classList.add('is-done');
    else {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) { if (!timer) play(); }
          else { clear(); empty(); }
        });
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
