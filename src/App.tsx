import { SidebarProvider } from "@/components/ui/sidebar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
      <AppSidebar title={title} />
      {/* <SidebarTrigger /> */}
      <main className="flex-1">{children}</main>
    </SidebarProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SocketManager domain={window.location.hostname} port={3000} />
      <Main title="Atlas">
        <Routes>
          <Route path="/" element={<Overview />} />
          {/* <Route path="/layers/:id" element={<Layers />} /> */}
          {/* <Route path="/config" element={<Config />}></Route> */}
        </Routes>
      </Main>
    </BrowserRouter>
  );
}

export default App;
