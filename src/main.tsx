import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import '@/components/analytics/chartSetup';

createRoot(document.getElementById("root")!).render(
	<>
		<App />
		<Analytics />
		<SpeedInsights />
	</>
);
