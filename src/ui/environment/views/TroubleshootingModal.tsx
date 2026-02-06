import "github-markdown-css/github-markdown.css";

import { Spinner } from "@patternfly/react-core";
import { Modal } from "@patternfly/react-core/deprecated";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAsync } from "react-use";

const syntaxTheme = oneDark as unknown as {
  [key: string]: React.CSSProperties;
};

export const TroubleshootingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const state = useAsync(async () => {
    if (!isOpen) return undefined;
    const res = await fetch(
      "https://raw.githubusercontent.com/kubev2v/migration-planner/main/doc/troubleshooting.md",
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
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
        {state.error && (
          <div>
            Failed to load troubleshooting content: {state.error.message}
          </div>
        )}
        {state.loading && <Spinner />}
        {state.value && (
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
            {state.value}
          </ReactMarkdown>
        )}
      </div>
    </Modal>
  );
};
