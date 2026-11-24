// Inventario de variables de un archivo de Figma (SOLO LECTURA).
// Pegar en use_figma (conector oficial) o figma_execute (Figma Console).
// Devuelve una fila compacta por variable. Con más de ~300 variables,
// rellena COLECCION para inventariar una colección por llamada.

const COLECCION = ''; // '' = todas; o el nombre exacto de una colección

const colls = (await figma.variables.getLocalVariableCollectionsAsync())
  .filter((c) => !COLECCION || c.name === COLECCION);
const local = await figma.variables.getLocalVariablesAsync();
const byId = new Map(local.map((v) => [v.id, v]));

const hx = (n) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
const hex = (c) => '#' + hx(c.r) + hx(c.g) + hx(c.b) + (c.a !== undefined && c.a < 1 ? hx(c.a) : '');

const aliasName = async (id) => {
  if (byId.has(id)) return byId.get(id).name;
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) return `ROTO (${id})`;
  return v.remote ? `externa: ${v.name}` : v.name;
};
const fmtVal = async (val) => {
  if (val && val.type === 'VARIABLE_ALIAS') return '→ ' + (await aliasName(val.id));
  if (val && typeof val === 'object' && 'r' in val) return hex(val);
  return val;
};

const out = [];
for (const c of colls) {
  const fila = { coleccion: c.name, modos: c.modes.map((m) => m.name), variables: [] };
  for (const id of c.variableIds) {
    const v = byId.get(id);
    if (!v) continue;
    const valores = {};
    for (const m of c.modes) {
      const raw = v.valuesByMode[m.modeId];
      valores[m.name] = raw === undefined ? 'SIN VALOR' : await fmtVal(raw);
    }
    fila.variables.push({
      n: v.name,
      t: v.resolvedType,
      v: valores,
      s: v.scopes.join(',') || '(oculta)',
      web: (v.codeSyntax && v.codeSyntax.WEB) || '',
      d: v.description ? 1 : 0,
    });
  }
  out.push(fila);
}
const textStyles = (await figma.getLocalTextStylesAsync()).map((s) => s.name);
const json = JSON.stringify({ colecciones: out, estilosTexto: textStyles });
return json.length > 90000 ? { aviso: 'Respuesta demasiado grande: rellena COLECCION y repite por colección.', bytes: json.length } : JSON.parse(json);
