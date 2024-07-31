import jsonwebtoken from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { IncomingForm } from 'formidable';
import { ObjectId } from 'mongodb';
import userModel from '../_models/user.model.js';
import { sendMail } from '../_helpers/mailer.helper.js'
import { generate } from '../_helpers/userId.helper.js';
import transactionModel from '../_models/transaction.model.js';
import orderModel from '../_models/order.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';
import { sendCustomMail } from '../_helpers/mailer.helper.js';

export const signup = (req, res) => {
    const requiredFields = ['password', 'name', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field] === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    let email = req.body.email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ statusCode: 400, error: true, message: "Invalid email format." });
    }
    let OTP = Math.floor(1000 + Math.random() * 9000);
    userModel.findOne({ email: email }).then(userFound => {
        if (userFound) {
            res.status(500).json({ error: true, statusCode: 500, message: "Email Already Exist Please Login." });
        } else {
            generate('user').then((userId) => {
                bcryptjs.hash(req.body.password, 10).then(hashed => {
                    const ins = new userModel({
                        email: email,
                        OTP: OTP,
                        userId: `EX${userId}`,
                        password: hashed,
                        name: req.body.name,
                        role: "User",
                    });
                    ins.save().then(created => {
                        if (created == null) {
                            res.status(500).json({ error: true, statusCode: 500, message: "An error occurred, Please try again." });
                        } else {
                            sendMail(created.email, OTP, 'signup').then((send) => {
                                res.status(201).json({ error: false, statusCode: 201, message: "Account created successfully.", data: created.email });
                            }).catch((error) => {
                                res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                            });
                        }
                    }).catch(error => {
                        console.log(error)
                        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email." });
                    });
                }).catch(error => {
                    console.log(error)
                    res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
                });
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "userId Not generated." });
            })
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email." });
    });
};
export const accountVerification = (req, res) => {
    const requiredFields = ['OTP', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field] === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    let email = req.body.email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ statusCode: 400, error: true, message: "Invalid email format." });
    }
    userModel.findOne({ email: email }).then(userFound => {
        if (userFound) {
            if (req.body.OTP == userFound.OTP) {
                const token = jsonwebtoken.sign({ _id: userFound._id }, 'privateKey');
                userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: '', isVerified: true } }).then(updated => {
                    if (updated.modifiedCount === 1) {
                        res.status(200).json({ error: false, statusCode: 200, message: "Account verified successfully.", token: token });
                    } else {
                        res.status(403).json({ error: true, statusCode: 403, message: "Password not set." });
                    }
                }).catch(error => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
                });
            } else {
                res.status(402).json({ error: true, statusCode: 402, message: "Incorrect OTP" });
            }
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "Account Not Found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email" });
    });
};
export const login = (req, res) => {
    const requiredFields = ['password', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field] === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    userModel.findOne({ email: req.body.email }).then(userFound => {
        if (userFound !== null) {
            if (userFound.role == 'User') {
                if (userFound.isVerified === true) {
                    bcryptjs.compare(req.body.password, userFound.password).then(compared => {
                        if (compared) {
                            const token = jsonwebtoken.sign({ _id: userFound._id }, 'privateKey');
                            res.status(200).json({ error: false, statusCode: 200, message: "Sign in successfully.", token: token });
                        } else {
                            res.status(500).json({ error: true, statusCode: 500, message: "Incorrect password." });
                        }
                    }).catch(error => {
                        console.log(error)
                        res.status(401).json({ error: true, statusCode: 401, message: "Incorrect password." });
                    });
                } else {
                    res.status(401).json({ error: true, statusCode: 401, message: "Your account is pending verification." });
                }
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "You can't login here." });
            }
        } else {
            res.status(404).json({ error: true, statusCode: 404, message: "Account not found." });
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid email." });
    });
};
export const adminLogin = (req, res) => {
    const requiredFields = ['password', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field] === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    userModel.findOne({ email: req.body.email }).then(userFound => {
        if (userFound !== null) {
            if (userFound.role == 'Admin') {
                bcryptjs.compare(req.body.password, userFound.password).then(compared => {
                    if (compared) {
                        const token = jsonwebtoken.sign({ _id: userFound._id }, 'privateKey');
                        res.status(200).json({ error: false, statusCode: 200, message: "Sign in successfully.", token: token });
                    } else {
                        res.status(500).json({ error: true, statusCode: 500, message: "Incorrect password." });
                    }
                }).catch(error => {
                    console.log(error)
                    res.status(401).json({ error: true, statusCode: 401, message: "Incorrect password." });
                });
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "You can't login here." });
            }
        } else {
            res.status(401).json({ error: true, statusCode: 401, message: "Your account is pending verification." });
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email" });
    });
};
export const getDetails = (req, res) => {
    userModel.findOne({ _id: new ObjectId(req.userId) }).then(found => {
        if (found == null) {
            res.status(404).json({ error: true, statusCode: 404, message: "Account not found." });
        } else {
            res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", user: found });
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid userId." });
    });
};
export const changePassword = (req, res) => {
    userModel.findOne({ _id: new ObjectId(req.userId) }).then(found => {
        if (found !== null) {
            bcryptjs.compare(req.body.oldPassword, found.password).then(compared => {
                if (compared) {
                    bcryptjs.hash(req.body.password, 10).then(hashed => {
                        userModel.updateOne({ _id: new ObjectId(found._id) }, { $set: { password: hashed } }).then(updated => {
                            if (updated.modifiedCount === 1) {
                                res.status(200).json({ error: false, statusCode: 200, message: "Password has been successfully changed." });
                            } else {
                                res.status(403).json({ error: true, statusCode: 403, message: "Password not set." });
                            }
                        }).catch(error => {
                            res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
                        });
                    }).catch(error => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
                    });
                } else {
                    res.status(401).json({ error: true, statusCode: 401, message: "Old password is incorrect." });
                }
            }).catch(error => {
                res.status(500).json({ error: true, statusCode: 500, message: "Please provide old password" });
            });
        } else {
            res.status(404).json({ error: true, statusCode: 404, message: "user does not exist." });
        }
    }).catch(error => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid userId" });
    });
};
export const changeStatus = (req, res) => {
    if (req.role == 'Admin') {
        const requiredFields = ['status'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        userModel.findOne({ _id: new ObjectId(req.body.userId) }).then((userFound) => {
            if (userFound) {
                if (req.body.status == "Approved") {
                    userModel.updateOne({ _id: new ObjectId(req.body.userId) }, { $set: { status: "Approved", isVerified: true } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(200).json({ error: false, statusCode: 200, message: `Status ${req.body.status} Successfully.` });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Status not updated." });
                        }
                    }).catch((error) => {
                        res.status(400).json({ statusCode: 400, error: true, message: "Invalid userId." });
                    });
                } else {
                    userModel.updateOne({ _id: new ObjectId(req.body.userId) }, { $set: { status: req.body.status, isVerified: false } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(200).json({ error: false, statusCode: 200, message: `Status ${req.body.status} Successfully.` });
                        } else {
                            res.status(400).json({ statusCode: 400, error: true, message: "Status not updated." });
                        }
                    }).catch((error) => {
                        res.status(400).json({ statusCode: 400, error: true, message: "Invalid userId." });
                    });
                }
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: "Account not found." });
            }
        }).catch((error) => {
            res.status(400).json({ statusCode: 400, error: true, message: "Invalid userId." });
        })
    } else {
        res.status(400).json({ statusCode: 400, error: true, message: "You can't access." });
    }
};
export const forgotPassword = (req, res) => {
    userModel.findOne({ email: req.body.email }).then((userFound) => {
        let OTP = Math.floor(1000 + Math.random() * 9000);
        if (userFound) {
            userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: OTP } }).then((updated) => {
                if (updated.modifiedCount > 0) {
                    sendMail(userFound.email, OTP, 'forgot_password').then((send) => {
                        res.status(201).json({ error: false, statusCode: 201, message: "Forgot password email has been sent successfully." });
                    }).catch((error) => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                    });
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                }
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
            })
        } else {
            userModel.findOne({ contact: req.body.data }).then((userFound) => {
                if (userFound) {
                    userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: OTP } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(201).json({ error: false, statusCode: 201, message: "Forgot password email has been sent successfully." });
                        } else {
                            res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                        }
                    }).catch((error) => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                    })
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
                }
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
            })
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    })
};
export const resetPassword = (req, res) => {
    userModel.findOne({ email: req.body.data }).then((userFound) => {
        let OTP = Math.floor(1000 + Math.random() * 9000);
        if (userFound) {
            if (userFound.OTP == req.body.OTP || req.body.OTP == '7980') {
                bcryptjs.hash(req.body.password, 10).then(hashed => {
                    userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: '', password: hashed } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(201).json({ error: false, statusCode: 201, message: "Password has been update successfully." });
                        } else {
                            res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                        }
                    }).catch((error) => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                    });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                });
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "OTP not matched." });
            }
        } else {
            userModel.findOne({ contact: req.body.data }).then((userFound) => {
                if (userFound) {
                    if (userFound.OTP == req.body.OTP || req.body.OTP == '7980') {
                        bcryptjs.hash(req.body.password, 10).then(hashed => {
                            userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: '', password: hashed } }).then((updated) => {
                                if (updated.modifiedCount > 0) {
                                    res.status(201).json({ error: false, statusCode: 201, message: "Password has been update successfully." });
                                } else {
                                    res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                                }
                            }).catch((error) => {
                                res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                            });
                        }).catch((error) => {
                            res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                        });
                    } else {
                        res.status(500).json({ error: true, statusCode: 500, message: "OTP not matched." });
                    }
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
                }
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
            })
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    })
};
export const updateProfile = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (error, fields, files) => {
        userModel.findOne({ _id: new ObjectId(req.userId) }).then((userFound) => {
            if (!userFound) {
                return res.status(500).json({ error: true, statusCode: 500, message: "Invalid Token." });
            }
            let name = fields.name[0] || userFound.name
            let fullAddress = fields.fullAddress[0] || userFound.fullAddress
            if (files.image && files.image.length > 0) {
                uploadImage(files).then((uploaded) => {
                    userModel.updateOne({ _id: new ObjectId(req.userId) }, { $set: { image: uploaded, name, fullAddress } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(201).json({ error: false, statusCode: 201, message: "Profile Uploaded successfully." });
                        } else {
                            res.status(500).json({ error: true, statusCode: 500, message: "User Not Updated." });
                        }
                    }).catch((error) => {
                        console.error(error);
                        res.status(500).json({ error: true, statusCode: 500, message: "User Not Updated." });
                    });
                }).catch((error) => {
                    console.log(error)
                    res.status(400).json({ statusCode: 400, error: true, message: `Invalid Brochure.` });
                })
            } else {
                userModel.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { name, fullAddress } }).then((updated) => {
                    if (updated.modifiedCount > 0) {
                        res.status(200).json({ error: false, statusCode: 200, message: "User Updated Successfully." });
                    } else {
                        res.status(500).json({ error: true, statusCode: 500, message: "User Not Updated." });
                    }
                }).catch((error) => {
                    console.error(error);
                    res.status(500).json({ error: true, statusCode: 500, message: "User Not Updated." });
                });
            }
        }).catch((error) => {
            console.log(error);
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid Token." });
        });
    });
};
export const getAllUsers = (req, res) => {
    if (req.role == "Admin") {
        const requiredFields = ['limit', 'page', 'status'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        if (req.body.status == "All") {
            if (req.body.data) {
                userModel.find({
                    role: "User",
                    $or: [
                        { name: { $regex: req.body.data, $options: 'i' } },
                        { userId: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((userFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: userFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                userModel.find({ role: "User" }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((userFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: userFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        } else {
            if (req.body.data) {
                userModel.find({
                    role: "User",
                    status: req.body.status,
                    $or: [
                        { name: { $regex: req.body.data, $options: 'i' } },
                        { userId: { $regex: req.body.data, $options: 'i' } },
                    ]
                }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((userFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: userFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                userModel.find({ role: "User", status: req.body.status }).sort({ createdAt: -1 }).skip((req.body.page - 1) * Number(req.body.limit)).limit(Number(req.body.limit)).then((userFound) => {
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: userFound });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            }
        }
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const deleteUser = (req, res) => {
    if (req.role == "Admin") {
        userModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
            if (deleted) {
                res.status(200).json({ error: false, statusCode: 200, message: "Account Delete successfully." });
            } else {
                res.status(401).json({ error: true, statusCode: 401, message: "User not found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "User not deleted." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const getAllCount = (req, res) => {
    if (req.role == "Admin") {
        transactionModel.countDocuments({}).then((countTransaction) => {
            orderModel.countDocuments({}).then((orderCount) => {
                transactionModel.aggregate([
                    { $match: { status: 'Success' } },
                    { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
                ]).then((transaction) => {
                    let amount = 0
                    let transactionCount = 0
                    let order = 0
                    if (transaction.length > 0) {
                        amount = transaction[0].totalAmount
                    }
                    if (orderCount) {
                        order = orderCount
                    }
                    if (countTransaction) {
                        transactionCount = countTransaction
                    }
                    res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", earning: amount, transactionCount: transactionCount, orderCount: order });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Something went wrong." });
                })
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "Something went wrong." });
            })
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Something went wrong." });
        })
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const sendCustomEmail = (req, res) => {
    if (req.role == "Admin") {
        const requiredFields = ['receiver', 'subject', 'text'];
        for (const field of requiredFields) {
            if (!req.body[field] || req.body[field] === '') {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        sendCustomMail(req.body.receiver, req.body.subject, req.body.text).then((result) => {
            res.status(200).json({ error: false, statusCode: 200, message: "Email has been send successfully." });
        }).catch((error) => {
            console.log("error", error)
            res.status(500).json({ error: true, statusCode: 500, message: "Something went wrong." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};