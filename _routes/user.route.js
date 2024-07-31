import { signup, login, adminLogin, changePassword, getDetails, accountVerification, changeStatus, forgotPassword, resetPassword, updateProfile, getAllUsers, deleteUser, getAllCount } from '../_controllers/user.controller.js';
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
    // Admin API
    app.post('/api/admin/login', adminLogin);
    app.post('/api/admin/change/status', auth, changeStatus);
    app.post('/api/admin/user/get/all', auth, getAllUsers);
    app.delete('/api/admin/delete/user/:id', auth, deleteUser);
    app.get('/api/admin/get/all/count', auth, getAllCount);

    // User API
    app.post('/api/user/signup', signup);
    app.post('/api/user/account/verification', accountVerification);
    app.post('/api/user/login', login);
    app.post('/api/user/change/password', auth, changePassword);
    app.post('/api/user/forgot/password', forgotPassword);
    app.post('/api/user/reset/password', resetPassword);
    app.get('/api/user/get/details', auth, getDetails);
    app.post('/api/user/update/profile', auth, updateProfile);
};
