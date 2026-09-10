/*
 * The column that scrolls.
 *
 * The machine does not only draw a name - it draws text, line after line, for
 * as long as the evening lasts. So the space beside the copy is not decoration
 * and it is not black: it is the feature itself, running. Verses, a greeting,
 * the three historical provinces on a blazon, and round again.
 *
 * The opening lines are Eminescu's - the poem this brand is named after. A
 * mayor reading the page recognises them before he reads a word of ours.
 */
(function () {
  const canvas = document.getElementById('verse');
  if (!canvas || typeof GLYPHS === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ADVANCE = 5.6 / 6;
  const SECONDS_PER_LINE = 3.4;

  const GOLD = [240, 190, 69];
  const ICE = [120, 200, 255];
  const SNOW = [237, 241, 248];

  /* A blazon is a shape the engine can actually draw - straight strokes and a
     point. An eagle is not, and a badly drawn coat of arms is worse than none. */
  const ITEMS = [
    { t: 'A FOST ODATĂ', c: SNOW },
    { t: 'CA-N POVEȘTI', c: SNOW },
    { t: 'A FOST', c: SNOW },
    { t: 'CA NICIODATĂ', c: SNOW },
    { t: 'MOLDOVA', c: GOLD, shield: true },
    { t: 'LA MULȚI ANI', c: GOLD },
    { t: 'TRANSILVANIA', c: GOLD, shield: true },
    { t: 'SĂRBĂTORI', c: ICE },
    { t: 'FERICITE', c: ICE },
    { t: 'ȚARA ROMÂNEASCĂ', c: GOLD, shield: true },
    { t: 'BUN VENIT', c: SNOW },
    { t: 'ÎN ORAȘUL', c: SNOW },
    { t: 'NOSTRU', c: SNOW },
  ];

  let dpr = 1;
  let w = 0;
  let h = 0;
  let visible = true;
  let running = false;

  /* One line of text as a point list, measured, centred on its own origin. */
  function build(text) {
    const chars = [...text].filter((c) => c === ' ' || GLYPHS[c]);
    const out = [];
    let x = 0;
    for (const ch of chars) {
      const glyph = GLYPHS[ch];
      if (glyph) {
        for (const stroke of glyph) {
          stroke.forEach((p, i) => out.push({ x: x + p[0], y: p[1], lit: i > 0 }));
        }
      }
      x += ADVANCE;
    }
    let lo = Infinity, hi = -Infinity;
    for (const p of out) { if (p.x < lo) lo = p.x; if (p.x > hi) hi = p.x; }
    const mid = (lo + hi) / 2;
    for (const p of out) p.x -= mid;
    return { pts: out, span: Math.max(1e-3, hi - lo) };
  }

  for (const it of ITEMS) Object.assign(it, build(it.t));

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width * dpr));
    const nh = Math.max(1, Math.round(r.height * dpr));
    if (nw !== canvas.width || nh !== canvas.height) {
      canvas.width = nw;
      canvas.height = nh;
    }
    w = canvas.width;
    h = canvas.height;
  }

  function stroke(pts, size, cx, cy, rgb, alpha) {
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    for (const pass of [[0.28 * alpha, 8], [alpha, 2.1]]) {
      ctx.globalAlpha = pass[0];
      ctx.lineWidth = pass[1] * dpr;
      ctx.beginPath();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (!b.lit) continue;
        ctx.moveTo(cx + a.x * size, cy - a.y * size);
        ctx.lineTo(cx + b.x * size, cy - b.y * size);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* The blazon is built around the text it carries, not around the slot: pad the
     measured word, then lift the whole shape so its bounding box - point
     included - is centred on the line. Otherwise the point hangs below and the
     crest reads as if it had slipped. */
  function blazon(cx, cy, textHalfW, textHalfH, alpha) {
    // All measured in half text heights, so the frame scales with the word.
    const u = textHalfH;
    // The body is what has to sit around the letters; the point is allowed to
    // hang below, the way a crest hangs. A small lift keeps the row balanced.
    const lift = u * 0.3;
    const halfW = textHalfW + u * 1.2;
    const top = cy - u * 1.9 - lift;
    const shoulder = cy + u * 1.9 - lift;
    const point = cy + u * 3.3 - lift;

    ctx.strokeStyle = `rgb(${ICE[0]},${ICE[1]},${ICE[2]})`;
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const pass of [[0.18 * alpha, 5], [alpha * 0.8, 1.5]]) {
      ctx.globalAlpha = pass[0];
      ctx.lineWidth = pass[1] * dpr;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, top);
      ctx.lineTo(cx + halfW, top);
      ctx.lineTo(cx + halfW, shoulder);
      ctx.lineTo(cx, point);
      ctx.lineTo(cx - halfW, shoulder);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    const lh = h / 3.1;                       // three lines in view
    const total = ITEMS.length * lh;
    const offset = ((t / SECONDS_PER_LINE) * lh) % total;

    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i];
      let y = i * lh - offset;
      // Wrap into the visible band plus one line of margin either side.
      y = ((y % total) + total) % total;
      if (y > h + lh) y -= total;
      if (y < -lh || y > h + lh) continue;

      const cy = y + lh / 2;
      // The line crossing the middle is the one being read: it burns brighter.
      const d = Math.abs(cy - h / 2) / (h / 2);
      const alpha = Math.max(0.22, 1 - d * 0.8);

      // A crested line has to leave room for its own frame, so it is set smaller.
      const room = it.shield ? 0.62 : 0.82;
      const size = Math.min((w * room) / it.span, lh * (it.shield ? 0.30 : 0.42));
      if (it.shield) blazon(w / 2, cy, (size * it.span) / 2, size / 2, alpha);
      stroke(it.pts, size, w / 2, cy, it.c, alpha);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    if (!visible) { running = false; return; }
    resize();
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { resize(); if (reduced) draw(0); });

  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); },
      { threshold: 0 }).observe(canvas);
  }

  resize();
  if (reduced) { draw(0); return; }   // no motion: one still frame of the roll
  start();
})();
