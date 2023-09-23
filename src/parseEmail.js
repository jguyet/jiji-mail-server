const MailParser = require('mailparser').MailParser;

async function parseEmail(message) {
  return new Promise((resolve, reject) => {
    const mailparser = new MailParser();

    const emailData = {
      headers: {},
      text: '',
      html: '',
      from: '',
      to: ''
    };

    // Écoutez les événements de l'analyseur de messagerie pour extraire les informations
    mailparser.on('headers', (headers) => {
      emailData.headers = headers;
      if (headers.get('from')) {
        emailData.from = headers.get('from')?.text ?? '';
      }
      if (headers.get('to')) {
        emailData.to = headers.get('to')?.text ?? '';
      }
    });

    mailparser.on('data', (data) => {
      if (data.type === 'text') {
        emailData.text += data.text;
      } else if (data.type === 'html') {
        emailData.html += data.html;
      }
    });

    mailparser.on('end', () => {
      resolve(emailData);
    });

    // Alimentez le message dans l'analyseur de messagerie
    mailparser.write(message);
    mailparser.end();

    mailparser.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  parseEmail
}
