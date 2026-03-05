import S from "./javascript-BJ-GTedN.js";
o.displayName = "markup";
o.aliases = ["atom", "html", "mathml", "rss", "ssml", "svg", "xml"];
function o(e) {
  ((e.languages.markup = {
    comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: !0 },
    prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: !0 },
    doctype: {
      pattern:
        /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
      greedy: !0,
      inside: {
        "internal-subset": {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: !0,
          greedy: !0,
          inside: null,
        },
        string: { pattern: /"[^"]*"|'[^']*'/, greedy: !0 },
        punctuation: /^<!|>$|[[\]]/,
        "doctype-tag": /^DOCTYPE/i,
        name: /[^\s<>'"]+/,
      },
    },
    cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: !0 },
    tag: {
      pattern:
        /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
      greedy: !0,
      inside: {
        tag: {
          pattern: /^<\/?[^\s>\/]+/,
          inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ },
        },
        "special-attr": [],
        "attr-value": {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            punctuation: [
              { pattern: /^=/, alias: "attr-equals" },
              { pattern: /^(\s*)["']|["']$/, lookbehind: !0 },
            ],
          },
        },
        punctuation: /\/?>/,
        "attr-name": {
          pattern: /[^\s>\/]+/,
          inside: { namespace: /^[^\s>\/:]+:/ },
        },
      },
    },
    entity: [
      { pattern: /&[\da-z]{1,8};/i, alias: "named-entity" },
      /&#x?[\da-f]{1,8};/i,
    ],
  }),
    (e.languages.markup.tag.inside["attr-value"].inside.entity =
      e.languages.markup.entity),
    (e.languages.markup.doctype.inside["internal-subset"].inside =
      e.languages.markup),
    e.hooks.add("wrap", function (t) {
      t.type === "entity" &&
        (t.attributes.title = t.content.value.replace(/&amp;/, "&"));
    }),
    Object.defineProperty(e.languages.markup.tag, "addInlined", {
      value: function (g, l) {
        var c = {};
        ((c["language-" + l] = {
          pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
          lookbehind: !0,
          inside: e.languages[l],
        }),
          (c.cdata = /^<!\[CDATA\[|\]\]>$/i));
        var p = {
          "included-cdata": { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: c },
        };
        p["language-" + l] = { pattern: /[\s\S]+/, inside: e.languages[l] };
        var r = {};
        ((r[g] = {
          pattern: RegExp(
            /(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(
              /__/g,
              function () {
                return g;
              },
            ),
            "i",
          ),
          lookbehind: !0,
          greedy: !0,
          inside: p,
        }),
          e.languages.insertBefore("markup", "cdata", r));
      },
    }),
    Object.defineProperty(e.languages.markup.tag, "addAttribute", {
      value: function (t, g) {
        e.languages.markup.tag.inside["special-attr"].push({
          pattern: RegExp(
            /(^|["'\s])/.source +
              "(?:" +
              t +
              ")" +
              /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
            "i",
          ),
          lookbehind: !0,
          inside: {
            "attr-name": /^[^\s=]+/,
            "attr-value": {
              pattern: /=[\s\S]+/,
              inside: {
                value: {
                  pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                  lookbehind: !0,
                  alias: [g, "language-" + g],
                  inside: e.languages[g],
                },
                punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/],
              },
            },
          },
        });
      },
    }),
    (e.languages.html = e.languages.markup),
    (e.languages.mathml = e.languages.markup),
    (e.languages.svg = e.languages.markup),
    (e.languages.xml = e.languages.extend("markup", {})),
    (e.languages.ssml = e.languages.xml),
    (e.languages.atom = e.languages.xml),
    (e.languages.rss = e.languages.xml));
}
h.displayName = "jsx";
h.aliases = [];
function h(e) {
  (e.register(S),
    e.register(o),
    (function (t) {
      var g = t.util.clone(t.languages.javascript),
        l = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source,
        c = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source,
        p = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
      function r(a, n) {
        return (
          (a = a
            .replace(/<S>/g, function () {
              return l;
            })
            .replace(/<BRACES>/g, function () {
              return c;
            })
            .replace(/<SPREAD>/g, function () {
              return p;
            })),
          RegExp(a, n)
        );
      }
      ((p = r(p).source),
        (t.languages.jsx = t.languages.extend("markup", g)),
        (t.languages.jsx.tag.pattern = r(
          /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/
            .source,
        )),
        (t.languages.jsx.tag.inside.tag.pattern = /^<\/?[^\s>\/]*/),
        (t.languages.jsx.tag.inside["attr-value"].pattern =
          /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/),
        (t.languages.jsx.tag.inside.tag.inside["class-name"] =
          /^[A-Z]\w*(?:\.[A-Z]\w*)*$/),
        (t.languages.jsx.tag.inside.comment = g.comment),
        t.languages.insertBefore(
          "inside",
          "attr-name",
          {
            spread: { pattern: r(/<SPREAD>/.source), inside: t.languages.jsx },
          },
          t.languages.jsx.tag,
        ),
        t.languages.insertBefore(
          "inside",
          "special-attr",
          {
            script: {
              pattern: r(/=<BRACES>/.source),
              alias: "language-javascript",
              inside: {
                "script-punctuation": {
                  pattern: /^=(?=\{)/,
                  alias: "punctuation",
                },
                rest: t.languages.jsx,
              },
            },
          },
          t.languages.jsx.tag,
        ));
      var i = function (a) {
          return a
            ? typeof a == "string"
              ? a
              : typeof a.content == "string"
                ? a.content
                : a.content.map(i).join("")
            : "";
        },
        f = function (a) {
          for (var n = [], u = 0; u < a.length; u++) {
            var s = a[u],
              y = !1;
            if (
              (typeof s != "string" &&
                (s.type === "tag" && s.content[0] && s.content[0].type === "tag"
                  ? s.content[0].content[0].content === "</"
                    ? n.length > 0 &&
                      n[n.length - 1].tagName === i(s.content[0].content[1]) &&
                      n.pop()
                    : s.content[s.content.length - 1].content === "/>" ||
                      n.push({
                        tagName: i(s.content[0].content[1]),
                        openedBraces: 0,
                      })
                  : n.length > 0 &&
                      s.type === "punctuation" &&
                      s.content === "{"
                    ? n[n.length - 1].openedBraces++
                    : n.length > 0 &&
                        n[n.length - 1].openedBraces > 0 &&
                        s.type === "punctuation" &&
                        s.content === "}"
                      ? n[n.length - 1].openedBraces--
                      : (y = !0)),
              (y || typeof s == "string") &&
                n.length > 0 &&
                n[n.length - 1].openedBraces === 0)
            ) {
              var d = i(s);
              (u < a.length - 1 &&
                (typeof a[u + 1] == "string" ||
                  a[u + 1].type === "plain-text") &&
                ((d += i(a[u + 1])), a.splice(u + 1, 1)),
                u > 0 &&
                  (typeof a[u - 1] == "string" ||
                    a[u - 1].type === "plain-text") &&
                  ((d = i(a[u - 1]) + d), a.splice(u - 1, 1), u--),
                (a[u] = new t.Token("plain-text", d, null, d)));
            }
            s.content && typeof s.content != "string" && f(s.content);
          }
        };
      t.hooks.add("after-tokenize", function (a) {
        (a.language !== "jsx" && a.language !== "tsx") || f(a.tokens);
      });
    })(e));
}
export { h as default };
