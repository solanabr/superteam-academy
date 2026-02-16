"use client";

import { useEffect, useRef, useState } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, highlightTrailingWhitespace, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap, lineNumbers } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { linter } from "@codemirror/lint";
import { javascript } from "@codemirror/lang-javascript";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  completeAnyWord,
  closeBrackets,
  closeBracketsKeymap,
  startCompletion,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  foldKeymap,
} from "@codemirror/language";
import {
  searchKeymap,
  highlightSelectionMatches,
} from "@codemirror/search";
import { history, historyKeymap } from "@codemirror/commands";

export type SupportedLanguage = "javascript" | "typescript" | "rust" | "json";

type CodeEditorProps = {
  initialValue?: string;
  language: SupportedLanguage;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  className?: string;
};

// Custom syntax highlighting theme matching Superteam Academy design system
const superteamHighlightStyle = HighlightStyle.define([
  // Keywords (use solana green for primary keywords)
  { tag: t.keyword, color: "var(--solana, #14F195)", fontWeight: "500" },
  // Strings (use rust orange)
  { tag: t.string, color: "var(--rust, #F06529)" },
  // Comments (use secondary text color, italic)
  { tag: t.comment, color: "var(--text-secondary, #8F9099)", fontStyle: "italic" },
  // Numbers
  { tag: t.number, color: "var(--syntax-purple, #8470FF)" },
  // Types, classes
  { tag: t.typeName, color: "var(--solana, #14F195)", opacity: 0.9 },
  { tag: t.className, color: "var(--solana, #14F195)", opacity: 0.9 },
  // Variables, properties
  { tag: t.variableName, color: "var(--text-primary, #EDEDEF)" },
  { tag: t.propertyName, color: "var(--text-primary, #EDEDEF)" },
  // Operators
  { tag: t.operator, color: "var(--text-primary, #EDEDEF)" },
  // Punctuation
  { tag: t.punctuation, color: "var(--text-secondary, #8F9099)" },
  // Meta tags (imports, etc.)
  { tag: t.meta, color: "var(--solana, #14F195)", opacity: 0.8 },
  { tag: t.tagName, color: "var(--solana, #14F195)", opacity: 0.8 },
  // Attributes
  { tag: t.attributeName, color: "var(--text-primary, #EDEDEF)" },
  // Invalid/error
  { tag: t.invalid, color: "var(--rust, #F06529)", backgroundColor: "rgba(240, 101, 41, 0.1)" },
]);

// Rust keywords and common items
const RUST_KEYWORDS = [
  "fn", "let", "mut", "pub", "struct", "enum", "impl", "trait", "mod", "use",
  "const", "static", "if", "else", "match", "for", "while", "loop", "break",
  "continue", "return", "self", "Self", "super", "crate", "extern", "async",
  "await", "unsafe", "dyn", "ref", "move", "where", "type", "union", "macro",
];

const RUST_STD_LIB = [
  "println!", "print!", "eprintln!", "eprint!", "format!", "vec!",
  "String::new", "String::from", "Vec::new", "Vec::with_capacity",
  "Option", "Some", "None", "Result", "Ok", "Err",
  "Box::new", "Rc::new", "Arc::new", "Cell::new", "RefCell::new",
  "std::io", "std::fs", "std::path", "std::collections", "std::sync",
];

const RUST_IMPORTS = [
  "std::io", "std::io::stdin", "std::io::stdout", "std::io::Read", "std::io::Write",
  "std::fs", "std::fs::File", "std::fs::read_to_string",
  "std::path::Path", "std::path::PathBuf",
  "std::collections::HashMap", "std::collections::BTreeMap", "std::collections::HashSet",
  "std::sync::Arc", "std::sync::Mutex", "std::sync::RwLock",
  "std::thread", "std::time", "std::fmt", "std::str",
];

// JavaScript/TypeScript keywords and common APIs
const JS_KEYWORDS = [
  "const", "let", "var", "function", "class", "async", "await", "import", "export",
  "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue",
  "return", "try", "catch", "finally", "throw", "new", "this", "super", "typeof",
  "instanceof", "in", "of", "void", "delete", "yield", "extends", "implements",
];

const JS_APIS = [
  "console.log", "console.error", "console.warn", "console.info", "console.debug",
  "Array", "Object", "String", "Number", "Boolean", "Date", "Math", "JSON",
  "Promise", "Set", "Map", "WeakSet", "WeakMap", "Symbol", "BigInt",
  "fetch", "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURI", "decodeURI",
  "localStorage", "sessionStorage", "window", "document", "navigator",
];

const JS_IMPORTS = [
  "react", "react-dom", "next", "next/link", "next/image", "next/router",
  "@solana/web3.js", "@coral-xyz/anchor", "@solana/wallet-adapter-react",
  "fs", "path", "http", "https", "url", "querystring", "crypto",
];

// Rust completion source
function rustCompletions(context: CompletionContext): CompletionResult | null {
  const { state, pos, explicit } = context;
  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  // Import/use statement completions
  const useMatch = textBefore.match(/use\s+(?:crate::|self::|super::)?(std::)?([\w:]*)$/);
  if (useMatch) {
    const hasStd = !!useMatch[1];
    const prefix = useMatch[2] || "";
    
    // Only suggest std:: imports if we're not explicitly using crate/self/super
    if (hasStd || (!textBefore.match(/use\s+(crate|self|super)::/) && (prefix === "" || explicit))) {
      const filtered = RUST_IMPORTS.filter((imp) => {
        if (prefix === "") return true;
        // Match if the import contains the prefix or starts with it
        const impWithoutStd = imp.replace(/^std::/, "");
        return impWithoutStd.includes(prefix) || impWithoutStd.startsWith(prefix);
      });
      
      if (filtered.length > 0 || explicit) {
        const startPos = hasStd ? pos - (`std::${prefix}`).length : pos - prefix.length;
        return {
          from: startPos,
          options: filtered.map((imp) => ({
            label: imp,
            type: "namespace",
            detail: "std library",
            apply: `${hasStd ? "" : "std::"}${imp.replace(/^std::/, "")};`,
          })),
        };
      }
    }
  }

  // Macro completions (println!, vec!, etc.)
  const macroMatch = textBefore.match(/(\w+!?)$/);
  if (macroMatch) {
    const word = macroMatch[1];
    const macros = RUST_STD_LIB.filter((m) => m.includes("!"));
    const matching = macros.filter((m) => m.startsWith(word));
    if (matching.length > 0 || explicit) {
      return {
        from: pos - word.length,
        options: matching.map((m) => ({
          label: m,
          type: "function",
          detail: "macro",
        })),
      };
    }
  }

  // Regular word completion
  const wordMatch = context.matchBefore(/\w*/);
  if (!wordMatch || (wordMatch.from === wordMatch.to && !explicit)) {
    return null;
  }

  const word = wordMatch.text;
  const allCompletions = [
    ...RUST_KEYWORDS.map((kw) => ({ label: kw, type: "keyword" as const })),
    ...RUST_STD_LIB.filter((item) => !item.includes("!")).map((item) => ({
      label: item,
      type: "function" as const,
      detail: "std library",
    })),
  ];

  const filtered = allCompletions.filter((c) =>
    c.label.toLowerCase().startsWith(word.toLowerCase())
  );

  return {
    from: wordMatch.from,
    options: filtered.length > 0 ? filtered : (explicit ? allCompletions : []),
  };
}

// JavaScript/TypeScript completion source
function jsCompletions(context: CompletionContext): CompletionResult | null {
  const { state, pos, explicit } = context;
  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  // Import statement completions (ES6: import ... from "...")
  const importFromMatch = textBefore.match(/import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s+from\s+['"]([\w/@.-]*)$/);
  if (importFromMatch) {
    const prefix = importFromMatch[1] || "";
    const filtered = JS_IMPORTS.filter((imp) => imp.startsWith(prefix));
    if (filtered.length > 0 || explicit) {
      return {
        from: pos - prefix.length,
        options: filtered.map((imp) => ({
          label: imp,
          type: "module",
          detail: "package",
          apply: imp,
        })),
      };
    }
  }

  // Import statement completions (ES6: import "...")
  const importPathMatch = textBefore.match(/import\s+['"]([\w/@.-]*)$/);
  if (importPathMatch) {
    const prefix = importPathMatch[1] || "";
    const filtered = JS_IMPORTS.filter((imp) => imp.startsWith(prefix));
    if (filtered.length > 0 || explicit) {
      return {
        from: pos - prefix.length,
        options: filtered.map((imp) => ({
          label: imp,
          type: "module",
          detail: "package",
          apply: imp,
        })),
      };
    }
  }

  // Dynamic import completions (import(...))
  const dynamicImportMatch = textBefore.match(/import\s*\(\s*['"]([\w/@.-]*)$/);
  if (dynamicImportMatch) {
    const prefix = dynamicImportMatch[1] || "";
    const filtered = JS_IMPORTS.filter((imp) => imp.startsWith(prefix));
    if (filtered.length > 0 || explicit) {
      return {
        from: pos - prefix.length,
        options: filtered.map((imp) => ({
          label: imp,
          type: "module",
          detail: "package",
          apply: imp,
        })),
      };
    }
  }

  // Require statement completions (CommonJS: require("..."))
  const requireMatch = textBefore.match(/require\s*\(\s*['"]([\w/@.-]*)$/);
  if (requireMatch) {
    const prefix = requireMatch[1] || "";
    const filtered = JS_IMPORTS.filter((imp) => imp.startsWith(prefix));
    if (filtered.length > 0 || explicit) {
      return {
        from: pos - prefix.length,
        options: filtered.map((imp) => ({
          label: imp,
          type: "module",
          detail: "package",
          apply: imp,
        })),
      };
    }
  }

  // Regular word completion
  const wordMatch = context.matchBefore(/\w*/);
  if (!wordMatch || (wordMatch.from === wordMatch.to && !explicit)) {
    return null;
  }

  const word = wordMatch.text;
  const allCompletions = [
    ...JS_KEYWORDS.map((kw) => ({ label: kw, type: "keyword" as const })),
    ...JS_APIS.map((api) => ({
      label: api,
      type: api.includes(".") ? ("method" as const) : ("function" as const),
      detail: "built-in",
    })),
  ];

  const filtered = allCompletions.filter((c) =>
    c.label.toLowerCase().startsWith(word.toLowerCase())
  );

  return {
    from: wordMatch.from,
    options: filtered.length > 0 ? filtered : (explicit ? allCompletions : []),
  };
}

function languageExtension(lang: SupportedLanguage) {
  switch (lang) {
    case "rust":
      return rust();
    case "json":
      return json();
    case "typescript":
    case "javascript":
    default:
      return javascript({ jsx: true, typescript: lang === "typescript" });
  }
}

// Get completion source for current language
function getCompletionSource(lang: SupportedLanguage) {
  switch (lang) {
    case "rust":
      return rustCompletions;
    case "javascript":
    case "typescript":
      return jsCompletions;
    case "json":
      return null; // JSON doesn't need custom completions
    default:
      return completeAnyWord;
  }
}

export function CodeEditor({
  initialValue = "",
  language,
  readOnly,
  onChange,
  className,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(language);
  const languageCompartmentRef = useRef(new Compartment());
  const completionCompartmentRef = useRef(new Compartment());
  const indentationMarkersRef = useRef<Extension | null>(null);

  // Load indentation markers dynamically (optional package)
  useEffect(() => {
    if (indentationMarkersRef.current !== undefined) return; // Already attempted
    
    // Try to load indentation markers, but don't fail if package isn't installed
    // @ts-expect-error - Optional package, may not be installed
    import("@replit/codemirror-indentation-markers")
      .then((module: any) => {
        indentationMarkersRef.current = module.indentationMarkers();
      })
      .catch(() => {
        // Package not installed, skip indentation markers
        indentationMarkersRef.current = null;
      });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const completionSource = getCompletionSource(currentLanguage);
    const completionExtension = completionSource
      ? autocompletion({
          override: [completionSource, completeAnyWord],
        })
      : autocompletion({ override: [completeAnyWord] });

    const baseExtensions: Extension[] = [
      // History (undo/redo)
      history(),
      
      // Line numbers
      lineNumbers(),
      
      // Fold gutter (code folding)
      foldGutter({
        openText: "⌄",
        closedText: "›",
      }),
      
      // Bracket matching
      bracketMatching(),
      
      // Close brackets automatically
      closeBrackets(),
      
      // Indent on input
      indentOnInput(),
      
      // Draw custom selection (multi-selection support)
      drawSelection(),
      
      // Drop cursor
      dropCursor(),
      
      // Rectangular selection (Alt+drag)
      rectangularSelection(),
      crosshairCursor(),
      
      // Highlight active line
      highlightActiveLine(),
      highlightActiveLineGutter(),
      
      // Highlight special characters
      highlightSpecialChars(),
      
      // Highlight trailing whitespace
      highlightTrailingWhitespace(),
      
      // Highlight selection matches
      highlightSelectionMatches(),
      
      // Indentation markers (visual guides for indentation levels)
      ...(indentationMarkersRef.current ? [indentationMarkersRef.current] : []),
      
      // Line wrapping (optional - can be toggled)
      // lineWrapping(), // Uncomment to enable line wrapping
      
      // Custom autocompletion with language-specific sources
      completionCompartmentRef.current.of(completionExtension),
      
      // Language selection (Rust / TS / JS / JSON)
      languageCompartmentRef.current.of(languageExtension(currentLanguage)),
      
      // Custom syntax highlighting theme
      syntaxHighlighting(superteamHighlightStyle, { fallback: true }),
      
      // JSON linting
      currentLanguage === "json" ? linter(jsonParseLinter()) : [],
      
      // Keymaps with custom overrides
      keymap.of([
        // Use Ctrl+Space for autocomplete (works on Mac without Spotlight conflict)
        {
          key: "Ctrl-Space",
          run: startCompletion,
        },
        // Also support Alt+Space on Mac as alternative
        {
          key: "Alt-Space",
          mac: "Alt-Space",
          run: startCompletion,
        },
        // Filter out Mod-Space from completionKeymap to avoid Cmd+Space conflict with Spotlight
        ...completionKeymap.filter((binding) => {
          // Remove Mod-Space bindings that conflict with Spotlight on Mac
          if (binding.key === "Mod-Space" || binding.mac === "Mod-Space") {
            return false;
          }
          return true;
        }),
        ...closeBracketsKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
      ]),
      
      // Notify React when the document changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          const doc = update.state.doc;
          onChange(doc.toString());
        }
      }),
      
      // Comprehensive theme matching Superteam Academy design system
      EditorView.theme(
        {
          "&": {
            backgroundColor: "transparent",
            color: "var(--text-primary, #EDEDEF)",
            height: "100%",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
            overflow: "auto",
          },
          ".cm-content": {
            padding: "0.75rem",
            minHeight: "100%",
          },
          ".cm-editor": {
            height: "100%",
          },
          ".cm-editor.cm-focused": {
            outline: "none",
          },
          // Line numbers gutter
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            color: "var(--text-secondary, #8F9099)",
          },
          ".cm-lineNumbers .cm-lineNumber": {
            color: "var(--text-secondary, #8F9099)",
            minWidth: "3ch",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
          },
          // Active line
          ".cm-activeLine": {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            color: "var(--text-primary, #EDEDEF)",
          },
          // Selection
          ".cm-selectionBackground": {
            backgroundColor: "rgba(20, 241, 149, 0.2)",
          },
          ".cm-selectionMatch": {
            backgroundColor: "rgba(20, 241, 149, 0.15)",
          },
          // Cursor
          ".cm-cursor": {
            borderLeftColor: "var(--solana, #14F195)",
            borderLeftWidth: "2px",
          },
          ".cm-dropCursor": {
            borderLeftColor: "var(--solana, #14F195)",
            borderLeftWidth: "2px",
          },
          // Fold gutter
          ".cm-foldGutter": {
            width: "1.2rem",
          },
          ".cm-foldGutter .cm-gutterElement": {
            padding: "0 0.25rem",
            cursor: "pointer",
          },
          ".cm-foldGutter .cm-gutterElement:hover": {
            color: "var(--solana, #14F195)",
          },
          // Matching brackets
          ".cm-matchingBracket": {
            backgroundColor: "rgba(20, 241, 149, 0.2)",
            outline: "1px solid var(--solana, #14F195)",
          },
          ".cm-nonmatchingBracket": {
            backgroundColor: "rgba(240, 101, 41, 0.2)",
            outline: "1px solid var(--rust, #F06529)",
          },
          // Trailing whitespace
          ".cm-trailingSpace": {
            backgroundColor: "rgba(240, 101, 41, 0.1)",
          },
          // Special characters
          ".cm-specialChar": {
            color: "var(--text-secondary, #8F9099)",
            opacity: 0.6,
          },
          // Autocomplete popup styling
          ".cm-tooltip-autocomplete": {
            backgroundColor: "rgba(10, 10, 11, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            backdropFilter: "blur(12px)",
          },
          ".cm-completionLabel": {
            color: "var(--text-primary, #EDEDEF)",
          },
          ".cm-completionDetail": {
            color: "var(--text-secondary, #8F9099)",
          },
          ".cm-completionMatchedText": {
            color: "var(--solana, #14F195)",
            fontWeight: "bold",
          },
          ".cm-completionIcon": {
            opacity: 0.7,
          },
          ".cm-completionIcon-function, .cm-completionIcon-method": {
            color: "var(--solana, #14F195)",
          },
          ".cm-completionIcon-keyword": {
            color: "var(--solana, #14F195)",
          },
          ".cm-completionIcon-variable": {
            color: "var(--text-primary, #EDEDEF)",
          },
          ".cm-completionIcon-class, .cm-completionIcon-type": {
            color: "var(--solana, #14F195)",
          },
          ".cm-completionIcon-namespace": {
            color: "var(--syntax-purple, #8470FF)",
          },
          ".cm-completionIcon-constant": {
            color: "var(--syntax-purple, #8470FF)",
          },
          ".cm-completionIcon-module": {
            color: "var(--syntax-purple, #8470FF)",
          },
          ".cm-tooltip-autocomplete ul li[aria-selected]": {
            backgroundColor: "rgba(20, 241, 149, 0.2)",
            color: "var(--text-primary, #EDEDEF)",
          },
          // Search panel - comprehensive styling (consolidated)
          ".cm-panel.cm-search": {
            backgroundColor: "rgba(10, 10, 11, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            backdropFilter: "blur(12px)",
            color: "var(--text-primary, #EDEDEF)",
            padding: "0.5rem",
          },
          ".cm-panel.cm-search *": {
            color: "inherit",
          },
          ".cm-panel.cm-search label": {
            color: "var(--text-primary, #EDEDEF)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          },
          ".cm-panel.cm-search input": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-primary, #EDEDEF)",
            borderRadius: "4px",
            padding: "0.25rem 0.5rem",
          },
          ".cm-panel.cm-search input::placeholder": {
            color: "var(--text-secondary, #8F9099)",
          },
          ".cm-panel.cm-search input:focus": {
            outline: "none",
            borderColor: "var(--solana, #14F195)",
            boxShadow: "0 0 0 2px rgba(20, 241, 149, 0.2)",
          },
          ".cm-panel.cm-search button": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "var(--text-primary, #EDEDEF) !important",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            padding: "0.25rem 0.75rem",
            cursor: "pointer",
            transition: "all 0.2s",
          },
          ".cm-panel.cm-search button span, .cm-panel.cm-search button text": {
            color: "inherit !important",
          },
          ".cm-panel.cm-search button:hover": {
            backgroundColor: "var(--solana, #14F195)",
            color: "var(--void, #0A0A0B) !important",
            borderColor: "var(--solana, #14F195)",
          },
          ".cm-panel.cm-search button:active": {
            backgroundColor: "rgba(20, 241, 149, 0.9)",
          },
          // Cancel/close button specifically - target all possible selectors
          ".cm-panel.cm-search button[name='close'], .cm-panel.cm-search button[aria-label='Close'], .cm-panel.cm-search .cm-button[name='close']": {
            backgroundColor: "rgba(255, 255, 255, 0.1) !important",
            color: "var(--text-primary, #EDEDEF) !important",
            border: "1px solid rgba(255,255,255,0.2) !important",
          },
          ".cm-panel.cm-search button[name='close']:hover, .cm-panel.cm-search button[aria-label='Close']:hover, .cm-panel.cm-search .cm-button[name='close']:hover": {
            backgroundColor: "rgba(240, 101, 41, 0.2) !important",
            color: "var(--rust, #F06529) !important",
            borderColor: "var(--rust, #F06529) !important",
          },
          // Checkboxes
          ".cm-panel.cm-search label input[type='checkbox']": {
            accentColor: "var(--solana, #14F195)",
            cursor: "pointer",
          },
          // Lint panel
          ".cm-panel.cm-lint": {
            backgroundColor: "rgba(10, 10, 11, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            backdropFilter: "blur(12px)",
          },
          ".cm-lint-marker": {
            color: "var(--rust, #F06529)",
          },
          ".cm-lint-marker-error": {
            color: "var(--rust, #F06529)",
          },
          ".cm-lint-marker-warning": {
            color: "var(--syntax-purple, #8470FF)",
          },
          ".cm-lint-marker-info": {
            color: "var(--text-secondary, #8F9099)",
          },
          // Tooltips
          ".cm-tooltip": {
            backgroundColor: "rgba(10, 10, 11, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            backdropFilter: "blur(12px)",
            color: "var(--text-primary, #EDEDEF)",
          },
          // Scrollbar
          ".cm-scroller::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          ".cm-scroller::-webkit-scrollbar-track": {
            background: "transparent",
          },
          ".cm-scroller::-webkit-scrollbar-thumb": {
            background: "var(--border-subtle, #1F1F1F)",
            borderRadius: "4px",
          },
          ".cm-scroller::-webkit-scrollbar-thumb:hover": {
            background: "var(--text-secondary, #8F9099)",
          },
          // Indentation markers styling (when package is installed)
          ".cm-indentation-marker": {
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
          },
          ".cm-indentation-marker-active": {
            borderLeft: "1px solid rgba(20, 241, 149, 0.3)",
          },
        },
        { dark: true }
      ),
      
      EditorView.editable.of(!readOnly),
    ];

    const startState = EditorState.create({
      doc: initialValue,
      extensions: baseExtensions,
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When language prop changes after mount, reconfigure the editor's language and completions.
  useEffect(() => {
    setCurrentLanguage(language);
    const view = viewRef.current;
    if (!view) return;
    
    // Reconfigure language
    view.dispatch({
      effects: languageCompartmentRef.current.reconfigure(languageExtension(language)),
    });
    
    // Reconfigure autocompletion for the new language
    const completionSource = getCompletionSource(language);
    const completionExtension = completionSource
      ? autocompletion({
          override: [completionSource, completeAnyWord],
        })
      : autocompletion({ override: [completeAnyWord] });
    
    view.dispatch({
      effects: completionCompartmentRef.current.reconfigure(completionExtension),
    });
    
    // Reconfigure linting for JSON
    if (language === "json") {
      // Note: linting reconfiguration would require a compartment, but for simplicity
      // we'll keep it as-is since it's only for JSON
    }
  }, [language]);

  return (
    <div
      className={className}
      ref={containerRef}
    />
  );
}
