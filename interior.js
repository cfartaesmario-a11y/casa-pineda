// INTERIOR PLANTA 1 — a partir del boceto del propietario (nov. 2026), ajustado a las ventanas de
// fachada, al contorno del Catastro y a las fotos del anuncio (acabados, escalera, chimenea).
// Cotas en el marco de fachada (s, d) en metros; vértice 3D = (s, y, -d). Suelo acabado a H.P1.
import { H, WINDOWS } from './model.js';

// Bordes de la parcela a una profundidad d (medianera norte con el n.º 3 y medianera sur con el taller)
export const NORTH_AT = d => d <= 3.31 ? 11.7 - d * (0.86 / 3.31) : d <= 6.54 ? 10.84 - (d - 3.31) * (0.84 / 3.23) : 10.0 - (d - 6.54) * (1.15 / 4.2);
const SOUTH_AT = d => -0.18 * Math.min(1, d / 6.69);

export const P1_ROOMS = [
  { id: 'escalera', name: 'Escalera', floor: 'floorLight', poly: [[0, 0], [2.05, 0], [2.05, 4.4], [SOUTH_AT(4.4), 4.4]] },
  { id: 'habA', name: 'Habitación 1', floor: 'floorTerracotta', poly: [[2.05, 0], [4.45, 0], [4.45, 2.9], [2.05, 2.9]] },
  { id: 'salon2', name: 'Salón 2', floor: 'floorLight', poly: [[4.45, 0], [8.65, 0], [8.65, 2.9], [4.45, 2.9]] },
  { id: 'habC', name: 'Habitación 2', floor: 'floorLight', poly: [[8.65, 0], [11.7, 0], [NORTH_AT(2.9), 2.9], [8.65, 2.9]] },
  { id: 'pasillo', name: 'Pasillo', floor: 'floorLight', poly: [[2.05, 2.9], [NORTH_AT(2.9), 2.9], [10.84, 3.31], [NORTH_AT(4.4), 4.4], [2.05, 4.4]] },
  { id: 'habB', name: 'Habitación 3', floor: 'floorTerracotta', poly: [[SOUTH_AT(4.4), 4.4], [4.05, 4.4], [4.05, 6.77], [-0.18, 6.69]] },
  { id: 'bano', name: 'Baño', floor: 'floorBath', poly: [[4.05, 4.4], [5.6, 4.4], [5.6, 6.85], [4.05, 6.77]] },
  { id: 'cocina', name: 'Cocina', floor: 'floorLight', poly: [[5.6, 4.4], [NORTH_AT(4.4), 4.4], [10.0, 6.54], [NORTH_AT(6.9), 6.9], [5.6, 6.9]] },
  { id: 'salon1', name: 'Salón con chimenea', floor: 'floorTerracotta', poly: [[4.0, 6.9], [NORTH_AT(6.9), 6.9], [8.85, 10.74], [3.91, 10.64]] },
  { id: 'terraza', name: 'Terraza', floor: 'floorTerracotta', poly: [[-0.18, 6.69], [4.0, 6.77], [3.91, 10.64], [-0.27, 10.55]], outdoor: true },
];
export function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
export function centroid(p) { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; }

// Acabados de pared (por cara): alicatado de cocina y baño, zócalo de barro del salón (fotos 1-4 y 10)
const KIT = { mat: 'kitchenTile', h: 2.0, band: 'kitchenBand' };
const BATH = { mat: 'bathWallTile', h: 2.1 };
const WAIN = { mat: 'wainscot', h: 0.95, band: 'wainscotBand' };

export function buildInteriorP1(THREE, mats) {
  const Y0 = H.P1, HF = H.P2 - H.P1; // 2,90 m entre forjados
  const g = new THREE.Group(); g.name = 'interior_P1';
  const tag = (m, mat) => { m.userData = { mat, role: 'interior' }; m.castShadow = m.receiveShadow = true; return m; };
  const meters = (geo, w, h) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); return geo; };
  const mesh = (geo, mat, name, parent = g) => { const m = tag(new THREE.Mesh(geo, mats[mat]), mat); m.name = name; parent.add(m); return m; };
  const box = (s0, s1, y0, y1, d0, d1, mat, name) => { const geo = meters(new THREE.BoxGeometry(s1 - s0, y1 - y0, d1 - d0), Math.max(s1 - s0, d1 - d0), y1 - y0); geo.translate((s0 + s1) / 2, Y0 + (y0 + y1) / 2, -(d0 + d1) / 2); return mesh(geo, mat, name); };

  // ---------------- suelos ----------------
  const flat = (poly, y, mat, name) => {
    const c = poly.map(([s, d]) => new THREE.Vector2(s, d)); const tri = THREE.ShapeUtils.triangulateShape(c, []);
    const pos = [], uv = []; for (const [a, b, cc] of tri) for (const i of [a, cc, b]) { pos.push(poly[i][0], y, -poly[i][1]); uv.push(poly[i][0], poly[i][1]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    return mesh(geo, mat, name);
  };
  const HOLE = { s0: 0.12, s1: 1.07, d0: 0.45, d1: 4.05 };      // tramo PB → P1
  const UP = { s0: 1.13, s1: 2.0, d0: 0.45, d1: 4.05 };         // tramo P1 → P2 (escalera en U, fotos 13-14)
  for (const r of P1_ROOMS) {
    if (r.id === 'terraza') continue; // la terraza la construye el modelo exterior
    if (r.id === 'escalera') {
      flat([[HOLE.s1, 0], [2.05, 0], [2.05, 4.4], [HOLE.s1, 4.4]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[0, 0], [HOLE.s1, 0], [HOLE.s1, HOLE.d0], [0, HOLE.d0]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[-0.08, HOLE.d1], [HOLE.s1, HOLE.d1], [HOLE.s1, 4.4], [SOUTH_AT(4.4), 4.4]], Y0 + 0.01, r.floor, 'suelo_rellano');
    } else flat(r.poly, Y0 + 0.01, r.floor, 'suelo_' + r.id);
  }

  // ---------------- muros ----------------
  // wall(a, b, grosor, alto, huecos, alineación, nombre, acabados {L:[{u0,u1,...KIT}], R:[...]})
  // Cara L = izquierda del sentido a→b (z local negativa), cara R = derecha (z positiva).
  function wall(a, b, t, h, holes = [], align = 'center', name = 'tabique', fin = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.01) return;
    const grp = new THREE.Group(); grp.name = name;
    grp.position.set(a[0], Y0, -a[1]); grp.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const z0 = align === 'in' ? -t : -t / 2, z1 = z0 + t, zc = (z0 + z1) / 2;
    const add = (geo, m) => { const me = tag(new THREE.Mesh(geo, mats[m]), m); grp.add(me); return me; };
    const slab = (u0, u1, y0, y1, zA, zB, m) => { if (u1 - u0 < 0.004 || y1 - y0 < 0.004) return; const geo = meters(new THREE.BoxGeometry(u1 - u0, y1 - y0, zB - zA), u1 - u0, y1 - y0); geo.translate((u0 + u1) / 2, (y0 + y1) / 2, (zA + zB) / 2); add(geo, m); };
    const faces = [];
    if (align !== 'in' || true) faces.push({ side: 'L', z: z0, dir: -1 });
    if (align !== 'in') faces.push({ side: 'R', z: z1, dir: 1 });
    const piece = (u0, u1, y0, y1) => {
      if (u1 - u0 < 0.004 || y1 - y0 < 0.004) return;
      slab(u0, u1, y0, y1, z0, z1, 'wallInt');
      if (align === 'in') slab(u0, u1, y0, y1, z1, z1 + 0.015, 'wall'); // revoco de fachada por fuera
      for (const f of faces) {
        const zz = f.z, sk = (th) => f.dir < 0 ? [zz - th, zz] : [zz, zz + th];
        if (y0 === 0) slab(u0, u1, 0, Math.min(0.08, y1), ...sk(0.012), 'skirting'); // rodapié
        for (const fi of (fin[f.side] || [])) {
          const a0 = Math.max(u0, fi.u0 ?? 0), a1 = Math.min(u1, fi.u1 ?? L); if (a1 <= a0) continue;
          const yy0 = y0, yy1 = Math.min(y1, fi.h); if (yy1 > yy0) slab(a0, a1, yy0, yy1, ...sk(0.016), fi.mat);
          if (fi.band && y0 <= fi.h && y1 >= fi.h) slab(a0, a1, fi.h - 0.06, fi.h, ...sk(0.02), fi.band);
        }
      }
    };
    let u = 0;
    for (const o of holes.slice().sort((p, q) => p.u0 - q.u0)) {
      piece(u, o.u0, 0, h); piece(o.u0, o.u1, 0, o.y0); piece(o.u0, o.u1, Math.min(o.y1, h), h);
      const w = o.u1 - o.u0, oy = (o.y0 + o.y1) / 2, oh = o.y1 - o.y0;
      if (o.kind === 'window' || o.kind === 'slide') { // vidrio, carpintería y alféizar
        const gg = new THREE.BoxGeometry(w, oh, 0.012); gg.translate(o.u0 + w / 2, oy, zc); add(gg, 'glassIn');
        const parts = o.kind === 'slide' ? 3 : 2, fw = 0.055;
        for (let k = 0; k <= parts; k++) { const uu = o.u0 + w * k / parts; const fg = new THREE.BoxGeometry(fw, oh, 0.07); fg.translate(Math.min(Math.max(uu, o.u0 + fw / 2), o.u1 - fw / 2), oy, zc); add(fg, o.kind === 'slide' ? 'alu' : 'pvc'); }
        for (const yy of [o.y0 + fw / 2, o.y1 - fw / 2]) { const fg = new THREE.BoxGeometry(w, fw, 0.07); fg.translate(o.u0 + w / 2, yy, zc); add(fg, o.kind === 'slide' ? 'alu' : 'pvc'); }
        if (o.kind === 'window') { const sg = new THREE.BoxGeometry(w + 0.1, 0.03, t / 2 + 0.05); sg.translate(o.u0 + w / 2, o.y0 - 0.015, z0 + (t / 2 + 0.05) / 2 - 0.05); add(sg, 'marble'); }
      }
      if (o.kind === 'door' || o.kind === 'opening') { // marco (galce + tapajuntas)
        const jw = 0.07, jd = t + 0.03;
        for (const uu of [o.u0 + jw / 2, o.u1 - jw / 2]) { const jg = new THREE.BoxGeometry(jw, o.y1, jd); jg.translate(uu, o.y1 / 2, zc); add(jg, o.kind === 'door' ? 'doorFrame' : 'wallInt'); }
        const hg = new THREE.BoxGeometry(w, jw, jd); hg.translate(o.u0 + w / 2, o.y1 - jw / 2, zc); add(hg, o.kind === 'door' ? 'doorFrame' : 'wallInt');
      }
      if (o.kind === 'door') { // hoja de madera con plafones y maneta, abierta ~70°
        const lw = w - 0.14, lh = o.y1 - 0.08, leaf = new THREE.Group();
        const lg = new THREE.BoxGeometry(lw, lh, 0.04); lg.translate(lw / 2, lh / 2, 0); const lm = tag(new THREE.Mesh(lg, mats.doorLeaf), 'doorLeaf'); leaf.add(lm);
        for (const side of [-1, 1]) for (const [py, ph] of [[0.25, 0.75], [1.15, 0.7]]) {
          const pg = new THREE.BoxGeometry(lw - 0.2, ph, 0.006); pg.translate(lw / 2, py + ph / 2, side * 0.022); leaf.add(tag(new THREE.Mesh(pg, mats.doorPanel), 'doorPanel'));
        }
        for (const side of [-1, 1]) { const hgm = new THREE.BoxGeometry(0.12, 0.018, 0.018); hgm.translate(lw - 0.12, 1.02, side * 0.045); leaf.add(tag(new THREE.Mesh(hgm, mats.metal), 'metal'));
          const rose = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16); rose.rotateX(Math.PI / 2); rose.translate(lw - 0.07, 1.02, side * 0.025); leaf.add(tag(new THREE.Mesh(rose, mats.metal), 'metal')); }
        leaf.position.set(o.u0 + 0.07, 0, o.swing === 'out' ? z1 : z0); leaf.rotation.y = (o.swing === 'out' ? 1 : -1) * 1.22; grp.add(leaf);
      }
      u = o.u1;
    }
    piece(u, L, 0, h);
    g.add(grp);
  }
  const Wn = (u0, u1, y0, y1) => ({ u0, u1, y0, y1, kind: 'window' });
  const D = (u0, w = 0.82, swing = 'in') => ({ u0, u1: u0 + w, y0: 0, y1: 2.05, kind: 'door', swing });
  const OP = (u0, w) => ({ u0, u1: u0 + w, y0: 0, y1: 2.1, kind: 'opening' });
  const seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  // Envolvente: 25 cm hacia dentro sobre el contorno CCW de los cuerpos 1+3+4 (interior a la izquierda)
  const T_EXT = 0.25;
  const facadeWin = WINDOWS.filter(w => w.lv === 'P1').map(w => Wn(w.s0, w.s1, w.y0 - Y0, w.y1 - Y0));
  const n44 = [NORTH_AT(4.4), 4.4], n69 = [NORTH_AT(6.9), 6.9];
  wall([0, 0], [11.7, 0], T_EXT, HF, facadeWin, 'in', 'fachada');
  wall([11.7, 0], [10.84, 3.31], T_EXT, HF, [], 'in', 'medianera_n3');
  wall([10.84, 3.31], n44, T_EXT, HF, [], 'in', 'medianera_n3');
  wall(n44, [10.0, 6.54], T_EXT, HF, [], 'in', 'medianera_cocina', { L: [KIT] });
  wall([10.0, 6.54], n69, T_EXT, HF, [], 'in', 'medianera_cocina', { L: [KIT] });
  wall(n69, [8.85, 10.74], T_EXT, HF, [], 'in', 'muro_salon_norte', { L: [WAIN] });
  wall([8.85, 10.74], [3.91, 10.64], T_EXT, HF, [], 'in', 'muro_fondo', { L: [{ ...WAIN, u0: 0, u1: 0.4 }, { ...WAIN, u0: 4.05 }] });
  wall([3.91, 10.64], [4.0, 6.77], T_EXT, HF, [{ u0: 0.8, u1: 3.1, y0: 0, y1: 2.15, kind: 'slide' }], 'in', 'ventanal_terraza', { L: [WAIN] });
  wall([4.0, 6.77], [-0.18, 6.69], T_EXT, HF, [Wn(1.5, 2.7, 0.9, 2.1)], 'in', 'ventana_hab3_terraza');
  wall([-0.18, 6.69], [0, 0], T_EXT, HF, [], 'in', 'medianera_sur');

  // Tabiques de 10 cm, altura libre 2,60 m
  const T = 0.10, HT = 2.60;
  const pEnd = NORTH_AT(4.4) - 0.2;
  wall([2.05, 0.25], [2.05, 2.9], T, HT, [], 'center', 'tabique_escalera_hab1');
  wall([2.05, 2.9], [4.45, 2.9], T, HT, [D(1.3)], 'center', 'tabique_hab1');
  wall([4.45, 0.25], [4.45, 2.9], T, HT, [], 'center', 'tabique_hab1_salon2');
  wall([8.65, 0.25], [8.65, 2.9], T, HT, [], 'center', 'tabique_salon2_hab2');
  wall([8.65, 2.9], [NORTH_AT(2.9) - 0.2, 2.9], T, HT, [D(0.3)], 'center', 'tabique_hab2');
  wall([0.0, 4.4], [pEnd, 4.4], T, HT, [D(2.8, 0.82, 'out'), D(4.45, 0.72, 'out'), OP(6.3, 1.0)], 'center', 'tabique_pasillo',
    { L: [{ ...BATH, u0: 4.05, u1: 5.6 }, { ...KIT, u0: 5.6 }] });
  wall([4.05, 4.4], [4.05, 6.6], T, HT, [], 'center', 'tabique_hab3_bano', { R: [BATH] });
  wall([5.6, 4.4], [5.6, 6.9], T, HT, [], 'center', 'tabique_bano_cocina', { L: [BATH], R: [KIT] });
  wall([4.15, 6.9], [n69[0] - 0.2, 6.9], T, HT, [OP(3.5, 0.9)], 'center', 'tabique_cocina_salon',
    { L: [WAIN], R: [{ ...BATH, u0: 0, u1: 1.45 }, { ...KIT, u0: 1.45 }] });

  // ---------------- escalera en U (fotos 13-14): peldaño claro, contrahuella blanca, barandilla negra ----------------
  function flight(s0, s1, dStart, dEnd, yStart, yEnd, n, name) {
    const rise = (yEnd - yStart) / n, run = (dEnd - dStart) / n, dir = Math.sign(run), w = s1 - s0;
    const grp = new THREE.Group(); grp.name = name; g.add(grp);
    for (let i = 0; i < n; i++) {
      const dA = dStart + i * run, yTop = yStart + (i + 1) * rise;
      const tg = new THREE.BoxGeometry(w, 0.035, Math.abs(run) + 0.025); tg.translate((s0 + s1) / 2, Y0 + yTop - 0.0175, -(dA + run / 2 + dir * 0.0125)); mesh(tg, 'step', 'huella', grp);
      const rg = new THREE.BoxGeometry(w, rise - 0.035, 0.02); rg.translate((s0 + s1) / 2, Y0 + yTop - 0.035 - (rise - 0.035) / 2, -(dA + dir * 0.01)); mesh(rg, 'wallInt', 'tabica', grp);
    }
    // losa inclinada bajo el tramo
    const L = Math.hypot(dEnd - dStart, yEnd - yStart), ang = Math.atan2(yEnd - yStart, Math.abs(dEnd - dStart));
    const sg = new THREE.BoxGeometry(w, 0.14, L); const sm = mesh(sg, 'wallInt', 'losa_escalera', grp);
    sm.position.set((s0 + s1) / 2, Y0 + (yStart + yEnd) / 2 - 0.16, -(dStart + dEnd) / 2); sm.rotation.x = dir > 0 ? ang : -ang;
    return { rise, run };
  }
  function railing(s, dA, dB, yA, yB, name) { // barandilla inclinada o recta de barrotes cuadrados
    const L = Math.abs(dB - dA), n = Math.max(2, Math.round(L / 0.11));
    for (let i = 0; i <= n; i++) { const d = dA + (dB - dA) * i / n, yb = yA + (yB - yA) * i / n; box(s - 0.009, s + 0.009, yb, yb + 0.9, d - 0.009, d + 0.009, 'railBlack', name + '_barrote'); }
    const hl = Math.hypot(dB - dA, yB - yA), hg = new THREE.BoxGeometry(0.045, 0.045, hl); const hm = mesh(hg, 'railBlack', name + '_pasamanos');
    hm.position.set(s, Y0 + (yA + yB) / 2 + 0.92, -(dA + dB) / 2); hm.rotation.x = Math.atan2(yB - yA, Math.abs(dB - dA)) * (dB > dA ? 1 : -1);
    for (const [d, y] of [[dA, yA], [dB, yB]]) box(s - 0.025, s + 0.025, y, y + 0.95, d - 0.025, d + 0.025, 'railBlack', name + '_poste');
  }
  flight(HOLE.s0, HOLE.s1, HOLE.d0, HOLE.d1, -Y0, 0, 17, 'tramo_PB_P1');
  railing(HOLE.s1 + 0.02, HOLE.d0, HOLE.d1, -Y0, 0, 'barandilla_tramo1');
  flight(UP.s0, UP.s1, UP.d1, UP.d0, 0, HF, 15, 'tramo_P1_P2');
  railing(UP.s0 + 0.01, UP.d1, UP.d0, 0, HF, 'barandilla_tramo2');
  // barandilla del hueco por el lado de fachada (a lo largo de s)
  for (let s = HOLE.s0 + 0.05; s < HOLE.s1; s += 0.11) box(s - 0.009, s + 0.009, 0, 0.9, HOLE.d0 - 0.03, HOLE.d0 - 0.012, 'railBlack', 'barrote');
  box(HOLE.s0, HOLE.s1 + 0.03, 0.9, 0.945, HOLE.d0 - 0.045, HOLE.d0, 'railBlack', 'pasamanos');

  // ---------------- chimenea de piedra (fotos 1-2) + vigas de madera ----------------
  const fd1 = 10.66 - T_EXT, fd0 = fd1 - 0.7, fs0 = 6.4, fs1 = 8.1;
  box(5.0, 8.6, 0.95, 2.6, fd1 - 0.035, fd1, 'stoneWall', 'pared_piedra');
  box(fs0 - 0.1, fs1 + 0.1, 0, 0.12, fd0 - 0.35, fd1, 'stoneDark', 'chimenea_solera');
  box(fs0, fs1, 0.12, 0.45, fd0, fd1, 'stone', 'chimenea_base');
  box(fs0, fs0 + 0.25, 0.45, 1.3, fd0, fd1, 'stone', 'chimenea_lateral');
  box(fs1 - 0.25, fs1, 0.45, 1.3, fd0, fd1, 'stone', 'chimenea_lateral');
  box(fs0 + 0.25, fs1 - 0.25, 0.45, 1.3, fd1 - 0.12, fd1 - 0.035, 'fireDark', 'hogar');
  box(fs0 + 0.25, fs1 - 0.25, 0.45, 0.47, fd0 + 0.05, fd1 - 0.12, 'fireDark', 'hogar_suelo');
  box(fs0 + 0.3, fs1 - 0.3, 0.47, 0.55, fd0 + 0.25, fd1 - 0.3, 'metal', 'morillos');
  box(fs0 - 0.08, fs1 + 0.08, 1.3, 1.46, fd0 - 0.08, fd1, 'beam', 'chimenea_repisa');
  {
    const hh = HF - 1.46, hgeo = new THREE.CylinderGeometry(0.42, 1.02, hh, 4, 1); hgeo.rotateY(Math.PI / 4); hgeo.scale(1, 1, 0.5);
    hgeo.translate((fs0 + fs1) / 2, Y0 + 1.46 + hh / 2, -(fd1 - 0.36)); mesh(hgeo, 'stone', 'chimenea_campana');
  }
  const beamEnd = s => Math.min(10.64 - T_EXT, 6.54 + (10.0 - 0.3 - s) * (4.2 / 1.15));
  for (const s of [4.75, 5.9, 7.05, 8.2]) box(s - 0.075, s + 0.075, HF - 0.36, HF - 0.14, 6.95, beamEnd(s), 'beam', 'viga');
  box(4.2, 9.9, HF - 0.14, HF - 0.1, 6.95, 7.05, 'beam', 'durmiente');
  return g;
}
