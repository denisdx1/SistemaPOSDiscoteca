import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ChevronLeft,
  Plus,
  X,
  Search,
  Tag,
  Package,
  Save,
  Trash2
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  precio: number;
  stock: number;
  categoria?: {
    id: number;
    nombre: string;
    color: string;
  };
}

interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

interface ComboComponent {
  producto_id: number;
  producto: Producto;
  cantidad: number;
}

interface CreateComboProps {
  productos: Producto[];
  categorias: Categoria[];
}

interface ComboFormData {
  nombre: string;
  codigo: string;
  precio: string;
  categoria_id: string;
  activo: boolean;
  componentes: { producto_id: number; cantidad: number }[];
  [key: string]: any;
}

export default function CreateCombo({ productos, categorias }: CreateComboProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<ComboComponent[]>([]);
  const [temporaryCantidad, setTemporaryCantidad] = useState<number>(1);
  const [temporaryProductId, setTemporaryProductId] = useState<number | null>(null);

  const { data, setData, post, processing, errors } = useForm<ComboFormData>({
    nombre: '',
    codigo: '',
    precio: '',
    categoria_id: '',
    activo: true,
    componentes: [] as { producto_id: number; cantidad: number }[]
  });

  useEffect(() => {
    // Actualizar componentes en el formulario cuando cambia selectedComponents
    setData('componentes', selectedComponents.map(comp => ({
      producto_id: comp.producto_id,
      cantidad: comp.cantidad
    })));
  }, [selectedComponents]);

  // Filtrar productos según el término de búsqueda
  const filteredProductos = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (producto.categoria && producto.categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Verificar si un producto ya está en el combo
  const isProductInCombo = (productoId: number) => {
    return selectedComponents.some(comp => comp.producto_id === productoId);
  };

  // Agregar un producto al combo
  const handleAddProduct = () => {
    if (!temporaryProductId || temporaryCantidad <= 0) return;
    
    const producto = productos.find(p => p.id === temporaryProductId);
    if (!producto) return;
    
    if (isProductInCombo(temporaryProductId)) {
      // Actualizar cantidad si el producto ya está en el combo
      setSelectedComponents(prevComponents => 
        prevComponents.map(comp => 
          comp.producto_id === temporaryProductId 
            ? { ...comp, cantidad: comp.cantidad + temporaryCantidad } 
            : comp
        )
      );
    } else {
      // Agregar nuevo componente
      setSelectedComponents(prev => [
        ...prev, 
        { 
          producto_id: temporaryProductId, 
          producto: producto,
          cantidad: temporaryCantidad 
        }
      ]);
    }
    
    setIsAddProductOpen(false);
    setTemporaryProductId(null);
    setTemporaryCantidad(1);
  };

  // Eliminar un producto del combo
  const handleRemoveProduct = (productoId: number) => {
    setSelectedComponents(prev => prev.filter(comp => comp.producto_id !== productoId));
  };

  // Actualizar la cantidad de un producto
  const handleUpdateQuantity = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) return;
    
    setSelectedComponents(prevComponents => 
      prevComponents.map(comp => 
        comp.producto_id === productoId 
          ? { ...comp, cantidad } 
          : comp
      )
    );
  };

  // Calcular el precio sugerido basado en los componentes
  const calculateSuggestedPrice = () => {
    return selectedComponents.reduce((total, comp) => 
      total + (comp.producto.precio * comp.cantidad), 0
    );
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedComponents.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto al combo.",
        variant: "destructive",
      });
      return;
    }
    
    post(route('menu.combos.store'), {
      onSuccess: () => {
        toast({
          title: "Combo creado",
          description: "El combo ha sido creado correctamente.",
        });
      },
      onError: (errors) => {
        console.error(errors);
        toast({
          title: "Error",
          description: "No se pudo crear el combo. Verifica los datos e intenta nuevamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <DashboardLayout>
      <Head title="Crear Nuevo Combo" />
      
      <div className="container mx-auto py-4">
        <div className="flex items-center mb-6">
          <Link href={route('menu.combos.index')} className="mr-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Crear Nuevo Combo</h1>
            <p className="text-muted-foreground">
              Define los datos básicos y componentes del combo
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Combo</CardTitle>
                  <CardDescription>
                    Datos básicos del combo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input 
                      id="nombre"
                      value={data.nombre}
                      onChange={e => setData('nombre', e.target.value)}
                      placeholder="Ej: Cubeta de Cervezas"
                    />
                    {errors.nombre && (
                      <p className="text-sm text-destructive">{errors.nombre}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input 
                      id="codigo"
                      value={data.codigo}
                      onChange={e => setData('codigo', e.target.value)}
                      placeholder="Ej: COMBO-001"
                    />
                    {errors.codigo && (
                      <p className="text-sm text-destructive">{errors.codigo}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={data.categoria_id}
                      onValueChange={(value) => setData('categoria_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sin categoría</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            <div className="flex items-center">
                              <span 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: categoria.color }}
                              ></span>
                              {categoria.nombre}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoria_id && (
                      <p className="text-sm text-destructive">{errors.categoria_id}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio (S/)</Label>
                    <Input 
                      id="precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.precio}
                      onChange={e => setData('precio', e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.precio && (
                      <p className="text-sm text-destructive">{errors.precio}</p>
                    )}
                    {selectedComponents.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Precio sugerido: S/ {calculateSuggestedPrice().toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="activo"
                      checked={data.activo}
                      onCheckedChange={() => {
                        setData('activo', !data.activo);
                      }}
                    />
                    <Label htmlFor="activo">Combo activo</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Componentes del Combo</CardTitle>
                    <CardDescription>
                      Productos incluidos en el combo
                    </CardDescription>
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => setIsAddProductOpen(true)}
                    className="flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Producto
                  </Button>
                </CardHeader>
                <CardContent>
                  {selectedComponents.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Precio Unit.</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedComponents.map((componente) => (
                            <TableRow key={componente.producto_id}>
                              <TableCell className="font-medium">
                                {componente.producto.nombre}
                                {componente.producto.categoria && (
                                  <Badge 
                                    className="ml-2"
                                    style={{ 
                                      backgroundColor: componente.producto.categoria.color + '20', 
                                      color: componente.producto.categoria.color, 
                                      borderColor: componente.producto.categoria.color + '30' 
                                    }}
                                    variant="outline"
                                  >
                                    {componente.producto.categoria.nombre}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{componente.producto.codigo}</TableCell>
                              <TableCell>S/ {Number(componente.producto.precio).toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleUpdateQuantity(componente.producto_id, componente.cantidad - 1)}
                                    disabled={componente.cantidad <= 1}
                                  >
                                    <span>-</span>
                                  </Button>
                                  <span className="w-8 text-center">{componente.cantidad}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleUpdateQuantity(componente.producto_id, componente.cantidad + 1)}
                                  >
                                    <span>+</span>
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                S/ {(componente.producto.precio * componente.cantidad).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleRemoveProduct(componente.producto_id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium mb-1">No hay productos</h3>
                      <p className="text-muted-foreground mb-4">
                        Agrega productos para crear el combo
                      </p>
                      <Button 
                        type="button"
                        onClick={() => setIsAddProductOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Producto
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={route('menu.combos.index')}>
                    <Button variant="outline">Cancelar</Button>
                  </Link>
                  <Button 
                    type="submit"
                    disabled={processing || selectedComponents.length === 0}
                    className="flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Combo
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Diálogo para agregar productos */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto al Combo</DialogTitle>
            <DialogDescription>
              Selecciona un producto y la cantidad para agregarlo al combo
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar producto por nombre, código o categoría..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="rounded-md border overflow-hidden h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-20 text-center">Seleccionar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductos.length > 0 ? (
                  filteredProductos.map((producto) => (
                    <TableRow 
                      key={producto.id}
                      className={temporaryProductId === producto.id ? 'bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">
                        {producto.nombre}
                        {producto.categoria && (
                          <Badge 
                            className="ml-2"
                            style={{ 
                              backgroundColor: producto.categoria.color + '20', 
                              color: producto.categoria.color, 
                              borderColor: producto.categoria.color + '30' 
                            }}
                            variant="outline"
                          >
                            {producto.categoria.nombre}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{producto.codigo}</TableCell>
                      <TableCell>S/ {Number(producto.precio).toFixed(2)}</TableCell>
                      <TableCell>{producto.stock}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant={temporaryProductId === producto.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTemporaryProductId(producto.id)}
                          className="w-full"
                        >
                          {temporaryProductId === producto.id ? "Seleccionado" : "Seleccionar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="cantidad">Cantidad:</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                className="w-20"
                value={temporaryCantidad}
                onChange={(e) => setTemporaryCantidad(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddProductOpen(false);
                setTemporaryProductId(null);
                setTemporaryCantidad(1);
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleAddProduct}
              disabled={!temporaryProductId}
            >
              Agregar al Combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 