var http = require('http');
var qs = require('querystring');
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
        res.end('success');
    });
    res.end('hello world!');
}).listen(8079);