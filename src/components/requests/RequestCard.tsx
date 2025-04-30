
import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ITRequest } from '@/types';
import { cn } from '@/lib/utils';

interface RequestCardProps {
  request: ITRequest;
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const navigate = useNavigate();
  
  const getStatusColor = () => {
    switch (request.status) {
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
  
  const getPriorityIcon = () => {
    switch (request.priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1", getStatusColor())} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium leading-tight line-clamp-1">{request.title}</h3>
            <p className="text-xs text-muted-foreground">Request #{request.id}</p>
          </div>
          <Badge variant={request.priority === 'high' ? 'destructive' : request.priority === 'medium' ? 'default' : 'outline'}>
            <span className="flex items-center gap-1">
              {getPriorityIcon()}
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </span>
          </Badge>
        </div>
        
        <div className="mt-3">
          <p className="text-sm line-clamp-2">{request.description}</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Badge variant="outline">{formatStatus(request.status)}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Due {format(new Date(request.deadlineAt), 'MMM d, h:mm a')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/request/${request.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RequestCard;
