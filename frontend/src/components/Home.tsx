import React, { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import PackageDetails from "./PackageDetails";
import ErrorBoundary from "./ErrorBoundary";

interface AppInfo {
  name: string;
  version: string;
  description: string;
  repository: string;
  maintainer: string;
  upstreamurl: string;
  dependlist: string[];
  lastupdated: string;
}

interface HomeProps {
  setCurrentPage: (page: "home" | "search" | "install") => void;
  setInstallPackage: (packageName: string) => void;
}

const featuredApps: AppInfo[] = [
  {
    name: "Firefox",
    description: "A fast, private and secure web browser",
    repository: "extra",
    version: "89.0.2",
    maintainer: "Mozilla",
    lastupdated: "2023-06-01",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "GIMP",
    description: "GNU Image Manipulation Program",
    repository: "core",
    version: "2.10.24",
    maintainer: "GIMP Team",
    lastupdated: "2023-05-15",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "VLC",
    description: "Free and open source cross-platform multimedia player",
    repository: "AUR",
    version: "3.0.16",
    maintainer: "VideoLAN",
    lastupdated: "2023-05-20",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "VSCode",
    description: "Lightweight but powerful source code editor",
    repository: "core",
    version: "1.57.0",
    maintainer: "Microsoft",
    lastupdated: "2023-06-10",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "LibreOffice",
    description: "Free and open source office suite",
    repository: "extra",
    version: "7.1.3",
    maintainer: "The Document Foundation",
    lastupdated: "2023-05-25",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "Blender",
    description: "3D creation suite",
    repository: "core",
    version: "2.93.0",
    maintainer: "Blender Foundation",
    lastupdated: "2023-06-05",
    dependlist: [],
    upstreamurl: "",
  },
];

const Home: React.FC<HomeProps> = ({ setCurrentPage, setInstallPackage }) => {
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  const handleInstall = useCallback(
    (packageName: string) => {
      setInstallPackage(packageName);
      setCurrentPage("install");
    },
    [setInstallPackage, setCurrentPage]
  );

  const handleBack = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const handleSelectApp = useCallback((app: AppInfo) => {
    setSelectedApp({ ...app });
  }, []);

  if (selectedApp) {
    return (
      <ErrorBoundary>
        <PackageDetails
          app={selectedApp}
          onBack={handleBack}
          onInstall={() => handleInstall(selectedApp.name)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map((app, index) => (
              <Card
                key={index}
                className="h-full flex flex-col cursor-pointer"
                onClick={() => handleSelectApp(app)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{app.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>
                    {app.description && app.description.length > 70
                      ? `${app.description.substring(0, 80)}...`
                      : app.description}
                  </CardDescription>
                  <p className="opacity-50 text-xs pt-2">
                    Version: {app.version}
                  </p>
                </CardContent>
                <CardFooter className="mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {app.repository}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </ErrorBoundary>
  );
};

export default Home;
