import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Moon, Sun, Monitor, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface ConfiguracionGeneralProps {
  tema_actual: string;
}

export default function ConfiguracionGeneral({ tema_actual = 'system' }: ConfiguracionGeneralProps) {
  const { toast } = useToast();
  const [tema, setTema] = useState(tema_actual);
  const [guardando, setGuardando] = useState(false);

  // Definición de temas de colores
  const temasColores = [
    { value: 'zinc', primary: 'bg-black', secondary: 'bg-zinc-400' },
    { value: 'blue', primary: 'bg-blue-700', secondary: 'bg-blue-300' },
    { value: 'green', primary: 'bg-green-700', secondary: 'bg-green-300' },
    { value: 'orange', primary: 'bg-orange-600', secondary: 'bg-orange-200' },
    { value: 'cyan', primary: 'bg-cyan-600', secondary: 'bg-cyan-200' },
    { value: 'purple', primary: 'bg-purple-700', secondary: 'bg-purple-300' },
    { value: 'violet', primary: 'bg-violet-700', secondary: 'bg-violet-200' },
    { value: 'black', primary: 'bg-black', secondary: 'bg-gray-600' },
    { value: 'indigo', primary: 'bg-indigo-700', secondary: 'bg-indigo-300' },
    { value: 'red', primary: 'bg-red-700', secondary: 'bg-red-300' },
    { value: 'amber', primary: 'bg-amber-600', secondary: 'bg-amber-200' },
    { value: 'rose', primary: 'bg-rose-600', secondary: 'bg-rose-300' },
  ];

  // Modo claro/oscuro/sistema
  const temasBase = [
    {
      value: 'light',
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro para mejor visibilidad durante el día'
    },
    {
      value: 'dark',
      label: 'Oscuro',
      icon: Moon,
      description: 'Tema oscuro para reducir la fatiga visual'
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: Monitor,
      description: 'Sigue la configuración de tu sistema operativo'
    }
  ];

  // Separar el tema por partes (base-color)
  useEffect(() => {
    if (tema_actual && tema_actual.includes('-')) {
      setTema(tema_actual);
    }
  }, [tema_actual]);

  const guardarConfiguracion = async () => {
    setGuardando(true);
    try {
      await axios.post(route('configuracion.actualizar'), {
        clave: 'tema',
        valor: tema
      });

      toast({
        title: "Configuración guardada",
        description: "El tema se ha actualizado correctamente.",
      });

      // Aplicar el tema inmediatamente
      aplicarTema(tema);

    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const aplicarTema = (temaValue: string) => {
    let modoBase = 'light';
    let color = '';
    
    // Si el tema incluye un guión, separar en modo base y color
    if (temaValue.includes('-')) {
      const [base, colorValue] = temaValue.split('-');
      modoBase = base;
      color = colorValue;
    } else {
      // Si solo tiene un valor, es un tema base
      modoBase = temaValue;
    }
    
    // Aplicar modo claro/oscuro
    if (modoBase === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('class', color ? `${systemTheme} ${color}` : systemTheme);
    } else {
      document.documentElement.setAttribute('class', color ? `${modoBase} ${color}` : modoBase);
    }
    
    // Almacenar en data-theme para referencia
    document.documentElement.setAttribute('data-theme', temaValue);
  };

  const restablecerTema = () => {
    setTema('system');
    aplicarTema('system');
  };

  // Escuchar cambios en el tema del sistema cuando está en modo 'system'
  useEffect(() => {
    if (tema.startsWith('system')) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const color = tema.includes('-') ? tema.split('-')[1] : '';
        document.documentElement.setAttribute('class', e.matches ? 
          (color ? `dark ${color}` : 'dark') : 
          (color ? `light ${color}` : 'light'));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [tema]);

  // Selección de un color
  const seleccionarColor = (color: string) => {
    // Extraer la base actual (light/dark/system)
    let base = 'light';
    if (tema.includes('-')) {
      base = tema.split('-')[0];
    } else {
      base = tema;
    }
    setTema(`${base}-${color}`);
  };

  return (
    <DashboardLayout>
      <Head title="Configuración General" />
      
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Configuración General</h1>
        
        <div className="grid gap-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Modifica la apariencia de la app a un color de tu preferencia
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Selector de tema base (claro/oscuro/sistema) */}
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Modo</h3>
                <RadioGroup 
                  value={tema.includes('-') ? tema.split('-')[0] : tema} 
                  onValueChange={(val) => {
                    // Mantener el color si ya existe
                    if (tema.includes('-')) {
                      setTema(`${val}-${tema.split('-')[1]}`);
                    } else {
                      setTema(val);
                    }
                  }} 
                  className="grid grid-cols-3 gap-4"
                >
                  {temasBase.map(({ value, label, icon: Icon }) => (
                    <Label
                      key={value}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer hover:bg-accent ${
                        (tema.includes('-') ? tema.split('-')[0] : tema) === value 
                          ? 'border-primary bg-accent/50' 
                          : 'border-input'
                      }`}
                      htmlFor={`tema-${value}`}
                    >
                      <RadioGroupItem value={value} id={`tema-${value}`} className="sr-only" />
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Selector de colores */}
              <div>
                <h3 className="text-md font-medium mb-3">Color</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {temasColores.map(color => (
                    <button
                      key={color.value}
                      onClick={() => seleccionarColor(color.value)}
                      className={cn(
                        "h-12 w-12 rounded-full relative overflow-hidden cursor-pointer border-2 transition-all",
                        tema.includes(color.value) ? "border-primary scale-110" : "border-transparent hover:scale-105"
                      )}
                      title={`Tema ${color.value}`}
                    >
                      <div className="absolute top-0 left-0 w-full h-1/2 rounded-t-full" style={{ background: `var(--${color.primary})` }}></div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 rounded-b-full" style={{ background: `var(--${color.secondary})` }}></div>
                      <div className={color.primary} style={{ width: '50%', height: '100%', position: 'absolute', left: 0 }}></div>
                      <div className={color.secondary} style={{ width: '50%', height: '100%', position: 'absolute', right: 0 }}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={restablecerTema}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Restablecer tema
                </Button>
                
                <Button
                  onClick={guardarConfiguracion}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 