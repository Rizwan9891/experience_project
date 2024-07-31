import { ObjectId } from 'mongodb';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { razorpayConfig } from '../_configs/razorpay.config.js';
import transactionModel from '../_models/transaction.model.js';
import razorpayOrderModel from '../_models/razorpayOrder.model.js'
import cartModel from '../_models/cart.model.js';
import addressModel from '../_models/address.model.js';
import { generate } from '../_helpers/userId.helper.js';

const razorpayInstance = new Razorpay({
    key_id: razorpayConfig.key_id,
    key_secret: razorpayConfig.key_secret
});

export const createOrder = (req, res) => {
    const requiredFields = ['cartId', 'addressId', 'deliveryCharge'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    cartModel.findOne({ _id: new ObjectId(req.body.cartId) }).then((cartFound) => {
        if (cartFound) {
            addressModel.findOne({ _id: new ObjectId(req.body.addressId) }).then((addressFound) => {
                if (addressFound) {
                    const amount = Number(cartFound.total) * 100
                    const options = {
                        amount: amount,
                        currency: 'INR',
                        receipt: req.userId.toString()
                    }
                    razorpayInstance.orders.create(options).then((orderCreated) => {
                        if (orderCreated) {
                            let ins = new razorpayOrderModel({
                                userId: new ObjectId(req.userId),
                                cartId: new ObjectId(req.userId),
                                addressId: new ObjectId(req.userId),
                                amount: Number(cartFound.total + req.body.deliveryCharge),
                                orderId: orderCreated.id,
                                status: orderCreated.status,
                                currency: orderCreated.currency,
                                status: orderCreated.status,
                                receipt: orderCreated.receipt,
                            });
                            ins.save().then((created) => {
                                if (created) {
                                    res.status(201).json({ statusCode: 201, error: false, message: "Payment Order created Successfully.", data: orderCreated, keyId: razorpayConfig.key_id });
                                } else {
                                    res.status(400).json({ statusCode: 400, error: true, message: "Payment Order is not created." });
                                }
                            }).catch((error) => {
                                res.status(400).json({ statusCode: 400, error: true, message: "Payment Order is not created." });
                            });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Something went wrong." });
                        }
                    }).catch((error) => {
                        console.log("error", error)
                        res.status(400).json({ statusCode: 400, error: true, message: "Something went wrong." });
                    });
                } else {
                    res.status(400).json({ statusCode: 400, error: true, message: "Invalid addressId." });
                }
            }).catch((error) => {
                res.status(400).json({ statusCode: 400, error: true, message: "Invalid addressId." });
            });
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: "Invalid cartId." });
        }
    }).catch((error) => {
        res.status(400).json({ statusCode: 400, error: true, message: "Invalid cartId." });
    });
};
const verifyPaymentSignature = (order_id, razorpay_payment_id, razorpay_signature, secret) => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');
    return generated_signature === razorpay_signature;
};
export const verifyPayment = (req, res) => {
    console.log("verifyPayment req.body", req.body)
    const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
    razorpayOrderModel.findOne({ orderId: razorpayOrderId }).then((orderFound) => {
        if (orderFound) {
            console.log("verifyPayment orderFound", orderFound)
            generate('invoice').then((invoiceNo) => {
                console.log("verifyPayment invoice", invoiceNo)
                const secret = razorpayConfig.key_secret;
                const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature, secret);

                if (isValid) {
                    let ins = new transactionModel({
                        userId: orderFound.userId,
                        cartId: orderFound.cartId,
                        addressId: orderFound.addressId,
                        amount: orderFound.amount,
                        orderId: orderFound.orderId,
                        paymentId: razorpayPaymentId,
                        signature: signature,
                        status: "Success",
                        invoiceNo: invoiceNo,
                    });
                    ins.save().then((created) => {
                        if (created) {
                            res.status(201).json({ statusCode: 201, error: false, message: "Payment verified Successfully.", data: created });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Payment is not verified." });
                        }
                    }).catch((error) => {
                        res.status(400).json({ statusCode: 400, error: true, message: "Payment is not verified." });
                    });
                } else {
                    let ins = new transactionModel({
                        userId: orderFound.userId,
                        cartId: orderFound.cartId,
                        addressId: orderFound.addressId,
                        amount: orderFound.amount,
                        orderId: orderFound.orderId,
                        paymentId: razorpayPaymentId,
                        signature: signature,
                        status: "Failed",
                        invoiceNo: invoiceNo,
                    });
                    ins.save().then((created) => {
                        if (created) {
                            res.status(400).json({ statusCode: 400, error: true, message: "Invalid payment signature.", data: created });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Payment is not verified." });
                        }
                    }).catch((error) => {
                        res.status(400).json({ statusCode: 400, error: true, message: "Payment is not verified." });
                    });
                }
            }).catch((error) => {
                res.status(400).json({ statusCode: 400, error: true, message: "Payment is not verified." });
            });
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: "OrderId not found." });
        }
    }).catch((error) => {
        res.status(400).json({ statusCode: 400, error: true, message: "OrderId not found." });
    });
};
export const getAllTransaction = (req, res) => {
    const requiredFields = ['limit', 'page', 'status'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    if (req.role == "User") {
        if (req.body.status != "All") {
            if (req.body.data) {
                transactionModel.find({
                    userId: new ObjectId(req.userId),
                    status: req.body.status,
                    $or: [
                        { first_name: { $regex: req.body.data, $options: 'i' } },
                        { last_name: { $regex: req.body.data, $options: 'i' } },
                        { paymentId: { $regex: req.body.data, $options: 'i' } },
                        { invoiceNo: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                transactionModel.find({ userId: new ObjectId(req.userId), status: req.body.status }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        } else {
            if (req.body.data) {
                transactionModel.find({
                    userId: new ObjectId(req.userId),
                    $or: [
                        { first_name: { $regex: req.body.data, $options: 'i' } },
                        { last_name: { $regex: req.body.data, $options: 'i' } },
                        { paymentId: { $regex: req.body.data, $options: 'i' } },
                        { invoiceNo: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                transactionModel.find({ userId: new ObjectId(req.userId) }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        }
    } else {
        if (req.body.status != "All") {
            if (req.body.data) {
                transactionModel.find({
                    status: req.body.status,
                    $or: [
                        { first_name: { $regex: req.body.data, $options: 'i' } },
                        { last_name: { $regex: req.body.data, $options: 'i' } },
                        { paymentId: { $regex: req.body.data, $options: 'i' } },
                        { invoiceNo: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                transactionModel.find({ status: req.body.status }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        } else {
            if (req.body.data) {
                transactionModel.find({
                    $or: [
                        { first_name: { $regex: req.body.data, $options: 'i' } },
                        { last_name: { $regex: req.body.data, $options: 'i' } },
                        { paymentId: { $regex: req.body.data, $options: 'i' } },
                        { invoiceNo: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                transactionModel.find({}).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((transactionFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: transactionFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        }
    }
};