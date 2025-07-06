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
  // Backend'in kabul etmediği alanları kaldırıyoruz
  // note alanını kaldırdık
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  remainingAmount: number;
  onSuccess: () => void;
  customerName: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  remainingAmount,
  onSuccess,
  customerName,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [isFullPayment, setIsFullPayment] = useState(true);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: isNaN(remainingAmount) ? 0 : remainingAmount,
      method: "CASH",
      // note alanını kaldırdık
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      // Veri formatını API'nin beklediği şekilde düzenle
      // Backend'in kabul ettiği alanları gönderelim
      // Hata mesajı: ['property note should not exist', 'property invoiceNumber should not exist']
      const paymentData = {
        amount: Number(data.amount) || 0, // NaN kontrolü
        method: data.method
        // NOT: Backend note ve invoiceNumber alanlarını kabul etmiyor
        // Bu alanları göndermiyoruz
      };
      
      console.log("Ödeme verileri gönderiliyor:", paymentData);
      
      // API endpoint'i doğru formatta kullanalım
      // invoiceId'yi direkt olarak kullanalım, substring yapmadan
      return api.post(`/invoices/${invoiceId}/payments`, paymentData);
    },
    onSuccess: (response) => {
      console.log("Ödeme başarılı:", response.data);
      toast({
        title: "Ödeme başarılı",
        description: "Fatura ödemesi başarıyla kaydedildi.",
      });
      form.reset();
      onOpenChange(false); // Modalı kapat
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Ödeme yapılırken bir hata oluştu.";
      console.error("Ödeme hatası:", error);
      toast({
        title: "Hata",
        description: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
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
      form.setValue("amount", isNaN(remainingAmount) ? 0 : remainingAmount);
    } else {
      form.setValue("amount", 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl">Ödeme Yap</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {customerName} için fatura ödemesi yapın.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Button
                type="button"
                variant={isFullPayment ? "default" : "outline"}
                onClick={() => handlePaymentTypeChange(true)}
                className="w-full text-xs sm:text-sm py-1 sm:py-2 h-auto"
                size="sm"
              >
                Tam Ödeme
              </Button>
              <Button
                type="button"
                variant={!isFullPayment ? "default" : "outline"}
                onClick={() => handlePaymentTypeChange(false)}
                className="w-full text-xs sm:text-sm py-1 sm:py-2 h-auto"
                size="sm"
              >
                Kısmi Ödeme
              </Button>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Ödeme Tutarı</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={isNaN(remainingAmount) ? 0 : remainingAmount}
                      className="text-sm h-8 sm:h-10"
                      value={isNaN(field.value) ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                        field.onChange(value);
                        const safeRemainingAmount = isNaN(remainingAmount) ? 0 : remainingAmount;
                        setIsFullPayment(value === safeRemainingAmount);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Kalan tutar: {formatCurrency(isNaN(remainingAmount) ? 0 : remainingAmount)}
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem className="space-y-1 sm:space-y-2">
                  <FormLabel className="text-xs sm:text-sm">Ödeme Yöntemi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm h-8 sm:h-10">
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-sm">
                      <SelectItem value="CASH">Nakit</SelectItem>
                      <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Banka Transferi</SelectItem>
                      <SelectItem value="CUSTOMER_CREDIT">Müşteri Kredisi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Note alanını kaldırdık çünkü backend kabul etmiyor */}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
                size="sm"
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
                size="sm"
                disabled={
                  addPaymentMutation.isPending ||
                  !form.formState.isValid ||
                  form.getValues("amount") <= 0 ||
                  form.getValues("amount") > remainingAmount
                }
              >
                {addPaymentMutation.isPending ? "Ödeme Yapılıyor..." : "Ödeme Yap"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
