"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HomeIcon } from "lucide-react"
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
      <div className="space-y-6">
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <HomeIcon className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Şubeler</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Şube Yönetimi</h1>
              <p className="text-muted-foreground mt-1">
                İşletmenize ait şubeleri buradan yönetebilirsiniz.
              </p>
            </div>
            {user?.role === UserRole.ADMIN && (
              <Button onClick={() => branchModal.onOpen()}>Yeni Şube Ekle</Button>
            )}
          </div>
        </div>
        <DataTable columns={columns} data={branches || []} />
      </div>
    </>
  )
}
