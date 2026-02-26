export default {
    routes: [
        {
            method: 'POST',
            path: '/orders/webhook',
            handler: 'order.webhook',
            config: {
                auth: false,
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/orders/verify-payment',
            handler: 'order.verifyPayment',
            config: {
                policies: [],
            },
        },
    ],
};
