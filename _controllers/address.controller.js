import { ObjectId } from 'mongodb';
import address from '../_models/address.model.js';

export const addAddress = (req, res) => {
    if (req.role == "User") {
        const requiredFields = ['homeNo', 'pinCode', 'state', 'country', 'city'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        let fullAddress = `${req.body.homeNo} ${req.body.city} ${req.body.district} ${req.body.state} ${req.body.country} ${req.body.pinCode}`
        let ins = new address({
            userId: new ObjectId(req.userId),
            pinCode: req.body.pinCode,
            state: req.body.state,
            country: req.body.country,
            district: req.body.district,
            city: req.body.city,
            homeNo: req.body.homeNo,
            fullAddress: fullAddress,
        });
        ins.save().then((created) => {
            if (created) {
                res.status(200).json({ error: false, statusCode: 200, message: "Address saved successfully.", created: created });
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "Failed to save address." });
            }
        }).catch(error => {
            console.error("Error saving service area:", error);
            res.status(500).json({ error: true, statusCode: 500, message: "Failed to save address." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const deleteAddress = (req, res) => {
    if (req.role == "User") {
        address.findByIdAndDelete({ _id: new ObjectId(req.params.id), userId: new ObjectId(req.userId) }).then((deleted) => {
            if (deleted) {
                res.status(200).json({ error: false, statusCode: 200, message: "Delete successfully." });
            } else {
                res.status(401).json({ error: true, statusCode: 401, message: "Item not found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Item not deleted." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const getAddress = (req, res) => {
    if (req.role == "User") {
        address.find({ userId: new ObjectId(req.userId) }).sort({ createdAt: -1 }).then((addressFound) => {
            if (addressFound) {
                res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: addressFound });
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "No data found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};