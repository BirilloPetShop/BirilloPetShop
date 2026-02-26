/**
 * product controller
 * Override per populate profondo su relazioni (brand, category hierarchy, animals)
 */

import { factories } from '@strapi/strapi';

const deepPopulate = {
  immagine: true,
  galleria: true,
  category: {
    populate: {
      parent: {
        populate: {
          parent: true,
        },
      },
      animal: true,
    },
  },
  animals: true,
  brand: {
    populate: {
      logo: true,
    },
  },
  varianti: true,
};

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    // Se il client non specifica populate, usiamo il nostro deep populate
    if (!ctx.query.populate || ctx.query.populate === '*') {
      ctx.query = {
        ...ctx.query,
        populate: deepPopulate,
      };
    }
    return await super.find(ctx);
  },

  async findOne(ctx) {
    if (!ctx.query.populate || ctx.query.populate === '*') {
      ctx.query = {
        ...ctx.query,
        populate: deepPopulate,
      };
    }
    return await super.findOne(ctx);
  },
}));
