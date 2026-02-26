
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../services/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Mail, Lock, User as UserIcon, ArrowRight, X, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check for Confirmation URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('confirmed') === 'true') {
      setSuccessMsg("Account verificato con successo! Ora puoi accedere.");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError("Le password non corrispondono.");
          setIsLoading(false);
          return;
        }
        await register(username, email, password);
        setSuccessMsg("Registrazione avvenuta con successo, controlla la tua email per confermare l'attivazione del tuo account.");
        setIsLoading(false);
        return;
      }
      navigate('/account');
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMessage = "Autenticazione fallita. Controlla i tuoi dati.";
      const rawError = err.message || "";

      if (rawError.includes("Email is already taken") || rawError.includes("Email or Username are already taken")) {
        errorMessage = "Questa email o questo nome utente sono già stati utilizzati.";
      } else if (rawError.includes("Username is already taken")) {
        errorMessage = "Questo nome utente è già in uso.";
      } else if (rawError.includes("Invalid identifier or password")) {
        errorMessage = "Email o password non validi.";
      } else if (rawError.includes("password must be at least")) {
        errorMessage = "La password deve essere di almeno 6 caratteri.";
      } else if (rawError.includes("Error sending confirmation email")) {
        errorMessage = "Registrazione completata, ma errore nell'invio dell'email di conferma. Contatta l'amministratore.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setSuccessMsg("Se l'indirizzo esiste, riceverai le istruzioni via email.");
      setIsForgotOpen(false);
    } catch (err) {
      setSuccessMsg("Se l'indirizzo esiste, riceverai le istruzioni via email.");
      setIsForgotOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-stone-50 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-nature-200 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-birillo-yellow rounded-full filter blur-3xl opacity-20"></div>

        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 relative z-10 animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-br from-nature-50 to-emerald-50/50 p-8 text-center border-b border-stone-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-stone-100 overflow-hidden">
              <img src="/logo.png" alt="Birillo" className="w-full h-full object-cover" />
            </div>
            <h2 className="font-display text-2xl font-bold text-stone-900">Benvenuto in Birillo</h2>
            <p className="text-stone-500 text-sm mt-1">Accedi o crea il tuo account</p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mx-6 mt-5 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
              <X size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
          {successMsg && activeTab !== 'register' && (
            <div className="mx-6 mt-5 p-3 bg-green-50 text-green-700 text-sm rounded-xl flex items-center gap-2 border border-green-100">
              <CheckCircle size={16} className="flex-shrink-0" /> {successMsg}
            </div>
          )}

          {/* Success State for Registration */}
          {successMsg && activeTab === 'register' ? (
            <div className="p-8 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Controlla la tua Email</h3>
              <p className="text-stone-600 mb-4">
                Abbiamo inviato un link di conferma a <strong>{email}</strong>.<br />
                Clicca sul link per attivare il tuo account e accedere.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-left">
                <p className="text-amber-800 text-xs font-medium">
                  Non trovi l'email? Controlla la cartella <strong>Spam</strong> o <strong>Posta indesiderata</strong>. L'email potrebbe impiegare qualche minuto ad arrivare.
                </p>
              </div>
              <Button
                onClick={() => {
                  setSuccessMsg('');
                  setActiveTab('login');
                }}
                className="w-full"
              >
                Torna al Login
              </Button>
            </div>
          ) : (
            <>
              {/* Tabs — Pill style */}
              <div className="mx-6 mt-5">
                <div className="bg-stone-100 rounded-xl p-1 flex">
                  <button
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                      activeTab === 'login'
                        ? 'bg-white shadow-sm text-nature-600'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                    onClick={() => { setActiveTab('login'); setError(''); }}
                  >
                    Accedi
                  </button>
                  <button
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                      activeTab === 'register'
                        ? 'bg-white shadow-sm text-nature-600'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                    onClick={() => { setActiveTab('register'); setError(''); }}
                  >
                    Registrati
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-4">
                {activeTab === 'register' && (
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Nome Utente"
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={20} />
                  <input
                    type="email"
                    placeholder="Indirizzo Email"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
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

                {activeTab === 'register' && (
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
                )}

                {activeTab === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-stone-500 hover:text-nature-600 transition-colors font-medium"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                )}

                <Button
                  className="w-full py-3.5 shadow-lg shadow-nature-200"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Elaborazione...</span>
                  ) : (
                    <>
                      {activeTab === 'login' ? 'Accedi Ora' : 'Crea Account'} <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Forgot Password Modal */}
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-100 p-7 relative">
              <button
                onClick={() => setIsForgotOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-nature-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={26} className="text-nature-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-800">Recupero Password</h3>
                <p className="text-stone-500 text-sm mt-1">Ti invieremo un link per resettare la password.</p>
              </div>

              <form onSubmit={handleForgotPass} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                  <input
                    type="email"
                    placeholder="Il tuo indirizzo email"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Invio...</span>
                  ) : (
                    "Invia Link di Reset"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
