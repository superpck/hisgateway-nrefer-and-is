/// <reference path="./../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as moment from 'moment';
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

import { HisEzhospModel } from '../../models/refer/his_ezhosp';
import { HisThiadesModel } from '../../models/refer/his_thiades';
import { HisHosxpv3Model } from '../../models/refer/his_hosxpv3';
import { HisHosxpv4Model } from '../../models/refer/his_hosxpv4';
import { HisJhcisModel } from '../../models/refer/his_jhcis';
import { HisMdModel } from '../../models/refer/his_md';
import { HisKpstatModel } from '../../models/refer/his_kpstat';
import { HisMkhospitalModel } from '../../models/refer/his_mkhospital';
import { HisModel } from '../../models/refer/his';
import { HisNemoModel } from '../../models/refer/his_nemo';
import { HisPmkModel } from '../../models/refer/his_pmk';
import { HisMyPcuModel } from '../../models/refer/his_mypcu';
import { HisHosxpPcuModel } from '../../models/refer/his_hosxppcu';

const hisProvider = process.env.HIS_PROVIDER;
let hisModel: any;
switch (hisProvider) {
  case 'ezhosp':
    hisModel = new HisEzhospModel();
    break;
  case 'thiades':
    hisModel = new HisThiadesModel();
    break;
  case 'hosxpv3':
    hisModel = new HisHosxpv3Model();
    break;
  case 'hosxpv4':
    hisModel = new HisHosxpv4Model();
    break;
  case 'hosxppcu':
    hisModel = new HisHosxpPcuModel();
    break;
  case 'mkhospital':
    hisModel = new HisMkhospitalModel();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new HisNemoModel();
    break;
  case 'ssb':
    // hisModel = new HisSsbModel();
    break;
  case 'infod':
    // hisModel = new HisInfodModel();
    break;
  case 'hi':
    // hisModel = new HisHiModel();
    break;
  case 'himpro':
    // hisModel = new HisHimproModel();
    break;
  case 'jhcis':
    hisModel = new HisJhcisModel();
    break;
  case 'hospitalos':
    // hisModel = new HisHospitalOsModel();
    break;
  case 'jhos':
    // hisModel = new HisJhosModel();
    break;
  case 'pmk':
    hisModel = new HisPmkModel();
    break;
  case 'md':
    hisModel = new HisMdModel();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new HisKpstatModel();
    break;
  case 'mypcu':
    hisModel = new HisMyPcuModel();
    break;
  default:
    hisModel = new HisModel();
}

const hcode = process.env.HOSPCODE;
const his = process.env.HIS_PROVIDER;
const resultText = 'sent_result.txt';
let sentContent = '';
let dcToken: any = '';
let reqToken: any = {};
let crontabConfig: any;
let apiVersion: string = '-';

async function sendMoph(req, reply, db) {
  const dateNow = moment().locale('th').format('YYYY-MM-DD');

  sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";

  reqToken = await getToken();
  if (reqToken && reqToken.statusCode === 200 && reqToken.token) {
    dcToken = reqToken.token;
    sentContent += `token ${reqToken.token}\r`;
  } else {
    console.log('get token error', reqToken.message);
    sentContent += `get token Error:` + JSON.stringify(reqToken) + `\r`;
    writeResult(resultText, sentContent);
    return false;
  }

  const hourNow = +moment().locale('th').get('hours');
  const minuteNow = +moment().locale('th').get('minutes');
  if ((hourNow == 1 || hourNow == 8 || hourNow == 12 || hourNow == 18 || hourNow == 22)
    && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
    const date = moment().locale('th').subtract(1, 'days').format('YYYY-MM-DD');
    // await getRefer_out(db, date);
    // await getReferResult(db, date);
  } else if (hourNow == 3 && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
    // เวลา 03:00 get ย้อนหลัง 1 สัปดาห์
    let oldDate = moment(dateNow).subtract(7, 'days').format('YYYY-MM-DD');
    while (oldDate < dateNow) {
      oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
      // await getService(db, oldDate);
    }
  }

  // await getService(db, '2020-09-18');
  const sendDataCenter = await getService(db, dateNow);
  await expireToken();
  return { sendDataCenter };
}

async function getService(db, date) {
  let sentResult: any = {
    person: { success: 0, fail: 0 },
    service: { success: 0, fail: 0 }
  }

  const rows = await hisModel.getService(db, 'date_serv', date, hcode);
  sentContent += '  - service = ' + rows.length + '\r';
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  if (rows && rows.length) {
    sentResult.service.success = rows.length;
    for (const row of rows) {
      await sendToApi('save-service', row);
      await person(db, row.pid || row.PID, sentResult)
    }
    // const saveResult: any = await sendToApi('save-service', rows);
  }
  console.log(sentResult);
  return sentResult;
}

async function person(db, pid, sentResult) {
  const rows = await hisModel.getPerson(db, 'hn', pid, hcode);
  sentContent += '  - person = ' + rows.length + '\r';
  if (rows && rows.length) {
    rows[0]['FNAME'] = rows[0].NAME || rows[0].name;
    const saveResult: any = await sendToApi('save-person', rows[0]);
    if (saveResult.statusCode == 200) {
      sentResult.person.success += 1;
    } else {
      sentResult.person.fail += 1;
      console.log('save-person', rows[0].HN, saveResult);
    }
    sentContent += '    -- PID ' + rows[0].HN + ' ' + (saveResult.result || saveResult.message) + '\r';
  }
  return rows[0];
}

async function sendToApi(path, dataArray) {
  const dataSending = querystring.stringify({
    hospcode: hcode, data: JSON.stringify(dataArray),
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connect version ' + apiVersion
  });

  const options = {
    hostname: 'connect.moph.go.th',
    port: '',
    path: '/dc-api/data/' + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + dcToken,
      'Content-Length': Buffer.byteLength(dataSending)
    },
    body: {
      hospcode: hcode, data: dataArray,
      processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      sourceApiName: 'HIS connect version',
      sourceApiVersion: apiVersion
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
        console.log(path, data);
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

async function getToken() {
  const apiKey = process.env.NREFER_APIKEY || 'api-key';
  const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';

  let url = process.env.NREFER_URL1;
  url += url.substr(-1, 1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    apiKey: apiKey, secretKey: secretKey,
    source: 'HIS Connect', version: apiVersion
  });

  const options = {
    hostname: 'connect.moph.go.th',
    port: '',
    path: '/dc-api/token',
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

async function expireToken() {
  const options = {
    hostname: 'connect.moph.go.th',
    port: '',
    path: '/dc-api/token/expire/' + reqToken.sessionID,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${reqToken.token}`
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
    req.end();
  });
}

async function writeResult(file, content) {
  fs.writeFile(file, content, async function (err) {
    if (err) {
      console.log(err.message);
    } else {
      let fileDesc: any;
      await fs.stat(resultText, (err, stat) => {
        if (err) {
          console.log(err.message);
        } else {
          fileDesc = stat;
        }
      });
    }
  });
}

const router = (request: fastify.Request, reply: fastify.Reply, dbConn: any, config = {}) => {
  crontabConfig = config;
  apiVersion = crontabConfig.version ? crontabConfig.version : '-';
  return sendMoph(request, reply, dbConn);
};
module.exports = router;
