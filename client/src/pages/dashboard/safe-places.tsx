import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Navigation, Hospital, Shield, Flame, AlertCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SafePlace {
  id: string;
  name: string;
  type: "police" | "hospital" | "fire_station";
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
}

const placeTypeConfig = {
  police: {
    icon: Shield,
    label: "Police Station",
    color: "bg-chart-1 text-white",
  },
  hospital: {
    icon: Hospital,
    label: "Hospital",
    color: "bg-chart-2 text-white",
  },
  fire_station: {
    icon: Flame,
    label: "Fire Station",
    color: "bg-chart-5 text-white",
  },
};

export default function SafePlacesPage() {
  const { toast } = useToast();
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const findSafePlaces = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);

        try {
          const response = await fetch(
            `/api/safe-places?latitude=${location.lat}&longitude=${location.lng}`
          );
          const data = await response.json();
          setSafePlaces(data.places || []);
        } catch (error) {
          toast({
            title: "Error finding safe places",
            description: "Failed to load nearby safe locations",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setLocationError(error.message);
        setIsLoading(false);
      }
    );
  };

  useEffect(() => {
    findSafePlaces();
  }, []);

  const getDirectionsUrl = (place: SafePlace) => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.latitude},${place.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Safe Places</h1>
          <p className="text-muted-foreground mt-2">Find nearby police stations, hospitals, and emergency services</p>
        </div>
        <Button
          data-testid="button-refresh-places"
          onClick={findSafePlaces}
          disabled={isLoading}
        >
          <Navigation className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {userLocation && (
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/search?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=police+station|hospital|fire+station&center=${userLocation.lat},${userLocation.lng}&zoom=13`}
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : safePlaces.length > 0 ? (
          safePlaces.map((place) => {
            const config = placeTypeConfig[place.type];
            const Icon = config.icon;
            return (
              <Card key={place.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-muted p-2 rounded-md">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">{place.name}</CardTitle>
                        <Badge className={`${config.color} mt-2`} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-2">{place.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {place.distance.toFixed(1)} km away
                    </span>
                  </div>
                  <Button
                    data-testid={`button-directions-${place.id}`}
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(getDirectionsUrl(place), "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : !isLoading && !locationError ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Safe Places Found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Try refreshing to search for nearby safe locations
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
