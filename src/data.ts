export type Outcome = { name: string; price: number };

export type Market = {
  id: string;
  question: string;
  kind: string;
  chain: string;
  collateral: string;
  status: string;
  verification: string;
  opening: string;
  liquidity: number;
  rewards?: boolean;
  futarchy?: boolean;
  parentId?: string;
  outcomes: Outcome[];
  note?: string;
};

export const markets: Market[] = [
  {
    id: "knesset",
    question:
      "Which party or joint electoral list will win the most seats in the Israeli Knesset?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports not open",
    verification: "verified",
    opening: "28 Oct 2026",
    liquidity: 27580,
    rewards: true,
    outcomes: [
      { name: "Yashar", price: 0.66 },
      { name: "Likud", price: 0.32 },
      { name: "Others", price: 0.01 },
      { name: "Together Alliance", price: 0.01 },
      { name: "Invalid", price: 0.005 },
    ],
  },
  {
    id: "basefee",
    question: "What will Ethereum base fee be, between 0.1 and 120 gwei?",
    kind: "Scalar",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports open",
    verification: "verified",
    opening: "12 Nov 2026",
    liquidity: 8400,
    outcomes: [
      { name: "UP", price: 0.41 },
      { name: "DOWN", price: 0.59 },
    ],
    note: "Scalar sample. UP and DOWN split a number inside the range.",
  },
  {
    id: "seats",
    question: "How many seats will [party] win in the National Assembly?",
    kind: "Multi-scalar",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "waiting for answer",
    verification: "verifying",
    opening: "4 Sep 2026",
    liquidity: 3100,
    outcomes: [
      { name: "0–50", price: 0.08 },
      { name: "51–150", price: 0.22 },
      { name: "151–250", price: 0.47 },
      { name: "251+", price: 0.18 },
      { name: "Invalid", price: 0.05 },
    ],
  },
  {
    id: "nested",
    question: "If Yashar leads, will turnout exceed 70%?",
    kind: "Conditional",
    parentId: "knesset",
    chain: "Base",
    collateral: "USDC",
    status: "in dispute",
    verification: "not verified",
    opening: "1 Aug 2026",
    liquidity: 640,
    outcomes: [
      { name: "Yes", price: 0.37 },
      { name: "No", price: 0.55 },
      { name: "Invalid", price: 0.08 },
    ],
    note: "Sample conditional. If the parent outcome misses, these tokens redeem at 0.",
  },
  {
    id: "lepen",
    question: "Will Marine Le Pen be the National Rally’s candidate in the next French presidential election?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "verified",
    opening: "2 Mar 2026",
    liquidity: 7170,
    outcomes: [
      { name: "Yes", price: 0.85 },
      { name: "No", price: 0.14 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "rally-yes",
    question: "Will the National Rally’s candidate win the next French presidential election?",
    kind: "Conditional",
    parentId: "lepen",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "verified",
    opening: "2 Mar 2026",
    liquidity: 7540,
    rewards: true,
    outcomes: [
      { name: "Yes", price: 0.32 },
      { name: "No", price: 0.67 },
      { name: "Invalid", price: 0.01 },
    ],
    note: "Sample conditional on Marine Le Pen being the candidate.",
  },
  {
    id: "rally-no",
    question: "Will the National Rally’s candidate win the next French presidential election?",
    kind: "Conditional",
    parentId: "lepen",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "verified",
    opening: "2 Mar 2026",
    liquidity: 1240,
    outcomes: [
      { name: "Yes", price: 0.26 },
      { name: "No", price: 0.73 },
      { name: "Invalid", price: 0.01 },
    ],
    note: "Sample conditional on Marine Le Pen not being the candidate.",
  },
  {
    id: "polymarket-fix",
    question: "Will Polymarket publicly release a fix for the negative-risk mint and merge cost basis issue before 1 January 2027?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports open",
    verification: "verified",
    opening: "18 Jan 2026",
    liquidity: 1180,
    outcomes: [
      { name: "Yes", price: 0.48 },
      { name: "No", price: 0.51 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "polymarket-positions",
    question: "Will Polymarket's API allow retrieval of fees paid per individual position by 1 January 2027?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports not open",
    verification: "verified",
    opening: "18 Jan 2026",
    liquidity: 1170,
    outcomes: [
      { name: "Yes", price: 0.5 },
      { name: "No", price: 0.49 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "polymarket-oracle",
    question: "Will Polymarket use an oracle other than UMA to resolve at least one subjective market before 1 January 2027?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports open",
    verification: "verifying",
    opening: "18 Jan 2026",
    liquidity: 1150,
    outcomes: [
      { name: "Yes", price: 0.34 },
      { name: "No", price: 0.65 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "polymarket-fees",
    question: "Will Polymarket's public API provide a documented endpoint for total fees paid by an individual user by 1 January 2027?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports not open",
    verification: "verified",
    opening: "18 Jan 2026",
    liquidity: 1130,
    outcomes: [
      { name: "Yes", price: 0.3 },
      { name: "No", price: 0.69 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "kurdish",
    question: "Will any Kurdish militant group launch a confirmed armed attack inside Iran in 2026?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports not open",
    verification: "verified",
    opening: "1 Jan 2026",
    liquidity: 1120,
    outcomes: [
      { name: "Yes", price: 0.09 },
      { name: "No", price: 0.9 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "notes",
    question: "How many Polymarket clarification notes published before 1 January 2027 will move a market by at least 25 points within 24 hours?",
    kind: "Scalar",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "verified",
    opening: "18 Jan 2026",
    liquidity: 1110,
    outcomes: [
      { name: "UP", price: 0.42 },
      { name: "DOWN", price: 0.58 },
    ],
    note: "Scalar sample. The range on the Seer market is 10 to 50 notes.",
  },
  {
    id: "greenland-treaty",
    question: "Will a treaty transferring sovereignty over Greenland from Denmark to the United States enter into force in 2026?",
    kind: "Categorical",
    chain: "Base",
    collateral: "USDC",
    status: "reports not open",
    verification: "not verified",
    opening: "1 Jan 2026",
    liquidity: 1100,
    outcomes: [
      { name: "Yes", price: 0.05 },
      { name: "No", price: 0.94 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "greenland-hostilities",
    question: "Will the United States enter into armed hostilities with a NATO country over Greenland in 2026?",
    kind: "Categorical",
    chain: "Base",
    collateral: "USDC",
    status: "reports not open",
    verification: "verified",
    opening: "1 Jan 2026",
    liquidity: 1100,
    outcomes: [
      { name: "Yes", price: 0.01 },
      { name: "No", price: 0.98 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "polymarket-lawsuit",
    question: "Will a court rule against Polymarket in a lawsuit over an incorrect market resolution by the end of 2026?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "in dispute",
    verification: "challenged",
    opening: "11 Apr 2026",
    liquidity: 1080,
    outcomes: [
      { name: "Yes", price: 0.1 },
      { name: "No", price: 0.89 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "polymarket-token",
    question: "Will Polymarket distribute a transferable token to existing users before 1 January 2027?",
    kind: "Categorical",
    chain: "Ethereum",
    collateral: "DAI",
    status: "reports not open",
    verification: "verified",
    opening: "18 Jan 2026",
    liquidity: 1030,
    rewards: true,
    outcomes: [
      { name: "Yes", price: 0.15 },
      { name: "No", price: 0.84 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "clarity",
    question: "Will the Digital Asset Market Clarity Act be approved by the U.S. Senate in 2026?",
    kind: "Categorical",
    chain: "OP Mainnet",
    collateral: "USDC",
    status: "reports open",
    verification: "verified",
    opening: "3 Feb 2026",
    liquidity: 919,
    outcomes: [
      { name: "Yes", price: 0.32 },
      { name: "No", price: 0.67 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "maxwell",
    question: "Will Donald Trump issue an official presidential pardon for Ghislaine Maxwell by 31 December 2026?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "pending execution",
    verification: "verified",
    opening: "20 Jan 2026",
    liquidity: 818,
    outcomes: [
      { name: "Yes", price: 0.06 },
      { name: "No", price: 0.93 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "gta",
    question: "Will GTA 6 achieve the highest first-day unit sales of any GTA game?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "challenged",
    opening: "1 Jun 2026",
    liquidity: 758,
    outcomes: [
      { name: "Yes", price: 0.8 },
      { name: "No", price: 0.19 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "senate",
    question: "Which party will win the most seats in the United States Senate elections in 2026?",
    kind: "Categorical",
    chain: "OP Mainnet",
    collateral: "USDC",
    status: "reports not open",
    verification: "verified",
    opening: "3 Nov 2026",
    liquidity: 639,
    outcomes: [
      { name: "Democratic Party", price: 0.63 },
      { name: "Republican Party", price: 0.35 },
      { name: "Other", price: 0.01 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "sbf",
    question: "Will Sam Bankman-Fried receive a U.S. presidential pardon in 2026?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports not open",
    verification: "verified",
    opening: "20 Jan 2026",
    liquidity: 592,
    outcomes: [
      { name: "Yes", price: 0.05 },
      { name: "No", price: 0.94 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "hicp",
    question: "What was the HICP inflation rate in the European Union for 2025?",
    kind: "Scalar",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "closed",
    verification: "verified",
    opening: "15 Jan 2026",
    liquidity: 73,
    outcomes: [
      { name: "UP", price: 0.74 },
      { name: "DOWN", price: 0.26 },
    ],
    note: "Closed sample. The published Seer range is 0 to 4.",
  },
  {
    id: "eur-tvl",
    question: "Which blockchain will have the highest euro stablecoin value locked on 31 December 2026?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports not open",
    verification: "verifying",
    opening: "31 Dec 2026",
    liquidity: 540,
    outcomes: [
      { name: "Ethereum", price: 0.9 },
      { name: "Solana", price: 0.04 },
      { name: "Other", price: 0.05 },
      { name: "Invalid", price: 0.01 },
    ],
  },
  {
    id: "grants",
    question: "Should the sample grants proposal pass?",
    kind: "Categorical",
    chain: "Gnosis",
    collateral: "sDAI",
    status: "reports open",
    verification: "verified",
    opening: "9 May 2026",
    liquidity: 4200,
    rewards: true,
    futarchy: true,
    outcomes: [
      { name: "YES", price: 0.62 },
      { name: "NO", price: 0.37 },
      { name: "Invalid", price: 0.01 },
    ],
    note: "Sample futarchy decision. YES and NO price the proposal.",
  },
];

export const statuses = [
  "reports not open",
  "reports open",
  "waiting for answer",
  "in dispute",
  "pending execution",
  "closed",
];

export const verifications = ["verified", "verifying", "challenged", "not verified"];

export const chains = ["Gnosis", "Ethereum", "OP Mainnet", "Base"];

export const orgs = [
  { id: "gnosis", name: "Gnosis DAO", count: "5 in this preview" },
  { id: "kleros", name: "Kleros DAO", count: "4 resolved" },
  { id: "ethereum", name: "Ethereum", count: "1 open" },
  { id: "velora", name: "VeloraDAO", count: "none" },
  { id: "aave", name: "Aave DAO", count: "none" },
];

export type Decision = {
  id: string;
  org: string;
  title: string;
  token: string;
  currency?: string;
  pair: string;
  chain: string;
  status: "open" | "awaiting" | "resolved";
  result?: "YES" | "NO";
  yes?: number;
  no?: number;
  impact: string;
  rule?: string;
  blurb?: string;
  volume?: string;
  tvl?: string;
  when?: string;
  vote?: string;
};

export const organizations = [
  {
    name: "Gnosis DAO",
    chain: "Gnosis",
    unit: "xDAI",
    liquidity: true,
    about:
      "Gnosis builds innovative projects in payments, identity, and internet freedom, driving change and shaping the future of decentralized technology.",
  },
  { name: "Kleros DAO", chain: "Gnosis", liquidity: true },
  { name: "Ethereum", chain: "Gnosis" },
  { name: "VeloraDAO", chain: "Ethereum" },
  { name: "Aave DAO", chain: "Ethereum" },
];

export const decisionOrgs = organizations.map((item) => item.name);

export const decisions: Decision[] = [
  {
    id: "eip-8363",
    org: "Ethereum",
    title: "What will the impact on ETH price be if EIP-8363 is Scheduled for Inclusion in Hegotá?",
    token: "WETH",
    currency: "USDS",
    pair: "WETH/USDS",
    chain: "Gnosis",
    status: "open",
    yes: 2385.58,
    no: 2385.62,
    impact: "-0.00%",
    rule: "5-day TWAP of conditional ETH prices, 9–14 Oct 2026. Include if YES is above NO by more than 1%, exclude if NO is above YES by more than 1%, and stay neutral inside that band.",
    blurb:
      "The YES and NO pools price ETH in USDS. The gap is this sample’s estimate of the EIP’s impact. Binding resolution text would sit in the Reality.eth question.",
  },
  {
    id: "gip-152",
    org: "Gnosis DAO",
    title: "What will the impact on GNO price be if GIP-152 is passed?",
    token: "GNO",
    currency: "sDAI",
    pair: "GNO/sDAI",
    chain: "Gnosis",
    status: "awaiting",
    yes: 84.77,
    no: 84.77,
    impact: "0.00%",
    volume: "0 sDAI",
    tvl: "0",
    when: "Ended 12 Aug 2026",
    vote: "Approved",
    blurb:
      "Will GIP-152 (spin out the Gnosis App into an independent company) be passed by GnosisDAO? Resolves Yes if it passes; otherwise No.",
  },
  {
    id: "kip-90",
    org: "Kleros DAO",
    title: "What will the impact on PNK price be if KIP-90 is approved?",
    token: "PNK",
    pair: "PNK",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    impact: "+0.68%",
  },
  {
    id: "gip-151",
    org: "Gnosis DAO",
    title: "What will the impact on GNO price be if GIP-151 is passed?",
    token: "GNO",
    currency: "sDAI",
    pair: "GNO/sDAI",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    yes: 82.99,
    no: 82.99,
    impact: "+0.00%",
  },
  {
    id: "kip-88",
    org: "Kleros DAO",
    title: "What will the impact on PNK price be if KIP-88 is approved?",
    token: "PNK",
    pair: "PNK",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    impact: "+0.91%",
  },
  {
    id: "kip-86",
    org: "Kleros DAO",
    title: "What will the impact on PNK price be if KIP-86 is approved?",
    token: "PNK",
    pair: "PNK",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    impact: "+0.94%",
  },
  {
    id: "gip-149",
    org: "Gnosis DAO",
    title: "What will the impact on GNO price be if GIP-149 is approved?",
    token: "GNO",
    currency: "sDAI",
    pair: "GNO/sDAI",
    chain: "Gnosis",
    status: "resolved",
    result: "NO",
    yes: 90.38,
    no: 92.55,
    impact: "-2.35%",
  },
  {
    id: "gip-145",
    org: "Gnosis DAO",
    title: "What will the impact on GNO price be if GIP-145 is approved?",
    token: "GNO",
    currency: "sDAI",
    pair: "GNO/sDAI",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    yes: 103.27,
    no: 101.24,
    impact: "+1.96%",
    volume: "115.44K sDAI",
    tvl: "0.0004",
    when: "Resolved 17 Feb 2026",
    vote: "Approved",
    rule: "5-day TWAP. Approve if YES is more than 1% above NO, reject if it is more than 1% below, otherwise neutral. Sample TWAP impact +1.81%.",
    blurb:
      "Will GIP-145 (advisory futarchy pilot with $100k temporary liquidity) be approved or rejected by GnosisDAO?",
  },
  {
    id: "kip-81",
    org: "Kleros DAO",
    title: "What will be the price of PNK if KIP-81 is approved?",
    token: "PNK",
    pair: "PNK",
    chain: "Gnosis",
    status: "resolved",
    result: "NO",
    impact: "+99.98%",
  },
  {
    id: "gip-153",
    org: "Gnosis DAO",
    title: "What will the impact on GNO price be if GIP-153 is passed?",
    token: "GNO",
    currency: "sDAI",
    pair: "GNO/sDAI",
    chain: "Gnosis",
    status: "resolved",
    result: "YES",
    yes: 90.08,
    no: 90.34,
    impact: "-0.29%",
  },
];

export const deepRows = [
  { repo: "alloy-rs", youUp: 0.78, mktUp: 0.72 },
  { repo: "reth", youUp: 0.84, mktUp: 0.81 },
  { repo: "foundry", youUp: 0.88, mktUp: 0.9 },
  { repo: "wagmi", youUp: 0.65, mktUp: 0.62 },
  { repo: "viem", youUp: 0.82, mktUp: 0.85 },
];

export const deepArchive = [
  "Zcash NU7",
  "Zcash Grants",
  "Octant",
  "Round 2 L2",
  "Round 2 L1",
  "Round 2 Originality",
  "Round 1",
];

export const contestants = [
  { name: "Earnode", odds: 0.151, by: "0x82f…d49", when: "2 days ago" },
  { name: "delegateyourjob.ai", odds: 0.065, by: "vitaly.eth", when: "1 day ago" },
  { name: "Zetsu.AI", odds: 0.05, by: "0x3a1…bb0", when: "3 days ago" },
  { name: "Wageware", odds: 0.042, by: "0x4f2…81c", when: "2 days ago" },
  { name: "Workmesh", odds: 0.038, by: "nodekeeper", when: "4 days ago" },
  { name: "CW", odds: 0.031, by: "0x981…ef2", when: "1 day ago" },
  { name: "Foreguild", odds: 0.029, by: "0x112…cc4", when: "5 days ago" },
  { name: "WorkX", odds: 0.024, by: "anonymous", when: "2 days ago" },
  { name: "Seek", odds: 0.02, by: "0x301…99e", when: "6 days ago" },
  { name: "Auspex", odds: 0.018, by: "augur.eth", when: "3 days ago" },
];

export const riskCohorts: {
  title: string;
  assets: { ticker: string; category: string; annual: number; quarterly: number }[];
}[] = [
  {
    title: "ETH-based Assets",
    assets: [
      { ticker: "weETH", category: "ETH-based Liquid Restaking", annual: 1.4, quarterly: 0.35 },
      { ticker: "stETH", category: "ETH-based Liquid Staking", annual: 0.82, quarterly: 0.21 },
      { ticker: "ETH+", category: "ETH-based Composite Yield", annual: 1.92, quarterly: 0.49 },
      { ticker: "bsdETH", category: "ETH-based Liquid Staking", annual: 2.25, quarterly: 0.57 },
      { ticker: "rETH", category: "ETH-based Decentralized Staking", annual: 0.91, quarterly: 0.23 },
      { ticker: "pufETH", category: "ETH-based Liquid Restaking", annual: 2.84, quarterly: 0.72 },
      { ticker: "avETH", category: "ETH-based Synthetic Wrap", annual: 3.15, quarterly: 0.8 },
    ],
  },
  {
    title: "USD Pegged & Fiat-Backing",
    assets: [
      { ticker: "PYUSD", category: "USD Centralized / Regulated", annual: 0.45, quarterly: 0.11 },
      { ticker: "RLUSD", category: "USD Enterprise Escrow", annual: 0.58, quarterly: 0.15 },
      { ticker: "USDC", category: "USD Regulated Reserve", annual: 0.28, quarterly: 0.07 },
      { ticker: "USD1", category: "USD Algorithmic Hybrid", annual: 4.4, quarterly: 1.12 },
      { ticker: "USDS", category: "USD Decentralized Mint", annual: 1.02, quarterly: 0.26 },
      { ticker: "USDT", category: "USD Offshore Reserve", annual: 1.18, quarterly: 0.3 },
      { ticker: "RUSD", category: "USD Yield Backed", annual: 2.5, quarterly: 0.64 },
      { ticker: "USDF", category: "USD Institutional Pool", annual: 1.8, quarterly: 0.46 },
      { ticker: "avUSD", category: "USD Synthetic CDP", annual: 3.2, quarterly: 0.81 },
      { ticker: "NUSD", category: "USD Delta-Neutral", annual: 3.82, quarterly: 0.97 },
      { ticker: "iUSD", category: "USD Lending Derivative", annual: 2.95, quarterly: 0.75 },
      { ticker: "satUSD+", category: "USD Bitcoin Staked Synthetic", annual: 4.8, quarterly: 1.23 },
      { ticker: "USDO", category: "USD Treasury Overcollateralized", annual: 1.5, quarterly: 0.38 },
    ],
  },
  {
    title: "BTC Wraps & Cross-Chain",
    assets: [
      { ticker: "BTCB", category: "BTC Custodial Bridge", annual: 1.35, quarterly: 0.34 },
      { ticker: "solvBTC", category: "BTC Yield Protocol Wrap", annual: 3.6, quarterly: 0.92 },
      { ticker: "tBTC", category: "BTC Threshold Multi-Sig Bridge", annual: 1.12, quarterly: 0.28 },
      { ticker: "cbBTC", category: "BTC Institutional Cold Storage", annual: 0.62, quarterly: 0.16 },
      { ticker: "LBTC", category: "BTC Liquid Staking Protocol", annual: 2.75, quarterly: 0.7 },
      { ticker: "UBTC", category: "BTC Unified Settlement Asset", annual: 2.1, quarterly: 0.53 },
    ],
  },
  {
    title: "Structured Institutional Funds",
    assets: [
      { ticker: "GACLO-1", category: "Structured Credit Tranched Note", annual: 3.9, quarterly: 0.99 },
      { ticker: "BUIDL-I", category: "Tokenized US Treasury Liquidity", annual: 0.36, quarterly: 0.09 },
      { ticker: "JAAA", category: "CLO AAA Senior Tranche Fund", annual: 1.2, quarterly: 0.3 },
      { ticker: "JTRSY", category: "Short Duration Sovereign Debt", annual: 0.48, quarterly: 0.12 },
      { ticker: "mF-ONE", category: "Institutional Money Market Index", annual: 0.72, quarterly: 0.18 },
      { ticker: "STAC", category: "Short Term Asset Credit Note", annual: 2.3, quarterly: 0.58 },
      { ticker: "U", category: "Private Credit Aggregator Unit", annual: 3.5, quarterly: 0.89 },
    ],
  },
];

export function pct(n: number) {
  const value = n * 100;
  const digits = Math.abs(value) >= 1 ? 1 : 2;
  return `${value.toFixed(digits)}%`;
}

export function usd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 100 ? 2 : 0,
  });
}

export function band(pd: number) {
  if (pd < 2) return "low";
  if (pd < 5) return "moderate";
  if (pd < 10) return "high";
  return "critical";
}
