import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FeedbackItem } from '../../types/feedbacks';
import { formatDisplayDateTime } from '../../utils/dateUtils';
import { confirmDialog } from 'primereact/confirmdialog';
import { Trash2 } from 'lucide-react';

interface FeedbackDataTableProps {
  feedbacks: FeedbackItem[];
  loading: boolean;
  totalRecords: number;
  lazyParams: { first: number, rows: number, page: number };
  onPage: (event: any) => void;
  viewDetails: (rowData: FeedbackItem) => void;
  onDelete?: (id: string) => void;
}

export const FeedbackDataTable: React.FC<FeedbackDataTableProps> = ({
  feedbacks,
  loading,
  totalRecords,
  lazyParams,
  onPage,
  viewDetails,
  onDelete
}) => {
  const actionBodyTemplate = (rowData: FeedbackItem) => {
    const id = rowData.id || rowData._id;

    const confirmDelete = () => {
      confirmDialog({
        message: 'Bạn có chắc chắn muốn xoá phản hồi này?',
        header: 'Xác nhận xoá',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Xoá',
        rejectLabel: 'Hủy',
        acceptClassName: "!bg-red-600 !border-red-600 hover:!bg-red-700 !px-6 !py-2.5 !rounded-xl !font-black !text-white !shadow-lg !shadow-red-100 !transition-all",
        rejectClassName: "!text-gray-600 hover:!bg-gray-50 !px-6 !py-2.5 !rounded-xl !font-black !border-none !transition-all",
        accept: () => {
          if (id && onDelete) {
            onDelete(id);
          }
        }
      });
    };

    return (
      <div className="flex gap-2">
        <Button icon="pi pi-eye" rounded outlined className="w-8 h-8 p-0 text-primary-600 border-primary-600 hover:bg-primary-50" onClick={() => viewDetails(rowData)} title="Xem chi tiết" />
        {onDelete && (
          <Button
            icon={<Trash2 size={16} />}
            rounded
            outlined
            severity="danger"
            className="w-8 h-8 p-0"
            onClick={confirmDelete}
            title="Xoá phản hồi"
            disabled={!id}
          />
        )}
      </div>
    );
  };

  const dateBodyTemplate = (rowData: FeedbackItem) => {
    const d = rowData.createdAt || rowData.created_at || rowData.date;
    return formatDisplayDateTime(d as string);
  };

  const nameBodyTemplate = (rowData: FeedbackItem) =>
    rowData.name || rowData.fullName || rowData.creator_name || "Không có tên";

  const sttBodyTemplate = (_: any, options: { rowIndex: number }) =>
    options.rowIndex + lazyParams.first + 1;

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
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage="Không có dữ liệu phản hồi"
        >
          <Column header="STT" body={sttBodyTemplate} style={{ width: "5rem" }} />
          <Column header="Người gửi" style={{ width: "15rem" }} body={nameBodyTemplate} />
          <Column header="Ngày gửi" body={dateBodyTemplate} style={{ width: "10rem" }} />
          <Column body={actionBodyTemplate} exportable={false} style={{ width: "5rem" }} header="Thao tác" />
        </DataTable>
      </div>
    </div>
  );
};
