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
    case 'hosxppcu':
        break;
    case 'hospitalos':
        break;
    case 'jhos':
        break;
    case 'pmk':
        break;
    case 'md':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
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
function sendMoph(req, reply, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateNow = moment().locale('th').format('YYYY-MM-DD');
        const apiKey = process.env.NREFER_APIKEY || 'api-key';
        const secretKey = process.env.NREFER_SECRETKEY || 'secret-key';
        sentContent = moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + ' data:' + dateNow + "\r\n";
        const resultToken = yield getNReferToken(apiKey, secretKey);
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
        if (hourNow < 8 || hourNow === 12 ||
            hourNow === 18 || hourNow === 22) {
            const date = moment().locale('th').subtract(1, 'days').format('YYYY-MM-DD');
            yield startSending(req, reply, db, date);
        }
        yield startSending(req, reply, db, dateNow);
    });
}
function startSending(req, reply, db, date) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(moment().locale('th').format('HH:mm:ss.SSS'), 'get data', date);
        const referOut = yield getReferOut(db, date);
    });
}
function getReferOut(db, date) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const referout = yield hisModel.getReferOut(db, date, hcode);
            sentContent += `\rsave refer_history ${date} \r`;
            sentContent += `\rsave refer service data ${date} \r`;
            let index = 0;
            let sentResult = {
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
                const saverefer = yield sendReferOut(row, sentResult);
                const person = yield getPerson(db, hn, sentResult);
                const service = yield getService(db, seq, sentResult);
                const diagnosisopd = yield getDiagnosisOpd(db, seq, sentResult);
                const procedureopd = yield getProcedureOpd(db, seq, sentResult);
                const drugopd = yield getDrugOpd(db, seq, sentResult);
                const ipd = yield getAdmission(db, seq);
                const an = ipd && ipd.length ? ipd[0].an : '';
                const procedureIpd = yield getProcedureIpd(db, an);
                const investigation_refer = yield getLabResult(db, row);
                index += 1;
                if (referout.length <= index) {
                    sentContent += moment().locale('th').format('HH:mm:ss.SSS') + ' crontab finished...\r\r';
                    yield writeResult(resultText, sentContent);
                    console.log(moment().locale('th').format('HH:mm:ss.SSS'), 'finished...');
                }
            }
            console.log('sent result', sentResult);
            return referout;
        }
        catch (error) {
            console.log('crontab error:', error.message);
            sentContent += moment().locale('th').format('HH:mm:ss.SSS') + 'crontab error ' + error.message + '\r\r';
            return [];
        }
    });
}
function sendReferOut(row, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        if (row) {
            const hcode = row.HOSPCODE || row.hospcode;
            const referId = row.REFERID || row.referid;
            const referProvId = hcode + referId;
            const dServe = row.DATETIME_SERV || row.REFER_DATE || row.refer_date;
            const dAdmit = row.DATETIME_ADMIT || row.datetime_admit || null;
            const dRefer = row.DATETIME_REFER || row.REFER_DATE || row.refer_date || dServe || null;
            const cid = row.CID || row.cid;
            const destHosp = row.HOSP_DESTINATION || row.hosp_destination;
            const data = yield {
                HOSPCODE: hcode,
                REFERID: referId,
                PID: row.PID || row.pid || row.HN || row.hn,
                SEQ: row.SEQ || row.seq || '',
                AN: row.AN || row.an || '',
                CID: cid,
                DATETIME_SERV: moment(dServe).format('YYYY-MM-DD'),
                DATETIME_ADMIT: moment(dAdmit).format('YYYY-MM-DD'),
                DATETIME_REFER: moment(dRefer).format('YYYY-MM-DD'),
                HOSP_DESTINATION: destHosp,
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
                REFERID_PROVINCE: referProvId,
                D_UPDATE: row.D_UPDATE || row.d_update || d_update,
                his: his,
                typesave: 'autosent'
            };
            const saveResult = yield referSending('/save-refer-history', data);
            if (saveResult.statusCode === 200) {
                sentResult.referout.success += 1;
            }
            else {
                sentResult.referout.fail += 1;
                console.log(data.REFERID, saveResult);
            }
            sentContent += '  - refer_history ' + data.REFERID + ' ' + (saveResult.result || saveResult.message) + '\r';
            return saveResult;
        }
        else {
            return null;
        }
    });
}
function sendReferOutRows(rows) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        sentContent += 'refer_out = ' + rows.length + '\r';
        if (rows && rows.length) {
            let rowsSave = [];
            for (const row of rows) {
                const data = yield {
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
                };
                yield rowsSave.push(data);
                data.REFERID_PROVINCE = data.HOSPCODE + data.REFERID;
                const saveResult = yield referSending('/save-refer-history', data);
                sentContent += ' -- ' + data.REFERID + ' ' + JSON.stringify(saveResult) + '\r';
            }
        }
        return rows;
    });
}
function sendReferOutAll(rows) {
    return __awaiter(this, void 0, void 0, function* () {
        let rowsSave = [];
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        sentContent += 'refer_out = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const data = yield {
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
                };
                yield rowsSave.push(data);
                data.REFERID_PROVINCE = data.HOSPCODE + data.REFERID;
            }
            const saveResult = yield referSending('/save-refer-history-all', rowsSave);
            sentContent += ' -- ' + JSON.stringify(saveResult) + '\r';
        }
        return rowsSave;
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
                };
                const saveResult = yield referSending('/save-person', person);
                if (saveResult.statusCode === 200) {
                    sentResult.person.success += 1;
                }
                else {
                    sentResult.person.fail += 1;
                    console.log(person.HN, saveResult);
                }
                sentContent += '    -- PID ' + person.HN + ' ' + (saveResult.result || saveResult.message) + '\r';
            }
        }
        return rows;
    });
}
function getService(db, visitNo, sentResult) {
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
                    console.log(data.SEQ, saveResult);
                }
            }
        }
        return rows;
    });
}
function getDiagnosisOpd(db, visitNo, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield hisModel.getDiagnosisOpd(db, visitNo, hcode);
        sentContent += '  - diagnosis_opd = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                delete row.codeset;
                delete row.hn;
                delete row.cid;
            }
            const saveResult = yield referSending('/save-diagnosis-opd', rows);
            sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
            if (saveResult.statusCode === 200) {
                sentResult.diagnosisOpd.success += 1;
            }
            else {
                sentResult.diagnosisOpd.fail += 1;
                console.log(visitNo, saveResult);
            }
        }
        return rows;
    });
}
function getProcedureOpd(db, visitNo, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        const rows = yield hisModel.getProcedureOpd(db, visitNo, hcode);
        sentContent += '  - procedure_opd = ' + rows.length + '\r';
        let rowSave = [];
        if (rows && rows.length) {
            for (const row of rows) {
                yield rowSave.push({
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
                });
            }
            const saveResult = yield referSending('/save-procedure-opd', rowSave);
            sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
            if (saveResult.statusCode === 200) {
                sentResult.procedureOpd.success += 1;
            }
            else {
                sentResult.procedureOpd.fail += 1;
                console.log(visitNo, saveResult);
            }
        }
        return rowSave;
    });
}
function getDrugOpd(db, visitNo, sentResult) {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = yield hisModel.getDrugOpd(db, visitNo, hcode);
        sentContent += '  - drug_opd = ' + rows.length + '\r';
        if (rows && rows.length) {
            const saveResult = yield referSending('/save-drug-opd', rows);
            sentContent += '    -- ' + visitNo + ' ' + JSON.stringify(saveResult) + '\r';
            if (saveResult.statusCode === 200) {
                sentResult.drugOpd.success += 1;
            }
            else {
                sentResult.drugOpd.fail += 1;
                console.log(visitNo, saveResult);
            }
        }
        return rows;
    });
}
function getLabResult(db, row) {
    return __awaiter(this, void 0, void 0, function* () {
        const visitNo = row.seq || row.SEQ;
        const referID = row.REFERID || row.referid;
        const rows = yield hisModel.getLabResult(db, 'visitNo', visitNo, referID, hcode);
        let rowsSave = [];
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        sentContent += '  - lab result = ' + rows.length + '\r';
        if (rows && rows.length) {
            for (const row of rows) {
                const cHOSPCODE = row.HOSPCODE || row.hospcode;
                const investresult = row.INVESTRESULT || row.investresult || '';
                const data = yield {
                    HOSPCODE: cHOSPCODE,
                    REFERID: referID,
                    REFERID_PROVINCE: cHOSPCODE + referID,
                    PID: row.PID || row.pid || row.HN || row.hn,
                    SEQ: visitNo,
                    AN: row.AN || row.an || '',
                    DATETIME_INVEST: row.DATETIME_INVEST || row.datetime_invest || '',
                    INVESTTYPE: row.INVESTTYPE || row.investtype || 'LAB',
                    INVESTCODE: row.INVESTCODE || row.investcode || row.LOCALCODE || row.localcode || '',
                    LOCALCODE: row.LOCALCODE || row.localcode || '',
                    LOINC: row.LOINC || row.loinc || '',
                    INVESTNAME: row.INVESTNAME || row.investname || '',
                    DATETIME_REPORT: row.DATETIME_REPORT || row.datetime_report || '',
                    INVESTVALUE: investresult.toString(),
                    LH: row.LH || row.lh || '',
                    UNIT: row.UNIT || row.unit || '',
                    NORMAL_MIN: row.NORMAL_MIN || row.normal_min || '',
                    NORMAL_MAX: row.NORMAL_MAX || row.normal_max || '',
                    INVESTRESULT: investresult.toString(),
                    D_UPDATE: row.D_UPDATE || row.d_update || d_update
                };
                yield rowsSave.push(data);
            }
            const saveResult = yield referSending('/save-investigation-refer', rowsSave);
            sentContent += '    -- SEQ ' + visitNo + ' ' + JSON.stringify(saveResult.result || saveResult.message) + '\r';
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
function getProcedureIpd(db, an) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!an) {
            return [];
        }
        const d_update = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
        const rows = yield hisModel.getProcedureIpd(db, an, hcode);
        sentContent += '  - procedure_ipd = ' + rows.length + '\r';
        let rowSave = [];
        if (rows && rows.length) {
            for (const row of rows) {
                yield rowSave.push({
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
                });
            }
            const saveResult = yield referSending('/save-procedure-ipd', rowSave);
            sentContent += '    -- ' + an + ' ' + JSON.stringify(saveResult) + '\r';
        }
        return rowSave;
    });
}
function referSending(path, dataArray) {
    return __awaiter(this, void 0, void 0, function* () {
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
function getNReferToken(apiKey, secretKey) {
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
    console.log(crontabConfig);
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
//# sourceMappingURL=crontab.js.map