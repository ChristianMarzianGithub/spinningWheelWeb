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
const ROUTE_HOME = "home";
const ROUTE_IMPRESSUM = "impressum";
const ROUTE_DATENSCHUTZ = "datenschutz";

const resolveRoute = (path) => {
  if (path?.startsWith("/impressum")) return ROUTE_IMPRESSUM;
  if (path?.startsWith("/datenschutz")) return ROUTE_DATENSCHUTZ;
  return ROUTE_HOME;
};

export default function App() {
  const [route, setRoute] = useState(() =>
    typeof window !== "undefined" ? resolveRoute(window.location.pathname) : ROUTE_HOME
  );
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

  const navigate = (path) => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setRoute(resolveRoute(path));
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handlePopState = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const handleNav = (event, path) => {
    event.preventDefault();
    navigate(path);
  };

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

  const isHome = route === ROUTE_HOME;
  const isImpressum = route === ROUTE_IMPRESSUM;
  const isDatenschutz = route === ROUTE_DATENSCHUTZ;

  return (
    <div className="main-layout" >
      <div className="app">
        {isHome && (
          <>
            <header className="hero">
              <div>
                <p className="eyebrow">Random selector</p>
                <h1>Welcome to pickawinner.space</h1>
                <p className="subtitle">
                  Drop in names, spin once, and let chance pick a winner.
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
                    <p className="empty">
                      Start with a few names to unlock the wheel.
                    </p>
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
                          <path
                            key={`${slice.name}-${index}`}
                            d={slice.path}
                            fill={slice.color}
                          />
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
              <h1>Random Name Picker – Choose a Winner Fairly in Seconds</h1>
              <br/>
              <p>Sometimes a group needs to choose one person, but no one wants to decide manually. This simple random name picker helps you solve that problem in seconds.</p>
              <p>Just enter the names, click the button, and the tool will randomly select one person from the list. Every name has the same chance of being chosen, which makes the result completely fair.</p>
              <p>You can use the tool in school, at work, at home, or with friends. It works directly in your browser and does not require an account or registration.</p>
              <br/>
              <h1>How the Random Name Picker Works</h1>
              <br/>
              <p>Using the tool is very simple and only takes a few seconds.</p>
              <p>First, enter the names of the people in your group. You can enter as many names as you want. After that, click the button and the tool will randomly choose one name from the list.</p>
              <p>The result appears instantly, and the selection is completely random. This makes it perfect for situations where you want a fair decision without arguments or discussions.</p>
              <br/>
              <h1>Who Can Use This Random Name Picker?</h1>
              <br/>
              <p>This tool is useful in many everyday situations and can be used by anyone who needs to choose a person randomly.</p>
              <h2>In School</h2>
              <p>Teachers can use the random name picker to choose a student to answer a question or participate in class. This makes the selection fair and avoids always choosing the same students.</p>
              <h2>At Work</h2>
              <p>Teams can use the tool to decide who presents first in a meeting, who takes the next task, or who is responsible for something in a group project. It helps make decisions quickly and without pressure.</p>
              <h2>With Friends</h2>
              <p>You can use the tool to decide who pays for food, who chooses the movie, or who has to do something first. Instead of arguing, you can just let the tool decide randomly.</p>
              <h2>For Games and Fun Activities</h2>
              <p>The random name picker is also great for party games, group activities, and small competitions where you need to choose a winner quickly.</p>
              <br/>
              <br/>
              <h1>Why Use a Random Name Picker?</h1>
              <br/>
              <p>Choosing someone manually can sometimes feel unfair, especially in larger groups. A random name picker removes that problem and makes the selection completely neutral.</p>
              <br/>
              <h3>Benefits of using a random name generator:</h3>
              <br/>
              <p>Fair for everyone</p>
              <p>No arguments or discussions</p>
              <p>Works instantly</p>
              <p>Easy to use on mobile and desktop</p>
              <p>No account required</p>
              <p>Completely free to use</p>
              <p></p>
              <br/>
              <br/>
              <br/>
              <h1>Frequently Asked Questions  (FAQs)</h1>
              <br/>
              <p><strong>Is the random name picker really fair?</strong></p>
              <p>Yes. The tool randomly selects one name from the list you enter. Every person has the same chance of being chosen.</p>
              <p><strong>Do I need to create an account to use the tool?</strong></p>
              <p>No. You can use the random name picker immediately without signing up or creating an account.</p>
              <p><strong>Can I use the tool on my phone?</strong></p>
              <p>Yes. The random name picker works on both smartphones and computers. You can use it anywhere as long as you have a browser.</p>
              <p><strong>Is there a limit to how many names I can enter?</strong></p>
              <p>You can enter as many names as you want. The tool will still randomly select one name from the list.</p>
            </main>
          </>
        )}

        {isImpressum && <ImpressumPage onNavigateHome={(event) => handleNav(event, "/")} />}
        {isDatenschutz && (
          <DatenschutzPage onNavigateHome={(event) => handleNav(event, "/")} />
        )}

        <footer className="site-footer">
          <div className="footer-content">
            <span>© 2024 pickawinner.space</span>
            <nav>
              <a href="/" onClick={(event) => handleNav(event, "/")}>
                Home
              </a>
              <a href="/impressum" onClick={(event) => handleNav(event, "/impressum")}>
                Impressum
              </a>
              <a href="/datenschutz" onClick={(event) => handleNav(event, "/datenschutz")}>
                Datenschutz
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ImpressumPage({ onNavigateHome }) {
  return (
    <section className="info-page">
      <p className="eyebrow">Legal notice</p>
      <h1>Impressum</h1>
      <p className="subtitle">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz).</p>

      <div className="info-grid">
        <div className="info-card">
          <h3>Verantwortlich</h3>
          <p>
            Christian Marzian
            <br />
            Brunnenstraße 29
            <br />
            58332 Schwelm
            <br />
            Deutschland
          </p>
        </div>
        <div className="info-card">
          <h3>Kontakt</h3>
          <p>
            E-Mail: cmarzian91@gmail.com
            <br />
            Telefon: +49 0157 34 31 65 72
          </p>
        </div>
      </div>

      <button className="btn ghost" onClick={onNavigateHome} type="button">
        Zurück zum Wheel
      </button>
    </section>
  );
}

function DatenschutzPage({ onNavigateHome }) {
  return (
    <section className="info-page">
      <p className="eyebrow">Privacy</p>
      <h1>Datenschutzerklärung</h1>
      <p className="subtitle">So gehen wir mit Daten auf pickawinner.space um.</p>

      <div className="info-card">
        <h3>Verantwortliche Stelle</h3>
        <p>
          Christian Marzian
          <br />
          Brunnenstraße 29
          <br />
          58332 Schwelm
          <br />
          Deutschland
        </p>
        <p>
          E-Mail: cmarzian91@gmail.com
          <br />
          Telefon: +49 0157 34 31 65 72
        </p>
      </div>

      <div className="info-card">
        <h3>Verarbeitung der eingegebenen Daten</h3>
        <p>
          Die auf dieser Website eingegebenen Namen werden ausschließlich lokal im
          Browser verarbeitet, um die Auswahl auf dem Wheel zu ermöglichen. Es erfolgt
          keine Übertragung dieser Daten an einen Server und keine dauerhafte Speicherung.
        </p>
      </div>

      <div className="info-card">
        <h3>Server-Logfiles</h3>
        <p>
          Beim Besuch dieser Website werden automatisch Informationen durch den Server
          erfasst. Dies sind z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs,
          verwendeter Browser sowie das Betriebssystem des Nutzers. Diese Daten sind
          technisch erforderlich, um die Website korrekt auszuliefern.
        </p>
      </div>

      <div className="info-card">
        <h3>Cookies</h3>
        <p>
          Diese Website verwendet Cookies. Cookies sind kleine Textdateien, die auf
          Ihrem Endgerät gespeichert werden und die eine Analyse der Benutzung der
          Website ermöglichen.
        </p>
      </div>

      <div className="info-card">
        <h3>Werbung (Google AdSense)</h3>
        <p>
          Diese Website verwendet Google AdSense, einen Dienst zum Einbinden von
          Werbeanzeigen der Google Ireland Limited, Gordon House, Barrow Street,
          Dublin 4, Irland.
        </p>
        <p>
          Google AdSense verwendet Cookies und sogenannte Web Beacons. Dadurch kann
          Google Informationen über die Nutzung dieser Website auswerten. Die durch
          Cookies und Web Beacons erzeugten Informationen über die Benutzung dieser
          Website (einschließlich Ihrer IP-Adresse) können an Server von Google
          übertragen und dort gespeichert werden.
        </p>
      </div>

      <div className="info-card">
        <h3>Rechtsgrundlage</h3>
        <p>
          Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
          Interesse an der Bereitstellung einer funktionierenden Website und der
          Finanzierung des Angebots durch Werbung).
        </p>
      </div>

      <div className="info-card">
        <h3>Ihre Rechte</h3>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
          Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Beschwerde bei
          einer Aufsichtsbehörde.
        </p>
        <p>
          Wenn Sie Fragen zum Datenschutz haben, kontaktieren Sie mich bitte unter:
          cmarzian91@gmail.com
        </p>
      </div>

      <button className="btn ghost" onClick={onNavigateHome} type="button">
        Zurück zum Wheel
      </button>
    </section>
  );
}
