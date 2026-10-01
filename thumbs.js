/* Thumbnails: the product window (or, for Edelap, the phone) comes alive on hover.
   Used by the home cards (.thumb) and by the two small cards on the in-progress page (.status-card).
   Desktop: hovering anywhere on the card (thumbnail, title, text or link), or keyboard focus on it, glides the dashboard
   down inside it; leaving the card sends it back. The lift + deeper shadow stays on the thumbnail itself (styles.css). Touch has no hover, so each card plays once when it is well in view.
   Motion itself lives in styles.css (transitions on .thumb.is-live); this only toggles the class and
   builds the pinned app bar. Reduced motion: never toggled. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll('.thumb, .status-card, .hero-thumb').forEach((card) => {
    const win = card.querySelector('.win');
    const art = win || card.querySelector('.edelap-media');   // the animated piece: product window, or Edelap's media box
    if (!art) return;
    // the whole card is the hover target (home: thumbnail + copy; in-progress: the small card), so the motion is
    // discovered while reading the title, not only when the cursor happens to cross the image
    const target = card;
    const viewport = win && win.querySelector('.win-viewport');
    const content = win && win.querySelector('.win-content');

    // pinned app bar: the top strip of the same image, fixed over the scrolling page
    if (win && win.hasAttribute('data-pin')) {
      const pin = document.createElement('div');
      pin.className = 'win-pin'; pin.setAttribute('aria-hidden', 'true');
      const clip = document.createElement('div');
      const img = content.cloneNode(); img.className = ''; img.alt = ''; img.removeAttribute('loading');
      clip.appendChild(img); pin.appendChild(clip); viewport.appendChild(pin);
    }

    // pinned side navigation: a full copy clipped to the left strip, so only the main area scrolls
    if (win && win.hasAttribute('data-pin-side')) {
      const side = document.createElement('div');
      side.className = 'win-pin-side'; side.setAttribute('aria-hidden', 'true');
      const img = content.cloneNode(); img.className = ''; img.alt = ''; img.removeAttribute('loading');
      side.appendChild(img); viewport.appendChild(side);
    }

    const live = (on) => card.classList.toggle('is-live', on && !reduce.matches);

    // case-study header: the same window plays once on its own, shortly after the page settles, and stays there
    if (card.classList.contains('hero-thumb')) {
      if (!win) return;
      const start = () => setTimeout(() => live(true), 700);
      if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
      return;
    }
    target.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') live(true); });
    target.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') live(false); });
    card.addEventListener('focusin', () => live(true));
    card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) live(false); });

    if (!hover.matches && 'IntersectionObserver' in window) {
      const dur = parseFloat(getComputedStyle(art).getPropertyValue('--dur')) || 4;
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        live(true);
        setTimeout(() => live(false), 150 + dur * 1000 + 1600);
      }, { threshold: 0.6 });
      io.observe(art);
    }
  });
})();
