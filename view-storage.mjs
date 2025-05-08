// Script to view the in-memory storage content
import { storage } from './server/storage.js';

async function viewStorage() {
  try {
    // Get all schools
    console.log('Schools:');
    const schools = await storage.getAllSchools();
    console.log(JSON.stringify(schools, null, 2));

    // Get all parents
    console.log('\nParents:');
    const parents = await storage.getAllParents();
    console.log(JSON.stringify(parents, null, 2));

    // Get all students
    console.log('\nStudents:');
    const students = [];
    for (const parent of parents) {
      const parentStudents = await storage.getStudentsByParentId(parent.id);
      students.push(...parentStudents);
    }
    console.log(JSON.stringify(students, null, 2));

    // Get all notifications
    console.log('\nNotifications:');
    const notifications = [];
    for (const parent of parents) {
      const parentNotifications = await storage.getNotificationsByParentId(parent.id);
      notifications.push(...parentNotifications);
    }
    console.log(JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error viewing storage:', error);
  }
}

viewStorage();