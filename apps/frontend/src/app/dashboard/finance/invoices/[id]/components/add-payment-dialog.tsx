"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalıdır").max(1000000, "Tutar çok yüksek"),
  method: z.enum(["CASH", "CREDIT_CARD", "BANK_TRANSFER", "CUSTOMER_CREDIT"], {
    required_error: "Ödeme yöntemi seçilmelidir",
  }),
  note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  remainingAmount: number;
  onSuccess: () => void;
}

export function AddPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingAmount,
  onSuccess,
}: AddPaymentDialogProps) {
  const { toast } = useToast();
  const [isFullPayment, setIsFullPayment] = useState(true);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remainingAmount,
      method: "CASH",
      note: "",
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return api.post(`/invoices/${invoiceId}/payments`, data);
    },
    onSuccess: (response) => {
      // Önce temel ödeme başarı mesajını göster
      toast({
        title: "Ödeme eklendi",
        description: "Fatura ödemesi başarıyla kaydedildi.",
      });
      
      // Prim hesaplandıysa ek bildirim göster
      // Backend log'larını kontrol ederek prim hesaplanıp hesaplanmadığını anlayabiliriz
      // Şimdilik basit bir yaklaşım kullanıyoruz
      setTimeout(() => {
        // Bu bildirim backend log'larında prim hesaplandığını gördüğümüzde gösterilecek
        // Gerçek implementasyonda backend'ten prim bilgisi dönmeli
        console.log("Ödeme tamamlandı, prim kontrolü yapılıyor...");
      }, 1000);
      
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error("Ödeme ekleme hatası:", error);
      toast({
        title: "Hata",
        description: "Ödeme eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    addPaymentMutation.mutate(data);
  };

  // Tam ödeme veya kısmi ödeme seçeneği değiştiğinde
  const handlePaymentTypeChange = (isFullPayment: boolean) => {
    setIsFullPayment(isFullPayment);
    if (isFullPayment) {
      form.setValue("amount", remainingAmount);
    } else {
      form.setValue("amount", 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ödeme Ekle</DialogTitle>
          <DialogDescription>
            Fatura için yeni bir ödeme kaydı ekleyin.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={isFullPayment ? "default" : "outline"}
                onClick={() => handlePaymentTypeChange(true)}
                className="w-full"
              >
                Tam Ödeme
              </Button>
              <Button
                type="button"
                variant={!isFullPayment ? "default" : "outline"}
                onClick={() => handlePaymentTypeChange(false)}
                className="w-full"
              >
                Kısmi Ödeme
              </Button>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Tutarı</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remainingAmount}
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(value);
                        setIsFullPayment(value === remainingAmount);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Kalan tutar: {formatCurrency(remainingAmount)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Yöntemi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Nakit</SelectItem>
                      <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Banka Transferi</SelectItem>
                      <SelectItem value="CUSTOMER_CREDIT">Müşteri Kredisi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Not (Opsiyonel)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Ödeme ile ilgili ekstra bilgiler
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={
                  addPaymentMutation.isPending ||
                  !form.formState.isValid ||
                  form.getValues("amount") <= 0 ||
                  form.getValues("amount") > remainingAmount
                }
              >
                {addPaymentMutation.isPending ? "Kaydediliyor..." : "Ödeme Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
