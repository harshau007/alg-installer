import React, { useState, useEffect, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GetInstalledPackages,
  UninstallPackage,
} from "../../wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import { Label } from "./ui/label";

const Install = () => {
  const [installedPackages, setInstalledPackages] = useState<
    main.InstalledPackage[]
  >([]);
  const [filteredPackages, setFilteredPackages] = useState<
    main.InstalledPackage[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchInstalledPackages();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [searchTerm, installedPackages]);

  const fetchInstalledPackages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const packages = await GetInstalledPackages();
      setInstalledPackages(packages);
      filterPackages(packages); // Ensure filtering is applied
    } catch (err) {
      console.error("Error fetching installed packages:", err);
      setError("Failed to fetch installed packages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterPackages = (
    packages: main.InstalledPackage[] = installedPackages
  ) => {
    const filtered = packages.filter((pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPackages(filtered);
  };

  const handleUninstall = async (packageName: string) => {
    try {
      await UninstallPackage(packageName);
      // Refresh the list of packages
      fetchInstalledPackages();
    } catch (err) {
      console.error("Error uninstalling package:", err);
      setError(`Failed to uninstall ${packageName}. Please try again.`);
    }
  };

  const PackageItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const pkg = filteredPackages[index];
      return (
        <div style={style} className="p-4 mx-auto">
          <Card className="flex items-center p-4 rounded-lg">
            <div className="flex-grow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {pkg.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-1">
                  Version: {pkg.version}
                </CardDescription>
                <Label className="text-gray-500">
                  Last Updated: {pkg.lastupdated}
                </Label>
              </CardContent>
            </div>
            <Button
              onClick={() => handleUninstall(pkg.name)}
              variant="destructive"
              className="ml-4"
            >
              Uninstall
            </Button>
          </Card>
        </div>
      );
    },
    [filteredPackages]
  );

  const renderContent = () => {
    if (error) {
      return <div className="text-red-500 pl-2">{error}</div>;
    }

    return (
      <div className="h-[calc(100vh-200px)]">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              height={height}
              itemCount={filteredPackages.length}
              itemSize={200}
              width={width}
              layout="vertical"
            >
              {PackageItem}
            </List>
          )}
        </AutoSizer>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full">
      <h1 className="text-4xl font-bold pl-3 pr-3">Installed Packages</h1>
      <div className="flex space-x-4 pl-3 pr-3">
        <Input
          type="text"
          placeholder="Search installed packages..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="flex-grow"
        />
      </div>
      {renderContent()}
    </div>
  );
};

export default Install;
