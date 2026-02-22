"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/wrappy";
exports.ids = ["vendor-chunks/wrappy"];
exports.modules = {

/***/ "(ssr)/../../node_modules/wrappy/wrappy.js":
/*!*******************************************!*\
  !*** ../../node_modules/wrappy/wrappy.js ***!
  \*******************************************/
/***/ ((module) => {

eval("// Returns a wrapper function that returns a wrapped callback\n// The wrapper function should do some stuff, and return a\n// presumably different callback function.\n// This makes sure that own properties are retained, so that\n// decorations and such are not lost along the way.\n\nmodule.exports = wrappy;\nfunction wrappy(fn, cb) {\n    if (fn && cb) return wrappy(fn)(cb);\n    if (typeof fn !== \"function\") throw new TypeError(\"need wrapper function\");\n    Object.keys(fn).forEach(function(k) {\n        wrapper[k] = fn[k];\n    });\n    return wrapper;\n    function wrapper() {\n        var args = new Array(arguments.length);\n        for(var i = 0; i < args.length; i++){\n            args[i] = arguments[i];\n        }\n        var ret = fn.apply(this, args);\n        var cb = args[args.length - 1];\n        if (typeof ret === \"function\" && ret !== cb) {\n            Object.keys(cb).forEach(function(k) {\n                ret[k] = cb[k];\n            });\n        }\n        return ret;\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3dyYXBweS93cmFwcHkuanMiLCJtYXBwaW5ncyI6IkFBQUEsNkRBQTZEO0FBQzdELDBEQUEwRDtBQUMxRCwwQ0FBMEM7QUFDMUMsNERBQTREO0FBQzVELG1EQUFtRDs7QUFDbkRBLE9BQU9DLE9BQU8sR0FBR0M7QUFDakIsU0FBU0EsT0FBUUMsRUFBRSxFQUFFQyxFQUFFO0lBQ3JCLElBQUlELE1BQU1DLElBQUksT0FBT0YsT0FBT0MsSUFBSUM7SUFFaEMsSUFBSSxPQUFPRCxPQUFPLFlBQ2hCLE1BQU0sSUFBSUUsVUFBVTtJQUV0QkMsT0FBT0MsSUFBSSxDQUFDSixJQUFJSyxPQUFPLENBQUMsU0FBVUMsQ0FBQztRQUNqQ0MsT0FBTyxDQUFDRCxFQUFFLEdBQUdOLEVBQUUsQ0FBQ00sRUFBRTtJQUNwQjtJQUVBLE9BQU9DO0lBRVAsU0FBU0E7UUFDUCxJQUFJQyxPQUFPLElBQUlDLE1BQU1DLFVBQVVDLE1BQU07UUFDckMsSUFBSyxJQUFJQyxJQUFJLEdBQUdBLElBQUlKLEtBQUtHLE1BQU0sRUFBRUMsSUFBSztZQUNwQ0osSUFBSSxDQUFDSSxFQUFFLEdBQUdGLFNBQVMsQ0FBQ0UsRUFBRTtRQUN4QjtRQUNBLElBQUlDLE1BQU1iLEdBQUdjLEtBQUssQ0FBQyxJQUFJLEVBQUVOO1FBQ3pCLElBQUlQLEtBQUtPLElBQUksQ0FBQ0EsS0FBS0csTUFBTSxHQUFDLEVBQUU7UUFDNUIsSUFBSSxPQUFPRSxRQUFRLGNBQWNBLFFBQVFaLElBQUk7WUFDM0NFLE9BQU9DLElBQUksQ0FBQ0gsSUFBSUksT0FBTyxDQUFDLFNBQVVDLENBQUM7Z0JBQ2pDTyxHQUFHLENBQUNQLEVBQUUsR0FBR0wsRUFBRSxDQUFDSyxFQUFFO1lBQ2hCO1FBQ0Y7UUFDQSxPQUFPTztJQUNUO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly93ZWIvLi4vLi4vbm9kZV9tb2R1bGVzL3dyYXBweS93cmFwcHkuanM/ZDE5MyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBSZXR1cm5zIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSB3cmFwcGVkIGNhbGxiYWNrXG4vLyBUaGUgd3JhcHBlciBmdW5jdGlvbiBzaG91bGQgZG8gc29tZSBzdHVmZiwgYW5kIHJldHVybiBhXG4vLyBwcmVzdW1hYmx5IGRpZmZlcmVudCBjYWxsYmFjayBmdW5jdGlvbi5cbi8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IG93biBwcm9wZXJ0aWVzIGFyZSByZXRhaW5lZCwgc28gdGhhdFxuLy8gZGVjb3JhdGlvbnMgYW5kIHN1Y2ggYXJlIG5vdCBsb3N0IGFsb25nIHRoZSB3YXkuXG5tb2R1bGUuZXhwb3J0cyA9IHdyYXBweVxuZnVuY3Rpb24gd3JhcHB5IChmbiwgY2IpIHtcbiAgaWYgKGZuICYmIGNiKSByZXR1cm4gd3JhcHB5KGZuKShjYilcblxuICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25lZWQgd3JhcHBlciBmdW5jdGlvbicpXG5cbiAgT2JqZWN0LmtleXMoZm4pLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICB3cmFwcGVyW2tdID0gZm5ba11cbiAgfSlcblxuICByZXR1cm4gd3JhcHBlclxuXG4gIGZ1bmN0aW9uIHdyYXBwZXIoKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV1cbiAgICB9XG4gICAgdmFyIHJldCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgdmFyIGNiID0gYXJnc1thcmdzLmxlbmd0aC0xXVxuICAgIGlmICh0eXBlb2YgcmV0ID09PSAnZnVuY3Rpb24nICYmIHJldCAhPT0gY2IpIHtcbiAgICAgIE9iamVjdC5rZXlzKGNiKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldFtrXSA9IGNiW2tdXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gcmV0XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwid3JhcHB5IiwiZm4iLCJjYiIsIlR5cGVFcnJvciIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiayIsIndyYXBwZXIiLCJhcmdzIiwiQXJyYXkiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJpIiwicmV0IiwiYXBwbHkiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/wrappy/wrappy.js\n");

/***/ })

};
;