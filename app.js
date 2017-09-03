var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require("socket.io")(http);

// プレイヤー管理
var players = {};

// 静的ファイル配置
app.use(express.static(__dirname + '/'));

// ルーティング
app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
});

// ソケット通信
io.on('connection', function(socket)
{
    // 接続
    outputLog('connection id ' + socket.id);
    players[socket.id] = {id:socket.id, x:-16, y:-16, f:0, s:0};
    socket.emit('connected', socket.id, players);
    
    // 受信
    socket.on('update', function(player)
    {
        players[socket.id] = player;
    });
    
    // 送信
    setInterval(function()
    {
        socket.emit('updated', players);
    }, 100 / 3);
    
    // 切断
    socket.on('disconnect', function()
    {
        outputLog('disconnect id ' + socket.id);
        delete players[socket.id];
    });
});

// ログ出力
function outputLog(mes)
{
    var d = new Date();
    console.log('[' + d.getFullYear() + '/'
                + ('0' + (d.getMonth() + 1)).slice(-2) + '/'
                + ('0' + d.getDate()).slice(-2) + ' '
                + ('0' + d.getHours()).slice(-2) + ':'
                + ('0' + d.getMinutes()).slice(-2) + ':'
                + ('0' + d.getSeconds()).slice(-2) + '] ' + mes);
}

// サーバ起動
var port = process.env.PORT || 3000;
http.listen(port, function()
{
    outputLog('listening on port ' + port);
});
