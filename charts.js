#!/usr/bin/node

const path = require('path');
const fs = require('fs');
const config = require('./config')();
const database = require('./database');
const {JSONPath} = require('jsonpath-plus');

const getSeriesData = function(files, jsonpath) {
    return files.map(file => JSONPath({
        wrap: false, 
        path: jsonpath, 
        json: file
    }));
};

const processChartFn_series = function(context, name, path) {
    return [name].concat(getSeriesData(context.files, path));
};

const processChartFnDispatch = {
    'series': processChartFn_series
};

const processChartFn = function(fnSpec, context) {
    return processChartFnDispatch[fnSpec._fn](context, ...fnSpec.args);
};

const processChartDict = function(dict, context) {
    if ("_fn" in dict) {
        return processChartFn(dict, context);
    }
    let result = {};
    Object.entries(dict).forEach(([key, value]) => {
        result[key] = processChartObject(value, context);
    });
    return result;
};

const processChartList = function(list, context) {
    return list.map(value => processChartObject(value, context));
};

const processChartObject = function(obj, context) {
    if (Array.isArray(obj)) {
        return processChartList(obj, context);
    }
    if (obj === Object(obj)) {
        return processChartDict(obj, context);
    }
    return obj;
};

config.charts.forEach(chart => {
    // implement later
    const profile = config.profiles[0]; // it me.
    const files = database.getAllFiles(profile);

    const context = {
        profile,
        files
    };

    let spec = processChartObject(chart, context);

    const javascript = "chartSpec = " + JSON.stringify(spec) + ";";
    fs.writeFileSync(path.join(__dirname, 'charts/data.js'), javascript);
});
