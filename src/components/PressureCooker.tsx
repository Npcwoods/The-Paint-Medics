import { useEffect, useRef, useState } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/ibm-plex-mono/400.css";

type TrackKey = "confidence" | "stability" | "loyalty";
type Tracks = Record<TrackKey, number>;
type Scene = 1 | 2 | 3 | 4 | 5;
type EndingId = "polite" | "honest" | "empty" | "collapse";
type Delta = Partial<Tracks>;

type Line = { before: string; word: string; after: string };
type Choice = { text: string; delta: Delta };
type MayaBeat = { time: string; line: Line; choices: Choice[] };
type LogLine = { time: string; maya: string; you: string };

const KEYS: TrackKey[] = ["confidence", "stability", "loyalty"];
const LABEL: Record<TrackKey, string> = {
  confidence: "Confidence",
  stability: "Stability",
  loyalty: "Loyalty",
};

const START: Tracks = { confidence: 62, stability: 62, loyalty: 62 };

const ROOM: { line: Line; choice: Choice } = {
  line: {
    before: "Eleven minutes on the clock. A third of the way through, and the room has gone ",
    word: "polite",
    after: ".",
  },
  choice: { text: "Look at the clock.", delta: { confidence: -6 } },
};

const THREAD: MayaBeat[] = [
  {
    time: "2:49 PM",
    line: {
      before: "Checkout is failing for about a third of sessions. I'm on the bridge. Don't ",
      word: "vanish",
      after: ".",
    },
    choices: [
      {
        text: "Stay with it. Don't ship a fix while I'm in this room.",
        delta: { loyalty: 5, stability: -10, confidence: -2 },
      },
      {
        text: "I'll be out in ten. Patch it if the patch is small.",
        delta: { loyalty: -4, stability: 6, confidence: -8 },
      },
      { text: "Say nothing.", delta: { loyalty: -14, stability: -6, confidence: 5 } },
    ],
  },
  {
    time: "2:50 PM",
    line: {
      before: "I reverted the flag. The error rate didn't move. They are going to ask you about the ",
      word: "slide",
      after: ".",
    },
    choices: [
      { text: "If they ask, call it noise.", delta: { confidence: 8, stability: -14, loyalty: -8 } },
      { text: "Send the graph. Don't add a story.", delta: { stability: 5, loyalty: 3, confidence: -10 } },
      { text: "Say nothing.", delta: { loyalty: -12, stability: -5, confidence: 2 } },
    ],
  },
  {
    time: "2:51 PM",
    line: {
      before: "I won't tell them the number is fine. If you need that said, ask ",
      word: "someone",
      after: " else.",
    },
    choices: [
      {
        text: "Then say nothing. I'll take the question.",
        delta: { loyalty: -12, confidence: 7, stability: -5 },
      },
      {
        text: "Tell them what you told me. I'll say the same.",
        delta: { loyalty: 12, confidence: -12, stability: 6 },
      },
      { text: "Say nothing.", delta: { loyalty: -9, confidence: -3, stability: -6 } },
    ],
  },
];

const DEMO: { line: Line; choices: Choice[] } = {
  line: {
    before: "The chart was built to climb. It holds, then steps ",
    word: "down",
    after: ", while you are still talking.",
  },
  choices: [
    {
      text: "This is the lag between ship and settle. Next quarter it turns.",
      delta: { confidence: 7, stability: -13, loyalty: -4 },
    },
    {
      text: "That slide is last quarter. The work is the next three.",
      delta: { confidence: 3, stability: -8, loyalty: -7 },
    },
    {
      text: "It's down. We shipped a change that broke checkout.",
      delta: { stability: 12, confidence: -14, loyalty: 8 },
    },
  ],
};

const QUESTIONS: Record<TrackKey, { line: Line; choices: Choice[] }> = {
  confidence: {
    line: {
      before: "If I called three of your customers tonight, what would they say this is ",
      word: "for",
      after: "?",
    },
    choices: [
      {
        text: "They would say it gives them the hour back.",
        delta: { confidence: 8, stability: -5, loyalty: -3 },
      },
      {
        text: "They would say it's early. They would be right.",
        delta: { confidence: -6, stability: 4, loyalty: 4 },
      },
      { text: "I don't know what they would say.", delta: { confidence: -12, loyalty: 2, stability: 2 } },
    ],
  },
  stability: {
    line: {
      before: "The line fell while you were standing there. Is that the product, or the ",
      word: "telling",
      after: "?",
    },
    choices: [
      {
        text: "The telling. The product is ahead of this slide.",
        delta: { stability: -12, confidence: 8, loyalty: -3 },
      },
      {
        text: "The product. We broke a path and it is still broken.",
        delta: { stability: 11, confidence: -11, loyalty: 4 },
      },
      {
        text: "Both. The slide is late, and it is honest.",
        delta: { stability: 4, confidence: -4, loyalty: 2 },
      },
    ],
  },
  loyalty: {
    line: {
      before: "The person who knows whether that chart is real is not in this ",
      word: "room",
      after: ". Why?",
    },
    choices: [
      {
        text: "She is keeping the service up. That is the work.",
        delta: { loyalty: -10, confidence: 6, stability: 3 },
      },
      {
        text: "I told her to stay quiet. That was my decision.",
        delta: { loyalty: -5, confidence: -8, stability: 1 },
      },
      { text: "She should be here. I kept her out.", delta: { loyalty: 11, confidence: -8, stability: -2 } },
    ],
  },
};

const ENDINGS: Record<EndingId, { paras: [Line, string, string]; last: Line }> = {
  polite: {
    paras: [
      {
        before: "The lead thanks you by name. The next meeting stays ",
        word: "unscheduled",
        after: ".",
      },
      "You take the stairs. The lobby smells like citrus solvent.",
      "Your phone has one new message, and it is not from them.",
    ],
    last: { before: "The polite no doesn't use the word ", word: "no", after: "." },
  },
  honest: {
    paras: [
      {
        before: "Nobody smiles. Someone writes the number in a notebook that was already ",
        word: "open",
        after: ".",
      },
      "The garage is colder than the room. Your voice is still in the concrete.",
      "You sit with the key in the ignition and the engine off.",
    ],
    last: { before: "You said it out loud. It does not ", word: "climb", after: " back in." },
  },
  empty: {
    paras: [
      {
        before: "Her monitor is on the error page, brightness all the way ",
        word: "down",
        after: ".",
      },
      "The chair is pushed in. The spare hoodie is not on it.",
      "You stand where she would have seen the door.",
    ],
    last: { before: "She is not coming back for the ", word: "charger", after: "." },
  },
  collapse: {
    paras: [
      { before: "The sentence fails. You hear it fail, and so does the ", word: "table", after: "." },
      "Someone says your name like a question.",
      "You are in the hall with the laptop under your arm.",
    ],
    last: { before: "You close it before the ", word: "light", after: " goes." },
  },
};

const CLOCK: Record<Scene, string> = {
  1: "2:47 PM",
  2: "2:49 PM",
  3: "2:52 PM",
  4: "2:54 PM",
  5: "2:56 PM",
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function lineText(line: Line) {
  return line.before + line.word + line.after;
}

function uniqueLowest(t: Tracks): TrackKey | null {
  let min = Infinity;
  let key: TrackKey | null = null;
  let count = 0;
  for (const k of KEYS) {
    if (t[k] < min) {
      min = t[k];
      key = k;
      count = 1;
    } else if (t[k] === min) count += 1;
  }
  return count === 1 ? key : null;
}

function worst(delta: Delta): TrackKey | null {
  let key: TrackKey | null = null;
  let n = 0;
  for (const k of KEYS) {
    const v = delta[k] ?? 0;
    if (v < n) {
      n = v;
      key = k;
    }
  }
  return key;
}

function endingFor(t: Tracks, last: TrackKey | null): EndingId {
  const min = Math.min(t.confidence, t.stability, t.loyalty);
  const lows = KEYS.filter((k) => t[k] === min);
  const key = lows.length === 1 ? lows[0] : last && lows.includes(last) ? last : lows[0];
  if (key === "confidence") return "polite";
  if (key === "stability") return "honest";
  return "empty";
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type ToneNodes = {
  ctx: AudioContext;
  master: GainNode;
  filter: BiquadFilterNode;
  a: OscillatorNode;
  b: OscillatorNode;
  ga: GainNode;
  gb: GainNode;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
};

function ensureTone(slot: { current: ToneNodes | null }) {
  if (slot.current) {
    if (slot.current.ctx.state === "suspended") void slot.current.ctx.resume();
    return slot.current;
  }
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.5;
  filter.connect(master);
  const a = ctx.createOscillator();
  const b = ctx.createOscillator();
  a.type = "sine";
  b.type = "sine";
  const ga = ctx.createGain();
  const gb = ctx.createGain();
  ga.gain.value = 0.45;
  gb.gain.value = 0;
  a.connect(ga);
  ga.connect(filter);
  b.connect(gb);
  gb.connect(filter);
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfo.frequency.value = 0.2;
  lfoDepth.gain.value = 0;
  lfo.connect(lfoDepth);
  lfoDepth.connect(ga.gain);
  a.start();
  b.start();
  lfo.start();
  slot.current = { ctx, master, filter, a, b, ga, gb, lfo, lfoDepth };
  return slot.current;
}

function tune(n: ToneNodes, pressure: TrackKey | null, muted: boolean) {
  const now = n.ctx.currentTime;
  const tau = prefersReduced() ? 0.02 : 0.55;
  n.master.gain.setTargetAtTime(muted ? 0 : 0.04, now, muted ? 0.05 : 0.7);
  const hz = (osc: OscillatorNode, value: number) => osc.frequency.setTargetAtTime(value, now, tau);
  if (pressure === "confidence") {
    n.a.type = "sine";
    n.b.type = "sine";
    hz(n.a, 74);
    hz(n.b, 148);
    n.ga.gain.setTargetAtTime(0.75, now, tau);
    n.gb.gain.setTargetAtTime(0.16, now, tau);
    n.filter.type = "lowpass";
    n.filter.frequency.setTargetAtTime(260, now, tau);
    n.lfoDepth.gain.setTargetAtTime(0.015, now, tau);
  } else if (pressure === "stability") {
    n.a.type = "triangle";
    n.b.type = "sine";
    hz(n.a, 392);
    hz(n.b, 784);
    n.ga.gain.setTargetAtTime(0.2, now, tau);
    n.gb.gain.setTargetAtTime(0.04, now, tau);
    n.filter.type = "highpass";
    n.filter.frequency.setTargetAtTime(540, now, tau);
    n.lfo.frequency.setTargetAtTime(0.28, now, 0.2);
    n.lfoDepth.gain.setTargetAtTime(0.11, now, tau);
  } else if (pressure === "loyalty") {
    n.a.type = "sine";
    n.b.type = "sine";
    hz(n.a, 124);
    hz(n.b, 125.2);
    n.ga.gain.setTargetAtTime(0.48, now, tau);
    n.gb.gain.setTargetAtTime(0.48, now, tau);
    n.filter.type = "lowpass";
    n.filter.frequency.setTargetAtTime(680, now, tau);
    n.lfoDepth.gain.setTargetAtTime(0, now, tau);
  } else {
    n.a.type = "sine";
    n.b.type = "sine";
    hz(n.a, 110);
    hz(n.b, 110);
    n.ga.gain.setTargetAtTime(0.4, now, tau);
    n.gb.gain.setTargetAtTime(0, now, tau);
    n.filter.type = "lowpass";
    n.filter.frequency.setTargetAtTime(400, now, tau);
    n.lfoDepth.gain.setTargetAtTime(0, now, tau);
  }
}

function Prose({ line, className }: { line: Line; className?: string }) {
  return (
    <p className={className}>
      {line.before}
      <span className="accent">{line.word}</span>
      {line.after}
    </p>
  );
}

function Chart() {
  return (
    <svg className="chart" viewBox="0 0 640 200" role="img" aria-label="A line that steadies, then falls.">
      <path
        d="M4 78 C 70 70, 120 64, 180 72 S 300 86, 380 96 S 500 150, 632 168"
        fill="none"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PressureCooker() {
  const [scene, setScene] = useState<Scene>(1);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [tracks, setTracks] = useState<Tracks>(START);
  const [shown, setShown] = useState<Tracks>(START);
  const [numsDim, setNumsDim] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [ending, setEnding] = useState<EndingId | null>(null);
  const [lastOn, setLastOn] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
  const [questionKey, setQuestionKey] = useState<TrackKey>("confidence");
  const [muted, setMuted] = useState(false);

  const tracksRef = useRef(START);
  const lastHurtRef = useRef<TrackKey | null>(null);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const tone = useRef<ToneNodes | null>(null);
  const mutedRef = useRef(false);
  const sceneRef = useRef<Scene>(1);
  const stepRef = useRef(0);
  const endingRef = useRef<EndingId | null>(null);
  const showAgainRef = useRef(false);
  const questionRef = useRef<TrackKey>("confidence");

  sceneRef.current = scene;
  stepRef.current = step;
  endingRef.current = ending;
  showAgainRef.current = showAgain;
  questionRef.current = questionKey;
  mutedRef.current = muted;
  tracksRef.current = tracks;

  const pressure = uniqueLowest(tracks);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      tone.current?.ctx.close();
      tone.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tone.current) return;
    tune(tone.current, pressure, muted);
  }, [pressure, muted]);

  useEffect(() => {
    if (KEYS.every((k) => shown[k] === tracks[k])) return;
    if (prefersReduced()) {
      setShown(tracks);
      return;
    }
    setNumsDim(true);
    const id = window.setTimeout(() => {
      setShown(tracks);
      setNumsDim(false);
    }, 420);
    return () => window.clearTimeout(id);
  }, [tracks, shown]);

  useEffect(() => {
    if (scene !== 5 || !ending) return;
    setLastOn(false);
    setShowAgain(false);
    const reduced = prefersReduced();
    const t1 = window.setTimeout(() => setLastOn(true), reduced ? 0 : 1100);
    const t2 = window.setTimeout(() => setShowAgain(true), reduced ? 0 : 3600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scene, ending]);

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, prefersReduced() ? 0 : ms);
    timers.current.push(id);
  }

  function boot(next: TrackKey | null) {
    const nodes = ensureTone(tone);
    tune(nodes, next, mutedRef.current);
  }

  function goEnd(id: EndingId) {
    setPicked(null);
    setEnding(id);
    setScene(5);
  }

  function commit(delta: Delta, after: () => void) {
    if (busy.current) return;
    busy.current = true;
    const cur = tracksRef.current;
    const next: Tracks = {
      confidence: clamp(cur.confidence + (delta.confidence ?? 0)),
      stability: clamp(cur.stability + (delta.stability ?? 0)),
      loyalty: clamp(cur.loyalty + (delta.loyalty ?? 0)),
    };
    tracksRef.current = next;
    setTracks(next);
    const hurt = worst(delta);
    if (hurt) lastHurtRef.current = hurt;
    boot(uniqueLowest(next));
    const dead = KEYS.some((k) => next[k] <= 0);
    later(560, () => {
      busy.current = false;
      if (dead) goEnd("collapse");
      else after();
    });
  }

  function onRoom() {
    if (sceneRef.current !== 1 || busy.current) return;
    setPicked(0);
    commit(ROOM.choice.delta, () => {
      setPicked(null);
      setScene(2);
    });
  }

  function onThread(i: number) {
    if (sceneRef.current !== 2 || busy.current) return;
    const beat = THREAD[stepRef.current];
    const choice = beat.choices[i];
    if (!choice) return;
    setPicked(i);
    const stamp = beat.time;
    const maya = lineText(beat.line);
    const at = stepRef.current;
    commit(choice.delta, () => {
      setLog((prev) => [...prev, { time: stamp, maya, you: choice.text }]);
      setPicked(null);
      if (at >= THREAD.length - 1) setScene(3);
      else setStep(at + 1);
    });
  }

  function onDemo(i: number) {
    if (sceneRef.current !== 3 || busy.current) return;
    const choice = DEMO.choices[i];
    if (!choice) return;
    setPicked(i);
    commit(choice.delta, () => {
      const low = uniqueLowest(tracksRef.current) ?? lastHurtRef.current ?? "confidence";
      setQuestionKey(low);
      setPicked(null);
      setScene(4);
    });
  }

  function onAsk(i: number) {
    if (sceneRef.current !== 4 || busy.current) return;
    const choice = QUESTIONS[questionRef.current].choices[i];
    if (!choice) return;
    setPicked(i);
    commit(choice.delta, () => {
      setPicked(null);
      goEnd(endingFor(tracksRef.current, lastHurtRef.current));
    });
  }

  function reset() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    busy.current = false;
    lastHurtRef.current = null;
    tracksRef.current = START;
    setTracks(START);
    setShown(START);
    setNumsDim(false);
    setScene(1);
    setStep(0);
    setLog([]);
    setPicked(null);
    setEnding(null);
    setLastOn(false);
    setShowAgain(false);
    setQuestionKey("confidence");
    if (tone.current) tune(tone.current, null, mutedRef.current);
  }

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const nodes = ensureTone(tone);
    tune(nodes, uniqueLowest(tracksRef.current), next);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
        return;
      }
      if (e.key === "Enter") {
        const target = e.target;
        if (target instanceof HTMLElement && target.closest("button")) return;
        if (sceneRef.current === 5 && showAgainRef.current) reset();
        else if (sceneRef.current === 1) onRoom();
        return;
      }
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const i = Number(e.key) - 1;
        if (sceneRef.current === 1 && i === 0) onRoom();
        if (sceneRef.current === 2) onThread(i);
        if (sceneRef.current === 3) onDemo(i);
        if (sceneRef.current === 4) onAsk(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const clock = ending === "collapse" ? "2:55 PM" : CLOCK[scene];
  const end = ending ? ENDINGS[ending] : null;
  const beat = THREAD[step] ?? THREAD[0];
  const question = QUESTIONS[questionKey];

  return (
    <main className="cooker" data-pressure={pressure ?? "none"}>
      <h1 className="sr">The Pressure Cooker</h1>
      <p className="clock">{clock}</p>
      <button type="button" className="mute" onClick={toggleMute} aria-pressed={muted}>
        {muted ? "Sound" : "Mute"}
      </button>
      <div className="column">
        <div key={scene === 5 ? `end-${ending}` : String(scene)} className="beat">
          {scene === 1 && (
            <>
              <Prose line={ROOM.line} className="prose" />
              <Choices items={[ROOM.choice]} picked={picked} onPick={() => onRoom()} />
            </>
          )}
          {scene === 2 && (
            <>
              {log.map((entry) => (
                <div key={`${entry.time}-${entry.you}`} className="past">
                  <p className="when">{entry.time}</p>
                  <p className="maya">{entry.maya}</p>
                  <p className="you">{entry.you}</p>
                </div>
              ))}
              <div key={step} className="maya-now">
                <p className="when">{beat.time}</p>
                <Prose line={beat.line} className="maya" />
              </div>
              <Choices items={beat.choices} picked={picked} onPick={onThread} />
            </>
          )}
          {scene === 3 && (
            <>
              <Prose line={DEMO.line} className="prose" />
              <Chart />
              <Choices items={DEMO.choices} picked={picked} onPick={onDemo} />
            </>
          )}
          {scene === 4 && (
            <>
              <Prose line={question.line} className="question" />
              <Choices items={question.choices} picked={picked} onPick={onAsk} />
            </>
          )}
          {scene === 5 && end && (
            <div className="end">
              <Prose line={end.paras[0]} className="prose" />
              <p className="prose">{end.paras[1]}</p>
              <p className="prose">{end.paras[2]}</p>
              <p className={lastOn ? "last on" : "last"}>
                {end.last.before}
                <span className="accent">{end.last.word}</span>
                {end.last.after}
              </p>
            </div>
          )}
        </div>
      </div>
      {showAgain && (
        <button type="button" className="again" onClick={reset}>
          Again
        </button>
      )}
      <div className="tracks" aria-label="Confidence, stability, and loyalty">
        {KEYS.map((k) => {
          const hot = pressure === k;
          return (
            <span key={k} className={hot ? "track hot" : "track"}>
              <span className="k">{LABEL[k]}</span>
              <span className={numsDim ? "num dim" : "num"}>{shown[k]}</span>
              {hot ? <span className="sr"> lowest</span> : null}
            </span>
          );
        })}
      </div>
    </main>
  );
}

function Choices({
  items,
  picked,
  onPick,
}: {
  items: Choice[];
  picked: number | null;
  onPick: (index: number) => void;
}) {
  return (
    <div className="choices">
      {items.map((item, i) => {
        const state = picked === null ? "" : picked === i ? "stay" : "out";
        return (
          <button
            key={item.text}
            type="button"
            className={`choice ${state}`}
            disabled={picked !== null}
            onClick={() => onPick(i)}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}
