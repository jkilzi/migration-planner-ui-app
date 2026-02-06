export const capitalize = (str: string): string => {
  console.warn("Utilities Mock: capitalize called");
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const useSetPageTitle = (title: string): void => {
  console.warn("Utilities Mock: useSetPageTitle called with", title);
  if (typeof document !== "undefined") {
    document.title = title;
  }
};
