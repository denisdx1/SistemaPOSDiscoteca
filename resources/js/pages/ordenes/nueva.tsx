import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mesa, Producto, ItemOrden, Orden } from '@/types/orden';
import ProductosList from './components/ProductosList';
import OrdenResumen from './components/OrdenResumen';
import CategoriaSelector from './components/CategoriaSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface NuevaOrdenProps {
  mesas: Mesa[];
  mesaId?: number;
  mesa?: Mesa;
  categorias: { id: number; nombre: string; color: string }[];
  productos: Producto[];
  bartenders: { id: number; name: string }[];
}

// ID de categoría para licores y bebidas (complementos)
// Estos valores deben ajustarse según tu base de datos

 // Ajusta este ID según tu base de datos
const CATEGORIA_BEBIDAS_ID = 2; // Ajusta este ID según tu base de datos


// Promoción especial - Precio fijo para 2-3 tragos
const PROMOCION_PRECIO_FIJO = 10.00; // Precio en soles
const PROMOCION_MIN_PRODUCTOS = 2;

const NuevaOrden: React.FC<NuevaOrdenProps> = ({ 
  mesas, 
  mesaId, 
  mesa, 
  categorias, 
  productos, 
  bartenders 
}) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('menu');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>(productos);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ordenesPendientes, setOrdenesPendientes] = useState<Record<number, number>>({});
  
  // Estado para el modal de selección de complementos
  const [showComplementoDialog, setShowComplementoDialog] = useState(false);
  const [selectedComplemento, setSelectedComplemento] = useState<Producto | null>(null);
  const [liquorToAddWithComplement, setLiquorToAddWithComplement] = useState<Producto | null>(null);
  const [complementoCantidad, setComplementoCantidad] = useState(1);
  
  // Filtrar productos de tipo bebida para usar como complementos
  const complementosDisponibles = productos.filter(p => 
    p.categoria.id === CATEGORIA_BEBIDAS_ID && Number(p.stock_actual) > 0
  );
  
  const initialMesaId = mesaId || (mesa ? mesa.id : null);
  
  const { data, setData, post, processing, errors, reset } = useForm<Orden>({
    mesa_id: initialMesaId,
    bartender_id: null,
    estado: 'pendiente',
    subtotal: 0,
    total: 0,
    pagado: false,
    items: [],
    productos: [] // Agregar la propiedad 'productos' que falta
  });

  // Inicializar la mesa si viene preseleccionada
  useEffect(() => {
    if (initialMesaId) {
      setData('mesa_id', initialMesaId);
    }
    console.log("Estado inicial:", JSON.stringify(data));
  }, [initialMesaId]);

  // Este efecto se ejecuta cuando cambia selectedCategoria, searchTerm o productos
  useEffect(() => {
    let filtered = productos;
    
    if (selectedCategoria) {
      filtered = filtered.filter(p => p.categoria.id === selectedCategoria);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(term) || 
        p.descripcion.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term)
      );
    }
    
    setFilteredProductos(filtered);
  }, [selectedCategoria, searchTerm, productos]);

  // Este efecto se ejecuta cuando cambian los items
  useEffect(() => {
    if (!data.items) {
      setData('items', []);
      return;
    }
    
    console.log("Calculando totales, items actuales:", JSON.stringify(data.items));
    
    // Si hay items, verificar si hay tragos para aplicar promoción
    const tragosEnOrden = data.items.filter(item => 
      item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito
    );
    
    const cantidadTragos = tragosEnOrden.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Si hay 2 o más tragos, aplicar la promoción
    if (cantidadTragos >= PROMOCION_MIN_PRODUCTOS) {
      // Aplicar la promoción cada vez que cambien los items
      setTimeout(() => {
        aplicarPromocionTragos();
      }, 0);
    }
    
    if (data.items.length > 0) {
      const subtotal = data.items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
      
      // Usar un callback para actualizar el estado para evitar problemas de sincronización
      setData(prevData => ({
        ...prevData,
        subtotal,
        total: subtotal
      }));
    } else {
      setData(prevData => ({
        ...prevData,
        subtotal: 0,
        total: 0
      }));
    }
  }, [data.items]);

  // Filtramos las bebidas para usarlas como complementos de licores
  const bebidasComplementos = productos.filter(p => 
    p.categoria?.nombre?.toLowerCase() === 'bebidas' && 
    p.stock_actual > 0
  );
  
  // Verificar si un producto pertenece a la categoría de tragos
  const esProductoTragos = (producto: Producto): boolean => {
    if (!producto) {
      return false;
    }
    
    // Si la categoría no existe o es nula, no es un trago
    if (!producto.categoria) {
      return false;
    }
    
    // Verificación por nombre de categoría - buscando "tragos" en el nombre
    const nombreCategoria = producto.categoria.nombre?.toLowerCase() || '';
    const esTragos = nombreCategoria.includes('tragos') || 
                   nombreCategoria.includes('trago');
    
    return esTragos;
  };

  // Contar cuántos productos de la categoría tragos hay en la orden actual
  const contarProductosTragos = (): number => {
    if (!data.items || !Array.isArray(data.items)) return 0;
    
    return data.items.reduce((count, item) => {
      if (item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito) {
        return count + item.cantidad;
      }
      return count;
    }, 0);
  };

  // Verificar si se debe aplicar la promoción de tragos
  const debeAplicarPromocionTragos = (productoActual: Producto): boolean => {
    if (!esProductoTragos(productoActual)) return false;
    
    const cantidadTragoActual = contarProductosTragos();
    // Verificar si añadiendo este producto estamos en el rango de la promoción (2 o más tragos)
    return cantidadTragoActual + 1 >= PROMOCION_MIN_PRODUCTOS;
  };

  // Aplicar el precio de promoción a los tragos cuando corresponda
  const aplicarPromocionTragos = () => {
    if (!data.items || !Array.isArray(data.items)) return;
    
    // Verificar todos los tragos en la orden
    const tragosItems = data.items.filter(item => 
      item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito
    );
    
    // Contar todos los tragos (sumar cantidades)
    const cantidadTragos = tragosItems.reduce((sum, item) => sum + item.cantidad, 0);
    
    console.log(`Verificando promoción: ${cantidadTragos} tragos en la orden (${tragosItems.length} tipos diferentes)`);
    
    // Aplicar promoción si hay 2 o más tragos, sin límite superior
    if (cantidadTragos >= PROMOCION_MIN_PRODUCTOS) {
      // Hacer una copia profunda del array de items para evitar problemas de referencia
      const updatedItems = JSON.parse(JSON.stringify(data.items));
      
      // Aplicar el precio de promoción a cada trago
      let cambiosRealizados = false;
      updatedItems.forEach((item: any) => {
        if (item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito) {
          const precioAnterior = item.precio_unitario;
          item.precio_unitario = PROMOCION_PRECIO_FIJO;
          item.subtotal = item.precio_unitario * item.cantidad;
          
          if (precioAnterior !== PROMOCION_PRECIO_FIJO) {
            cambiosRealizados = true;
            console.log(`Cambiando precio de ${item.producto.nombre} de ${precioAnterior} a ${PROMOCION_PRECIO_FIJO}`);
          }
        }
      });
      
      if (cambiosRealizados) {
        console.log("Aplicando promoción de tragos...");
        // Actualizar el estado con los nuevos items
        setData(prevData => ({
          ...prevData,
          items: updatedItems
        }));
        
        toast({
          title: "¡Promoción aplicada!",
          description: `Se aplicó la promoción: Tragos a S/ ${PROMOCION_PRECIO_FIJO.toFixed(2)} cada uno.`,
        });
      }
    } else if (cantidadTragos < PROMOCION_MIN_PRODUCTOS && tragosItems.length > 0) {
      // Si hay menos tragos que el mínimo, restaurar precios originales
      const updatedItems = JSON.parse(JSON.stringify(data.items));
      let cambiosRealizados = false;
      
      updatedItems.forEach((item: any) => {
        if (item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito) {
          const precioOriginal = Number(item.producto.precio);
          if (item.precio_unitario !== precioOriginal) {
            item.precio_unitario = precioOriginal;
            item.subtotal = item.precio_unitario * item.cantidad;
            cambiosRealizados = true;
          }
        }
      });
      
      // Solo actualizar si hubo cambios en los precios
      if (cambiosRealizados) {
        console.log("Restaurando precios originales...");
        setData(prevData => ({
          ...prevData,
          items: updatedItems
        }));
      }
    }
  };

  // Manejador para añadir un producto al pedido
  const handleAddItem = (producto: Producto) => {
    if (!producto) return;
    
    console.log("handleAddItem llamado con producto:", producto.nombre, producto.id);
    
    // Verificar si hay stock disponible
    if (!producto.stock_actual || producto.stock_actual <= 0) {
      toast({
        title: "Producto sin stock",
        description: "Este producto no está disponible actualmente.",
        variant: "destructive",
      });
      return;
    }
    
    
    
    // Si es un licor específicamente que requiere complemento, mostrar el diálogo de selección
    if (producto.categoria?.nombre?.toLowerCase() === 'licores' || 
        producto.categoria?.nombre?.toLowerCase() === 'licor') {
      setLiquorToAddWithComplement(producto);
      setShowComplementoDialog(true);
      return; // Detenemos el proceso hasta que se seleccione o cancele el complemento
    }
    
    // Si no es licor, añadimos el producto normalmente
    addItemToOrder(producto);
  };
  
  // Función para añadir un producto a la orden
  const addItemToOrder = (producto: Producto, complemento?: Producto, cantidadComplemento: number = 1) => {
    // Validación básica
    if (!producto) {
      console.error("Error: Producto nulo");
      return;
    }
    
    console.log(`Añadiendo producto: ${producto.nombre}, ID: ${producto.id}`);
    
    // Verificar si es un trago
    const esTrago = esProductoTragos(producto);
    if (esTrago) {
      console.log(`El producto ${producto.nombre} es un trago`);
    }
    
    // Crear una copia profunda del array de items actual para evitar problemas de referencia
    const currentItems = Array.isArray(data.items) ? JSON.parse(JSON.stringify(data.items)) : [];
    
    // Verificar si el producto ya existe en la orden COMO PRODUCTO PRINCIPAL (no como complemento)
    const existingItemIndex = currentItems.findIndex(
      (item: any) => item && item.producto && item.producto.id === producto.id && !item.es_complemento_gratuito
    );
    
    console.log(`¿Producto ya existe en la orden? ${existingItemIndex >= 0}`);
    
    if (existingItemIndex >= 0) {
      // Si ya existe como producto principal, aumentar la cantidad
      currentItems[existingItemIndex].cantidad += 1;
      currentItems[existingItemIndex].subtotal = 
        currentItems[existingItemIndex].cantidad * currentItems[existingItemIndex].precio_unitario;
      console.log(`Actualizado cantidad: ${currentItems[existingItemIndex].cantidad}`);
    } else {
      // Si no existe como producto principal, crear nuevo item
      const newItem = {
        producto: producto,
        cantidad: 1,
        precio_unitario: Number(producto.precio),
        subtotal: Number(producto.precio),
        es_complemento_gratuito: false // Explícitamente marcamos que no es un complemento
      };
      
      // Añadir el nuevo item
      currentItems.push(newItem);
      console.log(`Añadido nuevo producto: ${producto.nombre}`);
    }
    
    // Si hay complemento, procesarlo
    if (complemento) {
      // Buscamos el complemento sólo entre los que están marcados como complementos
      const existingComplementoIndex = currentItems.findIndex(
        (item: any) => item && item.producto && item.producto.id === complemento.id && 
               item.es_complemento_gratuito === true && item.complemento_de === producto.id
      );
      
      if (existingComplementoIndex >= 0) {
        // Aumentar cantidad del complemento existente
        currentItems[existingComplementoIndex].cantidad += cantidadComplemento;
      } else {
        // Añadir nuevo complemento
        const complementoItem = {
          producto: complemento,
          cantidad: cantidadComplemento,
          precio_unitario: 0,
          subtotal: 0,
          es_complemento_gratuito: true,
          complemento_de: producto.id
        };
        
        currentItems.push(complementoItem);
      }
      
      toast({
        title: "Producto añadido con complemento",
        description: `${producto.nombre} añadido con ${cantidadComplemento} ${complemento.nombre} como complemento.`,
      });
    } else {
      toast({
        title: "Producto añadido",
        description: `${producto.nombre} añadido al pedido.`,
      });
    }
    
    // Calcular la cantidad total de tragos después de añadir este
    const tragosActuales = currentItems.filter((item: any) => 
      item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito
    );
    const cantidadTragosDespuesDeAñadir = tragosActuales.reduce((sum: number, item: any) => sum + item.cantidad, 0);
    
    console.log(`Después de añadir, hay ${cantidadTragosDespuesDeAñadir} tragos en la orden`);
    
    // Si es un trago y aplica la promoción, aplicar precio promocional inmediatamente
    if (esTrago && cantidadTragosDespuesDeAñadir >= PROMOCION_MIN_PRODUCTOS) {
      // Aplicar precio promocional a todos los tragos, incluido el recién añadido
      currentItems.forEach((item: any) => {
        if (item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito) {
          item.precio_unitario = PROMOCION_PRECIO_FIJO;
          item.subtotal = item.precio_unitario * item.cantidad;
        }
      });
      
      console.log("Aplicando precio promocional directamente");
      
      // Notificar sobre la promoción
      toast({
        title: "¡Promoción aplicada!",
        description: `Se aplicó la promoción: Tragos a S/ ${PROMOCION_PRECIO_FIJO.toFixed(2)} cada uno.`,
      });
    }
    
    // Actualizar el estado con los nuevos items
    setData(prevData => ({
      ...prevData,
      items: currentItems
    }));
    
    // Verificar si es un trago para aplicar promociones en caso de que se necesite actualizar algo más
    if (esTrago) {
      // Esperar a que se actualice el estado antes de verificar nuevamente
      setTimeout(() => {
        aplicarPromocionTragos();
      }, 500);
    }
  };
  
  // Función para manejar la selección de complemento
  const handleComplementoSelection = (complementoId: number) => {
    const complemento = bebidasComplementos.find(p => p.id === Number(complementoId));
    setSelectedComplemento(complemento || null);
  };
  
  // Función para confirmar la selección de complemento
  const handleConfirmComplemento = () => {
    // Si hay un licor seleccionado y un complemento, añadirlos a la orden
    if (liquorToAddWithComplement && selectedComplemento) {
      // Primero añadimos el licor
      addItemToOrder(liquorToAddWithComplement, selectedComplemento, complementoCantidad);
      
      // Limpiamos el estado
      setLiquorToAddWithComplement(null);
      setSelectedComplemento(null);
      setShowComplementoDialog(false);
      setComplementoCantidad(1); // Reiniciar la cantidad
    } else if (liquorToAddWithComplement) {
      // Si no se seleccionó complemento, añadir solo el licor
      addItemToOrder(liquorToAddWithComplement);
      setLiquorToAddWithComplement(null);
      setShowComplementoDialog(false);
      setComplementoCantidad(1); // Reiniciar la cantidad
    }
  };
  
  // Función para cancelar la selección de complemento
  const handleCancelComplemento = () => {
    // Si el usuario cancela, añadimos solo el licor sin complemento
    if (liquorToAddWithComplement) {
      addItemToOrder(liquorToAddWithComplement);
    }
    
    // Limpiamos el estado
    setLiquorToAddWithComplement(null);
    setSelectedComplemento(null);
    setShowComplementoDialog(false);
    setComplementoCantidad(1); // Reiniciar la cantidad
  };

  const handleRemoveItem = (index: number) => {
    console.log("Intentando eliminar item en índice:", index);
    
    // Validar que el índice es válido
    if (index < 0 || index >= data.items.length) {
      console.error("Índice de item inválido:", index);
      return;
    }
    
    // Hacer una copia profunda para evitar problemas de referencia
    const updatedItems = JSON.parse(JSON.stringify(data.items));
    const itemToRemove = updatedItems[index];
    
    console.log("Item a eliminar:", itemToRemove.producto?.nombre);
    
    // Eliminar el item seleccionado
    updatedItems.splice(index, 1);
    
    // Si el item eliminado es un licor, también eliminar sus complementos
    if (itemToRemove.producto?.categoria?.nombre?.toLowerCase() === 'licores') {
      console.log("Eliminando complementos del licor");
      // Filtrar los items que son complementos de este producto
      const filteredItems = updatedItems.filter((item: ItemOrden) => 
        !(item.es_complemento_gratuito && item.complemento_de === itemToRemove.producto.id)
      );
      
      // Actualizar estado sin perder la referencia
      setData(prevData => ({
        ...prevData,
        items: filteredItems
      }));
    } else {
      // Actualizar estado sin perder la referencia
      setData(prevData => ({
        ...prevData,
        items: updatedItems
      }));
    }
    
    // Verificar si era un trago para recalcular la promoción
    if (itemToRemove.producto && esProductoTragos(itemToRemove.producto)) {
      console.log("Recalculando promoción después de eliminar un trago");
      
      // Esperar a que se actualice el estado antes de recalcular
      setTimeout(() => {
        // Calcular directamente cuántos tragos quedan después de la eliminación
        const tragosRestantes = updatedItems.filter((item: ItemOrden) => 
          item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito
        ).reduce((count: number, item: ItemOrden) => count + item.cantidad, 0);
        
        console.log("Tragos restantes después de eliminar:", tragosRestantes);
        
        if (tragosRestantes < PROMOCION_MIN_PRODUCTOS) {
          console.log("Restaurando precios originales por cantidad insuficiente");
          // Ya no aplica la promoción, restaurar precios originales
          const resetItems = updatedItems.map((item: ItemOrden) => {
            if (item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito) {
              const precioOriginal = Number(item.producto.precio);
              console.log(`Restaurando precio de ${item.producto.nombre} a ${precioOriginal}`);
              item.precio_unitario = precioOriginal;
              item.subtotal = item.precio_unitario * item.cantidad;
            }
            return item;
          });
          
          // Actualizar estado sin perder la referencia
          setData(prevData => ({
            ...prevData,
            items: resetItems
          }));
        } else {
          console.log("Recalculando promoción de tragos");
          // Todavía aplica la promoción, recalcular
          aplicarPromocionTragos();
        }
      }, 50);
    }
    
    toast({
      title: "Producto eliminado",
      description: itemToRemove.producto?.nombre 
        ? `${itemToRemove.producto.nombre} eliminado del pedido.` 
        : "Producto eliminado del pedido."
    });
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...data.items];
    const currentItem = updatedItems[index];
    const productoEsTragos = esProductoTragos(currentItem.producto);
    // Guardar la cantidad anterior para calcular la proporción
    const oldQuantity = currentItem.cantidad;
    
    // Actualizar la cantidad del item
    currentItem.cantidad = newQuantity;
    currentItem.subtotal = currentItem.precio_unitario * newQuantity;
    
    // Si es un licor, actualizar también la cantidad de sus complementos
    if (currentItem.producto.categoria?.nombre?.toLowerCase() === 'licores') {
      // Buscar los complementos asociados y actualizar sus cantidades
      updatedItems.forEach((complementoItem, idx) => {
        if (complementoItem.es_complemento_gratuito && complementoItem.complemento_de === currentItem.producto.id) {
          // Ajustar la cantidad proporcionalmente, manteniendo la relación
          // Si originalmente había 2 licores y 4 complementos (2:1), al cambiar a 3 licores, serían 6 complementos
          const ratio = complementoItem.cantidad / oldQuantity;
          const newComplementQuantity = Math.max(1, Math.round(newQuantity * ratio));
          
          updatedItems[idx].cantidad = newComplementQuantity;
          updatedItems[idx].subtotal = 0; // Para complementos gratuitos
        }
      });
    }
    
    setData('items', updatedItems);
    
    // Si es un trago, verificar si aplica la promoción
    if (productoEsTragos) {
      aplicarPromocionTragos();
    }
  };

  const handleSubmitOrder = async () => {
    if (data.items.length === 0) {
      toast({
        title: "Error",
        description: "No hay productos en la orden",
        variant: "destructive",
      });
      return;
    }
    
    // Validar mesa si es necesario aquí
    
    setIsSubmitting(true);
    
    try {
      // Formatear los items para el backend
      const formattedItems = data.items.map(item => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        notas: item.notas || '',
        es_complemento_gratuito: item.es_complemento_gratuito || false,
        complemento_de: item.complemento_de || null
      }));
      
      // Crear el objeto de datos a enviar
      const orderData = {
        mesa_id: data.mesa_id,
        bartender_id: data.bartender_id,
        items: formattedItems,
        notas: data.notas || '', // Asegurar que notas siempre tenga un valor
        estado: data.estado || 'pendiente',
        tipo_orden: 'local' // Añadir el tipo de orden requerido
      };
      
      
      
      // Enviar al backend
      const response = await axios.post(route('ordenes.store'), orderData);
      
      if (response.data.success) {
        toast({
          title: "Orden creada",
          description: "La orden ha sido creada exitosamente",
        });
        
        // Redireccionar a historial o limpiar formulario
        reset();
        
        // Si se abrió desde una mesa, redirigir al listado de mesas
        if (initialMesaId) {
          window.location.href = route('mesas');
        }
      } else {
        throw new Error(response.data.message || 'Error al crear la orden');
      }
    } catch (error: any) {
      console.error("Error al crear orden:", error);
      
      // Mostrar mensaje de error más detallado
      let errorMessage = "No se pudo crear la orden. Intente nuevamente.";
      
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        
        // Si hay errores de validación
        if (error.response.data.errors) {
          const validationErrors = Object.values(error.response.data.errors).flat();
          errorMessage = `Errores de validación: ${validationErrors.join(', ')}`;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar si hay tragos en la lista para mostrar el selector de bartender
  const esProductoTragosEnLista = (): boolean => {
    if (!data.items || !Array.isArray(data.items)) return false;
    
    return data.items.some(item => 
      item && item.producto && esProductoTragos(item.producto) && !item.es_complemento_gratuito
    );
  };

  // Cargar conteo de órdenes pendientes por bartender
  useEffect(() => {
    const cargarOrdenesPendientes = async () => {
      try {
        const response = await axios.get('/api/bartenders/conteo-ordenes');
        if (response.data.success) {
          setOrdenesPendientes(response.data.conteo || {});
        }
      } catch (error) {
        console.error("Error al cargar conteo de órdenes por bartender:", error);
      }
    };
    
    if (esProductoTragosEnLista()) {
      cargarOrdenesPendientes();
    }
  }, [data.items]);

  return (
    <DashboardLayout>
      <Head title="Nueva Orden" />
      
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-6">
          {initialMesaId ? `Nueva Orden - Mesa ${mesa?.numero || mesaId}` : 'Nueva Orden'}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Panel izquierdo: Productos */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-2 sm:p-4">
                <Tabs 
                  defaultValue="menu" 
                  value={selectedTab} 
                  onValueChange={setSelectedTab}
                  className="w-full"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
                    <TabsList className="mb-2 sm:mb-0">
                      <TabsTrigger value="menu">Por Categoría</TabsTrigger>
                      <TabsTrigger value="search">Búsqueda</TabsTrigger>
                    </TabsList>
                    
                    {selectedTab === 'search' && (
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                      />
                    )}
                  </div>
                  
                  <TabsContent value="menu" className="mt-0">
                    <div className="mb-3 sm:mb-4">
                      <CategoriaSelector 
                        categorias={categorias}
                        selectedCategoria={selectedCategoria}
                        onSelectCategoria={setSelectedCategoria}
                      />
                    </div>
                    
                    <div className="h-[calc(100vh-320px)] md:h-[calc(100vh-380px)] overflow-y-auto px-1">
                      <ProductosList 
                        productos={filteredProductos} 
                        onAddItem={handleAddItem} 
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="search" className="mt-0">
                    <div className="h-[calc(100vh-320px)] md:h-[calc(100vh-380px)] overflow-y-auto px-1">
                      <ProductosList 
                        productos={filteredProductos} 
                        onAddItem={handleAddItem} 
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Panel derecho: Resumen de orden */}
          <div className="lg:col-span-1 mt-3 lg:mt-0">
            <OrdenResumen 
              items={data.items}
              mesas={mesas}
              selectedMesa={data.mesa_id}
              onSelectMesa={(mesaId: number | null) => setData('mesa_id', mesaId)}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              subtotal={data.subtotal}
              total={data.total}
              onSubmit={handleSubmitOrder}
              isProcessing={processing || isSubmitting}
              isMesaFixed={!!initialMesaId}
            >
              <div className="mt-3 sm:mt-4">
                <Textarea
                  placeholder="Notas adicionales para la orden..."
                  value={data.notas || ''}
                  onChange={(e) => setData('notas', e.target.value)}
                />
              </div>

              {/* Selector de bartender */}
              {esProductoTragosEnLista() && (
                <div className="mt-3 sm:mt-4">
                  <Label htmlFor="bartender" className="block text-sm font-medium mb-1">
                    Asignar bartender
                  </Label>
                  <select
                    id="bartender"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={data.bartender_id || ''}
                    onChange={(e) => setData('bartender_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar bartender</option>
                    {bartenders.map((bartender) => (
                      <option key={bartender.id} value={bartender.id}>
                        {bartender.name} 
                        {ordenesPendientes[bartender.id] !== undefined 
                          ? ` (${ordenesPendientes[bartender.id]} órdenes pendientes)` 
                          : ''}
                      </option>
                    ))}
                  </select>
                  {errors.bartender_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.bartender_id}</p>
                  )}
                </div>
              )}
            </OrdenResumen>
          </div>
        </div>
      </div>
      
      {/* Diálogo para seleccionar complemento */}
      <Dialog open={showComplementoDialog} onOpenChange={setShowComplementoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccione un complemento gratuito</DialogTitle>
            <DialogDescription>
              Para el licor <strong>{liquorToAddWithComplement?.nombre}</strong> puede seleccionar una bebida gratuita como complemento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup 
              value={selectedComplemento?.id?.toString()} 
              onValueChange={(value) => handleComplementoSelection(Number(value))}
              className="space-y-2"
            >
              {bebidasComplementos.length > 0 ? (
                bebidasComplementos.map((bebida) => (
                  <div key={bebida.id} className="flex items-center space-x-2 border p-2 rounded">
                    <RadioGroupItem value={bebida.id.toString()} id={`bebida-${bebida.id}`} />
                    <Label htmlFor={`bebida-${bebida.id}`} className="flex-1">
                      {bebida.nombre}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-gray-500">
                  No hay bebidas disponibles como complemento
                </div>
              )}
            </RadioGroup>
            
            {/* Selector de cantidad para el complemento */}
            {selectedComplemento && (
              <div className="mt-4 border-t pt-4">
                <Label htmlFor="cantidad-complemento" className="mb-2 block">
                  Cantidad de {selectedComplemento.nombre}
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setComplementoCantidad(Math.max(1, complementoCantidad - 1))}
                    disabled={complementoCantidad <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{complementoCantidad}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setComplementoCantidad(complementoCantidad + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelComplemento}>
              Continuar sin complemento
            </Button>
            <Button 
              onClick={handleConfirmComplemento} 
              disabled={!selectedComplemento}
            >
              Confirmar selección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default NuevaOrden; 