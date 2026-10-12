'use strict';
window.AdventureModel=(()=>{
 const outfits=['none','hat','bow','cape','flower'],weather=['sun','rain','snow'],symbols=['🌞','🌸','🚀','🌈'];
 const kinds=['welcome','food','bath','sleep','play','love','walk','garden','cook','colors','count','puzzle','music','paint','friend','emotion','weather','tidy','growth'];
 const finite=(n,d,lo,hi)=>typeof n==='number'&&Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):d;
 const allowed=(v,a,d)=>a.includes(v)?v:d;
 function fresh(){return {outfit:'none',weather:'sun',garden:{phase:0,crop:'apple',harvests:0,pantry:0},memories:[],paintings:[],session:{seconds:0,ended:false,warned:false,hugged:false,resting:false}};}
 function normalize(raw){const d=fresh();d.outfit=allowed(raw.outfit,outfits,'none');d.weather=allowed(raw.weather,weather,'sun');const g=raw.garden||{};d.garden={phase:Math.floor(finite(g.phase,0,0,3)),crop:allowed(g.crop,['apple','carrot'],'apple'),harvests:Math.floor(finite(g.harvests,0,0,9999)),pantry:Math.floor(finite(g.pantry,0,0,99))};
 d.memories=Array.isArray(raw.memories)?raw.memories.filter(m=>m&&kinds.includes(m.kind)&&Number.isInteger(m.day)&&m.day>0).slice(-80).map(m=>({kind:m.kind,day:Math.min(99999,m.day),stage:Math.floor(finite(m.stage,0,0,3)),pet:allowed(m.pet,['cat','dog','rabbit','dragon'],'cat'),color:allowed(m.color,['peach','pink','mint','lilac'],'peach'),outfit:allowed(m.outfit,outfits,'none')})):[];
 d.paintings=Array.isArray(raw.paintings)?raw.paintings.filter(p=>Array.isArray(p)&&p.length===7&&p.every(c=>/^#[0-9a-f]{6}$/i.test(c))).slice(-12):[];
 d.session={seconds:finite(raw.session?.seconds,0,0,86400),ended:raw.session?.ended===true,warned:raw.session?.warned===true,hugged:raw.session?.hugged===true,resting:raw.session?.resting===true};return d;}
 function settings(raw,d){for(const k of ['reducedMotion','visualHelp'])d[k]=typeof raw?.[k]==='boolean'?raw[k]:k==='visualHelp';for(const k of ['voiceVolume','musicVolume','effectsVolume'])d[k]=finite(raw?.[k],k==='musicVolume'?.4:.8,0,1);d.sessionMinutes=Math.floor(finite(raw?.sessionMinutes,0,0,60));}
 function remember(s,kind){if(!kinds.includes(kind)||!s.pet||s.memories.some(m=>m.kind===kind&&m.day===s.day))return false;s.memories.push({kind,day:s.day,stage:window.PetModel.stage(s),pet:s.pet,color:s.color,outfit:s.outfit});s.memories=s.memories.slice(-80);return true;}
 function garden(s,action,value){const g=s.garden;if(action==='plant'&&g.phase===0&&['apple','carrot'].includes(value)){g.crop=value;g.phase=1;return true;}if(action==='water'&&(g.phase===1||g.phase===2)){g.phase++;return true;}if(action==='harvest'&&g.phase===3){g.phase=0;g.harvests++;g.pantry=Math.min(99,g.pantry+1);remember(s,'garden');return true;}return false;}
 function tickSession(s,dt){const limit=s.settings.sessionMinutes*60;if(!limit||s.session.ended||!Number.isFinite(dt)||dt<=0)return '';s.session.seconds=Math.min(limit,s.session.seconds+dt);if(s.session.seconds>=limit){s.session.ended=true;return 'end';}if(!s.session.warned&&limit-s.session.seconds<=60){s.session.warned=true;return 'warning';}return '';}
 function piecePlace(session,index,slot){if(!session||session.done||!Number.isInteger(index)||!Number.isInteger(slot)||session.placed.includes(index))return false;if(index!==slot)return false;session.placed.push(index);session.done=session.placed.length===session.total;return true;}
 function countAdd(session){if(!session||session.done)return false;session.count++;session.done=session.count===session.target;return true;}
 return {fresh,normalize,settings,remember,garden,tickSession,piecePlace,countAdd,outfits,weather,symbols,kinds};
})();
