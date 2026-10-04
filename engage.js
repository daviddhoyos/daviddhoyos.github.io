/* Two small interactions, both readable without this script.
   1. Home hero, "Companies I've worked with": pointing at (or tapping) a company shows the years, the role and the
      case studies done there. Turns the logo row into an index that links employers to products.
   2. Case studies, "Your call": the reader picks what they would do, then sees the decision I made and why.
      Nothing is scored and nothing is hidden from people who skip it. If the reader would have gone another way,
      the closing section invites them to tell me about it. */
(() => {
  'use strict';
  const ES = /^es\b/i.test(document.documentElement.lang || '');
  const t = (en, es) => (ES ? es : en);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. companies ---------- */
  const group = document.querySelector('[data-co-group]');
  if (group) {
    const note = group.querySelector('.hero-co-note');
    const buttons = [...group.querySelectorAll('button.co')];
    const hint = () => (fine.matches
      ? t('Point at a company to see what I did there.', 'Pasá el cursor por una empresa para ver qué hice ahí.')
      : t('Tap a company to see what I did there.', 'Tocá una empresa para ver qué hice ahí.'));
    let active = null;
    const render = (html) => {
      if (reduce.matches) { note.innerHTML = html; return; }
      note.classList.add('is-swapping');
      setTimeout(() => { note.innerHTML = html; note.classList.remove('is-swapping'); }, 80);
    };
    const select = (btn) => {
      if (btn === active) return;
      active = btn;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      group.classList.toggle('has-active', !!btn);
      const tpl = btn && group.querySelector('template[data-co-note="' + btn.dataset.co + '"]');
      render(tpl ? tpl.innerHTML : hint());
    };
    note.textContent = hint();
    buttons.forEach((b) => {
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') select(b); });
      b.addEventListener('focus', () => select(b));
      b.addEventListener('click', () => select(b));
    });
    group.addEventListener('keydown', (e) => { if (e.key === 'Escape' && active) { const a = active; select(null); a.focus(); } });
    if (fine.addEventListener) fine.addEventListener('change', () => { if (!active) note.textContent = hint(); });
  }

  /* ---------- 2. your call ---------- */
  const prompts = [...document.querySelectorAll('[data-yc]')];
  if (!prompts.length) return;
  document.documentElement.classList.add('yc-js');

  const follow = (box, picked) => {
    const copy = document.querySelector('.contact-copy');
    if (!copy) return;
    let line = copy.querySelector('.yc-follow');
    if (!line) { line = document.createElement('p'); line.className = 'yc-follow'; copy.querySelector('p').after(line); }
    const subject = encodeURIComponent(t('Your call on ', 'Tu decisión en ') + box.dataset.ycCase);
    const body = encodeURIComponent(t('I would have chosen: ', 'Yo habría elegido: ') + picked + '\n\n');
    line.innerHTML = t('You’d have gone another way on ' + box.dataset.ycTopic + '. ',
      'Habrías ido por otro lado en ' + box.dataset.ycTopic + '. ') +
      '<a href="mailto:daviddhoyos1@gmail.com?subject=' + subject + '&body=' + body + '">' +
      t('I’d like to hear why', 'Me gustaría saber por qué') + '</a>.';
  };

  prompts.forEach((box) => {
    const opts = [...box.querySelectorAll('.yc-opt')];
    const mine = box.querySelector('.yc-opt[data-yc-mine]');
    const verdict = box.querySelector('[data-yc-verdict]');
    const answer = box.querySelector('[data-yc-answer]');
    answer.setAttribute('aria-live', 'polite');
    const finish = (picked) => {
      if (box.classList.contains('is-done')) return;
      opts.forEach((o) => o.setAttribute('aria-disabled', 'true'));
      const tag = document.createElement('span');
      tag.className = 'yc-tag';
      tag.textContent = t('What I did', 'Lo que hice');
      mine.classList.add('is-mine'); mine.appendChild(tag);
      if (picked) {
        picked.classList.add('is-picked');
        picked.setAttribute('aria-pressed', 'true');
        const same = picked === mine;
        verdict.textContent = same ? t('Same call I made.', 'La misma que tomé yo.') : t('I went another way.', 'Yo fui por otro lado.');
        if (!same) follow(box, picked.querySelector('.yc-opt-text').textContent);
      }
      box.classList.add('is-done');
    };
    opts.forEach((o) => {
      o.setAttribute('aria-pressed', 'false');
      o.addEventListener('click', () => { if (o.getAttribute('aria-disabled') !== 'true') finish(o); });
    });
    const skip = box.querySelector('[data-yc-skip]');
    if (skip) skip.addEventListener('click', () => { finish(null); mine.focus(); });
  });
})();
