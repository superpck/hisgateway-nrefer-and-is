/// <reference path="../typings.d.ts" />

import path = require('path');
import * as fastify from 'fastify';
require('dotenv').config({ path: path.join(__dirname, '../config') });

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    },
    pool: { min: 0, max: 3 } //Menggunakan fungsi pool agar menjaga koneksi ke DB tetep tersambung
});

module.exports = knex;
