/*
 * The wordmark, traced.
 *
 * Every other site fades its logo in. This one draws it — with the same single
 * moving point, the same single-stroke font and the same afterglow as the
 * machine being sold. The medium is the argument: a visitor watches the product
 * work before reading a word about it.
 *
 * The <h1> stays in the markup, visually hidden, so the page still has a real
 * heading for a reader that never sees a canvas.
 */
(function () {
  const canvas = document.getElementById('heroLaser');
  if (!canvas || typeof GLYPHS === 'undefined') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');

  const WORD = 'LUCEAFĂRUL';
  const ADVANCE = 5.6 / 6;
  const PASS = reduced ? 0 : 2.6;      // seconds for one full trace
  const HEAD = 14;                     // points still glowing hot behind the beam

  let pts = [];
  let spanX = 1;                       // word width in glyph units, measured at build
  let dpr = 1;
  let t0 = 0;                          // first animated frame
  let done = reduced;                  // traced: from here on the mark just stays lit

  /* The mark is laid out from its own left edge, not centred, so it lines up
     with the tagline underneath exactly as the <h1> it replaced did. */
  function build() {
    const chars = [...WORD].filter((c) => GLYPHS[c]);
    const scale = 1 / chars.length;
    let x = 0;
    const out = [];
    for (const ch of chars) {
      for (const stroke of GLYPHS[ch]) {
        stroke.forEach((p, i) => out.push({ x: x + p[0] * scale, y: p[1] * scale, lit: i > 0 }));
      }
      x += ADVANCE * scale;
    }
    let lo = Infinity, hi = -Infinity;
    for (const p of out) { if (p.x < lo) lo = p.x; if (p.x > hi) hi = p.x; }
    for (const p of out) p.x -= lo;
    spanX = Math.max(1e-3, hi - lo);
    return out;
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      pts = build();
    }
  }

  /* Gold through to ice, left to right — the palette the projector actually draws. */
  function colorAt(u) {
    const stops = [[255, 150, 60], [240, 190, 69], [180, 235, 180], [120, 200, 255]];
    const f = Math.min(0.999, Math.max(0, u)) * (stops.length - 1);
    const i = Math.floor(f), t = f - i;
    const a = stops[i], b = stops[Math.min(stops.length - 1, i + 1)];
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  }

  /* Ten glyphs wide and one glyph tall: width is what binds on every screen, so
     scale off the measured span and only fall back to height on a squat box. */
  function fit(w, h) {
    return Math.min(w / spanX, h * 0.62 * WORD.length);
  }

  function drawWhole() {
    const w = canvas.width, h = canvas.height;
    const size = fit(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (!b.lit) continue;
      ctx.strokeStyle = colorAt(i / pts.length);
      ctx.globalAlpha = 0.14; ctx.lineWidth = 9 * dpr;
      line(a, b, w, h, size);
      ctx.globalAlpha = 1; ctx.lineWidth = 2.1 * dpr;
      line(a, b, w, h, size);
    }
    ctx.globalAlpha = 1;
  }

  function line(a, b, w, h, size) {
    const x0 = (w - spanX * size) / 2 * 0.12;   // hard left, a hair of breathing room
    ctx.beginPath();
    ctx.moveTo(x0 + a.x * size, h / 2 - a.y * size);
    ctx.lineTo(x0 + b.x * size, h / 2 - b.y * size);
    ctx.stroke();
  }

  /* A real projector holds what it has drawn: the whole figure is redrawn thirty
     times a second, so the letters already traced stay lit while the beam works
     on the next one. Only the point itself is hotter. Fading the drawn part out
     would be a comet, which is what a laser does NOT look like.

     Progress comes from the clock, not from accumulated frame deltas, so the
     trace lasts PASS seconds whether the phone renders at 60fps or at 12.

     It draws once and then stops. A title that keeps erasing and rewriting
     itself is a title nobody can read, and a rAF loop that never ends is a
     phone battery nobody gets back. */
  function frame(now) {
    resize();
    if (pts.length < 2) { requestAnimationFrame(frame); return; }
    if (!t0) t0 = now;

    const elapsed = (now - t0) / 1000;
    if (elapsed >= PASS) { done = true; drawWhole(); return; }

    const w = canvas.width, h = canvas.height;
    const size = fit(w, h);
    const upto = Math.floor((elapsed / PASS) * (pts.length - 1));

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = ctx.lineJoin = 'round';
    for (let i = 0; i < upto; i++) {
      const a = pts[i], b = pts[i + 1];
      if (!b.lit) continue;
      ctx.strokeStyle = colorAt(i / pts.length);
      // The last stretch is the beam still in flight - brighter, wider halo.
      const hot = i > upto - HEAD;
      ctx.globalAlpha = hot ? 0.30 : 0.14; ctx.lineWidth = (hot ? 12 : 9) * dpr;
      line(a, b, w, h, size);
      ctx.globalAlpha = 1; ctx.lineWidth = (hot ? 2.6 : 2.1) * dpr;
      line(a, b, w, h, size);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  /* Resizing the backing store wipes it. The animated path repaints every frame
     anyway; the reduced-motion path draws once, so it has to redraw on every box
     change or the mark silently disappears the first time layout settles. */
  const repaint = () => { resize(); if (done) drawWhole(); };
  if (typeof ResizeObserver === 'function') new ResizeObserver(repaint).observe(canvas);
  addEventListener('resize', repaint);
  repaint();
  if (reduced) return;                    // no motion: it is already finished
  requestAnimationFrame(frame);

  /* Anyone who wants to see it drawn again only has to ask. */
  canvas.addEventListener('click', () => { done = false; t0 = 0; requestAnimationFrame(frame); });
})();
