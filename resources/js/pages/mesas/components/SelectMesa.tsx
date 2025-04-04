
import React from "react";
import { Mesa } from "@/types/mesa";
import { Check, ChevronsUpDown, CoffeeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectMesaProps {
  mesas?: Mesa[] | null;
  selectedMesa: Mesa | null | undefined;
  onMesaSelected: (mesa: Mesa | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
  error?: string;
}

export function SelectMesa({ 
  mesas = [], 
  selectedMesa, 
  onMesaSelected, 
  allowClear = true,
  disabled = false,
  error 
}: SelectMesaProps) {
  const [open, setOpen] = React.useState(false);
  
  // Filtrar solo mesas disponibles o la mesa actualmente seleccionada
  const mesasDisponibles = React.useMemo(() => {
    if (!mesas) return [];
    return mesas.filter(mesa => 
      mesa.activa && (mesa.estado === 'disponible' || mesa.id === selectedMesa?.id)
    );
  }, [mesas, selectedMesa]);

  // Función para renderizar el estado de la mesa
  const renderMesaEstado = (mesa: Mesa) => {
    switch (mesa.estado) {
      case 'ocupada':
        return <span className="text-amber-500 ml-2">(Ocupada)</span>;
      case 'reservada':
        return <span className="text-blue-500 ml-2">(Reservada)</span>;
      default:
        return <span className="text-green-500 ml-2">(Disponible)</span>;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={disabled}
          >
            {selectedMesa ? (
              <span className="flex items-center">
                <CoffeeIcon className="mr-2 h-4 w-4" />
                Mesa {selectedMesa.numero} ({selectedMesa.capacidad} personas)
                {selectedMesa.ubicacion && ` - ${selectedMesa.ubicacion}`}
              </span>
            ) : (
              <span>Seleccionar Mesa</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Buscar mesa..." />
            <CommandEmpty>No se encontró ninguna mesa disponible.</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  key="sin-mesa"
                  value="sin-mesa"
                  onSelect={() => {
                    onMesaSelected(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selectedMesa ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>Sin mesa (para llevar)</span>
                </CommandItem>
              )}
              {mesasDisponibles.map((mesa) => (
                <CommandItem
                  key={mesa.id}
                  value={`mesa-${mesa.id}`}
                  onSelect={() => {
                    onMesaSelected(mesa);
                    setOpen(false);
                  }}
                  disabled={mesa.estado !== 'disponible' && mesa.id !== selectedMesa?.id}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMesa?.id === mesa.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>
                    Mesa {mesa.numero} ({mesa.capacidad} personas)
                    {mesa.ubicacion && ` - ${mesa.ubicacion}`}
                    {renderMesaEstado(mesa)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
