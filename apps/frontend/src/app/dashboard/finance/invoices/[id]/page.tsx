"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, CreditCard, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddPaymentDialog } from "./components/add-payment-dialog";
import api from "@/lib/api";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const invoiceId = params.id as string;

  const { data: invoice, isLoading, refetch } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500">Ödenmiş</Badge>;
      case "UNPAID":
        return <Badge variant="destructive">Ödenmemiş</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Kısmen Ödenmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInvoiceType = (invoice: any) => {
    if (invoice?.appointment) {
      return `Hizmet: ${invoice.appointment.service.name}`;
    } else if (invoice?.customerPackage) {
      return `Paket: ${invoice.customerPackage.package.name}`;
    } else {
      return "Diğer";
    }
  };

  const handlePaymentSuccess = () => {
    refetch();
    setIsPaymentDialogOpen(false);
    toast({
      title: "Ödeme başarılı",
      description: "Fatura ödemesi başarıyla kaydedildi.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Fatura Yükleniyor...</h1>
        </div>
        <div className="grid gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Fatura Bulunamadı</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Hata</CardTitle>
            <CardDescription>
              Belirtilen fatura bulunamadı veya erişim izniniz yok.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/finance/invoices")}>
              Fatura Listesine Dön
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fatura #{invoice.id.substring(0, 8)}</h1>
            <p className="text-muted-foreground">
              {new Date(invoice.createdAt).toLocaleDateString("tr-TR")} - {getInvoiceType(invoice)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
          {invoice.status !== "PAID" && (
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Ödeme Ekle
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fatura Detayları</CardTitle>
            <div className="flex items-center space-x-2">
              <CardDescription>Durum:</CardDescription>
              {getStatusBadge(invoice.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Müşteri</h3>
                <p className="font-medium">{invoice.customer.name}</p>
                <p className="text-sm">{invoice.customer.phone}</p>
                {invoice.customer.email && <p className="text-sm">{invoice.customer.email}</p>}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Şube</h3>
                <p className="font-medium">{invoice.branch.name}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Fatura İçeriği</h3>
              <div className="space-y-2">
                {invoice.appointment && (
                  <div className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{invoice.appointment.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.appointment.startTime).toLocaleDateString("tr-TR")} - 
                        Personel: {invoice.appointment.staff.name}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(invoice.appointment.service.price)}</p>
                  </div>
                )}

                {invoice.customerPackage && (
                  <div className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{invoice.customerPackage.package.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Geçerlilik: {new Date(invoice.customerPackage.expiryDate).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(invoice.customerPackage.package.price)}</p>
                  </div>
                )}

                {invoice.customer.discountRate > 0 && (
                  <div className="flex justify-between py-2 border-b text-green-600">
                    <p>İndirim (%{invoice.customer.discountRate})</p>
                    <p>-{formatCurrency(invoice.totalAmount * (invoice.customer.discountRate / 100))}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <p>Toplam</p>
              <p>{formatCurrency(invoice.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ödeme Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Toplam Tutar</p>
              <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Ödenen Tutar</p>
              <p className="font-medium">{formatCurrency(invoice.amountPaid)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Kalan Tutar</p>
              <p className="font-medium">{formatCurrency(invoice.debt)}</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Ödeme Geçmişi</h3>
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-2">
                  {invoice.payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between text-sm py-1 border-b">
                      <div>
                        <p>{new Date(payment.paymentDate).toLocaleDateString("tr-TR")}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.method === "CASH" && "Nakit"}
                          {payment.method === "CREDIT_CARD" && "Kredi Kartı"}
                          {payment.method === "BANK_TRANSFER" && "Banka Transferi"}
                          {payment.method === "CUSTOMER_CREDIT" && "Müşteri Kredisi"}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz ödeme yapılmamış.</p>
              )}
            </div>

            {invoice.status !== "PAID" && (
              <Button 
                className="w-full" 
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Ödeme Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <AddPaymentDialog 
        open={isPaymentDialogOpen} 
        onOpenChange={setIsPaymentDialogOpen}
        invoiceId={invoice.id}
        remainingAmount={invoice.debt}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
