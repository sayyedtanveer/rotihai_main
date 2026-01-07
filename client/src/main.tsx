// CRITICAL: Patch global fetch FIRST to handle VITE_API_URL substitution for all API calls
import "./lib/globalFetchPatch";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
