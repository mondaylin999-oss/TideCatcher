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
  const ground = (width, points, gaps = []) => ({ points: [[0, points[0][1]], ...points.filter(p => p[0] > 0 && p[0] < width), [width, points[points.length - 1][1]]], gaps });
  const platform = (x, y, w, type = 'static', extra = null) => extra ? [x, y, w, type, extra] : [x, y, w, type];
  const zones = (width, gaps = []) => {
    const cuts = [[120, width - 120], ...gaps.map(([a,b]) => [a,b])].sort((a,b) => a[0] - b[0]);
    const out = []; let left = 120;
    for (const [a,b] of gaps.slice().sort((a,b) => a[0] - b[0])) { if (a - left > 180) out.push([left, a - 70]); left = b + 70; }
    if (width - 120 - left > 180) out.push([left, width - 120]);
    return out.length ? out : [[120, width - 120]];
  };
  const levels = {
    1: {
      night: 1, map: 'school', width: 2500, ground: ground(2500, [[0,470],[520,470],[560,462],[780,462],[820,470],[1450,470],[1490,458],[1710,458],[1750,470],[2500,470]]), gaps: [],
      platforms: [platform(300,405,130),platform(560,378,120),platform(850,414,130),platform(1190,382,130),platform(1530,408,130),platform(1870,378,130),platform(2190,410,130)],
      hideSpots: [420,970,1430,1980,2330], burySpots: [180,790,980,1320,1705,1940,2220,2400],
      spawnZones: [[260,2220]], catStart: 170, homeLight: [2400,390],
      props: [{kind:'desk',x:620,w:120},{kind:'chairs',x:1080,w:72},{kind:'desk',x:1740,w:130},{kind:'chairs',x:2110,w:72}]
    },
    2: {
      night: 2, map: 'school', width: 3300, gaps: [[1160,1260,518]], ground: ground(3300, [[0,470],[680,470],[740,455],[920,455],[980,470],[1160,470],[1260,470],[1370,470],[1430,470],[2050,470],[2120,458],[2320,458],[2390,470],[3300,470]], [[1160,1260,518]]),
      platforms: [platform(310,402,120),platform(560,365,126),platform(850,410,130),platform(1070,378,126,'moving',{path:[[1070,378],[1120,350]],speed:.75}),platform(1350,395,120),platform(1610,360,130),platform(1900,405,130),platform(2220,370,130),platform(2530,405,135),platform(2850,365,130),platform(3150,410,115)],
      hideSpots: [450,970,1450,1930,2520,3050], burySpots: [190,680,1010,1380,1690,1900,2460,2820,3190], spawnZones: zones(3300, [[1160,1260]]), catStart: 170, homeLight: [3190,385],
      props: [{kind:'desk',x:740,w:130},{kind:'chairs',x:1500,w:70},{kind:'desk',x:2010,w:130},{kind:'chairs',x:2690,w:70}]
    },
    3: {
      night: 3, map: 'park', width: 3600, gaps: [], ground: ground(3600, [[0,470],[300,448],[520,430],[760,454],[980,478],[1230,462],[1480,430],[1730,442],[1990,478],[2220,490],[2490,462],[2760,432],[3040,448],[3310,478],[3600,458]]),
      platforms: [platform(250,395,130),platform(520,360,125,'bouncy'),platform(800,398,135),platform(1110,375,130),platform(1430,350,132),platform(1740,390,128),platform(2050,420,132,'bouncy'),platform(2350,380,130),platform(2660,348,132),platform(2970,385,130),platform(3280,410,140)],
      hideSpots: [400,1020,1590,2180,2810,3400], burySpots: [160,830,930,1280,1540,1950,2670,2920,3480], spawnZones: [[120,3480]], catStart: 145, homeLight: [3500,380],
      props: [{kind:'slide',x:590,w:180},{kind:'bench',x:1080,w:120},{kind:'swing',x:1790,w:90},{kind:'bench',x:2470,w:130},{kind:'bush',x:3200,w:110}]
    },
    4: {
      night: 4, map: 'festival', width: 4000, gaps: [[850,940,528],[1790,1900,530],[2790,2900,528]], ground: ground(4000, [[0,470],[850,470],[940,470],[1790,470],[1900,470],[2790,470],[2900,470],[3150,470],[3210,470],[4000,470]], [[850,940,528],[1790,1900,530],[2790,2900,528]]),
      platforms: [platform(300,402,130),platform(620,370,130),platform(980,410,135),platform(1250,378,135),platform(1570,380,135),platform(1920,400,140),platform(2220,365,135,'moving',{path:[[2220,365],[2320,365]],speed:.65}),platform(2500,400,135),platform(2940,408,130),platform(3230,375,135),platform(3550,345,140),platform(3830,405,125)],
      hideSpots: [480,1120,1510,2150,2630,3330,3780], burySpots: [180,700,1060,1660,2070,2680,3120,3750,3850], spawnZones: zones(4000, [[850,940],[1790,1900],[2790,2900]]), catStart: 150, homeLight: [3880,390],
      props: [{kind:'stall',x:500,w:150},{kind:'lanterns',x:1340,w:250},{kind:'boat',x:1845,w:110,path:[[1845,0],[1865,0]],speed:.45},{kind:'stall',x:2420,w:150},{kind:'boat',x:2845,w:110},{kind:'lanterns',x:3380,w:260}]
    },
    5: {
      night: 5, map: 'hill', width: 4200, gaps: [], ground: ground(4200, hillProfile),
      platforms: [platform(165,330,120),platform(655,420,90,'crumbling'),platform(1185,348,120),platform(1565,330,120),platform(2055,420,90),platform(2585,348,120),platform(2965,330,120),platform(3455,420,90),platform(3985,348,120)],
      hideSpots: [1345,2745,4145], burySpots: [80,350,850,1450,1600,2500,2900,3750,4050],
      spawnZones: [[80,1320],[1460,2720],[2860,4080]], catStart: 90, homeLight: [4100,390],
      props: [{kind:'branch',x:510,w:180},{kind:'stone',x:720,w:85},{kind:'branch',x:1850,w:180},{kind:'stone',x:2120,w:85},{kind:'branch',x:3300,w:180}]
    },
    6: {
      night: 6, map: 'lake', width: 3900, gaps: [[670,790,526],[1610,1730,528],[2600,2710,526]], ground: ground(3900, [[0,470],[670,470],[790,470],[1610,470],[1730,470],[2600,470],[2710,470],[3000,470],[3070,470],[3900,470]], [[670,790,526],[1610,1730,528],[2600,2710,526]]),
      platforms: [platform(280,402,130),platform(560,370,120),platform(820,410,130),platform(1080,390,135,'moving',{path:[[1080,390],[1180,390]],speed:.55}),platform(1390,400,130),platform(1750,410,135),platform(2030,375,135),platform(2330,405,135,'moving',{path:[[2330,405],[2420,380]],speed:.6}),platform(2730,410,135),platform(3010,378,135),platform(3320,350,140),platform(3650,405,140)],
      hideSpots: [430,1040,1490,2130,2940,3520], burySpots: [150,600,920,1380,1600,1890,2500,2940,3440], spawnZones: zones(3900, [[670,790],[1610,1730],[2600,2710]]), catStart: 140, homeLight: [3780,390],
      props: [{kind:'jetty',x:360,w:160},{kind:'log',x:1110,w:150,path:[[1110,0],[1160,0]],speed:.55},{kind:'stones',x:1460,w:90},{kind:'log',x:2230,w:150,path:[[2230,0],[2280,0]],speed:.6},{kind:'jetty',x:3090,w:160},{kind:'stones',x:3500,w:90}]
    },
    7: {
      night: 7, map: 'lake', width: 5400, gaps: [[940,1020,526],[2110,2200,528],[3380,3470,526],[4440,4530,528]], ground: ground(5400, [[0,470],[380,448],[760,430],[940,470],[1020,470],[1410,470],[1480,462],[1760,440],[2110,470],[2200,470],[2560,470],[2640,455],[3030,430],[3380,470],[3470,470],[3840,470],[3910,458],[4180,438],[4440,470],[4530,470],[4860,470],[4940,462],[5400,450]], [[940,1020,526],[2110,2200,528],[3380,3470,526],[4440,4530,528]]),
      platforms: [platform(260,396,128),platform(540,360,130),platform(830,400,130),platform(1040,406,130),platform(1320,390,130,'moving',{path:[[1320,390],[1410,380]],speed:.75}),platform(1630,392,132),platform(1920,350,132),platform(2210,412,138),platform(2510,380,132,'bouncy'),platform(2820,337,132),platform(3120,390,136),platform(3500,410,135),platform(3790,378,136,'crumbling'),platform(4100,340,138),platform(4390,405,135),platform(4610,400,135),platform(4900,365,140,'moving',{path:[[4900,365],[5000,340]],speed:.7}),platform(5200,400,140)],
      hideSpots: [420,1130,1840,2410,3120,3650,4270,5050], burySpots: [150,550,1180,1550,1870,2430,2700,3220,3970,4150,4850,5220], spawnZones: zones(5400, [[940,1020],[2110,2200],[3380,3470],[4440,4530]]), catStart: 135, homeLight: [5250,385],
      props: [{kind:'bench',x:700,w:120},{kind:'boat',x:2160,w:110},{kind:'slide',x:2840,w:180},{kind:'branch',x:3700,w:180},{kind:'jetty',x:4630,w:170},{kind:'lanterns',x:4930,w:240}]
    },
    free: {
      variants: [
        { night:'free-gentle', map:'free', width:4200, ground:ground(4200,[[0,470],[420,452],[860,470],[1280,438],[1660,470],[2110,450],[2570,470],[3010,430],[3480,470],[3890,448],[4200,470]]), gaps:[], platforms:[platform(350,402,140),platform(850,370,140),platform(1370,390,140),platform(1880,360,140),platform(2400,400,140),platform(2930,360,140),platform(3440,395,140),platform(3900,365,140)], hideSpots:[500,1450,2500,3550],burySpots:[180,690,1060,1630,2140,2660,3180,3710,4050],spawnZones:[[120,4080]],catStart:150,homeLight:[4050,390],props:[{kind:'stone',x:1150,w:90},{kind:'bench',x:2290,w:130},{kind:'branch',x:3320,w:180}] },
        { night:'free-stepping', map:'free', width:4200, ground:ground(4200,[[0,470],[680,470],[790,470],[1030,470],[1120,470],[1740,470],[1850,470],[2100,470],[2190,470],[2920,470],[3030,470],[3270,470],[3360,470],[4200,470]],[[680,790,526],[1740,1850,526],[2920,3030,526]]), platforms:[platform(300,400,140),platform(580,365,140),platform(840,410,140),platform(1190,405,140),platform(1510,370,140),platform(1810,410,140),platform(2240,405,140),platform(2540,370,140),platform(3050,410,140),platform(3400,375,140),platform(3780,405,140)],hideSpots:[430,1320,2380,3540],burySpots:[160,600,1200,1450,2180,2470,2970,3400,4010],spawnZones:[[120,650],[850,1700],[1910,2880],[3100,4080]],catStart:140,homeLight:[4050,390],props:[{kind:'jetty',x:940,w:160},{kind:'stones',x:2000,w:90},{kind:'log',x:3180,w:150}] },
        { night:'free-highroute', map:'free', width:4200, ground:ground(4200,[[0,470],[650,455],[1260,470],[1910,438],[2530,470],[3150,445],[3740,470],[4200,458]]),gaps:[],platforms:[platform(280,402,135),platform(560,360,130),platform(830,330,130),platform(1110,370,130),platform(1450,402,140),platform(1760,360,130),platform(2050,328,130),platform(2340,368,130),platform(2680,402,140),platform(2990,360,130),platform(3280,330,130),platform(3590,370,130),platform(3890,405,150)],hideSpots:[420,1380,2440,3650],burySpots:[150,660,1190,1680,2170,2670,3300,3670,4100],spawnZones:[[120,4080]],catStart:140,homeLight:[4050,390],props:[{kind:'branch',x:900,w:160},{kind:'slide',x:1850,w:180},{kind:'jetty',x:3020,w:160}] }
      ]
    }
  };
  root.TC_LEVELS = levels;
  if (typeof module !== 'undefined' && module.exports) module.exports = levels;
})(typeof window !== 'undefined' ? window : globalThis);
