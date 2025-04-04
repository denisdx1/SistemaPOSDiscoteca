import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun, Book, Leaf, Droplet } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'light':
                return <Sun className="h-5 w-5" />;
            case 'dark':
                return <Moon className="h-5 w-5" />;
            case 'sepia':
                return <Book className="h-5 w-5" />;
            case 'green':
                return <Leaf className="h-5 w-5" />;
            case 'blue':
                return <Droplet className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    const themes = [
        { value: 'light', label: 'Claro', icon: Sun },
        { value: 'dark', label: 'Oscuro', icon: Moon },
        { value: 'sepia', label: 'Sepia', icon: Book },
        { value: 'green', label: 'Verde', icon: Leaf },
        { value: 'blue', label: 'Azul', icon: Droplet },
        { value: 'system', label: 'Sistema', icon: Monitor },
    ];

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md">
                        {getCurrentIcon()}
                        <span className="sr-only">Cambiar tema</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {themes.map((theme) => (
                        <DropdownMenuItem key={theme.value} onClick={() => updateAppearance(theme.value as any)}>
                            <span className="flex items-center gap-2">
                                <theme.icon className="h-5 w-5" />
                                {theme.label}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
