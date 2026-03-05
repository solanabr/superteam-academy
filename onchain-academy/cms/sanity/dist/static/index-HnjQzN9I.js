import { j as G, r as un } from "./sanity-DDM0-WJH.js";
class K {
  constructor(e, l, t) {
    ((this.normal = l), (this.property = e), t && (this.space = t));
  }
}
K.prototype.normal = {};
K.prototype.property = {};
K.prototype.space = void 0;
function Ln(n, e) {
  const l = {},
    t = {};
  for (const r of n) (Object.assign(l, r.property), Object.assign(t, r.normal));
  return new K(l, t, e);
}
function W(n) {
  return n.toLowerCase();
}
class D {
  constructor(e, l) {
    ((this.attribute = l), (this.property = e));
  }
}
D.prototype.attribute = "";
D.prototype.booleanish = !1;
D.prototype.boolean = !1;
D.prototype.commaOrSpaceSeparated = !1;
D.prototype.commaSeparated = !1;
D.prototype.defined = !1;
D.prototype.mustUseProperty = !1;
D.prototype.number = !1;
D.prototype.overloadedBoolean = !1;
D.prototype.property = "";
D.prototype.spaceSeparated = !1;
D.prototype.space = void 0;
let Gn = 0;
const f = z(),
  P = z(),
  en = z(),
  i = z(),
  x = z(),
  F = z(),
  L = z();
function z() {
  return 2 ** ++Gn;
}
const ln = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        boolean: f,
        booleanish: P,
        commaOrSpaceSeparated: L,
        commaSeparated: F,
        number: i,
        overloadedBoolean: en,
        spaceSeparated: x,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  nn = Object.keys(ln);
class on extends D {
  constructor(e, l, t, r) {
    let o = -1;
    if ((super(e, l), sn(this, "space", r), typeof t == "number"))
      for (; ++o < nn.length; ) {
        const a = nn[o];
        sn(this, nn[o], (t & ln[a]) === ln[a]);
      }
  }
}
on.prototype.defined = !0;
function sn(n, e, l) {
  l && (n[e] = l);
}
function H(n) {
  const e = {},
    l = {};
  for (const [t, r] of Object.entries(n.properties)) {
    const o = new on(t, n.transform(n.attributes || {}, t), r, n.space);
    (n.mustUseProperty &&
      n.mustUseProperty.includes(t) &&
      (o.mustUseProperty = !0),
      (e[t] = o),
      (l[W(t)] = t),
      (l[W(o.attribute)] = t));
  }
  return new K(e, l, n.space);
}
const Nn = H({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: P,
    ariaAutoComplete: null,
    ariaBusy: P,
    ariaChecked: P,
    ariaColCount: i,
    ariaColIndex: i,
    ariaColSpan: i,
    ariaControls: x,
    ariaCurrent: null,
    ariaDescribedBy: x,
    ariaDetails: null,
    ariaDisabled: P,
    ariaDropEffect: x,
    ariaErrorMessage: null,
    ariaExpanded: P,
    ariaFlowTo: x,
    ariaGrabbed: P,
    ariaHasPopup: null,
    ariaHidden: P,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: x,
    ariaLevel: i,
    ariaLive: null,
    ariaModal: P,
    ariaMultiLine: P,
    ariaMultiSelectable: P,
    ariaOrientation: null,
    ariaOwns: x,
    ariaPlaceholder: null,
    ariaPosInSet: i,
    ariaPressed: P,
    ariaReadOnly: P,
    ariaRelevant: null,
    ariaRequired: P,
    ariaRoleDescription: x,
    ariaRowCount: i,
    ariaRowIndex: i,
    ariaRowSpan: i,
    ariaSelected: P,
    ariaSetSize: i,
    ariaSort: null,
    ariaValueMax: i,
    ariaValueMin: i,
    ariaValueNow: i,
    ariaValueText: null,
    role: null,
  },
  transform(n, e) {
    return e === "role" ? e : "aria-" + e.slice(4).toLowerCase();
  },
});
function Rn(n, e) {
  return e in n ? n[e] : e;
}
function Tn(n, e) {
  return Rn(n, e.toLowerCase());
}
const Xn = H({
    attributes: {
      acceptcharset: "accept-charset",
      classname: "class",
      htmlfor: "for",
      httpequiv: "http-equiv",
    },
    mustUseProperty: ["checked", "multiple", "muted", "selected"],
    properties: {
      abbr: null,
      accept: F,
      acceptCharset: x,
      accessKey: x,
      action: null,
      allow: null,
      allowFullScreen: f,
      allowPaymentRequest: f,
      allowUserMedia: f,
      alt: null,
      as: null,
      async: f,
      autoCapitalize: null,
      autoComplete: x,
      autoFocus: f,
      autoPlay: f,
      blocking: x,
      capture: null,
      charSet: null,
      checked: f,
      cite: null,
      className: x,
      cols: i,
      colSpan: null,
      content: null,
      contentEditable: P,
      controls: f,
      controlsList: x,
      coords: i | F,
      crossOrigin: null,
      data: null,
      dateTime: null,
      decoding: null,
      default: f,
      defer: f,
      dir: null,
      dirName: null,
      disabled: f,
      download: en,
      draggable: P,
      encType: null,
      enterKeyHint: null,
      fetchPriority: null,
      form: null,
      formAction: null,
      formEncType: null,
      formMethod: null,
      formNoValidate: f,
      formTarget: null,
      headers: x,
      height: i,
      hidden: en,
      high: i,
      href: null,
      hrefLang: null,
      htmlFor: x,
      httpEquiv: x,
      id: null,
      imageSizes: null,
      imageSrcSet: null,
      inert: f,
      inputMode: null,
      integrity: null,
      is: null,
      isMap: f,
      itemId: null,
      itemProp: x,
      itemRef: x,
      itemScope: f,
      itemType: x,
      kind: null,
      label: null,
      lang: null,
      language: null,
      list: null,
      loading: null,
      loop: f,
      low: i,
      manifest: null,
      max: null,
      maxLength: i,
      media: null,
      method: null,
      min: null,
      minLength: i,
      multiple: f,
      muted: f,
      name: null,
      nonce: null,
      noModule: f,
      noValidate: f,
      onAbort: null,
      onAfterPrint: null,
      onAuxClick: null,
      onBeforeMatch: null,
      onBeforePrint: null,
      onBeforeToggle: null,
      onBeforeUnload: null,
      onBlur: null,
      onCancel: null,
      onCanPlay: null,
      onCanPlayThrough: null,
      onChange: null,
      onClick: null,
      onClose: null,
      onContextLost: null,
      onContextMenu: null,
      onContextRestored: null,
      onCopy: null,
      onCueChange: null,
      onCut: null,
      onDblClick: null,
      onDrag: null,
      onDragEnd: null,
      onDragEnter: null,
      onDragExit: null,
      onDragLeave: null,
      onDragOver: null,
      onDragStart: null,
      onDrop: null,
      onDurationChange: null,
      onEmptied: null,
      onEnded: null,
      onError: null,
      onFocus: null,
      onFormData: null,
      onHashChange: null,
      onInput: null,
      onInvalid: null,
      onKeyDown: null,
      onKeyPress: null,
      onKeyUp: null,
      onLanguageChange: null,
      onLoad: null,
      onLoadedData: null,
      onLoadedMetadata: null,
      onLoadEnd: null,
      onLoadStart: null,
      onMessage: null,
      onMessageError: null,
      onMouseDown: null,
      onMouseEnter: null,
      onMouseLeave: null,
      onMouseMove: null,
      onMouseOut: null,
      onMouseOver: null,
      onMouseUp: null,
      onOffline: null,
      onOnline: null,
      onPageHide: null,
      onPageShow: null,
      onPaste: null,
      onPause: null,
      onPlay: null,
      onPlaying: null,
      onPopState: null,
      onProgress: null,
      onRateChange: null,
      onRejectionHandled: null,
      onReset: null,
      onResize: null,
      onScroll: null,
      onScrollEnd: null,
      onSecurityPolicyViolation: null,
      onSeeked: null,
      onSeeking: null,
      onSelect: null,
      onSlotChange: null,
      onStalled: null,
      onStorage: null,
      onSubmit: null,
      onSuspend: null,
      onTimeUpdate: null,
      onToggle: null,
      onUnhandledRejection: null,
      onUnload: null,
      onVolumeChange: null,
      onWaiting: null,
      onWheel: null,
      open: f,
      optimum: i,
      pattern: null,
      ping: x,
      placeholder: null,
      playsInline: f,
      popover: null,
      popoverTarget: null,
      popoverTargetAction: null,
      poster: null,
      preload: null,
      readOnly: f,
      referrerPolicy: null,
      rel: x,
      required: f,
      reversed: f,
      rows: i,
      rowSpan: i,
      sandbox: x,
      scope: null,
      scoped: f,
      seamless: f,
      selected: f,
      shadowRootClonable: f,
      shadowRootDelegatesFocus: f,
      shadowRootMode: null,
      shape: null,
      size: i,
      sizes: null,
      slot: null,
      span: i,
      spellCheck: P,
      src: null,
      srcDoc: null,
      srcLang: null,
      srcSet: null,
      start: i,
      step: null,
      style: null,
      tabIndex: i,
      target: null,
      title: null,
      translate: null,
      type: null,
      typeMustMatch: f,
      useMap: null,
      value: P,
      width: i,
      wrap: null,
      writingSuggestions: null,
      align: null,
      aLink: null,
      archive: x,
      axis: null,
      background: null,
      bgColor: null,
      border: i,
      borderColor: null,
      bottomMargin: i,
      cellPadding: null,
      cellSpacing: null,
      char: null,
      charOff: null,
      classId: null,
      clear: null,
      code: null,
      codeBase: null,
      codeType: null,
      color: null,
      compact: f,
      declare: f,
      event: null,
      face: null,
      frame: null,
      frameBorder: null,
      hSpace: i,
      leftMargin: i,
      link: null,
      longDesc: null,
      lowSrc: null,
      marginHeight: i,
      marginWidth: i,
      noResize: f,
      noHref: f,
      noShade: f,
      noWrap: f,
      object: null,
      profile: null,
      prompt: null,
      rev: null,
      rightMargin: i,
      rules: null,
      scheme: null,
      scrolling: P,
      standby: null,
      summary: null,
      text: null,
      topMargin: i,
      valueType: null,
      version: null,
      vAlign: null,
      vLink: null,
      vSpace: i,
      allowTransparency: null,
      autoCorrect: null,
      autoSave: null,
      disablePictureInPicture: f,
      disableRemotePlayback: f,
      prefix: null,
      property: null,
      results: i,
      security: null,
      unselectable: null,
    },
    space: "html",
    transform: Tn,
  }),
  Yn = H({
    attributes: {
      accentHeight: "accent-height",
      alignmentBaseline: "alignment-baseline",
      arabicForm: "arabic-form",
      baselineShift: "baseline-shift",
      capHeight: "cap-height",
      className: "class",
      clipPath: "clip-path",
      clipRule: "clip-rule",
      colorInterpolation: "color-interpolation",
      colorInterpolationFilters: "color-interpolation-filters",
      colorProfile: "color-profile",
      colorRendering: "color-rendering",
      crossOrigin: "crossorigin",
      dataType: "datatype",
      dominantBaseline: "dominant-baseline",
      enableBackground: "enable-background",
      fillOpacity: "fill-opacity",
      fillRule: "fill-rule",
      floodColor: "flood-color",
      floodOpacity: "flood-opacity",
      fontFamily: "font-family",
      fontSize: "font-size",
      fontSizeAdjust: "font-size-adjust",
      fontStretch: "font-stretch",
      fontStyle: "font-style",
      fontVariant: "font-variant",
      fontWeight: "font-weight",
      glyphName: "glyph-name",
      glyphOrientationHorizontal: "glyph-orientation-horizontal",
      glyphOrientationVertical: "glyph-orientation-vertical",
      hrefLang: "hreflang",
      horizAdvX: "horiz-adv-x",
      horizOriginX: "horiz-origin-x",
      horizOriginY: "horiz-origin-y",
      imageRendering: "image-rendering",
      letterSpacing: "letter-spacing",
      lightingColor: "lighting-color",
      markerEnd: "marker-end",
      markerMid: "marker-mid",
      markerStart: "marker-start",
      navDown: "nav-down",
      navDownLeft: "nav-down-left",
      navDownRight: "nav-down-right",
      navLeft: "nav-left",
      navNext: "nav-next",
      navPrev: "nav-prev",
      navRight: "nav-right",
      navUp: "nav-up",
      navUpLeft: "nav-up-left",
      navUpRight: "nav-up-right",
      onAbort: "onabort",
      onActivate: "onactivate",
      onAfterPrint: "onafterprint",
      onBeforePrint: "onbeforeprint",
      onBegin: "onbegin",
      onCancel: "oncancel",
      onCanPlay: "oncanplay",
      onCanPlayThrough: "oncanplaythrough",
      onChange: "onchange",
      onClick: "onclick",
      onClose: "onclose",
      onCopy: "oncopy",
      onCueChange: "oncuechange",
      onCut: "oncut",
      onDblClick: "ondblclick",
      onDrag: "ondrag",
      onDragEnd: "ondragend",
      onDragEnter: "ondragenter",
      onDragExit: "ondragexit",
      onDragLeave: "ondragleave",
      onDragOver: "ondragover",
      onDragStart: "ondragstart",
      onDrop: "ondrop",
      onDurationChange: "ondurationchange",
      onEmptied: "onemptied",
      onEnd: "onend",
      onEnded: "onended",
      onError: "onerror",
      onFocus: "onfocus",
      onFocusIn: "onfocusin",
      onFocusOut: "onfocusout",
      onHashChange: "onhashchange",
      onInput: "oninput",
      onInvalid: "oninvalid",
      onKeyDown: "onkeydown",
      onKeyPress: "onkeypress",
      onKeyUp: "onkeyup",
      onLoad: "onload",
      onLoadedData: "onloadeddata",
      onLoadedMetadata: "onloadedmetadata",
      onLoadStart: "onloadstart",
      onMessage: "onmessage",
      onMouseDown: "onmousedown",
      onMouseEnter: "onmouseenter",
      onMouseLeave: "onmouseleave",
      onMouseMove: "onmousemove",
      onMouseOut: "onmouseout",
      onMouseOver: "onmouseover",
      onMouseUp: "onmouseup",
      onMouseWheel: "onmousewheel",
      onOffline: "onoffline",
      onOnline: "ononline",
      onPageHide: "onpagehide",
      onPageShow: "onpageshow",
      onPaste: "onpaste",
      onPause: "onpause",
      onPlay: "onplay",
      onPlaying: "onplaying",
      onPopState: "onpopstate",
      onProgress: "onprogress",
      onRateChange: "onratechange",
      onRepeat: "onrepeat",
      onReset: "onreset",
      onResize: "onresize",
      onScroll: "onscroll",
      onSeeked: "onseeked",
      onSeeking: "onseeking",
      onSelect: "onselect",
      onShow: "onshow",
      onStalled: "onstalled",
      onStorage: "onstorage",
      onSubmit: "onsubmit",
      onSuspend: "onsuspend",
      onTimeUpdate: "ontimeupdate",
      onToggle: "ontoggle",
      onUnload: "onunload",
      onVolumeChange: "onvolumechange",
      onWaiting: "onwaiting",
      onZoom: "onzoom",
      overlinePosition: "overline-position",
      overlineThickness: "overline-thickness",
      paintOrder: "paint-order",
      panose1: "panose-1",
      pointerEvents: "pointer-events",
      referrerPolicy: "referrerpolicy",
      renderingIntent: "rendering-intent",
      shapeRendering: "shape-rendering",
      stopColor: "stop-color",
      stopOpacity: "stop-opacity",
      strikethroughPosition: "strikethrough-position",
      strikethroughThickness: "strikethrough-thickness",
      strokeDashArray: "stroke-dasharray",
      strokeDashOffset: "stroke-dashoffset",
      strokeLineCap: "stroke-linecap",
      strokeLineJoin: "stroke-linejoin",
      strokeMiterLimit: "stroke-miterlimit",
      strokeOpacity: "stroke-opacity",
      strokeWidth: "stroke-width",
      tabIndex: "tabindex",
      textAnchor: "text-anchor",
      textDecoration: "text-decoration",
      textRendering: "text-rendering",
      transformOrigin: "transform-origin",
      typeOf: "typeof",
      underlinePosition: "underline-position",
      underlineThickness: "underline-thickness",
      unicodeBidi: "unicode-bidi",
      unicodeRange: "unicode-range",
      unitsPerEm: "units-per-em",
      vAlphabetic: "v-alphabetic",
      vHanging: "v-hanging",
      vIdeographic: "v-ideographic",
      vMathematical: "v-mathematical",
      vectorEffect: "vector-effect",
      vertAdvY: "vert-adv-y",
      vertOriginX: "vert-origin-x",
      vertOriginY: "vert-origin-y",
      wordSpacing: "word-spacing",
      writingMode: "writing-mode",
      xHeight: "x-height",
      playbackOrder: "playbackorder",
      timelineBegin: "timelinebegin",
    },
    properties: {
      about: L,
      accentHeight: i,
      accumulate: null,
      additive: null,
      alignmentBaseline: null,
      alphabetic: i,
      amplitude: i,
      arabicForm: null,
      ascent: i,
      attributeName: null,
      attributeType: null,
      azimuth: i,
      bandwidth: null,
      baselineShift: null,
      baseFrequency: null,
      baseProfile: null,
      bbox: null,
      begin: null,
      bias: i,
      by: null,
      calcMode: null,
      capHeight: i,
      className: x,
      clip: null,
      clipPath: null,
      clipPathUnits: null,
      clipRule: null,
      color: null,
      colorInterpolation: null,
      colorInterpolationFilters: null,
      colorProfile: null,
      colorRendering: null,
      content: null,
      contentScriptType: null,
      contentStyleType: null,
      crossOrigin: null,
      cursor: null,
      cx: null,
      cy: null,
      d: null,
      dataType: null,
      defaultAction: null,
      descent: i,
      diffuseConstant: i,
      direction: null,
      display: null,
      dur: null,
      divisor: i,
      dominantBaseline: null,
      download: f,
      dx: null,
      dy: null,
      edgeMode: null,
      editable: null,
      elevation: i,
      enableBackground: null,
      end: null,
      event: null,
      exponent: i,
      externalResourcesRequired: null,
      fill: null,
      fillOpacity: i,
      fillRule: null,
      filter: null,
      filterRes: null,
      filterUnits: null,
      floodColor: null,
      floodOpacity: null,
      focusable: null,
      focusHighlight: null,
      fontFamily: null,
      fontSize: null,
      fontSizeAdjust: null,
      fontStretch: null,
      fontStyle: null,
      fontVariant: null,
      fontWeight: null,
      format: null,
      fr: null,
      from: null,
      fx: null,
      fy: null,
      g1: F,
      g2: F,
      glyphName: F,
      glyphOrientationHorizontal: null,
      glyphOrientationVertical: null,
      glyphRef: null,
      gradientTransform: null,
      gradientUnits: null,
      handler: null,
      hanging: i,
      hatchContentUnits: null,
      hatchUnits: null,
      height: null,
      href: null,
      hrefLang: null,
      horizAdvX: i,
      horizOriginX: i,
      horizOriginY: i,
      id: null,
      ideographic: i,
      imageRendering: null,
      initialVisibility: null,
      in: null,
      in2: null,
      intercept: i,
      k: i,
      k1: i,
      k2: i,
      k3: i,
      k4: i,
      kernelMatrix: L,
      kernelUnitLength: null,
      keyPoints: null,
      keySplines: null,
      keyTimes: null,
      kerning: null,
      lang: null,
      lengthAdjust: null,
      letterSpacing: null,
      lightingColor: null,
      limitingConeAngle: i,
      local: null,
      markerEnd: null,
      markerMid: null,
      markerStart: null,
      markerHeight: null,
      markerUnits: null,
      markerWidth: null,
      mask: null,
      maskContentUnits: null,
      maskUnits: null,
      mathematical: null,
      max: null,
      media: null,
      mediaCharacterEncoding: null,
      mediaContentEncodings: null,
      mediaSize: i,
      mediaTime: null,
      method: null,
      min: null,
      mode: null,
      name: null,
      navDown: null,
      navDownLeft: null,
      navDownRight: null,
      navLeft: null,
      navNext: null,
      navPrev: null,
      navRight: null,
      navUp: null,
      navUpLeft: null,
      navUpRight: null,
      numOctaves: null,
      observer: null,
      offset: null,
      onAbort: null,
      onActivate: null,
      onAfterPrint: null,
      onBeforePrint: null,
      onBegin: null,
      onCancel: null,
      onCanPlay: null,
      onCanPlayThrough: null,
      onChange: null,
      onClick: null,
      onClose: null,
      onCopy: null,
      onCueChange: null,
      onCut: null,
      onDblClick: null,
      onDrag: null,
      onDragEnd: null,
      onDragEnter: null,
      onDragExit: null,
      onDragLeave: null,
      onDragOver: null,
      onDragStart: null,
      onDrop: null,
      onDurationChange: null,
      onEmptied: null,
      onEnd: null,
      onEnded: null,
      onError: null,
      onFocus: null,
      onFocusIn: null,
      onFocusOut: null,
      onHashChange: null,
      onInput: null,
      onInvalid: null,
      onKeyDown: null,
      onKeyPress: null,
      onKeyUp: null,
      onLoad: null,
      onLoadedData: null,
      onLoadedMetadata: null,
      onLoadStart: null,
      onMessage: null,
      onMouseDown: null,
      onMouseEnter: null,
      onMouseLeave: null,
      onMouseMove: null,
      onMouseOut: null,
      onMouseOver: null,
      onMouseUp: null,
      onMouseWheel: null,
      onOffline: null,
      onOnline: null,
      onPageHide: null,
      onPageShow: null,
      onPaste: null,
      onPause: null,
      onPlay: null,
      onPlaying: null,
      onPopState: null,
      onProgress: null,
      onRateChange: null,
      onRepeat: null,
      onReset: null,
      onResize: null,
      onScroll: null,
      onSeeked: null,
      onSeeking: null,
      onSelect: null,
      onShow: null,
      onStalled: null,
      onStorage: null,
      onSubmit: null,
      onSuspend: null,
      onTimeUpdate: null,
      onToggle: null,
      onUnload: null,
      onVolumeChange: null,
      onWaiting: null,
      onZoom: null,
      opacity: null,
      operator: null,
      order: null,
      orient: null,
      orientation: null,
      origin: null,
      overflow: null,
      overlay: null,
      overlinePosition: i,
      overlineThickness: i,
      paintOrder: null,
      panose1: null,
      path: null,
      pathLength: i,
      patternContentUnits: null,
      patternTransform: null,
      patternUnits: null,
      phase: null,
      ping: x,
      pitch: null,
      playbackOrder: null,
      pointerEvents: null,
      points: null,
      pointsAtX: i,
      pointsAtY: i,
      pointsAtZ: i,
      preserveAlpha: null,
      preserveAspectRatio: null,
      primitiveUnits: null,
      propagate: null,
      property: L,
      r: null,
      radius: null,
      referrerPolicy: null,
      refX: null,
      refY: null,
      rel: L,
      rev: L,
      renderingIntent: null,
      repeatCount: null,
      repeatDur: null,
      requiredExtensions: L,
      requiredFeatures: L,
      requiredFonts: L,
      requiredFormats: L,
      resource: null,
      restart: null,
      result: null,
      rotate: null,
      rx: null,
      ry: null,
      scale: null,
      seed: null,
      shapeRendering: null,
      side: null,
      slope: null,
      snapshotTime: null,
      specularConstant: i,
      specularExponent: i,
      spreadMethod: null,
      spacing: null,
      startOffset: null,
      stdDeviation: null,
      stemh: null,
      stemv: null,
      stitchTiles: null,
      stopColor: null,
      stopOpacity: null,
      strikethroughPosition: i,
      strikethroughThickness: i,
      string: null,
      stroke: null,
      strokeDashArray: L,
      strokeDashOffset: null,
      strokeLineCap: null,
      strokeLineJoin: null,
      strokeMiterLimit: i,
      strokeOpacity: i,
      strokeWidth: null,
      style: null,
      surfaceScale: i,
      syncBehavior: null,
      syncBehaviorDefault: null,
      syncMaster: null,
      syncTolerance: null,
      syncToleranceDefault: null,
      systemLanguage: L,
      tabIndex: i,
      tableValues: null,
      target: null,
      targetX: i,
      targetY: i,
      textAnchor: null,
      textDecoration: null,
      textRendering: null,
      textLength: null,
      timelineBegin: null,
      title: null,
      transformBehavior: null,
      type: null,
      typeOf: L,
      to: null,
      transform: null,
      transformOrigin: null,
      u1: null,
      u2: null,
      underlinePosition: i,
      underlineThickness: i,
      unicode: null,
      unicodeBidi: null,
      unicodeRange: null,
      unitsPerEm: i,
      values: null,
      vAlphabetic: i,
      vMathematical: i,
      vectorEffect: null,
      vHanging: i,
      vIdeographic: i,
      version: null,
      vertAdvY: i,
      vertOriginX: i,
      vertOriginY: i,
      viewBox: null,
      viewTarget: null,
      visibility: null,
      width: null,
      widths: null,
      wordSpacing: null,
      writingMode: null,
      x: null,
      x1: null,
      x2: null,
      xChannelSelector: null,
      xHeight: i,
      y: null,
      y1: null,
      y2: null,
      yChannelSelector: null,
      z: null,
      zoomAndPan: null,
    },
    space: "svg",
    transform: Rn,
  }),
  _n = H({
    properties: {
      xLinkActuate: null,
      xLinkArcRole: null,
      xLinkHref: null,
      xLinkRole: null,
      xLinkShow: null,
      xLinkTitle: null,
      xLinkType: null,
    },
    space: "xlink",
    transform(n, e) {
      return "xlink:" + e.slice(5).toLowerCase();
    },
  }),
  jn = H({
    attributes: { xmlnsxlink: "xmlns:xlink" },
    properties: { xmlnsXLink: null, xmlns: null },
    space: "xmlns",
    transform: Tn,
  }),
  In = H({
    properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
    space: "xml",
    transform(n, e) {
      return "xml:" + e.slice(3).toLowerCase();
    },
  }),
  Zn = /[A-Z]/g,
  cn = /-[a-z]/g,
  Jn = /^data[-\w.:]+$/i;
function Qn(n, e) {
  const l = W(e);
  let t = e,
    r = D;
  if (l in n.normal) return n.property[n.normal[l]];
  if (l.length > 4 && l.slice(0, 4) === "data" && Jn.test(e)) {
    if (e.charAt(4) === "-") {
      const o = e.slice(5).replace(cn, ee);
      t = "data" + o.charAt(0).toUpperCase() + o.slice(1);
    } else {
      const o = e.slice(4);
      if (!cn.test(o)) {
        let a = o.replace(Zn, ne);
        (a.charAt(0) !== "-" && (a = "-" + a), (e = "data" + a));
      }
    }
    r = on;
  }
  return new r(t, e);
}
function ne(n) {
  return "-" + n.toLowerCase();
}
function ee(n) {
  return n.charAt(1).toUpperCase();
}
const le = Ln([Nn, Xn, _n, jn, In], "html"),
  te = Ln([Nn, Yn, _n, jn, In], "svg");
function fn(n) {
  const e = [],
    l = String(n || "");
  let t = l.indexOf(","),
    r = 0,
    o = !1;
  for (; !o; ) {
    t === -1 && ((t = l.length), (o = !0));
    const a = l.slice(r, t).trim();
    ((a || !o) && e.push(a), (r = t + 1), (t = l.indexOf(",", r)));
  }
  return e;
}
const pn = /[#.]/g;
function re(n, e) {
  const l = n || "",
    t = {};
  let r = 0,
    o,
    a;
  for (; r < l.length; ) {
    pn.lastIndex = r;
    const u = pn.exec(l),
      s = l.slice(r, u ? u.index : l.length);
    (s &&
      (o
        ? o === "#"
          ? (t.id = s)
          : Array.isArray(t.className)
            ? t.className.push(s)
            : (t.className = [s])
        : (a = s),
      (r += s.length)),
      u && ((o = u[0]), r++));
  }
  return {
    type: "element",
    tagName: a || e || "div",
    properties: t,
    children: [],
  };
}
function dn(n) {
  const e = String(n || "").trim();
  return e ? e.split(/[ \t\n\r\f]+/g) : [];
}
function Un(n, e, l) {
  const t = l ? ue(l) : void 0;
  function r(o, a, ...u) {
    let s;
    if (o == null) {
      s = { type: "root", children: [] };
      const c = a;
      u.unshift(c);
    } else {
      s = re(o, e);
      const c = s.tagName.toLowerCase(),
        p = t ? t.get(c) : void 0;
      if (((s.tagName = p || c), oe(a))) u.unshift(a);
      else for (const [d, h] of Object.entries(a)) ie(n, s.properties, d, h);
    }
    for (const c of u) tn(s.children, c);
    return (
      s.type === "element" &&
        s.tagName === "template" &&
        ((s.content = { type: "root", children: s.children }),
        (s.children = [])),
      s
    );
  }
  return r;
}
function oe(n) {
  if (n === null || typeof n != "object" || Array.isArray(n)) return !0;
  if (typeof n.type != "string") return !1;
  const e = n,
    l = Object.keys(n);
  for (const t of l) {
    const r = e[t];
    if (r && typeof r == "object") {
      if (!Array.isArray(r)) return !0;
      const o = r;
      for (const a of o)
        if (typeof a != "number" && typeof a != "string") return !0;
    }
  }
  return !!("children" in n && Array.isArray(n.children));
}
function ie(n, e, l, t) {
  const r = Qn(n, l);
  let o;
  if (t != null) {
    if (typeof t == "number") {
      if (Number.isNaN(t)) return;
      o = t;
    } else
      typeof t == "boolean"
        ? (o = t)
        : typeof t == "string"
          ? r.spaceSeparated
            ? (o = dn(t))
            : r.commaSeparated
              ? (o = fn(t))
              : r.commaOrSpaceSeparated
                ? (o = dn(fn(t).join(" ")))
                : (o = gn(r, r.property, t))
          : Array.isArray(t)
            ? (o = [...t])
            : (o = r.property === "style" ? ae(t) : String(t));
    if (Array.isArray(o)) {
      const a = [];
      for (const u of o) a.push(gn(r, r.property, u));
      o = a;
    }
    (r.property === "className" &&
      Array.isArray(e.className) &&
      (o = e.className.concat(o)),
      (e[r.property] = o));
  }
}
function tn(n, e) {
  if (e != null)
    if (typeof e == "number" || typeof e == "string")
      n.push({ type: "text", value: String(e) });
    else if (Array.isArray(e)) for (const l of e) tn(n, l);
    else if (typeof e == "object" && "type" in e)
      e.type === "root" ? tn(n, e.children) : n.push(e);
    else throw new Error("Expected node, nodes, or string, got `" + e + "`");
}
function gn(n, e, l) {
  if (typeof l == "string") {
    if (n.number && l && !Number.isNaN(Number(l))) return Number(l);
    if ((n.boolean || n.overloadedBoolean) && (l === "" || W(l) === W(e)))
      return !0;
  }
  return l;
}
function ae(n) {
  const e = [];
  for (const [l, t] of Object.entries(n)) e.push([l, t].join(": "));
  return e.join("; ");
}
function ue(n) {
  const e = new Map();
  for (const l of n) e.set(l.toLowerCase(), l);
  return e;
}
const se = [
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "solidColor",
    "textArea",
    "textPath",
  ],
  ce = Un(le, "div");
Un(te, "g", se);
const fe = [
    "AElig",
    "AMP",
    "Aacute",
    "Acirc",
    "Agrave",
    "Aring",
    "Atilde",
    "Auml",
    "COPY",
    "Ccedil",
    "ETH",
    "Eacute",
    "Ecirc",
    "Egrave",
    "Euml",
    "GT",
    "Iacute",
    "Icirc",
    "Igrave",
    "Iuml",
    "LT",
    "Ntilde",
    "Oacute",
    "Ocirc",
    "Ograve",
    "Oslash",
    "Otilde",
    "Ouml",
    "QUOT",
    "REG",
    "THORN",
    "Uacute",
    "Ucirc",
    "Ugrave",
    "Uuml",
    "Yacute",
    "aacute",
    "acirc",
    "acute",
    "aelig",
    "agrave",
    "amp",
    "aring",
    "atilde",
    "auml",
    "brvbar",
    "ccedil",
    "cedil",
    "cent",
    "copy",
    "curren",
    "deg",
    "divide",
    "eacute",
    "ecirc",
    "egrave",
    "eth",
    "euml",
    "frac12",
    "frac14",
    "frac34",
    "gt",
    "iacute",
    "icirc",
    "iexcl",
    "igrave",
    "iquest",
    "iuml",
    "laquo",
    "lt",
    "macr",
    "micro",
    "middot",
    "nbsp",
    "not",
    "ntilde",
    "oacute",
    "ocirc",
    "ograve",
    "ordf",
    "ordm",
    "oslash",
    "otilde",
    "ouml",
    "para",
    "plusmn",
    "pound",
    "quot",
    "raquo",
    "reg",
    "sect",
    "shy",
    "sup1",
    "sup2",
    "sup3",
    "szlig",
    "thorn",
    "times",
    "uacute",
    "ucirc",
    "ugrave",
    "uml",
    "uuml",
    "yacute",
    "yen",
    "yuml",
  ],
  hn = {
    0: "�",
    128: "€",
    130: "‚",
    131: "ƒ",
    132: "„",
    133: "…",
    134: "†",
    135: "‡",
    136: "ˆ",
    137: "‰",
    138: "Š",
    139: "‹",
    140: "Œ",
    142: "Ž",
    145: "‘",
    146: "’",
    147: "“",
    148: "”",
    149: "•",
    150: "–",
    151: "—",
    152: "˜",
    153: "™",
    154: "š",
    155: "›",
    156: "œ",
    158: "ž",
    159: "Ÿ",
  };
function zn(n) {
  const e = typeof n == "string" ? n.charCodeAt(0) : n;
  return e >= 48 && e <= 57;
}
function pe(n) {
  const e = typeof n == "string" ? n.charCodeAt(0) : n;
  return (e >= 97 && e <= 102) || (e >= 65 && e <= 70) || (e >= 48 && e <= 57);
}
function de(n) {
  const e = typeof n == "string" ? n.charCodeAt(0) : n;
  return (e >= 97 && e <= 122) || (e >= 65 && e <= 90);
}
function mn(n) {
  return de(n) || zn(n);
}
const yn = document.createElement("i");
function bn(n) {
  const e = "&" + n + ";";
  yn.innerHTML = e;
  const l = yn.textContent;
  return (l.charCodeAt(l.length - 1) === 59 && n !== "semi") || l === e
    ? !1
    : l;
}
const ge = [
  "",
  "Named character references must be terminated by a semicolon",
  "Numeric character references must be terminated by a semicolon",
  "Named character references cannot be empty",
  "Numeric character references cannot be empty",
  "Named character references must be known",
  "Numeric character references cannot be disallowed",
  "Numeric character references cannot be outside the permissible Unicode range",
];
function he(n, e) {
  const l = {},
    t =
      typeof l.additional == "string"
        ? l.additional.charCodeAt(0)
        : l.additional,
    r = [];
  let o = 0,
    a = -1,
    u = "",
    s,
    c;
  l.position &&
    ("start" in l.position || "indent" in l.position
      ? ((c = l.position.indent), (s = l.position.start))
      : (s = l.position));
  let p = (s ? s.line : 0) || 1,
    d = (s ? s.column : 0) || 1,
    h = m(),
    v;
  for (o--; ++o <= n.length; )
    if (
      (v === 10 && (d = (c ? c[a] : 0) || 1), (v = n.charCodeAt(o)), v === 38)
    ) {
      const y = n.charCodeAt(o + 1);
      if (
        y === 9 ||
        y === 10 ||
        y === 12 ||
        y === 32 ||
        y === 38 ||
        y === 60 ||
        Number.isNaN(y) ||
        (t && y === t)
      ) {
        ((u += String.fromCharCode(v)), d++);
        continue;
      }
      const S = o + 1;
      let E = S,
        b = S,
        N;
      if (y === 35) {
        b = ++E;
        const g = n.charCodeAt(b);
        g === 88 || g === 120
          ? ((N = "hexadecimal"), (b = ++E))
          : (N = "decimal");
      } else N = "named";
      let M = "",
        R = "",
        A = "";
      const B = N === "named" ? mn : N === "decimal" ? zn : pe;
      for (b--; ++b <= n.length; ) {
        const g = n.charCodeAt(b);
        if (!B(g)) break;
        ((A += String.fromCharCode(g)),
          N === "named" && fe.includes(A) && ((M = A), (R = bn(A))));
      }
      let j = n.charCodeAt(b) === 59;
      if (j) {
        b++;
        const g = N === "named" ? bn(A) : !1;
        g && ((M = A), (R = g));
      }
      let T = 1 + b - S,
        _ = "";
      if (!(!j && l.nonTerminated === !1))
        if (!A) N !== "named" && C(4, T);
        else if (N === "named") {
          if (j && !R) C(5, 1);
          else if (
            (M !== A && ((b = E + M.length), (T = 1 + b - E), (j = !1)), !j)
          ) {
            const g = M ? 1 : 3;
            if (l.attribute) {
              const I = n.charCodeAt(b);
              I === 61 ? (C(g, T), (R = "")) : mn(I) ? (R = "") : C(g, T);
            } else C(g, T);
          }
          _ = R;
        } else {
          j || C(2, T);
          let g = Number.parseInt(A, N === "hexadecimal" ? 16 : 10);
          if (me(g)) (C(7, T), (_ = "�"));
          else if (g in hn) (C(6, T), (_ = hn[g]));
          else {
            let I = "";
            (ye(g) && C(6, T),
              g > 65535 &&
                ((g -= 65536),
                (I += String.fromCharCode((g >>> 10) | 55296)),
                (g = 56320 | (g & 1023))),
              (_ = I + String.fromCharCode(g)));
          }
        }
      if (_) {
        (w(), (h = m()), (o = b - 1), (d += b - S + 1), r.push(_));
        const g = m();
        (g.offset++,
          l.reference &&
            l.reference.call(
              l.referenceContext || void 0,
              _,
              { start: h, end: g },
              n.slice(S - 1, b),
            ),
          (h = g));
      } else ((A = n.slice(S - 1, b)), (u += A), (d += A.length), (o = b - 1));
    } else
      (v === 10 && (p++, a++, (d = 0)),
        Number.isNaN(v) ? w() : ((u += String.fromCharCode(v)), d++));
  return r.join("");
  function m() {
    return { line: p, column: d, offset: o + ((s ? s.offset : 0) || 0) };
  }
  function C(y, S) {
    let E;
    l.warning &&
      ((E = m()),
      (E.column += S),
      (E.offset += S),
      l.warning.call(l.warningContext || void 0, ge[y], E, y));
  }
  function w() {
    u &&
      (r.push(u),
      l.text && l.text.call(l.textContext || void 0, u, { start: h, end: m() }),
      (u = ""));
  }
}
function me(n) {
  return (n >= 55296 && n <= 57343) || n > 1114111;
}
function ye(n) {
  return (
    (n >= 1 && n <= 8) ||
    n === 11 ||
    (n >= 13 && n <= 31) ||
    (n >= 127 && n <= 159) ||
    (n >= 64976 && n <= 65007) ||
    (n & 65535) === 65535 ||
    (n & 65535) === 65534
  );
}
var be = 0,
  X = {},
  k = {
    util: {
      type: function (n) {
        return Object.prototype.toString.call(n).slice(8, -1);
      },
      objId: function (n) {
        return (
          n.__id || Object.defineProperty(n, "__id", { value: ++be }),
          n.__id
        );
      },
      clone: function n(e, l) {
        l = l || {};
        var t, r;
        switch (k.util.type(e)) {
          case "Object":
            if (((r = k.util.objId(e)), l[r])) return l[r];
            ((t = {}), (l[r] = t));
            for (var o in e) e.hasOwnProperty(o) && (t[o] = n(e[o], l));
            return t;
          case "Array":
            return (
              (r = k.util.objId(e)),
              l[r]
                ? l[r]
                : ((t = []),
                  (l[r] = t),
                  e.forEach(function (a, u) {
                    t[u] = n(a, l);
                  }),
                  t)
            );
          default:
            return e;
        }
      },
    },
    languages: {
      plain: X,
      plaintext: X,
      text: X,
      txt: X,
      extend: function (n, e) {
        var l = k.util.clone(k.languages[n]);
        for (var t in e) l[t] = e[t];
        return l;
      },
      insertBefore: function (n, e, l, t) {
        t = t || k.languages;
        var r = t[n],
          o = {};
        for (var a in r)
          if (r.hasOwnProperty(a)) {
            if (a == e) for (var u in l) l.hasOwnProperty(u) && (o[u] = l[u]);
            l.hasOwnProperty(a) || (o[a] = r[a]);
          }
        var s = t[n];
        return (
          (t[n] = o),
          k.languages.DFS(k.languages, function (c, p) {
            p === s && c != n && (this[c] = o);
          }),
          o
        );
      },
      DFS: function n(e, l, t, r) {
        r = r || {};
        var o = k.util.objId;
        for (var a in e)
          if (e.hasOwnProperty(a)) {
            l.call(e, a, e[a], t || a);
            var u = e[a],
              s = k.util.type(u);
            s === "Object" && !r[o(u)]
              ? ((r[o(u)] = !0), n(u, l, null, r))
              : s === "Array" && !r[o(u)] && ((r[o(u)] = !0), n(u, l, a, r));
          }
      },
    },
    plugins: {},
    highlight: function (n, e, l) {
      var t = { code: n, grammar: e, language: l };
      if ((k.hooks.run("before-tokenize", t), !t.grammar))
        throw new Error('The language "' + t.language + '" has no grammar.');
      return (
        (t.tokens = k.tokenize(t.code, t.grammar)),
        k.hooks.run("after-tokenize", t),
        V.stringify(k.util.encode(t.tokens), t.language)
      );
    },
    tokenize: function (n, e) {
      var l = e.rest;
      if (l) {
        for (var t in l) e[t] = l[t];
        delete e.rest;
      }
      var r = new ve();
      return (Y(r, r.head, n), Bn(n, r, e, r.head, 0), we(r));
    },
    hooks: {
      all: {},
      add: function (n, e) {
        var l = k.hooks.all;
        ((l[n] = l[n] || []), l[n].push(e));
      },
      run: function (n, e) {
        var l = k.hooks.all[n];
        if (!(!l || !l.length)) for (var t = 0, r; (r = l[t++]); ) r(e);
      },
    },
    Token: V,
  };
function V(n, e, l, t) {
  ((this.type = n),
    (this.content = e),
    (this.alias = l),
    (this.length = (t || "").length | 0));
}
function vn(n, e, l, t) {
  n.lastIndex = e;
  var r = n.exec(l);
  if (r && t && r[1]) {
    var o = r[1].length;
    ((r.index += o), (r[0] = r[0].slice(o)));
  }
  return r;
}
function Bn(n, e, l, t, r, o) {
  for (var a in l)
    if (!(!l.hasOwnProperty(a) || !l[a])) {
      var u = l[a];
      u = Array.isArray(u) ? u : [u];
      for (var s = 0; s < u.length; ++s) {
        if (o && o.cause == a + "," + s) return;
        var c = u[s],
          p = c.inside,
          d = !!c.lookbehind,
          h = !!c.greedy,
          v = c.alias;
        if (h && !c.pattern.global) {
          var m = c.pattern.toString().match(/[imsuy]*$/)[0];
          c.pattern = RegExp(c.pattern.source, m + "g");
        }
        for (
          var C = c.pattern || c, w = t.next, y = r;
          w !== e.tail && !(o && y >= o.reach);
          y += w.value.length, w = w.next
        ) {
          var S = w.value;
          if (e.length > n.length) return;
          if (!(S instanceof V)) {
            var E = 1,
              b;
            if (h) {
              if (((b = vn(C, y, n, d)), !b || b.index >= n.length)) break;
              var A = b.index,
                N = b.index + b[0].length,
                M = y;
              for (M += w.value.length; A >= M; )
                ((w = w.next), (M += w.value.length));
              if (((M -= w.value.length), (y = M), w.value instanceof V))
                continue;
              for (
                var R = w;
                R !== e.tail && (M < N || typeof R.value == "string");
                R = R.next
              )
                (E++, (M += R.value.length));
              (E--, (S = n.slice(y, M)), (b.index -= y));
            } else if (((b = vn(C, 0, S, d)), !b)) continue;
            var A = b.index,
              B = b[0],
              j = S.slice(0, A),
              T = S.slice(A + B.length),
              _ = y + S.length;
            o && _ > o.reach && (o.reach = _);
            var g = w.prev;
            (j && ((g = Y(e, g, j)), (y += j.length)), xe(e, g, E));
            var I = new V(a, p ? k.tokenize(B, p) : B, v, B);
            if (((w = Y(e, g, I)), T && Y(e, w, T), E > 1)) {
              var Q = { cause: a + "," + s, reach: _ };
              (Bn(n, e, l, w.prev, y, Q),
                o && Q.reach > o.reach && (o.reach = Q.reach));
            }
          }
        }
      }
    }
}
function ve() {
  var n = { value: null, prev: null, next: null },
    e = { value: null, prev: n, next: null };
  ((n.next = e), (this.head = n), (this.tail = e), (this.length = 0));
}
function Y(n, e, l) {
  var t = e.next,
    r = { value: l, prev: e, next: t };
  return ((e.next = r), (t.prev = r), n.length++, r);
}
function xe(n, e, l) {
  for (var t = e.next, r = 0; r < l && t !== n.tail; r++) t = t.next;
  ((e.next = t), (t.prev = e), (n.length -= r));
}
function we(n) {
  for (var e = [], l = n.head.next; l !== n.tail; )
    (e.push(l.value), (l = l.next));
  return e;
}
const Fn = k;
function Hn() {}
Hn.prototype = Fn;
const O = new Hn();
O.highlight = Ce;
O.register = Pe;
O.alias = Oe;
O.registered = Se;
O.listLanguages = ke;
O.util.encode = Ae;
O.Token.stringify = rn;
function Ce(n, e) {
  if (typeof n != "string")
    throw new TypeError("Expected `string` for `value`, got `" + n + "`");
  let l, t;
  if (e && typeof e == "object") l = e;
  else {
    if (((t = e), typeof t != "string"))
      throw new TypeError("Expected `string` for `name`, got `" + t + "`");
    if (Object.hasOwn(O.languages, t)) l = O.languages[t];
    else throw new Error("Unknown language: `" + t + "` is not registered");
  }
  return { type: "root", children: Fn.highlight.call(O, n, l, t) };
}
function Pe(n) {
  if (typeof n != "function" || !n.displayName)
    throw new Error("Expected `function` for `syntax`, got `" + n + "`");
  Object.hasOwn(O.languages, n.displayName) || n(O);
}
function Oe(n, e) {
  const l = O.languages;
  let t = {};
  typeof n == "string" ? e && (t[n] = e) : (t = n);
  let r;
  for (r in t)
    if (Object.hasOwn(t, r)) {
      const o = t[r],
        a = typeof o == "string" ? [o] : o;
      let u = -1;
      for (; ++u < a.length; ) l[a[u]] = l[r];
    }
}
function Se(n) {
  if (typeof n != "string")
    throw new TypeError(
      "Expected `string` for `aliasOrLanguage`, got `" + n + "`",
    );
  return Object.hasOwn(O.languages, n);
}
function ke() {
  const n = O.languages,
    e = [];
  let l;
  for (l in n) Object.hasOwn(n, l) && typeof n[l] == "object" && e.push(l);
  return e;
}
function rn(n, e) {
  if (typeof n == "string") return { type: "text", value: n };
  if (Array.isArray(n)) {
    const t = [];
    let r = -1;
    for (; ++r < n.length; )
      n[r] !== null && n[r] !== void 0 && n[r] !== "" && t.push(rn(n[r], e));
    return t;
  }
  const l = {
    attributes: {},
    classes: ["token", n.type],
    content: rn(n.content, e),
    language: e,
    tag: "span",
    type: n.type,
  };
  return (
    n.alias &&
      l.classes.push(...(typeof n.alias == "string" ? [n.alias] : n.alias)),
    O.hooks.run("wrap", l),
    ce(l.tag + "." + l.classes.join("."), Ee(l.attributes), l.content)
  );
}
function Ae(n) {
  return n;
}
function Ee(n) {
  let e;
  for (e in n) Object.hasOwn(n, e) && (n[e] = he(n[e]));
  return n;
}
const an = function (n) {
  if (n == null) return Ne;
  if (typeof n == "function") return J(n);
  if (typeof n == "object") return Array.isArray(n) ? Me(n) : De(n);
  if (typeof n == "string") return Le(n);
  throw new Error("Expected function, string, or object as test");
};
function Me(n) {
  const e = [];
  let l = -1;
  for (; ++l < n.length; ) e[l] = an(n[l]);
  return J(t);
  function t(...r) {
    let o = -1;
    for (; ++o < e.length; ) if (e[o].apply(this, r)) return !0;
    return !1;
  }
}
function De(n) {
  const e = n;
  return J(l);
  function l(t) {
    const r = t;
    let o;
    for (o in n) if (r[o] !== e[o]) return !1;
    return !0;
  }
}
function Le(n) {
  return J(e);
  function e(l) {
    return l && l.type === n;
  }
}
function J(n) {
  return e;
  function e(l, t, r) {
    return !!(
      Re(l) && n.call(this, l, typeof t == "number" ? t : void 0, r || void 0)
    );
  }
}
function Ne() {
  return !0;
}
function Re(n) {
  return n !== null && typeof n == "object" && "type" in n;
}
const Te = {}.hasOwnProperty;
function _e(n, e, l) {
  const t = an(e),
    r = e && typeof e == "object" && "cascade" in e ? e.cascade : void 0,
    o = r ?? !0;
  return a(n);
  function a(u, s, c) {
    const p = [];
    if (!t(u, s, c)) return;
    if (je(u)) {
      let v = -1;
      for (; ++v < u.children.length; ) {
        const m = a(u.children[v], v, u);
        m && p.push(m);
      }
      if (o && u.children.length > 0 && p.length === 0) return;
    }
    const d = {};
    let h;
    for (h in u) Te.call(u, h) && (d[h] = h === "children" ? p : u[h]);
    return d;
  }
}
function je(n) {
  return "children" in n && n.children !== void 0;
}
const $n = [],
  Ie = !0,
  xn = !1,
  Ue = "skip";
function wn(n, e, l, t) {
  let r;
  typeof e == "function" && typeof l != "function"
    ? ((t = l), (l = e))
    : (r = e);
  const o = an(r),
    a = t ? -1 : 1;
  u(n, void 0, [])();
  function u(s, c, p) {
    const d = s && typeof s == "object" ? s : {};
    if (typeof d.type == "string") {
      const v =
        typeof d.tagName == "string"
          ? d.tagName
          : typeof d.name == "string"
            ? d.name
            : void 0;
      Object.defineProperty(h, "name", {
        value: "node (" + (s.type + (v ? "<" + v + ">" : "")) + ")",
      });
    }
    return h;
    function h() {
      let v = $n,
        m,
        C,
        w;
      if (
        (!e || o(s, c, p[p.length - 1] || void 0)) &&
        ((v = ze(l(s, p))), v[0] === xn)
      )
        return v;
      if ("children" in s && s.children) {
        const y = s;
        if (y.children && v[0] !== Ue)
          for (
            C = (t ? y.children.length : -1) + a, w = p.concat(y);
            C > -1 && C < y.children.length;
          ) {
            const S = y.children[C];
            if (((m = u(S, C, w)()), m[0] === xn)) return m;
            C = typeof m[1] == "number" ? m[1] : C + a;
          }
      }
      return v;
    }
  }
}
function ze(n) {
  return Array.isArray(n)
    ? n
    : typeof n == "number"
      ? [Ie, n]
      : n == null
        ? $n
        : [n];
}
var Be = Object.defineProperty,
  Fe = Object.defineProperties,
  He = Object.getOwnPropertyDescriptors,
  Cn = Object.getOwnPropertySymbols,
  $e = Object.prototype.hasOwnProperty,
  Ve = Object.prototype.propertyIsEnumerable,
  Pn = (n, e, l) =>
    e in n
      ? Be(n, e, { enumerable: !0, configurable: !0, writable: !0, value: l })
      : (n[e] = l),
  Vn = (n, e) => {
    for (var l in e || (e = {})) $e.call(e, l) && Pn(n, l, e[l]);
    if (Cn) for (var l of Cn(e)) Ve.call(e, l) && Pn(n, l, e[l]);
    return n;
  },
  qn = (n, e) => Fe(n, He(e));
function qe(n, e) {
  const l = e.markers
      .map((r) => (typeof r == "number" ? { line: r } : r))
      .sort((r, o) => r.line - o.line),
    t = Wn(n.children).nodes;
  return l.length === 0 || t.length === 0
    ? qn(Vn({}, n), { children: t })
    : Ge(t, l, e);
}
function Wn(n, e = { lineNumber: 1 }) {
  const l = [];
  return n.reduce(
    (t, r) => {
      if (r.type === "doctype") return t;
      const o = e.lineNumber;
      if (r.type === "text") {
        if (
          r.value.indexOf(`
`) === -1
        )
          return (q(r, o, o), t.nodes.push(r), t);
        const a = r.value.split(`
`);
        for (let u = 0; u < a.length; u++) {
          const s = u === 0 ? e.lineNumber : ++e.lineNumber,
            c = {
              type: "text",
              value:
                u === a.length - 1
                  ? a[u]
                  : `${a[u]}
`,
            },
            p = q(c, s, s);
          t.nodes.push(p);
        }
        return ((t.lineNumber = e.lineNumber), t);
      }
      if (r.type === "element" && r.children) {
        const a = Wn(r.children, e),
          u = a.nodes.find(Z),
          s = a.nodes.findLast(Z);
        return (
          q(r, u ? $(u, o) : o, s ? U(s, o) : o),
          (r.children = a.nodes),
          (t.lineNumber = a.lineNumber),
          t.nodes.push(r),
          t
        );
      }
      return (t.nodes.push(r), t);
    },
    { nodes: l, lineNumber: e.lineNumber },
  );
}
function Z(n) {
  return n.type === "element" || n.type === "text";
}
function $(n, e = 1) {
  return n.data && typeof n.data.lineStart == "number" ? n.data.lineStart : e;
}
function U(n, e = 1) {
  return n.data && typeof n.data.lineEnd == "number" ? n.data.lineEnd : e;
}
function q(n, e, l) {
  return (
    n.data || (n.data = {}),
    (n.data.lineStart = e),
    (n.data.lineEnd = l),
    n
  );
}
function We(n, e) {
  const l = { type: "root", children: e },
    t = new WeakMap(),
    r = new WeakMap(),
    o = new WeakMap(),
    a = [];
  function u(p, d, h) {
    (a.push(d),
      h.forEach((m) => {
        p.has(m) ||
          (p.set(m, Object.assign({}, m, { children: [] })),
          m !== l && a.push(m));
      }));
    let v = h.length;
    for (; v--; ) {
      const m = p.get(h[v]);
      if (!m || !("children" in m)) continue;
      const C = h[v + 1],
        w = p.get(C) || d;
      m.children.indexOf(w) === -1 && m.children.push(w);
    }
  }
  wn(l, (p, d) => {
    if (!("children" in p || !Z(p))) {
      if ($(p) < n) {
        u(t, p, d);
        return;
      }
      if ($(p) === n) {
        u(r, p, d);
        return;
      }
      U(p) > n && a.some((h) => d.includes(h)) && u(o, p, d);
    }
  });
  const s = _e(l, (p) => a.indexOf(p) === -1),
    c = (p) => {
      const d = p.get(l);
      return d
        ? (wn(d, (h, v) => {
            if (Z(h) && "children" in h) {
              q(h, 0, 0);
              return;
            }
            v.forEach((m) => {
              q(m, Math.max($(m), $(h)), Math.max(U(m), U(h)));
            });
          }),
          d.children)
        : [];
    };
  return [...c(t), ...c(r), ...c(o), ...(s ? s.children : [])];
}
function Ke(n, e, l) {
  const t = e.className || "refractor-marker",
    r = { lineStart: e.line, lineEnd: U(n[n.length - 1]), isMarker: !0 };
  return {
    type: "element",
    tagName: "div",
    data: e.component
      ? qn(Vn({}, r), { component: e.component, markerProperties: l })
      : r,
    properties: { className: t },
    children: n,
  };
}
function Ge(n, e, l) {
  const t = e.reduce((a, u) => We(u.line, a), n),
    r = [];
  let o = 0;
  for (let a = 0; a < e.length; a++) {
    const u = e[a];
    for (let c = t[o]; c && U(c) < u.line; c = t[++o]) r.push(c);
    const s = [];
    for (let c = t[o]; c && U(c) === u.line; c = t[++o])
      c.type !== "doctype" && s.push(c);
    s.length > 0 && r.push(Ke(s, u, l));
  }
  for (; o < t.length; ) r.push(t[o++]);
  return { type: "root", children: r };
}
var Xe = Object.defineProperty,
  Ye = Object.defineProperties,
  Ze = Object.getOwnPropertyDescriptors,
  On = Object.getOwnPropertySymbols,
  Je = Object.prototype.hasOwnProperty,
  Qe = Object.prototype.propertyIsEnumerable,
  Sn = (n, e, l) =>
    e in n
      ? Xe(n, e, { enumerable: !0, configurable: !0, writable: !0, value: l })
      : (n[e] = l),
  kn = (n, e) => {
    for (var l in e || (e = {})) Je.call(e, l) && Sn(n, l, e[l]);
    if (On) for (var l of On(e)) Qe.call(e, l) && Sn(n, l, e[l]);
    return n;
  },
  nl = (n, e) => Ye(n, Ze(e));
function Kn(n) {
  return function (e, l) {
    return el(e, l, n);
  };
}
function el(n, e, l) {
  if (n.type === "doctype") return null;
  if (!("tagName" in n)) return n.value;
  let t = "";
  typeof n.properties < "u" &&
    (t = Array.isArray(n.properties.className)
      ? n.properties.className.join(" ")
      : `${n.properties.className}`);
  const r = `fract-${l}-${e}`,
    o = n.children && n.children.map(Kn(l + 1));
  return ll(n.data)
    ? un.createElement(
        n.data.component,
        nl(kn(kn({ key: r }, n.properties), n.data.markerProperties), {
          className: t,
        }),
        o,
      )
    : un.createElement(n.tagName, { key: r, className: t }, o);
}
function ll(n) {
  return (
    typeof n == "object" &&
    n !== null &&
    "component" in n &&
    "markerProperties" in n
  );
}
var tl = Object.defineProperty,
  rl = Object.defineProperties,
  ol = Object.getOwnPropertyDescriptors,
  An = Object.getOwnPropertySymbols,
  il = Object.prototype.hasOwnProperty,
  al = Object.prototype.propertyIsEnumerable,
  En = (n, e, l) =>
    e in n
      ? tl(n, e, { enumerable: !0, configurable: !0, writable: !0, value: l })
      : (n[e] = l),
  Mn = (n, e) => {
    for (var l in e || (e = {})) il.call(e, l) && En(n, l, e[l]);
    if (An) for (var l of An(e)) al.call(e, l) && En(n, l, e[l]);
    return n;
  },
  Dn = (n, e) => rl(n, ol(e));
const ul = "refractor";
function cl(n) {
  const e = n.className || ul,
    l = `language-${n.language}`,
    t = { className: l },
    r = [e, l].filter(Boolean).join(" ");
  if (
    (n.inline && ((t.style = { display: "inline" }), (t.className = e)),
    n.plainText)
  ) {
    const s = G.jsx("code", Dn(Mn({}, t), { children: n.value }));
    return n.inline ? s : G.jsx("pre", { className: r, children: s });
  }
  let o = O.highlight(n.value, n.language);
  n.markers && n.markers.length > 0 && (o = qe(o, { markers: n.markers }));
  const a = o.children.length === 0 ? n.value : o.children.map(Kn(0)),
    u = G.jsx("code", Dn(Mn({}, t), { children: a }));
  return n.inline ? u : G.jsx("pre", { className: r, children: u });
}
const fl = (n) => O.register(n),
  pl = (n) => O.registered(n);
export { cl as Refractor, pl as hasLanguage, fl as registerLanguage };
