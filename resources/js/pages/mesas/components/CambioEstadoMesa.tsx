import React from 'react';
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type CambioEstadoMesaProps = {
  mesa: {
    id: number;
    estado: string;
  };
};

export default function CambioEstadoMesa({ mesa }: CambioEstadoMesaProps) {
  // Initialize the form with empty data structure
  const form = useForm({
    estado: "",
  });

  const cambiarEstado = (nuevoEstado: string) => {
    if (mesa.estado === nuevoEstado) return;

    // Set the form data
    form.data.estado = nuevoEstado;
    
    // Submit the form with the patch method
    form.patch(route("mesas.cambiar-estado", { mesa: mesa.id }), {
      onSuccess: () => {
        toast({
          title: "Estado actualizado",
          description: `La mesa ha sido marcada como ${nuevoEstado}`,
          variant: "default",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado de la mesa",
          variant: "destructive",
        });
      },
      preserveScroll: true,
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={mesa.estado === "disponible" ? "default" : "outline"}
        size="sm"
        className="flex-1"
        disabled={form.processing || mesa.estado === "disponible"}
        onClick={() => cambiarEstado("disponible")}
      >
        Disponible
      </Button>
      
      <Button
        variant={mesa.estado === "ocupada" ? "default" : "outline"}
        size="sm"
        className="flex-1"
        disabled={form.processing || mesa.estado === "ocupada"}
        onClick={() => cambiarEstado("ocupada")}
      >
        Ocupada
      </Button>
      
      <Button
        variant={mesa.estado === "reservada" ? "default" : "outline"}
        size="sm"
        className="flex-1"
        disabled={form.processing || mesa.estado === "reservada"}
        onClick={() => cambiarEstado("reservada")}
      >
        Reservada
      </Button>
    </div>
  );
}
