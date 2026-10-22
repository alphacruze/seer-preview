import { useEffect } from "react";
import { Deep, Foresight, Futarchy, Markets, Opportunity, Portal } from "./pages";
import { Shell, useRoute } from "./shell";

const titles: Record<string, string> = {
  "/": "Seer preview",
  "/markets": "Markets · Seer preview",
  "/futarchy": "Futarchy · Seer preview",
  "/deep": "Deep · Seer preview",
  "/opportunity": "Opportunity · Seer preview",
  "/foresight": "Foresight · Seer preview",
};

export default function App() {
  const route = useRoute();
  useEffect(() => {
    document.title = titles[route] ?? "Seer preview";
  }, [route]);

  return (
    <Shell route={route}>
      {route === "/" && <Portal />}
      {route === "/markets" && <Markets />}
      {route === "/futarchy" && <Futarchy />}
      {route === "/deep" && <Deep />}
      {route === "/opportunity" && <Opportunity />}
      {route === "/foresight" && <Foresight />}
    </Shell>
  );
}
