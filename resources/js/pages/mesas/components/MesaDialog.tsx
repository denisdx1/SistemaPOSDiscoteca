import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Edit, Trash2 } from "lucide-react";
import CambioEstadoMesa from "./CambioEstadoMesa";
import MesaAcciones from "./MesaAcciones";
import { Mesa } from "@/types/mesa";

type MesaDialogProps = {
  mesa: Mesa | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (mesa: Mesa) => void;
  onDelete?: (mesa: Mesa) => void;
};

export default function MesaDialog({ mesa, isOpen, onClose, onEdit, onDelete }: MesaDialogProps) {
  if (!mesa) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-xl">Mesa {mesa.numero}</span>
            <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
              mesa.estado === 'disponible' ? 'bg-green-400' : 
              mesa.estado === 'ocupada' ? 'bg-amber-400' : 
              mesa.estado === 'reservada' ? 'bg-blue-400' : 'bg-gray-400'
            }`} />
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {mesa.capacidad} personas
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              {mesa.ubicacion}
            </div>
          </div>

          {mesa.notas && (
            <div className="mb-4 text-sm text-gray-500">
              <p>{mesa.notas}</p>
            </div>
          )}

          {mesa.estado === 'ocupada' && (
            <div className="mb-4 p-2 bg-muted rounded-md">
              <div className="text-sm font-medium mb-1">Mesa ocupada por:</div>
              <div className="text-sm">
                {mesa.orden?.user?.name || 'Usuario no disponible'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Orden: {mesa.orden?.numero_orden || 'N/A'}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Estado</div>
            <CambioEstadoMesa mesa={mesa} />
          </div>

          <div className="mt-4">
            <MesaAcciones mesa={mesa} />
          </div>
        </div>

        {(onEdit || onDelete) && (
          <DialogFooter className="border-t pt-4 flex justify-between">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(mesa)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={() => onDelete(mesa)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
