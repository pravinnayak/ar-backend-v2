import express, { NextFunction, Request, Response } from 'express';
const router:any = express.Router();
import aux from '../Utility/auxiliary';
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD, CATEGORY_ROUTE, PAGINATION } from '../Utility/variables';
import { brandActiveCheck } from '../middleware/brandActiveCheck'; 
import { uploadImageToS3 } from '../Utility/multer';
import productJoi from '../JoiSchema/productJOI'


let routeStructure = [
    {
        routes: [
            `${BRAND_ROUTE}/image`,
            `${SUB_BRAND_ROUTE}/image`,
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            brandActiveCheck,
            uploadImageToS3.single('file'),
            function (req:Request, res:Response, next:NextFunction) {
                // console.log(req.file)
                let location = (req as any)?.file?.location || ""
                location = aux.replaceS3LinkWithCloundFront(location)
                aux.sendResponse(res, 200, "uploaded", location || null)
            }
        ]
    }
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}

export default router;