// PackageDetails.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { main } from "wailsjs/go/models";
import { SearchLocalPackage } from "../../wailsjs/go/main/App";
import ErrorBoundary from "./ErrorBoundary";
import { Skeleton } from "./ui/skeleton";

interface PackageDetailsProps {
  app: main.PackageInfo | null;
  onBack: () => void;
  onInstall: (appName: string) => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({
  app,
  onBack,
  onInstall,
}) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkIfInstalled = useCallback(async (appName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const isExist = await SearchLocalPackage(appName);
      setIsInstalled(isExist);
    } catch (err) {
      setError("Failed to check if package is installed");
      console.error("Error checking package installation:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (app && app.name) {
      checkIfInstalled(app.name);
    }
  }, [app, checkIfInstalled]);

  const handleInstall = () => {
    if (app && app.name) {
      onInstall(app.name);
    }
  };

  const renderDependencies = (dependencies: string[] | undefined) => {
    if (!dependencies || dependencies.length === 0) {
      return <p>No dependencies listed.</p>;
    }
    return (
      <ul className="list-disc pl-5">
        {dependencies.map((dependency) => (
          <li key={dependency}>{dependency}</li>
        ))}
      </ul>
    );
  };

  const renderInstallButton = () => {
    if (isLoading) {
      return <Button disabled>Checking...</Button>;
    }
    if (isInstalled) {
      return (
        <Button className="opacity-50 pointer-events-none">
          <Download className="mr-2 h-4 w-4" /> Installed
        </Button>
      );
    }
    return (
      <Button onClick={handleInstall}>
        <Download className="mr-2 h-4 w-4" /> Install
      </Button>
    );
  };

  if (!app) {
    return <div>No package information available</div>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-2 pr-2">
        {Array.from({ length: 9 }, (_, i) => (
          <Card key={i} className="h-[15rem] flex flex-col">
            <CardHeader>
              <Skeleton className="h-9 w-[250px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardContent>
            <CardFooter className="mt-10">
              <Skeleton className="h-7 rounded-full w-[50px]" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <ErrorBoundary>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={onBack} className="p-3">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {renderInstallButton()}
          </div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-3xl">
                    {app.name || "N/A"}
                  </CardTitle>
                  <CardDescription>
                    {app.description || "No description available."}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg pb-1.5 px-3">
                  {app.repository || "Unknown"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Version", value: app.version },
                  { label: "Maintainer", value: app.maintainer },
                  { label: "Last Updated", value: app.lastupdated },
                  { label: "Upstream URL", value: app.upstreamurl },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || "N/A"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{app.description || "No description available."}</p>
              <Separator className="my-4" />
              <h3 className="font-semibold mb-2">Dependencies</h3>
              {renderDependencies(app.dependlist)}
              <Separator className="my-4" />
              <h3 className="font-semibold mb-2">Installation Instructions</h3>
              <p>Detailed installation instructions would go here...</p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Please ensure your system meets the minimum requirements before
                installation.
              </p>
            </CardFooter>
          </Card>
        </div>
      </ScrollArea>
    </ErrorBoundary>
  );
};

export default PackageDetails;
