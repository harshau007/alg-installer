import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FixedSizeGrid as Grid } from "react-window";
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
import {
  GetAvailableUpdates,
  HumanReadableSize,
  UpdateAllPkg,
  UpdateSinglePkg,
} from "../../wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { ArrowUpCircle } from "lucide-react";

const Updates: React.FC = () => {
  const [availableUpdates, setAvailableUpdates] = useState<main.UpdateInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [totalDownloadSize, setTotalDownloadSize] = useState<string>("");
  const [readableSizes, setReadableSizes] = useState<{ [key: string]: string }>(
    {}
  );
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);

  const fetchAvailableUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const updates = await GetAvailableUpdates();
      setAvailableUpdates(updates);
      const totalSize = updates.reduce(
        (acc, update) => acc + update.downloadSize,
        0
      );
      const readableSize = await HumanReadableSize(totalSize);
      setTotalDownloadSize(readableSize);
      setError(null);
    } catch (err) {
      console.error("Error fetching available updates:", err);
      setError("Failed to fetch available updates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSinglePackageUpdate = async (pkg: string) => {
    await UpdateSinglePkg(pkg);
  };

  const handleAllPackageUpdate = async () => {
    setButtonLoading(true);
    await UpdateAllPkg();
    setButtonLoading(false);
  };

  useEffect(() => {
    fetchAvailableUpdates();
    const intervalId = setInterval(fetchAvailableUpdates, 5000);
    return () => clearInterval(intervalId);
  }, [fetchAvailableUpdates]);

  useEffect(() => {
    const fetchSizes = async () => {
      const sizes: { [key: string]: string } = {};
      for (const update of availableUpdates) {
        sizes[update.name] = await HumanReadableSize(update.downloadSize);
      }
      setReadableSizes(sizes);
    };
    fetchSizes();
  }, [availableUpdates]);

  const filteredUpdates = useMemo(() => {
    return availableUpdates.filter((update) =>
      update.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableUpdates, searchTerm]);

  const UpdateItem = useCallback(
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
      const update = filteredUpdates[index];
      if (!update) return null;
      return (
        <div style={style} className="p-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>{update.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>
                Update available: {update.oldVersion} → {update.newVersion}
              </CardDescription>
              <p className="opacity-50 text-xs pt-2">
                Repository: {update.repository}
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <Badge variant="secondary" className="text-sm">
                {readableSizes[update.name] || "Calculating..."}
              </Badge>
              <Button onClick={() => handleSinglePackageUpdate(update.name)}>
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                Update
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    },
    [filteredUpdates]
  );

  const renderContent = useMemo(() => {
    if (isLoading && availableUpdates.length === 0) {
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
              <CardFooter className="mt-10 justify-between">
                <Skeleton className="h-7 w-[80px]" />
                <Skeleton className="h-7 w-[30px] rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 pl-2">{error}</div>;
    }

    if (filteredUpdates.length === 0) {
      return (
        <div className="text-green-500 pl-3">All packages are up to date!</div>
      );
    }

    return (
      <div className="h-[calc(100vh-200px)]">
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => {
            const columnCount = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
            const columnWidth = width / columnCount;
            const rowCount = Math.ceil(filteredUpdates.length / columnCount);
            return (
              <Grid
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={250}
                width={width}
              >
                {UpdateItem}
              </Grid>
            );
          }}
        </AutoSizer>
      </div>
    );
  }, [isLoading, error, filteredUpdates, UpdateItem, availableUpdates.length]);

  return (
    <div className="space-y-6 h-full">
      <h1 className="text-4xl font-bold pl-3 pr-3">Available Updates</h1>
      <div className="flex space-x-4 pl-3 pr-3">
        <Input
          type="text"
          placeholder="Search available updates..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="flex-grow"
        />
        {buttonLoading ? (
          <Button className="opacity-50 pointer-events-none">
            <ArrowUpCircle className="h-5 w-5 mr-2" />
            Updating...
          </Button>
        ) : (
          <Button onClick={handleAllPackageUpdate} disabled={isLoading}>
            <ArrowUpCircle className="h-5 w-5 mr-2" />
            Update All
          </Button>
        )}
      </div>
      {totalDownloadSize ? (
        <p className="text-sm text-muted-foreground pl-3">
          Total download size: {totalDownloadSize}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground pl-3">
          Total download size: Calculating...
        </p>
      )}
      {renderContent}
    </div>
  );
};

export default React.memo(Updates);
