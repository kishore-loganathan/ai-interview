import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Sparkles, text: 'AI-powered mock interviews' },
        { icon: CheckCircle2, text: 'Real-time feedback & scoring' },
        { icon: CheckCircle2, text: 'Track your progress' },
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
                <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                            <Sparkles className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-white text-3xl font-bold tracking-tight">InterviewAI</div>
                            <div className="text-indigo-300/70 text-sm font-medium">Master Your Skills</div>
                        </div>
                    </div>
                    <h1 className="text-white text-6xl font-bold tracking-tighter leading-[1.1] mb-6">
                        Master your next interview.
                    </h1>
                    <p className="text-lg text-slate-300 mb-12">
                        AI-powered mock interviews that help you get the offer. Practice with real-world scenarios and get instant feedback.
                    </p>
                    
                    <div className="space-y-4 mb-12">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <feature.icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-slate-300">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-slate-700/50">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            Trusted by 10,000+ candidates worldwide
                        </div>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <div className="text-white text-2xl font-bold">InterviewAI</div>
                    </div>

                    <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
                        <CardHeader className="space-y-2 pb-8">
                            <CardTitle className="text-3xl text-white tracking-tight">Welcome back</CardTitle>
                            <CardDescription className="text-slate-400 text-[15px]">
                                Sign in to continue your interview practice journey
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                             <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-slate-300 font-medium">Email address</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 focus:bg-slate-800 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                                        <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 pr-12 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 focus:bg-slate-800 transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-base mt-4 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/30"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-slate-400">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/signup"
                                        className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                                    >
                                        Create account
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-slate-500 mt-8">
                        By signing in you agree to our{' '}
                        <Link to="#" className="text-slate-400 hover:text-slate-300 transition-colors">Terms</Link>
                        {' '}and{' '}
                        <Link to="#" className="text-slate-400 hover:text-slate-300 transition-colors">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
