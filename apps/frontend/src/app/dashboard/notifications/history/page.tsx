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
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  HomeIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface NotificationHistory {
  id: string;
  type: 'SMS' | 'WHATSAPP' | 'EMAIL';
  recipient: string;
  recipientName: string;
  subject?: string;
  content: string;
  status: 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  templateName: string;
  triggerName: string;
  branchName: string;
  cost?: number;
}

const mockHistory: NotificationHistory[] = [
  {
    id: '1',
    type: 'SMS',
    recipient: '+905551234567',
    recipientName: 'Ahmet Yılmaz',
    content: 'Merhaba Ahmet Yılmaz, 25.01.2024 tarihinde 14:00 saatinde randevunuz bulunmaktadır. Güzellik Salonu',
    status: 'DELIVERED',
    sentAt: '2024-01-24T14:00:00Z',
    deliveredAt: '2024-01-24T14:00:15Z',
    templateName: 'Randevu Hatırlatması',
    triggerName: 'Randevu Hatırlatması - 24 Saat Öncesi',
    branchName: 'Merkez Şube',
    cost: 0.05,
  },
  {
    id: '2',
    type: 'WHATSAPP',
    recipient: '+905559876543',
    recipientName: 'Fatma Demir',
    content: '🎉 Doğum gününüz kutlu olsun Fatma Demir! Size özel %20 indirim kodu: BIRTHDAY20',
    status: 'READ',
    sentAt: '2024-01-20T09:00:00Z',
    deliveredAt: '2024-01-20T09:00:10Z',
    readAt: '2024-01-20T09:15:30Z',
    templateName: 'Doğum Günü Kutlaması',
    triggerName: 'Doğum Günü Kutlaması',
    branchName: 'Kadıköy Şube',
    cost: 0.03,
  },
  {
    id: '3',
    type: 'EMAIL',
    recipient: 'mehmet@example.com',
    recipientName: 'Mehmet Kaya',
    subject: 'Güzellik Salonu ailesine hoş geldiniz!',
    content: 'Merhaba Mehmet Kaya,\n\nGüzellik Salonu ailesine katıldığınız için teşekkür ederiz...',
    status: 'SENT',
    sentAt: '2024-01-19T10:05:00Z',
    templateName: 'Hoş Geldin E-postası',
    triggerName: 'Hoş Geldin Mesajı',
    branchName: 'Merkez Şube',
    cost: 0.01,
  },
  {
    id: '4',
    type: 'SMS',
    recipient: '+905551111111',
    recipientName: 'Ayşe Öz',
    content: 'Paketinizin süresi 7 gün içinde dolacaktır. Yenileme için bizi arayın.',
    status: 'FAILED',
    sentAt: '2024-01-18T16:00:00Z',
    errorMessage: 'Geçersiz telefon numarası',
    templateName: 'Paket Süresi Dolumu',
    triggerName: 'Paket Süresi Dolumu Uyarısı',
    branchName: 'Beşiktaş Şube',
    cost: 0,
  },
  {
    id: '5',
    type: 'EMAIL',
    recipient: 'zeynep@example.com',
    recipientName: 'Zeynep Ak',
    subject: 'Randevu onayınız',
    content: 'Randevunuz başarıyla oluşturulmuştur.',
    status: 'DELIVERED',
    sentAt: '2024-01-17T11:30:00Z',
    deliveredAt: '2024-01-17T11:30:05Z',
    templateName: 'Randevu Onayı',
    triggerName: 'Randevu Onayı',
    branchName: 'Merkez Şube',
    cost: 0.01,
  },
];

const statusConfig = {
  SENT: {
    label: 'Gönderildi',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  DELIVERED: {
    label: 'Teslim Edildi',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  READ: {
    label: 'Okundu',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Başarısız',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

export default function NotificationHistoryPage() {
  const [history, setHistory] = useState<NotificationHistory[]>(mockHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [selectedNotification, setSelectedNotification] = useState<NotificationHistory | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredHistory = history.filter(notification => {
    const matchesSearch = 
      notification.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || notification.status === selectedStatus;
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    // Date range filter
    const now = new Date();
    const notificationDate = new Date(notification.sentAt);
    const daysDiff = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesDateRange = dateRange === 'all' || daysDiff <= parseInt(dateRange);
    
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

  const handleViewDetails = (notification: NotificationHistory) => {
    setSelectedNotification(notification);
    setIsDetailDialogOpen(true);
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    alert('Dışa aktarma özelliği yakında eklenecek');
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

  const getStats = () => {
    const stats = {
      total: history.length,
      sent: history.filter(n => n.status === 'SENT').length,
      delivered: history.filter(n => n.status === 'DELIVERED').length,
      read: history.filter(n => n.status === 'READ').length,
      failed: history.filter(n => n.status === 'FAILED').length,
      totalCost: history.reduce((sum, n) => sum + (n.cost || 0), 0),
      deliveryRate: history.length > 0 ? 
        ((history.filter(n => ['DELIVERED', 'READ'].includes(n.status)).length / history.length) * 100).toFixed(1) : '0',
      readRate: history.length > 0 ? 
        ((history.filter(n => n.status === 'READ').length / history.length) * 100).toFixed(1) : '0',
    };
    return stats;
  };

  const stats = getStats();

  // Mobile card component for notifications
  const NotificationCard = ({ notification }: { notification: NotificationHistory }) => {
    const statusInfo = statusConfig[notification.status];
    const StatusIcon = statusInfo.icon;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{notification.recipientName}</div>
              <div className="text-xs text-gray-500">{notification.recipient}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getTypeBadgeColor(notification.type)} variant="secondary">
                <div className="flex items-center space-x-1">
                  {getTypeIcon(notification.type)}
                  <span className="text-xs">{notification.type}</span>
                </div>
              </Badge>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            {notification.subject && (
              <div className="font-medium text-sm">{notification.subject}</div>
            )}
            <div className="text-sm text-gray-600 line-clamp-2">
              {notification.content}
            </div>
            <div className="text-xs text-gray-500">
              {notification.templateName}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <Badge className={statusInfo.color} variant="secondary">
                <div className="flex items-center space-x-1">
                  <StatusIcon className="h-3 w-3" />
                  <span className="text-xs">{statusInfo.label}</span>
                </div>
              </Badge>
              {notification.cost && (
                <span className="text-xs font-medium">₺{notification.cost.toFixed(3)}</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(notification.sentAt).toLocaleDateString('tr-TR')}
            </div>
          </div>

          {notification.errorMessage && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {notification.errorMessage}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
            <BreadcrumbLink>Geçmiş</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bildirim Geçmişi</h1>
            <p className="text-muted-foreground mt-1">
              Gönderilen bildirimlerin detaylı geçmişi ve istatistikleri
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* İstatistikler - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Gönderildi</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Teslim Edildi</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Eye className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Okundu</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.read}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Başarısız</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam Maliyet</p>
                <p className="text-lg sm:text-2xl font-bold">₺{stats.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performans Metrikleri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teslimat Oranı</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">%{stats.deliveryRate}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Okuma Oranı</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">%{stats.readRate}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler - Mobile Responsive */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Geçmiş ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="SENT">Gönderildi</SelectItem>
              <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
              <SelectItem value="READ">Okundu</SelectItem>
              <SelectItem value="FAILED">Başarısız</SelectItem>
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
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Tarih Aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Son 1 gün</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
              <SelectItem value="all">Tüm zamanlar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table / Mobile Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Geçmiş ({filteredHistory.length})</CardTitle>
          <CardDescription>
            Gönderilen bildirimlerin detaylı listesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>İçerik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Gönderim Tarihi</TableHead>
                  <TableHead>Teslimat</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((notification) => {
                  const statusInfo = statusConfig[notification.status];
                  const StatusIcon = statusInfo.icon;

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
                        <div className="text-sm">
                          {new Date(notification.sentAt).toLocaleString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.deliveredAt && (
                            <div className="text-green-600">
                              {new Date(notification.deliveredAt).toLocaleString('tr-TR')}
                            </div>
                          )}
                          {notification.readAt && (
                            <div className="text-blue-600 text-xs">
                              Okundu: {new Date(notification.readAt).toLocaleString('tr-TR')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {notification.cost ? `₺${notification.cost.toFixed(3)}` : '-'}
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {filteredHistory.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geçmiş bulunamadı</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all'
                  ? 'Arama kriterlerinize uygun geçmiş bulunamadı.'
                  : 'Henüz hiç bildirim gönderilmemiş.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay Dialog - Mobile Responsive */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bildirim Detayları</DialogTitle>
            <DialogDescription>
              Gönderilen bildirim hakkında detaylı bilgiler
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label className="text-sm font-medium text-gray-500">Maliyet</Label>
                  <p>{selectedNotification.cost ? `₺${selectedNotification.cost.toFixed(3)}` : 'Ücretsiz'}</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Gönderim Tarihi</Label>
                  <p>{new Date(selectedNotification.sentAt).toLocaleString('tr-TR')}</p>
                </div>
                {selectedNotification.deliveredAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Teslimat Tarihi</Label>
                    <p>{new Date(selectedNotification.deliveredAt).toLocaleString('tr-TR')}</p>
                  </div>
                )}
                {selectedNotification.readAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Okunma Tarihi</Label>
                    <p>{new Date(selectedNotification.readAt).toLocaleString('tr-TR')}</p>
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