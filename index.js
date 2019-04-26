const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const request = require('request');
const cookieParser = require('cookie-parser')

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
            'bearer': token
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

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});