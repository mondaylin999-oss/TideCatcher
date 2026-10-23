/* Presentation only. Five-level chapters never change physics or level geometry. */
(function(root){
  'use strict';
  const chapters=[
    {name:'Lamplit Beginnings',sky:'#ae794d',shade:'#4c3449',accent:'#ffd79a',foliage:'#86745d',scene:'lamps',weather:'motes',description:'Warm amber lights, quiet ivy and familiar moonlit streets.'},
    {name:'Misty Gardens',sky:'#479e96',shade:'#214a54',accent:'#a9e8cd',foliage:'#527d76',scene:'garden',weather:'mist',description:'Cool jade light, layered garden silhouettes and low drifting mist.'},
    {name:'River Lanterns',sky:'#ad627b',shade:'#3f345c',accent:'#ffcf8d',foliage:'#8e657e',scene:'lanterns',weather:'lanterns',description:'Rose-purple evenings, distant festival gates and floating paper lanterns.'},
    {name:'Amber Autumn',sky:'#b58251',shade:'#4f3940',accent:'#efbd78',foliage:'#aa784f',scene:'autumn',weather:'leaves',description:'Copper moonlight, spreading autumn branches and slowly falling leaves.'},
    {name:'Silver Rain',sky:'#6b96b0',shade:'#25394f',accent:'#bbd9eb',foliage:'#4e6d7d',scene:'rain',weather:'rain',description:'Slate-blue light, distant rain shelters and fine silver rainfall.'},
    {name:'Bamboo Shadows',sky:'#629b78',shade:'#213d3e',accent:'#d4e8aa',foliage:'#5c8263',scene:'bamboo',weather:'fireflies',description:'Deep green evenings, swaying bamboo silhouettes and tiny fireflies.'},
    {name:'Indigo Ruins',sky:'#7d75b5',shade:'#302e50',accent:'#c1b9ed',foliage:'#726685',scene:'ruins',weather:'motes',description:'Indigo light, weathered arches and quiet stonework on the horizon.'},
    {name:'Winter Starlight',sky:'#91b6ca',shade:'#2c3f59',accent:'#e2f0f5',foliage:'#7897a6',scene:'winter',weather:'snow',description:'Frost-blue nights, snow-tipped pines and a few soft snowflakes.'},
    {name:'Cloud Terraces',sky:'#9e8ac4',shade:'#3e3c65',accent:'#ead9ff',foliage:'#a195b7',scene:'terraces',weather:'clouds',description:'Lavender moonlight, distant stepped hills and long cloud banks.'},
    {name:'Dawn Blossoms',sky:'#db9b96',shade:'#63556e',accent:'#ffe0b6',foliage:'#c596a9',scene:'blossoms',weather:'petals',description:'Peach dawn light, flowering branches and gently falling petals.'}
  ].map((c,i)=>Object.freeze({...c,index:i,first:i*5+1,last:i*5+5}));
  const forLevel=level=>chapters[Math.max(0,Math.min(9,Math.floor(((Number(level)||1)-1)/5)))];
  function draw(g,{level,cam,width,height,ground,time,reduced,map}){
    const theme=forLevel(level),clock=reduced?0:time;
    // Indoor scenes get reflected color and dust, rather than indoor rain/snow.
    const c=map==='school' && ['rain','snow','petals','leaves'].includes(theme.weather) ? {...theme,weather:'motes'} : theme;
    g.save();
    // Tint the existing place rather than replacing its readable platforms.
    const wash=g.createLinearGradient(0,0,0,ground);
    wash.addColorStop(0,c.sky);wash.addColorStop(1,c.shade);
    g.globalAlpha=c.index===0?.09:map==='school'?.3:.42;g.fillStyle=wash;g.fillRect(cam-50,-100,width+100,height+200);
    g.globalAlpha=1;
    const line=(x,y,x2,y2,color,w=2)=>{g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();};
    const ellipse=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
    const hill=ground-95;
    const start=Math.floor(cam*.24/640)-1;
    // Sparse, distant landmarks stay above the playable floor.
    for(let k=start;map!=='school' && k<(cam*.24+width)/640+1;k++){
      const x=cam+k*640-cam*.24+220, y=hill-12+(k%2)*12;
      g.save();g.globalAlpha=map==='school'?.32:.6;
      if(c.index>0){g.translate(x,y);g.scale(1.25,1.25);g.translate(-x,-y);}
      if(c.scene==='lamps'){
        // Keep the school's recently simplified backdrop quiet.
        if(map!=='school'){line(x,y+35,x,y-67,c.foliage,3);line(x,y-65,x+22,y-65,c.foliage,3);ellipse(x+22,y-53,6,10,c.accent);}
      }else if(['garden','autumn','blossoms'].includes(c.scene)){
        line(x,y+35,x+5,y-65,c.foliage,6);
        for(let j=0;j<5;j++){
          const side=j%2?-1:1,xx=x+side*(24+j*7),yy=y-24-j*13;
          line(x+4,y+8-j*15,xx,yy,c.foliage,2);
          ellipse(xx,yy,25+j*2,13,c.foliage);
          if(c.scene==='blossoms')for(let q=0;q<4;q++)ellipse(xx-16+q*10,yy+(q%2)*5,3.5,2.8,c.accent);
        }
      }else if(c.scene==='lanterns'){
        line(x-48,y+35,x-48,y-38,c.foliage,5);line(x+48,y+35,x+48,y-38,c.foliage,5);
        line(x-60,y-39,x,y-65,c.foliage,5);line(x,y-65,x+60,y-39,c.foliage,5);
        line(x-50,y-25,x+50,y-25,c.foliage,2);
        for(let j=-1;j<=1;j++){g.fillStyle=c.accent;g.fillRect(x+j*28-4,y-20,8,12);line(x+j*28,y-8,x+j*28,y-2,c.accent,1);}
      }else if(c.scene==='rain'){
        line(x-55,y-8,x+55,y-8,c.foliage,4);
        line(x-45,y-8,x-45,y+34,c.foliage,3);line(x+45,y-8,x+45,y+34,c.foliage,3);
        g.fillStyle=c.foliage;g.beginPath();g.moveTo(x-67,y-8);g.lineTo(x,y-41);g.lineTo(x+67,y-8);g.fill();
      }else if(c.scene==='bamboo'){
        for(let j=0;j<5;j++){
          const xx=x+j*15,top=y-100+(j%3)*15;
          line(xx,y+35,xx+6,top,c.foliage,4);
          for(let yy=top+15;yy<y+25;yy+=24){line(xx-2,yy,xx+8,yy,c.accent,1);line(xx+3,yy,xx+23,yy-13,c.foliage,2);line(xx+3,yy,xx-17,yy-11,c.foliage,2);}
        }
      }else if(c.scene==='ruins'){
        g.strokeStyle=c.foliage;g.lineWidth=10;g.beginPath();g.moveTo(x-40,y+35);g.lineTo(x-40,y-15);g.arc(x,y-15,40,Math.PI,0);g.lineTo(x+40,y+35);g.stroke();
        for(let j=0;j<3;j++){line(x-51,y+10-j*15,x-33,y+10-j*15,c.accent,1);line(x+33,y+10-j*15,x+47,y+10-j*15,c.accent,1);}
      }else if(c.scene==='winter'){
        line(x,y+35,x,y-100,c.foliage,6);
        for(let j=0;j<3;j++){
          const yy=y-100+j*28,w=20+j*13;g.fillStyle=c.foliage;g.beginPath();g.moveTo(x,yy);g.lineTo(x-w,yy+45);g.lineTo(x+w,yy+45);g.fill();
          line(x,yy,x-w*.65,yy+29,c.accent,2);
        }
      }else if(c.scene==='terraces'){
        for(let j=0;j<4;j++){g.globalAlpha=.12+j*.04;g.fillStyle=c.foliage;g.beginPath();g.moveTo(x-120,y+j*16);g.lineTo(x-75,y-13+j*16);g.lineTo(x+60,y-13+j*16);g.lineTo(x+115,y+j*16);g.closePath();g.fill();}
      }
      g.restore();
    }
    // Slow weather is cosmetic. Reduced motion freezes it without hiding cues.
    const count=c.weather==='rain'?28:c.weather==='lanterns'?8:14;
    for(let i=0;i<count;i++){
      const seed=i*193.7+c.index*41;
      const drift=c.weather==='rain'?clock*24:clock*5;
      const x=cam+((seed-cam*.12+drift)%(width+80)+(width+80))%(width+80)-40;
      const y=60+((i*73+clock*(c.weather==='rain'?105:c.weather==='lanterns'?-7:9))%(ground-120)+(ground-120))%(ground-120);
      g.globalAlpha=c.weather==='rain'?.19:.35;g.fillStyle=c.accent;
      if(c.weather==='rain')line(x,y,x-4,y+13,c.accent,1);
      else if(c.weather==='leaves'||c.weather==='petals'){g.save();g.translate(x,y);g.rotate(i+clock*.3);ellipse(0,0,3.5,1.6,c.accent);g.restore();}
      else if(c.weather==='snow')ellipse(x,y,1.8,1.8,c.accent);
      else if(c.weather==='lanterns'){g.fillRect(x,y,5,8);line(x+2,y+8,x+2,y+11,c.accent,1);}
      else if(!['mist','clouds'].includes(c.weather))ellipse(x,y,c.weather==='fireflies'?1.8:1.1,1.3,c.accent);
    }
    if(c.weather==='mist'||c.weather==='clouds'){
      g.globalAlpha=.09;
      for(let i=0;i<3;i++)ellipse(cam+width*(i*.5)-((clock*4)%(width*.5)),c.weather==='mist'?ground-45-i*17:100+i*43,width*.38,12+i*5,c.accent);
    }
    g.restore();
  }
  root.TCVisualChapters={chapters,forLevel,draw};
})(typeof window!=='undefined'?window:globalThis);
