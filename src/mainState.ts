/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

class MainState extends Phaser.State {
    // 足場グループ
    steps:  Phaser.Group;
    // プレイヤー
    player: Phaser.Sprite;
    // 入力：カーソルキー
    cursors: Phaser.CursorKeys;
    // 入力：スペースバー
    spaceBar: Phaser.Key;

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

    init() {
        console.log("init()");
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
        //this.game.physics.arcade.gravity.y  = 300;

        // キャラクターロード
        this.player = this.loadPlayer("chara1");
        this.player.body.gravity.y  = 500;
        this.player.body.collideWorldBounds = true;

        // キー入力
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceBar   = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        // メタデータ初期化
        this.isJumping  = false;
        this.climbHeight    = 0;
        this.placeInterval  = 150; // px
        this.placedHeight   = -1;
        this.climbHeight    = 0;

        // 初期床を配置
        this.steps  = this.add.group();
        this.steps.enableBody   = true;
        this.placeStep(0, this.world.width, this.world.height, 1);
        this.placeClimbSteps(this.climbHeight);


    }

    // メインループ
    update() {
        //console.log("update()");
        ////////////
        // 衝突判定
        this.physics.arcade.collide(this.player, this.steps, this.onCollideStep, null, this);

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
        }

        ////////////
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
}

export {MainState};