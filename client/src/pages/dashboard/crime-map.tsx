import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Map, AlertTriangle, Navigation, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface CrimeStats {
  totalCrimes: number;
  severity: number;
  safetyLevel: string;
  trend: string;
  crimesByType: { type: string; count: number }[];
}

export default function CrimeMapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: crimeStats, isLoading: statsLoading } = useQuery<CrimeStats>({
    queryKey: ["/api/crime/stats", userLocation?.lat, userLocation?.lng],
    enabled: !!userLocation,
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsGettingLocation(false);
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getSafetyLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "safe":
        return "bg-chart-2 text-white";
      case "moderate":
        return "bg-chart-3 text-white";
      case "risky":
      case "dangerous":
        return "bg-chart-5 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return "text-chart-2";
    if (severity <= 3) return "text-chart-3";
    return "text-chart-5";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Crime Heatmap</h1>
          <p className="text-muted-foreground mt-2">View crime statistics and safety levels in your area</p>
        </div>
        <Button
          data-testid="button-refresh-map"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
        >
          <Navigation className="mr-2 h-4 w-4" />
          Refresh Location
        </Button>
      </div>

      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Crime Heatmap
            </CardTitle>
            <CardDescription>Visual representation of crime density in your area</CardDescription>
          </CardHeader>
          <CardContent>
            {isGettingLocation ? (
              <Skeleton className="aspect-video w-full" />
            ) : userLocation ? (
              <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&center=${userLocation.lat},${userLocation.lng}&zoom=13&maptype=roadmap`}
                  allowFullScreen
                />
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Location Required</AlertTitle>
                <AlertDescription>
                  Enable location services to view the crime heatmap
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Area Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : crimeStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Total Crimes</span>
                    <span className="text-2xl font-bold">{crimeStats.totalCrimes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Severity Score</span>
                    <span className={`text-2xl font-bold ${getSeverityColor(crimeStats.severity)}`}>
                      {crimeStats.severity}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Safety Level</span>
                    <Badge className={getSafetyLevelColor(crimeStats.safetyLevel)}>
                      {crimeStats.safetyLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Trend</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-chart-3" />
                      <span className="text-sm font-semibold">{crimeStats.trend}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Location data required to show statistics
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {crimeStats && crimeStats.crimesByType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crime Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crimeStats.crimesByType.map((crime, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {crime.type.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline">{crime.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert>
        <Map className="h-4 w-4" />
        <AlertTitle>About Crime Data</AlertTitle>
        <AlertDescription>
          Crime statistics are based on reported incidents within a 5km radius of your location. Data is updated regularly to provide accurate safety information.
        </AlertDescription>
      </Alert>
    </div>
  );
}
