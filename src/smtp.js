// Replace '../lib/smtp-server' with 'smtp-server' when running this script outside this directory
const SMTPServer = require("smtp-server").SMTPServer;
const { parseEmail } = require('./parseEmail');
const fs = require('fs');

const smtpServer = (settings = { username: 'project', password: 'secret' }, on = async () => {}) => {
    // Setup server
    const server = new SMTPServer({
        // log to console
        logger: true,
        secure: false,

        // not required but nice-to-have
        banner: 'Welcome to My Awesome SMTP Server',

        disabledCommands: [],//['STARTTLS'],

        authOptional: true,

        // By default only PLAIN and LOGIN are enabled
        authMethods: ['PLAIN', 'LOGIN', 'CRAM-MD5'],

        // Accept messages up to 10 MB
        size: 10 * 1024 * 1024,

        // allow overriding connection properties. Only makes sense behind proxy
        useXClient: true,

        hidePIPELINING: true,

        // use logging of proxied client data. Only makes sense behind proxy
        useXForward: true,

        // Setup authentication
        // Allow only users with username 'testuser' and password 'testpass'
        onAuth(auth, session, callback) {
            console.log('ON AUTH', auth, session);
            // check username and password
            if (
                auth.username === settings.username &&
                (auth.method === 'CRAM-MD5'
                    ? auth.validatePassword(settings.password) // if cram-md5, validate challenge response
                    : auth.password === settings.password) // for other methods match plaintext passwords
            ) {
                return callback(null, {
                    user: 'userdata' // value could be an user id, or an user object etc. This value can be accessed from session.user afterwards
                });
            }
            return callback(new Error('Authentication failed'));
        },

        // Validate MAIL FROM envelope address. Example allows all addresses that do not start with 'deny'
        // If this method is not set, all addresses are allowed
        onMailFrom(address, session, callback) {
            console.log('onMailFrom', address, session);
            if (/^deny/i.test(address.address)) {
                return callback(new Error('Not accepted'));
            }
            callback();
        },

        // Validate RCPT TO envelope address. Example allows all addresses that do not start with 'deny'
        // If this method is not set, all addresses are allowed
        onRcptTo(address, session, callback) {
            let err;

            console.log('RCPT', address);

            if (/^deny/i.test(address.address)) {
                return callback(new Error('Not accepted'));
            }

            // Reject messages larger than 100 bytes to an over-quota user
            if (address.address.toLowerCase() === 'almost-full@example.com' && Number(session.envelope.mailFrom.args.SIZE) > 100) {
                err = new Error('Insufficient channel storage: ' + address.address);
                err.responseCode = 452;
                return callback(err);
            }

            callback();
        },

        // Handle message stream
        onData(stream, session, callback) {
            let emailData = '';
            stream.pipe(process.stdout);
            stream.on('data', (data) => {
                emailData += data.toString();
            });
            stream.on('end', async () => {
                let err;
                if (stream.sizeExceeded) {
                    err = new Error('Error: message exceeds fixed maximum message size 10 MB');
                    err.responseCode = 552;
                    return callback(err);
                }
                await on(await parseEmail(emailData));
                callback(null, 'Message queued'); // accept the message once the stream is ended
            });
        }
    });

    server.on('error', err => {
        console.log('Error occurred');
        console.log(err);
    });

    return {
        server: server,
        run: (port = 25, host = "0.0.0.0") => {
            server.listen(port, host);
        }
    };
};

module.exports = {
    smtpServer
};