import "./App.css";
import Header from "./components/header";
import { Landing } from "./components/landing";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Header></Header>
      <Landing />
    </ThemeProvider>
  );
}

export default App;
