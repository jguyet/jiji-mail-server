const nodemailer = require('nodemailer');
const dns = require('dns');

async function createTransporterForEmail(email) {
    const domain = email.split('@')[1]; // Extrait le domaine de l'adresse e-mail
  
    try {
      const mxRecords = await resolveMxRecords(domain);
      if (mxRecords.length === 0) {
        throw new Error(`Aucun enregistrement MX trouvé pour le domaine ${domain}`);
      }
  
      // Utilise le premier serveur MX pour la configuration du transporteur
      const transporter = nodemailer.createTransport({
        host: mxRecords[0].exchange,
        port: 25, // Port SMTP par défaut
      });
  
      return transporter;
    } catch (error) {
      throw new Error(`Erreur lors de la résolution MX pour le domaine ${domain}: ${error.message}`);
    }
}

function resolveMxRecords(domain) {
    return new Promise((resolve, reject) => {
      dns.resolveMx(domain, (err, mxRecords) => {
        if (err) {
          reject(err);
        } else {
          resolve(mxRecords);
        }
      });
    });
}

async function sendEmail(from, to, subject, text) {
    return await new Promise((resolve) => {
        try {
            let toEmail = to;
            if (toEmail.includes('<') && toEmail.includes('>')) {
                toEmail = toEmail.split('<')[1].split('>')[0];
            }

            createTransporterForEmail(toEmail).then((transporter) => {
                // Configurer l'e-mail à envoyer
                const mailOptions = {
                    from: from,
                    to: to,
                    subject: subject,
                    text: text,
                };
            
                // Envoyer l'e-mail en utilisant le transporteur configuré
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
                        resolve(false);
                    } else {
                        console.log('E-mail envoyé :', info.response);
                        resolve(true);
                    }
                });
            }).catch((error) => {
                console.log('Erreur lors de l\'envoi de l\'e-mail :', error);
                resolve(false);
            });

        } catch (error) {
            console.error(error);
            resolve(false);
        }
    })
};

module.exports = {
    sendEmail
};