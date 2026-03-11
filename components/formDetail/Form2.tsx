import React, { useState } from "react";
import SurveyInfo from "./SurveyInfo";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { api } from "@/api";

export default function SurveyForm({ id,type,formJson }) {
  
  const { info, data, name, description } = formJson;
const toRoman = (num) => {
  const roman = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
  ];
  return roman[num] || num;
};
  const [tableData, setTableData] = useState(data);
  const [openSections, setOpenSections] = useState({});
  const [checkRating,setcheckRating] = useState(false);
  const [errors, setErrors] = useState({});
  const [infoErrors, setInfoErrors] = useState({});
  const validateInfo = () => {
    const newErrors = {};

    info.forEach((data, index) => {
      if (!data.status) return;

      const value = data.value;

      const isEmpty = value === undefined || value === null || value === "";

      if (isEmpty) {
        const key = data.value;
        newErrors[key] = true;
      }
    });

    setInfoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
 
  const convertSubmissionData = (data) => {
    return data.map((section) => ({
      name: section.name,
      option: section.option.map((item) => ({
        tiendo: item.progress?.value ?? 0,
        danhgia: item.rating?.value ?? 0,
        hailong: item.ratingVote?.value ?? 0,
        ghichu: item.note || "",
      })),
    }));
  };
  const handleSubmit = async () => {
    const newErrors = {};

    tableData.forEach((section, sIndex) => {
      section.option.forEach((item, oIndex) => {
        const key = `${sIndex}-${oIndex}`;

        let isEmpty = false;

        switch (item.answerType) {
          case "score1_5":
            isEmpty = !item.ratingVote?.value && item.ratingVote?.value !== 0;
            break;

          case "single_choice":
          case "percentage":
          case "text":
            isEmpty = !item.answerValue;
            break;

          default:
            break;
        }

        if (isEmpty) {
          newErrors[key] = true;
        }
      });
    });

    // const infoOk = validateInfo();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const datamap = convertSubmissionData(tableData);
    const payload = {
      form_id: Number(id),
      info: info,
      type: type,
      submission_data: datamap,
      status: "pending",
    }; 
    const res = await api.post("/feedbacks", payload); 
  };
  const updateAnswerValue = (sIndex, oIndex, value) => {
    setTableData((prev) =>
      prev.map((section, si) => {
        if (si !== sIndex) return section;

        return {
          ...section,
          option: section.option.map((item, oi) => {
            if (oi !== oIndex) return item;

            return {
              ...item,
              answerValue: value,
            };
          }),
        };
      }),
    );
  };

  const updateRatingVote = (sIndex, oIndex, score) => {
    setTableData((prev) =>
      prev.map((section, si) => {
        if (si !== sIndex) return section;

        return {
          ...section,
          option: section.option.map((item, oi) => {
            if (oi !== oIndex) return item;

            return {
              ...item,
              ratingVote: {
                ...item.ratingVote,
                value: score,
              },
              answerValue: score,
            };
          }),
        };
      }),
    );
  };
  const renderAnswerField = (item, sIndex, oIndex) => {
    const iosInputClass =
      "w-full min-h-[46px] rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md px-4 py-2 text-[15px] text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

    switch (item.answerType) {
      case "score1_5":
        return (
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 0].map((score) => {
                const active = item.ratingVote?.value === score;

                return (
                  <label
                    key={score}
                    htmlFor={`vote-${sIndex}-${oIndex}-${score}`}
                    className={`
                inline-flex h-10 min-w-[56px] sm:min-w-[60px]
                items-center justify-center gap-2
                rounded-full border px-3 sm:px-4
                text-sm font-medium cursor-pointer select-none
                transition-all duration-200
                ${
                  active
                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }
              `}
                  >
                    <RadioButton
                      inputId={`vote-${sIndex}-${oIndex}-${score}`}
                      name={`vote-${sIndex}-${oIndex}`}
                      value={score}
                      checked={active}
                      onChange={() => updateRatingVote(sIndex, oIndex, score)}
                      className={`
                  shrink-0
                  [&_.p-radiobutton-box]:w-5
                  [&_.p-radiobutton-box]:h-5
                  [&_.p-radiobutton-box]:border-2
                  [&_.p-radiobutton-box]:shadow-none
                  ${
                    active
                      ? "[&_.p-radiobutton-box]:border-white/90 [&_.p-radiobutton-box]:bg-transparent"
                      : "[&_.p-radiobutton-box]:border-slate-400 [&_.p-radiobutton-box]:bg-white"
                  }
                  [&_.p-radiobutton-icon]:scale-75
                  [&_.p-radiobutton-icon]:bg-white
                `}
                    />
                    <span className="leading-none">{score}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case "single_choice":
        return (
          <Dropdown
            value={item.answerValue || null}
            onChange={(e) => updateAnswerValue(sIndex, oIndex, e.value)}
            options={item.answerOptions || []}
            optionLabel="value"
            optionValue="value"
            placeholder="-- Chọn đáp án --"
            className="w-full"
            pt={{
              root: {
                className:
                  "w-full min-h-[46px] rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-200 hover:shadow-md focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100",
              },
              input: {
                className:
                  "px-4 py-2 text-[15px] text-slate-700 font-medium placeholder:text-slate-400",
              },
              trigger: {
                className: "w-12 text-slate-400",
              },
              panel: {
                className:
                  "mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl",
              },
              wrapper: {
                className: "p-2",
              },
              item: ({ context }) => ({
                className: `
                mx-1 my-1 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-150
                ${
                  context.selected
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }
              `,
              }),
            }}
          />
        );

      case "percentage":
        return (
          <div className="relative w-full">
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Nhập %"
              className={`${iosInputClass} pr-10`}
              value={item.answerValue || ""}
              onChange={(e) =>
                updateAnswerValue(sIndex, oIndex, e.target.value)
              }
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              %
            </span>
          </div>
        );

      case "text":
        return (
          <input
            type="text"
            placeholder="Nhập nội dung"
            className={iosInputClass}
            value={item.answerValue || ""}
            onChange={(e) => updateAnswerValue(sIndex, oIndex, e.target.value)}
          />
        );

      default:
        return (
          <span className="text-sm text-slate-400">Không có kiểu trả lời</span>
        );
    }
  };
  function QuestionCard({ item, sIndex, oIndex }) {
    const key = `${sIndex}-${oIndex}`;
    return (
      <div
        className={`
    w-full overflow-hidden rounded-2xl border bg-white shadow-sm
    ${errors[key] ? "border-red-500 ring-2 ring-red-200" : "border-slate-200"}
  `}
      >
        {/* QUESTION */}
        <div className="border-b border-slate-200/70 px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600">
              {oIndex + 1}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Câu hỏi
            </div>
          </div>

          <div className="text-[15px] leading-7 text-slate-700">
            {item.content}
          </div>
        </div>

        {/* ANSWER */}
        <div className="px-4 py-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Trả lời
          </div>

          <div className="w-full">
            {renderAnswerField(item, sIndex, oIndex)}
          </div>
        </div>
      </div>
    );
  }
 return (
   <div className="mx-auto mt-4 sm:mt-6 w-[100%] xl:w-[88%] 2xl:w-[92%]">
     {/* TITLE */}
     <div className="mb-6 rounded-[28px] border border-white/60 bg-white/70 p-5 sm:p-7 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
       <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
         {name}
       </h2>
       <span className="mt-2 block text-sm sm:text-base text-slate-500">
         {description}
       </span>
     </div>

     {/* INFO FORM */}
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
       {info
         .filter((data) => data.status)
         .map((data, index) => {
           const errorKey = data.value;
           const hasError = !!infoErrors[errorKey];

           return (
             <div
               key={errorKey}
               className={`rounded-[24px] p-4 shadow-sm backdrop-blur-xl ${
                 hasError
                   ? "border border-red-400 bg-red-50/80 ring-2 ring-red-200"
                   : "border border-white/60 bg-white/70"
               }`}
             >
               <SurveyInfo info={data} />

               {hasError && (
                 <div className="mt-2 text-sm text-red-500">
                   Vui lòng nhập thông tin này
                   {infoErrors[errorKey]}
                 </div>
               )}
             </div>
           );
         })}
     </div>

     {/* GUIDE SCORE */}
     {!checkRating && (
       <div className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white/75 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
           {[
             { score: 1, text1: "Rất không hài lòng", text2: "hoặc: Rất kém" },
             { score: 2, text1: "Không hài lòng", text2: "hoặc: Kém" },
             { score: 3, text1: "Bình thường", text2: "hoặc: Trung bình" },
             { score: 4, text1: "Hài lòng", text2: "hoặc: Tốt" },
             { score: 5, text1: "Rất hài lòng", text2: "hoặc: Rất tốt" },
             { score: 0, text1: "Không sử dụng", text2: "" },
           ].map((item, idx, arr) => (
             <div
               key={item.score}
               className={`p-4 text-center ${
                 idx !== arr.length - 1
                   ? "border-b md:border-b-0 xl:border-r border-slate-200"
                   : ""
               }`}
             >
               <div className="mb-2 flex justify-center">
                 <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm">
                   {item.score}
                 </div>
               </div>
               <div className="text-sm text-slate-500">là:</div>
               <div className="mt-1 text-sm font-semibold text-slate-700">
                 {item.text1}
               </div>
               {item.text2 && (
                 <div className="mt-1 text-xs italic text-slate-400">
                   {item.text2}
                 </div>
               )}
             </div>
           ))}
         </div>
       </div>
     )}

     {/* TABLE */}
     <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
       {tableData.map(
         (section, sIndex) =>
           section.status && (
             <div key={sIndex}>
               {/* SECTION HEADER */}
               <button
                 onClick={() => toggleSection(sIndex)}
                 className="flex w-full items-center gap-3 bg-primary-800 px-4 py-4 text-left text-white transition-all hover:brightness-110"
               >
                 <i
                   className={`pi ${
                     openSections[sIndex]
                       ? "pi-chevron-down"
                       : "pi-chevron-right"
                   } text-xs`}
                 />

                 <span className="min-w-[30px] font-semibold">
                   {toRoman(sIndex)}
                 </span>

                 <span className="text-sm sm:text-base font-semibold">
                   {section.name}
                 </span>
               </button>

               {/* QUESTIONS */}
               {!openSections[sIndex] && (
                 <div className="space-y-4 p-3 sm:p-4">
                   {section.option.map(
                     (item, oIndex) =>
                       item.status && (
                         <QuestionCard
                           key={oIndex}
                           item={item}
                           sIndex={sIndex}
                           oIndex={oIndex}
                         />
                       ),
                   )}
                 </div>
               )}
             </div>
           ),
       )}
     </div>

     {/* SUBMIT */}
     <div className="mt-6 mb-4 flex justify-end">
       <Button
         label="Gửi biểu mẫu"
         icon="pi pi-send"
         onClick={handleSubmit}
         className="
          rounded-2xl border-0 bg-gradient-to-r from-emerald-400 to-green-500
          px-5 py-3 text-sm sm:text-base font-semibold text-white
          shadow-lg shadow-emerald-200 transition-all duration-200
          hover:-translate-y-0.5 hover:shadow-xl
          active:translate-y-0
        "
       />
     </div>
   </div>
 );
}