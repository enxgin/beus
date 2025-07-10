'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Zap,
  Clock,
  Calendar,
  Gift,
  CreditCard,
  UserPlus,
  Settings,
  Save,
  Play,
  Pause,
  HomeIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface NotificationTrigger {
  id: string;
  name: string;
  eventType: string;
  templateId: string;
  templateName: string;
  conditions: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

const mockTriggers: NotificationTrigger[] = [
  {
    id: '1',
    name: 'Randevu Hatırlatması - 24 Saat Öncesi',
    eventType: 'APPOINTMENT_REMINDER',
    templateId: '1',
    templateName: 'Randevu Hatırlatması',
    conditions: { reminderHours: 24 },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lastTriggered: '2024-01-20T09:00:00Z',
    triggerCount: 45,
  },
  {
    id: '2',
    name: 'Doğum Günü Kutlaması',
    eventType: 'BIRTHDAY',
    templateId: '2',
    templateName: 'Doğum Günü Kutlaması',
    conditions: { sendTime: '09:00' },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lastTriggered: '2024-01-18T09:00:00Z',
    triggerCount: 12,
  },
  {
    id: '3',
    name: 'Paket Süresi Dolumu Uyarısı',
    eventType: 'PACKAGE_EXPIRY',
    templateId: '3',
    templateName: 'Paket Süresi Dolumu',
    conditions: { expiryDays: 7 },
    isActive: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    triggerCount: 8,
  },
];

const eventTypes = [
  {
    value: 'APPOINTMENT_REMINDER',
    label: 'Randevu Hatırlatması',
    icon: Clock,
    description: 'Randevu öncesi hatırlatma gönder',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'APPOINTMENT_CONFIRMATION',
    label: 'Randevu Onayı',
    icon: Calendar,
    description: 'Randevu oluşturulduğunda onay gönder',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: 'BIRTHDAY',
    label: 'Doğum Günü',
    icon: Gift,
    description: 'Müşteri doğum günlerinde kutlama gönder',
    color: 'bg-pink-100 text-pink-800',
  },
  {
    value: 'PACKAGE_EXPIRY',
    label: 'Paket Süresi Dolumu',
    icon: Clock,
    description: 'Paket süresi dolmadan önce uyarı gönder',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'PAYMENT_REMINDER',
    label: 'Ödeme Hatırlatması',
    icon: CreditCard,
    description: 'Ödeme tarihi yaklaştığında hatırlatma gönder',
    color: 'bg-red-100 text-red-800',
  },
  {
    value: 'WELCOME_MESSAGE',
    label: 'Hoş Geldin Mesajı',
    icon: UserPlus,
    description: 'Yeni müşteri kaydında hoş geldin mesajı gönder',
    color: 'bg-purple-100 text-purple-800',
  },
];

const mockTemplates = [
  { id: '1', name: 'Randevu Hatırlatması', type: 'SMS' },
  { id: '2', name: 'Doğum Günü Kutlaması', type: 'WHATSAPP' },
  { id: '3', name: 'Paket Süresi Dolumu', type: 'EMAIL' },
  { id: '4', name: 'Hoş Geldin E-postası', type: 'EMAIL' },
];

export default function NotificationTriggersPage() {
  const [triggers, setTriggers] = useState<NotificationTrigger[]>(mockTriggers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<NotificationTrigger | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    eventType: '',
    templateId: '',
    conditions: {} as any,
  });

  const filteredTriggers = triggers.filter(trigger => {
    const matchesSearch = trigger.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEventType = selectedEventType === 'all' || trigger.eventType === selectedEventType;
    return matchesSearch && matchesEventType;
  });

  const handleCreate = () => {
    const selectedTemplate = mockTemplates.find(t => t.id === formData.templateId);
    const newTrigger: NotificationTrigger = {
      id: Date.now().toString(),
      name: formData.name,
      eventType: formData.eventType,
      templateId: formData.templateId,
      templateName: selectedTemplate?.name || '',
      conditions: formData.conditions,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
    };

    setTriggers(prev => [...prev, newTrigger]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedTrigger) return;

    const selectedTemplate = mockTemplates.find(t => t.id === formData.templateId);
    const updatedTrigger: NotificationTrigger = {
      ...selectedTrigger,
      name: formData.name,
      eventType: formData.eventType,
      templateId: formData.templateId,
      templateName: selectedTemplate?.name || '',
      conditions: formData.conditions,
      updatedAt: new Date().toISOString(),
    };

    setTriggers(prev => prev.map(t => t.id === selectedTrigger.id ? updatedTrigger : t));
    setIsEditDialogOpen(false);
    setSelectedTrigger(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu tetikleyiciyi silmek istediğinizden emin misiniz?')) {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setTriggers(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    ));
  };

  const handleDuplicate = (trigger: NotificationTrigger) => {
    const duplicatedTrigger: NotificationTrigger = {
      ...trigger,
      id: Date.now().toString(),
      name: `${trigger.name} (Kopya)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      triggerCount: 0,
      lastTriggered: undefined,
    };

    setTriggers(prev => [...prev, duplicatedTrigger]);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      eventType: '',
      templateId: '',
      conditions: {},
    });
  };

  const openEditDialog = (trigger: NotificationTrigger) => {
    setSelectedTrigger(trigger);
    setFormData({
      name: trigger.name,
      eventType: trigger.eventType,
      templateId: trigger.templateId,
      conditions: trigger.conditions,
    });
    setIsEditDialogOpen(true);
  };

  const getEventTypeInfo = (eventType: string) => {
    return eventTypes.find(et => et.value === eventType);
  };

  const renderConditionFields = (eventType: string, conditions: any, onChange: (updates: any) => void) => {
    switch (eventType) {
      case 'APPOINTMENT_REMINDER':
        return (
          <div className="space-y-2">
            <Label>Kaç saat önceden hatırlat</Label>
            <Input
              type="number"
              min="1"
              max="168"
              value={conditions.reminderHours || 24}
              onChange={(e) => onChange({ reminderHours: parseInt(e.target.value) })}
            />
          </div>
        );
      case 'BIRTHDAY':
        return (
          <div className="space-y-2">
            <Label>Gönderim saati</Label>
            <Input
              type="time"
              value={conditions.sendTime || '09:00'}
              onChange={(e) => onChange({ sendTime: e.target.value })}
            />
          </div>
        );
      case 'PACKAGE_EXPIRY':
        return (
          <div className="space-y-2">
            <Label>Kaç gün önceden uyar</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={conditions.expiryDays || 7}
              onChange={(e) => onChange({ expiryDays: parseInt(e.target.value) })}
            />
          </div>
        );
      case 'PAYMENT_REMINDER':
        return (
          <div className="space-y-2">
            <Label>Kaç gün önceden hatırlat</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={conditions.reminderDays || 3}
              onChange={(e) => onChange({ reminderDays: parseInt(e.target.value) })}
            />
          </div>
        );
      case 'WELCOME_MESSAGE':
        return (
          <div className="space-y-2">
            <Label>Kaç dakika sonra gönder</Label>
            <Input
              type="number"
              min="0"
              max="1440"
              value={conditions.delayMinutes || 5}
              onChange={(e) => onChange({ delayMinutes: parseInt(e.target.value) })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <HomeIcon className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/notifications">Bildirimler</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Tetikleyiciler</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bildirim Tetikleyicileri</h1>
            <p className="text-muted-foreground mt-1">
              Otomatik bildirim kurallarını yönetin
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Tetikleyici
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Tetikleyici Oluştur</DialogTitle>
              <DialogDescription>
                Otomatik bildirim tetikleyicisi oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tetikleyici Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tetikleyici adını girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Olay Türü</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value, conditions: {} }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Olay türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((eventType) => (
                      <SelectItem key={eventType.value} value={eventType.value}>
                        <div className="flex items-center space-x-2">
                          <eventType.icon className="h-4 w-4" />
                          <span>{eventType.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.eventType && (
                  <p className="text-sm text-gray-500">
                    {getEventTypeInfo(formData.eventType)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateId">Bildirim Şablonu</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şablon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <span>{template.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.eventType && (
                <div className="space-y-2">
                  <Label>Koşullar</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {renderConditionFields(
                      formData.eventType,
                      formData.conditions,
                      (updates) => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, ...updates } }))
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!formData.name || !formData.eventType || !formData.templateId}
              >
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tetikleyici ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedEventType} onValueChange={setSelectedEventType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Olay türü filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Olaylar</SelectItem>
            {eventTypes.map((eventType) => (
              <SelectItem key={eventType.value} value={eventType.value}>
                {eventType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tetikleyiciler ({filteredTriggers.length})</CardTitle>
          <CardDescription>
            Mevcut bildirim tetikleyicilerini görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tetikleyici</TableHead>
                <TableHead>Olay Türü</TableHead>
                <TableHead>Şablon</TableHead>
                <TableHead>Koşullar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İstatistikler</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTriggers.map((trigger) => {
                const eventTypeInfo = getEventTypeInfo(trigger.eventType);
                const EventIcon = eventTypeInfo?.icon || Zap;

                return (
                  <TableRow key={trigger.id}>
                    <TableCell>
                      <div className="font-medium">{trigger.name}</div>
                      <div className="text-sm text-gray-500">
                        Son güncelleme: {new Date(trigger.updatedAt).toLocaleDateString('tr-TR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={eventTypeInfo?.color}>
                        <div className="flex items-center space-x-1">
                          <EventIcon className="h-3 w-3" />
                          <span>{eventTypeInfo?.label}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{trigger.templateName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {trigger.eventType === 'APPOINTMENT_REMINDER' && 
                          `${trigger.conditions.reminderHours} saat öncesi`}
                        {trigger.eventType === 'BIRTHDAY' && 
                          `Saat ${trigger.conditions.sendTime}`}
                        {trigger.eventType === 'PACKAGE_EXPIRY' && 
                          `${trigger.conditions.expiryDays} gün öncesi`}
                        {trigger.eventType === 'PAYMENT_REMINDER' && 
                          `${trigger.conditions.reminderDays} gün öncesi`}
                        {trigger.eventType === 'WELCOME_MESSAGE' && 
                          `${trigger.conditions.delayMinutes} dakika sonra`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={trigger.isActive}
                          onCheckedChange={() => handleToggleActive(trigger.id)}
                        />
                        <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                          {trigger.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{trigger.triggerCount} tetikleme</div>
                        {trigger.lastTriggered && (
                          <div className="text-gray-500">
                            Son: {new Date(trigger.lastTriggered).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(trigger)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(trigger.id)}>
                            {trigger.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Duraklat
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Aktifleştir
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(trigger)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(trigger.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredTriggers.length === 0 && (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tetikleyici bulunamadı</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedEventType !== 'all'
                  ? 'Arama kriterlerinize uygun tetikleyici bulunamadı.'
                  : 'Henüz hiç tetikleyici oluşturulmamış.'}
              </p>
              {!searchTerm && selectedEventType === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Tetikleyicinizi Oluşturun
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tetikleyiciyi Düzenle</DialogTitle>
            <DialogDescription>
              Mevcut tetikleyiciyi düzenleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tetikleyici Adı</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Tetikleyici adını girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-eventType">Olay Türü</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value, conditions: {} }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Olay türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((eventType) => (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      <div className="flex items-center space-x-2">
                        <eventType.icon className="h-4 w-4" />
                        <span>{eventType.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-templateId">Bildirim Şablonu</Label>
              <Select
                value={formData.templateId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {mockTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{template.type}</Badge>
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.eventType && (
              <div className="space-y-2">
                <Label>Koşullar</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {renderConditionFields(
                    formData.eventType,
                    formData.conditions,
                    (updates) => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, ...updates } }))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={!formData.name || !formData.eventType || !formData.templateId}
            >
              <Save className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}