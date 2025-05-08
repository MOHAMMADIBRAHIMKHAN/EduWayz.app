// Add this to the top of the file
import { storage } from './server/storage.js';

// Get all schools
console.log('Schools:');
const schools = await storage.getAllSchools();
console.log(schools);

// Get all parents
console.log('\nParents:');
const parents = await storage.getAllParents();
console.log(parents);

// Get all students
console.log('\nStudents:');
const students = [];
for (const parent of parents) {
  const parentStudents = await storage.getStudentsByParentId(parent.id);
  students.push(...parentStudents);
}
console.log(students);

// Get all notifications
console.log('\nNotifications:');
const notifications = [];
for (const parent of parents) {
  const parentNotifications = await storage.getNotificationsByParentId(parent.id);
  notifications.push(...parentNotifications);
}
console.log(notifications);