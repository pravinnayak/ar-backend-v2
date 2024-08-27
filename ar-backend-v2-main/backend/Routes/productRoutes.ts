import express from 'express';
const router:any = express.Router();
let pagination = `/page/:pageNo/limit/:limit`
import ProductController from '../Controller/productController';
import brandJOI from '../JoiSchema/brandJOI';
import aux from '../Utility/auxiliary';
const brand = `/brand/:brandId`
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD, CATEGORY_ROUTE, PAGINATION, SEARCH_TERM } from '../Utility/variables';
import { brandActiveCheck } from '../middleware/brandActiveCheck'; 
import { uploadCsvForProduct, uploadZipForImages } from '../Utility/multer';
import productJoi from '../JoiSchema/productJOI'
import { authorizedUser } from '../middleware/auth';


let routeStructure = [
    {
        routes: [
            `${BRAND_ROUTE}/upload/csv`,
            `${SUB_BRAND_ROUTE}/upload/csv`,
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            authorizedUser,
            brandActiveCheck,
            uploadCsvForProduct.single('file'),
            ProductController.uploadInventorySheet()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/categories/:categories/inventories`,
            `${SUB_BRAND_ROUTE}/categories/:categories/inventories`,
            `${BRAND_ROUTE}/categories/:categories/inventories${SEARCH_TERM}`,
            `${SUB_BRAND_ROUTE}/categories/:categories/inventories${SEARCH_TERM}`,
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            brandActiveCheck,
            ProductController.fetchInventories()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/categories/:categories/variant/:variantSku/update/calibration`
        ],
        method: PUT_METHOD, 
        functions: [
            brandActiveCheck,
            aux.joiValidator(productJoi.updateCategory()),
            ProductController.saveCalibrationDetails()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/upload/images`
        ],
        method: POST_METHOD,
        functions: [
            brandActiveCheck,
            uploadZipForImages.single('file'),
            ProductController.convertImagesToS3Url()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}${CATEGORY_ROUTE}/variant${PAGINATION}`,
            `${BRAND_ROUTE}${CATEGORY_ROUTE}/variant${SEARCH_TERM}${PAGINATION}`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(productJoi.getVariantDetails()),
            brandActiveCheck,
            ProductController.getVariantDetails()
        ]
    },

    {
        routes: [
            `${BRAND_ROUTE}/edit`,
            `${SUB_BRAND_ROUTE}/edit`,
        ],
        method: POST_METHOD, 
        functions: [
            brandActiveCheck,
            ProductController.editProductByID()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/variant/edit`,
            `${BRAND_ROUTE}/categories/:categories/variant/edit`,
            `${SUB_BRAND_ROUTE}/categories/:categories/variant/edit`,
        ],
        method: POST_METHOD, 
        functions: [
            authorizedUser,
            brandActiveCheck, 
            ProductController.editVariantByID()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/variant/variantSku/:variantSku`,
        ],
        method: GET_METHOD,
        functions: [
            brandActiveCheck,
            ProductController.searchVariantWithVariantSKU()
        ]
    },
    {
        routes: [
            `${BRAND_ROUTE}/categories/:category/variant/:variantSku/productHandle/:productHandle/exactSearch`,
            `${SUB_BRAND_ROUTE}/categories/:category/variant/:variantSku/productHandle/:productHandle/exactSearch`
        ],
        method: GET_METHOD,
        functions: [brandActiveCheck, ProductController.searchExactInventoriesForVariant()],
    },
    {
        routes: [
            `${BRAND_ROUTE}/categories/:category${SEARCH_TERM}/search${pagination}`,
            `${SUB_BRAND_ROUTE}/categories/:category${SEARCH_TERM}/search${pagination}`
        ],
        method: POST_METHOD,
        functions: [brandActiveCheck, ProductController.searchInventoriesForVariant()],
    },
    {
        routes: [
            `${BRAND_ROUTE}/variant`,
            `${BRAND_ROUTE}/categories/:categories/variant`,
            `${SUB_BRAND_ROUTE}/categories/:categories/variant`
        ],
        method: DELETE_METHOD,
        functions: [
            aux.joiValidator(productJoi.deleteVariantDetailsById()),
            authorizedUser,
            brandActiveCheck, 
            ProductController.deleteVariantByID()
        ],
    },   
    {
        routes: [
            `${BRAND_ROUTE}/product`,
        ],
        method: DELETE_METHOD,
        functions: [
            aux.joiValidator(productJoi.deleteProductDetailsById()),
            // authorizedUser,
            brandActiveCheck, 
            ProductController.deleteProductByID()
        ],
    },
    {
        routes: [
            `${BRAND_ROUTE}/inventory/download`,
            `${SUB_BRAND_ROUTE}/inventory/download`,
        ],
        method: GET_METHOD, 
        functions: [
            authorizedUser,
            brandActiveCheck,
            ProductController.productExcelDownload()
        ]
    },   
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}

export default router;