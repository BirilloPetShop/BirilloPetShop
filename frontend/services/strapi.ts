
import { Product } from '../types';
import { STRAPI_API_URL } from '../constants';

const STRAPI_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// Helper to get full image URL
const getImageUrl = (imageData: any) => {
  if (!imageData) return 'https://placehold.co/400x400?text=No+Image';
  if (typeof imageData === 'string') return imageData;

  // Handle Strapi v5 flat response (imageData is the object directly)
  if (imageData.url) {
    const url = imageData.url;
    if (url.startsWith('http')) return url;
    return `${STRAPI_BASE}${url}`;
  }

  // Handle Strapi v4 or nested structure
  const url = imageData.data?.attributes?.url || imageData.attributes?.url;
  if (!url) return 'https://placehold.co/400x400?text=No+Image';

  if (url.startsWith('http')) return url;
  return `${STRAPI_BASE}${url}`;
};

// Helper to extract Gallery Array
const getGalleryUrls = (galleryData: any): string[] => {
  if (!galleryData) return [];

  // v5 flat array
  if (Array.isArray(galleryData)) {
    return galleryData.map((img: any) => {
      const url = img.url;
      if (url && url.startsWith('http')) return url;
      return `${STRAPI_BASE}${url}`;
    });
  }

  // v4 data wrapper
  if (!galleryData.data) return [];
  return galleryData.data.map((img: any) => {
    const url = img.attributes?.url || img.url;
    if (url && url.startsWith('http')) return url;
    return `${STRAPI_BASE}${url}`;
  });
};

// Mapper: Converts Raw Strapi JSON to our App's Product Interface
const mapStrapiProduct = (item: any): Product => {
  try {
    // Strapi v5 returns flat structure, v4 returns nested attributes
    // We normalize to "attributes" concept for our frontend types, or just map directly

    // Check if we have 'attributes' wrapper (v4) or if item is flat (v5)
    const isV4 = !!item.attributes;
    const data = isV4 ? item.attributes : item;
    const id = item.id;

    // Category
    let categoryName = 'Generale';
    if (data.category) {
      // v5 flat: data.category is object
      // v4 nested: data.category.data.attributes
      if (data.category.nome) categoryName = data.category.nome;
      else if (data.category.data?.attributes?.nome) categoryName = data.category.data.attributes.nome;
    } else if (data.categoria) {
      if (data.categoria.nome) categoryName = data.categoria.nome;
      else if (data.categoria.data?.attributes?.nome) categoryName = data.categoria.data.attributes.nome;
    }

    // Animal
    let animalName = 'Tutti';
    if (data.animal) {
      if (data.animal.nome) animalName = data.animal.nome;
      else if (data.animal.data?.attributes?.nome) animalName = data.animal.data.attributes.nome;
    } else if (data.animale) {
      if (data.animale.nome) animalName = data.animale.nome;
      else if (data.animale.data?.attributes?.nome) animalName = data.animale.data.attributes.nome;
    }

    // Variants
    // populate: ['immagine', 'category', 'animal', 'varianti'],
    // v5: data.varianti_prodotto is array
    // v4: data.varianti_prodotto.data is array
    let variantsRaw = [];
    if (data.varianti_prodotto) {
      variantsRaw = Array.isArray(data.varianti_prodotto) ? data.varianti_prodotto : (data.varianti_prodotto.data || []);
    } else if (data.product_variants) {
      variantsRaw = Array.isArray(data.product_variants) ? data.product_variants : (data.product_variants.data || []);
    } else if (data.varianti) { // Added to handle 'varianti' component directly
      variantsRaw = Array.isArray(data.varianti) ? data.varianti : (data.varianti.data || []);
    }

    const variants = variantsRaw.map((v: any) => ({
      id: v.id,
      nome_variante: v.nome_variante || v.attributes?.nome_variante || 'Variante',
      prezzo: Number(v.prezzo || v.prezzo_aggiuntivo || v.attributes?.prezzo || v.attributes?.prezzo_aggiuntivo || 0),
      peso_kg: Number(v.peso_kg || v.attributes?.peso_kg || 0),
      prezzo_scontato: Number(v.prezzo_scontato || v.attributes?.prezzo_scontato || 0),
      opzioni: v.opzioni || v.attributes?.opzioni || {},
      stock: Number(v.stock || v.attributes?.stock || 0),
      barcode: v.barcode || v.attributes?.barcode
    }));

    return {
      id: Number(id),
      attributes: {
        nome: data.nome || 'Prodotto senza nome',
        prezzo: Number(data.prezzo) || 0,
        prezzo_scontato: data.prezzo_scontato ? Number(data.prezzo_scontato) : undefined,
        descrizione: data.descrizione || '', // Rich text or string
        categoria: categoryName,
        animale: animalName,
        is_service: Boolean(data.is_service),
        is_featured: Boolean(data.is_featured),
        immagine: getImageUrl(data.immagine),
        galleria: getGalleryUrls(data.galleria),
        varianti: variants,
      }
    };
  } catch (e) {
    console.error("Error mapping product:", item, e);
    return null as any;
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    // Fetch products populate all possible relations name variations
    const query = `${STRAPI_API_URL}/products?populate=*`;

    console.log("Tentativo connessione Strapi:", query);
    const response = await fetch(query);

    if (!response.ok) {
      console.error(`Errore Strapi Status: ${response.status}`);
      throw new Error('Failed to connect to Strapi');
    }

    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      console.warn("Strapi ha risposto OK, ma la lista prodotti è vuota.");
      return [];
    }

    console.log("Prodotti trovati su Strapi:", json.data.length);
    return json.data.map(mapStrapiProduct).filter((p: any) => p !== null);

  } catch (error) {
    console.error("ERRORE FETCH STRAPI:", error);
    return [];
  }
};

export const fetchProductById = async (id: number): Promise<Product | null> => {
  try {
    // Strapi v5 uses documentId for single-entry endpoints, so we filter by numeric id instead
    const response = await fetch(`${STRAPI_API_URL}/products?filters[id][$eq]=${id}&populate=*`);
    if (!response.ok) {
      throw new Error(`Errore fetch prodotto ${id}: ${response.status}`);
    }
    const json = await response.json();
    if (!json.data || json.data.length === 0) return null;
    return mapStrapiProduct(json.data[0]);
  } catch (error) {
    console.error("Errore fetch prodotto singolo:", error);
    return null;
  }
};

export const fetchServices = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/products?populate=*&filters[is_service][$eq]=true`);
    if (!response.ok) throw new Error('Errore fetch servizi');
    const json = await response.json();
    if (!json.data || json.data.length === 0) return [];
    return json.data.map(mapStrapiProduct).filter((p: any) => p !== null);
  } catch (error) {
    console.error("Errore fetch servizi:", error);
    return [];
  }
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/products?populate=*&filters[is_featured][$eq]=true&pagination[limit]=8`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    if (!json.data || json.data.length === 0) return [];
    return json.data.map(mapStrapiProduct).filter((p: any) => p !== null);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
};

export const searchProductsPreview = async (query: string): Promise<Product[]> => {
  try {
    if (!query) return [];
    const response = await fetch(`${STRAPI_API_URL}/products?filters[nome][$containsi]=${encodeURIComponent(query)}&pagination[limit]=5&populate=*`);
    if (!response.ok) throw new Error('Search failed');
    const json = await response.json();
    return json.data.map(mapStrapiProduct).filter((p: any) => p !== null);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

// Dynamic filters
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/categories`);
    const json = await response.json();
    // v5 flat response
    return json.data.map((c: any) => c.nome || c.attributes?.nome);
  } catch (e) {
    console.warn("Categorie Strapi non trovate");
    return [];
  }
};

export const fetchAnimals = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/animals`);
    const json = await response.json();
    // v5 flat response
    return json.data.map((a: any) => a.nome || a.attributes?.nome);
  } catch (e) {
    console.warn("Animali Strapi non trovati");
    return [];
  }
};

export const scanBarcode = async (barcode: string) => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/inventory/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcode }),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error?.message || 'Scan failed');
    }
    return json;
  } catch (error) {
    throw error;
  }
};

export const lookupProductByBarcode = async (barcode: string) => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/inventory/lookup/${barcode}`);
    const json = await response.json();

    if (!response.ok) {
      // If 404, just return null, don't throw
      if (response.status === 404) return null;
      throw new Error(json.error?.message || 'Lookup failed');
    }
    return json;
  } catch (error) {
    throw error;
  }
};
