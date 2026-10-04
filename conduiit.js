/* Conduiit case study: build sequence, screen tabs and theme playground. */
(() => {
/* ---------- the build: one level per step ---------- */
(() => {
  const stage = document.querySelector('[data-build-stage]');
  const steps = [...document.querySelectorAll('[data-step]')];
  const meter = [...stage.querySelectorAll('.cd-stage-meter i')];
  const set = (n) => {
    stage.dataset.stage = n;
    steps.forEach((s) => s.classList.toggle('is-current', +s.dataset.step === n));
    meter.forEach((m, i) => { m.style.background = i < n ? '#ab8cff' : ''; });
  };
  const wide = matchMedia('(min-width: 1024px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let io;
  const init = () => {
    if (io) io.disconnect();
    if (!wide.matches || reduce.matches || !('IntersectionObserver' in window)) { set(5); return; }
    set(1);
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.step); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach((s) => io.observe(s));
  };
  wide.addEventListener ? wide.addEventListener('change', init) : wide.addListener(init);
  init();
})();

/* ---------- screens tabs ---------- */
(() => {
  const tabs = [...document.querySelectorAll('.cd-screen-tabs [role="tab"]')];
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
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
})();

/* ---------- theme playground ---------- */
(() => {
  const dash = document.querySelector('[data-theme-target] .cd');
  const derived = document.querySelector('[data-derived]');
  const swatches = [...document.querySelectorAll('[data-swatches] .cd-chip-swatch')];
  const custom = document.querySelector('[data-custom]');
  const logo = dash.querySelector('.cd-logo span');
  const YOUR = /^es\b/i.test(document.documentElement.lang) ? 'tu estudio' : 'your studio';
  const setColor = (c) => {
    dash.style.setProperty('--p', c);
    derived.style.setProperty('--tp', c);
  };
  derived.style.setProperty('--tp', '#561de2');
  swatches.forEach((b) => b.addEventListener('click', () => {
    swatches.forEach((x) => x.setAttribute('aria-pressed', x === b));
    setColor(b.dataset.color); custom.value = b.dataset.color;
    logo.textContent = b.dataset.color === '#561de2' ? 'conduiit' : YOUR;
  }));
  custom.addEventListener('input', () => {
    swatches.forEach((x) => x.setAttribute('aria-pressed', 'false'));
    setColor(custom.value); logo.textContent = YOUR;
  });
  const modes = [...document.querySelectorAll('[data-mode-toggle] button')];
  modes.forEach((b) => b.addEventListener('click', () => {
    modes.forEach((x) => x.setAttribute('aria-pressed', x === b));
    dash.dataset.mode = b.dataset.mode;
  }));
})();
})();
