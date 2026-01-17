"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/shared/components/ui/button";

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

const LINE_COLORS = ["#7c3aed", "#22c55e", "#2563eb", "#f97316", "#ec4899", "#0ea5e9"];

export default function LabValuesChart() {
  const [availableTests, setAvailableTests] = useState<TestOption[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);
  const [testDataMap, setTestDataMap] = useState<Record<string, DataPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compareDropdownRef = useRef<HTMLDivElement | null>(null);
  const [draggingTest, setDraggingTest] = useState<string | null>(null);

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
        } else if (json.error) {
          throw new Error(json.error);
        }
      } catch (err) {
        console.error("Failed to fetch tests", err);
      }
    }
    void fetchTests();
  }, []);

  // Fetch history when selected tests or time filter changes
  useEffect(() => {
    if (selectedTests.length === 0) {
      setTestDataMap({});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const filterDays = TIME_FILTER_OPTIONS.find((f) => f.value === timeFilter)?.days ?? 0;
        const results = await Promise.all(
          selectedTests.map(async (testName) => {
            const url = `/api/labs/history?testName=${encodeURIComponent(testName)}${filterDays > 0 ? `&days=${filterDays}` : ""}`;
            const res = await fetch(url);
            const payload: unknown = await res.json();
            const json = parseHistoryResponse(payload);
            if (!json) {
              throw new Error("Unexpected history response");
            }
            if (!json.ok) {
              throw new Error(json.error ?? `Failed to load ${testName}`);
            }
            const seriesData: DataPoint[] =
              timeFilter === "last" && json.data.length > 0
                ? [json.data[json.data.length - 1]!]
                : json.data;
            return { testName, data: seriesData };
          }),
        );

        if (cancelled) return;
        const nextMap: Record<string, DataPoint[]> = {};
        results.forEach(({ testName, data }) => {
          nextMap[testName] = data;
        });
        setTestDataMap(nextMap);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load chart data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedTests, timeFilter]);

  useEffect(() => {
    if (!compareDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!compareDropdownRef.current) return;
      if (!compareDropdownRef.current.contains(event.target as Node)) {
        setCompareDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [compareDropdownOpen]);

  const selectedUnit = useMemo(
    () => availableTests.find((test) => test.name === selectedTest)?.unit ?? null,
    [availableTests, selectedTest],
  );
  const hasUnitConstraint =
    selectedTest !== "" && selectedUnit !== null && selectedUnit !== undefined;

  const compatibleTests = useMemo(
    () =>
      availableTests.filter(
        (test) => !hasUnitConstraint || test.unit === selectedUnit,
      ),
    [availableTests, hasUnitConstraint, selectedUnit],
  );

  const filteredTests = compatibleTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleAddCompareTest(testName: string) {
    if (hasUnitConstraint) {
      const candidateUnit =
        availableTests.find((test) => test.name === testName)?.unit ?? null;
      if (candidateUnit !== selectedUnit) return;
    }

    setSelectedTests((prev) => {
      if (prev.includes(testName)) return prev;
      return [...prev, testName];
    });
    setCompareDropdownOpen(false);
    if (!selectedTest) {
      setSelectedTest(testName);
    }
  }

  function handleRemoveCompareTest(testName: string) {
    setSelectedTests((prev) => {
      const updated = prev.filter((test) => test !== testName);
      setSelectedTest((current) => {
        if (current !== testName) return current;
        if (updated.length > 0) return updated[0]!;
        return "";
      });
      return updated;
    });
  }

  function handlePrimarySelection(value: string) {
    if (!value) {
      setSelectedTest("");
      setSelectedTests([]);
      setTestDataMap({});
      return;
    }
    const chosenUnit =
      availableTests.find((test) => test.name === value)?.unit ?? null;
    const enforceUnit = value !== "" && chosenUnit !== null && chosenUnit !== undefined;
    setSelectedTest(value);
    setSelectedTests((prev) => {
      const remaining = prev.filter((item) => {
        if (item === value) return false;
        if (!enforceUnit) return true;
        const unit = availableTests.find((test) => test.name === item)?.unit ?? null;
        return unit === chosenUnit;
      });
      return [value, ...remaining];
    });
    if (enforceUnit) {
      setTestDataMap((prev) => {
        const next: Record<string, DataPoint[]> = {};
        Object.entries(prev).forEach(([name, seriesData]) => {
          const unit = availableTests.find((test) => test.name === name)?.unit ?? null;
          if (unit === chosenUnit && seriesData) {
            next[name] = seriesData;
          }
        });
        return next;
      });
    }
  }

  function handleDragStart(testName: string) {
    setDraggingTest(testName);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>, targetTest: string) {
    event.preventDefault();
    if (!draggingTest || draggingTest === targetTest) return;
    setSelectedTests((prev) => {
      const fromIndex = prev.indexOf(draggingTest);
      const toIndex = prev.indexOf(targetTest);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingTest);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggingTest(null);
  }

  const seriesList = useMemo(() => {
    return selectedTests.map((testName, index) => ({
      name: testName,
      key: `series-${index}`,
      color: LINE_COLORS[index % LINE_COLORS.length]!,
      data: testDataMap[testName] ?? [],
    }));
  }, [selectedTests, testDataMap]);

  const allDates = useMemo(() => {
    const dates = new Set<string>();
    seriesList.forEach((series) => {
      series.data.forEach((point) => dates.add(point.date));
    });
    return Array.from(dates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
  }, [seriesList]);

  const chartData = useMemo(() => {
    return allDates.map((date, idx) => {
      const entry: Record<string, unknown> = {
        date,
        index: idx,
        points: {} as Record<string, DataPoint | undefined>,
      };
      seriesList.forEach((series) => {
        const point = series.data.find((d) => d.date === date);
        entry[series.key] = point?.value ?? null;
        (entry.points as Record<string, DataPoint | undefined>)[series.key] = point;
      });
      return entry;
    });
  }, [allDates, seriesList]);

  const focusedData = selectedTest ? testDataMap[selectedTest] ?? [] : [];

  // Parse reference range for display (if possible)
  const referenceInfo = focusedData[0]?.referenceRange;
  const unit = focusedData[0]?.unit;

  // Parse reference range (e.g., "< 50", "3.1 - 6.8", "70-100")
  let refLow: number | null = null;
  let refHigh: number | null = null;
  if (referenceInfo) {
    const rangeMatch = /([\d.]+)\s*-\s*([\d.]+)/.exec(referenceInfo);
    const ltMatch = /[<≤]\s*([\d.]+)/.exec(referenceInfo);
    const gtMatch = /[>≥]\s*([\d.]+)/.exec(referenceInfo);

    if (rangeMatch?.[1] && rangeMatch[2]) {
      refLow = parseFloat(rangeMatch[1]);
      refHigh = parseFloat(rangeMatch[2]);
    } else if (ltMatch?.[1]) {
      refHigh = parseFloat(ltMatch[1]);
    } else if (gtMatch?.[1]) {
      refLow = parseFloat(gtMatch[1]);
    }
  }

  // Calculate Y-axis domain with padding, including reference bounds
  const values = seriesList
    .flatMap((series) => series.data.map((d) => d.value))
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Lab Values Over Time</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {selectedTest
              ? `Tracking: ${selectedTest}`
              : "Select a test to view trends"}
          </p>
        </div>

        {/* Test Selector & Compare */}
        <div className="flex flex-wrap items-start gap-3 lg:justify-end">
          <div className="w-full min-w-[16rem] max-w-xs">
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background focus:ring-primary mb-2 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            />
            <select
              value={selectedTest}
              onChange={(e) => handlePrimarySelection(e.target.value)}
              className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">Clear selection</option>
              {filteredTests.map((test) => (
                <option key={test.name} value={test.name}>
                  {test.name} {test.unit ? `(${test.unit})` : ""}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground mt-1 text-xs">
              {hasUnitConstraint && selectedUnit
                ? `Showing tests with unit: ${selectedUnit}`
                : `${filteredTests.length} test${filteredTests.length !== 1 ? "s" : ""} available`}
            </p>
          </div>

          <div ref={compareDropdownRef} className="relative">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setCompareDropdownOpen((prev) => !prev)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              aria-haspopup="listbox"
              aria-expanded={compareDropdownOpen}
            >
              <svg
                aria-hidden="true"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Compare Tests</span>
              <svg
                aria-hidden="true"
                className={`size-3.5 transition-transform ${compareDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            {compareDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border bg-popover shadow-lg">
                <div className="border-b px-3 py-2 text-sm font-semibold text-foreground">
                  Add test to compare
                </div>
                {hasUnitConstraint && selectedUnit && (
                  <div className="text-muted-foreground border-b px-3 py-2 text-xs">
                    Showing tests with unit: {selectedUnit}
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto py-1">
                  {compatibleTests.length === 0 && (
                    <p className="text-muted-foreground px-3 py-2 text-sm">
                      No tests available
                    </p>
                  )}
                  {compatibleTests.map((test) => {
                    const alreadyAdded = selectedTests.includes(test.name);
                    return (
                      <button
                        key={test.name}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleAddCompareTest(test.name)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          alreadyAdded
                            ? "cursor-not-allowed text-muted-foreground/80"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {test.name}
                          </p>
                          {test.unit && (
                            <p className="text-muted-foreground truncate text-xs">
                              Unit: {test.unit}
                            </p>
                          )}
                        </div>
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${
                            alreadyAdded
                              ? "border-transparent bg-muted text-muted-foreground"
                              : "border-primary/30 bg-primary/10 text-primary"
                          }`}
                        >
                          <span className="text-base leading-none">+</span>
                          {alreadyAdded ? "Added" : "Add"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTests.length > 0 && (
        <div className="bg-muted/30 mb-4 rounded-lg border px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Comparing tests
            </p>
            <p className="text-muted-foreground text-xs">
              Tap a test to focus the chart or remove it
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTests.map((test) => (
              <button
                key={test}
                type="button"
                draggable
                onClick={() => setSelectedTest(test)}
                className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  selectedTest === test
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary hover:text-primary"
                } ${draggingTest === test ? "ring-2 ring-primary/40" : ""}`}
                aria-grabbed={draggingTest === test}
                onDragStart={() => handleDragStart(test)}
                onDragOver={(event) => handleDragOver(event, test)}
                onDragEnd={handleDragEnd}
              >
                <span className="truncate">{test}</span>
                <span
                  role="button"
                  aria-label={`Remove ${test} from compare list`}
                  className="text-muted-foreground transition-colors group-hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveCompareTest(test);
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {!loading && !error && selectedTests.length === 0 && (
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          No tests selected. Choose a test to start plotting.
        </div>
      )}

      {!loading && !error && selectedTests.length > 0 && chartData.length === 0 && (
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          No data available for the selected tests
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
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
                  const entry = chartData[value as number];
                  if (!entry) return "";
                  const date = new Date((entry as { date: string }).date);
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
                  x2={chartData.length - 1}
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
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const entry = payload[0]?.payload as {
                    date: string;
                    points?: Record<string, DataPoint | undefined>;
                  } | undefined;
                  if (!entry) return null;
                  const points = entry.points ?? {};
                  const items = payload
                    .map((item) => {
                      const point = points[item.dataKey as string];
                      if (!point || point.value === null) return null;
                      const isHigh =
                        refHigh !== null && point.value !== null && point.value > refHigh;
                      const isLow =
                        refLow !== null && point.value !== null && point.value < refLow;
                      const changeIcon =
                        point.changeDirection === "up"
                          ? "↑"
                          : point.changeDirection === "down"
                            ? "↓"
                            : point.changeDirection === "same"
                              ? "="
                              : null;
                      const changeColor =
                        point.changeDirection === "up"
                          ? "text-red-600"
                          : point.changeDirection === "down"
                            ? "text-green-600"
                            : "text-gray-500";
                      const meta = seriesList.find((s) => s.key === item.dataKey);
                      return {
                        point,
                        isHigh,
                        isLow,
                        changeIcon,
                        changeColor,
                        name: meta?.name ?? item.name,
                        color: meta?.color ?? item.color,
                      };
                    })
                    .filter((v): v is NonNullable<typeof v> => Boolean(v));

                  if (items.length === 0) return null;

                  return (
                    <div className="bg-card rounded-lg border p-3 shadow-lg text-sm">
                      <p className="text-muted-foreground mb-2 text-xs">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex flex-col gap-2">
                        {items.map((item) => (
                          <div key={item.name} className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="block size-2.5 rounded-full"
                                style={{ background: item.color }}
                              />
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p
                                  className={`text-base font-bold ${item.isHigh ? "text-red-600" : item.isLow ? "text-yellow-600" : "text-green-600"}`}
                                >
                                  {item.point.rawValue} {item.point.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {item.changeIcon && item.point.changePercent !== null && (
                                <p className={`font-semibold ${item.changeColor}`}>
                                  {item.changeIcon} {Math.abs(item.point.changePercent)}%
                                </p>
                              )}
                              {item.point.referenceRange && (
                                <p>Ref: {item.point.referenceRange}</p>
                              )}
                              {item.point.previousValue !== null && (
                                <p>Prev: {item.point.previousValue}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />

              {seriesList.map((series) => (
                <Line
                  key={series.key}
                  type="linear"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.95}
                  connectNulls
                  isAnimationActive={false}
                  dot={(props) => {
                    const { cx, cy, value, payload } = props as {
                      cx: number;
                      cy: number;
                      value: number | null;
                      payload: { points?: Record<string, DataPoint | undefined> };
                    };
                    const point = payload.points?.[series.key];
                    const pointValue = point?.value;
                    const isHigh =
                      refHigh !== null &&
                      pointValue !== null &&
                      pointValue !== undefined &&
                      pointValue > refHigh;
                    const isLow =
                      refLow !== null &&
                      pointValue !== null &&
                      pointValue !== undefined &&
                      pointValue < refLow;

                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={value === null ? 0 : 5}
                        fill={isHigh ? "#dc2626" : isLow ? "#ca8a04" : series.color}
                        stroke="white"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Data Summary */}
          <div className="bg-muted/20 mt-4 grid grid-cols-4 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Latest Value</p>
              <p className="font-semibold">
                {focusedData[focusedData.length - 1]?.rawValue ?? "—"} {unit ?? ""}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Change</p>
              {(() => {
                const latest = focusedData[focusedData.length - 1];
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
              <p className="font-semibold">{focusedData.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
