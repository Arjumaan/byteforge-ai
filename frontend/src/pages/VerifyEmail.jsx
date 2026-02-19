import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiArrowLeft, FiRefreshCw, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import api from '../services/api';

const VerifyEmail = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { setOAuthTokens } = useAuth();

    // Get email from location state
    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newCode = [...code];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newCode[index + i] = digit;
                }
            });
            setCode(newCode);
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
        } else if (/^\d*$/.test(value)) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Auto-focus next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join('');

        if (verificationCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/verify-email/', {
                email,
                code: verificationCode
            });

            if (response.data.success) {
                toast.success('Email verified successfully!');

                // Set tokens and redirect to chat
                if (response.data.tokens) {
                    setOAuthTokens(response.data.tokens);
                }

                navigate('/chat', { replace: true });
            } else {
                toast.error(response.data.message || 'Verification failed');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Verification failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setResending(true);
        try {
            const response = await api.post('/auth/resend-verification/', { email });

            if (response.data.success) {
                toast.success('New verification code sent!');
                setCountdown(60); // 60 second cooldown
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                toast.error(response.data.message || 'Failed to resend code');
            }
        } catch (error) {
            toast.error('Failed to resend verification code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-sm relative z-10">
                {/* Back Link */}
                <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to signup
                </Link>

                <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <FiMail className="w-6 h-6 text-primary-400" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-1.5">Verify Your Email</h1>
                        <p className="text-gray-400 text-sm">
                            We sent a 6-digit code to<br />
                            <span className="text-white font-medium">{email}</span>
                        </p>
                    </div>

                    {/* Code Input */}
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-center gap-2.5 mb-6">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-10 h-12 text-center text-xl font-bold bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                />
                            ))}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || code.join('').length !== 6}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl hover:from-primary-500 hover:to-primary-400 focus:ring-4 focus:ring-primary-500/20 shadow-lg shadow-primary-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <FiCheck className="w-4 h-4" />
                                    Verify Email
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-5 text-center">
                        <p className="text-gray-500 text-xs mb-1.5">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={resending || countdown > 0}
                            className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300 font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiRefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 p-3 bg-gray-900/30 rounded-xl border border-gray-700/50">
                        <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                            <strong className="text-gray-400">Tip:</strong> Check your spam folder if you don't see the email.
                            The code expires in 15 minutes.
                        </p>
                    </div>
                </div>

                {/* Logo */}
                <div className="mt-6 flex items-center justify-center gap-2">
                    <img src={logo} alt="ByteForge AI" className="w-5 h-5 object-contain" />
                    <span className="text-gray-500 text-xs">ByteForge AI</span>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
