/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

// 素材をロードする状態
class PreloadState extends Phaser.State {

    preload() {
        // 踏み台
        for (let i = 1 ; i <= 6 ; i++) {
            this.load.image(`step${i}`, `images/pipo-WindowBase00${i}.png`);
        }
        // キャラ
        this.load.spritesheet(`chara1`, `images/pipo-halloweenchara2016_25.png`, 32, 32);
        this.load.spritesheet(`chara2`, `images/pipo-halloweenchara2016_26.png`, 32, 32);
    }

    create() {
        this.game.state.start("mainState");
    }

}


export {PreloadState};