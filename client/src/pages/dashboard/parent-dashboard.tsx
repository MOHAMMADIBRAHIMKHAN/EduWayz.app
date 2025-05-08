import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/layout/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  MessageSquare,
  Users,
  Clock,
  Calendar,
  CheckCircle
} from "lucide-react";

export default function ParentDashboard() {
  const [, navigate] = useLocation();
  
  // Check if user is authenticated
  const { data: user, isLoading: userLoading, error: userError } = useQuery<{
    id: string;
    parentId: string;
    email: string;
    isVerified: boolean;
  }>({
    queryKey: ["/api/auth/user"],
  });
  
  // Get parent profile data
  const { data: profile, isLoading: profileLoading } = useQuery<{
    parentId: string;
    fatherName: string;
    motherName: string;
    email: string;
    fatherContact: string;
    motherContact: string;
  }>({
    queryKey: ["/api/parent/profile"],
    enabled: !!user,
  });
  
  // Get children data
  const { data: children, isLoading: childrenLoading } = useQuery<{
    id: string;
    name: string;
    grade: string;
    studentId: string;
    attendance: number;
    gpa: number;
  }[]>({
    queryKey: ["/api/parent/children"],
    enabled: !!user,
  });
  
  // Get notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery<{
    id: string;
    title: string;
    description: string;
    type: string;
    timestamp: string;
  }[]>({
    queryKey: ["/api/parent/notifications"],
    enabled: !!user,
  });
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (userError) {
      navigate("/auth/login");
    }
  }, [userError, navigate]);
  
  if (userLoading || profileLoading || childrenLoading || notificationsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-grow bg-neutral-50 flex items-center justify-center">
          <p>Loading dashboard...</p>
        </main>
      </div>
    );
  }
  
  // Mock data since we can't fetch real data without a backend implementation
  const dashboardData = {
    childrenCount: children?.length || 2,
    upcomingEvents: 3,
    messages: 5
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      
      <main className="flex-grow bg-neutral-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">Parent Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Welcome back, {profile?.fatherName?.split(' ')[0] || 'Parent'}
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Parent Information</CardTitle>
              <Button variant="link" className="text-sm text-primary-600 p-0">
                Edit Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Parent ID</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.parentId || user?.parentId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Father's Name</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.fatherName || 'Ahmad Al-Farsi'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Mother's Name</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.motherName || 'Fatima Al-Farsi'}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Email</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.email || user?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Father's Contact</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.fatherContact || '+966 50 123 4567'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-neutral-500">Mother's Contact</dt>
                      <dd className="mt-1 text-sm text-neutral-900">{profile?.motherContact || '+966 55 765 4321'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-primary-50 text-primary-700">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">Children</h3>
                    <p className="text-3xl font-semibold text-neutral-900">{dashboardData.childrenCount}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500 px-0">
                    View details →
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-accent-50 text-accent-700">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">Upcoming Events</h3>
                    <p className="text-3xl font-semibold text-neutral-900">{dashboardData.upcomingEvents}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500 px-0">
                    View calendar →
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-secondary-50 text-secondary-700">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">Messages</h3>
                    <p className="text-3xl font-semibold text-neutral-900">{dashboardData.messages}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500 px-0">
                    View inbox →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-neutral-200">
                <CardTitle className="text-lg font-medium">Student Overview</CardTitle>
                <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500 p-0">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-neutral-200">
                  {children?.length ? (
                    children.map((child) => (
                      <li key={child.id}>
                        <div className="px-6 py-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                {child.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-neutral-900">{child.name}</p>
                                <p className="text-sm text-neutral-500">Grade {child.grade} • ID: {child.studentId}</p>
                              </div>
                            </div>
                            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-500 p-0">
                              Details
                            </Button>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Attendance</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">{child.attendance}%</dd>
                            </div>
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Current GPA</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">{child.gpa}/4.0</dd>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <div className="px-6 py-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                SA
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-neutral-900">Sara Ahmad Al-Farsi</p>
                                <p className="text-sm text-neutral-500">Grade 8 • ID: STU-250076</p>
                              </div>
                            </div>
                            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-500 p-0">
                              Details
                            </Button>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Attendance</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">98%</dd>
                            </div>
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Current GPA</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">3.8/4.0</dd>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="px-6 py-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                                YA
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-neutral-900">Yusuf Ahmad Al-Farsi</p>
                                <p className="text-sm text-neutral-500">Grade 5 • ID: STU-250145</p>
                              </div>
                            </div>
                            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-500 p-0">
                              Details
                            </Button>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Attendance</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">92%</dd>
                            </div>
                            <div className="bg-neutral-50 px-4 py-2 rounded-md">
                              <dt className="text-xs font-medium text-neutral-500">Current GPA</dt>
                              <dd className="mt-1 text-sm font-semibold text-neutral-900">3.5/4.0</dd>
                            </div>
                          </div>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-neutral-200">
                <CardTitle className="text-lg font-medium">Recent Notifications</CardTitle>
                <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500 p-0">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-neutral-200">
                  {notifications?.length ? (
                    notifications.map((notification) => (
                      <li key={notification.id}>
                        <div className="px-6 py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
                                {notification.type === 'event' ? (
                                  <CalendarIcon className="h-5 w-5" />
                                ) : notification.type === 'message' ? (
                                  <MessageSquare className="h-5 w-5" />
                                ) : (
                                  <CheckCircle className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                              <p className="text-sm text-neutral-500">{notification.description}</p>
                              <p className="mt-1 text-xs text-neutral-400">{notification.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <div className="px-6 py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
                                <CalendarIcon className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">Parent-Teacher Meeting Scheduled</p>
                              <p className="text-sm text-neutral-500">For Sara Ahmad Al-Farsi on May 15, 2023 at 4:00 PM</p>
                              <p className="mt-1 text-xs text-neutral-400">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="px-6 py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700">
                                <MessageSquare className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">New Message from School Principal</p>
                              <p className="text-sm text-neutral-500">Regarding upcoming changes to school policies</p>
                              <p className="mt-1 text-xs text-neutral-400">1 day ago</p>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="px-6 py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">Term 2 Fees Payment Confirmed</p>
                              <p className="text-sm text-neutral-500">Payment of SAR 5,000 has been processed successfully</p>
                              <p className="mt-1 text-xs text-neutral-400">3 days ago</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
