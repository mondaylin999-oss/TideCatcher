/* TideCatcher authored level geometry. Coordinates are in canvas world units. */
(function (root) {
  'use strict';
  const hillBase = [[0,440],[330,440],[352,460],[600,460],[620,478],[880,478],[905,502],[1150,502],[1172,478],[1290,478],[1312,458],[1378,458],[1400,440]];
  const hillProfile = [];
  for (let repeat = 0; repeat < 3; repeat++) for (const [x,y] of hillBase) {
    const point = [x + repeat * 1400, y];
    if (hillProfile.length && hillProfile[hillProfile.length - 1][0] === point[0]) hillProfile[hillProfile.length - 1] = point;
    else hillProfile.push(point);
  }
  const ground = (width, points) => ({ points: [[0, points[0][1]], ...points.filter(p => p[0] > 0 && p[0] < width), [width, points[points.length - 1][1]]] });
  const platform = (x, y, w, type = 'static', extra = null) => extra ? [x, y, w, type, extra] : [x, y, w, type];
  const pagodaStepY = x => {
    const heights = [0, 10, 20, 30, 40, 50, 50, 50, 40, 30, 20, 10];
    const phase = ((x % 1200) + 1200) % 1200, index = Math.floor(phase / 100), within = phase % 100;
    const here = heights[index], next = heights[(index + 1) % heights.length];
    const rise = within < 78 ? here : here + (next - here) * ((within - 78) / 22);
    return 470 - rise;
  };
  const zones = (width, pits = []) => {
    const out = []; let left = 120;
    for (const [a,b] of pits.slice().sort((a,b) => a[0] - b[0])) { if (a - left > 180) out.push([left, a - 70]); left = b + 70; }
    if (width - 120 - left > 180) out.push([left, width - 120]);
    return out.length ? out : [[120, width - 120]];
  };
  // Stretch each authored pit against its one moving bridge, then move all
  // downstream geometry and markers with the shoreline so the level stays intact.
  const sizePitsByDifficulty = (level, ratio) => {
    if (!level.pits?.length) return level;
    const originalPits = level.pits.map(([a, b]) => [a, b]);
    const bridges = originalPits.map(([a, b]) => level.platforms.find(p => p[3] === 'moving'
      && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b));
    const pitWidths = bridges.map(bridge => Math.ceil(bridge[2] * ratio));
    const shiftX = x => {
      let offset = 0;
      for (let i = 0; i < originalPits.length; i++) {
        const [a, b] = originalPits[i], oldWidth = b - a, newWidth = pitWidths[i];
        if (x < a) return x + offset;
        if (x <= b) return a + offset + (x - a) * newWidth / oldWidth;
        offset += newWidth - oldWidth;
      }
      return x + offset;
    };
    const shiftedPits = originalPits.map(([a, b]) => [shiftX(a), shiftX(b)]);
    level.ground.points = level.ground.points.map(([x, y]) => [shiftX(x), y]);
    level.platforms = level.platforms.map(platform => {
      const bridgePitIndex = bridges.indexOf(platform);
      if (bridgePitIndex >= 0) {
        const [a, b] = shiftedPits[bridgePitIndex], width = platform[2];
        const path = platform[4].path;
        const start = Math.min(...path.map(([x]) => x));
        const end = Math.max(...path.map(([x]) => x));
        platform[0] = a;
        platform[4].path = path.map(([x, y]) => [
          start === end ? a : a + (x - start) * (b - width - a) / (end - start), y
        ]);
        return platform;
      }
      platform[0] = shiftX(platform[0]);
      if (platform[4]?.path) platform[4].path = platform[4].path.map(([x, y]) => [shiftX(x), y]);
      if (platform[4]?.anchor) platform[4].anchor = [shiftX(platform[4].anchor[0]), platform[4].anchor[1]];
      return platform;
    });
    level.pits = shiftedPits;
    level.checkpoints = level.checkpoints.map(shiftX);
    level.hideSpots = level.hideSpots.map(shiftX);
    level.burySpots = level.burySpots.map(shiftX);
    level.spawnZones = level.spawnZones.map(([a, b]) => [shiftX(a), shiftX(b)]);
    level.catStart = shiftX(level.catStart);
    level.homeLight[0] = shiftX(level.homeLight[0]);
    level.props = level.props.map(prop => ({
      ...prop,
      x: shiftX(prop.x),
      ...(prop.path ? { path: prop.path.map(([x, y]) => [shiftX(x), y]) } : {})
    }));
    level.width += pitWidths.reduce((total, width, i) => total + width - (originalPits[i][1] - originalPits[i][0]), 0);
    level.pitToBridgeRatio = ratio;
    return level;
  };
  const makeChallengeLevel = night => {
    const map = ['school', 'park', 'festival', 'rooftop', 'lake'][(night - 8) % 5];
    const pitCount = Math.min(18, 4 + Math.floor((night - 8) / 3));
    const bridgeWidth = 90, pitWidth = bridgeWidth * 5, safeRun = 440, firstPit = 680;
    const width = firstPit + pitCount * (pitWidth + safeRun) - safeRun + 700;
    const pits = [], checkpoints = [], platforms = [platform(280, 402, 130)];
    const groundPoints = [], hideSpots = [], burySpots = [], spawnZones = [];
    const bridgeSpeed = .36 + (night - 8) / 42 * .25;
    const skin = map === 'festival' ? 'boat' : map === 'lake' ? 'log' : '';
    for (let i = 0; i < pitCount; i++) {
      const a = firstPit + i * (pitWidth + safeRun), b = a + pitWidth;
      pits.push([a, b]); groundPoints.push([a, 470], [b, 470]);
      if (i % Math.max(1, 3 - Math.floor((night - 8) / 15)) === 0) checkpoints.push(a - 110);
      const lift = Math.min(22, Math.floor((night - 8) / 7) * 3) + (i % 3) * 3;
      platforms.push(platform(a, 438 - lift, bridgeWidth, 'moving', {
        path: [[a, 438 - lift], [b - bridgeWidth, 438 - lift + (i % 2 ? -8 : 0)]],
        speed: bridgeSpeed, ...(skin ? { skin } : {})
      }));
      const landX = b + 105;
      const roostType = night >= 14 && i % 3 === 1 ? 'crumbling' : night >= 20 && i % 4 === 2 ? 'bouncy' : 'static';
      platforms.push(platform(landX, 398 - Math.min(14, Math.floor((night - 8) / 10) * 2), 120, roostType));
      if (night >= 18 && i % 4 === 3) platforms.push(platform(b + 285, 430, 42, 'swinging', { anchor: [b + 315, 355], speed: .8 + (night - 18) / 160 }));
      hideSpots.push(b + 275); burySpots.push(b + 375);
      const nextA = i + 1 < pitCount ? firstPit + (i + 1) * (pitWidth + safeRun) : width;
      if (i === 0) spawnZones.push([120, a - 70]);
      spawnZones.push([b + 70, nextA - (i + 1 < pitCount ? 70 : 100)]);
    }
    // Wall-jump routes are collision scenery rather than roost platforms, so
    // they do not alter the rule that only pit nights contain roosts.
    const wallRoutes = {
      12: [{ x: 420, w: 54, h: 166 }, { x: 520, w: 58, h: 184 }],
      23: [{ x: 400, w: 58, h: 174 }, { x: 508, w: 62, h: 194 }],
      34: [{ x: 416, w: 62, h: 182 }, { x: 528, w: 66, h: 202 }],
      45: [{ x: 398, w: 66, h: 190 }, { x: 514, w: 70, h: 210 }],
      50: [{ x: 410, w: 70, h: 198 }, { x: 532, w: 74, h: 216 }]
    };
    return {
      night, map, width, pits, checkpoints, ground: ground(width, groundPoints), platforms,
      restSpots: map === 'rooftop' ? [220, ...checkpoints] : [],
      hideSpots, burySpots, spawnZones, catStart: 150, homeLight: [width - 150, 390], props: [], pitToBridgeRatio: 5,
      wallJumps: wallRoutes[night] || []
    };
  };
  const levels = {
    1: {
      night: 1, map: 'school', width: 2500, ground: ground(2500, [[0,470],[520,470],[560,462],[780,462],[820,470],[1450,470],[1490,458],[1710,458],[1750,470],[2500,470]]),
      platforms: [platform(300,405,130),platform(560,378,120),platform(850,414,130),platform(1190,382,130),platform(1530,408,130),platform(1870,378,130),platform(2190,410,130)],
      hideSpots: [420,970,1430,1980,2330], burySpots: [180,790,980,1320,1705,1940,2220,2400],
      spawnZones: [[260,2220]], catStart: 170, homeLight: [2400,390],
      props: [{kind:'desk',x:620,w:120},{kind:'chairs',x:1080,w:72},{kind:'desk',x:1740,w:130},{kind:'chairs',x:2110,w:72}]
    },
    2: {
      night: 2, map: 'school', width: 3300, pits: [[1160,1430]], checkpoints: [1040], ground: ground(3300, [[0,470],[680,470],[740,455],[920,455],[980,470],[1160,470],[1430,470],[1490,470],[1550,470],[2050,470],[2120,458],[2320,458],[2390,470],[3300,470]]),
      platforms: [platform(310,402,120),platform(560,365,126),platform(850,410,130),platform(1160,420,90,'moving',{path:[[1160,420],[1340,420]],speed:.62}),platform(1450,395,120),platform(1610,360,130),platform(1900,405,130),platform(2220,370,130),platform(2530,405,135),platform(2850,365,130),platform(3150,410,115)],
      hideSpots: [450,970,1490,1930,2520,3050], burySpots: [190,680,1010,1640,1690,1900,2460,2820,3190], spawnZones: zones(3300, [[1160,1430]]), catStart: 170, homeLight: [3190,385],
      props: [{kind:'desk',x:740,w:130},{kind:'chairs',x:1500,w:70},{kind:'desk',x:2010,w:130},{kind:'chairs',x:2690,w:70}]
    },
    3: {
      boss: { type: 'F', name: 'Storm Frustrated', phases: 3 },
      night: 3, map: 'park', width: 3600, pits: [[900,1200],[2380,2710]], checkpoints: [790,2280], ground: ground(3600, [[0,470],[300,448],[520,430],[760,454],[900,454],[1200,478],[1430,462],[1680,430],[1930,442],[2190,478],[2220,490],[2380,462],[2710,462],[2780,432],[3040,448],[3310,478],[3600,458]]),
      platforms: [platform(250,395,130),platform(520,360,125,'bouncy'),platform(750,398,120),platform(900,420,100,'moving',{path:[[900,420],[1100,410]],speed:.52}),platform(1220,375,130),platform(1430,350,132),platform(1740,390,128),platform(2050,420,132,'bouncy'),platform(2380,438,110,'moving',{path:[[2380,438],[2600,438]],speed:.52}),platform(2730,348,132),platform(2970,385,130),platform(3280,410,140)],
      hideSpots: [400,1300,1590,2180,2810,3400], burySpots: [160,830,1280,1540,1930,3160,3480], spawnZones: zones(3600, [[900,1200],[2380,2710]]), catStart: 145, homeLight: [3500,380],
      props: [{kind:'slide',x:590,w:180},{kind:'bench',x:1580,w:120},{kind:'swing',x:1790,w:90},{kind:'bench',x:2820,w:130},{kind:'bush',x:3200,w:110}]
    },
    4: {
      night: 4, map: 'festival', width: 4000, pits: [[850,1138],[1790,2138],[2790,3138]], checkpoints: [760,1700,2700], ground: ground(4000, [[0,470],[850,470],[1138,470],[1790,470],[2138,470],[2790,470],[3138,470],[3210,470],[4000,470]]),
      platforms: [platform(300,402,130),platform(620,370,130),platform(850,438,96,'moving',{path:[[850,438],[1042,438]],speed:.55,skin:'boat'}),platform(1158,410,135),platform(1340,378,135),platform(1570,380,135),platform(1790,438,116,'moving',{path:[[1790,438],[2022,438]],speed:.58,skin:'boat'}),platform(2158,400,140),platform(2330,365,135,'moving',{path:[[2330,365],[2430,365]],speed:.65}),platform(2600,400,135),platform(2790,438,116,'moving',{path:[[2790,438],[3022,438]],speed:.62,skin:'boat'}),platform(3158,408,130),platform(3310,375,135),platform(3550,345,140),platform(3830,405,125)],
      hideSpots: [480,1200,1510,2180,2630,3330,3780], burySpots: [180,700,1200,1660,2180,2680,3180,3750,3850], spawnZones: zones(4000, [[850,1138],[1790,2138],[2790,3138]]), catStart: 150, homeLight: [3880,390],
      props: [{kind:'stall',x:500,w:150},{kind:'lanterns',x:1340,w:250},{kind:'stall',x:2420,w:150},{kind:'lanterns',x:3380,w:260}]
    },
    5: {
      boss: { type: 'F', name: 'Storm Frustrated', phases: 3 },
      night: 5, map: 'hill', width: 4200, pits: [[920,1205],[2700,3000]], checkpoints: [820,2580], ground: ground(4200, hillProfile),
      platforms: [platform(165,330,120),platform(655,420,90,'crumbling'),platform(920,430,95,'moving',{path:[[920,430],[1110,430]],speed:.56,skin:'stone'}),platform(1225,348,120),platform(1565,330,120),platform(2055,420,90),platform(2580,348,120),platform(2700,430,100,'moving',{path:[[2700,430],[2900,430]],speed:.6,skin:'stone'}),platform(3025,330,120),platform(3455,420,90),platform(3985,348,120)],
      hideSpots: [1345,3100,4145], burySpots: [80,350,850,1450,1600,2500,3150,3750,4050],
      spawnZones: [[80,850],[1230,2580],[3020,4080]], catStart: 90, homeLight: [4100,390],
      props: [{kind:'branch',x:510,w:180},{kind:'stone',x:720,w:85},{kind:'branch',x:1850,w:180},{kind:'stone',x:2120,w:85},{kind:'branch',x:3300,w:180}]
    },
    6: {
      night: 6, map: 'lake', width: 3900, pits: [[670,1006],[1610,1958],[2600,2948]], checkpoints: [570,1510,2500], ground: ground(3900, [[0,470],[670,470],[1006,470],[1610,470],[1958,470],[2600,470],[2948,470],[3000,470],[3070,470],[3900,470]]),
      platforms: [platform(280,402,130),platform(550,370,120),platform(670,438,112,'moving',{path:[[670,438],[894,438]],speed:.55,skin:'log'}),platform(1026,410,130),platform(1160,390,135,'moving',{path:[[1160,390],[1260,390]],speed:.55,skin:'log'}),platform(1420,400,130),platform(1560,405,42,'swinging',{anchor:[1645,350],speed:.8}),platform(1610,438,116,'moving',{path:[[1610,438],[1842,438]],speed:.58,skin:'log'}),platform(1978,410,135),platform(2160,375,135),platform(2330,405,135,'moving',{path:[[2330,405],[2420,380]],speed:.6,skin:'log'}),platform(2600,438,116,'moving',{path:[[2600,438],[2832,438]],speed:.62,skin:'log'}),platform(2968,410,135),platform(3145,378,135),platform(3320,350,140),platform(3650,405,140)],
      hideSpots: [430,1040,1490,2130,3000,3520], burySpots: [150,600,1060,1380,2310,2500,3000,3440], spawnZones: zones(3900, [[670,1006],[1610,1958],[2600,2948]]), catStart: 140, homeLight: [3780,390],
      props: [{kind:'jetty',x:420,w:130},{kind:'stones',x:3500,w:90}]
    },
    7: {
      boss: { type: 'F', name: 'Storm Frustrated', phases: 3 },
      night: 7, map: 'lake', width: 5400, pits: [[940,1210],[2110,2440],[3380,3650],[4440,4710]], checkpoints: [850,1980,3250,4310,4750], ground: ground(5400, [[0,470],[380,448],[760,430],[940,470],[1210,470],[1410,470],[1480,462],[1760,440],[2110,470],[2440,470],[2560,470],[2640,455],[3030,430],[3380,470],[3650,470],[3840,470],[3910,458],[4180,438],[4440,470],[4710,470],[4860,470],[4940,462],[5400,450]]),
      platforms: [platform(260,396,128),platform(540,360,130),platform(790,400,130),platform(940,438,90,'moving',{path:[[940,438],[1120,438]],speed:.6,skin:'log'}),platform(1230,406,130),platform(1410,390,130,'moving',{path:[[1410,390],[1500,380]],speed:.75}),platform(1630,392,132),platform(1920,350,132),platform(2110,438,110,'moving',{path:[[2110,438],[2330,438]],speed:.64,skin:'log'}),platform(2460,412,138),platform(2630,380,132,'bouncy'),platform(2820,337,132),platform(3120,390,136),platform(3380,438,90,'moving',{path:[[3380,438],[3560,438]],speed:.66,skin:'log'}),platform(3670,410,135),platform(3825,378,136,'crumbling'),platform(4100,340,138),platform(4395,420,42,'swinging',{anchor:[4485,350],speed:.82}),platform(4440,438,90,'moving',{path:[[4440,438],[4620,438]],speed:.7,skin:'log'}),platform(4730,400,135),platform(4900,365,140,'moving',{path:[[4900,365],[5000,340]],speed:.7}),platform(5200,400,140)],
      hideSpots: [420,1240,1840,2600,3120,3700,4270,5050], burySpots: [150,550,1380,1550,1870,2485,2700,3220,3970,4150,4850,5220], spawnZones: zones(5400, [[940,1210],[2110,2440],[3380,3650],[4440,4710]]), catStart: 135, homeLight: [5250,385],
      props: [{kind:'bench',x:700,w:120},{kind:'slide',x:2960,w:140},{kind:'lanterns',x:4930,w:240}]
    },
    free: {
      variants: [
        { night:'free-gentle', map:'free', width:4200, pits:[[1150,1420]], checkpoints:[1060], ground:ground(4200,[[0,470],[420,452],[860,470],[1150,470],[1420,470],[1470,438],[1660,470],[2110,450],[2570,470],[3010,430],[3480,470],[3890,448],[4200,470]]), platforms:[platform(350,402,140),platform(850,370,140),platform(1150,438,90,'moving',{path:[[1150,438],[1330,438]],speed:.56,skin:'log'}),platform(1440,390,140),platform(1880,360,140),platform(2400,400,140),platform(2930,360,140),platform(3440,395,140),platform(3900,365,140)],hideSpots:[500,1640,2500,3550],burySpots:[180,690,1060,1630,2140,2660,3180,3710,4050],spawnZones:[[120,1080],[1490,4080]],catStart:150,homeLight:[4050,390],props:[{kind:'bench',x:2290,w:130},{kind:'branch',x:3320,w:180}] },
        { night:'free-stepping', map:'free', width:4200, pits:[[680,998],[1740,2058],[2920,3238]], checkpoints:[600,1660,2840], ground:ground(4200,[[0,470],[680,470],[998,470],[1030,470],[1120,470],[1740,470],[2058,470],[2100,470],[2190,470],[2920,470],[3238,470],[3270,470],[3360,470],[4200,470]]), platforms:[platform(300,400,140),platform(520,365,140),platform(680,438,106,'moving',{path:[[680,438],[892,438]],speed:.52,skin:'log'}),platform(1018,410,140),platform(1190,405,140),platform(1510,370,140),platform(1740,438,106,'moving',{path:[[1740,438],[1952,438]],speed:.58,skin:'log'}),platform(2078,410,140),platform(2240,405,140),platform(2540,370,140),platform(2920,438,106,'moving',{path:[[2920,438],[3132,438]],speed:.6,skin:'log'}),platform(3258,410,140),platform(3400,375,140),platform(3780,405,140)],hideSpots:[430,1320,2380,3540],burySpots:[160,600,1200,1450,2180,2470,2740,3400,4010],spawnZones:[[120,650],[1050,1700],[2110,2880],[3300,4080]],catStart:140,homeLight:[4050,390],props:[] },
        { night:'free-highroute', map:'free', width:4200, pits:[[1910,2180]],checkpoints:[1810], ground:ground(4200,[[0,470],[650,455],[1260,470],[1910,438],[2180,438],[2530,470],[3150,445],[3740,470],[4200,458]]),platforms:[platform(280,402,135),platform(560,360,130),platform(830,330,130),platform(1110,370,130),platform(1450,402,140),platform(1760,360,130),platform(1910,408,90,'moving',{path:[[1910,408],[2090,408]],speed:.56,skin:'log'}),platform(2200,328,130),platform(2340,368,130),platform(2680,402,140),platform(2990,360,130),platform(3280,330,130),platform(3590,370,130),platform(3890,405,150)],hideSpots:[420,1380,2440,3650],burySpots:[150,660,1190,1680,2270,2670,3300,3670,4100],spawnZones:[[120,1840],[2250,4080]],catStart:140,homeLight:[4050,390],props:[{kind:'branch',x:900,w:160},{kind:'jetty',x:3020,w:160}] }
      ]
    }
  };
  // Story pits appear once every five nights. Each is wider than Shwe's
  // unaided jump and has one moving roost bridge sized to the full gap.
  sizePitsByDifficulty(levels[5], 5);
  for (const variant of levels.free.variants) sizePitsByDifficulty(variant, 5);
  // Themed traps and Thiri's hidden keepsakes, in final coordinates (after the pits are sized).
  //   squeak {x,w}: creaky floorboard (sneak across) · sprinkler {x} · lantern {x,w}: drops on its shadow
  //   wind {a,b,dir}: gusts push Shwe toward a (dir -1) or b (dir 1); zones end well before any pit
  //   slick {a,b}: wet mossy stones, Shwe slides; zones end well before any pit
  //   keepsakes [x,y]: hidden until Shwe is close or uses Night Eyes; some sit above a moving bridge (grab it mid-ride)
  const EXTRAS = {
    1: { hazards: [], keepsakes: [[60,440],[1925,300]] },
    2: { hazards: [{kind:'squeak',x:400,w:90},{kind:'squeak',x:1600,w:90},{kind:'squeak',x:2750,w:90}], keepsakes: [[1306,398],[2933,292]] },
    3: { hazards: [{kind:'sprinkler',x:1500},{kind:'sprinkler',x:3150}], keepsakes: [[580,195],[3680,425]] },
    4: { hazards: [{kind:'lantern',x:1412,w:250},{kind:'lantern',x:3626,w:260}], keepsakes: [[2080,400],[3866,285]] },
    5: { hazards: [{kind:'wind',a:380,b:800,dir:-1},{kind:'wind',a:1420,b:2350,dir:1},{kind:'wind',a:3400,b:4150,dir:-1}], keepsakes: [[700,385],[2195,385],[3280,252]] },
    6: { hazards: [{kind:'slick',a:1350,b:1600},{kind:'slick',a:2450,b:2760},{kind:'slick',a:3600,b:4000}], keepsakes: [[920,400],[3906,282]] },
    7: { hazards: [{kind:'slick',a:1500,b:2150},{kind:'wind',a:2900,b:3700,dir:-1},{kind:'lantern',x:5690,w:240}], keepsakes: [[3096,180],[4000,400],[6130,415]] }
  };
  for (const [night, extra] of Object.entries(EXTRAS)) Object.assign(levels[night], extra);
  // Hilltop: every hill's middle stone pillar crumbles, not just the first one
  for (const p of levels[5].platforms) if (p[2] === 90 && p[1] === 420) p[3] = 'crumbling';
  for (let night = 8; night <= 50; night++) levels[night] = makeChallengeLevel(night);
  // Keep roosts exclusive to pit nights: every gap has exactly one moving
  // bridge, while non-pit nights use continuous ground and no roost platforms.
  for (let night = 1; night <= 50; night++) {
    const level = levels[night];
    if (night % 5 !== 0) {
      level.pits = [];
      level.platforms = [];
      continue;
    }
    level.platforms = (level.pits || []).map(([a, b]) => level.platforms.find(p =>
      p[3] === 'moving' && p[4]?.path?.length > 1
      && Math.min(...p[4].path.map(([x]) => x)) <= a
      && Math.max(...p[4].path.map(([x]) => x)) + p[2] >= b
    )).filter(Boolean);
  }
  // Endless Nights: the night card the player picks decides the place (and so the map art), and its
  // version adds a twist made only of hazards the game already knows (wind, slick ground, falling lanterns).
  const endlessHazards = (level, twist) => {
    // spans of solid ground, well clear of every pit (hazard zones must end before a gap)
    const spans = []; let left = 320;
    for (const [a, b] of (level.pits || []).slice().sort((p, q) => p[0] - q[0])) { if (a - 110 - left > 200) spans.push([left, a - 110]); left = b + 110; }
    if (level.width - 260 - left > 200) spans.push([left, level.width - 260]);
    const chunks = (len, gap) => { const out = []; for (const [a, b] of spans) for (let x = a; x + 160 < b; x += len + gap) out.push([x, Math.min(b, x + len)]); return out; };
    const out = [];
    if (twist === 'blossom') chunks(480, 700).filter(([a]) => a >= 600).slice(0, 5).forEach(([a, b], i) => out.push({ kind: 'wind', a, b, dir: i % 2 ? -1 : 1 }));
    if (twist === 'snowy') spans.forEach(([a, b]) => out.push({ kind: 'slick', a, b }));
    if (twist === 'rain') chunks(420, 600).forEach(([a, b]) => out.push({ kind: 'slick', a, b }));
    if (twist === 'candle') chunks(240, 900).filter(([a]) => a >= 700).slice(0, 5).forEach(([a]) => out.push({ kind: 'lantern', x: a, w: 240 }));
    return out;
  };
  const buildEndless = (night, map, twists = []) => {
    const level = makeChallengeLevel(night);
    level.map = map;
    level.endless = true;
    const skin = map === 'festival' ? 'boat' : map === 'lake' ? 'log' : map === 'hill' ? 'stone' : '';
    if (night % 5 !== 0) { level.pits = []; level.platforms = []; level.spawnZones = [[260, level.width - 200]]; }
    else level.platforms = level.platforms.filter(p => p[3] === 'moving' && p[4]?.path?.length > 1).map(p => { if (skin) p[4].skin = skin; else delete p[4].skin; return p; });
    if (map === 'hill' && !level.pits.length) {
      // rolling hill steps instead of a flat street
      const pts = [[0, 470], [420, 470]];
      for (let x = 700, i = 0; x < level.width - 420; x += 300, i++) pts.push([x, Math.round(452 + 14 * Math.sin(i * 1.3) + 8 * Math.sin(i * .55))]);
      pts.push([level.width - 300, 470], [level.width, 470]);
      level.ground = ground(level.width, pts);
    }
    if (map === 'pagoda') {
      // Shallow stone flights: short level treads joined by gently sloped risers.
      const stops = new Set([0, level.width]);
      for (let x = 0; x <= level.width; x += 50) stops.add(Math.min(level.width, x));
      for (const [a, b] of level.pits) for (const x of [a - 110, a, b, b + 110]) stops.add(Math.max(0, Math.min(level.width, x)));
      level.ground = ground(level.width, [...stops].sort((a, b) => a - b).map(x => {
        const nearPit = level.pits.some(([a, b]) => x >= a - 110 && x <= b + 110);
        return [x, nearPit ? 470 : pagodaStepY(x)];
      }));
      // Oil lamps sit on optional stone plinths on safe ground. No plinth is a pit crossing.
      const safe = []; let left = 320;
      for (const [a, b] of level.pits) { if (a - 110 > left + 180) safe.push([left, a - 110]); left = b + 110; }
      if (level.width - 260 > left + 180) safe.push([left, level.width - 260]);
      for (const [a, b] of safe) for (let x = a + 40; x + 82 < b - 40; x += 560) {
        level.platforms.push(platform(x, pagodaStepY(x) - 76, 82, 'static', { skin: 'oil-lamp' }));
      }
    }
    level.hazards = twists.flatMap(t => endlessHazards(level, t));
    if (map === 'pagoda') {
      const safe = []; let left = 320;
      for (const [a, b] of level.pits) { if (a - 110 > left + 180) safe.push([left, a - 110]); left = b + 110; }
      if (level.width - 260 > left + 180) safe.push([left, level.width - 260]);
      safe.forEach(([a, b]) => {
        const count = Math.max(1, Math.ceil((b - a) / 760));
        for (let i = 0; i < count; i++) level.hazards.push({ kind: 'bell', x: a + (i + .5) * (b - a) / count, radius: 190 });
      });
    }
    if (map === 'market') {
      // Every market route gets optional bounce awnings, safe to ignore for
      // progression. Puddles and rope lanterns are placed only on solid spans;
      // when pits exist, their moving bridge remains the only way across.
      const spans = []; let left = 250;
      for (const [a, b] of level.pits.slice().sort((x, y) => x[0] - y[0])) {
        if (a - left > 220) spans.push([left, a - 90]);
        left = b + 90;
      }
      if (level.width - 220 - left > 220) spans.push([left, level.width - 160]);
      const marketRuns = spans.flatMap(([a, b]) => {
        if (b - a < 760) return [[a, b]];
        const out = [];
        for (let x = a; x + 240 < b; x += 680) out.push([x, Math.min(b, x + 470)]);
        return out;
      });
      marketRuns.forEach(([a, b], i) => {
        if (b - a < 220) return;
        const awningX = a + 34, awningW = 112;
        level.platforms.push(platform(awningX, 390 - (i % 2) * 12, awningW, 'bouncy', { skin: 'awning' }));
        const puddleX = Math.max(a + 30, b - 118);
        if (puddleX > awningX + awningW + 26 || puddleX + 72 < awningX) level.hazards.push({ kind: 'puddle', x: puddleX, w: 72 });
        if ((i % 2 === 1 || i === marketRuns.length - 1) && b - a >= 220) {
          const anchorX = Math.min(b - 50, awningX + 206), anchorY = 292;
          level.platforms.push(platform(anchorX - 21, anchorY + 50, 42, 'swinging', { anchor: [anchorX, anchorY], speed: .74 + (night - 18) * .006, skin: 'lantern-rope' }));
        }
      });
    }
    return level;
  };
  root.TC_ENDLESS_LEVEL = buildEndless;
  root.TC_LEVELS = levels;
  if (typeof module !== 'undefined' && module.exports) module.exports = levels;
})(typeof window !== 'undefined' ? window : globalThis);
