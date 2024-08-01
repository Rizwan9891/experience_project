import { ObjectId } from 'mongodb';
import faqModel from '../_models/faq.model.js';

export const addFaq = (req, res) => {
    if (req.role == "Admin") {
        const requiredFields = ['question', 'answer'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        faqModel.findOne({ question: req.body.question }).then((founded) => {
            if (founded) {
                res.status(401).json({ error: true, statusCode: 401, message: "Question already exist." });
            } else {
                let ins = new faqModel({
                    question: req.body.question,
                    answer: req.body.answer,
                })
                ins.save().then((created) => {
                    if (created) {
                        res.status(200).json({ statusCode: 200, error: false, message: "FAQ has been added successfully." });
                    } else {
                        res.status(400).json({ statusCode: 400, error: true, message: "FAQ not added." });
                    }
                }).catch((error) => {
                    console.log(error)
                    res.status(400).json({ statusCode: 400, error: true, message: "FAQ not added." });
                });
            }
        }).catch((error) => {
            console.log(error)
            res.status(500).json({ error: true, statusCode: 500, message: "FAQ not Added." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const deleteFaq = (req, res) => {
    if (req.role == "Admin") {
        faqModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
            if (deleted) {
                res.status(200).json({ error: false, statusCode: 200, message: "Faq Delete successfully." });
            } else {
                res.status(401).json({ error: true, statusCode: 401, message: "Faq not found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Faq not deleted." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const getFaqs = (req, res) => {
    faqModel.find({}).sort({ createdAt: -1 }).then((faqFound) => {
        if (faqFound) {
            res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: faqFound });
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "No data found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    });
};