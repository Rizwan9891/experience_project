import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import bannerModel from '../_models/banner.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';

export const addBanner = (req, res) => {
    if (req.role == "Admin") {
        const form = new IncomingForm();
        form.parse(req, (error, fields, files) => {
            if (files.image && files.image.length > 0) {
                uploadImage(files).then((uploaded) => {
                    let ins = new bannerModel({
                        image: uploaded,
                    })
                    ins.save().then((created) => {
                        console.log(created)
                        if (created) {
                            res.status(200).json({ statusCode: 200, error: false, message: "Banner has been added successfully." });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Banner not added." });
                        }
                    }).catch((error) => {
                        console.log(error)
                        res.status(400).json({ statusCode: 400, error: true, message: "Banner not added." });
                    });
                }).catch((error) => {
                    console.log(error)
                    res.status(400).json({ statusCode: 400, error: true, message: `Invalid Image.` });
                })
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: `Image is required.` });
            }
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const deleteBanner = (req, res) => {
    if (req.role == "Admin") {
        bannerModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
            if (deleted) {
                res.status(200).json({ error: false, statusCode: 200, message: "Banner Delete successfully." });
            } else {
                res.status(401).json({ error: true, statusCode: 401, message: "Banner not found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Banner not deleted." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const getBanners = (req, res) => {
    bannerModel.find({}).sort({ createdAt: -1 }).then((bannerFound) => {
        if (bannerFound) {
            res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: bannerFound });
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "No data found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    });
};