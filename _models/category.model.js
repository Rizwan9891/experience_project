import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const category = new Schema({
    name: { type: String, required: true, default: '' },
    image: { type: String, required: true, default: '' },
},
    { versionKey: false, timestamps: true });

export default model('category', category);