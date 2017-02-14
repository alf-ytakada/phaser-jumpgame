// 床の定義

interface StepDef {
    id          : number;
    key         : string;   // ロードキー
    resource    : string;   // リソースURL
    rate        : number;   // 出現率 : 0-1
    effect      : [string]; // 効果一覧
};

const StepEffect    = {
    "SpeedUp"   : "SpeedUp",
    "Money"     : "Money",
};

const StepDefs  : [StepDef] = [
    {
        id          : 1,
        key         : "stepStart",
        resource    : "images/pipo-WindowBase001.png",
        rate        : 0,
        effect      : <[string]>[],
    },
    {
        id          : 2,
        key         : "stepNormal",
        resource    : "images/pipo-WindowBase002.png",
        rate        : 0.95,
        effect      : <[string]>[],
    },
    {
        id          : 3,
        key         : "stepSpeedUp",
        resource    : "images/pipo-WindowBase004.png",
        rate        : 0.02,
        effect      : <[string]>[StepEffect.SpeedUp],
    },
    {
        id          : 4,
        key         : "stepMoney",
        resource    : "images/pipo-WindowBase005.png",
        rate        : 0.03,
        effect      : <[string]>[StepEffect.Money],
    },
];

export {StepDef, StepDefs, StepEffect};