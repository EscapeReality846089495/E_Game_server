var http = require('http');
var querystring = require('querystring');
// http.createServer(function (request, response) {
//   console.log('receive request');
//   response.writeHead(200, { 'Content-Type': 'text-plain' });
//   response.end('Hello World\n');
// }).listen(8124);
// console.log("node server start ok  port " + 8124
// );
var server = http.createServer((req, res)=>{
  if(req.url == '/post' && req.method.toLowerCase() === 'post'){
    var alldata = '';
    req.on('data', (chunk)=>{
      alldata += chunk;
    });
    req.on('end', ()=>{
      res.end('success');
      console.log(alldata);
      var dataString = alldata.toString();
      var dataObj = querystring.parse(dataString);
      console.log(dataObj);
      console.log(dataObj.code);
    })
  }
});
server.listen(8079, '127.0.0.1', ()=>{
  console.log('server is started listen port 8079');
});