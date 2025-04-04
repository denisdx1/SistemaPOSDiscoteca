import React from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Music, Disc } from 'lucide-react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-800 to-pink-700" />
                {/* Patrón de puntos decorativo */}
                <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIvPjwvZz48L3N2Zz4=')]" />
                </div>
                
                {/* Elementos decorativos de discoteca */}
                <div className="absolute top-20 left-10 animate-pulse opacity-20">
                    <Disc className="h-24 w-24 text-white" />
                </div>
                <div className="absolute bottom-40 right-10 animate-pulse opacity-20">
                    <Music className="h-24 w-24 text-white" />
                </div>
                
                <Link href={route('home')} className="relative z-20 flex items-center text-lg font-medium">
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    <span className="text-xl">{name || 'Discoteca POS'}</span>
                </Link>
                
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">&ldquo;{quote?.message || 'Gestiona tu discoteca de forma fácil y eficiente con nuestro POS diseñado específicamente para tu negocio.'}&rdquo;</p>
                        <footer className="text-sm text-neutral-300">{quote?.author || 'Equipo de Discoteca POS'}</footer>
                    </blockquote>
                </div>
            </div>
            
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col items-center justify-center lg:hidden mb-6">
                        <AppLogoIcon className="h-12 w-12 fill-current text-primary mb-2" />
                        <span className="text-2xl font-bold text-primary">Discoteca POS</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm text-balance">{description}</p>
                    </div>
                    
                    <div className="bg-white/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-100">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
