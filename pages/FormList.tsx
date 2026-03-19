import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronRight, FileText, Home, PhoneCall, ShieldCheck } from "lucide-react";
import { api } from "@/api";
const ALLOWED_TYPES = ["evaluate", "reflect"] as const;
type FormType = (typeof ALLOWED_TYPES)[number];
const FormList: React.FC = () => {
  const [forms, setForms] = useState([]);
   const { type } = useParams<{ type?: string }>();

   const isValidType =
    type === undefined || ALLOWED_TYPES.includes(type as FormType);

  if (!isValidType) {
    //return <Navigate to="/404" replace />;
   return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await api.get("/forms");

        const apiForms = res.data.items;

        const formattedForms = apiForms.map((item) => ({
          id: item.id,
          type: item.type,
          name: item.name,
          status: item.status,
          description: item.description,
        }));

        setForms(formattedForms);
      } catch (error) {
        console.error("Fetch forms error:", error);
      }
    };

    fetchForms();
  }, []);

  const filteredForms = forms.filter(
    (form) => form.status === "active" && (!type || form.type === type),
  );
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
          <Link
            to="/"
            className="hover:text-primary-600 flex items-center gap-1"
          >
            <Home size={14} /> Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          {type === "reflect" && (
            <>
              <span className="text-primary-700">
                Phản ánh y tế
              </span>
              
            </>
          )}
          {type === "evaluate" && (
            <>
              <span className="text-primary-700">
                Giám sát chất lượng dịch vụ y tế
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-primary-800 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4 rotate-12">
          <ShieldCheck size={400} />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="bg-secondary-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4 inline-block shadow-lg">
                Dịch vụ công trực tuyến
              </span>
              {type === "reflect" && (
                <>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
                    Phản ánh y tế
                  </h1>
                  <p className="text-primary-100 text-lg font-medium max-w-xl">
                    Gửi phản ánh và ý kiến của bạn về chất lượng dịch vụ y tế,
                    thái độ phục vụ và các vấn đề liên quan đến khám chữa bệnh
                    để cơ quan chức năng kịp thời tiếp nhận và xử lý.
                  </p>
                </>
              )}
              {type === "evaluate" && (
                <>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
                    Giám sát chất lượng y tế
                  </h1>
                  <p className="text-primary-100 text-lg font-medium max-w-xl">
                    Theo dõi và giám sát chất lượng dịch vụ y tế tại các cơ sở
                    khám chữa bệnh, góp phần nâng cao hiệu quả quản lý và cải
                    thiện trải nghiệm của người bệnh.
                  </p>
                </>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] shadow-2xl shrink-0 hidden lg:block">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-800 shadow-lg">
                  <PhoneCall size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest">
                    Hotline hỗ trợ
                  </p>
                  <h4 className="text-xl font-black">1900 9068</h4>
                </div>
              </div>
              <p className="text-xs text-primary-200 leading-relaxed italic">
                Giải đáp thắc mắc về BHYT <br /> 24/7 từ chuyên gia Sở Y tế.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredForms.map((form) => (
            <Link
              key={form.id}
              to={`/forms/${form.id}`}
              className="group block p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-t-4 border-primary-500 hover:border-primary-600"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <FileText className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-primary-700 transition-colors">
                    {form.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Nhấn để xem và điền thông tin
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormList;
