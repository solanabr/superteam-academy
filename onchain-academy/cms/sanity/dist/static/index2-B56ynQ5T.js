import {
  c as k,
  r as C,
  o as U,
  p as $,
  j as u,
  P as g,
  q as A,
  B as G,
  s as T,
  t as q,
  A as L,
  v as V,
  w as K,
  x as N,
  y as W,
} from "./sanity-DDM0-WJH.js";
const _ = A(G).withConfig({
  displayName: "Root",
  componentId: "sc-s75qv0-0",
})`position:relative;`;
function z(d) {
  const e = k.c(3),
    { children: o } = d,
    { collapsed: s } = N();
  let t;
  return (
    e[0] !== o || e[1] !== s
      ? ((t = u.jsx(_, {
          hidden: s,
          height: "fill",
          overflow: "auto",
          children: o,
        })),
        (e[0] = o),
        (e[1] = s),
        (e[2] = t))
      : (t = e[2]),
    t
  );
}
function D(d) {
  const e = k.c(11),
    {
      actionHandlers: o,
      index: s,
      menuItems: t,
      menuItemGroups: a,
      title: n,
    } = d,
    { features: r } = T();
  if (!t?.length && !n) return null;
  let l;
  e[0] !== o || e[1] !== a || e[2] !== t
    ? ((l = u.jsx(W, { menuItems: t, menuItemGroups: a, actionHandlers: o })),
      (e[0] = o),
      (e[1] = a),
      (e[2] = t),
      (e[3] = l))
    : (l = e[3]);
  let c;
  e[4] !== r.backButton || e[5] !== s
    ? ((c =
        r.backButton &&
        s > 0 &&
        u.jsx(q, {
          as: V,
          "data-as": "a",
          icon: L,
          mode: "bleed",
          tooltipProps: { content: "Back" },
        })),
      (e[4] = r.backButton),
      (e[5] = s),
      (e[6] = c))
    : (c = e[6]);
  let i;
  return (
    e[7] !== l || e[8] !== c || e[9] !== n
      ? ((i = u.jsx(K, { actions: l, backButton: c, title: n })),
        (e[7] = l),
        (e[8] = c),
        (e[9] = n),
        (e[10] = i))
      : (i = e[10]),
    i
  );
}
function M(d) {
  const e = k.c(37);
  let o, s, t, a;
  e[0] !== d
    ? (({ index: o, pane: s, paneKey: t, ...a } = d),
      (e[0] = d),
      (e[1] = o),
      (e[2] = s),
      (e[3] = t),
      (e[4] = a))
    : ((o = e[1]), (s = e[2]), (t = e[3]), (a = e[4]));
  let n, r, l, c, i;
  if (e[5] !== s) {
    const {
      child: b,
      component: v,
      menuItems: R,
      menuItemGroups: S,
      type: F,
      ...w
    } = s;
    ((r = b),
      (n = v),
      (c = R),
      (l = S),
      (i = w),
      (e[5] = s),
      (e[6] = n),
      (e[7] = r),
      (e[8] = l),
      (e[9] = c),
      (e[10] = i));
  } else ((n = e[6]), (r = e[7]), (l = e[8]), (c = e[9]), (i = e[10]));
  const [E, H] = C.useState(null),
    { title: y } = U(s),
    I = y === void 0 ? "" : y;
  let m, p;
  e[11] !== i || e[12] !== a
    ? (({ key: p, ...m } = { ...a, ...i }),
      (e[11] = i),
      (e[12] = a),
      (e[13] = m),
      (e[14] = p))
    : ((m = e[13]), (p = e[14]));
  const B = E?.actionHandlers;
  let x;
  e[15] !== o || e[16] !== l || e[17] !== c || e[18] !== B || e[19] !== I
    ? ((x = u.jsx(D, {
        actionHandlers: B,
        index: o,
        menuItems: c,
        menuItemGroups: l,
        title: I,
      })),
      (e[15] = o),
      (e[16] = l),
      (e[17] = c),
      (e[18] = B),
      (e[19] = I),
      (e[20] = x))
    : (x = e[20]);
  let f;
  e[21] !== n || e[22] !== r || e[23] !== m || e[24] !== p || e[25] !== t
    ? ((f =
        $.isValidElementType(n) &&
        u.jsx(n, { ...m, ref: H, child: r, paneKey: t }, p)),
      (e[21] = n),
      (e[22] = r),
      (e[23] = m),
      (e[24] = p),
      (e[25] = t),
      (e[26] = f))
    : (f = e[26]);
  let P;
  e[27] !== n
    ? ((P = C.isValidElement(n) && n), (e[27] = n), (e[28] = P))
    : (P = e[28]);
  let h;
  e[29] !== f || e[30] !== P
    ? ((h = u.jsxs(z, { children: [f, P] })),
      (e[29] = f),
      (e[30] = P),
      (e[31] = h))
    : (h = e[31]);
  let j;
  return (
    e[32] !== t || e[33] !== a.isSelected || e[34] !== x || e[35] !== h
      ? ((j = u.jsxs(g, {
          id: t,
          minWidth: 320,
          selected: a.isSelected,
          children: [x, h],
        })),
        (e[32] = t),
        (e[33] = a.isSelected),
        (e[34] = x),
        (e[35] = h),
        (e[36] = j))
      : (j = e[36]),
    j
  );
}
export { M as default };
