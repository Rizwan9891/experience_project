import { ObjectId } from 'mongodb';
import cartModel from '../_models/cart.model.js';
import productModel from '../_models/product.model.js';

export const addToCart = (req, res) => {
    if (req.userId !== null && req.userId !== undefined && req.userId !== '') {
        if (req.role == "User") {
            const requiredFields = ['productId', 'quantity'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
                }
            }
            productModel.findOne({ _id: new ObjectId(req.body.productId) }).then((productFound) => {
                if (productFound) {
                    if (productFound.quantity >= req.body.quantity) {
                        let total = productFound.price * req.body.quantity
                        let discount = Number(productFound.totalPrice - productFound.price) * req.body.quantity
                        let productTotal = productFound.price * req.body.quantity
                        let superTotal = productFound.totalPrice * req.body.quantity
                        let newProduct = {
                            productId: productFound._id,
                            quantity: req.body.quantity,
                            price: productFound.price,
                            basePrice: productFound.totalPrice,
                            total: total,
                        }
                        cartModel.findOne({ userId: new ObjectId(req.userId) }).then((cartFound) => {
                            if (cartFound) {
                                cartModel.findOne({ _id: cartFound._id, 'products.productId': new ObjectId(req.body.productId) }, { 'products.$': 1, 'total': 1, 'discount': 1, 'superTotal': 1 }).then((existingProduct) => {
                                    if (existingProduct) {
                                        if (productFound.quantity >= existingProduct.products[0].quantity + req.body.quantity) {
                                            total = total + existingProduct.total
                                            discount = discount + existingProduct.discount
                                            superTotal = superTotal + existingProduct.superTotal
                                            cartModel.findOneAndUpdate({ _id: cartFound._id, 'products.productId': new ObjectId(req.body.productId) },
                                                {
                                                    $set: { total: total, discount: discount, superTotal: superTotal },
                                                    $inc: { 'products.$.quantity': req.body.quantity, 'products.$.total': productTotal }
                                                },
                                                { new: true }).then((updatedCart) => {
                                                    if (updatedCart) {
                                                        if (updatedCart.products.length == 0) {
                                                            cartModel.deleteOne({ _id: cartFound._id }).then((deletedCart) => {
                                                                if (deletedCart.deletedCount > 0) {
                                                                    res.status(200).json({ statusCode: 200, error: false, message: "Cart Deleted Successfully." });
                                                                } else {
                                                                    res.status(400).json({ statusCode: 400, error: true, message: "Cart not Deleted." });
                                                                }
                                                            }).catch((error) => {
                                                                console.log(error)
                                                                res.status(400).json({ statusCode: 400, error: true, message: "Cart not Deleted." });
                                                            })
                                                        } else {
                                                            res.status(200).json({ statusCode: 200, error: false, message: "Product quantity updated in cart.", created: updatedCart });
                                                        }
                                                    } else {
                                                        res.status(400).json({ statusCode: 400, error: true, message: "Cart not updated." });
                                                    }
                                                }).catch((error) => {
                                                    console.log(error)
                                                    res.status(400).json({ statusCode: 400, error: true, message: "Cart not updated." });
                                                });
                                        } else {
                                            res.status(400).json({ statusCode: 400, error: true, message: "Product is out of stock." });
                                        }
                                    } else {
                                        cartModel.findByIdAndUpdate(cartFound._id, { $push: { products: newProduct }, $inc: { total: total, discount: discount, superTotal: superTotal } }, { new: true }).then((updatedCart) => {
                                            if (updatedCart) {
                                                if (updatedCart.products.length == 0) {
                                                    cartModel.deleteOne({ _id: cartFound._id }).then((deletedCart) => {
                                                        if (deletedCart.deletedCount > 0) {
                                                            res.status(200).json({ statusCode: 200, error: false, message: "Cart Deleted Successfully." });
                                                        } else {
                                                            res.status(400).json({ statusCode: 400, error: true, message: "Cart not Deleted." });
                                                        }
                                                    }).catch((error) => {
                                                        console.log(error)
                                                        res.status(400).json({ statusCode: 400, error: true, message: "Cart not Deleted." });
                                                    })
                                                } else {
                                                    res.status(200).json({ statusCode: 200, error: false, message: "Product has been successfully added to cart.", created: updatedCart });
                                                }
                                            } else {
                                                res.status(400).json({ statusCode: 400, error: true, message: "Cart not updated." });
                                            }
                                        }).catch((error) => {
                                            console.log(error)
                                            res.status(400).json({ statusCode: 400, error: true, message: "Cart not updated." });
                                        });
                                    }
                                }).catch((error) => {
                                    console.log(error)
                                    res.status(400).json({ statusCode: 400, error: true, message: "Cart not updated." });
                                });
                            } else {
                                let ins = new cartModel({
                                    userId: new ObjectId(req.userId),
                                    total: total,
                                    discount: discount,
                                    superTotal: productFound.totalPrice,
                                    products: [
                                        {
                                            productId: productFound._id,
                                            quantity: req.body.quantity,
                                            price: productFound.price,
                                            basePrice: productFound.totalPrice,
                                            total: total,
                                        }
                                    ],
                                })
                                ins.save().then((created) => {
                                    if (created) {
                                        res.status(200).json({ statusCode: 200, error: false, message: "Product has been successfully add to cart.", created: created });
                                    } else {
                                        res.status(400).json({ statusCode: 400, error: true, message: "Product not added." });
                                    }
                                }).catch((error) => {
                                    console.log(error)
                                    res.status(400).json({ statusCode: 400, error: true, message: "Product not added." });
                                });
                            }
                        }).catch((error) => {
                            console.log(error)
                            res.status(400).json({ statusCode: 400, error: true, message: "Cart not found." });
                        });
                    } else {
                        res.status(400).json({ statusCode: 400, error: true, message: "Product is out of stock." });
                    }
                } else {
                    res.status(400).json({ statusCode: 400, error: true, message: "Invalid ProductId." });
                }
            }).catch((error) => {
                console.log(error)
                res.status(400).json({ statusCode: 400, error: true, message: "Invalid ProductId." });
            });
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: "You can't access." });
        }
    } else {
        res.status(400).json({ statusCode: 400, error: true, message: "Token is required." });
    }
};
export const getCart = (req, res) => {
    if (req.userId !== null && req.userId !== undefined && req.userId !== '') {
        cartModel.find({ userId: new ObjectId(req.userId) }).sort({ createdAt: -1 }).populate('products.productId').then(found => {
            if (found.length === 0) {
                res.status(404).json({ error: true, statusCode: 404, message: "Cart not found." });
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
export const deleteCart = (req, res) => {
    cartModel.findByIdAndDelete({ _id: new ObjectId(req.params.id), userId: new ObjectId(req.userId) }).then((deleted) => {
        if (deleted) {
            res.status(200).json({ error: false, statusCode: 200, message: "Delete successfully." });
        } else {
            res.status(401).json({ error: true, statusCode: 401, message: "Item not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Item not deleted." });
    });
};
export const removeProduct = (req, res) => {
    cartModel.findOne({ userId: new ObjectId(req.userId), 'products.productId': new ObjectId(req.body.productId) }).then((cartFound) => {
        if (cartFound) {
            let total = 0
            let discount = 0
            let superTotal = 0
            cartFound.products.forEach(element => {
                if (element.productId.toString() == req.body.productId.toString()) {
                    total = element.total
                    discount = Number(element.basePrice - element.price) * element.quantity
                    superTotal = Number(element.basePrice) * element.quantity
                }
            });
            cartModel.updateOne({ userId: new ObjectId(req.userId) }, { $pull: { products: { productId: new ObjectId(req.body.productId) } }, $inc: { total: - total, discount: - discount, superTotal: -superTotal } }).then(updated => {
                if (updated.modifiedCount > 0) {
                    res.status(200).json({ error: false, statusCode: 200, message: "Item Remove Successfully" });
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Item Not Found." });
                }
            }).catch(error => {
                console.log(error)
                res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
            });
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: "Item Not Found." });
        }
    }).catch((error) => {
        console.log(error)
        res.status(400).json({ statusCode: 400, error: true, message: "Invalid Details." });
    })
};