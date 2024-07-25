import React, { useState, useCallback } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchPackage } from "../../wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import PackageDetails from "./PackageDetails";
import { Badge } from "./ui/badge";

interface SearchProps {
  setCurrentPage: (page: any) => void;
  setInstallPackage: (packageName: string) => void;
}

const Search: React.FC<SearchProps> = ({
  setCurrentPage,
  setInstallPackage,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<main.PackageInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<main.PackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (): Promise<void> => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term");
      return;
    }

    setSearchResults([]);
    setSelectedApp(null);
    setIsLoading(true);
    setError(null);

    try {
      const res = await SearchPackage(
        searchTerm.toLowerCase().trim().replace(/\s+/g, "-")
      );
      setSearchResults(res);
      if (res.length === 0) {
        setError("No results found");
      }
    } catch (error) {
      console.error("Error searching packages:", error);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleInstall = useCallback(
    (packageName: string): void => {
      setInstallPackage(packageName);
      setCurrentPage("install");
    },
    [setInstallPackage, setCurrentPage]
  );

  const CardItem = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }) => {
      const index = rowIndex * 3 + columnIndex;
      const result = searchResults[index];
      if (!result) return null;

      return (
        <div style={style} className="p-2">
          <Card
            className="h-full flex flex-col cursor-pointer"
            onClick={() => setSelectedApp(result)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{result.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                {result.description.length > 70
                  ? `${result.description.substring(0, 80)}...`
                  : result.description}
              </CardDescription>
              <p className="opacity-50 text-xs pt-2">
                Version: {result.version}
              </p>
            </CardContent>
            <CardFooter className="mt-1">
              {/* <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstall(result.name);
                }}
                className="w-full"
              >
                Install
              </Button> */}
              <Badge variant="secondary" className="text-sm">
                {result.repository}
              </Badge>
            </CardFooter>
          </Card>
        </div>
      );
    },
    [searchResults, handleInstall]
  );

  const renderContent = () => {
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
      return <div className="text-red-500 pl-2">{error}</div>;
    }

    // if (searchResults.length === 0 && !isLoading) {
    //   return <div>No results found. Try a different search term.</div>;
    // }

    return (
      <div className="h-[calc(100vh-200px)]">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => {
            const columnCount = width >= 1024 ? 3 : width >= 768 ? 3 : 1;
            const columnWidth = width / columnCount;
            const rowCount = Math.ceil(searchResults.length / columnCount);
            return (
              <Grid
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={250}
                width={width}
              >
                {CardItem}
              </Grid>
            );
          }}
        </AutoSizer>
      </div>
    );
  };

  return (
    <div className="space-y-8 h-full">
      {selectedApp ? (
        <PackageDetails
          app={selectedApp}
          onBack={() => setSelectedApp(null)}
          onInstall={() => handleInstall(selectedApp.name)}
        />
      ) : (
        <>
          <h1 className="text-4xl font-bold pl-2 pr-2">Search Packages</h1>
          <div className="flex space-x-4 pl-2 pr-2">
            <Input
              type="text"
              placeholder="Search for packages..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              onKeyDown={handleKeyPress}
              className="flex-grow"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          {renderContent()}
        </>
      )}
    </div>
  );
};

export default Search;
