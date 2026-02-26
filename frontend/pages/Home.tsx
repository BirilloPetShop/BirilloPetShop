
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { fetchFeaturedProducts } from '../services/strapi';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/Skeleton';
import {
  ArrowRight, CheckCircle, ChevronLeft, ChevronRight,
  Dog, Cat, Fish, ShoppingBag, Star, Check, MapPin,
  Phone, Mail, MessageCircle, Droplets, HeartHandshake,
  Rabbit, Bird, Turtle, Squirrel
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      const data = await fetchFeaturedProducts();
      setFeaturedProducts(data);
      setLoading(false);
    };
    loadFeatured();
  }, []);

  const updateScrollButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 400);
  };

  const animalCategories = [
    { name: 'Cani', desc: 'Cibo, accessori e giochi', icon: Dog, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', hover: 'hover:border-amber-200 hover:shadow-lg hover:-translate-y-1', filter: 'Cani' },
    { name: 'Gatti', desc: 'Nutrizione e comfort felino', icon: Cat, bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', hover: 'hover:border-purple-200 hover:shadow-lg hover:-translate-y-1', filter: 'Gatti' },
    { name: 'Roditori', desc: 'Conigli, criceti e porcellini', icon: Rabbit, bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', hover: 'hover:border-orange-200 hover:shadow-lg hover:-translate-y-1', filter: 'Roditori' },
    { name: 'Uccelli', desc: 'Alimenti, gabbie e accessori', icon: Bird, bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600', hover: 'hover:border-teal-200 hover:shadow-lg hover:-translate-y-1', filter: 'Uccelli' },
    { name: 'Pesci', desc: 'Acquari, mangimi e accessori', icon: Fish, bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', hover: 'hover:border-sky-200 hover:shadow-lg hover:-translate-y-1', filter: 'Pesci' },
    { name: 'Tartarughe', desc: 'Mangimi, accessori e cure', icon: Turtle, bg: 'bg-lime-50', border: 'border-lime-100', text: 'text-lime-600', hover: 'hover:border-lime-200 hover:shadow-lg hover:-translate-y-1', filter: 'Tartarughe' },
    { name: 'Rettili', desc: 'Terrari, alimenti e integratori', icon: Squirrel, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', hover: 'hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1', filter: 'Rettili' },
  ];


  return (
    <Layout>
      {/* ══════ 1. HERO ══════ */}
      <section className="relative bg-gradient-to-br from-nature-50 via-emerald-50/30 to-white pt-12 md:pt-16 pb-16 md:pb-24 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-nature-200/20 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-200/15 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left column */}
            <div className="space-y-5 md:space-y-6 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 text-nature-700 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">
                <img src="/logo.png" alt="" className="w-5 h-5 rounded-full" /> Il Tuo Pet Shop di Fiducia
              </span>

              <h1 className="font-display text-3xl md:text-5xl font-bold text-stone-900 leading-tight">
                Solo il Meglio per i tuoi{' '}
                <br className="hidden md:block" />
                <span className="text-nature-600">Amici Animali</span>
              </h1>

              <p className="text-base md:text-lg text-stone-600 leading-relaxed max-w-md mx-auto md:mx-0">
                Dalla nutrizione premium alle installazioni personalizzate di acquari.
                Combiniamo prodotti e servizi per garantire il benessere dei tuoi animali.
              </p>

              <div className="flex gap-3 md:gap-4 pt-2 md:pt-4 justify-center md:justify-start">
                <Button size="lg" onClick={() => navigate('/shop')}>
                  Acquista Ora
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/services')}>
                  I Nostri Servizi
                </Button>
              </div>

              {/* Trust micro-text */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> 20+ anni di esperienza</span>
                <span className="flex items-center gap-1"><HeartHandshake size={12} className="text-nature-500" /> Assistenza personalizzata</span>
                <span className="flex items-center gap-1"><CheckCircle size={12} className="text-nature-500" /> Qualità garantita</span>
              </div>
            </div>

            {/* Right column — hero image */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-nature-200 rounded-full filter blur-3xl opacity-30 transform translate-y-8"></div>
              <img
                src="/hero-dog.png"
                alt="Golden Retriever felice"
                className="relative rounded-3xl shadow-2xl transform md:rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white"
                loading="lazy"
              />
              {/* Floating trust card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-fade-in">
                <div className="bg-nature-100 p-2.5 rounded-full text-nature-600">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Negozio Fisico</p>
                  <p className="text-xs text-stone-500">Vieni a trovarci a Teramo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 2. CATEGORIE ══════ */}
      <section className="py-12 md:py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
              Esplora per Animale
            </h2>
            <p className="text-stone-500 mt-2 text-sm md:text-base">Trova tutto ciò di cui hanno bisogno i tuoi amici.</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {animalCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => navigate(`/shop?animale=${cat.filter}`)}
                className={`${cat.bg} ${cat.border} ${cat.hover} border-2 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center ${cat.text} bg-white/70 shadow-sm group-hover:scale-110 transition-transform`}>
                  <cat.icon size={26} strokeWidth={1.8} />
                </div>
                <div className="text-center">
                  <span className={`font-bold text-xs md:text-sm block ${cat.text}`}>{cat.name}</span>
                  <span className="text-[10px] text-stone-500 hidden lg:block mt-0.5 leading-tight">{cat.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ 4. PRODOTTI IN EVIDENZA ══════ */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-900">Articoli in Evidenza</h2>
              <p className="text-stone-500 mt-1 md:mt-2 text-sm md:text-base">Essenziali selezionati per i tuoi animali.</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                disabled={!canScrollLeft}
                className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-nature-50 hover:border-nature-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Scorri a sinistra"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                disabled={!canScrollRight}
                className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-nature-50 hover:border-nature-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Scorri a destra"
              >
                <ChevronRight size={20} />
              </button>
              <Button variant="outline" onClick={() => navigate('/shop')} className="ml-2">
                Vedi Tutti <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <>
              <div
                ref={carouselRef}
                onScroll={updateScrollButtons}
                className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide"
              >
                {featuredProducts.map(p => (
                  <div key={p.id} className="w-[70%] sm:w-[45%] md:w-[30%] lg:w-[23%] snap-start flex-shrink-0 min-w-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* Mobile 'See All' */}
              <div className="mt-6 md:hidden flex justify-center">
                <Button variant="outline" onClick={() => navigate('/shop')} className="w-full justify-center">
                  Vedi Tutti i Prodotti <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════ 5. SERVIZI ACQUARIOFILIA ══════ */}
      <section className="py-14 md:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/aquarium-bg.png"
                alt="Acquario professionale piantumato"
                className="w-full h-64 md:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-ocean-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  Servizi Professionali
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ocean-50 text-ocean-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Droplets size={14} /> Dipartimento Acquariofilia
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                Acquariofilia Professionale su Misura
              </h2>

              <p className="text-stone-600 leading-relaxed">
                Non vendiamo solo vasche: creiamo ecosistemi. Dalla progettazione alla manutenzione mensile,
                il nostro team segue ogni fase del tuo acquario.
              </p>

              <ul className="space-y-3">
                {[
                  'Installazione acquari personalizzata',
                  'Manutenzione mensile programmata',
                  'Controllo parametri acqua',
                  'Avviamento biologico professionale',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-stone-700">
                    <div className="w-5 h-5 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button variant="secondary" size="lg" onClick={() => navigate('/services')}>
                Scopri i Servizi <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 6. CTA CONTATTO ══════ */}
      <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-24 pt-4 md:pt-8">
        <div className="bg-stone-900 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/85 to-stone-900/70"></div>
          </div>

          <div className="relative z-10 p-8 md:p-12 lg:p-14 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
              Hai Bisogno di Aiuto?
            </h2>
            <p className="text-stone-400 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
              Contattaci senza impegno per qualsiasi informazione, consiglio o preventivo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a
                href="https://wa.me/390861210515"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto justify-center text-sm"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a
                href="tel:0861210515"
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl border border-white/20 backdrop-blur-sm transition-all active:scale-95 w-full sm:w-auto justify-center text-sm"
              >
                <Phone size={18} /> 0861 210515
              </a>
              <a
                href="mailto:birillopetshop@hotmail.it"
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl border border-white/20 backdrop-blur-sm transition-all active:scale-95 w-full sm:w-auto justify-center text-sm"
              >
                <Mail size={18} /> Email
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
