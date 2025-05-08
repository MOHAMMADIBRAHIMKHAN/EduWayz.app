// Script to add test data to the storage
import { storage } from './server/storage';

async function addTestData() {
  try {
    console.log('Adding test data to the storage...');
    
    // Add a school
    const schoolData = {
      schoolName: "Al-Riyadh International School",
      establishmentYear: 2005,
      email: "info@riyadh-school.edu.sa",
      phone: "+966 11 123 4567",
      website: "https://riyadh-school.edu.sa",
      
      addressLine1: "King Fahd Road",
      addressLine2: "Al Olaya District",
      city: "Riyadh",
      province: "Riyadh",
      postalCode: "12345",
      country: "Saudi Arabia",
      
      adminName: "Ahmed Al-Saud",
      adminPosition: "Principal",
      adminEmail: "principal@riyadh-school.edu.sa",
      adminPhone: "+966 11 123 4568",
      
      schoolType: "international",
      educationLevel: "k12",
      language: "dual",
      capacity: 1500
    };
    
    const school = await storage.createSchool(schoolData);
    console.log('School created:', school.schoolId);
    
    // Add a parent
    const parentData = {
      email: "parent@example.com",
      password: "Password123",
      fatherName: "Mohammed Al-Abdullah",
      fatherOccupation: "Engineer",
      fatherContact: "+966 50 123 4567",
      motherName: "Fatima Al-Abdullah",
      motherOccupation: "Teacher",
      motherContact: "+966 50 123 4568",
      currentAddressLine1: "123 Tahlia Street",
      currentAddressLine2: "Apartment 4B",
      currentCity: "Riyadh",
      currentProvince: "Riyadh",
      currentPostalCode: "12345",
      currentCountry: "Saudi Arabia",
      permanentAddressLine1: "123 Tahlia Street",
      permanentAddressLine2: "Apartment 4B",
      permanentCity: "Riyadh",
      permanentProvince: "Riyadh",
      permanentPostalCode: "12345",
      permanentCountry: "Saudi Arabia",
      emergencyName: "Abdullah Al-Mohammed",
      emergencyRelation: "Uncle",
      emergencyContact: "+966 50 123 4569"
    };
    
    const parent = await storage.createParent(parentData);
    console.log('Parent created:', parent.parentId);
    
    // Verify the parent
    const verifiedParent = await storage.verifyParent(parent.id);
    console.log('Parent verified:', verifiedParent?.isVerified);
    
    // Add a student
    const studentData = {
      parentId: parent.id,
      schoolId: school.id,
      firstName: "Ahmad",
      lastName: "Al-Abdullah",
      dateOfBirth: new Date(2010, 5, 15),
      gender: "male",
      grade: "6",
      section: "A",
      enrollmentDate: new Date(2022, 8, 1),
      status: "active"
    };
    
    const student = await storage.createStudent(studentData);
    console.log('Student created:', student.studentId);
    
    // Add another student
    const studentData2 = {
      parentId: parent.id,
      schoolId: school.id,
      firstName: "Sara",
      lastName: "Al-Abdullah",
      dateOfBirth: new Date(2012, 8, 22),
      gender: "female",
      grade: "4",
      section: "B",
      enrollmentDate: new Date(2022, 8, 1),
      status: "active"
    };
    
    const student2 = await storage.createStudent(studentData2);
    console.log('Student created:', student2.studentId);
    
    // Add a notification
    const notificationData = {
      parentId: parent.id,
      schoolId: school.id,
      title: "Parent-Teacher Meeting",
      description: "Please attend the upcoming parent-teacher meeting on October 15th at 5 PM.",
      type: "event"
    };
    
    const notification = await storage.createNotification(notificationData);
    console.log('Notification created:', notification.id);
    
    console.log('Test data has been added successfully.');
    
    // Now view all data
    console.log('\n--- Viewing all data ---');
    
    // Get all schools
    console.log('\nSchools:');
    const schools = await storage.getAllSchools();
    console.log(JSON.stringify(schools, null, 2));

    // Get all parents
    console.log('\nParents:');
    const parents = await storage.getAllParents();
    console.log(JSON.stringify(parents, null, 2));

    // Get all students
    console.log('\nStudents:');
    const students = await storage.getStudentsByParentId(parent.id);
    console.log(JSON.stringify(students, null, 2));

    // Get all notifications
    console.log('\nNotifications:');
    const notifications = await storage.getNotificationsByParentId(parent.id);
    console.log(JSON.stringify(notifications, null, 2));
    
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData();