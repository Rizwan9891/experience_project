import appConfig from '../_models/appConfig.model.js'

export const generate = (type) => {
    return new Promise((resolve, reject) => {
        appConfig.findOne({}).sort({ createdAt: -1 }).then((found) => {
            if (found) {
                if (type == 'user') {
                    let userSr = found.userSr
                    appConfig.updateOne({ _id: found._id }, { $inc: { userSr: 1 } }).then((update) => {
                        resolve(userSr)
                    }).catch((error) => {
                        reject("App Config Not Update.");
                    })
                } else if (type == 'invoice') {
                    let invoiceNo = found.invoiceNo
                    appConfig.updateOne({ _id: found._id }, { $inc: { invoiceNo: 1 } }).then((update) => {
                        resolve(invoiceNo)
                    }).catch((error) => {
                        reject("App Config Not Update.");
                    })
                } else {
                    reject("Invalid Type.");
                }
            } else {
                reject("App Config Not Found.");
            }
        }).catch((error) => {
            reject("App Config Not Found.");
        })
    });
};
