/*
 * The air above the crowd.
 *
 * Two projectors sit just outside the bottom corners of the hero and throw a
 * fan of beams up over the building. They are drawn, not filmed: a wedge per
 * beam, additive, with a soft core - which is what a beam in haze actually is,
 * a cone of lit dust that gets thinner with distance.
 *
 * Reactive means reactive. The fan leans toward the pointer, opens as the page
 * is scrolled, and every beam sweeps on its own period so the pattern never
 * repeats to the eye. Nothing here is a loop of a video.
 */
(function () {
  const canvas = document.getElementById('heroBeams');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* GOLD / EMBER / ICE / PINE - the four the projector actually has. */
  const HUES = [
    [255, 190, 64],
    [255, 122, 74],
    [120, 200, 255],
    [110, 220, 160],
  ];

  /* Each head gets its own fan. x is a fraction of the width, y sits a little
     below the frame so the source itself is off-screen, as it is on site. */
  const HEADS = [
    { x: 0.05, y: 1.06, aim: 0.52, spread: 0.5 },
    { x: 0.95, y: 1.06, aim: -0.52, spread: 0.5 },
  ];
  const PER_HEAD = 5;

  const beams = [];
  for (let h = 0; h < HEADS.length; h++) {
    for (let i = 0; i < PER_HEAD; i++) {
      const u = PER_HEAD === 1 ? 0 : i / (PER_HEAD - 1) - 0.5;
      beams.push({
        head: h,
        base: u * 2 * HEADS[h].spread,
        amp: 0.06 + Math.random() * 0.09,
        speed: 0.11 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        hue: HUES[(i + h) % HUES.length],
        width: 0.006 + Math.random() * 0.006,
        power: 0.5 + Math.random() * 0.5,
      });
    }
  }

  let dpr = 1;
  let w = 0;
  let h = 0;
  let visible = true;
  let running = false;
  let lean = 0;            // pointer influence, -1..1
  let leanTarget = 0;
  let open = 0;            // scroll influence, 0..1

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

  /* One wedge: a triangle from the source, fading out along its length. Drawn
     three times - halo, body, core - which reads as a beam far more cheaply
     than a real blur. */
  function wedge(ox, oy, angle, len, half, rgb, alpha) {
    const c = Math.cos(angle - Math.PI / 2);
    const s = Math.sin(angle - Math.PI / 2);
    const ex = ox + c * len;
    const ey = oy + s * len;
    const nx = -s * half;
    const ny = c * half;

    const g = ctx.createLinearGradient(ox, oy, ex, ey);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
    g.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.42})`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex + nx, ey + ny);
    ctx.lineTo(ex - nx, ey - ny);
    ctx.closePath();
    ctx.fill();
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    const len = Math.hypot(w, h) * 1.15;

    for (const b of beams) {
      const head = HEADS[b.head];
      const ox = head.x * w;
      const oy = head.y * h;
      // Sweep + pointer lean + scroll opening the fan outward.
      const angle = head.aim
        + b.base * (1 + open * 0.55)
        + Math.sin(t * b.speed + b.phase) * b.amp
        + lean * 0.14;

      const a = b.power * (0.20 + open * 0.07);
      wedge(ox, oy, angle, len, b.width * 3.4 * w, b.hue, a * 0.34);
      wedge(ox, oy, angle, len, b.width * 1.4 * w, b.hue, a * 0.72);
      wedge(ox, oy, angle, len, b.width * 0.42 * w, b.hue, a * 1.5);
    }

    /* The haze the beams are born in - without it they look like they start
       from nothing. */
    for (const head of HEADS) {
      const hx = head.x * w, hy = head.y * h, r = h * 0.5;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
      g.addColorStop(0, 'rgba(150,190,255,.11)');
      g.addColorStop(1, 'rgba(150,190,255,0)');
      ctx.fillStyle = g;
      // Only the disc, not the whole canvas: two full-frame fills a frame is
      // the difference between smooth and hot on a phone.
      ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    if (!visible) { running = false; return; }
    resize();
    lean += (leanTarget - lean) * 0.06;
    const top = canvas.getBoundingClientRect().top;
    open = Math.min(1, Math.max(0, -top / Math.max(1, innerHeight)));
    draw(now / 1000);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', (e) => {
    leanTarget = (e.clientX / innerWidth) * 2 - 1;
  }, { passive: true });

  addEventListener('resize', () => { resize(); if (reduced) draw(0); });

  /* A fan of beams is worth nothing to a reader who has scrolled past it, and
     an animation nobody can see is battery burnt for no reason. */
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0 }).observe(canvas);
  }

  resize();
  if (reduced) { draw(0); return; }   // no motion: one still frame of the fan
  start();
})();
