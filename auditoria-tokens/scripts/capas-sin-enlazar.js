// Valores escritos a mano (sin variable) en una página, sección o componente (SOLO LECTURA).
// Revisa rellenos y trazos de color, radios, separaciones, paddings, grosor de borde,
// sombras y desenfoques sin estilo de efecto, y en textos sin estilo: tamaño, fuente,
// interlineado y tracking.
// Para cada color suelto indica si coincide exactamente con alguna variable existente
// ("debería enlazarse a …") o si no existe token para él ("falta token").
// Las instancias solo cuentan si tienen el relleno o trazo sobrescrito.

const RAIZ_ID = ''; // id de un nodo o '' para toda la página actual
const PAGINA_ID = ''; // id de la página si no es la primera
const EJEMPLOS = 3;  // ejemplos por valor

if (PAGINA_ID) await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGINA_ID));
const raiz = RAIZ_ID ? await figma.getNodeByIdAsync(RAIZ_ID) : figma.currentPage;

const hx = (n) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
const hexA = (c, a = 1) => '#' + hx(c.r) + hx(c.g) + hx(c.b) + (a < 1 ? hx(a) : '');

// Mapa hex → variables de color (valor del primer modo, siguiendo alias).
const porHex = {};
const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const colls = Object.fromEntries((await figma.variables.getLocalVariableCollectionsAsync()).map((c) => [c.id, c]));
for (const v of vars) {
  let val = v.valuesByMode[colls[v.variableCollectionId].defaultModeId];
  for (let i = 0; i < 5 && val && val.type === 'VARIABLE_ALIAS'; i++) {
    const t = await figma.variables.getVariableByIdAsync(val.id);
    val = t ? t.valuesByMode[colls[t.variableCollectionId] ? colls[t.variableCollectionId].defaultModeId : Object.keys(t.valuesByMode)[0]] : null;
  }
  if (val && 'r' in val) (porHex[hexA(val, val.a === undefined ? 1 : val.a)] ||= []).push(v.name);
}

const dentroDeInstancia = (n) => { for (let p = n.parent; p; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
const ruta = (n) => { const r = []; for (let p = n; p && p.type !== 'PAGE'; p = p.parent) r.unshift(p.name); return r.slice(-3).join(' › '); };

const colores = {}; const numeros = {};
const anotar = (mapa, clave, n) => { const e = (mapa[clave] ||= { n: 0, ej: [] }); e.n++; if (e.ej.length < EJEMPLOS) e.ej.push(`${ruta(n)} (${n.id})`); };

// Una instancia hereda rellenos, radios y espaciados de su componente principal. Solo se cuentan
// en la instancia si están sobrescritos; si no, el problema ya se cuenta una vez en el principal.
// Límite: no se revisan las sobrescrituras en capas internas de las instancias (dilo en el informe).
const mismo = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nodos = raiz.findAll(() => true);
for (const n of nodos) {
  if (dentroDeInstancia(n)) continue;
  const main = n.type === 'INSTANCE' ? await n.getMainComponentAsync() : null;
  for (const prop of ['fills', 'strokes']) {
    if (!(prop in n) || !Array.isArray(n[prop])) continue;
    if (prop === 'strokes' && !(n.strokeWeight > 0)) continue;
    if (main && mismo(n[prop], main[prop])) continue;
    for (const p of n[prop]) {
      if (p.type !== 'SOLID' || p.visible === false) continue;
      if (p.boundVariables && p.boundVariables.color) continue;
      anotar(colores, `${prop === 'fills' ? 'relleno' : 'trazo'}|${hexA(p.color, p.opacity === undefined ? 1 : p.opacity)}`, n);
    }
  }
  if (main) continue;
  const bv = n.boundVariables || {};
  if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius > 0 && !bv.topLeftRadius) anotar(numeros, `radio|${n.cornerRadius}`, n);
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    if (n.itemSpacing > 0 && !bv.itemSpacing) anotar(numeros, `separación|${n.itemSpacing}`, n);
    for (const k of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) if (n[k] > 0 && !bv[k]) anotar(numeros, `padding|${n[k]}`, n);
  }
  if ('strokeWeight' in n && typeof n.strokeWeight === 'number' && n.strokeWeight > 0 && Array.isArray(n.strokes) && n.strokes.length && !bv.strokeWeight && !bv.strokeTopWeight) anotar(numeros, `grosor de borde|${n.strokeWeight}`, n);
  if ('effects' in n && n.effects.length && !n.effectStyleId) {
    for (const e of n.effects) if (e.visible !== false && /SHADOW|BLUR/.test(e.type)) {
      const desc = e.type.includes('SHADOW') ? `${e.type === 'INNER_SHADOW' ? 'interior ' : ''}${e.offset.x} ${e.offset.y} ${e.radius} ${e.spread || 0} ${hexA(e.color, e.color.a)}` : `${e.type} ${e.radius}`;
      anotar(numeros, `sombra o desenfoque sin estilo|${desc}`, n);
    }
  }
  if (n.type === 'TEXT' && !n.textStyleId) {
    if (typeof n.fontSize === 'number' && !bv.fontSize) anotar(numeros, `tamaño de fuente sin estilo ni variable|${n.fontSize}`, n);
    if (n.fontName !== figma.mixed && !bv.fontFamily && !bv.fontStyle) anotar(numeros, `fuente sin estilo ni variable|${n.fontName.family} ${n.fontName.style}`, n);
    if (n.lineHeight !== figma.mixed && n.lineHeight.unit !== 'AUTO' && !bv.lineHeight) anotar(numeros, `interlineado sin estilo ni variable|${n.lineHeight.value}${n.lineHeight.unit === 'PERCENT' ? ' %' : ' px'}`, n);
    if (n.letterSpacing !== figma.mixed && n.letterSpacing.value !== 0 && !bv.letterSpacing) anotar(numeros, `tracking sin estilo ni variable|${n.letterSpacing.value}${n.letterSpacing.unit === 'PERCENT' ? ' %' : ' px'}`, n);
  }
}

const filasColor = Object.entries(colores).map(([k, v]) => {
  const [tipo, h] = k.split('|');
  const m = porHex[h];
  return { tipo, hex: h, usos: v.n, propuesta: m ? `enlazar a ${m.slice(0, 3).join(' / ')}` : 'falta token', ejemplos: v.ej };
}).sort((a, b) => b.usos - a.usos);
const filasNum = Object.entries(numeros).map(([k, v]) => { const [tipo, val] = k.split('|'); return { tipo, valor: Number.isNaN(Number(val)) ? val : Number(val), usos: v.n, ejemplos: v.ej }; })
  .sort((a, b) => a.tipo.localeCompare(b.tipo) || (typeof a.valor === 'number' && typeof b.valor === 'number' ? a.valor - b.valor : String(a.valor).localeCompare(String(b.valor))));
return { raiz: raiz.name, nodosRevisados: nodos.length, coloresSueltos: filasColor.slice(0, 80), numerosSueltos: filasNum.slice(0, 80) };
