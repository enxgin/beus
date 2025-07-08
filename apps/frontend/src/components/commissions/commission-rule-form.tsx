"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getStaffForSelect, getServicesForSelect } from "@/services/select.service";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CommissionRuleFormProps {
  initialData?: CommissionRule | null;
  onSuccess: () => void;
}

export function CommissionRuleForm({ initialData, onSuccess }: CommissionRuleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CommissionRuleFormValues>({
    resolver: zodResolver(commissionRuleSchema),
    defaultValues: initialData || {
      type: "PERCENTAGE",
      value: 0,
      description: "",
      isGlobal: false,
      serviceId: null,
      userId: null,
    },
  });

  const { data: staffOptions, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff-select"],
    queryFn: getStaffForSelect,
  });

  const { data: serviceOptions, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services-select"],
    queryFn: getServicesForSelect,
  });

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
    mutation.mutate(data);
  };

  const isGlobal = form.watch("isGlobal");
  const serviceId = form.watch("serviceId");
  const userId = form.watch("userId");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Değer</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Örn: 10 veya 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isGlobal"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if(checked) {
                      form.setValue('serviceId', null);
                      form.setValue('userId', null);
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Genel Kural</FormLabel>
                <FormDescription>
                  Bu kural herhangi bir hizmet veya personele atanmamış tüm işlemler için geçerlidir.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hizmete Özel</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('isGlobal', false);
                  form.setValue('userId', null);
                }}
                defaultValue={field.value || ""}
                disabled={isGlobal || isLoadingServices}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir hizmet seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Bu kural sadece seçilen hizmet için geçerlidir.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personele Özel</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue('isGlobal', false);
                  form.setValue('serviceId', null);
                }}
                defaultValue={field.value || ""}
                disabled={isGlobal || isLoadingStaff}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir personel seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {staffOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Bu kural sadece seçilen personel için geçerlidir.</FormDescription>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {initialData ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
