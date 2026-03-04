module.exports = [
"[project]/superteam-academy/src/app/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/superteam-academy/node_modules/next/script.js [app-rsc] (ecmascript)");
;
;
;
;
function getSafeGaMeasurementId(value) {
    if (!value) return null;
    const trimmed = value.trim();
    return /^G-[A-Z0-9]+$/i.test(trimmed) ? trimmed : null;
}
function getSafeClarityProjectId(value) {
    if (!value) return null;
    const trimmed = value.trim();
    return /^[a-z0-9]+$/i.test(trimmed) ? trimmed : null;
}
async function getHtmlLang() {
    const locale = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])()).get("NEXT_LOCALE")?.value;
    if (locale === "pt-BR" || locale === "es" || locale === "en") {
        return locale;
    }
    return "en";
}
const metadata = {
    title: "Superteam Academy — Learn Solana, Earn On-Chain",
    description: "Decentralized learning platform on Solana. Complete lessons, earn soulbound XP, and collect credential NFTs."
};
async function RootLayout({ children }) {
    const htmlLang = await getHtmlLang();
    const gaMeasurementId = getSafeGaMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
    const clarityProjectId = getSafeClarityProjectId(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: htmlLang,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            className: "antialiased min-h-screen",
            children: [
                children,
                gaMeasurementId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            src: `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`,
                            strategy: "afterInteractive"
                        }, void 0, false, {
                            fileName: "[project]/superteam-academy/src/app/layout.tsx",
                            lineNumber: 51,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            id: "google-analytics",
                            strategy: "afterInteractive",
                            children: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `
                        }, void 0, false, {
                            fileName: "[project]/superteam-academy/src/app/layout.tsx",
                            lineNumber: 55,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : null,
                clarityProjectId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$superteam$2d$academy$2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                    id: "microsoft-clarity",
                    strategy: "afterInteractive",
                    children: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `
                }, void 0, false, {
                    fileName: "[project]/superteam-academy/src/app/layout.tsx",
                    lineNumber: 66,
                    columnNumber: 11
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/superteam-academy/src/app/layout.tsx",
            lineNumber: 47,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/superteam-academy/src/app/layout.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=superteam-academy_src_app_layout_tsx_4f3a0d04._.js.map