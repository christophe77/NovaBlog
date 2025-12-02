import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    password: string;
  };
  from?: string;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'email.host',
            'email.port',
            'email.secure',
            'email.user',
            'email.password',
            'email.from',
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const host = settingsMap.get('email.host');
    const port = settingsMap.get('email.port');
    const secure = settingsMap.get('email.secure');
    const user = settingsMap.get('email.user');
    const password = settingsMap.get('email.password');
    const from = settingsMap.get('email.from');

    if (!host || !user || !password) {
      return null;
    }

    return {
      host: JSON.parse(host),
      port: port ? parseInt(JSON.parse(port), 10) : 587,
      secure: secure ? JSON.parse(secure) === true : false,
      auth: {
        user: JSON.parse(user),
        password: JSON.parse(password),
      },
      from: from ? JSON.parse(from) : JSON.parse(user),
    };
  } catch (error) {
    console.error('Error fetching email config:', error);
    return null;
  }
}

export class EmailService {
  private async getTransporter() {
    const config = await getEmailConfig();
    if (!config) {
      throw new Error('Email configuration is not set. Please configure email settings in admin.');
    }

    return nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      auth: config.auth,
    });
  }

  async sendContactEmail(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    try {
      const config = await getEmailConfig();
      if (!config) {
        throw new Error('Email configuration is not set');
      }

      // Get company email from settings
      const companyEmailSetting = await prisma.setting.findUnique({
        where: { key: 'company.email' },
      });

      const companyEmail = companyEmailSetting
        ? JSON.parse(companyEmailSetting.value)
        : config.from;

      const transporter = await this.getTransporter();

      await transporter.sendMail({
        from: config.from,
        to: companyEmail,
        replyTo: data.email,
        subject: data.subject || `Nouveau message de contact de ${data.name}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.subject ? `<p><strong>Sujet:</strong> ${data.subject}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${data.message.replace(/\n/g, '<br>')}</p>
        `,
        text: `
          Nouveau message de contact
          
          Nom: ${data.name}
          Email: ${data.email}
          ${data.subject ? `Sujet: ${data.subject}` : ''}
          
          Message:
          ${data.message}
        `,
      });
    } catch (error) {
      console.error('Error sending contact email:', error);
      throw error;
    }
  }

  async testEmail(): Promise<void> {
    const config = await getEmailConfig();
    if (!config) {
      throw new Error('Email configuration is not set');
    }

    const transporter = await this.getTransporter();

    await transporter.sendMail({
      from: config.from,
      to: config.from,
      subject: 'Test email - NovaBlog',
      html: '<p>Ceci est un email de test depuis NovaBlog.</p>',
      text: 'Ceci est un email de test depuis NovaBlog.',
    });
  }
}

export const emailService = new EmailService();

