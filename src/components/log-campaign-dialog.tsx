
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
import { Textarea } from "@/components/ui/textarea";
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
import type { Campaign, Influencer } from "@/lib/types";
import { alertOnPriceAnomalies, AlertOnPriceAnomaliesOutput } from "@/ai/flows/alert-on-price-anomalies";

const campaignSchema = z.object({
  influencerId: z.string().optional(),
  name: z.string().min(2, "Campaign name is required."),
  department: z.string().min(1, "Department is required."),
  deliverables: z.string().min(1, "Deliverables are required."),
  date: z.string().min(1, "Campaign date is required."),
  pricePaid: z.coerce.number().positive("Amount must be a positive number."),
});

type LogCampaignFormValues = z.infer<typeof campaignSchema>;

interface LogCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogCampaign: (campaign: Omit<Campaign, "id" | "approvalStatus">) => void;
  influencers: Influencer[];
}

export default function LogCampaignDialog({
  isOpen,
  onClose,
  onLogCampaign,
  influencers,
}: LogCampaignDialogProps) {
  const { toast } = useToast();
  const [isCheckingPrice, setIsCheckingPrice] = React.useState(false);
  const [priceAnomaly, setPriceAnomaly] = React.useState<AlertOnPriceAnomaliesOutput | null>(null);

  const form = useForm<LogCampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      influencerId: undefined,
      name: "",
      department: "",
      deliverables: "",
      date: "",
      pricePaid: undefined,
    },
  });

  const { watch, getValues } = form;
  
  const debounceTimeout = React.useRef<NodeJS.Timeout | undefined>();

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
        if (name === 'influencerId' || name === 'pricePaid') {
            const { influencerId, pricePaid } = getValues();
            handlePriceCheck(influencerId, pricePaid);
        }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, influencers]);

  const handlePriceCheck = (influencerId?: string, pricePaid?: number | string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const selectedInfluencer = influencers.find(i => i.id === influencerId);
    const numericPrice = typeof pricePaid === "number" ? pricePaid : Number(pricePaid);

    if (!selectedInfluencer || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setIsCheckingPrice(false);
      setPriceAnomaly(null);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setIsCheckingPrice(true);
      setPriceAnomaly(null);
      try {
        const result = await alertOnPriceAnomalies({
          influencerName: selectedInfluencer.name,
          proposedPrice: numericPrice,
          previousPriceBenchmarks: selectedInfluencer.lastPricePaid ? [selectedInfluencer.lastPricePaid] : [],
        });
        if (result.isPriceTooHigh) {
          setPriceAnomaly(result);
        }
      } catch (error) {
        console.error("AI price anomaly check failed:", error);
      } finally {
        setIsCheckingPrice(false);
      }
    }, 1000);
  };

  function onSubmit(data: LogCampaignFormValues) {
    onLogCampaign({ ...data });
    toast({
      title: "Campaign Logged!",
      description: `${data.name} has been added to the campaign records.`,
    });
    form.reset();
    setPriceAnomaly(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            form.reset();
            setPriceAnomaly(null);
            onClose();
        }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Log Campaign</DialogTitle>
          <DialogDescription>
            Record a new campaign association with an influencer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="influencerId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Influencer (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select an influencer" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {influencers.map(i => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Summer 2024 Launch"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="department" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Marketing"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="pricePaid"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
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
            <FormField name="date" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="deliverables" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Deliverables</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 2 Instagram posts, 1 YouTube video"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(isCheckingPrice || priceAnomaly) && (
              <Alert variant={priceAnomaly ? "destructive" : "default"}>
                {isCheckingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                <AlertTitle>{isCheckingPrice ? "Analyzing price..." : "Price Anomaly Detected!"}</AlertTitle>
                <AlertDescription>
                  {isCheckingPrice
                    ? "Our AI is analyzing the proposed price against historical benchmarks."
                    : priceAnomaly?.explanation || "This price seems significantly high."}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCheckingPrice}>
                Log Campaign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    