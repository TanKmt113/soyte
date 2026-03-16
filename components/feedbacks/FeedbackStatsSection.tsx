import React from "react";
import { Chart } from "primereact/chart";
import { DashboardStats } from "../../types/DashboardStats";

interface FeedbackStatsSectionProps {
  stats: DashboardStats | null;
  tiendoChartData: any;
  danhgiaChartData: any;
  lineChartData: any;
  barChartData: any;
}

const chartOptions = {
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  cutout: '60%',
  maintainAspectRatio: false
};

const lineChartOptions = {
  plugins: { legend: { display: false } },
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
};

const barChartOptions = {
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  maintainAspectRatio: false,
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } }
  }
};

export const FeedbackStatsSection: React.FC<FeedbackStatsSectionProps> = ({
  stats,
  tiendoChartData,
  danhgiaChartData,
  lineChartData,
  barChartData,
}) => {
  if (!stats) return null;

  return (
    <>
      {stats.phuluc && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-base font-bold text-primary-900 mb-4">Tỉ lệ Tiến độ thực hiện</h3>
            <div className="w-full max-w-[350px] mx-auto h-[200px] relative">
              <Chart type="doughnut" data={tiendoChartData} options={chartOptions} className="w-full h-full" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-base font-bold text-primary-900 mb-4">Tỉ lệ Đánh giá chất lượng</h3>
            <div className="w-full max-w-[350px] mx-auto h-[200px] relative">
              <Chart type="doughnut" data={danhgiaChartData} options={chartOptions} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col">
          <h3 className="text-base font-bold text-primary-900 mb-4">Tổng hợp số lượng phản hồi</h3>
          <div className="w-full h-[250px] relative mt-auto">
            <Chart type="line" data={lineChartData} options={lineChartOptions} className="w-full h-full" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col">
          <h3 className="text-base font-bold text-primary-900 mb-4">Tổng hợp mức độ hài lòng</h3>
          <div className="w-full h-[250px] relative mt-auto">
            <Chart type="bar" data={barChartData} options={barChartOptions} className="w-full h-full" />
          </div>
        </div>
      </div>
    </>
  );
};
