import React, { useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ProductoItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
}

interface OrdenInfo {
  id: number;
  numero_orden: string;
  fecha: string;
  fecha_pago: string;
  estado: string;
  pagado: boolean;
  metodo_pago: string;
  subtotal: number;
  total: number;
  mesa: string | number;
  atendido_por: string;
}

interface CajaInfo {
  numero: number;
  cajero: string;
  monto_recibido: number;
  cambio: number;
}

interface EmpresaInfo {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  web: string;
}

interface BoletaProps {
  orden: OrdenInfo;
  productos: ProductoItem[];
  caja: CajaInfo | null;
  empresa: EmpresaInfo;
}

export default function Boleta({ orden, productos, caja, empresa }: BoletaProps) {
  const boletaRef = useRef<HTMLDivElement>(null);

  // Imprimir automáticamente al cargar la página
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleVolver = () => {
    window.history.back();
  };

  // Obtener la fecha y hora actual
  const fechaActual = new Date().toLocaleString();

  return (
    <>
      <Head title={`Boleta #${orden.numero_orden}`} />
      
      {/* Botones de acción (solo visibles en pantalla, no en impresión) */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2">
        <Button variant="outline" onClick={handleVolver}>
          Volver
        </Button>
        <Button onClick={handlePrint}>
          Imprimir
        </Button>
      </div>

      {/* Contenido de la boleta */}
      <div 
        ref={boletaRef} 
        className="max-w-md mx-auto my-8 p-4 bg-white text-black border rounded-md shadow print:shadow-none print:border-none print:p-1 print:max-w-full"
      >
        {/* Cabecera */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase">{empresa.nombre}</h1>
          <p className="text-sm">{empresa.direccion}</p>
          <p className="text-sm">{empresa.telefono}</p>
          <p className="text-sm">{empresa.web}</p>
          <hr className="my-2" />
          <h2 className="text-lg font-semibold">BOLETA DE VENTA</h2>
          <p className="text-sm">No. {orden.numero_orden}</p>
        </div>

        {/* Información de la orden */}
        <div className="text-sm mb-4">
          <div className="flex justify-between">
            <span>Fecha emisión:</span>
            <span>{orden.fecha_pago}</span>
          </div>
          <div className="flex justify-between">
            <span>Mesa:</span>
            <span>{orden.mesa}</span>
          </div>
          <div className="flex justify-between">
            <span>Atendido por:</span>
            <span>{orden.atendido_por}</span>
          </div>
          {caja && (
            <div className="flex justify-between">
              <span>Caja:</span>
              <span>#{caja.numero} - {caja.cajero}</span>
            </div>
          )}
        </div>

        {/* Línea separadora */}
        <div className="border-t border-b border-dashed py-1 my-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="w-1/12">Cant.</span>
            <span className="w-4/12">Descripción</span>
            <span className="w-2/12 text-right">P. Unit</span>
            <span className="w-3/12 text-right">Importe</span>
          </div>
        </div>

        {/* Detalle de productos */}
        <div className="mb-4">
          {productos.map((item, index) => (
            <div key={index} className="flex justify-between text-sm py-1">
              <span className="w-1/12">{item.cantidad}</span>
              <span className="w-4/12">{item.nombre}</span>
              <span className="w-3/12 text-right">{formatCurrency(item.precio_unitario)}</span>
              <span className="w-3/12 text-right">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Línea separadora */}
        <div className="border-t border-dashed py-1 my-2"></div>

        {/* Totales */}
        <div className="text-sm mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(orden.subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL:</span>
            <span>{formatCurrency(orden.total)}</span>
          </div>
          
          {caja && (
            <>
              <div className="flex justify-between mt-2">
                <span>Pago ({orden.metodo_pago}):</span>
                <span>{formatCurrency(caja.monto_recibido)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cambio:</span>
                <span>{formatCurrency(caja.cambio)}</span>
              </div>
            </>
          )}
        </div>

        {/* Pie de página */}
        <div className="text-center text-xs mt-6">
          <p>¡Gracias por su preferencia!</p>
          <p>Este documento no tiene valor fiscal</p>
          <p className="mt-2">*** {fechaActual} ***</p>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          body {
            margin: 5mm;
            font-size: 12px;
          }
        }
        `
      }} />
    </>
  );
} 