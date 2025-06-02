
// Main API service that re-exports all the functionality from individual services
import { login, logout, forgotPassword, getCurrentUser, createUser, updateUser, updateUserPassword } from './authService';
import { getRequests, getRequestById, createRequest, updateRequest, uploadFile } from './requestService';
import { getHolidays, addHoliday } from './holidayService';
import { getNotifications, markNotificationAsRead } from './notificationService';
import { initEmailScheduler, checkRequestDeadlines, sendAdminDailyDigestEmails } from './emailSchedulerService';
import { 
  checkAndCreatePreventiveMaintenanceRequests, 
  createPreventiveMaintenanceRequests, 
  isPreventiveMaintenanceDate 
} from './preventiveMaintenanceService';
import { sendEmail } from './emailService';
import { aiAssistantService } from './aiAssistantService';

// Re-export all the functionality
export {
  // Auth
  login,
  logout,
  forgotPassword,
  getCurrentUser,
  createUser,
  updateUser,
  updateUserPassword,
  
  // Requests
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  uploadFile,
  
  // Holidays
  getHolidays,
  addHoliday,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  
  // Email Scheduler
  initEmailScheduler,
  checkRequestDeadlines,
  sendAdminDailyDigestEmails,
  
  // Preventive Maintenance
  checkAndCreatePreventiveMaintenanceRequests,
  createPreventiveMaintenanceRequests,
  isPreventiveMaintenanceDate,
  
  // Email Service
  sendEmail,
  
  // AI Assistant
  aiAssistantService
};
