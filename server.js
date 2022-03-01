// '/' directory
const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const mailService = require('./service/mailing.js');
const path = require(`path`);
const moment = require('moment');
const schedule = require('node-schedule');
require('dotenv').config({path: path.join(__dirname, "./credentials/.env")}); //dir수정

const app = express();
const port = process.env.PORT || 8001;

app.use(express.json()); 
app.use(express.urlencoded({extend:true}));
app.use(cors());
app.use(cookieParser());

app.listen(port, () => {
    console.log(`express is running on ${port}`);
});

let job = null;
let nowRunning = false;

let testScheduling = '30 * * * * *';
let schedulingforDeployment = '0 0 23 * * *';

const serviceStart = () => {
    console.log("감지 서비스 시작");
    nowRunning = true;
    job = schedule.scheduleJob(schedulingforDeployment, () => {
        let now = moment();
        console.log(now.format("YYYY년 MM월 DD일 HH시 MM분") + " 이메일 전송 완료");
        mailService.sendEmail();
    })
}

// 나중에 자꾸 도메인 입력 레퍼런싱되면 post로 토큰 넣어서 시작 종료하도록 해야할듯
app.get('/end', (req, res) => {
    nowRunning = false
    job.cancel();
});

app.get('/start', serviceStart)

app.get('/check-alive', (req, res) => {
    res.send(nowRunning)
})

app.get('/', (req, res) => {
    console.log("eat the heroku Kaffeine!");
    res.send("eat the heroku Kaffeine!"); // kaffeine 서비스 작동용 response
})