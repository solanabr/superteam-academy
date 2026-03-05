import { n as c, j as i } from "./sanity-DDM0-WJH.js";
import { hasLanguage as f, Refractor as d } from "./index-HnjQzN9I.js";
function p(u) {
  const e = c.c(13),
    { language: g, value: a } = u,
    t = typeof g == "string" ? g : void 0;
  let o;
  e[0] !== t ? ((o = t ? f(t) : !1), (e[0] = t), (e[1] = o)) : (o = e[1]);
  const r = o;
  let n;
  e[2] !== t || e[3] !== r || e[4] !== a
    ? ((n = !(t && r) && i.jsx("code", { children: a })),
      (e[2] = t),
      (e[3] = r),
      (e[4] = a),
      (e[5] = n))
    : (n = e[5]);
  let s;
  e[6] !== t || e[7] !== r || e[8] !== a
    ? ((s = t && r && i.jsx(d, { inline: !0, language: t, value: String(a) })),
      (e[6] = t),
      (e[7] = r),
      (e[8] = a),
      (e[9] = s))
    : (s = e[9]);
  let l;
  return (
    e[10] !== n || e[11] !== s
      ? ((l = i.jsxs(i.Fragment, { children: [n, s] })),
        (e[10] = n),
        (e[11] = s),
        (e[12] = l))
      : (l = e[12]),
    l
  );
}
p.displayName = "LazyRefractor";
export { p as default };
