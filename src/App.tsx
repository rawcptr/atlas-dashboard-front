import { SidebarProvider } from "@/components/ui/sidebar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
// import "./App.css";
import Compute from "./components/compute";
import Config from "./components/config";
import Layers from "./components/layers";
import Overview from "./components/overview";
import { AppSidebar } from "./components/sidebar";
import { SocketManager } from "./socketManager";

function Main({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar title={title} />
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SocketManager domain={window.location.hostname} />
      <Main title="Atlas">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/layers/:id" element={<Layers />} />
          <Route path="/compute" element={<Compute />} />
          <Route path="/config" element={<Config />}></Route>
        </Routes>
      </Main>
    </BrowserRouter>
  );
}

export default App;
