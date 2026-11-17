import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Menu, X } from "lucide-react";
import {
  JOBS,
  STORAGE_KEY,
  VEHICLES,
  midpoint,
  money,
  scaleRange,
  type JobId,
  type SavedQuote,
  type VehicleId,
} from "@/lib/jobs";
import logoB64 from "@/assets/logo.b64?raw";
import heroB64 from "@/assets/hero.b64?raw";
import keysB64 from "@/assets/keys.b64?raw";
import repairedB64 from "@/assets/repaired.b64?raw";
import scratchB64 from "@/assets/scratch.b64?raw";
import sprayB64 from "@/assets/spray.b64?raw";
import vanB64 from "@/assets/van.b64?raw";

const logo = dataUrl(logoB64);
const hero = dataUrl(heroB64);
const keys = dataUrl(keysB64);
const repaired = dataUrl(repairedB64);
const scratch = dataUrl(scratchB64);
const spray = dataUrl(sprayB64);
const van = dataUrl(vanB64);

function dataUrl(b64: string) {
  return `data:image/jpeg;base64,${b64.replace(/\s/g, "")}`;
}

const NAV = [
  { href: "#quote", label: "Price a panel" },
  { href: "#visit", label: "The visit" },
  { href: "#work", label: "The work" },
  { href: "#questions", label: "Questions" },
];

const SHOP_WAY = [
  "Tow it, or drive it in wounded.",
  "A rental, or a week of asking for rides.",
  "The estimate grows once it’s on the rack.",
  "You get it back when the shop is ready.",
];

const MEDIC_WAY = [
  "We come to where the car already is.",
  "You keep the keys.",
  "The ballpark is confirmed before anyone sprays.",
  "Most single panels happen while you’re at work.",
];

const STEPS = [
  {
    n: "01",
    title: "Show the damage",
    body: "A few photos and which panel. We’ll say if paint is the right fix — or if it needs metal work first.",
  },
  {
    n: "02",
    title: "We roll to the car",
    body: "Driveway, office lot, or dealer row. No tow. No loaner. No handing the car over for a week.",
  },
  {
    n: "03",
    title: "You drive it",
    body: "Mask, spray, clear. Most one-panel jobs are done the same visit. The car never left.",
  },
];

const QUESTIONS = [
  {
    q: "Do you paint the whole car?",
    a: "Panels, bumpers, and wheels are the work. A full respray is a different job — ask, and we’ll say plainly if we should take it.",
  },
  {
    q: "Is this a touch-up bottle?",
    a: "No. Base, clear, and a blend into the next panel when the color needs it. Not a pen from the parts counter.",
  },
  {
    q: "What about tri-coats and pearls?",
    a: "We flag them before we schedule. They cost more and take longer. The ranges on this page are for standard colors. Pearl and luxury is a separate toggle in the estimate.",
  },
  {
    q: "Do I have to stand there?",
    a: "Someone lets us to the car. After that, most people go back inside or to work. We don’t need the driveway to become a waiting room.",
  },
  {
    q: "Insurance?",
    a: "We can write the scope. A lot of driveway jobs cost less than a deductible, which is the point of skipping the shop.",
  },
  {
    q: "What if the weather turns?",
    a: "We watch the day. If humidity or rain would wreck the finish, the visit moves. We don’t spray into a storm to stay on schedule.",
  },
];

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function isQuote(value: unknown): value is SavedQuote {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<SavedQuote>;
  return typeof q.ref === "string" && typeof q.jobName === "string" && Array.isArray(q.mobile);
}

export function HomePage() {
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState<JobId>("scratch");
  const [vehicleId, setVehicleId] = useState<VehicleId>("car");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [ride, setRide] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<SavedQuote | null>(null);
  const [history, setHistory] = useState<SavedQuote[]>([]);
  const [copied, setCopied] = useState(false);
  const [split, setSplit] = useState(62);

  const job = JOBS.find((item) => item.id === jobId) ?? JOBS[0];
  const vehicle = VEHICLES.find((item) => item.id === vehicleId) ?? VEHICLES[0];

  const estimate = useMemo(() => {
    const mobile = scaleRange(job.mobile, vehicle.factor);
    const shop = scaleRange(job.shop, vehicle.factor);
    const save = Math.max(0, midpoint(shop) - midpoint(mobile));
    const pct = midpoint(shop) === 0 ? 0 : Math.round((save / midpoint(shop)) * 100);
    return { mobile, shop, save, pct };
  }, [job, vehicle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setHistory(parsed.filter(isQuote).slice(0, 6));
    } catch {
      /* ignore a bad local cache */
    }
  }, []);

  function quoteText(q: SavedQuote) {
    return [
      `The Paint Medics \u00b7 ${q.ref}`,
      `${q.jobName} \u00b7 ${q.vehicleName}`,
      q.ride ? `Vehicle: ${q.ride}` : "",
      `Driveway ballpark: ${money(q.mobile[0])}\u2013${money(q.mobile[1])}`,
      `Typical shop: ${money(q.shop[0])}\u2013${money(q.shop[1])}`,
      `ZIP ${q.zip}`,
      "Not a contract. A medic confirms color and access before anyone sprays.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function lockQuote(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Name, so we know who the car belongs to.";
    if (digits(phone).length < 10) nextErrors.phone = "A mobile number, 10 digits.";
    if (digits(zip).length < 5) nextErrors.zip = "ZIP, so we know the van can reach you.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const quote: SavedQuote = {
      ref: `TPM-${Math.floor(1000 + Math.random() * 9000)}`,
      jobId,
      jobName: job.name,
      vehicleName: vehicle.name,
      mobile: estimate.mobile,
      shop: estimate.shop,
      name: name.trim(),
      phone: digits(phone).slice(0, 10),
      zip: digits(zip).slice(0, 5),
      ride: ride.trim(),
      note: note.trim(),
      at: new Date().toISOString(),
    };
    const next = [quote, ...history].slice(0, 6);
    setHistory(next);
    setLocked(quote);
    setCopied(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* the quote still shows if storage is blocked */
    }
  }

  async function copyLocked() {
    if (!locked) return;
    try {
      await navigator.clipboard.writeText(quoteText(locked));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink text-chrome">
      <header className="sticky top-0 z-40 shrink-0 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-10 w-auto rounded-sm sm:h-11" />
            <span className="font-display text-xl tracking-wide sm:text-2xl">THE PAINT MEDICS</span>
          </a>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-steel hover:text-chrome">
                {item.label}
              </a>
            ))}
            <a
              href="#quote"
              className="inline-flex h-11 items-center rounded-full bg-red px-5 text-sm font-semibold text-chrome"
            >
              Get a ballpark
            </a>
          </nav>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? (
          <nav className="border-t border-line px-4 py-4 md:hidden" aria-label="Mobile">
            <div className="flex flex-col">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex h-12 items-center text-lg"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main id="top" className="flex flex-1 flex-col">
        <section className="bg-ink px-5 pt-6 pb-2">
          <img
            src={logo}
            alt="The Paint Medics. We bring the body shop to you."
            width={1500}
            height={1000}
            className="mx-auto w-full max-w-xl"
          />
        </section>

        <section className="relative flex min-h-[72svh] flex-1 flex-col justify-end">
          <img
            src={hero}
            alt="A painter masking a sedan door in a driveway, with the Paint Medics van behind the car."
            width={1792}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
          <div className="relative px-4 pt-10 pb-6">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-semibold tracking-widest text-red">MOBILE BODY PAINT</p>
              <h1 className="mt-2 max-w-3xl font-display text-5xl leading-none tracking-wide sm:text-6xl">
                The car stays. The shop bill doesn’t.
              </h1>
              <p className="mt-3 max-w-xl text-base sm:text-lg">
                Scratches, bumpers, panels, and wheels — painted where the car already sits.
                Usually well under a body-shop ticket, and you never hand over the keys for a week.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#quote"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-red px-6 font-semibold"
                >
                  See the driveway price
                </a>
                <a
                  href="#visit"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-chrome/40 px-6 font-semibold"
                >
                  How a visit works
                </a>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-chrome/20 pt-4">
                <Stat k="Typical save" v="40–55%" />
                <Stat k="You keep" v="The keys" />
                <Stat k="Most panels" v="One visit" />
              </dl>
            </div>
          </div>
        </section>

        <section id="quote" className="scroll-mt-20 border-t border-line bg-asphalt px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold tracking-widest text-red">THE MATH</p>
              <h2 className="mt-3 font-display text-5xl leading-none tracking-wide sm:text-6xl">
                Price it before the van rolls.
              </h2>
              <p className="mt-4 text-steel">
                Pick the job and the vehicle. The range is a driveway ballpark against what a
                traditional shop usually tickets for the same paint. Nothing is booked, and
                nothing is charged, until a medic confirms color and access.
              </p>
              <img
                src={keys}
                alt="Car keys in hand beside an open door, still in the driveway."
                width={1600}
                height={1200}
                className="mt-8 aspect-still w-full rounded-card object-cover"
              />
            </div>

            <div className="rounded-card border border-line bg-ink p-4 sm:p-6 lg:col-span-3">
              <fieldset>
                <legend className="text-sm font-semibold text-steel">What’s hurt</legend>
                <div className="mt-3 grid gap-2">
                  {JOBS.map((item) => {
                    const selected = item.id === jobId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setJobId(item.id)}
                        className={
                          "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left " +
                          (selected ? "border-red bg-panel" : "border-line bg-asphalt")
                        }
                      >
                        <span>
                          <span className="block font-semibold">{item.name}</span>
                          <span className="mt-1 block text-sm text-steel">{item.detail}</span>
                        </span>
                        <span className="shrink-0 text-sm text-steel">{item.time}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-steel">Vehicle</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {VEHICLES.map((item) => {
                    const selected = item.id === vehicleId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setVehicleId(item.id)}
                        className={
                          "h-12 rounded-xl border text-sm font-semibold " +
                          (selected ? "border-red bg-panel" : "border-line")
                        }
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <PriceCard label="Driveway" value={`${money(estimate.mobile[0])}–${money(estimate.mobile[1])}`} hot />
                <PriceCard label="Typical shop" value={`${money(estimate.shop[0])}–${money(estimate.shop[1])}`} />
                <PriceCard label="You skip about" value={money(estimate.save)} note={`${estimate.pct}% under the shop`} />
              </div>
              <p className="mt-3 text-sm text-steel">
                Standard colors. Tri-coats, rust, and plastic that needs welding get a firm number
                before we roll — not a surprise on the driveway.
              </p>

              {locked ? (
                <div className="mt-6 rounded-xl border border-red bg-panel p-5">
                  <p className="text-sm font-semibold tracking-widest text-red">BALLPARK ON THIS PHONE</p>
                  <p className="mt-2 font-display text-5xl tracking-wide">{locked.ref}</p>
                  <p className="mt-2 text-steel">
                    {locked.name}, this is a range for {locked.jobName.toLowerCase()} on a{" "}
                    {locked.vehicleName.toLowerCase()}
                    {locked.ride ? ` (${locked.ride})` : ""} in {locked.zip}. It is not a contract.
                    A medic still has to see the color and the panel.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a
                      className="inline-flex h-12 items-center justify-center rounded-full bg-red px-5 font-semibold"
                      href={`sms:?&body=${encodeURIComponent(quoteText(locked))}`}
                    >
                      Text this quote
                    </a>
                    <button
                      type="button"
                      onClick={copyLocked}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 font-semibold"
                    >
                      {copied ? "Copied" : "Copy the numbers"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocked(null)}
                      className="inline-flex h-12 items-center justify-center px-5 font-semibold text-steel"
                    >
                      Price another
                    </button>
                  </div>
                </div>
              ) : (
                <form className="mt-6 grid gap-3" onSubmit={lockQuote} noValidate>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      id="name"
                      label="Name"
                      value={name}
                      onChange={setName}
                      error={errors.name}
                      autoComplete="name"
                    />
                    <Field
                      id="phone"
                      label="Mobile"
                      value={phone}
                      onChange={setPhone}
                      error={errors.phone}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      id="zip"
                      label="ZIP"
                      value={zip}
                      onChange={setZip}
                      error={errors.zip}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                    <Field
                      id="ride"
                      label="Year, make, color"
                      value={ride}
                      onChange={setRide}
                      placeholder="2019 white Camry"
                    />
                  </div>
                  <label className="block text-sm font-semibold" htmlFor="note">
                    Anything we should know
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-line bg-asphalt px-4 py-3 font-normal text-chrome"
                      placeholder="Passenger door, keyed in a garage. Need it before Friday."
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-red px-6 font-semibold"
                  >
                    Lock this ballpark
                  </button>
                </form>
              )}

              {history.length > 0 ? (
                <div className="mt-6 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-steel">Saved on this phone</p>
                  <ul className="mt-2 grid gap-2">
                    {history.map((item) => (
                      <li key={item.ref} className="flex items-baseline justify-between gap-3 text-sm">
                        <span>
                          <span className="font-semibold">{item.ref}</span>
                          <span className="text-steel"> \u00b7 {item.jobName}</span>
                        </span>
                        <span className="tabular-nums text-steel">
                          {money(item.mobile[0])}–{money(item.mobile[1])}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="visit" className="scroll-mt-20 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold tracking-widest text-red">THE VISIT</p>
            <h2 className="mt-3 max-w-3xl font-display text-5xl leading-none tracking-wide sm:text-6xl">
              A body shop that drives to the driveway.
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-card border border-line bg-panel p-6">
                <h3 className="font-display text-3xl tracking-wide text-steel">Leave it at the shop</h3>
                <ul className="mt-4 grid gap-3">
                  {SHOP_WAY.map((line) => (
                    <li key={line} className="border-l border-line pl-4 text-steel">
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-card border border-red bg-ink p-6">
                <h3 className="font-display text-3xl tracking-wide">We come to the car</h3>
                <ul className="mt-4 grid gap-3">
                  {MEDIC_WAY.map((line) => (
                    <li key={line} className="border-l border-red pl-4">
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="rounded-card border border-line bg-asphalt p-6">
                  <p className="font-display text-4xl text-red">{step.n}</p>
                  <h3 className="mt-3 font-display text-3xl tracking-wide">{step.title}</h3>
                  <p className="mt-2 text-steel">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="work" className="scroll-mt-20 border-t border-line bg-asphalt px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold tracking-widest text-red">THE WORK</p>
            <h2 className="mt-3 max-w-3xl font-display text-5xl leading-none tracking-wide sm:text-6xl">
              Same panel. The scratch is gone.
            </h2>
            <p className="mt-4 max-w-xl text-steel">
              Drag the line. Left is the keyed door. Right is after base and clear — not a filter,
              the repair.
            </p>

            <figure className="mt-8">
              <div className="relative aspect-panel overflow-hidden rounded-card bg-ink">
                <img
                  src={repaired}
                  alt="The same green door after the scratch was painted out."
                  width={1728}
                  height={1152}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <img
                  src={scratch}
                  alt=""
                  width={1728}
                  height={1152}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-chrome"
                  style={{ left: `${split}%` }}
                />
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold tracking-widest">
                  BEFORE
                </span>
                <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold tracking-widest">
                  AFTER
                </span>
              </div>
              <label className="mt-4 block text-sm font-semibold text-steel" htmlFor="split">
                Compare the scratch and the repair
                <input
                  id="split"
                  className="compare-range"
                  type="range"
                  min={8}
                  max={92}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                />
              </label>
            </figure>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <figure className="overflow-hidden rounded-card border border-line">
                <img
                  src={spray}
                  alt="A painter spraying a bumper in a driveway, not inside a shop."
                  width={1600}
                  height={1200}
                  className="aspect-still w-full object-cover"
                />
                <figcaption className="bg-ink p-5">
                  <h3 className="font-display text-3xl tracking-wide">The bumper stays on the car</h3>
                  <p className="mt-2 text-steel">
                    Cart rash doesn’t always mean a new cover from the dealer. If the plastic is
                    sound, we refinish it where it sits.
                  </p>
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-card border border-line">
                <img
                  src={van}
                  alt="The graphite Paint Medics van with a red cross, parked and ready."
                  width={1728}
                  height={1152}
                  className="aspect-still w-full object-cover"
                />
                <figcaption className="bg-ink p-5">
                  <h3 className="font-display text-3xl tracking-wide">The rig comes to you</h3>
                  <p className="mt-2 text-steel">
                    Tape, gun, and a matched mix. Office lots and driveways, not a bay you have to
                    find before 8.
                  </p>
                </figcaption>
              </figure>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {JOBS.map((item) => (
                <a
                  key={item.id}
                  href="#quote"
                  onClick={() => setJobId(item.id)}
                  className="rounded-card border border-line bg-ink p-5 hover:border-red"
                >
                  <p className="text-sm text-steel">{item.time}</p>
                  <h3 className="mt-2 font-display text-3xl tracking-wide">{item.name}</h3>
                  <p className="mt-2 text-steel">{item.detail}</p>
                  <p className="mt-4 font-display text-3xl tabular-nums tracking-wide text-red">
                    From {money(item.mobile[0])}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="questions" className="scroll-mt-20 px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold tracking-widest text-red">QUESTIONS</p>
              <h2 className="mt-3 font-display text-5xl leading-none tracking-wide">Before you text the photos.</h2>
            </div>
            <div className="lg:col-span-3">
              {QUESTIONS.map((item) => (
                <details key={item.q} className="group border-b border-line py-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {item.q}
                    <span className="text-red group-open:hidden" aria-hidden>
                      +
                    </span>
                    <span className="hidden text-red group-open:inline" aria-hidden>
                      –
                    </span>
                  </summary>
                  <p className="mt-2 max-w-prose text-steel">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-card bg-red px-6 py-12 sm:px-10">
            <h2 className="max-w-3xl font-display text-5xl leading-none tracking-wide sm:text-6xl">
              Don’t drop the car off. Have the paint come to it.
            </h2>
            <a
              href="#quote"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 font-semibold"
            >
              Get the driveway ballpark
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <img
              src={logo}
              alt="The Paint Medics"
              className="w-full max-w-xs"
            />
            <p className="mt-3 max-w-md text-sm text-steel">
              We bring the body shop to you. Ranges are ballparks for straightforward paint, saved
              on your phone until a medic confirms the job.
            </p>
          </div>
          <a href="#quote" className="text-sm font-semibold text-chrome">
            Price a panel
          </a>
        </div>
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-steel">{k}</dt>
      <dd className="mt-1 font-display text-2xl tracking-wide sm:text-3xl">{v}</dd>
    </div>
  );
}

function PriceCard({
  label,
  value,
  note,
  hot,
}: {
  label: string;
  value: string;
  note?: string;
  hot?: boolean;
}) {
  return (
    <div className={"rounded-xl border p-4 " + (hot ? "border-red bg-panel" : "border-line")}>
      <p className="text-xs font-semibold tracking-widest text-steel">{label.toUpperCase()}</p>
      <p className="mt-2 font-display text-3xl tabular-nums tracking-wide">{value}</p>
      {note ? <p className="mt-1 text-sm text-steel">{note}</p> : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "tel" | "numeric" | "text";
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          "mt-2 h-12 w-full rounded-xl border bg-asphalt px-4 font-normal text-chrome " +
          (error ? "border-red" : "border-line")
        }
      />
      {error ? (
        <span id={`${id}-error`} className="mt-1 block font-normal text-red">
          {error}
        </span>
      ) : null}
    </label>
  );
}
