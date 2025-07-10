import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rejectedRecipients?: string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporters: Map<string, nodemailer.Transporter> = new Map();

  async sendEmail(config: EmailConfig, message: EmailMessage): Promise<EmailResponse> {
    if (!config.isEnabled) {
      return {
        success: false,
        error: 'Email service is disabled',
      };
    }

    try {
      const transporter = await this.getTransporter(config);
      
      const mailOptions = {
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        rejectedRecipients: result.rejected,
      };
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
    const configKey = `${config.host}:${config.port}:${config.username}`;
    
    if (this.transporters.has(configKey)) {
      return this.transporters.get(configKey);
    }

    let transportConfig: any = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    };

    // Provider-specific configurations
    switch (config.provider.toLowerCase()) {
      case 'gmail':
        transportConfig = {
          service: 'gmail',
          auth: {
            user: config.username,
            pass: config.password,
          },
        };
        break;
      
      case 'outlook':
      case 'hotmail':
        transportConfig = {
          service: 'hotmail',
          auth: {
            user: config.username,
            pass: config.password,
          },
        };
        break;
      
      case 'yahoo':
        transportConfig = {
          service: 'yahoo',
          auth: {
            user: config.username,
            pass: config.password,
          },
        };
        break;
      
      case 'sendgrid':
        transportConfig = {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: config.password, // SendGrid API key
          },
        };
        break;
      
      case 'mailgun':
        transportConfig = {
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: config.username,
            pass: config.password,
          },
        };
        break;
      
      case 'ses':
        transportConfig = {
          host: 'email-smtp.us-east-1.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: config.username,
            pass: config.password,
          },
        };
        break;
    }

    const transporter = nodemailer.createTransport(transportConfig);
    this.transporters.set(configKey, transporter);
    
    return transporter;
  }

  async validateConfig(config: EmailConfig): Promise<{ valid: boolean; error?: string }> {
    if (!config.provider) {
      return { valid: false, error: 'Provider is required' };
    }

    if (!config.fromEmail) {
      return { valid: false, error: 'From email is required' };
    }

    if (!this.isValidEmail(config.fromEmail)) {
      return { valid: false, error: 'Invalid from email format' };
    }

    if (!config.username) {
      return { valid: false, error: 'Username is required' };
    }

    if (!config.password) {
      return { valid: false, error: 'Password is required' };
    }

    // For custom SMTP, validate host and port
    const customProviders = ['smtp', 'custom'];
    if (customProviders.includes(config.provider.toLowerCase())) {
      if (!config.host) {
        return { valid: false, error: 'SMTP host is required for custom provider' };
      }
      if (!config.port || config.port < 1 || config.port > 65535) {
        return { valid: false, error: 'Valid SMTP port is required for custom provider' };
      }
    }

    // Test connection
    try {
      const transporter = await this.getTransporter(config);
      await transporter.verify();
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `Connection test failed: ${error.message}` 
      };
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async sendBulkEmails(
    config: EmailConfig, 
    messages: EmailMessage[],
    batchSize: number = 10
  ): Promise<{
    success: boolean;
    results: EmailResponse[];
    totalSent: number;
    totalFailed: number;
  }> {
    const results: EmailResponse[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process emails in batches to avoid overwhelming the SMTP server
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.sendEmail(config, message));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        batchResults.forEach(result => {
          if (result.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < messages.length) {
          await this.delay(1000); // 1 second delay
        }
      } catch (error) {
        this.logger.error(`Batch email sending failed: ${error.message}`);
        // Add failed results for the entire batch
        batch.forEach(() => {
          results.push({
            success: false,
            error: error.message,
          });
          totalFailed++;
        });
      }
    }

    return {
      success: totalSent > 0,
      results,
      totalSent,
      totalFailed,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateHtmlTemplate(template: string, variables: Record<string, string>): string {
    let html = template;
    
    // Replace variables in the format {{variableName}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });
    
    return html;
  }

  generateTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async testConnection(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter(config);
      await transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cleanup transporters to prevent memory leaks
  clearTransporters(): void {
    this.transporters.forEach(transporter => {
      transporter.close();
    });
    this.transporters.clear();
  }

  // Get supported email providers
  getSupportedProviders(): string[] {
    return [
      'gmail',
      'outlook',
      'hotmail',
      'yahoo',
      'sendgrid',
      'mailgun',
      'ses',
      'smtp',
      'custom',
    ];
  }

  // Get default port for secure/non-secure connections
  getDefaultPort(secure: boolean): number {
    return secure ? 465 : 587;
  }

  // Validate email list
  validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach(email => {
      if (this.isValidEmail(email.trim())) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
      }
    });

    return { valid, invalid };
  }
}