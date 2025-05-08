import { Request, Response } from "express";
import { storage } from "../storage";

// Get parent profile
export async function getProfile(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const parent = await storage.getParent(user.id);
    
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    // Return only necessary profile information
    return res.status(200).json({
      parentId: parent.parentId,
      fatherName: parent.fatherName,
      motherName: parent.motherName,
      email: parent.email,
      fatherContact: parent.fatherContact,
      motherContact: parent.motherContact,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get children
export async function getChildren(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const students = await storage.getStudentsByParentId(user.id);
    
    // If there are no students, return an empty array
    if (!students.length) {
      return res.status(200).json([]);
    }
    
    // Transform student data for frontend
    const children = students.map(student => ({
      id: student.id.toString(),
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      studentId: student.studentId,
      attendance: Math.floor(Math.random() * 10) + 90, // Mock data for attendance (90-100%)
      gpa: (Math.floor(Math.random() * 10) + 30) / 10, // Mock data for GPA (3.0-4.0)
    }));
    
    return res.status(200).json(children);
  } catch (error) {
    console.error("Get children error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get notifications
export async function getNotifications(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notifications = await storage.getNotificationsByParentId(user.id);
    
    // If there are no notifications, return an empty array
    if (!notifications.length) {
      return res.status(200).json([]);
    }
    
    // Transform notification data for frontend
    const formattedNotifications = notifications.map(notification => {
      // Format timestamp
      const date = new Date(notification.createdAt);
      const now = new Date();
      let timestamp = '';
      
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        timestamp = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timestamp = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        timestamp = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      }
      
      return {
        id: notification.id.toString(),
        title: notification.title,
        description: notification.description,
        type: notification.type,
        timestamp: timestamp,
        isRead: notification.isRead,
      };
    });
    
    return res.status(200).json(formattedNotifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Mark notification as read
export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const notificationId = parseInt(req.params.id);
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    // Get the notification
    const notification = await storage.getNotification(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Check if notification belongs to user
    if (notification.parentId !== user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Mark as read
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    
    return res.status(200).json({
      id: updatedNotification?.id.toString(),
      isRead: updatedNotification?.isRead,
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
