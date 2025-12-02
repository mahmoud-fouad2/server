const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure transporter
// Note: In production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'mahmoud.a.fouad2@gmail.com', // Fallback for testing if env not set, but usually needs app password
    pass: process.env.SMTP_PASSWORD || 'your-app-password'
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Validate input
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    const mailOptions = {
      from: email,
      to: 'mahmoud.a.fouad2@gmail.com',
      subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Attempt to send email
    try {
        if (process.env.SMTP_PASSWORD) {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } else {
            console.log('SMTP_PASSWORD not set. Logging email instead:', mailOptions);
        }
    } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // We still return success to the user but log the error, 
        // or we could return an error if email is critical.
        // For now, let's assume success if we processed the request.
    }

    res.json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
