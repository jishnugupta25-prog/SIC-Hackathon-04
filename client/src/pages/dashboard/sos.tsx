import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Sparkles, Clock, Navigation } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

interface AiInsight {
  riskScore: number;
  safetyLevel: string;
  suggestions: string[];
  areaAnalysis: string;
}

export default function SosPage() {
  const { toast } = useToast();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: aiInsights, isLoading: aiLoading, refetch: refetchAiInsights } = useQuery<AiInsight>({
    queryKey: ["/api/ai/insights", location?.latitude, location?.longitude],
    enabled: !!location,
  });

  const sosMutation = useMutation({
    mutationFn: async (locationData: LocationData) => {
      return await apiRequest("POST", "/api/sos/trigger", {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sos/recent"] });
      toast({
        title: "SOS Alert Sent!",
        description: "Emergency contacts have been notified with your location.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "SOS Alert Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.latitude},${locationData.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.results && data.results[0]) {
            locationData.address = data.results[0].formatted_address;
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }

        setLocation(locationData);
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSosClick = () => {
    if (!location) {
      toast({
        title: "Location unavailable",
        description: "Please wait while we get your current location",
        variant: "destructive",
      });
      getCurrentLocation();
      return;
    }

    sosMutation.mutate(location);
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "safe":
        return "bg-chart-2 text-white";
      case "moderate":
        return "bg-chart-3 text-white";
      case "risky":
        return "bg-chart-5 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Emergency SOS</h1>
        <p className="text-muted-foreground mt-2">Instant emergency alerts and safety insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Emergency Alert
            </CardTitle>
            <CardDescription>
              Send instant SMS alerts to all your emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button
                data-testid="button-sos"
                size="lg"
                variant="default"
                className="h-32 w-32 rounded-full text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg"
                onClick={handleSosClick}
                disabled={sosMutation.isPending || !location}
              >
                {sosMutation.isPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                    <span className="text-xs">Sending...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-12 w-12 mb-2" />
                    <span>SOS</span>
                  </div>
                )}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription className="text-sm">
                Press the SOS button to instantly send your current location to all emergency contacts via SMS
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-chart-3" />
              Current Location
            </CardTitle>
            <CardDescription>Your real-time GPS coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGettingLocation ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : locationError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            ) : location ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Updated {new Date(location.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium">Latitude:</span>
                    <span className="text-sm font-mono">{location.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium">Longitude:</span>
                    <span className="text-sm font-mono">{location.longitude.toFixed(6)}</span>
                  </div>
                  {location.address && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-sm font-medium">Address:</span>
                      <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                    </div>
                  )}
                </div>

                <Button
                  data-testid="button-refresh-location"
                  variant="outline"
                  className="w-full"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Refresh Location
                </Button>

                {location && (
                  <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}&zoom=15`}
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Safety Insights</CardTitle>
            </div>
            <Button
              data-testid="button-refresh-ai"
              variant="outline"
              size="sm"
              onClick={() => refetchAiInsights()}
              disabled={!location || aiLoading}
            >
              Refresh Analysis
            </Button>
          </div>
          <CardDescription>Powered by Google Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          {!location ? (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertTitle>Location Required</AlertTitle>
              <AlertDescription>
                Enable location services to receive AI-powered safety insights
              </AlertDescription>
            </Alert>
          ) : aiLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : aiInsights ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{aiInsights.riskScore}/10</div>
                <div>
                  <p className="text-sm font-medium">Risk Score</p>
                  <Badge className={getSafetyLevelColor(aiInsights.safetyLevel)}>
                    {aiInsights.safetyLevel}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Area Analysis</h4>
                <p className="text-sm text-muted-foreground">{aiInsights.areaAnalysis}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Safety Suggestions</h4>
                <ul className="space-y-2">
                  {aiInsights.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span className="text-muted-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
