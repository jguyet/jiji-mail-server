const nodemailer = require("nodemailer");
const { smtpServer } = require('./src/smtp');
const { pop3Server } = require('./src/pop3');
const { sendEmail } = require('./src/sendEmail');
const { formatEmailAddress } = require('./src/utils');
const { v4 } = require('uuid');
const fs = require('fs');

const emailBase = [
    'mail@checkdot.io',
    'jguyet@checkdot.io',
    'avangarf@checkdot.io',
    'hello@linepicplus.com',
    'jguyet@linepicplus.com',
    'noreply@ampbit.xyz'
];

const smtp = smtpServer({
    username: 'project',
    password: 'secret'
}, async (email) => {
    if (emailBase.find(x => email.from.includes(x)) != undefined) {
        console.log(`Email Sending ${email.from} -> ${email.to} - ${email.subject}`);
        await sendEmail(email.from, email.to, email.subject, email.text, email.html, email.attachments);
    } else if (emailBase.find(x => email.to.includes(x)) != undefined) {
        console.log(`Email Received ${email.to} <- ${email.from}`);

        email.uid = v4();

        const to = formatEmailAddress(email.to);
        const mailsPath = `./mails/${to}.json`;
        if (!fs.existsSync(mailsPath)) {
            fs.writeFileSync(mailsPath, '[]');
        }
        let mails = JSON.parse(fs.readFileSync(mailsPath).toString());
        mails.push(email);
        fs.writeFileSync(mailsPath, JSON.stringify(mails, null, 4));
        console.log(`Email Saved ${email.to} <- ${email.from}`);
    }
});

const pop3 = pop3Server();

smtp.run(25, "0.0.0.0");
pop3.run(110);
