"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  type DotItemDotProps,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

type TestOption = {
  name: string;
  unit: string | null;
  section: string | null;
};

type DataPoint = {
  date: string;
  value: number | null;
  rawValue: string;
  unit: string | null;
  referenceRange: string | null;
  provider: string;
  previousValue: number | null;
  changePercent: number | null;
  changeDirection: "up" | "down" | "same" | null;
};

type TimeFilter = "last" | "3m" | "6m" | "12m" | "all";

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string; days: number }[] = [
  { value: "last", label: "Last", days: 1 },
  { value: "3m", label: "3M", days: 90 },
  { value: "6m", label: "6M", days: 180 },
  { value: "12m", label: "12M", days: 365 },
  { value: "all", label: "All", days: 0 },
];

type TestsResponse =
  | { ok: true; tests: TestOption[] }
  | { ok: false; error?: string };

type HistoryResponse =
  | { ok: true; data: DataPoint[] }
  | { ok: false; error?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || typeof value === "number";

const isChangeDirection = (
  value: unknown,
): value is DataPoint["changeDirection"] =>
  value === null || value === "up" || value === "down" || value === "same";

const isTestOption = (value: unknown): value is TestOption => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    isNullableString(value.unit) &&
    isNullableString(value.section)
  );
};

const isDataPoint = (value: unknown): value is DataPoint => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.date === "string" &&
    isNullableNumber(value.value) &&
    typeof value.rawValue === "string" &&
    isNullableString(value.unit) &&
    isNullableString(value.referenceRange) &&
    typeof value.provider === "string" &&
    isNullableNumber(value.previousValue) &&
    isNullableNumber(value.changePercent) &&
    isChangeDirection(value.changeDirection)
  );
};

const parseTestsResponse = (value: unknown): TestsResponse | null => {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return null;
  }

  if (value.ok) {
    const tests = value.tests;
    if (!Array.isArray(tests)) {
      return null;
    }

    const parsedTests: TestOption[] = [];
    for (const test of tests) {
      if (!isTestOption(test)) {
        return null;
      }
      parsedTests.push(test);
    }

    return { ok: true, tests: parsedTests };
  }

  return {
    ok: false,
    error: typeof value.error === "string" ? value.error : undefined,
  };
};

const parseHistoryResponse = (value: unknown): HistoryResponse | null => {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return null;
  }

  if (value.ok) {
    const data = value.data;
    if (!Array.isArray(data)) {
      return null;
    }

    const parsedData: DataPoint[] = [];
    for (const point of data) {
      if (!isDataPoint(point)) {
        return null;
      }
      parsedData.push(point);
    }

    return { ok: true, data: parsedData };
  }

  return {
    ok: false,
    error: typeof value.error === "string" ? value.error : undefined,
  };
};

export default function LabValuesChart() {
  const [availableTests, setAvailableTests] = useState<TestOption[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available tests on mount
  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch("/api/labs/tests");
        const payload: unknown = await res.json();
        const json = parseTestsResponse(payload);
        if (!json) {
          throw new Error("Unexpected tests response");
        }
        if (json.ok) {
          setAvailableTests(json.tests);
          // Auto-select first test
          if (json.tests[0]) {
            setSelectedTest(json.tests[0].name);
          }
        } else if (json.error) {
          throw new Error(json.error);
        }
      } catch (err) {
        console.error("Failed to fetch tests", err);
      }
    }
    void fetchTests();
  }, []);

  // Fetch history when selected test or time filter changes
  useEffect(() => {
    if (!selectedTest) return;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const filterDays = TIME_FILTER_OPTIONS.find((f) => f.value === timeFilter)?.days ?? 0;
        const url = `/api/labs/history?testName=${encodeURIComponent(selectedTest)}${filterDays > 0 ? `&days=${filterDays}` : ""}`;
        const res = await fetch(url);
        const payload: unknown = await res.json();
        const json = parseHistoryResponse(payload);
        if (!json) {
          throw new Error("Unexpected history response");
        }
        if (json.ok) {
          // For "last" filter, only show the most recent result
          if (timeFilter === "last" && json.data.length > 0) {
            const latest = json.data[json.data.length - 1];
            if (latest) {
              setData([latest]);
            } else {
              setData([]);
            }
          } else {
            setData(json.data);
          }
        } else {
          setError(json.error ?? "Failed to load data");
        }
      } catch (err) {
        setError("Failed to load chart data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void fetchHistory();
  }, [selectedTest, timeFilter]);

  const filteredTests = availableTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Parse reference range for display (if possible)
  const referenceInfo = data[0]?.referenceRange;
  const unit = data[0]?.unit;

  // Parse reference range (e.g., "< 50", "3.1 - 6.8", "70-100")
  let refLow: number | null = null;
  let refHigh: number | null = null;
  if (referenceInfo) {
    const rangeMatch = /([\d.]+)\s*-\s*([\d.]+)/.exec(referenceInfo);
    const ltMatch = /[<≤]\s*([\d.]+)/.exec(referenceInfo);
    const gtMatch = /[>≥]\s*([\d.]+)/.exec(referenceInfo);

    if (rangeMatch?.[1] && rangeMatch?.[2]) {
      refLow = parseFloat(rangeMatch[1]);
      refHigh = parseFloat(rangeMatch[2]);
    } else if (ltMatch?.[1]) {
      refHigh = parseFloat(ltMatch[1]);
    } else if (gtMatch?.[1]) {
      refLow = parseFloat(gtMatch[1]);
    }
  }

  // Calculate Y-axis domain with padding, including reference bounds
  const values = data
    .map((d) => d.value)
    .filter((v): v is number => v !== null);
  const domainCandidates: number[] = [...values];
  if (refLow !== null) domainCandidates.push(refLow);
  if (refHigh !== null) domainCandidates.push(refHigh);

  const minValue =
    domainCandidates.length > 0 ? Math.min(...domainCandidates) : 0;
  const maxValue =
    domainCandidates.length > 0 ? Math.max(...domainCandidates) : 100;
  const rawPadding = (maxValue - minValue) * 0.2;
  const padding = rawPadding === 0 ? 10 : rawPadding;
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  // Compute "good" range to highlight
  let goodLow: number | null = null;
  let goodHigh: number | null = null;
  if (refLow !== null && refHigh !== null) {
    goodLow = refLow;
    goodHigh = refHigh;
  } else if (refHigh !== null) {
    goodLow = 0;
    goodHigh = refHigh;
  } else if (refLow !== null) {
    goodLow = refLow;
    goodHigh = yMax;
  }

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Lab Values Over Time</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {selectedTest
              ? `Tracking: ${selectedTest}`
              : "Select a test to view trends"}
          </p>
        </div>

        {/* Test Selector */}
        <div className="w-64">
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background focus:ring-primary mb-2 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          />
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            {filteredTests.map((test) => (
              <option key={test.name} value={test.name}>
                {test.name} {test.unit ? `(${test.unit})` : ""}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground mt-1 text-xs">
            {filteredTests.length} test{filteredTests.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="mb-4 flex items-center gap-1">
        <span className="text-muted-foreground mr-2 text-xs">Time period:</span>
        {TIME_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeFilter(option.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              timeFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      {loading && (
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          Loading data...
        </div>
      )}

      {error && !loading && (
        <div className="text-destructive flex h-64 items-center justify-center text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          No data available for this test
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data.map((d, i) => ({
                ...d,
                index: i,
                refLow: refLow,
                refHigh: refHigh,
              }))}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="index"
                tickFormatter={(value) => {
                  const point = data[value as number];
                  if (!point) return "";
                  const date = new Date(point.date);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
                label={{
                  value: unit ?? "",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
                }}
              />

              {/* Reference range visualization as a light green band */}
              {goodLow !== null && goodHigh !== null && (
                <ReferenceArea
                  x1={0}
                  x2={data.length - 1}
                  y1={goodLow}
                  y2={goodHigh}
                  fill="rgba(34, 197, 94, 0.25)"
                  stroke="rgba(34, 197, 94, 0.6)"
                  strokeDasharray="3 3"
                />
              )}

              {/* Reference lines */}
              {refLow !== null && (
                <ReferenceLine
                  y={refLow}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                  label={{
                    value: "Low",
                    position: "right",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
              )}
              {refHigh !== null && (
                <ReferenceLine
                  y={refHigh}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                  label={{
                    value: "High",
                    position: "right",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
              )}

              <Tooltip
                content={({ active, payload }: TooltipContentProps<number, string>) => {
                  if (!active) {
                    return null;
                  }
                  const payloadItem: unknown = payload[0];
                  if (!isRecord(payloadItem)) {
                    return null;
                  }
                  const point = payloadItem.payload;
                  if (!isDataPoint(point)) {
                    return null;
                  }
                  const data = point;
                  const isHigh =
                    refHigh !== null &&
                    data.value !== null &&
                    data.value > refHigh;
                    const isLow =
                      refLow !== null &&
                      data.value !== null &&
                      data.value < refLow;

                    // Format change indicator
                    const changeIcon =
                      data.changeDirection === "up"
                        ? "↑"
                        : data.changeDirection === "down"
                          ? "↓"
                          : data.changeDirection === "same"
                            ? "="
                            : null;
                    const changeColor =
                      data.changeDirection === "up"
                        ? "text-red-600"
                        : data.changeDirection === "down"
                          ? "text-green-600"
                          : "text-gray-500";

                    return (
                      <div className="bg-card rounded-lg border p-3 shadow-lg">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-base font-bold ${isHigh ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"}`}
                          >
                            {data.rawValue} {data.unit}
                          </p>
                          {changeIcon && data.changePercent !== null && (
                            <span className={`text-sm font-semibold ${changeColor}`}>
                              {changeIcon} {Math.abs(data.changePercent)}%
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {new Date(data.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {data.previousValue !== null && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Previous: {data.previousValue} {data.unit}
                          </p>
                        )}
                        {data.referenceRange && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Reference: {data.referenceRange}
                          </p>
                        )}
                        {(isHigh || isLow) && (
                          <p
                            className={`mt-1 text-xs font-semibold ${isHigh ? "text-red-600" : "text-yellow-600"}`}
                          >
                            {isHigh ? "Above range" : "Below range"}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {data.provider}
                        </p>
                      </div>
                    );
                  return null;
                }}
              />

              <Line
                type="linear"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={1.5}
                strokeOpacity={0.95}
                connectNulls
                isAnimationActive={false}
                dot={(props: DotItemDotProps) => {
                  const { cx, cy } = props;
                  const point: unknown = props.payload;
                  if (!isDataPoint(point) || cx === undefined || cy === undefined) {
                    return null;
                  }
                  const isHigh =
                    refHigh !== null &&
                    point.value !== null &&
                    point.value > refHigh;
                  const isLow =
                    refLow !== null &&
                    point.value !== null &&
                    point.value < refLow;

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={isHigh ? "#dc2626" : isLow ? "#ca8a04" : "#7c3aed"}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Data Summary */}
          <div className="bg-muted/20 mt-4 grid grid-cols-4 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Latest Value</p>
              <p className="font-semibold">
                {data[data.length - 1]?.rawValue} {unit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Change</p>
              {(() => {
                const latest = data[data.length - 1];
                if (!latest?.changeDirection || latest.changePercent === null) {
                  return <p className="text-muted-foreground font-medium">—</p>;
                }
                const icon = latest.changeDirection === "up" ? "↑" : latest.changeDirection === "down" ? "↓" : "=";
                const color = latest.changeDirection === "up" ? "text-red-600" : latest.changeDirection === "down" ? "text-green-600" : "text-gray-500";
                return (
                  <p className={`font-semibold ${color}`}>
                    {icon} {Math.abs(latest.changePercent)}%
                  </p>
                );
              })()}
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reference Range</p>
              <p className="font-medium">{referenceInfo ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Data Points</p>
              <p className="font-semibold">{data.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
