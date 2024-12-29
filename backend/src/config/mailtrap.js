import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

export const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: '"Videozon" <noreply@videozon.com>',
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Videozon!</h1>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}; 