# HIS Gateway for nRefer Client

## Installation
### Fastify and TypeScript
```
ติดตั้ง git ตาม website https://git-scm.com/
ติดตั้ง nodejs ตาม website https://nodejs.org/
npm install typescript ts-node pm2 nodemon -g
```

### source code
```
สร้าง folder api
cd api
git clone https://github.com/superpck/hisgateway-nrefer-and-is his_api
cd his_api
npm install
npm audit fix --force
copy file config.default ตั้งชื่อ file เป็น config
แก้ไขข้อมูลใน file config
```

## Running
```
tsc -> compile source code
nodemon
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