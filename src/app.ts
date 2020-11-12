/// <reference path="../typings.d.ts" />

import path = require('path');
import * as HttpStatus from 'http-status-codes';
import * as fastify from 'fastify';
import * as moment from 'moment';

import router from "./router";
import cronjob from './nodecron';

const serveStatic = require('serve-static');
var crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '../config') });
import { Server, IncomingMessage, ServerResponse } from 'http';

import helmet = require('fastify-helmet');

const fastifySession = require('fastify-session');
const fastifyCookie = require('fastify-cookie');
// var cron = require('node-cron');
// var shell = require("shelljs");

const app: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
  logger: {
    level: 'error',
    prettyPrint: true
  },
  bodyLimit: 5 * 1048576,
});

app.apiVersion = '3.1.7';
app.apiSubVersion = '2020.11.12-01';
app.register(router);

app.register(require('fastify-formbody'));
app.register(require('fastify-cors'), {});
app.register(require('fastify-no-icon'));
app.register(helmet, { hidePoweredBy: { setTo: 'PHP 5.2.0' } });
app.register(require('fastify-rate-limit'), {
  max: +process.env.MAX_CONNECTION_PER_MINUTE || 1000000,
  // skipOnError: true,
  // cache: 10000,
  timeWindow: '1 minute'
});

app.use(serveStatic(path.join(__dirname, '../public')));

app.register(require('point-of-view'), {
  engine: {
    ejs: require('ejs')
  }
})

app.register(fastifyCookie);
// app.register(fastifySession, { secret: process.env.SECRET_KEY });

app.register(require('fastify-jwt'), {
  secret: process.env.SECRET_KEY
});

app.register(require('fastify-ws'), {});

// set MOPH Url =========================================
if (!app.mophService) {
  getmophUrl();
}

// HIS connection =========================================
app.register(require('./plugins/db'), {
  connection: createConnectionOption({
    client: process.env.HIS_DB_CLIENT,
    host: process.env.HIS_DB_HOST,
    user: process.env.HIS_DB_USER,
    password: process.env.HIS_DB_PASSWORD,
    dbName: process.env.HIS_DB_NAME,
    port: +process.env.HIS_DB_PORT,
    schema: process.env.HIS_DB_SCHEMA,
    charSet: process.env.HIS_DB_CHARSET,
    encrypt: process.env.HIS_DB_ENCRYPT || true
  }),
  connectionName: 'dbHIS'
});

// nRefer connection =========================================
app.register(require('./plugins/db'), {
  connection: createConnectionOption({
    client: process.env.REFER_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.REFER_DB_HOST || process.env.HIS_DB_HOST,
    port: +process.env.REFER_DB_PORT || +process.env.HIS_DB_PORT,
    user: process.env.REFER_DB_USER || process.env.HIS_DB_USER,
    password: process.env.REFER_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.REFER_DB_NAME || process.env.HIS_DB_NAME,
    schema: process.env.REFER_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.REFER_DB_CHARSET || process.env.HIS_DB_CHARSET || '',
    encrypt: process.env.REFER_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
  }),
  connectionName: 'dbRefer'
});

// ISOnline connection =========================================
app.register(require('./plugins/db'), {
  connection: createConnectionOption({
    client: process.env.IS_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.IS_DB_HOST || process.env.HIS_DB_HOST,
    port: +process.env.IS_DB_PORT || +process.env.HIS_DB_PORT,
    user: process.env.IS_DB_USER || process.env.HIS_DB_USER,
    password: process.env.IS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.IS_DB_NAME || process.env.HIS_DB_NAME,
    schema: process.env.IS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.IS_DB_CHARSET || process.env.HIS_DB_CHARSET,
    encrypt: process.env.IS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
  }),
  connectionName: 'dbISOnline'
});

// dbCannabis connection =========================================
app.register(require('./plugins/db'), {
  connection: createConnectionOption({
    client: process.env.CANNABIS_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.CANNABIS_DB_HOST || process.env.HIS_DB_HOST,
    port: +process.env.CANNABIS_DB_PORT || +process.env.HIS_DB_PORT,
    user: process.env.CANNABIS_DB_USER || process.env.HIS_DB_USER,
    password: process.env.CANNABIS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.CANNABIS_DB_NAME || process.env.HIS_DB_NAME,
    schema: process.env.CANNABIS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.CANNABIS_DB_CHARSET || process.env.HIS_DB_CHARSET,
    encrypt: process.env.CANNABIS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
  }),
  connectionName: 'dbCannabis'
});

// check token ===========================================================
app.decorate("authenticate", async (request, reply) => {
  let token: string = null;

  if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
    token = await request.headers.authorization.split(' ')[1];
  } else if (request.body && request.body.token) {
    token = await request.body.token;
  }

  try {
    const decoded = await request.jwtVerify(token);
  } catch (err) {
    console.log(moment().format('HH:mm:ss.SSS'), 'authenticate fail', err.message);
    reply.send({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED)
    })
  }
});
// end: check token ===========================================================

app.decorate("checkRequestKey", async (request, reply) => {
  let skey = null;
  if (request.headers.localkey) {
    skey = request.headers.localkey;
  }
  var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
  if (!skey || skey !== requestKey) {
    console.log('invalid key', requestKey);
    reply.send({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) + ' or invalid key'
    });
  }

});

app.decorate("serviceMonitoring", async (request, reply) => {
  console.log(moment().locale('th').format('HH:mm:ss'), request.raw.url);
});

app.register(cronjob);

const port = +process.env.PORT || 3001;
const host = '0.0.0.0';

app.listen(port, host, (err) => {
  app.startServerTime = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  if (err) throw err;

  app.ws
    .on('connection', socket => {
      console.log('Client connected.')
      socket.on('message', msg => socket.send(msg))
      socket.on('close', () => console.log('Client disconnected.'))
    })

  app.ws.on('error', error => {
    console.log('WebSocket server error!', error);
  });

  console.log('>>> ', app.startServerTime, `HIS Connection API (${app.apiVersion}) start on port`, port, 'PID', process.pid);
});

function createConnectionOption(config: any) {
  if (['mssql'].includes(config.client)) {
    return {
      client: config.client,
      connection: {
        server: config.host,
        user: config.user,
        password: config.password,
        database: config.dbName,
        encrypt: config.encrypt,
        options: {
          port: +config.port,
          schema: config.schema
        }
      }
    };
  } if (config.client == 'oracledb') {
    return {
      client: config.client,
      caseSensitive: false,
      connection: {
        connectString: `${config.host}/${config.schema}`,
        user: config.user,
        password: config.password,
        port: +config.port,
        externalAuth: false,
        fetchAsString: ['DATE'],
      }
    };
  } if (config.client == 'pg') {
    return {
      client: config.client,
      connection: {
        host: config.host,
        port: +config.port,
        user: config.user,
        password: config.password,
        database: config.dbName,
      },
      pool: {
        min: 0,
        max: 100,
      }
    };
  } else {
    return {
      client: config.client,
      connection: {
        host: config.host,
        port: +config.port,
        user: config.user,
        password: config.password,
        database: config.dbName,
      },
      pool: {
        min: 0,
        max: 7,
        afterCreate: (conn, done) => {
          conn.query('SET NAMES ' + config.charSet, (err) => {
            done(err, conn);
          });
        }
      },
      debug: false,
    };
  }

}

async function getmophUrl() {
  app.mophService = await require('./routes/main/crontab')(app.mophService, {});
}
