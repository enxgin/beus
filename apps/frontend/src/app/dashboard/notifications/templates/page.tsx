'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Save,
  X,
  HomeIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'SMS' | 'WHATSAPP' | 'EMAIL';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Randevu Hatırlatması',
    type: 'SMS',
    content: 'Merhaba {{customerName}}, {{appointmentDate}} tarihinde {{appointmentTime}} saatinde randevunuz bulunmaktadır. {{branchName}}',
    variables: ['customerName', 'appointmentDate', 'appointmentTime', 'branchName'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Doğum Günü Kutlaması',
    type: 'WHATSAPP',
    content: '🎉 Doğum gününüz kutlu olsun {{customerName}}! Size özel %20 indirim kodu: {{discountCode}}',
    variables: ['customerName', 'discountCode'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Hoş Geldin E-postası',
    type: 'EMAIL',
    subject: '{{branchName}} ailesine hoş geldiniz!',
    content: 'Merhaba {{customerName}},\n\n{{branchName}} ailesine katıldığınız için teşekkür ederiz. Size en iyi hizmeti sunmak için buradayız.\n\nSaygılarımızla,\n{{branchName}} Ekibi',
    variables: ['customerName', 'branchName'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const availableVariables = [
  { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
  { key: 'customerPhone', label: 'Müşteri Telefonu', description: 'Müşterinin telefon numarası' },
  { key: 'customerEmail', label: 'Müşteri E-postası', description: 'Müşterinin e-posta adresi' },
  { key: 'branchName', label: 'Şube Adı', description: 'Şubenin adı' },
  { key: 'branchPhone', label: 'Şube Telefonu', description: 'Şubenin telefon numarası' },
  { key: 'branchAddress', label: 'Şube Adresi', description: 'Şubenin adresi' },
  { key: 'appointmentDate', label: 'Randevu Tarihi', description: 'Randevu tarihi (DD.MM.YYYY)' },
  { key: 'appointmentTime', label: 'Randevu Saati', description: 'Randevu saati (HH:MM)' },
  { key: 'serviceName', label: 'Hizmet Adı', description: 'Alınan hizmetin adı' },
  { key: 'staffName', label: 'Personel Adı', description: 'Hizmeti veren personelin adı' },
  { key: 'packageName', label: 'Paket Adı', description: 'Satın alınan paketin adı' },
  { key: 'packageExpiry', label: 'Paket Bitiş Tarihi', description: 'Paketin bitiş tarihi' },
  { key: 'discountCode', label: 'İndirim Kodu', description: 'Özel indirim kodu' },
  { key: 'totalAmount', label: 'Toplam Tutar', description: 'Ödeme tutarı' },
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SMS' as 'SMS' | 'WHATSAPP' | 'EMAIL',
    subject: '',
    content: '',
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreate = () => {
    const newTemplate: NotificationTemplate = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      variables: extractVariables(formData.content),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTemplates(prev => [...prev, newTemplate]);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;

    const updatedTemplate: NotificationTemplate = {
      ...selectedTemplate,
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      variables: extractVariables(formData.content),
      updatedAt: new Date().toISOString(),
    };

    setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
    setIsEditDialogOpen(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDuplicate = (template: NotificationTemplate) => {
    const duplicatedTemplate: NotificationTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Kopya)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'SMS',
      subject: '',
      content: '',
    });
  };

  const openEditDialog = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
    });
    setIsEditDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const variableTag = `{{${variable}}}`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + variableTag,
    }));
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
        return <FileText className="h-4 w-4" />;
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
            <BreadcrumbLink>Şablonlar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bildirim Şablonları</h1>
            <p className="text-muted-foreground mt-1">
              SMS, WhatsApp ve E-posta şablonlarını yönetin
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Şablon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir bildirim şablonu oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Şablon Adı</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Şablon adını girin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Bildirim Türü</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'SMS' | 'WHATSAPP' | 'EMAIL') =>
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'EMAIL' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">E-posta Konusu</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="E-posta konusunu girin"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">İçerik</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Şablon içeriğini girin"
                    rows={8}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Kullanılabilir Değişkenler</Label>
                  <p className="text-xs text-gray-500 mb-3">
                    Değişkenleri tıklayarak içeriğe ekleyin
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableVariables.map((variable) => (
                      <div
                        key={variable.key}
                        className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => insertVariable(variable.key)}
                      >
                        <div className="font-medium text-sm">{variable.label}</div>
                        <div className="text-xs text-gray-500">{variable.description}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {`{{${variable.key}}}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.content}>
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
            placeholder="Şablon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tür filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="SMS">SMS</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="EMAIL">E-posta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Şablonlar ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Mevcut bildirim şablonlarını görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şablon</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>İçerik Önizleme</TableHead>
                <TableHead>Değişkenler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son Güncelleme</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="font-medium">{template.name}</div>
                    {template.subject && (
                      <div className="text-sm text-gray-500">Konu: {template.subject}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(template.type)}>
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(template.type)}
                        <span>{template.type}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-gray-600">
                      {template.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
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
                        <DropdownMenuItem onClick={() => openEditDialog(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Kopyala
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Şablon bulunamadı</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedType !== 'all'
                  ? 'Arama kriterlerinize uygun şablon bulunamadı.'
                  : 'Henüz hiç şablon oluşturulmamış.'}
              </p>
              {!searchTerm && selectedType === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Şablonunuzu Oluşturun
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Şablonu Düzenle</DialogTitle>
            <DialogDescription>
              Mevcut şablonu düzenleyin
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Şablon Adı</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Şablon adını girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Bildirim Türü</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'SMS' | 'WHATSAPP' | 'EMAIL') =>
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">E-posta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'EMAIL' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">E-posta Konusu</Label>
                  <Input
                    id="edit-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="E-posta konusunu girin"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-content">İçerik</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Şablon içeriğini girin"
                  rows={8}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Kullanılabilir Değişkenler</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Değişkenleri tıklayarak içeriğe ekleyin
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableVariables.map((variable) => (
                    <div
                      key={variable.key}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => insertVariable(variable.key)}
                    >
                      <div className="font-medium text-sm">{variable.label}</div>
                      <div className="text-xs text-gray-500">{variable.description}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {`{{${variable.key}}}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || !formData.content}>
              <Save className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}