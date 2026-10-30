// Mood Tide: feelings come and go like tides. Every Moodling still loose raises the tide of the night,
// every one brought home lowers it, and the world shows it: rain, a cool tint and a soft vignette at high
// tide; a warm sky and fireflies at low tide; a little wave across the bottom of the screen on every catch.
// Cosmetic first. The only gameplay hook is the Night 6 tide pool keepsake (open() below), which shows
// once the tide is low. Fixed-size particle pools, so nothing is allocated per frame.
(function (root) {
  'use strict';
  const TIP_KEY = 'tc-tide-tip-seen';
  const POOL_OPEN = 0.4;
  const RAIN_N = 70, FLY_N = 18;
  const rain = Array.from({ length: RAIN_N }, (_, i) => ({ x: (i * 97) % 1000 / 1000, y: (i * 61) % 1000 / 1000, s: .7 + (i % 5) * .08 }));
  const flies = Array.from({ length: FLY_N }, (_, i) => ({ x: (i * 173) % 1000 / 1000, y: .35 + ((i * 89) % 1000) / 1000 * .5, p: i * 1.7 }));
  // Festival nights: every feeling brought home sends up a paper lantern that stays in the sky (up to 40).
  const LANTERN_MAX = 40;
  const lanterns = Array.from({ length: LANTERN_MAX }, () => ({ on: false, x: 0, y: 0, ty: 0, p: 0, c: '#ffcf5c', a: 0 }));
  let lanternN = 0;
  const COLORS = { F: '#ff7a8a', N: '#b39cff', L: '#8fb3ff', S: '#ffb3d1', E: '#ffcf5c', J: '#9be08a', B: '#c9a27a', C: '#8fe0c8', G: '#ffd700' };
  const S = { lanterns: false, raw: 1, value: 1, active: false, gentle: false, reduce: false, lead: null, ripple: 0, rippleColor: '#bfe8ff', t: 0, tipShown: false, wasOpen: false };
  try { S.tipShown = localStorage.getItem(TIP_KEY) === '1'; } catch (e) {}

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // 0 = every feeling home (calm), 1 = none caught yet (high tide)
  function compute(need, got) {
    let total = 0, left = 0, lead = null, most = 0;
    for (const k in need) {
      const n = need[k] || 0; if (n <= 0) continue;
      const l = Math.max(0, n - (got[k] || 0));
      total += n; left += l;
      if (l > most) { most = l; lead = k; }
    }
    return { v: total ? left / total : 0, lead };
  }

  const api = {
    POOL_OPEN,
    start(opts = {}) {
      S.active = !!opts.active; S.gentle = !!opts.gentle; S.reduce = !!opts.reduce;
      S.raw = 1; S.value = 1; S.lead = null; S.ripple = 0; S.t = 0; S.wasOpen = false;
      S.lanterns = !!opts.lanterns; S.indoor = !!opts.indoor; lanternN = 0; for (const l of lanterns) l.on = false;
    },
    stop() { S.active = false; },
    value() { return clamp(S.value, 0, 1); },
    raw() { return clamp(S.raw, 0, 1); },
    compute,
    // the Night 6 tide pool shows once the tide is low; in Gentle mode it is always open
    open() { return S.gentle || S.raw < POOL_OPEN; },
    update(dt, need, got, announce) {
      if (!S.active) return;
      S.t += dt;
      const c = compute(need || {}, got || {});
      S.raw = c.v; S.lead = c.lead;
      S.value += (S.raw - S.value) * Math.min(1, dt * 1.6);   // smoothed
      S.ripple = Math.max(0, S.ripple - dt);
      if (!S.tipShown && S.t > 4 && typeof announce === 'function') {
        S.tipShown = true; try { localStorage.setItem(TIP_KEY, '1'); } catch (e) {}
        announce('The Mood Tide rises while feelings are lost. Bring them home to calm the night.', '#bfe8ff', 4);
      }
      const nowOpen = api.open();
      if (nowOpen && !S.wasOpen && S.raw < POOL_OPEN && typeof api.onPoolOpen === 'function') api.onPoolOpen();
      S.wasOpen = nowOpen;
    },
    caught(type, sx, sy) {
      if (!S.active) return; S.ripple = 1.1; S.rippleColor = COLORS[type] || '#bfe8ff';
      if (S.lanterns && lanternN < LANTERN_MAX && sx != null) {
        const l = lanterns[lanternN++], k = lanternN;
        l.on = true; l.x = sx; l.y = sy; l.ty = 150 + ((k * 53) % 170);   // below the HUD l.p = k * 1.9; l.c = COLORS[type] || '#ffcf5c'; l.a = 0;
      }
    },
    lanternCount() { return lanternN; },
    // world reactions, drawn in screen space over the level and under the HUD
    drawWorld(ctx, W, H, top) {
      if (!S.active) return;
      const v = api.value(), soft = S.gentle || S.reduce ? .55 : 1, y0 = -(top || 0), h = H + 2 * (top || 0);
      ctx.save();
      // high tide: a cool tint, a soft vignette and rain
      const hi = clamp((v - .35) / .65, 0, 1) * soft;
      if (hi > .01) {
        ctx.fillStyle = `rgba(40,70,140,${(.10 * hi).toFixed(3)})`; ctx.fillRect(0, y0, W, h);
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .72);
        g.addColorStop(0, 'rgba(8,12,30,0)'); g.addColorStop(1, `rgba(8,12,30,${(.38 * hi).toFixed(3)})`);
        ctx.fillStyle = g; ctx.fillRect(0, y0, W, h);
        if (!S.reduce && !S.indoor) {   // no rain indoors (the school hallway): just the tint and vignette
          ctx.strokeStyle = `rgba(190,215,255,${(.32 * hi).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath();
          const n = Math.round(RAIN_N * hi);
          for (let i = 0; i < n; i++) {
            const r = rain[i], ry = ((r.y + S.t * .9 * r.s) % 1) * (h + 40) + y0 - 20, rx = ((r.x + S.t * .05) % 1) * (W + 40) - 20;
            ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 14);
          }
          ctx.stroke();
        }
      }
      // low tide: the sky warms and fireflies come out
      const lo = clamp((.45 - v) / .45, 0, 1) * soft;
      if (lo > .01) {
        const g = ctx.createLinearGradient(0, y0, 0, H * .6);
        g.addColorStop(0, `rgba(255,190,120,${(.14 * lo).toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,120,0)');
        ctx.fillStyle = g; ctx.fillRect(0, y0, W, H * .6 - y0);
        ctx.fillStyle = `rgba(255,236,150,${(.75 * lo).toFixed(3)})`;
        for (let i = 0; i < FLY_N; i++) {
          const f = flies[i], wob = S.reduce ? 0 : Math.sin(S.t * 1.3 + f.p);
          const fx = (f.x * W + (S.reduce ? 0 : S.t * 9 * (i % 2 ? 1 : -1))) % W, fy = f.y * H + wob * 10;
          const tw = S.reduce ? .8 : .45 + .55 * Math.max(0, Math.sin(S.t * 2.2 + f.p * 3));
          ctx.globalAlpha = tw; ctx.beginPath(); ctx.arc((fx + W) % W, fy, 2.2, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // released lanterns: rise from where the feeling was caught, then hang in the sky and sway
      if (lanternN) {
        for (let i = 0; i < lanternN; i++) {
          const l = lanterns[i]; if (!l.on) continue;
          l.y += (l.ty - l.y) * .02; l.a = Math.min(1, l.a + .03);
          const sway = S.reduce ? 0 : Math.sin(S.t * 1.1 + l.p) * 3, x = l.x + sway, y = l.y + (S.reduce ? 0 : Math.sin(S.t * .8 + l.p) * 2);
          if (x < -20 || x > W + 20) continue;
          ctx.globalAlpha = .28 * l.a; ctx.fillStyle = l.c; ctx.beginPath(); ctx.arc(x, y, 15, 0, 6.283); ctx.fill();
          ctx.globalAlpha = .95 * l.a; ctx.fillStyle = '#ffe9b0'; ctx.beginPath(); ctx.ellipse(x, y, 6, 8, 0, 0, 6.283); ctx.fill();
          ctx.fillStyle = l.c; ctx.fillRect(x - 6, y - 1.5, 12, 3); ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 4, y + 7, 8, 2);
        }
        ctx.globalAlpha = 1;
      }
      // a small wave across the bottom of the screen when a feeling comes home
      if (S.ripple > 0 && !S.reduce) {
        const q = 1 - S.ripple / 1.1, a = Math.sin(Math.PI * q) * .55;
        ctx.strokeStyle = S.rippleColor; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.beginPath();
        for (let x = 0; x <= W; x += 24) { const yy = H - 14 + Math.sin(x * .03 - q * 14) * 6 * (1 - q); if (x) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
    // the HUD gauge: a little wave icon and a bar, coloured by the feeling most still out tonight
    drawGauge(ctx, xRight, y, font) {
      if (!S.active) return;
      const v = api.value(), w = 132, h = 28, x = xRight - w, col = COLORS[S.lead] || '#8fe0c8';
      ctx.save();
      ctx.fillStyle = 'rgba(43,37,72,.88)'; ctx.strokeStyle = 'rgba(214,195,255,.58)'; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 12); else ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
      // wave icon
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const px = x + 9 + i, py = y + h / 2 + Math.sin(i * .9 + (S.reduce ? 0 : S.t * 3)) * 3; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      // bar
      const bx = x + 30, bw = w - 40, by = y + 16;
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(bx, by, bw, 8);
      ctx.fillStyle = col; ctx.fillRect(bx, by, Math.max(2, bw * v), 8);
      ctx.font = `700 9px ${font || 'system-ui, sans-serif'}`; ctx.textAlign = 'left'; ctx.fillStyle = '#f6eedc';
      ctx.fillText(v > .66 ? 'HIGH TIDE' : v > .33 ? 'MOOD TIDE' : 'CALM TIDE', bx, y + 12);
      ctx.restore();
    },
    // shimmer above a tide-pool keepsake while the tide is still too high to reach it
    drawPoolHint(ctx, x, y, t) {
      const p = S.reduce ? .7 : .5 + .5 * Math.sin(t * 3);
      ctx.save(); ctx.globalAlpha = .35 + .35 * p; ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(x, y + 18, 16 + k * 9 + p * 3, 4 + k * 2, 0, 0, 6.283); ctx.stroke(); }
      ctx.fillStyle = '#e8f6ff'; for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 12, y + 4 + Math.sin(a * 1.3) * 6, 1.6, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
  };
  root.TCMoodTide = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
