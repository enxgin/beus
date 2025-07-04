"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { BranchForm, type BranchFormValues } from "./branch-form"
import { useCreateBranch, useUpdateBranch } from "../hooks/use-branches"
import { type Branch } from "./columns"

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Branch | null
  branches: Branch[]
}

export function BranchModal({ isOpen, onClose, initialData, branches }: BranchModalProps) {
  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()

  const title = initialData ? "Şubeyi Düzenle" : "Yeni Şube Oluştur"
  const description = initialData ? "Mevcut şube bilgilerini güncelleyin." : "Formu doldurarak yeni bir şube ekleyin."
  const isLoading = createBranch.isPending || updateBranch.isPending

  const onSubmit = async (values: BranchFormValues) => {
    try {
      if (initialData) {
        await updateBranch.mutateAsync({ id: initialData.id, ...values })
        toast.success("Şube başarıyla güncellendi.")
      } else {
        await createBranch.mutateAsync(values)
        toast.success("Şube başarıyla oluşturuldu.")
      }
      onClose()
    } catch (error) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.")
      console.error(error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <BranchForm
          initialData={initialData}
          branches={branches}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
