#!/usr/bin/node

const config = require('./config')();
const database = require('./database');
const api = require('./api');

function pollProfile(profile) {    
    return api.getStatsForProfile(profile).then(
        data => {
            let dataString = JSON.stringify(data);
            let mostRecentFile = database.getMostRecentFile(profile);
            if (!mostRecentFile.data || JSON.stringify(mostRecentFile.data) != dataString) {                
                database.writeNewDataFile(profile, dataString);
            }
        },
        failure => {
            console.error(profile, failure);
        }
    );
}

Promise.all(config.profiles.map(pollProfile));
