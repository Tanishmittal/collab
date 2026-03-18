import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize performance monitoring (only in production)
if (process.env.NODE_ENV === "production") {
  try {
    // Dynamically import Sentry to avoid build errors if not installed
    import("./lib/sentry").then(({ initSentry }) => {
      initSentry();
    });
  } catch (error) {
    console.warn("Sentry not available");
  }
}

createRoot(document.getElementById("root")!).render(<App />);
