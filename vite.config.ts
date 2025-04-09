import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Cargar las variables de entorno
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            tailwindcss(),
        ],
        server: {
            host: '0.0.0.0',
            hmr: {
                host: '192.168.0.103'
            },
        },
        css: {
            devSourcemap: true,
        },
        resolve: {
            alias: {
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
                '@': resolve(__dirname, 'resources/js'),
                'react': 'react',
            },
            extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
        },
        optimizeDeps: {
            include: ['react', 'react-dom'],
        },
        esbuild: {
            jsx: 'automatic',
            jsxImportSource: 'react',
        },
        // Definir variables de entorno específicas para Pusher
        define: {
            'import.meta.env.VITE_PUSHER_APP_KEY': JSON.stringify(env.PUSHER_APP_KEY),
            'import.meta.env.VITE_PUSHER_APP_CLUSTER': JSON.stringify(env.PUSHER_APP_CLUSTER),
        }
    };
});
