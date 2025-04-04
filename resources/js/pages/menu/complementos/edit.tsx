import React, { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeftIcon, CheckIcon, PlusIcon, MinusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definir tipos necesarios
type Categoria = {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  stock: number;
  codigo: string;
  imagen_url: string;
  activo: boolean;
  categoria_id: number;
  categoria: Categoria;
};

type ProductoComplementario = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: Categoria;
  pivot: {
    cantidad_requerida: number;
    es_obligatorio: boolean;
    es_gratuito: boolean;
  };
};

interface PageProps {
  producto: Producto & { productosComplementarios: ProductoComplementario[] };
  productosPorCategoria: Record<string, Producto[]>;
  categorias: Categoria[];
  categoriaBebidas: Categoria | null;
}

export default function EditComplementos({ producto, productosPorCategoria, categorias, categoriaBebidas }: PageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState<Record<string, Producto[]>>(productosPorCategoria);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas");
  const [selectedComplementos, setSelectedComplementos] = useState<Array<{
    id: number;
    nombre: string;
    categoria_id: number;
    cantidad_requerida: number;
    es_obligatorio: boolean;
    es_gratuito: boolean;
  }>>([]);

  // Inicializar los complementos seleccionados con los existentes
  useEffect(() => {
    if (producto.productosComplementarios) {
      const complementosActuales = producto.productosComplementarios.map((comp: ProductoComplementario) => ({
        id: comp.id,
        nombre: comp.nombre,
        categoria_id: comp.categoria.id,
        cantidad_requerida: comp.pivot.cantidad_requerida,
        es_obligatorio: comp.pivot.es_obligatorio,
        es_gratuito: comp.pivot.es_gratuito || false
      }));
      setSelectedComplementos(complementosActuales);
    }
  }, [producto]);

  // Filtrar productos por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setProductosFiltrados(productosPorCategoria);
    } else {
      const filteredProducts: Record<string, Producto[]> = {};
      
      Object.entries(productosPorCategoria).forEach(([categoriaId, productos]) => {
        const filtered = productos.filter(
          p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (filtered.length > 0) {
          filteredProducts[categoriaId] = filtered;
        }
      });
      
      setProductosFiltrados(filteredProducts);
    }
  }, [searchQuery, productosPorCategoria]);

  // Formulario para enviar los complementos
  const { data, setData, post, processing, errors } = useForm({
    complementos: selectedComplementos
  });

  // Actualizar el formulario cuando cambian los complementos seleccionados
  useEffect(() => {
    setData('complementos', selectedComplementos);
  }, [selectedComplementos, setData]);

  // Agregar un complemento a la lista de seleccionados
  const handleAddComplemento = (complemento: Producto) => {
    // Verificar si ya está en la lista
    if (selectedComplementos.some(c => c.id === complemento.id)) {
      toast.error(`${complemento.nombre} ya está en la lista de complementos`);
      return;
    }

    // Determinar si es gratuito (cuando el complemento es de categoría bebidas)
    const esGratuito = categoriaBebidas ? complemento.categoria_id === categoriaBebidas.id : false;

    setSelectedComplementos([
      ...selectedComplementos,
      {
        id: complemento.id,
        nombre: complemento.nombre,
        categoria_id: complemento.categoria_id,
        cantidad_requerida: 1,
        es_obligatorio: false,
        es_gratuito: esGratuito
      }
    ]);
    toast.success(`${complemento.nombre} agregado como complemento`);
  };

  // Eliminar un complemento de la lista
  const handleRemoveComplemento = (complementoId: number) => {
    setSelectedComplementos(selectedComplementos.filter(c => c.id !== complementoId));
    toast.success("Complemento eliminado");
  };

  // Actualizar la cantidad requerida de un complemento
  const handleCantidadChange = (complementoId: number, cantidad: number) => {
    setSelectedComplementos(selectedComplementos.map(c => 
      c.id === complementoId ? { ...c, cantidad_requerida: cantidad } : c
    ));
  };

  // Actualizar si un complemento es obligatorio
  const handleObligatorioChange = (complementoId: number, esObligatorio: boolean) => {
    setSelectedComplementos(selectedComplementos.map(c => 
      c.id === complementoId ? { ...c, es_obligatorio: esObligatorio } : c
    ));
  };

  // Actualizar si un complemento es gratuito
  const handleGratuitoChange = (complementoId: number, esGratuito: boolean) => {
    setSelectedComplementos(selectedComplementos.map(c => 
      c.id === complementoId ? { ...c, es_gratuito: esGratuito } : c
    ));
  };

  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('menu.complementos.update', { producto: producto.id }), {
      onSuccess: () => {
        toast.success("Complementos actualizados con éxito");
        router.visit(route('menu.complementos'));
      },
      onError: () => {
        toast.error("Error al actualizar los complementos");
      }
    });
  };

  // Generar opciones de pestañas para las categorías
  const categoriaTabs = [
    { id: "todas", nombre: "Todas" },
    ...(categoriaBebidas ? [{ id: categoriaBebidas.id.toString(), nombre: "Bebidas" }] : []),
    ...categorias.filter(cat => cat.id !== categoriaBebidas?.id).map(cat => ({
      id: cat.id.toString(),
      nombre: cat.nombre
    }))
  ];

  // Filtrar productos por categoría seleccionada
  const getProductosPorCategoriaFiltrada = () => {
    if (categoriaActiva === "todas") {
      return productosFiltrados;
    }
    
    const filtrado: Record<string, Producto[]> = {};
    if (productosFiltrados[categoriaActiva]) {
      filtrado[categoriaActiva] = productosFiltrados[categoriaActiva];
    }
    return filtrado;
  };

  const productosMostrados = getProductosPorCategoriaFiltrada();

  return (
    <>
      <Head title={`Complementos para ${producto.nombre}`} />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.visit(route('menu.complementos'))}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Complementos para {producto.nombre}</h1>
                <p className="text-muted-foreground">
                  Asigna productos complementarios que se ofrecerán al vender este producto
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lista de posibles complementos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos disponibles</CardTitle>
                <CardDescription>
                  Selecciona los productos que pueden ser complementos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar productos..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Tabs defaultValue="todas" onValueChange={setCategoriaActiva}>
                    <TabsList className="mb-2 flex flex-wrap h-auto">
                      {categoriaTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}>{tab.nombre}</TabsTrigger>
                      ))}
                    </TabsList>
                    
                    <div className="rounded-md border h-[350px] overflow-auto">
                      {Object.keys(productosMostrados).length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No se encontraron productos
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Categoría</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(productosMostrados).flatMap(([categoriaId, productos]) =>
                              productos.map(producto => (
                                <TableRow key={producto.id}>
                                  <TableCell className="font-medium">
                                    {producto.nombre}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      style={{
                                        backgroundColor: producto.categoria?.color + '20',
                                        color: producto.categoria?.color,
                                        borderColor: producto.categoria?.color
                                      }}
                                    >
                                      {producto.categoria?.nombre}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>${producto.precio.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleAddComplemento(producto)}
                                    >
                                      <PlusIcon className="h-4 w-4 mr-1" />
                                      Agregar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Complementos seleccionados</CardTitle>
                <CardDescription>
                  Configura los complementos para {producto.nombre}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="rounded-md border h-[400px] overflow-auto mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="w-24">Obligatorio</TableHead>
                          <TableHead className="w-24">Gratuito</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedComplementos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No hay complementos seleccionados
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedComplementos.map((complemento) => (
                            <TableRow key={complemento.id}>
                              <TableCell className="font-medium">{complemento.nombre}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1 w-24">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => handleCantidadChange(complemento.id, Math.max(1, complemento.cantidad_requerida - 1))}
                                    disabled={complemento.cantidad_requerida <= 1}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    className="w-12 text-center"
                                    type="number"
                                    min="1"
                                    value={complemento.cantidad_requerida}
                                    onChange={(e) => {
                                      const valor = parseInt(e.target.value);
                                      if (!isNaN(valor) && valor > 0) {
                                        handleCantidadChange(complemento.id, valor);
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => handleCantidadChange(complemento.id, complemento.cantidad_requerida + 1)}
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`obligatorio-${complemento.id}`}
                                    checked={complemento.es_obligatorio}
                                    onCheckedChange={(checked) => 
                                      handleObligatorioChange(complemento.id, checked === true)
                                    }
                                  />
                                  <Label htmlFor={`obligatorio-${complemento.id}`}></Label>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`gratuito-${complemento.id}`}
                                    checked={complemento.es_gratuito}
                                    onCheckedChange={(checked) => 
                                      handleGratuitoChange(complemento.id, checked === true)
                                    }
                                  />
                                  <Label htmlFor={`gratuito-${complemento.id}`}></Label>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleRemoveComplemento(complemento.id)}
                                >
                                  <MinusIcon className="h-4 w-4 mr-1" />
                                  Quitar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => router.visit(route('menu.complementos'))}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={processing}
                    >
                      {processing ? "Guardando..." : "Guardar complementos"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}