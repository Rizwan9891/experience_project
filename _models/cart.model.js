import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const cart = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    total: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    superTotal: { type: Number, required: true, default: 0 },
    products: [{
        productId: { type: mongoose.Types.ObjectId, 'ref': 'product' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        basePrice: { type: Number, default: 0 },
    }],
}, { versionKey: false, timestamps: true });

export default model('cart', cart);
