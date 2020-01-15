'use strict';
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
const path = require("path");
const webstorage_node_1 = require("webstorage-node");
var fs = require('fs');
var alert = require('alert-node');
const crypto = require('crypto');
const configFileName = 'config';
let setupSession = null;
const router = (fastify, {}, next) => {
    const sessionName = 'admin-session';
    var db = fastify.knex;
    fastify.get('/', (req, reply) => {
        reply.view('/templates/pages/index.ejs', {
            token: getSession(), req: req.ip, env: process.env
        });
    });
    fastify.get('/about', (req, reply) => {
        reply.view('/templates/pages/about.ejs', {
            token: getSession(), req: req.ip, env: process.env
        });
    });
    fastify.get('/login', (req, reply) => {
        removeSession();
        reply.view('/templates/pages/login.ejs', { token: '' });
    });
    fastify.post('/check-secret', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const RequestKey = req.body.RequestKey;
        const SecretKey = req.body.SecretKey;
        if (RequestKey === process.env.REQUEST_KEY && SecretKey === process.env.SECRET_KEY) {
            setupSession = setSession();
            const configs = yield configVar();
            reply.view('/templates/pages/setup.ejs', { token: getSession(), req: req.ip, env: process.env, configs, error: '' });
        }
        else {
            setupSession = 0;
            console.log('login fail!');
            reply.view('/templates/pages/login.ejs', { id: 123 });
        }
    }));
    fastify.get('/form', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        let setupSess = getSession();
        let isLogin = setupSess > now;
        if (!isLogin) {
            const requestKey = req.query && req.query.RequestKey ? req.query.RequestKey : null;
            const secretKey = req.query && req.query.SecretKey ? req.query.SecretKey : null;
            if (requestKey && secretKey &&
                requestKey === process.env.REQUEST_KEY && secretKey === process.env.SECRET_KEY) {
                setupSess = setSession();
                console.log('login success.', setupSession, getSession());
                isLogin = true;
            }
        }
        if (isLogin) {
            const configs = yield configVar();
            reply.view('/templates/pages/setup.ejs', { token: setupSess, req: req.ip, env: process.env, configs, error: '' });
        }
        else {
            reply.view('/templates/pages/login.ejs', { token: '', req: req.ip, env: process.env });
        }
    }));
    fastify.post('/save', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const dataInput = req.body;
        const configs = yield resetVar();
        for (let config in configs) {
            for (let item in configs[config]) {
                if (dataInput && dataInput[item]) {
                    configs[config][item] = yield dataInput[item];
                }
            }
        }
        let isValid = true;
        let errorText = '';
        if (configs.JWT.REQUEST_KEY.length < 10 || configs.JWT.SECRET_KEY.length < 16) {
            isValid = false;
            errorText = "Error: \r\nRequest Key or Secret key too short!";
            alert('Error: Request Key or Secret key too short!');
        }
        if (isValid) {
            saveConfig(req, configs);
        }
        reply.view('/templates/pages/setup.ejs', { token: getSession(), req: req.ip, env: process.env, configs, error: errorText });
    }));
    function saveConfig(req, configs) {
        return __awaiter(this, void 0, void 0, function* () {
            const comments = {
                HISDB: `// ส่วนการเชื่อมโยงกับ HIS\r\n` +
                    `// valid db client type: mysql, pg, mssql, oracledb\r\n` +
                    `// valid HIS provider name: ezhosp, hosxpv3, hosxpv4, infod, ssb, hospitalos, pmk\r\n` +
                    `// , kpstat, md, mkhospital, thiades, nemo, other`,
                NRRFER: `// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n` +
                    `// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ`,
                NREFER_AUTO_SEND: '// สั่งให้ Auto Send ทำงาน 0=ไม่ส่ง Auto 1=ส่ง Auto',
                NREFER_AUTO_SEND_EVERY_MINUTE: '// เวลาที่ส่ง Auto ระบุนาที (5-59) หรือ ชม. (0-23) เท่านั้น',
                REFERLOCAL: '// ส่วนการเชื่อมโยงกับ local refer db\r\n' +
                    '// refer provider: his, thai_refer, refer_link, irefer, erefer',
                NOTIFY: '// สำหรับการรับข้อความจาก nRefer แบบ Auto\r\n' +
                    '// กรุณาแก้ไข NOTIFY_CHANNEL ตามที่ต้องการ',
                JWT: '// สำหรับ JWT Authentication\r\n' +
                    '// REQUEST_KEY <ตั้งเอง 8-32 อักษร>\r\n' +
                    '// SECRET_KEY <ตั้งเอง 16-128 อักษร>',
            };
            const configFileNameBak = configFileName + '_' +
                moment().locale('th').format('YYYYMMDD_HHmmss') + '.old';
            const resultRename = renameFile(configFileName, configFileNameBak);
            let content = "// FIle: " + configFileName + "\r\n";
            content += "// Date: " + moment().locale('th').format('YYYY-MM-DD HH:mm:ss') + "\r\n";
            content += "// IP: " + req.ip + "\r\n";
            for (let config in configs) {
                content += yield `\r\n[${config}]\r\n`;
                if (comments[config]) {
                    content += comments[config] + '\r\n';
                }
                for (let item in configs[config]) {
                    if (comments[item]) {
                        content += comments[item] + '\r\n';
                    }
                    const v = configs[config][item];
                    content += yield `${item}=${v}\r\n`;
                }
            }
            content += '\r\n';
            content += 'CHECKSUM=' + crypto.createHash('md5').update(content).digest('hex');
            fs.appendFile(configFileName, content, function (err) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        yield renameFile(configFileNameBak, configFileName);
                        return { message: true, error: err };
                    }
                    else {
                        let fileDesc;
                        yield fs.stat(configFileName, (err, stat) => {
                            if (err) {
                                return { statusCode: 500, message: false, result: err };
                            }
                            else {
                                fileDesc = stat;
                                alert('บันทึกเรียบร้อย');
                                return { statusCode: 200, message: true };
                            }
                        });
                    }
                });
            });
        });
    }
    function configVar() {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = yield resetVar();
            const cnfFile = path.join(__dirname, `../../${configFileName}`);
            const gotConfigs = yield require('dotenv').config({ path: cnfFile }).parsed;
            for (let config in configs) {
                for (let item in configs[config]) {
                    if (gotConfigs && gotConfigs[item]) {
                        configs[config][item] = yield gotConfigs[item];
                    }
                }
            }
            return configs;
        });
    }
    function resetVar() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            let config = yield {
                HOSPITAL: {
                    API_LEVEL: 'hospital',
                    HOSPCODE: '00000'
                },
                API: {
                    HTTPS: 0,
                    PORT: 3004,
                    START_TOOL: 'pm2',
                    PM2_NAME: 'his-gateway',
                    PM2_INSTANCE: 3,
                    AUTO_RESTART: 1,
                    MAX_CONNECTION_PER_MINUTE: 100000
                },
                HISDB: {
                    HIS_PROVIDER: 'hosxpv3',
                    HIS_DB_HOST: '192.168.0.1',
                    HIS_DB_PORT: 3306,
                    HIS_DB_CLIENT: 'mysql',
                    HIS_DB_SCHEMA: 'public',
                    HIS_DB_NAME: 'hosxp',
                    HIS_DB_USER: 'sa',
                    HIS_DB_PASSWORD: 'password',
                    HIS_DB_CHARSET: 'utf8',
                    HIS_DB_ENCRYPT: true
                },
                NRRFER: {
                    NREFER_URL1: 'http://203.157.103.33:8080/nrefer',
                    NREFER_URL: '203.157.103.33',
                    NREFER_PORT: 8080,
                    NREFER_PATH: '/nrefer',
                    NREFER_APIKEY: 'xxxxxxx',
                    NREFER_SECRETKEY: 'xxxxxxxx',
                    NREFER_AUTO_SEND: 1,
                    NREFER_AUTO_SEND_EVERY_MINUTE: 2,
                    NREFER_AUTO_SEND_EVERY_HOUR: 0,
                },
                NREFERLOCAL: {
                    REFER_PROVIDER: 'thairefer',
                    REFER_DB_HOST: 'localhost',
                    REFER_DB_PORT: 3306,
                    REFER_DB_CLIENT: 'mssql',
                    REFER_DB_SCHEMA: 'public',
                    REFER_DB_NAME: 'nrefer',
                    REFER_DB_USER: 'user',
                    REFER_DB_PASSWORD: 'password',
                    REFER_DB_CHARSET: 'utf8',
                    REFER_DB_ENCRYPT: true,
                },
                ISONLINE: {
                    IS_DB_HOST: '192.168.0.1',
                    IS_DB_PORT: 3306,
                    IS_DB_CLIENT: 'mysql',
                    IS_DB_SCHEMA: 'public',
                    IS_DB_NAME: 'isdb',
                    IS_DB_USER: 'sa',
                    IS_DB_PASSWORD: 'password',
                    IS_DB_CHARSET: 'utf8',
                    IS_DB_ENCRYPT: true,
                    IS_AUTO_SEND: 1,
                    IS_AUTO_SEND_EVERY_MINUTE: 6,
                    IS_AUTO_SEND_EVERY_HOUR: 0,
                    IS_URL: 'http://ae.moph.go.th:3006',
                    IS_MOPH_USER: '<from IS>',
                    IS_MOPH_PASSWORD: '<from IS>'
                },
                CANNABIS: {
                    CANNABIS_DB_HOST: '192.168.0.1',
                    CANNABIS_DB_PORT: 3306,
                    CANNABIS_DB_CLIENT: 'mysql',
                    CANNABIS_DB_SCHEMA: 'public',
                    CANNABIS_DB_NAME: 'cannabis',
                    CANNABIS_DB_USER: 'sa',
                    CANNABIS_DB_PASSWORD: 'password',
                    CANNABIS_DB_CHARSET: 'utf8',
                    CANNABIS_DB_ENCRYPT: true
                },
                NOTIFY: {
                    NOTIFY_URL: 'http://203.157.103.33:8080/nrefer/message',
                    NOTIFY_TOKEN: '$nRefer@MoPH$',
                    NOTIFY_CHANNEL: 'HIS@xxxxx'
                },
                JWT: {
                    REQUEST_KEY_MD5: false,
                    REQUEST_KEY: crypto.createHash('md5').update(today).digest('hex').substr(4, 10),
                    SECRET_KEY: crypto.createHash('sha1').update(today).digest('hex')
                }
            };
            return config;
        });
    }
    function renameFile(srcFile, destFile) {
        if (!fs.existsSync(srcFile)) {
            return false;
        }
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            fs.rename(srcFile, destFile, function (err) {
                if (err) {
                    reject(false);
                }
                else {
                    resolve(true);
                }
            });
        }));
    }
    function setSession() {
        setupSession = moment().add(15 * 4 * 4, 'minute').format('YYYY-MM-DD HH:mm:ss');
        webstorage_node_1.localStorage.setItem(`id`, process.pid + '');
        webstorage_node_1.localStorage.setItem(`${sessionName}`, setupSession);
        return setupSession;
    }
    function getSession() {
        setupSession = webstorage_node_1.localStorage.getItem(sessionName) ? webstorage_node_1.localStorage.getItem(sessionName) : null;
        return setupSession;
    }
    function removeSession() {
        webstorage_node_1.localStorage.clear();
        setupSession = null;
        return setupSession;
    }
    next();
};
module.exports = router;
//# sourceMappingURL=setup.js.map