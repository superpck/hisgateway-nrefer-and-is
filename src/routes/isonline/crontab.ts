/// <reference path="./../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as moment from 'moment';
var http = require('http');
var querystring = require('querystring');

let crontabConfig: any;
async function sendMoph(req, reply, db) {
  console.log('Crontab IS-Online', moment().locale('th').format('HH:mm:ss.SSS'));
  console.log(crontabConfig);

  const token = await getIsToken();
  console.log('token', token);

  return '';
}

async function getIsToken() {
  const postData = querystring.stringify({
    username: process.env.IS_MOPH_USER,
    password: process.env.IS_MOPH_PASSWORD
  });

  const url = process.env.IS_URL.split(':');
  const options = {
    hostname: url[0] + ':' + url[1],
    port: +url[2],
    path: '/isonline/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let ret = '';
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        ret += chunk;
      });
      res.on('end', () => {
        const data = JSON.parse(ret);
        // console.log('ret', data);
        resolve(data);
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });

}


const router = (request: fastify.Request, reply: fastify.Reply, dbConn: any, config = {}) => {
  crontabConfig = config;
  return sendMoph(request, reply, dbConn);
};

module.exports = router;
