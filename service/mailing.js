const nodemailer = require('nodemailer'); 
const smtpTransporter = require('nodemailer-smtp-transport'); 
const { default: axios } = require('axios');
const cheerio = require('cheerio');
const iconv_lite = require('iconv-lite');
const moment = require('moment');

// credentials
const path = require(`path`);
require('dotenv').config({path: path.join(__dirname, "./credentials/.env")}); //dir수정

const getData = async (callbackFunc) => {

    const apiUrl = "https://www.bokji.net/not/nti/01.bokji";

    // domain info
    const options = {
        url: apiUrl,
        method: "GET", 
        responseType: "arraybuffer"
    }
    let notices = [];
    try {
        const response = await axios(options);        
        const convert = iconv_lite.decode(response.data, 'utf-8');
        const $ = cheerio.load(convert);

        $('.board_Area > .board_list_type1 > tbody > tr').map((i, element) => {
            let noticeInfo = {
                noticeNumber: $(element).find('.no').text().trim(),
                subject: $(element).find('.subject').text().trim(),
                date: $(element).find('.date').text().trim()
            };
            notices.push(noticeInfo)
        })
        console.log("데이터 획득 완료");
    } catch(err) {
        console.log("Error >>", err);
    }

    callbackFunc(notices);
}

exports.sendEmail = () => { // service
    let smtpTransport = nodemailer.createTransport(smtpTransporter({ 
        service: 'gmail', 
        host: 'smtp.gmail.com', 
        secure: false,
        auth: { 
            user: process.env.SENDER_EMAIL, // sender email
            pass: process.env.SENDER_PW 
        } 
    })); 
    
    getData((data) => {
        let today = moment();
        let sendData = `<span style="white-space:pre; font-size:20px; font-weight:bold"> 
        ${today.format('YYYY년 MM월 DD일')} 공지 모음</span><br>`;
        for(key in data){
            sendData += `<span style="white-space:pre; font-size:14px">
            글 번호 : ${data[key]["noticeNumber"]}
            제목 : ${data[key]["subject"]}
            글 등록 날짜 : ${data[key]["date"]}
            </span>`
        }
        sendData += "<br><br>" + `<a href="https://www.bokji.net/not/nti/01.bokji" style="color: black; font-size: 2.0em; font-weight: bold; background: #efefef;">복지넷 공지사항 바로가기</a>`;

        let mailOption = { 
            from: process.env.SENDER_USERNAME + '의 메일서비스 <'+process.env.SENDER_EMAIL+'>', // sender 
            to: process.env.RECEIVER_EMAIL, // receiver
            subject: "복지넷에 새로운 공고가 있어요!",
            text: "텍스트", 
            html: sendData // mail content
        }

        smtpTransport.sendMail(mailOption, (err, res) => { // send
            if (err) { 
                console.log(err);
                throw err;
            } 
            
            console.log("이메일 전송 완료");
        }); 
    });
}