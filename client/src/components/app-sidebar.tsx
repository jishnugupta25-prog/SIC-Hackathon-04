import {
  Home,
  AlertCircle,
  MapPin,
  Map,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { clearAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "SOS Alert",
    url: "/dashboard/sos",
    icon: AlertCircle,
  },
  {
    title: "Safe Places",
    url: "/dashboard/safe-places",
    icon: MapPin,
  },
  {
    title: "Crime Map",
    url: "/dashboard/crime-map",
    icon: Map,
  },
  {
    title: "Emergency Contacts",
    url: "/dashboard/contacts",
    icon: Users,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    clearAuthUser();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    setLocation("/login");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">SafeGuard</h2>
              <p className="text-xs text-muted-foreground">Safety Assistant</p>
            </div>
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    asChild
                    isActive={location === item.url}
                    onClick={() => setLocation(item.url)}
                  >
                    <a>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          data-testid="button-logout"
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
