"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { useDeleteBranch } from "../hooks/use-branches";
import { useBranchModal } from "@/hooks/use-branch-modal";
import { type Branch } from "./columns";

interface CellActionProps {
  data: Branch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const deleteBranch = useDeleteBranch();
  const branchModal = useBranchModal();

  const onConfirmDelete = async () => {
    try {
      await deleteBranch.mutateAsync(data.id);
      toast.success("Şube silindi.");
    } catch (error) {
      toast.error("Bir hata oluştu. Silme işlemi başarısız.");
    } finally {
      setAlertModalOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={onConfirmDelete}
        loading={deleteBranch.isPending}
        title={`${data.name} şubesini silmek istediğinizden emin misiniz?`}
        description="Bu şubeye bağlı tüm veriler kalıcı olarak silinecektir. Bu işlem geri alınamaz."
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => branchModal.onOpen(data)}>
            <Edit className="mr-2 h-4 w-4" /> Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAlertModalOpen(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash className="mr-2 h-4 w-4" /> Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
