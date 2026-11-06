// Modelo de la vivienda C/ Arnau de Vilanova 1, Pineda de Mar (ref. catastral 4389819DG7048N)
// Sistema local: origen en UTM31 (474235, 4608727). x = Este, z = -Norte (el norte queda hacia -z), y = altura.
// La casa se construye en "coordenadas de fachada": s = metros a lo largo de la fachada desde la esquina SUR
// hacia el norte (0..11,70), d = metros hacia dentro desde la fachada (hacia el oeste). Vértice = (s, y, -d).
// Un grupo rota/traslada ese marco a las coordenadas reales.

// ---- Datos oficiales (Catastro, INSPIRE BuildingPart, EPSG:25831) convertidos al marco de fachada ----
export const BODIES = {
  B1: [[5.79, 3.2], [10.84, 3.31], [10.0, 6.54], [8.85, 10.74], [3.91, 10.64], [4.0, 6.77], [5.71, 6.82]], // 2 plantas, 37,6 m²
  B2: [[-0.18, 6.69], [4.0, 6.77], [3.91, 10.64], [-0.27, 10.55]],                                       // 1 planta, 16,1 m²
  B3: [[0, 0], [5.86, 0], [5.79, 3.2], [5.71, 6.82], [4.0, 6.77], [-0.18, 6.69]],                         // 3 plantas, 39,7 m²
  B4: [[5.86, 0], [11.7, 0], [10.84, 3.31], [5.79, 3.2]],                                                 // 2 plantas (Catastro), 17,7 m²
};
export const FACADE_LEN = 11.70; // m, Catastro
const S0 = { x: 474241.42 - 474235, z: -(4608723.88 - 4608727) }; // esquina sur de fachada
export const FRAME_ANGLE = Math.atan2(0.94307, -0.33260);          // giro del marco de fachada (≈109,4°)
export const FRAME_ORIGIN = S0;

// ---- Alturas (estimadas por foto + Google Earth; pendientes de medición fina) ----
export const H = {
  P1: 3.40,      // cara superior forjado PB
  P2: 6.30,      // cara superior forjado P1
  EAVE: 9.15,    // borde del alero
  OVER: 0.45,    // vuelo del alero sobre la calle
  RIDGE_D: 4.0,  // cumbrera a 4 m de la fachada (Google Earth, vista cenital)
  SLOPE: 0.3034, // ≈ 17° (teja árabe)
};
H.RIDGE = H.EAVE + H.SLOPE * (H.RIDGE_D + H.OVER); // ≈ 10,50 m
export function roofH(d) {
  return d <= H.RIDGE_D ? H.EAVE + H.SLOPE * (d + H.OVER) : H.RIDGE - H.SLOPE * (d - H.RIDGE_D);
}

// ---- Huecos de fachada (desde la esquina sur, en metros; estimados a partir de la foto 03) ----
export const WINDOWS = [
  { lv: 'P1', s0: 2.40, s1: 3.60, y0: 4.30, y1: 5.60, pers: 0.0 },
  { lv: 'P1', s0: 4.70, s1: 6.00, y0: 4.30, y1: 5.60, pers: 0.45 },
  { lv: 'P1', s0: 7.30, s1: 8.20, y0: 4.20, y1: 5.60, pers: 0.75 },
  { lv: 'P1', s0: 9.50, s1: 10.40, y0: 4.20, y1: 5.50, pers: 0.35 },
  { lv: 'P2', s0: 2.40, s1: 3.60, y0: 7.20, y1: 8.50, pers: 0.0 },
  { lv: 'P2', s0: 4.60, s1: 5.90, y0: 7.20, y1: 8.50, pers: 0.12, shutter: true },
  { lv: 'P2', s0: 7.00, s1: 8.40, y0: 7.00, y1: 8.55, pers: 0.55 },
  { lv: 'P2', s0: 8.50, s1: 10.10, y0: 7.00, y1: 8.55, pers: 0.55 },
];
export const PB = {
  door: { s0: 2.10, s1: 3.00, y0: 0.15, y1: 2.25 },
  garage: { s0: 4.40, s1: 8.40, y0: 0.0, y1: 2.85 },
  jambs: [[4.10, 4.40], [8.40, 8.70]],
  lattice: { s0: 8.75, s1: 10.45, y0: 1.00, y1: 2.95 },
  plinth: [[0, 2.10], [3.00, 4.10], [8.70, 11.70]], // zócalo de piedra, 0,90 m de alto
  plinthH: 0.90,
  meter: { s0: 3.15, s1: 3.65, y0: 0.30, y1: 0.80 },
};
// Zaguán + escalera (10 m² de la vivienda en PB), detrás de la puerta peatonal
export const ZAGUAN = [[0, 0], [3.2, 0], [3.2, 3.3], [-0.09, 3.3]];
export const B3_PB_REST = [[3.2, 0], [5.86, 0], [5.79, 3.2], [5.71, 6.82], [4.0, 6.77], [-0.18, 6.69], [-0.09, 3.3], [3.2, 3.3]];

// ---------------- utilidades de geometría ----------------
function area(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; a += x1 * y2 - x2 * y1; } return a / 2; }
function clip(poly, dCut, keepBelow) {
  const inside = p => keepBelow ? p[1] <= dCut + 1e-9 : p[1] >= dCut - 1e-9;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const t = (dCut - a[1]) / (b[1] - a[1]); out.push([a[0] + t * (b[0] - a[0]), dCut]); }
  }
  return out.length >= 3 ? out : null;
}

class Tri {
  constructor() { this.p = []; }
  t(a, b, c) { this.p.push(...a, ...b, ...c); }
  q(a, b, c, d) { this.t(a, b, c); this.t(a, c, d); }
  geo(THREE) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.computeVertexNormals();
    // UV planas simples (para texturas de teja/piedra): proyección según normal dominante
    const pos = g.attributes.position, nor = g.attributes.normal, uv = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
      if (ay >= ax && ay >= az) uv.push(x, z); else if (ax >= az) uv.push(z, y); else uv.push(x, y);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }
}
const V = (s, y, d) => [s, y, -d];

// Prisma con base en y0 y tapa plana (y1) o siguiendo la cubierta (y1 = 'roof').
function prism(THREE, poly, y0, y1, { top = true, bottom = true } = {}) {
  if (area(poly) < 0) poly = poly.slice().reverse();
  const roof = y1 === 'roof';
  const pieces = roof ? [clip(poly, H.RIDGE_D, true), clip(poly, H.RIDGE_D, false)].filter(Boolean) : [poly];
  const yt = d => roof ? roofH(d) : y1;
  const walls = new Tri(), cap = new Tri();
  for (const pc of pieces) {
    const contour = pc.map(([s, d]) => new THREE.Vector2(s, d));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [a, b, c] of tris) {
      const A = pc[a], B = pc[b], C = pc[c];
      if (top) cap.t(V(A[0], yt(A[1]), A[1]), V(B[0], yt(B[1]), B[1]), V(C[0], yt(C[1]), C[1]));
      if (bottom) walls.t(V(A[0], y0, A[1]), V(C[0], y0, C[1]), V(B[0], y0, B[1]));
    }
    for (let i = 0; i < pc.length; i++) {
      const a = pc[i], b = pc[(i + 1) % pc.length];
      if (roof && Math.abs(a[1] - H.RIDGE_D) < 1e-6 && Math.abs(b[1] - H.RIDGE_D) < 1e-6) continue; // junta interna
      walls.q(V(a[0], y0, a[1]), V(b[0], y0, b[1]), V(b[0], yt(b[1]), b[1]), V(a[0], yt(a[1]), a[1]));
    }
  }
  return { walls: walls.geo(THREE), cap: top ? cap.geo(THREE) : null };
}

// Caja alineada con la fachada: s0..s1, y0..y1, saliente desde dOut (negativo = hacia la calle) con grosor t
function fbox(THREE, s0, s1, y0, y1, t, dOut = 0) {
  const g = new THREE.BoxGeometry(s1 - s0, y1 - y0, t);
  g.translate((s0 + s1) / 2, (y0 + y1) / 2, -(dOut) + t / 2 * 1);
  // la cara exterior queda en z = -dOut + t → sobresale t hacia la calle
  return g;
}

// ---------------- construcción ----------------
// mats: diccionario de materiales (lo aporta quien llama: navegador con texturas, Node con colores planos)
export function buildHouse(THREE, mats) {
  const root = new THREE.Group(); root.name = 'Arnau_de_Vilanova_1';
  const house = new THREE.Group(); house.name = 'casa';
  house.rotation.y = FRAME_ANGLE; house.position.set(FRAME_ORIGIN.x, 0, FRAME_ORIGIN.z);
  root.add(house);
  const levels = {};
  for (const lv of ['PB', 'P1', 'P2', 'CUB']) { const g = new THREE.Group(); g.name = lv; levels[lv] = g; house.add(g); }

  const add = (lv, geo, mat, ud, name) => {
    const m = new THREE.Mesh(geo, mats[mat]); m.name = name || mat; m.userData = { mat, ...ud };
    levels[lv].add(m); return m;
  };
  const slab = (lv, poly, y0, y1, role, name, opts) => {
    const { walls, cap } = prism(THREE, poly, y0, y1, opts);
    add(lv, walls, 'wall', { role, slab: true }, name);
    return cap;
  };

  // --- Planta baja ---
  slab('PB', ZAGUAN, 0, H.P1, 'own', 'PB_zaguan_vivienda');
  slab('PB', B3_PB_REST, 0, H.P1, 'garage', 'PB_garaje_cuerpo3');
  slab('PB', BODIES.B4, 0, H.P1, 'garage', 'PB_garaje_cuerpo4');
  slab('PB', BODIES.B1, 0, H.P1, 'garage', 'PB_garaje_cuerpo1');
  const b2cap = slab('PB', BODIES.B2, 0, H.P1, 'garage', 'PB_garaje_cuerpo2');
  add('PB', b2cap, 'terraceFloor', { role: 'terrace' }, 'terraza_cuerpo2');
  // Antepecho de la terraza (cuerpo 2): lados exteriores
  const par = (a, b, hh = 0.95) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const g = new THREE.BoxGeometry(len, hh, 0.15);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len, uv.getY(i) * hh);
    g.translate(len / 2, H.P1 + hh / 2, 0.075);
    const m = new THREE.Mesh(g, mats.terraceWall || mats.wall); m.name = 'antepecho';
    m.position.set(a[0], 0, -a[1]); m.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]);
    m.userData = { mat: mats.terraceWall ? 'terraceWall' : 'wall', role: 'terrace' }; levels.PB.add(m);
  };
  // Fondo: antepecho bajo con vistas (foto 11). Lado sur: muro alto encalado contra el vecino (foto 12).
  par([3.91, 10.64], [-0.27, 10.55], 1.0); par([-0.27, 10.55], [-0.18, 6.69], 2.6);
  // Albardilla de barro sobre los muros
  const cop = (a, b, hh) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const g = new THREE.BoxGeometry(len + 0.1, 0.045, 0.24);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len, uv.getY(i) * 0.24);
    g.translate(len / 2, H.P1 + hh + 0.022, 0.075); const m = new THREE.Mesh(g, mats.coping || mats.trim); m.name = 'albardilla';
    m.position.set(a[0], 0, -a[1]); m.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]); m.userData = { mat: mats.coping ? 'coping' : 'trim', role: 'terrace' }; levels.PB.add(m);
  };
  cop([3.91, 10.64], [-0.27, 10.55], 1.0); cop([-0.27, 10.55], [-0.18, 6.69], 2.6);
  // Sumidero y rodapié de barro al pie de los muros de la terraza
  { const dg = new THREE.BoxGeometry(0.15, 0.01, 0.15); dg.translate(0.4, H.P1 + 0.005, -10.2); add('PB', dg, 'rail', { role: 'terrace' }, 'sumidero'); }
  // Pérgola metálica con malla de sombreo verde (fotos 11 y 12 del anuncio)
  const PY = H.P1, PH = 2.45, posts = [[0.05, 10.3], [3.65, 10.38], [0.05, 7.0], [3.65, 7.05]];
  for (const [s, d] of posts) {
    const pg = new THREE.BoxGeometry(0.06, PH, 0.06); pg.translate(s, PY + PH / 2, -d); add('PB', pg, 'rail', { role: 'terrace' }, 'poste_pergola');
    const fg = new THREE.BoxGeometry(0.16, 0.012, 0.16); fg.translate(s, PY + 0.006, -d); add('PB', fg, 'rail', { role: 'terrace' }, 'pletina');
  }
  const bar = (a, b, y) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const bg = new THREE.BoxGeometry(len, 0.05, 0.05); bg.translate(len / 2, 0, 0);
    const m = new THREE.Mesh(bg, mats.rail); m.position.set(a[0], y, -a[1]); m.rotation.y = Math.atan2(b[1] - a[1], b[0] - a[0]); m.userData = { mat: 'rail', role: 'terrace' }; m.name = 'viga_pergola'; levels.PB.add(m); };
  bar(posts[0], posts[1], PY + PH); bar(posts[2], posts[3], PY + PH); bar(posts[0], posts[2], PY + PH); bar(posts[1], posts[3], PY + PH);
  { // malla tensada con una ligera caída en el centro
    const net = new THREE.PlaneGeometry(3.6, 3.3, 12, 12); net.rotateX(-Math.PI / 2);
    const p = net.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 1.8, z = p.getZ(i) / 1.65; p.setY(i, -0.12 * (1 - x * x) * (1 - z * z)); }
    net.computeVertexNormals(); net.translate(1.85, PY + PH - 0.02, -8.69);
    add('PB', net, 'awning', { role: 'terrace' }, 'malla_sombreo');
  }

  // --- Planta 1 (vivienda, 95 m²) ---
  for (const k of ['B3', 'B4', 'B1']) slab('P1', BODIES[k], H.P1, H.P2, 'own', `P1_vivienda_${k}`);

  // --- Planta 2 + cubierta ---
  const capB3 = slab('P2', BODIES.B3, H.P2, 'roof', 'own', 'P2_declarada_cuerpo3');
  const capB4 = slab('P2', BODIES.B4, H.P2, 'roof', 'undeclared', 'P2_no_declarada_cuerpo4');
  const capB1 = slab('P2', BODIES.B1, H.P2, 'roof', 'undeclared', 'P2_bajocubierta_cuerpo1');
  for (const [c, n] of [[capB3, 'cuerpo3'], [capB4, 'cuerpo4'], [capB1, 'cuerpo1']]) {
    c.translate(0, 0.03, 0); add('CUB', c, 'roof', { role: 'roof' }, `cubierta_${n}`);
  }
  // Alero sobre la calle + canto
  const eave = new Tri();
  const e0 = -0.15, e1 = FACADE_LEN + 0.15, dA = -H.OVER, dB = 0;
  eave.q(V(e0, roofH(dA) + 0.03, dA), V(e1, roofH(dA) + 0.03, dA), V(e1, roofH(dB) + 0.03, dB), V(e0, roofH(dB) + 0.03, dB));
  add('CUB', eave.geo(THREE), 'roof', { role: 'roof' }, 'alero_teja');
  const soff = new Tri();
  soff.q(V(e0, roofH(dA) - 0.12, dA), V(e0, roofH(dB) - 0.12, dB), V(e1, roofH(dB) - 0.12, dB), V(e1, roofH(dA) - 0.12, dA));
  soff.q(V(e0, roofH(dA) - 0.12, dA), V(e1, roofH(dA) - 0.12, dA), V(e1, roofH(dA) + 0.03, dA), V(e0, roofH(dA) + 0.03, dA));
  add('CUB', soff.geo(THREE), 'trim', { role: 'detail' }, 'alero_canto');

  // --- Detalles de fachada ---
  const det = (lv, geo, mat, name) => add(lv, geo, mat, { role: 'detail' }, name);
  for (const [a, b] of PB.plinth) det('PB', fbox(THREE, a, b, 0, PB.plinthH, 0.05, 0), 'stone', 'zocalo_piedra');
  det('PB', fbox(THREE, PB.door.s0, PB.door.s1, PB.door.y0, PB.door.y1, 0.03, 0), 'door', 'puerta_peatonal');
  for (let i = 0; i < 4; i++) { // 4 franjas de vidrio translúcido
    const y = 1.0 + i * 0.3; det('PB', fbox(THREE, PB.door.s0 + 0.12, PB.door.s1 - 0.12, y, y + 0.2, 0.04, 0), 'frosted', 'puerta_vidrio');
  }
  det('PB', fbox(THREE, PB.door.s0 - 0.05, PB.door.s1 + 0.05, 0, 0.15, 0.25, 0), 'trim', 'escalon');
  det('PB', fbox(THREE, PB.garage.s0, PB.garage.s1, PB.garage.y0, PB.garage.y1, 0.02, 0), 'garage', 'persiana_garaje');
  det('PB', fbox(THREE, PB.garage.s0 + 0.1, PB.garage.s1 - 0.1, PB.garage.y1, PB.garage.y1 + 0.25, 0.06, 0), 'trim', 'caja_persiana');
  for (const [a, b] of PB.jambs) det('PB', fbox(THREE, a, b, 0, 3.0, 0.04, 0), 'jamb', 'jamba_rosa');
  det('PB', fbox(THREE, PB.lattice.s0, PB.lattice.s1, PB.lattice.y0, PB.lattice.y1, 0.01, 0), 'glassDark', 'celosia_fondo');
  { // retícula de la celosía cerámica
    const L = PB.lattice, nx = 7, ny = 8;
    for (let i = 0; i <= nx; i++) { const s = L.s0 + (L.s1 - L.s0) * i / nx; det('PB', fbox(THREE, s - 0.03, s + 0.03, L.y0, L.y1, 0.08, 0), 'lattice', 'celosia'); }
    for (let j = 0; j <= ny; j++) { const y = L.y0 + (L.y1 - L.y0) * j / ny; det('PB', fbox(THREE, L.s0, L.s1, y - 0.03, y + 0.03, 0.08, 0), 'lattice', 'celosia'); }
  }
  det('PB', fbox(THREE, PB.meter.s0, PB.meter.s1, PB.meter.y0, PB.meter.y1, 0.07, 0), 'trim', 'hornacina_contador');
  // placa del número, aplique sobre el garaje y bajante pluvial
  det('PB', fbox(THREE, 2.45, 2.65, 2.55, 2.8, 0.015, 0), 'trim', 'placa_numero_1');
  det('PB', fbox(THREE, 2.535, 2.565, 2.6, 2.75, 0.02, 0), 'door', 'numero_1');
  det('PB', fbox(THREE, 5.6, 5.75, 3.05, 3.2, 0.12, 0), 'metal', 'aplique');
  { const dp = new THREE.CylinderGeometry(0.045, 0.045, H.EAVE - 0.1, 12); dp.translate(11.55, (H.EAVE - 0.1) / 2, 0.12); add('PB', dp, 'downpipe', { role: 'detail' }, 'bajante'); }

  for (const w of WINDOWS) {
    const { lv, s0, s1, y0, y1 } = w, f = 0.12;
    det(lv, fbox(THREE, s0, s1, y0, y1, 0.005, 0.0), 'glass', 'vidrio');
    // mochetas oscuras: dan profundidad al hueco
    det(lv, fbox(THREE, s0, s0 + 0.04, y0, y1, 0.02, 0), 'glassDark', 'mocheta');
    det(lv, fbox(THREE, s1 - 0.04, s1, y0, y1, 0.02, 0), 'glassDark', 'mocheta');
    det(lv, fbox(THREE, s0, s1, y1 - 0.04, y1, 0.02, 0), 'glassDark', 'mocheta');
    // recercado en relieve
    det(lv, fbox(THREE, s0 - f, s1 + f, y1, y1 + f, 0.05, 0), 'frame', 'recercado');
    det(lv, fbox(THREE, s0 - f, s1 + f, y0 - f, y0, 0.07, 0), 'frame', 'vierteaguas');
    det(lv, fbox(THREE, s0 - f, s0, y0, y1, 0.05, 0), 'frame', 'recercado');
    det(lv, fbox(THREE, s1, s1 + f, y0, y1, 0.05, 0), 'frame', 'recercado');
    // carpintería blanca (cruz)
    const sm = (s0 + s1) / 2;
    det(lv, fbox(THREE, sm - 0.025, sm + 0.025, y0, y1, 0.03, 0), 'pvc', 'carpinteria');
    if (w.pers > 0) det(lv, fbox(THREE, s0, s1, y1 - (y1 - y0) * w.pers, y1, 0.02, 0), 'blind', 'persiana_enrollable');
    if (w.shutter) det(lv, fbox(THREE, s0 - 0.42, s0 - f, y0, y1, 0.04, 0), 'shutter', 'contraventana');
  }
  return { root, house, levels };
}

// ---------------- entorno: solo suelo y calles reales (OpenStreetMap) ----------------
// roads: [{name, kind, w, pts:[[x,z]...]}] en coordenadas locales del mundo
export function buildContext(THREE, mats, roads = []) {
  const g = new THREE.Group(); g.name = 'entorno';
  const ground = new THREE.PlaneGeometry(260, 260); ground.rotateX(-Math.PI / 2); ground.translate(0, -0.03, 0);
  const gm = new THREE.Mesh(ground, mats.ground); gm.name = 'terreno'; gm.userData = { mat: 'ground', role: 'context' }; g.add(gm);
  // cintas de calzada fusionadas en una sola malla por tipo (rápido)
  const byMat = { street: [], streetMain: [], path: [] };
  for (const r of roads) {
    const key = r.kind === 'primary' ? 'streetMain' : (r.kind === 'cycleway' || r.kind === 'steps') ? 'path' : 'street';
    const hw = r.w / 2, P = byMat[key], y = key === 'path' ? 0.005 : 0.0;
    for (let i = 0; i < r.pts.length - 1; i++) {
      const [x1, z1] = r.pts[i], [x2, z2] = r.pts[i + 1], L = Math.hypot(x2 - x1, z2 - z1); if (L < 0.01) continue;
      const nx = -(z2 - z1) / L * hw, nz = (x2 - x1) / L * hw;
      P.push(x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz, x1 - nx, y, z1 - nz, x2 - nx, y, z2 - nz, x2 + nx, y, z2 + nz);
    }
    for (const [x, z] of r.pts) { // juntas redondas en los vértices
      const n = 14; for (let k = 0; k < n; k++) { const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2; P.push(x, y, z, x + Math.cos(a1) * hw, y, z + Math.sin(a1) * hw, x + Math.cos(a0) * hw, y, z + Math.sin(a0) * hw); }
    }
  }
  for (const [k, arr] of Object.entries(byMat)) {
    if (!arr.length) continue;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const uv = []; for (let i = 0; i < arr.length; i += 3) uv.push(arr[i] / 4, arr[i + 2] / 4); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mats[k] || mats.street); m.name = 'calles_' + k; m.userData = { mat: k, role: 'context' }; m.receiveShadow = true; g.add(m);
  }
  // acera ajedrezada delante de la casa (en el marco de fachada)
  const f = new THREE.Group(); f.rotation.y = FRAME_ANGLE; f.position.set(FRAME_ORIGIN.x, 0, FRAME_ORIGIN.z);
  const sw = new THREE.BoxGeometry(FACADE_LEN + 1.0, 0.14, 1.25); sw.translate(FACADE_LEN / 2, 0.07, 0.625);
  const swm = new THREE.Mesh(sw, mats.sidewalk); swm.name = 'acera_ajedrezada'; swm.userData = { mat: 'sidewalk', role: 'context' }; swm.receiveShadow = true; f.add(swm);
  g.add(f);
  return g;
}
// Etiquetas: un punto por calle con nombre (el del tramo más largo)
export function roadLabels(roads) {
  const best = new Map();
  for (const r of roads) { if (!r.name) continue; for (let i = 0; i < r.pts.length - 1; i++) {
    const [x1, z1] = r.pts[i], [x2, z2] = r.pts[i + 1], L = Math.hypot(x2 - x1, z2 - z1);
    if (!best.has(r.name) || best.get(r.name).L < L) best.set(r.name, { L, x: (x1 + x2) / 2, z: (z1 + z2) / 2 }); } }
  return [...best].map(([name, v]) => ({ name, x: v.x, z: v.z }));
}
