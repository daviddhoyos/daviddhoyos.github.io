/* Generic tabs: [data-tabs] holds a role="tablist" whose buttons point at panels with aria-controls.
   Click or arrow keys (Left/Right, Home/End) switch panels; only the active tab is in the tab order. */
(() => {
  'use strict';
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const show = (t, focus) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      centre();
    };
    // wide trees open centred on their root
    const centre = () => root.querySelectorAll('[role="tabpanel"]:not([hidden]) .ia-canvas').forEach((c) => { c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2; });
    centre(); addEventListener('load', centre, { once: true });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key; let j = null;
        if (k === 'ArrowRight') j = (i + 1) % tabs.length; else if (k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); show(tabs[j], true); }
      });
    });
  });
})();
