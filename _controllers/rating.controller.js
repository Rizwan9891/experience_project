import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import ratingModel from '../_models/rating.model.js';
import productModel from '../_models/product.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';

export const addReviewToProduct = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (error, fields, files) => {
        const requiredFields = ['productId', 'rating'];
        for (const field of requiredFields) {
            if (fields[field] === undefined || fields[field] === null || (typeof fields[field] === 'object' && fields[field][0] === '') || (typeof fields[field] !== 'string' && !fields[field])) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        if (Number(fields.rating[0]) < 1 || Number(fields.rating[0]) > 5) {
            return res.status(400).json({ statusCode: 400, error: true, message: 'Rating must be between 1 and 5.' });
        }
        productModel.findOne({ _id: new ObjectId(fields.productId[0]) }).then((productFound) => {
            if (productFound) {
                if (files.image && files.image.length > 0) {
                    uploadImage(files).then((uploaded) => {
                        let ins = new ratingModel({
                            userId: new ObjectId(req.userId),
                            productId: new ObjectId(productFound._id),
                            rating: fields.rating[0],
                            name: req.name,
                            description: fields.description[0],
                            images: uploaded,
                        })
                        ins.save().then((created) => {
                            console.log(created)
                            if (created) {
                                res.status(200).json({ statusCode: 200, error: false, message: "Review has been added successfully." });
                            } else {
                                res.status(400).json({ statusCode: 400, error: true, message: "Review not added." });
                            }
                        }).catch((error) => {
                            console.log(error)
                            res.status(400).json({ statusCode: 400, error: true, message: "Review not added." });
                        })
                    }).catch((error) => {
                        console.log(error)
                        res.status(400).json({ statusCode: 400, error: true, message: `Invalid Image.` });
                    })
                } else {
                    let ins = new ratingModel({
                        userId: new ObjectId(req.userId),
                        productId: new ObjectId(productFound._id),
                        rating: fields.rating[0],
                        name: req.name,
                        description: fields.description[0],
                    })
                    ins.save().then((created) => {
                        console.log(created)
                        if (created) {
                            res.status(200).json({ statusCode: 200, error: false, message: "Review has been added successfully." });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Review not added." });
                        }
                    }).catch((error) => {
                        console.log(error)
                        res.status(400).json({ statusCode: 400, error: true, message: "Review not added." });
                    })
                }
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: "Invalid ProductId." });
            }
        }).catch((error) => {
            console.log(error)
            res.status(400).json({ statusCode: 400, error: true, message: "Invalid ProductId." });
        })
    });
};
export const getRatingByUserId = (req, res) => {
    if (req.userId !== null && req.userId !== undefined && req.userId !== '') {
        ratingModel.find({ userId: new ObjectId(req.userId) }).sort({ createdAt: -1 }).then(found => {
            if (found == null) {
                res.status(404).json({ error: true, statusCode: 404, message: "Rating not found." });
            } else {
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: found });
            }
        }).catch(error => {
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid userId." });
        });
    } else {
        res.status(400).json({ statusCode: 400, error: true, message: "Token is required." });
    }
};