var io = require('socket.io-client');
var socket = io.connect('ws://47.102.201.111:8077');

socket.on('post', (data)=>{
    console.log(data);
})