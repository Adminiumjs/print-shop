/**
 * The works' own settings (the manifest's `settings`, on the app's settings
 * page): the days it works and the time of day an order still starts that
 * day. Adminium reads both when it dates a job's ready-by (`ready_by` on each
 * job, `addWorkingDays`); the works' closures are a table of their own, and
 * how many working days a job takes is the rate card's (`settings` table).
 *
 * A week is a comma list of the days, Monday first: Marlow Press works Monday
 * to Friday. The cut-off is a 24-hour time: an order in before two o'clock on
 * a working day starts that day, one after starts the next.
 */
export const WORKING_DAYS = "working_days";
export const CUTOFF = "cutoff";

export const SETTINGS = [
  {
    key: WORKING_DAYS,
    type: "string",
    default: "mon,tue,wed,thu,fri",
    label: { key: "mft.printing.setting.workingDays", fallback: "Working days" },
    help: { key: "mft.printing.setting.workingDays.help", fallback: "The days the works prints, as a comma list: mon,tue,wed,thu,fri,sat,sun." },
  },
  {
    key: CUTOFF,
    type: "string",
    default: "14:00",
    label: { key: "mft.printing.setting.cutoff", fallback: "Orders start the same day before" },
    help: { key: "mft.printing.setting.cutoff.help", fallback: "A time on a 24-hour clock. An order placed after it starts on the next working day." },
  },
];
