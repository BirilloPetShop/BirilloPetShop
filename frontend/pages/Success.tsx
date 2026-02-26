import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { CheckCircle, Package, Store, Loader2, Truck, ClipboardCheck, Mail } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../services/cartContext';
import { useAuth } from '../services/authContext';
import { STRAPI_API_URL } from '../constants';

interface OrderDetails {
  id: number;
  total_paid: number;
  cart_snapshot: Array<{
    name: string;
    quantity: number;
    price: number;
    variant?: string;
    image?: string;
  }>;
}

export const Success: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { token } = useAuth();
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
    localStorage.removeItem('aquapet_cart');

    const verifyAndFetchOrder = async () => {
      if (!sessionId || !token) {
        setLoading(false);
        return;
      }

      try {
        // 1. Verify payment with Stripe and trigger order processing + email
        await fetch(`${STRAPI_API_URL}/orders/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ session_id: sessionId })
        });

        // 2. Fetch order details for display
        const response = await fetch(`${STRAPI_API_URL}/orders?filters[stripe_id][$eq]=${sessionId}&populate=cart_snapshot`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setOrder(data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error verifying/fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchOrder();
  }, [sessionId, token, clearCart]);

  const nextSteps = [
    { icon: ClipboardCheck, title: 'Conferma', desc: 'Riceverai un\'email di conferma a breve' },
    { icon: Package, title: 'Preparazione', desc: 'Il tuo ordine viene preparato con cura' },
    { icon: Truck, title: 'Spedizione', desc: 'Ti avviseremo quando sara in viaggio' },
  ];

  return (
    <Layout>
      <div className="min-h-[80vh] bg-gradient-to-b from-nature-50/50 to-stone-50 py-8 md:py-12 px-4">
        <div className="max-w-lg mx-auto">

          {/* ═══ Success Header Card ═══ */}
          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-fade-in-up">
            {/* Green Header */}
            <div className="bg-gradient-to-br from-nature-500 to-emerald-600 px-8 pt-10 pb-8 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />

              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-nature-600" size={40} />
                </div>
                <h1 className="font-display text-3xl font-bold text-white mb-1">Ordine Confermato!</h1>
                <p className="text-nature-100 text-sm">Grazie per il tuo acquisto da Birillo Pet Shop</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="animate-spin text-nature-600 mb-3" size={36} />
                  <p className="text-stone-500 text-sm font-medium">Caricamento dettagli ordine...</p>
                </div>
              ) : order ? (
                <>
                  {/* Order Number Badge */}
                  <div className="text-center mb-5">
                    <span className="inline-flex items-center gap-2 bg-nature-50 text-nature-700 px-4 py-2 rounded-full text-sm font-bold border border-nature-100">
                      <Package size={16} /> Ordine #{order.id}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden mb-5">
                    <div className="divide-y divide-stone-100">
                      {order.cart_snapshot.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-stone-700 block truncate">
                              {item.quantity}x {item.name}
                            </span>
                            {item.variant && (
                              <span className="text-xs text-stone-400">{item.variant}</span>
                            )}
                          </div>
                          <span className="font-bold text-stone-600 flex-shrink-0 ml-4">
                            {'\u20ac'}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-nature-50 border-t border-nature-100">
                      <span className="font-bold text-nature-800">Totale Pagato</span>
                      <span className="font-display font-bold text-xl text-nature-700">
                        {'\u20ac'}{order.total_paid.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-5 text-sm flex items-start gap-2 border border-amber-100">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  <p>I dettagli dell'ordine verranno inviati via email. Puoi controllarli anche nella sezione "I Miei Ordini".</p>
                </div>
              )}

              {/* Next Steps */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 text-center">Cosa succede ora</h3>
                <div className="flex items-start justify-between gap-2">
                  {nextSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <div className="flex-shrink-0 mt-5 w-8 border-t-2 border-dashed border-stone-200" />
                        )}
                        <div className="flex flex-col items-center text-center flex-1 min-w-0">
                          <div className="w-10 h-10 bg-nature-50 rounded-full flex items-center justify-center mb-2 border border-nature-100">
                            <Icon size={18} className="text-nature-600" />
                          </div>
                          <span className="text-xs font-bold text-stone-700 block">{step.title}</span>
                          <span className="text-[10px] text-stone-400 leading-tight mt-0.5 hidden sm:block">{step.desc}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/account')}
                  className="w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Package size={18} /> Vedi i tuoi Ordini
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/shop')}
                  className="w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Store size={18} /> Continua lo Shopping
                  </span>
                </Button>
              </div>

              {/* Help Link */}
              <p className="text-center text-xs text-stone-400 mt-5">
                Hai bisogno di aiuto?{' '}
                <a href="mailto:birillopetshop@hotmail.it" className="text-nature-600 font-semibold hover:underline">
                  Contattaci
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
