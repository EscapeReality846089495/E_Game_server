var base64transformer = require('./base64_transorm');
var fs = require('fs');
var path = require('path');
class adInfo {
    constructor(data) {
        this.adid = data['ad_id'];
        this.gameid = data['game_id'];

        var pict = base64transformer.anyToBase64(data['ad_pict']);
        this.adpict = pict;
    }
}

class game {
    //input whole data of game
    constructor(data) {
        this.game_id = null;
        this.game_name = null;
        this.game_pict = null;
        this.game_auth = null;
        this.publish_date = null;
        this.cost = null;
        this.group_cost = null;
        this.type_Moba = null;
        this.type_CardAndChess = null;
        this.game_summary = null;
        this.game_summary = data['game_summary'];
        if (this.game_summary == undefined) {
            this.game_summary = '暂无简介';
        }
        this.game_id = data['game_id'].toString();
        this.game_name = data['game_name'];
        this.game_auth = data['game_auth'];
        if (this.game_auth == undefined) {
            this.game_auth = '暂无作者';
        }
        this.publish_date = data['publish_date'];
        if (this.publish_date == undefined) {
            this.publish_date = '暂无出版日期';
        } else {
            this.publish_date = this.publish_date.toLocaleString();
        }
        this.cost = data['cost'];
        if (this.cost == undefined) {
            this.cost = '暂无价格';
        } else {
            this.cost = this.cost.toString();
        }
        this.type_Moba = data['type_Moba'];
        this.type_CardAndChess = data['type_CardAndChess'];
        if(this.type_Moba != null){
            this.type_Moba = this.type_Moba.toString();
        }
        if(this.type_CardAndChess != null){
            this.type_CardAndChess = this.type_CardAndChess.toString();
        }
        this.group_cost = data['group_cost'];
        if (this.group_cost == undefined) {
            this.group_cost = '暂无团购价';
        } else {
            this.group_cost = this.group_cost.toString();
        }

        var pict = base64transformer.anyToBase64(data['game_pict']);
        this.game_pict = pict;
        if (this.game_pict == undefined) {
            var data = fs.readFileSync(path.resolve('default_pict.jpg'));
            var pict = base64transformer.anyToBase64(data);
            this.game_pict = pict;
        }
    }
}

class s_game {
    //input whole data of game
    constructor(data) {
        this.game_id = null;
        this.game_name = null;
        this.game_pict = null;
        this.game_auth = null;
        this.publish_date = null;
        this.cost = null;
        this.group_cost = null;
        this.type_Moba = null;
        this.type_CardAndChess = null;
        this.game_summary = null;
        this.game_summary = data['game_summary'];
        if (this.game_summary == undefined) {
            this.game_summary = '暂无简介';
        }
        this.game_id = data['game_id'].toString();
        this.game_name = data['game_name'];
        this.game_auth = data['game_auth'];
        if (this.game_auth == undefined) {
            this.game_auth = '暂无作者';
        }
        this.publish_date = data['publish_date'];
        if (this.publish_date == undefined) {
            this.publish_date = '暂无出版日期';
        } else {
            this.publish_date = this.publish_date.toLocaleString();
        }
        this.cost = data['cost'];
        if (this.cost == undefined) {
            this.cost = '暂无价格';
        } else {
            this.cost = this.cost.toString();
        }
        this.type_Moba = data['type_Moba'];
        this.type_CardAndChess = data['type_CardAndChess'];
        if(this.type_Moba != null){
            this.type_Moba = this.type_Moba.toString();
        }
        if(this.type_CardAndChess != null){
            this.type_CardAndChess = this.type_CardAndChess.toString();
        }
        this.group_cost = data['group_cost'];
        if (this.group_cost == undefined) {
            this.group_cost = '暂无团购价';
        } else {
            this.group_cost = this.group_cost.toString();
        }

        var pict = base64transformer.anyToBase64(data['game_pict']);
        this.game_pict = pict;
        if (this.game_pict == undefined) {
            var data = fs.readFileSync(path.resolve('default_pict.jpg'));
            var pict = base64transformer.anyToBase64(data);
            this.game_pict = pict;
        }
    }
}

class stores{
    constructor(game_count, game){
        this.game_count = game_count;
        this.game = game;
    }
}

class groupInfo {
    constructor(data) {
        this.group_id = data['group_id'];
        this.game_id = data['game_id'];
        this.user_count = data['user_count'];
        this.owner = new userInfo(data);
    }
}
class userInfo {
    constructor(data) {
        this.user_name = data['username'];
        this.sex = data['sex'];
        if (data['birth'] != null) {
            this.birth = data['birth'].toString();
        }
        if (data['head_pict'] == null) {
            this.user_pict = null;
        } else {
            var pict = base64transformer.anyToBase64(data['head_pict']);
            this.user_pict = pict;
        }
    }
}

class gamepart_info{
    constructor(data){
        this.game_id = data['game_id'];
        this.game_name = data['game_name'];
        this.type_Moba = data['type_Moba'];
        this.type_CardAndChess = data['type_CardAndChess'];
        if(data['game_pict'] != null){
            var pict = base64transformer.anyToBase64(data['game_pict']);
        }
        this.game_pict = pict;
    }
}
class game_part{
    constructor(data){
        this.game_count = data['game_count'];
        this.game_p = data['game_p'];
    }
}

class user_information{
    constructor(data){
        this.user_id = data['user_id'];
        this.username = data['username'];
        if(data['user_pict'] != null){
            this.user_pict = base64transformer.anyToBase64(data['user_pict']);
        }
        this.user_password = "";
        this.user_birth = data['birth'];
        if(data['sex'] == 0){
            this.user_sex = false;
        }else{
            this.user_sex = true;
        }
        this.user_contents = data['user_contents'];
        this.game_counts;
    }
}

class games_info{
    constructor(data){
        this.game_id = data['game_id'];
        this.game_name = data['game_name'];
        if(data['game_pict'] != null){
            this.game_pict = base64transformer.anyToBase64(data['game_pict']);
        }
        this.game_auth = data['game_auth'];
        this.buy_time = data['buy_time'];
        this.isbought = data['isbought'];
    }
}
module.exports = { adInfo, game, groupInfo, gamepart_info, game_part, s_game, user_information, games_info, stores };