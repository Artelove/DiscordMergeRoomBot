const PostgresClient = require('pg');

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'testMergeRoom',
    password: 'postgres',
    port: 5432,
};
let connectionPool = new PostgresClient.Pool(config);

module.exports = connectionPool;
