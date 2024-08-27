import bcrypt from 'bcrypt';
import validate from "uuid-validate";
import geoIp from "geoip2-api";
import fs from 'fs';
import { NextFunction, Request, Response } from 'express';
import { ArraySchema, ObjectSchema } from 'joi';
declare type successCallback = () => void;
// @ts-ignore
import Brevo from "@getbrevo/brevo"

import ejs from "ejs"
import { promisify } from "util"
const renderHTMLFile: any = promisify(ejs.renderFile);
import path from "path"

class Auxiliary {
    constructor() { }

    getSequelizeError(error: any) {
        // let errorArr = []
        let errorName = error?.errors?.[0]?.message || error?.name || "SequelizeError"
        // error?.errors?.forEach(el => {
        //     errorArr?.push(el?.message)
        // });
        // if (errorArr.length === 0) errorArr.push(error?.original?.error || error?.parent)
        return {
            errorName,
            // errorArr
        }
    }

    sendResponse(res: Response, status: number, message: string, data?: any, successCallback?: successCallback) {
        res?.status(status)?.json({
            status,
            message,
            data: data?.meta ? data.data : data,
            meta: data?.meta || {},
            filter: data?.filter || {},
        });
        if (successCallback) {
            try {
                successCallback();
            } catch (error) {
                console.log(error, "callback function caused error");
            }
        }
    }

    async encryptPassword(password: string) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return [hashedPassword, salt];
    }

    requiredParamMissingHandler(body: any, keys: any[]) {
        let str = "";
        for (let i of keys) {
            if (!(body && (body[i] || body[i] == 0 || body[i] === null))) {
                str += i + ",";
            }
        }
        if (str) {
            str = str.slice(0, str.length - 1);
        }
        return str;
    }

    joiValidator = (schema: ObjectSchema | ArraySchema, type = "BODY") => {

        return async (req: Request, res: Response, next: NextFunction) => {
            let error
            let value
            let result
            switch (type) {
                case "BODY":
                    result = schema.validate(req?.body);
                    break;
                case "PARAMS":
                    result = schema.validate(req?.params);
                    break;
                case "QUERY":
                    result = schema.validate(req?.query);
                    break;
                case "BODY-PARAMS":
                    result = schema.validate({ ...req?.params, ...req?.body });
                    break;
                case "ALL":
                    result = schema.validate({ ...req?.query, ...req?.body, ...req?.params });
                    break;
                default:
                    result = schema.validate(req?.body);
                    break;
            }

            error = result?.error
            value = result?.value

            if (error) {
                console.log(error);
                aux.sendResponse(res, 400, error?.message, null);
            } else {
                next();
            }
        };
    };

    isUUID(str: string) {
        return validate(str);
    }

    async checkPassword(passwordFromUser: string, passwordFromDB: string, userSalt: string) {
        const hashedPassword = await bcrypt.hash(passwordFromUser, userSalt);
        return hashedPassword == passwordFromDB;
    }

    async getLocationByIP(ip: string) {
        if (ip === "::1") return { city: "" };
        return await geoIp.get(ip);
    }

    deleteFile(path: string) {
        try {
            fs.unlinkSync(path)
        } catch (error) {
            console.log(error)
        }
    }

    generateRandomPassword(length: number): string {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    /**
    *
    * @param {{name:string , email:string}} senderInfo
    * @param {[{name:string , email:string}]} receiverInfo
    * @param {string} subject
    * @param {string} htmlContent
    */
    async sendEmail(senderInfo: any, receiverInfo: any, subject: any, htmlContent: any) {
        try {
            if (!process.env.BREVO_API_KEY) {
                console.log("Can't execute send email functionality in local");
                return;
            }

            let defaultClient: any = Brevo?.ApiClient?.instance;
            let apiKey = defaultClient?.authentications["api-key"];
            apiKey.apiKey = process?.env?.BREVO_API_KEY;
            let apiInstance = new Brevo.TransactionalEmailsApi();
            let sendSmtpEmail = new Brevo.SendSmtpEmail();

            sendSmtpEmail = {
                sender: senderInfo,
                to: receiverInfo,
                subject: subject,
                htmlContent: htmlContent,
                headers: {
                    accept: "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json",
                },
            };
            const sent = await apiInstance.sendTransacEmail(sendSmtpEmail);
            return sent;
        } catch (error) {
            console.log(error);
            // throw new Error(error);
            return null;
        }
    }

    async emailHTMLTemplateGeneratorFunc(userDetails: any, mailType: string) {
        const {
            userEmailID,
            userName,
            brandName,
            password,
            redirectLink,
            ip,
            location,
            expiryPeriod
        } = userDetails;
        switch (mailType.trim()) {
            case "inviteUser":
                return renderHTMLFile(
                    path.join(__dirname, "/../HTMLTemplates/inviteUser.ejs"),
                    {
                        userName,
                        brandName,
                        userEmailID,
                        password,
                        redirectLink
                    }
                );

            case "changePassword":
                return renderHTMLFile(
                    path.join(__dirname, "/../HTMLTemplates/changePassword.ejs"),
                    { userName }
                );
            case "resetPassword":
                return renderHTMLFile(
                    path.join(__dirname, "/../HTMLTemplates/resetPassword.ejs"),
                    { userName, redirectLink, ip, location, expiryPeriod }
                );
            case "resetPasswordSuccessful":
                return renderHTMLFile(
                    path.join(__dirname, "/../HTMLTemplates/resetPasswordSuccessful.ejs"),
                    { userName, redirectLink, ip, location }
                );
            default:
                console.log("wrong html template was selected");
                return new Promise((resolve, reject) => {
                    resolve(`<html></html>`);
                });
        }
    }
    replaceS3LinkWithCloundFront(s3Url: string) {
        if (!s3Url || !process.env.CLOUNDFRONT_URL || !process.env.AWS_BUCKET || !process.env.AWS_REGION) return s3Url
        return s3Url.replace(`${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`, (process.env.CLOUNDFRONT_URL || ""))
    }
    orderByArray(items: Array<Array<string>>) {
        let base: string = 'CASE'
        for (let i = 0; i < items.length; i++) {
            if (items[i][1]) {
                // only if the value is present
                base += `
                WHEN ${items[i][0]} = '${items[i][1]}' 
                    then ${i + 1}
                `
            }
        }
        // CASE is a 4 letter word, anything after case means when clause was added
        if (base.length <= 4) return ''
        base += `END ASC`
        return base
    }
    getSignedInUser(req: any) {
        return req?.claims?.user?.userId || process.env.USER_MODIFIED_BY
    }
}

const aux = new Auxiliary()

export default aux;