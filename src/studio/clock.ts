/**
 * The device's clock, read in one place: the works' screens are a connected
 * build, served by the works' own Adminium, and their job is to show what
 * the floor is doing now. Every reading is moved onto the server's clock by
 * the difference its config said (`AdminiumWorks.now`), so a device whose
 * clock is wrong still reads the works' day.
 */
export const deviceNow = (): number => Date.now();
