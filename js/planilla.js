/* =====================================================================
   planilla.js — exportación a la «Planilla de catalogación UTEM» (.xlsx)
   Llena la hoja «Campos a completar» de la planilla original: una fila por
   registro desde la fila 4. Las columnas se leen de los encabezados de la
   propia planilla (fila 1: campo · fila 2: indicador o subcampo), así que
   si la planilla cambia basta con reemplazar el archivo
   assets/planilla_catalogacion_UTEM.xlsx.
   No usa librerías: lee y escribe el .xlsx (un .zip) con las API del navegador.
   ===================================================================== */
(function (D) {
  'use strict';
  const M = D.M;
  const P = {};
  D.PL = P;
  const HOJA = 'Campos a completar';
  const FILA_INICIO = 4;
  const RUTA = 'assets/planilla_catalogacion_UTEM.xlsx';
  const KEY_TPL = 'dd2-planilla-propia';

  P.FMT_ETIQUETA = { BK: 'Libros (BK)', VM: 'Materiales visuales (VM)', CR: 'Recursos continuos (CR)', MU: 'Música (MU)', MP: 'Mapas (MP)', CF: 'Archivos de computadora (CF)', MX: 'Materiales mixtos (MX)' };

  /* ------------------------------ ZIP ------------------------------ */
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const u16 = (b, o) => b[o] | (b[o + 1] << 8);
  async function inflar(data) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no permite leer archivos .xlsx. Usa Chrome, Edge, Firefox o Safari actualizados.');
    const st = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  async function leerZip(buf) {
    const b = new Uint8Array(buf);
    let e = b.length - 22;
    while (e >= 0 && u32(b, e) !== 0x06054b50) e--;
    if (e < 0) throw new Error('El archivo no es un .xlsx válido.');
    const n = u16(b, e + 10); let p = u32(b, e + 16);
    const dec = new TextDecoder();
    const files = {}; const orden = [];
    for (let i = 0; i < n; i++) {
      if (u32(b, p) !== 0x02014b50) throw new Error('Directorio del .xlsx dañado.');
      const met = u16(b, p + 10), csz = u32(b, p + 20), nl = u16(b, p + 28), el = u16(b, p + 30), cl = u16(b, p + 32), off = u32(b, p + 42);
      const name = dec.decode(b.subarray(p + 46, p + 46 + nl));
      const lnl = u16(b, off + 26), lel = u16(b, off + 28);
      const raw = b.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + csz);
      files[name] = met === 0 ? raw.slice() : met === 8 ? await inflar(raw) : (() => { throw new Error('Compresión no soportada en ' + name); })();
      orden.push(name);
      p += 46 + nl + el + cl;
    }
    return { files, orden };
  }
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = d => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  async function desinflar(data) {
    if (typeof CompressionStream === 'undefined') return null;
    const st = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  async function escribirZip(z) {
    const enc = new TextEncoder();
    const partes = [], central = []; let off = 0;
    const w16 = (a, v) => a.push(v & 255, (v >>> 8) & 255);
    const w32 = (a, v) => a.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255);
    for (const name of z.orden) {
      const data = z.files[name]; if (!data) continue;
      const nb = enc.encode(name), crc = crc32(data);
      let comp = await desinflar(data), met = 8;
      if (!comp || comp.length >= data.length) { comp = data; met = 0; }
      const h = []; w32(h, 0x04034b50); w16(h, 20); w16(h, 0x0800); w16(h, met); w16(h, 0); w16(h, 0x21); w32(h, crc); w32(h, comp.length); w32(h, data.length); w16(h, nb.length); w16(h, 0);
      partes.push(new Uint8Array(h), nb, comp);
      const c = []; w32(c, 0x02014b50); w16(c, 20); w16(c, 20); w16(c, 0x0800); w16(c, met); w16(c, 0); w16(c, 0x21); w32(c, crc); w32(c, comp.length); w32(c, data.length); w16(c, nb.length); w16(c, 0); w16(c, 0); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, off);
      central.push(new Uint8Array(c), nb);
      off += h.length + nb.length + comp.length;
    }
    const csz = central.reduce((n, x) => n + x.length, 0);
    const eo = []; w32(eo, 0x06054b50); w16(eo, 0); w16(eo, 0); w16(eo, z.orden.length); w16(eo, z.orden.length); w32(eo, csz); w32(eo, off); w16(eo, 0);
    return new Blob([...partes, ...central, new Uint8Array(eo)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ------------------------------ plantilla ------------------------------ */
  const b64abuf = s => { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; };
  const abufb64 = buf => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  P.origen = '';
  async function obtenerPlantilla() {
    try { const s = localStorage.getItem(KEY_TPL); if (s) { const o = JSON.parse(s); P.origen = 'Planilla propia: ' + o.nombre; return b64abuf(o.b64); } } catch (e) { }
    if (location.protocol !== 'file:') try { const r = await fetch(RUTA, { cache: 'no-cache' }); if (r.ok) { P.origen = 'Planilla del repositorio (' + RUTA + ')'; return await r.arrayBuffer(); } } catch (e) { }
    if (D.PLANILLA_B64) { P.origen = 'Planilla incluida en la herramienta'; return b64abuf(D.PLANILLA_B64); }
    throw new Error('No se encontró la planilla base.');
  }
  P.guardarPropia = async function (file) {
    const buf = await file.arrayBuffer();
    const z = await leerZip(buf); await analizar(z); // valida que tenga la hoja
    localStorage.setItem(KEY_TPL, JSON.stringify({ nombre: file.name, b64: abufb64(buf) }));
    P._cache = null;
  };
  P.quitarPropia = () => { try { localStorage.removeItem(KEY_TPL); } catch (e) { } P._cache = null; };
  P.tienePropia = () => { try { const s = localStorage.getItem(KEY_TPL); return s ? JSON.parse(s).nombre : ''; } catch (e) { return ''; } };

  /* ------------------------------ lectura de encabezados ------------------------------ */
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const xml = u8 => new DOMParser().parseFromString(new TextDecoder().decode(u8), 'application/xml');
  const ser = doc => new TextEncoder().encode(new XMLSerializer().serializeToString(doc));
  const colNum = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n; };
  const colLet = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

  async function analizar(z) {
    const wb = xml(z.files['xl/workbook.xml']);
    const rels = xml(z.files['xl/_rels/workbook.xml.rels']);
    const sh = Array.from(wb.getElementsByTagNameNS(NS, 'sheet')).find(s => s.getAttribute('name').trim() === HOJA);
    if (!sh) throw new Error('La planilla no tiene la hoja «' + HOJA + '».');
    const rid = sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = Array.from(rels.getElementsByTagName('Relationship')).find(r => r.getAttribute('Id') === rid);
    let target = rel.getAttribute('Target'); target = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
    const sst = z.files['xl/sharedStrings.xml'] ? Array.from(xml(z.files['xl/sharedStrings.xml']).getElementsByTagNameNS(NS, 'si')).map(si => Array.from(si.getElementsByTagNameNS(NS, 't')).map(t => t.textContent).join('')) : [];
    const doc = xml(z.files[target]);
    const val = c => {
      if (!c) return '';
      const t = c.getAttribute('t');
      if (t === 's') return sst[+c.getElementsByTagNameNS(NS, 'v')[0].textContent] || '';
      if (t === 'inlineStr') return Array.from(c.getElementsByTagNameNS(NS, 't')).map(x => x.textContent).join('');
      const v = c.getElementsByTagNameNS(NS, 'v')[0]; return v ? v.textContent : '';
    };
    const filas = {};
    Array.from(doc.getElementsByTagNameNS(NS, 'row')).forEach(r => { const n = +r.getAttribute('r'); if (n <= 3) { filas[n] = {}; Array.from(r.getElementsByTagNameNS(NS, 'c')).forEach(c => { filas[n][colNum(c.getAttribute('r'))] = val(c).replace(/ /g, ' ').trim(); }); } });
    const r1 = filas[1] || {}, r2 = filas[2] || {}, r3 = filas[3] || {};
    const maxC = Math.max(...Object.keys(r1).map(Number), ...Object.keys(r2).map(Number));
    const grupos = []; let g = null;
    for (let c = 1; c <= maxC; c++) {
      const h1 = r1[c] || '', h2 = r2[c] || '';
      if (h1) {
        const m = h1.match(/^(FMT|LDR|\d{1,3})\s*(?:\((.*)\))?$/i);
        if (!m) { g = null; continue; }
        let tag = m[1].toUpperCase(); if (/^\d+$/.test(tag)) tag = tag.padStart(3, '0');
        const tipo = (m[2] || '').toLowerCase();
        g = { tag, tipo, ind2: tag === '264' ? (/public/.test(tipo) ? '1' : /fabric/.test(tipo) ? '3' : /copyright/.test(tipo) ? '4' : /distrib/.test(tipo) ? '2' : /produc/.test(tipo) ? '0' : null) : null, cols: [], oblig: r3[c] || '', ctl: tag === 'FMT' || tag === 'LDR' || tag < '010' };
        grupos.push(g);
        if (g.ctl) { g.cols.push({ c, k: 'valor' }); continue; }
      }
      if (!g || g.ctl || !h2) continue;
      if (/indicador\s*1/i.test(h2)) g.cols.push({ c, k: 'i1' });
      else if (/indicador\s*2/i.test(h2)) g.cols.push({ c, k: 'i2' });
      else { const s = h2.match(/^\$\s*([a-z0-9])$/i); if (s) g.cols.push({ c, k: '$' + s[1].toLowerCase() }); }
    }
    return { target, doc, grupos, maxC };
  }
  async function cargar() {
    const buf = await obtenerPlantilla();
    const z = await leerZip(buf);
    const a = await analizar(z);
    return { z, a };
  }
  P.estructura = async function () { if (!P._cache) P._cache = cargar().then(x => x.a.grupos).catch(e => { P._cache = null; throw e; }); return P._cache; };

  /* ------------------------------ registro → celdas ------------------------------ */
  const blanco = s => (s || '').replace(/ /g, '^');
  function valorCtl(rec, tag) {
    if (tag === 'FMT') return P.FMT_ETIQUETA[D.fmtRegistro(rec)] || D.fmtRegistro(rec);
    if (tag === 'LDR') { let l = M.pad(rec.ldr || '', 24); l = '     ' + l.slice(5, 12) + '     ' + l.slice(17); return blanco(l); }
    const v = M.ctl(rec, tag); if (!v) return '';
    if (tag === '008') return blanco('------' + v.slice(6));
    return blanco(v);
  }
  P.celdas = function (rec, grupos) {
    const out = {}; const obs = [];
    const usados = new Set();
    // ocurrencias por grupo
    const porTag = {};
    grupos.forEach(g => { (porTag[g.tag] = porTag[g.tag] || []).push(g); });
    grupos.filter(g => g.ctl).forEach(g => { const v = valorCtl(rec, g.tag); if (v) out[g.cols[0].c] = v; });
    rec.fields.forEach(f => { if (M.isCtl(f.tag) && !porTag[f.tag] && !/^00[135]$/.test(f.tag)) obs.push(f.tag + ': la planilla no tiene columna para este campo de control.'); });
    // un campo sin datos (solo indicadores, $2 o un © sin año) no se traspasa
    const lleno = (f, c) => f.subs.some(s => s.c === c && s.v.trim());
    const vacio = f => {
      if (/^[1678]\d\d$/.test(f.tag) && f.tag !== '650' && !lleno(f, 'a')) return true; // nombre sin $a: solo trae el término de relación
      if (f.tag === '650' && !lleno(f, 'a')) return true;
      if (f.tag === '541' && !lleno(f, 'a') && !lleno(f, 'd')) return true;
      return !f.subs.some(s => s.c !== '2' && s.c !== '9' && s.v.trim() && !/^[©℗]$/.test(s.v.trim()));
    };
    const datos = rec.fields.filter(f => !M.isCtl(f.tag) && !vacio(f));
    const tags = [...new Set(datos.map(f => f.tag))];
    tags.forEach(tag => {
      let fs = datos.filter(f => f.tag === tag);
      let gs = (porTag[tag] || []).slice();
      if (/^9[45]2$/.test(tag)) return; // Koha: no van a la planilla
      if (!gs.length) { obs.push(tag + ' (' + fs.length + '): la planilla no tiene columnas para este campo; no se exportó.'); return; }
      if (tag === '264') {
        fs.forEach(f => { const g = gs.find(x => x.ind2 === f.ind2 && !usados.has(x)); if (!g) { obs.push('264 con 2.º indicador ' + M.ind(f.ind2) + ': no hay columnas de ese tipo en la planilla.'); return; } usados.add(g); llenar(f, g); });
        return;
      }
      fs.forEach((f, i) => { const g = gs[i]; if (!g) { obs.push(tag + ': la planilla admite ' + gs.length + ' ocurrencia(s); se omitió «' + M.stripEnd(M.joinSubs(f)).slice(0, 60) + '».'); return; } llenar(f, g); });
    });
    function llenar(f, g) {
      const cols = g.cols;
      if (vacio(f)) return;
      const ci = cols.find(c => c.k === 'i1'), cj = cols.find(c => c.k === 'i2');
      if (ci) out[ci.c] = M.ind(f.ind1); else if (f.ind1 && f.ind1 !== ' ') obs.push(f.tag + ': la planilla no tiene columna para el 1.er indicador (' + f.ind1 + ').');
      if (cj) out[cj.c] = M.ind(f.ind2); else if (f.ind2 && f.ind2 !== ' ') obs.push(f.tag + ': la planilla no tiene columna para el 2.º indicador (' + f.ind2 + ').');
      const porCod = {};
      f.subs.forEach(s => { if (s.c === '9') return; if (!s.v.trim()) return; (porCod[s.c] = porCod[s.c] || []).push(s.v.trim()); });
      // fecha de copyright: el 264 #4 de la planilla la recibe en $a
      if (f.tag === '264' && f.ind2 === '4' && porCod.c && !cols.some(c => c.k === '$c') && cols.some(c => c.k === '$a')) { porCod.a = (porCod.a || []).concat(porCod.c); delete porCod.c; }
      Object.keys(porCod).forEach(code => {
        const cc = cols.filter(c => c.k === '$' + code);
        const vals = porCod[code];
        if (!cc.length) { obs.push(f.tag + ' $' + code + ' «' + vals.join(' · ').slice(0, 50) + '»: la planilla no tiene columna para este subcampo.'); return; }
        vals.forEach((v, i) => {
          const col = cc[Math.min(i, cc.length - 1)].c;
          out[col] = out[col] && i >= cc.length ? out[col] + '$$' + code + v : v;
        });
      });
    }
    // obligatorios vacíos
    const llenos = new Set(grupos.filter(g => g.cols.some(c => out[c.c] !== undefined)).map(g => g.tag + (g.tag === '264' ? g.ind2 : '')));
    grupos.forEach(g => { if (/^obligatorio$/i.test(g.oblig) && !llenos.has(g.tag + (g.tag === '264' ? g.ind2 : ''))) obs.push((g.tag + (g.tipo ? ' (' + g.tipo + ')' : '')) + ': la planilla lo marca como obligatorio y el registro no lo tiene.'); });
    return { out, obs: [...new Set(obs)] };
  };

  /* ------------------------------ escritura de la hoja ------------------------------ */
  function fijarCelda(doc, fila, col, valor) {
    const sd = doc.getElementsByTagNameNS(NS, 'sheetData')[0];
    let row = Array.from(sd.getElementsByTagNameNS(NS, 'row')).find(r => +r.getAttribute('r') === fila);
    if (!row) {
      row = doc.createElementNS(NS, 'row'); row.setAttribute('r', fila);
      const sig = Array.from(sd.getElementsByTagNameNS(NS, 'row')).find(r => +r.getAttribute('r') > fila);
      sd.insertBefore(row, sig || null);
    }
    const ref = colLet(col) + fila;
    let c = Array.from(row.getElementsByTagNameNS(NS, 'c')).find(x => x.getAttribute('r') === ref);
    if (!c) {
      c = doc.createElementNS(NS, 'c'); c.setAttribute('r', ref);
      const sig = Array.from(row.getElementsByTagNameNS(NS, 'c')).find(x => colNum(x.getAttribute('r')) > col);
      row.insertBefore(c, sig || null);
    }
    while (c.firstChild) c.removeChild(c.firstChild);
    if (valor === null) { c.removeAttribute('t'); return; }
    c.setAttribute('t', 'inlineStr');
    const is = doc.createElementNS(NS, 'is'), t = doc.createElementNS(NS, 't');
    t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    t.textContent = valor; is.appendChild(t); c.appendChild(is);
  }
  function quitarCalcChain(z) {
    if (!z.files['xl/calcChain.xml']) return;
    delete z.files['xl/calcChain.xml']; z.orden = z.orden.filter(n => n !== 'xl/calcChain.xml');
    const dec = u8 => new TextDecoder().decode(u8), enc = s => new TextEncoder().encode(s);
    z.files['[Content_Types].xml'] = enc(dec(z.files['[Content_Types].xml']).replace(/<Override[^>]*calcChain[^>]*\/>/g, ''));
    z.files['xl/_rels/workbook.xml.rels'] = enc(dec(z.files['xl/_rels/workbook.xml.rels']).replace(/<Relationship[^>]*calcChain[^>]*\/>/g, ''));
  }
  function recalcular(z) {
    const dec = new TextDecoder(), enc = new TextEncoder();
    let w = dec.decode(z.files['xl/workbook.xml']);
    if (/<calcPr[^>]*\/>/.test(w)) w = w.replace(/<calcPr([^>]*?)\s*\/>/, (m, a) => '<calcPr' + a.replace(/\s*fullCalcOnLoad="[^"]*"/, '') + ' fullCalcOnLoad="1"/>');
    else w = w.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
    z.files['xl/workbook.xml'] = enc.encode(w);
  }

  // Genera la planilla con los registros. Devuelve { blob, informe }
  P.exportar = async function (recs) {
    const { z, a } = await cargar();
    const informe = [];
    // limpiar las filas de muestra que traiga la plantilla en la columna FMT
    Array.from(a.doc.getElementsByTagNameNS(NS, 'c')).forEach(c => { const ref = c.getAttribute('r'); const fila = +ref.replace(/\D/g, ''); if (fila >= FILA_INICIO && colNum(ref) === 1 && c.firstChild) fijarCelda(a.doc, fila, 1, null); });
    recs.forEach((rec, i) => {
      const fila = FILA_INICIO + i;
      const { out, obs } = P.celdas(rec, a.grupos);
      Object.keys(out).forEach(col => fijarCelda(a.doc, fila, +col, out[col]));
      informe.push({ rec, fila, obs });
    });
    z.files[a.target] = ser(a.doc);
    quitarCalcChain(z); recalcular(z);
    return { blob: await escribirZip(z), informe, origen: P.origen };
  };

  // Fila separada por tabuladores para pegar en Excel (columna A en adelante)
  P.filaTSV = async function (rec) {
    const grupos = await P.estructura();
    const { out, obs } = P.celdas(rec, grupos);
    const max = Math.max(...Object.keys(out).map(Number), 1);
    const fila = []; for (let c = 1; c <= max; c++) fila.push((out[c] || '').replace(/[\t\n]/g, ' '));
    return { tsv: fila.join('\t'), obs };
  };
})(window.DD2);
