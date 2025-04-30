
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, CheckCircle2, Clock, FilePlus, Hourglass } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ITRequest } from '@/types';
import { getRequests } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import RequestCard from '@/components/requests/RequestCard';
import { BarChart } from '@/components/ui/chart';

const DashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const fetchedRequests = await getRequests(user?.role === 'admin' ? undefined : user?.id);
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [user]);
  
  // Request statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status !== 'resolved' && r.status !== 'closed').length;
  const resolvedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'closed').length;
  const highPriorityRequests = requests.filter(r => r.priority === 'high' && r.status !== 'resolved' && r.status !== 'closed').length;
  
  // Recent requests
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  // Chart data (simplified for demo)
  const chartData = [
    { name: 'Inventory', value: requests.filter(r => r.type === 'inventory').length },
    { name: 'System', value: requests.filter(r => r.type === 'system').length },
    { name: 'Emergency', value: requests.filter(r => r.type === 'emergency').length },
    { name: 'Other', value: requests.filter(r => r.type === 'other').length },
  ];
  
  const statusData = [
    { name: 'New', value: requests.filter(r => r.status === 'new').length },
    { name: 'Assigned', value: requests.filter(r => r.status === 'assigned').length },
    { name: 'In Progress', value: requests.filter(r => r.status === 'in_progress').length },
    { name: 'Resolved', value: requests.filter(r => r.status === 'resolved').length },
    { name: 'Closed', value: requests.filter(r => r.status === 'closed').length },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
          <Link to="/request/new">
            <FilePlus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Resolved Requests</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <ArrowUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Urgent attention needed
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Request Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <BarChart 
              data={chartData}
              index="name"
              categories={['value']}
              colors={['hsl(var(--primary))']}
              valueFormatter={(value: number) => String(value)}
              className="w-full aspect-[4/3]"
              config={{
                value: { color: 'hsl(var(--primary))' }
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <BarChart 
              data={statusData}
              index="name"
              categories={['value']}
              colors={['hsl(var(--accent))']}
              valueFormatter={(value: number) => String(value)}
              className="w-full aspect-[4/3]"
              config={{
                value: { color: 'hsl(var(--accent))' }
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Requests</CardTitle>
          <Link to={user?.role === 'admin' ? '/requests' : '/requests/my'} className="text-sm text-muted-foreground hover:text-foreground flex items-center">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No requests found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/request/new">
              <FilePlus className="h-4 w-4 mr-2" />
              Create New Request
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DashboardPage;
