function solve(data) {
    var i;
    var flag = false;
    var str1 = "";
    var str2 = "";
    var str3 = "";
    var pos = [];
    for(i = 0;i < data.length;i++){
        if(data[i] == '-'){
            if(flag == false){
                pos[0] = i;
            }else if(flag == true){
                pos[1] = i;
                break;
            }
        }
    }

    str1 = data.slice(0, pos[0]);           //flag
    str2 = data.slice(pos[0] + 1, pos[1]);  //No
    str3 = data.slice(pos[1] + 1, data.length);//game_id / group_id

    str1 = parseInt(str1);
    str2 = parseInt(str2);
    return { flag: str1, No: str2, good_id: str3 };
}

module.exports = {solve};