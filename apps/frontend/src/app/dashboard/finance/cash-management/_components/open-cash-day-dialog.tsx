'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
import { openCashDay } from '@/actions/cash-register-actions';

const openCashDaySchema = z.object({
  openingBalance: z.coerce.number().min(0, 'Açılış bakiyesi 0 veya daha büyük olmalıdır.'),
  notes: z.string().optional(),
  branchId: z.string().min(1, 'Şube IDsi gereklidir.'),
});

type OpenCashDayValues = z.infer<typeof openCashDaySchema>;

interface OpenCashDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

export function OpenCashDayDialog({ isOpen, onClose, branchId }: OpenCashDayDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<OpenCashDayValues>({
    resolver: zodResolver(openCashDaySchema),
    defaultValues: {
      openingBalance: 0,
      notes: '',
      branchId: branchId,
    },
  });

  useEffect(() => {
    form.reset({ openingBalance: 0, notes: '', branchId });
  }, [branchId, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: openCashDay,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(`Kasa açılamadı: ${result.error}`);
        return;
      }

      toast.success('Kasa başarıyla açıldı!');
      
      // Bu, 'cash-day-details' ile başlayan tüm sorguları geçersiz kılar ve yeniden yüklenmelerini tetikler.
      queryClient.invalidateQueries({ queryKey: ['cash-day-details'] });
      
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
            {/* branchId is hidden but submitted with the form */}
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
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
