/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/// <reference path="../node_modules/@types/sprintf-js/index.d.ts"/>

import {sprintf} from "sprintf-js";
import {ShopItemDefs} from "./shopItemDefs";
import {Common} from "./common";

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
    // 入力：Sキー
    sKey: Phaser.Key;

    // データハッシュ
    data : {
        // 資金
        money : number,
        item  : any
    };

    // 文字列：登った高さ
    climbHeightTextLayer: Phaser.Sprite;
    climbHeightText: Phaser.Text;
    // 文字列：資金
    moneyTextLayer: Phaser.Sprite;
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
               item : {}
            };
            for (let item of ShopItemDefs) {
                this.data.item[item.key]    = 0;
            }
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
        this.player.body.gravity.y  = 500 - this.data.item["cloak"] * 20;
        this.player.body.collideWorldBounds = true;

        // キー入力
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar   = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.rKey    = this.input.keyboard.addKey(Phaser.Keyboard.R);
        this.sKey    = this.input.keyboard.addKey(Phaser.Keyboard.S);

        ///////////////////
        // 文字列関係初期化
        let graphics   = this.make.graphics(0, 0);
        graphics.lineStyle(1, 0xffffff)
            .beginFill(0x999999)
            .drawRect(
                0, 0,
                100, 30
            );
        this.climbHeightTextLayer   = this.add.sprite(0, 0, graphics.generateTexture());
        this.climbHeightText    = this.add.text(5, 5, "", {
            font: "20px Arial",
            fill: "#ffffff",
        });
        this.climbHeightTextLayer.addChild(this.climbHeightText);
        graphics.destroy();

        // 所持金表示
        this.moneyText  = Common.addMoneySprite(this.game);
        ///////////////////

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
            let vel     = -450  -this.data.item["ring"] * 100;
            this.player.body.velocity.y  = vel;
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
            this.steps.setAll("y", offsetY, false, false, 1);
            // 登った高さ更新
            this.showHeight();
            // 適当なところでstepを削除
            if (this.climbHeight % 100 == 0) {
                for (let step of this.steps.children) {
                    if (! step.visible) {
                        this.steps.remove(step, true);
                    }
                }
            }
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
        else if (this.sKey.isDown) {
            // ショップへ
            // test
            this.data.money += 100000;
            this.game.state.start("shopState", true, false, this.data);
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
        this.placedHeight   = -this.stage.height;
        this.climbHeight    = 0;

        // 初期床を配置
        this.placeStep(0, this.world.width, this.world.height, 1);
        for (let h = -this.stage.height + this.placeInterval ; h < 0 ; h++) {
            this.placeClimbSteps(h);
        }
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

        // 幅はランダムに
        const stepWidth = this.rnd.integerInRange(this.stage.width / 6, this.stage.width / 2);
        // 置き始める座標
        const stepLeftX = this.rnd.integerInRange(0, this.stage.width - stepWidth);
        // 置くy座標
        let placeY      = 0;
        if (currentHeight < 0) {
            placeY      =  -currentHeight;
        }
        this.placeStep(stepLeftX, stepLeftX + stepWidth, placeY, 2);
        console.log(`stepWidth:${stepWidth}, stepLeftX:${stepLeftX}, placeY:${placeY}`);

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
    createResultDialog(game : Phaser.Game, conf : any) : Phaser.Sprite {
        // 枠
        let graphics    = game.make.graphics();
        graphics.lineStyle(5, 0x666666);
        graphics.beginFill(0xaaaaaa);
        graphics.drawRect(
            0, 0,
            game.world.width - game.world.width / 4, 
            game.world.height - game.world.height / 4 
        );
        let sprite  = this.make.sprite(0, 0, graphics.generateTexture());

        // テキスト
        const style     = {
            font    : "bold 24px Arial",
            fill    : "#222",
        };
        let scoreText   = game.make.text(10, 10, `高度 : ${conf.climbHeight} M`, style);
        sprite.addChild(scoreText);

        let rewardText  = game.make.text(10, 40, `獲得賞金 : ${conf.reward} G`, style);
        sprite.addChild(rewardText);

        // ボタンの縦横幅
        const buttonWidth   = sprite.width / 1.5;
        const buttonHeight  = sprite.height / 10;
        
        //// リトライボタン
        let retryButton = Common.createButton(this.game, buttonWidth, buttonHeight, 0xcccccc);
        retryButton.x   = (sprite.width - retryButton.width) / 2;
        retryButton.y   = 100;
        let retryText   = game.make.text(retryButton.width/2, retryButton.height/2, `R key : 再挑戦`, style);
        retryText.anchor.setTo(0.5);
        retryButton.addChild(retryText);
        retryButton.events.onInputDown.add(() => {
            this.game.state.start("mainState", true, false, this.data);
        }, this, 0);
        sprite.addChild(retryButton);

        //// ショップボタン
        let shopButton = Common.createButton(this.game, buttonWidth, buttonHeight, 0xffcccc);
        shopButton.x   = (sprite.width - shopButton.width) / 2;
        shopButton.y   = 170;
        let shopText   = game.make.text(shopButton.width/2, shopButton.height/2, `ショップへ`, style);
        shopText.anchor.setTo(0.5);
        shopButton.addChild(shopText);
        shopButton.events.onInputDown.add(() => {
            this.game.state.start("shopState", true, false, this.data);
        }, this, 0);
        sprite.addChild(shopButton);

        return sprite;
    }

}

export {MainState};