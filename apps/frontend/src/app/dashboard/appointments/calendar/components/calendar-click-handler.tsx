'use client';

import { useEffect, useRef } from 'react';

interface CalendarClickHandlerProps {
  calendarElementId: string;
  branchId: string;
}

/**
 * Bu bileşen, FullCalendar'ın tıklama olaylarını doğrudan DOM üzerinden yönetir.
 * Next.js ve FullCalendar arasındaki olası uyumsuzlukları aşmak için kullanılır.
 */
export function CalendarClickHandler({ calendarElementId, branchId }: CalendarClickHandlerProps) {
  const initialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Tıklama işleyicisini ekleyen fonksiyon
    const setupClickHandlers = () => {
      const calendarElement = document.getElementById(calendarElementId);
      if (!calendarElement) {
        console.log('DEBUG - Takvim elementi henüz yüklenmedi, tekrar denenecek');
        return false; // Element bulunamadı, tekrar dene
      }

      console.log('DEBUG - Takvim elementi bulundu, tıklama işleyicileri ayarlanıyor');
      
      // Takvime genel bir tıklama olayı ekle (event delegation)
      calendarElement.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        console.log('DEBUG - Takvimde tıklama algılandı:', target);

        // Eğer bir butona, mevcut bir etkinliğe veya linke tıklandıysa, işlemi durdur.
        // Bu, takvimin kendi navigasyonunun ve etkinlik tıklamalarının çalışmasına izin verir.
        if (target.closest('.fc-button, .fc-event, a')) {
          console.log('DEBUG - İnteraktif element tıklandı, yönlendirme iptal edildi.');
          return;
        }
        
        // Tıklanan element veya üst elementlerinden biri bir hücre mi kontrol et
        let currentElement: HTMLElement | null = target;
        let dateAttr = null;
        
        // Tıklanan elementten başlayarak yukarı doğru git ve data-date veya data-time özelliği ara
        let timeAttr = null;
        let resourceId = null;
        
        while (currentElement && currentElement !== calendarElement) {
          // Tarih bilgisini kontrol et
          if (currentElement.hasAttribute('data-date')) {
            dateAttr = currentElement.getAttribute('data-date');
          }
          
          // Saat bilgisini kontrol et
          if (currentElement.hasAttribute('data-time')) {
            timeAttr = currentElement.getAttribute('data-time');
          }
          
          // Kaynak (personel) bilgisini kontrol et
          if (currentElement.hasAttribute('data-resource-id')) {
            resourceId = currentElement.getAttribute('data-resource-id');
          }
          
          // Eğer hem tarih hem saat bulunduysa döngüyü bitir
          if (dateAttr && timeAttr) {
            break;
          }
          
          currentElement = currentElement.parentElement;
        }
        
        // Eğer tarih bulunamadıysa, bugünün tarihini kullan
        if (!dateAttr) {
          const today = new Date();
          dateAttr = today.toISOString().split('T')[0]; // YYYY-MM-DD formatı
          console.log('DEBUG - Tarih bulunamadı, bugünün tarihi kullanılıyor:', dateAttr);
        }
        
        // Eğer tarih bulunduysa, randevu oluşturma sayfasına yönlendir
        if (dateAttr) {
          console.log('DEBUG - Tarih bulundu:', dateAttr, 'Saat:', timeAttr || 'belirsiz');
          
          // URL parametrelerini oluştur
          const params = new URLSearchParams();
          params.append('branchId', branchId);
          
          // Eğer hem tarih hem saat varsa, tam datetime olarak gönder
          if (timeAttr) {
            const dateTime = `${dateAttr}T${timeAttr}`;
            params.append('start', dateTime);
            console.log('DEBUG - Tam tarih ve saat:', dateTime);
          } else {
            // Sadece tarih varsa
            params.append('date', dateAttr);
          }
          
          // Personel ID'si varsa ekle
          if (resourceId) {
            params.append('staffId', resourceId);
            console.log('DEBUG - Personel ID:', resourceId);
          }
          
          const url = `/dashboard/appointments/create?${params.toString()}`;
          console.log('DEBUG - Yönlendirilen URL:', url);
          
          // Yönlendirme işlemi
          event.preventDefault();
          event.stopPropagation();
          window.location.href = url;
        }
      });
      
      // Ayrıca manuel olarak tüm hücrelere tıklama olayı ekle
      const addClickToSlots = () => {
        const slots = calendarElement.querySelectorAll('.fc-timegrid-slot, .fc-daygrid-day, .fc-col-header-cell');
        console.log(`DEBUG - ${slots.length} adet takvim hücresi bulundu`);
        
        slots.forEach(slot => {
          if (!(slot as HTMLElement).dataset.clickHandlerAdded) {
            (slot as HTMLElement).dataset.clickHandlerAdded = 'true';
            slot.addEventListener('click', (e) => {
              const element = e.currentTarget as HTMLElement;
              const dateAttr = element.getAttribute('data-date');
              const timeAttr = element.getAttribute('data-time');
              const resourceId = element.getAttribute('data-resource-id');
              
              // Eğer tarih yoksa ancak saat varsa, bugünün tarihini kullan
              let finalDateAttr = dateAttr;
              if (!finalDateAttr && timeAttr) {
                const today = new Date();
                finalDateAttr = today.toISOString().split('T')[0];
                console.log('DEBUG - Hücre tıklamasında tarih bulunamadı, bugünün tarihi kullanılıyor:', finalDateAttr);
              }
              
              if (finalDateAttr) {
                console.log('DEBUG - Hücre tıklaması:', finalDateAttr, 'Saat:', timeAttr || 'belirsiz');
                e.preventDefault();
                e.stopPropagation();
                
                // URL parametrelerini oluştur
                const params = new URLSearchParams();
                params.append('branchId', branchId);
                
                // Eğer hem tarih hem saat varsa, tam datetime olarak gönder
                if (timeAttr) {
                  const dateTime = `${finalDateAttr}T${timeAttr}`;
                  params.append('start', dateTime);
                } else {
                  // Sadece tarih varsa
                  params.append('date', finalDateAttr);
                }
                
                // Personel ID'si varsa ekle
                if (resourceId) {
                  params.append('staffId', resourceId);
                }
                
                const url = `/dashboard/appointments/create?${params.toString()}`;
                console.log('DEBUG - Hücre tıklaması URL:', url);
                window.location.href = url;
              }
            });
          }
        });
      };
      
      // İlk çalıştırma
      addClickToSlots();
      
      // Görünüm değiştiğinde (gün/hafta/ay) yeni hücrelere de tıklama ekle
      const viewButtons = calendarElement.querySelectorAll('.fc-button');
      viewButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Görünüm değiştiğinde biraz bekle ve yeni hücrelere tıklama ekle
          setTimeout(addClickToSlots, 500);
        });
      });
      
      initialized.current = true;
      console.log('DEBUG - Takvim tıklama işleyicileri başarıyla ayarlandı');
      return true; // Başarıyla ayarlandı
    };

    // Takvim yüklenene kadar bekle ve tıklama işleyicilerini ayarlamayı dene
    if (!initialized.current) {
      // İlk deneme
      const success = setupClickHandlers();
      
      if (!success) {
        // Başarısız olduysa, takvim yüklenene kadar belirli aralıklarla tekrar dene
        intervalRef.current = setInterval(() => {
          const success = setupClickHandlers();
          if (success && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 500);
      }
    }

    // Temizleme işlemi
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [calendarElementId, branchId]);

  return null; // Bu bileşen görsel bir öğe render etmez
}
