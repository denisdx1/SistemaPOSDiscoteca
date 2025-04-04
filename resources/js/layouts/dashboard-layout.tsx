import React, { useEffect, useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { 
  ChevronDown, 
  MenuIcon,
  PackageIcon, 
  LayoutDashboardIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  SettingsIcon,
  TagIcon,
  PackageOpenIcon,
  Wallet,
  ClockIcon,
  UserIcon,
  CoffeeIcon,
  ClipboardListIcon,
  ShieldIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageSearchIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/toaster";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MonedaSelector } from "@/components/ui/moneda-selector";
import axios from "axios";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
  children?: React.ReactNode;
  collapsed?: boolean;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type Permission = {
  id: number;
  nombre: string;
  slug: string;
  modulo: string;
  descripcion: string;
}

type PageProps = {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      permissions?: Permission[];
    }
  }
};

const SidebarItem = ({ icon, label, href, isActive, children, collapsed }: SidebarItemProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasChildren = Boolean(children);

  if (hasChildren) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {icon}
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {!collapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className={collapsed ? "pl-0 pt-1" : "pl-6 pt-1"}>
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { url, props } = usePage<PageProps>();
  const { auth } = props as PageProps;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Función para manejar el logout
  const handleLogout = () => {
    router.post('/logout');
  };

  // Función para verificar si el usuario tiene acceso a un módulo
  const hasAccessToModule = (module: string) => {
    if (auth?.user?.role === 'administrador') {
      return true; // El administrador tiene acceso a todo
    }

    // Para los demás roles, verificamos basados en los permisos configurados
    switch (auth?.user?.role) {
      case 'cajero':
        // Cajero tiene acceso a: Dashboard, Inventario, Mesas y Caja
        return ['dashboard', 'inventario', 'mesas', 'caja', 'facturacion'].includes(module);
      case 'mesero':
        // Mesero tiene acceso a: Dashboard, Mesas y Órdenes
        return ['dashboard', 'mesas', 'ordenes'].includes(module);
      case 'bartender':
        // Bartender tiene acceso a: Dashboard, Inventario y Órdenes
        return ['dashboard', 'inventario', 'ordenes'].includes(module);
      default:
        return false;
    }
  };
  
  const sidebarContent = (
    <div className="flex h-full flex-col gap-2">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2 px-4">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold tracking-tight">
              Discoteca POS
            </h2>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </Button>
        </div>
        
        {auth?.user && !sidebarCollapsed && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(auth.user.name)}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="font-medium truncate">{auth.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{auth.user.email}</p>
                <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">
                  {auth.user.role}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        {auth?.user && sidebarCollapsed && (
          <div className="mb-6 flex justify-center">
            <Avatar>
              <AvatarFallback>{getInitials(auth.user.name)}</AvatarFallback>
            </Avatar>
          </div>
        )}
        
        <Separator className="mb-4" />
        
        <div className="space-y-1">
          {/* Dashboard - Todos tienen acceso */}
          <SidebarItem
            icon={<LayoutDashboardIcon className="h-4 w-4" />}
            label="Dashboard"
            href="/dashboard"
            isActive={url === "/dashboard"}
            collapsed={sidebarCollapsed}
          />
          
          {/* Menú - Solo admin */}
          {hasAccessToModule('menu') && (
            <SidebarItem
              icon={<PackageIcon className="h-4 w-4" />}
              label="Menú"
              isActive={url.startsWith("/menu")}
              collapsed={sidebarCollapsed}
            >
              <SidebarItem
                icon={<PackageOpenIcon className="h-4 w-4" />}
                label="Productos"
                href="/menu/productos"
                isActive={url === "/menu/productos"}
                collapsed={sidebarCollapsed}
              />
              <SidebarItem
                icon={<TagIcon className="h-4 w-4" />}
                label="Categorías"
                href="/menu/categorias"
                isActive={url === "/menu/categorias"}
                collapsed={sidebarCollapsed}
              />
              <SidebarItem
                icon={<PackageSearchIcon className="h-4 w-4" />}
                label="Combos"
                href="/menu/combos"
                isActive={url === "/menu/combos"}
                collapsed={sidebarCollapsed}
              />
            </SidebarItem>
          )}
          
          {/* Inventario - Admin, Cajero, Bartender */}
          {hasAccessToModule('inventario') && (
            <SidebarItem
              icon={<ShoppingCartIcon className="h-4 w-4" />}
              label="Inventario"
              isActive={url.startsWith("/inventario")}
              collapsed={sidebarCollapsed}
            >
              <SidebarItem
                icon={<ShoppingCartIcon className="h-4 w-4" />}
                label="General"
                href="/inventario"
                isActive={url === "/inventario"}
                collapsed={sidebarCollapsed}
              />
            </SidebarItem>
          )}
          
          {/* Caja - Admin, Cajero */}
          {hasAccessToModule('caja') && (
            <SidebarItem
              icon={<Wallet className="h-4 w-4" />}
              label="Caja"
              isActive={url.startsWith("/caja")}
              collapsed={sidebarCollapsed}
            >
              <SidebarItem
                icon={<Wallet className="h-4 w-4" />}
                label="Abrir/Cerrar Caja"
                href="/caja/operaciones"
                isActive={url === "/caja/operaciones"}
                collapsed={sidebarCollapsed}
              />
              <SidebarItem
                icon={<ClockIcon className="h-4 w-4" />}
                label="Historial de Caja"
                href="/caja/historial"
                isActive={url === "/caja/historial"}
                collapsed={sidebarCollapsed}
              />
            </SidebarItem>
          )}
          
          {/* Mesas - Admin, Cajero, Mesero */}
          {hasAccessToModule('mesas') && (
            <SidebarItem
              icon={<CoffeeIcon className="h-4 w-4" />}
              label="Mesas"
              href="/mesas"
              isActive={url === "/mesas"}
              collapsed={sidebarCollapsed}
            />
          )}
          
          {/* Órdenes - Admin, Mesero, Bartender */}
          {hasAccessToModule('ordenes') && (
            <SidebarItem
              icon={<ShoppingCartIcon className="h-4 w-4" />}
              label="Órdenes"
              isActive={url.startsWith("/ordenes")}
              collapsed={sidebarCollapsed}
            >
              <SidebarItem
                icon={<ShoppingCartIcon className="h-4 w-4" />}
                label="Nueva Orden"
                href="/ordenes/nueva"
                isActive={url === "/ordenes/nueva"}
                collapsed={sidebarCollapsed}
              />
              {props.auth.user.role !== 'mesero' && (
                <SidebarItem
                  icon={<ShoppingCartIcon className="h-4 w-4" />}
                  label="Historial Ordenes"
                  href="/ordenes/historial"
                  isActive={url === "/ordenes/historial"}
                  collapsed={sidebarCollapsed}
                />
              )}
              <SidebarItem
                icon={<ClipboardListIcon className="h-4 w-4" />}
                label="Gestión de Órdenes Pagadas"
                href="/ordenes/gestion"
                isActive={url === "/ordenes/gestion"}
                collapsed={sidebarCollapsed}
              />
            </SidebarItem>
          )}
          
        
       
          
          {/* Usuarios - Solo admin */}
          {hasAccessToModule('usuarios') && (
            <SidebarItem
              icon={<UsersIcon className="h-4 w-4" />}
              label="Usuarios"
              isActive={url.startsWith("/usuarios") || url.startsWith("/roles")}
              collapsed={sidebarCollapsed}
            >
              <SidebarItem
                icon={<UserIcon className="h-4 w-4" />}
                label="Lista de Usuarios"
                href="/usuarios/lista"
                isActive={url === "/usuarios/lista"}
                collapsed={sidebarCollapsed}
              />
              <SidebarItem
                icon={<ShieldIcon className="h-4 w-4" />}
                label="Roles y Permisos"
                href="/roles"
                isActive={url === "/roles"}
                collapsed={sidebarCollapsed}
              />
            </SidebarItem>
          )}
          
          {/* Configuración - Solo admin */}
          {hasAccessToModule('configuracion') && (
            <SidebarItem
              icon={<SettingsIcon className="h-4 w-4" />}
              label="Configuración"
              href="/configuracion"
              isActive={url === "/configuracion"}
              collapsed={sidebarCollapsed}
            />
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOutIcon className="h-4 w-4" />
              {!sidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // Obtener el tema guardado
    const fetchTema = async () => {
      try {
        const response = await axios.get(route('configuracion.obtener-tema'));
        const tema = response.data.valor || 'system';
        
        // Aplicar el tema
        document.documentElement.setAttribute('data-theme', tema);
        
        if (tema === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('class', systemTheme);
        } else {
          document.documentElement.setAttribute('class', tema);
        }
      } catch (error) {
        console.error('Error al obtener el tema:', error);
      }
    };

    fetchTema();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className={cn(
        "border-r transition-all duration-300 ease-in-out md:block",
        sidebarCollapsed ? "w-16" : "w-64",
        "hidden md:block"
      )}>
        {sidebarContent}
      </aside>
      
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed left-4 top-4 z-40">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contenido principal */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}
