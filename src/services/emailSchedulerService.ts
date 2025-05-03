
import { addDays } from 'date-fns';
import { requests } from './requestService';
import { users } from './authService';
import { 
  sendEmail,
  generateDeadlineAlertEmail,
  generateAdminDailyDigestEmail 
} from './emailService';

// For checking request deadlines
export const checkRequestDeadlines = async (): Promise<void> => {
  const now = new Date();
  const oneDayFromNow = addDays(now, 1);
  
  for (const request of requests) {
    // Skip requests that are already resolved or closed
    if (request.status === 'resolvida' || request.status === 'fechada') continue;
    
    const deadlineDate = new Date(request.deadlineAt);
    const requesterUser = users.find(u => u.id === request.requesterId);
    
    if (!requesterUser) continue;
    
    // Check if request is overdue
    if (deadlineDate < now) {
      const { subject, body } = generateDeadlineAlertEmail(request, true);
      sendEmail(requesterUser.email, subject, body).catch(console.error);
    }
    // Check if request deadline is approaching (within 1 day)
    else if (deadlineDate < oneDayFromNow) {
      const { subject, body } = generateDeadlineAlertEmail(request, false);
      sendEmail(requesterUser.email, subject, body).catch(console.error);
    }
  }
};

// Send daily digest emails to admins (morning and afternoon)
export const sendAdminDailyDigestEmails = async (): Promise<void> => {
  const pendingRequests = requests.filter(req => 
    req.status !== 'resolvida' && req.status !== 'fechada'
  ).sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
  
  const adminUsers = users.filter(u => u.role === 'admin');
  
  for (const admin of adminUsers) {
    const { subject, body } = generateAdminDailyDigestEmail(pendingRequests);
    sendEmail(admin.email, subject, body).catch(console.error);
  }
};

// Simulate email scheduler initialization
let emailSchedulerInitialized = false;

export const initEmailScheduler = (): void => {
  if (emailSchedulerInitialized) return;
  
  console.log('Initializing email scheduler...');
  
  // Check for request deadlines every hour
  setInterval(() => {
    console.log('Checking request deadlines...');
    checkRequestDeadlines().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
  
  // Morning digest (8 AM)
  const scheduleMorningDigest = () => {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(8, 0, 0, 0);
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilExecution = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      console.log('Sending morning digest emails...');
      sendAdminDailyDigestEmails().catch(console.error);
      scheduleMorningDigest(); // Reschedule for next day
    }, timeUntilExecution);
  };
  
  // Afternoon digest (2 PM)
  const scheduleAfternoonDigest = () => {
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(14, 0, 0, 0);
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilExecution = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      console.log('Sending afternoon digest emails...');
      sendAdminDailyDigestEmails().catch(console.error);
      scheduleAfternoonDigest(); // Reschedule for next day
    }, timeUntilExecution);
  };
  
  scheduleMorningDigest();
  scheduleAfternoonDigest();
  
  emailSchedulerInitialized = true;
  console.log('Email scheduler initialized successfully.');
};
