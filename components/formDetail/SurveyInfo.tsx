import { socialFacilitiesService } from "@/services/socialFacilitiesService";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import React, { useEffect, useMemo, useRef, useState } from "react";
const PAGE_SIZE = 10;
export default function SurveyInfo({ info, fieldKey, value, onChange, error }) {

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [searchText, setSearchText] = useState("");
  const panelRef = useRef(null);
  const [apiOptions, setApiOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const handlePanelScroll = (e) => {
    const el = e.target;
    const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

    if (isNearBottom && visibleCount < filteredOptions.length) {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_SIZE, filteredOptions.length),
      );
    }
  };
  const INPUT_HEIGHT = "h-[45px]";
  const commonInputClass = `
  w-full ${INPUT_HEIGHT} rounded-xl border bg-white px-4 text-[15px] text-slate-700
  shadow-sm outline-none transition-all duration-200
  ${
    error
      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
      : "border-slate-300 hover:border-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
  }
`;

  const dropdownPt = {
    root: {
      className: `
      w-full ${INPUT_HEIGHT} rounded-xl border bg-white text-[15px] text-slate-700 shadow-sm transition-all duration-200
      ${
        error
          ? "border-red-500 ring-2 ring-red-100"
          : "border-slate-300 hover:border-slate-400 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100"
      }
    `,
    },
    input: {
      className: "flex items-center h-full px-4 text-[15px] text-slate-700",
    },
    trigger: {
      className: "w-10 h-full flex items-center justify-center text-slate-400",
    },
    panel: {
      className:
        "mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl",
    },
    wrapper: {
      className: "max-h-60",
      onScroll: handlePanelScroll,
    },
    item: ({ context }) => ({
      className: `
      px-4 py-2 text-[14px] cursor-pointer transition-colors
      ${
        context.selected
          ? "bg-blue-500 text-white"
          : "text-slate-700 hover:bg-blue-50"
      }
    `,
    }),
    filterInput: {
      className:
        "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    },
  };

  useEffect(() => {
    const fetchOptions = async () => {
      if (info.type !== "select" && info.type !== "facility_multiselect") return;

      if (!info.facilityTypeFilter?.length) return;

      try {
        setLoading(true);
        // Pass all items in facilityTypeFilter joined by comma
        const typeFilter = Array.isArray(info.facilityTypeFilter)
          ? info.facilityTypeFilter.join(",")
          : info.facilityTypeFilter;

        const response = await socialFacilitiesService.getAll(1, 1000, typeFilter);
        const data = response.items || response || [];
        setApiOptions(data.map((f: any) => ({ key: f.id, value: f.name })));
      } catch (err) {
        console.error("Failed to fetch filtered facilities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [info.type, info.facilityTypeFilter]);

  const selectOptions = useMemo(() => {
    if (info.option?.length) return info.option;

    if (apiOptions.length > 0) return apiOptions;

    return [];
  }, [info.option, apiOptions]);

  const filteredOptions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return selectOptions;

    return selectOptions.filter((item) =>
      String(item.value).toLowerCase().includes(keyword),
    );
  }, [selectOptions, searchText]);
  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, visibleCount);
  }, [filteredOptions, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchText, selectOptions]);

  const initializedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!value?.value && initializedKey.current !== fieldKey) {
      if (info.type === "date") {
        onChange(fieldKey, {
          key: info.key,
          value: new Date().toISOString(),
        });
        initializedKey.current = fieldKey;
      } else if (info.type === "select" || info.type === "facility_multiselect") {
        const unitId = localStorage.getItem("unit_id");
        if (unitId) {
          const matchedOption = selectOptions.find(
            (opt) => String(opt.key) === String(unitId),
          );
          if (matchedOption) {
            onChange(fieldKey, {
              key: info.key,
              value: matchedOption,
            });
          }
        }
        initializedKey.current = fieldKey;
      }
    }
  }, [info.type, info.key, fieldKey, value?.value, onChange, selectOptions]);

  const isReadOnly = 
    info.title?.toLowerCase().includes("ngày điền") || 
    info.value === "ngay_ien" || 
    info.key === "ngay_ien";

  const renderField = () => {
    switch (info.type) {
      case "text":
        return (
          <input
            type="text"
            disabled={isReadOnly}
            value={value?.value || ""}
            className={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.target.value,
              })
            }
            placeholder={info.placeholder || "Nhập nội dung"}
          />
        );

      case "number":
        return (
          <input
            type="number"
            disabled={isReadOnly}
            value={value?.value || ""}
            className={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.target.value,
              })
            }
            placeholder={info.placeholder || "Nhập số"}
          />
        );

      case "date":
        return (
          <Calendar
            value={value?.value ? new Date(value.value) : null}
            disabled={isReadOnly}
            onChange={(e) =>
              onChange(fieldKey, {
                key: info.key,
                value: e.value ? new Date(e.value).toISOString() : "",
              })
            }
            dateFormat="dd/mm/yy"
            className="w-full"
            inputClassName={`${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
            pt={{
              root: { className: "w-full" },
              input: { className: `${commonInputClass} ${isReadOnly ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}` },
            }}
          />
        );

      case "select":
      case "facility_multiselect":
        return (
          <Dropdown
            value={value?.value?.key ?? null}
            options={visibleOptions}
            optionLabel="value"
            optionValue="key"
            placeholder="Chọn"
            filter
            filterPlaceholder="Tìm kiếm..."
            className="w-full"
            pt={dropdownPt}
            onFilter={(e) => setSearchText(e.filter)}
            onChange={(e) => {
              const selectedOption =
                visibleOptions.find(
                  (opt) => String(opt.key) === String(e.value),
                ) || null;

              onChange(fieldKey, {
                key: info.key,
                value: selectedOption,
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-2 min-h-[48px]">
        <label className="mb-1 block font-medium text-slate-700">
          {info.title} {info.isValidate !== false && !isReadOnly && <span className="text-red-500">*</span>}
        </label>
      </div>
      {renderField()}
      {error && (
        <div className="mt-2 text-sm text-red-500">
          Vui lòng nhập thông tin này
        </div>
      )}
    </div>
  );
}
