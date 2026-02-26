/**
 * inventory controller
 */

export default {
    async decrementStockByBarcode(ctx) {
        const { barcode } = ctx.request.body;

        if (!barcode) {
            return ctx.badRequest('Barcode is required');
        }

        try {
            // 1. Search in Products
            const products = await strapi.entityService.findMany('api::product.product', {
                filters: { barcode },
                limit: 1,
                populate: ['varianti']
            });

            if (products && products.length > 0) {
                const product = products[0] as any;
                if (product.stock <= 0) {
                    return ctx.badRequest('Out of stock', { item: product, type: 'product' });
                }

                const newStock = product.stock - 1;
                const updatedProduct = await strapi.entityService.update('api::product.product', product.id, {
                    data: { stock: newStock },
                });

                return {
                    message: 'Stock updated',
                    item: updatedProduct,
                    type: 'product'
                };
            }

            // 2. Search in Variants (Components)
            const productsWithVariant = await strapi.entityService.findMany('api::product.product', {
                filters: {
                    varianti: {
                        barcode: barcode
                    }
                },
                populate: ['varianti'],
                limit: 1
            });

            if (productsWithVariant && productsWithVariant.length > 0) {
                const product = productsWithVariant[0] as any;
                const variantIndex = product.varianti.findIndex((v: any) => v.barcode === barcode);

                if (variantIndex === -1) {
                    return ctx.notFound('Variant not found (logic error)');
                }

                const variant = product.varianti[variantIndex];

                if (variant.stock <= 0) {
                    // Construct a "hydrated" variant object for the frontend
                    const hydratedVariant = {
                        ...variant,
                        nome: product.nome,
                        immagine: product.immagine
                    };
                    return ctx.badRequest('Out of stock', { item: hydratedVariant, type: 'variant' });
                }

                // Decrement stock in the array
                const newStock = variant.stock - 1;
                const updatedVariants = [...product.varianti];
                updatedVariants[variantIndex] = { ...variant, stock: newStock };

                // Update the product
                await strapi.entityService.update('api::product.product', product.id, {
                    data: { varianti: updatedVariants }
                });

                // Return the updated variant info
                const updatedVariant = {
                    ...updatedVariants[variantIndex],
                    nome: product.nome, // Context
                    immagine: product.immagine // Context
                };

                return {
                    message: 'Stock updated',
                    item: updatedVariant,
                    type: 'variant'
                };
            }

            return ctx.notFound('Product not found');

        } catch (err) {
            return ctx.badRequest('Error updating stock', { error: err });
        }
    },

    async lookupByBarcode(ctx) {
        const { barcode } = ctx.params;

        if (!barcode) {
            return ctx.badRequest('Barcode is required');
        }

        try {
            // 1. Search Product by Barcode
            const products = await strapi.entityService.findMany('api::product.product', {
                filters: { barcode: barcode },
                populate: ['immagine', 'category', 'animals', 'varianti']
            });

            if (products && products.length > 0) {
                return { type: 'product', item: products[0] };
            }

            // 2. Search Variant by Barcode (inside Component)
            const productsWithVariant = await strapi.entityService.findMany('api::product.product', {
                filters: {
                    varianti: {
                        barcode: barcode
                    }
                },
                populate: ['immagine', 'category', 'animals', 'varianti']
            });

            if (productsWithVariant && productsWithVariant.length > 0) {
                const product = productsWithVariant[0] as any;
                const variant = product.varianti.find((v: any) => v.barcode === barcode);

                if (variant) {
                    // Return "hydrated" variant object as 'item' for frontend compatibility
                    const hydratedVariant = {
                        ...variant,
                        nome: product.nome, // Fallback name
                        immagine: product.immagine, // Inherit image
                        // Ensure variant fields take precedence
                        stock: variant.stock,
                        barcode: variant.barcode,
                        // Add product ID for context if needed
                        productId: product.id
                    };

                    return {
                        type: 'variant',
                        item: hydratedVariant
                    };
                }
            }

            return ctx.notFound('Prodotto non trovato');

        } catch (err) {
            ctx.body = err;
        }
    }
};
