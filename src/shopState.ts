/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

import {ShopItemDefs, ItemDef} from "./shopItemDefs";
import {Common} from "./common";

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

    // shop sprite
    shopSprite  : Phaser.Sprite;

    // 所持金テキスト
    moneyText   : Phaser.Text;

    // state 初期化　引数を保存する
    init(data : any) {
        this.data   = data;
        this.headerHeight   = 30;
        this.boxWidth  = this.game.width - 40;
        this.boxHeight = this.headerHeight + this.itemHeight * ShopItemDefs.length;
        //this.marginTop = (this.stage.height - this.boxHeight) / 2;
        this.marginTop = 100;
        this.marginLeft = (this.game.width - this.boxWidth) / 2;
    }
    preload() {
    }

    // ゲームオブジェクト初期化
    create() {
        this.drawShop();
        this.drawMenu();
        this.moneyText  = Common.addMoneySprite(this.game);
        this.updateMoneyText();
    }

    // ショップを描画
    drawShop() {
        if (this.shopSprite) {
            this.shopSprite.destroy();
        }
        // UI作成
        const graphics  = this.make.graphics();
        graphics.lineStyle(1, 0xffffff);
        graphics.drawRect(0, 0, this.boxWidth, this.boxHeight);
        graphics.moveTo(0, this.headerHeight);
        graphics.lineTo(this.boxWidth, this.headerHeight);
        graphics.endFill();

        const sprite    = this.add.sprite(this.marginLeft, this.marginTop, graphics.generateTexture());
        graphics.destroy();
        // テキスト
        const style = {
            font    : "bold 18px Arial",
            fill    : "#FFF",
        };
        const text  = this.make.text(this.boxWidth / 2, 3, "アイテムショップ", style);
        text.anchor.setTo(0.5, 0);
        sprite.addChild(text);

        // アイテム一覧
        for (let i = 0 ; i < ShopItemDefs.length ; i++) {
            const item      = ShopItemDefs[i];
            const itemSprite = this.createItemRow(item);
            itemSprite.y    = this.headerHeight + (i * this.itemHeight);
            sprite.addChild(itemSprite);
        }
        this.shopSprite = sprite;
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
        const lv    = this.data.item[itemDef.key];
        let lvText  = this.make.text(
            this.boxWidth - this.buyWidth - 100,
            itemText.y,
            "Lv: " + ((lv >= itemDef.maxLevel) ? "MAX" : lv),
            style
        );
        sprite.addChild(lvText);

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
        if (lv == itemDef.maxLevel) {
            text.text   = "---";
        }
        buySprite.addChild(text);
        sprite.addChild(buySprite);
        // 購入ボタンタップ時
        sprite.inputEnabled = true;
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
        if (itemDef.maxLevel <= this.data.item[itemDef.key]) {
            return;
        }
        const price = ItemDef.leveledPrice(itemDef, this.data.item[itemDef.key]);
        if (this.data.money > price) {
            this.data.money -= price;
            this.data.item[itemDef.key]++;
        }

        // 一回UI消去して再描画
        this.drawShop();
        this.updateMoneyText();
    }

    // 下部メニュー描画
    drawMenu() {
        const graphics    = this.make.graphics();
        graphics.lineStyle(1, 0xCCCCCC);
        graphics.beginFill(0xaaaaaa);
        graphics.drawRect(0, 0, this.boxWidth, this.itemHeight);
        graphics.endFill();

        const sprite  = this.add.sprite(
            this.marginLeft, this.marginTop + this.boxHeight + 50, graphics.generateTexture()
        );

        const style   = {
            font    : "bold 22px Arial",
            fill    : "#000000",
        };
        const text    = this.make.text(sprite.width / 2, sprite.height / 2, "次の日へ進む", style);
        text.anchor.setTo(0.5);
        sprite.addChild(text);

        // タップ時処理
        sprite.inputEnabled = true;
        sprite.events.onInputDown.add(this.onNextDayTouched, this, 0);
        sprite.input.useHandCursor  = true;
    }

    // 次の日へボタン
    onNextDayTouched() {
        this.game.state.start("mainState", true, false, this.data);
    }

    updateMoneyText() {
        this.moneyText.text = `${this.data.money} G`;
    }
}


export {ShopState};