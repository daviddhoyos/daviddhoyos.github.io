/* Edelap case study: navigation demo, slow skeleton shimmer on the wireframes, the 11-to-4 menu cut, and numbers that count once.
   Everything is visible and static without JS or with reduced motion. */
(() => {
  /* navigation demo: one active tab at a time */
  document.querySelectorAll('.ed-phonebar').forEach((bar) => {
    const tabs = [...bar.querySelectorAll('.ed-tab')];
    tabs.forEach((t) => t.addEventListener('click', () => tabs.forEach((x) => x.setAttribute('aria-pressed', x === t))));
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('ed-motion');

  /* skeleton: every grey block breathes on its own slow clock, so the screens feel like they are loading, never flashing */
  document.querySelectorAll('[data-wires] .sk').forEach((el, i) => {
    const d = ((i * 0.618) % 1) * 4.2;          // golden-ratio spread: neighbours never pulse together
    el.style.animationDelay = `-${d.toFixed(2)}s`;
    el.style.animationDuration = `${(3.8 + ((i * 0.37) % 1) * 1.6).toFixed(2)}s`;
  });

  const once = (sel, cb, threshold = 0.4) => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } }), { threshold });
    document.querySelectorAll(sel).forEach((n) => io.observe(n));
  };
  once('[data-cut]', (n) => n.classList.add('is-cut'), 0.5);

  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const count = (root) => {
    const nums = [...root.querySelectorAll('[data-count-to]')];
    const t0 = performance.now(), dur = 1600;
    nums.forEach((n) => { n.textContent = n.dataset.countFrom; });
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      nums.forEach((n, i) => { const a = +n.dataset.countFrom, b = +n.dataset.countTo; const tt = Math.max(0, Math.min(1, t * 1.3 - i * 0.1)); n.textContent = tt < 1 ? Math.round(a + (b - a) * ease(tt)) : String(b); });
      if (t < 1 || nums.some((n) => n.textContent !== n.dataset.countTo)) { if (now - t0 < dur * 1.6) requestAnimationFrame(tick); else nums.forEach((n) => { n.textContent = n.dataset.countTo; }); }
    };
    requestAnimationFrame(tick);
  };
  once('[data-stats], .ed-stats', count, 0.5);
})();
