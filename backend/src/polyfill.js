// Polyfill util.isNullOrUndefined removed in Node 24, required by @tensorflow/tfjs-node
const util = require('util');
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = (arg) => arg === null || arg === undefined;
}
if (!util.isArray) {
  util.isArray = Array.isArray;
}
