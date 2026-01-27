import React from "react";

export const PageHeader: React.FC<
  React.PropsWithChildren<Record<string, unknown>>
> = ({ children, ...props }): JSX.Element => {
  console.warn("FrontendComponents Mock: PageHeader rendered");
  return (
    <div
      style={{
        padding: "15px",
        borderBottom: "1px solid #ddd",
        background: "#f8f8f8",
      }}
      {...props}
    >
      <h3>
        Mock Page Header (from @redhat-cloud-services/frontend-components)
      </h3>
      {children}
    </div>
  );
};

export const PageHeaderTitle: React.FC<
  React.PropsWithChildren<Record<string, unknown>>
> = ({ children, ...props }): JSX.Element => {
  console.warn("FrontendComponents Mock: PageHeaderTitle rendered");
  return <h1 {...props}>{children}</h1>;
};

// Mock for InvalidObject
export const InvalidObject: React.FC<
  React.PropsWithChildren<Record<string, unknown>>
> = ({ children, ...props }): JSX.Element => {
  console.warn("FrontendComponents Mock: InvalidObject rendered");
  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #c9190b",
        background: "#fafafa",
      }}
      {...props}
    >
      <h4>Mock Invalid Object</h4>
      <p>This is a mock for the InvalidObject component.</p>
      {children}
    </div>
  );
};
