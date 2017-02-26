/// <reference path="../node_modules/phaser/typescript/phaser.d.ts" />
// 共通で使うもの

class Common {
    // お金表示部の生成
    static addMoneySprite(game : Phaser.Game) : Phaser.Text {
        const graphics    = game.make.graphics();
        graphics
            .lineStyle(1, 0xffffff)
            .beginFill(0x999999)
            .drawRect(
                0, 0,
                100, 30
            );
        const sprite  = game.add.sprite(game.world.width, 0, graphics.generateTexture());
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

    // 単色ボタンの生成
    static createButton(game : Phaser.Game, width: number, height: number, color: number) : Phaser.Sprite {
        const graphics   = game.make.graphics();
        graphics.lineStyle(1, 0);
        graphics.beginFill(color);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();
        const sprite     = game.make.sprite(0, 0, graphics.generateTexture());
        sprite.inputEnabled = true;
        sprite.input.useHandCursor  = true;

        return sprite;
    }
}


export {Common};