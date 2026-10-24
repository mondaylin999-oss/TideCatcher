/* Cached architectural backgrounds; decorative shelves never imitate roosts. */
(function(root){
  'use strict';
  const W=1440,H=474;
  const variants=[
    {name:'Classroom wing',wall:'#666278',low:'#3b394f',trim:'#aaa0a3',wood:'#635b64',light:'#f1d9b0',bays:['door','window','notice']},
    {name:'Window gallery',wall:'#667886',low:'#334d61',trim:'#a5b7bb',wood:'#566c77',light:'#d7e7e2',bays:['window','window','door']},
    {name:'Art corridor',wall:'#857483',low:'#504151',trim:'#c6b1a8',wood:'#7c6266',light:'#ffe0b2',bays:['art','door','window']},
    {name:'Library passage',wall:'#776e69',low:'#413d46',trim:'#b1a38b',wood:'#635045',light:'#f2d49b',bays:['library','window','door']},
    {name:'Courtyard arcade',wall:'#76837e',low:'#3d514f',trim:'#b8b6a2',wood:'#58685e',light:'#e0e9c2',bays:['arch','arch','door']}
  ];
  const schoolLevels=[1,2,8,13,18,23,28,33,38,43,48];
  function forLevel(level){const i=schoolLevels.indexOf(Number(level));return variants[(i<0?0:i)%variants.length];}
  const outdoorNames=['Moonlit courtyard','Covered walkway','Moonlit garden'];
  function outdoorFor(level,tile){
    if(tile<1 || tile%3!==1)return null;
    const visit=Math.max(0,schoolLevels.indexOf(Number(level)));
    return outdoorNames[(visit+Math.floor(tile/3))%outdoorNames.length];
  }
  const cache=new Map();
  function build(v,alternate){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    const g=canvas.getContext('2d');
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    const line=(x,y,x2,y2,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();};
    const gradient=(a,b,y0,y1)=>{const x=g.createLinearGradient(0,y0,0,y1);x.addColorStop(0,a);x.addColorStop(1,b);return x;};
    rect(0,0,W,H,gradient(v.wall,'#292d41',70,H));
    rect(0,0,W,62,gradient('#252b3d',v.wall,0,62));
    rect(0,62,W,6,v.trim);rect(0,69,W,7,'#252438');
    rect(0,353,W,121,gradient(v.low,'#252637',353,474));
    line(0,351,W,351,v.trim,3);line(0,356,W,356,'#292739',2);
    for(let x=0;x<W;x+=120)line(x,359,x,466,'#a5a0ad19');
    rect(0,460,W,8,'#272738');line(0,460,W,460,v.trim,2);
    function windowView(x,arch){
      const y=122,w=174,h=192;
      rect(x-8,y-8,w+16,h+16,'#252b40');
      g.save();g.beginPath();
      if(arch){g.moveTo(x,y+h);g.lineTo(x,y+55);g.arc(x+w/2,y+55,w/2,Math.PI,0);g.lineTo(x+w,y+h);g.closePath();}
      else g.rect(x,y,w,h);
      g.clip();rect(x,y,w,h,gradient('#172944','#6c6b84',y,y+h));
      g.fillStyle='#d9dfc4';g.beginPath();g.arc(x+121,y+38,12,0,Math.PI*2);g.fill();
      g.fillStyle='#293e50';g.beginPath();g.moveTo(x,y+132);g.quadraticCurveTo(x+40,y+91,x+100,y+133);g.quadraticCurveTo(x+160,y+104,x+w,y+128);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.fill();
      for(let j=0;j<6;j++){
        const xx=x+12+j*31,yy=y+155+(j%3)*8;
        rect(xx,yy,22,y+h-yy,'#263445');
        if(j%2)rect(xx+7,yy+8,3,5,'#e4ce9b77');
      }
      g.restore();
      if(arch){g.strokeStyle=v.trim;g.lineWidth=6;g.beginPath();g.moveTo(x-3,y+h);g.lineTo(x-3,y+55);g.arc(x+w/2,y+55,w/2+3,Math.PI,0);g.lineTo(x+w+3,y+h);g.stroke();}
      else{g.strokeStyle=v.trim;g.lineWidth=5;g.strokeRect(x,y,w,h);}
      line(x+w/2,y+6,x+w/2,y+h,v.trim,4);line(x,y+96,x+w,y+96,v.trim,3);
      // A narrow frame inside the wall, without a projecting platform-like sill.
      line(x+3,y+h+3,x+w-3,y+h+3,'#b8b5b466',2);
    }
    for(let bay=0;bay<3;bay++){
      const bx=bay*480,kind=v.bays[(bay+alternate)%3];
      if(kind==='window'||kind==='arch')windowView(bx+153,kind==='arch');
      if(kind==='door'){
        rect(bx+179,151,122,309,'#252637');rect(bx+186,158,108,302,gradient(v.wood,'#363441',158,460));
        line(bx+189,161,bx+189,456,'#e4d7bb44',2);line(bx+292,160,bx+292,456,'#161d2a',3);
        rect(bx+214,185,53,96,'#192d40');rect(bx+220,191,41,84,gradient('#617486','#25374d',191,275));
        line(bx+220,219,bx+261,198,'#f0e3be44',2);rect(bx+276,320,4,18,'#d8c79b');
        rect(bx+218,130,44,12,v.trim);rect(bx+227,134,26,3,'#424050');
      }
      if(kind==='notice'||kind==='art'){
        rect(bx+144,153,196,139,'#292b3c');rect(bx+151,160,182,125,v.wood);
        if(kind==='notice'){
          rect(bx+171,179,61,82,'#d1c5aa');rect(bx+249,183,62,72,'#a6b8b7');
          for(let j=0;j<4;j++)line(bx+181,199+j*12,bx+222,199+j*12,'#7b798466');
          rect(bx+259,196,40,18,'#718a9b');line(bx+260,230,bx+296,230,'#576e7b');
        }else{
          for(let j=0;j<2;j++){
            const xx=bx+165+j*84;rect(xx,174,71,96,'#d8d0bd');rect(xx+6,180,59,77,j?'#8b99a5':'#aaa0b1');
            g.fillStyle=j?'#566c77':'#796e8c';g.beginPath();g.moveTo(xx+6,257);g.lineTo(xx+33,214);g.lineTo(xx+65,257);g.fill();
            g.fillStyle='#e8d6ae';g.beginPath();g.arc(xx+46,198,8,0,Math.PI*2);g.fill();
          }
        }
      }
      if(kind==='library'){
        // Books behind glazing are confined to the upper wall, far above roosts.
        rect(bx+137,148,210,151,'#272a36');rect(bx+145,156,194,135,'#403b40');
        for(let row=0;row<2;row++){
          for(let j=0;j<12;j++){const h=35+(j*7+row*3)%18;rect(bx+154+j*15,211+row*64-h,10,h,['#826e78','#6e8991','#a79878','#7d8490'][j%4]);}
          line(bx+149,214+row*64,bx+334,214+row*64,'#a18e77',3);
        }
        line(bx+241,156,bx+241,290,'#b3a18a',3);line(bx+163,167,bx+221,276,'#dfdfd711',6);
      }
      // One fixed warm wall fitting per bay replaces hanging strings and clutter.
      const lx=bx+60,ly=181;
      const pool=g.createRadialGradient(lx,ly,3,lx,ly,68);pool.addColorStop(0,v.light+'38');pool.addColorStop(1,v.light+'00');
      rect(lx-70,ly-70,140,140,pool);rect(lx-7,ly-13,14,31,'#383643');rect(lx-4,ly-9,8,20,v.light);
      rect(lx-9,ly-14,18,4,v.trim);rect(lx-9,ly+16,18,4,v.trim);
      // Recessed wall joints carry the depth without extra foreground furniture.
      rect(bx,76,15,384,gradient(v.wall,'#343242',76,460));line(bx+15,76,bx+15,460,'#10172555',3);
    }
    return canvas;
  }
  function buildOutdoor(v,kind,alternate){
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    const g=canvas.getContext('2d');
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    const line=(x,y,x2,y2,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();};
    const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#131b38');sky.addColorStop(.58,'#394562');sky.addColorStop(1,'#57636b');rect(0,0,W,H,sky);
    // A single moon and a few fixed stars keep the opening calm at mobile size.
    const mx=alternate?1080:360;
    const halo=g.createRadialGradient(mx,105,8,mx,105,132);halo.addColorStop(0,'#dce8cf44');halo.addColorStop(1,'#dce8cf00');rect(mx-132,-27,264,264,halo);
    g.fillStyle='#e8e5ca';g.beginPath();g.arc(mx,105,25,0,Math.PI*2);g.fill();
    for(let i=0;i<18;i++){const x=(i*319+73)%W,y=30+(i*67)%160;rect(x,y,i%4?2:3,2,'#dfe8ec88');}
    // The far school wing anchors all three outdoor scenes to the hallway.
    rect(80,252,1280,194,'#30384d');rect(80,245,1280,10,'#657080');
    for(let i=0;i<9;i++){const x=112+i*151;rect(x,292,78,95,'#1d2c43');rect(x+5,297,68,85,i%3?'#627083':'#8c8790');line(x+39,297,x+39,382,'#29394e',4);}
    rect(0,385,W,75,'#3d4c55');rect(0,453,W,21,'#323746');
    if(kind==='Moonlit courtyard'){
      // Open paving and a low central planter, well below the real roosts.
      for(let x=0;x<W;x+=160)line(x,418,x-38,460,'#95a6a533');
      line(0,426,W,426,'#a8b3a344');
      rect(560,406,320,16,'#5f6a6a');rect(574,387,292,23,'#3f625c');
      for(let i=0;i<9;i++){const x=595+i*31;g.fillStyle=i%2?'#566e59':'#688568';g.beginPath();g.arc(x,384-(i%3)*8,16,0,Math.PI*2);g.fill();}
    }else if(kind==='Covered walkway'){
      rect(0,64,W,26,'#282d40');rect(0,87,W,17,'#545362');line(0,103,W,103,'#b3a581',3);
      for(let x=78;x<W;x+=320){rect(x,104,20,354,'#38404e');rect(x+4,104,5,349,'#90938e44');rect(x-23,99,68,12,'#6d6b71');}
      for(let x=238;x<W;x+=320){const glow=g.createRadialGradient(x,141,2,x,141,58);glow.addColorStop(0,'#f5deb34a');glow.addColorStop(1,'#f5deb300');rect(x-58,83,116,116,glow);rect(x-6,106,12,31,'#c9b995');rect(x-3,111,6,20,'#ffe6b5');}
      for(let x=0;x<W;x+=180)line(x,432,x-32,460,'#c2c3ae30');
    }else{
      // Rounded trees and low planting read as a garden, without extra shelves.
      for(const x of [285,730,1150]){
        rect(x-7,266,14,172,'#303d3c');
        g.fillStyle='#263d45';for(const [dx,dy,r] of [[-45,0,54],[35,-20,60],[0,-57,59]]){g.beginPath();g.arc(x+dx,253+dy,r,0,Math.PI*2);g.fill();}
        g.fillStyle='#4d686777';g.beginPath();g.arc(x-28,199,26,0,Math.PI*2);g.fill();
      }
      for(let x=90;x<W;x+=115){g.fillStyle='#37554f';g.beginPath();g.ellipse(x,425,48,20,0,0,Math.PI*2);g.fill();}
      for(let i=0;i<12;i++){const x=(i*227+115)%W;rect(x,410+(i%3)*7,3,3,'#dfd49b');}
      line(0,445,W,445,'#9aa99955',2);
    }
    // Matching passage piers hide joins with an indoor tile. They are scenery only.
    for(const x of [0,W-72]){
      rect(x,0,72,460,v.wall);rect(x,0,72,69,'#252b3d');rect(x,69,72,7,v.trim);
      rect(x,353,72,107,v.low);line(x,351,x+72,351,v.trim,3);
      line(x+(x?0:71),76,x+(x?0:71),460,'#171b2c',4);
    }
    return canvas;
  }
  function draw(g,{level,cam,width,ground,alpha=1,mirror=false,parallax=.9}){
    const v=forLevel(level),off=cam*parallax;
    g.save();g.globalAlpha=alpha;
    if(mirror){g.translate(0,ground*1.55);g.scale(1,-.55);}
    for(let k=Math.floor(off/W);k*W-off<width;k++){
      const alternate=((k%2)+2)%2,outdoor=outdoorFor(level,k);
      if(mirror&&outdoor)continue;
      const key=variants.indexOf(v)+':'+alternate+':'+(outdoor||'hall');
      if(!cache.has(key)){
        // Retain at most four tiles, including the current pair, on mobile.
        if(cache.size>=4)cache.delete(cache.keys().next().value);
        cache.set(key,outdoor?buildOutdoor(v,outdoor,alternate):build(v,alternate));
      }
      g.drawImage(cache.get(key),cam+k*W-off,0,W,H);
    }
    g.restore();return true;
  }
  root.TCSchoolHallways={variants,forLevel,outdoorFor,draw};
})(typeof window!=='undefined'?window:globalThis);
