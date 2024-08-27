import { validateToken } from '../Utility/token';
import userQueries = require('../DB/queries/UserQueries')
import userTokenModel from '../Model/userTokenModel'
import  _ from 'lodash';
import { NextFunction, Response } from 'express';

async function authorizedUser(req:any, res:Response, next:NextFunction) {
    const authHeaderValue = req.headers.authorization
    if (!authHeaderValue) {
        return res.status(403).send('Unauthorized!')
    }

    const token = authHeaderValue.replace("Bearer ", "");
    if (validateToken(req, token)) {
        let authorized = (await userQueries.default.getSingleDataByCondition(userTokenModel, { accessToken: token }))?.dataValues
        if (authorized?.userId) {
            const user = {
                userId: req?.claims?.user?.userId,
                ...(_.pick(req?.claims?.user, ['userName', 'userProfileImage', 'userEmail', 'brandId']))
            }
            req.claims = {
                user
            }

            next()
        } else {
            return res.status(403).send('Unauthorized!')
        }
    } else {
        return res.status(403).send('Unauthorized!')
    }
}

export {
    authorizedUser
}