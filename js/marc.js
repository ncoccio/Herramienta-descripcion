/* =====================================================================
   marc.js — modelo de registro, importación/exportación y vistas
   (MARC, .mrk, MARCXML, ISO 2709, ISBD, ficha, OPAC, WEMI)
   ===================================================================== */
(function (D) {
  const M = {};
  D.M = M;

  /* ------------------------------ modelo ------------------------------ */
  M.isCtl = tag => tag === 'LDR' || (/^\d{3}$/.test(tag) && tag < '010');
  M.clone = o => JSON.parse(JSON.stringify(o));
  M.fields = (rec, tag) => rec.fields.filter(f => (tag instanceof RegExp ? tag.test(f.tag) : f.tag === tag));
  M.first = (rec, tag) => rec.fields.find(f => (tag instanceof RegExp ? tag.test(f.tag) : f.tag === tag));
  M.subs = (f, code) => (f && f.subs ? f.subs.filter(s => s.c === code).map(s => s.v) : []);
  M.sub = (f, code) => M.subs(f, code)[0] || '';
  M.ctl = (rec, tag) => { const f = M.first(rec, tag); return f ? (f.value || '') : ''; };
  M.setCtl = (rec, tag, value) => {
    let f = M.first(rec, tag);
    if (!f) { f = { tag, value: '' }; rec.fields.push(f); M.sort(rec); }
    f.value = value;
  };
  M.sort = rec => {
    rec.fields = rec.fields.map((f, i) => [f, i]).sort((a, b) => (a[0].tag < b[0].tag ? -1 : a[0].tag > b[0].tag ? 1 : a[1] - b[1])).map(x => x[0]);
  };
  M.defs = rec => (rec.kind === 'aut' ? D.AUT : D.BIB);
  M.def = (rec, tag) => M.defs(rec)[tag] || null;

  M.pad = (s, n, ch = ' ') => { s = s || ''; return s.length >= n ? s.slice(0, n) : s + ch.repeat(n - s.length); };
  M.setPos = (str, p, val, len) => { str = M.pad(str, Math.max(str.length, p + len)); return str.slice(0, p) + M.pad(val, len) + str.slice(p + len); };
  M.today6 = () => { const d = new Date(); return String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); };
  M.stamp005 = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.0'; };

  // Texto de una línea MARC en notación del curso: 245 10 $a … $b …
  M.ind = c => (c === ' ' || c === undefined || c === '' ? '#' : c);
  M.lineText = f => {
    if (M.isCtl(f.tag)) return f.tag + ' ' + (f.value || '').replace(/ /g, '#');
    return f.tag + ' ' + M.ind(f.ind1) + M.ind(f.ind2) + ' ' + (f.subs || []).map(s => '$' + s.c + ' ' + s.v).join(' ');
  };

  /* --------------- análisis de texto MARC (.mrk, $, |, ‡) --------------- */
  // Acepta: =245  10$aTítulo :$bsub   ·   245 10 $a Título : $b sub   ·   245 10 |a Título
  M.parseText = function (text) {
    const recs = []; let cur = null;
    const lines = text.replace(/\r/g, '').split('\n');
    const flush = () => { if (cur && cur.fields.length) recs.push(cur); cur = null; };
    for (let raw of lines) {
      if (!raw.trim()) { flush(); continue; }
      let line = raw.replace(/\s+$/, '');
      const mrk = line.startsWith('=');
      if (mrk) line = line.slice(1);
      const m = line.match(/^(LDR|LEADER|[0-9]{3})(.*)$/i);
      if (!m) { // continuación de la línea anterior
        if (cur && cur.fields.length) { const lf = cur.fields[cur.fields.length - 1]; if (lf.subs && lf.subs.length) lf.subs[lf.subs.length - 1].v += ' ' + line.trim(); }
        continue;
      }
      if (!cur) cur = { ldr: '', fields: [] };
      let tag = m[1].toUpperCase(); if (tag === 'LEADER') tag = 'LDR';
      let rest = m[2];
      if (M.isCtl(tag)) {
        let v = mrk ? rest.replace(/^ {1,2}/, '') : rest.replace(/^\s/, '');
        v = v.replace(/\\/g, ' ').replace(/#/g, ' ');
        if (tag === 'LDR') { cur.ldr = v; } else cur.fields.push({ tag, value: v });
        continue;
      }
      rest = rest.replace(/^\s{1,2}/, '');
      // indicadores
      let i1 = ' ', i2 = ' ';
      const im = rest.match(/^([0-9a-z#\\_ ])([0-9a-z#\\_ ])\s*(?=[$|‡])/i) || rest.match(/^([0-9#\\_])([0-9#\\_])\s+/);
      if (im) { i1 = im[1]; i2 = im[2]; rest = rest.slice(im[0].length); }
      const norm = c => ('#\\_ '.includes(c) ? ' ' : c);
      i1 = norm(i1); i2 = norm(i2);
      const delim = rest.includes('$') ? '$' : rest.includes('‡') ? '‡' : '|';
      const parts = rest.split(delim).slice(rest.trim().startsWith(delim) ? 1 : 0);
      const subs = [];
      parts.forEach((p, i) => {
        if (i === 0 && !rest.trim().startsWith(delim)) { if (p.trim()) subs.push({ c: 'a', v: p.trim() }); return; }
        if (!p.length) return;
        const c = p[0]; let v = p.slice(1);
        v = mrk ? v : v.replace(/^\s/, '');
        subs.push({ c: c.toLowerCase(), v: v.replace(/\s+$/, '') });
      });
      cur.fields.push({ tag, ind1: i1, ind2: i2, subs });
    }
    flush();
    return recs;
  };

  /* ------------------------------ .mrk ------------------------------ */
  M.toMrk = function (rec) {
    const out = ['=LDR  ' + (rec.ldr || '').replace(/ /g, '\\')];
    rec.fields.forEach(f => {
      if (M.isCtl(f.tag)) out.push('=' + f.tag + '  ' + (f.value || '').replace(/ /g, '\\'));
      else out.push('=' + f.tag + '  ' + (f.ind1 === ' ' ? '\\' : f.ind1) + (f.ind2 === ' ' ? '\\' : f.ind2) + (f.subs || []).map(s => '$' + s.c + s.v).join(''));
    });
    return out.join('\n');
  };

  /* ------------------------------ MARCXML ------------------------------ */
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  M.esc = esc;
  M.toXmlRecord = function (rec, indent = '  ') {
    const t = rec.kind === 'aut' ? 'Authority' : 'Bibliographic';
    const o = [indent + '<record type="' + t + '">', indent + '  <leader>' + esc(rec.ldr) + '</leader>'];
    rec.fields.forEach(f => {
      if (M.isCtl(f.tag)) o.push(indent + '  <controlfield tag="' + f.tag + '">' + esc(f.value) + '</controlfield>');
      else {
        o.push(indent + '  <datafield tag="' + f.tag + '" ind1="' + esc(f.ind1 || ' ') + '" ind2="' + esc(f.ind2 || ' ') + '">');
        (f.subs || []).forEach(s => o.push(indent + '    <subfield code="' + esc(s.c) + '">' + esc(s.v) + '</subfield>'));
        o.push(indent + '  </datafield>');
      }
    });
    o.push(indent + '</record>');
    return o.join('\n');
  };
  M.toXml = recs => '<?xml version="1.0" encoding="UTF-8"?>\n<collection xmlns="http://www.loc.gov/MARC21/slim">\n' + recs.map(r => M.toXmlRecord(r)).join('\n') + '\n</collection>\n';
  M.parseXml = function (text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('El archivo XML no es válido.');
    const out = [];
    const recs = doc.getElementsByTagNameNS('*', 'record');
    for (const r of recs) {
      const rec = { ldr: '', fields: [] };
      const ty = r.getAttribute('type');
      if (ty === 'Authority') rec.kind = 'aut';
      for (const n of r.children) {
        const ln = n.localName;
        if (ln === 'leader') rec.ldr = n.textContent;
        else if (ln === 'controlfield') rec.fields.push({ tag: n.getAttribute('tag'), value: n.textContent });
        else if (ln === 'datafield') {
          const f = { tag: n.getAttribute('tag'), ind1: n.getAttribute('ind1') || ' ', ind2: n.getAttribute('ind2') || ' ', subs: [] };
          for (const s of n.children) if (s.localName === 'subfield') f.subs.push({ c: s.getAttribute('code'), v: s.textContent });
          rec.fields.push(f);
        }
      }
      out.push(rec);
    }
    return out;
  };

  /* ------------------------------ ISO 2709 ------------------------------ */
  M.toIso = function (rec) {
    const enc = new TextEncoder();
    const FT = '\x1e', RT = '\x1d', SD = '\x1f';
    let dir = '', data = '', pos = 0;
    const blen = s => enc.encode(s).length;
    rec.fields.forEach(f => {
      const body = M.isCtl(f.tag) ? (f.value || '') + FT : (f.ind1 || ' ') + (f.ind2 || ' ') + (f.subs || []).map(s => SD + s.c + s.v).join('') + FT;
      const l = blen(body);
      dir += f.tag + String(l).padStart(4, '0') + String(pos).padStart(5, '0');
      data += body; pos += l;
    });
    dir += FT;
    const base = 24 + blen(dir);
    const total = base + blen(data) + 1;
    let ldr = M.pad(rec.ldr || '', 24);
    ldr = String(total).padStart(5, '0') + ldr.slice(5, 9) + 'a22' + String(base).padStart(5, '0') + ldr.slice(17, 20) + '4500';
    return ldr + dir + data + RT;
  };
  M.parseIso = function (buf) {
    const bytes = new Uint8Array(buf), dec = new TextDecoder('utf-8');
    const out = []; let i = 0;
    while (i < bytes.length) {
      while (i < bytes.length && (bytes[i] === 10 || bytes[i] === 13 || bytes[i] === 32)) i++;
      if (i + 24 > bytes.length) break;
      const len = parseInt(dec.decode(bytes.slice(i, i + 5)), 10);
      if (!len) break;
      const r = bytes.slice(i, i + len); i += len;
      const ldr = dec.decode(r.slice(0, 24));
      const base = parseInt(ldr.slice(12, 17), 10);
      const rec = { ldr, fields: [] };
      const dir = dec.decode(r.slice(24, base - 1));
      for (let d = 0; d + 12 <= dir.length; d += 12) {
        const tag = dir.slice(d, d + 3), fl = parseInt(dir.slice(d + 3, d + 7), 10), st = parseInt(dir.slice(d + 7, d + 12), 10);
        let body = dec.decode(r.slice(base + st, base + st + fl));
        body = body.replace(/\x1e$/, '');
        if (M.isCtl(tag)) rec.fields.push({ tag, value: body });
        else {
          const parts = body.split('\x1f');
          const f = { tag, ind1: parts[0][0] || ' ', ind2: parts[0][1] || ' ', subs: [] };
          parts.slice(1).forEach(p => p && f.subs.push({ c: p[0], v: p.slice(1) }));
          rec.fields.push(f);
        }
      }
      out.push(rec);
    }
    return out;
  };

  /* ------------------------------ textos de apoyo ------------------------------ */
  // Texto de un encabezamiento (para índices y fichas)
  M.heading = function (f, opts = {}) {
    if (!f || !f.subs) return '';
    const skip = opts.keepRel ? '01294w' : '01294wejiu';
    return f.subs.filter(s => !skip.includes(s.c)).map(s => (/[vxyz]/.test(s.c) && opts.dashes ? '-- ' : '') + s.v).join(' ').replace(/\s+/g, ' ').trim();
  };
  M.headNorm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,:;/]+$/g, '').replace(/[.,:;/]+(\s|$)/g, '$1').replace(/\s+/g, ' ').trim();
  M.joinSubs = (f, codes) => (f && f.subs ? f.subs.filter(s => !codes || codes.includes(s.c)).map(s => s.v).join(' ').replace(/\s+/g, ' ').trim() : '');
  M.stripEnd = s => (s || '').replace(/[\s.,;:/=]+$/, '');

  M.title = function (rec) {
    if (rec.kind === 'aut') { const h = M.first(rec, /^1\d\d$/); return h ? M.heading(h) : '(autoridad sin encabezamiento)'; }
    const f = M.first(rec, '245');
    const t = f ? M.stripEnd(M.joinSubs(f, ['a', 'n', 'p', 'b'])) : '';
    return t || '(sin título)';
  };
  M.mainAuthor = rec => { const f = M.first(rec, /^1[01]\d$/); return f && f.tag !== '130' ? M.stripEnd(M.heading(f)) : ''; };
  M.year = rec => { const f = M.fields(rec, '264').find(x => x.ind2 === '1') || M.first(rec, '264') || M.first(rec, '260'); const c = M.sub(f, 'c'); const m = c.match(/\d{4}/); return m ? m[0] : (c ? M.stripEnd(c) : ''); };

  /* ------------------------------ tipo de material ------------------------------ */
  M.materialLabel = function (rec) {
    if (rec.kind === 'aut') {
      const h = M.first(rec, /^1\d\d$/); if (!h) return { k: 'aut', n: 'Autoridad' };
      const map = { '100': h.ind1 === '3' ? 'Familia' : (M.sub(h, 't') ? (M.sub(h, 'l') ? 'Expresión' : 'Obra') : 'Persona'), '110': 'Entidad corporativa', '111': 'Evento / reunión', '130': 'Obra (título)', '150': 'Materia', '151': 'Lugar', '155': 'Género / forma' };
      return { k: 'aut', n: map[h.tag] || 'Autoridad' };
    }
    const l = rec.ldr || '', t = l[6], b = l[7];
    const c338 = (M.fields(rec, '338').map(f => M.sub(f, 'b') || M.sub(f, 'a')).join(' ')).toLowerCase();
    const online = /\bcr\b|en línea/.test(c338) || M.ctl(rec, '007').startsWith('cr');
    if (t === 'a' && b === 's') return { k: 'revista', n: 'Publicación seriada' };
    if (t === 'a' && b === 'i') return { k: 'web', n: 'Recurso integrable / sitio web' };
    if (t === 'a' && (b === 'a' || b === 'b')) return { k: 'articulo', n: 'Parte componente (artículo, capítulo)' };
    if (t === 'a') { const nat = (M.ctl(rec, '008').slice(24, 28)); if (nat.includes('m') || M.first(rec, '502')) return { k: 'tesis', n: 'Tesis' }; return online ? { k: 'ebook', n: 'Libro electrónico' } : { k: 'libro', n: 'Libro' }; }
    if (t === 't') return { k: 'manuscrito', n: 'Manuscrito / documento' };
    if (t === 'g') return online ? { k: 'videoweb', n: 'Video en línea' } : { k: 'video', n: 'Video / película' };
    if (t === 'j') return { k: 'musica', n: 'Grabación sonora musical' };
    if (t === 'i') return { k: 'audio', n: 'Grabación sonora no musical' };
    if (t === 'c' || t === 'd') return { k: 'partitura', n: 'Música notada' };
    if (t === 'e' || t === 'f') return { k: 'mapa', n: 'Material cartográfico' };
    if (t === 'k') return { k: 'imagen', n: 'Imagen fija' };
    if (t === 'r') return { k: 'objeto', n: 'Objeto tridimensional' };
    if (t === 'm') return { k: 'software', n: 'Archivo de computadora' };
    if (t === 'o' || t === 'p') return { k: 'kit', n: t === 'o' ? 'Kit' : 'Material mixto' };
    return { k: 'libro', n: 'Registro' };
  };

  /* ------------------------------ ISBD ------------------------------ */
  const area = s => M.stripEnd((s || '').replace(/\s+/g, ' ').trim());
  M.isbd = function (rec) {
    const a = [];
    const f245 = M.first(rec, '245');
    a.push(area(M.joinSubs(f245, ['a', 'n', 'p', 'b', 'f', 'g', 'k', 's', 'c'])));
    M.fields(rec, '250').forEach(f => a.push(area(M.joinSubs(f))));
    M.fields(rec, '255').forEach(f => a.push(area(M.joinSubs(f))));
    if ((rec.ldr || '')[7] === 's') M.fields(rec, '362').forEach(f => a.push(area(M.joinSubs(f, ['a']))));
    const pubs = M.fields(rec, '264');
    const pub = pubs.find(f => f.ind2 === '1') || pubs.find(f => f.ind2 === '0') || pubs[0] || M.first(rec, '260');
    let p4 = pub ? area(M.joinSubs(pub, ['a', 'b', 'c'])) : '';
    const cp = pubs.find(f => f.ind2 === '4'); if (cp && pub !== cp) p4 += (p4 ? ', ' : '') + area(M.sub(cp, 'c'));
    pubs.filter(f => f !== pub && f.ind2 === '2').forEach(f => { p4 += ' ; ' + area(M.joinSubs(f, ['a', 'b', 'c'])); });
    if (p4) a.push(p4);
    const p1 = a.filter(Boolean).join('. — ') + '.';
    const p2parts = [];
    M.fields(rec, '300').forEach(f => p2parts.push(area(M.joinSubs(f))));
    let p2 = p2parts.join(' ; ');
    const series = M.fields(rec, '490').map(f => '(' + area(M.joinSubs(f, ['a', 'x', 'v'])) + ')');
    if (series.length) p2 = (p2 ? p2 + '. — ' : '') + series.join(' ');
    const notes = rec.fields.filter(f => /^5\d\d$/.test(f.tag)).map(f => noteText(f)).filter(Boolean);
    const ids = [];
    M.fields(rec, '020').forEach(f => { const v = M.sub(f, 'a'); if (v) ids.push('ISBN ' + v + (M.subs(f, 'q').length ? ' ' + M.subs(f, 'q').map(q => '(' + q.replace(/[()]/g, '') + ')').join(' ') : '')); });
    M.fields(rec, '022').forEach(f => { const v = M.sub(f, 'a'); if (v) ids.push('ISSN ' + v); });
    return { p1, p2: p2 ? p2 + (/[.)]$/.test(p2) ? '' : '.') : '', notes, ids };
  };
  const NOTE_PRE = { '502': '', '504': '', '505': '', '511': '', '521': '', '546': '', '520': '', '533': '', '538': '' };
  function noteText(f) {
    let t = M.joinSubs(f, null).replace(/\s*\$\w\s*/g, ' ');
    if (f.tag === '502' && !M.sub(f, 'a')) t = 'Tesis (' + [M.sub(f, 'b'), M.sub(f, 'c'), M.sub(f, 'd')].filter(Boolean).map(M.stripEnd).join(', ') + ')';
    if (f.tag === '505' && !/^contiene/i.test(t)) t = 'Contiene: ' + t;
    if (f.tag === '511' && f.ind1 === '1' && !/^elenco/i.test(t)) t = 'Elenco: ' + t;
    if (f.tag === '586' && !/premio/i.test(t)) t = 'Premios: ' + t;
    t = t.trim(); if (!t) return '';
    return /[.!?)]$/.test(t) ? t : t + '.';
  }
  M.noteText = noteText;

  /* ------------------------------ ficha catalográfica ------------------------------ */
  const ROMAN = n => { const r = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]; let s = ''; for (const [l, v] of r) while (n >= v) { s += l; n -= v; } return s; };
  M.ficha = function (rec) {
    const main = M.first(rec, /^1[01]\d$/);
    const uni = M.first(rec, '240') || (main && main.tag === '130' ? null : M.first(rec, '130'));
    const isbd = M.isbd(rec);
    const subj = rec.fields.filter(f => /^6[0-5]\d$/.test(f.tag) && f.tag !== '653').map(f => M.stripEnd(M.heading(f, { dashes: true })));
    const added = rec.fields.filter(f => /^7[0-3]\d$/.test(f.tag)).map(f => M.stripEnd(M.heading(f, { keepRel: true })).replace(/,\s*$/, ''));
    const f245 = M.first(rec, '245');
    if (f245 && f245.ind1 === '1') added.push('Título');
    M.fields(rec, '830').forEach(f => added.push('Serie: ' + M.stripEnd(M.heading(f))));
    const call = M.sub(M.first(rec, '952'), 'o') || M.joinSubs(M.first(rec, '090'), ['a', 'b']) || M.joinSubs(M.first(rec, '082'), ['a', 'b']) || M.joinSubs(M.first(rec, '080'), ['a']);
    const trac = [];
    subj.forEach((s, i) => trac.push((i + 1) + '. ' + s + '.'));
    added.forEach((s, i) => trac.push(ROMAN(i + 1) + '. ' + s + '.'));
    return {
      call, head: main ? M.stripEnd(M.heading(main)) + '.' : '',
      uniform: uni ? '[' + M.stripEnd(M.heading(uni)) + ']' : '',
      isbd, tracings: trac.join('  ')
    };
  };

  /* ------------------------------ WEMI ------------------------------ */
  const EXPR_ROLES = /traduc|ilustr|narr|intérpret|interpret|arregl|edit|prolog|introduc|compil|cantante|actor|actriz|director musical|anotador|revisor/i;
  M.wemi = function (rec) {
    const L = D.LENGUAS.reduce((o, x) => (o[x[0]] = x[1], o), {});
    const f008 = M.ctl(rec, '008');
    const main = M.first(rec, /^1[01]\d$/);
    const u = M.first(rec, '240') || M.first(rec, '130');
    const f245 = M.first(rec, '245');
    const lang = f008.slice(35, 38).trim();
    const f041 = M.first(rec, '041');
    const contrib = M.fields(rec, /^7[01]\d$/);
    const exprC = contrib.filter(f => EXPR_ROLES.test(M.subs(f, 'e').join(' ')));
    const workC = contrib.filter(f => !exprC.includes(f));
    const j = arr => arr.filter(Boolean).join(' · ');
    return {
      obra: [
        ['Título preferido', u ? M.stripEnd(M.joinSubs(u, ['a', 'n', 'p'])) : (f245 ? M.stripEnd(M.sub(f245, 'a')) + ' (tomado del 245: no hay 240/130)' : '')],
        ['Creador(es)', j([main && main.tag !== '130' ? M.stripEnd(M.heading(main)) : '', ...workC.map(f => M.stripEnd(M.heading(f, { keepRel: true })))])],
        ['Forma de la obra', j(M.fields(rec, '380').map(f => M.joinSubs(f, ['a'])))],
        ['Período de creación', j(M.fields(rec, '388').map(f => M.joinSubs(f, ['a'])))],
        ['De qué trata (6XX)', j(rec.fields.filter(f => /^6[0-5][0-9]$/.test(f.tag) && f.tag !== '655').map(f => M.stripEnd(M.heading(f, { dashes: true }))))],
        ['Género / forma (655)', j(M.fields(rec, '655').map(f => M.stripEnd(M.heading(f))))],
        ['Punto de acceso de la obra', main && main.tag !== '130' ? M.stripEnd(M.heading(main)) + '. ' + (u ? M.stripEnd(M.joinSubs(u, ['a', 'n', 'p'])) : (f245 ? M.stripEnd(M.sub(f245, 'a')) : '')) : (u ? M.stripEnd(M.heading(u)) : '')]
      ],
      expresion: [
        ['Lengua de la expresión', j([lang ? lang + (L[lang] ? ' (' + L[lang] + ')' : '') : '', f041 ? 'según 041: ' + M.subs(f041, 'a').join(', ') : ''])],
        ['Lengua original', j(f041 ? M.subs(f041, 'h').map(x => x + (L[x] ? ' (' + L[x] + ')' : '')) : [])],
        ['Tipo de contenido (336)', j(M.fields(rec, '336').map(f => M.sub(f, 'a')))],
        ['Lengua en el título preferido', u ? M.sub(u, 'l') : ''],
        ['Colaboradores de la expresión', j(exprC.map(f => M.stripEnd(M.heading(f, { keepRel: true }))))],
        ['Otras características', j(M.fields(rec, '381').map(f => M.joinSubs(f, ['a'])))],
        ['Resumen (520)', j(M.fields(rec, '520').map(f => M.sub(f, 'a')))]
      ],
      manifestacion: [
        ['Título y mención de responsabilidad', f245 ? M.stripEnd(M.joinSubs(f245)) : ''],
        ['Edición', j(M.fields(rec, '250').map(f => M.stripEnd(M.joinSubs(f))))],
        ['Publicación / producción', j(M.fields(rec, '264').map(f => M.stripEnd(M.joinSubs(f, ['a', 'b', 'c']))))],
        ['Descripción física', j(M.fields(rec, '300').map(f => M.stripEnd(M.joinSubs(f))))],
        ['Medio y soporte (337/338)', j([...M.fields(rec, '337').map(f => M.sub(f, 'a')), ...M.fields(rec, '338').map(f => M.sub(f, 'a'))])],
        ['Identificadores', j([...M.fields(rec, '020').map(f => 'ISBN ' + M.sub(f, 'a')), ...M.fields(rec, '022').map(f => 'ISSN ' + M.sub(f, 'a')), ...M.fields(rec, '024').map(f => M.sub(f, 'a')), ...M.fields(rec, '028').map(f => M.joinSubs(f, ['b', 'a']))])],
        ['Serie', j(M.fields(rec, '490').map(f => M.stripEnd(M.joinSubs(f))))],
        ['Acceso en línea', j(M.fields(rec, '856').map(f => M.sub(f, 'u')))]
      ],
      items: M.fields(rec, '952').map(f => ({ bib: M.sub(f, 'a'), ub: M.sub(f, 'c'), sig: M.sub(f, 'o'), cb: M.sub(f, 'p'), tipo: M.sub(f, 'y'), nota: M.sub(f, 'z') })),
      relaciones: [
        ...contrib.filter(f => M.sub(f, 'i') || M.sub(f, 't')).map(f => [f.tag, M.stripEnd(M.heading(f, { keepRel: true }))]),
        ...M.fields(rec, '730').map(f => ['730', M.stripEnd(M.heading(f, { keepRel: true }))]),
        ...rec.fields.filter(f => /^7[6-8]\d$/.test(f.tag)).map(f => [f.tag, M.stripEnd(M.joinSubs(f, ['i', 'a', 't', 'g', 'd']))]),
        ...M.fields(rec, '830').map(f => ['830 serie', M.stripEnd(M.heading(f))])
      ]
    };
  };

  /* ------------------------------ ISBN ------------------------------ */
  M.isbnCheck = function (raw) {
    const s = (raw || '').split(/\s|\(/)[0].replace(/[-\s]/g, '').toUpperCase();
    if (!s) return null;
    if (/^\d{9}[\dX]$/.test(s)) { let t = 0; for (let i = 0; i < 10; i++) t += (s[i] === 'X' ? 10 : +s[i]) * (10 - i); return t % 11 === 0; }
    if (/^\d{13}$/.test(s)) { let t = 0; for (let i = 0; i < 13; i++) t += +s[i] * (i % 2 ? 3 : 1); return t % 10 === 0; }
    return false;
  };
})(window.DD2);
