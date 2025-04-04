
import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mesa } from "@/types/mesa";

type MesaFormProps = {
  isOpen: boolean;
  onClose: () => void;
  mesa: Mesa | null;
};

export default function MesaForm({ isOpen, onClose, mesa }: MesaFormProps) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
    numero: mesa?.numero ?? "",
    capacidad: mesa?.capacidad ?? 1,
    estado: mesa?.estado ?? "disponible",
    ubicacion: mesa?.ubicacion ?? "Interior",
    notas: mesa?.notas ?? "",
    activa: mesa?.activa ?? true,
  });

  useEffect(() => {
    if (isOpen && mesa) {
      setData({
        numero: mesa.numero || "",
        capacidad: mesa.capacidad || 1,
        estado: mesa.estado || "disponible",
        ubicacion: mesa.ubicacion || "Interior",
        notas: mesa.notas || "",
        activa: mesa.activa,
      });
    } else if (isOpen && !mesa) {
      reset();
    }
  }, [isOpen, mesa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mesa?.id) {
      put(route("mesas.update", { mesa: mesa.id }), {
        onSuccess: () => onClose(),
      });
    } else {
      post(route("mesas.store"), {
        onSuccess: () => onClose(),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mesa ? "Editar Mesa" : "Añadir Nueva Mesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número*</Label>
              <Input
                id="numero"
                type="number"
                min="1"
                required
                value={data.numero}
                onChange={(e) => setData("numero", parseInt(e.target.value) || "")}
              />
              {errors.numero && (
                <p className="text-sm text-red-500">{errors.numero}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad*</Label>
              <Input
                id="capacidad"
                type="number"
                min="1"
                required
                value={data.capacidad}
                onChange={(e) =>
                  setData("capacidad", parseInt(e.target.value) || 1)
                }
              />
              {errors.capacidad && (
                <p className="text-sm text-red-500">{errors.capacidad}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado*</Label>
            <Select
              value={data.estado}
              onValueChange={(value: 'disponible' | 'ocupada' | 'reservada') => setData("estado", value)}
            >
              <SelectTrigger id="estado">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupada">Ocupada</SelectItem>
                <SelectItem value="reservada">Reservada</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-sm text-red-500">{errors.estado}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación*</Label>
            <Select
              value={data.ubicacion}
              onValueChange={(value) => setData("ubicacion", value)}
            >
              <SelectTrigger id="ubicacion">
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primer nivel">Primer nivel</SelectItem>
                <SelectItem value="segundo nivel">Segundo nivel</SelectItem>
                <SelectItem value="barra">Barra</SelectItem>
              </SelectContent>
            </Select>
            {errors.ubicacion && (
              <p className="text-sm text-red-500">{errors.ubicacion}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Notas sobre la mesa..."
              className="resize-none"
              value={data.notas}
              onChange={(e) => setData("notas", e.target.value)}
            />
            {errors.notas && (
              <p className="text-sm text-red-500">{errors.notas}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="activa"
              checked={data.activa}
              onCheckedChange={(checked) => setData("activa", checked)}
            />
            <Label htmlFor="activa">Mesa activa</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={processing}>
              {mesa ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
