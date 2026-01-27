import "./mocks/insights";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import App from "../../src/App"; // Make sure this path is correct relative to standalone-entry.tsx

// --- Mock/Standalone Shell Components ---
export const StandaloneHeader: React.FC = () => (
  <header>
    <h1>Migration Assessment App (Standalone) </h1>
    <nav>
      <Link to="/"> Home </Link>
      <Link to="/inventory"> Inventory </Link>
      <Link to="/assessments"> Assessments </Link>
      <Link to="/issues"> Issues </Link>
    </nav>
  </header>
);

export const StandaloneFooter: React.FC = () => (
  <footer>
    <p>&copy; {new Date().getFullYear()} Red Hat, Inc. All Rights Reserved.</p>
  </footer>
);

// --- Standalone App Wrapper ---
export const StandaloneAppWrapper: React.FC = () => {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <StandaloneHeader />
      <main>
        <Routes>
          <Route path="/openshift/migration-assessment/*" element={<App />} />
        </Routes>
      </main>
      <StandaloneFooter />
    </BrowserRouter>
  );
};

// --- DOM Rendering ---
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <StandaloneAppWrapper />
    </React.StrictMode>,
  );
} else {
  console.error(
    'Root element #root not found in the DOM. Ensure public/standalone.html has <div id="root"></div>',
  );
}
