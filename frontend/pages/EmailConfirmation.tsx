import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { STRAPI_API_URL } from '../constants';

export const EmailConfirmation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifica in corso...');

    const hasFetched = React.useRef(false);

    useEffect(() => {
        const confirmEmail = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;

            const params = new URLSearchParams(location.search);
            const confirmationCode = params.get('confirmation');

            if (!confirmationCode) {
                setStatus('error');
                setMessage('Codice di conferma mancante.');
                return;
            }

            try {
                const response = await fetch(`${STRAPI_API_URL}/auth/email-confirmation?confirmation=${confirmationCode}`);

                if (response.ok) {
                    setStatus('success');
                    setMessage('Il tuo account è stato attivato con successo. Ora puoi accedere e scoprire tutti i nostri prodotti.');
                } else {
                    let errorMsg = 'Link di conferma non valido o scaduto.';
                    try {
                        const data = await response.json();
                        if (data?.error?.message) {
                            errorMsg = `Errore: ${data.error.message}`;
                        }
                    } catch (e) {
                        console.warn('Non-JSON error response received');
                    }
                    setStatus('error');
                    setMessage(errorMsg);
                }
            } catch (error) {
                console.error('Confirmation network error:', error);
                setStatus('error');
                setMessage('Errore di connessione durante la verifica.');
            }
        };

        confirmEmail();
    }, [location]);

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-stone-50 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-nature-200 rounded-full filter blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-birillo-yellow rounded-full filter blur-3xl opacity-20"></div>

                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 relative z-10 animate-fade-in">
                    {/* Header — always shown */}
                    <div className={`p-8 text-center border-b border-stone-100 ${
                        status === 'error'
                            ? 'bg-gradient-to-br from-red-50 to-orange-50/50'
                            : 'bg-gradient-to-br from-nature-50 to-emerald-50/50'
                    }`}>
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-stone-100 overflow-hidden">
                            <img src="/logo.png" alt="Birillo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-stone-900">
                            {status === 'loading' && 'Verifica Email'}
                            {status === 'success' && 'Account Confermato!'}
                            {status === 'error' && 'Verifica non riuscita'}
                        </h2>
                        <p className="text-stone-500 text-sm mt-1">
                            {status === 'loading' && 'Stiamo verificando il tuo account'}
                            {status === 'success' && 'Benvenuto nella famiglia Birillo'}
                            {status === 'error' && 'Si è verificato un problema'}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 pt-8">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center text-center">
                                <Loader2 className="w-12 h-12 text-nature-600 animate-spin mb-4" />
                                <p className="text-stone-500 text-sm">Attendi qualche istante...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-nature-50 rounded-full flex items-center justify-center mb-4 border-2 border-nature-200">
                                    <CheckCircle className="w-8 h-8 text-nature-600" />
                                </div>
                                <p className="text-stone-600 text-sm mb-6 max-w-xs">{message}</p>
                                <Button onClick={() => navigate('/login')} className="w-full">
                                    Vai al Login
                                </Button>
                                <p className="text-xs text-stone-400 mt-4">
                                    Hai bisogno di aiuto? Scrivici a{' '}
                                    <a href="mailto:birillopetshop@hotmail.it" className="text-nature-600 hover:underline">
                                        birillopetshop@hotmail.it
                                    </a>
                                </p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border-2 border-red-200">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-stone-600 text-sm mb-6 max-w-xs">{message}</p>
                                <Button onClick={() => navigate('/login')} className="w-full">
                                    Torna al Login
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
