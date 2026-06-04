import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StockAdjustmentForm } from '@/components/stock/StockAdjustmentForm';

const StockAdjustmentPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-xl mx-auto bg-card shadow rounded-2xl border p-6 dark-hover-gradient">
        <h1 className="text-xl font-bold mb-6 mt-2">Ajuste de Estoque</h1>
        <StockAdjustmentForm 
          onSuccess={() => navigate('/dashboard')} 
          onCancel={() => navigate(-1)} 
        />
      </div>
    </div>
  );
};

export default StockAdjustmentPage;
