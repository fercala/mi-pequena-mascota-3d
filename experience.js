'use strict';
window.PetExperience=(()=>{
  const guide=[
    {care:'love',title:'Una caricia para empezar',text:'Toca el corazón para darle cariño.'},
    {care:'food',title:'¡Hora de comer!',text:'Toca el plato y dale cuatro bocados.'},
    {care:'bath',title:'Un baño divertido',text:'Toca la bañera. Usa jabón, agua y toalla.'},
    {care:'play',title:'¡Vamos a jugar!',text:'Toca la pelota y elige un juego.'},
    {care:'sleep',title:'Dulces sueños',text:'Toca la luna. Elige un peluche, arrópala y apaga la luz.'}
  ];
  const personalities={
    cat:{label:'Curioso y mimoso',phrase:'¡Miau! Me encantan las caricias y mi ovillo.',gesture:'pounce',symbol:'🧶',toy:'Ovillo saltarín',sound:[150,165,145]},
    dog:{label:'Alegre y juguetón',phrase:'¡Guau! ¡Qué alegría jugar contigo!',gesture:'wag',symbol:'🦴',toy:'Huesito de juguete',sound:[320,240,320]},
    rabbit:{label:'Suave y saltarín',phrase:'¡Hop, hop! Mira cómo saltan mis patitas.',gesture:'hop',symbol:'🥕',toy:'Zanahoria blandita',sound:[740,890,740]},
    dragon:{label:'Soñador y mágico',phrase:'¡Achís! Un estornudo lleno de estrellas.',gesture:'sneeze',symbol:'✨',toy:'Estrellita mágica',sound:[523,784,1046]}
  };
  const catalog={
    rug:[{id:'honey',label:'Sol de miel',color:'#efc897',light:'#fff2d0',line:'#dfb47d'},{id:'mint',label:'Hoja de menta',color:'#97bca7',light:'#dcecd7',line:'#7f9f8a'},{id:'rose',label:'Nube rosada',color:'#e1a5ad',light:'#ffe1df',line:'#c48797'}],
    bed:[{id:'lilac',label:'Sueños lilas',color:'#b7aed2',light:'#d4cae6'},{id:'mint',label:'Sueños de menta',color:'#9dc6b8',light:'#d9ede1'},{id:'peach',label:'Sueños de melocotón',color:'#e8b591',light:'#ffe1b8'}],
    ornament:[{id:'star',label:'Estrella',symbol:'⭐'},{id:'rainbow',label:'Arcoíris',symbol:'🌈'},{id:'leaf',label:'Hojita',symbol:'🌿'}]
  };
  const plushes=[{id:'bear',label:'Osito',symbol:'🧸'},{id:'bunny',label:'Conejito',symbol:'🐰'},{id:'star',label:'Estrellita',symbol:'⭐'}];
  const blankets=[{id:'cloud',label:'Nubes',color:'#a9bfd9',symbol:'☁️'},{id:'hearts',label:'Corazones',color:'#dda4b1',symbol:'♡'},{id:'leaves',label:'Hojitas',color:'#a8c7a3',symbol:'🌿'}];
  const surprises={garden:[{id:'flower',label:'Flor sorpresa',symbol:'🌷',title:'¡La flor se despierta!',text:'Toca sus pétalos y mira cómo se abre.',x:82,y:61},{id:'gift',label:'Caja sorpresa',symbol:'🎁',title:'Un regalo pequeñito',text:'Toca la caja para descubrir qué hay dentro.',x:22,y:73}],kitchen:[{id:'bird',label:'Pajarito en la ventana',symbol:'🐦',title:'¡Pío, pío!',text:'Toca al pajarito para saludarlo.',x:56,y:22},{id:'fruit',label:'Frutero musical',symbol:'🍐',title:'Frutas que cantan',text:'Toca una fruta y escucha su nota.',x:24,y:55}],bath:[{id:'duck',label:'Patito del baño',symbol:'🦆',title:'¡Cuac, cuac!',text:'Toca el agua para que el patito salte.',x:81,y:62},{id:'rainbow',label:'Arcoíris de burbujas',symbol:'🫧',title:'Un arcoíris pequeñito',text:'Toca las burbujas y descubre sus colores.',x:25,y:39}],bedroom:[{id:'stars',label:'Estrellas del dormitorio',symbol:'⭐',title:'Estrellitas brillantes',text:'Toca las estrellas para encenderlas.',x:24,y:28},{id:'musicbox',label:'Cajita de música',symbol:'🎵',title:'Una melodía para soñar',text:'Toca la cajita para escucharla.',x:77,y:70}]};
  function fresh(){return {tutorial:{step:0,active:true},decor:{rug:'honey',bed:'lilac',ornament:'star'},bedtime:{plush:'bear',blanket:'cloud'},discoveries:[]};}
  function normalize(raw,hasPet){
    const s=fresh();const t=raw?.tutorial;
    if(!t&&hasPet)s.tutorial={step:5,active:false};
    else if(t){s.tutorial.step=Number.isInteger(t.step)?Math.max(0,Math.min(5,t.step)):0;s.tutorial.active=t.active===true&&s.tutorial.step<5;}
    for(const k of Object.keys(catalog))if(catalog[k].some(v=>v.id===raw?.decor?.[k]))s.decor[k]=raw.decor[k];
    if(plushes.some(v=>v.id===raw?.bedtime?.plush))s.bedtime.plush=raw.bedtime.plush;
    if(blankets.some(v=>v.id===raw?.bedtime?.blanket))s.bedtime.blanket=raw.bedtime.blanket;
    const ids=Object.values(surprises).flat().map(v=>v.id);if(Array.isArray(raw?.discoveries))s.discoveries=[...new Set(raw.discoveries.filter(v=>ids.includes(v)))];
    return s;
  }
  function advance(s,care){if(!s.tutorial?.active||guide[s.tutorial.step]?.care!==care)return false;s.tutorial.step++;if(s.tutorial.step>=5)s.tutorial.active=false;return true;}
  function setDecor(s,category,id){if(!catalog[category]?.some(v=>v.id===id))return false;s.decor[category]=id;return true;}
  function discover(s,id){if(!Object.values(surprises).flat().some(v=>v.id===id)||s.discoveries.includes(id))return false;s.discoveries.push(id);return true;}
  function ritual(){return {step:0,tucked:false,lightOff:false};}
  function choosePlush(s,r,id){if(r.step!==0||!plushes.some(v=>v.id===id))return false;s.bedtime.plush=id;r.step=1;return true;}
  function chooseBlanket(s,r,id){if(r.step!==1||!blankets.some(v=>v.id===id))return false;s.bedtime.blanket=id;return true;}
  function tuck(r){if(r.step!==1)return false;r.tucked=true;r.step=2;return true;}
  function lightsOff(r){if(r.step!==2||!r.tucked||r.lightOff)return false;r.lightOff=true;r.step=3;return true;}
  function decorate(svg,s){
    const rug=catalog.rug.find(v=>v.id===s.decor?.rug)||catalog.rug[0],bed=catalog.bed.find(v=>v.id===s.decor?.bed)||catalog.bed[0];
    for(const [a,b]of [['#fff2d0',rug.light],['#efc897',rug.color],['#e3bc8d',rug.line],['#b7aed2',bed.color],['#d4cae6',bed.light]])svg=svg.replaceAll(a,b);
    const ornament=catalog.ornament.find(v=>v.id===s.decor?.ornament)||catalog.ornament[0];
    const frame=s.room==='garden'?'<path d="M0 22l70-17 2 71-69 14z" fill="#f7ebd3" stroke="#c1a784" stroke-width="3"/>':'<rect width="70" height="76" rx="14" fill="#fff4dd" stroke="#d4bca0" stroke-width="3"/>';
    return svg.replace('</svg>',`<g transform="translate(${s.room==='garden'?632:586} ${s.room==='garden'?275:174})">${frame}<text x="35" y="49" text-anchor="middle" font-size="36" fill="#9e8e75">${ornament.symbol}</text></g></svg>`);
  }
  function preview(svg,s){return decorate(svg,s).replace(/\sdata-scene-action="[^"]*"/g,'').replace(/\srole="button"/g,'').replace(/\stabindex="0"/g,'');}
  return {fresh,normalize,guide,personalities,catalog,plushes,blankets,surprises,advance,setDecor,discover,ritual,choosePlush,chooseBlanket,tuck,lightsOff,decorate,preview};
})();
