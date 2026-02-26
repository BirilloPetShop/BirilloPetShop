/**
 * order controller
 */

import { factories } from '@strapi/strapi';
import Stripe from 'stripe';
import {
    orderConfirmationHtml,
    orderConfirmationSubject,
    buildOrderItemsHtml,
    buildShippingAddressHtml
} from '../../../email-templates/order-confirmation';

const stripe = new Stripe(process.env.STRIPE_SK as string, {
    apiVersion: '2025-11-17.clover' as any, // Cast to any to avoid strict type checking issues if SDK version mismatches
});

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized("You must be logged in to view orders");
        }

        try {
            const data = await strapi.entityService.findMany('api::order.order', {
                filters: {
                    user: user.id,
                    ...(ctx.query.filters as any || {})
                },
                sort: { createdAt: 'desc' },
                populate: '*'
            });

            // Transform response to match standard Strapi format if needed, 
            // but for now returning raw data or wrapping it might be enough.
            // Strapi frontend expects { data: [...] } where items have id and attributes (v4) 
            // or just array (v5)? 
            // entityService returns plain objects.

            // We need to match what Account.tsx expects.
            // Account.tsx expects: data.data.map(...)
            // So we should return { data: data }

            // Wait, entityService returns array of objects with IDs.
            // REST API returns { data: [ { id, attributes: {} } ] } usually.
            // But Account.tsx maps `order.id` and `order.total_paid`.
            // If entityService returns flat objects, we need to adapt Account.tsx or the response.

            // Let's return a format that Account.tsx can handle.
            // Account.tsx: const mappedOrders = data.data.map((order: any) => ({ id: order.id, ... }))
            // So we need { data: [ ... ] }

            return { data: data };

        } catch (error) {
            ctx.badRequest("Error fetching orders", { moreDetails: error });
        }
    },

    async create(ctx) {
        const { user } = ctx.state;
        const { cart_snapshot, shipping_details, total_paid } = ctx.request.body.data;

        if (!user) {
            return ctx.unauthorized('Devi essere loggato per effettuare un ordine');
        }

        if (!cart_snapshot || cart_snapshot.length === 0) {
            return ctx.badRequest('Il carrello è vuoto');
        }

        try {
            // 0. Validate Stock Availability
            for (const item of cart_snapshot) {
                // Skip services
                if (item.is_service) continue;

                let availableStock = 0;
                let productName = item.name;

                if (item.variant_id) {
                    // Check Variant Stock (Component)
                    // Strapi 5: use entityService with object populate syntax
                    const product = await strapi.entityService.findOne('api::product.product', item.id, {
                        populate: { varianti: true }
                    }) as any;

                    if (!product) throw new Error(`Prodotto non trovato: ${item.name}`);

                    // Robust variant matching: try by ID (loose), then fallback to name
                    let variant = product.varianti?.find((v: any) => v.id == item.variant_id);
                    if (!variant && item.variant) {
                        variant = product.varianti?.find((v: any) => v.nome_variante === item.variant);
                    }
                    if (!variant) throw new Error(`Variante non trovata: ${item.variant} (${item.name})`);

                    availableStock = variant.stock ?? 0;
                    productName = `${item.name} (${item.variant})`;
                } else {
                    // Check Product Stock
                    const product = await strapi.entityService.findOne('api::product.product', item.id);
                    if (!product) throw new Error(`Prodotto non trovato: ${item.name}`);
                    availableStock = product.stock ?? 0;
                }

                if (availableStock < item.quantity) {
                    return ctx.badRequest(`Stock insufficiente per ${productName}. Disponibili: ${availableStock}, Richiesti: ${item.quantity}`);
                }
            }

            // 1. Calculate Line Items for Stripe
            const lineItems = cart_snapshot.map((item) => ({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: item.name + (item.variant ? ` (${item.variant})` : ''),
                        images: item.image ? [item.image] : [],
                    },
                    unit_amount: Math.round((item.price) * 100),
                },
                quantity: item.quantity,
            }));

            // 2. Calculate Shipping
            const itemsTotal = cart_snapshot.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const shippingCost = total_paid - itemsTotal;

            if (shippingCost > 0.01) {
                lineItems.push({
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Spedizione',
                        },
                        unit_amount: Math.round(shippingCost * 100),
                    },
                    quantity: 1,
                });
            }

            // 3. Create Stripe Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                customer_email: user.email,
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/checkout`,
                line_items: lineItems,
                metadata: {
                    userId: user.id,
                    shipping_address: JSON.stringify(shipping_details),
                    cart_snapshot: JSON.stringify(cart_snapshot) // Store snapshot in metadata for webhook access if needed
                },
            });

            // 4. Create Order in Strapi
            const newOrder = await strapi.entityService.create('api::order.order', {
                data: {
                    user: user.id,
                    total_paid: total_paid,
                    stato: 'In Attesa',
                    shipping_details,
                    cart_snapshot,
                    stripe_id: session.id,
                },
            });

            return { stripeSessionId: session.id, url: session.url, id: newOrder.id };

        } catch (error: any) {
            console.error('Order Creation Error:', error);
            return ctx.badRequest(error.message || 'Errore durante la creazione dell\'ordine');
        }
    },

    async webhook(ctx) {
        const stripeSignature = ctx.request.headers['stripe-signature'];
        let event;

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret && stripeSignature) {
            try {
                event = stripe.webhooks.constructEvent(
                    ctx.request.body[Symbol.for('unparsedBody')] || JSON.stringify(ctx.request.body),
                    stripeSignature,
                    webhookSecret
                );
            } catch (err: any) {
                console.error('Stripe webhook signature verification failed:', err.message);
                return ctx.badRequest('Webhook signature verification failed');
            }
        } else {
            // Development mode: no signature verification
            event = ctx.request.body;
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const stripeId = session.id;

            try {
                const orders = await strapi.entityService.findMany('api::order.order', {
                    filters: { stripe_id: stripeId },
                });

                if (orders && orders.length > 0) {
                    const order = orders[0];

                    // Update status
                    await strapi.entityService.update('api::order.order', order.id, {
                        data: { stato: 'Pagato' },
                    });

                    // DECREMENT STOCK
                    const cartItems = order.cart_snapshot as any[];
                    if (cartItems && Array.isArray(cartItems)) {
                        for (const item of cartItems) {
                            if (item.is_service) continue;

                            try {
                                if (item.variant_id) {
                                    // Decrement Variant (Component)
                                    // 1. Fetch Product with Variants
                                    const product = await strapi.entityService.findOne('api::product.product', item.id, {
                                        populate: { varianti: true }
                                    }) as any;

                                    if (product && product.varianti) {
                                        // 2. Find and Update Variant in the array (loose comparison for ID types)
                                        const updatedVariants = product.varianti.map((v: any) => {
                                            if (v.id == item.variant_id || v.nome_variante === item.variant) {
                                                const newStock = Math.max(0, (v.stock || 0) - item.quantity);
                                                console.log(`Decremented stock for variant ${v.id}: ${v.stock} -> ${newStock}`);
                                                return { ...v, stock: newStock };
                                            }
                                            return v;
                                        });

                                        // 3. Save the updated component list back to the product
                                        await strapi.entityService.update('api::product.product', item.id, {
                                            data: { varianti: updatedVariants }
                                        });
                                    }
                                } else {
                                    // Decrement Product
                                    const product = await strapi.entityService.findOne('api::product.product', item.id);
                                    if (product) {
                                        const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                                        await strapi.entityService.update('api::product.product', item.id, {
                                            data: { stock: newStock }
                                        });
                                        console.log(`Decremented stock for product ${product.id}: ${product.stock} -> ${newStock}`);
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to decrement stock for item ${item.name}`, err);
                            }
                        }
                    }

                    // ── Send Order Confirmation Email ──
                    try {
                        const orderData = order as any;
                        const orderUser = await strapi.entityService.findOne('plugin::users-permissions.user', orderData.user?.id || orderData.user) as any;
                        if (orderUser?.email) {
                            const cartItems = order.cart_snapshot as any[] || [];
                            const shipping = order.shipping_details as any;
                            const itemsTotal = cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                            const shippingCost = (order.total_paid || 0) - itemsTotal;
                            const orderDate = new Date(order.createdAt).toLocaleDateString('it-IT', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            });

                            const siteUrl = process.env.CLIENT_URL || 'http://localhost:5173';

                            let html = orderConfirmationHtml
                                .replace(/\{\{ORDER_ID\}\}/g, String(order.id))
                                .replace(/\{\{USER_NAME\}\}/g, orderUser.nome_completo || orderUser.username || '')
                                .replace(/\{\{ORDER_ITEMS_HTML\}\}/g, buildOrderItemsHtml(cartItems))
                                .replace(/\{\{SUBTOTAL\}\}/g, `\u20ac${itemsTotal.toFixed(2)}`)
                                .replace(/\{\{SHIPPING_COST\}\}/g, shippingCost > 0.01 ? `\u20ac${shippingCost.toFixed(2)}` : 'Gratis')
                                .replace(/\{\{TOTAL\}\}/g, `\u20ac${(order.total_paid || 0).toFixed(2)}`)
                                .replace(/\{\{SHIPPING_ADDRESS\}\}/g, buildShippingAddressHtml(shipping))
                                .replace(/\{\{ORDER_DATE\}\}/g, orderDate)
                                .replace(/\{\{SITE_URL\}\}/g, siteUrl);

                            const subject = orderConfirmationSubject
                                .replace(/\{\{ORDER_ID\}\}/g, String(order.id));

                            await strapi.plugin('email').service('email').send({
                                to: orderUser.email,
                                subject,
                                html,
                            });
                            console.log(`Order confirmation email sent to ${orderUser.email}`);
                        }
                    } catch (emailErr) {
                        console.error('Failed to send order confirmation email:', emailErr);
                        // Don't fail the webhook if email fails
                    }

                    console.log(`Order ${order.id} processed successfully`);
                } else {
                    console.warn(`No order found for Stripe Session ${stripeId}`);
                }
            } catch (err) {
                console.error('Error updating order via webhook:', err);
                return ctx.internalServerError('Error updating order');
            }
        }

        return { received: true };
    },

    async verifyPayment(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized("Devi essere autenticato");

        const { session_id } = ctx.request.body as any;
        if (!session_id) return ctx.badRequest("session_id richiesto");

        try {
            // 1. Retrieve session from Stripe
            const session = await stripe.checkout.sessions.retrieve(session_id);

            if (session.payment_status !== 'paid') {
                return { status: 'pending', message: 'Pagamento non ancora completato' };
            }

            // 2. Find order by stripe_id
            const orders = await strapi.entityService.findMany('api::order.order', {
                filters: { stripe_id: session_id, user: user.id },
                populate: { user: true },
            });

            if (!orders || orders.length === 0) {
                return ctx.notFound("Ordine non trovato");
            }

            const order = orders[0];

            // 3. If already processed, skip
            if (order.stato === 'Pagato') {
                return { status: 'already_paid', order_id: order.id };
            }

            // 4. Update status to Pagato
            await strapi.entityService.update('api::order.order', order.id, {
                data: { stato: 'Pagato' },
            });

            // 5. Decrement stock
            const cartItems = order.cart_snapshot as any[];
            if (cartItems && Array.isArray(cartItems)) {
                for (const item of cartItems) {
                    if (item.is_service) continue;
                    try {
                        if (item.variant_id) {
                            const product = await strapi.entityService.findOne('api::product.product', item.id, {
                                populate: { varianti: true }
                            }) as any;
                            if (product && product.varianti) {
                                const updatedVariants = product.varianti.map((v: any) => {
                                    if (v.id == item.variant_id || v.nome_variante === item.variant) {
                                        const newStock = Math.max(0, (v.stock || 0) - item.quantity);
                                        console.log(`[verify] Stock variant ${v.id}: ${v.stock} -> ${newStock}`);
                                        return { ...v, stock: newStock };
                                    }
                                    return v;
                                });
                                await strapi.entityService.update('api::product.product', item.id, {
                                    data: { varianti: updatedVariants }
                                });
                            }
                        } else {
                            const product = await strapi.entityService.findOne('api::product.product', item.id);
                            if (product) {
                                const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                                await strapi.entityService.update('api::product.product', item.id, {
                                    data: { stock: newStock }
                                });
                                console.log(`[verify] Stock product ${product.id}: ${product.stock} -> ${newStock}`);
                            }
                        }
                    } catch (err) {
                        console.error(`[verify] Failed stock decrement for ${item.name}`, err);
                    }
                }
            }

            // 6. Send confirmation email
            try {
                const orderData = order as any;
                const orderUser = await strapi.entityService.findOne('plugin::users-permissions.user', orderData.user?.id || orderData.user) as any;
                if (orderUser?.email) {
                    const items = order.cart_snapshot as any[] || [];
                    const shipping = order.shipping_details as any;
                    const itemsTotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                    const shippingCost = (order.total_paid || 0) - itemsTotal;
                    const orderDate = new Date(order.createdAt).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'long', year: 'numeric'
                    });
                    const siteUrl = process.env.CLIENT_URL || 'http://localhost:5173';

                    let html = orderConfirmationHtml
                        .replace(/\{\{ORDER_ID\}\}/g, String(order.id))
                        .replace(/\{\{USER_NAME\}\}/g, orderUser.nome_completo || orderUser.username || '')
                        .replace(/\{\{ORDER_ITEMS_HTML\}\}/g, buildOrderItemsHtml(items))
                        .replace(/\{\{SUBTOTAL\}\}/g, `\u20ac${itemsTotal.toFixed(2)}`)
                        .replace(/\{\{SHIPPING_COST\}\}/g, shippingCost > 0.01 ? `\u20ac${shippingCost.toFixed(2)}` : 'Gratis')
                        .replace(/\{\{TOTAL\}\}/g, `\u20ac${(order.total_paid || 0).toFixed(2)}`)
                        .replace(/\{\{SHIPPING_ADDRESS\}\}/g, buildShippingAddressHtml(shipping))
                        .replace(/\{\{ORDER_DATE\}\}/g, orderDate)
                        .replace(/\{\{SITE_URL\}\}/g, siteUrl);

                    const subject = orderConfirmationSubject
                        .replace(/\{\{ORDER_ID\}\}/g, String(order.id));

                    await strapi.plugin('email').service('email').send({
                        to: orderUser.email,
                        subject,
                        html,
                    });
                    console.log(`[verify] Order confirmation email sent to ${orderUser.email}`);
                }
            } catch (emailErr) {
                console.error('[verify] Failed to send order confirmation email:', emailErr);
            }

            console.log(`[verify] Order ${order.id} verified and processed`);
            return { status: 'paid', order_id: order.id };

        } catch (error: any) {
            console.error('[verify] Error:', error);
            return ctx.badRequest(error.message || 'Errore nella verifica del pagamento');
        }
    },
}));
