import { User } from '../types';
import { delay, cloneDeep } from './utils';
import { mockUsers, mockPasswords } from './mockData';

// In-memory data store
let users = cloneDeep(mockUsers);
let currentUser: User | null = null;

// Authentication
export const login = async (email: string, password: string): Promise<User> => {
  await delay(500);
  
  // Update the admin email to match what's shown on the login page
  if (email === "admin@company.com") {
    const adminUser = users.find(u => u.id === "1");
    if (adminUser && password === mockPasswords["1"]) {
      // Update the admin user's email
      adminUser.email = email;
      currentUser = adminUser;
      return adminUser;
    }
  } else if (email === "user@company.com") {
    const regularUser = users.find(u => u.id === "2");
    if (regularUser && password === mockPasswords["2"]) {
      // Update the regular user's email
      regularUser.email = email;
      currentUser = regularUser;
      return regularUser;
    }
  } else {
    // Try standard login with current user data
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && mockPasswords[user.id] === password) {
      currentUser = user;
      return user;
    }
  }
  
  throw new Error("Email ou senha inválidos");
};

export const logout = async (): Promise<void> => {
  await delay(200);
  currentUser = null;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await delay(500);
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  // In a real app, we would send a reset password link to the user's email
  console.log(`Email de redefinição de senha enviado para ${email}`);
};

export const getCurrentUser = async (): Promise<User | null> => {
  await delay(200);
  return currentUser;
};

// Users management (only for admins)
export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  await delay(500);
  
  // Check if current user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error("Permissão negada: Somente administradores podem criar usuários");
  }
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error("Email já está em uso");
  }
  
  const newId = String(users.length + 1);
  const newUser: User = {
    ...userData,
    id: newId,
  };
  
  users.push(newUser);
  
  // Also add a default password
  mockPasswords[newId] = "senha123"; // Default password
  
  return newUser;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  await delay(500);
  
  // Check if current user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error("Permissão negada: Somente administradores podem atualizar usuários");
  }
  
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error("Usuário não encontrado");
  }
  
  users[index] = { ...users[index], ...updates };
  
  return users[index];
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  await delay(500);
  
  // Check if current user is admin or the user themselves
  if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'admin')) {
    throw new Error("Permissão negada: Somente administradores podem alterar senhas de outros usuários");
  }
  
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error("Usuário não encontrado");
  }
  
  mockPasswords[userId] = newPassword;
};

// Export users for other services to use
export { users };
