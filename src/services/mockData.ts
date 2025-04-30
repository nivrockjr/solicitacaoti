
import { User, ITRequest, Holiday, Notification } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@company.com",
    name: "Admin User",
    role: "admin",
    department: "IT",
    position: "IT Manager"
  },
  {
    id: "2",
    email: "user@company.com",
    name: "Regular User",
    role: "requester",
    department: "Marketing",
    position: "Marketing Specialist"
  }
];

// Mock IT Requests
export const mockRequests: ITRequest[] = [
  {
    id: "REQ-001",
    requesterId: "2",
    requesterName: "Regular User",
    requesterEmail: "user@company.com",
    title: "Need new monitor",
    description: "Current monitor has dead pixels, need a replacement",
    type: "inventory",
    priority: "medium",
    status: "new",
    createdAt: "2025-04-28T10:30:00Z",
    deadlineAt: "2025-04-29T18:00:00Z",
    comments: [
      {
        id: "c1",
        userId: "2",
        userName: "Regular User",
        text: "Please expedite if possible",
        createdAt: "2025-04-28T10:35:00Z"
      }
    ]
  },
  {
    id: "REQ-002",
    requesterId: "2",
    requesterName: "Regular User",
    requesterEmail: "user@company.com",
    title: "System access request",
    description: "Need access to the reporting system",
    type: "system",
    priority: "low",
    status: "assigned",
    createdAt: "2025-04-27T14:15:00Z",
    deadlineAt: "2025-05-02T18:00:00Z",
    assignedTo: "1",
    comments: [
      {
        id: "c2",
        userId: "1",
        userName: "Admin User",
        text: "Working on this",
        createdAt: "2025-04-28T09:00:00Z"
      }
    ]
  },
  {
    id: "REQ-003",
    requesterId: "2",
    requesterName: "Regular User",
    requesterEmail: "user@company.com",
    title: "Email not working",
    description: "Cannot send or receive emails since this morning",
    type: "emergency",
    priority: "high",
    status: "in_progress",
    createdAt: "2025-04-28T08:00:00Z",
    deadlineAt: "2025-04-28T12:00:00Z",
    assignedTo: "1",
    comments: [
      {
        id: "c3",
        userId: "1",
        userName: "Admin User",
        text: "Investigating email server issues",
        createdAt: "2025-04-28T08:15:00Z"
      }
    ]
  },
  {
    id: "REQ-004",
    requesterId: "2",
    requesterName: "Regular User",
    requesterEmail: "user@company.com",
    title: "Software installation",
    description: "Need Photoshop installed on my machine",
    type: "system",
    priority: "medium",
    status: "resolved",
    createdAt: "2025-04-25T11:20:00Z",
    deadlineAt: "2025-04-30T18:00:00Z",
    assignedTo: "1",
    resolution: "Software installed and tested",
    resolvedAt: "2025-04-27T15:45:00Z",
    comments: [
      {
        id: "c4",
        userId: "1",
        userName: "Admin User",
        text: "Installation complete",
        createdAt: "2025-04-27T15:45:00Z"
      }
    ]
  }
];

// Mock Holidays
export const mockHolidays: Holiday[] = [
  {
    id: "h1",
    name: "New Year's Day",
    date: "2025-01-01"
  },
  {
    id: "h2",
    name: "Memorial Day",
    date: "2025-05-26"
  },
  {
    id: "h3",
    name: "Independence Day",
    date: "2025-07-04"
  },
  {
    id: "h4",
    name: "Labor Day",
    date: "2025-09-01"
  },
  {
    id: "h5",
    name: "Thanksgiving Day",
    date: "2025-11-27"
  },
  {
    id: "h6",
    name: "Christmas Day",
    date: "2025-12-25"
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "2",
    title: "Request Received",
    message: "Your request REQ-001 has been received and is pending assignment",
    isRead: false,
    createdAt: "2025-04-28T10:30:00Z",
    type: "request_created",
    requestId: "REQ-001"
  },
  {
    id: "n2",
    userId: "2",
    title: "Request Assigned",
    message: "Your request REQ-002 has been assigned to Admin User",
    isRead: true,
    createdAt: "2025-04-28T09:00:00Z",
    type: "request_assigned",
    requestId: "REQ-002"
  },
  {
    id: "n3",
    userId: "1",
    title: "New Request",
    message: "A new high priority request REQ-003 has been submitted",
    isRead: false,
    createdAt: "2025-04-28T08:00:00Z",
    type: "request_created",
    requestId: "REQ-003"
  },
  {
    id: "n4",
    userId: "2",
    title: "Request Resolved",
    message: "Your request REQ-004 has been resolved",
    isRead: false,
    createdAt: "2025-04-27T15:45:00Z",
    type: "request_resolved",
    requestId: "REQ-004"
  }
];
