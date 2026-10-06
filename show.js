/*
 * The first second.
 *
 * A projector sits at the bottom of the screen. Its beam crosses the air and
 * writes a Romanian town's name on the dark wall above, one stroke at a time,
 * with sparks at the hot point. The name stays lit while the beam scans it,
 * then breaks into a fan of beams and the next town begins. Type your own
 * town and it is drawn next, straight away.
 *
 * Same single-stroke font as the projector (glyphs.js), same one moving point.
 */
(function () {
  const canvas = document.getElementById('show');
  if (!canvas || typeof GLYPHS === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const form = document.getElementById('tryForm');
  const input = document.getElementById('tryName');
  const wa = document.getElementById('tryWa');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Short names first: on a phone the first word decides whether anyone keeps watching.
  const TOWNS = ['HAȚEG', 'SIMERIA', 'PETROȘANI', 'SATU MARE', 'BISTRIȚA', 'URICANI',
    'TÂRGU JIU', 'CARANSEBEȘ', 'LA MULȚI ANI!'];
  const ADV = 5.6 / 6;
  const DRAW = 1.7, HOLD = 1.6, BURST = 1.1;   // seconds per phase

  let W = 1, H = 1, dpr = 1;
  let word = null, phase = 'draw', phaseT = 0, townIdx = 0, queued = null;
  let sparks = [];

  const clean = (s) => [...s.toUpperCase()].filter((c) => c === ' ' || GLYPHS[c]).join('').trim();

  /* Lay a word out in screen space and resample every stroke at an even pitch,
     so the beam moves at constant speed the way a galvo does. */
  function build(text) {
    // Two-word names go on two lines: twice the letter height on a narrow screen.
    const lines = text.includes(' ') && W < H * 1.1 ? text.split(' ') : [text];
    const span = Math.max(...lines.map((l) => [...l].length)) * ADV;
    const wallTop = H * 0.1, wallBottom = H * 0.58;
    const lh = 1.55;                                   // line pitch, in letter heights
    let k = Math.min((W * 0.92) / span, (wallBottom - wallTop) * 0.62 / (lines.length * lh));
    const cx = W / 2, mid = (wallTop + wallBottom) / 2;
    const strokes = [];
    let total = 0;
    lines.forEach((line, li) => {
      const chars = [...line];
      const lspan = chars.length * ADV;
      const cy = mid + (li - (lines.length - 1) / 2) * lh * k;
      const x0 = cx - (lspan * k) / 2 + (ADV * k) / 2;
      chars.forEach((ch, i) => {
        const g = GLYPHS[ch];
        if (!g) return;
        for (const st of g) {
          const raw = st.map((p) => [x0 + (i * ADV + p[0]) * k, cy - p[1] * k]);
          const pts = [raw[0]];
          for (let j = 1; j < raw.length; j++) {
            const [ax, ay] = raw[j - 1], [bx, by] = raw[j];
            const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (3 * dpr)));
            for (let m = 1; m <= n; m++) pts.push([ax + (bx - ax) * m / n, ay + (by - ay) * m / n]);
          }
          const u = (raw[0][0] - (cx - (span * k) / 2)) / (span * k) * 0.5 + li * 0.5 / lines.length;
          strokes.push({ pts, u, start: total });
          total += pts.length;
        }
      });
    });
    return { text, strokes, total, k, cy: mid };
  }

  function hue(u, t) { return ((u * 0.55 + t * 0.06) % 1) * 360; }

  function nextWord() {
    let text;
    if (queued) { text = queued; queued = null; }
    else { text = TOWNS[townIdx % TOWNS.length]; townIdx++; }
    word = build(text);
    phase = reduced ? 'hold' : 'draw';
    phaseT = 0;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.round(r.width * dpr));
    H = canvas.height = Math.max(1, Math.round(r.height * dpr));
    if (word) word = build(word.text);
  }

  const P = () => [W / 2, H * 1.02];          // the projector, just below the screen

  function strokePath(pts, upto) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < upto; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }

  function drawText(lit, t, fade) {
    const k = word.k;
    for (const s of word.strokes) {
      const upto = Math.min(s.pts.length, lit - s.start);
      if (upto < 2) continue;
      const h = hue(s.u, t);
      strokePath(s.pts, upto);
      ctx.strokeStyle = `hsla(${h},100%,55%,${0.13 * fade})`; ctx.lineWidth = k * 0.09; ctx.stroke();
      ctx.strokeStyle = `hsla(${h},100%,60%,${0.5 * fade})`; ctx.lineWidth = k * 0.03; ctx.stroke();
      ctx.strokeStyle = `hsla(${h},100%,82%,${fade})`; ctx.lineWidth = Math.max(1.3 * dpr, k * 0.011); ctx.stroke();
    }
  }

  function beam(x, y, h, a, w) {
    const [px, py] = P();
    const g = ctx.createLinearGradient(px, py, x, y);
    g.addColorStop(0, `hsla(${h},100%,70%,${a})`);
    g.addColorStop(1, `hsla(${h},100%,70%,${a * 0.25})`);
    ctx.strokeStyle = g; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
  }

  function pointAt(n) {
    for (const s of word.strokes) {
      if (n < s.start + s.pts.length) return { p: s.pts[Math.max(0, n - s.start)], s };
    }
    const s = word.strokes[word.strokes.length - 1];
    return { p: s.pts[s.pts.length - 1], s };
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    phaseT += dt;

    // Night, with a little light thrown back off the wall where the name is.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
    const spill = ctx.createRadialGradient(W / 2, word.cy, 0, W / 2, word.cy, Math.max(W, H) * 0.6);
    const glow = phase === 'burst' ? Math.max(0, 1 - phaseT / BURST) : Math.min(1, phaseT / DRAW + (phase === 'hold' ? 1 : 0));
    spill.addColorStop(0, `rgba(40,55,110,${0.35 * glow})`); spill.addColorStop(1, 'rgba(5,7,15,0)');
    ctx.fillStyle = spill; ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    if (phase === 'draw') {
      const lit = Math.floor(word.total * Math.min(1, phaseT / DRAW));
      drawText(lit, t, 1);
      const { p: [hx, hy], s } = pointAt(lit);
      const h = hue(s.u, t);
      beam(hx, hy, h, 0.85, 1.8 * dpr);
      beam(hx, hy, h, 0.14, 10 * dpr);
      // the hot point
      const r = word.k * 0.06;
      const dot = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
      dot.addColorStop(0, 'rgba(255,255,255,1)'); dot.addColorStop(0.3, `hsla(${h},100%,70%,.8)`); dot.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(hx, hy, r, 0, 6.3); ctx.fill();
      for (let i = 0; i < 3; i++) {
        sparks.push({ x: hx, y: hy, vx: (Math.random() - 0.5) * 260 * dpr, vy: (Math.random() * -1.2 - 0.2) * 160 * dpr, life: 0.5 + Math.random() * 0.5, h });
      }
      if (phaseT >= DRAW) { phase = 'hold'; phaseT = 0; }
    } else if (phase === 'hold') {
      drawText(word.total, t, 0.92 + Math.random() * 0.08);
      if (!reduced) {
        // the projector scanning the whole name: a flickering sheet of beams
        for (let i = 0; i < 7; i++) {
          const { p: [x, y], s } = pointAt(Math.floor(Math.random() * word.total));
          beam(x, y, hue(s.u, t), 0.2, 1.3 * dpr);
        }
        if (phaseT >= HOLD) { phase = 'burst'; phaseT = 0; }
      }
    } else {
      const f = phaseT / BURST;
      drawText(word.total, t, Math.max(0, 1 - f * 1.6));
      // the name breaks into a fan of beams that sweeps the sky
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * (0.6 + f * 2.2) + Math.sin(t * 3 + i) * 0.05;
        const L = Math.max(W, H) * 1.3;
        const [px, py] = P();
        beam(px + Math.cos(a) * L, py + Math.sin(a) * L, (i / n * 360 + t * 90) % 360, 0.55 * (1 - f), 2.4 * dpr);
      }
      if (phaseT >= BURST) nextWord();
    }

    // sparks
    for (const s of sparks) {
      s.life -= dt; s.vy += 420 * dpr * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      ctx.fillStyle = `hsla(${s.h},100%,75%,${Math.max(0, s.life)})`;
      ctx.fillRect(s.x, s.y, 2 * dpr, 2 * dpr);
    }
    sparks = sparks.filter((s) => s.life > 0);

    if (!reduced || phase === 'draw') requestAnimationFrame(frame);
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = clean(input.value).slice(0, 18);
    if (!name) return;
    queued = name;
    nextWord();
    if (reduced) requestAnimationFrame(frame);
    if (wa) wa.href = 'https://wa.me/40741447101?text=' + encodeURIComponent(
      `Bună ziua. Aș vrea „${name}” scris cu laser pe o clădire. Ce ofertă ne puteți face?`);
    input.blur();
  });

  const float = document.querySelector('.wa-float');
  if (float) {
    const sync = () => float.classList.toggle('away', window.scrollY < window.innerHeight * 0.6);
    addEventListener('scroll', sync, { passive: true }); sync();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  nextWord();
  frame(performance.now());
})();
