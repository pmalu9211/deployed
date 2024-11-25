import { useState } from "react";
import "./App.css";
import Header from "./components/header";
import { Landing } from "./components/landing";
import { ThemeProvider } from "./components/theme-provider";
import LandingPage from "./pages/LandingPage";

function App() {
  const [skipHome, setSkipHome] = useState(false);
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {skipHome ? (
        <>
          <Header />
          <Landing />
        </>
      ) : (
        <LandingPage setSkipHome={setSkipHome} />
      )}
    </ThemeProvider>
  );
}

export default App;
