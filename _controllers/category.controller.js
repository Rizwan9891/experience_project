import { ObjectId } from 'mongodb';
import { IncomingForm } from 'formidable';
import categoryModel from '../_models/category.model.js';
import { uploadImage } from '../_helpers/aws.helper.js';

export const addCategory = (req, res) => {
    const form = new IncomingForm();
    form.parse(req, (error, fields, files) => {
        const requiredFields = ['name'];
        for (const field of requiredFields) {
            if (fields[field] === undefined || fields[field] === null || (typeof fields[field] === 'object' && fields[field][0] === '') || (typeof fields[field] !== 'string' && !fields[field])) {
                return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
            }
        }
        if (files.image && files.image.length > 0) {
            uploadImage(files).then((uploaded) => {
                let ins = new categoryModel({
                    image: uploaded,
                    name: fields.name[0],
                });
                ins.save().then((created) => {
                    console.log(created)
                    if (created) {
                        res.status(201).json({ statusCode: 201, error: false, message: "Category has been added successfully.", data: created });
                    } else {
                        res.status(400).json({ statusCode: 400, error: true, message: "Category not added." });
                    }
                }).catch((error) => {
                    console.log(error)
                    res.status(400).json({ statusCode: 400, error: true, message: "Category not added." });
                });
            }).catch((error) => {
                console.log(error)
                res.status(400).json({ statusCode: 400, error: true, message: `Invalid Image.` });
            })
        } else {
            res.status(400).json({ statusCode: 400, error: true, message: `Image is required.` });
        }
    });
};
export const deleteCategory = (req, res) => {
    categoryModel.findByIdAndDelete({ _id: new ObjectId(req.params.id) }).then((deleted) => {
        if (deleted) {
            res.status(200).json({ error: false, statusCode: 200, message: "Category Delete successfully." });
        } else {
            res.status(401).json({ error: true, statusCode: 401, message: "Category not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Category not deleted." });
    });
};
export const getCategories = (req, res) => {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    categoryModel.countDocuments({}).then(countFound => {
        categoryModel.find({}).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).then(found => {
            res.status(200).json({ error: false, statusCode: 200, message: "Find successfully", data: found, count: countFound });
        }).catch(error => {
            console.log(error)
            res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
        });
    }).catch(error => {
        console.log(error)
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Details." });
    });
};