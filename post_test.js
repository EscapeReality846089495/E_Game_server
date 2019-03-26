var http = require('http');
var qs = require('querystring');
var conn = require('./database/database_operator');
var outSolve = require('./data_operate/out_trade_noSolve');
var data_operator = require('./data_operate/date_operator');
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
            }
        });
        res.end('success');
    });
    res.end('hello world!');
}).listen(8079);

console.log(data_operator.getDateTime());
//console.log(outSolve.solve("111-100"));