/// <reference path="./../../../typings.d.ts" />

var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');
var ip = require("ip");

async function getServiceUrl(config) {

  const url = process.env.MOPH_URL1 || 'http://203.157.103.176/moph-api';
  const mophUrl = url.split('/');

  const dataSending = querystring.stringify({
    hospcode: process.env.HOSPCODE, ip: ip.address()
  });

  const options = {
    hostname: mophUrl[2],
    path: '/' + mophUrl[3] + '/service',
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(dataSending)
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
        if (ret) {
          const data = JSON.parse(ret);
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });

    req.on('error', (e: any) => {
      reject(e);
    });

    req.write(dataSending);
    req.end();
  });

}

const router = async (mophService: any, config = {}) => {
  const ret: any = await getServiceUrl(config);
  if (ret) {
    fastify.mophService = ret.referServer;
    return ret.referServer;
  } else {
    return false;
  }
};
module.exports = router;
