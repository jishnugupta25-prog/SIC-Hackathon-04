import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin, Users, Map, Sparkles, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type EmergencyContact, type SosEvent } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: contacts, isLoading: contactsLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: recentSos, isLoading: sosLoading } = useQuery<SosEvent[]>({
    queryKey: ["/api/sos/recent"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your safety control center</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/dashboard/sos")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Alert</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SOS Ready</div>
            <p className="text-xs text-muted-foreground mt-1">
              Instant emergency alerts to your contacts
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/dashboard/contacts")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            <Users className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{contacts?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Contacts ready for alerts
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/dashboard/safe-places")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Places</CardTitle>
            <MapPin className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Find Nearby</div>
            <p className="text-xs text-muted-foreground mt-1">
              Police, hospitals, and shelters
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={() => setLocation("/dashboard/crime-map")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crime Heatmap</CardTitle>
            <Map className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Map</div>
            <p className="text-xs text-muted-foreground mt-1">
              Check area safety levels
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Recent SOS Events</CardTitle>
              <CardDescription>Your emergency alert history</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {sosLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentSos && recentSos.length > 0 ? (
              <div className="space-y-3">
                {recentSos.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 rounded-md bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">SOS Alert Sent</p>
                      <p className="text-xs text-muted-foreground">
                        {event.address || `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No SOS events yet</p>
                <p className="text-xs mt-1">Your emergency alerts will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Safety Insights</CardTitle>
          </div>
          <CardDescription>Get personalized safety recommendations powered by Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            data-testid="button-ai-insights"
            onClick={() => setLocation("/dashboard/sos")}
            className="w-full sm:w-auto"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            View Safety Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
