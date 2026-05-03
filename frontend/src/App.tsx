import "./App.css";
import { Outlet } from "@tanstack/react-router";

import { TopBar } from "@/components/TopBar";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Outlet />
    </div>
  );
}

export default App;
