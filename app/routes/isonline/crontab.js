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
let crontabConfig;
function sendMoph(req, reply, db) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Crontab IS-Online', moment().locale('th').format('HH:mm:ss.SSS'));
        console.log(crontabConfig);
        return '';
    });
}
const router = (request, reply, dbConn, config = {}) => {
    crontabConfig = config;
    return sendMoph(request, reply, dbConn);
};
module.exports = router;
//# sourceMappingURL=crontab.js.map