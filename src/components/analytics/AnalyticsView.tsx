import React from 'react';
import { DomainComparisonChart } from './DomainComparisonChart';
import { MonthlySpendingBarChart } from './MonthlySpendingBarChart';
import { AnalyticsSummary } from './AnalyticsSummary';
import { TimeTravelInspector } from './TimeTravelInspector';
import { MetricCards } from '../dashboard/MetricCards';
import { MonthYearPicker } from '../layout/MonthYearPicker';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header with Month / Year Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
            Domain Spending & Visual Analytics
          </h2>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Deep-dive financial telemetry, category distribution, and daily/annual trends
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <MonthYearPicker />
        </div>
      </div>

      {/* Interactive Time-Travel Calendar Navigator & Hover Inspector */}
      <TimeTravelInspector />

      {/* KPI Cards */}
      <MetricCards />

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DomainComparisonChart />
        <MonthlySpendingBarChart />
      </div>

      {/* Annual Summary & Domain Ranking */}
      <div className="grid grid-cols-1 gap-6">
        <AnalyticsSummary />
      </div>
    </div>
  );
};
