'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Mail,
  Phone,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  RefreshCw,
  HomeIcon,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ProviderConfig {
  [key: string]: any;
}

interface NotificationSettings {
  id?: string;
  branchId: string;
  isActive: boolean;
  smsConfig: ProviderConfig;
  whatsappConfig: ProviderConfig;
  emailConfig: ProviderConfig;
  generalSettings: {
    businessHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    retrySettings: {
      maxRetries: number;
      retryDelay: number;
    };
    rateLimiting: {
      enabled: boolean;
      smsPerHour: number;
      whatsappPerHour: number;
      emailPerHour: number;
    };
  };
}

const smsProviders = [
  {
    value: 'netgsm',
    label: 'NetGSM',
    fields: [
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'header', label: 'Başlık', type: 'text', required: false },
    ],
  },
  {
    value: 'iletimerkezi',
    label: 'İletim Merkezi',
    fields: [
      { key: 'apiKey', label: 'API Anahtarı', type: 'text', required: true },
      { key: 'apiSecret', label: 'API Gizli Anahtarı', type: 'password', required: true },
      { key: 'sender', label: 'Gönderici', type: 'text', required: false },
    ],
  },
  {
    value: 'twilio',
    label: 'Twilio',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Telefon Numarası', type: 'text', required: true },
    ],
  },
];

const whatsappProviders = [
  {
    value: 'meta',
    label: 'Meta WhatsApp Business',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'webhookToken', label: 'Webhook Token', type: 'password', required: false },
    ],
  },
  {
    value: 'twilio',
    label: 'Twilio WhatsApp',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'WhatsApp Numarası', type: 'text', required: true },
    ],
  },
];

const emailProviders = [
  {
    value: 'smtp',
    label: 'SMTP',
    fields: [
      { key: 'host', label: 'SMTP Sunucusu', type: 'text', required: true },
      { key: 'port', label: 'Port', type: 'number', required: true, default: 587 },
      { key: 'secure', label: 'Güvenli Bağlantı', type: 'boolean', required: false, default: false },
      { key: 'username', label: 'Kullanıcı Adı', type: 'text', required: true },
      { key: 'password', label: 'Şifre', type: 'password', required: true },
      { key: 'fromEmail', label: 'Gönderen E-posta', type: 'email', required: true },
      { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
    ],
  },
  {
    value: 'gmail',
    label: 'Gmail',
    fields: [
      { key: 'username', label: 'Gmail Adresi', type: 'email', required: true },
      { key: 'password', label: 'Uygulama Şifresi', type: 'password', required: true },
      { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
    ],
  },
  {
    value: 'sendgrid',
    label: 'SendGrid',
    fields: [
      { key: 'apiKey', label: 'API Anahtarı', type: 'password', required: true },
      { key: 'fromEmail', label: 'Gönderen E-posta', type: 'email', required: true },
      { key: 'fromName', label: 'Gönderen Adı', type: 'text', required: false },
    ],
  },
];

export default function NotificationSettingsPage() {
  const toast = (options: { title: string; description: string; variant?: string }) => {
    // Simple toast implementation - can be replaced with actual toast library
    alert(`${options.title}: ${options.description}`);
  };
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const [settings, setSettings] = useState<NotificationSettings>({
    branchId: '',
    isActive: true,
    smsConfig: { provider: '', enabled: false },
    whatsappConfig: { provider: '', enabled: false },
    emailConfig: { provider: '', enabled: false },
    generalSettings: {
      businessHours: {
        enabled: true,
        start: '09:00',
        end: '18:00',
      },
      retrySettings: {
        maxRetries: 3,
        retryDelay: 300,
      },
      rateLimiting: {
        enabled: true,
        smsPerHour: 100,
        whatsappPerHour: 50,
        emailPerHour: 200,
      },
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast({
        title: 'Başarılı',
        description: 'Bildirim ayarları kaydedildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ayarlar kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (type: 'sms' | 'whatsapp' | 'email') => {
    setTesting(prev => ({ ...prev, [type]: true }));
    try {
      // API call to test configuration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      toast({
        title: 'Test Başarılı',
        description: `${type.toUpperCase()} konfigürasyonu test edildi.`,
      });
    } catch (error) {
      toast({
        title: 'Test Başarısız',
        description: `${type.toUpperCase()} konfigürasyonu test edilemedi.`,
        variant: 'destructive',
      });
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  const renderProviderFields = (provider: any, config: ProviderConfig, onUpdate: (updates: any) => void) => {
    if (!provider) return null;

    return (
      <div className="space-y-4">
        {provider.fields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'boolean' ? (
              <Switch
                id={field.key}
                checked={config[field.key] || field.default || false}
                onCheckedChange={(checked) => onUpdate({ [field.key]: checked })}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type}
                value={config[field.key] || ''}
                onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                placeholder={field.default?.toString()}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

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
            <BreadcrumbLink>Ayarlar</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bildirim Ayarları</h1>
            <p className="text-muted-foreground mt-1">
              SMS, WhatsApp ve E-posta bildirim ayarlarını yapılandırın
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={settings.isActive ? 'default' : 'secondary'}>
              {settings.isActive ? 'Aktif' : 'Pasif'}
            </Badge>
            <Button onClick={handleSave} disabled={loading} className="w-fit">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sms" className="space-y-4 md:space-y-6">
        {/* Mobile-Responsive Tabs */}
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="sms" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <Phone className="h-4 w-4" />
            <span className="text-xs sm:text-sm">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs sm:text-sm">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3">
            <Mail className="h-4 w-4" />
            <span className="text-xs sm:text-sm">E-posta</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 col-span-2 md:col-span-1">
            <Settings className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Genel</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>SMS Ayarları</span>
                  </CardTitle>
                  <CardDescription>
                    SMS gönderimi için sağlayıcı ayarlarını yapılandırın
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={settings.smsConfig.enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        smsConfig: { ...prev.smsConfig, enabled: checked }
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('sms')}
                    disabled={!settings.smsConfig.enabled || testing.sms}
                  >
                    {testing.sms ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Test Et
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>SMS Sağlayıcısı</Label>
                <Select
                  value={settings.smsConfig.provider}
                  onValueChange={(value) =>
                    setSettings(prev => ({
                      ...prev,
                      smsConfig: { ...prev.smsConfig, provider: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sağlayıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {smsProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.smsConfig.provider && (
                <>
                  <Separator />
                  {renderProviderFields(
                    smsProviders.find(p => p.value === settings.smsConfig.provider),
                    settings.smsConfig,
                    (updates) => setSettings(prev => ({
                      ...prev,
                      smsConfig: { ...prev.smsConfig, ...updates }
                    }))
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>WhatsApp Ayarları</span>
                  </CardTitle>
                  <CardDescription>
                    WhatsApp gönderimi için sağlayıcı ayarlarını yapılandırın
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={settings.whatsappConfig.enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        whatsappConfig: { ...prev.whatsappConfig, enabled: checked }
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('whatsapp')}
                    disabled={!settings.whatsappConfig.enabled || testing.whatsapp}
                  >
                    {testing.whatsapp ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Test Et
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>WhatsApp Sağlayıcısı</Label>
                <Select
                  value={settings.whatsappConfig.provider}
                  onValueChange={(value) =>
                    setSettings(prev => ({
                      ...prev,
                      whatsappConfig: { ...prev.whatsappConfig, provider: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sağlayıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.whatsappConfig.provider && (
                <>
                  <Separator />
                  {renderProviderFields(
                    whatsappProviders.find(p => p.value === settings.whatsappConfig.provider),
                    settings.whatsappConfig,
                    (updates) => setSettings(prev => ({
                      ...prev,
                      whatsappConfig: { ...prev.whatsappConfig, ...updates }
                    }))
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>E-posta Ayarları</span>
                  </CardTitle>
                  <CardDescription>
                    E-posta gönderimi için sağlayıcı ayarlarını yapılandırın
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={settings.emailConfig.enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        emailConfig: { ...prev.emailConfig, enabled: checked }
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('email')}
                    disabled={!settings.emailConfig.enabled || testing.email}
                  >
                    {testing.email ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Test Et
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>E-posta Sağlayıcısı</Label>
                <Select
                  value={settings.emailConfig.provider}
                  onValueChange={(value) =>
                    setSettings(prev => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, provider: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sağlayıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.emailConfig.provider && (
                <>
                  <Separator />
                  {renderProviderFields(
                    emailProviders.find(p => p.value === settings.emailConfig.provider),
                    settings.emailConfig,
                    (updates) => setSettings(prev => ({
                      ...prev,
                      emailConfig: { ...prev.emailConfig, ...updates }
                    }))
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Genel Ayarlar</CardTitle>
                <CardDescription>
                  Bildirim sistemi için genel ayarları yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <Label className="text-base">Sistem Durumu</Label>
                      <p className="text-sm text-gray-500">
                        Bildirim sistemini aktif/pasif yapın
                      </p>
                    </div>
                    <Switch
                      checked={settings.isActive}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, isActive: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <Label className="text-base">Çalışma Saatleri</Label>
                        <p className="text-sm text-gray-500">
                          Bildirimlerin gönderileceği saatleri belirleyin
                        </p>
                      </div>
                      <Switch
                        checked={settings.generalSettings.businessHours.enabled}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            generalSettings: {
                              ...prev.generalSettings,
                              businessHours: {
                                ...prev.generalSettings.businessHours,
                                enabled: checked
                              }
                            }
                          }))
                        }
                      />
                    </div>

                    {settings.generalSettings.businessHours.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Başlangıç Saati</Label>
                          <Input
                            type="time"
                            value={settings.generalSettings.businessHours.start}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                generalSettings: {
                                  ...prev.generalSettings,
                                  businessHours: {
                                    ...prev.generalSettings.businessHours,
                                    start: e.target.value
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bitiş Saati</Label>
                          <Input
                            type="time"
                            value={settings.generalSettings.businessHours.end}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                generalSettings: {
                                  ...prev.generalSettings,
                                  businessHours: {
                                    ...prev.generalSettings.businessHours,
                                    end: e.target.value
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base">Yeniden Deneme Ayarları</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Maksimum Deneme</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.generalSettings.retrySettings.maxRetries}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              generalSettings: {
                                ...prev.generalSettings,
                                retrySettings: {
                                  ...prev.generalSettings.retrySettings,
                                  maxRetries: parseInt(e.target.value)
                                }
                              }
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bekleme Süresi (saniye)</Label>
                        <Input
                          type="number"
                          min="60"
                          max="3600"
                          value={settings.generalSettings.retrySettings.retryDelay}
                          onChange={(e) =>
                            setSettings(prev => ({
                              ...prev,
                              generalSettings: {
                                ...prev.generalSettings,
                                retrySettings: {
                                  ...prev.generalSettings.retrySettings,
                                  retryDelay: parseInt(e.target.value)
                                }
                              }
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <Label className="text-base">Hız Sınırlaması</Label>
                        <p className="text-sm text-gray-500">
                          Saatlik gönderim limitlerini belirleyin
                        </p>
                      </div>
                      <Switch
                        checked={settings.generalSettings.rateLimiting.enabled}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            generalSettings: {
                              ...prev.generalSettings,
                              rateLimiting: {
                                ...prev.generalSettings.rateLimiting,
                                enabled: checked
                              }
                            }
                          }))
                        }
                      />
                    </div>

                    {settings.generalSettings.rateLimiting.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>SMS/Saat</Label>
                          <Input
                            type="number"
                            min="1"
                            value={settings.generalSettings.rateLimiting.smsPerHour}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                generalSettings: {
                                  ...prev.generalSettings,
                                  rateLimiting: {
                                    ...prev.generalSettings.rateLimiting,
                                    smsPerHour: parseInt(e.target.value)
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>WhatsApp/Saat</Label>
                          <Input
                            type="number"
                            min="1"
                            value={settings.generalSettings.rateLimiting.whatsappPerHour}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                generalSettings: {
                                  ...prev.generalSettings,
                                  rateLimiting: {
                                    ...prev.generalSettings.rateLimiting,
                                    whatsappPerHour: parseInt(e.target.value)
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>E-posta/Saat</Label>
                          <Input
                            type="number"
                            min="1"
                            value={settings.generalSettings.rateLimiting.emailPerHour}
                            onChange={(e) =>
                              setSettings(prev => ({
                                ...prev,
                                generalSettings: {
                                  ...prev.generalSettings,
                                  rateLimiting: {
                                    ...prev.generalSettings.rateLimiting,
                                    emailPerHour: parseInt(e.target.value)
                                  }
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
                