import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

const FormList: React.FC = () => {
  const forms = [
    { id: 'bieu-mau-khai-bao-y-te', name: 'Biểu mẫu Khai báo y tế' },
    { id: 'bieu-mau-dang-ky-tiem-chung', name: 'Biểu mẫu Đăng ký tiêm chủng' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-primary-800 tracking-tight">
          Kho biểu mẫu trực tuyến
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {forms.map((form) => (
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
                  <p className="text-sm text-gray-500 mt-1">Nhấn để xem và điền thông tin</p>
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
