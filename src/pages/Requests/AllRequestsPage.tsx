
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ITRequest, RequestPriority, RequestStatus, RequestType } from '@/types';
import { getRequests } from '@/services/apiService';
import RequestCard from '@/components/requests/RequestCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Filters {
  types: RequestType[];
  priorities: RequestPriority[];
}

const AllRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ITRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    types: [],
    priorities: []
  });
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const fetchedRequests = await getRequests();
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);
  
  const requestsByStatus = (status: RequestStatus | 'all'): ITRequest[] => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        r => 
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(r => filters.types.includes(r.type));
    }
    
    // Apply priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(r => filters.priorities.includes(r.priority));
    }
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    
    return filtered;
  };
  
  const handleTypeFilterChange = (type: RequestType) => {
    setFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
        
      return { ...prev, types };
    });
  };
  
  const handlePriorityFilterChange = (priority: RequestPriority) => {
    setFilters(prev => {
      const priorities = prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority];
        
      return { ...prev, priorities };
    });
  };
  
  const clearFilters = () => {
    setFilters({ types: [], priorities: [] });
  };
  
  const hasActiveFilters = filters.types.length > 0 || filters.priorities.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">All Requests</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {filters.types.length + filters.priorities.length}
                  </span>
                )}
                <span className="sr-only">Filter requests</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-4" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Request Type</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-inventory" 
                        checked={filters.types.includes('inventory')}
                        onCheckedChange={() => handleTypeFilterChange('inventory')}
                      />
                      <Label htmlFor="type-inventory">Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-system" 
                        checked={filters.types.includes('system')}
                        onCheckedChange={() => handleTypeFilterChange('system')}
                      />
                      <Label htmlFor="type-system">System</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-emergency" 
                        checked={filters.types.includes('emergency')}
                        onCheckedChange={() => handleTypeFilterChange('emergency')}
                      />
                      <Label htmlFor="type-emergency">Emergency</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="type-other" 
                        checked={filters.types.includes('other')}
                        onCheckedChange={() => handleTypeFilterChange('other')}
                      />
                      <Label htmlFor="type-other">Other</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-high" 
                        checked={filters.priorities.includes('high')}
                        onCheckedChange={() => handlePriorityFilterChange('high')}
                      />
                      <Label htmlFor="priority-high">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-medium" 
                        checked={filters.priorities.includes('medium')}
                        onCheckedChange={() => handlePriorityFilterChange('medium')}
                      />
                      <Label htmlFor="priority-medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="priority-low" 
                        checked={filters.priorities.includes('low')}
                        onCheckedChange={() => handlePriorityFilterChange('low')}
                      />
                      <Label htmlFor="priority-low">Low</Label>
                    </div>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button asChild>
            <Link to="/request/new">
              <FilePlus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({requestsByStatus('all').length})
          </TabsTrigger>
          <TabsTrigger value="new">
            New ({requestsByStatus('new').length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Assigned ({requestsByStatus('assigned').length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({requestsByStatus('in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({requestsByStatus('resolved').length})
          </TabsTrigger>
        </TabsList>
        
        {['all', 'new', 'assigned', 'in_progress', 'resolved'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : requestsByStatus(status as any).length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="font-medium text-lg mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || hasActiveFilters 
                    ? "No requests match your search or filters" 
                    : "There are no requests with this status"}
                </p>
                
                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="mr-2">
                    Clear Filters
                  </Button>
                )}
                
                <Button asChild>
                  <Link to="/request/new">
                    <FilePlus className="h-4 w-4 mr-2" />
                    Create New Request
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requestsByStatus(status as any).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.types.map((type) => (
              <Badge key={`type-${type}`} variant="outline" className="flex items-center gap-1">
                {type}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleTypeFilterChange(type)}
                >
                  ×
                </button>
              </Badge>
            ))}
            {filters.priorities.map((priority) => (
              <Badge key={`priority-${priority}`} variant="outline" className="flex items-center gap-1">
                {priority} priority
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => handlePriorityFilterChange(priority)}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6">
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRequestsPage;
