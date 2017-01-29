/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

import {ShopItemDefs, ItemDef} from "./shopItemDefs";

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
    // 購入枠の幅
    readonly buyWidth   : number = 60;

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
        this.drawShop();
    }

    // ショップを描画
    drawShop() {
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

    createItemRow(itemDef : ItemDef) : Phaser.Sprite {
        //　枠線
        let graphics    = this.make.graphics();
        graphics.lineStyle(1, 0xffffff);
        graphics.drawRect(0, 0, this.boxWidth, this.itemHeight);
        graphics.endFill();
        graphics.moveTo(this.boxWidth - this.buyWidth, 0);
        graphics.lineTo(this.boxWidth - this.buyWidth, this.itemHeight);
        graphics.endFill();

        let sprite  = this.add.sprite(0, 0, graphics.generateTexture());
        graphics.destroy();

        // 画像
        let imageSprite = this.make.sprite(5, 0, itemDef.key);
        imageSprite.y   = (this.itemHeight - imageSprite.height) / 2;
        sprite.addChild(imageSprite);

        // アイテムテキスト
        let style     = {
            font    : "bold 18px Arial",
            fill    : "#FFF",
        };
        let itemText    = this.make.text(imageSprite.x + imageSprite.width + 10, 8, itemDef.name, style);
        sprite.addChild(itemText);

        style     = {
            font    : "bold 14px Arial",
            fill    : "#0F0",
        };
        let descText    = this.make.text(itemText.x + 15, 30, itemDef.description, style);
        sprite.addChild(descText);

        // Lvテキスト
        let lvText    = this.make.text(
            this.boxWidth - this.buyWidth - 100,
            itemText.y,
            "Lv: " + this.data.item[itemDef.key],
            style
        );

        // 購入ボタン
        graphics    = this.make.graphics();
        graphics.beginFill(0x555555);
        graphics.drawRect(0, 0, this.buyWidth -2, this.itemHeight -2);
        graphics.endFill();
        let buySprite   = this.make.sprite(this.boxWidth - this.buyWidth + 1, 1, graphics.generateTexture());
        
        style   = {
            font    : "bold 14px Arial",
            fill    : "#F7a",
        };
        let text    = this.make.text(5, 5, ItemDef.leveledPrice(itemDef, this.data.item[itemDef.key]) + "G", style);
        buySprite.addChild(text);
        sprite.addChild(buySprite);
        sprite.inputEnabled = true;
        // 購入ボタンタップ時
        sprite.events.onInputDown.add(this.onBuyTouched, this, 0, itemDef);
        sprite.input.useHandCursor  = true;

        return sprite;
    }

    // 購入ボタンタップ時
    onBuyTouched(sprite : Phaser.Sprite, pointer : Phaser.Pointer, itemDef : ItemDef) {
        console.log(itemDef);
        console.log(this.data);
        if (this.data.item[itemDef.key] == null) {
            return;
        }
        if (itemDef.maxLevel <= this.data.item[itemDef.key].lv) {
            return;
        }
        const price = ItemDef.leveledPrice(itemDef, this.data.item[itemDef.key]);
        if (this.data.money > price) {
            this.data.money -= price;
            this.data.item[itemDef.key]++;
        }

        // 一回UI消去して再描画
        this.world.removeAll();
        this.drawShop();
    }
}


export {ShopState};