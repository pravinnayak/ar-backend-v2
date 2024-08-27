import express, { NextFunction, Request, Response, Router } from 'express';
const router: any = express.Router();
import { authorizedUser } from "../middleware/auth"
import aux from "../Utility/auxiliary"
import { POST_METHOD } from "../Utility/variables"
import { webhookController } from '../Controller/webhookController';

let routeStructure = [
    {
        routes: [
            `/change/brandId`
        ],
        method: POST_METHOD, // get , put , post, delete
        functions: [
            authorizedUser,
            webhookController.changeBrandId()
        ]
    }
]

for (let eachRouteStructure of routeStructure) {
    for (let eachRoute of eachRouteStructure.routes) {
        router[eachRouteStructure.method](eachRoute, ...eachRouteStructure.functions)
    }
}
export default router;