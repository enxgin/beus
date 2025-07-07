'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { openCashDay } from '@/actions/cash-register-actions'; // Bu action daha sonra oluşturulacak

const openCashDaySchema = z.object({
  openingBalance: z.coerce.number().min(0, 'Açılış bakiyesi 0 veya daha büyük olmalıdır.'),
  notes: z.string().optional(),
  // Şimdilik branchId'yi sabit olarak alıyoruz, daha sonra dinamik hale getirilebilir.
  branchId: z.string().default('clz1yl2o4000013j1p5itk9s5'),
});

type OpenCashDayValues = z.infer<typeof openCashDaySchema>;

interface OpenCashDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Placeholder for the server action
async function openCashDay(values: OpenCashDayValues): Promise<any> {
  console.log('Opening cash day with:', values);
  // Burada backend'e API çağrısı yapılacak.
  // Örnek: const response = await fetch('/api/cash-register/open', { method: 'POST', body: JSON.stringify(values) });
  // if (!response.ok) throw new Error('Kasa açılamadı');
  // return response.json();
  return new Promise(resolve => setTimeout(() => resolve({ id: 'new-cash-day-id' }), 1000));
}

export function OpenCashDayDialog({ isOpen, onClose }: OpenCashDayDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<OpenCashDayValues>({
    resolver: zodResolver(openCashDaySchema),
    defaultValues: {
      openingBalance: 0,
      notes: '',
      branchId: 'clz1yl2o4000013j1p5itk9s5', // Varsayılan şube ID'si
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: openCashDay,
    onSuccess: () => {
      toast.success('Kasa başarıyla açıldı!');
      queryClient.invalidateQueries({ queryKey: ['cash-reports'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast.error(`Bir hata oluştu: ${error.message}`);
    },
  });

  const onSubmit = (values: OpenCashDayValues) => {
    mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kasa Açılışı Yap</DialogTitle>
          <DialogDescription>
            Yeni bir işlem gününe başlamak için kasanın açılış bakiyesini girin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açılış Bakiyesi</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Açılışla ilgili notlar..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                İptal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Açılıyor...' : 'Kasayı Aç'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
