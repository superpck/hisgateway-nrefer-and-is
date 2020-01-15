/// <reference path="./../../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as moment from 'moment';
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
const request = require('request');

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
  case 'hosxppcu':
    // hisModel = new HisHosxppcuModel();
    break;
  case 'hospitalos':
    // hisModel = new HisHospitalOsModel();
    break;
  case 'jhos':
    // hisModel = new HisJhosModel();
    break;
  case 'pmk':
    // hisModel = new HisPmkModel();
    break;
  case 'md':
    hisModel = new HisMdModel();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new HisKpstatModel();
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

async function sendMoph(req, reply, db) {
  const dateNow = moment().locale('th').format('YYYY-MM-DD');
  // console.log(moment().locale('th').format('HH:mm:ss.SSS'), '\rcronjob start');

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
  if (hourNow < 8 || hourNow === 12 ||
    hourNow === 18 || hourNow === 22) {
    const date = moment().locale('th').subtract(1, 'days').format('YYYY-MM-DD');
    await startSending(req, reply, db, date);
  }

  await startSending(req, reply, db, dateNow);
}

async function startSending(req, reply, db, date) {
  console.log(moment().locale('th').format('HH:mm:ss.SSS'), 'get data', date);
  const referOut: any = await getReferOut(db, date);
}

async function getReferOut(db, date) {
  // sentContent += 'REFERID,HN,SEQ,REFER_DATE\r';
  try {
    const referout = await hisModel.getReferOut(db, date, hcode);
    sentContent += `\rsave refer_history ${date} \r`;
    // await sendReferOutAll(referout)
    sentContent += `\rsave refer service data ${date} \r`;
    let index = 0;
    let sentResult: any = {
      referout: { success: 0, fail: 0 },
      person: { success: 0, fail: 0 },
      service: { success: 0, fail: 0 },
      diagnosisOpd: { success: 0, fail: 0 },
      procedureOpd: { success: 0, fail: 0 },
      drugOpd: { success: 0, fail: 0 },
    };
    for (const row of referout) {
      const hn = row.hn || row.HN;
      const seq = row.seq || row.SEQ;
      const referid = row.REFERID || row.referid;
      sentContent += (index + 1) + '. refer no.' + row.referid + ', hn ' + row.hn + ', seq ' + row.seq + '\r';

      const saverefer = await sendReferOut(row, sentResult);
      const person = await getPerson(db, hn, sentResult);
      const service = await getService(db, seq, sentResult);
      const diagnosisopd = await getDiagnosisOpd(db, seq, sentResult);
      const procedureopd = await getProcedureOpd(db, seq, sentResult);
      const drugopd = await getDrugOpd(db, seq, sentResult);
      const ipd = await getAdmission(db, seq);

      const an = ipd && ipd.length ? ipd[0].an : '';
      const procedureIpd = await getProcedureIpd(db, an);

      // const drug_ipd = await getDrugIpd(db, an);

      const investigation_refer = await getLabResult(db, seq, referid);

      index += 1;
      if (referout.length <= index) {
        sentContent += moment().locale('th').format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
        await writeResult(resultText, sentContent);
        console.log(moment().locale('th').format('HH:mm:ss.SSS'), 'finished...');
      }
    }
    console.log('sent result', sentResult);
    return referout;
  } catch (error) {
    console.log('crontab error:', error.message)
    sentContent += moment().locale('th').format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
    return [];
  }
}

async function sendReferOut(row, sentResult) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  if (row) {
    const data: any = await {
      HOSPCODE: row.HOSPCODE || row.hospcode,
      REFERID: row.REFERID || row.referid,
      PID: row.PID || row.pid || row.HN || row.hn,
      SEQ: row.SEQ || row.seq || '',
      AN: row.AN || row.an || '',
      CID: row.CID || row.cid,
      DATETIME_SERV: row.DATETIME_SERV || row.REFER_DATE || row.refer_date,
      DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
      DATETIME_REFER: row.DATETIME_REFER || row.REFER_DATE || row.refer_date || '',
      HOSP_DESTINATION: row.HOSP_DESTINATION || row.hosp_destination,
      REFERID_ORIGIN: row.REFERID_ORIGIN || row.referid_origin || '',
      HOSPCODE_ORIGIN: row.HOSPCODE_ORIGIN || row.hospcode_origin || '',
      CLINIC_REFER: row.CLINIC_REFER || row.clinic_refer || '',
      CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
      PHYSICALEXAM: row.PHYSICALEXAM || row.physicalexam || '',
      DIAGFIRST: row.DIAGFIRST || row.diagfirst || '',
      DIAGLAST: row.DIAGLAST || row.diaglast || '',
      PSTATUS: row.PSTATUS || row.ptstatus || '',
      PTYPE: row.PTYPE || row.ptype || '',
      EMERGENCY: row.EMERGENCY || row.emergency || '',
      PTYPEDIS: row.PTYPEDIS || row.ptypedis || '',
      CAUSEOUT: row.CAUSEOUT || row.causeout || '',
      REQUEST: row.REQUEST || row.request || '',
      PROVIDER: row.PROVIDER || row.provider || '',
      D_UPDATE: row.D_UPDATE || row.d_update || d_update,
      his: his,
      typesave: 'autosent'
    }
    data.REFERID_PROVINCE = data.HOSPCODE + data.REFERID;
    const saveResult: any = await referSending('/save-refer-history', data);
    // console.log('sent refer result', data.REFERID, saveResult);
    if (saveResult.statusCode === 200) {
      sentResult.referout.success += 1;
    } else {
      sentResult.referout.fail += 1;
      console.log(data.REFERID, saveResult);
    }
    sentContent += '  - refer_history ' + data.REFERID + ' ' + (saveResult.result || saveResult.message) + '\r';
    return saveResult;
  } else {
    return null;
  }
}

async function sendReferOutRows(rows) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  sentContent += 'refer_out = ' + rows.length + '\r';
  if (rows && rows.length) {
    let rowsSave = [];
    for (const row of rows) {
      const data: any = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        REFERID: row.REFERID || row.referid,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || '',
        AN: row.AN || row.an || '',
        CID: row.CID || row.cid,
        DATETIME_SERV: row.DATETIME_SERV || row.REFER_DATE || row.refer_date,
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
        DATETIME_REFER: row.DATETIME_REFER || row.REFER_DATE || row.refer_date || '',
        HOSP_DESTINATION: row.HOSP_DESTINATION || row.hosp_destination,
        REFERID_ORIGIN: row.REFERID_ORIGIN || row.referid_origin || '',
        HOSPCODE_ORIGIN: row.HOSPCODE_ORIGIN || row.hospcode_origin || '',
        CLINIC_REFER: row.CLINIC_REFER || row.clinic_refer || '',
        CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
        PHYSICALEXAM: row.PHYSICALEXAM || row.physicalexam || '',
        DIAGFIRST: row.DIAGFIRST || row.diagfirst || '',
        DIAGLAST: row.DIAGLAST || row.diaglast || '',
        PSTATUS: row.PSTATUS || row.ptstatus || '',
        PTYPE: row.PTYPE || row.ptype || '',
        EMERGENCY: row.EMERGENCY || row.emergency || '',
        PTYPEDIS: row.PTYPEDIS || row.ptypedis || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        REQUEST: row.REQUEST || row.request || '',
        PROVIDER: row.PROVIDER || row.provider || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
        his: his,
        typesave: 'autosent'
      }

      await rowsSave.push(data);

      data.REFERID_PROVINCE = data.HOSPCODE + data.REFERID;
      const saveResult = await referSending('/save-refer-history', data);
      // console.log(data.REFERID, saveResult);
      sentContent += ' -- ' + data.REFERID + ' ' + JSON.stringify(saveResult) + '\r';
    }
  }
  return rows;
}

async function sendReferOutAll(rows) {
  let rowsSave = [];
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  sentContent += 'refer_out = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const data: any = await {
        HOSPCODE: row.HOSPCODE || row.hospcode,
        REFERID: row.REFERID || row.referid,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || '',
        AN: row.AN || row.an || '',
        CID: row.CID || row.cid,
        DATETIME_SERV: row.DATETIME_SERV || row.REFER_DATE || row.refer_date,
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
        DATETIME_REFER: row.DATETIME_REFER || row.REFER_DATE || row.refer_date || '',
        HOSP_DESTINATION: row.HOSP_DESTINATION || row.hosp_destination,
        REFERID_ORIGIN: row.REFERID_ORIGIN || row.referid_origin || '',
        HOSPCODE_ORIGIN: row.HOSPCODE_ORIGIN || row.hospcode_origin || '',
        CLINIC_REFER: row.CLINIC_REFER || row.clinic_refer || '',
        CHIEFCOMP: row.CHIEFCOMP || row.chiefcomp || '',
        PHYSICALEXAM: row.PHYSICALEXAM || row.physicalexam || '',
        DIAGFIRST: row.DIAGFIRST || row.diagfirst || '',
        DIAGLAST: row.DIAGLAST || row.diaglast || '',
        PSTATUS: row.PSTATUS || row.ptstatus || '',
        PTYPE: row.PTYPE || row.ptype || '',
        EMERGENCY: row.EMERGENCY || row.emergency || '',
        PTYPEDIS: row.PTYPEDIS || row.ptypedis || '',
        CAUSEOUT: row.CAUSEOUT || row.causeout || '',
        REQUEST: row.REQUEST || row.request || '',
        PROVIDER: row.PROVIDER || row.provider || '',
        D_UPDATE: row.D_UPDATE || row.d_update || d_update,
        his: his,
        typesave: 'autosent'
      }
      await rowsSave.push(data);

      data.REFERID_PROVINCE = data.HOSPCODE + data.REFERID;
    }
    const saveResult = await referSending('/save-refer-history-all', rowsSave);
    sentContent += ' -- ' + JSON.stringify(saveResult) + '\r';
  }
  return rowsSave;
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
        PID: row.PID || row.pid || row.HN || row.hn,
        HID: row.HID || row.hid || '',
        HN: row.PID || row.pid || row.HN || row.hn,
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
        console.log(person.HN, saveResult);
      }
      sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
    }
  }
  return rows;
}

async function getService(db, visitNo, sentResult) {
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
        console.log(data.SEQ, saveResult);
      }
    }
  }
  return rows;
}

async function getDiagnosisOpd(db, visitNo, sentResult) {
  const rows = await hisModel.getDiagnosisOpd(db, visitNo, hcode);
  sentContent += '  - diagnosis_opd = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      delete row.codeset;
      delete row.hn;
      delete row.cid;
    }
    const saveResult: any = await referSending('/save-diagnosis-opd', rows);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode === 200) {
      sentResult.diagnosisOpd.success += 1;
    } else {
      sentResult.diagnosisOpd.fail += 1;
      console.log(visitNo, saveResult);
    }
  }
  return rows;
}

async function getProcedureOpd(db, visitNo, sentResult) {
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getProcedureOpd(db, visitNo, hcode);
  sentContent += '  - procedure_opd = ' + rows.length + '\r';
  let rowSave = [];
  if (rows && rows.length) {
    for (const row of rows) {
      await rowSave.push({
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || row.visitno || visitNo,
        PROCEDCODE: row.PROCEDCODE || row.procedcode || row.OP_CODE || row.op_code,
        PROCEDNAME: row.PROCEDNAME || row.procedname || row.OP_NAME || row.op_name || '',
        DATE_SERV: row.DATE_SERV || row.date_serv || row.date || '',
        CLINIC: row.CLINIC || row.clinic || '',
        SERVICEPRICE: row.SERVICEPRICE || row.serviceprice || 0,
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
        CID: row.CID || row.cid || '',
      })
    }
    const saveResult: any = await referSending('/save-procedure-opd', rowSave);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode === 200) {
      sentResult.procedureOpd.success += 1;
    } else {
      sentResult.procedureOpd.fail += 1;
      console.log(visitNo, saveResult);
    }
  }
  return rowSave;
}

async function getDrugOpd(db, visitNo, sentResult) {
  const rows = await hisModel.getDrugOpd(db, visitNo, hcode);
  sentContent += '  - drug_opd = ' + rows.length + '\r';
  if (rows && rows.length) {
    const saveResult: any = await referSending('/save-drug-opd', rows);
    sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
    if (saveResult.statusCode === 200) {
      sentResult.drugOpd.success += 1;
    } else {
      sentResult.drugOpd.fail += 1;
      console.log(visitNo, saveResult);
    }
  }
  return rows;
}

async function getLabResult(db, visitNo, referID = 'SEQ' + visitNo) {
  const rows = await hisModel.getLabResult(db, 'visitNo', visitNo, referID, hcode);
  let rowsSave = [];
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  sentContent += '  - lab result = ' + rows.length + '\r';
  if (rows && rows.length) {
    for (const row of rows) {
      const cHOSPCODE = row.HOSPCODE || row.hospcode;
      const investresult = row.INVESTRESULT || row.investresult || '';
      const data: any = await {
        HOSPCODE: cHOSPCODE,
        REFERID: referID,
        REFERID_PROVINCE: cHOSPCODE + referID,
        PID: row.PID || row.pid || row.HN || row.hn,
        SEQ: row.SEQ || row.seq || '',
        AN: row.AN || row.an || '',
        DATETIME_INVEST: row.DATETIME_INVEST || row.datetime_invest || '',
        INVESTTYPE: row.INVESTTYPE || row.investtype || 'LAB',
        INVESTCODE: row.INVESTCODE || row.investcode || row.LOCALCODE || row.localcode || '',
        LOCALCODE: row.LOCALCODE || row.localcode || '',
        LOINC: row.LOINC || row.loinc || '',
        INVESTNAME: row.INVESTNAME || row.investname || '',
        DATETIME_REPORT: row.DATETIME_REPORT || row.datetime_report || '',
        INVESTVALUE: row.INVESTVALUE || row.investvalue || '',
        LH: row.LH || row.lh || '',
        UNIT: row.UNIT || row.unit || '',
        NORMAL_MIN: row.NORMAL_MIN || row.normal_min || '',
        NORMAL_MAX: row.NORMAL_MAX || row.normal_max || '',
        INVESTRESULT: investresult.toString(),
        D_UPDATE: row.D_UPDATE || row.d_update || d_update
      };
      await rowsSave.push(data);
    }
    const saveResult: any = await referSending('/save-investigation-refer', rowsSave);
    sentContent += '    -- SEQ ' + visitNo + ' ' + JSON.stringify(saveResult.result || saveResult.message) + '\r';
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

async function getProcedureIpd(db, an) {
  if (!an) {
    return [];
  }
  const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
  const rows = await hisModel.getProcedureIpd(db, an, hcode);
  sentContent += '  - procedure_ipd = ' + rows.length + '\r';
  let rowSave = [];
  if (rows && rows.length) {
    for (const row of rows) {
      await rowSave.push({
        HOSPCODE: row.HOSPCODE || row.hospcode,
        PID: row.PID || row.pid || row.HN || row.hn,
        AN: row.AN || row.an,
        PROCEDCODE: row.PROCEDCODE || row.procedcode || row.OP_CODE || row.op_code,
        PROCEDNAME: row.PROCEDNAME || row.procedname || row.OP_NAME || row.op_name || '',
        DATETIME_ADMIT: row.DATETIME_ADMIT || row.datetime_admit || '',
        TIMESTART: row.TIMESTART || row.timestart || '',
        TIMEFINISH: row.TIMEFINISH || row.timefinish || '',
        WARDSTAY: row.WARDSTAY || row.wardstay || '',
        SERVICEPRICE: row.SERVICEPRICE || row.serviceprice || 0,
        PROVIDER: row.PROVIDER || row.provider || row.dr || '',
        D_UPDATE: row.D_UPDATE || row.d_update || row.date || d_update,
        CID: row.CID || row.cid || '',
      })
    }
    const saveResult = await referSending('/save-procedure-ipd', rowSave);
    sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
  }
  return rowSave;
}

async function referSending(path, dataArray) {
  const dataSending = querystring.stringify({
    hospcode: hcode, data: JSON.stringify(dataArray)
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

// async function getHttpHeaders(token) {
//   const httpHeaders: HttpHeaders = new HttpHeaders()
//     .set('authorization', `Bearer ${token}`);
//   return httpHeaders;
// }

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
  console.log(crontabConfig);
  return sendMoph(request, reply, dbConn);
};
module.exports = router;
