/* Hand-drawn (in code) art for the 41 mixed Moodlings of the Heart Workshop.
   Every feeling gets its own body shape, colours, face and one prop that shows what it is,
   in the same soft, round, sticker-like style as the night Moodlings. */
(function (root) {
  'use strict';
  const INK = '#30234c', BLUSH = '#ff8fae';
  let uid = 0;
  const shade = (hex, k) => {           // k < 0 darker, k > 0 lighter
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return '#' + c.map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
  };

  // ---------- body shapes (viewBox 0 0 100 100, body centred near 50,58) ----------
  const B = {
    round: () => '<ellipse cx="50" cy="58" rx="31" ry="29"/>',
    tall: () => '<ellipse cx="50" cy="56" rx="27" ry="33"/>',
    squish: () => '<ellipse cx="50" cy="63" rx="34" ry="24"/>',
    drop: () => '<path d="M50 20C62 36 80 47 80 64a30 30 0 0 1-60 0C20 47 38 36 50 20Z"/>',
    heart: () => '<path d="M50 88C28 74 16 60 16 46c0-11 8-19 18-19 7 0 12 4 16 10 4-6 9-10 16-10 10 0 18 8 18 19 0 14-12 28-34 42Z"/>',
    star: () => '<path d="M50 22l9 20 22 3-16 15 4 22-19-11-19 11 4-22-16-15 22-3Z" stroke-linejoin="round" stroke-width="9"/>',
    flame: () => '<path d="M50 16c6 12 22 20 26 38 4 18-8 34-26 34S20 72 24 54c2-10 10-14 12-24 4 6 6 10 8 12 2-8 2-16 6-26Z"/>',
    cloud: () => '<path d="M28 82a16 16 0 0 1-4-31 18 18 0 0 1 26-18 17 17 0 0 1 28 10 15 15 0 0 1-2 39Z"/>',
    egg: () => '<path d="M50 22c18 0 30 24 30 42a30 26 0 0 1-60 0c0-18 12-42 30-42Z"/>',
    bean: () => '<path d="M30 40c6-16 34-18 42-4 6 10-2 14 2 24 5 14-6 26-24 26-20 0-30-14-26-28 2-8 2-10 6-18Z"/>',
    house: () => '<path d="M24 52 50 28l26 24v26c0 7-5 10-12 10H36c-7 0-12-3-12-10Z" stroke-linejoin="round" stroke-width="6"/>',
    rock: () => '<path d="M22 70c-4-14 4-30 16-36 10-5 24-5 34 2 10 7 12 22 8 34-3 10-12 16-30 16-14 0-25-5-28-16Z"/>',
    bud: () => '<path d="M50 24c14 6 28 20 28 38a28 26 0 0 1-56 0c0-18 14-32 28-38Z"/>',
    sun: () => '<circle cx="50" cy="57" r="28"/>',
    pot: () => '<path d="M28 50h44l-5 32c-1 5-5 8-10 8H43c-5 0-9-3-10-8Z" stroke-linejoin="round" stroke-width="5"/>',
  };

  // ---------- faces ----------
  const eye = {
    dot: (x, y, s = 1) => `<ellipse cx="${x}" cy="${y}" rx="${3.6 * s}" ry="${4.6 * s}" fill="${INK}"/><circle cx="${x + 1.3 * s}" cy="${y - 1.6 * s}" r="${1.4 * s}" fill="#fff"/>`,
    big: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="5.4" ry="6.6" fill="${INK}"/><circle cx="${x + 1.8}" cy="${y - 2.4}" r="2.2" fill="#fff"/><circle cx="${x - 1.6}" cy="${y + 2.2}" r="1" fill="#fff"/>`,
    happy: (x, y) => `<path d="M${x - 4.5} ${y + 1.5}Q${x} ${y - 5} ${x + 4.5} ${y + 1.5}" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    closed: (x, y) => `<path d="M${x - 4.5} ${y - 1}Q${x} ${y + 4.5} ${x + 4.5} ${y - 1}" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    star: (x, y) => `<path d="M${x} ${y - 6}l1.8 4.2 4.4.5-3.3 3 .9 4.4-3.8-2.3-3.8 2.3.9-4.4-3.3-3 4.4-.5Z" fill="${INK}"/><circle cx="${x + .8}" cy="${y - 1.2}" r="1" fill="#fff"/>`,
    heart: (x, y) => `<path d="M${x} ${y + 4.5}c-4-3-6-5-6-7.5 0-2 1.5-3.5 3.2-3.5 1.3 0 2.2.8 2.8 1.8.6-1 1.5-1.8 2.8-1.8 1.7 0 3.2 1.5 3.2 3.5 0 2.5-2 4.5-6 7.5Z" fill="#ff5d8a"/>`,
    wink: (x, y) => `<path d="M${x - 4.5} ${y}h9" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    half: (x, y) => `<path d="M${x - 4.5} ${y - 1}h9" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M${x - 3.6} ${y - .4}a3.6 3.4 0 0 0 7.2 0Z" fill="${INK}"/>`,
    side: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="4.6" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 2}" r="1.3" fill="#fff"/>`,
    wide: (x, y) => `<circle cx="${x}" cy="${y}" r="5.2" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${x}" cy="${y + .6}" r="2.6" fill="${INK}"/>`,
    spiral: (x, y) => `<path d="M${x} ${y}m-1 0a1 1 0 1 1 2 0 2.4 2.4 0 1 1-4.6-.6 3.8 3.8 0 1 1 7.4 1" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  };
  const mouth = {
    smile: (x, y, w = 6) => `<path d="M${x - w} ${y}Q${x} ${y + w * .9} ${x + w} ${y}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    open: (x, y, w = 7) => `<path d="M${x - w} ${y - 1}Q${x} ${y + w * 1.4} ${x + w} ${y - 1}Z" fill="${INK}"/><path d="M${x - w * .45} ${y + w * .6}Q${x} ${y + w * .2} ${x + w * .45} ${y + w * .6}Q${x} ${y + w * 1} ${x - w * .45} ${y + w * .6}Z" fill="#ff7d9b"/>`,
    o: (x, y, r = 2.8) => `<ellipse cx="${x}" cy="${y + 1}" rx="${r}" ry="${r * 1.2}" fill="${INK}"/>`,
    small: (x, y) => `<path d="M${x - 3} ${y}Q${x} ${y + 3} ${x + 3} ${y}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    wavy: (x, y) => `<path d="M${x - 6} ${y + 1}q1.5-3 3 0t3 0 3 0 3 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    flat: (x, y) => `<path d="M${x - 4} ${y + 1}h8" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    pout: (x, y) => `<path d="M${x - 5} ${y + 3}Q${x} ${y - 2} ${x + 5} ${y + 3}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    cat: (x, y) => `<path d="M${x - 5} ${y}q2.5 3 5 0q2.5 3 5 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    tongue: (x, y) => `<path d="M${x - 6} ${y}Q${x} ${y + 6} ${x + 6} ${y}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M${x} ${y + 2.6}c0 4 5 5 5 1v-2.4" fill="#ff7d9b" stroke="${INK}" stroke-width="1.6"/>`,
    grin: (x, y, w = 7) => `<path d="M${x - w} ${y - 1}Q${x} ${y + w * 1.1} ${x + w} ${y - 1}Z" fill="#fff" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`,
  };
  const cheeks = (y = 64, dx = 17, a = .55, cx = 50) => `<ellipse cx="${cx - dx}" cy="${y}" rx="5" ry="3.2" fill="${BLUSH}" opacity="${a}"/><ellipse cx="${cx + dx}" cy="${y}" rx="5" ry="3.2" fill="${BLUSH}" opacity="${a}"/>`;
  const twoEyes = (kind, y = 54, dx = 11, cx = 50) => eye[kind](cx - dx, y) + eye[kind](cx + dx, y);
  const sparkle = (x, y, s = 1, c = '#fff3b0') => `<path d="M${x} ${y - 6 * s}l${1.5 * s} ${4.5 * s} ${4.5 * s} ${1.5 * s}-${4.5 * s} ${1.5 * s}-${1.5 * s} ${4.5 * s}-${1.5 * s}-${4.5 * s}-${4.5 * s}-${1.5 * s} ${4.5 * s}-${1.5 * s}Z" fill="${c}"/>`;
  const miniHeart = (x, y, s = 1, c = '#ff6b93') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-5 2.6-7 .4-7-2.4-7-4.6-5.4-6-3.6-6-2.2-6-1-5.1 0-4c1-1.1 2.2-2 3.6-2C5.4-6 7-4.6 7-2.4 7 .4 5 2.6 0 6Z" fill="${c}"/>`;
  const arm = (x1, y1, x2, y2, c) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${y1 + 6} ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
  const feet = c => `<ellipse cx="38" cy="87" rx="7" ry="3.6" fill="${c}"/><ellipse cx="62" cy="87" rx="7" ry="3.6" fill="${c}"/>`;

  // ---------- the 41 designs: [colour, colour2, shape, draw-before-body, draw-after-body] ----------
  // Each "face" function returns the eyes/mouth/props drawn on top of the body.
  const D = {
    // ---- layer 1: two night feelings meet ----
    'Anticipation': ['#c9a8ff', '#ffe27a', 'round', '',
      d => twoEyes('big', 53) + mouth.o(50, 66) + cheeks(63) +
        // butterflies in the tummy, fluttering out
        [[82, 26, 1.5, '#ffd34d'], [16, 36, 1.1, '#ff9fd0'], [70, 12, .9, '#9fd8ff']].map(([x, y, k, c]) => `<g transform="translate(${x} ${y}) scale(${k}) rotate(-12)" fill="${c}" stroke="${INK}" stroke-width="1"><path d="M0 0c-5-7-12-4-9 2 3 5 8 3 9-2Zm0 0c5-7 12-4 9 2-3 5-8 3-9-2Z"/><path d="M0 0c-3 4-7 7-5 9 2 1 4-3 5-9Zm0 0c3 4 7 7 5 9-2 1-4-3-5-9Z"/><path d="M0-3v7" stroke-width="1.6"/></g>`).join('')],
    'Peaceful': ['#8fd3e8', '#9be8c4', 'drop', `<ellipse cx="50" cy="90" rx="32" ry="6" fill="#7fd6c0" opacity=".45"/><ellipse cx="50" cy="90" rx="42" ry="8" fill="none" stroke="#bff3e3" stroke-width="1.5" opacity=".6"/>`,
      d => twoEyes('closed', 60) + mouth.smile(50, 69, 5) + cheeks(67) + `<text x="72" y="30" font-size="11" font-weight="700" fill="#e4f7ff" font-family="sans-serif">z</text><text x="80" y="22" font-size="8" font-weight="700" fill="#e4f7ff" font-family="sans-serif">z</text>`],
    'Determined': ['#ff8a7a', '#8fe0b0', 'star', '',
      d => `<path d="M24 44Q50 34 76 44l-1 7Q50 42 25 51Z" fill="#e8434f"/><path d="M75 44l9-4-3 7 6 3-9 1Z" fill="#e8434f"/>` +
        `<path d="M36 52l9 3M64 52l-9 3" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` + twoEyes('dot', 58, 10) + mouth.flat(50, 68) + `<path d="M22 72a7 7 0 1 1 1 0" fill="${d.c2}" stroke="${INK}" stroke-width="1.5"/>`],
    'Brave': ['#ff9ccb', '#ffd75e', 'round', `<path d="M24 44Q12 70 20 90L50 80 80 90Q88 70 76 44Z" fill="#ff5d6c"/>${sparkle(28, 80, .6)}`,
      d => `<g fill="#ffb3d6">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="22" rx="7" ry="10" transform="rotate(${a - 36} 50 34)"/>`).join('')}</g><circle cx="50" cy="31" r="5" fill="#ffd75e"/>` +
        twoEyes('dot', 56) + mouth.open(50, 66, 6) + cheeks(64) + `<path d="M50 74l2.4 5 5.4.6-4 3.6 1.2 5.4-5-2.8-5 2.8 1.2-5.4-4-3.6 5.4-.6Z" fill="#ffd75e" stroke="${INK}" stroke-width="1"/>`],
    'Admiration': ['#ffc6a1', '#ffe0b8', 'round', '',
      d => twoEyes('star', 54) + mouth.o(50, 66, 2.6) + cheeks(63, 18, .75) +
        `<rect x="62" y="64" width="22" height="18" rx="2" fill="#fff6e4" stroke="#c9945b" stroke-width="3"/><path d="M65 79l5-6 4 4 3-3 4 5Z" fill="#7cc9a0"/><circle cx="78" cy="69" r="2" fill="#ffcd4d"/>` + arm(70, 70, 66, 74, d.c)],
    'Relief': ['#c4b1ff', '#a6ecd0', 'squish', '',
      d => twoEyes('closed', 60, 12) + mouth.small(50, 70) + cheeks(68, 19) +
        `<path d="M70 66c6-2 10 0 10 4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><g fill="#fff" opacity=".85"><circle cx="84" cy="66" r="4.5"/><circle cx="90" cy="60" r="3.5"/><circle cx="92" cy="68" r="3"/></g>`],
    'Embarrassed': ['#ffa6c9', '#c9b1ff', 'round', '',
      d => twoEyes('happy', 52) + mouth.wavy(50, 66) + `<ellipse cx="33" cy="61" rx="8" ry="5" fill="#ff5d8a" opacity=".75"/><ellipse cx="67" cy="61" rx="8" ry="5" fill="#ff5d8a" opacity=".75"/>` +
        `<ellipse cx="31" cy="66" rx="7" ry="6" fill="${shade(d.c, .2)}" stroke="${shade(d.c, -.25)}" stroke-width="1.6"/><ellipse cx="69" cy="66" rx="7" ry="6" fill="${shade(d.c, .2)}" stroke="${shade(d.c, -.25)}" stroke-width="1.6"/>` +
        `<path d="M40 22q-3-5 0-9M50 20q-3-5 0-9M60 22q-3-5 0-9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`],
    'Grumpy': ['#ff8d5c', '#ff6b6b', 'round', `<g fill="#7a7396"><circle cx="40" cy="16" r="8"/><circle cx="52" cy="12" r="10"/><circle cx="63" cy="17" r="7"/><rect x="34" y="16" width="34" height="8" rx="4"/></g><path d="M52 24l-4 7h5l-3 7" fill="none" stroke="#ffd34d" stroke-width="2.4" stroke-linejoin="round"/>`,
      d => `<path d="M34 47l11 4M66 47l-11 4" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>` + twoEyes('half', 55, 11) + mouth.pout(50, 67) +
        `<path d="M28 72Q50 82 72 72" fill="none" stroke="${shade(d.c, -.25)}" stroke-width="7" stroke-linecap="round"/><path d="M30 75Q50 70 70 75" fill="none" stroke="${shade(d.c, .15)}" stroke-width="6" stroke-linecap="round"/>`],
    'Nostalgia': ['#e8c48f', '#f5a98a', 'round', '',
      d => twoEyes('closed', 55) + mouth.smile(50, 65, 5) + cheeks(63) +
        `<g transform="rotate(-10 72 72)"><rect x="60" y="60" width="24" height="26" rx="1.5" fill="#fff8ea" stroke="#b08a5c" stroke-width="1.5"/><rect x="63" y="63" width="18" height="15" fill="#c9a77b"/><circle cx="69" cy="69" r="2.6" fill="#f6e3c0"/><circle cx="75" cy="70" r="2.6" fill="#f6e3c0"/></g>` + arm(68, 72, 62, 76, d.c) + sparkle(22, 30, .7, '#ffe9b0')],
    'Hopeful': ['#d9a874', '#ffd27a', 'bud', `<path d="M50 24V10" stroke="#5fae7a" stroke-width="3" stroke-linecap="round"/><path d="M50 14c-8-6-14-2-14 2 6 2 10 2 14-2Zm0-2c6-7 13-5 14-1-5 3-9 3-14 1Z" fill="#7ccf8e"/><circle cx="50" cy="8" r="6" fill="#ffe58a"/><circle cx="50" cy="8" r="11" fill="#ffe58a" opacity=".25"/>`,
      d => twoEyes('big', 58, 11) + mouth.small(50, 70) + cheeks(67)],
    'Curious': ['#ffe066', '#9fe3b5', 'round', `<path d="M50 30q-2-10 6-14 6-3 9 2" fill="none" stroke="#c9a23a" stroke-width="2.6" stroke-linecap="round"/><circle cx="66" cy="18" r="3.4" fill="#9fe3b5"/>`,
      d => eye.dot(39, 54) + `<circle cx="62" cy="54" r="11" fill="#e8fbff" fill-opacity=".55" stroke="#8b6a3d" stroke-width="3.4"/>` + eye.big(62, 54) + `<path d="M70 62l12 12" stroke="#8b6a3d" stroke-width="5" stroke-linecap="round"/>` + mouth.o(48, 68, 2.4) + cheeks(65, 18)],
    'Tender': ['#ffb7d2', '#a9ecd1', 'bud', `<path d="M50 26c-6-8-2-14 0-16 2 2 6 8 0 16Z" fill="#ffd0e3"/>`,
      d => twoEyes('closed', 56) + mouth.small(50, 66) + cheeks(64) + `<path d="M36 76Q50 86 64 76" fill="none" stroke="${shade(d.c, -.2)}" stroke-width="6" stroke-linecap="round"/>` + miniHeart(50, 74, .9, '#ff6b93') + sparkle(76, 34, .55)],
    'Restless': ['#b494ff', '#ff7b7b', 'round', `<path d="M10 70h10M8 78h12M12 62h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
      d => `<path d="M22 40l6-8 4 7 6-10 5 8 7-9 5 9 7-8 4 8 6-7" fill="${d.c}" stroke="${shade(d.c, -.25)}" stroke-width="2" stroke-linejoin="round"/>` + twoEyes('wide', 54) + mouth.wavy(50, 68) + `<path d="M34 87l-6 3M66 87l6 3" stroke="${shade(d.c, -.3)}" stroke-width="5" stroke-linecap="round"/>`],
    'Wistful': ['#9cc4ff', '#ffb3d6', 'drop', `<path d="M76 50Q82 30 80 16" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".6"/><ellipse cx="80" cy="12" rx="8" ry="10" fill="#ff9fc3"/><path d="M80 22l-2 3h4Z" fill="#ff9fc3"/>`,
      d => eye.side(43, 60) + eye.side(61, 58) + mouth.small(54, 71) + cheeks(68, 16, .5, 52) + `<path d="M40 66q-2 4 0 6 2-2 0-6Z" fill="#c7ecff"/>` + arm(72, 64, 76, 52, d.c)],
    'Vulnerable': ['#e5c79f', '#ffb0cf', 'tall', '',
      d => twoEyes('dot', 46, 10) + mouth.small(50, 56) + `<ellipse cx="38" cy="53" rx="4" ry="2.6" fill="${BLUSH}" opacity=".6"/><ellipse cx="62" cy="53" rx="4" ry="2.6" fill="${BLUSH}" opacity=".6"/>` +
        `<path d="M16 62l8-6 7 7 8-8 8 7 7-7 8 8 7-7 8 6 7-4V78c0 9-14 14-34 14S16 87 16 78Z" fill="#fffaf0" stroke="#d9c6a8" stroke-width="2" stroke-linejoin="round"/><path d="M28 74l6 4M66 80l5-5" stroke="#d9c6a8" stroke-width="1.6" stroke-linecap="round"/>`],
    'Inspired': ['#ffd84d', '#fff2a8', 'round', `<circle cx="50" cy="16" r="14" fill="#fff3a0" opacity=".35"/><path d="M42 18a8 8 0 1 1 16 0c0 4-3 6-3 9h-10c0-3-3-5-3-9Z" fill="#fff8c4" stroke="${INK}" stroke-width="1.6"/><path d="M45 29h10M46 32h8" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M38 8l-4-4M62 8l4-4M50 2V-2" stroke="#ffe37a" stroke-width="2" stroke-linecap="round"/>`,
      d => twoEyes('star', 56) + mouth.open(50, 66, 7) + cheeks(65) + `<g transform="rotate(35 78 74)"><rect x="74" y="60" width="7" height="24" rx="1" fill="#ffb347"/><path d="M74 84l3.5 7 3.5-7Z" fill="#f5d6a8"/><path d="M76.5 89l1 2 1-2Z" fill="${INK}"/><rect x="74" y="58" width="7" height="4" fill="#ff8fb1"/></g>`],
    'Patient': ['#b98f65', '#8ed9a4', 'pot', `<path d="M50 50V28" stroke="#4f9e6b" stroke-width="3" stroke-linecap="round"/><path d="M50 36c-10-8-18-3-18 2 8 3 13 3 18-2Zm0-4c8-9 16-6 17-1-6 4-12 4-17 1Z" fill="#8ed9a4"/>`,
      d => `<rect x="25" y="46" width="50" height="9" rx="4" fill="${shade(d.c, -.18)}"/>` + twoEyes('closed', 66, 10) + mouth.smile(50, 74, 4.5) + cheeks(72, 16)],
    'Playful': ['#ffbe55', '#ff8f5c', 'bean', '',
      d => eye.wink(40, 54) + eye.big(60, 53) + mouth.tongue(50, 66) + cheeks(64) +
        `<circle cx="84" cy="80" r="9" fill="#5fc2ff" stroke="${INK}" stroke-width="1.5"/><path d="M75 80h18M84 71c-4 6-4 12 0 18" fill="none" stroke="#fff" stroke-width="2"/><path d="M78 92q6 2 12 0" stroke="${INK}" stroke-width="1" opacity=".3"/>`],

    // ---- layer 2: feelings that grow from feelings ----
    'Confident': ['#ff9e6b', '#ffd34d', 'tall', '',
      d => twoEyes('half', 46, 10) + mouth.smile(53, 58, 6) + cheeks(55, 16) +
        `<path d="M30 70h40l-4 6H34Z" fill="${shade(d.c, -.18)}"/><path d="M44 66l6 12 6-12" fill="#5fa8ff"/><circle cx="50" cy="80" r="7" fill="#ffd34d" stroke="#c78b1f" stroke-width="2"/><path d="M50 76l1.4 2.8 3 .4-2.2 2 .6 3-2.8-1.4-2.8 1.4.6-3-2.2-2 3-.4Z" fill="#fff6c4"/>` + sparkle(80, 30, .7)],
    'Grateful': ['#a8ead8', '#ffc9a8', 'round', '',
      d => twoEyes('happy', 52) + mouth.smile(50, 63, 6) + cheeks(61, 18, .7) +
        `<path d="M34 76Q42 68 50 76Q58 68 66 76" fill="none" stroke="${shade(d.c, -.2)}" stroke-width="6" stroke-linecap="round"/>` + miniHeart(50, 74, 1.1, '#ff6b93') + miniHeart(78, 30, .6, '#ffb3c8') + miniHeart(22, 36, .5, '#ffb3c8')],
    'Joy': ['#ffd84d', '#ffb347', 'sun', `<g stroke="#ffcf3d" stroke-width="5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M50 20V12" transform="rotate(${a} 50 57)"/>`).join('')}</g>`,
      d => twoEyes('happy', 52) + mouth.open(50, 62, 9) + cheeks(62, 19, .8) +
        `<g><rect x="14" y="22" width="5" height="3" fill="#ff6b93" transform="rotate(30 16 23)"/><rect x="82" y="40" width="5" height="3" fill="#5fc2ff" transform="rotate(-20 84 41)"/><rect x="80" y="18" width="5" height="3" fill="#8fe39a"/><circle cx="16" cy="48" r="2" fill="#b494ff"/></g>`],
    'Friendship': ['#8fc4ff', '#b8d8ff', 'round', '',
      d => twoEyes('happy', 54, 10, 42) + mouth.smile(42, 64, 5) + cheeks(62, 15, .6, 42) +
        `<g transform="translate(78 70)"><ellipse cx="0" cy="8" rx="15" ry="14" fill="#ffc2dc" stroke="#e58cb3" stroke-width="2"/><ellipse cx="-4" cy="2" rx="5" ry="3" fill="#fff" opacity=".4"/><circle cx="-5" cy="7" r="2" fill="${INK}"/><circle cx="5" cy="7" r="2" fill="${INK}"/><path d="M-3 12q3 3 6 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="-9" cy="11" rx="2.6" ry="1.6" fill="${BLUSH}" opacity=".7"/></g>` +
        `<path d="M64 74q4 4 9 2" fill="none" stroke="${shade(d.c, -.15)}" stroke-width="6" stroke-linecap="round"/>` + miniHeart(68, 46, .55, '#ff8fb1')],
    'Kindness': ['#9fe6c4', '#ffb3cf', 'round', '',
      d => twoEyes('closed', 54) + mouth.smile(48, 64, 5) + cheeks(62) + arm(64, 70, 78, 60, d.c) +
        `<path d="M80 60V46" stroke="#5fae7a" stroke-width="2"/><g fill="#ff9fc3">${[0, 72, 144, 216, 288].map(a => `<circle cx="80" cy="38" r="4" transform="rotate(${a} 80 43)"/>`).join('')}</g><circle cx="80" cy="43" r="3" fill="#ffd75e"/>`],
    'Courage': ['#b48cff', '#ff9a4d', 'flame', '',
      d => `<path d="M38 50l8 3M62 50l-8 3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` + twoEyes('dot', 58, 10) + mouth.smile(50, 68, 4.5) + `<path d="M70 46q2 4 0 6-2-2 0-6Z" fill="#c7ecff"/>` +
        `<path d="M14 62h20v10c0 8-6 12-10 14-4-2-10-6-10-14Z" fill="#ffd34d" stroke="#c78b1f" stroke-width="2"/>` + miniHeart(24, 72, .7, '#ff6b6b')],
    'Trust': ['#f3d6b8', '#ffb3cf', 'egg', '',
      d => twoEyes('closed', 56) + mouth.small(50, 66) + cheeks(64) +
        `<path d="M50 88c-8-6-12-10-12-15 0-4 3-7 6.4-7 2.6 0 4.4 1.6 5.6 3.6 1.2-2 3-3.6 5.6-3.6 3.4 0 6.4 3 6.4 7 0 5-4 9-12 15Z" fill="#ff8fb1" stroke="${INK}" stroke-width="1.4"/><rect x="45.5" y="71" width="9" height="8" rx="1.6" fill="#ffd34d"/><path d="M47.5 71v-3a2.5 2.5 0 0 1 5 0v3" fill="none" stroke="#ffd34d" stroke-width="1.8"/>`],
    'Belonging': ['#7fd1c9', '#9ec4ff', 'house', `<rect x="62" y="28" width="7" height="12" fill="#c98a6a"/><circle cx="66" cy="22" r="3" fill="#fff" opacity=".6"/><circle cx="70" cy="15" r="4" fill="#fff" opacity=".45"/>`,
      d => `<path d="M20 54 50 26l30 28" fill="none" stroke="#e47a6a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` + twoEyes('happy', 58, 10) + mouth.smile(50, 68, 5) + cheeks(66, 16) +
        `<rect x="44" y="34" width="12" height="10" rx="2" fill="#ffe6a0" stroke="${shade(d.c, -.3)}" stroke-width="1.4"/><path d="M50 34v10M44 39h12" stroke="${shade(d.c, -.3)}" stroke-width="1.2"/>`],
    'Forgiveness': ['#ffb27a', '#ffd9a0', 'round', `<path d="M14 40a24 24 0 0 1 40-18" fill="none" stroke="#ff8fa3" stroke-width="3"/><path d="M17 41a21 21 0 0 1 35-16" fill="none" stroke="#ffd34d" stroke-width="3"/><path d="M20 42a18 18 0 0 1 30-14" fill="none" stroke="#8fe39a" stroke-width="3"/><path d="M23 43a15 15 0 0 1 25-12" fill="none" stroke="#7cc6ff" stroke-width="3"/>`,
      d => twoEyes('closed', 55) + mouth.smile(50, 66, 5) + cheeks(64) +
        `<g transform="rotate(-25 70 60)"><rect x="62" y="56" width="16" height="7" rx="3.5" fill="#ffe0c2" stroke="#d9a77d" stroke-width="1"/><rect x="67" y="56" width="6" height="7" fill="#f5c9a0"/></g>` + arm(30, 70, 22, 60, d.c) + arm(70, 70, 78, 60, d.c)],
    'Empathy': ['#a8c8ff', '#ffc2dc', 'round', `<ellipse cx="32" cy="24" rx="7" ry="16" fill="#a8c8ff" transform="rotate(-18 32 24)"/><ellipse cx="32" cy="25" rx="3.6" ry="11" fill="#ffc2dc" transform="rotate(-18 32 25)"/><ellipse cx="68" cy="24" rx="7" ry="16" fill="#a8c8ff" transform="rotate(18 68 24)"/><ellipse cx="68" cy="25" rx="3.6" ry="11" fill="#ffc2dc" transform="rotate(18 68 25)"/>`,
      d => twoEyes('dot', 56, 11) + mouth.small(50, 67) + cheeks(65) + miniHeart(50, 80, 1, '#ff8fb1')],
    'Creativity': ['#ff9fd0', '#7cd7ff', 'cloud', `<ellipse cx="50" cy="26" rx="22" ry="7" fill="#7a5cff"/><circle cx="50" cy="20" r="3" fill="#7a5cff"/>`,
      d => `<circle cx="30" cy="70" r="4" fill="#ffd34d"/><circle cx="68" cy="74" r="5" fill="#8fe39a"/><circle cx="60" cy="44" r="3.4" fill="#7cd7ff"/><circle cx="36" cy="46" r="3" fill="#ff6b6b"/>` +
        twoEyes('big', 58, 11) + mouth.open(50, 68, 6) +
        `<g transform="rotate(-30 84 64)"><rect x="82" y="50" width="4" height="22" rx="2" fill="#c98a5a"/><path d="M81 50h6l-1-6c0-3-4-3-4 0Z" fill="#ff6b93"/></g>`],
    'Resilience': ['#a9b7a0', '#d6c7b8', 'rock', `<path d="M50 34V18" stroke="#4f9e6b" stroke-width="3" stroke-linecap="round"/><path d="M50 24c-8-7-15-3-15 1 7 3 11 3 15-1Zm0-3c7-8 14-6 15-1-6 4-10 4-15 1Z" fill="#7ccf8e"/><circle cx="50" cy="16" r="3.4" fill="#ff9a8a"/>`,
      d => `<path d="M30 46l6 6-3 6" fill="none" stroke="${shade(d.c, -.3)}" stroke-width="1.6"/>` + twoEyes('dot', 60) + mouth.smile(50, 70, 5) + cheeks(68) +
        `<g transform="rotate(20 70 52)"><rect x="62" y="48" width="16" height="7" rx="3.5" fill="#ffe0c2"/><rect x="67" y="48" width="6" height="7" fill="#f5c9a0"/></g>`],
    'Delight': ['#ff9fc0', '#ffe066', 'bean', `${sparkle(16, 30, .8)}${sparkle(86, 22, .9)}${sparkle(84, 56, .5)}`,
      d => twoEyes('star', 54) + mouth.open(50, 64, 7) + cheeks(64, 18, .8) + `<path d="M20 88q4-4 8 0M72 88q4-4 8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`],
    'Acceptance': ['#d4b6ff', '#a8ecd2', 'round', '',
      d => `<g opacity=".55"><path d="M22 60h56" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M50 30v58" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 3"/></g><path d="M50 30a31 29 0 0 1 31 28H50Z" fill="#ffc6dc" opacity=".55"/><path d="M50 58v29a31 29 0 0 1-31-29Z" fill="#fff0a8" opacity=".55"/>` +
        twoEyes('closed', 52) + mouth.smile(50, 63, 6) + cheeks(61) + arm(22, 64, 8, 52, d.c) + arm(78, 64, 92, 52, d.c)],
    'Aspiration': ['#8fd0ff', '#ffe58a', 'round', `<path d="M66 50Q76 30 80 14" fill="none" stroke="${INK}" stroke-width="1" opacity=".55"/><path d="M80 2l8 10-8 10-8-10Z" fill="#ffd34d" stroke="#c78b1f" stroke-width="1.4"/><path d="M80 22q-4 4 0 8 4 4 0 8" fill="none" stroke="#ff8fb1" stroke-width="1.6"/>`,
      d => eye.side(42, 52) + eye.side(60, 50) + mouth.small(52, 64) + cheeks(62) + arm(62, 64, 66, 50, d.c) + sparkle(24, 24, .7)],

    // ---- layer 3: the deep feelings (they glow) ----
    'Happiness': ['#ffd65c', '#ffb36b', 'sun', `<g fill="#fff3a0" opacity=".9">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<path d="M50 18l3 8h-6Z" transform="rotate(${a} 50 57)"/>`).join('')}</g>`,
      d => `<g>${[-24, -12, 0, 12, 24].map((dx, i) => `<circle cx="${50 + dx}" cy="${33 + Math.abs(dx) * .18}" r="5" fill="${['#ff8fb1', '#fff', '#ff6b93', '#fff', '#ff8fb1'][i]}"/>`).join('')}<circle cx="50" cy="33" r="2" fill="#ffd34d"/></g>` +
        twoEyes('happy', 54) + mouth.open(50, 64, 9) + cheeks(64, 19, .85)],
    'Love': ['#ff7fa8', '#ffc0d6', 'heart', `<path d="M14 48c-10-6-10-18 0-18 4 0 6 4 6 8M86 48c10-6 10-18 0-18-4 0-6 4-6 8" fill="#ffe3ee" opacity=".9"/>`,
      d => twoEyes('closed', 52, 11) + mouth.smile(50, 62, 5) + cheeks(60, 18, .8) + miniHeart(22, 20, .7, '#ff9fbf') + miniHeart(80, 16, .55, '#ffc0d6') + miniHeart(86, 34, .4, '#ff9fbf')],
    'Pride': ['#b28cff', '#ffd34d', 'tall', `<path d="M74 60V10" stroke="#8b6a3d" stroke-width="3" stroke-linecap="round"/><path d="M75 11h18l-5 6 5 6H75Z" fill="#ff6b6b"/>${sparkle(84, 16, .35)}`,
      d => twoEyes('happy', 48, 10) + mouth.open(50, 58, 6) + cheeks(57, 16) + `<path d="M36 72l14 6 14-6" fill="none" stroke="#ffd34d" stroke-width="3" stroke-linecap="round"/>` + arm(70, 62, 74, 52, d.c)],
    'Wonder': ['#5a6cd8', '#9b7bff', 'round', '',
      d => `<g fill="#fff">${[[34, 40, 1.4], [62, 38, 1], [70, 70, 1.6], [30, 74, 1], [54, 82, 1.2], [40, 30, .8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><path d="M66 30a8 8 0 1 0 6 10 6 6 0 1 1-6-10Z" fill="#ffe58a"/>` +
        twoEyes('star', 56) + mouth.o(50, 68, 3) + cheeks(65, 18, .45) + sparkle(16, 22, .8) + sparkle(86, 82, .6)],
    'Compassion': ['#c9b2ff', '#a8ecd0', 'round', `<path d="M22 46c-14-6-16 10-8 16 6 4 10 0 12-4M78 46c14-6 16 10 8 16-6 4-10 0-12-4" fill="#f3f0ff"/><ellipse cx="50" cy="18" rx="16" ry="4" fill="none" stroke="#ffe58a" stroke-width="3"/>`,
      d => twoEyes('closed', 52) + mouth.smile(50, 62, 5) + cheeks(60) + `<circle cx="50" cy="78" r="10" fill="#fff6c4" opacity=".55"/>` + miniHeart(50, 78, 1, '#ff8fb1') + arm(32, 70, 42, 80, d.c) + arm(68, 70, 58, 80, d.c)],
    'Harmony': ['#8fe0c8', '#b49cff', 'round', '',
      d => `<path d="M50 29a29 29 0 0 1 0 58 14.5 14.5 0 0 1 0-29 14.5 14.5 0 0 0 0-29Z" fill="${d.c2}" opacity=".9"/>` +
        twoEyes('closed', 54) + mouth.small(50, 66) + cheeks(63) +
        `<g fill="#fff" opacity=".9"><path d="M14 30v12" stroke="#fff" stroke-width="1.8"/><ellipse cx="11.5" cy="42" rx="3.5" ry="2.6"/><path d="M84 22v12" stroke="#fff" stroke-width="1.8"/><path d="M84 22l8 2v4l-8-2" /><ellipse cx="81.5" cy="34" rx="3.5" ry="2.6"/></g>`],
    'Fulfilled': ['#ffb489', '#ffd6a0', 'round', '',
      d => twoEyes('happy', 52, 11, 42) + mouth.smile(42, 62, 6) + cheeks(60, 15, .7, 42) +
        `<path d="M66 92l6-30M88 92l-6-30M70 80h14" stroke="#a57145" stroke-width="2.6" stroke-linecap="round"/><rect x="62" y="40" width="30" height="26" rx="2" fill="#fffaf0" stroke="#a57145" stroke-width="2.4"/><path d="M66 60c6-12 10-4 14-10s6 2 8 8" fill="none" stroke="#7cc6ff" stroke-width="2"/><circle cx="72" cy="48" r="3" fill="#ffd34d"/>` + miniHeart(84, 50, .45)],

    // New Night Side faces. Full gameplay poses are drawn by game.js; these
    // named portraits share their palette and silhouette language with this art set.
    'Bored': ['#b9b4c8', '#d9d0e6', 'squish', '',
      d => twoEyes('closed', 58, 8) + mouth.o(50, 72, 4) + cheeks(62, 15, .35) + `<text x="73" y="30" font-size="11" font-weight="700" fill="#f3edff" font-family="sans-serif">z</text><text x="82" y="22" font-size="8" font-weight="700" fill="#f3edff" font-family="sans-serif">z</text>`],
    'Guilty': ['#59658f', '#9ca8d1', 'drop', '',
      d => twoEyes('dot', 54, 8) + mouth.wavy(50, 72) + cheeks(64, 15, .3) + `<path d="M77 29c7 10 8 14 3 17-6 2-9-3-5-8Z" fill="#bdeaff" stroke="${INK}" stroke-width="1.5"/>`],
    'Proud': ['#efa94e', '#ffd166', 'tall', '',
      d => `<path d="M33 34l5-14 12 9 12-9 5 14Z" fill="#ffd34d" stroke="#9a641c" stroke-width="2" stroke-linejoin="round"/>` + twoEyes('happy', 52, 9) + mouth.flat(50, 70) + cheeks(63, 15, .4)],

    // ---- layer 4 ----
    'Whole Heart': ['#ff8fb1', '#ffd34d', 'heart', `<g>${['#ff727d', '#b59aff', '#79c7ff', '#ff91c5', '#ffdc68', '#ffa569', '#c5a17a', '#83deb0', '#ffe99a'].map((c, i) => `<circle cx="${50 + Math.cos(i / 9 * 6.283 - 1.57) * 42}" cy="${56 + Math.sin(i / 9 * 6.283 - 1.57) * 42}" r="5" fill="${c}" stroke="#fff" stroke-width="1.4"/>`).join('')}</g>`,
      d => `<path d="M36 22l5 7 9-11 9 11 5-7 2 12H34Z" fill="#ffd34d" stroke="#c78b1f" stroke-width="1.6" stroke-linejoin="round"/><circle cx="50" cy="18" r="2" fill="#ff6b93"/>` +
        twoEyes('heart', 52, 11) + mouth.open(50, 64, 7) + cheeks(63, 19, .8)],
  };

  function svg(id, cls = 'feeling-face') {
    const def = D[id]; if (!def) return '';
    const [c, c2, shape, before, after] = def, k = ++uid, g = `mg${k}`;
    const deep = /^(Happiness|Love|Pride|Wonder|Compassion|Harmony|Fulfilled|Whole Heart)$/.test(id);
    const body = B[shape]();
    const bodyEl = `<g fill="url(#${g})" stroke="${shade(c, -.28)}" stroke-width="2.4">${body}</g>`;
    return `<svg class="${cls}" viewBox="-4 -6 108 108" aria-hidden="true">` +
      `<defs><radialGradient id="${g}" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="${shade(c, .35)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c2, .08)}"/></radialGradient>` +
      `<radialGradient id="${g}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${shade(c, .5)}" stop-opacity=".75"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>` +
      (deep ? `<circle cx="50" cy="55" r="52" fill="url(#${g}h)"/>` : '') +
      `<ellipse cx="50" cy="93" rx="24" ry="4" fill="#000" opacity=".16"/>` +
      (typeof before === 'function' ? before({ c, c2 }) : before) +
      bodyEl +
      `<ellipse cx="38" cy="40" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-25 38 40)"/>` +
      after({ c, c2 }) + `</svg>`;
  }
  root.TCMoodArt = { svg, has: id => !!D[id], color: id => D[id]?.[0] };
})(typeof window !== 'undefined' ? window : globalThis);
