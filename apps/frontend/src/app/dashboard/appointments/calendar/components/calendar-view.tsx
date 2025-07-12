'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
import { Check, ChevronsUpDown, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import './calendar-styles.css';

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
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set(['all']));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [viewDates, setViewDates] = useState(() => {
    const start = new Date();
    const end = new Date();
    return { start, end };
  });
  
  // Takvim başlığı için state
  const [calendarTitle, setCalendarTitle] = useState<string>('');
  
  // Aktif görünüm türü için state
  const [activeView, setActiveView] = useState<string>('resourceTimeGridDay');

  // Sütun çizgilerini ekleyen fonksiyon
  const addColumnBorders = useCallback(() => {
    const calendarEl = document.querySelector('#main-calendar');
    if (!calendarEl) return;

    // Önceki çizgileri temizle
    const existingBorders = calendarEl.querySelectorAll('.custom-column-border');
    existingBorders.forEach(border => border.remove());

    // Sadece gün ve hafta görünümlerinde çizgi ekle
    if (!['resourceTimeGridDay', 'timeGridWeek'].includes(activeView)) return;

    // Ana sütun container'ını bul
    const colsTable = calendarEl.querySelector('.fc-timegrid-cols table');
    if (!colsTable) return;

    // Personel sütunlarını bul
    const resourceCols = colsTable.querySelectorAll('.fc-timegrid-col');
    if (resourceCols.length <= 1) return;

    // Her sütun için (son hariç) sağ kenarına çizgi ekle
    resourceCols.forEach((col, index) => {
      if (index < resourceCols.length - 1) {
        const colRect = col.getBoundingClientRect();
        const tableRect = colsTable.getBoundingClientRect();
        
        // Çizgi elementi oluştur
        const border = document.createElement('div');
        border.className = 'custom-column-border';
        border.style.cssText = `
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 1px;
          background-color: hsl(var(--border));
          z-index: 10;
          pointer-events: none;
        `;
        
        // Sütuna çizgiyi ekle
        const colFrame = col.querySelector('.fc-timegrid-col-frame') as HTMLElement;
        if (colFrame) {
          colFrame.style.position = 'relative';
          colFrame.appendChild(border);
        }
      }
    });
  }, [activeView]);

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
    if (selectedStaffIds.has('all')) {
      return allStaff;
    }
    return allStaff.filter((staff: Resource) => selectedStaffIds.has(staff.id));
  }, [allStaff, selectedStaffIds]);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      
      // Handle 'all' option
      if (staffId === 'all') {
        if (newSet.has('all')) {
          newSet.delete('all');
        } else {
          newSet.clear();
          newSet.add('all');
        }
        return newSet;
      }
      
      // Remove 'all' when selecting specific staff
      if (newSet.has('all')) {
        newSet.delete('all');
      }
      
      // Toggle the selected staff
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
        // If no staff selected, select 'all'
        if (newSet.size === 0) {
          newSet.add('all');
        }
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

  // Randevu detaylarını getiren sorgu
  const { data: appointmentDetail, refetch: refetchAppointmentDetail } = useQuery({
    queryKey: ['appointmentDetail', selectedAppointment?.id],
    queryFn: async () => {
      if (!selectedAppointment?.id) return null;
      const response = await api.get(`/appointments/${selectedAppointment.id}`);
      return response.data;
    },
    enabled: !!selectedAppointment?.id,
  });

  // Randevu tıklandığında detayları getir
  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointmentId = clickInfo.event.id;
    setSelectedAppointment({ id: appointmentId });
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
    <div className="bg-card rounded-lg shadow-md border">
      <div className="p-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-start sm:items-center border-b bg-card">
        <h2 className="text-xl font-bold">Randevu Takvimi</h2>
        <div className="flex flex-wrap w-full sm:w-auto gap-2 mt-2 sm:mt-0">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[160px] md:w-[200px] justify-between text-sm" disabled={!branchId}>
                Personel Filtrele
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput 
                  placeholder="Personel ara..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandGroup>
                    {/* Tümü seçeneği */}
                    <div 
                      key="all" 
                      className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground font-medium"
                      onClick={() => handleStaffSelection('all')}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStaffIds.has('all') ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Tümü
                    </div>
                  </CommandGroup>
                  
                  <CommandSeparator />
                  
                  <CommandGroup>
                    {data?.resources
                      .filter(staff => staff.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((staff) => (
                        <div 
                          key={staff.id} 
                          className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleStaffSelection(staff.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStaffIds.has(staff.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {staff.title}
                        </div>
                      ))}
                    {data?.resources && 
                     searchQuery && 
                     !data.resources.some(staff => staff.title.toLowerCase().includes(searchQuery.toLowerCase())) && (
                      <div className="py-6 text-center text-sm text-muted-foreground">Personel bulunamadı.</div>
                    )}
                  </CommandGroup>
                  {selectedStaffIds.size > 0 && !selectedStaffIds.has('all') && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <div
                          onClick={() => setSelectedStaffIds(new Set(['all']))}
                          className="flex items-center justify-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-center"
                        >
                          Filtreyi Temizle
                        </div>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button 
            onClick={() => router.push(`/dashboard/appointments/create?branchId=${branchId}`)} 
            disabled={!branchId}
            className="w-full sm:w-auto text-sm"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            Yeni Randevu
          </Button>
        </div>
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={appointmentDetail || {}}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
          onAppointmentUpdate={() => {
            refetch();
            refetchAppointmentDetail();
          }}
        />
      )}

      <div className="p-4 relative min-h-[600px] bg-card">
        <div id="main-calendar" className={cn('shadcn-calendar-container transition-opacity', { 'opacity-50': isFetching && !!branchId })}>
          {/* Özel takvim kontrolleri - mobil için optimize edilmiş */}
          <div className="mb-4 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            {/* Takvim başlığı - mobilde üst kısımda */}
            <div className="text-sm font-medium text-center sm:hidden">
              {calendarTitle || 'Takvim'}
            </div>
            
            {/* Navigasyon kontrolleri ve görünüm seçicileri */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:w-full">
              {/* Navigasyon butonları */}
              <div className="flex justify-between sm:justify-start items-center sm:flex-none">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => calendarRef.current?.getApi().prev()}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => calendarRef.current?.getApi().next()}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => calendarRef.current?.getApi().today()}
                    className="text-xs h-8 px-2"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    Bugün
                  </Button>
                </div>
                
                {/* Takvim başlığı - masaüstünde ortada */}
                <div className="hidden sm:block text-base font-semibold mx-4 flex-1 text-center">
                  {calendarTitle || 'Takvim'}
                </div>
              </div>
              
              {/* Görünüm seçicileri */}
              <div className="grid grid-cols-3 gap-1 sm:flex sm:gap-2 sm:ml-auto">
                <Button 
                  variant={activeView === 'resourceTimeGridDay' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    calendarRef.current?.getApi().changeView('resourceTimeGridDay');
                    setActiveView('resourceTimeGridDay');
                  }}
                  className="text-xs h-8 px-1 sm:px-3"
                >
                  Gün
                </Button>
                <Button 
                  variant={activeView === 'timeGridWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    calendarRef.current?.getApi().changeView('timeGridWeek');
                    setActiveView('timeGridWeek');
                  }}
                  className="text-xs h-8 px-1 sm:px-3"
                >
                  Hafta
                </Button>
                <Button 
                  variant={activeView === 'dayGridMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    calendarRef.current?.getApi().changeView('dayGridMonth');
                    setActiveView('dayGridMonth');
                  }}
                  className="text-xs h-8 px-1 sm:px-3"
                >
                  Ay
                </Button>
              </div>
            </div>
          </div>
          
          <FullCalendar
            ref={calendarRef}
            plugins={[resourceTimeGridPlugin, dayGridPlugin, interactionPlugin]}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            initialView="resourceTimeGridDay"
            // Kendi özel kontrollerimizi kullandığımız için orijinal butonları gizliyoruz
            headerToolbar={false}
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
              setCalendarTitle(arg.view.title);
              setActiveView(arg.view.type);
            }}
            viewDidMount={() => {
              // Takvim render olduktan sonra sütun çizgilerini ekle
              setTimeout(addColumnBorders, 100);
            }}
            eventDidMount={() => {
              // Event'ler render olduktan sonra sütun çizgilerini ekle
              setTimeout(addColumnBorders, 50);
            }}
          />
        </div>
        
        {(isLoading || !branchId) && (
           <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex justify-center items-center rounded-lg">
             {!branchId ? (
               <p className="text-lg font-medium text-muted-foreground">Lütfen takvimi görüntülemek için bir şube seçin.</p>
             ) : (
               <div className="w-full h-full p-4">
                 <CalendarSkeleton />
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
}
