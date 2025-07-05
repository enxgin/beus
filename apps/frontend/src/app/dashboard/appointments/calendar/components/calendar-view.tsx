'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import { DateSelectArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { CalendarSkeleton } from './calendar-skeleton';
import { AppointmentDetailModal } from './appointment-detail-modal';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  title: string;
  eventColor?: string;
}

interface CalendarData {
  resources: Resource[];
  events: EventInput[];
}

interface CalendarViewProps {
  branchId: string | null;
}

export function CalendarView({ branchId }: CalendarViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useAuthStore();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [viewDates, setViewDates] = useState(() => {
    const start = new Date();
    const end = new Date();
    return { start, end };
  });

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentView = calendarApi.view;
      if (currentView.activeStart && currentView.activeEnd) {
        setViewDates({ start: currentView.activeStart, end: currentView.activeEnd });
      }
    }
  }, [branchId]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<CalendarData, Error>({
    queryKey: ['calendarData', branchId, viewDates.start.toISOString(), viewDates.end.toISOString()],
    queryFn: async () => {
      if (!branchId) return { resources: [], events: [] };

      const response = await api.get('/appointments/calendar', {
        params: {
          branchId,
          start: viewDates.start.toISOString(),
          end: viewDates.end.toISOString(),
        },
      });
      return response.data;
    },
    enabled: !!branchId,
    placeholderData: keepPreviousData,
  });

  const allStaff = useMemo(() => data?.resources || [], [data]);

  const filteredResources = useMemo(() => {
    if (selectedStaffIds.size === 0) {
      return allStaff;
    }
    return allStaff.filter((staff: Resource) => selectedStaffIds.has(staff.id));
  }, [allStaff, selectedStaffIds]);

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const handleDateClick = (arg: any) => {};

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { startStr, endStr, resource } = selectInfo;
    const staffId = resource?.id;
    router.push(
      `/dashboard/appointments/create?branchId=${branchId}&start=${encodeURIComponent(
        startStr,
      )}&end=${encodeURIComponent(endStr)}&staffId=${staffId || ''}`,
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedAppointment(clickInfo.event);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const { id, start, end } = event;
    const staffId = event.getResources()?.[0]?.id;

    if (!start || !end || !staffId) {
      toast({
        title: 'Hata',
        description: 'Randevu güncellenemedi. Gerekli bilgiler eksik.',
        variant: 'destructive',
      });
      dropInfo.revert();
      return;
    }

    try {
      await api.patch(`/appointments/${id}/reschedule`, {
        startTime: start,
        staffId: staffId,
      });
      toast({
        title: 'Başarılı',
        description: 'Randevu başarıyla yeniden zamanlandı.',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Randevu yeniden zamanlanırken bir hata oluştu.',
        variant: 'destructive',
      });
      dropInfo.revert();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 flex flex-wrap gap-4 justify-between items-center border-b">
        <h2 className="text-xl font-bold">Randevu Takvimi</h2>
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between" disabled={!branchId}>
                Personel Filtrele
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Personel ara..." />
                <CommandList>
                  <CommandEmpty>Personel bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {data?.resources.map((staff) => (
                      <CommandItem
                        key={staff.id}
                        value={staff.id} // Daha sağlam olması için değer olarak ID kullanıldı
                        onSelect={(currentValue) => {
                          // Seçili personel listesini güncelleme mantığı
                          const newSelected = new Set(selectedStaffIds);
                          if (newSelected.has(currentValue)) {
                            newSelected.delete(currentValue);
                          } else {
                            newSelected.add(currentValue);
                          }
                          setSelectedStaffIds(newSelected);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStaffIds.has(staff.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {staff.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedStaffIds.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setSelectedStaffIds(new Set())}
                          className="justify-center text-center"
                        >
                          Filtreyi Temizle
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button onClick={() => router.push(`/dashboard/appointments/create?branchId=${branchId}`)} disabled={!branchId}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Randevu
          </Button>
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAppointmentUpdate={() => refetch()}
        />
      )}

      <div className="p-4 relative min-h-[600px]">
        <div id="main-calendar" className={cn('transition-opacity', { 'opacity-50': isFetching && !!branchId })}>
          <FullCalendar
            ref={calendarRef}
            plugins={[resourceTimeGridPlugin, dayGridPlugin, interactionPlugin]}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            initialView="resourceTimeGridDay"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimeGridDay,timeGridWeek,dayGridMonth',
            }}
            resources={filteredResources}
            events={data?.events || []}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            selectable={true}
            selectMirror={true}
            navLinks={true}
            dateClick={handleDateClick}
            select={handleDateSelect}
            eventClick={handleEventClick}
            editable={true}
            eventDrop={handleEventDrop}
            locale="tr"
            datesSet={(arg) => {
              setViewDates({ start: arg.start, end: arg.end });
            }}
          />
        </div>
        
        {(isLoading || !branchId) && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex justify-center items-center rounded-lg">
             {!branchId ? (
               <p className="text-lg font-medium text-muted-foreground">Lütfen takvimi görüntülemek için bir şube seçin.</p>
             ) : (
               <CalendarSkeleton />
             )}
           </div>
        )}
      </div>
    </div>
  );
}
