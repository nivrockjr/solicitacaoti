import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getSemanticIcon } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface TrainingUserSelectProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

export const TrainingUserSelect: React.FC<TrainingUserSelectProps> = ({
  selectedUserIds,
  onChange,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('name');
        
        if (!error && data) {
          setUsers(data as User[]);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Erro ao buscar usuários:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedUserIds];
      filteredUsers.forEach((u) => {
        if (!newSelected.includes(u.id)) {
          newSelected.push(u.id);
        }
      });
      onChange(newSelected);
    } else {
      const filteredIds = filteredUsers.map((u) => u.id);
      onChange(selectedUserIds.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleToggleUser = (userId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedUserIds, userId]);
    } else {
      onChange(selectedUserIds.filter((id) => id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-md bg-muted/10">
        {getSemanticIcon('spinner', { className: 'h-4 w-4 animate-spin' })}
        Carregando colaboradores...
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/10">
      <div>
        <Label className="text-base font-semibold">Colaboradores para o Treinamento</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione os usuários que deverão assinar este termo de treinamento. Cada usuário receberá uma solicitação individual.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            {getSemanticIcon('action-search', { className: 'h-4 w-4' })}
          </div>
          <Input
            placeholder="Buscar por nome ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm font-medium whitespace-nowrap">
          {selectedUserIds.length} de {users.length} selecionados
        </div>
      </div>

      <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto bg-card custom-scrollbar">
        {filteredUsers.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
            <Checkbox
              id="select-all"
              checked={allFilteredSelected}
              onCheckedChange={(c) => handleSelectAll(c as boolean)}
            />
            <Label htmlFor="select-all" className="cursor-pointer font-semibold flex-1">
              Selecionar todos os {filteredUsers.length} listados
            </Label>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum colaborador encontrado com "{searchTerm}".
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
              <Checkbox
                id={`user-${user.id}`}
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={(c) => handleToggleUser(user.id, c as boolean)}
              />
              <Label htmlFor={`user-${user.id}`} className="cursor-pointer flex-1 flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.department || 'Sem setor'} {user.position ? `- ${user.position}` : ''}
                </span>
              </Label>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
