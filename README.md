# HIS Gateway local installation for nRefer, ISOnline, CUP Datacenter and Quality drug store

## Installation
### Fastify and TypeScript
```
ติดตั้ง git ตาม website https://git-scm.com/
ติดตั้ง nodejs ตาม website https://nodejs.org/

ติดตั้ง package ที่จำเป็น
npm install typescript ts-node pm2 nodemon -g
```

### source code
```
git clone https://gitlab.com/moph/hisgateway/his-gateway-api his_gateway_api
cd his_gateway_api
npm install
npm audit fix --force
copy file config.default ตั้งชื่อ file เป็น config
แก้ไขข้อมูลใน file config
```

## Test
```
nodemon
open browser and go to http://localhost:<port ที่กำหนดใน config>
http://localhost:<port>/his/alive
http://localhost:<port>/setup-api

```

## Running
```
tsc -> compile source code
pm2 start app/app.js -i 2 --name "his-gateway"
open browser and go to http://localhost:<port ที่กำหนดใน config>
```

## PM2
```
pm2 start --interpreter ts-node src/app.ts his_gateway
```

# push to git
```
git add .
git commit -m "คำอธิบายสิ่งที่แก้ไข"
git push
กรณี push ไม่ได้ ให้ทำการ git pull ก่อน
```

# credit
```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```

# ข้อควรระวัง
```
- mssql ให้ติดตั้ง version 4.1.0 เท่านั้น "npm install --save mssql@4.1.0"
```

เอกสารการติดตั้ง
https://docs.google.com/document/d/1jKXwA12WNyRr-phcjQXRLz9xTJz5BreTPDBy2saWpOs
