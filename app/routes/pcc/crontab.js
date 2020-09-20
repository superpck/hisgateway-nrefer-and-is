"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
var fs = require('fs');
var http = require('http');
var querystring = require('querystring');
const his_ezhosp_1 = require("../../models/refer/his_ezhosp");
const his_thiades_1 = require("../../models/refer/his_thiades");
const his_hosxpv3_1 = require("../../models/refer/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/refer/his_hosxpv4");
const his_jhcis_1 = require("../../models/refer/his_jhcis");
const his_md_1 = require("../../models/refer/his_md");
const his_kpstat_1 = require("../../models/refer/his_kpstat");
const his_mkhospital_1 = require("../../models/refer/his_mkhospital");
const his_1 = require("../../models/refer/his");
const his_nemo_1 = require("../../models/refer/his_nemo");
const his_pmk_1 = require("../../models/refer/his_pmk");
const his_mypcu_1 = require("../../models/refer/his_mypcu");
const his_hosxppcu_1 = require("../../models/refer/his_hosxppcu");
const hisProvider = process.env.HIS_PROVIDER;
let hisModel;
switch (hisProvider) {
    case 'ezhosp':
        hisModel = new his_ezhosp_1.HisEzhospModel();
        break;
    case 'thiades':
        hisModel = new his_thiades_1.HisThiadesModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_1.HisHosxpv4Model();
        break;
    case 'hosxppcu':
        hisModel = new his_hosxppcu_1.HisHosxpPcuModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_1.HisMkhospitalModel();
        break;
    case 'nemo':
    case 'nemo_refer':
        hisModel = new his_nemo_1.HisNemoModel();
        break;
    case 'ssb':
        break;
    case 'infod':
        break;
    case 'hi':
        break;
    case 'himpro':
        break;
    case 'jhcis':
        hisModel = new his_jhcis_1.HisJhcisModel();
        break;
    case 'hospitalos':
        break;
    case 'jhos':
        break;
    case 'pmk':
        hisModel = new his_pmk_1.HisPmkModel();
        break;
    case 'md':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    case 'mypcu':
        hisModel = new his_mypcu_1.HisMyPcuModel();
        break;
    default:
        hisModel = new his_1.HisModel();
}
const hcode = process.env.HOSPCODE;
const his = process.env.HIS_PROVIDER;
const resultText = 'sent_result.txt';
let sentContent = '';
let nReferToken = '';
let crontabConfig;
let apiVersion = '-';
function sendMoph(req, reply, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateNow = moment().locale('th').format('YYYY-MM-DD');
        const apiKey = process.env.NREFER_APIKEY || 'api-key';
        const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';
        sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";
        const resultToken = yield getToken(apiKey, secretKey);
        if (resultToken && resultToken.statusCode === 200 && resultToken.token) {
            nReferToken = resultToken.token;
            sentContent += `token ${resultToken.token}\r`;
        }
        else {
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
        }
        else if (hourNow == 3 && minuteNow - 1 < +process.env.NREFER_AUTO_SEND_EVERY_MINUTE) {
            let oldDate = moment(dateNow).subtract(7, 'days').format('YYYY-MM-DD');
            while (oldDate < dateNow) {
                oldDate = moment(oldDate).add(1, 'days').format('YYYY-MM-DD');
            }
        }
        const sendDataCenter = getService(db, dateNow);
        return { sendDataCenter };
    });
}
function getService(db, date) {
    return __awaiter(this, void 0, void 0, function* () {
        let sentResult = {
            person: { success: 0, fail: 0 },
            service: { success: 0, fail: 0 }
        };
        const rows = yield hisModel.getService(db, 'date_serv', date, hcode);
        sentContent += '  - service = ' + rows.length + '\r';
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        if (rows && rows.length) {
            sentResult.service.success = rows.length;
            for (const row of rows) {
            }
        }
        return sentResult;
    });
}
function getPerson(db, pid, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        const rows = yield hisModel.getPerson(db, 'hn', pid, hcode);
        sentContent += '  - person = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const person = yield {
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
                };
                const saveResult = yield referSending('/save-person', person);
                if (saveResult.statusCode === 200) {
                    sentResult.person.success += 1;
                }
                else {
                    sentResult.person.fail += 1;
                    console.log('save-person', person.HN, saveResult);
                }
                sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    });
}
function getAddress(db, pid, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        const rows = yield hisModel.getAddress(db, 'hn', pid, hcode);
        sentContent += '  - address = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const address = yield {
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
                };
                const saveResult = yield referSending('/save-address', address);
                if (saveResult.statusCode === 200) {
                    sentResult.address.success += 1;
                }
                else {
                    sentResult.address.fail += 1;
                    console.log('save address fail', address.PID, saveResult);
                }
                sentContent += '    -- PID ' + address.PID + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    });
}
function getService_(db, visitNo, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield hisModel.getService(db, 'visitNo', visitNo, hcode);
        sentContent += '  - service = ' + rows.length + '\r';
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        if (rows && rows.length) {
            for (const row of rows) {
                const data = yield {
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
                };
                const saveResult = yield referSending('/save-service', data);
                sentContent += '    -- SEQ ' + data.SEQ + ' ' + (saveResult.result || saveResult.message) + '\r';
                if (saveResult.statusCode === 200) {
                    sentResult.service.success += 1;
                }
                else {
                    sentResult.service.fail += 1;
                    console.log('save-service', data.SEQ, saveResult);
                }
            }
        }
        return rows;
    });
}
function getAdmission(db, visitNo) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        const rows = yield hisModel.getAdmission(db, 'visitNo', visitNo, hcode);
        sentContent += '  - admission = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const data = yield {
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
                };
                const saveResult = yield referSending('/save-admission', data);
                sentContent += '    -- AN ' + data.AN + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    });
}
function referSending(path, dataArray) {
    return __awaiter(this, void 0, void 0, function* () {
        const dataSending = querystring.stringify({
            hospcode: hcode, data: JSON.stringify(dataArray),
            processPid: process.pid, dateTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            sourceApiName: 'HIS-connect version ' + apiVersion
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
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(dataSending);
            req.end();
        });
    });
}
function getToken(apiKey, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
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
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
function expireToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
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
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    const data = JSON.parse(ret);
                    resolve(data);
                });
            });
            req.on('error', (e) => {
                reject(e);
            });
            req.write(postData);
            req.end();
        });
    });
}
function writeResult(file, content) {
    return __awaiter(this, void 0, void 0, function* () {
        fs.writeFile(file, content, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.log(err.message);
                }
                else {
                    let fileDesc;
                    yield fs.stat(resultText, (err, stat) => {
                        if (err) {
                            console.log(err.message);
                        }
                        else {
                            fileDesc = stat;
                        }
                    });
                }
            });
        });
    });
}
const router = (request, reply, dbConn, config = {}) => {
    crontabConfig = config;
    apiVersion = crontabConfig.version ? crontabConfig.version : '-';
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
