/**
 * Utility function to send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  parentId: string
): Promise<void> {
  // In a real application, you would use a library like nodemailer
  // to send actual emails to users. For this example, we're just 
  // logging the information.
  
  console.log(`
    ====== Verification Email ======
    To: ${email}
    Subject: Verify Your School Management System Account
    
    Dear Parent,
    
    Thank you for registering with the School Management System.
    Your Parent ID is: ${parentId}
    
    Please click the link below to verify your email address:
    http://localhost:5000/api/auth/verify-email?token=${verificationToken}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Regards,
    School Management System Team
    ===============================
  `);
  
  // In a real implementation, you would return a promise from the email sending library
  return Promise.resolve();
}

/**
 * Utility function to send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  console.log(`
    ====== Password Reset Email ======
    To: ${email}
    Subject: Reset Your School Management System Password
    
    Dear Parent,
    
    A password reset was requested for your account.
    
    Please click the link below to reset your password:
    http://localhost:5000/auth/reset-password?token=${resetToken}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email.
    
    Regards,
    School Management System Team
    ===============================
  `);
  
  return Promise.resolve();
}
