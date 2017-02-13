/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

import {ShopItemDefs} from "./shopItemDefs";
import {StepDefs} from "./stepDefs";

// 素材をロードする状態
class PreloadState extends Phaser.State {

    preload() {
        // 踏み台
        for (let step of StepDefs) {
            this.load.image(step.key, step.resource);
        }

        // キャラ
        this.load.spritesheet(`chara1`, `images/pipo-halloweenchara2016_25.png`, 32, 32);
        this.load.spritesheet(`chara2`, `images/pipo-halloweenchara2016_26.png`, 32, 32);

        // ボタン
        this.load.image("button1", "images/pipo-WindowBaseSet3b_02.png");

        // アイテム
        for (let item of ShopItemDefs) {
            this.load.image(item.key, item.resource);
        }

        // 背景
        this.load.image("background", "images/background.jpg");
    }

    create() {
        this.game.state.start("mainState");
        //this.game.state.start("shopState");
    }

}


export {PreloadState};