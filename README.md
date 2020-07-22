# HIS Gateway local installation for nRefer, ISOnline, CUP Datacenter and Quality drug store

## Installation
### Fastify and TypeScript
```
ติดตั้ง git ตาม website https://git-scm.com/
ติดตั้ง nodejs ตาม website https://nodejs.org/

ติดตั้ง package ที่จำเป็น
> npm install typescript ts-node pm2 nodemon -g
```

### การติดตั้ง
```
> git clone https://github.com/superpck/hisgateway-nrefer-and-is
> cd his_api
> npm install
> npm audit fix --force
> copy file config.default ตั้งชื่อ file เป็น config
แก้ไขข้อมูลใน file config
```

## Test
```
> nodemon
open browser and go to http://localhost:<port ที่กำหนดใน config>
http://localhost:<port>/his/alive
http://localhost:<port>/setup-api

```

## Running
```
# run จาก javascript ที่ compile แล้ว
> tsc    ## ทำการ compile source code
> pm2 start app/app.js -i 2 --name "his-gateway"
## ชื่อ --name จะต้องตรงกับค่า PM2_NAME ใน config
ทำการเปิด http://localhost:<port ที่กำหนดใน config> ใน browser

# run จาก source code ที่ยังคงเป็น typescript
> pm2 start --interpreter ts-node src/app.ts his_gateway

หากต้องการให้ OS start pm2 ทุกครั้งที่เปิดเครื่องให้ใช้คำสั่งดังนี้

# Linux} MacOS
-------------------
> pm2 startup  ทำครั้งเดียว

บันทึกสถานะปัจจุบันเพื่อใช้ในการ Start ครั้งต่อไป
> pm2 save

# Windows
-------------------
ติดตั้ง plugin และ Start การใช้งาน
> npm install pm2-windows-startup -g
> pm2-startup install
บันทึกสถานะปัจจุบันเพื่อใช้ในการ Start ครั้งต่อไป
> pm2 save
```

# Update
```
> cd his_api  ## or API folder
> git pull
> npm install
> npm audit fix --force
> tsc
> pm2 restart his-gateway
```

# push to git
```
> git add .
> git commit -m "คำอธิบายสิ่งที่แก้ไข"
> git push
กรณี push ไม่ได้ ให้ทำการ git pull ก่อน
```

# credit
```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```

# ข้อควรระวัง
```
- กรณี pgSQL แสดงค่า error charset ให้ลบค่า CHARSET ออก เช่น HIS_DB_CHARSET=
- mssql ให้ติดตั้ง version 4.1.0 หรือ 6 เท่านั้น "npm install --save mssql@4.1.0"
```

เอกสารการติดตั้ง
https://docs.google.com/document/d/1jKXwA12WNyRr-phcjQXRLz9xTJz5BreTPDBy2saWpOs
