handler.aliGateway = function (req, res, next) {
    let notifyTime = req.body.notify_time;//通知时间:通知的发送时间。格式为yyyy-MM-dd HH:mm:ss
    let notifyType = req.body.notify_type;//通知类型:通知的类型
    let notifyId = req.body.notify_id;//通知校验ID:通知校验ID
    let appId = req.body.app_id;//支付宝分配给开发者的应用Id:支付宝分配给开发者的应用Id
    let charset = req.body.charset;//编码格式:编码格式，如utf-8、gbk、gb2312等
    let version = req.body.version;//接口版本:调用的接口版本，固定为：1.0
    let signType = req.body.sign_type;//签名类型:商户生成签名字符串所使用的签名算法类型，目前支持RSA2和RSA，推荐使用RSA2
    let sign = req.body.sign;//签名:请参考<a href="#yanqian" class="bi-link">异步返回结果的验签</a>
    let tradeNo = req.body.trade_no;//支付宝交易号:支付宝交易凭证号
    let outTradeNo = req.body.out_trade_no;//商户订单号:原支付请求的商户订单号
    let outBizNo = req.body.out_biz_no;//商户业务号:商户业务ID，主要是退款通知中返回退款申请的流水号
    let buyerId = req.body.buyer_id;//买家支付宝用户号:买家支付宝账号对应的支付宝唯一用户号。以2088开头的纯16位数字
    let buyerLogonId = req.body.buyer_logon_id;//买家支付宝账号:买家支付宝账号
    let sellerId = req.body.seller_id;//卖家支付宝用户号:卖家支付宝用户号
    let sellerEmail = req.body.seller_email;//卖家支付宝账号:卖家支付宝账号
    let tradeStatus = req.body.trade_status;//交易状态:交易目前所处的状态，见<a href="#jiaoyi" class="bi-link">交易状态说明</a>
    let totalAmount = req.body.total_amount;//订单金额:本次交易支付的订单金额，单位为人民币（元）
    let receiptAmount = req.body.receipt_amount;//实收金额:商家在交易中实际收到的款项，单位为元
    let invoiceAmount = req.body.invoice_amount;//开票金额:用户在交易中支付的可开发票的金额
    let buyerPayAmount = req.body.buyer_pay_amount;//付款金额:用户在交易中支付的金额
    let pointAmount = req.body.point_amount;//集分宝金额:使用集分宝支付的金额
    let refundFee = req.body.refund_fee;//总退款金额:退款通知中，返回总退款金额，单位为元，支持两位小数
    let subject = req.body.subject;//订单标题:商品的标题/交易标题/订单标题/订单关键字等，是请求时对应的参数，原样通知回来
    let body = req.body.body;//商品描述:该订单的备注、描述、明细等。对应请求时的body参数，原样通知回来
    let gmtCreate = req.body.gmt_create;//交易创建时间:该笔交易创建的时间。格式为yyyy-MM-dd HH:mm:ss
    let gmtPayment = req.body.gmt_payment;//交易付款时间:该笔交易的买家付款时间。格式为yyyy-MM-dd HH:mm:ss
    let gmtRefund = req.body.gmt_refund;//交易退款时间:该笔交易的退款时间。格式为yyyy-MM-dd HH:mm:ss.S
    let gmtClose = req.body.gmt_close;//交易结束时间:该笔交易结束时间。格式为yyyy-MM-dd HH:mm:ss
    let fundBillList = req.body.fund_bill_list;//支付金额信息:支付成功的各个渠道金额信息，详见<a href="#zijin" class="bi-link">资金明细信息说明</a>
    let passbackParams = req.body.passback_params;//回传参数:公共回传参数，如果请求时传递了该参数，则返回给商户时会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
    let voucherDetailList = req.body.voucher_detail_list;//优惠券信息:本交易支付时所使用的所有优惠券信息，详见<a href="#youhui" class="bi-link">优惠券信息说明</a>
 
    let payHelper = new AliPayHelper(DefineProto.AliAccountType.AAT_REMIND);
    let isSuccess = payHelper.verifySign(req.body);
    if (isSuccess) {
        if (tradeStatus === 'TRADE_FINISHED') {//交易状态TRADE_FINISHED的通知触发条件是商户签约的产品不支持退款功能的前提下，买家付款成功；或者，商户签约的产品支持退款功能的前提下，交易已经成功并且已经超过可退款期限。
 
        } else if (tradeStatus === 'TRADE_SUCCESS') {//状态TRADE_SUCCESS的通知触发条件是商户签约的产品支持退款功能的前提下，买家付款成功
 
        } else if (tradeStatus === 'WAIT_BUYER_PAY') {
 
        } else if (tradeStatus === 'TRADE_CLOSED') {
 
        }
        res.send('success');
    } else {
        res.send('fail');
    }
};