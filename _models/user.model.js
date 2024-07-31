import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const user = new Schema(
    {
        email: { type: String, lowercase: true, trim: true },
        userId: { type: String, required: true },
        name: { type: String },
        password: { type: String },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Disable'], default: 'Approved' },
        role: { type: String, enum: ['User', 'Admin'], default: 'User' },
        fullAddress: { type: String },
        OTP: { type: String },
        image: { type: String },
        isVerified: { type: Boolean, default: false },
    },
    { versionKey: false, timestamps: true }
);

export default model('user', user);
