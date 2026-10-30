/* manens
   1. The brain: a procedural point cloud, drawn as dots and fibres, turning.
   2. Tabs follow the section in view.
   3. Compare: two robots put the glasses away; one knows the house.
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* ------------------------------------------------------------------
     1. The brain
     Two hemispheres (an ellipsoid with a fissure down the middle and
     sine-wave gyri), a cerebellum tucked under the back, and a short
     stem. Points sit on the surface; a few hundred short fibres join
     neighbours. Everything is red; a handful of points "fire" black.
     ------------------------------------------------------------------ */
  var canvas = document.getElementById('brain');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var r = rand(7);
    var N_HEMI = 7000, N_CB = 1100, N_STEM = 240;
    var N = N_HEMI + N_CB + N_STEM;
    var P = new Float32Array(N * 3);
    var i = 0, k;

    var G = new Float32Array(N);   // fold value per point: +1 on a ridge, -1 in a sulcus
    var NR = new Float32Array(N * 3);   // surface normal, approximated as direction from the centre

    for (k = 0; k < N_HEMI; k++) {
      var u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      var x = s * Math.cos(t), y = u, z = s * Math.sin(t);
      var X = x * 0.95, Y = y * 0.78, Z = z * 1.25;
      if (Y < 0) Y *= 0.72;                                   // flatter underside
      if (Z < -0.5) { Z = -0.5 + (Z + 0.5) * 0.82; Y *= 0.92; } // occipital taper
      if (Z > 0.6) Y *= 0.94;                                 // frontal lobe a touch lower
      // folds: long gyri running mostly front to back, wobbling
      var g = Math.sin(10 * t + 2.5 * Math.sin(3 * u * Math.PI) + 0.8 * u * Math.PI);
      var fissure = Math.exp(-(X * X) / 0.012);
      var kk = 1 + 0.06 * g - 0.22 * fissure * (Y > -0.15 ? 1 : 0.3);
      X = X * kk + (X > 0 ? 0.045 : -0.045);                   // two halves, slightly apart
      P[i] = X; P[i + 1] = Y * kk; P[i + 2] = Z * kk;
      G[k] = Y > -0.15 ? g : g * 0.5;
      i += 3;
    }
    for (k = 0; k < N_CB; k++) {
      u = r() * 2 - 1; t = r() * Math.PI * 2; s = Math.sqrt(1 - u * u);
      var fol = Math.sin(14 * u * Math.PI);
      var folia = 1 + 0.05 * fol;
      P[i] = s * Math.cos(t) * 0.52 * folia;
      P[i + 1] = -0.56 + u * 0.26 * folia;
      P[i + 2] = -0.78 + s * Math.sin(t) * 0.36 * folia;
      G[N_HEMI + k] = fol;
      i += 3;
    }
    for (k = 0; k < N_STEM; k++) {
      t = r() * Math.PI * 2;
      P[i] = Math.cos(t) * 0.13;
      P[i + 1] = -0.6 - r() * 0.45;
      P[i + 2] = -0.3 + Math.sin(t) * 0.13;
      G[N_HEMI + N_CB + k] = 0.2;
      i += 3;
    }

    for (k = 0; k < N; k++) {
      var nx = P[k * 3], ny = P[k * 3 + 1], nz = P[k * 3 + 2];
      if (k >= N_HEMI && k < N_HEMI + N_CB) { ny += 0.56; nz += 0.78; }      // cerebellum centre
      else if (k >= N_HEMI + N_CB) { nz += 0.3; ny = 0; }                      // stem: radial
      else { nx -= (nx > 0 ? 0.3 : -0.3); }                                     // each hemisphere's own centre
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      NR[k * 3] = nx / nl; NR[k * 3 + 1] = ny / nl; NR[k * 3 + 2] = nz / nl;
    }

    // fibres: pairs of nearby hemisphere points
    var F = [], tries = 0;
    while (F.length < 900 && tries < 40000) {
      tries++;
      var a = (r() * N_HEMI) | 0, b = (r() * N_HEMI) | 0;
      var dx = P[a * 3] - P[b * 3], dy = P[a * 3 + 1] - P[b * 3 + 1], dz = P[a * 3 + 2] - P[b * 3 + 2];
      var d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > 0.01 && d2 < 0.09) F.push(a, b);
    }

    var proj = new Float32Array(N * 3);   // px, py, depth
    var facing = new Float32Array(N);     // normal · view direction, 1 = facing us
    var order = new Uint32Array(N);
    for (k = 0; k < N; k++) order[k] = k;
    var depthKey = new Float32Array(N);

    var W = 0, H = 0, mouse = { x: 0, y: 0 }, mouseT = { x: 0, y: 0 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseT.x = (e.clientX - rect.left) / rect.width - 0.5;
      mouseT.y = (e.clientY - rect.top) / rect.height - 0.5;
    }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', function () { mouseT.x = 0; mouseT.y = 0; });

    var fire = new Uint32Array(28), fireAt = -1;
    function refire(t) {
      for (var q = 0; q < fire.length; q++) fire[q] = (Math.random() * N_HEMI) | 0;
      fireAt = t;
    }

    function draw(t) {
      mouse.x += (mouseT.x - mouse.x) * 0.05;
      mouse.y += (mouseT.y - mouse.y) * 0.05;
      var ay = (reduceMotion ? 0.9 : t * 0.26) + mouse.x * 0.8;
      var ax = 0.72 + 0.1 * Math.sin(t * 0.4) + mouse.y * 0.4;
      var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
      var roll = -0.18, cr = Math.cos(roll), sr = Math.sin(roll);
      var R = Math.min(W, H) * 0.46, ox = W / 2, oy = H / 2 + R * 0.06;

      for (var q = 0; q < N; q++) {
        var x = P[q * 3], y = P[q * 3 + 1], z = P[q * 3 + 2];
        var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        var x2 = x1 * cr - y1 * sr, y2 = x1 * sr + y1 * cr;
        var persp = 1 / (3.2 - z2);
        proj[q * 3] = ox + x2 * R * persp * 2.2;
        proj[q * 3 + 1] = oy - y2 * R * persp * 2.2;
        proj[q * 3 + 2] = z2;              // -1.3 .. 1.3, nearer is larger
        depthKey[q] = z2;
        var nx = NR[q * 3], ny = NR[q * 3 + 1], nz = NR[q * 3 + 2];
        var nz1 = -nx * sy + nz * cy;
        facing[q] = ny * sx + nz1 * cx;
      }
      Array.prototype.sort.call(order, function (a, b) { return depthKey[a] - depthKey[b]; });

      ctx.clearRect(0, 0, W, H);

      // fibres first, faint
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(209,32,26,0.10)';
      ctx.beginPath();
      for (q = 0; q < F.length; q += 2) {
        var a = F[q], b = F[q + 1];
        if (facing[a] < 0.1 || facing[b] < 0.1) continue;   // only on the facing surface
        ctx.moveTo(proj[a * 3], proj[a * 3 + 1]);
        ctx.lineTo(proj[b * 3], proj[b * 3 + 1]);
      }
      ctx.stroke();

      // points, back to front
      for (q = 0; q < N; q++) {
        var idx = order[q];
        var fc = facing[idx];
        var ridge = 0.5 + 0.5 * G[idx];                    // 1 on a ridge, 0 in a fold
        var size, alpha;
        if (fc <= 0) { size = 0.6; alpha = 0.06; }
        else { size = 0.8 + 2.3 * Math.pow(fc, 0.8); alpha = (0.12 + 0.88 * fc) * (0.3 + 0.7 * ridge); }
        ctx.fillStyle = 'rgba(209,32,26,' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(proj[idx * 3], proj[idx * 3 + 1], size, 0, 6.2832);
        ctx.fill();
      }

      // firing points
      if (t - fireAt > 0.55) refire(t);
      var age = (t - fireAt) / 0.55;
      ctx.fillStyle = 'rgba(17,17,17,' + (0.9 * (1 - age)).toFixed(3) + ')';
      for (q = 0; q < fire.length; q++) {
        idx = fire[q];
        if (facing[idx] < 0.2) continue;
        ctx.beginPath();
        ctx.arc(proj[idx * 3], proj[idx * 3 + 1], 2.2 + 2 * age, 0, 6.2832);
        ctx.fill();
      }
    }

    var t0 = performance.now(), visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    function loop(now) {
      if (visible) draw((now - t0) / 1000);
      if (!reduceMotion) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------
     2. Tabs follow the section in view
     ------------------------------------------------------------------ */
  var tabs = document.querySelectorAll('.tabs a[data-tab]');
  var sections = [];
  tabs.forEach(function (a) {
    var s = document.getElementById(a.getAttribute('data-tab'));
    if (s) sections.push({ el: s, tab: a });
  });
  function updateTabs() {
    var y = window.scrollY + window.innerHeight * 0.35, current = null;
    sections.forEach(function (s) { if (s.el.offsetTop <= y) current = s; });
    sections.forEach(function (s) { s.tab.classList.toggle('active', s === current); });
  }
  if (sections.length) {
    window.addEventListener('scroll', updateTabs, { passive: true });
    window.addEventListener('resize', updateTabs);
    updateTabs();
  }

  /* ------------------------------------------------------------------
     3. Compare. One 12-second loop, both robots start together.
        0.0–0.8 s  idle at the door
        0.8–4.0 s  walk to the table, pick up the glasses, walk to the cabinet
        4.0 s      glasses placed: right shelf (without) / left shelf (with)
        6.0 s      without: a person moves them to the left
     ------------------------------------------------------------------ */
  var compare = document.querySelector('[data-compare]');
  if (compare) {
    var LOOP = 12, START = 0.8, WALK = 3.2, PICK = 0.42;   // PICK: fraction of the path where the table is
    var runs = [
      { key: 'without', shelf: [210, 50], fixAt: 6.0, done: 'Wrong shelf · fixed by a person, again' },
      { key: 'with',    shelf: [110, 50],             done: 'Right shelf, first time' }
    ];
    runs.forEach(function (run) {
      var panel = compare.querySelector('.panel-' + run.key);
      run.path = panel.querySelector('[data-route]');
      run.bot = panel.querySelector('[data-bot]');
      run.glasses = panel.querySelector('[data-glasses]');
      run.status = panel.querySelector('[data-status]');
      run.result = panel.querySelector('[data-result]');
      run.flag = panel.querySelector('[data-flag]');
      run.len = run.path.getTotalLength();
      run.start = run.path.getPointAtLength(0);
      run.table = run.path.getPointAtLength(run.len * PICK);
      // where the glasses are drawn at rest, so we can move the group relative to it
      run.glassesHome = { x: 162, y: 168 };
      if (run.key === 'with') run.path.style.strokeDasharray = String(run.len);
    });
    function tick(t) {
      var lt = t % LOOP;
      runs.forEach(function (run) {
        var f = Math.max(0, Math.min(1, (lt - START) / WALK));
        var p = run.path.getPointAtLength(run.len * f);
        run.bot.setAttribute('cx', p.x.toFixed(1)); run.bot.setAttribute('cy', p.y.toFixed(1));
        if (run.key === 'with') run.path.style.strokeDashoffset = String(run.len * (1 - f));

        // glasses: on the table, then carried, then on a shelf
        var gx, gy;
        if (f < PICK) { gx = run.glassesHome.x; gy = run.glassesHome.y; }
        else if (f < 1) { gx = p.x; gy = p.y - 10; }
        else { gx = run.shelf[0]; gy = run.shelf[1]; }
        if (run.fixAt && lt >= run.fixAt) { gx = 110; gy = 50; }
        run.glasses.setAttribute('transform', 'translate(' + (gx - run.glassesHome.x).toFixed(1) + ' ' + (gy - run.glassesHome.y).toFixed(1) + ')');

        var fixed = run.fixAt && lt >= run.fixAt;
        run.flag.setAttribute('opacity', (run.fixAt ? fixed : f >= PICK) ? '1' : '0');
        run.status.textContent = lt < START ? 'Idle' : f < PICK ? 'To the table' : f < 1 ? 'To the cabinet' : fixed ? 'Corrected' : 'Placed';
        run.result.textContent = f >= 1 ? run.done : '—';
      });
    }
    var c0 = performance.now();
    function cloop(now) { tick((now - c0) / 1000); if (!reduceMotion) requestAnimationFrame(cloop); }
    if (reduceMotion) tick(LOOP - 0.1); else requestAnimationFrame(cloop);
  }
})();
