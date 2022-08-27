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
    var date = new Date(UNIX_timestamp);
    var year = date.getFullYear();
    var month = numberAddSpace(date.getMonth());
    var day = numberAddSpace(date.getDate());
    var hour = numberAddSpace(date.getHours());
    var min = numberAddSpace(date.getMinutes());
    var sec = numberAddSpace(date.getSeconds());
    var sec = numberAddSpace(date.getSeconds());
    var output = `${year}/${month}/${day}-${hour}:${min}:${sec}`;
    return output;
}

module.exports = {
    getArgParm,
    timeConverter,
}