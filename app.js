// Casa Pineda · editor de planos
// Unidades: metros. Marco de fachada: s = a lo largo de la fachada desde la esquina sur (izquierda),
// d = hacia dentro desde la fachada. En pantalla: x = s, y = -d (la calle queda abajo).
import { BODIES, WINDOWS, PB as PBF, FACADE_LEN, ZAGUAN, B3_PB_REST, H } from './3d/model.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('plan');
const $ = (id) => document.getElementById(id);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const pts2str = (pts) => pts.map(([s, d]) => `${s.toFixed(3)},${(-d).toFixed(3)}`).join(' ');
const fmt = (n, dec = 2) => n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const polyArea = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
const centroid = (p) => { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; };
const uid = () => Math.random().toString(36).slice(2, 10);
const FONT = '"IBM Plex Sans", system-ui, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';

// ---------------- definición de cada planta ----------------
const FLOORS = {
  PB: {
    name: 'Planta baja',
    note: 'El garaje (102 m²) no forma parte de la vivienda. Tuyo en esta planta: la entrada con la escalera que sube a la planta 1.',
    zones: [
      { poly: ZAGUAN, role: 'stairs', label: 'Escalera de entrada', sub: 'sube a planta 1' },
      { poly: B3_PB_REST, role: 'garage', label: 'Garaje', sub: 'no es tuyo' },
      { poly: BODIES.B4, role: 'garage' }, { poly: BODIES.B1, role: 'garage' }, { poly: BODIES.B2, role: 'garage' },
    ],
    legend: [['stairs', 'Entrada y escalera (tuyo)', '10 m² Catastro'], ['garage', 'Garaje (no es tuyo)', '102 m² Catastro']],
  },
  P1: {
    name: 'Planta 1',
    note: 'Planta principal de la vivienda. La cubierta del cuerpo 2 es la terraza. La escalera llega por la zona de la entrada (esquina sur de la fachada).',
    zones: [
      { poly: BODIES.B3, role: 'own', label: 'Cuerpo 3' }, { poly: BODIES.B4, role: 'own', label: 'Cuerpo 4' },
      { poly: BODIES.B1, role: 'own', label: 'Cuerpo 1' }, { poly: BODIES.B2, role: 'terrace', label: 'Terraza', sub: 'cubierta del cuerpo 2' },
      { poly: ZAGUAN, role: 'stairsHint', label: 'Llegada escalera', sub: 'posición aproximada' },
    ],
    legend: [['own', 'Vivienda', '95 m² Catastro'], ['terrace', 'Terraza', '16 m²']],
  },
  P2: {
    name: 'Planta 2',
    note: 'Bajo cubierta inclinada. Altura libre estimada: ~2,7 m en fachada, ~3,9 m en la cumbrera, ~1,9 m al fondo del cuerpo 1. Solo el cuerpo 3 está declarado en Catastro.',
    zones: [
      { poly: BODIES.B3, role: 'own', label: 'Cuerpo 3', sub: 'declarado' },
      { poly: BODIES.B4, role: 'undecl', label: 'Cuerpo 4', sub: 'no declarado' },
      { poly: BODIES.B1, role: 'undecl', label: 'Cuerpo 1', sub: 'no declarado' },
      { poly: BODIES.B2, role: 'below', label: 'Terraza', sub: 'planta inferior' },
    ],
    ridge: true,
    legend: [['own', 'Declarada', '40 m² Catastro'], ['undecl', 'Existe, no declarada', null]],
  },
};
const ROLE = {
  own: { fill: '--own', op: .07, stroke: '--own' },
  garage: { fill: '--garage', op: .12, stroke: '--garage', dash: '.12 .08' },
  terrace: { fill: '--terrace', op: .12, stroke: '--terrace' },
  undecl: { fill: '--undecl', op: .08, stroke: '--undecl', dash: '.15 .08' },
  stairs: { fill: '--stairs', op: .10, stroke: '--stairs', hatch: true },
  stairsHint: { fill: '--stairs', op: .0, stroke: '--stairs', dash: '.1 .08' },
  below: { fill: '--terrace', op: .04, stroke: '--line-2', dash: '.06 .08' },
};

// ---------------- estado ----------------
const KEY = 'casa-pineda-planos-v1';
let data = { PB: [], P1: [], P2: [] };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.PB) data = s; } catch {}
let floor = 'P1';
try { floor = localStorage.getItem(KEY + ':floor') || 'P1'; } catch {}
const hist = { PB: { u: [], r: [] }, P1: { u: [], r: [] }, P2: { u: [], r: [] } };
let tool = 'wall', sel = null, draft = null, view = null, spaceDown = false;

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); $('saveState').textContent = 'Guardado en este navegador · ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
  catch { $('saveState').textContent = 'No se pudo guardar en este navegador. Descarga el JSON.'; }
}
function commit(mutator) {
  hist[floor].u.push(JSON.stringify(data[floor])); hist[floor].r = [];
  if (hist[floor].u.length > 200) hist[floor].u.shift();
  mutator(data[floor]); save(); render();
}
function undo() { const h = hist[floor]; if (!h.u.length) return; h.r.push(JSON.stringify(data[floor])); data[floor] = JSON.parse(h.u.pop()); sel = null; save(); render(); }
function redo() { const h = hist[floor]; if (!h.r.length) return; h.u.push(JSON.stringify(data[floor])); data[floor] = JSON.parse(h.r.pop()); sel = null; save(); render(); }

// ---------------- capas SVG ----------------
const defs = el('defs', {}, svg);
const gBase = el('g', {}, svg), gRef = el('g', {}, svg), gDraw = el('g', {}, svg), gOver = el('g', {}, svg);

function hatch() {
  defs.innerHTML = '';
  const p = el('pattern', { id: 'hatch', width: .25, height: .25, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('line', { x1: 0, y1: 0, x2: 0, y2: .25, stroke: css('--stairs'), 'stroke-width': .025, opacity: .55 }, p);
}

function renderBase() {
  gBase.innerHTML = ''; hatch();
  const F = FLOORS[floor];
  // rejilla
  const g = el('g', {}, gBase);
  for (let x = -6; x <= 18; x += .5) el('line', { x1: x, y1: -16, x2: x, y2: 8, stroke: css(x % 1 === 0 ? '--grid-2' : '--grid'), 'stroke-width': .012 }, g);
  for (let y = -16; y <= 8; y += .5) el('line', { x1: -6, y1: y, x2: 18, y2: y, stroke: css(y % 1 === 0 ? '--grid-2' : '--grid'), 'stroke-width': .012 }, g);
  // calle
  el('rect', { x: -6, y: 0, width: 24, height: 1.25, fill: css('--grid-2'), opacity: .6 }, gBase);
  text(gBase, 'acera', -5.7, -.62, .2, '--muted', MONO, 'start');
  text(gBase, 'C/ ARNAU DE VILANOVA', FACADE_LEN / 2, -3.2, .32, '--muted', FONT, 'middle', 600, '.08');
  text(gBase, 'Taller (vecino)', -1.0, 3.5, .22, '--muted', FONT, 'end');
  text(gBase, 'N.º 3 (vecino)', 12.7, 3.5, .22, '--muted', FONT, 'start');
  // zonas
  for (const z of F.zones) {
    const r = ROLE[z.role];
    el('polygon', { points: pts2str(z.poly), fill: r.hatch ? 'url(#hatch)' : css(r.fill), 'fill-opacity': r.hatch ? 1 : r.op, stroke: css(r.stroke), 'stroke-width': .035, 'stroke-dasharray': r.dash || 'none', 'stroke-linejoin': 'round' }, gBase);
    if (z.label) {
      const [cs, cd] = centroid(z.poly);
      const a = polyArea(z.poly);
      text(gBase, z.label, cs, cd + .15, .28, r.stroke === '--line-2' ? '--muted' : r.stroke, FONT, 'middle', 600);
      text(gBase, (z.sub ? z.sub + ' · ' : '') + fmt(a, 1) + ' m²', cs, cd - .22, .19, '--muted', MONO, 'middle');
    }
  }
  // contorno de la parcela (Catastro)
  const parcel = [[0, 0], [FACADE_LEN, 0], [10.84, 3.31], [10.0, 6.54], [8.85, 10.74], [3.91, 10.64], [-0.27, 10.55], [-0.18, 6.69]];
  el('polygon', { points: pts2str(parcel), fill: 'none', stroke: css('--ink'), 'stroke-width': .06, 'stroke-linejoin': 'round' }, gBase);
  if (F.ridge) {
    el('line', { x1: -.3, y1: -H.RIDGE_D, x2: 11.6, y2: -H.RIDGE_D, stroke: css('--undecl'), 'stroke-width': .025, 'stroke-dasharray': '.3 .12' }, gBase);
    text(gBase, 'cumbrera · techo más alto', 11.0, H.RIDGE_D + .15, .18, '--undecl', MONO, 'end');
  }
  // huecos de fachada en esta planta
  const holes = floor === 'PB'
    ? [['puerta', PBF.door], ['garaje', PBF.garage], ['celosía', PBF.lattice]]
    : WINDOWS.filter(w => w.lv === floor).map(w => ['ventana', w]);
  for (const [k, h] of holes) {
    el('rect', { x: h.s0, y: -.08, width: h.s1 - h.s0, height: .16, fill: css('--paper'), stroke: css('--accent'), 'stroke-width': .03 }, gBase);
    text(gBase, `${fmt(h.s1 - h.s0)}`, (h.s0 + h.s1) / 2, -.42, .17, '--accent', MONO, 'middle');
  }
  // cotas
  dimLine(gBase, [0, -1.75], [FACADE_LEN, -1.75], 'fachada 11,70 m · Catastro');
  dimLine(gBase, [-1.6, 0], [-1.6, 10.6], 'fondo ≈ 10,6 m', true);
  // norte (rumbo real: la fachada mira al ENE)
  const nx = 15.2, ny = -9.6, ang = Math.atan2(0.3326, 0.9431) * 180 / Math.PI; // dirección norte en pantalla
  const gN = el('g', { transform: `translate(${nx} ${ny}) rotate(${ang + 90})` }, gBase);
  el('polygon', { points: '0,-.7 .28,.35 0,.18 -.28,.35', fill: css('--ink') }, gN);
  text(gN, 'N', 0, .95, .32, '--ink', FONT, 'middle', 600);
}
function text(parent, t, s, d, size, colorVar, family, anchor = 'middle', weight = 500, ls = '0') {
  const e = el('text', { x: s, y: -d, 'font-size': size, 'font-family': family, 'font-weight': weight, 'text-anchor': anchor, fill: css(colorVar), 'letter-spacing': ls, 'dominant-baseline': 'middle' }, parent);
  e.textContent = t; return e;
}
function dimLine(parent, a, b, label, vertical) {
  const c = css('--muted');
  el('line', { x1: a[0], y1: -a[1], x2: b[0], y2: -b[1], stroke: c, 'stroke-width': .02 }, parent);
  for (const p of [a, b]) el('line', { x1: p[0] - .12, y1: -p[1] - .12, x2: p[0] + .12, y2: -p[1] + .12, stroke: c, 'stroke-width': .03 }, parent);
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const t = text(parent, label, mx + (vertical ? -.25 : 0), my - (vertical ? 0 : .25), .19, '--muted', MONO, 'middle');
  if (vertical) t.setAttribute('transform', `rotate(-90 ${mx - .25} ${-my})`);
}

// ---------------- elementos dibujados ----------------
function len(p) { return Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]); }
function renderItems() {
  gDraw.innerHTML = '';
  const ink = css('--ink'), acc = css('--accent'), paper = css('--paper');
  const items = data[floor];
  // estancias primero (debajo), luego muros, luego huecos, luego trazos y texto
  const order = { room: 0, wall: 1, door: 2, window: 2, pen: 3, text: 4, photo: 5 };
  for (const it of [...items].sort((a, b) => order[a.type] - order[b.type])) {
    const g = el('g', { 'data-id': it.id, style: 'cursor:pointer' }, gDraw);
    const isSel = sel === it.id;
    if (it.type === 'room') {
      el('polygon', { points: pts2str(it.pts), fill: acc, 'fill-opacity': isSel ? .14 : .06, stroke: acc, 'stroke-width': isSel ? .04 : .02, 'stroke-dasharray': '.08 .06' }, g);
      const [cs, cd] = centroid(it.pts);
      text(g, it.name || 'Estancia', cs, cd + .14, .26, '--ink', FONT, 'middle', 600);
      text(g, fmt(polyArea(it.pts)) + ' m²', cs, cd - .2, .2, '--muted', MONO, 'middle');
    } else if (it.type === 'wall') {
      const [a, b] = it.pts;
      el('line', { x1: a[0], y1: -a[1], x2: b[0], y2: -b[1], stroke: isSel ? acc : ink, 'stroke-width': it.w || .1, 'stroke-linecap': 'square' }, g);
      if (isSel || $('dimsAll')?.checked) wallDim(g, a, b);
    } else if (it.type === 'door' || it.type === 'window') {
      const [a, b] = it.pts, L = len(it.pts); if (L < .05) continue;
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      el('line', { x1: a[0], y1: -a[1], x2: b[0], y2: -b[1], stroke: paper, 'stroke-width': .3 }, g);
      const c = isSel ? acc : ink;
      if (it.type === 'door') {
        const side = it.flip ? -1 : 1, nx = -uy * side, ny = ux * side;
        const tip = [a[0] + nx * L, a[1] + ny * L];
        el('line', { x1: a[0], y1: -a[1], x2: tip[0], y2: -tip[1], stroke: c, 'stroke-width': .03 }, g);
        const sweep = side > 0 ? 1 : 0;
        el('path', { d: `M ${b[0]} ${-b[1]} A ${L} ${L} 0 0 ${sweep} ${tip[0]} ${-tip[1]}`, fill: 'none', stroke: c, 'stroke-width': .015, 'stroke-dasharray': '.05 .04' }, g);
      } else {
        const nx = -uy * .06, ny = ux * .06;
        for (const k of [-1, 1]) el('line', { x1: a[0] + nx * k, y1: -(a[1] + ny * k), x2: b[0] + nx * k, y2: -(b[1] + ny * k), stroke: c, 'stroke-width': .02 }, g);
        for (const p of [a, b]) el('line', { x1: p[0] - nx, y1: -(p[1] - ny), x2: p[0] + nx, y2: -(p[1] + ny), stroke: c, 'stroke-width': .03 }, g);
      }
      text(g, fmt(L), (a[0] + b[0]) / 2 - uy * .3, (a[1] + b[1]) / 2 + ux * .3, .16, isSel ? '--accent' : '--muted', MONO, 'middle');
    } else if (it.type === 'pen') {
      el('polyline', { points: pts2str(it.pts), fill: 'none', stroke: isSel ? acc : ink, 'stroke-width': .03, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    } else if (it.type === 'text') {
      text(g, it.name || 'Texto', it.pts[0][0], it.pts[0][1], .3, isSel ? '--accent' : '--ink', FONT, 'middle', 500);
    } else if (it.type === 'photo') {
      const [s, d] = it.pts[0], a = (it.dir ?? 90) * Math.PI / 180, R = 1.1, half = .5;
      const p1 = [s + Math.cos(a - half) * R, d + Math.sin(a - half) * R], p2 = [s + Math.cos(a + half) * R, d + Math.sin(a + half) * R];
      el('path', { d: `M ${s} ${-d} L ${p1[0]} ${-p1[1]} A ${R} ${R} 0 0 0 ${p2[0]} ${-p2[1]} Z`, fill: acc, 'fill-opacity': isSel ? .28 : .14, stroke: 'none' }, g);
      el('circle', { cx: s, cy: -d, r: .24, fill: isSel ? acc : ink, stroke: paper, 'stroke-width': .04 }, g);
      const t = text(g, photoLabel(it.name), s, d, .19, '--paper', MONO, 'middle', 600);
    }
    // zona de toque más ancha para seleccionar líneas
    if (['wall', 'door', 'window', 'pen'].includes(it.type)) {
      el(it.type === 'pen' ? 'polyline' : 'line', it.type === 'pen'
        ? { points: pts2str(it.pts), fill: 'none', stroke: 'transparent', 'stroke-width': .35 }
        : { x1: it.pts[0][0], y1: -it.pts[0][1], x2: it.pts[1][0], y2: -it.pts[1][1], stroke: 'transparent', 'stroke-width': .35 }, g);
    }
  }
}
function wallDim(g, a, b) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .05) return;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  text(g, fmt(L) + ' m', (a[0] + b[0]) / 2 - uy * .32, (a[1] + b[1]) / 2 + ux * .32, .2, '--accent', MONO, 'middle', 500);
}

// ---------------- vista (zoom / desplazamiento) ----------------
function fit() {
  const r = svg.getBoundingClientRect(), bw = 23, bh = 18; // x -5.5..17.5, y -12.5..5.5
  const k = Math.max(bw / r.width, bh / r.height);
  const w = r.width * k, h = r.height * k;
  view = { x: 6 - w / 2, y: -3.5 - h / 2, w, h }; applyView();
}
function applyView() { svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`); }
function zoomAt(f, cx, cy) {
  const nw = Math.min(60, Math.max(1.5, view.w * f)), k = nw / view.w;
  view = { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w: nw, h: view.h * k }; applyView();
}
function toPlan(ev) {
  const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, -q.y];
}

// ---------------- imán ----------------
function snapPoints() {
  const out = [];
  for (const z of FLOORS[floor].zones) out.push(...z.poly);
  for (const it of data[floor]) if (!['pen', 'text', 'photo'].includes(it.type)) out.push(...it.pts);
  return out;
}
function snapPt(p, from, free) {
  const r = view.w / 90; // radio de imán ~ proporcional al zoom
  let best = null, bd = r;
  for (const q of snapPoints()) { const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; best = q; } }
  if (best) return [best[0], best[1], true];
  let [s, d] = p;
  if (from && $('ortho').checked && !free) {
    const dx = s - from[0], dy = d - from[1], a = Math.atan2(dy, dx), L = Math.hypot(dx, dy);
    const step = Math.PI / 4, ra = Math.round(a / step) * step;
    if (Math.abs(a - ra) < .14) { s = from[0] + Math.cos(ra) * L; d = from[1] + Math.sin(ra) * L; }
  }
  if ($('snap').checked) { s = Math.round(s / .05) * .05; d = Math.round(d / .05) * .05; }
  return [s, d, false];
}

// ---------------- interacción ----------------
let pan = null, moving = null;
function hud(t) { const h = $('hud'); if (!t) { h.hidden = true; return; } h.hidden = false; h.textContent = t; }

svg.addEventListener('pointerdown', (ev) => {
  svg.focus();
  if (ev.button === 1 || ev.button === 2 || spaceDown || (tool === 'select' && !ev.target.closest('[data-id]'))) {
    pan = { x: ev.clientX, y: ev.clientY, v: { ...view } }; svg.setPointerCapture(ev.pointerId); sel = tool === 'select' && ev.button === 0 && !spaceDown ? null : sel; render(); return;
  }
  if (ev.button !== 0) return;
  const raw = toPlan(ev);
  if (armed) { placePhoto(armed, raw); return; }
  if (tool === 'select' || ev.target.closest('[data-id]')?.querySelector('circle')) {
    const id = ev.target.closest('[data-id]').getAttribute('data-id'); sel = id; render();
    const it = data[floor].find(i => i.id === id);
    moving = { id, start: raw, orig: JSON.stringify(it.pts), before: JSON.stringify(data[floor]) }; svg.setPointerCapture(ev.pointerId); return;
  }
  if (tool === 'room') {
    const p = snapPt(raw, draft?.pts.at(-1), ev.shiftKey);
    if (!draft) draft = { type: 'room', pts: [[p[0], p[1]]] };
    else {
      const f = draft.pts[0];
      if (draft.pts.length >= 3 && Math.hypot(p[0] - f[0], p[1] - f[1]) < view.w / 90) return closeRoom();
      draft.pts.push([p[0], p[1]]);
    }
    drawDraft(raw, ev.shiftKey); return;
  }
  if (tool === 'text') { commit(a => a.push({ id: uid(), type: 'text', pts: [raw.map(v => +v.toFixed(3))], name: 'Texto' })); sel = data[floor].at(-1).id; tool = 'select'; syncTools(); render(); setTimeout(() => $('itemName').select(), 0); return; }
  const p = tool === 'pen' ? raw : snapPt(raw, null, ev.shiftKey);
  draft = { type: tool, pts: [[p[0], p[1]], [p[0], p[1]]] };
  svg.setPointerCapture(ev.pointerId); drawDraft(raw, ev.shiftKey);
});
svg.addEventListener('pointermove', (ev) => {
  if (pan) {
    const r = svg.getBoundingClientRect(), k = pan.v.w / r.width;
    view = { ...pan.v, x: pan.v.x - (ev.clientX - pan.x) * k, y: pan.v.y - (ev.clientY - pan.y) * k }; applyView(); return;
  }
  const raw = toPlan(ev);
  if (moving) {
    const it = data[floor].find(i => i.id === moving.id); const o = JSON.parse(moving.orig);
    let dx = raw[0] - moving.start[0], dy = raw[1] - moving.start[1];
    if ($('snap').checked) { dx = Math.round(dx / .05) * .05; dy = Math.round(dy / .05) * .05; }
    it.pts = o.map(([s, d]) => [s + dx, d + dy]); renderItems(); hud(`Δ ${fmt(dx)} · ${fmt(dy)} m`); return;
  }
  if (!draft) { const p = snapPt(raw, null, true); hud(tool === 'select' ? null : `${fmt(p[0])} · ${fmt(p[1])} m`); return; }
  if (draft.type === 'pen') { const l = draft.pts.at(-1); if (Math.hypot(raw[0] - l[0], raw[1] - l[1]) > .04) draft.pts.push(raw); }
  else if (draft.type !== 'room') { const p = snapPt(raw, draft.pts[0], ev.shiftKey); draft.pts[1] = [p[0], p[1]]; }
  drawDraft(raw, ev.shiftKey);
});
svg.addEventListener('pointerup', () => {
  if (pan) { pan = null; return; }
  if (moving) {
    const it = data[floor].find(i => i.id === moving.id);
    if (JSON.stringify(it.pts) !== moving.orig) { hist[floor].u.push(moving.before); hist[floor].r = []; save(); }
    moving = null; hud(null); render(); return;
  }
  if (!draft || draft.type === 'room') return;
  const d = draft; draft = null; gOver.innerHTML = '';
  if (d.type === 'pen' ? d.pts.length < 2 : len(d.pts) < .05) return;
  d.pts = d.pts.map(([s, dd]) => [+s.toFixed(3), +dd.toFixed(3)]);
  commit(a => a.push({ id: uid(), ...d, ...(d.type === 'wall' ? { w: +$('wallW').value } : {}) }));
  hud(null);
});
svg.addEventListener('dblclick', () => { if (draft?.type === 'room') closeRoom(); else if (sel) $('itemName').focus(); });
svg.addEventListener('contextmenu', e => e.preventDefault());
svg.addEventListener('wheel', (ev) => {
  ev.preventDefault(); const p = toPlan(ev); zoomAt(ev.deltaY > 0 ? 1.12 : 1 / 1.12, p[0], -p[1]);
}, { passive: false });

function closeRoom() {
  const d = draft; draft = null; gOver.innerHTML = ''; hud(null);
  if (!d || d.pts.length < 3) return;
  const n = data[floor].filter(i => i.type === 'room').length + 1;
  commit(a => a.push({ id: uid(), type: 'room', pts: d.pts.map(([s, dd]) => [+s.toFixed(3), +dd.toFixed(3)]), name: `Estancia ${n}` }));
  sel = data[floor].at(-1).id; render(); setTimeout(() => $('itemName').select(), 0);
}
function drawDraft(raw, shift) {
  gOver.innerHTML = ''; const acc = css('--accent');
  if (draft.type === 'room') {
    const p = snapPt(raw, draft.pts.at(-1), shift), pts = [...draft.pts, [p[0], p[1]]];
    el('polygon', { points: pts2str(pts), fill: acc, 'fill-opacity': .08, stroke: acc, 'stroke-width': .03, 'stroke-dasharray': '.08 .06' }, gOver);
    for (const q of draft.pts) el('circle', { cx: q[0], cy: -q[1], r: .07, fill: acc }, gOver);
    const L = Math.hypot(p[0] - draft.pts.at(-1)[0], p[1] - draft.pts.at(-1)[1]);
    hud(`lado ${fmt(L)} m · área ${fmt(polyArea(pts))} m² · doble clic o Intro para cerrar`); return;
  }
  if (draft.type === 'pen') { el('polyline', { points: pts2str(draft.pts), fill: 'none', stroke: acc, 'stroke-width': .03 }, gOver); return; }
  const [a, b] = draft.pts;
  el('line', { x1: a[0], y1: -a[1], x2: b[0], y2: -b[1], stroke: acc, 'stroke-width': draft.type === 'wall' ? +$('wallW').value : .06, 'stroke-opacity': .8 }, gOver);
  wallDim(gOver, a, b);
  hud(`${{ wall: 'muro', door: 'puerta', window: 'ventana' }[draft.type]} ${fmt(len(draft.pts))} m`);
}

// ---------------- teclado ----------------
const KEYS = { v: 'select', w: 'wall', r: 'room', d: 'door', n: 'window', p: 'pen', t: 'text' };
window.addEventListener('keydown', (ev) => {
  if (ev.target.matches('input, select, textarea')) { if (ev.key === 'Enter') ev.target.blur(); return; }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return; }
  if (ev.key === ' ') { spaceDown = true; svg.style.cursor = 'grab'; ev.preventDefault(); return; }
  if (ev.key === 'Escape') { draft = null; gOver.innerHTML = ''; hud(null); sel = null; render(); return; }
  if (ev.key === 'Enter' && draft?.type === 'room') { closeRoom(); return; }
  if ((ev.key === 'Delete' || ev.key === 'Backspace') && sel) { delSel(); return; }
  if (ev.key.toLowerCase() === 'f' && sel) { const it = data[floor].find(i => i.id === sel); if (it?.type === 'door') commit(() => { it.flip = !it.flip; }); return; }
  const t = KEYS[ev.key.toLowerCase()]; if (t && !ev.ctrlKey && !ev.metaKey) { tool = t; draft = null; gOver.innerHTML = ''; syncTools(); }
});
window.addEventListener('keyup', (ev) => { if (ev.key === ' ') { spaceDown = false; svg.style.cursor = ''; } });
function delSel() { const id = sel; sel = null; commit(a => { const i = a.findIndex(x => x.id === id); if (i >= 0) a.splice(i, 1); }); }

// ---------------- panel lateral ----------------
function syncTools() {
  document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === tool));
  svg.style.cursor = tool === 'select' ? 'default' : 'crosshair';
}
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { tool = b.dataset.tool; draft = null; gOver.innerHTML = ''; syncTools(); });
$('undo').onclick = undo; $('redo').onclick = redo; $('del').onclick = () => sel && delSel();
$('zin').onclick = () => zoomAt(1 / 1.25, view.x + view.w / 2, view.y + view.h / 2);
$('zout').onclick = () => zoomAt(1.25, view.x + view.w / 2, view.y + view.h / 2);
$('zfit').onclick = fit;
$('itemName').addEventListener('change', () => { const it = data[floor].find(i => i.id === sel); if (it) commit(() => { it.name = $('itemName').value.trim(); }); });

function renderSide() {
  const F = FLOORS[floor];
  $('floorName').textContent = F.name; $('floorNote').textContent = F.note;
  const lg = $('legend'); lg.innerHTML = '';
  for (const [role, label, val] of F.legend) {
    const li = document.createElement('li'); const r = ROLE[role];
    li.innerHTML = `<span class="sw" style="background:${css(r.stroke)}"></span><span>${label}</span><span class="v">${val ?? ''}</span>`; lg.appendChild(li);
  }
  const rooms = data[floor].filter(i => i.type === 'room');
  if (rooms.length) {
    const li = document.createElement('li'); const tot = rooms.reduce((s, r) => s + polyArea(r.pts), 0);
    li.innerHTML = `<span class="sw" style="background:${css('--accent')};opacity:.4"></span><span>Tus estancias (${rooms.length})</span><span class="v">${fmt(tot, 1)} m²</span>`; lg.appendChild(li);
  }
  const it = data[floor].find(i => i.id === sel);
  $('inspector').hidden = !it;
  if (it) {
    $('nameField').hidden = !['room', 'text'].includes(it.type);
    $('itemName').value = it.name || '';
    const isPh = it.type === 'photo', src = isPh && photos.get(it.name);
    $('dirField').hidden = !isPh; if (isPh) $('itemDir').value = it.dir ?? 90;
    $('itemPhoto').hidden = !src; if (src) $('itemPhoto').src = src;
    const info = [];
    const kind = { wall: 'Muro', room: 'Estancia', door: 'Puerta', window: 'Ventana', pen: 'Trazo', text: 'Texto', photo: 'Foto' }[it.type];
    info.push(['Tipo', kind]);
    if (isPh) { info.push(['Archivo', it.name]); if (!src) info.push(['Vista previa', 'carga las fotos']); }
    if (it.type === 'room') { info.push(['Área', fmt(polyArea(it.pts)) + ' m²']); let per = 0; for (let i = 0; i < it.pts.length; i++) { const a = it.pts[i], b = it.pts[(i + 1) % it.pts.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); } info.push(['Perímetro', fmt(per) + ' m']); }
    if (['wall', 'door', 'window'].includes(it.type)) info.push(['Longitud', fmt(len(it.pts)) + ' m']);
    if (it.type === 'wall') info.push(['Grosor', Math.round((it.w || .1) * 100) + ' cm']);
    if (it.type === 'door') info.push(['Invertir giro', 'tecla F']);
    $('itemInfo').innerHTML = info.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }
  document.querySelectorAll('[data-floor]').forEach(b => b.setAttribute('aria-selected', b.dataset.floor === floor));
}
document.querySelectorAll('[data-floor]').forEach(b => b.onclick = () => {
  floor = b.dataset.floor; sel = null; draft = null; gOver.innerHTML = '';
  try { localStorage.setItem(KEY + ':floor', floor); } catch {}
  render();
});

function render() { renderBase(); renderItems(); renderSide(); renderThumbs(); }

// ---------------- fotos del anuncio ----------------
// Las imágenes se quedan en el navegador (no se suben a ningún sitio); en el plano se guarda solo el nombre del archivo y su posición.
const photos = new Map(); // nombre -> objectURL
let armed = null;
function photoLabel(name) { const m = /(\d+)/.exec(name || ''); return m ? String(+m[1]) : '•'; }
function placedFloor(name) { for (const k of ['PB', 'P1', 'P2']) if (data[k].some(i => i.type === 'photo' && i.name === name)) return k; return null; }
function placePhoto(name, at) {
  for (const k of ['PB', 'P1', 'P2']) if (k !== floor) { const i = data[k].findIndex(x => x.type === 'photo' && x.name === name); if (i >= 0) { hist[k].u.push(JSON.stringify(data[k])); data[k].splice(i, 1); } }
  commit(a => { const i = a.findIndex(x => x.type === 'photo' && x.name === name); if (i >= 0) a.splice(i, 1); a.push({ id: uid(), type: 'photo', name, pts: [[+at[0].toFixed(2), +at[1].toFixed(2)]], dir: 90 }); });
  sel = data[floor].at(-1).id; armed = null; render();
}
function renderThumbs() {
  const box = $('thumbs'); box.innerHTML = '';
  for (const [name, url] of [...photos].sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }))) {
    const b = document.createElement('button'); b.className = 'thumb'; b.draggable = true; b.title = name;
    const pf = placedFloor(name); if (pf) { b.classList.add('placed'); b.dataset.floor = pf; }
    if (armed === name) b.classList.add('armed');
    b.innerHTML = `<img src="${url}" alt=""><span class="n">${photoLabel(name)}</span>`;
    b.ondragstart = (e) => { e.dataTransfer.setData('text/plain', name); e.dataTransfer.effectAllowed = 'copy'; };
    b.onclick = () => { armed = armed === name ? null : name; hud(armed ? 'Toca en el plano dónde se hizo la foto ' + photoLabel(name) : null); renderThumbs();
      const it = data[floor].find(i => i.type === 'photo' && i.name === name); if (it && !armed) { sel = it.id; render(); } };
    box.appendChild(b);
  }
}
$('photoFiles').onchange = (e) => {
  for (const f of e.target.files) { if (photos.has(f.name)) URL.revokeObjectURL(photos.get(f.name)); photos.set(f.name, URL.createObjectURL(f)); }
  render();
};
svg.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
svg.addEventListener('drop', (e) => { e.preventDefault(); const name = e.dataTransfer.getData('text/plain'); if (photos.has(name)) placePhoto(name, toPlan(e)); });
$('itemDir').addEventListener('input', () => { const it = data[floor].find(i => i.id === sel); if (it) { it.dir = +$('itemDir').value; renderItems(); } });
$('itemDir').addEventListener('change', () => save());

// ---------------- calco (foto del boceto) ----------------
let ref = null;
function renderRef() {
  gRef.innerHTML = ''; $('refCtl').hidden = !ref; if (!ref) return;
  const w = 12, h = w * ref.ar, sc = +$('refScale').value, rot = +$('refRot').value, x = 5.85 + +$('refX').value, y = -5 - +$('refY').value;
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${sc})`, opacity: $('refOp').value }, gRef);
  el('image', { href: ref.src, x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'none' }, g);
}
$('refFile').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
  rd.onload = () => { const im = new Image(); im.onload = () => { ref = { src: rd.result, ar: im.height / im.width }; renderRef(); }; im.src = rd.result; };
  rd.readAsDataURL(f);
};
for (const id of ['refOp', 'refScale', 'refRot', 'refX', 'refY']) $(id).oninput = renderRef;
$('refClear').onclick = () => { ref = null; $('refFile').value = ''; renderRef(); };

// ---------------- exportar / importar ----------------
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function exportJSON() { return JSON.stringify({ casa: 'Arnau de Vilanova 1, Pineda de Mar', refCatastral: '4389819DG7048N', unidades: 'metros; s = a lo largo de la fachada desde la esquina sur, d = hacia dentro', fecha: new Date().toISOString(), plantas: data }, null, 1); }
$('expJson').onclick = () => download('casa-pineda-planos.json', new Blob([exportJSON()], { type: 'application/json' }));
$('copyJson').onclick = async () => {
  try { await navigator.clipboard.writeText(exportJSON()); $('saveState').textContent = 'Copiado. Pégalo en el chat con Claude.'; }
  catch { $('saveState').textContent = 'No se pudo copiar. Usa «Descargar JSON».'; }
};
$('impJson').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return; f.text().then(t => {
    try { const j = JSON.parse(t); const p = j.plantas || j; if (!p.PB || !p.P1 || !p.P2) throw 0; for (const k of ['PB', 'P1', 'P2']) hist[k].u.push(JSON.stringify(data[k])); data = p; save(); render(); $('saveState').textContent = 'Plano importado.'; }
    catch { $('saveState').textContent = 'Ese archivo no es un plano de esta casa.'; }
  });
};
$('expPng').onclick = () => {
  const clone = svg.cloneNode(true);
  clone.setAttribute('viewBox', '-6 -13 24 19'); clone.setAttribute('width', 2400); clone.setAttribute('height', 1900);
  clone.querySelectorAll('[style]').forEach(n => n.removeAttribute('style'));
  const bg = document.createElementNS(NS, 'rect'); Object.entries({ x: -6, y: -13, width: 24, height: 19, fill: css('--paper') }).forEach(([k, v]) => bg.setAttribute(k, v)); clone.insertBefore(bg, clone.firstChild);
  const t = document.createElementNS(NS, 'text'); Object.entries({ x: -5.6, y: -12.4, 'font-size': .45, 'font-family': FONT, 'font-weight': 600, fill: css('--ink') }).forEach(([k, v]) => t.setAttribute(k, v));
  t.textContent = `Arnau de Vilanova 1 · ${FLOORS[floor].name}`; clone.appendChild(t);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const im = new Image(); im.onload = () => {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1900; c.getContext('2d').drawImage(im, 0, 0);
    c.toBlob(b => download(`casa-pineda-${floor}.png`, b)); URL.revokeObjectURL(url);
  }; im.src = url;
};
$('clearFloor').onclick = () => {
  const b = $('clearFloor');
  if (b.dataset.armed) { delete b.dataset.armed; b.textContent = 'Vaciar esta planta'; sel = null; commit(a => a.splice(0)); return; }
  b.dataset.armed = '1'; b.textContent = 'Pulsa otra vez para vaciar (se puede deshacer)';
  setTimeout(() => { delete b.dataset.armed; b.textContent = 'Vaciar esta planta'; }, 4000);
};

// ---------------- inicio ----------------
new ResizeObserver(() => { if (!view) fit(); else { const r = svg.getBoundingClientRect(); view.h = view.w * r.height / r.width; applyView(); } }).observe(svg);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
syncTools(); fit(); render();
