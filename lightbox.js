/* Image zoom for dense UI captures. Opt-in: <img data-zoom>.
   Each image gets a glass button (visible on hover/focus with a mouse, always on touch); the image itself is clickable too.
   Opens a native <dialog>: Esc, the close button or a click outside the image closes it. Clicking the image toggles
   between "fit to screen" and its full resolution (scrollable). The image grows from where it sits on the page;
   with reduced motion it only fades. */
(() => {
  'use strict';
  const imgs = document.querySelectorAll('img[data-zoom]');
  if (!imgs.length || typeof HTMLDialogElement !== 'function') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ICON_EXPAND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
  const ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.tabIndex = -1;
  dlg.setAttribute('aria-label', 'Enlarged image');
  dlg.innerHTML = '<div class="lightbox-stage"><img class="lightbox-img" alt=""></div><p class="lightbox-caption"></p>' +
    '<button class="lightbox-close" type="button" aria-label="Close enlarged image">' + ICON_CLOSE + '</button>';
  document.body.appendChild(dlg);
  const big = dlg.querySelector('.lightbox-img');
  const cap = dlg.querySelector('.lightbox-caption');
  const stage = dlg.querySelector('.lightbox-stage');
  let source = null;

  // the largest file in srcset, else the current one
  const bestSrc = (img) => {
    const set = (img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)).filter((p) => p[0]);
    if (!set.length) return img.currentSrc || img.src;
    set.sort((a, b) => parseFloat(b[1] || 0) - parseFloat(a[1] || 0));
    return new URL(set[0][0], document.baseURI).href;
  };
  const captionOf = (img) => {
    const fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
    return (fc && fc.textContent.trim()) || img.alt || '';
  };

  const open = (img) => {
    source = img;
    dlg.classList.remove('is-zoomed');
    big.src = bestSrc(img); big.alt = img.alt;
    cap.textContent = captionOf(img); cap.hidden = !cap.textContent;
    dlg.showModal();
    dlg.focus({ preventScroll: true });   // showModal() focuses the first button (the close X); keep focus on the dialog itself
    const from = img.getBoundingClientRect();
    const run = () => {
      const to = big.getBoundingClientRect();
      if (reduce.matches || !to.width || !big.animate) { dlg.animate && dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const s = from.width / to.width;
      big.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      cap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 120, fill: 'backwards' });
    };
    if (big.complete && big.naturalWidth) run(); else big.addEventListener('load', run, { once: true });
  };
  const close = () => {
    if (!dlg.open) return;
    if (reduce.matches || !dlg.animate) { dlg.close(); return; }
    dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).onfinish = () => dlg.close();
  };

  imgs.forEach((img) => {
    const wrap = document.createElement('span');
    wrap.className = 'zoom-wrap';
    img.parentNode.insertBefore(wrap, img); wrap.appendChild(img);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'zoom-btn';
    btn.setAttribute('aria-label', 'Enlarge image' + (captionOf(img) ? ': ' + captionOf(img) : ''));
    btn.innerHTML = ICON_EXPAND;
    wrap.appendChild(btn);
    btn.addEventListener('click', (e) => { e.stopPropagation(); open(img); });
    img.addEventListener('click', () => open(img));
  });

  dlg.querySelector('.lightbox-close').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  // a click on the dimmed area (anything but the image or the close button) closes
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target === stage || e.target === cap) close(); });
  big.addEventListener('click', () => dlg.classList.toggle('is-zoomed'));
  dlg.addEventListener('close', () => { if (source) { const b = source.parentNode.querySelector('.zoom-btn'); b && b.focus({ preventScroll: true }); } source = null; big.removeAttribute('src'); });
})();
