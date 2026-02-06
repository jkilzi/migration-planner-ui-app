import { Button } from "@patternfly/react-core";
import { TimesIcon } from "@patternfly/react-icons";
import React from "react";

type Props = {
  label: string;
  onClear: () => void;
  ariaLabel?: string;
};

const FilterPill: React.FC<Props> = ({ label, onClear, ariaLabel }) => {
  return (
    <span
      style={{
        background: "#e7e7e7",
        borderRadius: "12px",
        padding: "2px 6px 2px 8px",
        fontSize: "12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span>{label}</span>
      <Button
        icon={<TimesIcon />}
        variant="plain"
        aria-label={ariaLabel || `Remove ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        style={{ padding: 0, height: "18px", width: "18px" }}
      />
    </span>
  );
};

FilterPill.displayName = "FilterPill";

export default FilterPill;
