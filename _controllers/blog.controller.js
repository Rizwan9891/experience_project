import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import blogModel from '../_models/blog.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';

export const addBlog = (req, res) => {
    if (req.role == "Admin") {
        const form = new IncomingForm();
        form.parse(req, (error, fields, files) => {
            const requiredFields = ['title', 'description'];
            for (const field of requiredFields) {
                if (fields[field] === undefined || fields[field] === null || (typeof fields[field] === 'object' && fields[field][0] === '') || (typeof fields[field] !== 'string' && !fields[field])) {
                    return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
                }
            }
            if (files.image && files.image.length > 0) {
                blogModel.findOne({ title: fields.title[0] }).sort({ createdAt: -1 }).then((blogFound) => {
                    if (blogFound) {
                        res.status(400).json({ error: true, statusCode: 400, message: "This Blog is already exist." });
                    } else {
                        uploadImage(files).then((uploaded) => {
                            let ins = new blogModel({
                                image: uploaded,
                                title: fields.title[0],
                                description: fields.description[0]
                            })
                            ins.save().then((created) => {
                                if (created) {
                                    res.status(200).json({ statusCode: 200, error: false, message: "Blog has been added successfully." });
                                } else {
                                    res.status(400).json({ statusCode: 400, error: true, message: "Blog not added." });
                                }
                            }).catch((error) => {
                                console.log(error)
                                res.status(400).json({ statusCode: 400, error: true, message: "Blog not added." });
                            });
                        }).catch((error) => {
                            console.log(error)
                            res.status(400).json({ statusCode: 400, error: true, message: `Invalid Image.` });
                        });
                    }
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
                });
            } else {
                res.status(400).json({ statusCode: 400, error: true, message: `Image is required.` });
            }
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const deleteBlog = (req, res) => {
    if (req.role == "Admin") {
        blogModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
            if (deleted) {
                res.status(200).json({ error: false, statusCode: 200, message: "Blog Delete successfully." });
            } else {
                res.status(401).json({ error: true, statusCode: 401, message: "Blog not found." });
            }
        }).catch((error) => {
            res.status(500).json({ error: true, statusCode: 500, message: "Blog not deleted." });
        });
    } else {
        res.status(500).json({ error: true, statusCode: 500, message: "You can't access." });
    }
};
export const getBlogs = (req, res) => {
    blogModel.find({}).sort({ createdAt: -1 }).then((blogFound) => {
        if (blogFound) {
            res.status(200).json({ error: false, statusCode: 200, message: "Data found successfully.", data: blogFound });
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "No data found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    });
};