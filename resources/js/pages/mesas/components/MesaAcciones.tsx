import React, { useState } from 'react';
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ShoppingCartIcon, CreditCardIcon } from "lucide-react";
import axios from 'axios';
import OrdenDetailsDialog from './OrdenDetailsDialog';

type MesaAccionesProps = {
  mesa: {
    id: number;
    numero: number;
    estado: string;
    orden?: {
      id: number;
    };
  };
};

export default function MesaAcciones({ mesa }: MesaAccionesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdenDialogOpen, setIsOrdenDialogOpen] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null);

  const ordenar = () => {
    // Mostrar toast informativo
    toast({
      title: "Procesando...",
      description: `Preparando pantalla de órdenes para Mesa ${mesa.numero}`,
      duration: 2000,
    });
    
    // Navegar a la pantalla de nueva orden con la mesa preseleccionada
    router.visit(route('ordenes.nueva', mesa.id), {
      preserveState: false,
      replace: true,
    });
  };

  const cobrar = () => {
    // Si la mesa no está ocupada, no permitir cobrar
    if (mesa.estado !== "ocupada") {
      toast({
        title: "No se puede cobrar",
        description: "La mesa debe estar ocupada para poder cobrar",
        variant: "destructive",
      });
      return;
    }
    
    // Redirigir a la página de cobro con la mesa pre-seleccionada
    router.visit(route("facturacion.crear", { mesa_id: mesa.id }));
  };

  return (
    <>
      <div className="flex flex-col gap-2 mt-2">
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
          onClick={ordenar}
        >
          <ShoppingCartIcon className="mr-2 h-4 w-4" />
          Ordenar
        </Button>
        
        <Button 
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={cobrar}
          disabled={mesa.estado !== "ocupada"}
        >
          <CreditCardIcon className="mr-2 h-4 w-4" />
          Cobrar
        </Button>
      </div>
      
      {/* Diálogo de detalles de orden */}
      <OrdenDetailsDialog 
        orden={ordenDetalle} 
        isOpen={isOrdenDialogOpen} 
        onClose={() => setIsOrdenDialogOpen(false)} 
      />
    </>
  );
}
