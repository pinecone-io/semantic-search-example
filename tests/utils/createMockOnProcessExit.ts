import { vitest } from "vitest";

export const createMockOnProcessExit = () => {
  return vitest.spyOn(process, "exit").mockImplementation((number) => {
    throw new Error("process.exit: " + number);
  });
};
