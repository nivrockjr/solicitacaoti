// Main API service that re-exports all the functionality from individual services
import { getRequests, getRequestById, createRequest, updateRequest, uploadFile, deleteRequest } from './requestService';
import { getHolidays, addHoliday } from './holidayService';
import { getNotifications, markNotificationAsRead } from './notificationService';
import { 
  checkAndCreatePreventiveMaintenanceRequests, 
  createPreventiveMaintenanceRequests, 
  isPreventiveMaintenanceDate 
} from './preventiveMaintenanceService';

// Exporte apenas o que for realmente utilizado
export {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  uploadFile,
  deleteRequest,
  getHolidays,
  addHoliday,
  getNotifications,
  markNotificationAsRead,
  checkAndCreatePreventiveMaintenanceRequests,
  createPreventiveMaintenanceRequests,
  isPreventiveMaintenanceDate,
};
