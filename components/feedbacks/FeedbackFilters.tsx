import React from 'react';
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { formatDateVN } from '../../utils/dateUtils';

interface FeedbackFiltersProps {
  filterType: string;
  handleFilterChange: (type: string) => void;
  dateFilter: { startDate: string, endDate: string };
  handleCustomDateChange: (date: Date | null, field: 'startDate' | 'endDate') => void;
  reportHeader: React.ReactNode;
}

const filterOptions = [
  { label: 'Tháng này', value: 'this_month' },
  { label: 'Tháng trước', value: 'last_month' },
  { label: 'Năm này', value: 'this_year' },
  { label: '6 tháng đầu năm', value: 'first_half' },
  { label: '6 tháng cuối năm', value: 'second_half' },
  { label: 'Tùy chọn', value: 'custom' }
];

export const FeedbackFilters: React.FC<FeedbackFiltersProps> = ({
  filterType,
  handleFilterChange,
  dateFilter,
  handleCustomDateChange,
  reportHeader
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      {reportHeader}

      <div className="flex flex-wrap items-center gap-3 ml-auto">
        <Dropdown
          value={filterType}
          options={filterOptions}
          onChange={(e) => handleFilterChange(e.value)}
          className="w-full md:w-[200px] rounded-xl border-primary-600/30 font-medium text-primary-900 bg-white"
          placeholder="Chọn khoảng thời gian"
        />

        {filterType !== "custom" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <i className="pi pi-calendar text-primary-600"></i>
            <span className="text-sm font-semibold text-slate-700">
              {formatDateVN(dateFilter.startDate)} -{" "}
              {formatDateVN(dateFilter.endDate)}
            </span>
          </div>
        )}

        {filterType === "custom" && (
          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* ── Ô TỪ NGÀY ── */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Từ ngày:</span>
              <div className="bg-white border border-slate-300 rounded-md overflow-hidden hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-200 transition-all w-[140px]">
                <Calendar
                  value={dateFilter.startDate ? new Date(dateFilter.startDate) : null}
                  onChange={(e) => handleCustomDateChange(e.value as Date, "startDate")}
                  className="w-full"
                  inputClassName="w-full h-9 border-none bg-transparent px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/yyyy"
                  showIcon
                />
              </div>
            </div>

            {/* ── Ô ĐẾN NGÀY ── */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 whitespace-nowrap">Đến ngày:</span>
              <div className="bg-white border border-slate-300 rounded-md overflow-hidden hover:border-primary-500 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-200 transition-all w-[140px]">
                <Calendar
                  value={dateFilter.endDate ? new Date(dateFilter.endDate) : null}
                  onChange={(e) => handleCustomDateChange(e.value as Date, "endDate")}
                  className="w-full"
                  inputClassName="w-full h-9 border-none bg-transparent px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 outline-none cursor-pointer"
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/yyyy"
                  showIcon
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
