const axios = require('axios').default;
const cheerio = require('cheerio');

function cleanHeroName(name) {
    if (name == "ALL HEROES") {
        return "ALL";
    }
    return name
        .replace(/[. :]/g, "")
        .replace(/ú/g, "u") // sorry torb and lúcio, but I want to be able to type these easily.
        .replace(/ö/g, "o")
        .toLowerCase();        
}

function extractUsefulStatCategoryAndName(rawStatName) {
    
    let inputStatName = rawStatName.toLowerCase();
    let suffixToCategory = [
        [' - avg per 10 min', 'avgper10'],
        [' - most in game', 'bestgame'],
        [' - best in game', 'bestgame'],
        [' - best', 'bestgame'],
        [' - most in life', 'bestlife'],
        [' - best in life', 'bestlife'],
        [' per life', 'avgperlife']
    ];
    
    let stat = "unknown";
    let category = "unknown";
    let matched = suffixToCategory.find(([suffix, _]) => inputStatName.endsWith(suffix));
    if (matched) {
        let matchedSuffix = matched[0];
        let matchedCategory = matched[1];
        category = matchedCategory;
        stat = inputStatName.substr(0, inputStatName.length - matchedSuffix.length);
    } 
    else {
        category = "total";
        stat = inputStatName;
    }
    stat = stat.replace(" - ", "_");    // "medals - gold" => medals_gold
    return {category, stat: stat.replace(/ /g, '_') };
}

function parseStatValue(value) {
    if (value.match(/^\d*(\.\d+)?$/)) {
        return parseFloat(value);
    }
    if (value.match(/^\d+$/)) {
        return parseInt(value);
    }
    if (value.endsWith('%')) {
        return {
            "percent": parseFloat(value.slice(0, -1))
        };
    }
    let parsedAsTime = value.match(/^(?:(?<hours>\d+):)?(?<mins>\d+):(?<secs>\d+)$/);
    if (parsedAsTime) {
        return {
            "raw": value,
            "totalSeconds": (
                (parseInt(parsedAsTime.groups.hours || "0") * 60 * 60) + 
                (parseInt(parsedAsTime.groups.mins)) * 60 +
                (parseInt(parsedAsTime.groups.secs))
            )
        };
    }
    
    return value;
}

function getHtml(platform, region, tag) {
    const url = (platform === 'pc')
        ? `https://playoverwatch.com/en-us/career/${platform}/${region}/${tag.replace('#', '-')}/`
        : `https://playoverwatch.com/en-us/career/${platform}/${tag.replace('#', '-')}/`;

    const options = {
        uri: encodeURI(url),
        encoding: 'utf8'
    };
    return axios.get(encodeURI(url)).then(result => {
        return result.data;
    });    
}

function parseHtml(html) {
    const $ = cheerio.load(html);
    let result = {};
    
    result.name = $("div.masthead-player>h1.header-masthead").text();
    
    let masthead = $("div.masthead-player-progression:not(.masthead-player-progression--mobile)");
    
    result.endorsement = {};    // leave room for detailed information later, maybe
    result.endorsement.level = parseInt($("div.EndorsementIcon-tooltip>div.u-center", masthead).text());

    result.skillrating = {};

    let ranks = $(".competitive-rank-section:has(.competitive-rank-level)", masthead);    
    ranks.each((index, element) => {
        let roleTooltip = $("div.competitive-rank-tier", element).attr("data-ow-tooltip-text");
        let role = roleTooltip.substr(0, roleTooltip.indexOf(" ")).toLowerCase();
        let rating = parseInt($("div.competitive-rank-level", element).text());
        result.skillrating[role] = rating;
    });

    result.statistics = {};
    let modes = $("div[data-js='career-category']");
    modes.each((_, mode) => {
        let modeName = $(mode).attr("id");
        let heroDropdownOptions = $("select[data-js='career-select'][data-group-id='stats']>option", mode);
        let heroMap = {};
        heroDropdownOptions.each((index, option) => {
            let key = $(option).attr("value");
            let value = cleanHeroName($(option).text());
            heroMap[key] = value;
        });
        result.statistics[modeName] = {};
        
        let heroTables = $("div.row.js-stats[data-group-id='stats'][data-category-id]", mode);
        heroTables.each((_, heroTable) => {
            let heroName = heroMap[$(heroTable).attr("data-category-id")];
            result.statistics[modeName][heroName] = {};

            let datarows = $("tr.DataTable-tableRow[data-stat-id]", heroTable);
            datarows.each((_, option) => {
                let rawStatName = $(option.childNodes[0]).text();
                let rawStatValue = $(option.childNodes[1]).text();
                let {category, stat} = extractUsefulStatCategoryAndName(rawStatName);
                if (!result.statistics[modeName][heroName][stat]) {
                    result.statistics[modeName][heroName][stat] = {};
                }
                result.statistics[modeName][heroName][stat][category] = parseStatValue(rawStatValue);
            });    
        });        
    });

    return result;
}

function getStats(platform, region, player) {
    return getHtml(platform, region, player).then(parseHtml);
}

module.exports = {
    getStats
};