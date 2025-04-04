import React, { ReactNode } from 'react';
import { type BreadcrumbItem } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={breadcrumb.href}>
                            {index > 0 && <span>/</span>}
                            <a 
                                href={breadcrumb.href} 
                                className={index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'hover:text-foreground'}
                            >
                                {breadcrumb.title}
                            </a>
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <main className="container mx-auto p-4">
                {children}
            </main>
        </div>
    );
}