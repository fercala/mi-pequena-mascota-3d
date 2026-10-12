# Mi Pequeña Mascota 3D

Juego web de cuidados para niños de 3 a 5 años, con mascotas y escenarios 3D. Cuatro perfiles locales, cuidados, crecimiento y veinte actividades y mejoras.

## Instalar

Abre el enlace de GitHub Pages con conexión y espera a «Lista para jugar sin conexión». En Android, usa el botón «Instalar en el móvil» o el menú de Chrome. En iPhone/iPad, abre en Safari → Compartir → Añadir a pantalla de inicio. La aplicación se instala desde el navegador, sin tiendas.

La mascota, las actividades y los escenarios se guardan en caché. Requiere WebGL 2. La voz depende de las voces españolas del dispositivo. Las partidas se guardan localmente en cada navegador y sitio; no se sincronizan con el sitio anterior de ChatGPT ni entre dispositivos. Borrar los datos del navegador puede borrar las partidas. Las actualizaciones de la aplicación no borran los perfiles.

## GitHub Pages

Publicar desde `main`, carpeta raíz `/`. El juego usa rutas relativas, incluyendo el manifiesto y el service worker, para funcionar dentro de la carpeta del repositorio. `.nojekyll` evita el procesamiento con Jekyll. No hay servidor, cuentas, publicidad, compras ni telemetría del juego.

La librería Three.js se distribuye con su licencia en `THREE-LICENSE.txt`.
