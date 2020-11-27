var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var fastify = require('fastify');
var http = require('http');
var querystring = require('querystring');
function getServiceUrl(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = process.env.MOPH_URL1 || 'http://203.157.103.176/moph-api';
        const mophUrl = url.split('/');
        const dataSending = querystring.stringify({
            hospcode: process.env.HOSPCODE, ip: ""
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
                res.on('data', (chunk) => {
                    ret += chunk;
                });
                res.on('end', () => {
                    if (ret) {
                        const data = JSON.parse(ret);
                        resolve(data);
                    }
                    else {
                        resolve(null);
                    }
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
const router = (mophService, config = {}) => __awaiter(this, void 0, void 0, function* () {
    const ret = yield getServiceUrl(config);
    if (ret) {
        fastify.mophService = ret.referServer;
        return ret.referServer;
    }
    else {
        return false;
    }
});
module.exports = router;
