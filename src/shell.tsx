import { useEffect, useState, type ReactNode } from "react";
import { ChainIcon } from "./icons";

const links = [
  { href: "#/markets", label: "Markets" },
  { href: "#/futarchy", label: "Futarchy" },
  { href: "#/deep", label: "Deep" },
  { href: "#/opportunity", label: "Opportunity" },
  { href: "#/foresight", label: "Foresight" },
];

export function useRoute() {
  const read = () => {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    return raw.startsWith("/") ? raw : `/${raw}`;
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    document.body.classList.toggle("landing", route === "/");
    return () => document.body.classList.remove("landing");
  }, [route]);
  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

const logoSrc = `${import.meta.env.BASE_URL}brand/seer-logo-white.svg`;

export function Logo() {
  return (
    <button
      type="button"
      className="logo"
      aria-label="Seer home"
      onClick={() => {
        if (window.location.hash !== "#/") window.location.hash = "#/";
      }}
    >
      <img src={logoSrc} alt="" />
    </button>
  );
}

export function Shell({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  return (
    <>
      <p className="banner">
        Beta. Every figure on these pages is a placeholder.
      </p>
      <header className={route === "/" ? "top landing" : "top"}>
        <Logo />
        {route === "/" ? (
          <>
            <nav className="menu">
              <a href="https://docs.seer.pm" target="_blank" rel="noreferrer">
                Documentation
              </a>
              <a href="https://seer-pm.medium.com/" target="_blank" rel="noreferrer">
                Blog
              </a>
            </nav>
            <a className="btn launch" href="#/markets">
              Launch App
            </a>
          </>
        ) : (
          <>
            <nav>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={route.startsWith(link.href.slice(1)) ? "on" : ""}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="account">
              <span className="preview-chip">Beta</span>
              <button type="button" className="net">
                <ChainIcon name="Gnosis" />
                Gnosis
                <svg viewBox="0 0 12 12" aria-hidden="true">
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
              <button type="button" className="btn connect">
                Connect wallet
              </button>
            </div>
          </>
        )}
      </header>
      <main>{children}</main>
      <footer className="site">
        <div className="site-grid">
          <div className="site-brand">
            <Logo />
            <p>
              A prediction marketplace. Create a market, trade outcome tokens,
              and redeem after an answer is bonded.
            </p>
            <a href="https://kleros.io/" target="_blank" rel="noreferrer">
              Secured by Kleros
            </a>
          </div>
          <div className="site-col">
            <p className="site-label">Product</p>
            <a href="#/markets">Markets</a>
            <a href="#/futarchy">Futarchy</a>
            <a href="#/deep">Deep</a>
            <a href="#/opportunity">Opportunity</a>
            <a href="#/foresight">Foresight</a>
          </div>
          <div className="site-col">
            <p className="site-label">Resources</p>
            <a href="https://docs.seer.pm" target="_blank" rel="noreferrer">
              Documentation
            </a>
            <a href="https://seer-pm.medium.com/" target="_blank" rel="noreferrer">
              Blog
            </a>
            <a
              href="https://drive.google.com/drive/folders/1EOGhjj_jHJ5PPt86VEDuGZ2dovJpfY-l"
              target="_blank"
              rel="noreferrer"
            >
              Images & branding
            </a>
            <a href="mailto:info@seer.pm">info@seer.pm</a>
          </div>
          <div className="site-col">
            <p className="site-label">Community</p>
            <a href="https://discord.com/invite/rBEB4MYQwV" target="_blank" rel="noreferrer">
              Discord
            </a>
            <a href="https://t.me/Seerpredictionmarket" target="_blank" rel="noreferrer">
              Telegram
            </a>
            <a href="https://x.com/seer_pm" target="_blank" rel="noreferrer">
              X
            </a>
            <a href="https://github.com/seer-pm" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <div className="site-bottom">
          <span>© 2026 Seer</span>
          <span>Reality.eth takes the answer. Kleros hears the dispute.</span>
        </div>
      </footer>
    </>
  );
}
