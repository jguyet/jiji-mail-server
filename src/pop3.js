const pop3 = require("pop3-server");
const fs = require('fs');

const toPopEmail = (email) => {
    return `Date: ${(new Date(email.timestamp * 1000)).toUTCString()}\r\n` +
    `From: ${email.from}\r\n` +
    `To: ${email.to}\r\n` +
    `Subject: ${email.subject}\r\n` +
    '\r\n' +
    `${email.text}\r\n`;
}

const pop3Server = () => {
    if (!fs.existsSync('./mails')) {
        fs.mkdirSync('./mails');
    }

    const server = pop3.create_server(function(connection) {

        let connectedUser = {
            connection: connection,
            authenticated: false,
            mails: []
        };

        console.log('Client connected');
    
        connection.on('authentication', function(user, pass, success){
            console.log('Authentication requested for ' + user + '/' + pass);
    

            connectedUser.user = user;
            connectedUser.authenticated = true;

            return success(true);
        });
    
        connection.on('stat', function(callback){
            console.log('Stat requested');

            if (connectedUser.authenticated == false) { // not authenticated
                return callback(0, 236);
            }
            const path = `./mails/${connectedUser.user}.json`;
            if (!fs.existsSync(path)) {
                return callback(0, 236);
            }
            const mails = JSON.parse(fs.readFileSync(path).toString());

            return callback(mails.length, 236);
        });
    
        connection.on('list', function(callback){
            console.log('List requested');
            if (connectedUser.authenticated == false) { // not authenticated
                return callback([]);
            }
            const path = `./mails/${connectedUser.user}.json`;
            if (!fs.existsSync(path)) {
                return callback([]);
            }
            const mails = JSON.parse(fs.readFileSync(path).toString());

            connectedUser.mails = mails.map((x, index) => {
                return {
                    uid: x.uid,
                    size: toPopEmail(x).length,
                    body: toPopEmail(x)
                };
            });
    
            return callback(connectedUser.mails);
        });
    
        connection.on('uidl', function(index, callback){
            console.log('UID list: ' + index);
            if (connectedUser.authenticated == false) { // not authenticated
                return callback([]);
            }
            console.log(`${connectedUser.user} uidl list`);
            const path = `./mails/${connectedUser.user}.json`;
            if (!fs.existsSync(path)) {
                console.log('Empty');
                return callback([]);
            }
            const mails = JSON.parse(fs.readFileSync(path).toString());

            connectedUser.mails = mails.map((x, index) => {
                return {
                    uid: x.uid,
                    size: toPopEmail(x).length,
                    body: toPopEmail(x)
                };
            });
            return callback(connectedUser.mails.map((x) => {
                return {
                    uid: x.uid
                };
            }));
        });
    
        connection.on('retr', function(mail_index, callback){
            console.log('Retrieving message ' + mail_index);
            if (connectedUser.authenticated == false) { // not authenticated
                return callback(undefined);
            }
            if (connectedUser.mails.length == 0) {
                return callback(undefined);
            }
    
            const selectedMail = connectedUser.mails[mail_index - 1];

            if (selectedMail == undefined) {
                return callback(undefined);
            }
            callback(selectedMail);
        });

        connection.on('dele', function(index, callback){
            console.log('Deleting message ' + mail_index);
            if (connectedUser.authenticated == false) { // not authenticated
                return callback(undefined);
            }

            const path = `./mails/${connectedUser.user}.json`;
            if (!fs.existsSync(path)) {
                return callback(undefined);
            }
            if (connectedUser.mails.length == 0) {
                return callback(undefined);
            }
            const mails = JSON.parse(fs.readFileSync(path).toString());
            const selectedMail = connectedUser.mails[mail_index - 1];

            if (selectedMail == undefined) {
                return callback(false);
            }
            const newMails = mails.filter(x => x.uid != selectedMail.uid);
            fs.writeFileSync(path, JSON.stringify(newMails, null, 4));
            callback(true);
        });
    });

    return {
        server: server,
        run: (port = 110) => {
            server.listen(port);
        }
    };
};

module.exports = {
    pop3Server
};
