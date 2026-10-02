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
      // the copy keeps loading="lazy": an eager copy made every card's large screenshot download at page load
      const img = content.cloneNode(); img.className = ''; img.alt = '';
      clip.appendChild(img); pin.appendChild(clip); viewport.appendChild(pin);
    }

    // pinned side navigation: a full copy clipped to the left strip, so only the main area scrolls
    if (win && win.hasAttribute('data-pin-side')) {
      const side = document.createElement('div');
      side.className = 'win-pin-side'; side.setAttribute('aria-hidden', 'true');
      const img = content.cloneNode(); img.className = ''; img.alt = '';
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

/* Home case cards (.thumb--clay): over the art, the cursor becomes a "View case study" label that follows the mouse with
   a little lag. The whole card is one link (the title's ::after), so this listens on the card and checks the art's box.
   Mouse only; the loop runs only while the label is catching up. */
(() => {
  'use strict';
  const cards = document.querySelectorAll('.thumb--clay');
  if (!cards.length || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tag = document.createElement('div');
  tag.className = 'case-cursor'; tag.setAttribute('aria-hidden', 'true'); tag.textContent = 'View case study';
  document.body.appendChild(tag);
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, w = 0, h = 0, shown = false, owner = null;
  const place = () => { tag.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`; };
  const step = () => {
    const k = reduce.matches ? 1 : 0.22;
    x += (tx - x) * k; y += (ty - y) * k; place();
    raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) ? requestAnimationFrame(step) : 0;
  };
  const show = (on, card) => {
    if (on === shown) return;
    shown = on; tag.classList.toggle('on', on);
    if (owner) owner.classList.remove('has-cursor');
    owner = on ? card : null;
    if (owner) owner.classList.add('has-cursor');
  };
  cards.forEach((card) => {
    const art = card.querySelector('.thumb-art');
    if (!art) return;
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = art.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside && !shown) { w = tag.offsetWidth; h = tag.offsetHeight; x = e.clientX; y = e.clientY; place(); }
      tx = e.clientX; ty = e.clientY;
      show(inside, card);
      if (inside && !raf) raf = requestAnimationFrame(step);
    });
    card.addEventListener('pointerleave', () => show(false, card));
  });
  window.addEventListener('scroll', () => show(false), { passive: true });
})();
