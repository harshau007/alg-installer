import React, { useCallback, useEffect, useState } from "react";
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
import { CheckPackageInstalled } from "../../wailsjs/go/main/App";

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

const featuredApps: AppInfo[] = [
  {
    name: "firefox",
    description: "A fast, private and secure web browser",
    repository: "extra",
    version: "89.0.2",
    maintainer: "Mozilla",
    lastupdated: "2023-06-01",
    dependlist: [],
    upstreamurl: "",
  },
  {
    name: "gimp",
    description: "GNU Image Manipulation Program",
    repository: "extra",
    version: "2.10.38-1",
    maintainer: "Christian Hesse, Christian Heusel",
    lastupdated: "May 3, 2024, 9:48 a.m. UTC",
    dependlist: [
      "aalib",
      "babl",
      "bzip2",
      "cairo",
      "fontconfig",
      "freetype2",
      "gcc-libs",
      "gdk-pixbuf2",
      "gegl",
      "glib2",
      "glibc",
      "gtk2",
      "harfbuzz",
      "hicolor-icon-theme",
      "iso-codes",
      "json-glib",
      "lcms2",
      "libgexiv2",
      "libgudev",
      "libheif",
      "libjpeg-turbo",
      "libjxl",
      "libmng",
      "libmypaint",
      "libpng",
      "librsvg",
      "libtiff",
      "libunwind",
      "libwebp",
      "libwmf",
      "libx11",
      "libxcursor",
      "libxext",
      "libxfixes",
      "libxmu",
      "libxpm",
      "mypaint-brushes1",
      "openexr",
      "openjpeg2",
      "pango",
      "poppler-data",
      "poppler-glib",
      "xz",
      "zlib",
    ],
    upstreamurl: "https://www.gimp.org/",
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
    name: "visual-studio-code-bin",
    description: "Lightweight but powerful source code editor",
    repository: "AUR",
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
  {
    name: "zed",
    description:
      "A high-performance, multiplayer code editor from the creators of Atom and Tree-sitter",
    repository: "extra",
    version: "0.145.1-1",
    maintainer: "Caleb Maclennan",
    lastupdated: "July 24, 2024, 6:21 p.m. UTC",
    dependlist: [],
    upstreamurl: "https://zed.dev",
  },
];

const Home = () => {
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());

  const checkInstalledApps = useCallback(async () => {
    const installedSet = new Set<string>();
    for (const app of featuredApps) {
      try {
        const interval = setInterval(async () => {
          const isInstalled = await CheckPackageInstalled(app.name);
          if (isInstalled) {
            installedSet.add(app.name);
          }
        }, 3000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error(`Error checking if ${app.name} is installed:`, error);
      }
    }
    setInstalledApps(installedSet);
  }, []);

  useEffect(() => {
    checkInstalledApps();
  }, [checkInstalledApps]);

  const handleInstallStateChange = useCallback(() => {
    checkInstalledApps();
  }, [checkInstalledApps]);

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
          onInstallStateChange={handleInstallStateChange}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold pl-3 pr-3">Mentioned Packages</h1>
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
