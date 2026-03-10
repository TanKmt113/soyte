import React from 'react';
import { useParams } from 'react-router-dom';

const FormDetail: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Chi tiết biểu mẫu</h1>
      <p className="text-center text-lg">
        Đây là chi tiết cho biểu mẫu có ID: <span className="font-semibold text-primary-600">{formId}</span>
      </p>
      {/* You can fetch and display form details based on the formId */}
    </div>
  );
};

export default FormDetail;
