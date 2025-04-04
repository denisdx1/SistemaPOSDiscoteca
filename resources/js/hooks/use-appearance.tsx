import * as React from 'react';
const { useCallback, useEffect, useState } = React;

export type Appearance = 'light' | 'dark' | 'system' | 'sepia' | 'green' | 'blue';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') {
        return;
    }
    
    // Primero removemos todas las clases de tema
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');

    // Luego aplicamos el tema seleccionado
    if (appearance === 'dark' || (appearance === 'system' && prefersDark())) {
        document.documentElement.classList.add('dark');
    } else if (appearance === 'sepia' || appearance === 'green' || appearance === 'blue') {
        document.documentElement.setAttribute('data-theme', appearance);
    }
    // El tema 'light' es el default, no necesita clases adicionales
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    if (typeof localStorage === 'undefined') {
        return;
    }
    
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    // Asegurarse de que estamos en el navegador
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }
    
    try {
        const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';

        applyTheme(savedAppearance);

        // Add the event listener for system theme changes...
        const mq = mediaQuery();
        if (mq) {
            mq.addEventListener('change', handleSystemThemeChange);
        }
    } catch (error) {
        console.error('Error initializing theme:', error);
        // Aplicar tema por defecto en caso de error
        document.documentElement.classList.toggle('dark', false);
    }
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
    }, []);

    useEffect(() => {
        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
        updateAppearance(savedAppearance || 'system');

        return () => mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
