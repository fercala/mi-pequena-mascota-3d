'use strict';
/* Clock advances only while playing. No real-world absence penalties. */
window.PetModel = (() => {
  const types=['cat','dog','rabbit','dragon'], colors=['peach','pink','mint','lilac'];
  const needs=['food','clean','energy','joy'], careTypes=['food','bath','sleep','play','love'];
  const stickerIds=['welcome','food','bath','love','ball','bubbles','hide','day1','small','young','adult','allcare'];
  function fresh() {const s={version:1,pet:null,color:'peach',name:'',room:'garden',day:1,caredDays:0,elapsed:0,cared:{},needs:{food:80,clean:80,energy:85,joy:85},stickers:[],accessory:'none',settings:{duration:360,sound:true,voice:true,music:false},...(window.PetExperience?.fresh()||{}),...(window.AdventureModel?.fresh()||{})};window.AdventureModel?.settings({},s.settings);return s;}
  function num(v,d,min,max){return typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):d;}
  function stage(s){return s.caredDays>=9?3:s.caredDays>=5?2:s.caredDays>=2?1:0;}
  function normalize(raw) {
    const s=fresh();if(!raw||typeof raw!=='object'||raw.version!==1)return s;
    s.pet=types.includes(raw.pet)?raw.pet:null;s.color=colors.includes(raw.color)?raw.color:'peach';
    s.name=typeof raw.name==='string'?raw.name.replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,16):'';
    if(!s.name)s.pet=null;
    s.room=['garden','kitchen','bath','bedroom'].includes(raw.room)?raw.room:'garden';
    s.day=Math.floor(num(raw.day,1,1,99999));s.caredDays=Math.floor(num(raw.caredDays,0,0,s.day-1));
    for(const k of needs)s.needs[k]=num(raw.needs?.[k],s.needs[k],20,100);
    for(const k of careTypes)if(raw.cared?.[k]===true)s.cared[k]=true;
    s.stickers=Array.isArray(raw.stickers)?[...new Set(raw.stickers.filter(x=>stickerIds.includes(x)))]:[];
    s.settings.duration=Math.round(num(raw.settings?.duration,360,60,3600));
    for(const k of ['sound','voice','music'])if(typeof raw.settings?.[k]==='boolean')s.settings[k]=raw.settings[k];
    s.elapsed=num(raw.elapsed,0,0,s.settings.duration);
    s.accessory=['none','scarf','cushion','crown'].includes(raw.accessory)&&unlocked(raw.accessory,s.caredDays)?raw.accessory:'none';
    if(window.PetExperience)Object.assign(s,window.PetExperience.normalize(raw,!!s.pet));
    if(window.AdventureModel){Object.assign(s,window.AdventureModel.normalize(raw));window.AdventureModel.settings(raw.settings,s.settings);}
    return s;
  }
  function unlocked(a,days){return a==='none'||days>=({scarf:2,cushion:5,crown:9}[a]??Infinity);}
  function award(s,id){if(!s.stickers.includes(id)&&stickerIds.includes(id)){s.stickers.push(id);return true;}return false;}
  function care(s,kind) {
    if(!careTypes.includes(kind))return;
    s.cared[kind]=true;
    if(kind==='food')s.needs.food=100;
    if(kind==='bath')s.needs.clean=100;
    if(kind==='sleep')s.needs.energy=100;
    if(kind==='play'){s.needs.joy=100;s.needs.energy=Math.max(25,s.needs.energy-5);}
    if(kind==='love')s.needs.joy=Math.min(100,s.needs.joy+20);
    if(['food','bath','love'].includes(kind))award(s,kind);
    if(careTypes.every(k=>s.cared[k]))award(s,'allcare');
    window.PetExperience?.advance(s,kind);
    window.AdventureModel?.remember(s,kind);
  }
  function tick(s,seconds){
    if(!s.pet||!Number.isFinite(seconds)||seconds<=0)return false;
    const before=s.elapsed;s.elapsed=Math.min(s.settings.duration,s.elapsed+seconds);
    const dt=s.elapsed-before;
    const rates={food:42,clean:28,energy:45,joy:30};
    for(const k of needs)s.needs[k]=Math.max(25,s.needs[k]-rates[k]*dt/s.settings.duration);
    return before<s.settings.duration&&s.elapsed>=s.settings.duration;
  }
  function finishDay(s){
    if(s.elapsed<s.settings.duration||!s.cared.sleep)return null;
    const before=stage(s), cared=Object.values(s.cared).filter(Boolean).length;
    const summary={day:s.day,cared,grew:false,stage:before,qualified:cared>=3};
    if(summary.qualified){s.caredDays++;award(s,'day1');}
    if(s.caredDays>=2)award(s,'small');if(s.caredDays>=5)award(s,'young');if(s.caredDays>=9)award(s,'adult');
    summary.stage=stage(s);summary.grew=summary.stage>before;
    if(summary.grew)window.AdventureModel?.remember(s,'growth');
    s.day++;s.elapsed=0;s.cared={};s.needs.energy=100;s.room='garden';
    return summary;
  }
  return {fresh,normalize,stage,care,tick,finishDay,award,unlocked,stickerIds};
})();
