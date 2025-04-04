import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/components/ui/icons";

interface Moneda {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa_cambio: number;
  es_predeterminada: boolean;
  activo: boolean;
  formato_numero: string;
  decimales: number;
  separador_decimal: string;
  separador_miles: string;
  codigo_pais: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

interface MonedaSelectorProps {
  onMonedaChange?: (moneda: Moneda) => void;
  className?: string;
}

export function MonedaSelector({ onMonedaChange, className = '' }: MonedaSelectorProps) {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [monedaActual, setMonedaActual] = useState<string>('PEN');
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Cargar las monedas disponibles
  useEffect(() => {
    const cargarMonedas = async () => {
      try {
        setLoading(true);
        const response = await axios.get<{ monedas: Moneda[], monedaActual: string }>(route('monedas.index'));
        setMonedas(response.data.monedas);
        setMonedaActual(response.data.monedaActual);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar monedas:', error);
        setLoading(false);
        toast({
          title: "Error",
          description: "No se pudieron cargar las monedas disponibles",
          variant: "destructive"
        });
      }
    };

    cargarMonedas();
  }, []);

  // Manejar el cambio de moneda
  const handleCambioMoneda = async (codigo: string) => {
    try {
      const response = await axios.post<{ message: string, moneda: Moneda }>(
        route('monedas.cambiar'),
        { codigo }
      );
      
      setMonedaActual(codigo);
      
      toast({
        title: "Moneda actualizada",
        description: response.data.message,
      });
      
      // Notificar al componente padre si existe el callback
      if (onMonedaChange && response.data.moneda) {
        onMonedaChange(response.data.moneda);
      }
      
      // Forzar recarga de la página para aplicar los cambios de moneda
      window.location.reload();
      
    } catch (error) {
      console.error('Error al cambiar moneda:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la moneda",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={className}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <Icons.spinner className="h-4 w-4 animate-spin" />
          <span className="text-xs">Cargando...</span>
        </div>
      ) : (
        <Select value={monedaActual} onValueChange={handleCambioMoneda}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Seleccionar moneda" />
          </SelectTrigger>
          <SelectContent>
            {monedas && monedas.length > 0 ? (
              monedas.map((moneda) => (
                <SelectItem 
                  key={moneda.codigo} 
                  value={moneda.codigo}
                >
                  <span className="flex items-center">
                    <span className="mr-2">{moneda.simbolo}</span>
                    <span>{moneda.codigo}</span>
                  </span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="PEN" disabled>
                <span className="text-muted-foreground">No hay monedas disponibles</span>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 