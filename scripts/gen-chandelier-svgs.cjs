#!/usr/bin/env node
// Generates 8 unique chandelier SVG art files for the DomeGallery
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../public/gallery');

const svgs = [

// 1. Classical tiered chandelier — viewed from below
{ name: 'chan-classical.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#1a1208"/>
    <stop offset="100%" stop-color="#080500"/>
  </radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f5d080" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#c8860a" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="glow-f"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<ellipse cx="400" cy="350" rx="280" ry="40" fill="url(#glow)" filter="url(#blur)"/>
<!-- Rings -->
<ellipse cx="400" cy="300" rx="260" ry="22" fill="none" stroke="#c8a040" stroke-width="1.5" opacity="0.7"/>
<ellipse cx="400" cy="300" rx="180" ry="16" fill="none" stroke="#c8a040" stroke-width="1.2" opacity="0.6"/>
<ellipse cx="400" cy="300" rx="100" ry="10" fill="none" stroke="#e8c060" stroke-width="1.5" opacity="0.8"/>
<!-- Arms -->
${Array.from({length:12},(_,i)=>{
  const a=i/12*Math.PI*2; const x1=400+Math.cos(a)*100; const y1=300+Math.sin(a)*10;
  const x2=400+Math.cos(a)*260; const y2=300+Math.sin(a)*22;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b8903a" stroke-width="1" opacity="0.5"/>`;
}).join('')}
<!-- Crystal drops outer ring -->
${Array.from({length:18},(_,i)=>{
  const a=i/18*Math.PI*2; const x=400+Math.cos(a)*260; const y=300+Math.sin(a)*22;
  const len=40+Math.random()*60; return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+len}" stroke="#e8d090" stroke-width="0.8" opacity="0.6"/>
  <ellipse cx="${x}" cy="${y+len+4}" rx="2.5" ry="4" fill="#f5e0a0" opacity="0.9"/>`;
}).join('')}
<!-- Crystal drops mid ring -->
${Array.from({length:12},(_,i)=>{
  const a=i/12*Math.PI*2; const x=400+Math.cos(a)*180; const y=300+Math.sin(a)*16;
  const len=30+Math.random()*50; return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+len}" stroke="#e8d090" stroke-width="0.8" opacity="0.7"/>
  <ellipse cx="${x}" cy="${y+len+4}" rx="2" ry="3.5" fill="#ffe8b0" opacity="0.95"/>`;
}).join('')}
<!-- Central pendant -->
<line x1="400" y1="100" x2="400" y2="300" stroke="#c8a040" stroke-width="2" opacity="0.8"/>
<ellipse cx="400" cy="305" rx="18" ry="12" fill="#c8a040" opacity="0.9"/>
<ellipse cx="400" cy="320" rx="10" ry="8" fill="#e8c060"/>
<ellipse cx="400" cy="336" rx="6" ry="10" fill="#f5d080" filter="url(#glow-f)"/>
<!-- Candle arms with flames -->
${Array.from({length:8},(_,i)=>{
  const a=i/8*Math.PI*2; const x=400+Math.cos(a)*180; const y=300+Math.sin(a)*16;
  return `<ellipse cx="${x}" cy="${y-10}" rx="3" ry="8" fill="#ffe070" filter="url(#glow-f)" opacity="0.85"/>`;
}).join('')}
</svg>` },

// 2. Modern geometric — crystal prism array
{ name: 'chan-prism.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#0d1018"/>
    <stop offset="100%" stop-color="#050608"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f0d060"/>
    <stop offset="50%" stop-color="#c89030"/>
    <stop offset="100%" stop-color="#805010"/>
  </linearGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<!-- Horizontal rail -->
<rect x="120" y="220" width="560" height="6" fill="url(#gold)" rx="3"/>
<rect x="80" y="216" width="640" height="2" fill="#f0d060" opacity="0.4"/>
<!-- Vertical rods -->
${Array.from({length:11},(_,i)=>{
  const x=140+i*52; const h=120+Math.abs(Math.sin(i/10*Math.PI))*280;
  return `<rect x="${x-1}" y="226" width="2" height="${h}" fill="#c89030" opacity="0.8"/>`;
}).join('')}
<!-- Prisms at rod ends -->
${Array.from({length:11},(_,i)=>{
  const x=140+i*52; const h=120+Math.abs(Math.sin(i/10*Math.PI))*280; const y=226+h;
  return `<polygon points="${x},${y} ${x-8},${y+20} ${x},${y+40} ${x+8},${y+20}" fill="#d4c880" opacity="0.9" filter="url(#gf)"/>
  <polygon points="${x},${y} ${x-8},${y+20} ${x+8},${y+20}" fill="#f0e8a0" opacity="0.7"/>`;
}).join('')}
<!-- Top decorative bar -->
<rect x="300" y="100" width="200" height="4" fill="url(#gold)" rx="2"/>
<rect x="380" y="104" width="2" height="116" fill="#c89030"/>
<!-- Central ceiling rose -->
<ellipse cx="400" cy="210" rx="30" ry="12" fill="#b87820" opacity="0.9"/>
<ellipse cx="400" cy="210" rx="20" ry="8" fill="#e0a830" opacity="0.7"/>
</svg>` },

// 3. Baroque swirl — ornate arms
{ name: 'chan-baroque.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#120d08"/>
    <stop offset="100%" stop-color="#060402"/>
  </radialGradient>
  <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f0c840" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#c07010" stop-opacity="0"/>
  </radialGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<ellipse cx="400" cy="380" rx="240" ry="60" fill="url(#center-glow)"/>
<!-- Ornate S-curve arms -->
${Array.from({length:6},(_,i)=>{
  const a=i/6*Math.PI*2;
  const cx1=400+Math.cos(a)*80; const cy1=360+Math.sin(a)*30;
  const cx2=400+Math.cos(a)*200; const cy2=360+Math.sin(a)*60;
  const ex=400+Math.cos(a)*260; const ey=360+Math.sin(a)*70;
  return `<path d="M400,340 C${cx1},${cy1-40} ${cx2},${cy2-20} ${ex},${ey}" fill="none" stroke="#c89030" stroke-width="4" opacity="0.8"/>
  <path d="M400,340 C${cx1},${cy1-40} ${cx2},${cy2-20} ${ex},${ey}" fill="none" stroke="#f0d060" stroke-width="1.5" opacity="0.5"/>
  <circle cx="${ex}" cy="${ey}" r="5" fill="#e8b820" filter="url(#gf)"/>
  <!-- Crystal cluster at arm end -->
  ${Array.from({length:5},(_,j)=>{
    const dx=(j-2)*6; const dy=j%2*10;
    return `<line x1="${ex}" y1="${ey}" x2="${ex+dx}" y2="${ey+30+dy}" stroke="#e0d090" stroke-width="0.8" opacity="0.7"/>
    <ellipse cx="${ex+dx}" cy="${ey+34+dy}" rx="2" ry="3" fill="#f8f0c0" opacity="0.9"/>`;
  }).join('')}`;
}).join('')}
<!-- Center column -->
<rect x="396" y="160" width="8" height="180" fill="#b87820" opacity="0.9"/>
<ellipse cx="400" cy="335" rx="25" ry="12" fill="#c89030"/>
<ellipse cx="400" cy="340" rx="15" ry="8" fill="#e8b820" opacity="0.8"/>
<!-- Hanging centre crystal -->
<line x1="400" y1="352" x2="400" y2="430" stroke="#d0b850" stroke-width="1.5" opacity="0.7"/>
<polygon points="400,430 388,455 400,480 412,455" fill="#f0d870" opacity="0.9" filter="url(#gf)"/>
<!-- Smaller hanging crystals -->
${Array.from({length:12},(_,i)=>{
  const a=i/12*Math.PI*2; const r=130; const x=400+Math.cos(a)*r; const y=360+Math.sin(a)*45;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+25}" stroke="#d0b040" stroke-width="0.8" opacity="0.6"/>
  <ellipse cx="${x}" cy="${y+29}" rx="2.5" ry="4" fill="#f0e090" opacity="0.85"/>`;
}).join('')}
</svg>` },

// 4. Sputnik starburst — mid-century modern
{ name: 'chan-sputnik.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="45%" r="55%">
    <stop offset="0%" stop-color="#0e0c10"/>
    <stop offset="100%" stop-color="#060508"/>
  </radialGradient>
  <radialGradient id="core" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fff8d0" stop-opacity="0.9"/>
    <stop offset="60%" stop-color="#e0a830" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#c07010" stop-opacity="0"/>
  </radialGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<!-- Spokes — varying lengths and angles -->
${Array.from({length:24},(_,i)=>{
  const a=i/24*Math.PI*2;
  const len=100+Math.sin(i*2.5)*80+Math.cos(i*1.3)*60;
  const x1=400+Math.cos(a)*18; const y1=480+Math.sin(a)*18;
  const x2=400+Math.cos(a)*len; const y2=480+Math.sin(a)*len;
  const bx=400+Math.cos(a)*(len-10); const by=480+Math.sin(a)*(len-10);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c8a030" stroke-width="${1+Math.sin(i)*0.5}" opacity="0.85"/>
  <circle cx="${x2}" cy="${y2}" r="${2+Math.abs(Math.sin(i*0.7))*4}" fill="#ffe080" filter="url(#gf)" opacity="0.9"/>`;
}).join('')}
<!-- Central sphere -->
<circle cx="400" cy="480" r="28" fill="url(#core)" filter="url(#gf)"/>
<circle cx="400" cy="480" r="18" fill="#f0d060" opacity="0.9"/>
<circle cx="400" cy="480" r="10" fill="#fff8d0"/>
<!-- Ceiling cord -->
<line x1="400" y1="160" x2="400" y2="452" stroke="#b88020" stroke-width="3" opacity="0.8"/>
<ellipse cx="400" cy="456" rx="12" ry="6" fill="#c89030"/>
</svg>` },

// 5. Cascading teardrops — Art Nouveau
{ name: 'chan-cascade.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="25%" r="75%">
    <stop offset="0%" stop-color="#100c08"/>
    <stop offset="100%" stop-color="#050403"/>
  </radialGradient>
  <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#f8f0c8"/>
    <stop offset="50%" stop-color="#d4a030"/>
    <stop offset="100%" stop-color="#8a5010"/>
  </linearGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<!-- Cascading column groups -->
${Array.from({length:9},(_,col)=>{
  const cx=120+col*70; const startY=180+Math.abs(col-4)*30;
  const count=3+Math.floor(Math.abs(col-4));
  return Array.from({length:count},(_,row)=>{
    const y=startY+row*90; const wobble=(Math.sin(col*1.3+row)*8);
    return `<line x1="${cx+wobble}" y1="${y}" x2="${cx+wobble}" y2="${y+65}" stroke="#c8a030" stroke-width="0.9" opacity="0.7"/>
    <path d="M${cx+wobble},${y+65} Q${cx+wobble-10},${y+80} ${cx+wobble},${y+90} Q${cx+wobble+10},${y+80} ${cx+wobble},${y+65}" fill="url(#crystal)" opacity="0.9" filter="url(#gf)"/>`;
  }).join('');
}).join('')}
<!-- Top horizontal bar -->
<rect x="100" y="175" width="600" height="5" fill="#b87820" rx="2.5"/>
<!-- Ceiling mount -->
<rect x="370" y="100" width="60" height="5" fill="#c89030" rx="2.5"/>
<line x1="400" y1="105" x2="400" y2="175" stroke="#c89030" stroke-width="3"/>
</svg>` },

// 6. Ring chandelier — contemporary
{ name: 'chan-ring.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="45%" r="55%">
    <stop offset="0%" stop-color="#0c0e12"/>
    <stop offset="100%" stop-color="#060708"/>
  </radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#f0e090" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#c08020" stop-opacity="0"/>
  </radialGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<ellipse cx="400" cy="460" rx="280" ry="60" fill="url(#glow)"/>
<!-- Three concentric rings -->
<ellipse cx="400" cy="430" rx="270" ry="55" fill="none" stroke="#c8a030" stroke-width="8" opacity="0.85"/>
<ellipse cx="400" cy="430" rx="270" ry="55" fill="none" stroke="#f0d060" stroke-width="1.5" opacity="0.5"/>
<ellipse cx="400" cy="420" rx="180" ry="36" fill="none" stroke="#c8a030" stroke-width="6" opacity="0.75"/>
<ellipse cx="400" cy="420" rx="180" ry="36" fill="none" stroke="#f0d060" stroke-width="1" opacity="0.4"/>
<ellipse cx="400" cy="410" rx="90" ry="18" fill="none" stroke="#c8a030" stroke-width="4" opacity="0.7"/>
<!-- Suspension cables -->
${Array.from({length:6},(_,i)=>{
  const a=i/6*Math.PI*2;
  const x1=400+Math.cos(a)*270; const y1=430+Math.sin(a)*55;
  return `<line x1="${x1}" y1="${y1}" x2="400" y2="200" stroke="#a87020" stroke-width="1.5" opacity="0.6"/>`;
}).join('')}
<!-- Pendant drops around outer ring -->
${Array.from({length:28},(_,i)=>{
  const a=i/28*Math.PI*2;
  const x=400+Math.cos(a)*270; const y=430+Math.sin(a)*55;
  const dl=20+Math.sin(i*2.1)*18;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+dl}" stroke="#d0b040" stroke-width="0.8" opacity="0.7"/>
  <ellipse cx="${x}" cy="${y+dl+3}" rx="2" ry="3.5" fill="#ffe090" opacity="0.9" filter="url(#gf)"/>`;
}).join('')}
<!-- Mid ring drops -->
${Array.from({length:18},(_,i)=>{
  const a=i/18*Math.PI*2;
  const x=400+Math.cos(a)*180; const y=420+Math.sin(a)*36;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+18}" stroke="#d0b040" stroke-width="0.7" opacity="0.65"/>
  <ellipse cx="${x}" cy="${y+21}" rx="1.8" ry="3" fill="#ffe090" opacity="0.85"/>`;
}).join('')}
<!-- Ceiling canopy -->
<ellipse cx="400" cy="200" rx="50" ry="14" fill="#b87820" opacity="0.9"/>
<ellipse cx="400" cy="197" rx="36" ry="10" fill="#d09030" opacity="0.7"/>
</svg>` },

// 7. Crystal cluster — organic mineral
{ name: 'chan-cluster.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#0e0a0c"/>
    <stop offset="100%" stop-color="#050304"/>
  </radialGradient>
  <linearGradient id="cry1" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="#f5eec0"/>
    <stop offset="40%" stop-color="#d4a840"/>
    <stop offset="100%" stop-color="#7a5010" stop-opacity="0.6"/>
  </linearGradient>
  <linearGradient id="cry2" x1="0.6" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#e8dca0"/>
    <stop offset="50%" stop-color="#b87830"/>
    <stop offset="100%" stop-color="#5a3808" stop-opacity="0.5"/>
  </linearGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<!-- Crystal shards radiating downward -->
${[
  {x:400,y:280,w:22,h:180,r:-5,g:'cry1'},{x:360,y:300,w:16,h:150,r:-18,g:'cry2'},
  {x:440,y:295,w:18,h:160,r:15,g:'cry1'},{x:330,y:320,w:14,h:120,r:-30,g:'cry2'},
  {x:470,y:315,w:15,h:130,r:25,g:'cry1'},{x:310,y:340,w:12,h:100,r:-40,g:'cry2'},
  {x:490,y:335,w:13,h:110,r:35,g:'cry1'},{x:380,y:310,w:10,h:130,r:8,g:'cry2'},
  {x:420,y:305,w:11,h:140,r:-10,g:'cry1'},{x:350,y:335,w:9,h:100,r:-22,g:'cry2'},
  {x:450,y:330,w:10,h:105,r:20,g:'cry1'},{x:395,y:320,w:8,h:80,r:3,g:'cry2'},
].map(({x,y,w,h,r,g})=>
  `<polygon points="${x},${y} ${x-w/2},${y+h} ${x+w/2},${y+h}" fill="url(#${g})" transform="rotate(${r} ${x} ${y})" filter="url(#gf)" opacity="0.92"/>`
).join('')}
<!-- Glow at center -->
<ellipse cx="400" cy="280" rx="40" ry="25" fill="#f0d860" opacity="0.25" filter="url(#gf)"/>
<!-- Ceiling stem -->
<rect x="394" y="120" width="12" height="160" fill="#b87820" rx="4"/>
<ellipse cx="400" cy="270" rx="30" ry="16" fill="#c89030" opacity="0.9"/>
</svg>` },

// 8. Art Deco fan — geometric opulence
{ name: 'chan-deco.svg', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="bg" cx="50%" cy="30%" r="70%">
    <stop offset="0%" stop-color="#0f0d08"/>
    <stop offset="100%" stop-color="#060504"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f8e070"/>
    <stop offset="50%" stop-color="#c89030"/>
    <stop offset="100%" stop-color="#7a5018"/>
  </linearGradient>
  <filter id="gf"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="800" height="1000" fill="url(#bg)"/>
<!-- Fan blades -->
${Array.from({length:7},(_,i)=>{
  const a=(i-3)/6*0.9; const len=220;
  const x2=400+Math.sin(a)*len; const y2=340+Math.cos(a)*len;
  const bx=400+Math.sin(a)*60; const by=340+Math.cos(a)*60;
  return `<polygon points="400,340 ${bx-12*Math.cos(a)},${by+12*Math.sin(a)} ${x2-14*Math.cos(a)},${y2+14*Math.sin(a)} ${x2+14*Math.cos(a)},${y2-14*Math.sin(a)} ${bx+12*Math.cos(a)},${by-12*Math.sin(a)}" fill="url(#gold)" opacity="${0.4+i*0.05}"/>
  <line x1="${bx}" y1="${by}" x2="${x2}" y2="${y2}" stroke="#f0d060" stroke-width="1" opacity="0.5"/>`;
}).join('')}
<!-- Diamond studs along fan edge -->
${Array.from({length:7},(_,i)=>{
  const a=(i-3)/6*0.9; const len=220;
  const x=400+Math.sin(a)*len; const y=340+Math.cos(a)*len;
  return `<polygon points="${x},${y-10} ${x-8},${y} ${x},${y+10} ${x+8},${y}" fill="#f8f0b0" filter="url(#gf)" opacity="0.95"/>`;
}).join('')}
<!-- Center arc frame -->
<path d="M 182,340 A 218 218 0 0 1 618,340" fill="none" stroke="#c89030" stroke-width="4"/>
<path d="M 210,340 A 190 190 0 0 1 590,340" fill="none" stroke="#f0d060" stroke-width="1.5" opacity="0.6"/>
<!-- Pendant drops from arc -->
${Array.from({length:17},(_,i)=>{
  const a=((i/16)-0.5)*Math.PI*0.9; const r=218;
  const x=400+Math.sin(a)*r; const y=340-Math.cos(a)*r;
  const dl=30+Math.sin(i)*20;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+dl}" stroke="#d0b040" stroke-width="0.9" opacity="0.7"/>
  <ellipse cx="${x}" cy="${y+dl+3}" rx="2.5" ry="4" fill="#f8e890" opacity="0.9"/>`;
}).join('')}
<!-- Top mount + stem -->
<rect x="390" y="120" width="20" height="220" fill="#b87820" rx="4"/>
<rect x="380" y="120" width="40" height="8" fill="#d09030" rx="2"/>
<ellipse cx="400" cy="340" rx="30" ry="14" fill="#c89030" opacity="0.9"/>
<ellipse cx="400" cy="340" rx="18" ry="9" fill="#e8b830" opacity="0.8"/>
</svg>` },

];

svgs.forEach(({ name, svg }) => {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('wrote', name);
});
console.log('Done — 8 chandelier SVGs generated.');
