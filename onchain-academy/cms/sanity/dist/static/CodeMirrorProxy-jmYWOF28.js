const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "static/index-CKzs9ZvX.js",
      "static/index-By0zYFtB.js",
      "static/sanity-DDM0-WJH.js",
      "static/index-BV8XMK86.js",
      "static/index-BKhmWDdr.js",
      "static/index-DIq6o97W.js",
      "static/index-BFOAxuVg.js",
      "static/index-5YKTl10v.js",
      "static/index-DK8KNWEi.js",
      "static/sass-BR7ksiGk.js",
      "static/css-Bt2UjfAg.js",
    ]),
) => i.map((i) => d[i]);
import {
  r as te,
  _ as Xf,
  j as _a,
  b as Qf,
  c as Xi,
  u as qa,
  e as $a,
  f as bt,
  h as Zf,
  i as eu,
  k as ee,
} from "./sanity-DDM0-WJH.js";
let tr = [],
  Ka = [];
(() => {
  let n =
    "lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o"
      .split(",")
      .map((e) => (e ? parseInt(e, 36) : 1));
  for (let e = 0, t = 0; e < n.length; e++)
    (e % 2 ? Ka : tr).push((t = t + n[e]));
})();
function tu(n) {
  if (n < 768) return !1;
  for (let e = 0, t = tr.length; ; ) {
    let i = (e + t) >> 1;
    if (n < tr[i]) t = i;
    else if (n >= Ka[i]) e = i + 1;
    else return !0;
    if (e == t) return !1;
  }
}
function $o(n) {
  return n >= 127462 && n <= 127487;
}
const Ko = 8205;
function iu(n, e, t = !0, i = !0) {
  return (t ? ja : nu)(n, e, i);
}
function ja(n, e, t) {
  if (e == n.length) return e;
  e && Ua(n.charCodeAt(e)) && Ga(n.charCodeAt(e - 1)) && e--;
  let i = As(n, e);
  for (e += jo(i); e < n.length; ) {
    let s = As(n, e);
    if (i == Ko || s == Ko || (t && tu(s))) ((e += jo(s)), (i = s));
    else if ($o(s)) {
      let r = 0,
        o = e - 2;
      for (; o >= 0 && $o(As(n, o)); ) (r++, (o -= 2));
      if (r % 2 == 0) break;
      e += 2;
    } else break;
  }
  return e;
}
function nu(n, e, t) {
  for (; e > 0; ) {
    let i = ja(n, e - 2, t);
    if (i < e) return i;
    e--;
  }
  return 0;
}
function As(n, e) {
  let t = n.charCodeAt(e);
  if (!Ga(t) || e + 1 == n.length) return t;
  let i = n.charCodeAt(e + 1);
  return Ua(i) ? ((t - 55296) << 10) + (i - 56320) + 65536 : t;
}
function Ua(n) {
  return n >= 56320 && n < 57344;
}
function Ga(n) {
  return n >= 55296 && n < 56320;
}
function jo(n) {
  return n < 65536 ? 1 : 2;
}
class q {
  lineAt(e) {
    if (e < 0 || e > this.length)
      throw new RangeError(
        `Invalid position ${e} in document of length ${this.length}`,
      );
    return this.lineInner(e, !1, 1, 0);
  }
  line(e) {
    if (e < 1 || e > this.lines)
      throw new RangeError(
        `Invalid line number ${e} in ${this.lines}-line document`,
      );
    return this.lineInner(e, !0, 1, 0);
  }
  replace(e, t, i) {
    [e, t] = ri(this, e, t);
    let s = [];
    return (
      this.decompose(0, e, s, 2),
      i.length && i.decompose(0, i.length, s, 3),
      this.decompose(t, this.length, s, 1),
      Ze.from(s, this.length - (t - e) + i.length)
    );
  }
  append(e) {
    return this.replace(this.length, this.length, e);
  }
  slice(e, t = this.length) {
    [e, t] = ri(this, e, t);
    let i = [];
    return (this.decompose(e, t, i, 0), Ze.from(i, t - e));
  }
  eq(e) {
    if (e == this) return !0;
    if (e.length != this.length || e.lines != this.lines) return !1;
    let t = this.scanIdentical(e, 1),
      i = this.length - this.scanIdentical(e, -1),
      s = new Ai(this),
      r = new Ai(e);
    for (let o = t, l = t; ; ) {
      if (
        (s.next(o),
        r.next(o),
        (o = 0),
        s.lineBreak != r.lineBreak || s.done != r.done || s.value != r.value)
      )
        return !1;
      if (((l += s.value.length), s.done || l >= i)) return !0;
    }
  }
  iter(e = 1) {
    return new Ai(this, e);
  }
  iterRange(e, t = this.length) {
    return new Ja(this, e, t);
  }
  iterLines(e, t) {
    let i;
    if (e == null) i = this.iter();
    else {
      t == null && (t = this.lines + 1);
      let s = this.line(e).from;
      i = this.iterRange(
        s,
        Math.max(
          s,
          t == this.lines + 1 ? this.length : t <= 1 ? 0 : this.line(t - 1).to,
        ),
      );
    }
    return new Ya(i);
  }
  toString() {
    return this.sliceString(0);
  }
  toJSON() {
    let e = [];
    return (this.flatten(e), e);
  }
  constructor() {}
  static of(e) {
    if (e.length == 0)
      throw new RangeError("A document must have at least one line");
    return e.length == 1 && !e[0]
      ? q.empty
      : e.length <= 32
        ? new se(e)
        : Ze.from(se.split(e, []));
  }
}
class se extends q {
  constructor(e, t = su(e)) {
    (super(), (this.text = e), (this.length = t));
  }
  get lines() {
    return this.text.length;
  }
  get children() {
    return null;
  }
  lineInner(e, t, i, s) {
    for (let r = 0; ; r++) {
      let o = this.text[r],
        l = s + o.length;
      if ((t ? i : l) >= e) return new ru(s, l, i, o);
      ((s = l + 1), i++);
    }
  }
  decompose(e, t, i, s) {
    let r =
      e <= 0 && t >= this.length
        ? this
        : new se(
            Uo(this.text, e, t),
            Math.min(t, this.length) - Math.max(0, e),
          );
    if (s & 1) {
      let o = i.pop(),
        l = Pn(r.text, o.text.slice(), 0, r.length);
      if (l.length <= 32) i.push(new se(l, o.length + r.length));
      else {
        let a = l.length >> 1;
        i.push(new se(l.slice(0, a)), new se(l.slice(a)));
      }
    } else i.push(r);
  }
  replace(e, t, i) {
    if (!(i instanceof se)) return super.replace(e, t, i);
    [e, t] = ri(this, e, t);
    let s = Pn(this.text, Pn(i.text, Uo(this.text, 0, e)), t),
      r = this.length + i.length - (t - e);
    return s.length <= 32 ? new se(s, r) : Ze.from(se.split(s, []), r);
  }
  sliceString(
    e,
    t = this.length,
    i = `
`,
  ) {
    [e, t] = ri(this, e, t);
    let s = "";
    for (let r = 0, o = 0; r <= t && o < this.text.length; o++) {
      let l = this.text[o],
        a = r + l.length;
      (r > e && o && (s += i),
        e < a && t > r && (s += l.slice(Math.max(0, e - r), t - r)),
        (r = a + 1));
    }
    return s;
  }
  flatten(e) {
    for (let t of this.text) e.push(t);
  }
  scanIdentical() {
    return 0;
  }
  static split(e, t) {
    let i = [],
      s = -1;
    for (let r of e)
      (i.push(r),
        (s += r.length + 1),
        i.length == 32 && (t.push(new se(i, s)), (i = []), (s = -1)));
    return (s > -1 && t.push(new se(i, s)), t);
  }
}
class Ze extends q {
  constructor(e, t) {
    (super(), (this.children = e), (this.length = t), (this.lines = 0));
    for (let i of e) this.lines += i.lines;
  }
  lineInner(e, t, i, s) {
    for (let r = 0; ; r++) {
      let o = this.children[r],
        l = s + o.length,
        a = i + o.lines - 1;
      if ((t ? a : l) >= e) return o.lineInner(e, t, i, s);
      ((s = l + 1), (i = a + 1));
    }
  }
  decompose(e, t, i, s) {
    for (let r = 0, o = 0; o <= t && r < this.children.length; r++) {
      let l = this.children[r],
        a = o + l.length;
      if (e <= a && t >= o) {
        let h = s & ((o <= e ? 1 : 0) | (a >= t ? 2 : 0));
        o >= e && a <= t && !h ? i.push(l) : l.decompose(e - o, t - o, i, h);
      }
      o = a + 1;
    }
  }
  replace(e, t, i) {
    if ((([e, t] = ri(this, e, t)), i.lines < this.lines))
      for (let s = 0, r = 0; s < this.children.length; s++) {
        let o = this.children[s],
          l = r + o.length;
        if (e >= r && t <= l) {
          let a = o.replace(e - r, t - r, i),
            h = this.lines - o.lines + a.lines;
          if (a.lines < h >> 4 && a.lines > h >> 6) {
            let c = this.children.slice();
            return ((c[s] = a), new Ze(c, this.length - (t - e) + i.length));
          }
          return super.replace(r, l, a);
        }
        r = l + 1;
      }
    return super.replace(e, t, i);
  }
  sliceString(
    e,
    t = this.length,
    i = `
`,
  ) {
    [e, t] = ri(this, e, t);
    let s = "";
    for (let r = 0, o = 0; r < this.children.length && o <= t; r++) {
      let l = this.children[r],
        a = o + l.length;
      (o > e && r && (s += i),
        e < a && t > o && (s += l.sliceString(e - o, t - o, i)),
        (o = a + 1));
    }
    return s;
  }
  flatten(e) {
    for (let t of this.children) t.flatten(e);
  }
  scanIdentical(e, t) {
    if (!(e instanceof Ze)) return 0;
    let i = 0,
      [s, r, o, l] =
        t > 0
          ? [0, 0, this.children.length, e.children.length]
          : [this.children.length - 1, e.children.length - 1, -1, -1];
    for (; ; s += t, r += t) {
      if (s == o || r == l) return i;
      let a = this.children[s],
        h = e.children[r];
      if (a != h) return i + a.scanIdentical(h, t);
      i += a.length + 1;
    }
  }
  static from(e, t = e.reduce((i, s) => i + s.length + 1, -1)) {
    let i = 0;
    for (let d of e) i += d.lines;
    if (i < 32) {
      let d = [];
      for (let p of e) p.flatten(d);
      return new se(d, t);
    }
    let s = Math.max(32, i >> 5),
      r = s << 1,
      o = s >> 1,
      l = [],
      a = 0,
      h = -1,
      c = [];
    function f(d) {
      let p;
      if (d.lines > r && d instanceof Ze) for (let m of d.children) f(m);
      else
        d.lines > o && (a > o || !a)
          ? (u(), l.push(d))
          : d instanceof se &&
              a &&
              (p = c[c.length - 1]) instanceof se &&
              d.lines + p.lines <= 32
            ? ((a += d.lines),
              (h += d.length + 1),
              (c[c.length - 1] = new se(
                p.text.concat(d.text),
                p.length + 1 + d.length,
              )))
            : (a + d.lines > s && u(),
              (a += d.lines),
              (h += d.length + 1),
              c.push(d));
    }
    function u() {
      a != 0 &&
        (l.push(c.length == 1 ? c[0] : Ze.from(c, h)),
        (h = -1),
        (a = c.length = 0));
    }
    for (let d of e) f(d);
    return (u(), l.length == 1 ? l[0] : new Ze(l, t));
  }
}
q.empty = new se([""], 0);
function su(n) {
  let e = -1;
  for (let t of n) e += t.length + 1;
  return e;
}
function Pn(n, e, t = 0, i = 1e9) {
  for (let s = 0, r = 0, o = !0; r < n.length && s <= i; r++) {
    let l = n[r],
      a = s + l.length;
    (a >= t &&
      (a > i && (l = l.slice(0, i - s)),
      s < t && (l = l.slice(t - s)),
      o ? ((e[e.length - 1] += l), (o = !1)) : e.push(l)),
      (s = a + 1));
  }
  return e;
}
function Uo(n, e, t) {
  return Pn(n, [""], e, t);
}
class Ai {
  constructor(e, t = 1) {
    ((this.dir = t),
      (this.done = !1),
      (this.lineBreak = !1),
      (this.value = ""),
      (this.nodes = [e]),
      (this.offsets = [
        t > 0 ? 1 : (e instanceof se ? e.text.length : e.children.length) << 1,
      ]));
  }
  nextInner(e, t) {
    for (this.done = this.lineBreak = !1; ; ) {
      let i = this.nodes.length - 1,
        s = this.nodes[i],
        r = this.offsets[i],
        o = r >> 1,
        l = s instanceof se ? s.text.length : s.children.length;
      if (o == (t > 0 ? l : 0)) {
        if (i == 0) return ((this.done = !0), (this.value = ""), this);
        (t > 0 && this.offsets[i - 1]++, this.nodes.pop(), this.offsets.pop());
      } else if ((r & 1) == (t > 0 ? 0 : 1)) {
        if (((this.offsets[i] += t), e == 0))
          return (
            (this.lineBreak = !0),
            (this.value = `
`),
            this
          );
        e--;
      } else if (s instanceof se) {
        let a = s.text[o + (t < 0 ? -1 : 0)];
        if (((this.offsets[i] += t), a.length > Math.max(0, e)))
          return (
            (this.value =
              e == 0 ? a : t > 0 ? a.slice(e) : a.slice(0, a.length - e)),
            this
          );
        e -= a.length;
      } else {
        let a = s.children[o + (t < 0 ? -1 : 0)];
        e > a.length
          ? ((e -= a.length), (this.offsets[i] += t))
          : (t < 0 && this.offsets[i]--,
            this.nodes.push(a),
            this.offsets.push(
              t > 0
                ? 1
                : (a instanceof se ? a.text.length : a.children.length) << 1,
            ));
      }
    }
  }
  next(e = 0) {
    return (
      e < 0 && (this.nextInner(-e, -this.dir), (e = this.value.length)),
      this.nextInner(e, this.dir)
    );
  }
}
class Ja {
  constructor(e, t, i) {
    ((this.value = ""),
      (this.done = !1),
      (this.cursor = new Ai(e, t > i ? -1 : 1)),
      (this.pos = t > i ? e.length : 0),
      (this.from = Math.min(t, i)),
      (this.to = Math.max(t, i)));
  }
  nextInner(e, t) {
    if (t < 0 ? this.pos <= this.from : this.pos >= this.to)
      return ((this.value = ""), (this.done = !0), this);
    e += Math.max(0, t < 0 ? this.pos - this.to : this.from - this.pos);
    let i = t < 0 ? this.pos - this.from : this.to - this.pos;
    (e > i && (e = i), (i -= e));
    let { value: s } = this.cursor.next(e);
    return (
      (this.pos += (s.length + e) * t),
      (this.value =
        s.length <= i ? s : t < 0 ? s.slice(s.length - i) : s.slice(0, i)),
      (this.done = !this.value),
      this
    );
  }
  next(e = 0) {
    return (
      e < 0
        ? (e = Math.max(e, this.from - this.pos))
        : e > 0 && (e = Math.min(e, this.to - this.pos)),
      this.nextInner(e, this.cursor.dir)
    );
  }
  get lineBreak() {
    return this.cursor.lineBreak && this.value != "";
  }
}
class Ya {
  constructor(e) {
    ((this.inner = e),
      (this.afterBreak = !0),
      (this.value = ""),
      (this.done = !1));
  }
  next(e = 0) {
    let { done: t, lineBreak: i, value: s } = this.inner.next(e);
    return (
      t && this.afterBreak
        ? ((this.value = ""), (this.afterBreak = !1))
        : t
          ? ((this.done = !0), (this.value = ""))
          : i
            ? this.afterBreak
              ? (this.value = "")
              : ((this.afterBreak = !0), this.next())
            : ((this.value = s), (this.afterBreak = !1)),
      this
    );
  }
  get lineBreak() {
    return !1;
  }
}
typeof Symbol < "u" &&
  ((q.prototype[Symbol.iterator] = function () {
    return this.iter();
  }),
  (Ai.prototype[Symbol.iterator] =
    Ja.prototype[Symbol.iterator] =
    Ya.prototype[Symbol.iterator] =
      function () {
        return this;
      }));
class ru {
  constructor(e, t, i, s) {
    ((this.from = e), (this.to = t), (this.number = i), (this.text = s));
  }
  get length() {
    return this.to - this.from;
  }
}
function ri(n, e, t) {
  return (
    (e = Math.max(0, Math.min(n.length, e))),
    [e, Math.max(e, Math.min(n.length, t))]
  );
}
function he(n, e, t = !0, i = !0) {
  return iu(n, e, t, i);
}
function ou(n) {
  return n >= 56320 && n < 57344;
}
function lu(n) {
  return n >= 55296 && n < 56320;
}
function Ae(n, e) {
  let t = n.charCodeAt(e);
  if (!lu(t) || e + 1 == n.length) return t;
  let i = n.charCodeAt(e + 1);
  return ou(i) ? ((t - 55296) << 10) + (i - 56320) + 65536 : t;
}
function Yr(n) {
  return n <= 65535
    ? String.fromCharCode(n)
    : ((n -= 65536),
      String.fromCharCode((n >> 10) + 55296, (n & 1023) + 56320));
}
function et(n) {
  return n < 65536 ? 1 : 2;
}
const ir = /\r\n?|\n/;
var pe = (function (n) {
  return (
    (n[(n.Simple = 0)] = "Simple"),
    (n[(n.TrackDel = 1)] = "TrackDel"),
    (n[(n.TrackBefore = 2)] = "TrackBefore"),
    (n[(n.TrackAfter = 3)] = "TrackAfter"),
    n
  );
})(pe || (pe = {}));
class ot {
  constructor(e) {
    this.sections = e;
  }
  get length() {
    let e = 0;
    for (let t = 0; t < this.sections.length; t += 2) e += this.sections[t];
    return e;
  }
  get newLength() {
    let e = 0;
    for (let t = 0; t < this.sections.length; t += 2) {
      let i = this.sections[t + 1];
      e += i < 0 ? this.sections[t] : i;
    }
    return e;
  }
  get empty() {
    return (
      this.sections.length == 0 ||
      (this.sections.length == 2 && this.sections[1] < 0)
    );
  }
  iterGaps(e) {
    for (let t = 0, i = 0, s = 0; t < this.sections.length; ) {
      let r = this.sections[t++],
        o = this.sections[t++];
      (o < 0 ? (e(i, s, r), (s += r)) : (s += o), (i += r));
    }
  }
  iterChangedRanges(e, t = !1) {
    nr(this, e, t);
  }
  get invertedDesc() {
    let e = [];
    for (let t = 0; t < this.sections.length; ) {
      let i = this.sections[t++],
        s = this.sections[t++];
      s < 0 ? e.push(i, s) : e.push(s, i);
    }
    return new ot(e);
  }
  composeDesc(e) {
    return this.empty ? e : e.empty ? this : Xa(this, e);
  }
  mapDesc(e, t = !1) {
    return e.empty ? this : sr(this, e, t);
  }
  mapPos(e, t = -1, i = pe.Simple) {
    let s = 0,
      r = 0;
    for (let o = 0; o < this.sections.length; ) {
      let l = this.sections[o++],
        a = this.sections[o++],
        h = s + l;
      if (a < 0) {
        if (h > e) return r + (e - s);
        r += l;
      } else {
        if (
          i != pe.Simple &&
          h >= e &&
          ((i == pe.TrackDel && s < e && h > e) ||
            (i == pe.TrackBefore && s < e) ||
            (i == pe.TrackAfter && h > e))
        )
          return null;
        if (h > e || (h == e && t < 0 && !l))
          return e == s || t < 0 ? r : r + a;
        r += a;
      }
      s = h;
    }
    if (e > s)
      throw new RangeError(
        `Position ${e} is out of range for changeset of length ${s}`,
      );
    return r;
  }
  touchesRange(e, t = e) {
    for (let i = 0, s = 0; i < this.sections.length && s <= t; ) {
      let r = this.sections[i++],
        o = this.sections[i++],
        l = s + r;
      if (o >= 0 && s <= t && l >= e) return s < e && l > t ? "cover" : !0;
      s = l;
    }
    return !1;
  }
  toString() {
    let e = "";
    for (let t = 0; t < this.sections.length; ) {
      let i = this.sections[t++],
        s = this.sections[t++];
      e += (e ? " " : "") + i + (s >= 0 ? ":" + s : "");
    }
    return e;
  }
  toJSON() {
    return this.sections;
  }
  static fromJSON(e) {
    if (
      !Array.isArray(e) ||
      e.length % 2 ||
      e.some((t) => typeof t != "number")
    )
      throw new RangeError("Invalid JSON representation of ChangeDesc");
    return new ot(e);
  }
  static create(e) {
    return new ot(e);
  }
}
class le extends ot {
  constructor(e, t) {
    (super(e), (this.inserted = t));
  }
  apply(e) {
    if (this.length != e.length)
      throw new RangeError(
        "Applying change set to a document with the wrong length",
      );
    return (
      nr(this, (t, i, s, r, o) => (e = e.replace(s, s + (i - t), o)), !1),
      e
    );
  }
  mapDesc(e, t = !1) {
    return sr(this, e, t, !0);
  }
  invert(e) {
    let t = this.sections.slice(),
      i = [];
    for (let s = 0, r = 0; s < t.length; s += 2) {
      let o = t[s],
        l = t[s + 1];
      if (l >= 0) {
        ((t[s] = l), (t[s + 1] = o));
        let a = s >> 1;
        for (; i.length < a; ) i.push(q.empty);
        i.push(o ? e.slice(r, r + o) : q.empty);
      }
      r += o;
    }
    return new le(t, i);
  }
  compose(e) {
    return this.empty ? e : e.empty ? this : Xa(this, e, !0);
  }
  map(e, t = !1) {
    return e.empty ? this : sr(this, e, t, !0);
  }
  iterChanges(e, t = !1) {
    nr(this, e, t);
  }
  get desc() {
    return ot.create(this.sections);
  }
  filter(e) {
    let t = [],
      i = [],
      s = [],
      r = new Li(this);
    e: for (let o = 0, l = 0; ; ) {
      let a = o == e.length ? 1e9 : e[o++];
      for (; l < a || (l == a && r.len == 0); ) {
        if (r.done) break e;
        let c = Math.min(r.len, a - l);
        xe(s, c, -1);
        let f = r.ins == -1 ? -1 : r.off == 0 ? r.ins : 0;
        (xe(t, c, f), f > 0 && xt(i, t, r.text), r.forward(c), (l += c));
      }
      let h = e[o++];
      for (; l < h; ) {
        if (r.done) break e;
        let c = Math.min(r.len, h - l);
        (xe(t, c, -1),
          xe(s, c, r.ins == -1 ? -1 : r.off == 0 ? r.ins : 0),
          r.forward(c),
          (l += c));
      }
    }
    return { changes: new le(t, i), filtered: ot.create(s) };
  }
  toJSON() {
    let e = [];
    for (let t = 0; t < this.sections.length; t += 2) {
      let i = this.sections[t],
        s = this.sections[t + 1];
      s < 0
        ? e.push(i)
        : s == 0
          ? e.push([i])
          : e.push([i].concat(this.inserted[t >> 1].toJSON()));
    }
    return e;
  }
  static of(e, t, i) {
    let s = [],
      r = [],
      o = 0,
      l = null;
    function a(c = !1) {
      if (!c && !s.length) return;
      o < t && xe(s, t - o, -1);
      let f = new le(s, r);
      ((l = l ? l.compose(f.map(l)) : f), (s = []), (r = []), (o = 0));
    }
    function h(c) {
      if (Array.isArray(c)) for (let f of c) h(f);
      else if (c instanceof le) {
        if (c.length != t)
          throw new RangeError(
            `Mismatched change set length (got ${c.length}, expected ${t})`,
          );
        (a(), (l = l ? l.compose(c.map(l)) : c));
      } else {
        let { from: f, to: u = f, insert: d } = c;
        if (f > u || f < 0 || u > t)
          throw new RangeError(
            `Invalid change range ${f} to ${u} (in doc of length ${t})`,
          );
        let p = d
            ? typeof d == "string"
              ? q.of(d.split(i || ir))
              : d
            : q.empty,
          m = p.length;
        if (f == u && m == 0) return;
        (f < o && a(),
          f > o && xe(s, f - o, -1),
          xe(s, u - f, m),
          xt(r, s, p),
          (o = u));
      }
    }
    return (h(e), a(!l), l);
  }
  static empty(e) {
    return new le(e ? [e, -1] : [], []);
  }
  static fromJSON(e) {
    if (!Array.isArray(e))
      throw new RangeError("Invalid JSON representation of ChangeSet");
    let t = [],
      i = [];
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (typeof r == "number") t.push(r, -1);
      else {
        if (
          !Array.isArray(r) ||
          typeof r[0] != "number" ||
          r.some((o, l) => l && typeof o != "string")
        )
          throw new RangeError("Invalid JSON representation of ChangeSet");
        if (r.length == 1) t.push(r[0], 0);
        else {
          for (; i.length < s; ) i.push(q.empty);
          ((i[s] = q.of(r.slice(1))), t.push(r[0], i[s].length));
        }
      }
    }
    return new le(t, i);
  }
  static createSet(e, t) {
    return new le(e, t);
  }
}
function xe(n, e, t, i = !1) {
  if (e == 0 && t <= 0) return;
  let s = n.length - 2;
  s >= 0 && t <= 0 && t == n[s + 1]
    ? (n[s] += e)
    : s >= 0 && e == 0 && n[s] == 0
      ? (n[s + 1] += t)
      : i
        ? ((n[s] += e), (n[s + 1] += t))
        : n.push(e, t);
}
function xt(n, e, t) {
  if (t.length == 0) return;
  let i = (e.length - 2) >> 1;
  if (i < n.length) n[n.length - 1] = n[n.length - 1].append(t);
  else {
    for (; n.length < i; ) n.push(q.empty);
    n.push(t);
  }
}
function nr(n, e, t) {
  let i = n.inserted;
  for (let s = 0, r = 0, o = 0; o < n.sections.length; ) {
    let l = n.sections[o++],
      a = n.sections[o++];
    if (a < 0) ((s += l), (r += l));
    else {
      let h = s,
        c = r,
        f = q.empty;
      for (
        ;
        (h += l),
          (c += a),
          a && i && (f = f.append(i[(o - 2) >> 1])),
          !(t || o == n.sections.length || n.sections[o + 1] < 0);
      )
        ((l = n.sections[o++]), (a = n.sections[o++]));
      (e(s, h, r, c, f), (s = h), (r = c));
    }
  }
}
function sr(n, e, t, i = !1) {
  let s = [],
    r = i ? [] : null,
    o = new Li(n),
    l = new Li(e);
  for (let a = -1; ; ) {
    if ((o.done && l.len) || (l.done && o.len))
      throw new Error("Mismatched change set lengths");
    if (o.ins == -1 && l.ins == -1) {
      let h = Math.min(o.len, l.len);
      (xe(s, h, -1), o.forward(h), l.forward(h));
    } else if (
      l.ins >= 0 &&
      (o.ins < 0 ||
        a == o.i ||
        (o.off == 0 && (l.len < o.len || (l.len == o.len && !t))))
    ) {
      let h = l.len;
      for (xe(s, l.ins, -1); h; ) {
        let c = Math.min(o.len, h);
        (o.ins >= 0 &&
          a < o.i &&
          o.len <= c &&
          (xe(s, 0, o.ins), r && xt(r, s, o.text), (a = o.i)),
          o.forward(c),
          (h -= c));
      }
      l.next();
    } else if (o.ins >= 0) {
      let h = 0,
        c = o.len;
      for (; c; )
        if (l.ins == -1) {
          let f = Math.min(c, l.len);
          ((h += f), (c -= f), l.forward(f));
        } else if (l.ins == 0 && l.len < c) ((c -= l.len), l.next());
        else break;
      (xe(s, h, a < o.i ? o.ins : 0),
        r && a < o.i && xt(r, s, o.text),
        (a = o.i),
        o.forward(o.len - c));
    } else {
      if (o.done && l.done) return r ? le.createSet(s, r) : ot.create(s);
      throw new Error("Mismatched change set lengths");
    }
  }
}
function Xa(n, e, t = !1) {
  let i = [],
    s = t ? [] : null,
    r = new Li(n),
    o = new Li(e);
  for (let l = !1; ; ) {
    if (r.done && o.done) return s ? le.createSet(i, s) : ot.create(i);
    if (r.ins == 0) (xe(i, r.len, 0, l), r.next());
    else if (o.len == 0 && !o.done)
      (xe(i, 0, o.ins, l), s && xt(s, i, o.text), o.next());
    else {
      if (r.done || o.done) throw new Error("Mismatched change set lengths");
      {
        let a = Math.min(r.len2, o.len),
          h = i.length;
        if (r.ins == -1) {
          let c = o.ins == -1 ? -1 : o.off ? 0 : o.ins;
          (xe(i, a, c, l), s && c && xt(s, i, o.text));
        } else
          o.ins == -1
            ? (xe(i, r.off ? 0 : r.len, a, l), s && xt(s, i, r.textBit(a)))
            : (xe(i, r.off ? 0 : r.len, o.off ? 0 : o.ins, l),
              s && !o.off && xt(s, i, o.text));
        ((l = (r.ins > a || (o.ins >= 0 && o.len > a)) && (l || i.length > h)),
          r.forward2(a),
          o.forward(a));
      }
    }
  }
}
class Li {
  constructor(e) {
    ((this.set = e), (this.i = 0), this.next());
  }
  next() {
    let { sections: e } = this.set;
    (this.i < e.length
      ? ((this.len = e[this.i++]), (this.ins = e[this.i++]))
      : ((this.len = 0), (this.ins = -2)),
      (this.off = 0));
  }
  get done() {
    return this.ins == -2;
  }
  get len2() {
    return this.ins < 0 ? this.len : this.ins;
  }
  get text() {
    let { inserted: e } = this.set,
      t = (this.i - 2) >> 1;
    return t >= e.length ? q.empty : e[t];
  }
  textBit(e) {
    let { inserted: t } = this.set,
      i = (this.i - 2) >> 1;
    return i >= t.length && !e
      ? q.empty
      : t[i].slice(this.off, e == null ? void 0 : this.off + e);
  }
  forward(e) {
    e == this.len ? this.next() : ((this.len -= e), (this.off += e));
  }
  forward2(e) {
    this.ins == -1
      ? this.forward(e)
      : e == this.ins
        ? this.next()
        : ((this.ins -= e), (this.off += e));
  }
}
class It {
  constructor(e, t, i) {
    ((this.from = e), (this.to = t), (this.flags = i));
  }
  get anchor() {
    return this.flags & 32 ? this.to : this.from;
  }
  get head() {
    return this.flags & 32 ? this.from : this.to;
  }
  get empty() {
    return this.from == this.to;
  }
  get assoc() {
    return this.flags & 8 ? -1 : this.flags & 16 ? 1 : 0;
  }
  get bidiLevel() {
    let e = this.flags & 7;
    return e == 7 ? null : e;
  }
  get goalColumn() {
    let e = this.flags >> 6;
    return e == 16777215 ? void 0 : e;
  }
  map(e, t = -1) {
    let i, s;
    return (
      this.empty
        ? (i = s = e.mapPos(this.from, t))
        : ((i = e.mapPos(this.from, 1)), (s = e.mapPos(this.to, -1))),
      i == this.from && s == this.to ? this : new It(i, s, this.flags)
    );
  }
  extend(e, t = e) {
    if (e <= this.anchor && t >= this.anchor) return x.range(e, t);
    let i = Math.abs(e - this.anchor) > Math.abs(t - this.anchor) ? e : t;
    return x.range(this.anchor, i);
  }
  eq(e, t = !1) {
    return (
      this.anchor == e.anchor &&
      this.head == e.head &&
      this.goalColumn == e.goalColumn &&
      (!t || !this.empty || this.assoc == e.assoc)
    );
  }
  toJSON() {
    return { anchor: this.anchor, head: this.head };
  }
  static fromJSON(e) {
    if (!e || typeof e.anchor != "number" || typeof e.head != "number")
      throw new RangeError("Invalid JSON representation for SelectionRange");
    return x.range(e.anchor, e.head);
  }
  static create(e, t, i) {
    return new It(e, t, i);
  }
}
class x {
  constructor(e, t) {
    ((this.ranges = e), (this.mainIndex = t));
  }
  map(e, t = -1) {
    return e.empty
      ? this
      : x.create(
          this.ranges.map((i) => i.map(e, t)),
          this.mainIndex,
        );
  }
  eq(e, t = !1) {
    if (this.ranges.length != e.ranges.length || this.mainIndex != e.mainIndex)
      return !1;
    for (let i = 0; i < this.ranges.length; i++)
      if (!this.ranges[i].eq(e.ranges[i], t)) return !1;
    return !0;
  }
  get main() {
    return this.ranges[this.mainIndex];
  }
  asSingle() {
    return this.ranges.length == 1 ? this : new x([this.main], 0);
  }
  addRange(e, t = !0) {
    return x.create([e].concat(this.ranges), t ? 0 : this.mainIndex + 1);
  }
  replaceRange(e, t = this.mainIndex) {
    let i = this.ranges.slice();
    return ((i[t] = e), x.create(i, this.mainIndex));
  }
  toJSON() {
    return { ranges: this.ranges.map((e) => e.toJSON()), main: this.mainIndex };
  }
  static fromJSON(e) {
    if (
      !e ||
      !Array.isArray(e.ranges) ||
      typeof e.main != "number" ||
      e.main >= e.ranges.length
    )
      throw new RangeError("Invalid JSON representation for EditorSelection");
    return new x(
      e.ranges.map((t) => It.fromJSON(t)),
      e.main,
    );
  }
  static single(e, t = e) {
    return new x([x.range(e, t)], 0);
  }
  static create(e, t = 0) {
    if (e.length == 0)
      throw new RangeError("A selection needs at least one range");
    for (let i = 0, s = 0; s < e.length; s++) {
      let r = e[s];
      if (r.empty ? r.from <= i : r.from < i) return x.normalized(e.slice(), t);
      i = r.to;
    }
    return new x(e, t);
  }
  static cursor(e, t = 0, i, s) {
    return It.create(
      e,
      e,
      (t == 0 ? 0 : t < 0 ? 8 : 16) |
        (i == null ? 7 : Math.min(6, i)) |
        ((s ?? 16777215) << 6),
    );
  }
  static range(e, t, i, s) {
    let r = ((i ?? 16777215) << 6) | (s == null ? 7 : Math.min(6, s));
    return t < e
      ? It.create(t, e, 48 | r)
      : It.create(e, t, (t > e ? 8 : 0) | r);
  }
  static normalized(e, t = 0) {
    let i = e[t];
    (e.sort((s, r) => s.from - r.from), (t = e.indexOf(i)));
    for (let s = 1; s < e.length; s++) {
      let r = e[s],
        o = e[s - 1];
      if (r.empty ? r.from <= o.to : r.from < o.to) {
        let l = o.from,
          a = Math.max(r.to, o.to);
        (s <= t && t--,
          e.splice(--s, 2, r.anchor > r.head ? x.range(a, l) : x.range(l, a)));
      }
    }
    return new x(e, t);
  }
}
function Qa(n, e) {
  for (let t of n.ranges)
    if (t.to > e) throw new RangeError("Selection points outside of document");
}
let Xr = 0;
class D {
  constructor(e, t, i, s, r) {
    ((this.combine = e),
      (this.compareInput = t),
      (this.compare = i),
      (this.isStatic = s),
      (this.id = Xr++),
      (this.default = e([])),
      (this.extensions = typeof r == "function" ? r(this) : r));
  }
  get reader() {
    return this;
  }
  static define(e = {}) {
    return new D(
      e.combine || ((t) => t),
      e.compareInput || ((t, i) => t === i),
      e.compare || (e.combine ? (t, i) => t === i : Qr),
      !!e.static,
      e.enables,
    );
  }
  of(e) {
    return new Rn([], this, 0, e);
  }
  compute(e, t) {
    if (this.isStatic) throw new Error("Can't compute a static facet");
    return new Rn(e, this, 1, t);
  }
  computeN(e, t) {
    if (this.isStatic) throw new Error("Can't compute a static facet");
    return new Rn(e, this, 2, t);
  }
  from(e, t) {
    return (t || (t = (i) => i), this.compute([e], (i) => t(i.field(e))));
  }
}
function Qr(n, e) {
  return n == e || (n.length == e.length && n.every((t, i) => t === e[i]));
}
class Rn {
  constructor(e, t, i, s) {
    ((this.dependencies = e),
      (this.facet = t),
      (this.type = i),
      (this.value = s),
      (this.id = Xr++));
  }
  dynamicSlot(e) {
    var t;
    let i = this.value,
      s = this.facet.compareInput,
      r = this.id,
      o = e[r] >> 1,
      l = this.type == 2,
      a = !1,
      h = !1,
      c = [];
    for (let f of this.dependencies)
      f == "doc"
        ? (a = !0)
        : f == "selection"
          ? (h = !0)
          : (((t = e[f.id]) !== null && t !== void 0 ? t : 1) & 1) == 0 &&
            c.push(e[f.id]);
    return {
      create(f) {
        return ((f.values[o] = i(f)), 1);
      },
      update(f, u) {
        if (
          (a && u.docChanged) ||
          (h && (u.docChanged || u.selection)) ||
          rr(f, c)
        ) {
          let d = i(f);
          if (l ? !Go(d, f.values[o], s) : !s(d, f.values[o]))
            return ((f.values[o] = d), 1);
        }
        return 0;
      },
      reconfigure: (f, u) => {
        let d,
          p = u.config.address[r];
        if (p != null) {
          let m = qn(u, p);
          if (
            this.dependencies.every((g) =>
              g instanceof D
                ? u.facet(g) === f.facet(g)
                : g instanceof ce
                  ? u.field(g, !1) == f.field(g, !1)
                  : !0,
            ) ||
            (l ? Go((d = i(f)), m, s) : s((d = i(f)), m))
          )
            return ((f.values[o] = m), 0);
        } else d = i(f);
        return ((f.values[o] = d), 1);
      },
    };
  }
}
function Go(n, e, t) {
  if (n.length != e.length) return !1;
  for (let i = 0; i < n.length; i++) if (!t(n[i], e[i])) return !1;
  return !0;
}
function rr(n, e) {
  let t = !1;
  for (let i of e) Mi(n, i) & 1 && (t = !0);
  return t;
}
function au(n, e, t) {
  let i = t.map((a) => n[a.id]),
    s = t.map((a) => a.type),
    r = i.filter((a) => !(a & 1)),
    o = n[e.id] >> 1;
  function l(a) {
    let h = [];
    for (let c = 0; c < i.length; c++) {
      let f = qn(a, i[c]);
      if (s[c] == 2) for (let u of f) h.push(u);
      else h.push(f);
    }
    return e.combine(h);
  }
  return {
    create(a) {
      for (let h of i) Mi(a, h);
      return ((a.values[o] = l(a)), 1);
    },
    update(a, h) {
      if (!rr(a, r)) return 0;
      let c = l(a);
      return e.compare(c, a.values[o]) ? 0 : ((a.values[o] = c), 1);
    },
    reconfigure(a, h) {
      let c = rr(a, i),
        f = h.config.facets[e.id],
        u = h.facet(e);
      if (f && !c && Qr(t, f)) return ((a.values[o] = u), 0);
      let d = l(a);
      return e.compare(d, u) ? ((a.values[o] = u), 0) : ((a.values[o] = d), 1);
    },
  };
}
const cn = D.define({ static: !0 });
class ce {
  constructor(e, t, i, s, r) {
    ((this.id = e),
      (this.createF = t),
      (this.updateF = i),
      (this.compareF = s),
      (this.spec = r),
      (this.provides = void 0));
  }
  static define(e) {
    let t = new ce(
      Xr++,
      e.create,
      e.update,
      e.compare || ((i, s) => i === s),
      e,
    );
    return (e.provide && (t.provides = e.provide(t)), t);
  }
  create(e) {
    let t = e.facet(cn).find((i) => i.field == this);
    return (t?.create || this.createF)(e);
  }
  slot(e) {
    let t = e[this.id] >> 1;
    return {
      create: (i) => ((i.values[t] = this.create(i)), 1),
      update: (i, s) => {
        let r = i.values[t],
          o = this.updateF(r, s);
        return this.compareF(r, o) ? 0 : ((i.values[t] = o), 1);
      },
      reconfigure: (i, s) => {
        let r = i.facet(cn),
          o = s.facet(cn),
          l;
        return (l = r.find((a) => a.field == this)) &&
          l != o.find((a) => a.field == this)
          ? ((i.values[t] = l.create(i)), 1)
          : s.config.address[this.id] != null
            ? ((i.values[t] = s.field(this)), 0)
            : ((i.values[t] = this.create(i)), 1);
      },
    };
  }
  init(e) {
    return [this, cn.of({ field: this, create: e })];
  }
  get extension() {
    return this;
  }
}
const Pt = { lowest: 4, low: 3, default: 2, high: 1, highest: 0 };
function yi(n) {
  return (e) => new Za(e, n);
}
const Dt = {
  highest: yi(Pt.highest),
  high: yi(Pt.high),
  default: yi(Pt.default),
  low: yi(Pt.low),
  lowest: yi(Pt.lowest),
};
class Za {
  constructor(e, t) {
    ((this.inner = e), (this.prec = t));
  }
}
class fs {
  of(e) {
    return new or(this, e);
  }
  reconfigure(e) {
    return fs.reconfigure.of({ compartment: this, extension: e });
  }
  get(e) {
    return e.config.compartments.get(this);
  }
}
class or {
  constructor(e, t) {
    ((this.compartment = e), (this.inner = t));
  }
}
class _n {
  constructor(e, t, i, s, r, o) {
    for (
      this.base = e,
        this.compartments = t,
        this.dynamicSlots = i,
        this.address = s,
        this.staticValues = r,
        this.facets = o,
        this.statusTemplate = [];
      this.statusTemplate.length < i.length;
    )
      this.statusTemplate.push(0);
  }
  staticFacet(e) {
    let t = this.address[e.id];
    return t == null ? e.default : this.staticValues[t >> 1];
  }
  static resolve(e, t, i) {
    let s = [],
      r = Object.create(null),
      o = new Map();
    for (let u of hu(e, t, o))
      u instanceof ce
        ? s.push(u)
        : (r[u.facet.id] || (r[u.facet.id] = [])).push(u);
    let l = Object.create(null),
      a = [],
      h = [];
    for (let u of s) ((l[u.id] = h.length << 1), h.push((d) => u.slot(d)));
    let c = i?.config.facets;
    for (let u in r) {
      let d = r[u],
        p = d[0].facet,
        m = (c && c[u]) || [];
      if (d.every((g) => g.type == 0))
        if (((l[p.id] = (a.length << 1) | 1), Qr(m, d))) a.push(i.facet(p));
        else {
          let g = p.combine(d.map((b) => b.value));
          a.push(i && p.compare(g, i.facet(p)) ? i.facet(p) : g);
        }
      else {
        for (let g of d)
          g.type == 0
            ? ((l[g.id] = (a.length << 1) | 1), a.push(g.value))
            : ((l[g.id] = h.length << 1), h.push((b) => g.dynamicSlot(b)));
        ((l[p.id] = h.length << 1), h.push((g) => au(g, p, d)));
      }
    }
    let f = h.map((u) => u(l));
    return new _n(e, o, f, l, a, r);
  }
}
function hu(n, e, t) {
  let i = [[], [], [], [], []],
    s = new Map();
  function r(o, l) {
    let a = s.get(o);
    if (a != null) {
      if (a <= l) return;
      let h = i[a].indexOf(o);
      (h > -1 && i[a].splice(h, 1), o instanceof or && t.delete(o.compartment));
    }
    if ((s.set(o, l), Array.isArray(o))) for (let h of o) r(h, l);
    else if (o instanceof or) {
      if (t.has(o.compartment))
        throw new RangeError("Duplicate use of compartment in extensions");
      let h = e.get(o.compartment) || o.inner;
      (t.set(o.compartment, h), r(h, l));
    } else if (o instanceof Za) r(o.inner, o.prec);
    else if (o instanceof ce) (i[l].push(o), o.provides && r(o.provides, l));
    else if (o instanceof Rn)
      (i[l].push(o), o.facet.extensions && r(o.facet.extensions, Pt.default));
    else {
      let h = o.extension;
      if (!h)
        throw new Error(
          `Unrecognized extension value in extension set (${o}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`,
        );
      r(h, l);
    }
  }
  return (r(n, Pt.default), i.reduce((o, l) => o.concat(l)));
}
function Mi(n, e) {
  if (e & 1) return 2;
  let t = e >> 1,
    i = n.status[t];
  if (i == 4) throw new Error("Cyclic dependency between fields and/or facets");
  if (i & 2) return i;
  n.status[t] = 4;
  let s = n.computeSlot(n, n.config.dynamicSlots[t]);
  return (n.status[t] = 2 | s);
}
function qn(n, e) {
  return e & 1 ? n.config.staticValues[e >> 1] : n.values[e >> 1];
}
const eh = D.define(),
  lr = D.define({ combine: (n) => n.some((e) => e), static: !0 }),
  th = D.define({ combine: (n) => (n.length ? n[0] : void 0), static: !0 }),
  ih = D.define(),
  nh = D.define(),
  sh = D.define(),
  rh = D.define({ combine: (n) => (n.length ? n[0] : !1) });
class lt {
  constructor(e, t) {
    ((this.type = e), (this.value = t));
  }
  static define() {
    return new cu();
  }
}
class cu {
  of(e) {
    return new lt(this, e);
  }
}
class fu {
  constructor(e) {
    this.map = e;
  }
  of(e) {
    return new R(this, e);
  }
}
class R {
  constructor(e, t) {
    ((this.type = e), (this.value = t));
  }
  map(e) {
    let t = this.type.map(this.value, e);
    return t === void 0 ? void 0 : t == this.value ? this : new R(this.type, t);
  }
  is(e) {
    return this.type == e;
  }
  static define(e = {}) {
    return new fu(e.map || ((t) => t));
  }
  static mapEffects(e, t) {
    if (!e.length) return e;
    let i = [];
    for (let s of e) {
      let r = s.map(t);
      r && i.push(r);
    }
    return i;
  }
}
R.reconfigure = R.define();
R.appendConfig = R.define();
class oe {
  constructor(e, t, i, s, r, o) {
    ((this.startState = e),
      (this.changes = t),
      (this.selection = i),
      (this.effects = s),
      (this.annotations = r),
      (this.scrollIntoView = o),
      (this._doc = null),
      (this._state = null),
      i && Qa(i, t.newLength),
      r.some((l) => l.type == oe.time) ||
        (this.annotations = r.concat(oe.time.of(Date.now()))));
  }
  static create(e, t, i, s, r, o) {
    return new oe(e, t, i, s, r, o);
  }
  get newDoc() {
    return this._doc || (this._doc = this.changes.apply(this.startState.doc));
  }
  get newSelection() {
    return this.selection || this.startState.selection.map(this.changes);
  }
  get state() {
    return (this._state || this.startState.applyTransaction(this), this._state);
  }
  annotation(e) {
    for (let t of this.annotations) if (t.type == e) return t.value;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get reconfigured() {
    return this.startState.config != this.state.config;
  }
  isUserEvent(e) {
    let t = this.annotation(oe.userEvent);
    return !!(
      t &&
      (t == e ||
        (t.length > e.length &&
          t.slice(0, e.length) == e &&
          t[e.length] == "."))
    );
  }
}
oe.time = lt.define();
oe.userEvent = lt.define();
oe.addToHistory = lt.define();
oe.remote = lt.define();
function uu(n, e) {
  let t = [];
  for (let i = 0, s = 0; ; ) {
    let r, o;
    if (i < n.length && (s == e.length || e[s] >= n[i]))
      ((r = n[i++]), (o = n[i++]));
    else if (s < e.length) ((r = e[s++]), (o = e[s++]));
    else return t;
    !t.length || t[t.length - 1] < r
      ? t.push(r, o)
      : t[t.length - 1] < o && (t[t.length - 1] = o);
  }
}
function oh(n, e, t) {
  var i;
  let s, r, o;
  return (
    t
      ? ((s = e.changes),
        (r = le.empty(e.changes.length)),
        (o = n.changes.compose(e.changes)))
      : ((s = e.changes.map(n.changes)),
        (r = n.changes.mapDesc(e.changes, !0)),
        (o = n.changes.compose(s))),
    {
      changes: o,
      selection: e.selection
        ? e.selection.map(r)
        : (i = n.selection) === null || i === void 0
          ? void 0
          : i.map(s),
      effects: R.mapEffects(n.effects, s).concat(R.mapEffects(e.effects, r)),
      annotations: n.annotations.length
        ? n.annotations.concat(e.annotations)
        : e.annotations,
      scrollIntoView: n.scrollIntoView || e.scrollIntoView,
    }
  );
}
function ar(n, e, t) {
  let i = e.selection,
    s = Qt(e.annotations);
  return (
    e.userEvent && (s = s.concat(oe.userEvent.of(e.userEvent))),
    {
      changes:
        e.changes instanceof le
          ? e.changes
          : le.of(e.changes || [], t, n.facet(th)),
      selection: i && (i instanceof x ? i : x.single(i.anchor, i.head)),
      effects: Qt(e.effects),
      annotations: s,
      scrollIntoView: !!e.scrollIntoView,
    }
  );
}
function lh(n, e, t) {
  let i = ar(n, e.length ? e[0] : {}, n.doc.length);
  e.length && e[0].filter === !1 && (t = !1);
  for (let r = 1; r < e.length; r++) {
    e[r].filter === !1 && (t = !1);
    let o = !!e[r].sequential;
    i = oh(i, ar(n, e[r], o ? i.changes.newLength : n.doc.length), o);
  }
  let s = oe.create(
    n,
    i.changes,
    i.selection,
    i.effects,
    i.annotations,
    i.scrollIntoView,
  );
  return pu(t ? du(s) : s);
}
function du(n) {
  let e = n.startState,
    t = !0;
  for (let s of e.facet(ih)) {
    let r = s(n);
    if (r === !1) {
      t = !1;
      break;
    }
    Array.isArray(r) && (t = t === !0 ? r : uu(t, r));
  }
  if (t !== !0) {
    let s, r;
    if (t === !1) ((r = n.changes.invertedDesc), (s = le.empty(e.doc.length)));
    else {
      let o = n.changes.filter(t);
      ((s = o.changes), (r = o.filtered.mapDesc(o.changes).invertedDesc));
    }
    n = oe.create(
      e,
      s,
      n.selection && n.selection.map(r),
      R.mapEffects(n.effects, r),
      n.annotations,
      n.scrollIntoView,
    );
  }
  let i = e.facet(nh);
  for (let s = i.length - 1; s >= 0; s--) {
    let r = i[s](n);
    r instanceof oe
      ? (n = r)
      : Array.isArray(r) && r.length == 1 && r[0] instanceof oe
        ? (n = r[0])
        : (n = lh(e, Qt(r), !1));
  }
  return n;
}
function pu(n) {
  let e = n.startState,
    t = e.facet(sh),
    i = n;
  for (let s = t.length - 1; s >= 0; s--) {
    let r = t[s](n);
    r &&
      Object.keys(r).length &&
      (i = oh(i, ar(e, r, n.changes.newLength), !0));
  }
  return i == n
    ? n
    : oe.create(
        e,
        n.changes,
        n.selection,
        i.effects,
        i.annotations,
        i.scrollIntoView,
      );
}
const mu = [];
function Qt(n) {
  return n == null ? mu : Array.isArray(n) ? n : [n];
}
var Q = (function (n) {
  return (
    (n[(n.Word = 0)] = "Word"),
    (n[(n.Space = 1)] = "Space"),
    (n[(n.Other = 2)] = "Other"),
    n
  );
})(Q || (Q = {}));
const gu =
  /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
let hr;
try {
  hr = new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
} catch {}
function yu(n) {
  if (hr) return hr.test(n);
  for (let e = 0; e < n.length; e++) {
    let t = n[e];
    if (
      /\w/.test(t) ||
      (t > "" && (t.toUpperCase() != t.toLowerCase() || gu.test(t)))
    )
      return !0;
  }
  return !1;
}
function bu(n) {
  return (e) => {
    if (!/\S/.test(e)) return Q.Space;
    if (yu(e)) return Q.Word;
    for (let t = 0; t < n.length; t++) if (e.indexOf(n[t]) > -1) return Q.Word;
    return Q.Other;
  };
}
class _ {
  constructor(e, t, i, s, r, o) {
    ((this.config = e),
      (this.doc = t),
      (this.selection = i),
      (this.values = s),
      (this.status = e.statusTemplate.slice()),
      (this.computeSlot = r),
      o && (o._state = this));
    for (let l = 0; l < this.config.dynamicSlots.length; l++) Mi(this, l << 1);
    this.computeSlot = null;
  }
  field(e, t = !0) {
    let i = this.config.address[e.id];
    if (i == null) {
      if (t) throw new RangeError("Field is not present in this state");
      return;
    }
    return (Mi(this, i), qn(this, i));
  }
  update(...e) {
    return lh(this, e, !0);
  }
  applyTransaction(e) {
    let t = this.config,
      { base: i, compartments: s } = t;
    for (let l of e.effects)
      l.is(fs.reconfigure)
        ? (t &&
            ((s = new Map()),
            t.compartments.forEach((a, h) => s.set(h, a)),
            (t = null)),
          s.set(l.value.compartment, l.value.extension))
        : l.is(R.reconfigure)
          ? ((t = null), (i = l.value))
          : l.is(R.appendConfig) && ((t = null), (i = Qt(i).concat(l.value)));
    let r;
    t
      ? (r = e.startState.values.slice())
      : ((t = _n.resolve(i, s, this)),
        (r = new _(
          t,
          this.doc,
          this.selection,
          t.dynamicSlots.map(() => null),
          (a, h) => h.reconfigure(a, this),
          null,
        ).values));
    let o = e.startState.facet(lr) ? e.newSelection : e.newSelection.asSingle();
    new _(t, e.newDoc, o, r, (l, a) => a.update(l, e), e);
  }
  replaceSelection(e) {
    return (
      typeof e == "string" && (e = this.toText(e)),
      this.changeByRange((t) => ({
        changes: { from: t.from, to: t.to, insert: e },
        range: x.cursor(t.from + e.length),
      }))
    );
  }
  changeByRange(e) {
    let t = this.selection,
      i = e(t.ranges[0]),
      s = this.changes(i.changes),
      r = [i.range],
      o = Qt(i.effects);
    for (let l = 1; l < t.ranges.length; l++) {
      let a = e(t.ranges[l]),
        h = this.changes(a.changes),
        c = h.map(s);
      for (let u = 0; u < l; u++) r[u] = r[u].map(c);
      let f = s.mapDesc(h, !0);
      (r.push(a.range.map(f)),
        (s = s.compose(c)),
        (o = R.mapEffects(o, c).concat(R.mapEffects(Qt(a.effects), f))));
    }
    return { changes: s, selection: x.create(r, t.mainIndex), effects: o };
  }
  changes(e = []) {
    return e instanceof le
      ? e
      : le.of(e, this.doc.length, this.facet(_.lineSeparator));
  }
  toText(e) {
    return q.of(e.split(this.facet(_.lineSeparator) || ir));
  }
  sliceDoc(e = 0, t = this.doc.length) {
    return this.doc.sliceString(e, t, this.lineBreak);
  }
  facet(e) {
    let t = this.config.address[e.id];
    return t == null ? e.default : (Mi(this, t), qn(this, t));
  }
  toJSON(e) {
    let t = { doc: this.sliceDoc(), selection: this.selection.toJSON() };
    if (e)
      for (let i in e) {
        let s = e[i];
        s instanceof ce &&
          this.config.address[s.id] != null &&
          (t[i] = s.spec.toJSON(this.field(e[i]), this));
      }
    return t;
  }
  static fromJSON(e, t = {}, i) {
    if (!e || typeof e.doc != "string")
      throw new RangeError("Invalid JSON representation for EditorState");
    let s = [];
    if (i) {
      for (let r in i)
        if (Object.prototype.hasOwnProperty.call(e, r)) {
          let o = i[r],
            l = e[r];
          s.push(o.init((a) => o.spec.fromJSON(l, a)));
        }
    }
    return _.create({
      doc: e.doc,
      selection: x.fromJSON(e.selection),
      extensions: t.extensions ? s.concat([t.extensions]) : s,
    });
  }
  static create(e = {}) {
    let t = _n.resolve(e.extensions || [], new Map()),
      i =
        e.doc instanceof q
          ? e.doc
          : q.of((e.doc || "").split(t.staticFacet(_.lineSeparator) || ir)),
      s = e.selection
        ? e.selection instanceof x
          ? e.selection
          : x.single(e.selection.anchor, e.selection.head)
        : x.single(0);
    return (
      Qa(s, i.length),
      t.staticFacet(lr) || (s = s.asSingle()),
      new _(
        t,
        i,
        s,
        t.dynamicSlots.map(() => null),
        (r, o) => o.create(r),
        null,
      )
    );
  }
  get tabSize() {
    return this.facet(_.tabSize);
  }
  get lineBreak() {
    return (
      this.facet(_.lineSeparator) ||
      `
`
    );
  }
  get readOnly() {
    return this.facet(rh);
  }
  phrase(e, ...t) {
    for (let i of this.facet(_.phrases))
      if (Object.prototype.hasOwnProperty.call(i, e)) {
        e = i[e];
        break;
      }
    return (
      t.length &&
        (e = e.replace(/\$(\$|\d*)/g, (i, s) => {
          if (s == "$") return "$";
          let r = +(s || 1);
          return !r || r > t.length ? i : t[r - 1];
        })),
      e
    );
  }
  languageDataAt(e, t, i = -1) {
    let s = [];
    for (let r of this.facet(eh))
      for (let o of r(this, t, i))
        Object.prototype.hasOwnProperty.call(o, e) && s.push(o[e]);
    return s;
  }
  charCategorizer(e) {
    let t = this.languageDataAt("wordChars", e);
    return bu(t.length ? t[0] : "");
  }
  wordAt(e) {
    let { text: t, from: i, length: s } = this.doc.lineAt(e),
      r = this.charCategorizer(e),
      o = e - i,
      l = e - i;
    for (; o > 0; ) {
      let a = he(t, o, !1);
      if (r(t.slice(a, o)) != Q.Word) break;
      o = a;
    }
    for (; l < s; ) {
      let a = he(t, l);
      if (r(t.slice(l, a)) != Q.Word) break;
      l = a;
    }
    return o == l ? null : x.range(o + i, l + i);
  }
}
_.allowMultipleSelections = lr;
_.tabSize = D.define({ combine: (n) => (n.length ? n[0] : 4) });
_.lineSeparator = th;
_.readOnly = rh;
_.phrases = D.define({
  compare(n, e) {
    let t = Object.keys(n),
      i = Object.keys(e);
    return t.length == i.length && t.every((s) => n[s] == e[s]);
  },
});
_.languageData = eh;
_.changeFilter = ih;
_.transactionFilter = nh;
_.transactionExtender = sh;
fs.reconfigure = R.define();
function at(n, e, t = {}) {
  let i = {};
  for (let s of n)
    for (let r of Object.keys(s)) {
      let o = s[r],
        l = i[r];
      if (l === void 0) i[r] = o;
      else if (!(l === o || o === void 0))
        if (Object.hasOwnProperty.call(t, r)) i[r] = t[r](l, o);
        else throw new Error("Config merge conflict for field " + r);
    }
  for (let s in e) i[s] === void 0 && (i[s] = e[s]);
  return i;
}
class vt {
  eq(e) {
    return this == e;
  }
  range(e, t = e) {
    return cr.create(e, t, this);
  }
}
vt.prototype.startSide = vt.prototype.endSide = 0;
vt.prototype.point = !1;
vt.prototype.mapMode = pe.TrackDel;
function Zr(n, e) {
  return n == e || (n.constructor == e.constructor && n.eq(e));
}
let cr = class ah {
  constructor(e, t, i) {
    ((this.from = e), (this.to = t), (this.value = i));
  }
  static create(e, t, i) {
    return new ah(e, t, i);
  }
};
function fr(n, e) {
  return n.from - e.from || n.value.startSide - e.value.startSide;
}
class eo {
  constructor(e, t, i, s) {
    ((this.from = e), (this.to = t), (this.value = i), (this.maxPoint = s));
  }
  get length() {
    return this.to[this.to.length - 1];
  }
  findIndex(e, t, i, s = 0) {
    let r = i ? this.to : this.from;
    for (let o = s, l = r.length; ; ) {
      if (o == l) return o;
      let a = (o + l) >> 1,
        h =
          r[a] - e || (i ? this.value[a].endSide : this.value[a].startSide) - t;
      if (a == o) return h >= 0 ? o : l;
      h >= 0 ? (l = a) : (o = a + 1);
    }
  }
  between(e, t, i, s) {
    for (
      let r = this.findIndex(t, -1e9, !0), o = this.findIndex(i, 1e9, !1, r);
      r < o;
      r++
    )
      if (s(this.from[r] + e, this.to[r] + e, this.value[r]) === !1) return !1;
  }
  map(e, t) {
    let i = [],
      s = [],
      r = [],
      o = -1,
      l = -1;
    for (let a = 0; a < this.value.length; a++) {
      let h = this.value[a],
        c = this.from[a] + e,
        f = this.to[a] + e,
        u,
        d;
      if (c == f) {
        let p = t.mapPos(c, h.startSide, h.mapMode);
        if (
          p == null ||
          ((u = d = p),
          h.startSide != h.endSide && ((d = t.mapPos(c, h.endSide)), d < u))
        )
          continue;
      } else if (
        ((u = t.mapPos(c, h.startSide)),
        (d = t.mapPos(f, h.endSide)),
        u > d || (u == d && h.startSide > 0 && h.endSide <= 0))
      )
        continue;
      (d - u || h.endSide - h.startSide) < 0 ||
        (o < 0 && (o = u),
        h.point && (l = Math.max(l, d - u)),
        i.push(h),
        s.push(u - o),
        r.push(d - o));
    }
    return { mapped: i.length ? new eo(s, r, i, l) : null, pos: o };
  }
}
class z {
  constructor(e, t, i, s) {
    ((this.chunkPos = e),
      (this.chunk = t),
      (this.nextLayer = i),
      (this.maxPoint = s));
  }
  static create(e, t, i, s) {
    return new z(e, t, i, s);
  }
  get length() {
    let e = this.chunk.length - 1;
    return e < 0 ? 0 : Math.max(this.chunkEnd(e), this.nextLayer.length);
  }
  get size() {
    if (this.isEmpty) return 0;
    let e = this.nextLayer.size;
    for (let t of this.chunk) e += t.value.length;
    return e;
  }
  chunkEnd(e) {
    return this.chunkPos[e] + this.chunk[e].length;
  }
  update(e) {
    let {
        add: t = [],
        sort: i = !1,
        filterFrom: s = 0,
        filterTo: r = this.length,
      } = e,
      o = e.filter;
    if (t.length == 0 && !o) return this;
    if ((i && (t = t.slice().sort(fr)), this.isEmpty))
      return t.length ? z.of(t) : this;
    let l = new hh(this, null, -1).goto(0),
      a = 0,
      h = [],
      c = new ut();
    for (; l.value || a < t.length; )
      if (
        a < t.length &&
        (l.from - t[a].from || l.startSide - t[a].value.startSide) >= 0
      ) {
        let f = t[a++];
        c.addInner(f.from, f.to, f.value) || h.push(f);
      } else
        l.rangeIndex == 1 &&
        l.chunkIndex < this.chunk.length &&
        (a == t.length || this.chunkEnd(l.chunkIndex) < t[a].from) &&
        (!o ||
          s > this.chunkEnd(l.chunkIndex) ||
          r < this.chunkPos[l.chunkIndex]) &&
        c.addChunk(this.chunkPos[l.chunkIndex], this.chunk[l.chunkIndex])
          ? l.nextChunk()
          : ((!o || s > l.to || r < l.from || o(l.from, l.to, l.value)) &&
              (c.addInner(l.from, l.to, l.value) ||
                h.push(cr.create(l.from, l.to, l.value))),
            l.next());
    return c.finishInner(
      this.nextLayer.isEmpty && !h.length
        ? z.empty
        : this.nextLayer.update({
            add: h,
            filter: o,
            filterFrom: s,
            filterTo: r,
          }),
    );
  }
  map(e) {
    if (e.empty || this.isEmpty) return this;
    let t = [],
      i = [],
      s = -1;
    for (let o = 0; o < this.chunk.length; o++) {
      let l = this.chunkPos[o],
        a = this.chunk[o],
        h = e.touchesRange(l, l + a.length);
      if (h === !1)
        ((s = Math.max(s, a.maxPoint)), t.push(a), i.push(e.mapPos(l)));
      else if (h === !0) {
        let { mapped: c, pos: f } = a.map(l, e);
        c && ((s = Math.max(s, c.maxPoint)), t.push(c), i.push(f));
      }
    }
    let r = this.nextLayer.map(e);
    return t.length == 0 ? r : new z(i, t, r || z.empty, s);
  }
  between(e, t, i) {
    if (!this.isEmpty) {
      for (let s = 0; s < this.chunk.length; s++) {
        let r = this.chunkPos[s],
          o = this.chunk[s];
        if (t >= r && e <= r + o.length && o.between(r, e - r, t - r, i) === !1)
          return;
      }
      this.nextLayer.between(e, t, i);
    }
  }
  iter(e = 0) {
    return Pi.from([this]).goto(e);
  }
  get isEmpty() {
    return this.nextLayer == this;
  }
  static iter(e, t = 0) {
    return Pi.from(e).goto(t);
  }
  static compare(e, t, i, s, r = -1) {
    let o = e.filter((f) => f.maxPoint > 0 || (!f.isEmpty && f.maxPoint >= r)),
      l = t.filter((f) => f.maxPoint > 0 || (!f.isEmpty && f.maxPoint >= r)),
      a = Jo(o, l, i),
      h = new bi(o, a, r),
      c = new bi(l, a, r);
    (i.iterGaps((f, u, d) => Yo(h, f, c, u, d, s)),
      i.empty && i.length == 0 && Yo(h, 0, c, 0, 0, s));
  }
  static eq(e, t, i = 0, s) {
    s == null && (s = 999999999);
    let r = e.filter((c) => !c.isEmpty && t.indexOf(c) < 0),
      o = t.filter((c) => !c.isEmpty && e.indexOf(c) < 0);
    if (r.length != o.length) return !1;
    if (!r.length) return !0;
    let l = Jo(r, o),
      a = new bi(r, l, 0).goto(i),
      h = new bi(o, l, 0).goto(i);
    for (;;) {
      if (
        a.to != h.to ||
        !ur(a.active, h.active) ||
        (a.point && (!h.point || !Zr(a.point, h.point)))
      )
        return !1;
      if (a.to > s) return !0;
      (a.next(), h.next());
    }
  }
  static spans(e, t, i, s, r = -1) {
    let o = new bi(e, null, r).goto(t),
      l = t,
      a = o.openStart;
    for (;;) {
      let h = Math.min(o.to, i);
      if (o.point) {
        let c = o.activeForPoint(o.to),
          f =
            o.pointFrom < t
              ? c.length + 1
              : o.point.startSide < 0
                ? c.length
                : Math.min(c.length, a);
        (s.point(l, h, o.point, c, f, o.pointRank),
          (a = Math.min(o.openEnd(h), c.length)));
      } else h > l && (s.span(l, h, o.active, a), (a = o.openEnd(h)));
      if (o.to > i) return a + (o.point && o.to > i ? 1 : 0);
      ((l = o.to), o.next());
    }
  }
  static of(e, t = !1) {
    let i = new ut();
    for (let s of e instanceof cr ? [e] : t ? xu(e) : e)
      i.add(s.from, s.to, s.value);
    return i.finish();
  }
  static join(e) {
    if (!e.length) return z.empty;
    let t = e[e.length - 1];
    for (let i = e.length - 2; i >= 0; i--)
      for (let s = e[i]; s != z.empty; s = s.nextLayer)
        t = new z(s.chunkPos, s.chunk, t, Math.max(s.maxPoint, t.maxPoint));
    return t;
  }
}
z.empty = new z([], [], null, -1);
function xu(n) {
  if (n.length > 1)
    for (let e = n[0], t = 1; t < n.length; t++) {
      let i = n[t];
      if (fr(e, i) > 0) return n.slice().sort(fr);
      e = i;
    }
  return n;
}
z.empty.nextLayer = z.empty;
class ut {
  finishChunk(e) {
    (this.chunks.push(new eo(this.from, this.to, this.value, this.maxPoint)),
      this.chunkPos.push(this.chunkStart),
      (this.chunkStart = -1),
      (this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint)),
      (this.maxPoint = -1),
      e && ((this.from = []), (this.to = []), (this.value = [])));
  }
  constructor() {
    ((this.chunks = []),
      (this.chunkPos = []),
      (this.chunkStart = -1),
      (this.last = null),
      (this.lastFrom = -1e9),
      (this.lastTo = -1e9),
      (this.from = []),
      (this.to = []),
      (this.value = []),
      (this.maxPoint = -1),
      (this.setMaxPoint = -1),
      (this.nextLayer = null));
  }
  add(e, t, i) {
    this.addInner(e, t, i) ||
      (this.nextLayer || (this.nextLayer = new ut())).add(e, t, i);
  }
  addInner(e, t, i) {
    let s = e - this.lastTo || i.startSide - this.last.endSide;
    if (s <= 0 && (e - this.lastFrom || i.startSide - this.last.startSide) < 0)
      throw new Error(
        "Ranges must be added sorted by `from` position and `startSide`",
      );
    return s < 0
      ? !1
      : (this.from.length == 250 && this.finishChunk(!0),
        this.chunkStart < 0 && (this.chunkStart = e),
        this.from.push(e - this.chunkStart),
        this.to.push(t - this.chunkStart),
        (this.last = i),
        (this.lastFrom = e),
        (this.lastTo = t),
        this.value.push(i),
        i.point && (this.maxPoint = Math.max(this.maxPoint, t - e)),
        !0);
  }
  addChunk(e, t) {
    if ((e - this.lastTo || t.value[0].startSide - this.last.endSide) < 0)
      return !1;
    (this.from.length && this.finishChunk(!0),
      (this.setMaxPoint = Math.max(this.setMaxPoint, t.maxPoint)),
      this.chunks.push(t),
      this.chunkPos.push(e));
    let i = t.value.length - 1;
    return (
      (this.last = t.value[i]),
      (this.lastFrom = t.from[i] + e),
      (this.lastTo = t.to[i] + e),
      !0
    );
  }
  finish() {
    return this.finishInner(z.empty);
  }
  finishInner(e) {
    if ((this.from.length && this.finishChunk(!1), this.chunks.length == 0))
      return e;
    let t = z.create(
      this.chunkPos,
      this.chunks,
      this.nextLayer ? this.nextLayer.finishInner(e) : e,
      this.setMaxPoint,
    );
    return ((this.from = null), t);
  }
}
function Jo(n, e, t) {
  let i = new Map();
  for (let r of n)
    for (let o = 0; o < r.chunk.length; o++)
      r.chunk[o].maxPoint <= 0 && i.set(r.chunk[o], r.chunkPos[o]);
  let s = new Set();
  for (let r of e)
    for (let o = 0; o < r.chunk.length; o++) {
      let l = i.get(r.chunk[o]);
      l != null &&
        (t ? t.mapPos(l) : l) == r.chunkPos[o] &&
        !t?.touchesRange(l, l + r.chunk[o].length) &&
        s.add(r.chunk[o]);
    }
  return s;
}
class hh {
  constructor(e, t, i, s = 0) {
    ((this.layer = e), (this.skip = t), (this.minPoint = i), (this.rank = s));
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  get endSide() {
    return this.value ? this.value.endSide : 0;
  }
  goto(e, t = -1e9) {
    return (
      (this.chunkIndex = this.rangeIndex = 0),
      this.gotoInner(e, t, !1),
      this
    );
  }
  gotoInner(e, t, i) {
    for (; this.chunkIndex < this.layer.chunk.length; ) {
      let s = this.layer.chunk[this.chunkIndex];
      if (
        !(
          (this.skip && this.skip.has(s)) ||
          this.layer.chunkEnd(this.chunkIndex) < e ||
          s.maxPoint < this.minPoint
        )
      )
        break;
      (this.chunkIndex++, (i = !1));
    }
    if (this.chunkIndex < this.layer.chunk.length) {
      let s = this.layer.chunk[this.chunkIndex].findIndex(
        e - this.layer.chunkPos[this.chunkIndex],
        t,
        !0,
      );
      (!i || this.rangeIndex < s) && this.setRangeIndex(s);
    }
    this.next();
  }
  forward(e, t) {
    (this.to - e || this.endSide - t) < 0 && this.gotoInner(e, t, !0);
  }
  next() {
    for (;;)
      if (this.chunkIndex == this.layer.chunk.length) {
        ((this.from = this.to = 1e9), (this.value = null));
        break;
      } else {
        let e = this.layer.chunkPos[this.chunkIndex],
          t = this.layer.chunk[this.chunkIndex],
          i = e + t.from[this.rangeIndex];
        if (
          ((this.from = i),
          (this.to = e + t.to[this.rangeIndex]),
          (this.value = t.value[this.rangeIndex]),
          this.setRangeIndex(this.rangeIndex + 1),
          this.minPoint < 0 ||
            (this.value.point && this.to - this.from >= this.minPoint))
        )
          break;
      }
  }
  setRangeIndex(e) {
    if (e == this.layer.chunk[this.chunkIndex].value.length) {
      if ((this.chunkIndex++, this.skip))
        for (
          ;
          this.chunkIndex < this.layer.chunk.length &&
          this.skip.has(this.layer.chunk[this.chunkIndex]);
        )
          this.chunkIndex++;
      this.rangeIndex = 0;
    } else this.rangeIndex = e;
  }
  nextChunk() {
    (this.chunkIndex++, (this.rangeIndex = 0), this.next());
  }
  compare(e) {
    return (
      this.from - e.from ||
      this.startSide - e.startSide ||
      this.rank - e.rank ||
      this.to - e.to ||
      this.endSide - e.endSide
    );
  }
}
class Pi {
  constructor(e) {
    this.heap = e;
  }
  static from(e, t = null, i = -1) {
    let s = [];
    for (let r = 0; r < e.length; r++)
      for (let o = e[r]; !o.isEmpty; o = o.nextLayer)
        o.maxPoint >= i && s.push(new hh(o, t, i, r));
    return s.length == 1 ? s[0] : new Pi(s);
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  goto(e, t = -1e9) {
    for (let i of this.heap) i.goto(e, t);
    for (let i = this.heap.length >> 1; i >= 0; i--) Ms(this.heap, i);
    return (this.next(), this);
  }
  forward(e, t) {
    for (let i of this.heap) i.forward(e, t);
    for (let i = this.heap.length >> 1; i >= 0; i--) Ms(this.heap, i);
    (this.to - e || this.value.endSide - t) < 0 && this.next();
  }
  next() {
    if (this.heap.length == 0)
      ((this.from = this.to = 1e9), (this.value = null), (this.rank = -1));
    else {
      let e = this.heap[0];
      ((this.from = e.from),
        (this.to = e.to),
        (this.value = e.value),
        (this.rank = e.rank),
        e.value && e.next(),
        Ms(this.heap, 0));
    }
  }
}
function Ms(n, e) {
  for (let t = n[e]; ; ) {
    let i = (e << 1) + 1;
    if (i >= n.length) break;
    let s = n[i];
    if (
      (i + 1 < n.length && s.compare(n[i + 1]) >= 0 && ((s = n[i + 1]), i++),
      t.compare(s) < 0)
    )
      break;
    ((n[i] = t), (n[e] = s), (e = i));
  }
}
class bi {
  constructor(e, t, i) {
    ((this.minPoint = i),
      (this.active = []),
      (this.activeTo = []),
      (this.activeRank = []),
      (this.minActive = -1),
      (this.point = null),
      (this.pointFrom = 0),
      (this.pointRank = 0),
      (this.to = -1e9),
      (this.endSide = 0),
      (this.openStart = -1),
      (this.cursor = Pi.from(e, t, i)));
  }
  goto(e, t = -1e9) {
    return (
      this.cursor.goto(e, t),
      (this.active.length = this.activeTo.length = this.activeRank.length = 0),
      (this.minActive = -1),
      (this.to = e),
      (this.endSide = t),
      (this.openStart = -1),
      this.next(),
      this
    );
  }
  forward(e, t) {
    for (
      ;
      this.minActive > -1 &&
      (this.activeTo[this.minActive] - e ||
        this.active[this.minActive].endSide - t) < 0;
    )
      this.removeActive(this.minActive);
    this.cursor.forward(e, t);
  }
  removeActive(e) {
    (fn(this.active, e),
      fn(this.activeTo, e),
      fn(this.activeRank, e),
      (this.minActive = Xo(this.active, this.activeTo)));
  }
  addActive(e) {
    let t = 0,
      { value: i, to: s, rank: r } = this.cursor;
    for (
      ;
      t < this.activeRank.length &&
      (r - this.activeRank[t] || s - this.activeTo[t]) > 0;
    )
      t++;
    (un(this.active, t, i),
      un(this.activeTo, t, s),
      un(this.activeRank, t, r),
      e && un(e, t, this.cursor.from),
      (this.minActive = Xo(this.active, this.activeTo)));
  }
  next() {
    let e = this.to,
      t = this.point;
    this.point = null;
    let i = this.openStart < 0 ? [] : null;
    for (;;) {
      let s = this.minActive;
      if (
        s > -1 &&
        (this.activeTo[s] - this.cursor.from ||
          this.active[s].endSide - this.cursor.startSide) < 0
      ) {
        if (this.activeTo[s] > e) {
          ((this.to = this.activeTo[s]),
            (this.endSide = this.active[s].endSide));
          break;
        }
        (this.removeActive(s), i && fn(i, s));
      } else if (this.cursor.value)
        if (this.cursor.from > e) {
          ((this.to = this.cursor.from),
            (this.endSide = this.cursor.startSide));
          break;
        } else {
          let r = this.cursor.value;
          if (!r.point) (this.addActive(i), this.cursor.next());
          else if (
            t &&
            this.cursor.to == this.to &&
            this.cursor.from < this.cursor.to
          )
            this.cursor.next();
          else {
            ((this.point = r),
              (this.pointFrom = this.cursor.from),
              (this.pointRank = this.cursor.rank),
              (this.to = this.cursor.to),
              (this.endSide = r.endSide),
              this.cursor.next(),
              this.forward(this.to, this.endSide));
            break;
          }
        }
      else {
        this.to = this.endSide = 1e9;
        break;
      }
    }
    if (i) {
      this.openStart = 0;
      for (let s = i.length - 1; s >= 0 && i[s] < e; s--) this.openStart++;
    }
  }
  activeForPoint(e) {
    if (!this.active.length) return this.active;
    let t = [];
    for (
      let i = this.active.length - 1;
      i >= 0 && !(this.activeRank[i] < this.pointRank);
      i--
    )
      (this.activeTo[i] > e ||
        (this.activeTo[i] == e &&
          this.active[i].endSide >= this.point.endSide)) &&
        t.push(this.active[i]);
    return t.reverse();
  }
  openEnd(e) {
    let t = 0;
    for (let i = this.activeTo.length - 1; i >= 0 && this.activeTo[i] > e; i--)
      t++;
    return t;
  }
}
function Yo(n, e, t, i, s, r) {
  (n.goto(e), t.goto(i));
  let o = i + s,
    l = i,
    a = i - e,
    h = !!r.boundChange;
  for (let c = !1; ; ) {
    let f = n.to + a - t.to,
      u = f || n.endSide - t.endSide,
      d = u < 0 ? n.to + a : t.to,
      p = Math.min(d, o);
    if (
      (n.point || t.point
        ? ((n.point &&
            t.point &&
            Zr(n.point, t.point) &&
            ur(n.activeForPoint(n.to), t.activeForPoint(t.to))) ||
            r.comparePoint(l, p, n.point, t.point),
          (c = !1))
        : (c && r.boundChange(l),
          p > l &&
            !ur(n.active, t.active) &&
            r.compareRange(l, p, n.active, t.active),
          h && p < o && (f || n.openEnd(d) != t.openEnd(d)) && (c = !0)),
      d > o)
    )
      break;
    ((l = d), u <= 0 && n.next(), u >= 0 && t.next());
  }
}
function ur(n, e) {
  if (n.length != e.length) return !1;
  for (let t = 0; t < n.length; t++)
    if (n[t] != e[t] && !Zr(n[t], e[t])) return !1;
  return !0;
}
function fn(n, e) {
  for (let t = e, i = n.length - 1; t < i; t++) n[t] = n[t + 1];
  n.pop();
}
function un(n, e, t) {
  for (let i = n.length - 1; i >= e; i--) n[i + 1] = n[i];
  n[e] = t;
}
function Xo(n, e) {
  let t = -1,
    i = 1e9;
  for (let s = 0; s < e.length; s++)
    (e[s] - i || n[s].endSide - n[t].endSide) < 0 && ((t = s), (i = e[s]));
  return t;
}
function ui(n, e, t = n.length) {
  let i = 0;
  for (let s = 0; s < t && s < n.length; )
    n.charCodeAt(s) == 9 ? ((i += e - (i % e)), s++) : (i++, (s = he(n, s)));
  return i;
}
function dr(n, e, t, i) {
  for (let s = 0, r = 0; ; ) {
    if (r >= e) return s;
    if (s == n.length) break;
    ((r += n.charCodeAt(s) == 9 ? t - (r % t) : 1), (s = he(n, s)));
  }
  return i === !0 ? -1 : n.length;
}
const pr = "ͼ",
  Qo = typeof Symbol > "u" ? "__" + pr : Symbol.for(pr),
  mr =
    typeof Symbol > "u"
      ? "__styleSet" + Math.floor(Math.random() * 1e8)
      : Symbol("styleSet"),
  Zo = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : {};
class kt {
  constructor(e, t) {
    this.rules = [];
    let { finish: i } = t || {};
    function s(o) {
      return /^@/.test(o) ? [o] : o.split(/,\s*/);
    }
    function r(o, l, a, h) {
      let c = [],
        f = /^@(\w+)\b/.exec(o[0]),
        u = f && f[1] == "keyframes";
      if (f && l == null) return a.push(o[0] + ";");
      for (let d in l) {
        let p = l[d];
        if (/&/.test(d))
          r(
            d
              .split(/,\s*/)
              .map((m) => o.map((g) => m.replace(/&/, g)))
              .reduce((m, g) => m.concat(g)),
            p,
            a,
          );
        else if (p && typeof p == "object") {
          if (!f)
            throw new RangeError(
              "The value of a property (" +
                d +
                ") should be a primitive value.",
            );
          r(s(d), p, c, u);
        } else
          p != null &&
            c.push(
              d
                .replace(/_.*/, "")
                .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) +
                ": " +
                p +
                ";",
            );
      }
      (c.length || u) &&
        a.push(
          (i && !f && !h ? o.map(i) : o).join(", ") + " {" + c.join(" ") + "}",
        );
    }
    for (let o in e) r(s(o), e[o], this.rules);
  }
  getRules() {
    return this.rules.join(`
`);
  }
  static newName() {
    let e = Zo[Qo] || 1;
    return ((Zo[Qo] = e + 1), pr + e.toString(36));
  }
  static mount(e, t, i) {
    let s = e[mr],
      r = i && i.nonce;
    (s ? r && s.setNonce(r) : (s = new wu(e, r)),
      s.mount(Array.isArray(t) ? t : [t], e));
  }
}
let el = new Map();
class wu {
  constructor(e, t) {
    let i = e.ownerDocument || e,
      s = i.defaultView;
    if (!e.head && e.adoptedStyleSheets && s.CSSStyleSheet) {
      let r = el.get(i);
      if (r) return (e[mr] = r);
      ((this.sheet = new s.CSSStyleSheet()), el.set(i, this));
    } else
      ((this.styleTag = i.createElement("style")),
        t && this.styleTag.setAttribute("nonce", t));
    ((this.modules = []), (e[mr] = this));
  }
  mount(e, t) {
    let i = this.sheet,
      s = 0,
      r = 0;
    for (let o = 0; o < e.length; o++) {
      let l = e[o],
        a = this.modules.indexOf(l);
      if (
        (a < r && a > -1 && (this.modules.splice(a, 1), r--, (a = -1)), a == -1)
      ) {
        if ((this.modules.splice(r++, 0, l), i))
          for (let h = 0; h < l.rules.length; h++)
            i.insertRule(l.rules[h], s++);
      } else {
        for (; r < a; ) s += this.modules[r++].rules.length;
        ((s += l.rules.length), r++);
      }
    }
    if (i)
      t.adoptedStyleSheets.indexOf(this.sheet) < 0 &&
        (t.adoptedStyleSheets = [this.sheet, ...t.adoptedStyleSheets]);
    else {
      let o = "";
      for (let a = 0; a < this.modules.length; a++)
        o +=
          this.modules[a].getRules() +
          `
`;
      this.styleTag.textContent = o;
      let l = t.head || t;
      this.styleTag.parentNode != l &&
        l.insertBefore(this.styleTag, l.firstChild);
    }
  }
  setNonce(e) {
    this.styleTag &&
      this.styleTag.getAttribute("nonce") != e &&
      this.styleTag.setAttribute("nonce", e);
  }
}
var St = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
  },
  Ri = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ":",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: '"',
  },
  vu = typeof navigator < "u" && /Mac/.test(navigator.platform),
  ku =
    typeof navigator < "u" &&
    /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (var de = 0; de < 10; de++) St[48 + de] = St[96 + de] = String(de);
for (var de = 1; de <= 24; de++) St[de + 111] = "F" + de;
for (var de = 65; de <= 90; de++)
  ((St[de] = String.fromCharCode(de + 32)), (Ri[de] = String.fromCharCode(de)));
for (var Ts in St) Ri.hasOwnProperty(Ts) || (Ri[Ts] = St[Ts]);
function Su(n) {
  var e =
      (vu && n.metaKey && n.shiftKey && !n.ctrlKey && !n.altKey) ||
      (ku && n.shiftKey && n.key && n.key.length == 1) ||
      n.key == "Unidentified",
    t =
      (!e && n.key) ||
      (n.shiftKey ? Ri : St)[n.keyCode] ||
      n.key ||
      "Unidentified";
  return (
    t == "Esc" && (t = "Escape"),
    t == "Del" && (t = "Delete"),
    t == "Left" && (t = "ArrowLeft"),
    t == "Up" && (t = "ArrowUp"),
    t == "Right" && (t = "ArrowRight"),
    t == "Down" && (t = "ArrowDown"),
    t
  );
}
function K() {
  var n = arguments[0];
  typeof n == "string" && (n = document.createElement(n));
  var e = 1,
    t = arguments[1];
  if (t && typeof t == "object" && t.nodeType == null && !Array.isArray(t)) {
    for (var i in t)
      if (Object.prototype.hasOwnProperty.call(t, i)) {
        var s = t[i];
        typeof s == "string" ? n.setAttribute(i, s) : s != null && (n[i] = s);
      }
    e++;
  }
  for (; e < arguments.length; e++) ch(n, arguments[e]);
  return n;
}
function ch(n, e) {
  if (typeof e == "string") n.appendChild(document.createTextNode(e));
  else if (e != null)
    if (e.nodeType != null) n.appendChild(e);
    else if (Array.isArray(e)) for (var t = 0; t < e.length; t++) ch(n, e[t]);
    else throw new RangeError("Unsupported child node: " + e);
}
let ke =
    typeof navigator < "u"
      ? navigator
      : { userAgent: "", vendor: "", platform: "" },
  gr = typeof document < "u" ? document : { documentElement: { style: {} } };
const yr = /Edge\/(\d+)/.exec(ke.userAgent),
  fh = /MSIE \d/.test(ke.userAgent),
  br = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(ke.userAgent),
  us = !!(fh || br || yr),
  tl = !us && /gecko\/(\d+)/i.test(ke.userAgent),
  Ds = !us && /Chrome\/(\d+)/.exec(ke.userAgent),
  Cu = "webkitFontSmoothing" in gr.documentElement.style,
  xr = !us && /Apple Computer/.test(ke.vendor),
  il = xr && (/Mobile\/\w+/.test(ke.userAgent) || ke.maxTouchPoints > 2);
var O = {
  mac: il || /Mac/.test(ke.platform),
  windows: /Win/.test(ke.platform),
  linux: /Linux|X11/.test(ke.platform),
  ie: us,
  ie_version: fh ? gr.documentMode || 6 : br ? +br[1] : yr ? +yr[1] : 0,
  gecko: tl,
  gecko_version: tl ? +(/Firefox\/(\d+)/.exec(ke.userAgent) || [0, 0])[1] : 0,
  chrome: !!Ds,
  chrome_version: Ds ? +Ds[1] : 0,
  ios: il,
  android: /Android\b/.test(ke.userAgent),
  webkit_version: Cu
    ? +(/\bAppleWebKit\/(\d+)/.exec(ke.userAgent) || [0, 0])[1]
    : 0,
  safari: xr,
  safari_version: xr
    ? +(/\bVersion\/(\d+(\.\d+)?)/.exec(ke.userAgent) || [0, 0])[1]
    : 0,
  tabSize:
    gr.documentElement.style.tabSize != null ? "tab-size" : "-moz-tab-size",
};
function to(n, e) {
  for (let t in n)
    t == "class" && e.class
      ? (e.class += " " + n.class)
      : t == "style" && e.style
        ? (e.style += ";" + n.style)
        : (e[t] = n[t]);
  return e;
}
const $n = Object.create(null);
function io(n, e, t) {
  if (n == e) return !0;
  (n || (n = $n), e || (e = $n));
  let i = Object.keys(n),
    s = Object.keys(e);
  if (i.length - 0 != s.length - 0) return !1;
  for (let r of i)
    if (r != t && (s.indexOf(r) == -1 || n[r] !== e[r])) return !1;
  return !0;
}
function Au(n, e) {
  for (let t = n.attributes.length - 1; t >= 0; t--) {
    let i = n.attributes[t].name;
    e[i] == null && n.removeAttribute(i);
  }
  for (let t in e) {
    let i = e[t];
    t == "style"
      ? (n.style.cssText = i)
      : n.getAttribute(t) != i && n.setAttribute(t, i);
  }
}
function nl(n, e, t) {
  let i = !1;
  if (e)
    for (let s in e)
      (t && s in t) ||
        ((i = !0),
        s == "style" ? (n.style.cssText = "") : n.removeAttribute(s));
  if (t)
    for (let s in t)
      (e && e[s] == t[s]) ||
        ((i = !0),
        s == "style" ? (n.style.cssText = t[s]) : n.setAttribute(s, t[s]));
  return i;
}
function Mu(n) {
  let e = Object.create(null);
  for (let t = 0; t < n.attributes.length; t++) {
    let i = n.attributes[t];
    e[i.name] = i.value;
  }
  return e;
}
class Ke {
  eq(e) {
    return !1;
  }
  updateDOM(e, t) {
    return !1;
  }
  compare(e) {
    return this == e || (this.constructor == e.constructor && this.eq(e));
  }
  get estimatedHeight() {
    return -1;
  }
  get lineBreaks() {
    return 0;
  }
  ignoreEvent(e) {
    return !0;
  }
  coordsAt(e, t, i) {
    return null;
  }
  get isHidden() {
    return !1;
  }
  get editable() {
    return !1;
  }
  destroy(e) {}
}
var me = (function (n) {
  return (
    (n[(n.Text = 0)] = "Text"),
    (n[(n.WidgetBefore = 1)] = "WidgetBefore"),
    (n[(n.WidgetAfter = 2)] = "WidgetAfter"),
    (n[(n.WidgetRange = 3)] = "WidgetRange"),
    n
  );
})(me || (me = {}));
class L extends vt {
  constructor(e, t, i, s) {
    (super(),
      (this.startSide = e),
      (this.endSide = t),
      (this.widget = i),
      (this.spec = s));
  }
  get heightRelevant() {
    return !1;
  }
  static mark(e) {
    return new Qi(e);
  }
  static widget(e) {
    let t = Math.max(-1e4, Math.min(1e4, e.side || 0)),
      i = !!e.block;
    return (
      (t += i && !e.inlineOrder ? (t > 0 ? 3e8 : -4e8) : t > 0 ? 1e8 : -1e8),
      new Vt(e, t, t, i, e.widget || null, !1)
    );
  }
  static replace(e) {
    let t = !!e.block,
      i,
      s;
    if (e.isBlockGap) ((i = -5e8), (s = 4e8));
    else {
      let { start: r, end: o } = uh(e, t);
      ((i = (r ? (t ? -3e8 : -1) : 5e8) - 1),
        (s = (o ? (t ? 2e8 : 1) : -6e8) + 1));
    }
    return new Vt(e, i, s, t, e.widget || null, !0);
  }
  static line(e) {
    return new Zi(e);
  }
  static set(e, t = !1) {
    return z.of(e, t);
  }
  hasHeight() {
    return this.widget ? this.widget.estimatedHeight > -1 : !1;
  }
}
L.none = z.empty;
class Qi extends L {
  constructor(e) {
    let { start: t, end: i } = uh(e);
    (super(t ? -1 : 5e8, i ? 1 : -6e8, null, e),
      (this.tagName = e.tagName || "span"),
      (this.attrs =
        e.class && e.attributes
          ? to(e.attributes, { class: e.class })
          : e.class
            ? { class: e.class }
            : e.attributes || $n));
  }
  eq(e) {
    return (
      this == e ||
      (e instanceof Qi && this.tagName == e.tagName && io(this.attrs, e.attrs))
    );
  }
  range(e, t = e) {
    if (e >= t) throw new RangeError("Mark decorations may not be empty");
    return super.range(e, t);
  }
}
Qi.prototype.point = !1;
class Zi extends L {
  constructor(e) {
    super(-2e8, -2e8, null, e);
  }
  eq(e) {
    return (
      e instanceof Zi &&
      this.spec.class == e.spec.class &&
      io(this.spec.attributes, e.spec.attributes)
    );
  }
  range(e, t = e) {
    if (t != e)
      throw new RangeError("Line decoration ranges must be zero-length");
    return super.range(e, t);
  }
}
Zi.prototype.mapMode = pe.TrackBefore;
Zi.prototype.point = !0;
class Vt extends L {
  constructor(e, t, i, s, r, o) {
    (super(t, i, r, e),
      (this.block = s),
      (this.isReplace = o),
      (this.mapMode = s
        ? t <= 0
          ? pe.TrackBefore
          : pe.TrackAfter
        : pe.TrackDel));
  }
  get type() {
    return this.startSide != this.endSide
      ? me.WidgetRange
      : this.startSide <= 0
        ? me.WidgetBefore
        : me.WidgetAfter;
  }
  get heightRelevant() {
    return (
      this.block ||
      (!!this.widget &&
        (this.widget.estimatedHeight >= 5 || this.widget.lineBreaks > 0))
    );
  }
  eq(e) {
    return (
      e instanceof Vt &&
      Tu(this.widget, e.widget) &&
      this.block == e.block &&
      this.startSide == e.startSide &&
      this.endSide == e.endSide
    );
  }
  range(e, t = e) {
    if (
      this.isReplace &&
      (e > t || (e == t && this.startSide > 0 && this.endSide <= 0))
    )
      throw new RangeError("Invalid range for replacement decoration");
    if (!this.isReplace && t != e)
      throw new RangeError(
        "Widget decorations can only have zero-length ranges",
      );
    return super.range(e, t);
  }
}
Vt.prototype.point = !0;
function uh(n, e = !1) {
  let { inclusiveStart: t, inclusiveEnd: i } = n;
  return (
    t == null && (t = n.inclusive),
    i == null && (i = n.inclusive),
    { start: t ?? e, end: i ?? e }
  );
}
function Tu(n, e) {
  return n == e || !!(n && e && n.compare(e));
}
function Zt(n, e, t, i = 0) {
  let s = t.length - 1;
  s >= 0 && t[s] + i >= n ? (t[s] = Math.max(t[s], e)) : t.push(n, e);
}
class Ii extends vt {
  constructor(e, t) {
    (super(), (this.tagName = e), (this.attributes = t));
  }
  eq(e) {
    return (
      e == this ||
      (e instanceof Ii &&
        this.tagName == e.tagName &&
        io(this.attributes, e.attributes))
    );
  }
  static create(e) {
    return new Ii(e.tagName, e.attributes || $n);
  }
  static set(e, t = !1) {
    return z.of(e, t);
  }
}
Ii.prototype.startSide = Ii.prototype.endSide = -1;
function Ni(n) {
  let e;
  return (
    n.nodeType == 11 ? (e = n.getSelection ? n : n.ownerDocument) : (e = n),
    e.getSelection()
  );
}
function wr(n, e) {
  return e ? n == e || n.contains(e.nodeType != 1 ? e.parentNode : e) : !1;
}
function Ti(n, e) {
  if (!e.anchorNode) return !1;
  try {
    return wr(n, e.anchorNode);
  } catch {
    return !1;
  }
}
function Di(n) {
  return n.nodeType == 3
    ? Fi(n, 0, n.nodeValue.length).getClientRects()
    : n.nodeType == 1
      ? n.getClientRects()
      : [];
}
function Oi(n, e, t, i) {
  return t ? sl(n, e, t, i, -1) || sl(n, e, t, i, 1) : !1;
}
function Ct(n) {
  for (var e = 0; ; e++) if (((n = n.previousSibling), !n)) return e;
}
function Kn(n) {
  return (
    n.nodeType == 1 &&
    /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(n.nodeName)
  );
}
function sl(n, e, t, i, s) {
  for (;;) {
    if (n == t && e == i) return !0;
    if (e == (s < 0 ? 0 : dt(n))) {
      if (n.nodeName == "DIV") return !1;
      let r = n.parentNode;
      if (!r || r.nodeType != 1) return !1;
      ((e = Ct(n) + (s < 0 ? 0 : 1)), (n = r));
    } else if (n.nodeType == 1) {
      if (
        ((n = n.childNodes[e + (s < 0 ? -1 : 0)]),
        n.nodeType == 1 && n.contentEditable == "false")
      )
        return !1;
      e = s < 0 ? dt(n) : 0;
    } else return !1;
  }
}
function dt(n) {
  return n.nodeType == 3 ? n.nodeValue.length : n.childNodes.length;
}
function Wi(n, e) {
  let t = e ? n.left : n.right;
  return { left: t, right: t, top: n.top, bottom: n.bottom };
}
function Du(n) {
  let e = n.visualViewport;
  return e
    ? { left: 0, right: e.width, top: 0, bottom: e.height }
    : { left: 0, right: n.innerWidth, top: 0, bottom: n.innerHeight };
}
function dh(n, e) {
  let t = e.width / n.offsetWidth,
    i = e.height / n.offsetHeight;
  return (
    ((t > 0.995 && t < 1.005) ||
      !isFinite(t) ||
      Math.abs(e.width - n.offsetWidth) < 1) &&
      (t = 1),
    ((i > 0.995 && i < 1.005) ||
      !isFinite(i) ||
      Math.abs(e.height - n.offsetHeight) < 1) &&
      (i = 1),
    { scaleX: t, scaleY: i }
  );
}
function Ou(n, e, t, i, s, r, o, l) {
  let a = n.ownerDocument,
    h = a.defaultView || window;
  for (let c = n, f = !1; c && !f; )
    if (c.nodeType == 1) {
      let u,
        d = c == a.body,
        p = 1,
        m = 1;
      if (d) u = Du(h);
      else {
        if (
          (/^(fixed|sticky)$/.test(getComputedStyle(c).position) && (f = !0),
          c.scrollHeight <= c.clientHeight && c.scrollWidth <= c.clientWidth)
        ) {
          c = c.assignedSlot || c.parentNode;
          continue;
        }
        let w = c.getBoundingClientRect();
        (({ scaleX: p, scaleY: m } = dh(c, w)),
          (u = {
            left: w.left,
            right: w.left + c.clientWidth * p,
            top: w.top,
            bottom: w.top + c.clientHeight * m,
          }));
      }
      let g = 0,
        b = 0;
      if (s == "nearest")
        e.top < u.top
          ? ((b = e.top - (u.top + o)),
            t > 0 && e.bottom > u.bottom + b && (b = e.bottom - u.bottom + o))
          : e.bottom > u.bottom &&
            ((b = e.bottom - u.bottom + o),
            t < 0 && e.top - b < u.top && (b = e.top - (u.top + o)));
      else {
        let w = e.bottom - e.top,
          v = u.bottom - u.top;
        b =
          (s == "center" && w <= v
            ? e.top + w / 2 - v / 2
            : s == "start" || (s == "center" && t < 0)
              ? e.top - o
              : e.bottom - v + o) - u.top;
      }
      if (
        (i == "nearest"
          ? e.left < u.left
            ? ((g = e.left - (u.left + r)),
              t > 0 && e.right > u.right + g && (g = e.right - u.right + r))
            : e.right > u.right &&
              ((g = e.right - u.right + r),
              t < 0 && e.left < u.left + g && (g = e.left - (u.left + r)))
          : (g =
              (i == "center"
                ? e.left + (e.right - e.left) / 2 - (u.right - u.left) / 2
                : (i == "start") == l
                  ? e.left - r
                  : e.right - (u.right - u.left) + r) - u.left),
        g || b)
      )
        if (d) h.scrollBy(g, b);
        else {
          let w = 0,
            v = 0;
          if (b) {
            let T = c.scrollTop;
            ((c.scrollTop += b / m), (v = (c.scrollTop - T) * m));
          }
          if (g) {
            let T = c.scrollLeft;
            ((c.scrollLeft += g / p), (w = (c.scrollLeft - T) * p));
          }
          ((e = {
            left: e.left - w,
            top: e.top - v,
            right: e.right - w,
            bottom: e.bottom - v,
          }),
            w && Math.abs(w - g) < 1 && (i = "nearest"),
            v && Math.abs(v - b) < 1 && (s = "nearest"));
        }
      if (d) break;
      ((e.top < u.top ||
        e.bottom > u.bottom ||
        e.left < u.left ||
        e.right > u.right) &&
        (e = {
          left: Math.max(e.left, u.left),
          right: Math.min(e.right, u.right),
          top: Math.max(e.top, u.top),
          bottom: Math.min(e.bottom, u.bottom),
        }),
        (c = c.assignedSlot || c.parentNode));
    } else if (c.nodeType == 11) c = c.host;
    else break;
}
function ph(n, e = !0) {
  let t = n.ownerDocument,
    i = null,
    s = null;
  for (let r = n.parentNode; r && !(r == t.body || ((!e || i) && s)); )
    if (r.nodeType == 1)
      (!s && r.scrollHeight > r.clientHeight && (s = r),
        e && !i && r.scrollWidth > r.clientWidth && (i = r),
        (r = r.assignedSlot || r.parentNode));
    else if (r.nodeType == 11) r = r.host;
    else break;
  return { x: i, y: s };
}
class Bu {
  constructor() {
    ((this.anchorNode = null),
      (this.anchorOffset = 0),
      (this.focusNode = null),
      (this.focusOffset = 0));
  }
  eq(e) {
    return (
      this.anchorNode == e.anchorNode &&
      this.anchorOffset == e.anchorOffset &&
      this.focusNode == e.focusNode &&
      this.focusOffset == e.focusOffset
    );
  }
  setRange(e) {
    let { anchorNode: t, focusNode: i } = e;
    this.set(
      t,
      Math.min(e.anchorOffset, t ? dt(t) : 0),
      i,
      Math.min(e.focusOffset, i ? dt(i) : 0),
    );
  }
  set(e, t, i, s) {
    ((this.anchorNode = e),
      (this.anchorOffset = t),
      (this.focusNode = i),
      (this.focusOffset = s));
  }
}
let Lt = null;
O.safari && O.safari_version >= 26 && (Lt = !1);
function mh(n) {
  if (n.setActive) return n.setActive();
  if (Lt) return n.focus(Lt);
  let e = [];
  for (
    let t = n;
    t && (e.push(t, t.scrollTop, t.scrollLeft), t != t.ownerDocument);
    t = t.parentNode
  );
  if (
    (n.focus(
      Lt == null
        ? {
            get preventScroll() {
              return ((Lt = { preventScroll: !0 }), !0);
            },
          }
        : void 0,
    ),
    !Lt)
  ) {
    Lt = !1;
    for (let t = 0; t < e.length; ) {
      let i = e[t++],
        s = e[t++],
        r = e[t++];
      (i.scrollTop != s && (i.scrollTop = s),
        i.scrollLeft != r && (i.scrollLeft = r));
    }
  }
}
let rl;
function Fi(n, e, t = e) {
  let i = rl || (rl = document.createRange());
  return (i.setEnd(n, t), i.setStart(n, e), i);
}
function ei(n, e, t, i) {
  let s = { key: e, code: e, keyCode: t, which: t, cancelable: !0 };
  i &&
    ({
      altKey: s.altKey,
      ctrlKey: s.ctrlKey,
      shiftKey: s.shiftKey,
      metaKey: s.metaKey,
    } = i);
  let r = new KeyboardEvent("keydown", s);
  ((r.synthetic = !0), n.dispatchEvent(r));
  let o = new KeyboardEvent("keyup", s);
  return (
    (o.synthetic = !0),
    n.dispatchEvent(o),
    r.defaultPrevented || o.defaultPrevented
  );
}
function Eu(n) {
  for (; n; ) {
    if (n && (n.nodeType == 9 || (n.nodeType == 11 && n.host))) return n;
    n = n.assignedSlot || n.parentNode;
  }
  return null;
}
function Lu(n, e) {
  let t = e.focusNode,
    i = e.focusOffset;
  if (!t || e.anchorNode != t || e.anchorOffset != i) return !1;
  for (i = Math.min(i, dt(t)); ; )
    if (i) {
      if (t.nodeType != 1) return !1;
      let s = t.childNodes[i - 1];
      s.contentEditable == "false" ? i-- : ((t = s), (i = dt(t)));
    } else {
      if (t == n) return !0;
      ((i = Ct(t)), (t = t.parentNode));
    }
}
function gh(n) {
  return n instanceof Window
    ? n.pageYOffset >
        Math.max(0, n.document.documentElement.scrollHeight - n.innerHeight - 4)
    : n.scrollTop > Math.max(1, n.scrollHeight - n.clientHeight - 4);
}
function yh(n, e) {
  for (let t = n, i = e; ; ) {
    if (t.nodeType == 3 && i > 0) return { node: t, offset: i };
    if (t.nodeType == 1 && i > 0) {
      if (t.contentEditable == "false") return null;
      ((t = t.childNodes[i - 1]), (i = dt(t)));
    } else if (t.parentNode && !Kn(t)) ((i = Ct(t)), (t = t.parentNode));
    else return null;
  }
}
function bh(n, e) {
  for (let t = n, i = e; ; ) {
    if (t.nodeType == 3 && i < t.nodeValue.length)
      return { node: t, offset: i };
    if (t.nodeType == 1 && i < t.childNodes.length) {
      if (t.contentEditable == "false") return null;
      ((t = t.childNodes[i]), (i = 0));
    } else if (t.parentNode && !Kn(t)) ((i = Ct(t) + 1), (t = t.parentNode));
    else return null;
  }
}
class qe {
  constructor(e, t, i = !0) {
    ((this.node = e), (this.offset = t), (this.precise = i));
  }
  static before(e, t) {
    return new qe(e.parentNode, Ct(e), t);
  }
  static after(e, t) {
    return new qe(e.parentNode, Ct(e) + 1, t);
  }
}
var G = (function (n) {
  return ((n[(n.LTR = 0)] = "LTR"), (n[(n.RTL = 1)] = "RTL"), n);
})(G || (G = {}));
const zt = G.LTR,
  no = G.RTL;
function xh(n) {
  let e = [];
  for (let t = 0; t < n.length; t++) e.push(1 << +n[t]);
  return e;
}
const Pu = xh(
    "88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008",
  ),
  Ru = xh(
    "4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333",
  ),
  vr = Object.create(null),
  Je = [];
for (let n of ["()", "[]", "{}"]) {
  let e = n.charCodeAt(0),
    t = n.charCodeAt(1);
  ((vr[e] = t), (vr[t] = -e));
}
function wh(n) {
  return n <= 247
    ? Pu[n]
    : 1424 <= n && n <= 1524
      ? 2
      : 1536 <= n && n <= 1785
        ? Ru[n - 1536]
        : 1774 <= n && n <= 2220
          ? 4
          : 8192 <= n && n <= 8204
            ? 256
            : 64336 <= n && n <= 65023
              ? 4
              : 1;
}
const Iu = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/;
class it {
  get dir() {
    return this.level % 2 ? no : zt;
  }
  constructor(e, t, i) {
    ((this.from = e), (this.to = t), (this.level = i));
  }
  side(e, t) {
    return (this.dir == t) == e ? this.to : this.from;
  }
  forward(e, t) {
    return e == (this.dir == t);
  }
  static find(e, t, i, s) {
    let r = -1;
    for (let o = 0; o < e.length; o++) {
      let l = e[o];
      if (l.from <= t && l.to >= t) {
        if (l.level == i) return o;
        (r < 0 ||
          (s != 0 ? (s < 0 ? l.from < t : l.to > t) : e[r].level > l.level)) &&
          (r = o);
      }
    }
    if (r < 0) throw new RangeError("Index out of range");
    return r;
  }
}
function vh(n, e) {
  if (n.length != e.length) return !1;
  for (let t = 0; t < n.length; t++) {
    let i = n[t],
      s = e[t];
    if (
      i.from != s.from ||
      i.to != s.to ||
      i.direction != s.direction ||
      !vh(i.inner, s.inner)
    )
      return !1;
  }
  return !0;
}
const j = [];
function Nu(n, e, t, i, s) {
  for (let r = 0; r <= i.length; r++) {
    let o = r ? i[r - 1].to : e,
      l = r < i.length ? i[r].from : t,
      a = r ? 256 : s;
    for (let h = o, c = a, f = a; h < l; h++) {
      let u = wh(n.charCodeAt(h));
      (u == 512 ? (u = c) : u == 8 && f == 4 && (u = 16),
        (j[h] = u == 4 ? 2 : u),
        u & 7 && (f = u),
        (c = u));
    }
    for (let h = o, c = a, f = a; h < l; h++) {
      let u = j[h];
      if (u == 128)
        h < l - 1 && c == j[h + 1] && c & 24 ? (u = j[h] = c) : (j[h] = 256);
      else if (u == 64) {
        let d = h + 1;
        for (; d < l && j[d] == 64; ) d++;
        let p = (h && c == 8) || (d < t && j[d] == 8) ? (f == 1 ? 1 : 8) : 256;
        for (let m = h; m < d; m++) j[m] = p;
        h = d - 1;
      } else u == 8 && f == 1 && (j[h] = 1);
      ((c = u), u & 7 && (f = u));
    }
  }
}
function Wu(n, e, t, i, s) {
  let r = s == 1 ? 2 : 1;
  for (let o = 0, l = 0, a = 0; o <= i.length; o++) {
    let h = o ? i[o - 1].to : e,
      c = o < i.length ? i[o].from : t;
    for (let f = h, u, d, p; f < c; f++)
      if ((d = vr[(u = n.charCodeAt(f))]))
        if (d < 0) {
          for (let m = l - 3; m >= 0; m -= 3)
            if (Je[m + 1] == -d) {
              let g = Je[m + 2],
                b = g & 2 ? s : g & 4 ? (g & 1 ? r : s) : 0;
              (b && (j[f] = j[Je[m]] = b), (l = m));
              break;
            }
        } else {
          if (Je.length == 189) break;
          ((Je[l++] = f), (Je[l++] = u), (Je[l++] = a));
        }
      else if ((p = j[f]) == 2 || p == 1) {
        let m = p == s;
        a = m ? 0 : 1;
        for (let g = l - 3; g >= 0; g -= 3) {
          let b = Je[g + 2];
          if (b & 2) break;
          if (m) Je[g + 2] |= 2;
          else {
            if (b & 4) break;
            Je[g + 2] |= 4;
          }
        }
      }
  }
}
function Fu(n, e, t, i) {
  for (let s = 0, r = i; s <= t.length; s++) {
    let o = s ? t[s - 1].to : n,
      l = s < t.length ? t[s].from : e;
    for (let a = o; a < l; ) {
      let h = j[a];
      if (h == 256) {
        let c = a + 1;
        for (;;)
          if (c == l) {
            if (s == t.length) break;
            ((c = t[s++].to), (l = s < t.length ? t[s].from : e));
          } else if (j[c] == 256) c++;
          else break;
        let f = r == 1,
          u = (c < e ? j[c] : i) == 1,
          d = f == u ? (f ? 1 : 2) : i;
        for (let p = c, m = s, g = m ? t[m - 1].to : n; p > a; )
          (p == g && ((p = t[--m].from), (g = m ? t[m - 1].to : n)),
            (j[--p] = d));
        a = c;
      } else ((r = h), a++);
    }
  }
}
function kr(n, e, t, i, s, r, o) {
  let l = i % 2 ? 2 : 1;
  if (i % 2 == s % 2)
    for (let a = e, h = 0; a < t; ) {
      let c = !0,
        f = !1;
      if (h == r.length || a < r[h].from) {
        let m = j[a];
        m != l && ((c = !1), (f = m == 16));
      }
      let u = !c && l == 1 ? [] : null,
        d = c ? i : i + 1,
        p = a;
      e: for (;;)
        if (h < r.length && p == r[h].from) {
          if (f) break e;
          let m = r[h];
          if (!c)
            for (let g = m.to, b = h + 1; ; ) {
              if (g == t) break e;
              if (b < r.length && r[b].from == g) g = r[b++].to;
              else {
                if (j[g] == l) break e;
                break;
              }
            }
          if ((h++, u)) u.push(m);
          else {
            m.from > a && o.push(new it(a, m.from, d));
            let g = (m.direction == zt) != !(d % 2);
            (Sr(n, g ? i + 1 : i, s, m.inner, m.from, m.to, o), (a = m.to));
          }
          p = m.to;
        } else {
          if (p == t || (c ? j[p] != l : j[p] == l)) break;
          p++;
        }
      (u ? kr(n, a, p, i + 1, s, u, o) : a < p && o.push(new it(a, p, d)),
        (a = p));
    }
  else
    for (let a = t, h = r.length; a > e; ) {
      let c = !0,
        f = !1;
      if (!h || a > r[h - 1].to) {
        let m = j[a - 1];
        m != l && ((c = !1), (f = m == 16));
      }
      let u = !c && l == 1 ? [] : null,
        d = c ? i : i + 1,
        p = a;
      e: for (;;)
        if (h && p == r[h - 1].to) {
          if (f) break e;
          let m = r[--h];
          if (!c)
            for (let g = m.from, b = h; ; ) {
              if (g == e) break e;
              if (b && r[b - 1].to == g) g = r[--b].from;
              else {
                if (j[g - 1] == l) break e;
                break;
              }
            }
          if (u) u.push(m);
          else {
            m.to < a && o.push(new it(m.to, a, d));
            let g = (m.direction == zt) != !(d % 2);
            (Sr(n, g ? i + 1 : i, s, m.inner, m.from, m.to, o), (a = m.from));
          }
          p = m.from;
        } else {
          if (p == e || (c ? j[p - 1] != l : j[p - 1] == l)) break;
          p--;
        }
      (u ? kr(n, p, a, i + 1, s, u, o) : p < a && o.push(new it(p, a, d)),
        (a = p));
    }
}
function Sr(n, e, t, i, s, r, o) {
  let l = e % 2 ? 2 : 1;
  (Nu(n, s, r, i, l),
    Wu(n, s, r, i, l),
    Fu(s, r, i, l),
    kr(n, s, r, e, t, i, o));
}
function Hu(n, e, t) {
  if (!n) return [new it(0, 0, e == no ? 1 : 0)];
  if (e == zt && !t.length && !Iu.test(n)) return kh(n.length);
  if (t.length) for (; n.length > j.length; ) j[j.length] = 256;
  let i = [],
    s = e == zt ? 0 : 1;
  return (Sr(n, s, s, t, 0, n.length, i), i);
}
function kh(n) {
  return [new it(0, n, 0)];
}
let Sh = "";
function Vu(n, e, t, i, s) {
  var r;
  let o = i.head - n.from,
    l = it.find(
      e,
      o,
      (r = i.bidiLevel) !== null && r !== void 0 ? r : -1,
      i.assoc,
    ),
    a = e[l],
    h = a.side(s, t);
  if (o == h) {
    let u = (l += s ? 1 : -1);
    if (u < 0 || u >= e.length) return null;
    ((a = e[(l = u)]), (o = a.side(!s, t)), (h = a.side(s, t)));
  }
  let c = he(n.text, o, a.forward(s, t));
  ((c < a.from || c > a.to) && (c = h),
    (Sh = n.text.slice(Math.min(o, c), Math.max(o, c))));
  let f = l == (s ? e.length - 1 : 0) ? null : e[l + (s ? 1 : -1)];
  return f && c == h && f.level + (s ? 0 : 1) < a.level
    ? x.cursor(f.side(!s, t) + n.from, f.forward(s, t) ? 1 : -1, f.level)
    : x.cursor(c + n.from, a.forward(s, t) ? -1 : 1, a.level);
}
function zu(n, e, t) {
  for (let i = e; i < t; i++) {
    let s = wh(n.charCodeAt(i));
    if (s == 1) return zt;
    if (s == 2 || s == 4) return no;
  }
  return zt;
}
const Ch = D.define(),
  Ah = D.define(),
  Mh = D.define(),
  Th = D.define(),
  Cr = D.define(),
  Dh = D.define(),
  Oh = D.define(),
  so = D.define(),
  ro = D.define(),
  Bh = D.define({ combine: (n) => n.some((e) => e) }),
  Eh = D.define({ combine: (n) => n.some((e) => e) }),
  Lh = D.define();
class ti {
  constructor(e, t = "nearest", i = "nearest", s = 5, r = 5, o = !1) {
    ((this.range = e),
      (this.y = t),
      (this.x = i),
      (this.yMargin = s),
      (this.xMargin = r),
      (this.isSnapshot = o));
  }
  map(e) {
    return e.empty
      ? this
      : new ti(
          this.range.map(e),
          this.y,
          this.x,
          this.yMargin,
          this.xMargin,
          this.isSnapshot,
        );
  }
  clip(e) {
    return this.range.to <= e.doc.length
      ? this
      : new ti(
          x.cursor(e.doc.length),
          this.y,
          this.x,
          this.yMargin,
          this.xMargin,
          this.isSnapshot,
        );
  }
}
const dn = R.define({ map: (n, e) => n.map(e) }),
  Ph = R.define();
function De(n, e, t) {
  let i = n.facet(Th);
  i.length
    ? i[0](e)
    : (window.onerror && window.onerror(String(e), t, void 0, void 0, e)) ||
      (t ? console.error(t + ":", e) : console.error(e));
}
const ht = D.define({ combine: (n) => (n.length ? n[0] : !0) });
let _u = 0;
const Jt = D.define({
  combine(n) {
    return n.filter((e, t) => {
      for (let i = 0; i < t; i++) if (n[i].plugin == e.plugin) return !1;
      return !0;
    });
  },
});
class ne {
  constructor(e, t, i, s, r) {
    ((this.id = e),
      (this.create = t),
      (this.domEventHandlers = i),
      (this.domEventObservers = s),
      (this.baseExtensions = r(this)),
      (this.extension = this.baseExtensions.concat(
        Jt.of({ plugin: this, arg: void 0 }),
      )));
  }
  of(e) {
    return this.baseExtensions.concat(Jt.of({ plugin: this, arg: e }));
  }
  static define(e, t) {
    const {
      eventHandlers: i,
      eventObservers: s,
      provide: r,
      decorations: o,
    } = t || {};
    return new ne(_u++, e, i, s, (l) => {
      let a = [];
      return (
        o &&
          a.push(
            ds.of((h) => {
              let c = h.plugin(l);
              return c ? o(c) : L.none;
            }),
          ),
        r && a.push(r(l)),
        a
      );
    });
  }
  static fromClass(e, t) {
    return ne.define((i, s) => new e(i, s), t);
  }
}
class Os {
  constructor(e) {
    ((this.spec = e), (this.mustUpdate = null), (this.value = null));
  }
  get plugin() {
    return this.spec && this.spec.plugin;
  }
  update(e) {
    if (this.value) {
      if (this.mustUpdate) {
        let t = this.mustUpdate;
        if (((this.mustUpdate = null), this.value.update))
          try {
            this.value.update(t);
          } catch (i) {
            if (
              (De(t.state, i, "CodeMirror plugin crashed"), this.value.destroy)
            )
              try {
                this.value.destroy();
              } catch {}
            this.deactivate();
          }
      }
    } else if (this.spec)
      try {
        this.value = this.spec.plugin.create(e, this.spec.arg);
      } catch (t) {
        (De(e.state, t, "CodeMirror plugin crashed"), this.deactivate());
      }
    return this;
  }
  destroy(e) {
    var t;
    if (!((t = this.value) === null || t === void 0) && t.destroy)
      try {
        this.value.destroy();
      } catch (i) {
        De(e.state, i, "CodeMirror plugin crashed");
      }
  }
  deactivate() {
    this.spec = this.value = null;
  }
}
const Rh = D.define(),
  oo = D.define(),
  ds = D.define(),
  Ih = D.define(),
  lo = D.define(),
  en = D.define(),
  Nh = D.define();
function ol(n, e) {
  let t = n.state.facet(Nh);
  if (!t.length) return t;
  let i = t.map((r) => (r instanceof Function ? r(n) : r)),
    s = [];
  return (
    z.spans(i, e.from, e.to, {
      point() {},
      span(r, o, l, a) {
        let h = r - e.from,
          c = o - e.from,
          f = s;
        for (let u = l.length - 1; u >= 0; u--, a--) {
          let d = l[u].spec.bidiIsolate,
            p;
          if (
            (d == null && (d = zu(e.text, h, c)),
            a > 0 &&
              f.length &&
              (p = f[f.length - 1]).to == h &&
              p.direction == d)
          )
            ((p.to = c), (f = p.inner));
          else {
            let m = { from: h, to: c, direction: d, inner: [] };
            (f.push(m), (f = m.inner));
          }
        }
      },
    }),
    s
  );
}
const Wh = D.define();
function ao(n) {
  let e = 0,
    t = 0,
    i = 0,
    s = 0;
  for (let r of n.state.facet(Wh)) {
    let o = r(n);
    o &&
      (o.left != null && (e = Math.max(e, o.left)),
      o.right != null && (t = Math.max(t, o.right)),
      o.top != null && (i = Math.max(i, o.top)),
      o.bottom != null && (s = Math.max(s, o.bottom)));
  }
  return { left: e, right: t, top: i, bottom: s };
}
const ki = D.define();
class Ne {
  constructor(e, t, i, s) {
    ((this.fromA = e), (this.toA = t), (this.fromB = i), (this.toB = s));
  }
  join(e) {
    return new Ne(
      Math.min(this.fromA, e.fromA),
      Math.max(this.toA, e.toA),
      Math.min(this.fromB, e.fromB),
      Math.max(this.toB, e.toB),
    );
  }
  addToSet(e) {
    let t = e.length,
      i = this;
    for (; t > 0; t--) {
      let s = e[t - 1];
      if (!(s.fromA > i.toA)) {
        if (s.toA < i.fromA) break;
        ((i = i.join(s)), e.splice(t - 1, 1));
      }
    }
    return (e.splice(t, 0, i), e);
  }
  static extendWithRanges(e, t) {
    if (t.length == 0) return e;
    let i = [];
    for (let s = 0, r = 0, o = 0; ; ) {
      let l = s < e.length ? e[s].fromB : 1e9,
        a = r < t.length ? t[r] : 1e9,
        h = Math.min(l, a);
      if (h == 1e9) break;
      let c = h + o,
        f = h,
        u = c;
      for (;;)
        if (r < t.length && t[r] <= f) {
          let d = t[r + 1];
          ((r += 2), (f = Math.max(f, d)));
          for (let p = s; p < e.length && e[p].fromB <= f; p++)
            o = e[p].toA - e[p].toB;
          u = Math.max(u, d + o);
        } else if (s < e.length && e[s].fromB <= f) {
          let d = e[s++];
          ((f = Math.max(f, d.toB)),
            (u = Math.max(u, d.toA)),
            (o = d.toA - d.toB));
        } else break;
      i.push(new Ne(c, u, h, f));
    }
    return i;
  }
}
class jn {
  constructor(e, t, i) {
    ((this.view = e),
      (this.state = t),
      (this.transactions = i),
      (this.flags = 0),
      (this.startState = e.state),
      (this.changes = le.empty(this.startState.doc.length)));
    for (let r of i) this.changes = this.changes.compose(r.changes);
    let s = [];
    (this.changes.iterChangedRanges((r, o, l, a) => s.push(new Ne(r, o, l, a))),
      (this.changedRanges = s));
  }
  static create(e, t, i) {
    return new jn(e, t, i);
  }
  get viewportChanged() {
    return (this.flags & 4) > 0;
  }
  get viewportMoved() {
    return (this.flags & 8) > 0;
  }
  get heightChanged() {
    return (this.flags & 2) > 0;
  }
  get geometryChanged() {
    return this.docChanged || (this.flags & 18) > 0;
  }
  get focusChanged() {
    return (this.flags & 1) > 0;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get selectionSet() {
    return this.transactions.some((e) => e.selection);
  }
  get empty() {
    return this.flags == 0 && this.transactions.length == 0;
  }
}
const qu = [];
class ie {
  constructor(e, t, i = 0) {
    ((this.dom = e),
      (this.length = t),
      (this.flags = i),
      (this.parent = null),
      (e.cmTile = this));
  }
  get breakAfter() {
    return this.flags & 1;
  }
  get children() {
    return qu;
  }
  isWidget() {
    return !1;
  }
  get isHidden() {
    return !1;
  }
  isComposite() {
    return !1;
  }
  isLine() {
    return !1;
  }
  isText() {
    return !1;
  }
  isBlock() {
    return !1;
  }
  get domAttrs() {
    return null;
  }
  sync(e) {
    if (((this.flags |= 2), this.flags & 4)) {
      this.flags &= -5;
      let t = this.domAttrs;
      t && Au(this.dom, t);
    }
  }
  toString() {
    return (
      this.constructor.name +
      (this.children.length ? `(${this.children})` : "") +
      (this.breakAfter ? "#" : "")
    );
  }
  destroy() {
    this.parent = null;
  }
  setDOM(e) {
    ((this.dom = e), (e.cmTile = this));
  }
  get posAtStart() {
    return this.parent ? this.parent.posBefore(this) : 0;
  }
  get posAtEnd() {
    return this.posAtStart + this.length;
  }
  posBefore(e, t = this.posAtStart) {
    let i = t;
    for (let s of this.children) {
      if (s == e) return i;
      i += s.length + s.breakAfter;
    }
    throw new RangeError("Invalid child in posBefore");
  }
  posAfter(e) {
    return this.posBefore(e) + e.length;
  }
  covers(e) {
    return !0;
  }
  coordsIn(e, t) {
    return null;
  }
  domPosFor(e, t) {
    let i = Ct(this.dom),
      s = this.length ? e > 0 : t > 0;
    return new qe(this.parent.dom, i + (s ? 1 : 0), e == 0 || e == this.length);
  }
  markDirty(e) {
    ((this.flags &= -3),
      e && (this.flags |= 4),
      this.parent && this.parent.flags & 2 && this.parent.markDirty(!1));
  }
  get overrideDOMText() {
    return null;
  }
  get root() {
    for (let e = this; e; e = e.parent) if (e instanceof ms) return e;
    return null;
  }
  static get(e) {
    return e.cmTile;
  }
}
class ps extends ie {
  constructor(e) {
    (super(e, 0), (this._children = []));
  }
  isComposite() {
    return !0;
  }
  get children() {
    return this._children;
  }
  get lastChild() {
    return this.children.length
      ? this.children[this.children.length - 1]
      : null;
  }
  append(e) {
    (this.children.push(e), (e.parent = this));
  }
  sync(e) {
    if (this.flags & 2) return;
    super.sync(e);
    let t = this.dom,
      i = null,
      s,
      r = e?.node == t ? e : null,
      o = 0;
    for (let l of this.children) {
      if (
        (l.sync(e),
        (o += l.length + l.breakAfter),
        (s = i ? i.nextSibling : t.firstChild),
        r && s != l.dom && (r.written = !0),
        l.dom.parentNode == t)
      )
        for (; s && s != l.dom; ) s = ll(s);
      else t.insertBefore(l.dom, s);
      i = l.dom;
    }
    for (s = i ? i.nextSibling : t.firstChild, r && s && (r.written = !0); s; )
      s = ll(s);
    this.length = o;
  }
}
function ll(n) {
  let e = n.nextSibling;
  return (n.parentNode.removeChild(n), e);
}
class ms extends ps {
  constructor(e, t) {
    (super(t), (this.view = e));
  }
  owns(e) {
    for (; e; e = e.parent) if (e == this) return !0;
    return !1;
  }
  isBlock() {
    return !0;
  }
  nearest(e) {
    for (;;) {
      if (!e) return null;
      let t = ie.get(e);
      if (t && this.owns(t)) return t;
      e = e.parentNode;
    }
  }
  blockTiles(e) {
    for (let t = [], i = this, s = 0, r = 0; ; )
      if (s == i.children.length) {
        if (!t.length) return;
        ((i = i.parent), i.breakAfter && r++, (s = t.pop()));
      } else {
        let o = i.children[s++];
        if (o instanceof ct) (t.push(s), (i = o), (s = 0));
        else {
          let l = r + o.length,
            a = e(o, r);
          if (a !== void 0) return a;
          r = l + o.breakAfter;
        }
      }
  }
  resolveBlock(e, t) {
    let i,
      s = -1,
      r,
      o = -1;
    if (
      (this.blockTiles((l, a) => {
        let h = a + l.length;
        if (e >= a && e <= h) {
          if (l.isWidget() && t >= -1 && t <= 1) {
            if (l.flags & 32) return !0;
            l.flags & 16 && (i = void 0);
          }
          ((a < e || (e == h && (t < -1 ? l.length : l.covers(1)))) &&
            (!i || (!l.isWidget() && i.isWidget())) &&
            ((i = l), (s = e - a)),
            (h > e || (e == a && (t > 1 ? l.length : l.covers(-1)))) &&
              (!r || (!l.isWidget() && r.isWidget())) &&
              ((r = l), (o = e - a)));
        }
      }),
      !i && !r)
    )
      throw new Error("No tile at position " + e);
    return (i && t < 0) || !r ? { tile: i, offset: s } : { tile: r, offset: o };
  }
}
class ct extends ps {
  constructor(e, t) {
    (super(e), (this.wrapper = t));
  }
  isBlock() {
    return !0;
  }
  covers(e) {
    return this.children.length
      ? e < 0
        ? this.children[0].covers(-1)
        : this.lastChild.covers(1)
      : !1;
  }
  get domAttrs() {
    return this.wrapper.attributes;
  }
  static of(e, t) {
    let i = new ct(t || document.createElement(e.tagName), e);
    return (t || (i.flags |= 4), i);
  }
}
class oi extends ps {
  constructor(e, t) {
    (super(e), (this.attrs = t));
  }
  isLine() {
    return !0;
  }
  static start(e, t, i) {
    let s = new oi(t || document.createElement("div"), e);
    return ((!t || !i) && (s.flags |= 4), s);
  }
  get domAttrs() {
    return this.attrs;
  }
  resolveInline(e, t, i) {
    let s = null,
      r = -1,
      o = null,
      l = -1;
    function a(c, f) {
      for (let u = 0, d = 0; u < c.children.length && d <= f; u++) {
        let p = c.children[u],
          m = d + p.length;
        (m >= f &&
          (p.isComposite()
            ? a(p, f - d)
            : (!o || (o.isHidden && (t > 0 || (i && Ku(o, p))))) &&
                (m > f || p.flags & 32)
              ? ((o = p), (l = f - d))
              : (d < f || (p.flags & 16 && !p.isHidden)) &&
                ((s = p), (r = f - d))),
          (d = m));
      }
    }
    a(this, e);
    let h = (t < 0 ? s : o) || s || o;
    return h ? { tile: h, offset: h == s ? r : l } : null;
  }
  coordsIn(e, t) {
    let i = this.resolveInline(e, t, !0);
    return i ? i.tile.coordsIn(Math.max(0, i.offset), t) : $u(this);
  }
  domIn(e, t) {
    let i = this.resolveInline(e, t);
    if (i) {
      let { tile: s, offset: r } = i;
      if (this.dom.contains(s.dom))
        return s.isText()
          ? new qe(s.dom, Math.min(s.dom.nodeValue.length, r))
          : s.domPosFor(r, s.flags & 16 ? 1 : s.flags & 32 ? -1 : t);
      let o = i.tile.parent,
        l = !1;
      for (let a of o.children) {
        if (l) return new qe(a.dom, 0);
        a == i.tile && (l = !0);
      }
    }
    return new qe(this.dom, 0);
  }
}
function $u(n) {
  let e = n.dom.lastChild;
  if (!e) return n.dom.getBoundingClientRect();
  let t = Di(e);
  return t[t.length - 1] || null;
}
function Ku(n, e) {
  let t = n.coordsIn(0, 1),
    i = e.coordsIn(0, 1);
  return t && i && i.top < t.bottom;
}
class Te extends ps {
  constructor(e, t) {
    (super(e), (this.mark = t));
  }
  get domAttrs() {
    return this.mark.attrs;
  }
  static of(e, t) {
    let i = new Te(t || document.createElement(e.tagName), e);
    return (t || (i.flags |= 4), i);
  }
}
class Nt extends ie {
  constructor(e, t) {
    (super(e, t.length), (this.text = t));
  }
  sync(e) {
    this.flags & 2 ||
      (super.sync(e),
      this.dom.nodeValue != this.text &&
        (e && e.node == this.dom && (e.written = !0),
        (this.dom.nodeValue = this.text)));
  }
  isText() {
    return !0;
  }
  toString() {
    return JSON.stringify(this.text);
  }
  coordsIn(e, t) {
    let i = this.dom.nodeValue.length;
    e > i && (e = i);
    let s = e,
      r = e,
      o = 0;
    (e == 0 && t < 0) || (e == i && t >= 0)
      ? O.chrome || O.gecko || (e ? (s--, (o = 1)) : r < i && (r++, (o = -1)))
      : t < 0
        ? s--
        : r < i && r++;
    let l = Fi(this.dom, s, r).getClientRects();
    if (!l.length) return null;
    let a = l[(o ? o < 0 : t >= 0) ? 0 : l.length - 1];
    return (
      O.safari &&
        !o &&
        a.width == 0 &&
        (a = Array.prototype.find.call(l, (h) => h.width) || a),
      o ? Wi(a, o < 0) : a || null
    );
  }
  static of(e, t) {
    let i = new Nt(t || document.createTextNode(e), e);
    return (t || (i.flags |= 2), i);
  }
}
class _t extends ie {
  constructor(e, t, i, s) {
    (super(e, t, s), (this.widget = i));
  }
  isWidget() {
    return !0;
  }
  get isHidden() {
    return this.widget.isHidden;
  }
  covers(e) {
    return this.flags & 48 ? !1 : (this.flags & (e < 0 ? 64 : 128)) > 0;
  }
  coordsIn(e, t) {
    return this.coordsInWidget(e, t, !1);
  }
  coordsInWidget(e, t, i) {
    let s = this.widget.coordsAt(this.dom, e, t);
    if (s) return s;
    if (i)
      return Wi(
        this.dom.getBoundingClientRect(),
        this.length ? e == 0 : t <= 0,
      );
    {
      let r = this.dom.getClientRects(),
        o = null;
      if (!r.length) return null;
      let l = this.flags & 16 ? !0 : this.flags & 32 ? !1 : e > 0;
      for (
        let a = l ? r.length - 1 : 0;
        (o = r[a]), !(e > 0 ? a == 0 : a == r.length - 1 || o.top < o.bottom);
        a += l ? -1 : 1
      );
      return Wi(o, !l);
    }
  }
  get overrideDOMText() {
    if (!this.length) return q.empty;
    let { root: e } = this;
    if (!e) return q.empty;
    let t = this.posAtStart;
    return e.view.state.doc.slice(t, t + this.length);
  }
  destroy() {
    (super.destroy(), this.widget.destroy(this.dom));
  }
  static of(e, t, i, s, r) {
    return (
      r || ((r = e.toDOM(t)), e.editable || (r.contentEditable = "false")),
      new _t(r, i, e, s)
    );
  }
}
class Un extends ie {
  constructor(e) {
    let t = document.createElement("img");
    ((t.className = "cm-widgetBuffer"),
      t.setAttribute("aria-hidden", "true"),
      super(t, 0, e));
  }
  get isHidden() {
    return !0;
  }
  get overrideDOMText() {
    return q.empty;
  }
  coordsIn(e) {
    return this.dom.getBoundingClientRect();
  }
}
class ju {
  constructor(e) {
    ((this.index = 0),
      (this.beforeBreak = !1),
      (this.parents = []),
      (this.tile = e));
  }
  advance(e, t, i) {
    let { tile: s, index: r, beforeBreak: o, parents: l } = this;
    for (; e || t > 0; )
      if (s.isComposite())
        if (o) {
          if (!e) break;
          (i && i.break(), e--, (o = !1));
        } else if (r == s.children.length) {
          if (!e && !l.length) break;
          (i && i.leave(s),
            (o = !!s.breakAfter),
            ({ tile: s, index: r } = l.pop()),
            r++);
        } else {
          let a = s.children[r],
            h = a.breakAfter;
          (t > 0 ? a.length <= e : a.length < e) &&
          (!i || i.skip(a, 0, a.length) !== !1 || !a.isComposite)
            ? ((o = !!h), r++, (e -= a.length))
            : (l.push({ tile: s, index: r }),
              (s = a),
              (r = 0),
              i && a.isComposite() && i.enter(a));
        }
      else if (r == s.length)
        ((o = !!s.breakAfter), ({ tile: s, index: r } = l.pop()), r++);
      else if (e) {
        let a = Math.min(e, s.length - r);
        (i && i.skip(s, r, r + a), (e -= a), (r += a));
      } else break;
    return ((this.tile = s), (this.index = r), (this.beforeBreak = o), this);
  }
  get root() {
    return this.parents.length ? this.parents[0].tile : this.tile;
  }
}
class Uu {
  constructor(e, t, i, s) {
    ((this.from = e), (this.to = t), (this.wrapper = i), (this.rank = s));
  }
}
class Gu {
  constructor(e, t, i) {
    ((this.cache = e),
      (this.root = t),
      (this.blockWrappers = i),
      (this.curLine = null),
      (this.lastBlock = null),
      (this.afterWidget = null),
      (this.pos = 0),
      (this.wrappers = []),
      (this.wrapperPos = 0));
  }
  addText(e, t, i, s) {
    var r;
    this.flushBuffer();
    let o = this.ensureMarks(t, i),
      l = o.lastChild;
    if (l && l.isText() && !(l.flags & 8) && l.length + e.length < 512) {
      this.cache.reused.set(l, 2);
      let a = (o.children[o.children.length - 1] = new Nt(l.dom, l.text + e));
      a.parent = o;
    } else
      o.append(
        s ||
          Nt.of(
            e,
            (r = this.cache.find(Nt)) === null || r === void 0 ? void 0 : r.dom,
          ),
      );
    ((this.pos += e.length), (this.afterWidget = null));
  }
  addComposition(e, t) {
    let i = this.curLine;
    i.dom != t.line.dom &&
      (i.setDOM(this.cache.reused.has(t.line) ? Bs(t.line.dom) : t.line.dom),
      this.cache.reused.set(t.line, 2));
    let s = i;
    for (let l = t.marks.length - 1; l >= 0; l--) {
      let a = t.marks[l],
        h = s.lastChild;
      if (h instanceof Te && h.mark.eq(a.mark))
        (h.dom != a.dom && h.setDOM(Bs(a.dom)), (s = h));
      else {
        if (this.cache.reused.get(a)) {
          let f = ie.get(a.dom);
          f && f.setDOM(Bs(a.dom));
        }
        let c = Te.of(a.mark, a.dom);
        (s.append(c), (s = c));
      }
      this.cache.reused.set(a, 2);
    }
    let r = ie.get(e.text);
    r && this.cache.reused.set(r, 2);
    let o = new Nt(e.text, e.text.nodeValue);
    ((o.flags |= 8), s.append(o));
  }
  addInlineWidget(e, t, i) {
    let s =
      this.afterWidget &&
      e.flags & 48 &&
      (this.afterWidget.flags & 48) == (e.flags & 48);
    s || this.flushBuffer();
    let r = this.ensureMarks(t, i);
    (!s && !(e.flags & 16) && r.append(this.getBuffer(1)),
      r.append(e),
      (this.pos += e.length),
      (this.afterWidget = e));
  }
  addMark(e, t, i) {
    (this.flushBuffer(),
      this.ensureMarks(t, i).append(e),
      (this.pos += e.length),
      (this.afterWidget = null));
  }
  addBlockWidget(e) {
    (this.getBlockPos().append(e),
      (this.pos += e.length),
      (this.lastBlock = e),
      this.endLine());
  }
  continueWidget(e) {
    let t = this.afterWidget || this.lastBlock;
    ((t.length += e), (this.pos += e));
  }
  addLineStart(e, t) {
    var i;
    e || (e = Fh);
    let s = oi.start(
      e,
      t ||
        ((i = this.cache.find(oi)) === null || i === void 0 ? void 0 : i.dom),
      !!t,
    );
    this.getBlockPos().append((this.lastBlock = this.curLine = s));
  }
  addLine(e) {
    (this.getBlockPos().append(e),
      (this.pos += e.length),
      (this.lastBlock = e),
      this.endLine());
  }
  addBreak() {
    ((this.lastBlock.flags |= 1), this.endLine(), this.pos++);
  }
  addLineStartIfNotCovered(e) {
    this.blockPosCovered() || this.addLineStart(e);
  }
  ensureLine(e) {
    this.curLine || this.addLineStart(e);
  }
  ensureMarks(e, t) {
    var i;
    let s = this.curLine;
    for (let r = e.length - 1; r >= 0; r--) {
      let o = e[r],
        l;
      if (t > 0 && (l = s.lastChild) && l instanceof Te && l.mark.eq(o))
        ((s = l), t--);
      else {
        let a = Te.of(
          o,
          (i = this.cache.find(Te, (h) => h.mark.eq(o))) === null ||
            i === void 0
            ? void 0
            : i.dom,
        );
        (s.append(a), (s = a), (t = 0));
      }
    }
    return s;
  }
  endLine() {
    if (this.curLine) {
      this.flushBuffer();
      let e = this.curLine.lastChild;
      ((!e ||
        !al(this.curLine, !1) ||
        (e.dom.nodeName != "BR" &&
          e.isWidget() &&
          !(O.ios && al(this.curLine, !0)))) &&
        this.curLine.append(
          this.cache.findWidget(Es, 0, 32) || new _t(Es.toDOM(), 0, Es, 32),
        ),
        (this.curLine = this.afterWidget = null));
    }
  }
  updateBlockWrappers() {
    this.wrapperPos > this.pos + 1e4 &&
      (this.blockWrappers.goto(this.pos), (this.wrappers.length = 0));
    for (let e = this.wrappers.length - 1; e >= 0; e--)
      this.wrappers[e].to < this.pos && this.wrappers.splice(e, 1);
    for (let e = this.blockWrappers; e.value && e.from <= this.pos; e.next())
      if (e.to >= this.pos) {
        let t = new Uu(e.from, e.to, e.value, e.rank),
          i = this.wrappers.length;
        for (
          ;
          i > 0 &&
          (this.wrappers[i - 1].rank - t.rank ||
            this.wrappers[i - 1].to - t.to) < 0;
        )
          i--;
        this.wrappers.splice(i, 0, t);
      }
    this.wrapperPos = this.pos;
  }
  getBlockPos() {
    var e;
    this.updateBlockWrappers();
    let t = this.root;
    for (let i of this.wrappers) {
      let s = t.lastChild;
      if (i.from < this.pos && s instanceof ct && s.wrapper.eq(i.wrapper))
        t = s;
      else {
        let r = ct.of(
          i.wrapper,
          (e = this.cache.find(ct, (o) => o.wrapper.eq(i.wrapper))) === null ||
            e === void 0
            ? void 0
            : e.dom,
        );
        (t.append(r), (t = r));
      }
    }
    return t;
  }
  blockPosCovered() {
    let e = this.lastBlock;
    return e != null && !e.breakAfter && (!e.isWidget() || (e.flags & 160) > 0);
  }
  getBuffer(e) {
    let t = 2 | (e < 0 ? 16 : 32),
      i = this.cache.find(Un, void 0, 1);
    return (i && (i.flags = t), i || new Un(t));
  }
  flushBuffer() {
    this.afterWidget &&
      !(this.afterWidget.flags & 32) &&
      (this.afterWidget.parent.append(this.getBuffer(-1)),
      (this.afterWidget = null));
  }
}
class Ju {
  constructor(e) {
    ((this.skipCount = 0),
      (this.text = ""),
      (this.textOff = 0),
      (this.cursor = e.iter()));
  }
  skip(e) {
    this.textOff + e <= this.text.length
      ? (this.textOff += e)
      : ((this.skipCount += e - (this.text.length - this.textOff)),
        (this.text = ""),
        (this.textOff = 0));
  }
  next(e) {
    if (this.textOff == this.text.length) {
      let {
        value: s,
        lineBreak: r,
        done: o,
      } = this.cursor.next(this.skipCount);
      if (((this.skipCount = 0), o))
        throw new Error("Ran out of text content when drawing inline views");
      this.text = s;
      let l = (this.textOff = Math.min(e, s.length));
      return r ? null : s.slice(0, l);
    }
    let t = Math.min(this.text.length, this.textOff + e),
      i = this.text.slice(this.textOff, t);
    return ((this.textOff = t), i);
  }
}
const Gn = [_t, oi, Nt, Te, Un, ct, ms];
for (let n = 0; n < Gn.length; n++) Gn[n].bucket = n;
class Yu {
  constructor(e) {
    ((this.view = e),
      (this.buckets = Gn.map(() => [])),
      (this.index = Gn.map(() => 0)),
      (this.reused = new Map()));
  }
  add(e) {
    let t = e.constructor.bucket,
      i = this.buckets[t];
    i.length < 6
      ? i.push(e)
      : (i[(this.index[t] = (this.index[t] + 1) % 6)] = e);
  }
  find(e, t, i = 2) {
    let s = e.bucket,
      r = this.buckets[s],
      o = this.index[s];
    for (let l = r.length - 1; l >= 0; l--) {
      let a = (l + o) % r.length,
        h = r[a];
      if ((!t || t(h)) && !this.reused.has(h))
        return (
          r.splice(a, 1),
          a < o && this.index[s]--,
          this.reused.set(h, i),
          h
        );
    }
    return null;
  }
  findWidget(e, t, i) {
    let s = this.buckets[0];
    if (s.length)
      for (let r = 0, o = 0; ; r++) {
        if (r == s.length) {
          if (o) return null;
          ((o = 1), (r = 0));
        }
        let l = s[r];
        if (
          !this.reused.has(l) &&
          (o == 0
            ? l.widget.compare(e)
            : l.widget.constructor == e.constructor &&
              e.updateDOM(l.dom, this.view))
        )
          return (
            s.splice(r, 1),
            r < this.index[0] && this.index[0]--,
            l.widget == e && l.length == t && (l.flags & 497) == i
              ? (this.reused.set(l, 1), l)
              : (this.reused.set(l, 2),
                new _t(l.dom, t, e, (l.flags & -498) | i))
          );
      }
  }
  reuse(e) {
    return (this.reused.set(e, 1), e);
  }
  maybeReuse(e, t = 2) {
    if (!this.reused.has(e)) return (this.reused.set(e, t), e.dom);
  }
  clear() {
    for (let e = 0; e < this.buckets.length; e++)
      this.buckets[e].length = this.index[e] = 0;
  }
}
class Xu {
  constructor(e, t, i, s, r) {
    ((this.view = e),
      (this.decorations = s),
      (this.disallowBlockEffectsFor = r),
      (this.openWidget = !1),
      (this.openMarks = 0),
      (this.cache = new Yu(e)),
      (this.text = new Ju(e.state.doc)),
      (this.builder = new Gu(this.cache, new ms(e, e.contentDOM), z.iter(i))),
      this.cache.reused.set(t, 2),
      (this.old = new ju(t)),
      (this.reuseWalker = {
        skip: (o, l, a) => {
          if ((this.cache.add(o), o.isComposite())) return !1;
        },
        enter: (o) => this.cache.add(o),
        leave: () => {},
        break: () => {},
      }));
  }
  run(e, t) {
    let i = t && this.getCompositionContext(t.text);
    for (let s = 0, r = 0, o = 0; ; ) {
      let l = o < e.length ? e[o++] : null,
        a = l ? l.fromA : this.old.root.length;
      if (a > s) {
        let h = a - s;
        (this.preserve(h, !o, !l), (s = a), (r += h));
      }
      if (!l) break;
      (t && l.fromA <= t.range.fromA && l.toA >= t.range.toA
        ? (this.forward(
            l.fromA,
            t.range.fromA,
            t.range.fromA < t.range.toA ? 1 : -1,
          ),
          this.emit(r, t.range.fromB),
          this.cache.clear(),
          this.builder.addComposition(t, i),
          this.text.skip(t.range.toB - t.range.fromB),
          this.forward(t.range.fromA, l.toA),
          this.emit(t.range.toB, l.toB))
        : (this.forward(l.fromA, l.toA), this.emit(r, l.toB)),
        (r = l.toB),
        (s = l.toA));
    }
    return (this.builder.curLine && this.builder.endLine(), this.builder.root);
  }
  preserve(e, t, i) {
    let s = ed(this.old),
      r = this.openMarks;
    (this.old.advance(e, i ? 1 : -1, {
      skip: (o, l, a) => {
        if (o.isWidget())
          if (this.openWidget) this.builder.continueWidget(a - l);
          else {
            let h =
              a > 0 || l < o.length
                ? _t.of(
                    o.widget,
                    this.view,
                    a - l,
                    o.flags & 496,
                    this.cache.maybeReuse(o),
                  )
                : this.cache.reuse(o);
            h.flags & 256
              ? ((h.flags &= -2), this.builder.addBlockWidget(h))
              : (this.builder.ensureLine(null),
                this.builder.addInlineWidget(h, s, r),
                (r = s.length));
          }
        else if (o.isText())
          (this.builder.ensureLine(null),
            !l && a == o.length && !this.cache.reused.has(o)
              ? this.builder.addText(o.text, s, r, this.cache.reuse(o))
              : (this.cache.add(o),
                this.builder.addText(o.text.slice(l, a), s, r)),
            (r = s.length));
        else if (o.isLine())
          ((o.flags &= -2),
            this.cache.reused.set(o, 1),
            this.builder.addLine(o));
        else if (o instanceof Un) this.cache.add(o);
        else if (o instanceof Te)
          (this.builder.ensureLine(null),
            this.builder.addMark(o, s, r),
            this.cache.reused.set(o, 1),
            (r = s.length));
        else return !1;
        this.openWidget = !1;
      },
      enter: (o) => {
        (o.isLine()
          ? this.builder.addLineStart(o.attrs, this.cache.maybeReuse(o))
          : (this.cache.add(o), o instanceof Te && s.unshift(o.mark)),
          (this.openWidget = !1));
      },
      leave: (o) => {
        o.isLine()
          ? s.length && (s.length = r = 0)
          : o instanceof Te && (s.shift(), (r = Math.min(r, s.length)));
      },
      break: () => {
        (this.builder.addBreak(), (this.openWidget = !1));
      },
    }),
      this.text.skip(e));
  }
  emit(e, t) {
    let i = null,
      s = this.builder,
      r = 0,
      o = z.spans(this.decorations, e, t, {
        point: (l, a, h, c, f, u) => {
          if (h instanceof Vt) {
            if (this.disallowBlockEffectsFor[u]) {
              if (h.block)
                throw new RangeError(
                  "Block decorations may not be specified via plugins",
                );
              if (a > this.view.state.doc.lineAt(l).to)
                throw new RangeError(
                  "Decorations that replace line breaks may not be specified via plugins",
                );
            }
            if (((r = c.length), f > c.length)) s.continueWidget(a - l);
            else {
              let d = h.widget || (h.block ? li.block : li.inline),
                p = Qu(h),
                m =
                  this.cache.findWidget(d, a - l, p) ||
                  _t.of(d, this.view, a - l, p);
              h.block
                ? (h.startSide > 0 && s.addLineStartIfNotCovered(i),
                  s.addBlockWidget(m))
                : (s.ensureLine(i), s.addInlineWidget(m, c, f));
            }
            i = null;
          } else i = Zu(i, h);
          a > l && this.text.skip(a - l);
        },
        span: (l, a, h, c) => {
          for (let f = l; f < a; ) {
            let u = this.text.next(Math.min(512, a - f));
            (u == null
              ? (s.addLineStartIfNotCovered(i), s.addBreak(), f++)
              : (s.ensureLine(i),
                s.addText(u, h, f == l ? c : h.length),
                (f += u.length)),
              (i = null));
          }
        },
      });
    (s.addLineStartIfNotCovered(i),
      (this.openWidget = o > r),
      (this.openMarks = o));
  }
  forward(e, t, i = 1) {
    t - e <= 10
      ? this.old.advance(t - e, i, this.reuseWalker)
      : (this.old.advance(5, -1, this.reuseWalker),
        this.old.advance(t - e - 10, -1),
        this.old.advance(5, i, this.reuseWalker));
  }
  getCompositionContext(e) {
    let t = [],
      i = null;
    for (let s = e.parentNode; ; s = s.parentNode) {
      let r = ie.get(s);
      if (s == this.view.contentDOM) break;
      r instanceof Te
        ? t.push(r)
        : r?.isLine()
          ? (i = r)
          : r instanceof ct ||
            (s.nodeName == "DIV" && !i && s != this.view.contentDOM
              ? (i = new oi(s, Fh))
              : i ||
                t.push(
                  Te.of(
                    new Qi({
                      tagName: s.nodeName.toLowerCase(),
                      attributes: Mu(s),
                    }),
                    s,
                  ),
                ));
    }
    return { line: i, marks: t };
  }
}
function al(n, e) {
  let t = (i) => {
    for (let s of i.children)
      if ((e ? s.isText() : s.length) || t(s)) return !0;
    return !1;
  };
  return t(n);
}
function Qu(n) {
  let e = n.isReplace
    ? (n.startSide < 0 ? 64 : 0) | (n.endSide > 0 ? 128 : 0)
    : n.startSide > 0
      ? 32
      : 16;
  return (n.block && (e |= 256), e);
}
const Fh = { class: "cm-line" };
function Zu(n, e) {
  let t = e.spec.attributes,
    i = e.spec.class;
  return (
    (!t && !i) ||
      (n || (n = { class: "cm-line" }),
      t && to(t, n),
      i && (n.class += " " + i)),
    n
  );
}
function ed(n) {
  let e = [];
  for (let t = n.parents.length; t > 1; t--) {
    let i = t == n.parents.length ? n.tile : n.parents[t].tile;
    i instanceof Te && e.push(i.mark);
  }
  return e;
}
function Bs(n) {
  let e = ie.get(n);
  return (e && e.setDOM(n.cloneNode()), n);
}
class li extends Ke {
  constructor(e) {
    (super(), (this.tag = e));
  }
  eq(e) {
    return e.tag == this.tag;
  }
  toDOM() {
    return document.createElement(this.tag);
  }
  updateDOM(e) {
    return e.nodeName.toLowerCase() == this.tag;
  }
  get isHidden() {
    return !0;
  }
}
li.inline = new li("span");
li.block = new li("div");
const Es = new (class extends Ke {
  toDOM() {
    return document.createElement("br");
  }
  get isHidden() {
    return !0;
  }
  get editable() {
    return !0;
  }
})();
class hl {
  constructor(e) {
    ((this.view = e),
      (this.decorations = []),
      (this.blockWrappers = []),
      (this.dynamicDecorationMap = [!1]),
      (this.domChanged = null),
      (this.hasComposition = null),
      (this.editContextFormatting = L.none),
      (this.lastCompositionAfterCursor = !1),
      (this.minWidth = 0),
      (this.minWidthFrom = 0),
      (this.minWidthTo = 0),
      (this.impreciseAnchor = null),
      (this.impreciseHead = null),
      (this.forceSelection = !1),
      (this.lastUpdate = Date.now()),
      this.updateDeco(),
      (this.tile = new ms(e, e.contentDOM)),
      this.updateInner([new Ne(0, 0, 0, e.state.doc.length)], null));
  }
  update(e) {
    var t;
    let i = e.changedRanges;
    (this.minWidth > 0 &&
      i.length &&
      (i.every(
        ({ fromA: c, toA: f }) => f < this.minWidthFrom || c > this.minWidthTo,
      )
        ? ((this.minWidthFrom = e.changes.mapPos(this.minWidthFrom, 1)),
          (this.minWidthTo = e.changes.mapPos(this.minWidthTo, 1)))
        : (this.minWidth = this.minWidthFrom = this.minWidthTo = 0)),
      this.updateEditContextFormatting(e));
    let s = -1;
    this.view.inputState.composing >= 0 &&
      !this.view.observer.editContext &&
      (!((t = this.domChanged) === null || t === void 0) && t.newSel
        ? (s = this.domChanged.newSel.head)
        : !hd(e.changes, this.hasComposition) &&
          !e.selectionSet &&
          (s = e.state.selection.main.head));
    let r = s > -1 ? id(this.view, e.changes, s) : null;
    if (((this.domChanged = null), this.hasComposition)) {
      let { from: c, to: f } = this.hasComposition;
      i = new Ne(
        c,
        f,
        e.changes.mapPos(c, -1),
        e.changes.mapPos(f, 1),
      ).addToSet(i.slice());
    }
    ((this.hasComposition = r
      ? { from: r.range.fromB, to: r.range.toB }
      : null),
      (O.ie || O.chrome) &&
        !r &&
        e &&
        e.state.doc.lines != e.startState.doc.lines &&
        (this.forceSelection = !0));
    let o = this.decorations,
      l = this.blockWrappers;
    this.updateDeco();
    let a = rd(o, this.decorations, e.changes);
    a.length && (i = Ne.extendWithRanges(i, a));
    let h = ld(l, this.blockWrappers, e.changes);
    return (
      h.length && (i = Ne.extendWithRanges(i, h)),
      r &&
        !i.some((c) => c.fromA <= r.range.fromA && c.toA >= r.range.toA) &&
        (i = r.range.addToSet(i.slice())),
      this.tile.flags & 2 && i.length == 0
        ? !1
        : (this.updateInner(i, r),
          e.transactions.length && (this.lastUpdate = Date.now()),
          !0)
    );
  }
  updateInner(e, t) {
    this.view.viewState.mustMeasureContent = !0;
    let { observer: i } = this.view;
    i.ignore(() => {
      if (t || e.length) {
        let o = this.tile,
          l = new Xu(
            this.view,
            o,
            this.blockWrappers,
            this.decorations,
            this.dynamicDecorationMap,
          );
        (t && ie.get(t.text) && l.cache.reused.set(ie.get(t.text), 2),
          (this.tile = l.run(e, t)),
          Ar(o, l.cache.reused));
      }
      ((this.tile.dom.style.height =
        this.view.viewState.contentHeight / this.view.scaleY + "px"),
        (this.tile.dom.style.flexBasis = this.minWidth
          ? this.minWidth + "px"
          : ""));
      let r =
        O.chrome || O.ios
          ? { node: i.selectionRange.focusNode, written: !1 }
          : void 0;
      (this.tile.sync(r),
        r &&
          (r.written ||
            i.selectionRange.focusNode != r.node ||
            !this.tile.dom.contains(r.node)) &&
          (this.forceSelection = !0),
        (this.tile.dom.style.height = ""));
    });
    let s = [];
    if (
      this.view.viewport.from ||
      this.view.viewport.to < this.view.state.doc.length
    )
      for (let r of this.tile.children)
        r.isWidget() && r.widget instanceof Ls && s.push(r.dom);
    i.updateGaps(s);
  }
  updateEditContextFormatting(e) {
    this.editContextFormatting = this.editContextFormatting.map(e.changes);
    for (let t of e.transactions)
      for (let i of t.effects)
        i.is(Ph) && (this.editContextFormatting = i.value);
  }
  updateSelection(e = !1, t = !1) {
    (e || !this.view.observer.selectionRange.focusNode) &&
      this.view.observer.readSelectionRange();
    let { dom: i } = this.tile,
      s = this.view.root.activeElement,
      r = s == i,
      o =
        !r &&
        !(this.view.state.facet(ht) || i.tabIndex > -1) &&
        Ti(i, this.view.observer.selectionRange) &&
        !(s && i.contains(s));
    if (!(r || t || o)) return;
    let l = this.forceSelection;
    this.forceSelection = !1;
    let a = this.view.state.selection.main,
      h,
      c;
    if (
      (a.empty
        ? (c = h = this.inlineDOMNearPos(a.anchor, a.assoc || 1))
        : ((c = this.inlineDOMNearPos(a.head, a.head == a.from ? 1 : -1)),
          (h = this.inlineDOMNearPos(a.anchor, a.anchor == a.from ? 1 : -1))),
      O.gecko && a.empty && !this.hasComposition && td(h))
    ) {
      let u = document.createTextNode("");
      (this.view.observer.ignore(() =>
        h.node.insertBefore(u, h.node.childNodes[h.offset] || null),
      ),
        (h = c = new qe(u, 0)),
        (l = !0));
    }
    let f = this.view.observer.selectionRange;
    ((l ||
      !f.focusNode ||
      ((!Oi(h.node, h.offset, f.anchorNode, f.anchorOffset) ||
        !Oi(c.node, c.offset, f.focusNode, f.focusOffset)) &&
        !this.suppressWidgetCursorChange(f, a))) &&
      (this.view.observer.ignore(() => {
        O.android &&
          O.chrome &&
          i.contains(f.focusNode) &&
          ad(f.focusNode, i) &&
          (i.blur(), i.focus({ preventScroll: !0 }));
        let u = Ni(this.view.root);
        if (u)
          if (a.empty) {
            if (O.gecko) {
              let d = nd(h.node, h.offset);
              if (d && d != 3) {
                let p = (d == 1 ? yh : bh)(h.node, h.offset);
                p && (h = new qe(p.node, p.offset));
              }
            }
            (u.collapse(h.node, h.offset),
              a.bidiLevel != null &&
                u.caretBidiLevel !== void 0 &&
                (u.caretBidiLevel = a.bidiLevel));
          } else if (u.extend) {
            u.collapse(h.node, h.offset);
            try {
              u.extend(c.node, c.offset);
            } catch {}
          } else {
            let d = document.createRange();
            (a.anchor > a.head && ([h, c] = [c, h]),
              d.setEnd(c.node, c.offset),
              d.setStart(h.node, h.offset),
              u.removeAllRanges(),
              u.addRange(d));
          }
        o && this.view.root.activeElement == i && (i.blur(), s && s.focus());
      }),
      this.view.observer.setSelectionRange(h, c)),
      (this.impreciseAnchor = h.precise
        ? null
        : new qe(f.anchorNode, f.anchorOffset)),
      (this.impreciseHead = c.precise
        ? null
        : new qe(f.focusNode, f.focusOffset)));
  }
  suppressWidgetCursorChange(e, t) {
    return (
      this.hasComposition &&
      t.empty &&
      Oi(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset) &&
      this.posFromDOM(e.focusNode, e.focusOffset) == t.head
    );
  }
  enforceCursorAssoc() {
    if (this.hasComposition) return;
    let { view: e } = this,
      t = e.state.selection.main,
      i = Ni(e.root),
      { anchorNode: s, anchorOffset: r } = e.observer.selectionRange;
    if (!i || !t.empty || !t.assoc || !i.modify) return;
    let o = this.lineAt(t.head, t.assoc);
    if (!o) return;
    let l = o.posAtStart;
    if (t.head == l || t.head == l + o.length) return;
    let a = this.coordsAt(t.head, -1),
      h = this.coordsAt(t.head, 1);
    if (!a || !h || a.bottom > h.top) return;
    let c = this.domAtPos(t.head + t.assoc, t.assoc);
    (i.collapse(c.node, c.offset),
      i.modify("move", t.assoc < 0 ? "forward" : "backward", "lineboundary"),
      e.observer.readSelectionRange());
    let f = e.observer.selectionRange;
    e.docView.posFromDOM(f.anchorNode, f.anchorOffset) != t.from &&
      i.collapse(s, r);
  }
  posFromDOM(e, t) {
    let i = this.tile.nearest(e);
    if (!i)
      return this.tile.dom.compareDocumentPosition(e) & 2
        ? 0
        : this.view.state.doc.length;
    let s = i.posAtStart;
    if (i.isComposite()) {
      let r;
      if (e == i.dom) r = i.dom.childNodes[t];
      else {
        let o = dt(e) == 0 ? 0 : t == 0 ? -1 : 1;
        for (;;) {
          let l = e.parentNode;
          if (l == i.dom) break;
          (o == 0 &&
            l.firstChild != l.lastChild &&
            (e == l.firstChild ? (o = -1) : (o = 1)),
            (e = l));
        }
        o < 0 ? (r = e) : (r = e.nextSibling);
      }
      if (r == i.dom.firstChild) return s;
      for (; r && !ie.get(r); ) r = r.nextSibling;
      if (!r) return s + i.length;
      for (let o = 0, l = s; ; o++) {
        let a = i.children[o];
        if (a.dom == r) return l;
        l += a.length + a.breakAfter;
      }
    } else
      return i.isText() ? (e == i.dom ? s + t : s + (t ? i.length : 0)) : s;
  }
  domAtPos(e, t) {
    let { tile: i, offset: s } = this.tile.resolveBlock(e, t);
    return i.isWidget() ? i.domPosFor(e, t) : i.domIn(s, t);
  }
  inlineDOMNearPos(e, t) {
    let i,
      s = -1,
      r = !1,
      o,
      l = -1,
      a = !1;
    return (
      this.tile.blockTiles((h, c) => {
        if (h.isWidget()) {
          if (h.flags & 32 && c >= e) return !0;
          h.flags & 16 && (r = !0);
        } else {
          let f = c + h.length;
          if (
            (c <= e && ((i = h), (s = e - c), (r = f < e)),
            f >= e && !o && ((o = h), (l = e - c), (a = c > e)),
            c > e && o)
          )
            return !0;
        }
      }),
      !i && !o
        ? this.domAtPos(e, t)
        : (r && o ? (i = null) : a && i && (o = null),
          (i && t < 0) || !o ? i.domIn(s, t) : o.domIn(l, t))
    );
  }
  coordsAt(e, t) {
    let { tile: i, offset: s } = this.tile.resolveBlock(e, t);
    return i.isWidget()
      ? i.widget instanceof Ls
        ? null
        : i.coordsInWidget(s, t, !0)
      : i.coordsIn(s, t);
  }
  lineAt(e, t) {
    let { tile: i } = this.tile.resolveBlock(e, t);
    return i.isLine() ? i : null;
  }
  coordsForChar(e) {
    let { tile: t, offset: i } = this.tile.resolveBlock(e, 1);
    if (!t.isLine()) return null;
    function s(r, o) {
      if (r.isComposite())
        for (let l of r.children) {
          if (l.length >= o) {
            let a = s(l, o);
            if (a) return a;
          }
          if (((o -= l.length), o < 0)) break;
        }
      else if (r.isText() && o < r.length) {
        let l = he(r.text, o);
        if (l == o) return null;
        let a = Fi(r.dom, o, l).getClientRects();
        for (let h = 0; h < a.length; h++) {
          let c = a[h];
          if (h == a.length - 1 || (c.top < c.bottom && c.left < c.right))
            return c;
        }
      }
      return null;
    }
    return s(t, i);
  }
  measureVisibleLineHeights(e) {
    let t = [],
      { from: i, to: s } = e,
      r = this.view.contentDOM.clientWidth,
      o = r > Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1,
      l = -1,
      a = this.view.textDirection == G.LTR,
      h = 0,
      c = (f, u, d) => {
        for (let p = 0; p < f.children.length && !(u > s); p++) {
          let m = f.children[p],
            g = u + m.length,
            b = m.dom.getBoundingClientRect(),
            { height: w } = b;
          if ((d && !p && (h += b.top - d.top), m instanceof ct))
            g > i && c(m, u, b);
          else if (u >= i && (h > 0 && t.push(-h), t.push(w + h), (h = 0), o)) {
            let v = m.dom.lastChild,
              T = v ? Di(v) : [];
            if (T.length) {
              let k = T[T.length - 1],
                S = a ? k.right - b.left : b.right - k.left;
              S > l &&
                ((l = S),
                (this.minWidth = r),
                (this.minWidthFrom = u),
                (this.minWidthTo = g));
            }
          }
          (d && p == f.children.length - 1 && (h += d.bottom - b.bottom),
            (u = g + m.breakAfter));
        }
      };
    return (c(this.tile, 0, null), t);
  }
  textDirectionAt(e) {
    let { tile: t } = this.tile.resolveBlock(e, 1);
    return getComputedStyle(t.dom).direction == "rtl" ? G.RTL : G.LTR;
  }
  measureTextSize() {
    let e = this.tile.blockTiles((o) => {
      if (o.isLine() && o.children.length && o.length <= 20) {
        let l = 0,
          a;
        for (let h of o.children) {
          if (!h.isText() || /[^ -~]/.test(h.text)) return;
          let c = Di(h.dom);
          if (c.length != 1) return;
          ((l += c[0].width), (a = c[0].height));
        }
        if (l)
          return {
            lineHeight: o.dom.getBoundingClientRect().height,
            charWidth: l / o.length,
            textHeight: a,
          };
      }
    });
    if (e) return e;
    let t = document.createElement("div"),
      i,
      s,
      r;
    return (
      (t.className = "cm-line"),
      (t.style.width = "99999px"),
      (t.style.position = "absolute"),
      (t.textContent = "abc def ghi jkl mno pqr stu"),
      this.view.observer.ignore(() => {
        this.tile.dom.appendChild(t);
        let o = Di(t.firstChild)[0];
        ((i = t.getBoundingClientRect().height),
          (s = o && o.width ? o.width / 27 : 7),
          (r = o && o.height ? o.height : i),
          t.remove());
      }),
      { lineHeight: i, charWidth: s, textHeight: r }
    );
  }
  computeBlockGapDeco() {
    let e = [],
      t = this.view.viewState;
    for (let i = 0, s = 0; ; s++) {
      let r = s == t.viewports.length ? null : t.viewports[s],
        o = r ? r.from - 1 : this.view.state.doc.length;
      if (o > i) {
        let l =
          (t.lineBlockAt(o).bottom - t.lineBlockAt(i).top) / this.view.scaleY;
        e.push(
          L.replace({
            widget: new Ls(l),
            block: !0,
            inclusive: !0,
            isBlockGap: !0,
          }).range(i, o),
        );
      }
      if (!r) break;
      i = r.to + 1;
    }
    return L.set(e);
  }
  updateDeco() {
    let e = 1,
      t = this.view.state
        .facet(ds)
        .map((r) =>
          (this.dynamicDecorationMap[e++] = typeof r == "function")
            ? r(this.view)
            : r,
        ),
      i = !1,
      s = this.view.state.facet(lo).map((r, o) => {
        let l = typeof r == "function";
        return (l && (i = !0), l ? r(this.view) : r);
      });
    for (
      s.length && ((this.dynamicDecorationMap[e++] = i), t.push(z.join(s))),
        this.decorations = [
          this.editContextFormatting,
          ...t,
          this.computeBlockGapDeco(),
          this.view.viewState.lineGapDeco,
        ];
      e < this.decorations.length;
    )
      this.dynamicDecorationMap[e++] = !1;
    this.blockWrappers = this.view.state
      .facet(Ih)
      .map((r) => (typeof r == "function" ? r(this.view) : r));
  }
  scrollIntoView(e) {
    if (e.isSnapshot) {
      let h = this.view.viewState.lineBlockAt(e.range.head);
      ((this.view.scrollDOM.scrollTop = h.top - e.yMargin),
        (this.view.scrollDOM.scrollLeft = e.xMargin));
      return;
    }
    for (let h of this.view.state.facet(Lh))
      try {
        if (h(this.view, e.range, e)) return !0;
      } catch (c) {
        De(this.view.state, c, "scroll handler");
      }
    let { range: t } = e,
      i = this.coordsAt(t.head, t.empty ? t.assoc : t.head > t.anchor ? -1 : 1),
      s;
    if (!i) return;
    !t.empty &&
      (s = this.coordsAt(t.anchor, t.anchor > t.head ? -1 : 1)) &&
      (i = {
        left: Math.min(i.left, s.left),
        top: Math.min(i.top, s.top),
        right: Math.max(i.right, s.right),
        bottom: Math.max(i.bottom, s.bottom),
      });
    let r = ao(this.view),
      o = {
        left: i.left - r.left,
        top: i.top - r.top,
        right: i.right + r.right,
        bottom: i.bottom + r.bottom,
      },
      { offsetWidth: l, offsetHeight: a } = this.view.scrollDOM;
    if (
      (Ou(
        this.view.scrollDOM,
        o,
        t.head < t.anchor ? -1 : 1,
        e.x,
        e.y,
        Math.max(Math.min(e.xMargin, l), -l),
        Math.max(Math.min(e.yMargin, a), -a),
        this.view.textDirection == G.LTR,
      ),
      window.visualViewport &&
        window.innerHeight - window.visualViewport.height > 1 &&
        (i.top >
          window.pageYOffset +
            window.visualViewport.offsetTop +
            window.visualViewport.height ||
          i.bottom < window.pageYOffset + window.visualViewport.offsetTop))
    ) {
      let h = this.view.docView.lineAt(t.head, 1);
      h && h.dom.scrollIntoView({ block: "nearest" });
    }
  }
  lineHasWidget(e) {
    let t = (i) => i.isWidget() || i.children.some(t);
    return t(this.tile.resolveBlock(e, 1).tile);
  }
  destroy() {
    Ar(this.tile);
  }
}
function Ar(n, e) {
  let t = e?.get(n);
  if (t != 1) {
    t == null && n.destroy();
    for (let i of n.children) Ar(i, e);
  }
}
function td(n) {
  return (
    n.node.nodeType == 1 &&
    n.node.firstChild &&
    (n.offset == 0 ||
      n.node.childNodes[n.offset - 1].contentEditable == "false") &&
    (n.offset == n.node.childNodes.length ||
      n.node.childNodes[n.offset].contentEditable == "false")
  );
}
function Hh(n, e) {
  let t = n.observer.selectionRange;
  if (!t.focusNode) return null;
  let i = yh(t.focusNode, t.focusOffset),
    s = bh(t.focusNode, t.focusOffset),
    r = i || s;
  if (s && i && s.node != i.node) {
    let l = ie.get(s.node);
    if (!l || (l.isText() && l.text != s.node.nodeValue)) r = s;
    else if (n.docView.lastCompositionAfterCursor) {
      let a = ie.get(i.node);
      !a || (a.isText() && a.text != i.node.nodeValue) || (r = s);
    }
  }
  if (((n.docView.lastCompositionAfterCursor = r != i), !r)) return null;
  let o = e - r.offset;
  return { from: o, to: o + r.node.nodeValue.length, node: r.node };
}
function id(n, e, t) {
  let i = Hh(n, t);
  if (!i) return null;
  let { node: s, from: r, to: o } = i,
    l = s.nodeValue;
  if (/[\n\r]/.test(l) || n.state.doc.sliceString(i.from, i.to) != l)
    return null;
  let a = e.invertedDesc;
  return { range: new Ne(a.mapPos(r), a.mapPos(o), r, o), text: s };
}
function nd(n, e) {
  return n.nodeType != 1
    ? 0
    : (e && n.childNodes[e - 1].contentEditable == "false" ? 1 : 0) |
        (e < n.childNodes.length && n.childNodes[e].contentEditable == "false"
          ? 2
          : 0);
}
let sd = class {
  constructor() {
    this.changes = [];
  }
  compareRange(e, t) {
    Zt(e, t, this.changes);
  }
  comparePoint(e, t) {
    Zt(e, t, this.changes);
  }
  boundChange(e) {
    Zt(e, e, this.changes);
  }
};
function rd(n, e, t) {
  let i = new sd();
  return (z.compare(n, e, t, i), i.changes);
}
class od {
  constructor() {
    this.changes = [];
  }
  compareRange(e, t) {
    Zt(e, t, this.changes);
  }
  comparePoint() {}
  boundChange(e) {
    Zt(e, e, this.changes);
  }
}
function ld(n, e, t) {
  let i = new od();
  return (z.compare(n, e, t, i), i.changes);
}
function ad(n, e) {
  for (let t = n; t && t != e; t = t.assignedSlot || t.parentNode)
    if (t.nodeType == 1 && t.contentEditable == "false") return !0;
  return !1;
}
function hd(n, e) {
  let t = !1;
  return (
    e &&
      n.iterChangedRanges((i, s) => {
        i < e.to && s > e.from && (t = !0);
      }),
    t
  );
}
class Ls extends Ke {
  constructor(e) {
    (super(), (this.height = e));
  }
  toDOM() {
    let e = document.createElement("div");
    return ((e.className = "cm-gap"), this.updateDOM(e), e);
  }
  eq(e) {
    return e.height == this.height;
  }
  updateDOM(e) {
    return ((e.style.height = this.height + "px"), !0);
  }
  get editable() {
    return !0;
  }
  get estimatedHeight() {
    return this.height;
  }
  ignoreEvent() {
    return !1;
  }
}
function cd(n, e, t = 1) {
  let i = n.charCategorizer(e),
    s = n.doc.lineAt(e),
    r = e - s.from;
  if (s.length == 0) return x.cursor(e);
  r == 0 ? (t = 1) : r == s.length && (t = -1);
  let o = r,
    l = r;
  t < 0 ? (o = he(s.text, r, !1)) : (l = he(s.text, r));
  let a = i(s.text.slice(o, l));
  for (; o > 0; ) {
    let h = he(s.text, o, !1);
    if (i(s.text.slice(h, o)) != a) break;
    o = h;
  }
  for (; l < s.length; ) {
    let h = he(s.text, l);
    if (i(s.text.slice(l, h)) != a) break;
    l = h;
  }
  return x.range(o + s.from, l + s.from);
}
function fd(n, e, t, i, s) {
  let r = Math.round((i - e.left) * n.defaultCharacterWidth);
  if (n.lineWrapping && t.height > n.defaultLineHeight * 1.5) {
    let l = n.viewState.heightOracle.textHeight,
      a = Math.floor((s - t.top - (n.defaultLineHeight - l) * 0.5) / l);
    r += a * n.viewState.heightOracle.lineLength;
  }
  let o = n.state.sliceDoc(t.from, t.to);
  return t.from + dr(o, r, n.state.tabSize);
}
function Mr(n, e, t) {
  let i = n.lineBlockAt(e);
  if (Array.isArray(i.type)) {
    let s;
    for (let r of i.type) {
      if (r.from > e) break;
      if (!(r.to < e)) {
        if (r.from < e && r.to > e) return r;
        (!s ||
          (r.type == me.Text &&
            (s.type != r.type || (t < 0 ? r.from < e : r.to > e)))) &&
          (s = r);
      }
    }
    return s || i;
  }
  return i;
}
function ud(n, e, t, i) {
  let s = Mr(n, e.head, e.assoc || -1),
    r =
      !i || s.type != me.Text || !(n.lineWrapping || s.widgetLineBreaks)
        ? null
        : n.coordsAtPos(e.assoc < 0 && e.head > s.from ? e.head - 1 : e.head);
  if (r) {
    let o = n.dom.getBoundingClientRect(),
      l = n.textDirectionAt(s.from),
      a = n.posAtCoords({
        x: t == (l == G.LTR) ? o.right - 1 : o.left + 1,
        y: (r.top + r.bottom) / 2,
      });
    if (a != null) return x.cursor(a, t ? -1 : 1);
  }
  return x.cursor(t ? s.to : s.from, t ? -1 : 1);
}
function cl(n, e, t, i) {
  let s = n.state.doc.lineAt(e.head),
    r = n.bidiSpans(s),
    o = n.textDirectionAt(s.from);
  for (let l = e, a = null; ; ) {
    let h = Vu(s, r, o, l, t),
      c = Sh;
    if (!h) {
      if (s.number == (t ? n.state.doc.lines : 1)) return l;
      ((c = `
`),
        (s = n.state.doc.line(s.number + (t ? 1 : -1))),
        (r = n.bidiSpans(s)),
        (h = n.visualLineSide(s, !t)));
    }
    if (a) {
      if (!a(c)) return l;
    } else {
      if (!i) return h;
      a = i(c);
    }
    l = h;
  }
}
function dd(n, e, t) {
  let i = n.state.charCategorizer(e),
    s = i(t);
  return (r) => {
    let o = i(r);
    return (s == Q.Space && (s = o), s == o);
  };
}
function pd(n, e, t, i) {
  let s = e.head,
    r = t ? 1 : -1;
  if (s == (t ? n.state.doc.length : 0)) return x.cursor(s, e.assoc);
  let o = e.goalColumn,
    l,
    a = n.contentDOM.getBoundingClientRect(),
    h = n.coordsAtPos(s, (e.empty ? e.assoc : 0) || (t ? 1 : -1)),
    c = n.documentTop;
  if (h) (o == null && (o = h.left - a.left), (l = r < 0 ? h.top : h.bottom));
  else {
    let p = n.viewState.lineBlockAt(s);
    (o == null &&
      (o = Math.min(a.right - a.left, n.defaultCharacterWidth * (s - p.from))),
      (l = (r < 0 ? p.top : p.bottom) + c));
  }
  let f = a.left + o,
    u = i ?? n.viewState.heightOracle.textHeight >> 1,
    d = Tr(n, { x: f, y: l + u * r }, !1, r);
  return x.cursor(d.pos, d.assoc, void 0, o);
}
function Bi(n, e, t) {
  for (;;) {
    let i = 0;
    for (let s of n)
      s.between(e - 1, e + 1, (r, o, l) => {
        if (e > r && e < o) {
          let a = i || t || (e - r < o - e ? -1 : 1);
          ((e = a < 0 ? r : o), (i = a));
        }
      });
    if (!i) return e;
  }
}
function Vh(n, e) {
  let t = null;
  for (let i = 0; i < e.ranges.length; i++) {
    let s = e.ranges[i],
      r = null;
    if (s.empty) {
      let o = Bi(n, s.from, 0);
      o != s.from && (r = x.cursor(o, -1));
    } else {
      let o = Bi(n, s.from, -1),
        l = Bi(n, s.to, 1);
      (o != s.from || l != s.to) &&
        (r = x.range(s.from == s.anchor ? o : l, s.from == s.head ? o : l));
    }
    r && (t || (t = e.ranges.slice()), (t[i] = r));
  }
  return t ? x.create(t, e.mainIndex) : e;
}
function Ps(n, e, t) {
  let i = Bi(
    n.state.facet(en).map((s) => s(n)),
    t.from,
    e.head > t.from ? -1 : 1,
  );
  return i == t.from ? t : x.cursor(i, i < t.from ? 1 : -1);
}
class tt {
  constructor(e, t) {
    ((this.pos = e), (this.assoc = t));
  }
}
function Tr(n, e, t, i) {
  let s = n.contentDOM.getBoundingClientRect(),
    r = s.top + n.viewState.paddingTop,
    { x: o, y: l } = e,
    a = l - r,
    h;
  for (;;) {
    if (a < 0) return new tt(0, 1);
    if (a > n.viewState.docHeight) return new tt(n.state.doc.length, -1);
    if (((h = n.elementAtHeight(a)), i == null)) break;
    if (h.type == me.Text) {
      if (i < 0 ? h.to < n.viewport.from : h.from > n.viewport.to) break;
      let u = n.docView.coordsAt(i < 0 ? h.from : h.to, i > 0 ? -1 : 1);
      if (u && (i < 0 ? u.top <= a + r : u.bottom >= a + r)) break;
    }
    let f = n.viewState.heightOracle.textHeight / 2;
    a = i > 0 ? h.bottom + f : h.top - f;
  }
  if (n.viewport.from >= h.to || n.viewport.to <= h.from) {
    if (t) return null;
    if (h.type == me.Text) {
      let f = fd(n, s, h, o, l);
      return new tt(f, f == h.from ? 1 : -1);
    }
  }
  if (h.type != me.Text)
    return a < (h.top + h.bottom) / 2 ? new tt(h.from, 1) : new tt(h.to, -1);
  let c = n.docView.lineAt(h.from, 2);
  return (
    (!c || c.length != h.length) && (c = n.docView.lineAt(h.from, -2)),
    new md(n, o, l, n.textDirectionAt(h.from)).scanTile(c, h.from)
  );
}
class md {
  constructor(e, t, i, s) {
    ((this.view = e),
      (this.x = t),
      (this.y = i),
      (this.baseDir = s),
      (this.line = null),
      (this.spans = null));
  }
  bidiSpansAt(e) {
    return (
      (!this.line || this.line.from > e || this.line.to < e) &&
        ((this.line = this.view.state.doc.lineAt(e)),
        (this.spans = this.view.bidiSpans(this.line))),
      this
    );
  }
  baseDirAt(e, t) {
    let { line: i, spans: s } = this.bidiSpansAt(e);
    return s[it.find(s, e - i.from, -1, t)].level == this.baseDir;
  }
  dirAt(e, t) {
    let { line: i, spans: s } = this.bidiSpansAt(e);
    return s[it.find(s, e - i.from, -1, t)].dir;
  }
  bidiIn(e, t) {
    let { spans: i, line: s } = this.bidiSpansAt(e);
    return (
      i.length > 1 ||
      (i.length && (i[0].level != this.baseDir || i[0].to + s.from < t))
    );
  }
  scan(e, t) {
    let i = 0,
      s = e.length - 1,
      r = new Set(),
      o = this.bidiIn(e[0], e[s]),
      l,
      a,
      h = -1,
      c = 1e9,
      f;
    e: for (; i < s; ) {
      let d = s - i,
        p = (i + s) >> 1;
      t: if (r.has(p)) {
        let g = i + Math.floor(Math.random() * d);
        for (let b = 0; b < d; b++) {
          if (!r.has(g)) {
            p = g;
            break t;
          }
          (g++, g == s && (g = i));
        }
        break e;
      }
      r.add(p);
      let m = t(p);
      if (m)
        for (let g = 0; g < m.length; g++) {
          let b = m[g],
            w = 0;
          if (b.bottom < this.y)
            ((!l || l.bottom < b.bottom) && (l = b), (w = 1));
          else if (b.top > this.y) ((!a || a.top > b.top) && (a = b), (w = -1));
          else {
            let v =
                b.left > this.x
                  ? this.x - b.left
                  : b.right < this.x
                    ? this.x - b.right
                    : 0,
              T = Math.abs(v);
            (T < c && ((h = p), (c = T), (f = b)),
              v && (w = v < 0 == (this.baseDir == G.LTR) ? -1 : 1));
          }
          w == -1 && (!o || this.baseDirAt(e[p], 1))
            ? (s = p)
            : w == 1 && (!o || this.baseDirAt(e[p + 1], -1)) && (i = p + 1);
        }
    }
    if (!f) {
      let d = l && (!a || this.y - l.bottom < a.top - this.y) ? l : a;
      return ((this.y = (d.top + d.bottom) / 2), this.scan(e, t));
    }
    let u = (o ? this.dirAt(e[h], 1) : this.baseDir) == G.LTR;
    return { i: h, after: this.x > (f.left + f.right) / 2 == u };
  }
  scanText(e, t) {
    let i = [];
    for (let r = 0; r < e.length; r = he(e.text, r)) i.push(t + r);
    i.push(t + e.length);
    let s = this.scan(i, (r) => {
      let o = i[r] - t,
        l = i[r + 1] - t;
      return Fi(e.dom, o, l).getClientRects();
    });
    return s.after ? new tt(i[s.i + 1], -1) : new tt(i[s.i], 1);
  }
  scanTile(e, t) {
    if (!e.length) return new tt(t, 1);
    if (e.children.length == 1) {
      let l = e.children[0];
      if (l.isText()) return this.scanText(l, t);
      if (l.isComposite()) return this.scanTile(l, t);
    }
    let i = [t];
    for (let l = 0, a = t; l < e.children.length; l++)
      i.push((a += e.children[l].length));
    let s = this.scan(i, (l) => {
        let a = e.children[l];
        return a.flags & 48
          ? null
          : (a.dom.nodeType == 1
              ? a.dom
              : Fi(a.dom, 0, a.length)
            ).getClientRects();
      }),
      r = e.children[s.i],
      o = i[s.i];
    return r.isText()
      ? this.scanText(r, o)
      : r.isComposite()
        ? this.scanTile(r, o)
        : s.after
          ? new tt(i[s.i + 1], -1)
          : new tt(o, 1);
  }
}
const jt = "￿";
class gd {
  constructor(e, t) {
    ((this.points = e),
      (this.view = t),
      (this.text = ""),
      (this.lineSeparator = t.state.facet(_.lineSeparator)));
  }
  append(e) {
    this.text += e;
  }
  lineBreak() {
    this.text += jt;
  }
  readRange(e, t) {
    if (!e) return this;
    let i = e.parentNode;
    for (let s = e; ; ) {
      this.findPointBefore(i, s);
      let r = this.text.length;
      this.readNode(s);
      let o = ie.get(s),
        l = s.nextSibling;
      if (l == t) {
        o?.breakAfter && !l && i != this.view.contentDOM && this.lineBreak();
        break;
      }
      let a = ie.get(l);
      ((o && a
        ? o.breakAfter
        : (o ? o.breakAfter : Kn(s)) ||
          (Kn(l) &&
            (s.nodeName != "BR" || o?.isWidget()) &&
            this.text.length > r)) &&
        !bd(l, t) &&
        this.lineBreak(),
        (s = l));
    }
    return (this.findPointBefore(i, t), this);
  }
  readTextNode(e) {
    let t = e.nodeValue;
    for (let i of this.points)
      i.node == e && (i.pos = this.text.length + Math.min(i.offset, t.length));
    for (let i = 0, s = this.lineSeparator ? null : /\r\n?|\n/g; ; ) {
      let r = -1,
        o = 1,
        l;
      if (
        (this.lineSeparator
          ? ((r = t.indexOf(this.lineSeparator, i)),
            (o = this.lineSeparator.length))
          : (l = s.exec(t)) && ((r = l.index), (o = l[0].length)),
        this.append(t.slice(i, r < 0 ? t.length : r)),
        r < 0)
      )
        break;
      if ((this.lineBreak(), o > 1))
        for (let a of this.points)
          a.node == e && a.pos > this.text.length && (a.pos -= o - 1);
      i = r + o;
    }
  }
  readNode(e) {
    let t = ie.get(e),
      i = t && t.overrideDOMText;
    if (i != null) {
      this.findPointInside(e, i.length);
      for (let s = i.iter(); !s.next().done; )
        s.lineBreak ? this.lineBreak() : this.append(s.value);
    } else
      e.nodeType == 3
        ? this.readTextNode(e)
        : e.nodeName == "BR"
          ? e.nextSibling && this.lineBreak()
          : e.nodeType == 1 && this.readRange(e.firstChild, null);
  }
  findPointBefore(e, t) {
    for (let i of this.points)
      i.node == e && e.childNodes[i.offset] == t && (i.pos = this.text.length);
  }
  findPointInside(e, t) {
    for (let i of this.points)
      (e.nodeType == 3 ? i.node == e : e.contains(i.node)) &&
        (i.pos = this.text.length + (yd(e, i.node, i.offset) ? t : 0));
  }
}
function yd(n, e, t) {
  for (;;) {
    if (!e || t < dt(e)) return !1;
    if (e == n) return !0;
    ((t = Ct(e) + 1), (e = e.parentNode));
  }
}
function bd(n, e) {
  let t;
  for (; !(n == e || !n); n = n.nextSibling) {
    let i = ie.get(n);
    if (!i?.isWidget()) return !1;
    i && (t || (t = [])).push(i);
  }
  if (t)
    for (let i of t) {
      let s = i.overrideDOMText;
      if (s?.length) return !1;
    }
  return !0;
}
class fl {
  constructor(e, t) {
    ((this.node = e), (this.offset = t), (this.pos = -1));
  }
}
class xd {
  constructor(e, t, i, s) {
    ((this.typeOver = s),
      (this.bounds = null),
      (this.text = ""),
      (this.domChanged = t > -1));
    let { impreciseHead: r, impreciseAnchor: o } = e.docView;
    if (e.state.readOnly && t > -1) this.newSel = null;
    else if (t > -1 && (this.bounds = zh(e.docView.tile, t, i, 0))) {
      let l = r || o ? [] : vd(e),
        a = new gd(l, e);
      (a.readRange(this.bounds.startDOM, this.bounds.endDOM),
        (this.text = a.text),
        (this.newSel = kd(l, this.bounds.from)));
    } else {
      let l = e.observer.selectionRange,
        a =
          (r && r.node == l.focusNode && r.offset == l.focusOffset) ||
          !wr(e.contentDOM, l.focusNode)
            ? e.state.selection.main.head
            : e.docView.posFromDOM(l.focusNode, l.focusOffset),
        h =
          (o && o.node == l.anchorNode && o.offset == l.anchorOffset) ||
          !wr(e.contentDOM, l.anchorNode)
            ? e.state.selection.main.anchor
            : e.docView.posFromDOM(l.anchorNode, l.anchorOffset),
        c = e.viewport;
      if (
        (O.ios || O.chrome) &&
        e.state.selection.main.empty &&
        a != h &&
        (c.from > 0 || c.to < e.state.doc.length)
      ) {
        let f = Math.min(a, h),
          u = Math.max(a, h),
          d = c.from - f,
          p = c.to - u;
        (d == 0 || d == 1 || f == 0) &&
          (p == 0 || p == -1 || u == e.state.doc.length) &&
          ((a = 0), (h = e.state.doc.length));
      }
      e.inputState.composing > -1 && e.state.selection.ranges.length > 1
        ? (this.newSel = e.state.selection.replaceRange(x.range(h, a)))
        : (this.newSel = x.single(h, a));
    }
  }
}
function zh(n, e, t, i) {
  if (n.isComposite()) {
    let s = -1,
      r = -1,
      o = -1,
      l = -1;
    for (let a = 0, h = i, c = i; a < n.children.length; a++) {
      let f = n.children[a],
        u = h + f.length;
      if (h < e && u > t) return zh(f, e, t, h);
      if (
        (u >= e && s == -1 && ((s = a), (r = h)),
        h > t && f.dom.parentNode == n.dom)
      ) {
        ((o = a), (l = c));
        break;
      }
      ((c = u), (h = u + f.breakAfter));
    }
    return {
      from: r,
      to: l < 0 ? i + n.length : l,
      startDOM:
        (s ? n.children[s - 1].dom.nextSibling : null) || n.dom.firstChild,
      endDOM: o < n.children.length && o >= 0 ? n.children[o].dom : null,
    };
  } else
    return n.isText()
      ? {
          from: i,
          to: i + n.length,
          startDOM: n.dom,
          endDOM: n.dom.nextSibling,
        }
      : null;
}
function _h(n, e) {
  let t,
    { newSel: i } = e,
    { state: s } = n,
    r = s.selection.main,
    o =
      n.inputState.lastKeyTime > Date.now() - 100
        ? n.inputState.lastKeyCode
        : -1;
  if (e.bounds) {
    let { from: l, to: a } = e.bounds,
      h = r.from,
      c = null;
    (o === 8 || (O.android && e.text.length < a - l)) &&
      ((h = r.to), (c = "end"));
    let f = s.doc.sliceString(l, a, jt),
      u,
      d;
    !r.empty &&
    r.from >= l &&
    r.to <= a &&
    (e.typeOver || f != e.text) &&
    f.slice(0, r.from - l) == e.text.slice(0, r.from - l) &&
    f.slice(r.to - l) ==
      e.text.slice((u = e.text.length - (f.length - (r.to - l))))
      ? (t = {
          from: r.from,
          to: r.to,
          insert: q.of(e.text.slice(r.from - l, u).split(jt)),
        })
      : (d = qh(f, e.text, h - l, c)) &&
        (O.chrome &&
          o == 13 &&
          d.toB == d.from + 2 &&
          e.text.slice(d.from, d.toB) == jt + jt &&
          d.toB--,
        (t = {
          from: l + d.from,
          to: l + d.toA,
          insert: q.of(e.text.slice(d.from, d.toB).split(jt)),
        }));
  } else i && ((!n.hasFocus && s.facet(ht)) || Jn(i, r)) && (i = null);
  if (!t && !i) return !1;
  if (
    ((O.mac || O.android) &&
    t &&
    t.from == t.to &&
    t.from == r.head - 1 &&
    /^\. ?$/.test(t.insert.toString()) &&
    n.contentDOM.getAttribute("autocorrect") == "off"
      ? (i &&
          t.insert.length == 2 &&
          (i = x.single(i.main.anchor - 1, i.main.head - 1)),
        (t = {
          from: t.from,
          to: t.to,
          insert: q.of([t.insert.toString().replace(".", " ")]),
        }))
      : s.doc.lineAt(r.from).to < r.to &&
          n.docView.lineHasWidget(r.to) &&
          n.inputState.insertingTextAt > Date.now() - 50
        ? (t = {
            from: r.from,
            to: r.to,
            insert: s.toText(n.inputState.insertingText),
          })
        : O.chrome &&
          t &&
          t.from == t.to &&
          t.from == r.head &&
          t.insert.toString() ==
            `
 ` &&
          n.lineWrapping &&
          (i && (i = x.single(i.main.anchor - 1, i.main.head - 1)),
          (t = { from: r.from, to: r.to, insert: q.of([" "]) })),
    t)
  )
    return ho(n, t, i, o);
  if (i && !Jn(i, r)) {
    let l = !1,
      a = "select";
    return (
      n.inputState.lastSelectionTime > Date.now() - 50 &&
        (n.inputState.lastSelectionOrigin == "select" && (l = !0),
        (a = n.inputState.lastSelectionOrigin),
        a == "select.pointer" &&
          (i = Vh(
            s.facet(en).map((h) => h(n)),
            i,
          ))),
      n.dispatch({ selection: i, scrollIntoView: l, userEvent: a }),
      !0
    );
  } else return !1;
}
function ho(n, e, t, i = -1) {
  if (O.ios && n.inputState.flushIOSKey(e)) return !0;
  let s = n.state.selection.main;
  if (
    O.android &&
    ((e.to == s.to &&
      (e.from == s.from ||
        (e.from == s.from - 1 && n.state.sliceDoc(e.from, s.from) == " ")) &&
      e.insert.length == 1 &&
      e.insert.lines == 2 &&
      ei(n.contentDOM, "Enter", 13)) ||
      (((e.from == s.from - 1 && e.to == s.to && e.insert.length == 0) ||
        (i == 8 && e.insert.length < e.to - e.from && e.to > s.head)) &&
        ei(n.contentDOM, "Backspace", 8)) ||
      (e.from == s.from &&
        e.to == s.to + 1 &&
        e.insert.length == 0 &&
        ei(n.contentDOM, "Delete", 46)))
  )
    return !0;
  let r = e.insert.toString();
  n.inputState.composing >= 0 && n.inputState.composing++;
  let o,
    l = () => o || (o = wd(n, e, t));
  return (
    n.state.facet(Dh).some((a) => a(n, e.from, e.to, r, l)) || n.dispatch(l()),
    !0
  );
}
function wd(n, e, t) {
  let i,
    s = n.state,
    r = s.selection.main,
    o = -1;
  if ((e.from == e.to && e.from < r.from) || e.from > r.to) {
    let a = e.from < r.from ? -1 : 1,
      h = a < 0 ? r.from : r.to,
      c = Bi(
        s.facet(en).map((f) => f(n)),
        h,
        a,
      );
    e.from == c && (o = c);
  }
  if (o > -1)
    i = { changes: e, selection: x.cursor(e.from + e.insert.length, -1) };
  else if (
    e.from >= r.from &&
    e.to <= r.to &&
    e.to - e.from >= (r.to - r.from) / 3 &&
    (!t || (t.main.empty && t.main.from == e.from + e.insert.length)) &&
    n.inputState.composing < 0
  ) {
    let a = r.from < e.from ? s.sliceDoc(r.from, e.from) : "",
      h = r.to > e.to ? s.sliceDoc(e.to, r.to) : "";
    i = s.replaceSelection(
      n.state.toText(
        a + e.insert.sliceString(0, void 0, n.state.lineBreak) + h,
      ),
    );
  } else {
    let a = s.changes(e),
      h = t && t.main.to <= a.newLength ? t.main : void 0;
    if (
      s.selection.ranges.length > 1 &&
      (n.inputState.composing >= 0 || n.inputState.compositionPendingChange) &&
      e.to <= r.to + 10 &&
      e.to >= r.to - 10
    ) {
      let c = n.state.sliceDoc(e.from, e.to),
        f,
        u = t && Hh(n, t.main.head);
      if (u) {
        let p = e.insert.length - (e.to - e.from);
        f = { from: u.from, to: u.to - p };
      } else f = n.state.doc.lineAt(r.head);
      let d = r.to - e.to;
      i = s.changeByRange((p) => {
        if (p.from == r.from && p.to == r.to)
          return { changes: a, range: h || p.map(a) };
        let m = p.to - d,
          g = m - c.length;
        if (n.state.sliceDoc(g, m) != c || (m >= f.from && g <= f.to))
          return { range: p };
        let b = s.changes({ from: g, to: m, insert: e.insert }),
          w = p.to - r.to;
        return {
          changes: b,
          range: h
            ? x.range(Math.max(0, h.anchor + w), Math.max(0, h.head + w))
            : p.map(b),
        };
      });
    } else i = { changes: a, selection: h && s.selection.replaceRange(h) };
  }
  let l = "input.type";
  return (
    (n.composing ||
      (n.inputState.compositionPendingChange &&
        n.inputState.compositionEndedAt > Date.now() - 50)) &&
      ((n.inputState.compositionPendingChange = !1),
      (l += ".compose"),
      n.inputState.compositionFirstChange &&
        ((l += ".start"), (n.inputState.compositionFirstChange = !1))),
    s.update(i, { userEvent: l, scrollIntoView: !0 })
  );
}
function qh(n, e, t, i) {
  let s = Math.min(n.length, e.length),
    r = 0;
  for (; r < s && n.charCodeAt(r) == e.charCodeAt(r); ) r++;
  if (r == s && n.length == e.length) return null;
  let o = n.length,
    l = e.length;
  for (; o > 0 && l > 0 && n.charCodeAt(o - 1) == e.charCodeAt(l - 1); )
    (o--, l--);
  if (i == "end") {
    let a = Math.max(0, r - Math.min(o, l));
    t -= o + a - r;
  }
  if (o < r && n.length < e.length) {
    let a = t <= r && t >= o ? r - t : 0;
    ((r -= a), (l = r + (l - o)), (o = r));
  } else if (l < r) {
    let a = t <= r && t >= l ? r - t : 0;
    ((r -= a), (o = r + (o - l)), (l = r));
  }
  return { from: r, toA: o, toB: l };
}
function vd(n) {
  let e = [];
  if (n.root.activeElement != n.contentDOM) return e;
  let {
    anchorNode: t,
    anchorOffset: i,
    focusNode: s,
    focusOffset: r,
  } = n.observer.selectionRange;
  return (
    t && (e.push(new fl(t, i)), (s != t || r != i) && e.push(new fl(s, r))),
    e
  );
}
function kd(n, e) {
  if (n.length == 0) return null;
  let t = n[0].pos,
    i = n.length == 2 ? n[1].pos : t;
  return t > -1 && i > -1 ? x.single(t + e, i + e) : null;
}
function Jn(n, e) {
  return e.head == n.main.head && e.anchor == n.main.anchor;
}
class Sd {
  setSelectionOrigin(e) {
    ((this.lastSelectionOrigin = e), (this.lastSelectionTime = Date.now()));
  }
  constructor(e) {
    ((this.view = e),
      (this.lastKeyCode = 0),
      (this.lastKeyTime = 0),
      (this.lastTouchTime = 0),
      (this.lastFocusTime = 0),
      (this.lastScrollTop = 0),
      (this.lastScrollLeft = 0),
      (this.lastWheelEvent = 0),
      (this.pendingIOSKey = void 0),
      (this.tabFocusMode = -1),
      (this.lastSelectionOrigin = null),
      (this.lastSelectionTime = 0),
      (this.lastContextMenu = 0),
      (this.scrollHandlers = []),
      (this.handlers = Object.create(null)),
      (this.composing = -1),
      (this.compositionFirstChange = null),
      (this.compositionEndedAt = 0),
      (this.compositionPendingKey = !1),
      (this.compositionPendingChange = !1),
      (this.insertingText = ""),
      (this.insertingTextAt = 0),
      (this.mouseSelection = null),
      (this.draggedContent = null),
      (this.handleEvent = this.handleEvent.bind(this)),
      (this.notifiedFocused = e.hasFocus),
      O.safari && e.contentDOM.addEventListener("input", () => null),
      O.gecko && Fd(e.contentDOM.ownerDocument));
  }
  handleEvent(e) {
    !Ed(this.view, e) ||
      this.ignoreDuringComposition(e) ||
      (e.type == "keydown" && this.keydown(e)) ||
      (this.view.updateState != 0
        ? Promise.resolve().then(() => this.runHandlers(e.type, e))
        : this.runHandlers(e.type, e));
  }
  runHandlers(e, t) {
    let i = this.handlers[e];
    if (i) {
      for (let s of i.observers) s(this.view, t);
      for (let s of i.handlers) {
        if (t.defaultPrevented) break;
        if (s(this.view, t)) {
          t.preventDefault();
          break;
        }
      }
    }
  }
  ensureHandlers(e) {
    let t = Cd(e),
      i = this.handlers,
      s = this.view.contentDOM;
    for (let r in t)
      if (r != "scroll") {
        let o = !t[r].handlers.length,
          l = i[r];
        (l &&
          o != !l.handlers.length &&
          (s.removeEventListener(r, this.handleEvent), (l = null)),
          l || s.addEventListener(r, this.handleEvent, { passive: o }));
      }
    for (let r in i)
      r != "scroll" && !t[r] && s.removeEventListener(r, this.handleEvent);
    this.handlers = t;
  }
  keydown(e) {
    if (
      ((this.lastKeyCode = e.keyCode),
      (this.lastKeyTime = Date.now()),
      e.keyCode == 9 &&
        this.tabFocusMode > -1 &&
        (!this.tabFocusMode || Date.now() <= this.tabFocusMode))
    )
      return !0;
    if (
      (this.tabFocusMode > 0 &&
        e.keyCode != 27 &&
        Kh.indexOf(e.keyCode) < 0 &&
        (this.tabFocusMode = -1),
      O.android &&
        O.chrome &&
        !e.synthetic &&
        (e.keyCode == 13 || e.keyCode == 8))
    )
      return (this.view.observer.delayAndroidKey(e.key, e.keyCode), !0);
    let t;
    return O.ios &&
      !e.synthetic &&
      !e.altKey &&
      !e.metaKey &&
      (((t = $h.find((i) => i.keyCode == e.keyCode)) && !e.ctrlKey) ||
        (Ad.indexOf(e.key) > -1 && e.ctrlKey && !e.shiftKey))
      ? ((this.pendingIOSKey = t || e),
        setTimeout(() => this.flushIOSKey(), 250),
        !0)
      : (e.keyCode != 229 && this.view.observer.forceFlush(), !1);
  }
  flushIOSKey(e) {
    let t = this.pendingIOSKey;
    return !t ||
      (t.key == "Enter" &&
        e &&
        e.from < e.to &&
        /^\S+$/.test(e.insert.toString()))
      ? !1
      : ((this.pendingIOSKey = void 0),
        ei(
          this.view.contentDOM,
          t.key,
          t.keyCode,
          t instanceof KeyboardEvent ? t : void 0,
        ));
  }
  ignoreDuringComposition(e) {
    return !/^key/.test(e.type) || e.synthetic
      ? !1
      : this.composing > 0
        ? !0
        : O.safari &&
            !O.ios &&
            this.compositionPendingKey &&
            Date.now() - this.compositionEndedAt < 100
          ? ((this.compositionPendingKey = !1), !0)
          : !1;
  }
  startMouseSelection(e) {
    (this.mouseSelection && this.mouseSelection.destroy(),
      (this.mouseSelection = e));
  }
  update(e) {
    (this.view.observer.update(e),
      this.mouseSelection && this.mouseSelection.update(e),
      this.draggedContent &&
        e.docChanged &&
        (this.draggedContent = this.draggedContent.map(e.changes)),
      e.transactions.length && (this.lastKeyCode = this.lastSelectionTime = 0));
  }
  destroy() {
    this.mouseSelection && this.mouseSelection.destroy();
  }
}
function ul(n, e) {
  return (t, i) => {
    try {
      return e.call(n, i, t);
    } catch (s) {
      De(t.state, s);
    }
  };
}
function Cd(n) {
  let e = Object.create(null);
  function t(i) {
    return e[i] || (e[i] = { observers: [], handlers: [] });
  }
  for (let i of n) {
    let s = i.spec,
      r = s && s.plugin.domEventHandlers,
      o = s && s.plugin.domEventObservers;
    if (r)
      for (let l in r) {
        let a = r[l];
        a && t(l).handlers.push(ul(i.value, a));
      }
    if (o)
      for (let l in o) {
        let a = o[l];
        a && t(l).observers.push(ul(i.value, a));
      }
  }
  for (let i in $e) t(i).handlers.push($e[i]);
  for (let i in Be) t(i).observers.push(Be[i]);
  return e;
}
const $h = [
    { key: "Backspace", keyCode: 8, inputType: "deleteContentBackward" },
    { key: "Enter", keyCode: 13, inputType: "insertParagraph" },
    { key: "Enter", keyCode: 13, inputType: "insertLineBreak" },
    { key: "Delete", keyCode: 46, inputType: "deleteContentForward" },
  ],
  Ad = "dthko",
  Kh = [16, 17, 18, 20, 91, 92, 224, 225],
  pn = 6;
function mn(n) {
  return Math.max(0, n) * 0.7 + 8;
}
function Md(n, e) {
  return Math.max(
    Math.abs(n.clientX - e.clientX),
    Math.abs(n.clientY - e.clientY),
  );
}
class Td {
  constructor(e, t, i, s) {
    ((this.view = e),
      (this.startEvent = t),
      (this.style = i),
      (this.mustSelect = s),
      (this.scrollSpeed = { x: 0, y: 0 }),
      (this.scrolling = -1),
      (this.lastEvent = t),
      (this.scrollParents = ph(e.contentDOM)),
      (this.atoms = e.state.facet(en).map((o) => o(e))));
    let r = e.contentDOM.ownerDocument;
    (r.addEventListener("mousemove", (this.move = this.move.bind(this))),
      r.addEventListener("mouseup", (this.up = this.up.bind(this))),
      (this.extend = t.shiftKey),
      (this.multiple = e.state.facet(_.allowMultipleSelections) && Dd(e, t)),
      (this.dragging = Bd(e, t) && Gh(t) == 1 ? null : !1));
  }
  start(e) {
    this.dragging === !1 && this.select(e);
  }
  move(e) {
    if (e.buttons == 0) return this.destroy();
    if (this.dragging || (this.dragging == null && Md(this.startEvent, e) < 10))
      return;
    this.select((this.lastEvent = e));
    let t = 0,
      i = 0,
      s = 0,
      r = 0,
      o = this.view.win.innerWidth,
      l = this.view.win.innerHeight;
    (this.scrollParents.x &&
      ({ left: s, right: o } = this.scrollParents.x.getBoundingClientRect()),
      this.scrollParents.y &&
        ({ top: r, bottom: l } = this.scrollParents.y.getBoundingClientRect()));
    let a = ao(this.view);
    (e.clientX - a.left <= s + pn
      ? (t = -mn(s - e.clientX))
      : e.clientX + a.right >= o - pn && (t = mn(e.clientX - o)),
      e.clientY - a.top <= r + pn
        ? (i = -mn(r - e.clientY))
        : e.clientY + a.bottom >= l - pn && (i = mn(e.clientY - l)),
      this.setScrollSpeed(t, i));
  }
  up(e) {
    (this.dragging == null && this.select(this.lastEvent),
      this.dragging || e.preventDefault(),
      this.destroy());
  }
  destroy() {
    this.setScrollSpeed(0, 0);
    let e = this.view.contentDOM.ownerDocument;
    (e.removeEventListener("mousemove", this.move),
      e.removeEventListener("mouseup", this.up),
      (this.view.inputState.mouseSelection =
        this.view.inputState.draggedContent =
          null));
  }
  setScrollSpeed(e, t) {
    ((this.scrollSpeed = { x: e, y: t }),
      e || t
        ? this.scrolling < 0 &&
          (this.scrolling = setInterval(() => this.scroll(), 50))
        : this.scrolling > -1 &&
          (clearInterval(this.scrolling), (this.scrolling = -1)));
  }
  scroll() {
    let { x: e, y: t } = this.scrollSpeed;
    (e &&
      this.scrollParents.x &&
      ((this.scrollParents.x.scrollLeft += e), (e = 0)),
      t &&
        this.scrollParents.y &&
        ((this.scrollParents.y.scrollTop += t), (t = 0)),
      (e || t) && this.view.win.scrollBy(e, t),
      this.dragging === !1 && this.select(this.lastEvent));
  }
  select(e) {
    let { view: t } = this,
      i = Vh(this.atoms, this.style.get(e, this.extend, this.multiple));
    ((this.mustSelect || !i.eq(t.state.selection, this.dragging === !1)) &&
      this.view.dispatch({ selection: i, userEvent: "select.pointer" }),
      (this.mustSelect = !1));
  }
  update(e) {
    e.transactions.some((t) => t.isUserEvent("input.type"))
      ? this.destroy()
      : this.style.update(e) &&
        setTimeout(() => this.select(this.lastEvent), 20);
  }
}
function Dd(n, e) {
  let t = n.state.facet(Ch);
  return t.length ? t[0](e) : O.mac ? e.metaKey : e.ctrlKey;
}
function Od(n, e) {
  let t = n.state.facet(Ah);
  return t.length ? t[0](e) : O.mac ? !e.altKey : !e.ctrlKey;
}
function Bd(n, e) {
  let { main: t } = n.state.selection;
  if (t.empty) return !1;
  let i = Ni(n.root);
  if (!i || i.rangeCount == 0) return !0;
  let s = i.getRangeAt(0).getClientRects();
  for (let r = 0; r < s.length; r++) {
    let o = s[r];
    if (
      o.left <= e.clientX &&
      o.right >= e.clientX &&
      o.top <= e.clientY &&
      o.bottom >= e.clientY
    )
      return !0;
  }
  return !1;
}
function Ed(n, e) {
  if (!e.bubbles) return !0;
  if (e.defaultPrevented) return !1;
  for (let t = e.target, i; t != n.contentDOM; t = t.parentNode)
    if (
      !t ||
      t.nodeType == 11 ||
      ((i = ie.get(t)) &&
        i.isWidget() &&
        !i.isHidden &&
        i.widget.ignoreEvent(e))
    )
      return !1;
  return !0;
}
const $e = Object.create(null),
  Be = Object.create(null),
  jh = (O.ie && O.ie_version < 15) || (O.ios && O.webkit_version < 604);
function Ld(n) {
  let e = n.dom.parentNode;
  if (!e) return;
  let t = e.appendChild(document.createElement("textarea"));
  ((t.style.cssText = "position: fixed; left: -10000px; top: 10px"),
    t.focus(),
    setTimeout(() => {
      (n.focus(), t.remove(), Uh(n, t.value));
    }, 50));
}
function gs(n, e, t) {
  for (let i of n.facet(e)) t = i(t, n);
  return t;
}
function Uh(n, e) {
  e = gs(n.state, so, e);
  let { state: t } = n,
    i,
    s = 1,
    r = t.toText(e),
    o = r.lines == t.selection.ranges.length;
  if (
    Dr != null &&
    t.selection.ranges.every((a) => a.empty) &&
    Dr == r.toString()
  ) {
    let a = -1;
    i = t.changeByRange((h) => {
      let c = t.doc.lineAt(h.from);
      if (c.from == a) return { range: h };
      a = c.from;
      let f = t.toText((o ? r.line(s++).text : e) + t.lineBreak);
      return {
        changes: { from: c.from, insert: f },
        range: x.cursor(h.from + f.length),
      };
    });
  } else
    o
      ? (i = t.changeByRange((a) => {
          let h = r.line(s++);
          return {
            changes: { from: a.from, to: a.to, insert: h.text },
            range: x.cursor(a.from + h.length),
          };
        }))
      : (i = t.replaceSelection(r));
  n.dispatch(i, { userEvent: "input.paste", scrollIntoView: !0 });
}
Be.scroll = (n) => {
  ((n.inputState.lastScrollTop = n.scrollDOM.scrollTop),
    (n.inputState.lastScrollLeft = n.scrollDOM.scrollLeft));
};
Be.wheel = Be.mousewheel = (n) => {
  n.inputState.lastWheelEvent = Date.now();
};
$e.keydown = (n, e) => (
  n.inputState.setSelectionOrigin("select"),
  e.keyCode == 27 &&
    n.inputState.tabFocusMode != 0 &&
    (n.inputState.tabFocusMode = Date.now() + 2e3),
  !1
);
Be.touchstart = (n, e) => {
  ((n.inputState.lastTouchTime = Date.now()),
    n.inputState.setSelectionOrigin("select.pointer"));
};
Be.touchmove = (n) => {
  n.inputState.setSelectionOrigin("select.pointer");
};
$e.mousedown = (n, e) => {
  if ((n.observer.flush(), n.inputState.lastTouchTime > Date.now() - 2e3))
    return !1;
  let t = null;
  for (let i of n.state.facet(Mh)) if (((t = i(n, e)), t)) break;
  if ((!t && e.button == 0 && (t = Rd(n, e)), t)) {
    let i = !n.hasFocus;
    (n.inputState.startMouseSelection(new Td(n, e, t, i)),
      i &&
        n.observer.ignore(() => {
          mh(n.contentDOM);
          let r = n.root.activeElement;
          r && !r.contains(n.contentDOM) && r.blur();
        }));
    let s = n.inputState.mouseSelection;
    if (s) return (s.start(e), s.dragging === !1);
  } else n.inputState.setSelectionOrigin("select.pointer");
  return !1;
};
function dl(n, e, t, i) {
  if (i == 1) return x.cursor(e, t);
  if (i == 2) return cd(n.state, e, t);
  {
    let s = n.docView.lineAt(e, t),
      r = n.state.doc.lineAt(s ? s.posAtEnd : e),
      o = s ? s.posAtStart : r.from,
      l = s ? s.posAtEnd : r.to;
    return (l < n.state.doc.length && l == r.to && l++, x.range(o, l));
  }
}
const Pd = O.ie && O.ie_version <= 11;
let pl = null,
  ml = 0,
  gl = 0;
function Gh(n) {
  if (!Pd) return n.detail;
  let e = pl,
    t = gl;
  return (
    (pl = n),
    (gl = Date.now()),
    (ml =
      !e ||
      (t > Date.now() - 400 &&
        Math.abs(e.clientX - n.clientX) < 2 &&
        Math.abs(e.clientY - n.clientY) < 2)
        ? (ml + 1) % 3
        : 1)
  );
}
function Rd(n, e) {
  let t = n.posAndSideAtCoords({ x: e.clientX, y: e.clientY }, !1),
    i = Gh(e),
    s = n.state.selection;
  return {
    update(r) {
      r.docChanged &&
        ((t.pos = r.changes.mapPos(t.pos)), (s = s.map(r.changes)));
    },
    get(r, o, l) {
      let a = n.posAndSideAtCoords({ x: r.clientX, y: r.clientY }, !1),
        h,
        c = dl(n, a.pos, a.assoc, i);
      if (t.pos != a.pos && !o) {
        let f = dl(n, t.pos, t.assoc, i),
          u = Math.min(f.from, c.from),
          d = Math.max(f.to, c.to);
        c = u < c.from ? x.range(u, d) : x.range(d, u);
      }
      return o
        ? s.replaceRange(s.main.extend(c.from, c.to))
        : l && i == 1 && s.ranges.length > 1 && (h = Id(s, a.pos))
          ? h
          : l
            ? s.addRange(c)
            : x.create([c]);
    },
  };
}
function Id(n, e) {
  for (let t = 0; t < n.ranges.length; t++) {
    let { from: i, to: s } = n.ranges[t];
    if (i <= e && s >= e)
      return x.create(
        n.ranges.slice(0, t).concat(n.ranges.slice(t + 1)),
        n.mainIndex == t ? 0 : n.mainIndex - (n.mainIndex > t ? 1 : 0),
      );
  }
  return null;
}
$e.dragstart = (n, e) => {
  let {
    selection: { main: t },
  } = n.state;
  if (e.target.draggable) {
    let s = n.docView.tile.nearest(e.target);
    if (s && s.isWidget()) {
      let r = s.posAtStart,
        o = r + s.length;
      (r >= t.to || o <= t.from) && (t = x.range(r, o));
    }
  }
  let { inputState: i } = n;
  return (
    i.mouseSelection && (i.mouseSelection.dragging = !0),
    (i.draggedContent = t),
    e.dataTransfer &&
      (e.dataTransfer.setData(
        "Text",
        gs(n.state, ro, n.state.sliceDoc(t.from, t.to)),
      ),
      (e.dataTransfer.effectAllowed = "copyMove")),
    !1
  );
};
$e.dragend = (n) => ((n.inputState.draggedContent = null), !1);
function yl(n, e, t, i) {
  if (((t = gs(n.state, so, t)), !t)) return;
  let s = n.posAtCoords({ x: e.clientX, y: e.clientY }, !1),
    { draggedContent: r } = n.inputState,
    o = i && r && Od(n, e) ? { from: r.from, to: r.to } : null,
    l = { from: s, insert: t },
    a = n.state.changes(o ? [o, l] : l);
  (n.focus(),
    n.dispatch({
      changes: a,
      selection: { anchor: a.mapPos(s, -1), head: a.mapPos(s, 1) },
      userEvent: o ? "move.drop" : "input.drop",
    }),
    (n.inputState.draggedContent = null));
}
$e.drop = (n, e) => {
  if (!e.dataTransfer) return !1;
  if (n.state.readOnly) return !0;
  let t = e.dataTransfer.files;
  if (t && t.length) {
    let i = Array(t.length),
      s = 0,
      r = () => {
        ++s == t.length &&
          yl(n, e, i.filter((o) => o != null).join(n.state.lineBreak), !1);
      };
    for (let o = 0; o < t.length; o++) {
      let l = new FileReader();
      ((l.onerror = r),
        (l.onload = () => {
          (/[\x00-\x08\x0e-\x1f]{2}/.test(l.result) || (i[o] = l.result), r());
        }),
        l.readAsText(t[o]));
    }
    return !0;
  } else {
    let i = e.dataTransfer.getData("Text");
    if (i) return (yl(n, e, i, !0), !0);
  }
  return !1;
};
$e.paste = (n, e) => {
  if (n.state.readOnly) return !0;
  n.observer.flush();
  let t = jh ? null : e.clipboardData;
  return t
    ? (Uh(n, t.getData("text/plain") || t.getData("text/uri-list")), !0)
    : (Ld(n), !1);
};
function Nd(n, e) {
  let t = n.dom.parentNode;
  if (!t) return;
  let i = t.appendChild(document.createElement("textarea"));
  ((i.style.cssText = "position: fixed; left: -10000px; top: 10px"),
    (i.value = e),
    i.focus(),
    (i.selectionEnd = e.length),
    (i.selectionStart = 0),
    setTimeout(() => {
      (i.remove(), n.focus());
    }, 50));
}
function Wd(n) {
  let e = [],
    t = [],
    i = !1;
  for (let s of n.selection.ranges)
    s.empty || (e.push(n.sliceDoc(s.from, s.to)), t.push(s));
  if (!e.length) {
    let s = -1;
    for (let { from: r } of n.selection.ranges) {
      let o = n.doc.lineAt(r);
      (o.number > s &&
        (e.push(o.text),
        t.push({ from: o.from, to: Math.min(n.doc.length, o.to + 1) })),
        (s = o.number));
    }
    i = !0;
  }
  return { text: gs(n, ro, e.join(n.lineBreak)), ranges: t, linewise: i };
}
let Dr = null;
$e.copy = $e.cut = (n, e) => {
  if (!Ti(n.contentDOM, n.observer.selectionRange)) return !1;
  let { text: t, ranges: i, linewise: s } = Wd(n.state);
  if (!t && !s) return !1;
  ((Dr = s ? t : null),
    e.type == "cut" &&
      !n.state.readOnly &&
      n.dispatch({ changes: i, scrollIntoView: !0, userEvent: "delete.cut" }));
  let r = jh ? null : e.clipboardData;
  return r ? (r.clearData(), r.setData("text/plain", t), !0) : (Nd(n, t), !1);
};
const Jh = lt.define();
function Yh(n, e) {
  let t = [];
  for (let i of n.facet(Oh)) {
    let s = i(n, e);
    s && t.push(s);
  }
  return t.length ? n.update({ effects: t, annotations: Jh.of(!0) }) : null;
}
function Xh(n) {
  setTimeout(() => {
    let e = n.hasFocus;
    if (e != n.inputState.notifiedFocused) {
      let t = Yh(n.state, e);
      t ? n.dispatch(t) : n.update([]);
    }
  }, 10);
}
Be.focus = (n) => {
  ((n.inputState.lastFocusTime = Date.now()),
    !n.scrollDOM.scrollTop &&
      (n.inputState.lastScrollTop || n.inputState.lastScrollLeft) &&
      ((n.scrollDOM.scrollTop = n.inputState.lastScrollTop),
      (n.scrollDOM.scrollLeft = n.inputState.lastScrollLeft)),
    Xh(n));
};
Be.blur = (n) => {
  (n.observer.clearSelectionRange(), Xh(n));
};
Be.compositionstart = Be.compositionupdate = (n) => {
  n.observer.editContext ||
    (n.inputState.compositionFirstChange == null &&
      (n.inputState.compositionFirstChange = !0),
    n.inputState.composing < 0 && (n.inputState.composing = 0));
};
Be.compositionend = (n) => {
  n.observer.editContext ||
    ((n.inputState.composing = -1),
    (n.inputState.compositionEndedAt = Date.now()),
    (n.inputState.compositionPendingKey = !0),
    (n.inputState.compositionPendingChange =
      n.observer.pendingRecords().length > 0),
    (n.inputState.compositionFirstChange = null),
    O.chrome && O.android
      ? n.observer.flushSoon()
      : n.inputState.compositionPendingChange
        ? Promise.resolve().then(() => n.observer.flush())
        : setTimeout(() => {
            n.inputState.composing < 0 &&
              n.docView.hasComposition &&
              n.update([]);
          }, 50));
};
Be.contextmenu = (n) => {
  n.inputState.lastContextMenu = Date.now();
};
$e.beforeinput = (n, e) => {
  var t, i;
  if (
    ((e.inputType == "insertText" || e.inputType == "insertCompositionText") &&
      ((n.inputState.insertingText = e.data),
      (n.inputState.insertingTextAt = Date.now())),
    e.inputType == "insertReplacementText" && n.observer.editContext)
  ) {
    let r =
        (t = e.dataTransfer) === null || t === void 0
          ? void 0
          : t.getData("text/plain"),
      o = e.getTargetRanges();
    if (r && o.length) {
      let l = o[0],
        a = n.posAtDOM(l.startContainer, l.startOffset),
        h = n.posAtDOM(l.endContainer, l.endOffset);
      return (ho(n, { from: a, to: h, insert: n.state.toText(r) }, null), !0);
    }
  }
  let s;
  if (
    O.chrome &&
    O.android &&
    (s = $h.find((r) => r.inputType == e.inputType)) &&
    (n.observer.delayAndroidKey(s.key, s.keyCode),
    s.key == "Backspace" || s.key == "Delete")
  ) {
    let r =
      ((i = window.visualViewport) === null || i === void 0
        ? void 0
        : i.height) || 0;
    setTimeout(() => {
      var o;
      (((o = window.visualViewport) === null || o === void 0
        ? void 0
        : o.height) || 0) >
        r + 10 &&
        n.hasFocus &&
        (n.contentDOM.blur(), n.focus());
    }, 100);
  }
  return (
    O.ios && e.inputType == "deleteContentForward" && n.observer.flushSoon(),
    O.safari &&
      e.inputType == "insertText" &&
      n.inputState.composing >= 0 &&
      setTimeout(() => Be.compositionend(n, e), 20),
    !1
  );
};
const bl = new Set();
function Fd(n) {
  bl.has(n) ||
    (bl.add(n),
    n.addEventListener("copy", () => {}),
    n.addEventListener("cut", () => {}));
}
const xl = ["pre-wrap", "normal", "pre-line", "break-spaces"];
let ai = !1;
function wl() {
  ai = !1;
}
class Hd {
  constructor(e) {
    ((this.lineWrapping = e),
      (this.doc = q.empty),
      (this.heightSamples = {}),
      (this.lineHeight = 14),
      (this.charWidth = 7),
      (this.textHeight = 14),
      (this.lineLength = 30));
  }
  heightForGap(e, t) {
    let i = this.doc.lineAt(t).number - this.doc.lineAt(e).number + 1;
    return (
      this.lineWrapping &&
        (i += Math.max(
          0,
          Math.ceil((t - e - i * this.lineLength * 0.5) / this.lineLength),
        )),
      this.lineHeight * i
    );
  }
  heightForLine(e) {
    return this.lineWrapping
      ? (1 +
          Math.max(
            0,
            Math.ceil((e - this.lineLength) / Math.max(1, this.lineLength - 5)),
          )) *
          this.lineHeight
      : this.lineHeight;
  }
  setDoc(e) {
    return ((this.doc = e), this);
  }
  mustRefreshForWrapping(e) {
    return xl.indexOf(e) > -1 != this.lineWrapping;
  }
  mustRefreshForHeights(e) {
    let t = !1;
    for (let i = 0; i < e.length; i++) {
      let s = e[i];
      s < 0
        ? i++
        : this.heightSamples[Math.floor(s * 10)] ||
          ((t = !0), (this.heightSamples[Math.floor(s * 10)] = !0));
    }
    return t;
  }
  refresh(e, t, i, s, r, o) {
    let l = xl.indexOf(e) > -1,
      a =
        Math.abs(t - this.lineHeight) > 0.3 ||
        this.lineWrapping != l ||
        Math.abs(i - this.charWidth) > 0.1;
    if (
      ((this.lineWrapping = l),
      (this.lineHeight = t),
      (this.charWidth = i),
      (this.textHeight = s),
      (this.lineLength = r),
      a)
    ) {
      this.heightSamples = {};
      for (let h = 0; h < o.length; h++) {
        let c = o[h];
        c < 0 ? h++ : (this.heightSamples[Math.floor(c * 10)] = !0);
      }
    }
    return a;
  }
}
class Vd {
  constructor(e, t) {
    ((this.from = e), (this.heights = t), (this.index = 0));
  }
  get more() {
    return this.index < this.heights.length;
  }
}
class _e {
  constructor(e, t, i, s, r) {
    ((this.from = e),
      (this.length = t),
      (this.top = i),
      (this.height = s),
      (this._content = r));
  }
  get type() {
    return typeof this._content == "number"
      ? me.Text
      : Array.isArray(this._content)
        ? this._content
        : this._content.type;
  }
  get to() {
    return this.from + this.length;
  }
  get bottom() {
    return this.top + this.height;
  }
  get widget() {
    return this._content instanceof Vt ? this._content.widget : null;
  }
  get widgetLineBreaks() {
    return typeof this._content == "number" ? this._content : 0;
  }
  join(e) {
    let t = (Array.isArray(this._content) ? this._content : [this]).concat(
      Array.isArray(e._content) ? e._content : [e],
    );
    return new _e(
      this.from,
      this.length + e.length,
      this.top,
      this.height + e.height,
      t,
    );
  }
}
var Y = (function (n) {
  return (
    (n[(n.ByPos = 0)] = "ByPos"),
    (n[(n.ByHeight = 1)] = "ByHeight"),
    (n[(n.ByPosNoHeight = 2)] = "ByPosNoHeight"),
    n
  );
})(Y || (Y = {}));
const In = 0.001;
class Se {
  constructor(e, t, i = 2) {
    ((this.length = e), (this.height = t), (this.flags = i));
  }
  get outdated() {
    return (this.flags & 2) > 0;
  }
  set outdated(e) {
    this.flags = (e ? 2 : 0) | (this.flags & -3);
  }
  setHeight(e) {
    this.height != e &&
      (Math.abs(this.height - e) > In && (ai = !0), (this.height = e));
  }
  replace(e, t, i) {
    return Se.of(i);
  }
  decomposeLeft(e, t) {
    t.push(this);
  }
  decomposeRight(e, t) {
    t.push(this);
  }
  applyChanges(e, t, i, s) {
    let r = this,
      o = i.doc;
    for (let l = s.length - 1; l >= 0; l--) {
      let { fromA: a, toA: h, fromB: c, toB: f } = s[l],
        u = r.lineAt(a, Y.ByPosNoHeight, i.setDoc(t), 0, 0),
        d = u.to >= h ? u : r.lineAt(h, Y.ByPosNoHeight, i, 0, 0);
      for (f += d.to - h, h = d.to; l > 0 && u.from <= s[l - 1].toA; )
        ((a = s[l - 1].fromA),
          (c = s[l - 1].fromB),
          l--,
          a < u.from && (u = r.lineAt(a, Y.ByPosNoHeight, i, 0, 0)));
      ((c += u.from - a), (a = u.from));
      let p = co.build(i.setDoc(o), e, c, f);
      r = Yn(r, r.replace(a, h, p));
    }
    return r.updateHeight(i, 0);
  }
  static empty() {
    return new Le(0, 0, 0);
  }
  static of(e) {
    if (e.length == 1) return e[0];
    let t = 0,
      i = e.length,
      s = 0,
      r = 0;
    for (;;)
      if (t == i)
        if (s > r * 2) {
          let l = e[t - 1];
          (l.break
            ? e.splice(--t, 1, l.left, null, l.right)
            : e.splice(--t, 1, l.left, l.right),
            (i += 1 + l.break),
            (s -= l.size));
        } else if (r > s * 2) {
          let l = e[i];
          (l.break
            ? e.splice(i, 1, l.left, null, l.right)
            : e.splice(i, 1, l.left, l.right),
            (i += 2 + l.break),
            (r -= l.size));
        } else break;
      else if (s < r) {
        let l = e[t++];
        l && (s += l.size);
      } else {
        let l = e[--i];
        l && (r += l.size);
      }
    let o = 0;
    return (
      e[t - 1] == null ? ((o = 1), t--) : e[t] == null && ((o = 1), i++),
      new _d(Se.of(e.slice(0, t)), o, Se.of(e.slice(i)))
    );
  }
}
function Yn(n, e) {
  return n == e ? n : (n.constructor != e.constructor && (ai = !0), e);
}
Se.prototype.size = 1;
const zd = L.replace({});
class Qh extends Se {
  constructor(e, t, i) {
    (super(e, t), (this.deco = i), (this.spaceAbove = 0));
  }
  mainBlock(e, t) {
    return new _e(
      t,
      this.length,
      e + this.spaceAbove,
      this.height - this.spaceAbove,
      this.deco || 0,
    );
  }
  blockAt(e, t, i, s) {
    return this.spaceAbove && e < i + this.spaceAbove
      ? new _e(s, 0, i, this.spaceAbove, zd)
      : this.mainBlock(i, s);
  }
  lineAt(e, t, i, s, r) {
    let o = this.mainBlock(s, r);
    return this.spaceAbove ? this.blockAt(0, i, s, r).join(o) : o;
  }
  forEachLine(e, t, i, s, r, o) {
    e <= r + this.length && t >= r && o(this.lineAt(0, Y.ByPos, i, s, r));
  }
  setMeasuredHeight(e) {
    let t = e.heights[e.index++];
    (t < 0
      ? ((this.spaceAbove = -t), (t = e.heights[e.index++]))
      : (this.spaceAbove = 0),
      this.setHeight(t));
  }
  updateHeight(e, t = 0, i = !1, s) {
    return (
      s && s.from <= t && s.more && this.setMeasuredHeight(s),
      (this.outdated = !1),
      this
    );
  }
  toString() {
    return `block(${this.length})`;
  }
}
class Le extends Qh {
  constructor(e, t, i) {
    (super(e, t, null),
      (this.collapsed = 0),
      (this.widgetHeight = 0),
      (this.breaks = 0),
      (this.spaceAbove = i));
  }
  mainBlock(e, t) {
    return new _e(
      t,
      this.length,
      e + this.spaceAbove,
      this.height - this.spaceAbove,
      this.breaks,
    );
  }
  replace(e, t, i) {
    let s = i[0];
    return i.length == 1 &&
      (s instanceof Le || (s instanceof ue && s.flags & 4)) &&
      Math.abs(this.length - s.length) < 10
      ? (s instanceof ue
          ? (s = new Le(s.length, this.height, this.spaceAbove))
          : (s.height = this.height),
        this.outdated || (s.outdated = !1),
        s)
      : Se.of(i);
  }
  updateHeight(e, t = 0, i = !1, s) {
    return (
      s && s.from <= t && s.more
        ? this.setMeasuredHeight(s)
        : (i || this.outdated) &&
          ((this.spaceAbove = 0),
          this.setHeight(
            Math.max(
              this.widgetHeight,
              e.heightForLine(this.length - this.collapsed),
            ) +
              this.breaks * e.lineHeight,
          )),
      (this.outdated = !1),
      this
    );
  }
  toString() {
    return `line(${this.length}${this.collapsed ? -this.collapsed : ""}${this.widgetHeight ? ":" + this.widgetHeight : ""})`;
  }
}
class ue extends Se {
  constructor(e) {
    super(e, 0);
  }
  heightMetrics(e, t) {
    let i = e.doc.lineAt(t).number,
      s = e.doc.lineAt(t + this.length).number,
      r = s - i + 1,
      o,
      l = 0;
    if (e.lineWrapping) {
      let a = Math.min(this.height, e.lineHeight * r);
      ((o = a / r),
        this.length > r + 1 && (l = (this.height - a) / (this.length - r - 1)));
    } else o = this.height / r;
    return { firstLine: i, lastLine: s, perLine: o, perChar: l };
  }
  blockAt(e, t, i, s) {
    let {
      firstLine: r,
      lastLine: o,
      perLine: l,
      perChar: a,
    } = this.heightMetrics(t, s);
    if (t.lineWrapping) {
      let h =
          s +
          (e < t.lineHeight
            ? 0
            : Math.round(
                Math.max(0, Math.min(1, (e - i) / this.height)) * this.length,
              )),
        c = t.doc.lineAt(h),
        f = l + c.length * a,
        u = Math.max(i, e - f / 2);
      return new _e(c.from, c.length, u, f, 0);
    } else {
      let h = Math.max(0, Math.min(o - r, Math.floor((e - i) / l))),
        { from: c, length: f } = t.doc.line(r + h);
      return new _e(c, f, i + l * h, l, 0);
    }
  }
  lineAt(e, t, i, s, r) {
    if (t == Y.ByHeight) return this.blockAt(e, i, s, r);
    if (t == Y.ByPosNoHeight) {
      let { from: d, to: p } = i.doc.lineAt(e);
      return new _e(d, p - d, 0, 0, 0);
    }
    let { firstLine: o, perLine: l, perChar: a } = this.heightMetrics(i, r),
      h = i.doc.lineAt(e),
      c = l + h.length * a,
      f = h.number - o,
      u = s + l * f + a * (h.from - r - f);
    return new _e(
      h.from,
      h.length,
      Math.max(s, Math.min(u, s + this.height - c)),
      c,
      0,
    );
  }
  forEachLine(e, t, i, s, r, o) {
    ((e = Math.max(e, r)), (t = Math.min(t, r + this.length)));
    let { firstLine: l, perLine: a, perChar: h } = this.heightMetrics(i, r);
    for (let c = e, f = s; c <= t; ) {
      let u = i.doc.lineAt(c);
      if (c == e) {
        let p = u.number - l;
        f += a * p + h * (e - r - p);
      }
      let d = a + h * u.length;
      (o(new _e(u.from, u.length, f, d, 0)), (f += d), (c = u.to + 1));
    }
  }
  replace(e, t, i) {
    let s = this.length - t;
    if (s > 0) {
      let r = i[i.length - 1];
      r instanceof ue
        ? (i[i.length - 1] = new ue(r.length + s))
        : i.push(null, new ue(s - 1));
    }
    if (e > 0) {
      let r = i[0];
      r instanceof ue
        ? (i[0] = new ue(e + r.length))
        : i.unshift(new ue(e - 1), null);
    }
    return Se.of(i);
  }
  decomposeLeft(e, t) {
    t.push(new ue(e - 1), null);
  }
  decomposeRight(e, t) {
    t.push(null, new ue(this.length - e - 1));
  }
  updateHeight(e, t = 0, i = !1, s) {
    let r = t + this.length;
    if (s && s.from <= t + this.length && s.more) {
      let o = [],
        l = Math.max(t, s.from),
        a = -1;
      for (
        s.from > t && o.push(new ue(s.from - t - 1).updateHeight(e, t));
        l <= r && s.more;
      ) {
        let c = e.doc.lineAt(l).length;
        o.length && o.push(null);
        let f = s.heights[s.index++],
          u = 0;
        (f < 0 && ((u = -f), (f = s.heights[s.index++])),
          a == -1 ? (a = f) : Math.abs(f - a) >= In && (a = -2));
        let d = new Le(c, f, u);
        ((d.outdated = !1), o.push(d), (l += c + 1));
      }
      l <= r && o.push(null, new ue(r - l).updateHeight(e, l));
      let h = Se.of(o);
      return (
        (a < 0 ||
          Math.abs(h.height - this.height) >= In ||
          Math.abs(a - this.heightMetrics(e, t).perLine) >= In) &&
          (ai = !0),
        Yn(this, h)
      );
    } else
      (i || this.outdated) &&
        (this.setHeight(e.heightForGap(t, t + this.length)),
        (this.outdated = !1));
    return this;
  }
  toString() {
    return `gap(${this.length})`;
  }
}
class _d extends Se {
  constructor(e, t, i) {
    (super(
      e.length + t + i.length,
      e.height + i.height,
      t | (e.outdated || i.outdated ? 2 : 0),
    ),
      (this.left = e),
      (this.right = i),
      (this.size = e.size + i.size));
  }
  get break() {
    return this.flags & 1;
  }
  blockAt(e, t, i, s) {
    let r = i + this.left.height;
    return e < r
      ? this.left.blockAt(e, t, i, s)
      : this.right.blockAt(e, t, r, s + this.left.length + this.break);
  }
  lineAt(e, t, i, s, r) {
    let o = s + this.left.height,
      l = r + this.left.length + this.break,
      a = t == Y.ByHeight ? e < o : e < l,
      h = a
        ? this.left.lineAt(e, t, i, s, r)
        : this.right.lineAt(e, t, i, o, l);
    if (this.break || (a ? h.to < l : h.from > l)) return h;
    let c = t == Y.ByPosNoHeight ? Y.ByPosNoHeight : Y.ByPos;
    return a
      ? h.join(this.right.lineAt(l, c, i, o, l))
      : this.left.lineAt(l, c, i, s, r).join(h);
  }
  forEachLine(e, t, i, s, r, o) {
    let l = s + this.left.height,
      a = r + this.left.length + this.break;
    if (this.break)
      (e < a && this.left.forEachLine(e, t, i, s, r, o),
        t >= a && this.right.forEachLine(e, t, i, l, a, o));
    else {
      let h = this.lineAt(a, Y.ByPos, i, s, r);
      (e < h.from && this.left.forEachLine(e, h.from - 1, i, s, r, o),
        h.to >= e && h.from <= t && o(h),
        t > h.to && this.right.forEachLine(h.to + 1, t, i, l, a, o));
    }
  }
  replace(e, t, i) {
    let s = this.left.length + this.break;
    if (t < s) return this.balanced(this.left.replace(e, t, i), this.right);
    if (e > this.left.length)
      return this.balanced(this.left, this.right.replace(e - s, t - s, i));
    let r = [];
    e > 0 && this.decomposeLeft(e, r);
    let o = r.length;
    for (let l of i) r.push(l);
    if ((e > 0 && vl(r, o - 1), t < this.length)) {
      let l = r.length;
      (this.decomposeRight(t, r), vl(r, l));
    }
    return Se.of(r);
  }
  decomposeLeft(e, t) {
    let i = this.left.length;
    if (e <= i) return this.left.decomposeLeft(e, t);
    (t.push(this.left),
      this.break && (i++, e >= i && t.push(null)),
      e > i && this.right.decomposeLeft(e - i, t));
  }
  decomposeRight(e, t) {
    let i = this.left.length,
      s = i + this.break;
    if (e >= s) return this.right.decomposeRight(e - s, t);
    (e < i && this.left.decomposeRight(e, t),
      this.break && e < s && t.push(null),
      t.push(this.right));
  }
  balanced(e, t) {
    return e.size > 2 * t.size || t.size > 2 * e.size
      ? Se.of(this.break ? [e, null, t] : [e, t])
      : ((this.left = Yn(this.left, e)),
        (this.right = Yn(this.right, t)),
        this.setHeight(e.height + t.height),
        (this.outdated = e.outdated || t.outdated),
        (this.size = e.size + t.size),
        (this.length = e.length + this.break + t.length),
        this);
  }
  updateHeight(e, t = 0, i = !1, s) {
    let { left: r, right: o } = this,
      l = t + r.length + this.break,
      a = null;
    return (
      s && s.from <= t + r.length && s.more
        ? (a = r = r.updateHeight(e, t, i, s))
        : r.updateHeight(e, t, i),
      s && s.from <= l + o.length && s.more
        ? (a = o = o.updateHeight(e, l, i, s))
        : o.updateHeight(e, l, i),
      a
        ? this.balanced(r, o)
        : ((this.height = this.left.height + this.right.height),
          (this.outdated = !1),
          this)
    );
  }
  toString() {
    return this.left + (this.break ? " " : "-") + this.right;
  }
}
function vl(n, e) {
  let t, i;
  n[e] == null &&
    (t = n[e - 1]) instanceof ue &&
    (i = n[e + 1]) instanceof ue &&
    n.splice(e - 1, 3, new ue(t.length + 1 + i.length));
}
const qd = 5;
class co {
  constructor(e, t) {
    ((this.pos = e),
      (this.oracle = t),
      (this.nodes = []),
      (this.lineStart = -1),
      (this.lineEnd = -1),
      (this.covering = null),
      (this.writtenTo = e));
  }
  get isCovered() {
    return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
  }
  span(e, t) {
    if (this.lineStart > -1) {
      let i = Math.min(t, this.lineEnd),
        s = this.nodes[this.nodes.length - 1];
      (s instanceof Le
        ? (s.length += i - this.pos)
        : (i > this.pos || !this.isCovered) &&
          this.nodes.push(new Le(i - this.pos, -1, 0)),
        (this.writtenTo = i),
        t > i &&
          (this.nodes.push(null), this.writtenTo++, (this.lineStart = -1)));
    }
    this.pos = t;
  }
  point(e, t, i) {
    if (e < t || i.heightRelevant) {
      let s = i.widget ? i.widget.estimatedHeight : 0,
        r = i.widget ? i.widget.lineBreaks : 0;
      s < 0 && (s = this.oracle.lineHeight);
      let o = t - e;
      i.block
        ? this.addBlock(new Qh(o, s, i))
        : (o || r || s >= qd) && this.addLineDeco(s, r, o);
    } else t > e && this.span(e, t);
    this.lineEnd > -1 &&
      this.lineEnd < this.pos &&
      (this.lineEnd = this.oracle.doc.lineAt(this.pos).to);
  }
  enterLine() {
    if (this.lineStart > -1) return;
    let { from: e, to: t } = this.oracle.doc.lineAt(this.pos);
    ((this.lineStart = e),
      (this.lineEnd = t),
      this.writtenTo < e &&
        ((this.writtenTo < e - 1 ||
          this.nodes[this.nodes.length - 1] == null) &&
          this.nodes.push(this.blankContent(this.writtenTo, e - 1)),
        this.nodes.push(null)),
      this.pos > e && this.nodes.push(new Le(this.pos - e, -1, 0)),
      (this.writtenTo = this.pos));
  }
  blankContent(e, t) {
    let i = new ue(t - e);
    return (this.oracle.doc.lineAt(e).to == t && (i.flags |= 4), i);
  }
  ensureLine() {
    this.enterLine();
    let e = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
    if (e instanceof Le) return e;
    let t = new Le(0, -1, 0);
    return (this.nodes.push(t), t);
  }
  addBlock(e) {
    this.enterLine();
    let t = e.deco;
    (t && t.startSide > 0 && !this.isCovered && this.ensureLine(),
      this.nodes.push(e),
      (this.writtenTo = this.pos = this.pos + e.length),
      t && t.endSide > 0 && (this.covering = e));
  }
  addLineDeco(e, t, i) {
    let s = this.ensureLine();
    ((s.length += i),
      (s.collapsed += i),
      (s.widgetHeight = Math.max(s.widgetHeight, e)),
      (s.breaks += t),
      (this.writtenTo = this.pos = this.pos + i));
  }
  finish(e) {
    let t = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
    this.lineStart > -1 && !(t instanceof Le) && !this.isCovered
      ? this.nodes.push(new Le(0, -1, 0))
      : (this.writtenTo < this.pos || t == null) &&
        this.nodes.push(this.blankContent(this.writtenTo, this.pos));
    let i = e;
    for (let s of this.nodes)
      (s instanceof Le && s.updateHeight(this.oracle, i),
        (i += s ? s.length : 1));
    return this.nodes;
  }
  static build(e, t, i, s) {
    let r = new co(i, e);
    return (z.spans(t, i, s, r, 0), r.finish(i));
  }
}
function $d(n, e, t) {
  let i = new Kd();
  return (z.compare(n, e, t, i, 0), i.changes);
}
class Kd {
  constructor() {
    this.changes = [];
  }
  compareRange() {}
  comparePoint(e, t, i, s) {
    (e < t || (i && i.heightRelevant) || (s && s.heightRelevant)) &&
      Zt(e, t, this.changes, 5);
  }
}
function jd(n, e) {
  let t = n.getBoundingClientRect(),
    i = n.ownerDocument,
    s = i.defaultView || window,
    r = Math.max(0, t.left),
    o = Math.min(s.innerWidth, t.right),
    l = Math.max(0, t.top),
    a = Math.min(s.innerHeight, t.bottom);
  for (let h = n.parentNode; h && h != i.body; )
    if (h.nodeType == 1) {
      let c = h,
        f = window.getComputedStyle(c);
      if (
        (c.scrollHeight > c.clientHeight || c.scrollWidth > c.clientWidth) &&
        f.overflow != "visible"
      ) {
        let u = c.getBoundingClientRect();
        ((r = Math.max(r, u.left)),
          (o = Math.min(o, u.right)),
          (l = Math.max(l, u.top)),
          (a = Math.min(h == n.parentNode ? s.innerHeight : a, u.bottom)));
      }
      h =
        f.position == "absolute" || f.position == "fixed"
          ? c.offsetParent
          : c.parentNode;
    } else if (h.nodeType == 11) h = h.host;
    else break;
  return {
    left: r - t.left,
    right: Math.max(r, o) - t.left,
    top: l - (t.top + e),
    bottom: Math.max(l, a) - (t.top + e),
  };
}
function Ud(n) {
  let e = n.getBoundingClientRect(),
    t = n.ownerDocument.defaultView || window;
  return (
    e.left < t.innerWidth &&
    e.right > 0 &&
    e.top < t.innerHeight &&
    e.bottom > 0
  );
}
function Gd(n, e) {
  let t = n.getBoundingClientRect();
  return {
    left: 0,
    right: t.right - t.left,
    top: e,
    bottom: t.bottom - (t.top + e),
  };
}
class Rs {
  constructor(e, t, i, s) {
    ((this.from = e), (this.to = t), (this.size = i), (this.displaySize = s));
  }
  static same(e, t) {
    if (e.length != t.length) return !1;
    for (let i = 0; i < e.length; i++) {
      let s = e[i],
        r = t[i];
      if (s.from != r.from || s.to != r.to || s.size != r.size) return !1;
    }
    return !0;
  }
  draw(e, t) {
    return L.replace({
      widget: new Jd(this.displaySize * (t ? e.scaleY : e.scaleX), t),
    }).range(this.from, this.to);
  }
}
class Jd extends Ke {
  constructor(e, t) {
    (super(), (this.size = e), (this.vertical = t));
  }
  eq(e) {
    return e.size == this.size && e.vertical == this.vertical;
  }
  toDOM() {
    let e = document.createElement("div");
    return (
      this.vertical
        ? (e.style.height = this.size + "px")
        : ((e.style.width = this.size + "px"),
          (e.style.height = "2px"),
          (e.style.display = "inline-block")),
      e
    );
  }
  get estimatedHeight() {
    return this.vertical ? this.size : -1;
  }
}
class kl {
  constructor(e, t) {
    ((this.view = e),
      (this.state = t),
      (this.pixelViewport = {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: 0,
      }),
      (this.inView = !0),
      (this.paddingTop = 0),
      (this.paddingBottom = 0),
      (this.contentDOMWidth = 0),
      (this.contentDOMHeight = 0),
      (this.editorHeight = 0),
      (this.editorWidth = 0),
      (this.scaleX = 1),
      (this.scaleY = 1),
      (this.scrollOffset = 0),
      (this.scrolledToBottom = !1),
      (this.scrollAnchorPos = 0),
      (this.scrollAnchorHeight = -1),
      (this.scaler = Sl),
      (this.scrollTarget = null),
      (this.printing = !1),
      (this.mustMeasureContent = !0),
      (this.defaultTextDirection = G.LTR),
      (this.visibleRanges = []),
      (this.mustEnforceCursorAssoc = !1));
    let i = t
      .facet(oo)
      .some((s) => typeof s != "function" && s.class == "cm-lineWrapping");
    ((this.heightOracle = new Hd(i)),
      (this.stateDeco = Cl(t)),
      (this.heightMap = Se.empty().applyChanges(
        this.stateDeco,
        q.empty,
        this.heightOracle.setDoc(t.doc),
        [new Ne(0, 0, 0, t.doc.length)],
      )));
    for (
      let s = 0;
      s < 2 &&
      ((this.viewport = this.getViewport(0, null)), !!this.updateForViewport());
      s++
    );
    (this.updateViewportLines(),
      (this.lineGaps = this.ensureLineGaps([])),
      (this.lineGapDeco = L.set(this.lineGaps.map((s) => s.draw(this, !1)))),
      (this.scrollParent = e.scrollDOM),
      this.computeVisibleRanges());
  }
  updateForViewport() {
    let e = [this.viewport],
      { main: t } = this.state.selection;
    for (let i = 0; i <= 1; i++) {
      let s = i ? t.head : t.anchor;
      if (!e.some(({ from: r, to: o }) => s >= r && s <= o)) {
        let { from: r, to: o } = this.lineBlockAt(s);
        e.push(new gn(r, o));
      }
    }
    return (
      (this.viewports = e.sort((i, s) => i.from - s.from)),
      this.updateScaler()
    );
  }
  updateScaler() {
    let e = this.scaler;
    return (
      (this.scaler =
        this.heightMap.height <= 7e6
          ? Sl
          : new fo(this.heightOracle, this.heightMap, this.viewports)),
      e.eq(this.scaler) ? 0 : 2
    );
  }
  updateViewportLines() {
    ((this.viewportLines = []),
      this.heightMap.forEachLine(
        this.viewport.from,
        this.viewport.to,
        this.heightOracle.setDoc(this.state.doc),
        0,
        0,
        (e) => {
          this.viewportLines.push(Si(e, this.scaler));
        },
      ));
  }
  update(e, t = null) {
    this.state = e.state;
    let i = this.stateDeco;
    this.stateDeco = Cl(this.state);
    let s = e.changedRanges,
      r = Ne.extendWithRanges(
        s,
        $d(i, this.stateDeco, e ? e.changes : le.empty(this.state.doc.length)),
      ),
      o = this.heightMap.height,
      l = this.scrolledToBottom ? null : this.scrollAnchorAt(this.scrollOffset);
    (wl(),
      (this.heightMap = this.heightMap.applyChanges(
        this.stateDeco,
        e.startState.doc,
        this.heightOracle.setDoc(this.state.doc),
        r,
      )),
      (this.heightMap.height != o || ai) && (e.flags |= 2),
      l
        ? ((this.scrollAnchorPos = e.changes.mapPos(l.from, -1)),
          (this.scrollAnchorHeight = l.top))
        : ((this.scrollAnchorPos = -1), (this.scrollAnchorHeight = o)));
    let a = r.length
      ? this.mapViewport(this.viewport, e.changes)
      : this.viewport;
    ((t && (t.range.head < a.from || t.range.head > a.to)) ||
      !this.viewportIsAppropriate(a)) &&
      (a = this.getViewport(0, t));
    let h = a.from != this.viewport.from || a.to != this.viewport.to;
    ((this.viewport = a),
      (e.flags |= this.updateForViewport()),
      (h || !e.changes.empty || e.flags & 2) && this.updateViewportLines(),
      (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) &&
        this.updateLineGaps(
          this.ensureLineGaps(this.mapLineGaps(this.lineGaps, e.changes)),
        ),
      (e.flags |= this.computeVisibleRanges(e.changes)),
      t && (this.scrollTarget = t),
      !this.mustEnforceCursorAssoc &&
        (e.selectionSet || e.focusChanged) &&
        e.view.lineWrapping &&
        e.state.selection.main.empty &&
        e.state.selection.main.assoc &&
        !e.state.facet(Eh) &&
        (this.mustEnforceCursorAssoc = !0));
  }
  measure() {
    let { view: e } = this,
      t = e.contentDOM,
      i = window.getComputedStyle(t),
      s = this.heightOracle,
      r = i.whiteSpace;
    this.defaultTextDirection = i.direction == "rtl" ? G.RTL : G.LTR;
    let o =
        this.heightOracle.mustRefreshForWrapping(r) ||
        this.mustMeasureContent === "refresh",
      l = t.getBoundingClientRect(),
      a = o || this.mustMeasureContent || this.contentDOMHeight != l.height;
    ((this.contentDOMHeight = l.height), (this.mustMeasureContent = !1));
    let h = 0,
      c = 0;
    if (l.width && l.height) {
      let { scaleX: k, scaleY: S } = dh(t, l);
      ((k > 0.005 && Math.abs(this.scaleX - k) > 0.005) ||
        (S > 0.005 && Math.abs(this.scaleY - S) > 0.005)) &&
        ((this.scaleX = k), (this.scaleY = S), (h |= 16), (o = a = !0));
    }
    let f = (parseInt(i.paddingTop) || 0) * this.scaleY,
      u = (parseInt(i.paddingBottom) || 0) * this.scaleY;
    ((this.paddingTop != f || this.paddingBottom != u) &&
      ((this.paddingTop = f), (this.paddingBottom = u), (h |= 18)),
      this.editorWidth != e.scrollDOM.clientWidth &&
        (s.lineWrapping && (a = !0),
        (this.editorWidth = e.scrollDOM.clientWidth),
        (h |= 16)));
    let d = ph(this.view.contentDOM, !1).y;
    d != this.scrollParent &&
      ((this.scrollParent = d),
      (this.scrollAnchorHeight = -1),
      (this.scrollOffset = 0));
    let p = this.getScrollOffset();
    (this.scrollOffset != p &&
      ((this.scrollAnchorHeight = -1), (this.scrollOffset = p)),
      (this.scrolledToBottom = gh(this.scrollParent || e.win)));
    let m = (this.printing ? Gd : jd)(t, this.paddingTop),
      g = m.top - this.pixelViewport.top,
      b = m.bottom - this.pixelViewport.bottom;
    this.pixelViewport = m;
    let w =
      this.pixelViewport.bottom > this.pixelViewport.top &&
      this.pixelViewport.right > this.pixelViewport.left;
    if (
      (w != this.inView && ((this.inView = w), w && (a = !0)),
      !this.inView && !this.scrollTarget && !Ud(e.dom))
    )
      return 0;
    let v = l.width;
    if (
      ((this.contentDOMWidth != v ||
        this.editorHeight != e.scrollDOM.clientHeight) &&
        ((this.contentDOMWidth = l.width),
        (this.editorHeight = e.scrollDOM.clientHeight),
        (h |= 16)),
      a)
    ) {
      let k = e.docView.measureVisibleLineHeights(this.viewport);
      if (
        (s.mustRefreshForHeights(k) && (o = !0),
        o ||
          (s.lineWrapping && Math.abs(v - this.contentDOMWidth) > s.charWidth))
      ) {
        let {
          lineHeight: S,
          charWidth: C,
          textHeight: P,
        } = e.docView.measureTextSize();
        ((o = S > 0 && s.refresh(r, S, C, P, Math.max(5, v / C), k)),
          o && ((e.docView.minWidth = 0), (h |= 16)));
      }
      (g > 0 && b > 0
        ? (c = Math.max(g, b))
        : g < 0 && b < 0 && (c = Math.min(g, b)),
        wl());
      for (let S of this.viewports) {
        let C =
          S.from == this.viewport.from
            ? k
            : e.docView.measureVisibleLineHeights(S);
        this.heightMap = (
          o
            ? Se.empty().applyChanges(
                this.stateDeco,
                q.empty,
                this.heightOracle,
                [new Ne(0, 0, 0, e.state.doc.length)],
              )
            : this.heightMap
        ).updateHeight(s, 0, o, new Vd(S.from, C));
      }
      ai && (h |= 2);
    }
    let T =
      !this.viewportIsAppropriate(this.viewport, c) ||
      (this.scrollTarget &&
        (this.scrollTarget.range.head < this.viewport.from ||
          this.scrollTarget.range.head > this.viewport.to));
    return (
      T &&
        (h & 2 && (h |= this.updateScaler()),
        (this.viewport = this.getViewport(c, this.scrollTarget)),
        (h |= this.updateForViewport())),
      (h & 2 || T) && this.updateViewportLines(),
      (this.lineGaps.length || this.viewport.to - this.viewport.from > 4e3) &&
        this.updateLineGaps(this.ensureLineGaps(o ? [] : this.lineGaps, e)),
      (h |= this.computeVisibleRanges()),
      this.mustEnforceCursorAssoc &&
        ((this.mustEnforceCursorAssoc = !1), e.docView.enforceCursorAssoc()),
      h
    );
  }
  get visibleTop() {
    return this.scaler.fromDOM(this.pixelViewport.top);
  }
  get visibleBottom() {
    return this.scaler.fromDOM(this.pixelViewport.bottom);
  }
  getViewport(e, t) {
    let i = 0.5 - Math.max(-0.5, Math.min(0.5, e / 1e3 / 2)),
      s = this.heightMap,
      r = this.heightOracle,
      { visibleTop: o, visibleBottom: l } = this,
      a = new gn(
        s.lineAt(o - i * 1e3, Y.ByHeight, r, 0, 0).from,
        s.lineAt(l + (1 - i) * 1e3, Y.ByHeight, r, 0, 0).to,
      );
    if (t) {
      let { head: h } = t.range;
      if (h < a.from || h > a.to) {
        let c = Math.min(
            this.editorHeight,
            this.pixelViewport.bottom - this.pixelViewport.top,
          ),
          f = s.lineAt(h, Y.ByPos, r, 0, 0),
          u;
        (t.y == "center"
          ? (u = (f.top + f.bottom) / 2 - c / 2)
          : t.y == "start" || (t.y == "nearest" && h < a.from)
            ? (u = f.top)
            : (u = f.bottom - c),
          (a = new gn(
            s.lineAt(u - 1e3 / 2, Y.ByHeight, r, 0, 0).from,
            s.lineAt(u + c + 1e3 / 2, Y.ByHeight, r, 0, 0).to,
          )));
      }
    }
    return a;
  }
  mapViewport(e, t) {
    let i = t.mapPos(e.from, -1),
      s = t.mapPos(e.to, 1);
    return new gn(
      this.heightMap.lineAt(i, Y.ByPos, this.heightOracle, 0, 0).from,
      this.heightMap.lineAt(s, Y.ByPos, this.heightOracle, 0, 0).to,
    );
  }
  viewportIsAppropriate({ from: e, to: t }, i = 0) {
    if (!this.inView) return !0;
    let { top: s } = this.heightMap.lineAt(e, Y.ByPos, this.heightOracle, 0, 0),
      { bottom: r } = this.heightMap.lineAt(
        t,
        Y.ByPos,
        this.heightOracle,
        0,
        0,
      ),
      { visibleTop: o, visibleBottom: l } = this;
    return (
      (e == 0 || s <= o - Math.max(10, Math.min(-i, 250))) &&
      (t == this.state.doc.length || r >= l + Math.max(10, Math.min(i, 250))) &&
      s > o - 2 * 1e3 &&
      r < l + 2 * 1e3
    );
  }
  mapLineGaps(e, t) {
    if (!e.length || t.empty) return e;
    let i = [];
    for (let s of e)
      t.touchesRange(s.from, s.to) ||
        i.push(new Rs(t.mapPos(s.from), t.mapPos(s.to), s.size, s.displaySize));
    return i;
  }
  ensureLineGaps(e, t) {
    let i = this.heightOracle.lineWrapping,
      s = i ? 1e4 : 2e3,
      r = s >> 1,
      o = s << 1;
    if (this.defaultTextDirection != G.LTR && !i) return [];
    let l = [],
      a = (c, f, u, d) => {
        if (f - c < r) return;
        let p = this.state.selection.main,
          m = [p.from];
        p.empty || m.push(p.to);
        for (let b of m)
          if (b > c && b < f) {
            (a(c, b - 10, u, d), a(b + 10, f, u, d));
            return;
          }
        let g = Xd(
          e,
          (b) =>
            b.from >= u.from &&
            b.to <= u.to &&
            Math.abs(b.from - c) < r &&
            Math.abs(b.to - f) < r &&
            !m.some((w) => b.from < w && b.to > w),
        );
        if (!g) {
          if (
            f < u.to &&
            t &&
            i &&
            t.visibleRanges.some((v) => v.from <= f && v.to >= f)
          ) {
            let v = t.moveToLineBoundary(x.cursor(f), !1, !0).head;
            v > c && (f = v);
          }
          let b = this.gapSize(u, c, f, d),
            w = i || b < 2e6 ? b : 2e6;
          g = new Rs(c, f, b, w);
        }
        l.push(g);
      },
      h = (c) => {
        if (c.length < o || c.type != me.Text) return;
        let f = Yd(c.from, c.to, this.stateDeco);
        if (f.total < o) return;
        let u = this.scrollTarget ? this.scrollTarget.range.head : null,
          d,
          p;
        if (i) {
          let m =
              (s / this.heightOracle.lineLength) * this.heightOracle.lineHeight,
            g,
            b;
          if (u != null) {
            let w = bn(f, u),
              v = ((this.visibleBottom - this.visibleTop) / 2 + m) / c.height;
            ((g = w - v), (b = w + v));
          } else
            ((g = (this.visibleTop - c.top - m) / c.height),
              (b = (this.visibleBottom - c.top + m) / c.height));
          ((d = yn(f, g)), (p = yn(f, b)));
        } else {
          let m = f.total * this.heightOracle.charWidth,
            g = s * this.heightOracle.charWidth,
            b = 0;
          if (m > 2e6)
            for (let S of e)
              S.from >= c.from &&
                S.from < c.to &&
                S.size != S.displaySize &&
                S.from * this.heightOracle.charWidth + b <
                  this.pixelViewport.left &&
                (b = S.size - S.displaySize);
          let w = this.pixelViewport.left + b,
            v = this.pixelViewport.right + b,
            T,
            k;
          if (u != null) {
            let S = bn(f, u),
              C = ((v - w) / 2 + g) / m;
            ((T = S - C), (k = S + C));
          } else ((T = (w - g) / m), (k = (v + g) / m));
          ((d = yn(f, T)), (p = yn(f, k)));
        }
        (d > c.from && a(c.from, d, c, f), p < c.to && a(p, c.to, c, f));
      };
    for (let c of this.viewportLines)
      Array.isArray(c.type) ? c.type.forEach(h) : h(c);
    return l;
  }
  gapSize(e, t, i, s) {
    let r = bn(s, i) - bn(s, t);
    return this.heightOracle.lineWrapping
      ? e.height * r
      : s.total * this.heightOracle.charWidth * r;
  }
  updateLineGaps(e) {
    Rs.same(e, this.lineGaps) ||
      ((this.lineGaps = e),
      (this.lineGapDeco = L.set(
        e.map((t) => t.draw(this, this.heightOracle.lineWrapping)),
      )));
  }
  computeVisibleRanges(e) {
    let t = this.stateDeco;
    this.lineGaps.length && (t = t.concat(this.lineGapDeco));
    let i = [];
    z.spans(
      t,
      this.viewport.from,
      this.viewport.to,
      {
        span(r, o) {
          i.push({ from: r, to: o });
        },
        point() {},
      },
      20,
    );
    let s = 0;
    if (i.length != this.visibleRanges.length) s = 12;
    else
      for (let r = 0; r < i.length && !(s & 8); r++) {
        let o = this.visibleRanges[r],
          l = i[r];
        (o.from != l.from || o.to != l.to) &&
          ((s |= 4),
          (e && e.mapPos(o.from, -1) == l.from && e.mapPos(o.to, 1) == l.to) ||
            (s |= 8));
      }
    return ((this.visibleRanges = i), s);
  }
  lineBlockAt(e) {
    return (
      (e >= this.viewport.from &&
        e <= this.viewport.to &&
        this.viewportLines.find((t) => t.from <= e && t.to >= e)) ||
      Si(
        this.heightMap.lineAt(e, Y.ByPos, this.heightOracle, 0, 0),
        this.scaler,
      )
    );
  }
  lineBlockAtHeight(e) {
    return (
      (e >= this.viewportLines[0].top &&
        e <= this.viewportLines[this.viewportLines.length - 1].bottom &&
        this.viewportLines.find((t) => t.top <= e && t.bottom >= e)) ||
      Si(
        this.heightMap.lineAt(
          this.scaler.fromDOM(e),
          Y.ByHeight,
          this.heightOracle,
          0,
          0,
        ),
        this.scaler,
      )
    );
  }
  getScrollOffset() {
    return (
      (this.scrollParent == this.view.scrollDOM
        ? this.scrollParent.scrollTop
        : (this.scrollParent
            ? this.scrollParent.getBoundingClientRect().top
            : 0) - this.view.contentDOM.getBoundingClientRect().top) *
      this.scaleY
    );
  }
  scrollAnchorAt(e) {
    let t = this.lineBlockAtHeight(e + 8);
    return t.from >= this.viewport.from || this.viewportLines[0].top - e > 200
      ? t
      : this.viewportLines[0];
  }
  elementAtHeight(e) {
    return Si(
      this.heightMap.blockAt(this.scaler.fromDOM(e), this.heightOracle, 0, 0),
      this.scaler,
    );
  }
  get docHeight() {
    return this.scaler.toDOM(this.heightMap.height);
  }
  get contentHeight() {
    return this.docHeight + this.paddingTop + this.paddingBottom;
  }
}
class gn {
  constructor(e, t) {
    ((this.from = e), (this.to = t));
  }
}
function Yd(n, e, t) {
  let i = [],
    s = n,
    r = 0;
  return (
    z.spans(
      t,
      n,
      e,
      {
        span() {},
        point(o, l) {
          (o > s && (i.push({ from: s, to: o }), (r += o - s)), (s = l));
        },
      },
      20,
    ),
    s < e && (i.push({ from: s, to: e }), (r += e - s)),
    { total: r, ranges: i }
  );
}
function yn({ total: n, ranges: e }, t) {
  if (t <= 0) return e[0].from;
  if (t >= 1) return e[e.length - 1].to;
  let i = Math.floor(n * t);
  for (let s = 0; ; s++) {
    let { from: r, to: o } = e[s],
      l = o - r;
    if (i <= l) return r + i;
    i -= l;
  }
}
function bn(n, e) {
  let t = 0;
  for (let { from: i, to: s } of n.ranges) {
    if (e <= s) {
      t += e - i;
      break;
    }
    t += s - i;
  }
  return t / n.total;
}
function Xd(n, e) {
  for (let t of n) if (e(t)) return t;
}
const Sl = {
  toDOM(n) {
    return n;
  },
  fromDOM(n) {
    return n;
  },
  scale: 1,
  eq(n) {
    return n == this;
  },
};
function Cl(n) {
  let e = n.facet(ds).filter((i) => typeof i != "function"),
    t = n.facet(lo).filter((i) => typeof i != "function");
  return (t.length && e.push(z.join(t)), e);
}
class fo {
  constructor(e, t, i) {
    let s = 0,
      r = 0,
      o = 0;
    ((this.viewports = i.map(({ from: l, to: a }) => {
      let h = t.lineAt(l, Y.ByPos, e, 0, 0).top,
        c = t.lineAt(a, Y.ByPos, e, 0, 0).bottom;
      return (
        (s += c - h),
        { from: l, to: a, top: h, bottom: c, domTop: 0, domBottom: 0 }
      );
    })),
      (this.scale = (7e6 - s) / (t.height - s)));
    for (let l of this.viewports)
      ((l.domTop = o + (l.top - r) * this.scale),
        (o = l.domBottom = l.domTop + (l.bottom - l.top)),
        (r = l.bottom));
  }
  toDOM(e) {
    for (let t = 0, i = 0, s = 0; ; t++) {
      let r = t < this.viewports.length ? this.viewports[t] : null;
      if (!r || e < r.top) return s + (e - i) * this.scale;
      if (e <= r.bottom) return r.domTop + (e - r.top);
      ((i = r.bottom), (s = r.domBottom));
    }
  }
  fromDOM(e) {
    for (let t = 0, i = 0, s = 0; ; t++) {
      let r = t < this.viewports.length ? this.viewports[t] : null;
      if (!r || e < r.domTop) return i + (e - s) / this.scale;
      if (e <= r.domBottom) return r.top + (e - r.domTop);
      ((i = r.bottom), (s = r.domBottom));
    }
  }
  eq(e) {
    return e instanceof fo
      ? this.scale == e.scale &&
          this.viewports.length == e.viewports.length &&
          this.viewports.every(
            (t, i) =>
              t.from == e.viewports[i].from && t.to == e.viewports[i].to,
          )
      : !1;
  }
}
function Si(n, e) {
  if (e.scale == 1) return n;
  let t = e.toDOM(n.top),
    i = e.toDOM(n.bottom);
  return new _e(
    n.from,
    n.length,
    t,
    i - t,
    Array.isArray(n._content) ? n._content.map((s) => Si(s, e)) : n._content,
  );
}
const xn = D.define({ combine: (n) => n.join(" ") }),
  Or = D.define({ combine: (n) => n.indexOf(!0) > -1 }),
  Br = kt.newName(),
  Zh = kt.newName(),
  ec = kt.newName(),
  tc = { "&light": "." + Zh, "&dark": "." + ec };
function Er(n, e, t) {
  return new kt(e, {
    finish(i) {
      return /&/.test(i)
        ? i.replace(/&\w*/, (s) => {
            if (s == "&") return n;
            if (!t || !t[s]) throw new RangeError(`Unsupported selector: ${s}`);
            return t[s];
          })
        : n + " " + i;
    },
  });
}
const Qd = Er(
    "." + Br,
    {
      "&": {
        position: "relative !important",
        boxSizing: "border-box",
        "&.cm-focused": { outline: "1px dotted #212121" },
        display: "flex !important",
        flexDirection: "column",
      },
      ".cm-scroller": {
        display: "flex !important",
        alignItems: "flex-start !important",
        fontFamily: "monospace",
        lineHeight: 1.4,
        height: "100%",
        overflowX: "auto",
        position: "relative",
        zIndex: 0,
        overflowAnchor: "none",
      },
      ".cm-content": {
        margin: 0,
        flexGrow: 2,
        flexShrink: 0,
        display: "block",
        whiteSpace: "pre",
        wordWrap: "normal",
        boxSizing: "border-box",
        minHeight: "100%",
        padding: "4px 0",
        outline: "none",
        "&[contenteditable=true]": {
          WebkitUserModify: "read-write-plaintext-only",
        },
      },
      ".cm-lineWrapping": {
        whiteSpace_fallback: "pre-wrap",
        whiteSpace: "break-spaces",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        flexShrink: 1,
      },
      "&light .cm-content": { caretColor: "black" },
      "&dark .cm-content": { caretColor: "white" },
      ".cm-line": { display: "block", padding: "0 2px 0 6px" },
      ".cm-layer": {
        position: "absolute",
        left: 0,
        top: 0,
        contain: "size style",
        "& > *": { position: "absolute" },
      },
      "&light .cm-selectionBackground": { background: "#d9d9d9" },
      "&dark .cm-selectionBackground": { background: "#222" },
      "&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
        { background: "#d7d4f0" },
      "&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
        { background: "#233" },
      ".cm-cursorLayer": { pointerEvents: "none" },
      "&.cm-focused > .cm-scroller > .cm-cursorLayer": {
        animation: "steps(1) cm-blink 1.2s infinite",
      },
      "@keyframes cm-blink": { "0%": {}, "50%": { opacity: 0 }, "100%": {} },
      "@keyframes cm-blink2": { "0%": {}, "50%": { opacity: 0 }, "100%": {} },
      ".cm-cursor, .cm-dropCursor": {
        borderLeft: "1.2px solid black",
        marginLeft: "-0.6px",
        pointerEvents: "none",
      },
      ".cm-cursor": { display: "none" },
      "&dark .cm-cursor": { borderLeftColor: "#ddd" },
      ".cm-dropCursor": { position: "absolute" },
      "&.cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor": {
        display: "block",
      },
      ".cm-iso": { unicodeBidi: "isolate" },
      ".cm-announced": { position: "fixed", top: "-10000px" },
      "@media print": { ".cm-announced": { display: "none" } },
      "&light .cm-activeLine": { backgroundColor: "#cceeff44" },
      "&dark .cm-activeLine": { backgroundColor: "#99eeff33" },
      "&light .cm-specialChar": { color: "red" },
      "&dark .cm-specialChar": { color: "#f78" },
      ".cm-gutters": {
        flexShrink: 0,
        display: "flex",
        height: "100%",
        boxSizing: "border-box",
        zIndex: 200,
      },
      ".cm-gutters-before": { insetInlineStart: 0 },
      ".cm-gutters-after": { insetInlineEnd: 0 },
      "&light .cm-gutters": {
        backgroundColor: "#f5f5f5",
        color: "#6c6c6c",
        border: "0px solid #ddd",
        "&.cm-gutters-before": { borderRightWidth: "1px" },
        "&.cm-gutters-after": { borderLeftWidth: "1px" },
      },
      "&dark .cm-gutters": { backgroundColor: "#333338", color: "#ccc" },
      ".cm-gutter": {
        display: "flex !important",
        flexDirection: "column",
        flexShrink: 0,
        boxSizing: "border-box",
        minHeight: "100%",
        overflow: "hidden",
      },
      ".cm-gutterElement": { boxSizing: "border-box" },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 3px 0 5px",
        minWidth: "20px",
        textAlign: "right",
        whiteSpace: "nowrap",
      },
      "&light .cm-activeLineGutter": { backgroundColor: "#e2f2ff" },
      "&dark .cm-activeLineGutter": { backgroundColor: "#222227" },
      ".cm-panels": {
        boxSizing: "border-box",
        position: "sticky",
        left: 0,
        right: 0,
        zIndex: 300,
      },
      "&light .cm-panels": { backgroundColor: "#f5f5f5", color: "black" },
      "&light .cm-panels-top": { borderBottom: "1px solid #ddd" },
      "&light .cm-panels-bottom": { borderTop: "1px solid #ddd" },
      "&dark .cm-panels": { backgroundColor: "#333338", color: "white" },
      ".cm-dialog": {
        padding: "2px 19px 4px 6px",
        position: "relative",
        "& label": { fontSize: "80%" },
      },
      ".cm-dialog-close": {
        position: "absolute",
        top: "3px",
        right: "4px",
        backgroundColor: "inherit",
        border: "none",
        font: "inherit",
        fontSize: "14px",
        padding: "0",
      },
      ".cm-tab": {
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
      },
      ".cm-widgetBuffer": {
        verticalAlign: "text-top",
        height: "1em",
        width: 0,
        display: "inline",
      },
      ".cm-placeholder": {
        color: "#888",
        display: "inline-block",
        verticalAlign: "top",
        userSelect: "none",
      },
      ".cm-highlightSpace": {
        backgroundImage:
          "radial-gradient(circle at 50% 55%, #aaa 20%, transparent 5%)",
        backgroundPosition: "center",
      },
      ".cm-highlightTab": {
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>')`,
        backgroundSize: "auto 100%",
        backgroundPosition: "right 90%",
        backgroundRepeat: "no-repeat",
      },
      ".cm-trailingSpace": { backgroundColor: "#ff332255" },
      ".cm-button": {
        verticalAlign: "middle",
        color: "inherit",
        fontSize: "70%",
        padding: ".2em 1em",
        borderRadius: "1px",
      },
      "&light .cm-button": {
        backgroundImage: "linear-gradient(#eff1f5, #d9d9df)",
        border: "1px solid #888",
        "&:active": { backgroundImage: "linear-gradient(#b4b4b4, #d0d3d6)" },
      },
      "&dark .cm-button": {
        backgroundImage: "linear-gradient(#393939, #111)",
        border: "1px solid #888",
        "&:active": { backgroundImage: "linear-gradient(#111, #333)" },
      },
      ".cm-textfield": {
        verticalAlign: "middle",
        color: "inherit",
        fontSize: "70%",
        border: "1px solid silver",
        padding: ".2em .5em",
      },
      "&light .cm-textfield": { backgroundColor: "white" },
      "&dark .cm-textfield": {
        border: "1px solid #555",
        backgroundColor: "inherit",
      },
    },
    tc,
  ),
  Zd = {
    childList: !0,
    characterData: !0,
    subtree: !0,
    attributes: !0,
    characterDataOldValue: !0,
  },
  Is = O.ie && O.ie_version <= 11;
class ep {
  constructor(e) {
    ((this.view = e),
      (this.active = !1),
      (this.editContext = null),
      (this.selectionRange = new Bu()),
      (this.selectionChanged = !1),
      (this.delayedFlush = -1),
      (this.resizeTimeout = -1),
      (this.queue = []),
      (this.delayedAndroidKey = null),
      (this.flushingAndroidKey = -1),
      (this.lastChange = 0),
      (this.scrollTargets = []),
      (this.intersection = null),
      (this.resizeScroll = null),
      (this.intersecting = !1),
      (this.gapIntersection = null),
      (this.gaps = []),
      (this.printQuery = null),
      (this.parentCheck = -1),
      (this.dom = e.contentDOM),
      (this.observer = new MutationObserver((t) => {
        for (let i of t) this.queue.push(i);
        ((O.ie && O.ie_version <= 11) || (O.ios && e.composing)) &&
        t.some(
          (i) =>
            (i.type == "childList" && i.removedNodes.length) ||
            (i.type == "characterData" &&
              i.oldValue.length > i.target.nodeValue.length),
        )
          ? this.flushSoon()
          : this.flush();
      })),
      window.EditContext &&
        O.android &&
        e.constructor.EDIT_CONTEXT !== !1 &&
        !(O.chrome && O.chrome_version < 126) &&
        ((this.editContext = new ip(e)),
        e.state.facet(ht) &&
          (e.contentDOM.editContext = this.editContext.editContext)),
      Is &&
        (this.onCharData = (t) => {
          (this.queue.push({
            target: t.target,
            type: "characterData",
            oldValue: t.prevValue,
          }),
            this.flushSoon());
        }),
      (this.onSelectionChange = this.onSelectionChange.bind(this)),
      (this.onResize = this.onResize.bind(this)),
      (this.onPrint = this.onPrint.bind(this)),
      (this.onScroll = this.onScroll.bind(this)),
      window.matchMedia && (this.printQuery = window.matchMedia("print")),
      typeof ResizeObserver == "function" &&
        ((this.resizeScroll = new ResizeObserver(() => {
          var t;
          ((t = this.view.docView) === null || t === void 0
            ? void 0
            : t.lastUpdate) <
            Date.now() - 75 && this.onResize();
        })),
        this.resizeScroll.observe(e.scrollDOM)),
      this.addWindowListeners((this.win = e.win)),
      this.start(),
      typeof IntersectionObserver == "function" &&
        ((this.intersection = new IntersectionObserver(
          (t) => {
            (this.parentCheck < 0 &&
              (this.parentCheck = setTimeout(
                this.listenForScroll.bind(this),
                1e3,
              )),
              t.length > 0 &&
                t[t.length - 1].intersectionRatio > 0 != this.intersecting &&
                ((this.intersecting = !this.intersecting),
                this.intersecting != this.view.inView &&
                  this.onScrollChanged(document.createEvent("Event"))));
          },
          { threshold: [0, 0.001] },
        )),
        this.intersection.observe(this.dom),
        (this.gapIntersection = new IntersectionObserver((t) => {
          t.length > 0 &&
            t[t.length - 1].intersectionRatio > 0 &&
            this.onScrollChanged(document.createEvent("Event"));
        }, {}))),
      this.listenForScroll(),
      this.readSelectionRange());
  }
  onScrollChanged(e) {
    (this.view.inputState.runHandlers("scroll", e),
      this.intersecting && this.view.measure());
  }
  onScroll(e) {
    (this.intersecting && this.flush(!1),
      this.editContext && this.view.requestMeasure(this.editContext.measureReq),
      this.onScrollChanged(e));
  }
  onResize() {
    this.resizeTimeout < 0 &&
      (this.resizeTimeout = setTimeout(() => {
        ((this.resizeTimeout = -1), this.view.requestMeasure());
      }, 50));
  }
  onPrint(e) {
    ((e.type == "change" || !e.type) && !e.matches) ||
      ((this.view.viewState.printing = !0),
      this.view.measure(),
      setTimeout(() => {
        ((this.view.viewState.printing = !1), this.view.requestMeasure());
      }, 500));
  }
  updateGaps(e) {
    if (
      this.gapIntersection &&
      (e.length != this.gaps.length || this.gaps.some((t, i) => t != e[i]))
    ) {
      this.gapIntersection.disconnect();
      for (let t of e) this.gapIntersection.observe(t);
      this.gaps = e;
    }
  }
  onSelectionChange(e) {
    let t = this.selectionChanged;
    if (!this.readSelectionRange() || this.delayedAndroidKey) return;
    let { view: i } = this,
      s = this.selectionRange;
    if (i.state.facet(ht) ? i.root.activeElement != this.dom : !Ti(this.dom, s))
      return;
    let r = s.anchorNode && i.docView.tile.nearest(s.anchorNode);
    if (r && r.isWidget() && r.widget.ignoreEvent(e)) {
      t || (this.selectionChanged = !1);
      return;
    }
    ((O.ie && O.ie_version <= 11) || (O.android && O.chrome)) &&
    !i.state.selection.main.empty &&
    s.focusNode &&
    Oi(s.focusNode, s.focusOffset, s.anchorNode, s.anchorOffset)
      ? this.flushSoon()
      : this.flush(!1);
  }
  readSelectionRange() {
    let { view: e } = this,
      t = Ni(e.root);
    if (!t) return !1;
    let i =
      (O.safari &&
        e.root.nodeType == 11 &&
        e.root.activeElement == this.dom &&
        tp(this.view, t)) ||
      t;
    if (!i || this.selectionRange.eq(i)) return !1;
    let s = Ti(this.dom, i);
    return s &&
      !this.selectionChanged &&
      e.inputState.lastFocusTime > Date.now() - 200 &&
      e.inputState.lastTouchTime < Date.now() - 300 &&
      Lu(this.dom, i)
      ? ((this.view.inputState.lastFocusTime = 0),
        e.docView.updateSelection(),
        !1)
      : (this.selectionRange.setRange(i),
        s && (this.selectionChanged = !0),
        !0);
  }
  setSelectionRange(e, t) {
    (this.selectionRange.set(e.node, e.offset, t.node, t.offset),
      (this.selectionChanged = !1));
  }
  clearSelectionRange() {
    this.selectionRange.set(null, 0, null, 0);
  }
  listenForScroll() {
    this.parentCheck = -1;
    let e = 0,
      t = null;
    for (let i = this.dom; i; )
      if (i.nodeType == 1)
        (!t && e < this.scrollTargets.length && this.scrollTargets[e] == i
          ? e++
          : t || (t = this.scrollTargets.slice(0, e)),
          t && t.push(i),
          (i = i.assignedSlot || i.parentNode));
      else if (i.nodeType == 11) i = i.host;
      else break;
    if (
      (e < this.scrollTargets.length &&
        !t &&
        (t = this.scrollTargets.slice(0, e)),
      t)
    ) {
      for (let i of this.scrollTargets)
        i.removeEventListener("scroll", this.onScroll);
      for (let i of (this.scrollTargets = t))
        i.addEventListener("scroll", this.onScroll);
    }
  }
  ignore(e) {
    if (!this.active) return e();
    try {
      return (this.stop(), e());
    } finally {
      (this.start(), this.clear());
    }
  }
  start() {
    this.active ||
      (this.observer.observe(this.dom, Zd),
      Is &&
        this.dom.addEventListener("DOMCharacterDataModified", this.onCharData),
      (this.active = !0));
  }
  stop() {
    this.active &&
      ((this.active = !1),
      this.observer.disconnect(),
      Is &&
        this.dom.removeEventListener(
          "DOMCharacterDataModified",
          this.onCharData,
        ));
  }
  clear() {
    (this.processRecords(),
      (this.queue.length = 0),
      (this.selectionChanged = !1));
  }
  delayAndroidKey(e, t) {
    var i;
    if (!this.delayedAndroidKey) {
      let s = () => {
        let r = this.delayedAndroidKey;
        r &&
          (this.clearDelayedAndroidKey(),
          (this.view.inputState.lastKeyCode = r.keyCode),
          (this.view.inputState.lastKeyTime = Date.now()),
          !this.flush() && r.force && ei(this.dom, r.key, r.keyCode));
      };
      this.flushingAndroidKey = this.view.win.requestAnimationFrame(s);
    }
    (!this.delayedAndroidKey || e == "Enter") &&
      (this.delayedAndroidKey = {
        key: e,
        keyCode: t,
        force:
          this.lastChange < Date.now() - 50 ||
          !!(
            !((i = this.delayedAndroidKey) === null || i === void 0) && i.force
          ),
      });
  }
  clearDelayedAndroidKey() {
    (this.win.cancelAnimationFrame(this.flushingAndroidKey),
      (this.delayedAndroidKey = null),
      (this.flushingAndroidKey = -1));
  }
  flushSoon() {
    this.delayedFlush < 0 &&
      (this.delayedFlush = this.view.win.requestAnimationFrame(() => {
        ((this.delayedFlush = -1), this.flush());
      }));
  }
  forceFlush() {
    (this.delayedFlush >= 0 &&
      (this.view.win.cancelAnimationFrame(this.delayedFlush),
      (this.delayedFlush = -1)),
      this.flush());
  }
  pendingRecords() {
    for (let e of this.observer.takeRecords()) this.queue.push(e);
    return this.queue;
  }
  processRecords() {
    let e = this.pendingRecords();
    e.length && (this.queue = []);
    let t = -1,
      i = -1,
      s = !1;
    for (let r of e) {
      let o = this.readMutation(r);
      o &&
        (o.typeOver && (s = !0),
        t == -1
          ? ({ from: t, to: i } = o)
          : ((t = Math.min(o.from, t)), (i = Math.max(o.to, i))));
    }
    return { from: t, to: i, typeOver: s };
  }
  readChange() {
    let { from: e, to: t, typeOver: i } = this.processRecords(),
      s = this.selectionChanged && Ti(this.dom, this.selectionRange);
    if (e < 0 && !s) return null;
    (e > -1 && (this.lastChange = Date.now()),
      (this.view.inputState.lastFocusTime = 0),
      (this.selectionChanged = !1));
    let r = new xd(this.view, e, t, i);
    return (
      (this.view.docView.domChanged = {
        newSel: r.newSel ? r.newSel.main : null,
      }),
      r
    );
  }
  flush(e = !0) {
    if (this.delayedFlush >= 0 || this.delayedAndroidKey) return !1;
    e && this.readSelectionRange();
    let t = this.readChange();
    if (!t) return (this.view.requestMeasure(), !1);
    let i = this.view.state,
      s = _h(this.view, t);
    return (
      this.view.state == i &&
        (t.domChanged ||
          (t.newSel && !Jn(this.view.state.selection, t.newSel.main))) &&
        this.view.update([]),
      s
    );
  }
  readMutation(e) {
    let t = this.view.docView.tile.nearest(e.target);
    if (!t || t.isWidget()) return null;
    if ((t.markDirty(e.type == "attributes"), e.type == "childList")) {
      let i = Al(t, e.previousSibling || e.target.previousSibling, -1),
        s = Al(t, e.nextSibling || e.target.nextSibling, 1);
      return {
        from: i ? t.posAfter(i) : t.posAtStart,
        to: s ? t.posBefore(s) : t.posAtEnd,
        typeOver: !1,
      };
    } else
      return e.type == "characterData"
        ? {
            from: t.posAtStart,
            to: t.posAtEnd,
            typeOver: e.target.nodeValue == e.oldValue,
          }
        : null;
  }
  setWindow(e) {
    e != this.win &&
      (this.removeWindowListeners(this.win),
      (this.win = e),
      this.addWindowListeners(this.win));
  }
  addWindowListeners(e) {
    (e.addEventListener("resize", this.onResize),
      this.printQuery
        ? this.printQuery.addEventListener
          ? this.printQuery.addEventListener("change", this.onPrint)
          : this.printQuery.addListener(this.onPrint)
        : e.addEventListener("beforeprint", this.onPrint),
      e.addEventListener("scroll", this.onScroll),
      e.document.addEventListener("selectionchange", this.onSelectionChange));
  }
  removeWindowListeners(e) {
    (e.removeEventListener("scroll", this.onScroll),
      e.removeEventListener("resize", this.onResize),
      this.printQuery
        ? this.printQuery.removeEventListener
          ? this.printQuery.removeEventListener("change", this.onPrint)
          : this.printQuery.removeListener(this.onPrint)
        : e.removeEventListener("beforeprint", this.onPrint),
      e.document.removeEventListener(
        "selectionchange",
        this.onSelectionChange,
      ));
  }
  update(e) {
    this.editContext &&
      (this.editContext.update(e),
      e.startState.facet(ht) != e.state.facet(ht) &&
        (e.view.contentDOM.editContext = e.state.facet(ht)
          ? this.editContext.editContext
          : null));
  }
  destroy() {
    var e, t, i;
    (this.stop(),
      (e = this.intersection) === null || e === void 0 || e.disconnect(),
      (t = this.gapIntersection) === null || t === void 0 || t.disconnect(),
      (i = this.resizeScroll) === null || i === void 0 || i.disconnect());
    for (let s of this.scrollTargets)
      s.removeEventListener("scroll", this.onScroll);
    (this.removeWindowListeners(this.win),
      clearTimeout(this.parentCheck),
      clearTimeout(this.resizeTimeout),
      this.win.cancelAnimationFrame(this.delayedFlush),
      this.win.cancelAnimationFrame(this.flushingAndroidKey),
      this.editContext &&
        ((this.view.contentDOM.editContext = null),
        this.editContext.destroy()));
  }
}
function Al(n, e, t) {
  for (; e; ) {
    let i = ie.get(e);
    if (i && i.parent == n) return i;
    let s = e.parentNode;
    e = s != n.dom ? s : t > 0 ? e.nextSibling : e.previousSibling;
  }
  return null;
}
function Ml(n, e) {
  let t = e.startContainer,
    i = e.startOffset,
    s = e.endContainer,
    r = e.endOffset,
    o = n.docView.domAtPos(n.state.selection.main.anchor, 1);
  return (
    Oi(o.node, o.offset, s, r) && ([t, i, s, r] = [s, r, t, i]),
    { anchorNode: t, anchorOffset: i, focusNode: s, focusOffset: r }
  );
}
function tp(n, e) {
  if (e.getComposedRanges) {
    let s = e.getComposedRanges(n.root)[0];
    if (s) return Ml(n, s);
  }
  let t = null;
  function i(s) {
    (s.preventDefault(),
      s.stopImmediatePropagation(),
      (t = s.getTargetRanges()[0]));
  }
  return (
    n.contentDOM.addEventListener("beforeinput", i, !0),
    n.dom.ownerDocument.execCommand("indent"),
    n.contentDOM.removeEventListener("beforeinput", i, !0),
    t ? Ml(n, t) : null
  );
}
class ip {
  constructor(e) {
    ((this.from = 0),
      (this.to = 0),
      (this.pendingContextChange = null),
      (this.handlers = Object.create(null)),
      (this.composing = null),
      this.resetRange(e.state));
    let t = (this.editContext = new window.EditContext({
      text: e.state.doc.sliceString(this.from, this.to),
      selectionStart: this.toContextPos(
        Math.max(this.from, Math.min(this.to, e.state.selection.main.anchor)),
      ),
      selectionEnd: this.toContextPos(e.state.selection.main.head),
    }));
    ((this.handlers.textupdate = (i) => {
      let s = e.state.selection.main,
        { anchor: r, head: o } = s,
        l = this.toEditorPos(i.updateRangeStart),
        a = this.toEditorPos(i.updateRangeEnd);
      e.inputState.composing >= 0 &&
        !this.composing &&
        (this.composing = {
          contextBase: i.updateRangeStart,
          editorBase: l,
          drifted: !1,
        });
      let h = a - l > i.text.length;
      l == this.from && r < this.from
        ? (l = r)
        : a == this.to && r > this.to && (a = r);
      let c = qh(
        e.state.sliceDoc(l, a),
        i.text,
        (h ? s.from : s.to) - l,
        h ? "end" : null,
      );
      if (!c) {
        let u = x.single(
          this.toEditorPos(i.selectionStart),
          this.toEditorPos(i.selectionEnd),
        );
        Jn(u, s) || e.dispatch({ selection: u, userEvent: "select" });
        return;
      }
      let f = {
        from: c.from + l,
        to: c.toA + l,
        insert: q.of(
          i.text.slice(c.from, c.toB).split(`
`),
        ),
      };
      if (
        ((O.mac || O.android) &&
          f.from == o - 1 &&
          /^\. ?$/.test(i.text) &&
          e.contentDOM.getAttribute("autocorrect") == "off" &&
          (f = { from: l, to: a, insert: q.of([i.text.replace(".", " ")]) }),
        (this.pendingContextChange = f),
        !e.state.readOnly)
      ) {
        let u = this.to - this.from + (f.to - f.from + f.insert.length);
        ho(
          e,
          f,
          x.single(
            this.toEditorPos(i.selectionStart, u),
            this.toEditorPos(i.selectionEnd, u),
          ),
        );
      }
      (this.pendingContextChange &&
        (this.revertPending(e.state), this.setSelection(e.state)),
        f.from < f.to &&
          !f.insert.length &&
          e.inputState.composing >= 0 &&
          !/[\\p{Alphabetic}\\p{Number}_]/.test(
            t.text.slice(
              Math.max(0, i.updateRangeStart - 1),
              Math.min(t.text.length, i.updateRangeStart + 1),
            ),
          ) &&
          this.handlers.compositionend(i));
    }),
      (this.handlers.characterboundsupdate = (i) => {
        let s = [],
          r = null;
        for (
          let o = this.toEditorPos(i.rangeStart),
            l = this.toEditorPos(i.rangeEnd);
          o < l;
          o++
        ) {
          let a = e.coordsForChar(o);
          ((r =
            (a &&
              new DOMRect(a.left, a.top, a.right - a.left, a.bottom - a.top)) ||
            r ||
            new DOMRect()),
            s.push(r));
        }
        t.updateCharacterBounds(i.rangeStart, s);
      }),
      (this.handlers.textformatupdate = (i) => {
        let s = [];
        for (let r of i.getTextFormats()) {
          let o = r.underlineStyle,
            l = r.underlineThickness;
          if (!/none/i.test(o) && !/none/i.test(l)) {
            let a = this.toEditorPos(r.rangeStart),
              h = this.toEditorPos(r.rangeEnd);
            if (a < h) {
              let c = `text-decoration: underline ${/^[a-z]/.test(o) ? o + " " : o == "Dashed" ? "dashed " : o == "Squiggle" ? "wavy " : ""}${/thin/i.test(l) ? 1 : 2}px`;
              s.push(L.mark({ attributes: { style: c } }).range(a, h));
            }
          }
        }
        e.dispatch({ effects: Ph.of(L.set(s)) });
      }),
      (this.handlers.compositionstart = () => {
        e.inputState.composing < 0 &&
          ((e.inputState.composing = 0),
          (e.inputState.compositionFirstChange = !0));
      }),
      (this.handlers.compositionend = () => {
        if (
          ((e.inputState.composing = -1),
          (e.inputState.compositionFirstChange = null),
          this.composing)
        ) {
          let { drifted: i } = this.composing;
          ((this.composing = null), i && this.reset(e.state));
        }
      }));
    for (let i in this.handlers) t.addEventListener(i, this.handlers[i]);
    this.measureReq = {
      read: (i) => {
        this.editContext.updateControlBounds(
          i.contentDOM.getBoundingClientRect(),
        );
        let s = Ni(i.root);
        s &&
          s.rangeCount &&
          this.editContext.updateSelectionBounds(
            s.getRangeAt(0).getBoundingClientRect(),
          );
      },
    };
  }
  applyEdits(e) {
    let t = 0,
      i = !1,
      s = this.pendingContextChange;
    return (
      e.changes.iterChanges((r, o, l, a, h) => {
        if (i) return;
        let c = h.length - (o - r);
        if (s && o >= s.to)
          if (s.from == r && s.to == o && s.insert.eq(h)) {
            ((s = this.pendingContextChange = null), (t += c), (this.to += c));
            return;
          } else ((s = null), this.revertPending(e.state));
        if (((r += t), (o += t), o <= this.from))
          ((this.from += c), (this.to += c));
        else if (r < this.to) {
          if (
            r < this.from ||
            o > this.to ||
            this.to - this.from + h.length > 3e4
          ) {
            i = !0;
            return;
          }
          (this.editContext.updateText(
            this.toContextPos(r),
            this.toContextPos(o),
            h.toString(),
          ),
            (this.to += c));
        }
        t += c;
      }),
      s && !i && this.revertPending(e.state),
      !i
    );
  }
  update(e) {
    let t = this.pendingContextChange,
      i = e.startState.selection.main;
    (this.composing &&
    (this.composing.drifted ||
      (!e.changes.touchesRange(i.from, i.to) &&
        e.transactions.some(
          (s) =>
            !s.isUserEvent("input.type") &&
            s.changes.touchesRange(this.from, this.to),
        )))
      ? ((this.composing.drifted = !0),
        (this.composing.editorBase = e.changes.mapPos(
          this.composing.editorBase,
        )))
      : !this.applyEdits(e) || !this.rangeIsValid(e.state)
        ? ((this.pendingContextChange = null), this.reset(e.state))
        : (e.docChanged || e.selectionSet || t) && this.setSelection(e.state),
      (e.geometryChanged || e.docChanged || e.selectionSet) &&
        e.view.requestMeasure(this.measureReq));
  }
  resetRange(e) {
    let { head: t } = e.selection.main;
    ((this.from = Math.max(0, t - 1e4)),
      (this.to = Math.min(e.doc.length, t + 1e4)));
  }
  reset(e) {
    (this.resetRange(e),
      this.editContext.updateText(
        0,
        this.editContext.text.length,
        e.doc.sliceString(this.from, this.to),
      ),
      this.setSelection(e));
  }
  revertPending(e) {
    let t = this.pendingContextChange;
    ((this.pendingContextChange = null),
      this.editContext.updateText(
        this.toContextPos(t.from),
        this.toContextPos(t.from + t.insert.length),
        e.doc.sliceString(t.from, t.to),
      ));
  }
  setSelection(e) {
    let { main: t } = e.selection,
      i = this.toContextPos(Math.max(this.from, Math.min(this.to, t.anchor))),
      s = this.toContextPos(t.head);
    (this.editContext.selectionStart != i ||
      this.editContext.selectionEnd != s) &&
      this.editContext.updateSelection(i, s);
  }
  rangeIsValid(e) {
    let { head: t } = e.selection.main;
    return !(
      (this.from > 0 && t - this.from < 500) ||
      (this.to < e.doc.length && this.to - t < 500) ||
      this.to - this.from > 1e4 * 3
    );
  }
  toEditorPos(e, t = this.to - this.from) {
    e = Math.min(e, t);
    let i = this.composing;
    return i && i.drifted ? i.editorBase + (e - i.contextBase) : e + this.from;
  }
  toContextPos(e) {
    let t = this.composing;
    return t && t.drifted ? t.contextBase + (e - t.editorBase) : e - this.from;
  }
  destroy() {
    for (let e in this.handlers)
      this.editContext.removeEventListener(e, this.handlers[e]);
  }
}
class A {
  get state() {
    return this.viewState.state;
  }
  get viewport() {
    return this.viewState.viewport;
  }
  get visibleRanges() {
    return this.viewState.visibleRanges;
  }
  get inView() {
    return this.viewState.inView;
  }
  get composing() {
    return !!this.inputState && this.inputState.composing > 0;
  }
  get compositionStarted() {
    return !!this.inputState && this.inputState.composing >= 0;
  }
  get root() {
    return this._root;
  }
  get win() {
    return this.dom.ownerDocument.defaultView || window;
  }
  constructor(e = {}) {
    var t;
    ((this.plugins = []),
      (this.pluginMap = new Map()),
      (this.editorAttrs = {}),
      (this.contentAttrs = {}),
      (this.bidiCache = []),
      (this.destroyed = !1),
      (this.updateState = 2),
      (this.measureScheduled = -1),
      (this.measureRequests = []),
      (this.contentDOM = document.createElement("div")),
      (this.scrollDOM = document.createElement("div")),
      (this.scrollDOM.tabIndex = -1),
      (this.scrollDOM.className = "cm-scroller"),
      this.scrollDOM.appendChild(this.contentDOM),
      (this.announceDOM = document.createElement("div")),
      (this.announceDOM.className = "cm-announced"),
      this.announceDOM.setAttribute("aria-live", "polite"),
      (this.dom = document.createElement("div")),
      this.dom.appendChild(this.announceDOM),
      this.dom.appendChild(this.scrollDOM),
      e.parent && e.parent.appendChild(this.dom));
    let { dispatch: i } = e;
    ((this.dispatchTransactions =
      e.dispatchTransactions ||
      (i && ((s) => s.forEach((r) => i(r, this)))) ||
      ((s) => this.update(s))),
      (this.dispatch = this.dispatch.bind(this)),
      (this._root = e.root || Eu(e.parent) || document),
      (this.viewState = new kl(this, e.state || _.create(e))),
      e.scrollTo &&
        e.scrollTo.is(dn) &&
        (this.viewState.scrollTarget = e.scrollTo.value.clip(
          this.viewState.state,
        )),
      (this.plugins = this.state.facet(Jt).map((s) => new Os(s))));
    for (let s of this.plugins) s.update(this);
    ((this.observer = new ep(this)),
      (this.inputState = new Sd(this)),
      this.inputState.ensureHandlers(this.plugins),
      (this.docView = new hl(this)),
      this.mountStyles(),
      this.updateAttrs(),
      (this.updateState = 0),
      this.requestMeasure(),
      !((t = document.fonts) === null || t === void 0) &&
        t.ready &&
        document.fonts.ready.then(() => {
          ((this.viewState.mustMeasureContent = "refresh"),
            this.requestMeasure());
        }));
  }
  dispatch(...e) {
    let t =
      e.length == 1 && e[0] instanceof oe
        ? e
        : e.length == 1 && Array.isArray(e[0])
          ? e[0]
          : [this.state.update(...e)];
    this.dispatchTransactions(t, this);
  }
  update(e) {
    if (this.updateState != 0)
      throw new Error(
        "Calls to EditorView.update are not allowed while an update is in progress",
      );
    let t = !1,
      i = !1,
      s,
      r = this.state;
    for (let u of e) {
      if (u.startState != r)
        throw new RangeError(
          "Trying to update state with a transaction that doesn't start from the previous state.",
        );
      r = u.state;
    }
    if (this.destroyed) {
      this.viewState.state = r;
      return;
    }
    let o = this.hasFocus,
      l = 0,
      a = null;
    e.some((u) => u.annotation(Jh))
      ? ((this.inputState.notifiedFocused = o), (l = 1))
      : o != this.inputState.notifiedFocused &&
        ((this.inputState.notifiedFocused = o), (a = Yh(r, o)), a || (l = 1));
    let h = this.observer.delayedAndroidKey,
      c = null;
    if (
      (h
        ? (this.observer.clearDelayedAndroidKey(),
          (c = this.observer.readChange()),
          ((c && !this.state.doc.eq(r.doc)) ||
            !this.state.selection.eq(r.selection)) &&
            (c = null))
        : this.observer.clear(),
      r.facet(_.phrases) != this.state.facet(_.phrases))
    )
      return this.setState(r);
    ((s = jn.create(this, r, e)), (s.flags |= l));
    let f = this.viewState.scrollTarget;
    try {
      this.updateState = 2;
      for (let u of e) {
        if ((f && (f = f.map(u.changes)), u.scrollIntoView)) {
          let { main: d } = u.state.selection;
          f = new ti(
            d.empty ? d : x.cursor(d.head, d.head > d.anchor ? -1 : 1),
          );
        }
        for (let d of u.effects) d.is(dn) && (f = d.value.clip(this.state));
      }
      (this.viewState.update(s, f),
        (this.bidiCache = Xn.update(this.bidiCache, s.changes)),
        s.empty || (this.updatePlugins(s), this.inputState.update(s)),
        (t = this.docView.update(s)),
        this.state.facet(ki) != this.styleModules && this.mountStyles(),
        (i = this.updateAttrs()),
        this.showAnnouncements(e),
        this.docView.updateSelection(
          t,
          e.some((u) => u.isUserEvent("select.pointer")),
        ));
    } finally {
      this.updateState = 0;
    }
    if (
      (s.startState.facet(xn) != s.state.facet(xn) &&
        (this.viewState.mustMeasureContent = !0),
      (t ||
        i ||
        f ||
        this.viewState.mustEnforceCursorAssoc ||
        this.viewState.mustMeasureContent) &&
        this.requestMeasure(),
      t && this.docViewUpdate(),
      !s.empty)
    )
      for (let u of this.state.facet(Cr))
        try {
          u(s);
        } catch (d) {
          De(this.state, d, "update listener");
        }
    (a || c) &&
      Promise.resolve().then(() => {
        (a && this.state == a.startState && this.dispatch(a),
          c &&
            !_h(this, c) &&
            h.force &&
            ei(this.contentDOM, h.key, h.keyCode));
      });
  }
  setState(e) {
    if (this.updateState != 0)
      throw new Error(
        "Calls to EditorView.setState are not allowed while an update is in progress",
      );
    if (this.destroyed) {
      this.viewState.state = e;
      return;
    }
    this.updateState = 2;
    let t = this.hasFocus;
    try {
      for (let i of this.plugins) i.destroy(this);
      ((this.viewState = new kl(this, e)),
        (this.plugins = e.facet(Jt).map((i) => new Os(i))),
        this.pluginMap.clear());
      for (let i of this.plugins) i.update(this);
      (this.docView.destroy(),
        (this.docView = new hl(this)),
        this.inputState.ensureHandlers(this.plugins),
        this.mountStyles(),
        this.updateAttrs(),
        (this.bidiCache = []));
    } finally {
      this.updateState = 0;
    }
    (t && this.focus(), this.requestMeasure());
  }
  updatePlugins(e) {
    let t = e.startState.facet(Jt),
      i = e.state.facet(Jt);
    if (t != i) {
      let s = [];
      for (let r of i) {
        let o = t.indexOf(r);
        if (o < 0) s.push(new Os(r));
        else {
          let l = this.plugins[o];
          ((l.mustUpdate = e), s.push(l));
        }
      }
      for (let r of this.plugins) r.mustUpdate != e && r.destroy(this);
      ((this.plugins = s), this.pluginMap.clear());
    } else for (let s of this.plugins) s.mustUpdate = e;
    for (let s = 0; s < this.plugins.length; s++) this.plugins[s].update(this);
    t != i && this.inputState.ensureHandlers(this.plugins);
  }
  docViewUpdate() {
    for (let e of this.plugins) {
      let t = e.value;
      if (t && t.docViewUpdate)
        try {
          t.docViewUpdate(this);
        } catch (i) {
          De(this.state, i, "doc view update listener");
        }
    }
  }
  measure(e = !0) {
    if (this.destroyed) return;
    if (
      (this.measureScheduled > -1 &&
        this.win.cancelAnimationFrame(this.measureScheduled),
      this.observer.delayedAndroidKey)
    ) {
      ((this.measureScheduled = -1), this.requestMeasure());
      return;
    }
    ((this.measureScheduled = 0), e && this.observer.forceFlush());
    let t = null,
      i = this.viewState.scrollParent,
      s = this.viewState.getScrollOffset(),
      { scrollAnchorPos: r, scrollAnchorHeight: o } = this.viewState;
    (Math.abs(s - this.viewState.scrollOffset) > 1 && (o = -1),
      (this.viewState.scrollAnchorHeight = -1));
    try {
      for (let l = 0; ; l++) {
        if (o < 0)
          if (gh(i || this.win))
            ((r = -1), (o = this.viewState.heightMap.height));
          else {
            let d = this.viewState.scrollAnchorAt(s);
            ((r = d.from), (o = d.top));
          }
        this.updateState = 1;
        let a = this.viewState.measure();
        if (
          !a &&
          !this.measureRequests.length &&
          this.viewState.scrollTarget == null
        )
          break;
        if (l > 5) {
          console.warn(
            this.measureRequests.length
              ? "Measure loop restarted more than 5 times"
              : "Viewport failed to stabilize",
          );
          break;
        }
        let h = [];
        a & 4 || ([this.measureRequests, h] = [h, this.measureRequests]);
        let c = h.map((d) => {
            try {
              return d.read(this);
            } catch (p) {
              return (De(this.state, p), Tl);
            }
          }),
          f = jn.create(this, this.state, []),
          u = !1;
        ((f.flags |= a),
          t ? (t.flags |= a) : (t = f),
          (this.updateState = 2),
          f.empty ||
            (this.updatePlugins(f),
            this.inputState.update(f),
            this.updateAttrs(),
            (u = this.docView.update(f)),
            u && this.docViewUpdate()));
        for (let d = 0; d < h.length; d++)
          if (c[d] != Tl)
            try {
              let p = h[d];
              p.write && p.write(c[d], this);
            } catch (p) {
              De(this.state, p);
            }
        if (
          (u && this.docView.updateSelection(!0),
          !f.viewportChanged && this.measureRequests.length == 0)
        ) {
          if (this.viewState.editorHeight)
            if (this.viewState.scrollTarget) {
              (this.docView.scrollIntoView(this.viewState.scrollTarget),
                (this.viewState.scrollTarget = null),
                (o = -1));
              continue;
            } else {
              let p =
                ((r < 0
                  ? this.viewState.heightMap.height
                  : this.viewState.lineBlockAt(r).top) -
                  o) /
                this.scaleY;
              if (
                (p > 1 || p < -1) &&
                (i == this.scrollDOM ||
                  this.hasFocus ||
                  Math.max(
                    this.inputState.lastWheelEvent,
                    this.inputState.lastTouchTime,
                  ) >
                    Date.now() - 100)
              ) {
                ((s = s + p),
                  i ? (i.scrollTop += p) : this.win.scrollBy(0, p),
                  (o = -1));
                continue;
              }
            }
          break;
        }
      }
    } finally {
      ((this.updateState = 0), (this.measureScheduled = -1));
    }
    if (t && !t.empty) for (let l of this.state.facet(Cr)) l(t);
  }
  get themeClasses() {
    return (
      Br + " " + (this.state.facet(Or) ? ec : Zh) + " " + this.state.facet(xn)
    );
  }
  updateAttrs() {
    let e = Dl(this, Rh, {
        class:
          "cm-editor" +
          (this.hasFocus ? " cm-focused " : " ") +
          this.themeClasses,
      }),
      t = {
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
        writingsuggestions: "false",
        translate: "no",
        contenteditable: this.state.facet(ht) ? "true" : "false",
        class: "cm-content",
        style: `${O.tabSize}: ${this.state.tabSize}`,
        role: "textbox",
        "aria-multiline": "true",
      };
    (this.state.readOnly && (t["aria-readonly"] = "true"), Dl(this, oo, t));
    let i = this.observer.ignore(() => {
      let s = nl(this.contentDOM, this.contentAttrs, t),
        r = nl(this.dom, this.editorAttrs, e);
      return s || r;
    });
    return ((this.editorAttrs = e), (this.contentAttrs = t), i);
  }
  showAnnouncements(e) {
    let t = !0;
    for (let i of e)
      for (let s of i.effects)
        if (s.is(A.announce)) {
          (t && (this.announceDOM.textContent = ""), (t = !1));
          let r = this.announceDOM.appendChild(document.createElement("div"));
          r.textContent = s.value;
        }
  }
  mountStyles() {
    this.styleModules = this.state.facet(ki);
    let e = this.state.facet(A.cspNonce);
    kt.mount(
      this.root,
      this.styleModules.concat(Qd).reverse(),
      e ? { nonce: e } : void 0,
    );
  }
  readMeasured() {
    if (this.updateState == 2)
      throw new Error(
        "Reading the editor layout isn't allowed during an update",
      );
    this.updateState == 0 && this.measureScheduled > -1 && this.measure(!1);
  }
  requestMeasure(e) {
    if (
      (this.measureScheduled < 0 &&
        (this.measureScheduled = this.win.requestAnimationFrame(() =>
          this.measure(),
        )),
      e)
    ) {
      if (this.measureRequests.indexOf(e) > -1) return;
      if (e.key != null) {
        for (let t = 0; t < this.measureRequests.length; t++)
          if (this.measureRequests[t].key === e.key) {
            this.measureRequests[t] = e;
            return;
          }
      }
      this.measureRequests.push(e);
    }
  }
  plugin(e) {
    let t = this.pluginMap.get(e);
    return (
      (t === void 0 || (t && t.plugin != e)) &&
        this.pluginMap.set(
          e,
          (t = this.plugins.find((i) => i.plugin == e) || null),
        ),
      t && t.update(this).value
    );
  }
  get documentTop() {
    return (
      this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop
    );
  }
  get documentPadding() {
    return {
      top: this.viewState.paddingTop,
      bottom: this.viewState.paddingBottom,
    };
  }
  get scaleX() {
    return this.viewState.scaleX;
  }
  get scaleY() {
    return this.viewState.scaleY;
  }
  elementAtHeight(e) {
    return (this.readMeasured(), this.viewState.elementAtHeight(e));
  }
  lineBlockAtHeight(e) {
    return (this.readMeasured(), this.viewState.lineBlockAtHeight(e));
  }
  get viewportLineBlocks() {
    return this.viewState.viewportLines;
  }
  lineBlockAt(e) {
    return this.viewState.lineBlockAt(e);
  }
  get contentHeight() {
    return this.viewState.contentHeight;
  }
  moveByChar(e, t, i) {
    return Ps(this, e, cl(this, e, t, i));
  }
  moveByGroup(e, t) {
    return Ps(
      this,
      e,
      cl(this, e, t, (i) => dd(this, e.head, i)),
    );
  }
  visualLineSide(e, t) {
    let i = this.bidiSpans(e),
      s = this.textDirectionAt(e.from),
      r = i[t ? i.length - 1 : 0];
    return x.cursor(r.side(t, s) + e.from, r.forward(!t, s) ? 1 : -1);
  }
  moveToLineBoundary(e, t, i = !0) {
    return ud(this, e, t, i);
  }
  moveVertically(e, t, i) {
    return Ps(this, e, pd(this, e, t, i));
  }
  domAtPos(e, t = 1) {
    return this.docView.domAtPos(e, t);
  }
  posAtDOM(e, t = 0) {
    return this.docView.posFromDOM(e, t);
  }
  posAtCoords(e, t = !0) {
    this.readMeasured();
    let i = Tr(this, e, t);
    return i && i.pos;
  }
  posAndSideAtCoords(e, t = !0) {
    return (this.readMeasured(), Tr(this, e, t));
  }
  coordsAtPos(e, t = 1) {
    this.readMeasured();
    let i = this.docView.coordsAt(e, t);
    if (!i || i.left == i.right) return i;
    let s = this.state.doc.lineAt(e),
      r = this.bidiSpans(s),
      o = r[it.find(r, e - s.from, -1, t)];
    return Wi(i, (o.dir == G.LTR) == t > 0);
  }
  coordsForChar(e) {
    return (this.readMeasured(), this.docView.coordsForChar(e));
  }
  get defaultCharacterWidth() {
    return this.viewState.heightOracle.charWidth;
  }
  get defaultLineHeight() {
    return this.viewState.heightOracle.lineHeight;
  }
  get textDirection() {
    return this.viewState.defaultTextDirection;
  }
  textDirectionAt(e) {
    return !this.state.facet(Bh) ||
      e < this.viewport.from ||
      e > this.viewport.to
      ? this.textDirection
      : (this.readMeasured(), this.docView.textDirectionAt(e));
  }
  get lineWrapping() {
    return this.viewState.heightOracle.lineWrapping;
  }
  bidiSpans(e) {
    if (e.length > np) return kh(e.length);
    let t = this.textDirectionAt(e.from),
      i;
    for (let r of this.bidiCache)
      if (
        r.from == e.from &&
        r.dir == t &&
        (r.fresh || vh(r.isolates, (i = ol(this, e))))
      )
        return r.order;
    i || (i = ol(this, e));
    let s = Hu(e.text, t, i);
    return (this.bidiCache.push(new Xn(e.from, e.to, t, i, !0, s)), s);
  }
  get hasFocus() {
    var e;
    return (
      (this.dom.ownerDocument.hasFocus() ||
        (O.safari &&
          ((e = this.inputState) === null || e === void 0
            ? void 0
            : e.lastContextMenu) >
            Date.now() - 3e4)) &&
      this.root.activeElement == this.contentDOM
    );
  }
  focus() {
    this.observer.ignore(() => {
      (mh(this.contentDOM), this.docView.updateSelection());
    });
  }
  setRoot(e) {
    this._root != e &&
      ((this._root = e),
      this.observer.setWindow(
        (e.nodeType == 9 ? e : e.ownerDocument).defaultView || window,
      ),
      this.mountStyles());
  }
  destroy() {
    this.root.activeElement == this.contentDOM && this.contentDOM.blur();
    for (let e of this.plugins) e.destroy(this);
    ((this.plugins = []),
      this.inputState.destroy(),
      this.docView.destroy(),
      this.dom.remove(),
      this.observer.destroy(),
      this.measureScheduled > -1 &&
        this.win.cancelAnimationFrame(this.measureScheduled),
      (this.destroyed = !0));
  }
  static scrollIntoView(e, t = {}) {
    return dn.of(
      new ti(
        typeof e == "number" ? x.cursor(e) : e,
        t.y,
        t.x,
        t.yMargin,
        t.xMargin,
      ),
    );
  }
  scrollSnapshot() {
    let { scrollTop: e, scrollLeft: t } = this.scrollDOM,
      i = this.viewState.scrollAnchorAt(e);
    return dn.of(new ti(x.cursor(i.from), "start", "start", i.top - e, t, !0));
  }
  setTabFocusMode(e) {
    e == null
      ? (this.inputState.tabFocusMode =
          this.inputState.tabFocusMode < 0 ? 0 : -1)
      : typeof e == "boolean"
        ? (this.inputState.tabFocusMode = e ? 0 : -1)
        : this.inputState.tabFocusMode != 0 &&
          (this.inputState.tabFocusMode = Date.now() + e);
  }
  static domEventHandlers(e) {
    return ne.define(() => ({}), { eventHandlers: e });
  }
  static domEventObservers(e) {
    return ne.define(() => ({}), { eventObservers: e });
  }
  static theme(e, t) {
    let i = kt.newName(),
      s = [xn.of(i), ki.of(Er(`.${i}`, e))];
    return (t && t.dark && s.push(Or.of(!0)), s);
  }
  static baseTheme(e) {
    return Dt.lowest(ki.of(Er("." + Br, e, tc)));
  }
  static findFromDOM(e) {
    var t;
    let i = e.querySelector(".cm-content"),
      s = (i && ie.get(i)) || ie.get(e);
    return ((t = s?.root) === null || t === void 0 ? void 0 : t.view) || null;
  }
}
A.styleModule = ki;
A.inputHandler = Dh;
A.clipboardInputFilter = so;
A.clipboardOutputFilter = ro;
A.scrollHandler = Lh;
A.focusChangeEffect = Oh;
A.perLineTextDirection = Bh;
A.exceptionSink = Th;
A.updateListener = Cr;
A.editable = ht;
A.mouseSelectionStyle = Mh;
A.dragMovesSelection = Ah;
A.clickAddsSelectionRange = Ch;
A.decorations = ds;
A.blockWrappers = Ih;
A.outerDecorations = lo;
A.atomicRanges = en;
A.bidiIsolatedRanges = Nh;
A.scrollMargins = Wh;
A.darkTheme = Or;
A.cspNonce = D.define({ combine: (n) => (n.length ? n[0] : "") });
A.contentAttributes = oo;
A.editorAttributes = Rh;
A.lineWrapping = A.contentAttributes.of({ class: "cm-lineWrapping" });
A.announce = R.define();
const np = 4096,
  Tl = {};
class Xn {
  constructor(e, t, i, s, r, o) {
    ((this.from = e),
      (this.to = t),
      (this.dir = i),
      (this.isolates = s),
      (this.fresh = r),
      (this.order = o));
  }
  static update(e, t) {
    if (t.empty && !e.some((r) => r.fresh)) return e;
    let i = [],
      s = e.length ? e[e.length - 1].dir : G.LTR;
    for (let r = Math.max(0, e.length - 10); r < e.length; r++) {
      let o = e[r];
      o.dir == s &&
        !t.touchesRange(o.from, o.to) &&
        i.push(
          new Xn(
            t.mapPos(o.from, 1),
            t.mapPos(o.to, -1),
            o.dir,
            o.isolates,
            !1,
            o.order,
          ),
        );
    }
    return i;
  }
}
function Dl(n, e, t) {
  for (let i = n.state.facet(e), s = i.length - 1; s >= 0; s--) {
    let r = i[s],
      o = typeof r == "function" ? r(n) : r;
    o && to(o, t);
  }
  return t;
}
const sp = O.mac ? "mac" : O.windows ? "win" : O.linux ? "linux" : "key";
function rp(n, e) {
  const t = n.split(/-(?!$)/);
  let i = t[t.length - 1];
  i == "Space" && (i = " ");
  let s, r, o, l;
  for (let a = 0; a < t.length - 1; ++a) {
    const h = t[a];
    if (/^(cmd|meta|m)$/i.test(h)) l = !0;
    else if (/^a(lt)?$/i.test(h)) s = !0;
    else if (/^(c|ctrl|control)$/i.test(h)) r = !0;
    else if (/^s(hift)?$/i.test(h)) o = !0;
    else if (/^mod$/i.test(h)) e == "mac" ? (l = !0) : (r = !0);
    else throw new Error("Unrecognized modifier name: " + h);
  }
  return (
    s && (i = "Alt-" + i),
    r && (i = "Ctrl-" + i),
    l && (i = "Meta-" + i),
    o && (i = "Shift-" + i),
    i
  );
}
function wn(n, e, t) {
  return (
    e.altKey && (n = "Alt-" + n),
    e.ctrlKey && (n = "Ctrl-" + n),
    e.metaKey && (n = "Meta-" + n),
    t !== !1 && e.shiftKey && (n = "Shift-" + n),
    n
  );
}
const op = Dt.default(
    A.domEventHandlers({
      keydown(n, e) {
        return nc(ic(e.state), n, e, "editor");
      },
    }),
  ),
  tn = D.define({ enables: op }),
  Ol = new WeakMap();
function ic(n) {
  let e = n.facet(tn),
    t = Ol.get(e);
  return (t || Ol.set(e, (t = hp(e.reduce((i, s) => i.concat(s), [])))), t);
}
function lp(n, e, t) {
  return nc(ic(n.state), e, n, t);
}
let yt = null;
const ap = 4e3;
function hp(n, e = sp) {
  let t = Object.create(null),
    i = Object.create(null),
    s = (o, l) => {
      let a = i[o];
      if (a == null) i[o] = l;
      else if (a != l)
        throw new Error(
          "Key binding " +
            o +
            " is used both as a regular binding and as a multi-stroke prefix",
        );
    },
    r = (o, l, a, h, c) => {
      var f, u;
      let d = t[o] || (t[o] = Object.create(null)),
        p = l.split(/ (?!$)/).map((b) => rp(b, e));
      for (let b = 1; b < p.length; b++) {
        let w = p.slice(0, b).join(" ");
        (s(w, !0),
          d[w] ||
            (d[w] = {
              preventDefault: !0,
              stopPropagation: !1,
              run: [
                (v) => {
                  let T = (yt = { view: v, prefix: w, scope: o });
                  return (
                    setTimeout(() => {
                      yt == T && (yt = null);
                    }, ap),
                    !0
                  );
                },
              ],
            }));
      }
      let m = p.join(" ");
      s(m, !1);
      let g =
        d[m] ||
        (d[m] = {
          preventDefault: !1,
          stopPropagation: !1,
          run:
            ((u = (f = d._any) === null || f === void 0 ? void 0 : f.run) ===
              null || u === void 0
              ? void 0
              : u.slice()) || [],
        });
      (a && g.run.push(a),
        h && (g.preventDefault = !0),
        c && (g.stopPropagation = !0));
    };
  for (let o of n) {
    let l = o.scope ? o.scope.split(" ") : ["editor"];
    if (o.any)
      for (let h of l) {
        let c = t[h] || (t[h] = Object.create(null));
        c._any ||
          (c._any = { preventDefault: !1, stopPropagation: !1, run: [] });
        let { any: f } = o;
        for (let u in c) c[u].run.push((d) => f(d, Lr));
      }
    let a = o[e] || o.key;
    if (a)
      for (let h of l)
        (r(h, a, o.run, o.preventDefault, o.stopPropagation),
          o.shift &&
            r(h, "Shift-" + a, o.shift, o.preventDefault, o.stopPropagation));
  }
  return t;
}
let Lr = null;
function nc(n, e, t, i) {
  Lr = e;
  let s = Su(e),
    r = Ae(s, 0),
    o = et(r) == s.length && s != " ",
    l = "",
    a = !1,
    h = !1,
    c = !1;
  yt &&
    yt.view == t &&
    yt.scope == i &&
    ((l = yt.prefix + " "),
    Kh.indexOf(e.keyCode) < 0 && ((h = !0), (yt = null)));
  let f = new Set(),
    u = (g) => {
      if (g) {
        for (let b of g.run)
          if (!f.has(b) && (f.add(b), b(t)))
            return (g.stopPropagation && (c = !0), !0);
        g.preventDefault && (g.stopPropagation && (c = !0), (h = !0));
      }
      return !1;
    },
    d = n[i],
    p,
    m;
  return (
    d &&
      (u(d[l + wn(s, e, !o)])
        ? (a = !0)
        : o &&
            (e.altKey || e.metaKey || e.ctrlKey) &&
            !(O.windows && e.ctrlKey && e.altKey) &&
            !(O.mac && e.altKey && !(e.ctrlKey || e.metaKey)) &&
            (p = St[e.keyCode]) &&
            p != s
          ? (u(d[l + wn(p, e, !0)]) ||
              (e.shiftKey &&
                (m = Ri[e.keyCode]) != s &&
                m != p &&
                u(d[l + wn(m, e, !1)]))) &&
            (a = !0)
          : o && e.shiftKey && u(d[l + wn(s, e, !0)]) && (a = !0),
      !a && u(d._any) && (a = !0)),
    h && (a = !0),
    a && c && e.stopPropagation(),
    (Lr = null),
    a
  );
}
class nn {
  constructor(e, t, i, s, r) {
    ((this.className = e),
      (this.left = t),
      (this.top = i),
      (this.width = s),
      (this.height = r));
  }
  draw() {
    let e = document.createElement("div");
    return ((e.className = this.className), this.adjust(e), e);
  }
  update(e, t) {
    return t.className != this.className ? !1 : (this.adjust(e), !0);
  }
  adjust(e) {
    ((e.style.left = this.left + "px"),
      (e.style.top = this.top + "px"),
      this.width != null && (e.style.width = this.width + "px"),
      (e.style.height = this.height + "px"));
  }
  eq(e) {
    return (
      this.left == e.left &&
      this.top == e.top &&
      this.width == e.width &&
      this.height == e.height &&
      this.className == e.className
    );
  }
  static forRange(e, t, i) {
    if (i.empty) {
      let s = e.coordsAtPos(i.head, i.assoc || 1);
      if (!s) return [];
      let r = sc(e);
      return [
        new nn(t, s.left - r.left, s.top - r.top, null, s.bottom - s.top),
      ];
    } else return cp(e, t, i);
  }
}
function sc(n) {
  let e = n.scrollDOM.getBoundingClientRect();
  return {
    left:
      (n.textDirection == G.LTR
        ? e.left
        : e.right - n.scrollDOM.clientWidth * n.scaleX) -
      n.scrollDOM.scrollLeft * n.scaleX,
    top: e.top - n.scrollDOM.scrollTop * n.scaleY,
  };
}
function Bl(n, e, t, i) {
  let s = n.coordsAtPos(e, t * 2);
  if (!s) return i;
  let r = n.dom.getBoundingClientRect(),
    o = (s.top + s.bottom) / 2,
    l = n.posAtCoords({ x: r.left + 1, y: o }),
    a = n.posAtCoords({ x: r.right - 1, y: o });
  return l == null || a == null
    ? i
    : {
        from: Math.max(i.from, Math.min(l, a)),
        to: Math.min(i.to, Math.max(l, a)),
      };
}
function cp(n, e, t) {
  if (t.to <= n.viewport.from || t.from >= n.viewport.to) return [];
  let i = Math.max(t.from, n.viewport.from),
    s = Math.min(t.to, n.viewport.to),
    r = n.textDirection == G.LTR,
    o = n.contentDOM,
    l = o.getBoundingClientRect(),
    a = sc(n),
    h = o.querySelector(".cm-line"),
    c = h && window.getComputedStyle(h),
    f =
      l.left +
      (c ? parseInt(c.paddingLeft) + Math.min(0, parseInt(c.textIndent)) : 0),
    u = l.right - (c ? parseInt(c.paddingRight) : 0),
    d = Mr(n, i, 1),
    p = Mr(n, s, -1),
    m = d.type == me.Text ? d : null,
    g = p.type == me.Text ? p : null;
  if (
    (m && (n.lineWrapping || d.widgetLineBreaks) && (m = Bl(n, i, 1, m)),
    g && (n.lineWrapping || p.widgetLineBreaks) && (g = Bl(n, s, -1, g)),
    m && g && m.from == g.from && m.to == g.to)
  )
    return w(v(t.from, t.to, m));
  {
    let k = m ? v(t.from, null, m) : T(d, !1),
      S = g ? v(null, t.to, g) : T(p, !0),
      C = [];
    return (
      (m || d).to < (g || p).from - (m && g ? 1 : 0) ||
      (d.widgetLineBreaks > 1 && k.bottom + n.defaultLineHeight / 2 < S.top)
        ? C.push(b(f, k.bottom, u, S.top))
        : k.bottom < S.top &&
          n.elementAtHeight((k.bottom + S.top) / 2).type == me.Text &&
          (k.bottom = S.top = (k.bottom + S.top) / 2),
      w(k).concat(C).concat(w(S))
    );
  }
  function b(k, S, C, P) {
    return new nn(e, k - a.left, S - a.top, Math.max(0, C - k), P - S);
  }
  function w({ top: k, bottom: S, horizontal: C }) {
    let P = [];
    for (let B = 0; B < C.length; B += 2) P.push(b(C[B], k, C[B + 1], S));
    return P;
  }
  function v(k, S, C) {
    let P = 1e9,
      B = -1e9,
      F = [];
    function I(W, V, X, Z, ye) {
      let $ = n.coordsAtPos(W, W == C.to ? -2 : 2),
        re = n.coordsAtPos(X, X == C.from ? 2 : -2);
      !$ ||
        !re ||
        ((P = Math.min($.top, re.top, P)),
        (B = Math.max($.bottom, re.bottom, B)),
        ye == G.LTR
          ? F.push(r && V ? f : $.left, r && Z ? u : re.right)
          : F.push(!r && Z ? f : re.left, !r && V ? u : $.right));
    }
    let E = k ?? C.from,
      N = S ?? C.to;
    for (let W of n.visibleRanges)
      if (W.to > E && W.from < N)
        for (let V = Math.max(W.from, E), X = Math.min(W.to, N); ; ) {
          let Z = n.state.doc.lineAt(V);
          for (let ye of n.bidiSpans(Z)) {
            let $ = ye.from + Z.from,
              re = ye.to + Z.from;
            if ($ >= X) break;
            re > V &&
              I(
                Math.max($, V),
                k == null && $ <= E,
                Math.min(re, X),
                S == null && re >= N,
                ye.dir,
              );
          }
          if (((V = Z.to + 1), V >= X)) break;
        }
    return (
      F.length == 0 && I(E, k == null, N, S == null, n.textDirection),
      { top: P, bottom: B, horizontal: F }
    );
  }
  function T(k, S) {
    let C = l.top + (S ? k.top : k.bottom);
    return { top: C, bottom: C, horizontal: [] };
  }
}
function fp(n, e) {
  return n.constructor == e.constructor && n.eq(e);
}
class up {
  constructor(e, t) {
    ((this.view = e),
      (this.layer = t),
      (this.drawn = []),
      (this.scaleX = 1),
      (this.scaleY = 1),
      (this.measureReq = {
        read: this.measure.bind(this),
        write: this.draw.bind(this),
      }),
      (this.dom = e.scrollDOM.appendChild(document.createElement("div"))),
      this.dom.classList.add("cm-layer"),
      t.above && this.dom.classList.add("cm-layer-above"),
      t.class && this.dom.classList.add(t.class),
      this.scale(),
      this.dom.setAttribute("aria-hidden", "true"),
      this.setOrder(e.state),
      e.requestMeasure(this.measureReq),
      t.mount && t.mount(this.dom, e));
  }
  update(e) {
    (e.startState.facet(Nn) != e.state.facet(Nn) && this.setOrder(e.state),
      (this.layer.update(e, this.dom) || e.geometryChanged) &&
        (this.scale(), e.view.requestMeasure(this.measureReq)));
  }
  docViewUpdate(e) {
    this.layer.updateOnDocViewUpdate !== !1 &&
      e.requestMeasure(this.measureReq);
  }
  setOrder(e) {
    let t = 0,
      i = e.facet(Nn);
    for (; t < i.length && i[t] != this.layer; ) t++;
    this.dom.style.zIndex = String((this.layer.above ? 150 : -1) - t);
  }
  measure() {
    return this.layer.markers(this.view);
  }
  scale() {
    let { scaleX: e, scaleY: t } = this.view;
    (e != this.scaleX || t != this.scaleY) &&
      ((this.scaleX = e),
      (this.scaleY = t),
      (this.dom.style.transform = `scale(${1 / e}, ${1 / t})`));
  }
  draw(e) {
    if (
      e.length != this.drawn.length ||
      e.some((t, i) => !fp(t, this.drawn[i]))
    ) {
      let t = this.dom.firstChild,
        i = 0;
      for (let s of e)
        s.update &&
        t &&
        s.constructor &&
        this.drawn[i].constructor &&
        s.update(t, this.drawn[i])
          ? ((t = t.nextSibling), i++)
          : this.dom.insertBefore(s.draw(), t);
      for (; t; ) {
        let s = t.nextSibling;
        (t.remove(), (t = s));
      }
      ((this.drawn = e),
        O.safari &&
          O.safari_version >= 26 &&
          (this.dom.style.display = this.dom.firstChild ? "" : "none"));
    }
  }
  destroy() {
    (this.layer.destroy && this.layer.destroy(this.dom, this.view),
      this.dom.remove());
  }
}
const Nn = D.define();
function rc(n) {
  return [ne.define((e) => new up(e, n)), Nn.of(n)];
}
const Hi = D.define({
  combine(n) {
    return at(
      n,
      { cursorBlinkRate: 1200, drawRangeCursor: !0 },
      {
        cursorBlinkRate: (e, t) => Math.min(e, t),
        drawRangeCursor: (e, t) => e || t,
      },
    );
  },
});
function dp(n = {}) {
  return [Hi.of(n), pp, mp, gp, Eh.of(!0)];
}
function oc(n) {
  return n.startState.facet(Hi) != n.state.facet(Hi);
}
const pp = rc({
  above: !0,
  markers(n) {
    let { state: e } = n,
      t = e.facet(Hi),
      i = [];
    for (let s of e.selection.ranges) {
      let r = s == e.selection.main;
      if (s.empty || t.drawRangeCursor) {
        let o = r
            ? "cm-cursor cm-cursor-primary"
            : "cm-cursor cm-cursor-secondary",
          l = s.empty ? s : x.cursor(s.head, s.head > s.anchor ? -1 : 1);
        for (let a of nn.forRange(n, o, l)) i.push(a);
      }
    }
    return i;
  },
  update(n, e) {
    n.transactions.some((i) => i.selection) &&
      (e.style.animationName =
        e.style.animationName == "cm-blink" ? "cm-blink2" : "cm-blink");
    let t = oc(n);
    return (t && El(n.state, e), n.docChanged || n.selectionSet || t);
  },
  mount(n, e) {
    El(e.state, n);
  },
  class: "cm-cursorLayer",
});
function El(n, e) {
  e.style.animationDuration = n.facet(Hi).cursorBlinkRate + "ms";
}
const mp = rc({
    above: !1,
    markers(n) {
      return n.state.selection.ranges
        .map((e) =>
          e.empty ? [] : nn.forRange(n, "cm-selectionBackground", e),
        )
        .reduce((e, t) => e.concat(t));
    },
    update(n, e) {
      return n.docChanged || n.selectionSet || n.viewportChanged || oc(n);
    },
    class: "cm-selectionLayer",
  }),
  gp = Dt.highest(
    A.theme({
      ".cm-line": {
        "& ::selection, &::selection": {
          backgroundColor: "transparent !important",
        },
        caretColor: "transparent !important",
      },
      ".cm-content": {
        caretColor: "transparent !important",
        "& :focus": {
          caretColor: "initial !important",
          "&::selection, & ::selection": {
            backgroundColor: "Highlight !important",
          },
        },
      },
    }),
  ),
  lc = R.define({
    map(n, e) {
      return n == null ? null : e.mapPos(n);
    },
  }),
  Ci = ce.define({
    create() {
      return null;
    },
    update(n, e) {
      return (
        n != null && (n = e.changes.mapPos(n)),
        e.effects.reduce((t, i) => (i.is(lc) ? i.value : t), n)
      );
    },
  }),
  yp = ne.fromClass(
    class {
      constructor(n) {
        ((this.view = n),
          (this.cursor = null),
          (this.measureReq = {
            read: this.readPos.bind(this),
            write: this.drawCursor.bind(this),
          }));
      }
      update(n) {
        var e;
        let t = n.state.field(Ci);
        t == null
          ? this.cursor != null &&
            ((e = this.cursor) === null || e === void 0 || e.remove(),
            (this.cursor = null))
          : (this.cursor ||
              ((this.cursor = this.view.scrollDOM.appendChild(
                document.createElement("div"),
              )),
              (this.cursor.className = "cm-dropCursor")),
            (n.startState.field(Ci) != t ||
              n.docChanged ||
              n.geometryChanged) &&
              this.view.requestMeasure(this.measureReq));
      }
      readPos() {
        let { view: n } = this,
          e = n.state.field(Ci),
          t = e != null && n.coordsAtPos(e);
        if (!t) return null;
        let i = n.scrollDOM.getBoundingClientRect();
        return {
          left: t.left - i.left + n.scrollDOM.scrollLeft * n.scaleX,
          top: t.top - i.top + n.scrollDOM.scrollTop * n.scaleY,
          height: t.bottom - t.top,
        };
      }
      drawCursor(n) {
        if (this.cursor) {
          let { scaleX: e, scaleY: t } = this.view;
          n
            ? ((this.cursor.style.left = n.left / e + "px"),
              (this.cursor.style.top = n.top / t + "px"),
              (this.cursor.style.height = n.height / t + "px"))
            : (this.cursor.style.left = "-100000px");
        }
      }
      destroy() {
        this.cursor && this.cursor.remove();
      }
      setDropPos(n) {
        this.view.state.field(Ci) != n &&
          this.view.dispatch({ effects: lc.of(n) });
      }
    },
    {
      eventObservers: {
        dragover(n) {
          this.setDropPos(
            this.view.posAtCoords({ x: n.clientX, y: n.clientY }),
          );
        },
        dragleave(n) {
          (n.target == this.view.contentDOM ||
            !this.view.contentDOM.contains(n.relatedTarget)) &&
            this.setDropPos(null);
        },
        dragend() {
          this.setDropPos(null);
        },
        drop() {
          this.setDropPos(null);
        },
      },
    },
  );
function bp() {
  return [Ci, yp];
}
function Ll(n, e, t, i, s) {
  e.lastIndex = 0;
  for (let r = n.iterRange(t, i), o = t, l; !r.next().done; o += r.value.length)
    if (!r.lineBreak) for (; (l = e.exec(r.value)); ) s(o + l.index, l);
}
function xp(n, e) {
  let t = n.visibleRanges;
  if (t.length == 1 && t[0].from == n.viewport.from && t[0].to == n.viewport.to)
    return t;
  let i = [];
  for (let { from: s, to: r } of t)
    ((s = Math.max(n.state.doc.lineAt(s).from, s - e)),
      (r = Math.min(n.state.doc.lineAt(r).to, r + e)),
      i.length && i[i.length - 1].to >= s
        ? (i[i.length - 1].to = r)
        : i.push({ from: s, to: r }));
  return i;
}
class wp {
  constructor(e) {
    const {
      regexp: t,
      decoration: i,
      decorate: s,
      boundary: r,
      maxLength: o = 1e3,
    } = e;
    if (!t.global)
      throw new RangeError(
        "The regular expression given to MatchDecorator should have its 'g' flag set",
      );
    if (((this.regexp = t), s))
      this.addMatch = (l, a, h, c) => s(c, h, h + l[0].length, l, a);
    else if (typeof i == "function")
      this.addMatch = (l, a, h, c) => {
        let f = i(l, a, h);
        f && c(h, h + l[0].length, f);
      };
    else if (i) this.addMatch = (l, a, h, c) => c(h, h + l[0].length, i);
    else
      throw new RangeError(
        "Either 'decorate' or 'decoration' should be provided to MatchDecorator",
      );
    ((this.boundary = r), (this.maxLength = o));
  }
  createDeco(e) {
    let t = new ut(),
      i = t.add.bind(t);
    for (let { from: s, to: r } of xp(e, this.maxLength))
      Ll(e.state.doc, this.regexp, s, r, (o, l) => this.addMatch(l, e, o, i));
    return t.finish();
  }
  updateDeco(e, t) {
    let i = 1e9,
      s = -1;
    return (
      e.docChanged &&
        e.changes.iterChanges((r, o, l, a) => {
          a >= e.view.viewport.from &&
            l <= e.view.viewport.to &&
            ((i = Math.min(l, i)), (s = Math.max(a, s)));
        }),
      e.viewportMoved || s - i > 1e3
        ? this.createDeco(e.view)
        : s > -1
          ? this.updateRange(e.view, t.map(e.changes), i, s)
          : t
    );
  }
  updateRange(e, t, i, s) {
    for (let r of e.visibleRanges) {
      let o = Math.max(r.from, i),
        l = Math.min(r.to, s);
      if (l >= o) {
        let a = e.state.doc.lineAt(o),
          h = a.to < l ? e.state.doc.lineAt(l) : a,
          c = Math.max(r.from, a.from),
          f = Math.min(r.to, h.to);
        if (this.boundary) {
          for (; o > a.from; o--)
            if (this.boundary.test(a.text[o - 1 - a.from])) {
              c = o;
              break;
            }
          for (; l < h.to; l++)
            if (this.boundary.test(h.text[l - h.from])) {
              f = l;
              break;
            }
        }
        let u = [],
          d,
          p = (m, g, b) => u.push(b.range(m, g));
        if (a == h)
          for (
            this.regexp.lastIndex = c - a.from;
            (d = this.regexp.exec(a.text)) && d.index < f - a.from;
          )
            this.addMatch(d, e, d.index + a.from, p);
        else
          Ll(e.state.doc, this.regexp, c, f, (m, g) =>
            this.addMatch(g, e, m, p),
          );
        t = t.update({
          filterFrom: c,
          filterTo: f,
          filter: (m, g) => m < c || g > f,
          add: u,
        });
      }
    }
    return t;
  }
}
const Pr = /x/.unicode != null ? "gu" : "g",
  vp = new RegExp(
    `[\0-\b
--­؜​‎‏\u2028\u2029‭‮⁦⁧⁩\uFEFF￹-￼]`,
    Pr,
  ),
  kp = {
    0: "null",
    7: "bell",
    8: "backspace",
    10: "newline",
    11: "vertical tab",
    13: "carriage return",
    27: "escape",
    8203: "zero width space",
    8204: "zero width non-joiner",
    8205: "zero width joiner",
    8206: "left-to-right mark",
    8207: "right-to-left mark",
    8232: "line separator",
    8237: "left-to-right override",
    8238: "right-to-left override",
    8294: "left-to-right isolate",
    8295: "right-to-left isolate",
    8297: "pop directional isolate",
    8233: "paragraph separator",
    65279: "zero width no-break space",
    65532: "object replacement",
  };
let Ns = null;
function Sp() {
  var n;
  if (Ns == null && typeof document < "u" && document.body) {
    let e = document.body.style;
    Ns = ((n = e.tabSize) !== null && n !== void 0 ? n : e.MozTabSize) != null;
  }
  return Ns || !1;
}
const Wn = D.define({
  combine(n) {
    let e = at(n, { render: null, specialChars: vp, addSpecialChars: null });
    return (
      (e.replaceTabs = !Sp()) &&
        (e.specialChars = new RegExp("	|" + e.specialChars.source, Pr)),
      e.addSpecialChars &&
        (e.specialChars = new RegExp(
          e.specialChars.source + "|" + e.addSpecialChars.source,
          Pr,
        )),
      e
    );
  },
});
function Cp(n = {}) {
  return [Wn.of(n), Ap()];
}
let Pl = null;
function Ap() {
  return (
    Pl ||
    (Pl = ne.fromClass(
      class {
        constructor(n) {
          ((this.view = n),
            (this.decorations = L.none),
            (this.decorationCache = Object.create(null)),
            (this.decorator = this.makeDecorator(n.state.facet(Wn))),
            (this.decorations = this.decorator.createDeco(n)));
        }
        makeDecorator(n) {
          return new wp({
            regexp: n.specialChars,
            decoration: (e, t, i) => {
              let { doc: s } = t.state,
                r = Ae(e[0], 0);
              if (r == 9) {
                let o = s.lineAt(i),
                  l = t.state.tabSize,
                  a = ui(o.text, l, i - o.from);
                return L.replace({
                  widget: new Op(
                    ((l - (a % l)) * this.view.defaultCharacterWidth) /
                      this.view.scaleX,
                  ),
                });
              }
              return (
                this.decorationCache[r] ||
                (this.decorationCache[r] = L.replace({ widget: new Dp(n, r) }))
              );
            },
            boundary: n.replaceTabs ? void 0 : /[^]/,
          });
        }
        update(n) {
          let e = n.state.facet(Wn);
          n.startState.facet(Wn) != e
            ? ((this.decorator = this.makeDecorator(e)),
              (this.decorations = this.decorator.createDeco(n.view)))
            : (this.decorations = this.decorator.updateDeco(
                n,
                this.decorations,
              ));
        }
      },
      { decorations: (n) => n.decorations },
    ))
  );
}
const Mp = "•";
function Tp(n) {
  return n >= 32 ? Mp : n == 10 ? "␤" : String.fromCharCode(9216 + n);
}
class Dp extends Ke {
  constructor(e, t) {
    (super(), (this.options = e), (this.code = t));
  }
  eq(e) {
    return e.code == this.code;
  }
  toDOM(e) {
    let t = Tp(this.code),
      i =
        e.state.phrase("Control character") +
        " " +
        (kp[this.code] || "0x" + this.code.toString(16)),
      s = this.options.render && this.options.render(this.code, i, t);
    if (s) return s;
    let r = document.createElement("span");
    return (
      (r.textContent = t),
      (r.title = i),
      r.setAttribute("aria-label", i),
      (r.className = "cm-specialChar"),
      r
    );
  }
  ignoreEvent() {
    return !1;
  }
}
class Op extends Ke {
  constructor(e) {
    (super(), (this.width = e));
  }
  eq(e) {
    return e.width == this.width;
  }
  toDOM() {
    let e = document.createElement("span");
    return (
      (e.textContent = "	"),
      (e.className = "cm-tab"),
      (e.style.width = this.width + "px"),
      e
    );
  }
  ignoreEvent() {
    return !1;
  }
}
function Bp() {
  return Lp;
}
const Ep = L.line({ class: "cm-activeLine" }),
  Lp = ne.fromClass(
    class {
      constructor(n) {
        this.decorations = this.getDeco(n);
      }
      update(n) {
        (n.docChanged || n.selectionSet) &&
          (this.decorations = this.getDeco(n.view));
      }
      getDeco(n) {
        let e = -1,
          t = [];
        for (let i of n.state.selection.ranges) {
          let s = n.lineBlockAt(i.head);
          s.from > e && (t.push(Ep.range(s.from)), (e = s.from));
        }
        return L.set(t);
      }
    },
    { decorations: (n) => n.decorations },
  );
class Pp extends Ke {
  constructor(e) {
    (super(), (this.content = e));
  }
  toDOM(e) {
    let t = document.createElement("span");
    return (
      (t.className = "cm-placeholder"),
      (t.style.pointerEvents = "none"),
      t.appendChild(
        typeof this.content == "string"
          ? document.createTextNode(this.content)
          : typeof this.content == "function"
            ? this.content(e)
            : this.content.cloneNode(!0),
      ),
      t.setAttribute("aria-hidden", "true"),
      t
    );
  }
  coordsAt(e) {
    let t = e.firstChild ? Di(e.firstChild) : [];
    if (!t.length) return null;
    let i = window.getComputedStyle(e.parentNode),
      s = Wi(t[0], i.direction != "rtl"),
      r = parseInt(i.lineHeight);
    return s.bottom - s.top > r * 1.5
      ? { left: s.left, right: s.right, top: s.top, bottom: s.top + r }
      : s;
  }
  ignoreEvent() {
    return !1;
  }
}
function Rp(n) {
  let e = ne.fromClass(
    class {
      constructor(t) {
        ((this.view = t),
          (this.placeholder = n
            ? L.set([L.widget({ widget: new Pp(n), side: 1 }).range(0)])
            : L.none));
      }
      get decorations() {
        return this.view.state.doc.length ? L.none : this.placeholder;
      }
    },
    { decorations: (t) => t.decorations },
  );
  return typeof n == "string"
    ? [e, A.contentAttributes.of({ "aria-placeholder": n })]
    : e;
}
const Rr = 2e3;
function Ip(n, e, t) {
  let i = Math.min(e.line, t.line),
    s = Math.max(e.line, t.line),
    r = [];
  if (e.off > Rr || t.off > Rr || e.col < 0 || t.col < 0) {
    let o = Math.min(e.off, t.off),
      l = Math.max(e.off, t.off);
    for (let a = i; a <= s; a++) {
      let h = n.doc.line(a);
      h.length <= l && r.push(x.range(h.from + o, h.to + l));
    }
  } else {
    let o = Math.min(e.col, t.col),
      l = Math.max(e.col, t.col);
    for (let a = i; a <= s; a++) {
      let h = n.doc.line(a),
        c = dr(h.text, o, n.tabSize, !0);
      if (c < 0) r.push(x.cursor(h.to));
      else {
        let f = dr(h.text, l, n.tabSize);
        r.push(x.range(h.from + c, h.from + f));
      }
    }
  }
  return r;
}
function Np(n, e) {
  let t = n.coordsAtPos(n.viewport.from);
  return t ? Math.round(Math.abs((t.left - e) / n.defaultCharacterWidth)) : -1;
}
function Rl(n, e) {
  let t = n.posAtCoords({ x: e.clientX, y: e.clientY }, !1),
    i = n.state.doc.lineAt(t),
    s = t - i.from,
    r =
      s > Rr
        ? -1
        : s == i.length
          ? Np(n, e.clientX)
          : ui(i.text, n.state.tabSize, t - i.from);
  return { line: i.number, col: r, off: s };
}
function Wp(n, e) {
  let t = Rl(n, e),
    i = n.state.selection;
  return t
    ? {
        update(s) {
          if (s.docChanged) {
            let r = s.changes.mapPos(s.startState.doc.line(t.line).from),
              o = s.state.doc.lineAt(r);
            ((t = {
              line: o.number,
              col: t.col,
              off: Math.min(t.off, o.length),
            }),
              (i = i.map(s.changes)));
          }
        },
        get(s, r, o) {
          let l = Rl(n, s);
          if (!l) return i;
          let a = Ip(n.state, t, l);
          return a.length
            ? o
              ? x.create(a.concat(i.ranges))
              : x.create(a)
            : i;
        },
      }
    : null;
}
function Fp(n) {
  let e = (t) => t.altKey && t.button == 0;
  return A.mouseSelectionStyle.of((t, i) => (e(i) ? Wp(t, i) : null));
}
const Hp = {
    Alt: [18, (n) => !!n.altKey],
    Control: [17, (n) => !!n.ctrlKey],
    Shift: [16, (n) => !!n.shiftKey],
    Meta: [91, (n) => !!n.metaKey],
  },
  Vp = { style: "cursor: crosshair" };
function zp(n = {}) {
  let [e, t] = Hp[n.key || "Alt"],
    i = ne.fromClass(
      class {
        constructor(s) {
          ((this.view = s), (this.isDown = !1));
        }
        set(s) {
          this.isDown != s && ((this.isDown = s), this.view.update([]));
        }
      },
      {
        eventObservers: {
          keydown(s) {
            this.set(s.keyCode == e || t(s));
          },
          keyup(s) {
            (s.keyCode == e || !t(s)) && this.set(!1);
          },
          mousemove(s) {
            this.set(t(s));
          },
        },
      },
    );
  return [
    i,
    A.contentAttributes.of((s) => {
      var r;
      return !((r = s.plugin(i)) === null || r === void 0) && r.isDown
        ? Vp
        : null;
    }),
  ];
}
const vn = "-10000px";
class ac {
  constructor(e, t, i, s) {
    ((this.facet = t),
      (this.createTooltipView = i),
      (this.removeTooltipView = s),
      (this.input = e.state.facet(t)),
      (this.tooltips = this.input.filter((o) => o)));
    let r = null;
    this.tooltipViews = this.tooltips.map((o) => (r = i(o, r)));
  }
  update(e, t) {
    var i;
    let s = e.state.facet(this.facet),
      r = s.filter((a) => a);
    if (s === this.input) {
      for (let a of this.tooltipViews) a.update && a.update(e);
      return !1;
    }
    let o = [],
      l = t ? [] : null;
    for (let a = 0; a < r.length; a++) {
      let h = r[a],
        c = -1;
      if (h) {
        for (let f = 0; f < this.tooltips.length; f++) {
          let u = this.tooltips[f];
          u && u.create == h.create && (c = f);
        }
        if (c < 0)
          ((o[a] = this.createTooltipView(h, a ? o[a - 1] : null)),
            l && (l[a] = !!h.above));
        else {
          let f = (o[a] = this.tooltipViews[c]);
          (l && (l[a] = t[c]), f.update && f.update(e));
        }
      }
    }
    for (let a of this.tooltipViews)
      o.indexOf(a) < 0 &&
        (this.removeTooltipView(a),
        (i = a.destroy) === null || i === void 0 || i.call(a));
    return (
      t && (l.forEach((a, h) => (t[h] = a)), (t.length = l.length)),
      (this.input = s),
      (this.tooltips = r),
      (this.tooltipViews = o),
      !0
    );
  }
}
function _p(n) {
  let e = n.dom.ownerDocument.documentElement;
  return { top: 0, left: 0, bottom: e.clientHeight, right: e.clientWidth };
}
const Ws = D.define({
    combine: (n) => {
      var e, t, i;
      return {
        position: O.ios
          ? "absolute"
          : ((e = n.find((s) => s.position)) === null || e === void 0
              ? void 0
              : e.position) || "fixed",
        parent:
          ((t = n.find((s) => s.parent)) === null || t === void 0
            ? void 0
            : t.parent) || null,
        tooltipSpace:
          ((i = n.find((s) => s.tooltipSpace)) === null || i === void 0
            ? void 0
            : i.tooltipSpace) || _p,
      };
    },
  }),
  Il = new WeakMap(),
  uo = ne.fromClass(
    class {
      constructor(n) {
        ((this.view = n),
          (this.above = []),
          (this.inView = !0),
          (this.madeAbsolute = !1),
          (this.lastTransaction = 0),
          (this.measureTimeout = -1));
        let e = n.state.facet(Ws);
        ((this.position = e.position),
          (this.parent = e.parent),
          (this.classes = n.themeClasses),
          this.createContainer(),
          (this.measureReq = {
            read: this.readMeasure.bind(this),
            write: this.writeMeasure.bind(this),
            key: this,
          }),
          (this.resizeObserver =
            typeof ResizeObserver == "function"
              ? new ResizeObserver(() => this.measureSoon())
              : null),
          (this.manager = new ac(
            n,
            po,
            (t, i) => this.createTooltip(t, i),
            (t) => {
              (this.resizeObserver && this.resizeObserver.unobserve(t.dom),
                t.dom.remove());
            },
          )),
          (this.above = this.manager.tooltips.map((t) => !!t.above)),
          (this.intersectionObserver =
            typeof IntersectionObserver == "function"
              ? new IntersectionObserver(
                  (t) => {
                    Date.now() > this.lastTransaction - 50 &&
                      t.length > 0 &&
                      t[t.length - 1].intersectionRatio < 1 &&
                      this.measureSoon();
                  },
                  { threshold: [1] },
                )
              : null),
          this.observeIntersection(),
          n.win.addEventListener(
            "resize",
            (this.measureSoon = this.measureSoon.bind(this)),
          ),
          this.maybeMeasure());
      }
      createContainer() {
        this.parent
          ? ((this.container = document.createElement("div")),
            (this.container.style.position = "relative"),
            (this.container.className = this.view.themeClasses),
            this.parent.appendChild(this.container))
          : (this.container = this.view.dom);
      }
      observeIntersection() {
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
          for (let n of this.manager.tooltipViews)
            this.intersectionObserver.observe(n.dom);
        }
      }
      measureSoon() {
        this.measureTimeout < 0 &&
          (this.measureTimeout = setTimeout(() => {
            ((this.measureTimeout = -1), this.maybeMeasure());
          }, 50));
      }
      update(n) {
        n.transactions.length && (this.lastTransaction = Date.now());
        let e = this.manager.update(n, this.above);
        e && this.observeIntersection();
        let t = e || n.geometryChanged,
          i = n.state.facet(Ws);
        if (i.position != this.position && !this.madeAbsolute) {
          this.position = i.position;
          for (let s of this.manager.tooltipViews)
            s.dom.style.position = this.position;
          t = !0;
        }
        if (i.parent != this.parent) {
          (this.parent && this.container.remove(),
            (this.parent = i.parent),
            this.createContainer());
          for (let s of this.manager.tooltipViews)
            this.container.appendChild(s.dom);
          t = !0;
        } else
          this.parent &&
            this.view.themeClasses != this.classes &&
            (this.classes = this.container.className = this.view.themeClasses);
        t && this.maybeMeasure();
      }
      createTooltip(n, e) {
        let t = n.create(this.view),
          i = e ? e.dom : null;
        if (
          (t.dom.classList.add("cm-tooltip"),
          n.arrow && !t.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow"))
        ) {
          let s = document.createElement("div");
          ((s.className = "cm-tooltip-arrow"), t.dom.appendChild(s));
        }
        return (
          (t.dom.style.position = this.position),
          (t.dom.style.top = vn),
          (t.dom.style.left = "0px"),
          this.container.insertBefore(t.dom, i),
          t.mount && t.mount(this.view),
          this.resizeObserver && this.resizeObserver.observe(t.dom),
          t
        );
      }
      destroy() {
        var n, e, t;
        this.view.win.removeEventListener("resize", this.measureSoon);
        for (let i of this.manager.tooltipViews)
          (i.dom.remove(),
            (n = i.destroy) === null || n === void 0 || n.call(i));
        (this.parent && this.container.remove(),
          (e = this.resizeObserver) === null || e === void 0 || e.disconnect(),
          (t = this.intersectionObserver) === null ||
            t === void 0 ||
            t.disconnect(),
          clearTimeout(this.measureTimeout));
      }
      readMeasure() {
        let n = 1,
          e = 1,
          t = !1;
        if (this.position == "fixed" && this.manager.tooltipViews.length) {
          let { dom: r } = this.manager.tooltipViews[0];
          if (O.safari) {
            let o = r.getBoundingClientRect();
            t = Math.abs(o.top + 1e4) > 1 || Math.abs(o.left) > 1;
          } else
            t =
              !!r.offsetParent &&
              r.offsetParent != this.container.ownerDocument.body;
        }
        if (t || this.position == "absolute")
          if (this.parent) {
            let r = this.parent.getBoundingClientRect();
            r.width &&
              r.height &&
              ((n = r.width / this.parent.offsetWidth),
              (e = r.height / this.parent.offsetHeight));
          } else ({ scaleX: n, scaleY: e } = this.view.viewState);
        let i = this.view.scrollDOM.getBoundingClientRect(),
          s = ao(this.view);
        return {
          visible: {
            left: i.left + s.left,
            top: i.top + s.top,
            right: i.right - s.right,
            bottom: i.bottom - s.bottom,
          },
          parent: this.parent
            ? this.container.getBoundingClientRect()
            : this.view.dom.getBoundingClientRect(),
          pos: this.manager.tooltips.map((r, o) => {
            let l = this.manager.tooltipViews[o];
            return l.getCoords
              ? l.getCoords(r.pos)
              : this.view.coordsAtPos(r.pos);
          }),
          size: this.manager.tooltipViews.map(({ dom: r }) =>
            r.getBoundingClientRect(),
          ),
          space: this.view.state.facet(Ws).tooltipSpace(this.view),
          scaleX: n,
          scaleY: e,
          makeAbsolute: t,
        };
      }
      writeMeasure(n) {
        var e;
        if (n.makeAbsolute) {
          ((this.madeAbsolute = !0), (this.position = "absolute"));
          for (let l of this.manager.tooltipViews)
            l.dom.style.position = "absolute";
        }
        let { visible: t, space: i, scaleX: s, scaleY: r } = n,
          o = [];
        for (let l = 0; l < this.manager.tooltips.length; l++) {
          let a = this.manager.tooltips[l],
            h = this.manager.tooltipViews[l],
            { dom: c } = h,
            f = n.pos[l],
            u = n.size[l];
          if (
            !f ||
            (a.clip !== !1 &&
              (f.bottom <= Math.max(t.top, i.top) ||
                f.top >= Math.min(t.bottom, i.bottom) ||
                f.right < Math.max(t.left, i.left) - 0.1 ||
                f.left > Math.min(t.right, i.right) + 0.1))
          ) {
            c.style.top = vn;
            continue;
          }
          let d = a.arrow ? h.dom.querySelector(".cm-tooltip-arrow") : null,
            p = d ? 7 : 0,
            m = u.right - u.left,
            g = (e = Il.get(h)) !== null && e !== void 0 ? e : u.bottom - u.top,
            b = h.offset || $p,
            w = this.view.textDirection == G.LTR,
            v =
              u.width > i.right - i.left
                ? w
                  ? i.left
                  : i.right - u.width
                : w
                  ? Math.max(
                      i.left,
                      Math.min(f.left - (d ? 14 : 0) + b.x, i.right - m),
                    )
                  : Math.min(
                      Math.max(i.left, f.left - m + (d ? 14 : 0) - b.x),
                      i.right - m,
                    ),
            T = this.above[l];
          !a.strictSide &&
            (T
              ? f.top - g - p - b.y < i.top
              : f.bottom + g + p + b.y > i.bottom) &&
            T == i.bottom - f.bottom > f.top - i.top &&
            (T = this.above[l] = !T);
          let k = (T ? f.top - i.top : i.bottom - f.bottom) - p;
          if (k < g && h.resize !== !1) {
            if (k < this.view.defaultLineHeight) {
              c.style.top = vn;
              continue;
            }
            (Il.set(h, g), (c.style.height = (g = k) / r + "px"));
          } else c.style.height && (c.style.height = "");
          let S = T ? f.top - g - p - b.y : f.bottom + p + b.y,
            C = v + m;
          if (h.overlap !== !0)
            for (let P of o)
              P.left < C &&
                P.right > v &&
                P.top < S + g &&
                P.bottom > S &&
                (S = T ? P.top - g - 2 - p : P.bottom + p + 2);
          if (
            (this.position == "absolute"
              ? ((c.style.top = (S - n.parent.top) / r + "px"),
                Nl(c, (v - n.parent.left) / s))
              : ((c.style.top = S / r + "px"), Nl(c, v / s)),
            d)
          ) {
            let P = f.left + (w ? b.x : -b.x) - (v + 14 - 7);
            d.style.left = P / s + "px";
          }
          (h.overlap !== !0 &&
            o.push({ left: v, top: S, right: C, bottom: S + g }),
            c.classList.toggle("cm-tooltip-above", T),
            c.classList.toggle("cm-tooltip-below", !T),
            h.positioned && h.positioned(n.space));
        }
      }
      maybeMeasure() {
        if (
          this.manager.tooltips.length &&
          (this.view.inView && this.view.requestMeasure(this.measureReq),
          this.inView != this.view.inView &&
            ((this.inView = this.view.inView), !this.inView))
        )
          for (let n of this.manager.tooltipViews) n.dom.style.top = vn;
      }
    },
    {
      eventObservers: {
        scroll() {
          this.maybeMeasure();
        },
      },
    },
  );
function Nl(n, e) {
  let t = parseInt(n.style.left, 10);
  (isNaN(t) || Math.abs(e - t) > 1) && (n.style.left = e + "px");
}
const qp = A.baseTheme({
    ".cm-tooltip": { zIndex: 500, boxSizing: "border-box" },
    "&light .cm-tooltip": {
      border: "1px solid #bbb",
      backgroundColor: "#f5f5f5",
    },
    "&light .cm-tooltip-section:not(:first-child)": {
      borderTop: "1px solid #bbb",
    },
    "&dark .cm-tooltip": { backgroundColor: "#333338", color: "white" },
    ".cm-tooltip-arrow": {
      height: "7px",
      width: "14px",
      position: "absolute",
      zIndex: -1,
      overflow: "hidden",
      "&:before, &:after": {
        content: "''",
        position: "absolute",
        width: 0,
        height: 0,
        borderLeft: "7px solid transparent",
        borderRight: "7px solid transparent",
      },
      ".cm-tooltip-above &": {
        bottom: "-7px",
        "&:before": { borderTop: "7px solid #bbb" },
        "&:after": { borderTop: "7px solid #f5f5f5", bottom: "1px" },
      },
      ".cm-tooltip-below &": {
        top: "-7px",
        "&:before": { borderBottom: "7px solid #bbb" },
        "&:after": { borderBottom: "7px solid #f5f5f5", top: "1px" },
      },
    },
    "&dark .cm-tooltip .cm-tooltip-arrow": {
      "&:before": { borderTopColor: "#333338", borderBottomColor: "#333338" },
      "&:after": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      },
    },
  }),
  $p = { x: 0, y: 0 },
  po = D.define({ enables: [uo, qp] }),
  Qn = D.define({ combine: (n) => n.reduce((e, t) => e.concat(t), []) });
class ys {
  static create(e) {
    return new ys(e);
  }
  constructor(e) {
    ((this.view = e),
      (this.mounted = !1),
      (this.dom = document.createElement("div")),
      this.dom.classList.add("cm-tooltip-hover"),
      (this.manager = new ac(
        e,
        Qn,
        (t, i) => this.createHostedView(t, i),
        (t) => t.dom.remove(),
      )));
  }
  createHostedView(e, t) {
    let i = e.create(this.view);
    return (
      i.dom.classList.add("cm-tooltip-section"),
      this.dom.insertBefore(i.dom, t ? t.dom.nextSibling : this.dom.firstChild),
      this.mounted && i.mount && i.mount(this.view),
      i
    );
  }
  mount(e) {
    for (let t of this.manager.tooltipViews) t.mount && t.mount(e);
    this.mounted = !0;
  }
  positioned(e) {
    for (let t of this.manager.tooltipViews) t.positioned && t.positioned(e);
  }
  update(e) {
    this.manager.update(e);
  }
  destroy() {
    var e;
    for (let t of this.manager.tooltipViews)
      (e = t.destroy) === null || e === void 0 || e.call(t);
  }
  passProp(e) {
    let t;
    for (let i of this.manager.tooltipViews) {
      let s = i[e];
      if (s !== void 0) {
        if (t === void 0) t = s;
        else if (t !== s) return;
      }
    }
    return t;
  }
  get offset() {
    return this.passProp("offset");
  }
  get getCoords() {
    return this.passProp("getCoords");
  }
  get overlap() {
    return this.passProp("overlap");
  }
  get resize() {
    return this.passProp("resize");
  }
}
const Kp = po.compute([Qn], (n) => {
  let e = n.facet(Qn);
  return e.length === 0
    ? null
    : {
        pos: Math.min(...e.map((t) => t.pos)),
        end: Math.max(
          ...e.map((t) => {
            var i;
            return (i = t.end) !== null && i !== void 0 ? i : t.pos;
          }),
        ),
        create: ys.create,
        above: e[0].above,
        arrow: e.some((t) => t.arrow),
      };
});
class jp {
  constructor(e, t, i, s, r) {
    ((this.view = e),
      (this.source = t),
      (this.field = i),
      (this.setHover = s),
      (this.hoverTime = r),
      (this.hoverTimeout = -1),
      (this.restartTimeout = -1),
      (this.pending = null),
      (this.lastMove = { x: 0, y: 0, target: e.dom, time: 0 }),
      (this.checkHover = this.checkHover.bind(this)),
      e.dom.addEventListener(
        "mouseleave",
        (this.mouseleave = this.mouseleave.bind(this)),
      ),
      e.dom.addEventListener(
        "mousemove",
        (this.mousemove = this.mousemove.bind(this)),
      ));
  }
  update() {
    this.pending &&
      ((this.pending = null),
      clearTimeout(this.restartTimeout),
      (this.restartTimeout = setTimeout(() => this.startHover(), 20)));
  }
  get active() {
    return this.view.state.field(this.field);
  }
  checkHover() {
    if (((this.hoverTimeout = -1), this.active.length)) return;
    let e = Date.now() - this.lastMove.time;
    e < this.hoverTime
      ? (this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - e))
      : this.startHover();
  }
  startHover() {
    clearTimeout(this.restartTimeout);
    let { view: e, lastMove: t } = this,
      i = e.docView.tile.nearest(t.target);
    if (!i) return;
    let s,
      r = 1;
    if (i.isWidget()) s = i.posAtStart;
    else {
      if (((s = e.posAtCoords(t)), s == null)) return;
      let l = e.coordsAtPos(s);
      if (
        !l ||
        t.y < l.top ||
        t.y > l.bottom ||
        t.x < l.left - e.defaultCharacterWidth ||
        t.x > l.right + e.defaultCharacterWidth
      )
        return;
      let a = e
          .bidiSpans(e.state.doc.lineAt(s))
          .find((c) => c.from <= s && c.to >= s),
        h = a && a.dir == G.RTL ? -1 : 1;
      r = t.x < l.left ? -h : h;
    }
    let o = this.source(e, s, r);
    if (o?.then) {
      let l = (this.pending = { pos: s });
      o.then(
        (a) => {
          this.pending == l &&
            ((this.pending = null),
            a &&
              !(Array.isArray(a) && !a.length) &&
              e.dispatch({
                effects: this.setHover.of(Array.isArray(a) ? a : [a]),
              }));
        },
        (a) => De(e.state, a, "hover tooltip"),
      );
    } else
      o &&
        !(Array.isArray(o) && !o.length) &&
        e.dispatch({ effects: this.setHover.of(Array.isArray(o) ? o : [o]) });
  }
  get tooltip() {
    let e = this.view.plugin(uo),
      t = e ? e.manager.tooltips.findIndex((i) => i.create == ys.create) : -1;
    return t > -1 ? e.manager.tooltipViews[t] : null;
  }
  mousemove(e) {
    var t, i;
    ((this.lastMove = {
      x: e.clientX,
      y: e.clientY,
      target: e.target,
      time: Date.now(),
    }),
      this.hoverTimeout < 0 &&
        (this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime)));
    let { active: s, tooltip: r } = this;
    if ((s.length && r && !Up(r.dom, e)) || this.pending) {
      let { pos: o } = s[0] || this.pending,
        l =
          (i = (t = s[0]) === null || t === void 0 ? void 0 : t.end) !== null &&
          i !== void 0
            ? i
            : o;
      (o == l
        ? this.view.posAtCoords(this.lastMove) != o
        : !Gp(this.view, o, l, e.clientX, e.clientY)) &&
        (this.view.dispatch({ effects: this.setHover.of([]) }),
        (this.pending = null));
    }
  }
  mouseleave(e) {
    (clearTimeout(this.hoverTimeout), (this.hoverTimeout = -1));
    let { active: t } = this;
    if (t.length) {
      let { tooltip: i } = this;
      i && i.dom.contains(e.relatedTarget)
        ? this.watchTooltipLeave(i.dom)
        : this.view.dispatch({ effects: this.setHover.of([]) });
    }
  }
  watchTooltipLeave(e) {
    let t = (i) => {
      (e.removeEventListener("mouseleave", t),
        this.active.length &&
          !this.view.dom.contains(i.relatedTarget) &&
          this.view.dispatch({ effects: this.setHover.of([]) }));
    };
    e.addEventListener("mouseleave", t);
  }
  destroy() {
    (clearTimeout(this.hoverTimeout),
      clearTimeout(this.restartTimeout),
      this.view.dom.removeEventListener("mouseleave", this.mouseleave),
      this.view.dom.removeEventListener("mousemove", this.mousemove));
  }
}
const kn = 4;
function Up(n, e) {
  let { left: t, right: i, top: s, bottom: r } = n.getBoundingClientRect(),
    o;
  if ((o = n.querySelector(".cm-tooltip-arrow"))) {
    let l = o.getBoundingClientRect();
    ((s = Math.min(l.top, s)), (r = Math.max(l.bottom, r)));
  }
  return (
    e.clientX >= t - kn &&
    e.clientX <= i + kn &&
    e.clientY >= s - kn &&
    e.clientY <= r + kn
  );
}
function Gp(n, e, t, i, s, r) {
  let o = n.scrollDOM.getBoundingClientRect(),
    l = n.documentTop + n.documentPadding.top + n.contentHeight;
  if (o.left > i || o.right < i || o.top > s || Math.min(o.bottom, l) < s)
    return !1;
  let a = n.posAtCoords({ x: i, y: s }, !1);
  return a >= e && a <= t;
}
function Jp(n, e = {}) {
  let t = R.define(),
    i = ce.define({
      create() {
        return [];
      },
      update(s, r) {
        if (
          s.length &&
          (e.hideOnChange && (r.docChanged || r.selection)
            ? (s = [])
            : e.hideOn && (s = s.filter((o) => !e.hideOn(r, o))),
          r.docChanged)
        ) {
          let o = [];
          for (let l of s) {
            let a = r.changes.mapPos(l.pos, -1, pe.TrackDel);
            if (a != null) {
              let h = Object.assign(Object.create(null), l);
              ((h.pos = a),
                h.end != null && (h.end = r.changes.mapPos(h.end)),
                o.push(h));
            }
          }
          s = o;
        }
        for (let o of r.effects)
          (o.is(t) && (s = o.value), o.is(Yp) && (s = []));
        return s;
      },
      provide: (s) => Qn.from(s),
    });
  return {
    active: i,
    extension: [
      i,
      ne.define((s) => new jp(s, n, i, t, e.hoverTime || 300)),
      Kp,
    ],
  };
}
function hc(n, e) {
  let t = n.plugin(uo);
  if (!t) return null;
  let i = t.manager.tooltips.indexOf(e);
  return i < 0 ? null : t.manager.tooltipViews[i];
}
const Yp = R.define(),
  Wl = D.define({
    combine(n) {
      let e, t;
      for (let i of n)
        ((e = e || i.topContainer), (t = t || i.bottomContainer));
      return { topContainer: e, bottomContainer: t };
    },
  });
function mo(n, e) {
  let t = n.plugin(cc),
    i = t ? t.specs.indexOf(e) : -1;
  return i > -1 ? t.panels[i] : null;
}
const cc = ne.fromClass(
  class {
    constructor(n) {
      ((this.input = n.state.facet(Vi)),
        (this.specs = this.input.filter((t) => t)),
        (this.panels = this.specs.map((t) => t(n))));
      let e = n.state.facet(Wl);
      ((this.top = new Sn(n, !0, e.topContainer)),
        (this.bottom = new Sn(n, !1, e.bottomContainer)),
        this.top.sync(this.panels.filter((t) => t.top)),
        this.bottom.sync(this.panels.filter((t) => !t.top)));
      for (let t of this.panels)
        (t.dom.classList.add("cm-panel"), t.mount && t.mount());
    }
    update(n) {
      let e = n.state.facet(Wl);
      (this.top.container != e.topContainer &&
        (this.top.sync([]), (this.top = new Sn(n.view, !0, e.topContainer))),
        this.bottom.container != e.bottomContainer &&
          (this.bottom.sync([]),
          (this.bottom = new Sn(n.view, !1, e.bottomContainer))),
        this.top.syncClasses(),
        this.bottom.syncClasses());
      let t = n.state.facet(Vi);
      if (t != this.input) {
        let i = t.filter((a) => a),
          s = [],
          r = [],
          o = [],
          l = [];
        for (let a of i) {
          let h = this.specs.indexOf(a),
            c;
          (h < 0
            ? ((c = a(n.view)), l.push(c))
            : ((c = this.panels[h]), c.update && c.update(n)),
            s.push(c),
            (c.top ? r : o).push(c));
        }
        ((this.specs = i),
          (this.panels = s),
          this.top.sync(r),
          this.bottom.sync(o));
        for (let a of l)
          (a.dom.classList.add("cm-panel"), a.mount && a.mount());
      } else for (let i of this.panels) i.update && i.update(n);
    }
    destroy() {
      (this.top.sync([]), this.bottom.sync([]));
    }
  },
  {
    provide: (n) =>
      A.scrollMargins.of((e) => {
        let t = e.plugin(n);
        return (
          t && { top: t.top.scrollMargin(), bottom: t.bottom.scrollMargin() }
        );
      }),
  },
);
class Sn {
  constructor(e, t, i) {
    ((this.view = e),
      (this.top = t),
      (this.container = i),
      (this.dom = void 0),
      (this.classes = ""),
      (this.panels = []),
      this.syncClasses());
  }
  sync(e) {
    for (let t of this.panels) t.destroy && e.indexOf(t) < 0 && t.destroy();
    ((this.panels = e), this.syncDOM());
  }
  syncDOM() {
    if (this.panels.length == 0) {
      this.dom && (this.dom.remove(), (this.dom = void 0));
      return;
    }
    if (!this.dom) {
      ((this.dom = document.createElement("div")),
        (this.dom.className = this.top
          ? "cm-panels cm-panels-top"
          : "cm-panels cm-panels-bottom"),
        (this.dom.style[this.top ? "top" : "bottom"] = "0"));
      let t = this.container || this.view.dom;
      t.insertBefore(this.dom, this.top ? t.firstChild : null);
    }
    let e = this.dom.firstChild;
    for (let t of this.panels)
      if (t.dom.parentNode == this.dom) {
        for (; e != t.dom; ) e = Fl(e);
        e = e.nextSibling;
      } else this.dom.insertBefore(t.dom, e);
    for (; e; ) e = Fl(e);
  }
  scrollMargin() {
    return !this.dom || this.container
      ? 0
      : Math.max(
          0,
          this.top
            ? this.dom.getBoundingClientRect().bottom -
                Math.max(0, this.view.scrollDOM.getBoundingClientRect().top)
            : Math.min(
                innerHeight,
                this.view.scrollDOM.getBoundingClientRect().bottom,
              ) - this.dom.getBoundingClientRect().top,
        );
  }
  syncClasses() {
    if (!(!this.container || this.classes == this.view.themeClasses)) {
      for (let e of this.classes.split(" "))
        e && this.container.classList.remove(e);
      for (let e of (this.classes = this.view.themeClasses).split(" "))
        e && this.container.classList.add(e);
    }
  }
}
function Fl(n) {
  let e = n.nextSibling;
  return (n.remove(), e);
}
const Vi = D.define({ enables: cc });
function Xp(n, e) {
  let t,
    i = new Promise((o) => (t = o)),
    s = (o) => Qp(o, e, t);
  n.state.field(Fs, !1)
    ? n.dispatch({ effects: fc.of(s) })
    : n.dispatch({ effects: R.appendConfig.of(Fs.init(() => [s])) });
  let r = uc.of(s);
  return {
    close: r,
    result: i.then(
      (o) => (
        (n.win.queueMicrotask || ((a) => n.win.setTimeout(a, 10)))(() => {
          n.state.field(Fs).indexOf(s) > -1 && n.dispatch({ effects: r });
        }),
        o
      ),
    ),
  };
}
const Fs = ce.define({
    create() {
      return [];
    },
    update(n, e) {
      for (let t of e.effects)
        t.is(fc)
          ? (n = [t.value].concat(n))
          : t.is(uc) && (n = n.filter((i) => i != t.value));
      return n;
    },
    provide: (n) => Vi.computeN([n], (e) => e.field(n)),
  }),
  fc = R.define(),
  uc = R.define();
function Qp(n, e, t) {
  let i = e.content ? e.content(n, () => o(null)) : null;
  if (!i) {
    if (((i = K("form")), e.input)) {
      let l = K("input", e.input);
      (/^(text|password|number|email|tel|url)$/.test(l.type) &&
        l.classList.add("cm-textfield"),
        l.name || (l.name = "input"),
        i.appendChild(K("label", (e.label || "") + ": ", l)));
    } else i.appendChild(document.createTextNode(e.label || ""));
    (i.appendChild(document.createTextNode(" ")),
      i.appendChild(
        K(
          "button",
          { class: "cm-button", type: "submit" },
          e.submitLabel || "OK",
        ),
      ));
  }
  let s = i.nodeName == "FORM" ? [i] : i.querySelectorAll("form");
  for (let l = 0; l < s.length; l++) {
    let a = s[l];
    (a.addEventListener("keydown", (h) => {
      h.keyCode == 27
        ? (h.preventDefault(), o(null))
        : h.keyCode == 13 && (h.preventDefault(), o(a));
    }),
      a.addEventListener("submit", (h) => {
        (h.preventDefault(), o(a));
      }));
  }
  let r = K(
    "div",
    i,
    K(
      "button",
      {
        onclick: () => o(null),
        "aria-label": n.state.phrase("close"),
        class: "cm-dialog-close",
        type: "button",
      },
      ["×"],
    ),
  );
  (e.class && (r.className = e.class), r.classList.add("cm-dialog"));
  function o(l) {
    (r.contains(r.ownerDocument.activeElement) && n.focus(), t(l));
  }
  return {
    dom: r,
    top: e.top,
    mount: () => {
      if (e.focus) {
        let l;
        (typeof e.focus == "string"
          ? (l = i.querySelector(e.focus))
          : (l = i.querySelector("input") || i.querySelector("button")),
          l && "select" in l ? l.select() : l && "focus" in l && l.focus());
      }
    },
  };
}
class pt extends vt {
  compare(e) {
    return this == e || (this.constructor == e.constructor && this.eq(e));
  }
  eq(e) {
    return !1;
  }
  destroy(e) {}
}
pt.prototype.elementClass = "";
pt.prototype.toDOM = void 0;
pt.prototype.mapMode = pe.TrackBefore;
pt.prototype.startSide = pt.prototype.endSide = -1;
pt.prototype.point = !0;
const Fn = D.define(),
  Zp = D.define(),
  em = {
    class: "",
    renderEmptyElements: !1,
    elementStyle: "",
    markers: () => z.empty,
    lineMarker: () => null,
    widgetMarker: () => null,
    lineMarkerChange: null,
    initialSpacer: null,
    updateSpacer: null,
    domEventHandlers: {},
    side: "before",
  },
  Ei = D.define();
function tm(n) {
  return [dc(), Ei.of({ ...em, ...n })];
}
const Hl = D.define({ combine: (n) => n.some((e) => e) });
function dc(n) {
  return [im];
}
const im = ne.fromClass(
  class {
    constructor(n) {
      ((this.view = n),
        (this.domAfter = null),
        (this.prevViewport = n.viewport),
        (this.dom = document.createElement("div")),
        (this.dom.className = "cm-gutters cm-gutters-before"),
        this.dom.setAttribute("aria-hidden", "true"),
        (this.dom.style.minHeight =
          this.view.contentHeight / this.view.scaleY + "px"),
        (this.gutters = n.state.facet(Ei).map((e) => new zl(n, e))),
        (this.fixed = !n.state.facet(Hl)));
      for (let e of this.gutters)
        e.config.side == "after"
          ? this.getDOMAfter().appendChild(e.dom)
          : this.dom.appendChild(e.dom);
      (this.fixed && (this.dom.style.position = "sticky"),
        this.syncGutters(!1),
        n.scrollDOM.insertBefore(this.dom, n.contentDOM));
    }
    getDOMAfter() {
      return (
        this.domAfter ||
          ((this.domAfter = document.createElement("div")),
          (this.domAfter.className = "cm-gutters cm-gutters-after"),
          this.domAfter.setAttribute("aria-hidden", "true"),
          (this.domAfter.style.minHeight =
            this.view.contentHeight / this.view.scaleY + "px"),
          (this.domAfter.style.position = this.fixed ? "sticky" : ""),
          this.view.scrollDOM.appendChild(this.domAfter)),
        this.domAfter
      );
    }
    update(n) {
      if (this.updateGutters(n)) {
        let e = this.prevViewport,
          t = n.view.viewport,
          i = Math.min(e.to, t.to) - Math.max(e.from, t.from);
        this.syncGutters(i < (t.to - t.from) * 0.8);
      }
      if (n.geometryChanged) {
        let e = this.view.contentHeight / this.view.scaleY + "px";
        ((this.dom.style.minHeight = e),
          this.domAfter && (this.domAfter.style.minHeight = e));
      }
      (this.view.state.facet(Hl) != !this.fixed &&
        ((this.fixed = !this.fixed),
        (this.dom.style.position = this.fixed ? "sticky" : ""),
        this.domAfter &&
          (this.domAfter.style.position = this.fixed ? "sticky" : "")),
        (this.prevViewport = n.view.viewport));
    }
    syncGutters(n) {
      let e = this.dom.nextSibling;
      n && (this.dom.remove(), this.domAfter && this.domAfter.remove());
      let t = z.iter(this.view.state.facet(Fn), this.view.viewport.from),
        i = [],
        s = this.gutters.map(
          (r) => new nm(r, this.view.viewport, -this.view.documentPadding.top),
        );
      for (let r of this.view.viewportLineBlocks)
        if ((i.length && (i = []), Array.isArray(r.type))) {
          let o = !0;
          for (let l of r.type)
            if (l.type == me.Text && o) {
              Ir(t, i, l.from);
              for (let a of s) a.line(this.view, l, i);
              o = !1;
            } else if (l.widget) for (let a of s) a.widget(this.view, l);
        } else if (r.type == me.Text) {
          Ir(t, i, r.from);
          for (let o of s) o.line(this.view, r, i);
        } else if (r.widget) for (let o of s) o.widget(this.view, r);
      for (let r of s) r.finish();
      n &&
        (this.view.scrollDOM.insertBefore(this.dom, e),
        this.domAfter && this.view.scrollDOM.appendChild(this.domAfter));
    }
    updateGutters(n) {
      let e = n.startState.facet(Ei),
        t = n.state.facet(Ei),
        i =
          n.docChanged ||
          n.heightChanged ||
          n.viewportChanged ||
          !z.eq(
            n.startState.facet(Fn),
            n.state.facet(Fn),
            n.view.viewport.from,
            n.view.viewport.to,
          );
      if (e == t) for (let s of this.gutters) s.update(n) && (i = !0);
      else {
        i = !0;
        let s = [];
        for (let r of t) {
          let o = e.indexOf(r);
          o < 0
            ? s.push(new zl(this.view, r))
            : (this.gutters[o].update(n), s.push(this.gutters[o]));
        }
        for (let r of this.gutters)
          (r.dom.remove(), s.indexOf(r) < 0 && r.destroy());
        for (let r of s)
          r.config.side == "after"
            ? this.getDOMAfter().appendChild(r.dom)
            : this.dom.appendChild(r.dom);
        this.gutters = s;
      }
      return i;
    }
    destroy() {
      for (let n of this.gutters) n.destroy();
      (this.dom.remove(), this.domAfter && this.domAfter.remove());
    }
  },
  {
    provide: (n) =>
      A.scrollMargins.of((e) => {
        let t = e.plugin(n);
        if (!t || t.gutters.length == 0 || !t.fixed) return null;
        let i = t.dom.offsetWidth * e.scaleX,
          s = t.domAfter ? t.domAfter.offsetWidth * e.scaleX : 0;
        return e.textDirection == G.LTR
          ? { left: i, right: s }
          : { right: i, left: s };
      }),
  },
);
function Vl(n) {
  return Array.isArray(n) ? n : [n];
}
function Ir(n, e, t) {
  for (; n.value && n.from <= t; ) (n.from == t && e.push(n.value), n.next());
}
class nm {
  constructor(e, t, i) {
    ((this.gutter = e),
      (this.height = i),
      (this.i = 0),
      (this.cursor = z.iter(e.markers, t.from)));
  }
  addElement(e, t, i) {
    let { gutter: s } = this,
      r = (t.top - this.height) / e.scaleY,
      o = t.height / e.scaleY;
    if (this.i == s.elements.length) {
      let l = new pc(e, o, r, i);
      (s.elements.push(l), s.dom.appendChild(l.dom));
    } else s.elements[this.i].update(e, o, r, i);
    ((this.height = t.bottom), this.i++);
  }
  line(e, t, i) {
    let s = [];
    (Ir(this.cursor, s, t.from), i.length && (s = s.concat(i)));
    let r = this.gutter.config.lineMarker(e, t, s);
    r && s.unshift(r);
    let o = this.gutter;
    (s.length == 0 && !o.config.renderEmptyElements) ||
      this.addElement(e, t, s);
  }
  widget(e, t) {
    let i = this.gutter.config.widgetMarker(e, t.widget, t),
      s = i ? [i] : null;
    for (let r of e.state.facet(Zp)) {
      let o = r(e, t.widget, t);
      o && (s || (s = [])).push(o);
    }
    s && this.addElement(e, t, s);
  }
  finish() {
    let e = this.gutter;
    for (; e.elements.length > this.i; ) {
      let t = e.elements.pop();
      (e.dom.removeChild(t.dom), t.destroy());
    }
  }
}
class zl {
  constructor(e, t) {
    ((this.view = e),
      (this.config = t),
      (this.elements = []),
      (this.spacer = null),
      (this.dom = document.createElement("div")),
      (this.dom.className =
        "cm-gutter" + (this.config.class ? " " + this.config.class : "")));
    for (let i in t.domEventHandlers)
      this.dom.addEventListener(i, (s) => {
        let r = s.target,
          o;
        if (r != this.dom && this.dom.contains(r)) {
          for (; r.parentNode != this.dom; ) r = r.parentNode;
          let a = r.getBoundingClientRect();
          o = (a.top + a.bottom) / 2;
        } else o = s.clientY;
        let l = e.lineBlockAtHeight(o - e.documentTop);
        t.domEventHandlers[i](e, l, s) && s.preventDefault();
      });
    ((this.markers = Vl(t.markers(e))),
      t.initialSpacer &&
        ((this.spacer = new pc(e, 0, 0, [t.initialSpacer(e)])),
        this.dom.appendChild(this.spacer.dom),
        (this.spacer.dom.style.cssText +=
          "visibility: hidden; pointer-events: none")));
  }
  update(e) {
    let t = this.markers;
    if (
      ((this.markers = Vl(this.config.markers(e.view))),
      this.spacer && this.config.updateSpacer)
    ) {
      let s = this.config.updateSpacer(this.spacer.markers[0], e);
      s != this.spacer.markers[0] && this.spacer.update(e.view, 0, 0, [s]);
    }
    let i = e.view.viewport;
    return (
      !z.eq(this.markers, t, i.from, i.to) ||
      (this.config.lineMarkerChange ? this.config.lineMarkerChange(e) : !1)
    );
  }
  destroy() {
    for (let e of this.elements) e.destroy();
  }
}
class pc {
  constructor(e, t, i, s) {
    ((this.height = -1),
      (this.above = 0),
      (this.markers = []),
      (this.dom = document.createElement("div")),
      (this.dom.className = "cm-gutterElement"),
      this.update(e, t, i, s));
  }
  update(e, t, i, s) {
    (this.height != t &&
      ((this.height = t), (this.dom.style.height = t + "px")),
      this.above != i &&
        (this.dom.style.marginTop = (this.above = i) ? i + "px" : ""),
      sm(this.markers, s) || this.setMarkers(e, s));
  }
  setMarkers(e, t) {
    let i = "cm-gutterElement",
      s = this.dom.firstChild;
    for (let r = 0, o = 0; ; ) {
      let l = o,
        a = r < t.length ? t[r++] : null,
        h = !1;
      if (a) {
        let c = a.elementClass;
        c && (i += " " + c);
        for (let f = o; f < this.markers.length; f++)
          if (this.markers[f].compare(a)) {
            ((l = f), (h = !0));
            break;
          }
      } else l = this.markers.length;
      for (; o < l; ) {
        let c = this.markers[o++];
        if (c.toDOM) {
          c.destroy(s);
          let f = s.nextSibling;
          (s.remove(), (s = f));
        }
      }
      if (!a) break;
      (a.toDOM &&
        (h ? (s = s.nextSibling) : this.dom.insertBefore(a.toDOM(e), s)),
        h && o++);
    }
    ((this.dom.className = i), (this.markers = t));
  }
  destroy() {
    this.setMarkers(null, []);
  }
}
function sm(n, e) {
  if (n.length != e.length) return !1;
  for (let t = 0; t < n.length; t++) if (!n[t].compare(e[t])) return !1;
  return !0;
}
const rm = D.define(),
  om = D.define(),
  Yt = D.define({
    combine(n) {
      return at(
        n,
        { formatNumber: String, domEventHandlers: {} },
        {
          domEventHandlers(e, t) {
            let i = Object.assign({}, e);
            for (let s in t) {
              let r = i[s],
                o = t[s];
              i[s] = r ? (l, a, h) => r(l, a, h) || o(l, a, h) : o;
            }
            return i;
          },
        },
      );
    },
  });
class Hs extends pt {
  constructor(e) {
    (super(), (this.number = e));
  }
  eq(e) {
    return this.number == e.number;
  }
  toDOM() {
    return document.createTextNode(this.number);
  }
}
function Vs(n, e) {
  return n.state.facet(Yt).formatNumber(e, n.state);
}
const lm = Ei.compute([Yt], (n) => ({
  class: "cm-lineNumbers",
  renderEmptyElements: !1,
  markers(e) {
    return e.state.facet(rm);
  },
  lineMarker(e, t, i) {
    return i.some((s) => s.toDOM)
      ? null
      : new Hs(Vs(e, e.state.doc.lineAt(t.from).number));
  },
  widgetMarker: (e, t, i) => {
    for (let s of e.state.facet(om)) {
      let r = s(e, t, i);
      if (r) return r;
    }
    return null;
  },
  lineMarkerChange: (e) => e.startState.facet(Yt) != e.state.facet(Yt),
  initialSpacer(e) {
    return new Hs(Vs(e, _l(e.state.doc.lines)));
  },
  updateSpacer(e, t) {
    let i = Vs(t.view, _l(t.view.state.doc.lines));
    return i == e.number ? e : new Hs(i);
  },
  domEventHandlers: n.facet(Yt).domEventHandlers,
  side: "before",
}));
function mc(n = {}) {
  return [Yt.of(n), dc(), lm];
}
function _l(n) {
  let e = 9;
  for (; e < n; ) e = e * 10 + 9;
  return e;
}
const am = new (class extends pt {
    constructor() {
      (super(...arguments), (this.elementClass = "cm-activeLineGutter"));
    }
  })(),
  hm = Fn.compute(["selection"], (n) => {
    let e = [],
      t = -1;
    for (let i of n.selection.ranges) {
      let s = n.doc.lineAt(i.head).from;
      s > t && ((t = s), e.push(am.range(s)));
    }
    return z.of(e);
  });
function cm() {
  return hm;
}
const fm = 1024;
let um = 0;
class We {
  constructor(e, t) {
    ((this.from = e), (this.to = t));
  }
}
class H {
  constructor(e = {}) {
    ((this.id = um++),
      (this.perNode = !!e.perNode),
      (this.deserialize =
        e.deserialize ||
        (() => {
          throw new Error(
            "This node type doesn't define a deserialize function",
          );
        })),
      (this.combine = e.combine || null));
  }
  add(e) {
    if (this.perNode)
      throw new RangeError("Can't add per-node props to node types");
    return (
      typeof e != "function" && (e = Ce.match(e)),
      (t) => {
        let i = e(t);
        return i === void 0 ? null : [this, i];
      }
    );
  }
}
H.closedBy = new H({ deserialize: (n) => n.split(" ") });
H.openedBy = new H({ deserialize: (n) => n.split(" ") });
H.group = new H({ deserialize: (n) => n.split(" ") });
H.isolate = new H({
  deserialize: (n) => {
    if (n && n != "rtl" && n != "ltr" && n != "auto")
      throw new RangeError("Invalid value for isolate: " + n);
    return n || "auto";
  },
});
H.contextHash = new H({ perNode: !0 });
H.lookAhead = new H({ perNode: !0 });
H.mounted = new H({ perNode: !0 });
class ii {
  constructor(e, t, i, s = !1) {
    ((this.tree = e),
      (this.overlay = t),
      (this.parser = i),
      (this.bracketed = s));
  }
  static get(e) {
    return e && e.props && e.props[H.mounted.id];
  }
}
const dm = Object.create(null);
class Ce {
  constructor(e, t, i, s = 0) {
    ((this.name = e), (this.props = t), (this.id = i), (this.flags = s));
  }
  static define(e) {
    let t = e.props && e.props.length ? Object.create(null) : dm,
      i =
        (e.top ? 1 : 0) |
        (e.skipped ? 2 : 0) |
        (e.error ? 4 : 0) |
        (e.name == null ? 8 : 0),
      s = new Ce(e.name || "", t, e.id, i);
    if (e.props) {
      for (let r of e.props)
        if ((Array.isArray(r) || (r = r(s)), r)) {
          if (r[0].perNode)
            throw new RangeError("Can't store a per-node prop on a node type");
          t[r[0].id] = r[1];
        }
    }
    return s;
  }
  prop(e) {
    return this.props[e.id];
  }
  get isTop() {
    return (this.flags & 1) > 0;
  }
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  get isError() {
    return (this.flags & 4) > 0;
  }
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  is(e) {
    if (typeof e == "string") {
      if (this.name == e) return !0;
      let t = this.prop(H.group);
      return t ? t.indexOf(e) > -1 : !1;
    }
    return this.id == e;
  }
  static match(e) {
    let t = Object.create(null);
    for (let i in e) for (let s of i.split(" ")) t[s] = e[i];
    return (i) => {
      for (let s = i.prop(H.group), r = -1; r < (s ? s.length : 0); r++) {
        let o = t[r < 0 ? i.name : s[r]];
        if (o) return o;
      }
    };
  }
}
Ce.none = new Ce("", Object.create(null), 0, 8);
class go {
  constructor(e) {
    this.types = e;
    for (let t = 0; t < e.length; t++)
      if (e[t].id != t)
        throw new RangeError(
          "Node type ids should correspond to array positions when creating a node set",
        );
  }
  extend(...e) {
    let t = [];
    for (let i of this.types) {
      let s = null;
      for (let r of e) {
        let o = r(i);
        if (o) {
          s || (s = Object.assign({}, i.props));
          let l = o[1],
            a = o[0];
          (a.combine && a.id in s && (l = a.combine(s[a.id], l)),
            (s[a.id] = l));
        }
      }
      t.push(s ? new Ce(i.name, s, i.id, i.flags) : i);
    }
    return new go(t);
  }
}
const Cn = new WeakMap(),
  ql = new WeakMap();
var U;
(function (n) {
  ((n[(n.ExcludeBuffers = 1)] = "ExcludeBuffers"),
    (n[(n.IncludeAnonymous = 2)] = "IncludeAnonymous"),
    (n[(n.IgnoreMounts = 4)] = "IgnoreMounts"),
    (n[(n.IgnoreOverlays = 8)] = "IgnoreOverlays"),
    (n[(n.EnterBracketed = 16)] = "EnterBracketed"));
})(U || (U = {}));
class J {
  constructor(e, t, i, s, r) {
    if (
      ((this.type = e),
      (this.children = t),
      (this.positions = i),
      (this.length = s),
      (this.props = null),
      r && r.length)
    ) {
      this.props = Object.create(null);
      for (let [o, l] of r) this.props[typeof o == "number" ? o : o.id] = l;
    }
  }
  toString() {
    let e = ii.get(this);
    if (e && !e.overlay) return e.tree.toString();
    let t = "";
    for (let i of this.children) {
      let s = i.toString();
      s && (t && (t += ","), (t += s));
    }
    return this.type.name
      ? (/\W/.test(this.type.name) && !this.type.isError
          ? JSON.stringify(this.type.name)
          : this.type.name) + (t.length ? "(" + t + ")" : "")
      : t;
  }
  cursor(e = 0) {
    return new Zn(this.topNode, e);
  }
  cursorAt(e, t = 0, i = 0) {
    let s = Cn.get(this) || this.topNode,
      r = new Zn(s);
    return (r.moveTo(e, t), Cn.set(this, r._tree), r);
  }
  get topNode() {
    return new we(this, 0, 0, null);
  }
  resolve(e, t = 0) {
    let i = zi(Cn.get(this) || this.topNode, e, t, !1);
    return (Cn.set(this, i), i);
  }
  resolveInner(e, t = 0) {
    let i = zi(ql.get(this) || this.topNode, e, t, !0);
    return (ql.set(this, i), i);
  }
  resolveStack(e, t = 0) {
    return gm(this, e, t);
  }
  iterate(e) {
    let { enter: t, leave: i, from: s = 0, to: r = this.length } = e,
      o = e.mode || 0,
      l = (o & U.IncludeAnonymous) > 0;
    for (let a = this.cursor(o | U.IncludeAnonymous); ; ) {
      let h = !1;
      if (
        a.from <= r &&
        a.to >= s &&
        ((!l && a.type.isAnonymous) || t(a) !== !1)
      ) {
        if (a.firstChild()) continue;
        h = !0;
      }
      for (; h && i && (l || !a.type.isAnonymous) && i(a), !a.nextSibling(); ) {
        if (!a.parent()) return;
        h = !0;
      }
    }
  }
  prop(e) {
    return e.perNode
      ? this.props
        ? this.props[e.id]
        : void 0
      : this.type.prop(e);
  }
  get propValues() {
    let e = [];
    if (this.props) for (let t in this.props) e.push([+t, this.props[t]]);
    return e;
  }
  balance(e = {}) {
    return this.children.length <= 8
      ? this
      : xo(
          Ce.none,
          this.children,
          this.positions,
          0,
          this.children.length,
          0,
          this.length,
          (t, i, s) => new J(this.type, t, i, s, this.propValues),
          e.makeTree || ((t, i, s) => new J(Ce.none, t, i, s)),
        );
  }
  static build(e) {
    return ym(e);
  }
}
J.empty = new J(Ce.none, [], [], 0);
class yo {
  constructor(e, t) {
    ((this.buffer = e), (this.index = t));
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new yo(this.buffer, this.index);
  }
}
class At {
  constructor(e, t, i) {
    ((this.buffer = e), (this.length = t), (this.set = i));
  }
  get type() {
    return Ce.none;
  }
  toString() {
    let e = [];
    for (let t = 0; t < this.buffer.length; )
      (e.push(this.childString(t)), (t = this.buffer[t + 3]));
    return e.join(",");
  }
  childString(e) {
    let t = this.buffer[e],
      i = this.buffer[e + 3],
      s = this.set.types[t],
      r = s.name;
    if (
      (/\W/.test(r) && !s.isError && (r = JSON.stringify(r)), (e += 4), i == e)
    )
      return r;
    let o = [];
    for (; e < i; ) (o.push(this.childString(e)), (e = this.buffer[e + 3]));
    return r + "(" + o.join(",") + ")";
  }
  findChild(e, t, i, s, r) {
    let { buffer: o } = this,
      l = -1;
    for (
      let a = e;
      a != t && !(gc(r, s, o[a + 1], o[a + 2]) && ((l = a), i > 0));
      a = o[a + 3]
    );
    return l;
  }
  slice(e, t, i) {
    let s = this.buffer,
      r = new Uint16Array(t - e),
      o = 0;
    for (let l = e, a = 0; l < t; ) {
      ((r[a++] = s[l++]), (r[a++] = s[l++] - i));
      let h = (r[a++] = s[l++] - i);
      ((r[a++] = s[l++] - e), (o = Math.max(o, h)));
    }
    return new At(r, o, this.set);
  }
}
function gc(n, e, t, i) {
  switch (n) {
    case -2:
      return t < e;
    case -1:
      return i >= e && t < e;
    case 0:
      return t < e && i > e;
    case 1:
      return t <= e && i > e;
    case 2:
      return i > e;
    case 4:
      return !0;
  }
}
function zi(n, e, t, i) {
  for (
    var s;
    n.from == n.to ||
    (t < 1 ? n.from >= e : n.from > e) ||
    (t > -1 ? n.to <= e : n.to < e);
  ) {
    let o = !i && n instanceof we && n.index < 0 ? null : n.parent;
    if (!o) return n;
    n = o;
  }
  let r = i ? 0 : U.IgnoreOverlays;
  if (i)
    for (let o = n, l = o.parent; l; o = l, l = o.parent)
      o instanceof we &&
        o.index < 0 &&
        ((s = l.enter(e, t, r)) === null || s === void 0 ? void 0 : s.from) !=
          o.from &&
        (n = l);
  for (;;) {
    let o = n.enter(e, t, r);
    if (!o) return n;
    n = o;
  }
}
class yc {
  cursor(e = 0) {
    return new Zn(this, e);
  }
  getChild(e, t = null, i = null) {
    let s = $l(this, e, t, i);
    return s.length ? s[0] : null;
  }
  getChildren(e, t = null, i = null) {
    return $l(this, e, t, i);
  }
  resolve(e, t = 0) {
    return zi(this, e, t, !1);
  }
  resolveInner(e, t = 0) {
    return zi(this, e, t, !0);
  }
  matchContext(e) {
    return Nr(this.parent, e);
  }
  enterUnfinishedNodesBefore(e) {
    let t = this.childBefore(e),
      i = this;
    for (; t; ) {
      let s = t.lastChild;
      if (!s || s.to != t.to) break;
      s.type.isError && s.from == s.to
        ? ((i = t), (t = s.prevSibling))
        : (t = s);
    }
    return i;
  }
  get node() {
    return this;
  }
  get next() {
    return this.parent;
  }
}
class we extends yc {
  constructor(e, t, i, s) {
    (super(),
      (this._tree = e),
      (this.from = t),
      (this.index = i),
      (this._parent = s));
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(e, t, i, s, r = 0) {
    for (let o = this; ; ) {
      for (
        let { children: l, positions: a } = o._tree, h = t > 0 ? l.length : -1;
        e != h;
        e += t
      ) {
        let c = l[e],
          f = a[e] + o.from,
          u;
        if (
          !(
            !(
              r & U.EnterBracketed &&
              c instanceof J &&
              (u = ii.get(c)) &&
              !u.overlay &&
              u.bracketed &&
              i >= f &&
              i <= f + c.length
            ) && !gc(s, i, f, f + c.length)
          )
        ) {
          if (c instanceof At) {
            if (r & U.ExcludeBuffers) continue;
            let d = c.findChild(0, c.buffer.length, t, i - f, s);
            if (d > -1) return new nt(new pm(o, c, e, f), null, d);
          } else if (r & U.IncludeAnonymous || !c.type.isAnonymous || bo(c)) {
            let d;
            if (!(r & U.IgnoreMounts) && (d = ii.get(c)) && !d.overlay)
              return new we(d.tree, f, e, o);
            let p = new we(c, f, e, o);
            return r & U.IncludeAnonymous || !p.type.isAnonymous
              ? p
              : p.nextChild(t < 0 ? c.children.length - 1 : 0, t, i, s, r);
          }
        }
      }
      if (
        r & U.IncludeAnonymous ||
        !o.type.isAnonymous ||
        (o.index >= 0
          ? (e = o.index + t)
          : (e = t < 0 ? -1 : o._parent._tree.children.length),
        (o = o._parent),
        !o)
      )
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(0, 1, 0, 4);
  }
  get lastChild() {
    return this.nextChild(this._tree.children.length - 1, -1, 0, 4);
  }
  childAfter(e) {
    return this.nextChild(0, 1, e, 2);
  }
  childBefore(e) {
    return this.nextChild(this._tree.children.length - 1, -1, e, -2);
  }
  prop(e) {
    return this._tree.prop(e);
  }
  enter(e, t, i = 0) {
    let s;
    if (!(i & U.IgnoreOverlays) && (s = ii.get(this._tree)) && s.overlay) {
      let r = e - this.from,
        o = i & U.EnterBracketed && s.bracketed;
      for (let { from: l, to: a } of s.overlay)
        if ((t > 0 || o ? l <= r : l < r) && (t < 0 || o ? a >= r : a > r))
          return new we(s.tree, s.overlay[0].from + this.from, -1, this);
    }
    return this.nextChild(0, 1, e, t, i);
  }
  nextSignificantParent() {
    let e = this;
    for (; e.type.isAnonymous && e._parent; ) e = e._parent;
    return e;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0
      ? this._parent.nextChild(this.index + 1, 1, 0, 4)
      : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0
      ? this._parent.nextChild(this.index - 1, -1, 0, 4)
      : null;
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  toString() {
    return this._tree.toString();
  }
}
function $l(n, e, t, i) {
  let s = n.cursor(),
    r = [];
  if (!s.firstChild()) return r;
  if (t != null) {
    for (let o = !1; !o; ) if (((o = s.type.is(t)), !s.nextSibling())) return r;
  }
  for (;;) {
    if (i != null && s.type.is(i)) return r;
    if ((s.type.is(e) && r.push(s.node), !s.nextSibling()))
      return i == null ? r : [];
  }
}
function Nr(n, e, t = e.length - 1) {
  for (let i = n; t >= 0; i = i.parent) {
    if (!i) return !1;
    if (!i.type.isAnonymous) {
      if (e[t] && e[t] != i.name) return !1;
      t--;
    }
  }
  return !0;
}
class pm {
  constructor(e, t, i, s) {
    ((this.parent = e), (this.buffer = t), (this.index = i), (this.start = s));
  }
}
class nt extends yc {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(e, t, i) {
    (super(),
      (this.context = e),
      (this._parent = t),
      (this.index = i),
      (this.type = e.buffer.set.types[e.buffer.buffer[i]]));
  }
  child(e, t, i) {
    let { buffer: s } = this.context,
      r = s.findChild(
        this.index + 4,
        s.buffer[this.index + 3],
        e,
        t - this.context.start,
        i,
      );
    return r < 0 ? null : new nt(this.context, this, r);
  }
  get firstChild() {
    return this.child(1, 0, 4);
  }
  get lastChild() {
    return this.child(-1, 0, 4);
  }
  childAfter(e) {
    return this.child(1, e, 2);
  }
  childBefore(e) {
    return this.child(-1, e, -2);
  }
  prop(e) {
    return this.type.prop(e);
  }
  enter(e, t, i = 0) {
    if (i & U.ExcludeBuffers) return null;
    let { buffer: s } = this.context,
      r = s.findChild(
        this.index + 4,
        s.buffer[this.index + 3],
        t > 0 ? 1 : -1,
        e - this.context.start,
        t,
      );
    return r < 0 ? null : new nt(this.context, this, r);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(e) {
    return this._parent
      ? null
      : this.context.parent.nextChild(this.context.index + e, e, 0, 4);
  }
  get nextSibling() {
    let { buffer: e } = this.context,
      t = e.buffer[this.index + 3];
    return t <
      (this._parent ? e.buffer[this._parent.index + 3] : e.buffer.length)
      ? new nt(this.context, this._parent, t)
      : this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer: e } = this.context,
      t = this._parent ? this._parent.index + 4 : 0;
    return this.index == t
      ? this.externalSibling(-1)
      : new nt(
          this.context,
          this._parent,
          e.findChild(t, this.index, -1, 0, 4),
        );
  }
  get tree() {
    return null;
  }
  toTree() {
    let e = [],
      t = [],
      { buffer: i } = this.context,
      s = this.index + 4,
      r = i.buffer[this.index + 3];
    if (r > s) {
      let o = i.buffer[this.index + 1];
      (e.push(i.slice(s, r, o)), t.push(0));
    }
    return new J(this.type, e, t, this.to - this.from);
  }
  toString() {
    return this.context.buffer.childString(this.index);
  }
}
function bc(n) {
  if (!n.length) return null;
  let e = 0,
    t = n[0];
  for (let r = 1; r < n.length; r++) {
    let o = n[r];
    (o.from > t.from || o.to < t.to) && ((t = o), (e = r));
  }
  let i = t instanceof we && t.index < 0 ? null : t.parent,
    s = n.slice();
  return (i ? (s[e] = i) : s.splice(e, 1), new mm(s, t));
}
class mm {
  constructor(e, t) {
    ((this.heads = e), (this.node = t));
  }
  get next() {
    return bc(this.heads);
  }
}
function gm(n, e, t) {
  let i = n.resolveInner(e, t),
    s = null;
  for (let r = i instanceof we ? i : i.context.parent; r; r = r.parent)
    if (r.index < 0) {
      let o = r.parent;
      ((s || (s = [i])).push(o.resolve(e, t)), (r = o));
    } else {
      let o = ii.get(r.tree);
      if (
        o &&
        o.overlay &&
        o.overlay[0].from <= e &&
        o.overlay[o.overlay.length - 1].to >= e
      ) {
        let l = new we(o.tree, o.overlay[0].from + r.from, -1, r);
        (s || (s = [i])).push(zi(l, e, t, !1));
      }
    }
  return s ? bc(s) : i;
}
class Zn {
  get name() {
    return this.type.name;
  }
  constructor(e, t = 0) {
    if (
      ((this.buffer = null),
      (this.stack = []),
      (this.index = 0),
      (this.bufferNode = null),
      (this.mode = t & ~U.EnterBracketed),
      e instanceof we)
    )
      this.yieldNode(e);
    else {
      ((this._tree = e.context.parent), (this.buffer = e.context));
      for (let i = e._parent; i; i = i._parent) this.stack.unshift(i.index);
      ((this.bufferNode = e), this.yieldBuf(e.index));
    }
  }
  yieldNode(e) {
    return e
      ? ((this._tree = e),
        (this.type = e.type),
        (this.from = e.from),
        (this.to = e.to),
        !0)
      : !1;
  }
  yieldBuf(e, t) {
    this.index = e;
    let { start: i, buffer: s } = this.buffer;
    return (
      (this.type = t || s.set.types[s.buffer[e]]),
      (this.from = i + s.buffer[e + 1]),
      (this.to = i + s.buffer[e + 2]),
      !0
    );
  }
  yield(e) {
    return e
      ? e instanceof we
        ? ((this.buffer = null), this.yieldNode(e))
        : ((this.buffer = e.context), this.yieldBuf(e.index, e.type))
      : !1;
  }
  toString() {
    return this.buffer
      ? this.buffer.buffer.childString(this.index)
      : this._tree.toString();
  }
  enterChild(e, t, i) {
    if (!this.buffer)
      return this.yield(
        this._tree.nextChild(
          e < 0 ? this._tree._tree.children.length - 1 : 0,
          e,
          t,
          i,
          this.mode,
        ),
      );
    let { buffer: s } = this.buffer,
      r = s.findChild(
        this.index + 4,
        s.buffer[this.index + 3],
        e,
        t - this.buffer.start,
        i,
      );
    return r < 0 ? !1 : (this.stack.push(this.index), this.yieldBuf(r));
  }
  firstChild() {
    return this.enterChild(1, 0, 4);
  }
  lastChild() {
    return this.enterChild(-1, 0, 4);
  }
  childAfter(e) {
    return this.enterChild(1, e, 2);
  }
  childBefore(e) {
    return this.enterChild(-1, e, -2);
  }
  enter(e, t, i = this.mode) {
    return this.buffer
      ? i & U.ExcludeBuffers
        ? !1
        : this.enterChild(1, e, t)
      : this.yield(this._tree.enter(e, t, i));
  }
  parent() {
    if (!this.buffer)
      return this.yieldNode(
        this.mode & U.IncludeAnonymous ? this._tree._parent : this._tree.parent,
      );
    if (this.stack.length) return this.yieldBuf(this.stack.pop());
    let e =
      this.mode & U.IncludeAnonymous
        ? this.buffer.parent
        : this.buffer.parent.nextSignificantParent();
    return ((this.buffer = null), this.yieldNode(e));
  }
  sibling(e) {
    if (!this.buffer)
      return this._tree._parent
        ? this.yield(
            this._tree.index < 0
              ? null
              : this._tree._parent.nextChild(
                  this._tree.index + e,
                  e,
                  0,
                  4,
                  this.mode,
                ),
          )
        : !1;
    let { buffer: t } = this.buffer,
      i = this.stack.length - 1;
    if (e < 0) {
      let s = i < 0 ? 0 : this.stack[i] + 4;
      if (this.index != s)
        return this.yieldBuf(t.findChild(s, this.index, -1, 0, 4));
    } else {
      let s = t.buffer[this.index + 3];
      if (s < (i < 0 ? t.buffer.length : t.buffer[this.stack[i] + 3]))
        return this.yieldBuf(s);
    }
    return i < 0
      ? this.yield(
          this.buffer.parent.nextChild(
            this.buffer.index + e,
            e,
            0,
            4,
            this.mode,
          ),
        )
      : !1;
  }
  nextSibling() {
    return this.sibling(1);
  }
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(e) {
    let t,
      i,
      { buffer: s } = this;
    if (s) {
      if (e > 0) {
        if (this.index < s.buffer.buffer.length) return !1;
      } else
        for (let r = 0; r < this.index; r++)
          if (s.buffer.buffer[r + 3] < this.index) return !1;
      ({ index: t, parent: i } = s);
    } else ({ index: t, _parent: i } = this._tree);
    for (; i; { index: t, _parent: i } = i)
      if (t > -1)
        for (
          let r = t + e, o = e < 0 ? -1 : i._tree.children.length;
          r != o;
          r += e
        ) {
          let l = i._tree.children[r];
          if (
            this.mode & U.IncludeAnonymous ||
            l instanceof At ||
            !l.type.isAnonymous ||
            bo(l)
          )
            return !1;
        }
    return !0;
  }
  move(e, t) {
    if (t && this.enterChild(e, 0, 4)) return !0;
    for (;;) {
      if (this.sibling(e)) return !0;
      if (this.atLastNode(e) || !this.parent()) return !1;
    }
  }
  next(e = !0) {
    return this.move(1, e);
  }
  prev(e = !0) {
    return this.move(-1, e);
  }
  moveTo(e, t = 0) {
    for (
      ;
      (this.from == this.to ||
        (t < 1 ? this.from >= e : this.from > e) ||
        (t > -1 ? this.to <= e : this.to < e)) &&
      this.parent();
    );
    for (; this.enterChild(1, e, t); );
    return this;
  }
  get node() {
    if (!this.buffer) return this._tree;
    let e = this.bufferNode,
      t = null,
      i = 0;
    if (e && e.context == this.buffer)
      e: for (let s = this.index, r = this.stack.length; r >= 0; ) {
        for (let o = e; o; o = o._parent)
          if (o.index == s) {
            if (s == this.index) return o;
            ((t = o), (i = r + 1));
            break e;
          }
        s = this.stack[--r];
      }
    for (let s = i; s < this.stack.length; s++)
      t = new nt(this.buffer, t, this.stack[s]);
    return (this.bufferNode = new nt(this.buffer, t, this.index));
  }
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  iterate(e, t) {
    for (let i = 0; ; ) {
      let s = !1;
      if (this.type.isAnonymous || e(this) !== !1) {
        if (this.firstChild()) {
          i++;
          continue;
        }
        this.type.isAnonymous || (s = !0);
      }
      for (;;) {
        if ((s && t && t(this), (s = this.type.isAnonymous), !i)) return;
        if (this.nextSibling()) break;
        (this.parent(), i--, (s = !0));
      }
    }
  }
  matchContext(e) {
    if (!this.buffer) return Nr(this.node.parent, e);
    let { buffer: t } = this.buffer,
      { types: i } = t.set;
    for (let s = e.length - 1, r = this.stack.length - 1; s >= 0; r--) {
      if (r < 0) return Nr(this._tree, e, s);
      let o = i[t.buffer[this.stack[r]]];
      if (!o.isAnonymous) {
        if (e[s] && e[s] != o.name) return !1;
        s--;
      }
    }
    return !0;
  }
}
function bo(n) {
  return n.children.some(
    (e) => e instanceof At || !e.type.isAnonymous || bo(e),
  );
}
function ym(n) {
  var e;
  let {
      buffer: t,
      nodeSet: i,
      maxBufferLength: s = fm,
      reused: r = [],
      minRepeatType: o = i.types.length,
    } = n,
    l = Array.isArray(t) ? new yo(t, t.length) : t,
    a = i.types,
    h = 0,
    c = 0;
  function f(k, S, C, P, B, F) {
    let { id: I, start: E, end: N, size: W } = l,
      V = c,
      X = h;
    if (W < 0)
      if ((l.next(), W == -1)) {
        let fe = r[I];
        (C.push(fe), P.push(E - k));
        return;
      } else if (W == -3) {
        h = I;
        return;
      } else if (W == -4) {
        c = I;
        return;
      } else throw new RangeError(`Unrecognized record size: ${W}`);
    let Z = a[I],
      ye,
      $,
      re = E - k;
    if (N - E <= s && ($ = g(l.pos - S, B))) {
      let fe = new Uint16Array($.size - $.skip),
        be = l.pos - $.size,
        Ge = fe.length;
      for (; l.pos > be; ) Ge = b($.start, fe, Ge);
      ((ye = new At(fe, N - $.start, i)), (re = $.start - k));
    } else {
      let fe = l.pos - W;
      l.next();
      let be = [],
        Ge = [],
        Bt = I >= o ? I : -1,
        Kt = 0,
        hn = N;
      for (; l.pos > fe; )
        Bt >= 0 && l.id == Bt && l.size >= 0
          ? (l.end <= hn - s &&
              (p(be, Ge, E, Kt, l.end, hn, Bt, V, X),
              (Kt = be.length),
              (hn = l.end)),
            l.next())
          : F > 2500
            ? u(E, fe, be, Ge)
            : f(E, fe, be, Ge, Bt, F + 1);
      if (
        (Bt >= 0 &&
          Kt > 0 &&
          Kt < be.length &&
          p(be, Ge, E, Kt, E, hn, Bt, V, X),
        be.reverse(),
        Ge.reverse(),
        Bt > -1 && Kt > 0)
      ) {
        let qo = d(Z, X);
        ye = xo(Z, be, Ge, 0, be.length, 0, N - E, qo, qo);
      } else ye = m(Z, be, Ge, N - E, V - N, X);
    }
    (C.push(ye), P.push(re));
  }
  function u(k, S, C, P) {
    let B = [],
      F = 0,
      I = -1;
    for (; l.pos > S; ) {
      let { id: E, start: N, end: W, size: V } = l;
      if (V > 4) l.next();
      else {
        if (I > -1 && N < I) break;
        (I < 0 && (I = W - s), B.push(E, N, W), F++, l.next());
      }
    }
    if (F) {
      let E = new Uint16Array(F * 4),
        N = B[B.length - 2];
      for (let W = B.length - 3, V = 0; W >= 0; W -= 3)
        ((E[V++] = B[W]),
          (E[V++] = B[W + 1] - N),
          (E[V++] = B[W + 2] - N),
          (E[V++] = V));
      (C.push(new At(E, B[2] - N, i)), P.push(N - k));
    }
  }
  function d(k, S) {
    return (C, P, B) => {
      let F = 0,
        I = C.length - 1,
        E,
        N;
      if (I >= 0 && (E = C[I]) instanceof J) {
        if (!I && E.type == k && E.length == B) return E;
        (N = E.prop(H.lookAhead)) && (F = P[I] + E.length + N);
      }
      return m(k, C, P, B, F, S);
    };
  }
  function p(k, S, C, P, B, F, I, E, N) {
    let W = [],
      V = [];
    for (; k.length > P; ) (W.push(k.pop()), V.push(S.pop() + C - B));
    (k.push(m(i.types[I], W, V, F - B, E - F, N)), S.push(B - C));
  }
  function m(k, S, C, P, B, F, I) {
    if (F) {
      let E = [H.contextHash, F];
      I = I ? [E].concat(I) : [E];
    }
    if (B > 25) {
      let E = [H.lookAhead, B];
      I = I ? [E].concat(I) : [E];
    }
    return new J(k, S, C, P, I);
  }
  function g(k, S) {
    let C = l.fork(),
      P = 0,
      B = 0,
      F = 0,
      I = C.end - s,
      E = { size: 0, start: 0, skip: 0 };
    e: for (let N = C.pos - k; C.pos > N; ) {
      let W = C.size;
      if (C.id == S && W >= 0) {
        ((E.size = P),
          (E.start = B),
          (E.skip = F),
          (F += 4),
          (P += 4),
          C.next());
        continue;
      }
      let V = C.pos - W;
      if (W < 0 || V < N || C.start < I) break;
      let X = C.id >= o ? 4 : 0,
        Z = C.start;
      for (C.next(); C.pos > V; ) {
        if (C.size < 0)
          if (C.size == -3 || C.size == -4) X += 4;
          else break e;
        else C.id >= o && (X += 4);
        C.next();
      }
      ((B = Z), (P += W), (F += X));
    }
    return (
      (S < 0 || P == k) && ((E.size = P), (E.start = B), (E.skip = F)),
      E.size > 4 ? E : void 0
    );
  }
  function b(k, S, C) {
    let { id: P, start: B, end: F, size: I } = l;
    if ((l.next(), I >= 0 && P < o)) {
      let E = C;
      if (I > 4) {
        let N = l.pos - (I - 4);
        for (; l.pos > N; ) C = b(k, S, C);
      }
      ((S[--C] = E), (S[--C] = F - k), (S[--C] = B - k), (S[--C] = P));
    } else I == -3 ? (h = P) : I == -4 && (c = P);
    return C;
  }
  let w = [],
    v = [];
  for (; l.pos > 0; ) f(n.start || 0, n.bufferStart || 0, w, v, -1, 0);
  let T =
    (e = n.length) !== null && e !== void 0
      ? e
      : w.length
        ? v[0] + w[0].length
        : 0;
  return new J(a[n.topID], w.reverse(), v.reverse(), T);
}
const Kl = new WeakMap();
function Hn(n, e) {
  if (!n.isAnonymous || e instanceof At || e.type != n) return 1;
  let t = Kl.get(e);
  if (t == null) {
    t = 1;
    for (let i of e.children) {
      if (i.type != n || !(i instanceof J)) {
        t = 1;
        break;
      }
      t += Hn(n, i);
    }
    Kl.set(e, t);
  }
  return t;
}
function xo(n, e, t, i, s, r, o, l, a) {
  let h = 0;
  for (let p = i; p < s; p++) h += Hn(n, e[p]);
  let c = Math.ceil((h * 1.5) / 8),
    f = [],
    u = [];
  function d(p, m, g, b, w) {
    for (let v = g; v < b; ) {
      let T = v,
        k = m[v],
        S = Hn(n, p[v]);
      for (v++; v < b; v++) {
        let C = Hn(n, p[v]);
        if (S + C >= c) break;
        S += C;
      }
      if (v == T + 1) {
        if (S > c) {
          let C = p[T];
          d(C.children, C.positions, 0, C.children.length, m[T] + w);
          continue;
        }
        f.push(p[T]);
      } else {
        let C = m[v - 1] + p[v - 1].length - k;
        f.push(xo(n, p, m, T, v, k, C, null, a));
      }
      u.push(k + w - r);
    }
  }
  return (d(e, t, i, s, 0), (l || a)(f, u, o));
}
class n1 {
  constructor() {
    this.map = new WeakMap();
  }
  setBuffer(e, t, i) {
    let s = this.map.get(e);
    (s || this.map.set(e, (s = new Map())), s.set(t, i));
  }
  getBuffer(e, t) {
    let i = this.map.get(e);
    return i && i.get(t);
  }
  set(e, t) {
    e instanceof nt
      ? this.setBuffer(e.context.buffer, e.index, t)
      : e instanceof we && this.map.set(e.tree, t);
  }
  get(e) {
    return e instanceof nt
      ? this.getBuffer(e.context.buffer, e.index)
      : e instanceof we
        ? this.map.get(e.tree)
        : void 0;
  }
  cursorSet(e, t) {
    e.buffer
      ? this.setBuffer(e.buffer.buffer, e.index, t)
      : this.map.set(e.tree, t);
  }
  cursorGet(e) {
    return e.buffer
      ? this.getBuffer(e.buffer.buffer, e.index)
      : this.map.get(e.tree);
  }
}
class ft {
  constructor(e, t, i, s, r = !1, o = !1) {
    ((this.from = e),
      (this.to = t),
      (this.tree = i),
      (this.offset = s),
      (this.open = (r ? 1 : 0) | (o ? 2 : 0)));
  }
  get openStart() {
    return (this.open & 1) > 0;
  }
  get openEnd() {
    return (this.open & 2) > 0;
  }
  static addTree(e, t = [], i = !1) {
    let s = [new ft(0, e.length, e, 0, !1, i)];
    for (let r of t) r.to > e.length && s.push(r);
    return s;
  }
  static applyChanges(e, t, i = 128) {
    if (!t.length) return e;
    let s = [],
      r = 1,
      o = e.length ? e[0] : null;
    for (let l = 0, a = 0, h = 0; ; l++) {
      let c = l < t.length ? t[l] : null,
        f = c ? c.fromA : 1e9;
      if (f - a >= i)
        for (; o && o.from < f; ) {
          let u = o;
          if (a >= u.from || f <= u.to || h) {
            let d = Math.max(u.from, a) - h,
              p = Math.min(u.to, f) - h;
            u = d >= p ? null : new ft(d, p, u.tree, u.offset + h, l > 0, !!c);
          }
          if ((u && s.push(u), o.to > f)) break;
          o = r < e.length ? e[r++] : null;
        }
      if (!c) break;
      ((a = c.toA), (h = c.toA - c.toB));
    }
    return s;
  }
}
class xc {
  startParse(e, t, i) {
    return (
      typeof e == "string" && (e = new bm(e)),
      (i = i
        ? i.length
          ? i.map((s) => new We(s.from, s.to))
          : [new We(0, 0)]
        : [new We(0, e.length)]),
      this.createParse(e, t || [], i)
    );
  }
  parse(e, t, i) {
    let s = this.startParse(e, t, i);
    for (;;) {
      let r = s.advance();
      if (r) return r;
    }
  }
}
class bm {
  constructor(e) {
    this.string = e;
  }
  get length() {
    return this.string.length;
  }
  chunk(e) {
    return this.string.slice(e);
  }
  get lineChunks() {
    return !1;
  }
  read(e, t) {
    return this.string.slice(e, t);
  }
}
function s1(n) {
  return (e, t, i, s) => new wm(e, n, t, i, s);
}
class jl {
  constructor(e, t, i, s, r, o) {
    ((this.parser = e),
      (this.parse = t),
      (this.overlay = i),
      (this.bracketed = s),
      (this.target = r),
      (this.from = o));
  }
}
function Ul(n) {
  if (!n.length || n.some((e) => e.from >= e.to))
    throw new RangeError(
      "Invalid inner parse ranges given: " + JSON.stringify(n),
    );
}
class xm {
  constructor(e, t, i, s, r, o, l, a) {
    ((this.parser = e),
      (this.predicate = t),
      (this.mounts = i),
      (this.index = s),
      (this.start = r),
      (this.bracketed = o),
      (this.target = l),
      (this.prev = a),
      (this.depth = 0),
      (this.ranges = []));
  }
}
const Wr = new H({ perNode: !0 });
class wm {
  constructor(e, t, i, s, r) {
    ((this.nest = t),
      (this.input = i),
      (this.fragments = s),
      (this.ranges = r),
      (this.inner = []),
      (this.innerDone = 0),
      (this.baseTree = null),
      (this.stoppedAt = null),
      (this.baseParse = e));
  }
  advance() {
    if (this.baseParse) {
      let i = this.baseParse.advance();
      if (!i) return null;
      if (
        ((this.baseParse = null),
        (this.baseTree = i),
        this.startInner(),
        this.stoppedAt != null)
      )
        for (let s of this.inner) s.parse.stopAt(this.stoppedAt);
    }
    if (this.innerDone == this.inner.length) {
      let i = this.baseTree;
      return (
        this.stoppedAt != null &&
          (i = new J(
            i.type,
            i.children,
            i.positions,
            i.length,
            i.propValues.concat([[Wr, this.stoppedAt]]),
          )),
        i
      );
    }
    let e = this.inner[this.innerDone],
      t = e.parse.advance();
    if (t) {
      this.innerDone++;
      let i = Object.assign(Object.create(null), e.target.props);
      ((i[H.mounted.id] = new ii(t, e.overlay, e.parser, e.bracketed)),
        (e.target.props = i));
    }
    return null;
  }
  get parsedPos() {
    if (this.baseParse) return 0;
    let e = this.input.length;
    for (let t = this.innerDone; t < this.inner.length; t++)
      this.inner[t].from < e &&
        (e = Math.min(e, this.inner[t].parse.parsedPos));
    return e;
  }
  stopAt(e) {
    if (((this.stoppedAt = e), this.baseParse)) this.baseParse.stopAt(e);
    else
      for (let t = this.innerDone; t < this.inner.length; t++)
        this.inner[t].parse.stopAt(e);
  }
  startInner() {
    let e = new Sm(this.fragments),
      t = null,
      i = null,
      s = new Zn(
        new we(this.baseTree, this.ranges[0].from, 0, null),
        U.IncludeAnonymous | U.IgnoreMounts,
      );
    e: for (let r, o; ; ) {
      let l = !0,
        a;
      if (this.stoppedAt != null && s.from >= this.stoppedAt) l = !1;
      else if (e.hasNode(s)) {
        if (t) {
          let h = t.mounts.find(
            (c) =>
              c.frag.from <= s.from && c.frag.to >= s.to && c.mount.overlay,
          );
          if (h)
            for (let c of h.mount.overlay) {
              let f = c.from + h.pos,
                u = c.to + h.pos;
              f >= s.from &&
                u <= s.to &&
                !t.ranges.some((d) => d.from < u && d.to > f) &&
                t.ranges.push({ from: f, to: u });
            }
        }
        l = !1;
      } else if (i && (o = vm(i.ranges, s.from, s.to))) l = o != 2;
      else if (
        !s.type.isAnonymous &&
        (r = this.nest(s, this.input)) &&
        (s.from < s.to || !r.overlay)
      ) {
        s.tree || (km(s), t && t.depth++, i && i.depth++);
        let h = e.findMounts(s.from, r.parser);
        if (typeof r.overlay == "function")
          t = new xm(
            r.parser,
            r.overlay,
            h,
            this.inner.length,
            s.from,
            !!r.bracketed,
            s.tree,
            t,
          );
        else {
          let c = Yl(
            this.ranges,
            r.overlay || (s.from < s.to ? [new We(s.from, s.to)] : []),
          );
          (c.length && Ul(c),
            (c.length || !r.overlay) &&
              this.inner.push(
                new jl(
                  r.parser,
                  c.length
                    ? r.parser.startParse(this.input, Xl(h, c), c)
                    : r.parser.startParse(""),
                  r.overlay
                    ? r.overlay.map(
                        (f) => new We(f.from - s.from, f.to - s.from),
                      )
                    : null,
                  !!r.bracketed,
                  s.tree,
                  c.length ? c[0].from : s.from,
                ),
              ),
            r.overlay
              ? c.length && (i = { ranges: c, depth: 0, prev: i })
              : (l = !1));
        }
      } else if (
        t &&
        (a = t.predicate(s)) &&
        (a === !0 && (a = new We(s.from, s.to)), a.from < a.to)
      ) {
        let h = t.ranges.length - 1;
        h >= 0 && t.ranges[h].to == a.from
          ? (t.ranges[h] = { from: t.ranges[h].from, to: a.to })
          : t.ranges.push(a);
      }
      if (l && s.firstChild()) (t && t.depth++, i && i.depth++);
      else
        for (; !s.nextSibling(); ) {
          if (!s.parent()) break e;
          if (t && !--t.depth) {
            let h = Yl(this.ranges, t.ranges);
            (h.length &&
              (Ul(h),
              this.inner.splice(
                t.index,
                0,
                new jl(
                  t.parser,
                  t.parser.startParse(this.input, Xl(t.mounts, h), h),
                  t.ranges.map((c) => new We(c.from - t.start, c.to - t.start)),
                  t.bracketed,
                  t.target,
                  h[0].from,
                ),
              )),
              (t = t.prev));
          }
          i && !--i.depth && (i = i.prev);
        }
    }
  }
}
function vm(n, e, t) {
  for (let i of n) {
    if (i.from >= t) break;
    if (i.to > e) return i.from <= e && i.to >= t ? 2 : 1;
  }
  return 0;
}
function Gl(n, e, t, i, s, r) {
  if (e < t) {
    let o = n.buffer[e + 1];
    (i.push(n.slice(e, t, o)), s.push(o - r));
  }
}
function km(n) {
  let { node: e } = n,
    t = [],
    i = e.context.buffer;
  do (t.push(n.index), n.parent());
  while (!n.tree);
  let s = n.tree,
    r = s.children.indexOf(i),
    o = s.children[r],
    l = o.buffer,
    a = [r];
  function h(c, f, u, d, p, m) {
    let g = t[m],
      b = [],
      w = [];
    Gl(o, c, g, b, w, d);
    let v = l[g + 1],
      T = l[g + 2];
    a.push(b.length);
    let k = m
      ? h(g + 4, l[g + 3], o.set.types[l[g]], v, T - v, m - 1)
      : e.toTree();
    return (
      b.push(k),
      w.push(v - d),
      Gl(o, l[g + 3], f, b, w, d),
      new J(u, b, w, p)
    );
  }
  s.children[r] = h(0, l.length, Ce.none, 0, o.length, t.length - 1);
  for (let c of a) {
    let f = n.tree.children[c],
      u = n.tree.positions[c];
    n.yield(new we(f, u + n.from, c, n._tree));
  }
}
class Jl {
  constructor(e, t) {
    ((this.offset = t),
      (this.done = !1),
      (this.cursor = e.cursor(U.IncludeAnonymous | U.IgnoreMounts)));
  }
  moveTo(e) {
    let { cursor: t } = this,
      i = e - this.offset;
    for (; !this.done && t.from < i; )
      (t.to >= e && t.enter(i, 1, U.IgnoreOverlays | U.ExcludeBuffers)) ||
        t.next(!1) ||
        (this.done = !0);
  }
  hasNode(e) {
    if (
      (this.moveTo(e.from),
      !this.done &&
        this.cursor.from + this.offset == e.from &&
        this.cursor.tree)
    )
      for (let t = this.cursor.tree; ; ) {
        if (t == e.tree) return !0;
        if (
          t.children.length &&
          t.positions[0] == 0 &&
          t.children[0] instanceof J
        )
          t = t.children[0];
        else break;
      }
    return !1;
  }
}
class Sm {
  constructor(e) {
    var t;
    if (((this.fragments = e), (this.curTo = 0), (this.fragI = 0), e.length)) {
      let i = (this.curFrag = e[0]);
      ((this.curTo = (t = i.tree.prop(Wr)) !== null && t !== void 0 ? t : i.to),
        (this.inner = new Jl(i.tree, -i.offset)));
    } else this.curFrag = this.inner = null;
  }
  hasNode(e) {
    for (; this.curFrag && e.from >= this.curTo; ) this.nextFrag();
    return (
      this.curFrag &&
      this.curFrag.from <= e.from &&
      this.curTo >= e.to &&
      this.inner.hasNode(e)
    );
  }
  nextFrag() {
    var e;
    if ((this.fragI++, this.fragI == this.fragments.length))
      this.curFrag = this.inner = null;
    else {
      let t = (this.curFrag = this.fragments[this.fragI]);
      ((this.curTo = (e = t.tree.prop(Wr)) !== null && e !== void 0 ? e : t.to),
        (this.inner = new Jl(t.tree, -t.offset)));
    }
  }
  findMounts(e, t) {
    var i;
    let s = [];
    if (this.inner) {
      this.inner.cursor.moveTo(e, 1);
      for (let r = this.inner.cursor.node; r; r = r.parent) {
        let o =
          (i = r.tree) === null || i === void 0 ? void 0 : i.prop(H.mounted);
        if (o && o.parser == t)
          for (let l = this.fragI; l < this.fragments.length; l++) {
            let a = this.fragments[l];
            if (a.from >= r.to) break;
            a.tree == this.curFrag.tree &&
              s.push({ frag: a, pos: r.from - a.offset, mount: o });
          }
      }
    }
    return s;
  }
}
function Yl(n, e) {
  let t = null,
    i = e;
  for (let s = 1, r = 0; s < n.length; s++) {
    let o = n[s - 1].to,
      l = n[s].from;
    for (; r < i.length; r++) {
      let a = i[r];
      if (a.from >= l) break;
      a.to <= o ||
        (t || (i = t = e.slice()),
        a.from < o
          ? ((t[r] = new We(a.from, o)),
            a.to > l && t.splice(r + 1, 0, new We(l, a.to)))
          : a.to > l
            ? (t[r--] = new We(l, a.to))
            : t.splice(r--, 1));
    }
  }
  return i;
}
function Cm(n, e, t, i) {
  let s = 0,
    r = 0,
    o = !1,
    l = !1,
    a = -1e9,
    h = [];
  for (;;) {
    let c = s == n.length ? 1e9 : o ? n[s].to : n[s].from,
      f = r == e.length ? 1e9 : l ? e[r].to : e[r].from;
    if (o != l) {
      let u = Math.max(a, t),
        d = Math.min(c, f, i);
      u < d && h.push(new We(u, d));
    }
    if (((a = Math.min(c, f)), a == 1e9)) break;
    (c == a && (o ? ((o = !1), s++) : (o = !0)),
      f == a && (l ? ((l = !1), r++) : (l = !0)));
  }
  return h;
}
function Xl(n, e) {
  let t = [];
  for (let { pos: i, mount: s, frag: r } of n) {
    let o = i + (s.overlay ? s.overlay[0].from : 0),
      l = o + s.tree.length,
      a = Math.max(r.from, o),
      h = Math.min(r.to, l);
    if (s.overlay) {
      let c = s.overlay.map((u) => new We(u.from + i, u.to + i)),
        f = Cm(e, c, a, h);
      for (let u = 0, d = a; ; u++) {
        let p = u == f.length,
          m = p ? h : f[u].from;
        if (
          (m > d &&
            t.push(
              new ft(
                d,
                m,
                s.tree,
                -o,
                r.from >= d || r.openStart,
                r.to <= m || r.openEnd,
              ),
            ),
          p)
        )
          break;
        d = f[u].to;
      }
    } else
      t.push(
        new ft(
          a,
          h,
          s.tree,
          -o,
          r.from >= o || r.openStart,
          r.to <= l || r.openEnd,
        ),
      );
  }
  return t;
}
let Am = 0;
class Ie {
  constructor(e, t, i, s) {
    ((this.name = e),
      (this.set = t),
      (this.base = i),
      (this.modified = s),
      (this.id = Am++));
  }
  toString() {
    let { name: e } = this;
    for (let t of this.modified) t.name && (e = `${t.name}(${e})`);
    return e;
  }
  static define(e, t) {
    let i = typeof e == "string" ? e : "?";
    if ((e instanceof Ie && (t = e), t?.base))
      throw new Error("Can not derive from a modified tag");
    let s = new Ie(i, [], null, []);
    if ((s.set.push(s), t)) for (let r of t.set) s.set.push(r);
    return s;
  }
  static defineModifier(e) {
    let t = new es(e);
    return (i) =>
      i.modified.indexOf(t) > -1
        ? i
        : es.get(
            i.base || i,
            i.modified.concat(t).sort((s, r) => s.id - r.id),
          );
  }
}
let Mm = 0;
class es {
  constructor(e) {
    ((this.name = e), (this.instances = []), (this.id = Mm++));
  }
  static get(e, t) {
    if (!t.length) return e;
    let i = t[0].instances.find((l) => l.base == e && Tm(t, l.modified));
    if (i) return i;
    let s = [],
      r = new Ie(e.name, s, e, t);
    for (let l of t) l.instances.push(r);
    let o = Dm(t);
    for (let l of e.set)
      if (!l.modified.length) for (let a of o) s.push(es.get(l, a));
    return r;
  }
}
function Tm(n, e) {
  return n.length == e.length && n.every((t, i) => t == e[i]);
}
function Dm(n) {
  let e = [[]];
  for (let t = 0; t < n.length; t++)
    for (let i = 0, s = e.length; i < s; i++) e.push(e[i].concat(n[t]));
  return e.sort((t, i) => i.length - t.length);
}
function Om(n) {
  let e = Object.create(null);
  for (let t in n) {
    let i = n[t];
    Array.isArray(i) || (i = [i]);
    for (let s of t.split(" "))
      if (s) {
        let r = [],
          o = 2,
          l = s;
        for (let f = 0; ; ) {
          if (l == "..." && f > 0 && f + 3 == s.length) {
            o = 1;
            break;
          }
          let u = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(l);
          if (!u) throw new RangeError("Invalid path: " + s);
          if (
            (r.push(
              u[0] == "*" ? "" : u[0][0] == '"' ? JSON.parse(u[0]) : u[0],
            ),
            (f += u[0].length),
            f == s.length)
          )
            break;
          let d = s[f++];
          if (f == s.length && d == "!") {
            o = 0;
            break;
          }
          if (d != "/") throw new RangeError("Invalid path: " + s);
          l = s.slice(f);
        }
        let a = r.length - 1,
          h = r[a];
        if (!h) throw new RangeError("Invalid path: " + s);
        let c = new _i(i, o, a > 0 ? r.slice(0, a) : null);
        e[h] = c.sort(e[h]);
      }
  }
  return wc.add(e);
}
const wc = new H({
  combine(n, e) {
    let t, i, s;
    for (; n || e; ) {
      if (
        (!n || (e && n.depth >= e.depth)
          ? ((s = e), (e = e.next))
          : ((s = n), (n = n.next)),
        t && t.mode == s.mode && !s.context && !t.context)
      )
        continue;
      let r = new _i(s.tags, s.mode, s.context);
      (t ? (t.next = r) : (i = r), (t = r));
    }
    return i;
  },
});
class _i {
  constructor(e, t, i, s) {
    ((this.tags = e), (this.mode = t), (this.context = i), (this.next = s));
  }
  get opaque() {
    return this.mode == 0;
  }
  get inherit() {
    return this.mode == 1;
  }
  sort(e) {
    return !e || e.depth < this.depth
      ? ((this.next = e), this)
      : ((e.next = this.sort(e.next)), e);
  }
  get depth() {
    return this.context ? this.context.length : 0;
  }
}
_i.empty = new _i([], 2, null);
function vc(n, e) {
  let t = Object.create(null);
  for (let r of n)
    if (!Array.isArray(r.tag)) t[r.tag.id] = r.class;
    else for (let o of r.tag) t[o.id] = r.class;
  let { scope: i, all: s = null } = e || {};
  return {
    style: (r) => {
      let o = s;
      for (let l of r)
        for (let a of l.set) {
          let h = t[a.id];
          if (h) {
            o = o ? o + " " + h : h;
            break;
          }
        }
      return o;
    },
    scope: i,
  };
}
function Bm(n, e) {
  let t = null;
  for (let i of n) {
    let s = i.style(e);
    s && (t = t ? t + " " + s : s);
  }
  return t;
}
function Em(n, e, t, i = 0, s = n.length) {
  let r = new Lm(i, Array.isArray(e) ? e : [e], t);
  (r.highlightRange(n.cursor(), i, s, "", r.highlighters), r.flush(s));
}
class Lm {
  constructor(e, t, i) {
    ((this.at = e),
      (this.highlighters = t),
      (this.span = i),
      (this.class = ""));
  }
  startSpan(e, t) {
    t != this.class &&
      (this.flush(e), e > this.at && (this.at = e), (this.class = t));
  }
  flush(e) {
    e > this.at && this.class && this.span(this.at, e, this.class);
  }
  highlightRange(e, t, i, s, r) {
    let { type: o, from: l, to: a } = e;
    if (l >= i || a <= t) return;
    o.isTop && (r = this.highlighters.filter((d) => !d.scope || d.scope(o)));
    let h = s,
      c = Pm(e) || _i.empty,
      f = Bm(r, c.tags);
    if (
      (f &&
        (h && (h += " "), (h += f), c.mode == 1 && (s += (s ? " " : "") + f)),
      this.startSpan(Math.max(t, l), h),
      c.opaque)
    )
      return;
    let u = e.tree && e.tree.prop(H.mounted);
    if (u && u.overlay) {
      let d = e.node.enter(u.overlay[0].from + l, 1),
        p = this.highlighters.filter((g) => !g.scope || g.scope(u.tree.type)),
        m = e.firstChild();
      for (let g = 0, b = l; ; g++) {
        let w = g < u.overlay.length ? u.overlay[g] : null,
          v = w ? w.from + l : a,
          T = Math.max(t, b),
          k = Math.min(i, v);
        if (T < k && m)
          for (
            ;
            e.from < k &&
            (this.highlightRange(e, T, k, s, r),
            this.startSpan(Math.min(k, e.to), h),
            !(e.to >= v || !e.nextSibling()));
          );
        if (!w || v > i) break;
        ((b = w.to + l),
          b > t &&
            (this.highlightRange(
              d.cursor(),
              Math.max(t, w.from + l),
              Math.min(i, b),
              "",
              p,
            ),
            this.startSpan(Math.min(i, b), h)));
      }
      m && e.parent();
    } else if (e.firstChild()) {
      u && (s = "");
      do
        if (!(e.to <= t)) {
          if (e.from >= i) break;
          (this.highlightRange(e, t, i, s, r),
            this.startSpan(Math.min(i, e.to), h));
        }
      while (e.nextSibling());
      e.parent();
    }
  }
}
function Pm(n) {
  let e = n.type.prop(wc);
  for (; e && e.context && !n.matchContext(e.context); ) e = e.next;
  return e || null;
}
const M = Ie.define,
  An = M(),
  mt = M(),
  Ql = M(mt),
  Zl = M(mt),
  gt = M(),
  Mn = M(gt),
  zs = M(gt),
  Qe = M(),
  Et = M(Qe),
  Ye = M(),
  Xe = M(),
  Fr = M(),
  xi = M(Fr),
  Tn = M(),
  y = {
    comment: An,
    lineComment: M(An),
    blockComment: M(An),
    docComment: M(An),
    name: mt,
    variableName: M(mt),
    typeName: Ql,
    tagName: M(Ql),
    propertyName: Zl,
    attributeName: M(Zl),
    className: M(mt),
    labelName: M(mt),
    namespace: M(mt),
    macroName: M(mt),
    literal: gt,
    string: Mn,
    docString: M(Mn),
    character: M(Mn),
    attributeValue: M(Mn),
    number: zs,
    integer: M(zs),
    float: M(zs),
    bool: M(gt),
    regexp: M(gt),
    escape: M(gt),
    color: M(gt),
    url: M(gt),
    keyword: Ye,
    self: M(Ye),
    null: M(Ye),
    atom: M(Ye),
    unit: M(Ye),
    modifier: M(Ye),
    operatorKeyword: M(Ye),
    controlKeyword: M(Ye),
    definitionKeyword: M(Ye),
    moduleKeyword: M(Ye),
    operator: Xe,
    derefOperator: M(Xe),
    arithmeticOperator: M(Xe),
    logicOperator: M(Xe),
    bitwiseOperator: M(Xe),
    compareOperator: M(Xe),
    updateOperator: M(Xe),
    definitionOperator: M(Xe),
    typeOperator: M(Xe),
    controlOperator: M(Xe),
    punctuation: Fr,
    separator: M(Fr),
    bracket: xi,
    angleBracket: M(xi),
    squareBracket: M(xi),
    paren: M(xi),
    brace: M(xi),
    content: Qe,
    heading: Et,
    heading1: M(Et),
    heading2: M(Et),
    heading3: M(Et),
    heading4: M(Et),
    heading5: M(Et),
    heading6: M(Et),
    contentSeparator: M(Qe),
    list: M(Qe),
    quote: M(Qe),
    emphasis: M(Qe),
    strong: M(Qe),
    link: M(Qe),
    monospace: M(Qe),
    strikethrough: M(Qe),
    inserted: M(),
    deleted: M(),
    changed: M(),
    invalid: M(),
    meta: Tn,
    documentMeta: M(Tn),
    annotation: M(Tn),
    processingInstruction: M(Tn),
    definition: Ie.defineModifier("definition"),
    constant: Ie.defineModifier("constant"),
    function: Ie.defineModifier("function"),
    standard: Ie.defineModifier("standard"),
    local: Ie.defineModifier("local"),
    special: Ie.defineModifier("special"),
  };
for (let n in y) {
  let e = y[n];
  e instanceof Ie && (e.name = n);
}
vc([
  { tag: y.link, class: "tok-link" },
  { tag: y.heading, class: "tok-heading" },
  { tag: y.emphasis, class: "tok-emphasis" },
  { tag: y.strong, class: "tok-strong" },
  { tag: y.keyword, class: "tok-keyword" },
  { tag: y.atom, class: "tok-atom" },
  { tag: y.bool, class: "tok-bool" },
  { tag: y.url, class: "tok-url" },
  { tag: y.labelName, class: "tok-labelName" },
  { tag: y.inserted, class: "tok-inserted" },
  { tag: y.deleted, class: "tok-deleted" },
  { tag: y.literal, class: "tok-literal" },
  { tag: y.string, class: "tok-string" },
  { tag: y.number, class: "tok-number" },
  { tag: [y.regexp, y.escape, y.special(y.string)], class: "tok-string2" },
  { tag: y.variableName, class: "tok-variableName" },
  { tag: y.local(y.variableName), class: "tok-variableName tok-local" },
  {
    tag: y.definition(y.variableName),
    class: "tok-variableName tok-definition",
  },
  { tag: y.special(y.variableName), class: "tok-variableName2" },
  {
    tag: y.definition(y.propertyName),
    class: "tok-propertyName tok-definition",
  },
  { tag: y.typeName, class: "tok-typeName" },
  { tag: y.namespace, class: "tok-namespace" },
  { tag: y.className, class: "tok-className" },
  { tag: y.macroName, class: "tok-macroName" },
  { tag: y.propertyName, class: "tok-propertyName" },
  { tag: y.operator, class: "tok-operator" },
  { tag: y.comment, class: "tok-comment" },
  { tag: y.meta, class: "tok-meta" },
  { tag: y.invalid, class: "tok-invalid" },
  { tag: y.punctuation, class: "tok-punctuation" },
]);
var _s;
const Wt = new H();
function kc(n) {
  return D.define({ combine: n ? (e) => e.concat(n) : void 0 });
}
const Rm = new H();
class Fe {
  constructor(e, t, i = [], s = "") {
    ((this.data = e),
      (this.name = s),
      _.prototype.hasOwnProperty("tree") ||
        Object.defineProperty(_.prototype, "tree", {
          get() {
            return ge(this);
          },
        }),
      (this.parser = t),
      (this.extension = [
        Mt.of(this),
        _.languageData.of((r, o, l) => {
          let a = ea(r, o, l),
            h = a.type.prop(Wt);
          if (!h) return [];
          let c = r.facet(h),
            f = a.type.prop(Rm);
          if (f) {
            let u = a.resolve(o - a.from, l);
            for (let d of f)
              if (d.test(u, r)) {
                let p = r.facet(d.facet);
                return d.type == "replace" ? p : p.concat(c);
              }
          }
          return c;
        }),
      ].concat(i)));
  }
  isActiveAt(e, t, i = -1) {
    return ea(e, t, i).type.prop(Wt) == this.data;
  }
  findRegions(e) {
    let t = e.facet(Mt);
    if (t?.data == this.data) return [{ from: 0, to: e.doc.length }];
    if (!t || !t.allowsNesting) return [];
    let i = [],
      s = (r, o) => {
        if (r.prop(Wt) == this.data) {
          i.push({ from: o, to: o + r.length });
          return;
        }
        let l = r.prop(H.mounted);
        if (l) {
          if (l.tree.prop(Wt) == this.data) {
            if (l.overlay)
              for (let a of l.overlay)
                i.push({ from: a.from + o, to: a.to + o });
            else i.push({ from: o, to: o + r.length });
            return;
          } else if (l.overlay) {
            let a = i.length;
            if ((s(l.tree, l.overlay[0].from + o), i.length > a)) return;
          }
        }
        for (let a = 0; a < r.children.length; a++) {
          let h = r.children[a];
          h instanceof J && s(h, r.positions[a] + o);
        }
      };
    return (s(ge(e), 0), i);
  }
  get allowsNesting() {
    return !0;
  }
}
Fe.setState = R.define();
function ea(n, e, t) {
  let i = n.facet(Mt),
    s = ge(n).topNode;
  if (!i || i.allowsNesting)
    for (let r = s; r; r = r.enter(e, t, U.ExcludeBuffers | U.EnterBracketed))
      r.type.isTop && (s = r);
  return s;
}
class Hr extends Fe {
  constructor(e, t, i) {
    (super(e, t, [], i), (this.parser = t));
  }
  static define(e) {
    let t = kc(e.languageData);
    return new Hr(
      t,
      e.parser.configure({ props: [Wt.add((i) => (i.isTop ? t : void 0))] }),
      e.name,
    );
  }
  configure(e, t) {
    return new Hr(this.data, this.parser.configure(e), t || this.name);
  }
  get allowsNesting() {
    return this.parser.hasWrappers();
  }
}
function ge(n) {
  let e = n.field(Fe.state, !1);
  return e ? e.tree : J.empty;
}
class Im {
  constructor(e) {
    ((this.doc = e),
      (this.cursorPos = 0),
      (this.string = ""),
      (this.cursor = e.iter()));
  }
  get length() {
    return this.doc.length;
  }
  syncTo(e) {
    return (
      (this.string = this.cursor.next(e - this.cursorPos).value),
      (this.cursorPos = e + this.string.length),
      this.cursorPos - this.string.length
    );
  }
  chunk(e) {
    return (this.syncTo(e), this.string);
  }
  get lineChunks() {
    return !0;
  }
  read(e, t) {
    let i = this.cursorPos - this.string.length;
    return e < i || t >= this.cursorPos
      ? this.doc.sliceString(e, t)
      : this.string.slice(e - i, t - i);
  }
}
let wi = null;
class hi {
  constructor(e, t, i = [], s, r, o, l, a) {
    ((this.parser = e),
      (this.state = t),
      (this.fragments = i),
      (this.tree = s),
      (this.treeLen = r),
      (this.viewport = o),
      (this.skipped = l),
      (this.scheduleOn = a),
      (this.parse = null),
      (this.tempSkipped = []));
  }
  static create(e, t, i) {
    return new hi(e, t, [], J.empty, 0, i, [], null);
  }
  startParse() {
    return this.parser.startParse(new Im(this.state.doc), this.fragments);
  }
  work(e, t) {
    return (
      t != null && t >= this.state.doc.length && (t = void 0),
      this.tree != J.empty && this.isDone(t ?? this.state.doc.length)
        ? (this.takeTree(), !0)
        : this.withContext(() => {
            var i;
            if (typeof e == "number") {
              let s = Date.now() + e;
              e = () => Date.now() > s;
            }
            for (
              this.parse || (this.parse = this.startParse()),
                t != null &&
                  (this.parse.stoppedAt == null || this.parse.stoppedAt > t) &&
                  t < this.state.doc.length &&
                  this.parse.stopAt(t);
              ;
            ) {
              let s = this.parse.advance();
              if (s)
                if (
                  ((this.fragments = this.withoutTempSkipped(
                    ft.addTree(s, this.fragments, this.parse.stoppedAt != null),
                  )),
                  (this.treeLen =
                    (i = this.parse.stoppedAt) !== null && i !== void 0
                      ? i
                      : this.state.doc.length),
                  (this.tree = s),
                  (this.parse = null),
                  this.treeLen < (t ?? this.state.doc.length))
                )
                  this.parse = this.startParse();
                else return !0;
              if (e()) return !1;
            }
          })
    );
  }
  takeTree() {
    let e, t;
    this.parse &&
      (e = this.parse.parsedPos) >= this.treeLen &&
      ((this.parse.stoppedAt == null || this.parse.stoppedAt > e) &&
        this.parse.stopAt(e),
      this.withContext(() => {
        for (; !(t = this.parse.advance()); );
      }),
      (this.treeLen = e),
      (this.tree = t),
      (this.fragments = this.withoutTempSkipped(
        ft.addTree(this.tree, this.fragments, !0),
      )),
      (this.parse = null));
  }
  withContext(e) {
    let t = wi;
    wi = this;
    try {
      return e();
    } finally {
      wi = t;
    }
  }
  withoutTempSkipped(e) {
    for (let t; (t = this.tempSkipped.pop()); ) e = ta(e, t.from, t.to);
    return e;
  }
  changes(e, t) {
    let { fragments: i, tree: s, treeLen: r, viewport: o, skipped: l } = this;
    if ((this.takeTree(), !e.empty)) {
      let a = [];
      if (
        (e.iterChangedRanges((h, c, f, u) =>
          a.push({ fromA: h, toA: c, fromB: f, toB: u }),
        ),
        (i = ft.applyChanges(i, a)),
        (s = J.empty),
        (r = 0),
        (o = { from: e.mapPos(o.from, -1), to: e.mapPos(o.to, 1) }),
        this.skipped.length)
      ) {
        l = [];
        for (let h of this.skipped) {
          let c = e.mapPos(h.from, 1),
            f = e.mapPos(h.to, -1);
          c < f && l.push({ from: c, to: f });
        }
      }
    }
    return new hi(this.parser, t, i, s, r, o, l, this.scheduleOn);
  }
  updateViewport(e) {
    if (this.viewport.from == e.from && this.viewport.to == e.to) return !1;
    this.viewport = e;
    let t = this.skipped.length;
    for (let i = 0; i < this.skipped.length; i++) {
      let { from: s, to: r } = this.skipped[i];
      s < e.to &&
        r > e.from &&
        ((this.fragments = ta(this.fragments, s, r)),
        this.skipped.splice(i--, 1));
    }
    return this.skipped.length >= t ? !1 : (this.reset(), !0);
  }
  reset() {
    this.parse && (this.takeTree(), (this.parse = null));
  }
  skipUntilInView(e, t) {
    this.skipped.push({ from: e, to: t });
  }
  static getSkippingParser(e) {
    return new (class extends xc {
      createParse(t, i, s) {
        let r = s[0].from,
          o = s[s.length - 1].to;
        return {
          parsedPos: r,
          advance() {
            let a = wi;
            if (a) {
              for (let h of s) a.tempSkipped.push(h);
              e &&
                (a.scheduleOn = a.scheduleOn
                  ? Promise.all([a.scheduleOn, e])
                  : e);
            }
            return ((this.parsedPos = o), new J(Ce.none, [], [], o - r));
          },
          stoppedAt: null,
          stopAt() {},
        };
      }
    })();
  }
  isDone(e) {
    e = Math.min(e, this.state.doc.length);
    let t = this.fragments;
    return this.treeLen >= e && t.length && t[0].from == 0 && t[0].to >= e;
  }
  static get() {
    return wi;
  }
}
function ta(n, e, t) {
  return ft.applyChanges(n, [{ fromA: e, toA: t, fromB: e, toB: t }]);
}
class ci {
  constructor(e) {
    ((this.context = e), (this.tree = e.tree));
  }
  apply(e) {
    if (!e.docChanged && this.tree == this.context.tree) return this;
    let t = this.context.changes(e.changes, e.state),
      i =
        this.context.treeLen == e.startState.doc.length
          ? void 0
          : Math.max(e.changes.mapPos(this.context.treeLen), t.viewport.to);
    return (t.work(20, i) || t.takeTree(), new ci(t));
  }
  static init(e) {
    let t = Math.min(3e3, e.doc.length),
      i = hi.create(e.facet(Mt).parser, e, { from: 0, to: t });
    return (i.work(20, t) || i.takeTree(), new ci(i));
  }
}
Fe.state = ce.define({
  create: ci.init,
  update(n, e) {
    for (let t of e.effects) if (t.is(Fe.setState)) return t.value;
    return e.startState.facet(Mt) != e.state.facet(Mt)
      ? ci.init(e.state)
      : n.apply(e);
  },
});
let Sc = (n) => {
  let e = setTimeout(() => n(), 500);
  return () => clearTimeout(e);
};
typeof requestIdleCallback < "u" &&
  (Sc = (n) => {
    let e = -1,
      t = setTimeout(() => {
        e = requestIdleCallback(n, { timeout: 400 });
      }, 100);
    return () => (e < 0 ? clearTimeout(t) : cancelIdleCallback(e));
  });
const qs =
    typeof navigator < "u" &&
    !((_s = navigator.scheduling) === null || _s === void 0) &&
    _s.isInputPending
      ? () => navigator.scheduling.isInputPending()
      : null,
  Nm = ne.fromClass(
    class {
      constructor(e) {
        ((this.view = e),
          (this.working = null),
          (this.workScheduled = 0),
          (this.chunkEnd = -1),
          (this.chunkBudget = -1),
          (this.work = this.work.bind(this)),
          this.scheduleWork());
      }
      update(e) {
        let t = this.view.state.field(Fe.state).context;
        ((t.updateViewport(e.view.viewport) ||
          this.view.viewport.to > t.treeLen) &&
          this.scheduleWork(),
          (e.docChanged || e.selectionSet) &&
            (this.view.hasFocus && (this.chunkBudget += 50),
            this.scheduleWork()),
          this.checkAsyncSchedule(t));
      }
      scheduleWork() {
        if (this.working) return;
        let { state: e } = this.view,
          t = e.field(Fe.state);
        (t.tree != t.context.tree || !t.context.isDone(e.doc.length)) &&
          (this.working = Sc(this.work));
      }
      work(e) {
        this.working = null;
        let t = Date.now();
        if (
          (this.chunkEnd < t &&
            (this.chunkEnd < 0 || this.view.hasFocus) &&
            ((this.chunkEnd = t + 3e4), (this.chunkBudget = 3e3)),
          this.chunkBudget <= 0)
        )
          return;
        let {
            state: i,
            viewport: { to: s },
          } = this.view,
          r = i.field(Fe.state);
        if (r.tree == r.context.tree && r.context.isDone(s + 1e5)) return;
        let o =
            Date.now() +
            Math.min(
              this.chunkBudget,
              100,
              e && !qs ? Math.max(25, e.timeRemaining() - 5) : 1e9,
            ),
          l = r.context.treeLen < s && i.doc.length > s + 1e3,
          a = r.context.work(
            () => (qs && qs()) || Date.now() > o,
            s + (l ? 0 : 1e5),
          );
        ((this.chunkBudget -= Date.now() - t),
          (a || this.chunkBudget <= 0) &&
            (r.context.takeTree(),
            this.view.dispatch({ effects: Fe.setState.of(new ci(r.context)) })),
          this.chunkBudget > 0 && !(a && !l) && this.scheduleWork(),
          this.checkAsyncSchedule(r.context));
      }
      checkAsyncSchedule(e) {
        e.scheduleOn &&
          (this.workScheduled++,
          e.scheduleOn
            .then(() => this.scheduleWork())
            .catch((t) => De(this.view.state, t))
            .then(() => this.workScheduled--),
          (e.scheduleOn = null));
      }
      destroy() {
        this.working && this.working();
      }
      isWorking() {
        return !!(this.working || this.workScheduled > 0);
      }
    },
    {
      eventHandlers: {
        focus() {
          this.scheduleWork();
        },
      },
    },
  ),
  Mt = D.define({
    combine(n) {
      return n.length ? n[0] : null;
    },
    enables: (n) => [
      Fe.state,
      Nm,
      A.contentAttributes.compute([n], (e) => {
        let t = e.facet(n);
        return t && t.name ? { "data-language": t.name } : {};
      }),
    ],
  });
class o1 {
  constructor(e, t = []) {
    ((this.language = e), (this.support = t), (this.extension = [e, t]));
  }
}
class Cc {
  constructor(e, t, i, s, r, o = void 0) {
    ((this.name = e),
      (this.alias = t),
      (this.extensions = i),
      (this.filename = s),
      (this.loadFunc = r),
      (this.support = o),
      (this.loading = null));
  }
  load() {
    return (
      this.loading ||
      (this.loading = this.loadFunc().then(
        (e) => (this.support = e),
        (e) => {
          throw ((this.loading = null), e);
        },
      ))
    );
  }
  static of(e) {
    let { load: t, support: i } = e;
    if (!t) {
      if (!i)
        throw new RangeError(
          "Must pass either 'load' or 'support' to LanguageDescription.of",
        );
      t = () => Promise.resolve(i);
    }
    return new Cc(
      e.name,
      (e.alias || []).concat(e.name).map((s) => s.toLowerCase()),
      e.extensions || [],
      e.filename,
      t,
      i,
    );
  }
  static matchFilename(e, t) {
    for (let s of e) if (s.filename && s.filename.test(t)) return s;
    let i = /\.([^.]+)$/.exec(t);
    if (i) {
      for (let s of e) if (s.extensions.indexOf(i[1]) > -1) return s;
    }
    return null;
  }
  static matchLanguageName(e, t, i = !0) {
    t = t.toLowerCase();
    for (let s of e) if (s.alias.some((r) => r == t)) return s;
    if (i)
      for (let s of e)
        for (let r of s.alias) {
          let o = t.indexOf(r);
          if (
            o > -1 &&
            (r.length > 2 ||
              (!/\w/.test(t[o - 1]) && !/\w/.test(t[o + r.length])))
          )
            return s;
        }
    return null;
  }
}
const Wm = D.define(),
  sn = D.define({
    combine: (n) => {
      if (!n.length) return "  ";
      let e = n[0];
      if (!e || /\S/.test(e) || Array.from(e).some((t) => t != e[0]))
        throw new Error("Invalid indent unit: " + JSON.stringify(n[0]));
      return e;
    },
  });
function qt(n) {
  let e = n.facet(sn);
  return e.charCodeAt(0) == 9 ? n.tabSize * e.length : e.length;
}
function qi(n, e) {
  let t = "",
    i = n.tabSize,
    s = n.facet(sn)[0];
  if (s == "	") {
    for (; e >= i; ) ((t += "	"), (e -= i));
    s = " ";
  }
  for (let r = 0; r < e; r++) t += s;
  return t;
}
function wo(n, e) {
  n instanceof _ && (n = new bs(n));
  for (let i of n.state.facet(Wm)) {
    let s = i(n, e);
    if (s !== void 0) return s;
  }
  let t = ge(n.state);
  return t.length >= e ? Fm(n, t, e) : null;
}
class bs {
  constructor(e, t = {}) {
    ((this.state = e), (this.options = t), (this.unit = qt(e)));
  }
  lineAt(e, t = 1) {
    let i = this.state.doc.lineAt(e),
      { simulateBreak: s, simulateDoubleBreak: r } = this.options;
    return s != null && s >= i.from && s <= i.to
      ? r && s == e
        ? { text: "", from: e }
        : (t < 0 ? s < e : s <= e)
          ? { text: i.text.slice(s - i.from), from: s }
          : { text: i.text.slice(0, s - i.from), from: i.from }
      : i;
  }
  textAfterPos(e, t = 1) {
    if (this.options.simulateDoubleBreak && e == this.options.simulateBreak)
      return "";
    let { text: i, from: s } = this.lineAt(e, t);
    return i.slice(e - s, Math.min(i.length, e + 100 - s));
  }
  column(e, t = 1) {
    let { text: i, from: s } = this.lineAt(e, t),
      r = this.countColumn(i, e - s),
      o = this.options.overrideIndentation
        ? this.options.overrideIndentation(s)
        : -1;
    return (o > -1 && (r += o - this.countColumn(i, i.search(/\S|$/))), r);
  }
  countColumn(e, t = e.length) {
    return ui(e, this.state.tabSize, t);
  }
  lineIndent(e, t = 1) {
    let { text: i, from: s } = this.lineAt(e, t),
      r = this.options.overrideIndentation;
    if (r) {
      let o = r(s);
      if (o > -1) return o;
    }
    return this.countColumn(i, i.search(/\S|$/));
  }
  get simulatedBreak() {
    return this.options.simulateBreak || null;
  }
}
const Ac = new H();
function Fm(n, e, t) {
  let i = e.resolveStack(t),
    s = e.resolveInner(t, -1).resolve(t, 0).enterUnfinishedNodesBefore(t);
  if (s != i.node) {
    let r = [];
    for (
      let o = s;
      o &&
      !(
        o.from < i.node.from ||
        o.to > i.node.to ||
        (o.from == i.node.from && o.type == i.node.type)
      );
      o = o.parent
    )
      r.push(o);
    for (let o = r.length - 1; o >= 0; o--) i = { node: r[o], next: i };
  }
  return Mc(i, n, t);
}
function Mc(n, e, t) {
  for (let i = n; i; i = i.next) {
    let s = Vm(i.node);
    if (s) return s(vo.create(e, t, i));
  }
  return 0;
}
function Hm(n) {
  return n.pos == n.options.simulateBreak && n.options.simulateDoubleBreak;
}
function Vm(n) {
  let e = n.type.prop(Ac);
  if (e) return e;
  let t = n.firstChild,
    i;
  if (t && (i = t.type.prop(H.closedBy))) {
    let s = n.lastChild,
      r = s && i.indexOf(s.name) > -1;
    return (o) => Tc(o, !0, 1, void 0, r && !Hm(o) ? s.from : void 0);
  }
  return n.parent == null ? zm : null;
}
function zm() {
  return 0;
}
class vo extends bs {
  constructor(e, t, i) {
    (super(e.state, e.options),
      (this.base = e),
      (this.pos = t),
      (this.context = i));
  }
  get node() {
    return this.context.node;
  }
  static create(e, t, i) {
    return new vo(e, t, i);
  }
  get textAfter() {
    return this.textAfterPos(this.pos);
  }
  get baseIndent() {
    return this.baseIndentFor(this.node);
  }
  baseIndentFor(e) {
    let t = this.state.doc.lineAt(e.from);
    for (;;) {
      let i = e.resolve(t.from);
      for (; i.parent && i.parent.from == i.from; ) i = i.parent;
      if (_m(i, e)) break;
      t = this.state.doc.lineAt(i.from);
    }
    return this.lineIndent(t.from);
  }
  continue() {
    return Mc(this.context.next, this.base, this.pos);
  }
}
function _m(n, e) {
  for (let t = e; t; t = t.parent) if (n == t) return !0;
  return !1;
}
function qm(n) {
  let e = n.node,
    t = e.childAfter(e.from),
    i = e.lastChild;
  if (!t) return null;
  let s = n.options.simulateBreak,
    r = n.state.doc.lineAt(t.from),
    o = s == null || s <= r.from ? r.to : Math.min(r.to, s);
  for (let l = t.to; ; ) {
    let a = e.childAfter(l);
    if (!a || a == i) return null;
    if (!a.type.isSkipped) {
      if (a.from >= o) return null;
      let h = /^ */.exec(r.text.slice(t.to - r.from))[0].length;
      return { from: t.from, to: t.to + h };
    }
    l = a.to;
  }
}
function l1({ closing: n, align: e = !0, units: t = 1 }) {
  return (i) => Tc(i, e, t, n);
}
function Tc(n, e, t, i, s) {
  let r = n.textAfter,
    o = r.match(/^\s*/)[0].length,
    l = (i && r.slice(o, o + i.length) == i) || s == n.pos + o,
    a = e ? qm(n) : null;
  return a
    ? l
      ? n.column(a.from)
      : n.column(a.to)
    : n.baseIndent + (l ? 0 : n.unit * t);
}
const a1 = (n) => n.baseIndent;
function h1({ except: n, units: e = 1 } = {}) {
  return (t) => {
    let i = n && n.test(t.textAfter);
    return t.baseIndent + (i ? 0 : e * t.unit);
  };
}
const $m = 200;
function Km() {
  return _.transactionFilter.of((n) => {
    if (
      !n.docChanged ||
      (!n.isUserEvent("input.type") && !n.isUserEvent("input.complete"))
    )
      return n;
    let e = n.startState.languageDataAt(
      "indentOnInput",
      n.startState.selection.main.head,
    );
    if (!e.length) return n;
    let t = n.newDoc,
      { head: i } = n.newSelection.main,
      s = t.lineAt(i);
    if (i > s.from + $m) return n;
    let r = t.sliceString(s.from, i);
    if (!e.some((h) => h.test(r))) return n;
    let { state: o } = n,
      l = -1,
      a = [];
    for (let { head: h } of o.selection.ranges) {
      let c = o.doc.lineAt(h);
      if (c.from == l) continue;
      l = c.from;
      let f = wo(o, c.from);
      if (f == null) continue;
      let u = /^\s*/.exec(c.text)[0],
        d = qi(o, f);
      u != d && a.push({ from: c.from, to: c.from + u.length, insert: d });
    }
    return a.length ? [n, { changes: a, sequential: !0 }] : n;
  });
}
const jm = D.define(),
  Um = new H();
function c1(n) {
  let e = n.firstChild,
    t = n.lastChild;
  return e && e.to < t.from
    ? { from: e.to, to: t.type.isError ? n.to : t.from }
    : null;
}
function Gm(n, e, t) {
  let i = ge(n);
  if (i.length < t) return null;
  let s = i.resolveStack(t, 1),
    r = null;
  for (let o = s; o; o = o.next) {
    let l = o.node;
    if (l.to <= t || l.from > t) continue;
    if (r && l.from < e) break;
    let a = l.type.prop(Um);
    if (a && (l.to < i.length - 50 || i.length == n.doc.length || !Jm(l))) {
      let h = a(l, n);
      h && h.from <= t && h.from >= e && h.to > t && (r = h);
    }
  }
  return r;
}
function Jm(n) {
  let e = n.lastChild;
  return e && e.to == n.to && e.type.isError;
}
function ts(n, e, t) {
  for (let i of n.facet(jm)) {
    let s = i(n, e, t);
    if (s) return s;
  }
  return Gm(n, e, t);
}
function Dc(n, e) {
  let t = e.mapPos(n.from, 1),
    i = e.mapPos(n.to, -1);
  return t >= i ? void 0 : { from: t, to: i };
}
const xs = R.define({ map: Dc }),
  rn = R.define({ map: Dc });
function Oc(n) {
  let e = [];
  for (let { head: t } of n.state.selection.ranges)
    e.some((i) => i.from <= t && i.to >= t) || e.push(n.lineBlockAt(t));
  return e;
}
const $t = ce.define({
  create() {
    return L.none;
  },
  update(n, e) {
    (e.isUserEvent("delete") &&
      e.changes.iterChangedRanges((t, i) => (n = ia(n, t, i))),
      (n = n.map(e.changes)));
    for (let t of e.effects)
      if (t.is(xs) && !Ym(n, t.value.from, t.value.to)) {
        let { preparePlaceholder: i } = e.state.facet(Lc),
          s = i ? L.replace({ widget: new ng(i(e.state, t.value)) }) : na;
        n = n.update({ add: [s.range(t.value.from, t.value.to)] });
      } else
        t.is(rn) &&
          (n = n.update({
            filter: (i, s) => t.value.from != i || t.value.to != s,
            filterFrom: t.value.from,
            filterTo: t.value.to,
          }));
    return (e.selection && (n = ia(n, e.selection.main.head)), n);
  },
  provide: (n) => A.decorations.from(n),
  toJSON(n, e) {
    let t = [];
    return (
      n.between(0, e.doc.length, (i, s) => {
        t.push(i, s);
      }),
      t
    );
  },
  fromJSON(n) {
    if (!Array.isArray(n) || n.length % 2)
      throw new RangeError("Invalid JSON for fold state");
    let e = [];
    for (let t = 0; t < n.length; ) {
      let i = n[t++],
        s = n[t++];
      if (typeof i != "number" || typeof s != "number")
        throw new RangeError("Invalid JSON for fold state");
      e.push(na.range(i, s));
    }
    return L.set(e, !0);
  },
});
function ia(n, e, t = e) {
  let i = !1;
  return (
    n.between(e, t, (s, r) => {
      s < t && r > e && (i = !0);
    }),
    i
      ? n.update({
          filterFrom: e,
          filterTo: t,
          filter: (s, r) => s >= t || r <= e,
        })
      : n
  );
}
function is(n, e, t) {
  var i;
  let s = null;
  return (
    (i = n.field($t, !1)) === null ||
      i === void 0 ||
      i.between(e, t, (r, o) => {
        (!s || s.from > r) && (s = { from: r, to: o });
      }),
    s
  );
}
function Ym(n, e, t) {
  let i = !1;
  return (
    n.between(e, e, (s, r) => {
      s == e && r == t && (i = !0);
    }),
    i
  );
}
function Bc(n, e) {
  return n.field($t, !1) ? e : e.concat(R.appendConfig.of(Pc()));
}
const Xm = (n) => {
    for (let e of Oc(n)) {
      let t = ts(n.state, e.from, e.to);
      if (t)
        return (n.dispatch({ effects: Bc(n.state, [xs.of(t), Ec(n, t)]) }), !0);
    }
    return !1;
  },
  Qm = (n) => {
    if (!n.state.field($t, !1)) return !1;
    let e = [];
    for (let t of Oc(n)) {
      let i = is(n.state, t.from, t.to);
      i && e.push(rn.of(i), Ec(n, i, !1));
    }
    return (e.length && n.dispatch({ effects: e }), e.length > 0);
  };
function Ec(n, e, t = !0) {
  let i = n.state.doc.lineAt(e.from).number,
    s = n.state.doc.lineAt(e.to).number;
  return A.announce.of(
    `${n.state.phrase(t ? "Folded lines" : "Unfolded lines")} ${i} ${n.state.phrase("to")} ${s}.`,
  );
}
const Zm = (n) => {
    let { state: e } = n,
      t = [];
    for (let i = 0; i < e.doc.length; ) {
      let s = n.lineBlockAt(i),
        r = ts(e, s.from, s.to);
      (r && t.push(xs.of(r)), (i = (r ? n.lineBlockAt(r.to) : s).to + 1));
    }
    return (t.length && n.dispatch({ effects: Bc(n.state, t) }), !!t.length);
  },
  eg = (n) => {
    let e = n.state.field($t, !1);
    if (!e || !e.size) return !1;
    let t = [];
    return (
      e.between(0, n.state.doc.length, (i, s) => {
        t.push(rn.of({ from: i, to: s }));
      }),
      n.dispatch({ effects: t }),
      !0
    );
  },
  tg = [
    { key: "Ctrl-Shift-[", mac: "Cmd-Alt-[", run: Xm },
    { key: "Ctrl-Shift-]", mac: "Cmd-Alt-]", run: Qm },
    { key: "Ctrl-Alt-[", run: Zm },
    { key: "Ctrl-Alt-]", run: eg },
  ],
  ig = { placeholderDOM: null, preparePlaceholder: null, placeholderText: "…" },
  Lc = D.define({
    combine(n) {
      return at(n, ig);
    },
  });
function Pc(n) {
  return [$t, og];
}
function Rc(n, e) {
  let { state: t } = n,
    i = t.facet(Lc),
    s = (o) => {
      let l = n.lineBlockAt(n.posAtDOM(o.target)),
        a = is(n.state, l.from, l.to);
      (a && n.dispatch({ effects: rn.of(a) }), o.preventDefault());
    };
  if (i.placeholderDOM) return i.placeholderDOM(n, s, e);
  let r = document.createElement("span");
  return (
    (r.textContent = i.placeholderText),
    r.setAttribute("aria-label", t.phrase("folded code")),
    (r.title = t.phrase("unfold")),
    (r.className = "cm-foldPlaceholder"),
    (r.onclick = s),
    r
  );
}
const na = L.replace({
  widget: new (class extends Ke {
    toDOM(n) {
      return Rc(n, null);
    }
  })(),
});
class ng extends Ke {
  constructor(e) {
    (super(), (this.value = e));
  }
  eq(e) {
    return this.value == e.value;
  }
  toDOM(e) {
    return Rc(e, this.value);
  }
}
const sg = {
  openText: "⌄",
  closedText: "›",
  markerDOM: null,
  domEventHandlers: {},
  foldingChanged: () => !1,
};
class $s extends pt {
  constructor(e, t) {
    (super(), (this.config = e), (this.open = t));
  }
  eq(e) {
    return this.config == e.config && this.open == e.open;
  }
  toDOM(e) {
    if (this.config.markerDOM) return this.config.markerDOM(this.open);
    let t = document.createElement("span");
    return (
      (t.textContent = this.open
        ? this.config.openText
        : this.config.closedText),
      (t.title = e.state.phrase(this.open ? "Fold line" : "Unfold line")),
      t
    );
  }
}
function rg(n = {}) {
  let e = { ...sg, ...n },
    t = new $s(e, !0),
    i = new $s(e, !1),
    s = ne.fromClass(
      class {
        constructor(o) {
          ((this.from = o.viewport.from),
            (this.markers = this.buildMarkers(o)));
        }
        update(o) {
          (o.docChanged ||
            o.viewportChanged ||
            o.startState.facet(Mt) != o.state.facet(Mt) ||
            o.startState.field($t, !1) != o.state.field($t, !1) ||
            ge(o.startState) != ge(o.state) ||
            e.foldingChanged(o)) &&
            (this.markers = this.buildMarkers(o.view));
        }
        buildMarkers(o) {
          let l = new ut();
          for (let a of o.viewportLineBlocks) {
            let h = is(o.state, a.from, a.to)
              ? i
              : ts(o.state, a.from, a.to)
                ? t
                : null;
            h && l.add(a.from, a.from, h);
          }
          return l.finish();
        }
      },
    ),
    { domEventHandlers: r } = e;
  return [
    s,
    tm({
      class: "cm-foldGutter",
      markers(o) {
        var l;
        return (
          ((l = o.plugin(s)) === null || l === void 0 ? void 0 : l.markers) ||
          z.empty
        );
      },
      initialSpacer() {
        return new $s(e, !1);
      },
      domEventHandlers: {
        ...r,
        click: (o, l, a) => {
          if (r.click && r.click(o, l, a)) return !0;
          let h = is(o.state, l.from, l.to);
          if (h) return (o.dispatch({ effects: rn.of(h) }), !0);
          let c = ts(o.state, l.from, l.to);
          return c ? (o.dispatch({ effects: xs.of(c) }), !0) : !1;
        },
      },
    }),
    Pc(),
  ];
}
const og = A.baseTheme({
  ".cm-foldPlaceholder": {
    backgroundColor: "#eee",
    border: "1px solid #ddd",
    color: "#888",
    borderRadius: ".2em",
    margin: "0 1px",
    padding: "0 1px",
    cursor: "pointer",
  },
  ".cm-foldGutter span": { padding: "0 1px", cursor: "pointer" },
});
class di {
  constructor(e, t) {
    this.specs = e;
    let i;
    function s(l) {
      let a = kt.newName();
      return (((i || (i = Object.create(null)))["." + a] = l), a);
    }
    const r = typeof t.all == "string" ? t.all : t.all ? s(t.all) : void 0,
      o = t.scope;
    ((this.scope =
      o instanceof Fe
        ? (l) => l.prop(Wt) == o.data
        : o
          ? (l) => l == o
          : void 0),
      (this.style = vc(
        e.map((l) => ({
          tag: l.tag,
          class: l.class || s(Object.assign({}, l, { tag: null })),
        })),
        { all: r },
      ).style),
      (this.module = i ? new kt(i) : null),
      (this.themeType = t.themeType));
  }
  static define(e, t) {
    return new di(e, t || {});
  }
}
const Vr = D.define(),
  Ic = D.define({
    combine(n) {
      return n.length ? [n[0]] : null;
    },
  });
function Ks(n) {
  let e = n.facet(Vr);
  return e.length ? e : n.facet(Ic);
}
function ko(n, e) {
  let t = [ag],
    i;
  return (
    n instanceof di &&
      (n.module && t.push(A.styleModule.of(n.module)), (i = n.themeType)),
    e?.fallback
      ? t.push(Ic.of(n))
      : i
        ? t.push(
            Vr.computeN([A.darkTheme], (s) =>
              s.facet(A.darkTheme) == (i == "dark") ? [n] : [],
            ),
          )
        : t.push(Vr.of(n)),
    t
  );
}
class lg {
  constructor(e) {
    ((this.markCache = Object.create(null)),
      (this.tree = ge(e.state)),
      (this.decorations = this.buildDeco(e, Ks(e.state))),
      (this.decoratedTo = e.viewport.to));
  }
  update(e) {
    let t = ge(e.state),
      i = Ks(e.state),
      s = i != Ks(e.startState),
      { viewport: r } = e.view,
      o = e.changes.mapPos(this.decoratedTo, 1);
    t.length < r.to && !s && t.type == this.tree.type && o >= r.to
      ? ((this.decorations = this.decorations.map(e.changes)),
        (this.decoratedTo = o))
      : (t != this.tree || e.viewportChanged || s) &&
        ((this.tree = t),
        (this.decorations = this.buildDeco(e.view, i)),
        (this.decoratedTo = r.to));
  }
  buildDeco(e, t) {
    if (!t || !this.tree.length) return L.none;
    let i = new ut();
    for (let { from: s, to: r } of e.visibleRanges)
      Em(
        this.tree,
        t,
        (o, l, a) => {
          i.add(
            o,
            l,
            this.markCache[a] || (this.markCache[a] = L.mark({ class: a })),
          );
        },
        s,
        r,
      );
    return i.finish();
  }
}
const ag = Dt.high(ne.fromClass(lg, { decorations: (n) => n.decorations })),
  hg = di.define([
    { tag: y.meta, color: "#404740" },
    { tag: y.link, textDecoration: "underline" },
    { tag: y.heading, textDecoration: "underline", fontWeight: "bold" },
    { tag: y.emphasis, fontStyle: "italic" },
    { tag: y.strong, fontWeight: "bold" },
    { tag: y.strikethrough, textDecoration: "line-through" },
    { tag: y.keyword, color: "#708" },
    {
      tag: [y.atom, y.bool, y.url, y.contentSeparator, y.labelName],
      color: "#219",
    },
    { tag: [y.literal, y.inserted], color: "#164" },
    { tag: [y.string, y.deleted], color: "#a11" },
    { tag: [y.regexp, y.escape, y.special(y.string)], color: "#e40" },
    { tag: y.definition(y.variableName), color: "#00f" },
    { tag: y.local(y.variableName), color: "#30a" },
    { tag: [y.typeName, y.namespace], color: "#085" },
    { tag: y.className, color: "#167" },
    { tag: [y.special(y.variableName), y.macroName], color: "#256" },
    { tag: y.definition(y.propertyName), color: "#00c" },
    { tag: y.comment, color: "#940" },
    { tag: y.invalid, color: "#f00" },
  ]),
  cg = A.baseTheme({
    "&.cm-focused .cm-matchingBracket": { backgroundColor: "#328c8252" },
    "&.cm-focused .cm-nonmatchingBracket": { backgroundColor: "#bb555544" },
  }),
  Nc = 1e4,
  Wc = "()[]{}",
  Fc = D.define({
    combine(n) {
      return at(n, {
        afterCursor: !0,
        brackets: Wc,
        maxScanDistance: Nc,
        renderMatch: dg,
      });
    },
  }),
  fg = L.mark({ class: "cm-matchingBracket" }),
  ug = L.mark({ class: "cm-nonmatchingBracket" });
function dg(n) {
  let e = [],
    t = n.matched ? fg : ug;
  return (
    e.push(t.range(n.start.from, n.start.to)),
    n.end && e.push(t.range(n.end.from, n.end.to)),
    e
  );
}
function sa(n) {
  let e = [],
    t = n.facet(Fc);
  for (let i of n.selection.ranges) {
    if (!i.empty) continue;
    let s =
      st(n, i.head, -1, t) ||
      (i.head > 0 && st(n, i.head - 1, 1, t)) ||
      (t.afterCursor &&
        (st(n, i.head, 1, t) ||
          (i.head < n.doc.length && st(n, i.head + 1, -1, t))));
    s && (e = e.concat(t.renderMatch(s, n)));
  }
  return L.set(e, !0);
}
const pg = ne.fromClass(
    class {
      constructor(n) {
        ((this.paused = !1), (this.decorations = sa(n.state)));
      }
      update(n) {
        (n.docChanged || n.selectionSet || this.paused) &&
          (n.view.composing
            ? ((this.decorations = this.decorations.map(n.changes)),
              (this.paused = !0))
            : ((this.decorations = sa(n.state)), (this.paused = !1)));
      }
    },
    { decorations: (n) => n.decorations },
  ),
  mg = [pg, cg];
function gg(n = {}) {
  return [Fc.of(n), mg];
}
const yg = new H();
function zr(n, e, t) {
  let i = n.prop(e < 0 ? H.openedBy : H.closedBy);
  if (i) return i;
  if (n.name.length == 1) {
    let s = t.indexOf(n.name);
    if (s > -1 && s % 2 == (e < 0 ? 1 : 0)) return [t[s + e]];
  }
  return null;
}
function _r(n) {
  let e = n.type.prop(yg);
  return e ? e(n.node) : n;
}
function st(n, e, t, i = {}) {
  let s = i.maxScanDistance || Nc,
    r = i.brackets || Wc,
    o = ge(n),
    l = o.resolveInner(e, t);
  for (let a = l; a; a = a.parent) {
    let h = zr(a.type, t, r);
    if (h && a.from < a.to) {
      let c = _r(a);
      if (c && (t > 0 ? e >= c.from && e < c.to : e > c.from && e <= c.to))
        return bg(n, e, t, a, c, h, r);
    }
  }
  return xg(n, e, t, o, l.type, s, r);
}
function bg(n, e, t, i, s, r, o) {
  let l = i.parent,
    a = { from: s.from, to: s.to },
    h = 0,
    c = l?.cursor();
  if (c && (t < 0 ? c.childBefore(i.from) : c.childAfter(i.to)))
    do
      if (t < 0 ? c.to <= i.from : c.from >= i.to) {
        if (h == 0 && r.indexOf(c.type.name) > -1 && c.from < c.to) {
          let f = _r(c);
          return {
            start: a,
            end: f ? { from: f.from, to: f.to } : void 0,
            matched: !0,
          };
        } else if (zr(c.type, t, o)) h++;
        else if (zr(c.type, -t, o)) {
          if (h == 0) {
            let f = _r(c);
            return {
              start: a,
              end: f && f.from < f.to ? { from: f.from, to: f.to } : void 0,
              matched: !1,
            };
          }
          h--;
        }
      }
    while (t < 0 ? c.prevSibling() : c.nextSibling());
  return { start: a, matched: !1 };
}
function xg(n, e, t, i, s, r, o) {
  let l = t < 0 ? n.sliceDoc(e - 1, e) : n.sliceDoc(e, e + 1),
    a = o.indexOf(l);
  if (a < 0 || (a % 2 == 0) != t > 0) return null;
  let h = { from: t < 0 ? e - 1 : e, to: t > 0 ? e + 1 : e },
    c = n.doc.iterRange(e, t > 0 ? n.doc.length : 0),
    f = 0;
  for (let u = 0; !c.next().done && u <= r; ) {
    let d = c.value;
    t < 0 && (u += d.length);
    let p = e + u * t;
    for (
      let m = t > 0 ? 0 : d.length - 1, g = t > 0 ? d.length : -1;
      m != g;
      m += t
    ) {
      let b = o.indexOf(d[m]);
      if (!(b < 0 || i.resolveInner(p + m, 1).type != s))
        if ((b % 2 == 0) == t > 0) f++;
        else {
          if (f == 1)
            return {
              start: h,
              end: { from: p + m, to: p + m + 1 },
              matched: b >> 1 == a >> 1,
            };
          f--;
        }
    }
    t > 0 && (u += d.length);
  }
  return c.done ? { start: h, matched: !1 } : null;
}
function ra(n, e, t, i = 0, s = 0) {
  e == null && ((e = n.search(/[^\s\u00a0]/)), e == -1 && (e = n.length));
  let r = s;
  for (let o = i; o < e; o++) n.charCodeAt(o) == 9 ? (r += t - (r % t)) : r++;
  return r;
}
class Hc {
  constructor(e, t, i, s) {
    ((this.string = e),
      (this.tabSize = t),
      (this.indentUnit = i),
      (this.overrideIndent = s),
      (this.pos = 0),
      (this.start = 0),
      (this.lastColumnPos = 0),
      (this.lastColumnValue = 0));
  }
  eol() {
    return this.pos >= this.string.length;
  }
  sol() {
    return this.pos == 0;
  }
  peek() {
    return this.string.charAt(this.pos) || void 0;
  }
  next() {
    if (this.pos < this.string.length) return this.string.charAt(this.pos++);
  }
  eat(e) {
    let t = this.string.charAt(this.pos),
      i;
    if (
      (typeof e == "string"
        ? (i = t == e)
        : (i = t && (e instanceof RegExp ? e.test(t) : e(t))),
      i)
    )
      return (++this.pos, t);
  }
  eatWhile(e) {
    let t = this.pos;
    for (; this.eat(e); );
    return this.pos > t;
  }
  eatSpace() {
    let e = this.pos;
    for (; /[\s\u00a0]/.test(this.string.charAt(this.pos)); ) ++this.pos;
    return this.pos > e;
  }
  skipToEnd() {
    this.pos = this.string.length;
  }
  skipTo(e) {
    let t = this.string.indexOf(e, this.pos);
    if (t > -1) return ((this.pos = t), !0);
  }
  backUp(e) {
    this.pos -= e;
  }
  column() {
    return (
      this.lastColumnPos < this.start &&
        ((this.lastColumnValue = ra(
          this.string,
          this.start,
          this.tabSize,
          this.lastColumnPos,
          this.lastColumnValue,
        )),
        (this.lastColumnPos = this.start)),
      this.lastColumnValue
    );
  }
  indentation() {
    var e;
    return (e = this.overrideIndent) !== null && e !== void 0
      ? e
      : ra(this.string, null, this.tabSize);
  }
  match(e, t, i) {
    if (typeof e == "string") {
      let s = (o) => (i ? o.toLowerCase() : o),
        r = this.string.substr(this.pos, e.length);
      return s(r) == s(e) ? (t !== !1 && (this.pos += e.length), !0) : null;
    } else {
      let s = this.string.slice(this.pos).match(e);
      return s && s.index > 0
        ? null
        : (s && t !== !1 && (this.pos += s[0].length), s);
    }
  }
  current() {
    return this.string.slice(this.start, this.pos);
  }
}
function wg(n) {
  return {
    name: n.name || "",
    token: n.token,
    blankLine: n.blankLine || (() => {}),
    startState: n.startState || (() => !0),
    copyState: n.copyState || vg,
    indent: n.indent || (() => null),
    languageData: n.languageData || {},
    tokenTable: n.tokenTable || Co,
    mergeTokens: n.mergeTokens !== !1,
  };
}
function vg(n) {
  if (typeof n != "object") return n;
  let e = {};
  for (let t in n) {
    let i = n[t];
    e[t] = i instanceof Array ? i.slice() : i;
  }
  return e;
}
const oa = new WeakMap();
class Re extends Fe {
  constructor(e) {
    let t = kc(e.languageData),
      i = wg(e),
      s,
      r = new (class extends xc {
        createParse(o, l, a) {
          return new Sg(s, o, l, a);
        }
      })();
    (super(t, r, [], e.name),
      (this.topNode = Mg(t, this)),
      (s = this),
      (this.streamParser = i),
      (this.stateAfter = new H({ perNode: !0 })),
      (this.tokenTable = e.tokenTable ? new qc(i.tokenTable) : Ag));
  }
  static define(e) {
    return new Re(e);
  }
  getIndent(e) {
    let t,
      { overrideIndentation: i } = e.options;
    i && ((t = oa.get(e.state)), t != null && t < e.pos - 1e4 && (t = void 0));
    let s = So(this, e.node.tree, e.node.from, e.node.from, t ?? e.pos),
      r,
      o;
    if (
      (s
        ? ((o = s.state), (r = s.pos + 1))
        : ((o = this.streamParser.startState(e.unit)), (r = e.node.from)),
      e.pos - r > 1e4)
    )
      return null;
    for (; r < e.pos; ) {
      let a = e.state.doc.lineAt(r),
        h = Math.min(e.pos, a.to);
      if (a.length) {
        let c = i ? i(a.from) : -1,
          f = new Hc(a.text, e.state.tabSize, e.unit, c < 0 ? void 0 : c);
        for (; f.pos < h - a.from; ) zc(this.streamParser.token, f, o);
      } else this.streamParser.blankLine(o, e.unit);
      if (h == e.pos) break;
      r = a.to + 1;
    }
    let l = e.lineAt(e.pos);
    return (
      i && t == null && oa.set(e.state, l.from),
      this.streamParser.indent(o, /^\s*(.*)/.exec(l.text)[1], e)
    );
  }
  get allowsNesting() {
    return !1;
  }
}
function So(n, e, t, i, s) {
  let r = t >= i && t + e.length <= s && e.prop(n.stateAfter);
  if (r) return { state: n.streamParser.copyState(r), pos: t + e.length };
  for (let o = e.children.length - 1; o >= 0; o--) {
    let l = e.children[o],
      a = t + e.positions[o],
      h = l instanceof J && a < s && So(n, l, a, i, s);
    if (h) return h;
  }
  return null;
}
function Vc(n, e, t, i, s) {
  if (s && t <= 0 && i >= e.length) return e;
  !s && t == 0 && e.type == n.topNode && (s = !0);
  for (let r = e.children.length - 1; r >= 0; r--) {
    let o = e.positions[r],
      l = e.children[r],
      a;
    if (o < i && l instanceof J) {
      if (!(a = Vc(n, l, t - o, i - o, s))) break;
      return s
        ? new J(
            e.type,
            e.children.slice(0, r).concat(a),
            e.positions.slice(0, r + 1),
            o + a.length,
          )
        : a;
    }
  }
  return null;
}
function kg(n, e, t, i, s) {
  for (let r of e) {
    let o = r.from + (r.openStart ? 25 : 0),
      l = r.to - (r.openEnd ? 25 : 0),
      a = o <= t && l > t && So(n, r.tree, 0 - r.offset, t, l),
      h;
    if (
      a &&
      a.pos <= i &&
      (h = Vc(n, r.tree, t + r.offset, a.pos + r.offset, !1))
    )
      return { state: a.state, tree: h };
  }
  return { state: n.streamParser.startState(s ? qt(s) : 4), tree: J.empty };
}
class Sg {
  constructor(e, t, i, s) {
    ((this.lang = e),
      (this.input = t),
      (this.fragments = i),
      (this.ranges = s),
      (this.stoppedAt = null),
      (this.chunks = []),
      (this.chunkPos = []),
      (this.chunk = []),
      (this.chunkReused = void 0),
      (this.rangeIndex = 0),
      (this.to = s[s.length - 1].to));
    let r = hi.get(),
      o = s[0].from,
      { state: l, tree: a } = kg(e, i, o, this.to, r?.state);
    ((this.state = l), (this.parsedPos = this.chunkStart = o + a.length));
    for (let h = 0; h < a.children.length; h++)
      (this.chunks.push(a.children[h]), this.chunkPos.push(a.positions[h]));
    (r &&
      this.parsedPos < r.viewport.from - 1e5 &&
      s.some((h) => h.from <= r.viewport.from && h.to >= r.viewport.from) &&
      ((this.state = this.lang.streamParser.startState(qt(r.state))),
      r.skipUntilInView(this.parsedPos, r.viewport.from),
      (this.parsedPos = r.viewport.from)),
      this.moveRangeIndex());
  }
  advance() {
    let e = hi.get(),
      t = this.stoppedAt == null ? this.to : Math.min(this.to, this.stoppedAt),
      i = Math.min(t, this.chunkStart + 512);
    for (e && (i = Math.min(i, e.viewport.to)); this.parsedPos < i; )
      this.parseLine(e);
    return (
      this.chunkStart < this.parsedPos && this.finishChunk(),
      this.parsedPos >= t
        ? this.finish()
        : e && this.parsedPos >= e.viewport.to
          ? (e.skipUntilInView(this.parsedPos, t), this.finish())
          : null
    );
  }
  stopAt(e) {
    this.stoppedAt = e;
  }
  lineAfter(e) {
    let t = this.input.chunk(e);
    if (this.input.lineChunks)
      t ==
        `
` && (t = "");
    else {
      let i = t.indexOf(`
`);
      i > -1 && (t = t.slice(0, i));
    }
    return e + t.length <= this.to ? t : t.slice(0, this.to - e);
  }
  nextLine() {
    let e = this.parsedPos,
      t = this.lineAfter(e),
      i = e + t.length;
    for (let s = this.rangeIndex; ; ) {
      let r = this.ranges[s].to;
      if (
        r >= i ||
        ((t = t.slice(0, r - (i - t.length))), s++, s == this.ranges.length)
      )
        break;
      let o = this.ranges[s].from,
        l = this.lineAfter(o);
      ((t += l), (i = o + l.length));
    }
    return { line: t, end: i };
  }
  skipGapsTo(e, t, i) {
    for (;;) {
      let s = this.ranges[this.rangeIndex].to,
        r = e + t;
      if (i > 0 ? s > r : s >= r) break;
      let o = this.ranges[++this.rangeIndex].from;
      t += o - s;
    }
    return t;
  }
  moveRangeIndex() {
    for (; this.ranges[this.rangeIndex].to < this.parsedPos; )
      this.rangeIndex++;
  }
  emitToken(e, t, i, s) {
    let r = 4;
    if (this.ranges.length > 1) {
      ((s = this.skipGapsTo(t, s, 1)), (t += s));
      let l = this.chunk.length;
      ((s = this.skipGapsTo(i, s, -1)), (i += s), (r += this.chunk.length - l));
    }
    let o = this.chunk.length - 4;
    return (
      this.lang.streamParser.mergeTokens &&
      r == 4 &&
      o >= 0 &&
      this.chunk[o] == e &&
      this.chunk[o + 2] == t
        ? (this.chunk[o + 2] = i)
        : this.chunk.push(e, t, i, r),
      s
    );
  }
  parseLine(e) {
    let { line: t, end: i } = this.nextLine(),
      s = 0,
      { streamParser: r } = this.lang,
      o = new Hc(t, e ? e.state.tabSize : 4, e ? qt(e.state) : 2);
    if (o.eol()) r.blankLine(this.state, o.indentUnit);
    else
      for (; !o.eol(); ) {
        let l = zc(r.token, o, this.state);
        if (
          (l &&
            (s = this.emitToken(
              this.lang.tokenTable.resolve(l),
              this.parsedPos + o.start,
              this.parsedPos + o.pos,
              s,
            )),
          o.start > 1e4)
        )
          break;
      }
    ((this.parsedPos = i),
      this.moveRangeIndex(),
      this.parsedPos < this.to && this.parsedPos++);
  }
  finishChunk() {
    let e = J.build({
      buffer: this.chunk,
      start: this.chunkStart,
      length: this.parsedPos - this.chunkStart,
      nodeSet: Cg,
      topID: 0,
      maxBufferLength: 512,
      reused: this.chunkReused,
    });
    ((e = new J(e.type, e.children, e.positions, e.length, [
      [this.lang.stateAfter, this.lang.streamParser.copyState(this.state)],
    ])),
      this.chunks.push(e),
      this.chunkPos.push(this.chunkStart - this.ranges[0].from),
      (this.chunk = []),
      (this.chunkReused = void 0),
      (this.chunkStart = this.parsedPos));
  }
  finish() {
    return new J(
      this.lang.topNode,
      this.chunks,
      this.chunkPos,
      this.parsedPos - this.ranges[0].from,
    ).balance();
  }
}
function zc(n, e, t) {
  e.start = e.pos;
  for (let i = 0; i < 10; i++) {
    let s = n(e, t);
    if (e.pos > e.start) return s;
  }
  throw new Error("Stream parser failed to advance stream.");
}
const Co = Object.create(null),
  $i = [Ce.none],
  Cg = new go($i),
  la = [],
  aa = Object.create(null),
  _c = Object.create(null);
for (let [n, e] of [
  ["variable", "variableName"],
  ["variable-2", "variableName.special"],
  ["string-2", "string.special"],
  ["def", "variableName.definition"],
  ["tag", "tagName"],
  ["attribute", "attributeName"],
  ["type", "typeName"],
  ["builtin", "variableName.standard"],
  ["qualifier", "modifier"],
  ["error", "invalid"],
  ["header", "heading"],
  ["property", "propertyName"],
])
  _c[n] = $c(Co, e);
class qc {
  constructor(e) {
    ((this.extra = e), (this.table = Object.assign(Object.create(null), _c)));
  }
  resolve(e) {
    return e ? this.table[e] || (this.table[e] = $c(this.extra, e)) : 0;
  }
}
const Ag = new qc(Co);
function js(n, e) {
  la.indexOf(n) > -1 || (la.push(n), console.warn(e));
}
function $c(n, e) {
  let t = [];
  for (let l of e.split(" ")) {
    let a = [];
    for (let h of l.split(".")) {
      let c = n[h] || y[h];
      c
        ? typeof c == "function"
          ? a.length
            ? (a = a.map(c))
            : js(h, `Modifier ${h} used at start of tag`)
          : a.length
            ? js(h, `Tag ${h} used as modifier`)
            : (a = Array.isArray(c) ? c : [c])
        : js(h, `Unknown highlighting tag ${h}`);
    }
    for (let h of a) t.push(h);
  }
  if (!t.length) return 0;
  let i = e.replace(/ /g, "_"),
    s = i + " " + t.map((l) => l.id),
    r = aa[s];
  if (r) return r.id;
  let o = (aa[s] = Ce.define({
    id: $i.length,
    name: i,
    props: [Om({ [i]: t })],
  }));
  return ($i.push(o), o.id);
}
function Mg(n, e) {
  let t = Ce.define({
    id: $i.length,
    name: "Document",
    props: [Wt.add(() => n), Ac.add(() => (i) => e.getIndent(i))],
    top: !0,
  });
  return ($i.push(t), t);
}
(G.RTL, G.LTR);
const Tg = (n) => {
  let { state: e } = n,
    t = e.doc.lineAt(e.selection.main.from),
    i = Mo(n.state, t.from);
  return i.line ? Dg(n) : i.block ? Bg(n) : !1;
};
function Ao(n, e) {
  return ({ state: t, dispatch: i }) => {
    if (t.readOnly) return !1;
    let s = n(e, t);
    return s ? (i(t.update(s)), !0) : !1;
  };
}
const Dg = Ao(Pg, 0),
  Og = Ao(Kc, 0),
  Bg = Ao((n, e) => Kc(n, e, Lg(e)), 0);
function Mo(n, e) {
  let t = n.languageDataAt("commentTokens", e, 1);
  return t.length ? t[0] : {};
}
const vi = 50;
function Eg(n, { open: e, close: t }, i, s) {
  let r = n.sliceDoc(i - vi, i),
    o = n.sliceDoc(s, s + vi),
    l = /\s*$/.exec(r)[0].length,
    a = /^\s*/.exec(o)[0].length,
    h = r.length - l;
  if (r.slice(h - e.length, h) == e && o.slice(a, a + t.length) == t)
    return {
      open: { pos: i - l, margin: l && 1 },
      close: { pos: s + a, margin: a && 1 },
    };
  let c, f;
  s - i <= 2 * vi
    ? (c = f = n.sliceDoc(i, s))
    : ((c = n.sliceDoc(i, i + vi)), (f = n.sliceDoc(s - vi, s)));
  let u = /^\s*/.exec(c)[0].length,
    d = /\s*$/.exec(f)[0].length,
    p = f.length - d - t.length;
  return c.slice(u, u + e.length) == e && f.slice(p, p + t.length) == t
    ? {
        open: {
          pos: i + u + e.length,
          margin: /\s/.test(c.charAt(u + e.length)) ? 1 : 0,
        },
        close: {
          pos: s - d - t.length,
          margin: /\s/.test(f.charAt(p - 1)) ? 1 : 0,
        },
      }
    : null;
}
function Lg(n) {
  let e = [];
  for (let t of n.selection.ranges) {
    let i = n.doc.lineAt(t.from),
      s = t.to <= i.to ? i : n.doc.lineAt(t.to);
    s.from > i.from &&
      s.from == t.to &&
      (s = t.to == i.to + 1 ? i : n.doc.lineAt(t.to - 1));
    let r = e.length - 1;
    r >= 0 && e[r].to > i.from
      ? (e[r].to = s.to)
      : e.push({ from: i.from + /^\s*/.exec(i.text)[0].length, to: s.to });
  }
  return e;
}
function Kc(n, e, t = e.selection.ranges) {
  let i = t.map((r) => Mo(e, r.from).block);
  if (!i.every((r) => r)) return null;
  let s = t.map((r, o) => Eg(e, i[o], r.from, r.to));
  if (n != 2 && !s.every((r) => r))
    return {
      changes: e.changes(
        t.map((r, o) =>
          s[o]
            ? []
            : [
                { from: r.from, insert: i[o].open + " " },
                { from: r.to, insert: " " + i[o].close },
              ],
        ),
      ),
    };
  if (n != 1 && s.some((r) => r)) {
    let r = [];
    for (let o = 0, l; o < s.length; o++)
      if ((l = s[o])) {
        let a = i[o],
          { open: h, close: c } = l;
        r.push(
          { from: h.pos - a.open.length, to: h.pos + h.margin },
          { from: c.pos - c.margin, to: c.pos + a.close.length },
        );
      }
    return { changes: r };
  }
  return null;
}
function Pg(n, e, t = e.selection.ranges) {
  let i = [],
    s = -1;
  e: for (let { from: r, to: o } of t) {
    let l = i.length,
      a = 1e9,
      h;
    for (let c = r; c <= o; ) {
      let f = e.doc.lineAt(c);
      if (h == null && ((h = Mo(e, f.from).line), !h)) continue e;
      if (f.from > s && (r == o || o > f.from)) {
        s = f.from;
        let u = /^\s*/.exec(f.text)[0].length,
          d = u == f.length,
          p = f.text.slice(u, u + h.length) == h ? u : -1;
        (u < f.text.length && u < a && (a = u),
          i.push({
            line: f,
            comment: p,
            token: h,
            indent: u,
            empty: d,
            single: !1,
          }));
      }
      c = f.to + 1;
    }
    if (a < 1e9)
      for (let c = l; c < i.length; c++)
        i[c].indent < i[c].line.text.length && (i[c].indent = a);
    i.length == l + 1 && (i[l].single = !0);
  }
  if (n != 2 && i.some((r) => r.comment < 0 && (!r.empty || r.single))) {
    let r = [];
    for (let { line: l, token: a, indent: h, empty: c, single: f } of i)
      (f || !c) && r.push({ from: l.from + h, insert: a + " " });
    let o = e.changes(r);
    return { changes: o, selection: e.selection.map(o, 1) };
  } else if (n != 1 && i.some((r) => r.comment >= 0)) {
    let r = [];
    for (let { line: o, comment: l, token: a } of i)
      if (l >= 0) {
        let h = o.from + l,
          c = h + a.length;
        (o.text[c - o.from] == " " && c++, r.push({ from: h, to: c }));
      }
    return { changes: r };
  }
  return null;
}
const qr = lt.define(),
  Rg = lt.define(),
  Ig = D.define(),
  jc = D.define({
    combine(n) {
      return at(
        n,
        { minDepth: 100, newGroupDelay: 500, joinToEvent: (e, t) => t },
        {
          minDepth: Math.max,
          newGroupDelay: Math.min,
          joinToEvent: (e, t) => (i, s) => e(i, s) || t(i, s),
        },
      );
    },
  }),
  Uc = ce.define({
    create() {
      return rt.empty;
    },
    update(n, e) {
      let t = e.state.facet(jc),
        i = e.annotation(qr);
      if (i) {
        let a = Oe.fromTransaction(e, i.selection),
          h = i.side,
          c = h == 0 ? n.undone : n.done;
        return (
          a
            ? (c = ns(c, c.length, t.minDepth, a))
            : (c = Yc(c, e.startState.selection)),
          new rt(h == 0 ? i.rest : c, h == 0 ? c : i.rest)
        );
      }
      let s = e.annotation(Rg);
      if (
        ((s == "full" || s == "before") && (n = n.isolate()),
        e.annotation(oe.addToHistory) === !1)
      )
        return e.changes.empty ? n : n.addMapping(e.changes.desc);
      let r = Oe.fromTransaction(e),
        o = e.annotation(oe.time),
        l = e.annotation(oe.userEvent);
      return (
        r
          ? (n = n.addChanges(r, o, l, t, e))
          : e.selection &&
            (n = n.addSelection(e.startState.selection, o, l, t.newGroupDelay)),
        (s == "full" || s == "after") && (n = n.isolate()),
        n
      );
    },
    toJSON(n) {
      return {
        done: n.done.map((e) => e.toJSON()),
        undone: n.undone.map((e) => e.toJSON()),
      };
    },
    fromJSON(n) {
      return new rt(n.done.map(Oe.fromJSON), n.undone.map(Oe.fromJSON));
    },
  });
function Ng(n = {}) {
  return [
    Uc,
    jc.of(n),
    A.domEventHandlers({
      beforeinput(e, t) {
        let i =
          e.inputType == "historyUndo"
            ? Gc
            : e.inputType == "historyRedo"
              ? $r
              : null;
        return i ? (e.preventDefault(), i(t)) : !1;
      },
    }),
  ];
}
function ws(n, e) {
  return function ({ state: t, dispatch: i }) {
    if (!e && t.readOnly) return !1;
    let s = t.field(Uc, !1);
    if (!s) return !1;
    let r = s.pop(n, t, e);
    return r ? (i(r), !0) : !1;
  };
}
const Gc = ws(0, !1),
  $r = ws(1, !1),
  Wg = ws(0, !0),
  Fg = ws(1, !0);
class Oe {
  constructor(e, t, i, s, r) {
    ((this.changes = e),
      (this.effects = t),
      (this.mapped = i),
      (this.startSelection = s),
      (this.selectionsAfter = r));
  }
  setSelAfter(e) {
    return new Oe(
      this.changes,
      this.effects,
      this.mapped,
      this.startSelection,
      e,
    );
  }
  toJSON() {
    var e, t, i;
    return {
      changes:
        (e = this.changes) === null || e === void 0 ? void 0 : e.toJSON(),
      mapped: (t = this.mapped) === null || t === void 0 ? void 0 : t.toJSON(),
      startSelection:
        (i = this.startSelection) === null || i === void 0
          ? void 0
          : i.toJSON(),
      selectionsAfter: this.selectionsAfter.map((s) => s.toJSON()),
    };
  }
  static fromJSON(e) {
    return new Oe(
      e.changes && le.fromJSON(e.changes),
      [],
      e.mapped && ot.fromJSON(e.mapped),
      e.startSelection && x.fromJSON(e.startSelection),
      e.selectionsAfter.map(x.fromJSON),
    );
  }
  static fromTransaction(e, t) {
    let i = He;
    for (let s of e.startState.facet(Ig)) {
      let r = s(e);
      r.length && (i = i.concat(r));
    }
    return !i.length && e.changes.empty
      ? null
      : new Oe(
          e.changes.invert(e.startState.doc),
          i,
          void 0,
          t || e.startState.selection,
          He,
        );
  }
  static selection(e) {
    return new Oe(void 0, He, void 0, void 0, e);
  }
}
function ns(n, e, t, i) {
  let s = e + 1 > t + 20 ? e - t - 1 : 0,
    r = n.slice(s, e);
  return (r.push(i), r);
}
function Hg(n, e) {
  let t = [],
    i = !1;
  return (
    n.iterChangedRanges((s, r) => t.push(s, r)),
    e.iterChangedRanges((s, r, o, l) => {
      for (let a = 0; a < t.length; ) {
        let h = t[a++],
          c = t[a++];
        l >= h && o <= c && (i = !0);
      }
    }),
    i
  );
}
function Vg(n, e) {
  return (
    n.ranges.length == e.ranges.length &&
    n.ranges.filter((t, i) => t.empty != e.ranges[i].empty).length === 0
  );
}
function Jc(n, e) {
  return n.length ? (e.length ? n.concat(e) : n) : e;
}
const He = [],
  zg = 200;
function Yc(n, e) {
  if (n.length) {
    let t = n[n.length - 1],
      i = t.selectionsAfter.slice(Math.max(0, t.selectionsAfter.length - zg));
    return i.length && i[i.length - 1].eq(e)
      ? n
      : (i.push(e), ns(n, n.length - 1, 1e9, t.setSelAfter(i)));
  } else return [Oe.selection([e])];
}
function _g(n) {
  let e = n[n.length - 1],
    t = n.slice();
  return (
    (t[n.length - 1] = e.setSelAfter(
      e.selectionsAfter.slice(0, e.selectionsAfter.length - 1),
    )),
    t
  );
}
function Us(n, e) {
  if (!n.length) return n;
  let t = n.length,
    i = He;
  for (; t; ) {
    let s = qg(n[t - 1], e, i);
    if ((s.changes && !s.changes.empty) || s.effects.length) {
      let r = n.slice(0, t);
      return ((r[t - 1] = s), r);
    } else ((e = s.mapped), t--, (i = s.selectionsAfter));
  }
  return i.length ? [Oe.selection(i)] : He;
}
function qg(n, e, t) {
  let i = Jc(
    n.selectionsAfter.length ? n.selectionsAfter.map((l) => l.map(e)) : He,
    t,
  );
  if (!n.changes) return Oe.selection(i);
  let s = n.changes.map(e),
    r = e.mapDesc(n.changes, !0),
    o = n.mapped ? n.mapped.composeDesc(r) : r;
  return new Oe(s, R.mapEffects(n.effects, e), o, n.startSelection.map(r), i);
}
const $g = /^(input\.type|delete)($|\.)/;
class rt {
  constructor(e, t, i = 0, s = void 0) {
    ((this.done = e),
      (this.undone = t),
      (this.prevTime = i),
      (this.prevUserEvent = s));
  }
  isolate() {
    return this.prevTime ? new rt(this.done, this.undone) : this;
  }
  addChanges(e, t, i, s, r) {
    let o = this.done,
      l = o[o.length - 1];
    return (
      l &&
      l.changes &&
      !l.changes.empty &&
      e.changes &&
      (!i || $g.test(i)) &&
      ((!l.selectionsAfter.length &&
        t - this.prevTime < s.newGroupDelay &&
        s.joinToEvent(r, Hg(l.changes, e.changes))) ||
        i == "input.type.compose")
        ? (o = ns(
            o,
            o.length - 1,
            s.minDepth,
            new Oe(
              e.changes.compose(l.changes),
              Jc(R.mapEffects(e.effects, l.changes), l.effects),
              l.mapped,
              l.startSelection,
              He,
            ),
          ))
        : (o = ns(o, o.length, s.minDepth, e)),
      new rt(o, He, t, i)
    );
  }
  addSelection(e, t, i, s) {
    let r = this.done.length
      ? this.done[this.done.length - 1].selectionsAfter
      : He;
    return r.length > 0 &&
      t - this.prevTime < s &&
      i == this.prevUserEvent &&
      i &&
      /^select($|\.)/.test(i) &&
      Vg(r[r.length - 1], e)
      ? this
      : new rt(Yc(this.done, e), this.undone, t, i);
  }
  addMapping(e) {
    return new rt(
      Us(this.done, e),
      Us(this.undone, e),
      this.prevTime,
      this.prevUserEvent,
    );
  }
  pop(e, t, i) {
    let s = e == 0 ? this.done : this.undone;
    if (s.length == 0) return null;
    let r = s[s.length - 1],
      o =
        r.selectionsAfter[0] ||
        (r.startSelection
          ? r.startSelection.map(r.changes.invertedDesc, 1)
          : t.selection);
    if (i && r.selectionsAfter.length)
      return t.update({
        selection: r.selectionsAfter[r.selectionsAfter.length - 1],
        annotations: qr.of({ side: e, rest: _g(s), selection: o }),
        userEvent: e == 0 ? "select.undo" : "select.redo",
        scrollIntoView: !0,
      });
    if (r.changes) {
      let l = s.length == 1 ? He : s.slice(0, s.length - 1);
      return (
        r.mapped && (l = Us(l, r.mapped)),
        t.update({
          changes: r.changes,
          selection: r.startSelection,
          effects: r.effects,
          annotations: qr.of({ side: e, rest: l, selection: o }),
          filter: !1,
          userEvent: e == 0 ? "undo" : "redo",
          scrollIntoView: !0,
        })
      );
    } else return null;
  }
}
rt.empty = new rt(He, He);
const Kg = [
  { key: "Mod-z", run: Gc, preventDefault: !0 },
  { key: "Mod-y", mac: "Mod-Shift-z", run: $r, preventDefault: !0 },
  { linux: "Ctrl-Shift-z", run: $r, preventDefault: !0 },
  { key: "Mod-u", run: Wg, preventDefault: !0 },
  { key: "Alt-u", mac: "Mod-Shift-u", run: Fg, preventDefault: !0 },
];
function pi(n, e) {
  return x.create(n.ranges.map(e), n.mainIndex);
}
function je(n, e) {
  return n.update({ selection: e, scrollIntoView: !0, userEvent: "select" });
}
function Ue({ state: n, dispatch: e }, t) {
  let i = pi(n.selection, t);
  return i.eq(n.selection, !0) ? !1 : (e(je(n, i)), !0);
}
function vs(n, e) {
  return x.cursor(e ? n.to : n.from);
}
function Xc(n, e) {
  return Ue(n, (t) => (t.empty ? n.moveByChar(t, e) : vs(t, e)));
}
function ve(n) {
  return n.textDirectionAt(n.state.selection.main.head) == G.LTR;
}
const Qc = (n) => Xc(n, !ve(n)),
  Zc = (n) => Xc(n, ve(n));
function ef(n, e) {
  return Ue(n, (t) => (t.empty ? n.moveByGroup(t, e) : vs(t, e)));
}
const jg = (n) => ef(n, !ve(n)),
  Ug = (n) => ef(n, ve(n));
function Gg(n, e, t) {
  if (e.type.prop(t)) return !0;
  let i = e.to - e.from;
  return (
    (i && (i > 2 || /[^\s,.;:]/.test(n.sliceDoc(e.from, e.to)))) || e.firstChild
  );
}
function ks(n, e, t) {
  let i = ge(n).resolveInner(e.head),
    s = t ? H.closedBy : H.openedBy;
  for (let a = e.head; ; ) {
    let h = t ? i.childAfter(a) : i.childBefore(a);
    if (!h) break;
    Gg(n, h, s) ? (i = h) : (a = t ? h.to : h.from);
  }
  let r = i.type.prop(s),
    o,
    l;
  return (
    r && (o = t ? st(n, i.from, 1) : st(n, i.to, -1)) && o.matched
      ? (l = t ? o.end.to : o.end.from)
      : (l = t ? i.to : i.from),
    x.cursor(l, t ? -1 : 1)
  );
}
const Jg = (n) => Ue(n, (e) => ks(n.state, e, !ve(n))),
  Yg = (n) => Ue(n, (e) => ks(n.state, e, ve(n)));
function tf(n, e) {
  return Ue(n, (t) => {
    if (!t.empty) return vs(t, e);
    let i = n.moveVertically(t, e);
    return i.head != t.head ? i : n.moveToLineBoundary(t, e);
  });
}
const nf = (n) => tf(n, !1),
  sf = (n) => tf(n, !0);
function rf(n) {
  let e = n.scrollDOM.clientHeight < n.scrollDOM.scrollHeight - 2,
    t = 0,
    i = 0,
    s;
  if (e) {
    for (let r of n.state.facet(A.scrollMargins)) {
      let o = r(n);
      (o?.top && (t = Math.max(o?.top, t)),
        o?.bottom && (i = Math.max(o?.bottom, i)));
    }
    s = n.scrollDOM.clientHeight - t - i;
  } else s = (n.dom.ownerDocument.defaultView || window).innerHeight;
  return {
    marginTop: t,
    marginBottom: i,
    selfScroll: e,
    height: Math.max(n.defaultLineHeight, s - 5),
  };
}
function of(n, e) {
  let t = rf(n),
    { state: i } = n,
    s = pi(i.selection, (o) =>
      o.empty ? n.moveVertically(o, e, t.height) : vs(o, e),
    );
  if (s.eq(i.selection)) return !1;
  let r;
  if (t.selfScroll) {
    let o = n.coordsAtPos(i.selection.main.head),
      l = n.scrollDOM.getBoundingClientRect(),
      a = l.top + t.marginTop,
      h = l.bottom - t.marginBottom;
    o &&
      o.top > a &&
      o.bottom < h &&
      (r = A.scrollIntoView(s.main.head, { y: "start", yMargin: o.top - a }));
  }
  return (n.dispatch(je(i, s), { effects: r }), !0);
}
const ha = (n) => of(n, !1),
  Kr = (n) => of(n, !0);
function Ot(n, e, t) {
  let i = n.lineBlockAt(e.head),
    s = n.moveToLineBoundary(e, t);
  if (
    (s.head == e.head &&
      s.head != (t ? i.to : i.from) &&
      (s = n.moveToLineBoundary(e, t, !1)),
    !t && s.head == i.from && i.length)
  ) {
    let r = /^\s*/.exec(
      n.state.sliceDoc(i.from, Math.min(i.from + 100, i.to)),
    )[0].length;
    r && e.head != i.from + r && (s = x.cursor(i.from + r));
  }
  return s;
}
const Xg = (n) => Ue(n, (e) => Ot(n, e, !0)),
  Qg = (n) => Ue(n, (e) => Ot(n, e, !1)),
  Zg = (n) => Ue(n, (e) => Ot(n, e, !ve(n))),
  e0 = (n) => Ue(n, (e) => Ot(n, e, ve(n))),
  t0 = (n) => Ue(n, (e) => x.cursor(n.lineBlockAt(e.head).from, 1)),
  i0 = (n) => Ue(n, (e) => x.cursor(n.lineBlockAt(e.head).to, -1));
function n0(n, e, t) {
  let i = !1,
    s = pi(n.selection, (r) => {
      let o =
        st(n, r.head, -1) ||
        st(n, r.head, 1) ||
        (r.head > 0 && st(n, r.head - 1, 1)) ||
        (r.head < n.doc.length && st(n, r.head + 1, -1));
      if (!o || !o.end) return r;
      i = !0;
      let l = o.start.from == r.head ? o.end.to : o.end.from;
      return x.cursor(l);
    });
  return i ? (e(je(n, s)), !0) : !1;
}
const s0 = ({ state: n, dispatch: e }) => n0(n, e);
function ze(n, e) {
  let t = pi(n.state.selection, (i) => {
    let s = e(i);
    return x.range(i.anchor, s.head, s.goalColumn, s.bidiLevel || void 0);
  });
  return t.eq(n.state.selection) ? !1 : (n.dispatch(je(n.state, t)), !0);
}
function lf(n, e) {
  return ze(n, (t) => n.moveByChar(t, e));
}
const af = (n) => lf(n, !ve(n)),
  hf = (n) => lf(n, ve(n));
function cf(n, e) {
  return ze(n, (t) => n.moveByGroup(t, e));
}
const r0 = (n) => cf(n, !ve(n)),
  o0 = (n) => cf(n, ve(n)),
  l0 = (n) => ze(n, (e) => ks(n.state, e, !ve(n))),
  a0 = (n) => ze(n, (e) => ks(n.state, e, ve(n)));
function ff(n, e) {
  return ze(n, (t) => n.moveVertically(t, e));
}
const uf = (n) => ff(n, !1),
  df = (n) => ff(n, !0);
function pf(n, e) {
  return ze(n, (t) => n.moveVertically(t, e, rf(n).height));
}
const ca = (n) => pf(n, !1),
  fa = (n) => pf(n, !0),
  h0 = (n) => ze(n, (e) => Ot(n, e, !0)),
  c0 = (n) => ze(n, (e) => Ot(n, e, !1)),
  f0 = (n) => ze(n, (e) => Ot(n, e, !ve(n))),
  u0 = (n) => ze(n, (e) => Ot(n, e, ve(n))),
  d0 = (n) => ze(n, (e) => x.cursor(n.lineBlockAt(e.head).from)),
  p0 = (n) => ze(n, (e) => x.cursor(n.lineBlockAt(e.head).to)),
  ua = ({ state: n, dispatch: e }) => (e(je(n, { anchor: 0 })), !0),
  da = ({ state: n, dispatch: e }) => (e(je(n, { anchor: n.doc.length })), !0),
  pa = ({ state: n, dispatch: e }) => (
    e(je(n, { anchor: n.selection.main.anchor, head: 0 })),
    !0
  ),
  ma = ({ state: n, dispatch: e }) => (
    e(je(n, { anchor: n.selection.main.anchor, head: n.doc.length })),
    !0
  ),
  m0 = ({ state: n, dispatch: e }) => (
    e(
      n.update({
        selection: { anchor: 0, head: n.doc.length },
        userEvent: "select",
      }),
    ),
    !0
  ),
  g0 = ({ state: n, dispatch: e }) => {
    let t = Ss(n).map(({ from: i, to: s }) =>
      x.range(i, Math.min(s + 1, n.doc.length)),
    );
    return (e(n.update({ selection: x.create(t), userEvent: "select" })), !0);
  },
  y0 = ({ state: n, dispatch: e }) => {
    let t = pi(n.selection, (i) => {
      let s = ge(n),
        r = s.resolveStack(i.from, 1);
      if (i.empty) {
        let o = s.resolveStack(i.from, -1);
        o.node.from >= r.node.from && o.node.to <= r.node.to && (r = o);
      }
      for (let o = r; o; o = o.next) {
        let { node: l } = o;
        if (
          ((l.from < i.from && l.to >= i.to) ||
            (l.to > i.to && l.from <= i.from)) &&
          o.next
        )
          return x.range(l.to, l.from);
      }
      return i;
    });
    return t.eq(n.selection) ? !1 : (e(je(n, t)), !0);
  };
function mf(n, e) {
  let { state: t } = n,
    i = t.selection,
    s = t.selection.ranges.slice();
  for (let r of t.selection.ranges) {
    let o = t.doc.lineAt(r.head);
    if (e ? o.to < n.state.doc.length : o.from > 0)
      for (let l = r; ; ) {
        let a = n.moveVertically(l, e);
        if (a.head < o.from || a.head > o.to) {
          s.some((h) => h.head == a.head) || s.push(a);
          break;
        } else {
          if (a.head == l.head) break;
          l = a;
        }
      }
  }
  return s.length == i.ranges.length
    ? !1
    : (n.dispatch(je(t, x.create(s, s.length - 1))), !0);
}
const b0 = (n) => mf(n, !1),
  x0 = (n) => mf(n, !0),
  w0 = ({ state: n, dispatch: e }) => {
    let t = n.selection,
      i = null;
    return (
      t.ranges.length > 1
        ? (i = x.create([t.main]))
        : t.main.empty || (i = x.create([x.cursor(t.main.head)])),
      i ? (e(je(n, i)), !0) : !1
    );
  };
function on(n, e) {
  if (n.state.readOnly) return !1;
  let t = "delete.selection",
    { state: i } = n,
    s = i.changeByRange((r) => {
      let { from: o, to: l } = r;
      if (o == l) {
        let a = e(r);
        (a < o
          ? ((t = "delete.backward"), (a = Dn(n, a, !1)))
          : a > o && ((t = "delete.forward"), (a = Dn(n, a, !0))),
          (o = Math.min(o, a)),
          (l = Math.max(l, a)));
      } else ((o = Dn(n, o, !1)), (l = Dn(n, l, !0)));
      return o == l
        ? { range: r }
        : {
            changes: { from: o, to: l },
            range: x.cursor(o, o < r.head ? -1 : 1),
          };
    });
  return s.changes.empty
    ? !1
    : (n.dispatch(
        i.update(s, {
          scrollIntoView: !0,
          userEvent: t,
          effects:
            t == "delete.selection"
              ? A.announce.of(i.phrase("Selection deleted"))
              : void 0,
        }),
      ),
      !0);
}
function Dn(n, e, t) {
  if (n instanceof A)
    for (let i of n.state.facet(A.atomicRanges).map((s) => s(n)))
      i.between(e, e, (s, r) => {
        s < e && r > e && (e = t ? r : s);
      });
  return e;
}
const gf = (n, e, t) =>
    on(n, (i) => {
      let s = i.from,
        { state: r } = n,
        o = r.doc.lineAt(s),
        l,
        a;
      if (
        t &&
        !e &&
        s > o.from &&
        s < o.from + 200 &&
        !/[^ \t]/.test((l = o.text.slice(0, s - o.from)))
      ) {
        if (l[l.length - 1] == "	") return s - 1;
        let h = ui(l, r.tabSize),
          c = h % qt(r) || qt(r);
        for (let f = 0; f < c && l[l.length - 1 - f] == " "; f++) s--;
        a = s;
      } else
        ((a = he(o.text, s - o.from, e, e) + o.from),
          a == s && o.number != (e ? r.doc.lines : 1)
            ? (a += e ? 1 : -1)
            : !e &&
              /[\ufe00-\ufe0f]/.test(o.text.slice(a - o.from, s - o.from)) &&
              (a = he(o.text, a - o.from, !1, !1) + o.from));
      return a;
    }),
  jr = (n) => gf(n, !1, !0),
  yf = (n) => gf(n, !0, !1),
  bf = (n, e) =>
    on(n, (t) => {
      let i = t.head,
        { state: s } = n,
        r = s.doc.lineAt(i),
        o = s.charCategorizer(i);
      for (let l = null; ; ) {
        if (i == (e ? r.to : r.from)) {
          i == t.head && r.number != (e ? s.doc.lines : 1) && (i += e ? 1 : -1);
          break;
        }
        let a = he(r.text, i - r.from, e) + r.from,
          h = r.text.slice(Math.min(i, a) - r.from, Math.max(i, a) - r.from),
          c = o(h);
        if (l != null && c != l) break;
        ((h != " " || i != t.head) && (l = c), (i = a));
      }
      return i;
    }),
  xf = (n) => bf(n, !1),
  v0 = (n) => bf(n, !0),
  k0 = (n) =>
    on(n, (e) => {
      let t = n.lineBlockAt(e.head).to;
      return e.head < t ? t : Math.min(n.state.doc.length, e.head + 1);
    }),
  S0 = (n) =>
    on(n, (e) => {
      let t = n.moveToLineBoundary(e, !1).head;
      return e.head > t ? t : Math.max(0, e.head - 1);
    }),
  C0 = (n) =>
    on(n, (e) => {
      let t = n.moveToLineBoundary(e, !0).head;
      return e.head < t ? t : Math.min(n.state.doc.length, e.head + 1);
    }),
  A0 = ({ state: n, dispatch: e }) => {
    if (n.readOnly) return !1;
    let t = n.changeByRange((i) => ({
      changes: { from: i.from, to: i.to, insert: q.of(["", ""]) },
      range: x.cursor(i.from),
    }));
    return (e(n.update(t, { scrollIntoView: !0, userEvent: "input" })), !0);
  },
  M0 = ({ state: n, dispatch: e }) => {
    if (n.readOnly) return !1;
    let t = n.changeByRange((i) => {
      if (!i.empty || i.from == 0 || i.from == n.doc.length)
        return { range: i };
      let s = i.from,
        r = n.doc.lineAt(s),
        o = s == r.from ? s - 1 : he(r.text, s - r.from, !1) + r.from,
        l = s == r.to ? s + 1 : he(r.text, s - r.from, !0) + r.from;
      return {
        changes: {
          from: o,
          to: l,
          insert: n.doc.slice(s, l).append(n.doc.slice(o, s)),
        },
        range: x.cursor(l),
      };
    });
    return t.changes.empty
      ? !1
      : (e(n.update(t, { scrollIntoView: !0, userEvent: "move.character" })),
        !0);
  };
function Ss(n) {
  let e = [],
    t = -1;
  for (let i of n.selection.ranges) {
    let s = n.doc.lineAt(i.from),
      r = n.doc.lineAt(i.to);
    if (
      (!i.empty && i.to == r.from && (r = n.doc.lineAt(i.to - 1)),
      t >= s.number)
    ) {
      let o = e[e.length - 1];
      ((o.to = r.to), o.ranges.push(i));
    } else e.push({ from: s.from, to: r.to, ranges: [i] });
    t = r.number + 1;
  }
  return e;
}
function wf(n, e, t) {
  if (n.readOnly) return !1;
  let i = [],
    s = [];
  for (let r of Ss(n)) {
    if (t ? r.to == n.doc.length : r.from == 0) continue;
    let o = n.doc.lineAt(t ? r.to + 1 : r.from - 1),
      l = o.length + 1;
    if (t) {
      i.push(
        { from: r.to, to: o.to },
        { from: r.from, insert: o.text + n.lineBreak },
      );
      for (let a of r.ranges)
        s.push(
          x.range(
            Math.min(n.doc.length, a.anchor + l),
            Math.min(n.doc.length, a.head + l),
          ),
        );
    } else {
      i.push(
        { from: o.from, to: r.from },
        { from: r.to, insert: n.lineBreak + o.text },
      );
      for (let a of r.ranges) s.push(x.range(a.anchor - l, a.head - l));
    }
  }
  return i.length
    ? (e(
        n.update({
          changes: i,
          scrollIntoView: !0,
          selection: x.create(s, n.selection.mainIndex),
          userEvent: "move.line",
        }),
      ),
      !0)
    : !1;
}
const T0 = ({ state: n, dispatch: e }) => wf(n, e, !1),
  D0 = ({ state: n, dispatch: e }) => wf(n, e, !0);
function vf(n, e, t) {
  if (n.readOnly) return !1;
  let i = [];
  for (let r of Ss(n))
    t
      ? i.push({
          from: r.from,
          insert: n.doc.slice(r.from, r.to) + n.lineBreak,
        })
      : i.push({ from: r.to, insert: n.lineBreak + n.doc.slice(r.from, r.to) });
  let s = n.changes(i);
  return (
    e(
      n.update({
        changes: s,
        selection: n.selection.map(s, t ? 1 : -1),
        scrollIntoView: !0,
        userEvent: "input.copyline",
      }),
    ),
    !0
  );
}
const O0 = ({ state: n, dispatch: e }) => vf(n, e, !1),
  B0 = ({ state: n, dispatch: e }) => vf(n, e, !0),
  E0 = (n) => {
    if (n.state.readOnly) return !1;
    let { state: e } = n,
      t = e.changes(
        Ss(e).map(
          ({ from: s, to: r }) => (
            s > 0 ? s-- : r < e.doc.length && r++,
            { from: s, to: r }
          ),
        ),
      ),
      i = pi(e.selection, (s) => {
        let r;
        if (n.lineWrapping) {
          let o = n.lineBlockAt(s.head),
            l = n.coordsAtPos(s.head, s.assoc || 1);
          l &&
            (r = o.bottom + n.documentTop - l.bottom + n.defaultLineHeight / 2);
        }
        return n.moveVertically(s, !0, r);
      }).map(t);
    return (
      n.dispatch({
        changes: t,
        selection: i,
        scrollIntoView: !0,
        userEvent: "delete.line",
      }),
      !0
    );
  };
function L0(n, e) {
  if (/\(\)|\[\]|\{\}/.test(n.sliceDoc(e - 1, e + 1)))
    return { from: e, to: e };
  let t = ge(n).resolveInner(e),
    i = t.childBefore(e),
    s = t.childAfter(e),
    r;
  return i &&
    s &&
    i.to <= e &&
    s.from >= e &&
    (r = i.type.prop(H.closedBy)) &&
    r.indexOf(s.name) > -1 &&
    n.doc.lineAt(i.to).from == n.doc.lineAt(s.from).from &&
    !/\S/.test(n.sliceDoc(i.to, s.from))
    ? { from: i.to, to: s.from }
    : null;
}
const ga = kf(!1),
  P0 = kf(!0);
function kf(n) {
  return ({ state: e, dispatch: t }) => {
    if (e.readOnly) return !1;
    let i = e.changeByRange((s) => {
      let { from: r, to: o } = s,
        l = e.doc.lineAt(r),
        a = !n && r == o && L0(e, r);
      n && (r = o = (o <= l.to ? l : e.doc.lineAt(o)).to);
      let h = new bs(e, { simulateBreak: r, simulateDoubleBreak: !!a }),
        c = wo(h, r);
      for (
        c == null && (c = ui(/^\s*/.exec(e.doc.lineAt(r).text)[0], e.tabSize));
        o < l.to && /\s/.test(l.text[o - l.from]);
      )
        o++;
      a
        ? ({ from: r, to: o } = a)
        : r > l.from &&
          r < l.from + 100 &&
          !/\S/.test(l.text.slice(0, r)) &&
          (r = l.from);
      let f = ["", qi(e, c)];
      return (
        a && f.push(qi(e, h.lineIndent(l.from, -1))),
        {
          changes: { from: r, to: o, insert: q.of(f) },
          range: x.cursor(r + 1 + f[1].length),
        }
      );
    });
    return (t(e.update(i, { scrollIntoView: !0, userEvent: "input" })), !0);
  };
}
function To(n, e) {
  let t = -1;
  return n.changeByRange((i) => {
    let s = [];
    for (let o = i.from; o <= i.to; ) {
      let l = n.doc.lineAt(o);
      (l.number > t &&
        (i.empty || i.to > l.from) &&
        (e(l, s, i), (t = l.number)),
        (o = l.to + 1));
    }
    let r = n.changes(s);
    return {
      changes: s,
      range: x.range(r.mapPos(i.anchor, 1), r.mapPos(i.head, 1)),
    };
  });
}
const R0 = ({ state: n, dispatch: e }) => {
    if (n.readOnly) return !1;
    let t = Object.create(null),
      i = new bs(n, {
        overrideIndentation: (r) => {
          let o = t[r];
          return o ?? -1;
        },
      }),
      s = To(n, (r, o, l) => {
        let a = wo(i, r.from);
        if (a == null) return;
        /\S/.test(r.text) || (a = 0);
        let h = /^\s*/.exec(r.text)[0],
          c = qi(n, a);
        (h != c || l.from < r.from + h.length) &&
          ((t[r.from] = a),
          o.push({ from: r.from, to: r.from + h.length, insert: c }));
      });
    return (s.changes.empty || e(n.update(s, { userEvent: "indent" })), !0);
  },
  Sf = ({ state: n, dispatch: e }) =>
    n.readOnly
      ? !1
      : (e(
          n.update(
            To(n, (t, i) => {
              i.push({ from: t.from, insert: n.facet(sn) });
            }),
            { userEvent: "input.indent" },
          ),
        ),
        !0),
  Cf = ({ state: n, dispatch: e }) =>
    n.readOnly
      ? !1
      : (e(
          n.update(
            To(n, (t, i) => {
              let s = /^\s*/.exec(t.text)[0];
              if (!s) return;
              let r = ui(s, n.tabSize),
                o = 0,
                l = qi(n, Math.max(0, r - qt(n)));
              for (
                ;
                o < s.length &&
                o < l.length &&
                s.charCodeAt(o) == l.charCodeAt(o);
              )
                o++;
              i.push({
                from: t.from + o,
                to: t.from + s.length,
                insert: l.slice(o),
              });
            }),
            { userEvent: "delete.dedent" },
          ),
        ),
        !0),
  I0 = (n) => (n.setTabFocusMode(), !0),
  N0 = [
    { key: "Ctrl-b", run: Qc, shift: af, preventDefault: !0 },
    { key: "Ctrl-f", run: Zc, shift: hf },
    { key: "Ctrl-p", run: nf, shift: uf },
    { key: "Ctrl-n", run: sf, shift: df },
    { key: "Ctrl-a", run: t0, shift: d0 },
    { key: "Ctrl-e", run: i0, shift: p0 },
    { key: "Ctrl-d", run: yf },
    { key: "Ctrl-h", run: jr },
    { key: "Ctrl-k", run: k0 },
    { key: "Ctrl-Alt-h", run: xf },
    { key: "Ctrl-o", run: A0 },
    { key: "Ctrl-t", run: M0 },
    { key: "Ctrl-v", run: Kr },
  ],
  W0 = [
    { key: "ArrowLeft", run: Qc, shift: af, preventDefault: !0 },
    {
      key: "Mod-ArrowLeft",
      mac: "Alt-ArrowLeft",
      run: jg,
      shift: r0,
      preventDefault: !0,
    },
    { mac: "Cmd-ArrowLeft", run: Zg, shift: f0, preventDefault: !0 },
    { key: "ArrowRight", run: Zc, shift: hf, preventDefault: !0 },
    {
      key: "Mod-ArrowRight",
      mac: "Alt-ArrowRight",
      run: Ug,
      shift: o0,
      preventDefault: !0,
    },
    { mac: "Cmd-ArrowRight", run: e0, shift: u0, preventDefault: !0 },
    { key: "ArrowUp", run: nf, shift: uf, preventDefault: !0 },
    { mac: "Cmd-ArrowUp", run: ua, shift: pa },
    { mac: "Ctrl-ArrowUp", run: ha, shift: ca },
    { key: "ArrowDown", run: sf, shift: df, preventDefault: !0 },
    { mac: "Cmd-ArrowDown", run: da, shift: ma },
    { mac: "Ctrl-ArrowDown", run: Kr, shift: fa },
    { key: "PageUp", run: ha, shift: ca },
    { key: "PageDown", run: Kr, shift: fa },
    { key: "Home", run: Qg, shift: c0, preventDefault: !0 },
    { key: "Mod-Home", run: ua, shift: pa },
    { key: "End", run: Xg, shift: h0, preventDefault: !0 },
    { key: "Mod-End", run: da, shift: ma },
    { key: "Enter", run: ga, shift: ga },
    { key: "Mod-a", run: m0 },
    { key: "Backspace", run: jr, shift: jr, preventDefault: !0 },
    { key: "Delete", run: yf, preventDefault: !0 },
    { key: "Mod-Backspace", mac: "Alt-Backspace", run: xf, preventDefault: !0 },
    { key: "Mod-Delete", mac: "Alt-Delete", run: v0, preventDefault: !0 },
    { mac: "Mod-Backspace", run: S0, preventDefault: !0 },
    { mac: "Mod-Delete", run: C0, preventDefault: !0 },
  ].concat(N0.map((n) => ({ mac: n.key, run: n.run, shift: n.shift }))),
  F0 = [
    { key: "Alt-ArrowLeft", mac: "Ctrl-ArrowLeft", run: Jg, shift: l0 },
    { key: "Alt-ArrowRight", mac: "Ctrl-ArrowRight", run: Yg, shift: a0 },
    { key: "Alt-ArrowUp", run: T0 },
    { key: "Shift-Alt-ArrowUp", run: O0 },
    { key: "Alt-ArrowDown", run: D0 },
    { key: "Shift-Alt-ArrowDown", run: B0 },
    { key: "Mod-Alt-ArrowUp", run: b0 },
    { key: "Mod-Alt-ArrowDown", run: x0 },
    { key: "Escape", run: w0 },
    { key: "Mod-Enter", run: P0 },
    { key: "Alt-l", mac: "Ctrl-l", run: g0 },
    { key: "Mod-i", run: y0, preventDefault: !0 },
    { key: "Mod-[", run: Cf },
    { key: "Mod-]", run: Sf },
    { key: "Mod-Alt-\\", run: R0 },
    { key: "Shift-Mod-k", run: E0 },
    { key: "Shift-Mod-\\", run: s0 },
    { key: "Mod-/", run: Tg },
    { key: "Alt-A", run: Og },
    { key: "Ctrl-m", mac: "Shift-Alt-m", run: I0 },
  ].concat(W0),
  H0 = { key: "Tab", run: Sf, shift: Cf },
  ya =
    typeof String.prototype.normalize == "function"
      ? (n) => n.normalize("NFKD")
      : (n) => n;
class fi {
  constructor(e, t, i = 0, s = e.length, r, o) {
    ((this.test = o),
      (this.value = { from: 0, to: 0 }),
      (this.done = !1),
      (this.matches = []),
      (this.buffer = ""),
      (this.bufferPos = 0),
      (this.iter = e.iterRange(i, s)),
      (this.bufferStart = i),
      (this.normalize = r ? (l) => r(ya(l)) : ya),
      (this.query = this.normalize(t)));
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      if (
        ((this.bufferStart += this.buffer.length),
        this.iter.next(),
        this.iter.done)
      )
        return -1;
      ((this.bufferPos = 0), (this.buffer = this.iter.value));
    }
    return Ae(this.buffer, this.bufferPos);
  }
  next() {
    for (; this.matches.length; ) this.matches.pop();
    return this.nextOverlapping();
  }
  nextOverlapping() {
    for (;;) {
      let e = this.peek();
      if (e < 0) return ((this.done = !0), this);
      let t = Yr(e),
        i = this.bufferStart + this.bufferPos;
      this.bufferPos += et(e);
      let s = this.normalize(t);
      if (s.length)
        for (let r = 0, o = i; ; r++) {
          let l = s.charCodeAt(r),
            a = this.match(l, o, this.bufferPos + this.bufferStart);
          if (r == s.length - 1) {
            if (a) return ((this.value = a), this);
            break;
          }
          o == i && r < t.length && t.charCodeAt(r) == l && o++;
        }
    }
  }
  match(e, t, i) {
    let s = null;
    for (let r = 0; r < this.matches.length; r += 2) {
      let o = this.matches[r],
        l = !1;
      (this.query.charCodeAt(o) == e &&
        (o == this.query.length - 1
          ? (s = { from: this.matches[r + 1], to: i })
          : (this.matches[r]++, (l = !0))),
        l || (this.matches.splice(r, 2), (r -= 2)));
    }
    return (
      this.query.charCodeAt(0) == e &&
        (this.query.length == 1
          ? (s = { from: t, to: i })
          : this.matches.push(1, t)),
      s &&
        this.test &&
        !this.test(s.from, s.to, this.buffer, this.bufferStart) &&
        (s = null),
      s
    );
  }
}
typeof Symbol < "u" &&
  (fi.prototype[Symbol.iterator] = function () {
    return this;
  });
const Af = { from: -1, to: -1, match: /.*/.exec("") },
  Do = "gm" + (/x/.unicode == null ? "" : "u");
class Mf {
  constructor(e, t, i, s = 0, r = e.length) {
    if (
      ((this.text = e),
      (this.to = r),
      (this.curLine = ""),
      (this.done = !1),
      (this.value = Af),
      /\\[sWDnr]|\n|\r|\[\^/.test(t))
    )
      return new Tf(e, t, i, s, r);
    ((this.re = new RegExp(t, Do + (i?.ignoreCase ? "i" : ""))),
      (this.test = i?.test),
      (this.iter = e.iter()));
    let o = e.lineAt(s);
    ((this.curLineStart = o.from),
      (this.matchPos = ss(e, s)),
      this.getLine(this.curLineStart));
  }
  getLine(e) {
    (this.iter.next(e),
      this.iter.lineBreak
        ? (this.curLine = "")
        : ((this.curLine = this.iter.value),
          this.curLineStart + this.curLine.length > this.to &&
            (this.curLine = this.curLine.slice(0, this.to - this.curLineStart)),
          this.iter.next()));
  }
  nextLine() {
    ((this.curLineStart = this.curLineStart + this.curLine.length + 1),
      this.curLineStart > this.to ? (this.curLine = "") : this.getLine(0));
  }
  next() {
    for (let e = this.matchPos - this.curLineStart; ; ) {
      this.re.lastIndex = e;
      let t = this.matchPos <= this.to && this.re.exec(this.curLine);
      if (t) {
        let i = this.curLineStart + t.index,
          s = i + t[0].length;
        if (
          ((this.matchPos = ss(this.text, s + (i == s ? 1 : 0))),
          i == this.curLineStart + this.curLine.length && this.nextLine(),
          (i < s || i > this.value.to) && (!this.test || this.test(i, s, t)))
        )
          return ((this.value = { from: i, to: s, match: t }), this);
        e = this.matchPos - this.curLineStart;
      } else if (this.curLineStart + this.curLine.length < this.to)
        (this.nextLine(), (e = 0));
      else return ((this.done = !0), this);
    }
  }
}
const Gs = new WeakMap();
class ni {
  constructor(e, t) {
    ((this.from = e), (this.text = t));
  }
  get to() {
    return this.from + this.text.length;
  }
  static get(e, t, i) {
    let s = Gs.get(e);
    if (!s || s.from >= i || s.to <= t) {
      let l = new ni(t, e.sliceString(t, i));
      return (Gs.set(e, l), l);
    }
    if (s.from == t && s.to == i) return s;
    let { text: r, from: o } = s;
    return (
      o > t && ((r = e.sliceString(t, o) + r), (o = t)),
      s.to < i && (r += e.sliceString(s.to, i)),
      Gs.set(e, new ni(o, r)),
      new ni(t, r.slice(t - o, i - o))
    );
  }
}
class Tf {
  constructor(e, t, i, s, r) {
    ((this.text = e),
      (this.to = r),
      (this.done = !1),
      (this.value = Af),
      (this.matchPos = ss(e, s)),
      (this.re = new RegExp(t, Do + (i?.ignoreCase ? "i" : ""))),
      (this.test = i?.test),
      (this.flat = ni.get(e, s, this.chunkEnd(s + 5e3))));
  }
  chunkEnd(e) {
    return e >= this.to ? this.to : this.text.lineAt(e).to;
  }
  next() {
    for (;;) {
      let e = (this.re.lastIndex = this.matchPos - this.flat.from),
        t = this.re.exec(this.flat.text);
      if (
        (t &&
          !t[0] &&
          t.index == e &&
          ((this.re.lastIndex = e + 1), (t = this.re.exec(this.flat.text))),
        t)
      ) {
        let i = this.flat.from + t.index,
          s = i + t[0].length;
        if (
          (this.flat.to >= this.to ||
            t.index + t[0].length <= this.flat.text.length - 10) &&
          (!this.test || this.test(i, s, t))
        )
          return (
            (this.value = { from: i, to: s, match: t }),
            (this.matchPos = ss(this.text, s + (i == s ? 1 : 0))),
            this
          );
      }
      if (this.flat.to == this.to) return ((this.done = !0), this);
      this.flat = ni.get(
        this.text,
        this.flat.from,
        this.chunkEnd(this.flat.from + this.flat.text.length * 2),
      );
    }
  }
}
typeof Symbol < "u" &&
  (Mf.prototype[Symbol.iterator] = Tf.prototype[Symbol.iterator] =
    function () {
      return this;
    });
function V0(n) {
  try {
    return (new RegExp(n, Do), !0);
  } catch {
    return !1;
  }
}
function ss(n, e) {
  if (e >= n.length) return e;
  let t = n.lineAt(e),
    i;
  for (
    ;
    e < t.to && (i = t.text.charCodeAt(e - t.from)) >= 56320 && i < 57344;
  )
    e++;
  return e;
}
const z0 = (n) => {
    let { state: e } = n,
      t = String(e.doc.lineAt(n.state.selection.main.head).number),
      { close: i, result: s } = Xp(n, {
        label: e.phrase("Go to line"),
        input: { type: "text", name: "line", value: t },
        focus: !0,
        submitLabel: e.phrase("go"),
      });
    return (
      s.then((r) => {
        let o = r && /^([+-])?(\d+)?(:\d+)?(%)?$/.exec(r.elements.line.value);
        if (!o) {
          n.dispatch({ effects: i });
          return;
        }
        let l = e.doc.lineAt(e.selection.main.head),
          [, a, h, c, f] = o,
          u = c ? +c.slice(1) : 0,
          d = h ? +h : l.number;
        if (h && f) {
          let g = d / 100;
          (a && (g = g * (a == "-" ? -1 : 1) + l.number / e.doc.lines),
            (d = Math.round(e.doc.lines * g)));
        } else h && a && (d = d * (a == "-" ? -1 : 1) + l.number);
        let p = e.doc.line(Math.max(1, Math.min(e.doc.lines, d))),
          m = x.cursor(p.from + Math.max(0, Math.min(u, p.length)));
        n.dispatch({
          effects: [i, A.scrollIntoView(m.from, { y: "center" })],
          selection: m,
        });
      }),
      !0
    );
  },
  _0 = {
    highlightWordAroundCursor: !1,
    minSelectionLength: 1,
    maxMatches: 100,
    wholeWords: !1,
  },
  q0 = D.define({
    combine(n) {
      return at(n, _0, {
        highlightWordAroundCursor: (e, t) => e || t,
        minSelectionLength: Math.min,
        maxMatches: Math.min,
      });
    },
  });
function $0(n) {
  return [J0, G0];
}
const K0 = L.mark({ class: "cm-selectionMatch" }),
  j0 = L.mark({ class: "cm-selectionMatch cm-selectionMatch-main" });
function ba(n, e, t, i) {
  return (
    (t == 0 || n(e.sliceDoc(t - 1, t)) != Q.Word) &&
    (i == e.doc.length || n(e.sliceDoc(i, i + 1)) != Q.Word)
  );
}
function U0(n, e, t, i) {
  return n(e.sliceDoc(t, t + 1)) == Q.Word && n(e.sliceDoc(i - 1, i)) == Q.Word;
}
const G0 = ne.fromClass(
    class {
      constructor(n) {
        this.decorations = this.getDeco(n);
      }
      update(n) {
        (n.selectionSet || n.docChanged || n.viewportChanged) &&
          (this.decorations = this.getDeco(n.view));
      }
      getDeco(n) {
        let e = n.state.facet(q0),
          { state: t } = n,
          i = t.selection;
        if (i.ranges.length > 1) return L.none;
        let s = i.main,
          r,
          o = null;
        if (s.empty) {
          if (!e.highlightWordAroundCursor) return L.none;
          let a = t.wordAt(s.head);
          if (!a) return L.none;
          ((o = t.charCategorizer(s.head)), (r = t.sliceDoc(a.from, a.to)));
        } else {
          let a = s.to - s.from;
          if (a < e.minSelectionLength || a > 200) return L.none;
          if (e.wholeWords) {
            if (
              ((r = t.sliceDoc(s.from, s.to)),
              (o = t.charCategorizer(s.head)),
              !(ba(o, t, s.from, s.to) && U0(o, t, s.from, s.to)))
            )
              return L.none;
          } else if (((r = t.sliceDoc(s.from, s.to)), !r)) return L.none;
        }
        let l = [];
        for (let a of n.visibleRanges) {
          let h = new fi(t.doc, r, a.from, a.to);
          for (; !h.next().done; ) {
            let { from: c, to: f } = h.value;
            if (
              (!o || ba(o, t, c, f)) &&
              (s.empty && c <= s.from && f >= s.to
                ? l.push(j0.range(c, f))
                : (c >= s.to || f <= s.from) && l.push(K0.range(c, f)),
              l.length > e.maxMatches)
            )
              return L.none;
          }
        }
        return L.set(l);
      }
    },
    { decorations: (n) => n.decorations },
  ),
  J0 = A.baseTheme({
    ".cm-selectionMatch": { backgroundColor: "#99ff7780" },
    ".cm-searchMatch .cm-selectionMatch": { backgroundColor: "transparent" },
  }),
  Y0 = ({ state: n, dispatch: e }) => {
    let { selection: t } = n,
      i = x.create(
        t.ranges.map((s) => n.wordAt(s.head) || x.cursor(s.head)),
        t.mainIndex,
      );
    return i.eq(t) ? !1 : (e(n.update({ selection: i })), !0);
  };
function X0(n, e) {
  let { main: t, ranges: i } = n.selection,
    s = n.wordAt(t.head),
    r = s && s.from == t.from && s.to == t.to;
  for (let o = !1, l = new fi(n.doc, e, i[i.length - 1].to); ; )
    if ((l.next(), l.done)) {
      if (o) return null;
      ((l = new fi(n.doc, e, 0, Math.max(0, i[i.length - 1].from - 1))),
        (o = !0));
    } else {
      if (o && i.some((a) => a.from == l.value.from)) continue;
      if (r) {
        let a = n.wordAt(l.value.from);
        if (!a || a.from != l.value.from || a.to != l.value.to) continue;
      }
      return l.value;
    }
}
const Q0 = ({ state: n, dispatch: e }) => {
    let { ranges: t } = n.selection;
    if (t.some((r) => r.from === r.to)) return Y0({ state: n, dispatch: e });
    let i = n.sliceDoc(t[0].from, t[0].to);
    if (n.selection.ranges.some((r) => n.sliceDoc(r.from, r.to) != i))
      return !1;
    let s = X0(n, i);
    return s
      ? (e(
          n.update({
            selection: n.selection.addRange(x.range(s.from, s.to), !1),
            effects: A.scrollIntoView(s.to),
          }),
        ),
        !0)
      : !1;
  },
  mi = D.define({
    combine(n) {
      return at(n, {
        top: !1,
        caseSensitive: !1,
        literal: !1,
        regexp: !1,
        wholeWord: !1,
        createPanel: (e) => new uy(e),
        scrollToMatch: (e) => A.scrollIntoView(e),
      });
    },
  });
class Df {
  constructor(e) {
    ((this.search = e.search),
      (this.caseSensitive = !!e.caseSensitive),
      (this.literal = !!e.literal),
      (this.regexp = !!e.regexp),
      (this.replace = e.replace || ""),
      (this.valid = !!this.search && (!this.regexp || V0(this.search))),
      (this.unquoted = this.unquote(this.search)),
      (this.wholeWord = !!e.wholeWord),
      (this.test = e.test));
  }
  unquote(e) {
    return this.literal
      ? e
      : e.replace(/\\([nrt\\])/g, (t, i) =>
          i == "n"
            ? `
`
            : i == "r"
              ? "\r"
              : i == "t"
                ? "	"
                : "\\",
        );
  }
  eq(e) {
    return (
      this.search == e.search &&
      this.replace == e.replace &&
      this.caseSensitive == e.caseSensitive &&
      this.regexp == e.regexp &&
      this.wholeWord == e.wholeWord &&
      this.test == e.test
    );
  }
  create() {
    return this.regexp ? new sy(this) : new ty(this);
  }
  getCursor(e, t = 0, i) {
    let s = e.doc ? e : _.create({ doc: e });
    return (
      i == null && (i = s.doc.length),
      this.regexp ? Gt(this, s, t, i) : Ut(this, s, t, i)
    );
  }
}
class Of {
  constructor(e) {
    this.spec = e;
  }
}
function Z0(n, e, t) {
  return (i, s, r, o) => {
    if (t && !t(i, s, r, o)) return !1;
    let l =
      i >= o && s <= o + r.length
        ? r.slice(i - o, s - o)
        : e.doc.sliceString(i, s);
    return n(l, e, i, s);
  };
}
function Ut(n, e, t, i) {
  let s;
  return (
    n.wholeWord && (s = ey(e.doc, e.charCategorizer(e.selection.main.head))),
    n.test && (s = Z0(n.test, e, s)),
    new fi(
      e.doc,
      n.unquoted,
      t,
      i,
      n.caseSensitive ? void 0 : (r) => r.toLowerCase(),
      s,
    )
  );
}
function ey(n, e) {
  return (t, i, s, r) => (
    (r > t || r + s.length < i) &&
      ((r = Math.max(0, t - 2)),
      (s = n.sliceString(r, Math.min(n.length, i + 2)))),
    (e(rs(s, t - r)) != Q.Word || e(os(s, t - r)) != Q.Word) &&
      (e(os(s, i - r)) != Q.Word || e(rs(s, i - r)) != Q.Word)
  );
}
class ty extends Of {
  constructor(e) {
    super(e);
  }
  nextMatch(e, t, i) {
    let s = Ut(this.spec, e, i, e.doc.length).nextOverlapping();
    if (s.done) {
      let r = Math.min(e.doc.length, t + this.spec.unquoted.length);
      s = Ut(this.spec, e, 0, r).nextOverlapping();
    }
    return s.done || (s.value.from == t && s.value.to == i) ? null : s.value;
  }
  prevMatchInRange(e, t, i) {
    for (let s = i; ; ) {
      let r = Math.max(t, s - 1e4 - this.spec.unquoted.length),
        o = Ut(this.spec, e, r, s),
        l = null;
      for (; !o.nextOverlapping().done; ) l = o.value;
      if (l) return l;
      if (r == t) return null;
      s -= 1e4;
    }
  }
  prevMatch(e, t, i) {
    let s = this.prevMatchInRange(e, 0, t);
    return (
      s ||
        (s = this.prevMatchInRange(
          e,
          Math.max(0, i - this.spec.unquoted.length),
          e.doc.length,
        )),
      s && (s.from != t || s.to != i) ? s : null
    );
  }
  getReplacement(e) {
    return this.spec.unquote(this.spec.replace);
  }
  matchAll(e, t) {
    let i = Ut(this.spec, e, 0, e.doc.length),
      s = [];
    for (; !i.next().done; ) {
      if (s.length >= t) return null;
      s.push(i.value);
    }
    return s;
  }
  highlight(e, t, i, s) {
    let r = Ut(
      this.spec,
      e,
      Math.max(0, t - this.spec.unquoted.length),
      Math.min(i + this.spec.unquoted.length, e.doc.length),
    );
    for (; !r.next().done; ) s(r.value.from, r.value.to);
  }
}
function iy(n, e, t) {
  return (i, s, r) => (!t || t(i, s, r)) && n(r[0], e, i, s);
}
function Gt(n, e, t, i) {
  let s;
  return (
    n.wholeWord && (s = ny(e.charCategorizer(e.selection.main.head))),
    n.test && (s = iy(n.test, e, s)),
    new Mf(e.doc, n.search, { ignoreCase: !n.caseSensitive, test: s }, t, i)
  );
}
function rs(n, e) {
  return n.slice(he(n, e, !1), e);
}
function os(n, e) {
  return n.slice(e, he(n, e));
}
function ny(n) {
  return (e, t, i) =>
    !i[0].length ||
    ((n(rs(i.input, i.index)) != Q.Word || n(os(i.input, i.index)) != Q.Word) &&
      (n(os(i.input, i.index + i[0].length)) != Q.Word ||
        n(rs(i.input, i.index + i[0].length)) != Q.Word));
}
class sy extends Of {
  nextMatch(e, t, i) {
    let s = Gt(this.spec, e, i, e.doc.length).next();
    return (
      s.done && (s = Gt(this.spec, e, 0, t).next()),
      s.done ? null : s.value
    );
  }
  prevMatchInRange(e, t, i) {
    for (let s = 1; ; s++) {
      let r = Math.max(t, i - s * 1e4),
        o = Gt(this.spec, e, r, i),
        l = null;
      for (; !o.next().done; ) l = o.value;
      if (l && (r == t || l.from > r + 10)) return l;
      if (r == t) return null;
    }
  }
  prevMatch(e, t, i) {
    return (
      this.prevMatchInRange(e, 0, t) ||
      this.prevMatchInRange(e, i, e.doc.length)
    );
  }
  getReplacement(e) {
    return this.spec
      .unquote(this.spec.replace)
      .replace(/\$([$&]|\d+)/g, (t, i) => {
        if (i == "&") return e.match[0];
        if (i == "$") return "$";
        for (let s = i.length; s > 0; s--) {
          let r = +i.slice(0, s);
          if (r > 0 && r < e.match.length) return e.match[r] + i.slice(s);
        }
        return t;
      });
  }
  matchAll(e, t) {
    let i = Gt(this.spec, e, 0, e.doc.length),
      s = [];
    for (; !i.next().done; ) {
      if (s.length >= t) return null;
      s.push(i.value);
    }
    return s;
  }
  highlight(e, t, i, s) {
    let r = Gt(
      this.spec,
      e,
      Math.max(0, t - 250),
      Math.min(i + 250, e.doc.length),
    );
    for (; !r.next().done; ) s(r.value.from, r.value.to);
  }
}
const Ki = R.define(),
  Oo = R.define(),
  wt = ce.define({
    create(n) {
      return new Js(Ur(n).create(), null);
    },
    update(n, e) {
      for (let t of e.effects)
        t.is(Ki)
          ? (n = new Js(t.value.create(), n.panel))
          : t.is(Oo) && (n = new Js(n.query, t.value ? Bo : null));
      return n;
    },
    provide: (n) => Vi.from(n, (e) => e.panel),
  });
class Js {
  constructor(e, t) {
    ((this.query = e), (this.panel = t));
  }
}
const ry = L.mark({ class: "cm-searchMatch" }),
  oy = L.mark({ class: "cm-searchMatch cm-searchMatch-selected" }),
  ly = ne.fromClass(
    class {
      constructor(n) {
        ((this.view = n),
          (this.decorations = this.highlight(n.state.field(wt))));
      }
      update(n) {
        let e = n.state.field(wt);
        (e != n.startState.field(wt) ||
          n.docChanged ||
          n.selectionSet ||
          n.viewportChanged) &&
          (this.decorations = this.highlight(e));
      }
      highlight({ query: n, panel: e }) {
        if (!e || !n.spec.valid) return L.none;
        let { view: t } = this,
          i = new ut();
        for (let s = 0, r = t.visibleRanges, o = r.length; s < o; s++) {
          let { from: l, to: a } = r[s];
          for (; s < o - 1 && a > r[s + 1].from - 500; ) a = r[++s].to;
          n.highlight(t.state, l, a, (h, c) => {
            let f = t.state.selection.ranges.some(
              (u) => u.from == h && u.to == c,
            );
            i.add(h, c, f ? oy : ry);
          });
        }
        return i.finish();
      }
    },
    { decorations: (n) => n.decorations },
  );
function ln(n) {
  return (e) => {
    let t = e.state.field(wt, !1);
    return t && t.query.spec.valid ? n(e, t) : Lf(e);
  };
}
const ls = ln((n, { query: e }) => {
    let { to: t } = n.state.selection.main,
      i = e.nextMatch(n.state, t, t);
    if (!i) return !1;
    let s = x.single(i.from, i.to),
      r = n.state.facet(mi);
    return (
      n.dispatch({
        selection: s,
        effects: [Eo(n, i), r.scrollToMatch(s.main, n)],
        userEvent: "select.search",
      }),
      Ef(n),
      !0
    );
  }),
  as = ln((n, { query: e }) => {
    let { state: t } = n,
      { from: i } = t.selection.main,
      s = e.prevMatch(t, i, i);
    if (!s) return !1;
    let r = x.single(s.from, s.to),
      o = n.state.facet(mi);
    return (
      n.dispatch({
        selection: r,
        effects: [Eo(n, s), o.scrollToMatch(r.main, n)],
        userEvent: "select.search",
      }),
      Ef(n),
      !0
    );
  }),
  ay = ln((n, { query: e }) => {
    let t = e.matchAll(n.state, 1e3);
    return !t || !t.length
      ? !1
      : (n.dispatch({
          selection: x.create(t.map((i) => x.range(i.from, i.to))),
          userEvent: "select.search.matches",
        }),
        !0);
  }),
  hy = ({ state: n, dispatch: e }) => {
    let t = n.selection;
    if (t.ranges.length > 1 || t.main.empty) return !1;
    let { from: i, to: s } = t.main,
      r = [],
      o = 0;
    for (let l = new fi(n.doc, n.sliceDoc(i, s)); !l.next().done; ) {
      if (r.length > 1e3) return !1;
      (l.value.from == i && (o = r.length),
        r.push(x.range(l.value.from, l.value.to)));
    }
    return (
      e(
        n.update({
          selection: x.create(r, o),
          userEvent: "select.search.matches",
        }),
      ),
      !0
    );
  },
  xa = ln((n, { query: e }) => {
    let { state: t } = n,
      { from: i, to: s } = t.selection.main;
    if (t.readOnly) return !1;
    let r = e.nextMatch(t, i, i);
    if (!r) return !1;
    let o = r,
      l = [],
      a,
      h,
      c = [];
    o.from == i &&
      o.to == s &&
      ((h = t.toText(e.getReplacement(o))),
      l.push({ from: o.from, to: o.to, insert: h }),
      (o = e.nextMatch(t, o.from, o.to)),
      c.push(
        A.announce.of(
          t.phrase("replaced match on line $", t.doc.lineAt(i).number) + ".",
        ),
      ));
    let f = n.state.changes(l);
    return (
      o &&
        ((a = x.single(o.from, o.to).map(f)),
        c.push(Eo(n, o)),
        c.push(t.facet(mi).scrollToMatch(a.main, n))),
      n.dispatch({
        changes: f,
        selection: a,
        effects: c,
        userEvent: "input.replace",
      }),
      !0
    );
  }),
  cy = ln((n, { query: e }) => {
    if (n.state.readOnly) return !1;
    let t = e.matchAll(n.state, 1e9).map((s) => {
      let { from: r, to: o } = s;
      return { from: r, to: o, insert: e.getReplacement(s) };
    });
    if (!t.length) return !1;
    let i = n.state.phrase("replaced $ matches", t.length) + ".";
    return (
      n.dispatch({
        changes: t,
        effects: A.announce.of(i),
        userEvent: "input.replace.all",
      }),
      !0
    );
  });
function Bo(n) {
  return n.state.facet(mi).createPanel(n);
}
function Ur(n, e) {
  var t, i, s, r, o;
  let l = n.selection.main,
    a = l.empty || l.to > l.from + 100 ? "" : n.sliceDoc(l.from, l.to);
  if (e && !a) return e;
  let h = n.facet(mi);
  return new Df({
    search: ((t = e?.literal) !== null && t !== void 0 ? t : h.literal)
      ? a
      : a.replace(/\n/g, "\\n"),
    caseSensitive:
      (i = e?.caseSensitive) !== null && i !== void 0 ? i : h.caseSensitive,
    literal: (s = e?.literal) !== null && s !== void 0 ? s : h.literal,
    regexp: (r = e?.regexp) !== null && r !== void 0 ? r : h.regexp,
    wholeWord: (o = e?.wholeWord) !== null && o !== void 0 ? o : h.wholeWord,
  });
}
function Bf(n) {
  let e = mo(n, Bo);
  return e && e.dom.querySelector("[main-field]");
}
function Ef(n) {
  let e = Bf(n);
  e && e == n.root.activeElement && e.select();
}
const Lf = (n) => {
    let e = n.state.field(wt, !1);
    if (e && e.panel) {
      let t = Bf(n);
      if (t && t != n.root.activeElement) {
        let i = Ur(n.state, e.query.spec);
        (i.valid && n.dispatch({ effects: Ki.of(i) }), t.focus(), t.select());
      }
    } else
      n.dispatch({
        effects: [
          Oo.of(!0),
          e ? Ki.of(Ur(n.state, e.query.spec)) : R.appendConfig.of(py),
        ],
      });
    return !0;
  },
  Pf = (n) => {
    let e = n.state.field(wt, !1);
    if (!e || !e.panel) return !1;
    let t = mo(n, Bo);
    return (
      t && t.dom.contains(n.root.activeElement) && n.focus(),
      n.dispatch({ effects: Oo.of(!1) }),
      !0
    );
  },
  fy = [
    { key: "Mod-f", run: Lf, scope: "editor search-panel" },
    {
      key: "F3",
      run: ls,
      shift: as,
      scope: "editor search-panel",
      preventDefault: !0,
    },
    {
      key: "Mod-g",
      run: ls,
      shift: as,
      scope: "editor search-panel",
      preventDefault: !0,
    },
    { key: "Escape", run: Pf, scope: "editor search-panel" },
    { key: "Mod-Shift-l", run: hy },
    { key: "Mod-Alt-g", run: z0 },
    { key: "Mod-d", run: Q0, preventDefault: !0 },
  ];
class uy {
  constructor(e) {
    this.view = e;
    let t = (this.query = e.state.field(wt).query.spec);
    ((this.commit = this.commit.bind(this)),
      (this.searchField = K("input", {
        value: t.search,
        placeholder: Ee(e, "Find"),
        "aria-label": Ee(e, "Find"),
        class: "cm-textfield",
        name: "search",
        form: "",
        "main-field": "true",
        onchange: this.commit,
        onkeyup: this.commit,
      })),
      (this.replaceField = K("input", {
        value: t.replace,
        placeholder: Ee(e, "Replace"),
        "aria-label": Ee(e, "Replace"),
        class: "cm-textfield",
        name: "replace",
        form: "",
        onchange: this.commit,
        onkeyup: this.commit,
      })),
      (this.caseField = K("input", {
        type: "checkbox",
        name: "case",
        form: "",
        checked: t.caseSensitive,
        onchange: this.commit,
      })),
      (this.reField = K("input", {
        type: "checkbox",
        name: "re",
        form: "",
        checked: t.regexp,
        onchange: this.commit,
      })),
      (this.wordField = K("input", {
        type: "checkbox",
        name: "word",
        form: "",
        checked: t.wholeWord,
        onchange: this.commit,
      })));
    function i(s, r, o) {
      return K(
        "button",
        { class: "cm-button", name: s, onclick: r, type: "button" },
        o,
      );
    }
    this.dom = K(
      "div",
      { onkeydown: (s) => this.keydown(s), class: "cm-search" },
      [
        this.searchField,
        i("next", () => ls(e), [Ee(e, "next")]),
        i("prev", () => as(e), [Ee(e, "previous")]),
        i("select", () => ay(e), [Ee(e, "all")]),
        K("label", null, [this.caseField, Ee(e, "match case")]),
        K("label", null, [this.reField, Ee(e, "regexp")]),
        K("label", null, [this.wordField, Ee(e, "by word")]),
        ...(e.state.readOnly
          ? []
          : [
              K("br"),
              this.replaceField,
              i("replace", () => xa(e), [Ee(e, "replace")]),
              i("replaceAll", () => cy(e), [Ee(e, "replace all")]),
            ]),
        K(
          "button",
          {
            name: "close",
            onclick: () => Pf(e),
            "aria-label": Ee(e, "close"),
            type: "button",
          },
          ["×"],
        ),
      ],
    );
  }
  commit() {
    let e = new Df({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      wholeWord: this.wordField.checked,
      replace: this.replaceField.value,
    });
    e.eq(this.query) ||
      ((this.query = e), this.view.dispatch({ effects: Ki.of(e) }));
  }
  keydown(e) {
    lp(this.view, e, "search-panel")
      ? e.preventDefault()
      : e.keyCode == 13 && e.target == this.searchField
        ? (e.preventDefault(), (e.shiftKey ? as : ls)(this.view))
        : e.keyCode == 13 &&
          e.target == this.replaceField &&
          (e.preventDefault(), xa(this.view));
  }
  update(e) {
    for (let t of e.transactions)
      for (let i of t.effects)
        i.is(Ki) && !i.value.eq(this.query) && this.setQuery(i.value);
  }
  setQuery(e) {
    ((this.query = e),
      (this.searchField.value = e.search),
      (this.replaceField.value = e.replace),
      (this.caseField.checked = e.caseSensitive),
      (this.reField.checked = e.regexp),
      (this.wordField.checked = e.wholeWord));
  }
  mount() {
    this.searchField.select();
  }
  get pos() {
    return 80;
  }
  get top() {
    return this.view.state.facet(mi).top;
  }
}
function Ee(n, e) {
  return n.state.phrase(e);
}
const On = 30,
  Bn = /[\s\.,:;?!]/;
function Eo(n, { from: e, to: t }) {
  let i = n.state.doc.lineAt(e),
    s = n.state.doc.lineAt(t).to,
    r = Math.max(i.from, e - On),
    o = Math.min(s, t + On),
    l = n.state.sliceDoc(r, o);
  if (r != i.from) {
    for (let a = 0; a < On; a++)
      if (!Bn.test(l[a + 1]) && Bn.test(l[a])) {
        l = l.slice(a);
        break;
      }
  }
  if (o != s) {
    for (let a = l.length - 1; a > l.length - On; a--)
      if (!Bn.test(l[a - 1]) && Bn.test(l[a])) {
        l = l.slice(0, a);
        break;
      }
  }
  return A.announce.of(
    `${n.state.phrase("current match")}. ${l} ${n.state.phrase("on line")} ${i.number}.`,
  );
}
const dy = A.baseTheme({
    ".cm-panel.cm-search": {
      padding: "2px 6px 4px",
      position: "relative",
      "& [name=close]": {
        position: "absolute",
        top: "0",
        right: "4px",
        backgroundColor: "inherit",
        border: "none",
        font: "inherit",
        padding: 0,
        margin: 0,
      },
      "& input, & button, & label": { margin: ".2em .6em .2em 0" },
      "& input[type=checkbox]": { marginRight: ".2em" },
      "& label": { fontSize: "80%", whiteSpace: "pre" },
    },
    "&light .cm-searchMatch": { backgroundColor: "#ffff0054" },
    "&dark .cm-searchMatch": { backgroundColor: "#00ffff8a" },
    "&light .cm-searchMatch-selected": { backgroundColor: "#ff6a0054" },
    "&dark .cm-searchMatch-selected": { backgroundColor: "#ff00ff8a" },
  }),
  py = [wt, Dt.low(ly), dy];
class Rf {
  constructor(e, t, i, s) {
    ((this.state = e),
      (this.pos = t),
      (this.explicit = i),
      (this.view = s),
      (this.abortListeners = []),
      (this.abortOnDocChange = !1));
  }
  tokenBefore(e) {
    let t = ge(this.state).resolveInner(this.pos, -1);
    for (; t && e.indexOf(t.name) < 0; ) t = t.parent;
    return t
      ? {
          from: t.from,
          to: this.pos,
          text: this.state.sliceDoc(t.from, this.pos),
          type: t.type,
        }
      : null;
  }
  matchBefore(e) {
    let t = this.state.doc.lineAt(this.pos),
      i = Math.max(t.from, this.pos - 250),
      s = t.text.slice(i - t.from, this.pos - t.from),
      r = s.search(If(e, !1));
    return r < 0 ? null : { from: i + r, to: this.pos, text: s.slice(r) };
  }
  get aborted() {
    return this.abortListeners == null;
  }
  addEventListener(e, t, i) {
    e == "abort" &&
      this.abortListeners &&
      (this.abortListeners.push(t),
      i && i.onDocChange && (this.abortOnDocChange = !0));
  }
}
function wa(n) {
  let e = Object.keys(n).join(""),
    t = /\w/.test(e);
  return (
    t && (e = e.replace(/\w/g, "")),
    `[${t ? "\\w" : ""}${e.replace(/[^\w\s]/g, "\\$&")}]`
  );
}
function my(n) {
  let e = Object.create(null),
    t = Object.create(null);
  for (let { label: s } of n) {
    e[s[0]] = !0;
    for (let r = 1; r < s.length; r++) t[s[r]] = !0;
  }
  let i = wa(e) + wa(t) + "*$";
  return [new RegExp("^" + i), new RegExp(i)];
}
function gy(n) {
  let e = n.map((s) => (typeof s == "string" ? { label: s } : s)),
    [t, i] = e.every((s) => /^\w+$/.test(s.label)) ? [/\w*$/, /\w+$/] : my(e);
  return (s) => {
    let r = s.matchBefore(i);
    return r || s.explicit
      ? { from: r ? r.from : s.pos, options: e, validFor: t }
      : null;
  };
}
function f1(n, e) {
  return (t) => {
    for (let i = ge(t.state).resolveInner(t.pos, -1); i; i = i.parent) {
      if (n.indexOf(i.name) > -1) return null;
      if (i.type.isTop) break;
    }
    return e(t);
  };
}
class va {
  constructor(e, t, i, s) {
    ((this.completion = e),
      (this.source = t),
      (this.match = i),
      (this.score = s));
  }
}
function Ht(n) {
  return n.selection.main.from;
}
function If(n, e) {
  var t;
  let { source: i } = n,
    s = e && i[0] != "^",
    r = i[i.length - 1] != "$";
  return !s && !r
    ? n
    : new RegExp(
        `${s ? "^" : ""}(?:${i})${r ? "$" : ""}`,
        (t = n.flags) !== null && t !== void 0 ? t : n.ignoreCase ? "i" : "",
      );
}
const Lo = lt.define();
function yy(n, e, t, i) {
  let { main: s } = n.selection,
    r = t - s.from,
    o = i - s.from;
  return {
    ...n.changeByRange((l) => {
      if (
        l != s &&
        t != i &&
        n.sliceDoc(l.from + r, l.from + o) != n.sliceDoc(t, i)
      )
        return { range: l };
      let a = n.toText(e);
      return {
        changes: {
          from: l.from + r,
          to: i == s.from ? l.to : l.from + o,
          insert: a,
        },
        range: x.cursor(l.from + r + a.length),
      };
    }),
    scrollIntoView: !0,
    userEvent: "input.complete",
  };
}
const ka = new WeakMap();
function by(n) {
  if (!Array.isArray(n)) return n;
  let e = ka.get(n);
  return (e || ka.set(n, (e = gy(n))), e);
}
const hs = R.define(),
  ji = R.define();
class xy {
  constructor(e) {
    ((this.pattern = e),
      (this.chars = []),
      (this.folded = []),
      (this.any = []),
      (this.precise = []),
      (this.byWord = []),
      (this.score = 0),
      (this.matched = []));
    for (let t = 0; t < e.length; ) {
      let i = Ae(e, t),
        s = et(i);
      this.chars.push(i);
      let r = e.slice(t, t + s),
        o = r.toUpperCase();
      (this.folded.push(Ae(o == r ? r.toLowerCase() : o, 0)), (t += s));
    }
    this.astral = e.length != this.chars.length;
  }
  ret(e, t) {
    return ((this.score = e), (this.matched = t), this);
  }
  match(e) {
    if (this.pattern.length == 0) return this.ret(-100, []);
    if (e.length < this.pattern.length) return null;
    let { chars: t, folded: i, any: s, precise: r, byWord: o } = this;
    if (t.length == 1) {
      let w = Ae(e, 0),
        v = et(w),
        T = v == e.length ? 0 : -100;
      if (w != t[0])
        if (w == i[0]) T += -200;
        else return null;
      return this.ret(T, [0, v]);
    }
    let l = e.indexOf(this.pattern);
    if (l == 0)
      return this.ret(e.length == this.pattern.length ? 0 : -100, [
        0,
        this.pattern.length,
      ]);
    let a = t.length,
      h = 0;
    if (l < 0) {
      for (let w = 0, v = Math.min(e.length, 200); w < v && h < a; ) {
        let T = Ae(e, w);
        ((T == t[h] || T == i[h]) && (s[h++] = w), (w += et(T)));
      }
      if (h < a) return null;
    }
    let c = 0,
      f = 0,
      u = !1,
      d = 0,
      p = -1,
      m = -1,
      g = /[a-z]/.test(e),
      b = !0;
    for (let w = 0, v = Math.min(e.length, 200), T = 0; w < v && f < a; ) {
      let k = Ae(e, w);
      l < 0 &&
        (c < a && k == t[c] && (r[c++] = w),
        d < a &&
          (k == t[d] || k == i[d]
            ? (d == 0 && (p = w), (m = w + 1), d++)
            : (d = 0)));
      let S,
        C =
          k < 255
            ? (k >= 48 && k <= 57) || (k >= 97 && k <= 122)
              ? 2
              : k >= 65 && k <= 90
                ? 1
                : 0
            : (S = Yr(k)) != S.toLowerCase()
              ? 1
              : S != S.toUpperCase()
                ? 2
                : 0;
      ((!w || (C == 1 && g) || (T == 0 && C != 0)) &&
        (t[f] == k || (i[f] == k && (u = !0))
          ? (o[f++] = w)
          : o.length && (b = !1)),
        (T = C),
        (w += et(k)));
    }
    return f == a && o[0] == 0 && b
      ? this.result(-100 + (u ? -200 : 0), o, e)
      : d == a && p == 0
        ? this.ret(-200 - e.length + (m == e.length ? 0 : -100), [0, m])
        : l > -1
          ? this.ret(-700 - e.length, [l, l + this.pattern.length])
          : d == a
            ? this.ret(-900 - e.length, [p, m])
            : f == a
              ? this.result(
                  -100 + (u ? -200 : 0) + -700 + (b ? 0 : -1100),
                  o,
                  e,
                )
              : t.length == 2
                ? null
                : this.result((s[0] ? -700 : 0) + -200 + -1100, s, e);
  }
  result(e, t, i) {
    let s = [],
      r = 0;
    for (let o of t) {
      let l = o + (this.astral ? et(Ae(i, o)) : 1);
      r && s[r - 1] == o ? (s[r - 1] = l) : ((s[r++] = o), (s[r++] = l));
    }
    return this.ret(e - i.length, s);
  }
}
class wy {
  constructor(e) {
    ((this.pattern = e),
      (this.matched = []),
      (this.score = 0),
      (this.folded = e.toLowerCase()));
  }
  match(e) {
    if (e.length < this.pattern.length) return null;
    let t = e.slice(0, this.pattern.length),
      i = t == this.pattern ? 0 : t.toLowerCase() == this.folded ? -200 : null;
    return i == null
      ? null
      : ((this.matched = [0, t.length]),
        (this.score = i + (e.length == this.pattern.length ? 0 : -100)),
        this);
  }
}
const ae = D.define({
  combine(n) {
    return at(
      n,
      {
        activateOnTyping: !0,
        activateOnCompletion: () => !1,
        activateOnTypingDelay: 100,
        selectOnOpen: !0,
        override: null,
        closeOnBlur: !0,
        maxRenderedOptions: 100,
        defaultKeymap: !0,
        tooltipClass: () => "",
        optionClass: () => "",
        aboveCursor: !1,
        icons: !0,
        addToOptions: [],
        positionInfo: vy,
        filterStrict: !1,
        compareCompletions: (e, t) =>
          (e.sortText || e.label).localeCompare(t.sortText || t.label),
        interactionDelay: 75,
        updateSyncTime: 100,
      },
      {
        defaultKeymap: (e, t) => e && t,
        closeOnBlur: (e, t) => e && t,
        icons: (e, t) => e && t,
        tooltipClass: (e, t) => (i) => Sa(e(i), t(i)),
        optionClass: (e, t) => (i) => Sa(e(i), t(i)),
        addToOptions: (e, t) => e.concat(t),
        filterStrict: (e, t) => e || t,
      },
    );
  },
});
function Sa(n, e) {
  return n ? (e ? n + " " + e : n) : e;
}
function vy(n, e, t, i, s, r) {
  let o = n.textDirection == G.RTL,
    l = o,
    a = !1,
    h = "top",
    c,
    f,
    u = e.left - s.left,
    d = s.right - e.right,
    p = i.right - i.left,
    m = i.bottom - i.top;
  if (
    (l && u < Math.min(p, d) ? (l = !1) : !l && d < Math.min(p, u) && (l = !0),
    p <= (l ? u : d))
  )
    ((c = Math.max(s.top, Math.min(t.top, s.bottom - m)) - e.top),
      (f = Math.min(400, l ? u : d)));
  else {
    ((a = !0), (f = Math.min(400, (o ? e.right : s.right - e.left) - 30)));
    let w = s.bottom - e.bottom;
    w >= m || w > e.top
      ? (c = t.bottom - e.top)
      : ((h = "bottom"), (c = e.bottom - t.top));
  }
  let g = (e.bottom - e.top) / r.offsetHeight,
    b = (e.right - e.left) / r.offsetWidth;
  return {
    style: `${h}: ${c / g}px; max-width: ${f / b}px`,
    class:
      "cm-completionInfo-" +
      (a ? (o ? "left-narrow" : "right-narrow") : l ? "left" : "right"),
  };
}
const Po = R.define();
function ky(n) {
  let e = n.addToOptions.slice();
  return (
    n.icons &&
      e.push({
        render(t) {
          let i = document.createElement("div");
          return (
            i.classList.add("cm-completionIcon"),
            t.type &&
              i.classList.add(
                ...t.type.split(/\s+/g).map((s) => "cm-completionIcon-" + s),
              ),
            i.setAttribute("aria-hidden", "true"),
            i
          );
        },
        position: 20,
      }),
    e.push(
      {
        render(t, i, s, r) {
          let o = document.createElement("span");
          o.className = "cm-completionLabel";
          let l = t.displayLabel || t.label,
            a = 0;
          for (let h = 0; h < r.length; ) {
            let c = r[h++],
              f = r[h++];
            c > a && o.appendChild(document.createTextNode(l.slice(a, c)));
            let u = o.appendChild(document.createElement("span"));
            (u.appendChild(document.createTextNode(l.slice(c, f))),
              (u.className = "cm-completionMatchedText"),
              (a = f));
          }
          return (
            a < l.length && o.appendChild(document.createTextNode(l.slice(a))),
            o
          );
        },
        position: 50,
      },
      {
        render(t) {
          if (!t.detail) return null;
          let i = document.createElement("span");
          return (
            (i.className = "cm-completionDetail"),
            (i.textContent = t.detail),
            i
          );
        },
        position: 80,
      },
    ),
    e.sort((t, i) => t.position - i.position).map((t) => t.render)
  );
}
function Ys(n, e, t) {
  if (n <= t) return { from: 0, to: n };
  if ((e < 0 && (e = 0), e <= n >> 1)) {
    let s = Math.floor(e / t);
    return { from: s * t, to: (s + 1) * t };
  }
  let i = Math.floor((n - e) / t);
  return { from: n - (i + 1) * t, to: n - i * t };
}
class Sy {
  constructor(e, t, i) {
    ((this.view = e),
      (this.stateField = t),
      (this.applyCompletion = i),
      (this.info = null),
      (this.infoDestroy = null),
      (this.placeInfoReq = {
        read: () => this.measureInfo(),
        write: (a) => this.placeInfo(a),
        key: this,
      }),
      (this.space = null),
      (this.currentClass = ""));
    let s = e.state.field(t),
      { options: r, selected: o } = s.open,
      l = e.state.facet(ae);
    ((this.optionContent = ky(l)),
      (this.optionClass = l.optionClass),
      (this.tooltipClass = l.tooltipClass),
      (this.range = Ys(r.length, o, l.maxRenderedOptions)),
      (this.dom = document.createElement("div")),
      (this.dom.className = "cm-tooltip-autocomplete"),
      this.updateTooltipClass(e.state),
      this.dom.addEventListener("mousedown", (a) => {
        let { options: h } = e.state.field(t).open;
        for (let c = a.target, f; c && c != this.dom; c = c.parentNode)
          if (
            c.nodeName == "LI" &&
            (f = /-(\d+)$/.exec(c.id)) &&
            +f[1] < h.length
          ) {
            (this.applyCompletion(e, h[+f[1]]), a.preventDefault());
            return;
          }
        if (a.target == this.list) {
          let c =
            this.list.classList.contains("cm-completionListIncompleteTop") &&
            a.clientY < this.list.firstChild.getBoundingClientRect().top
              ? this.range.from - 1
              : this.list.classList.contains(
                    "cm-completionListIncompleteBottom",
                  ) &&
                  a.clientY > this.list.lastChild.getBoundingClientRect().bottom
                ? this.range.to
                : null;
          c != null && (e.dispatch({ effects: Po.of(c) }), a.preventDefault());
        }
      }),
      this.dom.addEventListener("focusout", (a) => {
        let h = e.state.field(this.stateField, !1);
        h &&
          h.tooltip &&
          e.state.facet(ae).closeOnBlur &&
          a.relatedTarget != e.contentDOM &&
          e.dispatch({ effects: ji.of(null) });
      }),
      this.showOptions(r, s.id));
  }
  mount() {
    this.updateSel();
  }
  showOptions(e, t) {
    (this.list && this.list.remove(),
      (this.list = this.dom.appendChild(this.createListBox(e, t, this.range))),
      this.list.addEventListener("scroll", () => {
        this.info && this.view.requestMeasure(this.placeInfoReq);
      }));
  }
  update(e) {
    var t;
    let i = e.state.field(this.stateField),
      s = e.startState.field(this.stateField);
    if ((this.updateTooltipClass(e.state), i != s)) {
      let { options: r, selected: o, disabled: l } = i.open;
      ((!s.open || s.open.options != r) &&
        ((this.range = Ys(r.length, o, e.state.facet(ae).maxRenderedOptions)),
        this.showOptions(r, i.id)),
        this.updateSel(),
        l != ((t = s.open) === null || t === void 0 ? void 0 : t.disabled) &&
          this.dom.classList.toggle("cm-tooltip-autocomplete-disabled", !!l));
    }
  }
  updateTooltipClass(e) {
    let t = this.tooltipClass(e);
    if (t != this.currentClass) {
      for (let i of this.currentClass.split(" "))
        i && this.dom.classList.remove(i);
      for (let i of t.split(" ")) i && this.dom.classList.add(i);
      this.currentClass = t;
    }
  }
  positioned(e) {
    ((this.space = e),
      this.info && this.view.requestMeasure(this.placeInfoReq));
  }
  updateSel() {
    let e = this.view.state.field(this.stateField),
      t = e.open;
    ((t.selected > -1 && t.selected < this.range.from) ||
      t.selected >= this.range.to) &&
      ((this.range = Ys(
        t.options.length,
        t.selected,
        this.view.state.facet(ae).maxRenderedOptions,
      )),
      this.showOptions(t.options, e.id));
    let i = this.updateSelectedOption(t.selected);
    if (i) {
      this.destroyInfo();
      let { completion: s } = t.options[t.selected],
        { info: r } = s;
      if (!r) return;
      let o = typeof r == "string" ? document.createTextNode(r) : r(s);
      if (!o) return;
      "then" in o
        ? o
            .then((l) => {
              l &&
                this.view.state.field(this.stateField, !1) == e &&
                this.addInfoPane(l, s);
            })
            .catch((l) => De(this.view.state, l, "completion info"))
        : (this.addInfoPane(o, s),
          i.setAttribute("aria-describedby", this.info.id));
    }
  }
  addInfoPane(e, t) {
    this.destroyInfo();
    let i = (this.info = document.createElement("div"));
    if (
      ((i.className = "cm-tooltip cm-completionInfo"),
      (i.id =
        "cm-completionInfo-" + Math.floor(Math.random() * 65535).toString(16)),
      e.nodeType != null)
    )
      (i.appendChild(e), (this.infoDestroy = null));
    else {
      let { dom: s, destroy: r } = e;
      (i.appendChild(s), (this.infoDestroy = r || null));
    }
    (this.dom.appendChild(i), this.view.requestMeasure(this.placeInfoReq));
  }
  updateSelectedOption(e) {
    let t = null;
    for (
      let i = this.list.firstChild, s = this.range.from;
      i;
      i = i.nextSibling, s++
    )
      i.nodeName != "LI" || !i.id
        ? s--
        : s == e
          ? i.hasAttribute("aria-selected") ||
            (i.setAttribute("aria-selected", "true"), (t = i))
          : i.hasAttribute("aria-selected") &&
            (i.removeAttribute("aria-selected"),
            i.removeAttribute("aria-describedby"));
    return (t && Ay(this.list, t), t);
  }
  measureInfo() {
    let e = this.dom.querySelector("[aria-selected]");
    if (!e || !this.info) return null;
    let t = this.dom.getBoundingClientRect(),
      i = this.info.getBoundingClientRect(),
      s = e.getBoundingClientRect(),
      r = this.space;
    if (!r) {
      let o = this.dom.ownerDocument.documentElement;
      r = { left: 0, top: 0, right: o.clientWidth, bottom: o.clientHeight };
    }
    return s.top > Math.min(r.bottom, t.bottom) - 10 ||
      s.bottom < Math.max(r.top, t.top) + 10
      ? null
      : this.view.state.facet(ae).positionInfo(this.view, t, s, i, r, this.dom);
  }
  placeInfo(e) {
    this.info &&
      (e
        ? (e.style && (this.info.style.cssText = e.style),
          (this.info.className =
            "cm-tooltip cm-completionInfo " + (e.class || "")))
        : (this.info.style.cssText = "top: -1e6px"));
  }
  createListBox(e, t, i) {
    const s = document.createElement("ul");
    ((s.id = t),
      s.setAttribute("role", "listbox"),
      s.setAttribute("aria-expanded", "true"),
      s.setAttribute("aria-label", this.view.state.phrase("Completions")),
      s.addEventListener("mousedown", (o) => {
        o.target == s && o.preventDefault();
      }));
    let r = null;
    for (let o = i.from; o < i.to; o++) {
      let { completion: l, match: a } = e[o],
        { section: h } = l;
      if (h) {
        let u = typeof h == "string" ? h : h.name;
        if (u != r && (o > i.from || i.from == 0))
          if (((r = u), typeof h != "string" && h.header))
            s.appendChild(h.header(h));
          else {
            let d = s.appendChild(document.createElement("completion-section"));
            d.textContent = u;
          }
      }
      const c = s.appendChild(document.createElement("li"));
      ((c.id = t + "-" + o), c.setAttribute("role", "option"));
      let f = this.optionClass(l);
      f && (c.className = f);
      for (let u of this.optionContent) {
        let d = u(l, this.view.state, this.view, a);
        d && c.appendChild(d);
      }
    }
    return (
      i.from && s.classList.add("cm-completionListIncompleteTop"),
      i.to < e.length && s.classList.add("cm-completionListIncompleteBottom"),
      s
    );
  }
  destroyInfo() {
    this.info &&
      (this.infoDestroy && this.infoDestroy(),
      this.info.remove(),
      (this.info = null));
  }
  destroy() {
    this.destroyInfo();
  }
}
function Cy(n, e) {
  return (t) => new Sy(t, n, e);
}
function Ay(n, e) {
  let t = n.getBoundingClientRect(),
    i = e.getBoundingClientRect(),
    s = t.height / n.offsetHeight;
  i.top < t.top
    ? (n.scrollTop -= (t.top - i.top) / s)
    : i.bottom > t.bottom && (n.scrollTop += (i.bottom - t.bottom) / s);
}
function Ca(n) {
  return (
    (n.boost || 0) * 100 +
    (n.apply ? 10 : 0) +
    (n.info ? 5 : 0) +
    (n.type ? 1 : 0)
  );
}
function My(n, e) {
  let t = [],
    i = null,
    s = null,
    r = (c) => {
      t.push(c);
      let { section: f } = c.completion;
      if (f) {
        i || (i = []);
        let u = typeof f == "string" ? f : f.name;
        i.some((d) => d.name == u) ||
          i.push(typeof f == "string" ? { name: u } : f);
      }
    },
    o = e.facet(ae);
  for (let c of n)
    if (c.hasResult()) {
      let f = c.result.getMatch;
      if (c.result.filter === !1)
        for (let u of c.result.options)
          r(new va(u, c.source, f ? f(u) : [], 1e9 - t.length));
      else {
        let u = e.sliceDoc(c.from, c.to),
          d,
          p = o.filterStrict ? new wy(u) : new xy(u);
        for (let m of c.result.options)
          if ((d = p.match(m.label))) {
            let g = m.displayLabel ? (f ? f(m, d.matched) : []) : d.matched,
              b = d.score + (m.boost || 0);
            if (
              (r(new va(m, c.source, g, b)),
              typeof m.section == "object" && m.section.rank === "dynamic")
            ) {
              let { name: w } = m.section;
              (s || (s = Object.create(null)),
                (s[w] = Math.max(b, s[w] || -1e9)));
            }
          }
      }
    }
  if (i) {
    let c = Object.create(null),
      f = 0,
      u = (d, p) =>
        (d.rank === "dynamic" && p.rank === "dynamic"
          ? s[p.name] - s[d.name]
          : 0) ||
        (typeof d.rank == "number" ? d.rank : 1e9) -
          (typeof p.rank == "number" ? p.rank : 1e9) ||
        (d.name < p.name ? -1 : 1);
    for (let d of i.sort(u)) ((f -= 1e5), (c[d.name] = f));
    for (let d of t) {
      let { section: p } = d.completion;
      p && (d.score += c[typeof p == "string" ? p : p.name]);
    }
  }
  let l = [],
    a = null,
    h = o.compareCompletions;
  for (let c of t.sort(
    (f, u) => u.score - f.score || h(f.completion, u.completion),
  )) {
    let f = c.completion;
    (!a ||
    a.label != f.label ||
    a.detail != f.detail ||
    (a.type != null && f.type != null && a.type != f.type) ||
    a.apply != f.apply ||
    a.boost != f.boost
      ? l.push(c)
      : Ca(c.completion) > Ca(a) && (l[l.length - 1] = c),
      (a = c.completion));
  }
  return l;
}
class Xt {
  constructor(e, t, i, s, r, o) {
    ((this.options = e),
      (this.attrs = t),
      (this.tooltip = i),
      (this.timestamp = s),
      (this.selected = r),
      (this.disabled = o));
  }
  setSelected(e, t) {
    return e == this.selected || e >= this.options.length
      ? this
      : new Xt(
          this.options,
          Aa(t, e),
          this.tooltip,
          this.timestamp,
          e,
          this.disabled,
        );
  }
  static build(e, t, i, s, r, o) {
    if (s && !o && e.some((h) => h.isPending)) return s.setDisabled();
    let l = My(e, t);
    if (!l.length)
      return s && e.some((h) => h.isPending) ? s.setDisabled() : null;
    let a = t.facet(ae).selectOnOpen ? 0 : -1;
    if (s && s.selected != a && s.selected != -1) {
      let h = s.options[s.selected].completion;
      for (let c = 0; c < l.length; c++)
        if (l[c].completion == h) {
          a = c;
          break;
        }
    }
    return new Xt(
      l,
      Aa(i, a),
      {
        pos: e.reduce((h, c) => (c.hasResult() ? Math.min(h, c.from) : h), 1e8),
        create: Ly,
        above: r.aboveCursor,
      },
      s ? s.timestamp : Date.now(),
      a,
      !1,
    );
  }
  map(e) {
    return new Xt(
      this.options,
      this.attrs,
      { ...this.tooltip, pos: e.mapPos(this.tooltip.pos) },
      this.timestamp,
      this.selected,
      this.disabled,
    );
  }
  setDisabled() {
    return new Xt(
      this.options,
      this.attrs,
      this.tooltip,
      this.timestamp,
      this.selected,
      !0,
    );
  }
}
class cs {
  constructor(e, t, i) {
    ((this.active = e), (this.id = t), (this.open = i));
  }
  static start() {
    return new cs(
      By,
      "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36),
      null,
    );
  }
  update(e) {
    let { state: t } = e,
      i = t.facet(ae),
      r = (i.override || t.languageDataAt("autocomplete", Ht(t)).map(by)).map(
        (a) =>
          (
            this.active.find((c) => c.source == a) ||
            new Ve(a, this.active.some((c) => c.state != 0) ? 1 : 0)
          ).update(e, i),
      );
    r.length == this.active.length &&
      r.every((a, h) => a == this.active[h]) &&
      (r = this.active);
    let o = this.open,
      l = e.effects.some((a) => a.is(Ro));
    (o && e.docChanged && (o = o.map(e.changes)),
      e.selection ||
      r.some((a) => a.hasResult() && e.changes.touchesRange(a.from, a.to)) ||
      !Ty(r, this.active) ||
      l
        ? (o = Xt.build(r, t, this.id, o, i, l))
        : o && o.disabled && !r.some((a) => a.isPending) && (o = null),
      !o &&
        r.every((a) => !a.isPending) &&
        r.some((a) => a.hasResult()) &&
        (r = r.map((a) => (a.hasResult() ? new Ve(a.source, 0) : a))));
    for (let a of e.effects)
      a.is(Po) && (o = o && o.setSelected(a.value, this.id));
    return r == this.active && o == this.open ? this : new cs(r, this.id, o);
  }
  get tooltip() {
    return this.open ? this.open.tooltip : null;
  }
  get attrs() {
    return this.open ? this.open.attrs : this.active.length ? Dy : Oy;
  }
}
function Ty(n, e) {
  if (n == e) return !0;
  for (let t = 0, i = 0; ; ) {
    for (; t < n.length && !n[t].hasResult(); ) t++;
    for (; i < e.length && !e[i].hasResult(); ) i++;
    let s = t == n.length,
      r = i == e.length;
    if (s || r) return s == r;
    if (n[t++].result != e[i++].result) return !1;
  }
}
const Dy = { "aria-autocomplete": "list" },
  Oy = {};
function Aa(n, e) {
  let t = {
    "aria-autocomplete": "list",
    "aria-haspopup": "listbox",
    "aria-controls": n,
  };
  return (e > -1 && (t["aria-activedescendant"] = n + "-" + e), t);
}
const By = [];
function Nf(n, e) {
  if (n.isUserEvent("input.complete")) {
    let i = n.annotation(Lo);
    if (i && e.activateOnCompletion(i)) return 12;
  }
  let t = n.isUserEvent("input.type");
  return t && e.activateOnTyping
    ? 5
    : t
      ? 1
      : n.isUserEvent("delete.backward")
        ? 2
        : n.selection
          ? 8
          : n.docChanged
            ? 16
            : 0;
}
class Ve {
  constructor(e, t, i = !1) {
    ((this.source = e), (this.state = t), (this.explicit = i));
  }
  hasResult() {
    return !1;
  }
  get isPending() {
    return this.state == 1;
  }
  update(e, t) {
    let i = Nf(e, t),
      s = this;
    ((i & 8 || (i & 16 && this.touches(e))) && (s = new Ve(s.source, 0)),
      i & 4 && s.state == 0 && (s = new Ve(this.source, 1)),
      (s = s.updateFor(e, i)));
    for (let r of e.effects)
      if (r.is(hs)) s = new Ve(s.source, 1, r.value);
      else if (r.is(ji)) s = new Ve(s.source, 0);
      else if (r.is(Ro)) for (let o of r.value) o.source == s.source && (s = o);
    return s;
  }
  updateFor(e, t) {
    return this.map(e.changes);
  }
  map(e) {
    return this;
  }
  touches(e) {
    return e.changes.touchesRange(Ht(e.state));
  }
}
class si extends Ve {
  constructor(e, t, i, s, r, o) {
    (super(e, 3, t),
      (this.limit = i),
      (this.result = s),
      (this.from = r),
      (this.to = o));
  }
  hasResult() {
    return !0;
  }
  updateFor(e, t) {
    var i;
    if (!(t & 3)) return this.map(e.changes);
    let s = this.result;
    s.map && !e.changes.empty && (s = s.map(s, e.changes));
    let r = e.changes.mapPos(this.from),
      o = e.changes.mapPos(this.to, 1),
      l = Ht(e.state);
    if (
      l > o ||
      !s ||
      (t & 2 && (Ht(e.startState) == this.from || l < this.limit))
    )
      return new Ve(this.source, t & 4 ? 1 : 0);
    let a = e.changes.mapPos(this.limit);
    return Ey(s.validFor, e.state, r, o)
      ? new si(this.source, this.explicit, a, s, r, o)
      : s.update && (s = s.update(s, r, o, new Rf(e.state, l, !1)))
        ? new si(
            this.source,
            this.explicit,
            a,
            s,
            s.from,
            (i = s.to) !== null && i !== void 0 ? i : Ht(e.state),
          )
        : new Ve(this.source, 1, this.explicit);
  }
  map(e) {
    return e.empty
      ? this
      : (this.result.map ? this.result.map(this.result, e) : this.result)
        ? new si(
            this.source,
            this.explicit,
            e.mapPos(this.limit),
            this.result,
            e.mapPos(this.from),
            e.mapPos(this.to, 1),
          )
        : new Ve(this.source, 0);
  }
  touches(e) {
    return e.changes.touchesRange(this.from, this.to);
  }
}
function Ey(n, e, t, i) {
  if (!n) return !1;
  let s = e.sliceDoc(t, i);
  return typeof n == "function" ? n(s, t, i, e) : If(n, !0).test(s);
}
const Ro = R.define({
    map(n, e) {
      return n.map((t) => t.map(e));
    },
  }),
  Me = ce.define({
    create() {
      return cs.start();
    },
    update(n, e) {
      return n.update(e);
    },
    provide: (n) => [
      po.from(n, (e) => e.tooltip),
      A.contentAttributes.from(n, (e) => e.attrs),
    ],
  });
function Io(n, e) {
  const t = e.completion.apply || e.completion.label;
  let i = n.state.field(Me).active.find((s) => s.source == e.source);
  return i instanceof si
    ? (typeof t == "string"
        ? n.dispatch({
            ...yy(n.state, t, i.from, i.to),
            annotations: Lo.of(e.completion),
          })
        : t(n, e.completion, i.from, i.to),
      !0)
    : !1;
}
const Ly = Cy(Me, Io);
function En(n, e = "option") {
  return (t) => {
    let i = t.state.field(Me, !1);
    if (
      !i ||
      !i.open ||
      i.open.disabled ||
      Date.now() - i.open.timestamp < t.state.facet(ae).interactionDelay
    )
      return !1;
    let s = 1,
      r;
    e == "page" &&
      (r = hc(t, i.open.tooltip)) &&
      (s = Math.max(
        2,
        Math.floor(
          r.dom.offsetHeight / r.dom.querySelector("li").offsetHeight,
        ) - 1,
      ));
    let { length: o } = i.open.options,
      l =
        i.open.selected > -1
          ? i.open.selected + s * (n ? 1 : -1)
          : n
            ? 0
            : o - 1;
    return (
      l < 0
        ? (l = e == "page" ? 0 : o - 1)
        : l >= o && (l = e == "page" ? o - 1 : 0),
      t.dispatch({ effects: Po.of(l) }),
      !0
    );
  };
}
const Py = (n) => {
    let e = n.state.field(Me, !1);
    return n.state.readOnly ||
      !e ||
      !e.open ||
      e.open.selected < 0 ||
      e.open.disabled ||
      Date.now() - e.open.timestamp < n.state.facet(ae).interactionDelay
      ? !1
      : Io(n, e.open.options[e.open.selected]);
  },
  Xs = (n) =>
    n.state.field(Me, !1) ? (n.dispatch({ effects: hs.of(!0) }), !0) : !1,
  Ry = (n) => {
    let e = n.state.field(Me, !1);
    return !e || !e.active.some((t) => t.state != 0)
      ? !1
      : (n.dispatch({ effects: ji.of(null) }), !0);
  };
class Iy {
  constructor(e, t) {
    ((this.active = e),
      (this.context = t),
      (this.time = Date.now()),
      (this.updates = []),
      (this.done = void 0));
  }
}
const Ny = 50,
  Wy = 1e3,
  Fy = ne.fromClass(
    class {
      constructor(n) {
        ((this.view = n),
          (this.debounceUpdate = -1),
          (this.running = []),
          (this.debounceAccept = -1),
          (this.pendingStart = !1),
          (this.composing = 0));
        for (let e of n.state.field(Me).active)
          e.isPending && this.startQuery(e);
      }
      update(n) {
        let e = n.state.field(Me),
          t = n.state.facet(ae);
        if (!n.selectionSet && !n.docChanged && n.startState.field(Me) == e)
          return;
        let i = n.transactions.some((r) => {
          let o = Nf(r, t);
          return o & 8 || ((r.selection || r.docChanged) && !(o & 3));
        });
        for (let r = 0; r < this.running.length; r++) {
          let o = this.running[r];
          if (
            i ||
            (o.context.abortOnDocChange && n.docChanged) ||
            (o.updates.length + n.transactions.length > Ny &&
              Date.now() - o.time > Wy)
          ) {
            for (let l of o.context.abortListeners)
              try {
                l();
              } catch (a) {
                De(this.view.state, a);
              }
            ((o.context.abortListeners = null), this.running.splice(r--, 1));
          } else o.updates.push(...n.transactions);
        }
        (this.debounceUpdate > -1 && clearTimeout(this.debounceUpdate),
          n.transactions.some((r) => r.effects.some((o) => o.is(hs))) &&
            (this.pendingStart = !0));
        let s = this.pendingStart ? 50 : t.activateOnTypingDelay;
        if (
          ((this.debounceUpdate = e.active.some(
            (r) =>
              r.isPending &&
              !this.running.some((o) => o.active.source == r.source),
          )
            ? setTimeout(() => this.startUpdate(), s)
            : -1),
          this.composing != 0)
        )
          for (let r of n.transactions)
            r.isUserEvent("input.type")
              ? (this.composing = 2)
              : this.composing == 2 && r.selection && (this.composing = 3);
      }
      startUpdate() {
        ((this.debounceUpdate = -1), (this.pendingStart = !1));
        let { state: n } = this.view,
          e = n.field(Me);
        for (let t of e.active)
          t.isPending &&
            !this.running.some((i) => i.active.source == t.source) &&
            this.startQuery(t);
        this.running.length &&
          e.open &&
          e.open.disabled &&
          (this.debounceAccept = setTimeout(
            () => this.accept(),
            this.view.state.facet(ae).updateSyncTime,
          ));
      }
      startQuery(n) {
        let { state: e } = this.view,
          t = Ht(e),
          i = new Rf(e, t, n.explicit, this.view),
          s = new Iy(n, i);
        (this.running.push(s),
          Promise.resolve(n.source(i)).then(
            (r) => {
              s.context.aborted ||
                ((s.done = r || null), this.scheduleAccept());
            },
            (r) => {
              (this.view.dispatch({ effects: ji.of(null) }),
                De(this.view.state, r));
            },
          ));
      }
      scheduleAccept() {
        this.running.every((n) => n.done !== void 0)
          ? this.accept()
          : this.debounceAccept < 0 &&
            (this.debounceAccept = setTimeout(
              () => this.accept(),
              this.view.state.facet(ae).updateSyncTime,
            ));
      }
      accept() {
        var n;
        (this.debounceAccept > -1 && clearTimeout(this.debounceAccept),
          (this.debounceAccept = -1));
        let e = [],
          t = this.view.state.facet(ae),
          i = this.view.state.field(Me);
        for (let s = 0; s < this.running.length; s++) {
          let r = this.running[s];
          if (r.done === void 0) continue;
          if ((this.running.splice(s--, 1), r.done)) {
            let l = Ht(
                r.updates.length ? r.updates[0].startState : this.view.state,
              ),
              a = Math.min(l, r.done.from + (r.active.explicit ? 0 : 1)),
              h = new si(
                r.active.source,
                r.active.explicit,
                a,
                r.done,
                r.done.from,
                (n = r.done.to) !== null && n !== void 0 ? n : l,
              );
            for (let c of r.updates) h = h.update(c, t);
            if (h.hasResult()) {
              e.push(h);
              continue;
            }
          }
          let o = i.active.find((l) => l.source == r.active.source);
          if (o && o.isPending)
            if (r.done == null) {
              let l = new Ve(r.active.source, 0);
              for (let a of r.updates) l = l.update(a, t);
              l.isPending || e.push(l);
            } else this.startQuery(o);
        }
        (e.length || (i.open && i.open.disabled)) &&
          this.view.dispatch({ effects: Ro.of(e) });
      }
    },
    {
      eventHandlers: {
        blur(n) {
          let e = this.view.state.field(Me, !1);
          if (e && e.tooltip && this.view.state.facet(ae).closeOnBlur) {
            let t = e.open && hc(this.view, e.open.tooltip);
            (!t || !t.dom.contains(n.relatedTarget)) &&
              setTimeout(
                () => this.view.dispatch({ effects: ji.of(null) }),
                10,
              );
          }
        },
        compositionstart() {
          this.composing = 1;
        },
        compositionend() {
          (this.composing == 3 &&
            setTimeout(() => this.view.dispatch({ effects: hs.of(!1) }), 20),
            (this.composing = 0));
        },
      },
    },
  ),
  Hy = typeof navigator == "object" && /Win/.test(navigator.platform),
  Vy = Dt.highest(
    A.domEventHandlers({
      keydown(n, e) {
        let t = e.state.field(Me, !1);
        if (
          !t ||
          !t.open ||
          t.open.disabled ||
          t.open.selected < 0 ||
          n.key.length > 1 ||
          (n.ctrlKey && !(Hy && n.altKey)) ||
          n.metaKey
        )
          return !1;
        let i = t.open.options[t.open.selected],
          s = t.active.find((o) => o.source == i.source),
          r = i.completion.commitCharacters || s.result.commitCharacters;
        return (r && r.indexOf(n.key) > -1 && Io(e, i), !1);
      },
    }),
  ),
  Wf = A.baseTheme({
    ".cm-tooltip.cm-tooltip-autocomplete": {
      "& > ul": {
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        overflow: "hidden auto",
        maxWidth_fallback: "700px",
        maxWidth: "min(700px, 95vw)",
        minWidth: "250px",
        maxHeight: "10em",
        height: "100%",
        listStyle: "none",
        margin: 0,
        padding: 0,
        "& > li, & > completion-section": {
          padding: "1px 3px",
          lineHeight: 1.2,
        },
        "& > li": {
          overflowX: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
        },
        "& > completion-section": {
          display: "list-item",
          borderBottom: "1px solid silver",
          paddingLeft: "0.5em",
          opacity: 0.7,
        },
      },
    },
    "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "#17c",
      color: "white",
    },
    "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
      background: "#777",
    },
    "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
      background: "#347",
      color: "white",
    },
    "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
      background: "#444",
    },
    ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after":
      { content: '"···"', opacity: 0.5, display: "block", textAlign: "center" },
    ".cm-tooltip.cm-completionInfo": {
      position: "absolute",
      padding: "3px 9px",
      width: "max-content",
      maxWidth: "400px",
      boxSizing: "border-box",
      whiteSpace: "pre-line",
    },
    ".cm-completionInfo.cm-completionInfo-left": { right: "100%" },
    ".cm-completionInfo.cm-completionInfo-right": { left: "100%" },
    ".cm-completionInfo.cm-completionInfo-left-narrow": { right: "30px" },
    ".cm-completionInfo.cm-completionInfo-right-narrow": { left: "30px" },
    "&light .cm-snippetField": { backgroundColor: "#00000022" },
    "&dark .cm-snippetField": { backgroundColor: "#ffffff22" },
    ".cm-snippetFieldPosition": {
      verticalAlign: "text-top",
      width: 0,
      height: "1.15em",
      display: "inline-block",
      margin: "0 -0.7px -.7em",
      borderLeft: "1.4px dotted #888",
    },
    ".cm-completionMatchedText": { textDecoration: "underline" },
    ".cm-completionDetail": { marginLeft: "0.5em", fontStyle: "italic" },
    ".cm-completionIcon": {
      fontSize: "90%",
      width: ".8em",
      display: "inline-block",
      textAlign: "center",
      paddingRight: ".6em",
      opacity: "0.6",
      boxSizing: "content-box",
    },
    ".cm-completionIcon-function, .cm-completionIcon-method": {
      "&:after": { content: "'ƒ'" },
    },
    ".cm-completionIcon-class": { "&:after": { content: "'○'" } },
    ".cm-completionIcon-interface": { "&:after": { content: "'◌'" } },
    ".cm-completionIcon-variable": { "&:after": { content: "'𝑥'" } },
    ".cm-completionIcon-constant": { "&:after": { content: "'𝐶'" } },
    ".cm-completionIcon-type": { "&:after": { content: "'𝑡'" } },
    ".cm-completionIcon-enum": { "&:after": { content: "'∪'" } },
    ".cm-completionIcon-property": { "&:after": { content: "'□'" } },
    ".cm-completionIcon-keyword": { "&:after": { content: "'🔑︎'" } },
    ".cm-completionIcon-namespace": { "&:after": { content: "'▢'" } },
    ".cm-completionIcon-text": {
      "&:after": { content: "'abc'", fontSize: "50%", verticalAlign: "middle" },
    },
  });
class zy {
  constructor(e, t, i, s) {
    ((this.field = e), (this.line = t), (this.from = i), (this.to = s));
  }
}
class No {
  constructor(e, t, i) {
    ((this.field = e), (this.from = t), (this.to = i));
  }
  map(e) {
    let t = e.mapPos(this.from, -1, pe.TrackDel),
      i = e.mapPos(this.to, 1, pe.TrackDel);
    return t == null || i == null ? null : new No(this.field, t, i);
  }
}
class Wo {
  constructor(e, t) {
    ((this.lines = e), (this.fieldPositions = t));
  }
  instantiate(e, t) {
    let i = [],
      s = [t],
      r = e.doc.lineAt(t),
      o = /^\s*/.exec(r.text)[0];
    for (let a of this.lines) {
      if (i.length) {
        let h = o,
          c = /^\t*/.exec(a)[0].length;
        for (let f = 0; f < c; f++) h += e.facet(sn);
        (s.push(t + h.length - c), (a = h + a.slice(c)));
      }
      (i.push(a), (t += a.length + 1));
    }
    let l = this.fieldPositions.map(
      (a) => new No(a.field, s[a.line] + a.from, s[a.line] + a.to),
    );
    return { text: i, ranges: l };
  }
  static parse(e) {
    let t = [],
      i = [],
      s = [],
      r;
    for (let o of e.split(/\r\n?|\n/)) {
      for (
        ;
        (r = /[#$]\{(?:(\d+)(?::([^{}]*))?|((?:\\[{}]|[^{}])*))\}/.exec(o));
      ) {
        let l = r[1] ? +r[1] : null,
          a = r[2] || r[3] || "",
          h = -1,
          c = a.replace(/\\[{}]/g, (f) => f[1]);
        for (let f = 0; f < t.length; f++)
          (l != null ? t[f].seq == l : c && t[f].name == c) && (h = f);
        if (h < 0) {
          let f = 0;
          for (
            ;
            f < t.length && (l == null || (t[f].seq != null && t[f].seq < l));
          )
            f++;
          (t.splice(f, 0, { seq: l, name: c }), (h = f));
          for (let u of s) u.field >= h && u.field++;
        }
        for (let f of s)
          if (f.line == i.length && f.from > r.index) {
            let u = r[2] ? 3 + (r[1] || "").length : 2;
            ((f.from -= u), (f.to -= u));
          }
        (s.push(new zy(h, i.length, r.index, r.index + c.length)),
          (o = o.slice(0, r.index) + a + o.slice(r.index + r[0].length)));
      }
      ((o = o.replace(/\\([{}])/g, (l, a, h) => {
        for (let c of s) c.line == i.length && c.from > h && (c.from--, c.to--);
        return a;
      })),
        i.push(o));
    }
    return new Wo(i, s);
  }
}
let _y = L.widget({
    widget: new (class extends Ke {
      toDOM() {
        let n = document.createElement("span");
        return ((n.className = "cm-snippetFieldPosition"), n);
      }
      ignoreEvent() {
        return !1;
      }
    })(),
  }),
  qy = L.mark({ class: "cm-snippetField" });
class gi {
  constructor(e, t) {
    ((this.ranges = e),
      (this.active = t),
      (this.deco = L.set(
        e.map((i) => (i.from == i.to ? _y : qy).range(i.from, i.to)),
        !0,
      )));
  }
  map(e) {
    let t = [];
    for (let i of this.ranges) {
      let s = i.map(e);
      if (!s) return null;
      t.push(s);
    }
    return new gi(t, this.active);
  }
  selectionInsideField(e) {
    return e.ranges.every((t) =>
      this.ranges.some(
        (i) => i.field == this.active && i.from <= t.from && i.to >= t.to,
      ),
    );
  }
}
const an = R.define({
    map(n, e) {
      return n && n.map(e);
    },
  }),
  $y = R.define(),
  Ui = ce.define({
    create() {
      return null;
    },
    update(n, e) {
      for (let t of e.effects) {
        if (t.is(an)) return t.value;
        if (t.is($y) && n) return new gi(n.ranges, t.value);
      }
      return (
        n && e.docChanged && (n = n.map(e.changes)),
        n && e.selection && !n.selectionInsideField(e.selection) && (n = null),
        n
      );
    },
    provide: (n) => A.decorations.from(n, (e) => (e ? e.deco : L.none)),
  });
function Fo(n, e) {
  return x.create(
    n.filter((t) => t.field == e).map((t) => x.range(t.from, t.to)),
  );
}
function Ky(n) {
  let e = Wo.parse(n);
  return (t, i, s, r) => {
    let { text: o, ranges: l } = e.instantiate(t.state, s),
      { main: a } = t.state.selection,
      h = {
        changes: { from: s, to: r == a.from ? a.to : r, insert: q.of(o) },
        scrollIntoView: !0,
        annotations: i ? [Lo.of(i), oe.userEvent.of("input.complete")] : void 0,
      };
    if ((l.length && (h.selection = Fo(l, 0)), l.some((c) => c.field > 0))) {
      let c = new gi(l, 0),
        f = (h.effects = [an.of(c)]);
      t.state.field(Ui, !1) === void 0 &&
        f.push(R.appendConfig.of([Ui, Yy, Xy, Wf]));
    }
    t.dispatch(t.state.update(h));
  };
}
function Ff(n) {
  return ({ state: e, dispatch: t }) => {
    let i = e.field(Ui, !1);
    if (!i || (n < 0 && i.active == 0)) return !1;
    let s = i.active + n,
      r = n > 0 && !i.ranges.some((o) => o.field == s + n);
    return (
      t(
        e.update({
          selection: Fo(i.ranges, s),
          effects: an.of(r ? null : new gi(i.ranges, s)),
          scrollIntoView: !0,
        }),
      ),
      !0
    );
  };
}
const jy = ({ state: n, dispatch: e }) =>
    n.field(Ui, !1) ? (e(n.update({ effects: an.of(null) })), !0) : !1,
  Uy = Ff(1),
  Gy = Ff(-1),
  Jy = [
    { key: "Tab", run: Uy, shift: Gy },
    { key: "Escape", run: jy },
  ],
  Ma = D.define({
    combine(n) {
      return n.length ? n[0] : Jy;
    },
  }),
  Yy = Dt.highest(tn.compute([Ma], (n) => n.facet(Ma)));
function u1(n, e) {
  return { ...e, apply: Ky(n) };
}
const Xy = A.domEventHandlers({
    mousedown(n, e) {
      let t = e.state.field(Ui, !1),
        i;
      if (!t || (i = e.posAtCoords({ x: n.clientX, y: n.clientY })) == null)
        return !1;
      let s = t.ranges.find((r) => r.from <= i && r.to >= i);
      return !s || s.field == t.active
        ? !1
        : (e.dispatch({
            selection: Fo(t.ranges, s.field),
            effects: an.of(
              t.ranges.some((r) => r.field > s.field)
                ? new gi(t.ranges, s.field)
                : null,
            ),
            scrollIntoView: !0,
          }),
          !0);
    },
  }),
  Gi = {
    brackets: ["(", "[", "{", "'", '"'],
    before: ")]}:;>",
    stringPrefixes: [],
  },
  Ft = R.define({
    map(n, e) {
      let t = e.mapPos(n, -1, pe.TrackAfter);
      return t ?? void 0;
    },
  }),
  Ho = new (class extends vt {})();
Ho.startSide = 1;
Ho.endSide = -1;
const Hf = ce.define({
  create() {
    return z.empty;
  },
  update(n, e) {
    if (((n = n.map(e.changes)), e.selection)) {
      let t = e.state.doc.lineAt(e.selection.main.head);
      n = n.update({ filter: (i) => i >= t.from && i <= t.to });
    }
    for (let t of e.effects)
      t.is(Ft) && (n = n.update({ add: [Ho.range(t.value, t.value + 1)] }));
    return n;
  },
});
function Qy() {
  return [eb, Hf];
}
const Qs = "()[]{}<>«»»«［］｛｝";
function Vf(n) {
  for (let e = 0; e < Qs.length; e += 2)
    if (Qs.charCodeAt(e) == n) return Qs.charAt(e + 1);
  return Yr(n < 128 ? n : n + 1);
}
function zf(n, e) {
  return n.languageDataAt("closeBrackets", e)[0] || Gi;
}
const Zy =
    typeof navigator == "object" && /Android\b/.test(navigator.userAgent),
  eb = A.inputHandler.of((n, e, t, i) => {
    if ((Zy ? n.composing : n.compositionStarted) || n.state.readOnly)
      return !1;
    let s = n.state.selection.main;
    if (
      i.length > 2 ||
      (i.length == 2 && et(Ae(i, 0)) == 1) ||
      e != s.from ||
      t != s.to
    )
      return !1;
    let r = nb(n.state, i);
    return r ? (n.dispatch(r), !0) : !1;
  }),
  tb = ({ state: n, dispatch: e }) => {
    if (n.readOnly) return !1;
    let i = zf(n, n.selection.main.head).brackets || Gi.brackets,
      s = null,
      r = n.changeByRange((o) => {
        if (o.empty) {
          let l = sb(n.doc, o.head);
          for (let a of i)
            if (a == l && Cs(n.doc, o.head) == Vf(Ae(a, 0)))
              return {
                changes: { from: o.head - a.length, to: o.head + a.length },
                range: x.cursor(o.head - a.length),
              };
        }
        return { range: (s = o) };
      });
    return (
      s || e(n.update(r, { scrollIntoView: !0, userEvent: "delete.backward" })),
      !s
    );
  },
  ib = [{ key: "Backspace", run: tb }];
function nb(n, e) {
  let t = zf(n, n.selection.main.head),
    i = t.brackets || Gi.brackets;
  for (let s of i) {
    let r = Vf(Ae(s, 0));
    if (e == s)
      return r == s
        ? lb(n, s, i.indexOf(s + s + s) > -1, t)
        : rb(n, s, r, t.before || Gi.before);
    if (e == r && _f(n, n.selection.main.from)) return ob(n, s, r);
  }
  return null;
}
function _f(n, e) {
  let t = !1;
  return (
    n.field(Hf).between(0, n.doc.length, (i) => {
      i == e && (t = !0);
    }),
    t
  );
}
function Cs(n, e) {
  let t = n.sliceString(e, e + 2);
  return t.slice(0, et(Ae(t, 0)));
}
function sb(n, e) {
  let t = n.sliceString(e - 2, e);
  return et(Ae(t, 0)) == t.length ? t : t.slice(1);
}
function rb(n, e, t, i) {
  let s = null,
    r = n.changeByRange((o) => {
      if (!o.empty)
        return {
          changes: [
            { insert: e, from: o.from },
            { insert: t, from: o.to },
          ],
          effects: Ft.of(o.to + e.length),
          range: x.range(o.anchor + e.length, o.head + e.length),
        };
      let l = Cs(n.doc, o.head);
      return !l || /\s/.test(l) || i.indexOf(l) > -1
        ? {
            changes: { insert: e + t, from: o.head },
            effects: Ft.of(o.head + e.length),
            range: x.cursor(o.head + e.length),
          }
        : { range: (s = o) };
    });
  return s
    ? null
    : n.update(r, { scrollIntoView: !0, userEvent: "input.type" });
}
function ob(n, e, t) {
  let i = null,
    s = n.changeByRange((r) =>
      r.empty && Cs(n.doc, r.head) == t
        ? {
            changes: { from: r.head, to: r.head + t.length, insert: t },
            range: x.cursor(r.head + t.length),
          }
        : (i = { range: r }),
    );
  return i
    ? null
    : n.update(s, { scrollIntoView: !0, userEvent: "input.type" });
}
function lb(n, e, t, i) {
  let s = i.stringPrefixes || Gi.stringPrefixes,
    r = null,
    o = n.changeByRange((l) => {
      if (!l.empty)
        return {
          changes: [
            { insert: e, from: l.from },
            { insert: e, from: l.to },
          ],
          effects: Ft.of(l.to + e.length),
          range: x.range(l.anchor + e.length, l.head + e.length),
        };
      let a = l.head,
        h = Cs(n.doc, a),
        c;
      if (h == e) {
        if (Ta(n, a))
          return {
            changes: { insert: e + e, from: a },
            effects: Ft.of(a + e.length),
            range: x.cursor(a + e.length),
          };
        if (_f(n, a)) {
          let u =
            t && n.sliceDoc(a, a + e.length * 3) == e + e + e ? e + e + e : e;
          return {
            changes: { from: a, to: a + u.length, insert: u },
            range: x.cursor(a + u.length),
          };
        }
      } else {
        if (
          t &&
          n.sliceDoc(a - 2 * e.length, a) == e + e &&
          (c = Da(n, a - 2 * e.length, s)) > -1 &&
          Ta(n, c)
        )
          return {
            changes: { insert: e + e + e + e, from: a },
            effects: Ft.of(a + e.length),
            range: x.cursor(a + e.length),
          };
        if (
          n.charCategorizer(a)(h) != Q.Word &&
          Da(n, a, s) > -1 &&
          !ab(n, a, e, s)
        )
          return {
            changes: { insert: e + e, from: a },
            effects: Ft.of(a + e.length),
            range: x.cursor(a + e.length),
          };
      }
      return { range: (r = l) };
    });
  return r
    ? null
    : n.update(o, { scrollIntoView: !0, userEvent: "input.type" });
}
function Ta(n, e) {
  let t = ge(n).resolveInner(e + 1);
  return t.parent && t.from == e;
}
function ab(n, e, t, i) {
  let s = ge(n).resolveInner(e, -1),
    r = i.reduce((o, l) => Math.max(o, l.length), 0);
  for (let o = 0; o < 5; o++) {
    let l = n.sliceDoc(s.from, Math.min(s.to, s.from + t.length + r)),
      a = l.indexOf(t);
    if (!a || (a > -1 && i.indexOf(l.slice(0, a)) > -1)) {
      let c = s.firstChild;
      for (; c && c.from == s.from && c.to - c.from > t.length + a; ) {
        if (n.sliceDoc(c.to - t.length, c.to) == t) return !1;
        c = c.firstChild;
      }
      return !0;
    }
    let h = s.to == e && s.parent;
    if (!h) break;
    s = h;
  }
  return !1;
}
function Da(n, e, t) {
  let i = n.charCategorizer(e);
  if (i(n.sliceDoc(e - 1, e)) != Q.Word) return e;
  for (let s of t) {
    let r = e - s.length;
    if (n.sliceDoc(r, e) == s && i(n.sliceDoc(r - 1, r)) != Q.Word) return r;
  }
  return -1;
}
function hb(n = {}) {
  return [Vy, Me, ae.of(n), Fy, cb, Wf];
}
const qf = [
    { key: "Ctrl-Space", run: Xs },
    { mac: "Alt-`", run: Xs },
    { mac: "Alt-i", run: Xs },
    { key: "Escape", run: Ry },
    { key: "ArrowDown", run: En(!0) },
    { key: "ArrowUp", run: En(!1) },
    { key: "PageDown", run: En(!0, "page") },
    { key: "PageUp", run: En(!1, "page") },
    { key: "Enter", run: Py },
  ],
  cb = Dt.highest(
    tn.computeN([ae], (n) => (n.facet(ae).defaultKeymap ? [qf] : [])),
  );
class Oa {
  constructor(e, t, i) {
    ((this.from = e), (this.to = t), (this.diagnostic = i));
  }
}
class Rt {
  constructor(e, t, i) {
    ((this.diagnostics = e), (this.panel = t), (this.selected = i));
  }
  static init(e, t, i) {
    let s = i.facet(Ji).markerFilter;
    s && (e = s(e, i));
    let r = e.slice().sort((d, p) => d.from - p.from || d.to - p.to),
      o = new ut(),
      l = [],
      a = 0,
      h = i.doc.iter(),
      c = 0,
      f = i.doc.length;
    for (let d = 0; ; ) {
      let p = d == r.length ? null : r[d];
      if (!p && !l.length) break;
      let m, g;
      if (l.length)
        ((m = a),
          (g = l.reduce(
            (v, T) => Math.min(v, T.to),
            p && p.from > m ? p.from : 1e8,
          )));
      else {
        if (((m = p.from), m > f)) break;
        ((g = p.to), l.push(p), d++);
      }
      for (; d < r.length; ) {
        let v = r[d];
        if (v.from == m && (v.to > v.from || v.to == m))
          (l.push(v), d++, (g = Math.min(v.to, g)));
        else {
          g = Math.min(v.from, g);
          break;
        }
      }
      g = Math.min(g, f);
      let b = !1;
      if (
        l.some((v) => v.from == m && (v.to == g || g == f)) &&
        ((b = m == g), !b && g - m < 10)
      ) {
        let v = m - (c + h.value.length);
        v > 0 && (h.next(v), (c = m));
        for (let T = m; ; ) {
          if (T >= g) {
            b = !0;
            break;
          }
          if (!h.lineBreak && c + h.value.length > T) break;
          ((T = c + h.value.length), (c += h.value.length), h.next());
        }
      }
      let w = Sb(l);
      if (b)
        o.add(m, m, L.widget({ widget: new xb(w), diagnostics: l.slice() }));
      else {
        let v = l.reduce(
          (T, k) => (k.markClass ? T + " " + k.markClass : T),
          "",
        );
        o.add(
          m,
          g,
          L.mark({
            class: "cm-lintRange cm-lintRange-" + w + v,
            diagnostics: l.slice(),
            inclusiveEnd: l.some((T) => T.to > g),
          }),
        );
      }
      if (((a = g), a == f)) break;
      for (let v = 0; v < l.length; v++) l[v].to <= a && l.splice(v--, 1);
    }
    let u = o.finish();
    return new Rt(u, t, Tt(u));
  }
}
function Tt(n, e = null, t = 0) {
  let i = null;
  return (
    n.between(t, 1e9, (s, r, { spec: o }) => {
      if (!(e && o.diagnostics.indexOf(e) < 0))
        if (!i) i = new Oa(s, r, e || o.diagnostics[0]);
        else {
          if (o.diagnostics.indexOf(i.diagnostic) < 0) return !1;
          i = new Oa(i.from, r, i.diagnostic);
        }
    }),
    i
  );
}
function fb(n, e) {
  let t = e.pos,
    i = e.end || t,
    s = n.state.facet(Ji).hideOn(n, t, i);
  if (s != null) return s;
  let r = n.startState.doc.lineAt(e.pos);
  return !!(
    n.effects.some((o) => o.is($f)) ||
    n.changes.touchesRange(r.from, Math.max(r.to, i))
  );
}
function ub(n, e) {
  return n.field(Pe, !1) ? e : e.concat(R.appendConfig.of(Cb));
}
const $f = R.define(),
  Vo = R.define(),
  Kf = R.define(),
  Pe = ce.define({
    create() {
      return new Rt(L.none, null, null);
    },
    update(n, e) {
      if (e.docChanged && n.diagnostics.size) {
        let t = n.diagnostics.map(e.changes),
          i = null,
          s = n.panel;
        if (n.selected) {
          let r = e.changes.mapPos(n.selected.from, 1);
          i = Tt(t, n.selected.diagnostic, r) || Tt(t, null, r);
        }
        (!t.size && s && e.state.facet(Ji).autoPanel && (s = null),
          (n = new Rt(t, s, i)));
      }
      for (let t of e.effects)
        if (t.is($f)) {
          let i = e.state.facet(Ji).autoPanel
            ? t.value.length
              ? Yi.open
              : null
            : n.panel;
          n = Rt.init(t.value, i, e.state);
        } else
          t.is(Vo)
            ? (n = new Rt(n.diagnostics, t.value ? Yi.open : null, n.selected))
            : t.is(Kf) && (n = new Rt(n.diagnostics, n.panel, t.value));
      return n;
    },
    provide: (n) => [
      Vi.from(n, (e) => e.panel),
      A.decorations.from(n, (e) => e.diagnostics),
    ],
  }),
  db = L.mark({ class: "cm-lintRange cm-lintRange-active" });
function pb(n, e, t) {
  let { diagnostics: i } = n.state.field(Pe),
    s,
    r = -1,
    o = -1;
  i.between(e - (t < 0 ? 1 : 0), e + (t > 0 ? 1 : 0), (a, h, { spec: c }) => {
    if (e >= a && e <= h && (a == h || ((e > a || t > 0) && (e < h || t < 0))))
      return ((s = c.diagnostics), (r = a), (o = h), !1);
  });
  let l = n.state.facet(Ji).tooltipFilter;
  return (
    s && l && (s = l(s, n.state)),
    s
      ? {
          pos: r,
          end: o,
          above: n.state.doc.lineAt(r).to < o,
          create() {
            return { dom: mb(n, s) };
          },
        }
      : null
  );
}
function mb(n, e) {
  return K(
    "ul",
    { class: "cm-tooltip-lint" },
    e.map((t) => Uf(n, t, !1)),
  );
}
const gb = (n) => {
    let e = n.state.field(Pe, !1);
    (!e || !e.panel) && n.dispatch({ effects: ub(n.state, [Vo.of(!0)]) });
    let t = mo(n, Yi.open);
    return (t && t.dom.querySelector(".cm-panel-lint ul").focus(), !0);
  },
  Ba = (n) => {
    let e = n.state.field(Pe, !1);
    return !e || !e.panel ? !1 : (n.dispatch({ effects: Vo.of(!1) }), !0);
  },
  yb = (n) => {
    let e = n.state.field(Pe, !1);
    if (!e) return !1;
    let t = n.state.selection.main,
      i = Tt(e.diagnostics, null, t.to + 1);
    return !i &&
      ((i = Tt(e.diagnostics, null, 0)),
      !i || (i.from == t.from && i.to == t.to))
      ? !1
      : (n.dispatch({
          selection: { anchor: i.from, head: i.to },
          scrollIntoView: !0,
        }),
        !0);
  },
  bb = [
    { key: "Mod-Shift-m", run: gb, preventDefault: !0 },
    { key: "F8", run: yb },
  ],
  Ji = D.define({
    combine(n) {
      return {
        sources: n.map((e) => e.source).filter((e) => e != null),
        ...at(
          n.map((e) => e.config),
          {
            delay: 750,
            markerFilter: null,
            tooltipFilter: null,
            needsRefresh: null,
            hideOn: () => null,
          },
          {
            delay: Math.max,
            markerFilter: Ea,
            tooltipFilter: Ea,
            needsRefresh: (e, t) => (e ? (t ? (i) => e(i) || t(i) : e) : t),
            hideOn: (e, t) =>
              e ? (t ? (i, s, r) => e(i, s, r) || t(i, s, r) : e) : t,
            autoPanel: (e, t) => e || t,
          },
        ),
      };
    },
  });
function Ea(n, e) {
  return n ? (e ? (t, i) => e(n(t, i), i) : n) : e;
}
function jf(n) {
  let e = [];
  if (n)
    e: for (let { name: t } of n) {
      for (let i = 0; i < t.length; i++) {
        let s = t[i];
        if (
          /[a-zA-Z]/.test(s) &&
          !e.some((r) => r.toLowerCase() == s.toLowerCase())
        ) {
          e.push(s);
          continue e;
        }
      }
      e.push("");
    }
  return e;
}
function Uf(n, e, t) {
  var i;
  let s = t ? jf(e.actions) : [];
  return K(
    "li",
    { class: "cm-diagnostic cm-diagnostic-" + e.severity },
    K(
      "span",
      { class: "cm-diagnosticText" },
      e.renderMessage ? e.renderMessage(n) : e.message,
    ),
    (i = e.actions) === null || i === void 0
      ? void 0
      : i.map((r, o) => {
          let l = !1,
            a = (d) => {
              if ((d.preventDefault(), l)) return;
              l = !0;
              let p = Tt(n.state.field(Pe).diagnostics, e);
              p && r.apply(n, p.from, p.to);
            },
            { name: h } = r,
            c = s[o] ? h.indexOf(s[o]) : -1,
            f =
              c < 0
                ? h
                : [h.slice(0, c), K("u", h.slice(c, c + 1)), h.slice(c + 1)],
            u = r.markClass ? " " + r.markClass : "";
          return K(
            "button",
            {
              type: "button",
              class: "cm-diagnosticAction" + u,
              onclick: a,
              onmousedown: a,
              "aria-label": ` Action: ${h}${c < 0 ? "" : ` (access key "${s[o]})"`}.`,
            },
            f,
          );
        }),
    e.source && K("div", { class: "cm-diagnosticSource" }, e.source),
  );
}
class xb extends Ke {
  constructor(e) {
    (super(), (this.sev = e));
  }
  eq(e) {
    return e.sev == this.sev;
  }
  toDOM() {
    return K("span", { class: "cm-lintPoint cm-lintPoint-" + this.sev });
  }
}
class La {
  constructor(e, t) {
    ((this.diagnostic = t),
      (this.id = "item_" + Math.floor(Math.random() * 4294967295).toString(16)),
      (this.dom = Uf(e, t, !0)),
      (this.dom.id = this.id),
      this.dom.setAttribute("role", "option"));
  }
}
class Yi {
  constructor(e) {
    ((this.view = e), (this.items = []));
    let t = (s) => {
        if (!(s.ctrlKey || s.altKey || s.metaKey)) {
          if (s.keyCode == 27) (Ba(this.view), this.view.focus());
          else if (s.keyCode == 38 || s.keyCode == 33)
            this.moveSelection(
              (this.selectedIndex - 1 + this.items.length) % this.items.length,
            );
          else if (s.keyCode == 40 || s.keyCode == 34)
            this.moveSelection((this.selectedIndex + 1) % this.items.length);
          else if (s.keyCode == 36) this.moveSelection(0);
          else if (s.keyCode == 35) this.moveSelection(this.items.length - 1);
          else if (s.keyCode == 13) this.view.focus();
          else if (
            s.keyCode >= 65 &&
            s.keyCode <= 90 &&
            this.selectedIndex >= 0
          ) {
            let { diagnostic: r } = this.items[this.selectedIndex],
              o = jf(r.actions);
            for (let l = 0; l < o.length; l++)
              if (o[l].toUpperCase().charCodeAt(0) == s.keyCode) {
                let a = Tt(this.view.state.field(Pe).diagnostics, r);
                a && r.actions[l].apply(e, a.from, a.to);
              }
          } else return;
          s.preventDefault();
        }
      },
      i = (s) => {
        for (let r = 0; r < this.items.length; r++)
          this.items[r].dom.contains(s.target) && this.moveSelection(r);
      };
    ((this.list = K("ul", {
      tabIndex: 0,
      role: "listbox",
      "aria-label": this.view.state.phrase("Diagnostics"),
      onkeydown: t,
      onclick: i,
    })),
      (this.dom = K(
        "div",
        { class: "cm-panel-lint" },
        this.list,
        K(
          "button",
          {
            type: "button",
            name: "close",
            "aria-label": this.view.state.phrase("close"),
            onclick: () => Ba(this.view),
          },
          "×",
        ),
      )),
      this.update());
  }
  get selectedIndex() {
    let e = this.view.state.field(Pe).selected;
    if (!e) return -1;
    for (let t = 0; t < this.items.length; t++)
      if (this.items[t].diagnostic == e.diagnostic) return t;
    return -1;
  }
  update() {
    let { diagnostics: e, selected: t } = this.view.state.field(Pe),
      i = 0,
      s = !1,
      r = null,
      o = new Set();
    for (
      e.between(0, this.view.state.doc.length, (l, a, { spec: h }) => {
        for (let c of h.diagnostics) {
          if (o.has(c)) continue;
          o.add(c);
          let f = -1,
            u;
          for (let d = i; d < this.items.length; d++)
            if (this.items[d].diagnostic == c) {
              f = d;
              break;
            }
          (f < 0
            ? ((u = new La(this.view, c)), this.items.splice(i, 0, u), (s = !0))
            : ((u = this.items[f]),
              f > i && (this.items.splice(i, f - i), (s = !0))),
            t && u.diagnostic == t.diagnostic
              ? u.dom.hasAttribute("aria-selected") ||
                (u.dom.setAttribute("aria-selected", "true"), (r = u))
              : u.dom.hasAttribute("aria-selected") &&
                u.dom.removeAttribute("aria-selected"),
            i++);
        }
      });
      i < this.items.length &&
      !(this.items.length == 1 && this.items[0].diagnostic.from < 0);
    )
      ((s = !0), this.items.pop());
    (this.items.length == 0 &&
      (this.items.push(
        new La(this.view, {
          from: -1,
          to: -1,
          severity: "info",
          message: this.view.state.phrase("No diagnostics"),
        }),
      ),
      (s = !0)),
      r
        ? (this.list.setAttribute("aria-activedescendant", r.id),
          this.view.requestMeasure({
            key: this,
            read: () => ({
              sel: r.dom.getBoundingClientRect(),
              panel: this.list.getBoundingClientRect(),
            }),
            write: ({ sel: l, panel: a }) => {
              let h = a.height / this.list.offsetHeight;
              l.top < a.top
                ? (this.list.scrollTop -= (a.top - l.top) / h)
                : l.bottom > a.bottom &&
                  (this.list.scrollTop += (l.bottom - a.bottom) / h);
            },
          }))
        : this.selectedIndex < 0 &&
          this.list.removeAttribute("aria-activedescendant"),
      s && this.sync());
  }
  sync() {
    let e = this.list.firstChild;
    function t() {
      let i = e;
      ((e = i.nextSibling), i.remove());
    }
    for (let i of this.items)
      if (i.dom.parentNode == this.list) {
        for (; e != i.dom; ) t();
        e = i.dom.nextSibling;
      } else this.list.insertBefore(i.dom, e);
    for (; e; ) t();
  }
  moveSelection(e) {
    if (this.selectedIndex < 0) return;
    let t = this.view.state.field(Pe),
      i = Tt(t.diagnostics, this.items[e].diagnostic);
    i &&
      this.view.dispatch({
        selection: { anchor: i.from, head: i.to },
        scrollIntoView: !0,
        effects: Kf.of(i),
      });
  }
  static open(e) {
    return new Yi(e);
  }
}
function wb(n, e = 'viewBox="0 0 40 40"') {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${e}>${encodeURIComponent(n)}</svg>')`;
}
function Ln(n) {
  return wb(
    `<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${n}" fill="none" stroke-width=".7"/>`,
    'width="6" height="3"',
  );
}
const vb = A.baseTheme({
  ".cm-diagnostic": {
    padding: "3px 6px 3px 8px",
    marginLeft: "-1px",
    display: "block",
    whiteSpace: "pre-wrap",
  },
  ".cm-diagnostic-error": { borderLeft: "5px solid #d11" },
  ".cm-diagnostic-warning": { borderLeft: "5px solid orange" },
  ".cm-diagnostic-info": { borderLeft: "5px solid #999" },
  ".cm-diagnostic-hint": { borderLeft: "5px solid #66d" },
  ".cm-diagnosticAction": {
    font: "inherit",
    border: "none",
    padding: "2px 4px",
    backgroundColor: "#444",
    color: "white",
    borderRadius: "3px",
    marginLeft: "8px",
    cursor: "pointer",
  },
  ".cm-diagnosticSource": { fontSize: "70%", opacity: 0.7 },
  ".cm-lintRange": {
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
    paddingBottom: "0.7px",
  },
  ".cm-lintRange-error": { backgroundImage: Ln("#d11") },
  ".cm-lintRange-warning": { backgroundImage: Ln("orange") },
  ".cm-lintRange-info": { backgroundImage: Ln("#999") },
  ".cm-lintRange-hint": { backgroundImage: Ln("#66d") },
  ".cm-lintRange-active": { backgroundColor: "#ffdd9980" },
  ".cm-tooltip-lint": { padding: 0, margin: 0 },
  ".cm-lintPoint": {
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-2px",
      borderLeft: "3px solid transparent",
      borderRight: "3px solid transparent",
      borderBottom: "4px solid #d11",
    },
  },
  ".cm-lintPoint-warning": { "&:after": { borderBottomColor: "orange" } },
  ".cm-lintPoint-info": { "&:after": { borderBottomColor: "#999" } },
  ".cm-lintPoint-hint": { "&:after": { borderBottomColor: "#66d" } },
  ".cm-panel.cm-panel-lint": {
    position: "relative",
    "& ul": {
      maxHeight: "100px",
      overflowY: "auto",
      "& [aria-selected]": {
        backgroundColor: "#ddd",
        "& u": { textDecoration: "underline" },
      },
      "&:focus [aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText",
      },
      "& u": { textDecoration: "none" },
      padding: 0,
      margin: 0,
    },
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "2px",
      background: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0,
    },
  },
  "&dark .cm-lintRange-active": { backgroundColor: "#86714a80" },
  "&dark .cm-panel.cm-panel-lint ul": {
    "& [aria-selected]": { backgroundColor: "#2e343e" },
  },
});
function kb(n) {
  return n == "error" ? 4 : n == "warning" ? 3 : n == "info" ? 2 : 1;
}
function Sb(n) {
  let e = "hint",
    t = 1;
  for (let i of n) {
    let s = kb(i.severity);
    s > t && ((t = s), (e = i.severity));
  }
  return e;
}
const Cb = [
  Pe,
  A.decorations.compute([Pe], (n) => {
    let { selected: e, panel: t } = n.field(Pe);
    return !e || !t || e.from == e.to
      ? L.none
      : L.set([db.range(e.from, e.to)]);
  }),
  Jp(pb, { hideOn: fb }),
  vb,
];
var Pa = function (e) {
  e === void 0 && (e = {});
  var { crosshairCursor: t = !1 } = e,
    i = [];
  (e.closeBracketsKeymap !== !1 && (i = i.concat(ib)),
    e.defaultKeymap !== !1 && (i = i.concat(F0)),
    e.searchKeymap !== !1 && (i = i.concat(fy)),
    e.historyKeymap !== !1 && (i = i.concat(Kg)),
    e.foldKeymap !== !1 && (i = i.concat(tg)),
    e.completionKeymap !== !1 && (i = i.concat(qf)),
    e.lintKeymap !== !1 && (i = i.concat(bb)));
  var s = [];
  return (
    e.lineNumbers !== !1 && s.push(mc()),
    e.highlightActiveLineGutter !== !1 && s.push(cm()),
    e.highlightSpecialChars !== !1 && s.push(Cp()),
    e.history !== !1 && s.push(Ng()),
    e.foldGutter !== !1 && s.push(rg()),
    e.drawSelection !== !1 && s.push(dp()),
    e.dropCursor !== !1 && s.push(bp()),
    e.allowMultipleSelections !== !1 &&
      s.push(_.allowMultipleSelections.of(!0)),
    e.indentOnInput !== !1 && s.push(Km()),
    e.syntaxHighlighting !== !1 && s.push(ko(hg, { fallback: !0 })),
    e.bracketMatching !== !1 && s.push(gg()),
    e.closeBrackets !== !1 && s.push(Qy()),
    e.autocompletion !== !1 && s.push(hb()),
    e.rectangularSelection !== !1 && s.push(Fp()),
    t !== !1 && s.push(zp()),
    e.highlightActiveLine !== !1 && s.push(Bp()),
    e.highlightSelectionMatches !== !1 && s.push($0()),
    e.tabSize &&
      typeof e.tabSize == "number" &&
      s.push(sn.of(" ".repeat(e.tabSize))),
    s.concat([tn.of(i.flat())]).filter(Boolean)
  );
};
const Ab = "#e5c07b",
  Ra = "#e06c75",
  Mb = "#56b6c2",
  Tb = "#ffffff",
  Vn = "#abb2bf",
  Gr = "#7d8799",
  Db = "#61afef",
  Ob = "#98c379",
  Ia = "#d19a66",
  Bb = "#c678dd",
  Eb = "#21252b",
  Na = "#2c313a",
  Wa = "#282c34",
  Zs = "#353a42",
  Lb = "#3E4451",
  Fa = "#528bff",
  Pb = A.theme(
    {
      "&": { color: Vn, backgroundColor: Wa },
      ".cm-content": { caretColor: Fa },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: Fa },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        { backgroundColor: Lb },
      ".cm-panels": { backgroundColor: Eb, color: Vn },
      ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
      ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },
      ".cm-searchMatch": {
        backgroundColor: "#72a1ff59",
        outline: "1px solid #457dff",
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "#6199ff2f",
      },
      ".cm-activeLine": { backgroundColor: "#6699ff0b" },
      ".cm-selectionMatch": { backgroundColor: "#aafe661a" },
      "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "#bad0f847",
      },
      ".cm-gutters": { backgroundColor: Wa, color: Gr, border: "none" },
      ".cm-activeLineGutter": { backgroundColor: Na },
      ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: "#ddd",
      },
      ".cm-tooltip": { border: "none", backgroundColor: Zs },
      ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      },
      ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: Zs,
        borderBottomColor: Zs,
      },
      ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": { backgroundColor: Na, color: Vn },
      },
    },
    { dark: !0 },
  ),
  Rb = di.define([
    { tag: y.keyword, color: Bb },
    {
      tag: [y.name, y.deleted, y.character, y.propertyName, y.macroName],
      color: Ra,
    },
    { tag: [y.function(y.variableName), y.labelName], color: Db },
    { tag: [y.color, y.constant(y.name), y.standard(y.name)], color: Ia },
    { tag: [y.definition(y.name), y.separator], color: Vn },
    {
      tag: [
        y.typeName,
        y.className,
        y.number,
        y.changed,
        y.annotation,
        y.modifier,
        y.self,
        y.namespace,
      ],
      color: Ab,
    },
    {
      tag: [
        y.operator,
        y.operatorKeyword,
        y.url,
        y.escape,
        y.regexp,
        y.link,
        y.special(y.string),
      ],
      color: Mb,
    },
    { tag: [y.meta, y.comment], color: Gr },
    { tag: y.strong, fontWeight: "bold" },
    { tag: y.emphasis, fontStyle: "italic" },
    { tag: y.strikethrough, textDecoration: "line-through" },
    { tag: y.link, color: Gr, textDecoration: "underline" },
    { tag: y.heading, fontWeight: "bold", color: Ra },
    { tag: [y.atom, y.bool, y.special(y.variableName)], color: Ia },
    { tag: [y.processingInstruction, y.string, y.inserted], color: Ob },
    { tag: y.invalid, color: Tb },
  ]),
  Ib = [Pb, ko(Rb)];
var Nb = A.theme({ "&": { backgroundColor: "#fff" } }, { dark: !1 }),
  Wb = function (e) {
    e === void 0 && (e = {});
    var {
        indentWithTab: t = !0,
        editable: i = !0,
        readOnly: s = !1,
        theme: r = "light",
        placeholder: o = "",
        basicSetup: l = !0,
      } = e,
      a = [];
    switch (
      (t && a.unshift(tn.of([H0])),
      l && (typeof l == "boolean" ? a.unshift(Pa()) : a.unshift(Pa(l))),
      o && a.unshift(Rp(o)),
      r)
    ) {
      case "light":
        a.push(Nb);
        break;
      case "dark":
        a.push(Ib);
        break;
      case "none":
        break;
      default:
        a.push(r);
        break;
    }
    return (
      i === !1 && a.push(A.editable.of(!1)),
      s && a.push(_.readOnly.of(!0)),
      [...a]
    );
  },
  Fb = (n) => ({
    line: n.state.doc.lineAt(n.state.selection.main.from),
    lineCount: n.state.doc.lines,
    lineBreak: n.state.lineBreak,
    length: n.state.doc.length,
    readOnly: n.state.readOnly,
    tabSize: n.state.tabSize,
    selection: n.state.selection,
    selectionAsSingle: n.state.selection.asSingle().main,
    ranges: n.state.selection.ranges,
    selectionCode: n.state.sliceDoc(
      n.state.selection.main.from,
      n.state.selection.main.to,
    ),
    selections: n.state.selection.ranges.map((e) =>
      n.state.sliceDoc(e.from, e.to),
    ),
    selectedText: n.state.selection.ranges.some((e) => !e.empty),
  });
class Hb {
  constructor(e, t) {
    ((this.timeLeftMS = void 0),
      (this.timeoutMS = void 0),
      (this.isCancelled = !1),
      (this.isTimeExhausted = !1),
      (this.callbacks = []),
      (this.timeLeftMS = t),
      (this.timeoutMS = t),
      this.callbacks.push(e));
  }
  tick() {
    if (
      !this.isCancelled &&
      !this.isTimeExhausted &&
      (this.timeLeftMS--, this.timeLeftMS <= 0)
    ) {
      this.isTimeExhausted = !0;
      var e = this.callbacks.slice();
      ((this.callbacks.length = 0),
        e.forEach((t) => {
          try {
            t();
          } catch (i) {
            console.error("TimeoutLatch callback error:", i);
          }
        }));
    }
  }
  cancel() {
    ((this.isCancelled = !0), (this.callbacks.length = 0));
  }
  reset() {
    ((this.timeLeftMS = this.timeoutMS),
      (this.isCancelled = !1),
      (this.isTimeExhausted = !1));
  }
  get isDone() {
    return this.isCancelled || this.isTimeExhausted;
  }
}
class Ha {
  constructor() {
    ((this.interval = null), (this.latches = new Set()));
  }
  add(e) {
    (this.latches.add(e), this.start());
  }
  remove(e) {
    (this.latches.delete(e), this.latches.size === 0 && this.stop());
  }
  start() {
    this.interval === null &&
      (this.interval = setInterval(() => {
        this.latches.forEach((e) => {
          (e.tick(), e.isDone && this.remove(e));
        });
      }, 1));
  }
  stop() {
    this.interval !== null &&
      (clearInterval(this.interval), (this.interval = null));
  }
}
var er = null,
  Vb = () => (typeof window > "u" ? new Ha() : (er || (er = new Ha()), er)),
  Va = lt.define(),
  zb = 200,
  _b = [];
function qb(n) {
  var {
      value: e,
      selection: t,
      onChange: i,
      onStatistics: s,
      onCreateEditor: r,
      onUpdate: o,
      extensions: l = _b,
      autoFocus: a,
      theme: h = "light",
      height: c = null,
      minHeight: f = null,
      maxHeight: u = null,
      width: d = null,
      minWidth: p = null,
      maxWidth: m = null,
      placeholder: g = "",
      editable: b = !0,
      readOnly: w = !1,
      indentWithTab: v = !0,
      basicSetup: T = !0,
      root: k,
      initialState: S,
    } = n,
    [C, P] = te.useState(),
    [B, F] = te.useState(),
    [I, E] = te.useState(),
    N = te.useState(() => ({ current: null }))[0],
    W = te.useState(() => ({ current: null }))[0],
    V = A.theme({
      "&": {
        height: c,
        minHeight: f,
        maxHeight: u,
        width: d,
        minWidth: p,
        maxWidth: m,
      },
      "& .cm-scroller": { height: "100% !important" },
    }),
    X = A.updateListener.of(($) => {
      if (
        $.docChanged &&
        typeof i == "function" &&
        !$.transactions.some((be) => be.annotation(Va))
      ) {
        N.current
          ? N.current.reset()
          : ((N.current = new Hb(() => {
              if (W.current) {
                var be = W.current;
                ((W.current = null), be());
              }
              N.current = null;
            }, zb)),
            Vb().add(N.current));
        var re = $.state.doc,
          fe = re.toString();
        i(fe, $);
      }
      s && s(Fb($));
    }),
    Z = Wb({
      theme: h,
      editable: b,
      readOnly: w,
      placeholder: g,
      indentWithTab: v,
      basicSetup: T,
    }),
    ye = [X, V, ...Z];
  return (
    o && typeof o == "function" && ye.push(A.updateListener.of(o)),
    (ye = ye.concat(l)),
    te.useLayoutEffect(() => {
      if (C && !I) {
        var $ = { doc: e, selection: t, extensions: ye },
          re = S ? _.fromJSON(S.json, $, S.fields) : _.create($);
        if ((E(re), !B)) {
          var fe = new A({ state: re, parent: C, root: k });
          (F(fe), r && r(fe, re));
        }
      }
      return () => {
        B && (E(void 0), F(void 0));
      };
    }, [C, I]),
    te.useEffect(() => {
      n.container && P(n.container);
    }, [n.container]),
    te.useEffect(
      () => () => {
        (B && (B.destroy(), F(void 0)),
          N.current && (N.current.cancel(), (N.current = null)));
      },
      [B],
    ),
    te.useEffect(() => {
      a && B && B.focus();
    }, [a, B]),
    te.useEffect(() => {
      B && B.dispatch({ effects: R.reconfigure.of(ye) });
    }, [h, l, c, f, u, d, p, m, g, b, w, v, T, i, o]),
    te.useEffect(() => {
      if (e !== void 0) {
        var $ = B ? B.state.doc.toString() : "";
        if (B && e !== $) {
          var re = N.current && !N.current.isDone,
            fe = () => {
              B &&
                e !== B.state.doc.toString() &&
                B.dispatch({
                  changes: {
                    from: 0,
                    to: B.state.doc.toString().length,
                    insert: e || "",
                  },
                  annotations: [Va.of(!0)],
                });
            };
          re ? (W.current = fe) : fe();
        }
      }
    }, [e, B]),
    {
      state: I,
      setState: E,
      view: B,
      setView: F,
      container: C,
      setContainer: P,
    }
  );
}
var $b = [
    "className",
    "value",
    "selection",
    "extensions",
    "onChange",
    "onStatistics",
    "onCreateEditor",
    "onUpdate",
    "autoFocus",
    "theme",
    "height",
    "minHeight",
    "maxHeight",
    "width",
    "minWidth",
    "maxWidth",
    "basicSetup",
    "placeholder",
    "indentWithTab",
    "editable",
    "readOnly",
    "root",
    "initialState",
  ],
  Gf = te.forwardRef((n, e) => {
    var {
        className: t,
        value: i = "",
        selection: s,
        extensions: r = [],
        onChange: o,
        onStatistics: l,
        onCreateEditor: a,
        onUpdate: h,
        autoFocus: c,
        theme: f = "light",
        height: u,
        minHeight: d,
        maxHeight: p,
        width: m,
        minWidth: g,
        maxWidth: b,
        basicSetup: w,
        placeholder: v,
        indentWithTab: T,
        editable: k,
        readOnly: S,
        root: C,
        initialState: P,
      } = n,
      B = Xf(n, $b),
      F = te.useRef(null),
      {
        state: I,
        view: E,
        container: N,
        setContainer: W,
      } = qb({
        root: C,
        value: i,
        autoFocus: c,
        theme: f,
        height: u,
        minHeight: d,
        maxHeight: p,
        width: m,
        minWidth: g,
        maxWidth: b,
        basicSetup: w,
        placeholder: v,
        indentWithTab: T,
        editable: k,
        readOnly: S,
        selection: s,
        onChange: o,
        onStatistics: l,
        onCreateEditor: a,
        onUpdate: h,
        extensions: r,
        initialState: P,
      });
    te.useImperativeHandle(
      e,
      () => ({ editor: F.current, state: I, view: E }),
      [F, N, I, E],
    );
    var V = te.useCallback(
      (Z) => {
        ((F.current = Z), W(Z));
      },
      [W],
    );
    if (typeof i != "string")
      throw new Error("value must be typeof string but got " + typeof i);
    var X = typeof f == "string" ? "cm-theme-" + f : "cm-theme";
    return _a.jsx(
      "div",
      Qf({ ref: V, className: "" + X + (t ? " " + t : "") }, B),
    );
  });
Gf.displayName = "CodeMirror";
var Kb = (n) => {
  var { theme: e, settings: t = {}, styles: i = [] } = n,
    s = { ".cm-gutters": {} },
    r = {};
  (t.background && (r.backgroundColor = t.background),
    t.backgroundImage && (r.backgroundImage = t.backgroundImage),
    t.foreground && (r.color = t.foreground),
    t.fontSize && (r.fontSize = t.fontSize),
    (t.background || t.foreground) && (s["&"] = r),
    t.fontFamily &&
      (s["&.cm-editor .cm-scroller"] = { fontFamily: t.fontFamily }),
    t.gutterBackground &&
      (s[".cm-gutters"].backgroundColor = t.gutterBackground),
    t.gutterForeground && (s[".cm-gutters"].color = t.gutterForeground),
    t.gutterBorder && (s[".cm-gutters"].borderRightColor = t.gutterBorder),
    t.caret &&
      ((s[".cm-content"] = { caretColor: t.caret }),
      (s[".cm-cursor, .cm-dropCursor"] = { borderLeftColor: t.caret })));
  var o = {};
  (t.gutterActiveForeground && (o.color = t.gutterActiveForeground),
    t.lineHighlight &&
      ((s[".cm-activeLine"] = { backgroundColor: t.lineHighlight }),
      (o.backgroundColor = t.lineHighlight)),
    (s[".cm-activeLineGutter"] = o),
    t.selection &&
      (s[
        "&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection"
      ] = { background: t.selection + " !important" }),
    t.selectionMatch &&
      (s["& .cm-selectionMatch"] = { backgroundColor: t.selectionMatch }));
  var l = A.theme(s, { dark: e === "dark" }),
    a = di.define(i),
    h = [l, ko(a)];
  return h;
};
const jb = [
  {
    name: "groq",
    loader: () =>
      ee(
        async () => {
          const { javascriptLanguage: n } = await import("./index-CKzs9ZvX.js");
          return { javascriptLanguage: n };
        },
        __vite__mapDeps([0, 1, 2]),
      ).then(({ javascriptLanguage: n }) => n),
  },
  {
    name: "javascript",
    loader: () =>
      ee(
        async () => {
          const { javascript: n } = await import("./index-CKzs9ZvX.js");
          return { javascript: n };
        },
        __vite__mapDeps([0, 1, 2]),
      ).then(({ javascript: n }) => n({ jsx: !1 })),
  },
  {
    name: "jsx",
    loader: () =>
      ee(
        async () => {
          const { javascript: n } = await import("./index-CKzs9ZvX.js");
          return { javascript: n };
        },
        __vite__mapDeps([0, 1, 2]),
      ).then(({ javascript: n }) => n({ jsx: !0 })),
  },
  {
    name: "typescript",
    loader: () =>
      ee(
        async () => {
          const { javascript: n } = await import("./index-CKzs9ZvX.js");
          return { javascript: n };
        },
        __vite__mapDeps([0, 1, 2]),
      ).then(({ javascript: n }) => n({ jsx: !1, typescript: !0 })),
  },
  {
    name: "tsx",
    loader: () =>
      ee(
        async () => {
          const { javascript: n } = await import("./index-CKzs9ZvX.js");
          return { javascript: n };
        },
        __vite__mapDeps([0, 1, 2]),
      ).then(({ javascript: n }) => n({ jsx: !0, typescript: !0 })),
  },
  {
    name: "php",
    loader: () =>
      ee(
        async () => {
          const { php: n } = await import("./index-BV8XMK86.js");
          return { php: n };
        },
        __vite__mapDeps([3, 1, 4, 0, 2]),
      ).then(({ php: n }) => n()),
  },
  {
    name: "sql",
    loader: () =>
      ee(
        async () => {
          const { sql: n } = await import("./index-DIq6o97W.js");
          return { sql: n };
        },
        __vite__mapDeps([5, 1, 2]),
      ).then(({ sql: n }) => n()),
  },
  {
    name: "mysql",
    loader: () =>
      ee(
        async () => {
          const { sql: n, MySQL: e } = await import("./index-DIq6o97W.js");
          return { sql: n, MySQL: e };
        },
        __vite__mapDeps([5, 1, 2]),
      ).then(({ sql: n, MySQL: e }) => n({ dialect: e })),
  },
  {
    name: "json",
    loader: () =>
      ee(
        async () => {
          const { json: n } = await import("./index-BFOAxuVg.js");
          return { json: n };
        },
        __vite__mapDeps([6, 1, 2]),
      ).then(({ json: n }) => n()),
  },
  {
    name: "markdown",
    loader: () =>
      ee(
        async () => {
          const { markdown: n } = await import("./index-5YKTl10v.js");
          return { markdown: n };
        },
        __vite__mapDeps([7, 4, 1, 0, 2]),
      ).then(({ markdown: n }) => n()),
  },
  {
    name: "java",
    loader: () =>
      ee(
        async () => {
          const { java: n } = await import("./index-DK8KNWEi.js");
          return { java: n };
        },
        __vite__mapDeps([8, 1, 2]),
      ).then(({ java: n }) => n()),
  },
  {
    name: "html",
    loader: () =>
      ee(
        async () => {
          const { html: n } = await import("./index-BKhmWDdr.js");
          return { html: n };
        },
        __vite__mapDeps([4, 1, 0, 2]),
      ).then(({ html: n }) => n()),
  },
  {
    name: "csharp",
    loader: () =>
      ee(async () => {
        const { csharp: n } = await import("./clike-CjuBxE1O.js");
        return { csharp: n };
      }, []).then(({ csharp: n }) => Re.define(n)),
  },
  {
    name: "sh",
    loader: () =>
      ee(async () => {
        const { shell: n } = await import("./shell-CjFT_Tl9.js");
        return { shell: n };
      }, []).then(({ shell: n }) => Re.define(n)),
  },
  {
    name: "css",
    loader: () =>
      ee(async () => {
        const { css: n } = await import("./css-Bt2UjfAg.js");
        return { css: n };
      }, []).then(({ css: n }) => Re.define(n)),
  },
  {
    name: "scss",
    loader: () =>
      ee(async () => {
        const { css: n } = await import("./css-Bt2UjfAg.js");
        return { css: n };
      }, []).then(({ css: n }) => Re.define(n)),
  },
  {
    name: "sass",
    loader: () =>
      ee(
        async () => {
          const { sass: n } = await import("./sass-BR7ksiGk.js");
          return { sass: n };
        },
        __vite__mapDeps([9, 10]),
      ).then(({ sass: n }) => Re.define(n)),
  },
  {
    name: "ruby",
    loader: () =>
      ee(async () => {
        const { ruby: n } = await import("./ruby-B2Rjki9n.js");
        return { ruby: n };
      }, []).then(({ ruby: n }) => Re.define(n)),
  },
  {
    name: "python",
    loader: () =>
      ee(async () => {
        const { python: n } = await import("./python-jWMSN8OU.js");
        return { python: n };
      }, []).then(({ python: n }) => Re.define(n)),
  },
  {
    name: "xml",
    loader: () =>
      ee(async () => {
        const { xml: n } = await import("./xml-BFMHta2a.js");
        return { xml: n };
      }, []).then(({ xml: n }) => Re.define(n)),
  },
  {
    name: "yaml",
    loader: () =>
      ee(async () => {
        const { yaml: n } = await import("./yaml-DsCXHVTH.js");
        return { yaml: n };
      }, []).then(({ yaml: n }) => Re.define(n)),
  },
  {
    name: "golang",
    loader: () =>
      ee(async () => {
        const { go: n } = await import("./go-CTD25R5P.js");
        return { go: n };
      }, []).then(({ go: n }) => Re.define(n)),
  },
  { name: "text", loader: () => {} },
  { name: "batch", loader: () => {} },
];
function Jf(n) {
  return n.tone !== "neutral" && n.tone !== "suggest"
    ? n.tone
    : n.tone === "neutral"
      ? "default"
      : "primary";
}
const zn = "cm-highlight-line",
  zo = R.define(),
  _o = R.define(),
  Jr = ce.define({
    create() {
      return L.none;
    },
    update(n, e) {
      n = n.map(e.changes);
      for (const t of e.effects)
        (t.is(zo) && (n = n.update({ add: [za.range(t.value)] })),
          t.is(_o) && (n = n.update({ filter: (i) => i !== t.value })));
      return n;
    },
    toJSON(n, e) {
      const t = [],
        i = n.iter();
      for (; i.value; ) {
        const s = e.doc.lineAt(i.from).number;
        (t.includes(s) || t.push(s), i.next());
      }
      return t;
    },
    fromJSON(n, e) {
      const t = e.doc.lines,
        i = n.filter((s) => s <= t).map((s) => za.range(e.doc.line(s).from));
      i.sort((s, r) => s.from - r.from);
      try {
        return L.none.update({ add: i });
      } catch (s) {
        return (console.error(s), L.none);
      }
    },
    provide: (n) => A.decorations.from(n),
  }),
  za = L.line({ class: zn }),
  Yf = { highlight: Jr };
function Ub(n) {
  const { themeCtx: e } = n,
    t = Jf(e),
    i = { color: e.theme.color.dark[t] },
    s = { color: e.theme.color.light[t] };
  return A.baseTheme({
    ".cm-lineNumbers": { cursor: "default" },
    ".cm-line.cm-line": { position: "relative" },
    [`.${zn}::before`]: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: -3,
      content: "''",
      boxSizing: "border-box",
    },
    [`&dark .${zn}::before`]: {
      background: bt(i.color.muted.caution.pressed.bg, 0.5),
    },
    [`&light .${zn}::before`]: {
      background: bt(s.color.muted.caution.pressed.bg, 0.75),
    },
  });
}
const Gb = (n) => {
  const e = Ub({ themeCtx: n.theme });
  return [
    Jr,
    n.readOnly
      ? []
      : mc({
          domEventHandlers: {
            mousedown: (t, i) => {
              const s = t.state.doc.lineAt(i.from);
              let r = !1;
              return (
                t.state.field(Jr).between(s.from, s.to, (o, l, a) => {
                  if (a) return ((r = !0), !1);
                }),
                r
                  ? t.dispatch({ effects: _o.of(s.from) })
                  : t.dispatch({ effects: zo.of(s.from) }),
                n?.onHighlightChange &&
                  n.onHighlightChange(t.state.toJSON(Yf).highlight),
                !0
              );
            },
          },
        }),
    e,
  ];
};
function Jb(n, e) {
  const t = n.state.doc,
    i = t.lines,
    s = Array.from({ length: i }, (r, o) => o + 1);
  n.dispatch({
    effects: s.map((r) => {
      const o = t.line(r);
      return e?.includes(r) ? zo.of(o.from) : _o.of(o.from);
    }),
  });
}
function Yb() {
  const n = Xi.c(6),
    e = qa();
  let t;
  n[0] !== e ? ((t = Jf(e)), (n[0] = e), (n[1] = t)) : (t = n[1]);
  const i = t,
    s = e.theme.color.dark[i];
  let r;
  if (n[2] !== i || n[3] !== s || n[4] !== e.theme.color.light) {
    const o = { color: s },
      l = { color: e.theme.color.light[i] };
    ((r = A.baseTheme({
      "&.cm-editor": { height: "100%" },
      "&.cm-editor.cm-focused": { outline: "none" },
      "&.cm-editor.cm-focused .cm-matchingBracket": {
        backgroundColor: "transparent",
      },
      "&.cm-editor.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "transparent",
      },
      "&dark.cm-editor.cm-focused .cm-matchingBracket": {
        outline: `1px solid ${o.color.base.border}`,
      },
      "&dark.cm-editor.cm-focused .cm-nonmatchingBracket": {
        outline: `1px solid ${o.color.base.border}`,
      },
      "&light.cm-editor.cm-focused .cm-matchingBracket": {
        outline: `1px solid ${l.color.base.border}`,
      },
      "&light.cm-editor.cm-focused .cm-nonmatchingBracket": {
        outline: `1px solid ${l.color.base.border}`,
      },
      "& .cm-lineNumbers .cm-gutterElement": {
        minWidth: "32px !important",
        padding: "0 8px !important",
      },
      "& .cm-gutter.cm-foldGutter": { width: "0px !important" },
      "&dark .cm-gutters": {
        color: `${bt(o.color.card.enabled.code.fg, 0.5)} !important`,
        borderRight: `1px solid ${bt(o.color.base.border, 0.5)}`,
      },
      "&light .cm-gutters": {
        color: `${bt(l.color.card.enabled.code.fg, 0.5)} !important`,
        borderRight: `1px solid ${bt(l.color.base.border, 0.5)}`,
      },
    })),
      (n[2] = i),
      (n[3] = s),
      (n[4] = e.theme.color.light),
      (n[5] = r));
  } else r = n[5];
  return r;
}
function Xb() {
  const n = Xi.c(19),
    e = $a(),
    { code: t } = e.sanity.fonts,
    { base: i, card: s, dark: r, syntax: o } = e.sanity.color,
    l = r ? "dark" : "light";
  let a;
  return (
    n[0] !== i.focusRing ||
    n[1] !== s.disabled.bg ||
    n[2] !== s.disabled.code.fg ||
    n[3] !== s.enabled.bg ||
    n[4] !== s.enabled.code.fg ||
    n[5] !== s.enabled.fg ||
    n[6] !== t.family ||
    n[7] !== o.attrName ||
    n[8] !== o.boolean ||
    n[9] !== o.className ||
    n[10] !== o.comment ||
    n[11] !== o.function ||
    n[12] !== o.keyword ||
    n[13] !== o.number ||
    n[14] !== o.operator ||
    n[15] !== o.property ||
    n[16] !== o.string ||
    n[17] !== l
      ? ((a = Kb({
          theme: l,
          settings: {
            background: s.enabled.bg,
            foreground: s.enabled.code.fg,
            lineHighlight: s.enabled.bg,
            fontFamily: t.family,
            caret: i.focusRing,
            selection: bt(i.focusRing, 0.2),
            selectionMatch: bt(i.focusRing, 0.4),
            gutterBackground: s.disabled.bg,
            gutterForeground: s.disabled.code.fg,
            gutterActiveForeground: s.enabled.fg,
          },
          styles: [
            {
              tag: [
                y.heading,
                y.heading2,
                y.heading3,
                y.heading4,
                y.heading5,
                y.heading6,
              ],
              color: s.enabled.fg,
            },
            { tag: y.angleBracket, color: s.enabled.code.fg },
            { tag: y.atom, color: o.keyword },
            { tag: y.attributeName, color: o.attrName },
            { tag: y.bool, color: o.boolean },
            { tag: y.bracket, color: s.enabled.code.fg },
            { tag: y.className, color: o.className },
            { tag: y.comment, color: o.comment },
            { tag: y.definition(y.typeName), color: o.function },
            {
              tag: [
                y.definition(y.variableName),
                y.function(y.variableName),
                y.className,
                y.attributeName,
              ],
              color: o.function,
            },
            {
              tag: [y.function(y.propertyName), y.propertyName],
              color: o.function,
            },
            { tag: y.keyword, color: o.keyword },
            { tag: y.null, color: o.number },
            { tag: y.number, color: o.number },
            { tag: y.meta, color: s.enabled.code.fg },
            { tag: y.operator, color: o.operator },
            { tag: y.propertyName, color: o.property },
            { tag: [y.string, y.special(y.brace)], color: o.string },
            { tag: y.tagName, color: o.className },
            { tag: y.typeName, color: o.keyword },
          ],
        })),
        (n[0] = i.focusRing),
        (n[1] = s.disabled.bg),
        (n[2] = s.disabled.code.fg),
        (n[3] = s.enabled.bg),
        (n[4] = s.enabled.code.fg),
        (n[5] = s.enabled.fg),
        (n[6] = t.family),
        (n[7] = o.attrName),
        (n[8] = o.boolean),
        (n[9] = o.className),
        (n[10] = o.comment),
        (n[11] = o.function),
        (n[12] = o.keyword),
        (n[13] = o.number),
        (n[14] = o.operator),
        (n[15] = o.property),
        (n[16] = o.string),
        (n[17] = l),
        (n[18] = a))
      : (a = n[18]),
    a
  );
}
function Qb(n) {
  const e = Xi.c(3),
    { fontSize: t } = n,
    i = $a(),
    { code: s } = i.sanity.fonts,
    { fontSize: r, lineHeight: o } = s.sizes[t] || s.sizes[2];
  let l;
  return (
    e[0] !== r || e[1] !== o
      ? ((l = A.baseTheme({
          "&": { fontSize: Zf(r) },
          "& .cm-scroller": { lineHeight: `${o / r} !important` },
        })),
        (e[0] = r),
        (e[1] = o),
        (e[2] = l))
      : (l = e[2]),
    l
  );
}
const Zb = te.forwardRef(function (n, e) {
  const t = Xi.c(41);
  let i, s, r, o, l, a, h;
  t[0] !== n
    ? (({
        basicSetup: i,
        highlightLines: r,
        languageMode: o,
        onHighlightChange: l,
        readOnly: a,
        value: h,
        ...s
      } = n),
      (t[0] = n),
      (t[1] = i),
      (t[2] = s),
      (t[3] = r),
      (t[4] = o),
      (t[5] = l),
      (t[6] = a),
      (t[7] = h))
    : ((i = t[1]),
      (s = t[2]),
      (r = t[3]),
      (o = t[4]),
      (l = t[5]),
      (a = t[6]),
      (h = t[7]));
  const c = qa(),
    f = Xb(),
    [u, d] = te.useState(void 0),
    p = Yb();
  let m;
  t[8] === Symbol.for("react.memo_cache_sentinel")
    ? ((m = { fontSize: 1 }), (t[8] = m))
    : (m = t[8]);
  const g = Qb(m),
    b = e1(o);
  let w;
  t[9] !== l || t[10] !== a || t[11] !== c
    ? ((w = Gb({ onHighlightChange: l, readOnly: a, theme: c })),
      (t[9] = l),
      (t[10] = a),
      (t[11] = c),
      (t[12] = w))
    : (w = t[12]);
  const v = w;
  let T;
  e: {
    let V;
    t[13] !== g || t[14] !== v || t[15] !== p
      ? ((V = [p, g, v, A.lineWrapping]),
        (t[13] = g),
        (t[14] = v),
        (t[15] = p),
        (t[16] = V))
      : (V = t[16]);
    const X = V;
    if (b) {
      let Z;
      (t[17] !== X || t[18] !== b
        ? ((Z = [...X, b]), (t[17] = X), (t[18] = b), (t[19] = Z))
        : (Z = t[19]),
        (T = Z));
      break e;
    }
    T = X;
  }
  const k = T;
  let S;
  t[20] !== u || t[21] !== r
    ? ((S = () => {
        u && Jb(u, r ?? []);
      }),
      (t[20] = u),
      (t[21] = r),
      (t[22] = S))
    : (S = t[22]);
  let C;
  (t[23] !== u || t[24] !== r || t[25] !== h
    ? ((C = [u, r, h]), (t[23] = u), (t[24] = r), (t[25] = h), (t[26] = C))
    : (C = t[26]),
    te.useEffect(S, C));
  let P;
  t[27] !== r || t[28] !== h
    ? ((P = () => ({
        json: {
          doc: h ?? "",
          selection: { main: 0, ranges: [{ anchor: 0, head: 0 }] },
          highlight: r ?? [],
        },
        fields: Yf,
      })),
      (t[27] = r),
      (t[28] = h),
      (t[29] = P))
    : (P = t[29]);
  const [B] = te.useState(P);
  let F;
  t[30] === Symbol.for("react.memo_cache_sentinel")
    ? ((F = (V) => {
        d(V);
      }),
      (t[30] = F))
    : (F = t[30]);
  const I = F;
  let E;
  t[31] !== i
    ? ((E = i ?? { highlightActiveLine: !1 }), (t[31] = i), (t[32] = E))
    : (E = t[32]);
  const N = E;
  let W;
  return (
    t[33] !== N ||
    t[34] !== s ||
    t[35] !== f ||
    t[36] !== k ||
    t[37] !== B ||
    t[38] !== e ||
    t[39] !== h
      ? ((W = _a.jsx(Gf, {
          ...s,
          value: h,
          ref: e,
          extensions: k,
          theme: f,
          onCreateEditor: I,
          initialState: B,
          basicSetup: N,
        })),
        (t[33] = N),
        (t[34] = s),
        (t[35] = f),
        (t[36] = k),
        (t[37] = B),
        (t[38] = e),
        (t[39] = h),
        (t[40] = W))
      : (W = t[40]),
    W
  );
});
function e1(n) {
  const e = Xi.c(6),
    t = te.useContext(eu),
    [i, s] = te.useState();
  let r;
  e[0] !== t?.codeModes || e[1] !== n
    ? ((r = () => {
        const l = [...(t?.codeModes ?? []), ...jb].find((h) => h.name === n);
        l?.loader ||
          console.warn(
            `Found no codeMode for language mode ${n}, syntax highlighting will be disabled.`,
          );
        let a = !0;
        return (
          Promise.resolve(l?.loader())
            .then((h) => {
              a && s(h);
            })
            .catch((h) => {
              (console.error(`Failed to load language mode ${n}`, h),
                a && s(void 0));
            }),
          () => {
            a = !1;
          }
        );
      }),
      (e[0] = t?.codeModes),
      (e[1] = n),
      (e[2] = r))
    : (r = e[2]);
  let o;
  return (
    e[3] !== t || e[4] !== n
      ? ((o = [n, t]), (e[3] = t), (e[4] = n), (e[5] = o))
      : (o = e[5]),
    te.useEffect(r, o),
    i
  );
}
const d1 = Object.freeze(
  Object.defineProperty({ __proto__: null, default: Zb }, Symbol.toStringTag, {
    value: "Module",
  }),
);
export {
  hi as A,
  a1 as B,
  Rf as C,
  n1 as D,
  x as E,
  yg as F,
  Rm as G,
  u1 as H,
  U as I,
  fm as J,
  d1 as K,
  o1 as L,
  Ce as N,
  xc as P,
  Ie as T,
  Hr as a,
  c1 as b,
  h1 as c,
  l1 as d,
  f1 as e,
  Um as f,
  gy as g,
  ge as h,
  Ac as i,
  H as j,
  go as k,
  J as l,
  Dt as m,
  tn as n,
  jm as o,
  s1 as p,
  ui as q,
  Fe as r,
  Om as s,
  y as t,
  sn as u,
  kc as v,
  _ as w,
  Wt as x,
  A as y,
  Cc as z,
};
