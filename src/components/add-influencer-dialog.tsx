
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";
import type { Influencer, PlatformDetails } from "@/lib/types";
import { detectDuplicateInfluencers, DetectDuplicateInfluencersOutput } from "@/ai/flows/detect-duplicate-influencers";
import { Separator } from "./ui/separator";

const platformSchema = z.object({
  platform: z.enum(["YouTube", "Instagram"]),
  channelName: z.string().min(1, "Channel name is required."),
  channelLink: z.string().url("Please enter a valid URL."),
  handle: z.string().min(1, "Handle is required."),
  averageViews: z.coerce.number().positive("Views must be a positive number."),
});

// Optional schema for the second platform
const optionalPlatformSchema = z.object({
    platform: z.enum(["YouTube", "Instagram"]),
    channelName: z.string(),
    channelLink: z.string(),
    handle: z.string(),
    averageViews: z.coerce.number(),
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
  lastPromotionDate: z.string().min(1, "Required field."),
  lastPricePaid: z.coerce.number().positive("Price must be a positive number."),
});

type AddInfluencerFormValues = z.infer<typeof influencerSchema>;

interface AddInfluencerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInfluencer: (influencer: Omit<Influencer, "id" | "avatar">) => void;
}

export default function AddInfluencerDialog({
  isOpen,
  onClose,
  onAddInfluencer,
}: AddInfluencerDialogProps) {
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [duplicateResult, setDuplicateResult] = React.useState<DetectDuplicateInfluencersOutput | null>(null);
  
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
      lastPromotionDate: "",
      lastPricePaid: 0,
      platform1: {
        platform: "Instagram",
        channelName: "",
        channelLink: "",
        handle: "",
        averageViews: 0,
      },
      platform2: {
        platform: "YouTube",
        channelName: "",
        channelLink: "",
        handle: "",
        averageViews: 0,
      },
    },
  });
  
  const { control, watch } = form;

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
        if (name === 'mobile' || name === 'pan' || name === 'platform1.channelLink') {
            const channelLink = value.platform1?.channelLink;
            handleDuplicateCheck(value.mobile, value.pan, channelLink);
        }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const debounceTimeout = React.useRef<NodeJS.Timeout>();
  const handleDuplicateCheck = (mobile?: string, pan?: string, channelLink?: string) => {
    clearTimeout(debounceTimeout.current);
    if (mobile && pan && channelLink) {
        debounceTimeout.current = setTimeout(async () => {
            setIsDetecting(true);
            setDuplicateResult(null);
            try {
                const result = await detectDuplicateInfluencers({
                    mobileNumber: mobile,
                    legalName: pan, // Using PAN as legal name
                    channelLink: channelLink,
                });
                if (result.isDuplicate) {
                    setDuplicateResult(result);
                }
            } catch (error) {
                console.error("AI duplicate detection failed:", error);
            } finally {
                setIsDetecting(false);
            }
        }, 1000);
    }
  };


  function onSubmit(data: AddInfluencerFormValues) {
    const platforms: PlatformDetails[] = [data.platform1 as PlatformDetails];
    if (data.platform2 && data.platform2.channelLink && data.platform2.handle) {
      platforms.push(data.platform2 as PlatformDetails);
    }

    const influencerData = {
        ...data,
        platforms,
    };

    // Remove platform1 and platform2 from the final object
    delete (influencerData as any).platform1;
    delete (influencerData as any).platform2;


    onAddInfluencer(influencerData);
    toast({
      title: "Success!",
      description: `${data.name} has been added to the repository.`,
    });
    form.reset();
    setDuplicateResult(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            form.reset();
            setDuplicateResult(null);
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <FormField
                        control={control}
                        name="platform1.platform"
                        render={({ field }) => (
                        <FormItem className="md:col-span-1">
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
                        <FormItem className="md:col-span-2">
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
                        <FormItem className="md:col-span-2">
                            <FormLabel>Handle</FormLabel>
                            <FormControl><Input placeholder="@janedoe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform1.channelLink"
                        render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Channel Link</FormLabel>
                            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform1.averageViews"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Average Views</FormLabel>
                            <FormControl><Input type="number" placeholder="150000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />
            <div className="space-y-2">
                <h4 className="font-medium">Platform 2 (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <FormField
                        control={control}
                        name="platform2.platform"
                        render={({ field }) => (
                        <FormItem className="md:col-span-1">
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
                        <FormItem className="md:col-span-2">
                            <FormLabel>Channel Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Jane's World" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform2.handle"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Handle</FormLabel>
                            <FormControl><Input placeholder="@janedoe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform2.channelLink"
                        render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Channel Link</FormLabel>
                            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="platform2.averageViews"
                        render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Average Views</FormLabel>
                            <FormControl><Input type="number" placeholder="150000" {...field} /></FormControl>
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
              <FormField name="lastPromotionDate" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Promotion Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="lastPricePaid" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Price Paid (₹)</FormLabel>
                    <FormControl><Input type="number" placeholder="400000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(isDetecting || duplicateResult) && (
              <Alert variant={duplicateResult ? "destructive" : "default"}>
                {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                <AlertTitle>{isDetecting ? "Checking for duplicates..." : "Potential Duplicate Found!"}</AlertTitle>
                <AlertDescription>
                  {isDetecting
                    ? "Our AI is checking if this influencer already exists in the repository."
                    : `This profile might be a duplicate with ${Math.round((duplicateResult?.confidence || 0) * 100)}% confidence. Please review before proceeding.`}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isDetecting}>
                Add Influencer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
