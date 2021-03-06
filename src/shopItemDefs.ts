
// ショップで販売するアイテムの定義
class ItemDef {
    id  : number;
    key : string;
    resource    : string;
    name        : string;
    description : string;
    price       : number;
    incremental : number;
    maxLevel    : number;

    static leveledPrice(item : ItemDef, lv : number) : number {
        return item.price + lv * item.incremental;
    }
};

const ShopItemDefs : [ItemDef] = [
    {
        id  : 1,
        key : "ring",
        resource    : "./images/大地の指輪.png",
        name        : "ゆびわ",
        description : "ジャンプ力が増加",
        price       : 700,
        incremental : 300,
        maxLevel    : 30,
    },
    {
        id  : 2,
        key : "cloak",
        resource    : "./images/白銀の外套.png",
        name        : "がいとう",
        description : "落下速度が減少",
        price       : 500,
        incremental : 300,
        maxLevel    : 15,
    },
    {
        id  : 3,
        key : "talisman",
        resource    : "./images/罠除けの護符.png",
        name        : "おまもり",
        description : "特殊床の出現率UP",
        price       : 3000,
        incremental : 1000,
        maxLevel    : 3,
    },
];


export {ShopItemDefs, ItemDef};
