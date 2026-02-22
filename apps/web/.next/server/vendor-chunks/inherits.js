"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/inherits";
exports.ids = ["vendor-chunks/inherits"];
exports.modules = {

/***/ "(ssr)/../../node_modules/inherits/inherits.js":
/*!***********************************************!*\
  !*** ../../node_modules/inherits/inherits.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\ntry {\n    var util = __webpack_require__(/*! util */ \"util\");\n    /* istanbul ignore next */ if (typeof util.inherits !== \"function\") throw \"\";\n    module.exports = util.inherits;\n} catch (e) {\n    /* istanbul ignore next */ module.exports = __webpack_require__(/*! ./inherits_browser.js */ \"(ssr)/../../node_modules/inherits/inherits_browser.js\");\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwibWFwcGluZ3MiOiI7QUFBQSxJQUFJO0lBQ0YsSUFBSUEsT0FBT0MsbUJBQU9BLENBQUM7SUFDbkIsd0JBQXdCLEdBQ3hCLElBQUksT0FBT0QsS0FBS0UsUUFBUSxLQUFLLFlBQVksTUFBTTtJQUMvQ0MsT0FBT0MsT0FBTyxHQUFHSixLQUFLRSxRQUFRO0FBQ2hDLEVBQUUsT0FBT0csR0FBRztJQUNWLHdCQUF3QixHQUN4QkYsMEhBQXlCO0FBQzNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2ViLy4uLy4uL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0cy5qcz9hNmEyIl0sInNvdXJjZXNDb250ZW50IjpbInRyeSB7XG4gIHZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAodHlwZW9mIHV0aWwuaW5oZXJpdHMgIT09ICdmdW5jdGlvbicpIHRocm93ICcnO1xuICBtb2R1bGUuZXhwb3J0cyA9IHV0aWwuaW5oZXJpdHM7XG59IGNhdGNoIChlKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pbmhlcml0c19icm93c2VyLmpzJyk7XG59XG4iXSwibmFtZXMiOlsidXRpbCIsInJlcXVpcmUiLCJpbmhlcml0cyIsIm1vZHVsZSIsImV4cG9ydHMiLCJlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/inherits/inherits.js\n");

/***/ }),

/***/ "(ssr)/../../node_modules/inherits/inherits_browser.js":
/*!*******************************************************!*\
  !*** ../../node_modules/inherits/inherits_browser.js ***!
  \*******************************************************/
/***/ ((module) => {

eval("\nif (typeof Object.create === \"function\") {\n    // implementation from standard node.js 'util' module\n    module.exports = function inherits(ctor, superCtor) {\n        if (superCtor) {\n            ctor.super_ = superCtor;\n            ctor.prototype = Object.create(superCtor.prototype, {\n                constructor: {\n                    value: ctor,\n                    enumerable: false,\n                    writable: true,\n                    configurable: true\n                }\n            });\n        }\n    };\n} else {\n    // old school shim for old browsers\n    module.exports = function inherits(ctor, superCtor) {\n        if (superCtor) {\n            ctor.super_ = superCtor;\n            var TempCtor = function() {};\n            TempCtor.prototype = superCtor.prototype;\n            ctor.prototype = new TempCtor();\n            ctor.prototype.constructor = ctor;\n        }\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJtYXBwaW5ncyI6IjtBQUFBLElBQUksT0FBT0EsT0FBT0MsTUFBTSxLQUFLLFlBQVk7SUFDdkMscURBQXFEO0lBQ3JEQyxPQUFPQyxPQUFPLEdBQUcsU0FBU0MsU0FBU0MsSUFBSSxFQUFFQyxTQUFTO1FBQ2hELElBQUlBLFdBQVc7WUFDYkQsS0FBS0UsTUFBTSxHQUFHRDtZQUNkRCxLQUFLRyxTQUFTLEdBQUdSLE9BQU9DLE1BQU0sQ0FBQ0ssVUFBVUUsU0FBUyxFQUFFO2dCQUNsREMsYUFBYTtvQkFDWEMsT0FBT0w7b0JBQ1BNLFlBQVk7b0JBQ1pDLFVBQVU7b0JBQ1ZDLGNBQWM7Z0JBQ2hCO1lBQ0Y7UUFDRjtJQUNGO0FBQ0YsT0FBTztJQUNMLG1DQUFtQztJQUNuQ1gsT0FBT0MsT0FBTyxHQUFHLFNBQVNDLFNBQVNDLElBQUksRUFBRUMsU0FBUztRQUNoRCxJQUFJQSxXQUFXO1lBQ2JELEtBQUtFLE1BQU0sR0FBR0Q7WUFDZCxJQUFJUSxXQUFXLFlBQWE7WUFDNUJBLFNBQVNOLFNBQVMsR0FBR0YsVUFBVUUsU0FBUztZQUN4Q0gsS0FBS0csU0FBUyxHQUFHLElBQUlNO1lBQ3JCVCxLQUFLRyxTQUFTLENBQUNDLFdBQVcsR0FBR0o7UUFDL0I7SUFDRjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2ViLy4uLy4uL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzPzkzMDYiXSwic291cmNlc0NvbnRlbnQiOlsiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgaWYgKHN1cGVyQ3Rvcikge1xuICAgICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBpZiAoc3VwZXJDdG9yKSB7XG4gICAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbIk9iamVjdCIsImNyZWF0ZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJpbmhlcml0cyIsImN0b3IiLCJzdXBlckN0b3IiLCJzdXBlcl8iLCJwcm90b3R5cGUiLCJjb25zdHJ1Y3RvciIsInZhbHVlIiwiZW51bWVyYWJsZSIsIndyaXRhYmxlIiwiY29uZmlndXJhYmxlIiwiVGVtcEN0b3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/inherits/inherits_browser.js\n");

/***/ })

};
;