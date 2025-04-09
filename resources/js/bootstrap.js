/**
 * We'll load all of this project's JavaScript dependencies which
 * includes React and other helpers.
 */

import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Echo y WebSockets han sido eliminados.
 * Actualmente este proyecto usa polling para actualizaciones en tiempo real.
 * 
 * Si necesitas actualizaciones en tiempo real, deberás implementar un mecanismo
 * de polling en tus componentes usando setInterval() con llamadas a axios.
 */
