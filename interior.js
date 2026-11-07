// INTERIOR — plantas 1 y 2 según el boceto del propietario (7 nov 2026), con el contorno del Catastro y las fotos
// del anuncio. Coordenadas en el marco de fachada (s, d) en metros: s a lo largo de la fachada desde la esquina sur,
// d hacia dentro. Vértice 3D local = (s, y, -d). Las paredes interiores son DATOS editables (ver DEFAULT_LAYOUT).
import { H, WINDOWS, roofH } from './model.js?v=202611071155';

export const NORTH_AT = d => d <= 3.31 ? 11.7 - d * (0.86 / 3.31) : d <= 6.54 ? 10.84 - (d - 3.31) * (0.84 / 3.23) : 10.0 - (d - 6.54) * (1.15 / 4.2);
const SOUTH_AT = d => -0.18 * Math.min(1, d / 6.69);
// contorno de las plantas 1 y 2 (cuerpos 1+3+4), sentido antihorario
export const OUTLINE = [[0, 0], [11.7, 0], [10.84, 3.31], [10.0, 6.54], [8.85, 10.74], [3.91, 10.64], [4.0, 6.77], [-0.18, 6.69]];

// Escalera en U dentro de la franja s 0–1,71 (fotos 13-14): tramo PB→P1 junto a la medianera y tramo P1→P2 al lado
export const STAIR = {
  low: { s0: 0.05, s1: 0.83, d0: 0.35, d1: 3.45 },   // sube de PB (d0) a P1 (d1)
  up: { s0: 0.88, s1: 1.66, d0: 0.95, d1: 3.45 },    // sube de P1 (d1) a P2 (d0); rellano de llegada delante
};

const KIT = { mat: 'kitchenTile', h: 2.0, band: 'kitchenBand' };
const BATH = { mat: 'bathWallTile', h: 2.1 };
const WAIN = { mat: 'wainscot', h: 0.95, band: 'wainscotBand' };
const Dr = (u0, w = 0.8, swing = 'in') => ({ u0, u1: u0 + w, y0: 0, y1: 2.05, kind: 'door', swing });
const OP = (u0, w) => ({ u0, u1: u0 + w, y0: 0, y1: 2.1, kind: 'opening' });
const Wn = (u0, u1, y0, y1, kind = 'window') => ({ u0, u1, y0, y1, kind });
const S = SOUTH_AT;

// ------------------------------------------------------------------ distribución por defecto
export const DEFAULT_LAYOUT = {
  P1: {
    rooms: [
      { name: 'Escalera', floor: 'floorLight', poly: [[0, 0], [1.71, 0], [1.71, 4.04], [S(4.04), 4.04]], stair: true },
      { name: 'Habitación 1', floor: 'floorTerracotta', poly: [[1.71, 0], [5.05, 0], [5.05, 3.05], [1.71, 3.05]] },
      { name: 'Mini salón', floor: 'floorLight', poly: [[5.05, 0], [7.2, 0], [7.2, 3.1], [5.05, 3.1]] },
      { name: 'Habitación 2', floor: 'floorLight', poly: [[7.2, 0], [11.7, 0], [NORTH_AT(3.12), 3.12], [7.2, 3.12]] },
      { name: 'Pasillo', floor: 'floorLight', poly: [[1.71, 3.05], [NORTH_AT(3.12), 3.12], [10.84, 3.2], [8.6, 4.43], [4.1, 4.2], [4.1, 4.04], [1.71, 4.04]] },
      { name: 'Habitación 3', floor: 'floorTerracotta', poly: [[S(4.04), 4.04], [4.1, 4.04], [4.1, 6.79], [-0.18, 6.69]] },
      { name: 'Cocina', floor: 'floorLight', poly: [[4.1, 4.2], [8.6, 4.43], [8.17, 7.05], [4.0, 7.05], [4.0, 6.79]] },
      { name: 'Baño', floor: 'floorBath', poly: [[8.6, 4.43], [10.84, 3.2], [10.84, 3.31], [10.0, 6.54], [NORTH_AT(7.06), 7.06], [8.17, 7.05]] },
      { name: 'Salón', floor: 'floorTerracotta', poly: [[4.0, 7.05], [NORTH_AT(7.06), 7.06], [8.85, 10.74], [3.91, 10.64]] },
    ],
    walls: [
      { a: [1.71, 0.25], b: [1.71, 3.05] },
      { a: [1.71, 3.05], b: [5.05, 3.05], holes: [Dr(2.35, 0.8, 'out')] },
      { a: [5.05, 0.25], b: [5.05, 3.05] },
      { a: [7.2, 0.25], b: [7.2, 3.12] },
      { a: [7.2, 3.12], b: [NORTH_AT(3.12) - 0.2, 3.12], holes: [Dr(0.25, 0.8, 'out')] },
      { a: [0.0, 4.04], b: [4.1, 4.04], holes: [Dr(2.5)] },
      { a: [4.1, 4.04], b: [4.1, 6.8], fin: { R: [KIT] } },
      { a: [4.1, 4.2], b: [8.6, 4.43], holes: [OP(0.8, 0.9)], fin: { L: [KIT] } },
      { a: [8.6, 4.43], b: [10.84, 3.2], holes: [Dr(0.6, 0.72)], fin: { L: [BATH] } },
      { a: [8.6, 4.43], b: [8.17, 7.05], fin: { L: [KIT], R: [BATH] } },
      { a: [4.1, 7.05], b: [NORTH_AT(7.06) - 0.2, 7.06], holes: [OP(1.2, 1.6)], fin: { L: [WAIN], R: [{ ...KIT, u1: 4.07 }, { ...BATH, u0: 4.07 }] } },
    ],
  },
  P2: {
    rooms: [
      { name: 'Escalera', floor: 'floorLight', poly: [[0, 0], [1.71, 0], [1.71, 3.96], [S(3.96), 3.96]], stair: true },
      { name: 'Habitación 5', floor: 'floorTerracotta', poly: [[1.71, 0], [4.45, 0], [4.45, 3.0], [1.71, 3.0]] },
      { name: 'Habitación 6', floor: 'floorLight', poly: [[4.45, 0], [6.95, 0], [6.95, 3.0], [4.45, 3.0]] },
      { name: 'Pasillo', floor: 'floorTerracotta', poly: [[1.71, 3.0], [4.45, 3.0], [4.4, 3.9], [1.71, 3.94]] },
      { name: 'Habitación 4', floor: 'floorTerracotta', poly: [[S(3.96), 3.96], [2.95, 3.93], [2.95, 6.75], [-0.18, 6.69]] },
      { name: 'Baño', floor: 'floorBath', poly: [[2.95, 3.93], [4.4, 3.9], [4.0, 6.77], [2.95, 6.75]] },
      { name: 'Salón grande', floor: 'floorTerracotta', poly: [[6.95, 0], [11.7, 0], [10.84, 3.31], [10.0, 6.54], [8.85, 10.74], [3.91, 10.64], [4.0, 6.77], [4.4, 3.9], [4.45, 3.0], [6.95, 3.0]] },
    ],
    walls: [
      { a: [1.71, 0.25], b: [1.71, 3.0] },
      { a: [1.71, 3.0], b: [4.45, 3.0], holes: [Dr(1.7, 0.8, 'out')] },
      { a: [4.45, 0.25], b: [4.45, 3.0] },
      { a: [4.45, 3.0], b: [6.95, 3.0], holes: [Dr(0.25, 0.8, 'out')] },
      { a: [6.95, 0.25], b: [6.95, 3.0] },
      { a: [0.0, 3.96], b: [4.4, 3.9], holes: [Dr(1.9), Dr(3.25, 0.7)], fin: { L: [{ ...BATH, u0: 2.95 }] } },
      { a: [2.95, 3.93], b: [2.95, 6.75], fin: { R: [BATH] } },
      { a: [4.4, 3.9], b: [4.0, 6.77], fin: { L: [BATH] } },
    ],
  },
};
const LEVEL_Y = { P1: H.P1, P2: H.P2 };
export function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
export function centroid(p) { let x = 0, y = 0, a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length], c = x1 * y2 - x2 * y1; a += c; x += (x1 + x2) * c; y += (y1 + y2) * c; } return a ? [x / (3 * a), y / (3 * a)] : p[0]; }

// ------------------------------------------------------------------ utilidades de malla
function helpers(THREE, mats, g) {
  const tag = (m, mat) => { m.userData = { ...m.userData, mat, role: 'interior' }; m.castShadow = m.receiveShadow = true; return m; };
  const meters = (geo, w, h) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); return geo; };
  const mesh = (geo, mat, name, parent = g) => { const m = tag(new THREE.Mesh(geo, mats[mat]), mat); m.name = name; parent.add(m); return m; };
  const flat = (poly, y, mat, name, parent = g, holes = []) => {
    const c = poly.map(([s, d]) => new THREE.Vector2(s, d)), hs = holes.map(h => h.map(([s, d]) => new THREE.Vector2(s, d)));
    const all = [...poly, ...holes.flat()], tri = THREE.ShapeUtils.triangulateShape(c, hs);
    const yy = typeof y === 'function' ? y : () => y;
    const pos = [], uv = []; for (const [a, b, cc] of tri) for (const i of [a, cc, b]) { pos.push(all[i][0], yy(all[i][1]), -all[i][1]); uv.push(all[i][0], all[i][1]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    return mesh(geo, mat, name, parent);
  };
  return { tag, meters, mesh, flat };
}

// muro a→b con huecos y acabados. Cara L = izquierda del sentido a→b. Devuelve segmentos de colisión.
function buildWall(THREE, mats, parent, Y0, w, opt = {}) {
  const { tag, meters } = helpers(THREE, mats, parent);
  const { a, b } = w, t = w.t ?? 0.1, h = w.h ?? 2.6, holes = w.holes || [], fin = w.fin || {}, align = w.align || 'center';
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const cols = []; if (L < 0.02) return cols;
  const grp = new THREE.Group(); grp.name = opt.name || 'tabique'; grp.userData = { ...(opt.userData || {}) };
  grp.position.set(a[0], Y0, -a[1]); grp.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const z0 = align === 'in' ? -t : -t / 2, z1 = z0 + t, zc = (z0 + z1) / 2;
  const add = (geo, m) => { const me = tag(new THREE.Mesh(geo, mats[m]), m); grp.add(me); return me; };
  const slab = (u0, u1, y0, y1, zA, zB, m) => { if (u1 - u0 < 0.004 || y1 - y0 < 0.004) return; const geo = meters(new THREE.BoxGeometry(u1 - u0, y1 - y0, zB - zA), u1 - u0, y1 - y0); geo.translate((u0 + u1) / 2, (y0 + y1) / 2, (zA + zB) / 2); add(geo, m); };
  const faces = [{ side: 'L', z: z0, dir: -1 }]; if (align !== 'in') faces.push({ side: 'R', z: z1, dir: 1 });
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = uy, ny = -ux;
  const piece = (u0, u1, y0, y1) => {
    if (u1 - u0 < 0.004 || y1 - y0 < 0.004) return;
    slab(u0, u1, y0, y1, z0, z1, 'wallInt');
    if (y0 < 0.5 && y1 > 0.5) cols.push({ a: [a[0] + ux * u0 + nx * zc, a[1] + uy * u0 + ny * zc], b: [a[0] + ux * u1 + nx * zc, a[1] + uy * u1 + ny * zc], t });
    if (align === 'in') slab(u0, u1, y0, y1, z1, z1 + 0.015, 'wall');
    for (const f of faces) {
      const sk = th => f.dir < 0 ? [f.z - th, f.z] : [f.z, f.z + th];
      if (y0 === 0) slab(u0, u1, 0, Math.min(0.08, y1), ...sk(0.012), 'skirting');
      for (const fi of (fin[f.side] || [])) {
        const a0 = Math.max(u0, fi.u0 ?? 0), a1 = Math.min(u1, fi.u1 ?? L); if (a1 <= a0) continue;
        const yy1 = Math.min(y1, fi.h); if (yy1 > y0) slab(a0, a1, y0, yy1, ...sk(0.016), fi.mat);
        if (fi.band && y0 <= fi.h && y1 >= fi.h) slab(a0, a1, fi.h - 0.06, fi.h, ...sk(0.02), fi.band);
      }
    }
  };
  let u = 0;
  for (const o of holes.slice().sort((p, q) => p.u0 - q.u0)) {
    const ou0 = Math.max(u, Math.min(o.u0, L)), ou1 = Math.min(L, o.u1); if (ou1 <= ou0) continue;
    piece(u, ou0, 0, h); piece(ou0, ou1, 0, o.y0); piece(ou0, ou1, Math.min(o.y1, h), h);
    const ww = ou1 - ou0, oy = (o.y0 + o.y1) / 2, oh = o.y1 - o.y0;
    if (o.kind === 'window' || o.kind === 'slide') {
      const gg = new THREE.BoxGeometry(ww, oh, 0.012); gg.translate(ou0 + ww / 2, oy, zc); add(gg, 'glassIn');
      const parts = o.kind === 'slide' ? (o.parts || 3) : 2, fw = 0.055, fm = o.kind === 'slide' ? 'alu' : 'pvc';
      for (let k = 0; k <= parts; k++) { const uu = ou0 + ww * k / parts; const fg = new THREE.BoxGeometry(fw, oh, 0.07); fg.translate(Math.min(Math.max(uu, ou0 + fw / 2), ou1 - fw / 2), oy, zc); add(fg, fm); }
      for (const yy of [o.y0 + fw / 2, o.y1 - fw / 2]) { const fg = new THREE.BoxGeometry(ww, fw, 0.07); fg.translate(ou0 + ww / 2, yy, zc); add(fg, fm); }
      if (o.kind === 'window') { const sg = new THREE.BoxGeometry(ww + 0.1, 0.03, t / 2 + 0.05); sg.translate(ou0 + ww / 2, o.y0 - 0.015, z0 + (t / 2 + 0.05) / 2 - 0.05); add(sg, 'marble'); }
    }
    if (o.kind === 'door' || o.kind === 'opening') {
      const jw = 0.07, jd = t + 0.03, m = o.kind === 'door' ? 'doorFrame' : 'wallInt';
      for (const uu of [ou0 + jw / 2, ou1 - jw / 2]) { const jg = new THREE.BoxGeometry(jw, o.y1, jd); jg.translate(uu, o.y1 / 2, zc); add(jg, m); }
      const hg = new THREE.BoxGeometry(ww, jw, jd); hg.translate(ou0 + ww / 2, o.y1 - jw / 2, zc); add(hg, m);
    }
    if (o.kind === 'door') {
      const lw = ww - 0.14, lh = o.y1 - 0.08, leaf = new THREE.Group();
      const lg = new THREE.BoxGeometry(lw, lh, 0.04); lg.translate(lw / 2, lh / 2, 0); leaf.add(tag(new THREE.Mesh(lg, mats.doorLeaf), 'doorLeaf'));
      for (const side of [-1, 1]) for (const [py, ph] of [[0.25, 0.75], [1.15, 0.7]]) { const pg = new THREE.BoxGeometry(lw - 0.2, ph, 0.006); pg.translate(lw / 2, py + ph / 2, side * 0.022); leaf.add(tag(new THREE.Mesh(pg, mats.doorPanel), 'doorPanel')); }
      for (const side of [-1, 1]) { const hgm = new THREE.BoxGeometry(0.12, 0.018, 0.018); hgm.translate(lw - 0.12, 1.02, side * 0.045); leaf.add(tag(new THREE.Mesh(hgm, mats.metal), 'metal')); }
      leaf.userData.isLeaf = true; leaf.position.set(ou0 + 0.07, 0, o.swing === 'out' ? z1 : z0); leaf.rotation.y = (o.swing === 'out' ? -1 : 1) * 1.22; grp.add(leaf);
    }
    u = ou1;
  }
  piece(u, L, 0, h);
  parent.add(grp);
  return cols;
}

// ------------------------------------------------------------------ una planta completa
// Devuelve { group, colliders, wallGroups, labels }
export function buildLevel(THREE, mats, level, layout) {
  const Y0 = LEVEL_Y[level], g = new THREE.Group(); g.name = 'interior_' + level;
  const { flat } = helpers(THREE, mats, g);
  const colliders = [], wallGroups = [];
  const { low, up } = STAIR;

  // suelos
  for (const r of layout.rooms) {
    if (r.stair && level === 'P1') {
      flat([[0, 0], [1.71, 0], [1.71, low.d0], [0, low.d0]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[0, up.d1], [1.71, up.d1], [1.71, 4.04], [S(4.04), 4.04]], Y0 + 0.01, r.floor, 'rellano');
      flat([[low.s1 + 0.02, low.d0], [1.71, low.d0], [1.71, up.d1], [low.s1 + 0.02, up.d1]], Y0 + 0.005, r.floor, 'bajo_tramo');
    } else if (r.stair && level === 'P2') {
      flat([[0, 0], [up.s0 - 0.02, 0], [up.s0 - 0.02, 3.96], [S(3.96), 3.96]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[up.s0 - 0.02, 0], [1.71, 0], [1.71, up.d0], [up.s0 - 0.02, up.d0]], Y0 + 0.01, r.floor, 'llegada');
      flat([[up.s0 - 0.02, up.d1], [1.71, up.d1], [1.71, 3.96], [up.s0 - 0.02, 3.96]], Y0 + 0.01, r.floor, 'rellano');
    } else flat(r.poly, Y0 + 0.01, r.floor, 'suelo');
  }

  // envolvente exterior (no editable)
  const T_EXT = 0.25, env = new THREE.Group(); env.name = 'envolvente'; g.add(env);
  const winP = WINDOWS.filter(w => w.lv === level).map(w => Wn(w.s0, w.s1, w.y0 - Y0, w.y1 - Y0));
  const hAt = (p, q) => level === 'P1' ? H.P2 - H.P1 : Math.max(roofH(p[1]), roofH(q[1]), (p[1] - H.RIDGE_D) * (q[1] - H.RIDGE_D) < 0 ? H.RIDGE : 0) - Y0 + 0.05;
  const E = [
    [[0, 0], [11.7, 0], winP],
    [[11.7, 0], [10.84, 3.31], []],
    [[10.84, 3.31], [10.0, 6.54], [], level === 'P1' ? { L: [BATH] } : {}],
    [[10.0, 6.54], [8.85, 10.74], [], level === 'P1' ? { L: [{ ...BATH, u1: 0.55 }, { ...WAIN, u0: 0.55 }] } : {}],
    [[8.85, 10.74], [3.91, 10.64], [], level === 'P1' ? { L: [WAIN] } : {}],
    [[3.91, 10.64], [4.0, 6.77], level === 'P1' ? [{ u0: 0.8, u1: 3.1, y0: 0, y1: 2.15, kind: 'slide' }] : [{ u0: 1.0, u1: 2.5, y0: 0.9, y1: 2.1, kind: 'slide', parts: 2 }], level === 'P1' ? { L: [WAIN] } : {}],
    [[4.0, 6.77], [-0.18, 6.69], [Wn(1.5, 2.7, 0.9, 2.1)]],
    [[-0.18, 6.69], [0, 0], []],
  ];
  for (const [a, b, holes, fin] of E) colliders.push(...buildWall(THREE, mats, env, Y0, { a, b, t: T_EXT, h: hAt(a, b), holes, fin, align: 'in' }, { name: 'muro_exterior' }));

  // tabiques (editables)
  layout.walls.forEach((w, i) => {
    const before = g.children.length;
    colliders.push(...buildWall(THREE, mats, g, Y0, { t: 0.1, h: level === 'P1' ? 2.6 : 2.5, ...w }, { name: 'tabique', userData: { wallIndex: i, level } }));
    if (g.children.length > before) wallGroups.push(g.children.at(-1));
  });

  // techos y luces (solo al pasear)
  const ceil = new THREE.Group(); ceil.name = 'techos'; ceil.visible = false; g.add(ceil);
  const lights = new THREE.Group(); lights.name = 'luces'; lights.visible = false; g.add(lights);
  if (level === 'P1') {
    for (const r of layout.rooms) flat(r.poly, Y0 + (r.stair ? 2.88 : 2.6), 'ceiling', 'techo', ceil, r.stair ? [[[up.s0, up.d0], [up.s1, up.d0], [up.s1, up.d1], [up.s0, up.d1]]] : []);
  } else { // techo inclinado bajo la cubierta
    const under = d => roofH(d) - 0.25;
    const clip = (poly, keepBelow) => { const out = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], ip = keepBelow ? p[1] <= H.RIDGE_D : p[1] >= H.RIDGE_D, iq = keepBelow ? q[1] <= H.RIDGE_D : q[1] >= H.RIDGE_D; if (ip) out.push(p); if (ip !== iq) { const t = (H.RIDGE_D - p[1]) / (q[1] - p[1]); out.push([p[0] + t * (q[0] - p[0]), H.RIDGE_D]); } } return out; };
    for (const pc of [clip(OUTLINE, true), clip(OUTLINE, false)]) if (pc.length > 2) flat(pc, under, 'ceiling', 'techo_inclinado', ceil);
  }
  for (const r of layout.rooms) { if (r.stair) continue; const [cs, cd] = centroid(r.poly), y = level === 'P1' ? Y0 + 2.35 : Math.min(roofH(cd) - 0.6, Y0 + 2.6);
    const pl = new THREE.PointLight(0xffe2b8, 9, 7, 2); pl.position.set(cs, y, -cd); lights.add(pl);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), mats.lamp); lamp.position.set(cs, y + 0.22, -cd); ceil.add(lamp); }

  // límites del hueco de escalera en esta planta
  if (level === 'P1') colliders.push({ a: [low.s1 + 0.03, low.d0], b: [low.s1 + 0.03, low.d1], t: 0.04 }, { a: [low.s0, low.d1], b: [low.s1 + 0.03, low.d1], t: 0.04 }, { a: [low.s0, low.d0], b: [low.s1, low.d0], t: 0.04 });
  else colliders.push({ a: [up.s0 - 0.02, up.d0], b: [up.s0 - 0.02, up.d1], t: 0.04 }, { a: [up.s0, up.d1], b: [up.s1, up.d1], t: 0.04 });

  const labels = layout.rooms.filter(r => !r.stair).map(r => ({ name: r.name, area: polyArea(r.poly), at: centroid(r.poly), y: Y0 }));
  return { group: g, colliders, wallGroups, labels, ceil, lights };
}

// ------------------------------------------------------------------ escalera en U con barandillas negras
export function buildStairs(THREE, mats) {
  const g = new THREE.Group(); g.name = 'escalera'; const { mesh } = helpers(THREE, mats, g);
  const box = (s0, s1, y0, y1, d0, d1, mat, name) => { const geo = new THREE.BoxGeometry(s1 - s0, y1 - y0, d1 - d0); geo.translate((s0 + s1) / 2, (y0 + y1) / 2, -(d0 + d1) / 2); return mesh(geo, mat, name); };
  function flight(f, dStart, dEnd, yStart, yEnd, n, name) {
    const rise = (yEnd - yStart) / n, run = (dEnd - dStart) / n, dir = Math.sign(run), w = f.s1 - f.s0;
    for (let i = 0; i < n; i++) {
      const dA = dStart + i * run, yTop = yStart + (i + 1) * rise;
      const tg = new THREE.BoxGeometry(w, 0.035, Math.abs(run) + 0.025); tg.translate((f.s0 + f.s1) / 2, yTop - 0.0175, -(dA + run / 2 + dir * 0.0125)); mesh(tg, 'step', name + '_huella');
      const rg = new THREE.BoxGeometry(w, rise - 0.035, 0.02); rg.translate((f.s0 + f.s1) / 2, yTop - 0.035 - (rise - 0.035) / 2, -(dA + dir * 0.01)); mesh(rg, 'wallInt', name + '_tabica');
    }
    const L = Math.hypot(dEnd - dStart, yEnd - yStart), ang = Math.atan2(yEnd - yStart, Math.abs(dEnd - dStart));
    const sm = mesh(new THREE.BoxGeometry(w, 0.14, L), 'wallInt', name + '_losa');
    sm.position.set((f.s0 + f.s1) / 2, (yStart + yEnd) / 2 - 0.16, -(dStart + dEnd) / 2); sm.rotation.x = dir > 0 ? ang : -ang;
  }
  function rail(s, dA, dB, yA, yB, name) {
    const L = Math.abs(dB - dA), n = Math.max(2, Math.round(L / 0.11));
    for (let i = 0; i <= n; i++) { const d = dA + (dB - dA) * i / n, yb = yA + (yB - yA) * i / n; box(s - 0.009, s + 0.009, yb, yb + 0.9, d - 0.009, d + 0.009, 'railBlack', name); }
    const hl = Math.hypot(dB - dA, yB - yA), hm = mesh(new THREE.BoxGeometry(0.045, 0.045, hl), 'railBlack', name);
    hm.position.set(s, (yA + yB) / 2 + 0.92, -(dA + dB) / 2); hm.rotation.x = Math.atan2(yB - yA, Math.abs(dB - dA)) * (dB > dA ? 1 : -1);
  }
  function railS(d, s0, s1, y, name) { for (let s = s0; s <= s1; s += 0.11) box(s - 0.009, s + 0.009, y, y + 0.9, d - 0.009, d + 0.009, 'railBlack', name); box(s0, s1, y + 0.9, y + 0.945, d - 0.022, d + 0.022, 'railBlack', name); }
  const { low, up } = STAIR;
  flight(low, low.d0, low.d1, 0, H.P1, 17, 'tramo_PB_P1');
  rail(low.s1 + 0.02, low.d0, low.d1, 0, H.P1, 'barandilla');
  flight(up, up.d1, up.d0, H.P1, H.P2, 15, 'tramo_P1_P2');
  rail(up.s0 - 0.01, up.d1, up.d0, H.P1, H.P2, 'barandilla');
  railS(low.d0 - 0.02, low.s0, low.s1, H.P1, 'barandilla_P1');      // hueco en P1, lado fachada
  rail(up.s0 - 0.02, up.d0, up.d1, H.P2, H.P2, 'barandilla_P2');     // hueco en P2 (foto 14)
  railS(up.d1 + 0.02, up.s0, up.s1, H.P2, 'barandilla_P2');
  return g;
}

// Altura del suelo para el personaje. Devuelve {y, level} o null si es el tramo de escalera.
export function stairHeight(s, d) {
  const { up } = STAIR;
  if (s > up.s0 && s < up.s1 && d > up.d0 && d < up.d1) return H.P1 + (H.P2 - H.P1) * (up.d1 - d) / (up.d1 - up.d0);
  return null;
}
export const STAIR_COLLIDERS = [
  { a: [STAIR.up.s0 - 0.03, STAIR.up.d0], b: [STAIR.up.s0 - 0.03, STAIR.up.d1], t: 0.04 },
  { a: [1.69, STAIR.up.d0], b: [1.69, STAIR.up.d1], t: 0.04 },
];
