import express, { Router } from 'express';
const router:any = express.Router();
let pagination = `/page/:pageNo/limit/:limit`
import BrandController from '../Controller/brandController';
import brandJOI from '../JoiSchema/brandJOI';
import aux from '../Utility/auxiliary';
const brand = `/brand/:brandId`
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD } from '../Utility/variables';
import { brandActiveCheck } from '../middleware/brandActiveCheck';
import { authorizedUser } from '../middleware/auth';
import { refererPolicyCheck } from '../middleware/refererCheck';

let routeStructure = [
    {
        routes: [
            `/create`
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            aux.joiValidator(brandJOI.createBrand()),
            BrandController.createBrand()
        ]
    },
    {
        routes: [
            `/newmirrarapplicable${BRAND_ROUTE}`
        ],
        method: GET_METHOD, // get , put , post, delete
        functions: [
            BrandController.newmirrarapplicable()
        ]
    },
    {
        routes: [
            `/newmirrarapplicable${BRAND_ROUTE}`
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            authorizedUser,
            BrandController.updateNewMirrarApplicable()
        ]
    },
    {
        routes: [
            `/bulk/create`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(brandJOI.bulkCreateBrand()),
            BrandController.bulkCreateBrand()
        ]
    },
    {
        routes: [
            `/subBrand/upsert`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(brandJOI.bulkUpsetSubBrandMapping()),
            BrandController.upsertSubBrandMapping()
        ]
    },
    {
        routes: [
            `/disable`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(brandJOI.updateBrandStatus()),
            BrandController.updateBrandStatus()
        ]
    },
    {
        routes: [
            `/enable`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(brandJOI.updateBrandStatus()),
            BrandController.updateBrandStatus()
        ]
    },
    {
        routes: [
            `/details${BRAND_ROUTE}`,  `${BRAND_ROUTE}/id-login`
        ],
        method: GET_METHOD,
        functions: [
            aux.joiValidator(brandJOI.getBrandDetailsById(), PARAMS),
            BrandController.getBrandDetailsById()
        ]
    },
    {
        routes: [
            `/auth`
        ],
        method: POST_METHOD,
        functions: [
            brandActiveCheck,
            refererPolicyCheck,
            aux.joiValidator(brandJOI.authBrand()),
            BrandController.authBrand()
        ]
    },
]

for (let eachRouteStructure of routeStructure) {    
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}

export default router;