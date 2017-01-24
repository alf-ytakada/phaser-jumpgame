/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/// <reference path="../node_modules/@types/sprintf-js/index.d.ts"/>

import {sprintf} from "sprintf-js";

class MainState extends Phaser.State {
    // 足場グループ
    steps:  Phaser.Group;
    // プレイヤー
    player: Phaser.Sprite;
    // 入力：カーソルキー
    cursors: Phaser.CursorKeys;
    // 入力：スペースバー
    spaceBar: Phaser.Key;
    // 入力：Rキー
    rKey: Phaser.Key;

    // データハッシュ
    data : {
        // 資金
        money : number;
    };

    // 文字列：登った高さ
    climbHeightText: Phaser.Text;
    // 文字列：資金
    moneyText: Phaser.Text;

    // 登った距離
    climbHeight: number;
    // 配置した床の高さ(登った距離ベースで計算)
    placedHeight: number;
    // 床配置間隔
    placeInterval: number;
    // ジャンプ中フラグ
    isJumping: boolean;

    constructor() {
        super();
    }

    // init() -> preload() -> create()の順に呼び出され、
    // update()がメインループとなる

    // state 呼び出し時の引数が渡される
    init(data? : any) {
        console.log("init()");
        if (data) {
            this.data   = data;
        }
        else {
            this.data   = {
               money : 0,
            };
        }
    }

    // おもにリソースファイルのダウンロードを行う
    preload() {
        console.log("preload()");
    }

    // おもにゲームオブジェクト関連の初期化を行う
    create() {
        console.log("create()");
        // 物理演算を有効化
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.checkCollision.down  = false;
        //this.game.physics.arcade.gravity.y  = 300;

        // キャラクターロード
        this.player = this.loadPlayer("chara1");
        this.player.body.gravity.y  = 500;
        this.player.body.collideWorldBounds = true;

        // キー入力
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar   = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.rKey    = this.input.keyboard.addKey(Phaser.Keyboard.R);

        // 文字列関係初期化
        this.climbHeightText    = this.add.text(10, 10, "", {
            font: "20px Arial",
            fill: "#ffffff",
        });
        this.moneyText    = this.add.text(this.world.centerX + 10, 10, "", {
            font: "20px Arial",
            fill: "#ffffff",
        });

        // 床グループ生成
        this.steps  = this.add.group();
        this.steps.enableBody   = true;
        // その他初期化
        this.reset();

        // 登った高さ表示
        this.showHeight();

        // 現在の資金表示
        this.showMoney();
    }

    // メインループ
    update() {
        //console.log("update()");
        // 死亡済み
        if (this.player.alive == false) {
            this.updateWhenDead();
            return;
        }
        else {
            this.updateWhenAlive();
            return;
        }
    }

    // プレイヤー生存時
    updateWhenAlive() {
        ////////////
        // 衝突判定
        this.physics.arcade.collide(this.player, this.steps, this.onCollideStep, null, this);

        // 死亡判定
        if (this.player.y > this.world.height) {
            // 画面外に落ちた
            this.player.alive   = false;
            const reward        = Math.floor(this.climbHeight / 10);
            this.data.money += reward;

            // 結果ダイアログ生成
            let dialog  = this.createResultDialog(this.game, {
                climbHeight : sprintf("%.2f", this.climbHeight / 100),
                reward      : reward,
                state       : this,
                onRetryClicked  : () => { console.log("retry clicked");},
            });
            dialog.x    = (this.world.width - dialog.width)/2;
            dialog.y    = (this.world.height - dialog.height)/2;
            console.log(`width : ${dialog.width}, height : ${dialog.height}`);
            // ちょっとあとにダイアログを開く
            setTimeout(() => {
                this.game.world.addChild(dialog);
            }, 500);
        }

        ////////////
        // 入力判定
        if (this.cursors.left.isDown) {
            this.player.body.velocity.x  = -200;
            this.player.animations.play("left");
        }
        else if (this.cursors.right.isDown) {
            this.player.body.velocity.x  = 200;
            this.player.animations.play("right");
        }
        else {
            this.player.body.velocity.x  = 0;
            if (this.isJumping == false) {
                this.player.animations.stop();
            }
        }

        if (this.spaceBar.isDown && this.isJumping == false) {
            this.player.body.velocity.y  = -450;
            this.player.animations.play("jump");
            this.isJumping  = true;
        }
        ////////////


        ////////////
        // ステージ生成
        this.placeClimbSteps(this.climbHeight);
        ////////////

        ////////////
        // カメラ移動
        //console.log(`player.y = ${this.player.y}, camera.y = ${this.camera.y}, world.centerY = ${this.world.centerY}, climbHeight = ${this.climbHeight}`);
        if (this.player.y < this.world.centerY) {
            const offsetY : number  = this.world.centerY - this.player.y;
            this.climbHeight+= offsetY;
            this.player.y   = this.world.centerY;
            //this.steps.y    += offsetY;
            //this.steps.addAll('y', offsetY);
            this.steps.setAll("y", offsetY, false, false, 1);
            // 登った高さ更新
            this.showHeight();
        }

        ////////////
    }

    // プレイヤー死亡時のupdate()
    updateWhenDead() {
        // ダイアログ処理
        if (this.rKey.isDown) {
            // ゲーム初期化して最初から
           // this.reset();
            this.game.state.start("mainState", true, false, this.data);
        }
    }

    ////////////////////////////////////
    //  その他メソッド
    ////////////////////////////////////

    reset() {
        this.steps.removeAll(true);
        this.player.alive   = true;

        // メタデータ初期化
        this.isJumping  = false;
        this.climbHeight    = 0;
        this.placeInterval  = 150; // px
        this.placedHeight   = -1;
        this.climbHeight    = 0;

        // 初期床を配置
        this.placeStep(0, this.world.width, this.world.height, 1);
        this.placeClimbSteps(this.climbHeight);

    }

    onCollideStep(player : Phaser.Sprite, step : Phaser.Sprite) {
        this.player.animations.stop("jump");
        this.isJumping   = false;
    }

    loadPlayer(spriteName : string) : Phaser.Sprite {
        let sprite  = this.add.sprite(this.world.centerX, this.world.centerY, spriteName, 2);
        sprite.anchor.setTo(0.5, 0.5);
        sprite.animations.add("left", [3, 4, 5, 4], 10, true);
        sprite.animations.add("right", [6, 7, 8, 7], 10, true);
        sprite.animations.add("jump", [0, 1, 2, 1], 30, true);

        this.game.physics.arcade.enable(sprite);

        return sprite;
    }

    //　床配置
    placeStep(leftX : number, rightX : number, y : number, stepNumber: number)  : void {
        let posX    = leftX;
        do {
            let step : Phaser.Sprite    = this.steps.create(posX, y, `step${stepNumber}`);
            step.anchor.setTo(0.5, 0.5);
            step.outOfBoundsKill    = true;
            step.checkWorldBounds   = true;
            step.body.immovable = true;
            step.body.checkCollision.down   = false;
            //step.
            posX    += step.width;
        } while(posX <= rightX);
    }


    // 上り床配置
    placeClimbSteps(currentHeight: number) {
        if (this.placedHeight >= currentHeight) {
            return;
        }

        // 初回
        if (this.placedHeight < 0) {
            for (let height = this.world.height - this.placedHeight - this.placeInterval
                ; height > 0
                ; height -= this.placeInterval) 
            {
                // 幅はランダムに
                const stepWidth = this.rnd.integerInRange(this.stage.width / 6, this.stage.width / 2);
                // 置き始める座標
                const stepLeftX = this.rnd.integerInRange(0, this.stage.width - stepWidth);
                this.placeStep(stepLeftX, stepLeftX + stepWidth, height, 2);
            }
        }
        else {
                // 幅はランダムに
                const stepWidth = this.rnd.integerInRange(this.stage.width / 6, this.stage.width / 2);
                // 置き始める座標
                const stepLeftX = this.rnd.integerInRange(0, this.stage.width - stepWidth);
                this.placeStep(stepLeftX, stepLeftX + stepWidth, 0, 2);
                console.log(`stepWidth:${stepWidth}, stepLeftX:${stepLeftX}`);
        }

        this.placedHeight   = currentHeight + this.placeInterval;
    }

    // 登った高さ表示
    showHeight() {
        this.climbHeightText.setText(`${sprintf("%.2f", this.climbHeight / 100)} M`);
    }

    // 資金表示
    showMoney() {
        this.moneyText.setText(`${sprintf("%d", this.data.money)} G`);
    }

    // 結果ダイアログ作成
    createResultDialog(game : Phaser.Game, conf : any) : Phaser.Graphics {
        // 枠
        let graphics    = game.make.graphics();
        graphics.lineStyle(10, 0xffffff);
        graphics.beginFill(0x999999);
        graphics.drawRect(
            0, 0,
            game.world.width - game.world.width / 4, 
            game.world.height - game.world.height / 2
        );

        // テキスト
        const style     = {
            font    : "bold 24px Arial",
            fill    : "#222",
        };
        let scoreText   = game.make.text(10, 10, `高度 : ${conf.climbHeight} M`, style);
        graphics.addChild(scoreText);

        let rewardText  = game.make.text(10, 40, `獲得賞金 : ${conf.reward}`, style);
        graphics.addChild(rewardText);


        // ボタン(TODO)
        //let button  = game.make.button(graphics.width / 2, 100, "button1", conf.onRetryClicked, conf.state);
        //button.anchor.setTo(0.5, 0.5);
        //button.

        //let retSprite   = game.make.sprite(0, 0, graphics.generateTexture());
        //graphics.destroy();
        //return retSprite;
        return graphics;
    }

}

export {MainState};