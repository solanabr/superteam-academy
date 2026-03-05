import {
  c as b,
  o as T,
  j as d,
  P as S,
  q as B,
  B as D,
  T as $,
  z as G,
  s as E,
  x as H,
  t as W,
  A as F,
  v as N,
  w as R,
  D as z,
  E as O,
  F as q,
  G as K,
  I as M,
  y as U,
} from "./sanity-DDM0-WJH.js";
const X = B(D).withConfig({
    displayName: "DividerContainer",
    componentId: "sc-j4cdg4-0",
  })`display:flex;align-items:center;gap:1rem;margin:0.75rem 0 0.25rem 0;`,
  L = B.hr.withConfig({
    displayName: "Divider",
    componentId: "sc-j4cdg4-1",
  })`flex:1;background-color:var(--card-border-color);height:1px;margin:0;border:none;`,
  J = B($).withConfig({
    displayName: "DividerTitle",
    componentId: "sc-j4cdg4-2",
  })`padding-bottom:0.75rem;padding-left:0.5rem;padding-right:0.5rem;`;
function Q(f) {
  const e = b.c(5),
    { item: r } = f,
    { title: t } = T(r);
  let s;
  e[0] !== t
    ? ((s = d.jsx(J, { weight: "semibold", muted: !0, size: 1, children: t })),
      (e[0] = t),
      (e[1] = s))
    : (s = e[1]);
  let a;
  e[2] === Symbol.for("react.memo_cache_sentinel")
    ? ((a = d.jsx(L, {})), (e[2] = a))
    : (a = e[2]);
  let i;
  return (
    e[3] !== s
      ? ((i = d.jsxs(X, { children: [s, a] })), (e[3] = s), (e[4] = i))
      : (i = e[4]),
    i
  );
}
function V(f) {
  const e = b.c(20),
    {
      childItemId: r,
      items: t,
      isActive: s,
      layout: a,
      showIcons: i,
      title: l,
    } = f,
    { collapsed: y } = z();
  let h;
  e[0] !== t ? ((h = t?.filter(Y)), (e[0] = t), (e[1] = h)) : (h = e[1]);
  const c = O(h);
  let o;
  e[2] !== t
    ? ((o = (n) => t?.find((P, w) => w === n)?.type === "divider"),
      (e[2] = t),
      (e[3] = o))
    : (o = e[3]);
  const u = o;
  let v;
  e[4] !== i
    ? ((v = (n) => n.displayOptions?.showIcon ?? i ?? !1),
      (e[4] = i),
      (e[5] = v))
    : (v = e[5]);
  const x = v;
  let m;
  e[6] !== r || e[7] !== c || e[8] !== s || e[9] !== a || e[10] !== x
    ? ((m = (n, P) => {
        const { virtualIndex: w } = P;
        if (n.type === "divider")
          return d.jsx(
            D,
            {
              marginBottom: 1,
              children: n.title ? d.jsx(Q, { item: n }) : d.jsx(L, {}),
            },
            `divider-${w}`,
          );
        const C = !s && r === n.id,
          k = s && r === n.id,
          A =
            n._id && n.schemaType
              ? { _id: n._id, _type: n.schemaType.name, title: n.title }
              : void 0;
        return d.jsx(
          M,
          {
            icon: x(n) ? n.icon : !1,
            id: n.id,
            layout: a,
            marginBottom: 1,
            pressed: C,
            schemaType: n.schemaType,
            selected: k,
            title: c(n).title,
            value: A,
          },
          n.id,
        );
      }),
      (e[6] = r),
      (e[7] = c),
      (e[8] = s),
      (e[9] = a),
      (e[10] = x),
      (e[11] = m))
    : (m = e[11]);
  const I = m,
    g = y ? "hidden" : "auto";
  let p;
  e[12] !== u || e[13] !== t || e[14] !== I || e[15] !== l
    ? ((p =
        t &&
        t.length > 0 &&
        d.jsx(q, {
          activeItemDataAttr: "data-hovered",
          ariaLabel: l,
          canReceiveFocus: !0,
          getItemDisabled: u,
          itemHeight: 51,
          items: t,
          onlyShowSelectionWhenActive: !0,
          paddingBottom: 1,
          paddingX: 3,
          renderItem: I,
          wrapAround: !1,
        })),
      (e[12] = u),
      (e[13] = t),
      (e[14] = I),
      (e[15] = l),
      (e[16] = p))
    : (p = e[16]);
  let j;
  return (
    e[17] !== g || e[18] !== p
      ? ((j = d.jsx(K, { overflow: g, children: p })),
        (e[17] = g),
        (e[18] = p),
        (e[19] = j))
      : (j = e[19]),
    j
  );
}
function Y(f) {
  return f.type !== "divider";
}
const Z = (f) => {
  const e = b.c(11),
    { index: r, menuItems: t, menuItemGroups: s, title: a } = f,
    { features: i } = E(),
    { collapsed: l, isLast: y } = H(),
    h = y && !l ? -1 : 0;
  let c;
  e[0] !== s || e[1] !== t
    ? ((c = d.jsx(U, { menuItems: t, menuItemGroups: s })),
      (e[0] = s),
      (e[1] = t),
      (e[2] = c))
    : (c = e[2]);
  let o;
  e[3] !== i.backButton || e[4] !== r
    ? ((o =
        i.backButton &&
        r > 0 &&
        d.jsx(W, {
          as: N,
          "data-as": "a",
          icon: F,
          mode: "bleed",
          tooltipProps: { content: "Back" },
        })),
      (e[3] = i.backButton),
      (e[4] = r),
      (e[5] = o))
    : (o = e[5]);
  let u;
  return (
    e[6] !== c || e[7] !== o || e[8] !== h || e[9] !== a
      ? ((u = d.jsx(R, { actions: c, backButton: o, tabIndex: h, title: a })),
        (e[6] = c),
        (e[7] = o),
        (e[8] = h),
        (e[9] = a),
        (e[10] = u))
      : (u = e[10]),
    u
  );
};
function ee(f) {
  const e = b.c(21),
    {
      childItemId: r,
      index: t,
      isActive: s,
      isSelected: a,
      pane: i,
      paneKey: l,
    } = f,
    {
      defaultLayout: y,
      displayOptions: h,
      items: c,
      menuItems: o,
      menuItemGroups: u,
    } = i,
    v = h?.showIcons !== !1,
    { title: x } = T(i);
  let m;
  e[0] !== i.source ? ((m = G), (e[0] = i.source), (e[1] = m)) : (m = e[1]);
  let I;
  e[2] !== t || e[3] !== u || e[4] !== o || e[5] !== x
    ? ((I = d.jsx(Z, { index: t, menuItems: o, menuItemGroups: u, title: x })),
      (e[2] = t),
      (e[3] = u),
      (e[4] = o),
      (e[5] = x),
      (e[6] = I))
    : (I = e[6]);
  let g;
  e[7] !== r ||
  e[8] !== y ||
  e[9] !== s ||
  e[10] !== c ||
  e[11] !== l ||
  e[12] !== v ||
  e[13] !== x
    ? ((g = d.jsx(
        V,
        {
          childItemId: r,
          isActive: s,
          items: c,
          layout: y,
          showIcons: v,
          title: x,
        },
        l,
      )),
      (e[7] = r),
      (e[8] = y),
      (e[9] = s),
      (e[10] = c),
      (e[11] = l),
      (e[12] = v),
      (e[13] = x),
      (e[14] = g))
    : (g = e[14]);
  let p;
  return (
    e[15] !== a || e[16] !== l || e[17] !== m || e[18] !== I || e[19] !== g
      ? ((p = d.jsxs(S, {
          currentMaxWidth: 350,
          "data-testid": "structure-tool-list-pane",
          "data-ui": "ListPane",
          id: l,
          maxWidth: 640,
          minWidth: 320,
          selected: a,
          children: [m, I, g],
        })),
        (e[15] = a),
        (e[16] = l),
        (e[17] = m),
        (e[18] = I),
        (e[19] = g),
        (e[20] = p))
      : (p = e[20]),
    p
  );
}
export { ee as default };
