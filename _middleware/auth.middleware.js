import jsonwebtoken from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import user from '../_models/user.model.js';

export const auth = (req, res, next) => {

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(400).json({ error: true, statusCode: 400, message: "Bearer Token is Required." });
    }
    const token = authorizationHeader.split(' ')[1];
    if (!token) {
        return res.status(400).json({ error: true, statusCode: 400, message: "Token is Required." });
    }
    jsonwebtoken.verify(token, "privateKey", (error, payload) => {
        if (error) {
            res.status(500).json({ error: true, statusCode: 2, message: "Token expired please login again.." })
        } else {
            user.findOne({ _id: new ObjectId(payload._id) }).then((userFound) => {
                if (userFound != null) {
                    req.userId = userFound._id
                    req.role = userFound.role
                    req.name = userFound.name
                    next()
                } else {
                    res.status(500).json({ error: true, statusCode: 2, message: "Unauthorized." });
                }
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 2, message: "Unauthorized." });
            });
        }
    });
}