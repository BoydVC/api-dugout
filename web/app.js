/* API Solomon Dugout: offline 11U baseball diamond / lineup / scorebook / practice crib.
   Generic teaching board only — no invented roster, schedule, scores, or coaches. */
(function () {
"use strict";

const FW = 100, FH = 110; // logical field units (home bottom)
const LS = {
  play: "api-dugout-v1-current",
  plays: "api-dugout-v1-plays",
  lineup: "api-dugout-v1-lineup",
  score: "api-dugout-v1-score",
  practice: "api-dugout-v1-practice",
};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- standard defense positions (home bottom, CF top) ---------- */
const POS = [
  { id: "P",  label: "P",  x: 50, y: 68 },
  { id: "C",  label: "C",  x: 50, y: 98 },
  { id: "1B", label: "1B", x: 74, y: 70 },
  { id: "2B", label: "2B", x: 62, y: 48 },
  { id: "3B", label: "3B", x: 26, y: 70 },
  { id: "SS", label: "SS", x: 38, y: 48 },
  { id: "LF", label: "LF", x: 18, y: 26 },
  { id: "CF", label: "CF", x: 50, y: 14 },
  { id: "RF", label: "RF", x: 82, y: 26 },
];
const BASES = { H: [50, 96], "1B": [72, 72], "2B": [50, 48], "3B": [28, 72] };

function standardFrame() {
  return {
    pieces: POS.map((p) => ({ id: p.id, label: p.label, x: p.x, y: p.y })),
    ball: { x: 50, y: 68 },
    arrows: [],
  };
}
function cloneFrame(f) {
  return {
    pieces: f.pieces.map((p) => ({ ...p })),
    ball: { ...f.ball },
    arrows: f.arrows.map((a) => ({ ...a })),
  };
}
function newPlay() {
  return { name: "", notes: "", preset: null, frames: [standardFrame()], cur: 0 };
}

/* ---------- generic defensive presets (teaching examples only) ---------- */
const F = (id, x, y) => ({ id, label: id, x, y });
const ar = (type, x1, y1, x2, y2) => ({ type, x1, y1, x2, y2 });

const PRESETS = [
  {
    id: "steal2",
    name: "Steal coverage — 2nd",
    desc: "Pitcher holds, catcher throws through. SS covers 2B; 2B backs the throw. CF shades in.",
    pieces: [F("P",50,68),F("C",50,98),F("1B",74,70),F("2B",58,52),F("3B",26,70),F("SS",44,50),F("LF",18,26),F("CF",50,22),F("RF",82,26)],
    frames: [
      { b:[50,68], a:[ar("run",44,50,50,48), ar("run",58,52,56,44)] },
      { m:{SS:[50,48], "2B":[56,44], CF:[50,28]}, a:[ar("throw",50,96,50,50)] },
      { b:[50,50], a:[ar("throw",50,50,50,48)] },
      { b:[50,48], a:[] },
    ],
  },
  {
    id: "bunt",
    name: "Bunt defense",
    desc: "Corners crash. Pitcher covers middle. Catcher fields fair bunts. Middle infielders hold bags.",
    pieces: [F("P",50,68),F("C",50,98),F("1B",68,78),F("2B",62,48),F("3B",32,78),F("SS",38,48),F("LF",18,26),F("CF",50,14),F("RF",82,26)],
    frames: [
      { b:[50,88], a:[ar("run",68,78,58,86), ar("run",32,78,42,86), ar("run",50,68,50,80)] },
      { m:{"1B":[58,86],"3B":[42,86],P:[50,80]}, a:[ar("throw",50,96,50,82)] },
      { b:[50,82], a:[ar("throw",50,82,62,48)] },
      { m:{"2B":[62,48]}, b:[62,48], a:[] },
    ],
  },
  {
    id: "cut2",
    name: "Cutoff to 2nd",
    desc: "LF fields a single. Throw hits the cutoff (SS). Ball cut and redirected to 2B if the runner digs.",
    pieces: [F("P",50,62),F("C",50,98),F("1B",74,70),F("2B",58,48),F("3B",26,70),F("SS",42,42),F("LF",22,30),F("CF",50,14),F("RF",82,26)],
    frames: [
      { b:[22,30], a:[ar("run",42,42,40,46), ar("run",58,48,50,48), ar("cutoff",22,30,40,46)] },
      { m:{SS:[40,46],"2B":[50,48]}, a:[ar("throw",22,30,40,46)] },
      { b:[40,46], a:[ar("throw",40,46,50,48)] },
      { b:[50,48], a:[] },
    ],
  },
  {
    id: "first3rd",
    name: "First-and-third look",
    desc: "R1 breaks. Catcher fakes to 2nd then checks home. SS cuts; pitcher covers home if needed.",
    pieces: [F("P",50,68),F("C",50,98),F("1B",74,70),F("2B",60,50),F("3B",28,68),F("SS",46,50),F("LF",18,26),F("CF",50,18),F("RF",82,26)],
    frames: [
      { b:[50,98], a:[ar("run",46,50,50,48), ar("run",60,50,56,44), ar("run",50,68,50,88)] },
      { m:{SS:[50,48],"2B":[56,44],P:[50,88]}, a:[ar("throw",50,96,50,70)] },
      { b:[50,70], a:[ar("cutoff",50,70,50,48), ar("throw",50,70,50,88)] },
      { b:[50,88], a:[] },
    ],
  },
  {
    id: "relay",
    name: "Relay — LF to home",
    desc: "Deep LF. Shortstop becomes the relay. Throw home through the relay; pitcher backs up catcher.",
    pieces: [F("P",58,90),F("C",50,98),F("1B",74,70),F("2B",62,48),F("3B",26,70),F("SS",40,40),F("LF",12,18),F("CF",42,12),F("RF",82,26)],
    frames: [
      { b:[12,18], a:[ar("run",40,40,36,46), ar("run",50,68,58,90), ar("cutoff",12,18,36,46)] },
      { m:{SS:[36,46],P:[58,90]}, a:[ar("throw",12,18,36,46)] },
      { b:[36,46], a:[ar("throw",36,46,50,96)] },
      { b:[50,96], a:[] },
    ],
  },
  {
    id: "rundown",
    name: "Rundown 1st–2nd",
    desc: "Runner caught between. 1B and 2B/SS exchange. Run the runner back toward the previous base; keep throws short.",
    pieces: [F("P",50,62),F("C",50,98),F("1B",70,68),F("2B",56,50),F("3B",26,70),F("SS",44,52),F("LF",18,26),F("CF",50,14),F("RF",82,26)],
    frames: [
      { b:[70,68], a:[ar("run",56,50,58,56), ar("throw",70,68,58,56)] },
      { m:{"2B":[58,56]}, b:[58,56], a:[ar("run",70,68,66,62), ar("throw",58,56,66,62)] },
      { m:{"1B":[66,62]}, b:[66,62], a:[ar("throw",66,62,58,56)] },
      { b:[58,56], a:[] },
    ],
  },
  {
    id: "dpfeed",
    name: "Double-play feed",
    desc: "Grounder to SS. Feed to 2B covering the bag, then turn and throw to 1B. Pitcher clears the lane.",
    pieces: [F("P",46,64),F("C",50,98),F("1B",74,70),F("2B",56,50),F("3B",26,70),F("SS",36,52),F("LF",18,26),F("CF",50,14),F("RF",82,26)],
    frames: [
      { b:[36,52], a:[ar("run",56,50,50,48), ar("run",46,64,42,58)] },
      { m:{"2B":[50,48],P:[42,58]}, a:[ar("throw",36,52,50,48)] },
      { b:[50,48], a:[ar("throw",50,48,74,70)] },
      { b:[74,70], a:[] },
    ],
  },
  {
    id: "passball",
    name: "Passed ball — cover home",
    desc: "Ball gets away. Catcher chases. Pitcher covers home. Corner infielders hold runners.",
    pieces: [F("P",50,68),F("C",50,98),F("1B",74,70),F("2B",62,48),F("3B",26,70),F("SS",38,48),F("LF",18,26),F("CF",50,14),F("RF",82,26)],
    frames: [
      { b:[56,104], a:[ar("run",50,98,56,104), ar("run",50,68,50,94)] },
      { m:{C:[56,104],P:[50,94]}, a:[ar("throw",56,104,50,94)] },
      { b:[50,94], a:[] },
    ],
  },
];

function presetPlay(p) {
  let pieces = p.pieces.map((q) => ({ ...q }));
  let ball = { x: 50, y: 68 };
  const frames = [];
  p.frames.forEach((f) => {
    pieces = pieces.map((q) => ({ ...q }));
    if (f.m) {
      for (const id in f.m) {
        const q = pieces.find((z) => z.id === id);
        if (q && f.m[id]) { q.x = f.m[id][0]; q.y = f.m[id][1]; }
      }
    }
    if (f.b) ball = { x: f.b[0], y: f.b[1] };
    frames.push({ pieces, ball: { ...ball }, arrows: (f.a || []).map((a) => ({ ...a })) });
  });
  return { name: p.name, notes: p.desc + " (Generic example.)", preset: p.id, frames, cur: 0 };
}

/* ---------- state ---------- */
let S = newPlay();
let showLabels = true, showGhost = true, showBases = true, tool = "move", speed = 1;
const undo = [];
let anim = null;
let view = { s: 8, w: 100, h: 60 };
let drag = null, drawing = null, erasing = null, dirty = true;
const cv = $("#diamond"), ctx = cv.getContext("2d");

/* ---------- toast / helpers ---------- */
let toastT;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2200);
}
function pushUndo() {
  undo.push(JSON.stringify(S.frames[S.cur]));
  if (undo.length > 40) undo.shift();
}
function doUndo() {
  if (!undo.length) return;
  S.frames[S.cur] = JSON.parse(undo.pop());
  dirty = true; persist(); renderUI();
}

/* ---------- coordinate mapping ---------- */
function layout() {
  const wrap = $("#diamondwrap");
  const cssW = wrap.clientWidth || 640;
  const cssH = Math.round(cssW * 0.78);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.style.height = cssH + "px";
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = 18;
  const sx = (cssW - pad * 2) / FW;
  const sy = (cssH - pad * 2) / FH;
  const s = Math.min(sx, sy);
  view = { s, ox: (cssW - FW * s) / 2, oy: (cssH - FH * s) / 2, w: cssW, h: cssH };
}
function toScreen(x, y) { return [view.ox + x * view.s, view.oy + y * view.s]; }
function toField(px, py) {
  return [(px - view.ox) / view.s, (py - view.oy) / view.s];
}
function ptr(e) {
  const r = cv.getBoundingClientRect();
  const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
  return [t.clientX - r.left, t.clientY - r.top];
}

/* ---------- draw diamond ---------- */
function drawField() {
  const w = view.w, h = view.h;
  // grass
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#3a7a32"); g.addColorStop(0.55, "#4a8c3a"); g.addColorStop(1, "#2d6a28");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  // subtle mow stripes
  ctx.save();
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    ctx.fillRect(0, (h / 14) * i, w, h / 14);
  }
  ctx.restore();

  const [hx, hy] = toScreen(50, 96);
  const [b1x, b1y] = toScreen(72, 72);
  const [b2x, b2y] = toScreen(50, 48);
  const [b3x, b3y] = toScreen(28, 72);
  const [mx, my] = toScreen(50, 68);

  // dirt infield oval / diamond path
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(b1x, b1y); ctx.lineTo(b2x, b2y); ctx.lineTo(b3x, b3y); ctx.closePath();
  ctx.fillStyle = "#c4a574";
  ctx.fill();
  ctx.strokeStyle = "rgba(107,68,35,0.45)";
  ctx.lineWidth = 2; ctx.stroke();

  // mound
  ctx.beginPath();
  ctx.arc(mx, my, 10 * view.s / 8, 0, Math.PI * 2);
  ctx.fillStyle = "#b8956a"; ctx.fill();
  ctx.strokeStyle = "#8b6914"; ctx.lineWidth = 1.5; ctx.stroke();

  // foul lines
  ctx.strokeStyle = "rgba(245,240,230,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy); ctx.lineTo(...toScreen(8, 8));
  ctx.moveTo(hx, hy); ctx.lineTo(...toScreen(92, 8));
  ctx.stroke();

  // outfield arc hint
  ctx.beginPath();
  ctx.arc(...toScreen(50, 96), 78 * view.s, -Math.PI * 0.78, -Math.PI * 0.22);
  ctx.strokeStyle = "rgba(245,240,230,0.25)";
  ctx.lineWidth = 1.5; ctx.stroke();

  // bases
  if (showBases) {
    [[b1x,b1y],[b2x,b2y],[b3x,b3y]].forEach(([x,y]) => {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#f5f0e6";
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = "rgba(10,22,40,0.35)"; ctx.lineWidth = 1; ctx.strokeRect(-7,-7,14,14);
      ctx.restore();
    });
    // home plate
    ctx.beginPath();
    ctx.moveTo(hx, hy - 6); ctx.lineTo(hx + 7, hy); ctx.lineTo(hx + 5, hy + 8);
    ctx.lineTo(hx - 5, hy + 8); ctx.lineTo(hx - 7, hy); ctx.closePath();
    ctx.fillStyle = "#f5f0e6"; ctx.fill();
    ctx.strokeStyle = "rgba(10,22,40,0.4)"; ctx.stroke();
  }

  // chalk batter's boxes hint
  ctx.strokeStyle = "rgba(245,240,230,0.4)";
  ctx.lineWidth = 1;
  const [bx1, by1] = toScreen(44, 100);
  const [bx2, by2] = toScreen(56, 100);
  ctx.strokeRect(bx1 - 6, by1 - 10, 12, 18);
  ctx.strokeRect(bx2 - 6, by2 - 10, 12, 18);
}

function drawArrow(a, alpha) {
  const [x1, y1] = toScreen(a.x1, a.y1);
  const [x2, y2] = toScreen(a.x2, a.y2);
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  let color = "#0a1628", dash = [], lw = 3;
  if (a.type === "run") { color = "#c8102e"; dash = [8, 6]; lw = 2.5; }
  else if (a.type === "cutoff") { color = "#8b6914"; dash = []; lw = 4; }
  else { color = "#0a1628"; }
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  // arrowhead
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 10;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ah * Math.cos(ang - 0.4), y2 - ah * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - ah * Math.cos(ang + 0.4), y2 - ah * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  // cutoff double-bar
  if (a.type === "cutoff") {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - nx * 6, my - ny * 6); ctx.lineTo(mx + nx * 6, my + ny * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPiece(p, ghost) {
  const [x, y] = toScreen(p.x, p.y);
  const r = Math.max(14, 16 * view.s / 8);
  ctx.save();
  if (ghost) ctx.globalAlpha = 0.28;
  // jersey disc — navy with red rim
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#0a1628"; ctx.fill();
  ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#f5f0e6";
  ctx.font = `bold ${Math.max(10, r * 0.72)}px system-ui,sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(showLabels ? p.label : p.id, x, y + 0.5);
  ctx.restore();
}

function drawBall(b) {
  const [x, y] = toScreen(b.x, b.y);
  const r = Math.max(5, 6 * view.s / 8);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f5f0e6"; ctx.fill();
  ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 1.5; ctx.stroke();
  // seams
  ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x - 1, y, r * 0.7, -0.8, 0.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 1, y, r * 0.7, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke();
}

function paint() {
  if (!view.w) layout();
  drawField();
  const fr = S.frames[S.cur];
  if (showGhost && S.cur > 0) {
    const prev = S.frames[S.cur - 1];
    prev.pieces.forEach((p) => drawPiece(p, true));
  }
  fr.arrows.forEach((a) => drawArrow(a));
  if (drawing) drawArrow(drawing, 0.7);
  fr.pieces.forEach((p) => drawPiece(p));
  drawBall(fr.ball);
  dirty = false;
}

function loop() {
  if (dirty || anim) paint();
  requestAnimationFrame(loop);
}

/* ---------- interaction ---------- */
function hitPiece(fx, fy) {
  const fr = S.frames[S.cur];
  let best = null, bd = 3.5;
  fr.pieces.forEach((p) => {
    const d = Math.hypot(p.x - fx, p.y - fy);
    if (d < bd) { bd = d; best = p; }
  });
  // ball
  const dB = Math.hypot(fr.ball.x - fx, fr.ball.y - fy);
  if (dB < bd) return { kind: "ball" };
  return best ? { kind: "piece", p: best } : null;
}
function hitArrow(fx, fy) {
  const fr = S.frames[S.cur];
  for (let i = fr.arrows.length - 1; i >= 0; i--) {
    const a = fr.arrows[i];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = a.x1 + (a.x2 - a.x1) * t;
      const y = a.y1 + (a.y2 - a.y1) * t;
      if (Math.hypot(x - fx, y - fy) < 2.2) return i;
    }
  }
  return -1;
}
function snapStart(fx, fy) {
  const h = hitPiece(fx, fy);
  if (h && h.kind === "piece") return [h.p.x, h.p.y];
  if (h && h.kind === "ball") {
    const fr = S.frames[S.cur];
    return [fr.ball.x, fr.ball.y];
  }
  return [fx, fy];
}

function onDown(e) {
  if (anim) stopAnim();
  e.preventDefault();
  const [px, py] = ptr(e);
  const [fx, fy] = toField(px, py);
  if (tool === "move") {
    const h = hitPiece(fx, fy);
    if (h) {
      pushUndo();
      drag = h.kind === "ball" ? { kind: "ball" } : { kind: "piece", id: h.p.id };
      cv.classList.add("drag");
    }
  } else if (tool === "erase") {
    pushUndo();
    const i = hitArrow(fx, fy);
    if (i >= 0) { S.frames[S.cur].arrows.splice(i, 1); dirty = true; persist(); }
    erasing = true;
  } else {
    pushUndo();
    const [sx, sy] = snapStart(fx, fy);
    drawing = { type: tool === "throw" ? "throw" : tool === "cutoff" ? "cutoff" : "run", x1: sx, y1: sy, x2: fx, y2: fy };
    cv.classList.add("draw");
  }
}
function onMove(e) {
  const [px, py] = ptr(e);
  const [fx, fy] = toField(px, py);
  if (drag) {
    e.preventDefault();
    const fr = S.frames[S.cur];
    if (drag.kind === "ball") { fr.ball.x = fx; fr.ball.y = fy; }
    else {
      const p = fr.pieces.find((z) => z.id === drag.id);
      if (p) { p.x = fx; p.y = fy; }
    }
    dirty = true;
  } else if (drawing) {
    e.preventDefault();
    drawing.x2 = fx; drawing.y2 = fy; dirty = true;
  } else if (erasing) {
    e.preventDefault();
    const i = hitArrow(fx, fy);
    if (i >= 0) { S.frames[S.cur].arrows.splice(i, 1); dirty = true; }
  }
}
function onUp(e) {
  if (drawing) {
    const a = drawing; drawing = null;
    if (Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 2) S.frames[S.cur].arrows.push(a);
    cv.classList.remove("draw"); dirty = true; persist();
  }
  if (drag) { drag = null; cv.classList.remove("drag"); persist(); }
  if (erasing) { erasing = null; persist(); }
}

/* ---------- frames / playback ---------- */
function renderChips() {
  const box = $("#frameChips");
  box.innerHTML = "";
  S.frames.forEach((_, i) => {
    const b = document.createElement("button");
    b.textContent = String(i + 1);
    if (i === S.cur) b.classList.add("on");
    if (anim && i === S.cur) b.classList.add("playing");
    b.onclick = () => { stopAnim(); S.cur = i; dirty = true; renderUI(); persist(); };
    box.appendChild(b);
  });
  $("#frameHint").textContent = `Frame ${S.cur + 1} of ${S.frames.length}. Arrange fielders, then tap ＋ Frame and move them again to build a play.`;
  $("#playTitle").textContent = S.name || "";
  $("#notes").value = S.notes || "";
  $("#playName").value = S.name || "";
}
function addFrame() {
  stopAnim();
  S.frames.splice(S.cur + 1, 0, cloneFrame(S.frames[S.cur]));
  S.cur++; dirty = true; renderUI(); persist(); toast("Frame added");
}
function delFrame() {
  if (S.frames.length <= 1) { toast("Need at least one frame"); return; }
  stopAnim();
  S.frames.splice(S.cur, 1);
  if (S.cur >= S.frames.length) S.cur = S.frames.length - 1;
  dirty = true; renderUI(); persist();
}
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function stopAnim() {
  if (anim) { cancelAnimationFrame(anim.raf); anim = null; $("#btnPlay").textContent = "▶"; renderChips(); }
}
function playAnim() {
  if (anim) { stopAnim(); return; }
  if (S.frames.length < 2) { toast("Add another frame first"); return; }
  $("#btnPlay").textContent = "⏸";
  let from = S.cur;
  if (from >= S.frames.length - 1) from = 0;
  S.cur = from; dirty = true; renderChips();
  const dur = 900 / speed;
  let i = from;
  const step = () => {
    const A = S.frames[i], B = S.frames[i + 1];
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      // interpolate into a temp visual by mutating display via paint override
      paintInterp(A, B, e);
      if (t < 1) anim.raf = requestAnimationFrame(tick);
      else {
        S.cur = i + 1; dirty = true; renderChips();
        if (S.cur < S.frames.length - 1) { i = S.cur; step(); }
        else { stopAnim(); persist(); }
      }
    };
    anim = { raf: requestAnimationFrame(tick) };
  };
  step();
}
function paintInterp(A, B, e) {
  layout();
  drawField();
  // arrows of target fade in
  B.arrows.forEach((a) => drawArrow(a, 0.3 + 0.7 * e));
  A.pieces.forEach((pa) => {
    const pb = B.pieces.find((z) => z.id === pa.id) || pa;
    drawPiece({ ...pa, x: pa.x + (pb.x - pa.x) * e, y: pa.y + (pb.y - pa.y) * e });
  });
  drawBall({
    x: A.ball.x + (B.ball.x - A.ball.x) * e,
    y: A.ball.y + (B.ball.y - A.ball.y) * e,
  });
}

/* ---------- presets / save ---------- */
function renderPresets() {
  const box = $("#presetList");
  box.innerHTML = "";
  PRESETS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "preset" + (S.preset === p.id ? " on" : "");
    b.innerHTML = `<b>${p.name}<em>example</em></b><small>${p.desc}</small>`;
    b.onclick = () => loadPreset(p.id);
    box.appendChild(b);
  });
}
function loadPreset(id) {
  const p = PRESETS.find((z) => z.id === id);
  if (!p) return;
  stopAnim(); undo.length = 0;
  S = presetPlay(p);
  dirty = true; renderUI(); persist(); toast("Loaded: " + p.name);
}
function persist() {
  try { localStorage.setItem(LS.play, JSON.stringify(S)); } catch (_) {}
}
function loadSavedPlays() {
  try { return JSON.parse(localStorage.getItem(LS.plays) || "[]"); } catch (_) { return []; }
}
function renderSaved() {
  const box = $("#savedList");
  const list = loadSavedPlays();
  if (!list.length) { box.innerHTML = '<div class="empty">No saved plays yet.</div>'; return; }
  box.innerHTML = "";
  list.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "item";
    const load = document.createElement("button");
    load.className = "load"; load.textContent = item.name || "Untitled";
    load.onclick = () => { stopAnim(); S = item.data; dirty = true; renderUI(); persist(); toast("Loaded play"); };
    const x = document.createElement("button");
    x.className = "x"; x.textContent = "✕";
    x.onclick = () => {
      const L = loadSavedPlays(); L.splice(idx, 1);
      localStorage.setItem(LS.plays, JSON.stringify(L)); renderSaved();
    };
    row.append(load, x); box.appendChild(row);
  });
}
function savePlay() {
  const name = ($("#playName").value || "").trim() || "Untitled play";
  S.name = name; S.notes = $("#notes").value || "";
  const list = loadSavedPlays();
  list.unshift({ name, data: JSON.parse(JSON.stringify(S)), ts: Date.now() });
  localStorage.setItem(LS.plays, JSON.stringify(list.slice(0, 30)));
  persist(); renderSaved(); toast("Saved: " + name);
}

/* ---------- PNG export ---------- */
function exportPng() {
  stopAnim(); paint();
  const band = 36;
  const out = document.createElement("canvas");
  out.width = cv.width; out.height = cv.height + band * (window.devicePixelRatio || 1);
  const o = out.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  o.fillStyle = "#0a1628";
  o.fillRect(0, 0, out.width, band * dpr);
  o.fillStyle = "#f5f0e6";
  o.font = `bold ${14 * dpr}px system-ui,sans-serif`;
  o.textBaseline = "middle";
  const title = (S.name || "API Solomon Dugout") + " · frame " + (S.cur + 1);
  o.fillText(title, 12 * dpr, (band * dpr) / 2);
  o.fillStyle = "#c8102e";
  o.font = `bold ${11 * dpr}px system-ui,sans-serif`;
  o.fillText("API · 11U SOLOMON", out.width - 140 * dpr, (band * dpr) / 2);
  o.drawImage(cv, 0, band * dpr);
  const a = document.createElement("a");
  a.download = "api-dugout-frame.png";
  a.href = out.toDataURL("image/png");
  a.click();
  toast("PNG saved");
}
function pngDataURL() {
  stopAnim(); paint();
  return cv.toDataURL("image/png");
}

/* ---------- LINEUP ---------- */
const POS_OPTS = ["","P","C","1B","2B","3B","SS","LF","CF","RF","EH","DH"];
function defaultLineup() {
  return {
    game: "",
    rows: Array.from({ length: 9 }, (_, i) => ({ ord: i + 1, name: "Player " + (i + 1), pos: "", bat: "" }))
      .concat([{ ord: "EH", name: "Player EH", pos: "EH", bat: "" }]),
  };
}
function loadLineup() {
  try {
    const raw = localStorage.getItem(LS.lineup);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return defaultLineup();
}
function saveLineup(data) {
  try { localStorage.setItem(LS.lineup, JSON.stringify(data)); } catch (_) {}
}
function renderLineup() {
  const data = loadLineup();
  $("#lineupGame").value = data.game || "";
  const grid = $("#lineupGrid");
  grid.innerHTML = "";
  data.rows.forEach((row, idx) => {
    const el = document.createElement("div");
    el.className = "lu-row";
    const ord = document.createElement("div");
    ord.className = "ord" + (row.ord === "EH" ? " eh" : "");
    ord.textContent = row.ord;
    const name = document.createElement("input");
    name.type = "text"; name.maxLength = 28; name.value = row.name;
    name.placeholder = "Name";
    name.oninput = () => { data.rows[idx].name = name.value; data.game = $("#lineupGame").value; saveLineup(data); };
    const pos = document.createElement("select");
    POS_OPTS.forEach((p) => {
      const o = document.createElement("option"); o.value = p; o.textContent = p || "Pos";
      if (p === row.pos) o.selected = true; pos.appendChild(o);
    });
    pos.onchange = () => { data.rows[idx].pos = pos.value; saveLineup(data); };
    const pill = document.createElement("div");
    pill.className = "pos-pill"; pill.textContent = row.ord === "EH" ? "Extra" : "Bat " + row.ord;
    el.append(ord, name, pos, pill);
    grid.appendChild(el);
  });
}
$("#lineupGame").addEventListener("input", () => {
  const data = loadLineup(); data.game = $("#lineupGame").value; saveLineup(data);
});
$("#btnClearLineup").onclick = () => {
  saveLineup(defaultLineup()); renderLineup(); toast("Lineup cleared to placeholders");
};

/* ---------- SCOREBOOK ---------- */
const MARKS = ["", "·", "X", "R"];
function defaultScore() {
  return {
    us: "", them: "", notes: "",
    // 2 teams × 9 innings × 9 batters — empty
    cells: Array.from({ length: 2 }, () =>
      Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0))),
  };
}
function loadScore() {
  try {
    const raw = localStorage.getItem(LS.score);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return defaultScore();
}
function saveScore(d) {
  try { localStorage.setItem(LS.score, JSON.stringify(d)); } catch (_) {}
}
function renderScorebook() {
  const d = loadScore();
  $("#sbUs").value = d.us || "";
  $("#sbThem").value = d.them || "";
  $("#sbNotes").value = d.notes || "";
  const table = $("#scorebook");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  thead.innerHTML = "<tr><th></th>" + Array.from({ length: 9 }, (_, i) => `<th>${i + 1}</th>`).join("") + "<th>R</th></tr>";
  tbody.innerHTML = "";
  ["Us", "Them"].forEach((label, ti) => {
    // 9 batter rows + totals row feel: show one row of inning cells (simplified: 1 row per team for runs-style, plus batter detail)
    // Batter rows
    for (let b = 0; b < 9; b++) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = (ti === 0 ? "U" : "T") + (b + 1);
      tr.appendChild(th);
      let runCount = 0;
      for (let inn = 0; inn < 9; inn++) {
        const td = document.createElement("td");
        const mi = d.cells[ti][inn][b] || 0;
        const mark = MARKS[mi] || "";
        td.textContent = mark;
        if (mark === "·") td.className = "mark-dot";
        if (mark === "X") td.className = "mark-x";
        if (mark === "R") { td.className = "mark-r"; runCount++; }
        td.onclick = () => {
          d.cells[ti][inn][b] = ((d.cells[ti][inn][b] || 0) + 1) % MARKS.length;
          saveScore(d); renderScorebook();
        };
        tr.appendChild(td);
      }
      const tot = document.createElement("td");
      tot.className = "tot"; tot.textContent = String(runCount);
      tr.appendChild(tot);
      tbody.appendChild(tr);
    }
  });
}
["sbUs", "sbThem", "sbNotes"].forEach((id) => {
  $("#" + id).addEventListener("input", () => {
    const d = loadScore();
    d.us = $("#sbUs").value; d.them = $("#sbThem").value; d.notes = $("#sbNotes").value;
    saveScore(d);
  });
});
$("#btnClearScore").onclick = () => {
  saveScore(defaultScore()); renderScorebook(); toast("Scorebook reset");
};

/* ---------- PRACTICE CRIB ---------- */
function defaultPractice() {
  return [
    { title: "", focus: "", notes: "" },
    { title: "", focus: "", notes: "" },
    { title: "", focus: "", notes: "" },
  ];
}
function loadPractice() {
  try {
    const raw = localStorage.getItem(LS.practice);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return defaultPractice();
}
function savePractice(list) {
  try { localStorage.setItem(LS.practice, JSON.stringify(list)); } catch (_) {}
}
function renderPractice() {
  const list = loadPractice();
  const box = $("#practiceList");
  box.innerHTML = "";
  list.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = "pcard";
    el.innerHTML = `
      <div class="prow" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label>Card title</label><input data-f="title" type="text" maxlength="40" placeholder="e.g. Fielding focus (you fill in)" value=""></div>
        <div><label>Focus</label><input data-f="focus" type="text" maxlength="40" placeholder="Blank — your note" value=""></div>
      </div>
      <label>Notes</label><textarea data-f="notes" rows="3" placeholder="Empty template — write whatever helps for practice"></textarea>
      <button class="pdel act" type="button">Remove card</button>`;
    const title = el.querySelector('[data-f="title"]');
    const focus = el.querySelector('[data-f="focus"]');
    const notes = el.querySelector('[data-f="notes"]');
    title.value = card.title || "";
    focus.value = card.focus || "";
    notes.value = card.notes || "";
    const sync = () => {
      list[idx] = { title: title.value, focus: focus.value, notes: notes.value };
      savePractice(list);
    };
    title.oninput = focus.oninput = notes.oninput = sync;
    el.querySelector(".pdel").onclick = () => {
      list.splice(idx, 1);
      if (!list.length) list.push({ title: "", focus: "", notes: "" });
      savePractice(list); renderPractice();
    };
    box.appendChild(el);
  });
}
$("#btnAddPractice").onclick = () => {
  const list = loadPractice();
  list.push({ title: "", focus: "", notes: "" });
  savePractice(list); renderPractice();
};

/* ---------- screens / UI ---------- */
function setScreen(name) {
  $$(".tab").forEach((t) => {
    const on = t.dataset.screen === name;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".screen").forEach((s) => {
    const on = s.id === "screen-" + name;
    s.classList.toggle("on", on);
    s.hidden = !on;
  });
  if (name === "diamond") { layout(); dirty = true; }
  if (name === "lineup") renderLineup();
  if (name === "scorebook") renderScorebook();
  if (name === "practice") renderPractice();
}
function renderUI() {
  renderChips();
  renderPresets();
  renderSaved();
  dirty = true;
}
function setTool(t) {
  tool = t;
  $$(".toolbar .tool").forEach((b) => b.classList.toggle("on", b.dataset.tool === t));
  cv.classList.toggle("draw", t !== "move" && t !== "erase");
}

/* ---------- wire events ---------- */
$$(".tab").forEach((t) => t.addEventListener("click", () => setScreen(t.dataset.screen)));
$$(".toolbar .tool").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
$("#btnUndo").onclick = doUndo;
$("#btnClearArrows").onclick = () => { pushUndo(); S.frames[S.cur].arrows = []; dirty = true; persist(); };
$("#btnReset").onclick = () => {
  stopAnim(); pushUndo();
  S.frames[S.cur] = standardFrame(); dirty = true; persist(); renderUI(); toast("Standard defense");
};
$("#btnFirst").onclick = () => { stopAnim(); S.cur = 0; dirty = true; renderUI(); };
$("#btnPrev").onclick = () => { stopAnim(); if (S.cur > 0) { S.cur--; dirty = true; renderUI(); } };
$("#btnNext").onclick = () => { stopAnim(); if (S.cur < S.frames.length - 1) { S.cur++; dirty = true; renderUI(); } };
$("#btnPlay").onclick = playAnim;
$("#btnAddFrame").onclick = addFrame;
$("#btnDelFrame").onclick = delFrame;
$("#speed").onchange = (e) => { speed = +e.target.value; };
$("#chkLabels").onchange = (e) => { showLabels = e.target.checked; dirty = true; };
$("#chkGhost").onchange = (e) => { showGhost = e.target.checked; dirty = true; };
$("#chkBases").onchange = (e) => { showBases = e.target.checked; dirty = true; };
$("#btnSave").onclick = savePlay;
$("#notes").oninput = () => { S.notes = $("#notes").value; persist(); };
$("#playName").oninput = () => { S.name = $("#playName").value; persist(); };
$("#btnNew").onclick = () => {
  stopAnim(); undo.length = 0; S = newPlay(); dirty = true; renderUI(); persist(); toast("New board");
};
$("#btnExportJson").onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "api-dugout-play.json"; a.click();
};
$("#btnImportJson").onclick = () => $("#fileImport").click();
$("#fileImport").onchange = async (e) => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data.frames) throw new Error("bad");
    stopAnim(); S = data; dirty = true; renderUI(); persist(); toast("Imported");
  } catch (_) { toast("Could not import"); }
  e.target.value = "";
};
$("#btnExportPng").onclick = exportPng;
$("#btnHelp").onclick = () => { $("#help").hidden = false; };
$("#btnHelpClose").onclick = () => { $("#help").hidden = true; };
$("#help").addEventListener("click", (e) => { if (e.target.id === "help") $("#help").hidden = true; });

cv.addEventListener("mousedown", onDown);
cv.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onUp);
cv.addEventListener("touchstart", onDown, { passive: false });
cv.addEventListener("touchmove", onMove, { passive: false });
window.addEventListener("touchend", onUp);

window.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea,select")) return;
  if (e.key === " ") { e.preventDefault(); playAnim(); }
  if (e.key === "ArrowLeft") { stopAnim(); if (S.cur > 0) { S.cur--; dirty = true; renderUI(); } }
  if (e.key === "ArrowRight") { stopAnim(); if (S.cur < S.frames.length - 1) { S.cur++; dirty = true; renderUI(); } }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); doUndo(); }
  const map = { m: "move", t: "throw", r: "run", c: "cutoff", e: "erase" };
  if (map[e.key.toLowerCase()]) setTool(map[e.key.toLowerCase()]);
});
window.addEventListener("resize", () => { layout(); dirty = true; });

/* ---------- boot ---------- */
try {
  const raw = localStorage.getItem(LS.play);
  if (raw) {
    const data = JSON.parse(raw);
    if (data && data.frames && data.frames.length) S = data;
  }
} catch (_) {}

renderUI();
layout();
dirty = true;
loop();

// public API for screenshots / tests
window.AD = {
  loadPreset, setSpeed: (s) => { speed = s; $("#speed").value = String(s); },
  play: playAnim, stop: stopAnim, pngDataURL, setScreen, newPlay: () => { S = newPlay(); renderUI(); persist(); },
};

})();
