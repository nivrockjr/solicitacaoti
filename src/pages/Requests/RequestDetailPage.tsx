
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { ArrowLeft, Calendar, Clock, FileText, PaperclipIcon, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ITRequest, Comment } from '@/types';
import { getRequestById, updateRequest } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ITRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedRequest = await getRequestById(id);
        
        if (!fetchedRequest) {
          toast({
            title: 'Request Not Found',
            description: `Request #${id} does not exist or you don't have permission to view it.`,
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        // Check if the user has permission to view the request
        if (user?.role !== 'admin' && fetchedRequest.requesterId !== user?.id) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this request.',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        setRequest(fetchedRequest);
      } catch (error) {
        console.error('Error fetching request:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the request. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequest();
  }, [id, toast, navigate, user]);
  
  const handleAddComment = async () => {
    if (!request || !id || !user || !comment.trim()) return;
    
    try {
      setSubmitting(true);
      
      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedRequest = await updateRequest(id, {
        comments: [...(request.comments || []), newComment],
      });
      
      setRequest(updatedRequest);
      setComment('');
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the request.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!request || !id) return;
    
    try {
      setSubmitting(true);
      
      let updates: Partial<ITRequest> = {
        status: newStatus as any,
      };
      
      // If resolving, add resolution details
      if (newStatus === 'resolved' && !request.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
        updates.resolution = `Resolved by ${user?.name}`;
      }
      
      const updatedRequest = await updateRequest(id, updates);
      setRequest(updatedRequest);
      
      toast({
        title: 'Status Updated',
        description: `Request status changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500';
      case 'assigned':
        return 'bg-amber-500';
      case 'in_progress':
        return 'bg-purple-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge>Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };
  
  const isDeadlinePassed = (deadlineAt: string) => {
    return isAfter(new Date(), new Date(deadlineAt));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <h2 className="text-2xl font-bold mb-4">Request Not Found</h2>
        <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Request #{request.id}</h1>
        </div>
        
        {user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'closed' && (
          <div className="flex gap-2">
            {request.status === 'new' && (
              <Button onClick={() => handleStatusChange('assigned')} variant="outline" disabled={submitting}>
                Assign
              </Button>
            )}
            {(request.status === 'assigned' || request.status === 'new') && (
              <Button onClick={() => handleStatusChange('in_progress')} variant="outline" disabled={submitting}>
                Start Progress
              </Button>
            )}
            <Button onClick={() => handleStatusChange('resolved')} disabled={submitting}>
              Resolve
            </Button>
          </div>
        )}
        
        {user?.role === 'admin' && request.status === 'resolved' && (
          <Button onClick={() => handleStatusChange('closed')} variant="outline" disabled={submitting}>
            Close Request
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className={`h-2 ${getStatusColor(request.status)}`}></div>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-xl mb-1">{request.title}</CardTitle>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{request.type.charAt(0).toUpperCase() + request.type.slice(1)} request</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created on {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {getPriorityBadge(request.priority)}
                <Badge variant={request.status === 'resolved' || request.status === 'closed' ? 'outline' : 'secondary'}>
                  {request.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <div className="bg-muted/40 p-3 rounded text-sm whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>
              
              {request.resolution && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Resolution</h3>
                  <div className="bg-muted/40 p-3 rounded text-sm whitespace-pre-wrap border-l-4 border-green-500">
                    <p>{request.resolution}</p>
                    {request.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolved on {format(new Date(request.resolvedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {request.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 bg-muted/40 p-2 rounded"
                      >
                        <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={attachment.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs"
                          >
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-4">Comments</h3>
                {(!request.comments || request.comments.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {request.comments.map((comment) => (
                      <div key={comment.id} className="bg-muted/40 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                              {comment.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <p className="text-sm font-medium">{comment.userName}</p>
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </time>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!comment.trim() || submitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{request.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deadline</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <p className={`font-medium ${isDeadlinePassed(request.deadlineAt) && request.status !== 'resolved' && request.status !== 'closed' ? 'text-destructive' : ''}`}>
                    {format(new Date(request.deadlineAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {isDeadlinePassed(request.deadlineAt) && request.status !== 'resolved' && request.status !== 'closed' && (
                  <p className="text-xs text-destructive">Past due date</p>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Requester</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{request.requesterName}</p>
                    <p className="text-xs text-muted-foreground">{request.requesterEmail}</p>
                  </div>
                </div>
              </div>
              
              {request.assignedTo && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">IT Support Staff</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Request ID</p>
                <p className="font-medium">{request.id}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
              
              {(user?.role === 'admin' && request.status !== 'resolved' && request.status !== 'closed') && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Admin Actions</p>
                    <div className="space-y-2">
                      {request.status === 'new' && (
                        <Button 
                          onClick={() => handleStatusChange('assigned')} 
                          className="w-full" 
                          variant="outline"
                          disabled={submitting}
                        >
                          Assign Request
                        </Button>
                      )}
                      
                      {(request.status === 'assigned' || request.status === 'new') && (
                        <Button 
                          onClick={() => handleStatusChange('in_progress')} 
                          className="w-full" 
                          variant="outline"
                          disabled={submitting}
                        >
                          Start Progress
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleStatusChange('resolved')} 
                        className="w-full"
                        disabled={submitting}
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;
