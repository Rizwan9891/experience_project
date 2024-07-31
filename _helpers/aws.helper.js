import AWS from 'aws-sdk';
import fs from 'fs';
import { awsConfig } from '../_configs/aws.config.js';

AWS.config.update({
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
});

const s3 = new AWS.S3();

const isImageFile = (mimetype) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return allowedImageTypes.includes(mimetype);
};

export const uploadImage = (files) => {
    return new Promise((resolve, reject) => {
        if (files.image && isImageFile(files.image[0].mimetype)) {
            const file = files.image[0];
            const params = {
                Bucket: awsConfig.bucket,
                Key: `images/${Date.now() + "_" + file.originalFilename}`,
                Body: fs.createReadStream(file.filepath),
                ContentType: file.mimetype,
            };

            s3.upload(params, (err, data) => {
                if (err) {
                    reject("File not uploaded");
                } else {
                    resolve(data.Location);
                }
            });
        } else {
            reject("Invalid image file.");
        }
    });
};
