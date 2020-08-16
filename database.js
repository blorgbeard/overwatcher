const path = require('path');
const fs = require('fs');

const getBaseDataDir = function() {
    let baseDataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(baseDataDir)) {
        fs.mkdirSync(baseDataDir);
    }
    return baseDataDir;
};

const getDataDirName = function(profile) {
    const cleanBattletag = profile.battletag.replace('#', '-');
    return `${cleanBattletag}_${profile.platform}_${profile.region}`;
};

const createDataFilenameFromTimestamp = function(timestamp) {
    return timestamp.toISOString().replace(/:/g, '.') + '.json';
};

const extractTimestampFromDataFilename = function(mostRecentDataFile) {
    let dots = 0;
    const timestamp = Date.parse(
        mostRecentDataFile                                      // "2020-08-15T21.19.49.972Z.json"
            .slice(0, -6)                                       // remove "".json"
            .replace(/\./g, match => dots++ < 2 ? ":" : match)  // replace first two dots with colons
    );
    return timestamp;
};

const extractProfileFromDataDirName = function(profileDataDirName) {
    const match = profileDataDirName.match(/^(?<battletag>.*)_(?<platform>.*)_(?<region>.*)$/);
    return {
        battletag: match.groups.battletag.replace('-', '#'),
        platform: match.groups.plaform,
        region: match.groups.region
    };
};

const getAvailableProfiles = function() {
    // todo
};

const createEmptyFileMetadata = function(profile) {
    return {
        "profile": profile,
    };
};

const getFileListForProfile = function(profile) {
    let baseDataDir = getBaseDataDir();
    let profileDataDirName = getDataDirName(profile);
    let profileDataDir = path.join(baseDataDir, profileDataDirName);
    if (!fs.existsSync(profileDataDir)) {
        return [];
    }
    let indexedFiles = Array.from(fs.readdirSync(profileDataDir).sort().entries());
    return indexedFiles.map(([index, filename]) => ({
        "profile": profile,
        "index": index,
        "filename": path.join(profileDataDir, filename),            
        "timestamp": extractTimestampFromDataFilename(filename)
    }));    
};

const getFileWithData = function(file) {
    let copy = JSON.parse(JSON.stringify(file));
    const dataAsText = fs.readFileSync(file.filename, "utf-8");
    copy.data = JSON.parse(dataAsText);
    return copy;
};

module.exports = {
    getAllFiles: function(profile) {
        return getFileListForProfile(profile).map(getFileWithData);
    },
    getMostRecentFile: function(profile) {        
        let files = getFileListForProfile(profile);
        let last = files.pop();        
        return last ? getFileWithData(last) : createEmptyFileMetadata(profile);
    },
    writeNewDataFile: function(profile, dataString) {
        const newFilename = createDataFilenameFromTimestamp(new Date());
        let profilePath = path.join(getBaseDataDir(), getDataDirName(profile));
        if (!fs.existsSync(profilePath)) {
            fs.mkdirSync(profilePath);
        }
        fs.writeFileSync(path.join(profilePath, newFilename), dataString);
    }
};

