# HIS Connection API สำหรับ nRefer, ISOnline, CUP Datacenter and Quality drug store

## การติดตั้ง
### 1.โปรแกรมที่จำเป็นในการใช้งาน
```
ติดตั้ง git ตาม website https://git-scm.com/
ติดตั้ง nodejs ตาม website https://nodejs.org/

ติดตั้ง package ที่จำเป็น
> npm install typescript ts-node pm2 nodemon -g
```

### 2.Source code
```
> git clone https://github.com/superpck/hisgateway-nrefer-and-is his_connection
> cd his_connection
> npm install
> npm audit fix --force
> copy file config.default ตั้งชื่อ file เป็น config
แก้ไขข้อมูลใน file config
```

## Test API
```
> nodemon
open browser and go to http://localhost:<port ที่กำหนดใน config>
http://localhost:<port>/his/alive
http://localhost:<port>/setup-api

```

## Running
```
# ควร run จาก javascript ที่ compile แล้ว
1. Compile source code ด้วยคำสั่ง > tsc
2. run API ด้วยคำสั่ง > pm2 start app/app.js -i 2 --name "his-connection"
## ชื่อ --name จะต้องตรงกับค่า PM2_NAME ใน config file
3. เปิด browser แล้วเข้าไปที่ http://localhost:<port ที่กำหนดใน config>
```

# การ Update Source code
```
1. เข้าไปที่ folder ที่เก็บ API > cd his_connection
2. update source code จาก github > git pull
3. ติดตั้ง package (เผื่อมีการติดตั้งเพิ่มเติม) > npm install
4. กรณีพบ vulnerabilities ให้ทำการ fix ด้วยคำสั่ง > npm audit fix --force
5. ทำการ compile source code ด้วยคำสั่ง > tsc
6. Restart ที่เคย run ไว้แล้วด้วยคำสั่ง > pm2 restart his-connection
```

# push to git กรณีเป็นทีมพัฒนา (Develop@MOPH)
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
