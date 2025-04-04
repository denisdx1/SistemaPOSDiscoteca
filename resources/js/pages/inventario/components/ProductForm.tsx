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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { PackageIcon, RefreshCw } from 'lucide-react';

interface Category {
  id: number;
  nombre: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productToEdit?: any; // Si se proporciona, estaremos editando este producto
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit
}) => {
  const [categories, setCategories] = useState<Category[]>([]); // Initialize with empty array
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!productToEdit;

  const form = useForm({
    nombre: '',
    codigo: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    stock: '',
    activo: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      
      if (isEditing && productToEdit) {
        form.setData({
          nombre: productToEdit.nombre || '',
          codigo: productToEdit.codigo || '',
          descripcion: productToEdit.descripcion || '',
          precio: productToEdit.precio || '',
          categoria_id: productToEdit.categoria_id ? productToEdit.categoria_id.toString() : '',
          stock: productToEdit.stock_actual ? productToEdit.stock_actual.toString() : '',
          activo: productToEdit.activo || true
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, productToEdit]);

  const fetchCategories = async () => {
    try {
      // Change the endpoint from /menu/categorias to /menu/categorias/all
      const response = await axios.get('/menu/categorias/all');
      console.log('Categories API response:', response.data);
      
      // Use the correct response format from the getAll method
      if (response.data && response.data.categorias) {
        setCategories(response.data.categorias);
      } else if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error('Unexpected category response format:', response.data);
        toast({
          title: 'Error',
          description: 'Formato de respuesta de categorías inesperado.',
          variant: 'destructive'
        });
        setCategories([]); // Ensure we have an empty array at minimum
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías.',
        variant: 'destructive'
      });
      setCategories([]); // Ensure we have an empty array on error
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    const url = isEditing 
      ? `/menu/productos/${productToEdit.id}` 
      : '/menu/productos';
    
    const method = isEditing ? 'put' : 'post';
    
    form[method](url, {
      onSuccess: () => {
        setLoading(false);
        toast({
          title: 'Éxito',
          description: `El producto ha sido ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
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
          description: `Hubo un problema al ${isEditing ? 'actualizar' : 'crear'} el producto. Por favor, verifica los datos.`,
          variant: 'destructive'
        });
      }
    });
  };

  const handleGenerarCodigo = async () => {
    if (!form.data.categoria_id) {
      toast({
        title: "Error",
        description: "Selecciona una categoría primero",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await axios.post(route('menu.productos.generar-codigo'), {
        categoria_id: form.data.categoria_id
      });

      if (response.data.success) {
        form.setData('codigo', response.data.codigo);
        toast({
          title: "Código generado",
          description: "Se ha generado un nuevo código automáticamente",
        });
      }
    } catch (error) {
      console.error('Error al generar código:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el código automáticamente",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PackageIcon className="h-5 w-5 mr-2" />
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Actualiza la información del producto existente.' 
              : 'Completa el formulario para agregar un nuevo producto al inventario.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Producto *</Label>
              <Input
                id="nombre"
                value={form.data.nombre}
                onChange={(e) => form.setData('nombre', e.target.value)}
                placeholder="Nombre del producto"
                required
              />
              {form.errors.nombre && (
                <p className="text-sm text-red-500">{form.errors.nombre}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  value={form.data.codigo}
                  onChange={(e) => form.setData('codigo', e.target.value)}
                  placeholder="Código identificador"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerarCodigo}
                  title="Generar código automáticamente"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {form.errors.codigo && (
                <p className="text-sm text-red-500">{form.errors.codigo}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={form.data.descripcion}
              onChange={(e) => form.setData('descripcion', e.target.value)}
              placeholder="Descripción del producto"
              rows={3}
            />
            {form.errors.descripcion && (
              <p className="text-sm text-red-500">{form.errors.descripcion}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="precio">Precio de Venta *</Label>
            <Input
              id="precio"
              type="number"
              step="0.01"
              value={form.data.precio}
              onChange={(e) => form.setData('precio', e.target.value)}
              placeholder="0.00"
              required
            />
            {form.errors.precio && (
              <p className="text-sm text-red-500">{form.errors.precio}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoría</Label>
            <Select 
              name="categoria_id"
              value={form.data.categoria_id}
              onValueChange={(value) => form.setData('categoria_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una categoría" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.nombre}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No hay categorías disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.errors.categoria_id && (
              <p className="text-sm text-red-500">{form.errors.categoria_id}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={form.data.stock}
              onChange={(e) => form.setData('stock', e.target.value)}
              placeholder="Cantidad en stock"
            />
            {form.errors.stock && (
              <p className="text-sm text-red-500">{form.errors.stock}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="activo" 
              checked={form.data.activo} 
              onCheckedChange={(checked:true) => 
                form.setData('activo', checked)
              }
            />
            <Label htmlFor="activo">Producto Activo</Label>
          </div>

          <DialogFooter className="pt-4">
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
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
