import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const banner = new Schema({
    image: { type: String, required: true },
    type: { type: String, default: 'Fevicol' },
}, { versionKey: false, timestamps: true });

export default model('banner', banner);
