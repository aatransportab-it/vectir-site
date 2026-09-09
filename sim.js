/*
 * The mini simulator.
 *
 * Not an animation of text appearing: a beam tracing the same strokes the
 * projector traces, over and over, with the afterglow that makes a laser look
 * continuous when it is in fact one moving dot. The letters are the real
 * single-stroke font from the engine, dumped glyph by glyph - so what a visitor
 * sees here is the geometry that would land on their wall, not a lookalike.
 *
 * Two departures from the machine, both deliberate:
 *
 *   - The pass is slowed to about a second. At 40 000 points a second the head
 *     completes sixty times over before the eye catches it, and the effect -
 *     a solid glowing word - hides the one thing worth showing here.
 *   - Persistence is longer than a wall's. A screen has no phosphor and no
 *     haze, so the trail has to be carried in the canvas instead.
 */
(function () {
  const canvas = document.getElementById('sim');
  const input = document.getElementById('oras');
  if (!canvas || !input) return;

  const ctx = canvas.getContext('2d');
  const ADVANCE = 5.6 / 6;          // glyph width + spacing, in size-1 units
  const PASS_SECONDS = 1.15;        // one full retrace
  const FADE = 0.16;                // per-frame veil; the afterglow
  const GROUND = '#0A0F1E';

  let points = [];                  // { x, y, lit }
  let cursor = 0;
  let last = performance.now();
  let dpr = 1;

  /** Lay the text out as one ordered point list, blanked jumps included. */
  function build(text) {
    const chars = [...text.toUpperCase()].filter((c) => c === ' ' || GLYPHS[c]);
    if (chars.length === 0) return [];

    const width = Math.max(ADVANCE, chars.length * ADVANCE);
    // Fit the longest of the two axes, leaving a margin, so a long name shrinks
    // rather than running off the edge.
    const scale = Math.min(0.86 / width, 0.34);
    let x = -(chars.length - 1) * ADVANCE * scale / 2;
    const out = [];

    for (const ch of chars) {
      const glyph = GLYPHS[ch];
      if (glyph) {
        for (const stroke of glyph) {
          stroke.forEach((p, i) => {
            out.push({ x: x + p[0] * scale, y: p[1] * scale, lit: i > 0 });
          });
        }
      }
      x += ADVANCE * scale;
    }
    return out;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** Warm red through gold to ice, left to right - the free-text scene's sweep. */
  function colorAt(u) {
    const stops = [[255, 70, 60], [255, 190, 40], [110, 235, 140], [120, 200, 255]];
    const f = Math.min(0.999, Math.max(0, u)) * (stops.length - 1);
    const i = Math.floor(f), t = f - i;
    const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)];
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    resize();

    const w = canvas.width, h = canvas.height;
    const size = Math.min(w, h) * 0.94;
    const cx = w / 2, cy = h / 2;

    // The veil is the persistence. Everything drawn earlier dims by a fixed
    // fraction each frame, which is what a phosphor - or an eye - does.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(10,15,30,${FADE})`;
    ctx.fillRect(0, 0, w, h);

    if (points.length > 1) {
      const step = (points.length / PASS_SECONDS) * dt;
      const from = cursor;
      const to = cursor + step;

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = Math.floor(from); i < to; i++) {
        const a = points[((i % points.length) + points.length) % points.length];
        const b = points[(((i + 1) % points.length) + points.length) % points.length];
        if (!b.lit) continue;             // a blanked jump draws nothing
        const u = (((i % points.length) + points.length) % points.length) / points.length;
        const color = colorAt(u);
        const px = (p) => cx + p.x * size, py = (p) => cy - p.y * size;

        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = 7 * dpr;
        ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.lineWidth = 1.7 * dpr;
        ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      cursor = to % points.length;
    }

    requestAnimationFrame(frame);
  }

  function retext() {
    points = build(input.value || 'ORAȘUL DUMNEAVOASTRĂ');
    cursor = 0;
  }

  input.addEventListener('input', retext);
  window.addEventListener('resize', resize);
  retext();
  requestAnimationFrame(frame);
})();
