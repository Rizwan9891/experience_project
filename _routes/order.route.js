import { placeOrder, changeStatus, getAllOrderForAdmin, getAllOrderByUserId } from '../_controllers/order.controller.js';
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
    app.post('/api/order/place', auth, placeOrder);
    app.post('/api/order/change/status', auth, changeStatus);
    app.post('/api/order/get/all', auth, getAllOrderForAdmin);
    app.get('/api/order/get/all/by/userId', auth, getAllOrderByUserId);
};
