import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "block min-h-0 min-w-0 w-full overflow-hidden text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border [&_.recharts-surface]:max-w-full [&_.recharts-tooltip-cursor]:stroke-border",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
          initialDimension={{ width: 320, height: 288 }}
          debounce={50}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: string | number;
    color?: string;
  }>;
  label?: React.ReactNode;
  labelFormatter?: (value: string) => React.ReactNode;
};

function formatTooltipValue(value: string | number | undefined) {
  if (typeof value !== "number") {
    return value;
  }

  return value.toFixed(2);
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="grid min-w-32 gap-1 border border-border bg-popover px-2 py-1.5 text-xs text-popover-foreground shadow-md">
      <div className="font-medium">
        {typeof label === "string" && labelFormatter
          ? labelFormatter(label)
          : label}
      </div>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name);
        const itemConfig = config[key];

        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2"
                style={{ backgroundColor: item.color ?? "currentColor" }}
              />
              {itemConfig?.label ?? item.name}
            </span>
            <span className="font-mono font-medium">
              {formatTooltipValue(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltipContent };
