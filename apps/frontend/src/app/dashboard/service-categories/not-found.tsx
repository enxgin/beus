"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container mx-auto py-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Kategori Bulunamadı</h2>
      <p className="mb-6">Aradığınız kategori bulunamadı veya silinmiş olabilir.</p>
      <Link
        href="/dashboard/service-categories"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Kategorilere Dön
      </Link>
    </div>
  )
}
