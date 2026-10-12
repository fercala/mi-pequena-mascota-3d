'use strict';
// Each physical interaction is counted once; rewards require a whole activity.
window.CareSessions = (() => {
  function meal(kind){return {kind,bites:0,total:4};}
  function bite(s){if(s.bites>=s.total)return false;s.bites++;return true;}
  function bath(){return {step:0,tool:0,spots:[[],[],[]]};}
  function selectTool(s,tool){if(tool!==s.step||s.step>=3)return false;s.tool=tool;return true;}
  function touch(s,zone){
    if(s.step>=3||s.tool!==s.step||!Number.isInteger(zone)||zone<0||zone>3||s.spots[s.step].includes(zone))return false;
    s.spots[s.step].push(zone);
    if(s.spots[s.step].length===4){s.step++;s.tool=-1;}
    return true;
  }
  function expression(needs,night=false){if(night||needs.energy<45)return 'tired';if(needs.food<60)return 'hungry';if(needs.clean<60)return 'dirty';if(needs.joy<60)return 'curious';return 'happy';}
  const growth=[
    {bodyY:173,bodyX:43,bodyH:38,headY:100,headScale:1.05,foot:19,speed:2200,description:'Pasitos pequeños y una cabecita redondita.'},
    {bodyY:164,bodyX:49,bodyH:47,headY:92,headScale:1,foot:21,speed:1800,description:'Ya camina con confianza y se estira al despertar.'},
    {bodyY:153,bodyX:53,bodyH:58,headY:78,headScale:.94,foot:23,speed:1400,description:'Más alta, ágil y curiosa: ¡le encanta explorar!'},
    {bodyY:148,bodyX:60,bodyH:66,headY:68,headScale:.89,foot:25,speed:1700,description:'Un cuerpo más grande y pasos tranquilos de mascota adulta.'}
  ];
  return {meal,bite,bath,selectTool,touch,expression,growth};
})();
