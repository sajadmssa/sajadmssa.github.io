(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const data = JSON.parse($('#data').textContent), S = data.svc; if (!S) return;
  const UI = S.ui, items = S.items, byId = Object.fromEntries(items.map(i => [i.id, i]));
  const P = Object.fromEntries(data.projects.map(p => [p.id, p]));
  const MEDIA = window.__MEDIA || {}, root = document.body.dataset.reel || '', docEl = document.documentElement, rtl = document.dir === 'rtl';
  const mk = (t, a = {}, ...k) => { const n = document.createElement(t); for (const [x, v] of Object.entries(a)) if (v != null && v !== false) { if (x === 'text') n.textContent = v; else n.setAttribute(x, v === true ? '' : v); } k.flat().forEach(c => c != null && n.append(c.nodeType ? c : document.createTextNode(c))); return n; };
  const url = p => !p ? '' : /^(https?:)?\/\//.test(p) ? p : root + p;
  const media = id => (MEDIA[id] || []).filter(m => m && (m.type === 'image' ? m.src : (m.vertical || m.horizontal || m.youtube)));
  const cover = m => m.type === 'image' ? m.src : m.poster;
  const playSvg = () => { const t = document.createElement('template'); t.innerHTML = '<span class="play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>'; return t.content.firstChild; };

  /* ---- cards: media counts + cover ---- */
  const cards = $$('.svc');
  cards.forEach(c => {
    const id = c.dataset.id, m = media(id); if (!m.length) return;
    const im = m.filter(x => x.type === 'image').length, rl = m.length - im;
    const cnt = $('.svc-count', c), parts = [];
    if (im) parts.push(im + ' ' + UI.images); if (rl) parts.push(rl + ' ' + UI.reels);
    cnt.textContent = parts.join(' · ');
    const first = m.find(x => cover(x));
    if (first) {
      const box = mk('div', { class: 'svc-cover' }, mk('img', { src: url(cover(first)), alt: '', loading: 'lazy', decoding: 'async' }));
      if (first.type !== 'image') box.append(playSvg());
      c.prepend(box);
    }
  });

  /* ---- filters ---- */
  $$('.sfbtn').forEach(b => b.addEventListener('click', () => {
    $$('.sfbtn').forEach(x => x.setAttribute('aria-pressed', x === b));
    cards.forEach(c => c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f));
  }));

  /* ---- subtle tilt ---- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) cards.forEach(c => {
    c.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); c.style.setProperty('--ry', (((e.clientX - b.left) / b.width) - .5) * 4 + 'deg'); c.style.setProperty('--rx', (-(((e.clientY - b.top) / b.height) - .5)) * 3 + 'deg'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---- dialog ---- */
  const dlg = mk('dialog', { class: 'modal sdlg', id: 'sdlg' }); document.body.append(dlg);
  let opener = null, cur = null, list = [], gi = 0, fmtIdx = {};
  const stopMedia = () => $$('video', dlg).forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
  const viewer = () => {
    const m = list[gi], main = mk('div', { class: 'gmain' });
    if (m.type === 'image') {
      const im = mk('img', { src: url(m.src), alt: m.alt || `${cur.title} — ${gi + 1}/${list.length}`, decoding: 'async' });
      im.addEventListener('error', () => main.replaceChildren(mk('p', { class: 'rerr', role: 'alert', text: UI.err })));
      const fit = () => main.classList.toggle('tall', im.naturalHeight > im.naturalWidth * 1.2);
      im.addEventListener('load', fit); main.append(im);
    } else if (m.youtube) {
      main.classList.add('vid');
      main.append(mk('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(m.youtube) + '?rel=0', title: m.title || cur.title, allow: 'accelerometer; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, loading: 'lazy' }));
    } else {
      main.classList.add('vid');
      const fmts = ['vertical', 'horizontal'].filter(f => m[f]); const f = fmts[Math.min(fmtIdx[gi] || 0, fmts.length - 1)];
      if (f === 'vertical') main.classList.add('tallv');
      const v = mk('video', { controls: true, playsinline: true, preload: 'metadata', poster: m.poster ? url(m.poster) : null, 'aria-label': m.title || cur.title });
      v.append(mk('source', { src: url(m[f]), type: /\.webm($|\?)/i.test(m[f]) ? 'video/webm' : 'video/mp4' }));
      v.addEventListener('error', () => main.replaceChildren(mk('p', { class: 'rerr', role: 'alert', text: UI.err })), true);
      main.append(v);
    }
    return main;
  };
  const render = (box, focusSel) => {
    stopMedia(); box.replaceChildren();
    if (!list.length) { box.append(mk('div', { class: 'gph' }, mk('div', {}, UI.noMedia))); return; }
    const main = viewer();
    if (list.length > 1) {
      const step = d => { gi = (gi + d + list.length) % list.length; render(box, '.gnav.' + (d > 0 ? 'n' : 'p')); };
      const p = mk('button', { class: 'gnav p', type: 'button', 'aria-label': UI.prev, text: rtl ? '›' : '‹' }), n = mk('button', { class: 'gnav n', type: 'button', 'aria-label': UI.next, text: rtl ? '‹' : '›' });
      p.addEventListener('click', () => step(-1)); n.addEventListener('click', () => step(1)); main.append(p, n);
    }
    box.append(main);
    const m = list[gi];
    if (m.type !== 'image' && m.vertical && m.horizontal) {
      const fmt = mk('div', { class: 'fmt', role: 'group' });
      [['vertical', 'V'], ['horizontal', 'H']].forEach(([f, l], i) => { const b = mk('button', { type: 'button', 'aria-pressed': String((fmtIdx[gi] || 0) === i), text: l === 'V' ? (rtl ? 'عمودي' : 'Vertical') : (rtl ? 'أفقي' : 'Horizontal') }); b.addEventListener('click', () => { fmtIdx[gi] = i; render(box); }); fmt.append(b); });
      box.append(fmt);
    }
    if (list.length > 1) {
      const th = mk('div', { class: 'gthumbs', role: 'group' });
      list.forEach((x, i) => {
        const src = cover(x), b = mk('button', { type: 'button', class: x.type === 'image' ? '' : 'vt', 'aria-label': String(i + 1), 'aria-current': String(i === gi) }, src ? mk('img', { src: url(x.thumb || src), alt: '', loading: 'lazy' }) : mk('span'));
        b.addEventListener('click', () => { gi = i; render(box); }); th.append(b);
      });
      box.append(th);
    }
    if (focusSel) $(focusSel, box)?.focus();
  };
  const open = (id, from) => {
    cur = byId[id]; opener = from; gi = 0; fmtIdx = {}; list = media(id);
    const gal = mk('div', { class: 'gal' }); render(gal);
    const rel = (cur.projects || []).filter(x => P[x]);
    const info = mk('div', { class: 'minfo' },
      mk('h3', { id: 'stitle', text: cur.title }),
      mk('p', { text: cur.desc }), mk('p', { text: cur.long }),
      cur.tags.length ? [mk('h4', { text: UI.tools }), mk('ul', { class: 'chips latin' }, cur.tags.map(t => mk('li', { class: 'latin', text: t })))] : null,
      rel.length ? [mk('h4', { text: UI.related }), mk('ul', { class: 'relist' }, rel.map(x => mk('li', { text: P[x].name })))] : null,
      mk('a', { class: 'btn primary sm', href: rel.length ? '#projects' : (cur.cat === 'design' ? '#design' : '#contact'), style: 'align-self:flex-start;margin-top:6px', text: rel.length ? UI.viewProjects : (cur.cat === 'design' ? UI.viewDesign : data.ui.nav.contact) }));
    $('a.btn', info).addEventListener('click', () => dlg.close());
    const close = mk('button', { class: 'mclose', type: 'button', 'aria-label': UI.close, text: '×' }); close.addEventListener('click', () => dlg.close());
    dlg.replaceChildren(mk('div', { class: 'mwrap' }, mk('div', { class: 'mbox', role: 'document' }, close, gal, info)));
    dlg.setAttribute('aria-labelledby', 'stitle'); docEl.classList.add('lock'); dlg.showModal();
  };
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('mwrap')) dlg.close(); });
  dlg.addEventListener('keydown', e => { if (list.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('video,iframe')) { const d = (e.key === 'ArrowRight') === !rtl ? 1 : -1; $('.gnav.' + (d > 0 ? 'n' : 'p'), dlg)?.click(); } });
  dlg.addEventListener('close', () => { stopMedia(); dlg.replaceChildren(); docEl.classList.remove('lock'); opener && opener.focus && opener.focus(); });
  $$('.svc-open').forEach(b => b.addEventListener('click', () => open(b.closest('.svc').dataset.id, b)));
  cards.forEach(c => c.addEventListener('click', e => { if (!e.target.closest('a,button')) open(c.dataset.id, $('.svc-open', c)); }));
})();
