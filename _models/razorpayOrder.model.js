import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const razorpayOrder = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    cartId: { type: mongoose.Types.ObjectId, required: true },
    addressId: { type: mongoose.Types.ObjectId, required: true },
    amount: { type: Number },
    orderId: { type: String },
    status: { type: String },
    currency: { type: String },
    status: { type: String },
    receipt: { type: String },
},
    { versionKey: false, timestamps: true });

export default model('razorpayOrder', razorpayOrder);