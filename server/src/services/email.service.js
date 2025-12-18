import logger from '../utils/logger.js';

let transporter = null;
async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule?.default || nodemailerModule;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      // If SMTP is not configured, create a logger-only stub
      logger.warn('SMTP not fully configured. Emails will only be logged.');
      transporter = {
        sendMail: async (options) => {
          logger.info('Email send (stub)', { to: options.to, subject: options.subject });
          return { accepted: [options.to], messageId: 'stubbing' };
        }
      };
      return transporter;
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: smtpPort === '465',
      auth: { user: smtpUser, pass: smtpPass }
    });
    return transporter;
  } catch (e) {
    logger.warn('nodemailer not installed; email service will be a no-op', { error: e.message });
    transporter = {
      sendMail: async (options) => {
        logger.info('Email send (no-op)', { to: options.to, subject: options.subject });
        return { accepted: [options.to], messageId: 'noop' };
      }
    };
    return transporter;
  }
}

async function sendEmail({ to, subject, text, html }) {
  try {
    const tx = await getTransporter();
    const message = {
      from: process.env.EMAIL_FROM || `no-reply@${process.env.FRONTEND_DOMAIN || 'faheemly.com'}`,
      to,
      subject,
      text,
      html
    };
    const result = await tx.sendMail(message);
    logger.debug('Email service sent message', { to, subject, messageId: result.messageId });
    return result;
  } catch (error) {
    logger.error('Failed to send email', { error });
    throw error;
  }
}

export { sendEmail };
