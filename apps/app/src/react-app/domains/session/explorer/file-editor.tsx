/** @jsxImportSource react */
import { useEffect, useMemo, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { type Extension } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { cn } from "@/lib/utils";

export type FileEditorProps = {
  className?: string;
  value: string;
  filePath: string;
  onChange: (value: string) => void;
};

function languageExtensionForPath(filePath: string): Extension {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "js":
    case "mjs":
    case "cjs":
    case "ts":
    case "tsx":
    case "jsx":
      return javascript({ typescript: ext === "ts" || ext === "tsx", jsx: ext === "tsx" || ext === "jsx" });
    case "json":
    case "jsonc":
      return javascript();
    case "html":
    case "htm":
      return html();
    case "css":
    case "scss":
    case "less":
      return css();
    case "md":
    case "mdx":
    case "markdown":
      return markdown();
    case "py":
      return [];
    case "yaml":
    case "yml":
      return [];
    case "xml":
      return html();
    case "toml":
      return [];
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
          EditorView.theme({
            "&": { height: "100%", background: "transparent" },
            ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
            ".cm-content": { minHeight: "100%", padding: "12px 0", fontSize: "12px", lineHeight: "20px" },
            ".cm-gutters": { background: "transparent", borderRight: "1px solid hsl(var(--border))" },
            ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px", color: "hsl(var(--muted-foreground))" },
            ".cm-activeLine": { backgroundColor: "hsl(var(--muted) / 0.35)" },
            ".cm-activeLineGutter": { backgroundColor: "hsl(var(--muted) / 0.35)" },
          }),
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
      effects: EditorState.reconfigure.of([
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
        EditorView.theme({
          "&": { height: "100%", background: "transparent" },
          ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
          ".cm-content": { minHeight: "100%", padding: "12px 0", fontSize: "12px", lineHeight: "20px" },
          ".cm-gutters": { background: "transparent", borderRight: "1px solid hsl(var(--border))" },
          ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px", color: "hsl(var(--muted-foreground))" },
          ".cm-activeLine": { backgroundColor: "hsl(var(--muted) / 0.35)" },
          ".cm-activeLineGutter": { backgroundColor: "hsl(var(--muted) / 0.35)" },
        }),
      ]),
    });
  }, [langExtension]);

  return <div ref={rootRef} className={cn("h-full min-h-0 overflow-hidden", props.className)} />;
}
