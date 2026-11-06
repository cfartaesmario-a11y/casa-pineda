// INTERIOR PLANTA 1 — a partir del boceto del propietario (nov. 2026),
// ajustado a las ventanas reales de fachada y al contorno del Catastro.
// Cotas en el marco de fachada (s, d) en metros; vértice 3D = (s, y, -d). Suelo acabado a H.P1.
import { H, WINDOWS } from './model.js';

// Bordes de la parcela a una profundidad d (medianera norte con el n.º 3 y medianera sur con el taller)
const NORTH_AT = d => d <= 3.31 ? 11.7 - d * (0.86 / 3.31) : d <= 6.54 ? 10.84 - (d - 3.31) * (0.84 / 3.23) : 10.0 - (d - 6.54) * (1.15 / 4.2);
const SOUTH_AT = d => -0.18 * Math.min(1, d / 6.69);

export const P1_ROOMS = [
  { id: 'escalera', name: 'Escalera', floor: 'floorLight', poly: [[0, 0], [2.05, 0], [2.05, 4.4], [SOUTH_AT(4.4), 4.4]] },
  { id: 'habA', name: 'Habitación 1', floor: 'floorLight', poly: [[2.05, 0], [4.45, 0], [4.45, 2.9], [2.05, 2.9]] },
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

export function buildInteriorP1(THREE, mats) {
  const Y0 = H.P1, HF = H.P2 - H.P1; // 2,90 m entre forjados
  const g = new THREE.Group(); g.name = 'interior_P1';
  const tag = (m, mat) => { m.userData = { mat, role: 'interior' }; m.castShadow = m.receiveShadow = true; return m; };
  const mesh = (geo, mat, name) => { const m = tag(new THREE.Mesh(geo, mats[mat]), mat); m.name = name; g.add(m); return m; };
  const box = (s0, s1, y0, y1, d0, d1, mat, name) => { const geo = new THREE.BoxGeometry(s1 - s0, y1 - y0, d1 - d0); geo.translate((s0 + s1) / 2, Y0 + (y0 + y1) / 2, -(d0 + d1) / 2); return mesh(geo, mat, name); };

  // --- suelos por estancia (con hueco de escalera) ---
  const flat = (poly, y, mat, name) => {
    const c = poly.map(([s, d]) => new THREE.Vector2(s, d)); const tri = THREE.ShapeUtils.triangulateShape(c, []);
    const pos = []; for (const [a, b, cc] of tri) for (const i of [a, cc, b]) pos.push(poly[i][0], y, -poly[i][1]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i], pos[i + 2]); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return mesh(geo, mat, name);
  };
  const HOLE = { s0: 0.15, s1: 1.15, d0: 0.5, d1: 4.05 };
  for (const r of P1_ROOMS) {
    if (r.id === 'terraza') continue; // la terraza ya existe en el modelo exterior
    if (r.id === 'escalera') {
      flat([[HOLE.s1, 0], [2.05, 0], [2.05, 4.4], [HOLE.s1, 4.4]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[0, 0], [HOLE.s1, 0], [HOLE.s1, HOLE.d0], [0, HOLE.d0]], Y0 + 0.01, r.floor, 'suelo_escalera');
      flat([[-0.08, HOLE.d1], [HOLE.s1, HOLE.d1], [HOLE.s1, 4.4], [SOUTH_AT(4.4), 4.4]], Y0 + 0.01, r.floor, 'suelo_escalera');
    } else flat(r.poly, Y0 + 0.01, r.floor, 'suelo_' + r.id);
  }

  // --- muros: segmento a→b con huecos {u0,u1,y0,y1,kind:'window'|'door'|'opening'|'slide'} ---
  function wall(a, b, t, h, holes = [], align = 'center', name = 'tabique') {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.01) return;
    const grp = new THREE.Group(); grp.name = name;
    grp.position.set(a[0], Y0, -a[1]); grp.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const z0 = align === 'in' ? -t : -t / 2, z1 = z0 + t, zc = (z0 + z1) / 2;
    const add = (geo, m) => { grp.add(tag(new THREE.Mesh(geo, mats[m]), m)); };
    const piece = (u0, u1, y0, y1) => {
      if (u1 - u0 < 0.005 || y1 - y0 < 0.005) return;
      const geo = new THREE.BoxGeometry(u1 - u0, y1 - y0, t); geo.translate((u0 + u1) / 2, (y0 + y1) / 2, zc); add(geo, 'wallInt');
      if (align === 'in') { const sk = new THREE.BoxGeometry(u1 - u0, y1 - y0, 0.015); sk.translate((u0 + u1) / 2, (y0 + y1) / 2, z1 + 0.008); add(sk, 'wall'); } // cara exterior con el revoco de fachada
    };
    let u = 0;
    for (const o of holes.slice().sort((p, q) => p.u0 - q.u0)) {
      piece(u, o.u0, 0, h); piece(o.u0, o.u1, 0, o.y0); piece(o.u0, o.u1, Math.min(o.y1, h), h);
      if (o.kind === 'window' || o.kind === 'slide') { // vidrio + carpintería blanca
        const gg = new THREE.BoxGeometry(o.u1 - o.u0, o.y1 - o.y0, 0.02); gg.translate((o.u0 + o.u1) / 2, (o.y0 + o.y1) / 2, zc); add(gg, 'glassIn');
        const parts = o.kind === 'slide' ? 3 : 2;
        for (let k = 0; k <= parts; k++) { const uu = o.u0 + (o.u1 - o.u0) * k / parts; const fg = new THREE.BoxGeometry(0.05, o.y1 - o.y0, 0.06); fg.translate(uu, (o.y0 + o.y1) / 2, zc); add(fg, 'pvc'); }
        for (const yy of [o.y0, o.y1]) { const fg = new THREE.BoxGeometry(o.u1 - o.u0, 0.05, 0.06); fg.translate((o.u0 + o.u1) / 2, yy, zc); add(fg, 'pvc'); }
      }
      if (o.kind === 'door') { // hoja abierta ~70°
        const w = o.u1 - o.u0, lg = new THREE.BoxGeometry(w, o.y1 - 0.01, 0.04); lg.translate(w / 2, o.y1 / 2, 0);
        const leaf = tag(new THREE.Mesh(lg, mats.doorLeaf), 'doorLeaf');
        leaf.position.set(o.u0, 0, o.swing === 'out' ? z1 : z0); leaf.rotation.y = (o.swing === 'out' ? 1 : -1) * 1.22; grp.add(leaf);
      }
      u = o.u1;
    }
    piece(u, L, 0, h);
    g.add(grp);
  }
  const Wn = (u0, u1, y0, y1) => ({ u0, u1, y0, y1, kind: 'window' });
  const D = (u0, w = 0.8, swing = 'in') => ({ u0, u1: u0 + w, y0: 0, y1: 2.05, kind: 'door', swing });
  const OP = (u0, w) => ({ u0, u1: u0 + w, y0: 0, y1: 2.1, kind: 'opening' });

  // Envolvente: muros exteriores de 25 cm hacia dentro, sobre el contorno CCW de los cuerpos 1+3+4
  const T_EXT = 0.25;
  const facadeWin = WINDOWS.filter(w => w.lv === 'P1').map(w => Wn(w.s0, w.s1, w.y0 - Y0, w.y1 - Y0));
  wall([0, 0], [11.7, 0], T_EXT, HF, facadeWin, 'in', 'fachada');
  wall([11.7, 0], [10.84, 3.31], T_EXT, HF, [], 'in', 'medianera_n3');
  wall([10.84, 3.31], [10.0, 6.54], T_EXT, HF, [], 'in', 'medianera_n3');
  wall([10.0, 6.54], [8.85, 10.74], T_EXT, HF, [], 'in', 'muro_salon_norte');
  wall([8.85, 10.74], [3.91, 10.64], T_EXT, HF, [], 'in', 'muro_fondo');
  wall([3.91, 10.64], [4.0, 6.77], T_EXT, HF, [{ u0: 0.9, u1: 3.1, y0: 0, y1: 2.15, kind: 'slide' }], 'in', 'ventanal_terraza');
  wall([4.0, 6.77], [-0.18, 6.69], T_EXT, HF, [Wn(1.5, 2.7, 0.9, 2.1)], 'in', 'ventana_hab3_terraza');
  wall([-0.18, 6.69], [0, 0], T_EXT, HF, [], 'in', 'medianera_sur');

  // Tabiques de 10 cm, altura libre 2,60 m
  const T = 0.10, HT = 2.60;
  wall([2.05, 0.25], [2.05, 2.9], T, HT, [], 'center', 'tabique_escalera_hab1');
  wall([2.05, 2.9], [4.45, 2.9], T, HT, [D(1.3, 0.8)], 'center', 'tabique_hab1');
  wall([4.45, 0.25], [4.45, 2.9], T, HT, [], 'center', 'tabique_hab1_salon2');
  wall([8.65, 0.25], [8.65, 2.9], T, HT, [], 'center', 'tabique_salon2_hab2');
  wall([8.65, 2.9], [NORTH_AT(2.9) - 0.2, 2.9], T, HT, [D(0.3, 0.8)], 'center', 'tabique_hab2');
  wall([0.0, 4.4], [NORTH_AT(4.4) - 0.2, 4.4], T, HT, [D(2.8, 0.8, 'out'), D(4.45, 0.7, 'out'), OP(6.3, 1.0)], 'center', 'tabique_pasillo');
  wall([4.05, 4.4], [4.05, 6.6], T, HT, [], 'center', 'tabique_hab3_bano');
  wall([5.6, 4.4], [5.6, 6.9], T, HT, [], 'center', 'tabique_bano_cocina');
  wall([4.15, 6.9], [NORTH_AT(6.9) - 0.2, 6.9], T, HT, [OP(3.5, 0.9)], 'center', 'tabique_cocina_salon');

  // --- escalera desde planta baja: 17 peldaños de 20 cm + barandilla metálica ---
  const N = 17, rise = H.P1 / N, run = (HOLE.d1 - HOLE.d0) / N;
  for (let i = 0; i < N; i++) {
    const d0 = HOLE.d0 + i * run;
    const geo = new THREE.BoxGeometry(HOLE.s1 - HOLE.s0, 0.04, run + 0.03); geo.translate((HOLE.s0 + HOLE.s1) / 2, (i + 1) * rise - 0.02, -(d0 + run / 2));
    tag(g.add(new THREE.Mesh(geo, mats.step)) && g.children.at(-1), 'step').name = 'peldano';
    const zgeo = new THREE.BoxGeometry(HOLE.s1 - HOLE.s0, (i + 1) * rise - 0.04, run); zgeo.translate((HOLE.s0 + HOLE.s1) / 2, ((i + 1) * rise - 0.04) / 2, -(d0 + run / 2));
    tag(g.add(new THREE.Mesh(zgeo, mats.wallInt)) && g.children.at(-1), 'wallInt').name = 'zanca';
  }
  box(HOLE.s1, HOLE.s1 + 0.04, 0.9, 0.95, HOLE.d0, HOLE.d1, 'rail', 'pasamanos');
  for (let d = HOLE.d0 + 0.05; d <= HOLE.d1; d += 0.12) box(HOLE.s1 + 0.01, HOLE.s1 + 0.03, 0, 0.9, d, d + 0.02, 'rail', 'barrote');
  box(HOLE.s0, HOLE.s1, 0.9, 0.95, HOLE.d0 - 0.04, HOLE.d0, 'rail', 'pasamanos');

  // --- chimenea de piedra en la pared del fondo del salón + pared de piedra + vigas de madera ---
  const fd1 = 10.66 - T_EXT, fd0 = fd1 - 0.65, fs0 = 6.5, fs1 = 8.1;
  box(5.0, 8.6, 0.95, 2.55, fd1 - 0.04, fd1, 'stone', 'pared_piedra');
  box(fs0, fs1, 0, 0.45, fd0, fd1, 'stone', 'chimenea_base');
  box(fs0, fs0 + 0.22, 0.45, 1.3, fd0, fd1, 'stone', 'chimenea_lateral');
  box(fs1 - 0.22, fs1, 0.45, 1.3, fd0, fd1, 'stone', 'chimenea_lateral');
  box(fs0 + 0.22, fs1 - 0.22, 0.45, 1.3, fd1 - 0.08, fd1 - 0.04, 'fireDark', 'hogar');
  box(fs0 - 0.05, fs1 + 0.05, 1.3, 1.45, fd0 - 0.05, fd1, 'beam', 'chimenea_repisa');
  {
    const hh = HF - 1.45, hgeo = new THREE.CylinderGeometry(0.4, 1.0, hh, 4, 1);
    hgeo.rotateY(Math.PI / 4); hgeo.scale(1, 1, 0.5); hgeo.translate((fs0 + fs1) / 2, Y0 + 1.45 + hh / 2, -(fd1 - 0.33));
    mesh(hgeo, 'stone', 'chimenea_campana');
  }
  for (const s of [4.9, 6.1, 7.3, 8.4]) box(s - 0.07, s + 0.07, HF - 0.34, HF - 0.14, 6.95, s < 8.6 ? 10.64 - T_EXT : 10.2, 'beam', 'viga');
  return g;
}
