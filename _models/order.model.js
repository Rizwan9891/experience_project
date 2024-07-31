import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const orderModel = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    cartId: { type: mongoose.Types.ObjectId, required: true },
    transactionId: { type: mongoose.Types.ObjectId, required: true },
    addressId: { type: mongoose.Types.ObjectId },
    invoiceId: { type: String, required: true },
    deliveryCharge: { type: Number, default: 0, set: v => parseFloat(v.toFixed(2)) },
    status: { type: String, enum: ['Pending', 'Processing', 'Packed', 'Out_for_Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'], default: 'Pending' },
    total: { type: Number, required: true, default: 0, set: v => parseFloat(v.toFixed(2)) },
    superTotal: { type: Number, required: true, default: 0, set: v => parseFloat(v.toFixed(2)) },
    grandTotal: { type: Number, required: true, default: 0, set: v => parseFloat(v.toFixed(2)) },
    discount: { type: Number, required: true, default: 0, set: v => parseFloat(v.toFixed(2)) },
    products: [{
        productId: { type: mongoose.Types.ObjectId, 'ref': 'product' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0, set: v => parseFloat(v.toFixed(2)) },
        total: { type: Number, default: 0, set: v => parseFloat(v.toFixed(2)) },
        basePrice: { type: Number, default: 0, set: v => parseFloat(v.toFixed(2)) },
    }],
}, { versionKey: false, timestamps: true });

export default model('orderModel', orderModel);
