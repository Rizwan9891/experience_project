import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const address = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, 'ref': 'user' },
    fullAddress: { type: String, require: true, lowercase: true, },
    pinCode: { type: String, require: true, lowercase: true, },
    state: { type: String, require: true, lowercase: true, },
    country: { type: String, require: true, lowercase: true, },
    district: { type: String, require: false, lowercase: true, },
    city: { type: String, require: true, lowercase: true, },
    homeNo: { type: String, require: true, lowercase: true, },
}, { versionKey: false, timestamps: true });

export default model('address', address);
