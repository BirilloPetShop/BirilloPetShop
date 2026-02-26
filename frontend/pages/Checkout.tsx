
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useCart } from '../services/cartContext';
import { useAuth } from '../services/authContext';
import { Button } from '../components/Button';
import {
  Calendar as CalendarIcon, CreditCard, Package, MapPin, AlertCircle,
  CheckCircle, Truck, FileText, Check, ShoppingBag, LogIn, Loader2,
  Lock, ChevronRight, Home as HomeIcon, Store, Shield, X
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { STRAPI_API_URL } from '../constants';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK || 'pk_test_51SV5rnFi1kEwIp0cCe1ch3oCZiyQMlhYfGPvNXbbmcSrtlI2pJkvfwYttP4RjuG8poIIXvLubLedzzXGYGJgAVqe00hvcY2kTk');

export const Checkout: React.FC = () => {
  const { items, total, totalSavings, updateServiceDetails, clearCart } = useCart();
  const { user, isAuthenticated, updateProfile, refreshUser, token, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState({
    address: '', city: '', zip: '', phone: '', notes: ''
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [wantsLocalDelivery, setWantsLocalDelivery] = useState(false);
  const addressInitialized = useRef(false);

  // Fetch fresh user data from Strapi on mount
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      refreshUser();
    }
  }, [isLoading, isAuthenticated]);

  // Pre-fill shipping form from user profile (only once)
  useEffect(() => {
    if (isLoading || addressInitialized.current) return;
    if (user) {
      setShippingDetails({
        address: user.indirizzo || '',
        city: user.citta || '',
        zip: user.cap || '',
        phone: user.telefono || '',
        notes: user.note_indirizzo || ''
      });
      addressInitialized.current = true;
    }
  }, [user, isLoading]);

  // ── Shipping Logic ──
  const isEligibleForLocalDelivery = () => {
    const city = shippingDetails.city.toLowerCase().trim();
    const zip = shippingDetails.zip.trim();
    return city.includes('teramo') || zip.startsWith('64');
  };
  const canHaveLocalDelivery = isEligibleForLocalDelivery();

  useEffect(() => {
    if (!canHaveLocalDelivery) setWantsLocalDelivery(false);
  }, [canHaveLocalDelivery]);

  const isFreeShippingThreshold = total >= 99;
  const shippingCost = isFreeShippingThreshold ? 0 : (wantsLocalDelivery ? 4.99 : 9.90);
  const finalTotal = total + shippingCost;

  const serviceItems = items.filter(item => item.attributes.is_service);
  const physicalItems = items.filter(item => !item.attributes.is_service);
  const hasPhysicalItems = physicalItems.length > 0;
  const hasAddress = user?.indirizzo && user?.citta && user?.cap;
  const canProceed = !hasPhysicalItems || (hasAddress && !isEditingAddress);

  // ── Stepper ──
  const getCheckoutStep = () => {
    if (!hasPhysicalItems) return 2;
    if (!hasAddress || isEditingAddress) return 1;
    if (isProcessing) return 3;
    return 2;
  };
  const checkoutStep = getCheckoutStep();

  const steps = [
    { num: 1, label: 'Indirizzo', icon: MapPin },
    { num: 2, label: 'Riepilogo', icon: Package },
    { num: 3, label: 'Pagamento', icon: CreditCard },
  ];

  // ── Validation ──
  const validateField = (name: string, value: string) => {
    const errs = { ...fieldErrors };
    switch (name) {
      case 'zip':
        if (value && !/^\d{5}$/.test(value)) errs.zip = 'Il CAP deve essere di 5 cifre';
        else delete errs.zip;
        break;
      case 'phone':
        if (value && !/^(\+39\s?)?[0-9]{9,11}$/.test(value.replace(/\s/g, ''))) errs.phone = 'Inserisci un numero valido';
        else delete errs.phone;
        break;
      case 'address':
        if (!value.trim()) errs.address = 'Campo obbligatorio';
        else delete errs.address;
        break;
      case 'city':
        if (!value.trim()) errs.city = 'Campo obbligatorio';
        else delete errs.city;
        break;
    }
    setFieldErrors(errs);
  };

  const handleFieldChange = (name: string, value: string) => {
    setShippingDetails(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSaveAddress = async () => {
    const errs: Record<string, string> = {};
    if (!shippingDetails.address.trim()) errs.address = 'Campo obbligatorio';
    if (!shippingDetails.city.trim()) errs.city = 'Campo obbligatorio';
    if (!shippingDetails.zip.trim()) errs.zip = 'Campo obbligatorio';
    else if (!/^\d{5}$/.test(shippingDetails.zip)) errs.zip = 'Il CAP deve essere di 5 cifre';
    if (shippingDetails.phone && !/^(\+39\s?)?[0-9]{9,11}$/.test(shippingDetails.phone.replace(/\s/g, ''))) {
      errs.phone = 'Inserisci un numero valido';
    }
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    await updateProfile({
      indirizzo: shippingDetails.address,
      citta: shippingDetails.city,
      cap: shippingDetails.zip,
      telefono: shippingDetails.phone,
      note_indirizzo: shippingDetails.notes
    });
    setIsEditingAddress(false);
  };

  // ── Payment ──
  const handlePayment = async () => {
    if (!token || !user) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        data: {
          user: user.id,
          total_paid: finalTotal,
          stato: "In Attesa",
          shipping_details: shippingDetails,
          cart_snapshot: items.map(item => ({
            id: item.id,
            name: item.attributes.nome,
            quantity: item.quantity,
            price: item.selectedVariant
              ? (item.selectedVariant.prezzo_scontato || item.selectedVariant.prezzo)
              : (item.attributes.prezzo_scontato || item.attributes.prezzo),
            variant: item.selectedVariant?.nome_variante,
            variant_id: item.selectedVariant?.id,
            is_service: item.attributes.is_service,
            service_date: item.serviceDate,
            service_notes: item.serviceNotes,
            image: item.attributes.immagine || null
          }))
        }
      };

      const response = await fetch(`${STRAPI_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderPayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || "Impossibile creare l'ordine");
      }

      if (responseData.url) {
        window.location.href = responseData.url;
      } else {
        clearCart();
        navigate('/account');
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Si è verificato un errore durante il pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Input helper ──
  const inputClass = (name: string) =>
    `w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nature-400 focus:border-transparent transition-all ${fieldErrors[name] ? 'border-red-300 bg-red-50/50' : 'border-stone-200 hover:border-stone-300'}`;

  // ══════════════ RENDER STATES ══════════════

  // Loading
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-nature-600" size={40} />
          <p className="text-stone-500 font-medium">Caricamento...</p>
        </div>
      </Layout>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
              <div className="bg-gradient-to-br from-nature-50 to-emerald-50 px-8 pt-10 pb-8">
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4">
                  <LogIn className="text-nature-600" size={32} />
                </div>
                <h2 className="font-display text-2xl font-bold text-stone-800">Accedi per continuare</h2>
                <p className="text-stone-500 mt-2 text-sm">Effettua il login per completare il tuo acquisto</p>
              </div>
              <div className="px-8 pb-8 pt-6 space-y-3">
                <Button className="w-full" onClick={() => navigate('/login')}>
                  <span className="flex items-center justify-center gap-2">
                    <LogIn size={18} /> Vai al Login
                  </span>
                </Button>
                <button onClick={() => navigate('/shop')} className="text-sm text-stone-400 hover:text-nature-600 transition-colors font-medium">
                  Torna al Negozio
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
              <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 px-8 pt-10 pb-8">
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="text-stone-400" size={32} />
                </div>
                <h2 className="font-display text-2xl font-bold text-stone-800">Carrello vuoto</h2>
                <p className="text-stone-500 mt-2 text-sm">Aggiungi qualche prodotto al carrello prima di procedere</p>
              </div>
              <div className="px-8 pb-8 pt-6">
                <Button className="w-full" onClick={() => navigate('/shop')}>
                  <span className="flex items-center justify-center gap-2">
                    <Store size={18} /> Vai al Negozio
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ══════════════ MAIN CHECKOUT ══════════════
  return (
    <Layout>
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-xs mx-4">
            <Loader2 className="animate-spin text-nature-600 mx-auto mb-4" size={40} />
            <p className="font-bold text-stone-800">Reindirizzamento a Stripe...</p>
            <p className="text-sm text-stone-500 mt-1">Non chiudere questa pagina</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-b from-nature-50/50 to-stone-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-nature-50 to-emerald-50/30 border-b border-nature-100/50">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-stone-400 mb-3">
              <Link to="/" className="hover:text-nature-600 transition-colors flex items-center gap-1">
                <HomeIcon size={14} /> Home
              </Link>
              <ChevronRight size={14} />
              <Link to="/shop" className="hover:text-nature-600 transition-colors">Negozio</Link>
              <ChevronRight size={14} />
              <span className="text-stone-700 font-semibold">Checkout</span>
            </nav>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-800">Completa il tuo Ordine</h1>
            <p className="text-stone-500 text-sm mt-1">
              {items.length} articol{items.length === 1 ? 'o' : 'i'} nel carrello
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">Errore nel pagamento</p>
                <p className="text-red-600 text-sm mt-0.5">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600 transition-colors">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Stepper */}
          {hasPhysicalItems && (
            <div className="flex items-center justify-center mb-8 max-w-md mx-auto">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = checkoutStep > step.num;
                const isActive = checkoutStep === step.num;
                const isPending = checkoutStep < step.num;
                return (
                  <React.Fragment key={step.num}>
                    {i > 0 && (
                      <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${isCompleted || isActive ? 'bg-nature-500' : 'bg-stone-200'}`} />
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted ? 'bg-nature-600 text-white shadow-md shadow-nature-200' :
                        isActive ? 'bg-nature-600 text-white shadow-lg shadow-nature-200 ring-4 ring-nature-100' :
                        'bg-stone-100 text-stone-400'
                      }`}>
                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <span className={`text-[11px] font-bold whitespace-nowrap ${isActive || isCompleted ? 'text-nature-700' : 'text-stone-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ═══ Left Column ═══ */}
            <div className="lg:col-span-2 space-y-6">

              {/* Card: Shipping Address */}
              {hasPhysicalItems && (
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${hasAddress && !isEditingAddress ? 'border-stone-100' : 'border-amber-200'}`}>
                  <div className={`px-6 py-4 flex items-center gap-3 border-b ${hasAddress && !isEditingAddress ? 'bg-nature-50/50 border-nature-100/50' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasAddress && !isEditingAddress ? 'bg-nature-100 text-nature-600' : 'bg-amber-100 text-amber-600'}`}>
                      <MapPin size={16} />
                    </div>
                    <h3 className="font-bold text-stone-800">Indirizzo di Spedizione</h3>
                    {hasAddress && !isEditingAddress && (
                      <span className="ml-auto text-xs bg-nature-100 text-nature-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Salvato
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    {!hasAddress || isEditingAddress ? (
                      <div className="space-y-4 animate-fade-in">
                        {!hasAddress && (
                          <div className="flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-xl text-sm border border-amber-100">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <p>Inserisci un indirizzo di spedizione per continuare.</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input placeholder="Indirizzo *" className={inputClass('address')} value={shippingDetails.address} onChange={(e) => handleFieldChange('address', e.target.value)} />
                            {fieldErrors.address && <p className="text-xs text-red-500 mt-1.5 ml-1">{fieldErrors.address}</p>}
                          </div>
                          <div className="col-span-2">
                            <input placeholder="Note (es. Scala, Piano, Campanello)" className={inputClass('notes')} value={shippingDetails.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} />
                          </div>
                          <div>
                            <input placeholder="Citta *" className={inputClass('city')} value={shippingDetails.city} onChange={(e) => handleFieldChange('city', e.target.value)} />
                            {fieldErrors.city && <p className="text-xs text-red-500 mt-1.5 ml-1">{fieldErrors.city}</p>}
                          </div>
                          <div>
                            <input placeholder="CAP * (es. 64100)" inputMode="numeric" maxLength={5} className={inputClass('zip')} value={shippingDetails.zip} onChange={(e) => handleFieldChange('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} />
                            {fieldErrors.zip && <p className="text-xs text-red-500 mt-1.5 ml-1">{fieldErrors.zip}</p>}
                          </div>
                          <div className="col-span-2">
                            <input type="tel" inputMode="tel" placeholder="Telefono (es. 333 1234567)" className={inputClass('phone')} value={shippingDetails.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} />
                            {fieldErrors.phone && <p className="text-xs text-red-500 mt-1.5 ml-1">{fieldErrors.phone}</p>}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveAddress} disabled={Object.keys(fieldErrors).length > 0}>
                            <span className="flex items-center gap-2">
                              <Check size={16} /> Salva e Continua
                            </span>
                          </Button>
                          {hasAddress && (
                            <button onClick={() => setIsEditingAddress(false)} className="text-sm text-stone-400 hover:text-stone-600 font-medium transition-colors px-4">
                              Annulla
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-stone-600 space-y-0.5">
                          <p className="font-bold text-stone-800 text-base">{user?.nome_completo || user?.username}</p>
                          <p>{user?.indirizzo}</p>
                          {user?.note_indirizzo && (
                            <p className="text-stone-400 italic flex items-center gap-1"><FileText size={12} /> {user.note_indirizzo}</p>
                          )}
                          <p>{user?.citta}, {user?.cap}</p>
                          {user?.telefono && <p>{user?.telefono}</p>}
                        </div>
                        <button
                          onClick={() => setIsEditingAddress(true)}
                          className="text-nature-600 text-sm font-bold hover:underline flex-shrink-0 ml-4"
                        >
                          Modifica
                        </button>
                      </div>
                    )}

                    {/* Local Delivery */}
                    {hasAddress && !isEditingAddress && canHaveLocalDelivery && (
                      <div className="mt-5 pt-5 border-t border-stone-100 animate-fade-in">
                        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          wantsLocalDelivery ? 'bg-nature-50 border-nature-300 shadow-sm' : 'bg-white border-stone-200 hover:border-nature-200'
                        }`}>
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-nature-600 rounded focus:ring-nature-500"
                              checked={wantsLocalDelivery}
                              onChange={(e) => setWantsLocalDelivery(e.target.checked)}
                            />
                          </div>
                          <div>
                            <span className="font-bold text-nature-800 flex items-center gap-2">
                              <Truck size={18} /> Consegna a Domicilio — Teramo
                            </span>
                            <p className="text-sm text-stone-500 mt-1">
                              Consegna direttamente a casa tua nella zona di Teramo.
                              <span className="text-nature-600 font-bold block mt-1">
                                {isFreeShippingThreshold ? 'Gratuita per questo ordine!' : 'Costo agevolato: \u20ac4,99 (Gratis oltre \u20ac99)'}
                              </span>
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card: Order Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-6 py-4 flex items-center gap-3 border-b bg-stone-50/50 border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-nature-100 text-nature-600 flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <h3 className="font-bold text-stone-800">I tuoi Articoli</h3>
                  <span className="ml-auto text-xs text-stone-400 font-medium">{items.length} articol{items.length === 1 ? 'o' : 'i'}</span>
                </div>

                <div className="divide-y divide-stone-50">
                  {physicalItems.map(item => {
                    const unitPrice = item.selectedVariant
                      ? (item.selectedVariant.prezzo_scontato || item.selectedVariant.prezzo)
                      : (item.attributes.prezzo_scontato || item.attributes.prezzo);
                    const lineTotal = unitPrice * item.quantity;
                    return (
                      <div key={`${item.id}-${item.selectedVariant?.id}`} className="flex gap-4 items-center p-5 hover:bg-stone-50/50 transition-colors">
                        <div className="w-20 h-20 bg-stone-50 rounded-xl border border-stone-100 flex-shrink-0 overflow-hidden">
                          <img src={item.attributes.immagine} alt={item.attributes.nome} className="w-full h-full object-contain p-1.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-stone-800 font-bold text-sm line-clamp-2">{item.attributes.nome}</h4>
                          {item.selectedVariant && (
                            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1 inline-block">
                              {item.selectedVariant.nome_variante}
                            </span>
                          )}
                          <p className="text-xs text-stone-400 mt-1">Quantita: {item.quantity}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-stone-800">{'\u20ac'}{lineTotal.toFixed(2)}</div>
                          {item.quantity > 1 && (
                            <p className="text-xs text-stone-400">{'\u20ac'}{unitPrice.toFixed(2)} cad.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Services */}
                {serviceItems.length > 0 && (
                  <div className="border-t border-stone-100 p-5">
                    <h4 className="text-sm font-bold text-ocean-600 uppercase mb-3 flex items-center gap-2">
                      <CalendarIcon size={14} /> Servizi da Prenotare
                    </h4>
                    <div className="space-y-3">
                      {serviceItems.map(item => (
                        <div key={item.id} className="bg-ocean-50/50 p-4 rounded-xl border border-ocean-100">
                          <div className="flex gap-4 mb-3">
                            <div className="w-14 h-14 bg-white rounded-xl border border-ocean-100 flex-shrink-0 overflow-hidden">
                              <img src={item.attributes.immagine} alt={item.attributes.nome} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between font-bold text-ocean-900">
                                <span>{item.attributes.nome}</span>
                                <span>{'\u20ac'}{item.attributes.prezzo.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-ocean-700 font-semibold block mb-1.5">Data Preferita</label>
                              <input
                                type="date"
                                className="w-full px-3 py-2.5 rounded-xl border border-ocean-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                                onChange={(e) => updateServiceDetails(item.id, e.target.value, item.serviceNotes || '')}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-ocean-700 font-semibold block mb-1.5">Note</label>
                              <textarea
                                className="w-full px-3 py-2.5 rounded-xl border border-ocean-200 text-sm h-[42px] resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400"
                                placeholder="Istruzioni specifiche..."
                                onChange={(e) => updateServiceDetails(item.id, item.serviceDate || '', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Right Column — Summary Sidebar ═══ */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg sticky top-24 border border-stone-100 overflow-hidden">
                {/* Sidebar Header */}
                <div className="bg-gradient-to-br from-nature-50 to-emerald-50/50 px-6 py-4 border-b border-nature-100/50 flex items-center gap-3">
                  <img src="/logo.png" alt="Birillo" className="w-8 h-8 rounded-full border border-nature-200" />
                  <h3 className="font-display font-bold text-lg text-stone-800">Riepilogo</h3>
                </div>

                <div className="p-6">
                  {/* Items Summary */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotale ({items.length} articol{items.length === 1 ? 'o' : 'i'})</span>
                      <span className="font-semibold">{'\u20ac'}{total.toFixed(2)}</span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">Risparmi</span>
                        <span className="font-bold">-{'\u20ac'}{totalSavings.toFixed(2)}</span>
                      </div>
                    )}

                    {hasPhysicalItems && (
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600 flex items-center gap-1">
                          {wantsLocalDelivery ? <><Truck size={14} /> Consegna</> : 'Spedizione'}
                        </span>
                        {shippingCost === 0 ? (
                          <span className="text-nature-600 font-bold">Gratis</span>
                        ) : (
                          <span className="font-semibold">{'\u20ac'}{shippingCost.toFixed(2)}</span>
                        )}
                      </div>
                    )}

                    {/* Free shipping threshold hint */}
                    {hasPhysicalItems && !isFreeShippingThreshold && !wantsLocalDelivery && (
                      <div className="text-xs text-stone-400 text-right">
                        Spedizione gratuita oltre {'\u20ac'}99
                      </div>
                    )}
                  </div>

                  {/* Divider + Total */}
                  <div className="border-t border-stone-100 pt-4 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-stone-700 text-base">Totale</span>
                      <span className="font-display font-bold text-2xl text-nature-700">{'\u20ac'}{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  {!canProceed ? (
                    <div className="bg-amber-50 text-amber-700 p-3.5 rounded-xl text-sm flex gap-2.5 items-start border border-amber-100">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <p>Salva il tuo indirizzo di spedizione per procedere.</p>
                    </div>
                  ) : (
                    <Button
                      className="w-full py-3.5"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      <span className="flex items-center justify-center gap-2 text-base">
                        <CreditCard size={20} /> Paga e Ordina
                      </span>
                    </Button>
                  )}

                  {/* Security Badge */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-stone-400">
                    <Shield size={14} />
                    <span className="text-xs font-medium">Checkout sicuro via Stripe</span>
                    <Lock size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
