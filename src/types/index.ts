
export type UserRole = 'requester' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
}

export type RequestType = 'inventory' | 'system' | 'emergency' | 'other';
export type RequestPriority = 'low' | 'medium' | 'high';
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface ITRequest {
  id: string;
  requesterId: string;
  requesterName: string; 
  requesterEmail: string;
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  deadlineAt: string;
  assignedTo?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  resolution?: string;
  resolvedAt?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO date string
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'request_created' | 'request_assigned' | 'deadline_changed' | 'request_resolved';
  requestId?: string;
}
