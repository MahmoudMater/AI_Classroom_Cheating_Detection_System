"use client"

import { useState } from "react"

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "python" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ position: "relative", margin: "1rem 0" }}>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 8, right: 10, zIndex: 2,
          background: copied ? "#22c55e22" : "#ffffff12",
          border: `1px solid ${copied ? "#22c55e66" : "#ffffff22"}`,
          color: copied ? "#22c55e" : "#94a3b8",
          fontSize: 11, padding: "3px 10px", borderRadius: 4,
          cursor: "pointer", fontFamily: "monospace",
          transition: "all 0.2s",
        }}
      >
        {copied ? "✓ copied" : "copy"}
      </button>
      <pre style={{
        background: "#0d1117",
        border: "1px solid #21262d",
        borderRadius: 8,
        padding: "1.2rem 1.4rem",
        overflowX: "auto",
        fontSize: 12.5,
        lineHeight: 1.7,
        color: "#e6edf3",
        margin: 0,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}