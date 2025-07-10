import { Injectable, Logger } from '@nestjs/common';

interface WhatsAppConfig {
  provider: string;
  apiKey: string;
  phoneNumberId?: string;
  accessToken?: string;
  webhookToken?: string;
  isEnabled: boolean;
}

interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  async sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!config.isEnabled) {
      return {
        success: false,
        error: 'WhatsApp service is disabled',
      };
    }

    try {
      switch (config.provider.toLowerCase()) {
        case 'meta':
        case 'facebook':
          return await this.sendMetaWhatsApp(config, message);
        case 'twilio':
          return await this.sendTwilioWhatsApp(config, message);
        case 'whatsapp-business':
          return await this.sendWhatsAppBusiness(config, message);
        default:
          return {
            success: false,
            error: `Unsupported WhatsApp provider: ${config.provider}`,
          };
      }
    } catch (error) {
      this.logger.error(`WhatsApp sending failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendMetaWhatsApp(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Meta WhatsApp Business API implementation
    const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
    
    const payload: any = {
      messaging_product: 'whatsapp',
      to: message.to,
    };

    if (message.type === 'template' && message.templateName) {
      payload.type = 'template';
      payload.template = {
        name: message.templateName,
        language: { code: 'tr' },
      };
      
      if (message.templateParams && message.templateParams.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: message.templateParams.map(param => ({
              type: 'text',
              text: param,
            })),
          },
        ];
      }
    } else {
      payload.type = 'text';
      payload.text = { body: message.message };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok && result.messages) {
      return {
        success: true,
        messageId: result.messages[0].id,
        cost: 0.05, // Approximate cost
      };
    } else {
      return {
        success: false,
        error: `Meta WhatsApp Error: ${result.error?.message || 'Unknown error'}`,
      };
    }
  }

  private async sendTwilioWhatsApp(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Twilio WhatsApp API implementation
    const accountSid = config.apiKey;
    const authToken = config.accessToken;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: `whatsapp:${config.phoneNumberId}`,
      To: `whatsapp:${message.to}`,
      Body: message.message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        messageId: result.sid,
        cost: parseFloat(result.price) || 0.08,
      };
    } else {
      return {
        success: false,
        error: `Twilio WhatsApp Error: ${result.message}`,
      };
    }
  }

  private async sendWhatsAppBusiness(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Generic WhatsApp Business API implementation
    const url = 'https://api.whatsapp.com/send';
    
    // This is a simplified implementation
    // In a real scenario, you would use the official WhatsApp Business API
    const payload = {
      phone: message.to,
      text: message.message,
      apikey: config.apiKey,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        messageId: result.id,
        cost: 0.06,
      };
    } else {
      return {
        success: false,
        error: `WhatsApp Business Error: ${result.message || 'Unknown error'}`,
      };
    }
  }

  async validateConfig(config: WhatsAppConfig): Promise<{ valid: boolean; error?: string }> {
    if (!config.provider) {
      return { valid: false, error: 'Provider is required' };
    }

    if (!config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    const supportedProviders = ['meta', 'facebook', 'twilio', 'whatsapp-business'];
    if (!supportedProviders.includes(config.provider.toLowerCase())) {
      return { 
        valid: false, 
        error: `Unsupported provider. Supported providers: ${supportedProviders.join(', ')}` 
      };
    }

    // Provider-specific validation
    switch (config.provider.toLowerCase()) {
      case 'meta':
      case 'facebook':
        if (!config.phoneNumberId) {
          return { valid: false, error: 'Phone Number ID is required for Meta WhatsApp' };
        }
        if (!config.accessToken) {
          return { valid: false, error: 'Access Token is required for Meta WhatsApp' };
        }
        break;
      
      case 'twilio':
        if (!config.accessToken) {
          return { valid: false, error: 'Auth Token is required for Twilio WhatsApp' };
        }
        if (!config.phoneNumberId) {
          return { valid: false, error: 'WhatsApp Phone Number is required for Twilio' };
        }
        break;
    }

    return { valid: true };
  }

  formatPhoneNumber(phone: string, countryCode: string = '+90'): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Turkish phone numbers
    if (countryCode === '+90') {
      if (cleaned.startsWith('90')) {
        cleaned = cleaned.substring(2);
      }
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      if (cleaned.length === 10) {
        return `+90${cleaned}`;
      }
    }
    
    // For other countries, assume the number is already in correct format
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation for WhatsApp
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  async createTemplate(config: WhatsAppConfig, template: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }): Promise<{ success: boolean; templateId?: string; error?: string }> {
    if (config.provider.toLowerCase() === 'meta' || config.provider.toLowerCase() === 'facebook') {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/message_templates`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });

        const result = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            templateId: result.id,
          };
        } else {
          return {
            success: false,
            error: `Template creation failed: ${result.error?.message || 'Unknown error'}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: 'Template creation not supported for this provider',
    };
  }

  async getTemplates(config: WhatsAppConfig): Promise<{ success: boolean; templates?: any[]; error?: string }> {
    if (config.provider.toLowerCase() === 'meta' || config.provider.toLowerCase() === 'facebook') {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/message_templates`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
        });

        const result = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            templates: result.data,
          };
        } else {
          return {
            success: false,
            error: `Failed to fetch templates: ${result.error?.message || 'Unknown error'}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: 'Template fetching not supported for this provider',
    };
  }
}