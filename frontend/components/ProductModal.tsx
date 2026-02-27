
import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../services/cartContext';
import { useToast } from '../services/toastContext';
import { X, ShoppingBag, Tag, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

import ReactMarkdown from 'react-markdown';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      // Reset state when modal opens
      setQuantity(1);
      setCurrentImageIndex(0); // Start from main image
      // Auto-select first variant if available
      if (product.attributes.varianti && product.attributes.varianti.length > 0) {
        setSelectedVariant(product.attributes.varianti[0]);
      } else {
        setSelectedVariant(undefined);
      }
    }
  }, [isOpen, product]);

  // Reset image when variant changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariant]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const isService = product.attributes.is_service;
  const basePrice = product.attributes.prezzo;
  const salePrice = product.attributes.prezzo_scontato;

  // Immagini dinamiche: se la variante ha un'immagine, sostituisce quella principale del prodotto
  const allImages = useMemo(() => {
    const galleria = (product.attributes.galleria || []).filter(Boolean);
    if (selectedVariant?.immagine) {
      // Variante con immagine propria: usa quella al posto dell'immagine prodotto
      return [selectedVariant.immagine, ...galleria];
    }
    return [product.attributes.immagine, ...galleria].filter(Boolean);
  }, [product.attributes.immagine, product.attributes.galleria, selectedVariant]);

  // Use Sale price if exists, otherwise base
  const effectiveBasePrice = salePrice || basePrice;

  // Variant Price Logic
  // Now using FULL PRICE from variant component
  const variantPrice = selectedVariant ? selectedVariant.prezzo : 0;
  const variantDiscountPrice = selectedVariant?.prezzo_scontato;

  // Final Price Calculation
  // If variant is selected, use its price. Otherwise use product price.
  let finalPrice = selectedVariant ? variantPrice : effectiveBasePrice;
  let isVariantOnSale = false;

  if (selectedVariant && variantDiscountPrice) {
    // If variant has specific discount price, use that
    finalPrice = variantDiscountPrice;
    isVariantOnSale = true;
  }

  // Determine if showing sale UI
  // If variant selected: check if variant is on sale
  // If no variant: check if product is on sale
  const isOnSale = selectedVariant
    ? (variantDiscountPrice && variantDiscountPrice < variantPrice)
    : (salePrice && salePrice < basePrice);

  // Stock info
  const currentStock = selectedVariant
    ? (selectedVariant.stock || 0)
    : (product.attributes.stock || 0);
  const isOutOfStock = !isService && currentStock <= 0;
  const isLowStock = !isService && currentStock > 0 && currentStock <= 3;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    showToast(`${product.attributes.nome} aggiunto al carrello!`, 'success');
    onClose();
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl relative overflow-hidden flex flex-col animate-fade-in-up max-h-[90vh] lg:max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col h-full overflow-y-auto">
          {/* Top Section Wrapper */}
          <div className="w-full flex flex-col lg:flex-row shrink-0">

            {/* Column 1: Image Carousel (50%) */}
            <div className="w-full lg:w-1/2 h-72 lg:h-[500px] min-h-[300px] relative bg-stone-50 flex flex-col items-center justify-center pt-20 pb-8 px-8 select-none group border-r border-stone-100">

              <img
                src={allImages[currentImageIndex]}
                alt={`${product.attributes.nome} view ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain drop-shadow-xl rounded-lg transition-opacity duration-300"
              />

              {/* Sale Badge */}
              {isOnSale && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg z-10">
                  <Tag size={14} /> SALDI
                </div>
              )}

              {/* Carousel Arrows (Only if > 1 image) */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-600 p-2.5 rounded-full shadow-md lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Immagine precedente"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-600 p-2.5 rounded-full shadow-md lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Immagine successiva"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 flex gap-2 z-10">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                          ? 'bg-nature-600 w-6'
                          : 'bg-stone-300 hover:bg-stone-400'
                          }`}
                        aria-label={`Vai all'immagine ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Column 2: Actions & Info (50%) */}
            <div className="w-full lg:w-1/2 p-8 flex flex-col bg-white">
              <div className="mb-6">
                <span className="text-xs font-bold text-nature-600 uppercase tracking-wider bg-nature-50 px-2 py-1 rounded-md">
                  {product.attributes.categoria}
                </span>
                <h2 className="font-display text-3xl font-bold text-stone-900 mt-3 mb-4 leading-tight">
                  {product.attributes.nome}
                </h2>

                {/* Variants Selection */}
                {product.attributes.varianti && product.attributes.varianti.length > 0 && (
                  <div className="mb-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Scegli Formato</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.attributes.varianti.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center min-w-[80px] ${selectedVariant?.id === variant.id
                            ? 'border-nature-500 bg-white text-nature-700 shadow-md transform scale-105'
                            : 'border-transparent bg-white text-stone-600 hover:border-stone-200'
                            }`}
                        >
                          {variant.nome_variante}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price & Actions */}
                <div className="mt-auto pt-4 border-t border-stone-100">
                  <div className="flex flex-col gap-6">

                    {/* Price Display */}
                    <div>
                      <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Prezzo Totale</span>
                      <div className="flex flex-col mt-1">
                        {isOnSale && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-stone-400 line-through font-medium">
                              €{((selectedVariant ? variantPrice : effectiveBasePrice) * quantity).toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              -{Math.round((((selectedVariant ? variantPrice : effectiveBasePrice) - finalPrice) / (selectedVariant ? variantPrice : effectiveBasePrice)) * 100)}%
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2">
                          <div className={`text-5xl font-bold font-display leading-none ${isOnSale ? 'text-red-600' : 'text-nature-700'}`}>
                            €{(finalPrice * quantity).toFixed(2)}
                          </div>
                        </div>

                        {/* Price per Kg Calculation */}
                        {selectedVariant?.peso_kg && (
                          <div className="text-sm text-stone-500 font-medium mt-1">
                            €{(finalPrice / selectedVariant.peso_kg).toFixed(2)} / kg
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    {!isService ? (
                      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
                        <span className="text-sm font-bold text-stone-500 ml-2">Quantità</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600 text-xl"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-xl text-stone-800">{quantity}</span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600 text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-ocean-50 text-ocean-700 px-4 py-3 rounded-xl text-sm font-bold border border-ocean-100 uppercase tracking-wider flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-ocean-500 rounded-full animate-pulse"></span>
                        1 Sessione
                      </div>
                    )}

                    {/* Stock Status */}
                    {!isService && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
                        isOutOfStock ? 'bg-red-50 text-red-600 border border-red-100' :
                        isLowStock ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                        'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {isOutOfStock ? (
                          <><AlertTriangle size={16} /> Esaurito</>
                        ) : isLowStock ? (
                          <><AlertTriangle size={16} /> Ultime {currentStock} unità disponibili!</>
                        ) : (
                          <><Package size={16} /> Disponibile</>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`w-full py-4 text-lg shadow-xl shadow-nature-200 hover:shadow-nature-300 transform hover:-translate-y-1 rounded-2xl ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ShoppingBag className="mr-2" size={20} />
                      {isService ? 'Prenota Servizio' : isOutOfStock ? 'Non Disponibile' : 'Aggiungi al Carrello'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Description (Full Width) */}
          <div className="w-full p-8 border-t border-stone-100 bg-stone-50/30">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Descrizione Prodotto</h3>
            <div className="prose prose-stone prose-sm text-stone-600 leading-relaxed max-w-none">
              {typeof product.attributes.descrizione === 'string' ? (
                <ReactMarkdown>{product.attributes.descrizione}</ReactMarkdown>
              ) : (
                'Descrizione non disponibile per questo formato.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
