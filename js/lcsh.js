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
    subjects: { n: 'Materias (LCSH)', base: 'https://id.loc.gov/authorities/subjects' },
    names: { n: 'Nombres (LCNAF)', base: 'https://id.loc.gov/authorities/names' },
    genreForms: { n: 'Géneros y formas (LCGFT)', base: 'https://id.loc.gov/authorities/genreForms' }
  };
  L.vocabPara = tag => (/^(600|610|611)$/.test(tag) ? 'names' : tag === '655' ? 'genreForms' : 'subjects');

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
    return out;
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
