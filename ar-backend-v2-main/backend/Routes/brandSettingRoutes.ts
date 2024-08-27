import express from 'express';
const router:any = express.Router();
let pagination = `/page/:pageNo/limit/:limit`
import brandSettingController from '../Controller/brandSettingController';
import brandSettingJOI from '../JoiSchema/brandSettingJOI';
import aux from '../Utility/auxiliary';
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD } from '../Utility/variables';
import { brandActiveCheck } from '../middleware/brandActiveCheck';
import { authorizedUser } from '../middleware/auth';

let routeStructure = [
    {
        routes: [
            `/create`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(brandSettingJOI.insertBrandSetting()),
            brandSettingController.insertBrandSetting()
        ]
    },
    {
        routes: [
            `/update`
        ],
        method: PUT_METHOD,
        functions: [
            authorizedUser,
            aux.joiValidator(brandSettingJOI.updateBrandSetting()),
            brandSettingController.updateBrandSetting()
        ]
    },
    {
        routes: [
            `/get${BRAND_ROUTE}`
        ],
        method: GET_METHOD,
        functions: [
            brandActiveCheck,
            brandSettingController.getBrandSetting()
        ]
    },
    {
        routes: [
            `/enableOrDisable/:enableOrDisable`,
        ],
        method: PUT_METHOD,
        functions: [
            brandActiveCheck,
            brandSettingController.updateBrandSettingStatus()
        ]
    }
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}
export default router;