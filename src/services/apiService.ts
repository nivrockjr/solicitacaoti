// Main API service that re-exports all the functionality from individual services
import { login, logout, forgotPassword, getCurrentUser, createUser, updateUser, updateUserPassword } from './authService';
import { getRequests, getRequestById, createRequest, updateRequest, uploadFile, deleteRequest } from './requestService';
import { getHolidays, addHoliday } from './holidayService';
import { getNotifications, markNotificationAsRead } from './notificationService';
import { 
  checkAndCreatePreventiveMaintenanceRequests, 
  createPreventiveMaintenanceRequests, 
  isPreventiveMaintenanceDate 
} from './preventiveMaintenanceService';

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
  deleteRequest,
  
  // Holidays
  getHolidays,
  addHoliday,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  
  // Preventive Maintenance
  checkAndCreatePreventiveMaintenanceRequests,
  createPreventiveMaintenanceRequests,
  isPreventiveMaintenanceDate,
};
