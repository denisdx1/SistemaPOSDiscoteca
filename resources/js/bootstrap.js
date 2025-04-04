/**
 * We'll load all of this project's JavaScript dependencies which
 * includes React and other helpers.
 */

import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Importar Laravel Echo y los conectores para WebSockets
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Habilitar logging extensivo para debugging
Pusher.logToConsole = true;

console.log('Configurando WebSockets con Laravel Echo...');
console.log('Host:', import.meta.env.VITE_REVERB_HOST || window.location.hostname);
console.log('Puerto:', import.meta.env.VITE_REVERB_PORT || 8080);
console.log('Esquema:', import.meta.env.VITE_REVERB_SCHEME || 'http');

// Agregar una variable global para rastrear la última conexión
window.__lastEchoConnection = Date.now();
window.__echoReconnectAttempts = 0;
window.__maxReconnectAttempts = 10;

// Agregar función para diagnosticar estado
window.checkEchoConnection = function() {
  console.log('🔍 Verificando estado de conexión Echo:');
  
  if (!window.Echo) {
    console.error('❌ Echo no está inicializado');
    return false;
  }
  
  const pusher = window.Echo.connector.pusher;
  const state = pusher.connection.state;
  const timeSinceLastConnection = Date.now() - window.__lastEchoConnection;
  
  console.log('- Estado actual:', state);
  console.log('- Tiempo desde última conexión:', Math.round(timeSinceLastConnection/1000), 'segundos');
  console.log('- Intentos de reconexión:', window.__echoReconnectAttempts);
  console.log('- Canales suscritos:', Object.keys(pusher.channels.channels));
  
  return state === 'connected';
};

// Definición de un sistema de reconexión manual si falla
const createEchoConnection = () => {
  console.log('🔄 Iniciando conexión Echo...');
  window.__echoReconnectAttempts++;
  
  try {
    // Si ya existe una conexión, limpiarla
    if (window.Echo) {
      console.log('🧹 Limpiando conexión Echo anterior...');
      try {
        window.Echo.connector.pusher.disconnect();
      } catch (err) {
        console.error('Error al desconectar:', err);
      }
      window.Echo = null;
    }
    
    // Configurar Laravel Echo para utilizar Reverb/Pusher
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_REVERB_APP_KEY || 'qoeibbvkjiascnxwxbqr',
      cluster: 'mt1',
      wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
      encrypted: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['sockjs', 'xhr_polling', 'xhr_streaming'],
      enableLogging: true, // Habilitar logging en Echo
      authEndpoint: '/broadcasting/auth', // Endpoint para autenticación de canales privados
      transports: ['websocket'], // Forzar conexión WebSocket
      auth: {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      },
      activityTimeout: 30000, // 30 segundos para timeout
      pongTimeout: 10000
    });
    
    // Agregar un manejador para eventos de conexión/desconexión
    const pusher = window.Echo.connector.pusher;
    
    if (pusher) {
      pusher.connection.bind('connected', () => {
        window.__lastEchoConnection = Date.now();
        window.__echoReconnectAttempts = 0;
        console.log('✅ Conectado a WebSocket correctamente!');
        console.log('Estado de conexión:', pusher.connection.state);
        console.log('Canales suscritos:', Object.keys(pusher.channels.channels));
        
        // Crear un evento personalizado para notificar a las páginas
        document.dispatchEvent(new CustomEvent('echoConnected'));
      });
      
      pusher.connection.bind('disconnected', () => {
        console.log('❌ Desconectado de WebSocket');
        document.dispatchEvent(new CustomEvent('echoDisconnected'));
        
        // Intentar reconexión automática después de 3 segundos
        setTimeout(() => {
          if (pusher.connection.state !== 'connected') {
            console.log('🔄 Intentando reconexión automática...');
            if (window.__echoReconnectAttempts < window.__maxReconnectAttempts) {
              pusher.connect();
            } else {
              console.error('❌ Se alcanzó el número máximo de intentos de reconexión. Recargando conexión completa...');
              createEchoConnection();
            }
          }
        }, 3000);
      });
      
      pusher.connection.bind('error', (error) => {
        console.error('❌ Error en conexión WebSocket:', error);
        document.dispatchEvent(new CustomEvent('echoError', { detail: error }));
      });
      
      // Manejar cambios de estado
      pusher.connection.bind('state_change', (states) => {
        console.log(`🔄 Estado de conexión cambiado: ${states.previous} -> ${states.current}`);
        document.dispatchEvent(new CustomEvent('echoStateChange', { 
          detail: { previous: states.previous, current: states.current } 
        }));
      });
      
      // Intentar conexión inmediata
      if (pusher.connection.state !== 'connected') {
        console.log('🔄 Iniciando conexión inmediata...');
        pusher.connect();
      }
    } else {
      console.error('❌ No se pudo crear el conector Pusher');
    }
  } catch (error) {
    console.error('❌ Error al crear la conexión Echo:', error);
    // Intentar reconexión después de 5 segundos si hay un error
    setTimeout(createEchoConnection, 5000);
  }
};

// Iniciar la conexión
createEchoConnection();

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allow your team to quickly build robust real-time web applications.
 */

import './echo';
