import React from "react";
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

interface PackageDetailsProps {
  app: main.PackageInfo;
  onBack: () => void;
  onInstall: () => void;
}

const PackageDetails: React.FC<PackageDetailsProps> = ({
  app,
  onBack,
  onInstall,
}) => {
  // Helper function to safely render dependencies
  const renderDependencies = () => {
    if (!app.dependlist || app.dependlist.length === 0) {
      return <p>No dependencies listed.</p>;
    }
    return (
      <ul className="list-disc pl-5">
        {app.dependlist.map((dependency, index) => (
          <li key={index}>{dependency}</li>
        ))}
      </ul>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onBack} className="p-3">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onInstall}>
            <Download className="mr-2 h-4 w-4" /> Install
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{app.name || "N/A"}</CardTitle>
                <CardDescription>
                  {app.description || "No description available."}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg pb-1.5 pr-3 pl-3">
                {app.repository || "Unknown"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">{app.version || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maintainer</p>
                <p className="font-medium">{app.maintainer || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{app.lastupdated || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upstream URL</p>
                <p className="font-medium">{app.upstreamurl || "N/A"}</p>
              </div>
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
            {renderDependencies()}
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
  );
};

export default PackageDetails;
