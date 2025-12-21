"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "~/trpc/trpc-provider";

// Color palette for charts
const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

type TimeRange = 7 | 14 | 30 | 90;

export function AnalyticsDashboard() {
  const [days, setDays] = useState<TimeRange>(30);

  // Fetch all analytics data
  const { data: summary, isLoading: summaryLoading } = api.analytics.getSummary.useQuery({
    startDate: subDays(new Date(), days),
    endDate: new Date(),
  });

  const { data: dailyStats, isLoading: dailyLoading } = api.analytics.getDailyStats.useQuery({
    days,
  });

  const { data: featureUsage, isLoading: featureLoading } = api.analytics.getFeatureUsage.useQuery({
    days,
  });

  const { data: activeUsers } = api.analytics.getActiveUsers.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: topPages } = api.analytics.getTopPages.useQuery({ days, limit: 5 });

  const { data: deviceDistribution } = api.analytics.getDeviceDistribution.useQuery({ days });

  const isLoading = summaryLoading || dailyLoading || featureLoading;

  // Format daily stats for charts
  const chartData = dailyStats?.map((stat) => ({
    date: format(new Date(stat.date), "MMM d"),
    pageViews: stat.pageViews,
    uniqueUsers: stat.uniqueUsers,
    sessions: stat.uniqueSessions,
  })) ?? [];

  // Format feature usage for bar chart
  const featureData = featureUsage?.reduce((acc, item) => {
    const existing = acc.find((a) => a.feature === item.feature);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ feature: item.feature, count: item.count });
    }
    return acc;
  }, [] as { feature: string; count: number }[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Privacy-respecting usage statistics for your university project
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time range:</span>
          <div className="flex rounded-lg border bg-muted/30 p-1">
            {([7, 14, 30, 90] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDays(range)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time active users banner */}
      {activeUsers && activeUsers.count > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-800">
            {activeUsers.count} active user{activeUsers.count !== 1 ? "s" : ""} right now
          </span>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Page Views"
          value={summary?.overview.totalPageViews ?? 0}
          change={summary?.trends.pageViewsChange}
          loading={isLoading}
        />
        <MetricCard
          title="Unique Users"
          value={summary?.overview.uniqueUsers ?? 0}
          change={summary?.trends.usersChange}
          loading={isLoading}
        />
        <MetricCard
          title="Sessions"
          value={summary?.overview.uniqueSessions ?? 0}
          loading={isLoading}
        />
        <MetricCard
          title="Avg. Session"
          value={
            summary?.overview.avgSessionDuration
              ? `${Math.round(summary.overview.avgSessionDuration / 60)}m`
              : "—"
          }
          loading={isLoading}
          isText
        />
      </div>

      {/* Feature usage cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-100 p-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Labs Uploaded</p>
              <p className="text-xl font-bold">{summary?.features.labsUploaded ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-100 p-2">
              <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medications Created</p>
              <p className="text-xl font-bold">{summary?.features.medicationsCreated ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medication Logs</p>
              <p className="text-xl font-bold">{summary?.features.medicationsLogged ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Page views over time */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Page Views Over Time</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Page Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueUsers"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    name="Unique Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Feature usage */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Feature Usage</h3>
          <div className="h-64">
            {featureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No feature usage data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row - Top pages and Device distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top pages */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Top Pages</h3>
          {topPages && topPages.length > 0 ? (
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-mono">{page.path}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{page.views} views</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No page view data yet
            </div>
          )}
        </div>

        {/* Device distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Device Distribution</h3>
          <div className="h-48">
            {deviceDistribution && deviceDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      dataKey="count"
                      nameKey="deviceType"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={false}
                    >
                      {deviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {deviceDistribution.map((device, index) => (
                    <div key={device.deviceType} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm capitalize">{device.deviceType}</span>
                      <span className="text-sm text-muted-foreground">({device.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No device data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Privacy-First Analytics</h4>
            <p className="mt-1 text-xs text-blue-800">
              This dashboard shows aggregated, anonymized statistics only. No personal health information (PHI)
              is ever tracked or displayed. Session IDs rotate every 30 minutes and cannot be linked to user identities.
              All data is self-hosted and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric card component
function MetricCard({
  title,
  value,
  change,
  loading,
  isText = false,
}: {
  title: string;
  value: number | string;
  change?: number;
  loading?: boolean;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-bold">
            {isText ? value : typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <span
              className={`text-xs font-medium ${
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
