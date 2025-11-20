import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Ethereal is a fake SMTP service — perfect for testing (no real email setup needed)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'your-ethereal-username@ethereal.email', // we’ll generate this in a sec
    pass: 'your-ethereal-password',
  },
});

export const sendOrderPaidEmail = async (email: string, orderId: number, total: number) => {
  const testAccount = await nodemailer.createTestAccount();

  // Use fresh credentials every time (Ethereal gives you a preview URL!)
  const tempTransporter = await nodemailer.createTestAccount()
    ? nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    : transporter;

  const mailOptions = {
    from: '"E-Shop " <no-reply@eshop.com>',
    to: email,
    subject: `Order #${orderId} Confirmed! 🎉`,
    text: `Your payment of ₹${total.toFixed(2)} was successful!\n\nYour order is now being processed.\n\nTrack it here: http://localhost:3000/orders/${orderId}`,
    html: `<h2>Order #${orderId} Paid Successfully!</h2>
           <p>Total: <strong>₹${total.toFixed(2)}</strong></p>
           <p>We’re packing your items right now </p>
           <a href="http://localhost:3000/orders/${orderId}">Track your order</a>`,
  };

  const info = await tempTransporter.sendMail(mailOptions);
  console.log('Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
};