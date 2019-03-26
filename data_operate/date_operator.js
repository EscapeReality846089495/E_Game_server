function getDateTime(){
    var date = new Date();
    return getDate() + ' ' + getTime();
}
function getDate(){
    var date = new Date();
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
}

function getTime(){
    var date = new Date();
    return date.getHours() + ':' + date.getMonth() + ':' + date.getSeconds();
}

module.exports = { getDateTime, getDate, getTime };