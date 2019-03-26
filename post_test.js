var http = require('http');
var qs = require('querystring');
var conn = require('./database/database_operator');
var outSolve = require('./data_operate/out_trade_noSolve');
var data_operator = require('./data_operate/date_operator');

//向本地8078的客户端际服务器发送消息
var io = require('socket.io-client');
var socket = io('ws://127.0.0.1:8078');

http.createServer((req, res)=>{
    var body = "";
    console.log(req.url);
    req.on('data', (chunk)=>{
        body += chunk;
        console.log("chunk:", chunk);
    });

    req.on('end', ()=>{
        body = qs.parse(body);
        console.log(body['out_trade_no']);//获取订单号，处理付款请求
        var tmp = outSolve.solve(body['out_trade_no']);
        var No = tmp.No;
        var game_id = tmp.game_id;
        var query_sql = 'insert into buy value (\'' + body['out_trade_no'] + '\', ' + game_id + ', ' + No + ', \'' + data_operator.getDateTime() + '\');';
        console.log(query_sql);
        conn.query(query_sql, (err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('yes');
                query_sql = 'select socket from online_account where No=' + No + ';';
                conn.query(query_sql, (err, result)=>{
                    if(err){
                        console.log(err);
                    }else if(result.length > 0){
                        socket.emit('paid', { socket: result[0]['socket'] });
                    }
                })
            }
        });
        res.end('success');
    });
}).listen(8079);

console.log(data_operator.getDateTime());
//console.log(outSolve.solve("111-100"));