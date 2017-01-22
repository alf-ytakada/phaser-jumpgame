const path = require('path');
const webpack   = require("webpack");

module.exports = [{
    entry   : {
        main: "./src/main.ts",
    },
    output  : {
        path        : path.join(__dirname, "dist", "js"),
        filename    : "[name].js",
        publicPath  : "/js/",
    },
    devtool: "source-map",
    resolve : {
        extensions: ["", ".ts", ".js"],
        moduleDirectories: ["node_modules"]
    },
    module  : {
        loaders : [
            {
                test    : /\.ts$/,
                loader  : "awesome-typescript-loader",
                exclude : [
                    /node_modules/,
                ],
            },
        ],
        preLoaders: [
            {
                test: /\.js$/, 
                loader: "source-map-loader"
            }
        ]
    },
    plugins : [
        new webpack.ProvidePlugin({
            PIXI    : "phaser/build/pixi.js",
            p2      : "phaser/build/p2.js",
            Phaser  : "phaser/build/phaser.js",
        })
    ],
}]

