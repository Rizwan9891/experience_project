import { addReviewToProduct, getRatingByUserId } from '../_controllers/rating.controller.js';
import { auth } from '../_middleware/auth.middleware.js'

export default (app) => {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
        res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
        res.header('Cache-Control', 'no-cache');
        res.header('Content-Type', 'application/json; charset=utf-8');
        next();
    });
    app.post('/api/rating/review/product/add', auth, addReviewToProduct);
    app.get('/api/rating/get/by/userId', auth, getRatingByUserId);
};
