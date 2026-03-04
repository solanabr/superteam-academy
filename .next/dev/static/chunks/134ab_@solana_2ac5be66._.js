(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/base-x/src/esm/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
function base(ALPHABET) {
    if (ALPHABET.length >= 255) {
        throw new TypeError('Alphabet too long');
    }
    const BASE_MAP = new Uint8Array(256);
    for(let j = 0; j < BASE_MAP.length; j++){
        BASE_MAP[j] = 255;
    }
    for(let i = 0; i < ALPHABET.length; i++){
        const x = ALPHABET.charAt(i);
        const xc = x.charCodeAt(0);
        if (BASE_MAP[xc] !== 255) {
            throw new TypeError(x + ' is ambiguous');
        }
        BASE_MAP[xc] = i;
    }
    const BASE = ALPHABET.length;
    const LEADER = ALPHABET.charAt(0);
    const FACTOR = Math.log(BASE) / Math.log(256) // log(BASE) / log(256), rounded up
    ;
    const iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up
    ;
    function encode(source) {
        // eslint-disable-next-line no-empty
        if (source instanceof Uint8Array) {} else if (ArrayBuffer.isView(source)) {
            source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
        } else if (Array.isArray(source)) {
            source = Uint8Array.from(source);
        }
        if (!(source instanceof Uint8Array)) {
            throw new TypeError('Expected Uint8Array');
        }
        if (source.length === 0) {
            return '';
        }
        // Skip & count leading zeroes.
        let zeroes = 0;
        let length = 0;
        let pbegin = 0;
        const pend = source.length;
        while(pbegin !== pend && source[pbegin] === 0){
            pbegin++;
            zeroes++;
        }
        // Allocate enough space in big-endian base58 representation.
        const size = (pend - pbegin) * iFACTOR + 1 >>> 0;
        const b58 = new Uint8Array(size);
        // Process the bytes.
        while(pbegin !== pend){
            let carry = source[pbegin];
            // Apply "b58 = b58 * 256 + ch".
            let i = 0;
            for(let it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++){
                carry += 256 * b58[it1] >>> 0;
                b58[it1] = carry % BASE >>> 0;
                carry = carry / BASE >>> 0;
            }
            if (carry !== 0) {
                throw new Error('Non-zero carry');
            }
            length = i;
            pbegin++;
        }
        // Skip leading zeroes in base58 result.
        let it2 = size - length;
        while(it2 !== size && b58[it2] === 0){
            it2++;
        }
        // Translate the result into a string.
        let str = LEADER.repeat(zeroes);
        for(; it2 < size; ++it2){
            str += ALPHABET.charAt(b58[it2]);
        }
        return str;
    }
    function decodeUnsafe(source) {
        if (typeof source !== 'string') {
            throw new TypeError('Expected String');
        }
        if (source.length === 0) {
            return new Uint8Array();
        }
        let psz = 0;
        // Skip and count leading '1's.
        let zeroes = 0;
        let length = 0;
        while(source[psz] === LEADER){
            zeroes++;
            psz++;
        }
        // Allocate enough space in big-endian base256 representation.
        const size = (source.length - psz) * FACTOR + 1 >>> 0 // log(58) / log(256), rounded up.
        ;
        const b256 = new Uint8Array(size);
        // Process the characters.
        while(psz < source.length){
            // Find code of next character
            const charCode = source.charCodeAt(psz);
            // Base map can not be indexed using char code
            if (charCode > 255) {
                return;
            }
            // Decode character
            let carry = BASE_MAP[charCode];
            // Invalid character
            if (carry === 255) {
                return;
            }
            let i = 0;
            for(let it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++){
                carry += BASE * b256[it3] >>> 0;
                b256[it3] = carry % 256 >>> 0;
                carry = carry / 256 >>> 0;
            }
            if (carry !== 0) {
                throw new Error('Non-zero carry');
            }
            length = i;
            psz++;
        }
        // Skip leading zeroes in b256.
        let it4 = size - length;
        while(it4 !== size && b256[it4] === 0){
            it4++;
        }
        const vch = new Uint8Array(zeroes + (size - it4));
        let j = zeroes;
        while(it4 !== size){
            vch[j++] = b256[it4++];
        }
        return vch;
    }
    function decode(string) {
        const buffer = decodeUnsafe(string);
        if (buffer) {
            return buffer;
        }
        throw new Error('Non-base' + BASE + ' character');
    }
    return {
        encode,
        decodeUnsafe,
        decode
    };
}
const __TURBOPACK__default__export__ = base;
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/bs58/src/esm/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f$base$2d$x$2f$src$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/base-x/src/esm/index.js [app-client] (ecmascript)");
;
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f$base$2d$x$2f$src$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(ALPHABET);
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout/lib/Layout.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* The MIT License (MIT)
 *
 * Copyright 2015-2018 Peter A. Bigot
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */ /**
 * Support for translating between Uint8Array instances and JavaScript
 * native types.
 *
 * {@link module:Layout~Layout|Layout} is the basis of a class
 * hierarchy that associates property names with sequences of encoded
 * bytes.
 *
 * Layouts are supported for these scalar (numeric) types:
 * * {@link module:Layout~UInt|Unsigned integers in little-endian
 *   format} with {@link module:Layout.u8|8-bit}, {@link
 *   module:Layout.u16|16-bit}, {@link module:Layout.u24|24-bit},
 *   {@link module:Layout.u32|32-bit}, {@link
 *   module:Layout.u40|40-bit}, and {@link module:Layout.u48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~UIntBE|Unsigned integers in big-endian
 *   format} with {@link module:Layout.u16be|16-bit}, {@link
 *   module:Layout.u24be|24-bit}, {@link module:Layout.u32be|32-bit},
 *   {@link module:Layout.u40be|40-bit}, and {@link
 *   module:Layout.u48be|48-bit} representation ranges;
 * * {@link module:Layout~Int|Signed integers in little-endian
 *   format} with {@link module:Layout.s8|8-bit}, {@link
 *   module:Layout.s16|16-bit}, {@link module:Layout.s24|24-bit},
 *   {@link module:Layout.s32|32-bit}, {@link
 *   module:Layout.s40|40-bit}, and {@link module:Layout.s48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~IntBE|Signed integers in big-endian format}
 *   with {@link module:Layout.s16be|16-bit}, {@link
 *   module:Layout.s24be|24-bit}, {@link module:Layout.s32be|32-bit},
 *   {@link module:Layout.s40be|40-bit}, and {@link
 *   module:Layout.s48be|48-bit} representation ranges;
 * * 64-bit integral values that decode to an exact (if magnitude is
 *   less than 2^53) or nearby integral Number in {@link
 *   module:Layout.nu64|unsigned little-endian}, {@link
 *   module:Layout.nu64be|unsigned big-endian}, {@link
 *   module:Layout.ns64|signed little-endian}, and {@link
 *   module:Layout.ns64be|unsigned big-endian} encodings;
 * * 32-bit floating point values with {@link
 *   module:Layout.f32|little-endian} and {@link
 *   module:Layout.f32be|big-endian} representations;
 * * 64-bit floating point values with {@link
 *   module:Layout.f64|little-endian} and {@link
 *   module:Layout.f64be|big-endian} representations;
 * * {@link module:Layout.const|Constants} that take no space in the
 *   encoded expression.
 *
 * and for these aggregate types:
 * * {@link module:Layout.seq|Sequence}s of instances of a {@link
 *   module:Layout~Layout|Layout}, with JavaScript representation as
 *   an Array and constant or data-dependent {@link
 *   module:Layout~Sequence#count|length};
 * * {@link module:Layout.struct|Structure}s that aggregate a
 *   heterogeneous sequence of {@link module:Layout~Layout|Layout}
 *   instances, with JavaScript representation as an Object;
 * * {@link module:Layout.union|Union}s that support multiple {@link
 *   module:Layout~VariantLayout|variant layouts} over a fixed
 *   (padded) or variable (not padded) span of bytes, using an
 *   unsigned integer at the start of the data or a separate {@link
 *   module:Layout.unionLayoutDiscriminator|layout element} to
 *   determine which layout to use when interpreting the buffer
 *   contents;
 * * {@link module:Layout.bits|BitStructure}s that contain a sequence
 *   of individual {@link
 *   module:Layout~BitStructure#addField|BitField}s packed into an 8,
 *   16, 24, or 32-bit unsigned integer starting at the least- or
 *   most-significant bit;
 * * {@link module:Layout.cstr|C strings} of varying length;
 * * {@link module:Layout.blob|Blobs} of fixed- or variable-{@link
 *   module:Layout~Blob#length|length} raw data.
 *
 * All {@link module:Layout~Layout|Layout} instances are immutable
 * after construction, to prevent internal state from becoming
 * inconsistent.
 *
 * @local Layout
 * @local ExternalLayout
 * @local GreedyCount
 * @local OffsetLayout
 * @local UInt
 * @local UIntBE
 * @local Int
 * @local IntBE
 * @local NearUInt64
 * @local NearUInt64BE
 * @local NearInt64
 * @local NearInt64BE
 * @local Float
 * @local FloatBE
 * @local Double
 * @local DoubleBE
 * @local Sequence
 * @local Structure
 * @local UnionDiscriminator
 * @local UnionLayoutDiscriminator
 * @local Union
 * @local VariantLayout
 * @local BitStructure
 * @local BitField
 * @local Boolean
 * @local Blob
 * @local CString
 * @local Constant
 * @local bindConstructorLayout
 * @module Layout
 * @license MIT
 * @author Peter A. Bigot
 * @see {@link https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.s16 = exports.s8 = exports.nu64be = exports.u48be = exports.u40be = exports.u32be = exports.u24be = exports.u16be = exports.nu64 = exports.u48 = exports.u40 = exports.u32 = exports.u24 = exports.u16 = exports.u8 = exports.offset = exports.greedy = exports.Constant = exports.UTF8 = exports.CString = exports.Blob = exports.Boolean = exports.BitField = exports.BitStructure = exports.VariantLayout = exports.Union = exports.UnionLayoutDiscriminator = exports.UnionDiscriminator = exports.Structure = exports.Sequence = exports.DoubleBE = exports.Double = exports.FloatBE = exports.Float = exports.NearInt64BE = exports.NearInt64 = exports.NearUInt64BE = exports.NearUInt64 = exports.IntBE = exports.Int = exports.UIntBE = exports.UInt = exports.OffsetLayout = exports.GreedyCount = exports.ExternalLayout = exports.bindConstructorLayout = exports.nameWithProperty = exports.Layout = exports.uint8ArrayToBuffer = exports.checkUint8Array = void 0;
exports.constant = exports.utf8 = exports.cstr = exports.blob = exports.unionLayoutDiscriminator = exports.union = exports.seq = exports.bits = exports.struct = exports.f64be = exports.f64 = exports.f32be = exports.f32 = exports.ns64be = exports.s48be = exports.s40be = exports.s32be = exports.s24be = exports.s16be = exports.ns64 = exports.s48 = exports.s40 = exports.s32 = exports.s24 = void 0;
const buffer_1 = __turbopack_context__.r("[project]/superteam-academy/node_modules/buffer/index.js [app-client] (ecmascript)");
/* Check if a value is a Uint8Array.
 *
 * @ignore */ function checkUint8Array(b) {
    if (!(b instanceof Uint8Array)) {
        throw new TypeError('b must be a Uint8Array');
    }
}
exports.checkUint8Array = checkUint8Array;
/* Create a Buffer instance from a Uint8Array.
 *
 * @ignore */ function uint8ArrayToBuffer(b) {
    checkUint8Array(b);
    return buffer_1.Buffer.from(b.buffer, b.byteOffset, b.length);
}
exports.uint8ArrayToBuffer = uint8ArrayToBuffer;
/**
 * Base class for layout objects.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
 *
 * @param {Number} span - Initializer for {@link Layout#span|span}.  The
 * parameter must be an integer; a negative value signifies that the
 * span is {@link Layout#getSpan|value-specific}.
 *
 * @param {string} [property] - Initializer for {@link
 * Layout#property|property}.
 *
 * @abstract
 */ class Layout {
    constructor(span, property){
        if (!Number.isInteger(span)) {
            throw new TypeError('span must be an integer');
        }
        /** The span of the layout in bytes.
         *
         * Positive values are generally expected.
         *
         * Zero will only appear in {@link Constant}s and in {@link
         * Sequence}s where the {@link Sequence#count|count} is zero.
         *
         * A negative value indicates that the span is value-specific, and
         * must be obtained using {@link Layout#getSpan|getSpan}. */ this.span = span;
        /** The property name used when this layout is represented in an
         * Object.
         *
         * Used only for layouts that {@link Layout#decode|decode} to Object
         * instances.  If left undefined the span of the unnamed layout will
         * be treated as padding: it will not be mutated by {@link
         * Layout#encode|encode} nor represented as a property in the
         * decoded Object. */ this.property = property;
    }
    /** Function to create an Object into which decoded properties will
     * be written.
     *
     * Used only for layouts that {@link Layout#decode|decode} to Object
     * instances, which means:
     * * {@link Structure}
     * * {@link Union}
     * * {@link VariantLayout}
     * * {@link BitStructure}
     *
     * If left undefined the JavaScript representation of these layouts
     * will be Object instances.
     *
     * See {@link bindConstructorLayout}.
     */ makeDestinationObject() {
        return {};
    }
    /**
     * Calculate the span of a specific instance of a layout.
     *
     * @param {Uint8Array} b - the buffer that contains an encoded instance.
     *
     * @param {Number} [offset] - the offset at which the encoded instance
     * starts.  If absent a zero offset is inferred.
     *
     * @return {Number} - the number of bytes covered by the layout
     * instance.  If this method is not overridden in a subclass the
     * definition-time constant {@link Layout#span|span} will be
     * returned.
     *
     * @throws {RangeError} - if the length of the value cannot be
     * determined.
     */ getSpan(b, offset) {
        if (0 > this.span) {
            throw new RangeError('indeterminate span');
        }
        return this.span;
    }
    /**
     * Replicate the layout using a new property.
     *
     * This function must be used to get a structurally-equivalent layout
     * with a different name since all {@link Layout} instances are
     * immutable.
     *
     * **NOTE** This is a shallow copy.  All fields except {@link
     * Layout#property|property} are strictly equal to the origin layout.
     *
     * @param {String} property - the value for {@link
     * Layout#property|property} in the replica.
     *
     * @returns {Layout} - the copy with {@link Layout#property|property}
     * set to `property`.
     */ replicate(property) {
        const rv = Object.create(this.constructor.prototype);
        Object.assign(rv, this);
        rv.property = property;
        return rv;
    }
    /**
     * Create an object from layout properties and an array of values.
     *
     * **NOTE** This function returns `undefined` if invoked on a layout
     * that does not return its value as an Object.  Objects are
     * returned for things that are a {@link Structure}, which includes
     * {@link VariantLayout|variant layouts} if they are structures, and
     * excludes {@link Union}s.  If you want this feature for a union
     * you must use {@link Union.getVariant|getVariant} to select the
     * desired layout.
     *
     * @param {Array} values - an array of values that correspond to the
     * default order for properties.  As with {@link Layout#decode|decode}
     * layout elements that have no property name are skipped when
     * iterating over the array values.  Only the top-level properties are
     * assigned; arguments are not assigned to properties of contained
     * layouts.  Any unused values are ignored.
     *
     * @return {(Object|undefined)}
     */ fromArray(values) {
        return undefined;
    }
}
exports.Layout = Layout;
/* Provide text that carries a name (such as for a function that will
 * be throwing an error) annotated with the property of a given layout
 * (such as one for which the value was unacceptable).
 *
 * @ignore */ function nameWithProperty(name, lo) {
    if (lo.property) {
        return name + '[' + lo.property + ']';
    }
    return name;
}
exports.nameWithProperty = nameWithProperty;
/**
 * Augment a class so that instances can be encoded/decoded using a
 * given layout.
 *
 * Calling this function couples `Class` with `layout` in several ways:
 *
 * * `Class.layout_` becomes a static member property equal to `layout`;
 * * `layout.boundConstructor_` becomes a static member property equal
 *    to `Class`;
 * * The {@link Layout#makeDestinationObject|makeDestinationObject()}
 *   property of `layout` is set to a function that returns a `new
 *   Class()`;
 * * `Class.decode(b, offset)` becomes a static member function that
 *   delegates to {@link Layout#decode|layout.decode}.  The
 *   synthesized function may be captured and extended.
 * * `Class.prototype.encode(b, offset)` provides an instance member
 *   function that delegates to {@link Layout#encode|layout.encode}
 *   with `src` set to `this`.  The synthesized function may be
 *   captured and extended, but when the extension is invoked `this`
 *   must be explicitly bound to the instance.
 *
 * @param {class} Class - a JavaScript class with a nullary
 * constructor.
 *
 * @param {Layout} layout - the {@link Layout} instance used to encode
 * instances of `Class`.
 */ // `Class` must be a constructor Function, but the assignment of a `layout_` property to it makes it difficult to type
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function bindConstructorLayout(Class, layout) {
    if ('function' !== typeof Class) {
        throw new TypeError('Class must be constructor');
    }
    if (Object.prototype.hasOwnProperty.call(Class, 'layout_')) {
        throw new Error('Class is already bound to a layout');
    }
    if (!(layout && layout instanceof Layout)) {
        throw new TypeError('layout must be a Layout');
    }
    if (Object.prototype.hasOwnProperty.call(layout, 'boundConstructor_')) {
        throw new Error('layout is already bound to a constructor');
    }
    Class.layout_ = layout;
    layout.boundConstructor_ = Class;
    layout.makeDestinationObject = ()=>new Class();
    Object.defineProperty(Class.prototype, 'encode', {
        value (b, offset) {
            return layout.encode(this, b, offset);
        },
        writable: true
    });
    Object.defineProperty(Class, 'decode', {
        value (b, offset) {
            return layout.decode(b, offset);
        },
        writable: true
    });
}
exports.bindConstructorLayout = bindConstructorLayout;
/**
 * An object that behaves like a layout but does not consume space
 * within its containing layout.
 *
 * This is primarily used to obtain metadata about a member, such as a
 * {@link OffsetLayout} that can provide data about a {@link
 * Layout#getSpan|value-specific span}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support {@link
 * ExternalLayout#isCount|isCount} or other {@link Layout} functions.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @abstract
 * @augments {Layout}
 */ class ExternalLayout extends Layout {
    /**
     * Return `true` iff the external layout decodes to an unsigned
     * integer layout.
     *
     * In that case it can be used as the source of {@link
     * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
     * or as {@link UnionLayoutDiscriminator#layout|external union
     * discriminators}.
     *
     * @abstract
     */ isCount() {
        throw new Error('ExternalLayout is abstract');
    }
}
exports.ExternalLayout = ExternalLayout;
/**
 * An {@link ExternalLayout} that determines its {@link
 * Layout#decode|value} based on offset into and length of the buffer
 * on which it is invoked.
 *
 * *Factory*: {@link module:Layout.greedy|greedy}
 *
 * @param {Number} [elementSpan] - initializer for {@link
 * GreedyCount#elementSpan|elementSpan}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {ExternalLayout}
 */ class GreedyCount extends ExternalLayout {
    constructor(elementSpan = 1, property){
        if (!Number.isInteger(elementSpan) || 0 >= elementSpan) {
            throw new TypeError('elementSpan must be a (positive) integer');
        }
        super(-1, property);
        /** The layout for individual elements of the sequence.  The value
         * must be a positive integer.  If not provided, the value will be
         * 1. */ this.elementSpan = elementSpan;
    }
    /** @override */ isCount() {
        return true;
    }
    /** @override */ decode(b, offset = 0) {
        checkUint8Array(b);
        const rem = b.length - offset;
        return Math.floor(rem / this.elementSpan);
    }
    /** @override */ encode(src, b, offset) {
        return 0;
    }
}
exports.GreedyCount = GreedyCount;
/**
 * An {@link ExternalLayout} that supports accessing a {@link Layout}
 * at a fixed offset from the start of another Layout.  The offset may
 * be before, within, or after the base layout.
 *
 * *Factory*: {@link module:Layout.offset|offset}
 *
 * @param {Layout} layout - initializer for {@link
 * OffsetLayout#layout|layout}, modulo `property`.
 *
 * @param {Number} [offset] - Initializes {@link
 * OffsetLayout#offset|offset}.  Defaults to zero.
 *
 * @param {string} [property] - Optional new property name for a
 * {@link Layout#replicate| replica} of `layout` to be used as {@link
 * OffsetLayout#layout|layout}.  If not provided the `layout` is used
 * unchanged.
 *
 * @augments {Layout}
 */ class OffsetLayout extends ExternalLayout {
    constructor(layout, offset = 0, property){
        if (!(layout instanceof Layout)) {
            throw new TypeError('layout must be a Layout');
        }
        if (!Number.isInteger(offset)) {
            throw new TypeError('offset must be integer or undefined');
        }
        super(layout.span, property || layout.property);
        /** The subordinated layout. */ this.layout = layout;
        /** The location of {@link OffsetLayout#layout} relative to the
         * start of another layout.
         *
         * The value may be positive or negative, but an error will thrown
         * if at the point of use it goes outside the span of the Uint8Array
         * being accessed.  */ this.offset = offset;
    }
    /** @override */ isCount() {
        return this.layout instanceof UInt || this.layout instanceof UIntBE;
    }
    /** @override */ decode(b, offset = 0) {
        return this.layout.decode(b, offset + this.offset);
    }
    /** @override */ encode(src, b, offset = 0) {
        return this.layout.encode(src, b, offset + this.offset);
    }
}
exports.OffsetLayout = OffsetLayout;
/**
 * Represent an unsigned integer in little-endian format.
 *
 * *Factory*: {@link module:Layout.u8|u8}, {@link
 *  module:Layout.u16|u16}, {@link module:Layout.u24|u24}, {@link
 *  module:Layout.u32|u32}, {@link module:Layout.u40|u40}, {@link
 *  module:Layout.u48|u48}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class UInt extends Layout {
    constructor(span, property){
        super(span, property);
        if (6 < this.span) {
            throw new RangeError('span must not exceed 6 bytes');
        }
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readUIntLE(offset, this.span);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeUIntLE(src, offset, this.span);
        return this.span;
    }
}
exports.UInt = UInt;
/**
 * Represent an unsigned integer in big-endian format.
 *
 * *Factory*: {@link module:Layout.u8be|u8be}, {@link
 * module:Layout.u16be|u16be}, {@link module:Layout.u24be|u24be},
 * {@link module:Layout.u32be|u32be}, {@link
 * module:Layout.u40be|u40be}, {@link module:Layout.u48be|u48be}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class UIntBE extends Layout {
    constructor(span, property){
        super(span, property);
        if (6 < this.span) {
            throw new RangeError('span must not exceed 6 bytes');
        }
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readUIntBE(offset, this.span);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeUIntBE(src, offset, this.span);
        return this.span;
    }
}
exports.UIntBE = UIntBE;
/**
 * Represent a signed integer in little-endian format.
 *
 * *Factory*: {@link module:Layout.s8|s8}, {@link
 *  module:Layout.s16|s16}, {@link module:Layout.s24|s24}, {@link
 *  module:Layout.s32|s32}, {@link module:Layout.s40|s40}, {@link
 *  module:Layout.s48|s48}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Int extends Layout {
    constructor(span, property){
        super(span, property);
        if (6 < this.span) {
            throw new RangeError('span must not exceed 6 bytes');
        }
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readIntLE(offset, this.span);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeIntLE(src, offset, this.span);
        return this.span;
    }
}
exports.Int = Int;
/**
 * Represent a signed integer in big-endian format.
 *
 * *Factory*: {@link module:Layout.s8be|s8be}, {@link
 * module:Layout.s16be|s16be}, {@link module:Layout.s24be|s24be},
 * {@link module:Layout.s32be|s32be}, {@link
 * module:Layout.s40be|s40be}, {@link module:Layout.s48be|s48be}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class IntBE extends Layout {
    constructor(span, property){
        super(span, property);
        if (6 < this.span) {
            throw new RangeError('span must not exceed 6 bytes');
        }
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readIntBE(offset, this.span);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeIntBE(src, offset, this.span);
        return this.span;
    }
}
exports.IntBE = IntBE;
const V2E32 = Math.pow(2, 32);
/* True modulus high and low 32-bit words, where low word is always
 * non-negative. */ function divmodInt64(src) {
    const hi32 = Math.floor(src / V2E32);
    const lo32 = src - hi32 * V2E32;
    return {
        hi32,
        lo32
    };
}
/* Reconstruct Number from quotient and non-negative remainder */ function roundedInt64(hi32, lo32) {
    return hi32 * V2E32 + lo32;
}
/**
 * Represent an unsigned 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.nu64|nu64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */ class NearUInt64 extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const lo32 = buffer.readUInt32LE(offset);
        const hi32 = buffer.readUInt32LE(offset + 4);
        return roundedInt64(hi32, lo32);
    }
    /** @override */ encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32LE(split.lo32, offset);
        buffer.writeUInt32LE(split.hi32, offset + 4);
        return 8;
    }
}
exports.NearUInt64 = NearUInt64;
/**
 * Represent an unsigned 64-bit integer in big-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.nu64be|nu64be}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */ class NearUInt64BE extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const hi32 = buffer.readUInt32BE(offset);
        const lo32 = buffer.readUInt32BE(offset + 4);
        return roundedInt64(hi32, lo32);
    }
    /** @override */ encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32BE(split.hi32, offset);
        buffer.writeUInt32BE(split.lo32, offset + 4);
        return 8;
    }
}
exports.NearUInt64BE = NearUInt64BE;
/**
 * Represent a signed 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.ns64|ns64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */ class NearInt64 extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const lo32 = buffer.readUInt32LE(offset);
        const hi32 = buffer.readInt32LE(offset + 4);
        return roundedInt64(hi32, lo32);
    }
    /** @override */ encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeUInt32LE(split.lo32, offset);
        buffer.writeInt32LE(split.hi32, offset + 4);
        return 8;
    }
}
exports.NearInt64 = NearInt64;
/**
 * Represent a signed 64-bit integer in big-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.ns64be|ns64be}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */ class NearInt64BE extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        const buffer = uint8ArrayToBuffer(b);
        const hi32 = buffer.readInt32BE(offset);
        const lo32 = buffer.readUInt32BE(offset + 4);
        return roundedInt64(hi32, lo32);
    }
    /** @override */ encode(src, b, offset = 0) {
        const split = divmodInt64(src);
        const buffer = uint8ArrayToBuffer(b);
        buffer.writeInt32BE(split.hi32, offset);
        buffer.writeUInt32BE(split.lo32, offset + 4);
        return 8;
    }
}
exports.NearInt64BE = NearInt64BE;
/**
 * Represent a 32-bit floating point number in little-endian format.
 *
 * *Factory*: {@link module:Layout.f32|f32}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Float extends Layout {
    constructor(property){
        super(4, property);
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readFloatLE(offset);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeFloatLE(src, offset);
        return 4;
    }
}
exports.Float = Float;
/**
 * Represent a 32-bit floating point number in big-endian format.
 *
 * *Factory*: {@link module:Layout.f32be|f32be}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class FloatBE extends Layout {
    constructor(property){
        super(4, property);
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readFloatBE(offset);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeFloatBE(src, offset);
        return 4;
    }
}
exports.FloatBE = FloatBE;
/**
 * Represent a 64-bit floating point number in little-endian format.
 *
 * *Factory*: {@link module:Layout.f64|f64}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Double extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readDoubleLE(offset);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeDoubleLE(src, offset);
        return 8;
    }
}
exports.Double = Double;
/**
 * Represent a 64-bit floating point number in big-endian format.
 *
 * *Factory*: {@link module:Layout.f64be|f64be}
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class DoubleBE extends Layout {
    constructor(property){
        super(8, property);
    }
    /** @override */ decode(b, offset = 0) {
        return uint8ArrayToBuffer(b).readDoubleBE(offset);
    }
    /** @override */ encode(src, b, offset = 0) {
        uint8ArrayToBuffer(b).writeDoubleBE(src, offset);
        return 8;
    }
}
exports.DoubleBE = DoubleBE;
/**
 * Represent a contiguous sequence of a specific layout as an Array.
 *
 * *Factory*: {@link module:Layout.seq|seq}
 *
 * @param {Layout} elementLayout - initializer for {@link
 * Sequence#elementLayout|elementLayout}.
 *
 * @param {(Number|ExternalLayout)} count - initializer for {@link
 * Sequence#count|count}.  The parameter must be either a positive
 * integer or an instance of {@link ExternalLayout}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Sequence extends Layout {
    constructor(elementLayout, count, property){
        if (!(elementLayout instanceof Layout)) {
            throw new TypeError('elementLayout must be a Layout');
        }
        if (!(count instanceof ExternalLayout && count.isCount() || Number.isInteger(count) && 0 <= count)) {
            throw new TypeError('count must be non-negative integer ' + 'or an unsigned integer ExternalLayout');
        }
        let span = -1;
        if (!(count instanceof ExternalLayout) && 0 < elementLayout.span) {
            span = count * elementLayout.span;
        }
        super(span, property);
        /** The layout for individual elements of the sequence. */ this.elementLayout = elementLayout;
        /** The number of elements in the sequence.
         *
         * This will be either a non-negative integer or an instance of
         * {@link ExternalLayout} for which {@link
         * ExternalLayout#isCount|isCount()} is `true`. */ this.count = count;
    }
    /** @override */ getSpan(b, offset = 0) {
        if (0 <= this.span) {
            return this.span;
        }
        let span = 0;
        let count = this.count;
        if (count instanceof ExternalLayout) {
            count = count.decode(b, offset);
        }
        if (0 < this.elementLayout.span) {
            span = count * this.elementLayout.span;
        } else {
            let idx = 0;
            while(idx < count){
                span += this.elementLayout.getSpan(b, offset + span);
                ++idx;
            }
        }
        return span;
    }
    /** @override */ decode(b, offset = 0) {
        const rv = [];
        let i = 0;
        let count = this.count;
        if (count instanceof ExternalLayout) {
            count = count.decode(b, offset);
        }
        while(i < count){
            rv.push(this.elementLayout.decode(b, offset));
            offset += this.elementLayout.getSpan(b, offset);
            i += 1;
        }
        return rv;
    }
    /** Implement {@link Layout#encode|encode} for {@link Sequence}.
     *
     * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
     * the unused space in the buffer is left unchanged.  If `src` is
     * longer than {@link Sequence#count|count} the unneeded elements are
     * ignored.
     *
     * **NOTE** If {@link Layout#count|count} is an instance of {@link
     * ExternalLayout} then the length of `src` will be encoded as the
     * count after `src` is encoded. */ encode(src, b, offset = 0) {
        const elo = this.elementLayout;
        const span = src.reduce((span, v)=>{
            return span + elo.encode(v, b, offset + span);
        }, 0);
        if (this.count instanceof ExternalLayout) {
            this.count.encode(src.length, b, offset);
        }
        return span;
    }
}
exports.Sequence = Sequence;
/**
 * Represent a contiguous sequence of arbitrary layout elements as an
 * Object.
 *
 * *Factory*: {@link module:Layout.struct|struct}
 *
 * **NOTE** The {@link Layout#span|span} of the structure is variable
 * if any layout in {@link Structure#fields|fields} has a variable
 * span.  When {@link Layout#encode|encoding} we must have a value for
 * all variable-length fields, or we wouldn't be able to figure out
 * how much space to use for storage.  We can only identify the value
 * for a field when it has a {@link Layout#property|property}.  As
 * such, although a structure may contain both unnamed fields and
 * variable-length fields, it cannot contain an unnamed
 * variable-length field.
 *
 * @param {Layout[]} fields - initializer for {@link
 * Structure#fields|fields}.  An error is raised if this contains a
 * variable-length field for which a {@link Layout#property|property}
 * is not defined.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @param {Boolean} [decodePrefixes] - initializer for {@link
 * Structure#decodePrefixes|property}.
 *
 * @throws {Error} - if `fields` contains an unnamed variable-length
 * layout.
 *
 * @augments {Layout}
 */ class Structure extends Layout {
    constructor(fields, property, decodePrefixes){
        if (!(Array.isArray(fields) && fields.reduce((acc, v)=>acc && v instanceof Layout, true))) {
            throw new TypeError('fields must be array of Layout instances');
        }
        if ('boolean' === typeof property && undefined === decodePrefixes) {
            decodePrefixes = property;
            property = undefined;
        }
        /* Verify absence of unnamed variable-length fields. */ for (const fd of fields){
            if (0 > fd.span && undefined === fd.property) {
                throw new Error('fields cannot contain unnamed variable-length layout');
            }
        }
        let span = -1;
        try {
            span = fields.reduce((span, fd)=>span + fd.getSpan(), 0);
        } catch (e) {
        // ignore error
        }
        super(span, property);
        /** The sequence of {@link Layout} values that comprise the
         * structure.
         *
         * The individual elements need not be the same type, and may be
         * either scalar or aggregate layouts.  If a member layout leaves
         * its {@link Layout#property|property} undefined the
         * corresponding region of the buffer associated with the element
         * will not be mutated.
         *
         * @type {Layout[]} */ this.fields = fields;
        /** Control behavior of {@link Layout#decode|decode()} given short
         * buffers.
         *
         * In some situations a structure many be extended with additional
         * fields over time, with older installations providing only a
         * prefix of the full structure.  If this property is `true`
         * decoding will accept those buffers and leave subsequent fields
         * undefined, as long as the buffer ends at a field boundary.
         * Defaults to `false`. */ this.decodePrefixes = !!decodePrefixes;
    }
    /** @override */ getSpan(b, offset = 0) {
        if (0 <= this.span) {
            return this.span;
        }
        let span = 0;
        try {
            span = this.fields.reduce((span, fd)=>{
                const fsp = fd.getSpan(b, offset);
                offset += fsp;
                return span + fsp;
            }, 0);
        } catch (e) {
            throw new RangeError('indeterminate span');
        }
        return span;
    }
    /** @override */ decode(b, offset = 0) {
        checkUint8Array(b);
        const dest = this.makeDestinationObject();
        for (const fd of this.fields){
            if (undefined !== fd.property) {
                dest[fd.property] = fd.decode(b, offset);
            }
            offset += fd.getSpan(b, offset);
            if (this.decodePrefixes && b.length === offset) {
                break;
            }
        }
        return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link Structure}.
     *
     * If `src` is missing a property for a member with a defined {@link
     * Layout#property|property} the corresponding region of the buffer is
     * left unmodified. */ encode(src, b, offset = 0) {
        const firstOffset = offset;
        let lastOffset = 0;
        let lastWrote = 0;
        for (const fd of this.fields){
            let span = fd.span;
            lastWrote = 0 < span ? span : 0;
            if (undefined !== fd.property) {
                const fv = src[fd.property];
                if (undefined !== fv) {
                    lastWrote = fd.encode(fv, b, offset);
                    if (0 > span) {
                        /* Read the as-encoded span, which is not necessarily the
                         * same as what we wrote. */ span = fd.getSpan(b, offset);
                    }
                }
            }
            lastOffset = offset;
            offset += span;
        }
        /* Use (lastOffset + lastWrote) instead of offset because the last
         * item may have had a dynamic length and we don't want to include
         * the padding between it and the end of the space reserved for
         * it. */ return lastOffset + lastWrote - firstOffset;
    }
    /** @override */ fromArray(values) {
        const dest = this.makeDestinationObject();
        for (const fd of this.fields){
            if (undefined !== fd.property && 0 < values.length) {
                dest[fd.property] = values.shift();
            }
        }
        return dest;
    }
    /**
     * Get access to the layout of a given property.
     *
     * @param {String} property - the structure member of interest.
     *
     * @return {Layout} - the layout associated with `property`, or
     * undefined if there is no such property.
     */ layoutFor(property) {
        if ('string' !== typeof property) {
            throw new TypeError('property must be string');
        }
        for (const fd of this.fields){
            if (fd.property === property) {
                return fd;
            }
        }
        return undefined;
    }
    /**
     * Get the offset of a structure member.
     *
     * @param {String} property - the structure member of interest.
     *
     * @return {Number} - the offset in bytes to the start of `property`
     * within the structure, or undefined if `property` is not a field
     * within the structure.  If the property is a member but follows a
     * variable-length structure member a negative number will be
     * returned.
     */ offsetOf(property) {
        if ('string' !== typeof property) {
            throw new TypeError('property must be string');
        }
        let offset = 0;
        for (const fd of this.fields){
            if (fd.property === property) {
                return offset;
            }
            if (0 > fd.span) {
                offset = -1;
            } else if (0 <= offset) {
                offset += fd.span;
            }
        }
        return undefined;
    }
}
exports.Structure = Structure;
/**
 * An object that can provide a {@link
 * Union#discriminator|discriminator} API for {@link Union}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * UnionDiscriminator#encode|encode} or {@link
 * UnionDiscriminator#decode|decode} functions.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}.
 *
 * @abstract
 */ class UnionDiscriminator {
    constructor(property){
        /** The {@link Layout#property|property} to be used when the
         * discriminator is referenced in isolation (generally when {@link
         * Union#decode|Union decode} cannot delegate to a specific
         * variant). */ this.property = property;
    }
    /** Analog to {@link Layout#decode|Layout decode} for union discriminators.
     *
     * The implementation of this method need not reference the buffer if
     * variant information is available through other means. */ decode(b, offset) {
        throw new Error('UnionDiscriminator is abstract');
    }
    /** Analog to {@link Layout#decode|Layout encode} for union discriminators.
     *
     * The implementation of this method need not store the value if
     * variant information is maintained through other means. */ encode(src, b, offset) {
        throw new Error('UnionDiscriminator is abstract');
    }
}
exports.UnionDiscriminator = UnionDiscriminator;
/**
 * An object that can provide a {@link
 * UnionDiscriminator|discriminator API} for {@link Union} using an
 * unsigned integral {@link Layout} instance located either inside or
 * outside the union.
 *
 * @param {ExternalLayout} layout - initializes {@link
 * UnionLayoutDiscriminator#layout|layout}.  Must satisfy {@link
 * ExternalLayout#isCount|isCount()}.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}, superseding the property
 * from `layout`, but defaulting to `variant` if neither `property`
 * nor layout provide a property name.
 *
 * @augments {UnionDiscriminator}
 */ class UnionLayoutDiscriminator extends UnionDiscriminator {
    constructor(layout, property){
        if (!(layout instanceof ExternalLayout && layout.isCount())) {
            throw new TypeError('layout must be an unsigned integer ExternalLayout');
        }
        super(property || layout.property || 'variant');
        /** The {@link ExternalLayout} used to access the discriminator
         * value. */ this.layout = layout;
    }
    /** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */ decode(b, offset) {
        return this.layout.decode(b, offset);
    }
    /** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */ encode(src, b, offset) {
        return this.layout.encode(src, b, offset);
    }
}
exports.UnionLayoutDiscriminator = UnionLayoutDiscriminator;
/**
 * Represent any number of span-compatible layouts.
 *
 * *Factory*: {@link module:Layout.union|union}
 *
 * If the union has a {@link Union#defaultLayout|default layout} that
 * layout must have a non-negative {@link Layout#span|span}.  The span
 * of a fixed-span union includes its {@link
 * Union#discriminator|discriminator} if the variant is a {@link
 * Union#usesPrefixDiscriminator|prefix of the union}, plus the span
 * of its {@link Union#defaultLayout|default layout}.
 *
 * If the union does not have a default layout then the encoded span
 * of the union depends on the encoded span of its variant (which may
 * be fixed or variable).
 *
 * {@link VariantLayout#layout|Variant layout}s are added through
 * {@link Union#addVariant|addVariant}.  If the union has a default
 * layout, the span of the {@link VariantLayout#layout|layout
 * contained by the variant} must not exceed the span of the {@link
 * Union#defaultLayout|default layout} (minus the span of a {@link
 * Union#usesPrefixDiscriminator|prefix disriminator}, if used).  The
 * span of the variant will equal the span of the union itself.
 *
 * The variant for a buffer can only be identified from the {@link
 * Union#discriminator|discriminator} {@link
 * UnionDiscriminator#property|property} (in the case of the {@link
 * Union#defaultLayout|default layout}), or by using {@link
 * Union#getVariant|getVariant} and examining the resulting {@link
 * VariantLayout} instance.
 *
 * A variant compatible with a JavaScript object can be identified
 * using {@link Union#getSourceVariant|getSourceVariant}.
 *
 * @param {(UnionDiscriminator|ExternalLayout|Layout)} discr - How to
 * identify the layout used to interpret the union contents.  The
 * parameter must be an instance of {@link UnionDiscriminator}, an
 * {@link ExternalLayout} that satisfies {@link
 * ExternalLayout#isCount|isCount()}, or {@link UInt} (or {@link
 * UIntBE}).  When a non-external layout element is passed the layout
 * appears at the start of the union.  In all cases the (synthesized)
 * {@link UnionDiscriminator} instance is recorded as {@link
 * Union#discriminator|discriminator}.
 *
 * @param {(Layout|null)} defaultLayout - initializer for {@link
 * Union#defaultLayout|defaultLayout}.  If absent defaults to `null`.
 * If `null` there is no default layout: the union has data-dependent
 * length and attempts to decode or encode unrecognized variants will
 * throw an exception.  A {@link Layout} instance must have a
 * non-negative {@link Layout#span|span}, and if it lacks a {@link
 * Layout#property|property} the {@link
 * Union#defaultLayout|defaultLayout} will be a {@link
 * Layout#replicate|replica} with property `content`.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Union extends Layout {
    constructor(discr, defaultLayout, property){
        let discriminator;
        if (discr instanceof UInt || discr instanceof UIntBE) {
            discriminator = new UnionLayoutDiscriminator(new OffsetLayout(discr));
        } else if (discr instanceof ExternalLayout && discr.isCount()) {
            discriminator = new UnionLayoutDiscriminator(discr);
        } else if (!(discr instanceof UnionDiscriminator)) {
            throw new TypeError('discr must be a UnionDiscriminator ' + 'or an unsigned integer layout');
        } else {
            discriminator = discr;
        }
        if (undefined === defaultLayout) {
            defaultLayout = null;
        }
        if (!(null === defaultLayout || defaultLayout instanceof Layout)) {
            throw new TypeError('defaultLayout must be null or a Layout');
        }
        if (null !== defaultLayout) {
            if (0 > defaultLayout.span) {
                throw new Error('defaultLayout must have constant span');
            }
            if (undefined === defaultLayout.property) {
                defaultLayout = defaultLayout.replicate('content');
            }
        }
        /* The union span can be estimated only if there's a default
         * layout.  The union spans its default layout, plus any prefix
         * variant layout.  By construction both layouts, if present, have
         * non-negative span. */ let span = -1;
        if (defaultLayout) {
            span = defaultLayout.span;
            if (0 <= span && (discr instanceof UInt || discr instanceof UIntBE)) {
                span += discriminator.layout.span;
            }
        }
        super(span, property);
        /** The interface for the discriminator value in isolation.
         *
         * This a {@link UnionDiscriminator} either passed to the
         * constructor or synthesized from the `discr` constructor
         * argument.  {@link
         * Union#usesPrefixDiscriminator|usesPrefixDiscriminator} will be
         * `true` iff the `discr` parameter was a non-offset {@link
         * Layout} instance. */ this.discriminator = discriminator;
        /** `true` if the {@link Union#discriminator|discriminator} is the
         * first field in the union.
         *
         * If `false` the discriminator is obtained from somewhere
         * else. */ this.usesPrefixDiscriminator = discr instanceof UInt || discr instanceof UIntBE;
        /** The layout for non-discriminator content when the value of the
         * discriminator is not recognized.
         *
         * This is the value passed to the constructor.  It is
         * structurally equivalent to the second component of {@link
         * Union#layout|layout} but may have a different property
         * name. */ this.defaultLayout = defaultLayout;
        /** A registry of allowed variants.
         *
         * The keys are unsigned integers which should be compatible with
         * {@link Union.discriminator|discriminator}.  The property value
         * is the corresponding {@link VariantLayout} instances assigned
         * to this union by {@link Union#addVariant|addVariant}.
         *
         * **NOTE** The registry remains mutable so that variants can be
         * {@link Union#addVariant|added} at any time.  Users should not
         * manipulate the content of this property. */ this.registry = {};
        /* Private variable used when invoking getSourceVariant */ let boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);
        /** Function to infer the variant selected by a source object.
         *
         * Defaults to {@link
         * Union#defaultGetSourceVariant|defaultGetSourceVariant} but may
         * be overridden using {@link
         * Union#configGetSourceVariant|configGetSourceVariant}.
         *
         * @param {Object} src - as with {@link
         * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
         *
         * @returns {(undefined|VariantLayout)} The default variant
         * (`undefined`) or first registered variant that uses a property
         * available in `src`. */ this.getSourceVariant = function(src) {
            return boundGetSourceVariant(src);
        };
        /** Function to override the implementation of {@link
         * Union#getSourceVariant|getSourceVariant}.
         *
         * Use this if the desired variant cannot be identified using the
         * algorithm of {@link
         * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
         *
         * **NOTE** The provided function will be invoked bound to this
         * Union instance, providing local access to {@link
         * Union#registry|registry}.
         *
         * @param {Function} gsv - a function that follows the API of
         * {@link Union#defaultGetSourceVariant|defaultGetSourceVariant}. */ this.configGetSourceVariant = function(gsv) {
            boundGetSourceVariant = gsv.bind(this);
        };
    }
    /** @override */ getSpan(b, offset = 0) {
        if (0 <= this.span) {
            return this.span;
        }
        /* Default layouts always have non-negative span, so we don't have
         * one and we have to recognize the variant which will in turn
         * determine the span. */ const vlo = this.getVariant(b, offset);
        if (!vlo) {
            throw new Error('unable to determine span for unrecognized variant');
        }
        return vlo.getSpan(b, offset);
    }
    /**
     * Method to infer a registered Union variant compatible with `src`.
     *
     * The first satisfied rule in the following sequence defines the
     * return value:
     * * If `src` has properties matching the Union discriminator and
     *   the default layout, `undefined` is returned regardless of the
     *   value of the discriminator property (this ensures the default
     *   layout will be used);
     * * If `src` has a property matching the Union discriminator, the
     *   value of the discriminator identifies a registered variant, and
     *   either (a) the variant has no layout, or (b) `src` has the
     *   variant's property, then the variant is returned (because the
     *   source satisfies the constraints of the variant it identifies);
     * * If `src` does not have a property matching the Union
     *   discriminator, but does have a property matching a registered
     *   variant, then the variant is returned (because the source
     *   matches a variant without an explicit conflict);
     * * An error is thrown (because we either can't identify a variant,
     *   or we were explicitly told the variant but can't satisfy it).
     *
     * @param {Object} src - an object presumed to be compatible with
     * the content of the Union.
     *
     * @return {(undefined|VariantLayout)} - as described above.
     *
     * @throws {Error} - if `src` cannot be associated with a default or
     * registered variant.
     */ defaultGetSourceVariant(src) {
        if (Object.prototype.hasOwnProperty.call(src, this.discriminator.property)) {
            if (this.defaultLayout && this.defaultLayout.property && Object.prototype.hasOwnProperty.call(src, this.defaultLayout.property)) {
                return undefined;
            }
            const vlo = this.registry[src[this.discriminator.property]];
            if (vlo && (!vlo.layout || vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property))) {
                return vlo;
            }
        } else {
            for(const tag in this.registry){
                const vlo = this.registry[tag];
                if (vlo.property && Object.prototype.hasOwnProperty.call(src, vlo.property)) {
                    return vlo;
                }
            }
        }
        throw new Error('unable to infer src variant');
    }
    /** Implement {@link Layout#decode|decode} for {@link Union}.
     *
     * If the variant is {@link Union#addVariant|registered} the return
     * value is an instance of that variant, with no explicit
     * discriminator.  Otherwise the {@link Union#defaultLayout|default
     * layout} is used to decode the content. */ decode(b, offset = 0) {
        let dest;
        const dlo = this.discriminator;
        const discr = dlo.decode(b, offset);
        const clo = this.registry[discr];
        if (undefined === clo) {
            const defaultLayout = this.defaultLayout;
            let contentOffset = 0;
            if (this.usesPrefixDiscriminator) {
                contentOffset = dlo.layout.span;
            }
            dest = this.makeDestinationObject();
            dest[dlo.property] = discr;
            // defaultLayout.property can be undefined, but this is allowed by buffer-layout
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            dest[defaultLayout.property] = defaultLayout.decode(b, offset + contentOffset);
        } else {
            dest = clo.decode(b, offset);
        }
        return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link Union}.
     *
     * This API assumes the `src` object is consistent with the union's
     * {@link Union#defaultLayout|default layout}.  To encode variants
     * use the appropriate variant-specific {@link VariantLayout#encode}
     * method. */ encode(src, b, offset = 0) {
        const vlo = this.getSourceVariant(src);
        if (undefined === vlo) {
            const dlo = this.discriminator;
            // this.defaultLayout is not undefined when vlo is undefined
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const clo = this.defaultLayout;
            let contentOffset = 0;
            if (this.usesPrefixDiscriminator) {
                contentOffset = dlo.layout.span;
            }
            dlo.encode(src[dlo.property], b, offset);
            // clo.property is not undefined when vlo is undefined
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return contentOffset + clo.encode(src[clo.property], b, offset + contentOffset);
        }
        return vlo.encode(src, b, offset);
    }
    /** Register a new variant structure within a union.  The newly
     * created variant is returned.
     *
     * @param {Number} variant - initializer for {@link
     * VariantLayout#variant|variant}.
     *
     * @param {Layout} layout - initializer for {@link
     * VariantLayout#layout|layout}.
     *
     * @param {String} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {VariantLayout} */ addVariant(variant, layout, property) {
        const rv = new VariantLayout(this, variant, layout, property);
        this.registry[variant] = rv;
        return rv;
    }
    /**
     * Get the layout associated with a registered variant.
     *
     * If `vb` does not produce a registered variant the function returns
     * `undefined`.
     *
     * @param {(Number|Uint8Array)} vb - either the variant number, or a
     * buffer from which the discriminator is to be read.
     *
     * @param {Number} offset - offset into `vb` for the start of the
     * union.  Used only when `vb` is an instance of {Uint8Array}.
     *
     * @return {({VariantLayout}|undefined)}
     */ getVariant(vb, offset = 0) {
        let variant;
        if (vb instanceof Uint8Array) {
            variant = this.discriminator.decode(vb, offset);
        } else {
            variant = vb;
        }
        return this.registry[variant];
    }
}
exports.Union = Union;
/**
 * Represent a specific variant within a containing union.
 *
 * **NOTE** The {@link Layout#span|span} of the variant may include
 * the span of the {@link Union#discriminator|discriminator} used to
 * identify it, but values read and written using the variant strictly
 * conform to the content of {@link VariantLayout#layout|layout}.
 *
 * **NOTE** User code should not invoke this constructor directly.  Use
 * the union {@link Union#addVariant|addVariant} helper method.
 *
 * @param {Union} union - initializer for {@link
 * VariantLayout#union|union}.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} [layout] - initializer for {@link
 * VariantLayout#layout|layout}.  If absent the variant carries no
 * data.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.  Unlike many other layouts, variant
 * layouts normally include a property name so they can be identified
 * within their containing {@link Union}.  The property identifier may
 * be absent only if `layout` is is absent.
 *
 * @augments {Layout}
 */ class VariantLayout extends Layout {
    constructor(union, variant, layout, property){
        if (!(union instanceof Union)) {
            throw new TypeError('union must be a Union');
        }
        if (!Number.isInteger(variant) || 0 > variant) {
            throw new TypeError('variant must be a (non-negative) integer');
        }
        if ('string' === typeof layout && undefined === property) {
            property = layout;
            layout = null;
        }
        if (layout) {
            if (!(layout instanceof Layout)) {
                throw new TypeError('layout must be a Layout');
            }
            if (null !== union.defaultLayout && 0 <= layout.span && layout.span > union.defaultLayout.span) {
                throw new Error('variant span exceeds span of containing union');
            }
            if ('string' !== typeof property) {
                throw new TypeError('variant must have a String property');
            }
        }
        let span = union.span;
        if (0 > union.span) {
            span = layout ? layout.span : 0;
            if (0 <= span && union.usesPrefixDiscriminator) {
                span += union.discriminator.layout.span;
            }
        }
        super(span, property);
        /** The {@link Union} to which this variant belongs. */ this.union = union;
        /** The unsigned integral value identifying this variant within
         * the {@link Union#discriminator|discriminator} of the containing
         * union. */ this.variant = variant;
        /** The {@link Layout} to be used when reading/writing the
         * non-discriminator part of the {@link
         * VariantLayout#union|union}.  If `null` the variant carries no
         * data. */ this.layout = layout || null;
    }
    /** @override */ getSpan(b, offset = 0) {
        if (0 <= this.span) {
            /* Will be equal to the containing union span if that is not
             * variable. */ return this.span;
        }
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
            contentOffset = this.union.discriminator.layout.span;
        }
        /* Span is defined solely by the variant (and prefix discriminator) */ let span = 0;
        if (this.layout) {
            span = this.layout.getSpan(b, offset + contentOffset);
        }
        return contentOffset + span;
    }
    /** @override */ decode(b, offset = 0) {
        const dest = this.makeDestinationObject();
        if (this !== this.union.getVariant(b, offset)) {
            throw new Error('variant mismatch');
        }
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
            contentOffset = this.union.discriminator.layout.span;
        }
        if (this.layout) {
            dest[this.property] = this.layout.decode(b, offset + contentOffset);
        } else if (this.property) {
            dest[this.property] = true;
        } else if (this.union.usesPrefixDiscriminator) {
            dest[this.union.discriminator.property] = this.variant;
        }
        return dest;
    }
    /** @override */ encode(src, b, offset = 0) {
        let contentOffset = 0;
        if (this.union.usesPrefixDiscriminator) {
            contentOffset = this.union.discriminator.layout.span;
        }
        if (this.layout && !Object.prototype.hasOwnProperty.call(src, this.property)) {
            throw new TypeError('variant lacks property ' + this.property);
        }
        this.union.discriminator.encode(this.variant, b, offset);
        let span = contentOffset;
        if (this.layout) {
            this.layout.encode(src[this.property], b, offset + contentOffset);
            span += this.layout.getSpan(b, offset + contentOffset);
            if (0 <= this.union.span && span > this.union.span) {
                throw new Error('encoded variant overruns containing union');
            }
        }
        return span;
    }
    /** Delegate {@link Layout#fromArray|fromArray} to {@link
     * VariantLayout#layout|layout}. */ fromArray(values) {
        if (this.layout) {
            return this.layout.fromArray(values);
        }
        return undefined;
    }
}
exports.VariantLayout = VariantLayout;
/** JavaScript chose to define bitwise operations as operating on
 * signed 32-bit values in 2's complement form, meaning any integer
 * with bit 31 set is going to look negative.  For right shifts that's
 * not a problem, because `>>>` is a logical shift, but for every
 * other bitwise operator we have to compensate for possible negative
 * results. */ function fixBitwiseResult(v) {
    if (0 > v) {
        v += 0x100000000;
    }
    return v;
}
/**
 * Contain a sequence of bit fields as an unsigned integer.
 *
 * *Factory*: {@link module:Layout.bits|bits}
 *
 * This is a container element; within it there are {@link BitField}
 * instances that provide the extracted properties.  The container
 * simply defines the aggregate representation and its bit ordering.
 * The representation is an object containing properties with numeric
 * or {@link Boolean} values.
 *
 * {@link BitField}s are added with the {@link
 * BitStructure#addField|addField} and {@link
 * BitStructure#addBoolean|addBoolean} methods.

 * @param {Layout} word - initializer for {@link
 * BitStructure#word|word}.  The parameter must be an instance of
 * {@link UInt} (or {@link UIntBE}) that is no more than 4 bytes wide.
 *
 * @param {bool} [msb] - `true` if the bit numbering starts at the
 * most significant bit of the containing word; `false` (default) if
 * it starts at the least significant bit of the containing word.  If
 * the parameter at this position is a string and `property` is
 * `undefined` the value of this argument will instead be used as the
 * value of `property`.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class BitStructure extends Layout {
    constructor(word, msb, property){
        if (!(word instanceof UInt || word instanceof UIntBE)) {
            throw new TypeError('word must be a UInt or UIntBE layout');
        }
        if ('string' === typeof msb && undefined === property) {
            property = msb;
            msb = false;
        }
        if (4 < word.span) {
            throw new RangeError('word cannot exceed 32 bits');
        }
        super(word.span, property);
        /** The layout used for the packed value.  {@link BitField}
         * instances are packed sequentially depending on {@link
         * BitStructure#msb|msb}. */ this.word = word;
        /** Whether the bit sequences are packed starting at the most
         * significant bit growing down (`true`), or the least significant
         * bit growing up (`false`).
         *
         * **NOTE** Regardless of this value, the least significant bit of
         * any {@link BitField} value is the least significant bit of the
         * corresponding section of the packed value. */ this.msb = !!msb;
        /** The sequence of {@link BitField} layouts that comprise the
         * packed structure.
         *
         * **NOTE** The array remains mutable to allow fields to be {@link
         * BitStructure#addField|added} after construction.  Users should
         * not manipulate the content of this property.*/ this.fields = [];
        /* Storage for the value.  Capture a variable instead of using an
         * instance property because we don't want anything to change the
         * value without going through the mutator. */ let value = 0;
        this._packedSetValue = function(v) {
            value = fixBitwiseResult(v);
            return this;
        };
        this._packedGetValue = function() {
            return value;
        };
    }
    /** @override */ decode(b, offset = 0) {
        const dest = this.makeDestinationObject();
        const value = this.word.decode(b, offset);
        this._packedSetValue(value);
        for (const fd of this.fields){
            if (undefined !== fd.property) {
                dest[fd.property] = fd.decode(b);
            }
        }
        return dest;
    }
    /** Implement {@link Layout#encode|encode} for {@link BitStructure}.
     *
     * If `src` is missing a property for a member with a defined {@link
     * Layout#property|property} the corresponding region of the packed
     * value is left unmodified.  Unused bits are also left unmodified. */ encode(src, b, offset = 0) {
        const value = this.word.decode(b, offset);
        this._packedSetValue(value);
        for (const fd of this.fields){
            if (undefined !== fd.property) {
                const fv = src[fd.property];
                if (undefined !== fv) {
                    fd.encode(fv);
                }
            }
        }
        return this.word.encode(this._packedGetValue(), b, offset);
    }
    /** Register a new bitfield with a containing bit structure.  The
     * resulting bitfield is returned.
     *
     * @param {Number} bits - initializer for {@link BitField#bits|bits}.
     *
     * @param {string} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {BitField} */ addField(bits, property) {
        const bf = new BitField(this, bits, property);
        this.fields.push(bf);
        return bf;
    }
    /** As with {@link BitStructure#addField|addField} for single-bit
     * fields with `boolean` value representation.
     *
     * @param {string} property - initializer for {@link
     * Layout#property|property}.
     *
     * @return {Boolean} */ // `Boolean` conflicts with the native primitive type
    // eslint-disable-next-line @typescript-eslint/ban-types
    addBoolean(property) {
        // This is my Boolean, not the Javascript one.
        const bf = new Boolean(this, property);
        this.fields.push(bf);
        return bf;
    }
    /**
     * Get access to the bit field for a given property.
     *
     * @param {String} property - the bit field of interest.
     *
     * @return {BitField} - the field associated with `property`, or
     * undefined if there is no such property.
     */ fieldFor(property) {
        if ('string' !== typeof property) {
            throw new TypeError('property must be string');
        }
        for (const fd of this.fields){
            if (fd.property === property) {
                return fd;
            }
        }
        return undefined;
    }
}
exports.BitStructure = BitStructure;
/**
 * Represent a sequence of bits within a {@link BitStructure}.
 *
 * All bit field values are represented as unsigned integers.
 *
 * **NOTE** User code should not invoke this constructor directly.
 * Use the container {@link BitStructure#addField|addField} helper
 * method.
 *
 * **NOTE** BitField instances are not instances of {@link Layout}
 * since {@link Layout#span|span} measures 8-bit units.
 *
 * @param {BitStructure} container - initializer for {@link
 * BitField#container|container}.
 *
 * @param {Number} bits - initializer for {@link BitField#bits|bits}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 */ class BitField {
    constructor(container, bits, property){
        if (!(container instanceof BitStructure)) {
            throw new TypeError('container must be a BitStructure');
        }
        if (!Number.isInteger(bits) || 0 >= bits) {
            throw new TypeError('bits must be positive integer');
        }
        const totalBits = 8 * container.span;
        const usedBits = container.fields.reduce((sum, fd)=>sum + fd.bits, 0);
        if (bits + usedBits > totalBits) {
            throw new Error('bits too long for span remainder (' + (totalBits - usedBits) + ' of ' + totalBits + ' remain)');
        }
        /** The {@link BitStructure} instance to which this bit field
         * belongs. */ this.container = container;
        /** The span of this value in bits. */ this.bits = bits;
        /** A mask of {@link BitField#bits|bits} bits isolating value bits
         * that fit within the field.
         *
         * That is, it masks a value that has not yet been shifted into
         * position within its containing packed integer. */ this.valueMask = (1 << bits) - 1;
        if (32 === bits) {
            this.valueMask = 0xFFFFFFFF;
        }
        /** The offset of the value within the containing packed unsigned
         * integer.  The least significant bit of the packed value is at
         * offset zero, regardless of bit ordering used. */ this.start = usedBits;
        if (this.container.msb) {
            this.start = totalBits - usedBits - bits;
        }
        /** A mask of {@link BitField#bits|bits} isolating the field value
         * within the containing packed unsigned integer. */ this.wordMask = fixBitwiseResult(this.valueMask << this.start);
        /** The property name used when this bitfield is represented in an
         * Object.
         *
         * Intended to be functionally equivalent to {@link
         * Layout#property}.
         *
         * If left undefined the corresponding span of bits will be
         * treated as padding: it will not be mutated by {@link
         * Layout#encode|encode} nor represented as a property in the
         * decoded Object. */ this.property = property;
    }
    /** Store a value into the corresponding subsequence of the containing
     * bit field. */ decode(b, offset) {
        const word = this.container._packedGetValue();
        const wordValue = fixBitwiseResult(word & this.wordMask);
        const value = wordValue >>> this.start;
        return value;
    }
    /** Store a value into the corresponding subsequence of the containing
     * bit field.
     *
     * **NOTE** This is not a specialization of {@link
     * Layout#encode|Layout.encode} and there is no return value. */ encode(value) {
        if ('number' !== typeof value || !Number.isInteger(value) || value !== fixBitwiseResult(value & this.valueMask)) {
            throw new TypeError(nameWithProperty('BitField.encode', this) + ' value must be integer not exceeding ' + this.valueMask);
        }
        const word = this.container._packedGetValue();
        const wordValue = fixBitwiseResult(value << this.start);
        this.container._packedSetValue(fixBitwiseResult(word & ~this.wordMask) | wordValue);
    }
}
exports.BitField = BitField;
/**
 * Represent a single bit within a {@link BitStructure} as a
 * JavaScript boolean.
 *
 * **NOTE** User code should not invoke this constructor directly.
 * Use the container {@link BitStructure#addBoolean|addBoolean} helper
 * method.
 *
 * @param {BitStructure} container - initializer for {@link
 * BitField#container|container}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {BitField}
 */ /* eslint-disable no-extend-native */ class Boolean extends BitField {
    constructor(container, property){
        super(container, 1, property);
    }
    /** Override {@link BitField#decode|decode} for {@link Boolean|Boolean}.
     *
     * @returns {boolean} */ decode(b, offset) {
        return !!super.decode(b, offset);
    }
    /** @override */ encode(value) {
        if ('boolean' === typeof value) {
            // BitField requires integer values
            value = +value;
        }
        super.encode(value);
    }
}
exports.Boolean = Boolean;
/* eslint-enable no-extend-native */ /**
 * Contain a fixed-length block of arbitrary data, represented as a
 * Uint8Array.
 *
 * *Factory*: {@link module:Layout.blob|blob}
 *
 * @param {(Number|ExternalLayout)} length - initializes {@link
 * Blob#length|length}.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Blob extends Layout {
    constructor(length, property){
        if (!(length instanceof ExternalLayout && length.isCount() || Number.isInteger(length) && 0 <= length)) {
            throw new TypeError('length must be positive integer ' + 'or an unsigned integer ExternalLayout');
        }
        let span = -1;
        if (!(length instanceof ExternalLayout)) {
            span = length;
        }
        super(span, property);
        /** The number of bytes in the blob.
         *
         * This may be a non-negative integer, or an instance of {@link
         * ExternalLayout} that satisfies {@link
         * ExternalLayout#isCount|isCount()}. */ this.length = length;
    }
    /** @override */ getSpan(b, offset) {
        let span = this.span;
        if (0 > span) {
            span = this.length.decode(b, offset);
        }
        return span;
    }
    /** @override */ decode(b, offset = 0) {
        let span = this.span;
        if (0 > span) {
            span = this.length.decode(b, offset);
        }
        return uint8ArrayToBuffer(b).slice(offset, offset + span);
    }
    /** Implement {@link Layout#encode|encode} for {@link Blob}.
     *
     * **NOTE** If {@link Layout#count|count} is an instance of {@link
     * ExternalLayout} then the length of `src` will be encoded as the
     * count after `src` is encoded. */ encode(src, b, offset) {
        let span = this.length;
        if (this.length instanceof ExternalLayout) {
            span = src.length;
        }
        if (!(src instanceof Uint8Array && span === src.length)) {
            throw new TypeError(nameWithProperty('Blob.encode', this) + ' requires (length ' + span + ') Uint8Array as src');
        }
        if (offset + span > b.length) {
            throw new RangeError('encoding overruns Uint8Array');
        }
        const srcBuffer = uint8ArrayToBuffer(src);
        uint8ArrayToBuffer(b).write(srcBuffer.toString('hex'), offset, span, 'hex');
        if (this.length instanceof ExternalLayout) {
            this.length.encode(span, b, offset);
        }
        return span;
    }
}
exports.Blob = Blob;
/**
 * Contain a `NUL`-terminated UTF8 string.
 *
 * *Factory*: {@link module:Layout.cstr|cstr}
 *
 * **NOTE** Any UTF8 string that incorporates a zero-valued byte will
 * not be correctly decoded by this layout.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class CString extends Layout {
    constructor(property){
        super(-1, property);
    }
    /** @override */ getSpan(b, offset = 0) {
        checkUint8Array(b);
        let idx = offset;
        while(idx < b.length && 0 !== b[idx]){
            idx += 1;
        }
        return 1 + idx - offset;
    }
    /** @override */ decode(b, offset = 0) {
        const span = this.getSpan(b, offset);
        return uint8ArrayToBuffer(b).slice(offset, offset + span - 1).toString('utf-8');
    }
    /** @override */ encode(src, b, offset = 0) {
        /* Must force this to a string, lest it be a number and the
         * "utf8-encoding" below actually allocate a buffer of length
         * src */ if ('string' !== typeof src) {
            src = String(src);
        }
        const srcb = buffer_1.Buffer.from(src, 'utf8');
        const span = srcb.length;
        if (offset + span > b.length) {
            throw new RangeError('encoding overruns Buffer');
        }
        const buffer = uint8ArrayToBuffer(b);
        srcb.copy(buffer, offset);
        buffer[offset + span] = 0;
        return span + 1;
    }
}
exports.CString = CString;
/**
 * Contain a UTF8 string with implicit length.
 *
 * *Factory*: {@link module:Layout.utf8|utf8}
 *
 * **NOTE** Because the length is implicit in the size of the buffer
 * this layout should be used only in isolation, or in a situation
 * where the length can be expressed by operating on a slice of the
 * containing buffer.
 *
 * @param {Number} [maxSpan] - the maximum length allowed for encoded
 * string content.  If not provided there is no bound on the allowed
 * content.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class UTF8 extends Layout {
    constructor(maxSpan, property){
        if ('string' === typeof maxSpan && undefined === property) {
            property = maxSpan;
            maxSpan = undefined;
        }
        if (undefined === maxSpan) {
            maxSpan = -1;
        } else if (!Number.isInteger(maxSpan)) {
            throw new TypeError('maxSpan must be an integer');
        }
        super(-1, property);
        /** The maximum span of the layout in bytes.
         *
         * Positive values are generally expected.  Zero is abnormal.
         * Attempts to encode or decode a value that exceeds this length
         * will throw a `RangeError`.
         *
         * A negative value indicates that there is no bound on the length
         * of the content. */ this.maxSpan = maxSpan;
    }
    /** @override */ getSpan(b, offset = 0) {
        checkUint8Array(b);
        return b.length - offset;
    }
    /** @override */ decode(b, offset = 0) {
        const span = this.getSpan(b, offset);
        if (0 <= this.maxSpan && this.maxSpan < span) {
            throw new RangeError('text length exceeds maxSpan');
        }
        return uint8ArrayToBuffer(b).slice(offset, offset + span).toString('utf-8');
    }
    /** @override */ encode(src, b, offset = 0) {
        /* Must force this to a string, lest it be a number and the
         * "utf8-encoding" below actually allocate a buffer of length
         * src */ if ('string' !== typeof src) {
            src = String(src);
        }
        const srcb = buffer_1.Buffer.from(src, 'utf8');
        const span = srcb.length;
        if (0 <= this.maxSpan && this.maxSpan < span) {
            throw new RangeError('text length exceeds maxSpan');
        }
        if (offset + span > b.length) {
            throw new RangeError('encoding overruns Buffer');
        }
        srcb.copy(uint8ArrayToBuffer(b), offset);
        return span;
    }
}
exports.UTF8 = UTF8;
/**
 * Contain a constant value.
 *
 * This layout may be used in cases where a JavaScript value can be
 * inferred without an expression in the binary encoding.  An example
 * would be a {@link VariantLayout|variant layout} where the content
 * is implied by the union {@link Union#discriminator|discriminator}.
 *
 * @param {Object|Number|String} value - initializer for {@link
 * Constant#value|value}.  If the value is an object (or array) and
 * the application intends the object to remain unchanged regardless
 * of what is done to values decoded by this layout, the value should
 * be frozen prior passing it to this constructor.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */ class Constant extends Layout {
    constructor(value, property){
        super(0, property);
        /** The value produced by this constant when the layout is {@link
         * Constant#decode|decoded}.
         *
         * Any JavaScript value including `null` and `undefined` is
         * permitted.
         *
         * **WARNING** If `value` passed in the constructor was not
         * frozen, it is possible for users of decoded values to change
         * the content of the value. */ this.value = value;
    }
    /** @override */ decode(b, offset) {
        return this.value;
    }
    /** @override */ encode(src, b, offset) {
        /* Constants take no space */ return 0;
    }
}
exports.Constant = Constant;
/** Factory for {@link GreedyCount}. */ exports.greedy = (elementSpan, property)=>new GreedyCount(elementSpan, property);
/** Factory for {@link OffsetLayout}. */ exports.offset = (layout, offset, property)=>new OffsetLayout(layout, offset, property);
/** Factory for {@link UInt|unsigned int layouts} spanning one
 * byte. */ exports.u8 = (property)=>new UInt(1, property);
/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning two bytes. */ exports.u16 = (property)=>new UInt(2, property);
/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning three bytes. */ exports.u24 = (property)=>new UInt(3, property);
/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning four bytes. */ exports.u32 = (property)=>new UInt(4, property);
/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning five bytes. */ exports.u40 = (property)=>new UInt(5, property);
/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning six bytes. */ exports.u48 = (property)=>new UInt(6, property);
/** Factory for {@link NearUInt64|little-endian unsigned int
 * layouts} interpreted as Numbers. */ exports.nu64 = (property)=>new NearUInt64(property);
/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning two bytes. */ exports.u16be = (property)=>new UIntBE(2, property);
/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning three bytes. */ exports.u24be = (property)=>new UIntBE(3, property);
/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning four bytes. */ exports.u32be = (property)=>new UIntBE(4, property);
/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning five bytes. */ exports.u40be = (property)=>new UIntBE(5, property);
/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning six bytes. */ exports.u48be = (property)=>new UIntBE(6, property);
/** Factory for {@link NearUInt64BE|big-endian unsigned int
 * layouts} interpreted as Numbers. */ exports.nu64be = (property)=>new NearUInt64BE(property);
/** Factory for {@link Int|signed int layouts} spanning one
 * byte. */ exports.s8 = (property)=>new Int(1, property);
/** Factory for {@link Int|little-endian signed int layouts}
 * spanning two bytes. */ exports.s16 = (property)=>new Int(2, property);
/** Factory for {@link Int|little-endian signed int layouts}
 * spanning three bytes. */ exports.s24 = (property)=>new Int(3, property);
/** Factory for {@link Int|little-endian signed int layouts}
 * spanning four bytes. */ exports.s32 = (property)=>new Int(4, property);
/** Factory for {@link Int|little-endian signed int layouts}
 * spanning five bytes. */ exports.s40 = (property)=>new Int(5, property);
/** Factory for {@link Int|little-endian signed int layouts}
 * spanning six bytes. */ exports.s48 = (property)=>new Int(6, property);
/** Factory for {@link NearInt64|little-endian signed int layouts}
 * interpreted as Numbers. */ exports.ns64 = (property)=>new NearInt64(property);
/** Factory for {@link Int|big-endian signed int layouts}
 * spanning two bytes. */ exports.s16be = (property)=>new IntBE(2, property);
/** Factory for {@link Int|big-endian signed int layouts}
 * spanning three bytes. */ exports.s24be = (property)=>new IntBE(3, property);
/** Factory for {@link Int|big-endian signed int layouts}
 * spanning four bytes. */ exports.s32be = (property)=>new IntBE(4, property);
/** Factory for {@link Int|big-endian signed int layouts}
 * spanning five bytes. */ exports.s40be = (property)=>new IntBE(5, property);
/** Factory for {@link Int|big-endian signed int layouts}
 * spanning six bytes. */ exports.s48be = (property)=>new IntBE(6, property);
/** Factory for {@link NearInt64BE|big-endian signed int layouts}
 * interpreted as Numbers. */ exports.ns64be = (property)=>new NearInt64BE(property);
/** Factory for {@link Float|little-endian 32-bit floating point} values. */ exports.f32 = (property)=>new Float(property);
/** Factory for {@link FloatBE|big-endian 32-bit floating point} values. */ exports.f32be = (property)=>new FloatBE(property);
/** Factory for {@link Double|little-endian 64-bit floating point} values. */ exports.f64 = (property)=>new Double(property);
/** Factory for {@link DoubleBE|big-endian 64-bit floating point} values. */ exports.f64be = (property)=>new DoubleBE(property);
/** Factory for {@link Structure} values. */ exports.struct = (fields, property, decodePrefixes)=>new Structure(fields, property, decodePrefixes);
/** Factory for {@link BitStructure} values. */ exports.bits = (word, msb, property)=>new BitStructure(word, msb, property);
/** Factory for {@link Sequence} values. */ exports.seq = (elementLayout, count, property)=>new Sequence(elementLayout, count, property);
/** Factory for {@link Union} values. */ exports.union = (discr, defaultLayout, property)=>new Union(discr, defaultLayout, property);
/** Factory for {@link UnionLayoutDiscriminator} values. */ exports.unionLayoutDiscriminator = (layout, property)=>new UnionLayoutDiscriminator(layout, property);
/** Factory for {@link Blob} values. */ exports.blob = (length, property)=>new Blob(length, property);
/** Factory for {@link CString} values. */ exports.cstr = (property)=>new CString(property);
/** Factory for {@link UTF8} values. */ exports.utf8 = (maxSpan, property)=>new UTF8(maxSpan, property);
/** Factory for {@link Constant} values. */ exports.constant = (value, property)=>new Constant(value, property); //# sourceMappingURL=Layout.js.map
}),
"[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCodecSentinel",
    ()=>addCodecSentinel,
    "addCodecSizePrefix",
    ()=>addCodecSizePrefix,
    "addDecoderSentinel",
    ()=>addDecoderSentinel,
    "addDecoderSizePrefix",
    ()=>addDecoderSizePrefix,
    "addEncoderSentinel",
    ()=>addEncoderSentinel,
    "addEncoderSizePrefix",
    ()=>addEncoderSizePrefix,
    "assertByteArrayHasEnoughBytesForCodec",
    ()=>assertByteArrayHasEnoughBytesForCodec,
    "assertByteArrayIsNotEmptyForCodec",
    ()=>assertByteArrayIsNotEmptyForCodec,
    "assertByteArrayOffsetIsNotOutOfRange",
    ()=>assertByteArrayOffsetIsNotOutOfRange,
    "assertIsFixedSize",
    ()=>assertIsFixedSize,
    "assertIsVariableSize",
    ()=>assertIsVariableSize,
    "combineCodec",
    ()=>combineCodec,
    "containsBytes",
    ()=>containsBytes,
    "createCodec",
    ()=>createCodec,
    "createDecoder",
    ()=>createDecoder,
    "createEncoder",
    ()=>createEncoder,
    "fixBytes",
    ()=>fixBytes,
    "fixCodecSize",
    ()=>fixCodecSize,
    "fixDecoderSize",
    ()=>fixDecoderSize,
    "fixEncoderSize",
    ()=>fixEncoderSize,
    "getEncodedSize",
    ()=>getEncodedSize,
    "isFixedSize",
    ()=>isFixedSize,
    "isVariableSize",
    ()=>isVariableSize,
    "mergeBytes",
    ()=>mergeBytes,
    "offsetCodec",
    ()=>offsetCodec,
    "offsetDecoder",
    ()=>offsetDecoder,
    "offsetEncoder",
    ()=>offsetEncoder,
    "padBytes",
    ()=>padBytes,
    "padLeftCodec",
    ()=>padLeftCodec,
    "padLeftDecoder",
    ()=>padLeftDecoder,
    "padLeftEncoder",
    ()=>padLeftEncoder,
    "padRightCodec",
    ()=>padRightCodec,
    "padRightDecoder",
    ()=>padRightDecoder,
    "padRightEncoder",
    ()=>padRightEncoder,
    "resizeCodec",
    ()=>resizeCodec,
    "resizeDecoder",
    ()=>resizeDecoder,
    "resizeEncoder",
    ()=>resizeEncoder,
    "reverseCodec",
    ()=>reverseCodec,
    "reverseDecoder",
    ()=>reverseDecoder,
    "reverseEncoder",
    ()=>reverseEncoder,
    "transformCodec",
    ()=>transformCodec,
    "transformDecoder",
    ()=>transformDecoder,
    "transformEncoder",
    ()=>transformEncoder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/@solana/errors/dist/index.browser.mjs [app-client] (ecmascript)");
;
// src/add-codec-sentinel.ts
// src/bytes.ts
var mergeBytes = (byteArrays)=>{
    const nonEmptyByteArrays = byteArrays.filter((arr)=>arr.length);
    if (nonEmptyByteArrays.length === 0) {
        return byteArrays.length ? byteArrays[0] : new Uint8Array();
    }
    if (nonEmptyByteArrays.length === 1) {
        return nonEmptyByteArrays[0];
    }
    const totalLength = nonEmptyByteArrays.reduce((total, arr)=>total + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    nonEmptyByteArrays.forEach((arr)=>{
        result.set(arr, offset);
        offset += arr.length;
    });
    return result;
};
var padBytes = (bytes, length)=>{
    if (bytes.length >= length) return bytes;
    const paddedBytes = new Uint8Array(length).fill(0);
    paddedBytes.set(bytes);
    return paddedBytes;
};
var fixBytes = (bytes, length)=>padBytes(bytes.length <= length ? bytes : bytes.slice(0, length), length);
function containsBytes(data, bytes, offset) {
    const slice = offset === 0 && data.length === bytes.length ? data : data.slice(offset, offset + bytes.length);
    if (slice.length !== bytes.length) return false;
    return bytes.every((b, i)=>b === slice[i]);
}
function getEncodedSize(value, encoder) {
    return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}
function createEncoder(encoder) {
    return Object.freeze({
        ...encoder,
        encode: (value)=>{
            const bytes = new Uint8Array(getEncodedSize(value, encoder));
            encoder.write(value, bytes, 0);
            return bytes;
        }
    });
}
function createDecoder(decoder) {
    return Object.freeze({
        ...decoder,
        decode: (bytes, offset = 0)=>decoder.read(bytes, offset)[0]
    });
}
function createCodec(codec) {
    return Object.freeze({
        ...codec,
        decode: (bytes, offset = 0)=>codec.read(bytes, offset)[0],
        encode: (value)=>{
            const bytes = new Uint8Array(getEncodedSize(value, codec));
            codec.write(value, bytes, 0);
            return bytes;
        }
    });
}
function isFixedSize(codec) {
    return "fixedSize" in codec && typeof codec.fixedSize === "number";
}
function assertIsFixedSize(codec) {
    if (!isFixedSize(codec)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH"]);
    }
}
function isVariableSize(codec) {
    return !isFixedSize(codec);
}
function assertIsVariableSize(codec) {
    if (!isVariableSize(codec)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH"]);
    }
}
function combineCodec(encoder, decoder) {
    if (isFixedSize(encoder) !== isFixedSize(decoder)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH"]);
    }
    if (isFixedSize(encoder) && isFixedSize(decoder) && encoder.fixedSize !== decoder.fixedSize) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH"], {
            decoderFixedSize: decoder.fixedSize,
            encoderFixedSize: encoder.fixedSize
        });
    }
    if (!isFixedSize(encoder) && !isFixedSize(decoder) && encoder.maxSize !== decoder.maxSize) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH"], {
            decoderMaxSize: decoder.maxSize,
            encoderMaxSize: encoder.maxSize
        });
    }
    return {
        ...decoder,
        ...encoder,
        decode: decoder.decode,
        encode: encoder.encode,
        read: decoder.read,
        write: encoder.write
    };
}
// src/add-codec-sentinel.ts
function addEncoderSentinel(encoder, sentinel) {
    const write = (value, bytes, offset)=>{
        const encoderBytes = encoder.encode(value);
        if (findSentinelIndex(encoderBytes, sentinel) >= 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL"], {
                encodedBytes: encoderBytes,
                hexEncodedBytes: hexBytes(encoderBytes),
                hexSentinel: hexBytes(sentinel),
                sentinel
            });
        }
        bytes.set(encoderBytes, offset);
        offset += encoderBytes.length;
        bytes.set(sentinel, offset);
        offset += sentinel.length;
        return offset;
    };
    if (isFixedSize(encoder)) {
        return createEncoder({
            ...encoder,
            fixedSize: encoder.fixedSize + sentinel.length,
            write
        });
    }
    return createEncoder({
        ...encoder,
        ...encoder.maxSize != null ? {
            maxSize: encoder.maxSize + sentinel.length
        } : {},
        getSizeFromValue: (value)=>encoder.getSizeFromValue(value) + sentinel.length,
        write
    });
}
function addDecoderSentinel(decoder, sentinel) {
    const read = (bytes, offset)=>{
        const candidateBytes = offset === 0 ? bytes : bytes.slice(offset);
        const sentinelIndex = findSentinelIndex(candidateBytes, sentinel);
        if (sentinelIndex === -1) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES"], {
                decodedBytes: candidateBytes,
                hexDecodedBytes: hexBytes(candidateBytes),
                hexSentinel: hexBytes(sentinel),
                sentinel
            });
        }
        const preSentinelBytes = candidateBytes.slice(0, sentinelIndex);
        return [
            decoder.decode(preSentinelBytes),
            offset + preSentinelBytes.length + sentinel.length
        ];
    };
    if (isFixedSize(decoder)) {
        return createDecoder({
            ...decoder,
            fixedSize: decoder.fixedSize + sentinel.length,
            read
        });
    }
    return createDecoder({
        ...decoder,
        ...decoder.maxSize != null ? {
            maxSize: decoder.maxSize + sentinel.length
        } : {},
        read
    });
}
function addCodecSentinel(codec, sentinel) {
    return combineCodec(addEncoderSentinel(codec, sentinel), addDecoderSentinel(codec, sentinel));
}
function findSentinelIndex(bytes, sentinel) {
    return bytes.findIndex((byte, index, arr)=>{
        if (sentinel.length === 1) return byte === sentinel[0];
        return containsBytes(arr, sentinel, index);
    });
}
function hexBytes(bytes) {
    return bytes.reduce((str, byte)=>str + byte.toString(16).padStart(2, "0"), "");
}
function assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset = 0) {
    if (bytes.length - offset <= 0) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY"], {
            codecDescription
        });
    }
}
function assertByteArrayHasEnoughBytesForCodec(codecDescription, expected, bytes, offset = 0) {
    const bytesLength = bytes.length - offset;
    if (bytesLength < expected) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH"], {
            bytesLength,
            codecDescription,
            expected
        });
    }
}
function assertByteArrayOffsetIsNotOutOfRange(codecDescription, offset, bytesLength) {
    if (offset < 0 || offset > bytesLength) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE"], {
            bytesLength,
            codecDescription,
            offset
        });
    }
}
// src/add-codec-size-prefix.ts
function addEncoderSizePrefix(encoder, prefix) {
    const write = (value, bytes, offset)=>{
        const encoderBytes = encoder.encode(value);
        offset = prefix.write(encoderBytes.length, bytes, offset);
        bytes.set(encoderBytes, offset);
        return offset + encoderBytes.length;
    };
    if (isFixedSize(prefix) && isFixedSize(encoder)) {
        return createEncoder({
            ...encoder,
            fixedSize: prefix.fixedSize + encoder.fixedSize,
            write
        });
    }
    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : prefix.maxSize ?? null;
    const encoderMaxSize = isFixedSize(encoder) ? encoder.fixedSize : encoder.maxSize ?? null;
    const maxSize = prefixMaxSize !== null && encoderMaxSize !== null ? prefixMaxSize + encoderMaxSize : null;
    return createEncoder({
        ...encoder,
        ...maxSize !== null ? {
            maxSize
        } : {},
        getSizeFromValue: (value)=>{
            const encoderSize = getEncodedSize(value, encoder);
            return getEncodedSize(encoderSize, prefix) + encoderSize;
        },
        write
    });
}
function addDecoderSizePrefix(decoder, prefix) {
    const read = (bytes, offset)=>{
        const [bigintSize, decoderOffset] = prefix.read(bytes, offset);
        const size = Number(bigintSize);
        offset = decoderOffset;
        if (offset > 0 || bytes.length > size) {
            bytes = bytes.slice(offset, offset + size);
        }
        assertByteArrayHasEnoughBytesForCodec("addDecoderSizePrefix", size, bytes);
        return [
            decoder.decode(bytes),
            offset + size
        ];
    };
    if (isFixedSize(prefix) && isFixedSize(decoder)) {
        return createDecoder({
            ...decoder,
            fixedSize: prefix.fixedSize + decoder.fixedSize,
            read
        });
    }
    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : prefix.maxSize ?? null;
    const decoderMaxSize = isFixedSize(decoder) ? decoder.fixedSize : decoder.maxSize ?? null;
    const maxSize = prefixMaxSize !== null && decoderMaxSize !== null ? prefixMaxSize + decoderMaxSize : null;
    return createDecoder({
        ...decoder,
        ...maxSize !== null ? {
            maxSize
        } : {},
        read
    });
}
function addCodecSizePrefix(codec, prefix) {
    return combineCodec(addEncoderSizePrefix(codec, prefix), addDecoderSizePrefix(codec, prefix));
}
// src/fix-codec-size.ts
function fixEncoderSize(encoder, fixedBytes) {
    return createEncoder({
        fixedSize: fixedBytes,
        write: (value, bytes, offset)=>{
            const variableByteArray = encoder.encode(value);
            const fixedByteArray = variableByteArray.length > fixedBytes ? variableByteArray.slice(0, fixedBytes) : variableByteArray;
            bytes.set(fixedByteArray, offset);
            return offset + fixedBytes;
        }
    });
}
function fixDecoderSize(decoder, fixedBytes) {
    return createDecoder({
        fixedSize: fixedBytes,
        read: (bytes, offset)=>{
            assertByteArrayHasEnoughBytesForCodec("fixCodecSize", fixedBytes, bytes, offset);
            if (offset > 0 || bytes.length > fixedBytes) {
                bytes = bytes.slice(offset, offset + fixedBytes);
            }
            if (isFixedSize(decoder)) {
                bytes = fixBytes(bytes, decoder.fixedSize);
            }
            const [value] = decoder.read(bytes, 0);
            return [
                value,
                offset + fixedBytes
            ];
        }
    });
}
function fixCodecSize(codec, fixedBytes) {
    return combineCodec(fixEncoderSize(codec, fixedBytes), fixDecoderSize(codec, fixedBytes));
}
// src/offset-codec.ts
function offsetEncoder(encoder, config) {
    return createEncoder({
        ...encoder,
        write: (value, bytes, preOffset)=>{
            const wrapBytes = (offset)=>modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({
                bytes,
                preOffset,
                wrapBytes
            }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetEncoder", newPreOffset, bytes.length);
            const postOffset = encoder.write(value, bytes, newPreOffset);
            const newPostOffset = config.postOffset ? config.postOffset({
                bytes,
                newPreOffset,
                postOffset,
                preOffset,
                wrapBytes
            }) : postOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetEncoder", newPostOffset, bytes.length);
            return newPostOffset;
        }
    });
}
function offsetDecoder(decoder, config) {
    return createDecoder({
        ...decoder,
        read: (bytes, preOffset)=>{
            const wrapBytes = (offset)=>modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({
                bytes,
                preOffset,
                wrapBytes
            }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetDecoder", newPreOffset, bytes.length);
            const [value, postOffset] = decoder.read(bytes, newPreOffset);
            const newPostOffset = config.postOffset ? config.postOffset({
                bytes,
                newPreOffset,
                postOffset,
                preOffset,
                wrapBytes
            }) : postOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetDecoder", newPostOffset, bytes.length);
            return [
                value,
                newPostOffset
            ];
        }
    });
}
function offsetCodec(codec, config) {
    return combineCodec(offsetEncoder(codec, config), offsetDecoder(codec, config));
}
function modulo(dividend, divisor) {
    if (divisor === 0) return 0;
    return (dividend % divisor + divisor) % divisor;
}
function resizeEncoder(encoder, resize) {
    if (isFixedSize(encoder)) {
        const fixedSize = resize(encoder.fixedSize);
        if (fixedSize < 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                bytesLength: fixedSize,
                codecDescription: "resizeEncoder"
            });
        }
        return createEncoder({
            ...encoder,
            fixedSize
        });
    }
    return createEncoder({
        ...encoder,
        getSizeFromValue: (value)=>{
            const newSize = resize(encoder.getSizeFromValue(value));
            if (newSize < 0) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                    bytesLength: newSize,
                    codecDescription: "resizeEncoder"
                });
            }
            return newSize;
        }
    });
}
function resizeDecoder(decoder, resize) {
    if (isFixedSize(decoder)) {
        const fixedSize = resize(decoder.fixedSize);
        if (fixedSize < 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                bytesLength: fixedSize,
                codecDescription: "resizeDecoder"
            });
        }
        return createDecoder({
            ...decoder,
            fixedSize
        });
    }
    return decoder;
}
function resizeCodec(codec, resize) {
    return combineCodec(resizeEncoder(codec, resize), resizeDecoder(codec, resize));
}
// src/pad-codec.ts
function padLeftEncoder(encoder, offset) {
    return offsetEncoder(resizeEncoder(encoder, (size)=>size + offset), {
        preOffset: ({ preOffset })=>preOffset + offset
    });
}
function padRightEncoder(encoder, offset) {
    return offsetEncoder(resizeEncoder(encoder, (size)=>size + offset), {
        postOffset: ({ postOffset })=>postOffset + offset
    });
}
function padLeftDecoder(decoder, offset) {
    return offsetDecoder(resizeDecoder(decoder, (size)=>size + offset), {
        preOffset: ({ preOffset })=>preOffset + offset
    });
}
function padRightDecoder(decoder, offset) {
    return offsetDecoder(resizeDecoder(decoder, (size)=>size + offset), {
        postOffset: ({ postOffset })=>postOffset + offset
    });
}
function padLeftCodec(codec, offset) {
    return combineCodec(padLeftEncoder(codec, offset), padLeftDecoder(codec, offset));
}
function padRightCodec(codec, offset) {
    return combineCodec(padRightEncoder(codec, offset), padRightDecoder(codec, offset));
}
// src/reverse-codec.ts
function copySourceToTargetInReverse(source, target_WILL_MUTATE, sourceOffset, sourceLength, targetOffset = 0) {
    while(sourceOffset < --sourceLength){
        const leftValue = source[sourceOffset];
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceLength];
        target_WILL_MUTATE[sourceLength + targetOffset] = leftValue;
        sourceOffset++;
    }
    if (sourceOffset === sourceLength) {
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceOffset];
    }
}
function reverseEncoder(encoder) {
    assertIsFixedSize(encoder);
    return createEncoder({
        ...encoder,
        write: (value, bytes, offset)=>{
            const newOffset = encoder.write(value, bytes, offset);
            copySourceToTargetInReverse(bytes, bytes, offset, offset + encoder.fixedSize);
            return newOffset;
        }
    });
}
function reverseDecoder(decoder) {
    assertIsFixedSize(decoder);
    return createDecoder({
        ...decoder,
        read: (bytes, offset)=>{
            const reversedBytes = bytes.slice();
            copySourceToTargetInReverse(bytes, reversedBytes, offset, offset + decoder.fixedSize);
            return decoder.read(reversedBytes, offset);
        }
    });
}
function reverseCodec(codec) {
    return combineCodec(reverseEncoder(codec), reverseDecoder(codec));
}
// src/transform-codec.ts
function transformEncoder(encoder, unmap) {
    return createEncoder({
        ...isVariableSize(encoder) ? {
            ...encoder,
            getSizeFromValue: (value)=>encoder.getSizeFromValue(unmap(value))
        } : encoder,
        write: (value, bytes, offset)=>encoder.write(unmap(value), bytes, offset)
    });
}
function transformDecoder(decoder, map) {
    return createDecoder({
        ...decoder,
        read: (bytes, offset)=>{
            const [value, newOffset] = decoder.read(bytes, offset);
            return [
                map(value, bytes, offset),
                newOffset
            ];
        }
    });
}
function transformCodec(codec, unmap, map) {
    return createCodec({
        ...transformEncoder(codec, unmap),
        read: map ? transformDecoder(codec, map).read : codec.read
    });
}
;
 //# sourceMappingURL=index.browser.mjs.map
 //# sourceMappingURL=index.browser.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCodecSentinel",
    ()=>addCodecSentinel,
    "addCodecSizePrefix",
    ()=>addCodecSizePrefix,
    "addDecoderSentinel",
    ()=>addDecoderSentinel,
    "addDecoderSizePrefix",
    ()=>addDecoderSizePrefix,
    "addEncoderSentinel",
    ()=>addEncoderSentinel,
    "addEncoderSizePrefix",
    ()=>addEncoderSizePrefix,
    "assertByteArrayHasEnoughBytesForCodec",
    ()=>assertByteArrayHasEnoughBytesForCodec,
    "assertByteArrayIsNotEmptyForCodec",
    ()=>assertByteArrayIsNotEmptyForCodec,
    "assertByteArrayOffsetIsNotOutOfRange",
    ()=>assertByteArrayOffsetIsNotOutOfRange,
    "assertIsFixedSize",
    ()=>assertIsFixedSize,
    "assertIsVariableSize",
    ()=>assertIsVariableSize,
    "combineCodec",
    ()=>combineCodec,
    "containsBytes",
    ()=>containsBytes,
    "createCodec",
    ()=>createCodec,
    "createDecoder",
    ()=>createDecoder,
    "createEncoder",
    ()=>createEncoder,
    "fixBytes",
    ()=>fixBytes,
    "fixCodecSize",
    ()=>fixCodecSize,
    "fixDecoderSize",
    ()=>fixDecoderSize,
    "fixEncoderSize",
    ()=>fixEncoderSize,
    "getEncodedSize",
    ()=>getEncodedSize,
    "isFixedSize",
    ()=>isFixedSize,
    "isVariableSize",
    ()=>isVariableSize,
    "mergeBytes",
    ()=>mergeBytes,
    "offsetCodec",
    ()=>offsetCodec,
    "offsetDecoder",
    ()=>offsetDecoder,
    "offsetEncoder",
    ()=>offsetEncoder,
    "padBytes",
    ()=>padBytes,
    "padLeftCodec",
    ()=>padLeftCodec,
    "padLeftDecoder",
    ()=>padLeftDecoder,
    "padLeftEncoder",
    ()=>padLeftEncoder,
    "padRightCodec",
    ()=>padRightCodec,
    "padRightDecoder",
    ()=>padRightDecoder,
    "padRightEncoder",
    ()=>padRightEncoder,
    "resizeCodec",
    ()=>resizeCodec,
    "resizeDecoder",
    ()=>resizeDecoder,
    "resizeEncoder",
    ()=>resizeEncoder,
    "reverseCodec",
    ()=>reverseCodec,
    "reverseDecoder",
    ()=>reverseDecoder,
    "reverseEncoder",
    ()=>reverseEncoder,
    "transformCodec",
    ()=>transformCodec,
    "transformDecoder",
    ()=>transformDecoder,
    "transformEncoder",
    ()=>transformEncoder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/errors/dist/index.browser.mjs [app-client] (ecmascript)");
;
// src/add-codec-sentinel.ts
// src/bytes.ts
var mergeBytes = (byteArrays)=>{
    const nonEmptyByteArrays = byteArrays.filter((arr)=>arr.length);
    if (nonEmptyByteArrays.length === 0) {
        return byteArrays.length ? byteArrays[0] : new Uint8Array();
    }
    if (nonEmptyByteArrays.length === 1) {
        return nonEmptyByteArrays[0];
    }
    const totalLength = nonEmptyByteArrays.reduce((total, arr)=>total + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    nonEmptyByteArrays.forEach((arr)=>{
        result.set(arr, offset);
        offset += arr.length;
    });
    return result;
};
var padBytes = (bytes, length)=>{
    if (bytes.length >= length) return bytes;
    const paddedBytes = new Uint8Array(length).fill(0);
    paddedBytes.set(bytes);
    return paddedBytes;
};
var fixBytes = (bytes, length)=>padBytes(bytes.length <= length ? bytes : bytes.slice(0, length), length);
function containsBytes(data, bytes, offset) {
    const slice = offset === 0 && data.length === bytes.length ? data : data.slice(offset, offset + bytes.length);
    if (slice.length !== bytes.length) return false;
    return bytes.every((b, i)=>b === slice[i]);
}
function getEncodedSize(value, encoder) {
    return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}
function createEncoder(encoder) {
    return Object.freeze({
        ...encoder,
        encode: (value)=>{
            const bytes = new Uint8Array(getEncodedSize(value, encoder));
            encoder.write(value, bytes, 0);
            return bytes;
        }
    });
}
function createDecoder(decoder) {
    return Object.freeze({
        ...decoder,
        decode: (bytes, offset = 0)=>decoder.read(bytes, offset)[0]
    });
}
function createCodec(codec) {
    return Object.freeze({
        ...codec,
        decode: (bytes, offset = 0)=>codec.read(bytes, offset)[0],
        encode: (value)=>{
            const bytes = new Uint8Array(getEncodedSize(value, codec));
            codec.write(value, bytes, 0);
            return bytes;
        }
    });
}
function isFixedSize(codec) {
    return "fixedSize" in codec && typeof codec.fixedSize === "number";
}
function assertIsFixedSize(codec) {
    if (!isFixedSize(codec)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_FIXED_LENGTH"]);
    }
}
function isVariableSize(codec) {
    return !isFixedSize(codec);
}
function assertIsVariableSize(codec) {
    if (!isVariableSize(codec)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_VARIABLE_LENGTH"]);
    }
}
function combineCodec(encoder, decoder) {
    if (isFixedSize(encoder) !== isFixedSize(decoder)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH"]);
    }
    if (isFixedSize(encoder) && isFixedSize(decoder) && encoder.fixedSize !== decoder.fixedSize) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH"], {
            decoderFixedSize: decoder.fixedSize,
            encoderFixedSize: encoder.fixedSize
        });
    }
    if (!isFixedSize(encoder) && !isFixedSize(decoder) && encoder.maxSize !== decoder.maxSize) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH"], {
            decoderMaxSize: decoder.maxSize,
            encoderMaxSize: encoder.maxSize
        });
    }
    return {
        ...decoder,
        ...encoder,
        decode: decoder.decode,
        encode: encoder.encode,
        read: decoder.read,
        write: encoder.write
    };
}
// src/add-codec-sentinel.ts
function addEncoderSentinel(encoder, sentinel) {
    const write = (value, bytes, offset)=>{
        const encoderBytes = encoder.encode(value);
        if (findSentinelIndex(encoderBytes, sentinel) >= 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENCODED_BYTES_MUST_NOT_INCLUDE_SENTINEL"], {
                encodedBytes: encoderBytes,
                hexEncodedBytes: hexBytes(encoderBytes),
                hexSentinel: hexBytes(sentinel),
                sentinel
            });
        }
        bytes.set(encoderBytes, offset);
        offset += encoderBytes.length;
        bytes.set(sentinel, offset);
        offset += sentinel.length;
        return offset;
    };
    if (isFixedSize(encoder)) {
        return createEncoder({
            ...encoder,
            fixedSize: encoder.fixedSize + sentinel.length,
            write
        });
    }
    return createEncoder({
        ...encoder,
        ...encoder.maxSize != null ? {
            maxSize: encoder.maxSize + sentinel.length
        } : {},
        getSizeFromValue: (value)=>encoder.getSizeFromValue(value) + sentinel.length,
        write
    });
}
function addDecoderSentinel(decoder, sentinel) {
    const read = (bytes, offset)=>{
        const candidateBytes = offset === 0 ? bytes : bytes.slice(offset);
        const sentinelIndex = findSentinelIndex(candidateBytes, sentinel);
        if (sentinelIndex === -1) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__SENTINEL_MISSING_IN_DECODED_BYTES"], {
                decodedBytes: candidateBytes,
                hexDecodedBytes: hexBytes(candidateBytes),
                hexSentinel: hexBytes(sentinel),
                sentinel
            });
        }
        const preSentinelBytes = candidateBytes.slice(0, sentinelIndex);
        return [
            decoder.decode(preSentinelBytes),
            offset + preSentinelBytes.length + sentinel.length
        ];
    };
    if (isFixedSize(decoder)) {
        return createDecoder({
            ...decoder,
            fixedSize: decoder.fixedSize + sentinel.length,
            read
        });
    }
    return createDecoder({
        ...decoder,
        ...decoder.maxSize != null ? {
            maxSize: decoder.maxSize + sentinel.length
        } : {},
        read
    });
}
function addCodecSentinel(codec, sentinel) {
    return combineCodec(addEncoderSentinel(codec, sentinel), addDecoderSentinel(codec, sentinel));
}
function findSentinelIndex(bytes, sentinel) {
    return bytes.findIndex((byte, index, arr)=>{
        if (sentinel.length === 1) return byte === sentinel[0];
        return containsBytes(arr, sentinel, index);
    });
}
function hexBytes(bytes) {
    return bytes.reduce((str, byte)=>str + byte.toString(16).padStart(2, "0"), "");
}
function assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset = 0) {
    if (bytes.length - offset <= 0) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY"], {
            codecDescription
        });
    }
}
function assertByteArrayHasEnoughBytesForCodec(codecDescription, expected, bytes, offset = 0) {
    const bytesLength = bytes.length - offset;
    if (bytesLength < expected) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH"], {
            bytesLength,
            codecDescription,
            expected
        });
    }
}
function assertByteArrayOffsetIsNotOutOfRange(codecDescription, offset, bytesLength) {
    if (offset < 0 || offset > bytesLength) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE"], {
            bytesLength,
            codecDescription,
            offset
        });
    }
}
// src/add-codec-size-prefix.ts
function addEncoderSizePrefix(encoder, prefix) {
    const write = (value, bytes, offset)=>{
        const encoderBytes = encoder.encode(value);
        offset = prefix.write(encoderBytes.length, bytes, offset);
        bytes.set(encoderBytes, offset);
        return offset + encoderBytes.length;
    };
    if (isFixedSize(prefix) && isFixedSize(encoder)) {
        return createEncoder({
            ...encoder,
            fixedSize: prefix.fixedSize + encoder.fixedSize,
            write
        });
    }
    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : prefix.maxSize ?? null;
    const encoderMaxSize = isFixedSize(encoder) ? encoder.fixedSize : encoder.maxSize ?? null;
    const maxSize = prefixMaxSize !== null && encoderMaxSize !== null ? prefixMaxSize + encoderMaxSize : null;
    return createEncoder({
        ...encoder,
        ...maxSize !== null ? {
            maxSize
        } : {},
        getSizeFromValue: (value)=>{
            const encoderSize = getEncodedSize(value, encoder);
            return getEncodedSize(encoderSize, prefix) + encoderSize;
        },
        write
    });
}
function addDecoderSizePrefix(decoder, prefix) {
    const read = (bytes, offset)=>{
        const [bigintSize, decoderOffset] = prefix.read(bytes, offset);
        const size = Number(bigintSize);
        offset = decoderOffset;
        if (offset > 0 || bytes.length > size) {
            bytes = bytes.slice(offset, offset + size);
        }
        assertByteArrayHasEnoughBytesForCodec("addDecoderSizePrefix", size, bytes);
        return [
            decoder.decode(bytes),
            offset + size
        ];
    };
    if (isFixedSize(prefix) && isFixedSize(decoder)) {
        return createDecoder({
            ...decoder,
            fixedSize: prefix.fixedSize + decoder.fixedSize,
            read
        });
    }
    const prefixMaxSize = isFixedSize(prefix) ? prefix.fixedSize : prefix.maxSize ?? null;
    const decoderMaxSize = isFixedSize(decoder) ? decoder.fixedSize : decoder.maxSize ?? null;
    const maxSize = prefixMaxSize !== null && decoderMaxSize !== null ? prefixMaxSize + decoderMaxSize : null;
    return createDecoder({
        ...decoder,
        ...maxSize !== null ? {
            maxSize
        } : {},
        read
    });
}
function addCodecSizePrefix(codec, prefix) {
    return combineCodec(addEncoderSizePrefix(codec, prefix), addDecoderSizePrefix(codec, prefix));
}
// src/fix-codec-size.ts
function fixEncoderSize(encoder, fixedBytes) {
    return createEncoder({
        fixedSize: fixedBytes,
        write: (value, bytes, offset)=>{
            const variableByteArray = encoder.encode(value);
            const fixedByteArray = variableByteArray.length > fixedBytes ? variableByteArray.slice(0, fixedBytes) : variableByteArray;
            bytes.set(fixedByteArray, offset);
            return offset + fixedBytes;
        }
    });
}
function fixDecoderSize(decoder, fixedBytes) {
    return createDecoder({
        fixedSize: fixedBytes,
        read: (bytes, offset)=>{
            assertByteArrayHasEnoughBytesForCodec("fixCodecSize", fixedBytes, bytes, offset);
            if (offset > 0 || bytes.length > fixedBytes) {
                bytes = bytes.slice(offset, offset + fixedBytes);
            }
            if (isFixedSize(decoder)) {
                bytes = fixBytes(bytes, decoder.fixedSize);
            }
            const [value] = decoder.read(bytes, 0);
            return [
                value,
                offset + fixedBytes
            ];
        }
    });
}
function fixCodecSize(codec, fixedBytes) {
    return combineCodec(fixEncoderSize(codec, fixedBytes), fixDecoderSize(codec, fixedBytes));
}
// src/offset-codec.ts
function offsetEncoder(encoder, config) {
    return createEncoder({
        ...encoder,
        write: (value, bytes, preOffset)=>{
            const wrapBytes = (offset)=>modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({
                bytes,
                preOffset,
                wrapBytes
            }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetEncoder", newPreOffset, bytes.length);
            const postOffset = encoder.write(value, bytes, newPreOffset);
            const newPostOffset = config.postOffset ? config.postOffset({
                bytes,
                newPreOffset,
                postOffset,
                preOffset,
                wrapBytes
            }) : postOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetEncoder", newPostOffset, bytes.length);
            return newPostOffset;
        }
    });
}
function offsetDecoder(decoder, config) {
    return createDecoder({
        ...decoder,
        read: (bytes, preOffset)=>{
            const wrapBytes = (offset)=>modulo(offset, bytes.length);
            const newPreOffset = config.preOffset ? config.preOffset({
                bytes,
                preOffset,
                wrapBytes
            }) : preOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetDecoder", newPreOffset, bytes.length);
            const [value, postOffset] = decoder.read(bytes, newPreOffset);
            const newPostOffset = config.postOffset ? config.postOffset({
                bytes,
                newPreOffset,
                postOffset,
                preOffset,
                wrapBytes
            }) : postOffset;
            assertByteArrayOffsetIsNotOutOfRange("offsetDecoder", newPostOffset, bytes.length);
            return [
                value,
                newPostOffset
            ];
        }
    });
}
function offsetCodec(codec, config) {
    return combineCodec(offsetEncoder(codec, config), offsetDecoder(codec, config));
}
function modulo(dividend, divisor) {
    if (divisor === 0) return 0;
    return (dividend % divisor + divisor) % divisor;
}
function resizeEncoder(encoder, resize) {
    if (isFixedSize(encoder)) {
        const fixedSize = resize(encoder.fixedSize);
        if (fixedSize < 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                bytesLength: fixedSize,
                codecDescription: "resizeEncoder"
            });
        }
        return createEncoder({
            ...encoder,
            fixedSize
        });
    }
    return createEncoder({
        ...encoder,
        getSizeFromValue: (value)=>{
            const newSize = resize(encoder.getSizeFromValue(value));
            if (newSize < 0) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                    bytesLength: newSize,
                    codecDescription: "resizeEncoder"
                });
            }
            return newSize;
        }
    });
}
function resizeDecoder(decoder, resize) {
    if (isFixedSize(decoder)) {
        const fixedSize = resize(decoder.fixedSize);
        if (fixedSize < 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__EXPECTED_POSITIVE_BYTE_LENGTH"], {
                bytesLength: fixedSize,
                codecDescription: "resizeDecoder"
            });
        }
        return createDecoder({
            ...decoder,
            fixedSize
        });
    }
    return decoder;
}
function resizeCodec(codec, resize) {
    return combineCodec(resizeEncoder(codec, resize), resizeDecoder(codec, resize));
}
// src/pad-codec.ts
function padLeftEncoder(encoder, offset) {
    return offsetEncoder(resizeEncoder(encoder, (size)=>size + offset), {
        preOffset: ({ preOffset })=>preOffset + offset
    });
}
function padRightEncoder(encoder, offset) {
    return offsetEncoder(resizeEncoder(encoder, (size)=>size + offset), {
        postOffset: ({ postOffset })=>postOffset + offset
    });
}
function padLeftDecoder(decoder, offset) {
    return offsetDecoder(resizeDecoder(decoder, (size)=>size + offset), {
        preOffset: ({ preOffset })=>preOffset + offset
    });
}
function padRightDecoder(decoder, offset) {
    return offsetDecoder(resizeDecoder(decoder, (size)=>size + offset), {
        postOffset: ({ postOffset })=>postOffset + offset
    });
}
function padLeftCodec(codec, offset) {
    return combineCodec(padLeftEncoder(codec, offset), padLeftDecoder(codec, offset));
}
function padRightCodec(codec, offset) {
    return combineCodec(padRightEncoder(codec, offset), padRightDecoder(codec, offset));
}
// src/reverse-codec.ts
function copySourceToTargetInReverse(source, target_WILL_MUTATE, sourceOffset, sourceLength, targetOffset = 0) {
    while(sourceOffset < --sourceLength){
        const leftValue = source[sourceOffset];
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceLength];
        target_WILL_MUTATE[sourceLength + targetOffset] = leftValue;
        sourceOffset++;
    }
    if (sourceOffset === sourceLength) {
        target_WILL_MUTATE[sourceOffset + targetOffset] = source[sourceOffset];
    }
}
function reverseEncoder(encoder) {
    assertIsFixedSize(encoder);
    return createEncoder({
        ...encoder,
        write: (value, bytes, offset)=>{
            const newOffset = encoder.write(value, bytes, offset);
            copySourceToTargetInReverse(bytes, bytes, offset, offset + encoder.fixedSize);
            return newOffset;
        }
    });
}
function reverseDecoder(decoder) {
    assertIsFixedSize(decoder);
    return createDecoder({
        ...decoder,
        read: (bytes, offset)=>{
            const reversedBytes = bytes.slice();
            copySourceToTargetInReverse(bytes, reversedBytes, offset, offset + decoder.fixedSize);
            return decoder.read(reversedBytes, offset);
        }
    });
}
function reverseCodec(codec) {
    return combineCodec(reverseEncoder(codec), reverseDecoder(codec));
}
// src/transform-codec.ts
function transformEncoder(encoder, unmap) {
    return createEncoder({
        ...isVariableSize(encoder) ? {
            ...encoder,
            getSizeFromValue: (value)=>encoder.getSizeFromValue(unmap(value))
        } : encoder,
        write: (value, bytes, offset)=>encoder.write(unmap(value), bytes, offset)
    });
}
function transformDecoder(decoder, map) {
    return createDecoder({
        ...decoder,
        read: (bytes, offset)=>{
            const [value, newOffset] = decoder.read(bytes, offset);
            return [
                map(value, bytes, offset),
                newOffset
            ];
        }
    });
}
function transformCodec(codec, unmap, map) {
    return createCodec({
        ...transformEncoder(codec, unmap),
        read: map ? transformDecoder(codec, map).read : codec.read
    });
}
;
 //# sourceMappingURL=index.browser.mjs.map
 //# sourceMappingURL=index.browser.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/@solana/codecs-numbers/dist/index.browser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Endian",
    ()=>Endian,
    "assertNumberIsBetweenForCodec",
    ()=>assertNumberIsBetweenForCodec,
    "getF32Codec",
    ()=>getF32Codec,
    "getF32Decoder",
    ()=>getF32Decoder,
    "getF32Encoder",
    ()=>getF32Encoder,
    "getF64Codec",
    ()=>getF64Codec,
    "getF64Decoder",
    ()=>getF64Decoder,
    "getF64Encoder",
    ()=>getF64Encoder,
    "getI128Codec",
    ()=>getI128Codec,
    "getI128Decoder",
    ()=>getI128Decoder,
    "getI128Encoder",
    ()=>getI128Encoder,
    "getI16Codec",
    ()=>getI16Codec,
    "getI16Decoder",
    ()=>getI16Decoder,
    "getI16Encoder",
    ()=>getI16Encoder,
    "getI32Codec",
    ()=>getI32Codec,
    "getI32Decoder",
    ()=>getI32Decoder,
    "getI32Encoder",
    ()=>getI32Encoder,
    "getI64Codec",
    ()=>getI64Codec,
    "getI64Decoder",
    ()=>getI64Decoder,
    "getI64Encoder",
    ()=>getI64Encoder,
    "getI8Codec",
    ()=>getI8Codec,
    "getI8Decoder",
    ()=>getI8Decoder,
    "getI8Encoder",
    ()=>getI8Encoder,
    "getShortU16Codec",
    ()=>getShortU16Codec,
    "getShortU16Decoder",
    ()=>getShortU16Decoder,
    "getShortU16Encoder",
    ()=>getShortU16Encoder,
    "getU128Codec",
    ()=>getU128Codec,
    "getU128Decoder",
    ()=>getU128Decoder,
    "getU128Encoder",
    ()=>getU128Encoder,
    "getU16Codec",
    ()=>getU16Codec,
    "getU16Decoder",
    ()=>getU16Decoder,
    "getU16Encoder",
    ()=>getU16Encoder,
    "getU32Codec",
    ()=>getU32Codec,
    "getU32Decoder",
    ()=>getU32Decoder,
    "getU32Encoder",
    ()=>getU32Encoder,
    "getU64Codec",
    ()=>getU64Codec,
    "getU64Decoder",
    ()=>getU64Decoder,
    "getU64Encoder",
    ()=>getU64Encoder,
    "getU8Codec",
    ()=>getU8Codec,
    "getU8Decoder",
    ()=>getU8Decoder,
    "getU8Encoder",
    ()=>getU8Encoder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/@solana/errors/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)");
;
;
// src/assertions.ts
function assertNumberIsBetweenForCodec(codecDescription, min, max, value) {
    if (value < min || value > max) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE"], {
            codecDescription,
            max,
            min,
            value
        });
    }
}
// src/common.ts
var Endian = /* @__PURE__ */ ((Endian2)=>{
    Endian2[Endian2["Little"] = 0] = "Little";
    Endian2[Endian2["Big"] = 1] = "Big";
    return Endian2;
})(Endian || {});
function isLittleEndian(config) {
    return config?.endian === 1 /* Big */  ? false : true;
}
function numberEncoderFactory(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        fixedSize: input.size,
        write (value, bytes, offset) {
            if (input.range) {
                assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
            }
            const arrayBuffer = new ArrayBuffer(input.size);
            input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
            bytes.set(new Uint8Array(arrayBuffer), offset);
            return offset + input.size;
        }
    });
}
function numberDecoderFactory(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        fixedSize: input.size,
        read (bytes, offset = 0) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertByteArrayIsNotEmptyForCodec"])(input.name, bytes, offset);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertByteArrayHasEnoughBytesForCodec"])(input.name, input.size, bytes, offset);
            const view = new DataView(toArrayBuffer(bytes, offset, input.size));
            return [
                input.get(view, isLittleEndian(input.config)),
                offset + input.size
            ];
        }
    });
}
function toArrayBuffer(bytes, offset, length) {
    const bytesOffset = bytes.byteOffset + (offset ?? 0);
    const bytesLength = length ?? bytes.byteLength;
    return bytes.buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
// src/f32.ts
var getF32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "f32",
        set: (view, value, le)=>view.setFloat32(0, Number(value), le),
        size: 4
    });
var getF32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getFloat32(0, le),
        name: "f32",
        size: 4
    });
var getF32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getF32Encoder(config), getF32Decoder(config));
var getF64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "f64",
        set: (view, value, le)=>view.setFloat64(0, Number(value), le),
        size: 8
    });
var getF64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getFloat64(0, le),
        name: "f64",
        size: 8
    });
var getF64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getF64Encoder(config), getF64Decoder(config));
var getI128Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i128",
        range: [
            -BigInt("0x7fffffffffffffffffffffffffffffff") - 1n,
            BigInt("0x7fffffffffffffffffffffffffffffff")
        ],
        set: (view, value, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const rightMask = 0xffffffffffffffffn;
            view.setBigInt64(leftOffset, BigInt(value) >> 64n, le);
            view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
        },
        size: 16
    });
var getI128Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const left = view.getBigInt64(leftOffset, le);
            const right = view.getBigUint64(rightOffset, le);
            return (left << 64n) + right;
        },
        name: "i128",
        size: 16
    });
var getI128Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI128Encoder(config), getI128Decoder(config));
var getI16Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i16",
        range: [
            -Number("0x7fff") - 1,
            Number("0x7fff")
        ],
        set: (view, value, le)=>view.setInt16(0, Number(value), le),
        size: 2
    });
var getI16Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getInt16(0, le),
        name: "i16",
        size: 2
    });
var getI16Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI16Encoder(config), getI16Decoder(config));
var getI32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i32",
        range: [
            -Number("0x7fffffff") - 1,
            Number("0x7fffffff")
        ],
        set: (view, value, le)=>view.setInt32(0, Number(value), le),
        size: 4
    });
var getI32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getInt32(0, le),
        name: "i32",
        size: 4
    });
var getI32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI32Encoder(config), getI32Decoder(config));
var getI64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i64",
        range: [
            -BigInt("0x7fffffffffffffff") - 1n,
            BigInt("0x7fffffffffffffff")
        ],
        set: (view, value, le)=>view.setBigInt64(0, BigInt(value), le),
        size: 8
    });
var getI64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getBigInt64(0, le),
        name: "i64",
        size: 8
    });
var getI64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI64Encoder(config), getI64Decoder(config));
var getI8Encoder = ()=>numberEncoderFactory({
        name: "i8",
        range: [
            -Number("0x7f") - 1,
            Number("0x7f")
        ],
        set: (view, value)=>view.setInt8(0, Number(value)),
        size: 1
    });
var getI8Decoder = ()=>numberDecoderFactory({
        get: (view)=>view.getInt8(0),
        name: "i8",
        size: 1
    });
var getI8Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI8Encoder(), getI8Decoder());
var getShortU16Encoder = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        getSizeFromValue: (value)=>{
            if (value <= 127) return 1;
            if (value <= 16383) return 2;
            return 3;
        },
        maxSize: 3,
        write: (value, bytes, offset)=>{
            assertNumberIsBetweenForCodec("shortU16", 0, 65535, value);
            const shortU16Bytes = [
                0
            ];
            for(let ii = 0;; ii += 1){
                const alignedValue = Number(value) >> ii * 7;
                if (alignedValue === 0) {
                    break;
                }
                const nextSevenBits = 127 & alignedValue;
                shortU16Bytes[ii] = nextSevenBits;
                if (ii > 0) {
                    shortU16Bytes[ii - 1] |= 128;
                }
            }
            bytes.set(shortU16Bytes, offset);
            return offset + shortU16Bytes.length;
        }
    });
var getShortU16Decoder = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        maxSize: 3,
        read: (bytes, offset)=>{
            let value = 0;
            let byteCount = 0;
            while(++byteCount){
                const byteIndex = byteCount - 1;
                const currentByte = bytes[offset + byteIndex];
                const nextSevenBits = 127 & currentByte;
                value |= nextSevenBits << byteIndex * 7;
                if ((currentByte & 128) === 0) {
                    break;
                }
            }
            return [
                value,
                offset + byteCount
            ];
        }
    });
var getShortU16Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getShortU16Encoder(), getShortU16Decoder());
var getU128Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u128",
        range: [
            0n,
            BigInt("0xffffffffffffffffffffffffffffffff")
        ],
        set: (view, value, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const rightMask = 0xffffffffffffffffn;
            view.setBigUint64(leftOffset, BigInt(value) >> 64n, le);
            view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
        },
        size: 16
    });
var getU128Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const left = view.getBigUint64(leftOffset, le);
            const right = view.getBigUint64(rightOffset, le);
            return (left << 64n) + right;
        },
        name: "u128",
        size: 16
    });
var getU128Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU128Encoder(config), getU128Decoder(config));
var getU16Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u16",
        range: [
            0,
            Number("0xffff")
        ],
        set: (view, value, le)=>view.setUint16(0, Number(value), le),
        size: 2
    });
var getU16Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getUint16(0, le),
        name: "u16",
        size: 2
    });
var getU16Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU16Encoder(config), getU16Decoder(config));
var getU32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u32",
        range: [
            0,
            Number("0xffffffff")
        ],
        set: (view, value, le)=>view.setUint32(0, Number(value), le),
        size: 4
    });
var getU32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getUint32(0, le),
        name: "u32",
        size: 4
    });
var getU32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU32Encoder(config), getU32Decoder(config));
var getU64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u64",
        range: [
            0n,
            BigInt("0xffffffffffffffff")
        ],
        set: (view, value, le)=>view.setBigUint64(0, BigInt(value), le),
        size: 8
    });
var getU64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getBigUint64(0, le),
        name: "u64",
        size: 8
    });
var getU64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU64Encoder(config), getU64Decoder(config));
var getU8Encoder = ()=>numberEncoderFactory({
        name: "u8",
        range: [
            0,
            Number("0xff")
        ],
        set: (view, value)=>view.setUint8(0, Number(value)),
        size: 1
    });
var getU8Decoder = ()=>numberDecoderFactory({
        get: (view)=>view.getUint8(0),
        name: "u8",
        size: 1
    });
var getU8Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU8Encoder(), getU8Decoder());
;
 //# sourceMappingURL=index.browser.mjs.map
 //# sourceMappingURL=index.browser.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/codecs-numbers/dist/index.browser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Endian",
    ()=>Endian,
    "assertNumberIsBetweenForCodec",
    ()=>assertNumberIsBetweenForCodec,
    "getF32Codec",
    ()=>getF32Codec,
    "getF32Decoder",
    ()=>getF32Decoder,
    "getF32Encoder",
    ()=>getF32Encoder,
    "getF64Codec",
    ()=>getF64Codec,
    "getF64Decoder",
    ()=>getF64Decoder,
    "getF64Encoder",
    ()=>getF64Encoder,
    "getI128Codec",
    ()=>getI128Codec,
    "getI128Decoder",
    ()=>getI128Decoder,
    "getI128Encoder",
    ()=>getI128Encoder,
    "getI16Codec",
    ()=>getI16Codec,
    "getI16Decoder",
    ()=>getI16Decoder,
    "getI16Encoder",
    ()=>getI16Encoder,
    "getI32Codec",
    ()=>getI32Codec,
    "getI32Decoder",
    ()=>getI32Decoder,
    "getI32Encoder",
    ()=>getI32Encoder,
    "getI64Codec",
    ()=>getI64Codec,
    "getI64Decoder",
    ()=>getI64Decoder,
    "getI64Encoder",
    ()=>getI64Encoder,
    "getI8Codec",
    ()=>getI8Codec,
    "getI8Decoder",
    ()=>getI8Decoder,
    "getI8Encoder",
    ()=>getI8Encoder,
    "getShortU16Codec",
    ()=>getShortU16Codec,
    "getShortU16Decoder",
    ()=>getShortU16Decoder,
    "getShortU16Encoder",
    ()=>getShortU16Encoder,
    "getU128Codec",
    ()=>getU128Codec,
    "getU128Decoder",
    ()=>getU128Decoder,
    "getU128Encoder",
    ()=>getU128Encoder,
    "getU16Codec",
    ()=>getU16Codec,
    "getU16Decoder",
    ()=>getU16Decoder,
    "getU16Encoder",
    ()=>getU16Encoder,
    "getU32Codec",
    ()=>getU32Codec,
    "getU32Decoder",
    ()=>getU32Decoder,
    "getU32Encoder",
    ()=>getU32Encoder,
    "getU64Codec",
    ()=>getU64Codec,
    "getU64Decoder",
    ()=>getU64Decoder,
    "getU64Encoder",
    ()=>getU64Encoder,
    "getU8Codec",
    ()=>getU8Codec,
    "getU8Decoder",
    ()=>getU8Decoder,
    "getU8Encoder",
    ()=>getU8Encoder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/errors/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)");
;
;
// src/assertions.ts
function assertNumberIsBetweenForCodec(codecDescription, min, max, value) {
    if (value < min || value > max) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE"], {
            codecDescription,
            max,
            min,
            value
        });
    }
}
// src/common.ts
var Endian = /* @__PURE__ */ ((Endian2)=>{
    Endian2[Endian2["Little"] = 0] = "Little";
    Endian2[Endian2["Big"] = 1] = "Big";
    return Endian2;
})(Endian || {});
function isLittleEndian(config) {
    return config?.endian === 1 /* Big */  ? false : true;
}
function numberEncoderFactory(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        fixedSize: input.size,
        write (value, bytes, offset) {
            if (input.range) {
                assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
            }
            const arrayBuffer = new ArrayBuffer(input.size);
            input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
            bytes.set(new Uint8Array(arrayBuffer), offset);
            return offset + input.size;
        }
    });
}
function numberDecoderFactory(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        fixedSize: input.size,
        read (bytes, offset = 0) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertByteArrayIsNotEmptyForCodec"])(input.name, bytes, offset);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertByteArrayHasEnoughBytesForCodec"])(input.name, input.size, bytes, offset);
            const view = new DataView(toArrayBuffer(bytes, offset, input.size));
            return [
                input.get(view, isLittleEndian(input.config)),
                offset + input.size
            ];
        }
    });
}
function toArrayBuffer(bytes, offset, length) {
    const bytesOffset = bytes.byteOffset + (offset ?? 0);
    const bytesLength = length ?? bytes.byteLength;
    return bytes.buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
// src/f32.ts
var getF32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "f32",
        set: (view, value, le)=>view.setFloat32(0, Number(value), le),
        size: 4
    });
var getF32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getFloat32(0, le),
        name: "f32",
        size: 4
    });
var getF32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getF32Encoder(config), getF32Decoder(config));
var getF64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "f64",
        set: (view, value, le)=>view.setFloat64(0, Number(value), le),
        size: 8
    });
var getF64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getFloat64(0, le),
        name: "f64",
        size: 8
    });
var getF64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getF64Encoder(config), getF64Decoder(config));
var getI128Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i128",
        range: [
            -BigInt("0x7fffffffffffffffffffffffffffffff") - 1n,
            BigInt("0x7fffffffffffffffffffffffffffffff")
        ],
        set: (view, value, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const rightMask = 0xffffffffffffffffn;
            view.setBigInt64(leftOffset, BigInt(value) >> 64n, le);
            view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
        },
        size: 16
    });
var getI128Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const left = view.getBigInt64(leftOffset, le);
            const right = view.getBigUint64(rightOffset, le);
            return (left << 64n) + right;
        },
        name: "i128",
        size: 16
    });
var getI128Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI128Encoder(config), getI128Decoder(config));
var getI16Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i16",
        range: [
            -Number("0x7fff") - 1,
            Number("0x7fff")
        ],
        set: (view, value, le)=>view.setInt16(0, Number(value), le),
        size: 2
    });
var getI16Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getInt16(0, le),
        name: "i16",
        size: 2
    });
var getI16Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI16Encoder(config), getI16Decoder(config));
var getI32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i32",
        range: [
            -Number("0x7fffffff") - 1,
            Number("0x7fffffff")
        ],
        set: (view, value, le)=>view.setInt32(0, Number(value), le),
        size: 4
    });
var getI32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getInt32(0, le),
        name: "i32",
        size: 4
    });
var getI32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI32Encoder(config), getI32Decoder(config));
var getI64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "i64",
        range: [
            -BigInt("0x7fffffffffffffff") - 1n,
            BigInt("0x7fffffffffffffff")
        ],
        set: (view, value, le)=>view.setBigInt64(0, BigInt(value), le),
        size: 8
    });
var getI64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getBigInt64(0, le),
        name: "i64",
        size: 8
    });
var getI64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI64Encoder(config), getI64Decoder(config));
var getI8Encoder = ()=>numberEncoderFactory({
        name: "i8",
        range: [
            -Number("0x7f") - 1,
            Number("0x7f")
        ],
        set: (view, value)=>view.setInt8(0, Number(value)),
        size: 1
    });
var getI8Decoder = ()=>numberDecoderFactory({
        get: (view)=>view.getInt8(0),
        name: "i8",
        size: 1
    });
var getI8Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getI8Encoder(), getI8Decoder());
var getShortU16Encoder = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        getSizeFromValue: (value)=>{
            if (value <= 127) return 1;
            if (value <= 16383) return 2;
            return 3;
        },
        maxSize: 3,
        write: (value, bytes, offset)=>{
            assertNumberIsBetweenForCodec("shortU16", 0, 65535, value);
            const shortU16Bytes = [
                0
            ];
            for(let ii = 0;; ii += 1){
                const alignedValue = Number(value) >> ii * 7;
                if (alignedValue === 0) {
                    break;
                }
                const nextSevenBits = 127 & alignedValue;
                shortU16Bytes[ii] = nextSevenBits;
                if (ii > 0) {
                    shortU16Bytes[ii - 1] |= 128;
                }
            }
            bytes.set(shortU16Bytes, offset);
            return offset + shortU16Bytes.length;
        }
    });
var getShortU16Decoder = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        maxSize: 3,
        read: (bytes, offset)=>{
            let value = 0;
            let byteCount = 0;
            while(++byteCount){
                const byteIndex = byteCount - 1;
                const currentByte = bytes[offset + byteIndex];
                const nextSevenBits = 127 & currentByte;
                value |= nextSevenBits << byteIndex * 7;
                if ((currentByte & 128) === 0) {
                    break;
                }
            }
            return [
                value,
                offset + byteCount
            ];
        }
    });
var getShortU16Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getShortU16Encoder(), getShortU16Decoder());
var getU128Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u128",
        range: [
            0n,
            BigInt("0xffffffffffffffffffffffffffffffff")
        ],
        set: (view, value, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const rightMask = 0xffffffffffffffffn;
            view.setBigUint64(leftOffset, BigInt(value) >> 64n, le);
            view.setBigUint64(rightOffset, BigInt(value) & rightMask, le);
        },
        size: 16
    });
var getU128Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>{
            const leftOffset = le ? 8 : 0;
            const rightOffset = le ? 0 : 8;
            const left = view.getBigUint64(leftOffset, le);
            const right = view.getBigUint64(rightOffset, le);
            return (left << 64n) + right;
        },
        name: "u128",
        size: 16
    });
var getU128Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU128Encoder(config), getU128Decoder(config));
var getU16Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u16",
        range: [
            0,
            Number("0xffff")
        ],
        set: (view, value, le)=>view.setUint16(0, Number(value), le),
        size: 2
    });
var getU16Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getUint16(0, le),
        name: "u16",
        size: 2
    });
var getU16Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU16Encoder(config), getU16Decoder(config));
var getU32Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u32",
        range: [
            0,
            Number("0xffffffff")
        ],
        set: (view, value, le)=>view.setUint32(0, Number(value), le),
        size: 4
    });
var getU32Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getUint32(0, le),
        name: "u32",
        size: 4
    });
var getU32Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU32Encoder(config), getU32Decoder(config));
var getU64Encoder = (config = {})=>numberEncoderFactory({
        config,
        name: "u64",
        range: [
            0n,
            BigInt("0xffffffffffffffff")
        ],
        set: (view, value, le)=>view.setBigUint64(0, BigInt(value), le),
        size: 8
    });
var getU64Decoder = (config = {})=>numberDecoderFactory({
        config,
        get: (view, le)=>view.getBigUint64(0, le),
        name: "u64",
        size: 8
    });
var getU64Codec = (config = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU64Encoder(config), getU64Decoder(config));
var getU8Encoder = ()=>numberEncoderFactory({
        name: "u8",
        range: [
            0,
            Number("0xff")
        ],
        set: (view, value)=>view.setUint8(0, Number(value)),
        size: 1
    });
var getU8Decoder = ()=>numberDecoderFactory({
        get: (view)=>view.getUint8(0),
        name: "u8",
        size: 1
    });
var getU8Codec = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getU8Encoder(), getU8Decoder());
;
 //# sourceMappingURL=index.browser.mjs.map
 //# sourceMappingURL=index.browser.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/web3.js/node_modules/superstruct/dist/index.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Struct",
    ()=>Struct,
    "StructError",
    ()=>StructError,
    "any",
    ()=>any,
    "array",
    ()=>array,
    "assert",
    ()=>assert,
    "assign",
    ()=>assign,
    "bigint",
    ()=>bigint,
    "boolean",
    ()=>boolean,
    "coerce",
    ()=>coerce,
    "create",
    ()=>create,
    "date",
    ()=>date,
    "defaulted",
    ()=>defaulted,
    "define",
    ()=>define,
    "deprecated",
    ()=>deprecated,
    "dynamic",
    ()=>dynamic,
    "empty",
    ()=>empty,
    "enums",
    ()=>enums,
    "func",
    ()=>func,
    "instance",
    ()=>instance,
    "integer",
    ()=>integer,
    "intersection",
    ()=>intersection,
    "is",
    ()=>is,
    "lazy",
    ()=>lazy,
    "literal",
    ()=>literal,
    "map",
    ()=>map,
    "mask",
    ()=>mask,
    "max",
    ()=>max,
    "min",
    ()=>min,
    "never",
    ()=>never,
    "nonempty",
    ()=>nonempty,
    "nullable",
    ()=>nullable,
    "number",
    ()=>number,
    "object",
    ()=>object,
    "omit",
    ()=>omit,
    "optional",
    ()=>optional,
    "partial",
    ()=>partial,
    "pattern",
    ()=>pattern,
    "pick",
    ()=>pick,
    "record",
    ()=>record,
    "refine",
    ()=>refine,
    "regexp",
    ()=>regexp,
    "set",
    ()=>set,
    "size",
    ()=>size,
    "string",
    ()=>string,
    "struct",
    ()=>struct,
    "trimmed",
    ()=>trimmed,
    "tuple",
    ()=>tuple,
    "type",
    ()=>type,
    "union",
    ()=>union,
    "unknown",
    ()=>unknown,
    "validate",
    ()=>validate
]);
/**
 * A `StructFailure` represents a single specific failure in validation.
 */ /**
 * `StructError` objects are thrown (or returned) when validation fails.
 *
 * Validation logic is design to exit early for maximum performance. The error
 * represents the first error encountered during validation. For more detail,
 * the `error.failures` property is a generator function that can be run to
 * continue validation and receive all the failures in the data.
 */ class StructError extends TypeError {
    constructor(failure, failures){
        let cached;
        const { message, explanation, ...rest } = failure;
        const { path } = failure;
        const msg = path.length === 0 ? message : `At path: ${path.join('.')} -- ${message}`;
        super(explanation ?? msg);
        if (explanation != null) this.cause = msg;
        Object.assign(this, rest);
        this.name = this.constructor.name;
        this.failures = ()=>{
            return cached ?? (cached = [
                failure,
                ...failures()
            ]);
        };
    }
}
/**
 * Check if a value is an iterator.
 */ function isIterable(x) {
    return isObject(x) && typeof x[Symbol.iterator] === 'function';
}
/**
 * Check if a value is a plain object.
 */ function isObject(x) {
    return typeof x === 'object' && x != null;
}
/**
 * Check if a value is a non-array object.
 */ function isNonArrayObject(x) {
    return isObject(x) && !Array.isArray(x);
}
/**
 * Check if a value is a plain object.
 */ function isPlainObject(x) {
    if (Object.prototype.toString.call(x) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(x);
    return prototype === null || prototype === Object.prototype;
}
/**
 * Return a value as a printable string.
 */ function print(value) {
    if (typeof value === 'symbol') {
        return value.toString();
    }
    return typeof value === 'string' ? JSON.stringify(value) : `${value}`;
}
/**
 * Shifts (removes and returns) the first value from the `input` iterator.
 * Like `Array.prototype.shift()` but for an `Iterator`.
 */ function shiftIterator(input) {
    const { done, value } = input.next();
    return done ? undefined : value;
}
/**
 * Convert a single validation result to a failure.
 */ function toFailure(result, context, struct, value) {
    if (result === true) {
        return;
    } else if (result === false) {
        result = {};
    } else if (typeof result === 'string') {
        result = {
            message: result
        };
    }
    const { path, branch } = context;
    const { type } = struct;
    const { refinement, message = `Expected a value of type \`${type}\`${refinement ? ` with refinement \`${refinement}\`` : ''}, but received: \`${print(value)}\`` } = result;
    return {
        value,
        type,
        refinement,
        key: path[path.length - 1],
        path,
        branch,
        ...result,
        message
    };
}
/**
 * Convert a validation result to an iterable of failures.
 */ function* toFailures(result, context, struct, value) {
    if (!isIterable(result)) {
        result = [
            result
        ];
    }
    for (const r of result){
        const failure = toFailure(r, context, struct, value);
        if (failure) {
            yield failure;
        }
    }
}
/**
 * Check a value against a struct, traversing deeply into nested values, and
 * returning an iterator of failures or success.
 */ function* run(value, struct, options = {}) {
    const { path = [], branch = [
        value
    ], coerce = false, mask = false } = options;
    const ctx = {
        path,
        branch,
        mask
    };
    if (coerce) {
        value = struct.coercer(value, ctx);
    }
    let status = 'valid';
    for (const failure of struct.validator(value, ctx)){
        failure.explanation = options.message;
        status = 'not_valid';
        yield [
            failure,
            undefined
        ];
    }
    for (let [k, v, s] of struct.entries(value, ctx)){
        const ts = run(v, s, {
            path: k === undefined ? path : [
                ...path,
                k
            ],
            branch: k === undefined ? branch : [
                ...branch,
                v
            ],
            coerce,
            mask,
            message: options.message
        });
        for (const t of ts){
            if (t[0]) {
                status = t[0].refinement != null ? 'not_refined' : 'not_valid';
                yield [
                    t[0],
                    undefined
                ];
            } else if (coerce) {
                v = t[1];
                if (k === undefined) {
                    value = v;
                } else if (value instanceof Map) {
                    value.set(k, v);
                } else if (value instanceof Set) {
                    value.add(v);
                } else if (isObject(value)) {
                    if (v !== undefined || k in value) value[k] = v;
                }
            }
        }
    }
    if (status !== 'not_valid') {
        for (const failure of struct.refiner(value, ctx)){
            failure.explanation = options.message;
            status = 'not_refined';
            yield [
                failure,
                undefined
            ];
        }
    }
    if (status === 'valid') {
        yield [
            undefined,
            value
        ];
    }
}
/**
 * `Struct` objects encapsulate the validation logic for a specific type of
 * values. Once constructed, you use the `assert`, `is` or `validate` helpers to
 * validate unknown input data against the struct.
 */ class Struct {
    constructor(props){
        const { type, schema, validator, refiner, coercer = (value)=>value, entries = function*() {} } = props;
        this.type = type;
        this.schema = schema;
        this.entries = entries;
        this.coercer = coercer;
        if (validator) {
            this.validator = (value, context)=>{
                const result = validator(value, context);
                return toFailures(result, context, this, value);
            };
        } else {
            this.validator = ()=>[];
        }
        if (refiner) {
            this.refiner = (value, context)=>{
                const result = refiner(value, context);
                return toFailures(result, context, this, value);
            };
        } else {
            this.refiner = ()=>[];
        }
    }
    /**
     * Assert that a value passes the struct's validation, throwing if it doesn't.
     */ assert(value, message) {
        return assert(value, this, message);
    }
    /**
     * Create a value with the struct's coercion logic, then validate it.
     */ create(value, message) {
        return create(value, this, message);
    }
    /**
     * Check if a value passes the struct's validation.
     */ is(value) {
        return is(value, this);
    }
    /**
     * Mask a value, coercing and validating it, but returning only the subset of
     * properties defined by the struct's schema. Masking applies recursively to
     * props of `object` structs only.
     */ mask(value, message) {
        return mask(value, this, message);
    }
    /**
     * Validate a value with the struct's validation logic, returning a tuple
     * representing the result.
     *
     * You may optionally pass `true` for the `coerce` argument to coerce
     * the value before attempting to validate it. If you do, the result will
     * contain the coerced result when successful. Also, `mask` will turn on
     * masking of the unknown `object` props recursively if passed.
     */ validate(value, options = {}) {
        return validate(value, this, options);
    }
}
/**
 * Assert that a value passes a struct, throwing if it doesn't.
 */ function assert(value, struct, message) {
    const result = validate(value, struct, {
        message
    });
    if (result[0]) {
        throw result[0];
    }
}
/**
 * Create a value with the coercion logic of struct and validate it.
 */ function create(value, struct, message) {
    const result = validate(value, struct, {
        coerce: true,
        message
    });
    if (result[0]) {
        throw result[0];
    } else {
        return result[1];
    }
}
/**
 * Mask a value, returning only the subset of properties defined by a struct.
 */ function mask(value, struct, message) {
    const result = validate(value, struct, {
        coerce: true,
        mask: true,
        message
    });
    if (result[0]) {
        throw result[0];
    } else {
        return result[1];
    }
}
/**
 * Check if a value passes a struct.
 */ function is(value, struct) {
    const result = validate(value, struct);
    return !result[0];
}
/**
 * Validate a value against a struct, returning an error if invalid, or the
 * value (with potential coercion) if valid.
 */ function validate(value, struct, options = {}) {
    const tuples = run(value, struct, options);
    const tuple = shiftIterator(tuples);
    if (tuple[0]) {
        const error = new StructError(tuple[0], function*() {
            for (const t of tuples){
                if (t[0]) {
                    yield t[0];
                }
            }
        });
        return [
            error,
            undefined
        ];
    } else {
        const v = tuple[1];
        return [
            undefined,
            v
        ];
    }
}
function assign(...Structs) {
    const isType = Structs[0].type === 'type';
    const schemas = Structs.map((s)=>s.schema);
    const schema = Object.assign({}, ...schemas);
    return isType ? type(schema) : object(schema);
}
/**
 * Define a new struct type with a custom validation function.
 */ function define(name, validator) {
    return new Struct({
        type: name,
        schema: null,
        validator
    });
}
/**
 * Create a new struct based on an existing struct, but the value is allowed to
 * be `undefined`. `log` will be called if the value is not `undefined`.
 */ function deprecated(struct, log) {
    return new Struct({
        ...struct,
        refiner: (value, ctx)=>value === undefined || struct.refiner(value, ctx),
        validator (value, ctx) {
            if (value === undefined) {
                return true;
            } else {
                log(value, ctx);
                return struct.validator(value, ctx);
            }
        }
    });
}
/**
 * Create a struct with dynamic validation logic.
 *
 * The callback will receive the value currently being validated, and must
 * return a struct object to validate it with. This can be useful to model
 * validation logic that changes based on its input.
 */ function dynamic(fn) {
    return new Struct({
        type: 'dynamic',
        schema: null,
        *entries (value, ctx) {
            const struct = fn(value, ctx);
            yield* struct.entries(value, ctx);
        },
        validator (value, ctx) {
            const struct = fn(value, ctx);
            return struct.validator(value, ctx);
        },
        coercer (value, ctx) {
            const struct = fn(value, ctx);
            return struct.coercer(value, ctx);
        },
        refiner (value, ctx) {
            const struct = fn(value, ctx);
            return struct.refiner(value, ctx);
        }
    });
}
/**
 * Create a struct with lazily evaluated validation logic.
 *
 * The first time validation is run with the struct, the callback will be called
 * and must return a struct object to use. This is useful for cases where you
 * want to have self-referential structs for nested data structures to avoid a
 * circular definition problem.
 */ function lazy(fn) {
    let struct;
    return new Struct({
        type: 'lazy',
        schema: null,
        *entries (value, ctx) {
            struct ?? (struct = fn());
            yield* struct.entries(value, ctx);
        },
        validator (value, ctx) {
            struct ?? (struct = fn());
            return struct.validator(value, ctx);
        },
        coercer (value, ctx) {
            struct ?? (struct = fn());
            return struct.coercer(value, ctx);
        },
        refiner (value, ctx) {
            struct ?? (struct = fn());
            return struct.refiner(value, ctx);
        }
    });
}
/**
 * Create a new struct based on an existing object struct, but excluding
 * specific properties.
 *
 * Like TypeScript's `Omit` utility.
 */ function omit(struct, keys) {
    const { schema } = struct;
    const subschema = {
        ...schema
    };
    for (const key of keys){
        delete subschema[key];
    }
    switch(struct.type){
        case 'type':
            return type(subschema);
        default:
            return object(subschema);
    }
}
/**
 * Create a new struct based on an existing object struct, but with all of its
 * properties allowed to be `undefined`.
 *
 * Like TypeScript's `Partial` utility.
 */ function partial(struct) {
    const isStruct = struct instanceof Struct;
    const schema = isStruct ? {
        ...struct.schema
    } : {
        ...struct
    };
    for(const key in schema){
        schema[key] = optional(schema[key]);
    }
    if (isStruct && struct.type === 'type') {
        return type(schema);
    }
    return object(schema);
}
/**
 * Create a new struct based on an existing object struct, but only including
 * specific properties.
 *
 * Like TypeScript's `Pick` utility.
 */ function pick(struct, keys) {
    const { schema } = struct;
    const subschema = {};
    for (const key of keys){
        subschema[key] = schema[key];
    }
    switch(struct.type){
        case 'type':
            return type(subschema);
        default:
            return object(subschema);
    }
}
/**
 * Define a new struct type with a custom validation function.
 *
 * @deprecated This function has been renamed to `define`.
 */ function struct(name, validator) {
    console.warn('superstruct@0.11 - The `struct` helper has been renamed to `define`.');
    return define(name, validator);
}
/**
 * Ensure that any value passes validation.
 */ function any() {
    return define('any', ()=>true);
}
function array(Element) {
    return new Struct({
        type: 'array',
        schema: Element,
        *entries (value) {
            if (Element && Array.isArray(value)) {
                for (const [i, v] of value.entries()){
                    yield [
                        i,
                        v,
                        Element
                    ];
                }
            }
        },
        coercer (value) {
            return Array.isArray(value) ? value.slice() : value;
        },
        validator (value) {
            return Array.isArray(value) || `Expected an array value, but received: ${print(value)}`;
        }
    });
}
/**
 * Ensure that a value is a bigint.
 */ function bigint() {
    return define('bigint', (value)=>{
        return typeof value === 'bigint';
    });
}
/**
 * Ensure that a value is a boolean.
 */ function boolean() {
    return define('boolean', (value)=>{
        return typeof value === 'boolean';
    });
}
/**
 * Ensure that a value is a valid `Date`.
 *
 * Note: this also ensures that the value is *not* an invalid `Date` object,
 * which can occur when parsing a date fails but still returns a `Date`.
 */ function date() {
    return define('date', (value)=>{
        return value instanceof Date && !isNaN(value.getTime()) || `Expected a valid \`Date\` object, but received: ${print(value)}`;
    });
}
function enums(values) {
    const schema = {};
    const description = values.map((v)=>print(v)).join();
    for (const key of values){
        schema[key] = key;
    }
    return new Struct({
        type: 'enums',
        schema,
        validator (value) {
            return values.includes(value) || `Expected one of \`${description}\`, but received: ${print(value)}`;
        }
    });
}
/**
 * Ensure that a value is a function.
 */ function func() {
    return define('func', (value)=>{
        return typeof value === 'function' || `Expected a function, but received: ${print(value)}`;
    });
}
/**
 * Ensure that a value is an instance of a specific class.
 */ function instance(Class) {
    return define('instance', (value)=>{
        return value instanceof Class || `Expected a \`${Class.name}\` instance, but received: ${print(value)}`;
    });
}
/**
 * Ensure that a value is an integer.
 */ function integer() {
    return define('integer', (value)=>{
        return typeof value === 'number' && !isNaN(value) && Number.isInteger(value) || `Expected an integer, but received: ${print(value)}`;
    });
}
/**
 * Ensure that a value matches all of a set of types.
 */ function intersection(Structs) {
    return new Struct({
        type: 'intersection',
        schema: null,
        *entries (value, ctx) {
            for (const S of Structs){
                yield* S.entries(value, ctx);
            }
        },
        *validator (value, ctx) {
            for (const S of Structs){
                yield* S.validator(value, ctx);
            }
        },
        *refiner (value, ctx) {
            for (const S of Structs){
                yield* S.refiner(value, ctx);
            }
        }
    });
}
function literal(constant) {
    const description = print(constant);
    const t = typeof constant;
    return new Struct({
        type: 'literal',
        schema: t === 'string' || t === 'number' || t === 'boolean' ? constant : null,
        validator (value) {
            return value === constant || `Expected the literal \`${description}\`, but received: ${print(value)}`;
        }
    });
}
function map(Key, Value) {
    return new Struct({
        type: 'map',
        schema: null,
        *entries (value) {
            if (Key && Value && value instanceof Map) {
                for (const [k, v] of value.entries()){
                    yield [
                        k,
                        k,
                        Key
                    ];
                    yield [
                        k,
                        v,
                        Value
                    ];
                }
            }
        },
        coercer (value) {
            return value instanceof Map ? new Map(value) : value;
        },
        validator (value) {
            return value instanceof Map || `Expected a \`Map\` object, but received: ${print(value)}`;
        }
    });
}
/**
 * Ensure that no value ever passes validation.
 */ function never() {
    return define('never', ()=>false);
}
/**
 * Augment an existing struct to allow `null` values.
 */ function nullable(struct) {
    return new Struct({
        ...struct,
        validator: (value, ctx)=>value === null || struct.validator(value, ctx),
        refiner: (value, ctx)=>value === null || struct.refiner(value, ctx)
    });
}
/**
 * Ensure that a value is a number.
 */ function number() {
    return define('number', (value)=>{
        return typeof value === 'number' && !isNaN(value) || `Expected a number, but received: ${print(value)}`;
    });
}
function object(schema) {
    const knowns = schema ? Object.keys(schema) : [];
    const Never = never();
    return new Struct({
        type: 'object',
        schema: schema ? schema : null,
        *entries (value) {
            if (schema && isObject(value)) {
                const unknowns = new Set(Object.keys(value));
                for (const key of knowns){
                    unknowns.delete(key);
                    yield [
                        key,
                        value[key],
                        schema[key]
                    ];
                }
                for (const key of unknowns){
                    yield [
                        key,
                        value[key],
                        Never
                    ];
                }
            }
        },
        validator (value) {
            return isNonArrayObject(value) || `Expected an object, but received: ${print(value)}`;
        },
        coercer (value, ctx) {
            if (!isNonArrayObject(value)) {
                return value;
            }
            const coerced = {
                ...value
            };
            // The `object` struct has special behaviour enabled by the mask flag.
            // When masking, properties that are not in the schema are deleted from
            // the coerced object instead of eventually failing validaiton.
            if (ctx.mask && schema) {
                for(const key in coerced){
                    if (schema[key] === undefined) {
                        delete coerced[key];
                    }
                }
            }
            return coerced;
        }
    });
}
/**
 * Augment a struct to allow `undefined` values.
 */ function optional(struct) {
    return new Struct({
        ...struct,
        validator: (value, ctx)=>value === undefined || struct.validator(value, ctx),
        refiner: (value, ctx)=>value === undefined || struct.refiner(value, ctx)
    });
}
/**
 * Ensure that a value is an object with keys and values of specific types, but
 * without ensuring any specific shape of properties.
 *
 * Like TypeScript's `Record` utility.
 */ function record(Key, Value) {
    return new Struct({
        type: 'record',
        schema: null,
        *entries (value) {
            if (isObject(value)) {
                for(const k in value){
                    const v = value[k];
                    yield [
                        k,
                        k,
                        Key
                    ];
                    yield [
                        k,
                        v,
                        Value
                    ];
                }
            }
        },
        validator (value) {
            return isNonArrayObject(value) || `Expected an object, but received: ${print(value)}`;
        },
        coercer (value) {
            return isNonArrayObject(value) ? {
                ...value
            } : value;
        }
    });
}
/**
 * Ensure that a value is a `RegExp`.
 *
 * Note: this does not test the value against the regular expression! For that
 * you need to use the `pattern()` refinement.
 */ function regexp() {
    return define('regexp', (value)=>{
        return value instanceof RegExp;
    });
}
function set(Element) {
    return new Struct({
        type: 'set',
        schema: null,
        *entries (value) {
            if (Element && value instanceof Set) {
                for (const v of value){
                    yield [
                        v,
                        v,
                        Element
                    ];
                }
            }
        },
        coercer (value) {
            return value instanceof Set ? new Set(value) : value;
        },
        validator (value) {
            return value instanceof Set || `Expected a \`Set\` object, but received: ${print(value)}`;
        }
    });
}
/**
 * Ensure that a value is a string.
 */ function string() {
    return define('string', (value)=>{
        return typeof value === 'string' || `Expected a string, but received: ${print(value)}`;
    });
}
/**
 * Ensure that a value is a tuple of a specific length, and that each of its
 * elements is of a specific type.
 */ function tuple(Structs) {
    const Never = never();
    return new Struct({
        type: 'tuple',
        schema: null,
        *entries (value) {
            if (Array.isArray(value)) {
                const length = Math.max(Structs.length, value.length);
                for(let i = 0; i < length; i++){
                    yield [
                        i,
                        value[i],
                        Structs[i] || Never
                    ];
                }
            }
        },
        validator (value) {
            return Array.isArray(value) || `Expected an array, but received: ${print(value)}`;
        },
        coercer (value) {
            return Array.isArray(value) ? value.slice() : value;
        }
    });
}
/**
 * Ensure that a value has a set of known properties of specific types.
 *
 * Note: Unrecognized properties are allowed and untouched. This is similar to
 * how TypeScript's structural typing works.
 */ function type(schema) {
    const keys = Object.keys(schema);
    return new Struct({
        type: 'type',
        schema,
        *entries (value) {
            if (isObject(value)) {
                for (const k of keys){
                    yield [
                        k,
                        value[k],
                        schema[k]
                    ];
                }
            }
        },
        validator (value) {
            return isNonArrayObject(value) || `Expected an object, but received: ${print(value)}`;
        },
        coercer (value) {
            return isNonArrayObject(value) ? {
                ...value
            } : value;
        }
    });
}
/**
 * Ensure that a value matches one of a set of types.
 */ function union(Structs) {
    const description = Structs.map((s)=>s.type).join(' | ');
    return new Struct({
        type: 'union',
        schema: null,
        coercer (value, ctx) {
            for (const S of Structs){
                const [error, coerced] = S.validate(value, {
                    coerce: true,
                    mask: ctx.mask
                });
                if (!error) {
                    return coerced;
                }
            }
            return value;
        },
        validator (value, ctx) {
            const failures = [];
            for (const S of Structs){
                const [...tuples] = run(value, S, ctx);
                const [first] = tuples;
                if (!first[0]) {
                    return [];
                } else {
                    for (const [failure] of tuples){
                        if (failure) {
                            failures.push(failure);
                        }
                    }
                }
            }
            return [
                `Expected the value to satisfy a union of \`${description}\`, but received: ${print(value)}`,
                ...failures
            ];
        }
    });
}
/**
 * Ensure that any value passes validation, without widening its type to `any`.
 */ function unknown() {
    return define('unknown', ()=>true);
}
/**
 * Augment a `Struct` to add an additional coercion step to its input.
 *
 * This allows you to transform input data before validating it, to increase the
 * likelihood that it passes validation—for example for default values, parsing
 * different formats, etc.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */ function coerce(struct, condition, coercer) {
    return new Struct({
        ...struct,
        coercer: (value, ctx)=>{
            return is(value, condition) ? struct.coercer(coercer(value, ctx), ctx) : struct.coercer(value, ctx);
        }
    });
}
/**
 * Augment a struct to replace `undefined` values with a default.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */ function defaulted(struct, fallback, options = {}) {
    return coerce(struct, unknown(), (x)=>{
        const f = typeof fallback === 'function' ? fallback() : fallback;
        if (x === undefined) {
            return f;
        }
        if (!options.strict && isPlainObject(x) && isPlainObject(f)) {
            const ret = {
                ...x
            };
            let changed = false;
            for(const key in f){
                if (ret[key] === undefined) {
                    ret[key] = f[key];
                    changed = true;
                }
            }
            if (changed) {
                return ret;
            }
        }
        return x;
    });
}
/**
 * Augment a struct to trim string inputs.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */ function trimmed(struct) {
    return coerce(struct, string(), (x)=>x.trim());
}
/**
 * Ensure that a string, array, map, or set is empty.
 */ function empty(struct) {
    return refine(struct, 'empty', (value)=>{
        const size = getSize(value);
        return size === 0 || `Expected an empty ${struct.type} but received one with a size of \`${size}\``;
    });
}
function getSize(value) {
    if (value instanceof Map || value instanceof Set) {
        return value.size;
    } else {
        return value.length;
    }
}
/**
 * Ensure that a number or date is below a threshold.
 */ function max(struct, threshold, options = {}) {
    const { exclusive } = options;
    return refine(struct, 'max', (value)=>{
        return exclusive ? value < threshold : value <= threshold || `Expected a ${struct.type} less than ${exclusive ? '' : 'or equal to '}${threshold} but received \`${value}\``;
    });
}
/**
 * Ensure that a number or date is above a threshold.
 */ function min(struct, threshold, options = {}) {
    const { exclusive } = options;
    return refine(struct, 'min', (value)=>{
        return exclusive ? value > threshold : value >= threshold || `Expected a ${struct.type} greater than ${exclusive ? '' : 'or equal to '}${threshold} but received \`${value}\``;
    });
}
/**
 * Ensure that a string, array, map or set is not empty.
 */ function nonempty(struct) {
    return refine(struct, 'nonempty', (value)=>{
        const size = getSize(value);
        return size > 0 || `Expected a nonempty ${struct.type} but received an empty one`;
    });
}
/**
 * Ensure that a string matches a regular expression.
 */ function pattern(struct, regexp) {
    return refine(struct, 'pattern', (value)=>{
        return regexp.test(value) || `Expected a ${struct.type} matching \`/${regexp.source}/\` but received "${value}"`;
    });
}
/**
 * Ensure that a string, array, number, date, map, or set has a size (or length, or time) between `min` and `max`.
 */ function size(struct, min, max = min) {
    const expected = `Expected a ${struct.type}`;
    const of = min === max ? `of \`${min}\`` : `between \`${min}\` and \`${max}\``;
    return refine(struct, 'size', (value)=>{
        if (typeof value === 'number' || value instanceof Date) {
            return min <= value && value <= max || `${expected} ${of} but received \`${value}\``;
        } else if (value instanceof Map || value instanceof Set) {
            const { size } = value;
            return min <= size && size <= max || `${expected} with a size ${of} but received one with a size of \`${size}\``;
        } else {
            const { length } = value;
            return min <= length && length <= max || `${expected} with a length ${of} but received one with a length of \`${length}\``;
        }
    });
}
/**
 * Augment a `Struct` to add an additional refinement to the validation.
 *
 * The refiner function is guaranteed to receive a value of the struct's type,
 * because the struct's existing validation will already have passed. This
 * allows you to layer additional validation on top of existing structs.
 */ function refine(struct, name, refiner) {
    return new Struct({
        ...struct,
        *refiner (value, ctx) {
            yield* struct.refiner(value, ctx);
            const result = refiner(value, ctx);
            const failures = toFailures(result, ctx, struct, value);
            for (const failure of failures){
                yield {
                    ...failure,
                    refinement: name
                };
            }
        }
    });
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=index.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/node_modules/eventemitter3/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var has = Object.prototype.hasOwnProperty, prefix = '~';
/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */ function Events() {}
//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
    Events.prototype = Object.create(null);
    //
    // This hack is needed because the `__proto__` property is still inherited in
    // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
    //
    if (!new Events().__proto__) prefix = false;
}
/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */ function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
}
/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */ function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
    }
    var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
    if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
    else emitter._events[evt] = [
        emitter._events[evt],
        listener
    ];
    return emitter;
}
/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */ function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new Events();
    else delete emitter._events[evt];
}
/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */ function EventEmitter() {
    this._events = new Events();
    this._eventsCount = 0;
}
/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */ EventEmitter.prototype.eventNames = function eventNames() {
    var names = [], events, name;
    if (this._eventsCount === 0) return names;
    for(name in events = this._events){
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
    }
    return names;
};
/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */ EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event, handlers = this._events[evt];
    if (!handlers) return [];
    if (handlers.fn) return [
        handlers.fn
    ];
    for(var i = 0, l = handlers.length, ee = new Array(l); i < l; i++){
        ee[i] = handlers[i].fn;
    }
    return ee;
};
/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */ EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event, listeners = this._events[evt];
    if (!listeners) return 0;
    if (listeners.fn) return 1;
    return listeners.length;
};
/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */ EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt]) return false;
    var listeners = this._events[evt], len = arguments.length, args, i;
    if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
        switch(len){
            case 1:
                return listeners.fn.call(listeners.context), true;
            case 2:
                return listeners.fn.call(listeners.context, a1), true;
            case 3:
                return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
                return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
                return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
                return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for(i = 1, args = new Array(len - 1); i < len; i++){
            args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
    } else {
        var length = listeners.length, j;
        for(i = 0; i < length; i++){
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
            switch(len){
                case 1:
                    listeners[i].fn.call(listeners[i].context);
                    break;
                case 2:
                    listeners[i].fn.call(listeners[i].context, a1);
                    break;
                case 3:
                    listeners[i].fn.call(listeners[i].context, a1, a2);
                    break;
                case 4:
                    listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                    break;
                default:
                    if (!args) for(j = 1, args = new Array(len - 1); j < len; j++){
                        args[j - 1] = arguments[j];
                    }
                    listeners[i].fn.apply(listeners[i].context, args);
            }
        }
    }
    return true;
};
/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */ EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
};
/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */ EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
};
/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */ EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt]) return this;
    if (!fn) {
        clearEvent(this, evt);
        return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
        }
    } else {
        for(var i = 0, events = [], length = listeners.length; i < length; i++){
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
                events.push(listeners[i]);
            }
        }
        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
    }
    return this;
};
/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */ EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
    } else {
        this._events = new Events();
        this._eventsCount = 0;
    }
    return this;
};
//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;
//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;
//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;
//
// Expose the module.
//
if ("TURBOPACK compile-time truthy", 1) {
    module.exports = EventEmitter;
}
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$node_modules$2f$eventemitter3$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/node_modules/eventemitter3/index.js [app-client] (ecmascript)");
;
;
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$node_modules$2f$eventemitter3$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConnectionContext",
    ()=>ConnectionContext,
    "useConnection",
    ()=>useConnection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const ConnectionContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({});
function useConnection() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ConnectionContext);
} //# sourceMappingURL=useConnection.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/ConnectionProvider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConnectionProvider",
    ()=>ConnectionProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)");
;
;
;
const ConnectionProvider = ({ children, endpoint, config = {
    commitment: 'confirmed'
} })=>{
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ConnectionProvider.useMemo[connection]": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Connection"](endpoint, config)
    }["ConnectionProvider.useMemo[connection]"], [
        endpoint,
        config
    ]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectionContext"].Provider, {
        value: {
            connection
        }
    }, children);
}; //# sourceMappingURL=ConnectionProvider.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/getEnvironment.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Environment",
    ()=>Environment,
    "default",
    ()=>getEnvironment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana-mobile/wallet-adapter-mobile/lib/esm/index.browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
;
;
var Environment;
(function(Environment) {
    Environment[Environment["DESKTOP_WEB"] = 0] = "DESKTOP_WEB";
    Environment[Environment["MOBILE_WEB"] = 1] = "MOBILE_WEB";
})(Environment || (Environment = {}));
function isWebView(userAgentString) {
    return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(userAgentString);
}
function getEnvironment({ adapters, userAgentString }) {
    if (adapters.some((adapter)=>adapter.name !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaMobileWalletAdapterWalletName"] && adapter.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed)) {
        /**
         * There are only two ways a browser extension adapter should be able to reach `Installed` status:
         *
         *     1. Its browser extension is installed.
         *     2. The app is running on a mobile wallet's in-app browser.
         *
         * In either case, we consider the environment to be desktop-like.
         */ return Environment.DESKTOP_WEB;
    }
    if (userAgentString && // Step 1: Check whether we're on a platform that supports MWA at all.
    /android/i.test(userAgentString) && // Step 2: Determine that we are *not* running in a WebView.
    !isWebView(userAgentString)) {
        return Environment.MOBILE_WEB;
    } else {
        return Environment.DESKTOP_WEB;
    }
} //# sourceMappingURL=getEnvironment.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/getInferredClusterFromEndpoint.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>getInferredClusterFromEndpoint
]);
function getInferredClusterFromEndpoint(endpoint) {
    if (!endpoint) {
        return 'mainnet-beta';
    }
    if (/devnet/i.test(endpoint)) {
        return 'devnet';
    } else if (/testnet/i.test(endpoint)) {
        return 'testnet';
    } else {
        return 'mainnet-beta';
    }
} //# sourceMappingURL=getInferredClusterFromEndpoint.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useLocalStorage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useLocalStorage",
    ()=>useLocalStorage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
function useLocalStorage(key, defaultState) {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useLocalStorage.useState[state]": ()=>{
            try {
                const value = localStorage.getItem(key);
                if (value) return JSON.parse(value);
            } catch (error) {
                if (typeof window !== 'undefined') {
                    console.error(error);
                }
            }
            return defaultState;
        }
    }["useLocalStorage.useState[state]"]);
    const value = state[0];
    const isFirstRenderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useLocalStorage.useEffect": ()=>{
            if (isFirstRenderRef.current) {
                isFirstRenderRef.current = false;
                return;
            }
            try {
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (error) {
                if (typeof window !== 'undefined') {
                    console.error(error);
                }
            }
        }
    }["useLocalStorage.useEffect"], [
        value,
        key
    ]);
    return state;
} //# sourceMappingURL=useLocalStorage.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/errors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletNotSelectedError",
    ()=>WalletNotSelectedError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
;
class WalletNotSelectedError extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletError"] {
    constructor(){
        super(...arguments);
        this.name = 'WalletNotSelectedError';
    }
} //# sourceMappingURL=errors.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletContext",
    ()=>WalletContext,
    "useWallet",
    ()=>useWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const EMPTY_ARRAY = [];
const DEFAULT_CONTEXT = {
    autoConnect: false,
    connecting: false,
    connected: false,
    disconnecting: false,
    select () {
        logMissingProviderError('call', 'select');
    },
    connect () {
        return Promise.reject(logMissingProviderError('call', 'connect'));
    },
    disconnect () {
        return Promise.reject(logMissingProviderError('call', 'disconnect'));
    },
    sendTransaction () {
        return Promise.reject(logMissingProviderError('call', 'sendTransaction'));
    },
    signTransaction () {
        return Promise.reject(logMissingProviderError('call', 'signTransaction'));
    },
    signAllTransactions () {
        return Promise.reject(logMissingProviderError('call', 'signAllTransactions'));
    },
    signMessage () {
        return Promise.reject(logMissingProviderError('call', 'signMessage'));
    },
    signIn () {
        return Promise.reject(logMissingProviderError('call', 'signIn'));
    }
};
Object.defineProperty(DEFAULT_CONTEXT, 'wallets', {
    get () {
        logMissingProviderError('read', 'wallets');
        return EMPTY_ARRAY;
    }
});
Object.defineProperty(DEFAULT_CONTEXT, 'wallet', {
    get () {
        logMissingProviderError('read', 'wallet');
        return null;
    }
});
Object.defineProperty(DEFAULT_CONTEXT, 'publicKey', {
    get () {
        logMissingProviderError('read', 'publicKey');
        return null;
    }
});
function logMissingProviderError(action, property) {
    const error = new Error(`You have tried to ${action} "${property}" on a WalletContext without providing one. ` + 'Make sure to render a WalletProvider as an ancestor of the component that uses WalletContext.');
    console.error(error);
    return error;
}
const WalletContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(DEFAULT_CONTEXT);
function useWallet() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(WalletContext);
} //# sourceMappingURL=useWallet.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/WalletProviderBase.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletProviderBase",
    ()=>WalletProviderBase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
;
;
;
;
function WalletProviderBase({ children, wallets: adapters, adapter, isUnloadingRef, onAutoConnectRequest, onConnectError, onError, onSelectWallet }) {
    const isConnectingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [connecting, setConnecting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const isDisconnectingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [disconnecting, setDisconnecting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [publicKey, setPublicKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "WalletProviderBase.useState": ()=>adapter?.publicKey ?? null
    }["WalletProviderBase.useState"]);
    const [connected, setConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "WalletProviderBase.useState": ()=>adapter?.connected ?? false
    }["WalletProviderBase.useState"]);
    /**
     * Store the error handlers as refs so that a change in the
     * custom error handler does not recompute other dependencies.
     */ const onErrorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onError);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProviderBase.useEffect": ()=>{
            onErrorRef.current = onError;
            return ({
                "WalletProviderBase.useEffect": ()=>{
                    onErrorRef.current = undefined;
                }
            })["WalletProviderBase.useEffect"];
        }
    }["WalletProviderBase.useEffect"], [
        onError
    ]);
    const handleErrorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        "WalletProviderBase.useRef[handleErrorRef]": (error, adapter)=>{
            if (!isUnloadingRef.current) {
                if (onErrorRef.current) {
                    onErrorRef.current(error, adapter);
                } else {
                    console.error(error, adapter);
                    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotReadyError"] && typeof window !== 'undefined' && adapter) {
                        window.open(adapter.url, '_blank');
                    }
                }
            }
            return error;
        }
    }["WalletProviderBase.useRef[handleErrorRef]"]);
    // Wrap adapters to conform to the `Wallet` interface
    const [wallets, setWallets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "WalletProviderBase.useState": ()=>adapters.map({
                "WalletProviderBase.useState": (adapter)=>({
                        adapter,
                        readyState: adapter.readyState
                    })
            }["WalletProviderBase.useState"]).filter({
                "WalletProviderBase.useState": ({ readyState })=>readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported
            }["WalletProviderBase.useState"])
    }["WalletProviderBase.useState"]);
    // When the adapters change, start to listen for changes to their `readyState`
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProviderBase.useEffect": ()=>{
            // When the adapters change, wrap them to conform to the `Wallet` interface
            setWallets({
                "WalletProviderBase.useEffect": (wallets)=>adapters.map({
                        "WalletProviderBase.useEffect": (adapter, index)=>{
                            const wallet = wallets[index];
                            // If the wallet hasn't changed, return the same instance
                            return wallet && wallet.adapter === adapter && wallet.readyState === adapter.readyState ? wallet : {
                                adapter: adapter,
                                readyState: adapter.readyState
                            };
                        }
                    }["WalletProviderBase.useEffect"]).filter({
                        "WalletProviderBase.useEffect": ({ readyState })=>readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported
                    }["WalletProviderBase.useEffect"])
            }["WalletProviderBase.useEffect"]);
            function handleReadyStateChange(readyState) {
                setWallets({
                    "WalletProviderBase.useEffect.handleReadyStateChange": (prevWallets)=>{
                        const index = prevWallets.findIndex({
                            "WalletProviderBase.useEffect.handleReadyStateChange.index": ({ adapter })=>adapter === this
                        }["WalletProviderBase.useEffect.handleReadyStateChange.index"]);
                        if (index === -1) return prevWallets;
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const { adapter } = prevWallets[index];
                        return [
                            ...prevWallets.slice(0, index),
                            {
                                adapter,
                                readyState
                            },
                            ...prevWallets.slice(index + 1)
                        ].filter({
                            "WalletProviderBase.useEffect.handleReadyStateChange": ({ readyState })=>readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported
                        }["WalletProviderBase.useEffect.handleReadyStateChange"]);
                    }
                }["WalletProviderBase.useEffect.handleReadyStateChange"]);
            }
            adapters.forEach({
                "WalletProviderBase.useEffect": (adapter)=>adapter.on('readyStateChange', handleReadyStateChange, adapter)
            }["WalletProviderBase.useEffect"]);
            return ({
                "WalletProviderBase.useEffect": ()=>{
                    adapters.forEach({
                        "WalletProviderBase.useEffect": (adapter)=>adapter.off('readyStateChange', handleReadyStateChange, adapter)
                    }["WalletProviderBase.useEffect"]);
                }
            })["WalletProviderBase.useEffect"];
        }
    }["WalletProviderBase.useEffect"], [
        adapter,
        adapters
    ]);
    const wallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProviderBase.useMemo[wallet]": ()=>wallets.find({
                "WalletProviderBase.useMemo[wallet]": (wallet)=>wallet.adapter === adapter
            }["WalletProviderBase.useMemo[wallet]"]) ?? null
    }["WalletProviderBase.useMemo[wallet]"], [
        adapter,
        wallets
    ]);
    // Setup and teardown event listeners when the adapter changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProviderBase.useEffect": ()=>{
            if (!adapter) return;
            const handleConnect = {
                "WalletProviderBase.useEffect.handleConnect": (publicKey)=>{
                    setPublicKey(publicKey);
                    isConnectingRef.current = false;
                    setConnecting(false);
                    setConnected(true);
                    isDisconnectingRef.current = false;
                    setDisconnecting(false);
                }
            }["WalletProviderBase.useEffect.handleConnect"];
            const handleDisconnect = {
                "WalletProviderBase.useEffect.handleDisconnect": ()=>{
                    if (isUnloadingRef.current) return;
                    setPublicKey(null);
                    isConnectingRef.current = false;
                    setConnecting(false);
                    setConnected(false);
                    isDisconnectingRef.current = false;
                    setDisconnecting(false);
                }
            }["WalletProviderBase.useEffect.handleDisconnect"];
            const handleError = {
                "WalletProviderBase.useEffect.handleError": (error)=>{
                    handleErrorRef.current(error, adapter);
                }
            }["WalletProviderBase.useEffect.handleError"];
            adapter.on('connect', handleConnect);
            adapter.on('disconnect', handleDisconnect);
            adapter.on('error', handleError);
            return ({
                "WalletProviderBase.useEffect": ()=>{
                    adapter.off('connect', handleConnect);
                    adapter.off('disconnect', handleDisconnect);
                    adapter.off('error', handleError);
                    handleDisconnect();
                }
            })["WalletProviderBase.useEffect"];
        }
    }["WalletProviderBase.useEffect"], [
        adapter,
        isUnloadingRef
    ]);
    // When the adapter changes, clear the `autoConnect` tracking flag
    const didAttemptAutoConnectRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProviderBase.useEffect": ()=>{
            return ({
                "WalletProviderBase.useEffect": ()=>{
                    didAttemptAutoConnectRef.current = false;
                }
            })["WalletProviderBase.useEffect"];
        }
    }["WalletProviderBase.useEffect"], [
        adapter
    ]);
    // If auto-connect is enabled, request to connect when the adapter changes and is ready
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProviderBase.useEffect": ()=>{
            if (didAttemptAutoConnectRef.current || isConnectingRef.current || connected || !onAutoConnectRequest || !(wallet?.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed || wallet?.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable)) return;
            isConnectingRef.current = true;
            setConnecting(true);
            didAttemptAutoConnectRef.current = true;
            ({
                "WalletProviderBase.useEffect": async function() {
                    try {
                        await onAutoConnectRequest();
                    } catch  {
                        onConnectError();
                    // Drop the error. It will be caught by `handleError` anyway.
                    } finally{
                        setConnecting(false);
                        isConnectingRef.current = false;
                    }
                }
            })["WalletProviderBase.useEffect"]();
        }
    }["WalletProviderBase.useEffect"], [
        connected,
        onAutoConnectRequest,
        onConnectError,
        wallet
    ]);
    // Send a transaction using the provided connection
    const sendTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProviderBase.useCallback[sendTransaction]": async (transaction, connection, options)=>{
            if (!adapter) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotSelectedError"]());
            if (!connected) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"](), adapter);
            return await adapter.sendTransaction(transaction, connection, options);
        }
    }["WalletProviderBase.useCallback[sendTransaction]"], [
        adapter,
        connected
    ]);
    // Sign a transaction if the wallet supports it
    const signTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProviderBase.useMemo[signTransaction]": ()=>adapter && 'signTransaction' in adapter ? ({
                "WalletProviderBase.useMemo[signTransaction]": async (transaction)=>{
                    if (!connected) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"](), adapter);
                    return await adapter.signTransaction(transaction);
                }
            })["WalletProviderBase.useMemo[signTransaction]"] : undefined
    }["WalletProviderBase.useMemo[signTransaction]"], [
        adapter,
        connected
    ]);
    // Sign multiple transactions if the wallet supports it
    const signAllTransactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProviderBase.useMemo[signAllTransactions]": ()=>adapter && 'signAllTransactions' in adapter ? ({
                "WalletProviderBase.useMemo[signAllTransactions]": async (transactions)=>{
                    if (!connected) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"](), adapter);
                    return await adapter.signAllTransactions(transactions);
                }
            })["WalletProviderBase.useMemo[signAllTransactions]"] : undefined
    }["WalletProviderBase.useMemo[signAllTransactions]"], [
        adapter,
        connected
    ]);
    // Sign an arbitrary message if the wallet supports it
    const signMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProviderBase.useMemo[signMessage]": ()=>adapter && 'signMessage' in adapter ? ({
                "WalletProviderBase.useMemo[signMessage]": async (message)=>{
                    if (!connected) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"](), adapter);
                    return await adapter.signMessage(message);
                }
            })["WalletProviderBase.useMemo[signMessage]"] : undefined
    }["WalletProviderBase.useMemo[signMessage]"], [
        adapter,
        connected
    ]);
    // Sign in if the wallet supports it
    const signIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProviderBase.useMemo[signIn]": ()=>adapter && 'signIn' in adapter ? ({
                "WalletProviderBase.useMemo[signIn]": async (input)=>{
                    return await adapter.signIn(input);
                }
            })["WalletProviderBase.useMemo[signIn]"] : undefined
    }["WalletProviderBase.useMemo[signIn]"], [
        adapter
    ]);
    const handleConnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProviderBase.useCallback[handleConnect]": async ()=>{
            if (isConnectingRef.current || isDisconnectingRef.current || wallet?.adapter.connected) return;
            if (!wallet) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotSelectedError"]());
            const { adapter, readyState } = wallet;
            if (!(readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed || readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable)) throw handleErrorRef.current(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotReadyError"](), adapter);
            isConnectingRef.current = true;
            setConnecting(true);
            try {
                await adapter.connect();
            } catch (e) {
                onConnectError();
                throw e;
            } finally{
                setConnecting(false);
                isConnectingRef.current = false;
            }
        }
    }["WalletProviderBase.useCallback[handleConnect]"], [
        onConnectError,
        wallet
    ]);
    const handleDisconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProviderBase.useCallback[handleDisconnect]": async ()=>{
            if (isDisconnectingRef.current) return;
            if (!adapter) return;
            isDisconnectingRef.current = true;
            setDisconnecting(true);
            try {
                await adapter.disconnect();
            } finally{
                setDisconnecting(false);
                isDisconnectingRef.current = false;
            }
        }
    }["WalletProviderBase.useCallback[handleDisconnect]"], [
        adapter
    ]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletContext"].Provider, {
        value: {
            autoConnect: !!onAutoConnectRequest,
            wallets,
            wallet,
            publicKey,
            connected,
            connecting,
            disconnecting,
            select: onSelectWallet,
            connect: handleConnect,
            disconnect: handleDisconnect,
            sendTransaction,
            signTransaction,
            signAllTransactions,
            signMessage,
            signIn
        }
    }, children);
} //# sourceMappingURL=WalletProviderBase.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/WalletProvider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletProvider",
    ()=>WalletProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana-mobile/wallet-adapter-mobile/lib/esm/index.browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useStandardWalletAdapters$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/lib/esm/useStandardWalletAdapters.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$getEnvironment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/getEnvironment.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$getInferredClusterFromEndpoint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/getInferredClusterFromEndpoint.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useLocalStorage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useLocalStorage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$WalletProviderBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/WalletProviderBase.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
let _userAgent;
function getUserAgent() {
    if (_userAgent === undefined) {
        _userAgent = globalThis.navigator?.userAgent ?? null;
    }
    return _userAgent;
}
function getIsMobile(adapters) {
    const userAgentString = getUserAgent();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$getEnvironment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])({
        adapters,
        userAgentString
    }) === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$getEnvironment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Environment"].MOBILE_WEB;
}
function getUriForAppIdentity() {
    const location = globalThis.location;
    if (!location) return;
    return `${location.protocol}//${location.host}`;
}
function WalletProvider({ children, wallets: adapters, autoConnect, localStorageKey = 'walletName', onError }) {
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const adaptersWithStandardAdapters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useStandardWalletAdapters$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStandardWalletAdapters"])(adapters);
    const mobileWalletAdapter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProvider.useMemo[mobileWalletAdapter]": ()=>{
            if (!getIsMobile(adaptersWithStandardAdapters)) {
                return null;
            }
            const existingMobileWalletAdapter = adaptersWithStandardAdapters.find({
                "WalletProvider.useMemo[mobileWalletAdapter].existingMobileWalletAdapter": (adapter)=>adapter.name === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaMobileWalletAdapterWalletName"]
            }["WalletProvider.useMemo[mobileWalletAdapter].existingMobileWalletAdapter"]);
            if (existingMobileWalletAdapter) {
                return existingMobileWalletAdapter;
            }
            return new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaMobileWalletAdapter"]({
                addressSelector: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultAddressSelector"])(),
                appIdentity: {
                    uri: getUriForAppIdentity()
                },
                authorizationResultCache: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultAuthorizationResultCache"])(),
                cluster: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$getInferredClusterFromEndpoint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(connection?.rpcEndpoint),
                onWalletNotFound: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDefaultWalletNotFoundHandler"])()
            });
        }
    }["WalletProvider.useMemo[mobileWalletAdapter]"], [
        adaptersWithStandardAdapters,
        connection?.rpcEndpoint
    ]);
    const adaptersWithMobileWalletAdapter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProvider.useMemo[adaptersWithMobileWalletAdapter]": ()=>{
            if (mobileWalletAdapter == null || adaptersWithStandardAdapters.indexOf(mobileWalletAdapter) !== -1) {
                return adaptersWithStandardAdapters;
            }
            return [
                mobileWalletAdapter,
                ...adaptersWithStandardAdapters
            ];
        }
    }["WalletProvider.useMemo[adaptersWithMobileWalletAdapter]"], [
        adaptersWithStandardAdapters,
        mobileWalletAdapter
    ]);
    const [walletName, setWalletName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useLocalStorage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalStorage"])(localStorageKey, null);
    const adapter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProvider.useMemo[adapter]": ()=>adaptersWithMobileWalletAdapter.find({
                "WalletProvider.useMemo[adapter]": (a)=>a.name === walletName
            }["WalletProvider.useMemo[adapter]"]) ?? null
    }["WalletProvider.useMemo[adapter]"], [
        adaptersWithMobileWalletAdapter,
        walletName
    ]);
    const changeWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[changeWallet]": (nextWalletName)=>{
            if (walletName === nextWalletName) return;
            if (adapter && // Selecting a wallet other than the mobile wallet adapter is not
            // sufficient reason to call `disconnect` on the mobile wallet adapter.
            // Calling `disconnect` on the mobile wallet adapter causes the entire
            // authorization store to be wiped.
            adapter.name !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaMobileWalletAdapterWalletName"]) {
                adapter.disconnect();
            }
            setWalletName(nextWalletName);
        }
    }["WalletProvider.useCallback[changeWallet]"], [
        adapter,
        setWalletName,
        walletName
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            if (!adapter) return;
            function handleDisconnect() {
                if (isUnloadingRef.current) return;
                setWalletName(null);
            }
            adapter.on('disconnect', handleDisconnect);
            return ({
                "WalletProvider.useEffect": ()=>{
                    adapter.off('disconnect', handleDisconnect);
                }
            })["WalletProvider.useEffect"];
        }
    }["WalletProvider.useEffect"], [
        adapter,
        adaptersWithStandardAdapters,
        setWalletName,
        walletName
    ]);
    const hasUserSelectedAWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const handleAutoConnectRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletProvider.useMemo[handleAutoConnectRequest]": ()=>{
            if (!autoConnect || !adapter) return;
            return ({
                "WalletProvider.useMemo[handleAutoConnectRequest]": async ()=>{
                    // If autoConnect is true or returns true, use the default autoConnect behavior.
                    if (autoConnect === true || await autoConnect(adapter)) {
                        if (hasUserSelectedAWallet.current) {
                            await adapter.connect();
                        } else {
                            await adapter.autoConnect();
                        }
                    }
                }
            })["WalletProvider.useMemo[handleAutoConnectRequest]"];
        }
    }["WalletProvider.useMemo[handleAutoConnectRequest]"], [
        autoConnect,
        adapter
    ]);
    const isUnloadingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            if (walletName === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2d$mobile$2f$wallet$2d$adapter$2d$mobile$2f$lib$2f$esm$2f$index$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaMobileWalletAdapterWalletName"] && getIsMobile(adaptersWithStandardAdapters)) {
                isUnloadingRef.current = false;
                return;
            }
            function handleBeforeUnload() {
                isUnloadingRef.current = true;
            }
            /**
         * Some wallets fire disconnection events when the window unloads. Since there's no way to
         * distinguish between a disconnection event received because a user initiated it, and one
         * that was received because they've closed the window, we have to track window unload
         * events themselves. Downstream components use this information to decide whether to act
         * upon or drop wallet events and errors.
         */ window.addEventListener('beforeunload', handleBeforeUnload);
            return ({
                "WalletProvider.useEffect": ()=>{
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                }
            })["WalletProvider.useEffect"];
        }
    }["WalletProvider.useEffect"], [
        adaptersWithStandardAdapters,
        walletName
    ]);
    const handleConnectError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[handleConnectError]": ()=>{
            if (adapter) {
                // If any error happens while connecting, unset the adapter.
                changeWallet(null);
            }
        }
    }["WalletProvider.useCallback[handleConnectError]"], [
        adapter,
        changeWallet
    ]);
    const selectWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[selectWallet]": (walletName)=>{
            hasUserSelectedAWallet.current = true;
            changeWallet(walletName);
        }
    }["WalletProvider.useCallback[selectWallet]"], [
        changeWallet
    ]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$WalletProviderBase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletProviderBase"], {
        wallets: adaptersWithMobileWalletAdapter,
        adapter: adapter,
        isUnloadingRef: isUnloadingRef,
        onAutoConnectRequest: handleAutoConnectRequest,
        onConnectError: handleConnectError,
        onError: onError,
        onSelectWallet: selectWallet
    }, children);
} //# sourceMappingURL=WalletProvider.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletAccountError",
    ()=>WalletAccountError,
    "WalletConfigError",
    ()=>WalletConfigError,
    "WalletConnectionError",
    ()=>WalletConnectionError,
    "WalletDisconnectedError",
    ()=>WalletDisconnectedError,
    "WalletDisconnectionError",
    ()=>WalletDisconnectionError,
    "WalletError",
    ()=>WalletError,
    "WalletKeypairError",
    ()=>WalletKeypairError,
    "WalletLoadError",
    ()=>WalletLoadError,
    "WalletNotConnectedError",
    ()=>WalletNotConnectedError,
    "WalletNotReadyError",
    ()=>WalletNotReadyError,
    "WalletPublicKeyError",
    ()=>WalletPublicKeyError,
    "WalletSendTransactionError",
    ()=>WalletSendTransactionError,
    "WalletSignInError",
    ()=>WalletSignInError,
    "WalletSignMessageError",
    ()=>WalletSignMessageError,
    "WalletSignTransactionError",
    ()=>WalletSignTransactionError,
    "WalletTimeoutError",
    ()=>WalletTimeoutError,
    "WalletWindowBlockedError",
    ()=>WalletWindowBlockedError,
    "WalletWindowClosedError",
    ()=>WalletWindowClosedError
]);
class WalletError extends Error {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message, error){
        super(message);
        this.error = error;
    }
}
class WalletNotReadyError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletNotReadyError';
    }
}
class WalletLoadError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletLoadError';
    }
}
class WalletConfigError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletConfigError';
    }
}
class WalletConnectionError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletConnectionError';
    }
}
class WalletDisconnectedError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletDisconnectedError';
    }
}
class WalletDisconnectionError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletDisconnectionError';
    }
}
class WalletAccountError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletAccountError';
    }
}
class WalletPublicKeyError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletPublicKeyError';
    }
}
class WalletKeypairError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletKeypairError';
    }
}
class WalletNotConnectedError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletNotConnectedError';
    }
}
class WalletSendTransactionError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletSendTransactionError';
    }
}
class WalletSignTransactionError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletSignTransactionError';
    }
}
class WalletSignMessageError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletSignMessageError';
    }
}
class WalletSignInError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletSignInError';
    }
}
class WalletTimeoutError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletTimeoutError';
    }
}
class WalletWindowBlockedError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletWindowBlockedError';
    }
}
class WalletWindowClosedError extends WalletError {
    constructor(){
        super(...arguments);
        this.name = 'WalletWindowClosedError';
    }
} //# sourceMappingURL=errors.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseWalletAdapter",
    ()=>BaseWalletAdapter,
    "WalletReadyState",
    ()=>WalletReadyState,
    "isIosAndRedirectable",
    ()=>isIosAndRedirectable,
    "scopePollingDetectionStrategy",
    ()=>scopePollingDetectionStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/node_modules/eventemitter3/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
;
;
;
var WalletReadyState;
(function(WalletReadyState) {
    /**
     * User-installable wallets can typically be detected by scanning for an API
     * that they've injected into the global context. If such an API is present,
     * we consider the wallet to have been installed.
     */ WalletReadyState["Installed"] = "Installed";
    WalletReadyState["NotDetected"] = "NotDetected";
    /**
     * Loadable wallets are always available to you. Since you can load them at
     * any time, it's meaningless to say that they have been detected.
     */ WalletReadyState["Loadable"] = "Loadable";
    /**
     * If a wallet is not supported on a given platform (eg. server-rendering, or
     * mobile) then it will stay in the `Unsupported` state.
     */ WalletReadyState["Unsupported"] = "Unsupported";
})(WalletReadyState || (WalletReadyState = {}));
class BaseWalletAdapter extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    get connected() {
        return !!this.publicKey;
    }
    async autoConnect() {
        await this.connect();
    }
    async prepareTransaction(transaction, connection, options = {}) {
        const publicKey = this.publicKey;
        if (!publicKey) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
        transaction.feePayer = transaction.feePayer || publicKey;
        transaction.recentBlockhash = transaction.recentBlockhash || (await connection.getLatestBlockhash({
            commitment: options.preflightCommitment,
            minContextSlot: options.minContextSlot
        })).blockhash;
        return transaction;
    }
}
function scopePollingDetectionStrategy(detect) {
    // Early return when server-side rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const disposers = [];
    function detectAndDispose() {
        const detected = detect();
        if (detected) {
            for (const dispose of disposers){
                dispose();
            }
        }
    }
    // Strategy #1: Try detecting every second.
    const interval = // TODO: #334 Replace with idle callback strategy.
    setInterval(detectAndDispose, 1000);
    disposers.push(()=>clearInterval(interval));
    // Strategy #2: Detect as soon as the DOM becomes 'ready'/'interactive'.
    if (// Implies that `DOMContentLoaded` has not yet fired.
    document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectAndDispose, {
            once: true
        });
        disposers.push(()=>document.removeEventListener('DOMContentLoaded', detectAndDispose));
    }
    // Strategy #3: Detect after the `window` has fully loaded.
    if (// If the `complete` state has been reached, we're too late.
    document.readyState !== 'complete') {
        window.addEventListener('load', detectAndDispose, {
            once: true
        });
        disposers.push(()=>window.removeEventListener('load', detectAndDispose));
    }
    // Strategy #4: Detect synchronously, now.
    detectAndDispose();
}
function isIosAndRedirectable() {
    // SSR: return false
    if (!navigator) return false;
    const userAgent = navigator.userAgent.toLowerCase();
    // if on iOS the user agent will contain either iPhone or iPad
    // caveat: if requesting desktop site then this won't work
    const isIos = userAgent.includes('iphone') || userAgent.includes('ipad');
    // if in a webview then it will not include Safari
    // note that other iOS browsers also include Safari
    // so we will redirect only if Safari is also included
    const isSafari = userAgent.includes('safari');
    return isIos && isSafari;
} //# sourceMappingURL=adapter.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/transaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isVersionedTransaction",
    ()=>isVersionedTransaction
]);
function isVersionedTransaction(transaction) {
    return 'version' in transaction;
} //# sourceMappingURL=transaction.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/signer.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseMessageSignerWalletAdapter",
    ()=>BaseMessageSignerWalletAdapter,
    "BaseSignInMessageSignerWalletAdapter",
    ()=>BaseSignInMessageSignerWalletAdapter,
    "BaseSignerWalletAdapter",
    ()=>BaseSignerWalletAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/transaction.js [app-client] (ecmascript)");
;
;
;
class BaseSignerWalletAdapter extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BaseWalletAdapter"] {
    async sendTransaction(transaction, connection, options = {}) {
        let emit = true;
        try {
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction)) {
                if (!this.supportedTransactionVersions) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](`Sending versioned transactions isn't supported by this wallet`);
                if (!this.supportedTransactionVersions.has(transaction.version)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](`Sending transaction version ${transaction.version} isn't supported by this wallet`);
                try {
                    transaction = await this.signTransaction(transaction);
                    const rawTransaction = transaction.serialize();
                    return await connection.sendRawTransaction(rawTransaction, options);
                } catch (error) {
                    // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
                    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"]) {
                        emit = false;
                        throw error;
                    }
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](error?.message, error);
                }
            } else {
                try {
                    const { signers, ...sendOptions } = options;
                    transaction = await this.prepareTransaction(transaction, connection, sendOptions);
                    signers?.length && transaction.partialSign(...signers);
                    transaction = await this.signTransaction(transaction);
                    const rawTransaction = transaction.serialize();
                    return await connection.sendRawTransaction(rawTransaction, sendOptions);
                } catch (error) {
                    // If the error was thrown by `signTransaction`, rethrow it and don't emit a duplicate event
                    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"]) {
                        emit = false;
                        throw error;
                    }
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](error?.message, error);
                }
            }
        } catch (error) {
            if (emit) {
                this.emit('error', error);
            }
            throw error;
        }
    }
    async signAllTransactions(transactions) {
        for (const transaction of transactions){
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction)) {
                if (!this.supportedTransactionVersions) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](`Signing versioned transactions isn't supported by this wallet`);
                if (!this.supportedTransactionVersions.has(transaction.version)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](`Signing transaction version ${transaction.version} isn't supported by this wallet`);
            }
        }
        const signedTransactions = [];
        for (const transaction of transactions){
            signedTransactions.push(await this.signTransaction(transaction));
        }
        return signedTransactions;
    }
}
class BaseMessageSignerWalletAdapter extends BaseSignerWalletAdapter {
}
class BaseSignInMessageSignerWalletAdapter extends BaseMessageSignerWalletAdapter {
} //# sourceMappingURL=signer.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/standard.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWalletAdapterCompatibleStandardWallet",
    ()=>isWalletAdapterCompatibleStandardWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signAndSendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/connect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/events.js [app-client] (ecmascript)");
;
;
function isWalletAdapterCompatibleStandardWallet(wallet) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardConnect"] in wallet.features && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardEvents"] in wallet.features && (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"] in wallet.features || __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in wallet.features);
} //# sourceMappingURL=standard.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signIn.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Name of the feature. */ __turbopack_context__.s([
    "SolanaSignIn",
    ()=>SolanaSignIn
]);
const SolanaSignIn = 'solana:signIn'; //# sourceMappingURL=signIn.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signMessage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Name of the feature. */ __turbopack_context__.s([
    "SolanaSignMessage",
    ()=>SolanaSignMessage
]);
const SolanaSignMessage = 'solana:signMessage'; //# sourceMappingURL=signMessage.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signAndSendTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Name of the feature. */ __turbopack_context__.s([
    "SolanaSignAndSendTransaction",
    ()=>SolanaSignAndSendTransaction
]);
const SolanaSignAndSendTransaction = 'solana:signAndSendTransaction'; //# sourceMappingURL=signAndSendTransaction.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signTransaction.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Name of the feature. */ __turbopack_context__.s([
    "SolanaSignTransaction",
    ()=>SolanaSignTransaction
]);
const SolanaSignTransaction = 'solana:signTransaction'; //# sourceMappingURL=signTransaction.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/util.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @internal
 *
 * Efficiently compare {@link Indexed} arrays (e.g. `Array` and `Uint8Array`).
 *
 * @param a An array.
 * @param b Another array.
 *
 * @return `true` if the arrays have the same length and elements, `false` otherwise.
 *
 * @group Internal
 */ __turbopack_context__.s([
    "arraysEqual",
    ()=>arraysEqual,
    "bytesEqual",
    ()=>bytesEqual
]);
function arraysEqual(a, b) {
    if (a === b) return true;
    const length = a.length;
    if (length !== b.length) return false;
    for(let i = 0; i < length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
function bytesEqual(a, b) {
    return arraysEqual(a, b);
} //# sourceMappingURL=util.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/signMessage.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "verifyMessageSignature",
    ()=>verifyMessageSignature,
    "verifySignMessage",
    ()=>verifySignMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$noble$2f$curves$2f$esm$2f$ed25519$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@noble/curves/esm/ed25519.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/util.js [app-client] (ecmascript)");
;
;
function verifyMessageSignature({ message, signedMessage, signature, publicKey }) {
    // TODO: implement https://github.com/solana-labs/solana/blob/master/docs/src/proposals/off-chain-message-signing.md
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bytesEqual"])(message, signedMessage) && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$noble$2f$curves$2f$esm$2f$ed25519$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ed25519"].verify(signature, signedMessage, publicKey);
}
function verifySignMessage(input, output) {
    const { message, account: { publicKey } } = input;
    const { signedMessage, signature } = output;
    return verifyMessageSignature({
        message,
        signedMessage,
        signature,
        publicKey: publicKey
    });
} //# sourceMappingURL=signMessage.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/signIn.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSignInMessage",
    ()=>createSignInMessage,
    "createSignInMessageText",
    ()=>createSignInMessageText,
    "deriveSignInMessage",
    ()=>deriveSignInMessage,
    "deriveSignInMessageText",
    ()=>deriveSignInMessageText,
    "parseSignInMessage",
    ()=>parseSignInMessage,
    "parseSignInMessageText",
    ()=>parseSignInMessageText,
    "verifySignIn",
    ()=>verifySignIn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/signMessage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/util.js [app-client] (ecmascript)");
;
;
function verifySignIn(input, output) {
    const { signedMessage, signature, account: { publicKey } } = output;
    const message = deriveSignInMessage(input, output);
    return !!message && (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verifyMessageSignature"])({
        message,
        signedMessage,
        signature,
        publicKey: publicKey
    });
}
function deriveSignInMessage(input, output) {
    const text = deriveSignInMessageText(input, output);
    if (!text) return null;
    return new TextEncoder().encode(text);
}
function deriveSignInMessageText(input, output) {
    const parsed = parseSignInMessage(output.signedMessage);
    if (!parsed) return null;
    if (input.domain && input.domain !== parsed.domain) return null;
    if (input.address && input.address !== parsed.address) return null;
    if (input.statement !== parsed.statement) return null;
    if (input.uri !== parsed.uri) return null;
    if (input.version !== parsed.version) return null;
    if (input.chainId !== parsed.chainId) return null;
    if (input.nonce !== parsed.nonce) return null;
    if (input.issuedAt !== parsed.issuedAt) return null;
    if (input.expirationTime !== parsed.expirationTime) return null;
    if (input.notBefore !== parsed.notBefore) return null;
    if (input.requestId !== parsed.requestId) return null;
    if (input.resources) {
        if (!parsed.resources) return null;
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["arraysEqual"])(input.resources, parsed.resources)) return null;
    } else if (parsed.resources) return null;
    return createSignInMessageText(parsed);
}
function parseSignInMessage(message) {
    const text = new TextDecoder().decode(message);
    return parseSignInMessageText(text);
}
// TODO: implement https://github.com/solana-labs/solana/blob/master/docs/src/proposals/off-chain-message-signing.md
const DOMAIN = '(?<domain>[^\\n]+?) wants you to sign in with your Solana account:\\n';
const ADDRESS = '(?<address>[^\\n]+)(?:\\n|$)';
const STATEMENT = '(?:\\n(?<statement>[\\S\\s]*?)(?:\\n|$))??';
const URI = '(?:\\nURI: (?<uri>[^\\n]+))?';
const VERSION = '(?:\\nVersion: (?<version>[^\\n]+))?';
const CHAIN_ID = '(?:\\nChain ID: (?<chainId>[^\\n]+))?';
const NONCE = '(?:\\nNonce: (?<nonce>[^\\n]+))?';
const ISSUED_AT = '(?:\\nIssued At: (?<issuedAt>[^\\n]+))?';
const EXPIRATION_TIME = '(?:\\nExpiration Time: (?<expirationTime>[^\\n]+))?';
const NOT_BEFORE = '(?:\\nNot Before: (?<notBefore>[^\\n]+))?';
const REQUEST_ID = '(?:\\nRequest ID: (?<requestId>[^\\n]+))?';
const RESOURCES = '(?:\\nResources:(?<resources>(?:\\n- [^\\n]+)*))?';
const FIELDS = `${URI}${VERSION}${CHAIN_ID}${NONCE}${ISSUED_AT}${EXPIRATION_TIME}${NOT_BEFORE}${REQUEST_ID}${RESOURCES}`;
const MESSAGE = new RegExp(`^${DOMAIN}${ADDRESS}${STATEMENT}${FIELDS}\\n*$`);
function parseSignInMessageText(text) {
    const match = MESSAGE.exec(text);
    if (!match) return null;
    const groups = match.groups;
    if (!groups) return null;
    return {
        domain: groups.domain,
        address: groups.address,
        statement: groups.statement,
        uri: groups.uri,
        version: groups.version,
        nonce: groups.nonce,
        chainId: groups.chainId,
        issuedAt: groups.issuedAt,
        expirationTime: groups.expirationTime,
        notBefore: groups.notBefore,
        requestId: groups.requestId,
        resources: groups.resources?.split('\n- ').slice(1)
    };
}
function createSignInMessage(input) {
    const text = createSignInMessageText(input);
    return new TextEncoder().encode(text);
}
function createSignInMessageText(input) {
    // ${domain} wants you to sign in with your Solana account:
    // ${address}
    //
    // ${statement}
    //
    // URI: ${uri}
    // Version: ${version}
    // Chain ID: ${chain}
    // Nonce: ${nonce}
    // Issued At: ${issued-at}
    // Expiration Time: ${expiration-time}
    // Not Before: ${not-before}
    // Request ID: ${request-id}
    // Resources:
    // - ${resources[0]}
    // - ${resources[1]}
    // ...
    // - ${resources[n]}
    let message = `${input.domain} wants you to sign in with your Solana account:\n`;
    message += `${input.address}`;
    if (input.statement) {
        message += `\n\n${input.statement}`;
    }
    const fields = [];
    if (input.uri) {
        fields.push(`URI: ${input.uri}`);
    }
    if (input.version) {
        fields.push(`Version: ${input.version}`);
    }
    if (input.chainId) {
        fields.push(`Chain ID: ${input.chainId}`);
    }
    if (input.nonce) {
        fields.push(`Nonce: ${input.nonce}`);
    }
    if (input.issuedAt) {
        fields.push(`Issued At: ${input.issuedAt}`);
    }
    if (input.expirationTime) {
        fields.push(`Expiration Time: ${input.expirationTime}`);
    }
    if (input.notBefore) {
        fields.push(`Not Before: ${input.notBefore}`);
    }
    if (input.requestId) {
        fields.push(`Request ID: ${input.requestId}`);
    }
    if (input.resources) {
        fields.push(`Resources:`);
        for (const resource of input.resources){
            fields.push(`- ${resource}`);
        }
    }
    if (fields.length) {
        message += `\n\n${fields.join('\n')}`;
    }
    return message;
} //# sourceMappingURL=signIn.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/endpoint.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEVNET_ENDPOINT",
    ()=>DEVNET_ENDPOINT,
    "LOCALNET_ENDPOINT",
    ()=>LOCALNET_ENDPOINT,
    "MAINNET_ENDPOINT",
    ()=>MAINNET_ENDPOINT,
    "TESTNET_ENDPOINT",
    ()=>TESTNET_ENDPOINT,
    "getChainForEndpoint",
    ()=>getChainForEndpoint,
    "getEndpointForChain",
    ()=>getEndpointForChain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-chains/lib/esm/index.js [app-client] (ecmascript)");
;
const MAINNET_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
const TESTNET_ENDPOINT = 'https://api.testnet.solana.com';
const LOCALNET_ENDPOINT = 'http://localhost:8899';
function getChainForEndpoint(endpoint) {
    if (endpoint.includes(MAINNET_ENDPOINT)) return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_MAINNET_CHAIN"];
    if (/\bdevnet\b/i.test(endpoint)) return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_DEVNET_CHAIN"];
    if (/\btestnet\b/i.test(endpoint)) return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_TESTNET_CHAIN"];
    if (/\blocalhost\b/i.test(endpoint) || /\b127\.0\.0\.1\b/.test(endpoint)) return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_LOCALNET_CHAIN"];
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_MAINNET_CHAIN"];
}
function getEndpointForChain(chain, endpoint) {
    if (endpoint) return endpoint;
    if (chain === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_MAINNET_CHAIN"]) return MAINNET_ENDPOINT;
    if (chain === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_DEVNET_CHAIN"]) return DEVNET_ENDPOINT;
    if (chain === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_TESTNET_CHAIN"]) return TESTNET_ENDPOINT;
    if (chain === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_LOCALNET_CHAIN"]) return LOCALNET_ENDPOINT;
    return MAINNET_ENDPOINT;
} //# sourceMappingURL=endpoint.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/commitment.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * TODO: docs
 */ __turbopack_context__.s([
    "getCommitment",
    ()=>getCommitment
]);
function getCommitment(commitment) {
    switch(commitment){
        case 'processed':
        case 'confirmed':
        case 'finalized':
        case undefined:
            return commitment;
        case 'recent':
            return 'processed';
        case 'single':
        case 'singleGossip':
            return 'confirmed';
        case 'max':
        case 'root':
            return 'finalized';
        default:
            return undefined;
    }
} //# sourceMappingURL=commitment.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-chains/lib/esm/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Solana Mainnet (beta) cluster, e.g. https://api.mainnet-beta.solana.com */ __turbopack_context__.s([
    "SOLANA_CHAINS",
    ()=>SOLANA_CHAINS,
    "SOLANA_DEVNET_CHAIN",
    ()=>SOLANA_DEVNET_CHAIN,
    "SOLANA_LOCALNET_CHAIN",
    ()=>SOLANA_LOCALNET_CHAIN,
    "SOLANA_MAINNET_CHAIN",
    ()=>SOLANA_MAINNET_CHAIN,
    "SOLANA_TESTNET_CHAIN",
    ()=>SOLANA_TESTNET_CHAIN,
    "isSolanaChain",
    ()=>isSolanaChain
]);
const SOLANA_MAINNET_CHAIN = 'solana:mainnet';
const SOLANA_DEVNET_CHAIN = 'solana:devnet';
const SOLANA_TESTNET_CHAIN = 'solana:testnet';
const SOLANA_LOCALNET_CHAIN = 'solana:localnet';
const SOLANA_CHAINS = [
    SOLANA_MAINNET_CHAIN,
    SOLANA_DEVNET_CHAIN,
    SOLANA_TESTNET_CHAIN,
    SOLANA_LOCALNET_CHAIN
];
function isSolanaChain(chain) {
    return SOLANA_CHAINS.includes(chain);
} //# sourceMappingURL=index.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/@solana/wallet-standard-wallet-adapter-base/lib/esm/types.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWalletAdapterCompatibleWallet",
    ()=>isWalletAdapterCompatibleWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$standard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/standard.js [app-client] (ecmascript)");
;
const isWalletAdapterCompatibleWallet = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$standard$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWalletAdapterCompatibleStandardWallet"]; //# sourceMappingURL=types.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/@solana/wallet-standard-wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StandardWalletAdapter",
    ()=>StandardWalletAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signAndSendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signIn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signIn.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signMessage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$endpoint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/endpoint.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$commitment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-util/lib/esm/commitment.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/connect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$disconnect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/disconnect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/events.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$wallet$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/wallet/lib/esm/util.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f$bs58$2f$src$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/bs58/src/esm/index.js [app-client] (ecmascript)");
var __classPrivateFieldGet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _StandardWalletAdapter_instances, _StandardWalletAdapter_account, _StandardWalletAdapter_publicKey, _StandardWalletAdapter_connecting, _StandardWalletAdapter_disconnecting, _StandardWalletAdapter_off, _StandardWalletAdapter_supportedTransactionVersions, _StandardWalletAdapter_wallet, _StandardWalletAdapter_readyState, _StandardWalletAdapter_connect, _StandardWalletAdapter_connected, _StandardWalletAdapter_disconnected, _StandardWalletAdapter_reset, _StandardWalletAdapter_changed, _StandardWalletAdapter_signTransaction, _StandardWalletAdapter_signAllTransactions, _StandardWalletAdapter_signMessage, _StandardWalletAdapter_signIn;
;
;
;
;
;
;
;
class StandardWalletAdapter extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BaseWalletAdapter"] {
    get name() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").name;
    }
    get url() {
        return 'https://github.com/solana-labs/wallet-standard';
    }
    get icon() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").icon;
    }
    get readyState() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_readyState, "f");
    }
    get publicKey() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_publicKey, "f");
    }
    get connecting() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_connecting, "f");
    }
    get supportedTransactionVersions() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_supportedTransactionVersions, "f");
    }
    get wallet() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f");
    }
    get standard() {
        return true;
    }
    constructor({ wallet }){
        super();
        _StandardWalletAdapter_instances.add(this);
        _StandardWalletAdapter_account.set(this, void 0);
        _StandardWalletAdapter_publicKey.set(this, void 0);
        _StandardWalletAdapter_connecting.set(this, void 0);
        _StandardWalletAdapter_disconnecting.set(this, void 0);
        _StandardWalletAdapter_off.set(this, void 0);
        _StandardWalletAdapter_supportedTransactionVersions.set(this, void 0);
        _StandardWalletAdapter_wallet.set(this, void 0);
        _StandardWalletAdapter_readyState.set(this, typeof window === 'undefined' || typeof document === 'undefined' ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed);
        _StandardWalletAdapter_changed.set(this, (properties)=>{
            // If accounts have changed on the wallet, reflect this on the adapter.
            if ('accounts' in properties) {
                const account = __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").accounts[0];
                // If the adapter isn't connected, or is disconnecting, or the first account hasn't changed, do nothing.
                if (__classPrivateFieldGet(this, _StandardWalletAdapter_account, "f") && !__classPrivateFieldGet(this, _StandardWalletAdapter_disconnecting, "f") && account !== __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f")) {
                    // If there's a connected account, connect the adapter. Otherwise, disconnect it.
                    if (account) {
                        // Connect the adapter.
                        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_connected).call(this, account);
                    } else {
                        // Emit an error because the wallet spontaneously disconnected.
                        this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectedError"]());
                        // Disconnect the adapter.
                        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_disconnected).call(this);
                    }
                }
            }
            // After reflecting account changes, if features have changed on the wallet, reflect this on the adapter.
            if ('features' in properties) {
                __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_reset).call(this);
            }
        });
        __classPrivateFieldSet(this, _StandardWalletAdapter_wallet, wallet, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_account, null, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_publicKey, null, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_connecting, false, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_disconnecting, false, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_off, __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardEvents"]].on('change', __classPrivateFieldGet(this, _StandardWalletAdapter_changed, "f")), "f");
        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_reset).call(this);
    }
    destroy() {
        __classPrivateFieldSet(this, _StandardWalletAdapter_account, null, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_publicKey, null, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_connecting, false, "f");
        __classPrivateFieldSet(this, _StandardWalletAdapter_disconnecting, false, "f");
        const off = __classPrivateFieldGet(this, _StandardWalletAdapter_off, "f");
        if (off) {
            __classPrivateFieldSet(this, _StandardWalletAdapter_off, null, "f");
            off();
        }
    }
    async autoConnect() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_connect).call(this, {
            silent: true
        });
    }
    async connect() {
        return __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_connect).call(this);
    }
    async disconnect() {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$disconnect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardDisconnect"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features) {
            try {
                __classPrivateFieldSet(this, _StandardWalletAdapter_disconnecting, true, "f");
                await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$disconnect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardDisconnect"]].disconnect();
            } catch (error) {
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectionError"](error?.message, error));
            } finally{
                __classPrivateFieldSet(this, _StandardWalletAdapter_disconnecting, false, "f");
            }
        }
        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_disconnected).call(this);
    }
    async sendTransaction(transaction, connection, options = {}) {
        try {
            const account = __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f");
            if (!account) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            let feature;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features) {
                if (account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"])) {
                    feature = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"];
                } else if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features && account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"])) {
                    feature = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"];
                } else {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
                }
            } else if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features) {
                if (!account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"])) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
                feature = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"];
            } else {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"]();
            }
            const chain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$endpoint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChainForEndpoint"])(connection.rpcEndpoint);
            if (!account.chains.includes(chain)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"]();
            try {
                const { signers, ...sendOptions } = options;
                let serializedTransaction;
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction)) {
                    signers?.length && transaction.sign(signers);
                    serializedTransaction = transaction.serialize();
                } else {
                    transaction = await this.prepareTransaction(transaction, connection, sendOptions);
                    signers?.length && transaction.partialSign(...signers);
                    serializedTransaction = new Uint8Array(transaction.serialize({
                        requireAllSignatures: false,
                        verifySignatures: false
                    }));
                }
                if (feature === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"]) {
                    const [output] = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"]].signAndSendTransaction({
                        account,
                        chain,
                        transaction: serializedTransaction,
                        options: {
                            preflightCommitment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$commitment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCommitment"])(sendOptions.preflightCommitment || connection.commitment),
                            skipPreflight: sendOptions.skipPreflight,
                            maxRetries: sendOptions.maxRetries,
                            minContextSlot: sendOptions.minContextSlot
                        }
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f$bs58$2f$src$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].encode(output.signature);
                } else {
                    const [output] = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"]].signTransaction({
                        account,
                        chain,
                        transaction: serializedTransaction,
                        options: {
                            preflightCommitment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$commitment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCommitment"])(sendOptions.preflightCommitment || connection.commitment),
                            minContextSlot: sendOptions.minContextSlot
                        }
                    });
                    return await connection.sendRawTransaction(output.signedTransaction, {
                        ...sendOptions,
                        preflightCommitment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$util$2f$lib$2f$esm$2f$commitment$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCommitment"])(sendOptions.preflightCommitment || connection.commitment)
                    });
                }
            } catch (error) {
                if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletError"]) throw error;
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
}
_StandardWalletAdapter_account = new WeakMap(), _StandardWalletAdapter_publicKey = new WeakMap(), _StandardWalletAdapter_connecting = new WeakMap(), _StandardWalletAdapter_disconnecting = new WeakMap(), _StandardWalletAdapter_off = new WeakMap(), _StandardWalletAdapter_supportedTransactionVersions = new WeakMap(), _StandardWalletAdapter_wallet = new WeakMap(), _StandardWalletAdapter_readyState = new WeakMap(), _StandardWalletAdapter_changed = new WeakMap(), _StandardWalletAdapter_instances = new WeakSet(), _StandardWalletAdapter_connect = async function _StandardWalletAdapter_connect(input) {
    try {
        if (this.connected || this.connecting) return;
        if (__classPrivateFieldGet(this, _StandardWalletAdapter_readyState, "f") !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotReadyError"]();
        __classPrivateFieldSet(this, _StandardWalletAdapter_connecting, true, "f");
        if (!__classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").accounts.length) {
            try {
                await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardConnect"]].connect(input);
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectionError"](error?.message, error);
            }
        }
        const account = __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").accounts[0];
        if (!account) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_connected).call(this, account);
    } catch (error) {
        this.emit('error', error);
        throw error;
    } finally{
        __classPrivateFieldSet(this, _StandardWalletAdapter_connecting, false, "f");
    }
}, _StandardWalletAdapter_connected = function _StandardWalletAdapter_connected(account) {
    let publicKey;
    try {
        // Use account.address instead of account.publicKey since address could be a PDA
        publicKey = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](account.address);
    } catch (error) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletPublicKeyError"](error?.message, error);
    }
    __classPrivateFieldSet(this, _StandardWalletAdapter_account, account, "f");
    __classPrivateFieldSet(this, _StandardWalletAdapter_publicKey, publicKey, "f");
    __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_reset).call(this);
    this.emit('connect', publicKey);
}, _StandardWalletAdapter_disconnected = function _StandardWalletAdapter_disconnected() {
    __classPrivateFieldSet(this, _StandardWalletAdapter_account, null, "f");
    __classPrivateFieldSet(this, _StandardWalletAdapter_publicKey, null, "f");
    __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_reset).call(this);
    this.emit('disconnect');
}, _StandardWalletAdapter_reset = function _StandardWalletAdapter_reset() {
    const supportedTransactionVersions = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features ? __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"]].supportedTransactionVersions : __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"]].supportedTransactionVersions;
    __classPrivateFieldSet(this, _StandardWalletAdapter_supportedTransactionVersions, (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$wallet$2f$lib$2f$esm$2f$util$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["arraysEqual"])(supportedTransactionVersions, [
        'legacy'
    ]) ? null : new Set(supportedTransactionVersions), "f");
    if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features && __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f")?.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"])) {
        this.signTransaction = __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_signTransaction);
        this.signAllTransactions = __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_signAllTransactions);
    } else {
        delete this.signTransaction;
        delete this.signAllTransactions;
    }
    if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features && __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f")?.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"])) {
        this.signMessage = __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_signMessage);
    } else {
        delete this.signMessage;
    }
    if (__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signIn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignIn"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features) {
        this.signIn = __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_signIn);
    } else {
        delete this.signIn;
    }
}, _StandardWalletAdapter_signTransaction = async function _StandardWalletAdapter_signTransaction(transaction) {
    try {
        const account = __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f");
        if (!account) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
        if (!(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"]();
        if (!account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"])) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
        try {
            const signedTransactions = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"]].signTransaction({
                account,
                transaction: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction) ? transaction.serialize() : new Uint8Array(transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false
                }))
            });
            const serializedTransaction = signedTransactions[0].signedTransaction;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction) ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VersionedTransaction"].deserialize(serializedTransaction) : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].from(serializedTransaction);
        } catch (error) {
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletError"]) throw error;
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
        }
    } catch (error) {
        this.emit('error', error);
        throw error;
    }
}, _StandardWalletAdapter_signAllTransactions = async function _StandardWalletAdapter_signAllTransactions(transactions) {
    try {
        const account = __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f");
        if (!account) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
        if (!(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"]();
        if (!account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"])) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
        try {
            const signedTransactions = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"]].signTransaction(...transactions.map((transaction)=>({
                    account,
                    transaction: (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction) ? transaction.serialize() : new Uint8Array(transaction.serialize({
                        requireAllSignatures: false,
                        verifySignatures: false
                    }))
                })));
            return transactions.map((transaction, index)=>{
                const signedTransaction = signedTransactions[index].signedTransaction;
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction) ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VersionedTransaction"].deserialize(signedTransaction) : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Transaction"].from(signedTransaction);
            });
        } catch (error) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
        }
    } catch (error) {
        this.emit('error', error);
        throw error;
    }
}, _StandardWalletAdapter_signMessage = async function _StandardWalletAdapter_signMessage(message) {
    try {
        const account = __classPrivateFieldGet(this, _StandardWalletAdapter_account, "f");
        if (!account) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
        if (!(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"]();
        if (!account.features.includes(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"])) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
        try {
            const signedMessages = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"]].signMessage({
                account,
                message
            });
            return signedMessages[0].signature;
        } catch (error) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignMessageError"](error?.message, error);
        }
    } catch (error) {
        this.emit('error', error);
        throw error;
    }
}, _StandardWalletAdapter_signIn = async function _StandardWalletAdapter_signIn(input = {}) {
    try {
        if (!(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signIn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignIn"] in __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"]();
        let output;
        try {
            [output] = await __classPrivateFieldGet(this, _StandardWalletAdapter_wallet, "f").features[__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signIn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignIn"]].signIn(input);
        } catch (error) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignInError"](error?.message, error);
        }
        if (!output) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignInError"]();
        __classPrivateFieldGet(this, _StandardWalletAdapter_instances, "m", _StandardWalletAdapter_connected).call(this, output.account);
        return output;
    } catch (error) {
        this.emit('error', error);
        throw error;
    }
}; //# sourceMappingURL=adapter.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/lib/esm/useStandardWalletAdapters.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStandardWalletAdapters",
    ()=>useStandardWalletAdapters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/@solana/wallet-standard-wallet-adapter-base/lib/esm/types.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-wallet-adapter-react/node_modules/@solana/wallet-standard-wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$app$2f$lib$2f$esm$2f$wallets$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/app/lib/esm/wallets.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
;
;
function useStandardWalletAdapters(adapters) {
    const warnings = useConstant({
        "useStandardWalletAdapters.useConstant[warnings]": ()=>new Set()
    }["useStandardWalletAdapters.useConstant[warnings]"]);
    const { get, on } = useConstant({
        "useStandardWalletAdapters.useConstant": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$app$2f$lib$2f$esm$2f$wallets$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEPRECATED_getWallets"])()
    }["useStandardWalletAdapters.useConstant"]);
    const [standardAdapters, setStandardAdapters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useStandardWalletAdapters.useState": ()=>wrapWalletsWithAdapters(get())
    }["useStandardWalletAdapters.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStandardWalletAdapters.useEffect": ()=>{
            const listeners = [
                on('register', {
                    "useStandardWalletAdapters.useEffect": (...wallets)=>setStandardAdapters({
                            "useStandardWalletAdapters.useEffect": (standardAdapters)=>[
                                    ...standardAdapters,
                                    ...wrapWalletsWithAdapters(wallets)
                                ]
                        }["useStandardWalletAdapters.useEffect"])
                }["useStandardWalletAdapters.useEffect"]),
                on('unregister', {
                    "useStandardWalletAdapters.useEffect": (...wallets)=>setStandardAdapters({
                            "useStandardWalletAdapters.useEffect": (standardAdapters)=>standardAdapters.filter({
                                    "useStandardWalletAdapters.useEffect": (standardAdapter)=>wallets.some({
                                            "useStandardWalletAdapters.useEffect": (wallet)=>wallet === standardAdapter.wallet
                                        }["useStandardWalletAdapters.useEffect"])
                                }["useStandardWalletAdapters.useEffect"])
                        }["useStandardWalletAdapters.useEffect"])
                }["useStandardWalletAdapters.useEffect"])
            ];
            return ({
                "useStandardWalletAdapters.useEffect": ()=>listeners.forEach({
                        "useStandardWalletAdapters.useEffect": (off)=>off()
                    }["useStandardWalletAdapters.useEffect"])
            })["useStandardWalletAdapters.useEffect"];
        }
    }["useStandardWalletAdapters.useEffect"], [
        on
    ]);
    const prevStandardAdapters = usePrevious(standardAdapters);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStandardWalletAdapters.useEffect": ()=>{
            if (!prevStandardAdapters) return;
            const currentAdapters = new Set(standardAdapters);
            const removedAdapters = new Set(prevStandardAdapters.filter({
                "useStandardWalletAdapters.useEffect": (previousAdapter)=>!currentAdapters.has(previousAdapter)
            }["useStandardWalletAdapters.useEffect"]));
            removedAdapters.forEach({
                "useStandardWalletAdapters.useEffect": (adapter)=>adapter.destroy()
            }["useStandardWalletAdapters.useEffect"]);
        }
    }["useStandardWalletAdapters.useEffect"], [
        prevStandardAdapters,
        standardAdapters
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStandardWalletAdapters.useEffect": ()=>({
                "useStandardWalletAdapters.useEffect": ()=>standardAdapters.forEach({
                        "useStandardWalletAdapters.useEffect": (adapter)=>adapter.destroy()
                    }["useStandardWalletAdapters.useEffect"])
            })["useStandardWalletAdapters.useEffect"]
    }["useStandardWalletAdapters.useEffect"], []);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStandardWalletAdapters.useMemo": ()=>[
                ...standardAdapters,
                ...adapters.filter({
                    "useStandardWalletAdapters.useMemo": ({ name })=>{
                        if (standardAdapters.some({
                            "useStandardWalletAdapters.useMemo": (standardAdapter)=>standardAdapter.name === name
                        }["useStandardWalletAdapters.useMemo"])) {
                            if (!warnings.has(name)) {
                                warnings.add(name);
                                console.warn(`${name} was registered as a Standard Wallet. The Wallet Adapter for ${name} can be removed from your app.`);
                            }
                            return false;
                        }
                        return true;
                    }
                }["useStandardWalletAdapters.useMemo"])
            ]
    }["useStandardWalletAdapters.useMemo"], [
        standardAdapters,
        adapters,
        warnings
    ]);
}
function useConstant(fn) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    if (ref.current === undefined) {
        ref.current = {
            value: fn()
        };
    }
    return ref.current.value;
}
function usePrevious(state) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePrevious.useEffect": ()=>{
            ref.current = state;
        }
    }["usePrevious.useEffect"]);
    return ref.current;
}
function wrapWalletsWithAdapters(wallets) {
    return wallets.filter(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWalletAdapterCompatibleWallet"]).map((wallet)=>new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$react$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardWalletAdapter"]({
            wallet
        }));
} //# sourceMappingURL=useStandardWalletAdapters.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/useWalletModal.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletModalContext",
    ()=>WalletModalContext,
    "useWalletModal",
    ()=>useWalletModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const DEFAULT_CONTEXT = {
    setVisible (_open) {
        console.error(constructMissingProviderErrorMessage('call', 'setVisible'));
    },
    visible: false
};
Object.defineProperty(DEFAULT_CONTEXT, 'visible', {
    get () {
        console.error(constructMissingProviderErrorMessage('read', 'visible'));
        return false;
    }
});
function constructMissingProviderErrorMessage(action, valueName) {
    return 'You have tried to ' + ` ${action} "${valueName}"` + ' on a WalletModalContext without providing one.' + ' Make sure to render a WalletModalProvider' + ' as an ancestor of the component that uses ' + 'WalletModalContext';
}
const WalletModalContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(DEFAULT_CONTEXT);
function useWalletModal() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(WalletModalContext);
} //# sourceMappingURL=useWalletModal.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/Collapse.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Collapse",
    ()=>Collapse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const Collapse = ({ id, children, expanded = false })=>{
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const instant = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const transition = 'height 250ms ease-out';
    const openCollapse = ()=>{
        const node = ref.current;
        if (!node) return;
        requestAnimationFrame(()=>{
            node.style.height = node.scrollHeight + 'px';
        });
    };
    const closeCollapse = ()=>{
        const node = ref.current;
        if (!node) return;
        requestAnimationFrame(()=>{
            node.style.height = node.offsetHeight + 'px';
            node.style.overflow = 'hidden';
            requestAnimationFrame(()=>{
                node.style.height = '0';
            });
        });
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "Collapse.useLayoutEffect": ()=>{
            if (expanded) {
                openCollapse();
            } else {
                closeCollapse();
            }
        }
    }["Collapse.useLayoutEffect"], [
        expanded
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "Collapse.useLayoutEffect": ()=>{
            const node = ref.current;
            if (!node) return;
            function handleComplete() {
                if (!node) return;
                node.style.overflow = expanded ? 'initial' : 'hidden';
                if (expanded) {
                    node.style.height = 'auto';
                }
            }
            function handleTransitionEnd(event) {
                if (node && event.target === node && event.propertyName === 'height') {
                    handleComplete();
                }
            }
            if (instant.current) {
                handleComplete();
                instant.current = false;
            }
            node.addEventListener('transitionend', handleTransitionEnd);
            return ({
                "Collapse.useLayoutEffect": ()=>node.removeEventListener('transitionend', handleTransitionEnd)
            })["Collapse.useLayoutEffect"];
        }
    }["Collapse.useLayoutEffect"], [
        expanded
    ]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        className: "wallet-adapter-collapse",
        id: id,
        ref: ref,
        role: "region",
        style: {
            height: 0,
            transition: instant.current ? undefined : transition
        }
    }, children);
}; //# sourceMappingURL=Collapse.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/Button.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const Button = (props)=>{
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("button", {
        className: `wallet-adapter-button ${props.className || ''}`,
        disabled: props.disabled,
        style: props.style,
        onClick: props.onClick,
        tabIndex: props.tabIndex || 0,
        type: "button"
    }, props.startIcon && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("i", {
        className: "wallet-adapter-button-start-icon"
    }, props.startIcon), props.children, props.endIcon && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("i", {
        className: "wallet-adapter-button-end-icon"
    }, props.endIcon));
}; //# sourceMappingURL=Button.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletIcon.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletIcon",
    ()=>WalletIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const WalletIcon = ({ wallet, ...props })=>{
    return wallet && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("img", {
        src: wallet.adapter.icon,
        alt: `${wallet.adapter.name} icon`,
        ...props
    });
}; //# sourceMappingURL=WalletIcon.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletListItem.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletListItem",
    ()=>WalletListItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/Button.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletIcon.js [app-client] (ecmascript)");
;
;
;
;
const WalletListItem = ({ handleClick, tabIndex, wallet })=>{
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("li", null, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
        onClick: handleClick,
        startIcon: __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletIcon"], {
            wallet: wallet
        }),
        tabIndex: tabIndex
    }, wallet.adapter.name, wallet.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("span", null, "Detected")));
}; //# sourceMappingURL=WalletListItem.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletSVG.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletSVG",
    ()=>WalletSVG
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
const WalletSVG = ()=>{
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("svg", {
        width: "97",
        height: "96",
        viewBox: "0 0 97 96",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("circle", {
        cx: "48.5",
        cy: "48",
        r: "48",
        fill: "url(#paint0_linear_880_5115)",
        fillOpacity: "0.1"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("circle", {
        cx: "48.5",
        cy: "48",
        r: "47",
        stroke: "url(#paint1_linear_880_5115)",
        strokeOpacity: "0.4",
        strokeWidth: "2"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("g", {
        clipPath: "url(#clip0_880_5115)"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M65.5769 28.1523H31.4231C27.6057 28.1523 24.5 31.258 24.5 35.0754V60.9215C24.5 64.7389 27.6057 67.8446 31.4231 67.8446H65.5769C69.3943 67.8446 72.5 64.7389 72.5 60.9215V35.0754C72.5 31.258 69.3943 28.1523 65.5769 28.1523ZM69.7308 52.1523H59.5769C57.2865 52.1523 55.4231 50.289 55.4231 47.9985C55.4231 45.708 57.2864 43.8446 59.5769 43.8446H69.7308V52.1523ZM69.7308 41.0754H59.5769C55.7595 41.0754 52.6539 44.1811 52.6539 47.9985C52.6539 51.8159 55.7595 54.9215 59.5769 54.9215H69.7308V60.9215C69.7308 63.2119 67.8674 65.0754 65.5769 65.0754H31.4231C29.1327 65.0754 27.2692 63.212 27.2692 60.9215V35.0754C27.2692 32.785 29.1326 30.9215 31.4231 30.9215H65.5769C67.8673 30.9215 69.7308 32.7849 69.7308 35.0754V41.0754Z",
        fill: "url(#paint2_linear_880_5115)"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M61.4231 46.6172H59.577C58.8123 46.6172 58.1924 47.2371 58.1924 48.0018C58.1924 48.7665 58.8123 49.3863 59.577 49.3863H61.4231C62.1878 49.3863 62.8077 48.7664 62.8077 48.0018C62.8077 47.2371 62.1878 46.6172 61.4231 46.6172Z",
        fill: "url(#paint3_linear_880_5115)"
    })), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("defs", null, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("linearGradient", {
        id: "paint0_linear_880_5115",
        x1: "3.41664",
        y1: "98.0933",
        x2: "103.05",
        y2: "8.42498",
        gradientUnits: "userSpaceOnUse"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        stopColor: "#9945FF"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.14",
        stopColor: "#8A53F4"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.42",
        stopColor: "#6377D6"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.79",
        stopColor: "#24B0A7"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.99",
        stopColor: "#00D18C"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "1",
        stopColor: "#00D18C"
    })), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("linearGradient", {
        id: "paint1_linear_880_5115",
        x1: "3.41664",
        y1: "98.0933",
        x2: "103.05",
        y2: "8.42498",
        gradientUnits: "userSpaceOnUse"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        stopColor: "#9945FF"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.14",
        stopColor: "#8A53F4"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.42",
        stopColor: "#6377D6"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.79",
        stopColor: "#24B0A7"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.99",
        stopColor: "#00D18C"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "1",
        stopColor: "#00D18C"
    })), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("linearGradient", {
        id: "paint2_linear_880_5115",
        x1: "25.9583",
        y1: "68.7101",
        x2: "67.2337",
        y2: "23.7879",
        gradientUnits: "userSpaceOnUse"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        stopColor: "#9945FF"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.14",
        stopColor: "#8A53F4"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.42",
        stopColor: "#6377D6"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.79",
        stopColor: "#24B0A7"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.99",
        stopColor: "#00D18C"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "1",
        stopColor: "#00D18C"
    })), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("linearGradient", {
        id: "paint3_linear_880_5115",
        x1: "58.3326",
        y1: "49.4467",
        x2: "61.0002",
        y2: "45.4453",
        gradientUnits: "userSpaceOnUse"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        stopColor: "#9945FF"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.14",
        stopColor: "#8A53F4"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.42",
        stopColor: "#6377D6"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.79",
        stopColor: "#24B0A7"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "0.99",
        stopColor: "#00D18C"
    }), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("stop", {
        offset: "1",
        stopColor: "#00D18C"
    })), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("clipPath", {
        id: "clip0_880_5115"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("rect", {
        width: "48",
        height: "48",
        fill: "white",
        transform: "translate(24.5 24)"
    }))));
}; //# sourceMappingURL=WalletSVG.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletModal.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletModal",
    ()=>WalletModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$Collapse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/Collapse.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletListItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletListItem.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletSVG$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletSVG.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$useWalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/useWalletModal.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
const WalletModal = ({ className = '', container = 'body' })=>{
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { wallets, select } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const { setVisible } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$useWalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWalletModal"])();
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [fadeIn, setFadeIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [portal, setPortal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [listedWallets, collapsedWallets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "WalletModal.useMemo": ()=>{
            const installed = [];
            const notInstalled = [];
            for (const wallet of wallets){
                if (wallet.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed) {
                    installed.push(wallet);
                } else {
                    notInstalled.push(wallet);
                }
            }
            return installed.length ? [
                installed,
                notInstalled
            ] : [
                notInstalled,
                []
            ];
        }
    }["WalletModal.useMemo"], [
        wallets
    ]);
    const hideModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletModal.useCallback[hideModal]": ()=>{
            setFadeIn(false);
            setTimeout({
                "WalletModal.useCallback[hideModal]": ()=>setVisible(false)
            }["WalletModal.useCallback[hideModal]"], 150);
        }
    }["WalletModal.useCallback[hideModal]"], [
        setVisible
    ]);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletModal.useCallback[handleClose]": (event)=>{
            event.preventDefault();
            hideModal();
        }
    }["WalletModal.useCallback[handleClose]"], [
        hideModal
    ]);
    const handleWalletClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletModal.useCallback[handleWalletClick]": (event, walletName)=>{
            select(walletName);
            handleClose(event);
        }
    }["WalletModal.useCallback[handleWalletClick]"], [
        select,
        handleClose
    ]);
    const handleCollapseClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletModal.useCallback[handleCollapseClick]": ()=>setExpanded(!expanded)
    }["WalletModal.useCallback[handleCollapseClick]"], [
        expanded
    ]);
    const handleTabKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletModal.useCallback[handleTabKey]": (event)=>{
            const node = ref.current;
            if (!node) return;
            // here we query all focusable elements
            const focusableElements = node.querySelectorAll('button');
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const firstElement = focusableElements[0];
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey) {
                // if going backward by pressing tab and firstElement is active, shift focus to last focusable element
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else {
                // if going forward by pressing tab and lastElement is active, shift focus to first focusable element
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        }
    }["WalletModal.useCallback[handleTabKey]"], [
        ref
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "WalletModal.useLayoutEffect": ()=>{
            const handleKeyDown = {
                "WalletModal.useLayoutEffect.handleKeyDown": (event)=>{
                    if (event.key === 'Escape') {
                        hideModal();
                    } else if (event.key === 'Tab') {
                        handleTabKey(event);
                    }
                }
            }["WalletModal.useLayoutEffect.handleKeyDown"];
            // Get original overflow
            const { overflow } = window.getComputedStyle(document.body);
            // Hack to enable fade in animation after mount
            setTimeout({
                "WalletModal.useLayoutEffect": ()=>setFadeIn(true)
            }["WalletModal.useLayoutEffect"], 0);
            // Prevent scrolling on mount
            document.body.style.overflow = 'hidden';
            // Listen for keydown events
            window.addEventListener('keydown', handleKeyDown, false);
            return ({
                "WalletModal.useLayoutEffect": ()=>{
                    // Re-enable scrolling when component unmounts
                    document.body.style.overflow = overflow;
                    window.removeEventListener('keydown', handleKeyDown, false);
                }
            })["WalletModal.useLayoutEffect"];
        }
    }["WalletModal.useLayoutEffect"], [
        hideModal,
        handleTabKey
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "WalletModal.useLayoutEffect": ()=>setPortal(document.querySelector(container))
    }["WalletModal.useLayoutEffect"], [
        container
    ]);
    return portal && (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        "aria-labelledby": "wallet-adapter-modal-title",
        "aria-modal": "true",
        className: `wallet-adapter-modal ${fadeIn && 'wallet-adapter-modal-fade-in'} ${className}`,
        ref: ref,
        role: "dialog"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        className: "wallet-adapter-modal-container"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        className: "wallet-adapter-modal-wrapper"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("button", {
        onClick: handleClose,
        className: "wallet-adapter-modal-button-close"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("svg", {
        width: "14",
        height: "14"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z"
    }))), listedWallets.length ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("h1", {
        className: "wallet-adapter-modal-title"
    }, "Connect a wallet on Solana to continue"), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("ul", {
        className: "wallet-adapter-modal-list"
    }, listedWallets.map((wallet)=>__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletListItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletListItem"], {
            key: wallet.adapter.name,
            handleClick: (event)=>handleWalletClick(event, wallet.adapter.name),
            wallet: wallet
        })), collapsedWallets.length ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$Collapse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Collapse"], {
        expanded: expanded,
        id: "wallet-adapter-modal-collapse"
    }, collapsedWallets.map((wallet)=>__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletListItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletListItem"], {
            key: wallet.adapter.name,
            handleClick: (event)=>handleWalletClick(event, wallet.adapter.name),
            tabIndex: expanded ? 0 : -1,
            wallet: wallet
        }))) : null), collapsedWallets.length ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("button", {
        className: "wallet-adapter-modal-list-more",
        onClick: handleCollapseClick,
        tabIndex: 0
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("span", null, expanded ? 'Less ' : 'More ', "options"), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("svg", {
        width: "13",
        height: "7",
        viewBox: "0 0 13 7",
        xmlns: "http://www.w3.org/2000/svg",
        className: `${expanded ? 'wallet-adapter-modal-list-more-icon-rotate' : ''}`
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z"
    }))) : null) : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("h1", {
        className: "wallet-adapter-modal-title"
    }, "You'll need a wallet on Solana to continue"), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        className: "wallet-adapter-modal-middle"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletSVG$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSVG"], null)), collapsedWallets.length ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, null, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("button", {
        className: "wallet-adapter-modal-list-more",
        onClick: handleCollapseClick,
        tabIndex: 0
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("span", null, expanded ? 'Hide ' : 'Already have a wallet? View ', "options"), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("svg", {
        width: "13",
        height: "7",
        viewBox: "0 0 13 7",
        xmlns: "http://www.w3.org/2000/svg",
        className: `${expanded ? 'wallet-adapter-modal-list-more-icon-rotate' : ''}`
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("path", {
        d: "M0.71418 1.626L5.83323 6.26188C5.91574 6.33657 6.0181 6.39652 6.13327 6.43762C6.24844 6.47872 6.37371 6.5 6.50048 6.5C6.62725 6.5 6.75252 6.47872 6.8677 6.43762C6.98287 6.39652 7.08523 6.33657 7.16774 6.26188L12.2868 1.626C12.7753 1.1835 12.3703 0.5 11.6195 0.5H1.37997C0.629216 0.5 0.224175 1.1835 0.71418 1.626Z"
    }))), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$Collapse$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Collapse"], {
        expanded: expanded,
        id: "wallet-adapter-modal-collapse"
    }, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("ul", {
        className: "wallet-adapter-modal-list"
    }, collapsedWallets.map((wallet)=>__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletListItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletListItem"], {
            key: wallet.adapter.name,
            handleClick: (event)=>handleWalletClick(event, wallet.adapter.name),
            tabIndex: expanded ? 0 : -1,
            wallet: wallet
        }))))) : null))), __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement("div", {
        className: "wallet-adapter-modal-overlay",
        onMouseDown: handleClose
    })), portal);
}; //# sourceMappingURL=WalletModal.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletModalProvider.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletModalProvider",
    ()=>WalletModalProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$useWalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/useWalletModal.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletModal.js [app-client] (ecmascript)");
;
;
;
const WalletModalProvider = ({ children, ...props })=>{
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$useWalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletModalContext"].Provider, {
        value: {
            visible,
            setVisible
        }
    }, children, visible && __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].createElement(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletModal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletModal"], {
        ...props
    }));
}; //# sourceMappingURL=WalletModalProvider.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-phantom/lib/esm/adapter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PhantomWalletAdapter",
    ()=>PhantomWalletAdapter,
    "PhantomWalletName",
    ()=>PhantomWalletName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$signer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/signer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
;
;
const PhantomWalletName = 'Phantom';
class PhantomWalletAdapter extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$signer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseMessageSignerWalletAdapter"] {
    constructor(config = {}){
        super();
        this.name = PhantomWalletName;
        this.url = 'https://phantom.app';
        this.icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg==';
        this.supportedTransactionVersions = new Set([
            'legacy',
            0
        ]);
        this._readyState = typeof window === 'undefined' || typeof document === 'undefined' ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].NotDetected;
        this._disconnected = ()=>{
            const wallet = this._wallet;
            if (wallet) {
                wallet.off('disconnect', this._disconnected);
                wallet.off('accountChanged', this._accountChanged);
                this._wallet = null;
                this._publicKey = null;
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectedError"]());
                this.emit('disconnect');
            }
        };
        this._accountChanged = (newPublicKey)=>{
            const publicKey = this._publicKey;
            if (!publicKey) return;
            try {
                newPublicKey = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](newPublicKey.toBytes());
            } catch (error) {
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletPublicKeyError"](error?.message, error));
                return;
            }
            if (publicKey.equals(newPublicKey)) return;
            this._publicKey = newPublicKey;
            this.emit('connect', newPublicKey);
        };
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        if (this._readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported) {
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["isIosAndRedirectable"])()) {
                // when in iOS (not webview), set Phantom as loadable instead of checking for install
                this._readyState = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable;
                this.emit('readyStateChange', this._readyState);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["scopePollingDetectionStrategy"])(()=>{
                    if (window.phantom?.solana?.isPhantom || window.solana?.isPhantom) {
                        this._readyState = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed;
                        this.emit('readyStateChange', this._readyState);
                        return true;
                    }
                    return false;
                });
            }
        }
    }
    get publicKey() {
        return this._publicKey;
    }
    get connecting() {
        return this._connecting;
    }
    get readyState() {
        return this._readyState;
    }
    async autoConnect() {
        // Skip autoconnect in the Loadable state
        // We can't redirect to a universal link without user input
        if (this.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed) {
            await this.connect();
        }
    }
    async connect() {
        try {
            if (this.connected || this.connecting) return;
            if (this.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable) {
                // redirect to the Phantom /browse universal link
                // this will open the current URL in the Phantom in-wallet browser
                const url = encodeURIComponent(window.location.href);
                const ref = encodeURIComponent(window.location.origin);
                window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
                return;
            }
            if (this.readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotReadyError"]();
            this._connecting = true;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.phantom?.solana || window.solana;
            if (!wallet.isConnected) {
                try {
                    await wallet.connect();
                } catch (error) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectionError"](error?.message, error);
                }
            }
            if (!wallet.publicKey) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletAccountError"]();
            let publicKey;
            try {
                publicKey = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](wallet.publicKey.toBytes());
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletPublicKeyError"](error?.message, error);
            }
            wallet.on('disconnect', this._disconnected);
            wallet.on('accountChanged', this._accountChanged);
            this._wallet = wallet;
            this._publicKey = publicKey;
            this.emit('connect', publicKey);
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally{
            this._connecting = false;
        }
    }
    async disconnect() {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);
            wallet.off('accountChanged', this._accountChanged);
            this._wallet = null;
            this._publicKey = null;
            try {
                await wallet.disconnect();
            } catch (error) {
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectionError"](error?.message, error));
            }
        }
        this.emit('disconnect');
    }
    async sendTransaction(transaction, connection, options = {}) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                const { signers, ...sendOptions } = options;
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction)) {
                    signers?.length && transaction.sign(signers);
                } else {
                    transaction = await this.prepareTransaction(transaction, connection, sendOptions);
                    signers?.length && transaction.partialSign(...signers);
                }
                sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;
                const { signature } = await wallet.signAndSendTransaction(transaction, sendOptions);
                return signature;
            } catch (error) {
                if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletError"]) throw error;
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signTransaction(transaction) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                return await wallet.signTransaction(transaction) || transaction;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signAllTransactions(transactions) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                return await wallet.signAllTransactions(transactions) || transactions;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signMessage(message) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                const { signature } = await wallet.signMessage(message);
                return signature;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignMessageError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
} //# sourceMappingURL=adapter.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/icon.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** @internal */ __turbopack_context__.s([
    "icon",
    ()=>icon
]);
const icon = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMxIiB2aWV3Qm94PSIwIDAgMzEgMzEiIHdpZHRoPSIzMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGxpbmVhckdyYWRpZW50IGlkPSJhIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjIwLjI1IiB4Mj0iMjYuNTcxIiB5MT0iMjcuMTczIiB5Mj0iMTkuODU4Ij48c3RvcCBvZmZzZXQ9Ii4wOCIgc3RvcC1jb2xvcj0iIzk5NDVmZiIvPjxzdG9wIG9mZnNldD0iLjMiIHN0b3AtY29sb3I9IiM4NzUyZjMiLz48c3RvcCBvZmZzZXQ9Ii41IiBzdG9wLWNvbG9yPSIjNTQ5N2Q1Ii8+PHN0b3Agb2Zmc2V0PSIuNiIgc3RvcC1jb2xvcj0iIzQzYjRjYSIvPjxzdG9wIG9mZnNldD0iLjcyIiBzdG9wLWNvbG9yPSIjMjhlMGI5Ii8+PHN0b3Agb2Zmc2V0PSIuOTciIHN0b3AtY29sb3I9IiMxOWZiOWIiLz48L2xpbmVhckdyYWRpZW50PjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjA5NCI+PHBhdGggZD0ibTI2LjEwOSAzLjY0My05LjM2OSA2Ljk1OSAxLjczMy00LjEwNSA3LjYzNy0yLjg1M3oiIGZpbGw9IiNlMjc2MWIiIHN0cm9rZT0iI2UyNzYxYiIvPjxnIGZpbGw9IiNlNDc2MWIiIHN0cm9rZT0iI2U0NzYxYiI+PHBhdGggZD0ibTQuNDgxIDMuNjQzIDkuMjk0IDcuMDI0LTEuNjQ4LTQuMTcxem0xOC4yNTggMTYuMTMtMi40OTUgMy44MjMgNS4zMzkgMS40NjkgMS41MzUtNS4yMDctNC4zNzgtLjA4NXptLTE5LjI0Ny4wODUgMS41MjUgNS4yMDcgNS4zMzktMS40NjktMi40OTUtMy44MjN6Ii8+PHBhdGggZD0ibTEwLjA1NSAxMy4zMTMtMS40ODggMi4yNTEgNS4zMDEuMjM1LS4xODgtNS42OTd6bTEwLjQ4IDAtMy42NzItMy4yNzctLjEyMiA1Ljc2MyA1LjI5Mi0uMjM1LTEuNDk3LTIuMjUxem0tMTAuMTc4IDEwLjI4MyAzLjE4My0xLjU1NC0yLjc0OS0yLjE0Ny0uNDMzIDMuNzAxem02LjY5NS0xLjU1NCAzLjE5MiAxLjU1NC0uNDQzLTMuNzAxeiIvPjwvZz48cGF0aCBkPSJtMjAuMjQ0IDIzLjU5Ni0zLjE5Mi0xLjU1NC4yNTQgMi4wODEtLjAyOC44NzZ6bS05Ljg4NyAwIDIuOTY2IDEuNDAzLS4wMTktLjg3Ni4yMzUtMi4wODEtMy4xODMgMS41NTR6IiBmaWxsPSIjZDdjMWIzIiBzdHJva2U9IiNkN2MxYjMiLz48cGF0aCBkPSJtMTMuMzY5IDE4LjUyMS0yLjY1NS0uNzgxIDEuODc0LS44NTd6bTMuODUxIDAgLjc4MS0xLjYzOCAxLjg4My44NTctMi42NjUuNzgxeiIgZmlsbD0iIzIzMzQ0NyIgc3Ryb2tlPSIjMjMzNDQ3Ii8+PHBhdGggZD0ibTEwLjM1NyAyMy41OTYuNDUyLTMuODIzLTIuOTQ3LjA4NXptOS40MzUtMy44MjMuNDUyIDMuODIzIDIuNDk1LTMuNzM4em0yLjI0MS00LjIwOS01LjI5Mi4yMzUuNDkgMi43MjEuNzgyLTEuNjM4IDEuODgzLjg1N3ptLTExLjMxOCAyLjE3NSAxLjg4My0uODU3Ljc3MiAxLjYzOC40OTktMi43MjEtNS4zMDEtLjIzNXoiIGZpbGw9IiNjZDYxMTYiIHN0cm9rZT0iI2NkNjExNiIvPjxwYXRoIGQ9Im04LjU2NyAxNS41NjQgMi4yMjIgNC4zMzEtLjA3NS0yLjE1NnptMTEuMzI4IDIuMTc1LS4wOTQgMi4xNTYgMi4yMzItNC4zMzEtMi4xMzcgMi4xNzV6bS02LjAyNi0xLjk0LS40OTkgMi43MjEuNjIxIDMuMjExLjE0MS00LjIyOC0uMjY0LTEuNzA0em0yLjg3MiAwLS4yNTQgMS42OTUuMTEzIDQuMjM3LjYzMS0zLjIxMXoiIGZpbGw9IiNlNDc1MWYiIHN0cm9rZT0iI2U0NzUxZiIvPjxwYXRoIGQ9Im0xNy4yMyAxOC41Mi0uNjMxIDMuMjExLjQ1Mi4zMTEgMi43NS0yLjE0Ny4wOTQtMi4xNTZ6bS02LjUxNi0uNzgxLjA3NSAyLjE1NiAyLjc1IDIuMTQ3LjQ1Mi0uMzExLS42MjItMy4yMTF6IiBmaWxsPSIjZjY4NTFiIiBzdHJva2U9IiNmNjg1MWIiLz48cGF0aCBkPSJtMTcuMjc3IDI0Ljk5OS4wMjgtLjg3Ni0uMjM1LS4yMDdoLTMuNTVsLS4yMTcuMjA3LjAxOS44NzYtMi45NjYtMS40MDMgMS4wMzYuODQ4IDIuMSAxLjQ1OWgzLjYwNmwyLjEwOS0xLjQ1OSAxLjAzNi0uODQ4eiIgZmlsbD0iI2MwYWQ5ZSIgc3Ryb2tlPSIjYzBhZDllIi8+PHBhdGggZD0ibTE3LjA1MSAyMi4wNDItLjQ1Mi0uMzExaC0yLjYwOGwtLjQ1Mi4zMTEtLjIzNSAyLjA4MS4yMTctLjIwN2gzLjU1bC4yMzUuMjA3LS4yNTQtMi4wODF6IiBmaWxsPSIjMTYxNjE2IiBzdHJva2U9IiMxNjE2MTYiLz48cGF0aCBkPSJtMjYuNTA1IDExLjA1My44LTMuODQyLTEuMTk2LTMuNTY5LTkuMDU4IDYuNzIzIDMuNDg0IDIuOTQ3IDQuOTI1IDEuNDQxIDEuMDkyLTEuMjcxLS40NzEtLjMzOS43NTMtLjY4Ny0uNTg0LS40NTIuNzUzLS41NzQtLjQ5OS0uMzc3em0tMjMuMjExLTMuODQxLjggMy44NDItLjUwOC4zNzcuNzUzLjU3NC0uNTc0LjQ1Mi43NTMuNjg3LS40NzEuMzM5IDEuMDgzIDEuMjcxIDQuOTI1LTEuNDQxIDMuNDg0LTIuOTQ3LTkuMDU5LTYuNzIzeiIgZmlsbD0iIzc2M2QxNiIgc3Ryb2tlPSIjNzYzZDE2Ii8+PHBhdGggZD0ibTI1LjQ2IDE0Ljc1NC00LjkyNS0xLjQ0MSAxLjQ5NyAyLjI1MS0yLjIzMiA0LjMzMSAyLjkzOC0uMDM4aDQuMzc4bC0xLjY1Ny01LjEwNHptLTE1LjQwNS0xLjQ0MS00LjkyNSAxLjQ0MS0xLjYzOCA1LjEwNGg0LjM2OWwyLjkyOC4wMzgtMi4yMjItNC4zMzEgMS40ODgtMi4yNTF6bTYuNjg1IDIuNDg2LjMxMS01LjQzMyAxLjQzMS0zLjg3aC02LjM1NmwxLjQxMyAzLjg3LjMyOSA1LjQzMy4xMTMgMS43MTQuMDA5IDQuMjE5aDIuNjFsLjAxOS00LjIxOS4xMjItMS43MTR6IiBmaWxsPSIjZjY4NTFiIiBzdHJva2U9IiNmNjg1MWIiLz48L2c+PGNpcmNsZSBjeD0iMjMuNSIgY3k9IjIzLjUiIGZpbGw9IiMwMDAiIHI9IjYuNSIvPjxwYXRoIGQ9Im0yNy40NzMgMjUuNTQ1LTEuMzEgMS4zNjhjLS4wMjkuMDMtLjA2My4wNTMtLjEwMS4wN2EuMzEuMzEgMCAwIDEgLS4xMjEuMDI0aC02LjIwOWMtLjAzIDAtLjA1OS0uMDA4LS4wODMtLjAyNGEuMTUuMTUgMCAwIDEgLS4wNTYtLjA2NWMtLjAxMi0uMDI2LS4wMTUtLjA1Ni0uMDEtLjA4NHMuMDE4LS4wNTUuMDM5LS4wNzZsMS4zMTEtMS4zNjhjLjAyOC0uMDMuMDYzLS4wNTMuMTAxLS4wNjlhLjMxLjMxIDAgMCAxIC4xMjEtLjAyNWg2LjIwOGMuMDMgMCAuMDU5LjAwOC4wODMuMDI0YS4xNS4xNSAwIDAgMSAuMDU2LjA2NWMuMDEyLjAyNi4wMTUuMDU2LjAxLjA4NHMtLjAxOC4wNTUtLjAzOS4wNzZ6bS0xLjMxLTIuNzU2Yy0uMDI5LS4wMy0uMDYzLS4wNTMtLjEwMS0uMDdhLjMxLjMxIDAgMCAwIC0uMTIxLS4wMjRoLTYuMjA5Yy0uMDMgMC0uMDU5LjAwOC0uMDgzLjAyNHMtLjA0NC4wMzgtLjA1Ni4wNjUtLjAxNS4wNTYtLjAxLjA4NC4wMTguMDU1LjAzOS4wNzZsMS4zMTEgMS4zNjhjLjAyOC4wMy4wNjMuMDUzLjEwMS4wNjlhLjMxLjMxIDAgMCAwIC4xMjEuMDI1aDYuMjA4Yy4wMyAwIC4wNTktLjAwOC4wODMtLjAyNGEuMTUuMTUgMCAwIDAgLjA1Ni0uMDY1Yy4wMTItLjAyNi4wMTUtLjA1Ni4wMS0uMDg0cy0uMDE4LS4wNTUtLjAzOS0uMDc2em0tNi40MzEtLjk4M2g2LjIwOWEuMzEuMzEgMCAwIDAgLjEyMS0uMDI0Yy4wMzgtLjAxNi4wNzMtLjA0LjEwMS0uMDdsMS4zMS0xLjM2OGMuMDItLjAyMS4wMzQtLjA0Ny4wMzktLjA3NnMuMDAxLS4wNTgtLjAxLS4wODRhLjE1LjE1IDAgMCAwIC0uMDU2LS4wNjVjLS4wMjUtLjAxNi0uMDU0LS4wMjQtLjA4My0uMDI0aC02LjIwOGEuMzEuMzEgMCAwIDAgLS4xMjEuMDI1Yy0uMDM4LjAxNi0uMDcyLjA0LS4xMDEuMDY5bC0xLjMxIDEuMzY4Yy0uMDIuMDIxLS4wMzQuMDQ3LS4wMzkuMDc2cy0uMDAxLjA1OC4wMS4wODQuMDMxLjA0OS4wNTYuMDY1LjA1NC4wMjQuMDgzLjAyNHoiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4='; //# sourceMappingURL=icon.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/wallet.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SolflareMetaMaskWallet",
    ()=>SolflareMetaMaskWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-chains/lib/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signAndSendTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signMessage.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-standard-features/lib/esm/signTransaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/connect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$disconnect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/disconnect.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/features/lib/esm/events.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/icon.js [app-client] (ecmascript)");
var __classPrivateFieldGet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = ("TURBOPACK compile-time value", void 0) && ("TURBOPACK compile-time value", void 0).__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _SolflareMetaMaskWallet_instances, _SolflareMetaMaskWallet_listeners, _SolflareMetaMaskWallet_version, _SolflareMetaMaskWallet_name, _SolflareMetaMaskWallet_icon, _SolflareMetaMaskWallet_solflareMetaMask, _SolflareMetaMaskWallet_on, _SolflareMetaMaskWallet_emit, _SolflareMetaMaskWallet_off, _SolflareMetaMaskWallet_connect, _SolflareMetaMaskWallet_disconnect, _SolflareMetaMaskWallet_signAndSendTransaction, _SolflareMetaMaskWallet_signTransaction, _SolflareMetaMaskWallet_signMessage;
;
;
;
;
;
class SolflareMetaMaskWallet {
    constructor(){
        _SolflareMetaMaskWallet_instances.add(this);
        _SolflareMetaMaskWallet_listeners.set(this, {});
        _SolflareMetaMaskWallet_version.set(this, '1.0.0');
        _SolflareMetaMaskWallet_name.set(this, 'MetaMask');
        _SolflareMetaMaskWallet_icon.set(this, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["icon"]);
        _SolflareMetaMaskWallet_solflareMetaMask.set(this, null);
        _SolflareMetaMaskWallet_on.set(this, (event, listener)=>{
            __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.push(listener) || (__classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event] = [
                listener
            ]);
            return ()=>__classPrivateFieldGet(this, _SolflareMetaMaskWallet_instances, "m", _SolflareMetaMaskWallet_off).call(this, event, listener);
        });
        _SolflareMetaMaskWallet_connect.set(this, async ()=>{
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) {
                let SolflareMetaMaskClass;
                try {
                    SolflareMetaMaskClass = (await __turbopack_context__.A("[project]/superteam-academy/node_modules/@solflare-wallet/metamask-sdk/lib/esm/index.js [app-client] (ecmascript, async loader)")).default;
                } catch (error) {
                    throw new Error('Unable to load Solflare MetaMask SDK');
                }
                __classPrivateFieldSet(this, _SolflareMetaMaskWallet_solflareMetaMask, new SolflareMetaMaskClass(), "f");
                __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").on('standard_change', (properties)=>__classPrivateFieldGet(this, _SolflareMetaMaskWallet_instances, "m", _SolflareMetaMaskWallet_emit).call(this, 'change', properties));
            }
            if (!this.accounts.length) {
                await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").connect();
            }
            return {
                accounts: this.accounts
            };
        });
        _SolflareMetaMaskWallet_disconnect.set(this, async ()=>{
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) return;
            await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").disconnect();
        });
        _SolflareMetaMaskWallet_signAndSendTransaction.set(this, async (...inputs)=>{
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignAndSendTransaction(...inputs);
        });
        _SolflareMetaMaskWallet_signTransaction.set(this, async (...inputs)=>{
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignTransaction(...inputs);
        });
        _SolflareMetaMaskWallet_signMessage.set(this, async (...inputs)=>{
            if (!__classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f")) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            return await __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardSignMessage(...inputs);
        });
    }
    get version() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_version, "f");
    }
    get name() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_name, "f");
    }
    get icon() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_icon, "f");
    }
    get chains() {
        return [
            __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_MAINNET_CHAIN"],
            __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_DEVNET_CHAIN"],
            __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$chains$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_TESTNET_CHAIN"]
        ];
    }
    get features() {
        return {
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$connect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardConnect"]]: {
                version: '1.0.0',
                connect: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_connect, "f")
            },
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$disconnect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardDisconnect"]]: {
                version: '1.0.0',
                disconnect: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_disconnect, "f")
            },
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$features$2f$lib$2f$esm$2f$events$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StandardEvents"]]: {
                version: '1.0.0',
                on: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_on, "f")
            },
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signAndSendTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignAndSendTransaction"]]: {
                version: '1.0.0',
                supportedTransactionVersions: [
                    'legacy',
                    0
                ],
                signAndSendTransaction: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signAndSendTransaction, "f")
            },
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signTransaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignTransaction"]]: {
                version: '1.0.0',
                supportedTransactionVersions: [
                    'legacy',
                    0
                ],
                signTransaction: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signTransaction, "f")
            },
            [__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$standard$2d$features$2f$lib$2f$esm$2f$signMessage$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaSignMessage"]]: {
                version: '1.0.0',
                signMessage: __classPrivateFieldGet(this, _SolflareMetaMaskWallet_signMessage, "f")
            }
        };
    }
    get accounts() {
        return __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f") ? __classPrivateFieldGet(this, _SolflareMetaMaskWallet_solflareMetaMask, "f").standardAccounts : [];
    }
}
_SolflareMetaMaskWallet_listeners = new WeakMap(), _SolflareMetaMaskWallet_version = new WeakMap(), _SolflareMetaMaskWallet_name = new WeakMap(), _SolflareMetaMaskWallet_icon = new WeakMap(), _SolflareMetaMaskWallet_solflareMetaMask = new WeakMap(), _SolflareMetaMaskWallet_on = new WeakMap(), _SolflareMetaMaskWallet_connect = new WeakMap(), _SolflareMetaMaskWallet_disconnect = new WeakMap(), _SolflareMetaMaskWallet_signAndSendTransaction = new WeakMap(), _SolflareMetaMaskWallet_signTransaction = new WeakMap(), _SolflareMetaMaskWallet_signMessage = new WeakMap(), _SolflareMetaMaskWallet_instances = new WeakSet(), _SolflareMetaMaskWallet_emit = function _SolflareMetaMaskWallet_emit(event, ...args) {
    // eslint-disable-next-line prefer-spread
    __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.forEach((listener)=>listener.apply(null, args));
}, _SolflareMetaMaskWallet_off = function _SolflareMetaMaskWallet_off(event, listener) {
    __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event] = __classPrivateFieldGet(this, _SolflareMetaMaskWallet_listeners, "f")[event]?.filter((existingListener)=>listener !== existingListener);
}; //# sourceMappingURL=wallet.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/detect.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectAndRegisterSolflareMetaMaskWallet",
    ()=>detectAndRegisterSolflareMetaMaskWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$wallet$2f$lib$2f$esm$2f$register$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@wallet-standard/wallet/lib/esm/register.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/wallet.js [app-client] (ecmascript)");
;
;
let registered = false;
function register() {
    if (registered) return;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$wallet$2d$standard$2f$wallet$2f$lib$2f$esm$2f$register$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["registerWallet"])(new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolflareMetaMaskWallet"]());
    registered = true;
}
async function detectAndRegisterSolflareMetaMaskWallet() {
    const id = 'solflare-detect-metamask';
    function postMessage() {
        window.postMessage({
            target: 'metamask-contentscript',
            data: {
                name: 'metamask-provider',
                data: {
                    id,
                    jsonrpc: '2.0',
                    method: 'wallet_getSnaps'
                }
            }
        }, window.location.origin);
    }
    function onMessage(event) {
        const message = event.data;
        if (message?.target === 'metamask-inpage' && message.data?.name === 'metamask-provider') {
            if (message.data.data?.id === id) {
                window.removeEventListener('message', onMessage);
                if (!message.data.data.error) {
                    register();
                }
            } else {
                postMessage();
            }
        }
    }
    window.addEventListener('message', onMessage);
    window.setTimeout(()=>window.removeEventListener('message', onMessage), 5000);
    postMessage();
} //# sourceMappingURL=detect.js.map
}),
"[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/adapter.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SolflareWalletAdapter",
    ()=>SolflareWalletAdapter,
    "SolflareWalletName",
    ()=>SolflareWalletName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$signer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/signer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/adapter.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-base/lib/esm/transaction.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$detect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/wallet-adapter-solflare/lib/esm/metamask/detect.js [app-client] (ecmascript)");
;
;
;
const SolflareWalletName = 'Solflare';
class SolflareWalletAdapter extends __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$signer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseMessageSignerWalletAdapter"] {
    constructor(config = {}){
        super();
        this.name = SolflareWalletName;
        this.url = 'https://solflare.com';
        this.icon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==';
        this.supportedTransactionVersions = new Set([
            'legacy',
            0
        ]);
        this._readyState = typeof window === 'undefined' || typeof document === 'undefined' ? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported : __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable;
        this._disconnected = ()=>{
            const wallet = this._wallet;
            if (wallet) {
                wallet.off('disconnect', this._disconnected);
                this._wallet = null;
                this._publicKey = null;
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectedError"]());
                this.emit('disconnect');
            }
        };
        this._accountChanged = (newPublicKey)=>{
            if (!newPublicKey) return;
            const publicKey = this._publicKey;
            if (!publicKey) return;
            try {
                newPublicKey = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](newPublicKey.toBytes());
            } catch (error) {
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletPublicKeyError"](error?.message, error));
                return;
            }
            if (publicKey.equals(newPublicKey)) return;
            this._publicKey = newPublicKey;
            this.emit('connect', newPublicKey);
        };
        this._connecting = false;
        this._publicKey = null;
        this._wallet = null;
        this._config = config;
        if (this._readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Unsupported) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["scopePollingDetectionStrategy"])(()=>{
                if (window.solflare?.isSolflare || window.SolflareApp) {
                    this._readyState = __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$metamask$2f$detect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["detectAndRegisterSolflareMetaMaskWallet"])();
        }
    }
    get publicKey() {
        return this._publicKey;
    }
    get connecting() {
        return this._connecting;
    }
    get connected() {
        return !!this._wallet?.connected;
    }
    get readyState() {
        return this._readyState;
    }
    async autoConnect() {
        // Skip autoconnect in the Loadable state on iOS
        // We can't redirect to a universal link without user input
        if (!(this.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable && (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["isIosAndRedirectable"])())) {
            await this.connect();
        }
    }
    async connect() {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable && this._readyState !== __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Installed) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotReadyError"]();
            // redirect to the Solflare /browse universal link
            // this will open the current URL in the Solflare in-wallet browser
            if (this.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WalletReadyState"].Loadable && (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["isIosAndRedirectable"])()) {
                const url = encodeURIComponent(window.location.href);
                const ref = encodeURIComponent(window.location.origin);
                window.location.href = `https://solflare.com/ul/v1/browse/${url}?ref=${ref}`;
                return;
            }
            let SolflareClass;
            try {
                SolflareClass = (await __turbopack_context__.A("[project]/superteam-academy/node_modules/@solflare-wallet/sdk/lib/esm/index.js [app-client] (ecmascript, async loader)")).default;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletLoadError"](error?.message, error);
            }
            let wallet;
            try {
                wallet = new SolflareClass({
                    network: this._config.network
                });
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConfigError"](error?.message, error);
            }
            this._connecting = true;
            if (!wallet.connected) {
                try {
                    await wallet.connect();
                } catch (error) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectionError"](error?.message, error);
                }
            }
            if (!wallet.publicKey) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectionError"]();
            let publicKey;
            try {
                publicKey = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](wallet.publicKey.toBytes());
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletPublicKeyError"](error?.message, error);
            }
            wallet.on('disconnect', this._disconnected);
            wallet.on('accountChanged', this._accountChanged);
            this._wallet = wallet;
            this._publicKey = publicKey;
            this.emit('connect', publicKey);
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally{
            this._connecting = false;
        }
    }
    async disconnect() {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);
            wallet.off('accountChanged', this._accountChanged);
            this._wallet = null;
            this._publicKey = null;
            try {
                await wallet.disconnect();
            } catch (error) {
                this.emit('error', new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletDisconnectionError"](error?.message, error));
            }
        }
        this.emit('disconnect');
    }
    async sendTransaction(transaction, connection, options = {}) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                const { signers, ...sendOptions } = options;
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$transaction$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVersionedTransaction"])(transaction)) {
                    signers?.length && transaction.sign(signers);
                } else {
                    transaction = await this.prepareTransaction(transaction, connection, sendOptions);
                    signers?.length && transaction.partialSign(...signers);
                }
                sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;
                return await wallet.signAndSendTransaction(transaction, sendOptions);
            } catch (error) {
                if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletError"]) throw error;
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSendTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signTransaction(transaction) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                return await wallet.signTransaction(transaction) || transaction;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signAllTransactions(transactions) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                return await wallet.signAllTransactions(transactions) || transactions;
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignTransactionError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async signMessage(message) {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletNotConnectedError"]();
            try {
                return await wallet.signMessage(message, 'utf8');
            } catch (error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$base$2f$lib$2f$esm$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletSignMessageError"](error?.message, error);
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
} //# sourceMappingURL=adapter.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "encodeDecode",
    ()=>encodeDecode
]);
const encodeDecode = (layout)=>{
    const decode = layout.decode.bind(layout);
    const encode = layout.encode.bind(layout);
    return {
        decode,
        encode
    };
}; //# sourceMappingURL=base.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/bigint.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bigInt",
    ()=>bigInt,
    "bigIntBE",
    ()=>bigIntBE,
    "u128",
    ()=>u128,
    "u128be",
    ()=>u128be,
    "u192",
    ()=>u192,
    "u192be",
    ()=>u192be,
    "u256",
    ()=>u256,
    "u256be",
    ()=>u256be,
    "u64",
    ()=>u64,
    "u64be",
    ()=>u64be
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout/lib/Layout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bigint$2d$buffer$2f$dist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/bigint-buffer/dist/browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)");
;
;
;
const bigInt = (length)=>(property)=>{
        const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blob"])(length, property);
        const { encode, decode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeDecode"])(layout);
        const bigIntLayout = layout;
        bigIntLayout.decode = (buffer, offset)=>{
            const src = decode(buffer, offset);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bigint$2d$buffer$2f$dist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBigIntLE"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(src));
        };
        bigIntLayout.encode = (bigInt, buffer, offset)=>{
            const src = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bigint$2d$buffer$2f$dist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBufferLE"])(bigInt, length);
            return encode(src, buffer, offset);
        };
        return bigIntLayout;
    };
const bigIntBE = (length)=>(property)=>{
        const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blob"])(length, property);
        const { encode, decode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeDecode"])(layout);
        const bigIntLayout = layout;
        bigIntLayout.decode = (buffer, offset)=>{
            const src = decode(buffer, offset);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bigint$2d$buffer$2f$dist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBigIntBE"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(src));
        };
        bigIntLayout.encode = (bigInt, buffer, offset)=>{
            const src = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bigint$2d$buffer$2f$dist$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBufferBE"])(bigInt, length);
            return encode(src, buffer, offset);
        };
        return bigIntLayout;
    };
const u64 = bigInt(8);
const u64be = bigIntBE(8);
const u128 = bigInt(16);
const u128be = bigIntBE(16);
const u192 = bigInt(24);
const u192be = bigIntBE(24);
const u256 = bigInt(32);
const u256be = bigIntBE(32); //# sourceMappingURL=bigint.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/decimal.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WAD",
    ()=>WAD,
    "decimal",
    ()=>decimal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bignumber$2e$js$2f$bignumber$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/bignumber.js/bignumber.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$bigint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/bigint.mjs [app-client] (ecmascript)");
;
;
;
const WAD = new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bignumber$2e$js$2f$bignumber$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]('1e+18');
const decimal = (property)=>{
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$bigint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["u128"])(property);
    const { encode, decode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeDecode"])(layout);
    const decimalLayout = layout;
    decimalLayout.decode = (buffer, offset)=>{
        const src = decode(buffer, offset).toString();
        return new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$bignumber$2e$js$2f$bignumber$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](src).div(WAD);
    };
    decimalLayout.encode = (decimal, buffer, offset)=>{
        const src = BigInt(decimal.times(WAD).integerValue().toString());
        return encode(src, buffer, offset);
    };
    return decimalLayout;
}; //# sourceMappingURL=decimal.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/native.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bool",
    ()=>bool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout/lib/Layout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)");
;
;
const bool = (property)=>{
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["u8"])(property);
    const { encode, decode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeDecode"])(layout);
    const boolLayout = layout;
    boolLayout.decode = (buffer, offset)=>{
        const src = decode(buffer, offset);
        return !!src;
    };
    boolLayout.encode = (bool, buffer, offset)=>{
        const src = Number(bool);
        return encode(src, buffer, offset);
    };
    return boolLayout;
}; //# sourceMappingURL=native.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/web3.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "publicKey",
    ()=>publicKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout/lib/Layout.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)");
;
;
;
const publicKey = (property)=>{
    const layout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2f$lib$2f$Layout$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blob"])(32, property);
    const { encode, decode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeDecode"])(layout);
    const publicKeyLayout = layout;
    publicKeyLayout.decode = (buffer, offset)=>{
        const src = decode(buffer, offset);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](src);
    };
    publicKeyLayout.encode = (publicKey, buffer, offset)=>{
        const src = publicKey.toBuffer();
        return encode(src, buffer, offset);
    };
    return publicKeyLayout;
}; //# sourceMappingURL=web3.js.map
}),
"[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/index.mjs [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$base$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/base.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$bigint$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/bigint.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$decimal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/decimal.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$native$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/native.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$buffer$2d$layout$2d$utils$2f$lib$2f$esm$2f$web3$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/buffer-layout-utils/lib/esm/web3.mjs [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
;
}),
"[project]/superteam-academy/node_modules/@solana/codecs-data-structures/dist/index.browser.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assertValidNumberOfItemsForCodec",
    ()=>assertValidNumberOfItemsForCodec,
    "getArrayCodec",
    ()=>getArrayCodec,
    "getArrayDecoder",
    ()=>getArrayDecoder,
    "getArrayEncoder",
    ()=>getArrayEncoder,
    "getBitArrayCodec",
    ()=>getBitArrayCodec,
    "getBitArrayDecoder",
    ()=>getBitArrayDecoder,
    "getBitArrayEncoder",
    ()=>getBitArrayEncoder,
    "getBooleanCodec",
    ()=>getBooleanCodec,
    "getBooleanDecoder",
    ()=>getBooleanDecoder,
    "getBooleanEncoder",
    ()=>getBooleanEncoder,
    "getBytesCodec",
    ()=>getBytesCodec,
    "getBytesDecoder",
    ()=>getBytesDecoder,
    "getBytesEncoder",
    ()=>getBytesEncoder,
    "getConstantCodec",
    ()=>getConstantCodec,
    "getConstantDecoder",
    ()=>getConstantDecoder,
    "getConstantEncoder",
    ()=>getConstantEncoder,
    "getDataEnumCodec",
    ()=>getDataEnumCodec,
    "getDataEnumDecoder",
    ()=>getDataEnumDecoder,
    "getDataEnumEncoder",
    ()=>getDataEnumEncoder,
    "getDiscriminatedUnionCodec",
    ()=>getDiscriminatedUnionCodec,
    "getDiscriminatedUnionDecoder",
    ()=>getDiscriminatedUnionDecoder,
    "getDiscriminatedUnionEncoder",
    ()=>getDiscriminatedUnionEncoder,
    "getEnumCodec",
    ()=>getEnumCodec,
    "getEnumDecoder",
    ()=>getEnumDecoder,
    "getEnumEncoder",
    ()=>getEnumEncoder,
    "getHiddenPrefixCodec",
    ()=>getHiddenPrefixCodec,
    "getHiddenPrefixDecoder",
    ()=>getHiddenPrefixDecoder,
    "getHiddenPrefixEncoder",
    ()=>getHiddenPrefixEncoder,
    "getHiddenSuffixCodec",
    ()=>getHiddenSuffixCodec,
    "getHiddenSuffixDecoder",
    ()=>getHiddenSuffixDecoder,
    "getHiddenSuffixEncoder",
    ()=>getHiddenSuffixEncoder,
    "getMapCodec",
    ()=>getMapCodec,
    "getMapDecoder",
    ()=>getMapDecoder,
    "getMapEncoder",
    ()=>getMapEncoder,
    "getNullableCodec",
    ()=>getNullableCodec,
    "getNullableDecoder",
    ()=>getNullableDecoder,
    "getNullableEncoder",
    ()=>getNullableEncoder,
    "getScalarEnumCodec",
    ()=>getScalarEnumCodec,
    "getScalarEnumDecoder",
    ()=>getScalarEnumDecoder,
    "getScalarEnumEncoder",
    ()=>getScalarEnumEncoder,
    "getSetCodec",
    ()=>getSetCodec,
    "getSetDecoder",
    ()=>getSetDecoder,
    "getSetEncoder",
    ()=>getSetEncoder,
    "getStructCodec",
    ()=>getStructCodec,
    "getStructDecoder",
    ()=>getStructDecoder,
    "getStructEncoder",
    ()=>getStructEncoder,
    "getTupleCodec",
    ()=>getTupleCodec,
    "getTupleDecoder",
    ()=>getTupleDecoder,
    "getTupleEncoder",
    ()=>getTupleEncoder,
    "getUnionCodec",
    ()=>getUnionCodec,
    "getUnionDecoder",
    ()=>getUnionDecoder,
    "getUnionEncoder",
    ()=>getUnionEncoder,
    "getUnitCodec",
    ()=>getUnitCodec,
    "getUnitDecoder",
    ()=>getUnitDecoder,
    "getUnitEncoder",
    ()=>getUnitEncoder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-numbers/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/errors/dist/index.browser.mjs [app-client] (ecmascript)");
;
;
;
// src/array.ts
function assertValidNumberOfItemsForCodec(codecDescription, expected, actual) {
    if (expected !== actual) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS"], {
            actual,
            codecDescription,
            expected
        });
    }
}
function maxCodecSizes(sizes) {
    return sizes.reduce((all, size)=>all === null || size === null ? null : Math.max(all, size), 0);
}
function sumCodecSizes(sizes) {
    return sizes.reduce((all, size)=>all === null || size === null ? null : all + size, 0);
}
function getFixedSize(codec) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFixedSize"])(codec) ? codec.fixedSize : null;
}
function getMaxSize(codec) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFixedSize"])(codec) ? codec.fixedSize : codec.maxSize ?? null;
}
// src/array.ts
function getArrayEncoder(item, config = {}) {
    const size = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU32Encoder"])();
    const fixedSize = computeArrayLikeCodecSize(size, getFixedSize(item));
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        ...fixedSize !== null ? {
            fixedSize
        } : {
            getSizeFromValue: (array)=>{
                const prefixSize = typeof size === "object" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEncodedSize"])(array.length, size) : 0;
                return prefixSize + [
                    ...array
                ].reduce((all, value)=>all + (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEncodedSize"])(value, item), 0);
            },
            maxSize
        },
        write: (array, bytes, offset)=>{
            if (typeof size === "number") {
                assertValidNumberOfItemsForCodec("array", size, array.length);
            }
            if (typeof size === "object") {
                offset = size.write(array.length, bytes, offset);
            }
            array.forEach((value)=>{
                offset = item.write(value, bytes, offset);
            });
            return offset;
        }
    });
}
function getArrayDecoder(item, config = {}) {
    const size = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU32Decoder"])();
    const itemSize = getFixedSize(item);
    const fixedSize = computeArrayLikeCodecSize(size, itemSize);
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        ...fixedSize !== null ? {
            fixedSize
        } : {
            maxSize
        },
        read: (bytes, offset)=>{
            const array = [];
            if (typeof size === "object" && bytes.slice(offset).length === 0) {
                return [
                    array,
                    offset
                ];
            }
            if (size === "remainder") {
                while(offset < bytes.length){
                    const [value, newOffset2] = item.read(bytes, offset);
                    offset = newOffset2;
                    array.push(value);
                }
                return [
                    array,
                    offset
                ];
            }
            const [resolvedSize, newOffset] = typeof size === "number" ? [
                size,
                offset
            ] : size.read(bytes, offset);
            offset = newOffset;
            for(let i = 0; i < resolvedSize; i += 1){
                const [value, newOffset2] = item.read(bytes, offset);
                offset = newOffset2;
                array.push(value);
            }
            return [
                array,
                offset
            ];
        }
    });
}
function getArrayCodec(item, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getArrayEncoder(item, config), getArrayDecoder(item, config));
}
function computeArrayLikeCodecSize(size, itemSize) {
    if (typeof size !== "number") return null;
    if (size === 0) return 0;
    return itemSize === null ? null : itemSize * size;
}
function getBitArrayEncoder(size, config = {}) {
    const parsedConfig = typeof config === "boolean" ? {
        backward: config
    } : config;
    const backward = parsedConfig.backward ?? false;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        fixedSize: size,
        write (value, bytes, offset) {
            const bytesToAdd = [];
            for(let i = 0; i < size; i += 1){
                let byte = 0;
                for(let j = 0; j < 8; j += 1){
                    const feature = Number(value[i * 8 + j] ?? 0);
                    byte |= feature << (backward ? j : 7 - j);
                }
                if (backward) {
                    bytesToAdd.unshift(byte);
                } else {
                    bytesToAdd.push(byte);
                }
            }
            bytes.set(bytesToAdd, offset);
            return size;
        }
    });
}
function getBitArrayDecoder(size, config = {}) {
    const parsedConfig = typeof config === "boolean" ? {
        backward: config
    } : config;
    const backward = parsedConfig.backward ?? false;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        fixedSize: size,
        read (bytes, offset) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertByteArrayHasEnoughBytesForCodec"])("bitArray", size, bytes, offset);
            const booleans = [];
            let slice = bytes.slice(offset, offset + size);
            slice = backward ? slice.reverse() : slice;
            slice.forEach((byte)=>{
                for(let i = 0; i < 8; i += 1){
                    if (backward) {
                        booleans.push(Boolean(byte & 1));
                        byte >>= 1;
                    } else {
                        booleans.push(Boolean(byte & 128));
                        byte <<= 1;
                    }
                }
            });
            return [
                booleans,
                offset + size
            ];
        }
    });
}
function getBitArrayCodec(size, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getBitArrayEncoder(size, config), getBitArrayDecoder(size, config));
}
function getBooleanEncoder(config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Encoder"])(), (value)=>value ? 1 : 0);
}
function getBooleanDecoder(config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Decoder"])(), (value)=>Number(value) === 1);
}
function getBooleanCodec(config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getBooleanEncoder(config), getBooleanDecoder(config));
}
function getBytesEncoder() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        getSizeFromValue: (value)=>value.length,
        write: (value, bytes, offset)=>{
            bytes.set(value, offset);
            return offset + value.length;
        }
    });
}
function getBytesDecoder() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        read: (bytes, offset)=>{
            const slice = bytes.slice(offset);
            return [
                slice,
                offset + slice.length
            ];
        }
    });
}
function getBytesCodec() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getBytesEncoder(), getBytesDecoder());
}
var getBase16Decoder = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        read (bytes, offset) {
            const value = bytes.slice(offset).reduce((str, byte)=>str + byte.toString(16).padStart(2, "0"), "");
            return [
                value,
                bytes.length
            ];
        }
    });
function getConstantEncoder(constant) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        fixedSize: constant.length,
        write: (_, bytes, offset)=>{
            bytes.set(constant, offset);
            return offset + constant.length;
        }
    });
}
function getConstantDecoder(constant) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        fixedSize: constant.length,
        read: (bytes, offset)=>{
            const base16 = getBase16Decoder();
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["containsBytes"])(bytes, constant, offset)) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_CONSTANT"], {
                    constant,
                    data: bytes,
                    hexConstant: base16.decode(constant),
                    hexData: base16.decode(bytes),
                    offset
                });
            }
            return [
                void 0,
                offset + constant.length
            ];
        }
    });
}
function getConstantCodec(constant) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getConstantEncoder(constant), getConstantDecoder(constant));
}
function getTupleEncoder(items) {
    const fixedSize = sumCodecSizes(items.map(getFixedSize));
    const maxSize = sumCodecSizes(items.map(getMaxSize)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        ...fixedSize === null ? {
            getSizeFromValue: (value)=>items.map((item, index)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEncodedSize"])(value[index], item)).reduce((all, one)=>all + one, 0),
            maxSize
        } : {
            fixedSize
        },
        write: (value, bytes, offset)=>{
            assertValidNumberOfItemsForCodec("tuple", items.length, value.length);
            items.forEach((item, index)=>{
                offset = item.write(value[index], bytes, offset);
            });
            return offset;
        }
    });
}
function getTupleDecoder(items) {
    const fixedSize = sumCodecSizes(items.map(getFixedSize));
    const maxSize = sumCodecSizes(items.map(getMaxSize)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        ...fixedSize === null ? {
            maxSize
        } : {
            fixedSize
        },
        read: (bytes, offset)=>{
            const values = [];
            items.forEach((item)=>{
                const [newValue, newOffset] = item.read(bytes, offset);
                values.push(newValue);
                offset = newOffset;
            });
            return [
                values,
                offset
            ];
        }
    });
}
function getTupleCodec(items) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getTupleEncoder(items), getTupleDecoder(items));
}
function getUnionEncoder(variants, getIndexFromValue) {
    const fixedSize = getUnionFixedSize(variants);
    const write = (variant, bytes, offset)=>{
        const index = getIndexFromValue(variant);
        assertValidVariantIndex(variants, index);
        return variants[index].write(variant, bytes, offset);
    };
    if (fixedSize !== null) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
            fixedSize,
            write
        });
    }
    const maxSize = getUnionMaxSize(variants);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        ...maxSize !== null ? {
            maxSize
        } : {},
        getSizeFromValue: (variant)=>{
            const index = getIndexFromValue(variant);
            assertValidVariantIndex(variants, index);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEncodedSize"])(variant, variants[index]);
        },
        write
    });
}
function getUnionDecoder(variants, getIndexFromBytes) {
    const fixedSize = getUnionFixedSize(variants);
    const read = (bytes, offset)=>{
        const index = getIndexFromBytes(bytes, offset);
        assertValidVariantIndex(variants, index);
        return variants[index].read(bytes, offset);
    };
    if (fixedSize !== null) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
            fixedSize,
            read
        });
    }
    const maxSize = getUnionMaxSize(variants);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        ...maxSize !== null ? {
            maxSize
        } : {},
        read
    });
}
function getUnionCodec(variants, getIndexFromValue, getIndexFromBytes) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getUnionEncoder(variants, getIndexFromValue), getUnionDecoder(variants, getIndexFromBytes));
}
function assertValidVariantIndex(variants, index) {
    if (typeof variants[index] === "undefined") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__UNION_VARIANT_OUT_OF_RANGE"], {
            maxRange: variants.length - 1,
            minRange: 0,
            variant: index
        });
    }
}
function getUnionFixedSize(variants) {
    if (variants.length === 0) return 0;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFixedSize"])(variants[0])) return null;
    const variantSize = variants[0].fixedSize;
    const sameSizedVariants = variants.every((variant)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFixedSize"])(variant) && variant.fixedSize === variantSize);
    return sameSizedVariants ? variantSize : null;
}
function getUnionMaxSize(variants) {
    return maxCodecSizes(variants.map((variant)=>getMaxSize(variant)));
}
// src/discriminated-union.ts
function getDiscriminatedUnionEncoder(variants, config = {}) {
    const discriminatorProperty = config.discriminator ?? "__kind";
    const prefix = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Encoder"])();
    return getUnionEncoder(variants.map(([, variant], index)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getTupleEncoder([
            prefix,
            variant
        ]), (value)=>[
                index,
                value
            ])), (value)=>getVariantDiscriminator(variants, value[discriminatorProperty]));
}
function getDiscriminatedUnionDecoder(variants, config = {}) {
    const discriminatorProperty = config.discriminator ?? "__kind";
    const prefix = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Decoder"])();
    return getUnionDecoder(variants.map(([discriminator, variant])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getTupleDecoder([
            prefix,
            variant
        ]), ([, value])=>({
                [discriminatorProperty]: discriminator,
                ...value
            }))), (bytes, offset)=>Number(prefix.read(bytes, offset)[0]));
}
function getDiscriminatedUnionCodec(variants, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getDiscriminatedUnionEncoder(variants, config), getDiscriminatedUnionDecoder(variants, config));
}
function getVariantDiscriminator(variants, discriminatorValue) {
    const discriminator = variants.findIndex(([key])=>discriminatorValue === key);
    if (discriminator < 0) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_DISCRIMINATED_UNION_VARIANT"], {
            value: discriminatorValue,
            variants: variants.map(([key])=>key)
        });
    }
    return discriminator;
}
var getDataEnumEncoder = getDiscriminatedUnionEncoder;
var getDataEnumDecoder = getDiscriminatedUnionDecoder;
var getDataEnumCodec = getDiscriminatedUnionCodec;
// src/enum-helpers.ts
function getEnumStats(constructor) {
    const numericalValues = [
        ...new Set(Object.values(constructor).filter((v)=>typeof v === "number"))
    ].sort();
    const enumRecord = Object.fromEntries(Object.entries(constructor).slice(numericalValues.length));
    const enumKeys = Object.keys(enumRecord);
    const enumValues = Object.values(enumRecord);
    const stringValues = [
        .../* @__PURE__ */ new Set([
            ...enumKeys,
            ...enumValues.filter((v)=>typeof v === "string")
        ])
    ];
    return {
        enumKeys,
        enumRecord,
        enumValues,
        numericalValues,
        stringValues
    };
}
function getEnumIndexFromVariant({ enumKeys, enumValues, variant }) {
    const valueIndex = findLastIndex(enumValues, (value)=>value === variant);
    if (valueIndex >= 0) return valueIndex;
    return enumKeys.findIndex((key)=>key === variant);
}
function getEnumIndexFromDiscriminator({ discriminator, enumKeys, enumValues, useValuesAsDiscriminators }) {
    if (!useValuesAsDiscriminators) {
        return discriminator >= 0 && discriminator < enumKeys.length ? discriminator : -1;
    }
    return findLastIndex(enumValues, (value)=>value === discriminator);
}
function findLastIndex(array, predicate) {
    let l = array.length;
    while(l--){
        if (predicate(array[l], l, array)) return l;
    }
    return -1;
}
function formatNumericalValues(values) {
    if (values.length === 0) return "";
    let range = [
        values[0],
        values[0]
    ];
    const ranges = [];
    for(let index = 1; index < values.length; index++){
        const value = values[index];
        if (range[1] + 1 === value) {
            range[1] = value;
        } else {
            ranges.push(range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`);
            range = [
                value,
                value
            ];
        }
    }
    ranges.push(range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`);
    return ranges.join(", ");
}
// src/enum.ts
function getEnumEncoder(constructor, config = {}) {
    const prefix = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Encoder"])();
    const useValuesAsDiscriminators = config.useValuesAsDiscriminators ?? false;
    const { enumKeys, enumValues, numericalValues, stringValues } = getEnumStats(constructor);
    if (useValuesAsDiscriminators && enumValues.some((value)=>typeof value === "string")) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS"], {
            stringValues: enumValues.filter((v)=>typeof v === "string")
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(prefix, (variant)=>{
        const index = getEnumIndexFromVariant({
            enumKeys,
            enumValues,
            variant
        });
        if (index < 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__INVALID_ENUM_VARIANT"], {
                formattedNumericalValues: formatNumericalValues(numericalValues),
                numericalValues,
                stringValues,
                variant
            });
        }
        return useValuesAsDiscriminators ? enumValues[index] : index;
    });
}
function getEnumDecoder(constructor, config = {}) {
    const prefix = config.size ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Decoder"])();
    const useValuesAsDiscriminators = config.useValuesAsDiscriminators ?? false;
    const { enumKeys, enumValues, numericalValues } = getEnumStats(constructor);
    if (useValuesAsDiscriminators && enumValues.some((value)=>typeof value === "string")) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__CANNOT_USE_LEXICAL_VALUES_AS_ENUM_DISCRIMINATORS"], {
            stringValues: enumValues.filter((v)=>typeof v === "string")
        });
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(prefix, (value)=>{
        const discriminator = Number(value);
        const index = getEnumIndexFromDiscriminator({
            discriminator,
            enumKeys,
            enumValues,
            useValuesAsDiscriminators
        });
        if (index < 0) {
            const validDiscriminators = useValuesAsDiscriminators ? numericalValues : [
                ...Array(enumKeys.length).keys()
            ];
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolanaError"](__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$errors$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SOLANA_ERROR__CODECS__ENUM_DISCRIMINATOR_OUT_OF_RANGE"], {
                discriminator,
                formattedValidDiscriminators: formatNumericalValues(validDiscriminators),
                validDiscriminators
            });
        }
        return enumValues[index];
    });
}
function getEnumCodec(constructor, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getEnumEncoder(constructor, config), getEnumDecoder(constructor, config));
}
var getScalarEnumEncoder = getEnumEncoder;
var getScalarEnumDecoder = getEnumDecoder;
var getScalarEnumCodec = getEnumCodec;
function getHiddenPrefixEncoder(encoder, prefixedEncoders) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getTupleEncoder([
        ...prefixedEncoders,
        encoder
    ]), (value)=>[
            ...prefixedEncoders.map(()=>void 0),
            value
        ]);
}
function getHiddenPrefixDecoder(decoder, prefixedDecoders) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getTupleDecoder([
        ...prefixedDecoders,
        decoder
    ]), (tuple)=>tuple[tuple.length - 1]);
}
function getHiddenPrefixCodec(codec, prefixedCodecs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getHiddenPrefixEncoder(codec, prefixedCodecs), getHiddenPrefixDecoder(codec, prefixedCodecs));
}
function getHiddenSuffixEncoder(encoder, suffixedEncoders) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getTupleEncoder([
        encoder,
        ...suffixedEncoders
    ]), (value)=>[
            value,
            ...suffixedEncoders.map(()=>void 0)
        ]);
}
function getHiddenSuffixDecoder(decoder, suffixedDecoders) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getTupleDecoder([
        decoder,
        ...suffixedDecoders
    ]), (tuple)=>tuple[0]);
}
function getHiddenSuffixCodec(codec, suffixedCodecs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getHiddenSuffixEncoder(codec, suffixedCodecs), getHiddenSuffixDecoder(codec, suffixedCodecs));
}
function getMapEncoder(key, value, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getArrayEncoder(getTupleEncoder([
        key,
        value
    ]), config), (map)=>[
            ...map.entries()
        ]);
}
function getMapDecoder(key, value, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getArrayDecoder(getTupleDecoder([
        key,
        value
    ]), config), (entries)=>new Map(entries));
}
function getMapCodec(key, value, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getMapEncoder(key, value, config), getMapDecoder(key, value, config));
}
function getUnitEncoder() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        fixedSize: 0,
        write: (_value, _bytes, offset)=>offset
    });
}
function getUnitDecoder() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        fixedSize: 0,
        read: (_bytes, offset)=>[
                void 0,
                offset
            ]
    });
}
function getUnitCodec() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getUnitEncoder(), getUnitDecoder());
}
// src/nullable.ts
function getNullableEncoder(item, config = {}) {
    const prefix = (()=>{
        if (config.prefix === null) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getUnitEncoder(), (_boolean)=>void 0);
        }
        return getBooleanEncoder({
            size: config.prefix ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Encoder"])()
        });
    })();
    const noneValue = (()=>{
        if (config.noneValue === "zeroes") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertIsFixedSize"])(item);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixEncoderSize"])(getUnitEncoder(), item.fixedSize);
        }
        if (!config.noneValue) {
            return getUnitEncoder();
        }
        return getConstantEncoder(config.noneValue);
    })();
    return getUnionEncoder([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getTupleEncoder([
            prefix,
            noneValue
        ]), (_value)=>[
                false,
                void 0
            ]),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getTupleEncoder([
            prefix,
            item
        ]), (value)=>[
                true,
                value
            ])
    ], (variant)=>Number(variant !== null));
}
function getNullableDecoder(item, config = {}) {
    const prefix = (()=>{
        if (config.prefix === null) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getUnitDecoder(), ()=>false);
        }
        return getBooleanDecoder({
            size: config.prefix ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU8Decoder"])()
        });
    })();
    const noneValue = (()=>{
        if (config.noneValue === "zeroes") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assertIsFixedSize"])(item);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixDecoderSize"])(getUnitDecoder(), item.fixedSize);
        }
        if (!config.noneValue) {
            return getUnitDecoder();
        }
        return getConstantDecoder(config.noneValue);
    })();
    return getUnionDecoder([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getTupleDecoder([
            prefix,
            noneValue
        ]), ()=>null),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getTupleDecoder([
            prefix,
            item
        ]), ([, value])=>value)
    ], (bytes, offset)=>{
        if (config.prefix === null && !config.noneValue) {
            return Number(offset < bytes.length);
        }
        if (config.prefix === null && config.noneValue != null) {
            const zeroValue = config.noneValue === "zeroes" ? new Uint8Array(noneValue.fixedSize).fill(0) : config.noneValue;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["containsBytes"])(bytes, zeroValue, offset) ? 0 : 1;
        }
        return Number(prefix.read(bytes, offset)[0]);
    });
}
function getNullableCodec(item, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getNullableEncoder(item, config), getNullableDecoder(item, config));
}
function getSetEncoder(item, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformEncoder"])(getArrayEncoder(item, config), (set)=>[
            ...set
        ]);
}
function getSetDecoder(item, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["transformDecoder"])(getArrayDecoder(item, config), (entries)=>new Set(entries));
}
function getSetCodec(item, config = {}) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getSetEncoder(item, config), getSetDecoder(item, config));
}
function getStructEncoder(fields) {
    const fieldCodecs = fields.map(([, codec])=>codec);
    const fixedSize = sumCodecSizes(fieldCodecs.map(getFixedSize));
    const maxSize = sumCodecSizes(fieldCodecs.map(getMaxSize)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEncoder"])({
        ...fixedSize === null ? {
            getSizeFromValue: (value)=>fields.map(([key, codec])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEncodedSize"])(value[key], codec)).reduce((all, one)=>all + one, 0),
            maxSize
        } : {
            fixedSize
        },
        write: (struct, bytes, offset)=>{
            fields.forEach(([key, codec])=>{
                offset = codec.write(struct[key], bytes, offset);
            });
            return offset;
        }
    });
}
function getStructDecoder(fields) {
    const fieldCodecs = fields.map(([, codec])=>codec);
    const fixedSize = sumCodecSizes(fieldCodecs.map(getFixedSize));
    const maxSize = sumCodecSizes(fieldCodecs.map(getMaxSize)) ?? void 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createDecoder"])({
        ...fixedSize === null ? {
            maxSize
        } : {
            fixedSize
        },
        read: (bytes, offset)=>{
            const struct = {};
            fields.forEach(([key, codec])=>{
                const [value, newOffset] = codec.read(bytes, offset);
                offset = newOffset;
                struct[key] = value;
            });
            return [
                struct,
                offset
            ];
        }
    });
}
function getStructCodec(fields) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combineCodec"])(getStructEncoder(fields), getStructDecoder(fields));
}
;
 //# sourceMappingURL=index.browser.mjs.map
 //# sourceMappingURL=index.browser.mjs.map
}),
"[project]/superteam-academy/node_modules/@solana/spl-token-group/lib/esm/state/tokenGroup.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TOKEN_GROUP_SIZE",
    ()=>TOKEN_GROUP_SIZE,
    "packTokenGroup",
    ()=>packTokenGroup,
    "unpackTokenGroup",
    ()=>unpackTokenGroup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-data-structures/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-numbers/dist/index.browser.mjs [app-client] (ecmascript)");
;
;
const tokenGroupCodec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStructCodec"])([
    [
        'updateAuthority',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixCodecSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBytesCodec"])(), 32)
    ],
    [
        'mint',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixCodecSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBytesCodec"])(), 32)
    ],
    [
        'size',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU64Codec"])()
    ],
    [
        'maxSize',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU64Codec"])()
    ]
]);
const TOKEN_GROUP_SIZE = tokenGroupCodec.fixedSize;
// Checks if all elements in the array are 0
function isNonePubkey(buffer) {
    for(let i = 0; i < buffer.length; i++){
        if (buffer[i] !== 0) {
            return false;
        }
    }
    return true;
}
function packTokenGroup(group) {
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = group.updateAuthority ?? __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"].default;
    return tokenGroupCodec.encode({
        updateAuthority: updateAuthority.toBuffer(),
        mint: group.mint.toBuffer(),
        size: group.size,
        maxSize: group.maxSize
    });
}
function unpackTokenGroup(buffer) {
    const data = tokenGroupCodec.decode(buffer);
    return isNonePubkey(data.updateAuthority) ? {
        mint: new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](data.mint),
        size: data.size,
        maxSize: data.maxSize
    } : {
        updateAuthority: new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](data.updateAuthority),
        mint: new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](data.mint),
        size: data.size,
        maxSize: data.maxSize
    };
} //# sourceMappingURL=tokenGroup.js.map
}),
"[project]/superteam-academy/node_modules/@solana/spl-token-group/lib/esm/state/tokenGroupMember.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TOKEN_GROUP_MEMBER_SIZE",
    ()=>TOKEN_GROUP_MEMBER_SIZE,
    "packTokenGroupMember",
    ()=>packTokenGroupMember,
    "unpackTokenGroupMember",
    ()=>unpackTokenGroupMember
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-core/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-data-structures/dist/index.browser.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/@solana/codecs-numbers/dist/index.browser.mjs [app-client] (ecmascript)");
;
;
const tokenGroupMemberCodec = (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStructCodec"])([
    [
        'mint',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixCodecSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBytesCodec"])(), 32)
    ],
    [
        'group',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$core$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fixCodecSize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$data$2d$structures$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBytesCodec"])(), 32)
    ],
    [
        'memberNumber',
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$codecs$2d$numbers$2f$dist$2f$index$2e$browser$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getU64Codec"])()
    ]
]);
const TOKEN_GROUP_MEMBER_SIZE = tokenGroupMemberCodec.fixedSize;
function packTokenGroupMember(member) {
    return tokenGroupMemberCodec.encode({
        mint: member.mint.toBuffer(),
        group: member.group.toBuffer(),
        memberNumber: member.memberNumber
    });
}
function unpackTokenGroupMember(buffer) {
    const data = tokenGroupMemberCodec.decode(buffer);
    return {
        mint: new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](data.mint),
        group: new __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](data.group),
        memberNumber: data.memberNumber
    };
} //# sourceMappingURL=tokenGroupMember.js.map
}),
]);

//# sourceMappingURL=134ab_%40solana_2ac5be66._.js.map