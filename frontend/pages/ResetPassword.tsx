import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { STRAPI_API_URL } from '../constants';

export const ResetPassword: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [code, setCode] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const codeParam = params.get('code');
        if (codeParam) {
            setCode(codeParam);
            setStatus('idle');
            setMessage('');
        } else {
            setStatus('error');
            setMessage('Codice di reset mancante o non valido.');
        }
    }, [location]);

    const isSubmitting = React.useRef(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting.current) return;

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Le password non corrispondono.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('La password deve essere di almeno 6 caratteri.');
            return;
        }

        isSubmitting.current = true;
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch(`${STRAPI_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    password,
                    passwordConfirmation: confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('La tua password è stata aggiornata con successo. Ora puoi accedere con le nuove credenziali.');
            } else {
                setStatus('error');
                setMessage(data.error?.message || 'Errore durante il reset della password. Riprova.');
                isSubmitting.current = false;
            }
        } catch (error) {
            setStatus('error');
            setMessage('Errore di connessione. Riprova più tardi.');
            isSubmitting.current = false;
        } finally {
            setIsLoading(false);
        }
    };

    // Shared card wrapper
    const CardWrapper: React.FC<{ children: React.ReactNode; headerTitle: string; headerSub: string; headerVariant?: 'green' | 'red' }> = ({ children, headerTitle, headerSub, headerVariant = 'green' }) => (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-stone-50 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-nature-200 rounded-full filter blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-birillo-yellow rounded-full filter blur-3xl opacity-20"></div>

                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 relative z-10 animate-fade-in">
                    {/* Header */}
                    <div className={`p-8 text-center border-b border-stone-100 ${
                        headerVariant === 'red'
                            ? 'bg-gradient-to-br from-red-50 to-orange-50/50'
                            : 'bg-gradient-to-br from-nature-50 to-emerald-50/50'
                    }`}>
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-stone-100 overflow-hidden">
                            <img src="/logo.png" alt="Birillo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-stone-900">{headerTitle}</h2>
                        <p className="text-stone-500 text-sm mt-1">{headerSub}</p>
                    </div>

                    {/* Body */}
                    {children}
                </div>
            </div>
        </Layout>
    );

    // Error state — invalid/missing code
    if (!code && status === 'error') {
        return (
            <CardWrapper headerTitle="Link non valido" headerSub="Il link di reset è scaduto o non valido" headerVariant="red">
                <div className="p-6 pt-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border-2 border-red-200">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-stone-600 text-sm mb-6 max-w-xs">{message}</p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Torna al Login
                        </Button>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <CardWrapper headerTitle="Password Aggiornata!" headerSub="La tua password è stata cambiata">
                <div className="p-6 pt-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-nature-50 rounded-full flex items-center justify-center mb-4 border-2 border-nature-200">
                            <CheckCircle className="w-8 h-8 text-nature-600" />
                        </div>
                        <p className="text-stone-600 text-sm mb-6 max-w-xs">{message}</p>
                        <Button onClick={() => navigate('/login')} className="w-full">
                            Vai al Login
                        </Button>
                    </div>
                </div>
            </CardWrapper>
        );
    }

    // Form state
    return (
        <CardWrapper headerTitle="Nuova Password" headerSub="Scegli una password sicura per il tuo account">
            {/* Error message */}
            {status === 'error' && (
                <div className="mx-6 mt-5 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
                    <XCircle size={16} className="flex-shrink-0" /> {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-4">
                <div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Nuova Password"
                            required
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5 ml-1">Almeno 6 caratteri</p>
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={20} />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Conferma Password"
                        required
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <Button
                    className="w-full py-3.5 shadow-lg shadow-nature-200"
                    disabled={isLoading}
                    type="submit"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Aggiornamento...</span>
                    ) : (
                        "Imposta Password"
                    )}
                </Button>
            </form>
        </CardWrapper>
    );
};
