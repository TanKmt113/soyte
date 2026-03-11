import { api } from "@/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";
import React, { useState } from "react";

export default function BieuMau1Table({ id,type,formData }) {

  const [tableData, setTableData] = useState(formData.data);
  const [formInfo, setFormInfo] = useState({
    title: formData.name,
    description: formData.description
  });
  const toRoman = (num) => {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX"];
  return roman[num] || num;
};
const [visible, setVisible] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const updateProgress = (sectionIndex, optionIndex, value) => {
    const newData = [...tableData];
    newData[sectionIndex].option[optionIndex].progress.value = value;
    setTableData(newData);
  };

  const updateRating = (sectionIndex, optionIndex, value) => {
    const newData = [...tableData];
    newData[sectionIndex].option[optionIndex].rating.value = value;
    setTableData(newData);
  };

  const updateNote = (sectionIndex, optionIndex, value) => {
    const newData = [...tableData];
    newData[sectionIndex].option[optionIndex].note = value;
    setTableData(newData);
  };
  const handleSubmit = () => {
    setVisible(true);
  };
  const submitForm = async () => {
    try {
      const datamap = convertSubmissionData(tableData);

      const payload = {
        form_id: Number(id),
        creator_name: creatorName || "Người gửi ẩn danh",
        type: type,
        submission_data: datamap,
        status: "pending",
      };

      const res = await api.post("/feedbacks", payload);

      console.log("Submit success:", res.data);

      setVisible(false);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };
  const convertSubmissionData = (data:any) => {
    return data.map((section) => ({
      name: section.name,
      option: section.option.map((item) => ({
        tiendo: item.progress?.value ?? 0,
        danhgia: item.rating?.value ?? 0,
        ghichu: item.note || "",
      })),
    }));
  };
   return (
     <div className="mx-auto mt-4 w-full px-3 sm:px-4 sm:mt-6 xl:w-[88%] 2xl:w-[92%]">
       {/* TITLE */}
       <div className="mb-6 rounded-[28px] border border-white/60 bg-white/70 p-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
         <h3 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
           {formInfo.title}
         </h3>
         <p className="mt-2 text-sm text-slate-500 sm:text-base">
           {formInfo.description}
         </p>
       </div>

       {/* TABLE / LIST */}
       <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
         {tableData.map((section, sIndex) => (
           <div
             key={sIndex}
             className="border-b border-slate-200/70 last:border-b-0"
           >
             {/* SECTION HEADER */}
             <button
               type="button"
               onClick={() => toggleSection(sIndex)}
               className="flex w-full items-center gap-3 bg-primary-800 px-4 py-4 text-left text-white transition-all duration-200 hover:brightness-110"
             >
               <i
                 className={`pi ${
                   openSections[sIndex] ? "pi-chevron-down" : "pi-chevron-right"
                 } text-xs`}
               />
               <span className="min-w-[30px] font-semibold">
                 {toRoman(sIndex)}
               </span>
               <span className="text-sm font-semibold sm:text-base">
                 {section.name}
               </span>
             </button>

             {/* QUESTIONS */}
             {!openSections[sIndex] && (
               <div className="space-y-4 p-3 sm:p-4">
                 {section.option.map((item, oIndex) => (
                   <div
                     key={oIndex}
                     className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-sm"
                   >
                     {/* Top */}
                     <div className="border-b border-slate-200/70 px-4 py-4">
                       <div className="mb-3 flex items-center gap-3">
                         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600">
                           {oIndex + 1}
                         </div>
                         <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Nội dung thực hiện
                         </div>
                       </div>

                       <div className="text-[15px] leading-7 text-slate-700">
                         {item.content}
                       </div>
                     </div>

                     {/* Body */}
                     <div className="grid grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-3">
                       <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
                         <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Phương thức thực hiện
                         </div>
                         <div className="text-sm leading-6 text-slate-700">
                           {item.method}
                         </div>
                       </div>

                       <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
                         <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Sản phẩm đầu ra
                         </div>
                         <div className="text-sm leading-6 text-slate-700">
                           {item.productOut}
                         </div>
                       </div>

                       <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
                         <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Ghi chú / Kiến nghị
                         </div>
                         <InputTextarea
                           value={item.note || ""}
                           onChange={(e) =>
                             updateNote(sIndex, oIndex, e.target.value)
                           }
                           rows={3}
                           autoResize
                           className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                           placeholder="Nhập ghi chú hoặc kiến nghị"
                         />
                       </div>
                     </div>

                     {/* Progress + Rating */}
                     <div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 px-4 py-4 xl:grid-cols-2">
                       {/* Progress */}
                       <div>
                         <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Tiến độ thực hiện
                         </div>

                         <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                           {[
                             { label: "Đã thực hiện", value: 1 },
                             { label: "Đang thực hiện", value: 2 },
                             { label: "Chưa thực hiện", value: 3 },
                           ].map((progress) => {
                             const active =
                               item.progress.value === progress.value;

                             return (
                               <label
                                 key={progress.value}
                                 htmlFor={`progress-${sIndex}-${oIndex}-${progress.value}`}
                                 className={`inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition-all duration-200 ${
                                   active
                                     ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200"
                                     : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                 }`}
                               >
                                 <RadioButton
                                   inputId={`progress-${sIndex}-${oIndex}-${progress.value}`}
                                   name={`progress-${sIndex}-${oIndex}`}
                                   value={progress.value}
                                   checked={active}
                                   onChange={() =>
                                     updateProgress(
                                       sIndex,
                                       oIndex,
                                       progress.value,
                                     )
                                   }
                                   className={`shrink-0
                                  [&_.p-radiobutton-box]:h-5
                                  [&_.p-radiobutton-box]:w-5
                                  [&_.p-radiobutton-box]:border-2
                                  [&_.p-radiobutton-box]:shadow-none
                                  ${
                                    active
                                      ? "[&_.p-radiobutton-box]:border-white/90 [&_.p-radiobutton-box]:bg-transparent"
                                      : "[&_.p-radiobutton-box]:border-slate-400 [&_.p-radiobutton-box]:bg-white"
                                  }
                                  [&_.p-radiobutton-icon]:scale-75
                                  [&_.p-radiobutton-icon]:bg-white`}
                                 />
                                 <span>{progress.label}</span>
                               </label>
                             );
                           })}
                         </div>
                       </div>

                       {/* Rating */}
                       <div>
                         <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                           Đánh giá
                         </div>

                         <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                           {[
                             { label: "Đạt", value: 1 },
                             { label: "Không đạt", value: 2 },
                           ].map((rating) => {
                             const active = item.rating.value === rating.value;

                             return (
                               <label
                                 key={rating.value}
                                 htmlFor={`rating-${sIndex}-${oIndex}-${rating.value}`}
                                 className={`inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-sm font-medium transition-all duration-200 ${
                                   active
                                     ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                     : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                 }`}
                               >
                                 <RadioButton
                                   inputId={`rating-${sIndex}-${oIndex}-${rating.value}`}
                                   name={`rating-${sIndex}-${oIndex}`}
                                   value={rating.value}
                                   checked={active}
                                   onChange={() =>
                                     updateRating(sIndex, oIndex, rating.value)
                                   }
                                   className={`shrink-0
                                  [&_.p-radiobutton-box]:h-5
                                  [&_.p-radiobutton-box]:w-5
                                  [&_.p-radiobutton-box]:border-2
                                  [&_.p-radiobutton-box]:shadow-none
                                  ${
                                    active
                                      ? "[&_.p-radiobutton-box]:border-white/90 [&_.p-radiobutton-box]:bg-transparent"
                                      : "[&_.p-radiobutton-box]:border-slate-400 [&_.p-radiobutton-box]:bg-white"
                                  }
                                  [&_.p-radiobutton-icon]:scale-75
                                  [&_.p-radiobutton-icon]:bg-white`}
                                 />
                                 <span>{rating.label}</span>
                               </label>
                             );
                           })}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         ))}
       </div>

       {/* SUBMIT */}
       <div className="mb-4 mt-6 flex justify-end">
         <Button
           label="Gửi biểu mẫu"
           icon="pi pi-send"
           onClick={handleSubmit}
           className="
          rounded-2xl border-0 bg-gradient-to-r from-emerald-400 to-green-500
          px-5 py-3 text-sm font-semibold text-white
          shadow-lg shadow-emerald-200 transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-xl
          active:translate-y-0 sm:text-base
        "
         />
       </div>

       {/* DIALOG */}
       <Dialog
         header="Thông tin người gửi"
         visible={visible}
         style={{ width: "520px", maxWidth: "95vw" }}
         onHide={() => setVisible(false)}
         pt={{
           root: {
             className:
               "overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl",
           },
           header: {
             className:
               "border-b border-slate-200 bg-white/80 px-6 py-4 text-slate-800",
           },
           content: {
             className: "bg-white/80 px-6 py-5",
           },
         }}
       >
         <div className="flex flex-col gap-4">
           <div className="flex flex-col gap-2">
             <label className="text-sm font-semibold text-slate-700">
               Họ và tên
             </label>
             <span className="relative w-full">
               <i className="pi pi-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <InputText
                 value={creatorName}
                 onChange={(e) => setCreatorName(e.target.value)}
                 placeholder="Nhập họ và tên"
                 className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
               />
             </span>
           </div>

           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
             <div className="flex flex-col gap-2">
               <label className="text-sm font-semibold text-slate-700">
                 Tuổi
               </label>
               <span className="relative w-full">
                 <i className="pi pi-id-card absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <InputText
                   placeholder="Nhập tuổi"
                   className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                 />
               </span>
             </div>

             <div className="flex flex-col gap-2">
               <label className="text-sm font-semibold text-slate-700">
                 Ngày sinh
               </label>
               <span className="relative w-full">
                 <i className="pi pi-calendar absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <InputText
                   type="date"
                   className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                 />
               </span>
             </div>
           </div>

           <div className="flex flex-col gap-2">
             <label className="text-sm font-semibold text-slate-700">
               Email
             </label>
             <span className="relative w-full">
               <i className="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <InputText
                 type="email"
                 placeholder="example@email.com"
                 className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
               />
             </span>
           </div>

           <div className="mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4">
             <Button
               label="Hủy"
               icon="pi pi-times"
               severity="secondary"
               outlined
               onClick={() => setVisible(false)}
               className="rounded-2xl px-4 py-2"
             />

             <Button
               label="Gửi đánh giá"
               icon="pi pi-send"
               className="rounded-2xl border-0 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white"
               onClick={submitForm}
             />
           </div>
         </div>
       </Dialog>
     </div>
   );
}