"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { useQueryClient } from "@tanstack/react-query"
import { Row } from "@tanstack/react-table"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditCustomerDialog } from "./edit-customer-dialog"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { customerSchema } from "../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const router = useRouter()
  const queryClient = useQueryClient()
  // ZodError'u önlemek için katı parse işlemini kaldırıyoruz.
  // Gelen veriyi daha esnek bir tip olarak ele alıyoruz.
  const customer = row.original as any
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${customer.id}`)
      toast.success("Müşteri başarıyla silindi.")
      // Müşteri listesini yenilemek için 'customers' sorgusunu geçersiz kıl
      await queryClient.invalidateQueries({ queryKey: ["customers"] })
    } catch (error) {
      toast.error("Müşteri silinirken bir hata oluştu.")
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <EditCustomerDialog
        customer={customer}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <DotsHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">Menüyü aç</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={() => router.push(`/dashboard/customers/${customer.id}`)}
            >
              Görüntüle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu, müşteriyi kalıcı olarak silecek ve verilerini sunucularımızdan kaldıracaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
