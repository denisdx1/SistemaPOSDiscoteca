
import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SelectMesa } from './components/SelectMesa';
import { Mesa } from '@/types/mesa';

type NuevaOrdenProps = {
  mesas?: Mesa[];
  mesa?: Mesa;
};

export default function NuevaOrden({ mesas, mesa }: NuevaOrdenProps) {
  const { props } = usePage();
  const form = useForm({
    defaultValues: {
      mesa_id: mesa?.id || null,
    },
  });

  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(
    () => mesa || null
  );

  useEffect(() => {
    const mesaId = new URLSearchParams(window.location.search).get('mesa');
    if (mesaId) {
      const mesaFromRoute = mesas?.find(m => m.id === Number(mesaId));
      setSelectedMesa(mesaFromRoute || null);
      form.setValue('mesa_id', mesaFromRoute?.id || null);
    }
  }, [mesas]);

  const onSubmit = (data: any) => {
    router.post(route('ordenes.store'), {
      ...data,
      mesa_id: selectedMesa?.id || null,
    });
  };

  return (
    <DashboardLayout>
      <Head title="Nueva Orden" />
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Crear Nueva Orden</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mesa_id"
              render={({ field }) => (
                <FormItem>
                  <SelectMesa
                    mesas={mesas}
                    selectedMesa={selectedMesa}
                    onMesaSelected={(mesa) => {
                      setSelectedMesa(mesa);
                      field.onChange(mesa?.id || null);
                    }}
                    allowClear
                  />
                </FormItem>
              )}
            />
            
            <Button type="submit">Crear Orden</Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
