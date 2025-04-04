import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategoriaSelectorProps {
  categorias: { id: number; nombre: string; color: string }[];
  selectedCategoria: number | null;
  onSelectCategoria: (categoriaId: number | null) => void;
}

const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  categorias,
  selectedCategoria,
  onSelectCategoria,
}) => {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex space-x-2 pb-2 w-max min-w-full">
        <Button
          variant={selectedCategoria === null ? "default" : "outline"}
          className="rounded-full min-w-max whitespace-nowrap"
          onClick={() => onSelectCategoria(null)}
        >
          Todas
        </Button>
        
        {categorias.map((categoria) => (
          <Button
            key={categoria.id}
            variant={selectedCategoria === categoria.id ? "default" : "outline"}
            className="rounded-full min-w-max whitespace-nowrap"
            style={{
              backgroundColor: selectedCategoria === categoria.id 
                ? categoria.color 
                : 'transparent',
              borderColor: categoria.color,
              color: selectedCategoria === categoria.id 
                ? '#ffffff' 
                : categoria.color,
            }}
            onClick={() => onSelectCategoria(categoria.id)}
          >
            {categoria.nombre}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoriaSelector; 