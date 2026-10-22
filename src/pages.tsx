import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  riskCohorts,
  chains,
  deepArchive,
  deepRows,
  decisionOrgs,
  decisions,
  organizations,
  contestants,
  markets,
  type Decision,
  pct,
  statuses,
  usd,
  verifications,
  type Market,
} from "./data";
import { ChainIcon, ChainLink, StarIcon } from "./icons";

function commentsFor(market: Market) {
  if (market.id === "knesset") {
    return [
      {
        address: "0x4a7e…911b",
        badge: "Verified Forecaster",
        time: "4 hours ago",
        body: "Recent polling aggregation from Channel 12 and the Kan Public Broadcaster indicates Yashar maintaining an average 3.2-seat lead post-consolidation. Note that Knesset distribution rules enforce a 3.25% electoral threshold, which increases the likelihood of smaller faction ballots being eliminated, concentrating plurality seats toward Yashar.",
      },
      {
        address: "0x81ce…388d",
        badge: "Holder",
        time: "14 hours ago",
        body: "Agreement on surplus seats could shift 1–2 seats in the final allocation regardless of the raw vote lead.",
      },
    ];
  }
  const lead = [...market.outcomes]
    .filter((item) => item.name !== "Invalid")
    .sort((a, b) => b.price - a.price)[0];
  return [
    {
      address: "0x4a7e…911b",
      badge: "Verified Forecaster",
      time: "4 hours ago",
      body: `Placeholder note. ${lead?.name ?? "The leading outcome"} is the highest price in this sample book${lead ? `, at ${pct(lead.price)}` : ""}.`,
    },
    {
      address: "0x81ce…388d",
      time: "14 hours ago",
      body: "Placeholder comment. Nothing on this preview is a live position or a settled answer.",
    },
  ];
}

function holdersFor(market: Market) {
  const book = market.outcomes.filter((item) => item.name !== "Invalid");
  const preset = market.id === "knesset" ? [8400, 2150, 960, 410] : null;
  return [
    { address: "0x4a7e…911b", weight: 0.18 },
    { address: "0x81ce…388d", weight: 0.11 },
    { address: "0x19b0…c441", weight: 0.07 },
    { address: "0x77aa…02e6", weight: 0.04 },
  ].map((row, index) => ({
    address: row.address,
    outcome: book[index % book.length]?.name ?? "—",
    amount: preset ? preset[index] : Math.max(1, Math.round(market.liquidity * row.weight)),
    weight: row.weight,
  }));
}

function activityFor(market: Market) {
  const book = [...market.outcomes]
    .filter((item) => item.name !== "Invalid")
    .sort((a, b) => b.price - a.price);
  const rows = [
    { side: "Buy" as const, outcome: book[0]?.name ?? "—", tokens: market.id === "knesset" ? 420 : 180, address: "0x91ab…c04e", time: "12m ago" },
    { side: "Sell" as const, outcome: book[1]?.name ?? book[0]?.name ?? "—", tokens: 80, address: "0x33d1…aa90", time: "1h ago" },
    { side: "Buy" as const, outcome: book[0]?.name ?? "—", tokens: 150, address: "0x4a7e…911b", time: "3h ago" },
    { side: "Sell" as const, outcome: book[1]?.name ?? book[0]?.name ?? "—", tokens: 40, address: "0x81ce…388d", time: "6h ago" },
  ];
  return rows.map((row) => {
    const price = market.outcomes.find((item) => item.name === row.outcome)?.price ?? 0;
    return { ...row, paid: (row.tokens * price).toFixed(2) };
  });
}

function sampleLine(price: number, range: string) {
  const end = 96 - Math.min(price, 0.95) * 60;
  const swing = range === "1D" ? 6 : range === "1W" ? 16 : range === "All" ? 30 : 12;
  return `M0 ${end + swing} C 90 ${end + swing + 8}, 170 ${end - swing}, 280 ${end + 4} S 470 ${end - swing * 0.4}, 640 ${end}`;
}

function sampleArea(price: number, range: string) {
  return `${sampleLine(price, range)} L640 160 L0 160 Z`;
}

const deepColors = [
  "#7d33ff",
  "#c4b5fd",
  "#3dbe7a",
  "#f0b4c0",
  "#8eb6ff",
  "#e2c16b",
  "#5ec8c5",
  "#f08a5d",
  "#dfd1f8",
  "#9a9aa3",
  "#b388ff",
  "#86e3a8",
];

const deepSeries = [
  { repo: "alloy-rs", up: 0.72 },
  { repo: "reth", up: 0.81 },
  { repo: "foundry", up: 0.9 },
  { repo: "wagmi", up: 0.62 },
  { repo: "viem", up: 0.85 },
  { repo: "go-ethereum", up: 0.8 },
  { repo: "solidity", up: 0.81 },
  { repo: "teku", up: 0.81 },
  { repo: "lodestar", up: 0.79 },
  { repo: "erigon", up: 0.76 },
  { repo: "nethermind", up: 0.74 },
  { repo: "prysm", up: 0.77 },
  { repo: "lighthouse", up: 0.78 },
  { repo: "ethers.js", up: 0.83 },
  { repo: "web3.py", up: 0.77 },
  { repo: "hardhat", up: 0.7 },
  { repo: "sourcify", up: 0.76 },
  { repo: "blockscout", up: 0.67 },
  { repo: "mev-boost", up: 0.77 },
  { repo: "account-abstraction", up: 0.73 },
  { repo: "hevm", up: 0.77 },
  { repo: "fe", up: 0.73 },
];

const chartPlot = { l: 58, r: 628, t: 14, b: 262 };
const chartLow = 0.5;
const chartHigh = 1;

function deepValue(price: number, range: string, seed: number, t: number) {
  const swing = range === "1D" ? 0.025 : range === "1W" ? 0.06 : range === "All" ? 0.1 : 0.04;
  const wave = Math.sin(t * Math.PI * (1.3 + (seed % 3) * 0.35) + seed * 0.7) * swing;
  const drift = (t - 1) * swing * (seed % 2 === 0 ? 0.8 : -0.5);
  return Math.min(0.97, Math.max(0.52, price + wave + drift));
}

function chartX(t: number) {
  return chartPlot.l + t * (chartPlot.r - chartPlot.l);
}

function chartY(value: number) {
  return chartPlot.b - ((value - chartLow) / (chartHigh - chartLow)) * (chartPlot.b - chartPlot.t);
}

function share(n: number) {
  return n.toFixed(4);
}

function deepChartPath(price: number, range: string, seed: number) {
  const steps = 24;
  let path = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path += `${i === 0 ? "M" : "L"}${chartX(t)} ${chartY(deepValue(price, range, seed, t))}`;
  }
  return path;
}

const deepBoard = [
  { wallet: "0x91ab…c04e", volume: 1840, roi: 0.18, pnl: 331.2 },
  { wallet: "0x81ce…388d", volume: 1260, roi: 0.14, pnl: 176.4 },
  { wallet: "0x19b0…c441", volume: 980, roi: 0.11, pnl: 107.8 },
  { wallet: "0x77aa…02e6", volume: 740, roi: 0.09, pnl: 66.6 },
  { wallet: "0xc0de…11a2", volume: 610, roi: 0.07, pnl: 42.7 },
  { wallet: "0x55e0…90ab", volume: 540, roi: 0.05, pnl: 27.0 },
  { wallet: "0x4a7e…911b", you: true, volume: 420, roi: 0.08, pnl: 33.6 },
  { wallet: "0x33d1…aa90", volume: 390, roi: -0.04, pnl: -15.6 },
  { wallet: "0x12fa…77c3", volume: 260, roi: -0.06, pnl: -15.6 },
  { wallet: "0x88b1…04de", volume: 180, roi: -0.09, pnl: -16.2 },
];

function boardScale(range: string) {
  if (range === "Day") return 0.12;
  if (range === "Week") return 0.4;
  if (range === "Month") return 0.72;
  return 1;
}

const deepTrades = [
  { wallet: "0x4a7e…911b", repo: "reth", side: "Buy UP", amount: "40.00 sUSDS", when: "2h ago" },
  { wallet: "0x81ce…388d", repo: "foundry", side: "Sell UP", amount: "15.00 sUSDS", when: "5h ago" },
  { wallet: "0x19b0…c441", repo: "alloy-rs", side: "Buy UP", amount: "22.50 sUSDS", when: "1d ago" },
  { wallet: "0x77aa…02e6", repo: "viem", side: "Buy UP", amount: "8.00 sUSDS", when: "1d ago" },
];

function Tick() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6.4 10.6 3.8 8l-1.1 1.1 3.7 3.7 7-7L12.3 4.7z" fill="currentColor" />
    </svg>
  );
}

function GlowCard({ href, title, body }: { href: string; title: string; body: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a
      ref={ref}
      href={href}
      onPointerMove={(event) => {
        const card = ref.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--hx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--hy", `${event.clientY - rect.top}px`);
      }}
    >
      <strong>{title}</strong>
      <span>{body}</span>
      <span className="eco-go" aria-hidden="true">
        →
      </span>
    </a>
  );
}

function StepIcon({ name }: { name: "token" | "pool" | "bond" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "token") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "pool") {
    return (
      <svg {...props}>
        <circle cx="6" cy="15" r="2.1" />
        <circle cx="12" cy="7" r="2.1" />
        <circle cx="18" cy="15" r="2.1" />
        <path d="M7.8 13.6 10.5 8.6M13.5 8.6 16.2 13.6M8.2 15h7.6" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M9.2 13.2 7 11a2.8 2.8 0 0 1 4-4l1.3 1.3" />
      <path d="m14.8 10.8 2.2 2.2a2.8 2.8 0 0 1-4 4L11.7 15.7" />
      <path d="m10 14 4-4" />
    </svg>
  );
}

function ArchIcon({ name }: { name: "choice" | "collection" | "range" | "brackets" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "choice") {
    return (
      <svg {...props}>
        <circle cx="5.5" cy="6.5" r="2" fill="currentColor" stroke="none" />
        <path d="M11 6.5h8" />
        <circle cx="5.5" cy="12" r="2" />
        <path d="M11 12h8" />
        <circle cx="5.5" cy="17.5" r="2" />
        <path d="M11 17.5h8" />
      </svg>
    );
  }
  if (name === "collection") {
    return (
      <svg {...props}>
        <rect x="3" y="3.5" width="8" height="7" rx="1.5" />
        <rect x="13" y="3.5" width="8" height="7" rx="1.5" />
        <rect x="8" y="13.5" width="8" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "range") {
    return (
      <svg {...props}>
        <path d="M3 12h18" />
        <path d="M4 8v8M20 8v8" />
        <circle cx="13.5" cy="12" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M8 5H4.5v14H8M16 5h3.5v14H16" />
      <path d="M10 9h4M10 12h4M10 15h4" />
    </svg>
  );
}

export function Portal() {
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const halo = haloRef.current;
    if (!halo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let currentX = window.innerWidth / 2;
    let currentY = 220;
    let targetX = currentX;
    let targetY = currentY;
    let frame = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      halo.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    window.addEventListener("pointermove", onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div>
      <div className="page-halo" ref={haloRef} aria-hidden="true" />
      <section className="portal-hero">
        <p className="kicker">Prediction marketplace</p>
        <h1>A price is a probability.</h1>
        <p className="lede">
          Create a market, trade outcome tokens, and redeem after an answer is
          bonded.
        </p>
        <div className="actions">
          <a className="btn" href="#/markets">
            Explore markets
          </a>
          <a className="doc-link" href="https://docs.seer.pm" target="_blank" rel="noreferrer">
            Explore the documentation
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="chips">
          {["politics", "crypto", "sports", "culture"].map((topic) => (
            <span className="chip" key={topic}>
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="types-head">
          <p className="kicker">Frameworks</p>
          <h2>Four market architectures</h2>
          <p>
            One winner, a set of related questions, a number inside a range, or a
            number for each named item.
          </p>
        </div>
        <div className="types">
          {[
            {
              n: "01",
              kind: "Discrete",
              icon: "choice" as const,
              title: "Categorical",
              body: "One winner among named outcomes. Invalid is always one of them.",
              example: "Israeli Knesset seats",
            },
            {
              n: "02",
              kind: "Compound",
              icon: "collection" as const,
              title: "Multi-categorical",
              body: "Several related categorical questions, kept as one collection.",
              example: "Related questions, one collection",
            },
            {
              n: "03",
              kind: "Continuous",
              icon: "range" as const,
              title: "Scalar",
              body: "A number inside a range, traded as UP and DOWN.",
              example: "Ethereum base fee, 0.1 to 120 gwei",
            },
            {
              n: "04",
              kind: "Interval",
              icon: "brackets" as const,
              title: "Multi-scalar",
              body: "A number for each named item, with the name in brackets.",
              example: "Seats won by [party]",
            },
          ].map((item) => (
            <article className="type" key={item.title}>
              <div>
                <div className="step-icon">
                  <ArchIcon name={item.icon} />
                </div>
                <div className="type-meta">
                  <span>{item.n}</span>
                  <span>{item.kind}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
              <a href="#/markets">
                View example: {item.example}
                <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="types-head">
          <p className="kicker">How a trade settles</p>
          <h2>Three steps, then redeem</h2>
          <p>
            Reality.eth takes the bonded answer. Kleros is only the dispute
            court. Liquidity is a pool per outcome.
          </p>
        </div>
        <div className="steps">
          {[
            {
              n: "01",
              kind: "Tokens",
              icon: "token" as const,
              title: "Outcome tokens",
              body: "Each outcome is a token. A full set can be minted from collateral and merged back.",
            },
            {
              n: "02",
              kind: "Pools",
              icon: "pool" as const,
              title: "A pool per outcome",
              body: "You buy or sell a side. Each outcome has its own pool.",
            },
            {
              n: "03",
              kind: "Resolve",
              icon: "bond" as const,
              title: "Bond, then resolve",
              body: "After opening, someone bonds an answer. A later answer at least doubles that bond.",
            },
          ].map((item) => (
            <article className="step" key={item.title}>
              <div className="step-icon">
                <StepIcon name={item.icon} />
              </div>
              <div className="type-meta">
                <span>{item.n}</span>
                <span>{item.kind}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="kicker">Ecosystem</p>
        <h2>The other five surfaces</h2>
        <div className="eco">
          {[
            ["#/markets", "Markets", "Find a question and take a side."],
            ["#/futarchy", "Futarchy", "Price a decision with YES and NO."],
            ["#/deep", "Deep", "Original work versus dependencies."],
            ["#/opportunity", "Opportunity", "A contest. Traders price the entries."],
            ["#/foresight", "Foresight", "A closed book of default risk."],
          ].map(([href, title, body]) => (
            <GlowCard key={href} href={href} title={title} body={body} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function Markets() {
  const filtersRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("all");
  const [chain, setChain] = useState("all");
  const [verification, setVerification] = useState("all");
  const [conditional, setConditional] = useState<"any" | "only" | "hide">("any");
  const [rewards, setRewards] = useState<"any" | "yes">("any");
  const [sort, setSort] = useState<"default" | "liquidity" | "opening">("default");
  const [minLiquidity, setMinLiquidity] = useState("");
  const [showFutarchy, setShowFutarchy] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [browse, setBrowse] = useState(false);
  const [page, setPage] = useState(0);
  const [collection, setCollection] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(markets[0].id);
  const [outcome, setOutcome] = useState(markets[0].outcomes[0].name);
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [amount, setAmount] = useState("100");
  const [collateral, setCollateral] = useState("sDAI");
  const [tab, setTab] = useState("comments");
  const [range, setRange] = useState("1M");

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [filtersOpen]);

  const visible = useMemo(() => {
    const minimum = Number(minLiquidity);
    const filtered = markets.filter((market) => {
      if (status !== "all" && market.status !== status) return false;
      if (chain !== "all" && market.chain !== chain) return false;
      if (verification !== "all" && market.verification !== verification) return false;
      if (conditional === "only" && market.kind !== "Conditional") return false;
      if (conditional === "hide" && market.kind === "Conditional") return false;
      if (rewards === "yes" && !market.rewards) return false;
      if (!showFutarchy && market.futarchy) return false;
      if (minimum > 0 && market.liquidity < minimum) return false;
      const text = `${market.question} ${market.outcomes.map((item) => item.name).join(" ")}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
    if (sort === "liquidity") filtered.sort((a, b) => b.liquidity - a.liquidity);
    if (sort === "opening") {
      filtered.sort((a, b) => Date.parse(b.opening) - Date.parse(a.opening));
    }
    return filtered;
  }, [status, chain, verification, conditional, rewards, sort, minLiquidity, showFutarchy, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / 20));
  const pageItems = visible.slice(page * 20, page * 20 + 20);

  useEffect(() => {
    setPage(0);
  }, [status, chain, verification, conditional, rewards, sort, minLiquidity, showFutarchy, query]);

  const activeFilters = [
    status !== "all",
    chain !== "all",
    verification !== "all",
    conditional !== "any",
    rewards !== "any",
    sort !== "default",
    Number(minLiquidity) > 0,
    !showFutarchy,
  ].filter(Boolean).length;

  function track(label: string, items: string[], current: string, set: (value: string) => void) {
    return (
      <div className="filter-track">
        <span className="filter-label">{label}</span>
        {["all", ...items].map((item) => (
          <button
            key={item}
            type="button"
            className={current === item ? "mini on" : "mini"}
            aria-pressed={current === item}
            onClick={() => set(item)}
          >
            {current === item && <Tick />}
            {label === "Network" && item !== "all" && <ChainIcon name={item} />}
            {item === "all" ? "All" : item}
          </button>
        ))}
      </div>
    );
  }

  const market = visible.find((item) => item.id === selectedId) ?? visible[0];
  const picked =
    market?.outcomes.find((item) => item.name === outcome) ?? market?.outcomes[0];

  useEffect(() => {
    if (!market) return;
    if (market.id !== selectedId) setSelectedId(market.id);
    if (!market.outcomes.some((item) => item.name === outcome)) {
      setOutcome(market.outcomes[0].name);
      setCollateral(market.collateral);
    }
  }, [market, selectedId, outcome]);
  const spend = Number(amount) || 0;
  const tokens = picked && picked.price > 0 ? spend / picked.price : 0;
  const returned = side === "Buy" ? tokens : spend * (picked?.price ?? 0);
  const profit = side === "Buy" && picked && picked.price > 0 ? (1 / picked.price - 1) * 100 : 0;
  const collaterals = market?.collateral === "sDAI" ? ["sDAI", "xDAI"] : market ? [market.collateral] : [];

  function open(next: Market) {
    setSelectedId(next.id);
    setOutcome(next.outcomes[0].name);
    setCollateral(next.collateral);
    setBrowse(false);
  }

  function toggleCollection(id: string) {
    setCollection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div>
      <p className="kicker">Markets</p>
      <div className="filters" ref={filtersRef}>
        <div className="filter-bar">
        <button
          type="button"
          className={filtersOpen ? "filter-btn on" : "filter-btn"}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2 3.5h12M4.5 8h7M7 12.5h2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          Filter
          {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
          <svg className="filter-chevron" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={browse ? "filter-btn on" : "filter-btn"}
          onClick={() => {
            setBrowse((value) => !value);
            if (!browse) setPage(0);
          }}
        >
          {browse ? "Focus" : "Show all"}
        </button>
        </div>
        {filtersOpen && (
          <div className="filter-panel">
            <div className="filter-row">
              {track("Status", statuses, status, setStatus)}
              {track("Oracle", verifications, verification, setVerification)}
            </div>
            <div className="filter-row">{track("Network", chains, chain, setChain)}</div>
            <div className="filter-extra">
              <div>
                <p className="filter-label">Conditional market</p>
                <div className="filter-choices">
                  {(
                    [
                      ["any", "Any"],
                      ["only", "Only conditional"],
                      ["hide", "Hide conditional"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={conditional === value ? "mini on" : "mini"}
                      onClick={() => setConditional(value)}
                    >
                      {conditional === value && <Tick />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="filter-label">Rewards</p>
                <div className="filter-choices">
                  {(
                    [
                      ["any", "Any"],
                      ["yes", "Has rewards"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={rewards === value ? "mini on" : "mini"}
                      onClick={() => setRewards(value)}
                    >
                      {rewards === value && <Tick />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="filter-label">Sort by</p>
                <div className="filter-choices">
                  {(
                    [
                      ["default", "Default"],
                      ["liquidity", "Liquidity"],
                      ["opening", "Opening"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={sort === value ? "mini on" : "mini"}
                      onClick={() => setSort(value)}
                    >
                      {sort === value && <Tick />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="filter-label">Minimum liquidity</p>
                <input
                  className="filter-liquidity"
                  inputMode="numeric"
                  placeholder="Any"
                  value={minLiquidity}
                  onChange={(event) => setMinLiquidity(event.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
              <button
                type="button"
                className={showFutarchy ? "switch on" : "switch"}
                aria-pressed={showFutarchy}
                onClick={() => setShowFutarchy((value) => !value)}
              >
                <span />
                Show futarchy
              </button>
            </div>
          </div>
        )}
      </div>

      {browse ? (
        <div className="browse">
          <input
            className="search"
            placeholder="Search markets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {pageItems.length === 0 && <p className="muted">No sample markets match.</p>}
          <div className="market-cards">
            {pageItems.map((item) => (
              <article
                key={item.id}
                className="market-card"
                onPointerMove={(event) => {
                  const card = event.currentTarget;
                  const rect = card.getBoundingClientRect();
                  card.style.setProperty("--hx", `${event.clientX - rect.left}px`);
                  card.style.setProperty("--hy", `${event.clientY - rect.top}px`);
                }}
              >
                <span
                  className={collection.includes(item.id) ? "star on" : "star"}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    collection.includes(item.id) ? "Remove from collection" : "Add to collection"
                  }
                  aria-pressed={collection.includes(item.id)}
                  onClick={() => toggleCollection(item.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    toggleCollection(item.id);
                  }}
                >
                  <StarIcon filled={collection.includes(item.id)} />
                </span>
                <button type="button" className="card-open" onClick={() => open(item)}>
                  <span className="card-kind">
                    {item.kind}
                    {item.futarchy ? " · Futarchy" : ""}
                  </span>
                  <span className="card-question">{item.question}</span>
                  {item.note && <span className="card-note">{item.note}</span>}
                  <span className="card-outcomes">
                    {item.outcomes.slice(0, 3).map((result) => (
                      <span key={result.name}>
                        {result.name} <b>{pct(result.price)}</b>
                      </span>
                    ))}
                  </span>
                </button>
                <span className="card-meta">
                  <ChainLink name={item.chain} />
                  <span>{item.status}</span>
                  <span className="mono">{usd(item.liquidity)} sample</span>
                </span>
              </article>
            ))}
          </div>
          {visible.length > 20 && (
            <div className="pager">
              <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <span>
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
      <div className="layout" style={{ marginTop: 22 }}>
        <aside className="panel stack">
          <input
            className="search"
            placeholder="Search markets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {visible.length === 0 && <p className="muted">No sample markets match.</p>}
          {visible.map((item) => (
            <button
              key={item.id}
              className={item.id === market?.id ? "market-link on" : "market-link"}
              onClick={() => open(item)}
            >
              {item.question}
              <small>
                {item.kind} · {item.status}
              </small>
            </button>
          ))}
        </aside>

        {market && picked && (
          <section>
            <div className="question-row">
              <h1 className="question">{market.question}</h1>
              <button
                type="button"
                className={collection.includes(market.id) ? "star on" : "star"}
                aria-label={
                  collection.includes(market.id) ? "Remove from collection" : "Add to collection"
                }
                aria-pressed={collection.includes(market.id)}
                onClick={() => toggleCollection(market.id)}
              >
                <StarIcon filled={collection.includes(market.id)} />
              </button>
            </div>
            <div className="meta">
              <ChainLink name={market.chain} />
              <span className="mono">{market.collateral}</span>
              <span>{market.status}</span>
              <span>{market.verification}</span>
              <span>Opens {market.opening}</span>
              <span className="mono">Liquidity {usd(market.liquidity)} sample</span>
            </div>
            {market.note && <p className="note">{market.note}</p>}
            <div className="picks-head">
              <span>Available outcomes ({market.outcomes.length})</span>
              <span>A full set mints 1 {collateral}</span>
            </div>
            <div className="picks">
              {market.outcomes
                .filter((item) => item.name !== "Invalid")
                .map((item) => {
                  const selected = item.name === picked.name;
                  const rank =
                    [...market.outcomes]
                      .filter((entry) => entry.name !== "Invalid")
                      .sort((a, b) => b.price - a.price)
                      .findIndex((entry) => entry.name === item.name) + 1;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={selected ? "pick on" : "pick"}
                      onClick={() => setOutcome(item.name)}
                    >
                      <span className="pick-top">
                        <span className="pick-name">
                          {selected && <span className="trade-dot" aria-hidden="true" />}
                          {item.name}
                        </span>
                        {selected && <span className="pick-badge">Active selection</span>}
                        <span className={rank === 1 ? "pick-rank lead" : "pick-rank"}>
                          {rank === 1 ? "Leading" : `Rank #${rank}`}
                        </span>
                      </span>
                      <span className="pick-pct">{pct(item.price)}</span>
                      <span className="mono pick-price">
                        {item.price.toFixed(2)} {collateral}
                      </span>
                      <span className="bar">
                        <span style={{ width: `${Math.max(item.price * 100, 2)}%` }} />
                      </span>
                    </button>
                  );
                })}
            </div>
            {market.outcomes
              .filter((item) => item.name === "Invalid")
              .map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={item.name === picked.name ? "pick-invalid on" : "pick-invalid"}
                  onClick={() => setOutcome(item.name)}
                >
                  <strong>Invalid</strong>
                  <span>Invalid is always an outcome.</span>
                  <span className="mono">
                    {pct(item.price)} ({item.price.toFixed(3)} {collateral})
                  </span>
                </button>
              ))}
            <div className="history">
              <div className="history-head">
                <span>Probability</span>
                <strong>
                  {picked.name} {pct(picked.price)}
                </strong>
                <div className="history-ranges">
                  {["1D", "1W", "1M", "All"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={range === item ? "on" : ""}
                      onClick={() => setRange(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <svg
                className="chart"
                viewBox="0 0 640 160"
                preserveAspectRatio="none"
                role="img"
                aria-label="Sample probability line"
              >
                <path className="chart-area" d={sampleArea(picked.price, range)} />
                <path className="chart-line" d={sampleLine(picked.price, range)} />
              </svg>
            </div>
            <div className="tabs">
              {(
                [
                  ["comments", `Comments (${commentsFor(market).length})`],
                  ["conditional", "Related conditional markets"],
                  ["holders", "Top holders"],
                  ["activity", "Activity"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? "on" : ""}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "comments" && (
              <div className="feed">
                {commentsFor(market).map((item) => (
                  <article key={item.address} className="feed-card">
                    <div className="feed-top">
                      <span className="mono">{item.address}</span>
                      {item.badge && <span className="feed-badge">{item.badge}</span>}
                      <span className="feed-time">{item.time}</span>
                    </div>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            )}
            {tab === "conditional" && (
              <div className="feed">
                {(() => {
                  const parent = markets.find((item) => item.id === market.parentId);
                  const children = markets.filter((item) => item.parentId === market.id);
                  const siblings = market.parentId
                    ? markets.filter((item) => item.parentId === market.parentId && item.id !== market.id)
                    : [];
                  const related = children.length > 0 ? children : siblings;
                  if (!parent && related.length === 0) {
                    return <p className="muted">No related conditional markets in this sample.</p>;
                  }
                  return (
                    <>
                      {parent && (
                        <button type="button" className="feed-card related" onClick={() => open(parent)}>
                          <span className="feed-kicker">Parent market</span>
                          <strong>{parent.question}</strong>
                          <span className="mono">
                            {pct(parent.outcomes[0].price)} {parent.outcomes[0].name}
                          </span>
                        </button>
                      )}
                      {related.map((item) => {
                        const lead = [...item.outcomes].sort((a, b) => b.price - a.price)[0];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="feed-card related"
                            onClick={() => open(item)}
                          >
                            <span className="feed-kicker">{item.kind}</span>
                            <strong>{item.question}</strong>
                            {item.note && <span className="muted">{item.note}</span>}
                            <span className="mono">
                              {pct(lead.price)} {lead.name}
                            </span>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )}
            {tab === "holders" && (
              <div className="feed">
                {holdersFor(market).map((item, _, rows) => {
                  const max = Math.max(...rows.map((row) => row.amount));
                  return (
                    <div key={item.address} className="holder">
                      <span className="mono">{item.address}</span>
                      <span>{item.outcome}</span>
                      <span className="mono">{item.amount.toLocaleString("en-US")}</span>
                      <span className="bar">
                        <span style={{ width: `${Math.max((item.amount / max) * 100, 4)}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === "activity" && (
              <div className="feed">
                {activityFor(market).map((item) => (
                  <div key={`${item.time}-${item.address}`} className="activity-row">
                    <span className={item.side === "Buy" ? "act buy" : "act sell"}>{item.side}</span>
                    <span>
                      {item.tokens.toLocaleString("en-US")} {item.outcome}
                    </span>
                    <span className="mono">
                      {item.paid} {market.collateral}
                    </span>
                    <span className="mono muted">{item.address}</span>
                    <span className="feed-time">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {market && picked && (
          <aside className="ticket trade">
            <div className="trade-head">
              <div className="trade-side">
                {(["Buy", "Sell"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={side === item ? "on" : ""}
                    onClick={() => setSide(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="trade-collateral">
                Collateral:{" "}
                {collaterals.map((item, index) => (
                  <span key={item}>
                    {index > 0 && " / "}
                    <button
                      type="button"
                      className={collateral === item ? "on" : ""}
                      onClick={() => setCollateral(item)}
                    >
                      {item}
                    </button>
                  </span>
                ))}
              </p>
            </div>
            <div className="trade-block">
              <p className="trade-label">Target outcome</p>
              <div className="row">
                <span className="trade-target">
                  <span className="trade-dot" aria-hidden="true" />
                  {picked.name}
                </span>
                <span className="mono">
                  {picked.price.toFixed(2)} {collateral}
                </span>
              </div>
            </div>
            <div className="trade-block">
              <div className="row">
                <p className="trade-label">Order amount</p>
                <span className="muted">Balance: 1,420.50 {collateral}</span>
              </div>
              <div className="field">
                <input
                  inputMode="decimal"
                  value={amount}
                  aria-label="Amount"
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                />
                <span>{collateral}</span>
              </div>
              <div className="presets">
                {["25", "50", "100"].map((item) => (
                  <button key={item} type="button" onClick={() => setAmount(item)}>
                    ${item}
                  </button>
                ))}
                <button type="button" onClick={() => setAmount("1420.50")}>
                  Max
                </button>
              </div>
            </div>
            <div className="trade-quote">
              <div className="row">
                <span className="muted">Average price</span>
                <span className="mono">
                  {picked.price.toFixed(3)} {collateral}
                </span>
              </div>
              <div className="row">
                <span className="muted">{side === "Buy" ? "Estimated tokens" : "Collateral back"}</span>
                <span className="mono">
                  {returned.toFixed(2)} {side === "Buy" ? picked.name : collateral}
                </span>
              </div>
              <div className={side === "Buy" ? "row" : "row trade-hold"} aria-hidden={side !== "Buy"}>
                <span className="muted">Potential return</span>
                <span className="mono trade-up">
                  {tokens.toFixed(2)} {collateral} (+{profit.toFixed(1)}%)
                </span>
              </div>
              <div className="row">
                <span className="muted">Max slippage</span>
                <span className="mono">1.0%</span>
              </div>
              <div className="row">
                <span className="muted">Protocol settlement fee</span>
                <span className="mono">0.00 {collateral}</span>
              </div>
            </div>
            <p className="trade-note">
              <span aria-hidden="true">i</span>
              Outcome tokens are never bought above 1 {collateral}.
            </p>
            <button className="btn" type="button">
              {side} {picked.name}
            </button>
            <p className="trade-foot">
              1 {collateral} mints one of each outcome token; merging them returns collateral.
            </p>
            <p className="trade-links">
              <button type="button">Mint complete set →</button>
              <button type="button">Merge set</button>
              <button type="button">Redeem</button>
            </p>
          </aside>
        )}
      </div>
      )}
    </div>
  );
}

function decisionStatus(status: Decision["status"]) {
  if (status === "open") return "Open";
  if (status === "awaiting") return "Awaiting resolution";
  return "Resolved";
}

function isPassed(item: Decision) {
  return item.status === "resolved" && item.result === "YES";
}

function decisionPrice(decision: Decision, side: "YES" | "NO") {
  return side === "YES" ? decision.yes : decision.no;
}

function isBullish(side: "Buy" | "Sell", outcome: "YES" | "NO") {
  return (side === "Buy" && outcome === "YES") || (side === "Sell" && outcome === "NO");
}

function decisionActivity(decision: Decision) {
  if (decision.id === "gip-152") return [];
  const yes = decision.yes ?? 0;
  const no = decision.no ?? 0;
  const rows = [
    { side: "Buy" as const, outcome: "YES" as const, tokens: 0.42, address: "0x4a7e…911b", time: "12m ago", mine: true },
    { side: "Sell" as const, outcome: "YES" as const, tokens: 0.18, address: "0x33d1…aa90", time: "1h ago", mine: false },
    { side: "Buy" as const, outcome: "NO" as const, tokens: 0.15, address: "0x19b0…c441", time: "3h ago", mine: false },
    { side: "Sell" as const, outcome: "NO" as const, tokens: 0.08, address: "0x81ce…388d", time: "6h ago", mine: true },
  ];
  return rows.map((row) => {
    const price = row.outcome === "YES" ? yes : no;
    return {
      ...row,
      stance: isBullish(row.side, row.outcome) ? ("Bullish" as const) : ("Bearish" as const),
      paid: price > 0 ? (row.tokens * price).toFixed(2) : null,
      currency: decision.currency ?? decision.token,
    };
  });
}

export function Futarchy() {
  const filtersRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("all");
  const [org, setOrg] = useState("all");
  const [listKind, setListKind] = useState<"milestones" | "proposals">("proposals");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [browse, setBrowse] = useState(false);
  const [page, setPage] = useState(0);
  const [collection, setCollection] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState(decisions[0].id);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [amount, setAmount] = useState("100");
  const [collateral, setCollateral] = useState(decisions[0].currency ?? decisions[0].token);
  const [tab, setTab] = useState("activity");
  const [range, setRange] = useState("1M");

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [filtersOpen]);

  const visible = useMemo(() => {
    return decisions.filter((item) => {
      if (listKind === "milestones" && !isPassed(item)) return false;
      if (status !== "all" && item.status !== status) return false;
      if (org !== "all" && item.org !== org) return false;
      return `${item.title} ${item.org} ${item.token}`.toLowerCase().includes(query.toLowerCase());
    });
  }, [status, org, query, listKind]);

  useEffect(() => {
    setPage(0);
  }, [status, org, query, listKind]);

  const pageCount = Math.max(1, Math.ceil(visible.length / 20));
  const pageItems = visible.slice(page * 20, page * 20 + 20);
  const decision = visible.find((item) => item.id === selectedId) ?? visible[0];
  const price = decision ? decisionPrice(decision, outcome) : undefined;
  const collaterals = decision
    ? decision.currency
      ? [decision.currency, decision.token]
      : [decision.token]
    : [];
  const spend = Number(amount) || 0;
  const buyingToken = decision ? collateral !== decision.token : true;
  const estimated =
    price && price > 0 ? (buyingToken ? spend / price : spend * price) : null;
  const activeFilters = [status !== "all"].filter(Boolean).length;
  const selectedOrg = organizations.find((item) => item.name === org);
  const showingMilestones = listKind === "milestones";
  const inOrg = (item: Decision) => org === "all" || item.org === org;
  const proposalCount = decisions.filter(inOrg).length;
  const milestoneCount = decisions.filter((item) => inOrg(item) && isPassed(item)).length;
  const searchLabel = showingMilestones ? "Search milestones" : "Search proposals";
  const emptyLabel = showingMilestones
    ? "No milestones found matching your criteria."
    : "No proposals for this organization.";

  useEffect(() => {
    if (!decision) return;
    if (decision.id !== selectedId) setSelectedId(decision.id);
  }, [decision, selectedId]);

  function open(next: Decision) {
    setSelectedId(next.id);
    setOutcome("YES");
    setCollateral(next.currency ?? next.token);
    setBrowse(false);
  }

  function toggleCollection(id: string) {
    setCollection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function track(label: string, items: string[], current: string, set: (value: string) => void) {
    return (
      <div className="filter-track">
        <span className="filter-label">{label}</span>
        {["all", ...items].map((item) => (
          <button
            key={item}
            type="button"
            className={current === item ? "mini on" : "mini"}
            aria-pressed={current === item}
            onClick={() => set(item)}
          >
            {current === item && <Tick />}
            {item === "all" ? "All" : item === "open" || item === "awaiting" || item === "resolved" ? decisionStatus(item) : item}
          </button>
        ))}
      </div>
    );
  }

  const trades = decision ? decisionActivity(decision) : [];
  const mine = trades.filter((item) => item.mine);
  const view = decision ? (isBullish(side, outcome) ? "Bullish" : "Bearish") : "Bullish";
  const unit =
    decision?.yes != null && decision.no != null && price != null
      ? price / (decision.yes + decision.no)
      : 0.5;

  return (
    <div>
      <p className="kicker">Futarchy</p>
      <div className="filters" ref={filtersRef}>
        <div className="filter-bar">
          <button
            type="button"
            className={filtersOpen ? "filter-btn on" : "filter-btn"}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 3.5h12M4.5 8h7M7 12.5h2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Filter
            {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
            <svg className="filter-chevron" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M2.5 4.5 6 8l3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={browse ? "filter-btn on" : "filter-btn"}
            onClick={() => {
              setBrowse((value) => !value);
              if (!browse) setPage(0);
            }}
          >
            {browse ? "Focus" : "Show all"}
          </button>
          <div className="filter-track">
            <span className="filter-label">Organization</span>
            <button
              type="button"
              className={org === "all" ? "mini on" : "mini"}
              aria-pressed={org === "all"}
              onClick={() => setOrg("all")}
            >
              {org === "all" && <Tick />}
              All
            </button>
            {decisionOrgs.map((name) => (
              <button
                key={name}
                type="button"
                className={org === name ? "mini on" : "mini"}
                aria-pressed={org === name}
                onClick={() => {
                  setOrg(name);
                  setListKind("proposals");
                }}
              >
                {org === name && <Tick />}
                {name}
              </button>
            ))}
          </div>
        </div>
        {filtersOpen && (
          <div className="filter-panel">
            <div className="filter-row">
              {track("Status", ["open", "awaiting", "resolved"], status, setStatus)}
            </div>
          </div>
        )}
      </div>
      {selectedOrg && (
        <header className="org-head">
          <h2>{selectedOrg.name}</h2>
          <div className="meta">
            <ChainLink name={selectedOrg.chain} />
            {selectedOrg.unit && <span>{selectedOrg.unit}</span>}
            <span>{proposalCount} proposals</span>
            <span>{milestoneCount} milestones</span>
            {selectedOrg.liquidity && <span>Liquidity</span>}
          </div>
          {selectedOrg.about && <p className="lede">{selectedOrg.about}</p>}
        </header>
      )}
      <div className="kind-switch">
        <div className="tabs">
          <button
            type="button"
            className={listKind === "milestones" ? "on" : ""}
            onClick={() => setListKind("milestones")}
          >
            All milestones
          </button>
          <button
            type="button"
            className={listKind === "proposals" ? "on" : ""}
            onClick={() => setListKind("proposals")}
          >
            Proposals
          </button>
        </div>
        <p className="muted">
          {showingMilestones
            ? "A passed proposal, resolved YES, counts as a milestone."
            : "Fully realized proposals with all features and comprehensive data where functionalities meet their full expression."}
        </p>
      </div>

      {browse ? (
        <div className="browse">
          <input
            className="search"
            placeholder={searchLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {pageItems.length === 0 && <p className="muted">{emptyLabel}</p>}
          <div className="market-cards">
            {pageItems.map((item) => (
              <article
                key={item.id}
                className="market-card"
                onPointerMove={(event) => {
                  const card = event.currentTarget;
                  const rect = card.getBoundingClientRect();
                  card.style.setProperty("--hx", `${event.clientX - rect.left}px`);
                  card.style.setProperty("--hy", `${event.clientY - rect.top}px`);
                }}
              >
                <span
                  className={collection.includes(item.id) ? "star on" : "star"}
                  role="button"
                  tabIndex={0}
                  aria-label={collection.includes(item.id) ? "Remove from collection" : "Add to collection"}
                  aria-pressed={collection.includes(item.id)}
                  onClick={() => toggleCollection(item.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    toggleCollection(item.id);
                  }}
                >
                  <StarIcon filled={collection.includes(item.id)} />
                </span>
                <button type="button" className="card-open" onClick={() => open(item)}>
                  <span className="card-kind">
                    {item.org} · {isPassed(item) ? "Passed milestone" : decisionStatus(item.status)}
                  </span>
                  <span className="card-question">{item.title}</span>
                  <span className="card-outcomes">
                    <span>
                      Impact <b>{item.impact}</b>
                    </span>
                    {item.result && (
                      <span>
                        Resolved <b>{item.result}</b>
                      </span>
                    )}
                  </span>
                </button>
                <span className="card-meta">
                  <ChainLink name={item.chain} />
                  <span>{item.pair}</span>
                  <span className="mono">{item.impact} sample</span>
                </span>
              </article>
            ))}
          </div>
          {visible.length > 20 && (
            <div className="pager">
              <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <span>
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="layout" style={{ marginTop: 22 }}>
          <aside className="panel stack">
            <input
              className="search"
              placeholder={searchLabel}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {visible.length === 0 && <p className="muted">{emptyLabel}</p>}
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === decision?.id ? "market-link on" : "market-link"}
                onClick={() => open(item)}
              >
                {item.title}
                <small>
                  {item.org} · {isPassed(item) ? "Passed milestone" : decisionStatus(item.status)}
                </small>
              </button>
            ))}
          </aside>

          {decision && (
            <section>
              <div className="question-row">
                <h1 className="question">{decision.title}</h1>
                <button
                  type="button"
                  className={collection.includes(decision.id) ? "star on" : "star"}
                  aria-label={collection.includes(decision.id) ? "Remove from collection" : "Add to collection"}
                  aria-pressed={collection.includes(decision.id)}
                  onClick={() => toggleCollection(decision.id)}
                >
                  <StarIcon filled={collection.includes(decision.id)} />
                </button>
              </div>
              <div className="meta">
                <ChainLink name={decision.chain} />
                <span>{decision.org}</span>
                <span className="mono">{decision.pair}</span>
                <span>{isPassed(decision) ? "Passed milestone" : decisionStatus(decision.status)}</span>
                <span className="mono">Impact {decision.impact} sample</span>
              </div>
              {decision.blurb && <p className="note">{decision.blurb}</p>}
              {decision.rule && <div className="rule">{decision.rule}</div>}
              <div className="facts">
                <div>
                  <span>Impact (spot)</span>
                  <strong>{decision.impact}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{decisionStatus(decision.status)}</strong>
                </div>
                <div>
                  <span>Pair</span>
                  <strong>{decision.pair}</strong>
                </div>
                {decision.volume && (
                  <div>
                    <span>Volume</span>
                    <strong>{decision.volume}</strong>
                  </div>
                )}
                {decision.tvl && (
                  <div>
                    <span>TVL</span>
                    <strong>{decision.tvl}</strong>
                  </div>
                )}
                {decision.when && (
                  <div>
                    <span>{decision.status === "open" ? "Window" : "Date"}</span>
                    <strong>{decision.when}</strong>
                  </div>
                )}
                {decision.vote && (
                  <div>
                    <span>Snapshot</span>
                    <strong>{decision.vote}</strong>
                  </div>
                )}
              </div>
              <div className="picks-head">
                <span>Outcomes</span>
                <span>Sample conditional prices</span>
              </div>
              <div className="picks">
                {(["YES", "NO"] as const).map((name) => {
                  const selected = outcome === name;
                  const value = decisionPrice(decision, name);
                  const ranked = [decision.yes, decision.no].filter((item) => item != null) as number[];
                  const leading =
                    value != null && ranked.length > 1 && value === Math.max(...ranked) && value > Math.min(...ranked);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={selected ? "pick on" : "pick"}
                      onClick={() => setOutcome(name)}
                    >
                      <span className="pick-top">
                        <span className="pick-name">
                          {selected && <span className="trade-dot" aria-hidden="true" />}
                          {name}
                        </span>
                        {selected && <span className="pick-badge">Active selection</span>}
                        <span className={leading || decision.result === name ? "pick-rank lead" : "pick-rank"}>
                          {value != null ? (leading ? "Leading" : "Rank #2") : decision.result === name ? "Resolved" : ""}
                        </span>
                      </span>
                      <span className="pick-pct">
                        {value != null
                          ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : decision.result === name
                            ? decision.impact
                            : "—"}
                      </span>
                      <span className="mono pick-price">
                        {value != null
                          ? `${decision.currency} per ${decision.token}`
                          : decision.result === name
                            ? "Resolved outcome"
                            : "Other outcome"}
                      </span>
                      <span className={name === "YES" ? "stance bull" : "stance bear"}>
                        {name === "YES" ? "Buy is bullish" : "Buy is bearish"}
                      </span>
                      <span className="bar">
                        <span
                          style={{
                            width:
                              value != null && ranked.length
                                ? `${Math.max((value / Math.max(...ranked)) * 100, 2)}%`
                                : decision.result === name
                                  ? "100%"
                                  : "8%",
                          }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="note">If Reality.eth resolves the question invalid, the decision does not pass.</p>
              <div className="history">
                <div className="history-head">
                  <span>Conditional price</span>
                  <strong>
                    {outcome}
                    {price != null
                      ? ` ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : ""}
                  </strong>
                  <div className="history-ranges">
                    {["1D", "1W", "1M", "All"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={range === item ? "on" : ""}
                        onClick={() => setRange(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <svg
                  className="chart"
                  viewBox="0 0 640 160"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Sample conditional price"
                >
                  <path className="chart-area" d={sampleArea(unit, range)} />
                  <path className="chart-line" d={sampleLine(unit, range)} />
                </svg>
              </div>
              <div className="tabs">
                {(
                  [
                    ["activity", "Activity"],
                    ["trades", "My trades"],
                    ["position", "Position"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={(tab === id || (id === "activity" && tab !== "trades" && tab !== "position")) ? "on" : ""}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {(tab === "activity" || (tab !== "trades" && tab !== "position")) && (
                <div className="feed">
                  <p className="muted">Buy YES or sell NO is bullish. Buy NO or sell YES is bearish.</p>
                  {trades.length === 0 && <p className="muted">No trades in this sample.</p>}
                  {trades.map((item) => (
                    <div key={`${item.time}-${item.address}`} className="activity-row">
                      <span className="act-main">
                        <span className={item.stance === "Bullish" ? "stance bull" : "stance bear"}>{item.stance}</span>
                        <span>
                          {item.side} {item.outcome}
                        </span>
                      </span>
                      <span>
                        {item.tokens} {decision.token}
                      </span>
                      <span className="mono">{item.paid ? `${item.paid} ${item.currency}` : "—"}</span>
                      <span className="mono muted">{item.address}</span>
                      <span className="feed-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "trades" && (
                <div className="feed">
                  <p className="muted">Trades for the sample wallet on this decision.</p>
                  {mine.length === 0 && <p className="muted">No trades in this sample.</p>}
                  {mine.map((item) => (
                    <div key={`${item.time}-${item.address}`} className="activity-row">
                      <span className="act-main">
                        <span className={item.stance === "Bullish" ? "stance bull" : "stance bear"}>{item.stance}</span>
                        <span>
                          {item.side} {item.outcome}
                        </span>
                      </span>
                      <span>
                        {item.tokens} {decision.token}
                      </span>
                      <span className="mono">{item.paid ? `${item.paid} ${item.currency}` : "—"}</span>
                      <span className="feed-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "position" && (
                <div className="feed">
                  {trades.length === 0 ? (
                    <p className="muted">No position in this sample.</p>
                  ) : (
                    <>
                      <div className="holder">
                        <span>YES</span>
                        <span className="stance bull">Bullish</span>
                        <span className="mono">0.42 {decision.token}</span>
                        <span className="bar">
                          <span style={{ width: "100%" }} />
                        </span>
                      </div>
                      <div className="holder">
                        <span>NO</span>
                        <span className="stance bear">Bearish</span>
                        <span className="mono">0.15 {decision.token}</span>
                        <span className="bar">
                          <span style={{ width: "36%" }} />
                        </span>
                      </div>
                      <p className="muted">
                        This sample position leans bullish: more YES than NO.
                        {decision.result ? ` Resolved ${decision.result}.` : ""}
                      </p>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {decision && (
            <aside className="ticket trade">
              <div className="trade-head">
                <div className="trade-side">
                  {(["Buy", "Sell"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={side === item ? "on" : ""}
                      onClick={() => setSide(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="trade-collateral">
                  Collateral:{" "}
                  {collaterals.map((item, index) => (
                    <span key={item}>
                      {index > 0 && " / "}
                      <button
                        type="button"
                        className={collateral === item ? "on" : ""}
                        onClick={() => setCollateral(item)}
                      >
                        {item}
                      </button>
                    </span>
                  ))}
                </p>
              </div>
              <div className="trade-block">
                <p className="trade-label">Target outcome</p>
                <div className="row">
                  <span className="trade-target">
                    <span className="trade-dot" aria-hidden="true" />
                    {outcome}
                    <span className={view === "Bullish" ? "stance bull" : "stance bear"}>{view}</span>
                  </span>
                  <span className="mono">
                    {price != null
                      ? `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${decision.currency}`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="trade-block">
                <div className="row">
                  <p className="trade-label">Order amount</p>
                  <span className="muted">Balance: 1,420.50 {collateral}</span>
                </div>
                <div className="field">
                  <input
                    inputMode="decimal"
                    value={amount}
                    aria-label="Amount"
                    onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                  />
                  <span>{collateral}</span>
                </div>
                <div className="presets">
                  {["25", "50", "100"].map((item) => (
                    <button key={item} type="button" onClick={() => setAmount(item)}>
                      ${item}
                    </button>
                  ))}
                  <button type="button" onClick={() => setAmount("1420.50")}>
                    Max
                  </button>
                </div>
              </div>
              <div className="trade-quote">
                <div className="row">
                  <span className="muted">Average price</span>
                  <span className="mono">
                    {price != null
                      ? `${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${decision.currency}`
                      : "—"}
                  </span>
                </div>
                <div className="row">
                  <span className="muted">{side === "Buy" ? "Estimated tokens" : "Collateral back"}</span>
                  <span className="mono">
                    {estimated != null
                      ? `${estimated.toFixed(4)} ${side === "Buy" ? (buyingToken ? decision.token : decision.currency ?? decision.token) : collateral}`
                      : "—"}
                  </span>
                </div>
                <div className="row">
                  <span className="muted">Impact</span>
                  <span className="mono">{decision.impact} sample</span>
                </div>
                <div className="row">
                  <span className="muted">Max slippage</span>
                  <span className="mono">1.0%</span>
                </div>
                <div className="row">
                  <span className="muted">Protocol settlement fee</span>
                  <span className="mono">0.00 {collateral}</span>
                </div>
              </div>
              <table className="view-map">
                <thead>
                  <tr>
                    <th />
                    <th>If YES</th>
                    <th>If NO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Bullish</th>
                    <td className={side === "Buy" && outcome === "YES" ? "on" : ""}>Buy</td>
                    <td className={side === "Sell" && outcome === "NO" ? "on" : ""}>Sell</td>
                  </tr>
                  <tr>
                    <th>Bearish</th>
                    <td className={side === "Sell" && outcome === "YES" ? "on" : ""}>Sell</td>
                    <td className={side === "Buy" && outcome === "NO" ? "on" : ""}>Buy</td>
                  </tr>
                </tbody>
              </table>
              <p className="trade-note">
                <span aria-hidden="true">i</span>
                YES and NO pools price {decision.token}
                {decision.currency ? ` in ${decision.currency}` : ""}. Nothing here is submitted.
              </p>
              <button className="btn" type="button">
                {side} {outcome}
                <span className="btn-stance">{view}</span>
              </button>
              {decision.status === "resolved" && decision.result && (
                <p className="trade-foot">Winning outcome {decision.result}. Redeem is available after resolution.</p>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export function Deep() {
  const [row, setRow] = useState(deepRows[0].repo);
  const [fileName, setFileName] = useState("");
  const [sold, setSold] = useState(false);
  const [exited, setExited] = useState(false);
  const [walletMode, setWalletMode] = useState<"add" | "withdraw">("add");
  const [view, setView] = useState<"live" | "charts" | "board" | "trades">("live");
  const [chartRange, setChartRange] = useState("1W");
  const [chartHidden, setChartHidden] = useState<string[]>([]);
  const [chartHover, setChartHover] = useState<{ x: number; t: number; flip: boolean } | null>(null);
  const [boardReady, setBoardReady] = useState(false);
  const [boardRange, setBoardRange] = useState("All");
  const [boardQuery, setBoardQuery] = useState("");
  const [boardHit, setBoardHit] = useState("");
  const [jumpYou, setJumpYou] = useState(false);
  const youRankRef = useRef<HTMLTableRowElement>(null);
  const [phase, setPhase] = useState<"connect" | "trade" | "fund">("connect");
  const [panel, setPanel] = useState(false);
  const [fund, setFund] = useState("100");
  const [added, setAdded] = useState(0);
  const [addedNote, setAddedNote] = useState("");
  const current = deepRows.find((item) => item.repo === row) ?? deepRows[0];
  const diff = current.youUp - current.mktUp;
  const fundAmount = Number(fund) || 0;
  const scale = boardScale(boardRange);
  const ranked = deepBoard
    .map((item) => ({
      ...item,
      volume: item.volume * scale,
      roi: item.roi * (boardRange === "Day" ? 0.35 : boardRange === "Week" ? 0.6 : boardRange === "Month" ? 0.85 : 1),
      pnl: item.pnl * scale,
    }))
    .sort((a, b) => b.pnl - a.pnl)
    .map((item, index) => ({ ...item, rank: index + 1 }))
    .filter((item) => !boardHit || item.wallet.toLowerCase().includes(boardHit.toLowerCase()));

  useEffect(() => {
    if (!panel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

  useEffect(() => {
    if (view !== "board") return;
    setBoardReady(false);
    const id = window.setTimeout(() => setBoardReady(true), 1200);
    return () => window.clearTimeout(id);
  }, [view]);

  useEffect(() => {
    if (!jumpYou || !boardReady) return;
    youRankRef.current?.scrollIntoView({ block: "center" });
    setJumpYou(false);
  }, [jumpYou, boardReady, boardHit]);

  return (
    <div>
      <p className="kicker">Deep · Optimism · sUSDS</p>
      <div className="round-title">
        <h1 className="question">Round 3 Originality</h1>
        <span className="live">Live</span>
        <a
          className="doc-link"
          href="https://docs.seer.pm"
          onClick={(event) => event.preventDefault()}
        >
          Documentation
          <span aria-hidden="true">→</span>
        </a>
        <div className={panel ? "round-action is-hidden" : "round-action"}>
          <button
            type="button"
            className="btn"
            aria-expanded={panel}
            aria-hidden={panel}
            tabIndex={panel ? -1 : 0}
            onClick={() => {
              if (phase === "connect") {
                setPhase("trade");
                setPanel(true);
                return;
              }
              setPanel(true);
            }}
          >
            {phase === "fund" ? "Deep Wallet" : phase === "trade" ? "Set up trade account" : "Connect"}
          </button>
        </div>
      </div>
      {panel && (
        <div className="round-scrim" onClick={() => setPanel(false)}>
          <div
            className="round-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={phase === "fund" ? "wallet-title" : "trade-account-title"}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="round-close" aria-label="Close" onClick={() => setPanel(false)}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {phase === "trade" ? (
              <>
                <h2 id="trade-account-title">Set up trade account</h2>
                <p>
                  A forecast sits in a trade account, separate from the wallet you connect. This preview does not create one.
                </p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setPhase("fund");
                    setPanel(true);
                  }}
                >
                  Set up trade account
                </button>
              </>
            ) : (
              <>
                <h2 id="wallet-title">{walletMode === "add" ? "Add sUSDS" : "Withdraw tokens"}</h2>
                <div className="wallet-switch" role="group" aria-label="Deep Wallet">
                  <button
                    type="button"
                    className={walletMode === "add" ? "on" : ""}
                    aria-pressed={walletMode === "add"}
                    onClick={() => setWalletMode("add")}
                  >
                    Add sUSDS
                  </button>
                  <button
                    type="button"
                    className={walletMode === "withdraw" ? "on" : ""}
                    aria-pressed={walletMode === "withdraw"}
                    onClick={() => setWalletMode("withdraw")}
                  >
                    Withdraw tokens
                  </button>
                </div>
                <p>
                  {walletMode === "add"
                    ? "Move sUSDS into the trade wallet before taking a position. Nothing leaves this page."
                    : "Move sUSDS out of the trade wallet. Nothing leaves this page."}
                </p>
                <div className="row">
                  <span className="muted">Available</span>
                  <span className="mono">
                    {walletMode === "add"
                      ? "1,420.50"
                      : added.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    sUSDS
                  </span>
                </div>
                <div className="field">
                  <input
                    inputMode="decimal"
                    aria-label="sUSDS amount"
                    value={fund}
                    onChange={(event) => setFund(event.target.value.replace(/[^\d.]/g, ""))}
                  />
                  <span>sUSDS</span>
                </div>
                <div className="presets">
                  {["25", "100", "500"].map((item) => (
                    <button key={item} type="button" onClick={() => setFund(item)}>
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={fundAmount <= 0 || (walletMode === "withdraw" && fundAmount > added)}
                  onClick={() => {
                    if (walletMode === "withdraw") {
                      setAdded((value) => Math.max(0, value - fundAmount));
                      setAddedNote(`Withdrew ${fundAmount.toLocaleString("en-US")} sUSDS.`);
                      return;
                    }
                    setAdded((value) => value + fundAmount);
                    setAddedNote(`Added ${fundAmount.toLocaleString("en-US")} sUSDS.`);
                  }}
                >
                  {walletMode === "add" ? "Add sUSDS" : "Withdraw tokens"}
                </button>
                <p className="note">
                  Trade wallet holds {added.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sUSDS.
                  {addedNote ? ` ${addedNote} Sample only.` : " Sample only."}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      <p className="lede">
        Say how much of a repository is original work. UP plus DOWN reads as one.
      </p>
      <div className="round-stats">
        <div>
          <span>Total liquidity</span>
          <strong className="mono">48,200 sUSDS</strong>
        </div>
        <div>
          <span>Trading volume</span>
          <strong className="mono">12,640 sUSDS</strong>
        </div>
      </div>
      <div className="kind-switch">
        <div className="tabs">
          {(
            [
              ["live", "Round Live"],
              ["charts", "Round Charts"],
              ["board", "Leaderboard"],
              ["trades", "User trades"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "on" : ""} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="layout two" style={{ marginTop: 22 }}>
        {view === "live" && (
        <section className="panel">
          <p className="muted">
            Each repository trades as a pair. UP is original work. DOWN is the share carried by dependencies.
          </p>
          <div className="pair-table">
            <table>
              <thead>
                <tr>
                  <th rowSpan={2}>Repository</th>
                  <th colSpan={3} className="up">UP · Original work</th>
                  <th colSpan={3} className="down">DOWN · Dependencies</th>
                </tr>
                <tr>
                  <th>Your</th>
                  <th>Market</th>
                  <th>Difference</th>
                  <th>Your</th>
                  <th>Market</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {deepRows.map((item) => {
                  const gap = item.youUp - item.mktUp;
                  const downGap = -gap;
                  return (
                    <tr
                      key={item.repo}
                      className={item.repo === row ? "on" : ""}
                      tabIndex={0}
                      onClick={() => setRow(item.repo)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setRow(item.repo);
                        }
                      }}
                    >
                      <td>{item.repo}</td>
                      <td className="mono">{share(item.youUp)}</td>
                      <td className="mono">{share(item.mktUp)}</td>
                      <td className={gap >= 0 ? "diff pos mono" : "diff neg mono"}>
                        {gap > 0 ? "+" : ""}
                        {share(gap)}
                      </td>
                      <td className="mono">{share(1 - item.youUp)}</td>
                      <td className="mono">{share(1 - item.mktUp)}</td>
                      <td className={downGap >= 0 ? "diff pos mono" : "diff neg mono"}>
                        {downGap > 0 ? "+" : ""}
                        {share(downGap)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            {current.repo} · UP difference {diff > 0 ? "+" : ""}
            {share(diff)} · DOWN difference {-diff > 0 ? "+" : ""}
            {share(-diff)}.
          </p>
        </section>
        )}
        {view === "charts" && (
          <section className="panel">
            <h2>Share of original work</h2>
            <div className="seg" style={{ marginTop: 12 }}>
              {["1D", "1W", "1M", "All"].map((item) => (
                <button key={item} type="button" className={chartRange === item ? "on" : ""} onClick={() => setChartRange(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="chart-split">
              <div
                className="deep-chart"
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const svg = event.currentTarget.querySelector("svg");
                  if (!svg) return;
                  const box = svg.getBoundingClientRect();
                  const scale = box.width / 640;
                  const local = (event.clientX - box.left) / scale;
                  const t = (local - chartPlot.l) / (chartPlot.r - chartPlot.l);
                  if (t < 0 || t > 1) {
                    setChartHover(null);
                    return;
                  }
                  const x = event.clientX - rect.left;
                  setChartHover({ x, t, flip: x > rect.width * 0.62 });
                }}
                onPointerLeave={() => setChartHover(null)}
              >
                <svg viewBox="0 0 640 280" preserveAspectRatio="none" role="img" aria-label="UP prices for the repositories in this round">
                  {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((mark) => (
                    <g key={mark}>
                      <line
                        x1={chartPlot.l}
                        x2={chartPlot.r}
                        y1={chartY(mark)}
                        y2={chartY(mark)}
                        stroke="rgba(255,255,255,0.08)"
                      />
                      <text x={chartPlot.l - 8} y={chartY(mark) + 4} textAnchor="end" className="chart-axis">
                        {share(mark)}
                      </text>
                    </g>
                  ))}
                  {deepSeries.map((item, index) =>
                    chartHidden.includes(item.repo) ? null : (
                      <path
                        key={item.repo}
                        d={deepChartPath(item.up, chartRange, index)}
                        fill="none"
                        stroke={deepColors[index % deepColors.length]}
                        strokeWidth={1.7}
                      />
                    ),
                  )}
                  {chartHover && (
                    <line
                      x1={chartX(chartHover.t)}
                      x2={chartX(chartHover.t)}
                      y1={chartPlot.t}
                      y2={chartPlot.b}
                      stroke="rgba(255,255,255,0.35)"
                    />
                  )}
                </svg>
                {chartHover && (
                  <div className={chartHover.flip ? "chart-tip is-left" : "chart-tip"} style={{ left: chartHover.x }}>
                    {deepSeries
                      .map((item, index) => ({ item, index, value: deepValue(item.up, chartRange, index, chartHover.t) }))
                      .filter((entry) => !chartHidden.includes(entry.item.repo))
                      .sort((a, b) => b.value - a.value)
                      .map((entry) => (
                        <div key={entry.item.repo}>
                          <i style={{ background: deepColors[entry.index % deepColors.length] }} />
                          <span>{entry.item.repo}</span>
                          <span className="mono">{share(entry.value)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="chart-side">
                <div className="chart-side-list">
                  {deepSeries.map((item, index) => {
                    const off = chartHidden.includes(item.repo);
                    return (
                      <button
                        key={item.repo}
                        type="button"
                        className={off ? "off" : ""}
                        aria-pressed={!off}
                        onClick={() =>
                          setChartHidden((current) =>
                            current.includes(item.repo) ? current.filter((name) => name !== item.repo) : [...current, item.repo],
                          )
                        }
                      >
                        <i style={{ background: deepColors[index % deepColors.length] }} />
                        <span>{item.repo}</span>
                        <span className="mono">{share(item.up)}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setChartHidden(chartHidden.length === 0 ? deepSeries.map((item) => item.repo) : [])}
                >
                  {chartHidden.length === 0 ? "Hide all" : "Show all"}
                </button>
              </div>
            </div>
          </section>
        )}
        {view === "board" && (
          <section className="panel">
            <h2>Leaderboard</h2>
            {!boardReady ? (
              <p className="board-loading">Loading the leaderboard. On Seer this can take a while.</p>
            ) : (
              <>
                <p className="muted">Placeholder ranks. These are not live wallets. Score stays empty in this preview.</p>
                <div className="board-tools">
                  <div className="seg">
                    {["Day", "Week", "Month", "All"].map((item) => (
                      <button key={item} type="button" className={boardRange === item ? "on" : ""} onClick={() => setBoardRange(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                  <form
                    className="board-search"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setBoardHit(boardQuery.trim());
                    }}
                  >
                    <input
                      className="search"
                      placeholder="Wallet"
                      aria-label="Search wallets"
                      value={boardQuery}
                      onChange={(event) => setBoardQuery(event.target.value)}
                    />
                    <button type="submit" className="ghost">
                      Search
                    </button>
                  </form>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setBoardQuery("");
                      setBoardHit("");
                      setJumpYou(true);
                    }}
                  >
                    Your rank
                  </button>
                </div>
                <div className="board-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Wallet</th>
                        <th>Volume</th>
                        <th>ROI</th>
                        <th>Profit/Loss</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.length === 0 ? (
                        <tr>
                          <td colSpan={6}>No wallets match that search.</td>
                        </tr>
                      ) : (
                        ranked.map((item) => (
                          <tr key={item.wallet} className={item.you ? "you" : ""} ref={item.you ? youRankRef : undefined}>
                            <td className="mono">{item.rank}</td>
                            <td className="mono">
                              {item.wallet}
                              {item.you && <span className="you-tag">Your rank</span>}
                            </td>
                            <td className="mono">{item.volume.toLocaleString("en-US", { maximumFractionDigits: 0 })} sUSDS</td>
                            <td className={item.roi >= 0 ? "diff pos mono" : "diff neg mono"}>
                              {item.roi >= 0 ? "+" : ""}
                              {(item.roi * 100).toFixed(1)}%
                            </td>
                            <td className={item.pnl >= 0 ? "diff pos mono" : "diff neg mono"}>
                              {item.pnl >= 0 ? "+" : ""}
                              {item.pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sUSDS
                            </td>
                            <td className="muted mono">--</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
        {view === "trades" && (
          <section className="panel">
            <h2>User trades</h2>
            <p className="muted">Sample trades. Nothing here was submitted.</p>
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Repository</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {deepTrades.map((item) => (
                  <tr key={`${item.wallet}-${item.repo}`}>
                    <td className="mono">{item.wallet}</td>
                    <td>{item.repo}</td>
                    <td>{item.side}</td>
                    <td className="mono">{item.amount}</td>
                    <td className="muted">{item.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <aside className="ticket">
          <h2>Predictions</h2>
          <label className="drop">
            Upload predictions
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
          </label>
          <p className="note">
            {fileName
              ? `${fileName} staged. Sample only. Nothing was uploaded.`
              : "No predictions loaded. A CSV of repository weights is the upload. Nothing is sent."}
          </p>
          <button className="btn" type="button" onClick={() => setSold(true)}>
            Start trading
          </button>
          {sold && <p className="note">Preview only. Nothing was traded.</p>}
          <button className="ghost" type="button" onClick={() => setExited(true)}>
            Sell all positions
          </button>
          {exited && <p className="note">Preview only. No positions were sold.</p>}
        </aside>
      </div>
      <section className="archives">
        <p className="kicker">Archived</p>
        <h2>Explore previous rounds</h2>
        <p className="muted">Completed rounds. Seer keeps these in the archive.</p>
        <div className="archive-list">
          {deepArchive.map((item) => (
            <button type="button" className="archive-round" key={item}>
              {item}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Opportunity() {
  const boardRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLElement>(null);
  const archiveRef = useRef<HTMLElement>(null);
  const [pick, setPick] = useState(contestants[0].name);
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [amount, setAmount] = useState("50.00");
  const [forecast, setForecast] = useState("");
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [staged, setStaged] = useState("");
  const [more, setMore] = useState(false);
  const entry = contestants.find((item) => item.name === pick) ?? contestants[0];
  const stake = Number(amount);
  const shares = Number.isFinite(stake) && stake > 0 ? stake / entry.odds : 0;

  useEffect(() => {
    if (!naming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNaming(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [naming]);

  function addStake(step: number) {
    setAmount(((Number(amount) || 0) + step).toFixed(2));
  }

  return (
    <div className="opp">
      <nav className="opp-nav" aria-label="Opportunity">
        <button type="button" onClick={() => boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Curate
        </button>
        <button type="button" onClick={() => flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Workflow
        </button>
        <button type="button" onClick={() => archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Archives
        </button>
        <a href="https://docs.seer.pm" onClick={(event) => event.preventDefault()}>
          Docs
        </a>
      </nav>

      <section className="opp-flow" ref={flowRef} aria-label="Contest workflow">
        {["Entries", "Traders set odds", "Price triages field", "Sponsor decides", "Traders settle P&L"].map(
          (step, index) => (
            <div key={step}>
              <b>{index + 1}</b>
              <span>{step}</span>
              {index < 4 && <i aria-hidden="true">›</i>}
            </div>
          ),
        )}
      </section>

      <section className="opp-hero">
        <div className="opp-hero-top">
          <div>
            <div className="opp-kicker">
              <span className="opp-live">LIVE CONTEST</span>
              <span>•</span>
              <span>Gnosis Chain</span>
              <span>•</span>
              <span>About 235 outcomes</span>
            </div>
            <h1 className="question">Seer AI Job Board Name</h1>
          </div>
          <div className="opp-metrics">
            <div>
              <span>Liquidity</span>
              <strong>~$2,390</strong>
              <small>(captured example)</small>
            </div>
            <div>
              <span>Volume</span>
              <strong>~$8,259</strong>
              <small>(captured example)</small>
            </div>
          </div>
        </div>
        <div className="opp-prize">
          <strong>$1,000</strong>
          <p>if Seer can use the name. The earliest suggestion wins the rights once it is paid.</p>
          <button type="button" className="btn" onClick={() => setNaming(true)}>
            Submit Name
          </button>
        </div>
        {staged && <p className="note">{staged} staged. Sample only. Nothing was submitted.</p>}
      </section>

      <div className="opp-board" ref={boardRef}>
        <section>
          <div className="opp-board-head">
            <h2>
              Ranked Candidates <span className="opp-count">235 Total</span>
            </h2>
            <span className="opp-sort">Sorted by Implied Odds</span>
          </div>
          <div className="opp-list">
            {contestants.map((item, index) => {
              const selected = item.name === pick;
              return (
                <div
                  key={item.name}
                  className={selected ? "opp-row on" : "opp-row"}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPick(item.name)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPick(item.name);
                    }
                  }}
                >
                  <div className="opp-who">
                    <span className="opp-rank">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="opp-name">
                        {selected && <span className="opp-dot" aria-hidden="true" />}
                        <h3>{item.name}</h3>
                        {selected && <span className="opp-badge">Active Choice</span>}
                      </div>
                      <p>
                        Submitted by {item.by} • {item.when}
                      </p>
                    </div>
                  </div>
                  <div className="opp-side">
                    <div className="opp-odds">
                      <div>
                        <span>Odds</span>
                        <b>{pct(item.odds)}</b>
                      </div>
                      <div className="opp-track" aria-hidden="true">
                        <span style={{ width: pct(item.odds) }} />
                      </div>
                    </div>
                    <div className="opp-price">
                      <b>{pct(item.odds)}</b>
                      <small>~${item.odds.toFixed(3)} sDAI</small>
                    </div>
                    <button
                      type="button"
                      className={selected ? "opp-trade on" : "opp-trade"}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPick(item.name);
                      }}
                    >
                      Trade
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="opp-more">
              <span>
                {more
                  ? "This preview lists 10 of 235 sample names."
                  : "… and 225 more candidate names submitted"}
              </span>
              <button type="button" onClick={() => setMore(true)}>
                View All 235 Candidates
              </button>
            </div>
          </div>
        </section>

        <aside className="opp-ticket">
          <div className="ticket">
            <div className="opp-head">
              <div>
                <span>Active Outcome</span>
                <h2>{entry.name}</h2>
              </div>
              <div>
                <span>Implied Odds</span>
                <strong className="opp-implied">{pct(entry.odds)}</strong>
              </div>
            </div>
            <div className="seg" role="group" aria-label="Side">
              {(["Buy", "Sell"] as const).map((item) => (
                <button key={item} type="button" className={side === item ? "on" : ""} onClick={() => setSide(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="opp-collateral">
              <span>Collateral Currency</span>
              <b>sDAI (Gnosis)</b>
            </div>
            <div>
              <div className="opp-amount-label">
                <span>Amount</span>
                <span>
                  Bal: <b>$4,820.50 sDAI</b>
                </span>
              </div>
              <div className="field opp-field">
                <input
                  inputMode="decimal"
                  aria-label="sDAI amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                />
                <span>sDAI</span>
              </div>
            </div>
            <div className="presets">
              {[1, 5, 10, 100].map((item) => (
                <button key={item} type="button" onClick={() => addStake(item)}>
                  +{item}
                </button>
              ))}
            </div>
            <div className="opp-est">
              <div className="row">
                <span className="muted">Est. Outcome Shares</span>
                <span className="mono">{shares.toFixed(2)} Shares</span>
              </div>
              <div className="row">
                <span className="muted">Potential Return if selected</span>
                <span className="mono opp-return">${shares.toFixed(2)} sDAI</span>
              </div>
              <div className="row">
                <span className="muted">Slippage Tolerance</span>
                <span className="mono">0.5%</span>
              </div>
            </div>
            <button
              className="btn"
              type="button"
              disabled={!Number.isFinite(stake) || stake <= 0}
              onClick={() =>
                setForecast(`${side} ${stake.toFixed(2)} sDAI on ${entry.name}. Preview only. Nothing was sent.`)
              }
            >
              Submit Forecast (sDAI)
            </button>
            {forecast && <p className="note">{forecast}</p>}
            <p className="fine">
              Orders are executed against the crowd pool on Gnosis Chain. Sponsor resolution awards the prize once terms are met.
            </p>
          </div>
          <div className="opp-note">
            <p>
              Suggesting an entry early locks in your timestamp. If the sponsor adopts the name, early suggesters claim priority distribution.
            </p>
          </div>
        </aside>
      </div>

      <section className="opp-past" ref={archiveRef}>
        <div className="opp-past-head">
          <div>
            <h2>Resolved & Past Contests</h2>
            <p className="muted">Explore community curation decisions and past prize distributions.</p>
          </div>
          <button type="button" className="opp-link" onClick={() => archiveRef.current?.scrollIntoView({ behavior: "smooth" })}>
            View Archive →
          </button>
        </div>
        <div className="opp-archive">
          <article className="opp-card">
            <div className="opp-win">
              <div>
                <span className="opp-flag resolved">RESOLVED</span>
                <h3>Seer Rebrand Contest</h3>
                <p className="muted">About $1,110 liquidity (captured example) • 144 image submissions</p>
              </div>
              <b>80.1% Win</b>
            </div>
            <div className="opp-pick">
              <span>
                Selected: <strong>Electric Foundation</strong>
              </span>
              <span>Resolved on-chain</span>
            </div>
            <div className="opp-tiles three">
              {["Electric Fdn", "Prism Node", "Aether Mark"].map((item) => (
                <div className="opp-tile wide" key={item}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="opp-card">
            <div className="opp-win">
              <div>
                <span className="opp-flag archived">ARCHIVED</span>
                <h3>Seer Merch for Devcon Mumbai</h3>
                <p className="muted">18 image submissions • $0 liquidity (captured example)</p>
              </div>
              <b className="quiet">Curated</b>
            </div>
            <div className="opp-pick">
              <span>
                Adopted Line: <strong>Obsidian Technical Hoodie</strong>
              </span>
              <span>Community Pick</span>
            </div>
            <div className="opp-tiles four">
              {["Hoodie", "Patch", "Tote", "Stickers"].map((item) => (
                <div className="opp-tile sq" key={item}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <p className="opp-line">Today Seer One runs these contests; later anyone will be able to launch one.</p>

      {naming && (
        <div className="round-scrim" onClick={() => setNaming(false)}>
          <div
            className="round-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-name-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="round-close" aria-label="Close" onClick={() => setNaming(false)}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <h2 id="submit-name-title">Submit Name</h2>
            <p>An early suggestion keeps its timestamp. This preview does not send the name.</p>
            <div className="field">
              <input
                aria-label="Candidate name"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn"
              disabled={!draft.trim()}
              onClick={() => {
                setStaged(draft.trim());
                setDraft("");
                setNaming(false);
              }}
            >
              Submit Name
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function samplePd(n: number) {
  return `${n.toFixed(2)}%`;
}

export function Foresight() {
  const total = riskCohorts.reduce((sum, cohort) => sum + cohort.assets.length, 0);

  return (
    <div className="fs">
      <section className="fs-epoch">
        <div className="seg" role="group" aria-label="Epoch">
          <button className="on" type="button">
            Q3 2026 <span className="fs-ended">Ended</span>
          </button>
          <button type="button" disabled>
            Q4 2026 <span>(Coming soon)</span>
          </button>
        </div>
        <div className="fs-status">
          <span className="fs-dot" aria-hidden="true" />
          <span>Risk book status:</span>
          <b>Closed for quarter</b>
          <span>
            Trading ended <b>30 Sep 2026 23:59 UTC</b>
          </span>
        </div>
      </section>

      <section className="fs-main">
        <div className="fs-thesis">
          <p className="kicker">Actuarial Inquiry #03-26</p>
          <h1 className="question">What is the chance that nothing in this basket defaults?</h1>
          <div className="fs-joints">
            <div>
              <span>Joint No-to-All Probability (Annual)</span>
              <p>
                <strong>46.52%</strong>
                <small>PD annualised</small>
              </p>
              <em>Product of surviving 33 distinct default thresholds over a 365-day risk term.</em>
            </div>
            <div>
              <span>Joint No-to-All Probability (Quarterly)</span>
              <p>
                <strong className="quarter">82.59%</strong>
                <small>PD quarter horizon</small>
              </p>
              <em>Calibrated survival expectation for the completed Q3 evaluation epoch.</em>
            </div>
          </div>
          <div className="fs-rules">
            <div>
              <b>Capital Efficiency</b>
              <span>The same capital covers every asset in the basket.</span>
            </div>
            <div>
              <b>Approved Collateral</b>
              <span>xDAI, sDAI, or Foresight credits on Gnosis.</span>
            </div>
            <div>
              <b>Position Rule</b>
              <span>The trade wallet is created once. Positions cannot be closed before resolution.</span>
            </div>
          </div>
        </div>
        <aside className="fs-upload">
          <div className="fs-upload-head">
            <span>Actuarial Ingestion</span>
            <span className="fs-archived">Archived</span>
          </div>
          <h2>Upload CSV Predictions</h2>
          <p>Batch submission of probability vectors is disabled. Q3 settlement verification underway.</p>
          <div className="fs-lock">
            <span aria-hidden="true">Locked</span>
            <b>Upload CSV Predictions (Closed/Archived)</b>
            <p>Positions cannot be closed before resolution. The trade wallet is created once.</p>
          </div>
          <div className="row">
            <span className="muted">Resolution Oracle</span>
            <span className="mono">seer.actuarial.v2</span>
          </div>
        </aside>
      </section>

      <section className="fs-legend" aria-label="Default intensity scale">
        <div className="fs-legend-head">
          <span>Default Intensity Scale & Calibration Tiers</span>
          <div>
            <span><b>Low:</b> 0% – 2%</span>
            <span><b>Moderate:</b> 2% – 5%</span>
            <span><b>High:</b> 5% – 10%</span>
            <span><b>Critical:</b> &gt; 10%</span>
          </div>
        </div>
        <div className="fs-bar" aria-hidden="true">
          <span className="low" />
          <span className="mod" />
          <span className="high" />
          <span className="crit" />
        </div>
        <div className="fs-ticks">
          <span>0.0%</span>
          <span>2.0%</span>
          <span>5.0%</span>
          <span>10.0%</span>
          <span>100.0%</span>
        </div>
      </section>

      <section className="fs-ledger">
        <div className="fs-ledger-head">
          <div>
            <h2>Actuarial Ledger — Closed Book</h2>
            <p className="muted">Displaying all {total} collateral constituent assets across 4 capital cohorts.</p>
          </div>
          <p>
            Total Basket Constituents: <b>{total}</b>
          </p>
        </div>
        <div className="pair-table">
          <table className="fs-table">
            <thead>
              <tr>
                <th>Asset / Ticker</th>
                <th>Category</th>
                <th>Probability of Default Scale</th>
                <th>Annual PD (Sample)</th>
                <th>Quarterly PD (Sample)</th>
              </tr>
            </thead>
            <tbody>
              {riskCohorts.map((cohort, index) => (
                <Fragment key={cohort.title}>
                  <tr className="fs-cohort">
                    <td colSpan={5}>
                      {index + 1}. {cohort.title} ({cohort.assets.length} constituents)
                    </td>
                  </tr>
                  {cohort.assets.map((item) => (
                    <tr key={item.ticker}>
                      <td className="mono">{item.ticker}</td>
                      <td className="muted">{item.category}</td>
                      <td>
                        <span className="fs-pd" aria-hidden="true">
                          <i style={{ width: `${Math.min(item.annual * 10, 100)}%` }} />
                        </span>
                      </td>
                      <td className="mono fs-num">{samplePd(item.annual)}</td>
                      <td className="mono fs-num muted">{samplePd(item.quarterly)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fs-foot">
          Probability figures reflect sample reference markers at epoch close. Resolution model: deterministic consensus zero-default rule.
        </p>
      </section>
    </div>
  );
}
