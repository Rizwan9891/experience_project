import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const product = new Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose.Types.ObjectId, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    description: { type: String },
    images: [],
},
    { versionKey: false, timestamps: true });

export default model('product', product);
