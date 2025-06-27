import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const hash = location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token=')) {
      setShowForm(true);
    } else {
      setError('Link inválido ou expirado.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 2000);
    }
  };

  if (success) return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Senha redefinida com sucesso!</CardTitle>
      </CardHeader>
      <CardContent>
        Redirecionando para o login...
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Redefinir Senha</CardTitle>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit">Salvar nova senha</Button>
            {error && <div className="text-destructive text-sm">{error}</div>}
          </form>
        ) : (
          <div className="text-destructive text-sm">{error}</div>
        )}
      </CardContent>
    </Card>
  );
} 