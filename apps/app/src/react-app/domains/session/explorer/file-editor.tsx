/** @jsxImportSource react */
import { useEffect, useMemo, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { sql } from "@codemirror/lang-sql";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { go } from "@codemirror/lang-go";
import { sass } from "@codemirror/lang-sass";
import { less } from "@codemirror/lang-less";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState, StateEffect, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { cn } from "@/lib/utils";

const editorTheme = EditorView.theme({
  "&": { height: "100%", background: "transparent" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  ".cm-content": { minHeight: "100%", padding: "12px 0", fontSize: "12px", lineHeight: "20px" },
  ".cm-cursor": { borderLeftColor: "hsl(var(--foreground))" },
  ".cm-cursor-secondary": { borderLeftColor: "hsl(var(--foreground))" },
  ".cm-selectionBackground": { background: "hsl(var(--muted))" },
  "&.cm-focused .cm-selectionBackground": { background: "hsl(var(--primary) / 0.3)" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "hsl(var(--foreground))" },
  ".cm-gutters": { background: "transparent", borderRight: "1px solid hsl(var(--border))" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px", color: "hsl(var(--muted-foreground))" },
  ".cm-activeLine": { backgroundColor: "hsl(var(--muted) / 0.35)" },
  ".cm-activeLineGutter": { backgroundColor: "hsl(var(--muted) / 0.35)" },
});

const syntaxStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#ff79c6" },
    { tag: tags.comment, color: "#6272a4", fontStyle: "italic" },
    { tag: tags.string, color: "#f1fa8c" },
    { tag: tags.number, color: "#bd93f9" },
    { tag: tags.bool, color: "#bd93f9" },
    { tag: tags.regexp, color: "#f1fa8c" },
    { tag: tags.typeName, color: "#8be9fd" },
    { tag: tags.tagName, color: "#ff79c6" },
    { tag: tags.attributeName, color: "#50fa7b" },
    { tag: tags.propertyName, color: "#66d9ef" },
    { tag: tags.variableName, color: "#f8f8f2" },
    { tag: tags.definition(tags.variableName), color: "#50fa7b" },
    { tag: tags.function(tags.variableName), color: "#66d9ef" },
    { tag: tags.className, color: "#8be9fd" },
    { tag: tags.labelName, color: "#66d9ef" },
    { tag: tags.operator, color: "#ff79c6" },
    { tag: tags.punctuation, color: "#6272a4" },
    { tag: tags.bracket, color: "#6272a4" },
    { tag: tags.meta, color: "#6272a4" },
    { tag: tags.link, color: "#8be9fd", textDecoration: "underline" },
    { tag: tags.heading, color: "#ff79c6", fontWeight: "600" },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.quote, color: "#6272a4", fontStyle: "italic" },
    { tag: tags.deleted, color: "#ff5555" },
    { tag: tags.inserted, color: "#50fa7b" },
    { tag: tags.invalid, color: "#ff5555" },
  ]),
);

export type FileEditorProps = {
  className?: string;
  value: string;
  filePath: string;
  onChange: (value: string) => void;
};

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "avif",
]);
const PDF_EXTENSIONS = new Set(["pdf"]);

export function isImageFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

export function isPdfFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return PDF_EXTENSIONS.has(ext);
}

function languageExtensionForPath(filePath: string): Extension {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "js": case "mjs": case "cjs": case "ts": case "tsx": case "jsx":
      return javascript({ typescript: ext === "ts" || ext === "tsx", jsx: ext === "tsx" || ext === "jsx" });
    case "json": case "jsonc": case "jsonl":
      return json();
    case "html": case "htm": case "xhtml":
      return html();
    case "css":
      return css();
    case "scss":
      return sass();
    case "less":
      return less();
    case "md": case "mdx": case "markdown": case "rmd": case "qmd":
      return markdown();
    case "py": case "pyw": case "pyx":
      return python();
    case "r": case "R":
      return [];
    case "yaml": case "yml":
      return yaml();
    case "xml": case "svg": case "xsl": case "xsd":
      return xml();
    case "toml":
      return [];
    case "sql":
      return sql();
    case "rs":
      return rust();
    case "java": case "jsp":
      return java();
    case "c": case "cpp": case "cxx": case "h": case "hpp": case "hxx": case "cc": case "c++":
      return cpp();
    case "php": case "phtml": case "php3": case "php4": case "php5": case "phps":
      return php();
    case "go":
      return go();
    case "sh": case "bash": case "zsh": case "fish": case "ps1": case "bat": case "cmd":
    case "ksh": case "csh":
      return [];
    case "rb": case "erb":
      return [];
    case "swift":
      return [];
    case "kt": case "kts":
      return [];
    case "dart":
      return [];
    case "lua":
      return [];
    case "pl": case "pm": case "t":
      return [];
    case "ex": case "exs":
      return [];
    case "clj": case "cljs": case "cljc": case "edn":
      return [];
    case "erl": case "hrl":
      return [];
    case "hs": case "lhs":
      return [];
    case "scala": case "sc":
      return [];
    case "groovy": case "gvy": case "gy": case "gsh":
      return [];
    case "cs": case "csx":
      return [];
    case "fs": case "fsx":
      return [];
    case "zig":
      return [];
    case "nim":
      return [];
    case "tex": case "sty": case "cls": case "bib":
      return [];
    case "rst":
      return [];
    case "adoc": case "asciidoc":
      return [];
    case "org":
      return [];
    case "ini": case "cfg": case "conf":
      return [];
    case "env":
      return [];
    case "gitignore": case "gitattributes": case "gitmodules":
      return [];
    case "editorconfig":
      return [];
    case "dockerfile": case "Dockerfile":
      return [];
    case "makefile": case "Makefile": case "make":
      return [];
    case "cmake":
      return [];
    case "gradle":
      return [];
    case "tf": case "tfvars": case "tfstate": case "hcl":
      return [];
    case "bzl":
      return [];
    case "nix":
      return [];
    case "lock":
      return [];
    case "properties": case "prop":
      return [];
    case "csv": case "tsv":
      return [];
    case "diff": case "patch":
      return [];
    case "drawio": case "dio":
      return [];
    case "ipynb":
      return json();
    default:
      return [];
  }
}

export function FileEditor(props: FileEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(props.onChange);
  const langExtension = useMemo(() => languageExtensionForPath(props.filePath), [props.filePath]);

  useEffect(() => {
    onChangeRef.current = props.onChange;
  }, [props.onChange]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const view = new EditorView({
      parent: root,
      state: EditorState.create({
        doc: props.value,
        extensions: [
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          langExtension,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          editorTheme,
          syntaxStyle,
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current === props.value) return;

    view.dispatch({ changes: { from: 0, to: current.length, insert: props.value } });
  }, [props.value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: StateEffect.reconfigure.of([
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        langExtension,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        editorTheme,
        syntaxStyle,
      ]),
    });
  }, [langExtension]);

  return <div ref={rootRef} className={cn("h-full min-h-0 overflow-hidden", props.className)} />;
}
