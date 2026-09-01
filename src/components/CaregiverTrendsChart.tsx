import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Layers } from 'lucide-react';
import type { DayActivityData, CategorySummary } from '@/lib/caregiverData';

interface CaregiverTrendsChartProps {
  dailyTrends: DayActivityData[];
  categories: CategorySummary[];
}

type ActiveChartTab = 'frequency' | 'accuracy' | 'categories';

export function CaregiverTrendsChart({ dailyTrends, categories }: CaregiverTrendsChartProps) {
  const [activeTab, setActiveTab] = useState<ActiveChartTab>('frequency');

  const totalWeeklySessions = dailyTrends.reduce((sum, d) => sum + d.sessionsCount, 0);

  return (
    <div className="card overflow-hidden !p-6 sm:!p-8">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <h3 className="font-display text-xl font-semibold text-teal-900">
              Weekly Performance Trends
            </h3>
          </div>
          <p className="mt-1 text-sm font-semibold text-teal-500">
            {totalWeeklySessions} activities completed across the last 7 days
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-2xl bg-sand-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('frequency')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'frequency'
                ? 'bg-white text-teal-900 shadow-soft'
                : 'text-teal-600 hover:text-teal-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Activity Frequency</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accuracy')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'accuracy'
                ? 'bg-white text-teal-900 shadow-soft'
                : 'text-teal-600 hover:text-teal-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Accuracy Trend</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all sm:text-sm ${
              activeTab === 'categories'
                ? 'bg-white text-teal-900 shadow-soft'
                : 'text-teal-600 hover:text-teal-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Domain Breakdown</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-64 w-full sm:h-72">
        {activeTab === 'frequency' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis
                dataKey="dayName"
                tick={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#E5E0D8' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#F5F2EC' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayActivityData;
                    return (
                      <div className="rounded-2xl border border-teal-100 bg-white p-3 shadow-soft">
                        <p className="text-xs font-bold text-teal-500">{data.dateStr}</p>
                        <p className="mt-1 font-display text-sm font-bold text-teal-900">
                          {data.sessionsCount} {data.sessionsCount === 1 ? 'session' : 'sessions'} completed
                        </p>
                        {data.sessionsCount > 0 && (
                          <p className="text-xs font-semibold text-teal-600">
                            Avg. Accuracy: {data.avgAccuracy}%
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="sessionsCount"
                fill="#0D9488"
                radius={[8, 8, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'accuracy' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" vertical={false} />
              <XAxis
                dataKey="dayName"
                tick={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#E5E0D8' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DayActivityData;
                    return (
                      <div className="rounded-2xl border border-teal-100 bg-white p-3 shadow-soft">
                        <p className="text-xs font-bold text-teal-500">{data.dateStr}</p>
                        <p className="mt-1 font-display text-sm font-bold text-teal-900">
                          {data.avgAccuracy > 0 ? `${data.avgAccuracy}% Accuracy` : 'No sessions'}
                        </p>
                        <p className="text-xs font-semibold text-teal-600">
                          {data.sessionsCount} activities completed
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="avgAccuracy"
                stroke="#0D9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#accuracyGradient)"
                dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#0D9488', strokeWidth: 2, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'categories' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#0F766E', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#E5E0D8' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={{ fill: '#134E4A', fontSize: 12, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#F5F2EC' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CategorySummary;
                    return (
                      <div className="rounded-2xl border border-teal-100 bg-white p-3 shadow-soft">
                        <p className="font-display text-sm font-bold text-teal-900">{data.name}</p>
                        <p className="text-xs font-semibold text-teal-600">
                          {data.sessionsCount} sessions completed
                        </p>
                        <p className="text-xs font-semibold text-teal-600">
                          Average Accuracy: {data.averageAccuracy}%
                        </p>
                        <p className="text-xs font-semibold text-teal-600">
                          Avg Response: {data.averageResponseTimeSec}s
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="sessionsCount"
                fill="#14B8A6"
                radius={[0, 8, 8, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-teal-50 pt-4 text-xs font-semibold text-teal-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Sessions automatically update in real-time
        </span>
        <span className="text-teal-600">
          Optimal daily engagement: 1–2 exercises
        </span>
      </div>
    </div>
  );
}
