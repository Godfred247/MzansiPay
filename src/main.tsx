import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { OnboardingProvider } from "./onboarding/context.tsx";
import { AppStateProvider } from "./state.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppStateProvider>
        <OnboardingProvider>
          <App />
        </OnboardingProvider>
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>,
);
