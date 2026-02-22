"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/has-property-descriptors";
exports.ids = ["vendor-chunks/has-property-descriptors"];
exports.modules = {

/***/ "(ssr)/../../node_modules/has-property-descriptors/index.js":
/*!************************************************************!*\
  !*** ../../node_modules/has-property-descriptors/index.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar $defineProperty = __webpack_require__(/*! es-define-property */ \"(ssr)/../../node_modules/es-define-property/index.js\");\nvar hasPropertyDescriptors = function hasPropertyDescriptors() {\n    return !!$defineProperty;\n};\nhasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {\n    // node v0.6 has a bug where array lengths can be Set but not Defined\n    if (!$defineProperty) {\n        return null;\n    }\n    try {\n        return $defineProperty([], \"length\", {\n            value: 1\n        }).length !== 1;\n    } catch (e) {\n        // In Firefox 4-22, defining length on an array throws an exception.\n        return true;\n    }\n};\nmodule.exports = hasPropertyDescriptors;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL2hhcy1wcm9wZXJ0eS1kZXNjcmlwdG9ycy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUVBLElBQUlBLGtCQUFrQkMsbUJBQU9BLENBQUM7QUFFOUIsSUFBSUMseUJBQXlCLFNBQVNBO0lBQ3JDLE9BQU8sQ0FBQyxDQUFDRjtBQUNWO0FBRUFFLHVCQUF1QkMsdUJBQXVCLEdBQUcsU0FBU0E7SUFDekQscUVBQXFFO0lBQ3JFLElBQUksQ0FBQ0gsaUJBQWlCO1FBQ3JCLE9BQU87SUFDUjtJQUNBLElBQUk7UUFDSCxPQUFPQSxnQkFBZ0IsRUFBRSxFQUFFLFVBQVU7WUFBRUksT0FBTztRQUFFLEdBQUdDLE1BQU0sS0FBSztJQUMvRCxFQUFFLE9BQU9DLEdBQUc7UUFDWCxvRUFBb0U7UUFDcEUsT0FBTztJQUNSO0FBQ0Q7QUFFQUMsT0FBT0MsT0FBTyxHQUFHTiIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi8uLi8uLi9ub2RlX21vZHVsZXMvaGFzLXByb3BlcnR5LWRlc2NyaXB0b3JzL2luZGV4LmpzPzIwNWMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJGRlZmluZVByb3BlcnR5ID0gcmVxdWlyZSgnZXMtZGVmaW5lLXByb3BlcnR5Jyk7XG5cbnZhciBoYXNQcm9wZXJ0eURlc2NyaXB0b3JzID0gZnVuY3Rpb24gaGFzUHJvcGVydHlEZXNjcmlwdG9ycygpIHtcblx0cmV0dXJuICEhJGRlZmluZVByb3BlcnR5O1xufTtcblxuaGFzUHJvcGVydHlEZXNjcmlwdG9ycy5oYXNBcnJheUxlbmd0aERlZmluZUJ1ZyA9IGZ1bmN0aW9uIGhhc0FycmF5TGVuZ3RoRGVmaW5lQnVnKCkge1xuXHQvLyBub2RlIHYwLjYgaGFzIGEgYnVnIHdoZXJlIGFycmF5IGxlbmd0aHMgY2FuIGJlIFNldCBidXQgbm90IERlZmluZWRcblx0aWYgKCEkZGVmaW5lUHJvcGVydHkpIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXHR0cnkge1xuXHRcdHJldHVybiAkZGVmaW5lUHJvcGVydHkoW10sICdsZW5ndGgnLCB7IHZhbHVlOiAxIH0pLmxlbmd0aCAhPT0gMTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIEluIEZpcmVmb3ggNC0yMiwgZGVmaW5pbmcgbGVuZ3RoIG9uIGFuIGFycmF5IHRocm93cyBhbiBleGNlcHRpb24uXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzUHJvcGVydHlEZXNjcmlwdG9ycztcbiJdLCJuYW1lcyI6WyIkZGVmaW5lUHJvcGVydHkiLCJyZXF1aXJlIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9ycyIsImhhc0FycmF5TGVuZ3RoRGVmaW5lQnVnIiwidmFsdWUiLCJsZW5ndGgiLCJlIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/has-property-descriptors/index.js\n");

/***/ })

};
;