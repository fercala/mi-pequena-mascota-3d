(() => {
  const button=document.getElementById('installApp'),status=document.getElementById('offlineStatus');
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  let prompt=null,ready=false;
  function sync(){button.hidden=standalone();status.textContent=ready?(navigator.onLine?'Lista para jugar sin conexión':'Sin conexión · tu partida sigue aquí'):(navigator.onLine?'Preparando el juego sin conexión…':'Conecta una vez para preparar el juego sin conexión');}
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;sync();});
  window.addEventListener('appinstalled',()=>{prompt=null;sync();});
  for(const event of ['online','offline'])window.addEventListener(event,sync);
  button.addEventListener('click',async()=>{
    if(prompt){const request=prompt;prompt=null;try{await request.prompt();await request.userChoice;}catch{}return;}
    const dialog=document.getElementById('installHelp');
    document.getElementById('installInstructions').textContent=/iPad|iPhone|iPod/.test(navigator.userAgent)?'Abre este juego en Safari. Toca Compartir y después «Añadir a pantalla de inicio». Activa «Abrir como app» si aparece.':'En Chrome o Edge, abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio». Si aún no aparece, espera a que termine la preparación y vuelve a abrir el juego.';
    dialog.showModal();
  });
  document.getElementById('closeInstall').addEventListener('click',()=>document.getElementById('installHelp').close());
  if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='OFFLINE_READY'){ready=true;sync();}});navigator.serviceWorker.getRegistration('./').then(existing=>existing?.active?existing:navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})).then(async registration=>{await navigator.serviceWorker.ready;const worker=registration.active||navigator.serviceWorker.controller;worker?.postMessage({type:'CHECK_OFFLINE'});}).catch(()=>{status.textContent='No se pudo preparar el modo sin conexión. Puedes jugar mientras tengas conexión.';});}
  else status.textContent='Este navegador necesita conexión para jugar.';
  sync();
  if('caches' in window)caches.match(new URL('index.html',document.baseURI).href).then(response=>{if(response){ready=true;sync();}}).catch(()=>{});
})();

