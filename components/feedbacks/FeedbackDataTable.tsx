import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { FeedbackItem } from "../../types/feedbacks";
import { formatDisplayDateTime } from "../../utils/dateUtils";

interface FeedbackDataTableProps {
  feedbacks: FeedbackItem[];
  loading: boolean;
  totalRecords: number;
  lazyParams: { first: number; rows: number; page: number };
  onPage: (event: any) => void;
  onViewDetails: (rowData: FeedbackItem) => void;
}

export const FeedbackDataTable: React.FC<FeedbackDataTableProps> = ({
  feedbacks,
  loading,
  totalRecords,
  lazyParams,
  onPage,
  onViewDetails,
}) => {
  const sttBodyTemplate = (_: any, options: { rowIndex: number }) =>
    options.rowIndex + lazyParams.first + 1;

  const nameBodyTemplate = (rowData: FeedbackItem) =>
    rowData.name || rowData.fullName || rowData.creator_name || "Không có tên";

  const dateBodyTemplate = (rowData: FeedbackItem) => {
    const d = rowData.createdAt || rowData.created_at || rowData.date;
    return d ? formatDisplayDateTime(d) : "";
  };

  const actionBodyTemplate = (rowData: FeedbackItem) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-eye" 
        rounded 
        outlined 
        className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" 
        onClick={() => onViewDetails(rowData)} 
        title="Xem chi tiết" 
      />
    </div>
  );

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-900">Danh sách ý kiến</h2>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          value={feedbacks}
          loading={loading}
          lazy
          paginator
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage="Không có dữ liệu phản hồi"
        >
          <Column header="STT" body={sttBodyTemplate} style={{ width: '5rem' }} />
          <Column header="Người gửi" style={{ width: '15rem' }} body={nameBodyTemplate} />
          <Column header="Ngày gửi" body={dateBodyTemplate} style={{ width: '10rem' }} />
          <Column body={actionBodyTemplate} exportable={false} style={{ width: '5rem' }} header="Thao tác" />
        </DataTable>
      </div>
    </div>
  );
};
