
import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent } from '@/components/ui/card';

const LoginPage: React.FC = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  return (
    <>
      {showForgotPassword ? (
        <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
      ) : (
        <>
          <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
          
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-center font-medium mb-2">Credenciais de Teste</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Perfil Admin:</div>
                  <div>admin@company.com / admin123</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Perfil Solicitante:</div>
                  <div>user@company.com / user123</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default LoginPage;
