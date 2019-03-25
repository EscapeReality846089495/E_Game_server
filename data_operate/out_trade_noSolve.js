function solve(data) {
    var i;
    var flag = false;
    var str1;
    var str2;
    for(i = 0;i < data.length;i++){
        if(data[i] == '-'){
            flag = i;
            continue;
        }
        if(flag == false){
            str1[i] = data[i];
        }else{
            str2[i - flag - 1] = data[i];
        }
    }

    return { No: str1, game_id: str2 };
}

module.exports = {solve};