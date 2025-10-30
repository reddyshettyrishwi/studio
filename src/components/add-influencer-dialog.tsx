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
import type { Influencer } from "@/lib/types";
import { detectDuplicateInfluencers, DetectDuplicateInfluencersOutput } from "@/ai/flows/detect-duplicate-influencers";

const influencerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  platform: z.enum(["YouTube", "Instagram"]),
  category: z.string().min(1, "Category is required."),
  language: z.string().min(1, "Language is required."),
  region: z.string().min(1, "Region is required."),
  channelLink: z.string().url("Please enter a valid URL."),
  handle: z.string().min(1, "Handle is required."),
  email: z.string().email("Please enter a valid email address."),
  mobile: z.string().min(10, "Please enter a valid mobile number."),
  pan: z.string().min(1, "PAN/Legal ID is required."),
  lastPromotionBy: z.string().min(1, "Required field."),
  lastPromotionDate: z.string().min(1, "Required field."),
  lastPricePaid: z.coerce.number().positive("Price must be a positive number."),
  averageViews: z.coerce.number().positive("Views must be a positive number."),
  channelName: z.string().min(1, "Channel name is required."),
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
      platform: "Instagram",
    },
  });

  const { watch } = form;
  const watchedFields = watch(['mobile', 'pan', 'channelLink']);

  React.useEffect(() => {
    const [mobile, pan, channelLink] = watchedFields;
    const subscription = watch((value, { name }) => {
        if (name === 'mobile' || name === 'pan' || name === 'channelLink') {
            handleDuplicateCheck(value.mobile, value.pan, value.channelLink);
        }
    });
    return () => subscription.unsubscribe();
  }, [watchedFields, watch]);

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
    onAddInfluencer({ ...data, pan: data.pan });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Influencer</DialogTitle>
          <DialogDescription>
            Enter the details for the new influencer. This will add them to the central repository.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="handle" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl><Input placeholder="@janedoe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                 <FormField name="channelName" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Jane's World" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="platform" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
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
              <FormField name="category" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category / Niche</FormLabel>
                    <FormControl><Input placeholder="e.g., Fashion, Tech" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="language" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl><Input placeholder="e.g., English" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="region" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl><Input placeholder="e.g., USA, India" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="channelLink" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Link</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="mobile" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl><Input placeholder="+1-555-555-5555" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="pan" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN / Legal ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField name="lastPromotionBy" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Promotion By</FormLabel>
                    <FormControl><Input placeholder="e.g., Marketing Dept" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="lastPromotionDate" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Promotion Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="lastPricePaid" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Price Paid ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField name="averageViews" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Views</FormLabel>
                    <FormControl><Input type="number" placeholder="150000" {...field} /></FormControl>
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
