/* Scroll stations: the same stepping as the home case studies, for any section marked [data-stations] with children
   marked [data-station]. Outside the section the page scrolls natively. Coming in, any scroll glides to the first
   station; inside, one gesture = one station (centred on screen); from the last station going down, or the first going
   up, the page scrolls natively again, so it's easy to get in and out but hard to scroll past by accident.
   Desktop with a mouse or trackpad only, and never with reduced motion: keyboard, scrollbar and touch stay native. */
(() => {
  'use strict';
  const roots = [...document.querySelectorAll('[data-stations]')];
  if (!roots.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const desk = matchMedia('(min-width: 1024px)');
  const gateOn = () => desk.matches && fine.matches && !reduce.matches;
  const html = document.documentElement;

  const sets = roots.map((r) => ({ root: r, items: [...r.querySelectorAll('[data-station]')], S: [] }));
  const measure = () => {
    const vh = innerHeight;
    sets.forEach((s) => {
      s.S = s.items.map((el) => {
        const r = el.getBoundingClientRect();
        return Math.round(r.top + scrollY + r.height / 2 - vh / 2);
      });
    });
  };

  let anim = null, lockUntil = 0, lastAbs = 0, lastT = 0, lastDir = 0, exiting = false, exitT = 0, endT = 0;
  const finish = () => { if (!anim) return; clearTimeout(endT); anim = null; lockUntil = performance.now() + 220; };
  const go = (y) => {
    y = Math.max(0, Math.min(y, html.scrollHeight - innerHeight));
    if (Math.abs(y - scrollY) < 2) return;
    anim = { to: y };
    window.scrollTo({ top: y, behavior: 'smooth' });
    clearTimeout(endT); endT = setTimeout(finish, 1100);
  };
  addEventListener('scrollend', () => { if (anim && Math.abs(scrollY - anim.to) < 3) finish(); });
  addEventListener('scroll', () => {
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
    const y = scrollY, vh = innerHeight, tol = vh * 0.1, zone = vh * 0.9;
    const set = sets.find((s) => s.S.length > 1 && y >= s.S[0] - zone && y <= s.S[s.S.length - 1] + zone);
    if (!set) return;                                            // outside every section: native scroll
    const S = set.S, first = S[0], last = S[S.length - 1];
    if (exiting && (dir < 0 || performance.now() - exitT > 400)) exiting = false;
    if (exiting) exitT = performance.now();
    if ((y > last + tol || (exiting && dir > 0)) && !anim) return;
    if (dir < 0 && y <= first + tol && y >= first - tol) { anim = null; clearTimeout(endT); lockUntil = 0; return; }
    if (dir < 0 && y < first - tol) return;                      // above the section going up: native

    const now = performance.now(), abs = Math.abs(d), gap = now - lastT;
    const fresh = gap > 200 || dir !== lastDir || abs > lastAbs * 1.6 + 4;
    lastT = now; lastAbs = abs; lastDir = dir;
    if (anim || (now < lockUntil && !fresh)) { e.preventDefault(); if (!anim) lockUntil = now + 150; return; }
    if (dir > 0 && y >= last - tol) { lockUntil = 0; exiting = true; exitT = performance.now(); return; }

    const at = S.findIndex((s) => Math.abs(y - s) <= tol);
    if ((at === S.length - 1 && dir > 0) || (at === 0 && dir < 0)) return;
    let j;
    if (at >= 0) j = at + dir;
    else if (dir > 0 && y < S[0]) j = 0;                         // coming in from above: the first station, never past it
    else if (dir > 0) j = S.findIndex((s) => s > y);
    else if (dir < 0 && y > last) j = S.length - 1;              // coming back up from below: the last station
    else { j = -1; for (let k = S.length - 1; k >= 0; k--) if (S[k] < y) { j = k; break; } }
    if (j < 0 || j >= S.length) return;
    e.preventDefault(); go(S[j]);
  }, { passive: false });
})();
