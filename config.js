const fs = require('fs');
const path = require('path');

module.exports = function() {
    const filename = path.join(__dirname, "config.json");
    const configString = fs.readFileSync(filename, "utf-8");
    return JSON.parse(configString);
}