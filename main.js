//192.168.1.113
//419099
var fs = require('fs');
const AlipaySdk = require('alipay-sdk').default;
var io = require('socket.io')(8078);
var conn = require('./database/database_operator');
var checker = require('./data_operate/data_check');
var base64transformer = require('./data_operate/base64_transorm');
var classes = require('./data_operate/se_class');
var conn1 = require('./database/execute');

const alipaySdk = new AlipaySdk({
    gateway: 'https://openapi.alipaydev.com/gateway.do',
    appId: '2016092600599785',
    privateKey: fs.readFileSync('keys/应用私钥2048.txt', 'ascii'),
    alipayPublicKey: fs.readFileSync('keys/alipay_public_key.txt', 'ascii')
});
var AliPayForm = require('alipay-sdk/lib/form').default;

//conn.connect();
console.log('server start');

//socket.io event
io.on('connection', (socket) => {
    console.log('client connection');

    /**
     * 客户端连接测试
     */
    socket.emit('ClientListener', { hello: 'world' });

//////////////////////////// socket客户端部分 ////////////////////////////////////////////

    /**
     * 处理注册
     * @param data {user_id, password, user_name, sex, birth, e_mail, phone}
     */
    socket.on('regist', (data) => {
        var keys = ['user_id', 'password', 'user_name', 'sex', 'birth', 'e_mail', 'phone'];
        //第1次检查 字段是否为 空
        if (data[keys[0]] == null && data[keys[5]] == null && data[keys[6]] == null) {
            socket.emit('regist_state', { registstate: '账号或手机或邮箱不得为空' });
            return;
        }
        else if (data[keys[1]] == null) {
            socket.emit('regist_state', { registstate: '密码不得为空' });
            return;
        }
        //第2次检查 检查字段是否符合要求
        var check_res = checker.checkIdPassEmailPhone(data);
        if (check_res != "ok") {
            socket.emit('regist_state', { registstate: check_res });
        }
        //第3次检查逻辑
        else {
            //将undefined的值改为‘null’
            var i;
            for (i = 0; i < keys.length; i++) {
                console.log(data[keys[i]]);
                if (data[keys[i]] == undefined || data[keys[i]] == "") {
                    data[keys[i]] = null;
                } else {
                    data[keys[i]] = '\'' + data[keys[i]] + '\'';
                }
            }
            query_sql = 'select * from user_account where user_id=' + data['user_id'] + ';';
            conn.query(query_sql, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else if (result.length != 0) {
                    socket.emit('regist_state', { registstate: '该账号已被注册，请更换账号' });
                } else {
                    conn.query('select * from user_account where E_mail=' + data['e_mail'] + ';', (err, result) => {
                        if (err) {
                            console.log(err);
                            socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                        }
                        else if (result.length != 0) {
                            socket.emit('regist_state', { registstate: '该邮箱已被注册，请更换邮箱' });
                        } else {
                            conn.query('select * from user_account where Phone=' + data['phone'] + ';', (err, result) => {
                                if (err) {
                                    console.log(err);
                                    socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                }
                                else if (result.length != 0) {
                                    socket.emit('regist_state', { registstate: '该号码已被注册，请更换号码' });
                                } else {
                                    conn.query('select max(No) from user_account', (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                        }
                                        var no = parseInt(result[0]['max(No)']);
                                        no++;
                                        var query_sql = 'insert into user_account value (' + no + ',' + data['user_id'] + ',' + data['password'] + ',' + data['user_name'] + ',' + data['sex'] + ',' + data['birth'] + ',' + data['e_mail'] + ',' + data['phone'] + ');';
                                        conn.query(query_sql, (err) => {
                                            if (err) {
                                                socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                                console.log(err);
                                            }
                                            socket.emit('regist_state', { registstate: '注册成功！' });
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    //Use id and pass to log in, client event:login_state
    /**
     * 处理登录
     * @param data { account, password }
     */
    socket.on('login', (data) => {
        if (data['account'] == "" && data['password'] == "") {
            socket.emit('login_state', { loginstate: 'yes' });
            return;
        }
        //使用邮箱登录
        if (checker.checkEmail(data['account']) == true) {
            login(data, 'E_mail', socket);
        }
        //使用手机号码登录
        else if (checker.checkPhone(data['account']) == true) {
            login(data, 'Phone', socket);
        }
        //使用id登录
        else {
            login(data, 'user_id', socket);
        }
    });
    /**
     * 登录操作
     * @param {Map} data { account, password }
     * @param {String} login_type { 'E_mail'/'Phone'/'user_id' }
     * @param {socket} socket 
     */
    function login(data, login_type, socket) {
        clientIP = socket.handshake.address
        //check islogin?
        query_sql = 'select * from online_account where ' + login_type + '=\'' + data['account'] + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result.length != 0) {
                socket.emit('login_state', { loginstate: '该账户已登录，请勿重复登录' });
            }
            else {
                //login
                query_sql = 'select * from user_account where ' + login_type + '=\'' + data['account'] + '\' and password=\'' + data['password'] + '\';';
                conn.query(query_sql, (err, result) => {
                    if (err) {
                        console.log(err);
                        socket.emit('login_state', { loginstate: '登录失败，请稍后再试' });
                    }
                    if (result.length != 0) {
                        query_sql = 'insert into online_account value (' + result[0].No + ', \'' + result[0].user_id + '\', \'' + result[0].E_mail + '\', \'' + result[0].Phone + '\', \'' + clientIP + '\', \'' + socket.id + '\')';
                        conn.query(query_sql, (err) => {
                            if (err) {
                                console.log(err);
                                socket.emit('login_state', { loginstate: '登录失败，请稍后再试' });
                            }
                            socket.emit('login_state', { loginstate: 'yes' });
                        });
                    }
                    else {
                        socket.emit('login_state', { loginstate: '用户名密码错误' });
                    }
                });
            }
        });
    }

    //Deal with game rely require, send the game information to UI, client event:game_receive
    /**
     * 发送一批游戏的信息
     * @param data { times(批次) }
     */
    socket.on('games_require', (data) => {
        var times = data['times'];//times >= 1
        var sta = times * 8 - 8;
        var end = times * 8;
        var query_sql = 'select * from game_info where game_id<' + end + ' and game_id>=' + sta + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            socket.emit('game_receive', result);
        });
    });

    /**
     * 返回广告内容
     * @param data { ad_num }
     */
    socket.on('trans_ad', (data) => {
        var query_sql = 'select game_id from ad_info where ad_id=' + data['ad_num'] + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            query_sql = 'select * from game_info where game_id=' + result[0]['game_id'];
            conn.query(query_sql, (err, result) => {
                if (err) {
                    console.log(err);
                }
                socket.emit('ad_trans', new classes.gameInfo(result[0]));
            });
        });

    });

    //when client is disconnected
    socket.on('disconnect', () => {
        query_sql = 'select user_id from online_account where IP_addr=\'' + socket.handshake.address + '\';';
        conn.query(query_sql, (err) => {
            if (err) {
                console.log(err);
            }
            conn.query('delete from online_account where IP_addr=\'' + socket.handshake.address + '\';', (err, result) => {
                if (err) {
                    console.log(err);
                }
                else if (result[0] != undefined) {
                    console.log('Client ' + result[0].user_id + ' is disconnected');
                } else {
                    console.log('Client xxx is disconnected');
                }
            });
        });
    });

    //deal with purchase require, send the statement to UI, client event:purchase_state
    /**
     * 购买游戏，将游戏加入库
     */
    socket.on('purchase', (data) => {
        var user_addr = socket.handshake.address;
        query_sql = 'select No from online_account where IP_addr=' + '\'' + user_addr + '\'';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err)
            } else if (result == undefined) {
                socket.emit('error', { error: '你已从服务器断开，请重新登录' });
            } else {
                //get No
                No = result[0]['No'];
                query_sql = 'insert into users_assets value (' + No + ', ' + data['game_id'] + ', \'' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + '\');';
                conn.query(query_sql, (err) => {
                    if (err) {
                        console.log(err);
                        socket.emit('purchase_state', { purchasestate: '购买失败，请稍后再试' });
                    } else {
                        socket.emit('purchase_state', { purchasestate: '购买成功！' });
                    }
                });
            }
        });
    });

    //deal with advertisement require, send the require statement or advertisements'informations to UI, client event:ad_get
    /**
     * 发送广告内容
     */
    socket.on('require_ad', () => {
        query_sql = 'select * from ad_info;';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('ad_get', { requirestate: '获取内容失败，请稍后尝试刷新' });
            } else {
                var info = [];
                var i;
                for (i = 0; i < result.length; i++) {
                    info[i] = new classes.adInfo(result[i]);
                }
                socket.emit('ad_get', { adcount: info.length, ads: info });
            }
        });
    });

    //支付请求，发送一个支付链接
    socket.on('pay', (data) => {
        IsOnline(
            socket
        ).then((v) => {//获得在线信息
            console.log(v);
            var No = v['No'];
            var game_id = data['game_id'];
            var out_trade_no = '0' + '-' + No + '-' + game_id;
            query_sql = 'select game_name, cost from game_info where game_id=' + game_id + ';';
            conn.query(query_sql, (err, result)=>{
                if(err){
                    console.log(err);
                }else{
                    pay(out_trade_no, result[0]['game_name'], result[0]['cost']);
                }
            });
        });
    });

    //创建拼团支付请求，发送一个支付链接 --创建/加入
    socket.on('create_group_pay', (data)=>{
        group_pay(data['game_id'], 'create');
    });
    socket.on('join_group_pay', (data)=>{
        group_pay(data['group_id'], 'join');
    });

    /**
     * socket线程使用，拼团创建并发送支付链接
     * @param { game_id/group_id } data 商品号：游戏id或团号
     * @param {String} type 购买类型
     */
    function group_pay(good_id, type){
        IsOnline(
            socket
        ).then(
            (v)=>{
                var No = v[0]['No'];
                if(type == 'create'){//创建拼团订单，订单号 flag-No-game_id
                    var game_id = good_id;
                    var out_trade_no = '1-' + No + '-' + game_id;
                    var sql = 'select * from game_info where game_id=?;';
                    var values = [];
                    values[0] = game_id;
                    conn1.doQuery(
                        sql,
                        values
                    ).then(
                        (v)=>{
                            var game_name = v[0]['game_name'];
                            var cost = v[0]['group_cost'];
                            pay(out_trade_no, game_name, cost);
                        },
                        (v)=>{
                            console.log(No + ' 对游戏 ' + game_id + ' 的拼团创建失败');
                            socket.emit('state', { state: '创建拼团失败' });
                        }
                    )
                }else if(type == 'join'){//参与拼团订单, 订单号 flag-No-group_id
                    var group_id = good_id;
                    var out_trade_no = '2-' + No + '-' + group_id;
                    var sql = 'select game_name, group_cost from group_buy, game_info where group_buy.game_id=game_info.game_id and group_id=?;';
                    var values = [];
                    values[0] = conn1.tosqlString(group_id);
                    conn1.doQuery(
                        sql,
                        values
                    ).then(
                        (v)=>{
                            var game_name = v[0]['game_name'];
                            var group_cost = v[0]['group_cost'];
                            pay(out_trade_no, game_name, group_cost);
                        },
                        (v)=>{
                            console.log(v);
                            console.log(No + ' 对拼团号为 ' + group_id + ' 的拼团加入失败');
                            socket.emit('state', { state: '加入拼团失败' });
                        }
                    )
                }
            },
            (v)=>{

            }
        );
    }
    
    /**
     * socket线程调用，生成并发送一个支付链接
     * @param {String} out_trade_no 商品订单号
     * @param {String} game_name 游戏名称
     * @param {Double} cost 某次订单的花费
     */
    function pay(out_trade_no, game_name, cost) {
        const formData = new AliPayForm();
        formData.setMethod('get');
        formData.addField('notifyUrl', 'http://47.102.201.111:8079/');
        formData.addField('bizContent', {
            outTradeNo: out_trade_no,//订单号
            productCode: 'FAST_INSTANT_TRADE_PAY',//商品代码，不能修改
            totalAmount: cost,//价格，不能为0
            subject: game_name,//商品名称
            body: "商品详情",//商品简介
        });
        try {
            alipaySdk.exec(
                'alipay.trade.page.pay',
                {},
                { formData: formData }
            ).then((v) => {
                console.log(v);
                socket.emit('pay', { url: v });
            }, (v) => {
                console.log(v);
            });
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 查询是否在线
     * @param {socket} socket 
     */
    function IsOnline(socket) {
        var p = new Promise((res, rej) => {
            query_sql = 'select * from online_account where IP_addr=\'' + socket.handshake.address + '\';';
            conn.query(query_sql, (err, result) => {
                if (err) {
                    console.log(err);
                    socket.emit('state', { state: '登录状态异常，请稍后再试' });
                    rej(false);
                } else {
                    if (result.length > 0) {
                        res(result);
                    } else {
                        rej(false);
                    }
                }
            });
        });
        return p;
    }

    /**
     * 反馈游戏id对应的拼团信息
     * @param data { game_id }
     */
    socket.on('groups_require', (data) => {
        game_id = data['game_id'];
        query_sql = 'select * from group_buy, user_account where group_buy.group_owner=user_account.No and game_id=\'' + game_id + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '拼单信息请求失败~_~' });
            } else {
                var i = 0;
                groups = [];
                for (i = 0; i < result.length; i++) {
                    groups[i] = new classes.groupInfo(result[i]);
                }
                socket.emit('group_get', { group_count: groups.length, groups: groups });
            }
        });
    });

    /**
     * @param data
     * {
     *  game_id;
     * }
     */
    socket.on('create_group', (data) => {
        group_operation('create', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('join_group', (data) => {
        group_operation('join', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('quit_group', (data) => {
        group_operation('quit', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('delete_group', (data) => {
        group_operation('delete', data);
    });

    /**
     * 分类型操作拼团
     * @param {String} operation {'create', 'join', 'quit', 'delete'}
     * @param {Map} data 
     */
    function group_operation(operation, data) {
        query_sql = 'select * from online_account where IP_addr=\'' + socket.handshake.address + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '登录状态异常，请稍后再试' });
            } else {
                data['No'] = result[0]['No'];
                if (operation == 'delete') {
                    del(data);
                } else {
                    ndel(operation, data);
                }
            }
        });
    }
    function del(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select * from group_buy where group_id=\'' + group_id + '\' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '查询拼团信息失败，请稍后再试' });
            } else if (result.length >= 1) {
                query_sql = 'delete from group_buy where group_id=\'' + group_id + '\';';
                conn.query(query_sql, (err) => {
                    if (err) {
                        socket.emit('state', { state: '删除拼团信息失败，请稍后再试' });
                        console.log(err);
                        console.log('请手动运行sql语句：' + query_sql);
                    } else {
                        socket.emit('state', { state: '删除拼团信息成功' });
                    }
                });
            } else {
                socket.emit('state', { state: '抱歉，您不是该拼团的团长，无权删除拼团' });
            }
        })
    }
    function ndel(operation, data) {
        if (operation == 'create') {
            create(data);
        }
        //search the group_id
        else {
            ncreate(operation, data);
        }
    }
    function ncreate(operation, data) {
        query_sql = "select group_id from group_buy;"
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length == 0) {
                var tips = {};
                tips['quit'] = '退出';
                tips['join'] = '加入';
                socket.emit('state', { state: '您所要' + tips[operation] + '的拼团不存在' });
            } else if (operation == 'quit') {
                quit(data);
            } else if (operation == 'join') {
                join(data);
            }
        })
    }
    function quit(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select * from join_group where group_id=\'' + group_id + '\' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length <= 0) {
                socket.emit('state', { state: '抱歉，您未加入该拼团，无法退出拼团' });
            } else {
                quit_opt(data);
            }
        });
    }
    function quit_opt(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'delete from join_group where No=' + No + ' and group_id=\'' + group_id + '\';';
        query_sql += 'update group_buy set user_count=user_count-1 where group_id=\'' + group_id + '\';';
        query_sql += 'delete from group_buy where user_count=0;';
        query_sql += 'delete from group_buy where group_owner=' + No + ' and group_id=\'' + group_id + '\';';
        conn.query(query_sql, (err) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '退出拼团失败，请稍后再试' });
            } else {
                socket.emit('state', { state: '退出拼团成功！' });
            }
        });
    }
    function create(data) {
        No = data['No'];
        game_id = data['game_id'];

        query_sql = 'select * from join_group, group_buy where group_buy.group_id=join_group.group_id and game_id=' + game_id + ' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length > 0) {
                multi_join_state();
            } else {
                group_pay(game_id, "create");
            }
        });
    }
    function join(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select game_id from group_buy where group_id=\'' + group_id + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length > 0) {
                query_sql = 'select * from group_buy, join_group where group_buy.group_id=join_group.group_id and game_id=' + result[0]['game_id'] + ' and No=' + No + ';';
                conn.query(query_sql, (err, result) => {
                    if (err) {
                        console.log(err);
                        query_fail_state();
                    } else if (result.length > 0) {
                        multi_join_state();
                    } else {
                        group_pay(group_id, "join");
                    }
                });
            } else {
                socket.emit('state', { state: '拼团信息不存在' });
            }
        });
    }
    function join_opt(data) {
        group_id = data['group_id'];
        No = data['No'];
        query_sql = 'insert into join_group value (\'' + group_id + '\', ' + No + ', \'' + new Date().toLocaleString() + '\');';
        query_sql += 'update group_buy set user_count=user_count+1 where group_id=\'' + group_id + '\';';
        conn.query(query_sql, (err) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '加入拼团失败' });
                if (isLeader) {
                    delete_group(group_id);
                }
            } else {
                socket.emit('state', { state: '加入拼团成功' });
            }
        });
    }
    /**
     * 提示查询拼团状态失败
     */
    function query_fail_state() {
        socket.emit('state', { state: '查询拼团状态失败' });
    }
    /**
     * 提示重复创建或加入
     */
    function multi_join_state() {
        socket.emit('state', { state: '抱歉，您已经加入该游戏的拼团，请勿重复创建或加入' });
    }


    ////////////////////////// post服务器交互部分 //////////////////////////////////////
    socket.on('game_paid', (data)=>{
        send_state(data['No'], '购买成功！');
    });

    socket.on('create_group_paid', (data)=>{
        send_state(data['No'], '创建拼团成功！');
    });

    socket.on('join_group_paid', (data)=>{
        send_state(data['No'], '加入拼团成功！');
    });

    socket.on('game_hasget', (data)=>{
        send_state(data['No'], '游戏购买成功！快去体验吧～');
    });

    /**
     * 直接用用户编号向指定用户发送信息
     * @param {int} No 用户编号
     * @param {String} message 要发送的信息
     */
    function send_state(No, message){
        var No = No;
        var sql = 'select * from online_account where No=?;';
        var values = [];
        values[0] = No;
        conn1.doQuery(
            sql,
            values
        ).then(
            (v)=>{
                var id = v[0]['socket'];
                io.to(id).emit('state', { state: message });
            },
            (v)=>{
                console.log(v);
            }
        );
    }
});
