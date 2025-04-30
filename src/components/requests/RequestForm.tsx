
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, X } from 'lucide-react';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RequestType, RequestPriority } from '@/types';
import { createRequest, uploadFile } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  type: z.enum(['inventory', 'system', 'emergency', 'other'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface FileWithPreview extends File {
  preview?: string;
}

const RequestForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'system',
      priority: 'medium',
    },
  });
  
  const onSubmit = async (values: RequestFormValues) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Upload files first (if any)
      const attachments = [];
      
      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[file.name] || 0;
            if (currentProgress < 90) {
              return { ...prev, [file.name]: currentProgress + 10 };
            }
            return prev;
          });
        }, 300);
        
        try {
          const fileUrl = await uploadFile(file);
          
          attachments.push({
            id: crypto.randomUUID(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl,
            uploadedAt: new Date().toISOString(),
          });
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          clearInterval(progressInterval);
        } catch (error) {
          clearInterval(progressInterval);
          console.error('File upload error:', error);
          toast({
            title: 'File Upload Error',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }
      
      // Create the request
      const newRequest = await createRequest({
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        title: values.title,
        description: values.description,
        type: values.type as RequestType,
        priority: values.priority as RequestPriority,
        status: 'new',
        attachments,
      });
      
      toast({
        title: 'Request Submitted',
        description: `Your request #${newRequest.id} has been submitted successfully`,
      });
      
      navigate(`/request/${newRequest.id}`);
    } catch (error) {
      console.error('Submit request error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit the request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Check file size
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File Size Error',
        description: `Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
        variant: 'destructive',
      });
    }
    
    // Add preview URLs
    const validFiles = selectedFiles
      .filter(file => file.size <= MAX_FILE_SIZE)
      .map(file => {
        return Object.assign(file, {
          preview: URL.createObjectURL(file)
        });
      });
    
    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Request</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief title for your request" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inventory" id="inventory" />
                          <FormLabel htmlFor="inventory" className="font-normal cursor-pointer">
                            Inventory (1 day)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="system" id="system" />
                          <FormLabel htmlFor="system" className="font-normal cursor-pointer">
                            System (5 days)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="emergency" id="emergency" />
                          <FormLabel htmlFor="emergency" className="font-normal cursor-pointer">
                            Emergency (4 hours)
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <FormLabel htmlFor="other" className="font-normal cursor-pointer">
                            Other
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <FormLabel htmlFor="low" className="font-normal cursor-pointer">
                            Low
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <FormLabel htmlFor="medium" className="font-normal cursor-pointer">
                            Medium
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <FormLabel htmlFor="high" className="font-normal cursor-pointer">
                            High
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of your request" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Attachments</FormLabel>
              <FormDescription>
                Upload files related to your request (max 10MB per file)
              </FormDescription>
              
              <div className="mt-2 space-y-4">
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {uploadProgress[file.name] !== undefined && (
                            <div className="w-full h-1 mt-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
