//此服务器用于解决支付完成后处理post到的信息并做数据库处理，然后反馈给主服务器
var io = require('socket.io-client');
var socket = io.connect('ws://47.102.201.111:8077');
var conn = require('./database/execute');
socket.on('post', (data)=>{
    console.log(data);
    var out_trade_no = data['data']['out_trade_no'];

    var nodata = solve(out_trade_no);//解析订单号
    if(nodata.flag == 0){//购买 flag-No-game_id
        buy_game(out_trade_no, nodata.No, nodata.good_id);
    }else if(nodata.flag == 1){//创建拼团 flag-No-game_id
        create_group(out_trade_no, nodata.No, nodata.good_id);
    }else if(nodata.flag == 2){//加入拼团 flag-No-group_id
        join_group_paid(out_trade_no, nodata.No, nodata.good_id);
    }
});

/**
 * 解析订单号，返回订单信息
 * @param { String } out_trade_no 订单号
 * @returns { flag, No, good_id } 订单号中的信息（订单类型（购买、建团、入团）、用户编号、商品编号）
 */
function solve(out_trade_no) {
    var i;
    var index = 0;
    var str1 = "";
    var str2 = "";
    var str3 = "";
    var pos = [];
    for(i = 0;i < out_trade_no.length;i++){
        if(out_trade_no[i] == '-'){
            pos[index++] = i;
        }
    }

    str1 = out_trade_no.slice(0, pos[0]);           //flag
    str2 = out_trade_no.slice(pos[0] + 1, pos[1]);  //No
    str3 = out_trade_no.slice(pos[1] + 1, out_trade_no.length);//game_id / group_id

    str1 = parseInt(str1);
    str2 = parseInt(str2);
    return { flag: str1, No: str2, good_id: str3 };
}

/**
 * 为购买指定游戏的用户更新数据库，并向主服务器发送状态信息
 * @param { String } out_trade_no 订单号
 * @param { int } No 用户编号
 * @param { int } game_id 游戏编号
 */
function buy_game(out_trade_no, No, game_id){
    var sql = 'insert into buy(out_trade_no, No, game_id) value(?, ?, ?);';
    var values = [];
    values[0] = conn.tosqlString(out_trade_no);
    values[1] = No;
    values[2] = game_id;

    // sql += 'insert into own value (?, ?);';
    // values[3] = No;
    // values[4] = game_id;

    conn.doUpdate(
        sql,
        values
    ).then(
        //插入成功
        (v)=>{
            console.log('success');
            var tmp_socket = getMainServerSocket();
            tmp_socket.emit('game_paid', { No: No });//告知支付完成的客户
            get_game([No], [game_id]);//数据库中获取游戏
        },
        (v)=>{
            console.log(v);
            //TODO...
        }
    )
}

/**
 * 为加入指定拼团的用户更新数据库（包含buy表），并向主服务器发送状态信息
 * @param { String } out_trade_no 订单号
 * @param { int } No 用户编号
 * @param { String } group_id 拼团编号
 */
function join_group_paid(out_trade_no, No, group_id){
    var sql = 'select * from group_buy where group_id=?;';
    var values = [];
    values[0] = conn.tosqlString(group_id);
    conn.doQuery(//查询游戏id
        sql,
        values
    ).then(
        (v)=>{
            game_id = v[0]['game_id'];
            var sql = 'insert into buy(out_trade_no, No, game_id, group_id) value(?, ?, ?, ?);'
            var values = [];
            values[0] = conn.tosqlString(out_trade_no);
            values[1] = No;
            values[2] = game_id;
            values[3] = conn.tosqlString(group_id);
            conn.doUpdate(//插入购买记录
                sql,
                values
            ).then(
                (v)=>{
                    console.log('success');
                    join_group(No, group_id);//插入拼团记录
                },
                (v)=>{
                    console.log(v);
                }
            )
        },
        (v)=>{
            console.log(v);
        }
    )
}

/**
 * 为加入指定拼团的用户更新数据库（不包含buy表），并向主服务器发送状态信息
 * @param { int } No 用户编号
 * @param { String } group_id 拼团编号
 */
function join_group(No, group_id){
    var sql = 'insert into join_group(group_id, No) value (?, ?);';
    var values = [];
    values[0] = conn.tosqlString(group_id);
    values[1] = No;
    sql += 'update group_buy set user_count=user_count+1 where group_id=?;';
    values[2] = conn.tosqlString(group_id);

    conn.doUpdate(
        sql,
        values
    ).then(
        (v)=>{
            console.log('用户 ' + No + ' 加入拼团 ' + group_id + ' 成功');
            var tmp_socket = getMainServerSocket();
            tmp_socket.emit('join_group_paid', { No: No });
            tryToFinishGroup(group_id);
        },
        (v)=>{
            //TODO...
        }
    )
}

/**
 * 为创建拼团的用户更新数据库，并加入自己的拼团，并向主服务器发送状态信息
 * @param { String } out_trade_no 订单号
 * @param { int } No 用户编号
 * @param { int } game_id 游戏编号
 */
function create_group(out_trade_no, No, game_id){
    var group_id = No + '-' + game_id;
    var sql = 'insert into buy(out_trade_no, No, game_id, group_id) value (?, ?, ?, ?);';
    var values = [];
    values[0] = conn.tosqlString(out_trade_no);
    values[1] = No;
    values[2] = game_id;
    values[3] = conn.tosqlString(group_id);
    sql += 'insert into group_buy value (?, ?, ?, 0)';
    values[4] = conn.tosqlString(group_id);
    values[5] = No;
    values[6] = game_id;

    conn.doUpdate(
        sql,
        values
    ).then(
        (v)=>{
            console.log('用户' + No + ' 对游戏 ' + game_id + ' 的拼团创建成功');
            var tmp_socket = getMainServerSocket();
            tmp_socket.emit('create_group_paid', { No: No });
            join_group(No, group_id);
        },
        (v)=>{
            //TODO...
        }
    )
}

/**
 * 为已购入游戏的用户们更新数据库
 * @param { int[] } Nos 用户编号集合
 * @param { int[] } game_ids 游戏编号集合
 */
function get_game(Nos, game_ids){
    //构造sql语句群
    var sql = '';
    var values = [];
    for(var i = 0;i < Nos.length;i++){
        sql += 'insert into own value(?, ?);';
        values[i * 2] = Nos[i];
        values[i * 2 + 1] = game_ids[i];
    }

    conn.doUpdate(
        sql,
        values
    ).then(
        ()=>{
            console.log('用户 ' + Nos + ' 对游戏 ' + game_ids + ' 购入成功！');
            var tmp_socket = getMainServerSocket();
            for(var i = 0;i < Nos.length;i++){//推送信息给主服务器
                tmp_socket.emit('game_hasget', { No: Nos[i] });
            }
        },
        (v)=>{
            console.log(v);
        }
    )
}

// var tmp_socket = getMainServerSocket();
// tmp_socket.emit('game_hasget', { No: 1 });

/**
 * 获取连接主服务器的socket对象
 * @returns tmp_socket 一个连接主服务器的socket对象
 */
function getMainServerSocket(){

    var tmp_io = require('socket.io-client');
    var tmp_socket = tmp_io.connect('ws://127.0.0.1:8078');
    return tmp_socket;
}

/**
 * 尝试完成某拼团
 * @param { String } group_id 尝试完成的拼团编号
 */
function tryToFinishGroup(group_id){
    var sql = 'select * from join_group, group_buy where join_group.group_id=group_buy.group_id and group_buy.group_id=?;';
    var values = [];
    values[0] = conn.tosqlString(group_id);
    conn.doQuery(
        sql,
        values
    ).then(
        (v)=>{
            if(v.length >= 5){//人数大于6，完成拼团
                var Nos = [];
                var game_ids = [];
                //遍历用户，为他们购入游戏
                for(var i = 0;i < v.length;i++){
                    Nos[i] = v[i]['No'];
                    game_ids[i] = v[i]['game_id'];
                }
                get_game(Nos, game_ids);
                //删除拼团信息
                sql = 'delete from group_buy where group_id=?;';
                values = [];
                values[0] = conn.tosqlString(group_id);
                conn.doUpdate(
                    sql,
                    values
                ).then(
                    (v)=>{
                        console.log('删除拼团号为 ' + group_id + ' 的拼团成功！');
                    },
                    (v)=>{
                        console.log('删除拼团号为 ' + group_id + ' 的拼团失败');
                    }
                );
            }
        }
    );
}

// conn.doUpdate(
//     'delete from own;insert into group_buy(group_id, group_owner, game_id, user_count) value (\'0-1\', 1, 0, 0)',
//     []
// );
// join_group(1, '0-1');
// join_group(2, '0-1');
// join_group(4, '0-1');
// join_group(5, '0-1');