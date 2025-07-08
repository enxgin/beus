"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CashLogType, CashMovementCategory } from '@prisma/client';
import { toast } from 'sonner';
import { createManualCashMovement } from '@/actions/cash-register-actions';
import { useAuth } from '@/stores/auth.store';

const formSchema = z.object({
  type: z.enum([CashLogType.MANUAL_IN, CashLogType.MANUAL_OUT], {
    required_error: 'Hareket türü seçmek zorunludur.',
  }),
  category: z.nativeEnum(CashMovementCategory, {
    required_error: 'Kategori seçmek zorunludur.',
  }),
  amount: z.coerce
    .number({ required_error: 'Tutar girmek zorunludur.' })
    .positive('Tutar pozitif bir değer olmalıdır.'),
  description: z.string().min(3, 'Açıklama en az 3 karakter olmalıdır.'),
});

const categoryLabels: Record<CashMovementCategory, string> = {
  RENT: 'Kira',
  UTILITIES: 'Faturalar',
  SUPPLIES: 'Malzeme',
  STAFF_ADVANCE: 'Personel Avansı',
  MAINTENANCE: 'Bakım-Onarım',
  MARKETING: 'Pazarlama',
  OTHER_EXPENSE: 'Diğer Gider',
  OTHER_INCOME: 'Diğer Gelir',
};

export function AddCashMovementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, token } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.branchId) {
      toast.error('Kullanıcının şube bilgisi bulunamadı.');
      return;
    }

    const dataToSubmit = {
      ...values,
      branchId: user.branchId,
    };

    toast.promise(createManualCashMovement(token, dataToSubmit), {
      loading: 'Hareket kaydediliyor...',
      success: (res) => {
        if (res.error) {
          throw new Error(res.error);
        }
        setIsOpen(false);
        form.reset();
        return 'Hareket başarıyla kaydedildi!';
      },
      error: (err) => `Bir hata oluştu: ${err.message}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Hareket Ekle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manuel Kasa Hareketi Ekle</DialogTitle>
          <DialogDescription>
            Kasa hesabını etkileyecek bir gelir veya gider ekleyin. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hareket Türü</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Gelir veya Gider seçin..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CashLogType.MANUAL_IN}>Gelir (+)</SelectItem>
                      <SelectItem value={CashLogType.MANUAL_OUT}>Gider (-)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bir kategori seçin..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutar (₺)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Hareketin detaylı açıklaması..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Kaydediliyor...' : 'Hareketi Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
