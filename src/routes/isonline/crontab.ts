/// <reference path="./../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as moment from 'moment';
import { IswinModel } from '../../models/isonline/iswin';
var http = require('http');
var querystring = require('querystring');
var iswin = new IswinModel();

let crontabConfig: any;
async function sendMoph(req, reply, db) {
  const token = await getToken();
  if (!token) {
    console.log(`IS autosend 'fail' invalid config.`);
    return false;
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

      const sentResult: any = await sendingData(row, token);
      console.log('sentResult ', ref, sentResult);
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
  const postData = querystring.stringify({
    data: row, tokenKey
  });

  const options = {
    url: process.env.IS_URL + '/isonline/put-is',
    json: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${tokenKey}`,
      'Content-Length': Buffer.byteLength(postData)
    },
    body: {
      data: row, tokenKey
    }
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
        reject(null);
        // return console.log(err);
      }

      if (body.statusCode == 200 && body.token) {
        resolve(body.token);
      } else {
        reject(null);
      }
    });
  });
}

async function getIsToken() {
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


const router = (request: fastify.Request, reply: fastify.Reply, dbConn: any, config = {}) => {
  crontabConfig = config;
  return sendMoph(request, reply, dbConn);
};

module.exports = router;
