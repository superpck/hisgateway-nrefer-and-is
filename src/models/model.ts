export interface IUserStructure {
  id?: any; //int(11) NOT NULL AUTO_INCREMENT,
  date?: any; //int(11) DEFAULT NULL,
  username?: any; //varchar(30) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  prename?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  fname?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  lname?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  sex?: any; //tinyint(1) DEFAULT NULL,
  cid?: any; //varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  position?: any; //varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  position_level?: any; //varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  hcode?: any; //varchar(13) COLLATE utf8_unicode_ci DEFAULT NULL,
  division?: any; //varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  department?: any; //varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  email?: any; //varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  tel_office?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  tel_mobile?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  line_id?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  password_hash?: any; //varchar(60) COLLATE utf8_unicode_ci NOT NULL,
  encr?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  password_salt?: any; //varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  shar?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  auth_key?: any; //varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  confirmed_at?: any; //int(11) DEFAULT NULL,
  unconfirmed_email?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  blocked_at?: any; //int(11) DEFAULT NULL,
  verify_at?: any; //int(11) DEFAULT NULL,
  expire_at?: any; //int(11) DEFAULT NULL,
  registration_ip?: any; //varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  created_at?: any; //int(11) NOT NULL,
  updated_at?: any; //int(11) NOT NULL,
  flags?: any; //int(11) NOT NULL DEFAULT '0',
  user_level?: any; //tinyint(2) DEFAULT '0',
  status?: any; //int(2) DEFAULT '10',
  detail?: any; //text COLLATE utf8_unicode_ci,
  remark?: any; //text COLLATE utf8_unicode_ci,
  create_system?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT 'ISONLINE',
  avarta?: any; //longblob,
}

export interface IisStructure {
  id: number;// int(10) unsigned NOT NULL,
  hosp: string; //varchar(10) NOT NULL COMMENT 'รหัสโรงพยาบาล',
  prov: string; //varchar(2) DEFAULT NULL COMMENT 'ชื่อจังหวัด',
  hn: any; //varchar(10) DEFAULT NULL,
  an?: any;
  prename?: any; //varchar(20) DEFAULT NULL COMMENT 'คำนำหน้าชื่อ',
  name: any; //varchar(30) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL COMMENT 'ชื่อ',
  fname?: any; //varchar(30) DEFAULT NULL COMMENT 'สกุล',
  pid?: any; //varchar(13) DEFAULT NULL,
  home?: any; //char(1) DEFAULT NULL COMMENT 'จังหวัดที่อยู่ 1. ในจังหวัด 2. นอกจังหวัด 3. นอกประเทศ N ไม่ทราบ',
  ampur?: any; //varchar(50) DEFAULT NULL,
  changwat?: any; //varchar(50) DEFAULT NULL,
  sex?: any; //tinyint(1) DEFAULT '1',
  birth?: any; //datetime DEFAULT NULL,
  day?: any; //int(4) DEFAULT NULL,
  month?: any; //int(4) DEFAULT NULL,
  age?: any; //int(4) DEFAULT NULL,
  occu?: any; //varchar(2) DEFAULT NULL COMMENT 'อาชีพ',
  occu_t?: any; //varchar(50) DEFAULT NULL COMMENT 'อาชีพอื่นๆ',
  adate?: any; //datetime DEFAULT NULL COMMENT 'วันที่เกิดเหตุ',
  atime?: any; //datetime DEFAULT NULL COMMENT 'เวลาที่เกิดเหตุ',
  hdate?: any; //datetime DEFAULT NULL COMMENT 'วันที่ผู้บาดเจ็บมารับการรักษาที่โรงพยาบาล',
  htime?: any; //datetime DEFAULT NULL COMMENT 'เวลาที่ผู้บาดเจ็บมารับการรักษาที่โรงพยาบาล',
  aplace?: any; //varchar(4) DEFAULT NULL COMMENT 'สถานที่เกิดเหตุ',
  aampur?: any; //varchar(2) DEFAULT NULL,
  tumbon?: any; //varchar(2) DEFAULT NULL,
  mooban?: any; //varchar(50) DEFAULT NULL,
  apoint?: any; //varchar(3) DEFAULT NULL COMMENT 'จุดเกิดเหตุ',
  apointname?: any; //varchar(50) DEFAULT NULL COMMENT 'ระบุสถานที่เกิดเหตุ',
  injby?: any; //char(1) DEFAULT NULL COMMENT 'การบาดเจ็บเกิดโดย เจตนาหรือไม่',
  injoccu?: any; //char(1) DEFAULT NULL,
  cause?: any; //char(1) DEFAULT NULL COMMENT 'สาเหตุของการบาดเจ็บ',
  cause_t?: any; //varchar(50) DEFAULT NULL,
  injp?: any; //char(1) DEFAULT NULL COMMENT 'ผู้บาดเจ็บเกี่ยวข้องกับอุบัติเหตุ',
  injt?: any; //varchar(2) DEFAULT NULL COMMENT 'สัตว์ หรือพานะที่ถูกใช้ในการขนส่ง',
  injt_t?: any; //varchar(50) DEFAULT NULL,
  injfrom?: any; //varchar(2) DEFAULT NULL COMMENT 'การบาดเจ็บเกิดจาก',
  injfrom_t?: any; //varchar(50) DEFAULT NULL,
  icdcause?: any; //varchar(50) DEFAULT NULL COMMENT 'สาเหตุของอุบัติเหตุและการบาดเจ็บตาม ICD 10',
  activity?: any; //varchar(50) DEFAULT NULL COMMENT 'กิจกรรมขณะเกิดเหตุ',
  product?: any; //varchar(50) DEFAULT NULL COMMENT 'ผลิตภัณฑ์ที่ทำให้บาดเจ็บ',
  risk1?: any; //char(1) DEFAULT NULL,
  alclevel?: any; //float(8,2) DEFAULT NULL,
  risk2?: any; //char(1) DEFAULT NULL,
  risk3?: any; //char(1) DEFAULT NULL,
  risk4?: any; //char(1) DEFAULT NULL,
  risk5?: any; //char(1) DEFAULT NULL,
  risk9_text?: any; //varchar(50) DEFAULT NULL,
  risk9?: any; //char(1) DEFAULT NULL,
  pmi?: any; //char(1) DEFAULT NULL COMMENT 'ผู้บาดเจ็บเสียชีวิต ณ จุดเกิดเหตุ',
  atohosp?: any; //char(1) DEFAULT NULL,
  ems?: any; //varchar(2) DEFAULT NULL,
  atohosp_t?: any; //varchar(50) CHARACTER SET tis620 DEFAULT NULL,
  htohosp?: any; //varchar(50) DEFAULT NULL,
  hprov?: any; //varchar(2) DEFAULT NULL,
  amb?: any; //char(1) DEFAULT NULL,
  refer?: any; //char(1) DEFAULT NULL,
  airway?: any; //char(1) DEFAULT NULL,
  airway_t?: any; //varchar(50) DEFAULT NULL,
  blood?: any; //char(1) DEFAULT NULL,
  blood_t?: any; //varchar(50) DEFAULT NULL,
  splintc?: any; //char(1) DEFAULT NULL,
  splntc_t?: any; //varchar(50) DEFAULT NULL,
  splint?: any; //char(1) DEFAULT NULL,
  splint_t?: any; //varchar(50) DEFAULT NULL,
  iv?: any; //char(1) DEFAULT NULL,
  iv_t?: any; //varchar(50) DEFAULT NULL,
  hxcc?: any; //char(1) DEFAULT NULL,
  hxcc_hr?: any; //int(4) DEFAULT NULL,
  hxcc_min?: any; //int(4) DEFAULT NULL,
  bp1?: any; //int(4) DEFAULT NULL,
  bp2?: any; //int(4) DEFAULT NULL,
  bp?: any; //varchar(3) DEFAULT NULL,
  pr?: any; //int(4) DEFAULT NULL,
  rr?: any; //int(4) DEFAULT NULL,
  e?: any; //int(4) DEFAULT NULL,
  v?: any; //int(4) DEFAULT NULL,
  m?: any; //int(4) DEFAULT NULL,
  coma?: any; //int(4) DEFAULT NULL,
  tinj?: any; //char(1) DEFAULT NULL,
  diser?: any; //datetime DEFAULT NULL,
  timer?: any; //datetime DEFAULT NULL,
  er?: any; //char(1) DEFAULT NULL,
  er_t?: any; //varchar(50) DEFAULT NULL,
  staer?: any; //char(1) DEFAULT NULL,
  ward?: any; //varchar(4) DEFAULT NULL,
  diag1?: any; //varchar(50) DEFAULT NULL,
  br1?: any; //int(4) DEFAULT NULL,
  ais1?: any; //int(4) DEFAULT NULL,
  diag2?: any; //varchar(50) DEFAULT NULL,
  br2?: any; //int(4) DEFAULT NULL,
  ais2?: any; //int(4) DEFAULT NULL,
  diag3?: any; //varchar(50) DEFAULT NULL,
  br3?: any; //int(4) DEFAULT NULL,
  ais3?: any; //int(4) DEFAULT NULL,
  diag4?: any; //varchar(50) DEFAULT NULL,
  br4?: any; //int(4) DEFAULT NULL,
  ais4?: any; //int(4) DEFAULT NULL,
  diag5?: any; //varchar(50) DEFAULT NULL,
  br5?: any; //int(4) DEFAULT NULL,
  ais5?: any; //int(4) DEFAULT NULL,
  diag6?: any; //varchar(50) DEFAULT NULL,
  br6?: any; //int(4) DEFAULT NULL,
  ais6?: any; //int(4) DEFAULT NULL,
  rdate?: any; //datetime DEFAULT NULL,
  staward?: any; //char(1) DEFAULT NULL,
  rts?: any; //float(8,2) DEFAULT NULL,
  iss?: any; //int(4) DEFAULT NULL,
  ps?: any; //float(10,4) DEFAULT NULL,
  pttype?: any; //int(4) DEFAULT NULL,
  pttype2?: any; //int(4) DEFAULT NULL,
  pttype3?: any; //int(4) DEFAULT NULL,
  acc_id?: any; //varchar(7) DEFAULT NULL,
  lblind?: any; //int(4) DEFAULT NULL,
  blind1?: any; //int(4) DEFAULT NULL,
  blind2?: any; //int(4) DEFAULT NULL,
  blind3?: any; //int(4) DEFAULT NULL,
  blind4?: any; //int(4) DEFAULT NULL,
  lcost?: any; //int(4) DEFAULT NULL,
  recorder?: any; //varchar(50) DEFAULT NULL,
  recorderipd?: any; //varchar(50) DEFAULT NULL,
  referhosp?: any; //varchar(50) DEFAULT NULL,
  referprov?: any; //varchar(50) DEFAULT NULL,
  alctype?: any; //varchar(50) DEFAULT NULL,
  alcbrand?: any; //varchar(50) DEFAULT NULL,
  alcbuy?: any; //varchar(50) DEFAULT NULL,
  alcbuy_t?: any; //varchar(50) DEFAULT NULL,
  addressbuy?: any; //varchar(50) DEFAULT NULL,
  moobanbuy?: any; //varchar(50) DEFAULT NULL,
  tambonbuy?: any; //varchar(50) DEFAULT NULL,
  ampurbuy?: any; //varchar(50) DEFAULT NULL,
  changwatbuy?: any; //varchar(50) DEFAULT NULL,
  buytime?: any; //datetime DEFAULT NULL,
  dlt?: any; //datetime DEFAULT NULL,
  edt?: any; //datetime DEFAULT NULL,
  vn?: any; //varchar(10) DEFAULT NULL,
  lat?: any; //varchar(15) DEFAULT NULL,
  lng?: any; //varchar(15) DEFAULT NULL,
  remark?: any;
  token?: any; //varchar(64) DEFAULT NULL,
}

export interface IUserStructure {
  id?: any; //int(11) NOT NULL AUTO_INCREMENT,
  date?: any; //int(11) DEFAULT NULL,
  username?: any; //varchar(30) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  prename?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  fname?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  lname?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  sex?: any; //tinyint(1) DEFAULT NULL,
  cid?: any; //varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  position?: any; //varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  position_level?: any; //varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  hcode?: any; //varchar(13) COLLATE utf8_unicode_ci DEFAULT NULL,
  division?: any; //varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  department?: any; //varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  email?: any; //varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  tel_office?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  tel_mobile?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  line_id?: any; //varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  password_hash?: any; //varchar(60) COLLATE utf8_unicode_ci NOT NULL,
  encr?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  password_salt?: any; //varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  sha?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  auth_key?: any; //varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  confirmed_at?: any; //int(11) DEFAULT NULL,
  unconfirmed_email?: any; //varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  blocked_at?: any; //int(11) DEFAULT NULL,
  verify_at?: any; //int(11) DEFAULT NULL,
  expire_at?: any; //int(11) DEFAULT NULL,
  registration_ip?: any; //varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  created_at?: any; //int(11) NOT NULL,
  updated_at?: any; //int(11) NOT NULL,
  flags?: any; //int(11) NOT NULL DEFAULT '0',
  user_level?: any; //tinyint(2) DEFAULT '0',
  status?: any; //int(2) DEFAULT '10',
  detail?: any; //text COLLATE utf8_unicode_ci,
  remark?: any; //text COLLATE utf8_unicode_ci,
  create_system?: any; //varchar(50) COLLATE utf8_unicode_ci DEFAULT 'ISONLINE',
  avarta?: any; //longblob,
}
