import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config()

// Get directory name in ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP connection error:', error);
  } else {
    logger.info('SMTP server is ready to send emails');
  }
});

// Email templates
const TEMPLATES = {
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'resetPassword',
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'orderConfirmation',
  MESSAGE_NOTIFICATION: 'messageNotification',
  PASSWORD_CHANGED: 'passwordChanged'
};

// Ensure templates directory exists
const templatesDir = join(process.cwd(), 'src/templates/emails');
if (!existsSync(templatesDir)) {
  mkdirSync(templatesDir, { recursive: true });
}

// Load and compile email template with better error handling
const loadTemplate = (templateName) => {
  try {
    const templatePath = join(templatesDir, `${templateName}.hbs`);
    if (!existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templateName}.hbs`);
    }
    const template = readFileSync(templatePath, 'utf-8');
    return handlebars.compile(template);
  } catch (error) {
    logger.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template error: ${error.message}`);
  }
};

/**
 * Send email using template
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name from TEMPLATES
 * @param {Object} options.context - Template variables
 */
export const sendEmail = async ({ to, subject, template, context }) => {
  try {
    // Compile template
    const compiledTemplate = loadTemplate(template);
    const html = compiledTemplate({
      ...context,
      year: new Date().getFullYear(),
      companyName: 'Videozon',
      supportEmail: 'support@videozon.com'
    });

    // Send email
    const mailOptions = {
      from: `"Videozon" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    // Read the email template
    const templatePath = join(__dirname, '../templates/emails/verification.hbs');
    const emailTemplate = readFileSync(templatePath, 'utf-8');
    
    // Compile the template
    const template = handlebars.compile(emailTemplate);
    
    // Create verification URL - now using the correct format
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    // Prepare template data
    const data = {
      verificationUrl,
      frontendUrl: process.env.FRONTEND_URL,
      logoUrl: `${process.env.FRONTEND_URL}/logo.png`,
      year: new Date().getFullYear()
    };
    
    // Generate HTML
    const html = template(data);

    // Send email
    await transporter.sendMail({
      from: '"Videozon" <noreply@videozon.com>',
      to: email,
      subject: 'Verify your Videozon account',
      html
    });

    console.log('Verification email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    template: TEMPLATES.RESET_PASSWORD,
    context: {
      resetUrl,
      validityPeriod: '1 hour'
    }
  });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to Videozon!',
    template: TEMPLATES.WELCOME,
    context: {
      name,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (email, order) => {
  await sendEmail({
    to: email,
    subject: 'Order Confirmation',
    template: TEMPLATES.ORDER_CONFIRMATION,
    context: {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      amount: order.amount,
      service: order.service,
      orderUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`
    }
  });
};

/**
 * Send new message notification
 */
export const sendMessageNotification = async (email, sender, conversationId) => {
  await sendEmail({
    to: email,
    subject: 'New Message Received',
    template: TEMPLATES.MESSAGE_NOTIFICATION,
    context: {
      senderName: sender.name,
      messageUrl: `${process.env.FRONTEND_URL}/messages/${conversationId}`
    }
  });
};

// Export constants
export { TEMPLATES }; 