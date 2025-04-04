
import React, { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, LoaderIcon } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Form } from "@/components/ui/form";  

type Categoria = {
  id: number;
  nombre: string;
  color: string;
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
  categoria: Categoria;
  created_at: string;
};

interface PageProps {
  productos: {
    data: Producto[];
    links: any[];
    total: number;
    current_page: number;
    last_page: number;
  };
  categorias: Categoria[];
}

export default function Productos({ productos, categorias }: PageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const createForm = useForm({
    nombre: "",
    precio: 0,
    stock: 0,
    categoria_id: 0,
    search: "",
  });

  const editForm = useForm({
    nombre: "",
    precio: 0,
    stock: 0,
    categoria_id: 0,
  });
  
  const deleteForm = useForm({
    _method: 'DELETE',
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createForm.post(route('menu.productos.store'), {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        createForm.reset();
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducto) {
      editForm.put(route('menu.productos.update', selectedProducto.id), {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          editForm.reset();
        },
      });
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedProducto) {
      deleteForm.delete(route('menu.productos.destroy', selectedProducto.id), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
        },
      });
    }
  };

  // Nueva implementación de búsqueda y filtro desde cero
  // Debounce de la búsqueda para retrasar las peticiones mientras el usuario escribe
  useEffect(() => {
    if (searchQuery === '' && categoriaFilter === null) return;
    
    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const params: Record<string, any> = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (categoriaFilter !== null) {
        params.categoria_id = categoriaFilter;
      }
      
      // Usamos el método visit de Inertia que funciona de manera más consistente
      router.visit(window.location.pathname, {
        only: ['productos'],
        data: params,
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsSearching(false)
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, categoriaFilter]);

  // Manejador para el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Manejador para el filtro de categorías
  const handleCategoriaChange = (value: string) => {
    setCategoriaFilter(value === "0" ? null : Number(value));
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchQuery('');
    setCategoriaFilter(null);
    setIsSearching(true);
    
    router.visit(window.location.pathname, {
      only: ['productos'],
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsSearching(false)
    });
  };

  return (
    <>
      <Head title="Productos" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
              <p className="text-muted-foreground">
                Gestiona los productos disponibles en tu menú
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="self-start">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateSubmit}>
                  <DialogHeader>
                    <DialogTitle>Agregar nuevo producto</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos para agregar un nuevo producto.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={createForm.data.nombre}
                        onChange={(e) => createForm.setData("nombre", e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="precio">Precio</Label>
                      <Input
                        id="precio"
                        type="number"
                        value={createForm.data.precio}
                        onChange={(e) => createForm.setData("precio", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={createForm.data.stock}
                        onChange={(e) => createForm.setData("stock", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria_id">Categoría</Label>
                      <Select
                        value={createForm.data.categoria_id.toString()}
                        onValueChange={(value) => createForm.setData("categoria_id", Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                              {categoria.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total: {productos.total} productos
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {isSearching && (
                    <div className="absolute right-2.5 top-2.5">
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="w-64">
                  <Select
                    value={categoriaFilter?.toString() || "0"}
                    onValueChange={handleCategoriaChange}
                    disabled={isSearching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todas las categorías</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productos.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No hay productos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      productos.data.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.id}</TableCell>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell>
                            {producto.categoria && (
                              <Badge
                                style={{ backgroundColor: producto.categoria.color }}
                                className="text-white"
                              >
                                {producto.categoria.nombre}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>S/{Number(producto.precio).toFixed(2)}</TableCell>
                          <TableCell>{producto.stock}</TableCell>
                          <TableCell>
                            <Badge variant={producto.activo ? "default" : "destructive"}>
                              {producto.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    editForm.setData({
                                      nombre: producto.nombre,
                                      precio: producto.precio,
                                      stock: producto.stock,
                                      categoria_id: producto.categoria.id
                                    });
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <EditIcon className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedProducto(producto);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Paginación */}
              {productos.last_page > 1 && (
                <div className="py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            if (productos.current_page > 1) {
                              router.visit(route('menu.productos', {page: productos.current_page - 1}), {
                                only: ['productos'],
                                preserveState: true,
                                preserveScroll: true
                              });
                            }
                          }}
                          className={productos.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {/* Primera página */}
                      {productos.current_page > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink 
                              onClick={() => router.visit(route('menu.productos', {page: 1}), {
                                only: ['productos'],
                                preserveState: true,
                                preserveScroll: true
                              })}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          
                          {/* Elipsis si está lejos del inicio */}
                          {productos.current_page > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Páginas alrededor de la actual */}
                      {Array.from({ length: Math.min(5, productos.last_page) }, (_, i) => {
                        // Lógica para mostrar páginas alrededor de la página actual
                        let pageNum;
                        if (productos.last_page <= 5) {
                          // Si hay 5 o menos páginas, mostrar todas
                          pageNum = i + 1;
                        } else if (productos.current_page <= 3) {
                          // Si estamos en las primeras páginas
                          pageNum = i + 1;
                        } else if (productos.current_page >= productos.last_page - 2) {
                          // Si estamos en las últimas páginas
                          pageNum = productos.last_page - 4 + i;
                        } else {
                          // Estamos en el medio
                          pageNum = productos.current_page - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              isActive={productos.current_page === pageNum}
                              onClick={() => router.visit(route('menu.productos', {page: pageNum}), {
                                only: ['productos'],
                                preserveState: true,
                                preserveScroll: true
                              })}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Elipsis si está lejos del final */}
                      {productos.current_page < productos.last_page - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Última página */}
                      {productos.current_page < productos.last_page - 2 && (
                        <PaginationItem>
                          <PaginationLink 
                            onClick={() => router.visit(route('menu.productos', {page: productos.last_page}), {
                              only: ['productos'],
                              preserveState: true,
                              preserveScroll: true
                            })}
                          >
                            {productos.last_page}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            if (productos.current_page < productos.last_page) {
                              router.visit(route('menu.productos', {page: productos.current_page + 1}), {
                                only: ['productos'],
                                preserveState: true,
                                preserveScroll: true
                              });
                            }
                          }}
                          className={productos.current_page === productos.last_page ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar producto</DialogTitle>
                <DialogDescription>
                  Modifica los datos del producto seleccionado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={editForm.data.nombre}
                    onChange={(e) => editForm.setData("nombre", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={editForm.data.precio}
                    onChange={(e) => editForm.setData("precio", Number(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editForm.data.stock}
                    onChange={(e) => editForm.setData("stock", Number(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria_id">Categoría</Label>
                  <Select
                    value={editForm.data.categoria_id.toString()}
                    onValueChange={(value) => editForm.setData("categoria_id", Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id.toString()}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar producto</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este producto?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleDeleteSubmit}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
