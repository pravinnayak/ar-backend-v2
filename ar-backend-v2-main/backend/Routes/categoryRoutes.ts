import express from 'express';
const router:any = express.Router();
let pagination = `/page/:pageNo/limit/:limit`
import categoryController from '../Controller/categoryController';
import categoryJOI from '../JoiSchema/categoryJOI';
import aux from '../Utility/auxiliary';
const brand = `/brand/:brandId`
const subBrand = `/brand/:brandId/subBrand/:subBrandId`
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD } from '../Utility/variables';


let routeStructure = [
    {
        routes: [
            `/create`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(categoryJOI.insertCategory()),
            categoryController.insertCategory()
        ]
    },
    {
        routes: [
            `/get${BRAND_ROUTE}/category-parents`
        ],
        method: GET_METHOD, 
        functions: [
            categoryController.getCategoryParentDetails()
        ]
    },
    {
        routes: [
            `/update`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(categoryJOI.updateCategory()),
            categoryController.updateCategoryDetails()
        ]
    },
    {
        routes: [
            `/get${BRAND_ROUTE}`, `/get${SUB_BRAND_ROUTE}`
        ],
        method: GET_METHOD,
        functions: [
            categoryController.getCategoryDetails()
        ]
    }
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}
export default router;