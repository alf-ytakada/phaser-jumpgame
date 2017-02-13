/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/// <reference path="../node_modules/@types/sprintf-js/index.d.ts"/>

import {sprintf} from "sprintf-js";
import {ShopItemDefs} from "./shopItemDefs";
import {StepDefs, StepDef, StepEffect} from "./stepDefs";
import {Common} from "./common";

class State {
    //　ゲーム状態
    static IN_GAME : string = "IN_GAME";
    // クリア状態
    static CLEARED : string = "CLEARED";
    // 死亡
    static DEAD : string  = "DEAD";
}

class MainState extends Phaser.State {
    // 足場グループ
    steps:  Phaser.Group;
    // プレイヤー
    player: Phaser.Sprite;
    // 背景
    backgroundSprite: Phaser.Sprite;
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
        money   : number,   // 資金
        item    : any,      // アイテムハッシュ
        day     : number,   // 日数
        totalClimbHeight    : number,   // 総ジャンプ距離
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

    // クリアの高さ
    clearHeight: number;
    // クリア表示フラグ
    isClearedShown: boolean;
    // 状態
    state: string;

    constructor() {
        super();
        this.clearHeight    = 10000 * 100;
        this.isClearedShown = false;
    }

    // init() -> preload() -> create()の順に呼び出され、
    // update()がメインループとなる

    // state 呼び出し時の引数が渡される
    init(data? : any) {
        if (data) {
            this.data   = data;
            this.data.day++;
        }
        else {
            // 初回
            this.data   = {
               money    : 1000,
               item     : {},
               day      : 1,
               totalClimbHeight : 0,
            };
            for (let item of ShopItemDefs) {
                this.data.item[item.key]    = 0;
            }
        }
        this.state  = State.IN_GAME;
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
        // 画面上下の衝突はOFFにする
        this.game.physics.arcade.checkCollision.down    = false;
        this.game.physics.arcade.checkCollision.up      = false;

        // キャラクターロード
        this.player = this.loadPlayer("chara1");
        this.player.body.gravity.y  = 500 - this.data.item["cloak"] * 20;
        this.player.body.collideWorldBounds = true;
        // 最大速度制限を解除しておく
        this.player.body.maxVelocity.y  = 100000;

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
                115, 30
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
        this.world.sendToBack(this.steps);
        this.steps.enableBody   = true;
        // その他初期化
        this.reset();

        // 登った高さ表示
        this.showHeight();

        // 現在の資金表示
        this.showMoney();

        // 日数表示
        this.showDaySprite();

        // 背景ロード
        this.backgroundSprite   = this.add.sprite(0, this.world.height, "background");
        this.backgroundSprite.sendToBack();
        this.backgroundSprite.anchor.setTo(0, 1);
    }

    // メインループ
    update() {
        // 死亡済み
        if (this.state === State.DEAD) {
            this.updateWhenDead();
            return;
        }
        // クリア済み
        else if (this.state === State.CLEARED) {
            this.updateWhenCleared();
        }
        // 生存中
        else {
            this.updateWhenAlive();
            return;
        }
    }

    // プレイヤー生存時
    updateWhenAlive() {
        // 衝突判定
        this.physics.arcade.collide(this.player, this.steps, this.onCollideStep, null, this);

        // 死亡判定
        if (this.player.y > this.world.height) {
            // 画面外に落ちた
            this.player.alive   = false;
            this.state          = State.DEAD;
            const reward        = Math.floor(this.climbHeight / 10);
            this.data.money     += reward;
            this.data.totalClimbHeight  += this.climbHeight;

            // 結果ダイアログ生成
            let dialog  = this.createResultDialog({
                climbHeight : sprintf("%.2f", this.climbHeight / 100),
                reward      : reward,
                state       : this,
            });
            dialog.x    = (this.world.width  - dialog.width ) /2;
            dialog.y    = (this.world.height - dialog.height) /2;
            // ちょっとあとにダイアログを開く
            setTimeout(() => {
                this.game.world.addChild(dialog);
            }, 500);
        }

        ////////////
        // クリア判定
        if (this.climbHeight >= this.clearHeight) {
            this.data.totalClimbHeight  += this.climbHeight;
            this.state  = State.CLEARED;
            return;
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
        // 減速機能
        if (this.cursors.down.isDown) {
            this.player.body.velocity.y += 50;
            //this.player.body.velocity.y -= 1000;
            console.log(this.player.body.velocity.y);
        }

        if (this.spaceBar.isDown && this.isJumping == false) {
            let vel     = this.calcJumpVelocity(this.data.item["ring"]);
            // 上に登るので、負の値となる。ので、現在の速度が新速度より大きければ、新しい速度に更新する
            if (this.player.body.velocity.y > vel) {
                this.player.body.velocity.y  = vel;
            }
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
        if (this.player.y < this.world.centerY) {
            const offsetY : number  = this.world.centerY - this.player.y;
            this.climbHeight+= offsetY;
            this.player.y   = this.world.centerY;
            this.steps.setAll("y", offsetY, false, false, 1);
            // 登った高さ更新
            this.showHeight();
            // 適当なところでstepを削除
            if (Math.floor(this.climbHeight) % 100 == 0) {
                for (let step of this.steps.children) {
                    if (! step.visible) {
                        this.steps.remove(step, true);
                    }
                }
            }
            // 背景ずらす
            this.backgroundSprite.y =
                this.world.height + 
                (this.backgroundSprite.height - this.world.height) * (this.climbHeight / 100 / 10100);
        }
    }

    // クリア時のupdate()
    updateWhenCleared() {
        if (this.isClearedShown) {
            return;
        }

        // クリア時の表示
        this.showClearedText();
        this.showClearedScore();

        this.isClearedShown = true;
    }

    // プレイヤー死亡時のupdate()
    updateWhenDead() {
        // ダイアログ処理
        if (this.rKey.isDown) {
           // 最初からやり直す
            this.game.state.start("mainState", true, false, this.data);
        }
        else if (this.sKey.isDown) {
            // ショップへ
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
        this.placedHeight   = -this.game.height;
        this.climbHeight    = 0;

        // 初期床を配置
        this.placeStep(0, this.world.width, this.world.height, "stepStart");
        for (let h = -this.game.height + this.placeInterval ; h < 0 ; h++) {
            this.placeClimbSteps(h);
        }
    }

    // 日付表示スプライト作成
    showDaySprite() {
        let text    = this.add.text(this.world.width + this.world.centerX, this.world.centerY, `Day: ${this.data.day}`, {
            font: "bold 60px Arial",
            fill: "greenyellow",
        });
        text.anchor.setTo(0.5);

        let textTween   = this.add.tween(text);
        textTween
            .to({x:this.world.centerX}, 700, Phaser.Easing.Bounce.Out) // 外から入ってくる
            .to({}, 500, Phaser.Easing.Bounce.Out) // wait
            .to({x:-this.world.centerX}, 500, Phaser.Easing.Bounce.Out) // 外に出ていく
            ;
        textTween.start();
        return text;
    }

    // 床衝突時の処理
    onCollideStep(player : Phaser.Sprite, step : Phaser.Sprite) {
        this.player.animations.stop("jump");
        this.isJumping   = false;
        if (step.data.length == 0) {
            return;
        }

        // 特殊床の処理
        for (let effect of step.data) {
            // ジャンプ床
            if (effect === StepEffect.SpeedUp) {
                this.player.body.velocity.y = 2.5 * this.calcJumpVelocity(this.data.item["ring"]);
            }

            // お金床
            if (effect === StepEffect.Money) {
                this.data.money += this.data.day * 100;
                this.showMoney();
            }
        }
        step.data   = [];
    }

    loadPlayer(spriteName : string) : Phaser.Sprite {
        let sprite  = this.add.sprite(this.world.centerX, this.world.centerY, spriteName, 2);
        sprite.anchor.setTo(0.5, 0.5);
        sprite.animations.add("left",  [3, 4, 5, 4], 10, true);
        sprite.animations.add("right", [6, 7, 8, 7], 10, true);
        sprite.animations.add("jump",  [0, 1, 2, 1], 30, true);

        this.game.physics.arcade.enable(sprite);

        return sprite;
    }

    //　床配置
    placeStep(leftX : number, rightX : number, y : number, stepKey? : string)  : void {
        let posX    = leftX;
        do {
            // 指定がなければランダム選択
            const stepDef   = this.choiceStep(stepKey);
            const step : Phaser.Sprite    = this.steps.create(posX, y, stepDef.key);
            step.data   = stepDef.effect;
            step.anchor.setTo(0.5, 0.5);
            step.outOfBoundsKill    = true;
            step.checkWorldBounds   = true;
            step.body.immovable     = true;
            step.body.checkCollision.down   = false;
            posX    += step.width;

        } while(posX <= rightX);
    }

    // 床を選択 指定がなければランダム
    // タリスマン所持で、特殊床の出現率UP
    choiceStep(stepKey? :string) : StepDef {
        if (stepKey) {
            return (StepDefs.map((step) => {
                if (step.key === stepKey) { 
                    return step;
                }
            }))[0];
        }
        let rndMax  = 0;
        for (let step of StepDefs) {
            rndMax  += step.rate;
            if (step.key != "stepNormal") {
                rndMax  += step.rate * 2 * this.data.item["talisman"];
            }
        }
        for (let step of StepDefs) {
            let rate    = step.rate;
            if (step.key != "stepNormal") {
                rate    += step.rate * 2 * this.data.item["talisman"];
            }
            if (this.rnd.realInRange(0, rndMax) < rate) {
                return step;
            }
            rndMax  -= rate;
        }
        throw "oops, cannot find proper step!";
    }

    // 上り床配置
    placeClimbSteps(currentHeight: number) {
        if (this.placedHeight >= currentHeight) {
            return;
        }

        // 床の幅はランダム(タリスマンレベルに応じて広くする)
        const stepWidth = this.rnd.integerInRange(
            this.game.width / 6, 
            this.game.width / 2
        );
        // 置き始める座標
        const stepLeftX = this.rnd.integerInRange(0, this.game.width - stepWidth);
        // 置くy座標
        let placeY      = 0;
        if (currentHeight < 0) {
            placeY      =  -currentHeight;
        }
        this.placeStep(stepLeftX, stepLeftX + stepWidth, placeY);
        console.log(`currentHeight: ${currentHeight}, stepWidth:${stepWidth}, stepLeftX:${stepLeftX}, placeY:${placeY}`);

        this.placedHeight   = currentHeight + this.calcPlaceInterval(currentHeight);
    }

    // 床の配置高さ間隔計算。　高いほど間隔を長くする
    calcPlaceInterval(height:  number) {
        return 150 + height / 1000;
    }

    // ジャンプ時の速度を計算
    calcJumpVelocity(ringLv : number) {
        return -450  - ringLv * 100;
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
    createResultDialog(conf : any) : Phaser.Sprite {
        // 枠
        let graphics    = this.make.graphics();
        graphics.lineStyle(5, 0x0);
        graphics.beginFill(0xffffff);
        graphics.drawRect(
            0, 0,
            this.world.width - this.world.width / 4, 
            this.world.height - this.world.height / 2 
        );
        let sprite  = this.make.sprite(0, 0, graphics.generateTexture());

        // テキスト
        const style     = {
            font    : "bold 24px Arial",
            fill    : "#222",
        };
        let scoreText   = this.make.text(10, 10, `高度 : ${conf.climbHeight} M`, style);
        sprite.addChild(scoreText);

        let rewardText  = this.make.text(10, 40, `獲得賞金 : ${conf.reward} G`, style);
        sprite.addChild(rewardText);

        // ボタンの縦横幅
        const buttonWidth   = sprite.width / 1.5;
        const buttonHeight  = sprite.height / 6;
        
        //// リトライボタン
        let retryButton = Common.createButton(this.game, buttonWidth, buttonHeight, 0xcccccc);
        retryButton.x   = (sprite.width - retryButton.width) / 2;
        retryButton.y   = 100;
        let retryText   = this.make.text(retryButton.width/2, retryButton.height/2, `再挑戦`, style);
        retryText.anchor.setTo(0.5);
        retryButton.addChild(retryText);
        retryButton.events.onInputDown.add(() => {
            this.game.state.start("mainState", true, false, this.data);
        }, this, 0);
        sprite.addChild(retryButton);

        //// ショップボタン
        let shopButton = Common.createButton(this.game, buttonWidth, buttonHeight, 0x88ff88);
        shopButton.x   = (sprite.width - shopButton.width) / 2;
        shopButton.y   = 170;
        let shopText   = this.make.text(shopButton.width/2, shopButton.height/2, `ショップへ`, style);
        shopText.anchor.setTo(0.5);
        shopButton.addChild(shopText);
        shopButton.events.onInputDown.add(() => {
            this.game.state.start("shopState", true, false, this.data);
        }, this, 0);
        sprite.addChild(shopButton);

        return sprite;
    }

    // クリアテキスト
    showClearedText() {
        // テキスト
        const style     = {
            font    : "bold 44px Arial",
            fill    : "gold",
        };
        const text  = this.add.text(
            this.world.width / 2,
            this.world.height / 6,
            `C L E A R ! ! !`,
        style);
        text.anchor.setTo(0.5);
    }

    // クリアスコア
    showClearedScore() {
        // 枠
        const graphics    = this.make.graphics();
        graphics.lineStyle(2, 0x0);
        graphics.beginFill(0xffffff);
        graphics.drawRect(
            0, 0,
            this.world.width  - this.world.width / 8 * 2, 
            this.world.height /  6
        );
        const sprite  = this.make.sprite(
            this.world.width / 8,
            this.world.height - this.world.height / 6 * 2,
            graphics.generateTexture()
        );
        this.world.addChild(sprite);

        // テキスト
        const style     = {
            font    : "bold 18px Arial",
            fill    : "black",
        };
        let text  = this.make.text(
            10, 10, 
            `クリア日数 : ${this.data.day} 日`,
            style
        );
        sprite.addChild(text);
        text  = this.make.text(
            10, 40, 
            `総ジャンプ距離 : ${sprintf("%.2f", this.data.totalClimbHeight / 100)} M`,
            style
        );
        sprite.addChild(text);
    }

}

export {MainState};