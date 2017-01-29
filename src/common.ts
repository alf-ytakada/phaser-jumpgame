/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/// <reference path="../node_modules/@types/sprintf-js/index.d.ts"/>
// 共通で使うもの

class Common {
    // お金表示部の生成
    static addMoneySprite(game : Phaser.Game) : Phaser.Text {
        let graphics    = game.make.graphics();
        graphics
            .lineStyle(1, 0xffffff)
            .beginFill(0x999999)
            .drawRect(
                0, 0,
                100, 30
            );
        let sprite  = game.add.sprite(game.world.width, 0, graphics.generateTexture());
        graphics.destroy();
        sprite.anchor.setTo(1, 0);
        let moneyText    = game.make.text(0, 5, "", {
            font: "20px Arial",
            fill: "#ffffff",
        });
        sprite.addChild(moneyText);
        moneyText.anchor.setTo(1, 0);

        return moneyText;
    }
}


export {Common};