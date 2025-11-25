const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, "../.env"),
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'test1234',
    database: process.env.DB_NAME || 'reactsns',
});

// promise 기반으로 사용할 수 있게 변환
const promisePool = pool.promise();
module.exports = promisePool;