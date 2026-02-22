"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/simple-swizzle";
exports.ids = ["vendor-chunks/simple-swizzle"];
exports.modules = {

/***/ "(ssr)/../../node_modules/simple-swizzle/index.js":
/*!**************************************************!*\
  !*** ../../node_modules/simple-swizzle/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar isArrayish = __webpack_require__(/*! is-arrayish */ \"(ssr)/../../node_modules/simple-swizzle/node_modules/is-arrayish/index.js\");\nvar concat = Array.prototype.concat;\nvar slice = Array.prototype.slice;\nvar swizzle = module.exports = function swizzle(args) {\n    var results = [];\n    for(var i = 0, len = args.length; i < len; i++){\n        var arg = args[i];\n        if (isArrayish(arg)) {\n            // http://jsperf.com/javascript-array-concat-vs-push/98\n            results = concat.call(results, slice.call(arg));\n        } else {\n            results.push(arg);\n        }\n    }\n    return results;\n};\nswizzle.wrap = function(fn) {\n    return function() {\n        return fn(swizzle(arguments));\n    };\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3NpbXBsZS1zd2l6emxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBRUEsSUFBSUEsYUFBYUMsbUJBQU9BLENBQUM7QUFFekIsSUFBSUMsU0FBU0MsTUFBTUMsU0FBUyxDQUFDRixNQUFNO0FBQ25DLElBQUlHLFFBQVFGLE1BQU1DLFNBQVMsQ0FBQ0MsS0FBSztBQUVqQyxJQUFJQyxVQUFVQyxPQUFPQyxPQUFPLEdBQUcsU0FBU0YsUUFBUUcsSUFBSTtJQUNuRCxJQUFJQyxVQUFVLEVBQUU7SUFFaEIsSUFBSyxJQUFJQyxJQUFJLEdBQUdDLE1BQU1ILEtBQUtJLE1BQU0sRUFBRUYsSUFBSUMsS0FBS0QsSUFBSztRQUNoRCxJQUFJRyxNQUFNTCxJQUFJLENBQUNFLEVBQUU7UUFFakIsSUFBSVgsV0FBV2MsTUFBTTtZQUNwQix1REFBdUQ7WUFDdkRKLFVBQVVSLE9BQU9hLElBQUksQ0FBQ0wsU0FBU0wsTUFBTVUsSUFBSSxDQUFDRDtRQUMzQyxPQUFPO1lBQ05KLFFBQVFNLElBQUksQ0FBQ0Y7UUFDZDtJQUNEO0lBRUEsT0FBT0o7QUFDUjtBQUVBSixRQUFRVyxJQUFJLEdBQUcsU0FBVUMsRUFBRTtJQUMxQixPQUFPO1FBQ04sT0FBT0EsR0FBR1osUUFBUWE7SUFDbkI7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi8uLi8uLi9ub2RlX21vZHVsZXMvc2ltcGxlLXN3aXp6bGUvaW5kZXguanM/MjVlZSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBpc0FycmF5aXNoID0gcmVxdWlyZSgnaXMtYXJyYXlpc2gnKTtcblxudmFyIGNvbmNhdCA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQ7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbnZhciBzd2l6emxlID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzd2l6emxlKGFyZ3MpIHtcblx0dmFyIHJlc3VsdHMgPSBbXTtcblxuXHRmb3IgKHZhciBpID0gMCwgbGVuID0gYXJncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdHZhciBhcmcgPSBhcmdzW2ldO1xuXG5cdFx0aWYgKGlzQXJyYXlpc2goYXJnKSkge1xuXHRcdFx0Ly8gaHR0cDovL2pzcGVyZi5jb20vamF2YXNjcmlwdC1hcnJheS1jb25jYXQtdnMtcHVzaC85OFxuXHRcdFx0cmVzdWx0cyA9IGNvbmNhdC5jYWxsKHJlc3VsdHMsIHNsaWNlLmNhbGwoYXJnKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdHMucHVzaChhcmcpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHRzO1xufTtcblxuc3dpenpsZS53cmFwID0gZnVuY3Rpb24gKGZuKSB7XG5cdHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGZuKHN3aXp6bGUoYXJndW1lbnRzKSk7XG5cdH07XG59O1xuIl0sIm5hbWVzIjpbImlzQXJyYXlpc2giLCJyZXF1aXJlIiwiY29uY2F0IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsInN3aXp6bGUiLCJtb2R1bGUiLCJleHBvcnRzIiwiYXJncyIsInJlc3VsdHMiLCJpIiwibGVuIiwibGVuZ3RoIiwiYXJnIiwiY2FsbCIsInB1c2giLCJ3cmFwIiwiZm4iLCJhcmd1bWVudHMiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/simple-swizzle/index.js\n");

/***/ }),

/***/ "(ssr)/../../node_modules/simple-swizzle/node_modules/is-arrayish/index.js":
/*!***************************************************************************!*\
  !*** ../../node_modules/simple-swizzle/node_modules/is-arrayish/index.js ***!
  \***************************************************************************/
/***/ ((module) => {

eval("\nmodule.exports = function isArrayish(obj) {\n    if (!obj || typeof obj === \"string\") {\n        return false;\n    }\n    return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && (obj.splice instanceof Function || Object.getOwnPropertyDescriptor(obj, obj.length - 1) && obj.constructor.name !== \"String\");\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3NpbXBsZS1zd2l6emxlL25vZGVfbW9kdWxlcy9pcy1hcnJheWlzaC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiO0FBQUFBLE9BQU9DLE9BQU8sR0FBRyxTQUFTQyxXQUFXQyxHQUFHO0lBQ3ZDLElBQUksQ0FBQ0EsT0FBTyxPQUFPQSxRQUFRLFVBQVU7UUFDcEMsT0FBTztJQUNSO0lBRUEsT0FBT0EsZUFBZUMsU0FBU0EsTUFBTUMsT0FBTyxDQUFDRixRQUMzQ0EsSUFBSUcsTUFBTSxJQUFJLEtBQU1ILENBQUFBLElBQUlJLE1BQU0sWUFBWUMsWUFDekNDLE9BQU9DLHdCQUF3QixDQUFDUCxLQUFNQSxJQUFJRyxNQUFNLEdBQUcsTUFBT0gsSUFBSVEsV0FBVyxDQUFDQyxJQUFJLEtBQUssUUFBUTtBQUMvRiIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi8uLi8uLi9ub2RlX21vZHVsZXMvc2ltcGxlLXN3aXp6bGUvbm9kZV9tb2R1bGVzL2lzLWFycmF5aXNoL2luZGV4LmpzP2MwZWIiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5aXNoKG9iaikge1xuXHRpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBvYmogaW5zdGFuY2VvZiBBcnJheSB8fCBBcnJheS5pc0FycmF5KG9iaikgfHxcblx0XHQob2JqLmxlbmd0aCA+PSAwICYmIChvYmouc3BsaWNlIGluc3RhbmNlb2YgRnVuY3Rpb24gfHxcblx0XHRcdChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgKG9iai5sZW5ndGggLSAxKSkgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT09ICdTdHJpbmcnKSkpO1xufTtcbiJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiaXNBcnJheWlzaCIsIm9iaiIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsInNwbGljZSIsIkZ1bmN0aW9uIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiY29uc3RydWN0b3IiLCJuYW1lIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/simple-swizzle/node_modules/is-arrayish/index.js\n");

/***/ })

};
;