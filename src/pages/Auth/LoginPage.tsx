import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent } from '@/components/ui/card';

const LoginPage: React.FC = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-2 text-primary">Solicitação de TI</h1>
      {showForgotPassword ? (
        <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
      ) : (
        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      )}
    </>
  );
};

export default LoginPage;
