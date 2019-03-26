function solve(data) {
    var i;
    var flag = false;
    var str1 = "";
    var str2 = "";
    for(i = 0;i < data.length;i++){
        if(data[i] == '-'){
            str1 = data.slice(0, i);
            str2 = data.slice(i + 1, data.length);
            break;
        }
    }

    return { No: str1, game_id: str2 };
}

module.exports = {solve};