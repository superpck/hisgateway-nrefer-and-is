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
const iswin_1 = require("../../models/isonline/iswin");
var http = require('http');
var querystring = require('querystring');
var iswin = new iswin_1.IswinModel();
let crontabConfig;
function sendMoph(req, reply, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getToken();
        if (!token) {
            console.log(`IS autosend 'fail' invalid config.`);
            return false;
        }
        const dateStart = moment().subtract(4, 'hours').format('YYYY-MM-DD HH:mm:ss');
        const dateEnd = moment().format('YYYY-MM-DD HH:mm:ss');
        const isData = yield iswin.getByDate(db, 'lastupdate', dateStart, dateEnd, process.env.HOSPCODE);
        if (isData && isData.length) {
            console.log('Founded: ', isData.length);
            for (let row of isData) {
                const ref = row.ref;
                delete row.ref;
                delete row.lastupdate;
                row.his = row.his ? row.his : process.env.HIS_PROVIDER;
                const sentResult = yield sendingData(row, token);
                console.log('sentResult ', ref, sentResult);
            }
        }
        else {
            console.log('ISOnline not found any record updated.');
        }
        return '';
    });
}
function sendingData(dataArray, token) {
    return __awaiter(this, void 0, void 0, function* () {
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
function sendData(row, tokenKey) {
    return __awaiter(this, void 0, void 0, function* () {
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
                }
                else {
                    resolve(body);
                }
            });
        });
    });
}
function getToken() {
    return __awaiter(this, void 0, void 0, function* () {
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
                }
                if (body.statusCode == 200 && body.token) {
                    resolve(body.token);
                }
                else {
                    reject(null);
                }
            });
        });
    });
}
function getIsToken() {
    return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                return null;
            }
        });
    });
}
const router = (request, reply, dbConn, config = {}) => {
    crontabConfig = config;
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
//# sourceMappingURL=crontab.js.map