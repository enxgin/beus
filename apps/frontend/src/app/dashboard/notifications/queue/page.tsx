'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Mail,
  Phone,
  RefreshCw,
  Filter,
  HomeIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface QueuedNotification {
  id: string;
  type: 'SMS' | 'WHATSAPP' | 'EMAIL';
  recipient: string;
  recipientName: string;
  subject?: string;
  content: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt: string;
  processedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  templateName: string;
  triggerName: string;
  branchName: string;
}

const mockQueuedNotifications: QueuedNotification[] = [
  {
    id: '1',
    type: 'SMS',
    recipient: '+905551234567',
    recipientName: 'Ahmet Yılmaz',
    content: 'Merhaba Ahmet Yılmaz, 25.01.2024 tarihinde 14:00 saatinde randevunuz bulunmaktadır. Güzellik Salonu',
    status: 'PENDING',
    priority: 'NORMAL',
    scheduledAt: '2024-01-24T14:00:00Z',
    retryCount: 0,
    maxRetries: 3,
    templateName: 'Randevu Hatırlatması',
    triggerName: 'Randevu Hatırlatması - 24 Saat Öncesi',
    branchName: 'Merkez Şube',
  },
  {
    id: '2',
    type: 'WHATSAPP',
    recipient: '+905559876543',
    recipientName: 'Fatma Demir',
    content: '🎉 Doğum gününüz kutlu olsun Fatma Demir! Size özel %20 indirim kodu: BIRTHDAY20',
    status: 'PROCESSING',
    priority: 'HIGH',
    scheduledAt: '2024-01-20T09:00:00Z',
    retryCount: 0,
    maxRetries: 3,
    templateName: 'Doğum Günü Kutlaması',
    triggerName: 'Doğum Günü Kutlaması',
    branchName: 'Kadıköy Şube',
  },
  {
    id: '3',
    type: 'EMAIL',
    recipient: 'mehmet@example.com',
    recipientName: 'Mehmet Kaya',
    subject: 'Güzellik Salonu ailesine hoş geldiniz!',
    content: 'Merhaba Mehmet Kaya,\n\nGüzellik Salonu ailesine katıldığınız için teşekkür ederiz...',
    status: 'SENT',
    priority: 'NORMAL',
    scheduledAt: '2024-01-19T10:05:00Z',
    processedAt: '2024-01-19T10:05:15Z',
    retryCount: 0,
    maxRetries: 3,
    templateName: 'Hoş Geldin E-postası',
    triggerName: 'Hoş Geldin Mesajı',
    branchName: 'Merkez Şube',
  },
  {
    id: '4',
    type: 'SMS',
    recipient: '+905551111111',
    recipientName: 'Ayşe Öz',
    content: 'Paketinizin süresi 7 gün içinde dolacaktır. Yenileme için bizi arayın.',
    status: 'FAILED',
    priority: 'URGENT',
    scheduledAt: '2024-01-18T16:00:00Z',
    processedAt: '2024-01-18T16:00:30Z',
    errorMessage: 'Geçersiz telefon numarası',
    retryCount: 3,
    maxRetries: 3,
    templateName: 'Paket Süresi Dolumu',
    triggerName: 'Paket Süresi Dolumu Uyarısı',
    branchName: 'Beşiktaş Şube',
  },
];

const statusConfig = {
  PENDING: {
    label: 'Bekliyor',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  PROCESSING: {
    label: 'İşleniyor',
    color: 'bg-blue-100 text-blue-800',
    icon: RefreshCw,
  },
  SENT: {
    label: 'Gönderildi',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Başarısız',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'İptal Edildi',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
};

const priorityConfig = {
  LOW: { label: 'Düşük', color: 'bg-gray-100 text-gray-800' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Yüksek', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Acil', color: 'bg-red-100 text-red-800' },
};

// Mobile Card Component
function QueueCard({ 
  notification, 
  onViewDetails, 
  onRetry, 
  onCancel, 
  onDelete,
  getTypeIcon,
  getTypeBadgeColor 
}: {
  notification: QueuedNotification;
  onViewDetails: (notification: QueuedNotification) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeBadgeColor: (type: string) => string;
}) {
  const statusInfo = statusConfig[notification.status];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[notification.priority];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{notification.recipientName}</h3>
              <p className="text-xs text-muted-foreground truncate">{notification.recipient}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(notification)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Detayları Görüntüle
                </DropdownMenuItem>
                {notification.status === 'FAILED' && notification.retryCount < notification.maxRetries && (
                  <DropdownMenuItem onClick={() => onRetry(notification.id)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Yeniden Dene
                  </DropdownMenuItem>
                )}
                {(notification.status === 'PENDING' || notification.status === 'PROCESSING') && (
                  <DropdownMenuItem onClick={() => onCancel(notification.id)}>
                    <Pause className="h-4 w-4 mr-2" />
                    İptal Et
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(notification.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getTypeBadgeColor(notification.type)}>
              <div className="flex items-center space-x-1">
                {getTypeIcon(notification.type)}
                <span>{notification.type}</span>
              </div>
            </Badge>
            <Badge className={statusInfo.color}>
              <div className="flex items-center space-x-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.label}</span>
              </div>
            </Badge>
            <Badge className={priorityInfo.color}>
              {priorityInfo.label}
            </Badge>
          </div>

          {/* Content */}
          <div className="space-y-2">
            {notification.subject && (
              <p className="font-medium text-sm">{notification.subject}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.content}
            </p>
            <p className="text-xs text-muted-foreground">
              {notification.templateName}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              <div>{new Date(notification.scheduledAt).toLocaleString('tr-TR')}</div>
              {notification.processedAt && (
                <div>İşlendi: {new Date(notification.processedAt).toLocaleString('tr-TR')}</div>
              )}
            </div>
            <div>
              Deneme: {notification.retryCount}/{notification.maxRetries}
            </div>
          </div>

          {/* Error Message */}
          {notification.errorMessage && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {notification.errorMessage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationQueuePage() {
  const [notifications, setNotifications] = useState<QueuedNotification[]>(mockQueuedNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<QueuedNotification | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || notification.status === selectedStatus;
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleRetry = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id && n.status === 'FAILED' 
        ? { ...n, status: 'PENDING', retryCount: n.retryCount + 1, errorMessage: undefined }
        : n
    ));
  };

  const handleCancel = (id: string) => {
    if (confirm('Bu bildirimi iptal etmek istediğinizden emin misiniz?')) {
      setNotifications(prev => prev.map(n => 
        n.id === id && (n.status === 'PENDING' || n.status === 'PROCESSING')
          ? { ...n, status: 'CANCELLED' }
          : n
      ));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleViewDetails = (notification: QueuedNotification) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS':
        return <Phone className="h-4 w-4" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SMS':
        return 'bg-blue-100 text-blue-800';
      case 'WHATSAPP':
        return 'bg-green-100 text-green-800';
      case 'EMAIL':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'PENDING').length,
      processing: notifications.filter(n => n.status === 'PROCESSING').length,
      sent: notifications.filter(n => n.status === 'SENT').length,
      failed: notifications.filter(n => n.status === 'FAILED').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-4 md:space-y-6">
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
            <BreadcrumbLink>Kuyruk</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bildirim Kuyruğu</h1>
            <p className="text-muted-foreground mt-1">
              Bekleyen ve işlenen bildirimleri görüntüleyin
            </p>
          </div>
          <Button variant="outline" className="w-fit">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* İstatistikler - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Toplam</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Bekliyor</p>
                <p className="text-lg md:text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">İşleniyor</p>
                <p className="text-lg md:text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Gönderildi</p>
                <p className="text-lg md:text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-3 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600">Başarısız</p>
                <p className="text-lg md:text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler - Responsive Layout */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Bildirim ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="PENDING">Bekliyor</SelectItem>
              <SelectItem value="PROCESSING">İşleniyor</SelectItem>
              <SelectItem value="SENT">Gönderildi</SelectItem>
              <SelectItem value="FAILED">Başarısız</SelectItem>
              <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="EMAIL">E-posta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Öncelik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="LOW">Düşük</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">Yüksek</SelectItem>
              <SelectItem value="URGENT">Acil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table - Hidden on Mobile */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Kuyruk ({filteredNotifications.length})</CardTitle>
          <CardDescription>
            Bekleyen ve işlenen bildirimlerin listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alıcı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>İçerik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Zamanlama</TableHead>
                <TableHead>Deneme</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => {
                const statusInfo = statusConfig[notification.status];
                const StatusIcon = statusInfo.icon;
                const priorityInfo = priorityConfig[notification.priority];

                return (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.recipientName}</div>
                        <div className="text-sm text-gray-500">{notification.recipient}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(notification.type)}>
                        <div className="flex items-center space-x-1">
                          {getTypeIcon(notification.type)}
                          <span>{notification.type}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {notification.subject && (
                          <div className="font-medium text-sm mb-1">{notification.subject}</div>
                        )}
                        <div className="text-sm text-gray-600 truncate">
                          {notification.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {notification.templateName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </Badge>
                      {notification.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          {notification.errorMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityInfo.color}>
                        {priorityInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {new Date(notification.scheduledAt).toLocaleString('tr-TR')}
                        </div>
                        {notification.processedAt && (
                          <div className="text-gray-500 text-xs">
                            İşlendi: {new Date(notification.processedAt).toLocaleString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {notification.retryCount}/{notification.maxRetries}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(notification)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detayları Görüntüle
                          </DropdownMenuItem>
                          {notification.status === 'FAILED' && notification.retryCount < notification.maxRetries && (
                            <DropdownMenuItem onClick={() => handleRetry(notification.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Yeniden Dene
                            </DropdownMenuItem>
                          )}
                          {(notification.status === 'PENDING' || notification.status === 'PROCESSING') && (
                            <DropdownMenuItem onClick={() => handleCancel(notification.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              İptal Et
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(notification.id)}
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

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bildirim bulunamadı</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || selectedPriority !== 'all'
                  ? 'Arama kriterlerinize uygun bildirim bulunamadı.'
                  : 'Kuyrukta bekleyen bildirim bulunmuyor.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards - Visible on Mobile */}
      <div className="md:hidden space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <QueueCard
              key={notification.id}
              notification={notification}
              onViewDetails={handleViewDetails}
              onRetry={handleRetry}
              onCancel={handleCancel}
              onDelete={handleDelete}
              getTypeIcon={getTypeIcon}
              getTypeBadgeColor={getTypeBadgeColor}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bildirim bulunamadı</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || selectedPriority !== 'all'
                ? 'Arama kriterlerinize uygun bildirim bulunamadı.'
                : 'Kuyrukta bekleyen bildirim bulunmuyor.'}
            </p>
          </div>
        )}
      </div>

      {/* Detay Dialog - Mobile Responsive */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bildirim Detayları</DialogTitle>
            <DialogDescription>
              Bildirim hakkında detaylı bilgiler
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Alıcı</Label>
                  <p className="font-medium">{selectedNotification.recipientName}</p>
                  <p className="text-sm text-gray-600">{selectedNotification.recipient}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tür</Label>
                  <Badge className={getTypeBadgeColor(selectedNotification.type)}>
                    <div className="flex items-center space-x-1">
                      {getTypeIcon(selectedNotification.type)}
                      <span>{selectedNotification.type}</span>
                    </div>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Durum</Label>
                  <Badge className={statusConfig[selectedNotification.status].color}>
                    {statusConfig[selectedNotification.status].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Öncelik</Label>
                  <Badge className={priorityConfig[selectedNotification.priority].color}>
                    {priorityConfig[selectedNotification.priority].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Şablon</Label>
                  <p>{selectedNotification.templateName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tetikleyici</Label>
                  <p>{selectedNotification.triggerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Şube</Label>
                  <p>{selectedNotification.branchName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Deneme Sayısı</Label>
                  <p>{selectedNotification.retryCount}/{selectedNotification.maxRetries}</p>
                </div>
              </div>

              {selectedNotification.subject && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Konu</Label>
                  <p className="mt-1">{selectedNotification.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">İçerik</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedNotification.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Zamanlandığı Tarih</Label>
                  <p>{new Date(selectedNotification.scheduledAt).toLocaleString('tr-TR')}</p>
                </div>
                {selectedNotification.processedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">İşlendiği Tarih</Label>
                    <p>{new Date(selectedNotification.processedAt).toLocaleString('tr-TR')}</p>
                  </div>
                )}
              </div>

              {selectedNotification.errorMessage && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Hata Mesajı</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{selectedNotification.errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}