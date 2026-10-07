# Taller de Catalogación · Descripción Documental II

Catálogo de práctica en **MARC 21 y RDA** para la asignatura *Descripción Documental II* (Bibliotecología y Documentación, UTEM). Permite a los estudiantes describir todo tipo de recursos —desde un libro hasta una pieza audiovisual— y registrar libremente **nombres de personas, entidades y materias**, con su control de autoridades, algo que no permite el demo público de Koha.

Funciona por completo en el navegador: no necesita servidor, base de datos ni cuentas. Cada estudiante trabaja en su propio navegador y entrega un archivo exportado.

## Qué incluye

- **Registros organizados por los 7 formatos MARC 21**, como en Koha, MarcEdit u OCLC: **BK** libros, **CR** recursos continuos, **VM** materiales visuales, **MU** música, **MP** mapas, **CF** archivos de computadora y **MX** materiales mixtos. El formato lo determinan el Líder/06-07 y define el 008/18-34. Dentro de cada formato hay precargas para recursos concretos (19 en total: libro, traducción, libro electrónico con 006, tesis, manuscrito, revista, artículo, sitio web, DVD, video en línea, fotografía/afiche, objeto, CD, podcast, partitura, mapa, software, colección de archivo y registro mínimo).
- **10 plantillas de autoridad** según RDA / IFLA LRM: persona, familia, entidad corporativa, evento, obra, expresión, obra anónima, materia, lugar y género/forma.
- **Editor tipo Koha** con bloques 0-9, indicadores con sus valores posibles, subcampos con nombre, campos repetibles y ayuda por campo.
- **Asistentes** para el Líder, el 008 (según el formato), el 006 y el 008 de autoridades, con los códigos oficiales de MARC 21 (Library of Congress) traducidos al español; valores frecuentes del 007; autocompletado de vocabularios RDA, códigos de país y lengua, designadores de relación y fuentes de materia.
- **Control de autoridades**: vincular 1XX/6XX/7XX/8XX con una autoridad (subcampo $9, como Koha), crear la autoridad desde el campo y sincronizar automáticamente los registros cuando se corrige la forma autorizada.
- **Control de calidad** con las reglas del curso: posiciones del esqueleto, coherencia 008 / 041 / 264, indicadores del 245 (artículos iniciales), puntuación ISBD, 336/337/338 y su coherencia con el Líder, series 490/830, materias y $2, términos de relación, ISBN, campos característicos por material, núcleo RDA + MARC, etc. Algunas correcciones mecánicas se pueden aplicar con un clic.
- **Vistas**: OPAC, MARC, ISBD, ficha catalográfica, **WEMI** (obra, expresión, manifestación, ítem), .mrk y MARCXML.
- **Índices de puntos de acceso** que muestran cómo el catálogo agrupa los registros y detectan formas no normalizadas.
- **Importar / exportar**: respaldo JSON, MARCXML, MarcEdit (.mrk), ISO 2709 (.mrc), texto MARC pegado (`245 10 $a …`) e informe de entrega imprimible en PDF.
- **Guía de referencia** con el mapa de campos, las reglas por campo, la codificación del esqueleto, el vocabulario RDA y pistas por tipo de material.
- Ejemplos del curso, incluido un registro con errores intencionales para ejercitar la corrección.

## Planilla de catalogación UTEM

La herramienta funciona como interfaz para completar la planilla de la biblioteca (`assets/planilla_catalogacion_UTEM.xlsx`), sin que los estudiantes tengan que trabajar directamente en ella.

- **Mis datos → Planilla de catalogación UTEM → Descargar planilla con mis registros (.xlsx):** genera una copia de la planilla con una fila por registro en la hoja «Campos a completar», desde la fila 4. Conserva las hojas de ejemplo, la lista de formatos y las fórmulas de las celdas que el registro no completa.
- **Convenciones de la planilla:** `^` para los espacios del Líder, 006, 007 y 008 (con `------` en 008/00-05), `#` para los indicadores en blanco, FMT «Libros (BK)» / «Materiales visuales (VM)», y la fecha de copyright del 264 #4 en la columna $a.
- **Informe al descargar:** lista lo que no cupo (campos o subcampos sin columna, ocurrencias de más) y los campos que la planilla marca como obligatorios y faltan.
- **Pestaña «Planilla UTEM»** en cada registro: muestra columna por columna cómo quedará, y el botón **Copiar fila para la planilla** permite pegarlo directamente en Excel.
- **Plantillas «Planilla UTEM»** (destacadas al inicio de «Nuevo registro»): *Libro electrónico* y *Fotografía digitalizada*. Traen todos los campos de la hoja «Campos a completar» y los valores de las hojas «Ejemplo Libro electrónico» y «Ejemplo Fotografía» (Líder, 006, 007, 008, 040 clsabn, 245 $h, 506, 516, 541, 655, 905, 949). El control de calidad no sugiere en ellas campos que la planilla no contempla. Las demás plantillas siguen disponibles para practicar.
- **Si la planilla cambia:** reemplaza `assets/planilla_catalogacion_UTEM.xlsx` en el repositorio. Las columnas se leen de las filas 1 y 2 de la hoja, así que no hay que modificar el código mientras se mantenga esa estructura. `js/planilla-base.js` es una copia de respaldo para usar la herramienta sin conexión; también se puede subir otra versión desde «Mis datos» sin tocar el repositorio.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo, `taller-catalogacion`).
2. Sube todo el contenido de esta carpeta (`index.html`, `assets/`, `js/`, `README.md`, `.nojekyll`) a la raíz del repositorio. Puedes arrastrar los archivos en *Add file → Upload files*.
3. Ve a **Settings → Pages**, en *Build and deployment* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. En uno o dos minutos el sitio queda disponible en `https://<tu-usuario>.github.io/taller-catalogacion/`. Ese es el enlace que se comparte con los estudiantes (por ejemplo, en Canvas).

También funciona sin internet: basta con abrir `index.html` en Chrome, Firefox o Edge.

## Indicaciones para los estudiantes

- El trabajo se guarda **solo en el navegador y computador** que usan. Si cambian de equipo, usan una ventana privada o borran los datos de navegación, se pierde.
- Al terminar cada sesión: **Mis datos → Respaldo completo (.json)**. Para retomar en otro equipo: **Mis datos → Importar → Reemplazar todo mi catálogo**.
- Para entregar: completar el perfil (nombre y sección) y subir a Canvas el respaldo `.json` y/o el **Informe de entrega** guardado como PDF.

## Para la docente

- Para revisar entregas, importe el `.json` de cada estudiante en *Mis datos → Importar* (modo «Agregar»): los registros conservan sus vínculos y quedan marcados con el nombre de quien los hizo. Conviene usar un perfil de navegador aparte para la revisión.
- Para distribuir un ejercicio, pegue los registros en texto MARC o entregue un `.mrk` / MARCXML que los estudiantes importen.
- Los registros exportados en MARCXML o ISO 2709 pueden importarse en una instancia real de Koha (*Herramientas → Preparar registros MARC para importación*) o abrirse en MarcEdit.

## Personalizar

| Archivo | Contenido |
|---|---|
| `js/definiciones.js` | Diccionario MARC 21 (etiquetas, indicadores, subcampos y textos de ayuda), vocabularios RDA, códigos de país y lengua, designadores de relación, posiciones del Líder, 008 y 007. |
| `js/plantillas.js` | Plantillas por tipo de material y de autoridad, y los registros de ejemplo. Los campos se escriben en la notación del curso: `"245 10 $a $b $c"`. |
| `js/validacion.js` | Reglas del control de calidad. |
| `js/marc.js` | Importación/exportación y generación de las vistas ISBD, ficha, OPAC y WEMI. |
| `js/app.js` | Interfaz. |
| `assets/estilos.css` | Diseño (incluye modo oscuro e impresión). |

## Fuentes

Material de la asignatura (mapa de campos, reglas por campo, guías de laboratorio y de puntos de acceso); *Reglas de Catalogación*, ed. nuevamente revisada, 1999; Library of Congress, *MARC 21 Format for Bibliographic Data* y *MARC 21 Format for Authority Data*; RDA Toolkit; Riva, Le Bœuf y Žumer, *IFLA Library Reference Model* (2017).

La herramienta tiene fines didácticos. El control de calidad aplica reglas generales y no reemplaza la revisión del registro contra la fuente ni la consulta de la documentación normativa vigente.

---
Profesora Nicol Coccio Muñoz · Descripción Documental II · 2026
