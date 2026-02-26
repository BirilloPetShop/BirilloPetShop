
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { fetchProductById } from '../services/strapi';
import { useCart } from '../services/cartContext';
import { useWishlist } from '../services/wishlistContext';
import { useToast } from '../services/toastContext';
import { Product, ProductVariant, CategoryData, VariantType } from '../types';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft, ChevronRight, ChevronRight as ChevronRightSmall,
  Home, ShoppingBag, Tag, Heart, Package, AlertTriangle,
  Truck, Store, Minus, Plus
} from 'lucide-react';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  // Dual-source loading: state from navigation or API fetch
  const passedProduct = (location.state as any)?.product as Product | undefined;

  const [product, setProduct] = useState<Product | null>(passedProduct || null);
  const [loading, setLoading] = useState(!passedProduct);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch product if no state passed (direct URL access)
  useEffect(() => {
    if (!passedProduct && id) {
      setLoading(true);
      fetchProductById(Number(id)).then(data => {
        if (data) {
          setProduct(data);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
    }
  }, [id, passedProduct]);

  // Auto-select first variant
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setCurrentImageIndex(0);
      if (product.attributes.varianti && product.attributes.varianti.length > 0) {
        setSelectedVariant(product.attributes.varianti[0]);
      } else {
        setSelectedVariant(undefined);
      }
    }
  }, [product]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb skeleton */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image skeleton */}
            <Skeleton className="aspect-square w-full rounded-2xl" />
            {/* Info skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --- NOT FOUND STATE ---
  if (notFound || !product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-stone-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={36} className="text-stone-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">Prodotto non trovato</h1>
          <p className="text-stone-500 mb-8">Il prodotto che cerchi non esiste o è stato rimosso.</p>
          <Button onClick={() => navigate('/shop')}>Torna al Negozio</Button>
        </div>
      </Layout>
    );
  }

  // --- PRODUCT DATA LOGIC ---
  const { attributes: attr } = product;
  const isService = attr.is_service;
  const basePrice = attr.prezzo;
  const salePrice = attr.prezzo_scontato;

  const allImages = [attr.immagine, ...(attr.galleria || [])].filter(Boolean);

  const effectiveBasePrice = salePrice || basePrice;
  const variantPrice = selectedVariant ? selectedVariant.prezzo : 0;
  const variantDiscountPrice = selectedVariant?.prezzo_scontato;

  let finalPrice = selectedVariant ? variantPrice : effectiveBasePrice;
  if (selectedVariant && variantDiscountPrice) {
    finalPrice = variantDiscountPrice;
  }

  const isOnSale = selectedVariant
    ? !!(variantDiscountPrice && variantDiscountPrice < variantPrice)
    : !!(salePrice && salePrice < basePrice);

  const originalPrice = selectedVariant ? variantPrice : basePrice;

  const discountPercent = isOnSale
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;

  const currentStock = selectedVariant
    ? (selectedVariant.stock || 0)
    : (attr.stock || 0);
  const isOutOfStock = !isService && currentStock <= 0;
  const isLowStock = !isService && currentStock > 0 && currentStock <= 3;

  const wishlisted = isInWishlist(product.id);

  // --- HANDLERS ---
  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    showToast(`${attr.nome} aggiunto al carrello!`, 'success');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    showToast(
      wishlisted ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti!',
      wishlisted ? 'info' : 'success'
    );
  };

  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % allImages.length);
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextImage() : prevImage();
    }
  };

  const hasDescription = attr.descrizione && attr.descrizione.trim().length > 0;
  const isLongDescription = hasDescription && attr.descrizione.length > 300;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8 lg:pt-6 lg:pb-16">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-5 lg:mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => navigate('/')} className="hover:text-nature-600 transition-colors flex items-center gap-1 flex-shrink-0">
            <Home size={14} /> <span className="hidden sm:inline">Home</span>
          </button>
          <ChevronRightSmall size={14} className="flex-shrink-0" />
          <button onClick={() => navigate('/shop')} className="hover:text-nature-600 transition-colors flex-shrink-0">
            Negozio
          </button>
          {/* Animal breadcrumb segment */}
          {attr.animali && attr.animali.length > 0 && attr.animali[0] !== 'Tutti' && (
            <>
              <ChevronRightSmall size={14} className="flex-shrink-0" />
              <button onClick={() => navigate(`/shop?animale=${encodeURIComponent(attr.animali[0])}`)} className="hover:text-nature-600 transition-colors flex-shrink-0">
                {attr.animali[0]}
              </button>
            </>
          )}
          {/* Category breadcrumb segments */}
          {(() => {
            // Build hierarchical breadcrumb from categoriaObj
            const chain: CategoryData[] = [];
            let current: CategoryData | null | undefined = attr.categoriaObj;
            while (current) {
              chain.unshift(current);
              current = current.parent;
            }
            if (chain.length > 0) {
              const animalName = attr.animali?.[0] || '';
              return chain.map((cat) => (
                <React.Fragment key={cat.id}>
                  <ChevronRightSmall size={14} className="flex-shrink-0" />
                  <button onClick={() => navigate(`/shop?animale=${encodeURIComponent(animalName)}&categoria=${encodeURIComponent(cat.nome)}`)} className="hover:text-nature-600 transition-colors flex-shrink-0">
                    {cat.nome}
                  </button>
                </React.Fragment>
              ));
            }
            // Fallback: use flat categoria string
            return (
              <>
                <ChevronRightSmall size={14} className="flex-shrink-0" />
                <button onClick={() => navigate(`/shop?categoria=${encodeURIComponent(attr.categoria)}`)} className="hover:text-nature-600 transition-colors flex-shrink-0">
                  {attr.categoria}
                </button>
              </>
            );
          })()}
          <ChevronRightSmall size={14} className="flex-shrink-0" />
          <span className="text-stone-700 font-semibold truncate max-w-[180px] sm:max-w-none">
            {attr.nome}
          </span>
        </nav>

        {/* MAIN GRID: Gallery + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">

          {/* GALLERY */}
          <div className="space-y-3">
            {/* Main Image */}
            <div
              className="relative bg-stone-50 rounded-2xl lg:rounded-3xl overflow-hidden aspect-square flex items-center justify-center group select-none border border-stone-100"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={allImages[currentImageIndex]}
                alt={`${attr.nome} — immagine ${currentImageIndex + 1}`}
                className="max-w-[85%] max-h-[85%] object-contain drop-shadow-lg transition-opacity duration-300"
              />

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-600 p-2.5 rounded-full shadow-md lg:opacity-0 lg:group-hover:opacity-100 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Immagine precedente"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-stone-600 p-2.5 rounded-full shadow-md lg:opacity-0 lg:group-hover:opacity-100 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Immagine successiva"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Dots (mobile) */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 flex gap-2 z-10 lg:hidden">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentImageIndex
                        ? 'bg-nature-600 w-6'
                        : 'bg-stone-300 w-2.5 hover:bg-stone-400'
                      }`}
                      aria-label={`Immagine ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails (desktop only) */}
            {allImages.length > 1 && (
              <div className="hidden lg:flex gap-3 overflow-x-auto scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-stone-50 ${idx === currentImageIndex
                      ? 'border-nature-500 shadow-md scale-105'
                      : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-bold text-nature-600 uppercase tracking-wider bg-nature-50 px-2.5 py-1 rounded-lg">
                {attr.categoria}
              </span>
              {attr.animali && attr.animali.filter(a => a !== 'Tutti').map(animal => (
                <button
                  key={animal}
                  onClick={() => navigate(`/shop?animale=${encodeURIComponent(animal)}`)}
                  className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  {animal}
                </button>
              ))}
              {isService && (
                <span className="text-xs font-bold text-ocean-700 uppercase tracking-wider bg-ocean-50 px-2.5 py-1 rounded-lg">
                  Servizio
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="font-display text-2xl lg:text-4xl font-bold text-stone-900 leading-tight mb-1">
              {attr.nome}
            </h1>

            {/* Brand (clickable) */}
            {attr.marca && (
              <button
                onClick={() => navigate(`/shop?marca=${encodeURIComponent(attr.marca!)}`)}
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-nature-600 transition-colors mb-4 group"
              >
                {attr.marcaObj?.logo && (
                  <img src={attr.marcaObj.logo} alt={attr.marca} className="w-5 h-5 object-contain rounded" />
                )}
                <span className="group-hover:underline">{attr.marca}</span>
              </button>
            )}
            {!attr.marca && <div className="mb-4" />}

            {/* Price Display */}
            <div className="mb-5">
              {isOnSale && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-stone-400 line-through text-lg font-medium">
                    €{(originalPrice * quantity).toFixed(2)}
                  </span>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                    -{discountPercent}%
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl lg:text-5xl font-bold font-display ${isOnSale ? 'text-red-600' : 'text-nature-700'}`}>
                  €{(finalPrice * quantity).toFixed(2)}
                </span>
                {quantity > 1 && (
                  <span className="text-stone-400 text-sm font-medium">
                    (€{finalPrice.toFixed(2)} cad.)
                  </span>
                )}
              </div>
              {!!(selectedVariant?.peso_kg && selectedVariant.peso_kg > 0) && (
                <p className="text-sm text-stone-500 font-medium mt-1">
                  €{(finalPrice / selectedVariant.peso_kg).toFixed(2)} / kg
                </p>
              )}
            </div>

            {/* Variant Selector — grouped by tipo_variante */}
            {attr.varianti && attr.varianti.length > 0 && (
              <div className="mb-5 space-y-4">
                {(() => {
                  // Group variants by type
                  const groups = new Map<string, ProductVariant[]>();
                  attr.varianti!.forEach(v => {
                    const type = v.tipo_variante || 'Peso';
                    if (!groups.has(type)) groups.set(type, []);
                    groups.get(type)!.push(v);
                  });

                  const typeLabels: Record<string, string> = {
                    'Peso': 'Scegli Peso',
                    'Colore': 'Scegli Colore',
                    'Taglia': 'Scegli Taglia',
                    'Formato': 'Scegli Formato',
                  };

                  const colorMap: Record<string, string> = {
                    'Rosso': '#EF4444', 'Blu': '#3B82F6', 'Verde': '#22C55E',
                    'Nero': '#1F2937', 'Bianco': '#F5F5F4', 'Giallo': '#EAB308',
                    'Rosa': '#EC4899', 'Arancione': '#F97316', 'Viola': '#8B5CF6',
                    'Marrone': '#92400E', 'Grigio': '#9CA3AF', 'Azzurro': '#38BDF8',
                    'Beige': '#D4A574', 'Crema': '#FFFDD0',
                  };

                  return Array.from(groups.entries()).map(([type, variants]) => (
                    <div key={type} className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                        {typeLabels[type] || `Scegli ${type}`}
                      </h3>

                      {type === 'Colore' ? (
                        /* Color swatches */
                        <div className="flex flex-wrap gap-3">
                          {variants.map(variant => {
                            const color = colorMap[variant.valore] || '#9CA3AF';
                            const isSelected = selectedVariant?.id === variant.id;
                            const isWhitish = ['Bianco', 'Crema', 'Beige'].includes(variant.valore);
                            return (
                              <button
                                key={variant.id}
                                onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                                  isSelected ? 'bg-white shadow-md scale-105 ring-2 ring-nature-500' : 'hover:bg-white/50'
                                }`}
                                title={variant.valore}
                              >
                                <div
                                  className={`w-10 h-10 rounded-full transition-all ${isWhitish ? 'border-2 border-stone-200' : 'border-2 border-transparent'} ${
                                    isSelected ? 'ring-2 ring-offset-2 ring-nature-500' : ''
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-medium text-stone-600">{variant.valore}</span>
                                {variant.prezzo > 0 && (
                                  variant.prezzo_scontato && variant.prezzo_scontato < variant.prezzo ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-stone-400 line-through">€{variant.prezzo.toFixed(2)}</span>
                                      <span className="text-[11px] font-bold text-red-600">€{variant.prezzo_scontato.toFixed(2)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-stone-400">
                                      €{variant.prezzo.toFixed(2)}
                                    </span>
                                  )
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Buttons for Peso/Taglia/Formato */
                        <div className="flex flex-wrap gap-2.5">
                          {variants.map(variant => (
                            <button
                              key={variant.id}
                              onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                              className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all min-w-[80px] text-center ${
                                selectedVariant?.id === variant.id
                                  ? 'border-nature-500 bg-white text-nature-700 shadow-md scale-105'
                                  : 'border-transparent bg-white text-stone-600 hover:border-stone-200'
                              }`}
                            >
                              {variant.valore || variant.nome_variante}
                              {variant.prezzo > 0 && (
                                variant.prezzo_scontato && variant.prezzo_scontato < variant.prezzo ? (
                                  <div className="flex flex-col items-center mt-0.5">
                                    <span className="text-[10px] text-stone-400 line-through">€{variant.prezzo.toFixed(2)}</span>
                                    <span className="text-xs font-bold text-red-600">€{variant.prezzo_scontato.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <span className="block text-xs mt-0.5 font-medium text-stone-400">
                                    €{variant.prezzo.toFixed(2)}
                                  </span>
                                )
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Stock Status */}
            {!isService && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mb-5 ${
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

            {/* Quantity + Add to Cart (desktop) */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto">
              {!isService && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
                  <span className="text-sm font-bold text-stone-500 ml-2">Quantità</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center font-bold text-xl text-stone-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 text-lg shadow-xl shadow-nature-200 hover:shadow-nature-300 transform hover:-translate-y-1 rounded-2xl ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ShoppingBag className="mr-2" size={20} />
                  {isService ? 'Prenota Servizio' : isOutOfStock ? 'Non Disponibile' : 'Aggiungi al Carrello'}
                </Button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all flex-shrink-0 ${wishlisted
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-500'
                  }`}
                  aria-label={wishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                >
                  <Heart size={22} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Mobile Quantity (only visible on mobile, above sticky bar context) */}
            <div className="lg:hidden mb-4">
              {!isService && (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
                  <span className="text-sm font-bold text-stone-500 ml-2">Quantità</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center font-bold text-xl text-stone-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-all font-bold text-stone-600"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        {hasDescription && (
          <section className="mt-10 lg:mt-14">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-stone-900 mb-4">Descrizione Prodotto</h2>
            <div className={`relative ${!descExpanded && isLongDescription ? 'max-h-[200px] overflow-hidden' : ''}`}>
              <div className="prose prose-stone prose-sm lg:prose-base text-stone-600 leading-relaxed max-w-none">
                {typeof attr.descrizione === 'string' ? (
                  <ReactMarkdown>{attr.descrizione}</ReactMarkdown>
                ) : (
                  'Descrizione non disponibile per questo formato.'
                )}
              </div>
              {!descExpanded && isLongDescription && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            {isLongDescription && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-3 text-nature-600 font-bold text-sm hover:text-nature-700 transition-colors"
              >
                {descExpanded ? 'Mostra meno' : 'Leggi tutto'}
              </button>
            )}
          </section>
        )}

        {/* DELIVERY INFO */}
        <section className="mt-10 lg:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-4 p-5 bg-nature-50 rounded-2xl border border-nature-100">
            <div className="bg-nature-100 p-3 rounded-xl flex-shrink-0">
              <Truck size={24} className="text-nature-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 mb-1">Consegna a Domicilio</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Disponibile in provincia di Teramo. Consegna rapida e gestita dal nostro team.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="bg-stone-200 p-3 rounded-xl flex-shrink-0">
              <Store size={24} className="text-stone-600" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 mb-1">Ritiro in Negozio</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Ritira gratuitamente presso il nostro punto vendita. Preparazione in giornata.
              </p>
            </div>
          </div>
        </section>

        {/* Spacer for mobile sticky bar */}
        <div className="h-28 lg:hidden" />
      </div>

      {/* STICKY MOBILE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all flex-shrink-0 ${wishlisted
              ? 'bg-red-50 border-red-200 text-red-500'
              : 'bg-white border-stone-200 text-stone-400'
            }`}
            aria-label={wishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Price */}
          <div className="flex-1 min-w-0">
            <span className={`text-xl font-bold font-display ${isOnSale ? 'text-red-600' : 'text-nature-700'}`}>
              €{(finalPrice * quantity).toFixed(2)}
            </span>
            {quantity > 1 && (
              <span className="text-xs text-stone-400 ml-1">×{quantity}</span>
            )}
          </div>

          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-6 py-3 text-base rounded-xl shadow-lg flex-shrink-0 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ShoppingBag size={18} className="mr-1.5" />
            {isService ? 'Prenota' : isOutOfStock ? 'Esaurito' : 'Aggiungi'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};
