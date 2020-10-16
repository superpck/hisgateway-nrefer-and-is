# HIS Connection API สำหรับ nRefer, ISOnline, CUP Datacenter and Quality drug store

## การติดตั้ง

### 1.ติดตั้งโปรแกรมที่จำเป็นในการใช้งาน
```
1.1 NodeJS
   1.1.1 Windows, Mac download ที่ https://nodejs.org/en/download/
   1.1.2 Linux ทำตามขั้นตอน https://github.com/nodesource/distributions/blob/master/README.md#rpminstall
1.2 ติดตั้ง package ที่จำเป็น > npm install -g pm2 nodemon typescript ts-node
1.3 ติดตั้ง git โดย download จาก website https://git-scm.com/
```

### 2.Source code
```
2.1.สร้าง Folder ที่จะใช้เก็บ API เช่น mkdir c:\API
2.2 cd api
2.3 ทำการ clone source จาก github ด้วยคำสั่ง git clone https://github.com/superpck/hisgateway-nrefer-and-is his_connect
2.4 cd his_connect
2.5 npm install
2.6 กรณีพบ vulnerabilities ให้ทำการ fix ด้วยคำสั่ง npm audit fix --force
2.7 copy file config.default แล้วตั้งชื่อ file ใหม่เป็น config
2.8 แก้ไขค่าต่างๆ ใน file config ให้ถูกต้อง
```

## 3.Test API
```
3.1 ทดสอบการทำงานด้วยคำสั่ง nodemon
3.2 เปิด http://localhost:<port ที่กำหนดตาม config> ใน browser เพื่อแสดงผล
3.3 ทดสอบการเชื่อต่อฐานข้อมูล HIS http://localhost:<port>/his/alive
3.4 ทดสอบการเชื่อต่อฐานข้อมูล IS http://localhost:<port>/isonline/alive
3.5 กรณี Linux สามารถ config ค่าด้วย url http://localhost:<port>/setup-api
```

## 4.Running ใช้งานจริง
```
# ควร run จาก javascript ที่ compile แล้ว
4.1 compile source ด้วยคำสั่ง tsc
4.2 กรณี windows ให้ติดตั้ง auto start ด้วยคำสั่ง
  4.2.1 npm install pm2-windows-startup -g
  4.2.2 pm2-startup install
4.3 กรณี Linux ให้ใช้คำสั้ง pm2 startup
4.4 start การใช้งาน API ด้วยคำสั่ง pm2 start app/app.js -i 2 --name "his-connect"
## ชื่อ --name จะต้องตรงกับค่า PM2_NAME ใน config file
4.5 ใช้คำสั่ง pm2 save เพื่อบันทึกค่าที่ใช้งานในปัจจุบัน
```

# 5.การ Update Source code
```
5.1 เข้าไปที่ folder ที่เก็บ API เช่น > cd \api\his_connect
5.2 update source code จาก github > git pull
5.3 ติดตั้ง package (เผื่อมีการติดตั้งเพิ่มเติม) > npm install
5.4 กรณีพบ vulnerabilities ให้ทำการ fix ด้วยคำสั่ง > npm audit fix --force
5.5 ทำการ compile source code ด้วยคำสั่ง > tsc
5.6 Restart API ที่เคย run ไว้แล้วด้วยคำสั่ง > pm2 restart his-connect
```

# 6.push to git กรณีเป็นทีมพัฒนา (Develop@MOPH)
```
6.1 > git add .
6.2 > git commit -m "คำอธิบายสิ่งที่แก้ไข"
6.3 > git push origin <branch name>
6.4 กรณี push ไม่ได้ ให้ทำการ git pull ก่อน
```

# 7.ข้อควรระวัง
```
7.1 user/password ที่เข้าถึงฐานข้อมูล ควรให้สิทธิ์ select อย่างเดียว
7.2 ไม่ควรติดตั้ง API บนเครื่องที่มีผู้ใช้งานเข้าถึงได้ง่าย เพื่อป้องกันอ่าน file config
7.3 เพื่อความปลอดภัยในการเข้าถึงฐานข้อมูลส่วนกลาง ควรมีการเปลี่ยนรหัสผ่านสำหรับการส่งข้อมูล IS Online และ API Secret Key ทุก 3-6 เดือน
7.4 ควรยกเลิกการใช้งาน username ที่มีการย้ายงาน หรือ ย้ายสถานที่ทำงาน หรือ ลาออก
```

# credit
```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```

เอกสารการติดตั้ง
https://docs.google.com/document/d/1jKXwA12WNyRr-phcjQXRLz9xTJz5BreTPDBy2saWpOs
