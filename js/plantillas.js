/* =====================================================================
   plantillas.js — plantillas por tipo de material (bibliográficas y de
   autoridad) y registros de ejemplo. Cada plantilla precarga el Líder,
   las posiciones del 008, el 007 y los campos habituales con subcampos
   vacíos. Puedes agregar o modificar plantillas aquí.
   Notación de campos:  "245 10 $a $b $c"  ·  "336 ## $a texto $b txt $2 rdacontent"
   ===================================================================== */
(function (D) {
  const M = D.M;
  D.AUT['336'] = D.BIB['336'];
  D.AUT['381'] = D.BIB['381'];
  D.AUT['388'] = D.BIB['388'];

  const CTX = 'texto|txt', SM = 'sin mediación|n';
  const C = (a, b) => '336 ## $a ' + a + ' $b ' + b + ' $2 rdacontent';
  const MD = (a, b) => '337 ## $a ' + a + ' $b ' + b + ' $2 rdamedia';
  const CR = (a, b) => '338 ## $a ' + a + ' $b ' + b + ' $2 rdacarrier';
  const TXT = C('texto', 'txt'), NOMED = MD('sin mediación', 'n'), VOL = CR('volumen', 'nc'), INF = MD('computadora', 'c'), ONL = CR('recurso en línea', 'cr');
  // 905 y 949: campos locales obligatorios en la planilla UTEM
  const ITEM = (y) => ['905 ## $a interna', '949 ## $a $b', '942 ## $c ' + y, '952 ## $a {BIB} $b {BIB} $o $p $y ' + y];

  /* ---------------------- PLANTILLAS BIBLIOGRÁFICAS ---------------------- */
  // f008: posiciones de material (18-34) como { pos: 'valor' }
  // ---- Plantillas de la planilla UTEM: los campos y valores de la hoja «Campos a completar»
  //      y de sus hojas de ejemplo («Ejemplo Libro electrónico» y «Ejemplo Fotografía»).
  const AG_UTEM = 'clsabn';
  const COMUN_UTEM = (aut) => ['040 ## $a ' + AG_UTEM + ' $b spa $c ' + AG_UTEM + ' $e rda', '043 ## $a cl-----', '082 04 $a $b $2', '100 1# $a $e ' + aut];
  const MATERIAS_UTEM = ['600 17 $a $d $x', '650 #7 $a $x $z', '651 #7 $a $x'];
  const LOCALES_UTEM = ['905 ## $a interna', '949 ## $a $b'];
  D.PLANTILLAS = [
    { id: 'utem-ebook', planilla: true, fmt: 'BK', g: 'Planilla UTEM', n: 'Libro electrónico', d: 'Todos los campos de la hoja «Campos a completar» con los valores de «Ejemplo Libro electrónico»: FMT Libros (BK), Líder nmm, 006 m, 007 cr, 506, 516 y 655 Libros electrónicos.',
      ldrFull: '     nmm a22      i 4500', f006: 'm        d        ', f007: 'cr nu ---uunuu', f008full: '------s        cl      o  d z      spa d',
      fields: ['015 ## $a $2 bcl', '020 ## $a', '041 ## $a spa $b', ...COMUN_UTEM('autor'), '245 10 $a $h [recurso electrónico] $b $c', '246 30 $a', '250 ## $a', '264 #1 $a $b $c', '264 #3 $a $b $c', '264 #4 $c ©',
        '300 ## $a archivo digital ( páginas) : $b formato PDF.', TXT, INF, ONL, '490 1# $a $v $x', '546 ## $a', '500 ## $a', '506 ## $a Documento disponible solamente en versión digital.', '516 ## $a Texto en PDF.', '520 3# $a $b', '541 ## $c $a $d', '586 ## $a', '504 ## $a', '505 0# $a $g $r $t',
        ...MATERIAS_UTEM, '655 #7 $a Libros electrónicos', '700 1# $a $e', '710 2# $a $e $4', '830 #0 $a', ...LOCALES_UTEM] },
    { id: 'utem-foto', planilla: true, g: 'Planilla UTEM', n: 'Fotografía digitalizada', d: 'Campos de «Campos a completar» con los valores de «Ejemplo Fotografía»: FMT Materiales visuales (VM), Líder nkc, 006 k, 007 k, 245 $h [fotografía], 541 de donación.',
      ldrFull: '     nkc a22      a 4500', f001: 'BNC0100000000000000XXXXXXX', f006: 'knnn        s   iu', f007: 'kz ad ', f008full: '------s        cl nnn            zzspa  ',
      fields: [...COMUN_UTEM('fotógrafo'), '245 10 $a [ ] $h [fotografía] $c', '264 #1 $c', '300 ## $a 1 fotografía : $b $c', C('imagen fija', 'sti'), INF, ONL, '500 ## $a', '506 ## $a', '520 ## $a', '541 1# $a $c donación ; $d', '546 ## $a',
        ...MATERIAS_UTEM, '655 #7 $a', '700 1# $a $e', '710 2# $a $e', ...LOCALES_UTEM] },
    { id: 'libro', g: 'Textual', n: 'Libro impreso', d: 'Monografía impresa: novela, ensayo, manual, libro académico.', ldr: 'am', f008: { 18: '    ', 22: ' ', 23: ' ', 24: '    ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '0', 34: ' ' },
      fields: ['020 ## $a', '040', '082 04 $a $2 23', '100 1# $a $d $e autor.', '245 10 $a $b $c', '250 ## $a', '264 #1 $a $b $c', '300 ## $a $b $c', TXT, NOMED, VOL, '490 0# $a $v', '500 ## $a', '504 ## $a', '520 ## $a', '650 #7 $a $2 lemb', '655 #7 $a $2 lcgft', '700 1# $a $e', ...ITEM('LIB')] },
    { id: 'traduccion', g: 'Textual', n: 'Libro traducido', d: 'Traducción: incluye 041 con lengua original y 240 con el título preferido de la obra.', ldr: 'am', f008: { 18: '    ', 22: ' ', 23: ' ', 24: '    ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '1', 34: ' ' },
      fields: ['020 ## $a', '040', '041 1# $a spa $h', '100 1# $a $d $e autor.', '240 10 $a $l Español', '245 10 $a $b $c', '264 #1 $a $b $c', '300 ## $a $b $c', TXT, NOMED, VOL, '500 ## $a', '650 #7 $a $2 lemb', '655 #7 $a $2 lcgft', '700 1# $a $e traductor.', ...ITEM('LIB')] },
    { id: 'ebook', g: 'Textual', n: 'Libro electrónico / PDF en línea', d: 'Práctica MARC 21 general: libro (BK, Líder nam) con 006 m de recurso electrónico, 007 cr y 856.', ldr: 'am', f006: 'm     o  d        ', f007: 'cr |||||||||||', f008: { 18: '    ', 22: ' ', 23: 'o', 24: '    ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '0', 34: ' ' },
      fields: ['020 ## $a', '040', '100 1# $a $d $e autor.', '245 10 $a $b $c', '264 #1 $a $b $c', '300 ## $a 1 recurso en línea ( páginas)', TXT, INF, ONL, '347 ## $a archivo de texto $b PDF $2 rda', '506 0# $a Acceso abierto.', '520 ## $a', '588 0# $a Descripción basada en la versión en línea; título de la portada del PDF (consultado el ).', '650 #7 $a $2 lemb', '776 08 $i Versión impresa: $a $t $z', '856 40 $u $y Texto completo', ...ITEM('ELEC')] },
    { id: 'tesis', g: 'Textual', n: 'Tesis o memoria', d: 'Trabajo de grado o título. Incluye la nota de tesis 502 y la institución que otorga el grado.', ldr: 'am', f008: { 18: '    ', 22: ' ', 23: ' ', 24: 'm   ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '0', 34: ' ' },
      fields: ['040', '100 1# $a $e autor.', '245 10 $a $b $c', '264 #0 $a $b $c', '300 ## $a $b $c', TXT, NOMED, VOL, '502 ## $b $c $d', '504 ## $a', '520 3# $a', '650 #7 $a $2 lemb', '655 #7 $a Tesis académicas $2 lcgft', '700 1# $a $e director de tesis.', '710 2# $a $e institución que otorga el grado.', ...ITEM('TESIS')] },
    { id: 'revista', g: 'Textual', n: 'Publicación seriada (revista)', d: 'Revista, boletín o periódico con numeración sucesiva. Se describe desde el primer número disponible.', ldr: 'as', f008: { 18: 'f', 19: 'r', 20: ' ', 21: 'p', 22: ' ', 23: ' ', 24: ' ', 25: '   ', 28: ' ', 29: '0', 33: 'b', 34: '0' }, f008date: 'c', f008d2: '9999',
      fields: ['022 ## $a', '040', '245 00 $a $b', '246 13 $a', '264 #1 $a $b $c', '300 ## $a volúmenes : $b ilustraciones ; $c 28 cm', '310 ## $a Semestral', '362 1# $a', TXT, NOMED, VOL, '588 ## $a Descripción basada en: ', '650 #7 $a $v Publicaciones periódicas $2 lemb', '710 2# $a $e organismo emisor.', ...ITEM('REV')] },
    { id: 'articulo', g: 'Textual', n: 'Artículo de revista (analítica)', d: 'Parte componente: artículo o capítulo. Se vincula al documento fuente con el 773 (relación parte-todo).', ldr: 'ab', f008: { 18: ' ', 19: ' ', 20: ' ', 21: 'p', 22: ' ', 23: ' ', 24: ' ', 25: '   ', 28: ' ', 29: '0', 33: 'b', 34: '0' },
      fields: ['040', '100 1# $a $e autor.', '245 10 $a $b $c', '264 #1 $a $b $c', '300 ## $a páginas', TXT, NOMED, VOL, '504 ## $a', '520 3# $a', '650 #7 $a $2 lemb', '773 0# $t $g $x', ...ITEM('REV')] },
    { id: 'manuscrito', g: 'Textual', n: 'Manuscrito / documento de archivo', d: 'Carta, diario, documento único no publicado. Título asignado entre corchetes.', ldr: 'tm', f008: { 18: '    ', 22: ' ', 23: ' ', 24: '    ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '0', 34: ' ' },
      fields: ['040', '100 1# $a $e autor.', '245 10 $a [ ] $f', '264 #0 $a $c', '300 ## $a 1 hoja $c cm', TXT, NOMED, CR('hoja', 'nb'), '500 ## $a Título asignado por el catalogador.', '506 1# $a Consulta solo en sala.', '520 ## $a', '546 ## $a Manuscrito en español.', '600 14 $a', '650 #7 $a $2 lemb', ...ITEM('MAN')] },

    { id: 'dvd', g: 'Audiovisual', n: 'Película / documental en DVD', d: 'Imagen en movimiento en videodisco. Créditos (508), elenco (511), director y productora en 7XX.', ldr: 'gm', f007: 'vd cvaizs', f008: { 18: '   ', 21: ' ', 22: 'g', 23: '     ', 28: ' ', 29: ' ', 30: '   ', 33: 'v', 34: 'l' },
      fields: ['028 42 $a $b', '040', '041 0# $a spa $j eng', '245 00 $a $b $c', '246 3# $a', '257 ## $a Chile $2 naf', '264 #1 $a $b $c', '264 #4 $c ©', '300 ## $a 1 videodisco ( min) : $b sonido, color ; $c 12 cm', C('imagen en movimiento bidimensional', 'tdi'), MD('video', 'v'), CR('videodisco', 'vd'), '344 ## $a digital $b óptico $g estéreo $2 rda', '346 ## $b NTSC $2 rda', '347 ## $a archivo de video $b DVD video $e región 4 $2 rda', '380 ## $a Película', '538 ## $a DVD, región 4.', '546 ## $a En español con subtítulos opcionales en inglés.', '508 ## $a', '511 1# $a', '520 ## $a', '521 8# $a', '650 #7 $a $2 lemb', '655 #7 $a Películas documentales $2 lcgft', '700 1# $a $e director de cine.', '710 2# $a $e compañía productora.', ...ITEM('DVD')] },
    { id: 'videoweb', g: 'Audiovisual', n: 'Video en línea (streaming)', d: 'Video publicado en una plataforma (YouTube, Vimeo, repositorio institucional).', ldr: 'gm', f007: 'cr |||||||||||', f008: { 18: '   ', 21: ' ', 22: 'g', 23: '     ', 28: ' ', 29: 'o', 30: '   ', 33: 'v', 34: 'l' },
      fields: ['040', '245 00 $a $b $c', '264 #1 $a $b $c', '300 ## $a 1 recurso en línea (1 archivo de video ( min)) : $b sonido, color', C('imagen en movimiento bidimensional', 'tdi'), INF, ONL, '347 ## $a archivo de video $b MP4 $2 rda', '508 ## $a', '511 0# $a', '520 ## $a', '538 ## $a Modo de acceso: World Wide Web.', '588 0# $a Descripción basada en la versión en línea (consultado el ).', '650 #7 $a $2 lemb', '655 #7 $a $2 lcgft', '700 1# $a $e', '710 2# $a $e', '856 40 $u $y Ver video', ...ITEM('ELEC')] },
    { id: 'cd', g: 'Sonoro', n: 'Grabación sonora musical (CD)', d: 'Disco compacto de música. Contenido (505), intérpretes (511) y fecha/lugar de grabación (518).', ldr: 'jm', f007: 'sd fsngnnmmned', f008: { 18: 'pp', 20: 'n', 21: ' ', 22: ' ', 23: ' ', 24: '      ', 30: '  ', 32: ' ', 33: 'n', 34: ' ' },
      fields: ['024 1# $a', '028 02 $a $b', '040', '100 1# $a $e cantante.', '245 10 $a $c', '264 #1 $a $b $c', '264 #4 $c ℗', '300 ## $a 1 disco de audio ( min) ; $c 12 cm', C('música interpretada', 'prm'), MD('audio', 's'), CR('disco de audio', 'sd'), '344 ## $a digital $b óptico $g estéreo $2 rda', '347 ## $a archivo de audio $b CD audio $2 rda', '505 0# $a', '511 0# $a', '518 ## $a', '650 #7 $a $2 lemb', '655 #7 $a $2 lcgft', '700 1# $a $e compositor.', ...ITEM('CD')] },
    { id: 'audio', g: 'Sonoro', n: 'Podcast / audiolibro / entrevista', d: 'Grabación sonora no musical: palabra hablada, en línea o en disco.', ldr: 'im', f007: 'cr |||||||||||', f008: { 18: 'nn', 20: 'n', 21: 'n', 22: ' ', 23: 'o', 24: '      ', 30: 't ', 32: ' ', 33: 'n', 34: ' ' },
      fields: ['040', '245 00 $a $b $c', '264 #1 $a $b $c', '300 ## $a 1 recurso en línea (1 archivo de audio ( min))', C('palabra hablada', 'spw'), INF, ONL, '347 ## $a archivo de audio $b MP3 $2 rda', '490 0# $a $v', '511 0# $a Presentación: ', '518 ## $a', '520 ## $a', '546 ## $a En español.', '650 #7 $a $2 lemb', '655 #7 $a Podcasts $2 lcgft', '700 1# $a $e entrevistado.', '856 40 $u $y Escuchar', ...ITEM('AUDIO')] },
    { id: 'partitura', g: 'Sonoro', n: 'Partitura (música notada)', d: 'Música impresa: medio de interpretación (382), tonalidad (384), número de plancha (028).', ldr: 'cm', f007: 'qu', f008: { 18: 'sg', 20: 'a', 21: ' ', 22: ' ', 23: ' ', 24: '      ', 30: '  ', 32: ' ', 33: ' ', 34: ' ' },
      fields: ['024 2# $a', '028 32 $a $b', '040', '100 1# $a $d $e compositor.', '240 10 $a', '245 10 $a $b $c', '264 #1 $a $b $c', '300 ## $a 1 partitura ( páginas) ; $c 31 cm', C('música notada', 'ntm'), NOMED, VOL, '348 ## $a partitura $2 rda', '382 01 $a $n', '383 ## $b', '384 ## $a', '650 #7 $a $2 lemb', '655 #7 $a Partituras $2 lcgft', ...ITEM('PART')] },

    { id: 'mapa', g: 'Imagen y objeto', n: 'Mapa', d: 'Material cartográfico: escala (255 y 034), proyección y coordenadas.', ldr: 'em', f007: 'aj canzn', f008: { 18: '    ', 22: '  ', 24: ' ', 25: 'a', 26: '  ', 28: ' ', 29: ' ', 30: ' ', 31: '0', 32: ' ', 33: '  ' },
      fields: ['034 1# $a a $b', '040', '110 2# $a $e cartógrafo.', '245 10 $a $b $c', '255 ## $a Escala 1: $b', '264 #1 $a $b $c', '300 ## $a 1 mapa : $b color ; $c x cm', C('imagen cartográfica', 'cri'), NOMED, CR('hoja', 'nb'), '500 ## $a', '651 #7 $a $v Mapas $2 lemb', '655 #7 $a Mapas $2 lcgft', ...ITEM('MAPA')] },
    { id: 'imagen', g: 'Imagen y objeto', n: 'Fotografía / afiche / imagen fija', d: 'Imagen bidimensional no proyectable: fotografía, afiche, postal, grabado.', ldr: 'km', f007: 'kh bo|', f008: { 18: 'nnn', 21: ' ', 22: ' ', 23: '     ', 28: ' ', 29: ' ', 30: '   ', 33: 'i', 34: 'n' },
      fields: ['040', '100 1# $a $e fotógrafo.', '245 10 $a [ ] $h [fotografía] / $c', '264 #0 $a $c', '300 ## $a 1 fotografía : $b blanco y negro ; $c 18 x 24 cm', C('imagen fija', 'sti'), NOMED, CR('hoja', 'nb'), '340 ## $a papel fotográfico', '500 ## $a Título asignado por el catalogador.', '520 ## $a', '650 #7 $a $2 lemb', '651 #7 $a $2 lemb', '655 #7 $a Fotografías $2 lcgft', ...ITEM('FOTO')] },
    { id: 'objeto', g: 'Imagen y objeto', n: 'Objeto tridimensional', d: 'Realia, maqueta, juego de mesa, pieza patrimonial.', ldr: 'rm', f008: { 18: 'nnn', 21: ' ', 22: ' ', 23: '     ', 28: ' ', 29: ' ', 30: '   ', 33: 'r', 34: 'n' },
      fields: ['040', '245 00 $a [ ]', '264 #0 $a $c', '300 ## $a 1 objeto : $b $c cm', C('forma tridimensional', 'tdf'), NOMED, CR('objeto', 'nr'), '340 ## $a $d', '500 ## $a Título asignado por el catalogador.', '520 ## $a', '650 #7 $a $2 lemb', '655 #7 $a $2 lcgft', ...ITEM('OBJ')] },

    { id: 'web', g: 'Digital', n: 'Sitio web / recurso integrable', d: 'Recurso que se actualiza integrando cambios (sitio web, base de datos). Líder/07 = i.', ldr: 'ai', f007: 'cr |||||||||||', f008: { 18: 'k', 19: 'r', 20: ' ', 21: 'w', 22: ' ', 23: 'o', 24: ' ', 25: '   ', 28: ' ', 29: '0', 33: ' ', 34: '2' }, f008date: 'c', f008d2: '9999',
      fields: ['040', '110 2# $a', '245 10 $a $b', '246 1# $i Título de la barra de navegación: $a', '264 #1 $a $b $c', '300 ## $a 1 recurso en línea', '310 ## $a Actualización continua', TXT, INF, ONL, '506 0# $a Acceso abierto.', '520 ## $a', '538 ## $a Modo de acceso: World Wide Web.', '588 0# $a Descripción basada en la versión consultada el ; título de la página de inicio.', '650 #7 $a $2 lemb', '655 #7 $a Sitios web $2 lcgft', '856 40 $u', ...ITEM('ELEC')] },
    { id: 'software', g: 'Digital', n: 'Software / videojuego', d: 'Archivo de computadora: programa o juego en disco o descarga.', ldr: 'mm', f007: 'co |||||||||||', f008: { 18: '    ', 22: ' ', 23: 'q', 24: '  ', 26: 'g', 27: ' ', 28: ' ', 29: '      ' },
      fields: ['024 3# $a', '040', '245 00 $a $b $c', '250 ## $a', '264 #1 $a $b $c', '300 ## $a 1 disco de computadora ; $c 12 cm', C('programa informático', 'cop'), INF, CR('disco de computadora', 'cd'), '347 ## $a archivo de programa $2 rda', '521 1# $a', '538 ## $a Requisitos del sistema: ', '520 ## $a', '650 #7 $a $2 lemb', '655 #7 $a Videojuegos $2 lcgft', '710 2# $a $e desarrollador.', ...ITEM('SOFT')] },
    { id: 'archivo', g: 'Archivo', n: 'Colección de archivo (materiales mixtos)', d: 'Fondo o colección con documentos, fotografías y otros materiales. Control archivístico (Líder/08 = a).', ldr: 'pc', ldr08: 'a', f008: { 18: '     ', 23: ' ', 24: '           ' }, f008date: 'i',
      fields: ['040', '100 1# $a $e productor del fondo.', '245 10 $a $f', '264 #0 $c', '300 ## $a cajas $f', '336 ## $a texto $b txt $2 rdacontent', '336 ## $a imagen fija $b sti $2 rdacontent', NOMED, CR('hoja', 'nb'), '351 ## $a $b', '506 1# $a', '520 2# $a', '545 0# $a', '555 0# $a', '600 14 $a', '650 #7 $a $2 lemb', ...ITEM('MAN')] },
    { id: 'blanco', g: 'Digital', n: 'Registro en blanco (mínimo)', d: 'Solo el núcleo: Líder, 008, 040, 245, 264, 300 y 336-338. Para construir desde cero.', ldr: 'am', f008: { 18: '    ', 22: ' ', 23: ' ', 24: '    ', 28: ' ', 29: '0', 30: '0', 31: '0', 33: '0', 34: ' ' },
      fields: ['040', '245 00 $a', '264 #1 $a $b $c', '300 ## $a', TXT, NOMED, VOL, '905 ## $a interna', '949 ## $a $b'] }
  ];

  D.PLANTILLAS.forEach(t => { if (t.ldrFull && !t.ldr) t.ldr = t.ldrFull.slice(6, 8); });

  /* ---------------------- PLANTILLAS DE AUTORIDAD ---------------------- */
  // a008: [09,10,11,14,15,16,32,33]
  D.PLANTILLAS_AUT = [
    { id: 'persona', n: 'Persona', d: 'Nombre preferido, variantes, fechas, lugares, ocupación y fuentes (Unidad 2).', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'a' },
      fields: ['040', '046 ## $f $g $2 edtf', '100 1# $a $d', '370 ## $a $b $c', '372 ## $a', '373 ## $a', '374 ## $a', '377 ## $a spa', '378 ## $q', '400 1# $a', '670 ## $a $b', '678 0# $a'] },
    { id: 'familia', n: 'Familia', d: 'Familia, clan o dinastía: tipo, fechas, lugar y miembros prominentes.', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '100 3# $a (Familia : $d : $c )', '370 ## $c', '376 ## $a Familia $b', '400 3# $a', '670 ## $a $b', '678 0# $a'] },
    { id: 'entidad', n: 'Entidad corporativa', d: 'Institución, empresa, organismo: unidades subordinadas, sede, siglas, predecesoras.', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '046 ## $q $2 edtf', '110 2# $a $b', '368 ## $a', '370 ## $e', '410 2# $a', '510 2# $w a $i Predecesora: $a', '670 ## $a $b', '678 1# $a'] },
    { id: 'evento', n: 'Evento / congreso', d: 'Reunión, congreso, exposición: número, fecha y lugar.', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '111 2# $a $n $d $c', '370 ## $f', '411 2# $a', '670 ## $a $b'] },
    { id: 'obra', n: 'Obra', d: 'Punto de acceso autorizado de la obra: creador + título preferido ($t). Forma, fecha y lugar de origen (Unidad 1).', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '046 ## $k $2 edtf', '100 1# $a $d $t', '370 ## $g', '380 ## $a', '388 1# $a', '400 1# $a $d $t', '670 ## $a $b'] },
    { id: 'expresion', n: 'Expresión', d: 'Obra + lengua ($l) u otra característica: una traducción, una versión (Unidad 1).', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '100 1# $a $d $t $l Español', '336 ## $a texto $b txt $2 rdacontent', '377 ## $a spa', '381 ## $a', '500 1# $w r $i Traductor: $a', '670 ## $a $b'] },
    { id: 'obra-anonima', n: 'Obra anónima / título', d: 'Obra sin creador (130): textos sagrados, anónimos, películas.', a008: { 11: 'n', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040', '130 #0 $a', '380 ## $a', '430 #0 $a', '670 ## $a $b'] },
    { id: 'materia', n: 'Materia (término temático)', d: 'Encabezamiento temático con términos genéricos (TG), específicos (TE) y variantes (UP).', a008: { 11: 'z', 14: 'b', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040 ## $a {AG} $b spa $c {AG} $e rda $f local', '150 ## $a', '450 ## $a', '550 ## $w g $a', '550 ## $w h $a', '670 ## $a $b', '680 ## $i'] },
    { id: 'lugar', n: 'Lugar geográfico', d: 'Nombre geográfico: países, regiones, ciudades, accidentes geográficos.', a008: { 11: 'z', 14: 'a', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040 ## $a {AG} $b spa $c {AG} $e rda $f local', '151 ## $a', '451 ## $a', '551 ## $w g $a', '670 ## $a $b'] },
    { id: 'genero', n: 'Género / forma', d: 'Lo que la obra ES: novela, documental, mapa, fotografía.', a008: { 11: 'z', 14: 'b', 15: 'a', 16: 'b', 32: 'n' },
      fields: ['040 ## $a {AG} $b spa $c {AG} $e rda $f local', '155 ## $a', '455 ## $a', '555 ## $w g $a', '670 ## $a $b'] }
  ];

  /* ---------------------- 008 de autoridades ---------------------- */
  D.A008_POS = [
    { p: 0, l: 6, n: 'Fecha de creación (aammdd)', auto: 'date' },
    { p: 6, l: 1, n: 'Subdivisión geográfica directa o indirecta', o: { ' ': 'No subdividido geográficamente', d: 'Subdividido — directa', i: 'Subdividido — indirecta', n: 'No aplica', '|': 'No se codifica' } },
    { p: 7, l: 1, n: 'Esquema de romanización', o: { a: 'Norma internacional', b: 'Norma nacional', c: 'Norma de asociación nacional de bibliotecas', d: 'Norma de biblioteca o agencia bibliográfica nacional', e: 'Norma local', f: 'Norma de origen desconocido', g: 'Romanización convencional o forma convencional del nombre', n: 'No aplica', '|': 'No se codifica' } },
    { p: 8, l: 1, n: 'Lengua del catálogo', o: { ' ': 'Sin información', b: 'Inglés y francés', e: 'Solo inglés', f: 'Solo francés', '|': 'No se codifica' } },
    { p: 9, l: 1, n: 'Tipo de registro', key: true, o: { a: 'Encabezamiento establecido', b: 'Referencia no trazada', c: 'Referencia trazada', d: 'Subdivisión', e: 'Etiqueta de nodo', f: 'Encabezamiento y subdivisión establecidos', g: 'Referencia y subdivisión', '|': 'No se codifica' } },
    { p: 10, l: 1, n: 'Reglas de catalogación descriptiva', o: { a: 'Reglas anteriores', b: 'AACR 1', c: 'AACR 2', d: 'Encabezamiento compatible con AACR 2', z: 'Otras (RDA: ver 040 $e)', n: 'No aplica', '|': 'No se codifica' } },
    { p: 11, l: 1, n: 'Sistema de encabezamientos de materia / tesauro', o: { a: 'LCSH', b: 'LC para niños y jóvenes', c: 'MeSH', d: 'Archivo de autoridades de la NAL', k: 'Canadian Subject Headings', n: 'No aplica', r: 'Art and Architecture Thesaurus', s: 'Sears', v: 'Répertoire de vedettes-matière', z: 'Otro (ver 040 $f)', '|': 'No se codifica' } },
    { p: 12, l: 1, n: 'Tipo de serie', o: { n: 'No aplica', a: 'Serie monográfica', b: 'Ítem multiparte', c: 'Frase similar a serie', z: 'Otro', '|': 'No se codifica' } },
    { p: 13, l: 1, n: 'Serie numerada o no numerada', o: { n: 'No aplica', a: 'Numerada', b: 'No numerada', c: 'Varía', '|': 'No se codifica' } },
    { p: 14, l: 1, n: 'Uso como asiento principal o secundario', key: true, o: { a: 'Apropiado', b: 'No apropiado', '|': 'No se codifica' } },
    { p: 15, l: 1, n: 'Uso como materia', key: true, o: { a: 'Apropiado', b: 'No apropiado', '|': 'No se codifica' } },
    { p: 16, l: 1, n: 'Uso como serie', key: true, o: { a: 'Apropiado', b: 'No apropiado', '|': 'No se codifica' } },
    { p: 17, l: 1, n: 'Tipo de subdivisión', o: { n: 'No aplica', a: 'Temática', b: 'De forma', c: 'Cronológica', d: 'Geográfica', e: 'De lengua', '|': 'No se codifica' } },
    { p: 18, l: 10, n: 'Indefinidas', fixed: '          ' },
    { p: 28, l: 1, n: 'Tipo de organismo gubernamental', o: { ' ': 'No es organismo gubernamental', a: 'Componente autónomo o semiautónomo', c: 'Multilocal', f: 'Federal / nacional', i: 'Internacional intergubernamental', l: 'Local', m: 'Multiestatal', o: 'Tipo de organismo indeterminado', s: 'Estatal, provincial, territorial, dependiente', u: 'Se desconoce si es organismo gubernamental', z: 'Otro', '|': 'No se codifica' } },
    { p: 29, l: 1, n: 'Evaluación de referencias', o: { a: 'Referencias trazadas consistentes', b: 'No consistentes', n: 'No aplica', '|': 'No se codifica' } },
    { p: 30, l: 1, n: 'Indefinida', fixed: ' ' },
    { p: 31, l: 1, n: 'Actualización del registro en proceso', o: { a: 'Puede usarse', b: 'En proceso', '|': 'No se codifica' } },
    { p: 32, l: 1, n: 'Nombre personal diferenciado', key: true, o: { a: 'Nombre diferenciado', b: 'No diferenciado', n: 'No aplica', '|': 'No se codifica' } },
    { p: 33, l: 1, n: 'Nivel de establecimiento', key: true, o: { a: 'Completamente establecido', b: 'Memorándum', c: 'Provisional', d: 'Preliminar', n: 'No aplica', '|': 'No se codifica' } },
    { p: 34, l: 4, n: 'Indefinidas', fixed: '    ' },
    { p: 38, l: 1, n: 'Registro modificado', o: { ' ': 'No modificado', s: 'Abreviado', x: 'Faltan caracteres', '|': 'No se codifica' } },
    { p: 39, l: 1, n: 'Fuente de la catalogación', o: { ' ': 'Agencia nacional', c: 'Programa cooperativo', d: 'Otra', u: 'Desconocida', '|': 'No se codifica' } }
  ];

  /* ---------------------- construcción de registros ---------------------- */
  function parseSpec(spec, ag, bib) {
    spec = spec.replace(/\{AG\}/g, ag).replace(/\{BIB\}/g, bib);
    if (spec === '040') spec = '040 ## $a ' + ag + ' $b spa $c ' + ag + ' $e rda';
    const tag = spec.slice(0, 3);
    const ind = spec.slice(4, 6).replace(/#/g, ' ');
    const rest = spec.slice(7);
    const subs = [];
    rest.split(/\s?\$(?=[a-z0-9])/).forEach((p, i) => {
      if (!p.trim() && i === 0) return;
      const c = p[0]; const v = p.slice(1).trim();
      if (c) subs.push({ c, v });
    });
    return { tag, ind1: ind[0] || ' ', ind2: ind[1] || ' ', subs };
  }
  D.parseSpec = parseSpec;

  D.build008 = function (tpl, perfil) {
    let s = M.today6() + (tpl.f008date || 's') + '    ' + M.pad(tpl.f008d2 || '', 4) + 'cl ' + ' '.repeat(17) + 'spa' + ' ' + 'd';
    s = M.pad(s, 40);
    const y = String(new Date().getFullYear());
    s = M.setPos(s, 7, tpl.f008date === 'c' ? y : '    ', 4);
    Object.keys(tpl.f008 || {}).forEach(p => { const v = tpl.f008[p]; s = M.setPos(s, +p, v, v.length); });
    return s;
  };
  D.buildA008 = function (tpl) {
    let s = M.today6() + 'n|' + ' ' + 'azn' + 'nn' + 'aab' + 'n' + ' '.repeat(10) + ' ' + 'a' + ' ' + 'a' + 'a' + 'a' + '    ' + ' ' + 'd';
    s = M.pad(s, 40);
    Object.keys(tpl.a008 || {}).forEach(p => { s = M.setPos(s, +p, tpl.a008[p], 1); });
    return s;
  };

  D.newBib = function (tplId, perfil) {
    const tpl = D.PLANTILLAS.find(t => t.id === tplId) || D.PLANTILLAS[0];
    const ag = (perfil && perfil.agencia) || 'clsabn';
    const bib = (perfil && perfil.biblioteca) || 'BIBDD2';
    const rec = { kind: 'bib', tpl: tpl.id, ldr: tpl.ldrFull || ('00000n' + tpl.ldr + (tpl.ldr08 || ' ') + 'a2200000 i 4500'), fields: [] };
    // Las plantillas de la planilla UTEM copian tal cual el Líder, 001, 006, 007 y 008 de las hojas de ejemplo
    if (tpl.f001) rec.fields.push({ tag: '001', value: tpl.f001 });
    if (!tpl.planilla) rec.fields.push({ tag: '003', value: ag });
    if (tpl.f006) rec.fields.push({ tag: '006', value: tpl.f006 });
    if (tpl.f007) rec.fields.push({ tag: '007', value: tpl.f007 });
    rec.fields.push({ tag: '008', value: tpl.f008full || D.build008(tpl, perfil) });
    tpl.fields.forEach(sp => rec.fields.push(parseSpec(sp, ag, bib)));
    M.sort(rec);
    return rec;
  };
  D.newAut = function (tplId, perfil) {
    const tpl = D.PLANTILLAS_AUT.find(t => t.id === tplId) || D.PLANTILLAS_AUT[0];
    const ag = (perfil && perfil.agencia) || 'clsabn';
    const rec = { kind: 'aut', tpl: tpl.id, ldr: '00000nz  a2200000n  4500', fields: [] };
    rec.fields.push({ tag: '003', value: ag });
    rec.fields.push({ tag: '008', value: D.buildA008(tpl) });
    tpl.fields.forEach(sp => rec.fields.push(parseSpec(sp, ag, '')));
    M.sort(rec);
    return rec;
  };

  /* ---------------------- REGISTROS DE EJEMPLO ---------------------- */
  // Datos tomados de los ejercicios del curso (Guía «Codificar el esqueleto», Lab 7).
  // Los registros marcados como ficticios tienen fines exclusivamente didácticos.
  const E8 = (tid, y, c, l, o) => { const t = D.PLANTILLAS.find(x => x.id === tid); let s = D.build008(t); s = M.setPos(s, 7, y, 4); s = M.setPos(s, 15, c, 3); s = M.setPos(s, 35, l, 3); Object.keys(o || {}).forEach(p => { s = M.setPos(s, +p, o[p], o[p].length); }); return '008 ' + s; };
  const A8 = tid => '008 ' + D.buildA008(D.PLANTILLAS_AUT.find(x => x.id === tid));
  D.EJEMPLOS = {
    aut: [
      { id: 'A1', tpl: 'persona', ldr: '00000nz  a2200000n  4500', lines: [
        A8('persona'), '040 ## $a {AG} $b spa $c {AG} $e rda', '046 ## $f 1903-06-25 $g 1950-01-21 $2 edtf',
        '100 1# $a Orwell, George, $d 1903-1950', '370 ## $a Motihari (India) $b Londres (Inglaterra)', '372 ## $a Literatura inglesa $a Periodismo',
        '374 ## $a Novelistas $a Periodistas', '377 ## $a eng', '378 ## $q Eric Arthur Blair', '400 1# $a Blair, Eric Arthur, $d 1903-1950',
        '670 ## $a 1984, 2021: $b portada (George Orwell)', '678 0# $a Escritor y periodista británico; George Orwell es el seudónimo de Eric Arthur Blair.'] },
      { id: 'A2', tpl: 'persona', ldr: '00000nz  a2200000n  4500', lines: [
        A8('persona'), '040 ## $a {AG} $b spa $c {AG} $e rda', '100 1# $a Temprano García, Miguel', '374 ## $a Traductores', '377 ## $a spa',
        '670 ## $a 1984, 2021: $b portada (traducción de Miguel Temprano García)'] },
      { id: 'A3', tpl: 'materia', ldr: '00000nz  a2200000n  4500', lines: [
        A8('materia'), '040 ## $a {AG} $b spa $c {AG} $e rda $f local', '150 ## $a Totalitarismo', '450 ## $a Regímenes totalitarios', '550 ## $w g $a Ciencia política',
        '670 ## $a Ejemplo didáctico del curso'] },
      { id: 'A4', tpl: 'genero', ldr: '00000nz  a2200000n  4500', lines: [
        A8('genero'), '040 ## $a {AG} $b spa $c {AG} $e rda $f local', '155 ## $a Novelas', '455 ## $a Novelística', '555 ## $w g $a Ficción',
        '670 ## $a Ejemplo didáctico del curso'] },
      { id: 'A5', tpl: 'lugar', ldr: '00000nz  a2200000n  4500', lines: [
        A8('lugar'), '040 ## $a {AG} $b spa $c {AG} $e rda $f local', '151 ## $a Los Ríos (Chile : Región)', '451 ## $a Región de Los Ríos (Chile)', '451 ## $a XIV Región (Chile)',
        '670 ## $a Ejemplo didáctico del curso'] }
    ],
    bib: [
      { id: 'B1', tpl: 'traduccion', ldr: '00000nam a2200000 i 4500', lines: [
        '003 {AG}', E8('traduccion', '2021', 'sp ', 'spa', { 33: 'f' }), '040 ## $a {AG} $b spa $c {AG} $e rda', '041 1# $a spa $h eng',
        '100 1# $a Orwell, George, $d 1903-1950, $e autor. $9 A1', '240 10 $a Nineteen eighty-four. $l Español', '245 10 $a 1984 / $c George Orwell ; traducción de Miguel Temprano García.',
        '246 3# $a Mil novecientos ochenta y cuatro', '264 #1 $a Barcelona : $b Debolsillo, $c 2021.', '300 ## $a 326 páginas ; $c 19 cm.',
        '336 ## $a texto $b txt $2 rdacontent', '337 ## $a sin mediación $b n $2 rdamedia', '338 ## $a volumen $b nc $2 rdacarrier',
        '520 ## $a Un oficinista se rebela contra un régimen que lo vigila todo.', '650 #7 $a Totalitarismo $2 local $9 A3', '655 #7 $a Novelas $2 local $9 A4',
        '700 1# $a Temprano García, Miguel, $e traductor. $9 A2', '942 ## $c LIB', '952 ## $a {BIB} $b {BIB} $c Colección general $o 823 O79m 2021 $p 0000001 $y LIB'] },
      { id: 'B2', tpl: 'libro', ldr: '00000nam a2200000 i 4500', lines: [
        '003 {AG}', E8('libro', '2022', 'cl ', 'spa', { 18: 'a   ' }), '040 ## $a {AG} $b spa $c {AG} $e rda',
        '100 1# $a Vergara, Marta, $e autor.', '245 13 $a La Región de los Ríos : $b geografía y patrimonio / $c Marta Vergara.',
        '264 #1 $a Valdivia : $b Ediciones UACh, $c 2022.', '300 ## $a 210 páginas : $b ilustraciones ; $c 24 cm.',
        '336 ## $a texto $b txt $2 rdacontent', '337 ## $a sin mediación $b n $2 rdamedia', '338 ## $a volumen $b nc $2 rdacarrier',
        '500 ## $a Registro de ejercicio tomado de la guía de laboratorio del curso.', '651 #7 $a Los Ríos (Chile : Región) $x Geografía $2 local $9 A5',
        '942 ## $c LIB', '952 ## $a {BIB} $b {BIB} $o 918.3 V494r 2022 $p 0000002 $y LIB'] },
      { id: 'B3', tpl: 'dvd', ldr: '00000ngm a2200000 i 4500', lines: [
        '003 {AG}', '007 vd cvaizs', E8('dvd', '2024', 'cl ', 'spa', { 18: '072' }), '040 ## $a {AG} $b spa $c {AG} $e rda', '041 0# $a spa $j eng',
        '245 00 $a Mareas del sur / $c dirección, Daniela Rojas Pérez ; producción, Colectivo Audiovisual Austral.', '257 ## $a Chile $2 naf',
        '264 #1 $a Santiago : $b Colectivo Audiovisual Austral, $c 2024.', '264 #4 $c ©2024', '300 ## $a 1 videodisco (72 min) : $b sonido, color ; $c 12 cm.',
        '336 ## $a imagen en movimiento bidimensional $b tdi $2 rdacontent', '337 ## $a video $b v $2 rdamedia', '338 ## $a videodisco $b vd $2 rdacarrier',
        '344 ## $a digital $b óptico $g estéreo $2 rda', '346 ## $b NTSC $2 rda', '347 ## $a archivo de video $b DVD video $e región 4 $2 rda', '380 ## $a Película documental',
        '500 ## $a Registro ficticio con fines didácticos.', '508 ## $a Fotografía, Tomás Villalobos ; música, Ana Millaqueo ; montaje, Rocío Fuentes.',
        '520 ## $a Documental que sigue a tres familias de pescadores artesanales de la costa de Los Ríos durante una temporada de pesca.', '521 8# $a Todo espectador.',
        '538 ## $a DVD, región 4.', '546 ## $a En español con subtítulos opcionales en inglés.',
        '650 #7 $a Pesca artesanal $z Chile $z Los Ríos (Región) $2 local', '655 #7 $a Películas documentales $2 local',
        '700 1# $a Rojas Pérez, Daniela, $e directora de cine.', '710 2# $a Colectivo Audiovisual Austral, $e productora de cine.',
        '942 ## $c DVD', '952 ## $a {BIB} $b {BIB} $c Audiovisuales $o DVD 0001 $p 0000003 $y DVD'] },
      { id: 'B4', tpl: 'libro', ldr: '00000nam a2200000 a 4500', ejercicio: true, lines: [
        '003 {AG}', E8('libro', '2019', 'cl ', 'spa', {}), '040 ## $a {AG} $b eng $c {AG}', '041 0# $a spa',
        '245 10 $a El arte de catalogar $b una introducción práctica $c Pedro Soto', '264 #1 $a Santiago $b Editorial Ejemplo $c 2020',
        '300 ## $a 180 p. $c 23 cm', '336 ## $a texto $2 rdacontent', '337 ## $a sin mediación $2 rdamedia', '338 ## $a recurso en línea $2 rdacarrier',
        '500 ## $a EJERCICIO: este registro tiene errores intencionales. Usa el panel «Control de calidad» para encontrarlos y corrígelos.', '650 #7 $a catalogación', '700 1# $a Pedro Soto'] }
    ]
  };
})(window.DD2);
