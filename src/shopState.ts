/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

import {ShopItemDefs} from "./shopItemDefs";

// 素材をロードする状態
class ShopState extends Phaser.State {
    data : any;
    // 外枠のマージン
    marginTop : number;
    marginLeft: number;
    // ヘッダ領域の高さ
    headerHeight : number;
    // 外枠の幅
    boxWidth : number;
    // 外枠の高さ
    boxHeight : number;
    // アイテム列の高さ
    readonly itemHeight : number = 70;

    // state 初期化　引数を保存する
    init(data : any) {
        this.data   = data;
        this.headerHeight   = 30;
        this.boxWidth  = this.stage.width - 40;
        this.boxHeight = this.stage.height - 100;
        this.marginTop = (this.stage.height - this.boxHeight) / 2;
        this.marginLeft = (this.stage.width - this.boxWidth) / 2;
    }
    preload() {
    }

    // ゲームオブジェクト初期化
    create() {

        // UI作成
        let graphics    = this.make.graphics();
        graphics.lineStyle(1, 0xffffff);
        graphics.drawRect(0, 0, this.boxWidth, this.boxHeight);
        graphics.moveTo(0, this.headerHeight);
        graphics.lineTo(this.boxWidth, this.headerHeight);
        graphics.endFill();

        let sprite  = this.add.sprite(this.marginLeft, this.marginTop, graphics.generateTexture());
        graphics.destroy();
        // テキスト
        const style     = {
            font    : "bold 18px Arial",
            fill    : "#FFF",
        };
        let text    = this.make.text(this.boxWidth / 2, 3, "アイテムショップ", style);
        text.anchor.setTo(0.5, 0);
        sprite.addChild(text);

        // アイテム一覧
        //for (let item of ShopItemDefs) {
        for (let i = 0 ; i < ShopItemDefs.length ; i++) {
            const item  = ShopItemDefs[i];
            let itemSprite  = this.createItemRow(item);
            itemSprite.y    = this.headerHeight + (i * this.itemHeight);
            sprite.addChild(itemSprite);
        }
    }

    createItemRow(itemDef : any) : Phaser.Sprite {
        let graphics    = this.make.graphics();
        graphics.lineStyle(1, 0xffffff);
        graphics.drawRect(0, 0, this.boxWidth, this.itemHeight);
        graphics.endFill();

        let sprite  = this.add.sprite(0, 0, graphics.generateTexture());
        graphics.destroy();

        // 画像
        let imageSprite = this.make.sprite(5, 0, itemDef.key);
        imageSprite.y   = (this.itemHeight - imageSprite.height) / 2;
        sprite.addChild(imageSprite);

        // テキスト
        let style     = {
            font    : "bold 18px Arial",
            fill    : "#FFF",
        };
        let text    = this.make.text(imageSprite.x + imageSprite.width + 10, 8, itemDef.name, style);
        sprite.addChild(text);

        style     = {
            font    : "bold 14px Arial",
            fill    : "#0F0",
        };
        text    = this.make.text(imageSprite.x + imageSprite.width + 20, 30, itemDef.description, style);
        sprite.addChild(text);

        return sprite;
    }
}


export {ShopState};