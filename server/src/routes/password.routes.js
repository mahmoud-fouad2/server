const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const emailService = require('../services/email.service');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'إذا كان البريد موجودًا، سيتم إرسال رابط الاسترجاع' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry
      }
    });

    // Reset URL created when sending email; don't construct it here to avoid leaking

    // Send reset link via email (do not include the URL in the response)
    try {
      const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://app.faheemly.com';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      const emailSubject = 'Password Reset Request';
      const emailText = `A password reset was requested for your account. If you did not request this, ignore. Otherwise, open the link: ${resetUrl}`;
      const emailHtml = `<p>A password reset was requested for your account. If you did not request this, ignore.</p><p><a href="${resetUrl}">Click here to reset your password</a></p>`;

      await emailService.sendEmail({ to: email, subject: emailSubject, text: emailText, html: emailHtml });
    } catch (sendError) {
      const logger = require('../utils/logger');
      logger.warn('Failed to send password reset email', { error: sendError.message, email });
    }

    // Always return generic message (don't expose reset URL in response)
    res.json({ message: 'إذا كان البريد موجودًا، سيتم إرسال رابط الاسترجاع' });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'حدث خطأ في النظام' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'الرمز وكلمة المرور مطلوبان' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // Hash the token from URL
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'رمز غير صالح أو منتهي الصلاحية' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'حدث خطأ في النظام' });
  }
});

module.exports = router;
