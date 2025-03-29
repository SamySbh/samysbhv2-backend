import stripeSDK from "../configs/stripe.js"

const StripeService = {
    async addProduct(data) {
        return stripeSDK.products.create({
            name: data.name,
            description: data.description,
            metadata: data,
            default_price_data: {
                currency: process.env.STRIPE_DEFAULT_CURRENCY || 'EUR',
                unit_amount: data.basePrice * 100,
            }
        })
    },
    async addCustomer(data) {
        return stripeSDK.customers.create({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            metadata: data
        })
    },
    async createCheckoutSession({ customerId, line_items, orderId, mode = 'payment', successUrl, cancelUrl }) {
        return stripeSDK.checkout.sessions.create({
            customer: customerId,
            line_items: line_items,
            mode: mode,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                orderId: orderId
            },
            payment_intent_data: {
                metadata: {
                    orderId: orderId
                }
            }
        });
    }
}

export default StripeService
