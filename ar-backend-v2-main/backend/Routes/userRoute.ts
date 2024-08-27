import express from 'express';
const router:any = express.Router();
import aux from '../Utility/auxiliary'
import { BODY, PARAMS, SUB_BRAND_ROUTE, BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD, BODY_PARAMS } from '../Utility/variables'
import userController from '../Controller/userController';
import { brandActiveCheck }from '../middleware/brandActiveCheck';
import { authorizedUser }  from '../middleware/auth';
import userJOI from '../JoiSchema/userJOI';

let routeStructure = [
    {
        routes: [
            `/loginForBrand`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(userJOI.loginForBrand(), BODY),
            brandActiveCheck,
            userController.loginForBrand()
        ]
    },
    {
        routes: [
            `/brandAssociatedWithUser`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(userJOI.brandAssociatedWithUser(), BODY),
            userController.brandAssociatedWithUser()
        ]
    },
    {
        routes: [
            `/auth/forget-password`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(userJOI.forgetPassword(), BODY),
            userController.forgotPassword()
        ]
    },
    {
        routes: [
            `/auth/reset-password`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(userJOI.resetPassword(), BODY),
            userController.resetPassword()
        ]
    },
    {
        routes: [
            `/auth/change-password${BRAND_ROUTE}`
        ],
        method: PUT_METHOD,
        functions: [
            aux.joiValidator(userJOI.changePassword(), BODY_PARAMS),
            authorizedUser,
            brandActiveCheck,
            userController.changePassword()
        ]
    },
    {
        routes: [
            `/remove-user${BRAND_ROUTE}`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(userJOI.removeUserFromBrand(), BODY_PARAMS),
            authorizedUser,
            brandActiveCheck,
            userController.removeUserFromBrand()
        ]
    },
    {
        routes: [
            `/invite-user${BRAND_ROUTE}`
        ],
        method: POST_METHOD,
        functions: [
            aux.joiValidator(userJOI.inviteUser(), BODY_PARAMS),
            authorizedUser,
            brandActiveCheck,
            userController.inviteUser()
        ]
    },
    {
        routes: [
            `/users-list${BRAND_ROUTE}`
        ],
        method: GET_METHOD,
        functions: [
            aux.joiValidator(userJOI.getUsersListUnderBrand(), PARAMS),
            authorizedUser,
            brandActiveCheck,
            userController.getUsersListUnderBrand()
        ]
    }
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}
export default router;