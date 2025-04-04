import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Moon, Sun, Monitor } from 'lucide-react';
import axios from 'axios';

interface ConfiguracionGeneralProps {
  tema_actual: string;
}

export default function ConfiguracionGeneral({ tema_actual = 'system' }: ConfiguracionGeneralProps) {
  const { toast } = useToast();
  const [tema, setTema] = useState(tema_actual);
  const [guardando, setGuardando] = useState(false);

  const temas = [
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
      document.documentElement.setAttribute('data-theme', tema);
      
      if (tema === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('class', systemTheme);
      } else {
        document.documentElement.setAttribute('class', tema);
      }

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

  // Escuchar cambios en el tema del sistema cuando está en modo 'system'
  useEffect(() => {
    if (tema === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('class', e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [tema]);

  return (
    <DashboardLayout>
      <Head title="Configuración General" />
      
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Configuración General</h1>
        
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Tema de la Aplicación</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación según tus preferencias
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <RadioGroup value={tema} onValueChange={setTema} className="grid gap-4">
                {temas.map(({ value, label, icon: Icon, description }) => (
                  <Label
                    key={value}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent ${
                      tema === value ? 'border-primary' : 'border-input'
                    }`}
                    htmlFor={`tema-${value}`}
                  >
                    <RadioGroupItem value={value} id={`tema-${value}`} />
                    <Icon className="h-5 w-5" />
                    <div className="grid gap-1">
                      <div className="font-semibold">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {description}
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <Button
                className="w-full mt-6"
                onClick={guardarConfiguracion}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 