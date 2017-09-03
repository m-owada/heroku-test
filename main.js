enchant();

var socket = io();
var id = null;

var interval = 1;
var players = {};
var bef_interval = 1;
var bef_players = {};

/**
 * サーバに接続
 */
socket.on('connected', function(k, v){
    id = k;
    players = v;
});

/**
 * サーバから受信
 */
socket.on('updated', function(v){
    bef_interval = interval;
    bef_players = players;
    interval = 1;
    players = v;
});

/**
 * メイン処理
 */
window.onload = function()
{
    // 定数
    const img_ch1 = "img/char1.png";
    const img_ch2 = "img/char2.png";
    const img_map = "img/map.png";
    const img_con = "img/controller.png";
    const img_pu1 = "img/push1.png";
    const img_pu2 = "img/push2.png";
    const img_msg = "img/start.png";

    // フレームワーク
    var game = new Game(320, 460);
    game.preload(img_ch1, img_ch2, img_map, img_con, img_pu1, img_pu2, img_msg);
    
    // タッチ操作制御
    var touch = (new Array(5)).fill(false);
    
    // キーバインド
    game.keybind('A'.charCodeAt(0), 'a');
    
    // メインキャラクタークラス
    var MainChar = Class.create(Sprite,
    {
        initialize: function(scene)
        {
            Sprite.call(this, 16, 16);
            this.image = game.assets[img_ch1];
            this.frame = 0;
            this.x = -16;
            this.y = -16;
            this.scaleX = 1;
            this.gameover = true;
            scene.addChild(this);
        },
        start: function()
        {
            this.frame = 0;
            this.x = game.width / 2 - this.width / 2;
            this.y = -16;
            this.scaleX = 1;
            this.py = this.y;
            this.vy = 0;
            this.f = 1;
            this.jump = false;
            this.collision = 0;
            this.gameover = false;
        },
        colMap: function(map)
        {
            if(this.gameover) return;
            
            // 重力
            this.vy = (this.y - this.py) + this.f;
            if(this.vy > this.height - 1)
            {
                this.vy = this.height - 1;
            }
            this.py = this.y;
            this.y += this.vy;
            this.f = 1;
            
            // 衝突判定（上）
            if(map.hitTest(this.x, this.y) ||
               map.hitTest(this.x + this.width - 1, this.y))
            {
                this.y = Math.floor(this.y / this.height) * this.height + this.height;
            }
            
            // 衝突判定（下）
            if(map.hitTest(this.x, this.y + this.height - 1) ||
               map.hitTest(this.x + this.width - 1, this.y + this.height - 1))
            {
                this.y = Math.floor(this.y / this.height) * this.height;
                this.jump = true;
            }
            else
            {
                this.jump = false;
            }
            
            // 移動
            if(touch[1])
            {
                // 左
                if(this.collision != 1) this.x -= 2;
                if(this.jump) this.frame = [1, 1, 1, 3, 3, 3, 2, 2, 2];
                this.scaleX = -1;
            }
            else if(touch[2])
            {
                // 右
                if(this.collision != 2) this.x += 2;
                if(this.jump) this.frame = [1, 1, 1, 3, 3, 3, 2, 2, 2];
                this.scaleX = 1;
            }
            else
            {
                // 停止
                if(this.jump || this.frame != 5) this.frame = 0;
            }
            this.collision = 0;
            
            // 衝突判定（左）
            if(map.hitTest(this.x, this.y) ||
               map.hitTest(this.x, this.y + this.height - 1))
            {
                this.x = Math.floor(this.x / this.width) * this.width + this.width;
            }
            
            // 衝突判定（右）
            if(map.hitTest(this.x + this.width, this.y) ||
               map.hitTest(this.x + this.width - 1, this.y + this.height - 1))
            {
                this.x = Math.floor(this.x / this.width) * this.width;
            }
            
            // ジャンプ
            if(touch[0] && this.jump)
            {
                this.f = -11;
                this.py = this.y;
                this.frame = 5;
                touch[0] = false;
            }
        },
        colSprite: function(s, down)
        {
            if(this.intersect(s) && !this.gameover && s.frame != 6)
            {
                if(this.y > s.y && down)
                {
                    // 下衝突
                    this.frame = 6;
                    this.tl.moveBy(0, -80, 12, enchant.Easing.QUAD_EASEOUT)
                           .moveBy(0, game.height - this.height, 36, enchant.Easing.QUAD_EASEIN);
                    
                    // 即時にサーバへ送信
                    if(id != null) socket.emit('update', {id:id, x:this.x, y:this.y, f:this.frame, s:this.scaleX});
                    
                    // ゲームオーバー
                    this.gameover = true;
                }
                else
                {
                    if(this.x > s.x)
                    {
                        // 右衝突（左停止）
                        this.collision = 1;
                    }
                    if(this.x < s.x)
                    {
                        // 左衝突（右停止）
                        this.collision = 2;
                    }
                }
            }
        }
    });
    
    // サブキャラクタークラス
    var SubChar = Class.create(Sprite,
    {
        initialize: function(scene, bef_node)
        {
            Sprite.call(this, 16, 16);
            this.image = game.assets[img_ch2];
            this.frame = 0;
            this.x = -16;
            this.y = -16;
            scene.insertBefore(this, bef_node);
        },
        update: function(x, y, f, s)
        {
            this.x = x;
            this.y = y;
            if(f >= 1 && f <= 3)
            {
                this.frame = [1, 1, 1, 3, 3, 3, 2, 2, 2];
            }
            else
            {
                this.frame = f;
            }
            this.scaleX = s;
        },
        delete: function(scene)
        {
            scene.removeChild(this);
        }
    });
    
    // 背景クラス
    var Background = Class.create(Map,
    {
        initialize: function(scene)
        {
            Map.call(this, 16, 16);
            this.image = game.assets[img_map];
            this.changeMap(scene, 2);
            scene.addChild(this);
        },
        changeMap: function(scene, no)
        {
            this.mapNo = no;
            this.loadData(getBaseMap(no));
            this.collisionData = getColMap(no);
            if(no == 1)
            {
                scene.backgroundColor = "rgb(95, 151, 255)";
            }
            else
            {
                scene.backgroundColor = "rgb(5, 5, 5)";
            }
        }
    });
    
    // コントローラークラス
    var Controller = Class.create(Sprite,
    {
        initialize: function(scene)
        {
            Sprite.call(this, 320, 140);
            this.image = game.assets[img_con];
            this.frame = 0;
            this.x = 0;
            this.y = game.height - this.height;
            scene.addChild(this);
            this.left = new Cursor(scene, 1);
            this.right = new Cursor(scene, 2);
            this.up = new Cursor(scene, 3);
            this.down = new Cursor(scene, 4);
            this.jump = new Jump(scene);
        }
    });
    
    // カーソルボタンクラス
    var Cursor = Class.create(Sprite,
    {
        initialize: function(scene, c)
        {
            Sprite.call(this, 32, 32);
            this.image = game.assets[img_pu1];
            this.frame = 0;
            this.control = c;
            this.touchstart = false;
            if(this.control == 1)
            {
                // 左
                this.x = 24;
                this.y = game.height - 82;
            }
            else if(this.control == 2)
            {
                // 右
                this.x = 88;
                this.y = game.height - 82;
            }
            else if(this.control == 3)
            {
                // 上
                this.x = 56;
                this.y = game.height - 114;
            }
            else if(this.control == 4)
            {
                // 下
                this.x = 56;
                this.y = game.height - 50;
            }
            this.addEventListener('touchstart', function(e)
            {
                this.start();
            });
            this.addEventListener('touchmove', function(e)
            {
                if(e.x < this.x || this.x + this.width < e.x || e.y < this.y || this.y + this.height < e.y)
                {
                    this.end();
                }
            });
            this.addEventListener('touchend', function(e)
            {
                this.end();
            });
            scene.addChild(this);
        },
        start: function()
        {
            if(!this.touchstart)
            {
                touch[this.control] = true;
                this.frame = this.control;
                this.touchstart = true;
            }
        },
        end: function()
        {
            touch[this.control] = false;
            this.frame = 0;
            this.touchstart = false;
        }
    });
    
    // ジャンプボタンクラス
    var Jump = Class.create(Sprite,
    {
        initialize: function(scene)
        {
            Sprite.call(this, 48, 48);
            this.image = game.assets[img_pu2];
            this.frame = 0;
            this.x = 248;
            this.y = this.y = game.height - 66;
            this.touchstart = false;
            this.addEventListener('touchstart', function(e)
            {
                this.start();
            });
            this.addEventListener('touchmove', function(e)
            {
                if(e.x < this.x || this.x + this.width < e.x || e.y < this.y || this.y + this.height < e.y)
                {
                    this.end()
                }
            });
            this.addEventListener('touchend', function(e)
            {
                this.end();
            });
            scene.addChild(this);
        },
        start: function()
        {
            if(!this.touchstart)
            {
                touch[0] = true;
                this.frame = 1;
                this.touchstart = true;
            }
        },
        end: function()
        {
            touch[0] = false;
            this.frame = 0;
            this.touchstart = false;
        }
    });
    
    // メッセージクラス
    var Message = Class.create(Sprite,
    {
        initialize: function(scene)
        {
            Sprite.call(this, 112, 8);
            this.image = game.assets[img_msg];
            this.frame = 0;
            this.add();
            this.addEventListener('enterframe', function(e)
            {
                if(this.age % 20 == 0)
                {
                    this.visible = this.visible ? false : true;
                }
            });
            scene.addChild(this);
        },
        add: function()
        {
            this.x = game.width / 2 - this.width / 2;
            this.y = 32;
        },
        delete: function()
        {
            this.x = -16;
            this.y = -16;
        }
    });
    
    game.onload = function()
    {
        var createScene = function()
        {
            // シーン生成
            var scene = new Scene();
            scene.backgroundColor = "rgb(5, 5, 5)";
            
            // マップ生成
            var map = new Background(scene);
            
            // メインキャラクター生成
            var ch1 = new MainChar(scene);
            
            // サブキャラクター配列
            var ch2 = {};
            
            // コントローラー生成
            var controller = new Controller(scene);
            
            // メッセージ生成
            var message = new Message(scene);
            
            scene.addEventListener('enterframe', function()
            {
                if(ch1.gameover)
                {
                    message.add();
                    
                    if(touch[0])
                    {
                        // 開始処理
                        ch1.start();
                        message.delete();
                    }
                    else if(touch[3] || touch[4])
                    {
                        // 背景変更
                        map.changeMap(scene, (map.mapNo == 1) ? 2 : 1);
                        touch[3] = false;
                        touch[4] = false;
                    }
                }
                
                for(var key in ch2)
                {
                    if(!(key in players))
                    {
                        // サブキャラクター削除
                        ch2[key].delete(scene);
                        delete ch2[key];
                    }
                }
                
                for(var key in players)
                {
                    if(!(key in ch2))
                    {
                        // サブキャラクター生成
                        ch2[key] = new SubChar(scene, controller);
                    }
                    if(players[key].id != id && key in bef_players)
                    {
                        // サブキャラクター更新
                        ch2[key].update( bef_players[key].x + (Math.floor((players[key].x - bef_players[key].x) / bef_interval) * interval)
                                        ,bef_players[key].y + (Math.floor((players[key].y - bef_players[key].y) / bef_interval) * interval)
                                        ,players[key].f
                                        ,players[key].s
                                       );
                        
                        // 衝突判定（サブキャラクター）
                        ch1.colSprite(ch2[key], (bef_players[key].y < players[key].y));
                    }
                }
                
                // 衝突判定（マップ）
                ch1.colMap(map);
                
                // サーバへ送信
                if(id != null)
                {
                    if(interval == 1)
                    {
                        socket.emit('update', {id:id, x:ch1.x, y:ch1.y, f:ch1.frame, s:ch1.scaleX});
                    }
                    interval++;
                }
            });
            scene.addEventListener('abuttondown', function()
            {
                // Aボタン押す
                controller.jump.start();
            });
            scene.addEventListener('abuttonup', function()
            {
                // Aボタン離す
                controller.jump.end();
            });
            scene.addEventListener('leftbuttondown', function()
            {
                // 左ボタン押す
                controller.left.start();
            });
            scene.addEventListener('leftbuttonup', function()
            {
                // 左ボタン離す
                controller.left.end();
            });
            scene.addEventListener('rightbuttondown', function()
            {
                // 右ボタン押す
                controller.right.start();
            });
            scene.addEventListener('rightbuttonup', function()
            {
                // 右ボタン離す
                controller.right.end();
            });
            scene.addEventListener('upbuttondown', function()
            {
                // 上ボタン押す
                controller.up.start();
            });
            scene.addEventListener('upbuttonup', function()
            {
                // 上ボタン離す
                controller.up.end();
            });
            scene.addEventListener('downbuttondown', function()
            {
                // 下ボタン押す
                controller.down.start();
            });
            scene.addEventListener('downbuttonup', function()
            {
                // 下ボタン離す
                controller.down.end();
            });
            return scene;
        };
        game.replaceScene(createScene());
    }
    // ゲーム開始
    game.start();
}

/**
 * マップ（基底）
 */
function getBaseMap(no)
{
    if(no == 1)
    {
        var map =
        [
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1, 3,-1,-1,-1, 3,-1,-1,-1,-1, 3,-1,-1,-1, 3,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1, 3,-1,-1,-1,-1,-1,-1,-1,-1, 3,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1, 3, 3,-1,-1,-1, 3,-1,-1,-1,-1, 3,-1,-1,-1, 3, 3,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1, 3, 3,-1,-1,-1,-1,-1,-1,-1,-1, 3, 3,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 1],
            [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
        ];
        return map;
    }
    else
    {
        var map =
        [
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1, 8,-1,-1,-1, 8,-1,-1,-1,-1, 8,-1,-1,-1, 8,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1, 8,-1,-1,-1,-1,-1,-1,-1,-1, 8,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1, 8, 8,-1,-1,-1, 8,-1,-1,-1,-1, 8,-1,-1,-1, 8, 8,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1, 8, 8,-1,-1,-1,-1,-1,-1,-1,-1, 8, 8,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1, 6],
            [ 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]
        ];
        return map;
    }
}

/**
 * マップ（衝突判定）
 */
function getColMap(no)
{
    var map =
    [
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    return map;
}
