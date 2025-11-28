require('dotenv').config();

const nodemailer = require('nodemailer');
const sendgridMail = require('@sendgrid/mail');

const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || (process.env.SENDGRID_API_KEY ? 'sendgrid' : 'smtp')).toLowerCase();
const ADMIN_EMAIL = process.env.MAIL_USER || 'shreyashmahagaon@gmail.com';

async function sendViaSmtp(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: (process.env.MAIL_SECURE === 'true') || false,
    auth: {
      user: process.env.MAIL_USER || ADMIN_EMAIL,
      pass: process.env.MAIL_PASSWORD
    }
  });

  try {
    await transporter.verify();
    console.log('SMTP transporter verified. Sending test email...');
    const info = await transporter.sendMail({ from: process.env.MAIL_FROM || ADMIN_EMAIL, to, subject, html });
    console.log('SMTP send success:', info && info.messageId ? info.messageId : info);
  } catch (err) {
    console.error('SMTP send failed:', err && err.message ? err.message : err);
    process.exitCode = 2;
  }
}

async function sendViaSendGrid(to, subject, html) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.error('SENDGRID_API_KEY not found in env.');
    process.exitCode = 2;
    return;
  }
  sendgridMail.setApiKey(key);
  try {
    const res = await sendgridMail.send({ to, from: process.env.MAIL_FROM || ADMIN_EMAIL, subject, html });
    console.log('SendGrid send invoked. Response length:', (res && res.length) ? res.length : 'unknown');
  } catch (err) {
    console.error('SendGrid send failed:', err && err.message ? err.message : err);
    if (err.response && err.response.body) console.error('SendGrid response body:', err.response.body);
    process.exitCode = 2;
  }
}

(async () => {
  const to = process.env.TEST_TO || process.env.MAIL_USER || 'recipient@example.com';
  const subject = 'EDUWISE Test Email';
  const html = '<p>This is a test email from EDUWISE test script.</p>';

  if (MAIL_PROVIDER === 'sendgrid') {
    console.log('Using SendGrid to send test email to', to);
    await sendViaSendGrid(to, subject, html);
  } else {
    console.log('Using SMTP to send test email to', to);
    await sendViaSmtp(to, subject, html);
  }
})();
