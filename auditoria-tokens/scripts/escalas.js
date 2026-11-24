// Análisis de una escala numérica: espaciados, radios, tamaños de fuente, anchos de borde,
// z-index o duraciones. Sirve en node, use_figma o figma_execute.
// Entrada: [[valor, usos], …] (como lo devuelve extraer-css-url.js en extraccion.json) o [{ valor, usos }, …].
// Devuelve:
//  - distintos ......... cuántos valores diferentes hay (muchos = escala sin controlar)
//  - enBase ............ % de usos que son múltiplo de la base (4 por defecto)
//  - fueraDeBase ....... valores que no encajan, con sus usos
//  - casiIguales ....... pares que difieren ≤ tolerancia (13 y 14, 15 y 16): suelen ser el mismo
//  - escalaPropuesta ... cada valor llevado al múltiplo de la base más cercano, con usos sumados
//  - proporciones ...... (solo tipografía) cociente entre tamaños consecutivos de la escala propuesta

const analizarEscala = (entrada, { base = 4, tolerancia = base / 2, tipografia = false } = {}) => {
  const mapa = {};
  for (const e of entrada) {
    const valor = Number(Array.isArray(e) ? e[0] : e.valor);
    const usos = Number(Array.isArray(e) ? e[1] : e.usos) || 1;
    if (!Number.isFinite(valor) || valor <= 0) continue;
    const v = Math.round(valor * 100) / 100;
    mapa[v] = (mapa[v] || 0) + usos;
  }
  const items = Object.entries(mapa).map(([v, u]) => ({ valor: Number(v), usos: u })).sort((a, b) => a.valor - b.valor);
  const total = items.reduce((s, x) => s + x.usos, 0) || 1;
  const enBase = items.filter((x) => x.valor % base === 0).reduce((s, x) => s + x.usos, 0);
  const casiIguales = [];
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1], b = items[i];
    // Dos valores de la base nunca se marcan (16 y 20 en base 4 son una escala correcta).
    const algunoFuera = a.valor % base !== 0 || b.valor % base !== 0;
    if (algunoFuera && b.valor - a.valor <= tolerancia) {
      const quedar = a.usos >= b.usos ? a : b;
      casiIguales.push({ a: a.valor, b: b.valor, usos: [a.usos, b.usos], propuesta: `unificar en ${quedar.valor}` });
    }
  }
  const snap = {};
  for (const x of items) { const s = Math.max(base, Math.round(x.valor / base) * base); snap[s] = (snap[s] || 0) + x.usos; }
  const escalaPropuesta = Object.entries(snap).map(([v, u]) => ({ valor: Number(v), usos: u })).sort((a, b) => a.valor - b.valor);
  const res = {
    distintos: items.length,
    base,
    enBase: `${Math.round((enBase / total) * 100)} %`,
    fueraDeBase: items.filter((x) => x.valor % base !== 0),
    casiIguales,
    escalaPropuesta,
  };
  if (tipografia) {
    res.proporciones = items.slice(1).map((x, i) => ({ de: items[i].valor, a: x.valor, ratio: Math.round((x.valor / items[i].valor) * 100) / 100 }));
  }
  return res;
};

if (typeof module !== 'undefined') module.exports = { analizarEscala };
