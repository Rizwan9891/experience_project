import { addProduct, deleteProduct, getAllProduct, getProductById, search, updateProduct } from '../_controllers/product.controller.js';
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
    app.post('/api/admin/product/add', auth, addProduct);
    app.delete('/api/admin/product/delete/:id', auth, deleteProduct);
    app.patch('/api/admin/product/update/quantity', auth, updateProduct);
    app.get('/api/product/get/all', auth, getAllProduct);
    app.get('/api/product/get/byProductId/:productId', getProductById);
    app.post('/api/product/search', search);
};
