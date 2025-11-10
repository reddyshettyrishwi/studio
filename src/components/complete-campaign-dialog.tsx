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
import type { Campaign } from "@/lib/types";

const completionSchema = z.object({
  expectedReach: z
    .coerce
    .number({ invalid_type_error: "Expected reach is required." })
    .positive("Expected reach must be a positive number."),
  outcomes: z
    .string()
    .min(10, "Please describe what was achieved in at least 10 characters."),
});

export type CompleteCampaignFormValues = z.infer<typeof completionSchema>;

interface CompleteCampaignDialogProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CompleteCampaignFormValues) => Promise<void> | void;
}

export function CompleteCampaignDialog({
  campaign,
  isOpen,
  onClose,
  onSubmit,
}: CompleteCampaignDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CompleteCampaignFormValues>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      expectedReach: undefined,
      outcomes: "",
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({ expectedReach: undefined, outcomes: "" });
      setIsSubmitting(false);
      return;
    }

    if (campaign?.completionDetails) {
      form.reset({
        expectedReach: campaign.completionDetails.expectedReach,
        outcomes: campaign.completionDetails.outcomes,
      });
    } else {
      form.reset({ expectedReach: undefined, outcomes: "" });
    }
  }, [isOpen, campaign, form]);

  const handleSubmit = async (values: CompleteCampaignFormValues) => {
    if (!campaign) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      toast({
        title: "Campaign marked as completed",
        description: `${campaign.name} now records expected reach and outcomes.`,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Failed to record completion", error);
      toast({
        title: "Could not save completion",
        description: "Please try again or check your permissions.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Log Completion</DialogTitle>
          <DialogDescription>
            {campaign
              ? `Capture the final outcomes for ${campaign.name}.`
              : "Select a campaign to complete."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expectedReach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Reach</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g., 250000"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value;
                        field.onChange(raw === "" ? undefined : Number(raw));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outcomes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcomes & Learnings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize results, learnings, and any follow-up actions."
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !campaign}>
                Save Completion
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CompleteCampaignDialog;
