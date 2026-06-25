/** @jsxImportSource react */
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Loader2, PanelLeftClose, PanelLeftOpen, Pencil, RefreshCw, Save, X } from "lucide-react";

import type { OpenworkServerClient } from "@/app/lib/openwork-server";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollAreaViewport } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { FileEditor, isImageFile, isPdfFile } from "./file-editor";
import { FileTree } from "./file-tree";
import { MarkdownPreview } from "../artifacts/preview";
import type { OpenworkWorkspaceFileListEntry } from "@/app/lib/openwork-server";

const EXPLORER_STORAGE_KEY = "openwork:file-explorer:v1";

type ExplorerPersistedState = {
  selectedPath: string | null;
  treeCollapsed: boolean;
};

function readExplorerState(): ExplorerPersistedState {
  if (typeof window === "undefined") return { selectedPath: null, treeCollapsed: false };
  try {
    const raw = localStorage.getItem(EXPLORER_STORAGE_KEY);
    if (!raw) return { selectedPath: null, treeCollapsed: false };
    return JSON.parse(raw);
  } catch {
    return { selectedPath: null, treeCollapsed: false };
  }
}

function persistExplorerState(state: ExplorerPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXPLORER_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export type FileExplorerPanelProps = {
  client: OpenworkServerClient | null;
  workspaceId: string | null;
  workspaceRoot: string;
  onClose: () => void;
};

export function FileExplorerPanel({ client, workspaceId, workspaceRoot, onClose }: FileExplorerPanelProps) {
  const [entries, setEntries] = useState<OpenworkWorkspaceFileListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(() => readExplorerState().selectedPath);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeCollapsed, setTreeCollapsed] = useState(() => readExplorerState().treeCollapsed);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileUrlType, setFileUrlType] = useState<"image" | "pdf" | null>(null);
  const [preview, setPreview] = useState(true);
  const prevSelectedPathRef = useRef<string | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  const isMarkdownFile = selectedPath ? /\.(md|mdx|markdown|rmd|qmd)$/i.test(selectedPath) : false;

  useEffect(() => {
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, []);

  const setFileUrlSafe = useCallback((url: string | null, type: "image" | "pdf" | null) => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
    }
    fileUrlRef.current = url;
    setFileUrl(url);
    setFileUrlType(type);
  }, []);

  const downloadBinary = useCallback(async (path: string, mimeFallback: string): Promise<Blob> => {
    if (!client || !workspaceId) throw new Error("No client");
    const result = await client.downloadWorkspaceFile(workspaceId, path);
    return new Blob([result.data], { type: result.contentType ?? mimeFallback });
  }, [client, workspaceId]);

  const loadFiles = useCallback(async () => {
    if (!client || !workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await client.listWorkspaceFiles(workspaceId);
      setEntries(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list files");
    } finally {
      setLoading(false);
    }
  }, [client, workspaceId]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    persistExplorerState({ selectedPath, treeCollapsed });
    if (selectedPath) prevSelectedPathRef.current = selectedPath;
  }, [selectedPath, treeCollapsed]);

  const handleSelect = useCallback(
    async (path: string, kind: "file" | "dir") => {
      if (kind === "dir") return;
      if (!client || !workspaceId) return;

      setSelectedPath(path);
      setFileUrlSafe(null, null);
      setPreview(true);
      setFileLoading(true);
      setError(null);
      setDirty(false);

      if (isImageFile(path)) {
        try {
          const blob = await downloadBinary(path, "image/png");
          setFileUrlSafe(URL.createObjectURL(blob), "image");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load image");
        } finally {
          setFileLoading(false);
        }
        return;
      }

      if (isPdfFile(path)) {
        try {
          const blob = await downloadBinary(path, "application/pdf");
          setFileUrlSafe(URL.createObjectURL(blob), "pdf");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        } finally {
          setFileLoading(false);
        }
        return;
      }

      try {
        const result = await client.readWorkspaceFile(workspaceId, path);
        setFileContent(result.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
        setFileContent("");
      } finally {
        setFileLoading(false);
      }
    },
    [client, workspaceId],
  );

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    if (entries.length === 0 || !selectedPath) return;
    initialLoadDoneRef.current = true;
    void handleSelect(selectedPath, "file");
  }, [entries, selectedPath, handleSelect]);

  const handleSave = useCallback(async () => {
    if (!client || !workspaceId || !selectedPath) return;
    setSaving(true);
    setError(null);
    try {
      await client.writeWorkspaceFile(workspaceId, { path: selectedPath, content: fileContent });
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  }, [client, workspaceId, selectedPath, fileContent]);

  const handleContentChange = useCallback((value: string) => {
    setFileContent(value);
    setDirty(true);
  }, []);

  const fileName = selectedPath?.split("/").pop() ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Files</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6"
                  onClick={() => void loadFiles()}
                  disabled={loading}
                >
                  <RefreshCw className={cn("size-3", loading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh files</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button variant="ghost" size="icon-sm" className="size-6" onClick={onClose}>
          <X className="size-3" />
        </Button>
      </div>

      {error ? (
        <div className="px-3 py-2 text-xs text-destructive">{error}</div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {treeCollapsed ? (
          <div className="flex flex-col border-r border-border">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6 m-1"
              onClick={() => setTreeCollapsed(false)}
              title="Show file tree"
            >
              <PanelLeftOpen className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="w-48 shrink-0 border-r border-border">
            <div className="flex items-center justify-end px-1 py-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-5"
                onClick={() => setTreeCollapsed(true)}
                title="Hide file tree"
              >
                <PanelLeftClose className="size-3" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-24px)]">
              <ScrollAreaViewport>
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <FileTree
                    entries={entries}
                    selectedPath={selectedPath}
                    onSelect={handleSelect}
                  />
                )}
              </ScrollAreaViewport>
            </ScrollArea>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {selectedPath ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-3 py-1">
                <span className="truncate text-xs text-muted-foreground">{fileName}</span>
                <div className="flex items-center gap-1">
                  {isMarkdownFile ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6"
                            onClick={() => setPreview((p) => !p)}
                          >
                            {preview ? <Pencil className="size-3" /> : <Eye className="size-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{preview ? "Edit source" : "Preview rendered"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                  {dirty ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() => void handleSave()}
                          disabled={saving}
                        >
                          <Save className={cn("size-3", saving && "animate-pulse")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  ) : null}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {fileLoading ? (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading file...
                  </div>
                ) : fileUrl && fileUrlType === "image" ? (
                  <div className="flex h-full items-center justify-center overflow-auto bg-muted/30 p-3">
                    <img src={fileUrl} alt={fileName} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : fileUrl && fileUrlType === "pdf" ? (
                  <embed src={fileUrl} type="application/pdf" className="h-full w-full" />
                ) : isMarkdownFile && preview ? (
                  <MarkdownPreview content={fileContent} />
                ) : (
                  <FileEditor
                    value={fileContent}
                    filePath={selectedPath}
                    onChange={handleContentChange}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Select a file to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
