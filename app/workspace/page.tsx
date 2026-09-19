"use client";

import { useRef, useState } from "react";
import { useUltronChat } from "@/lib/useUltronChat";

interface WorkspaceFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function WorkspacePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [tools, setTools] = useState({
    fileSystem: true,
    webSearch: true,
    vectorMemory: true,
  });
  const { messages, input, setInput, isLoading, handleSend, messagesEndRef } =
    useUltronChat();

  const addFiles = (selectedFiles: File[]) => {
    setFiles((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || "Unknown type",
      })),
    ]);
  };

  const toggleTool = (tool: keyof typeof tools) => {
    setTools((current) => ({ ...current, [tool]: !current[tool] }));
  };

  return (
    <main className="workspace-shell h-screen w-screen p-6 pt-20 bg-black flex gap-6 text-amber-500 font-mono min-h-0 overflow-hidden">
      <section className="workspace-panel workspace-canvas border border-amber-500/40 rounded-lg bg-black/90 backdrop-blur-xl p-4 flex flex-col gap-4 min-h-0 overflow-y-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <header className="workspace-panel-header">[ MULTIMODAL CANVAS &amp; TOOLS ]</header>

        <div
          className={`workspace-dropzone border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-black/40 transition-colors ${isDragging ? "workspace-dropzone-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            ref={fileInputRef}
            className="workspace-file-input"
            type="file"
            multiple
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <span className="workspace-upload-icon" aria-hidden="true">⇧</span>
          <span>Drag files here or click to browse</span>
          <small>Multimodal indexing ready</small>
        </div>

        <div className="workspace-file-list" aria-live="polite">
          {files.length === 0 ? (
            <p>[ NO FILES IN THE ACTIVE CONTEXT ]</p>
          ) : (
            files.map((file) => (
              <article className="workspace-file-item" key={file.id}>
                <div>
                  <strong>{file.name}</strong>
                  <span>{file.size} · {file.type}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter(({ id }) => id !== file.id))}
                >
                  ✕
                </button>
              </article>
            ))
          )}
        </div>

        <div className="workspace-tools" aria-label="Available agent tools">
          {(
            [
              ["fileSystem", "File System Access"],
              ["webSearch", "Web Search"],
              ["vectorMemory", "Vector Memory"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={tools[key]}
              className={`workspace-tool-chip ${tools[key] ? "workspace-tool-chip-active" : ""}`}
              onClick={() => toggleTool(key)}
            >
              [{tools[key] ? "x" : " "}] {label}
            </button>
          ))}
        </div>
      </section>

      <section className="workspace-panel workspace-thread border border-amber-500/40 rounded-lg bg-black/90 backdrop-blur-xl p-4 flex flex-col min-h-0 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <header className="workspace-panel-header">[ ULTRON AGENT THREAD ]</header>

        <div className="workspace-messages flex-1 min-h-0 overflow-y-auto space-y-3 p-2 bg-black/40 rounded border border-amber-500/20 my-2">
          {messages.map((message, index) => (
            <article className={`workspace-message workspace-message-${message.role}`} key={`${message.role}-${index}`}>
              <span>{message.role === "user" ? "> USER" : "[ ULTRON CORE ]"}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {isLoading && <p className="workspace-thinking">ANALYZING DIRECTIVE...</p>}
          <div ref={messagesEndRef} />
        </div>

        <form className="workspace-input-bar flex gap-2 p-2 border-t border-amber-500/40 bg-black/90" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            disabled={isLoading}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a workspace directive..."
            className="bg-black/60 border border-amber-500/40 rounded px-3 py-1.5 text-xs text-amber-300 placeholder-amber-500/40 focus:outline-none focus:border-amber-400 flex-1"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/60 text-amber-300 text-xs px-4 py-1.5 rounded transition-all"
          >
            SEND
          </button>
        </form>
      </section>
    </main>
  );
}
