//负责支付后信息反馈
var http = require('http');
var qs = require('querystring');
var conn = require('../database/database_operator');
var fs = require('fs');

var io = require('socket.io')(8077);
io.on('connection', (socket)=>{
    console.log(socket.id);
    fs.writeFileSync('socket_test.txt', socket.id, 'utf-8');
});

http.createServer((req, res) => {
    var body = "";
    console.log(req.url);
    req.on('data', (chunk) => {
        body += chunk;
        console.log("chunk:", chunk);
    });

    req.on('end', () => {
        body = qs.parse(body);
        console.log(body['out_trade_no']);//获取订单号，处理付款请求
        var str = fs.readFileSync('socket_test.txt');
        console.log(str);
        io.to(str).emit('post', { data: body });
        res.end('success');
    });
}).listen(8079);

