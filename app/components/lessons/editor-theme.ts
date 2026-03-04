import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--editor-bg)",
      color: "#d8ccad",
      fontFamily: "var(--font-mono)",
      fontSize: "13px",
      lineHeight: "1.6",
      height: "100%",
      minHeight: "0",
      display: "flex",
      flexDirection: "column",
    },
    ".cm-content": {
      caretColor: "var(--editor-cursor)",
      padding: "8px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--editor-cursor)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--editor-selection)",
      },
    ".cm-activeLine": {
      backgroundColor: "var(--editor-line-highlight)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--editor-gutter)",
      color: "rgb(247 234 203 / 25%)",
      border: "none",
      paddingRight: "4px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--editor-line-highlight)",
      color: "rgb(247 234 203 / 50%)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 12px",
      minWidth: "32px",
      fontSize: "12px",
    },
    ".cm-foldGutter .cm-gutterElement": {
      padding: "0 4px",
    },
    ".cm-scroller": {
      overflow: "auto",
      flex: "1",
      minHeight: "0",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    },
    ".cm-scroller::-webkit-scrollbar": {
      display: "none",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgb(18 168 91 / 20%)",
      outline: "1px solid rgb(18 168 91 / 40%)",
    },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#ff7b72" },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: "#d8ccad" },
  { tag: [t.function(t.variableName)], color: "#d2a8ff" },
  { tag: [t.labelName], color: "#d8ccad" },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: "#79c0ff",
  },
  { tag: [t.definition(t.name), t.separator], color: "#d8ccad" },
  {
    tag: [
      t.typeName,
      t.className,
      t.changed,
      t.annotation,
      t.self,
      t.namespace,
    ],
    color: "#ffa657",
  },
  { tag: [t.number, t.bool], color: "#79c0ff" },
  { tag: [t.operator, t.operatorKeyword], color: "#ff7b72" },
  { tag: [t.url, t.escape, t.regexp, t.link], color: "#a5d6ff" },
  { tag: [t.meta, t.comment], color: "#5c6a52", fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold", color: "#d8ccad" },
  { tag: t.emphasis, fontStyle: "italic", color: "#d8ccad" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.heading, fontWeight: "bold", color: "#d8ccad" },
  { tag: [t.atom, t.special(t.variableName)], color: "#d2a8ff" },
  { tag: [t.processingInstruction, t.string, t.inserted], color: "#12a85b" },
  { tag: t.invalid, color: "#f85149" },
]);

export const academyEditorTheme = [
  editorTheme,
  syntaxHighlighting(highlightStyle),
];
