/* Handmade recipes and durable progress for Heart Workshop and Lantern Town. */
(function (root) {
  'use strict';
  const bases = [
    ['F', 'Frustrated', '#ff727d'], ['N', 'Nervous', '#b59aff'], ['L', 'Lonely', '#79c7ff'],
    ['S', 'Shy', '#ff91c5'], ['E', 'Excited', '#ffdc68'], ['J', 'Jealous', '#ffa569'],
    ['B', 'Buried', '#c5a17a'], ['C', 'Calm', '#83deb0'], ['G', 'Golden', '#ffe99a']
  ].map(([id, name, color], i) => ({ id, name, color, tier: 0, line: [
    'My anger says I really care.', 'My heart races before I begin.', 'I wish someone would sit beside me.',
    'I have something to say, in a tiny voice.', 'I can hardly wait!', 'I wish my drawing had won, too.',
    'I tucked my feelings somewhere deep.', 'Breathe in, breathe out. There is time.', 'One small good thing shines today.'
  ][i] }));
  // Every recipe is unordered; no two recipes use the same pair.
  const rows = [
    ['Anticipation','N','E',1,'Butterflies before something big.'],
    ['Peaceful','L','C',1,'Quiet can feel like company.'],
    ['Determined','F','C',1,'I can try one small step again.'],
    ['Brave','S','E',1,'My voice can be small and still be heard.'],
    ['Admiration','J','C',1,'Your beautiful work helps me dream.'],
    ['Relief','N','C',1,'My shoulders can rest now.'],
    ['Embarrassed','S','N',1,'Warm cheeks do not mean I did something wrong.'],
    ['Grumpy','F','J',1,'I need a little space today.'],
    ['Nostalgia','L','G',1,'An old memory feels warm again.'],
    ['Hopeful','B','G',1,'A tiny light can reach a buried wish.'],
    ['Curious','E','C',1,'What is waiting around the corner?'],
    ['Tender','S','C',1,'Some feelings need gentle hands.'],
    ['Restless','N','F',1,'My feet want to go before I am ready.'],
    ['Wistful','L','S',1,'I wish we could sit together again.'],
    ['Vulnerable','B','S',1,'I can let someone see a little of me.'],
    ['Inspired','E','G',1,'A new drawing is beginning in my mind.'],
    ['Patient','B','C',1,'Some seeds need a little longer.'],
    ['Playful','E','J',1,'We can turn a contest into a game.'],
    ['Confident','Brave','Determined',2,'I trust myself to keep learning.'],
    ['Grateful','Peaceful','Admiration',2,'Thank you for sitting beside me.'],
    ['Joy','Relief','E',2,'A laugh finds its way out.'],
    ['Friendship','L','Brave',2,'May I sit next to you?'],
    ['Kindness','C','Embarrassed',2,'You do not have to hide your face.'],
    ['Courage','Anticipation','Brave',2,'I am nervous, and I can still begin.'],
    ['Trust','Vulnerable','Tender',2,'You kept my little secret safe.'],
    ['Belonging','Wistful','Peaceful',2,'There is a place for me here.'],
    ['Forgiveness','Grumpy','Patient',2,'We can begin again when we are ready.'],
    ['Empathy','Tender','L',2,'I can listen without fixing everything.'],
    ['Creativity','Curious','Inspired',2,'Two small ideas make a new world.'],
    ['Resilience','Determined','Relief',2,'Rest is part of trying again.'],
    ['Delight','Playful','E',2,'A small surprise makes today brighter.'],
    ['Acceptance','Vulnerable','C',2,'Every part of my heart has a place.'],
    ['Aspiration','Hopeful','Inspired',2,'I can dream without rushing.'],
    ['Happiness','Joy','Grateful',3,'There is warmth in this ordinary moment.'],
    ['Love','Friendship','Kindness',3,'I am glad you are here.'],
    ['Pride','Confident','Hopeful',3,'Look how far my little steps have taken me.'],
    ['Wonder','Courage','Nostalgia',3,'The familiar world is full of new light.'],
    ['Compassion','Empathy','Forgiveness',3,'A gentle heart has room for mistakes.'],
    ['Harmony','Trust','Belonging',3,'Different voices can make one song.'],
    ['Fulfilled','Creativity','Aspiration',3,'I made something that feels like me.'],
    ['Whole Heart','Happiness','Love',4,'I can feel everything again. Every feeling belongs.']
  ];
  const feelings = [...bases, ...rows.map(([id,a,b,tier,line], i) => ({
    id, name:id, ingredients:[a,b], tier, line, color:['#ffd77a','#8ee0cd','#ff9fbf','#aabaff'][i % 4]
  }))];
  const byId = Object.fromEntries(feelings.map(f => [f.id,f]));
  const places = [
    ['lamps','Lantern lamps',{C:2},'Shwe follows the first warm lights home.', 'mint'],
    ['school','School',{F:2,Determined:1},'The room where Thiri lost becomes the room where she tries again.', 'scarf'],
    ['wall','Winners’ Wall',{J:2,Admiration:1},'Thiri looks at the winning drawing and finds something new to learn.', 'rose'],
    ['swings','Park swings',{E:2,Joy:1},'Two swings move together. Hnin leaves the other seat for Thiri.', 'bell'],
    ['hnin','Hnin’s house',{S:2,Friendship:1},'Thiri finally shows Hnin her drawing. Hnin smiles and makes room.', 'sky'],
    ['festival','Festival gate',{Anticipation:1,Courage:1},'Under the paper lanterns, Thiri remembers being loved.', 'sand'],
    ['art','Art club',{Inspired:1,Creativity:1},'A fresh page waits. This time, drawing does not have to be a contest.', 'lilac'],
    ['home','Thiri’s home',{Tender:1,Love:1},'A hand finds Shwe in the dark. Tonight the room feels warm.', 'jar'],
    ['tree','Hilltop tree',{Hopeful:1,Wonder:1},'Thiri ties a small wish to a branch: keep making things.', 'rainbow'],
    ['bridge','Lake bridge',{Peaceful:1,Harmony:1},'The water holds every lantern. There is room for every feeling.', 'starlight']
  ].map(([id,name,needs,memory,reward]) => ({id,name,needs,memory,reward}));
  const key = 'mk-heart-v1';
  function create(storage) {
    let raw = {};
    try { raw = JSON.parse(storage.getItem(key) || '{}') || {}; } catch (_) {}
    let data = {stock:{}, discovered:[], lit:[], ending:false};
    for (const f of feelings) {
      const n = Number(raw.stock?.[f.id]);
      data.stock[f.id] = Number.isSafeInteger(n) && n > 0 ? Math.min(n,99999) : 0;
      if (data.stock[f.id] || (Array.isArray(raw.discovered) && raw.discovered.includes(f.id))) data.discovered.push(f.id);
    }
    data.lit = places.filter(p => Array.isArray(raw.lit) && raw.lit.includes(p.id)).map(p => p.id);
    data.ending = !!raw.ending && data.lit.length === places.length && data.discovered.includes('Whole Heart');
    const counts = ids => ids.reduce((out,id) => {out[id]=(out[id]||0)+1;return out;},{});
    const can = needs => Object.entries(needs).every(([id,n]) => (data.stock[id] || 0) >= n);
    function commit(next) {
      // Do not consume anything if storage is full or disabled.
      try { storage.setItem(key, JSON.stringify(next)); data=next; return true; } catch (_) { return false; }
    }
    const copy = () => JSON.parse(JSON.stringify(data));
    function bank(ids) {
      const next=copy();
      for (const id of ids) if (byId[id]?.tier === 0) {
        next.stock[id]=Math.min(99999,next.stock[id]+1);
        if (!next.discovered.includes(id)) next.discovered.push(id);
      }
      return commit(next);
    }
    function mix(a,b) {
      const recipe=feelings.find(f => f.ingredients && [...f.ingredients].sort().join('|') === [a,b].sort().join('|'));
      if (!recipe) return {error:'These two need a little more time together. No lights used.'};
      const needs=counts([a,b]);
      if (!can(needs)) return {error:'Bring home more of these lights first. No lights used.'};
      // The final heart asks for the whole upper layer to be understood, not consumed.
      if (recipe.tier === 4 && feelings.some(f => f.tier === 3 && !data.discovered.includes(f.id)))
        return {error:'Discover all seven deep feelings first: Happiness, Love, Pride, Wonder, Compassion, Harmony and Fulfilled.'};
      const next=copy(), fresh=!next.discovered.includes(recipe.id);
      for (const [id,n] of Object.entries(needs)) next.stock[id]-=n;
      next.stock[recipe.id]++;
      if (fresh) next.discovered.push(recipe.id);
      if (!commit(next)) return {error:'Progress could not be saved. Free some browser storage and try again. No lights used.'};
      return {recipe,fresh};
    }
    function light(id) {
      const p=places.find(p=>p.id===id);
      if (!p || data.lit.includes(id) || !can(p.needs)) return false;
      const next=copy();
      for (const [id,n] of Object.entries(p.needs)) next.stock[id]-=n;
      next.lit.push(id);
      return commit(next);
    }
    const ready = () => data.lit.length === places.length && data.discovered.includes('Whole Heart');
    return {snapshot:copy, can, bank, mix, light, ready,
      end:()=> ready() && commit({...copy(),ending:true}),
      hint:()=>feelings.find(f=>f.ingredients && f.tier<4 && !data.discovered.includes(f.id) && f.ingredients.every(id=>data.discovered.includes(id)))
    };
  }
  root.TCHeartData = {feelings,byId,bases,places,create};
})(typeof window !== 'undefined' ? window : globalThis);
