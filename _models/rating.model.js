import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const rating = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    productId: { type: mongoose.Types.ObjectId },
    rating: { type: Number, default: 0 },
    description: { type: String },
    name: { type: String },
    images: [],
},
    { versionKey: false, timestamps: true });

export default model('rating', rating);
