import type { Schema, Struct } from '@strapi/strapi';

export interface ProductVariant extends Struct.ComponentSchema {
  collectionName: 'components_product_variants';
  info: {
    displayName: 'Variant';
    icon: 'cubes';
  };
  attributes: {
    barcode: Schema.Attribute.String;
    nome_variante: Schema.Attribute.String & Schema.Attribute.Required;
    peso_kg: Schema.Attribute.Decimal;
    prezzo: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    prezzo_scontato: Schema.Attribute.Decimal;
    stock: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    tipo_variante: Schema.Attribute.Enumeration<
      ['Peso', 'Colore', 'Taglia', 'Formato']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Peso'>;
    valore: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product.variant': ProductVariant;
    }
  }
}
