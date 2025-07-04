"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { ServiceCategory } from "../data/schema"
import { useAuthStore } from "@/stores/auth.store"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Tüm şubeler için özel bir sabit değer
const ALL_BRANCHES = "all-branches"  // Backend'e null olarak gönderilecek özel bir değer

// Bileşen props tipi
interface CategoryFormProps {
  category?: ServiceCategory
  isEdit?: boolean
}

type Branch = {
  id: string;
  name: string;
}

export function CategoryForm({ category, isEdit = false }: CategoryFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  
  // Auth store'dan token, kullanıcı rolü ve hydration durumunu al
  const { accessToken, user, isHydrated } = useAuthStore()
  const userRole = user?.role
  
  // Yönetici rolü kontrolü
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_BRANCH_MANAGER'
  
  // Form state'leri
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [branchId, setBranchId] = useState<string>(category?.branchId || category?.branch?.id || ALL_BRANCHES)
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  
  // Şubeleri getir
  const fetchBranches = async () => {
    if (!accessToken) return
    
    try {
      setLoadingBranches(true)
      const response = await api.get('/branches')
      setBranches(response.data)
    } catch (error: any) {
      console.error("Branches fetch error:", error)
      toast({
        title: "Hata",
        description: "Şubeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoadingBranches(false)
    }
  }
  
  // Auth durumunu kontrol et ve şube bilgilerini getir
  useEffect(() => {
    // Store hydrate edildiğinde ve token varsa hazır olarak işaretle
    if (isHydrated) {
      if (!accessToken) {
        toast({
          title: "Oturum hatası",
          description: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.",
          variant: "destructive",
        })
        router.push("/")
      } else {
        setIsAuthReady(true)
        
        // Admin veya süper şube yöneticisi ise şubeleri getir
        if (isAdmin) {
          fetchBranches()
        }
      }
    }
  }, [isHydrated, accessToken, router, toast, isAdmin])
  
  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Form doğrulama
    if (!name || name.trim() === "") {
      toast({
        title: "Hata",
        description: "Kategori adı boş olamaz.",
        variant: "destructive",
      })
      return
    }
    
    // Form verilerini hazırla
    const formData: any = {
      name: name.trim(),
      description: description?.trim() || "",
      isActive: isActive
    }
    
    // Şube atamasını işleme
    if (branchId === ALL_BRANCHES) {
      // ALL_BRANCHES seçildi - genel kategori (tüm şubeler)
      // Burada undefined kullanarak backend'in DTO'nun opsiyonel alanı kullanmasını sağlıyoruz
      // Keçici olarak delete kullanıyoruz, böylece backend'e bu alan hiç gönderilmez
      delete formData.branchId;
    } else if (!isAdmin && user?.branch?.id) {
      // Şube yöneticisi veya çalışan ise kendi şubesi
      formData.branchId = user.branch.id;
    } else if (branchId) {
      // Admin seçim yaptı
      formData.branchId = branchId;
    }
    
    try {
      setIsSubmitting(true)
      console.log("Gönderilen veri:", JSON.stringify(formData, null, 2))
      
      if (isEdit && category) {
        // Kategori güncelleme
        // Şu anda backend branchId güncellemesini desteklemediğinden
        // sadece temel alanları gönderiyoruz
        const updateData = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive
          // Şimdilik branchId güncellemesini devre dışı bırakıyoruz
          // Backend'de Prisma unique constraint sorunu oluşabiliyor
        }
        
        console.log("Güncelleme verisi:", JSON.stringify(updateData, null, 2))
        
        // API endpoint doğru formatta kullanılıyor
        const response = await api.patch(`/services/categories/${category.id}`, updateData)
        console.log("Güncelleme yanıtı:", response.data)
        
        toast({
          title: "Kategori güncellendi",
          description: "Hizmet kategorisi başarıyla güncellendi.",
        })
      } else {
        // Yeni kategori oluşturma
        // Tip tanımlaması ile createData nesnesini oluşturuyoruz
        interface CreateData {
          name: string;
          description: string;
          isActive: boolean;
          branchId?: string | null;
        }
        
        const createData: CreateData = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive
        }
        
        // branchId oluşturma için ekleme
        if (formData.branchId !== undefined) {
          createData.branchId = formData.branchId;
        }
        
        console.log("Oluşturma verisi:", JSON.stringify(createData, null, 2))
        
        const response = await api.post("/service-categories", createData)
        console.log("Oluşturma yanıtı:", response.data)
        
        toast({
          title: "Kategori oluşturuldu",
          description: "Yeni hizmet kategorisi başarıyla oluşturuldu.",
        })
      }
      
      // Başarılı işlem sonrasında listeye dön
      router.push("/dashboard/service-categories")
      router.refresh()
    } catch (error: any) {
      console.error("API Error:", error)
      const errorDetail = error.response?.data?.message || error.message || "Bilinmeyen hata";
      
      toast({
        title: "Hata",
        description: `İşlem sırasında bir hata oluştu: ${errorDetail}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Kategori Adı
        </label>
        <Input 
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Cilt Bakımı"
          required
        />
        <p className="text-sm text-muted-foreground">
          Hizmet kategorisinin adını girin.
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Açıklama
        </label>
        <Textarea 
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kategori hakkında açıklama girin"
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Kategori hakkında kısa bir açıklama ekleyebilirsiniz.
        </p>
      </div>
      
      {/* Sadece admin ve süper şube yöneticisi için şube seçimi gösterilir */}
      {isAdmin && (
        <div className="space-y-2 border p-4 rounded-md bg-blue-50">
          <div>
            <label htmlFor="branch" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Şube Ataması
            </label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Kategoriyi belirli bir şubeye atayabilir veya tüm şubelerde görünmesini sağlayabilirsiniz.
            </p>
          </div>
          
          <Select
            value={branchId}
            onValueChange={(value) => setBranchId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Şube seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>Genel (Tüm Şubeler)</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {branchId === ALL_BRANCHES ? (
            <p className="text-xs text-blue-600">Bu kategori tüm şubelerde görüntülenecek</p>
          ) : branchId ? (
            <p className="text-xs text-blue-600">Bu kategori sadece seçilen şubede görüntülenecek</p>
          ) : null}
          
          {loadingBranches && <p className="text-sm text-muted-foreground">Şubeler yükleniyor...</p>}
        </div>
      )}
      
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label htmlFor="status" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Durum
          </label>
          <p className="text-sm text-muted-foreground">
            Kategori aktif mi pasif mi olacak?
          </p>
        </div>
        <Switch
          id="status"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>
      
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/dashboard/service-categories")}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  )
}
