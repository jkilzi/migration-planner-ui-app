import {
  AlertGroup,
  Breadcrumb,
  BreadcrumbItem,
  type BreadcrumbItemProps,
  Content,
  Divider,
  Flex,
  FlexItem,
  PageBreadcrumb,
  PageSection,
  Stack,
} from "@patternfly/react-core";
import {
  PageHeader,
  PageHeaderTitle,
} from "@redhat-cloud-services/frontend-components/PageHeader";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AppPage {
  export type Props = {
    title: React.ReactNode;
    caption?: React.ReactNode;
    breadcrumbs?: Array<BreadcrumbItemProps>;
    headerActions?: React.ReactNode;
    alerts?: React.ReactNode;
  };
}

export const AppPage: React.FC<React.PropsWithChildren<AppPage.Props>> = (
  props,
) => {
  const { title, caption, breadcrumbs, children, headerActions, alerts } =
    props;

  return (
    <div>
      <div id="base-page__header">
        <PageBreadcrumb hasBodyWrapper={false}>
          <Breadcrumb>
            {breadcrumbs?.map(({ key, children, ...bcProps }) => (
              <BreadcrumbItem key={key} {...bcProps}>
                {children}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </PageBreadcrumb>
        <PageHeader>
          <Stack>
            <Flex justifyContent={{ default: "justifyContentCenter" }}>
              <PageHeaderTitle title={title} />
              {React.Children.map(headerActions, (action, index) => (
                <FlexItem
                  {...(index === 0
                    ? { align: { default: "alignRight" } }
                    : null)}
                >
                  {action}
                </FlexItem>
              ))}
            </Flex>
            <Content>{caption}</Content>
            {alerts && <AlertGroup>{alerts}</AlertGroup>}
          </Stack>
        </PageHeader>
        <Divider />
      </div>
      <PageSection hasBodyWrapper={false}>{children}</PageSection>
    </div>
  );
};
AppPage.displayName = "AppPage";
