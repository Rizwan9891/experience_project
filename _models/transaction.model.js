import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const transaction = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    cartId: { type: mongoose.Types.ObjectId, required: true },
    addressId: { type: mongoose.Types.ObjectId, required: true },
    invoiceNo: { type: String, required: true },
    amount: { type: Number },
    orderId: { type: String },
    status: { type: String },
    paymentId: { type: String },
    signature: { type: String },
},
    { versionKey: false, timestamps: true });

export default model('transaction', transaction);
