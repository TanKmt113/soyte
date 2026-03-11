import AdminLayout from "../components/AdminLayout";
import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "@/components/prime";
import { useNavigate, useParams } from "react-router-dom";
import { formService } from "../services/formService";

interface InfoOptionNode {
  key: number | string;
  value: string;
}

interface InfoNode {
  title: string;
  value: string;
  type: string;
  status: boolean;
  option: InfoOptionNode[];
}

interface OptionNode {
  content: string;
  method: string;
  productOut: string;
  progress: { type: string; value: number };
  rating: { type: string; value: number };
  ratingVote?: { type: string; value: number };
  note?: string;
  answerType?: 'score1_5' | 'single_choice' | 'percentage' | 'text';
  answerOptions?: { key: number | string; value: string }[];
  status: boolean;
}

interface GroupNode {
  name: string;
  status: boolean;
  Roman?: "number" | "roman";
  option: OptionNode[];
}

interface TemplateData {
  name: string;
  description: string;
  status: boolean;
  type?: string;
  info?: InfoNode[];
  data: GroupNode[];
}

const TemplateCreate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [template, setTemplate] = useState<TemplateData>({
    name: "",
    description: "",
    status: true,
    type: "phuluc",
    info: [],
    data: [
      {
        name: "",
        status: true,
        Roman: "roman",
        option: []
      }
    ]
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const toggleGroup = (index: number) => {
    setExpandedGroups(prev => ({ ...prev, [index]: prev[index] === undefined ? false : !prev[index] }));
  };

  const toast = useRef<Toast>(null);

  React.useEffect(() => {
    if (id) {
      const fetchTemplate = async () => {
        try {
          setFetching(true);
          const data = await formService.fetchFormById(id);
          // Populate data
          const templateData = data?.data || data;
          if (templateData) {
            console.log(templateData);
            setTemplate({
              ...templateData,
              status: templateData.status === 'active' || templateData.status === 'true' || templateData.status === true
            });
          }
        } catch (error) {
          console.error(error);
          toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải biểu mẫu' });
        } finally {
          setFetching(false);
        }
      };
      fetchTemplate();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        ...template,
        status: template.status ? 'active' : 'inactive'
      };

      if (id) {
        await formService.updateForm(id, payload);
      } else {
        await formService.createForm(payload);
      }

      toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu biểu mẫu' });
      setTimeout(() => {
        navigate('/admin/templates');
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi khi lưu biểu mẫu' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const addGroup = () => {
    setTemplate((prev) => ({
      ...prev,
      data: [...prev.data, { name: "", status: true, Roman: "roman", option: [] }]
    }));
  };

  const updateGroup = (index: number, field: keyof GroupNode, val: any) => {
    const newData = [...template.data];
    newData[index] = { ...newData[index], [field]: val };
    setTemplate({ ...template, data: newData });
  };

  const removeGroup = (index: number) => {
    const newData = [...template.data];
    newData.splice(index, 1);
    setTemplate({ ...template, data: newData });
  };

  const addOption = (groupIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    newOptions.push({
      content: "",
      method: "",
      productOut: "",
      progress: { type: "tiendo", value: 0 },
      rating: { type: "danhgia", value: 0 },
      ratingVote: { type: "hailong", value: 0 },
      note: "",
      answerType: "score1_5",
      answerOptions: [],
      status: true
    });
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const updateOption = (groupIndex: number, optionIndex: number, field: keyof OptionNode, val: any) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: val };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    newOptions.splice(optionIndex, 1);
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const addAnswerOption = (groupIndex: number, optionIndex: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = newOptions[optionIndex].answerOptions || [];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      answerOptions: [...currentAnsOpts, { key: currentAnsOpts.length + 1, value: "" }]
    };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const updateAnswerOption = (groupIndex: number, optionIndex: number, ansIdx: number, val: string) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = [...(newOptions[optionIndex].answerOptions || [])];
    currentAnsOpts[ansIdx] = { ...currentAnsOpts[ansIdx], value: val, key: val };
    newOptions[optionIndex] = { ...newOptions[optionIndex], answerOptions: currentAnsOpts };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const removeAnswerOption = (groupIndex: number, optionIndex: number, ansIdx: number) => {
    const newData = [...template.data];
    const newGroups = [...newData];
    const newOptions = [...newGroups[groupIndex].option];
    const currentAnsOpts = [...(newOptions[optionIndex].answerOptions || [])];
    currentAnsOpts.splice(ansIdx, 1);
    newOptions[optionIndex] = { ...newOptions[optionIndex], answerOptions: currentAnsOpts };
    newGroups[groupIndex] = { ...newGroups[groupIndex], option: newOptions };
    setTemplate({ ...template, data: newGroups });
  };

  const romanize = (num: number) => {
    if (isNaN(num)) return "NaN";
    const digits = String(+num).split(""),
      key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
        "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
        "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
    let roman = "", i = 3;
    while (i--) roman = (key[+digits.pop()! + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
  };

  const getGroupIndexString = (index: number, romanType: "number" | "roman" = "roman") => {
    if (romanType === "number") {
      return String.fromCharCode(65 + index);
    }
    return romanize(index + 1);
  };

  const getOptionIndexString = (groupIndex: number, optIndex: number, romanType: "number" | "roman" = "roman", globalIndex: number = optIndex + 1) => {
    if (romanType === "number") {
      return `${String.fromCharCode(65 + groupIndex)}${optIndex + 1}`;
    }
    return `${globalIndex}`;
  };

  const templateTypeOptions = [
    { label: 'Phụ lục', value: 'phuluc' },
    { label: 'Biểu mẫu', value: 'bieumau' }
  ];

  const addInfoField = () => {
    setTemplate((prev) => ({
      ...prev,
      info: [...(prev.info || []), { title: "", value: "", type: "text", status: true, option: [] }]
    }));
  };

  const updateInfoField = (index: number, field: keyof InfoNode, val: any) => {
    const newInfo = [...(template.info || [])];
    newInfo[index] = { ...newInfo[index], [field]: val };
    if (field === 'title') {
      newInfo[index].value = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, '_').toLowerCase();
    }
    setTemplate({ ...template, info: newInfo });
  };

  const removeInfoField = (index: number) => {
    const newInfo = [...(template.info || [])];
    newInfo.splice(index, 1);
    setTemplate({ ...template, info: newInfo });
  };

  const addInfoOption = (infoIndex: number) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...(newInfo[infoIndex].option || [])];
    newOptions.push({ key: newOptions.length + 1, value: "" });
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  const updateInfoOption = (infoIndex: number, optIndex: number, val: string) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...newInfo[infoIndex].option];
    newOptions[optIndex] = { ...newOptions[optIndex], value: val, key: val };
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  const removeInfoOption = (infoIndex: number, optIndex: number) => {
    const newInfo = [...(template.info || [])];
    const newOptions = [...newInfo[infoIndex].option];
    newOptions.splice(optIndex, 1);
    newInfo[infoIndex] = { ...newInfo[infoIndex], option: newOptions };
    setTemplate({ ...template, info: newInfo });
  };

  let currentAccumulated = 0;
  const groupStartIndices = template.data.map((group) => {
    const start = currentAccumulated;
    currentAccumulated += group.option.length;
    return start;
  });

  if (fetching) {
    return (
      <AdminLayout title="Tạo mới / Chỉnh sửa biểu mẫu">
        <div className="flex justify-center items-center h-[50vh]">
          <i className="pi pi-spin pi-spinner text-primary-600 text-4xl"></i>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={id ? "Chỉnh sửa biểu mẫu" : "Tạo mới biểu mẫu"}>
      <Toast ref={toast} />
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-sm flex flex-col">

        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div>
              <h3 className="text-primary-900 font-bold text-base">Trạng thái biểu mẫu</h3>
              <p className="text-slate-500 text-xs mt-1">Kích hoạt hoặc vô hiệu hóa biểu mẫu này trên hệ thống</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={template.status ? 'text-green-600 font-bold text-sm' : 'text-slate-400 text-sm font-medium'}>
                {template.status ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
              <InputSwitch checked={template.status} onChange={(e) => setTemplate({ ...template, status: e.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-2">Loại biểu mẫu</label>
              <Dropdown
                value={template.type || 'phuluc'}
                options={templateTypeOptions}
                onChange={(e) => setTemplate({ ...template, type: e.value })}
                className="w-full border-slate-300 focus:border-primary-500 shadow-sm text-base"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-2">Tiêu đề biểu mẫu</label>
              <InputText
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base"
                placeholder="Nhập tiêu đề bảng biểu..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-2">Mô tả (Mục đích, năm, đối tượng...)</label>
              <InputTextarea
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                rows={3}
                className="w-full border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base"
                placeholder="Nhập phụ chú ngắn gọn..."
              />
            </div>
          </div>
        </div>

        {/* INFO BUILDER (Only for bieumau) */}
        {/* {template.type === 'bieumau' && ( */}
        <div className="p-6 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-primary-900 font-bold text-base">Cấu trúc thông tin chung (Info)</h3>
              <p className="text-slate-500 text-xs mt-1">Quản lý các trường thông tin chung của người điền biểu mẫu</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(template.info || []).map((field, idx) => (
              <div key={idx} className="border border-slate-200 p-4 rounded-xl relative bg-slate-50">
                <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeInfoField(idx)} className="absolute top-2 right-2 w-8 h-8 p-0" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mr-8 mt-4">
                  <div className="md:col-span-5">
                    <label className="block text-slate-700 font-bold mb-2 text-sm">Tiêu đề thông tin</label>
                    <InputText value={field.title} onChange={(e) => updateInfoField(idx, 'title', e.target.value)} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm p-3 text-base" placeholder="VD: Tên bệnh viện, Họ và tên..." />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-slate-700 font-bold mb-2 text-sm">Loại dữ liệu</label>
                    <Dropdown value={field.type} options={[{ label: 'Văn bản (Text)', value: 'text' }, { label: 'Số (Number)', value: 'number' }, { label: 'Ngày tháng (Date)', value: 'date' }, { label: 'Lựa chọn (Select)', value: 'select' }]} onChange={(e) => updateInfoField(idx, 'type', e.value)} className="w-full bg-white border-slate-300 focus:border-primary-500 shadow-sm flex items-center h-[46px]" />
                  </div>
                  <div className="md:col-span-1 flex flex-col items-center">
                    <label className="block text-slate-700 font-bold mb-3 text-sm">Hiển thị</label>
                    <InputSwitch
                      checked={field.status !== false}
                      onChange={(e) => updateInfoField(idx, 'status', e.value)}
                    />
                  </div>
                </div>
                {field.type === 'select' && (
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-700 font-bold text-sm">Các tùy chọn lựa chọn:</span>
                      <Button label="Thêm tùy chọn" icon="pi pi-plus" size="small" text onClick={() => addInfoOption(idx)} className="text-primary-600 hover:bg-primary-50 py-2 px-3" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {field.option?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm hover:border-primary-400 transition-colors">
                          <InputText value={opt.value} onChange={(e) => updateInfoOption(idx, optIdx, e.target.value)} className="w-40 border-none p-2 text-sm focus:ring-0" placeholder="Nhập tên tùy chọn..." />
                          <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeInfoOption(idx, optIdx)} className="w-10 h-10 p-0 flex-shrink-0 hover:bg-red-50 text-red-500 rounded-none border-l border-slate-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button label="Thêm thông tin" icon="pi pi-plus" size="small" onClick={addInfoField} outlined className="bg-white border-primary-300 text-primary-600 hover:bg-primary-50 px-6 py-2 rounded-lg font-bold shadow-sm" />
          </div>
        </div>
        {/* )} */}

        <div className="flex-grow p-6 bg-white flex flex-col">
          <div className="rounded-xl border border-primary-200 overflow-x-auto shadow-sm relative">
            {template.type === 'phuluc' ? (
              <table className="w-full border-collapse min-w-max text-slate-700">
                <thead className="bg-[var(--primary-color,#003159)] text-white">
                  <tr>
                    <th rowSpan={2} className="border border-primary-900 p-3 w-12 text-center align-middle font-semibold bg-primary-800">STT</th>
                    <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Nội dung thực hiện</th>
                    <th rowSpan={2} className="border border-primary-900 p-3 min-w-[200px] text-center align-middle font-semibold bg-primary-800">Phương thức thực hiện</th>
                    <th rowSpan={2} className="border border-primary-900 p-3 min-w-[150px] text-center align-middle font-semibold bg-primary-800">Sản phẩm đầu ra</th>
                    <th colSpan={3} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Tiến độ thực hiện</th>
                    <th colSpan={2} className="border border-primary-900 p-2 text-center align-middle font-semibold bg-primary-800">Đánh giá</th>
                    <th rowSpan={2} className="border border-primary-900 p-3 w-24 text-center align-middle font-semibold bg-primary-800">Ghi chú/<br />Kiến nghị</th>
                    {/* <th rowSpan={2} className="border border-primary-900 p-3 w-40 text-center align-middle font-semibold bg-primary-800">Loại đánh số nhóm</th> */}
                    <th rowSpan={2} className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Trạng thái</th>
                    <th rowSpan={2} className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">Xóa</th>
                  </tr>
                  <tr>
                    <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đã thực hiện</th>
                    <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Đang thực hiện</th>
                    <th className="border border-primary-900 p-2 w-24 text-center align-middle font-medium text-xs bg-primary-800">Chưa thực hiện</th>
                    <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Đạt</th>
                    <th className="border border-primary-900 p-2 w-20 text-center align-middle font-medium text-xs bg-primary-800">Không đạt</th>
                  </tr>
                </thead>
                <tbody>
                  {template.data.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      <tr className="bg-primary-50/60 border-b-2 border-primary-200">
                        <td className="border border-primary-200 p-2 text-center font-bold text-primary-900 text-base">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              icon={expandedGroups[groupIndex] === false ? "pi pi-chevron-right" : "pi pi-chevron-down"}
                              rounded text
                              className="w-6 h-6 p-0 text-primary-700 hover:bg-primary-100 flex-shrink-0"
                              onClick={() => toggleGroup(groupIndex)}
                            />
                            <span>{getGroupIndexString(groupIndex, group.Roman)}</span>
                          </div>
                        </td>
                        <td colSpan={8} className="border border-primary-200 p-2 font-bold bg-primary-50/60">
                          <InputText
                            value={group.name}
                            onChange={(e) => updateGroup(groupIndex, 'name', e.target.value)}
                            className="w-full font-bold bg-transparent border-none shadow-none text-primary-900 placeholder:font-normal p-1 focus:ring-0 focus:bg-white rounded transition-colors"
                            placeholder="Nhập tên nhóm nội dung"
                          />
                        </td>
                        <td className="border border-primary-200 bg-primary-50/60"></td>
                        {/* <td className="border border-primary-200 p-2 text-center align-middle bg-primary-50/60">
                          <Dropdown
                            value={group.Roman || 'roman'}
                            options={[{ label: 'Số La Mã (I, II)', value: 'roman' }, { label: 'Chữ cái (A, B)', value: 'number' }]}
                            onChange={(e) => updateGroup(groupIndex, 'Roman', e.value)}
                            className="w-full text-sm min-w-[120px]"
                          />
                        </td> */}
                        <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                          <div className="flex justify-center items-center h-full">
                            <InputSwitch
                              checked={group.status !== false} // Default to true if undefined
                              onChange={(e) => updateGroup(groupIndex, 'status', e.value)}
                            />
                          </div>
                        </td>
                        <td className="border border-primary-200 p-2 text-center bg-primary-50/60">
                          <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeGroup(groupIndex)} className="w-8 h-8 flex-shrink-0 bg-white hover:bg-red-50 hover:text-red-600 shadow-sm" />
                        </td>
                      </tr>

                      {expandedGroups[groupIndex] !== false && group.option.map((opt, optIndex) => {
                        const globalIdx = groupStartIndices[groupIndex] + optIndex + 1;
                        const currentGlobalIndex = getOptionIndexString(groupIndex, optIndex, group.Roman, globalIdx);
                        return (
                          <tr key={optIndex} className="hover:bg-slate-50 transition-colors">
                            <td className="border border-slate-200 p-2 text-center text-slate-600 font-medium">{currentGlobalIndex}</td>
                            <td className="border border-slate-200 p-1 bg-white">
                              <InputTextarea
                                value={opt.content}
                                onChange={(e) => updateOption(groupIndex, optIndex, 'content', e.target.value)}
                                className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                                autoResize
                                placeholder="Nhập nội dung"
                              />
                            </td>
                            <td className="border border-slate-200 p-1 bg-white">
                              <InputTextarea
                                value={opt.method}
                                onChange={(e) => updateOption(groupIndex, optIndex, 'method', e.target.value)}
                                className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                                autoResize
                                placeholder="Phương thức thực hiện"
                              />
                            </td>
                            <td className="border border-slate-200 p-1 bg-white">
                              <InputTextarea
                                value={opt.productOut}
                                onChange={(e) => updateOption(groupIndex, optIndex, 'productOut', e.target.value)}
                                className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none"
                                autoResize
                                placeholder="Sản phẩm đầu ra"
                              />
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                              <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                              <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/50">
                              <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-primary-600" />
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                              <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-green-600" />
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-slate-50/30">
                              <input type="checkbox" disabled className="w-4 h-4 pointer-events-none opacity-40 accent-red-600" />
                            </td>
                            <td className="border border-slate-200 p-1 bg-white">
                              <InputTextarea className="w-full min-h-[3rem] border-transparent text-slate-400 p-2 bg-transparent resize-none" disabled placeholder="Ghi chú" />
                            </td>
                            {/* <td className="border border-slate-200 p-2 bg-slate-50/30"></td> */}
                            <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                              <div className="flex justify-center items-center h-full pt-1">
                                <InputSwitch
                                  checked={opt.status}
                                  onChange={(e) => updateOption(groupIndex, optIndex, 'status', e.value)}
                                />
                              </div>
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                              <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeOption(groupIndex, optIndex)} className="w-8 h-8 p-0 hover:bg-red-50" />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Add Row Button inside Group */}
                      {expandedGroups[groupIndex] !== false && (
                        <tr className="bg-white">
                          <td className="border border-slate-200 p-2"></td>
                          <td colSpan={11} className="border border-slate-200 p-3 bg-slate-50/30">
                            <Button
                              label="Thêm dòng nội dung mới"
                              icon="pi pi-plus"
                              size="small"
                              onClick={() => addOption(groupIndex)}
                              className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-400 font-medium shadow-sm w-fit transition-all"
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse min-w-max text-slate-700">
                <thead className="bg-[var(--primary-color,#003159)] text-white">
                  <tr>
                    <th className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">STT</th>
                    <th className="border border-primary-900 p-3 text-center align-middle font-semibold bg-primary-800">Nội dung câu hỏi / đánh giá</th>
                    <th className="border border-primary-900 p-3 w-72 text-center align-middle font-semibold bg-primary-800">Loại trả lời & Cấu hình</th>
                    {/* <th className="border border-primary-900 p-3 w-40 text-center align-middle font-semibold bg-primary-800">Loại đánh số nhóm</th> */}
                    <th className="border border-primary-900 p-3 w-28 text-center align-middle font-semibold bg-primary-800">Trạng thái</th>
                    <th className="border border-primary-900 p-3 w-16 text-center align-middle font-semibold bg-primary-800">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {template.data.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      <tr className="bg-primary-50/60 border-b-2 border-primary-200">
                        <td className="border border-primary-200 p-2 text-center font-bold text-primary-900 text-base">
                          <div className="flex items-center justify-center gap-1">
                            <Button icon={expandedGroups[groupIndex] === false ? "pi pi-chevron-right" : "pi pi-chevron-down"} rounded text className="w-6 h-6 p-0 text-primary-700 hover:bg-primary-100 flex-shrink-0" onClick={() => toggleGroup(groupIndex)} />
                            <span>{getGroupIndexString(groupIndex, group.Roman)}</span>
                          </div>
                        </td>
                        <td colSpan={2} className="border border-primary-200 p-2 font-bold bg-primary-50/60">
                          <InputText value={group.name} onChange={(e) => updateGroup(groupIndex, 'name', e.target.value)} className="w-full font-bold bg-transparent border-none shadow-none text-primary-900 placeholder:font-normal p-1 focus:ring-0 focus:bg-white rounded transition-colors" placeholder="Nhập tên nhóm nội dung (ràng buộc tiêu đề I, II, III)..." />
                        </td>
                        {/* <td className="border border-primary-200 p-2 text-center align-middle bg-primary-50/60">
                          <Dropdown value={group.Roman || 'roman'} options={[{ label: 'Số La Mã (I, II)', value: 'roman' }, { label: 'Chữ cái (A, B)', value: 'number' }]} onChange={(e) => updateGroup(groupIndex, 'Roman', e.value)} className="w-full text-sm" />
                        </td> */}
                        <td className="border border-primary-200 text-center align-middle bg-primary-50/60 p-2">
                          <div className="flex justify-center items-center h-full">
                            <InputSwitch checked={group.status !== false} onChange={(e) => updateGroup(groupIndex, 'status', e.value)} />
                          </div>
                        </td>
                        <td className="border border-primary-200 p-2 text-center bg-primary-50/60">
                          <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeGroup(groupIndex)} className="w-8 h-8 flex-shrink-0 bg-white hover:bg-red-50 hover:text-red-600 shadow-sm" />
                        </td>
                      </tr>
                      {expandedGroups[groupIndex] !== false && group.option.map((opt, optIndex) => {
                        const globalIdx = groupStartIndices[groupIndex] + optIndex + 1;
                        const currentGlobalIndex = getOptionIndexString(groupIndex, optIndex, group.Roman, globalIdx);
                        return (
                          <tr key={optIndex} className="hover:bg-slate-50 transition-colors">
                            <td className="border border-slate-200 p-2 text-center text-slate-600 font-medium whitespace-nowrap">{currentGlobalIndex}</td>
                            <td className="border border-slate-200 p-1 bg-white">
                              <InputTextarea value={opt.content} onChange={(e) => updateOption(groupIndex, optIndex, 'content', e.target.value)} className="w-full min-h-[3rem] border-transparent hover:border-slate-300 focus:border-primary-500 p-2 focus:shadow-none bg-transparent resize-none" autoResize placeholder="Nhập nội dung câu hỏi..." />
                            </td>
                            <td className="border border-slate-200 p-2 bg-white align-top">
                              <Dropdown value={opt.answerType || 'score1_5'} options={[{ label: 'Điểm 1-5 (có 0)', value: 'score1_5' }, { label: 'Chọn 1 đáp án', value: 'single_choice' }, { label: 'Điền phần trăm (%)', value: 'percentage' }, { label: 'Văn bản tự do', value: 'text' }]} onChange={(e) => updateOption(groupIndex, optIndex, 'answerType', e.value)} className="w-full text-sm font-medium" />
                              {opt.answerType === 'single_choice' && (
                                <div className="mt-2 bg-slate-50 p-2 border border-slate-200 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-600">Các đáp án:</span>
                                    <Button icon="pi pi-plus" size="small" rounded text onClick={() => addAnswerOption(groupIndex, optIndex)} className="w-6 h-6 p-0 text-primary-600" />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {(opt.answerOptions || []).map((ans, ansIdx) => (
                                      <div key={ansIdx} className="flex items-center gap-1">
                                        <InputText value={ans.value} onChange={(e) => updateAnswerOption(groupIndex, optIndex, ansIdx, e.target.value)} className="w-full p-1 text-xs border-slate-300" placeholder="Nội dung đáp án" />
                                        <Button icon="pi pi-times" rounded text severity="danger" onClick={() => removeAnswerOption(groupIndex, optIndex, ansIdx)} className="w-6 h-6 p-0 flex-shrink-0 hover:bg-red-100" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                            {/* <td className="border border-slate-200 p-2 bg-slate-50/30"></td> */}
                            <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                              <div className="flex justify-center items-center h-full pt-1">
                                <InputSwitch checked={opt.status} onChange={(e) => updateOption(groupIndex, optIndex, 'status', e.value)} />
                              </div>
                            </td>
                            <td className="border border-slate-200 p-2 text-center align-middle bg-white">
                              <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeOption(groupIndex, optIndex)} className="w-8 h-8 p-0 hover:bg-red-50" />
                            </td>
                          </tr>
                        );
                      })}
                      {expandedGroups[groupIndex] !== false && (
                        <tr className="bg-white">
                          <td className="border border-slate-200 p-2"></td>
                          <td colSpan={4} className="border border-slate-200 p-3 bg-slate-50/30">
                            <Button label="Thêm câu hỏi mới" icon="pi pi-plus" size="small" onClick={() => addOption(groupIndex)} className="bg-white text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-400 font-medium shadow-sm w-fit transition-all" />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 mb-2 flex justify-center flex-shrink-0">
            <Button
              label="Thêm nhóm nội dung"
              icon="pi pi-plus"
              onClick={addGroup}
              className="bg-primary-50 text-primary-700 border-dashed border-2 border-primary-300 hover:bg-primary-100 hover:border-primary-500 font-bold px-8 py-3 rounded-xl shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <Button
            label="Hủy bỏ & Quay lại"
            icon="pi pi-arrow-left"
            onClick={handleCancel}
            className="p-button-text text-slate-600 hover:bg-slate-200 font-semibold"
          />
          <div className="flex items-center gap-3">
            <Button
              label="Lưu biểu mẫu"
              icon="pi pi-save"
              loading={loading}
              onClick={handleSave}
              className="text-white bg-primary-600 border-primary-600 hover:bg-primary-700 font-bold px-8 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TemplateCreate;
