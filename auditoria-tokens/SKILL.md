---
name: auditoria-tokens
description: Audita todo el sistema visual de una web (su CSS) o de un archivo de Figma (sus variables, estilos y capas) y entrega un informe de hallazgos ordenados por gravedad, cada uno con dónde está, cuánto falla y una propuesta concreta. Cubre color y contraste WCAG 2.2, tipografía, espaciado, radios, bordes, sombras, opacidad, z-index, breakpoints, transiciones y animaciones, el nivel de tokenización (cuánto usa variables y cuánto valores escritos a mano), duplicados y escalas desordenadas, estructura de los tokens (alias, modos, nombres, scopes, code syntax) y la accesibilidad que se ve en el CSS (foco, zoom, reducir movimiento, tamaños mínimos). Úsala siempre que se pida auditar, revisar, evaluar, analizar, comprobar o "ver si está bien" el CSS, el sistema de diseño, la paleta, la tipografía, los espaciados, las variables o los tokens de una web o un archivo, aunque no se diga "auditoría". No la uses cuando se pida algo "sencillo" o "rápido" (por ejemplo, "un informe sencillo de contraste") salvo que se nombre esta skill: en ese caso haz una revisión ligera sin ella y, al terminar, pregunta si se quiere la auditoría completa. Solo documenta, no cambia nada. Para montar una página de consulta en Figma se usa la skill showcase-tokens, no esta.
---

# Auditoría del sistema visual (todo el CSS)

Objetivo: decir con números **qué está mal en el sistema visual, dónde, cuánto importa y cómo arreglarlo**, sin tocar nada. El resultado es un informe en Markdown. Si se pide, también una página en Figma con cada hallazgo y su ejemplo visual antes → después (sección 6). La página de consulta de los tokens es otra cosa y la hace la skill `showcase-tokens`.

Por qué así: una auditoría vale por lo accionable que es. Un hallazgo sin ubicación, sin medida o sin propuesta no ayuda a nadie a decidir. Y quien audita no debe arreglar por su cuenta: la persona tiene que ver el diagnóstico completo antes de elegir qué cambiar.

## Reglas de base

- **Solo lectura.** No modifiques el CSS, ni variables, estilos, componentes o pantallas. Si la persona pide arreglar algo, sigue la skill `accesibilidad`: explica qué falla, da 2 o 3 opciones con su efecto (incluida dejarlo como está) y espera a que elija.
- **Mide, no supongas.** Calcula con valores reales: en web, los declarados en el CSS descargado (resolviendo variables y evaluando los tamaños fluidos a 1440 y 375 px); en Figma, los resueltos en cada modo, siguiendo alias y componiendo transparencias. Distingue en el informe lo **medido** de lo **supuesto** (por ejemplo, pares de contraste deducidos por el nombre de los tokens).
- **No inventes valores.** Las propuestas usan primero lo que ya existe en el sistema. Si hace falta un valor nuevo, dalo con su efecto (ratio, escala resultante) y márcalo como "valor nuevo".
- **Di lo que no has podido comprobar** (hojas de estilo de otro dominio, páginas no visitadas, estados que solo aparecen al interactuar, librerías externas). Es parte del resultado, no un fallo.
- Números en formato español: `4,47 : 1`, `16 px`. Los ratios de contraste se **truncan** a 2 decimales, no se redondean: 4,499 no llega a 4,5.

## 1. Alcance y fuente

Si la petición no deja claro qué revisar, pregunta antes de empezar: qué web o archivo, qué páginas, y si quieres **todo** o solo algunas categorías (color, tipografía, espaciado…). Por defecto se audita todo.

**Web**
- **Si la persona pide usar el MCP de Playwright** (o "con navegador"), no descargues con Node: ve directamente al camino de Playwright del paso 3 de "Si no se puede conectar". Si el MCP no está conectado en la sesión, díselo y pregunta si sigue sin navegador.
- Si no lo pide, ejecuta `node ~/.claude/skills/auditoria-tokens/scripts/extraer-css-url.js <url> <carpeta>`, con la carpeta en el scratchpad. Descarga el HTML y todas las hojas de estilo (también las de otro dominio y las de `@import`), las guarda en `<carpeta>/css/` y escribe `<carpeta>/extraccion.json`. No necesita navegador ni instalar nada.
- Lee primero `aviso` y `hojasFallidas`. Si hay `aviso`, para y sigue "Si no se puede conectar" (abajo). Si solo fallan algunas hojas, sigue y ponlas en "No comprobado".
- Revisa `temas`: los selectores que redefinen muchas variables (temas por clase, "placas", modos) son modos del sistema. Audítalos todos.
- Si la web tiene varias plantillas (home, listado, ficha, formulario), pasa el script por una URL de cada una. Si no puedes, dilo en "No comprobado".
- Copia siempre a "No comprobado" las `limitaciones` del JSON. Sin pintar la página no se puede medir el contraste real (opacidades heredadas, texto sobre imagen o degradado, fondos en pseudo-elementos o shadow DOM) ni lo que añade JavaScript.

**Si no se puede conectar** (`aviso` en el JSON)

No sigas con datos a medias ni intentes saltarte el bloqueo (cambiar de cliente, reintentar con otra identidad, resolver verificaciones): la web ha dicho que no. Avisa a la persona y recomiéndale qué hacer:

1. **Dile qué ha pasado** en una frase, según `aviso.tipo`:
   - `bloqueo`: "La web bloquea las descargas que no vienen de un navegador (respondió <HTTP y motivo>)".
   - `sin-hojas`: "La página no trae hojas de estilo en el HTML; el CSS lo genera JavaScript al cargar".
   - `sin-conexion`: "No se pudo conectar con la web" (URL mal escrita, web caída o sin internet). Pide que compruebe la URL antes de ofrecer lo demás.
2. **Pregunta cómo seguir** con la herramienta de preguntas (`AskUserQuestion`), estas opciones en este orden:
   - **Usar el MCP de Playwright (Recomendado)**: abre la web en un navegador de verdad. Sale todo, incluido el contraste real sobre lo que se ve en pantalla (opacidades, texto sobre fotos), a 1440 y 375 px. Necesita tener el MCP de Playwright conectado.
   - **Guardar la página tú**: en el navegador, "Guardar como → Página web completa", y pasarme el archivo `.html`. Sale lo mismo que sin bloqueo (variables, tokenización, duplicados, temas, tamaños fluidos), pero sin el contraste real.
   - **Pasarme las hojas CSS**: las URLs o archivos `.css` (en las herramientas de desarrollador, pestaña Red, filtro CSS). Igual que la anterior, pero sin el HTML: tampoco se revisa el zoom del meta viewport.
   - **Dejarlo**.
   Si el MCP de Playwright no está disponible en la sesión, dilo en esa opción y recomienda guardar la página.
3. **Según la respuesta:**
   - Playwright: navega a la URL, rechaza las cookies no esenciales y pasa `scripts/extraer-css-web.js` como función a la herramienta que ejecuta JavaScript en la página, guardando el resultado en un archivo. Hazlo a 1440 px y a 375 px. Si hay hojas de otro dominio que el script no puede leer (`hojasNoAccesibles` > 0), descárgalas con `extraer-css-url.js <url-de-la-hoja.css>` y analízalas con él. Cierra el navegador al terminar. Con navegador, los pares de contraste de los elementos visibles cuentan como **medidos**.
   - Página guardada: `node extraer-css-url.js <archivo.html> <carpeta>`.
   - Hojas CSS: `node extraer-css-url.js <hoja.css o carpeta> <carpeta> [más hojas…]`.

**Archivo de Figma**
- Si hay un archivo con el plugin Desktop Bridge abierto (compruébalo con `figma_list_open_files`), usa Figma Console (`figma_execute`). Si no, usa el conector oficial (`use_figma`): carga antes la skill `figma-use` y llama a `create_session` con el fileKey.
- Todas las llamadas son de lectura. Cambia de página como mucho una vez por llamada.

## 2. Inventario

Antes de juzgar nada, haz una foto de lo que hay:

- **Web:** variables CSS por tipo (color, tamaño, fuente, sombra, tiempo), temas por clase, valores declarados por categoría con número de usos, colores normalizados a hex, estilos de texto declarados (tamaño · peso · interlineado), breakpoints, fuentes cargadas (`@font-face`) y el **nivel de tokenización**: por categoría, cuántas declaraciones usan `var(--…)` y cuántas un valor escrito a mano. Todo esto sale de `extraer-css-url.js`.
- **Figma:** `scripts/inventario-figma.js` (colecciones, modos, variables con su valor o alias por modo, scopes, code syntax y estilos de texto). Añade las páginas y cuántos componentes e instancias hay. Con más de unas 300 variables, inventaría colección a colección.

## 3. Comprobaciones por categoría

Haz todas las que apliquen al alcance. Cada una produce hallazgos con la gravedad de la sección 4.

### A. Nivel de tokenización (va primero en el informe)

Es el indicador más útil para saber cómo de sano está el sistema. Por categoría: % de declaraciones con variable frente a valores a mano. En Figma, lo mismo con `scripts/capas-sin-enlazar.js`: capas con valores sin variable ni estilo.

- Una categoría con 0 % de variables y muchos usos es un hallazgo **medio**: no existe sistema para esa categoría.
- Un valor a mano que **coincide** con un token existente es un hallazgo fácil: "enlazar a X".
- Un valor que **no existe** en el sistema: o falta el token, o el valor sobra.

### B. Color y contraste (WCAG 2.2)

1. **Pares reales primero.**
   - En Figma: `scripts/pares-reales.js`, pegando antes `scripts/contraste.js`.
   - En web: `paresMismaRegla` (texto y fondo declarados en la misma regla, ya con ratio) cuentan como **declarados**. Las reglas de `opacidadConTexto` son pistas: una opacidad baja sobre un elemento con texto puede hundir el contraste; señálalas como "por confirmar".
2. **Pares supuestos**, solo si no hay diseño o para completar: cada texto sobre cada fondo, cada `on-*` sobre su pareja, y bordes, iconos y foco sobre sus fondos.
3. **Umbrales:**
   - Texto normal ≥ 4,5 : 1. Texto grande (≥ 24 px, o ≥ 18,66 px con peso 700 o más) ≥ 3 : 1.
   - No textual (iconos que informan, bordes de controles, anillo de foco) ≥ 3 : 1 contra lo que tiene al lado (WCAG 1.4.11).
   - **Exentos**: controles deshabilitados, decoración y logotipos. Se mencionan, pero no cuentan como fallo.
4. **Cada modo cuenta.** En Figma, calcula todos los modos; en web, el modo oscuro si existe (`prefers-color-scheme`).
5. **Duplicados:** pasa la lista de colores por `scripts/duplicados.js` para ver duplicados exactos, casi iguales (ΔE < 3) y familias de transparencias con bases distintas.
6. **Escritos a mano:** señala los colores que no tienen variable.

### C. Tipografía

- **Familias:** cuántas se usan de verdad frente a las cargadas con `@font-face`. Las cargadas sin uso pesan sin aportar. Más de 2 o 3 familias suele ser un problema.
- **Escala de tamaños:** `scripts/escalas.js` con `{ base: 2, tipografia: true }`. Señala tamaños casi iguales (15 y 16), saltos irregulares entre tamaños y demasiados tamaños distintos.
- **Pesos:** cuántos distintos. Ojo con pesos que la fuente no tiene, porque el navegador los imita.
- **Interlineado:** el del cuerpo debería estar entre 1,4 y 1,6. Valores como 2 o 2,67 en texto corrido, o menos de 1,2 en párrafos, son hallazgos.
- **Estilos en uso:** las combinaciones familia · tamaño · peso · interlineado. Muchas combinaciones que se usan una sola vez indican que no hay estilos de texto definidos.
- **Unidades:** `font-size` en `px` en lugar de `rem` impide que el texto crezca con la preferencia de tamaño del navegador. Es un hallazgo de accesibilidad.
- **Mínimos** (criterio de la skill `accesibilidad`): cuerpo ≥ 16 px, secundario ≥ 14 px. Texto por debajo de 12 px es un hallazgo.

### D. Espaciado

- `scripts/escalas.js` con los padding, margin y gap (base 4 por defecto; usa 8 si el sistema es claramente de 8).
- **Señala:** % de usos fuera de la base, valores casi iguales (15 y 16, 30 y 32) y cuántos valores distintos hay.
- **Propón:** la escala ajustada a la base, con cuántos usos tendría cada paso.
- **Ignora** los márgenes calculados muy grandes o con decimales (por ejemplo 364,13 px). Suelen salir de centrar con `auto`, no de una decisión de espaciado.

### E. Radios, bordes, sombras y opacidad

- **Radios:** cuántos valores distintos y si siguen una escala. Valores sueltos (3, 5, 6 junto a 4 y 8) suelen sobrar.
- **Bordes:** grosores distintos (lo normal es 1 y 2) y colores de borde sin variable.
- **Sombras:** cuántas distintas hay en uso frente a las definidas como variables o estilos de efecto. Sombras a mano que casi coinciden con una variable deberían usarla.
- **Opacidad:** opacidades sueltas usadas para "aclarar" texto. Bajan el contraste y hay que medirlo.

### F. Capas (z-index)

Lista los valores. Señala saltos arbitrarios (1, 2, 6, 999, 9999) y la ausencia de una escala con nombre (base, desplegable, cabecera fija, modal, aviso).

### G. Movimiento

- **Duraciones y curvas** distintas (lo sano son 2 o 3 duraciones y 1 o 2 curvas con nombre).
- **`prefers-reduced-motion`:** si hay animaciones o transiciones y ninguna regla `prefers-reduced-motion`, es un hallazgo **medio**, y **crítico** si hay movimiento continuo o grande (WCAG 2.3.3, y requisito de la skill `accesibilidad`).
- **Animaciones infinitas** o de más de 5 s sin forma de pausarlas.

### H. Responsive

- **Breakpoints:** cuántos y si son coherentes. Mezclar `max-width` y `min-width`, o usar valores casi iguales (991 y 992), es un hallazgo.
- **Diferencias entre 1440 px y 375 px:** tamaños que no se adaptan, textos que se quedan por debajo de los mínimos en móvil y escalas que cambian sin seguir un patrón.

### I. Accesibilidad visible en el CSS

- **Foco:**
  - Reglas que quitan `outline` sin sustituto visible son un hallazgo **crítico** (WCAG 2.4.7). Para los que el script marca "sin sustituto", busca en `<carpeta>/css/` otra regla para el mismo elemento: el sustituto puede estar ahí.
  - Quitarlo solo con `:not(:focus-visible)` es correcto.
- **Zoom:** `user-scalable=no` o `maximum-scale=1` en el meta viewport es un hallazgo **crítico** (WCAG 1.4.4).
- **Tamaño base:** si `html` tiene un `font-size` fijo en px, el tamaño de texto que elige la persona en el navegador deja de funcionar.
- **Exceso de `!important`:** indica guerras de especificidad. Es un hallazgo menor que hace el CSS difícil de mantener.

### J. Estructura de los tokens

- **Semánticos con valor directo** en vez de alias. En web lo habitual es que no haya capa semántica: si solo existen primitivos, es un hallazgo **medio**.
- **Alias rotos** y cadenas de más de 2 saltos.
- **Modos incompletos**, o con el mismo valor en Light y Dark donde debería cambiar.
- **Tokens sin uso:** variables definidas que no aparecen en ninguna regla ni capa.
- **Nombres:** mezcla de convenciones (mayúsculas, separadores, escalas numéricas junto a adjetivos como `-10`, `-light` y `-white-15` en la misma familia). Propón el patrón que más se usa en el propio sistema.
- **Metadatos (Figma):** `ALL_SCOPES` o scopes que no cuadran, code syntax ausente o sin `var(--…)`, y descripciones vacías en los semánticos.

## 4. Gravedad

| Gravedad | Cuándo |
|---|---|
| **Crítica** | Impide usar el producto a alguien: falla AA en texto de lectura o controles principales, foco eliminado, zoom bloqueado, movimiento sin `prefers-reduced-motion` cuando es continuo o grande. O rompe el sistema: alias roto, modo sin valor. |
| **Media** | Falla en elementos secundarios o estados. Una categoría entera sin tokens. Escalas desordenadas con muchos valores fuera de base. Sin capa semántica. Duplicados que se usan. Sin `prefers-reduced-motion` con transiciones cortas. |
| **Menor** | Nombres incoherentes, scopes, code syntax, descripciones, tokens sin uso, casi duplicados sin uso, `!important`, fuentes cargadas sin uso. |
| **Info** | Observaciones útiles que no son un problema: exentos, decisiones de marca, cosas no comprobadas. |

Si dudas entre dos niveles, piensa en el impacto para quien usa el producto, no en lo fácil que es arreglarlo.

## 5. Informe

Guarda el informe como Markdown en la carpeta de trabajo (`auditoria-<sistema>-<AAAA-MM-DD>.md`). En el chat, da solo el resumen y el enlace al archivo. Usa esta estructura:

```markdown
# Auditoría del sistema visual · <Sistema>

**Fuente:** <URL y anchos revisados, o archivo de Figma (enlace)> · **Fecha:** <fecha>
**Alcance:** <categorías> · <páginas o pantallas revisadas>
**No comprobado:** <lo que quedó fuera y por qué>

## Resumen
| Crítica | Media | Menor | Info |
|---|---|---|---|
| n | n | n | n |

Los 3 hallazgos que más importan, en una línea cada uno.

> (Solo en webs auditadas sin navegador) **Contraste sin medir en pantalla:** los ratios salen del CSS declarado. Faltan el texto sobre fotos o degradados, las opacidades heredadas y lo que añade JavaScript, que es donde suelen estar los fallos críticos. Para medirlo, repite la auditoría con el MCP de Playwright.

## Nivel de tokenización
| Categoría | Con variable | A mano | % tokenizado | Valores distintos |
|---|---|---|---|---|

## Hallazgos
### C1 · <título corto> — Crítica · <categoría>
- **Dónde:** <selector, variable, componente o capa con su id>
- **Qué pasa:** <con el número: "blanco sobre action/primary: 3,00 : 1; necesita 4,5 : 1">
- **Por qué importa:** <una frase>
- **Propuesta:** <token existente o valor nuevo, con su efecto>
- **Esfuerzo:** bajo / medio / alto

(Numera por gravedad: C1… crítica, M1… media, m1… menor, i1… info. Ordena dentro de cada nivel por impacto.)

## Detalle por categoría
### Color y contraste
| Texto o elemento | Fondo | Modo | Tamaño | Ratio | Nivel | Origen (medido/declarado/supuesto) |
### Tipografía
Familias, escala de tamaños con usos, pesos, interlineados, estilos en uso.
### Espaciado
Escala actual con usos → escala propuesta.
### Radios, bordes, sombras y opacidad
### Capas, movimiento y responsive
### Estructura de tokens

## Siguientes pasos
- Qué arreglaría primero, en orden.
- Ofrecer montar la página de consulta con la skill `showcase-tokens`, incluyendo estos hallazgos.
```

Agrupa hallazgos repetidos: "436 espaciados a mano con 20 valores distintos" es un único hallazgo con ejemplos, no 436. Omite las categorías del detalle que no estén en el alcance.

## 6. Página en Figma con ejemplos visuales (si se pide)

Si se pide el informe en Figma, monta una página nueva con el informe: cabecera, resumen por gravedad, tokenización y hallazgos, y al final el detalle que aplique. En el informe en Markdown, enlaza cada hallazgo a su tarjeta en Figma.

Por qué con ejemplos: el número dice cuánto falla, pero un ejemplo de **antes → después** enseña el problema y demuestra que la propuesta lo arregla, sin tener que imaginarlo. Se entiende de un vistazo, también para quien no sabe qué significa "1,71 : 1".

**Componentes** (en una sección "_Componentes", con todo enlazado a variables):
- `Hallazgo / Tarjeta`: variante Gravedad (Crítica, Media, Menor, Info) y propiedades de texto para ID, categoría, título, dónde, qué pasa, por qué importa, propuesta y esfuerzo.
  - Arriba lleva una instancia anidada "Ejemplo" con dos propiedades: `Ejemplo` (INSTANCE_SWAP), para elegir el componente de ejemplo, y `Con ejemplo` (BOOLEAN), que controla su visibilidad.
- Un componente `Ejemplo / <nombre>` por hallazgo que lo necesite: dos paneles, "Ahora" y "Propuesta", con una flecha entre ellos. Cada panel lleva debajo una etiqueta con el ratio o el dato: ✕ en rojo si falla, ✓ si pasa.
- `Resumen / Contador` y `Badge` para la cabecera.

**Cuándo lleva ejemplo.** Solo cuando hay algo que se vea. Si el ejemplo no enseña nada, apágalo con `Con ejemplo`: un ejemplo vacío confunde más que ayuda.

| Tipo de hallazgo | Ejemplo |
|---|---|
| Contraste de texto | El texto real (palabra o frase) con el color actual sobre su fondo, y al lado la propuesta, cada uno con su ratio |
| Bordes, foco, iconos | El control (campo, botón, anillo de foco) con el borde actual y con el propuesto |
| Texto sobre foto | El texto sobre la zona clara, y la misma escena con la capa propuesta. Si la foto no está en el archivo, usa un fondo que la imite y dilo en la etiqueta ("zona clara de la foto") |
| Duplicados y casi iguales | Las muestras juntas, con su ΔE |
| Tipografía, espaciado, radios | La escala dibujada (Aa por tamaño, barras, cuadrados), con el valor que sobra o falta resaltado |
| Tokenización | La barra con el % con variable y algunas muestras de los valores a mano |
| Estructura: nombres, alias, scopes, code syntax, capas | Un fragmento de código corto, antes y después. Solo si aclara algo; si no, sin ejemplo |
| Info sin fallo, exentos, no comprobado | Sin ejemplo |

**Reglas de los ejemplos**
- **Con las variables reales del sistema**, no con colores escritos a mano. Así el ejemplo también está medido, y si cambia la variable, cambia el ejemplo.
  - Si el par depende de un tema o una placa, fija el modo en el marco del panel (`setExplicitVariableModeForCollection`).
  - Si un color no existe como variable (fondos medidos, colores a mano, colores antiguos), créalo en una colección aparte del informe (por ejemplo "<Sistema> · Auditoría") en vez de escribirlo en la capa.
- **Opacidad de capa:** si la web baja la opacidad del contenedor (`opacity: 0.2`), reprodúcela con la opacidad de la capa, no con la del relleno. Al enlazar una variable a un relleno, Figma pone la opacidad del relleno al alfa de la variable, así que un 20 % en el relleno se pierde.
- **Las etiquetas repiten el número del informe:** el mismo ratio, la misma mediana. Si es una imitación (foto, estado que no se ve), dilo en la etiqueta.
- Los ejemplos ilustran la propuesta, no la aplican: el sistema no se toca.

Verifica con una captura que el ejemplo de cada tarjeta se lee y que "Ahora" y "Propuesta" se distinguen. Un fallo típico es que la opacidad no se aplique y los dos paneles salgan iguales.

## 7. Antes de entregar

1. Recalcula a mano 3 ratios del informe con `scripts/contraste.js` y comprueba que coinciden.
2. Revisa que cada hallazgo tenga ubicación, número y propuesta.
3. Comprueba que no has modificado nada del sistema. Todo ha sido de lectura, salvo la página nueva del informe si se pidió en Figma.
4. Al final del mensaje, ofrece: (a) arreglar los hallazgos que elija, siguiendo la skill `accesibilidad`; (b) si no se pidió, entregar el informe en Figma con ejemplos visuales (sección 6); (c) montar la página de consulta con `showcase-tokens`; y (d) si fue una web sin navegador, repetir el contraste con el MCP de Playwright, diciendo en una frase qué se ganaría (contraste medido sobre lo que se ve).

## Scripts

| Script | Qué hace | Dónde se ejecuta |
|---|---|---|
| `scripts/extraer-css-url.js` | Descarga el HTML y todo el CSS de una URL: variables, temas, tokenización, colores, valores declarados por categoría, tamaños fluidos a 1440 y 375 px, pares de la misma regla, breakpoints, fuentes, foco, zoom y movimiento | node: `node extraer-css-url.js <url, página .html guardada, hoja .css o carpeta> <carpeta>` |
| `scripts/extraer-css-web.js` | Lo mismo desde un navegador, con valores calculados y pares medidos. Solo si la persona pide usar el MCP de Playwright, o si la web bloquea la descarga y lo elige | Herramienta del navegador que ejecuta JavaScript en la página |
| `scripts/inventario-figma.js` | Inventario compacto de variables y estilos de texto | `use_figma` / `figma_execute` |
| `scripts/capas-sin-enlazar.js` | Colores, espaciados, radios, bordes, sombras y tipografía sin variable ni estilo, y si coinciden con un token | `use_figma` / `figma_execute` |
| `scripts/pares-reales.js` | Pares texto/fondo que existen en el diseño, con su peor ratio | `use_figma` / `figma_execute` (con contraste.js delante) |
| `scripts/contraste.js` | Ratio WCAG con transparencias, nivel, texto grande y formato | Pegar delante de otros scripts, o en node |
| `scripts/escalas.js` | Escala de espaciado, radios, tamaños o duraciones: valores fuera de base, casi iguales y escala propuesta | node o Figma |
| `scripts/duplicados.js` | Colores duplicados, casi iguales (ΔE) y familias alfa con bases distintas | node o Figma |

Cada script de Figma tiene arriba constantes para el alcance (`RAIZ_ID`, `PAGINA_ID`, `COLECCION`). Rellénalas en vez de reescribir el script. Para la web, lee `extraccion.json` en node y pasa sus listas (`colores`, `declarado.espaciado`, `declarado.radio`…) a `escalas.js` y `duplicados.js`.
