/* =====================================================================
   validacion.js — Control de calidad del registro
   Reglas basadas en el material del curso (Mapa de campos, Reglas por
   campo, Guía «Codificar el esqueleto», Lab 7 Notas, Guía de puntos de
   acceso) y en MARC 21 / RDA.
   Niveles: error (debe corregirse) · aviso (revisar) · sug (sugerencia)
   ===================================================================== */
(function (D) {
  const M = D.M;
  const V = {};
  D.V = V;

  const strip = s => (s || '').trim();
  const endsWith = (s, re) => re.test(strip(s));

  V.nonFiling = function (title, lang) {
    if (!title) return 0;
    let t = title; let lead = 0;
    const m0 = t.match(/^[¿¡"'«“‘(\[]+/); if (m0) { lead = m0[0].length; t = t.slice(lead); }
    const lists = lang && D.ARTICULOS[lang] ? [D.ARTICULOS[lang]] : [D.ARTICULOS.spa, D.ARTICULOS.eng];
    const low = t.toLowerCase();
    for (const list of lists) {
      for (const a of list.slice().sort((x, y) => y.length - x.length)) {
        if (a.endsWith("'")) { if (low.startsWith(a)) return lead + a.length; }
        else if (low.startsWith(a + ' ')) return lead + a.length + 1;
      }
    }
    return lead ? lead : 0;
  };

  V.validate = function (rec, db) {
    return rec.kind === 'aut' ? validateAut(rec, db) : validateBib(rec, db);
  };

  function generic(rec, out, db) {
    const defs = M.defs(rec);
    const seen = {};
    rec.fields.forEach((f, idx) => {
      const d = defs[f.tag];
      seen[f.tag] = (seen[f.tag] || 0) + 1;
      if (!/^(\d{3})$/.test(f.tag)) out.push({ lvl: 'error', tag: f.tag, idx, msg: 'La etiqueta «' + f.tag + '» no es válida: debe tener tres dígitos.' });
      if (!d && /^\d{3}$/.test(f.tag) && !/^9/.test(f.tag)) out.push({ lvl: 'sug', tag: f.tag, idx, msg: 'El campo ' + f.tag + ' no está en el diccionario de la asignatura. Revisa que la etiqueta sea correcta.' });
      if (M.isCtl(f.tag)) return;
      if (!f.subs || !f.subs.length) { out.push({ lvl: 'error', tag: f.tag, idx, msg: 'El campo ' + f.tag + ' no tiene subcampos.' }); return; }
      const sc = {};
      f.subs.forEach(s => {
        sc[s.c] = (sc[s.c] || 0) + 1;
        if (!strip(s.v)) out.push({ lvl: 'aviso', tag: f.tag, idx, msg: f.tag + ' $' + s.c + ' está vacío: complétalo o elimínalo.' });
        if (d && d.s && !d.s[s.c] && s.c !== '6' && s.c !== '8') out.push({ lvl: 'aviso', tag: f.tag, idx, msg: 'El subcampo $' + s.c + ' no está definido para el ' + f.tag + '.' });
        if (/\s{2,}/.test(s.v)) out.push({ lvl: 'sug', tag: f.tag, idx, msg: f.tag + ' $' + s.c + ' tiene espacios dobles.' });
      });
      if (d && d.s) Object.keys(sc).forEach(c => { if (sc[c] > 1 && d.s[c] && !d.s[c].r) out.push({ lvl: 'aviso', tag: f.tag, idx, msg: 'El subcampo $' + c + ' no es repetible en el ' + f.tag + '.' }); });
      if (d) {
        ['i1', 'i2'].forEach((k, n) => {
          const val = n ? f.ind2 : f.ind1, opt = d[k];
          if (!opt) return;
          if (opt === 'nf') { if (!/^[0-9]$/.test(val)) out.push({ lvl: 'error', tag: f.tag, idx, msg: (n ? '2.º' : '1.er') + ' indicador del ' + f.tag + ': debe ser un número de 0 a 9 (caracteres que no se alfabetizan).' }); }
          else if (!(val in opt)) out.push({ lvl: 'error', tag: f.tag, idx, msg: (n ? '2.º' : '1.er') + ' indicador del ' + f.tag + ' («' + M.ind(val) + '») no es válido. Opciones: ' + Object.keys(opt).map(x => M.ind(x)).join(', ') + '.' });
        });
      }
      // vínculos de autoridad
      const link = M.sub(f, '9');
      if (link && db) {
        const a = db.aut[link];
        if (!a) out.push({ lvl: 'aviso', tag: f.tag, idx, msg: f.tag + ': está vinculado a la autoridad ' + link + ', que ya no existe.' });
        else {
          const h = M.first(a, /^1\d\d$/);
          if (h && M.headNorm(M.heading(f)) !== M.headNorm(M.heading(h))) out.push({ lvl: 'aviso', tag: f.tag, idx, msg: f.tag + ' no coincide con su autoridad (' + M.stripEnd(M.heading(h)) + '). Usa «Vincular» para sincronizarlo.' });
        }
      }
    });
    Object.keys(seen).forEach(t => { const d = defs[t]; if (d && !d.r && seen[t] > 1) out.push({ lvl: 'error', tag: t, msg: 'El campo ' + t + ' no es repetible y aparece ' + seen[t] + ' veces.' }); });
  }

  function validateBib(rec, db) {
    const out = [];
    const ldr = rec.ldr || '';
    const add = (lvl, tag, msg, ref, fix) => out.push({ lvl, tag, msg, ref, fix });
    const F = t => M.first(rec, t), FF = t => M.fields(rec, t);

    /* ---- Líder ---- */
    if (ldr.length !== 24) add('error', 'LDR', 'El Líder debe tener 24 posiciones (tiene ' + ldr.length + ').', 'Lab 5');
    const t06 = ldr[6], t07 = ldr[7];
    if (!'acdefgijkmoprt'.includes(t06 || '_')) add('error', 'LDR', 'Líder/06 (tipo de registro) no es válido.', 'Guía Codificar el esqueleto');
    if (!'abcdims'.includes(t07 || '_')) add('error', 'LDR', 'Líder/07 (nivel bibliográfico) no es válido.', 'Guía Codificar el esqueleto');
    if (ldr[18] !== 'i') add('aviso', 'LDR', 'Líder/18 debería ser «i» (puntuación ISBD incluida, catalogación RDA).', 'Guía Codificar el esqueleto', r => { r.ldr = M.setPos(r.ldr, 18, 'i', 1); });

    /* ---- 008 ---- */
    const f008 = M.ctl(rec, '008');
    const lang = f008.slice(35, 38);
    if (!F('008')) add('error', '008', 'Falta el 008 (datos de longitud fija).', 'Núcleo RDA + MARC');
    else {
      if (f008.length !== 40) add('error', '008', 'El 008 debe tener 40 posiciones (tiene ' + f008.length + ').', 'Lab 5');
      if (!'bcdeikmnpqrstu|'.includes(f008[6] || '_')) add('error', '008', '008/06 (tipo de fecha) no es válido.');
      const y = f008.slice(7, 11);
      if (!/^[0-9u]{4}$/.test(y) && f008[6] !== 'n') add('error', '008', '008/07-10 (fecha 1) debe tener 4 caracteres: dígitos o «u» (p. ej. 2021, 19uu).');
      const y264 = M.year(rec);
      if (/^\d{4}$/.test(y264) && /^\d{4}$/.test(y) && y !== y264 && f008[6] === 's') add('aviso', '008', 'El año del 008 (' + y + ') no coincide con el del 264 $c (' + y264 + ').', 'Guía Codificar el esqueleto', r => M.setCtl(r, '008', M.setPos(M.ctl(r, '008'), 7, y264, 4)));
      const c264 = M.sub(FF('264').find(f => f.ind2 === '1') || F('264'), 'c');
      if (/cop\.|©|c\d{4}/.test(c264) && f008[6] === 's') add('sug', '008', 'El 264 tiene una fecha de copyright: si la publicación y el copyright difieren, usa 008/06 = t y registra ambas fechas.');
      if (FF('264').some(f => f.ind2 === '4') && f008[6] === 's') add('sug', '008', 'Hay un 264 #4 (copyright). Si el año de copyright es distinto al de publicación, codifica 008/06 = t (fecha 1 publicación, fecha 2 copyright).', 'Guía Codificar el esqueleto');
      if (!/^[a-z]{2,3}\s?$/.test(f008.slice(15, 18))) add('error', '008', '008/15-17 (país) debe ser un código MARC de país (cl, sp, mx, nyu, xxu…).', 'Reglas por campo · 264 vs 008');
      const L = D.LENGUAS.map(x => x[0]);
      if (!/^[a-z]{3}$/.test(lang)) add('error', '008', '008/35-37 (lengua) debe ser un código MARC de 3 letras (spa, eng, fre…).');
      else if (!L.includes(lang)) add('sug', '008', 'El código de lengua «' + lang + '» no está en la lista rápida del curso; verifica que exista en la MARC Code List for Languages.');
      const p264 = M.sub(FF('264').find(f => f.ind2 === '1') || F('264'), 'a');
      if (/santiago|valpara|concepci|valdivia|temuco|antofagasta|la serena|punta arenas|talca|rancagua|iquique|chill[aá]n|osorno|puerto montt/i.test(p264) && f008.slice(15, 17) !== 'cl') add('aviso', '008', 'El 264 $a indica una ciudad chilena, pero 008/15-17 no es «cl».', 'Reglas por campo · 264 vs 008');
      const typ = D.tipo008(ldr);
      if (typ === 'BK') {
        const b300 = FF('300').map(f => M.sub(f, 'b')).join(' ').toLowerCase();
        if (/ilustr|il\.|mapa|fotograf|retrato|gráfic|grafic/.test(b300) && !f008.slice(18, 22).trim()) add('sug', '008', 'El 300 $b menciona ilustraciones, pero 008/18-21 está en blanco (ilustraciones: a, b, c, o…).');
        if (FF('504').length && !f008.slice(24, 28).includes('b')) add('sug', '008', 'Hay nota de bibliografía (504): considera codificar «b» en 008/24-27 (naturaleza del contenido).');
        if (FF('500').some(f => /índice|indice/i.test(M.sub(f, 'a'))) && f008[31] !== '1') add('sug', '008', 'La nota indica que incluye índice: 008/31 debería ser 1.');
        const g655 = FF('655').map(f => M.sub(f, 'a')).join(' ').toLowerCase();
        if (/novela/.test(g655) && !'1f'.includes(f008[33])) add('sug', '008', 'El 655 dice «novela», pero 008/33 (forma literaria) no es «f».');
        if (/poes|poema/.test(g655) && f008[33] !== 'p') add('sug', '008', 'El 655 indica poesía: 008/33 debería ser «p».');
        if (/cuento/.test(g655) && f008[33] !== 'j') add('sug', '008', 'El 655 indica cuentos: 008/33 debería ser «j».');
        if (FF('502').length && !f008.slice(24, 28).includes('m')) add('sug', '008', 'Hay nota de tesis (502): codifica «m» en 008/24-27.');
        if (f008.slice(24, 28).includes('m') && !FF('502').length) add('aviso', '502', 'El 008 indica que es tesis (m) pero falta la nota de tesis 502.');
      }
      if (typ === 'VM') {
        if ('gkor'.includes(t06) && !f008[33].trim()) add('aviso', '008', '008/33 (tipo de material visual) está en blanco.');
        if (t06 === 'g' && !'vmfst'.includes(f008[33])) add('aviso', '008', 'Para video o película, 008/33 suele ser «v» (video) o «m» (película).');
        if (t06 === 'k' && !'acikln o'.includes(f008[33])) add('sug', '008', 'Para imagen fija, 008/33 suele ser «i» (imagen), «k» (gráfico) o «a» (arte original).');
        if (t06 === 'r' && !'rqgwdb'.includes(f008[33])) add('sug', '008', 'Para objeto tridimensional, 008/33 suele ser «r» (realia), «q» (modelo), «g» (juego) o «w» (juguete).');
        if (t06 === 'g') { const d3 = f008.slice(18, 21); const m300 = FF('300').map(f => M.sub(f, 'a')).join(' ').match(/(\d+)\s*min/); if (m300 && /^\d{3}$/.test(d3) && +d3 !== +m300[1]) add('aviso', '008', 'La duración del 008/18-20 (' + d3 + ') no coincide con la del 300 (' + m300[1] + ' min).'); }
      }
      if (typ === 'MU' && (t06 === 'j' || t06 === 'i') && f008[20] !== 'n') add('sug', '008', 'En grabaciones sonoras, 008/20 (formato de la música) suele ser «n» (no aplica).');
      const online = FF('338').some(f => /recurso en línea|^cr$/i.test(M.sub(f, 'a') || M.sub(f, 'b')));
      const formPos = { BK: 23, CR: 23, MU: 23, MP: 29, VM: 29, CF: 23, MX: 23 }[typ];
      if (online && f008[formPos] !== 'o') add('aviso', '008', 'El soporte es «recurso en línea»: la posición de forma del ítem del 008 (' + formPos + ') debería ser «o».', null, r => M.setCtl(r, '008', M.setPos(M.ctl(r, '008'), formPos, 'o', 1)));
    }

    /* ---- 007 ---- */
    const media = FF('337').map(f => (M.sub(f, 'a') || '').toLowerCase());
    const needs007 = !'at'.includes(t06) || media.some(m => m && m !== 'sin mediación');
    if (needs007 && !F('007') && !'or'.includes(t06)) add('aviso', '007', 'Falta el 007: se usa cuando el recurso NO es un libro impreso (cr en línea, vd DVD, sd CD, aj mapa, kh fotografía…).', 'Plantilla de registro · 007');
    const v007 = M.ctl(rec, '007');
    if (v007) {
      const cat = v007[0];
      const exp = { g: 'vm', i: 'sc', j: 'sc', e: 'ac', c: 'qc', k: 'kc', m: 'c', a: 'tc', t: 'tc' }[t06];
      if (exp && !exp.includes(cat)) add('aviso', '007', '007/00 = «' + cat + '» (' + (D.F007_CAT[cat] || '?') + ') no parece coherente con el Líder/06 = «' + t06 + '».');
      if (FF('338').some(f => /recurso en línea/i.test(M.sub(f, 'a'))) && !M.fields(rec, '007').some(f => (f.value || '').startsWith('cr'))) add('aviso', '007', 'El soporte es «recurso en línea»: agrega un 007 que empiece por «cr».');
    }

    /* ---- 040 ---- */
    const f040 = F('040');
    if (!f040) add('error', '040', 'Falta el 040 (fuente de la catalogación).', 'Guía Codificar el esqueleto');
    else {
      if (!M.sub(f040, 'a')) add('error', '040', 'Falta 040 $a (agencia que cataloga).');
      if (!M.sub(f040, 'b')) add('aviso', '040', 'Falta 040 $b (lengua de catalogación: spa).', null, r => { const f = M.first(r, '040'); f.subs.splice(1, 0, { c: 'b', v: 'spa' }); });
      if (!M.subs(f040, 'e').includes('rda')) add('aviso', '040', 'Falta 040 $e rda (convenciones de descripción).', 'Guía Codificar el esqueleto', r => { M.first(r, '040').subs.push({ c: 'e', v: 'rda' }); });
      if (M.sub(f040, 'b') && M.sub(f040, 'b') !== 'spa') add('sug', '040', '040 $b es la lengua en que catalogas (spa), no la lengua del recurso.', 'Guía Codificar el esqueleto');
    }

    /* ---- 041 ---- */
    const f041 = F('041');
    const translator = FF('700').some(f => /traduc/i.test(M.subs(f, 'e').join(' '))) || /traduc/i.test(M.sub(F('245'), 'c'));
    if (f041) {
      const a = M.subs(f041, 'a'), h = M.subs(f041, 'h');
      if (f041.ind1 === '1' && !h.length) add('aviso', '041', '041 con 1.er indicador 1 (traducción) debería incluir $h con la lengua original.', 'Guía Codificar el esqueleto');
      if (h.length && f041.ind1 !== '1') add('aviso', '041', 'Si hay $h (lengua original), el 1.er indicador del 041 debe ser 1.', 'Guía Codificar el esqueleto', r => { M.first(r, '041').ind1 = '1'; });
      if (a.length && lang && a[0] !== lang) add('aviso', '041', 'El primer 041 $a (' + a[0] + ') no coincide con la lengua del 008/35-37 (' + lang + ').', 'Guía Codificar el esqueleto');
      if (a.length === 1 && !h.length && !M.subs(f041, 'j').length && !M.subs(f041, 'b').length && !M.subs(f041, 'd').length && a[0] === lang) add('sug', '041', 'El 041 solo se usa si hay traducción o varias lenguas. Con una sola lengua igual a la del 008, no es necesario.', 'Guía Codificar el esqueleto');
      if (h.length && !F('240') && !F('130')) add('sug', '240', 'Es una traducción: agrega el título preferido de la obra original (240 con $l lengua de la traducción).', 'Reglas por campo · 130/240');
    } else if (translator && 'at'.includes(t06)) add('aviso', '041', 'El recurso parece ser una traducción (hay traductor) pero falta el 041 1# $a … $h ….', 'Guía Codificar el esqueleto');

    /* ---- ISBN ---- */
    FF('020').forEach(f => { const v = M.sub(f, 'a'); if (v) { const ok = M.isbnCheck(v); if (ok === false) add('aviso', '020', 'El ISBN «' + v + '» no es válido (dígito de control o longitud). Revísalo o muévelo a $z si es incorrecto en la fuente.', 'RC 1.8.3'); } });

    /* ---- 1XX / 240 / 130 ---- */
    const main = rec.fields.filter(f => /^1[01][01]$/.test(f.tag));
    const f130 = F('130'), f240 = F('240');
    if (main.length > 1) add('error', '1XX', 'Hay más de un campo 1XX. Una obra tiene un solo asiento principal; los demás van en 7XX.', 'Guía Puntos de acceso');
    if (main.length && f130) add('error', '130', 'El 130 se usa solo cuando NO hay 100/110/111 (obra sin creador). Con creador, usa el 240.', 'Reglas por campo · 130/240');
    if (f240 && !main.length) add('error', '240', 'El 240 requiere un 1XX (creador). Si la obra no tiene creador, usa el 130.', 'Reglas por campo · 130/240');
    if (f240 && f130) add('error', '240', 'No pueden coexistir 240 y 130.');
    main.forEach(f => {
      const a = M.sub(f, 'a');
      if (f.tag === '100' && f.ind1 === '1' && a && !a.includes(',')) add('aviso', '100', 'Con 1.er indicador 1 (apellido) el nombre se invierte: «Apellido, Nombre».', 'Guía Puntos de acceso');
      if (f.tag === '100' && f.ind1 === '0' && /,/.test(a)) add('aviso', '100', 'El nombre está invertido (tiene coma) pero el 1.er indicador es 0 (nombre de pila). ¿Debería ser 1?');
      const d = M.sub(f, 'd');
      if (d && !/^(ca\.\s)?\d{3,4}\??-?((ca\.\s)?\d{3,4}\??)?[.,]?$|^(n\.|m\.|activo|fl\.|active|siglo|approximately|approximately)/i.test(d.trim())) add('sug', f.tag, 'Revisa el formato de las fechas en $d (p. ej. 1914-1984, 1953-).');
      if (d) { const i = f.subs.findIndex(s => s.c === 'd'); if (i > 0 && !/[,]$/.test(strip(f.subs[i - 1].v))) add('sug', f.tag, 'Puntuación: el subcampo anterior a $d termina en coma («Cortázar, Julio, $d 1914-1984»).'); }
    });

    /* ---- 245 ---- */
    const f245 = F('245');
    if (!f245) add('error', '245', 'Falta el 245 (mención de título): es el primer elemento de la descripción.', 'RC 1.1.3');
    else {
      const a = M.sub(f245, 'a');
      if (!a) add('error', '245', 'Falta 245 $a (título propiamente dicho).', 'RC 1.1.3');
      const want1 = (main.length ? '1' : '0');
      if (f245.ind1 !== want1) add('aviso', '245', '1.er indicador del 245 = ' + want1 + (main.length ? ' (hay 1XX, se genera asiento de título).' : ' (no hay 1XX: el título es el asiento principal).'), 'Guía Puntos de acceso', r => { M.first(r, '245').ind1 = want1; });
      const nf = V.nonFiling(a, lang);
      if (String(nf) !== (f245.ind2 || '').trim()) add('aviso', '245', '2.º indicador del 245: el título empieza con «' + a.slice(0, Math.max(nf, 6)).trim() + '…» → ' + nf + ' carácter(es) no alfabetizables.', 'Plantilla · 245 (El = 3, La = 3, Los = 4, The = 4)', r => { M.first(r, '245').ind2 = String(nf); });
      const subs = f245.subs;
      subs.forEach((s, i) => {
        if (i === 0) return;
        const prev = strip(subs[i - 1].v);
        if (s.c === 'b' && !/[:;=]$/.test(prev)) add('sug', '245', 'Puntuación ISBD: el subcampo anterior a $b termina en « :» (o « =» si es título paralelo).', 'RC 1.1.6');
        if (s.c === 'c' && !/\/$/.test(prev)) add('sug', '245', 'Puntuación ISBD: el subcampo anterior a $c termina en « /».', 'RC 1.1.7');
        if ((s.c === 'n' || s.c === 'p') && !/[.,]$/.test(prev)) add('sug', '245', 'Puntuación: el subcampo anterior a $' + s.c + ' termina en punto.');
      });
      const last = strip(subs.length ? subs[subs.length - 1].v : '');
      if (last && !/[.?!\]-]$/.test(last)) add('sug', '245', 'El 245 termina en punto final.', 'Ejemplos del curso');
      if (/\.\.\./.test(a)) add('sug', '245', 'RC: los puntos suspensivos del título se sustituyen por raya ( — ).', 'RC 1.1.3');
      if (/^\[.*\]/.test(a) && !FF('500').some(f => /título|titulo/i.test(M.sub(f, 'a')))) add('sug', '500', 'El título está entre corchetes (asignado): agrega una nota 500 sobre la fuente del título (p. ej. «Título asignado por el catalogador»).', 'RC 1.1.3 J');
    }

    /* ---- 246 ---- */
    if (f245) { const a = M.sub(f245, 'a'); if (/^\d{3,}/.test(a) && !FF('246').length) add('sug', '246', 'El título comienza con números: considera un 246 con la forma en letras (p. ej. «Mil novecientos ochenta y cuatro»).', 'Mapa de campos · 246'); }

    /* ---- 264 ---- */
    const p = FF('264');
    if (!p.length && !F('260')) add('error', '264', 'Falta el 264 (lugar, editor y fecha).', 'RC 1.4');
    p.forEach(f => {
      if (!'01234'.includes(f.ind2 || '_')) add('error', '264', '2.º indicador del 264: 1 = publicación, 0 = producción (inédito), 4 = copyright…');
      if (f.ind2 === '4') { if (!M.sub(f, 'c')) add('error', '264', 'El 264 #4 (copyright) solo lleva $c con la fecha (© 2020).'); return; }
      if (!M.sub(f, 'a')) add('aviso', '264', 'Falta 264 $a (lugar). Si se desconoce: [S.l.] (RC) o [Lugar de publicación no identificado] (RDA).', 'RC 1.4.3');
      if (!M.sub(f, 'b') && f.ind2 !== '0') add('aviso', '264', 'Falta 264 $b (editor). Si se desconoce: [s.n.] (RC) o [Editor no identificado] (RDA).', 'RC 1.4.4');
      if (!M.sub(f, 'c')) add('aviso', '264', 'Falta 264 $c (fecha). Si no consta, estímala entre corchetes: [2020?], [ca. 1980], [entre 1980 y 1989].', 'RC 1.4.6');
      const s = f.subs;
      s.forEach((x, i) => { if (!i) return; const prev = strip(s[i - 1].v); if (x.c === 'b' && !/:$/.test(prev)) add('sug', '264', 'Puntuación: el lugar ($a) termina en « :» antes del editor ($b).', 'RC 1.4'); if (x.c === 'c' && !/,$/.test(prev)) add('sug', '264', 'Puntuación: el editor ($b) termina en «,» antes de la fecha ($c).', 'RC 1.4'); });
      const c = M.sub(f, 'c');
      if (c && /\b\d{1,2}\s+de\s+\w+/i.test(c)) add('aviso', '264', 'En monografías la fecha de publicación es el AÑO; no se registran mes ni día.', 'Reglas por campo · Fecha');
      if (c && !/[.\]?)]$/.test(strip(c))) add('sug', '264', 'El 264 $c termina en punto.');
    });
    if (p.length && !p.some(f => f.ind2 === '1') && !p.some(f => f.ind2 === '0')) add('aviso', '264', 'No hay un 264 de publicación (2.º indicador 1) ni de producción (0).');

    /* ---- 300 ---- */
    const f300 = FF('300');
    if (!f300.length) add('error', '300', 'Falta el 300 (descripción física).', 'RC 1.5');
    f300.forEach(f => {
      if (!M.sub(f, 'a')) add('error', '300', 'Falta 300 $a (extensión).');
      if (/\bp\.\s*$|^\d+\s*p\.?\s/.test(M.sub(f, 'a')) && f040 && M.subs(f040, 'e').includes('rda')) add('sug', '300', 'RDA no abrevia: «215 páginas» en vez de «215 p.».');
      if (/\bil\.|\bcol\.\s/.test(M.sub(f, 'b')) && f040 && M.subs(f040, 'e').includes('rda')) add('sug', '300', 'RDA no abrevia: «ilustraciones», «color».');
      const a = M.sub(f, 'a');
      if ('at'.includes(t06) && !online0() && !M.sub(f, 'c')) add('sug', '300', 'Falta 300 $c (dimensiones, p. ej. 24 cm).', 'RC 1.5');
    });
    function online0() { return FF('338').some(f => /recurso en línea/i.test(M.sub(f, 'a'))); }

    /* ---- 336 / 337 / 338 ---- */
    const voc = { '336': [D.RDA_CONTENT, 'rdacontent'], '337': [D.RDA_MEDIA, 'rdamedia'], '338': [D.RDA_CARRIER, 'rdacarrier'] };
    Object.keys(voc).forEach(tag => {
      const fs = FF(tag);
      if (!fs.length) { add('error', tag, 'Falta el ' + tag + ' (' + D.BIB[tag].n + '): elemento núcleo RDA.', 'Mapa de campos · Contenido (RDA)'); return; }
      fs.forEach(f => {
        const term = (M.sub(f, 'a') || '').trim().toLowerCase();
        const hit = voc[tag][0].find(x => x[0] === term);
        if (term && !hit) add('aviso', tag, tag + ' $a «' + term + '» no está en el vocabulario RDA (' + voc[tag][1] + '). Elige un término de la lista.');
        if (hit && !M.sub(f, 'b')) add('sug', tag, 'Agrega ' + tag + ' $b ' + hit[1] + ' (código del término).', null, r => { const ff = M.fields(r, tag).find(x => (M.sub(x, 'a') || '').toLowerCase() === term); const i = ff.subs.findIndex(s => s.c === 'a'); ff.subs.splice(i + 1, 0, { c: 'b', v: hit[1] }); });
        if (hit && M.sub(f, 'b') && M.sub(f, 'b') !== hit[1]) add('aviso', tag, tag + ' $b «' + M.sub(f, 'b') + '» no corresponde al término «' + term + '» (debería ser ' + hit[1] + ').');
        if (M.sub(f, '2') !== voc[tag][1]) add('aviso', tag, 'El ' + tag + ' debe llevar $2 ' + voc[tag][1] + '.', 'Mapa de campos', r => { const ff = M.fields(r, tag).find(x => x === undefined ? false : (M.sub(x, 'a') || '').toLowerCase() === term) || M.first(r, tag); const s2 = ff.subs.find(s => s.c === '2'); if (s2) s2.v = voc[tag][1]; else ff.subs.push({ c: '2', v: voc[tag][1] }); });
      });
    });
    const cont = FF('336').map(f => M.sub(f, 'b') || (D.RDA_CONTENT.find(x => x[0] === (M.sub(f, 'a') || '').toLowerCase()) || [])[1]).filter(Boolean);
    const expC = D.LDR06_CONTENT[t06];
    if (expC && cont.length && !cont.some(c => expC.includes(c))) add('aviso', '336', 'El tipo de contenido (336) no es coherente con el Líder/06 «' + t06 + '». Esperado: ' + expC.map(c => (D.RDA_CONTENT.find(x => x[1] === c) || [c])[0]).join(' / ') + '.', 'RDA · contenido');
    const medCodes = FF('337').map(f => M.sub(f, 'b') || (D.RDA_MEDIA.find(x => x[0] === (M.sub(f, 'a') || '').toLowerCase()) || [])[1]).filter(Boolean);
    FF('338').forEach(f => {
      const hit = D.RDA_CARRIER.find(x => x[0] === (M.sub(f, 'a') || '').toLowerCase() || x[1] === M.sub(f, 'b'));
      if (hit && medCodes.length && !medCodes.includes(hit[2])) add('aviso', '338', 'El soporte «' + hit[0] + '» no corresponde al tipo de medio indicado en el 337 (' + FF('337').map(x => M.sub(x, 'a')).join(', ') + ').', 'Mapa de campos · 337/338');
    });

    /* ---- Serie ---- */
    FF('490').forEach(f => { if (f.ind1 === '1' && !rec.fields.some(x => /^8[013]0$/.test(x.tag))) add('aviso', '830', 'El 490 tiene 1.er indicador 1 (serie trazada): falta el punto de acceso normalizado 830.', 'RC 1.6 · Reglas por campo'); });
    if (rec.fields.some(x => /^8[013]0$/.test(x.tag)) && !FF('490').length) add('aviso', '490', 'Hay un 8XX de serie pero falta la mención transcrita (490 1#).', 'RC 1.6');
    FF('490').forEach(f => { if (f.ind1 === '0' && rec.fields.some(x => /^8[013]0$/.test(x.tag))) add('aviso', '490', 'Hay un 830: el 1.er indicador del 490 debería ser 1.', null, r => { M.fields(r, '490').forEach(x => x.ind1 = '1'); }); });

    /* ---- Materias ---- */
    const subj = rec.fields.filter(f => /^6\d\d$/.test(f.tag));
    if (!subj.filter(f => f.tag !== '655' && f.tag !== '653').length) add('sug', '6XX', 'Agrega al menos una materia (6XX): ¿de qué TRATA la obra?', 'Regla de oro · Mapa de campos');
    subj.forEach(f => {
      if (f.tag === '653') return;
      const s2 = M.sub(f, '2');
      if (f.ind2 === '7' && !s2) add('aviso', f.tag, f.tag + ' con 2.º indicador 7 debería llevar $2 (fuente: lemb, embne, lcgft, local…). La planilla UTEM no tiene columna para $2 en los 6XX.', 'MARC 6XX · Planilla UTEM');
      if (s2 && f.ind2 !== '7') add('aviso', f.tag, 'Si indicas la fuente en $2, el 2.º indicador del ' + f.tag + ' debe ser 7.', null, () => { f.ind2 = '7'; });
      if (f.ind2 === ' ') add('aviso', f.tag, 'El 2.º indicador del ' + f.tag + ' indica el vocabulario: 0 = LCSH, 4 = no especificado, 7 = fuente en $2.');
      if (f.tag === '600' && f.ind1 === '1' && !M.sub(f, 'a').includes(',')) add('aviso', '600', 'Con 1.er indicador 1 el nombre se invierte: «Apellido, Nombre».');
      const a = M.sub(f, 'a');
      if (f.tag === '650' && /^[a-záéíóúñ]/.test(a)) add('sug', '650', 'Los encabezamientos de materia comienzan con mayúscula.');
    });
    const main100 = M.first(rec, '100');
    if (main100) FF('600').forEach(f => { if (M.headNorm(M.sub(f, 'a')) === M.headNorm(M.sub(main100, 'a'))) add('sug', '600', 'La misma persona es autora (100) y materia (600): correcto en autobiografías; revisa que sea intencional.', 'Guía Puntos de acceso · regla de oro'); });

    /* ---- 7XX ---- */
    FF('700').concat(FF('710')).forEach(f => {
      if (!M.subs(f, 'e').length && !M.subs(f, '4').length && !M.sub(f, 'i') && !M.sub(f, 't')) add('sug', f.tag, f.tag + ' «' + M.stripEnd(M.sub(f, 'a')) + '»: agrega el término de relación en $e (traductor, ilustrador, director de cine…).', 'Guía Puntos de acceso · 7XX');
      if (main100 && f.tag === '700' && M.headNorm(M.sub(f, 'a')) === M.headNorm(M.sub(main100, 'a'))) add('aviso', '700', 'La persona del 700 ya es el asiento principal (100). No se repite.', 'Guía Puntos de acceso');
      if (f.tag === '700' && f.ind1 === '1' && !M.sub(f, 'a').includes(',')) add('aviso', '700', 'Con 1.er indicador 1 el nombre se invierte: «Apellido, Nombre».');
      const ie = f.subs.findIndex(s => s.c === 'e');
      if (ie > 0 && !/[,-]$/.test(strip(f.subs[ie - 1].v))) add('sug', f.tag, 'Puntuación: el subcampo anterior a $e termina en coma («López, José, $e traductor»).');
    });
    if (!main.length && !f130 && !FF('700').length && !FF('710').length && !FF('711').length && f245 && M.sub(f245, 'c')) add('sug', '7XX', 'El 245 $c menciona responsables, pero no hay puntos de acceso de persona o entidad (1XX/7XX).', 'Guía Puntos de acceso');

    /* ---- Notas ---- */
    FF('505').forEach(f => { const a = M.sub(f, 'a'); if (a && /;|,/.test(a) && !/--/.test(a)) add('sug', '505', 'En la nota de contenido (505) las partes se separan con « -- ».', 'Lab 7'); });
    FF('520').forEach(f => { if ((M.sub(f, 'a') || '').length > 1200) add('sug', '520', 'El resumen es muy extenso: una buena nota es breve y objetiva.', 'Lab 7'); if (/\b(excelente|maravillos|imperdible|genial|recomiendo)/i.test(M.sub(f, 'a'))) add('sug', '520', 'El resumen debe ser objetivo: evita juicios de valor.', 'Lab 7'); });

    /* ---- Material específico ---- */
    if (t06 === 'e' && !F('255')) add('aviso', '255', 'Material cartográfico: falta el 255 (escala).', 'RC cap. 3');
    if (t06 === 'e' && F('255') && !F('034')) add('sug', '034', 'Material cartográfico: agrega el 034 con la escala codificada.');
    if (t06 === 'g' && !FF('508').length && !FF('511').length && !FF('700').length) add('sug', '508', 'Video/película: registra créditos (508), elenco (511) y puntos de acceso de director/productora (700/710).');
    if ((t06 === 'g' || t06 === 'j' || t06 === 'i') && !FF('344').length && !online0()) add('sug', '344', 'Grabación: el 344 registra las características del sonido (digital, óptico, estéreo).');
    if (t06 === 'g' && FF('338').some(f => /videodisco/i.test(M.sub(f, 'a'))) && !FF('538').length) add('sug', '538', 'DVD/Blu-ray: el 538 indica requisitos del sistema (p. ej. «DVD, región 4»).');
    if ('cd'.includes(t06) && !FF('348').length) add('sug', '348', 'Música notada: el 348 indica el formato (partitura, partitura vocal, parte…).');
    if (t07 === 's' && !FF('310').length) add('sug', '310', 'Publicación seriada: indica la frecuencia (310).');
    if (t07 === 's' && !FF('362').length && !FF('588').length) add('sug', '362', 'Publicación seriada: registra la numeración (362) o la fuente de la descripción (588).');
    if (t07 === 's' && f245 && f245.ind1 === '1') add('sug', '245', 'Las publicaciones seriadas normalmente se describen por título (245 0X) sin 1XX.');
    if ((t07 === 'a' || t07 === 'b') && !FF('773').length) add('aviso', '773', 'Parte componente (Líder/07 = ' + t07 + '): falta el 773 con el documento fuente (revista o libro que la contiene).', 'Clase 7 · relación parte-todo');
    if (online0() && !FF('856').length) add('sug', '856', 'Recurso en línea: el 856 40 $u registra la URL (la planilla UTEM no tiene columna para este campo).');
    // Campos marcados como «Obligatorio» en la planilla UTEM
    [['082', 'clasificación Dewey'], ['520', 'resumen'], ['650', 'materia temática'], ['905', 'campo local'], ['949', 'campo local']].forEach(([t, n]) => { if (!FF(t).length) add('sug', t, 'La planilla UTEM marca el ' + t + ' (' + n + ') como obligatorio.', 'Planilla UTEM'); });
    if (D.fmtRegistro && D.fmtRegistro(rec) === 'BK' && t06 === 'm') { if (!FF('516').length) add('sug', '516', 'Libro electrónico: la planilla UTEM pide el 516 (p. ej. «Texto en PDF.»).', 'Planilla UTEM'); if (!FF('655').some(f => /libros electr/i.test(M.sub(f, 'a')))) add('sug', '655', 'Libro electrónico: la planilla UTEM pide el 655 «Libros electrónicos».', 'Planilla UTEM'); }
    FF('856').forEach(f => { const u = M.sub(f, 'u'); if (u && !/^https?:\/\//i.test(u)) add('aviso', '856', '856 $u debe ser una URL completa (https://…).'); });
    if (online0() && !FF('588').length) add('sug', '588', 'Recurso en línea: el 588 registra la fuente de la descripción y la fecha de consulta.', 'Clase 8 · procedencia');

    /* ---- Ítem (Koha) ---- */
    if (!FF('952').length) add('sug', '952', 'Sin ejemplares: agrega un 952 para registrar el ÍTEM (biblioteca, signatura, código de barras).', 'WEMI · Ítem');
    FF('952').forEach(f => { if (!M.sub(f, 'a')) add('aviso', '952', '952: falta $a (biblioteca propietaria).'); if (!M.sub(f, 'y') && !M.sub(M.first(rec, '942'), 'c')) add('aviso', '952', '952: falta $y (tipo de ítem Koha) o un 942 $c por defecto.'); });

    generic(rec, out, db);
    return out.map(normalize);
  }

  function validateAut(rec, db) {
    const out = [];
    const add = (lvl, tag, msg, ref, fix) => out.push({ lvl, tag, msg, ref, fix });
    const F = t => M.first(rec, t), FF = t => M.fields(rec, t);
    if ((rec.ldr || '').length !== 24) add('error', 'LDR', 'El Líder debe tener 24 posiciones.');
    if ((rec.ldr || '')[6] !== 'z') add('error', 'LDR', 'En autoridades el Líder/06 debe ser «z».', null, r => { r.ldr = M.setPos(r.ldr, 6, 'z', 1); });
    const f008 = M.ctl(rec, '008');
    if (!F('008')) add('error', '008', 'Falta el 008.'); else if (f008.length !== 40) add('error', '008', 'El 008 debe tener 40 posiciones (tiene ' + f008.length + ').');
    const f040 = F('040');
    if (!f040) add('error', '040', 'Falta el 040 (fuente de la catalogación).');
    else if (!M.subs(f040, 'e').includes('rda')) add('aviso', '040', 'Falta 040 $e rda.', null, r => M.first(r, '040').subs.push({ c: 'e', v: 'rda' }));
    const heads = rec.fields.filter(f => /^1\d\d$/.test(f.tag));
    if (!heads.length) add('error', '1XX', 'Falta el encabezamiento autorizado (1XX).', 'Guía Puntos de acceso');
    if (heads.length > 1) add('error', '1XX', 'Una autoridad tiene un solo encabezamiento autorizado (1XX).');
    const h = heads[0];
    if (h) {
      const a = M.sub(h, 'a');
      if (!a) add('error', h.tag, 'Falta $a en el encabezamiento.');
      if (h.tag === '100' && h.ind1 === '1' && a && !a.includes(',')) add('aviso', '100', 'Con 1.er indicador 1 (apellido) el nombre se invierte: «Apellido, Nombre».');
      if (/[.]$/.test(strip(h.subs[h.subs.length - 1].v)) && h.tag !== '150') add('sug', h.tag, 'En el registro de autoridad el encabezamiento no lleva punto final (salvo abreviaturas).');
      if (h.tag === '100' && h.ind1 !== '3' && !M.sub(h, 't') && !M.sub(h, 'd') && !M.sub(h, 'q') && !M.sub(h, 'c')) add('sug', '100', 'Agrega un elemento diferenciador (fechas $d, forma completa $q o títulos $c) para evitar homónimos.', 'RDA · Persona · Clase 5');
      if (h.tag === '100' && h.ind1 !== '3' && !M.sub(h, 't')) {
        if (!FF('046').length) add('sug', '046', 'Registra las fechas de nacimiento/muerte codificadas en el 046 ($f, $g).', 'RDA · Persona');
        if (!FF('374').length) add('sug', '374', 'Registra la profesión u ocupación (374).', 'RDA · Persona');
        if (!FF('370').length) add('sug', '370', 'Registra los lugares asociados (370).', 'RDA · Persona');
      }
      if (h.tag === '100' && h.ind1 === '3' && !FF('376').length) add('sug', '376', 'Familia: registra el tipo de familia y miembros prominentes (376).', 'RDA · Familia');
      if (h.tag === '110' && !FF('368').length && !FF('370').length) add('sug', '368', 'Entidad: registra el tipo de entidad (368) y su sede (370 $e).', 'RDA · Entidad corporativa');
      if (/^15/.test(h.tag) && !(f040 && M.sub(f040, 'f'))) add('aviso', '040', 'Materias: indica el vocabulario en 040 $f (lemb, embne, local…).');
      if (!rec.fields.some(f => /^4\d\d$/.test(f.tag))) add('sug', '4XX', 'Agrega formas variantes (4XX) por las que alguien podría buscar: remiten a la forma autorizada.', 'Guía Puntos de acceso · variantes');
      rec.fields.filter(f => /^4\d\d$/.test(f.tag)).forEach(v => { if (M.headNorm(M.heading(v)) === M.headNorm(M.heading(h))) add('aviso', v.tag, 'La variante es igual a la forma autorizada.'); });
    }
    if (!FF('670').length) add('error', '670', 'Falta el 670 (fuente consultada): justifica la forma elegida.', 'NACO · Clase 5');
    FF('670').forEach(f => { if (!M.sub(f, 'a')) add('error', '670', '670 sin $a (cita de la fuente).'); if (M.sub(f, 'a') && !M.sub(f, 'b')) add('sug', '670', 'Indica en 670 $b la información encontrada en la fuente.'); });
    FF('046').forEach(f => f.subs.forEach(s => { if ('fgkqrst'.includes(s.c) && s.v && !/^-?\d{3,4}(-\d{2}(-\d{2})?)?[?~]?$/.test(s.v.trim())) add('aviso', '046', '046 $' + s.c + ': usa formato aaaa, aaaa-mm o aaaa-mm-dd.'); }));
    // usos y duplicados
    if (db && h) {
      const n = M.headNorm(M.heading(h));
      Object.values(db.aut).forEach(o => { if (o.id !== rec.id) { const oh = M.first(o, /^1\d\d$/); if (oh && oh.tag === h.tag && M.headNorm(M.heading(oh)) === n) add('aviso', h.tag, 'Ya existe otra autoridad con el mismo encabezamiento (' + o.id + '). Las autoridades deben ser únicas: diferéncialas o fusiónalas.', 'Control de autoridades'); } });
    }
    generic(rec, out, db);
    return out.map(normalize);
  }

  function normalize(x) {
    if (x.idx === undefined) x.idx = null;
    return x;
  }

  V.summary = function (issues) {
    const s = { error: 0, aviso: 0, sug: 0 };
    issues.forEach(i => s[i.lvl]++);
    return s;
  };

  // Elementos núcleo (Lab 5): Líder, 008, 245, 264, 300, 1XX (+ 336/337/338)
  V.core = function (rec) {
    const has = t => (t === 'LDR' ? (rec.ldr || '').length === 24 : rec.fields.some(f => (t instanceof RegExp ? t.test(f.tag) : f.tag === t)));
    const f245 = M.first(rec, '245');
    const needs1 = f245 ? f245.ind1 === '1' : true;
    return [
      ['Líder', has('LDR')], ['008', has('008')], ['040', has('040')], ['245', has('245')], ['264', has('264')], ['300', has('300')],
      ['1XX' + (needs1 ? '' : ' (no aplica)'), needs1 ? has(/^1[013][01]$/) : true], ['336', has('336')], ['337', has('337')], ['338', has('338')], ['6XX', has(/^6[0-5]\d$/)]
    ];
  };
})(window.DD2);
