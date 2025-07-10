"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  commissionRuleSchema,
  CommissionRuleFormValues,
} from "@/lib/schemas/commission-rule.schema";
import {
  createCommissionRule,
  updateCommissionRule,
  CommissionRule,
} from "@/services/commission.service";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useServices } from "@/app/dashboard/services/hooks/use-services";
import { useUsers } from "@/app/dashboard/users/hooks/use-users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CommissionRuleFormProps {
  initialData?: CommissionRule | null;
  onSuccess: () => void;
}

export function CommissionRuleForm({ initialData, onSuccess }: CommissionRuleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Services ve users için data çek
  const { data: servicesData } = useServices({ page: 1, limit: 100 });
  const { data: usersData } = useUsers();

  const form = useForm<CommissionRuleFormValues>({
    resolver: zodResolver(commissionRuleSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name || '',
      type: initialData.type || "PERCENTAGE",
      rate: initialData.rate || 0,
      fixedAmount: initialData.fixedAmount || 0,
      description: initialData.description || "",
      startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
      endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
      branchId: initialData.branchId || '',
      ruleType: initialData.ruleType || 'GENERAL',
      serviceId: initialData.serviceId || null,
      staffId: initialData.staffId || null,
      isActive: initialData.isActive ?? true,
      // Geriye uyumluluk için eski alanlar
      value: initialData.value || initialData.rate || initialData.fixedAmount || 0,
      isGlobal: initialData.isGlobal || false,
      userId: initialData.userId || null,
    } : {
      name: '',
      type: "PERCENTAGE",
      rate: 0,
      fixedAmount: 0,
      description: "",
      startDate: '',
      endDate: '',
      branchId: '',
      ruleType: 'GENERAL',
      serviceId: null,
      staffId: null,
      isActive: true,
      // Geriye uyumluluk için eski alanlar
      value: 0,
      isGlobal: false,
      userId: null,
    },
  });

  const watchedRuleType = form.watch("ruleType");
  const watchedType = form.watch("type");

  const mutation = useMutation({
    mutationFn: (data: CommissionRuleFormValues) =>
      initialData
        ? updateCommissionRule(initialData.id, data)
        : createCommissionRule(data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: `Prim kuralı başarıyla ${initialData ? 'güncellendi' : 'oluşturuldu'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommissionRuleFormValues) => {
    // Backend'in beklediği formata dönüştür
    const transformedData = {
      ...data,
      // Tip kontrolü yaparak doğru alanı ayarla
      rate: data.type === 'PERCENTAGE' ? (data.rate || data.value || 0) : 0,
      fixedAmount: data.type === 'FIXED_AMOUNT' ? (data.fixedAmount || data.value || 0) : 0,
      // Geriye uyumluluk için value alanını da gönder
      value: data.value || data.rate || data.fixedAmount || 0,
      // Rule type'a göre gereksiz alanları temizle
      serviceId: data.ruleType === 'SERVICE_SPECIFIC' ? data.serviceId : null,
      staffId: data.ruleType === 'STAFF_SPECIFIC' ? data.staffId : null,
    };
    
    mutation.mutate(transformedData);
  };

  const getRuleTypeDescription = (ruleType: string) => {
    switch (ruleType) {
      case 'GENERAL':
        return 'Bu kural tüm personel için geçerli olacak. En düşük önceliğe sahiptir.';
      case 'SERVICE_SPECIFIC':
        return 'Bu kural sadece belirli bir hizmet için geçerli olacak. Orta önceliğe sahiptir.';
      case 'STAFF_SPECIFIC':
        return 'Bu kural sadece belirli bir personel için geçerli olacak. En yüksek önceliğe sahiptir.';
      default:
        return '';
    }
  };

  const getRuleTypeBadge = (ruleType: string) => {
    switch (ruleType) {
      case 'GENERAL':
        return <Badge variant="secondary">Düşük Öncelik</Badge>;
      case 'SERVICE_SPECIFIC':
        return <Badge variant="default">Orta Öncelik</Badge>;
      case 'STAFF_SPECIFIC':
        return <Badge variant="destructive">Yüksek Öncelik</Badge>;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Kural Tipi Seçimi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Kural Tipi
              {getRuleTypeBadge(watchedRuleType || 'GENERAL')}
            </CardTitle>
            <CardDescription>
              {getRuleTypeDescription(watchedRuleType || 'GENERAL')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="ruleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kural Tipi Seçin</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kural tipini seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GENERAL">
                        <div className="flex flex-col">
                          <span>Genel Kural</span>
                          <span className="text-xs text-muted-foreground">Tüm personel için geçerli</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SERVICE_SPECIFIC">
                        <div className="flex flex-col">
                          <span>Hizmet Özel Kural</span>
                          <span className="text-xs text-muted-foreground">Belirli hizmet için geçerli</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STAFF_SPECIFIC">
                        <div className="flex flex-col">
                          <span>Personel Özel Kural</span>
                          <span className="text-xs text-muted-foreground">Belirli personel için geçerli</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hizmet Seçimi - SERVICE_SPECIFIC için */}
            {watchedRuleType === 'SERVICE_SPECIFIC' && (
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Hizmet Seçin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hizmet seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servicesData?.data?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Personel Seçimi - STAFF_SPECIFIC için */}
            {watchedRuleType === 'STAFF_SPECIFIC' && (
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Personel Seçin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Personel seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usersData?.data?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kural Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Genel Prim Kuralı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Kural hakkında kısa bir açıklama..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktif Durum</FormLabel>
                    <FormDescription>
                      Bu kural aktif olarak kullanılsın mı?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Prim Hesaplama */}
        <Card>
          <CardHeader>
            <CardTitle>Prim Hesaplama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prim Tipi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Prim tipini seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Yüzdelik (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Sabit Tutar (TL)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yüzde Oranı (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Örn: 10"
                        {...field}
                        disabled={watchedType !== "PERCENTAGE"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fixedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sabit Tutar (TL)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Örn: 50"
                        {...field}
                        disabled={watchedType !== "FIXED_AMOUNT"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tarih Aralığı */}
        <Card>
          <CardHeader>
            <CardTitle>Geçerlilik Tarihleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Tarihi</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bitiş Tarihi (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'İşleniyor...' : (initialData ? 'Güncelle' : 'Oluştur')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
