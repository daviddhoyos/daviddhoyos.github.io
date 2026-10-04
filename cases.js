/* Home case studies: fixed index (left) + art (right), one slot per case.
   1) Active case: the last slot whose top has passed a line near the top third of the screen (list highlights it).
   2) Dashboard animation is time-based, not scroll-based: when a case becomes active its window glides down, holds,
      returns to the top, rests, and repeats. Only the active case plays; the others rest at the top.
   3) Scroll friction (desktop, mouse/trackpad, motion allowed): each case is a "station"; leaving one takes a little
      accumulated wheel distance (see below). Same at both ends. Keyboard, scrollbar and touch stay native. */
(() => {
  'use strict';
  const root = document.querySelector('[data-cases]');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const desk = matchMedia('(min-width: 1024px)');
  const slots = [...root.querySelectorAll('.cs-slot')];
  const items = [...root.querySelectorAll('.cs-item')];
  const arts = slots.map((s) => s.querySelector('.cs-art'));

  // pinned app bar / side nav: copies of the same screenshot, so only the page content moves under them
  arts.forEach((art) => {
    const win = art.querySelector('.win');
    if (!win) return;
    const vp = win.querySelector('.win-viewport'), c = win.querySelector('.win-content');
    const copy = () => { const i = c.cloneNode(); i.className = ''; i.alt = ''; return i; };
    if (win.hasAttribute('data-pin')) {
      const pin = document.createElement('div'); pin.className = 'win-pin'; pin.setAttribute('aria-hidden', 'true');
      const clip = document.createElement('div'); clip.appendChild(copy()); pin.appendChild(clip); vp.appendChild(pin);
    }
    if (win.hasAttribute('data-pin-side')) {
      const side = document.createElement('div'); side.className = 'win-pin-side'; side.setAttribute('aria-hidden', 'true');
      side.appendChild(copy()); vp.appendChild(side);
    }
  });

  /* ---------- dashboard loop: down, hold, back to the top, rest, repeat ---------- */
  let timers = [];
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));
  const play = (i) => {
    timers.forEach(clearTimeout); timers = [];
    slots.forEach((s, k) => { if (k !== i) s.classList.remove('is-down'); });
    if (reduce.matches || i < 0) return;
    const slot = slots[i];
    const el = slot.querySelector('.win, .edelap-media');
    const dur = (parseFloat(getComputedStyle(el).getPropertyValue('--dur')) || 4) * 1000;
    const cycle = () => {
      slot.classList.add('is-down');
      after(150 + dur + 1500, () => { slot.classList.remove('is-down'); after(1100 + 3000, cycle); });
    };
    after(700, cycle);
  };

  /* ---------- active case ---------- */
  let active = -1, raf = 0;
  const tick = () => {
    raf = 0;
    const line = innerHeight * (desk.matches ? 0.35 : 0.5);
    let a = 0;
    slots.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) a = i; });
    if (a === active) return;
    active = a;
    items.forEach((it, i) => it.classList.toggle('on', i === a));
    slots.forEach((s, i) => s.classList.toggle('on', i === a));
    play(a);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  addEventListener('load', kick);
  kick();

  /* ---------- case stepping (only inside the case studies section) ----------
     Outside the section the page scrolls natively. From the hero, any downward scroll (even a long swipe) glides to the
     first case; inside, one gesture = one case; from the last case (or the first, going up) the page scrolls natively. */
  const gateOn = () => desk.matches && fine.matches && !reduce.matches;
  const html = document.documentElement;
  let S = [], anim = null, lockUntil = 0, lastAbs = 0, lastT = 0, lastDir = 0, exiting = false, exitT = 0;
  const measure = () => {
    const vh = innerHeight, top = (el) => el.getBoundingClientRect().top + scrollY;
    const title = document.getElementById('projects-h');
    S = slots.map((s, i) => Math.round(i === 0 && title ? top(title) - Math.max(110, vh * 0.12) : top(s) + s.offsetHeight / 2 - vh / 2));
  };
  /* The glide is the browser's own smooth scroll, which runs on the compositor: it stays fluid even while the main
     thread is busy (hero shader, big screenshots decoding). A rAF tween stalled there and then jumped. */
  let endT = 0;
  const finish = () => {
    if (!anim) return;
    clearTimeout(endT); anim = null;
    lockUntil = performance.now() + 220;                         // then swallow the tail of the same gesture
  };
  const go = (y) => {
    y = Math.max(0, Math.min(y, html.scrollHeight - innerHeight));
    if (Math.abs(y - scrollY) < 2) return;
    anim = { kind: 'move', to: y };
    window.scrollTo({ top: y, behavior: 'smooth' });
    clearTimeout(endT); endT = setTimeout(finish, 1100);          // fallback where scrollend is missing
  };
  addEventListener('scrollend', () => { if (anim && Math.abs(scrollY - anim.to) < 3) finish(); });
  addEventListener('scroll', () => {                             // fallback for browsers without scrollend
    if (!anim) return;
    clearTimeout(endT); endT = setTimeout(finish, Math.abs(scrollY - anim.to) < 3 ? 60 : 400);
  }, { passive: true });

  addEventListener('wheel', (e) => {
    if (!gateOn() || e.ctrlKey || e.metaKey || e.shiftKey) return;
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 33; else if (e.deltaMode === 2) d *= innerHeight;
    const dir = Math.sign(d);
    if (!dir) return;
    measure();
    if (exiting && (dir < 0 || performance.now() - exitT > 400)) exiting = false;
    if (exiting) exitT = performance.now();
    const y = scrollY, vh = innerHeight, tol = vh * 0.1, zone = vh * 1.2;
    const first = S[0], last = S[S.length - 1];
    // outside the section: native scroll, untouched
    if (y < first - zone || y > last + zone) return;
    if ((y > last + tol || (exiting && dir > 0)) && !anim) return;                                   // below the last case: plain native scroll
    if (dir < 0 && y <= first + tol) { anim = null; clearTimeout(endT); lockUntil = 0; return; }   // first case → hero: plain native scroll

    const now = performance.now(), abs = Math.abs(d), gap = now - lastT;
    const fresh = gap > 200 || dir !== lastDir || abs > lastAbs * 1.6 + 4;           // a new gesture, not inertia from the last one
    lastT = now; lastAbs = abs; lastDir = dir;
    if ((anim && anim.kind === 'move') || (now < lockUntil && !fresh)) {   // swallow the tail of the gesture that moved us
      e.preventDefault(); if (!anim) lockUntil = now + 150; return;
    }
    if (dir > 0 && y >= last - tol) { lockUntil = 0; exiting = true; exitT = performance.now(); return; }      // last case → More projects: plain native scroll (once the arrival gesture is over)

    const at = S.findIndex((s) => Math.abs(y - s) <= tol);
    // leaving: on the last case going down, or the first going up, the page just scrolls natively
    if ((at === S.length - 1 && dir > 0) || (at === 0 && dir < 0)) return;
    let j;
    if (at >= 0) j = at + dir;                     // one scroll = one case
    else if (dir > 0 && y < S[1] - tol) j = 0;     // from the hero (even a long swipe): the first case, never past it
    else if (dir > 0) j = S.findIndex((s) => s > y);
    else if (dir < 0 && y > S[S.length - 2] + tol) j = S.length - 1;   // same coming up from the footer
    else { j = -1; for (let k = S.length - 1; k >= 0; k--) if (S[k] < y) { j = k; break; } }
    if (j < 0 || j >= S.length) return;
    e.preventDefault(); go(S[j]);
  }, { passive: false });

  // clicking a title still jumps straight to its case
  items.forEach((it, i) => it.querySelector('.cs-title').addEventListener('click', (e) => {
    if (!gateOn() || it.classList.contains('on')) return;
    e.preventDefault(); measure(); go(S[i]);
  }));

  /* ---------- touch press: the art shrinks 1% almost instantly on tap-down (Apple-style), eases back on release ---------- */
  arts.forEach((art) => {
    const on = (e) => { if (e.pointerType !== 'mouse') art.classList.add('is-pressed'); };
    const off = () => art.classList.remove('is-pressed');
    art.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => art.addEventListener(t, off));   // a scroll start fires pointercancel
  });

  /* ---------- cursor label over the art (mouse only) ---------- */
  if (!fine.matches) return;
  const tag = document.createElement('div');
  tag.className = 'case-cursor'; tag.setAttribute('aria-hidden', 'true'); tag.textContent = /^es\b/i.test(document.documentElement.lang) ? 'Ver caso' : 'View case study';
  document.body.appendChild(tag);
  let x = 0, y = 0, tx = 0, ty = 0, w = 0, h = 0, shown = false, craf = 0, has = false;
  const place = () => { tag.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`; };
  const follow = () => {
    const k = reduce.matches ? 1 : 0.22;
    x += (tx - x) * k; y += (ty - y) * k; place();
    craf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(follow) : 0;
  };
  const show = (on) => {
    if (on === shown) return;
    shown = on; tag.classList.toggle('on', on);
    if (on) { w = tag.offsetWidth; h = tag.offsetHeight; x = tx; y = ty; place(); }
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    has = true; tx = e.clientX; ty = e.clientY;
    show(!!e.target.closest('.cs-art'));
    if (shown && !craf) craf = requestAnimationFrame(follow);
  }, { passive: true });
  addEventListener('scroll', () => {
    if (!has) return;
    const el = document.elementFromPoint(tx, ty);
    show(!!(el && el.closest('.cs-art')));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => show(false));
})();
