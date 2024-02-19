'use strict';

const isObject = (value) => {
    // return Object.prototype.toString.call(value) === '[object Object]';
    return value !== null && typeof value === 'object';
};
const isFunction = (value) => {
    return typeof value === "function";
};
function isString(val) {
    return typeof val === "string";
}

exports.isFunction = isFunction;
exports.isObject = isObject;
exports.isString = isString;
