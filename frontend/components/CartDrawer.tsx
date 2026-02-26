
import React from 'react';
import { useCart } from '../services/cartContext';
import { X, Trash2, Calendar, ShoppingBag, Minus, Plus, Tag, ArrowRight, Store } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total, totalSavings, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-nature-50">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-nature-900">Il tuo Cestino</h2>
              {items.length > 0 && (
                <span className="bg-nature-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2.5 hover:bg-white rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Chiudi carrello"
            >
              <X size={20} className="text-stone-500" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag size={32} className="text-stone-300" />
                </div>
                <p className="font-bold text-stone-600 mb-1">Il tuo cestino è vuoto</p>
                <p className="text-sm text-stone-400 mb-6">Esplora il nostro negozio e aggiungi i tuoi prodotti preferiti!</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="flex items-center gap-2 bg-nature-600 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-nature-700 transition-colors"
                >
                  <Store size={16} /> Vai al Negozio
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const unitPrice = item.selectedVariant
                  ? (item.selectedVariant.prezzo_scontato || item.selectedVariant.prezzo)
                  : (item.attributes.prezzo_scontato || item.attributes.prezzo);
                const isOnSale = item.selectedVariant
                  ? !!(item.selectedVariant.prezzo_scontato && item.selectedVariant.prezzo_scontato < item.selectedVariant.prezzo)
                  : !!(item.attributes.prezzo_scontato && item.attributes.prezzo_scontato < item.attributes.prezzo);

                return (
                  <div key={`${item.id}-${item.selectedVariant?.id || 'base'}-${index}`} className="flex gap-3 p-3 rounded-xl border border-stone-100 bg-white shadow-sm hover:border-nature-200 transition-colors">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-50 flex-shrink-0">
                      {item.attributes.immagine ? (
                        <img
                          src={item.attributes.immagine}
                          alt={item.attributes.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-stone-800 text-sm line-clamp-2 leading-tight">{item.attributes.nome}</h4>
                          {item.selectedVariant && (
                            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded mt-1 inline-block">
                              {item.selectedVariant.nome_variante}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors p-1 flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                          aria-label="Rimuovi dal carrello"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mt-1">
                        {isOnSale && (
                          <span className="text-xs line-through text-stone-400">
                            €{(item.selectedVariant ? item.selectedVariant.prezzo : item.attributes.prezzo).toFixed(2)}
                          </span>
                        )}
                        <span className={`font-bold text-sm ${isOnSale ? 'text-birillo-red' : 'text-nature-700'}`}>
                          €{unitPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Service badge */}
                      {item.attributes.is_service && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-ocean-600 bg-ocean-50 w-fit px-2 py-0.5 rounded">
                          <Calendar size={11} />
                          <span>Prenotazione</span>
                        </div>
                      )}

                      {/* Quantity Controls */}
                      {!item.attributes.is_service && (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-stone-100 rounded-full h-8 border border-stone-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedVariant?.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-nature-600 rounded-full hover:bg-stone-200 transition-colors"
                              aria-label="Diminuisci quantità"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-stone-800 select-none">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedVariant?.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-nature-600 rounded-full hover:bg-stone-200 transition-colors"
                              aria-label="Aumenta quantità"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-stone-700">
                            €{(unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-stone-100 bg-stone-50 space-y-3">
              {/* Savings */}
              {totalSavings > 0 && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">
                  <Tag size={14} className="flex-shrink-0" />
                  <span className="text-sm font-bold">Stai risparmiando €{totalSavings.toFixed(2)}!</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium">Subtotale</span>
                <span className="font-display text-2xl font-bold text-nature-800">€{total.toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  Procedi al Checkout <ArrowRight size={16} />
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
