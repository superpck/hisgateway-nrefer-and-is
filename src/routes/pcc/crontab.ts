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
let nReferToken: any = '';
let crontabConfig: any;
let apiVersion: string = '-';

async function sendMoph(req, reply, db) {
  const dateNow = moment().locale('th').format('YYYY-MM-DD');

  const apiKey = process.env.NREFER_APIKEY || 'api-key';
  const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';

  sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";

  const resultToken: any = await getNReferToken(apiKey, secretKey);
  if (resultToken && resultToken.statusCode === 200 && resultToken.token) {
    nReferToken = resultToken.token;
    sentContent += `token ${resultToken.token}\r`;
  } else {
    console.log('get token error', resultToken.message);
    sentContent += `get token Error:` + JSON.stringify(resultToken) + `\r`;
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
      // await getRefer_out(db, oldDate);
      // await getReferResult(db, oldDate);
      oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
    }
  }

  // await getRefer_out(db, '2020-06-30');
  // const referOut_ = getRefer_out(db, dateNow);
  // const referResult_ = getReferResult(db, dateNow);
  // const referOut = await referOut_;
  // const referResult = await referResult_;
  // return { referOut, referResult };

  const sendDataCenter = getService(db, dateNow);

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
    }
  }

  return sentResult;
}






async function getPerson(db, pid, sentResult) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getPerson(db, 'hn', pid, hcode);
  sentContent += '  - person = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const person = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        CID: row.CID || row.cid,
        PID: row.HN || row.hn || row.PID || row.pid,
        HID: row.HID || row.hid || '',
        HN: row.HN || row.hn || row.PID || row.pid,
        PRENAME: row.PRENAME || row.prename,
        NAME: row.NAME || row.name,
        LNAME: row.LNAME || row.lname,
        SEX: row.SEX || row.sex,
        BIRTH: row.BIRTH || row.birth,
        MSTATUS: row.MSTATUS || row.mstatus,
        OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
        RACE: row.RACE || row.race,
        NATION: row.NATION || row.nation,
        RELIGION: row.RELIGION || row.religion,
        EDUCATION: row.EDUCATION || row.education,
        ABOGROUP: row.ABOGROUP || row.abogroup,
        TELEPHONE: row.TELEPHONE || row.telephone,
        TYPEAREA: row.TYPEAREA || row.typearea,
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-person', person);
      if (saveResult.statusCode === 200) {
        sentResult.person.success += 1;
      } else {
        sentResult.person.fail += 1;
        console.log('save-person', person.HN, saveResult);
      }
      sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function getAddress(db, pid, sentResult) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getAddress(db, 'hn', pid, hcode);
  sentContent += '  - address = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const address = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        ADDRESSTYPE: row.ADDRESSTYPE || row.addresstype,
        ROOMNO: row.ROOMNO || row.roomno,
        HOUSENO: row.HOUSENO || row.HOUSENO,
        CONDO: row.CONDO || row.condo || '',
        SOIMAIN: row.SOIMAIN || row.soimain,
        ROAD: row.ROAD || row.road,
        VILLANAME: row.VILLANAME || row.villaname,
        VILLAGE: row.VILLAGE || row.village,
        TAMBON: row.TAMBON || row.tambon,
        AMPUR: row.AMPUR || row.ampur,
        CHANGWAT: row.CHANGWAT || row.changwat,
        TELEPHONE: row.TELEPHONE || row.telephone || '',
        MOBILE: row.MOBILE || row.mobile || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-address', address);
      if (saveResult.statusCode === 200) {
        sentResult.address.success += 1;
      } else {
        sentResult.address.fail += 1;
        console.log('save address fail', address.PID, saveResult);
      }
      sentContent += '    -- PID ' + address.PID + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function getService_(db, visitNo, sentResult) {
  const rows = await hisModel.getService(db, 'visitNo', visitNo, hcode);
  sentContent += '  - service = ' + rows.length + '\r';
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  if (rows && rows.length) {
    for (const row of rows) {
      const data = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || visitNo,
        HN: row.PID || row.pid || row.HN || row.hn,
        CID: row.CID || row.cid,
        DATE_SERV: row.DATE_SERV || row.date_serv || row.date,
        TIME_SERV: row.TIME_SERV || row.time_serv || '',
        LOCATION: row.LOCATION || row.location || '',
        INTIME: row.INTIME || row.intime || '',
        INSTYPE: row.INSTYPE || row.instype || '',
        INSID: row.INSID || row.insid || '',
        TYPEIN: row.TYPEIN || row.typein || '',
        REFERINHOSP: row.REFERINHOSP || row.referinhosp || '',
        CAUSEIN: row.CAUSEIN || row.causein || '',
        CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
        SERVPLACE: row.SERVPLACE || row.servplace || '',
        BTEMP: row.BTEMP || row.btemp || '',
        SBP: row.SBP || row.sbp || '',
        DBP: row.DBP || row.dbp || '',
        PR: row.PR || row.pr || '',
        RR: row.RR || row.rr || '',
        TYPEOUT: row.TYPEOUT || row.typeout || '',
        REFEROUTHOSP: row.REFEROUTHOSP || row.referouthosp || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        COST: row.COST || row.cost || '',
        PRICE: row.PRICE || row.price || '',
        PAYPRICE: row.PAYPRICE || row.payprice || '',
        ACTUALPAY: row.ACTUALPAY || row.actualpay || '',
        OCCUPATION_NEW: row.OCCUPATION_NEW || row.occupation_new,
        MAIN: row.MAIN || row.main || '',
        HSUB: row.HSUB || row.hsub || row.SUB || row.sub || '',
        SUB: row.SUB || row.sub || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-service', data);
      sentContent += '    -- SEQ ' + data.SEQ + ' ' + (saveResult.result || saveResult.message) + '\r';
      if (saveResult.statusCode === 200) {
        sentResult.service.success += 1;
      } else {
        sentResult.service.fail += 1;
        console.log('save-service', data.SEQ, saveResult);
      }
    }
  }
  return rows;
}

async function getAdmission(db, visitNo) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getAdmission(db, 'visitNo', visitNo, hcode);
  sentContent += '  - admission = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const data = await {
        HOSPCODE: row.HOSPCODE || row.hospcode || hcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || visitNo,
        AN: row.AN || row.an,
        CID: row.CID || row.cid || '',
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit,
        WARDADMIT: row.WARDADMIT || row.wardadmit || '',
        INSTYPE: row.INSTYPE || row.instype || '',
        TYPEIN: row.TYPEIN || row.typein || '',
        REFERINHOSP: row.REFERINHOSP || row.referinhosp || '',
        CAUSEIN: row.CAUSEIN || row.causein || '',
        ADMITWEIGHT: row.ADMITWEIGHT || row.admitweight || 0,
        ADMITHEIGHT: row.ADMITHEIGHT || row.admitheight || 0,
        DATETIME_DISCH: row.DATETIME_DISCH || row.datetime_disch || '',
        WARDDISCH: row.WARDDISCH || row.warddish || '',
        DISCHSTATUS: row.DISCHSTATUS || row.dischstatus || '',
        DISCHTYPE: row.DISCHTYPE || row.disctype || '',
        REFEROUTHOSP: row.REFEROUTHOSP || row.referouthosp || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        COST: row.COST || row.cost || '',
        PRICE: row.PRICE || row.price || '',
        PAYPRICE: row.PAYPRICE || row.payprice || '',
        ACTUALPAY: row.ACTUALPAY || row.actualpay || '',
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        DRG: row.DRG || row.drg || '',
        RW: row.RW || row.rw || 0,
        ADJRW: row.ADJRW || row.adjrw || 0,
        ERROR: row.ERROR || row.error || '',
        WARNING: row.WARNING || row.warning || '',
        ACTLOS: row.ACTLOS || row.actlos || 0,
        GROUPER_VERSION: row.GROUPER_VERSION || row.grouper_version || '',
        CLINIC: row.CLINIC || row.clinic || '',
        MAIN: row.MAIN || row.main || '',
        SUB: row.HSUB || row.hsub || row.SUB || row.sub || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      }

      const saveResult: any = await referSending('/save-admission', data);
      sentContent += '    -- AN ' + data.AN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function referSending(path, dataArray) {
  const dataSending = querystring.stringify({
    hospcode: hcode, data: JSON.stringify(dataArray),
    processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    sourceApiName: 'HIS-connection version ' + apiVersion
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + nReferToken,
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

async function expireToken(token) {
  let url = process.env.NREFER_URL1;
  url += url.substr(-1, 1) === '/' ? '' : '/';

  const postData = querystring.stringify({
    token: token
  });

  const options = {
    hostname: process.env.NREFER_URL,
    port: process.env.NREFER_PORT,
    path: process.env.NREFER_PATH + '/login/expire-token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
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
