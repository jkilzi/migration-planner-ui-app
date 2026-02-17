import { List, ListItem, OrderType } from "@patternfly/react-core";
import React from "react";

export type InstructionItem = {
  text: React.ReactNode;
};

export type InstructionsListProps = {
  /** Array of instruction items to display in the numbered list */
  items: InstructionItem[];
};

export const InstructionsList: React.FC<InstructionsListProps> = ({
  items,
}) => {
  return (
    <List component="ol" type={OrderType.number}>
      {items.map((item, index) => (
        <ListItem key={index}>{item.text}</ListItem>
      ))}
    </List>
  );
};

InstructionsList.displayName = "InstructionsList";
