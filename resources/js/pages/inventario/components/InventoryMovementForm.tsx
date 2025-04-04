import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, ArrowDownIcon, ArrowDownUp } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: number;
  nombre: string;
  codigo: string;
  stock_actual: number;
}

interface InventoryMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'entrada' | 'salida' | 'ajuste';
  onSuccess?: () => void;
}

export const InventoryMovementForm: React.FC<InventoryMovementFormProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    observacion: '',
    tipo_movimiento: type,
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      form.reset();
      form.setData('tipo_movimiento', type);
    }
  }, [isOpen, type]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/inventario/stock');
      console.log('Products API response:', response.data); // Debugging log
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setProducts(response.data.data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          codigo: item.codigo,
          stock_actual: item.stock_actual || 0
        })));
      } else {
        console.error('Unexpected product response format:', response.data);
        toast({
          title: 'Error',
          description: 'Formato de respuesta de productos inesperado.',
          variant: 'destructive'
        });
        setProducts([]); // Ensure we have an empty array at minimum
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos.',
        variant: 'destructive'
      });
      setProducts([]); // Ensure we have an empty array on error
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    form.post('/inventario/movimientos', {
      onSuccess: () => {
        setLoading(false);
        toast({
          title: 'Éxito',
          description: `El movimiento de ${typeTitle.toLowerCase()} se ha registrado correctamente.`,
          variant: 'default'
        });
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (errors) => {
        setLoading(false);
        console.error('Errores:', errors);
        toast({
          title: 'Error',
          description: 'Hubo un problema al registrar el movimiento. Por favor, verifica los datos.',
          variant: 'destructive'
        });
      }
    });
  };

  let typeTitle = '';
  let typeIcon = null;
  let cantidadLabel = 'Cantidad';

  switch (type) {
    case 'entrada':
      typeTitle = 'Entrada de Inventario';
      typeIcon = <ArrowDownIcon className="h-5 w-5 mr-2" />;
      cantidadLabel = 'Cantidad a Ingresar';
      break;
    case 'salida':
      typeTitle = 'Salida de Inventario';
      typeIcon = <ArrowUpIcon className="h-5 w-5 mr-2" />;
      cantidadLabel = 'Cantidad a Retirar';
      break;
    case 'ajuste':
      typeTitle = 'Ajuste de Inventario';
      typeIcon = <ArrowDownUp className="h-5 w-5 mr-2" />;
      cantidadLabel = 'Cantidad a Ajustar (+/-)';
      break;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {typeIcon}
            {typeTitle}
          </DialogTitle>
          <DialogDescription>
            Registra un movimiento de {typeTitle.toLowerCase()} en el inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="producto_id">
                Producto
              </Label>
              <div className="col-span-3">
                <Select 
                  name="producto_id"
                  value={form.data.producto_id}
                  onValueChange={(value) => form.setData('producto_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(products) && products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.nombre} - {product.codigo}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        No hay productos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.errors.producto_id && (
                  <p className="text-sm text-red-500 mt-1">{form.errors.producto_id}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="cantidad">
                {cantidadLabel}
              </Label>
              <div className="col-span-3">
                <Input
                  id="cantidad"
                  type="number"
                  step="1"
                  value={form.data.cantidad}
                  onChange={(e) => form.setData('cantidad', e.target.value)}
                  className="col-span-3"
                />
                {form.errors.cantidad && (
                  <p className="text-sm text-red-500 mt-1">{form.errors.cantidad}</p>
                )}
              </div>
            </div>

            {type === 'entrada' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="precio_unitario">
                  Precio Unitario
                </Label>
                <div className="col-span-3">
                  <Input
                    id="precio_unitario"
                    type="number"
                    step="0.01"
                    value={form.data.precio_unitario}
                    onChange={(e) => form.setData('precio_unitario', e.target.value)}
                    className="col-span-3"
                  />
                  {form.errors.precio_unitario && (
                    <p className="text-sm text-red-500 mt-1">{form.errors.precio_unitario}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="observacion">
                Observación
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="observacion"
                  value={form.data.observacion}
                  onChange={(e) => form.setData('observacion', e.target.value)}
                  className="col-span-3"
                />
                {form.errors.observacion && (
                  <p className="text-sm text-red-500 mt-1">{form.errors.observacion}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryMovementForm;
