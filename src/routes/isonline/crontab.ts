/// <reference path="./../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as moment from 'moment';
import { IswinModel } from '../../models/isonline/iswin';
var http = require('http');
var querystring = require('querystring');
var iswin = new IswinModel();

let crontabConfig: any;
let sentContent = '';
let tokenType='IS';

async function sendMoph(req, reply, db) {
  const dateNow = moment().locale('th').format('YYYY-MM-DD');
  let token: any = null;
  let result:any = await getIsToken();
  console.log('IS token', token);
  if (!result || result.statusCode !== 200) {
    const apiKey = process.env.NREFER_APIKEY || 'api-key';
    const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';

    sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";

    const resultToken: any = await getNReferToken(apiKey, secretKey);
    console.log('Refer token', resultToken);
    if (resultToken && resultToken.statusCode === 200 && resultToken.token) {
      token = resultToken.token;
      sentContent += `token ${resultToken.token}\r`;
      tokenType='NREFER';
    } else {
      console.log(`IS autosend 'fail' invalid config.`);
      return false;
    }
  } else {
    token = result.token;
  }

  // const dateStart = moment().subtract(50, 'days').format('YYYY-MM-DD HH:mm:ss');
  const dateStart = moment().subtract(4, 'hours').format('YYYY-MM-DD HH:mm:ss');
  const dateEnd = moment().format('YYYY-MM-DD HH:mm:ss');
  const isData: any = await iswin.getByDate(db, 'lastupdate', dateStart, dateEnd, process.env.HOSPCODE);
  if (isData && isData.length) {
    console.log('Founded: ', isData.length);
    for (let row of isData) {
      const ref = row.ref;
      delete row.ref;
      delete row.lastupdate;
      row.his = row.his ? row.his : process.env.HIS_PROVIDER;

      const sentResult: any = await sendData(row, token);
      console.log('sentResult ', sentResult);
    }
  } else {
    console.log('ISOnline not found any record updated.');
  }
  return '';
}

async function sendingData(dataArray, token) {
  const dataSending = querystring.stringify({
    data: JSON.stringify(dataArray), tokenKey: token
  });

  const url = process.env.IS_URL.split(':');
  const options = {
    hostname: url[1].substr(2),
    port: url[2],
    path: '/isonline/put-is',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + token,
      'Content-Length': Buffer.byteLength(dataSending)
    },
    body: {
      data: dataArray, tokenKey: token
    }
  };
  let ret = '';
  console.log(options.hostname, options.port);
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

    req.write(dataSending);
    req.end();
  });

}

async function sendData(row, tokenKey) {
  const request = require('request');
  const bodyContent = { data: row, token: tokenKey };

  const options = {
    url: process.env.IS_URL + '/isonline/put-is',
    json: true,
    headers: {
      // 'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${tokenKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(bodyContent))
    },
    body: bodyContent
  };

  return new Promise((resolve, reject) => {
    request.post(options, (error, res, body) => {
      if (error) {
        reject(null);
        // return console.log(error);
      } else {
        resolve(body);
      }
    });
  });
}

async function getToken() {
  const request = require('request');

  const options = {
    url: process.env.IS_URL + '/isonline/token',
    json: true,
    body: {
      username: process.env.IS_MOPH_USER,
      password: process.env.IS_MOPH_PASSWORD
    }
  };

  return new Promise((resolve, reject) => {
    request.post(options, (err, res, body) => {
      if (err) {
        reject({ statusCode: 400 });
        // return console.log(err);
      }

      if (body.statusCode == 200 && body.token) {
        resolve(body.token);
      } else {
        reject({ statusCode: 400 });
      }
    });
  });
}

async function getIsToken_() {
  const request = require('request');

  const options = {
    url: process.env.IS_URL + '/isonline/token',
    form: {
      username: process.env.IS_MOPH_USER,
      password: process.env.IS_MOPH_PASSWORD
    }
  };

  console.log('options', options);
  request.post(options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    console.log(body);
    if (body.statusCode == 200 && body.token) {
      return body.token;
    } else {
      return null;
    }
  });
}

async function getIsToken() {
  const isUrl = process.env.IS_URL.split(':');
  const postData = querystring.stringify({
    username: process.env.IS_MOPH_USER,
    password: process.env.IS_MOPH_PASSWORD
  });

  const options = {
    hostname: isUrl[1].substr(2),
    port: +isUrl[2],
    path: '/isonline/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  console.log(options);

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

async function getNReferToken(apiKey, secretKey) {
  let url = process.env.NREFER_URL1;
  url += url.substr(-1, 1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    apiKey: apiKey, secretKey: secretKey
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + '/login/api-key',
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
