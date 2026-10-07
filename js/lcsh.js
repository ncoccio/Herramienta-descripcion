/* =====================================================================
   lcsh.js — búsqueda en los vocabularios de la Library of Congress
   (id.loc.gov: LCSH, nombres LCNAF y géneros LCGFT) y sugerencias de
   equivalencia en español (Wikidata, propiedad P244 = identificador LC).
   Requiere conexión a internet. Las equivalencias en español son solo
   SUGERENCIAS: la forma que se registra es la que usa la Biblioteca Nacional.
   ===================================================================== */
(function (D) {
  'use strict';
  const L = {};
  D.LC = L;

  L.VOCAB = {
    geo: { n: 'Lugares (LCNAF/LCSH)', base: 'https://id.loc.gov/authorities/subjects' },
    subjects: { n: 'Materias (LCSH)', base: 'https://id.loc.gov/authorities/subjects' },
    names: { n: 'Nombres (LCNAF)', base: 'https://id.loc.gov/authorities/names' },
    genreForms: { n: 'Géneros y formas (LCGFT)', base: 'https://id.loc.gov/authorities/genreForms' }
  };
  L.vocabPara = tag => (/^(600|610|611)$/.test(tag) ? 'names' : tag === '655' ? 'genreForms' : tag === '651' ? 'geo' : 'subjects');

  const mayus = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const conTiempo = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('tiempo de espera agotado')), ms))]);
  async function json(url) {
    const r = await conTiempo(fetch(url, { headers: { Accept: 'application/json' } }), 12000);
    if (!r.ok) throw new Error('el servicio respondió ' + r.status);
    return r.json();
  }

  // Búsqueda en id.loc.gov (inglés)
  L.buscar = async function (q, vocab) {
    const v = L.VOCAB[vocab] || L.VOCAB.subjects;
    const d = await json(v.base + '/suggest2?q=' + encodeURIComponent(q) + '&count=20&searchtype=keyword');
    let hits = [];
    if (d && Array.isArray(d.hits)) hits = d.hits.map(h => ({ label: h.aLabel || h.suggestLabel, uri: h.uri, token: h.token || (h.uri || '').split('/').pop(), variante: h.vLabel || '' }));
    else if (Array.isArray(d) && Array.isArray(d[1])) hits = d[1].map((l, i) => ({ label: l, uri: (d[3] || [])[i], token: ((d[3] || [])[i] || '').split('/').pop() }));
    return hits.filter(h => h.label);
  };
  async function buscarModo(q, vocab, modo, extra) {
    const v = L.VOCAB[vocab] || L.VOCAB.subjects;
    const d = await json(v.base + '/suggest2?q=' + encodeURIComponent(q) + '&count=20&searchtype=' + modo + (extra || ''));
    return ((d && d.hits) || []).map(h => ({ label: h.aLabel || h.suggestLabel, uri: h.uri, token: h.token || (h.uri || '').split('/').pop(), tipos: (h.more && h.more.rdftypes) || [] })).filter(h => h.label);
  }
  const sinTilde = t => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  // Búsqueda tolerante: combina palabra clave y «comienza por», reconoce lugares (LCNAF geográfico)
  // y arma combinaciones «Término--Lugar» cuando LCSH no tiene la cadena ya establecida.
  L.buscarAmplio = async function (q, vocab) {
    if (vocab === 'geo') {
      // lugares: jurisdicciones en LCNAF (Chile, Santiago (Chile)) y lugares/subdivisiones en LCSH
      const [g, t] = await Promise.all([buscarModo(q, 'names', 'leftanchored', '&rdftype=Geographic'), buscarModo(q, 'subjects', 'leftanchored').catch(() => [])]);
      const out = [];
      g.concat(t).forEach(h => { h.token = h.token.replace(/-781$/, ''); h.uri = (h.uri || '').replace(/-781$/, ''); if (!out.some(x => x.label === h.label)) out.push(h); });
      return out;
    }
    const vistos = new Set(), out = [];
    let fallos = 0;
    const add = (arr, origen) => arr.forEach(h => { const k = h.label; if (!vistos.has(k)) { vistos.add(k); out.push(Object.assign({ origen }, h)); } });
    const palabras = q.split(/\s+/).filter(w => w.length > 1);
    const [kw, la] = await Promise.all([buscarModo(q, vocab, 'keyword').catch(e => { fallos++; return []; }), buscarModo(q, vocab, 'leftanchored').catch(e => { fallos++; return []; })]);
    if (fallos === 2) throw new Error('no se pudo conectar con id.loc.gov');
    let combos = [];
    if (vocab === 'subjects' && palabras.length > 1) {
      // ¿alguna palabra es un lugar?
      const geos = [];
      for (const w of palabras) {
        try {
          const g = await buscarModo(w, 'names', 'leftanchored', '&rdftype=Geographic');
          const hit = g.find(h => sinTilde(h.label.replace(/\s*\(.*\)$/, '')) === sinTilde(w));
          if (hit) geos.push({ w, label: hit.label, token: hit.token.replace(/-781$/, ''), uri: hit.uri.replace(/-781$/, '') });
        } catch (e) { }
      }
      if (geos.length) {
        const resto = palabras.filter(w => !geos.some(g => g.w === w)).join(' ');
        if (resto) {
          const [t1, t2] = await Promise.all([buscarModo(resto, vocab, 'leftanchored').catch(() => []), buscarModo(resto, vocab, 'keyword').catch(() => [])]);
          const temas = [];
          t1.concat(t2).forEach(h => { if (!temas.some(x => x.label === h.label) && !/--/.test(h.label)) temas.push(h); });
          combos = temas.slice(0, 6).flatMap(t => geos.map(g => ({ label: t.label + '--' + g.label, uri: t.uri, token: t.token, geo: g, combinado: true })));
          add(combos, 'combinación');
          add(t1.concat(t2), 'término');
        }
      }
    }
    add(kw, 'palabra clave');
    add(la, 'comienza por');
    if (!out.length && palabras.length > 1) for (const w of palabras) add(await buscarModo(w, vocab, 'leftanchored').catch(() => []), 'palabra «' + w + '»');
    return out;
  };
  L.urlBusqueda = (q, vocab) => 'https://id.loc.gov/search/?q=' + encodeURIComponent(q) + '&q=cs:' + encodeURIComponent((L.VOCAB[vocab] || L.VOCAB.subjects).base.replace('https://', 'http://'));

  // Equivalencias en español desde Wikidata, por identificador LC (P244)
  L.espanol = async function (tokens) {
    tokens = tokens.filter(t => /^[a-z]{1,3}\d+$/i.test(t));
    if (!tokens.length) return {};
    const q = 'SELECT ?lc ?es WHERE { VALUES ?lc { ' + tokens.map(t => '"' + t + '"').join(' ') + ' } ?item wdt:P244 ?lc . ?item rdfs:label ?es . FILTER(LANG(?es) = "es") }';
    const d = await json('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q));
    const out = {};
    ((d.results || {}).bindings || []).forEach(b => { out[b.lc.value] = mayus(b.es.value); });
    return out;
  };
  // Búsqueda en español: términos de Wikidata que tienen identificador LC
  L.buscarEspanol = async function (q) {
    const s = await json('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=es&uselang=es&type=item&limit=20&search=' + encodeURIComponent(q));
    const ids = (s.search || []).map(x => x.id);
    if (!ids.length) return [];
    const e = await json('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=labels|claims&languages=es|en&ids=' + ids.join('|'));
    const out = [];
    ids.forEach(id => {
      const it = (e.entities || {})[id]; if (!it || !it.claims || !it.claims.P244) return;
      const tok = it.claims.P244[0].mainsnak.datavalue.value;
      const es = mayus((it.labels.es || {}).value || ''), en = (it.labels.en || {}).value || '';
      const vocab = /^sh/.test(tok) ? 'subjects' : /^gf/.test(tok) ? 'genreForms' : 'names';
      out.push({ label: en, es, token: tok, uri: L.VOCAB[vocab].base + '/' + tok, vocab, aproximado: true });
    });
    // reemplaza la etiqueta de Wikidata por el encabezamiento autorizado de la LC
    await Promise.all(out.slice(0, 12).map(async h => { const l = await L.etiquetaLC(h.token, h.vocab).catch(() => ''); if (l) { h.label = l; h.aproximado = false; } }));
    return out;
  };
  // Encabezamiento autorizado de un identificador LC (sh…, n…, gf…)
  L.etiquetaLC = async function (token, vocab) {
    const j = await json(L.VOCAB[vocab].base + '/' + token + '.json');
    const node = (Array.isArray(j) ? j : []).find(n => (n['@id'] || '').endsWith('/' + token));
    const v = node && node['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'];
    return v ? (Array.isArray(v) ? (v[0]['@value'] || v[0]) : v) : '';
  };
  // Búsqueda en español tolerante: si la frase completa no aparece, busca cada palabra
  // y combina un término temático con un lugar («fotografía chile» → Photography--Chile)
  L.buscarEspanolAmplio = async function (q, vocab) {
    // en campos de materia se descartan nombres (películas, personas) salvo los lugares
    const util = hs => vocab === 'names' ? hs : hs.filter(h => h.vocab !== 'names' || (h.es && sinTilde(h.es) === sinTilde(q)));
    let res = util(await L.buscarEspanol(q));
    const palabras = q.split(/\s+/).filter(w => w.length > 1);
    if (res.length || palabras.length < 2) return res;
    const porPalabra = await Promise.all(palabras.map(w => L.buscarEspanol(w).catch(() => [])));
    const geos = [], temas = [];
    porPalabra.forEach((hs, i) => {
      const g = hs.find(h => h.vocab === 'names' && sinTilde(h.es) === sinTilde(palabras[i]));
      if (g) geos.push(g); else hs.filter(h => h.vocab === 'subjects').slice(0, 4).forEach(h => temas.push(h));
    });
    res = [];
    if (geos.length && temas.length) temas.forEach(t => geos.forEach(g => res.push({ label: t.label + '--' + g.label, es: t.es, token: t.token, uri: t.uri, vocab: 'subjects', combinado: true, geo: { label: g.label, es: g.es, token: g.token } })));
    porPalabra.forEach((hs, i) => hs.forEach(h => { if ((vocab === 'names' || h.vocab !== 'names' || geos.includes(h)) && !res.some(x => x.label === h.label)) res.push(h); }));
    return res;
  };

  // Subdivisiones frecuentes de LCSH con su forma habitual en español (sugerencias)
  L.SUBDIV = {
    'History': ['x', 'Historia'], 'Biography': ['v', 'Biografía'], 'Fiction': ['v', 'Ficción'], 'Juvenile fiction': ['v', 'Ficción juvenil'], 'Juvenile literature': ['v', 'Literatura juvenil'],
    'Bibliography': ['v', 'Bibliografía'], 'Periodicals': ['v', 'Publicaciones periódicas'], 'Maps': ['v', 'Mapas'], 'Pictorial works': ['v', 'Obras ilustradas'], 'Dictionaries': ['v', 'Diccionarios'],
    'Statistics': ['v', 'Estadísticas'], 'Congresses': ['v', 'Congresos'], 'Poetry': ['v', 'Poesía'], 'Correspondence': ['v', 'Correspondencia'], 'Drama': ['v', 'Teatro'], 'Textbooks': ['v', 'Libros de texto'],
    'Criticism and interpretation': ['x', 'Crítica e interpretación'], 'Social conditions': ['x', 'Condiciones sociales'], 'Economic conditions': ['x', 'Condiciones económicas'], 'Politics and government': ['x', 'Política y gobierno'],
    'Description and travel': ['x', 'Descripción y viajes'], 'Study and teaching': ['x', 'Estudio y enseñanza'], 'Social life and customs': ['x', 'Vida social y costumbres'], 'Antiquities': ['x', 'Antigüedades'],
    'Foreign relations': ['x', 'Relaciones exteriores'], 'Civilization': ['x', 'Civilización'], 'Law and legislation': ['x', 'Legislación'], 'Religion': ['x', 'Religión'], 'Influence': ['x', 'Influencia'],
    'Language': ['x', 'Lengua'], 'Photographs': ['v', 'Fotografías'], 'Portraits': ['v', 'Retratos'], 'Interviews': ['v', 'Entrevistas'], 'Sources': ['v', 'Fuentes'], 'Case studies': ['v', 'Estudio de casos']
  };
  const SIGLO = { '16th century': 'Siglo XVI', '17th century': 'Siglo XVII', '18th century': 'Siglo XVIII', '19th century': 'Siglo XIX', '20th century': 'Siglo XX', '21st century': 'Siglo XXI' };
  // Divide «Chile--History--1973-1988» en partes con su código de subcampo sugerido
  L.partes = function (label) {
    const ps = String(label || '').split(/\s*--\s*/).filter(Boolean);
    return ps.map((p, i) => {
      if (i === 0) return { c: 'a', en: p, es: '' };
      if (SIGLO[p]) return { c: 'y', en: p, es: SIGLO[p] };
      if (/^\d{3,4}(-\d{0,4})?$|^(ca\. )?\d{3,4}/.test(p)) return { c: 'y', en: p, es: p };
      const s = L.SUBDIV[p];
      if (s) return { c: s[0], en: p, es: s[1] };
      return { c: 'x', en: p, es: '' };
    });
  };
})(window.DD2);
