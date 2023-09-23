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
        };

        // var mails = [
        //     {
        //         uid: 'm1',
        //         size: 236,
                // body: 'Date: Mon, 18 Oct 2004 04:11:45 +0200\r\n' +
                //     'From: Someone <someone@example.org>\r\n' +
                //     'To: you@example.org\r\n' +
                //     'Subject: Some Subject\r\n' +
                //     '\r\n' +
                //     'Hello World!\r\n'
        //     },
        //     {
        //         uid: 'm2',
        //         size: 236,
        //         body: 'Date: Mon, 18 Oct 2004 04:11:45 +0200\r\n' +
        //             'From: Someone <someone@example.org>\r\n' +
        //             'To: you@example.org\r\n' +
        //             'Subject: Some Subject\r\n' +
        //             '\r\n' +
        //             'Hello World!\r\n'
        //     }
        // ];
    
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
    
            return callback(mails.map((x, index) => {
                return {
                    uid: x.uid,
                    size: toPopEmail(x).length,
                    body: toPopEmail(x)
                };
            }));
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
            const lst = mails.map((x, index) => {
                return {
                    uid: x.uid
                };
            });
            console.log(lst);
            return callback(lst);
        });
    
        connection.on('retr', function(mail_index, callback){
            console.log('Retrieving message ' + mail_index);
            if (connectedUser.authenticated == false) { // not authenticated
                return callback(undefined);
            }

            const path = `./mails/${connectedUser.user}.json`;
            if (!fs.existsSync(path)) {
                return callback(undefined);
            }
            const mails = JSON.parse(fs.readFileSync(path).toString());
    
            const selectedMail = mails[mail_index - 1];

            if (selectedMail == undefined) {
                return callback(undefined);
            }

            callback({
                uid: selectedMail.uid,
                size: toPopEmail(selectedMail).length,
                body: toPopEmail(selectedMail)
            });
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