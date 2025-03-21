'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Check, RefreshCw, LogIn, LogOut, Users, Loader2, QrCode, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import QRScanner from '@/components/QRScanner';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { toast } from "sonner";

// Custom table components
const Table = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <table className={`min-w-full divide-y divide-border ${className || ''}`}>
    {children}
  </table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-muted">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-card divide-y divide-border">{children}
  </tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr>{children}</tr>
);

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
    {children}
  </th>
);

const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <td className={`px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${className || ''}`}>
    {children}
  </td>
);

const TableCaption = ({ children }: { children: React.ReactNode }) => (
  <caption className="py-2 text-sm text-muted-foreground text-center">
    {children}
  </caption>
);

// Custom pagination components
const Pagination = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`flex justify-center my-4 ${className || ''}`}>{children}</div>
);

const PaginationContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-1">{children}</div>
);

const PaginationItem = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

const PaginationLink = ({ 
  children, 
  isActive, 
  onClick 
}: { 
  children: React.ReactNode, 
  isActive?: boolean,
  onClick?: () => void
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded text-sm ${
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "bg-background hover:bg-muted hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const PaginationPrevious = ({ 
  onClick,
  className
}: { 
  onClick?: () => void,
  className?: string
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-muted ${className || ''}`}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="hidden sm:inline">Previous</span>
  </button>
);

const PaginationNext = ({ 
  onClick,
  className
}: { 
  onClick?: () => void,
  className?: string
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-muted ${className || ''}`}
  >
    <span className="hidden sm:inline">Next</span>
    <ChevronRight className="h-4 w-4" />
  </button>
);

const PaginationEllipsis = () => (
  <span className="px-2 py-1">...</span>
);

interface AttendanceData {
  name: string;
  email: string;
  timestamp?: string;
  inTimestamp?: string;
  outTimestamp?: string;
  regno: string;
  status?: string;
  attend?: boolean;
  isInside?: boolean;
  id: string;
  markedBy?: string[];
}

// Define Badge component directly since module is missing
const Badge = ({ 
  children, 
  variant = "default" 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "outline" | "destructive" | "success"  
}) => {
  const variantClasses = {
    default: "bg-primary/10 text-primary hover:bg-primary/20",
    secondary: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant || "default"]}`}>
      {children}
    </span>
  );
};

// Attendance Tracking Component
const ParentComponent = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [qrResult, setQrResult] = useState('None');
  const [qrResultTimestamp, setQrResultTimestamp] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('singleScan');
  
  // For attended participants list
  const [attendedParticipants, setAttendedParticipants] = useState<AttendanceData[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [hasFetchedAttendees, setHasFetchedAttendees] = useState(false);
  
  // For tracking in/out status
  const [attendanceType, setAttendanceType] = useState<'in' | 'out'>('in');
  const [outsideParticipants, setOutsideParticipants] = useState<AttendanceData[]>([]);
  const [loadingOutside, setLoadingOutside] = useState(false);
  
  // Pagination states
  const [attendedPage, setAttendedPage] = useState(1);
  const [outsidePage, setOutsidePage] = useState(1);
  const pageSize = 10; // Number of items per page
  
  // Simple pagination component
  const PaginationControls = ({ 
    currentPage, 
    setPage, 
    totalItems, 
    itemsPerPage = pageSize
  }: { 
    currentPage: number; 
    setPage: (page: number) => void; 
    totalItems: number;
    itemsPerPage?: number;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink 
                onClick={() => setPage(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          )).slice(0, 5)}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  // Get user from token only once on component mount
  useEffect(() => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const token = sessionStorage.getItem('Token');
    if (!token) {
      router.push('/');
      return;
    }
    
    try {
      const decodedToken = jwtDecode<{ name: string; email: string }>(token);
      setUser(decodedToken);
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/');
    }
  }, [router]);
  
  // Helper function to get IST timestamp
  const getISTTimestamp = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return now.toLocaleString('en-IN', options);
  };
  
  // Fetch attended participants
  const fetchAttendedParticipants = useCallback(async () => {
    if (loadingAttendees) return;
    
    setLoadingAttendees(true);
    setHasFetchedAttendees(true);
    
    try {
      console.log("Fetching attended participants...");
      const response = await fetch('/api/getAttendedParticipants', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // First check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error ${response.status}: ${errorText}`);
        throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Invalid content type: ${contentType}`);
        throw new Error('Invalid response format from server');
      }
      
      const data = await response.json();
      console.log("Attended participants data:", data);
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      setAttendedParticipants(data.participants || []);
      
      if (data.participants && data.participants.length > 0) {
        toast.success(`Loaded ${data.participants.length} attended participants`);
      } else {
        toast.info('No attended participants found yet', {
          description: 'Mark some attendances first'
        });
      }
    } catch (error) {
      console.error('Error fetching attended participants:', error);
      
      if (error instanceof SyntaxError) {
        toast.error('Invalid server response. Please check server logs.', {
          duration: 5000,
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.', {
          duration: 5000,
        });
      }
    } finally {
      setLoadingAttendees(false);
    }
  }, [loadingAttendees]);
  const loadingRef = useRef(false);
  // Fetch participants who are outside
  const fetchOutsideParticipants = useCallback(async () => {
  if (loadingRef.current) return;
  loadingRef.current = true;
  setLoadingOutside(true);
  try {
    console.log("Fetching outside participants...");
    const response = await fetch('/api/getOutsideParticipants', {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server error ${response.status}: ${errorText}`);
      throw new Error(`Server responded with status: ${response.status}. ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Invalid content type: ${contentType}`);
      throw new Error('Invalid response format from server');
    }
    
    const data = await response.json();
    console.log("Outside participants data:", data);
    
    if (data.error) {
      throw new Error(data.message || data.error);
    }
    
    setOutsideParticipants(data.participants || []);
    
    if (data.participants && data.participants.length > 0) {
      toast.success(`Found ${data.participants.length} participants currently outside`);
    } else {
      toast.info('Everyone is inside the hall', {
        description: 'No one is currently outside'
      });
    }
  } catch (error) {
    console.error('Error fetching outside participants:', error);
    
    if (error instanceof SyntaxError) {
      toast.error('Invalid server response. Please check server logs.');
    } else {
      toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    }
  } finally {
    loadingRef.current = false;
    setLoadingOutside(false);
  }
}, []); 
  
  // Process scan result
  const handleScan = useCallback(async (result: string) => {
    setQrResult(result);
    const istTime = getISTTimestamp();
    setQrResultTimestamp(istTime);
    
    // Close dialog and fetch data
    setIsDialogOpen(false);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/markAttendance?qrResult=${encodeURIComponent(result)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // First check if response is OK
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      setData(data);
      
      // If participant already marked, show message
      if (data.attend) {
        toast.info(`${data.name || 'Participant'} already marked as attended`);
      }
      
      return data;
    } catch (error) {
      console.error('Error processing scan:', error);
      setData(null);
      
      // User-friendly message for JSON parse errors
      if (error instanceof SyntaxError) {
        toast.error('Invalid server response. Please check server logs.', {
          duration: 5000,
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.', {
          duration: 5000,
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Mark attendance with in/out status
  const handleMarkAttendance = useCallback(async () => {
    if (!user || qrResult === 'None') return;
    
    setIsLoading(true);
    const istTimestamp = getISTTimestamp();
    
    try {
      const response = await fetch('/api/markAttendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          qrResult, 
          qrResultTimestamp: istTimestamp, 
          userName: user.name,
          attendanceType: attendanceType,
        }),
      });
      
      // First check if response is OK
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      
      toast.success(`${attendanceType === 'in' ? 'Entry' : 'Exit'} recorded at ${istTimestamp}!`);
      
      // Automatic reset for next scan
      setData(null);
      setQrResult('None');
      setQrResultTimestamp('');
      
      // Refresh the lists if we're on the appropriate tab
      if (activeTab === 'attendedList') {
        fetchAttendedParticipants();
      } else if (activeTab === 'outsideList') {
        fetchOutsideParticipants();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [qrResult, user, attendanceType, activeTab, fetchAttendedParticipants, fetchOutsideParticipants]);
  
  // Reset function for all states
  const handleReset = useCallback(() => {
    setData(null);
    setQrResult('None');
    setQrResultTimestamp('');
    setIsDialogOpen(false);
    toast.info("Scanner reset and ready for next participant");
  }, []);
  
  // Reset all data
  const resetAll = useCallback(() => {
    handleReset();
    setAttendanceType('in');
    toast.info("All data reset");
  }, [handleReset]);

  // Load attended participants when switching to the appropriate tab
  useEffect(() => {
    // Only fetch on initial tab switch if we haven't tried before
    if (activeTab === 'attendedList' && !hasFetchedAttendees) {
      fetchAttendedParticipants();
    } else if (activeTab === 'outsideList') {
      fetchOutsideParticipants();
    }
  }, [activeTab, fetchAttendedParticipants, fetchOutsideParticipants, hasFetchedAttendees]);

  return (
    <section className="text-foreground max-w-full">
      <div className="text-foreground px-1 sm:px-2 md:px-4">
        <Card className="w-auto bg-card text-card-foreground overflow-hidden">
          <CardHeader className="px-2 py-3 sm:px-4 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
              <div className="w-full sm:w-auto">
                <CardTitle>Attendance Tracking</CardTitle>
                <CardDescription>Track entries and exits</CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={resetAll} size="sm" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button onClick={() => setIsDialogOpen(true)} size="sm" className="w-full">
                      Scan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background px-3 sm:px-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Scan QR Code</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Position the QR code within the scanner area
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div id="qr-scanner-container" className="w-full">
                      <QRScanner onScan={handleScan} />
                    </div>

                    <AlertDialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Close Scanner
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mx-3 sm:mx-4">
              <TabsTrigger value="singleScan">Entry/Exit</TabsTrigger>
              <TabsTrigger value="attendedList">Attendance List</TabsTrigger>
              <TabsTrigger value="outsideList">Outside List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="singleScan">
              <CardContent className="px-3 sm:px-6">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-28 font-medium text-foreground">Id:</span> 
                        <span className="text-muted-foreground">{qrResult}</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-medium text-foreground">Name:</span> 
                        <span className="text-muted-foreground">{data?.name || 'N/A'}</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-medium text-foreground">Email:</span> 
                        <span className="text-muted-foreground">{data?.email || 'N/A'}</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-medium text-foreground">Time:</span> 
                        <span className="text-muted-foreground">{qrResultTimestamp}</span>
                      </div>
                      {data?.attend && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-200">
                          <b>Note:</b> Attendance already marked
                        </div>
                      )}
                    </div>

                    <div className="border p-4 rounded-md space-y-3">
                      <h3 className="font-medium">Record Entry/Exit</h3>
                      <RadioGroup 
                        value={attendanceType} 
                        onValueChange={(value) => setAttendanceType(value as 'in' | 'out')}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="in" id="in" />
                          <Label htmlFor="in" className="flex items-center">
                            <LogIn className="mr-1 h-4 w-4 text-green-500" /> Entry
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="out" id="out" />
                          <Label htmlFor="out" className="flex items-center">
                            <LogOut className="mr-1 h-4 w-4 text-red-500" /> Exit
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-3 sm:px-6 pb-4">
                <Button
                  className="w-full"
                  onClick={handleMarkAttendance}
                  disabled={isLoading || qrResult === 'None'}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <Check className="mr-2" /> 
                      {attendanceType === 'in' ? 'Record Entry' : 'Record Exit'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
            
            <TabsContent value="attendedList">
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h2 className="text-lg font-semibold">Attended Participants</h2>
                    <Button 
                      onClick={fetchAttendedParticipants}
                      disabled={loadingAttendees}
                      variant={attendedParticipants.length > 0 ? "outline" : "default"}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {loadingAttendees ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Attended List
                        </>
                      )}
                    </Button>
                  </div>

                  {attendedParticipants.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableCaption>List of all participants who have attended</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact no.</TableHead>
                            <TableHead>Entry Time</TableHead>
                            <TableHead>Exit Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Marked By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendedParticipants.map((participant) => (
                            <TableRow key={participant.id}>
                              <TableCell className="font-medium">{participant.name}</TableCell>
                              <TableCell>{participant.email}</TableCell>
                              <TableCell>
                                {participant.inTimestamp || 'Not recorded'}
                              </TableCell>
                              <TableCell>
                                {participant.outTimestamp || 'Not recorded'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={participant.isInside ? "success" : "secondary"}>
                                  {participant.isInside ? "Inside" : "Outside"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {participant.markedBy && Array.isArray(participant.markedBy) && participant.markedBy.length > 0
                                  ? participant.markedBy.join(', ')
                                  : 'Unknown'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center space-y-4">
                        <UserX className="h-12 w-12 text-gray-400" />
                        <div>
                          <h3 className="text-lg font-medium">No participants found</h3>
                          <p className="text-sm text-gray-500">
                            {hasFetchedAttendees 
                              ? "No attended participants found yet. Mark some attendances first."
                              : "Click the button above to check attended participants."}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleReset}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Reset Scanner
                          </Button>
                          <Button variant="outline" onClick={fetchAttendedParticipants}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <PaginationControls 
                  currentPage={attendedPage}
                  setPage={setAttendedPage}
                  totalItems={attendedParticipants.length}
                />
              </CardContent>
            </TabsContent>
            
            <TabsContent value="outsideList">
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-lg font-medium">Participants Outside</h3>
                      {outsideParticipants.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {outsideParticipants.length} people outside
                        </span>
                      )}
                    </div>
                    <Button 
                      onClick={fetchOutsideParticipants} 
                      disabled={loadingOutside}
                      className="w-full sm:w-auto"
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {loadingOutside ? 'Loading...' : 'Refresh Outside List'}
                    </Button>
                  </div>
                  
                  {loadingOutside ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : outsideParticipants.length > 0 ? (
                    <div className="border rounded-md overflow-hidden overflow-x-auto">
                      <Table>
                        <TableCaption>List of participants currently outside</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Reg No.</TableHead>
                            <TableHead>Last Entry</TableHead>
                            <TableHead>Exit Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outsideParticipants.map((participant) => (
                            <TableRow key={participant.id}>
                              <TableCell className="font-medium">{participant.name || 'N/A'}</TableCell>
                              <TableCell>{participant.regno || 'N/A'}</TableCell>
                              <TableCell>
                                {participant.inTimestamp || 'Not recorded'}
                              </TableCell>
                              <TableCell>
                                {participant.outTimestamp || 'Not recorded'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center border rounded-md bg-card/50">
                      <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                        <Users className="h-8 w-8 text-green-500 dark:text-green-300" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">Everyone is inside</h3>
                        <p className="text-sm text-muted-foreground">
                          All attended participants are currently inside the hall
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <PaginationControls 
                  currentPage={outsidePage}
                  setPage={setOutsidePage}
                  totalItems={outsideParticipants.length}
                />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </section>
  );
};

export default ParentComponent;
