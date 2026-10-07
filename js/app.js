/* =====================================================================
   app.js — interfaz del Taller de Catalogación
   ===================================================================== */
(function (D) {
  'use strict';
  const M = D.M, V = D.V;
  const KEY = 'dd2-taller-v1', DRAFT = 'dd2-taller-borrador';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = M.esc;

  /* ============================ almacenamiento ============================ */
  let storageOK = true;
  const fresh = () => ({ v: 1, perfil: { nombre: '', seccion: '', agencia: 'clsabn', biblioteca: 'BIBDD2' }, bib: {}, aut: {}, seq: { B: 0, A: 0 } });
  function load() { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { storageOK = false; } return null; }
  let db = load() || fresh();
  db.perfil = Object.assign(fresh().perfil, db.perfil || {});
  if (db.perfil.agencia === 'CL-DD2') db.perfil.agencia = 'clsabn'; // agencia de la planilla UTEM (040 $a clsabn $b spa $c clsabn $e rda)
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); storageOK = true; } catch (e) { storageOK = false; toast('No se pudo guardar en este navegador. Exporta un respaldo para no perder tu trabajo.', 'err'); }
    updateStatus();
  }
  function saveDraft() { try { localStorage.setItem(DRAFT, JSON.stringify({ id: S.editId, rec: S.draft, ts: Date.now() })); } catch (e) { } }
  function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) { } }
  function getDraft() { try { const s = localStorage.getItem(DRAFT); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  /* ============================ estado ============================ */
  const S = { draft: null, editId: null, dirty: false, tab: 'all', side: 'calidad', view: 'opac', lastHash: location.hash, ignoreHash: false, issues: [] };

  /* ============================ utilidades DOM ============================ */
  function el(tag, props, ...kids) {
    const m = tag.match(/^([a-z0-9]+)((?:[.#][\w-]+)*)$/i);
    const e = document.createElement(m ? m[1] : tag);
    if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, t, n) => { if (t === '.') e.classList.add(n); else e.id = n; });
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'on') for (const ev in v) e.addEventListener(ev, v[ev]);
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'class') e.className += ' ' + v;
      else if (k === 'style') e.style.cssText = v;
      else if (k in e && k !== 'list' && k !== 'form') { try { e[k] = v; } catch (x) { e.setAttribute(k, v); } }
      else e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach(k => { if (k == null || k === false) return; e.append(k.nodeType ? k : document.createTextNode(String(k))); });
    return e;
  }
  const btn = (label, on, cls = '', title) => el('button.btn', { type: 'button', class: cls, title, on: { click: on } }, label);
  function toast(msg, kind = 'ok') {
    const t = el('div.toast', { class: kind, role: 'status' }, msg);
    $('#toasts').append(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4300);
  }
  function download(name, text, type = 'text/plain') {
    const blob = text instanceof Blob ? text : new Blob([text], { type: type + ';charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const slug = s => (s || 'estudiante').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'estudiante';
  const fecha = () => new Date().toISOString().slice(0, 10);
  const fmtDate = ts => ts ? new Date(ts).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  /* ============================ íconos ============================ */
  const IC = {
    libro: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8"/>',
    ebook: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    tesis: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
    revista: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M7 8h10M7 12h4M7 16h4M14 12h3v4h-3z"/>',
    articulo: '<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4M9 12h6M9 16h6"/>',
    manuscrito: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 10c2-1 3 1 5 0s3-1 3-1M8 14c2-1 3 1 5 0"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    videoweb: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
    musica: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    audio: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    partitura: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    mapa: '<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 3.5v14.5M15 6v14.5"/>',
    imagen: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
    objeto: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z"/><path d="M3.5 7.25L12 12l8.5-4.75M12 12v9.5"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    software: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M17.5 13.5h.01"/>',
    archivo: '<path d="M3 7h18v13H3z"/><path d="M5 4h14v3H5zM9 11h6"/>',
    kit: '<path d="M3 8l9-4.5L21 8v9l-9 4.5L3 17z"/><path d="M3 8l9 4.5L21 8M12 12.5v9"/>',
    blanco: '<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4"/>',
    traduccion: '<path d="M3 5h9M7.5 3v2M5 5c1 4 4 7 7 8M10 5c-1 4-4 7-7 8"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
    dvd: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v3"/>',
    cd: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>',
    familia: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.7-3.5 3-5 5.5-5s4.8 1.5 5.5 5M13.5 20c.4-2.6 1.8-4 3.5-4s3.1 1.4 3.5 4"/>',
    entidad: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
    evento: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    obra: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    'obra-anonima': '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M10 9h4"/>',
    expresion: '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9 8h6M9 11h4"/>',
    materia: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    lugar: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    genero: '<circle cx="7" cy="7" r="3.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><path d="M7 13.5l4 7H3z"/><path d="M17 14v7M13.5 17.5h7"/>',
    aut: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>'
  };
  const icon = (k, cls = '') => { const s = el('span.ic', { class: cls, 'aria-hidden': 'true' }); s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (IC[k] || IC.blanco) + '</svg>'; return s; };
  const autKind = rec => { const h = M.first(rec, /^1\d\d$/); if (!h) return 'aut'; if (h.tag === '100') return h.ind1 === '3' ? 'familia' : (M.sub(h, 't') ? (M.sub(h, 'l') ? 'expresion' : 'obra') : 'persona'); return { '110': 'entidad', '111': 'evento', '130': 'obra-anonima', '150': 'materia', '151': 'lugar', '155': 'genero' }[h.tag] || 'aut'; };
  const recIcon = rec => rec.kind === 'aut' ? autKind(rec) : M.materialLabel(rec).k;

  /* ============================ datalists globales ============================ */
  function buildDatalists() {
    const box = $('#datalists');
    const mk = (id, items) => box.append(el('datalist', { id }, items.map(i => Array.isArray(i) ? el('option', { value: i[0] }, i[1]) : el('option', { value: i }))));
    mk('dl-rel', D.RELATORES);
    mk('dl-fuentes', D.FUENTES_MATERIA);
    mk('dl-paises', D.PAISES);
    mk('dl-lenguas', D.LENGUAS);
    mk('dl-content', D.RDA_CONTENT.map(x => x[0]));
    mk('dl-media', D.RDA_MEDIA.map(x => x[0]));
    mk('dl-carrier', D.RDA_CARRIER.map(x => [x[0], 'medio: ' + (D.RDA_MEDIA.find(m => m[1] === x[2]) || ['?'])[0]]));
    mk('dl-koha', D.KOHA_TIPOS);
    mk('dl-tags-bib', Object.keys(D.BIB).filter(t => t !== 'LDR').map(t => [t, D.BIB[t].n]));
    mk('dl-tags-aut', Object.keys(D.AUT).filter(t => t !== 'LDR').map(t => [t, D.AUT[t].n]));
    mk('dl-rda', ['rda']);
  }
  function dlFor(tag, code) {
    if (code === 'e' && /^(100|110|700|710|720|800|810)$/.test(tag)) return 'dl-rel';
    if (code === 'j' && /^(111|711)$/.test(tag)) return 'dl-rel';
    if (code === '2' && /^6\d\d$/.test(tag)) return 'dl-fuentes';
    if (code === 'f' && tag === '040') return 'dl-fuentes';
    if (code === 'a' && tag === '336') return 'dl-content';
    if (code === 'a' && tag === '337') return 'dl-media';
    if (code === 'a' && tag === '338') return 'dl-carrier';
    if (tag === '041' && 'abdhjk'.includes(code)) return 'dl-lenguas';
    if ((tag === '377' && code === 'a') || (tag === '040' && code === 'b')) return 'dl-lenguas';
    if ((tag === '942' && code === 'c') || (tag === '952' && code === 'y')) return 'dl-koha';
    if (code === '2' && /^34[4-8]$/.test(tag)) return 'dl-rda';
    return null;
  }

  /* ============================ IDs e importación ============================ */
  function nextId(kind) { const k = kind === 'aut' ? 'A' : 'B'; db.seq[k] = (db.seq[k] || 0) + 1; return k + db.seq[k]; }
  function stamp(rec) {
    rec.updated = Date.now(); if (!rec.created) rec.created = rec.updated;
    if (esUTEM(rec)) return; // planilla UTEM: 001 y demás campos de control se mantienen como en las hojas de ejemplo
    M.setCtl(rec, '001', String(rec.id.slice(1)).padStart(6, '0'));
    M.setCtl(rec, '005', M.stamp005());
    if (!M.first(rec, '003')) M.setCtl(rec, '003', db.perfil.agencia || 'clsabn');
  }
  function guessTpl(rec) {
    if (rec.kind === 'aut') return autKind(rec);
    const k = M.materialLabel(rec).k;
    return { musica: 'cd', video: 'dvd', imagen: 'imagen', kit: 'blanco' }[k] || k;
  }
  // Agrega registros (con ids viejos o sin id) asignando ids nuevos y remapeando $9
  function addRecords(list, extra = {}) {
    const map = {};
    list.forEach(r => { r.kind = r.kind || ((r.ldr || '')[6] === 'z' ? 'aut' : 'bib'); });
    list.filter(r => r.kind === 'aut').concat(list.filter(r => r.kind !== 'aut')).forEach(r => {
      const old = r.id; r.id = nextId(r.kind); if (old) map[old] = r.id;
    });
    list.forEach(r => {
      r.fields = (r.fields || []).filter(f => f.tag !== 'LDR');
      r.fields.forEach(f => (f.subs || []).forEach(s => { if (s.c === '9' && map[s.v]) s.v = map[s.v]; }));
      r.tpl = r.tpl || guessTpl(r);
      Object.assign(r, extra);
      delete r.created; stamp(r);
      M.sort(r);
      (r.kind === 'aut' ? db.aut : db.bib)[r.id] = r;
    });
    persist();
    return list.length;
  }
  function loadExamples() {
    const ag = db.perfil.agencia || 'clsabn', bb = db.perfil.biblioteca || 'BIBDD2';
    const list = [];
    ['aut', 'bib'].forEach(k => D.EJEMPLOS[k].forEach(e => {
      const r = M.parseText(e.lines.join('\n').replace(/\{AG\}/g, ag).replace(/\{BIB\}/g, bb))[0];
      r.ldr = e.ldr; r.kind = k; r.id = e.id; r.tpl = e.tpl; r.ejemplo = true; if (e.ejercicio) r.ejercicio = true;
      list.push(r);
    }));
    const n = addRecords(list);
    toast('Se cargaron ' + n + ' registros de ejemplo.');
  }

  /* ============================ estado de guardado ============================ */
  function updateStatus() {
    const s = $('#save-status'); if (!s) return;
    const nb = Object.keys(db.bib).length, na = Object.keys(db.aut).length;
    s.textContent = storageOK ? nb + ' registros · ' + na + ' autoridades · guardado en este navegador' : 'Sin almacenamiento del navegador: exporta tu trabajo';
    s.className = storageOK ? '' : 'err';
  }

  /* ============================ router ============================ */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/');
    const q = new URLSearchParams(qs || '');
    return { name: parts[0] || 'inicio', id: parts[1], q };
  }
  window.addEventListener('hashchange', () => {
    if (S.ignoreHash) { S.ignoreHash = false; return; }
    if (S.dirty && !location.hash.startsWith('#/editar')) {
      if (!confirm('Tienes cambios sin guardar en el registro. ¿Salir sin guardar?')) { S.ignoreHash = true; location.hash = S.lastHash; return; }
      S.dirty = false; clearDraft();
    }
    render();
  });
  window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  const go = h => { location.hash = h; };

  function render() {
    S.lastHash = location.hash;
    const r = route();
    if (r.name !== 'editar') { S.draft = null; S.editId = null; S.dirty = false; document.onkeydown = null; }
    $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r.name || (a.dataset.r === 'catalogo' && r.name === 'ver' && r.id && r.id[0] === 'B') || (a.dataset.r === 'autoridades' && r.name === 'ver' && r.id && r.id[0] === 'A')));
    const main = $('#main'); main.innerHTML = '';
    window.scrollTo(0, 0);
    const views = { inicio: vInicio, catalogo: vCatalogo, autoridades: vAutoridades, nuevo: vNuevo, 'nueva-autoridad': vNuevaAut, editar: vEditar, ver: vVer, indices: vIndices, datos: vDatos, ayuda: vAyuda };
    (views[r.name] || vInicio)(main, r);
    updateStatus();
  }

  /* ============================ INICIO ============================ */
  function vInicio(main) {
    const nb = Object.keys(db.bib).length, na = Object.keys(db.aut).length;
    const dr = getDraft();
    if (dr && dr.rec) main.append(el('div.banner', null, el('div', null, el('strong', null, 'Tienes un registro sin guardar'), ' — ', M.title(dr.rec), ' (', fmtDate(dr.ts), ')'),
      el('div.row', null, btn('Recuperar', () => { S.draft = dr.rec; S.editId = dr.id; S.dirty = true; S.recovered = true; go('#/editar/' + (dr.id || 'nuevo')); }, 'primary'), btn('Descartar', () => { clearDraft(); render(); }))));
    main.append(el('section.hero', null,
      el('div', null,
        el('p.kicker', null, 'Descripción Documental II · Taller práctico'),
        el('h1', null, 'Taller de Catalogación'),
        el('p.lead', null, 'Un catálogo de práctica en MARC 21 y RDA, con plantillas para libros, tesis, revistas, películas, grabaciones sonoras, partituras, mapas, fotografías, objetos y recursos digitales. Aquí puedes registrar nombres de personas, entidades y materias, y construir sus autoridades.'),
        el('div.row', null,
          el('a.btn.primary', { href: '#/nuevo' }, '+ Nuevo registro bibliográfico'),
          el('a.btn', { href: '#/nueva-autoridad' }, '+ Nueva autoridad'),
          nb + na === 0 ? btn('Cargar ejemplos del curso', () => { loadExamples(); render(); }) : null)),
      el('div.hero-card', null,
        el('div.stat', null, el('b', null, nb), el('span', null, 'registros bibliográficos')),
        el('div.stat', null, el('b', null, na), el('span', null, 'registros de autoridad')),
        el('div.stat', null, el('b', null, Object.values(db.bib).reduce((n, r) => n + M.fields(r, '952').length, 0)), el('span', null, 'ejemplares (ítems)')),
        el('p.small', null, db.perfil.nombre ? 'Catalogador/a: ' + db.perfil.nombre + (db.perfil.seccion ? ' · ' + db.perfil.seccion : '') : el('a', { href: '#/datos' }, 'Ingresa tu nombre para las entregas →')))));
    const steps = [
      ['1', 'Elige una plantilla', 'Según el recurso: libro, DVD, CD, mapa, fotografía, sitio web… Cada plantilla precarga el Líder, el 008, el 007 y los campos habituales.'],
      ['2', 'Describe y codifica', 'Transcribe el 245, 264 y 300; codifica el esqueleto (Líder, 008, 040, 041) con los asistentes; registra contenido, medio y soporte.'],
      ['3', 'Puntos de acceso', 'Agrega 1XX, 6XX y 7XX. Vincúlalos a registros de autoridad para normalizar personas, entidades y materias.'],
      ['4', 'Revisa la calidad', 'El panel de control de calidad aplica las reglas del curso. Mira el registro en MARC, ISBD, ficha, OPAC y WEMI.'],
      ['5', 'Entrega', 'En «Mis datos» exporta tu catálogo (JSON, MARCXML, .mrk) o imprime el informe en PDF para subirlo a Canvas.']];
    main.append(el('section.steps', null, steps.map(s => el('div.step', null, el('span.num', null, s[0]), el('h3', null, s[1]), el('p', null, s[2])))));
    const recent = Object.values(db.bib).concat(Object.values(db.aut)).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 6);
    if (recent.length) main.append(el('section', null, el('h2.sec', null, 'Trabajado recientemente'), el('div.list', null, recent.map(listRow))));
  }

  /* ============================ LISTADOS ============================ */
  function badges(rec) {
    const s = V.summary(V.validate(rec, db));
    return el('span.badges', null,
      s.error ? el('span.badge.error', { title: 'Errores' }, s.error + ' error' + (s.error > 1 ? 'es' : '')) : null,
      s.aviso ? el('span.badge.aviso', { title: 'Avisos' }, s.aviso + ' aviso' + (s.aviso > 1 ? 's' : '')) : null,
      !s.error && !s.aviso ? el('span.badge.ok', null, 'sin errores') : null);
  }
  function listRow(rec) {
    const isA = rec.kind === 'aut';
    const sub = isA ? [M.materialLabel(rec).n, usesOf(rec.id).length + ' uso(s)', rec.fields.filter(f => /^4\d\d$/.test(f.tag)).length + ' variante(s)'] : [M.mainAuthor(rec), M.year(rec), fmtOf(rec) + ' · ' + M.materialLabel(rec).n].filter(Boolean);
    return el('div.lrow', null,
      icon(recIcon(rec), 'big'),
      el('div.lmain', null,
        el('a.ltitle', { href: '#/ver/' + rec.id }, M.title(rec)),
        el('div.lsub', null, sub.join(' · '), rec.kind !== 'aut' && esUTEM(rec) ? el('span.tagx.utem', null, 'planilla UTEM') : null, rec.ejercicio ? el('span.tagx', null, 'ejercicio') : rec.ejemplo ? el('span.tagx', null, 'ejemplo') : null)),
      el('div.lmeta', null, badges(rec), el('span.mono.muted', null, rec.id)),
      el('div.lact', null, el('a.btn.sm', { href: '#/editar/' + rec.id }, 'Editar')));
  }
  const stCache = new WeakMap();
  function searchText(rec) {
    let c = stCache.get(rec);
    if (!c || c.u !== rec.updated) { c = { u: rec.updated, s: M.headNorm(rec.fields.map(f => f.subs ? f.subs.map(s => s.v).join(' ') : (f.value || '')).join(' ') + ' ' + rec.id) }; stCache.set(rec, c); }
    return c.s;
  }
  function vCatalogo(main, r) {
    const q = r.q.get('q') || '', t = r.q.get('t') || '', ord = r.q.get('o') || 'rec';
    main.append(el('div.pagehead', null, el('h1', null, 'Catálogo bibliográfico'), el('a.btn.primary', { href: '#/nuevo' }, '+ Nuevo registro')));
    const mats = {}; D.FORMATOS.forEach(f => { mats[f.k] = f.k + ' — ' + f.n; });
    const inp = el('input.search', { type: 'search', placeholder: 'Buscar por título, autor, materia, ISBN, nota…', value: q, 'aria-label': 'Buscar' });
    const sel = el('select', { 'aria-label': 'Formato' }, el('option', { value: '' }, 'Todos los formatos'), Object.keys(mats).map(k => el('option', { value: k, selected: k === t }, mats[k])));
    const so = el('select', { 'aria-label': 'Orden' }, [['rec', 'Más recientes'], ['tit', 'Título A-Z'], ['id', 'Número de registro'], ['err', 'Con más errores']].map(o => el('option', { value: o[0], selected: o[0] === ord }, o[1])));
    const apply = () => { history.replaceState(null, '', '#/catalogo?q=' + encodeURIComponent(inp.value) + '&t=' + sel.value + '&o=' + so.value); S.lastHash = location.hash; draw(); };
    inp.addEventListener('input', apply); sel.addEventListener('change', apply); so.addEventListener('change', apply);
    main.append(el('div.toolbar', null, inp, sel, so));
    const box = el('div.list'); main.append(box);
    function draw() {
      const nq = M.headNorm(inp.value);
      let rows = Object.values(db.bib).filter(x => (!sel.value || fmtOf(x) === sel.value) && (!nq || nq.split(' ').every(w => searchText(x).includes(w))));
      if (so.value === 'tit') rows.sort((a, b) => M.title(a).localeCompare(M.title(b), 'es'));
      else if (so.value === 'id') rows.sort((a, b) => +a.id.slice(1) - +b.id.slice(1));
      else if (so.value === 'err') rows.sort((a, b) => V.summary(V.validate(b, db)).error - V.summary(V.validate(a, db)).error);
      else rows.sort((a, b) => (b.updated || 0) - (a.updated || 0));
      box.innerHTML = '';
      if (!rows.length) box.append(empty(Object.keys(db.bib).length ? 'No hay registros que coincidan con la búsqueda.' : 'Aún no hay registros. Crea el primero o carga los ejemplos del curso.'));
      rows.forEach(x => box.append(listRow(x)));
    }
    draw();
  }
  function empty(msg) {
    return el('div.empty', null, el('p', null, msg), !Object.keys(db.bib).length && !Object.keys(db.aut).length ? el('div.row.center', null, el('a.btn.primary', { href: '#/nuevo' }, '+ Nuevo registro'), btn('Cargar ejemplos del curso', () => { loadExamples(); render(); })) : null);
  }
  function usesOf(aid) { return Object.values(db.bib).filter(b => b.fields.some(f => M.sub(f, '9') === aid)); }
  function vAutoridades(main, r) {
    const q = r.q.get('q') || '';
    main.append(el('div.pagehead', null, el('h1', null, 'Autoridades'), el('a.btn.primary', { href: '#/nueva-autoridad' }, '+ Nueva autoridad')));
    main.append(el('p.intro', null, 'El registro de autoridad fija la forma normalizada (autorizada) de una persona, familia, entidad, evento, obra, materia o lugar, y reúne sus variantes (4XX), relaciones (5XX) y fuentes (670). Al vincular un campo 1XX/6XX/7XX con su autoridad, el catálogo agrupa todos los registros bajo una misma forma.'));
    const inp = el('input.search', { type: 'search', placeholder: 'Buscar encabezamiento o variante…', value: q, 'aria-label': 'Buscar autoridades' });
    const types = ['persona', 'familia', 'entidad', 'evento', 'obra', 'expresion', 'obra-anonima', 'materia', 'lugar', 'genero'];
    const tn = { persona: 'Personas', familia: 'Familias', entidad: 'Entidades', evento: 'Eventos', obra: 'Obras', expresion: 'Expresiones', 'obra-anonima': 'Obras (título)', materia: 'Materias', lugar: 'Lugares', genero: 'Géneros / formas' };
    const sel = el('select', { 'aria-label': 'Tipo de autoridad' }, el('option', { value: '' }, 'Todos los tipos'), types.map(k => el('option', { value: k }, tn[k])));
    main.append(el('div.toolbar', null, inp, sel));
    const box = el('div.list'); main.append(box);
    const draw = () => {
      const nq = M.headNorm(inp.value);
      const rows = Object.values(db.aut).filter(a => (!sel.value || autKind(a) === sel.value) && (!nq || nq.split(' ').every(w => searchText(a).includes(w)))).sort((a, b) => M.title(a).localeCompare(M.title(b), 'es'));
      box.innerHTML = '';
      if (!rows.length) box.append(el('div.empty', null, el('p', null, Object.keys(db.aut).length ? 'Sin resultados.' : 'Aún no hay autoridades. Créalas desde aquí o con el botón «Vincular» de un campo 1XX, 6XX o 7XX.')));
      rows.forEach(a => box.append(listRow(a)));
    };
    inp.addEventListener('input', draw); sel.addEventListener('change', draw); draw();
  }

  /* ============================ NUEVO ============================ */
  const fmtOf = rec => rec.kind === 'aut' ? 'AUT' : D.fmtRegistro(rec);
  const esUTEM = rec => { const t = D.PLANTILLAS.find(x => x.id === rec.tpl); return !!(t && t.planilla); };
  const tplFmt = t => t.fmt || D.tipo008('000000' + t.ldr);
  function vNuevo(main) {
    main.append(el('div.pagehead', null, el('h1', null, 'Nuevo registro bibliográfico'), el('a.btn', { href: '#/catalogo' }, 'Volver al catálogo')));
    main.append(el('p.intro', null, 'Como en Koha, MarcEdit u OCLC, el registro se crea según su formato MARC 21: el formato lo determinan el Líder/06 (tipo de registro) y el Líder/07 (nivel bibliográfico), y define qué significan las posiciones 18-34 del 008. Elige el formato y, si quieres, una precarga con los campos habituales de un recurso concreto.'));
    const nav = el('nav.toc', { 'aria-label': 'Formatos' }, (D.PLANTILLAS.some(t => t.planilla) ? [{ k: 'UTEM', n: 'Planilla UTEM' }] : []).concat(D.FORMATOS).map(f => el('a', { href: '#/nuevo', class: f.k === 'UTEM' ? 'utem' : '', on: { click: e => { e.preventDefault(); document.getElementById('fmt-' + f.k).scrollIntoView({ behavior: 'smooth' }); } } }, f.k + ' · ' + f.n)));
    // Plantillas del trabajo con la planilla UTEM, destacadas
    const utem = D.PLANTILLAS.filter(t => t.planilla);
    if (utem.length) main.append(el('section.fmt.utem', { id: 'fmt-UTEM' },
      el('div.fmthead', null, el('span.fmtcode.mono', null, 'UTEM'), el('div', null, el('h2', null, 'Para el trabajo con la planilla UTEM'),
        el('p.small', null, 'Estas plantillas están hechas especialmente para este trabajo: traen exactamente los campos de la hoja «Campos a completar» y los valores de sus hojas de ejemplo, con la terminología de la planilla. Úsalas para los registros que vas a entregar en la planilla (Mis datos → Planilla de catalogación UTEM).'),
        el('p.small.muted', null, 'También aparecen, marcadas con la etiqueta «Planilla UTEM», dentro de su formato. Las demás plantillas siguen disponibles para practicar otros tipos de material.'))),
      el('div.tplgrid', null, utem.map(t => el('button.tpl.utem', { type: 'button', on: { click: () => startNew('bib', t.id) } },
        icon(t.id === 'utem-foto' ? 'imagen' : 'ebook', 'big'), el('span.tn', null, t.n, el('span.tagx.utem', null, 'Planilla UTEM')), el('span.td', null, t.d),
        el('span.tc', null, 'FMT ' + D.PL.FMT_ETIQUETA[tplFmt(t)] + ' · Líder ' + t.ldrFull.slice(5, 8) + (t.f006 ? ' · 006 ' + t.f006[0] : '') + (t.f007 ? ' · 007 ' + t.f007.slice(0, 2) : '')))))));
    D.FORMATOS.forEach(f => {
      const tpls = D.PLANTILLAS.filter(t => tplFmt(t) === f.k && t.planilla).concat(D.PLANTILLAS.filter(t => tplFmt(t) === f.k && !t.planilla));
      const base = tpls.find(t => !t.planilla);
      main.append(el('section.fmt', { id: 'fmt-' + f.k },
        el('div.fmthead', null, el('span.fmtcode.mono', null, f.k), el('div', null, el('h2', null, f.n), el('p.small.muted', null, f.d), el('p.small.mono', null, f.ldr + ' · 008/18-34: ' + D.F008[f.k].n))),
        el('div.tplgrid', null, tpls.map(t => el('button.tpl', { type: 'button', class: t.planilla ? 'utem' : '', on: { click: () => startNew('bib', t.id) } },
          icon(t.planilla ? (t.id === 'utem-foto' ? 'imagen' : 'ebook') : t.id, 'big'), el('span.tn', null, t.n, t.planilla ? el('span.tagx.utem', null, 'Planilla UTEM') : t === base ? el('span.tagx', null, 'base') : null), el('span.td', null, t.d),
          el('span.tc', null, 'Líder/06-07: ' + t.ldr + (t.f006 ? ' · 006: ' + t.f006[0] : '') + (t.f007 ? ' · 007: ' + t.f007.slice(0, 2) : '')))))));
    });
    main.append(el('h2.sec', null, 'Importar un registro existente'));
    main.append(el('p.small', null, 'También puedes pegar un registro en texto MARC (por ejemplo, copiado de un catálogo o de una guía del curso) desde ', el('a', { href: '#/datos' }, 'Mis datos → Importar'), '.'));
  }
  function vNuevaAut(main) {
    main.append(el('div.pagehead', null, el('h1', null, 'Nueva autoridad'), el('a.btn', { href: '#/autoridades' }, 'Volver a autoridades')));
    main.append(el('p.intro', null, 'Las plantillas de autoridad siguen las entidades de RDA / IFLA LRM trabajadas en las Unidades 1 y 2: obra, expresión, persona, familia y entidad corporativa, además de materias, lugares y géneros.'));
    main.append(el('div.tplgrid', null, D.PLANTILLAS_AUT.map(t => el('button.tpl', { type: 'button', on: { click: () => startNew('aut', t.id) } }, icon(t.id, 'big'), el('span.tn', null, t.n), el('span.td', null, t.d), el('span.tc', null, 'Encabezamiento: ' + (t.fields.find(f => /^1\d\d/.test(f)) || '').slice(0, 6))))));
  }
  function startNew(kind, tplId) {
    S.draft = kind === 'aut' ? D.newAut(tplId, db.perfil) : D.newBib(tplId, db.perfil);
    S.editId = null; S.dirty = false; S.tab = 'all';
    go('#/editar/nuevo');
  }

  /* ============================ EDITOR ============================ */
  const TABS_B = [['all', 'Todos'], ['0', '0 Control y códigos'], ['1', '1 Asiento principal'], ['2', '2 Título, edición, publicación'], ['3', '3 Descripción física y contenido'], ['4', '4 Serie'], ['5', '5 Notas'], ['6', '6 Materias'], ['7', '7 Asientos adicionales y enlaces'], ['8', '8 Series y acceso electrónico'], ['9', '9 Koha · ítem']];
  const TABS_A = [['all', 'Todos'], ['0', '0 Control'], ['1', '1 Encabezamiento'], ['3', '3 Atributos'], ['4', '4 Variantes'], ['5', '5 Relacionados'], ['6', '6 Notas y fuentes']];

  function vEditar(main, r) {
    if (r.id && r.id !== 'nuevo') {
      if (!S.draft || S.editId !== r.id) {
        const src = db.bib[r.id] || db.aut[r.id];
        if (!src) { main.append(el('div.empty', null, 'El registro ' + r.id + ' no existe.')); return; }
        S.draft = M.clone(src); S.editId = r.id; S.dirty = false; S.tab = 'all';
      }
    } else if (!S.draft) { go('#/nuevo'); return; }
    if (S.recovered) { S.recovered = false; toast('Se recuperó el borrador. Recuerda guardar.'); }
    const rec = S.draft;
    const isA = rec.kind === 'aut';
    const head = el('div.edhead');
    const drawHead = () => {
      head.innerHTML = '';
      head.append(icon(recIcon(rec), 'big'),
        el('div.edtitle', null, el('p.kicker', null, (isA ? 'Autoridad · ' + M.materialLabel(rec).n : (esUTEM(rec) ? 'Plantilla planilla UTEM · ' : '') + 'Formato ' + fmtOf(rec) + ' · ' + M.materialLabel(rec).n) + ' · ' + (S.editId || 'nuevo, sin guardar')), el('h1', null, M.title(rec))),
        el('div.row', null,
          btn('Guardar', () => saveDraftRecord(false), 'primary', 'Ctrl + S'),
          btn('Guardar y ver', () => saveDraftRecord(true)),
          btn('Cancelar', () => { if (!S.dirty || confirm('¿Descartar los cambios?')) { S.dirty = false; clearDraft(); const id = S.editId; S.draft = null; go(id ? '#/ver/' + id : (isA ? '#/autoridades' : '#/catalogo')); } })));
    };
    drawHead();
    main.append(head);
    const grid = el('div.edgrid'); main.append(grid);
    const left = el('section.edmain'), side = el('aside.edside', { 'aria-label': 'Panel de revisión' });
    grid.append(left, side);
    const tabs = el('div.tabs', { role: 'tablist' });
    const list = el('div.fields');
    const adder = el('div.adder');
    left.append(tabs, list, adder);

    const onChange = () => { S.dirty = true; saveDraft(); schedule(); };
    let tmr = null;
    const schedule = () => { clearTimeout(tmr); tmr = setTimeout(() => { drawSide(); drawHead(); drawTabs(); }, 260); };
    S._refresh = () => { drawFields(); drawSide(); drawHead(); drawTabs(); };

    function inTab(tag) {
      if (S.tab === 'all') return true;
      if (tag === 'LDR') return S.tab === '0';
      if (isA && S.tab === '6') return /^[6-9]/.test(tag);
      if (isA && S.tab === '0') return /^0/.test(tag) || tag === '2';
      if (isA && S.tab === '3') return /^[23]/.test(tag);
      return tag[0] === S.tab;
    }
    function drawTabs() {
      tabs.innerHTML = '';
      (isA ? TABS_A : TABS_B).forEach(([k, n]) => {
        const cnt = k === 'all' ? rec.fields.length + 1 : (k === '0' ? 1 : 0) + rec.fields.filter(f => { const s = S.tab; S.tab = k; const ok = inTab(f.tag); S.tab = s; return ok; }).length;
        const errs = S.issues.filter(i => i.lvl === 'error' && (k === 'all' || (i.tag === 'LDR' ? k === '0' : (i.tag || '')[0] === k))).length;
        tabs.append(el('button.tab', { type: 'button', role: 'tab', 'aria-selected': S.tab === k ? 'true' : 'false', class: S.tab === k ? 'on' : '', on: { click: () => { S.tab = k; drawTabs(); drawFields(); } } }, n, el('span.cnt', null, cnt), errs ? el('span.dot', { title: errs + ' error(es)' }) : null));
      });
    }
    function drawFields() {
      list.innerHTML = '';
      if (inTab('LDR')) list.append(ctlRow({ tag: 'LDR', get value() { return rec.ldr; }, set value(v) { rec.ldr = v; } }, -1));
      rec.fields.forEach((f, i) => { if (inTab(f.tag)) list.append(M.isCtl(f.tag) ? ctlRow(f, i) : dataRow(f, i)); });
      drawAdder();
    }
    function drawAdder() {
      adder.innerHTML = '';
      const defs = M.defs(rec);
      const inTabTags = Object.keys(defs).filter(t => t !== 'LDR' && inTab(t) && (defs[t].r || !rec.fields.some(f => f.tag === t)));
      const sel = el('select', { 'aria-label': 'Agregar campo de este bloque' }, el('option', { value: '' }, S.tab === 'all' ? '＋ Agregar campo…' : '＋ Agregar campo de este bloque…'), inTabTags.map(t => el('option', { value: t }, t + ' — ' + defs[t].n)));
      sel.addEventListener('change', () => { if (sel.value) addField(sel.value); });
      const inp = el('input.mono', { list: isA ? 'dl-tags-aut' : 'dl-tags-bib', placeholder: 'Etiqueta (p. ej. 246)', maxLength: 3, size: 12, 'aria-label': 'Etiqueta del campo' });
      const go2 = () => { const t = inp.value.trim(); if (/^\d{3}$/.test(t)) addField(t); else toast('Escribe una etiqueta de 3 dígitos.', 'err'); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go2(); } });
      adder.append(sel, el('span.muted', null, 'o'), inp, btn('Agregar', go2, 'sm'));
    }
    function addField(tag, after) {
      const d = M.def(rec, tag);
      let f;
      if (M.isCtl(tag)) f = { tag, value: tag === '008' ? (isA ? D.buildA008({}) : D.build008(D.PLANTILLAS.find(t => t.id === rec.tpl) || D.PLANTILLAS[0])) : tag === '005' ? M.stamp005() : '' };
      else {
        const codes = d && d.s ? Object.keys(d.s).filter(c => c !== '9' && c !== '0') : ['a'];
        const first = codes.includes('a') ? ['a'] : [codes[0]];
        f = { tag, ind1: ' ', ind2: ' ', subs: first.map(c => ({ c, v: '' })) };
        if (d && d.i1 === 'nf') f.ind1 = '0';
        if (d && d.i2 === 'nf') f.ind2 = '0';
        if (tag === '336' || tag === '337' || tag === '338') f.subs.push({ c: 'b', v: '' }, { c: '2', v: d.vocab });
        if (/^6[0-5]\d$/.test(tag) && tag !== '653') { f.ind2 = '7'; f.subs.push({ c: '2', v: tag === '655' ? 'lcgft' : 'lemb' }); }
        if (/^(100|600|700|800|400|500)$/.test(tag)) f.ind1 = '1';
        if (/^(110|610|710|810|111|611|711|410|510)$/.test(tag)) f.ind1 = '2';
        if (tag === '264') f.ind2 = '1';
        if (tag === '856') f.ind1 = '4', f.ind2 = '0';
        if (tag === '700' || tag === '710') f.subs.push({ c: 'e', v: '' });
        if (tag === '952') f.subs = [{ c: 'a', v: db.perfil.biblioteca || '' }, { c: 'b', v: db.perfil.biblioteca || '' }, { c: 'o', v: '' }, { c: 'p', v: '' }, { c: 'y', v: M.sub(M.first(rec, '942'), 'c') || '' }];
      }
      if (after) { rec.fields.splice(rec.fields.indexOf(after) + 1, 0, f); } else { rec.fields.push(f); M.sort(rec); }
      S.focusField = f;
      onChange(); drawFields(); drawTabs();
    }

    /* ---------- fila de campo de control ---------- */
    function ctlRow(f, i) {
      const tag = f.tag, d = M.def(rec, tag) || { n: 'Campo de control' };
      const ro = tag === '001' || tag === '005';
      const len = tag === 'LDR' ? 24 : tag === '008' ? 40 : null;
      const inp = el('input.ctlval.mono', { value: (f.value || '').replace(/ /g, '#'), readOnly: ro, spellcheck: false, 'aria-label': tag + ' ' + d.n, maxLength: len || 60 });
      const dec = el('div.decode');
      const ruler = len ? el('div.ruler.mono', { 'aria-hidden': 'true' }, Array.from({ length: len }, (_, k) => el('span', null, k % 5 === 0 ? String(k).padStart(2, '0') : '·'))) : null;
      const upd = () => { dec.innerHTML = ''; dec.append(decodeCtl(tag, f.value)); };
      inp.addEventListener('input', () => { f.value = inp.value.replace(/#/g, ' '); upd(); onChange(); });
      upd();
      const acts = el('div.fact');
      if (tag === 'LDR') acts.append(btn('Asistente', () => posBuilder('Líder', 24, D.LDR_POS.concat([{ p: 0, l: 5, n: 'Longitud del registro (la calcula el sistema)', fixed: '00000' }, { p: 10, l: 2, n: 'Conteo de indicadores / subcampos', fixed: '22' }, { p: 12, l: 5, n: 'Dirección base de datos (sistema)', fixed: '00000' }, { p: 20, l: 4, n: 'Mapa de entradas', fixed: '4500' }]).sort((a, b) => a.p - b.p), rec.ldr, v => { rec.ldr = v; inp.value = v.replace(/ /g, '#'); upd(); onChange(); drawFields(); }), 'sm'));
      if (tag === '008') acts.append(btn('Asistente', () => {
        const pos = isA ? D.A008_POS : D.F008_COMMON.concat(D.F008[D.tipo008(rec.ldr)].pos).sort((a, b) => a.p - b.p);
        posBuilder('008 · ' + (isA ? 'Autoridades' : D.F008[D.tipo008(rec.ldr)].n), 40, pos, f.value, v => { f.value = v; inp.value = v.replace(/ /g, '#'); upd(); onChange(); });
      }, 'sm'));
      if (tag === '006') acts.append(btn('Asistente', () => {
        const open6 = (val) => {
          const ty = D.tipo006(val[0]);
          const pos = [{ p: 0, l: 1, n: 'Forma del material', key: true, o: D.F006_00, reopen: true }].concat(D.F008[ty].pos.map(x => Object.assign({}, x, { p: x.p - 17 })));
          posBuilder('006 · ' + D.F008[ty].n, 18, pos, val, v => { f.value = v; inp.value = v.replace(/ /g, '#'); upd(); onChange(); }, nv => open6(M.setPos(M.pad('', 18), 0, nv[0], 1)));
        };
        open6(M.pad(f.value || 'm', 18));
      }, 'sm'));
      if (tag === '007') {
        const s7 = el('select', { 'aria-label': 'Valores frecuentes del 007' }, el('option', { value: '' }, 'Valores frecuentes…'), D.F007.map(x => el('option', { value: x.v }, x.v.slice(0, 2) + ' — ' + x.n)));
        s7.addEventListener('change', () => { if (s7.value) { f.value = s7.value; inp.value = s7.value.replace(/ /g, '#'); upd(); onChange(); } s7.value = ''; });
        acts.append(s7);
      }
      acts.append(helpBtn(tag));
      if (tag !== 'LDR' && tag !== '001' && tag !== '005' && tag !== '008') acts.append(btn('✕', () => removeField(f), 'sm ghost danger', 'Eliminar campo'));
      if (tag === '008' && !isA) acts.append(btn('✕', () => removeField(f), 'sm ghost danger', 'Eliminar campo'));
      return el('div.fld.ctl', { 'data-tag': tag }, el('div.fhead', null, el('span.ftag.mono', null, tag), el('span.fname', null, d.n), acts), el('div.ctlbody', null, ruler, inp, dec));
    }

    /* ---------- fila de campo de datos ---------- */
    function dataRow(f, i) {
      const d = M.def(rec, f.tag);
      const row = el('div.fld', { 'data-tag': f.tag, class: d ? '' : 'undef' });
      const indSel = (k, opt) => {
        const cur = f[k];
        if (opt === 'nf' || (opt && typeof opt === 'object')) {
          const o = opt === 'nf' ? Object.fromEntries('0123456789'.split('').map(n => [n, n + (n === '0' ? ' (sin artículo)' : ' caracteres no alfabetizados')])) : opt;
          const s = el('select.ind.mono', { 'aria-label': (k === 'ind1' ? '1.er' : '2.º') + ' indicador', title: (k === 'ind1' ? '1.er' : '2.º') + ' indicador: ' + (o[cur] || 'no válido') }, Object.keys(o).map(x => el('option', { value: x, selected: x === cur, 'data-l': M.ind(x) + ' — ' + o[x] }, M.ind(x))));
          if (!(cur in o)) s.prepend(el('option', { value: cur, selected: true, 'data-l': M.ind(cur) + ' — (no válido)' }, M.ind(cur)));
          const long = () => { for (const op of s.options) op.textContent = op.dataset.l; };
          const short = () => { for (const op of s.options) op.textContent = op.dataset.l.split(' — ')[0]; s.title = (k === 'ind1' ? '1.er' : '2.º') + ' indicador: ' + (o[s.value] || ''); };
          s.addEventListener('mousedown', long); s.addEventListener('focus', long); s.addEventListener('keydown', long);
          s.addEventListener('blur', short);
          s.addEventListener('change', () => { f[k] = s.value; short(); onChange(); });
          return s;
        }
        const s = el('input.ind.mono', { value: M.ind(cur), maxLength: 1, 'aria-label': 'Indicador', size: 1 });
        s.addEventListener('input', () => { f[k] = s.value === '#' || s.value === '' ? ' ' : s.value; onChange(); });
        return s;
      };
      const acts = el('div.fact');
      if (d && d.link) {
        const lk = M.sub(f, '9');
        if (lk) acts.append(el('a.chip', { href: '#/ver/' + lk, title: 'Vinculado a la autoridad ' + lk, target: '_blank' }, '🔗 ', lk));
        acts.append(btn(lk ? 'Revincular' : 'Vincular', () => linkDialog(f), 'sm'));
      }
      if (/^6[0-5]\d$/.test(f.tag) && f.tag !== '653' && D.LC) acts.append(btn('Buscar en LCSH', () => lcshDialog(f), 'sm lcbtn', 'Buscar el encabezamiento en LCSH y registrarlo en español'));
      if (f.tag === '245') acts.append(btn('Calcular indicadores', () => { const a = M.sub(f, 'a'); f.ind2 = String(V.nonFiling(a, M.ctl(rec, '008').slice(35, 38))); f.ind1 = rec.fields.some(x => /^1[01][01]$/.test(x.tag)) ? '1' : '0'; onChange(); drawFields(); toast('Indicadores del 245: ' + f.ind1 + f.ind2); }, 'sm', 'Calcula 1.er indicador (¿hay 1XX?) y 2.º (artículo inicial)'));
      acts.append(helpBtn(f.tag),
        btn('⧉', () => { const c = M.clone(f); c.subs = c.subs.filter(s => s.c !== '9'); rec.fields.splice(rec.fields.indexOf(f) + 1, 0, c); S.focusField = c; onChange(); drawFields(); }, 'sm ghost', 'Repetir campo'),
        btn('✕', () => removeField(f), 'sm ghost danger', 'Eliminar campo'));
      row.append(el('div.fhead', null, el('span.ftag.mono', null, f.tag), indSel('ind1', d && d.i1), indSel('ind2', d && d.i2), el('span.fname', null, d ? d.n : 'Campo no definido', d && d.r ? el('span.rep', { title: 'Repetible' }, ' (R)') : null), acts));
      const sb = el('div.subs');
      f.subs.forEach((s, j) => sb.append(subRow(f, s, j, d)));
      // agregar subcampo
      const avail = d && d.s ? Object.keys(d.s).filter(c => d.s[c].r || !f.subs.some(s => s.c === c)) : [];
      const sel = el('select.addsub', { 'aria-label': 'Agregar subcampo' }, el('option', { value: '' }, '＋ $'), avail.map(c => el('option', { value: c }, '$' + c + ' — ' + d.s[c].n)), el('option', { value: '?' }, 'Otro código…'));
      sel.addEventListener('change', () => {
        let c = sel.value; if (!c) return;
        if (c === '?') { c = (prompt('Código del subcampo (una letra o dígito):') || '').trim().toLowerCase(); if (!/^[a-z0-9]$/.test(c)) { sel.value = ''; return; } }
        f.subs.push({ c, v: '' }); S.focusSub = f.subs[f.subs.length - 1]; onChange(); drawFields();
      });
      sb.append(el('div.srow.addrow', null, sel));
      row.append(sb);
      if (S.focusField === f) { setTimeout(() => { const x = row.querySelector('.sval'); if (x) x.focus(); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30); S.focusField = null; }
      return row;
    }
    function subRow(f, s, j, d) {
      const sd = d && d.s ? d.s[s.c] : null;
      const code = el('input.scode.mono', { value: s.c, maxLength: 1, 'aria-label': 'Código de subcampo', title: 'Código de subcampo' });
      code.addEventListener('input', () => { if (/^[a-z0-9]$/i.test(code.value)) { s.c = code.value.toLowerCase(); lab.textContent = d && d.s && d.s[s.c] ? d.s[s.c].n : '—'; onChange(); } });
      const lab = el('label.slab', null, sd ? sd.n : (s.c === '9' ? 'Vínculo a autoridad local' : '—'));
      const long = /^5\d\d$/.test(f.tag) || (f.tag === '245' && s.c === 'c') || (f.tag === '670' || f.tag === '678');
      const dl = dlFor(f.tag, s.c);
      const val = long ? el('textarea.sval', { rows: 1, 'aria-label': f.tag + ' $' + s.c, spellcheck: true }) : el('input.sval', { value: s.v, 'aria-label': f.tag + ' $' + s.c, list: dl || null, spellcheck: !dl, autocomplete: 'off' });
      if (long) { val.value = s.v; const fit = () => { val.style.height = 'auto'; val.style.height = val.scrollHeight + 'px'; }; val.addEventListener('input', fit); setTimeout(fit, 0); val.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); }); }
      if (s.c === '9') val.readOnly = true;
      val.addEventListener('input', () => { s.v = val.value.replace(/\n/g, ' '); onChange(); });
      if (/^33[678]$/.test(f.tag) && s.c === 'a') val.addEventListener('change', () => vocabFill(f));
      const up = btn('↑', () => { if (j > 0) { f.subs.splice(j - 1, 0, f.subs.splice(j, 1)[0]); onChange(); drawFields(); } }, 'xs ghost', 'Subir subcampo');
      const dn = btn('↓', () => { if (j < f.subs.length - 1) { f.subs.splice(j + 1, 0, f.subs.splice(j, 1)[0]); onChange(); drawFields(); } }, 'xs ghost', 'Bajar subcampo');
      const rm = btn('✕', () => { f.subs.splice(j, 1); onChange(); drawFields(); }, 'xs ghost danger', 'Eliminar subcampo');
      if (S.focusSub === s) { setTimeout(() => val.focus(), 20); S.focusSub = null; }
      return el('div.srow', null, el('span.dollar.mono', null, '$'), code, lab, val, el('span.sact', null, up, dn, rm));
    }
    function vocabFill(f) {
      const voc = { '336': D.RDA_CONTENT, '337': D.RDA_MEDIA, '338': D.RDA_CARRIER }[f.tag];
      const src = { '336': 'rdacontent', '337': 'rdamedia', '338': 'rdacarrier' }[f.tag];
      const term = (M.sub(f, 'a') || '').trim().toLowerCase();
      const hit = voc.find(x => x[0] === term);
      if (!hit) return;
      let b = f.subs.find(s => s.c === 'b'); if (!b) { b = { c: 'b', v: '' }; f.subs.splice(f.subs.findIndex(s => s.c === 'a') + 1, 0, b); }
      b.v = hit[1];
      let s2 = f.subs.find(s => s.c === '2'); if (!s2) f.subs.push({ c: '2', v: src }); else s2.v = src;
      onChange(); drawFields();
    }
    function removeField(f) {
      if (f.subs && f.subs.some(s => s.v.trim()) && !confirm('¿Eliminar el campo ' + f.tag + '?')) return;
      rec.fields.splice(rec.fields.indexOf(f), 1); onChange(); drawFields(); drawTabs();
    }
    function helpBtn(tag) { return btn('?', () => { S.side = 'ayuda'; S.helpTag = tag; drawSide(); if (window.innerWidth < 1100) side.scrollIntoView({ behavior: 'smooth' }); }, 'sm ghost', 'Ayuda del campo ' + tag); }

    /* ---------- vinculación con autoridades ---------- */
    function linkDialog(f) {
      const d = M.def(rec, f.tag); const want = d.link;
      const dlg = modal('Vincular ' + f.tag + ' con una autoridad');
      const q = el('input.search', { type: 'search', placeholder: 'Buscar encabezamiento o variante…', value: M.stripEnd(M.sub(f, 'a')) });
      const res = el('div.list.compact');
      const draw = () => {
        const nq = M.headNorm(q.value);
        const rows = Object.values(db.aut).filter(a => { const h = M.first(a, /^1\d\d$/); return h && h.tag === want && (!nq || nq.split(' ').every(w => searchText(a).includes(w))); });
        res.innerHTML = '';
        if (!rows.length) res.append(el('p.muted', null, 'No hay autoridades ' + want + ' que coincidan.'));
        rows.forEach(a => {
          const h = M.first(a, /^1\d\d$/);
          const vars = a.fields.filter(x => /^4\d\d$/.test(x.tag)).map(x => M.stripEnd(M.heading(x)));
          res.append(el('button.lrow.pick', { type: 'button', on: { click: () => { applyLink(f, a); dlg.close(); toast('Vinculado con ' + a.id + '.'); } } }, icon(autKind(a)), el('div.lmain', null, el('span.ltitle', null, M.stripEnd(M.heading(h))), vars.length ? el('div.lsub', null, 'Variantes: ' + vars.join(' · ')) : null), el('span.mono.muted', null, a.id)));
        });
      };
      q.addEventListener('input', draw); draw();
      const createB = btn('Crear autoridad con los datos de este campo', () => { const a = createAutFrom(f); applyLink(f, a); dlg.close(); toast('Se creó la autoridad ' + a.id + ' y quedó vinculada. Complétala (variantes 4XX, fuentes 670) desde Autoridades.'); }, 'primary');
      const unl = M.sub(f, '9') ? btn('Quitar vínculo', () => { f.subs = f.subs.filter(s => s.c !== '9'); onChange(); drawFields(); dlg.close(); }, 'danger') : null;
      dlg.body.append(el('p.small', null, 'El vínculo copia la forma autorizada en el campo y guarda el número de autoridad en $9 (como Koha). Si después corriges la autoridad, los registros vinculados se actualizan.'), q, res);
      dlg.foot.append(createB, unl);
      dlg.open(); q.focus();
    }
    /* ---------- búsqueda en LCSH (id.loc.gov) con registro en español ---------- */
    function lcshDialog(f) {
      const vocab0 = D.LC.vocabPara(f.tag);
      const dlg = modal('Buscar en LCSH · campo ' + f.tag, 'wide');
      const q = el('input.search', { type: 'search', placeholder: 'Término en inglés (LCSH) o en español', value: M.stripEnd(M.sub(f, 'a')) });
      const modo = el('select', { 'aria-label': 'Idioma de búsqueda' }, el('option', { value: 'en' }, 'Buscar en LCSH (términos en inglés)'), el('option', { value: 'es' }, 'Buscar en español (equivalencias vía Wikidata)'));
      const voc = el('select', { 'aria-label': 'Vocabulario' }, Object.keys(D.LC.VOCAB).map(k => el('option', { value: k, selected: k === vocab0 }, D.LC.VOCAB[k].n)));
      const res = el('div.list.compact'), det = el('div.lcdet');
      const buscar = async () => {
        const t = q.value.trim(); if (!t) return;
        res.innerHTML = ''; det.innerHTML = ''; res.append(el('p.muted', null, 'Buscando…'));
        try {
          const hits = modo.value === 'es' ? await D.LC.buscarEspanol(t) : await D.LC.buscar(t, voc.value);
          if (modo.value === 'en' && hits.length) { try { const es = await D.LC.espanol(hits.map(h => h.token)); hits.forEach(h => { h.es = es[h.token] || ''; }); } catch (e) { } }
          res.innerHTML = '';
          if (!hits.length) res.append(el('p.muted', null, modo.value === 'es' ? 'Sin resultados con identificador LC. Prueba buscando el término en inglés.' : 'Sin resultados. Recuerda que LCSH está en inglés (p. ej. «Fishing», «Photography»).'));
          hits.forEach(h => res.append(el('button.lrow.pick', { type: 'button', on: { click: () => elegir(h) } }, icon('materia'),
            el('div.lmain', null, el('span.ltitle', null, h.label), el('div.lsub', null, h.es ? 'Sugerencia en español: ' + h.es : 'Sin equivalencia en español sugerida')), el('span.mono.muted', null, h.token))));
        } catch (e) {
          res.innerHTML = '';
          res.append(el('div.note', null, 'No se pudo consultar el servicio (' + e.message + '). Revisa tu conexión o ', el('a', { href: D.LC.urlBusqueda(t, voc.value), target: '_blank', rel: 'noopener noreferrer' }, 'abre la búsqueda en id.loc.gov'), ' y escribe la forma en español en el campo.'));
        }
      };
      function elegir(h) {
        let partes = D.LC.partes(h.label);
        const vocab = h.vocab || voc.value;
        if (vocab === 'names' && partes[0]) { const m = partes[0].en.match(/^(.*?,.*?),\s*((?:ca\. )?\d{3,4}\??-(?:\d{3,4}\??)?)$/); if (m) partes = [{ c: 'a', en: m[1] + ',', es: m[1] + ',' }, { c: 'd', en: m[2], es: m[2] }].concat(partes.slice(1)); }
        if (partes[0] && h.es && vocab !== 'names') partes[0].es = h.es;
        if (vocab === 'names') partes.forEach(p => { if (!p.es) p.es = p.en; });
        det.innerHTML = '';
        const filas = partes.map(p => {
          const code = el('select.mono', { 'aria-label': 'Subcampo' }, ['a', 'b', 'c', 'd', 'q', 't', 'x', 'y', 'z', 'v'].map(c => el('option', { value: c, selected: c === p.c }, '$' + c)));
          const inp = el('input', { value: p.es, placeholder: 'en español (LCSH: ' + p.en + ')' });
          return { code, inp, p, row: el('div.lcrow', null, el('span.small.muted', null, p.en), code, inp) };
        });
        const puedeAut = !!(M.def(rec, f.tag) || {}).link;
        const crear = el('input', { type: 'checkbox', checked: false, id: 'lc-aut' });
        det.append(el('h4', null, 'Forma que registrarás en el ' + f.tag),
          el('p.small', null, 'Encabezamiento LCSH: ', el('a', { href: h.uri, target: '_blank', rel: 'noopener noreferrer' }, h.label), ' (' + h.token + '). Escribe cada parte en español: es el descriptor que propones y la Biblioteca Nacional evaluará si corresponde en su sistema. Los indicadores del campo se mantienen como los define la planilla. Las traducciones propuestas son solo sugerencias; puedes compararlas con el ', el('a', { href: 'https://www.bncatalogo.cl/', target: '_blank', rel: 'noopener noreferrer' }, 'catálogo de la BN'), '.'),
          el('div.lcrows', null, filas.map(x => x.row)),
          !puedeAut ? null : el('label.small', { for: 'lc-aut' }, crear, ' Guardar también como autoridad local: forma en español (1XX) enlazada al encabezamiento LCSH (7XX con su URI en $0)'),
          el('div.row', null, btn('Aplicar al campo ' + f.tag, () => {
            const subs = filas.map(x => ({ c: x.code.value, v: x.inp.value.trim() })).filter(s => s.v);
            if (!subs.length) { toast('Escribe al menos la forma en español del encabezamiento.', 'err'); return; }
            // Se mantienen los indicadores del campo (los de la planilla de la BN) y no se agrega $2:
            // la BN evaluará el descriptor propuesto en su sistema.
            const ind = [f.ind1, f.ind2];
            f.subs = subs;
            if (crear.checked) {
              const a = createAutFrom(f);
              const hf = M.first(a, /^1\d\d$/);
              const htag = (hf || { tag: '150' }).tag;
              // el encabezamiento local reproduce toda la cadena (con subdivisiones), igual que el LCSH enlazado
              if (hf) hf.subs = f.subs.filter(s => s.c !== '2' && s.c !== '9').map(s => ({ c: s.c, v: s.v.replace(/[.,]$/, '') }));
              a.fields = a.fields.filter(x => M.isCtl(x.tag) || /^1\d\d$/.test(x.tag) || (x.subs || []).some(s => s.c !== 'w' && s.v.trim() && !/^\[\s*\]/.test(s.v.trim())));
              a.fields = a.fields.filter(x => !(x.tag === '670' && /^\[\s*\]/.test(M.sub(x, 'a'))));
              const enlaz = { tag: '7' + htag.slice(1), ind1: htag === '100' ? '1' : htag === '110' ? '2' : ' ', ind2: '0', subs: partes.map(p => ({ c: p.c, v: p.en.replace(/,$/, '') })).concat([{ c: '0', v: h.uri }]) };
              a.fields.push(enlaz);
              a.fields.push({ tag: '670', ind1: ' ', ind2: ' ', subs: [{ c: 'a', v: 'LCSH (id.loc.gov), consultado el ' + new Date().toLocaleDateString('es-CL') }, { c: 'b', v: h.label }, { c: 'u', v: h.uri }] });
              const f040 = M.first(a, '040'); if (f040) f040.subs = f040.subs.filter(s => s.c !== 'f');
              M.sort(a); stamp(a); db.aut[a.id] = a; persist();
              applyLink(f, a);
              f.subs = f.subs.filter(s => s.c !== '2');
              const last = f.subs.filter(s => s.c !== '9' && s.c !== '2').pop(); if (last) last.v = last.v.replace(/\.$/, '');
              toast('Aplicado en el ' + f.tag + ' y guardado como autoridad ' + a.id + ' (enlazada a LCSH).');
            } else toast('Aplicado en el ' + f.tag + '.');
            f.ind1 = ind[0]; f.ind2 = ind[1];
            onChange(); drawFields(); dlg.close();
          }, 'primary')));
        det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } });
      dlg.body.append(el('p.small', null, 'La Biblioteca Nacional asigna materias según LCSH, registradas en español. Busca aquí el encabezamiento LCSH (en inglés) para confirmar el término y su estructura de subdivisiones; luego registra cada parte en español. Necesita conexión a internet.'),
        el('div.toolbar', null, q, modo, voc, btn('Buscar', buscar, 'primary')), res, det);
      dlg.open(); q.focus();
      if (q.value) buscar();
    }
    function applyLink(f, a) {
      const h = M.first(a, /^1\d\d$/);
      const subj = /^6\d\d$/.test(f.tag);
      const keep = f.subs.filter(s => 'e4ij'.includes(s.c) || (subj && 'vxyz'.includes(s.c) && !h.subs.some(x => x.c === s.c)));
      const heading = h.subs.map(s => ({ c: s.c, v: s.v }));
      let src = M.sub(f, '2');
      const f040 = M.first(a, '040'); if (subj && M.sub(f040, 'f')) src = M.sub(f040, 'f');
      const out = heading.concat(keep);
      // puntuación: coma antes de $e; punto final en 1XX/7XX/6XX
      const ie = out.findIndex(s => s.c === 'e');
      if (ie > 0) { const p = out[ie - 1]; if (!/[,-]$/.test(p.v.trim())) p.v = p.v.trim().replace(/[.]$/, '') + ','; }
      const last = out[out.length - 1];
      if (last && !/[.?!)\-]$/.test(last.v.trim())) last.v = last.v.trim() + '.';
      if (subj && src) out.push({ c: '2', v: src });
      out.push({ c: '9', v: a.id });
      f.subs = out;
      if (/^(100|600|700|800|110|610|710|810|111|611|711)$/.test(f.tag)) f.ind1 = h.ind1;
      if (/^(130|630|730)$/.test(f.tag)) f.ind1 = /^\d$/.test(h.ind2) ? h.ind2 : '0';
      if (f.tag === '830') f.ind2 = /^\d$/.test(h.ind2) ? h.ind2 : '0';
      if (subj && src) f.ind2 = '7';
      onChange(); drawFields();
    }
    function createAutFrom(f) {
      const map = { '100': f.ind1 === '3' ? 'familia' : 'persona', '600': f.ind1 === '3' ? 'familia' : 'persona', '700': f.ind1 === '3' ? 'familia' : 'persona', '800': 'persona', '110': 'entidad', '610': 'entidad', '710': 'entidad', '810': 'entidad', '111': 'evento', '611': 'evento', '711': 'evento', '130': 'obra-anonima', '630': 'obra-anonima', '730': 'obra-anonima', '830': 'obra-anonima', '650': 'materia', '651': 'lugar', '655': 'genero' };
      const tplId = map[f.tag] || 'persona';
      const a = D.newAut(tplId, db.perfil);
      const htag = M.def(rec, f.tag).link;
      const subj = /^6\d\d$/.test(f.tag);
      const hsubs = f.subs.filter(s => !'e4ij29 0'.includes(s.c) && !(subj && 'vxyz'.includes(s.c)) && s.v.trim()).map(s => ({ c: s.c, v: s.v.trim() }));
      if (hsubs.length) hsubs[hsubs.length - 1].v = hsubs[hsubs.length - 1].v.replace(/[.,;:]$/, '');
      const hf = M.first(a, /^1\d\d$/);
      hf.tag = htag; hf.subs = hsubs.length ? hsubs : [{ c: 'a', v: '' }];
      if (/^(100|110|111)$/.test(htag)) hf.ind1 = f.ind1;
      if (htag === '130') { hf.ind1 = ' '; hf.ind2 = /^(130|630|730)$/.test(f.tag) ? f.ind1 : f.ind2; }
      const f670 = M.first(a, '670');
      if (f670 && !isA) { const t = M.stripEnd(M.sub(M.first(rec, '245'), 'a')); f670.subs = [{ c: 'a', v: t + (M.year(rec) ? ', ' + M.year(rec) : '') + ':' }, { c: 'b', v: M.stripEnd(M.sub(M.first(rec, '245'), 'c')) ? 'portada (' + M.stripEnd(M.sub(M.first(rec, '245'), 'c')) + ')' : 'portada' }]; }
      if (subj) { const s2 = M.sub(f, '2'); const f040 = M.first(a, '040'); if (s2 && f040) { const sf = f040.subs.find(s => s.c === 'f'); if (sf) sf.v = s2; else f040.subs.push({ c: 'f', v: s2 }); } }
      a.id = nextId('aut'); stamp(a); db.aut[a.id] = a; persist();
      return a;
    }

    /* ---------- panel lateral ---------- */
    function drawSide() {
      S.issues = V.validate(rec, db);
      side.innerHTML = '';
      const tabsS = isA ? [['calidad', 'Calidad'], ['marc', 'MARC'], ['aut', 'Vista'], ['ayuda', 'Ayuda']] : [['calidad', 'Calidad'], ['marc', 'MARC'], ['isbd', 'ISBD'], ['ficha', 'Ficha'], ['opac', 'OPAC'], ['wemi', 'WEMI'], ['planilla', 'Planilla'], ['ayuda', 'Ayuda']];
      side.append(el('div.stabs', { role: 'tablist' }, tabsS.map(([k, n]) => el('button.stab', { type: 'button', role: 'tab', class: S.side === k ? 'on' : '', 'aria-selected': S.side === k ? 'true' : 'false', on: { click: () => { S.side = k; drawSide(); } } }, n, k === 'calidad' ? qualDot() : null))));
      const body = el('div.sbody'); side.append(body);
      if (S.side === 'calidad') body.append(qualityPanel(rec, S.issues, true));
      else if (S.side === 'ayuda') body.append(fieldHelp(rec, S.helpTag || '245'));
      else body.append(renderView(rec, S.side));
    }
    function qualDot() { const s = V.summary(S.issues); return el('span.cnt', { class: s.error ? 'error' : s.aviso ? 'aviso' : 'ok' }, s.error + s.aviso || '✓'); }
    S._fix = (iss) => { iss.fix(rec); onChange(); drawFields(); drawSide(); drawTabs(); toast('Corrección aplicada: revisa el campo ' + iss.tag + '.'); };
    S._goto = (tag) => { if (S.tab !== 'all') { S.tab = 'all'; drawTabs(); drawFields(); } const t = tag === '1XX' ? /^1\d\d$/ : tag === '6XX' ? /^6\d\d$/ : tag === '7XX' ? /^7\d\d$/ : tag === '4XX' ? /^4\d\d$/ : null; const node = $$('.fld', list).find(n => t ? t.test(n.dataset.tag) : n.dataset.tag === tag); if (node) { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); node.classList.add('flash'); setTimeout(() => node.classList.remove('flash'), 1400); const x = node.querySelector('.sval, .ctlval'); if (x) x.focus({ preventScroll: true }); } else if (/^\d{3}$/.test(tag) && confirm('El campo ' + tag + ' no existe en el registro. ¿Agregarlo?')) addField(tag); };

    function saveDraftRecord(thenView) {
      const isNew = !S.editId;
      if (isNew) rec.id = nextId(rec.kind);
      stamp(rec);
      M.sort(rec);
      const store = isA ? db.aut : db.bib;
      store[rec.id] = M.clone(rec);
      let synced = 0;
      if (isA) synced = syncAut(rec.id);
      persist(); clearDraft();
      S.dirty = false; S.editId = rec.id;
      toast((isNew ? 'Registro creado: ' : 'Registro guardado: ') + rec.id + (synced ? ' · ' + synced + ' registro(s) bibliográfico(s) actualizados con la nueva forma.' : ''));
      if (thenView) { S.draft = null; go('#/ver/' + rec.id); }
      else { history.replaceState(null, '', '#/editar/' + rec.id); S.lastHash = location.hash; drawHead(); drawFields(); drawSide(); }
    }
    document.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && route().name === 'editar') { e.preventDefault(); saveDraftRecord(false); } };

    drawTabs(); drawFields(); drawSide();
  }

  // Sincroniza los campos bibliográficos vinculados ($9) con la forma de la autoridad
  function syncAut(aid) {
    const a = db.aut[aid]; const h = M.first(a, /^1\d\d$/); if (!h) return 0;
    let n = 0;
    Object.values(db.bib).forEach(b => {
      let ch = false;
      b.fields.forEach(f => {
        if (M.sub(f, '9') !== aid) return;
        if (M.headNorm(M.heading(f)) === M.headNorm(M.heading(h))) return;
        const subj = /^6\d\d$/.test(f.tag);
        const keep = f.subs.filter(s => 'e4ij2'.includes(s.c) || (subj && 'vxyz'.includes(s.c) && !h.subs.some(x => x.c === s.c)));
        const out = h.subs.map(s => ({ c: s.c, v: s.v }));
        const rest = keep.filter(s => s.c !== '2');
        const all = out.concat(rest);
        const ie = all.findIndex(s => s.c === 'e');
        if (ie > 0 && !/[,-]$/.test(all[ie - 1].v.trim())) all[ie - 1].v = all[ie - 1].v.trim() + ',';
        const last = all[all.length - 1]; if (last && !/[.?!)\-]$/.test(last.v.trim())) last.v = last.v.trim() + '.';
        keep.filter(s => s.c === '2').forEach(s => all.push(s));
        all.push({ c: '9', v: aid });
        f.subs = all; ch = true;
        if (/^(100|600|700|800|110|610|710|810|111|611|711)$/.test(f.tag)) f.ind1 = h.ind1;
      });
      if (ch) { b.updated = Date.now(); M.setCtl(b, '005', M.stamp005()); n++; }
    });
    return n;
  }

  /* ============================ asistente de posiciones ============================ */
  function posBuilder(title, len, pos, value, onApply, onReopen) {
    let v = M.pad(value || '', len);
    const dlg = modal('Asistente · ' + title, 'wide');
    const prev = el('div.posprev.mono');
    const drawPrev = (hp, hl) => {
      prev.innerHTML = '';
      for (let k = 0; k < len; k++) prev.append(el('span', { class: (hp != null && k >= hp && k < hp + hl ? 'hl ' : '') + (v[k] === ' ' ? 'blank' : ''), title: 'pos. ' + String(k).padStart(2, '0') }, v[k] === ' ' ? '#' : v[k]));
    };
    const form = el('div.posform');
    pos.forEach(p => {
      const id = 'p' + p.p;
      const lab = el('label', { for: id }, el('span.pp.mono', null, String(p.p).padStart(2, '0') + (p.l > 1 ? '–' + String(p.p + p.l - 1).padStart(2, '0') : '')), ' ', p.n, p.key ? el('span.key', { title: 'Posición clave en el curso' }, ' ★') : null);
      let ctl;
      const cur = v.substr(p.p, p.l);
      const focus = () => drawPrev(p.p, p.l);
      if (p.fixed !== undefined) { ctl = el('input.mono', { id, value: cur.replace(/ /g, '#'), disabled: true }); }
      else if (p.auto === 'date') {
        ctl = el('span.row', null, el('input.mono', { id, value: cur, maxLength: 6, size: 8, on: { input: e => { v = M.setPos(v, p.p, e.target.value, 6); drawPrev(p.p, p.l); }, focus } }), btn('Hoy', e => { const t = M.today6(); v = M.setPos(v, p.p, t, 6); e.target.previousSibling.value = t; drawPrev(p.p, p.l); }, 'xs'));
      } else if (p.o) {
        ctl = el('select', { id, on: { change: e => { v = M.setPos(v, p.p, e.target.value, p.l); drawPrev(p.p, p.l); if (p.reopen && onReopen) { dlg.close(); onReopen(v); } }, focus } }, Object.keys(p.o).map(k => el('option', { value: k, selected: k === cur }, (k.trim() ? k : '#'.repeat(k.length || 1)) + ' — ' + p.o[k])));
        if (!(cur in p.o)) ctl.prepend(el('option', { value: cur, selected: true }, cur.replace(/ /g, '#') + ' — (valor actual)'));
      } else if (p.multi) {
        ctl = el('span.multi');
        for (let k = 0; k < p.l; k++) {
          const c = cur[k] || ' ';
          const s = el('select', { 'aria-label': p.n + ' ' + (k + 1), on: { change: e => { v = M.setPos(v, p.p + k, e.target.value, 1); drawPrev(p.p, p.l); }, focus } }, Object.keys(p.multi).map(x => el('option', { value: x, selected: x === c }, (x === ' ' ? '#' : x) + ' — ' + p.multi[x])));
          if (!(c in p.multi)) s.prepend(el('option', { value: c, selected: true }, c + ' — (actual)'));
          ctl.append(s);
        }
      } else {
        const dl = p.list === 'PAISES' ? 'dl-paises' : p.list === 'LENGUAS' ? 'dl-lenguas' : null;
        ctl = el('input.mono', { id, value: cur.replace(/ /g, '#'), maxLength: p.l, size: Math.max(p.l + 2, 6), list: dl, placeholder: p.ph || '', on: { input: e => { v = M.setPos(v, p.p, e.target.value.replace(/#/g, ' '), p.l); drawPrev(p.p, p.l); }, focus } });
        if (p.ph) ctl = el('span.row', null, ctl, el('span.small.muted', null, p.ph));
      }
      form.append(el('div.prow', { class: p.key ? 'keyrow' : '' }, lab, ctl));
    });
    drawPrev();
    dlg.body.append(el('p.small', null, '★ = posiciones que se trabajan en el curso. «#» representa un espacio en blanco.'), prev, form);
    dlg.foot.append(btn('Aplicar', () => { onApply(v); dlg.close(); }, 'primary'), btn('Cancelar', () => dlg.close()));
    dlg.open();
  }

  /* ============================ modal ============================ */
  function modal(title, cls) {
    const d = el('dialog.modal', { class: cls || '' });
    const body = el('div.mbody'), foot = el('div.mfoot');
    d.append(el('div.mhead', null, el('h2', null, title), btn('✕', () => d.close(), 'ghost', 'Cerrar')), body, foot);
    document.body.append(d);
    d.addEventListener('close', () => d.remove());
    return { body, foot, open: () => d.showModal(), close: () => d.close() };
  }

  /* ============================ decodificación de control ============================ */
  function decodeCtl(tag, v) {
    v = v || '';
    const frag = document.createDocumentFragment();
    const item = (pp, val, txt, bad) => frag.append(el('span.dk', { class: bad ? 'bad' : '' }, el('b.mono', null, pp), ' ', el('code', null, (val || '').replace(/ /g, '#') || '∅'), ' ', txt));
    if (tag === 'LDR') {
      if (v.length !== 24) item('long.', String(v.length), 'debe tener 24 posiciones', true);
      D.LDR_POS.filter(p => p.key).forEach(p => item(String(p.p).padStart(2, '0'), v[p.p], p.o[v[p.p]] || 'valor no válido', !p.o[v[p.p]]));
    } else if (tag === '008') {
      const isA = S.draft && S.draft.kind === 'aut';
      if (v.length !== 40) item('long.', String(v.length), 'debe tener 40 posiciones', true);
      if (isA) { D.A008_POS.filter(p => p.key).forEach(p => item(String(p.p).padStart(2, '0'), v.substr(p.p, p.l), p.o[v.substr(p.p, p.l)] || '?', !p.o[v.substr(p.p, p.l)])); return frag; }
      const P = D.PAISES.find(x => x[0] === v.slice(15, 18).trim()), L = D.LENGUAS.find(x => x[0] === v.slice(35, 38));
      const dt = D.F008_COMMON[1].o[v[6]];
      item('06', v[6], dt || 'tipo de fecha no válido', !dt);
      item('07-10', v.slice(7, 11), 'fecha 1');
      if (v.slice(11, 15).trim()) item('11-14', v.slice(11, 15), 'fecha 2');
      item('15-17', v.slice(15, 18), P ? P[1] : 'país no reconocido', !P);
      item('35-37', v.slice(35, 38), L ? L[1] : 'lengua no reconocida', !L);
      const typ = D.tipo008(S.draft ? S.draft.ldr : '');
      frag.append(el('span.dk.muted', null, '18-34: ' + D.F008[typ].n));
    } else if (tag === '006') {
      const c = D.F006_00[v[0]];
      item('00', v[0], c ? c + ' → equivale al 008/18-34 de ' + D.tipo006(v[0]) : 'forma no válida', !c);
      if (v.length !== 18) item('long.', String(v.length), 'debe tener 18 posiciones', true);
    } else if (tag === '007') {
      const c = D.F007_CAT[v[0]]; const pr = D.F007.find(x => x.v.slice(0, 2) === v.slice(0, 2));
      item('00', v[0], c || 'categoría no válida', !c);
      if (pr) item('01', v[1], pr.n.split('(')[0]);
    }
    return frag;
  }

  /* ============================ panel de calidad ============================ */
  function qualityPanel(rec, issues, editable) {
    const box = el('div.quality');
    const s = V.summary(issues);
    box.append(el('div.qsum', null,
      el('span.badge.error', null, s.error + ' errores'), el('span.badge.aviso', null, s.aviso + ' avisos'), el('span.badge.sug', null, s.sug + ' sugerencias')));
    if (rec.kind !== 'aut') {
      const core = V.core(rec);
      box.append(el('div.core', null, el('h4', null, 'Núcleo RDA + MARC'), el('div.corelist', null, core.map(([n, ok]) => el('span.corei', { class: ok ? 'ok' : 'no' }, ok ? '✓ ' : '○ ', n)))));
    }
    if (!issues.length) box.append(el('p.okmsg', null, '✓ No se detectaron problemas. Revisa igualmente la transcripción con la fuente.'));
    const lvls = [['error', 'Errores'], ['aviso', 'Avisos'], ['sug', 'Sugerencias']];
    lvls.forEach(([l, n]) => {
      const items = issues.filter(i => i.lvl === l);
      if (!items.length) return;
      box.append(el('h4', null, n));
      box.append(el('ul.issues', null, items.map(i => el('li.iss', { class: l },
        el('button.itag.mono', { type: 'button', title: editable ? 'Ir al campo' : '', on: { click: () => editable ? S._goto(i.tag) : null } }, i.tag),
        el('span.imsg', null, i.msg, i.ref ? el('span.iref', null, ' · ' + i.ref) : null),
        editable && i.fix ? btn('Corregir', () => S._fix(i), 'xs') : null))));
    });
    box.append(el('p.small.muted', null, 'El control de calidad aplica reglas del curso y de MARC 21/RDA, pero no reemplaza tu revisión: verifica siempre la transcripción contra la fuente de información.'));
    return box;
  }

  /* ============================ ayuda del campo ============================ */
  function fieldHelp(rec, tag) {
    const d = M.def(rec, tag);
    const box = el('div.fhelp');
    if (!d) { box.append(el('p', null, 'Sin ayuda para el campo ' + tag + '.')); return box; }
    box.append(el('h3', null, el('span.mono', null, tag), ' ', d.n), d.r ? el('p.small.muted', null, 'Repetible') : el('p.small.muted', null, 'No repetible'));
    if (d.h) box.append(el('p', null, d.h));
    if (d.ref) box.append(el('p.small', null, el('b', null, 'Referencia: '), d.ref));
    const ind = (k, n) => { const o = d[k]; if (!o) return; box.append(el('h4', null, n)); if (o === 'nf') box.append(el('p.small', null, '0-9: número de caracteres iniciales que no se alfabetizan (artículo + espacio). El = 3 · La = 3 · Los = 4 · The = 4 · L\' = 2.')); else box.append(el('ul.small', null, Object.keys(o).map(x => el('li', null, el('code', null, M.ind(x)), ' ', o[x])))); };
    ind('i1', '1.er indicador'); ind('i2', '2.º indicador');
    if (d.s) { box.append(el('h4', null, 'Subcampos')); box.append(el('ul.small', null, Object.keys(d.s).map(c => el('li', null, el('code', null, '$' + c), ' ', d.s[c].n, d.s[c].r ? el('span.muted', null, ' (R)') : null)))); }
    if (tag === '336' || tag === '337' || tag === '338') {
      const voc = tag === '336' ? D.RDA_CONTENT : tag === '337' ? D.RDA_MEDIA : D.RDA_CARRIER;
      box.append(el('h4', null, 'Vocabulario RDA'), el('table.mini', null, el('tbody', null, voc.map(x => el('tr', null, el('td', null, x[0]), el('td.mono', null, x[1]), tag === '338' ? el('td.muted', null, (D.RDA_MEDIA.find(m => m[1] === x[2]) || [''])[0]) : null)))));
    }
    if (tag === '008' || tag === 'LDR') box.append(el('p.small', null, 'Usa el botón «Asistente» del campo para codificar posición por posición.'));
    const others = el('select', { 'aria-label': 'Ver ayuda de otro campo' }, el('option', { value: '' }, 'Ver ayuda de otro campo…'), Object.keys(M.defs(rec)).map(t => el('option', { value: t }, t + ' — ' + M.defs(rec)[t].n)));
    others.addEventListener('change', () => { if (others.value) { S.helpTag = others.value; const p = box.parentNode; p.innerHTML = ''; p.append(fieldHelp(rec, others.value)); } });
    box.append(others);
    return box;
  }

  /* ============================ vistas del registro ============================ */
  function renderView(rec, kind) {
    if (kind === 'marc') return viewMarc(rec);
    if (kind === 'isbd') return viewIsbd(rec);
    if (kind === 'ficha') return viewFicha(rec);
    if (kind === 'wemi') return viewWemi(rec);
    if (kind === 'xml') return el('pre.code', null, M.toXml([rec]));
    if (kind === 'mrk') return el('pre.code', null, M.toMrk(rec));
    if (kind === 'aut') return viewAut(rec);
    if (kind === 'planilla') return viewPlanilla(rec);
    return viewOpac(rec);
  }
  function viewMarc(rec) {
    const t = el('table.marc');
    const tb = el('tbody'); t.append(tb);
    tb.append(el('tr', null, el('td.mt.mono', null, 'LDR'), el('td.mi.mono'), el('td.mv.mono', null, (rec.ldr || '').replace(/ /g, '#'))));
    rec.fields.forEach(f => {
      if (M.isCtl(f.tag)) tb.append(el('tr', null, el('td.mt.mono', null, f.tag), el('td.mi.mono'), el('td.mv.mono', null, (f.value || '').replace(/ /g, '#'))));
      else tb.append(el('tr', null, el('td.mt.mono', null, f.tag), el('td.mi.mono', null, M.ind(f.ind1) + M.ind(f.ind2)), el('td.mv', null, (f.subs || []).map(s => [el('span.sc.mono', null, '$' + s.c), ' ', s.v, ' ']))));
    });
    return el('div.view', null, t);
  }
  function viewIsbd(rec) {
    const i = M.isbd(rec);
    return el('div.view.isbd', null,
      el('p.small.muted', null, 'Descripción ISBD generada a partir de los campos del registro (áreas separadas por « . — »). La puntuación interna es la que registraste en cada subcampo.'),
      el('p', null, i.p1), i.p2 ? el('p', null, i.p2) : null, i.notes.map(n => el('p', null, n)), i.ids.map(n => el('p', null, n)));
  }
  function viewFicha(rec) {
    const f = M.ficha(rec);
    return el('div.view', null, el('div.ficha', null,
      el('div.fcall.mono', null, f.call.split(' ').map(x => el('div', null, x))),
      el('div.fbody', null,
        f.head ? el('p.fhead', null, f.head) : null,
        el('div.find', null,
          f.uniform ? el('p', null, f.uniform) : null,
          el('p', null, f.isbd.p1), f.isbd.p2 ? el('p', null, f.isbd.p2) : null,
          f.isbd.notes.map(n => el('p', null, n)), f.isbd.ids.map(n => el('p', null, n)),
          f.tracings ? el('p.ftrac', null, f.tracings) : null))),
      el('p.small.muted', null, 'Ficha catalográfica tradicional (7,5 × 12,5 cm): encabezamiento principal, descripción con sangría y pistas (materias en arábigos, asientos secundarios en romanos).'));
  }
  function viewOpac(rec) {
    const L = (t, v) => v && (Array.isArray(v) ? v.length : true) ? el('div.orow', null, el('dt', null, t), el('dd', null, v)) : null;
    const hl = (f, opts) => { const t = M.stripEnd(M.heading(f, opts)); const lk = M.sub(f, '9'); return el('a', { href: '#/catalogo?q=' + encodeURIComponent(M.stripEnd(M.heading(f))) }, t, lk ? el('span.lk', { title: 'Vinculado a autoridad ' + lk }, ' 🔗') : null); };
    const join = arr => arr.flatMap((x, i) => i ? [el('br'), x] : [x]);
    const main = M.first(rec, /^1[01]\d$/);
    const f245 = M.first(rec, '245');
    const langs = (() => { const c = M.ctl(rec, '008').slice(35, 38); const f = M.first(rec, '041'); const n = x => (D.LENGUAS.find(l => l[0] === x) || [x, x])[1]; let s = n(c); if (f && M.subs(f, 'h').length) s += ' (traducido de: ' + M.subs(f, 'h').map(n).join(', ') + ')'; return c.trim() ? s : ''; })();
    const notes = rec.fields.filter(f => /^5\d\d$/.test(f.tag)).map(f => el('p', null, M.noteText(f)));
    const links = M.fields(rec, '856').map(f => { const u = M.sub(f, 'u'); return /^https?:\/\//i.test(u) ? el('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, M.sub(f, 'y') || u) : u; });
    const items = M.fields(rec, '952');
    const dl = el('dl.opac', null,
      L('Título', f245 ? M.stripEnd(M.joinSubs(f245, ['a', 'n', 'p', 'b', 'c'])) : ''),
      L('Autor', main ? hl(main, { keepRel: true }) : ''),
      L('Título uniforme', (M.first(rec, '240') || M.first(rec, '130')) ? M.stripEnd(M.heading(M.first(rec, '240') || M.first(rec, '130'))) : ''),
      L('Otros títulos', M.fields(rec, '246').map(f => (M.sub(f, 'i') ? M.sub(f, 'i') + ' ' : '') + M.stripEnd(M.joinSubs(f, ['a', 'b', 'n', 'p'])))),
      L('Otros autores', join(rec.fields.filter(f => /^7[01]\d$/.test(f.tag)).map(f => hl(f, { keepRel: true })))),
      L('Edición', M.fields(rec, '250').map(f => M.stripEnd(M.joinSubs(f))).join(' ; ')),
      L('Datos cartográficos', M.fields(rec, '255').map(f => M.stripEnd(M.joinSubs(f))).join(' ; ')),
      L('Publicación', join(M.fields(rec, '264').map(f => ({ '0': 'Producción: ', '1': '', '2': 'Distribución: ', '3': 'Fabricación: ', '4': 'Copyright: ' }[f.ind2] || '') + M.stripEnd(M.joinSubs(f, ['a', 'b', 'c']))))),
      L('Descripción', M.fields(rec, '300').map(f => M.stripEnd(M.joinSubs(f))).join(' ; ')),
      L('Contenido · medio · soporte', [M.fields(rec, '336').map(f => M.sub(f, 'a')).join(', '), M.fields(rec, '337').map(f => M.sub(f, 'a')).join(', '), M.fields(rec, '338').map(f => M.sub(f, 'a')).join(', ')].filter(Boolean).join(' · ')),
      L('Lengua', langs),
      L('Serie', join(M.fields(rec, '830').length ? M.fields(rec, '830').map(f => hl(f)) : M.fields(rec, '490').map(f => M.stripEnd(M.joinSubs(f))))),
      L('Notas', notes),
      L('Materias', join(rec.fields.filter(f => /^6[0-5]\d$/.test(f.tag) && f.tag !== '655').map(f => hl(f, { dashes: true })))),
      L('Género / forma', join(M.fields(rec, '655').map(f => hl(f)))),
      L('Relaciones', join(rec.fields.filter(f => /^7[6-8]\d$/.test(f.tag)).map(f => M.stripEnd(M.joinSubs(f, ['i', 'a', 't', 'b', 'd', 'g', 'z']))))),
      L('ISBN', M.fields(rec, '020').map(f => M.joinSubs(f, ['a', 'q'])).join(' · ')),
      L('ISSN', M.fields(rec, '022').map(f => M.sub(f, 'a')).join(' · ')),
      L('Otros identificadores', M.fields(rec, '024').concat(M.fields(rec, '028')).map(f => M.joinSubs(f, ['a', 'b'])).join(' · ')),
      L('Clasificación', [M.joinSubs(M.first(rec, '082'), ['a', 'b']), M.joinSubs(M.first(rec, '080'), ['a'])].filter(Boolean).join(' · ')),
      L('Acceso en línea', join(links)));
    const out = el('div.view', null, el('div.opachead', null, icon(recIcon(rec), 'big'), el('span.badge.mat', null, M.materialLabel(rec).n)), dl);
    if (items.length) out.append(el('h4', null, 'Ejemplares'), el('table.mini', null, el('thead', null, el('tr', null, ['Biblioteca', 'Ubicación', 'Signatura', 'Código de barras', 'Tipo'].map(x => el('th', null, x)))), el('tbody', null, items.map(f => el('tr', null, el('td', null, M.sub(f, 'a')), el('td', null, M.sub(f, 'c')), el('td.mono', null, M.sub(f, 'o')), el('td.mono', null, M.sub(f, 'p')), el('td', null, M.sub(f, 'y') || M.sub(M.first(rec, '942'), 'c')))))));
    return out;
  }
  function viewWemi(rec) {
    const w = M.wemi(rec);
    const block = (title, cls, rows, help) => el('div.wemi', { class: cls }, el('h4', null, title), el('p.small.muted', null, help), el('dl', null, rows.filter(r => r[1]).map(r => [el('dt', null, r[0]), el('dd', null, r[1])])), !rows.some(r => r[1]) ? el('p.small', null, '—') : null);
    return el('div.view', null,
      el('p.small', null, 'Lectura del registro según el modelo IFLA LRM: cada nivel responde una pregunta distinta sobre el mismo recurso.'),
      block('Obra', 'w1', w.obra, 'La creación intelectual o artística, independiente de la lengua y el formato.'),
      block('Expresión', 'w2', w.expresion, 'La realización concreta de la obra: el texto en una lengua, una traducción, una versión.'),
      block('Manifestación', 'w3', w.manifestacion, 'La edición o publicación concreta: editor, fecha, soporte.'),
      el('div.wemi.w4', null, el('h4', null, 'Ítem'), el('p.small.muted', null, 'El ejemplar específico que posee la biblioteca.'),
        w.items.length ? el('ul.small', null, w.items.map(i => el('li', null, [i.bib, i.ub, i.sig ? 'signatura ' + i.sig : '', i.cb ? 'código ' + i.cb : '', i.tipo].filter(Boolean).join(' · ')))) : el('p.small', null, 'Sin ítems: agrega un campo 952.')),
      w.relaciones.length ? el('div.wemi.w5', null, el('h4', null, 'Relaciones'), el('ul.small', null, w.relaciones.map(r => el('li', null, el('code', null, r[0]), ' ', r[1])))) : null);
  }
  function viewAut(rec) {
    const h = M.first(rec, /^1\d\d$/);
    const L = (t, v) => v && (!Array.isArray(v) || v.length) ? el('div.orow', null, el('dt', null, t), el('dd', null, v)) : null;
    const join = arr => arr.flatMap((x, i) => i ? [el('br'), x] : [x]);
    const attrs = rec.fields.filter(f => /^3\d\d$/.test(f.tag) || f.tag === '046' || f.tag === '024').map(f => el('div', null, el('span.muted', null, (M.def(rec, f.tag) || { n: f.tag }).n + ': '), M.stripEnd(M.joinSubs(f.tag === '046' ? Object.assign({}, f, { subs: f.subs.filter(s => s.c !== '2') }) : f, null))));
    const uses = usesOf(rec.id);
    return el('div.view', null,
      el('div.opachead', null, icon(autKind(rec), 'big'), el('span.badge.mat', null, M.materialLabel(rec).n)),
      el('dl.opac', null,
        L('Forma autorizada', h ? el('strong', null, M.stripEnd(M.heading(h))) : ''),
        L('Véase desde (variantes 4XX)', join(rec.fields.filter(f => /^4\d\d$/.test(f.tag)).map(f => (M.sub(f, 'i') ? M.sub(f, 'i') + ' ' : '') + M.stripEnd(M.heading(f))))),
        L('Véase además (5XX)', join(rec.fields.filter(f => /^5\d\d$/.test(f.tag)).map(f => { const w = M.sub(f, 'w'); return ({ g: 'Término general: ', h: 'Término específico: ', a: 'Nombre anterior: ', b: 'Nombre posterior: ' }[w] || (M.sub(f, 'i') ? M.sub(f, 'i') + ' ' : '')) + M.stripEnd(M.heading(f)); }))),
        L('Atributos', attrs),
        L('Datos biográficos / históricos', M.fields(rec, '678').map(f => M.joinSubs(f)).join(' ')),
        L('Nota de alcance', M.fields(rec, '680').map(f => M.joinSubs(f)).join(' ')),
        L('Fuentes consultadas (670)', join(M.fields(rec, '670').map(f => M.joinSubs(f, ['a', 'b', 'u'])))),
        L('Usado en', join(uses.map(b => el('a', { href: '#/ver/' + b.id }, b.id + ' · ' + M.title(b)))))),
      !uses.length ? el('p.small.muted', null, 'Esta autoridad aún no está vinculada a ningún registro bibliográfico.') : null);
  }

  /* ============================ VER ============================ */
  function vVer(main, r) {
    const rec = db.bib[r.id] || db.aut[r.id];
    if (!rec) { main.append(el('div.empty', null, el('p', null, 'El registro ' + r.id + ' no existe.'), el('a.btn', { href: '#/catalogo' }, 'Volver al catálogo'))); return; }
    const isA = rec.kind === 'aut';
    const views = isA ? [['aut', 'Vista'], ['marc', 'MARC'], ['mrk', '.mrk'], ['xml', 'MARCXML']] : [['opac', 'OPAC'], ['marc', 'MARC'], ['isbd', 'ISBD'], ['ficha', 'Ficha'], ['wemi', 'WEMI'], ['planilla', 'Planilla UTEM'], ['mrk', '.mrk'], ['xml', 'MARCXML']];
    if (!views.some(v => v[0] === S.view)) S.view = views[0][0];
    main.append(el('div.edhead', null, icon(recIcon(rec), 'big'),
      el('div.edtitle', null, el('p.kicker', null, (isA ? 'Autoridad' : 'Registro bibliográfico') + ' · ' + rec.id + ' · modificado ' + fmtDate(rec.updated)), el('h1', null, M.title(rec)), !isA && M.mainAuthor(rec) ? el('p.subt', null, M.mainAuthor(rec)) : null),
      el('div.row', null,
        el('a.btn.primary', { href: '#/editar/' + rec.id }, 'Editar'),
        btn('Duplicar', () => { const c = M.clone(rec); delete c.id; delete c.created; delete c.ejemplo; delete c.ejercicio; c.fields = c.fields.filter(f => !(esUTEM(rec) ? /^952$/ : /^(001|005|952)$/).test(f.tag)); S.draft = c; S.editId = null; S.dirty = true; go('#/editar/nuevo'); toast('Copia creada: úsala, por ejemplo, para otra manifestación de la misma obra. Recuerda guardar.'); }, '', 'Crear un registro nuevo a partir de este'),
        !isA ? btn('Copiar fila para la planilla', async () => {
          try { const { tsv, obs } = await D.PL.filaTSV(rec); await navigator.clipboard.writeText(tsv); toast('Fila copiada: pégala en la columna A de la hoja «Campos a completar».' + (obs.length ? ' Revisa las ' + obs.length + ' observaciones en la pestaña «Planilla UTEM».' : '')); }
          catch (e) { toast('No se pudo copiar: ' + e.message, 'err'); }
        }, '', 'Copia la fila del registro separada por tabuladores') : null,
        btn('Imprimir / PDF', () => printRecords([rec], S.view)),
        btn('Descargar', () => downloadMenu(rec)),
        btn('Eliminar', () => {
          const u = isA ? usesOf(rec.id).length : 0;
          if (!confirm('¿Eliminar definitivamente ' + rec.id + '?' + (u ? '\nEstá vinculada a ' + u + ' registro(s): los vínculos quedarán rotos.' : ''))) return;
          delete (isA ? db.aut : db.bib)[rec.id]; persist(); toast('Registro eliminado.'); go(isA ? '#/autoridades' : '#/catalogo');
        }, 'danger'))));
    const grid = el('div.edgrid.ver'); main.append(grid);
    const left = el('section.edmain'); const side = el('aside.edside');
    grid.append(left, side);
    const vt = el('div.tabs');
    const vb = el('div.vbox');
    const drawV = () => { vt.innerHTML = ''; views.forEach(([k, n]) => vt.append(el('button.tab', { type: 'button', class: S.view === k ? 'on' : '', on: { click: () => { S.view = k; drawV(); } } }, n))); vb.innerHTML = ''; vb.append(renderView(rec, S.view)); };
    drawV();
    left.append(vt, vb);
    side.append(el('div.stabs', null, el('span.stab.on', null, 'Control de calidad')), el('div.sbody', null, qualityPanel(rec, V.validate(rec, db), false), el('a.btn.sm', { href: '#/editar/' + rec.id }, 'Corregir en el editor →')));
  }
  function downloadMenu(rec) {
    const dlg = modal('Descargar ' + rec.id);
    const n = rec.id + '_' + slug(M.title(rec)).slice(0, 40);
    dlg.body.append(el('div.dlgrid', null,
      btn('MARCXML (.xml)', () => download(n + '.xml', M.toXml([rec]), 'application/xml')),
      btn('MarcEdit (.mrk)', () => download(n + '.mrk', M.toMrk(rec))),
      btn('ISO 2709 (.mrc)', () => download(n + '.mrc', M.toIso(rec), 'application/marc')),
      btn('JSON', () => download(n + '.json', JSON.stringify(cleanRec(rec), null, 2), 'application/json'))),
      el('p.small.muted', null, 'MARCXML e ISO 2709 se pueden importar en Koha (Herramientas → Importar registros MARC) y en MarcEdit.'));
    dlg.open();
  }
  const cleanRec = r => M.clone(r);

  /* ============================ ÍNDICES ============================ */
  function vIndices(main) {
    main.append(el('div.pagehead', null, el('h1', null, 'Índices de puntos de acceso')));
    main.append(el('p.intro', null, 'Así agrupa el catálogo los registros por cada punto de acceso. Si una misma persona o materia aparece escrita de formas distintas, el catálogo la separa en entradas diferentes: por eso se normaliza con autoridades. Las filas marcadas «sin autoridad» aún no están vinculadas.'));
    const groups = [['Nombres (1XX / 7XX / 8XX)', /^(100|110|111|700|710|711|800|810)$/], ['Títulos preferidos y series (130 / 240 / 730 / 830)', /^(130|240|730|830)$/], ['Materias (600-651)', /^(600|610|611|630|648|650|651)$/], ['Géneros / formas (655)', /^655$/]];
    const tabs = el('div.tabs'); const box = el('div'); let cur = 0;
    const draw = () => {
      tabs.innerHTML = ''; groups.forEach((g, i) => tabs.append(el('button.tab', { type: 'button', class: i === cur ? 'on' : '', on: { click: () => { cur = i; draw(); } } }, g[0])));
      const map = {};
      Object.values(db.bib).forEach(b => b.fields.forEach(f => {
        if (!groups[cur][1].test(f.tag)) return;
        const raw = M.stripEnd(M.heading(f, { dashes: /^6/.test(f.tag) }));
        if (!raw) return;
        const k = M.headNorm(raw);
        const e = map[k] || (map[k] = { raw, n: new Set(), links: new Set(), tags: new Set() });
        e.n.add(b.id); e.tags.add(f.tag);
        const lk = M.sub(f, '9'); if (lk) e.links.add(lk);
      }));
      const rows = Object.values(map).sort((a, b) => a.raw.localeCompare(b.raw, 'es'));
      // detectar posibles duplicados (mismo apellido / primera palabra, distinta forma)
      const firstW = s => M.headNorm(s).split(/[ ,]/)[0];
      box.innerHTML = '';
      if (!rows.length) { box.append(el('div.empty', null, el('p', null, 'No hay puntos de acceso de este tipo en el catálogo.'))); return; }
      box.append(el('table.idx', null, el('thead', null, el('tr', null, ['Punto de acceso', 'Registros', 'Campos', 'Autoridad'].map(x => el('th', null, x)))),
        el('tbody', null, rows.map(e => {
          const sim = rows.filter(o => o !== e && firstW(o.raw) === firstW(e.raw) && firstW(e.raw).length > 3).length;
          return el('tr', null,
            el('td', null, el('a', { href: '#/catalogo?q=' + encodeURIComponent(e.raw) }, e.raw), sim ? el('span.badge.aviso', { title: 'Hay ' + sim + ' entrada(s) que empiezan igual: ¿es la misma entidad escrita de otra forma?' }, '¿variante?') : null),
            el('td.count', null, e.n.size), el('td.mono', null, [...e.tags].join(' ')),
            el('td', null, e.links.size ? [...e.links].map(l => el('a.chip', { href: '#/ver/' + l }, '🔗 ' + l)) : el('span.badge.sug', null, 'sin autoridad')));
        }))));
    };
    main.append(tabs, box); draw();
  }

  /* ============================ MIS DATOS ============================ */
  function vDatos(main) {
    main.append(el('div.pagehead', null, el('h1', null, 'Mis datos: perfil, entrega e importación')));
    // perfil
    const p = db.perfil;
    const fi = (k, l, ph, help) => { const i = el('input', { value: p[k] || '', placeholder: ph, id: 'pf-' + k }); i.addEventListener('change', () => { p[k] = i.value.trim(); persist(); toast('Perfil actualizado.'); }); return el('div.frow', null, el('label', { for: 'pf-' + k }, l), i, help ? el('span.small.muted', null, help) : null); };
    main.append(el('section.card', null, el('h2', null, 'Perfil del catalogador/a'),
      el('p.small', null, 'Estos datos aparecen en los archivos de entrega y en el informe impreso.'),
      el('div.formgrid', null, fi('nombre', 'Nombre y apellido', 'Ej.: Camila Rojas'), fi('seccion', 'Sección / grupo', 'Ej.: Sección 1 · Grupo 3'), fi('agencia', 'Código de agencia (040 $a / 003)', 'clsabn', 'Se usa en los registros nuevos. Para la planilla UTEM: clsabn (040 $a clsabn $b spa $c clsabn $e rda).'), fi('biblioteca', 'Biblioteca (952 $a)', 'BIBDD2', 'Código de la biblioteca propietaria de los ítems.'))));
    // exportar
    const nb = Object.keys(db.bib).length, na = Object.keys(db.aut).length;
    const base = 'catalogo_' + slug(p.nombre) + '_' + fecha();
    const allRecs = () => Object.values(db.aut).concat(Object.values(db.bib));
    main.append(el('section.card', null, el('h2', null, 'Exportar y entregar'),
      el('p.small', null, 'Tu trabajo se guarda solo en este navegador y en este computador. Exporta un respaldo cada vez que termines una sesión, sobre todo si usas un computador del laboratorio.'),
      el('div.dlgrid', null,
        btn('Respaldo completo (.json)', () => download(base + '.json', JSON.stringify({ app: 'Taller de Catalogación DD2', version: 1, exportado: new Date().toISOString(), perfil: p, bib: Object.values(db.bib).map(cleanRec), aut: Object.values(db.aut).map(cleanRec) }, null, 2), 'application/json'), 'primary'),
        btn('Informe de entrega (imprimir / PDF)', () => printRecords(Object.values(db.bib).concat(Object.values(db.aut)), 'entrega')),
        btn('MARCXML bibliográficos (.xml)', () => download(base + '_bib.xml', M.toXml(Object.values(db.bib)), 'application/xml')),
        btn('MARCXML autoridades (.xml)', () => download(base + '_aut.xml', M.toXml(Object.values(db.aut)), 'application/xml')),
        btn('MarcEdit, todo (.mrk)', () => download(base + '.mrk', allRecs().map(M.toMrk).join('\n\n') + '\n')),
        btn('ISO 2709 bibliográficos (.mrc)', () => download(base + '_bib.mrc', Object.values(db.bib).map(M.toIso).join(''), 'application/marc'))),
      el('p.small.muted', null, nb + ' registros bibliográficos y ' + na + ' autoridades. El respaldo .json es el que permite volver a cargar tu trabajo aquí; los otros formatos sirven para Koha, MarcEdit u otros sistemas.')));
    // planilla UTEM
    const incEj = el('input', { type: 'checkbox', id: 'pl-ej' });
    const origen = el('span.small.muted', null, D.PL.tienePropia() ? 'Planilla base: ' + D.PL.tienePropia() + ' (subida en este navegador)' : 'Planilla base: planilla_catalogacion_UTEM.xlsx (la que entregó la biblioteca)');
    const propia = el('input', { type: 'file', accept: '.xlsx', id: 'pl-propia' });
    propia.addEventListener('change', async () => { const f = propia.files[0]; if (!f) return; try { await D.PL.guardarPropia(f); toast('Se usará «' + f.name + '» como planilla base.'); render(); } catch (e) { toast('No se pudo usar esa planilla: ' + e.message, 'err'); } propia.value = ''; });
    main.append(el('section.card', null, el('h2', null, 'Planilla de catalogación UTEM'),
      el('p.small', null, 'Genera la planilla de la biblioteca con tus registros ya traspasados: una fila por registro en la hoja «Campos a completar», respetando sus columnas, sus convenciones (^ para espacios en Líder, 006, 007 y 008; # para indicadores en blanco) y sus hojas de ejemplo. Al descargar verás qué datos no tienen columna en la planilla.'),
      el('div.row', null, btn('Descargar planilla con mis registros (.xlsx)', () => exportarPlanilla(incEj.checked), 'primary'), el('label.small', { for: 'pl-ej' }, incEj, ' Incluir los registros de ejemplo y de ejercicio')),
      el('div.frow', null, origen, el('div.row', null, el('label.small', { for: 'pl-propia' }, 'Usar otra versión de la planilla: '), propia, D.PL.tienePropia() ? btn('Volver a la planilla original', () => { D.PL.quitarPropia(); toast('Se usará la planilla original.'); render(); }, 'sm') : null)),
      el('p.small.muted', null, 'Las columnas se leen de los encabezados de la propia planilla (filas 1 y 2), así que una versión actualizada funciona sin cambiar la herramienta mientras mantenga esa estructura.')));
    // importar
    const fileI = el('input', { type: 'file', accept: '.json,.xml,.mrk,.txt,.mrc,.marc', id: 'imp-file' });
    const modeSel = el('select', { 'aria-label': 'Modo de importación' }, el('option', { value: 'add' }, 'Agregar a mi catálogo'), el('option', { value: 'replace' }, 'Reemplazar todo mi catálogo (solo .json)'));
    fileI.addEventListener('change', () => { const f = fileI.files[0]; if (f) importFile(f, modeSel.value); fileI.value = ''; });
    const ta = el('textarea.code', { rows: 10, placeholder: 'Pega aquí uno o más registros (separados por una línea en blanco). Se aceptan formatos como:\n\nLDR 00000nam a2200000 i 4500\n245 10 $a Sapiens : $b de animales a dioses / $c Yuval Noah Harari.\n264 #1 $a Barcelona : $b Debate, $c 2015.\n\no el formato .mrk de MarcEdit (=245  10$aTítulo…), o con | o ‡ como delimitador.', spellcheck: false, 'aria-label': 'Registro en texto MARC' });
    const kindSel = el('select', { 'aria-label': 'Tipo de registro' }, el('option', { value: 'auto' }, 'Detectar (Líder/06 = z → autoridad)'), el('option', { value: 'bib' }, 'Bibliográfico'), el('option', { value: 'aut' }, 'Autoridad'));
    main.append(el('section.card', null, el('h2', null, 'Importar'),
      el('div.frow', null, el('label', { for: 'imp-file' }, 'Desde archivo (.json, MARCXML, .mrk, .mrc)'), el('div.row', null, fileI, modeSel)),
      el('div.frow', null, el('label', null, 'Desde texto MARC'), ta, el('div.row', null, kindSel, btn('Importar texto', () => {
        try {
          const recs = M.parseText(ta.value);
          if (!recs.length) { toast('No se encontraron registros en el texto.', 'err'); return; }
          recs.forEach(r => { r.kind = kindSel.value === 'auto' ? ((r.ldr || '')[6] === 'z' ? 'aut' : 'bib') : kindSel.value; if (!r.ldr) r.ldr = r.kind === 'aut' ? '00000nz  a2200000n  4500' : '00000nam a2200000 i 4500'; });
          const n = addRecords(recs); ta.value = ''; toast('Se importaron ' + n + ' registro(s).'); if (n === 1) go('#/editar/' + recs[0].id); else render();
        } catch (e) { toast('No se pudo leer el texto: ' + e.message, 'err'); }
      }, 'primary'))),
      el('p.small.muted', null, 'Al importar se asignan números de registro nuevos; los vínculos $9 entre registros del mismo archivo se conservan.')));
    // otros
    main.append(el('section.card', null, el('h2', null, 'Ejemplos y limpieza'),
      el('div.row', null,
        btn('Cargar ejemplos del curso', () => { loadExamples(); render(); }),
        btn('Borrar todo mi catálogo', () => { if (confirm('Esto borra TODOS tus registros de este navegador. ¿Exportaste un respaldo?') && confirm('¿Seguro? Esta acción no se puede deshacer.')) { const pf = db.perfil; db = fresh(); db.perfil = pf; persist(); clearDraft(); toast('Catálogo vaciado.'); render(); } }, 'danger')),
      el('p.small.muted', null, 'Los ejemplos incluyen una traducción (1984), un libro chileno, un documental en DVD (ficticio), un registro con errores para corregir y cinco autoridades.')));
  }
  async function exportarPlanilla(incluirEj) {
    const recs = Object.values(db.bib).filter(r => incluirEj || (!r.ejemplo && !r.ejercicio)).sort((a, b) => +a.id.slice(1) - +b.id.slice(1));
    if (!recs.length) { toast(Object.keys(db.bib).length ? 'Solo tienes registros de ejemplo: marca «Incluir los registros de ejemplo» para exportarlos.' : 'No hay registros bibliográficos para exportar.', 'err'); return; }
    try {
      const { blob, informe } = await D.PL.exportar(recs);
      const nombre = 'planilla_catalogacion_UTEM_' + slug(db.perfil.nombre) + '_' + fecha() + '.xlsx';
      download(nombre, blob);
      const dlg = modal('Planilla generada');
      const total = informe.reduce((n, x) => n + x.obs.length, 0);
      dlg.body.append(el('p', null, 'Se descargó ', el('b', null, nombre), ' con ' + recs.length + ' registro(s), desde la fila 4 de «Campos a completar».'),
        total ? el('p.small', null, 'Revisa estas observaciones: son datos de tus registros que no tienen columna en la planilla, o campos que la planilla marca como obligatorios y faltan.') : el('p.okmsg', null, '✓ Todos los datos cupieron en la planilla.'),
        ...informe.filter(x => x.obs.length).map(x => el('div', null, el('h4', null, 'Fila ' + x.fila + ' · ' + x.rec.id + ' · ' + M.title(x.rec)), el('ul.small', null, x.obs.map(o => el('li', null, o))))));
      if (total) dlg.foot.append(btn('Copiar observaciones', () => { navigator.clipboard.writeText(informe.filter(x => x.obs.length).map(x => 'Fila ' + x.fila + ' · ' + x.rec.id + ' · ' + M.title(x.rec) + '\n' + x.obs.map(o => '  - ' + o).join('\n')).join('\n\n')).then(() => toast('Observaciones copiadas.')); }));
      dlg.open();
    } catch (e) { toast('No se pudo generar la planilla: ' + e.message, 'err'); }
  }
  function viewPlanilla(rec) {
    const box = el('div.view', null, el('p.small.muted', null, 'Cargando la estructura de la planilla…'));
    D.PL.estructura().then(grupos => {
      const { out, obs } = D.PL.celdas(rec, grupos);
      const colLet = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
      const rows = [];
      grupos.forEach(g => g.cols.forEach(c => { if (out[c.c] !== undefined) rows.push(el('tr', null, el('td.mono', null, colLet(c.c)), el('td.mono', null, g.tag + (g.tipo ? ' (' + g.tipo + ')' : '')), el('td.mono', null, c.k === 'i1' ? 'Indicador 1' : c.k === 'i2' ? 'Indicador 2' : c.k === 'valor' ? '' : c.k), el('td', null, out[c.c]))); }));
      box.innerHTML = '';
      box.append(el('p.small', null, 'Así quedará este registro en la hoja «Campos a completar» de la planilla UTEM. Para pasarlo uno a uno usa «Copiar fila para la planilla»; para entregar todos juntos, ve a Mis datos → Planilla UTEM.'),
        obs.length ? el('div', null, el('h4', null, 'Observaciones (' + obs.length + ')'), el('ul.small', null, obs.map(o => el('li', null, o)))) : el('p.okmsg', null, '✓ Todos los datos del registro tienen columna en la planilla.'),
        el('h4', null, 'Columnas que se completan'),
        el('table.mini', null, el('thead', null, el('tr', null, ['Columna', 'Campo', 'Indicador / subcampo', 'Valor'].map(x => el('th', null, x)))), el('tbody', null, rows)));
    }).catch(e => { box.innerHTML = ''; box.append(el('p', null, 'No se pudo leer la planilla: ' + e.message)); });
    return box;
  }
  function importFile(file, mode) {
    const rd = new FileReader();
    const name = file.name.toLowerCase();
    rd.onerror = () => toast('No se pudo leer el archivo.', 'err');
    if (name.endsWith('.mrc') || name.endsWith('.marc')) {
      rd.onload = () => { try { const recs = M.parseIso(rd.result); const n = addRecords(recs); toast('Se importaron ' + n + ' registro(s) ISO 2709.'); render(); } catch (e) { toast('Archivo ISO 2709 no válido.', 'err'); } };
      rd.readAsArrayBuffer(file); return;
    }
    rd.onload = () => {
      const txt = String(rd.result);
      try {
        let recs = [];
        if (name.endsWith('.json') || /^\s*\{/.test(txt)) {
          const o = JSON.parse(txt);
          if (mode === 'replace') {
            if (!confirm('Se reemplazará todo tu catálogo por el contenido del archivo. ¿Continuar?')) return;
            const pf = db.perfil; db = fresh(); db.perfil = o.perfil ? Object.assign(fresh().perfil, o.perfil) : pf;
            (o.aut || []).forEach(r => { r.kind = 'aut'; db.aut[r.id] = r; db.seq.A = Math.max(db.seq.A, +r.id.slice(1) || 0); });
            (o.bib || []).forEach(r => { r.kind = 'bib'; db.bib[r.id] = r; db.seq.B = Math.max(db.seq.B, +r.id.slice(1) || 0); });
            persist(); toast('Catálogo restaurado desde el respaldo' + (o.perfil && o.perfil.nombre ? ' de ' + o.perfil.nombre : '') + '.'); render(); return;
          }
          recs = (o.aut || []).map(r => Object.assign(r, { kind: 'aut' })).concat((o.bib || []).map(r => Object.assign(r, { kind: 'bib' })));
          if (!o.aut && !o.bib && o.fields) recs = [o];
          const who = o.perfil && o.perfil.nombre ? o.perfil.nombre : '';
          const n = addRecords(recs, who ? { origen: who } : {});
          toast('Se agregaron ' + n + ' registro(s)' + (who ? ' de ' + who : '') + '.'); render(); return;
        }
        if (/<record|<collection/i.test(txt)) recs = M.parseXml(txt);
        else recs = M.parseText(txt);
        if (!recs.length) { toast('No se encontraron registros en el archivo.', 'err'); return; }
        const n = addRecords(recs); toast('Se importaron ' + n + ' registro(s).'); render();
      } catch (e) { toast('Error al importar: ' + e.message, 'err'); }
    };
    rd.readAsText(file, 'utf-8');
  }

  /* ============================ impresión ============================ */
  function printRecords(recs, mode) {
    const pa = $('#print-area'); pa.innerHTML = '';
    const p = db.perfil;
    if (mode === 'entrega') {
      pa.append(el('div.pcover', null, el('p.kicker', null, 'Descripción Documental II · Taller de Catalogación'), el('h1', null, 'Informe de catalogación'),
        el('p', null, el('b', null, 'Catalogador/a: '), p.nombre || '—'), el('p', null, el('b', null, 'Sección: '), p.seccion || '—'), el('p', null, el('b', null, 'Fecha: '), new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })),
        el('p', null, el('b', null, 'Contenido: '), recs.filter(r => r.kind !== 'aut').length + ' registros bibliográficos · ' + recs.filter(r => r.kind === 'aut').length + ' autoridades')));
    }
    recs.forEach(rec => {
      const iss = V.validate(rec, db), s = V.summary(iss);
      const sec = el('section.prec', null, el('h2', null, rec.id + ' · ' + M.title(rec)), el('p.small', null, M.materialLabel(rec).n + ' · modificado ' + fmtDate(rec.updated) + ' · control de calidad: ' + s.error + ' errores, ' + s.aviso + ' avisos, ' + s.sug + ' sugerencias'));
      if (mode === 'entrega' || mode === 'marc' || mode === 'mrk' || mode === 'xml') sec.append(viewMarc(rec));
      else sec.append(renderView(rec, mode));
      if (mode === 'entrega' && rec.kind !== 'aut') sec.append(el('h3', null, 'ISBD'), viewIsbd(rec));
      if (mode === 'entrega' && iss.filter(i => i.lvl !== 'sug').length) sec.append(el('h3', null, 'Observaciones pendientes'), el('ul.small', null, iss.filter(i => i.lvl !== 'sug').map(i => el('li', null, '[' + i.lvl + '] ' + i.tag + ': ' + i.msg))));
      pa.append(sec);
    });
    document.body.classList.add('printing');
    setTimeout(() => { window.print(); setTimeout(() => { document.body.classList.remove('printing'); pa.innerHTML = ''; }, 300); }, 50);
  }

  /* ============================ AYUDA ============================ */
  function vAyuda(main) {
    main.append(el('div.pagehead', null, el('h1', null, 'Guía de referencia')));
    const toc = [['uso', 'Cómo usar el taller'], ['oro', 'Regla de oro'], ['mapa', 'Mapa de campos'], ['esqueleto', 'Codificar el esqueleto'], ['reglas', 'Reglas por campo'], ['crm', 'Contenido, medio y soporte'], ['materiales', 'Formatos y materiales'], ['acceso', 'Puntos de acceso y autoridades'], ['wemi', 'Modelo WEMI'], ['abrev', 'Abreviaturas'], ['koha', 'Del taller a Koha']];
    main.append(el('nav.toc', { 'aria-label': 'Índice de la guía' }, toc.map(t => el('a', { href: '#/ayuda', on: { click: e => { e.preventDefault(); document.getElementById('h-' + t[0]).scrollIntoView({ behavior: 'smooth' }); } } }, t[1]))));
    const art = el('article.guide'); main.append(art);
    art.innerHTML = guideHTML();
  }
  function guideHTML() {
    const row = (a, b) => '<tr><td class="mono">' + a + '</td><td>' + b + '</td></tr>';
    const crm = D.RDA_CARRIER.map(c => '<tr><td>' + (D.RDA_MEDIA.find(m => m[1] === c[2]) || [''])[0] + '</td><td>' + c[0] + '</td><td class="mono">' + c[1] + '</td></tr>').join('');
    return `
<h2 id="h-uso">Cómo usar el taller</h2>
<ol>
<li><b>Nuevo registro → plantilla.</b> Elige el tipo de recurso. La plantilla precarga el Líder, el 008, el 007 y los campos habituales con subcampos vacíos.</li>
<li><b>Completa los campos.</b> Los bloques 0-9 imitan las pestañas del editor de Koha. Cada campo muestra sus indicadores (con sus valores posibles) y subcampos (con su nombre). El botón <b>?</b> abre la ayuda del campo.</li>
<li><b>Codifica con los asistentes.</b> El Líder y el 008 tienen un asistente posición por posición. El 007 ofrece valores frecuentes. En 336/337/338 al elegir el término se completan el código ($b) y la fuente ($2).</li>
<li><b>Vincula autoridades.</b> En 1XX, 6XX, 7XX y 8XX el botón <b>Vincular</b> busca la autoridad o la crea con los datos del campo.</li>
<li><b>Revisa la calidad.</b> El panel lateral marca errores, avisos y sugerencias. Haz clic en la etiqueta para ir al campo.</li>
<li><b>Guarda</b> (Ctrl + S) y, al terminar, ve a <b>Mis datos</b> para exportar o imprimir tu entrega.</li>
</ol>
<p class="note">Tu trabajo se guarda en el almacenamiento de este navegador. Si cambias de computador, borras los datos del navegador o usas una ventana privada, se pierde: exporta siempre el respaldo .json.</p>

<h2 id="h-oro">Regla de oro</h2>
<table class="mini"><tbody>
<tr><td>¿De qué <b>TRATA</b>?</td><td class="mono">6XX</td><td>Materia: personas, entidades, temas, lugares como tema.</td></tr>
<tr><td>¿<b>QUIÉN</b> la hizo?</td><td class="mono">1XX / 7XX</td><td>Responsabilidad: autor, traductor, director, productora.</td></tr>
<tr><td>¿<b>DÓNDE</b> se publicó? ¿Cómo es el objeto?</td><td class="mono">264 / 300</td><td>Publicación y descripción física.</td></tr>
<tr><td>¿Qué <b>ES</b>?</td><td class="mono">655</td><td>Género / forma (novela, documental, mapa), no de lo que trata.</td></tr>
</tbody></table>
<p>Una misma persona puede ser autora (100/700) y materia (600): en una biografía, quien la escribe va en 100 y el biografiado en 600.</p>

<h2 id="h-mapa">Mapa de campos</h2>
<table class="mini"><tbody>
${row('LDR', 'Tipo de registro y nivel bibliográfico (codificado).')}
${row('008', 'Datos de longitud fija: fecha, país, lengua, ilustraciones, forma literaria, índice…')}
${row('007', 'Descripción física codificada (solo si no es libro impreso).')}
${row('040', 'Fuente de catalogación (agencia y reglas: $e rda).')}
${row('041', 'Código de lengua ($a texto · $h original de una traducción).')}
${row('020 / 022 / 024', 'ISBN · ISSN · otros identificadores (ISMN, UPC, DOI).')}
${row('100 / 110 / 111', 'Asiento principal: persona / entidad / evento.')}
${row('130 / 240', 'Título preferido: 130 obra sin creador · 240 con creador (junto al 1XX).')}
${row('245', 'Título propiamente dicho ($a), subtítulo ($b), responsabilidad ($c). Se transcribe.')}
${row('246', 'Formas variantes del título (numérica, de cubierta, paralela).')}
${row('250', 'Mención de edición.')}
${row('264', 'Lugar ($a), editor ($b) y fecha ($c). 2.º ind.: 1 publicación, 0 producción, 4 copyright.')}
${row('300', 'Extensión ($a), otros detalles ($b), dimensiones ($c).')}
${row('336 / 337 / 338', 'Tipo de contenido · medio · soporte (RDA).')}
${row('34X / 38X', 'Características técnicas (sonido, video, archivo digital) y de la obra/expresión.')}
${row('490 / 830', 'Mención de serie transcrita · punto de acceso normalizado de la serie.')}
${row('5XX', '500 general · 502 tesis · 504 bibliografía · 505 contenido · 508 créditos · 511 intérpretes · 520 resumen · 521 público · 538 sistema · 546 lengua · 588 fuente de la descripción.')}
${row('600-651', 'Materia: persona, entidad, evento, obra, tema, lugar.')}
${row('655', 'Género / forma.')}
${row('700 / 710 / 711 / 730', 'Asientos adicionales: persona, entidad, evento, obra relacionada (con $e o $i).')}
${row('76X-78X', 'Enlaces entre recursos: 773 parte de · 775 otra edición · 776 otro formato.')}
${row('856', 'Localización electrónica (URL).')}
${row('942 / 952', 'Koha: tipo de ítem por defecto · ejemplares (ÍTEM).')}
</tbody></table>

<h2 id="h-esqueleto">Codificar el esqueleto</h2>
<table class="mini"><tbody>
${row('LDR/06', 'a texto · c música notada · e mapa · g video/película · i sonido no musical · j música grabada · k imagen fija · m archivo de computadora · r objeto · t manuscrito')}
${row('LDR/07', 'm monografía · s seriada · i integrable · a/b parte componente')}
${row('LDR/18', 'i = puntuación ISBD incluida (RDA)')}
${row('008/06', 's fecha única · t publicación + copyright · r reimpresión · m varias fechas · c/d seriada en curso/terminada')}
${row('008/07-10', 'Año (fecha 1). Desconocido parcialmente: 19uu')}
${row('008/15-17', 'País: cl Chile · sp España · mx México · ag Argentina · nyu Nueva York · xxu EE.UU. · xx desconocido')}
${row('008/35-37', 'Lengua del recurso: spa · eng · fre · por · arn (mapudungun) · zxx sin contenido lingüístico')}
${row('040', '$a agencia $b spa $c agencia $e rda — $b es la lengua en que catalogas.')}
${row('041', 'Solo si hay traducción o varias lenguas. 1# $a spa $h eng = en español, traducido del inglés.')}
</tbody></table>
<p>El 264 $a registra la <b>ciudad</b> transcrita; el 008/15-17 registra el <b>país</b> (o el estado en EE.UU., Canadá, Australia y Reino Unido). Chile siempre es <code>cl</code>, sea Santiago o Valparaíso.</p>

<h2 id="h-reglas">Reglas por campo (RC, ed. 1999 · RDA)</h2>
<dl class="rules">
<dt>245 $a · RC 1.1.3</dt><dd>Se transcribe exactamente como aparece en la fuente principal, sin corregir erratas. Puntos suspensivos → raya; corchetes → paréntesis. Sin título: se asigna uno entre corchetes (RC 1.1.3 J).</dd>
<dt>245 $b · RC 1.1.6</dt><dd>Subtítulo o información complementaria, precedido de « : ».</dd>
<dt>245 $c · RC 1.1.7</dt><dd>Mención de responsabilidad, precedida de « / ». RDA no aplica la regla de tres: se registran todas las menciones.</dd>
<dt>250 · RC 1.2.3</dt><dd>Solo si el documento la indica; la primera edición puede omitirse.</dd>
<dt>264 $a · RC 1.4.3</dt><dd>Lugar deducido entre corchetes [Barcelona]; desconocido [S.l.].</dd>
<dt>264 $b · RC 1.4.4</dt><dd>Editor en forma concisa; desconocido [s.n.].</dd>
<dt>264 $c · RC 1.4.6</dt><dd>Año en cifras arábigas. Errata: 1989 [i.e. 1990]. Deducible: [1992]. Aproximado: [ca. 1782] · [1895?] · [196-?] · [entre 1890 y 1895]. En monografías no se registran mes ni día.</dd>
<dt>300 · RC 1.5</dt><dd>Extensión : otros detalles ; dimensiones + material anejo. RDA no abrevia: 215 páginas : ilustraciones ; 24 cm.</dd>
<dt>490 / 830 · RC 1.6</dt><dd>El 490 transcribe la serie; el 830 la normaliza para reunir la colección.</dd>
<dt>5XX · RC 1.7</dt><dd>Notas objetivas, breves, en el campo correcto, que agregan información que no está en otro campo.</dd>
<dt>020 · RC 1.8.3</dt><dd>ISBN con su estructura; puede haber varios.</dd>
<dt>130 / 240 · RC 16.1</dt><dd>Título uniforme / preferido: reúne ediciones y traducciones. No es necesario si coincide con el título propiamente dicho.</dd>
</dl>

<h2 id="h-crm">Contenido, medio y soporte (RDA)</h2>
<p><b>336</b> qué es (texto, palabra hablada, imagen en movimiento bidimensional…) · <b>337</b> con qué se percibe · <b>338</b> en qué viene. El soporte debe pertenecer al medio indicado:</p>
<table class="mini"><thead><tr><th>Medio (337)</th><th>Soporte (338)</th><th>Código</th></tr></thead><tbody>${crm}</tbody></table>

<h2 id="h-materiales">Formatos MARC 21 y pistas por material</h2>
<p>Los sistemas de catalogación organizan los registros bibliográficos en siete <b>formatos</b>, que son las siete configuraciones del 008/18-34. El formato no se elige aparte: lo determinan el Líder/06 y el Líder/07. Cuando un recurso tiene características de dos formatos (un libro electrónico es BK y además archivo de computadora), el segundo se codifica en el <b>006</b>.</p>
<table class="mini"><thead><tr><th>Formato</th><th>Recurso</th><th>LDR/06-07</th><th>006 / 007</th><th>336 · 337 · 338</th><th>Campos característicos</th></tr></thead><tbody>
<tr><td class="mono" rowspan="4">BK</td><td>Libro impreso</td><td class="mono">am</td><td>—</td><td>texto · sin mediación · volumen</td><td>020, 250, 504</td></tr>
<tr><td>Libro electrónico</td><td class="mono">am</td><td class="mono">006 m · 007 cr</td><td>texto · computadora · recurso en línea</td><td>347, 588, 776, 856 · 008/23 = o</td></tr>
<tr><td>Tesis</td><td class="mono">am</td><td>—</td><td>texto · sin mediación · volumen</td><td>502, 264 #0 si es inédita, 008/24 = m</td></tr>
<tr><td>Manuscrito</td><td class="mono">tm</td><td>—</td><td>texto · sin mediación · hoja</td><td>título asignado [ ] + 500, 506</td></tr>
<tr><td class="mono" rowspan="3">CR</td><td>Revista</td><td class="mono">as</td><td>—</td><td>texto · sin mediación · volumen</td><td>022, 310, 362, 588 · 008/06 = c</td></tr>
<tr><td>Artículo</td><td class="mono">ab</td><td>—</td><td>texto · sin mediación · volumen</td><td>773 (documento fuente)</td></tr>
<tr><td>Sitio web</td><td class="mono">ai</td><td class="mono">007 cr</td><td>texto · computadora · recurso en línea</td><td>310, 588, 856 · 008/21 = w</td></tr>
<tr><td class="mono" rowspan="4">VM</td><td>DVD</td><td class="mono">gm</td><td class="mono">007 vd</td><td>imagen en movimiento bidimensional · video · videodisco</td><td>257, 344, 346, 347, 508, 511, 538 · 008/33 = v</td></tr>
<tr><td>Video en línea</td><td class="mono">gm</td><td class="mono">007 cr</td><td>imagen en movimiento bidimensional · computadora · recurso en línea</td><td>347, 588, 856</td></tr>
<tr><td>Fotografía / afiche</td><td class="mono">km</td><td class="mono">007 kh / kk</td><td>imagen fija · sin mediación · hoja</td><td>340, título asignado [ ] + 500 · 008/33 = i</td></tr>
<tr><td>Objeto</td><td class="mono">rm</td><td>—</td><td>forma tridimensional · sin mediación · objeto</td><td>340, 500, 520 · 008/33 = r</td></tr>
<tr><td class="mono" rowspan="3">MU</td><td>CD de música</td><td class="mono">jm</td><td class="mono">007 sd</td><td>música interpretada · audio · disco de audio</td><td>024/028, 344, 505, 511, 518</td></tr>
<tr><td>Podcast / audiolibro</td><td class="mono">im</td><td class="mono">007 cr</td><td>palabra hablada · computadora · recurso en línea</td><td>347, 511, 520, 856 · 008/30-31</td></tr>
<tr><td>Partitura</td><td class="mono">cm</td><td class="mono">007 qu</td><td>música notada · sin mediación · volumen</td><td>028, 348, 382, 383, 384</td></tr>
<tr><td class="mono">MP</td><td>Mapa</td><td class="mono">em</td><td class="mono">007 aj</td><td>imagen cartográfica · sin mediación · hoja</td><td>034, 255</td></tr>
<tr><td class="mono">CF</td><td>Software / juego</td><td class="mono">mm</td><td class="mono">007 co</td><td>programa informático · computadora · disco de computadora</td><td>347, 521, 538 · 008/26 = g</td></tr>
<tr><td class="mono">MX</td><td>Colección de archivo</td><td class="mono">pc</td><td>—</td><td>texto, imagen fija… · sin mediación · hoja</td><td>351, 506, 520, 545, 555 · Líder/08 = a</td></tr>
</tbody></table>

<h2 id="h-acceso">Puntos de acceso y autoridades</h2>
<p>Un <b>punto de acceso</b> es el nombre, término o título por el que un registro se busca, se identifica y se reúne con otros. El <b>punto de acceso autorizado</b> es la forma normalizada y única; las <b>variantes</b> remiten a ella. Esa elección y sus reenvíos son el trabajo de <b>control de autoridades</b>.</p>
<table class="mini"><tbody>
${row('100 1#', 'Persona por apellido: Cortázar, Julio, $d 1914-1984.')}
${row('100 3#', 'Familia: Edwards (Familia : $d … : $c Chile)')}
${row('110 2#', 'Entidad en orden directo: Comisión Económica para América Latina y el Caribe.')}
${row('111 2#', 'Evento: Congreso … $n (3.º : $d 2025 : $c Santiago, Chile)')}
${row('130 0#', 'Obra anónima: Beowulf.')}
${row('100 + 240', 'Obra con creador: Cortázar, Julio, 1914-1984. Rayuela.')}
${row('700 1# … $e', 'Otras personas con término de relación: traductor, ilustrador, director de cine…')}
</tbody></table>
<p>En el registro de autoridad: <b>1XX</b> forma autorizada · <b>046</b> fechas · <b>3XX</b> atributos (lugares 370, campo de actividad 372, afiliación 373, ocupación 374, lengua 377, forma completa 378) · <b>4XX</b> variantes («véase») · <b>5XX</b> relacionados («véase además») · <b>670</b> fuente consultada (obligatoria) · <b>678</b> datos biográficos.</p>
<p>Desde la pestaña <a href="#/indices">Índices</a> puedes ver cómo el catálogo agrupa los registros por cada punto de acceso y detectar formas no normalizadas.</p>

<h2 id="h-wemi">Modelo WEMI (IFLA LRM)</h2>
<table class="mini"><tbody>
<tr><td><b>Obra</b></td><td>La creación intelectual, independiente de la lengua o el formato.</td><td>La historia de la familia Buendía.</td></tr>
<tr><td><b>Expresión</b></td><td>La realización concreta: el texto en una lengua, una traducción.</td><td>El texto original en español.</td></tr>
<tr><td><b>Manifestación</b></td><td>La edición específica en que se publica.</td><td>La edición de bolsillo de 2007.</td></tr>
<tr><td><b>Ítem</b></td><td>El ejemplar concreto que se posee.</td><td>El ejemplar 863 GAR de la biblioteca (952).</td></tr>
</tbody></table>
<p>La vista <b>WEMI</b> de cada registro reparte sus datos en estos cuatro niveles. «Duplicar» un registro es una forma rápida de describir otra manifestación de la misma obra.</p>

<h2 id="h-abrev">Abreviaturas</h2>
<table class="mini"><tbody>
${row('[S.l.]', 'sine loco: lugar desconocido (RDA: [Lugar de publicación no identificado])')}
${row('[s.n.]', 'sine nomine: editor desconocido (RDA: [Editor no identificado])')}
${row('[i.e.]', 'id est: corrige un dato erróneo')}
${row('ca.', 'circa: año aproximado')}
${row('D.L. · cop. · imp.', 'depósito legal · copyright · impresión: fuentes alternativas de la fecha')}
${row('#', 'en indicadores y campos fijos: espacio en blanco')}
</tbody></table>

<h2 id="h-koha">Del taller a Koha</h2>
<p>Los registros se exportan en MARCXML o ISO 2709 (.mrc), los formatos que Koha acepta en <i>Herramientas → Preparar registros MARC para importación</i>. El campo 952 equivale a un ejemplar de Koha y el 942 $c al tipo de ítem por defecto; el $9 de los puntos de acceso es el mismo mecanismo que usa Koha para vincular autoridades.</p>
`;
  }

  /* ============================ arranque ============================ */
  function initTheme() {
    const b = $('#themebtn'); if (!b) return;
    const modes = ['auto', 'light', 'dark'], label = { auto: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: oscuro' };
    const ic = { auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>', light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>' };
    let cur = 'auto'; try { cur = localStorage.getItem('dd2-tema') || 'auto'; } catch (e) { }
    const apply = () => {
      if (cur === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = cur;
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' + ic[cur] + '</svg><span>' + label[cur].replace('Tema: ', '') + '</span>';
      b.title = label[cur] + ' (clic para cambiar)';
    };
    b.addEventListener('click', () => { cur = modes[(modes.indexOf(cur) + 1) % 3]; try { localStorage.setItem('dd2-tema', cur); } catch (e) { } apply(); });
    apply();
  }
  function init() {
    initTheme();
    buildDatalists();
    if (!storageOK) toast('Este navegador no permite guardar datos: exporta tu trabajo antes de cerrar.', 'err');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.DD2);
