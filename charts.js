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

const processChartFn_series_but_remove_drops = function(context, name, path) {
    let raw = getSeriesData(context.files, path);
    function process(i) {
        if (i < process.last) {
            process.base += process.last;
        }
        process.last = i || process.last;   // don't remember missing value as last value
        return i + process.base;
    }
    process.base = 0;
    process.last = 0;
    let processed = raw.map(process);
    return [name].concat(processed);
};

const arrays_equal = function(a, b) {
    if (a.length != b.length) return false;
    return a.every((aa, i) => aa == b[i]);
}

const processChartFn_series_list_remove_duplicates = function(context, ...list_of_series_defs) {
    // assume/require: 
    // list_of_series_defs after processing will produce a list of lists of series data,
    // each with initial value as series name and same array length.
    // output is list of lists in same format, but with consecutive sets of identical values removed,
    // e.g.
    // input: [[1,2,3], [4,5,6], [4,5,6], [3,3,3]]
    // output: [[1,2,3], [4,5,6], [3,3,3]]
    let list_of_series = processChartList(list_of_series_defs, context);
    let processed = list_of_series.map(_ => []);
    let last = [];
    let next = [];
    list_of_series[0].forEach((_, ix) => {
        next = list_of_series.map(x => x[ix]);
        if (!arrays_equal(last, next)) {
            next.forEach((x, i) => processed[i].push(x));
        }
        last = next;
    });
    return processed;
};

const processChartFnDispatch = {
    'series': processChartFn_series,
    'series_but_remove_drops': processChartFn_series_but_remove_drops,
    'series_list_remove_duplicates': processChartFn_series_list_remove_duplicates
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

module.exports = {
    getChartData: function(chart, profile) {
        let spec = {};
        const files = database.getAllFiles(profile);    
        const context = {
            profile,
            files
        };    
        spec = processChartObject(chart, context);                    
        return spec;
    }
};
