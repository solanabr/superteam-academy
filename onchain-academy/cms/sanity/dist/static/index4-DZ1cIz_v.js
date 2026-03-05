import {
  J as Ke,
  K as Ue,
  c as L,
  L as qe,
  r as S,
  j as p,
  M as Je,
  N as Ye,
  O as xe,
  Q as ye,
  R as ue,
  S as me,
  T as K,
  U as be,
  B as fe,
  V as Re,
  q as ke,
  W as ie,
  X as he,
  s as le,
  Y as Qe,
  Z as ge,
  C as oe,
  a as De,
  H as Xe,
  t as Ze,
  $ as et,
  a0 as tt,
  a1 as nt,
  a2 as ze,
  e as at,
  a3 as rt,
  a4 as st,
  a5 as ot,
  a6 as _e,
  a7 as W,
  a8 as je,
  a9 as it,
  aa as lt,
  ab as Ce,
  ac as Z,
  ad as ct,
  ae as Me,
  af as dt,
  ag as ut,
  ah as pt,
  ai as mt,
  aj as ft,
  ak as ht,
  al as xt,
  am as yt,
  an as Ie,
  ao as re,
  ap as ce,
  aq as gt,
  ar as It,
  as as Pt,
  at as wt,
  au as vt,
  av as St,
  aw as $e,
  ax as bt,
  ay as _t,
  az as jt,
} from "./sanity-DDM0-WJH.js";
function $t() {
  return Ke(function (t, e) {
    var a,
      n = !1;
    t.subscribe(
      Ue(e, function (o) {
        var r = a;
        ((a = o), n && e.next([r, o]), (n = !0));
      }),
    );
  });
}
class ee extends Error {
  constructor({ message: e, context: a, helpId: n, cause: o }) {
    (super(e),
      (this.name = "PaneResolutionError"),
      (this.context = a),
      (this.helpId = n),
      (this.cause = o));
  }
}
const Tt = (t) => !!t && typeof t?.then == "function",
  Et = (t) => (Ce(t) ? typeof t.serialize == "function" : !1),
  Rt = (t) => (e, a, n) => {
    try {
      return t(e, a, n);
    } catch (o) {
      throw o instanceof ee
        ? o
        : new ee({
            message: typeof o?.message == "string" ? o.message : "",
            context: a,
            cause: o,
          });
    }
  },
  kt =
    (t) =>
    (...e) =>
      t(...e).pipe(Pt(1), wt());
function Ne(t) {
  const e = Rt(
    kt(
      t((a, n, o) => {
        if (!a)
          throw new ee({
            message: "Pane returned no child",
            context: n,
            helpId: "structure-item-returned-no-child",
          });
        return Tt(a) || xt(a)
          ? yt(a).pipe(Ie((r) => e(r, n, o)))
          : Et(a)
            ? e(a.serialize(n), n, o)
            : typeof a == "function"
              ? e(a(n.id, n), n, o)
              : re(a);
      }),
    ),
  );
  return e;
}
const Te = new WeakMap();
function Le(t, e) {
  const a = Te.get(t) || new Map();
  if (a) {
    const r = a.get(e);
    if (r) return r;
  }
  const n = t[e];
  if (typeof n != "function")
    throw new Error(
      `Expected property \`${e}\` to be a function but got ${typeof n} instead.`,
    );
  const o = n.bind(t);
  return (a.set(e, o), Te.set(t, a), o);
}
async function Dt(t) {
  const e = new Map(),
    a = Ne((s) => (l, c, d) => {
      const i = l && `${ce(l)}-${c.path.join("__")}`,
        u = i && e.get(i);
      if (u) return u;
      const m = s(l, c, d);
      return (i && e.set(i, m), m);
    }),
    n = [
      [
        {
          id: `__edit__${t.params.id}`,
          params: { ...dt(t.params, ["id"]), type: t.params.type },
          payload: t.payload,
        },
      ],
    ];
  async function o({
    currentId: s,
    flatIndex: l,
    intent: c,
    params: d,
    parent: i,
    path: u,
    payload: m,
    unresolvedPane: x,
    levelIndex: h,
    structureContext: I,
  }) {
    if (!x) return [];
    const { id: g, type: v, ...P } = d,
      f = await Me(
        a(
          x,
          {
            id: s,
            splitIndex: 0,
            parent: i,
            path: u,
            index: l,
            params: {},
            payload: void 0,
            structureContext: I,
          },
          l,
        ),
      );
    return f.type === "document" && f.id === g
      ? [
          {
            panes: [
              ...u.slice(0, u.length - 1).map((y) => [{ id: y }]),
              [{ id: g, params: P, payload: m }],
            ],
            depthIndex: u.length,
            levelIndex: h,
          },
        ]
      : f.canHandleIntent?.(c, d, { pane: f, index: l }) ||
          (f.type === "documentList" &&
            f.schemaTypeName === v &&
            f.options.filter === "_type == $type")
        ? [
            {
              panes: [
                ...u.map((y) => [{ id: y }]),
                [{ id: d.id, params: P, payload: m }],
              ],
              depthIndex: u.length,
              levelIndex: h,
            },
          ]
        : f.type === "list" && f.child && f.items
          ? (
              await Promise.all(
                f.items.map((y, b) =>
                  y.type === "divider"
                    ? Promise.resolve([])
                    : o({
                        currentId: y._id || y.id,
                        flatIndex: l + 1,
                        intent: c,
                        params: d,
                        parent: f,
                        path: [...u, y.id],
                        payload: m,
                        unresolvedPane:
                          typeof f.child == "function"
                            ? Le(f, "child")
                            : f.child,
                        levelIndex: b,
                        structureContext: I,
                      }),
                ),
              )
            ).flat()
          : [];
  }
  const r = (
    await o({
      currentId: "root",
      flatIndex: 0,
      levelIndex: 0,
      intent: t.intent,
      params: t.params,
      parent: null,
      path: [],
      payload: t.payload,
      unresolvedPane: t.rootPaneNode,
      structureContext: t.structureContext,
    })
  ).sort((s, l) =>
    s.depthIndex === l.depthIndex
      ? s.levelIndex - l.levelIndex
      : s.depthIndex - l.depthIndex,
  )[0];
  return r ? r.panes : n;
}
function zt(t) {
  return t !== W && t.type === "document";
}
const Ct = (t, e) => {
  const a = t.replace(/^__edit__/, ""),
    {
      params: n,
      payload: o,
      structureContext: { resolveDocumentNode: r },
    } = e,
    { type: s, template: l } = n;
  if (!s)
    throw new Error(
      `Document type for document with ID ${a} was not provided in the router params.`,
    );
  let c = r({ schemaType: s, documentId: a }).id("editor");
  return (l && (c = c.initialValueTemplate(l, o)), c.serialize());
};
function Mt(t) {
  return `contextHash(${JSON.stringify({ id: t.id, parentId: parent && ce(parent), path: t.path, index: t.index, splitIndex: t.splitIndex, serializeOptionsIndex: t.serializeOptions?.index, serializeOptionsPath: t.serializeOptions?.path })})`;
}
const Ee = (t) => {
  const e = {
    type: t.type,
    id: t.routerPaneSibling.id,
    params: t.routerPaneSibling.params || {},
    payload: t.routerPaneSibling.payload || null,
    flatIndex: t.flatIndex,
    groupIndex: t.groupIndex,
    siblingIndex: t.siblingIndex,
    path: t.path,
    paneNode: t.type === "resolvedMeta" ? ce(t.paneNode) : null,
  };
  return `metaHash(${JSON.stringify(e)})`;
};
function se({
  unresolvedPane: t,
  flattenedRouterPanes: e,
  parent: a,
  path: n,
  resolvePane: o,
  structureContext: r,
}) {
  const [s, ...l] = e,
    c = l[0],
    d = {
      id: s.routerPaneSibling.id,
      splitIndex: s.siblingIndex,
      parent: a,
      path: [...n, s.routerPaneSibling.id],
      index: s.flatIndex,
      params: s.routerPaneSibling.params || {},
      payload: s.routerPaneSibling.payload,
      structureContext: r,
    };
  try {
    return o(t, d, s.flatIndex).pipe(
      Ie((i) => {
        const u = { type: "resolvedMeta", ...s, paneNode: i, path: d.path },
          m = l.map((h, I) => ({
            type: "loading",
            path: [
              ...d.path,
              ...l.slice(I).map((g, v) => `[${h.flatIndex + v}]`),
            ],
            paneNode: null,
            ...h,
          }));
        if (!l.length) return re([u]);
        let x;
        return (
          c?.routerPaneSibling.id.startsWith("__edit__")
            ? (x = se({
                unresolvedPane: Ct,
                flattenedRouterPanes: l,
                parent: a,
                path: d.path,
                resolvePane: o,
                structureContext: r,
              }))
            : s.groupIndex === c?.groupIndex
              ? (x = se({
                  unresolvedPane: t,
                  flattenedRouterPanes: l,
                  parent: a,
                  path: n,
                  resolvePane: o,
                  structureContext: r,
                }))
              : (x = se({
                  unresolvedPane:
                    typeof i.child == "function" ? Le(i, "child") : i.child,
                  flattenedRouterPanes: l,
                  parent: i,
                  path: d.path,
                  resolvePane: o,
                  structureContext: r,
                })),
          jt(re([u, ...m]), x.pipe(Z((h) => [u, ...h])))
        );
      }),
    );
  } catch (i) {
    if (
      i instanceof ee &&
      (i.context &&
        console.warn(
          `Pane resolution error at index ${i.context.index}${i.context.splitIndex > 0 ? ` for split pane index ${i.context.splitIndex}` : ""}: ${i.message}${i.helpId ? ` - see ${Re(i.helpId)}` : ""}`,
          i,
        ),
      i.helpId === "structure-item-returned-no-child")
    )
      return re([]);
    throw i;
  }
}
function Nt({
  routerPanesStream: t,
  rootPaneNode: e,
  initialCacheState: a = {
    cacheKeysByFlatIndex: [],
    flattenedRouterPanes: [],
    resolvedPaneCache: new Map(),
    resolvePane: () => bt,
  },
  structureContext: n,
}) {
  return t
    .pipe(
      Z((o) => [[{ id: "root" }], ...o]),
      Z((o) =>
        o
          .flatMap((r, s) =>
            r.map((l, c) => ({
              routerPaneSibling: l,
              groupIndex: s,
              siblingIndex: c,
            })),
          )
          .map((r, s) => ({ ...r, flatIndex: s })),
      ),
      vt([]),
      $t(),
      Z(([o, r]) => {
        for (let s = 0; s < r.length; s++) {
          const l = o[s],
            c = r[s];
          if (!St(l, c)) return { flattenedRouterPanes: r, diffIndex: s };
        }
        return { flattenedRouterPanes: r, diffIndex: r.length };
      }),
      $e((o, r) => {
        const { cacheKeysByFlatIndex: s, resolvedPaneCache: l } = o,
          { flattenedRouterPanes: c, diffIndex: d } = r,
          i = s.slice(0, d + 1),
          u = s.slice(d + 1),
          m = new Set(i.flatMap((h) => Array.from(h))),
          x = u.flatMap((h) => Array.from(h)).filter((h) => !m.has(h));
        for (const h of x) l.delete(h);
        return {
          flattenedRouterPanes: c,
          cacheKeysByFlatIndex: s,
          resolvedPaneCache: l,
          resolvePane: Ne((h) => (I, g, v) => {
            const P = I && `${ce(I)}-${Mt(g)}`,
              f = P && l.get(P);
            if (f) return f;
            const y = h(I, g, v);
            if (!P) return y;
            const b = s[v] || new Set();
            return (b.add(P), (s[v] = b), l.set(P, y), y);
          }),
        };
      }, a),
      Ie(({ flattenedRouterPanes: o, resolvePane: r }) =>
        se({
          unresolvedPane: e,
          flattenedRouterPanes: o,
          parent: null,
          path: [],
          resolvePane: r,
          structureContext: n,
        }),
      ),
    )
    .pipe(
      $e(
        (o, r) =>
          r.map((s, l) => {
            const c = o[l];
            return !c || s.type !== "loading"
              ? s
              : c.routerPaneSibling.id === s.routerPaneSibling.id
                ? c
                : s;
          }),
        [],
      ),
      _t((o, r) => {
        if (o.length !== r.length) return !1;
        for (let s = 0; s < r.length; s++) {
          const l = o[s],
            c = r[s];
          if (Ee(l) !== Ee(c)) return !1;
        }
        return !0;
      }),
    );
}
function Lt() {
  const t = L.c(6),
    [e] = S.useState(Vt);
  let a;
  t[0] !== e
    ? ((a = e.asObservable().pipe(Z(Ot))), (t[0] = e), (t[1] = a))
    : (a = t[1]);
  const n = a,
    { state: o } = ie();
  let r, s;
  return (
    t[2] !== o || t[3] !== e
      ? ((r = () => {
          e.next(o);
        }),
        (s = [o, e]),
        (t[2] = o),
        (t[3] = e),
        (t[4] = r),
        (t[5] = s))
      : ((r = t[4]), (s = t[5])),
    S.useEffect(r, s),
    n
  );
}
function Ot(t) {
  return t?.panes || [];
}
function Vt() {
  return new ut(1);
}
function Wt() {
  const t = L.c(19),
    [e, a] = S.useState(),
    [n, o] = S.useState(null);
  if (e) throw e;
  const { structureContext: r, rootPaneNode: s } = le(),
    { navigate: l } = ie();
  let c;
  t[0] === Symbol.for("react.memo_cache_sentinel")
    ? ((c = { paneDataItems: [], resolvedPanes: [], routerPanes: [] }),
      (t[0] = c))
    : (c = t[0]);
  const [d, i] = S.useState(c),
    u = Lt();
  let m, x;
  (t[1] !== s || t[2] !== u || t[3] !== r
    ? ((m = () => {
        const f = Nt({
          rootPaneNode: s,
          routerPanesStream: u,
          structureContext: r,
        })
          .pipe(Z(Bt))
          .subscribe({ next: (y) => i(y), error: (y) => a(y) });
        return () => f.unsubscribe();
      }),
      (x = [s, u, r]),
      (t[1] = s),
      (t[2] = u),
      (t[3] = r),
      (t[4] = m),
      (t[5] = x))
    : ((m = t[4]), (x = t[5])),
    S.useEffect(m, x));
  let h, I;
  (t[6] !== d || t[7] !== l
    ? ((h = function () {
        const { paneDataItems: f, routerPanes: y } = d,
          b = f[f.length - 1]?.pane;
        if (!b || !zt(b) || !b.defaultPanes) return;
        const _ = y[f.length - 1];
        if (!_ || _.length !== 1) return;
        const $ = _[0].params;
        if ($?.expanded) return;
        const R = b.defaultPanes.map((j, E) => ({
          id: _[0].id,
          params: { ...$, view: j, ...(E === 0 ? { expanded: "true" } : {}) },
          payload: _[0].payload,
        }));
        l({ panes: [...y.slice(1, -1), R] }, { replace: !0 });
      }),
      (I = [d, l]),
      (t[6] = d),
      (t[7] = l),
      (t[8] = h),
      (t[9] = I))
    : ((h = t[8]), (I = t[9])),
    S.useEffect(h, I));
  let g;
  if (t[10] !== d.paneDataItems || t[11] !== n) {
    let f;
    (t[13] !== n
      ? ((f = (y) => ({ ...y, maximized: n ? y.key === n.key : !1 })),
        (t[13] = n),
        (t[14] = f))
      : (f = t[14]),
      (g = d.paneDataItems.map(f)),
      (t[10] = d.paneDataItems),
      (t[11] = n),
      (t[12] = g));
  } else g = t[12];
  const v = g;
  let P;
  return (
    t[15] !== d || t[16] !== n || t[17] !== v
      ? ((P = {
          ...d,
          paneDataItems: v,
          maximizedPane: n,
          setMaximizedPane: o,
        }),
        (t[15] = d),
        (t[16] = n),
        (t[17] = v),
        (t[18] = P))
      : (P = t[18]),
    P
  );
}
function Bt(t) {
  const e = t.reduce(Ht, []),
    a = e.length,
    n = t.map((o) => {
      const {
          groupIndex: r,
          flatIndex: s,
          siblingIndex: l,
          routerPaneSibling: c,
          path: d,
        } = o,
        i = c.id,
        u = e[r + 1];
      return {
        active: r === a - 2,
        childItemId: u?.[0].id ?? null,
        index: s,
        itemId: c.id,
        groupIndex: r,
        key: `${o.type === "loading" ? "unknown" : o.paneNode.id}-${i}-${l}`,
        pane: o.type === "loading" ? W : o.paneNode,
        params: c.params || {},
        path: d.join(";"),
        payload: c.payload,
        selected: s === t.length - 1,
        siblingIndex: l,
        maximized: !1,
      };
    });
  return { paneDataItems: n, routerPanes: e, resolvedPanes: n.map(At) };
}
function At(t) {
  return t.pane;
}
function Ht(t, e) {
  const a = t[e.groupIndex] || [];
  return ((a[e.siblingIndex] = e.routerPaneSibling), (t[e.groupIndex] = a), t);
}
async function Ft(t, e, a) {
  if (e && a) return { id: e, type: a };
  if (!e && a) return { id: ct(), type: a };
  if (e && !a) {
    const n = await Me(t.resolveTypeForDocument(e));
    return { id: e, type: n };
  }
  throw new ee({
    message:
      "Neither document `id` or `type` was provided when trying to resolve intent.",
  });
}
const Gt = {},
  Kt = S.memo(function () {
    const t = L.c(7),
      { navigate: e } = ie(),
      a = he(Ut),
      { rootPaneNode: n, structureContext: o } = le(),
      r = Qe(),
      [s, l] = S.useState(null);
    if (s) throw s;
    let c, d;
    return (
      t[0] !== r || t[1] !== a || t[2] !== e || t[3] !== n || t[4] !== o
        ? ((c = () => {
            if (a) {
              const { intent: i, params: u, payload: m } = a;
              let x = !1;
              return (
                (async function () {
                  const { id: h, type: I } = await Ft(
                    r,
                    typeof u.id == "string" ? u.id : void 0,
                    typeof u.type == "string" ? u.type : void 0,
                  );
                  if (x) return;
                  const g = await Dt({
                    intent: i,
                    params: { ...u, id: h, type: I },
                    payload: m,
                    rootPaneNode: n,
                    structureContext: o,
                  });
                  x || e({ panes: g }, { replace: !0 });
                })().catch(l),
                () => {
                  x = !0;
                }
              );
            }
          }),
          (d = [r, a, e, n, o]),
          (t[0] = r),
          (t[1] = a),
          (t[2] = e),
          (t[3] = n),
          (t[4] = o),
          (t[5] = c),
          (t[6] = d))
        : ((c = t[5]), (d = t[6])),
      S.useEffect(c, d),
      null
    );
  });
function Ut(t) {
  const e = typeof t.intent == "string" ? t.intent : void 0;
  return e
    ? { intent: e, params: Ce(t.params) ? t.params : Gt, payload: t.payload }
    : void 0;
}
const qt = ke.span.withConfig({
  displayName: "PathSegment",
  componentId: "sc-jnonai-0",
})`&:not(:last-child)::after{content:' ➝ ';opacity:0.5;}`;
function Jt(t) {
  return t
    .replace(
      /\(\.\.\.\)\./g,
      `(...)
  .`,
    )
    .replace(/__WEBPACK_IMPORTED_MODULE_\d+_+/g, "")
    .replace(/___default\./g, ".")
    .replace(new RegExp(` \\(https?:\\/\\/${window.location.host}`, "g"), " (");
}
function Yt(t) {
  const e = L.c(74),
    { error: a } = t;
  if (!(a instanceof ee)) throw a;
  const { cause: n } = a,
    { t: o } = ye(ge),
    r = n?.stack || a.stack;
  let s;
  e[0] !== n || e[1] !== a.message || e[2] !== r
    ? ((s =
        r && !(n instanceof ue) && !a.message.includes("Module build failed:")),
      (e[0] = n),
      (e[1] = a.message),
      (e[2] = r),
      (e[3] = s))
    : (s = e[3]);
  const l = s;
  let c, d, i, u, m, x, h, I, g, v, P, f, y, b, _, $, R, j;
  if (e[4] !== n || e[5] !== a.helpId || e[6] !== o) {
    const G = n instanceof ue ? n.path : [];
    ((m = (n instanceof ue && n.helpId) || a.helpId),
      (u = Xt),
      (i = oe),
      (x = "fill"),
      (h = "auto"),
      (I = 4),
      (g = "border"),
      (v = "critical"),
      (d = De));
    let V;
    (e[25] !== o
      ? ((V = o("structure-error.header.text")), (e[25] = o), (e[26] = V))
      : (V = e[26]),
      e[27] !== V
        ? ((j = p.jsx(Xe, { as: "h2", children: V })), (e[27] = V), (e[28] = j))
        : (j = e[28]),
      (c = oe),
      (P = 4),
      (f = 4),
      (y = 2),
      (b = "auto"),
      (_ = 1),
      ($ = "inherit"),
      (R =
        G.length > 0 &&
        p.jsxs(me, {
          space: 2,
          children: [
            p.jsx(K, {
              size: 1,
              weight: "medium",
              children: o("structure-error.structure-path.label"),
            }),
            p.jsx(be, { children: G.slice(1).map(Qt) }),
          ],
        })),
      (e[4] = n),
      (e[5] = a.helpId),
      (e[6] = o),
      (e[7] = c),
      (e[8] = d),
      (e[9] = i),
      (e[10] = u),
      (e[11] = m),
      (e[12] = x),
      (e[13] = h),
      (e[14] = I),
      (e[15] = g),
      (e[16] = v),
      (e[17] = P),
      (e[18] = f),
      (e[19] = y),
      (e[20] = b),
      (e[21] = _),
      (e[22] = $),
      (e[23] = R),
      (e[24] = j));
  } else
    ((c = e[7]),
      (d = e[8]),
      (i = e[9]),
      (u = e[10]),
      (m = e[11]),
      (x = e[12]),
      (h = e[13]),
      (I = e[14]),
      (g = e[15]),
      (v = e[16]),
      (P = e[17]),
      (f = e[18]),
      (y = e[19]),
      (b = e[20]),
      (_ = e[21]),
      ($ = e[22]),
      (R = e[23]),
      (j = e[24]));
  let E;
  e[29] !== o
    ? ((E = o("structure-error.error.label")), (e[29] = o), (e[30] = E))
    : (E = e[30]);
  let D;
  e[31] !== E
    ? ((D = p.jsx(K, { size: 1, weight: "medium", children: E })),
      (e[31] = E),
      (e[32] = D))
    : (D = e[32]);
  let z;
  e[33] !== a.message || e[34] !== l || e[35] !== r
    ? ((z = l ? Jt(r) : a.message),
      (e[33] = a.message),
      (e[34] = l),
      (e[35] = r),
      (e[36] = z))
    : (z = e[36]);
  let F;
  e[37] !== z
    ? ((F = p.jsx(be, { children: z })), (e[37] = z), (e[38] = F))
    : (F = e[38]);
  let C;
  e[39] !== D || e[40] !== F
    ? ((C = p.jsxs(me, { marginTop: 4, space: 2, children: [D, F] })),
      (e[39] = D),
      (e[40] = F),
      (e[41] = C))
    : (C = e[41]);
  let k;
  e[42] !== m || e[43] !== o
    ? ((k =
        m &&
        p.jsx(fe, {
          marginTop: 4,
          children: p.jsx(K, {
            children: p.jsx("a", {
              href: Re(m),
              rel: "noopener noreferrer",
              target: "_blank",
              children: o("structure-error.docs-link.text"),
            }),
          }),
        })),
      (e[42] = m),
      (e[43] = o),
      (e[44] = k))
    : (k = e[44]);
  let B;
  e[45] !== o
    ? ((B = o("structure-error.reload-button.text")), (e[45] = o), (e[46] = B))
    : (B = e[46]);
  let M;
  e[47] !== u || e[48] !== B
    ? ((M = p.jsx(fe, {
        marginTop: 4,
        children: p.jsx(Ze, { text: B, icon: et, tone: "primary", onClick: u }),
      })),
      (e[47] = u),
      (e[48] = B),
      (e[49] = M))
    : (M = e[49]);
  let O;
  e[50] !== c ||
  e[51] !== C ||
  e[52] !== P ||
  e[53] !== k ||
  e[54] !== M ||
  e[55] !== f ||
  e[56] !== y ||
  e[57] !== b ||
  e[58] !== _ ||
  e[59] !== $ ||
  e[60] !== R
    ? ((O = p.jsxs(c, {
        marginTop: P,
        padding: f,
        radius: y,
        overflow: b,
        shadow: _,
        tone: $,
        children: [R, C, k, M],
      })),
      (e[50] = c),
      (e[51] = C),
      (e[52] = P),
      (e[53] = k),
      (e[54] = M),
      (e[55] = f),
      (e[56] = y),
      (e[57] = b),
      (e[58] = _),
      (e[59] = $),
      (e[60] = R),
      (e[61] = O))
    : (O = e[61]);
  let N;
  e[62] !== d || e[63] !== O || e[64] !== j
    ? ((N = p.jsxs(d, { children: [j, O] })),
      (e[62] = d),
      (e[63] = O),
      (e[64] = j),
      (e[65] = N))
    : (N = e[65]);
  let A;
  return (
    e[66] !== i ||
    e[67] !== x ||
    e[68] !== h ||
    e[69] !== I ||
    e[70] !== g ||
    e[71] !== v ||
    e[72] !== N
      ? ((A = p.jsx(i, {
          height: x,
          overflow: h,
          padding: I,
          sizing: g,
          tone: v,
          children: N,
        })),
        (e[66] = i),
        (e[67] = x),
        (e[68] = h),
        (e[69] = I),
        (e[70] = g),
        (e[71] = v),
        (e[72] = N),
        (e[73] = A))
      : (A = e[73]),
    A
  );
}
function Qt(t, e) {
  return p.jsx(qt, { children: t }, `${t}-${e}`);
}
function Xt() {
  window.location.reload();
}
function Zt() {
  const t = L.c(17),
    { t: e } = ye(ge);
  let a;
  t[0] === Symbol.for("react.memo_cache_sentinel")
    ? ((a = p.jsx(fe, {
        children: p.jsx(K, { size: 1, children: p.jsx(gt, {}) }),
      })),
      (t[0] = a))
    : (a = t[0]);
  let n;
  t[1] !== e
    ? ((n = e("no-document-types-screen.title")), (t[1] = e), (t[2] = n))
    : (n = t[2]);
  let o;
  t[3] !== n
    ? ((o = p.jsx(K, { as: "h1", size: 1, weight: "medium", children: n })),
      (t[3] = n),
      (t[4] = o))
    : (o = t[4]);
  let r;
  t[5] !== e
    ? ((r = e("no-document-types-screen.subtitle")), (t[5] = e), (t[6] = r))
    : (r = t[6]);
  let s;
  t[7] !== r
    ? ((s = p.jsx(K, { as: "p", muted: !0, size: 1, children: r })),
      (t[7] = r),
      (t[8] = s))
    : (s = t[8]);
  let l;
  t[9] !== e
    ? ((l = e("no-document-types-screen.link-text")), (t[9] = e), (t[10] = l))
    : (l = t[10]);
  let c;
  t[11] !== l
    ? ((c = p.jsx(K, {
        as: "p",
        muted: !0,
        size: 1,
        children: p.jsx("a", {
          href: "https://www.sanity.io/docs/create-a-schema-and-configure-sanity-studio",
          target: "_blank",
          rel: "noreferrer",
          children: l,
        }),
      })),
      (t[11] = l),
      (t[12] = c))
    : (c = t[12]);
  let d;
  return (
    t[13] !== o || t[14] !== s || t[15] !== c
      ? ((d = p.jsx(oe, {
          height: "fill",
          children: p.jsx(_e, {
            align: "center",
            height: "fill",
            justify: "center",
            padding: 4,
            sizing: "border",
            children: p.jsx(De, {
              width: 0,
              children: p.jsx(oe, {
                padding: 4,
                radius: 2,
                shadow: 1,
                tone: "caution",
                children: p.jsxs(_e, {
                  children: [
                    a,
                    p.jsxs(me, {
                      flex: 1,
                      marginLeft: 3,
                      space: 3,
                      children: [o, s, c],
                    }),
                  ],
                }),
              }),
            }),
          }),
        })),
        (t[13] = o),
        (t[14] = s),
        (t[15] = c),
        (t[16] = d))
      : (d = t[16]),
    d
  );
}
const en = (t) => {
    const e = L.c(7),
      { documentId: a, documentType: n } = t,
      { selectedReleaseId: o } = pt(),
      r = mt(a, n, "default", o),
      s = ze(),
      { t: l } = ye(ge),
      c = !r?.published && !r?.draft,
      d = r?.version || r?.draft || r?.published,
      i = s.get(n),
      { value: u, isLoading: m } = ft({
        enabled: !!d,
        schemaType: i,
        value: d,
      }),
      { lastRevisionDocument: x } = ht(a, n),
      h =
        x && !d
          ? ""
          : c
            ? l("browser-document-title.new-document", {
                schemaType: i?.title || i?.name,
              })
            : u?.title || l("browser-document-title.untitled-document"),
      I = r.ready && !m,
      g = Oe(h);
    let v;
    e[0] !== g || e[1] !== I
      ? ((v = () => {
          I && (document.title = g);
        }),
        (e[0] = g),
        (e[1] = I),
        (e[2] = v))
      : (v = e[2]);
    let P;
    return (
      e[3] !== h || e[4] !== g || e[5] !== I
        ? ((P = [h, I, g]), (e[3] = h), (e[4] = g), (e[5] = I), (e[6] = P))
        : (P = e[6]),
      S.useEffect(v, P),
      null
    );
  },
  pe = (t) => {
    const e = L.c(5),
      { title: a } = t,
      n = Oe(a);
    let o;
    e[0] !== n
      ? ((o = () => {
          document.title = n;
        }),
        (e[0] = n),
        (e[1] = o))
      : (o = e[1]);
    let r;
    return (
      e[2] !== n || e[3] !== a
        ? ((r = [n, a]), (e[2] = n), (e[3] = a), (e[4] = r))
        : (r = e[4]),
      S.useEffect(o, r),
      null
    );
  },
  tn = (t) => {
    const e = L.c(8),
      { resolvedPanes: a } = t;
    if (!a?.length) return null;
    const n = a[a.length - 1];
    if (rn(n)) {
      let s;
      return (
        e[0] === Symbol.for("react.memo_cache_sentinel")
          ? ((s = p.jsx(pe, {})), (e[0] = s))
          : (s = e[0]),
        s
      );
    }
    if (an(n)) {
      if (n?.title) {
        let l;
        return (
          e[1] !== n.title
            ? ((l = p.jsx(pe, { title: n.title })),
              (e[1] = n.title),
              (e[2] = l))
            : (l = e[2]),
          l
        );
      }
      let s;
      return (
        e[3] !== n.options.id || e[4] !== n.options.type
          ? ((s = p.jsx(en, {
              documentId: n.options.id,
              documentType: n.options.type,
            })),
            (e[3] = n.options.id),
            (e[4] = n.options.type),
            (e[5] = s))
          : (s = e[5]),
        s
      );
    }
    const o = n?.title;
    let r;
    return (
      e[6] !== o
        ? ((r = p.jsx(pe, { title: o })), (e[6] = o), (e[7] = r))
        : (r = e[7]),
      r
    );
  };
function Oe(t) {
  const e = L.c(3),
    a = le().structureContext.title;
  let n;
  return (
    e[0] !== t || e[1] !== a
      ? ((n = [t, a].filter(nn)), (e[0] = t), (e[1] = a), (e[2] = n))
      : (n = e[2]),
    n.join(" | ")
  );
}
function nn(t) {
  return t;
}
function an(t) {
  return t !== W && t.type === "document";
}
function rn(t) {
  return t === W;
}
const sn = ke(It).withConfig({
    displayName: "StyledPaneLayout",
    componentId: "sc-1hgaa0f-0",
  })`min-height:100%;min-width:320px;`,
  on = tt("mod+s"),
  ln = S.memo(function (t) {
    const e = L.c(58),
      { onPaneChange: a } = t,
      { push: n } = nt(),
      o = ze(),
      { navigate: r } = ie(),
      s = he(),
      { layoutCollapsed: l, setLayoutCollapsed: c } = le(),
      d = Wt(),
      {
        paneDataItems: i,
        resolvedPanes: u,
        setMaximizedPane: m,
        maximizedPane: x,
      } = d,
      h = he(cn),
      { sanity: I } = at(),
      { media: g } = I,
      [v, P] = S.useState(null);
    let f;
    e[0] !== c ? ((f = () => c(!0)), (e[0] = c), (e[1] = f)) : (f = e[1]);
    const y = f;
    let b;
    e[2] !== c ? ((b = () => c(!1)), (e[2] = c), (e[3] = b)) : (b = e[3]);
    const _ = b;
    let $;
    if (e[4] !== i) {
      const w = i.findLastIndex(dn);
      (($ =
        w === -1
          ? i
          : i.slice(w).filter((T) => T.groupIndex <= i[w].groupIndex)),
        (e[4] = i),
        (e[5] = $));
    } else $ = e[5];
    const R = $;
    let j, E;
    (e[6] !== a || e[7] !== u
      ? ((j = () => {
          u.length && a(u);
        }),
        (E = [a, u]),
        (e[6] = a),
        (e[7] = u),
        (e[8] = j),
        (e[9] = E))
      : ((j = e[8]), (E = e[9])),
      S.useEffect(j, E));
    let D, z;
    (e[10] !== n
      ? ((D = () => {
          const w = (T) => {
            on(T) &&
              (T.preventDefault(),
              n({
                closable: !0,
                id: "auto-save-message",
                status: "info",
                title: "Your work is automatically saved!",
                duration: 4e3,
              }));
          };
          return (
            window.addEventListener("keydown", w),
            () => window.removeEventListener("keydown", w)
          );
        }),
        (z = [n]),
        (e[10] = n),
        (e[11] = D),
        (e[12] = z))
      : ((D = e[11]), (z = e[12])),
      S.useEffect(D, z));
    const F = o._original?.types.some(rt);
    let C;
    e[13] !== r || e[14] !== s?.panes || e[15] !== m
      ? ((C = (w) => {
          if (!w) return;
          const T = s?.panes || [];
          if (w.maximized) {
            (m(null), r({ panes: T }));
            return;
          }
          if (w.pane !== W && w.pane.type === "document") {
            const H = T.slice(0, w.groupIndex);
            (m(w), r({ panes: H }));
          }
        }),
        (e[13] = r),
        (e[14] = s?.panes),
        (e[15] = m),
        (e[16] = C))
      : (C = e[16]);
    const k = C,
      B = S.useRef(-1);
    let M;
    e[17] !== r || e[18] !== i || e[19] !== s?.panes || e[20] !== m
      ? ((M = () => {
          const w = i.find(un);
          if (!w) return;
          w.pane !== W && w.pane.type === "document" && m(w);
          const T = (s?.panes || []).map(mn);
          r({ panes: T }, { replace: !0 });
        }),
        (e[17] = r),
        (e[18] = i),
        (e[19] = s?.panes),
        (e[20] = m),
        (e[21] = M))
      : (M = e[21]);
    const O = s?.panes;
    let N;
    (e[22] !== r || e[23] !== i || e[24] !== m || e[25] !== O
      ? ((N = [r, i, O, m]),
        (e[22] = r),
        (e[23] = i),
        (e[24] = m),
        (e[25] = O),
        (e[26] = N))
      : (N = e[26]),
      S.useEffect(M, N));
    let A, G;
    if (
      (e[27] !== x || e[28] !== i || e[29] !== m
        ? ((A = () => {
            const w = i.findIndex(fn),
              T = B.current;
            if (((B.current = w), !!x)) {
              if (x.pane !== W && x.pane.type !== "document") {
                m(null);
                return;
              }
              if (w !== -1 && w !== T) {
                const H = i[w];
                m(H);
                return;
              }
              if (!i.some((H) => H.key === x.key)) {
                const H = i.find(
                  (X) =>
                    X.groupIndex === x.groupIndex &&
                    X.siblingIndex === x.siblingIndex &&
                    X.pane !== W &&
                    X.pane.type === "document",
                );
                m(H || null);
              }
            }
          }),
          (G = [x, i, m]),
          (e[27] = x),
          (e[28] = i),
          (e[29] = m),
          (e[30] = A),
          (e[31] = G))
        : ((A = e[30]), (G = e[31])),
      S.useEffect(A, G),
      !F)
    ) {
      let w;
      return (
        e[32] === Symbol.for("react.memo_cache_sentinel")
          ? ((w = p.jsx(Zt, {})), (e[32] = w))
          : (w = e[32]),
        w
      );
    }
    const V = v || null,
      de = l ? void 0 : "fill",
      Ve = g[1];
    let U;
    if (e[33] !== k || e[34] !== R) {
      let w;
      (e[36] !== k
        ? ((w = (T) => {
            const {
              active: H,
              childItemId: X,
              groupIndex: We,
              itemId: Be,
              key: Pe,
              pane: ae,
              index: we,
              params: Ae,
              path: ve,
              payload: He,
              siblingIndex: Fe,
              selected: Se,
              maximized: Ge,
            } = T;
            return p.jsx(
              S.Fragment,
              {
                children:
                  ae === W
                    ? p.jsx(je, { paneKey: Pe, path: ve, selected: Se })
                    : p.jsx(it, {
                        active: H,
                        groupIndex: We,
                        index: we,
                        pane: ae,
                        childItemId: X,
                        itemId: Be,
                        paneKey: Pe,
                        params: Ae,
                        payload: He,
                        path: ve,
                        selected: Se,
                        siblingIndex: Fe,
                        maximized: Ge,
                        onSetMaximizedPane: () => k(T),
                      }),
              },
              `${ae === W ? "loading" : ae.type}-${we}`,
            );
          }),
          (e[36] = k),
          (e[37] = w))
        : (w = e[37]),
        (U = R.map(w)),
        (e[33] = k),
        (e[34] = R),
        (e[35] = U));
    } else U = e[35];
    let q;
    e[38] !== h || e[39] !== i.length
      ? ((q = i.length <= 1 && h && p.jsx(je, { paneKey: "intent-resolver" })),
        (e[38] = h),
        (e[39] = i.length),
        (e[40] = q))
      : (q = e[40]);
    let J;
    e[41] !== y ||
    e[42] !== _ ||
    e[43] !== g[1] ||
    e[44] !== de ||
    e[45] !== U ||
    e[46] !== q
      ? ((J = p.jsxs(sn, {
          flex: 1,
          height: de,
          minWidth: Ve,
          onCollapse: y,
          onExpand: _,
          children: [U, q],
        })),
        (e[41] = y),
        (e[42] = _),
        (e[43] = g[1]),
        (e[44] = de),
        (e[45] = U),
        (e[46] = q),
        (e[47] = J))
      : (J = e[47]);
    let Y;
    e[48] !== u
      ? ((Y = p.jsx(tn, { resolvedPanes: u })), (e[48] = u), (e[49] = Y))
      : (Y = e[49]);
    let te;
    e[50] === Symbol.for("react.memo_cache_sentinel")
      ? ((te = p.jsx("div", { "data-portal": "", ref: P })), (e[50] = te))
      : (te = e[50]);
    let Q;
    e[51] !== V || e[52] !== J || e[53] !== Y
      ? ((Q = p.jsxs(lt, { element: V, children: [J, Y, te] })),
        (e[51] = V),
        (e[52] = J),
        (e[53] = Y),
        (e[54] = Q))
      : (Q = e[54]);
    let ne;
    return (
      e[55] !== d || e[56] !== Q
        ? ((ne = p.jsx(st, { value: d, children: Q })),
          (e[55] = d),
          (e[56] = Q),
          (e[57] = ne))
        : (ne = e[57]),
      ne
    );
  });
function cn(t) {
  return typeof t.intent == "string";
}
function dn(t) {
  return t.maximized;
}
function un(t) {
  return t.params?.mode === "focus";
}
function pn(t) {
  const { mode: e, ...a } = t.params || {},
    n = Object.keys(a).length ? a : void 0;
  return { ...t, params: n };
}
function mn(t) {
  return t.map(pn);
}
function fn(t) {
  return t.selected;
}
function gn(t) {
  const e = L.c(14),
    { tool: a } = t,
    { options: n } = a,
    { unstable_sources: o } = qe(),
    [r] = o;
  let s;
  e[0] !== n ? ((s = n || {}), (e[0] = n), (e[1] = s)) : (s = e[1]);
  const { source: l, defaultDocumentNode: c, structure: d } = s;
  let i;
  (e[2] === Symbol.for("react.memo_cache_sentinel")
    ? ((i = []), (e[2] = i))
    : (i = e[2]),
    S.useEffect(hn, i));
  let u;
  e[3] === Symbol.for("react.memo_cache_sentinel")
    ? ((u = { error: null }), (e[3] = u))
    : (u = e[3]);
  const [m, x] = S.useState(u),
    { error: h } = m;
  if (h) {
    let y;
    return (
      e[4] !== h
        ? ((y = p.jsx(Yt, { error: h })), (e[4] = h), (e[5] = y))
        : (y = e[5]),
      y
    );
  }
  const I = l || r.name;
  let g, v;
  e[6] === Symbol.for("react.memo_cache_sentinel")
    ? ((g = p.jsx(ln, { onPaneChange: xe })),
      (v = p.jsx(Kt, {})),
      (e[6] = g),
      (e[7] = v))
    : ((g = e[6]), (v = e[7]));
  let P;
  e[8] !== c || e[9] !== d
    ? ((P = p.jsxs(ot, {
        defaultDocumentNode: c,
        structure: d,
        children: [g, v],
      })),
      (e[8] = c),
      (e[9] = d),
      (e[10] = P))
    : (P = e[10]);
  let f;
  return (
    e[11] !== I || e[12] !== P
      ? ((f = p.jsx(Je, {
          onCatch: x,
          children: p.jsx(Ye, { name: I, children: P }),
        })),
        (e[11] = I),
        (e[12] = P),
        (e[13] = f))
      : (f = e[13]),
    f
  );
}
function hn() {
  return (xe([]), xn);
}
function xn() {
  return xe([]);
}
export { gn as default };
