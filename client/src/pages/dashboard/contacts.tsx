import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Trash2, Phone, User, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type EmergencyContact, type InsertEmergencyContact, insertEmergencyContactSchema } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/contacts"],
  });

  const form = useForm<InsertEmergencyContact>({
    resolver: zodResolver(insertEmergencyContactSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: InsertEmergencyContact) => {
      return await apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact added",
        description: "Emergency contact has been added successfully.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contacts/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact removed",
        description: "Emergency contact has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmergencyContact) => {
    addContactMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage who receives your SOS alerts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contact">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                Add someone who will receive SMS alerts when you trigger SOS
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            data-testid="input-contact-name"
                            placeholder="John Doe"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            data-testid="input-contact-phone"
                            placeholder="+1234567890"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  data-testid="button-save-contact"
                  type="submit"
                  className="w-full"
                  disabled={addContactMutation.isPending}
                >
                  {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All contacts will receive SMS alerts with your location when you press the SOS button
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-chart-2/10 p-2 rounded-full">
                      <Users className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {contact.phoneNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    data-testid={`button-delete-contact-${contact.id}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteContactMutation.mutate(contact.id)}
                    disabled={deleteContactMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Add emergency contacts to receive instant SMS alerts when you trigger SOS
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
