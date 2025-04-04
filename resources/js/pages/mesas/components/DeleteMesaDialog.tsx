import React from 'react';
import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "@inertiajs/react";

type DeleteMesaDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  mesa: {
    id: number;
    numero: number;
  } | null;
};

export default function DeleteMesaDialog({
  isOpen,
  onClose,
  mesa,
}: DeleteMesaDialogProps) {
  const { delete: destroy, processing } = useForm();

  const handleDelete = () => {
    if (!mesa) return;

    destroy(route("mesas.destroy", { mesa: mesa.id }), {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará la Mesa {mesa?.numero}. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={processing}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
