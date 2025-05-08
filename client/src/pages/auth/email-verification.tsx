import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AuthHeader from "@/components/layout/auth-header";
import { resendVerificationEmail } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function EmailVerification() {
  const [location, navigate] = useLocation();
  const [email, setEmail] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    // Extract query parameters
    const params = new URLSearchParams(location.split("?")[1]);
    const emailParam = params.get("email");
    const parentIdParam = params.get("parentId");
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (parentIdParam) {
      setParentId(parentIdParam);
    }
  }, [location]);
  
  const { isPending, mutate } = useMutation({
    mutationFn: (email: string) => resendVerificationEmail(email),
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Verification email has been resent. Please check your inbox.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to resend email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleResendEmail = () => {
    if (email) {
      mutate(email);
    } else {
      toast({
        title: "Error",
        description: "Email address is missing",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AuthHeader showLoginButton />
      
      <main className="flex-grow bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="py-8 text-center">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-neutral-900">Registration Successful!</h2>
                {parentId && (
                  <p className="mt-2 text-sm text-neutral-600">
                    Your Parent ID is: <span className="font-medium text-neutral-900">{parentId}</span>
                  </p>
                )}
                {email && (
                  <p className="mt-4 text-sm text-neutral-600">
                    We've sent a verification email to <span className="font-medium text-neutral-900">{email}</span>
                  </p>
                )}
                <p className="mt-2 text-sm text-neutral-600">
                  Please check your inbox and click on the verification link to activate your account.
                </p>
              </div>
              
              <div className="mt-6 space-y-4">
                <p className="text-sm text-neutral-500">Didn't receive the email?</p>
                <Button
                  onClick={handleResendEmail}
                  disabled={isPending}
                >
                  {isPending ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
              
              <div className="mt-6 text-sm">
                <Button 
                  variant="link" 
                  onClick={() => navigate("/auth/login")}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Proceed to login →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
