// Duplicados y casi duplicados en una lista de colores (SOLO LECTURA).
// Entrada: [{ nombre: 'smoked-70', hex: '#3B3935B3' }, …] (el hex puede llevar alfa).
// Sirve en use_figma, figma_execute o node. Devuelve:
//  - exactos: mismo color y alfa con nombres distintos
//  - casiIguales: ΔE (CIE76) < UMBRAL, sin contar los exactos (a simple vista son el mismo color)
//  - familiasAlfa: grupos con el mismo prefijo de nombre cuyo color base (sin alfa) varía,
//    p. ej. smoked-70 #3B3935 y smoked-40 #3B3832: deberían compartir base

const UMBRAL = 3; // ΔE < 2 casi imperceptible; < 5 muy parecido

const parse = (h) => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length > 6 ? parseInt(h.slice(6, 8), 16) : 255 }; };
const toLab = ({ r, g, b }) => {
  const l = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const R = l(r), G = l(g), B = l(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return { L: 116 * f(Y) - 16, a: 500 * (f(X) - f(Y)), b: 200 * (f(Y) - f(Z)) };
};
const dE = (p, q) => { const A = toLab(p), B = toLab(q); return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b); };

const revisarDuplicados = (lista) => {
  const items = lista.map((x) => ({ ...x, c: parse(x.hex) }));
  const exactos = {}; for (const x of items) (exactos[x.hex.toUpperCase()] ||= []).push(x.nombre);
  const casi = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const p = items[i], q = items[j];
    if (p.c.a !== q.c.a || p.hex.toUpperCase() === q.hex.toUpperCase()) continue;
    const d = dE(p.c, q.c); if (d < UMBRAL) casi.push({ a: p.nombre, b: q.nombre, hexA: p.hex, hexB: q.hex, deltaE: Math.round(d * 10) / 10 });
  }
  const fam = {}; for (const x of items) if (x.c.a < 255) (fam[x.nombre.replace(/[-/]?\d+$/, '')] ||= []).push(x);
  const familiasAlfa = Object.entries(fam).map(([pre, xs]) => ({ prefijo: pre, bases: [...new Set(xs.map((x) => x.hex.slice(0, 7).toUpperCase()))], miembros: xs.map((x) => `${x.nombre} ${x.hex}`) }))
    .filter((f) => f.bases.length > 1);
  return { exactos: Object.entries(exactos).filter(([, n]) => n.length > 1).map(([hex, nombres]) => ({ hex, nombres })), casiIguales: casi.sort((a, b) => a.deltaE - b.deltaE), familiasAlfa };
};

if (typeof module !== 'undefined') module.exports = { revisarDuplicados, dE };
