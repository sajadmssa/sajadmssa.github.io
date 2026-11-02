(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(k => k != null && n.append(k.nodeType ? k : document.createTextNode(k)));
    return n;
  };
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const data = JSON.parse($('#data').textContent);
  const IMG = document.body.dataset.img;
  const UI = data.ui, P = data.projects, byId = Object.fromEntries(P.map(p => [p.id, p]));

  /* ---------- Blueprint network (deterministic) ---------- */
  const svg = $('#net'), NS = 'http://www.w3.org/2000/svg', W = 1440, H = 820;
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const r = rng(20261028), cols = 10, rows = 6, cw = W / (cols - 1), ch = H / (rows - 1), pts = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++)
    pts.push({ x: Math.round(i * cw + (r() - .5) * 70 + (i === 0 ? 30 : i === cols - 1 ? -30 : 0)), y: Math.round(j * ch + (r() - .5) * 60 + (j === 0 ? 40 : j === rows - 1 ? -40 : 0)), i, j });
  const at = (i, j) => pts[j * cols + i], mk = n => document.createElementNS(NS, n);
  const edges = mk('g'), nodes = mk('g'); let n = 0;
  const addEdge = (a, b) => { const p = mk('path'), xm = Math.round((a.x + b.x) / 2);
    p.setAttribute('d', a.j === b.j ? `M${a.x} ${a.y}H${xm}V${b.y}H${b.x}` : `M${a.x} ${a.y}V${Math.round((a.y + b.y) / 2)}H${b.x}V${b.y}`);
    p.setAttribute('pathLength', '1'); p.setAttribute('class', 'edge'); p.style.animationDelay = (n++ * .045).toFixed(2) + 's'; edges.appendChild(p); };
  pts.forEach(p => { if (p.i < cols - 1 && r() < .78) addEdge(p, at(p.i + 1, p.j)); if (p.j < rows - 1 && r() < .62) addEdge(p, at(p.i, p.j + 1)); });
  const nodeEls = pts.map((p, k) => { const t = r(); let e;
    if (t < .2) { e = mk('rect'); e.setAttribute('x', p.x - 5); e.setAttribute('y', p.y - 5); e.setAttribute('width', 10); e.setAttribute('height', 10); e.setAttribute('class', 'node sq'); }
    else { e = mk('circle'); e.setAttribute('cx', p.x); e.setAttribute('cy', p.y); e.setAttribute('r', t < .34 ? 6.5 : 4); e.setAttribute('class', 'node'); }
    e.style.animationDelay = (.3 + k * .03).toFixed(2) + 's'; nodes.appendChild(e); e._p = p; return e; });
  svg.append(edges, nodes);

  /* ---------- Hero pointer effects (fine pointers only) ---------- */
  if (fine && !calm) {
    const hero = $('#hero'), pt = svg.createSVGPoint(); let raf = 0, ev;
    const frame = () => { raf = 0; const b = hero.getBoundingClientRect(), x = ev.clientX - b.left, y = ev.clientY - b.top;
      hero.style.setProperty('--mx', x + 'px'); hero.style.setProperty('--my', y + 'px');
      hero.style.setProperty('--px', ((x / b.width) * 2 - 1).toFixed(3)); hero.style.setProperty('--py', ((y / b.height) * 2 - 1).toFixed(3));
      pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); if (!m) return; const q = pt.matrixTransform(m.inverse());
      nodeEls.forEach(e => { const dx = e._p.x - q.x, dy = e._p.y - q.y; e.classList.toggle('near', dx * dx + dy * dy < 150 * 150); }); };
    hero.addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(frame); });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); nodeEls.forEach(e => e.classList.remove('near')); });
    const mg = $('#magnet');
    mg.addEventListener('pointermove', e => { const b = mg.getBoundingClientRect(); mg.style.transform = `translate(${((e.clientX - b.left) / b.width - .5) * 10}px,${((e.clientY - b.top) / b.height - .5) * 8}px)`; });
    mg.addEventListener('pointerleave', () => mg.style.transform = '');
  }

  /* ---------- Nav ---------- */
  const nav = $('.nav'), burger = $('.burger');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('.nav ul a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); } });
  const links = $$('.nav ul a'), secs = links.map(a => $(a.getAttribute('href')));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach((a, i) => a.setAttribute('aria-current', secs[i] === e.target ? 'true' : 'false')); }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => s && io.observe(s));
    const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(x => rv.observe(x));
  } else $$('.rv').forEach(x => x.classList.add('in'));

  /* ---------- Project filters ---------- */
  const cards = $$('.pc');
  $$('.fbtn').forEach(b => b.addEventListener('click', () => {
    $$('.fbtn').forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f; cards.forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.status !== f));
  }));

  /* ---------- Card tilt (CSS 3D, subtle) ---------- */
  if (fine && !calm) cards.forEach(c => {
    c.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); c.style.setProperty('--ry', (((e.clientX - b.left) / b.width) - .5) * 5 + 'deg'); c.style.setProperty('--rx', (-(((e.clientY - b.top) / b.height) - .5)) * 4 + 'deg'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- Skills -> highlight projects ---------- */
  const bar = $('#hlbar'); let active = null;
  const defaultBar = () => { bar.replaceChildren(el('span', { text: UI.highlight })); };
  const clearHl = () => { cards.forEach(c => c.classList.remove('dim', 'hit')); $$('.chip[aria-pressed]').forEach(c => c.setAttribute('aria-pressed', 'false')); active = null; defaultBar(); };
  defaultBar();
  $$('.chip[data-p]').forEach(chip => chip.addEventListener('click', () => {
    if (active === chip) return clearHl();
    clearHl(); active = chip; chip.setAttribute('aria-pressed', 'true');
    const ids = chip.dataset.p ? chip.dataset.p.split(',') : [];
    cards.forEach(c => { const hit = ids.includes(c.dataset.id); c.classList.toggle('hit', hit); c.classList.toggle('dim', !hit); });
    bar.replaceChildren();
    if (ids.length) {
      bar.append(el('strong', { text: chip.dataset.name }), el('span', { text: UI.usedIn + ': ' + ids.map(i => byId[i].name).join(' · ') }),
        el('a', { class: 'btn ghost sm', href: '#projects', text: UI.nav.projects }));
    } else bar.append(el('strong', { text: chip.dataset.name }), el('span', { text: UI.noProjects }));
  }));

  /* ---------- Project dialog ---------- */
  const dlg = $('#pdlg'); let opener = null, gi = 0, cur = null;
  const imgUrl = (b, t) => (window.__IMGS && window.__IMGS[b + (t ? '-t' : '')]) || `${IMG}${b}${t ? '-t' : ''}.webp`;
  const renderGallery = box => {
    box.replaceChildren();
    if (!cur.screens.length) { box.append(el('div', { class: 'gph' }, el('div', {}, UI.screensSoon))); return; }
    const main = el('div', { class: 'gmain' });
    const im = el('img', { src: imgUrl(cur.screens[gi]), alt: `${cur.name} — ${gi + 1}/${cur.screens.length}`, decoding: 'async' });
    const fit = () => main.classList.toggle('tall', im.naturalHeight > im.naturalWidth * 1.2);
    im.addEventListener('load', fit); if (im.complete && im.naturalWidth) fit();
    main.append(im);
    if (cur.screens.length > 1) {
      const step = d => { gi = (gi + d + cur.screens.length) % cur.screens.length; renderGallery(box); $('.gnav.' + (d > 0 ? 'n' : 'p'), box)?.focus(); };
      main.append(el('button', { class: 'gnav p', type: 'button', 'aria-label': UI.prev, text: document.dir === 'rtl' ? '›' : '‹' }), el('button', { class: 'gnav n', type: 'button', 'aria-label': UI.next, text: document.dir === 'rtl' ? '‹' : '›' }));
      main.querySelector('.p').addEventListener('click', () => step(-1)); main.querySelector('.n').addEventListener('click', () => step(1));
    }
    box.append(main);
    if (cur.screens.length > 1) {
      const th = el('div', { class: 'gthumbs', role: 'group', 'aria-label': UI.screens });
      cur.screens.forEach((s, i) => { const b = el('button', { type: 'button', 'aria-label': `${i + 1}`, 'aria-current': String(i === gi) }, el('img', { src: imgUrl(s, true), alt: '', loading: 'lazy' })); b.addEventListener('click', () => { gi = i; renderGallery(box); }); th.append(b); });
      box.append(th);
    }
  };
  const ghIcon = () => { const t = document.createElement('template'); t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>'; return t.content.firstChild; };
  const open = (id, from) => {
    cur = byId[id]; gi = 0; opener = from;
    const gal = el('div', { class: 'gal' });
    renderGallery(gal);
    const meta = el('div', { class: 'meta' }, ...(cur.statusLabel ? [el('span', { text: cur.statusLabel })] : []), el('span', { text: cur.platform }));
    const info = el('div', { class: 'minfo' },
      el('div', { class: 'dtitle' }, cur.icon ? el('img', { src: imgUrl(cur.icon), alt: '' }) : null, el('h3', { id: 'mtitle', text: cur.name })), el('div', { class: 'sub', text: cur.nameAr }), meta,
      el('p', { text: cur.summary }),
      cur.role ? [el('h4', { text: UI.role }), el('p', { text: cur.role })] : null,
      cur.features.length ? [el('h4', { text: UI.features }), el('ul', { class: 'flist' }, cur.features.map(f => el('li', { text: f })))] : null,
      cur.tech.length ? [el('h4', { text: UI.tech }), el('ul', { class: 'chips latin' }, cur.tech.map(t => el('li', { class: 'latin', text: t })))] : null,
      [cur.store ? el('a', { class: 'btn primary sm', href: cur.store, target: '_blank', rel: 'noopener', style: 'align-self:flex-start;margin-top:6px', text: UI.visit }) : null,
      cur.repo ? el('a', { class: 'btn primary sm gh', href: cur.repo, target: '_blank', rel: 'noopener noreferrer', style: 'align-self:flex-start;margin-top:6px' }, ghIcon(), UI.download) : null]);
    const close = el('button', { class: 'mclose', type: 'button', 'aria-label': UI.close, text: '×' });
    close.addEventListener('click', () => dlg.close());
    dlg.replaceChildren(el('div', { class: 'mwrap' }, el('div', { class: 'mbox', role: 'document' }, close, gal, info)));
    dlg.setAttribute('aria-labelledby', 'mtitle');
    root.classList.add('lock'); dlg.showModal();
  };
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('mwrap')) dlg.close(); });
  dlg.addEventListener('close', () => { root.classList.remove('lock'); opener && opener.focus && opener.focus(); });
  $$('.more button').forEach(b => b.addEventListener('click', () => open(b.closest('.pc').dataset.id, b)));
  cards.forEach(c => c.addEventListener('click', e => { if (!e.target.closest('a,button')) open(c.dataset.id, $('.more button', c)); }));
})();

(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const data = JSON.parse($('#data').textContent), R = data.reels || [];
  if (!R.length) return;
  const UI = data.ui, base = document.body.dataset.reel || '', byId = Object.fromEntries(R.map(r => [r.id, r]));
  const root = document.documentElement, cards = $$('.rc');
  $$('.rfbtn').forEach(b => b.addEventListener('click', () => {
    $$('.rfbtn').forEach(x => x.setAttribute('aria-pressed', x === b));
    cards.forEach(c => c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.kind !== b.dataset.f));
  }));
  const dlg = document.createElement('dialog'); dlg.className = 'modal'; dlg.id = 'rdlg'; document.body.append(dlg);
  let opener = null;
  const mk = (t, a = {}, ...k) => { const n = document.createElement(t); for (const [x, v] of Object.entries(a)) if (v != null && v !== false) { if (x === 'text') n.textContent = v; else n.setAttribute(x, v === true ? '' : v); } k.flat().forEach(c => c != null && n.append(c)); return n; };
  const typeOf = u => /\.webm($|\?)/i.test(u) ? 'video/webm' : /\.(mov|m4v)($|\?)/i.test(u) ? 'video/quicktime' : 'video/mp4';
  const open = (id, from) => {
    const r = byId[id]; if (!r) return; opener = from;
    const fmts = ['vertical', 'horizontal'].filter(f => r[f]); let cur = fmts[0];
    const holder = mk('div'), fmt = mk('div', { class: 'fmt', role: 'group', 'aria-label': UI.reelFormat });
    const play = (keep) => {
      const old = $('video', holder), t = old && keep ? old.currentTime : 0;
      if (old) { old.pause(); old.removeAttribute('src'); old.load(); }
      holder.replaceChildren();
      const v = mk('video', { controls: true, playsinline: true, preload: 'metadata', poster: r.poster ? base + r.poster : null, 'aria-label': r.title });
      v.append(mk('source', { src: base + r[cur], type: typeOf(r[cur]) }));
      if (r.captions) v.append(mk('track', { kind: 'captions', src: base + r.captions, default: true }));
      v.addEventListener('error', () => holder.replaceChildren(mk('p', { class: 'rerr', role: 'alert', text: UI.reelError })), true);
      v.addEventListener('loadedmetadata', () => { if (t) v.currentTime = t; });
      holder.append(v); v.play().catch(() => {});
    };
    if (fmts.length > 1) fmts.forEach(f => { const b = mk('button', { type: 'button', 'aria-pressed': String(f === cur), text: UI[f === 'vertical' ? 'reelVertical' : 'reelHorizontal'] }); b.addEventListener('click', () => { cur = f; $$('button', fmt).forEach(x => x.setAttribute('aria-pressed', x === b)); play(true); }); fmt.append(b); });
    const close = mk('button', { class: 'mclose', type: 'button', 'aria-label': UI.close, text: '×' }); close.addEventListener('click', () => dlg.close());
    const link = r.project && r.projectName ? mk('a', { class: 'btn ghost sm', href: '#projects', style: 'align-self:flex-start', text: UI.reelProjectLink + ': ' + r.projectName }) : null;
    if (link) link.addEventListener('click', () => dlg.close());
    dlg.replaceChildren(mk('div', { class: 'mwrap' }, mk('div', { class: 'rbox', role: 'document' }, close, mk('h3', { id: 'rtitle', text: r.title }), fmts.length > 1 ? fmt : null, holder, r.description ? mk('p', { text: r.description }) : null, link)));
    dlg.setAttribute('aria-labelledby', 'rtitle'); root.classList.add('lock'); dlg.showModal(); play(false);
  };
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('mwrap')) dlg.close(); });
  dlg.addEventListener('close', () => { const v = $('video', dlg); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } dlg.replaceChildren(); root.classList.remove('lock'); opener && opener.focus && opener.focus(); });
  $$('.rplay').forEach(b => b.addEventListener('click', () => open(b.closest('.rc').dataset.id, b)));
  cards.forEach(c => c.addEventListener('click', e => { if (!e.target.closest('a,button')) open(c.dataset.id, $('.rplay', c)); }));
})();
