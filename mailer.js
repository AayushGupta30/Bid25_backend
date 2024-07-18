const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service
  auth: {
    user: 'noreply-itteam@sjmsom.in',
    pass: 'dcjblhoazfqxmzis'
  }
});

const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'noreply-itteam@sjmsom.in',
    to: to,
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = sendEmail;
