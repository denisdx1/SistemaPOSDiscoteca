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
  EditIcon,
  TrashIcon,
  ShieldIcon,
  SettingsIcon,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definición de tipos
type Permission = {
  id: number;
  nombre: string;
  slug: string;
  modulo: string;
  descripcion: string;
};

type Role = {
  id: number;
  nombre: string;
  descripcion: string;
  permissions: Permission[];
};

type PageProps = {
  roles: Role[];
  permissions: Record<string, Permission[]>;
};

export default function RolesIndex({ roles, permissions }: PageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // Estado para formularios
  const { data: createData, setData: setCreateData, post: createRole, processing: createProcessing, errors: createErrors } = useForm({
    nombre: "",
    descripcion: "",
  });

  const { data: editData, setData: setEditData, put: updateRole, processing: editProcessing, errors: editErrors } = useForm({
    nombre: "",
    descripcion: "",
  });

  const { data: permissionsData, setData: setPermissionsData, put: updatePermissions, processing: permissionsProcessing } = useForm({
    permissions: [] as number[],
  });

  // Funciones para manejar formularios
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRole(route("roles.store"), {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateData("nombre", "");
        setCreateData("descripcion", "");
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) return;

    updateRole(route("roles.update", currentRole.id), {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditData("nombre", "");
        setEditData("descripcion", "");
      },
    });
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) return;

    useForm({}).delete(route("roles.destroy", currentRole.id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const handlePermissionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) return;

    updatePermissions(route("roles.permissions.update", currentRole.id), {
      onSuccess: () => {
        setIsPermissionsDialogOpen(false);
      },
    });
  };

  // Funciones para preparar acciones
  const prepareEdit = (role: Role) => {
    setCurrentRole(role);
    setEditData({
      nombre: role.nombre,
      descripcion: role.descripcion || "",
    });
    setIsEditDialogOpen(true);
  };

  const prepareDelete = (role: Role) => {
    setCurrentRole(role);
    setIsDeleteDialogOpen(true);
  };

  const preparePermissions = (role: Role) => {
    setCurrentRole(role);
    setPermissionsData({
      permissions: role.permissions.map(p => p.id),
    });
    setIsPermissionsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <Head title="Gestión de Roles" />

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" /> Nuevo Rol
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roles del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.nombre}</TableCell>
                    <TableCell>{role.descripcion}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission.id} variant="outline">
                              {permission.nombre}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Sin permisos asignados
                          </span>
                        )}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline">
                            +{role.permissions.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => preparePermissions(role)}
                        >
                          <ShieldIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => prepareEdit(role)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => prepareDelete(role)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para crear rol */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>
                Rellena los detalles para crear un nuevo rol en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={createData.nombre}
                  onChange={(e) => setCreateData("nombre", e.target.value)}
                  className="col-span-3"
                />
                {createErrors.nombre && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {createErrors.nombre}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descripcion" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="descripcion"
                  value={createData.descripcion}
                  onChange={(e) => setCreateData("descripcion", e.target.value)}
                  className="col-span-3"
                />
                {createErrors.descripcion && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {createErrors.descripcion}
                  </p>
                )}
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
              <Button type="submit" disabled={createProcessing}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar rol */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
              <DialogDescription>
                Modifica los detalles del rol.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="edit-nombre"
                  value={editData.nombre}
                  onChange={(e) => setEditData("nombre", e.target.value)}
                  className="col-span-3"
                />
                {editErrors.nombre && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.nombre}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-descripcion" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="edit-descripcion"
                  value={editData.descripcion}
                  onChange={(e) => setEditData("descripcion", e.target.value)}
                  className="col-span-3"
                />
                {editErrors.descripcion && (
                  <p className="text-red-500 text-sm col-span-3 col-start-2">
                    {editErrors.descripcion}
                  </p>
                )}
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
              <Button type="submit" disabled={editProcessing}>
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar rol */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleDeleteSubmit}>
            <DialogHeader>
              <DialogTitle>Eliminar Rol</DialogTitle>
              <DialogDescription>
                ¿Estás seguro que deseas eliminar este rol? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>
                Estás a punto de eliminar el rol: <strong>{currentRole?.nombre}</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nota: No se pueden eliminar roles que tengan usuarios asignados.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="destructive">
                Eliminar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar permisos */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <form onSubmit={handlePermissionsSubmit}>
            <DialogHeader>
              <DialogTitle>Gestionar Permisos</DialogTitle>
              <DialogDescription>
                Selecciona los permisos para el rol: <strong>{currentRole?.nombre}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue={Object.keys(permissions)[0]}>
                <TabsList className="mb-4 flex-wrap">
                  {Object.keys(permissions).map((modulo) => (
                    <TabsTrigger key={modulo} value={modulo}>
                      {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(permissions).map(([modulo, moduloPermisos]) => (
                  <TabsContent key={modulo} value={modulo} className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                      {moduloPermisos.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-2 border rounded-md">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={permissionsData.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPermissionsData("permissions", [
                                  ...permissionsData.permissions,
                                  permission.id,
                                ]);
                              } else {
                                setPermissionsData(
                                  "permissions",
                                  permissionsData.permissions.filter(
                                    (id) => id !== permission.id
                                  )
                                );
                              }
                            }}
                          />
                          <div>
                            <Label
                              htmlFor={`permission-${permission.id}`}
                              className="font-medium"
                            >
                              {permission.nombre}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {permission.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPermissionsDialogOpen(false)}
                disabled={permissionsProcessing}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={permissionsProcessing}>
                Guardar Permisos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 