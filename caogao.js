// JS
var fs = require('fs');
const AlipaySdk = require('alipay-sdk').default;

const alipaySdk = new AlipaySdk({
    gateway: 'https://openapi.alipaydev.com/gateway.do',
    appId: '2016092600599785',
    privateKey: fs.readFileSync('keys/应用私钥2048.txt', 'ascii'),
    //privateKey: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxbdAkPLoGS4jtI4VuIZQDaWhbC/mjgzLXaXZg6rbQcRWTY210Oqpknvcj2RXx5RkAXOCYN0yKAIGlSo/a0foz7wQ4/yqcSeBUbXAIHYr08C/TlPqTNrLNgY+2P0GpvPa0z7ZoD48tdIL50W2LOmNUVjrHr0Fnyz1p14oBRrPQJM/lbyERTBxQ9wR1HlqiAfsj9HhKDePLFnR5N6h6KvmCqOc7vphfew/Iu3rcZm/U2Fji2dw9nlGJcBEPwWdbRDe3o9Pns3nG4nf4wD/IySWUsoVlZs9driBvWXSrpmfRxITKaC6GAjKaCvI/3K5mtR5iM1wRvPeWuHwU+lXxqF7dAgMBAAECggEBAKEYg5NjT8PHcVtelReZhTpTylxgUxkTVmYfa0wz0CkRg/V+oTKW0X7qlpoF0NcAm+KocYPDMctbClt5h4O2guYEbmERzS56JSSC+OVlbXVXXxVMfvaLA21z5Xgjlwr2d0lUDtoMxoMO9py8eimfqfA5GsWTal9DOU+QU8001K52OV9HjsnA6+lRu1+rBt5RPd03IGHMiWC5318We/aZAHgETmXggv6SP4CS9yXeToaHPxyGDf6SkbEaHk8unXOieH5AD8Ov+9kZ3jujCPRw2lLBeq+m/pcQPtv5/LIbAS2454CQcoE+HmnQTpJruOYRL43NNfC1HZ2F5FzbkKC+IEECgYEA6c9AzXcei6ZGfFDOr/neHQPVZJOYaEgcH6JueA+n2lv0VtXZ1fB5bLb0VIUs/g379BBoFSvjMtgaCNrIOHK6GNSBEN3KNeuV8O7iEPEEwU27uyeY9lp/vvsF+BYHE9UX624/DBWLMbUs7AEqY0uDnMlVfhuk610J+i+AosBgoDsCgYEAwkS1vBbXOINTYHyH8jSq8JSASIpHlv0lso4AWQqr6S37OxEXuoV+POe1bP86mIKwUJFw+aTC902K1OJiPbLHeE0+X5+y4wjX9QOqz9FBIJifCRVj6sfH7XuEDB+sdikq495LeGhojKpLKWiBGJK3tjElKivgOq2V/miJ9L1vY8cCgYAMpMCEW+Sy+JLnNhd3PLPeLc7kWXbsbLnYnBgNNguFq2NTLs1Q3Gg0kNA1od4E/wyY7ioyuuTWYwlFYU9ifhHCNfukxdmhgNPi64geEmqHaYS1YjbLW6l80mZIPCi10dgxSwztwlx8m6eKO6XnKLY9TEXrQ+NvNuDLPrZeFrki8QKBgQCYjvDQ1ncJUEhHu0PfNvEOoO/lB4KU1hOmltE7G6BJK+zhQ9kIhxDNr4DQKdbQMcFYY/7+bR8WqnReHbHclesDVFWpLnaCyE0fglO/g6rLeE9cCMpAc8dTfe4Cv1TmLgoajFVkJ0oDPTBtQj4vF/jhQNLYvUAHlI34DgxYf/NbvQKBgHYubWkyafwX3EalSCxs0P37XGZMXM1q5TVciCOhmA4lt1sm0TSZQrvmyiTOorZbvA2Q24znN+Co/C9YwWKF39pPc1mJb3DZnUbp9OjlYkN2oRCOkXTvKbizen/dFnISS1ex1dHtdxIBkpX6ExVHgeP36/7vtFMm+AEfo08O4pTz',
    alipayPublicKey: fs.readFileSync('keys/alipay_public_key.txt', 'ascii'),
    //alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA59cB0JQLtvsmGjXV/0V1+C4JIB5CBXTaxPum41iUipblcjNIJMIuriab2Cr3BIiY6WC7oMpUoSuYcJZvN0Q2Fk82BjpWt5ZICdQKA4fJCnMLoAyCfgvw70vIDVaZcF/Y3GC212gg2rK7hpL/sKyFb4zb+jgxV7IOy1/gOKJuQYjWP0tBiq3m2ZzwaSzy9uquzBDlZLSexYNNe14YT0CAgKGLLIlGIaROGMYcmGPHKhKI/41v7dNhCIfe9+nW7yGDRtlnF4PsYI6yfHjeVPUbJArFQGdh1EmSqAFEID7c7UXJWLbPZdO4kzAFHuJfzgvqoQ5KyrXeOK+tCx3+omZKSQIDAQAB'
  });
var AliPayForm = require('alipay-sdk/lib/form').default;

const formData = new AliPayForm();
formData.setMethod('get');

formData.addField('notifyUrl', 'http://47.102.201.111:8079/');
formData.addField('bizContent', {
  outTradeNo: '1-4',//订单号
  productCode: 'FAST_INSTANT_TRADE_PAY',//商品代码
  totalAmount: '0.01',//价格
  subject: '商品',//商品名称
  body: '商品详情',//商品简介
});

try {
  const result = alipaySdk.exec(
    'alipay.trade.page.pay',
    {},
    { formData: formData },
  ).then((v)=>{
    console.log(v);
  }, (v)=>{
    console.log(v);
  });
  // result 为可以跳转到支付链接的 url
  console.log(result);
} catch (err) {
  console.log(err);
}

var io = require('socket.io')(8078);
var i = null;
io.on('connection', (socket)=>{
	socket.on('login', ()=>{
		var x = socket.handshake.address;
		test(x);
	});
	function test(x){
		socket.handshake.address = x;
		i = socket.handshake.address;
		socket.emit('state', { state: 'wow!' });
	}
});