import { NextFunction, Request, Response } from "express";

function refererPolicyCheck(req: Request, res: Response, next: NextFunction) {
    const referer = req.headers.referer || ""
    const brandDetails = (req as any)["brandDetails"]
    let refererPolicyFromSetting = brandDetails?.settingMetaJson?.ui_components?.loadingWebarParentWebsite || "*, *.mirrar.com, *.styledotme.com"
    refererPolicyFromSetting = refererPolicyFromSetting.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/gi, ".*")?.split?.(',');
    let notAllowed = true
    // console.log(referer, "refererPolicyFromSetting")
    for (let index = 0; index < refererPolicyFromSetting.length; index++) {
        const element = refererPolicyFromSetting[index]?.trim?.();
        let regex = new RegExp(`${element}`, 'gi')
        if (regex.test(referer) || referer?.includes(element)) {
            notAllowed = false
        }

    }
    if (notAllowed) {
        return res.status(403).send('Unauthorized!')
    }else{
        next()
    }
}
export {
    refererPolicyCheck
}