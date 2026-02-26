import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { SkeletonGrid } from '../components/Skeleton';
import { fetchProducts, fetchCategories, fetchAnimals } from '../services/strapi';
import { Product } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, X, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, ArrowUpDown, Home, LayoutGrid, Grid3x3, Grid2x2,
  PackageSearch, Tag
} from 'lucide-react';

// ─── Constants ───
const PRODUCTS_PER_PAGE = 24;

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'sale';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Rilevanza' },
  { value: 'price-asc', label: 'Prezzo: basso → alto' },
  { value: 'price-desc', label: 'Prezzo: alto → basso' },
  { value: 'name-asc', label: 'Nome (A-Z)' },
  { value: 'sale', label: 'Solo Offerte' },
];

// ─── Error Boundary ───
interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Shop Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Qualcosa è andato storto.</h2>
            <p className="text-stone-600 mb-6">Non siamo riusciti a caricare il negozio.</p>
            <button onClick={() => window.location.reload()} className="bg-nature-600 text-white px-6 py-3 rounded-xl hover:bg-nature-700 transition-colors font-bold shadow-lg">
              Ricarica la Pagina
            </button>
          </div>
        </Layout>
      );
    }
    return this.props.children;
  }
}

export const Shop: React.FC = () => (
  <ErrorBoundary><ShopContent /></ErrorBoundary>
);

// ─── Main Component ───
const ShopContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [animalsList, setAnimalsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAnimal, setActiveAnimal] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // UI
  const [viewMode, setViewMode] = useState<2 | 3 | 4>(3);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    categorie: false, animale: false, prezzo: false, offerte: false,
  });

  // ─── Data Loading ───
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, c, a] = await Promise.all([
          fetchProducts().catch(() => []),
          fetchCategories().catch(() => []),
          fetchAnimals().catch(() => []),
        ]);
        setProducts(p || []);
        setCategoriesList(c || []);
        setAnimalsList(a || []);
      } catch (e) {
        console.error('Error loading shop data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── URL Params ───
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    const searchParam = params.get('search');
    if (filterParam) setActiveCategory(filterParam);
    else setActiveCategory('All');
    if (searchParam) { setSearchQuery(searchParam); setLocalSearch(searchParam); }
    else { setSearchQuery(''); setLocalSearch(''); }
  }, [location.search]);

  // ─── Debounced Search ───
  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(localSearch); }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // ─── Reset page on filter change ───
  useEffect(() => { setCurrentPage(1); }, [activeCategory, activeAnimal, searchQuery, sortBy, priceMin, priceMax, onSaleOnly]);

  // ─── Filtering + Sorting ───
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (!p || !p.attributes) return false;
      const { categoria, animale, nome, descrizione, prezzo, prezzo_scontato } = p.attributes;

      const catMatch = activeCategory === 'All' || categoria === activeCategory;
      const animalMatch = activeAnimal === 'All' || animale === activeAnimal;

      const searchLower = searchQuery.toLowerCase();
      const nameStr = (typeof nome === 'string') ? nome.toLowerCase() : '';
      const descStr = (typeof descrizione === 'string') ? descrizione.toLowerCase() : '';
      const searchMatch = !searchQuery || nameStr.includes(searchLower) || descStr.includes(searchLower);

      const effectivePrice = (prezzo_scontato && prezzo_scontato < prezzo) ? prezzo_scontato : prezzo;
      const min = priceMin ? parseFloat(priceMin) : null;
      const max = priceMax ? parseFloat(priceMax) : null;
      const priceMatch = (min === null || isNaN(min) || effectivePrice >= min) && (max === null || isNaN(max) || effectivePrice <= max);

      const saleMatch = !onSaleOnly || (prezzo_scontato !== undefined && prezzo_scontato !== null && prezzo_scontato < prezzo);

      return catMatch && animalMatch && searchMatch && priceMatch && saleMatch;
    });

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => (a.attributes.prezzo_scontato || a.attributes.prezzo) - (b.attributes.prezzo_scontato || b.attributes.prezzo));
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => (b.attributes.prezzo_scontato || b.attributes.prezzo) - (a.attributes.prezzo_scontato || a.attributes.prezzo));
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => (a.attributes.nome || '').localeCompare(b.attributes.nome || ''));
        break;
      case 'sale':
        result = result.filter(p => p.attributes.prezzo_scontato && p.attributes.prezzo_scontato < p.attributes.prezzo);
        break;
    }
    return result;
  }, [products, activeCategory, activeAnimal, searchQuery, sortBy, priceMin, priceMax, onSaleOnly]);

  // ─── Pagination ───
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    if (gridTopRef.current) {
      const top = gridTopRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, [totalPages]);

  // ─── Helpers ───
  const clearAllFilters = () => {
    setActiveCategory('All'); setActiveAnimal('All');
    setSearchQuery(''); setLocalSearch('');
    setSortBy('default'); setPriceMin(''); setPriceMax('');
    setOnSaleOnly(false);
    navigate('/shop');
  };

  const toggleSection = (s: string) => setCollapsedSections(prev => ({ ...prev, [s]: !prev[s] }));

  const hasActiveFilters = activeCategory !== 'All' || activeAnimal !== 'All' || searchQuery !== '' || sortBy !== 'default' || priceMin !== '' || priceMax !== '' || onSaleOnly;

  const activeFilterCount = [activeCategory !== 'All', activeAnimal !== 'All', sortBy !== 'default', priceMin !== '', priceMax !== '', onSaleOnly].filter(Boolean).length;

  const getGridClass = () => {
    switch (viewMode) {
      case 2: return 'grid-cols-2';
      case 4: return 'grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-2 lg:grid-cols-3';
    }
  };

  // ─── Sidebar Content (shared desktop + mobile) ───
  const SidebarContent = () => (
    <div className="space-y-1">
      {/* Categorie */}
      <button onClick={() => toggleSection('categorie')} className="flex items-center justify-between w-full py-3 text-xs font-bold text-stone-800 uppercase tracking-wider">
        Categorie
        <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${collapsedSections.categorie ? '' : 'rotate-180'}`} />
      </button>
      {!collapsedSections.categorie && (
        <div className="space-y-0.5 pb-4">
          <SidebarFilterItem label="Tutti i Prodotti" isActive={activeCategory === 'All'} onClick={() => setActiveCategory('All')} />
          {categoriesList.map(cat => (
            <SidebarFilterItem key={cat} label={cat} isActive={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
          ))}
        </div>
      )}
      <div className="border-b border-stone-100" />

      {/* Animale */}
      <button onClick={() => toggleSection('animale')} className="flex items-center justify-between w-full py-3 text-xs font-bold text-stone-800 uppercase tracking-wider">
        Animale
        <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${collapsedSections.animale ? '' : 'rotate-180'}`} />
      </button>
      {!collapsedSections.animale && (
        <div className="space-y-0.5 pb-4">
          <SidebarFilterItem label="Tutti" isActive={activeAnimal === 'All'} onClick={() => setActiveAnimal('All')} />
          {animalsList.map(a => (
            <SidebarFilterItem key={a} label={a} isActive={activeAnimal === a} onClick={() => setActiveAnimal(a)} />
          ))}
        </div>
      )}
      <div className="border-b border-stone-100" />

      {/* Prezzo */}
      <button onClick={() => toggleSection('prezzo')} className="flex items-center justify-between w-full py-3 text-xs font-bold text-stone-800 uppercase tracking-wider">
        Prezzo
        <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${collapsedSections.prezzo ? '' : 'rotate-180'}`} />
      </button>
      {!collapsedSections.prezzo && (
        <div className="pb-4 space-y-3">
          <div className="flex gap-2">
            <input type="number" placeholder="Min €" value={priceMin} onChange={e => setPriceMin(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400" />
            <input type="number" placeholder="Max €" value={priceMax} onChange={e => setPriceMax(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400" />
          </div>
        </div>
      )}
      <div className="border-b border-stone-100" />

      {/* Solo Offerte */}
      <button onClick={() => toggleSection('offerte')} className="flex items-center justify-between w-full py-3 text-xs font-bold text-stone-800 uppercase tracking-wider">
        Offerte
        <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${collapsedSections.offerte ? '' : 'rotate-180'}`} />
      </button>
      {!collapsedSections.offerte && (
        <div className="pb-4">
          <label className="flex items-center justify-between cursor-pointer py-2">
            <span className="text-sm text-stone-600">Mostra solo offerte</span>
            <div onClick={() => setOnSaleOnly(!onSaleOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${onSaleOnly ? 'bg-nature-600' : 'bg-stone-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${onSaleOnly ? 'translate-x-5' : ''}`} />
            </div>
          </label>
        </div>
      )}

      {/* Clear All */}
      {hasActiveFilters && (
        <div className="pt-4">
          <button onClick={clearAllFilters} className="w-full text-sm text-red-500 font-bold hover:text-red-700 hover:underline transition-colors py-2">
            Cancella tutti i filtri
          </button>
        </div>
      )}
    </div>
  );

  // ─── Pagination Bar ───
  const getPageNumbers = (): (number | 'dots')[] => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('dots');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  };

  // ════════════════════════════════════
  // ─── RENDER ───
  // ════════════════════════════════════
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 pt-4 lg:pt-6">

        {/* ═══ Breadcrumb ═══ */}
        <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-4">
          <button onClick={() => navigate('/')} className="hover:text-nature-600 transition-colors flex items-center gap-1">
            <Home size={14} /> <span className="hidden sm:inline">Home</span>
          </button>
          <ChevronRight size={14} />
          {activeCategory !== 'All' ? (
            <>
              <button onClick={() => setActiveCategory('All')} className="hover:text-nature-600 transition-colors">Negozio</button>
              <ChevronRight size={14} />
              <span className="text-stone-700 font-semibold">{activeCategory}</span>
            </>
          ) : (
            <span className="text-stone-700 font-semibold">Negozio</span>
          )}
        </nav>

        {/* ═══ Header + Search ═══ */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">Negozio</h1>
              {!loading && (
                <p className="text-sm text-stone-500 mt-1">
                  {searchQuery
                    ? <>{filteredProducts.length} risultat{filteredProducts.length === 1 ? 'o' : 'i'} per "<strong className="text-stone-700">{searchQuery}</strong>"</>
                    : <>{filteredProducts.length} prodott{filteredProducts.length === 1 ? 'o' : 'i'}</>
                  }
                </p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca prodotti..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-nature-400 focus:border-transparent transition-all"
            />
            {localSearch && (
              <button onClick={() => { setLocalSearch(''); setSearchQuery(''); navigate('/shop'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ═══ Active Filter Chips ═══ */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {activeCategory !== 'All' && <FilterChip label={`Categoria: ${activeCategory}`} onRemove={() => setActiveCategory('All')} />}
            {activeAnimal !== 'All' && <FilterChip label={`Animale: ${activeAnimal}`} onRemove={() => setActiveAnimal('All')} />}
            {priceMin && <FilterChip label={`Min: €${priceMin}`} onRemove={() => setPriceMin('')} />}
            {priceMax && <FilterChip label={`Max: €${priceMax}`} onRemove={() => setPriceMax('')} />}
            {onSaleOnly && <FilterChip label="Solo Offerte" onRemove={() => setOnSaleOnly(false)} />}
            {sortBy !== 'default' && <FilterChip label={`Ordine: ${sortOptions.find(o => o.value === sortBy)?.label}`} onRemove={() => setSortBy('default')} />}
            <button onClick={clearAllFilters} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-colors ml-1">
              Cancella tutto
            </button>
          </div>
        )}
      </div>

      {/* ═══ Main Layout: Sidebar + Content ═══ */}
      <div className="max-w-7xl mx-auto px-4 pb-8 lg:pb-16 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-24 bg-white border border-stone-100 rounded-2xl p-5 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div ref={gridTopRef} />

          {/* ═══ Top Controls Bar ═══ */}
          <div className="mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Mobile: Filtri */}
              <button onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-100 rounded-lg text-sm font-bold text-stone-700 hover:bg-stone-200 transition-colors min-h-[40px]">
                <SlidersHorizontal size={16} /> Filtri
                {activeFilterCount > 0 && (
                  <span className="bg-nature-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              {/* Mobile: Ordina */}
              <button onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-100 rounded-lg text-sm font-bold text-stone-700 hover:bg-stone-200 transition-colors min-h-[40px]">
                <ArrowUpDown size={16} /> Ordina
              </button>
              {/* Desktop: count */}
              <span className="hidden lg:inline text-sm text-stone-500 font-medium">
                {filteredProducts.length} prodott{filteredProducts.length === 1 ? 'o' : 'i'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Desktop Sort */}
              <div className="hidden lg:block relative">
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-stone-700 focus:ring-2 focus:ring-nature-400 focus:outline-none cursor-pointer">
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
              {/* View Toggles */}
              <div className="hidden sm:flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
                <ViewToggle icon={<Grid2x2 size={18} />} active={viewMode === 2} onClick={() => setViewMode(2)} />
                <ViewToggle icon={<Grid3x3 size={18} />} active={viewMode === 3} onClick={() => setViewMode(3)} />
                <ViewToggle icon={<LayoutGrid size={18} />} active={viewMode === 4} onClick={() => setViewMode(4)} />
              </div>
            </div>
          </div>

          {/* Mobile Sort Dropdown */}
          {isMobileSortOpen && (
            <div className="lg:hidden mb-4 bg-white rounded-xl border border-stone-100 shadow-sm p-3 animate-fade-in">
              <div className="space-y-1">
                {sortOptions.map(opt => (
                  <button key={opt.value} onClick={() => { setSortBy(opt.value); setIsMobileSortOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      sortBy === opt.value ? 'bg-nature-50 text-nature-700 font-bold' : 'text-stone-600 hover:bg-stone-50'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Product Grid / Loading / Empty ═══ */}
          {loading ? (
            <SkeletonGrid count={6} columns={getGridClass()} />
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-16 md:py-24 bg-white rounded-2xl border border-stone-100 shadow-sm">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                <PackageSearch size={40} />
              </div>
              <h3 className="text-xl md:text-2xl text-stone-800 font-bold mb-2">Nessun prodotto trovato</h3>
              <p className="text-stone-500 mb-8 max-w-md mx-auto text-sm md:text-base px-4">
                {searchQuery
                  ? <>Nessun risultato per "<strong>{searchQuery}</strong>". Prova con parole diverse.</>
                  : 'Non ci sono prodotti che corrispondono ai filtri selezionati.'
                }
              </p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-nature-600 font-bold hover:text-nature-700 hover:underline">
                  Resetta tutti i filtri
                </button>
              )}
            </div>
          ) : (
            <div className={`grid ${getGridClass()} gap-3 md:gap-5`}>
              {paginatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* ═══ Pagination ═══ */}
          {!loading && filteredProducts.length > PRODUCTS_PER_PAGE && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-stone-500">
                Pagina <strong className="text-stone-700">{currentPage}</strong> di <strong className="text-stone-700">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-1">
                <PaginationBtn onClick={() => goToPage(1)} disabled={currentPage === 1}><ChevronsLeft size={18} /></PaginationBtn>
                <PaginationBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={18} /></PaginationBtn>
                {getPageNumbers().map((page, idx) =>
                  page === 'dots' ? (
                    <span key={`d-${idx}`} className="px-1.5 text-stone-400 text-sm">...</span>
                  ) : (
                    <button key={page} onClick={() => goToPage(page as number)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-bold transition-colors ${
                        currentPage === page ? 'bg-nature-600 text-white shadow-md' : 'text-stone-600 hover:bg-stone-100'
                      }`}>
                      {page}
                    </button>
                  )
                )}
                <PaginationBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={18} /></PaginationBtn>
                <PaginationBtn onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={18} /></PaginationBtn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile Filter Bottom Sheet ═══ */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl sheet-enter max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-300 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h3 className="font-display font-bold text-lg text-stone-900">Filtri</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <SidebarContent />
            </div>
            <div className="p-4 border-t border-stone-100 bg-stone-50 safe-area-bottom">
              <button onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-nature-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-nature-700 transition-colors shadow-lg">
                Mostra {filteredProducts.length} prodott{filteredProducts.length === 1 ? 'o' : 'i'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// ─── Helper Components ───

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 bg-nature-50 text-nature-700 border border-nature-200 px-3 py-1.5 rounded-full text-xs font-bold">
    <Tag size={12} />
    {label}
    <button onClick={onRemove} className="hover:bg-nature-200 rounded-full p-0.5 transition-colors"><X size={12} /></button>
  </span>
);

const SidebarFilterItem: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
      isActive ? 'bg-nature-50 text-nature-700 font-bold border-l-2 border-nature-600' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    }`}>
    {label}
  </button>
);

const ViewToggle: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick}
    className={`p-2 rounded-md transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center ${
      active ? 'bg-white text-nature-600 shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
    }`}>
    {icon}
  </button>
);

const PaginationBtn: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled}
    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
    {children}
  </button>
);
