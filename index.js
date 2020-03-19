const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const request = require('request');
const cookieParser = require('cookie-parser')

const rp = require('request-promise')
const cheerio = require("cheerio");



app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }));

function render(filename, params, callback) {
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) return cabllack(err);
        for (var key in params) {
            data = data.replace('{' + key + '}', params[key]);
        }
        callback(null, data); // 用 callback 傳回結果
    });
}

function registerLineNotify(token, clientId, clientSecret, callback) {

    const clientServerOptions = {
        method: 'POST',
        uri: 'https://notify-bot.line.me/oauth/token',
        form: {
            grant_type: "authorization_code",
            code: token,
            redirect_uri: "http://localhost:3000/",
            client_id: clientId,
            client_secret: clientSecret,
        },
    }

    request(clientServerOptions, function (error, response, body) {
        console.log(body);
        let accessToken = JSON.parse(body).access_token;
        console.log("accessToken:", accessToken)

        if (JSON.parse(body).status == 200) {
            callback(accessToken)
        } else {
            callback("註冊失敗,請重新註冊")
        }
        return;
    });
}



app.post('/registerLineNotify', function (req, res) {
    console.log(req.body.token);
    console.log(req.body.clientId);
    console.log(req.body.clientSecret);

    registerLineNotify(req.body.token, req.body.clientId, req.body.clientSecret, function (data) {
        console.log("accessToken:", data)
        if (data !== "註冊失敗,請重新註冊") {
            res.cookie("accessToken", data, { maxAge: 24 * 60 * 60 * 1000 })
        } else {
            res.clearCookie('accessToken');
        }

        res.send(data); // 這邊要寫一個 function 才能接收到資料
    })
});

function pushMessage(message, token, callback) {
    const clientServerOptions = {
        method: 'POST',
        uri: 'https://notify-api.line.me/api/notify',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
            'bearer': 'kAz9ZVRimgANgVCC32s5k06XygFjYkpe0Z5ePZKeolO'
        },
        form: {
            message: message
        },
    }
    request(clientServerOptions, function (error, response, body) {
        console.log(error, response, body);
        callback(body)
        return;
    });
}

function pushMessage1(message, callback) {
    const clientServerOptions = {
        method: 'POST',
        uri: 'https://notify-api.line.me/api/notify',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
            'bearer': 'kAz9ZVRimgANgVCC32s5k06XygFjYkpe0Z5ePZKeolO'
        },
        form: {
            message: message
        },
    }
    request(clientServerOptions, function (error, response, body) {
        console.log(error, response, body);
        callback(body)
        return;
    });
}


function getVixDataWithWebPer30Sec() {
    console.log('getVixData');
    // 每30爬一次價格後回傳

    rp(
        {
            url: "https://websys.fsit.com.tw/FubonETF/Trade/RealTimeNav.aspx?lan=TW&area=FU",
            // url: "http://localhost:3005/testVixHtm",
            method: "GET"
        }
    ).then((aa) => {

        console.log(" new 有來打大樂透")

        const $ = cheerio.load(aa); // 載入 body
        console.log("$:", $);
        // const result = []; // 建立一個儲存結果的容器
        // https://andy6804tw.github.io/2018/02/11/nodejs-crawler/
        const today = new Date()

        const no1 = $('table tr').text();
        console.log('no1:', no1);
        str = no1.replace(/\s*/g, "");
        console.log(str);
        // console.log('及時淨值:' ,str.split("即時估計淨值B")[1].substr(18,5));
        // console.log('及時淨值時間:',str.split("即時估計淨值B")[1].substr(0,18));
        // console.log('即時成交價格:' ,str.split("即時成交價格D")[1].substr(18,5));
        // console.log('即時成交時間:',str.split("即時成交價格D")[1].substr(0,18));
        // console.log('即時折溢價幅:',str.split("即時折溢價幅(D-B)/B")[1].substr(18,6));


        a = '及時淨值:' + str.split("即時估計淨值B")[1].substr(18, 5);
        b = '及時淨值時間:' + str.split("即時估計淨值B")[1].substr(0, 18);
        c = '即時成交價格:' + str.split("即時成交價格D")[1].substr(18, 5);
        d = '即時成交時間:' + str.split("即時成交價格D")[1].substr(0, 18);
        e = '即時折溢價幅:' + str.split("即時折溢價幅(D-B)/B")[1].substr(18, 6);


        console.log(a);
        console.log(b);
        console.log(c);
        console.log(d);
        console.log(e);

        console.log(a + "\r\n" + b + "\r\n" + c + "\r\n" + d + "\r\n" + e);

        const message = "\r\n"+  a + "\r\n" + b + "\r\n" + c + "\r\n" + d + "\r\n" + e;
        pushMessage1(message,()=>{ return });
    });




}


app.get('/testVixHtm', (req, res) => {
    render('vixTest.html', {

    }, function (err, data) {
        res.send(data);
    });


})


app.get('/test', function (req, res) {
    render('test.html', {

    }, function (err, data) {
        res.send(data);
    });

})
app.get('/register/:clientId', function (req, res) {
    render('auth.html', {
        clientId: req.params.clientId
    }, function (err, data) {
        res.send(data);
    });

})


app.post('/pushLineNotifyMessage', function (req, res) {
    console.log(req.body.message);

    pushMessage(req.body.message, req.cookies.accessToken, function (data) {
        render('pushLineNotify.html', {
            accessToken: req.cookies.accessToken
        }, function (err, data) {
            res.send(data); // 這邊要寫一個 function 才能接收到資料
        });
    });
})
app.get('/pushLineNotify', function (req, res) {
    if (req.cookies.accessToken) {
        render('pushLineNotify.html', {
            accessToken: req.cookies.accessToken
        }, function (err, data) {
            res.send(data); // 這邊要寫一個 function 才能接收到資料
        });
    } else {
        res.send("token不存在請去註冊")
    }
})

app.get('/', function (req, res) {
    console.log("req", req.query.code);
    render('index.html', {
        token: req.query.code
    }, function (err, data) {
        res.send(data); // 這邊要寫一個 function 才能接收到資料
    });
});



app.listen(3005, () => {

    console.log('Example app listening on port 3000!');
    setInterval(() => {
        getVixDataWithWebPer30Sec();
        
    }, 1000*60*3);

});