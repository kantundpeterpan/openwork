/** @jsxImportSource react */
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, X } from "lucide-react";

import type { OpenworkServerClient } from "@/app/lib/openwork-server";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollAreaViewport } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { FileEditor } from "./file-editor";
import { FileTree } from "./file-tree";
import type { OpenworkWorkspaceFileListEntry } from "@/app/lib/openwork-server";

export type FileExplorerPanelProps = {
  client: OpenworkServerClient | null;
  workspaceId: string | null;
  workspaceRoot: string;
  onClose: () => void;
};

export function FileExplorerPanel({ client, workspaceId, workspaceRoot, onClose }: FileExplorerPanelProps) {
  const [entries, setEntries] = useState<OpenworkWorkspaceFileListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSelect = useCallback(
    async (path: string, kind: "file" | "dir") => {
      if (kind === "dir") return;
      if (!client || !workspaceId) return;

      setSelectedPath(path);
      setFileLoading(true);
      setError(null);
      setDirty(false);
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
              <TooltipTrigger asChild>
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
        <div className="w-48 shrink-0 border-r border-border">
          <ScrollArea className="h-full">
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

        <div className="flex min-w-0 flex-1 flex-col">
          {selectedPath ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-3 py-1">
                <span className="truncate text-xs text-muted-foreground">{fileName}</span>
                {dirty ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
              <div className="min-h-0 flex-1 overflow-hidden">
                {fileLoading ? (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading file...
                  </div>
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
