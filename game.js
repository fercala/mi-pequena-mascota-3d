'use strict';
(() => {
  const $=(s)=>document.querySelector(s), A=window.ART, M=window.PetModel, C=window.CareSessions, X=window.PetExperience, KEY='mi-pequena-mascota-3d-v1';
  const app=$('#app'),overlay=$('#overlayRoot');
  let state=M.fresh(), storageOK=true;
  let adventures=null;
  try{const raw=localStorage.getItem(KEY);if(raw)state=M.normalize(JSON.parse(raw));}catch{storageOK=false;}
  let selection=state.pet||'cat',color=state.color,name=state.name||'Mimo';
  let screen=state.pet?'game':'choose',modalKind='',paused=false,mood='happy',busy=false,modalCleanup=null;
  let holdTimer=null,toastTimer=null,lastTick=performance.now(),saveTimer=0,audio=null,musicTimer=null;
  let bathSession=null,mealSession=null,chewing=false,miniCount=0,miniGame='',hiddenToy=0,sleepSummary=null;
  const actor={x:49,y:16,pose:'sit',next:performance.now()+5000,turn:0};
  let actorExpression='',actorDirty=false,moodTimer=null;
  let lastGuideVoice=-1,guideStamp='',ritualSession=null,decorCategory='rug',toyTouches=0,surpriseSession=null;
  const types={cat:{label:'Gatito',desc:'Un pequeño ronroneo',name:'Mimo',color:'peach'},dog:{label:'Perrito',desc:'Tu amigo más alegre',name:'Chispa',color:'mint'},rabbit:{label:'Conejito',desc:'Suave como una nube',name:'Nube',color:'pink'},dragon:{label:'Dragoncito',desc:'Un poquito de magia',name:'Dino',color:'lilac'}};
  const stages=['Bebé','Pequeña','Joven','Adulta'],roomLabels={garden:'Jardín',kitchen:'Cocina',bath:'Baño',bedroom:'Dormitorio'};
  const cares={food:['food','Comer','kitchen'],bath:['bath','Bañar','bath'],sleep:['sleep','Dormir','bedroom'],play:['play','Jugar','garden'],love:['love','Cariño',null]};
  const stickers=[['welcome','🐾','Nuevo amigo'],['food','🍎','¡Qué rico!'],['bath','🫧','Limpita'],['love','💗','Mucho cariño'],['ball','⚽','A la pelota'],['bubbles','🌈','Burbujitas'],['hide','🧸','Lo encontré'],['day1','☀️','Un bonito día'],['small','🌱','Voy creciendo'],['young','🦋','Una aventura'],['adult','👑','Ya soy grande'],['allcare','⭐','Todos los cuidados']];
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));adventures?.persistProfiles();}catch{if(storageOK){storageOK=false;toast('Este navegador no permite guardar. La partida seguirá abierta.');}}}
  function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3200);}
  function speak(text){if(!state.settings.sound||!state.settings.voice||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=.88;u.pitch=1.15;u.volume=state.settings.voiceVolume??.8;const voice=speechSynthesis.getVoices().find(v=>v.lang==='es-ES')||speechSynthesis.getVoices().find(v=>v.lang.startsWith('es'));if(voice)u.voice=voice;speechSynthesis.speak(u);}catch{}}
  function tone(kind='tap'){
    if(!state.settings.sound||state.settings.effectsVolume===0)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const notes=kind==='success'?[523,659,784]:kind==='pop'?[650,950]:kind==='lullaby'?[392,440,392,330,349,330,294]:kind==='pet'?X.personalities[state.pet].sound:[440];notes.forEach((hz,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+i*(kind==='lullaby'?.38:.13);osc.type=kind==='pet'&&state.pet==='dog'?'triangle':'sine';osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime((kind==='lullaby'?.025:.045)*(state.settings.effectsVolume??.8),t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+(kind==='lullaby'?.5:.25));osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+(kind==='lullaby'?.52:.26));});}catch{}
  }
  function music(){clearInterval(musicTimer);musicTimer=null;if(state.settings.music&&state.settings.musicVolume!==0&&state.settings.sound&&!paused&&!document.hidden&&screen==='game'&&!adventures?.blocked()&&!['settings','pause','adultgate','sessionEnd','sessionRest','sessionAdult'].includes(modalKind)){let i=0;const notes=[392,440,523,440,349,392,440,0];musicTimer=setInterval(()=>{if(!audio||audio.state!=='running')return;const n=notes[i++%notes.length];if(!n)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=n;g.gain.setValueAtTime(.035*(state.settings.musicVolume??.4),audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.5);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.55);}catch{}},650);}}
  function syncTop(){
    $('#brandIcon').innerHTML=A.icon('paw');$('#soundBtn').innerHTML=A.icon(state.settings.sound?'sound':'muted');
    $('#soundBtn').setAttribute('aria-label',state.settings.sound?'Desactivar sonido':'Activar sonido');$('#soundBtn').setAttribute('aria-pressed',String(state.settings.sound));
    $('#adultIcon').innerHTML=A.icon('gear');$('#pauseBtn').innerHTML=A.icon(paused?'resume':'pause');$('#pauseBtn').hidden=screen!=='game';
    $('#pauseBtn').setAttribute('aria-label',paused?'Continuar':'Pausar');
  }
  function render(){syncTop();if(screen==='choose')choose();else if(screen==='name')naming();else game();adventures?.mount();}
  function choose(){
    app.innerHTML=`<section class="welcome"><div class="eyebrow">Una casita llena de cariño</div><h1>Un pequeño amigo.<br><em>Una gran aventura.</em><span class="title-star">✦</span></h1><p class="subtext">Elige a tu mascota y acompáñala mientras crece.</p></section><section class="pet-grid" aria-label="Elige una mascota">${Object.entries(types).map(([id,t])=>`<button class="pet-card ${selection===id?'selected':''}" data-pick="${id}" aria-pressed="${selection===id}"><span class="pick-circle">${selection===id?A.icon('check'):''}</span>${A.pet(id,t.color,0)}<strong>${t.label}</strong><small>${t.desc}</small></button>`).join('')}</section><div class="choose-footer"><button class="primary" data-do="chooseNext">Este será mi amigo ${A.icon('arrow')}</button><p class="tiny-note">${A.icon('love')} Cada mascota es única. Todas quieren mucho cariño.</p></div><div class="onboard-summary"><span>${A.icon('food')} Cuida y juega</span><span>${A.icon('garden')} Mira cómo crece</span><span>${A.icon('sun')} A tu ritmo</span></div>`;
  }
  function naming(){
    app.innerHTML=`<button class="back-link" data-do="backChoose">${A.icon('back')} Elegir otro amigo</button><section class="name-layout"><div class="name-preview" id="namePreview">${A.pet(selection,color)}</div><div class="name-tools"><h2>¿Cómo se llama?</h2><p class="subtext">Un nombre bonito para tu ${types[selection].label.toLowerCase()}.</p><label for="petName">Su nombre</label><input id="petName" class="name-input" type="text" maxlength="16" value="${esc(name)}" autocomplete="off" spellcheck="false" aria-label="Nombre de la mascota"><div class="suggestions">${['Mimo','Chispa','Nube','Dino'].map(n=>`<button data-name="${n}">${n}</button>`).join('')}</div><div class="keyboard" aria-label="Teclado para escribir con toques">${'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map(l=>`<button data-letter="${l}">${l}</button>`).join('')}<button class="wide" data-do="erase">⌫ Borrar</button><button class="wide" data-letter=" ">Espacio</button></div><label>Elige su color</label><div class="palette">${Object.entries(A.palettes).map(([id,p])=>`<button class="color-dot ${id===color?'selected':''}" style="background:${p[0]}" data-color="${id}" aria-label="Color ${ {peach:'melocotón',pink:'rosa',mint:'menta',lilac:'lila'}[id]}" aria-pressed="${id===color}">${id===color?A.icon('check'):''}</button>`).join('')}</div><button class="primary" data-do="start">¡Vamos a casa! ${A.icon('arrow')}</button></div></section>`;
  }
  function stageProgress(){const st=M.stage(state),thresholds=[0,2,5,9];return st===3?100:Math.min(100,(state.caredDays-thresholds[st])/(thresholds[st+1]-thresholds[st])*100);}
  function getPeriod(){const progress=state.elapsed/state.settings.duration;return progress>=1?'Noche':progress>=.65?'Tardecita':progress>=.3?'Tarde':'Mañana';}
  function hint(){if(state.elapsed>=state.settings.duration)return 'sleep';if(state.needs.food<60)return 'food';if(state.needs.clean<60)return 'bath';if(state.needs.energy<55)return 'sleep';if(state.needs.joy<65)return 'play';return 'love';}
  function game(){
    const st=M.stage(state);
    app.innerHTML=`<div class="game-title"><div><div class="eyebrow">Tu pequeño mundo</div><h1>¡Hola, <span>${esc(state.name)}</span>!</h1></div><div class="day-badge">${A.icon('sun')}<div><strong id="dayLabel">Día ${state.day} · ${getPeriod()}</strong><span id="timeLabel">Un día para descubrir</span></div></div></div><div class="game-layout"><div class="play-column"><section class="house"><nav class="room-tabs" aria-label="Habitaciones">${Object.entries(roomLabels).map(([id,label])=>`<button class="room-tab ${id===state.room?'active':''}" data-room="${id}" aria-pressed="${id===state.room}">${A.icon({garden:'garden',kitchen:'kitchen',bath:'bath',bedroom:'bed'}[id])}<span>${label}</span></button>`).join('')}</nav><div class="scene" id="scene"></div><p class="scene-message" id="sceneMessage">${A.icon('love')} Toca a ${esc(state.name)} para darle una caricia.</p></section><nav class="care-bar" aria-label="Cuidados de la mascota">${Object.entries(cares).map(([id,c])=>`<button class="care-button" data-care="${id}">${A.icon(c[0])}<span>${c[1]}</span></button>`).join('')}</nav></div><aside class="side-panel"><section class="status-card"><div class="status-heading"><h3>¿Cómo está?</h3><span>Con cariño</span></div>${Object.entries({food:['food','Barriguita'],clean:['bath','Limpieza'],energy:['sleep','Descanso'],joy:['love','Alegría']}).map(([id,c])=>`<div class="need-row" data-need="${id}"><span class="need-icon">${A.icon(c[0])}</span><div><label>${c[1]}</label><div class="need-track" role="progressbar" aria-label="${c[1]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(state.needs[id])}"><div class="need-fill" style="width:${state.needs[id]}%"></div></div></div><span class="need-symbol">♡</span></div>`).join('')}<p class="status-note">Los pequeños cuidados hacen<br>que cada día sea especial.</p></section><section class="journey-card"><h3>${A.icon('garden')} Creciendo juntos</h3><div class="stage-text"><strong id="stageLabel">${stages[st]}</strong><small id="growthDays">${state.caredDays} ${state.caredDays === 1 ? "día cuidado" : "días cuidados"}</small></div><div class="growth-track" role="progressbar" aria-label="Crecimiento" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stageProgress()}"><div class="growth-fill" style="width:${stageProgress()}%"></div></div><div class="growth-stops"><span>Bebé</span><span>Pequeña</span><span>Joven</span><span>Adulta</span></div><div class="daily-icons" id="dailyIcons"></div><p class="journey-note">${st===3?'¡Ya ha crecido! Todavía quedan muchas cosas por descubrir.':'Tres cuidados distintos y una noche de sueño ayudan a crecer.'}</p><button class="album-button" data-do="album"><span>${A.icon('album')} Mi álbum</span><small id="albumCount">${state.stickers.length}/12</small></button></section></aside></div>`;
    const skill=document.createElement('p');skill.className='stage-skill';skill.textContent=C.growth[st].description;$('.journey-card').insertBefore(skill,$('.album-button'));
    const extras=document.createElement('div');extras.className='experience-tools';extras.innerHTML=`<button data-do="decor">${A.icon('garden')} Mi casita</button><button data-do="petToy"><span>${X.personalities[state.pet].symbol}</span> Su juguete</button><button data-do="guideRestart">${A.icon('paw')} Enséñame</button>`;$('.play-column').append(extras);
    const guide=document.createElement('div');guide.id='guideRoot';$('.play-column').append(guide);guideStamp='';
    const character=document.createElement('p');character.className='personality-caption';character.textContent=X.personalities[state.pet].label;$('.status-card').append(character);
    scene();updateHUD();adventures?.mount();
  }
  function scene(){
    const el=$('#scene');if(!el)return;const st=M.stage(state),night=state.elapsed>=state.settings.duration||mood==='sleep';
    el.classList.toggle('night',night);
    el.innerHTML=X.decorate(A.room(state.room,night),state)+`${state.accessory==='cushion'?'<svg style="position:absolute;width:22%;left:39%;bottom:17%;z-index:1" viewBox="0 0 180 70" aria-hidden="true"><ellipse cx="90" cy="49" rx="80" ry="17" fill="#9dac8740"/><path d="M12 30Q8 2 90 8q80-9 79 23 6 33-81 30Q9 64 12 30z" fill="#9bc4b5" stroke="#7da193" stroke-width="3"/><path d="M24 34q63 21 130-1" stroke="#cde2d5" stroke-width="3" fill="none"/></svg>':''}<div class="pet-position stage-${st}" data-pose="${actor.pose}" style="left:${actor.x}%;bottom:${actor.y}%;--walk-time:${C.growth[st].speed}ms"><button class="scene-pet" data-care="love" aria-label="Acariciar a ${esc(state.name)}"></button></div><button class="hint-bubble" id="hintBubble" data-care="${hint()}" aria-label="Ayudar a ${esc(state.name)}"></button><div class="scene-label">${roomLabels[state.room]} de ${esc(state.name)}</div>`;
    el.insertAdjacentHTML('beforeend',X.surprises[state.room].map(v=>`<button class="surprise-hotspot ${state.discoveries.includes(v.id)?'found':''}" data-surprise="${v.id}" style="left:${v.x}%;top:${v.y}%" aria-label="${v.label}"><span>${v.symbol}</span><i>${state.discoveries.includes(v.id)?'✓':'✦'}</i></button>`).join(''));
    renderActor();
    const touch=document.createElement('button');touch.className='room-touch '+state.room;touch.dataset.care={garden:'play',kitchen:'food',bath:'bath',bedroom:'sleep'}[state.room];touch.textContent={garden:'⚽',kitchen:'🍽️',bath:'🫧',bedroom:'🌙'}[state.room];touch.setAttribute('aria-label',{garden:'Jugar con la pelota',kitchen:'Dar de comer',bath:'Preparar el baño',bedroom:'Preparar el descanso'}[state.room]);el.append(touch);
    const cameras=document.createElement('div');cameras.className='camera-tools';cameras.innerHTML='<button data-camera="left" aria-label="Mirar desde la izquierda">↶ Mirar</button><button data-camera="home" aria-label="Volver a la vista inicial">🏠 Mi vista</button><button data-camera="right" aria-label="Mirar desde la derecha">Mirar ↷</button><span>Toca para mirar tu pequeño mundo</span>';el.parentElement.querySelector('.camera-tools')?.remove();el.after(cameras);
    adventures?.sceneExtras();
  }
  function expression(){return mood==='happy'?C.expression(state.needs,state.elapsed>=state.settings.duration):mood;}
  function renderActor(){const pet=$('.pet-position .scene-pet');if(!pet)return;actorExpression=expression();actorDirty=state.needs.clean<60;pet.className='scene-pet species-'+state.pet+' '+actorExpression;pet.innerHTML=A.pet(state.pet,state.color,M.stage(state),actorExpression,state.accessory,{dirty:actorDirty});}
  function syncActor(){
    const position=$('.pet-position');if(!position)return;
    position.style.left=actor.x+'%';position.style.bottom=actor.y+'%';position.dataset.pose=actor.pose;
    if(expression()!==actorExpression||actorDirty!==(state.needs.clean<60))renderActor();
    const bubble=$('#hintBubble');if(bubble)bubble.style.left=Math.min(78,actor.x+13)+'%';
  }
  function idle(now){
    if(modalKind||busy||mood!=='happy'||state.elapsed>=state.settings.duration||state.settings.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(now<actor.next)return;
    if(actor.pose!=='sit'){actor.pose='sit';actor.next=now+4000;}
    else {const turn=actor.turn++%6;
      if(turn===0||turn===2){actor.pose='walk';actor.x=turn===0?42:56;actor.y=turn===0?18:15;actor.next=now+C.growth[M.stage(state)].speed;}
      else{actor.pose=turn===1||turn===5?X.personalities[state.pet].gesture:turn===3?'stretch':'look';actor.next=now+2300;if(actor.pose==='sneeze')sparkle('✦');}
    }
    syncActor();
    renderGuide();
  }
  function updateHUD(){if(screen!=='game')return;
    renderGuide();
    if(state.elapsed>=state.settings.duration)actor.pose='sit';
    for(const k of ['food','clean','energy','joy']){const row=$(`[data-need="${k}"]`);if(row){row.querySelector('.need-fill').style.width=state.needs[k]+'%';row.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',Math.round(state.needs[k]));}}
    const day=$('#dayLabel');if(day)day.textContent=`Día ${state.day} · ${getPeriod()}`;
    const time=$('#timeLabel');if(time)time.textContent=state.elapsed>=state.settings.duration?'Hora de arroparse':getPeriod()==='Mañana'?'Un día para descubrir':getPeriod()==='Tarde'?'Tiempo de jugar':'El sol se va a dormir';
    const daily=$('#dailyIcons');if(daily)daily.innerHTML=Object.entries(cares).map(([id,c])=>`<span class="${state.cared[id]?'done':''}" title="${c[1]}${state.cared[id]?': completado':''}" aria-label="${c[1]}${state.cared[id]?': completado':''}">${A.icon(state.cared[id]?'check':c[0])}</span>`).join('');
    if($('#albumCount'))$('#albumCount').textContent=`${state.stickers.length}/12`;
    if($('#hintBubble')){const h=hint();$('#hintBubble').innerHTML=A.icon(h);$('#hintBubble').dataset.care=h;$('#hintBubble').setAttribute('aria-label',({food:'Dar de comer',bath:'Bañar',sleep:'Descansar',play:'Jugar',love:'Dar cariño'})[h]);}
    if($('#scene'))$('#scene').classList.toggle('evening',state.elapsed/state.settings.duration>=.65);
    const message=$('#sceneMessage');if(message){const h=hint();message.innerHTML=A.icon(h)+' '+esc(({food:state.name+' mira su plato. ¡Tiene hambre!',bath:'Tiene unas manchitas. ¡Vamos a bañarnos!',sleep:'Un bostezo… '+state.name+' quiere descansar.',play:'¡Tiene ganas de jugar contigo!',love:'Toca a '+state.name+' para darle una caricia.'})[h]);}
    syncActor();
  }
  function room(id){if(!roomLabels[id]||busy)return;actor.x=49;actor.y=16;actor.pose='sit';actor.next=performance.now()+4000;state.room=id;game();save();tone();speak(roomLabels[id]);}
  function sparkle(symbol='♡'){const el=$('#scene');if(!el)return;for(let i=0;i<6;i++){const p=document.createElement('span');p.className='spark';p.textContent=symbol;p.style.left=(35+Math.random()*27)+'%';p.style.top=(32+Math.random()*20)+'%';p.style.fontSize=(20+Math.random()*13)+'px';p.style.animationDelay=(i*.09)+'s';el.append(p);setTimeout(()=>p.remove(),2300);}}
  function celebrate(){for(let i=0;i<30;i++){const p=document.createElement('i');p.className='confetti-piece';p.style.left=Math.random()*100+'vw';p.style.background=['#e8ba78','#a4bc8a','#d4b4d3','#eba99b'][i%4];p.style.animationDelay=Math.random()*.5+'s';document.body.append(p);setTimeout(()=>p.remove(),3500);}tone('success');}
  function showMood(next,delay=1900){clearTimeout(moodTimer);mood=next;actor.pose='sit';syncActor();updateHUD();moodTimer=setTimeout(()=>{if(mood===next&&!busy){mood='happy';syncActor();updateHUD();}},delay);}
  function care(kind){
    if(screen!=='game'||busy||paused||adventures?.blocked())return;tone();
    if(kind==='love'){M.care(state,'love');actor.x=49;actor.y=12;actor.next=performance.now()+5000;showMood('love');actor.pose=X.personalities[state.pet].gesture;syncActor();sparkle(state.pet==='dragon'?'✦':'♥');updateHUD();save();tone('pet');speak(X.personalities[state.pet].phrase);return;}
    const desired=cares[kind]?.[2];if(desired){state.room=desired;game();}
    if(kind==='food')feed();if(kind==='bath')bath();if(kind==='sleep')sleep();if(kind==='play')playMenu();
  }
  let previouslyFocused=null;
  function openModal(kind,html,wide=false,closable=true){
    if(!modalKind)previouslyFocused=document.activeElement;
    if(modalCleanup){modalCleanup();modalCleanup=null;}
    modalKind=kind;
    document.body.classList.add('modal-open');
    renderGuide();
    if($('#scene')){$('#scene').classList.add('scene-paused');actor.pose='sit';syncActor();}
    overlay.innerHTML=`<div class="overlay"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">${closable?`<button class="close-modal" data-do="close" aria-label="Volver al juego">${A.icon('close')}</button>`:''}${html}</section></div>`;
    overlay.querySelector('.modal').focus({preventScroll:true});music();
  }
  function closeModal(){if(busy)return;if(modalCleanup){modalCleanup();modalCleanup=null;}modalKind='';document.body.classList.remove('modal-open');chewing=false;overlay.innerHTML='';if($('#scene'))$('#scene').classList.remove('scene-paused');actor.next=performance.now()+4000;if(paused){paused=false;syncTop();}renderGuide();music();lastTick=performance.now();if(previouslyFocused?.isConnected)previouslyFocused.focus({preventScroll:true});}
  function feed(){openModal('food',`<div class="modal-icon">${A.icon('food')}</div><h2 id="modalTitle">¡A comer!</h2><p>Elige algo rico para ${esc(state.name)}.</p><div class="food-options">${[['apple','Manzana'],['carrot','Zanahoria'],['bowl','Su comida']].map(([id,label])=>`<button class="food-option" data-food="${id}">${A.food(id)}${label}</button>`).join('')}</div>`);speak('¡A comer! Elige algo rico.');}
  function eat(kind){if(modalKind!=='food'||busy||!['apple','carrot','bowl'].includes(kind))return;mealSession=C.meal(kind);feedingView();speak('Toca la cuchara para darme un bocado.');}
  function feedingView(){
    const done=mealSession.bites>=mealSession.total;
    openModal('feeding',`<h2 id="modalTitle">${done?'¡Barriguita contenta!':'Un bocado de cariño'}</h2><p>${done?'¡Qué rico! Ya ha terminado su comida.':'Toca la cuchara o su boquita para darle de comer.'}</p><div class="feeding-stage"><div class="feeding-pet">${A.pet(state.pet,state.color,M.stage(state),done?'eat':'hungry',state.accessory)}</div>${done?'':`<button class="mouth-target" data-do="bite" aria-label="Dar un bocado en la boquita">${A.icon('food')}</button>`}<div class="food-dish">${A.food(mealSession.kind)}</div></div><div class="bite-progress" role="status" aria-label="${mealSession.bites} de 4 bocados">${Array.from({length:4},(_,i)=>`<span class="${i<mealSession.bites?'done':''}">${i<mealSession.bites?A.icon('check'):A.icon('food')}</span>`).join('')}</div><div class="modal-actions">${done?'<button class="primary" data-do="mealDone">¡Qué rico! '+A.icon('check')+'</button>':`<button class="primary spoon-button" data-do="bite"><span>🥄</span> Dar un bocado</button>`}</div>`);
  }
  function bite(){
    if(modalKind!=='feeding'||chewing||!C.bite(mealSession))return;
    chewing=true;state.needs.food=Math.min(100,state.needs.food+12);
    const done=mealSession.bites===mealSession.total;if(done)M.care(state,'food');save();updateHUD();
    for(const b of overlay.querySelectorAll('[data-do="bite"]'))b.disabled=true;
    $('.feeding-pet').innerHTML=A.pet(state.pet,state.color,M.stage(state),'chew',state.accessory);
    const nibble=document.createElement('div');nibble.className='flying-bite';nibble.innerHTML=A.food(mealSession.kind);$('.feeding-stage').append(nibble);
    tone('pop');
    const t=setTimeout(()=>{chewing=false;if(modalKind!=='feeding')return;feedingView();if(done){tone('success');speak('¡Ñam, ñam! ¡Qué rico!');}else if(mealSession.bites===1)speak('¡Ñam! Otro poquito.');},750);
    modalCleanup=()=>{clearTimeout(t);chewing=false;};
  }
  function bath(){bathSession=C.bath();bathView();speak('Toca las manchitas con el jabón.');}
  function bathView(){
    const s=bathSession,done=s.step===3,tool=s.tool;
    const labels=['cabecita','patita izquierda','patita derecha','barriguita'];
    const prompts=['Toca las cuatro manchitas con el jabón.','Toca la espuma con el agua para enjuagar.','Toca las gotitas con la toalla para secar.'];
    openModal('bath',`<h2 id="modalTitle">Un baño de burbujas</h2><p id="bathPrompt">${done?'¡Limpita, seca y suave!':tool===s.step?prompts[s.step]:['','Ahora elige la ducha.','Ahora elige la toalla.'][s.step]}</p><div class="bath-playground" data-step="${s.step}"><div class="bath-body">${A.pet(state.pet,state.color,M.stage(state),done?'clean':'happy',state.accessory)}${done?'':labels.map((label,i)=>{const touched=s.spots[s.step].includes(i),symbol=s.step===0?'🟤':s.step===1?'🫧':'💧';return `<button class="wash-zone zone-${i} ${touched?'washed':''}" data-wash="${i}" ${touched||s.tool!==s.step?'disabled':''} aria-label="${['Enjabonar','Enjuagar','Secar'][s.step]} ${label}"><span>${touched?'✓':symbol}</span></button>`;}).join('')}${!done&&s.step>=1?`<div class="coat-layer" aria-hidden="true">${labels.map((_,i)=>`<span class="coat zone-${i}" style="opacity:${s.spots[s.step].includes(i)?0:1}">${s.step===1?'🫧':'💧'}</span>`).join('')}</div>`:''}</div><span class="bath-tool-display" aria-hidden="true">${done?'✦':tool===s.step?['🧼','🚿','🧺'][s.step]:'♡'}</span></div><div class="wash-progress" role="status">${done?'¡Baño completado!':`${s.spots[s.step].length} de 4 · ${['Jabón','Agua','Toalla'][s.step]}`}</div><div class="bath-steps">${[['🧼','Jabón'],['🚿','Agua'],['🧺','Toalla']].map(([icon,label],i)=>`<button class="bath-step ${tool===i?'current':''} ${i<s.step?'complete':''}" data-bath="${i}" ${i!==s.step?'disabled':''} aria-pressed="${tool===i}"><span>${i<s.step?'✓':icon}</span>${label}</button>`).join('')}</div>${done?'<button class="primary" data-do="bathDone">¡Qué bien! '+A.icon('check')+'</button>':''}`);
  }
  function bathAction(step){if(modalKind!=='bath'||!C.selectTool(bathSession,step))return;bathView();tone();speak(['Toca las manchitas con el jabón.','Enjuaga las burbujitas.','Seca las gotitas con la toalla.'][step]);}
  function wash(zone){if(modalKind!=='bath')return;const before=bathSession.step;if(!C.touch(bathSession,zone))return;tone('pop');if(bathSession.step===3){M.care(state,'bath');save();updateHUD();tone('success');}bathView();if(bathSession.step!==before)speak(['','¡Qué burbujas! Elige el agua.','¡Sin espuma! Ahora la toalla.','¡Limpita y suave!'][bathSession.step]);}
  function sleep(){ritualSession=X.ritual();bedtimeView();speak('Vamos a descansar. Elige un peluche para acompañarme.');}
  function bedtimeView(){
    const r=ritualSession,plush=X.plushes.find(v=>v.id===state.bedtime.plush),blanket=X.blankets.find(v=>v.id===state.bedtime.blanket);
    openModal('bedtime',`<h2 id="modalTitle">${state.elapsed>=state.settings.duration?'Buenas noches, '+esc(state.name):'Un descansito con cariño'}</h2><div class="ritual-progress" aria-label="Paso ${r.step+1} de 3">${['🧸','🛏️','💡'].map((v,i)=>`<span class="${r.step===i?'current':r.step>i?'done':''}">${r.step>i?'✓':v}</span>`).join('')}</div><p>${['Elige un peluche para acompañarle.','Elige una manta y toca «Arropar».','Ahora toca la lamparita para apagarla.'][r.step]}</p><div class="bedtime-stage"><div class="bedtime-pet">${A.pet(state.pet,state.color,M.stage(state),r.step===2?'tired':'happy',state.accessory)}</div>${r.step>=1?`<div class="bedtime-plush">${plush.symbol}</div>`:''}${r.tucked?`<div class="bedtime-cover" style="background:${blanket.color}"><span>${blanket.symbol}</span><span>${blanket.symbol}</span><span>${blanket.symbol}</span></div>`:''}${r.step===2?'<button class="bedtime-lamp" data-do="bedLamp" aria-label="Apagar la lamparita">💡<span>Tócame</span></button>':'<div class="bedtime-lamp decoration-lamp" aria-hidden="true">💡</div>'}</div>${r.step===0?`<div class="ritual-options">${X.plushes.map(v=>`<button data-plush="${v.id}" aria-label="Elegir peluche ${v.label}"><span>${v.symbol}</span>${v.label}</button>`).join('')}</div>`:r.step===1?`<div class="ritual-options">${X.blankets.map(v=>`<button data-blanket="${v.id}" class="${state.bedtime.blanket===v.id?'selected':''}" aria-pressed="${state.bedtime.blanket===v.id}"><span style="background:${v.color}" class="blanket-swatch">${v.symbol}</span>${v.label}</button>`).join('')}</div><button class="primary" data-do="bedTuck">${A.icon('bed')} Arropar</button>`:'<p class="bedtime-whisper">Una luz suave, un peluche y mucho cariño.</p>'}`);
  }
  function bedPlush(id){if(modalKind==='bedtime'&&X.choosePlush(state,ritualSession,id)){save();bedtimeView();tone();speak('Ahora elige una manta y arrópame.');}}
  function bedBlanket(id){if(modalKind==='bedtime'&&X.chooseBlanket(state,ritualSession,id)){save();bedtimeView();tone();}}
  function bedTuck(){if(modalKind!=='bedtime'||!X.tuck(ritualSession))return;bedtimeView();tone();speak('¡Qué calentito! Apaga la lamparita.');}
  function bedLamp(){if(modalKind!=='bedtime'||!X.lightsOff(ritualSession))return;tone('lullaby');tuck();}
  function tuck(){
    if(modalKind!=='bedtime'||busy||!ritualSession?.lightOff)return;const full=state.elapsed>=state.settings.duration;
    busy=true;mood='sleep';M.care(state,'sleep');scene();updateHUD();save();
    openModal('sleeping',`<div class="sleep-stars">✦ · ✧ · ✦</div><h2 id="modalTitle">${full?'Dulces sueños':'Shhh… está descansando'}</h2><div class="modal-hero">${A.pet(state.pet,state.color,M.stage(state),'sleep',state.accessory)}</div><p>Una mantita suave y mucho cariño.</p><p class="sleep-count" role="status">${full?'Pronto saldrá el sol…':'Una siesta pequeñita…'}</p>`,false,false);
    const blanket=X.blankets.find(v=>v.id===state.bedtime.blanket),plush=X.plushes.find(v=>v.id===state.bedtime.plush);$('.modal-hero').classList.add('sleeping-ritual');$('.modal-hero').insertAdjacentHTML('beforeend',`<span class="sleeping-plush">${plush.symbol}</span><div class="sleeping-cover" style="background:${blanket.color}">${blanket.symbol} · ${blanket.symbol}</div>`);
    speak('Dulces sueños.');
    const t=setTimeout(()=>{busy=false;mood='happy';if(full){sleepSummary=M.finishDay(state);save();dayEnd();}else{closeModal();scene();toast('¡Ya tiene energía para jugar!');speak('¡Ya tiene energía para jugar!');}},full?4300:3000);
    modalCleanup=()=>clearTimeout(t);
  }
  function dayEnd(){
    const s=sleepSummary;if(!s){closeModal();game();return;}
    openModal('dayEnd',`<div class="modal-icon">${A.icon(s.grew?'garden':'sun')}</div><h2 id="modalTitle">${s.grew?'¡'+esc(state.name)+' ha crecido!':'¡Un bonito día juntos!'}</h2><p>${s.grew?'Ahora está en la etapa '+stages[s.stage].toLowerCase()+'. ¡Mira cuánto ha cambiado!':s.qualified?'Tu cariño le ayuda a crecer, poquito a poquito.':'Mañana podemos probar tres cuidados distintos para ayudarle a crecer.'}</p><div class="growth-celebrate">${A.pet(state.pet,state.color,M.stage(state),'love',state.accessory)}</div><div class="day-summary"><span>${s.cared} cuidados distintos</span><span>${state.caredDays} ${state.caredDays === 1 ? "día cuidado" : "días cuidados"}</span>${s.grew?'<span>¡Nueva pegatina!</span>':''}</div><button class="primary" data-do="newDay">${A.icon('sun')} Empezar otro día</button>`,false,false);
    if(s.grew){save();$('.growth-celebrate').innerHTML=`<div class="growth-comparison"><div>${A.pet(state.pet,state.color,s.stage-1,'happy',state.accessory)}<small>Antes · ${stages[s.stage-1]}</small></div><span aria-hidden="true">→</span><div class="after-pet">${A.pet(state.pet,state.color,s.stage,'love',state.accessory)}<small>Ahora · ${stages[s.stage]}</small></div></div><p>${C.growth[s.stage].description}</p>`;$('.day-summary').insertAdjacentHTML('afterend','<button class="secondary" data-do="growthParty">🎈 Celebrar mi crecimiento</button>');}
    celebrate();speak(s.grew?state.name+' ha crecido. ¡Qué alegría!':'¡Qué bonito día!');
  }
  function playMenu(){miniGame='';openModal('play',`<div class="modal-icon">${A.icon('play')}</div><h2 id="modalTitle">¿A qué jugamos?</h2><p>Juegos para tocar, descubrir y reír juntos.</p><div class="mini-choices"><button class="mini-choice" data-mini="ball"><span class="mini-emoji">⚽</span>Pelota saltarina</button><button class="mini-choice" data-mini="bubbles"><span class="mini-emoji">🫧</span>Burbujitas</button><button class="mini-choice" data-mini="hide"><span class="mini-emoji">🧸</span>¿Dónde está?</button></div><button class="primary" data-adventure="hub">🗺️ Más aventuras</button>`);speak('¿A qué jugamos?');}
  function miniStart(kind){miniGame=kind;miniCount=0;tone();if(kind==='ball')ballView();if(kind==='bubbles')bubbleView();if(kind==='hide')hideView();}
  function dots(total){return `<div class="mini-progress" aria-label="${miniCount} de ${total}">${Array.from({length:total},(_,i)=>`<i class="${i<miniCount?'done':''}"></i>`).join('')}</div>`;}
  function ballView(){
    const left=[16,72,32,62,44][miniCount];
    openModal('ball',`<h2 id="modalTitle">Pelota saltarina</h2><p>Toca la estrella para lanzar la pelota.</p><div class="mini-stage ball-field"><div class="ball-pet">${A.pet(state.pet,state.color,M.stage(state),'play',state.accessory)}</div><div class="ball-toy" style="left:calc(50% - 21px);bottom:15px"></div><button class="throw-spot" data-do="throwBall" style="left:${left}%;bottom:${[75,115,110,82,120][miniCount]}px" aria-label="Lanzar la pelota aquí">✦</button></div>${dots(5)}`);if(miniCount===0)speak('Toca la estrella para lanzar la pelota.');
  }
  function throwBall(){
    if(busy||modalKind!=='ball')return;busy=true;const spot=$('.throw-spot');spot.disabled=true;const ball=$('.ball-toy');ball.style.left=spot.style.left;ball.style.bottom=spot.style.bottom;$('.ball-pet').style.left=`calc(${spot.style.left} - 40px)`;tone('pop');
    const t=setTimeout(()=>{busy=false;miniCount++;if(miniCount>=5)miniWin('ball');else ballView();},850);modalCleanup=()=>{clearTimeout(t);busy=false;};
  }
  function bubbleView(){openModal('bubbles',`<h2 id="modalTitle">¡Pop, pop, burbujitas!</h2><p>Toca las burbujas y escucha cómo explotan.</p><div class="mini-stage bubble-game">${Array.from({length:8},(_,i)=>`<button class="bubble" data-bubble="${i}" aria-label="Explotar burbuja ${i+1}"></button>`).join('')}</div><div id="bubbleProgress">${dots(8)}</div>`);speak('Toca las burbujitas. ¡Pop, pop!');}
  function popBubble(button){if(modalKind!=='bubbles'||button.classList.contains('popped'))return;button.classList.add('popped');button.disabled=true;miniCount++;tone('pop');$('#bubbleProgress').innerHTML=dots(8);if(miniCount>=8){busy=true;const t=setTimeout(()=>{busy=false;miniWin('bubbles');},500);modalCleanup=()=>{clearTimeout(t);busy=false;};}}
  function hideView(){hiddenToy=Math.floor(Math.random()*3);openModal('hide',`<h2 id="modalTitle">¿Dónde está el osito?</h2><p>Mira… ¡un escondite se está moviendo!</p><div class="mini-stage hide-stage">${['🧺','🎁','🪴'].map((sym,i)=>`<button class="hide-box ${i===hiddenToy?'hint':''}" data-hide="${i}" aria-label="Buscar en ${['la cesta','el regalo','la maceta'][i]}"><span>${sym}</span></button>`).join('')}</div><p id="hideHint">Toca un escondite para descubrirlo.</p>`);speak('¿Dónde está el osito? Un escondite se está moviendo.');}
  function findToy(i,button){if(modalKind!=='hide'||busy)return;if(i!==hiddenToy){tone();button.style.opacity='.5';$('#hideHint').textContent='Prueba el escondite que se mueve.';speak('Prueba el escondite que se mueve.');return;}busy=true;button.classList.add('found');button.innerHTML='<span>🧸</span>';tone('success');speak('¡Lo encontraste!');const t=setTimeout(()=>{busy=false;miniWin('hide');},1100);modalCleanup=()=>{clearTimeout(t);busy=false;};}
  function miniWin(kind){M.care(state,'play');M.award(state,kind);save();updateHUD();openModal('win',`<div class="game-success"><span class="success-star">✦</span><h2 id="modalTitle">${kind==='hide'?'¡Lo encontraste!':'¡Qué divertido!'}</h2><p>${esc(state.name)} está feliz de jugar contigo.</p><div class="modal-hero">${A.pet(state.pet,state.color,M.stage(state),'play',state.accessory)}</div><p>Una pegatina para recordar esta aventura.</p><div class="modal-actions"><button class="secondary" data-mini="${kind}">Otra vez</button><button class="primary" data-do="playDone">Volver a casa ${A.icon('arrow')}</button></div></div>`);celebrate();speak('¡Qué divertido!');}
  function album(){openModal('album',`<div class="modal-icon">${A.icon('album')}</div><h2 id="modalTitle">Nuestro álbum</h2><p>Pequeños recuerdos de grandes momentos.</p><div class="sticker-grid">${stickers.map(([id,emoji,label])=>`<div class="sticker ${state.stickers.includes(id)?'':'locked'}" aria-label="${esc(label)}${state.stickers.includes(id)?' conseguido':' por descubrir'}">${state.stickers.includes(id)?`<span>${emoji}</span>`:A.icon('lock')}<small>${label}</small></div>`).join('')}</div><h3>Un toque especial</h3><div class="accessories">${[['none','Sin accesorio',0],['scarf','🧣 Pañuelo',2],['cushion','🛏️ Cojín',5],['crown','👑 Corona',9]].map(([id,label,d])=>`<button class="accessory ${state.accessory===id?'selected':''}" data-accessory="${id}" ${M.unlocked(id,state.caredDays)?'':`disabled title="Se consigue con ${d} días cuidados"`}>${label}${M.unlocked(id,state.caredDays)?'':` · ${d} días`}</button>`).join('')}</div>`,true);speak('Tu álbum de recuerdos.');}
  const baseAlbum=album;
  album=function(){baseAlbum();$('.sticker-grid').insertAdjacentHTML('beforebegin','<button class="primary" data-adventure="memories">📖 Ver nuestros momentos y dibujos</button>');};
  function adultGate(){openModal('adultgate',`<div class="modal-icon">${A.icon('gear')}</div><h2 id="modalTitle">Ajustes para adultos</h2><p>Configura el ritmo del juego y el sonido.</p><div class="modal-actions"><button class="secondary" data-do="close">Volver</button><button class="primary" data-do="settings">Soy un adulto</button></div>`);}
  function baseSettings(){openModal('settings',`<h2 id="modalTitle">A su ritmo</h2><p>Los ajustes se guardan automáticamente.</p><div class="settings-group"><label>Duración de cada día de juego</label><div class="duration-choices">${[3,6,10,15].map(n=>`<button data-duration="${n}" class="${state.settings.duration===n*60?'selected':''}">${n} min</button>`).join('')}</div><div class="custom-duration"><span>Otra duración</span><input id="customDuration" type="number" min="1" max="60" step="1" value="${Math.round(state.settings.duration/60)}" aria-label="Duración personalizada en minutos"><span>minutos (1–60)</span><button class="secondary" data-do="customDuration" style="padding:9px 12px;min-height:42px">Aplicar</button></div></div><div class="settings-group"><h3>Sonido y voz</h3>${[['sound','Sonidos de juego'],['voice','Indicaciones habladas'],['music','Música suave']].map(([id,label])=>`<div class="setting-switch"><span>${label}</span><button class="toggle ${state.settings[id]?'on':''}" data-toggle="${id}" role="switch" aria-label="${label}" aria-checked="${state.settings[id]}"></button></div>`).join('')}</div><p class="adult-note">El reloj se pausa al salir de la pestaña y en los ajustes. El progreso se guarda en este navegador y dispositivo. Si se borran sus datos, se pierde la partida. ${storageOK?'':'Este navegador ha bloqueado el guardado.'}</p><div class="modal-actions">${state.pet?'<button class="reset-button" data-do="resetAsk">Elegir otra mascota</button>':''}<button class="primary" data-do="close">Listo ${A.icon('check')}</button></div>`);}
  function settings(){baseSettings();$('.adult-note').insertAdjacentHTML('beforebegin',adventures?.optionsHtml()||'');}
  function duration(n){if(!Number.isFinite(n)||n<1||n>60){toast('Elige un número entre 1 y 60.');return;}const ratio=state.elapsed/state.settings.duration;state.settings.duration=Math.round(n)*60;state.elapsed=Math.min(state.settings.duration,ratio*state.settings.duration);save();settings();updateHUD();tone();}
  function pause(){if(screen!=='game'||busy)return;if(paused){closeModal();return;}if(modalKind)return;paused=true;syncTop();openModal('pause',`<div class="modal-icon">${A.icon('pause')}</div><h2 id="modalTitle">Un ratito de pausa</h2><p>${esc(state.name)} te espera aquí. El tiempo está detenido.</p><div class="modal-hero">${A.pet(state.pet,state.color,M.stage(state),'sleep',state.accessory)}</div><button class="primary" data-do="close">${A.icon('resume')} Seguir jugando</button>`);save();}
  function reset(){const settings={...state.settings};state=M.fresh();state.settings=settings;save();closeModal();selection='cat';color='peach';name='Mimo';screen='choose';mood='happy';render();music();}
  function renderGuide(){
    const root=$('#guideRoot');if(!root)return;const t=state.tutorial,step=X.guide[t.step],active=t.active&&!!step;
    if(t.step===5&&lastGuideVoice===4){lastGuideVoice=5;toast('¡Ya sabes cuidar a tu mascota! Sigue descubriendo su casita.');}
    app.classList.toggle('guide-active',active);
    for(const btn of document.querySelectorAll('.care-button')){const target=active&&!modalKind&&btn.dataset.care===step.care;btn.classList.toggle('guide-target',target);if(target&&!btn.querySelector('.tutorial-pointer'))btn.insertAdjacentHTML('beforeend','<span class="tutorial-pointer" aria-hidden="true">👆</span>');if(!target)btn.querySelector('.tutorial-pointer')?.remove();}
    const stamp=String(active)+':'+t.step;if(stamp!==guideStamp){guideStamp=stamp;root.innerHTML=active?`<section class="guide-card"><span class="guide-mascot" aria-hidden="true">👋</span><div><strong>${step.title}</strong><p>${step.text}</p><div class="guide-dots" aria-label="Paso ${t.step+1} de 5">${X.guide.map((_,i)=>`<i class="${i<=t.step?'done':''}"></i>`).join('')}</div></div><div class="guide-controls"><button data-do="guideSpeak" aria-label="Escuchar la guía">${A.icon('sound')}</button><button data-do="guideSkip" aria-label="Jugar sin guía">${A.icon('close')}</button></div></section>`:'';}
    if(active&&!modalKind&&lastGuideVoice!==t.step){lastGuideVoice=t.step;const n=t.step;setTimeout(()=>{if(screen==='game'&&state.tutorial.active&&state.tutorial.step===n&&!modalKind&&!document.hidden)speak(step.text);},2600);}
  }
  function guideRestart(){state.tutorial={step:0,active:true};lastGuideVoice=-1;guideStamp='';save();renderGuide();speak(X.guide[0].text);}
  function decorIcon(category,v){
    if(category==='ornament')return `<span class="decor-symbol">${v.symbol}</span>`;
    if(category==='rug')return `<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="49" rx="50" ry="28" fill="${v.color}" stroke="${v.line}" stroke-width="3"/><ellipse cx="60" cy="49" rx="40" ry="20" fill="${v.light}"/><path d="M60 34l4 10 12 1-9 7 2 11-9-6-9 6 2-11-9-7 12-1z" fill="${v.color}"/></svg>`;
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M14 22l58-14 33 22v40L47 84 14 61z" fill="#ceb3b9"/><path d="M14 27l58-14 33 22-58 17z" fill="#fff4d8"/><path d="M14 42l58-14 33 18v24L47 84 14 61z" fill="${v.color}"/><path d="M24 55l24 15 47-11" stroke="${v.light}" stroke-width="4" fill="none"/><path d="M28 25l30-7 15 10-30 8z" fill="white"/></svg>`;
  }
  function decor(){decorCategory='rug';decorView();speak('Vamos a decorar tu casita.');}
  function decorView(){
    const labels={rug:'Alfombra',bed:'Cama',ornament:'Adorno'},previewRoom=decorCategory==='bed'?'bedroom':decorCategory==='rug'?'kitchen':state.room;
    openModal('decor',`<h2 id="modalTitle">Mi casita, a mi gusto</h2><p>Toca una opción para ver cómo queda.</p><div class="decor-tabs">${Object.entries(labels).map(([id,label])=>`<button data-decor-tab="${id}" class="${decorCategory===id?'selected':''}" aria-pressed="${decorCategory===id}">${A.icon(id==='bed'?'bed':id==='rug'?'garden':'star')}${label}</button>`).join('')}</div><div class="decor-preview">${X.preview(A.room(previewRoom,false),{...state,room:previewRoom})}<div class="decor-preview-pet">${A.pet(state.pet,state.color,M.stage(state),'happy',state.accessory)}</div></div><div class="decor-options">${X.catalog[decorCategory].map(v=>`<button data-decor-id="${v.id}" class="${state.decor[decorCategory]===v.id?'selected':''}" aria-label="Elegir ${labels[decorCategory].toLowerCase()} ${v.label}" aria-pressed="${state.decor[decorCategory]===v.id}">${decorIcon(decorCategory,v)}<span>${v.label}</span>${state.decor[decorCategory]===v.id?'<i>✓</i>':''}</button>`).join('')}</div><p class="decor-saved">${A.icon('check')} Tus elecciones se guardan.</p><button class="primary" data-do="close">Volver a mi casita ${A.icon('arrow')}</button>`,true);
  }
  function decorSelect(id){if(modalKind!=='decor'||!X.setDecor(state,decorCategory,id))return;if(decorCategory==='bed')state.room='bedroom';if(decorCategory==='rug')state.room='kitchen';save();game();decorView();tone();}
  function petToy(){toyTouches=0;toyView();speak(X.personalities[state.pet].phrase);}
  function toyView(){const p=X.personalities[state.pet],done=toyTouches>=3;
    openModal('petToy',`<h2 id="modalTitle">${p.toy}</h2><p>${done?'¡Qué divertido jugar juntos!':'Toca su juguete y mira qué hace.'}</p><div class="personality-playground species-${state.pet}" data-gesture="${toyTouches?p.gesture:'sit'}"><div class="personality-pet">${A.pet(state.pet,state.color,M.stage(state),toyTouches?'play':'happy',state.accessory)}</div><button class="personality-toy" style="left:${[25,67,38,54][toyTouches]}%" data-do="touchToy" ${done?'disabled':''} aria-label="Jugar con ${p.toy.toLowerCase()}">${p.symbol}</button>${toyTouches&&state.pet==='dragon'?'<span class="magic-sneeze" aria-hidden="true">✦ ✧ ✦</span>':''}</div><div class="toy-progress" role="status">${done?'¡Su juguete favorito!':`${toyTouches} de 3`}</div><div class="modal-actions">${done?'<button class="secondary" data-do="petToy">Otra vez</button><button class="primary" data-do="playDone">Volver a casa</button>':''}</div>`);
  }
  function touchToy(){if(modalKind!=='petToy'||toyTouches>=3)return;toyTouches++;tone('pet');if(toyTouches===3){M.care(state,'play');save();updateHUD();}toyView();if(toyTouches===3)speak(X.personalities[state.pet].phrase);}
  function surprise(id){const item=X.surprises[state.room].find(v=>v.id===id);if(!item||modalKind||busy||paused)return;surpriseSession={item,touches:0};surpriseView();speak(item.text);}
  function surpriseView(){
    const s=surpriseSession,item=s.item,n=s.touches;
    const variants={flower:['🌱','🌷','🌸','🌼'],gift:['🎁','🎀','🧸','💗'],bird:['🐦','🐦','🪶','🐦'],fruit:['🍐','🍎','🍊','🍐'],duck:['🦆','💦','🦆','💦'],rainbow:['🫧','🔴','🟡','🌈'],stars:['⭐','✨','🌟','✨'],musicbox:['🎵','🎶','🎼','🎶']};
    const roomText={garden:'En el jardín',kitchen:'En la cocina',bath:'En el baño',bedroom:'En el dormitorio'};
    openModal('surprise',`<div class="surprise-room">${roomText[state.room]}</div><h2 id="modalTitle">${item.title}</h2><p>${item.text}</p><div class="surprise-stage surprise-${item.id} ${n?'discovered':''}"><button class="surprise-object" data-do="touchSurprise" aria-label="Tocar ${item.label.toLowerCase()}"><span>${variants[item.id][n%4]}</span>${item.id==='stars'?'<i>✦ · ✧ · ✦</i>':''}</button>${n?'<div class="discovery-sparks" aria-hidden="true">✦ · ✧ · ✦</div>':''}</div><p class="discovery-note" role="status">${n?'¡Un pequeño descubrimiento!':'Tócame para descubrirlo.'}</p><div class="modal-actions"><button class="primary" data-do="close">Volver a explorar ${A.icon('arrow')}</button></div>`);
  }
  function touchSurprise(){if(modalKind!=='surprise')return;surpriseSession.touches++;X.discover(state,surpriseSession.item.id);state.needs.joy=Math.min(100,state.needs.joy+5);save();scene();updateHUD();tone(['bird','duck','musicbox','fruit'].includes(surpriseSession.item.id)?'lullaby':'pop');surpriseView();}
  const actions={
    growthParty(){adventures.growth();},decor,guideRestart,guideSkip(){state.tutorial.active=false;save();renderGuide();},guideSpeak(){speak(X.guide[state.tutorial.step]?.text||'Ya sabes cuidar a tu mascota.');},
    bedTuck,bedLamp,petToy,touchToy,touchSurprise,
    bite,mealDone(){closeModal();showMood('eat');sparkle('✦');toast(state.name+' tiene la barriguita contenta');},
    chooseNext(){color=types[selection].color;name=types[selection].name;screen='name';render();speak('¿Cómo se llama tu mascota?');},
    backChoose(){screen='choose';render();},
    erase(){name=($('#petName')?.value||name).slice(0,-1);$('#petName').value=name;},
    start(){name=($('#petName')?.value||'').trim();if(!name){toast('Elige un nombre para tu mascota.');speak('Elige un nombre.');return;}state.pet=selection;state.color=color;state.name=name.slice(0,16);M.award(state,'welcome');adventures?.remember('welcome');save();screen='game';render();music();speak('¡Hola, '+state.name+'! Tócame para darme una caricia.');celebrate();},
    close:closeModal,bathDone(){closeModal();showMood('clean');sparkle('✦');},tuck,newDay(){closeModal();game();speak('¡Buenos días!');},playDone(){closeModal();showMood('play');sparkle('✦');},throwBall,album,settings,
    customDuration(){duration(Number($('#customDuration').value));},
    resetAsk(){openModal('resetConfirm',`<div class="modal-icon">${A.icon('paw')}</div><h2 id="modalTitle">¿Elegir otro amigo?</h2><p>Se borrarán la mascota actual y sus recuerdos de este dispositivo.</p><div class="modal-actions"><button class="secondary" data-do="settings">Conservar mi mascota</button><button class="reset-button" data-do="reset">Empezar de nuevo</button></div>`);},reset
  };
  adventures=window.createAdventures({state:()=>state,setState:s=>{state=s;selection=s.pet||'cat';color=s.color;name=s.name||'Mimo';screen=s.pet?'game':'choose';},switchState(s){closeModal();state=s;selection=s.pet||'cat';color=s.color;name=s.name||'Mimo';screen=s.pet?'game':'choose';paused=false;mood='happy';busy=false;guideStamp='';lastGuideVoice=-1;actor.x=49;actor.y=16;actor.pose='sit';lastTick=performance.now();if(window.speechSynthesis)speechSynthesis.cancel();},esc,open:openModal,close:closeModal,save,render,scene,hud:updateHUD,speak,tone,toast,settings,music,celebrate,kind:()=>modalKind,busy:()=>busy,cleanup(fn){if(modalCleanup)modalCleanup();modalCleanup=fn;},storageFailure(){if(storageOK){storageOK=false;toast('No se pueden guardar los jugadores en este navegador.');}},meal(kind){feed();eat(kind);},note(hz,type='sine'){if(!state.settings.sound||state.settings.effectsVolume===0)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(.1*(state.settings.effectsVolume??.8),audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.45);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.5);}catch{}},affection(zone){showMood('love');actor.pose=zone==='head'?'look':X.personalities[state.pet].gesture;syncActor();sparkle(zone==='head'?'♥':'✦');tone('pet');},stopMusic(){clearInterval(musicTimer);musicTimer=null;}});
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button,[data-scene-action]');if(!btn||btn.disabled)return;
    if(busy&&btn.dataset.do!=='close')return;
    if(btn.dataset.plush){bedPlush(btn.dataset.plush);return;}
    if(btn.dataset.blanket){bedBlanket(btn.dataset.blanket);return;}
    if(btn.dataset.decorTab){if(X.catalog[btn.dataset.decorTab]){decorCategory=btn.dataset.decorTab;decorView();tone();}return;}
    if(btn.dataset.decorId){decorSelect(btn.dataset.decorId);return;}
    if(btn.dataset.surprise){surprise(btn.dataset.surprise);return;}
    if(btn.dataset.pick){selection=btn.dataset.pick;tone();choose();speak(types[selection].label);return;}
    if(btn.dataset.name){name=btn.dataset.name;$('#petName').value=name;tone();speak(name);return;}
    if(btn.dataset.letter!==undefined){const input=$('#petName');name=input.value;if(name.length<16)name+=btn.dataset.letter;input.value=name;tone();return;}
    if(btn.dataset.color){color=btn.dataset.color;name=$('#petName').value;naming();tone();return;}
    if(btn.dataset.room){room(btn.dataset.room);return;}
    if(btn.dataset.care||btn.dataset.sceneAction){care(btn.dataset.care||btn.dataset.sceneAction);return;}
    if(btn.dataset.food){eat(btn.dataset.food);return;}
    if(btn.dataset.bath!==undefined){bathAction(Number(btn.dataset.bath));return;}
    if(btn.dataset.wash!==undefined){wash(Number(btn.dataset.wash));return;}
    if(btn.dataset.mini){miniStart(btn.dataset.mini);return;}
    if(btn.dataset.bubble!==undefined){popBubble(btn);return;}
    if(btn.dataset.hide!==undefined){findToy(Number(btn.dataset.hide),btn);return;}
    if(btn.dataset.accessory){if(M.unlocked(btn.dataset.accessory,state.caredDays)){state.accessory=btn.dataset.accessory;save();scene();album();tone();}return;}
    if(btn.dataset.duration){duration(Number(btn.dataset.duration));return;}
    if(btn.dataset.toggle){state.settings[btn.dataset.toggle]=!state.settings[btn.dataset.toggle];if(!state.settings.sound&&window.speechSynthesis)speechSynthesis.cancel();save();syncTop();settings();music();tone();return;}
    if(btn.dataset.do&&actions[btn.dataset.do]){tone();actions[btn.dataset.do]();}
  });
  document.addEventListener('input',e=>{if(e.target.id==='petName')name=e.target.value;});
  document.addEventListener('keydown',e=>{
    if(modalKind&&e.key==='Escape'){e.preventDefault();if(!['dayEnd','sleeping','sessionEnd','sessionRest','sessionAdult'].includes(modalKind))closeModal();}
    if(modalKind&&e.key==='Tab'){const els=[...overlay.querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')].filter(el=>!el.hidden),first=els[0],last=els.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||document.activeElement===overlay.querySelector('.modal'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    const obj=e.target.closest('[data-scene-action]');if(obj&&(e.key==='Enter'||e.key===' ')){e.preventDefault();care(obj.dataset.sceneAction);}
  });
  $('#soundBtn').addEventListener('click',()=>{state.settings.sound=!state.settings.sound;if(!state.settings.sound&&window.speechSynthesis)speechSynthesis.cancel();save();syncTop();music();tone();});
  $('#pauseBtn').addEventListener('click',pause);
  const adultBtn=$('#adultBtn');
  function stopHold(){clearTimeout(holdTimer);holdTimer=null;adultBtn.classList.remove('holding');}
  adultBtn.addEventListener('pointerdown',e=>{if(busy||modalKind)return;e.preventDefault();adultBtn.setPointerCapture(e.pointerId);adultBtn.classList.add('holding');holdTimer=setTimeout(()=>{stopHold();tone();adultGate();},1200);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])adultBtn.addEventListener(ev,stopHold);
  adultBtn.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!busy&&!modalKind){e.preventDefault();adultGate();}});
  function active(){return screen==='game'&&!document.hidden&&!paused&&!adventures.blocked()&&!['settings','album','memories','profiles','decor','pause','adultgate','resetConfirm','bedtime','sleeping','dayEnd'].includes(modalKind);}
  setInterval(()=>{const now=performance.now(),dt=Math.min(2,(now-lastTick)/1000);lastTick=now;if(active()){
    const end=M.tick(state,dt);adventures.tick(dt);idle(now);updateHUD();saveTimer+=dt;if(saveTimer>=5){save();saveTimer=0;}
    if(end){scene();save();if(!modalKind){toast('El sol se va a dormir. ¡Vamos a arroparnos!');speak('Ya es de noche. Vamos a dormir.');}}
  }else if(screen==='game'&&!document.hidden&&adventures.blocked())adventures.tick(0);},500);
  document.addEventListener('visibilitychange',()=>{save();lastTick=performance.now();actor.next=performance.now()+4000;if($('#scene'))$('#scene').classList.toggle('scene-paused',document.hidden||!!modalKind||paused);if(document.hidden&&window.speechSynthesis)speechSynthesis.cancel();music();});
  window.addEventListener('pagehide',save);window.addEventListener('blur',()=>{lastTick=performance.now();save();});
  window.Pet3DState=()=>state;window.Pet3DMood=expression;window.Pet3DPaused=()=>paused||adventures.blocked();
  render();if(state.pet&&adventures.blocked())adventures.sessionEnd();if(!storageOK)toast('El guardado no está disponible en este navegador.');
})();
