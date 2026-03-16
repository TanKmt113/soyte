/** Formats YYYY-MM-DD to DD/MM/YYYY */
export const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

/** Get first and last day of current month in YYYY-MM-DD format */
export const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return {
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay)
  };
};

/** Formats any date string/object to DD/MM/YYYY */
export const formatDisplayDate = (d: string | Date) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("vi-VN");
};

/** Formats any date string/object to DD/MM/YYYY HH:mm */
export const formatDisplayDateTime = (d: string | Date) => {
  if (!d) return "";
  const date = new Date(d);
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
};

/** Formats date object to YYYY-MM-DD */
export const formatDatePayload = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
