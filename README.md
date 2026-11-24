# skill-auditoria

Skill de Claude Code que audita el sistema visual de una web (su CSS) o de un archivo de Figma (sus variables, estilos y capas) y entrega un informe con los hallazgos ordenados por gravedad. Cada hallazgo dice dónde está, cuánto falla y qué propuesta concreta lo arregla. Solo documenta: no cambia nada.

## Qué incluye

- [`auditoria-tokens/SKILL.md`](auditoria-tokens/SKILL.md): la skill, con el proceso, los criterios de gravedad y la plantilla del informe.
- [`auditoria-tokens/scripts/`](auditoria-tokens/scripts/): los scripts que hacen las medidas.

| Script | Qué hace |
|---|---|
| `extraer-css-url.js` | Descarga el HTML y todo el CSS de una web sin navegador y saca variables, temas, tokenización, colores, tamaños fluidos a 1440 y 375 px, breakpoints, foco, zoom y movimiento |
| `extraer-css-web.js` | Lo mismo desde un navegador, con valores calculados y contraste medido. Solo se usa si pides el MCP de Playwright, o si la web bloquea la descarga y lo eliges |
| `contraste.js` | Ratio WCAG 2.2 con transparencias, nivel y texto grande |
| `duplicados.js` | Colores duplicados, casi iguales (ΔE < 3) y familias de transparencias con bases distintas |
| `escalas.js` | Espaciados, radios, tamaños o duraciones fuera de escala y escala propuesta |
| `inventario-figma.js` | Inventario de variables y estilos de texto de un archivo de Figma |
| `capas-sin-enlazar.js` | Capas de Figma con colores, espaciados, radios o tipografía sin variable ni estilo |
| `pares-reales.js` | Pares de texto y fondo que existen en un diseño de Figma, con su peor ratio |

## Qué revisa

- **Nivel de tokenización:** cuántas declaraciones usan variables y cuántas valores escritos a mano, por categoría.
- **Color y contraste (WCAG 2.2):** pares de texto y fondo, elementos no textuales y anillo de foco, en todos los modos o temas.
- **Tipografía, espaciado, radios, bordes, sombras, opacidad, capas (z-index), movimiento y breakpoints.**
- **Duplicados y escalas desordenadas.**
- **Estructura de los tokens:** capa de primitivos y semánticos, alias, modos, nombres, tokens sin uso, scopes y code syntax.
- **Accesibilidad visible en el CSS:** foco eliminado, zoom bloqueado, `prefers-reduced-motion` y tamaños mínimos.

Puedes pedir la auditoría completa o solo algunas categorías, por ejemplo *"auditoría solo de color"*.

## Qué entrega

Un informe en Markdown (`auditoria-<sistema>-<fecha>.md`) con:
- resumen por gravedad (crítica, media, menor e info) y los 3 hallazgos que más importan;
- tabla de tokenización;
- cada hallazgo con dónde, qué pasa (con el número), por qué importa, propuesta y esfuerzo;
- lo que no se ha podido comprobar.

Si lo pides, también monta el informe en una **página de Figma**: una tarjeta por hallazgo y, cuando hay algo que se pueda ver (contraste, bordes, foco, tamaños, colores casi iguales), un **ejemplo visual antes → después** con el ratio de cada lado. Los ejemplos se dibujan con las variables reales del sistema, así que también están medidos. Los hallazgos de estructura (nombres, scopes, code syntax) llevan un fragmento de código corto o nada.

## Webs: con o sin navegador

Por defecto trabaja **sin navegador**: descarga el HTML y las hojas de estilo con Node. Así saca todo lo que está en el CSS, pero el contraste solo puede medirse en los pares declarados en una misma regla. No ve opacidades heredadas, texto sobre fotos ni lo que añade JavaScript, y lo avisa en el resumen del informe.

**Para auditorías, el navegador sale a cuenta:** el contraste se mide sobre lo que se ve en pantalla, que es donde suelen estar los fallos críticos. Pídelo directamente, por ejemplo *"audita https://… con el MCP de Playwright"*, y la skill irá por ese camino desde el principio.

Si la web bloquea la descarga (por ejemplo, con un sistema antibots), la skill te avisa y te propone qué hacer:
1. **Usar el MCP de Playwright (recomendado):** abre la web en un navegador de verdad y mide también el contraste real.
2. **Guardar tú la página** ("Guardar como → Página web completa") y pasarle el `.html`.
3. **Pasarle las hojas CSS** (URLs o archivos).
4. **Dejarlo.**

No intenta nunca saltarse un bloqueo.

## Cómo instalarla

1. Copia la carpeta `auditoria-tokens` en tu carpeta de skills personales de Claude Code:
   - Windows: `C:\Users\<tu-usuario>\.claude\skills\`
   - macOS / Linux: `~/.claude/skills/`
2. Abre una sesión nueva de Claude Code.
3. Pide, por ejemplo: *"audita el CSS de https://…"* o *"revisa si las variables de este archivo de Figma están bien"*.

## Qué necesita

- **Node 18 o posterior**, para las webs.
- **Figma:** el conector oficial de Figma o Figma Console (con el plugin Desktop Bridge abierto en el archivo), solo para auditar archivos de Figma.
- **MCP de Playwright:** opcional, solo si eliges usar un navegador.

## Skill relacionada

[skill-showcase](https://github.com/kristxu/skill-showcase) monta en Figma la página de consulta de los tokens. Son independientes: puedes instalar una, la otra o las dos.
