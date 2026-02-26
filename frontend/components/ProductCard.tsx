
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../services/cartContext';
import { useWishlist } from '../services/wishlistContext';
import { useToast } from '../services/toastContext';
import { Plus, Calendar, Heart, ChevronRight, Tag, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  // Defensive check
  if (!product || !product.attributes) {
    return null;
  }

  const { nome, prezzo, prezzo_scontato, categoria, is_service, immagine, varianti } = product.attributes;
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isSaved = isInWishlist(product.id);
  const hasVariants = varianti && varianti.length > 0;

  // Calculate Cheapest Variant
  const cheapestVariant = hasVariants ? [...varianti].sort((a, b) => {
    const priceA = (a.prezzo_scontato && a.prezzo_scontato < a.prezzo) ? a.prezzo_scontato : a.prezzo;
    const priceB = (b.prezzo_scontato && b.prezzo_scontato < b.prezzo) ? b.prezzo_scontato : b.prezzo;
    return priceA - priceB;
  })[0] : null;

  // Determine effective prices and sale status
  let displayPrice = prezzo;
  let displaySalePrice = prezzo_scontato;
  let isItemOnSale = false;

  if (hasVariants && cheapestVariant) {
    displayPrice = cheapestVariant.prezzo;
    displaySalePrice = cheapestVariant.prezzo_scontato;
    isItemOnSale = !!(displaySalePrice && displaySalePrice < displayPrice);
  } else {
    isItemOnSale = !!(prezzo_scontato && prezzo_scontato < prezzo);
  }

  const discountPercent = isItemOnSale && displaySalePrice
    ? Math.round(((displayPrice - displaySalePrice) / displayPrice) * 100)
    : 0;

  // Stock Status
  const totalStock = hasVariants
    ? varianti.reduce((acc, v) => acc + (v.stock || 0), 0)
    : (product.attributes.stock || 0);

  const isOutOfStock = !is_service && totalStock <= 0;

  const goToProductPage = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      goToProductPage();
    } else {
      addToCart(product, quantity);
      setQuantity(1);
      // Animation + toast
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 600);
      showToast(`${nome} aggiunto al carrello!`, 'success');
    }
  };

  const adjustQuantity = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(1, prev + delta));
  };

  return (
    <>
      <div className={`group bg-white rounded-xl transition-all duration-300 overflow-hidden border flex flex-col h-full relative min-w-0 ${is_service ? 'border-sky-100 hover:border-ocean-300' : 'border-stone-200 hover:border-nature-300'} hover:shadow-md`}>

        {/* Top accent bar */}
        <div className={`h-[3px] w-full ${is_service ? 'bg-ocean-400' : 'bg-nature-500'}`} />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            showToast(
              isSaved ? `${nome} rimosso dai preferiti` : `${nome} aggiunto ai preferiti!`,
              isSaved ? 'info' : 'success'
            );
          }}
          className={`absolute top-2.5 right-2.5 z-10 w-9 h-9 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSaved ? 'bg-white text-birillo-red shadow-sm ring-1 ring-red-100' : 'bg-white/80 text-stone-400 hover:text-birillo-red backdrop-blur-sm shadow-sm'
            }`}
          aria-label={isSaved ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {/* Sale Badge */}
        {isItemOnSale && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-birillo-red text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm animate-fade-in">
            <Tag size={12} fill="currentColor" /> -{discountPercent}%
          </div>
        )}

        {/* Image */}
        <div className="relative h-48 overflow-hidden cursor-pointer bg-stone-50/50" onClick={goToProductPage}>
          {immagine ? (
            <img
              src={immagine}
              alt={nome}
              loading="lazy"
              className="w-full h-full object-contain p-4 transform group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <ShoppingBag size={48} />
            </div>
          )}
          {/* Added overlay */}
          {addedAnimation && (
            <div className="absolute inset-0 bg-nature-600/20 flex items-center justify-center animate-fade-in">
              <div className="bg-white rounded-full p-3 shadow-lg animate-bounce-in">
                <ShoppingBag size={24} className="text-nature-600" />
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 md:p-4 flex flex-col flex-grow">
          <span className="inline-block bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 w-fit">{categoria}</span>
          <h3
            className="font-display font-bold text-sm md:text-base text-stone-900 mb-2 leading-snug cursor-pointer hover:text-nature-600 transition-colors line-clamp-2"
            onClick={goToProductPage}
          >
            {nome}
          </h3>

          <div className="mt-auto pt-2.5 border-t border-stone-100">
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                {isItemOnSale ? (
                  <div className="flex flex-col items-start">
                    {hasVariants && <span className="text-[10px] text-stone-400 uppercase font-bold">A partire da</span>}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-400 line-through">€{displayPrice.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">-{discountPercent}%</span>
                    </div>
                    <span className="text-lg font-extrabold text-birillo-red">€{displaySalePrice!.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {hasVariants && <span className="text-[10px] text-stone-400 uppercase font-bold">A partire da</span>}
                    <span className="text-lg font-extrabold text-nature-700">€{displayPrice.toFixed(2)}</span>
                  </div>
                )}
                {hasVariants && <span className="text-[10px] font-bold text-nature-600 uppercase bg-nature-50 px-1.5 py-0.5 rounded-sm w-fit mt-0.5">+ opzioni</span>}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Inline Quantity Selector */}
                {!is_service && !hasVariants && !isOutOfStock && (
                  <div className="hidden sm:flex items-center bg-stone-50 rounded-lg h-8 px-0.5 border border-stone-200" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => adjustQuantity(e, -1)}
                      className="w-6 h-full flex items-center justify-center text-stone-400 hover:text-nature-600 font-bold text-sm disabled:opacity-30"
                      disabled={quantity <= 1}
                    >-</button>
                    <span className="w-5 text-center text-xs font-bold text-stone-700 select-none">{quantity}</span>
                    <button
                      onClick={(e) => adjustQuantity(e, 1)}
                      className="w-6 h-full flex items-center justify-center text-stone-400 hover:text-nature-600 font-bold text-sm"
                      disabled={quantity >= (product.attributes.stock || 99)}
                    >+</button>
                  </div>
                )}

                <button
                  onClick={handleAddClick}
                  disabled={isOutOfStock}
                  className={`h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95
                    ${isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed px-3.5 w-auto'
                      : is_service
                        ? 'w-10 bg-ocean-500 text-white hover:bg-ocean-600 shadow-sm hover:shadow-md'
                        : 'bg-nature-600 text-white hover:bg-nature-700 shadow-sm hover:shadow-md'
                    } ${hasVariants ? 'px-3.5 text-sm font-bold' : 'w-10'}
                  `}
                  aria-label="Aggiungi al carrello"
                >
                  {isOutOfStock ? (
                    <span className="text-[11px] font-bold uppercase">Esaurito</span>
                  ) : hasVariants ? (
                    <>Scegli <ChevronRight size={14} className="ml-0.5" /></>
                  ) : (
                    is_service ? <Calendar size={16} /> : <Plus size={20} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
