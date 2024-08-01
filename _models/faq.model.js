import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const faq = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
},
    { versionKey: false, timestamps: true });

export default model('faq', faq);
