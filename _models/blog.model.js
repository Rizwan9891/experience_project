import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const blog = new Schema({
    image: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
},
    { versionKey: false, timestamps: true });

export default model('blog', blog);
