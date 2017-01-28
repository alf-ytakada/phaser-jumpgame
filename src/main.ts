/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>

import {PreloadState} from "./preloadState";
import {MainState} from "./mainState";
import {ShopState} from "./shopState";

// new Phaser.Game(width, height, レンダラ(Phaser.AUTOで自動選択), DOMエレメント指定)
let game    = new Phaser.Game(360, 640, Phaser.AUTO, "");

game.state.add("preloadState", PreloadState);
game.state.add("mainState", MainState);
game.state.add("shopState", ShopState);

window.onload   = () => {
    // 登録した状態のうち、"preloadState"をスタートする
    game.state.start("preloadState");
}