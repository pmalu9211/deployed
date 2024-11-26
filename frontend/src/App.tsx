import "./App.css";
import Footer from "./components/Footer";
import Header from "./components/header";
import { Landing } from "./components/landing";
import { ThemeProvider } from "./components/theme-provider";
import LandingPage from "./pages/LandingPage";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route
          path="/home"
          element={
            <>
              <Header />
              <Landing />
              <Footer />
            </>
          }
        ></Route>
        <Route path="*" element={<>Page Not found</>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
