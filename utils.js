const moment = require("moment");

function numberAddSpace(value) {
    let str = value.toString();
    if (str.length == 0)
        return '00';
    else if (str.length == 1)
        return `0${str}`;
    return str;
}

function getArgParm(input) {
    let output = [];
    input.split(' ').forEach(item => {
        if (item !== '')
            output.push(item)
    })
    return output;
}

function timeConverter(UNIX_timestamp) {
    return moment(UNIX_timestamp).format('YYYY/MM/DD-hh:mm:ss');
}

module.exports = {
    getArgParm,
    timeConverter,
}
