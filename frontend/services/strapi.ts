
import { Product, CategoryData, CategoryTreeNode, BrandData, VariantType, AnimalInfo } from '../types';
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

// Helper: Build category chain from Strapi data (con animale)
const buildCategoryChain = (cat: any): CategoryData => {
  const result: CategoryData = {
    id: cat.id,
    nome: cat.nome || cat.attributes?.nome || '',
  };
  // Animal associato alla categoria
  if (cat.animal) {
    const a = cat.animal.data ? cat.animal.data : cat.animal;
    if (a && a.id) {
      result.animalId = a.id;
      result.animalNome = a.nome || a.attributes?.nome;
    }
  }
  if (cat.parent) {
    const p = cat.parent.data ? cat.parent.data : cat.parent;
    if (p && p.id) {
      result.parent = buildCategoryChain(p);
    }
  }
  return result;
};

// Mapper: Converts Raw Strapi JSON to our App's Product Interface
const mapStrapiProduct = (item: any): Product => {
  try {
    const isV4 = !!item.attributes;
    const data = isV4 ? item.attributes : item;
    const id = item.id;

    // Category (con gerarchia)
    let categoryName = 'Generale';
    let categoryObj: CategoryData | undefined = undefined;
    if (data.category) {
      const cat = data.category.data ? data.category.data : data.category;
      if (cat) {
        categoryName = cat.nome || cat.attributes?.nome || 'Generale';
        categoryObj = buildCategoryChain(cat);
      }
    } else if (data.categoria) {
      if (data.categoria.nome) categoryName = data.categoria.nome;
      else if (data.categoria.data?.attributes?.nome) categoryName = data.categoria.data.attributes.nome;
    }

    // Animals (manyToMany — array)
    let animalNames: string[] = [];
    if (data.animals) {
      const animalsArr = Array.isArray(data.animals)
        ? data.animals
        : (data.animals.data || []);
      animalNames = animalsArr
        .map((a: any) => a.nome || a.attributes?.nome)
        .filter(Boolean);
    } else if (data.animal) {
      // Backward compat: vecchia relazione singola
      const name = data.animal.nome || data.animal.data?.attributes?.nome;
      if (name) animalNames = [name];
    } else if (data.animale) {
      if (typeof data.animale === 'string') animalNames = [data.animale];
      else {
        const name = data.animale.nome || data.animale.data?.attributes?.nome;
        if (name) animalNames = [name];
      }
    }
    if (animalNames.length === 0) animalNames = ['Tutti'];

    // Brand (nuovo)
    let brandName: string | undefined = undefined;
    let brandObj: BrandData | undefined = undefined;
    if (data.brand) {
      const b = data.brand.data ? data.brand.data : data.brand;
      if (b && b.nome) {
        brandName = b.nome;
        brandObj = {
          id: b.id,
          nome: b.nome,
          descrizione: b.descrizione || undefined,
          logo: b.logo ? getImageUrl(b.logo) : undefined,
        };
      }
    }

    // Variants (con tipo_variante e valore)
    let variantsRaw: any[] = [];
    if (data.varianti_prodotto) {
      variantsRaw = Array.isArray(data.varianti_prodotto) ? data.varianti_prodotto : (data.varianti_prodotto.data || []);
    } else if (data.product_variants) {
      variantsRaw = Array.isArray(data.product_variants) ? data.product_variants : (data.product_variants.data || []);
    } else if (data.varianti) {
      variantsRaw = Array.isArray(data.varianti) ? data.varianti : (data.varianti.data || []);
    }

    const variants = variantsRaw.map((v: any) => ({
      id: v.id,
      nome_variante: v.nome_variante || v.attributes?.nome_variante || 'Variante',
      tipo_variante: (v.tipo_variante || v.attributes?.tipo_variante || 'Peso') as VariantType,
      valore: v.valore || v.attributes?.valore || v.nome_variante || '',
      prezzo: Number(v.prezzo || v.prezzo_aggiuntivo || v.attributes?.prezzo || v.attributes?.prezzo_aggiuntivo || 0),
      peso_kg: Number(v.peso_kg || v.attributes?.peso_kg || 0),
      prezzo_scontato: Number(v.prezzo_scontato || v.attributes?.prezzo_scontato || 0),
      stock: Number(v.stock || v.attributes?.stock || 0),
      barcode: v.barcode || v.attributes?.barcode
    }));

    return {
      id: Number(id),
      attributes: {
        nome: data.nome || 'Prodotto senza nome',
        prezzo: Number(data.prezzo) || 0,
        prezzo_scontato: data.prezzo_scontato ? Number(data.prezzo_scontato) : undefined,
        descrizione: data.descrizione || '',
        categoria: categoryName,
        categoriaObj: categoryObj,
        animali: animalNames,
        marca: brandName,
        marcaObj: brandObj,
        is_service: Boolean(data.is_service),
        is_featured: Boolean(data.is_featured),
        immagine: getImageUrl(data.immagine),
        galleria: getGalleryUrls(data.galleria),
        varianti: variants,
        stock: data.stock,
        barcode: data.barcode,
      }
    };
  } catch (e) {
    console.error("Error mapping product:", item, e);
    return null as any;
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
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
    const response = await fetch(`${STRAPI_API_URL}/categories?populate=parent`);
    const json = await response.json();
    return json.data.map((c: any) => c.nome || c.attributes?.nome);
  } catch (e) {
    console.warn("Categorie Strapi non trovate");
    return [];
  }
};

// Albero categorie gerarchico per la sidebar (con animale)
export const fetchCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/categories?populate=parent,animal&pagination[limit]=100`);
    const json = await response.json();

    const all = json.data.map((c: any) => {
      const animal = c.animal?.data ? c.animal.data : c.animal;
      return {
        id: c.id || c.data?.id,
        nome: c.nome || c.attributes?.nome,
        parentId: c.parent?.id || c.parent?.data?.id || null,
        animalId: animal?.id || null,
        animalNome: animal?.nome || animal?.attributes?.nome || null,
        children: [] as CategoryTreeNode[],
      };
    });

    // Build tree from flat list
    const map = new Map<number, any>();
    const roots: CategoryTreeNode[] = [];

    all.forEach((cat: any) => map.set(cat.id, cat));
    all.forEach((cat: any) => {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    return roots;
  } catch (e) {
    console.warn("Albero categorie non trovato");
    return [];
  }
};

// Fetch animals come semplice lista nomi (backward compat)
export const fetchAnimals = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/animals`);
    const json = await response.json();
    return json.data.map((a: any) => a.nome || a.attributes?.nome);
  } catch (e) {
    console.warn("Animali Strapi non trovati");
    return [];
  }
};

// Fetch animals con info complete (id, nome, icona)
export const fetchAnimalsInfo = async (): Promise<AnimalInfo[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/animals?pagination[limit]=20`);
    const json = await response.json();
    return json.data.map((a: any) => ({
      id: a.id || a.data?.id,
      nome: a.nome || a.attributes?.nome || '',
      icona: a.icona || a.attributes?.icona || undefined,
    }));
  } catch (e) {
    console.warn("Animali info non trovati");
    return [];
  }
};

// Brands
export const fetchBrands = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${STRAPI_API_URL}/brands`);
    const json = await response.json();
    return json.data.map((b: any) => b.nome || b.attributes?.nome);
  } catch (e) {
    console.warn("Marche Strapi non trovate");
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
      if (response.status === 404) return null;
      throw new Error(json.error?.message || 'Lookup failed');
    }
    return json;
  } catch (error) {
    throw error;
  }
};
