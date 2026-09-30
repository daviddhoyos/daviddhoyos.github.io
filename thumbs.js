/* Home thumbnails: the product window comes alive on hover.
   Desktop: hovering the window (or keyboard focus on the card) glides the dashboard down inside it;
   leaving sends it back. Touch has no hover, so each card plays once when it is well in view.
   Motion itself lives in styles.css (transitions on .thumb.is-live); this only toggles the class and
   builds the pinned app bar. Reduced motion: never toggled. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll('.thumb').forEach((card) => {
    const win = card.querySelector('.win');
    if (!win) return;
    const viewport = win.querySelector('.win-viewport');
    const content = win.querySelector('.win-content');

    // pinned app bar: the top strip of the same image, fixed over the scrolling page
    if (win.hasAttribute('data-pin')) {
      const pin = document.createElement('div');
      pin.className = 'win-pin'; pin.setAttribute('aria-hidden', 'true');
      const clip = document.createElement('div');
      const img = content.cloneNode(); img.className = ''; img.alt = ''; img.removeAttribute('loading');
      clip.appendChild(img); pin.appendChild(clip); viewport.appendChild(pin);
    }

    // pinned side navigation: a full copy clipped to the left strip, so only the main area scrolls
    if (win.hasAttribute('data-pin-side')) {
      const side = document.createElement('div');
      side.className = 'win-pin-side'; side.setAttribute('aria-hidden', 'true');
      const img = content.cloneNode(); img.className = ''; img.alt = ''; img.removeAttribute('loading');
      side.appendChild(img); viewport.appendChild(side);
    }

    const live = (on) => card.classList.toggle('is-live', on && !reduce.matches);
    win.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') live(true); });
    win.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') live(false); });
    card.addEventListener('focusin', () => live(true));
    card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) live(false); });

    if (!hover.matches && 'IntersectionObserver' in window) {
      const dur = parseFloat(getComputedStyle(win).getPropertyValue('--dur')) || 4;
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        live(true);
        setTimeout(() => live(false), 150 + dur * 1000 + 1600);
      }, { threshold: 0.6 });
      io.observe(win);
    }
  });
})();
