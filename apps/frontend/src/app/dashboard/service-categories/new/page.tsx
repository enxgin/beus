"use client"

import { CategoryForm } from "../components/category-form"

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Hizmet Kategorisi</h1>
        <p className="text-muted-foreground">
          Salon hizmetleri için yeni bir kategori oluşturun.
        </p>
      </div>
      <div className="max-w-2xl">
        <CategoryForm />
      </div>
    </div>
  )
}
