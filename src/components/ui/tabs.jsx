import { cva } from "class-variance-authority";
import { cn, TOUCH_HIT } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "radix-ui";

function Tabs({ className, orientation = "horizontal", ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

// `default`: segmented track (h-8, bg-muted, hairline ring); `line`: underline tab row (h-10).
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default:
          "gap-0.5 rounded-lg bg-muted p-0.5 ring-1 ring-border group-data-[orientation=horizontal]/tabs:h-8",
        line: "gap-1 bg-transparent group-data-[orientation=horizontal]/tabs:h-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({ className, variant = "default", ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-xs font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-(--dur-fast) outline-none group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-xs group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:text-sm group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        TOUCH_HIT,
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
