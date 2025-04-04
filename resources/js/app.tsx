import * as React from 'react';
import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { loadCurrentCurrency } from '@/lib/utils';

// Importar bootstrap.js para configurar Echo
import './bootstrap';

// Asegurarse de que el tema se inicialice correctamente
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeTheme();
    } catch (error) {
        console.error('Error initializing theme:', error);
    }
});

// Cargar la moneda actual al iniciar la aplicación
loadCurrentCurrency().then(() => {
    console.log('Moneda cargada correctamente');
}).catch(error => {
    console.error('Error al cargar la moneda:', error);
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(React.createElement(App, props));
    },
    progress: {
        color: '#4B5563',
    },
});
