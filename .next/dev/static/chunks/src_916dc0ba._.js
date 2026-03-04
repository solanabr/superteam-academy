(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/tooltip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip,
    "TooltipContent",
    ()=>TooltipContent,
    "TooltipProvider",
    ()=>TooltipProvider,
    "TooltipTrigger",
    ()=>TooltipTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-client] (ecmascript) <export * as Tooltip>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function TooltipProvider({ delayDuration = 0, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Provider, {
        "data-slot": "tooltip-provider",
        delayDuration: delayDuration,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/tooltip.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = TooltipProvider;
function Tooltip({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Root, {
        "data-slot": "tooltip",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/tooltip.tsx",
        lineNumber: 24,
        columnNumber: 10
    }, this);
}
_c1 = Tooltip;
function TooltipTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Trigger, {
        "data-slot": "tooltip-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/tooltip.tsx",
        lineNumber: 30,
        columnNumber: 10
    }, this);
}
_c2 = TooltipTrigger;
function TooltipContent({ className, sideOffset = 0, children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Portal, {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Content, {
            "data-slot": "tooltip-content",
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance", className),
            ...props,
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Tooltip$3e$__["Tooltip"].Arrow, {
                    className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/tooltip.tsx",
                    lineNumber: 51,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ui/tooltip.tsx",
            lineNumber: 41,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/tooltip.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
_c3 = TooltipContent;
;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "TooltipProvider");
__turbopack_context__.k.register(_c1, "Tooltip");
__turbopack_context__.k.register(_c2, "TooltipTrigger");
__turbopack_context__.k.register(_c3, "TooltipContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useTheme.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeSync",
    ()=>ThemeSync,
    "useTheme",
    ()=>useTheme,
    "useThemeStore",
    ()=>useThemeStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const useThemeStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set)=>({
        theme: "dark",
        setTheme: (theme)=>set({
                theme
            })
    }));
function getResolvedTheme(theme) {
    if (theme === "system") {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
}
function useTheme() {
    _s();
    const { theme, setTheme } = useThemeStore();
    const resolved = ("TURBOPACK compile-time truthy", 1) ? getResolvedTheme(theme) : "TURBOPACK unreachable";
    return {
        theme,
        setTheme,
        resolved
    };
}
_s(useTheme, "iHR5w9Yfp8kTitZ6PiC3X8Qkms8=", false, function() {
    return [
        useThemeStore
    ];
});
function ThemeSync() {
    _s1();
    const { theme } = useThemeStore();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeSync.useEffect": ()=>{
            // Read from localStorage on mount
            const stored = localStorage.getItem("academy:theme");
            if (stored && [
                "dark",
                "light",
                "system"
            ].includes(stored)) {
                useThemeStore.getState().setTheme(stored);
            }
        }
    }["ThemeSync.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeSync.useEffect": ()=>{
            const resolved = getResolvedTheme(theme);
            document.documentElement.setAttribute("data-theme", resolved);
            localStorage.setItem("academy:theme", theme);
        }
    }["ThemeSync.useEffect"], [
        theme
    ]);
    // Listen for system preference changes when in "system" mode
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeSync.useEffect": ()=>{
            if (theme !== "system") return;
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = {
                "ThemeSync.useEffect.handler": ()=>{
                    const resolved = mq.matches ? "dark" : "light";
                    document.documentElement.setAttribute("data-theme", resolved);
                }
            }["ThemeSync.useEffect.handler"];
            mq.addEventListener("change", handler);
            return ({
                "ThemeSync.useEffect": ()=>mq.removeEventListener("change", handler)
            })["ThemeSync.useEffect"];
        }
    }["ThemeSync.useEffect"], [
        theme
    ]);
    return null;
}
_s1(ThemeSync, "v4bVADP8FGbnFz5NKTGYubSM7NE=", false, function() {
    return [
        useThemeStore
    ];
});
_c = ThemeSync;
var _c;
__turbopack_context__.k.register(_c, "ThemeSync");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/idl.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * IDL derived from onchain-academy/programs/onchain-academy/src/
 * Matches program ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
 */ __turbopack_context__.s([
    "IDL",
    ()=>IDL
]);
const IDL = {
    address: "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
    metadata: {
        name: "onchain_academy",
        version: "0.1.0",
        spec: "0.1.0"
    },
    instructions: [
        {
            name: "enroll",
            discriminator: [
                58,
                12,
                36,
                3,
                142,
                28,
                1,
                43
            ],
            accounts: [
                {
                    name: "course",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [
                                    99,
                                    111,
                                    117,
                                    114,
                                    115,
                                    101
                                ]
                            },
                            {
                                kind: "arg",
                                path: "course_id"
                            }
                        ]
                    }
                },
                {
                    name: "enrollment",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [
                                    101,
                                    110,
                                    114,
                                    111,
                                    108,
                                    108,
                                    109,
                                    101,
                                    110,
                                    116
                                ]
                            },
                            {
                                kind: "arg",
                                path: "course_id"
                            },
                            {
                                kind: "account",
                                path: "learner"
                            }
                        ]
                    }
                },
                {
                    name: "learner",
                    writable: true,
                    signer: true
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111"
                }
            ],
            args: [
                {
                    name: "course_id",
                    type: "string"
                }
            ]
        },
        {
            name: "close_enrollment",
            discriminator: [
                236,
                137,
                133,
                253,
                91,
                138,
                217,
                91
            ],
            accounts: [
                {
                    name: "course",
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [
                                    99,
                                    111,
                                    117,
                                    114,
                                    115,
                                    101
                                ]
                            },
                            {
                                kind: "account",
                                path: "enrollment.course"
                            }
                        ]
                    }
                },
                {
                    name: "enrollment",
                    writable: true,
                    pda: {
                        seeds: [
                            {
                                kind: "const",
                                value: [
                                    101,
                                    110,
                                    114,
                                    111,
                                    108,
                                    108,
                                    109,
                                    101,
                                    110,
                                    116
                                ]
                            },
                            {
                                kind: "account",
                                path: "course.course_id"
                            },
                            {
                                kind: "account",
                                path: "learner"
                            }
                        ]
                    }
                },
                {
                    name: "learner",
                    writable: true,
                    signer: true
                }
            ],
            args: []
        }
    ],
    accounts: [
        {
            name: "Config",
            discriminator: [
                155,
                12,
                170,
                224,
                30,
                250,
                204,
                130
            ]
        },
        {
            name: "Course",
            discriminator: [
                206,
                6,
                78,
                228,
                163,
                138,
                241,
                106
            ]
        },
        {
            name: "Enrollment",
            discriminator: [
                249,
                210,
                64,
                145,
                197,
                241,
                57,
                51
            ]
        }
    ],
    types: [
        {
            name: "Config",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "authority",
                        type: "pubkey"
                    },
                    {
                        name: "backend_signer",
                        type: "pubkey"
                    },
                    {
                        name: "xp_mint",
                        type: "pubkey"
                    },
                    {
                        name: "_reserved",
                        type: {
                            array: [
                                "u8",
                                8
                            ]
                        }
                    },
                    {
                        name: "bump",
                        type: "u8"
                    }
                ]
            }
        },
        {
            name: "Course",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "course_id",
                        type: "string"
                    },
                    {
                        name: "creator",
                        type: "pubkey"
                    },
                    {
                        name: "content_tx_id",
                        type: {
                            array: [
                                "u8",
                                32
                            ]
                        }
                    },
                    {
                        name: "version",
                        type: "u16"
                    },
                    {
                        name: "lesson_count",
                        type: "u8"
                    },
                    {
                        name: "difficulty",
                        type: "u8"
                    },
                    {
                        name: "xp_per_lesson",
                        type: "u32"
                    },
                    {
                        name: "track_id",
                        type: "u16"
                    },
                    {
                        name: "track_level",
                        type: "u8"
                    },
                    {
                        name: "prerequisite",
                        type: {
                            option: "pubkey"
                        }
                    },
                    {
                        name: "creator_reward_xp",
                        type: "u32"
                    },
                    {
                        name: "min_completions_for_reward",
                        type: "u16"
                    },
                    {
                        name: "total_completions",
                        type: "u32"
                    },
                    {
                        name: "total_enrollments",
                        type: "u32"
                    },
                    {
                        name: "is_active",
                        type: "bool"
                    },
                    {
                        name: "created_at",
                        type: "i64"
                    },
                    {
                        name: "updated_at",
                        type: "i64"
                    },
                    {
                        name: "_reserved",
                        type: {
                            array: [
                                "u8",
                                8
                            ]
                        }
                    },
                    {
                        name: "bump",
                        type: "u8"
                    }
                ]
            }
        },
        {
            name: "Enrollment",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "course",
                        type: "pubkey"
                    },
                    {
                        name: "enrolled_at",
                        type: "i64"
                    },
                    {
                        name: "completed_at",
                        type: {
                            option: "i64"
                        }
                    },
                    {
                        name: "lesson_flags",
                        type: {
                            array: [
                                "u64",
                                4
                            ]
                        }
                    },
                    {
                        name: "credential_asset",
                        type: {
                            option: "pubkey"
                        }
                    },
                    {
                        name: "_reserved",
                        type: {
                            array: [
                                "u8",
                                4
                            ]
                        }
                    },
                    {
                        name: "bump",
                        type: "u8"
                    }
                ]
            }
        }
    ],
    errors: [
        {
            code: 6000,
            name: "Unauthorized",
            msg: "Unauthorized signer"
        },
        {
            code: 6001,
            name: "CourseNotActive",
            msg: "Course not active"
        },
        {
            code: 6002,
            name: "LessonOutOfBounds",
            msg: "Lesson index out of bounds"
        },
        {
            code: 6003,
            name: "LessonAlreadyCompleted",
            msg: "Lesson already completed"
        },
        {
            code: 6004,
            name: "CourseNotCompleted",
            msg: "Not all lessons completed"
        },
        {
            code: 6005,
            name: "CourseAlreadyFinalized",
            msg: "Course already finalized"
        },
        {
            code: 6006,
            name: "CourseNotFinalized",
            msg: "Course not finalized"
        },
        {
            code: 6007,
            name: "PrerequisiteNotMet",
            msg: "Prerequisite not met"
        },
        {
            code: 6008,
            name: "UnenrollCooldown",
            msg: "Close cooldown not met (24h)"
        },
        {
            code: 6009,
            name: "EnrollmentCourseMismatch",
            msg: "Enrollment/course mismatch"
        },
        {
            code: 6010,
            name: "Overflow",
            msg: "Arithmetic overflow"
        },
        {
            code: 6011,
            name: "CourseIdEmpty",
            msg: "Course ID is empty"
        },
        {
            code: 6012,
            name: "CourseIdTooLong",
            msg: "Course ID exceeds max length"
        },
        {
            code: 6013,
            name: "InvalidLessonCount",
            msg: "Lesson count must be at least 1"
        },
        {
            code: 6014,
            name: "InvalidDifficulty",
            msg: "Difficulty must be 1, 2, or 3"
        },
        {
            code: 6015,
            name: "CredentialAssetMismatch",
            msg: "Credential asset does not match enrollment record"
        },
        {
            code: 6016,
            name: "CredentialAlreadyIssued",
            msg: "Credential already issued for this enrollment"
        },
        {
            code: 6017,
            name: "MinterNotActive",
            msg: "Minter role is not active"
        },
        {
            code: 6018,
            name: "MinterAmountExceeded",
            msg: "Amount exceeds minter's per-call limit"
        },
        {
            code: 6019,
            name: "LabelTooLong",
            msg: "Minter label exceeds max length"
        },
        {
            code: 6020,
            name: "AchievementNotActive",
            msg: "Achievement type is not active"
        },
        {
            code: 6021,
            name: "AchievementSupplyExhausted",
            msg: "Achievement max supply reached"
        },
        {
            code: 6022,
            name: "AchievementIdTooLong",
            msg: "Achievement ID exceeds max length"
        },
        {
            code: 6023,
            name: "AchievementNameTooLong",
            msg: "Achievement name exceeds max length"
        },
        {
            code: 6024,
            name: "AchievementUriTooLong",
            msg: "Achievement URI exceeds max length"
        },
        {
            code: 6025,
            name: "InvalidAmount",
            msg: "Amount must be greater than zero"
        },
        {
            code: 6026,
            name: "InvalidXpReward",
            msg: "XP reward must be greater than zero"
        }
    ]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/anchor.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PROGRAM_ID",
    ()=>PROGRAM_ID,
    "TOKEN_2022_PROGRAM_ID",
    ()=>TOKEN_2022_PROGRAM_ID,
    "XP_MINT",
    ()=>XP_MINT,
    "getConnection",
    ()=>getConnection,
    "getProgram",
    ()=>getProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@coral-xyz/anchor/dist/browser/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$idl$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/idl.ts [app-client] (ecmascript)");
;
;
;
const PROGRAM_ID = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](("TURBOPACK compile-time value", "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf") ?? "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");
const XP_MINT = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"](("TURBOPACK compile-time value", "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3") ?? "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3");
const TOKEN_2022_PROGRAM_ID = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"]("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
function getConnection() {
    const rpcUrl = ("TURBOPACK compile-time value", "https://devnet.helius-rpc.com/?api-key=0cd5dc9d-e5ac-4227-9894-bc3dec9c2661") ?? "https://api.devnet.solana.com";
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Connection"](rpcUrl, "confirmed");
}
function getProgram(provider) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setProvider"])(provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Program"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$idl$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IDL"], provider);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useXpBalance.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useXpBalance",
    ()=>useXpBalance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$spl$2d$token$2f$lib$2f$esm$2f$state$2f$mint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/spl-token/lib/esm/state/mint.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anchor.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function useXpBalance() {
    _s();
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "xp-balance",
            publicKey?.toBase58()
        ],
        queryFn: {
            "useXpBalance.useQuery": async ()=>{
                if (!publicKey) return {
                    amount: 0,
                    level: 0,
                    ataExists: false
                };
                const xpAta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$spl$2d$token$2f$lib$2f$esm$2f$state$2f$mint$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAssociatedTokenAddressSync"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XP_MINT"], publicKey, false, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKEN_2022_PROGRAM_ID"]);
                try {
                    const balance = await connection.getTokenAccountBalance(xpAta);
                    const amount = Number(balance.value.amount);
                    return {
                        amount,
                        level: Math.floor(Math.sqrt(amount / 100)),
                        ataExists: true
                    };
                } catch  {
                    return {
                        amount: 0,
                        level: 0,
                        ataExists: false
                    };
                }
            }
        }["useXpBalance.useQuery"],
        staleTime: 30 * 1000,
        enabled: !!publicKey
    });
}
_s(useXpBalance, "1VeXf1mBdagpL6ZuGzRyJJVOkdQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/pda.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getConfigPda",
    ()=>getConfigPda,
    "getCoursePda",
    ()=>getCoursePda,
    "getEnrollmentPda",
    ()=>getEnrollmentPda,
    "getMinterRolePda",
    ()=>getMinterRolePda
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/anchor.ts [app-client] (ecmascript)");
;
;
function getConfigPda() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"].findProgramAddressSync([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from("config")
    ], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROGRAM_ID"]);
}
function getCoursePda(courseId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"].findProgramAddressSync([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from("course"),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(courseId)
    ], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROGRAM_ID"]);
}
function getEnrollmentPda(courseId, learner) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"].findProgramAddressSync([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from("enrollment"),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(courseId),
        learner.toBuffer()
    ], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROGRAM_ID"]);
}
function getMinterRolePda(minter) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PublicKey"].findProgramAddressSync([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from("minter"),
        minter.toBuffer()
    ], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$anchor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROGRAM_ID"]);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useEnrollment.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAllEnrollments",
    ()=>useAllEnrollments,
    "useEnrollment",
    ()=>useEnrollment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@coral-xyz/anchor/dist/browser/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/web3.js/lib/index.browser.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$idl$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/idl.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pda$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/pda.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEnrollment(a, publicKey) {
    return {
        publicKey,
        course: a.course,
        enrolledAt: a.enrolledAt ?? a.enrolled_at,
        completedAt: a.completedAt ?? a.completed_at ?? null,
        lessonFlags: a.lessonFlags ?? a.lesson_flags,
        credentialAsset: a.credentialAsset ?? a.credential_asset ?? null,
        bump: a.bump
    };
}
function useEnrollment(courseId) {
    _s();
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "enrollment",
            courseId,
            publicKey?.toBase58()
        ],
        queryFn: {
            "useEnrollment.useQuery": async ()=>{
                if (!courseId || !publicKey) return null;
                const [enrollmentPda] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pda$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getEnrollmentPda"])(courseId, publicKey);
                const dummyWallet = {
                    publicKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Keypair"].generate().publicKey,
                    signTransaction: {
                        "useEnrollment.useQuery": async (tx)=>tx
                    }["useEnrollment.useQuery"],
                    signAllTransactions: {
                        "useEnrollment.useQuery": async (txs)=>txs
                    }["useEnrollment.useQuery"]
                };
                const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AnchorProvider"](connection, dummyWallet, {
                    commitment: "confirmed"
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const program = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Program"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$idl$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IDL"], provider);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = await program.account["enrollment"].fetchNullable(enrollmentPda);
                if (!raw) return null;
                return normalizeEnrollment(raw, enrollmentPda);
            }
        }["useEnrollment.useQuery"],
        staleTime: 30 * 1000,
        enabled: !!courseId && !!publicKey
    });
}
_s(useEnrollment, "1VeXf1mBdagpL6ZuGzRyJJVOkdQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useAllEnrollments() {
    _s1();
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "enrollments",
            publicKey?.toBase58()
        ],
        queryFn: {
            "useAllEnrollments.useQuery": async ()=>{
                if (!publicKey) return [];
                const dummyWallet = {
                    publicKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$web3$2e$js$2f$lib$2f$index$2e$browser$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Keypair"].generate().publicKey,
                    signTransaction: {
                        "useAllEnrollments.useQuery": async (tx)=>tx
                    }["useAllEnrollments.useQuery"],
                    signAllTransactions: {
                        "useAllEnrollments.useQuery": async (txs)=>txs
                    }["useAllEnrollments.useQuery"]
                };
                const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AnchorProvider"](connection, dummyWallet, {
                    commitment: "confirmed"
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const program = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$coral$2d$xyz$2f$anchor$2f$dist$2f$browser$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Program"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$idl$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IDL"], provider);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const all = await program.account["enrollment"].all();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return all.map({
                    "useAllEnrollments.useQuery": (e)=>normalizeEnrollment(e.account, e.publicKey)
                }["useAllEnrollments.useQuery"]);
            }
        }["useAllEnrollments.useQuery"],
        staleTime: 30 * 1000,
        enabled: !!publicKey
    });
}
_s1(useAllEnrollments, "1VeXf1mBdagpL6ZuGzRyJJVOkdQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/stubStorage.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addStubXp",
    ()=>addStubXp,
    "allLessonsCompleteStub",
    ()=>allLessonsCompleteStub,
    "countCompletedLessonsStub",
    ()=>countCompletedLessonsStub,
    "credentialKey",
    ()=>credentialKey,
    "enrollmentKey",
    ()=>enrollmentKey,
    "finalizedKey",
    ()=>finalizedKey,
    "getAllStubEnrolledCourseIds",
    ()=>getAllStubEnrolledCourseIds,
    "getStubCredential",
    ()=>getStubCredential,
    "getStubXp",
    ()=>getStubXp,
    "isCourseEnrolledStub",
    ()=>isCourseEnrolledStub,
    "isCourseFinalizedStub",
    ()=>isCourseFinalizedStub,
    "isLessonCompleteStub",
    ()=>isLessonCompleteStub,
    "legacyLessonKey",
    ()=>legacyLessonKey,
    "lessonKey",
    ()=>lessonKey,
    "markCourseEnrolledStub",
    ()=>markCourseEnrolledStub,
    "markCourseFinalizedStub",
    ()=>markCourseFinalizedStub,
    "markLessonCompleteStub",
    ()=>markLessonCompleteStub,
    "setStubCredential",
    ()=>setStubCredential,
    "xpKey",
    ()=>xpKey
]);
/**
 * Centralized localStorage key helpers for stub (demo) mode.
 *
 * Key scheme:
 *   Lesson complete:  academy:stub:devnet:<wallet>:<courseId>:lesson:<index>
 *   Course finalized: academy:stub:devnet:<wallet>:<courseId>:finalized
 *   Credential:       academy:stub:devnet:<wallet>:<courseId>:credential
 *   Local XP total:   academy:stub:devnet:<wallet>:xp
 *
 * Legacy lesson key (Slice 2): academy:stub:<courseId>:<index>:<wallet>
 * Both formats are checked for lesson completion.
 */ const NS = "academy:stub:devnet";
function lessonKey(wallet, courseId, index) {
    return `${NS}:${wallet}:${courseId}:lesson:${index}`;
}
function legacyLessonKey(courseId, index, wallet) {
    return `academy:stub:${courseId}:${index}:${wallet}`;
}
function finalizedKey(wallet, courseId) {
    return `${NS}:${wallet}:${courseId}:finalized`;
}
function enrollmentKey(wallet, courseId) {
    return `${NS}:${wallet}:${courseId}:enrolled`;
}
function credentialKey(wallet, courseId) {
    return `${NS}:${wallet}:${courseId}:credential`;
}
function xpKey(wallet) {
    return `${NS}:${wallet}:xp`;
}
// ── Readers ───────────────────────────────────────────────────────────────────
function safe() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.localStorage;
}
function isLessonCompleteStub(wallet, courseId, index) {
    const ls = safe();
    if (!ls) return false;
    return ls.getItem(lessonKey(wallet, courseId, index)) === "1" || ls.getItem(legacyLessonKey(courseId, index, wallet)) === "1";
}
function countCompletedLessonsStub(wallet, courseId, lessonCount) {
    let n = 0;
    for(let i = 0; i < lessonCount; i++){
        if (isLessonCompleteStub(wallet, courseId, i)) n++;
    }
    return n;
}
function allLessonsCompleteStub(wallet, courseId, lessonCount) {
    return countCompletedLessonsStub(wallet, courseId, lessonCount) >= lessonCount;
}
function isCourseFinalizedStub(wallet, courseId) {
    const ls = safe();
    if (!ls) return false;
    return ls.getItem(finalizedKey(wallet, courseId)) === "1";
}
function isCourseEnrolledStub(wallet, courseId) {
    const ls = safe();
    if (!ls) return false;
    return ls.getItem(enrollmentKey(wallet, courseId)) === "1";
}
function getAllStubEnrolledCourseIds(wallet) {
    const ls = safe();
    if (!ls) return [];
    const suffix = ":enrolled";
    const prefix = `${NS}:${wallet}:`;
    const enrolled = [];
    for(let i = 0; i < ls.length; i++){
        const key = ls.key(i);
        if (!key || !key.startsWith(prefix) || !key.endsWith(suffix)) continue;
        const courseId = key.slice(prefix.length, key.length - suffix.length);
        if (courseId) enrolled.push(courseId);
    }
    return enrolled;
}
function getStubCredential(wallet, courseId) {
    const ls = safe();
    if (!ls) return null;
    return ls.getItem(credentialKey(wallet, courseId));
}
function getStubXp(wallet) {
    const ls = safe();
    if (!ls) return 0;
    return parseInt(ls.getItem(xpKey(wallet)) ?? "0", 10) || 0;
}
function markLessonCompleteStub(wallet, courseId, index) {
    const ls = safe();
    if (!ls) return;
    ls.setItem(lessonKey(wallet, courseId, index), "1");
    // Also write legacy key so Slice 2 reads still work
    ls.setItem(legacyLessonKey(courseId, index, wallet), "1");
}
function markCourseFinalizedStub(wallet, courseId) {
    const ls = safe();
    if (!ls) return;
    ls.setItem(finalizedKey(wallet, courseId), "1");
}
function markCourseEnrolledStub(wallet, courseId) {
    const ls = safe();
    if (!ls) return;
    ls.setItem(enrollmentKey(wallet, courseId), "1");
}
function setStubCredential(wallet, courseId, id) {
    const ls = safe();
    if (!ls) return;
    ls.setItem(credentialKey(wallet, courseId), id);
}
function addStubXp(wallet, amount) {
    const ls = safe();
    if (!ls) return 0;
    const prev = getStubXp(wallet);
    const next = prev + amount;
    ls.setItem(xpKey(wallet), String(next));
    return next;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useCredentials.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TRACK_COLLECTION",
    ()=>TRACK_COLLECTION,
    "useCredentials",
    ()=>useCredentials
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stubStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stubStorage.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const TRACK_COLLECTION = "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX";
async function fetchCredentials(owner, rpcUrl) {
    const body = {
        jsonrpc: "2.0",
        id: "academy-credentials",
        method: "getAssetsByOwner",
        params: {
            ownerAddress: owner,
            page: 1,
            limit: 10,
            displayOptions: {
                showCollectionMetadata: true,
                showUnverifiedCollections: true,
                showFungible: false,
                showNativeBalance: false
            }
        }
    };
    const res = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.result?.items ?? [];
    return items.filter((asset)=>asset.grouping?.some((g)=>g.group_key === "collection" && g.group_value === TRACK_COLLECTION)).map((asset)=>({
            id: asset.id,
            name: asset.content?.metadata?.name ?? "Academy Credential",
            // Image priority: links.image → metadata.image → files[0].uri
            image: asset.content?.links?.image ?? asset.content?.metadata?.image ?? asset.content?.files?.[0]?.uri ?? null,
            attributes: asset.content?.metadata?.attributes ?? [],
            explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
            isStub: false
        }));
}
function buildStubCredential(_wallet, courseId, credentialId) {
    return {
        id: credentialId,
        name: `${courseId} Credential`,
        image: null,
        attributes: [
            {
                trait_type: "track",
                value: courseId
            },
            {
                trait_type: "source",
                value: "stub"
            }
        ],
        explorerUrl: "#",
        isStub: true
    };
}
function useCredentials(courseId) {
    _s();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const wallet = publicKey?.toBase58() ?? null;
    const rpcUrl = ("TURBOPACK compile-time value", "https://devnet.helius-rpc.com/?api-key=0cd5dc9d-e5ac-4227-9894-bc3dec9c2661") ?? "";
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "credentials",
            wallet
        ],
        queryFn: {
            "useCredentials.useQuery": async ()=>{
                if (!wallet) return [];
                // Fetch on-chain credentials via Helius DAS
                const onchain = ("TURBOPACK compile-time truthy", 1) ? await fetchCredentials(wallet, rpcUrl) : "TURBOPACK unreachable";
                // In stub mode, supplement with local credentials if no on-chain match
                const stubCreds = [];
                if (courseId) {
                    const localId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stubStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStubCredential"])(wallet, courseId);
                    if (localId && !onchain.some({
                        "useCredentials.useQuery": (c)=>c.id === localId
                    }["useCredentials.useQuery"])) {
                        stubCreds.push(buildStubCredential(wallet, courseId, localId));
                    }
                } else {
                    // Profile page: scan localStorage for any stub credentials
                    if ("TURBOPACK compile-time truthy", 1) {
                        const prefix = `academy:stub:devnet:${wallet}:`;
                        for(let i = 0; i < localStorage.length; i++){
                            const key = localStorage.key(i);
                            if (key?.startsWith(prefix) && key.endsWith(":credential")) {
                                const id = localStorage.getItem(key);
                                const cId = key.slice(prefix.length).replace(/:credential$/, "");
                                if (id && !onchain.some({
                                    "useCredentials.useQuery": (c)=>c.id === id
                                }["useCredentials.useQuery"])) {
                                    stubCreds.push(buildStubCredential(wallet, cId, id));
                                }
                            }
                        }
                    }
                }
                return [
                    ...onchain,
                    ...stubCreds
                ];
            }
        }["useCredentials.useQuery"],
        staleTime: 60 * 1000,
        enabled: !!wallet
    });
}
_s(useCredentials, "nQhkoDuPEnbOXnonVL14TTybPh4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useSigningMode.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSigningMode",
    ()=>useSigningMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useSigningMode() {
    _s();
    const { data } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "signing-mode"
        ],
        queryFn: {
            "useSigningMode.useQuery": ()=>fetch("/api/signing-mode").then({
                    "useSigningMode.useQuery": (r)=>r.json()
                }["useSigningMode.useQuery"])
        }["useSigningMode.useQuery"],
        staleTime: Infinity,
        retry: false
    });
    // Default to "stub" while loading or on error — safe fallback.
    return data?.mode ?? "stub";
}
_s(useSigningMode, "JtionF1PqWN50DPWu724eJIU2SM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useStubXp.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStubXp",
    ()=>useStubXp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stubStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/stubStorage.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function useStubXp() {
    _s();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    if (!publicKey || ("TURBOPACK compile-time value", "object") === "undefined") return 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$stubStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStubXp"])(publicKey.toBase58());
}
_s(useStubXp, "mzyxrHmpp4PnhNILMr6pKoSuMFs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/bitmap.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "countCompletedLessons",
    ()=>countCompletedLessons,
    "getCompletedLessonIndices",
    ()=>getCompletedLessonIndices,
    "isLessonComplete",
    ()=>isLessonComplete,
    "normalizeFlags",
    ()=>normalizeFlags
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bn.js/lib/bn.js [app-client] (ecmascript)");
;
function isLessonComplete(lessonFlags, lessonIndex) {
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    return !lessonFlags[wordIndex].and(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](1).shln(bitIndex)).isZero();
}
function countCompletedLessons(lessonFlags) {
    return lessonFlags.reduce((sum, word)=>{
        let count = 0;
        let w = word.clone();
        while(!w.isZero()){
            count += w.and(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](1)).toNumber();
            w = w.shrn(1);
        }
        return sum + count;
    }, 0);
}
function getCompletedLessonIndices(lessonFlags, lessonCount) {
    const completed = [];
    for(let i = 0; i < lessonCount; i++){
        if (isLessonComplete(lessonFlags, i)) completed.push(i);
    }
    return completed;
}
function normalizeFlags(raw) {
    if (Array.isArray(raw)) {
        return raw.map((v)=>v instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] ? v : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](String(v)));
    }
    return [
        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0),
        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0),
        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0),
        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bn$2e$js$2f$lib$2f$bn$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"](0)
    ];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/data/achievements.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Achievement / badge definitions.
 * Each achievement has an id, display metadata, category, and a condition
 * that can be checked against runtime stats to determine if it's earned.
 */ __turbopack_context__.s([
    "ACHIEVEMENTS",
    ()=>ACHIEVEMENTS,
    "ACHIEVEMENT_MAP",
    ()=>ACHIEVEMENT_MAP
]);
const ACHIEVEMENTS = [
    {
        id: "first-steps",
        emoji: "🚀",
        title: "First Steps",
        description: "Complete your very first lesson.",
        category: "progress",
        condition: {
            type: "lessons",
            threshold: 1
        }
    },
    {
        id: "enrolled",
        emoji: "📚",
        title: "Enrolled",
        description: "Enroll in your first course.",
        category: "progress",
        condition: {
            type: "courses",
            threshold: 1
        }
    },
    {
        id: "on-a-roll",
        emoji: "🔥",
        title: "On a Roll",
        description: "Complete 5 lessons.",
        category: "progress",
        condition: {
            type: "lessons",
            threshold: 5
        }
    },
    {
        id: "course-completer",
        emoji: "🏆",
        title: "Course Completer",
        description: "Finish an entire course.",
        category: "progress",
        condition: {
            type: "courses",
            threshold: 1
        }
    },
    {
        id: "polymath",
        emoji: "🎓",
        title: "Polymath",
        description: "Complete 3 different courses.",
        category: "progress",
        condition: {
            type: "courses",
            threshold: 3
        }
    },
    {
        id: "xp-100",
        emoji: "⚡",
        title: "Spark",
        description: "Earn your first 100 XP.",
        category: "skill",
        condition: {
            type: "xp",
            threshold: 100
        }
    },
    {
        id: "xp-500",
        emoji: "💎",
        title: "Diamond Hands",
        description: "Earn 500 XP.",
        category: "skill",
        condition: {
            type: "xp",
            threshold: 500
        }
    },
    {
        id: "xp-1000",
        emoji: "👑",
        title: "XP King",
        description: "Earn 1,000 XP.",
        category: "skill",
        condition: {
            type: "xp",
            threshold: 1000
        }
    },
    {
        id: "streak-3",
        emoji: "🌱",
        title: "Habit Forming",
        description: "Maintain a 3-day learning streak.",
        category: "streak",
        condition: {
            type: "streak",
            days: 3
        }
    },
    {
        id: "streak-7",
        emoji: "📅",
        title: "Week Warrior",
        description: "Learn every day for 7 days straight.",
        category: "streak",
        condition: {
            type: "streak",
            days: 7
        }
    },
    {
        id: "streak-30",
        emoji: "🌟",
        title: "Monthly Master",
        description: "Keep a 30-day learning streak.",
        category: "streak",
        condition: {
            type: "streak",
            days: 30
        }
    },
    {
        id: "credential-1",
        emoji: "🎖️",
        title: "Credentialed",
        description: "Earn your first soulbound credential NFT.",
        category: "skill",
        condition: {
            type: "credential",
            count: 1
        }
    },
    {
        id: "credential-3",
        emoji: "🏅",
        title: "Triple Crown",
        description: "Earn 3 credential NFTs.",
        category: "skill",
        condition: {
            type: "credential",
            count: 3
        }
    },
    {
        id: "early-adopter",
        emoji: "🌅",
        title: "Early Adopter",
        description: "Joined Superteam Academy in its early days.",
        category: "special",
        condition: {
            type: "manual"
        }
    },
    {
        id: "speed-run",
        emoji: "⚡",
        title: "Speed Run",
        description: "Complete a lesson within 5 minutes of starting.",
        category: "special",
        condition: {
            type: "manual"
        }
    }
];
const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a)=>[
        a.id,
        a
    ]));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/streak.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STREAK_UPDATED_EVENT",
    ()=>STREAK_UPDATED_EVENT,
    "getCurrentStreak",
    ()=>getCurrentStreak,
    "getStreakHeatmap",
    ()=>getStreakHeatmap,
    "getTotalActiveDays",
    ()=>getTotalActiveDays,
    "markLearningActivity",
    ()=>markLearningActivity,
    "markLearningActivityToday",
    ()=>markLearningActivityToday
]);
"use client";
const STREAK_ACTIVITY_KEY = "academy_streak_activity_v1";
const LEGACY_HEATMAP_KEY = "academy_heatmap";
const MAX_STORED_DAYS = 400;
const STREAK_UPDATED_EVENT = "academy:streak-updated";
function formatDateKeyLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function toDateKeyDaysAgo(daysAgo) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    return formatDateKeyLocal(date);
}
function normalizeDateKeys(value) {
    if (!Array.isArray(value)) return [];
    const unique = new Set();
    for (const item of value){
        if (typeof item !== "string") continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item)) continue;
        unique.add(item);
    }
    return Array.from(unique).sort((a, b)=>b.localeCompare(a)).slice(0, MAX_STORED_DAYS);
}
function readLegacyHeatmap() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(LEGACY_HEATMAP_KEY);
        if (!raw) return [];
        const flags = JSON.parse(raw);
        if (!Array.isArray(flags)) return [];
        const migrated = [];
        for(let i = 0; i < flags.length; i += 1){
            if (flags[i] === true) {
                migrated.push(toDateKeyDaysAgo(i));
            }
        }
        return normalizeDateKeys(migrated);
    } catch  {
        return [];
    }
}
function writeDateKeys(dateKeys) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(STREAK_ACTIVITY_KEY, JSON.stringify(dateKeys));
    } catch  {
    // Ignore storage write failures (private mode/quota).
    }
}
function emitStreakUpdated() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
}
function readDateKeys() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(STREAK_ACTIVITY_KEY);
        if (raw) {
            return normalizeDateKeys(JSON.parse(raw));
        }
    } catch  {
    // Fall through to migration.
    }
    const migrated = readLegacyHeatmap();
    if (migrated.length > 0) {
        writeDateKeys(migrated);
    }
    return migrated;
}
function markLearningActivity(date = new Date()) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const today = formatDateKeyLocal(date);
    const keys = readDateKeys();
    if (keys.includes(today)) return;
    const next = normalizeDateKeys([
        today,
        ...keys
    ]);
    writeDateKeys(next);
    emitStreakUpdated();
}
function markLearningActivityToday() {
    markLearningActivity(new Date());
}
function getStreakHeatmap(days) {
    if (days <= 0) return [];
    const activeDays = new Set(readDateKeys());
    const flags = [];
    for(let i = 0; i < days; i += 1){
        flags.push(activeDays.has(toDateKeyDaysAgo(i)));
    }
    return flags;
}
function getCurrentStreak(maxDays = 365) {
    const flags = getStreakHeatmap(maxDays);
    let streak = 0;
    for (const active of flags){
        if (!active) break;
        streak += 1;
    }
    return streak;
}
function getTotalActiveDays(days = 70) {
    return getStreakHeatmap(days).filter(Boolean).length;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useAchievements.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAchievements",
    ()=>useAchievements,
    "useEarnedAchievements",
    ()=>useEarnedAchievements
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useXpBalance.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useEnrollment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useEnrollment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useCredentials$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useCredentials.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useSigningMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useStubXp.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$bitmap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/bitmap.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$achievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/achievements.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/streak.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
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
function checkCondition(achievement, stats) {
    const { condition } = achievement;
    switch(condition.type){
        case "xp":
            return stats.totalXp >= condition.threshold;
        case "lessons":
            return stats.totalLessons >= condition.threshold;
        case "courses":
            return stats.totalCourses >= condition.threshold;
        case "streak":
            return stats.streakDays >= condition.days;
        case "credential":
            return stats.credentialCount >= condition.count;
        case "manual":
            // Early adopter: always award if wallet connected
            return achievement.id === "early-adopter";
        default:
            return false;
    }
}
function useAchievements() {
    _s();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const { data: xp } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useXpBalance"])();
    const { data: enrollments } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useEnrollment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAllEnrollments"])();
    const { data: credentials } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useCredentials$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCredentials"])();
    const signingMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSigningMode"])();
    const localXp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStubXp"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useAchievements.useMemo": ()=>{
            if (!publicKey) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$achievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ACHIEVEMENTS"].map({
                    "useAchievements.useMemo": (a)=>({
                            achievement: a,
                            earned: false
                        })
                }["useAchievements.useMemo"]);
            }
            const isStub = signingMode === "stub";
            const totalXp = isStub ? localXp : xp?.amount ?? 0;
            const totalLessons = (enrollments ?? []).reduce({
                "useAchievements.useMemo.totalLessons": (sum, e)=>{
                    const flags = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$bitmap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeFlags"])(e.lessonFlags);
                    return sum + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$bitmap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countCompletedLessons"])(flags);
                }
            }["useAchievements.useMemo.totalLessons"], 0);
            const totalCourses = (enrollments ?? []).filter({
                "useAchievements.useMemo": (e)=>!!e.completedAt
            }["useAchievements.useMemo"]).length;
            const streakDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentStreak"])();
            const credentialCount = credentials?.length ?? 0;
            const stats = {
                totalXp,
                totalLessons,
                totalCourses,
                streakDays,
                credentialCount
            };
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$achievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ACHIEVEMENTS"].map({
                "useAchievements.useMemo": (a)=>({
                        achievement: a,
                        earned: checkCondition(a, stats)
                    })
            }["useAchievements.useMemo"]);
        }
    }["useAchievements.useMemo"], [
        publicKey,
        xp,
        enrollments,
        credentials,
        signingMode,
        localXp
    ]);
}
_s(useAchievements, "AGKFS1qpRnMqWeYPy9eMa5EjASQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useXpBalance"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useEnrollment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAllEnrollments"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useCredentials$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCredentials"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSigningMode"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStubXp"]
    ];
});
function useEarnedAchievements() {
    _s1();
    const states = useAchievements();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useEarnedAchievements.useMemo": ()=>states.filter({
                "useEarnedAchievements.useMemo": (s)=>s.earned
            }["useEarnedAchievements.useMemo"]).map({
                "useEarnedAchievements.useMemo": (s)=>s.achievement
            }["useEarnedAchievements.useMemo"])
    }["useEarnedAchievements.useMemo"], [
        states
    ]);
}
_s1(useEarnedAchievements, "muXxiND0slWFatEVH5ex66QzCVE=", false, function() {
    return [
        useAchievements
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/analytics.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Analytics
 *
 * Typed wrapper around GA4 gtag.js and custom event helpers.
 * Replace the send() function body with PostHog/Amplitude without
 * changing any call sites.
 */ __turbopack_context__.s([
    "track",
    ()=>track
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
function send(event) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (typeof window.gtag === "function") {
        window.gtag("event", event.name, event.params);
    }
    // Development logging
    if ("TURBOPACK compile-time truthy", 1) {
        console.debug("[analytics]", event.name, event.params);
    }
}
const track = {
    pageView: (pagePath, locale)=>send({
            name: "page_view",
            params: {
                page_path: pagePath,
                locale
            }
        }),
    walletConnect: (walletShort)=>send({
            name: "wallet_connect",
            params: {
                wallet_short: walletShort
            }
        }),
    courseEnroll: (courseId, locale)=>send({
            name: "course_enroll",
            params: {
                course_id: courseId,
                locale
            }
        }),
    lessonComplete: (courseId, lessonIndex, xpEarned)=>send({
            name: "lesson_complete",
            params: {
                course_id: courseId,
                lesson_index: lessonIndex,
                xp_earned: xpEarned
            }
        }),
    courseFinalize: (courseId, mode, bonusXp)=>send({
            name: "course_finalize",
            params: {
                course_id: courseId,
                mode,
                bonus_xp: bonusXp
            }
        }),
    credentialIssued: (courseId, credentialId, mode)=>send({
            name: "credential_issued",
            params: {
                course_id: courseId,
                credential_id: credentialId,
                mode
            }
        }),
    searchFilter: (query, category)=>send({
            name: "search_filter",
            params: {
                query,
                category
            }
        }),
    xpEarned: (amount, source)=>send({
            name: "xp_earned",
            params: {
                amount,
                source
            }
        }),
    achievementUnlock: (achievementId, achievementTitle)=>send({
            name: "achievement_unlock",
            params: {
                achievement_id: achievementId,
                achievement_title: achievementTitle
            }
        }),
    languageSwitch: (from, to)=>send({
            name: "language_switch",
            params: {
                from,
                to
            }
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/AchievementToast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AchievementToastManager",
    ()=>AchievementToastManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAchievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAchievements.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/analytics.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function AchievementToastManager() {
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("CredentialModal");
    const states = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAchievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAchievements"])();
    const [queue, setQueue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const notifiedKey = "academy_notified_achievements";
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Detect newly-earned achievements
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AchievementToastManager.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const notified = JSON.parse(localStorage.getItem(notifiedKey) ?? "[]");
            const newlyEarned = states.filter({
                "AchievementToastManager.useEffect.newlyEarned": (s)=>s.earned && !notified.includes(s.achievement.id)
            }["AchievementToastManager.useEffect.newlyEarned"]).map({
                "AchievementToastManager.useEffect.newlyEarned": (s)=>s.achievement
            }["AchievementToastManager.useEffect.newlyEarned"]);
            if (newlyEarned.length === 0) return;
            newlyEarned.forEach({
                "AchievementToastManager.useEffect": (a)=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["track"].achievementUnlock(a.id, a.title);
                }
            }["AchievementToastManager.useEffect"]);
            // Mark them as notified
            const updated = [
                ...notified,
                ...newlyEarned.map({
                    "AchievementToastManager.useEffect": (a)=>a.id
                }["AchievementToastManager.useEffect"])
            ];
            localStorage.setItem(notifiedKey, JSON.stringify(updated));
            setQueue({
                "AchievementToastManager.useEffect": (q)=>[
                        ...q,
                        ...newlyEarned
                    ]
            }["AchievementToastManager.useEffect"]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["AchievementToastManager.useEffect"], [
        states.map({
            "AchievementToastManager.useEffect": (s)=>`${s.achievement.id}:${s.earned}`
        }["AchievementToastManager.useEffect"]).join(",")
    ]);
    // Show next in queue
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AchievementToastManager.useEffect": ()=>{
            if (!visible && queue.length > 0) {
                const [next, ...rest] = queue;
                setVisible(next ?? null);
                setQueue(rest);
            }
        }
    }["AchievementToastManager.useEffect"], [
        visible,
        queue
    ]);
    // Auto-dismiss after 4 s
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AchievementToastManager.useEffect": ()=>{
            if (!visible) return;
            timerRef.current = setTimeout({
                "AchievementToastManager.useEffect": ()=>setVisible(null)
            }["AchievementToastManager.useEffect"], 4000);
            return ({
                "AchievementToastManager.useEffect": ()=>{
                    if (timerRef.current) clearTimeout(timerRef.current);
                }
            })["AchievementToastManager.useEffect"];
        }
    }["AchievementToastManager.useEffect"], [
        visible
    ]);
    if (!visible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "status",
        "aria-live": "polite",
        style: {
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9995,
            animation: "achievement-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            pointerEvents: "none"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(153,69,255,0.25), rgba(25,251,155,0.1))",
                border: "1px solid rgba(153,69,255,0.5)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(153,69,255,0.3), 0 2px 8px rgba(0,0,0,0.3)",
                minWidth: "260px",
                maxWidth: "320px"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        fontSize: "1.75rem",
                        lineHeight: 1,
                        flexShrink: 0
                    },
                    children: visible.emoji
                }, void 0, false, {
                    fileName: "[project]/src/components/AchievementToast.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "rgba(153,69,255,0.9)",
                                marginBottom: "0.2rem"
                            },
                            children: t("unlocked")
                        }, void 0, false, {
                            fileName: "[project]/src/components/AchievementToast.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "#fff",
                                lineHeight: 1.2
                            },
                            children: visible.title
                        }, void 0, false, {
                            fileName: "[project]/src/components/AchievementToast.tsx",
                            lineNumber: 119,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: "0.75rem",
                                color: "rgba(255,255,255,0.6)",
                                marginTop: "0.15rem"
                            },
                            children: visible.description
                        }, void 0, false, {
                            fileName: "[project]/src/components/AchievementToast.tsx",
                            lineNumber: 129,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/AchievementToast.tsx",
                    lineNumber: 106,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/AchievementToast.tsx",
            lineNumber: 82,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/AchievementToast.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
_s(AchievementToastManager, "w1abbpGmskxyeUTqwjNF2rQPkKk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAchievements$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAchievements"]
    ];
});
_c = AchievementToastManager;
var _c;
__turbopack_context__.k.register(_c, "AchievementToastManager");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$ConnectionProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/ConnectionProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$WalletProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/WalletProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletModalProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react-ui/lib/esm/WalletModalProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$phantom$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-phantom/lib/esm/adapter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-solflare/lib/esm/adapter.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/tooltip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useTheme.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AchievementToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AchievementToast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/analytics.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
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
;
;
function AnalyticsTracker() {
    _s();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const locale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"])();
    // Track page views
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnalyticsTracker.useEffect": ()=>{
            if (pathname) {
                if ("TURBOPACK compile-time truthy", 1) {
                    setTimeout({
                        "AnalyticsTracker.useEffect": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["track"].pageView(pathname, locale)
                    }["AnalyticsTracker.useEffect"], 100);
                }
            }
        }
    }["AnalyticsTracker.useEffect"], [
        pathname,
        locale
    ]);
    // Track wallet connect
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnalyticsTracker.useEffect": ()=>{
            if (publicKey && ("TURBOPACK compile-time value", "object") !== "undefined") {
                setTimeout({
                    "AnalyticsTracker.useEffect": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["track"].walletConnect(publicKey.toBase58().slice(0, 8))
                }["AnalyticsTracker.useEffect"], 100);
            }
        }
    }["AnalyticsTracker.useEffect"], [
        publicKey
    ]);
    return null;
}
_s(AnalyticsTracker, "6BLw5iV18aff0JOMniZYfQpFNzM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"]
    ];
});
_c = AnalyticsTracker;
function WalletAuthHint() {
    _s1();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletAuthHint.useEffect": ()=>{
            if (typeof document === "undefined") return;
            const secure = ("TURBOPACK compile-time value", "object") !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
            if (publicKey) {
                const encoded = encodeURIComponent(publicKey.toBase58());
                document.cookie = `academy_wallet_hint=${encoded}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
                return;
            }
            document.cookie = `academy_wallet_hint=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
        }
    }["WalletAuthHint.useEffect"], [
        publicKey
    ]);
    return null;
}
_s1(WalletAuthHint, "X6ROpJYQWk0HmF2SNKy/3i1VsiY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"]
    ];
});
_c1 = WalletAuthHint;
// CSS moved to globals.css for reliable global loading in Turbopack
// Log wallet errors. WalletConnectionError on auto-connect (no extension) is
// suppressed; all other errors including user-initiated failures are logged.
function handleWalletError(error) {
    // Suppress the auto-connect noise when no wallet extension is installed.
    // WalletNotReadyError means extension not found — also not actionable.
    if (error.name === "WalletNotReadyError" || error.name === "WalletConnectionError") {
        return;
    }
    console.error("[wallet]", error.name, error.message);
}
function Providers({ children }) {
    _s2();
    const [queryClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "Providers.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
                defaultOptions: {
                    queries: {
                        retry: 2,
                        refetchOnWindowFocus: false
                    }
                }
            })
    }["Providers.useState"]);
    const endpoint = ("TURBOPACK compile-time value", "https://devnet.helius-rpc.com/?api-key=0cd5dc9d-e5ac-4227-9894-bc3dec9c2661") ?? "https://api.devnet.solana.com";
    const wallets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Providers.useMemo[wallets]": ()=>[
                new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$phantom$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PhantomWalletAdapter"](),
                new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$solflare$2f$lib$2f$esm$2f$adapter$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SolflareWalletAdapter"]({
                    network: "devnet"
                })
            ]
    }["Providers.useMemo[wallets]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionProvider"], {
        refetchOnWindowFocus: false,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
            client: queryClient,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$ConnectionProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConnectionProvider"], {
                endpoint: endpoint,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$WalletProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletProvider"], {
                    wallets: wallets,
                    autoConnect: true,
                    onError: handleWalletError,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2d$ui$2f$lib$2f$esm$2f$WalletModalProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletModalProvider"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnalyticsTracker, {}, void 0, false, {
                                fileName: "[project]/src/components/Providers.tsx",
                                lineNumber: 117,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletAuthHint, {}, void 0, false, {
                                fileName: "[project]/src/components/Providers.tsx",
                                lineNumber: 118,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TooltipProvider"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AchievementToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AchievementToastManager"], {}, void 0, false, {
                                        fileName: "[project]/src/components/Providers.tsx",
                                        lineNumber: 120,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeSync"], {}, void 0, false, {
                                        fileName: "[project]/src/components/Providers.tsx",
                                        lineNumber: 121,
                                        columnNumber: 17
                                    }, this),
                                    children
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Providers.tsx",
                                lineNumber: 119,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Providers.tsx",
                        lineNumber: 116,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/Providers.tsx",
                    lineNumber: 111,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/Providers.tsx",
                lineNumber: 110,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/Providers.tsx",
            lineNumber: 109,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/Providers.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}
_s2(Providers, "dNCeXTZuFn6W/X3GEXJUK9vg01I=");
_c2 = Providers;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "AnalyticsTracker");
__turbopack_context__.k.register(_c1, "WalletAuthHint");
__turbopack_context__.k.register(_c2, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/i18n/routing.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Link",
    ()=>Link,
    "getPathname",
    ()=>getPathname,
    "redirect",
    ()=>redirect,
    "routing",
    ()=>routing,
    "usePathname",
    ()=>usePathname,
    "useRouter",
    ()=>useRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$routing$2f$defineRouting$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__defineRouting$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/routing/defineRouting.js [app-client] (ecmascript) <export default as defineRouting>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2f$react$2d$client$2f$createNavigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__createNavigation$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/navigation/react-client/createNavigation.js [app-client] (ecmascript) <export default as createNavigation>");
;
;
const routing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$routing$2f$defineRouting$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__defineRouting$3e$__["defineRouting"])({
    locales: [
        'en',
        'pt-BR',
        'es'
    ],
    defaultLocale: 'en'
});
const { Link, redirect, usePathname, useRouter, getPathname } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2f$react$2d$client$2f$createNavigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__createNavigation$3e$__["createNavigation"])(routing);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/sheet.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sheet",
    ()=>Sheet,
    "SheetClose",
    ()=>SheetClose,
    "SheetContent",
    ()=>SheetContent,
    "SheetDescription",
    ()=>SheetDescription,
    "SheetFooter",
    ()=>SheetFooter,
    "SheetHeader",
    ()=>SheetHeader,
    "SheetTitle",
    ()=>SheetTitle,
    "SheetTrigger",
    ()=>SheetTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as XIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript) <export * as Dialog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function Sheet({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Root, {
        "data-slot": "sheet",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 11,
        columnNumber: 10
    }, this);
}
_c = Sheet;
function SheetTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Trigger, {
        "data-slot": "sheet-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 17,
        columnNumber: 10
    }, this);
}
_c1 = SheetTrigger;
function SheetClose({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Close, {
        "data-slot": "sheet-close",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 23,
        columnNumber: 10
    }, this);
}
_c2 = SheetClose;
function SheetPortal({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Portal, {
        "data-slot": "sheet-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 29,
        columnNumber: 10
    }, this);
}
_c3 = SheetPortal;
function SheetOverlay({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Overlay, {
        "data-slot": "sheet-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_c4 = SheetOverlay;
function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }) {
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("CommonUi");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetOverlay, {}, void 0, false, {
                fileName: "[project]/src/components/ui/sheet.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Content, {
                "data-slot": "sheet-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm", side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b", side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t", className),
                ...props,
                children: [
                    children,
                    showCloseButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Close, {
                        className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__["XIcon"], {
                                className: "size-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/sheet.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: t("close")
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/sheet.tsx",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/sheet.tsx",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/sheet.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_s(SheetContent, "h6+q2O3NJKPY5uL0BIJGLIanww8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c5 = SheetContent;
function SheetHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1.5 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
_c6 = SheetHeader;
function SheetFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mt-auto flex flex-col gap-2 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
_c7 = SheetFooter;
function SheetTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Title, {
        "data-slot": "sheet-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-foreground font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
_c8 = SheetTitle;
function SheetDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__Dialog$3e$__["Dialog"].Description, {
        "data-slot": "sheet-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
_c9 = SheetDescription;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "Sheet");
__turbopack_context__.k.register(_c1, "SheetTrigger");
__turbopack_context__.k.register(_c2, "SheetClose");
__turbopack_context__.k.register(_c3, "SheetPortal");
__turbopack_context__.k.register(_c4, "SheetOverlay");
__turbopack_context__.k.register(_c5, "SheetContent");
__turbopack_context__.k.register(_c6, "SheetHeader");
__turbopack_context__.k.register(_c7, "SheetFooter");
__turbopack_context__.k.register(_c8, "SheetTitle");
__turbopack_context__.k.register(_c9, "SheetDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/WalletButton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletButton",
    ()=>WalletButton,
    "truncateAddress",
    ()=>truncateAddress,
    "useWalletAddress",
    ()=>useWalletAddress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const WalletMultiButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/node_modules/@solana/wallet-adapter-react-ui/lib/esm/index.js [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>m.WalletMultiButton), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/@solana/wallet-adapter-react-ui/lib/esm/index.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    // Renders a placeholder with identical size so the nav doesn't shift
    // while the wallet module loads.
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "wallet-adapter-button wallet-adapter-button-trigger",
            disabled: true,
            "aria-label": "Loading wallet",
            children: "Select Wallet"
        }, void 0, false, {
            fileName: "[project]/src/components/WalletButton.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c = WalletMultiButton;
function WalletButton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletMultiButton, {}, void 0, false, {
        fileName: "[project]/src/components/WalletButton.tsx",
        lineNumber: 26,
        columnNumber: 10
    }, this);
}
_c1 = WalletButton;
function truncateAddress(address) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
function useWalletAddress() {
    _s();
    const { publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    return publicKey ? truncateAddress(publicKey.toBase58()) : null;
}
_s(useWalletAddress, "mzyxrHmpp4PnhNILMr6pKoSuMFs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"]
    ];
});
var _c, _c1;
__turbopack_context__.k.register(_c, "WalletMultiButton");
__turbopack_context__.k.register(_c1, "WalletButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ThemeToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeToggle",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor.js [app-client] (ecmascript) <export default as Monitor>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useTheme.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const MODES = [
    {
        value: "dark",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"],
        label: "Dark"
    },
    {
        value: "light",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"],
        label: "Light"
    },
    {
        value: "system",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Monitor$3e$__["Monitor"],
        label: "System"
    }
];
function ThemeToggle() {
    _s();
    const { theme, setTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    // Cycle: dark → light → system → dark
    function cycle() {
        const idx = MODES.findIndex((m)=>m.value === theme);
        const next = MODES[(idx + 1) % MODES.length];
        setTheme(next.value);
    }
    const current = MODES.find((m)=>m.value === theme) ?? MODES[0];
    const Icon = current.icon;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: cycle,
        className: "inline-flex items-center justify-center rounded-lg p-2 text-sm transition-colors duration-150 min-h-[36px] min-w-[36px]",
        style: {
            color: "var(--text-secondary)",
            background: "transparent"
        },
        onMouseEnter: (e)=>{
            e.currentTarget.style.background = "var(--bg-elevated)";
            e.currentTarget.style.color = "var(--text-primary)";
        },
        onMouseLeave: (e)=>{
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
        },
        "aria-label": `Theme: ${current.label}. Click to change.`,
        title: `Theme: ${current.label}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
            className: "w-4 h-4"
        }, void 0, false, {
            fileName: "[project]/src/components/ThemeToggle.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ThemeToggle.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(ThemeToggle, "5ABGV54qnXKp6rHn7MS/8MjwRhQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = ThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/LocaleSwitcher.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LocaleSwitcher",
    ()=>LocaleSwitcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-client] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/analytics.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function LocaleSwitcher({ variant = "settings", onSwitched, className = "", fullWidth = false }) {
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("LocaleSwitcher");
    const locale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    function changeLocale(newLocale) {
        if (newLocale === locale) return;
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["track"].languageSwitch(locale, newLocale);
        router.replace(pathname, {
            locale: newLocale
        });
        onSwitched?.();
    }
    const isNav = variant === "nav";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative inline-flex items-center ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                size: 14,
                style: {
                    color: "var(--text-muted)",
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                },
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/components/LocaleSwitcher.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                value: locale,
                onChange: (e)=>changeLocale(e.target.value),
                className: "appearance-none rounded-lg text-sm transition-colors outline-none",
                style: {
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    padding: isNav ? "7px 30px 7px 30px" : "8px 32px 8px 34px",
                    minHeight: isNav ? "36px" : "38px",
                    width: fullWidth ? "100%" : "auto"
                },
                "aria-label": t("aria"),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "en",
                        children: t("options.en")
                    }, void 0, false, {
                        fileName: "[project]/src/components/LocaleSwitcher.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "pt-BR",
                        children: t("options.ptBR")
                    }, void 0, false, {
                        fileName: "[project]/src/components/LocaleSwitcher.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: "es",
                        children: t("options.es")
                    }, void 0, false, {
                        fileName: "[project]/src/components/LocaleSwitcher.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LocaleSwitcher.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/LocaleSwitcher.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(LocaleSwitcher, "aR2SZq82xjOSZG4lVzKrxCPR5No=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LocaleSwitcher;
var _c;
__turbopack_context__.k.register(_c, "LocaleSwitcher");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/IdentityProfileService.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IDENTITY_PROFILE_UPDATED_EVENT",
    ()=>IDENTITY_PROFILE_UPDATED_EVENT,
    "getLinkedWalletForSocial",
    ()=>getLinkedWalletForSocial,
    "getProfileBySubject",
    ()=>getProfileBySubject,
    "isProfileComplete",
    ()=>isProfileComplete,
    "linkSubjects",
    ()=>linkSubjects,
    "resolveCurrentSubject",
    ()=>resolveCurrentSubject,
    "upsertProfile",
    ()=>upsertProfile
]);
const PROFILE_PREFIX = "academy_identity_profile:";
const SOCIAL_TO_WALLET_PREFIX = "academy_identity_link_social:";
const WALLET_TO_SOCIAL_PREFIX = "academy_identity_link_wallet:";
const IDENTITY_PROFILE_UPDATED_EVENT = "academy:identity-profile-updated";
function profileKey(subject) {
    if (subject.kind === "wallet") {
        return `${PROFILE_PREFIX}wallet:${subject.id}`;
    }
    return `${PROFILE_PREFIX}social:${subject.provider}:${subject.id}`;
}
function socialLinkKey(subject) {
    return `${SOCIAL_TO_WALLET_PREFIX}${subject.provider}:${subject.id}`;
}
function walletLinkKey(subject) {
    return `${WALLET_TO_SOCIAL_PREFIX}${subject.id}`;
}
function nowIso() {
    return new Date().toISOString();
}
function canUseStorage() {
    return ("TURBOPACK compile-time value", "object") !== "undefined";
}
function isProfileComplete(profile) {
    if (!profile) return false;
    return Boolean(profile.displayName?.trim() || profile.username?.trim());
}
function getProfileBySubject(subject) {
    if (!subject || !canUseStorage()) return null;
    try {
        const raw = localStorage.getItem(profileKey(subject));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
            displayName: parsed.displayName,
            username: parsed.username,
            createdAt: parsed.createdAt,
            updatedAt: parsed.updatedAt
        };
    } catch  {
        return null;
    }
}
function upsertProfile(subject, patch) {
    const existing = getProfileBySubject(subject);
    const timestamp = nowIso();
    const next = {
        displayName: patch.displayName?.trim() || existing?.displayName,
        username: patch.username?.trim() || existing?.username,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp
    };
    if (canUseStorage()) {
        localStorage.setItem(profileKey(subject), JSON.stringify(next));
        window.dispatchEvent(new Event(IDENTITY_PROFILE_UPDATED_EVENT));
    }
    return next;
}
function resolveCurrentSubject(session, walletAddress) {
    if (session?.providerAccountId && (session.provider === "google" || session.provider === "github")) {
        return {
            kind: "social",
            provider: session.provider,
            id: session.providerAccountId
        };
    }
    if (walletAddress) {
        return {
            kind: "wallet",
            id: walletAddress
        };
    }
    return null;
}
function linkSubjects(social, wallet) {
    if (!canUseStorage()) //TURBOPACK unreachable
    ;
    localStorage.setItem(socialLinkKey(social), wallet.id);
    localStorage.setItem(walletLinkKey(wallet), `${social.provider}:${social.id}`);
}
function getLinkedWalletForSocial(social) {
    if (!canUseStorage()) //TURBOPACK unreachable
    ;
    return localStorage.getItem(socialLinkKey(social));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Nav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Nav",
    ()=>Nav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.js [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-client] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/log-out.js [app-client] (ecmascript) <export default as LogOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/sheet.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/WalletButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ThemeToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useXpBalance.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useSigningMode.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useStubXp.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useTheme.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LocaleSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LocaleSwitcher.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/IdentityProfileService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/streak.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
;
;
;
;
;
;
;
;
function Nav() {
    _s();
    const { connected, publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const { data: xp } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useXpBalance"])();
    const signingMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSigningMode"])();
    const localXp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStubXp"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const locale = params?.locale ?? "en";
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("Nav");
    const [mobileOpen, setMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [identityVersion, setIdentityVersion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [streak, setStreak] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const desktopMenuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { theme, resolved } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>setMounted(true)
    }["Nav.useEffect"], []);
    // Server always assumes dark. Defers client evaluation to post-mount.
    const isDark = mounted ? resolved === "dark" : true;
    const walletAddress = publicKey?.toBase58() ?? null;
    const walletShort = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : null;
    const subject = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Nav.useMemo[subject]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveCurrentSubject"])(session ? {
                provider: session.provider,
                providerAccountId: session.providerAccountId
            } : null, walletAddress)
    }["Nav.useMemo[subject]"], [
        session,
        walletAddress
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            function handleIdentityUpdate() {
                setIdentityVersion({
                    "Nav.useEffect.handleIdentityUpdate": (value)=>value + 1
                }["Nav.useEffect.handleIdentityUpdate"]);
            }
            window.addEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IDENTITY_PROFILE_UPDATED_EVENT"], handleIdentityUpdate);
            window.addEventListener("storage", handleIdentityUpdate);
            return ({
                "Nav.useEffect": ()=>{
                    window.removeEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IDENTITY_PROFILE_UPDATED_EVENT"], handleIdentityUpdate);
                    window.removeEventListener("storage", handleIdentityUpdate);
                }
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            function closeDesktopMenuIfOutside(event) {
                const menu = desktopMenuRef.current;
                if (!menu?.open) return;
                if (event.target instanceof Node && !menu.contains(event.target)) {
                    menu.open = false;
                }
            }
            function closeDesktopMenuOnEscape(event) {
                if (event.key !== "Escape") return;
                const menu = desktopMenuRef.current;
                if (!menu?.open) return;
                menu.open = false;
            }
            document.addEventListener("mousedown", closeDesktopMenuIfOutside);
            document.addEventListener("keydown", closeDesktopMenuOnEscape);
            return ({
                "Nav.useEffect": ()=>{
                    document.removeEventListener("mousedown", closeDesktopMenuIfOutside);
                    document.removeEventListener("keydown", closeDesktopMenuOnEscape);
                }
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            function syncStreak() {
                setStreak((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCurrentStreak"])());
            }
            syncStreak();
            window.addEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STREAK_UPDATED_EVENT"], syncStreak);
            window.addEventListener("storage", syncStreak);
            return ({
                "Nav.useEffect": ()=>{
                    window.removeEventListener(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$streak$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STREAK_UPDATED_EVENT"], syncStreak);
                    window.removeEventListener("storage", syncStreak);
                }
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], []);
    void identityVersion;
    const identityProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$IdentityProfileService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProfileBySubject"])(subject);
    const displayXp = signingMode === "stub" ? localXp : xp?.amount ?? 0;
    const displayLevel = signingMode === "stub" ? Math.floor(Math.sqrt(displayXp / 100)) : xp?.level ?? 0;
    const isLoggedIn = Boolean(session) || connected;
    const hasSocialSession = Boolean(session);
    const stableReturnTo = `/${locale}`;
    const authHref = `/auth?returnTo=${encodeURIComponent(stableReturnTo)}`;
    const authCallbackHref = `/${locale}/auth?returnTo=${encodeURIComponent(stableReturnTo)}`;
    const socialLinkHref = connected ? "/settings" : authHref;
    const displayIdentity = session?.user?.name || session?.user?.email || identityProfile?.displayName || identityProfile?.username || walletShort || t("accountLabel");
    const avatarInitial = displayIdentity.trim().charAt(0).toUpperCase();
    function isActive(href, exact = false) {
        if (exact) return pathname === href;
        return pathname === href || pathname?.startsWith(href + "/");
    }
    const homeHref = `/`;
    const coursesHref = `/courses`;
    const dashboardHref = `/dashboard`;
    const leaderboardHref = `/leaderboard`;
    const profileHref = `/profile`;
    const settingsHref = `/settings`;
    const coursesActive = isActive(coursesHref);
    const publicLinks = [
        {
            href: coursesHref,
            label: t("courses"),
            active: coursesActive
        },
        {
            href: leaderboardHref,
            label: t("leaderboard"),
            active: isActive(leaderboardHref)
        },
        {
            href: dashboardHref,
            label: t("dashboard"),
            active: isActive(dashboardHref)
        }
    ];
    const loggedInLinks = [
        {
            href: profileHref,
            label: t("profile"),
            active: isActive(profileHref)
        },
        {
            href: settingsHref,
            label: t("settings"),
            active: isActive(settingsHref)
        }
    ];
    function closeDesktopMenu() {
        const menu = desktopMenuRef.current;
        if (!menu?.open) return;
        menu.open = false;
    }
    function closeDesktopMenuDeferred() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        window.requestAnimationFrame(closeDesktopMenu);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        className: "sticky top-0 z-50 border-b px-4 py-0",
        style: {
            background: "var(--bg-base)",
            borderColor: "var(--border-subtle)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-6xl relative flex items-center justify-between h-14",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                        href: homeHref,
                        prefetch: false,
                        "aria-label": t("homeAria"),
                        className: "shrink-0 flex items-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            src: isDark ? "/brand/superteam/ST-YELLOW-HORIZONTAL.svg" : "/brand/superteam/ST-DARK-GREEN-HORIZONTAL.svg",
                            alt: t("logoAlt"),
                            width: 148,
                            height: 34,
                            priority: true,
                            className: "h-8 w-auto"
                        }, void 0, false, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 205,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Nav.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/Nav.tsx",
                    lineNumber: 198,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5",
                    children: publicLinks.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                            href: link.href,
                            active: link.active,
                            children: link.label
                        }, link.href, false, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 222,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/Nav.tsx",
                    lineNumber: 220,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        connected && streak > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-semibold",
                            style: {
                                background: "rgba(248,113,113,0.1)",
                                border: "1px solid rgba(248,113,113,0.25)",
                                color: "#f87171"
                            },
                            title: t("streakTitle", {
                                count: streak
                            }),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
                                    size: 13,
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 239,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: streak
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 240,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 230,
                            columnNumber: 13
                        }, this),
                        connected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                            style: {
                                background: "rgba(153,69,255,0.1)",
                                border: "1px solid rgba(153,69,255,0.25)",
                                color: "var(--text-purple)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block w-1.5 h-1.5 rounded-full",
                                    style: {
                                        background: "var(--solana-purple)"
                                    },
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 253,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        displayXp.toLocaleString("en-US"),
                                        " XP"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 258,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: "var(--text-muted)"
                                    },
                                    children: "·"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 259,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: t("levelShort", {
                                        level: displayLevel
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 260,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 245,
                            columnNumber: 13
                        }, this),
                        !isLoggedIn ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                            href: authHref,
                            prefetch: false,
                            className: "hidden md:inline-flex min-h-[40px] items-center rounded-lg px-3 text-sm font-medium transition-all duration-150",
                            style: {
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)"
                            },
                            children: t("login")
                        }, void 0, false, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 265,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                            ref: desktopMenuRef,
                            className: "hidden md:block relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                    className: "list-none inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium",
                                    style: {
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--border-default)",
                                        color: "var(--text-primary)"
                                    },
                                    "aria-label": t("userMenuAria"),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                                            style: {
                                                background: "rgba(153,69,255,0.16)",
                                                color: "var(--text-purple)",
                                                border: "1px solid rgba(153,69,255,0.24)"
                                            },
                                            children: avatarInitial || "U"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 288,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "max-w-[110px] truncate",
                                            children: displayIdentity
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 298,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                            size: 14,
                                            "aria-hidden": "true"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 299,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 279,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute right-0 z-[70] mt-2 w-72 overflow-visible rounded-xl",
                                    style: {
                                        background: "var(--bg-surface)",
                                        border: "1px solid var(--border-subtle)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-3 py-2.5 text-xs",
                                            style: {
                                                color: "var(--text-muted)",
                                                borderBottom: "1px solid var(--border-subtle)"
                                            },
                                            children: walletShort ? t("walletConnected", {
                                                address: walletShort
                                            }) : t("walletDisconnected")
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 308,
                                            columnNumber: 17
                                        }, this),
                                        loggedInLinks.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                                                href: link.href,
                                                prefetch: false,
                                                onClick: closeDesktopMenu,
                                                className: "block px-3 py-2.5 text-sm",
                                                style: {
                                                    color: link.active ? "var(--text-primary)" : "var(--text-secondary)",
                                                    background: link.active ? "var(--bg-elevated)" : "transparent"
                                                },
                                                children: link.label
                                            }, link.href, false, {
                                                fileName: "[project]/src/components/Nav.tsx",
                                                lineNumber: 320,
                                                columnNumber: 19
                                            }, this)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-3 py-3 space-y-3",
                                            style: {
                                                borderTop: "1px solid var(--border-subtle)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs",
                                                            style: {
                                                                color: "var(--text-muted)"
                                                            },
                                                            children: t("language")
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 339,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LocaleSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocaleSwitcher"], {
                                                            variant: "nav",
                                                            onSwitched: closeDesktopMenu
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 342,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 338,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between gap-3",
                                                    onClick: closeDesktopMenuDeferred,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs",
                                                            style: {
                                                                color: "var(--text-muted)"
                                                            },
                                                            children: t("appearance")
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 348,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ThemeToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeToggle"], {}, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 351,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 344,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs mb-2",
                                                            style: {
                                                                color: "var(--text-muted)"
                                                            },
                                                            children: t("walletSection")
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 354,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletButton"], {}, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 357,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 334,
                                            columnNumber: 17
                                        }, this),
                                        !hasSocialSession && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                                            href: socialLinkHref,
                                            prefetch: false,
                                            onClick: closeDesktopMenu,
                                            className: "block px-3 py-2.5 text-xs",
                                            style: {
                                                color: "var(--text-muted)",
                                                borderTop: "1px solid var(--border-subtle)"
                                            },
                                            children: t("socialOptional")
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 361,
                                            columnNumber: 19
                                        }, this),
                                        hasSocialSession && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                closeDesktopMenu();
                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])({
                                                    callbackUrl: authCallbackHref
                                                });
                                            },
                                            className: "w-full flex items-center gap-2 px-3 py-2.5 text-sm",
                                            style: {
                                                color: "#f87171",
                                                borderTop: "1px solid var(--border-subtle)",
                                                textAlign: "left"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                    size: 13,
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 21
                                                }, this),
                                                t("signOut")
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 375,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 301,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 278,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sheet"], {
                            open: mobileOpen,
                            onOpenChange: setMobileOpen,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTrigger"], {
                                    asChild: true,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "md:hidden inline-flex items-center justify-center rounded-lg p-2 min-h-[44px] min-w-[44px] transition-colors",
                                        style: {
                                            color: "var(--text-secondary)"
                                        },
                                        "aria-label": t("openMenuAria"),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 402,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Nav.tsx",
                                        lineNumber: 397,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 396,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetContent"], {
                                    side: "right",
                                    className: "w-[280px] p-0 border-l",
                                    style: {
                                        background: "var(--bg-surface)",
                                        borderColor: "var(--border-subtle)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTitle"], {
                                            className: "sr-only",
                                            children: t("mobileMenuTitle")
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 413,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-14 border-b px-5 flex items-center",
                                            style: {
                                                borderColor: "var(--border-subtle)"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-lg font-semibold",
                                                style: {
                                                    color: "var(--text-primary)"
                                                },
                                                children: t("menuLabel")
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Nav.tsx",
                                                lineNumber: 418,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 414,
                                            columnNumber: 15
                                        }, this),
                                        connected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mx-5 mt-4 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium",
                                            style: {
                                                background: "rgba(153,69,255,0.1)",
                                                border: "1px solid rgba(153,69,255,0.25)",
                                                color: "var(--text-purple)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block w-1.5 h-1.5 rounded-full",
                                                    style: {
                                                        background: "var(--solana-purple)"
                                                    },
                                                    "aria-hidden": "true"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 435,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        displayXp.toLocaleString("en-US"),
                                                        " XP"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 440,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        color: "var(--text-muted)"
                                                    },
                                                    children: "·"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 441,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: t("levelShort", {
                                                        level: displayLevel
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 442,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 427,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col px-3 mt-4 gap-1",
                                            children: [
                                                publicLinks.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                                                        href: link.href,
                                                        active: link.active,
                                                        onClick: ()=>setMobileOpen(false),
                                                        children: link.label
                                                    }, link.href, false, {
                                                        fileName: "[project]/src/components/Nav.tsx",
                                                        lineNumber: 448,
                                                        columnNumber: 19
                                                    }, this)),
                                                isLoggedIn && loggedInLinks.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                                                        href: link.href,
                                                        active: link.active,
                                                        onClick: ()=>setMobileOpen(false),
                                                        children: link.label
                                                    }, link.href, false, {
                                                        fileName: "[project]/src/components/Nav.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 21
                                                    }, this)),
                                                !hasSocialSession ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileNavLink, {
                                                    href: socialLinkHref,
                                                    active: connected ? isActive(settingsHref) : isActive("/auth"),
                                                    onClick: ()=>setMobileOpen(false),
                                                    children: connected ? t("socialOptional") : t("login")
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 470,
                                                    columnNumber: 19
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        setMobileOpen(false);
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signOut"])({
                                                            callbackUrl: authCallbackHref
                                                        });
                                                    },
                                                    className: "flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-xl min-h-[44px]",
                                                    style: {
                                                        color: "#f87171",
                                                        background: "transparent"
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$log$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LogOut$3e$__["LogOut"], {
                                                            size: 14,
                                                            "aria-hidden": "true"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/Nav.tsx",
                                                            lineNumber: 489,
                                                            columnNumber: 21
                                                        }, this),
                                                        t("signOut")
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/Nav.tsx",
                                                    lineNumber: 478,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 446,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-5 mt-5",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LocaleSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LocaleSwitcher"], {
                                                variant: "settings",
                                                fullWidth: true,
                                                onSwitched: ()=>setMobileOpen(false)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Nav.tsx",
                                                lineNumber: 496,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 495,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-5 mt-5",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WalletButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletButton"], {}, void 0, false, {
                                                fileName: "[project]/src/components/Nav.tsx",
                                                lineNumber: 504,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Nav.tsx",
                                            lineNumber: 503,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Nav.tsx",
                                    lineNumber: 405,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Nav.tsx",
                            lineNumber: 395,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Nav.tsx",
                    lineNumber: 228,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/Nav.tsx",
            lineNumber: 197,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/Nav.tsx",
        lineNumber: 188,
        columnNumber: 5
    }, this);
}
_s(Nav, "sdgUpTMPXVFo9hhXCy8jip5Opbg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useXpBalance$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useXpBalance"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useSigningMode$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSigningMode"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useStubXp$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStubXp"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTheme$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = Nav;
function NavLink({ href, active, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
        href: href,
        prefetch: false,
        className: "relative px-3 py-2 text-sm rounded-md transition-colors duration-150",
        style: {
            color: active ? "var(--text-primary)" : "var(--text-secondary)",
            background: active ? "var(--bg-elevated)" : "transparent"
        },
        children: [
            children,
            active && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute bottom-0 left-3 right-3 h-px rounded-full",
                style: {
                    background: "var(--solana-purple)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/Nav.tsx",
                lineNumber: 535,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Nav.tsx",
        lineNumber: 524,
        columnNumber: 5
    }, this);
}
_c1 = NavLink;
function MobileNavLink({ href, active, children, onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
        href: href,
        prefetch: false,
        onClick: onClick,
        className: "flex items-center px-3 py-3 text-sm font-medium rounded-xl min-h-[44px] transition-colors duration-150",
        style: {
            color: active ? "var(--text-primary)" : "var(--text-secondary)",
            background: active ? "var(--bg-elevated)" : "transparent"
        },
        children: [
            children,
            active && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-auto inline-block w-1.5 h-1.5 rounded-full",
                style: {
                    background: "var(--solana-purple)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/Nav.tsx",
                lineNumber: 568,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Nav.tsx",
        lineNumber: 556,
        columnNumber: 5
    }, this);
}
_c2 = MobileNavLink;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Nav");
__turbopack_context__.k.register(_c1, "NavLink");
__turbopack_context__.k.register(_c2, "MobileNavLink");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/DevnetWarning.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DevnetWarning",
    ()=>DevnetWarning,
    "FaucetBanner",
    ()=>FaucetBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useWallet.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@solana/wallet-adapter-react/lib/esm/useConnection.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
function isDevnetEndpoint(url) {
    return url.includes("devnet") || url.includes("localhost") || url.includes("127.0.0.1");
}
function DevnetWarning() {
    _s();
    const { connected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("SystemBanners");
    const showWarning = connected && !isDevnetEndpoint(connection.rpcEndpoint);
    if (!showWarning) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-sm text-center py-2 px-4 font-medium",
        style: {
            background: "rgba(251,191,36,0.1)",
            borderBottom: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24"
        },
        children: [
            t("wrongNetworkPrefix"),
            " ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                children: t("devnet")
            }, void 0, false, {
                fileName: "[project]/src/components/DevnetWarning.tsx",
                lineNumber: 32,
                columnNumber: 33
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/DevnetWarning.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(DevnetWarning, "XGLnjGFBnPp/ggYJpvrJanFqTFI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c = DevnetWarning;
function FaucetBanner() {
    _s1();
    const { connected, publicKey } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const { connection } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"])();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("SystemBanners");
    const { data: lamports } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "sol-balance",
            publicKey?.toBase58()
        ],
        queryFn: {
            "FaucetBanner.useQuery": ()=>connection.getBalance(publicKey)
        }["FaucetBanner.useQuery"],
        enabled: connected && !!publicKey,
        staleTime: 30_000
    });
    if (!connected || lamports === undefined || lamports >= 10_000_000) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-sm text-center py-2 px-4",
        style: {
            background: "rgba(84,151,213,0.08)",
            borderBottom: "1px solid rgba(84,151,213,0.2)",
            color: "var(--solana-blue, #5497d5)"
        },
        children: [
            t("lowSolPrefix"),
            " ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                href: "https://faucet.solana.com",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "underline font-semibold",
                children: t("faucetCta")
            }, void 0, false, {
                fileName: "[project]/src/components/DevnetWarning.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/DevnetWarning.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_s1(FaucetBanner, "UKa3rnYp5nsprb2Xyx4eKoFgAV4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useWallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$solana$2f$wallet$2d$adapter$2d$react$2f$lib$2f$esm$2f$useConnection$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useConnection"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
_c1 = FaucetBanner;
var _c, _c1;
__turbopack_context__.k.register(_c, "DevnetWarning");
__turbopack_context__.k.register(_c1, "FaucetBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_916dc0ba._.js.map