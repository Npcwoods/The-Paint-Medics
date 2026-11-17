export const JOBS = [
  {
    id: "scratch",
    name: "Scratch & scuff",
    detail: "One panel. Clear-coat deep, or down to primer.",
    mobile: [189, 329],
    shop: [480, 820],
    time: "Same visit",
  },
  {
    id: "bumper",
    name: "Bumper respray",
    detail: "Cart rash and scuffs. We refinish the cover that’s on the car.",
    mobile: [279, 459],
    shop: [680, 1150],
    time: "One day",
  },
  {
    id: "panel",
    name: "Door or fender",
    detail: "Full panel, blended into the one beside it.",
    mobile: [359, 569],
    shop: [860, 1480],
    time: "One to two days",
  },
  {
    id: "wheels",
    name: "Wheel rash",
    detail: "Curb rash on the face and lip. The car stays put.",
    mobile: [139, 229],
    shop: [280, 460],
    time: "Same visit",
  },
  {
    id: "blend",
    name: "Two-panel blend",
    detail: "Color that has to travel. Matched, not patched.",
    mobile: [549, 890],
    shop: [1400, 2400],
    time: "Two days",
  },
] as const;

export type JobId = (typeof JOBS)[number]["id"];

export const VEHICLES = [
  { id: "car", name: "Car", factor: 1 },
  { id: "suv", name: "SUV", factor: 1.08 },
  { id: "truck", name: "Truck", factor: 1.12 },
  { id: "pearl", name: "Pearl / luxury", factor: 1.22 },
] as const;

export type VehicleId = (typeof VEHICLES)[number]["id"];

export function scaleRange(range: readonly [number, number], factor: number): [number, number] {
  const round = (n: number) => Math.round((n * factor) / 10) * 10;
  return [round(range[0]), round(range[1])];
}

export function midpoint(range: readonly [number, number]) {
  return Math.round((range[0] + range[1]) / 2);
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export type SavedQuote = {
  ref: string;
  jobId: JobId;
  jobName: string;
  vehicleName: string;
  mobile: [number, number];
  shop: [number, number];
  name: string;
  phone: string;
  zip: string;
  ride: string;
  note: string;
  at: string;
};

export const STORAGE_KEY = "paint-medics-quotes";
