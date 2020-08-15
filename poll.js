"use strict";

const fs = require('fs');
const path = require('path');
const owapi = require('./api');

const { exit } = require("process");

const { battletag, platform, region } = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"));

let database = path.join(__dirname, 'data');
if (!fs.existsSync(database)){
    fs.mkdirSync(database);
}

let files = fs.readdirSync(database).sort();
let lastKnownStats = (files.length == 0) ? "" : fs.readFileSync(path.join(database, files.pop()), "utf-8");

owapi.getStats(platform, region, battletag).then(
    results => {
        let statsText = JSON.stringify(results);
        if (statsText != lastKnownStats) {
            let newFilename = path.join(database, (new Date()).toISOString().replace(/:/g, '.') + '.json');
            fs.writeFileSync(newFilename, statsText);
        }
    },
    failure => {
        console.error(failure);
        exit(1);
    }
);
