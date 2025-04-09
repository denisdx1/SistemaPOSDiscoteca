//import React from 'react';
import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
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
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Definición de tipos para los usuarios
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  roleDescription?: string;
  role_id?: number;
  caja_asignada_id?: number | null;
  status: string;
  last_login: string;
  created_at: string;
};

type Role = {
  id: number;
  nombre: string;
  descripcion: string;
};

type Caja = {
  id: number;
  numero_caja: number;
};

type PageProps = {
  users: {
    data: User[];
    links: any[];
    total: number;
    current_page: number;
    last_page: number;
  };
  roles: Role[];
  cajas: Caja[];
};

export default function ListaUsuarios({ users, roles, cajas }: PageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Estado para formularios
  const { data: createData, setData: setCreateData, post: createUser, processing: createProcessing, errors: createErrors } = useForm({
    name: "",
    email: "",
    role: "cajero",
    role_id: 2, // Default a cajero
    caja_asignada_id: "", // Campo para caja asignada
    password: "",
    password_confirmation: "",
  });

  const { data: editData, setData: setEditData, put: updateUser, processing: editProcessing, errors: editErrors } = useForm({
    id: 0,
    name: "",
    email: "",
    role: "",
    role_id: 0,
    caja_asignada_id: "", // Campo para caja asignada
    password: "",
    password_confirmation: "",
  });

  // Form para eliminar usuarios
  const deleteForm = useForm({
    _method: "DELETE",
  });

  // Función para buscar usuarios
  const filteredUsers = users.data.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Función para manejar la creación de un usuario
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(route("usuarios.store"), {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateData("name", "");
        setCreateData("email", "");
        setCreateData("role", "cajero");
        setCreateData("role_id", 2);
        setCreateData("caja_asignada_id", "");
        setCreateData("password", "");
        setCreateData("password_confirmation", "");
      },
    });
  };

  // Función para manejar la edición de un usuario
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(route("usuarios.update", currentUser?.id), {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditData("name", "");
        setEditData("email", "");
        setEditData("role", "");
        setEditData("role_id", 0);
        setEditData("caja_asignada_id", "");
        setEditData("password", "");
        setEditData("password_confirmation", "");
      },
    });
  };

  // Función para manejar la eliminación de un usuario
  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    deleteForm.post(route("usuarios.destroy", currentUser?.id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  // Función para preparar la edición de un usuario
  const prepareEdit = (user: User) => {
    setCurrentUser(user);
    setEditData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      role_id: user.role_id || 0,
      caja_asignada_id: user.caja_asignada_id ? String(user.caja_asignada_id) : "",
      password: "",
      password_confirmation: "",
    });
    setIsEditDialogOpen(true);
  };

  // Función para preparar la eliminación de un usuario
  const prepareDelete = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Función para obtener las iniciales del nombre de usuario
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Determinar si mostrar el campo de caja asignada
  const mostrarCampoAsignacionCaja = (role: string) => {
    return role === "cajero";
  };

  return (
    <>
      <Head title="Lista de Usuarios" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
              <p className="text-muted-foreground">
                Administra los usuarios del sistema
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="self-start">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateSubmit}>
                  <DialogHeader>
                    <DialogTitle>Crear nuevo usuario</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos para crear un nuevo usuario en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Nombre
                      </Label>
                      <Input
                        id="name"
                        value={createData.name}
                        onChange={(e) => setCreateData("name", e.target.value)}
                        className="col-span-3"
                      />
                      {createErrors.name && (
                        <p className="text-red-500 text-sm col-span-3 col-start-2">
                          {createErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={createData.email}
                        onChange={(e) => setCreateData("email", e.target.value)}
                        className="col-span-3"
                      />
                      {createErrors.email && (
                        <p className="text-red-500 text-sm col-span-3 col-start-2">
                          {createErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Rol
                      </Label>
                      <select
                        id="role"
                        value={createData.role_id}
                        onChange={(e) => {
                          const roleId = parseInt(e.target.value);
                          const selectedRole = roles.find(role => role.id === roleId);
                          setCreateData(data => ({
                            ...data,
                            role_id: roleId,
                            role: selectedRole ? selectedRole.nombre : ''
                          }));
                        }}
                        className="col-span-3 p-2 border rounded-md"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.nombre} - {role.descripcion}
                          </option>
                        ))}
                      </select>
                      {createErrors.role_id && (
                        <p className="text-red-500 text-sm col-span-3 col-start-2">
                          {createErrors.role_id}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="caja_asignada_id" className="text-right">
                        Caja Asignada
                      </Label>
                      <Select
                        value={createData.caja_asignada_id}
                        onValueChange={(value) => {
                          setCreateData("caja_asignada_id", value);
                        }}
                      >
                        <SelectTrigger className="col-span-3 w-full">
                          <SelectValue placeholder="Seleccionar caja" />
                        </SelectTrigger>
                        <SelectContent className="max-w-full">
                          {cajas.map((caja) => (
                            <SelectItem key={caja.id} value={caja.id.toString()}>
                              {caja.numero_caja}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {createErrors.caja_asignada_id && (
                        <p className="text-red-500 text-sm col-span-3 col-start-2">
                          {createErrors.caja_asignada_id}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={createData.password}
                        onChange={(e) => setCreateData("password", e.target.value)}
                        className="col-span-3"
                      />
                      {createErrors.password && (
                        <p className="text-red-500 text-sm col-span-3 col-start-2">
                          {createErrors.password}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password_confirmation" className="text-right">
                        Confirmar Contraseña
                      </Label>
                      <Input
                        id="password_confirmation"
                        type="password"
                        value={createData.password_confirmation}
                        onChange={(e) => setCreateData("password_confirmation", e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createProcessing}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProcessing}
                    >
                      Guardar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar usuarios..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">Filtrar</Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{user.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge className="self-start">
                                {user.roleName || user.role}
                              </Badge>
                              {user.roleDescription && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {user.roleDescription}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.last_login}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menú</span>
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => prepareEdit(user)}>
                                  <EditIcon className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onSelect={() => prepareDelete(user)}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          {searchTerm 
                            ? "No se encontraron usuarios que coincidan con la búsqueda."
                            : "No hay usuarios registrados."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {users.links && users.links.length > 3 && (
                <div className="flex items-center justify-end space-x-2 mt-4">
                  {users.links.map((link, i) => {
                    // No mostrar los enlaces "prev" y "next"
                    if (link.label === "&laquo; Previous" || link.label === "Next &raquo;") {
                      return null;
                    }
                    
                    return (
                      <Button 
                        key={i}
                        variant={link.active ? "default" : "outline"} 
                        size="sm"
                        className="px-4"
                        disabled={!link.url}
                        onClick={() => {
                          if (link.url) {
                            window.location.href = link.url;
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData("name", e.target.value)}
                  className="col-span-3"
                />
                {editErrors.name && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData("email", e.target.value)}
                  className="col-span-3"
                />
                {editErrors.email && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Rol
                </Label>
                <Select
                  value={editData.role_id.toString()}
                  onValueChange={(value) => {
                    const roleId = parseInt(value);
                    const selectedRole = roles.find(role => role.id === roleId);
                    setEditData(data => ({
                      ...data,
                      role_id: roleId,
                      role: selectedRole ? selectedRole.nombre : ''
                    }));
                  }}
                >
                  <SelectTrigger className="col-span-3 w-full">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="max-w-full">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.nombre} - {role.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.role_id && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.role_id}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-caja_asignada_id" className="text-right">
                  Caja Asignada
                </Label>
                <Select
                  value={editData.caja_asignada_id}
                  onValueChange={(value) => {
                    setEditData("caja_asignada_id", value);
                  }}
                >
                  <SelectTrigger className="col-span-3 w-full">
                    <SelectValue placeholder="Seleccionar caja" />
                  </SelectTrigger>
                  <SelectContent className="max-w-full">
                    {cajas.map((caja) => (
                      <SelectItem key={caja.id} value={caja.id.toString()}>
                        {caja.numero_caja}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.caja_asignada_id && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.caja_asignada_id}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Contraseña
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editData.password}
                  onChange={(e) => setEditData("password", e.target.value)}
                  className="col-span-3"
                  placeholder="Dejar en blanco para no cambiar"
                />
                {editErrors.password && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.password}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password_confirmation" className="text-right">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="edit-password_confirmation"
                  type="password"
                  value={editData.password_confirmation}
                  onChange={(e) => setEditData("password_confirmation", e.target.value)}
                  className="col-span-3"
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={editProcessing}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={editProcessing}
              >
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleDeleteSubmit}>
            <DialogHeader>
              <DialogTitle>Eliminar usuario</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {currentUser && (
                <p>
                  Vas a eliminar a <span className="font-medium">{currentUser.name}</span> ({currentUser.email}).
                </p>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteForm.processing}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={deleteForm.processing}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
