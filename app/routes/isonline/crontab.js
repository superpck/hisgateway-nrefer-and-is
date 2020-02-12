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
var http = require('http');
var querystring = require('querystring');
let crontabConfig;
function sendMoph(req, reply, db) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Crontab IS-Online', moment().locale('th').format('HH:mm:ss.SSS'));
        console.log(crontabConfig);
        const token = yield getIsToken();
        console.log('token', token);
        return '';
    });
}
function getIsToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const postData = querystring.stringify({
            username: process.env.IS_MOPH_USER,
            password: process.env.IS_MOPH_PASSWORD
        });
        const url = process.env.IS_URL.split(':');
        const options = {
            hostname: url[0] + ':' + url[1],
            port: +url[2],
            path: '/isonline/token',
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
const router = (request, reply, dbConn, config = {}) => {
    crontabConfig = config;
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
//# sourceMappingURL=crontab.js.map