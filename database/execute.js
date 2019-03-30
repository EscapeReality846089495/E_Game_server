var conn = require('./database_operator');
conn.connect();
/**
 * 执行select类型的sql语句
 * @param { String } sql 需要执行的select类sql语句，变量用'?'替代
 * @param {*} values 替代sql语句中'?'的值
 * @returns { p:Promise } 执行sql语句的promise对象，对象返回值{ undefined:'执行出现错误', null:'无查询结果', result:查询结果 }
 */
function doQuery(sql, values){
    sql = addValues(sql, values);
    return p = new Promise((res, rej)=>{
        conn.query(sql, (err, result)=>{
            if(err){
                console.log(err);
                rej(undefined);
            }else if(result.length <= 0){
                rej(null);
            }else{
                res(result);
            }
        });
    });
}

/**
 * 执行update类型的sql语句
 * @param { String } sql 需要执行的update类sql语句，变量用'?'替代
 * @param {*} values 替代sql语句中'?'的值
 * @returns { p:Promise } 执行sql语句的promise对象，对象返回值{ 0:'更新失败', 1:'更新成功' }
 */
function doUpdate(sql, values){
    sql = addValues(sql, values);
    return p = new Promise((res, rej)=>{
        conn.query(sql, (err)=>{
            if(err){
                console.log(err);
                rej(err);
            }else{
                res();
            }
        });
    });
}

/**
 * 编辑sql语句，将values的值换入sql语句中
 * @param { String } sql 需要编辑的sql语句，变量用'?'替代
 * @param {*} values 替换'?'的值
 */
function addValues(sql, values){
    for(var i = 0;i < values.length;i++){
        if(typeof(values[i]) == "string"){
            values[i] = tosqlString(values[i]);
        }
        sql = sql.replace('?', values[i]);
    }
    return sql;
}

/**
 * 将字符串转化为sql语句中可插入的字符串
 * @param { String } str 需要编辑的字符串
 * @returns { str } 返回操作后的字符串
 */
function tosqlString(str){
    return '\'' + str + '\'';
}

module.exports = { doUpdate, doQuery, tosqlString };