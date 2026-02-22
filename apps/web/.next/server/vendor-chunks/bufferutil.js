"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/bufferutil";
exports.ids = ["vendor-chunks/bufferutil"];
exports.modules = {

/***/ "(ssr)/../../node_modules/bufferutil/fallback.js":
/*!*************************************************!*\
  !*** ../../node_modules/bufferutil/fallback.js ***!
  \*************************************************/
/***/ ((module) => {

eval("\n/**\n * Masks a buffer using the given mask.\n *\n * @param {Buffer} source The buffer to mask\n * @param {Buffer} mask The mask to use\n * @param {Buffer} output The buffer where to store the result\n * @param {Number} offset The offset at which to start writing\n * @param {Number} length The number of bytes to mask.\n * @public\n */ const mask = (source, mask, output, offset, length)=>{\n    for(var i = 0; i < length; i++){\n        output[offset + i] = source[i] ^ mask[i & 3];\n    }\n};\n/**\n * Unmasks a buffer using the given mask.\n *\n * @param {Buffer} buffer The buffer to unmask\n * @param {Buffer} mask The mask to use\n * @public\n */ const unmask = (buffer, mask)=>{\n    // Required until https://github.com/nodejs/node/issues/9006 is resolved.\n    const length = buffer.length;\n    for(var i = 0; i < length; i++){\n        buffer[i] ^= mask[i & 3];\n    }\n};\nmodule.exports = {\n    mask,\n    unmask\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL2J1ZmZlcnV0aWwvZmFsbGJhY2suanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFFQTs7Ozs7Ozs7O0NBU0MsR0FDRCxNQUFNQSxPQUFPLENBQUNDLFFBQVFELE1BQU1FLFFBQVFDLFFBQVFDO0lBQzFDLElBQUssSUFBSUMsSUFBSSxHQUFHQSxJQUFJRCxRQUFRQyxJQUFLO1FBQy9CSCxNQUFNLENBQUNDLFNBQVNFLEVBQUUsR0FBR0osTUFBTSxDQUFDSSxFQUFFLEdBQUdMLElBQUksQ0FBQ0ssSUFBSSxFQUFFO0lBQzlDO0FBQ0Y7QUFFQTs7Ozs7O0NBTUMsR0FDRCxNQUFNQyxTQUFTLENBQUNDLFFBQVFQO0lBQ3RCLHlFQUF5RTtJQUN6RSxNQUFNSSxTQUFTRyxPQUFPSCxNQUFNO0lBQzVCLElBQUssSUFBSUMsSUFBSSxHQUFHQSxJQUFJRCxRQUFRQyxJQUFLO1FBQy9CRSxNQUFNLENBQUNGLEVBQUUsSUFBSUwsSUFBSSxDQUFDSyxJQUFJLEVBQUU7SUFDMUI7QUFDRjtBQUVBRyxPQUFPQyxPQUFPLEdBQUc7SUFBRVQ7SUFBTU07QUFBTyIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi8uLi8uLi9ub2RlX21vZHVsZXMvYnVmZmVydXRpbC9mYWxsYmFjay5qcz82Yzg2Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBNYXNrcyBhIGJ1ZmZlciB1c2luZyB0aGUgZ2l2ZW4gbWFzay5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlcn0gc291cmNlIFRoZSBidWZmZXIgdG8gbWFza1xuICogQHBhcmFtIHtCdWZmZXJ9IG1hc2sgVGhlIG1hc2sgdG8gdXNlXG4gKiBAcGFyYW0ge0J1ZmZlcn0gb3V0cHV0IFRoZSBidWZmZXIgd2hlcmUgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBUaGUgb2Zmc2V0IGF0IHdoaWNoIHRvIHN0YXJ0IHdyaXRpbmdcbiAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggVGhlIG51bWJlciBvZiBieXRlcyB0byBtYXNrLlxuICogQHB1YmxpY1xuICovXG5jb25zdCBtYXNrID0gKHNvdXJjZSwgbWFzaywgb3V0cHV0LCBvZmZzZXQsIGxlbmd0aCkgPT4ge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0W29mZnNldCArIGldID0gc291cmNlW2ldIF4gbWFza1tpICYgM107XG4gIH1cbn07XG5cbi8qKlxuICogVW5tYXNrcyBhIGJ1ZmZlciB1c2luZyB0aGUgZ2l2ZW4gbWFzay5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIFRoZSBidWZmZXIgdG8gdW5tYXNrXG4gKiBAcGFyYW0ge0J1ZmZlcn0gbWFzayBUaGUgbWFzayB0byB1c2VcbiAqIEBwdWJsaWNcbiAqL1xuY29uc3QgdW5tYXNrID0gKGJ1ZmZlciwgbWFzaykgPT4ge1xuICAvLyBSZXF1aXJlZCB1bnRpbCBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvaXNzdWVzLzkwMDYgaXMgcmVzb2x2ZWQuXG4gIGNvbnN0IGxlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBidWZmZXJbaV0gXj0gbWFza1tpICYgM107XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0geyBtYXNrLCB1bm1hc2sgfTtcbiJdLCJuYW1lcyI6WyJtYXNrIiwic291cmNlIiwib3V0cHV0Iiwib2Zmc2V0IiwibGVuZ3RoIiwiaSIsInVubWFzayIsImJ1ZmZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/bufferutil/fallback.js\n");

/***/ }),

/***/ "(ssr)/../../node_modules/bufferutil/index.js":
/*!**********************************************!*\
  !*** ../../node_modules/bufferutil/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\ntry {\n    module.exports = __webpack_require__(/*! node-gyp-build */ \"(ssr)/../../node_modules/node-gyp-build/index.js\")(__dirname);\n} catch (e) {\n    module.exports = __webpack_require__(/*! ./fallback */ \"(ssr)/../../node_modules/bufferutil/fallback.js\");\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL2J1ZmZlcnV0aWwvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFFQSxJQUFJO0lBQ0ZBLE9BQU9DLE9BQU8sR0FBR0MsbUJBQU9BLENBQUMsMEVBQWtCQztBQUM3QyxFQUFFLE9BQU9DLEdBQUc7SUFDVkoseUdBQXlCO0FBQzNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2ViLy4uLy4uL25vZGVfbW9kdWxlcy9idWZmZXJ1dGlsL2luZGV4LmpzPzJkNzQiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG50cnkge1xuICBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJ25vZGUtZ3lwLWJ1aWxkJykoX19kaXJuYW1lKTtcbn0gY2F0Y2ggKGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2ZhbGxiYWNrJyk7XG59XG4iXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsInJlcXVpcmUiLCJfX2Rpcm5hbWUiLCJlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/bufferutil/index.js\n");

/***/ })

};
;