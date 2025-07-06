"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateInvoiceForm } from "./create-invoice-form";

export function CreateInvoiceButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Fatura Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
          <DialogDescription>
            Müşteri için paket satışı veya hizmet tamamlandığında fatura oluşturun.
          </DialogDescription>
        </DialogHeader>
        <CreateInvoiceForm onSuccess={() => {
          setOpen(false);
          router.refresh();
        }} />
      </DialogContent>
    </Dialog>
  );
}
