const mysql = require('mysql')

var poolUsers = mysql.createPool({
    'user': process.env.MYSQL_USER,
    'password': process.env.MYSQL_PASSWORD,
    'database': process.env.MYSQL_DB,
    'host': process.env.MYSQL_HOST,
    'port': process.env.MYSQL_PORT,
})

exports.poolUsers = poolUsers

