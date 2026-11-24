// Pares reales texto/fondo de una página, sección o componente (SOLO LECTURA).
// Para cada texto busca el fondo que tiene detrás subiendo por sus contenedores
// y calcula el contraste con los valores resueltos (respeta el modo de cada nodo).
// Agrupa los pares iguales y devuelve el peor ratio de cada uno.
// Límite: solo ve los fondos de los contenedores padre; un rectángulo hermano
// colocado detrás del texto no se detecta (dilo en el informe).
// Requiere pegar antes el contenido de scripts/contraste.js.

const RAIZ_ID = ''; // id de un nodo (componente, sección, pantalla) o '' para toda la página
const PAGINA_ID = ''; // id de la página si no es la primera

if (PAGINA_ID) await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGINA_ID));
const raiz = RAIZ_ID ? await figma.getNodeByIdAsync(RAIZ_ID) : figma.currentPage;

const hx = (n) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
const hex = (c) => '#' + hx(c.r) + hx(c.g) + hx(c.b);
const solido = (n) => ('fills' in n && Array.isArray(n.fills))
  ? n.fills.filter((p) => p.type === 'SOLID' && p.visible !== false).slice(-1)[0] : null;

// Devuelve { nombre, color } de un relleno: variable resuelta para ese nodo, o el hex escrito a mano.
// Ojo: al enlazar una variable con alfa, Figma copia ese alfa en paint.opacity. Por eso, si el
// relleno está enlazado, el alfa sale SOLO del valor resuelto (multiplicarlo por paint.opacity
// lo aplicaría dos veces).
const cache = {};
const resolver = async (paint, node) => {
  const op = paint.opacity === undefined ? 1 : paint.opacity;
  const id = paint.boundVariables && paint.boundVariables.color && paint.boundVariables.color.id;
  if (id) {
    if (!(id in cache)) cache[id] = await figma.variables.getVariableByIdAsync(id);
    const v = cache[id];
    if (v) {
      const r = v.resolveForConsumer(node).value;
      return { nombre: v.name, color: { r: r.r, g: r.g, b: r.b, a: r.a === undefined ? 1 : r.a } };
    }
  }
  const c = paint.color;
  const nombre = hex(c) + (op < 1 ? ` ${Math.round(op * 100)} %` : '') + ' (sin variable)';
  return { nombre, color: { r: c.r, g: c.g, b: c.b, a: op } };
};

const pares = {};
const textos = raiz.findAllWithCriteria({ types: ['TEXT'] });
let omitidos = 0;
for (const t of textos) {
  if (!t.visible) continue;
  const fp = solido(t);
  if (!fp || t.fontSize === figma.mixed || t.fontName === figma.mixed) { omitidos++; continue; }
  const fg = await resolver(fp, t);
  const capas = []; let bgNombre = null;
  for (let p = t.parent; p && p.type !== 'PAGE' && p.type !== 'DOCUMENT'; p = p.parent) {
    const bp = solido(p);
    if (!bp) continue;
    const bg = await resolver(bp, p);
    if (!bgNombre) bgNombre = bg.nombre;
    capas.push(bg.color);
    if (bg.color.a >= 1) break;
  }
  if (!bgNombre) bgNombre = 'sin fondo (se asume blanco)';
  const grande = esGrande(t.fontSize, t.fontName.style);
  const r = contraste(fg.color, capas.length ? capas : ['#FFFFFF']);
  const key = `${fg.nombre}|${bgNombre}|${grande ? 'grande' : 'normal'}`;
  const prev = pares[key] || { n: 0, ratio: Infinity };
  prev.n++;
  if (r < prev.ratio) { prev.ratio = r; prev.ejemplo = `${t.name} (${t.id}) · ${t.fontSize}px ${t.fontName.style}`; }
  pares[key] = prev;
}
const filas = Object.entries(pares).map(([k, v]) => {
  const [fg, bg, tam] = k.split('|');
  return { fg, bg, tam, ratio: fmt(v.ratio), nivel: nivelTexto(v.ratio, tam === 'grande'), usos: v.n, ejemplo: v.ejemplo, r: v.ratio };
}).sort((a, b) => a.r - b.r).map(({ r, ...f }) => f);
return { raiz: raiz.name, textos: textos.length, omitidos, pares: filas.length, filas: filas.slice(0, 150) };
