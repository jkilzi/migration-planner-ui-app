import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReportTable {
  export type Props<DataList extends Array<unknown>> = {
    columns: string[];
    data: DataList;
    fields: Array<keyof DataList[0]>;
    style?: React.CSSProperties;
    withoutBorder?: boolean;
    caption?: string;
  };
}

export function ReportTable<DataItem>(
  props: ReportTable.Props<DataItem[]>,
): React.ReactNode {
  const { columns, data, fields, style, caption, withoutBorder } = props;
  const cols = Array.isArray(columns) ? columns : [];
  const rows = Array.isArray(data) ? data : [];
  const flds = Array.isArray(fields) ? fields : [];
  const noBorder = Boolean(withoutBorder);

  return (
    <Table
      variant="compact"
      borders={true}
      style={{
        border: noBorder ? "none" : "1px solid lightgray",
        borderRight: "none",
        ...style,
      }}
    >
      {caption && (
        <caption
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            textAlign: "left",
            padding: "8px 16px",
            color: "#151515",
          }}
        >
          {caption}
        </caption>
      )}
      <Thead>
        <Tr style={{ border: noBorder ? "none" : "1px solid lightgray" }}>
          {cols.map((name, index) => (
            <Th
              key={index}
              hasRightBorder={!noBorder}
              style={{
                whiteSpace: "normal",
                wordBreak: "break-word",
                border: noBorder ? "none" : "1px solid lightgray",
              }}
            >
              {name}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((item, idx) => (
          <Tr
            key={idx}
            style={{
              width: 100,
              border: noBorder ? "none" : "1px solid lightgray",
            }}
          >
            {flds.map((f, fieldIdx) => (
              <Td key={fieldIdx} hasRightBorder={!noBorder}>
                {" "}
                {item?.[f] === "" || item?.[f] === undefined
                  ? "-"
                  : typeof item?.[f] === "boolean"
                    ? (item?.[f] as boolean)
                      ? "True"
                      : "False"
                    : (item?.[f] as React.ReactNode)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

ReportTable.displayName = "ReportTable";
