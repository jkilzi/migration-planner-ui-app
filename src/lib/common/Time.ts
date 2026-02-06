export const Time = {
  Millisecond: 1,
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Week: 7 * 24 * 60 * 60 * 1000,
} as const;
export type Time = (typeof Time)[keyof typeof Time];

export const sleep = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
