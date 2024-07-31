import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import productModel from '../_models/product.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';
import categoryModel from '../_models/category.model.js';

export const addProduct = (req, res) => {
    if (req.role == "Admin") {
        const form = new IncomingForm();
        form.parse(req, (error, fields, files) => {
            const requiredFields = ['name', 'quantity', 'totalPrice', 'discount', 'description'];
            for (const field of requiredFields) {
                if (fields[field] === undefined || fields[field] === null || (typeof fields[field] === 'object' && fields[field][0] === '') || (typeof fields[field] !== 'string' && !fields[field])) {
                    return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
                }
            }
            if (files.image && files.image.length > 0) {
                categoryModel.findOne({ _id: new ObjectId(fields.categoryId[0]) }).sort({ createdAt: -1 }).then(categoryFound => {
                    if (categoryFound) {
                        uploadImage(files).then((uploaded) => {
                            let ins = new productModel({
                                name: fields.name[0],
                                images: uploaded,
                                categoryId: categoryFound._id,
                                category: categoryFound.name,
                                quantity: fields.quantity[0],
                                totalPrice: fields.totalPrice[0],
                                discount: fields.discount[0],
                                price: Number(fields.totalPrice[0]) - Number(fields.discount[0]),
                                description: fields.description[0],
                            })
                            ins.save().then((created) => {
                                console.log("created", created)
                                if (created) {
                                    res.status(200).json({ statusCode: 200, error: false, message: "Product has been uploaded successfully." });
                                } else {
                                    res.status(400).json({ statusCode: 400, error: true, message: "Product not added." });
                                }
                            }).catch((error) => {
                                console.log(error)
                                res.status(400).json({ statusCode: 400, error: true, message: "Product not added." });
                            });
                        }).catch((error) => {
                            console.log(error)
                            res.status(400).json({ statusCode: 400, error: true, message: `Invalid Image.` });
                        });
                    } else {
                        res.status(400).json({ statusCode: 400, error: true, message: `Category not Found.` });
                    }
                }).catch(error => {
                    console.log(error)
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
                });
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: `Image is required.` });
            }
        });
    } else {
        res.status(400).json({ statusCode: 400, error: true, message: "You can't add product." });
    }
};
export const deleteProduct = (req, res) => {
    productModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
        if (deleted) {
            res.status(200).json({ error: false, statusCode: 200, message: "Delete successfully." });
        } else {
            res.status(401).json({ error: true, statusCode: 401, message: "Item not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Item not deleted." });
    });
};
export const getAllProduct = (req, res) => {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    productModel.aggregate([
        {
            $addFields: {
                productDetails: { $ifNull: ["$productDetails", []] }
            }
        },
        {
            $lookup: {
                from: "ratings",
                localField: "_id",
                foreignField: "productId",
                as: "productDetails"
            }
        },
        {
            $addFields: {
                inStock: { $gt: ["$quantity", 0] },
            }
        },
        { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                discount: { $first: "$discount" },
                totalPrice: { $first: "$totalPrice" },
                quantity: { $first: "$quantity" },
                price: { $first: "$price" },
                description: { $first: "$description" },
                category: { $first: "$category" },
                categoryId: { $first: "$categoryId" },
                images: { $first: "$images" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                inStock: { $first: "$inStock" },
                avgRating: { $avg: { $ifNull: ["$productDetails.rating", 0] } },
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                totalPrice: 1,
                discount: 1,
                quantity: 1,
                price: 1,
                description: 1,
                category: 1,
                categoryId: 1,
                images: 1,
                createdAt: 1,
                updatedAt: 1,
                avgRating: { $round: ["$avgRating", 0] },
            }
        }
    ]).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).then(found => {
        res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: found });
    }).catch(error => {
        console.log(error)
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
    });
};
export const getProductById = (req, res) => {
    let productId = new ObjectId(req.params.productId);
    productModel.aggregate([
        { $match: { _id: productId } },
        {
            $lookup: {
                from: "ratings",
                localField: "_id",
                foreignField: "productId",
                as: "productDetails"
            }
        },
        { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                quantity: { $first: "$quantity" },
                discount: { $first: "$discount" },
                totalPrice: { $first: "$totalPrice" },
                price: { $first: "$price" },
                description: { $first: "$description" },
                category: { $first: "$category" },
                categoryId: { $first: "$categoryId" },
                images: { $first: "$images" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                avgRating: { $avg: { $ifNull: ["$productDetails.rating", 0] } },
                ratings: { $push: "$productDetails" }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                totalPrice: 1,
                discount: 1,
                quantity: 1,
                price: 1,
                description: 1,
                category: 1,
                categoryId: 1,
                images: 1,
                createdAt: 1,
                updatedAt: 1,
                avgRating: { $round: ["$avgRating", 0] },
                ratings: { $ifNull: ["$ratings", []] },
            }
        }
    ]).then((productFound) => {
        if (productFound.length > 0) {
            let productData = productFound[0]
            productModel.find({ category: productFound[0].category, _id: { $ne: productId } }).sort({ createdAt: -1 }).limit(10).then((similarProducts) => {
                productData.similarProducts = similarProducts;
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully.", data: productData, });
            }).catch((error) => {
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully.", data: [], });
            })
        } else {
            res.status(200).json({ error: false, statusCode: 200, message: "Find successfully.", data: [], });
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Internal server error." });
    });
};
export const search = (req, res) => {
    const requiredFields = ['name'];
    for (const field of requiredFields) {
        if (!req.query[field] || req.query[field] === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    const searchKeyword = req.query.name;
    productModel.aggregate([
        {
            $match:
                { name: { $regex: new RegExp(searchKeyword, 'i') } }
        },
        {
            $facet: {
                count: [
                    { $count: "total" }
                ],
                data: [
                    { $addFields: { productDetails: { $ifNull: ["$productDetails", []] } } },
                    {
                        $lookup: {
                            from: "ratings",
                            localField: "_id",
                            foreignField: "productId",
                            as: "productDetails"
                        }
                    },
                    { $addFields: { inStock: { $gt: ["$quantity", 0] } } },
                    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: "$_id",
                            name: { $first: "$name" },
                            discount: { $first: "$discount" },
                            totalPrice: { $first: "$totalPrice" },
                            quantity: { $first: "$quantity" },
                            price: { $first: "$price" },
                            description: { $first: "$description" },
                            category: { $first: "$category" },
                            categoryId: { $first: "$categoryId" },
                            images: { $first: "$images" },
                            createdAt: { $first: "$createdAt" },
                            updatedAt: { $first: "$updatedAt" },
                            inStock: { $first: "$inStock" },
                            avgRating: { $avg: { $ifNull: ["$productDetails.rating", 0] } },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            totalPrice: 1,
                            discount: 1,
                            quantity: 1,
                            price: 1,
                            description: 1,
                            category: 1,
                            categoryId: 1,
                            images: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            avgRating: { $round: ["$avgRating", 0] },
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 20 }
                ]
            }
        }
    ]).then(result => {
        const count = result[0].count[0] ? result[0].count[0].total : 0;
        const data = result[0].data;
        res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data, count });
    }).catch(error => {
        console.log(error);
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
    });
};
export const updateProduct = (req, res) => {
    if (req.role == "Admin") {
        const requiredFields = ['productId', 'quantity'];
        for (const field of requiredFields) {
            if (!req.body[field] || req.body[field] === '') {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        productModel.updateOne({ _id: new ObjectId(req.body.productId) }, { $inc: { quantity: req.body.quantity } }).then((updated) => {
            if (updated.modifiedCount > 0) {
                res.status(200).json({ error: false, statusCode: 200, message: "Quantity updated successfully", });
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: "Product not updated." });
            }
        }).catch((error) => {
            res.status(400).json({ statusCode: 400, error: true, message: "Invalid productId" });
        });
    } else {
        res.status(400).json({ statusCode: 400, error: true, message: "You can't add product." });
    }
};