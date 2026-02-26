
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { fetchServices } from '../services/strapi';
import { Product } from '../types';
import {
  Fish, Wrench, Check, ArrowRight, Phone, Mail, MessageCircle,
  Droplets, MapPin, Truck, Store, Package
} from 'lucide-react';

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const [maintenanceService, setMaintenanceService] = useState<Product | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchServices();
      // Find maintenance service by name
      const maint = data.find(s =>
        s.attributes.nome.toLowerCase().includes('manutenzione')
      );
      if (maint) setMaintenanceService(maint);
      setLoadingServices(false);
    };
    load();
  }, []);

  // Calculate maintenance price
  const getMaintenancePrice = (): string | null => {
    if (!maintenanceService) return null;
    const { prezzo, prezzo_scontato, varianti } = maintenanceService.attributes;
    if (varianti && varianti.length > 0) {
      const cheapest = [...varianti].sort((a, b) => {
        const pa = (a.prezzo_scontato && a.prezzo_scontato < a.prezzo) ? a.prezzo_scontato : a.prezzo;
        const pb = (b.prezzo_scontato && b.prezzo_scontato < b.prezzo) ? b.prezzo_scontato : b.prezzo;
        return pa - pb;
      })[0];
      const p = (cheapest.prezzo_scontato && cheapest.prezzo_scontato < cheapest.prezzo)
        ? cheapest.prezzo_scontato : cheapest.prezzo;
      return `€${p.toFixed(2)}`;
    }
    const finalPrice = (prezzo_scontato && prezzo_scontato < prezzo) ? prezzo_scontato : prezzo;
    return `€${finalPrice.toFixed(2)}`;
  };

  const maintenancePrice = getMaintenancePrice();
  const hasMaintenanceVariants = maintenanceService?.attributes.varianti && maintenanceService.attributes.varianti.length > 0;

  return (
    <Layout>
      {/* ══════ ACQUARIOFILIA ══════ */}
      <section className="py-12 md:py-16 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
              Acquariofilia Professionale
            </h1>
            <p className="text-stone-500 mt-2 text-sm md:text-base">
              Dalla progettazione alla manutenzione: creiamo e curiamo il tuo ecosistema acquatico.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">

          {/* ── Card 1: Installazione Acquario su Misura ── */}
          <div className="bg-white rounded-3xl border-2 border-ocean-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="p-7 md:p-9 flex flex-col flex-grow">
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-ocean-50 rounded-2xl flex items-center justify-center text-ocean-500">
                  <Fish size={32} />
                </div>
                <span className="bg-ocean-50 text-ocean-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  Su Preventivo
                </span>
              </div>

              {/* Title + desc */}
              <h3 className="font-display text-xl md:text-2xl font-bold text-stone-900 mb-3">
                Installazione Acquario su Misura
              </h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Progettiamo e realizziamo il tuo acquario dei sogni. Dall'idea al primo pesce, seguiamo ogni fase.
              </p>

              {/* Cosa include */}
              <div className="mb-8 flex-grow">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Cosa include</p>
                <ul className="space-y-2.5">
                  {[
                    'Progettazione personalizzata',
                    'Scelta materiali e specie',
                    'Installazione professionale',
                    'Avviamento biologico',
                    'Test parametri acqua',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <Check size={16} className="text-ocean-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <a
                  href="https://wa.me/390861210515?text=Ciao!%20Vorrei%20informazioni%20per%20un%20acquario%20su%20misura."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-ocean-500 hover:bg-ocean-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <MessageCircle size={18} /> Richiedi Preventivo
                </a>
                <p className="text-center mt-3 text-sm text-stone-400">
                  oppure chiama{' '}
                  <a href="tel:0861210515" className="text-ocean-600 font-semibold hover:underline">
                    0861 210515
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* ── Card 2: Manutenzione Mensile ── */}
          <div className="bg-white rounded-3xl border-2 border-nature-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="p-7 md:p-9 flex flex-col flex-grow">
              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-nature-50 rounded-2xl flex items-center justify-center text-nature-600">
                  <Wrench size={32} />
                </div>
                {loadingServices ? (
                  <div className="w-24 h-7 bg-stone-100 rounded-full animate-pulse"></div>
                ) : maintenancePrice ? (
                  <div className="text-right">
                    {hasMaintenanceVariants && (
                      <span className="block text-[10px] text-stone-400 font-bold uppercase">A partire da</span>
                    )}
                    <span className="text-nature-600 text-lg font-extrabold">{maintenancePrice}</span>
                  </div>
                ) : (
                  <span className="bg-nature-50 text-nature-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    Contattaci
                  </span>
                )}
              </div>

              {/* Title + desc */}
              <h3 className="font-display text-xl md:text-2xl font-bold text-stone-900 mb-3">
                Manutenzione Mensile
              </h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Ci occupiamo del tuo acquario ogni mese. Tu ti godi lo spettacolo, noi facciamo il resto.
              </p>

              {/* Cosa include */}
              <div className="mb-8 flex-grow">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Cosa include</p>
                <ul className="space-y-2.5">
                  {[
                    'Cambio acqua parziale',
                    'Pulizia vetri e filtri',
                    'Controllo parametri chimici',
                    'Verifica salute pesci',
                    'Regolazione CO2 e illuminazione',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <Check size={16} className="text-nature-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-auto">
                {maintenanceService ? (
                  <button
                    onClick={() => navigate(`/product/${maintenanceService.id}`, { state: { product: maintenanceService } })}
                    className="flex items-center justify-center gap-2 w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    Prenota Ora <ArrowRight size={18} />
                  </button>
                ) : (
                  <a
                    href="https://wa.me/390861210515?text=Ciao!%20Vorrei%20informazioni%20sulla%20manutenzione%20mensile%20acquario."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    <MessageCircle size={18} /> Contattaci
                  </a>
                )}
                <p className="text-center mt-3 text-sm text-stone-400">
                  oppure chiama{' '}
                  <a href="tel:0861210515" className="text-nature-600 font-semibold hover:underline">
                    0861 210515
                  </a>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Banner zona servizio acquariofilia */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-stone-800 text-sm md:text-base">
              Servizi di acquariofilia disponibili a Teramo e provincia
            </p>
            <p className="text-stone-500 text-xs md:text-sm mt-0.5">
              I nostri tecnici operano in tutta la provincia di Teramo. Contattaci per verificare la copertura nella tua zona.
            </p>
          </div>
        </div>
      </div>
      </section>

      {/* ══════ SPEDIZIONI & RITIRO ══════ */}
      <section className="py-12 md:py-16 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-900">
              Spedizioni & Ritiro
            </h2>
            <p className="text-stone-500 mt-2 text-sm md:text-base">
              Scegli il metodo più comodo per ricevere i tuoi prodotti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Card: Consegna a Domicilio */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-nature-50 rounded-xl flex items-center justify-center mb-4">
                <Truck size={24} className="text-nature-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-stone-900 mb-2">Consegna a Domicilio</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">
                Riceviamo il tuo ordine e te lo consegniamo direttamente a casa, in giornata.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-nature-700 bg-nature-50 px-3 py-1.5 rounded-full">
                <MapPin size={12} /> Provincia di Teramo
              </span>
            </div>

            {/* Card: Ritiro in Negozio */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <Store size={24} className="text-amber-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-stone-900 mb-2">Ritiro in Negozio</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">
                Ordina online e ritira comodamente presso il nostro negozio, senza costi aggiuntivi.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                <MapPin size={12} /> Via Po 26/28, Teramo
              </span>
            </div>

            {/* Card: Spedizione Italia */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-ocean-50 rounded-xl flex items-center justify-center mb-4">
                <Package size={24} className="text-ocean-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-stone-900 mb-2">Spedizione in tutta Italia</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-3">
                Spediamo in tutta Italia con corriere espresso. Ricevi i migliori prodotti ovunque tu sia.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ocean-700 bg-ocean-50 px-3 py-1.5 rounded-full">
                <Package size={12} /> Corriere Espresso
              </span>
            </div>
          </div>

          {/* Banner spedizione gratuita */}
          <div className="mt-8 bg-nature-50 border-2 border-nature-100 rounded-2xl p-5 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-nature-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-nature-600" />
            </div>
            <div>
              <p className="font-bold text-stone-800 text-sm md:text-base">
                Spedizione GRATUITA per ordini superiori a €99
              </p>
              <p className="text-stone-500 text-xs md:text-sm mt-0.5">
                Sia per la consegna a domicilio in Provincia di Teramo che per la spedizione in tutta Italia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CTA CONTATTO ══════ */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
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
              Hai Domande? Siamo Qui per Te.
            </h2>
            <p className="text-stone-400 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
              Contattaci senza impegno per qualsiasi informazione o preventivo.
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
