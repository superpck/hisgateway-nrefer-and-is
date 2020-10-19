import { FastifyInstance } from "fastify";
import * as moment from 'moment';

var shell = require("shelljs");
var cron = require('node-cron');

export default async function cronjob(fastify: FastifyInstance) {
    // node-cron =========================================
    const secondNow = +moment().get('second');
    const timingSch = `${secondNow} */1 * * * *`;  // every minute
    let timingSchedule: any = [];
    timingSchedule['isonline'] = { version: fastify.apiVersion, apiSubVersion: fastify.apiSubVersion };
    timingSchedule['nrefer'] = { version: fastify.apiVersion, apiSubVersion: fastify.apiSubVersion };
    timingSchedule['cupDataCenter'] = { version: fastify.apiVersion, apiSubVersion: fastify.apiSubVersion };

    // Check IS-Online Auto Send
    timingSchedule['isonline'].autosend = +process.env.IS_AUTO_SEND === 1 || false;
    timingSchedule['isonline'].minute = process.env.IS_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.IS_AUTO_SEND_EVERY_MINUTE) : 0;
    timingSchedule['isonline'].hour = process.env.IS_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.IS_AUTO_SEND_EVERY_HOUR) : 0;


    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute < 10 ? 10 : timingSchedule['isonline'].minute;
    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute >= 60 ? (timingSchedule['isonline'].minute % 60) : timingSchedule['isonline'].minute;
    timingSchedule['isonline'].hour = timingSchedule['isonline'].hour > 23 ? (timingSchedule['isonline'].hour % 23) : timingSchedule['isonline'].hour;

    if (timingSchedule['isonline'].hour == 0 && timingSchedule['isonline'].minute == 0) {
        timingSchedule['isonline'].autosend = false;
    }

    // Check nRefer Auto Send
    timingSchedule['nrefer'].autosend = +process.env.NREFER_AUTO_SEND === 1 || false;
    timingSchedule['nrefer'].minute = process.env.NREFER_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_MINUTE) : 0;
    timingSchedule['nrefer'].hour = process.env.NREFER_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_HOUR) : 0;
    if (timingSchedule['nrefer'].minute > 0) {
        timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute < 10 ? 10 : timingSchedule['nrefer'].minute;
        timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute > 60 ? (timingSchedule['nrefer'].minute % 60) : timingSchedule['nrefer'].minute;
        timingSchedule['nrefer'].hour = 0;
    } else if (+timingSchedule['nrefer'].hour > 0) {
        timingSchedule['nrefer'].hour = timingSchedule['nrefer'].hour > 23 ? (timingSchedule['nrefer'].hour % 23) : timingSchedule['nrefer'].hour;
    } else {
        timingSchedule['nrefer'].autosend = false;
    }

    // Auto send CUP Data Center
    timingSchedule['cupDataCenter'].autosend = +process.env.HIS_DATACENTER_ENABLE === 1 || false;
    timingSchedule['cupDataCenter'].minute =
        (process.env.HIS_DATACENTER_SEND_EVERY_MINUTE ? +process.env.HIS_DATACENTER_SEND_EVERY_MINUTE : 0) +
        (process.env.HIS_DATACENTER_SEND_EVERY_HOUR ? +process.env.HIS_DATACENTER_SEND_EVERY_HOUR : 2) * 60;
    // timingSchedule['cupDataCenter'].minute = timingSchedule['cupDataCenter'].minute < 5 ? 5 : timingSchedule['cupDataCenter'].minute;

    // ตรวจสอบการ start ด้วยเวลาที่กำหนด (ทุกๆ 1 นาที)
    console.log('crontab start: ', timingSch);
    if (timingSchedule['nrefer'].autosend) {
        console.log('crontab nRefer start every (minute)', timingSchedule['nrefer'].minute);
    }
    if (timingSchedule['isonline'].autosend) {
        console.log('crontab ISOnline start every (minute)', timingSchedule['isonline'].minute);
    }
    if (timingSchedule['cupDataCenter'].autosend) {
        console.log('crontab Data Center start every (minute)', timingSchedule['cupDataCenter'].minute);
    }

    cron.schedule(timingSch, async (req, res) => {
        const minuteSinceLastNight = (+moment().get('hour')) * 60 + (+moment().get('minute'));
        const minuteNow = +moment().get('minute') == 0 ? 60 : +moment().get('minute');
        const hourNow = +moment().get('hour');

        if (timingSchedule['nrefer']['autosend'] &&
            ((timingSchedule['nrefer'].hour > 0 &&
                hourNow % timingSchedule['nrefer'].hour == 0 &&
                minuteNow == timingSchedule['nrefer'].minute) ||
                (timingSchedule['nrefer'].minute > 0 &&
                    minuteNow % timingSchedule['nrefer'].minute == 0))) {
            doAutoSend(req, res, 'nrefer', './routes/refer/crontab');
        }

        if (timingSchedule['isonline']['autosend'] &&
            ((timingSchedule['isonline'].hour > 0 &&
                hourNow % timingSchedule['isonline'].hour == 0 &&
                minuteNow == timingSchedule['isonline'].minute) ||
                (timingSchedule['isonline'].minute > 0 &&
                    minuteNow % timingSchedule['isonline'].minute == 0))) {
            doAutoSend(req, res, 'isonline', './routes/isonline/crontab');
        }

        if (timingSchedule['cupDataCenter'].autosend &&
            minuteSinceLastNight % timingSchedule['cupDataCenter'].minute == 0) {
            doAutoSend(req, res, 'cupDataCenter', './routes/pcc/crontab');
        }
    });


    async function doAutoSend(req, res, serviceName, functionName) {
        let firstProcess: any = { pid: -1 };
        if (process.env.START_TOOL === 'nodemon') {
            firstProcess.pid = process.pid;
        } else {
            var jlist: any = await shell.exec('pm2 jlist');
            let pm2Process = jlist && jlist !== '' ? JSON.parse(jlist) : [];

            let processList = [];
            for (let p of pm2Process) {
                if (p.name === process.env.PM2_NAME) {
                    await processList.push(p);
                }
            }

            if (processList.length) {
                firstProcess = processList[0];
            }
        }

        if (firstProcess.pid === process.pid) {
            const now = moment().locale('th').format('HH:mm:ss');
            const db = serviceName == 'isonline' ? fastify.dbISOnline : fastify.dbHIS;
            console.log(`${now} start cronjob '${serviceName}' on PID ${process.pid}`);
            await require(functionName)(req, res, db, timingSchedule[serviceName]);
        }
    }
}
