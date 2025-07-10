import { Injectable, Logger } from '@nestjs/common';

interface SmsConfig {
  provider: string;
  apiKey: string;
  apiSecret?: string;
  sender?: string;
  isEnabled: boolean;
}

interface SmsMessage {
  to: string;
  message: string;
  sender?: string;
}

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendSms(config: SmsConfig, message: SmsMessage): Promise<SmsResponse> {
    if (!config.isEnabled) {
      return {
        success: false,
        error: 'SMS service is disabled',
      };
    }

    try {
      switch (config.provider.toLowerCase()) {
        case 'netgsm':
          return await this.sendNetGsmSms(config, message);
        case 'iletimerkezi':
          return await this.sendIletimMerkeziSms(config, message);
        case 'twilio':
          return await this.sendTwilioSms(config, message);
        default:
          return {
            success: false,
            error: `Unsupported SMS provider: ${config.provider}`,
          };
      }
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendNetGsmSms(config: SmsConfig, message: SmsMessage): Promise<SmsResponse> {
    // NetGSM API implementation
    const url = 'https://api.netgsm.com.tr/sms/send/get';
    const params = new URLSearchParams({
      usercode: config.apiKey,
      password: config.apiSecret || '',
      gsmno: message.to,
      message: message.message,
      msgheader: config.sender || 'SALON',
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
    });

    const result = await response.text();
    
    if (result.startsWith('00')) {
      const messageId = result.split(' ')[1];
      return {
        success: true,
        messageId,
        cost: 0.05, // Approximate cost
      };
    } else {
      return {
        success: false,
        error: `NetGSM Error: ${result}`,
      };
    }
  }

  private async sendIletimMerkeziSms(config: SmsConfig, message: SmsMessage): Promise<SmsResponse> {
    // İletim Merkezi API implementation
    const url = 'https://api.iletimerkezi.com/v1/send-sms/get';
    const params = new URLSearchParams({
      username: config.apiKey,
      password: config.apiSecret || '',
      text: message.message,
      receipents: message.to,
      sender: config.sender || 'SALON',
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
    });

    const result = await response.json();
    
    if (result.status === 'success') {
      return {
        success: true,
        messageId: result.id,
        cost: 0.04, // Approximate cost
      };
    } else {
      return {
        success: false,
        error: `İletim Merkezi Error: ${result.message}`,
      };
    }
  }

  private async sendTwilioSms(config: SmsConfig, message: SmsMessage): Promise<SmsResponse> {
    // Twilio API implementation
    const accountSid = config.apiKey;
    const authToken = config.apiSecret;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: config.sender || '+1234567890',
      To: message.to,
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
        cost: parseFloat(result.price) || 0.10,
      };
    } else {
      return {
        success: false,
        error: `Twilio Error: ${result.message}`,
      };
    }
  }

  async validateConfig(config: SmsConfig): Promise<{ valid: boolean; error?: string }> {
    if (!config.provider) {
      return { valid: false, error: 'Provider is required' };
    }

    if (!config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    const supportedProviders = ['netgsm', 'iletimerkezi', 'twilio'];
    if (!supportedProviders.includes(config.provider.toLowerCase())) {
      return { 
        valid: false, 
        error: `Unsupported provider. Supported providers: ${supportedProviders.join(', ')}` 
      };
    }

    // Test the configuration with a dummy message
    try {
      const testMessage: SmsMessage = {
        to: '+905551234567', // Test number
        message: 'Test message - please ignore',
      };

      // Don't actually send, just validate the config format
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
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
    // Basic phone number validation
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}