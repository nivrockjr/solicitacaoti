import { User, ITRequest, RequestType, RequestPriority, Holiday, Notification } from '../types';
import { mockUsers, mockRequests, mockHolidays, mockNotifications } from './mockData';
import { addDays, format, isWeekend, isBefore, isAfter, parseISO } from 'date-fns';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Clone deep to avoid direct mutations
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// In-memory data store
let users = cloneDeep(mockUsers);
let requests = cloneDeep(mockRequests);
let holidays = cloneDeep(mockHolidays);
let notifications = cloneDeep(mockNotifications);
let currentUser: User | null = null;

// Authentication
export const login = async (email: string, password: string): Promise<User> => {
  await delay(500);
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  // In a real app, we would validate the password here
  
  currentUser = user;
  return user;
};

export const logout = async (): Promise<void> => {
  await delay(200);
  currentUser = null;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await delay(500);
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // In a real app, we would send a reset password link to the user's email
  console.log(`Password reset email sent to ${email}`);
};

export const getCurrentUser = async (): Promise<User | null> => {
  await delay(200);
  return currentUser;
};

// Requests
export const getRequests = async (userId?: string): Promise<ITRequest[]> => {
  await delay(300);
  
  if (userId) {
    return requests.filter(r => r.requesterId === userId);
  }
  
  return requests;
};

export const getRequestById = async (id: string): Promise<ITRequest | undefined> => {
  await delay(200);
  return requests.find(r => r.id === id);
};

export const createRequest = async (request: Omit<ITRequest, 'id' | 'createdAt' | 'deadlineAt'>): Promise<ITRequest> => {
  await delay(500);
  
  const newId = `REQ-${String(requests.length + 1).padStart(3, '0')}`;
  const now = new Date();
  const createdAtStr = now.toISOString();
  
  // Calculate deadline based on type
  const deadline = calculateDeadline(request.type, request.priority);
  
  const newRequest: ITRequest = {
    ...request,
    id: newId,
    createdAt: createdAtStr,
    deadlineAt: deadline.toISOString(),
    status: 'new'
  };
  
  requests.push(newRequest);
  
  // Create notifications
  createNotification({
    userId: newRequest.requesterId,
    title: "Request Submitted",
    message: `Your request ${newId} has been submitted successfully`,
    type: "request_created",
    requestId: newId
  });
  
  // Notify admins
  users.filter(u => u.role === 'admin').forEach(admin => {
    createNotification({
      userId: admin.id,
      title: "New Request",
      message: `A new ${request.priority} priority request ${newId} has been submitted`,
      type: "request_created",
      requestId: newId
    });
  });
  
  return newRequest;
};

export const updateRequest = async (id: string, updates: Partial<ITRequest>): Promise<ITRequest> => {
  await delay(500);
  
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw new Error("Request not found");
  }
  
  const oldRequest = requests[index];
  
  // Check for status change to handle notifications
  if (updates.status && updates.status !== oldRequest.status) {
    if (updates.status === 'assigned') {
      createNotification({
        userId: oldRequest.requesterId,
        title: "Request Assigned",
        message: `Your request ${id} has been assigned to a technician`,
        type: "request_assigned",
        requestId: id
      });
    } else if (updates.status === 'resolved') {
      createNotification({
        userId: oldRequest.requesterId,
        title: "Request Resolved",
        message: `Your request ${id} has been resolved`,
        type: "request_resolved",
        requestId: id
      });
    }
  }
  
  // Check for deadline change
  if (updates.deadlineAt && updates.deadlineAt !== oldRequest.deadlineAt) {
    createNotification({
      userId: oldRequest.requesterId,
      title: "Deadline Updated",
      message: `The deadline for your request ${id} has been updated`,
      type: "deadline_changed",
      requestId: id
    });
  }
  
  requests[index] = { ...oldRequest, ...updates };
  
  return requests[index];
};

// Holidays
export const getHolidays = async (): Promise<Holiday[]> => {
  await delay(300);
  return holidays;
};

export const addHoliday = async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
  await delay(300);
  
  const newHoliday: Holiday = {
    ...holiday,
    id: `h${holidays.length + 1}`
  };
  
  holidays.push(newHoliday);
  
  return newHoliday;
};

// Notifications
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  await delay(200);
  return notifications.filter(n => n.userId === userId);
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  await delay(100);
  
  const index = notifications.findIndex(n => n.id === id);
  
  if (index === -1) {
    throw new Error("Notification not found");
  }
  
  notifications[index] = { ...notifications[index], isRead: true };
  
  return notifications[index];
};

const createNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: `n${notifications.length + 1}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(newNotification);
  
  return newNotification;
};

// Helper function to calculate request deadline based on type and priority
const calculateDeadline = (type: RequestType, priority: RequestPriority): Date => {
  const now = new Date();
  
  let deadlineDays: number;
  
  switch (type) {
    case 'inventory':
      deadlineDays = 1; // 1 day for inventory requests
      break;
    case 'system':
      deadlineDays = 5; // 5 days for system requests
      break;
    case 'emergency':
      return addBusinessHours(now, 4); // 4 hours for emergency
    default:
      deadlineDays = 3; // Default to 3 days
  }
  
  // Adjust based on priority
  if (priority === 'high') {
    deadlineDays = Math.max(1, deadlineDays - 1);
  } else if (priority === 'low') {
    deadlineDays += 1;
  }
  
  return addBusinessDays(now, deadlineDays);
};

const addBusinessDays = (date: Date, days: number): Date => {
  let currentDate = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    
    // Skip weekends and holidays
    if (!isBusinessDay(currentDate)) {
      continue;
    }
    
    remainingDays--;
  }
  
  // Set time to end of business day (18:00)
  currentDate.setHours(18, 0, 0, 0);
  
  return currentDate;
};

const addBusinessHours = (date: Date, hours: number): Date => {
  let currentDate = new Date(date);
  let remainingHours = hours;
  
  while (remainingHours > 0) {
    // Add one hour
    currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
    
    // If outside business hours (8am-6pm) or not a business day, skip
    const hour = currentDate.getHours();
    if (hour < 8 || hour >= 18 || !isBusinessDay(currentDate)) {
      // If hour < 8, move to 8am
      if (hour < 8) {
        currentDate.setHours(8, 0, 0, 0);
      }
      // If hour >= 18 or weekend/holiday, move to next business day at 8am
      else {
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(8, 0, 0, 0);
        
        // Keep checking until we find a business day
        while (!isBusinessDay(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }
      }
      continue;
    }
    
    remainingHours--;
  }
  
  return currentDate;
};

const isBusinessDay = (date: Date): boolean => {
  // Check if it's a weekend
  if (isWeekend(date)) {
    return false;
  }
  
  // Check if it's a holiday
  const dateString = format(date, 'yyyy-MM-dd');
  return !holidays.some(holiday => holiday.date === dateString);
};

// File upload simulation
export const uploadFile = async (file: File): Promise<string> => {
  await delay(1000); // Simulate upload time
  return URL.createObjectURL(file); // In a real app, this would be a URL from a file storage service
};
