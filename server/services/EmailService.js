// server/services/EmailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendPasswordResetEmail({ to, name, resetURL }) {
    const mailOptions = {
      from: `CityFix <${process.env.SMTP_FROM}>`,
      to,
      subject: 'Password Reset Request - CityFix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">CityFix</h1>
          </div>
          <div style="padding: 30px; background: #f7f7f7;">
            <h2>Hello ${name},</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
            © 2024 CityFix. All rights reserved.
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordChangedEmail({ to, name }) {
    const mailOptions = {
      from: `CityFix <${process.env.SMTP_FROM}>`,
      to,
      subject: 'Password Changed Successfully - CityFix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">CityFix</h1>
          </div>
          <div style="padding: 30px; background: #f7f7f7;">
            <h2>Hello ${name},</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact our support immediately.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login.html" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
            </div>
          </div>
          <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
            © 2024 CityFix. All rights reserved.
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();