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
    socket.on('store_require', (data) => {
        var sql = 'select * from game_info;';
        conn1.doQuery(
            sql,
            []
        ).then(
            (v)=>{
                console.log(v);
                //构造json
                var game_count = v.length;
                var game = [];
                for (var i = 0;i < game_count;i++){
                    game[i] = new classes.s_game(v[i]);
                }
                // var game_p = new classes.game_part({ game_count: game_count.toString(), game_p: games });
                // console.log(game_p);
                socket.emit('store_response', { game_count: game_count.toString(), game: game });
                
            },
            (v)=>{

            }
        )
    });

    /**
     * 返回广告内容
     * @param data { ad_num }
     */
    socket.on('trans_ad', (data) => {
        var ad_id = data['ad_num'];
        var sql = 'select game_id from ad_info where ad_id=?;';
        var values = [];
        values[0] = ad_id;
        //查询广告内容
        conn1.doQuery(
            sql,
            values
        ).then(
            (v)=>{
                //搜索游戏信息
                var game_id = v[0]['game_id'];
                sql = 'select * from game_info where game_id=?;';
                values = [];
                values[0] = game_id;
                conn1.doQuery(
                    sql,
                    values
                ).then(
                    (v)=>{
                        socket.emit('ad_trans', new classes.game(v[0]));
                    },
                    (v)=>{
                        if(v == 0){
                            socket.emit('state', { state: '该游戏已下架，再看看别的游戏吧～' });
                        } else if(v == undefined){
                            socket.emit('state', { state: '查询游戏库失败，请稍后再试' });
                        }
                    }
                );
            },
            (v)=>{
                if(v == 0){
                    socket.emit('state', { state: '该广告已下架，再看看别的游戏吧～' });
                }else if(v == undefined){
                    socket.emit('state', { state: '查询游戏库失败，请稍后再试' });
                }
            }
        )
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
            var No = v[0]['No'];
            var game_id = data['game_id'];
            var sql = 'select * from own where No=? and game_id=?;';
            var values = [];
            values[0] = No;
            values[1] = game_id;
            conn1.doQuery(
                sql,
                values
            ).then(
                (v)=>{
                    socket.emit('state', { state: '您已购买该游戏，不能重复购买' });
                },
                (v)=>{
                    if(v == undefined){
                        socket.emit('state', { state: '查询游戏库失败，请稍后再试' });
                    } else if(v == 0){
                        var out_trade_no = '0' + '-' + No + '-' + game_id;
                        var query_sql = 'select game_name, cost from game_info where game_id=' + game_id + ';';
                        conn.query(query_sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                pay(out_trade_no, result[0]['game_name'], result[0]['cost']);
                            }
                        });
                    }
                }
            )

        });
    });

    // //创建拼团支付请求，发送一个支付链接
    // socket.on('create_group_pay', (data) => {
    //     group_pay(data['game_id'], 'create');
    // });

    // //加入拼团支付请求，发送一个支付链接
    // socket.on('join_group_pay', (data) => {
    //     group_pay(data['group_id'], 'join');
    // });

    /**
     * socket线程使用，拼团创建并发送支付链接
     * @param { game_id/group_id } data 商品号：游戏id或团号
     * @param {String} type 购买类型 'join'/'create'
     */
    function group_pay(good_id, type) {
        IsOnline(
            socket
        ).then(
            (v) => {
                var No = v[0]['No'];
                if (type == 'create') {//创建拼团订单，订单号 flag-No-game_id
                    var game_id = good_id;
                    var out_trade_no = '1-' + No + '-' + game_id;
                    var sql = 'select * from game_info where game_id=?;';
                    var values = [];
                    values[0] = game_id;
                    conn1.doQuery(
                        sql,
                        values
                    ).then(
                        (v) => {
                            var game_name = v[0]['game_name'];
                            var cost = v[0]['group_cost'];
                            pay(out_trade_no, game_name + '（拼团发起）', cost);
                        },
                        (v) => {
                            console.log(No + ' 对游戏 ' + game_id + ' 的拼团创建失败');
                            socket.emit('state', { state: '创建拼团失败' });
                        }
                    )
                } else if (type == 'join') {//参与拼团订单, 订单号 flag-No-group_id
                    var group_id = good_id;
                    var out_trade_no = '2-' + No + '-' + group_id;
                    var sql = 'select game_name, group_cost from group_buy, game_info where group_buy.game_id=game_info.game_id and group_id=?;';
                    var values = [];
                    values[0] = (group_id);
                    conn1.doQuery(
                        sql,
                        values
                    ).then(
                        (v) => {
                            var game_name = v[0]['game_name'];
                            var group_cost = v[0]['group_cost'];
                            pay(out_trade_no, game_name + '（拼团加入）', group_cost);
                        },
                        (v) => {
                            console.log(v);
                            console.log(No + ' 对拼团号为 ' + group_id + ' 的拼团加入失败');
                            socket.emit('state', { state: '加入拼团失败' });
                        }
                    )
                }
            },
            (v) => {

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
        out_trade_no += '-' + new Date().toLocaleString();
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

    //处理创建拼团请求
    socket.on('create_group', (data) => {
        IsOnline(
            socket
        ).then(
            (v) => {
                var No = v[0]['No'];
                var game_id = data['game_id'];
                var sql = 'select * from game_info where game_id=?;';
                var values = [];
                values[0] = game_id;
                conn1.doQuery(
                    sql,
                    values
                ).then(
                    (v) => {
                        //游戏信息存在                
                        sql = 'select * from own where game_id=? and No=?;';
                        values = [];
                        values[0] = game_id;
                        values[1] = No;
                        //查询用户是否已拥有该游戏
                        conn1.doQuery(
                            sql,
                            values
                        ).then(
                            (v) => {
                                //查询结果不为空，则视为拥有该游戏，不能够再次创建拼团
                                socket.emit('state', { state: '您已拥有该游戏，不能再创建该游戏的拼团' });
                            },
                            (v) => {
                                if (v == undefined) {
                                    socket.emit('state', { state: '查询游戏库失败，请稍后再试' });
                                } else if (v == 0) {
                                    //查询是否正在该游戏的拼团中
                                    sql = 'select * from group_buy, join_group where group_buy.group_id=join_group.group_id and No=? and game_id=?;';
                                    values = [];
                                    values[0] = No;
                                    values[1] = game_id;
                                    conn1.doQuery(
                                        sql,
                                        values
                                    ).then(
                                        (v) => {
                                            socket.emit('state', { state: '您正在进行该游戏的拼团，不能再创建该游戏的拼团' });
                                        },
                                        (v) => {
                                            if (v == undefined) {
                                                socket.emit('state', { state: '查询拼团信息失败，请稍后再试' });
                                            } else if (v == 0) {
                                                //查询结果为空，并未拥有该游戏，可创建拼团
                                                //拉起拼团支付
                                                group_pay(game_id, 'create');
                                            }
                                        }
                                    )
                                }
                            }
                        );

                    },
                    (v)=>{
                        if(v == undefined){
                            socket.emit('state', { state: '查询游戏信息失败，请稍后再试' });
                        } else if(v == 0){
                            socket.emit('state', { state: '该游戏不存在' });
                        }
                    }
                )
            },
            (v)=>{
                socket.emit('state', { state: '登录状态异常，请重新登录' });
            }
        )
    });

    //处理加入拼团请求
    socket.on('join_group', (data) => {
        //查找在线IP对应的用户
        IsOnline(
            socket
        ).then(
            //用户已登录
            (v)=>{
                //查询拼团是否有效
                var No = v[0]['No'];
                var group_id = data['group_id'];
                var sql = 'select * from group_buy where group_id=?;';
                var values = [];
                values[0] = group_id;
                conn1.doQuery(
                    sql,
                    values
                ).then(
                    //拼团有效
                    (v)=>{
                        //验证是否重复加入同一游戏的拼团
                        var game_id = v[0]['game_id'];
                        sql = 'select * from join_group, group_buy where join_group.group_id=group_buy.group_id and No=? and game_id=?;';
                        values = [];
                        values[0] = No;
                        values[1] = game_id;
                        conn1.doQuery(
                            sql,
                            values
                        ).then(
                            (v)=>{
                                socket.emit('state', { state: '您已加入该游戏的拼团，请勿重复加入' });
                            },
                            (v)=>{
                                if(v == undefined){
                                    socket.emit('state', { state: '查询信息失败，请稍后再试' });
                                } else if (v == 0){
                                    //查询是否已拥有该游戏
                                    sql = 'select * from own where No=? and game_id=?;';
                                    values = [];
                                    values[0] = No;
                                    values[1] = game_id;
                                    conn1.doQuery(
                                        sql,
                                        values
                                    ).then(
                                        (v)=>{
                                            socket.emit('state', { state: '您已拥有该游戏，不能再加入该游戏的拼团' });
                                        },
                                        (v)=>{
                                            if(v == undefined){
                                                socket.emit('state', { state: '查询游戏库信息失败，请稍后再试' });
                                            } else if(v == 0){
                                                //进行支付
                                                group_pay(group_id, 'join');
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    },
                    (v)=>{
                        if(v == undefined){
                            socket.emit('state', { state: '查询订单失败，请稍后再试' });
                        } else if (v == 0){
                            socket.emit('state', { state: '订单已失效' });
                        }
                    }
                )
            },
            (v)=>{
                socket.emit('state', { state: '登录状态异常，请重新登录' });
            }
        )
    });

    //处理退款请求（创建拼团退款、加入拼团退款）
    socket.on('payback', (data)=>{
        IsOnline(
            socket
        ).then(
            (v)=>{
                var No = v[0]['No'];
                var group_id = data['group_id'];
                var sql = 'select * from group_buy where group_id=? and group_owner=?;';
                var values = [];
                values[0] = group_id;
                values[1] = No;
                conn1.doQuery(
                    sql,
                    values
                ).then(
                    (v)=>{
                        del({ No: No, group_id: group_id });
                    },
                    (v)=>{
                        if(v == 0){
                            quit({ No: No, group_id: group_id });
                        } else {
                            socket.emit('state', { state: '订单查询失败，请稍后再试' });
                        }
                    }
                )
            },
            (v)=>{
                socket.emit('登录状态异常，请重新登录');
            }
        )
    });

    /**
     * 为指定用户删除拼团处理退款
     * @param { No: int, group_id: string} data 退款信息
     */
    function del(data) {
        //搜索购买信息
        var No = data['No'];
        var group_id = data['group_id'];
        var sql = 'select * from buy where No=? and group_id=? and state=0;';
        var values = [];
        values[0] = No;
        values[1] = group_id;
        conn1.doQuery(
            sql,
            values
        ).then(
            (v)=>{
                //退款
                var out_trade_no = v[0]['out_trade_no'];
                var cost = v[0]['cost'];
                payback(out_trade_no, cost);
                //更新购买信息
                sql = 'update buy set state=-1 where out_trade_no=? and state=0;';
                values = [];
                values[0] = out_trade_no;
                //更新拼团信息
                sql += 'delete from group_buy where group_id=?;';
                values[1] = group_id;
                conn1.doUpdate(
                    sql,
                    values
                ).then(
                    (v)=>{
                        socket.emit('state', { state: '删除拼团成功' });
                    },
                    (v)=>{
                        socket.emit('state', { state: '删除拼团失败，请联系商家' })
                    }
                );
            },
            (v)=>{
                if(v == undefined){
                    socket.emit('state', { state: '查询订单失败，请稍后再试' });
                } else if(v == 0){
                    socket.emit('state', { state: '订单不存在' });
                }
            }
        )
    }

    /**
     * 为指定用户退出拼团处理退款
     * @param { No: int, group_id: string} data 退款信息
     */
    function quit(data) {
        //寻找活期的指定的拼团订单
        var No = data['No'];
        var group_id = data['group_id'];
        var sql = 'select * from buy where No=? and group_id=? and state=0;';
        var values = []
        values[0] = No;
        values[1] = (group_id);
        conn1.doQuery(
            sql,
            values
        ).then(
            (v) => {
                //退款
                var out_trade_no = v[0]['out_trade_no'];
                var cost = v[0]['cost'];
                payback(out_trade_no, cost);
                //异步进行数据库更新
                //使订单失效
                sql = 'update buy set state=-1 where out_trade_no=? and state=0;';
                values = [];
                values[0] = (out_trade_no);
                //退出拼团
                sql += 'delete from join_group where No=? and group_id=?;';
                values[1] = No;
                values[2] = (group_id);
                //更新拼团人数
                sql += 'update group_buy set user_count=user_count-1 where group_id=?;';
                values[3] = (group_id);
                conn1.doUpdate(
                    sql,
                    values
                ).then(
                    (v) => {
                        socket.emit('state', { state: '退出拼团成功，退款将原路返回到您的账户' });
                        console.log('用户 ' + No + ' 退出拼团 ' + group_id + ' 成功');
                    },
                    (v) => {
                        socket.emit('state', { state: '退出拼团失败' });
                        console.log('用户 ' + No + ' 退出拼团 ' + group_id + ' 失败');
                    }
                );

            }, (v) => {
                if(v == 0){
                    socket.emit('state', { state: '您尚未加入该拼团' });
                } else if(v == undefined){
                    socket.emit('state', { state: '查询拼团信息失败，请稍后再试' });
                }
            }
        );
    }

    //处理搜索请求，返回模糊搜索的游戏结果
    socket.on('main_search', (data)=>{
        var search_key = data['search'];
        var real_key = '%';
        for (var i = 0;i < search_key.length;i++){
            real_key += search_key[i];
            real_key += '%';
        }
        var sql = 'select * from game_info where game_name like ?;';
        var values = [];
        values[0] = real_key;
        conn1.doQuery(
            sql,
            values
        ).then(
            (v)=>{
                console.log(v);
                var game_count = v.length;
                var games = [];
                for (var i = 0;i < game_count;i++){
                    games[i] = new classes.gamepart_info(v[i]);
                }
                socket.emit('rearch_response', { game_count: game_count.toString(), game_p: games });
            },
            (v)=>{
                if(v == 0){
                    socket.emit('rearch_response', { game_count: '0' });
                }else{
                    socket.emit('state', { state: '查询失败，请稍后再试' });
                }
            }
        );
    });

    //处理用户信息搜索请求，返回用户完整信息
    socket.on('user_require', ()=>{
        //查询IP对应的在线用户信息
        IsOnline(
            socket
        ).then(
            (v)=>{
                var No = v[0]['No'];
                var sql = 'select * from user_account where No=?;';
                var values = [];
                values[0] = No;
                conn1.doQuery(
                    sql,
                    values
                ).then(
                    (v)=>{
                        var user_id = v[0]['user_id'];
                        var user_name = v[0]['username'];
                        var user_pict = null;
                        if(v[0]['head_pict'] != null){
                            user_pict = base64transformer.anyToBase64(v[0]['head_pict']);
                        }
                        var user_password = "";
                        var user_birth = v[0]['birth'].toLocaleString();
                        var user_sex;
                        if(v[0]['sex'] == 0){
                            user_sex = false;
                        } else {
                            user_sex = true;
                        }
                        var user_contents = v[0]['user_contents'];
                        var game_counts;
                        var games = [];
                        //查找购买游戏、拼团游戏信息
                        sql = 'select * from buy, game_info where buy.game_id=game_info.game_id and No=? and state<>-1;';
                        values = [];
                        values[0] = No;
                        conn1.doQuery(
                            sql,
                            values
                        ).then(
                            (v)=>{
                                game_counts = v.length;
                                for(var i = 0;i < game_counts;i++){
                                    v[i]['buy_time'] = v[i]['datetime'].toLocaleString();
                                    v[i]['isbought'] = true;
                                    if(v[i]['state'] == 0){
                                        v[i]['isbought'] = false;
                                    }
                                    games[i] = new classes.games_info(v[i]);
                                }
                                socket.emit('user_info', {
                                    user_id: user_id, 
                                    user_name: user_name,
                                    user_pict: user_pict,
                                    user_password: user_password,
                                    user_birth: user_birth,
                                    user_sex: user_sex.toString(),
                                    user_contents: user_contents,
                                    game_counts: game_counts,
                                    games: games
                                });
                            },
                            (v)=>{
                                if(v == 0){
                                    game_counts = 0;
                                    socket.emit('user_info', {
                                        user_id: user_id,
                                        user_name: user_name,
                                        user_pict: user_pict,
                                        user_password: user_password,
                                        user_birth: user_birth,
                                        user_sex: user_sex.toString(),
                                        user_contents: user_contents,
                                        game_counts: game_counts,
                                        games: games
                                    });
                                }else if(v == undefined){
                                    socket.emit('state', { state: '获取用户信息失败，请稍后再试' });
                                }
                            }
                        )
                    },
                    (v)=>{
                        socket.emit('state', { state: '获取用户信息失败，请稍后再试' });
                    }
                )
            },
            (v)=>{
                socket.emit('state', { state: '用户登录状态异常，请重新登录' });
            }
        )
    });

    ////////////////////////// post服务器交互部分 //////////////////////////////////////
    socket.on('game_paid', (data) => {
        send_state(data['No'], '购买成功！');
    });

    socket.on('create_group_paid', (data) => {
        send_state(data['No'], '创建拼团成功！');
    });

    socket.on('join_group_paid', (data) => {
        send_state(data['No'], '加入拼团成功！');
    });

    socket.on('game_hasget', (data) => {
        send_state(data['No'], '游戏购买成功！快去体验吧～');
    });

    /**
     * 直接用用户编号向指定用户发送信息
     * @param {int} No 用户编号
     * @param {String} message 要发送的信息
     */
    function send_state(No, message) {
        var No = No;
        var sql = 'select * from online_account where No=?;';
        var values = [];
        values[0] = No;
        conn1.doQuery(
            sql,
            values
        ).then(
            (v) => {
                var id = v[0]['socket'];
                io.to(id).emit('state', { state: message });
            },
            (v) => {
                console.log(v);
            }
        );
    }
});

/**
 * 订单退款
 * @param { String } out_trade_no 订单号
 * @param { Float } cost 退款金额
 */
function payback(out_trade_no, cost) {
    //退款
    var formData = new AliPayForm();
    formData.setMethod('get');

    formData.addField('notifyUrl', 'http://47.102.201.111:8079/');
    formData.addField('bizContent', {
        outTradeNo: out_trade_no,//订单号
        refund_amount: cost//退款金额
    });

    try {
        const result = alipaySdk.exec(
            'alipay.trade.refund',
            {},
            { formData: formData },
        ).then((v) => {
            console.log(v);
        }, (v) => {
            console.log(v);
        });
        // result 为可以跳转到支付链接的 url
        console.log(result);
    } catch (err) {
        console.log(err);
    }
}
