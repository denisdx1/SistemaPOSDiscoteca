import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, SearchIcon, EditIcon, LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
  categoria: Categoria;
  productosComplementarios: ProductoComplementario[];
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
  };
};

interface PageProps {
  productos: Producto[];
}

export default function Complementos({ productos }: PageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>(productos);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setProductosFiltrados(productos);
    } else {
      const filtered = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProductosFiltrados(filtered);
    }
  }, [searchQuery, productos]);

  // Manejador de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar búsqueda en el servidor si es necesario
  };

  // Navegar a la página de edición de complementos
  const handleEditComplementos = (productoId: number) => {
    router.visit(route("menu.complementos.edit", { producto: productoId }));
  };

  return (
    <>
      <Head title="Complementos de Productos" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Complementos de Productos</h1>
              <p className="text-muted-foreground">
                Administra los complementos para productos como licores que requieren bebidas adicionales
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Productos con Complementos</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total: {productos.length} productos
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Buscar
                </Button>
              </form>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Complementos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No hay productos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosFiltrados.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{producto.nombre}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {producto.descripcion || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              style={{
                                backgroundColor: producto.categoria.color + '20',
                                color: producto.categoria.color,
                                borderColor: producto.categoria.color
                              }}
                            >
                              {producto.categoria.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell>${producto.precio.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {producto.productosComplementarios?.length || 0} complementos
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
                                <DropdownMenuItem onClick={() => handleEditComplementos(producto.id)}>
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  Gestionar Complementos
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}