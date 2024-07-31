import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { emailConfig } from '../_configs/mailer.config.js';

const transporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
        type: emailConfig.type,
        clientId: emailConfig.clientId,
        clientSecret: emailConfig.clientSecret,
    },
});

const auth = {
    user: emailConfig.user,
    refreshToken: emailConfig.refreshToken,
    accessToken: emailConfig.accessToken,
    expires: emailConfig.expires,
}

export const sendMail = (receiver, OTP, type) => {
    return new Promise((resolve, reject) => {
        if (type === 'forgot_password' || type === 'signup') {
            ejs.renderFile('_templates/otp.ejs', { OTP }).then((template) => {
                transporter.sendMail({
                    from: `Experience team <${emailConfig.user}>`,
                    to: receiver,
                    subject: 'Verification code-Experience!',
                    html: template,
                    auth: auth,
                }).then((send) => {
                    resolve(send)
                }).catch((error) => {
                    reject(error)
                });
            }).catch((error) => {
                reject(error)
            });
        } else {
            reject(new Error('Invalid email type'));
        }
    });
};