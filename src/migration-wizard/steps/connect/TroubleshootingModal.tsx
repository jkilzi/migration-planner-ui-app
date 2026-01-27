import "github-markdown-css/github-markdown.css";

import { Modal, Spinner } from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const syntaxTheme = oneDark as unknown as {
  [key: string]: React.CSSProperties;
};

export const TroubleshootingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(
        "https://raw.githubusercontent.com/kubev2v/migration-planner/main/doc/troubleshooting.md",
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.text();
        })
        .then(setMarkdown)
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(`Failed to load troubleshooting content: ${message}`);
        });
    }
  }, [isOpen]);

  return (
    <Modal
      title="Troubleshooting - VM not showing up?"
      isOpen={isOpen}
      onClose={onClose}
      variant="large"
    >
      <div
        className="markdown-body"
        style={{ maxHeight: "70vh", overflowY: "auto", padding: "1rem" }}
      >
        {error && <div>{error}</div>}
        {!markdown && !error && <Spinner />}
        {markdown && (
          <ReactMarkdown
            components={{
              code({ className, children, style: _, ref: __, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const content = Array.isArray(children)
                  ? children.join("")
                  : children;
                const text =
                  typeof content === "string" || typeof content === "number"
                    ? String(content)
                    : "";
                return match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    style={
                      syntaxTheme as unknown as {
                        [key: string]: React.CSSProperties;
                      }
                    }
                  >
                    {text.replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        )}
      </div>
    </Modal>
  );
};
