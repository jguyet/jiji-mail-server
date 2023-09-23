const nodemailer = require("nodemailer");
const { smtpServer } = require('./src/smtp');
const { sendEmail } = require('./src/sendEmail');
const fs = require('fs');

const smtp = smtpServer({
    username: 'project',
    password: 'secret'
}, async (email) => {
    if (email.from.includes('checkdot.io')) {
        console.log(`Email Sending ${email.from} -> ${email.to} - ${email.subject}`, email);
        await sendEmail(email.from, email.to, email.subject, email.text);
    } else {
        console.log(`Email Received ${email.to} <- ${email.from}`, email);
    }
});

smtp.run(25, "0.0.0.0");