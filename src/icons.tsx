const explorers: Record<string, string> = {
  Ethereum: "https://etherscan.io",
  Gnosis: "https://gnosisscan.io",
  "OP Mainnet": "https://optimistic.etherscan.io",
  Base: "https://basescan.org",
};

export function ChainLink({ name }: { name: string }) {
  return (
    <a
      className="chain"
      href={explorers[name]}
      target="_blank"
      rel="noreferrer"
      title="View contract in explorer"
      onClick={(event) => event.stopPropagation()}
    >
      <ChainIcon name={name} />
      {name}
    </a>
  );
}

export function ChainIcon({ name }: { name: string }) {
  if (name === "Ethereum") {
    return (
      <svg className="chain-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="#627EEA" d="M8 1 3.2 8.1 8 10.6l4.8-2.5L8 1Z" />
        <path fill="#C4D2F8" d="M8 11.4 3.2 8.9 8 15l4.8-6.1L8 11.4Z" />
      </svg>
    );
  }
  if (name === "Gnosis") {
    return (
      <svg className="chain-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="#04795B" />
        <circle cx="5.7" cy="7.1" r="1.7" fill="#fff" />
        <circle cx="10.3" cy="7.1" r="1.7" fill="#fff" />
        <circle cx="5.7" cy="7.2" r="0.7" fill="#04795B" />
        <circle cx="10.3" cy="7.2" r="0.7" fill="#04795B" />
        <path d="M8 8.6 6.7 10.6h2.6L8 8.6Z" fill="#fff" />
      </svg>
    );
  }
  if (name === "OP Mainnet") {
    return (
      <svg className="chain-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="#FF0420" />
        <circle cx="8" cy="8" r="3.1" fill="none" stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "Base") {
    return (
      <svg className="chain-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="#0052FF" />
        <rect x="4.3" y="4.3" width="7.4" height="7.4" rx="1.7" fill="#fff" />
      </svg>
    );
  }
  return null;
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.7 9.6 5.7l4.4.4-3.3 2.9 1 4.3L8 11.2 4.3 13.3l1-4.3L2 6.1l4.4-.4L8 1.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
