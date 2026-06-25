/** @jsxImportSource react */
import { useMemo } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { OpenworkWorkspaceFileListEntry } from "@/app/lib/openwork-server";

type TreeNode = {
  name: string;
  path: string;
  kind: "file" | "dir";
  children: TreeNode[];
};

function buildTree(entries: OpenworkWorkspaceFileListEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap = new Map<string, TreeNode>();

  const sorted = [...entries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const entry of sorted) {
    const parts = entry.path.split("/");
    const name = parts[parts.length - 1];
    const node: TreeNode = { name, path: entry.path, kind: entry.kind, children: [] };

    if (parts.length === 1) {
      root.push(node);
      if (entry.kind === "dir") dirMap.set(entry.path, node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = dirMap.get(parentPath);
      if (parent) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
      if (entry.kind === "dir") dirMap.set(entry.path, node);
    }
  }

  return root;
}

export type FileTreeProps = {
  entries: OpenworkWorkspaceFileListEntry[];
  selectedPath: string | null;
  onSelect: (path: string, kind: "file" | "dir") => void;
  className?: string;
};

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string, kind: "file" | "dir") => void;
}) {
  const isSelected = selectedPath === node.path;
  const isDir = node.kind === "dir";

  if (isDir) {
    return (
      <Collapsible>
        <CollapsibleTrigger
          className={cn(
            "group flex w-full items-center gap-1 px-2 py-0.5 text-left text-xs hover:bg-muted/50 rounded-sm",
            isSelected && "bg-muted",
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => onSelect(node.path, "dir")}
        >
          <ChevronRight className="size-3 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90" />
          {node.children.length > 0 ? (
            <FolderOpen className="size-3.5 shrink-0 text-muted-foreground hidden group-data-[panel-open]:block" />
          ) : null}
          <Folder className={cn("size-3.5 shrink-0 text-muted-foreground", node.children.length > 0 && "group-data-[panel-open]:hidden")} />
          <span className="truncate">{node.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1 px-2 py-0.5 text-left text-xs hover:bg-muted/50 rounded-sm",
        isSelected && "bg-muted",
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={() => onSelect(node.path, "file")}
    >
      <span className="w-3 shrink-0" />
      <File className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ entries, selectedPath, onSelect, className }: FileTreeProps) {
  const tree = useMemo(() => buildTree(entries), [entries]);

  return (
    <div className={cn("py-1", className)}>
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
      {tree.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-muted-foreground">No files found</p>
      ) : null}
    </div>
  );
}
