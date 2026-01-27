/* eslint-disable */
import { useEffect } from "react";

export const useChrome = (): Record<string, unknown> => {
  useEffect(() => {
    if (
      (window as Record<string, any>).insights &&
      (window as Record<string, any>).insights.chrome
    ) {
      (window as Record<string, any>).insights.chrome.init();
      (window as Record<string, any>).insights.chrome.identifyApp(
        "assisted-migration-app",
      ); // Your appname from package.json
    }
  }, []);

  return (window as Record<string, any>).insights
    ? (window as Record<string, any>).insights.chrome
    : {};
};
/* eslint-enable */
