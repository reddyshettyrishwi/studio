"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CalendarIcon, ChevronDown } from "lucide-react";
import type { Influencer, PlatformDetails } from "@/lib/types";
import {
  CATEGORY_OPTIONS,
  COUNTRY_CODE_OPTIONS,
  DEPARTMENT_OPTIONS,
  LANGUAGE_OPTIONS,
  isCategoryOption,
  isLanguageOption,
} from "@/lib/options";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const LanguageEnum = z.enum(LANGUAGE_OPTIONS);

const influencerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  platform1: platformSchema,
  platform2: optionalPlatformSchema,
  category: z.enum(CATEGORY_OPTIONS, {
    required_error: "Select a category.",
  }),
  languages: z.array(LanguageEnum).min(1, "Select at least one language."),
  email: z.string().email("Please enter a valid email address."),
  countryCode: z.string().regex(/^\+\d{1,4}$/u, "Select a country code."),
  mobile: z.string().regex(/^\d{7,15}$/u, "Enter digits only (7-15)."),
  pan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/u, "Enter a valid 10-character PAN (e.g., ABCDE1234F)."),
  lastPromotionBy: z.enum(DEPARTMENT_OPTIONS, {
    required_error: "Select the department that led the last promotion.",
  }),
  lastPromotionDate: z.date({
    required_error: "A date of promotion is required.",
  }),
  lastPricePaid: z.coerce.number().positive("Price must be a positive number.").optional(),
});

type AddInfluencerFormValues = z.infer<typeof influencerSchema>;

const sanitizeHandle = (rawHandle: string) => rawHandle.replace(/^@+/u, "").trim();

const splitPhoneNumber = (phone: string) => {
  const normalized = phone.trim();
  const directMatch = normalized.match(/^(\+\d{1,4})(\d{5,15})$/u);
  if (directMatch) {
    return {
      countryCode: directMatch[1],
      mobile: directMatch[2],
    };
  }

  for (const option of COUNTRY_CODE_OPTIONS) {
    if (normalized.startsWith(option.value)) {
      const digits = normalized.slice(option.value.length).replace(/\D+/g, "");
      return {
        countryCode: option.value,
        mobile: digits,
      };
    }
  }

  return {
    countryCode: "+91",
    mobile: normalized.replace(/\D+/g, ""),
  };
};

const createEmptyFormValues = (): Partial<AddInfluencerFormValues> => ({
  name: "",
  email: "",
  mobile: "",
  countryCode: "+91",
  pan: "",
  category: CATEGORY_OPTIONS[0],
  languages: [],
  lastPromotionBy: DEPARTMENT_OPTIONS[0],
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
  lastPricePaid: undefined,
});

const convertInfluencerToFormValues = (influencer: Influencer): Partial<AddInfluencerFormValues> => {
  const primaryPlatform = influencer.platforms[0];
  const secondaryPlatform = influencer.platforms[1];
  const { countryCode, mobile } = splitPhoneNumber(influencer.mobile ?? "");
  const normalizedCategory = isCategoryOption(influencer.category)
    ? influencer.category
    : "Other";

  const parsedDate = influencer.lastPromotionDate
    ? new Date(influencer.lastPromotionDate)
    : undefined;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined;

  return {
    ...createEmptyFormValues(),
    name: influencer.name,
    email: influencer.email,
    mobile,
    countryCode,
    pan: (influencer.pan ?? "").toUpperCase(),
    category: normalizedCategory,
    languages: (influencer.languages ?? []).filter(isLanguageOption),
    lastPromotionBy: (DEPARTMENT_OPTIONS.includes(influencer.lastPromotionBy as (typeof DEPARTMENT_OPTIONS)[number])
      ? influencer.lastPromotionBy
      : DEPARTMENT_OPTIONS[0]) as (typeof DEPARTMENT_OPTIONS)[number],
    lastPromotionDate: validDate,
    lastPricePaid: influencer.lastPricePaid ?? undefined,
    platform1: {
      platform: primaryPlatform?.platform ?? "Instagram",
      channelName: primaryPlatform?.channelName ?? "",
      handle: sanitizeHandle(primaryPlatform?.handle ?? ""),
    },
    platform2: secondaryPlatform
      ? {
          platform: secondaryPlatform.platform,
          channelName: secondaryPlatform.channelName,
          handle: sanitizeHandle(secondaryPlatform.handle ?? ""),
        }
      : {
          platform: "YouTube",
          channelName: "",
          handle: "",
        },
  };
};

const RequiredAsterisk: React.FC = () => (
  <span className="ml-1 inline-flex items-center gap-1">
    <span className="text-red-500 dark:text-red-300 font-semibold" aria-hidden="true">
      *
    </span>
    <span className="sr-only">(required)</span>
  </span>
);

interface AddInfluencerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name?: string | null };
  onAddInfluencer: (influencer: Omit<Influencer, "id" | "avatar">) => Promise<void>;
  mode?: "create" | "edit";
  initialInfluencer?: Influencer | null;
  onUpdateInfluencer?: (influencerId: string, influencer: Omit<Influencer, "id" | "avatar">) => Promise<void>;
}

export default function AddInfluencerDialog({
  isOpen,
  onClose,
  currentUser,
  onAddInfluencer,
  mode = "create",
  initialInfluencer = null,
  onUpdateInfluencer,
}: AddInfluencerDialogProps) {
  const [countrySearch, setCountrySearch] = React.useState("");
  const [languageSearch, setLanguageSearch] = React.useState("");
  const [categorySearch, setCategorySearch] = React.useState("");
  const isEditMode = mode === "edit";

  const defaultValues = React.useMemo(() => {
    if (isEditMode && initialInfluencer) {
      return convertInfluencerToFormValues(initialInfluencer);
    }
    return createEmptyFormValues();
  }, [isEditMode, initialInfluencer]);
  
  const form = useForm<AddInfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues,
  });
  
  const { control } = form;
  const selectedCountryCode = form.watch("countryCode") ?? "+91";
  const selectedCountry = React.useMemo(
    () => COUNTRY_CODE_OPTIONS.find((option) => option.value === selectedCountryCode),
    [selectedCountryCode]
  );

  React.useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  React.useEffect(() => {
    if (!isOpen) {
      setCountrySearch("");
      setLanguageSearch("");
      setCategorySearch("");
    }
  }, [isOpen]);

  async function onSubmit(data: AddInfluencerFormValues) {
    const primaryHandle = sanitizeHandle(data.platform1.handle);
    const platforms: PlatformDetails[] = [
      {
        platform: data.platform1.platform,
        channelName: data.platform1.channelName.trim(),
        handle: primaryHandle,
      },
    ];

    if (data.platform2) {
      const secondaryHandle = sanitizeHandle(data.platform2.handle ?? "");
      if (secondaryHandle) {
        platforms.push({
          platform: data.platform2.platform ?? "YouTube",
          channelName: (data.platform2.channelName ?? "").trim(),
          handle: secondaryHandle,
        } as PlatformDetails);
      }
    }

    const sanitizedMobile = data.mobile.replace(/\D+/g, "");
    const creatorName = (isEditMode ? initialInfluencer?.createdByName : currentUser.name) ?? undefined;
    const creatorId = isEditMode ? initialInfluencer?.createdById ?? currentUser.id : currentUser.id;

    const influencerData: Omit<Influencer, "id" | "avatar"> = {
      name: data.name.trim(),
      email: data.email.trim(),
      mobile: `${data.countryCode}${sanitizedMobile}`,
      pan: data.pan.trim().toUpperCase(),
      category: data.category,
      languages: data.languages,
      lastPromotionBy: data.lastPromotionBy,
      lastPromotionDate: format(data.lastPromotionDate, "yyyy-MM-dd"),
      lastPricePaid: data.lastPricePaid ?? undefined,
      platforms,
      createdById: creatorId,
      createdByName: creatorName,
    };

    if (isEditMode) {
      if (!initialInfluencer || !onUpdateInfluencer) {
        console.error("Edit mode requires initial influencer data and onUpdateInfluencer handler.");
        return;
      }
      await onUpdateInfluencer(initialInfluencer.id, influencerData);
    } else {
      await onAddInfluencer(influencerData);
    }

    form.reset(defaultValues);
    onClose();
  }

  const dialogTitle = isEditMode ? "Edit Influencer" : "Add New Influencer";
  const dialogDescription = isEditMode
    ? "Update the influencer’s information and save your changes."
    : "Enter the details for the new influencer. This will add them to the central repository.";
  const submitLabel = isEditMode ? "Save Changes" : "Add Influencer";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(defaultValues);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="name" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Full Name
                      <RequiredAsterisk />
                    </FormLabel>
                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField name="email" control={control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address
                      <RequiredAsterisk />
                    </FormLabel>
                    <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="mobile"
                control={control}
                render={({ field }) => {
                  const countryCodeError = form.formState.errors.countryCode?.message;
                  return (
                    <FormItem>
                      <FormLabel>
                        Mobile Number
                        <RequiredAsterisk />
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select
                          value={selectedCountryCode}
                          onValueChange={(value) =>
                            form.setValue("countryCode", value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setCountrySearch("");
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-40 justify-between">
                              <span className="truncate">
                                {selectedCountry?.label ?? "Select country"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="p-2">
                              <Input
                                value={countrySearch}
                                onChange={(event) => setCountrySearch(event.target.value)}
                                placeholder="Search countries..."
                              />
                            </div>
                            {(() => {
                              const query = countrySearch.trim().toLowerCase();
                              const filteredOptions = COUNTRY_CODE_OPTIONS.filter((option) =>
                                query
                                  ? option.label.toLowerCase().includes(query) ||
                                    option.value.replace("+", "").includes(query.replace("+", ""))
                                  : true
                              );
                              if (!filteredOptions.length) {
                                return (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>
                                );
                              }
                              return filteredOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  aria-label={option.label}
                                  title={option.label}
                                >
                                  <div className="flex flex-col text-left">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.value}</span>
                                  </div>
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            inputMode="tel"
                            maxLength={15}
                            {...field}
                            onChange={(event) => {
                              const digitsOnly = event.target.value.replace(/\D+/g, "");
                              field.onChange(digitsOnly);
                            }}
                          />
                        </FormControl>
                      </div>
                      {countryCodeError ? (
                        <p className="text-sm text-destructive">{countryCodeError}</p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                name="pan"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      PAN
                      <RequiredAsterisk />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        onChange={(event) => {
                          const nextValue = event.target.value.toUpperCase().replace(/[^A-Z0-9]/gu, "");
                          field.onChange(nextValue);
                        }}
                      />
                    </FormControl>
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
                            <FormLabel>
                              Platform
                              <RequiredAsterisk />
                            </FormLabel>
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
                            <FormLabel>
                              Channel Name
                              <RequiredAsterisk />
                            </FormLabel>
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
                          <FormLabel>
                            Username
                            <RequiredAsterisk />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="janedoe"
                              {...field}
                              onChange={(event) => field.onChange(sanitizeHandle(event.target.value))}
                            />
                          </FormControl>
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
                            <FormControl>
                              <Input
                                placeholder="janedoe"
                                {...field}
                                value={field.value || ""}
                                onChange={(event) => field.onChange(sanitizeHandle(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="category"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category / Niche
                      <RequiredAsterisk />
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      onOpenChange={(open) => {
                        if (!open) {
                          setCategorySearch("");
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            value={categorySearch}
                            onChange={(event) => setCategorySearch(event.target.value)}
                            placeholder="Search categories..."
                            autoFocus
                          />
                        </div>
                        {(() => {
                          const query = categorySearch.trim().toLowerCase();
                          const filteredOptions = CATEGORY_OPTIONS.filter((option) =>
                            query ? option.toLowerCase().includes(query) : true
                          );
                          if (!filteredOptions.length) {
                            return (
                              <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>
                            );
                          }
                          return filteredOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="languages"
                control={control}
                render={({ field }) => {
                  const value = field.value ?? [];
                  const filteredLanguages = LANGUAGE_OPTIONS.filter((option) =>
                    languageSearch.trim()
                      ? option.toLowerCase().includes(languageSearch.trim().toLowerCase())
                      : true
                  );
                  return (
                    <FormItem>
                      <FormLabel>
                        Languages
                        <RequiredAsterisk />
                      </FormLabel>
                      <DropdownMenu onOpenChange={(open) => {
                        if (!open) setLanguageSearch("");
                      }}>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between">
                            <span>{value.length ? value.join(", ") : "Select languages"}</span>
                            <ChevronDown className="h-4 w-4 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <div className="p-2">
                            <Input
                              value={languageSearch}
                              onChange={(event) => setLanguageSearch(event.target.value)}
                              placeholder="Search languages..."
                              autoFocus
                            />
                          </div>
                          {filteredLanguages.length ? (
                            filteredLanguages.map((option) => {
                              const checked = value.includes(option);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={option}
                                  checked={checked}
                                  onCheckedChange={(checkedState) => {
                                    const next = checkedState === true
                                      ? [...value, option]
                                      : value.filter((lang) => lang !== option);
                                    const deduped = LANGUAGE_OPTIONS.filter((lang) => next.includes(lang));
                                    field.onChange(deduped);
                                  }}
                                  onSelect={(event) => event.preventDefault()}
                                >
                                  {option}
                                </DropdownMenuCheckboxItem>
                              );
                            })
                          ) : (
                            <p className="px-3 py-2 text-sm text-muted-foreground">No matches found.</p>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {value.length ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {value.map((lang) => (
                            <Badge key={lang} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="lastPromotionBy"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last Promotion By
                      <RequiredAsterisk />
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENT_OPTIONS.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastPromotionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>
                      Last Promotion Date
                      <RequiredAsterisk />
                    </FormLabel>
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
                    <FormLabel>Last Price Paid (₹, Excluding Taxes)</FormLabel>
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
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    