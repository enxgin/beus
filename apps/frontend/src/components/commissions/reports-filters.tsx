"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { getStaffForSelect } from "@/services/select.service";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const filterSchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  date: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export function ReportsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      userId: searchParams.get("userId") || "",
      status: searchParams.get("status") || "",
      date: {
        from: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
        to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      },
    },
  });

  const { data: staffOptions, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff-select"],
    queryFn: getStaffForSelect,
  });

  const onSubmit = (data: FilterFormValues) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to first page on new filter

    if (data.userId) params.set("userId", data.userId);
    else params.delete("userId");

    if (data.status) params.set("status", data.status);
    else params.delete("status");

    if (data.date?.from) params.set("startDate", format(data.date.from, 'yyyy-MM-dd'));
    else params.delete("startDate");

    if (data.date?.to) params.set("endDate", format(data.date.to, 'yyyy-MM-dd'));
    else params.delete("endDate");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-start md:items-end gap-4 p-4 border rounded-lg mb-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem className="w-full md:w-auto md:flex-1">
              <FormLabel>Personel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingStaff}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Personeller" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Tüm Personeller</SelectItem>
                  {staffOptions?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="w-full md:w-auto md:flex-1">
              <FormLabel>Durum</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Durumlar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Tüm Durumlar</SelectItem>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="APPROVED">Onaylandı</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full md:w-auto">
              <FormLabel>Tarih Aralığı</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[300px] justify-start text-left font-normal",
                      !field.value?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.from ? (
                      field.value.to ? (
                        <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                      ) : (
                        format(field.value.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Bir tarih aralığı seçin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={{ from: field.value?.from!, to: field.value?.to }}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">Filtrele</Button>
          <Button variant="outline" onClick={() => router.push(pathname)}>Temizle</Button>
        </div>
      </form>
    </Form>
  );
}
