import { useEffect, useMemo, useRef, useState } from "react";

const PALETTE = [
  "#f94144",
  "#f3722c",
  "#f8961e",
  "#f9c74f",
  "#90be6d",
  "#43aa8b",
  "#4d908e",
  "#577590",
  "#277da1",
  "#2a9d8f",
  "#e76f51",
  "#ff6b6b",
];
const MAX_ITEMS = 10;

export default function App() {
  const [names, setNames] = useState([]);
  const [input, setInput] = useState("");
  const [bulkInput, setBulkInput] = useState(
    "Alpha\nBravo\nCharlie\nDelta\nEcho\nFoxtrot\nGolf\nHotel\nIndia\nJuliet"
  );
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingWinnerIndex, setPendingWinnerIndex] = useState(null);
  const [winner, setWinner] = useState(null);
  const spinTimeoutRef = useRef(null);

  const SPIN_DURATION_MS = 3000;

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const addName = (value) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    if (names.length >= MAX_ITEMS) return;
    setNames((prev) => [...prev, cleaned]);
  };

  const handleAdd = (event) => {
    event.preventDefault();
    if (isSpinning) return;
    addName(input);
    setInput("");
  };

  const handleBulkAdd = () => {
    if (isSpinning) return;
    if (names.length >= MAX_ITEMS) return;
    const items = bulkInput
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) return;
    const remaining = MAX_ITEMS - names.length;
    const trimmed = items.slice(0, Math.max(remaining, 0));
    if (!trimmed.length) return;
    setNames((prev) => [...prev, ...trimmed]);
    setBulkInput("");
  };

  const removeName = (index) => {
    if (isSpinning) return;
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpin = () => {
    if (isSpinning || names.length === 0) return;
    const winnerIndex = Math.floor(Math.random() * names.length);
    const slice = 360 / names.length;
    const centerAngle = winnerIndex * slice + slice / 2;

    const current = ((rotation % 360) + 360) % 360;
    const pointerAngle = 270;
    const delta = (pointerAngle - centerAngle - current + 3600) % 360;
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const nextRotation = rotation + extraSpins * 360 + delta;

    setWinner(null);
    setPendingWinnerIndex(winnerIndex);
    setIsSpinning(true);
    setRotation(nextRotation);

    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }

    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      setWinner(names[winnerIndex] ?? null);
    }, SPIN_DURATION_MS + 100);
  };

  const handleSpinEnd = (event) => {
    if (!isSpinning) return;
    if (event?.propertyName && event.propertyName !== "transform") return;
    setIsSpinning(false);
    if (pendingWinnerIndex === null) return;
    setWinner(names[pendingWinnerIndex] ?? null);
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
  };

  const sliceAngle = names.length ? 360 / names.length : 360;
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  const center = 200;
  const radius = 180;
  const labelRadius = radius * 0.65;
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const slices = useMemo(() => {
    if (!names.length) return [];
    return names.map((name, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = (index + 1) * sliceAngle;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const start = {
        x: center + radius * Math.cos(toRadians(startAngle)),
        y: center + radius * Math.sin(toRadians(startAngle)),
      };
      const end = {
        x: center + radius * Math.cos(toRadians(endAngle)),
        y: center + radius * Math.sin(toRadians(endAngle)),
      };
      const path = [
        `M ${center} ${center}`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        "Z",
      ].join(" ");
      const midAngle = startAngle + sliceAngle / 2;
      const label = {
        x: center + labelRadius * Math.cos(toRadians(midAngle)),
        y: center + labelRadius * Math.sin(toRadians(midAngle)),
        angle: midAngle,
      };
      return {
        name,
        color: PALETTE[index % PALETTE.length],
        path,
        label,
      };
    });
  }, [names, sliceAngle]);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Random selector</p>
          <h1>Spin the Wheel</h1>
          <p className="subtitle">
            Drop in names, spin once, and let chance pick the winner.
          </p>
        </div>
        <div className="hero-badge">
          <span>Fair. Fast. Fun.</span>
        </div>
      </header>

      <main className="content">
        <section className="panel">
          <h2>Build the list</h2>
          <form className="input-row" onSubmit={handleAdd}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Add a name"
              disabled={isSpinning}
            />
            <button
              className="btn"
              type="submit"
              disabled={isSpinning || names.length >= MAX_ITEMS}
            >
              Add
            </button>
          </form>
          <div className="bulk">
            <label htmlFor="bulk">Add many at once</label>
            <textarea
              id="bulk"
              value={bulkInput}
              onChange={(event) => setBulkInput(event.target.value)}
              placeholder="Paste names separated by commas or new lines"
              rows={4}
              disabled={isSpinning || names.length >= MAX_ITEMS}
            />
            <button
              className="btn ghost"
              type="button"
              onClick={handleBulkAdd}
              disabled={isSpinning || names.length >= MAX_ITEMS}
            >
              Add many
            </button>
          </div>

          <div className="list">
            <div className="list-header">
              <h3>Names</h3>
              <span>
                {names.length} / {MAX_ITEMS}
              </span>
            </div>
            {names.length === 0 ? (
              <p className="empty">Start with a few names to unlock the wheel.</p>
            ) : (
              <ul>
                {names.map((name, index) => (
                  <li key={`${name}-${index}`}>
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => removeName(index)}
                      disabled={isSpinning}
                      aria-label={`Remove ${name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="wheel-panel">
          <div className="wheel-header">
            <h2>Spin</h2>
            <p>Tap the wheel or the button to start.</p>
          </div>

          <div className="wheel-stage">
            <div className="pointer" aria-hidden="true" />
            <div
              className={`wheel ${isSpinning ? "spinning" : ""}`}
              style={{ transform: `rotate(${rotation}deg)` }}
              onTransitionEnd={handleSpinEnd}
              role="img"
              aria-label="Spinning wheel"
              onClick={handleSpin}
            >
              <svg
                className="wheel-svg"
                viewBox="0 0 400 400"
                aria-hidden="true"
              >
                <g>
                  {slices.map((slice, index) => (
                    <path key={`${slice.name}-${index}`} d={slice.path} fill={slice.color} />
                  ))}
                </g>
                <g>
                  {slices.map((slice, index) => {
                    const rotateText = isSpinning ? 0 : -normalizedRotation;
                    return (
                      <text
                        key={`${slice.name}-${index}-label`}
                        x={slice.label.x}
                        y={slice.label.y}
                        fill="rgba(16, 33, 42, 0.85)"
                        fontSize="14"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${rotateText} ${slice.label.x} ${slice.label.y})`}
                      >
                        {slice.name}
                      </text>
                    );
                  })}
                </g>
              </svg>
            </div>
            <button
              className="btn spin"
              type="button"
              onClick={handleSpin}
              disabled={names.length === 0 || isSpinning}
            >
              {isSpinning ? "Spinning..." : "Spin the wheel"}
            </button>
          </div>

          <div className={`winner ${winner ? "show" : ""}`} aria-live="polite">
            {winner ? (
              <div className="winner-card">
                <p>Winner</p>
                <h3>{winner}</h3>
              </div>
            ) : (
              <p className="winner-placeholder">Spin to reveal the winner.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
