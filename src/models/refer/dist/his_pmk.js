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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.HisPmkModel = void 0;
var moment = require("moment");
var maxLimit = 250;
var hcode = process.env.HOSPCODE;
var dbName = process.env.HIS_DB_NAME;
var dbClient = process.env.HIS_DB_CLIENT;
var HisPmkModel = /** @class */ (function () {
    function HisPmkModel() {
    }
    HisPmkModel.prototype.getTableName = function (db) {
        if (dbClient === 'oracledb') {
            return db.raw("select * from ALL_TABLES where OWNER = '" + dbName + "'");
        }
        else {
            return db('information_schema.tables')
                .select('TABLE_NAME')
                .where('TABLE_SCHEMA', '=', dbName);
        }
    };
    HisPmkModel.prototype.getReferOut = function (db, date, hospCode) {
        if (hospCode === void 0) { hospCode = hcode; }
        return __awaiter(this, void 0, void 0, function () {
            var where, result, sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        date = moment(date).format('YYYY-MM-DD');
                        where = "REFER_IN_DATETIME BETWEEN TO_DATE('" + date + " 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('" + date + " 23:59:59', 'YYYY-MM-DD HH24:MI:SS')";
                        return [4 /*yield*/, db('PATIENTS_REFER_HX as referout')
                                .join('OPDS', 'referout.OPD_NO', 'OPDS.OPD_NO')
                                .join('PATIENTS as patient', function () {
                                this.on('OPDS.PAT_RUN_HN', '=', 'patient.RUN_HN')
                                    .andOn('OPDS.PAT_YEAR_HN', '=', 'patient.YEAR_HN');
                            })
                                .select(db.raw("'" + hospCode + "' AS \"hospcode\""))
                                .select(db.raw("concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS \"hn\""))
                                .select('referout.OPD_NO as seq', 'referout.OPD_NO as vn', 'referout.REFER_NO as referid', 'referout.HOS_IN_CARD as hosp_destination', 'referout.REFER_IN_DATETIME as refer_date', 'patient.ID_CARD as cid', 'patient.PRENAME as prename', 'patient.NAME as fname', 'patient.SURNAME as lname', 'patient.BIRTHDAY as dob')
                                .select(db.raw("case when SEX='F' then 2 else 1 end as \"sex\""))
                                .whereRaw(db.raw(where))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    HisPmkModel.prototype.getPerson = function (db, columnName, searchText) {
        columnName = columnName === 'hn' ? 'HN' : columnName;
        columnName = columnName === 'pid' ? 'HN' : columnName;
        columnName = columnName === 'cid' ? 'ID_CARD' : columnName;
        columnName = columnName === 'fname' ? 'NAME' : columnName;
        columnName = columnName === 'lname' ? 'SURNAME' : columnName;
        return db('PATIENTS')
            .select('RUN_HN', 'YEAR_HN')
            .select('HN as hn', 'ID_CARD as cid', 'PRENAME as prename', 'NAME as fname', 'SURNAME as lname', 'BIRTHDAY as dob')
            .select(db.raw("case when SEX='F' then 2 else 1 end as sex"))
            .select('HOME as address', 'VILLAGE as moo', 'ROAD as road')
            .select(db.raw("'' as soi"))
            .select('TAMBON as addcode', 'TEL as tel')
            .select(db.raw("'' as zip"))
            .select(db.raw("'' as occupation"))
            .whereRaw(db.raw(" " + columnName + "='" + searchText + "' "))
            .limit(maxLimit);
    };
    HisPmkModel.prototype.getService = function (db, columnName, searchText, hospCode) {
        if (hospCode === void 0) { hospCode = hcode; }
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        // columnName = columnName === 'vn' ? 'service.SEQ' : columnName;
        // columnName = columnName === 'pid' ? 'PAT_RUN_HN' : columnName;
        // columnName = columnName === 'hn' ? 'PAT_RUN_HN' : columnName;
        columnName = columnName === 'date_serv' ? 'OPD_DATE' : columnName;
        var where = {};
        var cdate = '';
        if (columnName === 'date') {
            cdate = "OPD_DATE=TO_DATE('" + searchText + "', 'YYYY-MM-DD HH24:MI:SS')";
        }
        else if (columnName === 'hn') {
            var _hn = searchText.split('/');
            where['PAT_RUN_HN'] = _hn[0];
            where['PAT_YEAR_HN'] = _hn[1];
        }
        else if (columnName === 'visitNo') {
            where['OPD_NO'] = searchText;
        }
        return db("OPDS")
            .select(db.raw("'" + hospCode + "' AS \"hospcode\""))
            .select(db.raw("concat(concat(to_char(OPDS.PAT_RUN_HN),'/'),to_char(OPDS.PAT_YEAR_HN)) AS \"hn\""))
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select('OPD_NO as visitno', 'OPD_DATE as date', 'OPD_DATE as DATE_SERV')
            .select(db.raw("TO_CHAR(DATE_CREATED, 'HH24:MI:SS') AS time"))
            .select('BP_SYSTOLIC as bp_systolic', 'BP_DIASTOLIC as bp_diastolic', 'BP_SYSTOLIC as bp1', 'BP_DIASTOLIC as bp2', 'PALSE as pr', 'RESPIRATORY_RATE as rr', 'WT_KG as weight', 'HEIGHT_CM as height', 'TEMP_C as tem')
            .where(where)
            .whereRaw(db.raw(cdate))
            .limit(maxLimit);
    };
    HisPmkModel.prototype.getDiagnosisOpd = function (db, visitno) {
        return db('OPDDIAGS')
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select(db.raw("concat(concat(to_char(PAT_RUN_HN),'/'),to_char(PAT_YEAR_HN)) AS hn"))
            .select('OPD_OPD_NO as visitno', 'ICD_CODE as diagcode', 'TYPE as diag_type')
            .where('OPD_OPD_NO', "=", visitno);
    };
    HisPmkModel.prototype.getProcedureOpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_opd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getChargeOpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_opd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getDrugOpd = function (db, columnName, searchNo, hospCode) {
        return db('DOC_DRUG_REQUEST_HEADER as drug')
            .select('PAT_RUN_HN as RUN_HN', 'PAT_YEAR_HN as YEAR_HN')
            .select(db.raw("concat(concat(to_char(PAT_RUN_HN),'/'),to_char(PAT_YEAR_HN)) AS hn"))
            .select('*')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getAdmission = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('admission')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getDiagnosisIpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getProcedureIpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('procedure_ipd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getChargeIpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('charge_ipd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getDrugIpd = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('drug_ipd')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getAccident = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('accident')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getAppointment = function (knex, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from('appointment')
            .where(columnName, "=", searchNo);
    };
    HisPmkModel.prototype.getReferResult = function () {
        return [];
    };
    HisPmkModel.prototype.getData = function (knex, tableName, columnName, searchNo, hospCode) {
        return knex
            .select('*')
            .from(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    };
    return HisPmkModel;
}());
exports.HisPmkModel = HisPmkModel;
