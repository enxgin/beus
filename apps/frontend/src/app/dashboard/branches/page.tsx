"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "./components/data-table"
import { UserRole } from "@/types/user"
import { columns } from "./components/columns"
import { useBranches } from "./hooks/use-branches"
import { useAuth } from "@/hooks/use-auth"
import { useBranchModal } from "@/hooks/use-branch-modal"
import { BranchModal } from "./components/branch-modal"

export default function BranchesPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: branches, isLoading, error } = useBranches()
  const { user } = useAuth()
  const branchModal = useBranchModal()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Yükleniyor...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center p-8">Hata: {error.message}</div>
  }

  // Hydration hatasını önlemek için component'in mount olmasını bekle
  if (!isMounted) {
    return null
  }

  return (
    <>
      <BranchModal
        isOpen={branchModal.isOpen}
        onClose={branchModal.onClose}
        initialData={branchModal.initialData}
        branches={branches || []}
      />
      <div className="space-y-8 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Şubeler</h2>
            <p className="text-muted-foreground">
              İşletmenize ait şubeleri buradan yönetebilirsiniz.
            </p>
          </div>
          {user?.role === UserRole.ADMIN && (
            <div className="flex items-center space-x-2">
              <Button onClick={() => branchModal.onOpen()}>Yeni Şube Ekle</Button>
            </div>
          )}
        </div>
        <DataTable columns={columns} data={branches || []} />
      </div>
    </>
  )
}
