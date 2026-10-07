/* =====================================================================
   Taller de Catalogación · Descripción Documental II
   definiciones.js — diccionario MARC 21 (bibliográfico y autoridades),
   vocabularios RDA y listas de códigos usadas por el editor.
   Puede editarse para ajustar etiquetas, ayudas o códigos del curso.
   ===================================================================== */
window.DD2 = window.DD2 || {};

(function (D) {
  /* ---------- utilidades para escribir las definiciones en corto ---------- */
  // S('a:Título; b:Subtítulo; n*:Número de parte')  → * = repetible
  function S(str) {
    const o = {};
    str.split(';').map(x => x.trim()).filter(Boolean).forEach(p => {
      const m = p.match(/^([a-z0-9])(\*?):(.*)$/);
      if (m) o[m[1]] = { n: m[3].trim(), r: !!m[2] };
    });
    return o;
  }
  // I('0=Nombre de pila|1=Apellido') → opciones de indicador
  function I(str) {
    if (str === 'nf') return 'nf';           // caracteres que no se alfabetizan 0-9
    const o = {};
    str.split('|').forEach(p => { const k = p.split('='); o[k[0] === '#' ? ' ' : k[0]] = k[1]; });
    return o;
  }
  const BLANK = I('#=No definido');
  const THES = I('0=Library of Congress Subject Headings|1=LC infantil|2=MeSH|3=NAL|4=Fuente no especificada|5=Canadian Subject Headings|6=Répertoire de vedettes-matière|7=Fuente indicada en $2');
  const SUBDIV = 'v*:Subdivisión de forma; x*:Subdivisión general; y*:Subdivisión cronológica; z*:Subdivisión geográfica; 2:Fuente del encabezamiento; 0*:URI / número de autoridad; 9:Vínculo a autoridad local';
  const REL = 'e*:Término de relación (designador RDA); 4*:Código de relación; i*:Información de relación';

  /* ============================== BIBLIOGRÁFICO ============================== */
  const B = {};
  B['LDR'] = { n: 'Líder (cabecera)', ctl: true, h: '24 posiciones fijas. Las que se trabajan en el curso: 06 tipo de registro, 07 nivel bibliográfico y 18 forma de catalogación descriptiva (i = ISBD/RDA). Usa el asistente para codificarlo.', ref: 'Guía lab · Codificar el esqueleto' };
  B['001'] = { n: 'Número de control', ctl: true, h: 'Lo asigna el sistema automáticamente.' };
  B['003'] = { n: 'Identificador del número de control', ctl: true, h: 'Código de la agencia que asignó el 001.' };
  B['005'] = { n: 'Fecha y hora de la última transacción', ctl: true, h: 'Lo actualiza el sistema al guardar (aaaammddhhmmss.f).' };
  B['006'] = { n: 'Características de material adicional', ctl: true, r: true, h: '18 posiciones. Codifica un aspecto de OTRO formato: la pos. 00 indica la forma (m = archivo de computadora, s = recurso continuo…) y las pos. 01-17 equivalen al 008/18-34 de ese formato. Ej.: un libro electrónico es BK y lleva 006 m (recurso electrónico, 06 = o en línea, 09 = d documento).', ref: 'MARC 21 · 006' };
  B['007'] = { n: 'Descripción física — campo fijo', ctl: true, r: true, h: 'Solo si NO es un libro impreso: cr recurso en línea · sd disco de audio · vd videodisco · aj mapa · kh fotografía. La pos. 00 indica la categoría de material y la 01 la designación específica.', ref: 'MARC 21 · 007' };
  B['008'] = { n: 'Datos de longitud fija', ctl: true, h: '40 posiciones. 00–05 fecha de creación del registro · 06 tipo de fecha · 07–10 fecha 1 · 15–17 país · 35–37 lengua. Las posiciones 18–34 cambian según el tipo de material.', ref: 'MARC 21 · 008 · Guía lab Codificar el esqueleto' };

  B['015'] = { n: 'Número de la bibliografía nacional', r: true, i1: BLANK, i2: BLANK, s: S('a*:Número de la bibliografía nacional; q*:Calificador; z*:Número cancelado o no válido; 2:Fuente (p. ej. bcl)'), h: 'Número asignado por la bibliografía nacional. Ej. planilla UTEM: $a cl-2022-xxxx $2 bcl.', ref: 'Planilla UTEM' };
  B['020'] = { n: 'ISBN', r: true, i1: BLANK, i2: BLANK, s: S('a:ISBN; q*:Calificador (rústica, tapa dura…); c:Condiciones de adquisición / precio; z*:ISBN cancelado o no válido'), h: 'Número Internacional Normalizado del Libro. Se registra sin guiones o con ellos; pueden constar varios ISBN (RC 1.8.6). El calificador va en $q: (rústica), (obra completa).', ref: 'RC 1.8.3' };
  B['022'] = { n: 'ISSN', r: true, i1: I('#=No especificado|0=De interés internacional|1=No de interés internacional'), i2: BLANK, s: S('a:ISSN; l:ISSN-L; y*:ISSN incorrecto; z*:ISSN cancelado'), h: 'Número Internacional Normalizado para Publicaciones Seriadas (formato 1234-5678).', ref: 'RC 1.8 · MARC 022' };
  B['024'] = { n: 'Otro identificador normalizado', r: true, i1: I('0=ISRC (grabaciones)|1=UPC|2=ISMN (música)|3=EAN|4=SICI|7=Fuente en $2|8=No especificado'), i2: I('#=Sin información|0=Sin diferencia|1=Con diferencia'), s: S('a:Identificador; q*:Calificador; z*:Identificador cancelado; 2:Fuente (doi, hdl, uri…)'), h: 'ISRC, ISMN, EAN, DOI y otros. Para un DOI: ind. 1 = 7 y $2 doi.' };
  B['028'] = { n: 'Número de editor o distribuidor', r: true, i1: I('0=Número de publicación|1=Número de matriz|2=Número de plancha|3=Otro número de música|4=Número de video|5=Otro número de editor|6=Número de distribuidor'), i2: I('0=Sin nota ni asiento|1=Nota y asiento|2=Nota, sin asiento|3=Sin nota, con asiento'), s: S('a:Número; b:Fuente (sello, editor); q*:Calificador'), h: 'Número que aparece en discos, DVD o partituras (catálogo del sello). Muy usado en grabaciones sonoras y video.' };
  B['034'] = { n: 'Datos matemáticos cartográficos codificados', r: true, i1: I('0=Escala indeterminable|1=Escala única|3=Rango de escalas'), i2: I('#=No aplica|0=Anillo exterior|1=Anillo de exclusión'), s: S('a:Tipo de escala (a lineal, b angular, z otra); b*:Razón de escala horizontal constante; d:Coordenada — longitud oeste; e:Coordenada — longitud este; f:Coordenada — latitud norte; g:Coordenada — latitud sur'), h: 'Versión codificada del 255. Ej.: escala 1:50.000 → $a a $b 50000.' };
  B['040'] = { n: 'Fuente de la catalogación', i1: BLANK, i2: BLANK, s: S('a:Agencia de catalogación original; b:Lengua de catalogación; c:Agencia que transcribe; d*:Agencia que modifica; e*:Convenciones de descripción (rda)'), h: '$a agencia · $b spa (lengua en que catalogas, no la del recurso) · $c agencia · $e rda.', ref: 'Guía lab · Codificar el esqueleto' };
  B['041'] = { n: 'Código de lengua', r: true, i1: I('#=Sin información|0=No es traducción ni incluye traducción|1=Es traducción o incluye traducción'), i2: I('#=Código MARC de lengua|7=Fuente en $2'), s: S('a*:Lengua del texto / pista sonora / título; b*:Lengua del resumen; d*:Lengua de texto cantado o hablado; h*:Lengua del original; j*:Lengua de los subtítulos; k*:Lengua de traducciones intermedias; 2:Fuente del código'), h: 'Solo se usa si hay traducción o varias lenguas. $a lengua del recurso · $h lengua del original · ind. 1 = 1 si es traducción. En audiovisual: $a lengua de la banda sonora, $j subtítulos.', ref: 'Guía lab · Codificar el esqueleto' };
  B['043'] = { n: 'Código de área geográfica', i1: BLANK, i2: BLANK, s: S('a*:Código de área geográfica (MARC); 2:Fuente'), h: 'Código MARC de área geográfica del contenido, 7 caracteres. Chile: s-cl---. La planilla UTEM lo anota «cl-----» (según código MARC).', ref: 'Planilla UTEM · MARC Code List for Geographic Areas' };
  B['080'] = { n: 'Clasificación Decimal Universal (CDU)', r: true, i1: I('#=Sin información|0=Completa|1=Abreviada'), i2: BLANK, s: S('a:Número CDU; b:Número de ítem; x*:Subdivisión auxiliar común; 2:Edición'), h: 'Número de clasificación CDU.' };
  B['082'] = { n: 'Clasificación Decimal Dewey (CDD)', r: true, i1: I('0=Edición completa|1=Edición abreviada|7=Otra edición en $2'), i2: I('#=Sin información|0=Asignado por LC|4=Asignado por otra agencia'), s: S('a*:Número de clasificación; b:Número de ítem (librística); 2:Número de edición'), h: 'Ej.: 082 04 $a 863 $2 23.' };
  B['084'] = { n: 'Otro número de clasificación', r: true, i1: BLANK, i2: BLANK, s: S('a*:Número de clasificación; b:Número de ítem; 2:Fuente'), h: 'Clasificaciones locales o especializadas.' };
  B['090'] = { n: 'Signatura topográfica local', r: true, i1: BLANK, i2: BLANK, s: S('a:Clasificación; b:Librística / Cutter'), h: 'Signatura de la biblioteca (local). En Koha suele verse en el ítem (952 $o).' };

  B['100'] = { n: 'Asiento principal — Nombre de persona', link: '100', i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: BLANK, s: S('a:Nombre de persona; b:Numeración (romanos); c*:Títulos y otras palabras asociadas; d:Fechas asociadas; q:Forma completa del nombre; t:Título de la obra; ' + REL + '; 0*:URI / número de autoridad; 9:Vínculo a autoridad local'), h: 'Persona con responsabilidad principal (creador). Forma autorizada: Apellido, Nombre, fechas. Una obra tiene un solo 1XX. 1.er indicador 1 = apellido (el caso más común).', ref: 'RC cap. 14 · Guía Puntos de acceso' };
  B['110'] = { n: 'Asiento principal — Nombre de entidad', link: '110', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de entidad o jurisdicción; b*:Unidad subordinada; c*:Lugar; d*:Fecha; n*:Número de parte/sección/reunión; ' + REL + '; 0*:URI / número de autoridad; 9:Vínculo a autoridad local'), h: 'Entidad corporativa responsable principal (informes institucionales, memorias, leyes). Orden directo: 2.', ref: 'RC cap. 14' };
  B['111'] = { n: 'Asiento principal — Nombre de reunión / evento', link: '111', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de la reunión; n*:Número; d*:Fecha; c*:Lugar; e*:Unidad subordinada; j*:Término de relación; 4*:Código de relación; 0*:URI; 9:Vínculo a autoridad local'), h: 'Congresos, seminarios, exposiciones. Ej.: 111 2# $a Congreso Iberoamericano de Bibliotecología $n (3.º : $d 2025 : $c Santiago, Chile)', ref: 'RC cap. 14' };
  B['130'] = { n: 'Asiento principal — Título uniforme / preferido', link: '130', i1: 'nf', i2: BLANK, s: S('a:Título uniforme; d*:Fecha de firma de tratado; f:Fecha de la obra; k*:Subencabezamiento de forma; l:Lengua de la obra; m*:Medio de interpretación (música); n*:Número de parte; o:Arreglo; p*:Nombre de parte; r:Tonalidad; s:Versión; 0*:URI; 9:Vínculo a autoridad local'), h: 'Obra sin creador (anónima, colectiva, sagrada). En RDA: título preferido. Se usa 130 solo cuando NO hay 1XX. 1.er indicador = caracteres que no se alfabetizan.', ref: 'RC 16.1 · Reglas por campo' };

  B['240'] = { n: 'Título uniforme / preferido (con creador)', i1: I('0=No se imprime ni visualiza|1=Se imprime o visualiza'), i2: 'nf', link: '130', s: S('a:Título uniforme; f:Fecha de la obra; k*:Subencabezamiento de forma; l:Lengua de la obra; m*:Medio de interpretación; n*:Número de parte; o:Arreglo; p*:Nombre de parte; r:Tonalidad; s:Versión; 0*:URI; 9:Vínculo a autoridad local'), h: 'Título preferido de la obra cuando hay 1XX. Reúne en el catálogo traducciones y ediciones con títulos distintos. Ej. para una traducción: 240 10 $a Nineteen eighty-four. $l Español. No es necesario si coincide con el 245.', ref: 'RC 16.1 · Reglas por campo' };
  B['245'] = { n: 'Mención de título', i1: I('0=Sin asiento adicional de título (no hay 1XX)|1=Con asiento adicional de título (hay 1XX)'), i2: 'nf', s: S('a:Título propiamente dicho; b:Resto del título (subtítulo / información complementaria); c:Mención de responsabilidad; h:Medio (designación general del material, p. ej. [recurso electrónico]); f:Fechas inclusivas (archivo); g:Fechas predominantes; k*:Forma; n*:Número de parte; p*:Nombre de parte; s:Versión'), h: 'Se TRANSCRIBE tal como aparece en la fuente principal, sin corregir. Puntuación ISBD: $a … : $b … / $c … . 2.º indicador = caracteres que no se alfabetizan (El =3, La =3, Los =4, The =4). RDA no aplica la regla de tres: se registran todas las menciones de responsabilidad. Según la planilla UTEM, $h registra el medio entre corchetes ([recurso electrónico], [fotografía]) después de $a.', ref: 'RC 1.1.3 · 1.1.6 · 1.1.7 · Planilla UTEM' };
  B['246'] = { n: 'Forma variante del título', r: true, i1: I('0=Nota, sin asiento adicional|1=Nota y asiento adicional|2=Sin nota ni asiento|3=Sin nota, con asiento adicional'), i2: I('#=Sin tipo especificado|0=Parte del título|1=Título paralelo|2=Título distintivo|3=Otro título|4=Título de cubierta|5=Título de portada adicional|6=Título de partida|7=Titulillo|8=Título del lomo'), s: S('a:Título; b:Resto del título; i:Texto de visualización; f:Fecha o designación; n*:Número de parte; p*:Nombre de parte'), h: 'Otras formas por las que alguien puede buscar el título: numérica (1984 → Mil novecientos ochenta y cuatro), de cubierta, paralelo en otra lengua.', ref: 'Mapa de campos · 246' };
  B['250'] = { n: 'Mención de edición', r: true, i1: BLANK, i2: BLANK, s: S('a:Mención de edición; b:Resto de la mención (responsabilidad de la edición); 3:Materiales especificados'), h: 'Se transcribe si el documento lo indica. La primera edición puede omitirse. RDA transcribe sin abreviar («Segunda edición»); RC abrevia («2ª ed.»).', ref: 'RC 1.2.3' };
  B['255'] = { n: 'Datos matemáticos cartográficos', r: true, i1: BLANK, i2: BLANK, s: S('a:Mención de escala; b:Mención de proyección; c:Mención de coordenadas; d:Zona; e:Equinoccio'), h: 'Área 3 para material cartográfico. Ej.: $a Escala 1:50.000 ; $b proyección UTM.', ref: 'RC cap. 3' };
  B['257'] = { n: 'País de la entidad productora', r: true, i1: BLANK, i2: BLANK, s: S('a*:País de producción; 2:Fuente'), h: 'Para películas y videos: país de la productora. Ej.: $a Chile.' };
  B['264'] = { n: 'Producción, publicación, distribución, fabricación y copyright', r: true, i1: I('#=No aplica / sin información / primera|2=Intermedia|3=Actual / última'), i2: I('0=Producción (material inédito)|1=Publicación|2=Distribución|3=Fabricación|4=Fecha de copyright'), s: S('a*:Lugar; b*:Nombre del editor / productor / distribuidor; c:Fecha; 3:Materiales especificados'), h: 'Lugar ($a) : editorial ($b), fecha ($c). Lugar deducido entre corchetes [Barcelona]; desconocido [S.l.] / RDA [Lugar de publicación no identificado]; editor desconocido [s.n.]. 2.º indicador 1 = publicación; 4 = copyright (© 2020).', ref: 'RC 1.4.3 · 1.4.4 · 1.4.6' };

  B['300'] = { n: 'Descripción física', r: true, i1: BLANK, i2: BLANK, s: S('a*:Extensión; b:Otros detalles físicos; c*:Dimensiones; e:Material anejo; f*:Tipo de unidad; 3:Materiales especificados'), h: 'Extensión : otros detalles ; dimensiones + material anejo. Libro: 215 páginas : ilustraciones ; 24 cm. DVD: 1 videodisco (95 min) : sonido, color ; 12 cm. CD: 1 disco de audio (52 min) : digital, estéreo ; 12 cm. Mapa: 1 mapa : color ; 60 x 45 cm.', ref: 'RC 1.5.3–1.5.5' };
  B['306'] = { n: 'Duración', i1: BLANK, i2: BLANK, s: S('a*:Duración (hhmmss)'), h: 'Duración codificada: 1 h 35 min → 013500.' };
  B['310'] = { n: 'Frecuencia actual de la publicación', i1: BLANK, i2: BLANK, s: S('a:Frecuencia; b:Fecha de la frecuencia'), h: 'Recursos continuos. Ej.: $a Semestral.' };
  B['336'] = { n: 'Tipo de contenido (RDA)', r: true, vocab: 'rdacontent', i1: BLANK, i2: BLANK, s: S('a*:Término de tipo de contenido; b*:Código; 2:Fuente (rdacontent); 3:Materiales especificados'), h: 'QUÉ es: la forma de comunicación del contenido (texto, palabra hablada, imagen en movimiento bidimensional…). $2 rdacontent.', ref: 'RDA 6.9 · Mapa de campos' };
  B['337'] = { n: 'Tipo de medio (RDA)', r: true, vocab: 'rdamedia', i1: BLANK, i2: BLANK, s: S('a*:Término de tipo de medio; b*:Código; 2:Fuente (rdamedia); 3:Materiales especificados'), h: 'CON QUÉ se percibe: el dispositivo necesario (sin mediación, audio, video, computadora…). $2 rdamedia.', ref: 'RDA 3.2 · Mapa de campos' };
  B['338'] = { n: 'Tipo de soporte (RDA)', r: true, vocab: 'rdacarrier', i1: BLANK, i2: BLANK, s: S('a*:Término de tipo de soporte; b*:Código; 2:Fuente (rdacarrier); 3:Materiales especificados'), h: 'EN QUÉ viene: el soporte (volumen, hoja, videodisco, disco de audio, recurso en línea…). Debe ser coherente con el 337. $2 rdacarrier.', ref: 'RDA 3.3 · Mapa de campos' };
  B['340'] = { n: 'Medio físico', r: true, i1: BLANK, i2: BLANK, s: S('a*:Material de base; b*:Dimensiones; c*:Materiales aplicados; d*:Técnica; e*:Soporte; g*:Color; 2:Fuente'), h: 'Materiales y técnica de objetos, fotografías, obras de arte. Ej.: $a papel fotográfico $d impresión en gelatina de plata.' };
  B['344'] = { n: 'Características del sonido', r: true, i1: BLANK, i2: BLANK, s: S('a*:Tipo de grabación (analógica, digital); b*:Medio de grabación (óptico, magnético); c*:Velocidad; g*:Configuración de canales (mono, estéreo, surround); h*:Características especiales de reproducción; 2:Fuente'), h: 'Grabaciones sonoras y video. Ej.: $a digital $b óptico $g estéreo $2 rda.' };
  B['346'] = { n: 'Características del video', r: true, i1: BLANK, i2: BLANK, s: S('a*:Formato de video (DVD, Blu-ray, VHS); b*:Estándar de difusión (NTSC, PAL); 2:Fuente'), h: 'Ej.: 346 ## $b NTSC $2 rda.' };
  B['347'] = { n: 'Características del archivo digital', r: true, i1: BLANK, i2: BLANK, s: S('a*:Tipo de archivo (texto, audio, video, imagen, datos); b*:Formato de codificación (PDF, MP3, MP4, JPEG, DVD video); c*:Tamaño del archivo; d*:Resolución; e*:Región de codificación; 2:Fuente'), h: 'Recursos digitales. Ej.: $a archivo de texto $b PDF $c 3,5 MB $2 rda.' };
  B['348'] = { n: 'Formato de la música notada', r: true, i1: BLANK, i2: BLANK, s: S('a*:Término de formato (partitura, partitura vocal, parte…); 2:Fuente'), h: 'Partituras. Ej.: $a partitura $2 rda.' };
  B['351'] = { n: 'Organización y ordenación de los materiales', r: true, i1: BLANK, i2: BLANK, s: S('a*:Organización; b*:Ordenación; c:Nivel jerárquico (fondo, serie…); 3:Materiales especificados'), h: 'Material de archivo: cómo está organizado el fondo. Ej.: $a Organizado en tres series $b orden cronológico.' };
  B['362'] = { n: 'Fechas de publicación y/o designación secuencial', r: true, i1: I('0=Estilo formateado|1=Nota no formateada'), i2: BLANK, s: S('a:Fechas / designación secuencial; z:Fuente de información'), h: 'Recursos continuos: primer y último número. Ej.: 362 0# $a Vol. 1, no. 1 (enero-junio 2020)-' };
  B['380'] = { n: 'Forma de la obra', r: true, i1: BLANK, i2: BLANK, s: S('a*:Forma de la obra (novela, documental, película, podcast…); 0*:URI; 2:Fuente'), h: 'Atributo de la OBRA (RDA): clase o género al que pertenece. Ej.: $a Novela · $a Película documental.', ref: 'RDA · Obra · Clase 3' };
  B['381'] = { n: 'Otra característica distintiva de la obra o expresión', r: true, i1: BLANK, i2: BLANK, s: S('a*:Otra característica distintiva; 2:Fuente'), h: 'Distingue obras o expresiones con el mismo título (versión del director, adaptación, etc.).', ref: 'RDA · Obra/Expresión' };
  B['382'] = { n: 'Medio de interpretación', r: true, i1: I('#=Sin información|0=Medio de interpretación|1=Medio parcial'), i2: BLANK, s: S('a*:Medio de interpretación; n*:Número de intérpretes del mismo medio; s*:Total de intérpretes; 2:Fuente'), h: 'Música: voces e instrumentos. Ej.: $a guitarra $n 1 $a voz $n 1.' };
  B['383'] = { n: 'Designación numérica de la obra musical', r: true, i1: BLANK, i2: BLANK, s: S('a*:Número de serie; b*:Número de opus; c*:Número de catálogo temático'), h: 'Ej.: $b op. 27, no. 2.' };
  B['384'] = { n: 'Tonalidad', r: true, i1: I('#=Sin información|0=Tonalidad original|1=Tonalidad transpuesta'), i2: BLANK, s: S('a:Tonalidad'), h: 'Ej.: $a Do sostenido menor.' };
  B['385'] = { n: 'Características del público', r: true, i1: BLANK, i2: BLANK, s: S('a*:Término de público; m:Categoría demográfica; 2:Fuente'), h: 'Versión controlada del 521.' };
  B['388'] = { n: 'Período de creación', r: true, i1: I('#=Sin información|1=Creación de la obra|2=Creación de la expresión'), i2: BLANK, s: S('a*:Período de creación; 2:Fuente'), h: 'Atributo de obra/expresión. Ej.: $a Siglo XX.' };

  B['490'] = { n: 'Mención de serie', r: true, i1: I('0=Serie sin punto de acceso (no trazada)|1=Serie con punto de acceso en 8XX'), i2: BLANK, s: S('a*:Mención de serie; v*:Designación de volumen / número; x*:ISSN de la serie; 3:Materiales especificados'), h: 'Se TRANSCRIBE tal como aparece. Si el 1.er indicador es 1, debe existir el 830 normalizado. Ej.: $a Colección Biblioteca Chilena ; $v 12', ref: 'RC 1.6' };

  B['500'] = { n: 'Nota general', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota general; 3:Materiales especificados'), h: 'Información útil que no tiene un campo propio. Ej.: Título tomado de la cubierta. · Incluye índice.', ref: 'RC 1.7 · Lab 7' };
  B['502'] = { n: 'Nota de tesis', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota de tesis (forma libre); b:Tipo de grado; c:Institución que otorga el grado; d:Año del grado; g*:Información miscelánea; o*:Identificador de la tesis'), h: 'Ej.: $b Memoria (Bibliotecario Documentalista) $c Universidad Tecnológica Metropolitana $d 2025.' };
  B['504'] = { n: 'Nota de bibliografía', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota de bibliografía; b:Número de referencias'), h: 'Indica que incluye referencias y, si se puede, dónde. Ej.: Incluye referencias bibliográficas (páginas 320-335).', ref: 'Lab 7' };
  B['505'] = { n: 'Nota de contenido', r: true, i1: I('0=Contenido completo|1=Contenido incompleto|2=Contenido parcial|8=Sin visualización asociada'), i2: I('#=Básica|0=Ampliada'), s: S('a:Nota de contenido (forma libre); g*:Información miscelánea (duración, páginas); r*:Mención de responsabilidad; t*:Título; u*:URI'), h: 'Lista las partes: cuentos, capítulos, pistas. Separador « -- ». Ej.: El Sur -- El Aleph -- Emma Zunz.', ref: 'Lab 7' };
  B['506'] = { n: 'Restricciones de acceso', r: true, i1: I('#=Sin información|0=Sin restricciones|1=Con restricciones'), i2: BLANK, s: S('a:Condiciones de acceso; f*:Terminología normalizada; u*:URI'), h: 'Ej.: Acceso abierto. · Consulta solo en sala.' };
  B['508'] = { n: 'Créditos de creación / producción', r: true, i1: BLANK, i2: BLANK, s: S('a:Créditos'), h: 'Audiovisual: equipo técnico y artístico (no intérpretes). Ej.: Dirección de fotografía, Ana Pérez ; música, Luis Soto.' };
  B['511'] = { n: 'Nota de participantes o intérpretes', r: true, i1: I('0=Sin visualización asociada|1=Elenco'), i2: BLANK, s: S('a:Participantes o intérpretes'), h: 'Elenco, narradores, intérpretes musicales. Ind. 1 = 1 genera «Elenco:».' };
  B['518'] = { n: 'Fecha / hora y lugar de un evento', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota (forma libre); d*:Fecha del evento; o*:Otra información; p*:Lugar del evento'), h: 'Grabaciones y registros de eventos: cuándo y dónde se grabó o filmó.' };
  B['516'] = { n: 'Nota de tipo de archivo de computadora o de datos', r: true, i1: I('#=Tipo de archivo|8=Sin visualización asociada'), i2: BLANK, s: S('a:Nota de tipo de archivo'), h: 'Obligatorio en la planilla UTEM para libros electrónicos. Ej.: Texto en PDF.', ref: 'Planilla UTEM' };
  B['520'] = { n: 'Resumen', r: true, i1: I('#=Resumen|0=Materia|1=Reseña|2=Alcance y contenido|3=Resumen analítico|4=Aviso de contenido|8=Sin visualización asociada'), i2: BLANK, s: S('a:Resumen; b:Ampliación del resumen; c:Fuente que asigna; u*:URI'), h: 'Describe brevemente de qué trata, de forma objetiva. Ej.: Un oficinista se rebela contra un régimen que lo vigila todo.', ref: 'Lab 7' };
  B['521'] = { n: 'Nota de público destinatario', r: true, i1: I('#=Público|0=Nivel de lectura|1=Edad de interés|2=Nivel escolar|3=Características especiales|4=Nivel de motivación/interés|8=Sin visualización asociada'), i2: BLANK, s: S('a*:Público destinatario; b:Fuente'), h: 'Ej.: Dirigido a estudiantes de enseñanza media. · Para primeros lectores.', ref: 'Lab 7' };
  B['530'] = { n: 'Nota de formato físico adicional', r: true, i1: BLANK, i2: BLANK, s: S('a:Formato físico adicional; u*:URI'), h: 'Ej.: Disponible también en línea.' };
  B['533'] = { n: 'Nota de reproducción', r: true, i1: BLANK, i2: BLANK, s: S('a:Tipo de reproducción; b*:Lugar; c*:Agencia responsable; d:Fecha; e:Descripción física; f*:Serie; n*:Nota'), h: 'Digitalizaciones y facsímiles (práctica LC con descripción del original). Ej.: $a Reproducción digital. $b Santiago : $c Biblioteca Nacional Digital, $d 2019.', ref: 'Clase 4 · Reproducciones' };
  B['538'] = { n: 'Nota de detalles del sistema', r: true, i1: BLANK, i2: BLANK, s: S('a:Detalles del sistema; u*:URI'), h: 'Requisitos técnicos. Ej.: DVD, región 4. · Modo de acceso: World Wide Web.' };
  B['540'] = { n: 'Condiciones de uso y reproducción', r: true, i1: BLANK, i2: BLANK, s: S('a:Condiciones de uso; f*:Término normalizado; u*:URI; 2:Fuente'), h: 'Licencias. Ej.: $a Creative Commons Atribución 4.0 $u https://creativecommons.org/licenses/by/4.0/' };
  B['545'] = { n: 'Datos biográficos o históricos', r: true, i1: I('#=Sin información|0=Esbozo biográfico|1=Historia administrativa'), i2: BLANK, s: S('a:Nota biográfica o histórica; b:Ampliación'), h: 'Archivo: biografía del productor del fondo o historia de la entidad.' };
  B['541'] = { n: 'Nota de fuente de adquisición', r: true, i1: I('#=Sin información|0=Privada|1=No privada'), i2: BLANK, s: S('3:Materiales especificados; a:Fuente de adquisición; b:Dirección; c:Forma de adquisición (donación, compra); d:Fecha de adquisición; e:Número de ingreso; f:Propietario; h:Precio de compra'), h: 'Cómo llegó el documento a la biblioteca. Ej. planilla: $a Familia Muzard ; $c donación ; $d 2021.', ref: 'Planilla UTEM' };
  B['546'] = { n: 'Nota de lengua', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota de lengua; b*:Información sobre código o alfabeto'), h: 'Informa la o las lenguas del contenido en lenguaje natural. Ej.: Texto en español e inglés en páginas enfrentadas. · Doblada al español; subtítulos en inglés.', ref: 'Lab 7' };
  B['555'] = { n: 'Nota de índice acumulativo / instrumento de descripción', r: true, i1: I('#=Índices|0=Instrumento de descripción|8=Sin visualización asociada'), i2: BLANK, s: S('a:Nota; u*:URI'), h: 'Archivo: inventario o catálogo del fondo. Ej.: $a Inventario disponible en sala.' };
  B['586'] = { n: 'Nota de premios', r: true, i1: I('#=Premios|8=Sin visualización asociada'), i2: BLANK, s: S('a:Premio'), h: 'Ej.: Premio Nacional de Literatura, 2024.' };
  B['588'] = { n: 'Nota de fuente de la descripción', r: true, i1: I('#=Sin información|0=Fuente de la descripción|1=Última edición consultada'), i2: BLANK, s: S('a:Fuente de la descripción'), h: 'De dónde se tomaron los datos (RDA: procedencia). Ej.: Descripción basada en la versión en línea; título de la pantalla de inicio (consultado el 6 de octubre de 2026).', ref: 'Clase 8 · Procedencia de datos' };

  B['600'] = { n: 'Materia — Nombre de persona', r: true, link: '100', i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: THES, s: S('a:Nombre de persona; b:Numeración; c*:Títulos; d:Fechas; q:Forma completa del nombre; t:Título de la obra; ' + SUBDIV), h: 'La persona es el TEMA (de quién trata), no quien hizo la obra. En una biografía: el autor va en 100 y el biografiado en 600.', ref: 'Guía Puntos de acceso · regla de oro' };
  B['610'] = { n: 'Materia — Nombre de entidad', r: true, link: '110', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: THES, s: S('a:Nombre de entidad; b*:Unidad subordinada; c*:Lugar; d*:Fecha; n*:Número; t:Título de la obra; ' + SUBDIV), h: 'Una institución como tema. Ej.: 610 20 $a Universidad de Chile $x Historia.' };
  B['611'] = { n: 'Materia — Nombre de reunión / evento', r: true, link: '111', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: THES, s: S('a:Nombre de la reunión; n*:Número; d:Fecha; c*:Lugar; e*:Unidad subordinada; t:Título de la obra; ' + SUBDIV), h: 'Un evento como tema (ej.: Juegos Panamericanos 2023).' };
  B['630'] = { n: 'Materia — Título uniforme', r: true, link: '130', i1: 'nf', i2: THES, s: S('a:Título uniforme; f:Fecha de la obra; l:Lengua; n*:Número de parte; p*:Nombre de parte; s:Versión; ' + SUBDIV), h: 'Otra obra como tema (crítica de una novela, estudio sobre la Biblia).' };
  B['648'] = { n: 'Materia — Término cronológico', r: true, i1: BLANK, i2: THES, s: S('a:Término cronológico; ' + SUBDIV), h: 'Período como tema. Ej.: $a 1973-1990 $2 local.' };
  B['650'] = { n: 'Materia — Término temático', r: true, link: '150', i1: I('#=Sin información|0=Sin nivel especificado|1=Primario|2=Secundario'), i2: THES, s: S('a:Término temático; b:Término que sigue al lugar; ' + SUBDIV), h: 'De QUÉ TRATA la obra. Con encabezamientos en español: 2.º indicador 7 y $2 con la fuente (lemb, embne, unescot, local). Subdivisiones: $x general · $z geográfica · $y cronológica · $v forma.', ref: 'Mapa de campos · Materia (6XX)' };
  B['651'] = { n: 'Materia — Nombre geográfico', r: true, link: '151', i1: BLANK, i2: THES, s: S('a:Nombre geográfico; ' + SUBDIV), h: 'Lugar como tema. Ej.: 651 #7 $a Los Ríos (Chile : Región) $x Geografía $2 lemb.' };
  B['653'] = { n: 'Término de indización no controlado', r: true, i1: I('#=Sin información|0=Sin nivel|1=Primario|2=Secundario'), i2: I('#=Sin información|0=Término temático|1=Nombre de persona|2=Nombre de entidad|3=Nombre de reunión|4=Cronológico|5=Geográfico|6=Género/forma'), s: S('a*:Término no controlado'), h: 'Palabras clave libres, sin vocabulario controlado.' };
  B['655'] = { n: 'Término de indización — Género / forma', r: true, link: '155', i1: I('#=Básico|0=Facetado'), i2: THES, s: S('a:Término de género/forma; ' + SUBDIV), h: 'Lo que la obra ES (novela, documental, mapa, fotografía), no de lo que trata. $2 lcgft, lemb o local.', ref: 'Mapa de campos · 655' };

  B['700'] = { n: 'Asiento adicional — Nombre de persona', r: true, link: '100', i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: I('#=Sin información|2=Asiento analítico'), s: S('a:Nombre de persona; b:Numeración; c*:Títulos; d:Fechas; q:Forma completa del nombre; ' + REL + '; t:Título de la obra; l:Lengua; f:Fecha de la obra; 0*:URI; 9:Vínculo a autoridad local'), h: 'Otras personas responsables: coautores, traductores, ilustradores, directores, intérpretes. Lleva término de relación en $e (traductor, ilustrador, director de cine…).', ref: 'RC cap. 14 · Guía Puntos de acceso' };
  B['710'] = { n: 'Asiento adicional — Nombre de entidad', r: true, link: '110', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: I('#=Sin información|2=Asiento analítico'), s: S('a:Nombre de entidad; b*:Unidad subordinada; c*:Lugar; d*:Fecha; n*:Número; ' + REL + '; t:Título de la obra; 0*:URI; 9:Vínculo a autoridad local'), h: 'Instituciones relacionadas: productora, entidad editora, institución que otorga el grado.' };
  B['711'] = { n: 'Asiento adicional — Nombre de reunión', r: true, link: '111', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: I('#=Sin información|2=Asiento analítico'), s: S('a:Nombre de la reunión; n*:Número; d:Fecha; c*:Lugar; j*:Término de relación; i*:Información de relación; 4*:Código de relación; 0*:URI; 9:Vínculo a autoridad local'), h: 'Evento relacionado con el recurso.' };
  B['730'] = { n: 'Asiento adicional — Título uniforme / obra relacionada', r: true, link: '130', i1: 'nf', i2: I('#=Sin información|2=Asiento analítico'), s: S('a:Título uniforme; i*:Información de relación (Adaptación de:, Contiene:); f:Fecha; l:Lengua; n*:Número de parte; p*:Nombre de parte; s:Versión; 0*:URI; 9:Vínculo a autoridad local'), h: 'Otra obra relacionada: una adaptación, una obra contenida. Ej.: 730 0# $i Adaptación de (obra): $a …' };
  B['740'] = { n: 'Asiento adicional — Título relacionado o analítico no controlado', r: true, i1: 'nf', i2: I('#=Sin información|2=Asiento analítico'), s: S('a:Título; n*:Número de parte; p*:Nombre de parte'), h: 'Títulos de partes contenidas, sin control de autoridades.' };
  B['765'] = { n: 'Enlace — Lengua original', r: true, i1: I('0=Visualizar nota|1=No visualizar'), i2: I('#=Traducción de|8=Sin visualización'), s: S('a:Asiento principal; t:Título; d:Lugar, editor y fecha; i*:Información de relación; w*:Número de control'), h: 'Enlaza una traducción con su original.' };
  B['773'] = { n: 'Enlace — Documento fuente (parte de…)', r: true, i1: I('0=Visualizar nota|1=No visualizar'), i2: I('#=En|8=Sin visualización'), s: S('a:Asiento principal; t:Título; d:Lugar, editor y fecha; g*:Parte relacionada (vol., págs.); x:ISSN; z:ISBN; w*:Número de control'), h: 'Para analíticas: un artículo dentro de una revista, un capítulo dentro de un libro. Ej.: $t Revista Chilena de… $g Vol. 5, no. 2 (2024), p. 10-25.' };
  B['775'] = { n: 'Enlace — Otra edición', r: true, i1: I('0=Visualizar nota|1=No visualizar'), i2: I('#=Otra edición disponible|8=Sin visualización'), s: S('a:Asiento principal; t:Título; b:Edición; d:Lugar, editor y fecha; i*:Información de relación; z*:ISBN; w*:Número de control'), h: 'Relación entre manifestaciones de la misma expresión.' };
  B['776'] = { n: 'Enlace — Forma física adicional', r: true, i1: I('0=Visualizar nota|1=No visualizar'), i2: I('#=Disponible en otra forma|8=Sin visualización'), s: S('a:Asiento principal; t:Título; d:Lugar, editor y fecha; i*:Información de relación; z*:ISBN; w*:Número de control'), h: 'Ej.: versión impresa de un libro electrónico. $i Versión impresa: $a … $t … $z ISBN.', ref: 'Clase 7 · Relaciones' };
  B['787'] = { n: 'Enlace — Otra relación', r: true, i1: I('0=Visualizar nota|1=No visualizar'), i2: I('#=Documento relacionado|8=Sin visualización'), s: S('a:Asiento principal; t:Título; d:Lugar, editor y fecha; i*:Información de relación; w*:Número de control'), h: 'Cualquier otra relación entre recursos.' };
  B['800'] = { n: 'Serie — Nombre de persona', r: true, link: '100', i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: BLANK, s: S('a:Nombre de persona; d:Fechas; t:Título de la serie; v:Volumen / número; 9:Vínculo a autoridad local'), h: 'Serie de autor personal (Obras completas de…).' };
  B['810'] = { n: 'Serie — Nombre de entidad', r: true, link: '110', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de entidad; b*:Unidad subordinada; t:Título de la serie; v:Volumen / número; 9:Vínculo a autoridad local'), h: 'Serie institucional (Serie Documentos de trabajo de una entidad).' };
  B['830'] = { n: 'Serie — Título uniforme', r: true, link: '130', i1: BLANK, i2: 'nf', s: S('a:Título uniforme de la serie; n*:Número de parte; p*:Nombre de parte; v:Volumen / número; x:ISSN; 0*:URI; 9:Vínculo a autoridad local'), h: 'Punto de acceso NORMALIZADO de la serie, que reúne la colección en el catálogo. Acompaña al 490 con 1.er indicador 1.', ref: 'RC 1.6 · Reglas por campo' };
  B['856'] = { n: 'Localización y acceso electrónicos', r: true, i1: I('#=Sin información|4=HTTP|7=Método en $2'), i2: I('#=Sin información|0=Recurso|1=Versión del recurso|2=Recurso relacionado|8=Sin visualización'), s: S('a*:Nombre del servidor; u*:URI; y*:Texto del enlace; z*:Nota pública; 3:Materiales especificados'), h: 'Enlace al recurso en línea. Ind. 4 0 = el enlace ES el recurso; 4 1 = versión digital; 4 2 = recurso relacionado.' };

  B['905'] = { n: 'Campo local 905', i1: BLANK, i2: BLANK, s: S('a:Dato local (planilla UTEM: interna)'), h: 'Campo local obligatorio en la planilla UTEM. Valor indicado en los ejemplos: $a interna.', ref: 'Planilla UTEM' };
  B['949'] = { n: 'Campo local 949', r: true, i1: BLANK, i2: BLANK, s: S('a:Dato local $a; b:Dato local $b'), h: 'Campo local obligatorio en la planilla UTEM (en el ejemplo: $a c $b c). Consulta con la docente el valor que corresponde.', ref: 'Planilla UTEM' };
  B['942'] = { n: 'Koha — Elementos agregados', i1: BLANK, i2: BLANK, s: S('c:Tipo de ítem Koha (por defecto); 2:Fuente de clasificación; h:Clasificación; i:Librística; n:Ocultar en OPAC'), h: 'Campo local de Koha. $c tipo de ítem: LIB (libro), REF, DVD, CD, MAPA, PART, REV, ELEC, FOTO, OBJ, TESIS.', ref: 'Koha' };
  B['952'] = { n: 'Koha — Ejemplares (ÍTEM)', r: true, i1: BLANK, i2: BLANK, s: S('a:Biblioteca propietaria; b:Biblioteca actual; c:Ubicación en estantería; o:Signatura topográfica completa; p:Código de barras; t:Número de ejemplar; y:Tipo de ítem Koha; z:Nota pública; x:Nota no pública; e:Fuente de adquisición; g:Costo; d:Fecha de adquisición'), h: 'En Koha cada ejemplar es un 952: corresponde al ÍTEM del modelo WEMI (el objeto concreto que posee la biblioteca, con su signatura y código de barras).', ref: 'Koha · WEMI · Ítem' };

  /* ============================== AUTORIDADES ============================== */
  const A = {};
  A['LDR'] = { n: 'Líder (cabecera de autoridad)', ctl: true, h: 'Pos. 06 = z (autoridad). Pos. 17: n = completo, o = incompleto.' };
  A['001'] = B['001']; A['003'] = B['003']; A['005'] = B['005'];
  A['008'] = { n: 'Datos de longitud fija (autoridad)', ctl: true, h: '40 posiciones. 06 subdivisión geográfica · 09 tipo de registro (a encabezamiento establecido) · 10 reglas (z otras: RDA, con 040 $e rda) · 11 sistema de materias (n no aplica, z otro) · 14 uso como asiento principal/secundario · 15 uso como materia · 16 uso como serie · 32 nombre personal diferenciado (a) · 33 nivel de establecimiento (a completo).', ref: 'MARC 21 Autoridades · 008' };
  A['024'] = { n: 'Otro identificador normalizado', r: true, i1: I('7=Fuente en $2|8=No especificado'), i2: BLANK, s: S('a:Identificador; 2:Fuente (viaf, isni, orcid, wikidata)'), h: 'Identificadores externos de la persona o entidad. Ej.: 024 7# $a 0000-0002-1825-0097 $2 orcid.' };
  A['040'] = { n: 'Fuente de la catalogación', i1: BLANK, i2: BLANK, s: S('a:Agencia de catalogación original; b:Lengua de catalogación; c:Agencia que transcribe; d*:Agencia que modifica; e*:Convenciones de descripción (rda); f:Convenciones de encabezamientos de materia / tesauro'), h: '$a agencia · $b spa · $c agencia · $e rda. Para materias, $f indica el vocabulario (lemb, embne, local).' };
  A['046'] = { n: 'Fechas especiales codificadas', r: true, i1: BLANK, i2: BLANK, s: S('f:Fecha de nacimiento; g:Fecha de muerte; k:Fecha inicial de creación; q:Fecha de establecimiento (entidad); r:Fecha de terminación (entidad); s:Inicio del período de actividad; t:Fin del período de actividad; 2:Fuente (edtf)'), h: 'Fechas en formato normalizado (aaaa o aaaa-mm-dd). Ej.: $f 1914-08-26 $g 1984-02-12 $2 edtf.', ref: 'RDA · Persona · Clase 5' };
  A['100'] = { n: 'Encabezamiento — Nombre de persona / familia', i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: BLANK, s: S('a:Nombre de persona; b:Numeración; c*:Títulos y otras palabras asociadas; d:Fechas asociadas; q:Forma completa del nombre; t:Título de la obra; l:Lengua; f:Fecha de la obra'), h: 'PUNTO DE ACCESO AUTORIZADO. Nombre preferido + elementos diferenciadores: fechas ($d), forma completa ($q), títulos ($c). Ej.: 100 1# $a Mistral, Gabriela, $d 1889-1957. Familia: 100 3# $a Edwards (Familia : $d 1800- : $c Chile)', ref: 'RDA · Persona/Familia · Clases 5-6' };
  A['110'] = { n: 'Encabezamiento — Nombre de entidad corporativa', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de entidad o jurisdicción; b*:Unidad subordinada; c*:Lugar; d*:Fecha; n*:Número'), h: 'Entidad en orden directo (2). Entidad subordinada en $b. Ej.: 110 2# $a Universidad Tecnológica Metropolitana (Chile). $b Departamento de Gestión de la Información', ref: 'RDA · Entidad corporativa · Clase 6' };
  A['111'] = { n: 'Encabezamiento — Nombre de reunión / evento', i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de la reunión; n*:Número; d*:Fecha; c*:Lugar; e*:Unidad subordinada'), h: 'Congresos y eventos: nombre + (número : fecha : lugar).' };
  A['130'] = { n: 'Encabezamiento — Título uniforme (obra)', i1: BLANK, i2: 'nf', s: S('a:Título uniforme; f:Fecha de la obra; k*:Subencabezamiento de forma; l:Lengua; n*:Número de parte; p*:Nombre de parte; s:Versión'), h: 'Punto de acceso autorizado de una obra anónima o de una obra que se usa como materia o relación.', ref: 'RDA · Obra · Clase 3' };
  A['150'] = { n: 'Encabezamiento — Término temático', i1: BLANK, i2: BLANK, s: S('a:Término temático; b:Término que sigue al lugar; v*:Subdivisión de forma; x*:Subdivisión general; y*:Subdivisión cronológica; z*:Subdivisión geográfica'), h: 'Encabezamiento de materia autorizado. Indica el vocabulario en 040 $f.' };
  A['151'] = { n: 'Encabezamiento — Nombre geográfico', i1: BLANK, i2: BLANK, s: S('a:Nombre geográfico; v*:Subdivisión de forma; x*:Subdivisión general; y*:Subdivisión cronológica; z*:Subdivisión geográfica'), h: 'Lugares. Ej.: 151 ## $a Valparaíso (Chile)' };
  A['155'] = { n: 'Encabezamiento — Término de género/forma', i1: BLANK, i2: BLANK, s: S('a:Término de género/forma; v*:Subdivisión de forma; y*:Subdivisión cronológica; z*:Subdivisión geográfica'), h: 'Ej.: 155 ## $a Películas documentales' };
  A['368'] = { n: 'Otros atributos de persona o entidad', r: true, i1: BLANK, i2: BLANK, s: S('a*:Tipo de entidad corporativa; b*:Tipo de jurisdicción; c*:Otra designación; d*:Título de la persona; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Ej.: $d Presidenta (Chile) · $a Universidades.' };
  A['370'] = { n: 'Lugar asociado', r: true, i1: BLANK, i2: BLANK, s: S('a:Lugar de nacimiento; b:Lugar de muerte; c*:País asociado; e*:Lugar de residencia / sede; f*:Otro lugar asociado; g*:Lugar de origen de la obra; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Ej.: $a Vicuña (Chile) $b Hempstead (N.Y.) $c Chile.', ref: 'RDA · Persona · Clase 5' };
  A['371'] = { n: 'Dirección', r: true, i1: BLANK, i2: BLANK, s: S('a*:Dirección; b:Ciudad; d:País; m*:Correo electrónico; u*:URI'), h: 'Dirección de una entidad o persona (uso según política del catálogo).' };
  A['372'] = { n: 'Campo de actividad', r: true, i1: BLANK, i2: BLANK, s: S('a*:Campo de actividad; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Área de trabajo: Literatura chilena · Bibliotecología · Cine documental.' };
  A['373'] = { n: 'Grupo asociado / afiliación', r: true, i1: BLANK, i2: BLANK, s: S('a*:Grupo asociado; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Institución a la que la persona pertenece o perteneció. Ej.: Universidad de Chile.' };
  A['374'] = { n: 'Profesión u ocupación', r: true, i1: BLANK, i2: BLANK, s: S('a*:Profesión u ocupación; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Ej.: Poetas · Profesoras · Directores de cine.' };
  A['375'] = { n: 'Género', r: true, i1: BLANK, i2: BLANK, s: S('a*:Género; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Opcional, según la política del catálogo (la PCC recomienda no registrarlo).' };
  A['376'] = { n: 'Información de familia', r: true, i1: BLANK, i2: BLANK, s: S('a*:Tipo de familia; b*:Nombre de un miembro prominente; c*:Título hereditario; s:Fecha de inicio; t:Fecha de término; 2:Fuente'), h: 'Familias: tipo (Familia, Clan, Dinastía) y miembros prominentes.', ref: 'RDA · Familia · Clase 6' };
  A['377'] = { n: 'Lengua asociada', r: true, i1: I('#=Código MARC|7=Fuente en $2'), i2: BLANK, s: S('a*:Código de lengua; l*:Término de lengua; 2:Fuente'), h: 'Lengua en que la persona escribe o la entidad publica. Ej.: $a spa.' };
  A['378'] = { n: 'Forma más completa del nombre', i1: BLANK, i2: BLANK, s: S('q:Forma más completa del nombre'), h: 'Ej.: $q Lucila de María del Perpetuo Socorro Godoy Alcayaga.' };
  A['380'] = { n: 'Forma de la obra', r: true, i1: BLANK, i2: BLANK, s: S('a*:Forma de la obra; 2:Fuente'), h: 'Para registros de obra (130): Novela, Película, Poema…' };
  A['400'] = { n: 'Variante — Nombre de persona', r: true, i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: BLANK, s: S('a:Nombre de persona; b:Numeración; c*:Títulos; d:Fechas; q:Forma completa; t:Título de la obra; i*:Información de relación; w:Subcampo de control'), h: 'Otras formas por las que se busca a la persona y que REMITEN a la autorizada: nombre real, seudónimo no usado, otras grafías. Ej.: 400 1# $a Godoy Alcayaga, Lucila, $d 1889-1957', ref: 'Guía Puntos de acceso · variantes' };
  A['410'] = { n: 'Variante — Nombre de entidad', r: true, i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de entidad; b*:Unidad subordinada; c*:Lugar; w:Subcampo de control'), h: 'Siglas y otras formas. Ej.: 410 2# $a UTEM' };
  A['411'] = { n: 'Variante — Nombre de reunión', r: true, i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('a:Nombre de la reunión; n*:Número; d*:Fecha; c*:Lugar; w:Subcampo de control'), h: 'Otras formas del nombre del evento.' };
  A['430'] = { n: 'Variante — Título uniforme', r: true, i1: BLANK, i2: 'nf', s: S('a:Título; l:Lengua; f:Fecha; w:Subcampo de control'), h: 'Títulos variantes de la obra (en otras lenguas, abreviados).' };
  A['450'] = { n: 'Variante — Término temático', r: true, i1: BLANK, i2: BLANK, s: S('a:Término temático; x*:Subdivisión general; w:Subcampo de control'), h: 'Término no preferido: «Véase» desde sinónimos.' };
  A['451'] = { n: 'Variante — Nombre geográfico', r: true, i1: BLANK, i2: BLANK, s: S('a:Nombre geográfico; w:Subcampo de control'), h: 'Otras formas del lugar.' };
  A['455'] = { n: 'Variante — Género/forma', r: true, i1: BLANK, i2: BLANK, s: S('a:Término de género/forma; w:Subcampo de control'), h: 'Sinónimos del término de género/forma.' };
  A['500'] = { n: 'Relacionado — Nombre de persona', r: true, i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: BLANK, s: S('i*:Información de relación (Seudónimo:, Identidad real:); a:Nombre de persona; d:Fechas; q:Forma completa; w:Subcampo de control (r = relación en $i)'), h: '«Véase además»: otra identidad autorizada relacionada. Ej. seudónimos: 500 1# $w r $i Seudónimo: $a …' };
  A['510'] = { n: 'Relacionado — Nombre de entidad', r: true, i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('i*:Información de relación (Predecesora:, Sucesora:); a:Nombre de entidad; b*:Unidad subordinada; w:Subcampo de control (a anterior, b posterior, r relación)'), h: 'Cambios de nombre: entidad predecesora / sucesora.', ref: 'RDA · Entidad corporativa · Clase 6' };
  A['511'] = { n: 'Relacionado — Nombre de reunión', r: true, i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: BLANK, s: S('i*:Información de relación; a:Nombre de la reunión; w:Subcampo de control'), h: 'Eventos relacionados.' };
  A['530'] = { n: 'Relacionado — Título uniforme', r: true, i1: BLANK, i2: 'nf', s: S('i*:Información de relación; a:Título; w:Subcampo de control'), h: 'Obras relacionadas.' };
  A['550'] = { n: 'Relacionado — Término temático', r: true, i1: BLANK, i2: BLANK, s: S('a:Término temático; w:Subcampo de control (g término general, h término específico)'), h: 'Términos genéricos (TG) y específicos (TE). Ej.: $w g $a Ciencias sociales.' };
  A['551'] = { n: 'Relacionado — Nombre geográfico', r: true, i1: BLANK, i2: BLANK, s: S('a:Nombre geográfico; w:Subcampo de control'), h: 'Lugares relacionados.' };
  A['555'] = { n: 'Relacionado — Género/forma', r: true, i1: BLANK, i2: BLANK, s: S('a:Término de género/forma; w:Subcampo de control'), h: 'Términos relacionados de género/forma.' };
  A['667'] = { n: 'Nota general no pública', r: true, i1: BLANK, i2: BLANK, s: S('a:Nota'), h: 'Nota interna para catalogadores.' };
  A['670'] = { n: 'Fuente consultada (con datos encontrados)', r: true, i1: BLANK, i2: BLANK, s: S('a:Cita de la fuente; b:Información encontrada; u*:URI'), h: 'OBLIGATORIO: justifica la forma elegida. Ej.: $a Desolación, 1922: $b portada (Gabriela Mistral) · $a VIAF, 6 oct. 2026 $b (Mistral, Gabriela, 1889-1957; n. Vicuña)', ref: 'NACO · Clase 5' };
  A['675'] = { n: 'Fuente consultada sin datos encontrados', i1: BLANK, i2: BLANK, s: S('a*:Cita de la fuente'), h: 'Fuentes revisadas donde no se encontró información.' };
  A['678'] = { n: 'Datos biográficos o históricos', r: true, i1: I('#=Sin información|0=Esbozo biográfico|1=Historia administrativa'), i2: BLANK, s: S('a*:Datos biográficos o históricos; b:Ampliación'), h: 'Breve reseña pública de la persona o historia de la entidad.' };
  A['680'] = { n: 'Nota pública general', r: true, i1: BLANK, i2: BLANK, s: S('i*:Texto explicativo; a*:Encabezamiento o término'), h: 'Nota de alcance: cómo usar el término.' };

  A['700'] = { n: 'Encabezamiento enlazado — Nombre de persona', r: true, i1: I('0=Nombre de pila|1=Apellido(s)|3=Nombre de familia'), i2: THES, s: S('a:Nombre de persona; b:Numeración; c*:Títulos; d:Fechas; q:Forma completa; 0*:URI / número de autoridad; 2:Fuente'), h: 'Enlaza la forma local con la forma de otro vocabulario o archivo de autoridades (ind. 2: 0 = LC).' };
  A['710'] = { n: 'Encabezamiento enlazado — Nombre de entidad', r: true, i1: I('0=Nombre invertido|1=Nombre de jurisdicción|2=Nombre en orden directo'), i2: THES, s: S('a:Nombre de entidad; b*:Unidad subordinada; 0*:URI; 2:Fuente'), h: 'Enlace con la forma de otro archivo de autoridades.' };
  A['750'] = { n: 'Encabezamiento enlazado — Término temático', r: true, i1: BLANK, i2: THES, s: S('a:Término temático; v*:Subdivisión de forma; x*:Subdivisión general; y*:Subdivisión cronológica; z*:Subdivisión geográfica; 0*:URI; 2:Fuente'), h: 'Enlaza la materia en español con su encabezamiento LCSH (ind. 2 = 0) y su URI en $0. Es la forma de registrar que el término local es una traducción de LCSH.', ref: 'MARC 21 Autoridades · 7XX' };
  A['751'] = { n: 'Encabezamiento enlazado — Nombre geográfico', r: true, i1: BLANK, i2: THES, s: S('a:Nombre geográfico; v*:Subdivisión de forma; x*:Subdivisión general; y*:Subdivisión cronológica; z*:Subdivisión geográfica; 0*:URI; 2:Fuente'), h: 'Enlace del lugar en español con su forma LCSH.' };
  A['755'] = { n: 'Encabezamiento enlazado — Género/forma', r: true, i1: BLANK, i2: THES, s: S('a:Término de género/forma; v*:Subdivisión de forma; y*:Subdivisión cronológica; z*:Subdivisión geográfica; 0*:URI; 2:Fuente'), h: 'Enlace del género/forma en español con su forma LCGFT/LCSH.' };
  D.BIB = B;
  D.AUT = A;

  /* ============================== VOCABULARIOS ============================== */
  D.RDA_CONTENT = [
    ['texto', 'txt'], ['texto táctil', 'tct'], ['palabra hablada', 'spw'], ['música interpretada', 'prm'],
    ['música notada', 'ntm'], ['música notada táctil', 'tcm'], ['sonidos', 'snd'], ['imagen fija', 'sti'],
    ['imagen táctil', 'tci'], ['imagen en movimiento bidimensional', 'tdi'], ['imagen en movimiento tridimensional', 'tdm'],
    ['imagen cartográfica', 'cri'], ['imagen cartográfica táctil', 'crt'], ['imagen cartográfica en movimiento', 'crm'],
    ['forma tridimensional cartográfica', 'crf'], ['conjunto de datos cartográficos', 'crd'],
    ['forma tridimensional', 'tdf'], ['forma tridimensional táctil', 'tcf'], ['movimiento notado', 'ntv'],
    ['programa informático', 'cop'], ['conjunto de datos', 'cod'], ['otro', 'xxx'], ['no especificado', 'zzz']
  ];
  D.RDA_MEDIA = [
    ['sin mediación', 'n'], ['audio', 's'], ['video', 'v'], ['computadora', 'c'], ['proyectado', 'g'],
    ['microforma', 'h'], ['microscopio', 'p'], ['estereográfico', 'e'], ['otro', 'x'], ['no especificado', 'z']
  ];
  // soporte → [término, código, medio]
  D.RDA_CARRIER = [
    ['volumen', 'nc', 'n'], ['hoja', 'nb', 'n'], ['tarjeta', 'no', 'n'], ['rollo', 'na', 'n'], ['objeto', 'nr', 'n'], ['rotafolio', 'nn', 'n'], ['otro (sin mediación)', 'nz', 'n'],
    ['disco de audio', 'sd', 's'], ['casete de audio', 'ss', 's'], ['carrete de audio', 'st', 's'], ['cartucho de audio', 'sg', 's'], ['cilindro de audio', 'se', 's'],
    ['videodisco', 'vd', 'v'], ['videocasete', 'vf', 'v'], ['cartucho de video', 'vc', 'v'], ['carrete de video', 'vr', 'v'],
    ['recurso en línea', 'cr', 'c'], ['disco de computadora', 'cd', 'c'], ['tarjeta de computadora', 'ck', 'c'], ['cartucho de disco de computadora', 'ce', 'c'], ['cartucho de chip de computadora', 'cb', 'c'],
    ['carrete de película', 'mr', 'g'], ['diapositiva', 'gs', 'g'], ['transparencia', 'gt', 'g'], ['tira de película', 'gf', 'g'],
    ['microficha', 'he', 'h'], ['carrete de microfilm', 'hd', 'h'], ['rollo de microfilm', 'hj', 'h'],
    ['diapositiva de microscopio', 'pp', 'p'], ['tarjeta estereográfica', 'eh', 'e'], ['disco estereográfico', 'es', 'e']
  ];
  // coherencia esperada Líder/06 → 336
  D.LDR06_CONTENT = {
    a: ['txt', 'tct'], t: ['txt', 'tct'], c: ['ntm', 'tcm'], d: ['ntm'], e: ['cri', 'crt', 'crd', 'crf', 'crm'], f: ['cri'],
    g: ['tdi', 'tdm', 'sti'], i: ['spw', 'snd'], j: ['prm'], k: ['sti', 'tci'], m: ['cop', 'cod', 'crd', 'txt'], o: null, p: null, r: ['tdf', 'tcf']
  };

  D.RELATORES = ['autor', 'autora', 'compilador', 'compiladora', 'editor literario', 'editora literaria', 'traductor', 'traductora', 'ilustrador', 'ilustradora',
    'prologuista', 'autor de introducción', 'autor de epílogo', 'comentarista', 'director de cine', 'directora de cine', 'director', 'guionista', 'productor', 'productora',
    'productor de cine', 'actor', 'actriz', 'intérprete', 'narrador', 'narradora', 'presentador', 'entrevistador', 'entrevistado', 'compositor', 'compositora',
    'letrista', 'cantante', 'instrumentista', 'arreglista', 'director musical', 'coreógrafo', 'fotógrafo', 'fotógrafa', 'director de fotografía', 'editor de cine',
    'animador', 'diseñador', 'diseñador gráfico', 'artista', 'pintor', 'escultor', 'cartógrafo', 'cartógrafa', 'programador', 'desarrollador',
    'organismo emisor', 'entidad patrocinadora', 'compañía productora', 'productora de cine', 'casa discográfica', 'editorial', 'institución que otorga el grado',
    'autor de tesis', 'director de tesis', 'anfitrión', 'biografiado', 'destinatario', 'titular de derechos', 'retratado'];

  D.FUENTES_MATERIA = ['lemb', 'embne', 'lcsh', 'unescot', 'bidex', 'decs', 'aat', 'local', 'lcgft', 'gsafd', 'rvmgf', 'lcdgt'];

  D.PAISES = [
    ['cl', 'Chile'], ['ag', 'Argentina'], ['bo', 'Bolivia'], ['bl', 'Brasil'], ['ck', 'Colombia'], ['cr', 'Costa Rica'], ['cu', 'Cuba'], ['ec', 'Ecuador'],
    ['es', 'El Salvador'], ['gt', 'Guatemala'], ['mx', 'México'], ['nq', 'Nicaragua'], ['pn', 'Panamá'], ['py', 'Paraguay'], ['pe', 'Perú'], ['pr', 'Puerto Rico'],
    ['dr', 'República Dominicana'], ['uy', 'Uruguay'], ['ve', 'Venezuela'], ['sp', 'España'], ['po', 'Portugal'], ['fr', 'Francia'], ['it', 'Italia'],
    ['gw', 'Alemania'], ['ne', 'Países Bajos'], ['sz', 'Suiza'], ['xxk', 'Reino Unido'], ['enk', 'Inglaterra'], ['xxu', 'Estados Unidos (sin estado)'],
    ['nyu', 'Nueva York (EE.UU.)'], ['cau', 'California (EE.UU.)'], ['flu', 'Florida (EE.UU.)'], ['xxc', 'Canadá'], ['ja', 'Japón'], ['cc', 'China'],
    ['ko', 'Corea del Sur'], ['ii', 'India'], ['ru', 'Rusia'], ['at', 'Australia'], ['xx', 'Lugar desconocido ([S.l.])'], ['vp', 'Varios lugares']
  ];
  D.LENGUAS = [
    ['spa', 'español'], ['eng', 'inglés'], ['fre', 'francés'], ['por', 'portugués'], ['ger', 'alemán'], ['ita', 'italiano'], ['lat', 'latín'], ['grc', 'griego antiguo'],
    ['gre', 'griego moderno'], ['rus', 'ruso'], ['chi', 'chino'], ['jpn', 'japonés'], ['kor', 'coreano'], ['ara', 'árabe'], ['heb', 'hebreo'], ['cat', 'catalán'],
    ['glg', 'gallego'], ['baq', 'vasco'], ['arn', 'mapudungun'], ['que', 'quechua'], ['aym', 'aymara'], ['rap', 'rapanui'], ['grn', 'guaraní'],
    ['mul', 'varias lenguas'], ['und', 'indeterminada'], ['zxx', 'sin contenido lingüístico'], ['sgn', 'lengua de señas']
  ];

  // artículos iniciales por lengua (2.º indicador del 245 / 1.º del 130)
  D.ARTICULOS = {
    spa: ['el', 'la', 'lo', 'los', 'las', 'un', 'una', 'unos', 'unas'],
    eng: ['the', 'a', 'an'],
    fre: ['le', 'la', 'les', "l'", 'un', 'une', 'des'],
    por: ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'],
    ita: ['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'"],
    ger: ['der', 'die', 'das', 'ein', 'eine', 'einen', 'dem', 'den', 'des'],
    cat: ['el', 'la', 'els', 'les', "l'", 'un', 'una']
  };

  /* ============================== LÍDER ============================== */
  D.LDR_POS = [
    { p: 5, l: 1, n: 'Estado del registro', o: { n: 'Nuevo', c: 'Corregido o revisado', a: 'Aumento de nivel de codificación', d: 'Borrado', p: 'Aumento desde prepublicación' } },
    { p: 6, l: 1, n: 'Tipo de registro', key: true, o: { a: 'Material textual (libro, revista, texto en línea)', c: 'Música notada impresa (partitura)', d: 'Música notada manuscrita', e: 'Material cartográfico (mapa, atlas)', f: 'Material cartográfico manuscrito', g: 'Medio proyectable (película, video, DVD, diapositivas)', i: 'Grabación sonora no musical (audiolibro, podcast)', j: 'Grabación sonora musical', k: 'Gráfico bidimensional no proyectable (fotografía, afiche, lámina)', m: 'Archivo de computadora (software, videojuego, datos)', o: 'Kit', p: 'Material mixto (archivo)', r: 'Objeto tridimensional (realia, maqueta, juego)', t: 'Material textual manuscrito (tesis inédita, manuscrito)' } },
    { p: 7, l: 1, n: 'Nivel bibliográfico', key: true, o: { m: 'Monografía / ítem', s: 'Publicación seriada', i: 'Recurso integrable (sitio web, base de datos)', a: 'Parte componente monográfica (capítulo)', b: 'Parte componente seriada (artículo)', c: 'Colección', d: 'Subunidad' } },
    { p: 8, l: 1, n: 'Tipo de control', o: { ' ': 'Ninguno', a: 'Archivístico' } },
    { p: 9, l: 1, n: 'Esquema de codificación de caracteres', o: { a: 'UCS / Unicode', ' ': 'MARC-8' } },
    { p: 17, l: 1, n: 'Nivel de codificación', o: { ' ': 'Nivel completo', '1': 'Completo, material no examinado', '2': 'Menor que completo, material no examinado', '3': 'Abreviado', '4': 'Nivel central (core)', '5': 'Parcial (preliminar)', '7': 'Mínimo', '8': 'Prepublicación', 'u': 'Desconocido', 'z': 'No aplica' } },
    { p: 18, l: 1, n: 'Forma de catalogación descriptiva', key: true, o: { i: 'Puntuación ISBD incluida (RDA)', a: 'AACR2', c: 'Puntuación ISBD omitida', n: 'No ISBD, puntuación omitida', ' ': 'No ISBD', u: 'Desconocida' } },
    { p: 19, l: 1, n: 'Nivel de registro de recurso multiparte', o: { ' ': 'No especificado / no aplica', a: 'Conjunto', b: 'Parte con título independiente', c: 'Parte con título dependiente' } }
  ];

  /* ============================== 008 ============================== */
  const AUD = { ' ': 'Desconocido / no especificado', a: 'Preescolar', b: 'Primaria', c: 'Preadolescente', d: 'Adolescente', e: 'Adulto', f: 'Especializado', g: 'General', j: 'Juvenil', '|': 'No se codifica' };
  const FORM = { ' ': 'Ninguna de las siguientes (impreso regular)', a: 'Microfilm', b: 'Microficha', c: 'Microopaco', d: 'Letra grande', f: 'Braille', o: 'En línea', q: 'Electrónico directo (CD, DVD-ROM)', r: 'Reproducción impresa regular', s: 'Electrónico', '|': 'No se codifica' };
  const GOV = { ' ': 'No es publicación gubernamental', a: 'Autónoma o semiautónoma', c: 'Multilocal', f: 'Federal / nacional', i: 'Internacional intergubernamental', l: 'Local', m: 'Multiestatal', o: 'Gubernamental, nivel indeterminado', s: 'Estatal / provincial / regional', u: 'Se desconoce', z: 'Otra', '|': 'No se codifica' };
  const NAT = { ' ': 'No especificada', a: 'Resúmenes', b: 'Bibliografías', c: 'Catálogos', d: 'Diccionarios', e: 'Enciclopedias', f: 'Manuales', g: 'Artículos legales', i: 'Índices', j: 'Patentes', k: 'Discografías', l: 'Legislación', m: 'Tesis', n: 'Estudios de literatura', o: 'Reseñas', p: 'Textos programados', q: 'Filmografías', r: 'Directorios', s: 'Estadísticas', t: 'Informes técnicos', u: 'Normas / especificaciones', v: 'Casos legales', w: 'Informes jurídicos', y: 'Anuarios', z: 'Tratados', '2': 'Separatas', '5': 'Calendarios', '6': 'Cómics / novelas gráficas', '|': 'No se codifica' };
  const FORM_ORIG = { ' ': 'Ninguna de las siguientes', a: 'Microfilm', b: 'Microficha', c: 'Microopaco', d: 'Letra grande', e: 'Formato de periódico', f: 'Braille', o: 'En línea', q: 'Electrónico directo', s: 'Electrónico', '|': 'No se codifica' };
  const NAT_CR = { ' ': 'No especificada', a: 'Resúmenes', b: 'Bibliografías', c: 'Catálogos', d: 'Diccionarios', e: 'Enciclopedias', f: 'Manuales', g: 'Artículos legales', h: 'Biografía', i: 'Índices', k: 'Discografías', l: 'Legislación', m: 'Tesis', n: 'Estudios de literatura en un área temática', o: 'Reseñas', p: 'Textos programados', q: 'Filmografías', r: 'Directorios', s: 'Estadísticas', t: 'Informes técnicos', u: 'Normas / especificaciones', v: 'Casos legales y notas de casos', w: 'Informes y compendios jurídicos', y: 'Anuarios', z: 'Tratados', '5': 'Calendarios', '6': 'Cómics / novelas gráficas', '|': 'No se codifica' };
  const BIN = { '0': 'No', '1': 'Sí', '|': 'No se codifica' };
  const ILL = { ' ': 'Sin ilustraciones', a: 'Ilustraciones', b: 'Mapas', c: 'Retratos', d: 'Gráficos', e: 'Planos', f: 'Láminas', g: 'Música', h: 'Facsímiles', i: 'Escudos', j: 'Tablas genealógicas', k: 'Formularios', l: 'Muestras', m: 'Grabaciones sonoras', o: 'Fotografías', p: 'Iluminaciones', '|': 'No se codifica' };

  D.F008_COMMON = [
    { p: 0, l: 6, n: 'Fecha de creación del registro (aammdd)', auto: 'date' },
    { p: 6, l: 1, n: 'Tipo de fecha', key: true, o: { b: 'Sin fechas; fecha antes de Cristo', s: 'Fecha única conocida / probable', t: 'Fecha de publicación + fecha de copyright', r: 'Reimpresión / reproducción + fecha original', m: 'Varias fechas (multiparte)', q: 'Fecha dudosa (rango)', n: 'Fechas desconocidas', c: 'Recurso continuo en curso', d: 'Recurso continuo terminado', u: 'Recurso continuo, estado desconocido', e: 'Fecha detallada (aaaa + mmdd)', i: 'Fechas inclusivas de colección', k: 'Fechas de la mayor parte de la colección', p: 'Fecha de distribución + producción', '|': 'No se codifica' } },
    { p: 7, l: 4, n: 'Fecha 1 (año de publicación)', key: true, ph: 'aaaa (usa u para dígitos desconocidos: 19uu)' },
    { p: 11, l: 4, n: 'Fecha 2 (copyright, original, término)', ph: 'aaaa o 4 espacios' },
    { p: 15, l: 3, n: 'Lugar de publicación (código de país)', key: true, list: 'PAISES', ph: 'cl + espacio, nyu, xxu…' },
    { p: 35, l: 3, n: 'Lengua', key: true, list: 'LENGUAS', ph: 'spa' },
    { p: 38, l: 1, n: 'Registro modificado', o: { ' ': 'No modificado', d: 'Se omitió información (dashed-on)', o: 'Completamente romanizado', r: 'Completamente romanizado / tarjeta en escritura original', s: 'Abreviado', x: 'Faltan caracteres', '|': 'No se codifica' } },
    { p: 39, l: 1, n: 'Fuente de la catalogación', o: { ' ': 'Agencia bibliográfica nacional', c: 'Programa de catalogación cooperativa', d: 'Otra fuente', u: 'Desconocida', '|': 'No se codifica' } }
  ];
  D.F008 = {
    BK: { n: 'BK — Libros', pos: [
      { p: 18, l: 4, n: 'Ilustraciones (hasta 4 códigos)', multi: ILL },
      { p: 22, l: 1, n: 'Público destinatario', o: AUD },
      { p: 23, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 24, l: 4, n: 'Naturaleza del contenido (hasta 4)', multi: NAT },
      { p: 28, l: 1, n: 'Publicación gubernamental', o: GOV },
      { p: 29, l: 1, n: 'Publicación de congreso', o: BIN },
      { p: 30, l: 1, n: 'Publicación de homenaje', o: BIN },
      { p: 31, l: 1, n: 'Índice', o: BIN },
      { p: 32, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 33, l: 1, n: 'Forma literaria', o: { '0': 'No ficción', '1': 'Ficción (sin especificar)', d: 'Drama', e: 'Ensayos', f: 'Novelas', h: 'Humor, sátira', i: 'Cartas', j: 'Cuentos', m: 'Formas mixtas', p: 'Poesía', s: 'Discursos', u: 'Desconocida', '|': 'No se codifica' } },
      { p: 34, l: 1, n: 'Biografía', o: { ' ': 'Sin material biográfico', a: 'Autobiografía', b: 'Biografía individual', c: 'Biografía colectiva', d: 'Contiene información biográfica', '|': 'No se codifica' } }
    ] },
    CR: { n: 'CR — Recursos continuos', pos: [
      { p: 18, l: 1, n: 'Frecuencia', o: { ' ': 'Sin frecuencia determinable', a: 'Anual', b: 'Bimestral', c: 'Dos veces por semana', d: 'Diaria', e: 'Quincenal', f: 'Semestral', g: 'Bienal', h: 'Trienal', i: 'Tres veces por semana', j: 'Tres veces al mes', k: 'Actualización continua', m: 'Mensual', q: 'Trimestral', s: 'Dos veces al mes', t: 'Tres veces al año (cuatrimestral)', u: 'Desconocida', w: 'Semanal', z: 'Otra', '|': 'No se codifica' } },
      { p: 19, l: 1, n: 'Regularidad', o: { r: 'Regular', n: 'Irregular normalizada', x: 'Completamente irregular', u: 'Desconocida', '|': 'No se codifica' } },
      { p: 20, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 21, l: 1, n: 'Tipo de recurso continuo', o: { ' ': 'Ninguno de los siguientes', a: 'Informe de actividades', d: 'Base de datos actualizable', g: 'Revista de divulgación (magazine)', h: 'Blog', i: 'Fanzine seriado', j: 'Revista académica (journal)', l: 'Hojas sueltas actualizables', m: 'Serie monográfica', n: 'Periódico', p: 'Publicación periódica', q: 'Pódcast seriado', r: 'Repositorio', s: 'Boletín informativo', t: 'Directorio', w: 'Sitio web actualizable', '|': 'No se codifica' } },
      { p: 22, l: 1, n: 'Forma del ítem original', o: FORM_ORIG },
      { p: 23, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 24, l: 1, n: 'Naturaleza de la obra completa', o: NAT_CR },
      { p: 25, l: 3, n: 'Naturaleza del contenido (hasta 3)', multi: NAT_CR },
      { p: 28, l: 1, n: 'Publicación gubernamental', o: GOV },
      { p: 29, l: 1, n: 'Publicación de congreso', o: BIN },
      { p: 30, l: 3, n: 'Indefinidas', fixed: '   ' },
      { p: 33, l: 1, n: 'Alfabeto original del título', o: { ' ': 'Sin título clave', a: 'Latino básico', b: 'Latino extendido', c: 'Cirílico', d: 'Japonés', e: 'Chino', f: 'Árabe', g: 'Griego', h: 'Hebreo', u: 'Desconocido', z: 'Otro', '|': 'No se codifica' } },
      { p: 34, l: 1, n: 'Convención de asiento', o: { '0': 'Asiento sucesivo', '1': 'Asiento por el último título', '2': 'Asiento integrado', '|': 'No se codifica' } }
    ] },
    VM: { n: 'VM — Materiales visuales', pos: [
      { p: 18, l: 3, n: 'Duración (minutos, 3 dígitos)', ph: '095 · 000 = más de 999 · --- desconocida · nnn no aplica' },
      { p: 21, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 22, l: 1, n: 'Público destinatario', o: AUD },
      { p: 23, l: 5, n: 'Indefinidas', fixed: '     ' },
      { p: 28, l: 1, n: 'Publicación gubernamental', o: GOV },
      { p: 29, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 30, l: 3, n: 'Indefinidas', fixed: '   ' },
      { p: 33, l: 1, n: 'Tipo de material visual', o: { v: 'Grabación de video (DVD, video en línea)', m: 'Película cinematográfica', i: 'Imagen (fotografía, afiche, postal)', k: 'Gráfico', a: 'Arte original', c: 'Reproducción de arte', l: 'Dibujo técnico', n: 'Lámina / carta', o: 'Tarjeta didáctica', s: 'Diapositiva', t: 'Transparencia', f: 'Tira de película', b: 'Kit', d: 'Diorama', g: 'Juego', q: 'Modelo / maqueta', r: 'Realia (objeto real)', w: 'Juguete', p: 'Preparación microscópica', z: 'Otro', '|': 'No se codifica' } },
      { p: 34, l: 1, n: 'Técnica', o: { l: 'Acción real', a: 'Animación', c: 'Animación y acción real', n: 'No aplica', u: 'Desconocida', z: 'Otra', '|': 'No se codifica' } }
    ] },
    MU: { n: 'MU — Música', pos: [
      { p: 18, l: 2, n: 'Forma de la composición', o: { an: 'Himnos (anthems)', bd: 'Baladas', bg: 'Bluegrass', bl: 'Blues', bt: 'Ballets', ca: 'Chaconas', cb: 'Cantos de otras religiones', cc: 'Canto cristiano', cg: 'Concerti grossi', ch: 'Corales', cl: 'Preludios corales', cn: 'Cánones y rondas', co: 'Conciertos', cp: 'Chansons polifónicas', cr: 'Villancicos ingleses (carols)', cs: 'Composiciones aleatorias', ct: 'Cantatas', cy: 'Música country', cz: 'Canzonas', df: 'Formas de danza', dv: 'Divertimentos, serenatas, casaciones, divertissements y notturni', fg: 'Fugas', fl: 'Flamenco', fm: 'Música folclórica', ft: 'Fantasías', gm: 'Música gospel', hy: 'Himnos (hymns)', jz: 'Jazz', mc: 'Revistas y comedias musicales', md: 'Madrigales', mi: 'Minuetos', mo: 'Motetes', mp: 'Música de películas', mr: 'Marchas', ms: 'Misas', mu: 'Varias formas', mz: 'Mazurcas', nc: 'Nocturnos', nn: 'No aplica', op: 'Óperas', or: 'Oratorios', ov: 'Oberturas', pg: 'Música programática', pm: 'Música de pasión', po: 'Polonesas', pp: 'Música popular', pr: 'Preludios', ps: 'Passacaglias', pt: 'Canciones a varias voces (part-songs)', pv: 'Pavanas', rc: 'Música rock', rd: 'Rondós', rg: 'Ragtime', ri: 'Ricercares', rp: 'Rapsodias', rq: 'Réquiems', sd: 'Música de square dance', sg: 'Canciones', sn: 'Sonatas', sp: 'Poemas sinfónicos', st: 'Estudios y ejercicios', su: 'Suites', sy: 'Sinfonías', tc: 'Tocatas', tl: 'Teatro lírico', ts: 'Sonatas en trío', uu: 'Desconocida', vi: 'Villancicos', vr: 'Variaciones', wz: 'Valses', za: 'Zarzuelas', zz: 'Otra', '||': 'No se codifica' } },
      { p: 20, l: 1, n: 'Formato de la música', o: { n: 'No aplica (grabación)', a: 'Partitura completa', b: 'Partitura de bolsillo / estudio', c: 'Acompañamiento reducido para teclado', d: 'Partitura vocal sin acompañamiento', e: 'Partitura condensada / piano director', g: 'Partitura cerrada', h: 'Partitura coral', i: 'Partitura condensada', j: 'Parte de intérprete-director', k: 'Partitura vocal', l: 'Partitura', m: 'Varios formatos', p: 'Partitura para piano', u: 'Desconocido', z: 'Otro', '|': 'No se codifica' } },
      { p: 21, l: 1, n: 'Partes musicales', o: { ' ': 'Sin partes o no especificado', d: 'Partes instrumentales y vocales', e: 'Partes instrumentales', f: 'Partes vocales', n: 'No aplica', u: 'Desconocido', '|': 'No se codifica' } },
      { p: 22, l: 1, n: 'Público destinatario', o: AUD },
      { p: 23, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 24, l: 6, n: 'Material anejo (hasta 6)', multi: { ' ': 'Sin material anejo', a: 'Discografía', b: 'Bibliografía', c: 'Índice temático', d: 'Libreto o texto', e: 'Biografía del compositor', f: 'Biografía del intérprete / historia del conjunto', g: 'Notas técnicas sobre instrumentos', h: 'Notas técnicas sobre la música', i: 'Notas históricas', k: 'Notas étnicas', r: 'Instrucciones', s: 'Música', z: 'Otro', '|': 'No se codifica' } },
      { p: 30, l: 2, n: 'Texto literario (grabaciones no musicales)', multi: { ' ': 'Grabación musical', a: 'Autobiografía', b: 'Biografía', c: 'Actas de congresos', d: 'Drama', e: 'Ensayos', f: 'Ficción', g: 'Informes', h: 'Historia', i: 'Instrucción', j: 'Aprendizaje de idiomas', k: 'Comedia', l: 'Conferencias, discursos', m: 'Memorias', n: 'No aplica', o: 'Cuentos folclóricos', p: 'Poesía', r: 'Ensayos (teatrales)', s: 'Sonidos', t: 'Entrevistas', z: 'Otro', '|': 'No se codifica' } },
      { p: 32, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 33, l: 1, n: 'Transposición y arreglo', o: { ' ': 'Ni transposición ni arreglo', a: 'Transposición', b: 'Arreglo', c: 'Transposición y arreglo', n: 'No aplica', u: 'Desconocido', '|': 'No se codifica' } },
      { p: 34, l: 1, n: 'Indefinida', fixed: ' ' }
    ] },
    MP: { n: 'MP — Mapas', pos: [
      { p: 18, l: 4, n: 'Relieve (hasta 4)', multi: { ' ': 'Sin relieve', a: 'Curvas de nivel', b: 'Sombreado', c: 'Gradiente de tintas', d: 'Normales (hachures)', e: 'Batimetría / sondas', f: 'Curvas de forma', g: 'Cotas', i: 'Pictórico', j: 'Formas del terreno', k: 'Batimetría / isolíneas', m: 'Dibujo de roca', z: 'Otro', '|': 'No se codifica' } },
      { p: 22, l: 2, n: 'Proyección', o: { '  ': 'Proyección no especificada', aa: 'Aitoff', ab: 'Gnomónica', ac: 'Acimutal equivalente de Lambert', ad: 'Ortográfica', ae: 'Acimutal equidistante', af: 'Estereográfica', ag: 'Perspectiva vertical general', am: 'Estereográfica modificada para Alaska', an: 'Trimétrica de Chamberlin', ap: 'Estereográfica polar', au: 'Acimutal, tipo no especificado', az: 'Acimutal, otra', ba: 'Gall', bb: 'Homolográfica de Goode', bc: 'Cilíndrica equivalente de Lambert', bd: 'Mercator', be: 'Miller', bf: 'Mollweide', bg: 'Sinusoidal', bh: 'Mercator transversa', bi: 'Gauss-Krüger', bj: 'Equirrectangular', bk: 'Krovak', bl: 'Cassini-Soldner', bo: 'Mercator oblicua', br: 'Robinson', bs: 'Mercator oblicua espacial', bu: 'Cilíndrica, tipo no especificado', bz: 'Cilíndrica, otra', ca: 'Cónica equivalente de Albers', cb: 'Bonne', cc: 'Cónica conforme de Lambert', ce: 'Cónica equidistante', cp: 'Policónica', cu: 'Cónica, tipo no especificado', cz: 'Cónica, otra', da: 'Armadillo', db: 'Mariposa', dc: 'Eckert', dd: 'Homolosena de Goode', de: 'Cónica conforme oblicua bipolar de Miller', df: 'Van der Grinten', dg: 'Dymaxion', dh: 'Cordiforme', dl: 'Conforme de Lambert', zz: 'Otra', '||': 'No se codifica' } },
      { p: 24, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 25, l: 1, n: 'Tipo de material cartográfico', o: { a: 'Mapa individual', b: 'Serie de mapas', c: 'Serie de mapas seriada', d: 'Globo', e: 'Atlas', f: 'Mapa separado, suplemento de otra obra', g: 'Mapa encuadernado en otra obra', r: 'Imagen de teledetección', u: 'Desconocido', z: 'Otro', '|': 'No se codifica' } },
      { p: 26, l: 2, n: 'Indefinidas', fixed: '  ' },
      { p: 28, l: 1, n: 'Publicación gubernamental', o: GOV },
      { p: 29, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 30, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 31, l: 1, n: 'Índice', o: BIN },
      { p: 32, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 33, l: 2, n: 'Características especiales de formato (hasta 2)', multi: { ' ': 'Ninguna', e: 'Manuscrito', j: 'Tarjeta postal', k: 'Calendario', l: 'Rompecabezas', n: 'Juego', o: 'Mapa mural', p: 'Naipes', r: 'Hoja suelta', z: 'Otro', '|': 'No se codifica' } }
    ] },
    CF: { n: 'CF — Archivos de computadora', pos: [
      { p: 18, l: 4, n: 'Indefinidas', fixed: '    ' },
      { p: 22, l: 1, n: 'Público destinatario', o: AUD },
      { p: 23, l: 1, n: 'Forma del ítem', o: { ' ': 'Desconocido o no especificado', o: 'En línea', q: 'Electrónico directo', '|': 'No se codifica' } },
      { p: 24, l: 2, n: 'Indefinidas', fixed: '  ' },
      { p: 26, l: 1, n: 'Tipo de archivo de computadora', o: { a: 'Datos numéricos', b: 'Programa', c: 'Representación gráfica', d: 'Documento', e: 'Datos bibliográficos', f: 'Fuente tipográfica', g: 'Juego', h: 'Sonido', i: 'Multimedia interactivo', j: 'Sistema o servicio en línea', m: 'Combinación', u: 'Desconocido', z: 'Otro', '|': 'No se codifica' } },
      { p: 27, l: 1, n: 'Indefinida', fixed: ' ' },
      { p: 28, l: 1, n: 'Publicación gubernamental', o: GOV },
      { p: 29, l: 6, n: 'Indefinidas', fixed: '      ' }
    ] },
    MX: { n: 'MX — Materiales mixtos', pos: [
      { p: 18, l: 5, n: 'Indefinidas', fixed: '     ' },
      { p: 23, l: 1, n: 'Forma del ítem', o: FORM },
      { p: 24, l: 11, n: 'Indefinidas', fixed: '           ' }
    ] }
  };
  // Líder 06/07 → tipo de 008
  // Aplicabilidad del 008/18-34 según MARC 21 (LC): Líder/06 y Líder/07
  D.tipo008 = function (ldr) {
    const t = (ldr || '')[6] || 'a', b = (ldr || '')[7] || 'm';
    if (t === 'a' && 'bis'.includes(b)) return 'CR';
    if ('at'.includes(t)) return 'BK';
    if ('cdij'.includes(t)) return 'MU';
    if ('ef'.includes(t)) return 'MP';
    if ('gkor'.includes(t)) return 'VM';
    if (t === 'm') return 'CF';
    if (t === 'p') return 'MX';
    return 'BK';
  };
  // Formato del registro para el catálogo y la planilla: la plantilla puede fijarlo
  // (p. ej. el libro electrónico de la planilla UTEM es «Libros (BK)» aunque su Líder/06 sea m)
  D.fmtRegistro = function (rec) {
    const t = rec.tpl && D.PLANTILLAS ? D.PLANTILLAS.find(x => x.id === rec.tpl) : null;
    if (t && t.fmt && (rec.ldr || '')[6] === t.ldr[0]) return t.fmt;
    const l = rec.ldr || '';
    if (l[6] === 'm' && (rec.fields || []).some(f => f.tag === '336' && (f.subs || []).some(s => (s.c === 'a' && /^texto$/i.test(s.v.trim())) || (s.c === 'b' && s.v.trim() === 'txt')))) return 'BK';
    return D.tipo008(l);
  };
  // 006/00 → configuración equivalente del 008/18-34
  D.F006_00 = { a: 'Material textual', t: 'Material textual manuscrito', c: 'Música notada', d: 'Música notada manuscrita', i: 'Grabación sonora no musical', j: 'Grabación sonora musical', e: 'Material cartográfico', f: 'Material cartográfico manuscrito', g: 'Medio proyectable', k: 'Gráfico bidimensional no proyectable', o: 'Kit', r: 'Objeto tridimensional', m: 'Archivo de computadora / recurso electrónico', p: 'Material mixto', s: 'Recurso continuo (seriada / integrable)' };
  D.tipo006 = c => ({ a: 'BK', t: 'BK', c: 'MU', d: 'MU', i: 'MU', j: 'MU', e: 'MP', f: 'MP', g: 'VM', k: 'VM', o: 'VM', r: 'VM', m: 'CF', p: 'MX', s: 'CR' }[c] || 'BK');
  // Los siete formatos (configuraciones del 008) que usan los sistemas de catalogación
  D.FORMATOS = [
    { k: 'BK', n: 'Libros', ldr: 'Líder/06 a, t · Líder/07 a, c, d, m', d: 'Material textual monográfico, impreso, manuscrito o electrónico: libros, tesis, folletos, manuscritos.' },
    { k: 'CR', n: 'Recursos continuos', ldr: 'Líder/06 a · Líder/07 b, i, s', d: 'Publicaciones seriadas, partes componentes seriadas y recursos integrables: revistas, periódicos, artículos, sitios web, bases de datos.' },
    { k: 'VM', n: 'Materiales visuales', ldr: 'Líder/06 g, k, o, r', d: 'Medios proyectables, gráficos bidimensionales, kits y objetos tridimensionales: películas, videos, fotografías, afiches, objetos.' },
    { k: 'MU', n: 'Música', ldr: 'Líder/06 c, d, i, j', d: 'Música notada y grabaciones sonoras, musicales o no: partituras, CD, podcasts, audiolibros.' },
    { k: 'MP', n: 'Mapas', ldr: 'Líder/06 e, f', d: 'Material cartográfico impreso o manuscrito: mapas, atlas, globos.' },
    { k: 'CF', n: 'Archivos de computadora', ldr: 'Líder/06 m', d: 'Software, videojuegos, datos numéricos, sistemas en línea. (Un libro electrónico sigue siendo BK.)' },
    { k: 'MX', n: 'Materiales mixtos', ldr: 'Líder/06 p', d: 'Colecciones de archivo con varias formas de material.' }
  ];

  /* ============================== 007 ============================== */
  D.F007 = [
    { v: 'ta', n: 'Texto impreso regular (opcional en libros)' },
    { v: 'tb', n: 'Texto en letra grande' },
    { v: 'tc', n: 'Texto en braille' },
    { v: 'cr |||||||||||', n: 'Recurso electrónico remoto (en línea): PDF, sitio web, ebook, streaming' },
    { v: 'co |||||||||||', n: 'Disco óptico de computadora (CD-ROM, DVD-ROM)' },
    { v: 'vd cvaizs', n: 'Videodisco (DVD) en color, sonoro, estéreo' },
    { v: 'vd bvaizs', n: 'Videodisco (DVD) en blanco y negro, sonoro' },
    { v: 'vf cbahos', n: 'Videocasete (VHS) en color, sonoro' },
    { v: 'mr '+'|'.repeat(20), n: 'Película cinematográfica en carrete' },
    { v: 'sd fsngnnmmned', n: 'Disco de audio (CD) digital, estéreo, 12 cm' },
    { v: 'ss '+'|'.repeat(11), n: 'Casete de audio' },
    { v: 'sd b'+'|'.repeat(10), n: 'Disco de vinilo (LP) 33 1/3 rpm' },
    { v: 'aj canzn', n: 'Mapa impreso en color, sobre papel' },
    { v: 'aj aanzn', n: 'Mapa impreso en una sola tinta, sobre papel' },
    { v: 'ad canzn', n: 'Atlas' },
    { v: 'kh bo|', n: 'Fotografía (impresión fotográfica) en blanco y negro' },
    { v: 'kh co|', n: 'Fotografía (impresión fotográfica) en color' },
    { v: 'kk co|', n: 'Afiche / póster en color' },
    { v: 'kp co|', n: 'Tarjeta postal en color' },
    { v: 'kj |||', n: 'Grabado (estampa)' },
    { v: 'qu', n: 'Música notada (partitura) — designación no especificada' },
    { v: 'zm', n: 'Material no especificado — varias formas' }
  ];
  D.F007_CAT = { a: 'Mapa', c: 'Recurso electrónico', d: 'Globo', f: 'Material táctil', g: 'Gráfico proyectable', h: 'Microforma', k: 'Gráfico no proyectable', m: 'Película cinematográfica', o: 'Kit', q: 'Música notada', r: 'Imagen de teledetección', s: 'Grabación sonora', t: 'Texto', v: 'Grabación de video', z: 'No especificado' };

  /* ============================== Koha 942 ============================== */
  D.KOHA_TIPOS = [['LIB', 'Libro'], ['REF', 'Referencia'], ['TESIS', 'Tesis / memoria'], ['REV', 'Revista / seriada'], ['ELEC', 'Recurso electrónico'], ['DVD', 'Video / DVD'],
    ['CD', 'Grabación sonora'], ['AUDIO', 'Audiolibro / podcast'], ['PART', 'Partitura'], ['MAPA', 'Mapa'], ['FOTO', 'Imagen fija / fotografía'], ['OBJ', 'Objeto'], ['SOFT', 'Software / juego'], ['MAN', 'Manuscrito / archivo']];
})(window.DD2);
