import {
  Button,
  type ButtonProps,
  Icon,
  Popover,
} from "@patternfly/react-core";
import type { PopoverProps } from "@patternfly/react-core/dist/js/components/Popover/Popover";
import type { SVGIconProps } from "@patternfly/react-icons/dist/js/createIcon";
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon";
import classNames from "classnames";
import React from "react";

type PopoverIconProps = PopoverProps & {
  variant?: ButtonProps["variant"];
  component?: ButtonProps["component"];
  IconComponent?: React.ComponentClass<SVGIconProps>;
  noVerticalAlign?: boolean;
  buttonClassName?: string;
  buttonOuiaId?: string;
  buttonStyle?: React.CSSProperties;
};

const PopoverIcon: React.FC<PopoverIconProps> = ({
  component,
  variant = "plain",
  IconComponent = OutlinedQuestionCircleIcon,
  noVerticalAlign = false,
  buttonClassName,
  buttonOuiaId,
  buttonStyle,
  ...props
}) => (
  <Popover {...props}>
    <Button
      icon={
        <Icon isInline={noVerticalAlign}>
          <IconComponent />
        </Icon>
      }
      component={component}
      variant={variant}
      onClick={(e) => e.preventDefault()}
      className={classNames(
        "pf-v6-c-form__group-label-help",
        "pf-v6-u-p-0",
        buttonClassName,
      )}
      ouiaId={buttonOuiaId}
      style={buttonStyle}
    />
  </Popover>
);

export default PopoverIcon;
