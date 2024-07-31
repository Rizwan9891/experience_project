import { addBanner, deleteBanner, getBanners } from '../_controllers/banner.controller.js';
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
    app.post('/api/banner/add', auth, addBanner);
    app.get('/api/banner/get/all', getBanners);
    app.delete('/api/banner/delete/:id', auth, deleteBanner);
};
