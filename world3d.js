import * as T from './three.module.js';
// One shared WebGL context, shared geometry and materials; visible canvas copies only.
const sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,24),cone=new T.ConeGeometry(1,1,24);
const mats=new Map(),cache=new Map();
const palette={peach:'#efb18c',mint:'#9dc9b3',pink:'#e7a5bb',lilac:'#b7a4db'};
let renderer,failed=false,clock=0,last=0,slots=[],dirty=true,viewAngle=0;
document.addEventListener('click',e=>{const button=e.target.closest('[data-camera]');if(button){viewAngle=button.dataset.camera==='home'?0:Math.max(-.32,Math.min(.32,viewAngle+(button.dataset.camera==='left'?-.16:.16)));}});
function material(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.85}));return mats.get(color);}
function mesh(parent,geo,color,p,s,r){const o=new T.Mesh(geo,material(color));o.position.set(...p);o.scale.set(...s);if(r)o.rotation.set(...r);parent.add(o);return o;}
const ball=(p,c,pos,size)=>mesh(p,sphere,c,pos,size);
const block=(p,c,pos,size)=>mesh(p,box,c,pos,size);
function pet(type='cat',color='peach',stage=0,mood='happy',outfit='none',accessory='none'){
 const g=new T.Group(),fur=palette[color]||palette.peach,cream='#fff0db',ink='#493b43',pink='#f295ad';
 const body=ball(g,fur,[0,.77,0],[.56+stage*.05,.62+stage*.09,.43]);
 ball(g,cream,[0,.77,.35],[.35,.42,.13]);
 const head=new T.Group();head.position.y=1.54+stage*.12;g.add(head);
 ball(head,fur,[0,0,0],[.7-stage*.025,.6-stage*.018,.51]);
 for(const x of [-1,1]){
  if(type==='rabbit'){ball(head,fur,[x*.33,.77,-.06],[.19,.72,.18]);ball(head,pink,[x*.33,.8,.095],[.105,.51,.05]);}
  else if(type==='dog'){ball(head,fur,[x*.64,-.02,-.03],[.23,.5,.22]).rotation.z=x*.22;}
  else if(type==='dragon'){mesh(head,cone,cream,[x*.4,.66,-.08],[.15,.38,.15],[0,0,-x*.2]);ball(head,fur,[x*.65,.15,-.04],[.2,.27,.15]);}
  else{mesh(head,cone,fur,[x*.44,.47,0],[.28,.55,.25],[0,0,-x*.15]);mesh(head,cone,pink,[x*.44,.47,.12],[.15,.32,.05],[0,0,-x*.15]);}
  const eye=ball(head,ink,[x*.26,.055,.474],[.071,mood==='sleep'?.012:.096,.04]);eye.name='eye';
  if(mood!=='sleep')ball(head,'#ffffff',[x*.26-.018,.084,.504],[.022,.026,.009]);
  ball(head,pink,[x*.46,-.135,.42],[.10,.058,.03]);
  ball(head,cream,[x*.10,-.24,.47],[.16,.12,.065]);
 }
 ball(head,ink,[0,-.18,.548],[.064,.043,.025]);
 ball(head,mood==='chew'?'#ce817e':ink,[0,-.315,.53],[mood==='chew'?.1:.045,mood==='surprised'||mood==='tired'?.09:.021,.018]);
 const legs=[];for(const x of [-1,1]){legs.push(ball(g,fur,[x*.39,.19,.16],[.23,.20,.3]));ball(g,cream,[x*.39,.16,.4],[.125,.078,.035]);ball(g,fur,[x*.57,.86,.1],[.18,.32,.2]).rotation.z=x*.25;}
 const tail=new T.Group();tail.position.set(.38,.66,-.2);g.add(tail);
 if(type==='rabbit')ball(tail,cream,[.14,0,-.2],[.22,.22,.22]);
 else{ball(tail,fur,[.32,.1,-.32],[type==='dragon'?.35:.13,type==='dog'?.38:.52,.15]).rotation.z=-.5;if(type==='dragon'){for(let i=0;i<3;i++)mesh(tail,cone,cream,[.3,.1+i*.12,-.46],[.09,.15,.08],[0,0,0]);}}
 if(type==='dragon')for(const x of [-1,1]){ball(g,'#9b8bc2',[x*.68,1,-.27],[.42,.4,.07]).rotation.z=x*.55;for(let i=0;i<3;i++)mesh(g,cone,cream,[0,1.1+i*.17,-.43],[.12,.18,.1]);}
 if(outfit==='hat'){mesh(head,cylinder,'#f4d58d',[0,.58,0],[.77,.055,.61]);mesh(head,cylinder,'#f4d58d',[0,.75,0],[.44,.3,.39]);mesh(head,cylinder,'#cb826d',[0,.63,0],[.45,.065,.4]);}
 if(outfit==='bow'){for(const x of [-1,1])ball(head,'#d97d9e',[.46+x*.14,.42,.43],[.16,.11,.07]);ball(head,'#bd5e82',[.46,.42,.49],[.065,.065,.04]);}
 if(outfit==='cape')ball(g,'#94a2d7',[0,.66,-.3],[.67,.69,.19]);
 if(outfit==='flower')flower(head,.57,.4,.36,.14);
 if(accessory==='scarf')mesh(g,cylinder,'#e48271',[0,1.18+stage*.09,0],[.53,.12,.44]);
 if(accessory==='crown'){mesh(head,cylinder,'#f4cf6d',[0,.58,0],[.4,.1,.32]);for(let i=0;i<5;i++)mesh(head,cone,'#f4cf6d',[(i-2)*.15,.73,.12],[.075,.27,.08]);}
 if(mood==='dirty')for(let i=0;i<4;i++)ball(g,'#b18d70',[(i%2?1:-1)*.26,.6+i*.13,.43],[.085,.05,.023]);
 g.scale.setScalar(.84+stage*.09);g.userData={head,legs,tail,body,mood,type};return g;
}
function flower(g,x,y,z,s=.2){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,'#efabba',[x+Math.cos(a)*s,y+Math.sin(a)*s,z],[s*.72,s*.72,s*.35]);}ball(g,'#f7d582',[x,y,z+s*.2],[s*.58,s*.58,s*.4]);}
function tree(g,x,z,size=1){mesh(g,cylinder,'#a4866f',[x,.75*size,z],[.16*size,1.5*size,.16*size]);for(const [dx,dy]of [[-.4,1.7],[.35,1.9],[0,2.35]])ball(g,'#9ebd94',[x+dx*size,dy*size,z],[.7*size,.65*size,.62*size]);}
function lights(scene){scene.add(new T.HemisphereLight('#fff7e8','#b4c5b1',2.3));const sun=new T.DirectionalLight('#fff1db',3);sun.position.set(-3,6,5);scene.add(sun);}
function world(room,state={},night=false){const g=new T.Group(),outdoor=['garden','park','beach','forest'].includes(room),rug={honey:'#ebcc96',mint:'#a2c4ab',rose:'#dba9b9'}[state.decor?.rug]||'#ebcc96';
 block(g,outdoor?(room==='beach'?'#eddbb1':'#a9cba5'):'#ecd9bb',[0,-.19,0],[11,.3,8]);
 if(outdoor){
  ball(g,'#b8d3b2',[-4,0,-4],[3.7,1.5,1.6]);ball(g,'#c4ddb8',[3.7,.2,-4.4],[4,1.8,1.5]);
  if(room==='beach'){block(g,'#8bc8d7',[0,-.01,-2],[11,.06,2.2]);ball(g,'#fff2cf',[3.6,.15,1],[.6,.16,.45]);mesh(g,cone,'#eba1ae',[-3,1.7,-1],[1.25,.45,1.25]);mesh(g,cylinder,'#b58f70',[-3,.8,-1],[.045,1.6,.045]);}
  else{tree(g,-3.4,-1.7,1.2);tree(g,3.8,-2.2,.9);if(room==='forest'){tree(g,-1.7,-3,1);tree(g,1.7,-3.2,1.35);}else{for(let i=0;i<9;i++)block(g,'#fff0d3',[(i-4)*1.1,.6,-2.9],[.15,1.25,.15]);block(g,'#fff0d3',[0,.8,-2.9],[10,.12,.15]);}}
  for(let i=0;i<9;i++)flower(g,(i%2?-1:1)*(1.5+i*.32),.16,(i%3)*.6-.5,.11);
  ball(g,'#f5d798',[3.3,4,-4],[.47,.47,.2]);
  for(let i=0;i<3;i++)ball(g,'#fff7e9',[-2+i*.6,3.4,-4.3],[.65,.28,.18]);
 }else{
  const wall={kitchen:'#f2dcc0',bath:'#c5e0d8',bedroom:'#ded4e9'}[room];block(g,wall,[0,1.7,-3.35],[11,3.8,.16]);block(g,wall,[-5.3,1.7,-.5],[.16,3.8,6]);
  block(g,'#b7dbe0',[0,2.2,-3.2],[2.2,1.7,.1]);for(const x of [-1.18,1.18])block(g,'#fff0d9',[x,2.2,-3.1],[.12,1.9,.15]);for(const y of [1.3,2.2,3.1])block(g,'#fff0d9',[0,y,-3.1],[2.4,.1,.15]);block(g,'#fff0d9',[0,2.2,-3.1],[.1,1.8,.15]);
  mesh(g,cylinder,rug,[0,.005,.35],[1.85,.04,1.35]);
  if(room==='kitchen'){block(g,'#d2af8a',[-3, .75,-2],[2.5,1.5,1]);block(g,'#fff0d6',[-3,1.55,-2],[2.7,.14,1.1]);block(g,'#cea883',[3, .65,-.9],[1.8,.15,1.3]);for(const x of [2.3,3.7])for(const z of [-1.3,-.5])block(g,'#b78e6b',[x,.3,z],[.13,.6,.13]);mesh(g,cylinder,'#fff0dc',[3,.76,-.9],[.65,.12,.5]);for(let i=0;i<4;i++)ball(g,'#e7aa7c',[2.7+i*.2,.85,-.9],[.12,.09,.13]);}
  if(room==='bath'){ball(g,'#fdf3e4',[3,.5,-1],[1.5,.6,.9]);ball(g,'#9dd6d5',[3,.98,-1],[1.32,.1,.73]);mesh(g,cylinder,'#9cb3a9',[3.8,1.5,-1.6],[.06,1.2,.06]);ball(g,'#f4cf6e',[2.6,1.12,-.8],[.2,.17,.15]);ball(g,'#f4cf6e',[2.75,1.27,-.72],[.13,.13,.12]);block(g,'#acc9c0',[-3,1.8,-3.1],[1.5,1.8,.12]);block(g,'#deeeea',[-3,1.8,-3],[1.25,1.5,.08]);}
  if(room==='bedroom'){const bc={lilac:'#b7a7d4',mint:'#a6cbbc',peach:'#e9b896'}[state.decor?.bed]||'#b7a7d4';block(g,'#b893a8',[3,.4,-1.5],[2.3,.7,2.1]);block(g,'#fff1db',[3,.83,-1.5],[2.2,.2,2]);block(g,bc,[3,.96,-1.1],[2.24,.12,1.35]);ball(g,'#fff8ed',[3,1,-2.2],[.8,.18,.35]);block(g,'#c3a1af',[3,1.1,-2.6],[2.3,1.4,.12]);block(g,'#d7ba91',[-3,.4,-1.5],[1,.8,1]);mesh(g,cylinder,'#b7a285',[-3,1.15,-1.5],[.04,.65,.04]);mesh(g,cone,'#f4d99b',[-3,1.65,-1.5],[.5,.65,.5]);}
  mesh(g,cylinder,'#dca78b',[-4,.35,.6],[.4,.65,.4]);tree(g,-4,.6,.48);
 }
 ball(g,'#eaa885',[-2,.3,1.5],[.3,.3,.3]);block(g,'#e9c59b',[2.5,.3,1.7],[.6,.6,.6]);block(g,'#dc8fa0',[2.5,.3,1.7],[.64,.12,.64]);
 const ornament=state.decor?.ornament||'star';if(ornament==='leaf')ball(g,'#92b585',[1.5,2.4,-3],[.18,.4,.06]);else if(ornament==='rainbow'){for(let i=0;i<3;i++)ball(g,['#eda8ab','#f3d084','#adcba5'][i],[1.6+i*.15,2.4,-3],[.08,.24,.05]);}else mesh(g,cone,'#f2ce75',[1.7,2.45,-3],[.22,.35,.09]);
 if(state.weather==='snow'){for(let i=0;i<3;i++)ball(g,'#fffaf0',[3.6,.26+i*.35,1],[.32-i*.05,.32-i*.05,.32-i*.05]);}
 return g;
}
function record(kind,type,color,stage,mood,outfit,accessory,state){const key=JSON.stringify([kind,type,color,stage,mood,outfit,accessory,state?.decor,state?.weather]);if(cache.has(key))return cache.get(key);const scene=new T.Scene();lights(scene);let actor=null;if(kind!=='pet'){scene.background=new T.Color(['garden','park','beach','forest'].includes(kind)?'#d5e9e5':'#f2e4cf');scene.add(world(kind,state));}if(type){actor=pet(type,color,stage,mood,outfit,accessory);scene.add(actor);}const camera=new T.PerspectiveCamera(kind==='pet'?32:39,1,.1,60);camera.position.set(kind==='pet'?.65:4,kind==='pet'?2.35:5.9,kind==='pet'?5.9:10);camera.lookAt(0,kind==='pet'?1.25:.7,0);const rec={scene,camera,actor,kind};cache.set(key,rec);if(cache.size>80)cache.delete(cache.keys().next().value);return rec;}
function init(){if(renderer||failed)return;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(1);renderer.setClearColor('#ffffff',0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;showFailure();});}catch{failed=true;showFailure();}}
function showFailure(){let el=document.querySelector('#webglFailure');if(!el){el=document.createElement('div');el.id='webglFailure';el.setAttribute('role','alert');el.textContent='Este navegador no puede mostrar el mundo 3D. Activa la aceleración gráfica o abre el juego en un navegador con WebGL 2.';document.querySelector('#app').prepend(el);}}
function config(el){const s=window.Pet3DState?.()||{};const d=el.dataset;const main=d.world==='room',kind=main?(d.room||s.room):d.world||'pet';return {s,kind,type:main?s.pet:d.type,color:main?s.color:d.color,stage:main?window.PetModel.stage(s):Number(d.stage||0),mood:main?(window.Pet3DMood?.()||'happy'):d.mood,outfit:main?s.outfit:(d.outfit||s.outfit||'none'),accessory:main?s.accessory:d.accessory};}
function draw(rec,width,height,time,moving=true,el){init();if(failed)return;renderer.setSize(width,height,false);rec.camera.aspect=width/height;rec.camera.updateProjectionMatrix();
 if(rec.kind!=='pet'){rec.camera.position.x=4+Math.sin(viewAngle)*5;rec.camera.position.y=4.8;rec.camera.position.z=9+Math.cos(viewAngle)*2-2;rec.camera.lookAt(0,.8,0);if(rec.actor)rec.actor.scale.setScalar((.84+Number(window.PetModel.stage(window.Pet3DState()))*.09)*1.6);}
 if(rec.actor){const a=rec.actor,u=a.userData,main=rec.kind!=='pet';a.rotation.y=main?-.14:(moving?Math.sin(time*.65)*.13:0);a.position.y=moving&&u.mood!=='sleep'?Math.sin(time*2)*.025:0;u.body.scale.y=(.62+Number(main?window.PetModel.stage(window.Pet3DState()):el?.dataset.stage||0)*.09)*(1+(moving?Math.sin(time*2)*.016:0));u.tail.rotation.x=moving?Math.sin(time*3)*.18:0;u.head.rotation.z=moving?Math.sin(time*.7)*.045:0;
  const pos=main?el?.closest('#scene')?.querySelector('.pet-position'):null;const walk=pos?.dataset.pose==='walk';if(pos){a.position.x=(parseFloat(pos.style.left)-49)*.065;for(let i=0;i<u.legs.length;i++)u.legs[i].rotation.x=moving&&walk?Math.sin(time*6+i*Math.PI)*.32:0;}if(u.type==='rabbit'&&moving&&pos?.dataset.pose==='hop')a.position.y=Math.abs(Math.sin(time*4))*.18;
  if(el?.closest('.dancing')){a.rotation.y=Math.sin(time*5)*.3;a.position.y=moving?Math.abs(Math.sin(time*5))*.1:0;}
  for(const eye of u.head.children.filter(x=>x.name==='eye'))eye.scale.y=u.mood==='sleep'?.012:(moving&&Math.sin(time*1.3)>.995?.016:.096);
 }
 renderer.render(rec.scene,rec.camera);
}
window.Pet3D={snapshot(type,color,stage,mood,outfit){const r=record('pet',type,color,stage,mood,outfit,'none');draw(r,300,260,0,false);return failed?'':renderer.domElement.toDataURL('image/png');},stats(){return {webgl:!!renderer&&!failed,contexts:renderer?1:0,cachedScenes:cache.size,geometries:renderer?.info.memory.geometries,slots:slots.length};}};
window.ART.pet=(type='cat',color='peach',stage=0,mood='happy',accessory='none',o={})=>`<span class="pet-art pet3d" role="img" aria-label="${{cat:'Gatito',dog:'Perrito',rabbit:'Conejito',dragon:'Dragoncito'}[type]} en 3D" data-world="pet" data-type="${type}" data-color="${color}" data-stage="${stage}" data-mood="${mood}" data-accessory="${accessory}" ${o.outfit?`data-outfit="${o.outfit}"`:''}></span>`;
window.ART.room=(room='garden',night=false)=>`<div class="room-art world3d" data-world="room" data-room="${room}" role="img" aria-label="${{garden:'Jardín',kitchen:'Cocina',bath:'Baño',bedroom:'Dormitorio'}[room]} en 3D"></div>`;
new MutationObserver(()=>dirty=true).observe(document.body,{childList:true,subtree:true});
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;if(now-last<50)return;const dt=Math.min(.1,(now-last)/1000);last=now;const s=window.Pet3DState?.();const reduced=s?.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;const moving=!reduced&&!document.querySelector('.scene-paused')&&!window.Pet3DPaused?.();if(moving)clock+=dt;
 if(dirty){slots=[...document.querySelectorAll('[data-world]')].filter(el=>!el.closest('.scene-pet'));for(const el of slots)if(!el.querySelector('canvas')){const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');el.append(c);}dirty=false;}
 for(const el of slots){const r=el.getBoundingClientRect();if(r.width<1||r.height<1||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;if(document.body.classList.contains('modal-open')&&!el.closest('.modal'))continue;const c=el.querySelector('canvas'),cfg=config(el),rec=record(cfg.kind,cfg.type,cfg.color,cfg.stage,cfg.mood,cfg.outfit,cfg.accessory,cfg.s);const w=Math.max(1,Math.min(900,Math.round(r.width*(devicePixelRatio>1?1.25:1)))),h=Math.max(1,Math.round(w*r.height/r.width));const signature=JSON.stringify([cfg.kind,cfg.type,cfg.color,cfg.stage,cfg.mood,cfg.outfit,cfg.accessory,cfg.s.decor,cfg.s.weather,w,h,viewAngle]);if(!moving&&el._drawn===signature)continue;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}draw(rec,w,h,clock,moving,el);if(!failed){const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(renderer.domElement,0,0,w,h);el._drawn=signature;}}
}
requestAnimationFrame(frame);

