"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText, ArrowRight, User, Calendar } from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Invoice {
  id: string;
  totalAmount: number;
  amountPaid: number;
  debt: number;
  status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
  createdAt: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
  };
  appointment?: {
    id: string;
    service: {
      name: string;
    };
    startTime: string;
  };
  customerPackage?: {
    id: string;
    package: {
      name: string;
    };
  };
}

interface PaymentFlowProps {
  pendingInvoices: Invoice[];
  isLoading: boolean;
}

export function PaymentFlow({ pendingInvoices, isLoading }: PaymentFlowProps) {
  const router = useRouter();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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

  const getInvoiceType = (invoice: Invoice) => {
    if (invoice.appointment) {
      return `Hizmet: ${invoice.appointment.service.name}`;
    } else if (invoice.customerPackage) {
      return `Paket: ${invoice.customerPackage.package.name}`;
    } else {
      return "Diğer";
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
    // Burada React Query invalidateQueries kullanılabilir
    // queryClient.invalidateQueries(['pendingInvoices']);
    // Ancak şimdilik sayfayı yenileme ile çözelim
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(2).fill(0).map((_, j) => (
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
    );
  }

  if (pendingInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bekleyen Ödeme Yok</CardTitle>
          <CardDescription>
            Şu anda bekleyen ödeme bulunmamaktadır.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pendingInvoices.map((invoice) => (
        <Card key={invoice.id} className="overflow-hidden border-l-4" 
          style={{ borderLeftColor: invoice.status === "PARTIALLY_PAID" ? "#f59e0b" : "#ef4444" }}
        >
          <div className="flex flex-col">
            {/* Üst kısım - Müşteri bilgisi ve durum */}
            <div className="bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    {invoice.customer.avatar ? (
                      <AvatarImage src={invoice.customer.avatar} alt={invoice.customer.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {invoice.customer.name.charAt(0)}{invoice.customer.name.split(' ')[1]?.charAt(0) || ''}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">{invoice.customer.name}</h3>
                    <div className="flex items-center text-xs md:text-sm text-muted-foreground mt-0.5">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>#{invoice.id.substring(0, 8)}</span>
                      <span className="mx-1">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(invoice.createdAt).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
            
            {/* Orta kısım - Fatura detayları */}
            <div className="p-4 pt-0">
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sol kısım - İşlem türü */}
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">İşlem Türü</div>
                  <div className="font-medium text-sm">{getInvoiceType(invoice)}</div>
                  {invoice.appointment && (
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(invoice.appointment.startTime).toLocaleDateString("tr-TR")}
                    </div>
                  )}
                </div>
                
                {/* Orta kısım - Tutar bilgileri */}
                <div className="bg-background p-3 rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">Toplam Tutar</div>
                      <div className="font-medium text-sm">{formatCurrency(invoice.totalAmount)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">Ödenen</div>
                      <div className="font-medium text-sm text-green-600">{formatCurrency(invoice.amountPaid)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">Kalan</div>
                      <div className="font-bold text-sm text-destructive">{formatCurrency(invoice.debt)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Sağ kısım - İşlem butonları */}
                <div className="flex flex-col space-y-2">
                  <Button 
                    className="w-full flex items-center justify-center text-sm"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ödeme Yap
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center text-sm"
                    onClick={() => router.push(`/dashboard/finance/invoices/${invoice.id}`)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Fatura Detayı
                  </Button>
                </div>
              </div>
              
              {/* Alt kısım - Özet bilgiler */}
              <div className="mt-4 flex items-center text-xs text-muted-foreground justify-end">
                <User className="h-3 w-3 mr-1" />
                <span>{invoice.customer.name}</span>
                <span className="mx-1">•</span>
                <span>Borç: {formatCurrency(invoice.debt)}</span>
                <span className="mx-1">•</span>
                <span>Durum: {invoice.status === "UNPAID" ? "Ödenmemiş" : "Kısmen Ödenmiş"}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {selectedInvoice && (
        <PaymentDialog 
          open={isPaymentDialogOpen} 
          onOpenChange={setIsPaymentDialogOpen}
          invoiceId={selectedInvoice.id}
          remainingAmount={selectedInvoice.debt}
          onSuccess={handlePaymentSuccess}
          customerName={selectedInvoice.customer.name}
        />
      )}
    </div>
  );
}
