import React, { useState } from "react";
import { ThemeProvider } from "./components/ui/theme-provider";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Search from "./components/Search";
import Install from "./components/Install";
import { Toaster } from "./components/ui/toaster";

type PageType = "home" | "search" | "install";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [installPackage, setInstallPackage] = useState<string>("");

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <Home
            setCurrentPage={setCurrentPage}
            setInstallPackage={setInstallPackage}
          />
        );
      case "search":
        return (
          <Search
            setCurrentPage={setCurrentPage}
            setInstallPackage={setInstallPackage}
          />
        );
      case "install":
        return <Install />;
      default:
        return (
          <Home
            setCurrentPage={setCurrentPage}
            setInstallPackage={setInstallPackage}
          />
        );
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="arch-pm-theme">
      <div className="min-h-screen bg-background text-foreground select-none">
        <Navbar setCurrentPage={setCurrentPage} />
        <main className="container mx-auto px-4 py-8">{renderPage()}</main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
};

export default App;
