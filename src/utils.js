
const formatEmailAddress = (email) => {
    if (email.includes('<') && email.includes('>')) {
        return email.split('<')[1].split('>')[0];
    }
    return email;
}

module.exports = {
    formatEmailAddress
};