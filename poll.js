"use strict";

const fs = require('fs');
const path = require('path');
const owapi = require('./api');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"));

let baseDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(baseDataDir)) {
    fs.mkdirSync(baseDataDir);
}

function pollProfile(profile) {
    let profileDataDir = path.join(baseDataDir, makeProfileDataDirName(profile));
    
    if (!fs.existsSync(profileDataDir)) {
        fs.mkdirSync(profileDataDir);
    }
  
    let lastKnownStats = getMostRecentProfileData(profileDataDir);

    return owapi.getStats(profile.platform, profile.region, profile.battletag).then(
        results => {
            let statsText = JSON.stringify(results);
            if (statsText != lastKnownStats) {
                let newFilename = path.join(profileDataDir, (new Date()).toISOString().replace(/:/g, '.') + '.json');
                fs.writeFileSync(newFilename, statsText);
            }
        },
        failure => {
            console.error(profile, failure);
        }
    );
}

function makeProfileDataDirName(profile) {
    return `${profile.battletag.replace('#', '-')}_${profile.platform}_${profile.region}`.toLowerCase();
}

function getMostRecentProfileData(profileDataDir) {
    let files = fs.readdirSync(profileDataDir).sort();
    let mostRecentProfileData = files.pop();
    if (mostRecentProfileData) {
        return fs.readFileSync(path.join(profileDataDir, mostRecentProfileData), "utf-8");
    }
    return "";
}

Promise.all(config.profiles.map(pollProfile));
