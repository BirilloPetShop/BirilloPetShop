

export enum OrderStatus {
  PENDING = 'In Attesa',
  PAID = 'Pagato',
  COMPLETED = 'Completato',
  SHIPPED = 'Spedito'
}

// Brand Interface
export interface BrandData {
  id: number;
  nome: string;
  descrizione?: string;
  logo?: string;
}

// Category Interface (con gerarchia)
export interface CategoryData {
  id: number;
  nome: string;
  parent?: CategoryData | null;
  children?: CategoryData[];
}

// Category Tree Node (per sidebar negozio)
export interface CategoryTreeNode {
  id: number;
  nome: string;
  children: CategoryTreeNode[];
}

// Animal Interface
export interface AnimalData {
  id: number;
  attributes: {
    nome: string;
    slug?: string;
  }
}

// Variant Types
export type VariantType = 'Peso' | 'Colore' | 'Taglia' | 'Formato';

// Product Variant Interface
export interface ProductVariant {
  id: number;
  nome_variante: string;
  tipo_variante: VariantType;
  valore: string;
  prezzo: number;
  peso_kg?: number;
  prezzo_scontato?: number;
  stock?: number;
  barcode?: string;
}

// Product Interface
export interface Product {
  id: number;
  attributes: {
    nome: string;
    prezzo: number;
    prezzo_scontato?: number;
    descrizione: string;
    categoria: string;
    categoriaObj?: CategoryData;
    animali: string[];
    marca?: string;
    marcaObj?: BrandData;
    is_service: boolean;
    is_featured?: boolean;
    immagine: string;
    galleria?: string[];
    varianti?: ProductVariant[];
    stock?: number;
    barcode?: string;
  }
}

// Cart Item Interface
export interface CartItem extends Product {
  quantity: number;
  serviceDate?: string;
  serviceNotes?: string;
  selectedVariant?: ProductVariant;
}

// User Interface
export interface User {
  id: number;
  username: string;
  email: string;
  nome_completo?: string;
  indirizzo?: string;
  note_indirizzo?: string;
  citta?: string;
  cap?: string;
  telefono?: string;
  info_extra?: string;
  created_at?: string;
}

// Wishlist Interface
export interface Wishlist {
  id: number;
  user_id: number;
  product_ids: number[];
  is_active: boolean;
}

// Order Interface
export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  variant_name?: string;
  image_url?: string;
}

export interface Order {
  id: number;
  date: string;
  total: number;
  status: OrderStatus;
  stripe_id?: string;
  items: OrderItem[];
  shipping_address?: string;
}
