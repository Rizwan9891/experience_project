import { ObjectId } from 'mongodb';
import orderModel from '../_models/order.model.js';
import cartModel from '../_models/cart.model.js';
import addressModel from '../_models/address.model.js';
import transactionModel from '../_models/transaction.model.js';
import { generate } from '../_helpers/userId.helper.js';
import productModel from '../_models/product.model.js';

export const placeOrder = (req, res) => {
    const requiredFields = ['cartId', 'addressId', 'transactionId', 'deliveryCharge'];
    for (const field of requiredFields) {
        if (req.body[field] === undefined || req.body[field] === null) {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    generate('invoice').then((invoiceId) => {
        let deliveryCharge = req.body.deliveryCharge !== undefined ? req.body.deliveryCharge : 0;
        addressModel.findOne({ _id: new ObjectId(req.body.addressId) }).then((addressFound) => {
            if (addressFound) {
                cartModel.findOne({ _id: new ObjectId(req.body.cartId) }).then((cartFound) => {
                    if (cartFound) {
                        transactionModel.findOne({ _id: new ObjectId(req.body.transactionId) }).then((transactionFound) => {
                            if (transactionFound) {
                                checkProduct(cartFound).then((result) => {
                                    let ins = new orderModel({
                                        userId: new ObjectId(cartFound.userId),
                                        transactionId: new ObjectId(req.body.transactionId),
                                        cartId: new ObjectId(cartFound._id),
                                        addressId: new ObjectId(req.body.addressId),
                                        total: cartFound.total,
                                        discount: cartFound.discount,
                                        superTotal: cartFound.superTotal,
                                        invoiceId: invoiceId,
                                        deliveryCharge: deliveryCharge,
                                        products: cartFound.products,
                                        grandTotal: transactionFound.amount,
                                    })
                                    ins.save().then((created) => {
                                        if (created) {
                                            cartModel.deleteOne({ _id: new ObjectId(req.body.cartId) }).then((cartDeleted) => {
                                                if (cartDeleted.deletedCount > 0) {
                                                    decreaseProductQuantities(cartFound).then((founded) => {
                                                    }).catch((error) => {
                                                    });
                                                    return res.status(200).json({ statusCode: 200, error: false, message: "Order Successfully Placed." });
                                                } else {
                                                    res.status(404).json({ statusCode: 404, error: true, message: "Cart not deleted." });
                                                }
                                            }).catch((error) => {
                                                res.status(404).json({ statusCode: 404, error: true, message: "Cart not deleted." });
                                            })
                                        } else {
                                            res.status(404).json({ statusCode: 404, error: true, message: "Order not placed." });
                                        }
                                    }).catch((error) => {
                                        console.log(error)
                                        res.status(404).json({ statusCode: 404, error: true, message: "Order not placed." });
                                    });
                                }).catch((error) => {
                                    res.status(404).json({ statusCode: 404, error: true, message: error });
                                });
                            } else {
                                res.status(404).json({ statusCode: 404, error: true, message: "Transaction not found." });
                            }
                        }).catch((error) => {
                            console.log(error)
                            res.status(404).json({ statusCode: 404, error: true, message: "Cart not found." });
                        });
                    } else {
                        res.status(404).json({ statusCode: 404, error: true, message: "Cart not found." });
                    }
                }).catch((error) => {
                    console.log(error)
                    res.status(404).json({ statusCode: 404, error: true, message: "Cart not found." });
                });
            } else {
                res.status(404).json({ statusCode: 404, error: true, message: "Address not found." });
            }
        }).catch((error) => {
            console.log(error)
            res.status(404).json({ statusCode: 404, error: true, message: "Invalid addressId." });
        });
    }).catch((error) => {
        console.log(error)
        res.status(404).json({ statusCode: 404, error: true, message: "Invalid InvoiceId." });
    });
};
export const changeStatus = (req, res) => {
    const requiredFields = ['orderId', 'status'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    orderModel.findOneAndUpdate({ _id: new ObjectId(req.body.orderId) }, { $set: { status: req.body.status } }).then((updated) => {
        if (updated) {
            res.status(200).json({ error: false, statusCode: 200, message: `Order ${req.body.status} Successfully.` });
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: "Order not updated." });
        }
    }).catch((error) => {
        res.status(400).json({ statusCode: 400, error: true, message: "Invalid OrderId." });
    });
};
export const getAllOrderForAdmin = (req, res) => {
    const requiredFields = ['limit', 'page', 'status'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    if (req.body.status == "All") {
        orderModel.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: "addresses",
                    localField: "addressId",
                    foreignField: "_id",
                    as: "addressDetails"
                }
            },
            { $unwind: '$addressDetails' },
            {
                $facet: {
                    data: [
                        {
                            $project: {
                                _id: 1,
                                userId: 1,
                                cartId: 1,
                                transactionId: 1,
                                addressId: 1,
                                invoiceId: 1,
                                status: 1,
                                total: 1,
                                deliveryCharge: 1,
                                superTotal: 1,
                                grandTotal: 1,
                                discount: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                paymentType: 1,
                                addressDetails: 1,
                                'userDetails.name': 1,
                                productDetails: {
                                    $map: {
                                        input: "$products",
                                        as: "product",
                                        in: {
                                            product: "$$product",
                                            details: { $arrayElemAt: ["$productDetails", { $indexOfArray: ["$productDetails._id", "$$product.productId"] }] }
                                        }
                                    }
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $skip: (Number(req.body.page) - 1) * Number(req.body.limit) },
                        { $limit: Number(req.body.limit) }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ]).then(result => {
            if (result.length > 0) {
                const data = result[0].data;
                const count = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: data, count: count });
            } else {
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: [], count: 0 });
            }
        }).catch(error => {
            console.log(error);
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid userId." });
        });
    } else {
        orderModel.aggregate([
            { $match: { status: req.body.status } },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: "addresses",
                    localField: "addressId",
                    foreignField: "_id",
                    as: "addressDetails"
                }
            },
            { $unwind: '$addressDetails' },
            {
                $facet: {
                    data: [
                        {
                            $project: {
                                _id: 1,
                                userId: 1,
                                cartId: 1,
                                transactionId: 1,
                                addressId: 1,
                                invoiceId: 1,
                                deliveryTime: 1,
                                grandTotal: 1,
                                status: 1,
                                total: 1,
                                deliveryCharge: 1,
                                superTotal: 1,
                                discount: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                paymentType: 1,
                                addressDetails: 1,
                                'userDetails.name': 1,
                                productDetails: {
                                    $map: {
                                        input: "$products",
                                        as: "product",
                                        in: {
                                            product: "$$product",
                                            details: { $arrayElemAt: ["$productDetails", { $indexOfArray: ["$productDetails._id", "$$product.productId"] }] }
                                        }
                                    }
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $skip: (Number(req.body.page) - 1) * Number(req.body.limit) },
                        { $limit: Number(req.body.limit) }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ]).then(result => {
            if (result.length > 0) {
                const data = result[0].data;
                const count = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: data, count: count });
            } else {
                res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: [], count: 0 });
            }
        }).catch(error => {
            console.log(error);
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid userId." });
        });
    }
};
export const getAllOrderByUserId = (req, res) => {
    if (req.userId !== null && req.userId !== undefined && req.userId !== '') {
        orderModel.aggregate([
            { $match: { userId: new ObjectId(req.userId) } },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    transactionId: 1,
                    invoiceId: 1,
                    deliveryCharge: 1,
                    cartId: 1,
                    addressId: 1,
                    grandTotal: 1,
                    status: 1,
                    total: 1,
                    superTotal: 1,
                    discount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    productDetails: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                product: "$$product",
                                details: { $arrayElemAt: ["$productDetails", { $indexOfArray: ["$productDetails._id", "$$product.productId"] }] }
                            }
                        }
                    }
                }
            }
        ]).sort({ createdAt: -1 }).then(found => {
            if (found == null) {
                res.status(404).json({ error: true, statusCode: 404, message: "order not found." });
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
const checkProduct = (cartFound) => {
    let products = cartFound.products;
    return new Promise((resolve, reject) => {
        let checkPromises = products.map((product) => {
            return productModel.findOne({ _id: new ObjectId(product.productId), quantity: { $gte: product.quantity } });
        });
        Promise.all(checkPromises).then((results) => {
            for (let result of results) {
                if (!result) {
                    reject("One or more products are either out of stock or do not have the required quantity");
                    return;
                }
            }
            resolve("All products are available in the required quantity");
        }).catch((error) => {
            reject("Error checking products in the store");
        });
    });
};
const decreaseProductQuantities = (cartFound) => {
    let products = cartFound.products;
    return new Promise((resolve, reject) => {
        let updatePromises = products.map((product) => {
            return productModel.updateOne({ _id: new ObjectId(product.productId) }, { $inc: { quantity: -product.quantity } });
        });

        Promise.all(updatePromises).then(() => {
            resolve("Quantities updated successfully");
        }).catch((error) => {
            reject("Error updating product quantities");
        });
    });
};
