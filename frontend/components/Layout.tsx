
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../services/cartContext';
import { useWishlist } from '../services/wishlistContext';
import { useAuth } from '../services/authContext';
import { ShoppingBag, Fish, User, Heart, LogIn, MapPin, Search, X, Loader2, ArrowRight, Tag, Clock, Mail, Phone, Package, Menu, ChevronDown, Home as HomeIcon, Store, Wrench } from 'lucide-react';
import { CartDrawer } from './CartDrawer';
import { AiAdvisor } from './AiAdvisor';
import { Product } from '../types';
import { searchProductsPreview } from '../services/strapi';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live Search State
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<{ type: string, label: string, filter: string }[]>([]);

  // Cart badge bounce
  const [cartBounce, setCartBounce] = useState(false);
  const prevItemCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 400);
    }
    prevItemCount.current = itemCount;
  }, [itemCount]);

  // Footer accordion (mobile)
  const [openFooterSection, setOpenFooterSection] = useState<string | null>(null);
  const toggleFooterSection = (section: string) => {
    setOpenFooterSection(prev => prev === section ? null : section);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <HomeIcon size={20} /> },
    { path: '/shop', label: 'Negozio', icon: <Store size={20} /> },
    { path: '/services', label: 'Servizi', icon: <Wrench size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname === path;
  };

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Debounced Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);

        const lowerTerm = searchTerm.toLowerCase();
        const newSmartSuggestions = [];

        if ('cane'.includes(lowerTerm) || lowerTerm.includes('cane') || lowerTerm.includes('dog')) {
          newSmartSuggestions.push({ type: 'Animale', label: 'Prodotti per Cani', filter: 'Cane' });
        }
        if ('gatto'.includes(lowerTerm) || lowerTerm.includes('gatto') || lowerTerm.includes('cat')) {
          newSmartSuggestions.push({ type: 'Animale', label: 'Prodotti per Gatti', filter: 'Gatto' });
        }
        if ('pesci'.includes(lowerTerm) || lowerTerm.includes('pesci') || lowerTerm.includes('acquario')) {
          newSmartSuggestions.push({ type: 'Animale', label: 'Prodotti per Pesci & Acquari', filter: 'Pesci' });
        }
        if ('cibo'.includes(lowerTerm) || lowerTerm.includes('mangime')) {
          newSmartSuggestions.push({ type: 'Categoria', label: 'Tutto il Cibo', filter: 'Cibo' });
        }
        if ('servizi'.includes(lowerTerm) || lowerTerm.includes('manutenzione')) {
          newSmartSuggestions.push({ type: 'Categoria', label: 'Servizi Professionali', filter: 'Servizi' });
        }
        setSmartSuggestions(newSmartSuggestions);

        const results = await searchProductsPreview(searchTerm);
        setSuggestions(results);

        setIsSearching(false);
      } else {
        setSuggestions([]);
        setSmartSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsSearchOpen(false);
    }
  };

  const handleSuggestionClick = (id: number) => {
    const product = suggestions.find(p => p.id === id);
    if (product) {
      navigate(`/product/${product.id}`, { state: { product } });
    }
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleSmartSuggestionClick = (filter: string) => {
    navigate(`/shop?filter=${filter}`);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Notification */}
      <div className="bg-gradient-to-r from-nature-800 via-nature-900 to-nature-800 text-white text-center py-2 text-[11px] sm:text-xs font-bold px-4 flex flex-col sm:flex-row justify-center gap-1.5 sm:gap-5 tracking-wide relative z-50">
        <span className="flex items-center justify-center gap-1.5">
          <Package size={15} className="text-nature-300" /> Spedizione gratuita per ordini oltre €99
        </span>
        <span className="hidden sm:inline opacity-40">|</span>
        <span className="flex items-center justify-center gap-1.5">
          <MapPin size={15} className="text-birillo-yellow" />
          <span className="sm:hidden">Consegna a Domicilio — <span className="text-birillo-yellow">Provincia di Teramo</span></span>
          <span className="hidden sm:inline">Consegna a Domicilio in Giornata disponibile in <span className="text-birillo-yellow font-extrabold underline underline-offset-2">Provincia di Teramo</span>!</span>
        </span>
      </div>

      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20 gap-2 md:gap-4">
            {/* Hamburger (Mobile Only) */}
            <button
              className="md:hidden p-2.5 text-stone-600 hover:text-nature-600 hover:bg-nature-50 rounded-xl transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-2 border-white/20 overflow-hidden bg-white">
                <img src="/logo.png" alt="Birillo Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-xl md:text-2xl text-nature-600 tracking-tight group-hover:text-nature-700 transition-colors">
                  BIRILLO
                </span>
                <span className="text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-widest">Pet Shop</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8 flex-1 justify-center lg:justify-start lg:pl-12">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group relative text-sm font-bold uppercase tracking-wide transition-colors duration-300 hover:text-nature-600 py-1 ${isActive(link.path) ? 'text-nature-700' : 'text-stone-500'
                    }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-1/2 h-0.5 bg-nature-600 rounded-full transition-all duration-300 -translate-x-1/2 ${
                      isActive(link.path)
                        ? 'w-full opacity-100'
                        : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Search — nascosto nella pagina Negozio perché c'è già la barra di ricerca */}
              {location.pathname !== '/shop' && (
                <button
                  className={`p-2.5 transition-colors rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center ${isSearchOpen ? 'bg-nature-50 text-nature-600' : 'text-stone-500 hover:text-nature-600'}`}
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label={isSearchOpen ? "Chiudi ricerca" : "Cerca"}
                >
                  {isSearchOpen ? <X size={22} /> : <Search size={22} />}
                </button>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden sm:flex relative p-2.5 text-stone-500 hover:text-birillo-red hover:bg-red-50 rounded-full transition-all min-w-[44px] min-h-[44px] items-center justify-center"
                aria-label={`Preferiti${wishlistIds.length > 0 ? ` (${wishlistIds.length})` : ''}`}
              >
                <Heart size={22} className={wishlistIds.length > 0 ? "fill-birillo-red text-birillo-red" : ""} />
                {wishlistIds.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-birillo-red rounded-full ring-2 ring-white"></span>
                )}
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <Link
                  to="/account"
                  className="hidden sm:flex items-center gap-2 text-stone-500 hover:text-nature-600 hover:bg-nature-50 rounded-full pr-3 pl-2 py-1.5 transition-all border border-transparent hover:border-nature-100 min-h-[44px]"
                >
                  <div className="w-8 h-8 bg-nature-100 text-nature-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                  <span className="hidden lg:inline font-bold text-sm">{user?.username}</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 text-stone-500 hover:text-nature-600 font-bold text-sm p-2.5 transition-colors min-w-[44px] min-h-[44px] justify-center"
                >
                  <LogIn size={22} />
                  <span className="hidden lg:inline">Accedi</span>
                </Link>
              )}

              {/* Cart */}
              <button
                className="relative p-2.5 text-stone-500 hover:text-nature-600 transition-colors hover:bg-nature-50 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Carrello${itemCount > 0 ? ` (${itemCount} articoli)` : ''}`}
              >
                <ShoppingBag size={22} />
                {itemCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 w-5 h-5 bg-nature-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white ${cartBounce ? 'cart-badge-bounce' : ''}`}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay + Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50" style={{ top: 0 }}>
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Panel */}
            <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-2xl mobile-menu-enter flex flex-col">
              {/* Menu Header */}
              <div className="p-5 border-b border-nature-100 flex items-center justify-between bg-gradient-to-br from-nature-50 to-emerald-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white shadow">
                    <img src="/logo.png" alt="Birillo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-display font-extrabold text-lg text-nature-600">BIRILLO</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-white transition-all"
                  aria-label="Chiudi menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto py-2">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-5 py-4 text-base font-bold transition-all ${isActive(link.path)
                      ? 'text-nature-600 bg-gradient-to-r from-nature-50 to-transparent border-r-4 border-nature-600'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-nature-600'
                      }`}
                  >
                    <span className={isActive(link.path) ? 'text-nature-600' : 'text-stone-400'}>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}

                <div className="border-t border-stone-100 mt-2 pt-2">
                  <Link
                    to="/wishlist"
                    className={`flex items-center gap-3 px-5 py-4 text-base font-bold transition-all ${isActive('/wishlist')
                      ? 'text-birillo-red bg-red-50 border-r-4 border-birillo-red'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-birillo-red'
                      }`}
                  >
                    <Heart size={20} className={wishlistIds.length > 0 ? 'fill-birillo-red text-birillo-red' : 'text-stone-400'} />
                    Preferiti
                    {wishlistIds.length > 0 && (
                      <span className="ml-auto bg-birillo-red text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {wishlistIds.length}
                      </span>
                    )}
                  </Link>

                  {isAuthenticated ? (
                    <Link
                      to="/account"
                      className={`flex items-center gap-3 px-5 py-4 text-base font-bold transition-all ${isActive('/account')
                        ? 'text-nature-600 bg-nature-50 border-r-4 border-nature-600'
                        : 'text-stone-600 hover:bg-stone-50 hover:text-nature-600'
                        }`}
                    >
                      <div className="w-7 h-7 bg-nature-100 text-nature-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {user?.username || 'Account'}
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-5 py-4 text-base font-bold text-stone-600 hover:bg-stone-50 hover:text-nature-600 transition-all"
                    >
                      <LogIn size={20} className="text-stone-400" />
                      Accedi
                    </Link>
                  )}
                </div>
              </div>

              {/* Menu Footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <div className="flex justify-center gap-3 mb-2">
                  <a href="https://www.facebook.com/" target="_blank" rel="noreferrer"
                     className="w-8 h-8 bg-stone-200 hover:bg-nature-100 rounded-full flex items-center justify-center text-stone-500 hover:text-nature-600 transition-all" aria-label="Facebook">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"
                     className="w-8 h-8 bg-stone-200 hover:bg-nature-100 rounded-full flex items-center justify-center text-stone-500 hover:text-nature-600 transition-all" aria-label="Instagram">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://wa.me/390861210515" target="_blank" rel="noreferrer"
                     className="w-8 h-8 bg-stone-200 hover:bg-green-100 rounded-full flex items-center justify-center text-stone-500 hover:text-green-600 transition-all" aria-label="WhatsApp">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                </div>
                <p className="text-[11px] text-stone-400 text-center">Birillo Pet Shop - Teramo</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-sm border-t border-stone-100 shadow-xl py-4 md:py-6 px-4 animate-fade-in -z-10 max-h-[80vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search size={20} className="absolute left-4 text-nature-600 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cerca prodotti, cibo, accessori..."
                  className="w-full bg-stone-50 text-stone-800 text-base md:text-lg rounded-full py-3.5 pl-12 pr-12 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-400 focus:bg-white transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 text-stone-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X size={18} />
                  </button>
                )}
              </form>

              {searchTerm.length > 1 && (
                <div className="mt-3 bg-white rounded-2xl border border-stone-100 shadow-xl overflow-hidden animate-fade-in-up">
                  {isSearching ? (
                    <div className="p-6 flex items-center justify-center text-stone-500 gap-2">
                      <Loader2 className="animate-spin" size={20} /> Cercando...
                    </div>
                  ) : (
                    <>
                      {smartSuggestions.length > 0 && (
                        <div className="p-2.5 border-b border-stone-50 bg-nature-50/50 flex flex-wrap gap-2">
                          {smartSuggestions.map((sg, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSmartSuggestionClick(sg.filter)}
                              className="text-xs font-bold flex items-center gap-1 bg-white border border-nature-100 text-nature-700 px-3 py-2 rounded-full hover:bg-nature-100 transition-colors min-h-[36px]"
                            >
                              <Tag size={12} /> {sg.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.length > 0 ? (
                        <div>
                          <div className="p-2">
                            <h4 className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Prodotti</h4>
                            {suggestions.map(product => (
                              <div
                                key={product.id}
                                onClick={() => handleSuggestionClick(product.id)}
                                className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl cursor-pointer transition-colors min-h-[56px]"
                              >
                                <img
                                  src={product.attributes.immagine}
                                  alt={product.attributes.nome}
                                  className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                                  onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'w-12 h-12 rounded-lg bg-stone-200'; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-stone-800 text-sm truncate">{product.attributes.nome}</h5>
                                  <span className="text-xs text-stone-500">{product.attributes.categoria}</span>
                                </div>
                                <div className="font-bold text-nature-600 text-sm flex-shrink-0">
                                  €{product.attributes.prezzo_scontato
                                    ? product.attributes.prezzo_scontato.toFixed(2)
                                    : product.attributes.prezzo.toFixed(2)
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSearchSubmit()}
                            className="w-full bg-stone-50 p-3.5 text-center text-sm font-bold text-nature-600 hover:bg-stone-100 transition-colors border-t border-stone-100 flex items-center justify-center gap-1 min-h-[48px]"
                          >
                            Vedi tutti i risultati <ArrowRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-stone-500 font-medium">Nessun prodotto trovato per "{searchTerm}"</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      {/* Decorative Wave Divider */}
      <div className="relative -mb-1">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="#064e3b" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-nature-900 to-[#032b1d] text-nature-100 pt-12 md:pt-16 pb-8 relative overflow-hidden">
        {/* Decorative blur blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-nature-800/30 rounded-full blur-3xl -mr-48 -mt-24 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-900/20 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Desktop Footer Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-nature-700 shadow-lg">
                  <img src="/logo.png" alt="Birillo Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-2xl text-white block leading-none">BIRILLO</span>
                  <span className="text-nature-400 text-xs font-bold uppercase tracking-widest">Pet Shop · Teramo</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-5 text-nature-200/80">
                Il punto di riferimento per chi ama la natura.
                Professionalità, passione e i migliori prodotti per i tuoi amici animali.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer"
                   className="w-9 h-9 bg-nature-800 hover:bg-nature-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"
                   className="w-9 h-9 bg-nature-800 hover:bg-nature-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://wa.me/390861210515" target="_blank" rel="noreferrer"
                   className="w-9 h-9 bg-nature-800 hover:bg-green-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="WhatsApp">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>

            {/* Orari */}
            <div>
              <h4 className="text-white font-display font-bold mb-1 text-lg flex items-center gap-2">
                <Clock size={18} className="text-nature-400" /> Orari
              </h4>
              <div className="w-8 h-0.5 bg-nature-500 rounded-full mb-4" />
              <ul className="space-y-2 text-sm font-medium opacity-80">
                <li className="flex justify-between border-b border-nature-800 pb-1">
                  <span className="text-nature-200">Lun - Mer</span>
                  <span className="text-right">08-13, 15:30-19:30</span>
                </li>
                <li className="flex justify-between border-b border-nature-800 pb-1">
                  <span className="text-nature-200">Giovedì</span>
                  <span className="text-right">08-13, 15:30-19:00</span>
                </li>
                <li className="flex justify-between border-b border-nature-800 pb-1">
                  <span className="text-nature-200">Ven - Sab</span>
                  <span className="text-right">08-13, 15:30-19:30</span>
                </li>
                <li className="flex justify-between pt-1 text-birillo-red font-bold">
                  <span>Domenica</span>
                  <span>Chiuso</span>
                </li>
              </ul>
            </div>

            {/* Servizi */}
            <div>
              <h4 className="text-white font-display font-bold mb-1 text-lg flex items-center gap-2">
                <Wrench size={18} className="text-nature-400" /> Servizi
              </h4>
              <div className="w-8 h-0.5 bg-nature-500 rounded-full mb-4" />
              <ul className="space-y-3 text-sm font-medium opacity-80">
                <li><Link to="/services" className="hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1.5 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-nature-400" />Installazione Acquario su Misura</Link></li>
                <li><Link to="/services" className="hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1.5 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-nature-400" />Manutenzione Mensile</Link></li>
                <li><Link to="/services" className="hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1.5 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-nature-400" />Consegna a Domicilio</Link></li>
                <li><Link to="/services" className="hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1.5 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-nature-400" />Ritiro in Negozio</Link></li>
                <li><Link to="/services" className="hover:text-white transition-all duration-200 hover:translate-x-1 inline-flex items-center gap-1.5 group"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-nature-400" />Spedizione in tutta Italia</Link></li>
              </ul>
            </div>

            {/* Contatti */}
            <div>
              <h4 className="text-white font-display font-bold mb-1 text-lg flex items-center gap-2">
                <Phone size={18} className="text-nature-400" /> Contatti
              </h4>
              <div className="w-8 h-0.5 bg-nature-500 rounded-full mb-4" />
              <ul className="space-y-4 text-sm font-medium opacity-80">
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Birillo+Pet+Shop+Via+Po+26+Teramo"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 hover:text-white transition-colors group"
                  >
                    <MapPin size={18} className="mt-0.5 text-nature-300 group-hover:text-white flex-shrink-0" />
                    <span>Via Po 26/28,<br />Piazza Aldo Moro,<br />64100 Teramo (TE)</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:birillopetshop@hotmail.it" className="flex items-center gap-3 hover:text-white transition-colors group">
                    <Mail size={18} className="text-nature-300 group-hover:text-white flex-shrink-0" />
                    <span className="break-all">birillopetshop@hotmail.it</span>
                  </a>
                </li>
                <li>
                  <a href="tel:+390861210515" className="flex items-center gap-3 hover:text-white transition-colors group">
                    <Phone size={18} className="text-nature-300 group-hover:text-white flex-shrink-0" />
                    <span>0861 210515</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter CTA - Desktop */}
          <div className="hidden md:block mb-12">
            <div className="bg-nature-800/50 backdrop-blur-sm rounded-2xl p-8 flex items-center justify-between gap-8 border border-nature-700/30">
              <div className="flex-shrink-0">
                <h4 className="text-white font-display font-bold text-lg mb-1">Resta Aggiornato</h4>
                <p className="text-nature-300 text-sm">Iscriviti per offerte esclusive e consigli per i tuoi animali.</p>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 flex-1 max-w-md">
                <input
                  type="email"
                  placeholder="La tua email..."
                  className="flex-1 bg-nature-900/50 border border-nature-700 text-white placeholder-nature-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="bg-nature-600 hover:bg-nature-500 text-white font-bold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-nature-600/20 flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <Mail size={16} /> Iscriviti
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="md:hidden space-y-0 mb-8">
            {/* Brand (always visible on mobile) */}
            <div className="py-5 border-b border-nature-800/60">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-nature-700 shadow-lg">
                  <img src="/logo.png" alt="Birillo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-xl text-white block leading-none">BIRILLO</span>
                  <span className="text-nature-400 text-[10px] font-bold uppercase tracking-widest">Pet Shop · Teramo</span>
                </div>
              </div>
              <p className="text-sm text-nature-200/70 leading-relaxed mb-3">
                Il punto di riferimento per chi ama la natura. Professionalità, passione e i migliori prodotti.
              </p>
              {/* Social (mobile) */}
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer"
                   className="w-8 h-8 bg-nature-800 hover:bg-nature-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="Facebook">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"
                   className="w-8 h-8 bg-nature-800 hover:bg-nature-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="Instagram">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://wa.me/390861210515" target="_blank" rel="noreferrer"
                   className="w-8 h-8 bg-nature-800 hover:bg-green-700 rounded-full flex items-center justify-center text-nature-300 hover:text-white transition-all" aria-label="WhatsApp">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>

            {/* Newsletter CTA - Mobile */}
            <div className="py-4 border-b border-nature-800/60">
              <div className="bg-nature-800/50 rounded-2xl p-5 border border-nature-700/30">
                <h4 className="text-white font-display font-bold text-base mb-1">Resta Aggiornato</h4>
                <p className="text-nature-300 text-xs mb-3">Offerte esclusive e consigli per i tuoi animali.</p>
                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="La tua email..."
                    className="flex-1 bg-nature-900/50 border border-nature-700 text-white placeholder-nature-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400 transition-all min-w-0"
                  />
                  <button type="submit" className="bg-nature-600 hover:bg-nature-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm flex-shrink-0">
                    <Mail size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Orari Accordion */}
            <button
              onClick={() => toggleFooterSection('orari')}
              className="flex items-center justify-between w-full py-4 border-b border-nature-800/60 text-white font-bold text-base hover:bg-nature-800/20 transition-colors rounded-lg px-1"
            >
              <span className="flex items-center gap-2"><Clock size={16} className="text-nature-400" /> Orari</span>
              <ChevronDown size={18} className={`text-nature-400 transition-transform duration-300 ${openFooterSection === 'orari' ? 'rotate-180' : ''}`} />
            </button>
            {openFooterSection === 'orari' && (
              <div className="py-3 px-1 animate-fade-in text-sm space-y-2 opacity-80">
                <div className="flex justify-between"><span className="text-nature-200">Lun - Mer</span><span>08-13, 15:30-19:30</span></div>
                <div className="flex justify-between"><span className="text-nature-200">Giovedì</span><span>08-13, 15:30-19:00</span></div>
                <div className="flex justify-between"><span className="text-nature-200">Ven - Sab</span><span>08-13, 15:30-19:30</span></div>
                <div className="flex justify-between text-birillo-red font-bold"><span>Domenica</span><span>Chiuso</span></div>
              </div>
            )}

            {/* Servizi Accordion */}
            <button
              onClick={() => toggleFooterSection('servizi')}
              className="flex items-center justify-between w-full py-4 border-b border-nature-800/60 text-white font-bold text-base hover:bg-nature-800/20 transition-colors rounded-lg px-1"
            >
              <span className="flex items-center gap-2"><Wrench size={16} className="text-nature-400" /> Servizi</span>
              <ChevronDown size={18} className={`text-nature-400 transition-transform duration-300 ${openFooterSection === 'servizi' ? 'rotate-180' : ''}`} />
            </button>
            {openFooterSection === 'servizi' && (
              <div className="py-3 px-1 animate-fade-in text-sm space-y-3 opacity-80">
                <Link to="/services" className="block hover:text-white transition-colors">Installazione Acquario su Misura</Link>
                <Link to="/services" className="block hover:text-white transition-colors">Manutenzione Mensile</Link>
                <Link to="/services" className="block hover:text-white transition-colors">Consegna a Domicilio</Link>
                <Link to="/services" className="block hover:text-white transition-colors">Ritiro in Negozio</Link>
                <Link to="/services" className="block hover:text-white transition-colors">Spedizione in tutta Italia</Link>
              </div>
            )}

            {/* Contatti Accordion */}
            <button
              onClick={() => toggleFooterSection('contatti')}
              className="flex items-center justify-between w-full py-4 border-b border-nature-800/60 text-white font-bold text-base hover:bg-nature-800/20 transition-colors rounded-lg px-1"
            >
              <span className="flex items-center gap-2"><Phone size={16} className="text-nature-400" /> Contatti</span>
              <ChevronDown size={18} className={`text-nature-400 transition-transform duration-300 ${openFooterSection === 'contatti' ? 'rotate-180' : ''}`} />
            </button>
            {openFooterSection === 'contatti' && (
              <div className="py-3 px-1 animate-fade-in text-sm space-y-3 opacity-80">
                <a href="https://www.google.com/maps/search/?api=1&query=Birillo+Pet+Shop+Via+Po+26+Teramo" target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-white transition-colors">
                  <MapPin size={16} className="mt-0.5 text-nature-300 flex-shrink-0" />
                  <span>Via Po 26/28, Piazza Aldo Moro, 64100 Teramo (TE)</span>
                </a>
                <a href="mailto:birillopetshop@hotmail.it" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={16} className="text-nature-300 flex-shrink-0" />
                  birillopetshop@hotmail.it
                </a>
                <a href="tel:+390861210515" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={16} className="text-nature-300 flex-shrink-0" />
                  0861 210515
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Copyright Area */}
        <div className="border-t border-nature-800/60 pt-6 px-4 max-w-7xl mx-auto relative z-10">
          <p className="text-center text-xs text-nature-500/60">
            &copy; {new Date().getFullYear()} Birillo Pet Shop. Tutti i diritti riservati.
          </p>
        </div>
      </footer>

      <CartDrawer />
      <AiAdvisor />
    </div>
  );
};
