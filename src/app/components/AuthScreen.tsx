import { useState } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Film, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import duoReelLogo from 'figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png';
import { supabase } from '../context/AuthContext';

interface AuthScreenProps {
  projectId: string;
  publicAnonKey: string;
  onAuthSuccess: (accessToken: string) => void;
  onBack?: () => void;
  defaultTab?: 'signin' | 'signup';
  onGoogleSignIn?: () => Promise<void>;
}

export function AuthScreen({ projectId, publicAnonKey, onAuthSuccess, onBack, defaultTab = 'signin', onGoogleSignIn }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [signinData, setSigninData] = useState({ email: '', password: '' });

  const baseUrl = API_BASE_URL;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.name || !signupData.email || !signupData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      toast.success('Account created! Signing you in...');
      
      // Automatically sign in the user after successful signup
      const signinResponse = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password
        })
      });

      const signinData = await signinResponse.json();

      if (!signinResponse.ok) {
        throw new Error(signinData.error || 'Failed to sign in after signup');
      }

      toast.success('Welcome!');
      // Persist session so it survives page refreshes
      if (signinData.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: signinData.session.access_token,
          refresh_token: signinData.session.refresh_token,
        });
      }
      onAuthSuccess(signinData.session.access_token);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signinData.email || !signinData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(signinData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      toast.success('Welcome back!');
      // Persist session so it survives page refreshes
      if (data.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      onAuthSuccess(data.session.access_token);
    } catch (error: any) {
      console.error('Signin error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Google SVG icon following Google branding guidelines
  function GoogleIcon({ className }: { className?: string }) {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }

  function GoogleSignInButton() {
    return (
      <>
        <Button
          type="button"
          onClick={async () => {
            if (!onGoogleSignIn) return;
            setGoogleLoading(true);
            try {
              await onGoogleSignIn();
              // Page will redirect to Google — loading stays true
            } catch {
              setGoogleLoading(false);
            }
          }}
          disabled={loading || googleLoading}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium flex items-center justify-center gap-2 h-10"
        >
          {googleLoading ? (
            <>
              <Loader2 className="size-5 flex-shrink-0 animate-spin" />
              Continue with Google
            </>
          ) : (
            <>
              <GoogleIcon className="size-5 flex-shrink-0" />
              Continue with Google
            </>
          )}
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-3 text-slate-400">or continue with email</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <img src={duoReelLogo} alt="DuoReel" className="h-24 w-auto mx-auto mb-4" />
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-800 border border-slate-700">
            <TabsTrigger value="signin" className="text-slate-200 font-semibold data-[state=active]:text-slate-900 hover:text-white transition-all">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-slate-200 font-semibold data-[state=active]:text-slate-900 hover:text-white transition-all">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Welcome Back</CardTitle>
                <CardDescription className="text-slate-400">
                  Sign in to continue browsing movies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {onGoogleSignIn && <GoogleSignInButton />}
                <form onSubmit={handleSignin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signinData.email}
                      onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loading || googleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signinData.password}
                      onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loading || googleLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Create Account</CardTitle>
                <CardDescription className="text-slate-400">
                  Start discovering movies together
                </CardDescription>
              </CardHeader>
              <CardContent>
                {onGoogleSignIn && <GoogleSignInButton />}
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white">Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loading || googleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loading || googleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white"
                      disabled={loading || googleLoading}
                    />
                    <p className="text-xs text-slate-500">At least 6 characters</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}