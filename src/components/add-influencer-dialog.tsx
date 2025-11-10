
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import type { Influencer, PlatformDetails } from "@/lib/types";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";

const platformSchema = z.object({
  platform: z.enum(["YouTube", "Instagram"]),
  channelName: z.string().min(1, "Channel name is required."),
  handle: z.string().min(1, "Username is required."),
});

// Optional schema for the second platform
const optionalPlatformSchema = z.object({
    platform: z.enum(["YouTube", "Instagram"]),
    channelName: z.string(),
    handle: z.string(),
}).partial().optional();


const influencerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  platform1: platformSchema,
  platform2: optionalPlatformSchema,
  category: z.string().min(1, "Category is required."),
  language: z.string().min(1, "Language is required."),
  email: z.string().email("Please enter a valid email address."),
  mobile: z.string().min(10, "Please enter a valid mobile number."),
  pan: z.string().min(1, "PAN/Legal ID is required."),
  lastPromotionBy: z.string().min(1, "Required field."),
  lastPromotionDate: z.date({
    required_error: "A date of promotion is required.",
  }),
  lastPricePaid: z.coerce.number().positive("Price must be a positive number.").optional(),
});

type AddInfluencerFormValues = z.infer<typeof influencerSchema>;

interface AddInfluencerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInfluencer: (influencer: Omit<Influencer, "id" | "avatar">) => Promise<void>;
}

export default function AddInfluencerDialog({
  isOpen,
  onClose,
  onAddInfluencer,
}: AddInfluencerDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<AddInfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      pan: "",
      category: "",
      language: "",
      lastPromotionBy: "",
      platform1: {
        platform: "Instagram",
        channelName: "",
        handle: "",
      },
      platform2: {
        platform: "YouTube",
        channelName: "",
        handle: "",
      },
    },
  });
  
  const { control } = form;

  async function onSubmit(data: AddInfluencerFormValues) {
    const platforms: PlatformDetails[] = [data.platform1 as PlatformDetails];
    if (data.platform2 && data.platform2.handle) {
      platforms.push(data.platform2 as PlatformDetails);
    }

    const influencerData = {
        ...data,
        platforms,
        lastPromotionDate: format(data.lastPromotionDate, 'yyyy-MM-dd'),
    };

    // Remove platform1 and platform2 from the final object
    delete (influencerData as any).platform1;
    delete (influencerData as any).platform2;


    await onAddInfluencer(influencerData as Omit<Influencer, "id" | "avatar">);
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            form.reset();
            onClose();
        }
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Influencer</DialogTitle>
          <DialogDescription>
            Enter the details for the new influencer. This will add them to the central repository.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="name" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="email" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="mobile" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl><Input placeholder="+91-9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="pan" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN / Legal ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            <div className="space-y-2">
                <h4 className="font-medium">Platform 1 (Required)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <FormField
                        control={control}
                        name="platform1.platform"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="YouTube">YouTube</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform1.channelName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Channel Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Jane's World" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform1.handle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl><Input placeholder="@janedoe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />
            <div className="space-y-2">
                <h4 className="font-medium">Platform 2 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                     <FormField
                        control={control}
                        name="platform2.platform"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="YouTube">YouTube</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform2.channelName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Channel Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Jane's World" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform2.handle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl><Input placeholder="@janedoe" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="category" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category / Niche</FormLabel>
                    <FormControl><Input placeholder="e.g., Fashion, Tech" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="language" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl><Input placeholder="e.g., English" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <FormField name="lastPromotionBy" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Promotion By</FormLabel>
                    <FormControl><Input placeholder="e.g., Marketing Dept" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastPromotionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Last Promotion Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="lastPricePaid"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Price Paid (₹) (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="400000"
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const rawValue = event.target.value;
                          field.onChange(rawValue === "" ? undefined : Number(rawValue));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Add Influencer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    