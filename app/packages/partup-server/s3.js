options = {
    params: { Bucket: process.env.AWS_BUCKET_NAME }
};

if (process.env.AWS_S3_ENDPOINT) {
    options.endpoint = process.env.AWS_S3_ENDPOINT;
    options.s3ForcePathStyle = true;
}

S3 = new AWS.S3(options);