import React from "react";

export const addNotification = (
  notification: Record<string, unknown>,
): void => {
  console.warn("Notifications Mock: addNotification called", notification);
  alert(
    `Notification: ${notification.title}\n${
      notification.description || ""
    }\nType: ${notification.variant || "info"}`,
  );
};

export const notificationsReducer = (
  state: Record<string, unknown>,
  action: Record<string, unknown>,
): Record<string, unknown> => {
  console.warn("Notifications Mock: notificationsReducer called", action);
  return state;
};

export const connectNotification = (
  Component: React.ComponentType,
): React.FC<Record<string, unknown>> => {
  console.warn("Notifications Mock: connectNotification HOC applied");
  const WrappedComponent: React.FC<Record<string, unknown>> = (
    props,
  ): JSX.Element => {
    return <Component {...props} />;
  };
  return WrappedComponent;
};
