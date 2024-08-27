import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});
const uploadCsvForProduct = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + "_" + (req?.params?.brandId || "") + "_" + file.originalname);
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 1000 // Limits to 1000 MB
    },
})

const uploadZipForImages = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + "_" + (req?.params?.brandId || "") + "_" + file.originalname);
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 100000 // Limits to 10GB
    },
})
const uploadImageToS3 = multer({
    storage: multerS3({
        s3: (s3 as any),
        bucket: (process.env.AWS_BUCKET || ""),
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req: Express.Request, file: Express.Multer.File, cb) {
            const brandDetails = (req as any)['brandDetails']
            const brandId = brandDetails.uuid || brandDetails.brandId
            const brandName = brandDetails?.brandAliasName || brandId
            const fileName = file.originalname.replace(/\s/g, "_") // last is always the file name
            const s3FilePath = `${brandName}/${ (new Date().toDateString().replace(/ /gi, '-'))}/${fileName}`
            // req['s3FilePath'] = s3FilePath
            // console.log(file, "file")
            cb(null, s3FilePath)
        }
    }),
    limits: {
        fileSize: 1024 * 1024 * 1000 // Limits to 100 MB 
    }
});

export {
    uploadCsvForProduct,
    uploadZipForImages,
    uploadImageToS3
}