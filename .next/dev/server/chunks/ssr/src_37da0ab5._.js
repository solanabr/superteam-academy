module.exports = [
"[project]/src/components/ui/spotlight-card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpotlightCard",
    ()=>SpotlightCard,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function SpotlightCard({ children, className, spotlightColor = "rgba(153, 69, 255, 0.22)", spotlightRadius = 600, hoverVariant = "default", disableLift = false, frameEffect = true, style, onMouseMove, onMouseEnter, onMouseLeave, ...props }) {
    const cardRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [opacity, setOpacity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const subtle = hoverVariant === "subtle";
    const handleMouseMove = (event)=>{
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setPosition({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            });
        }
        onMouseMove?.(event);
    };
    const handleMouseEnter = (event)=>{
        setOpacity(1);
        setActive(true);
        onMouseEnter?.(event);
    };
    const handleMouseLeave = (event)=>{
        setOpacity(0);
        setActive(false);
        onMouseLeave?.(event);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: cardRef,
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("group relative overflow-hidden rounded-xl border bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] transition-[transform,border-color,box-shadow] duration-200 motion-reduce:transition-none", !disableLift && "hover:-translate-y-px", className),
        style: {
            borderColor: frameEffect ? active ? subtle ? "rgba(153, 69, 255, 0.28)" : "rgba(153, 69, 255, 0.4)" : "var(--border-subtle)" : "var(--border-subtle)",
            boxShadow: frameEffect ? active ? subtle ? "0 8px 18px -14px rgba(153,69,255,0.45), 0 8px 18px -14px rgba(25,251,155,0.35), 0 0 0 1px rgba(153,69,255,0.10)" : "0 10px 24px -12px rgba(153,69,255,0.8), 0 10px 24px -16px rgba(25,251,155,0.7), 0 0 0 1px rgba(255,210,63,0.16)" : "var(--shadow-card)" : "var(--shadow-card)",
            ...style
        },
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "pointer-events-none absolute -inset-px z-0 transition-opacity duration-300 motion-reduce:hidden",
                style: {
                    opacity,
                    background: `radial-gradient(${spotlightRadius}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 58%)`
                }
            }, void 0, false, {
                fileName: "[project]/src/components/ui/spotlight-card.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 motion-reduce:hidden",
                style: {
                    opacity: active ? subtle ? 0.45 : 0.9 : subtle ? 0.12 : 0.2,
                    background: "linear-gradient(125deg, rgba(153,69,255,0.10) 0%, rgba(25,251,155,0.08) 40%, rgba(0,140,76,0.10) 72%, rgba(255,210,63,0.08) 100%)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/ui/spotlight-card.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10",
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/ui/spotlight-card.tsx",
                lineNumber: 105,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/spotlight-card.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
const __TURBOPACK__default__export__ = SpotlightCard;
}),
"[project]/src/components/auth/AuthMethodsCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthMethodsCard",
    ()=>AuthMethodsCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/WalletButton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$spotlight$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/spotlight-card.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function AuthMethodsCard({ title, subtitle, providers, onGoogle, onGithub, walletLabel, googleLabel, githubLabel, googleUnavailable, githubUnavailable }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$spotlight$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpotlightCard"], {
        className: "rounded-2xl",
        spotlightColor: "rgba(153, 69, 255, 0.2)",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "rounded-2xl p-6",
            style: {
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-lg font-semibold",
                    style: {
                        color: "var(--text-primary)"
                    },
                    children: title
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm mt-1 mb-5",
                    style: {
                        color: "var(--text-secondary)"
                    },
                    children: subtitle
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                    lineNumber: 46,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onGoogle,
                            disabled: !providers.google,
                            className: "w-full min-h-[46px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
                            style: {
                                background: providers.google ? "linear-gradient(135deg, rgba(153,69,255,0.95), rgba(25,251,155,0.72))" : "var(--bg-elevated)",
                                border: providers.google ? "1px solid rgba(153,69,255,0.35)" : "1px solid var(--border-default)",
                                color: providers.google ? "#fff" : "var(--text-primary)",
                                boxShadow: providers.google ? "0 8px 22px rgba(153,69,255,0.28)" : "none"
                            },
                            title: !providers.google ? googleUnavailable : undefined,
                            children: providers.google ? googleLabel : googleUnavailable
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onGithub,
                            disabled: !providers.github,
                            className: "w-full min-h-[46px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
                            style: {
                                background: providers.github ? "linear-gradient(135deg, rgba(0,140,76,0.92), rgba(47,107,63,0.82))" : "var(--bg-elevated)",
                                border: providers.github ? "1px solid rgba(0,140,76,0.35)" : "1px solid var(--border-default)",
                                color: providers.github ? "#fff" : "var(--text-primary)",
                                boxShadow: providers.github ? "0 8px 22px rgba(0,140,76,0.28)" : "none"
                            },
                            title: !providers.github ? githubUnavailable : undefined,
                            children: providers.github ? githubLabel : githubUnavailable
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pt-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs mb-2",
                                    style: {
                                        color: "var(--text-muted)"
                                    },
                                    children: walletLabel
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                                    lineNumber: 94,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WalletButton"], {}, void 0, false, {
                                    fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                                    lineNumber: 97,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                            lineNumber: 93,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/auth/AuthMethodsCard.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/auth/AuthOnboardingForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthOnboardingForm",
    ()=>AuthOnboardingForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$spotlight$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/spotlight-card.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function AuthOnboardingForm({ title, subtitle, displayNameLabel, displayNamePlaceholder, usernameLabel, usernamePlaceholder, submitLabel, submittingLabel, validationMessage, initialDisplayName, initialUsername, onSubmit }) {
    const [displayName, setDisplayName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialDisplayName ?? "");
    const [username, setUsername] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialUsername ?? "");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [submitting, setSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        const normalizedName = displayName.trim();
        const normalizedUsername = username.trim();
        if (!normalizedName && !normalizedUsername) {
            setError(validationMessage);
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit({
                displayName: normalizedName,
                username: normalizedUsername
            });
        } catch  {
            setError(validationMessage);
        } finally{
            setSubmitting(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$spotlight$2d$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpotlightCard"], {
        className: "rounded-2xl",
        spotlightColor: "rgba(25, 251, 155, 0.18)",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            onSubmit: handleSubmit,
            className: "rounded-2xl p-6",
            style: {
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-lg font-semibold",
                    style: {
                        color: "var(--text-primary)"
                    },
                    children: title
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm mt-1 mb-5",
                    style: {
                        color: "var(--text-secondary)"
                    },
                    children: subtitle
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 76,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "block mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs",
                            style: {
                                color: "var(--text-muted)"
                            },
                            children: displayNameLabel
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                            lineNumber: 81,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            value: displayName,
                            onChange: (event)=>setDisplayName(event.target.value),
                            placeholder: displayNamePlaceholder,
                            className: "mt-1 w-full h-10 px-3 rounded-lg outline-none",
                            style: {
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)"
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "block mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs",
                            style: {
                                color: "var(--text-muted)"
                            },
                            children: usernameLabel
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            value: username,
                            onChange: (event)=>setUsername(event.target.value),
                            placeholder: usernamePlaceholder,
                            className: "mt-1 w-full h-10 px-3 rounded-lg outline-none",
                            style: {
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)"
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this),
                error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs mb-3",
                    style: {
                        color: "#f87171"
                    },
                    children: error
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 117,
                    columnNumber: 11
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "submit",
                    disabled: submitting,
                    className: "w-full min-h-[44px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
                    style: {
                        background: "var(--solana-purple)",
                        color: "#fff"
                    },
                    children: submitting ? submittingLabel : submitLabel
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
            lineNumber: 65,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/auth/AuthOnboardingForm.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/authRouting.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildAuthHref",
    ()=>buildAuthHref,
    "sanitizeReturnTo",
    ()=>sanitizeReturnTo
]);
function sanitizeReturnTo(value, locale) {
    if (!value) return `/${locale}/dashboard`;
    if (!value.startsWith("/")) return `/${locale}/dashboard`;
    if (value.startsWith("//")) return `/${locale}/dashboard`;
    if (value.startsWith("/api")) return `/${locale}/dashboard`;
    if (value === `/${locale}` || value.startsWith(`/${locale}/`)) {
        return value;
    }
    if (value === "/") {
        return `/${locale}`;
    }
    return `/${locale}${value}`;
}
function buildAuthHref(locale, returnTo) {
    return `/${locale}/auth?returnTo=${encodeURIComponent(returnTo)}`;
}
}),
"[project]/src/app/[locale]/auth/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AuthPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$AuthMethodsCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/AuthMethodsCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$AuthOnboardingForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/AuthOnboardingForm.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/IdentityProfileService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$authRouting$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/authRouting.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
function AuthPage() {
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const locale = params?.locale ?? "en";
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTranslations"])("Auth");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const { data: session, status: sessionStatus } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSession"])();
    const { connected, publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWallet"])();
    const walletAddress = publicKey?.toBase58() ?? null;
    const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
    const returnTo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$authRouting$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeReturnTo"])(searchParams.get("returnTo"), locale), [
        searchParams,
        locale
    ]);
    const [providers, setProviders] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        google: false,
        github: false
    });
    const subject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveCurrentSubject"])(session, walletAddress), [
        session,
        walletAddress
    ]);
    const profile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>subject ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getProfileBySubject"])(subject) : null, [
        subject
    ]);
    const isLoggedIn = Boolean(session) || connected;
    const needsOnboarding = isLoggedIn && subject !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isProfileComplete"])(profile);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let active = true;
        fetch("/api/auth/providers").then((response)=>response.ok ? response.json() : {}).then((value)=>{
            if (!active) return;
            setProviders({
                google: Boolean(value.google),
                github: Boolean(value.github)
            });
        }).catch(()=>{
            if (!active) return;
            setProviders({
                google: false,
                github: false
            });
        });
        return ()=>{
            active = false;
        };
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!session?.providerAccountId || !walletAddress) return;
        if (session.provider !== "google" && session.provider !== "github") return;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["linkSubjects"])({
            kind: "social",
            provider: session.provider,
            id: session.providerAccountId
        }, {
            kind: "wallet",
            id: walletAddress
        });
    }, [
        session?.provider,
        session?.providerAccountId,
        walletAddress
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isLoggedIn || !subject) return;
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isProfileComplete"])(profile)) return;
        router.replace(returnTo);
    }, [
        isLoggedIn,
        subject,
        profile,
        returnTo,
        router
    ]);
    async function handleProviderSignIn(provider) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signIn"])(provider, {
            callbackUrl: `/${locale}/auth?returnTo=${encodeURIComponent(returnTo)}&mode=${mode}`
        });
    }
    async function handleOnboardingSubmit(payload) {
        if (!subject) return;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["upsertProfile"])(subject, payload);
        router.replace(returnTo);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold tracking-tight",
                        style: {
                            color: "var(--text-primary)"
                        },
                        children: needsOnboarding ? t("onboarding.title") : t(`header.${mode}.title`)
                    }, void 0, false, {
                        fileName: "[project]/src/app/[locale]/auth/page.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm mt-2",
                        style: {
                            color: "var(--text-secondary)"
                        },
                        children: needsOnboarding ? t("onboarding.subtitle") : t(`header.${mode}.subtitle`)
                    }, void 0, false, {
                        fileName: "[project]/src/app/[locale]/auth/page.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/[locale]/auth/page.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            needsOnboarding ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$AuthOnboardingForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthOnboardingForm"], {
                title: t("onboarding.formTitle"),
                subtitle: t("onboarding.formSubtitle"),
                displayNameLabel: t("onboarding.displayName.label"),
                displayNamePlaceholder: t("onboarding.displayName.placeholder"),
                usernameLabel: t("onboarding.username.label"),
                usernamePlaceholder: t("onboarding.username.placeholder"),
                submitLabel: t("onboarding.submit"),
                submittingLabel: t("onboarding.submitting"),
                validationMessage: t("onboarding.validation"),
                initialDisplayName: profile?.displayName ?? session?.user?.name ?? "",
                initialUsername: profile?.username,
                onSubmit: handleOnboardingSubmit
            }, void 0, false, {
                fileName: "[project]/src/app/[locale]/auth/page.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$AuthMethodsCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthMethodsCard"], {
                title: t("methods.title"),
                subtitle: sessionStatus === "loading" ? t("methods.checking") : t("methods.subtitle"),
                providers: providers,
                onGoogle: ()=>handleProviderSignIn("google"),
                onGithub: ()=>handleProviderSignIn("github"),
                walletLabel: t("methods.walletLabel"),
                googleLabel: t("methods.google"),
                githubLabel: t("methods.github"),
                googleUnavailable: t("methods.googleUnavailable"),
                githubUnavailable: t("methods.githubUnavailable")
            }, void 0, false, {
                fileName: "[project]/src/app/[locale]/auth/page.tsx",
                lineNumber: 142,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-center mt-4",
                style: {
                    color: "var(--text-muted)"
                },
                children: t("footer.returnTo", {
                    path: returnTo
                })
            }, void 0, false, {
                fileName: "[project]/src/app/[locale]/auth/page.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/[locale]/auth/page.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_37da0ab5._.js.map