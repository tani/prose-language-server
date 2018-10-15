#!/usr/bin/env node
require("@babel/register")({
    ignore: [],
    extensions: ".ts",
    presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"]
});
require("./index.ts");
