
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../services/authContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import {
  User as UserIcon, Package, MapPin, LogOut, Phone, Hash, ChevronRight,
  X, FileText, LayoutDashboard, Shield, Lock, Eye, EyeOff, Mail, Heart,
  ShoppingBag, ArrowRight, CheckCircle, UserCog, Building2,
  Loader2, Clock, CreditCard, Truck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { STRAPI_API_URL } from '../constants';

/* ─── Helper Components ─── */

const QuickActionCard: React.FC<{ icon: any; label: string; desc: string; onClick: () => void; color: string }> = ({ icon: Icon, label, desc, onClick, color }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <p className="font-bold text-stone-800 text-sm">{label}</p>
    <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
  </button>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; icon: any }> = {
    [OrderStatus.COMPLETED]: { bg: 'bg-green-100 text-green-700', icon: CheckCircle },
    [OrderStatus.SHIPPED]: { bg: 'bg-blue-100 text-blue-700', icon: Truck },
    [OrderStatus.PAID]: { bg: 'bg-sky-100 text-sky-700', icon: CreditCard },
    [OrderStatus.PENDING]: { bg: 'bg-yellow-100 text-yellow-700', icon: Clock },
  };
  const c = config[status] || config[OrderStatus.PENDING];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${c.bg}`}>
      <Icon size={12} /> {status}
    </span>
  );
};

/* ─── Tabs Config ─── */
const tabs = [
  { key: 'dashboard' as const, label: 'Panoramica', shortLabel: 'Home', icon: LayoutDashboard },
  { key: 'profile' as const, label: 'Profilo & Indirizzo', shortLabel: 'Profilo', icon: UserIcon },
  { key: 'orders' as const, label: 'Storico Ordini', shortLabel: 'Ordini', icon: Package },
  { key: 'security' as const, label: 'Sicurezza', shortLabel: 'Sicurezza', icon: Shield },
];

/* ─── Main Component ─── */

export const Account: React.FC = () => {
  const { user, logout, updateProfile, isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'orders' | 'security'>('dashboard');

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile
  const [isEditing, setIsEditing] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '', indirizzo: '', note_indirizzo: '', citta: '', cap: '', telefono: ''
  });

  // Security
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Member since
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    : 'N/D';

  /* ─── Effects ─── */

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setFormData({
        nome_completo: user.nome_completo || '',
        indirizzo: user.indirizzo || '',
        note_indirizzo: user.note_indirizzo || '',
        citta: user.citta || '',
        cap: user.cap || '',
        telefono: user.telefono || ''
      });
      fetchOrders();
    }
  }, [user, isAuthenticated, navigate, isLoading]);

  /* ─── API ─── */

  const fetchOrders = async () => {
    if (!user || !token) return;
    setIsLoadingOrders(true);
    try {
      const response = await fetch(`${STRAPI_API_URL}/orders?sort=createdAt:desc`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      const mappedOrders: Order[] = data.data.map((order: any) => ({
        id: order.id,
        date: new Date(order.createdAt).toLocaleDateString('it-IT'),
        total: order.total_paid,
        status: order.stato,
        items: order.cart_snapshot.map((item: any) => ({
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant_name: item.variant,
          image_url: item.image
        }))
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Le password non corrispondono.'); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nuova password deve essere di almeno 6 caratteri.'); return;
    }
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const response = await fetch(`${STRAPI_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
          passwordConfirmation: passwordForm.confirmPassword
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Errore nel cambio password');
      }
      setPasswordSuccess('Password aggiornata con successo!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      let msg = 'Errore nel cambio password.';
      const raw = err.message || '';
      if (raw.includes('Invalid') || raw.includes('password is invalid') || raw.includes('invalid')) {
        msg = 'La password attuale non è corretta.';
      }
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  /* ─── Loading / Guard ─── */

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-nature-600 animate-spin" />
    </div>
  );
  if (!user) return null;

  /* ─── Render ─── */

  return (
    <Layout>
      {/* ═══ HERO HEADER ═══ */}
      <section className="relative bg-gradient-to-br from-nature-50 via-emerald-50/30 to-white pt-10 pb-14 md:pt-14 md:pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-nature-200/20 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-birillo-yellow/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-in">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-nature-600 rounded-full flex items-center justify-center text-white font-display text-2xl md:text-3xl font-bold shadow-lg ring-4 ring-white">
              {(user.nome_completo || user.username).charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
                Ciao, {user.nome_completo || user.username}!
              </h1>
              <p className="text-stone-500 text-sm mt-1">
                {user.email} &middot; Membro dal {memberSince}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TAB BAR (overlapping hero) ═══ */}
      <div className="max-w-6xl mx-auto px-4 -mt-7 relative z-20 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-1.5 sm:p-2 flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap min-h-[44px] ${
                activeTab === tab.key
                  ? 'bg-nature-600 text-white shadow-md shadow-nature-200'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all whitespace-nowrap min-h-[44px]"
          >
            <LogOut size={18} /> Esci
          </button>
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div className="max-w-6xl mx-auto px-4 pb-16">

        {/* ─── DASHBOARD TAB ─── */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in-up">
            {/* Quick Actions */}
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Azioni Rapide</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <QuickActionCard icon={UserCog} label="Modifica Profilo" desc="Aggiorna i tuoi dati" onClick={() => { setActiveTab('profile'); setIsEditing(true); }} color="bg-nature-50 text-nature-600" />
              <QuickActionCard icon={Package} label="I Miei Ordini" desc="Storico completo" onClick={() => setActiveTab('orders')} color="bg-sky-50 text-sky-600" />
              <QuickActionCard icon={Heart} label="Lista Desideri" desc="I tuoi preferiti" onClick={() => navigate('/wishlist')} color="bg-red-50 text-red-500" />
              <QuickActionCard icon={ShoppingBag} label="Continua Acquisti" desc="Torna al negozio" onClick={() => navigate('/shop')} color="bg-amber-50 text-amber-600" />
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-bold text-stone-800 flex items-center gap-2"><Package size={18} className="text-nature-600" /> Ultimi Ordini</h3>
                {orders.length > 0 && (
                  <button onClick={() => setActiveTab('orders')} className="text-nature-600 text-sm font-bold hover:underline flex items-center gap-1">
                    Vedi Tutti <ArrowRight size={14} />
                  </button>
                )}
              </div>
              {isLoadingOrders ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 text-nature-600 animate-spin" /></div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <Package size={40} className="mx-auto mb-3 text-stone-300" />
                  <p className="font-medium">Non hai ancora effettuato ordini.</p>
                  <p className="text-sm mt-1">Inizia a fare acquisti nel nostro negozio!</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {orders.slice(0, 3).map(order => (
                    <button key={order.id} onClick={() => setSelectedOrder(order)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-stone-50 transition-colors min-h-[60px]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-sm text-stone-500">#{order.id}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-xs text-stone-400">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-nature-700">€{order.total.toFixed(2)}</span>
                        <ChevronRight size={16} className="text-stone-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PROFILE TAB ─── */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <MapPin className="text-nature-600" size={22} /> Dettagli Spedizione
                </h2>
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Modifica Dati</Button>
                )}
              </div>

              {/* Success feedback */}
              {profileSaveSuccess && (
                <div className="mx-6 md:mx-8 mt-5 p-3 bg-green-50 text-green-700 text-sm rounded-xl flex items-center gap-2 border border-green-100">
                  <CheckCircle size={16} className="flex-shrink-0" /> Dati aggiornati con successo!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="p-6 md:p-8 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nome Completo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="text" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.nome_completo} placeholder="Mario Rossi"
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Indirizzo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Indirizzo</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="text" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.indirizzo} placeholder="Via, Numero Civico..."
                      onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Note Consegna */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Note Consegna</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="text" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.note_indirizzo} placeholder="Scala B, 2° Piano, lasciare in portineria..."
                      onChange={(e) => setFormData({ ...formData, note_indirizzo: e.target.value })}
                    />
                  </div>
                </div>

                {/* Citta */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Città</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="text" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.citta} placeholder="Teramo"
                      onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    />
                  </div>
                </div>

                {/* CAP */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">CAP</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="text" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.cap} placeholder="64100"
                      onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                    />
                  </div>
                </div>

                {/* Telefono */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Numero di Telefono</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type="tel" disabled={!isEditing}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white disabled:text-stone-500 disabled:cursor-not-allowed transition-all text-sm"
                      value={formData.telefono} placeholder="+39 333 1234567"
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                {/* Actions */}
                {isEditing && (
                  <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); if (user) setFormData({ nome_completo: user.nome_completo || '', indirizzo: user.indirizzo || '', note_indirizzo: user.note_indirizzo || '', citta: user.citta || '', cap: user.cap || '', telefono: user.telefono || '' }); }}>
                      Annulla
                    </Button>
                    <Button type="submit">Salva Modifiche</Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-stone-100">
              <div className="p-6 md:p-8 border-b border-stone-100">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Package className="text-nature-600" size={22} /> Storico Ordini
                </h2>
              </div>

              {isLoadingOrders ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 text-nature-600 animate-spin" /></div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-stone-500">
                  <Package size={48} className="mx-auto mb-4 text-stone-300" />
                  <p className="font-bold text-stone-700 text-lg">Nessun ordine ancora</p>
                  <p className="text-sm mt-1">Inizia a fare acquisti nel nostro negozio!</p>
                </div>
              ) : (
                <>
                  {/* Mobile: Card layout */}
                  <div className="md:hidden divide-y divide-stone-100">
                    {orders.map(order => (
                      <button key={order.id} onClick={() => setSelectedOrder(order)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors min-h-[72px]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-stone-500">#{order.id}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-xs text-stone-400">{order.date}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-nature-700">€{order.total.toFixed(2)}</span>
                          <ChevronRight size={16} className="text-stone-300" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Desktop: Table layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gradient-to-r from-stone-50 to-stone-100/50 text-stone-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="p-4 pl-8">ID Ordine</th>
                          <th className="p-4">Data</th>
                          <th className="p-4">Totale</th>
                          <th className="p-4">Stato</th>
                          <th className="p-4 pr-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-nature-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                            <td className="p-4 pl-8 font-mono text-stone-600">#{order.id}</td>
                            <td className="p-4 text-stone-800">{order.date}</td>
                            <td className="p-4 font-bold text-nature-700">€{order.total.toFixed(2)}</td>
                            <td className="p-4"><StatusBadge status={order.status} /></td>
                            <td className="p-4 pr-8 text-right">
                              <ChevronRight className="inline-block text-stone-300 group-hover:text-nature-600 transition-colors" size={20} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── SECURITY TAB ─── */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            {/* Account Info Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-5">
                <UserCog className="text-nature-600" size={20} /> Informazioni Account
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <Mail size={18} className="text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Email</p>
                    <p className="text-sm font-bold text-stone-800">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <UserIcon size={18} className="text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Username</p>
                    <p className="text-sm font-bold text-stone-800">{user.username}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8">
              <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-5">
                <Lock className="text-nature-600" size={20} /> Cambia Password
              </h3>

              {/* Feedback */}
              {passwordError && (
                <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100">
                  <X size={16} className="flex-shrink-0" /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-5 p-3 bg-green-50 text-green-700 text-sm rounded-xl flex items-center gap-2 border border-green-100">
                  <CheckCircle size={16} className="flex-shrink-0" /> {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Password Attuale</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'} required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                      value={passwordForm.currentPassword} placeholder="La tua password attuale"
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nuova Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'} required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                      value={passwordForm.newPassword} placeholder="Nuova password"
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-stone-400 mt-1.5 ml-1">Almeno 6 caratteri</p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Conferma Nuova Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-nature-500 transition-colors" size={18} />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'} required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all text-sm"
                      value={passwordForm.confirmPassword} placeholder="Ripeti nuova password"
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                      {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Aggiornamento...</span>
                  ) : (
                    'Aggiorna Password'
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ─── MOBILE LOGOUT BUTTON ─── */}
        <div className="md:hidden mt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut size={18} /> Esci dall'Account
          </button>
        </div>

      </div>

      {/* ═══ ORDER DETAIL MODAL ═══ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-fade-in-up max-h-[85vh] md:max-h-[80vh] flex flex-col">
            {/* Drag handle on mobile */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            <div className="bg-gradient-to-br from-nature-50 to-emerald-50/50 p-4 md:p-6 border-b border-nature-100 flex justify-between items-start flex-shrink-0">
              <div>
                <h3 className="font-bold text-lg md:text-xl text-nature-900 flex items-center gap-2">
                  <Hash size={18} /> Ordine #{selectedOrder.id}
                </h3>
                <p className="text-sm text-stone-500 mt-0.5">Effettuato il {selectedOrder.date}</p>
                <div className="mt-2"><StatusBadge status={selectedOrder.status} /></div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <h4 className="text-xs font-bold text-stone-400 uppercase mb-4 tracking-wider">Articoli Acquistati</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4 items-center p-3 bg-stone-50 rounded-xl">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-stone-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-800 text-sm md:text-base truncate">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-stone-500">Variante: {item.variant_name}</p>}
                      <p className="text-xs text-stone-600">Qtà: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-stone-800 text-sm md:text-base flex-shrink-0">€{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-stone-50 to-nature-50/30 p-4 md:p-6 border-t border-stone-100 flex justify-between items-center flex-shrink-0">
              <span className="text-stone-600 font-bold text-sm md:text-base">Totale Pagato</span>
              <span className="text-xl md:text-2xl font-bold text-nature-700">€{selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
