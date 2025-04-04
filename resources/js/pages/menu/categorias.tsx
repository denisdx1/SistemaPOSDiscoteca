
import React, { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
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
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Categoria = {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  activo: boolean;
  productos_count: number;
  created_at: string;
};

interface PageProps {
  categorias: {
    data: Categoria[];
    links: any[];
    total: number;
    current_page: number;
    last_page: number;
  };
}

export default function Categorias({ categorias }: PageProps) {
  // Estado para manejar los diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategoriaId, setCurrentCategoriaId] = useState<number | null>(null);

  // Formularios
  const addForm = useForm<{
    nombre: string;
    descripcion: string;
    color: string;
    activo: boolean;
  }>({
    nombre: "",
    descripcion: "",
    color: "#6366f1", // Color predeterminado (indigo)
    activo: true,
  });

  const editForm = useForm<{
    id: number;
    nombre: string;
    descripcion: string;
    color: string;
    activo: boolean;
  }>({
    id: 0,
    nombre: "",
    descripcion: "",
    color: "",
    activo: true,
  });

  // Manejador de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit(route("menu.categorias", { search: searchQuery }), {
      only: ["categorias"],
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Funciones para agregar categoría
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForm.post(route("menu.categorias.store"), {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        addForm.reset();
        toast.success("Categoría agregada con éxito");
      },
      onError: () => {
        toast.error("Error al agregar la categoría");
      },
    });
  };

  // Funciones para editar categoría
  const handleEditClick = (categoria: Categoria) => {
    editForm.setData({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      color: categoria.color,
      activo: categoria.activo,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editForm.put(route("menu.categorias.update", { id: editForm.data.id }), {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        toast.success("Categoría actualizada con éxito");
      },
      onError: () => {
        toast.error("Error al actualizar la categoría");
      },
    });
  };

  // Funciones para eliminar categoría
  const handleDeleteClick = (categoriaId: number) => {
    setCurrentCategoriaId(categoriaId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (currentCategoriaId) {
      router.delete(route("menu.categorias.destroy", { categoria: currentCategoriaId }), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setCurrentCategoriaId(null);
          toast.success("Categoría eliminada con éxito");
        },
        onError: () => {
          toast.error("Error al eliminar la categoría");
        },
      });
    }
  };

  return (
    <>
      <Head title="Categorías" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
              <p className="text-muted-foreground">
                Administra las categorías de productos para tu menú
              </p>
            </div>
            <Button className="self-start" onClick={() => setIsAddDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Agregar Categoría
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Categorías</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total: {categorias.total} categorías
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar categorías..."
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
                      <TableHead>Descripción</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorias.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No hay categorías registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      categorias.data.map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell className="font-medium">{categoria.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: categoria.color }}
                              ></div>
                              {categoria.nombre}
                            </div>
                          </TableCell>
                          <TableCell>{categoria.descripcion || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{categoria.productos_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={categoria.activo ? "default" : "destructive"}>
                              {categoria.activo ? "Activo" : "Inactivo"}
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
                                <DropdownMenuItem onClick={() => handleEditClick(categoria)}>
                                  <EditIcon className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive" 
                                  onClick={() => handleDeleteClick(categoria.id)}
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
            </CardContent>
          </Card>
        </div>

        {/* Dialog para agregar categoría */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Agregar nueva categoría</DialogTitle>
                <DialogDescription>
                  Crea una nueva categoría para organizar tus productos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={addForm.data.nombre}
                    onChange={(e) => addForm.setData("nombre", e.target.value)}
                    required
                  />
                  {addForm.errors.nombre && (
                    <p className="text-sm text-destructive">{addForm.errors.nombre}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={addForm.data.descripcion}
                    onChange={(e) => addForm.setData("descripcion", e.target.value)}
                    rows={3}
                  />
                  {addForm.errors.descripcion && (
                    <p className="text-sm text-destructive">{addForm.errors.descripcion}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={addForm.data.color}
                      onChange={(e) => addForm.setData("color", e.target.value)}
                      className="w-16 h-10 p-1"
                      required
                    />
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={addForm.data.color}
                        onChange={(e) => addForm.setData("color", e.target.value)}
                        placeholder="#HEXCODE"
                      />
                    </div>
                  </div>
                  {addForm.errors.color && (
                    <p className="text-sm text-destructive">{addForm.errors.color}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={addForm.data.activo}
                    onChange={(e) => addForm.setData("activo", e.target.checked)}
                  />
                  <Label htmlFor="activo">Categoría activa</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addForm.processing}>
                  {addForm.processing ? "Guardando..." : "Guardar categoría"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar categoría */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar categoría</DialogTitle>
                <DialogDescription>
                  Modifica los datos de la categoría seleccionada.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre-edit">Nombre</Label>
                  <Input
                    id="nombre-edit"
                    value={editForm.data.nombre}
                    onChange={(e) => editForm.setData("nombre", e.target.value)}
                    required
                  />
                  {editForm.errors.nombre && (
                    <p className="text-sm text-destructive">{editForm.errors.nombre}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-edit">Descripción</Label>
                  <Textarea
                    id="descripcion-edit"
                    value={editForm.data.descripcion}
                    onChange={(e) => editForm.setData("descripcion", e.target.value)}
                    rows={3}
                  />
                  {editForm.errors.descripcion && (
                    <p className="text-sm text-destructive">{editForm.errors.descripcion}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color-edit">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color-edit"
                      type="color"
                      value={editForm.data.color}
                      onChange={(e) => editForm.setData("color", e.target.value)}
                      className="w-16 h-10 p-1"
                      required
                    />
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={editForm.data.color}
                        onChange={(e) => editForm.setData("color", e.target.value)}
                        placeholder="#HEXCODE"
                      />
                    </div>
                  </div>
                  {editForm.errors.color && (
                    <p className="text-sm text-destructive">{editForm.errors.color}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo-edit"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={editForm.data.activo}
                    onChange={(e) => editForm.setData("activo", e.target.checked)}
                  />
                  <Label htmlFor="activo-edit">Categoría activa</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editForm.processing}>
                  {editForm.processing ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la categoría
                y podría afectar a los productos asociados a ella.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCurrentCategoriaId(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
}
