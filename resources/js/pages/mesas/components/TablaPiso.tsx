import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import { Mesa } from "@/types/mesa";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type TablaPisoProps = {
  mesas: Mesa[];
  onSelectMesa: (mesa: Mesa) => void;
};

export default function TablaPiso({ mesas, onSelectMesa }: TablaPisoProps) {
  // Ubicaciones predefinidas
  const ubicacionesOrdenadas = ["primer nivel", "segundo nivel", "barra"];
  
  // Función para obtener el color del borde según el estado (más sutil)
  const getEstadoBorder = (estado: string) => {
    switch (estado) {
      case "disponible":
        return "border-green-200";
      case "ocupada":
        return "border-amber-200";
      case "reservada":
        return "border-blue-200";
      default:
        return "border-gray-100";
    }
  };

  return (
    <div className="space-y-8">
      {ubicacionesOrdenadas.map((ubicacion) => {
        const mesasPorUbicacion = mesas.filter(
          (mesa) => mesa.ubicacion.toLowerCase() === ubicacion.toLowerCase()
        );

        if (mesasPorUbicacion.length === 0) return null;

        return (
          <div key={ubicacion} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {ubicacion}
            </h3>
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {mesasPorUbicacion.map((mesa) => (
                <TooltipProvider key={mesa.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card
                        className={`border ${getEstadoBorder(mesa.estado)} bg-white shadow-sm hover:shadow transition-shadow duration-200 ${!mesa.activa ? "opacity-40" : ""}`}
                        onClick={() => onSelectMesa(mesa)}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <span className="text-xl font-medium text-gray-900">{mesa.numero}</span>
                          
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{mesa.capacidad}</span>
                          </div>
                          
                          <div className={`mt-2 w-2 h-2 rounded-full ${
                            mesa.estado === 'disponible' ? 'bg-green-400' : 
                            mesa.estado === 'ocupada' ? 'bg-amber-400' : 
                            mesa.estado === 'reservada' ? 'bg-blue-400' : 'bg-gray-400'
                          }`}>
                          </div>
                          
                          {mesa.estado === 'ocupada' && mesa.orden?.user && (
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[80px]">{mesa.orden.user.name}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    {mesa.estado === 'ocupada' && mesa.orden?.user && (
                      <TooltipContent side="top">
                        <div className="text-xs">
                          <p className="font-semibold">Ocupada por: {mesa.orden.user.name}</p>
                          <p className="text-muted-foreground">{mesa.orden.numero_orden}</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
