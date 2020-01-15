/// <reference path="./../../../typings.d.ts" />

import * as fastify from 'fastify';
import * as moment from 'moment';

let crontabConfig: any;
async function sendMoph(req, reply, db) {
  console.log('Crontab IS-Online', moment().locale('th').format('HH:mm:ss.SSS'));
  console.log(crontabConfig);
  return '';
}

const router = (request: fastify.Request, reply: fastify.Reply, dbConn: any, config = {}) => {
  crontabConfig = config;
  return sendMoph(request, reply, dbConn);
};

module.exports = router;
