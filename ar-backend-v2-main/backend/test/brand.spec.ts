// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const expect = chai.expect;
// const server = require('../app');
// const aux = require('../Utility/auxiliary');
// const { describe } = require('mocha');
// const { faker } = require('@faker-js/faker');

// chai.use(chaiHttp);

// const essentialKeys = ['status', 'message', 'data', 'meta', 'filter']

// describe('Brand Suite', () => {
//     let brandId
//     let userAccessToken
    
//     let secondBrandName
//     let secondBrandUserAccessToken
//     let secondBrandId
//     let secondBrandEmail
//     let thirdBrandUserAccessToken
//     let fourthBrandUserAccessToken
//     let thirdBrandId
//     let fourthBrandId
    
//     const secondBrandPassword = faker.internet.password()
//     const testBrand = 'MOCHA '+faker.person.fullName()
//     const testContactEmail = 'MOCHA'+faker.internet.email()
//     const password = faker.internet.password()
//     const thirdBrand = 'MOCHA '+ faker.person.fullName()
//     const thirdTestContactEmail = 'MOCHA'+faker.internet.email()
//     const thirdPassword = faker.internet.password()
//     const fourthBrand = 'MOCHA '+ faker.person.fullName()
//     const fourthTestContactEmail = 'MOCHA'+faker.internet.email()
//     const fourthPassword = faker.internet.password()

//     describe('Create Brand - /brand/beauty/create', () => {
//         it('Should create new brand', async () => {
//             const payload = {
//                 "brandAliasName": testBrand,
//                 "brandContactEmail": testContactEmail,
//                 "brandUsername": "MOCHA productTeam",
//                 "brandUserPassword": password,
//                 "brandBucketName": "MOCHA",
//                 "brandMaxProducts": 10000,
//                 "brandType": "jewelry",
//                 // "brandTermsConditionLink": true,
//                 "brandMetaJson": "{}",
//                 // "brandIsSubBrand": false,
//                 // "brandSubBrandName": "aa",
//                 // "parentBrandId": "fe29229c-310b-411e-98bb-a94d1bdb4b65"
//             }
//             const res = await chai.request(server).post(`/brand/create`).send(payload)
//             const body = res?.body
//             expect(body.status).to.equal(201)
//             expect(body.message).to.equal('Brand and User inserted successfully  , .')
//             expect(body).to.have.keys(essentialKeys)
//         })

//         it('Should create brand, but user already exists', async () => {
//             secondBrandName = 'MOCHA '+ faker.person.lastName()
//             secondBrandEmail = 'MOCHA'+ faker.internet.email()

//             const payload = {
//                 "brandAliasName": secondBrandName,
//                 "brandContactEmail": secondBrandEmail,
//                 "brandUsername": "MOCHA productTeam",
//                 "brandUserPassword": secondBrandPassword,
//                 "brandBucketName": "MOCHA",
//                 "brandMaxProducts": 10000,
//                 "brandType": "jewelry",
//                 "brandMetaJson": "{}",
//             }
//             const res = await chai.request(server).post(`/brand/create`).send(payload)
//             const body = res?.body

//             expect(body.status).to.equal(201)
//             expect(body.message).to.equal("Brand and User inserted successfully  , .")
//             expect(body).to.have.keys(essentialKeys)

//         })

//         it('Should create brand which already exists', async () => {
//             const payload = {
//                 "brandAliasName": testBrand,
//                 "brandContactEmail": testContactEmail,
//                 "brandUsername": "MOCHA productTeam",
//                 "brandUserPassword": password,
//                 "brandBucketName": "MOCHA",
//                 "brandMaxProducts": 10000,
//                 "brandType": "jewelry",
//                 // "brandTermsConditionLink": true,
//                 "brandMetaJson": "{}",
//                 // "brandIsSubBrand": false,
//                 // "brandSubBrandName": "aa",
//                 // "parentBrandId": "fe29229c-310b-411e-98bb-a94d1bdb4b65"
//             }
//             const res = await chai.request(server).post(`/brand/create`).send(payload)
//             const body = res?.body
//             const data = body?.data
//             brandId = data?.brandId
//             brandName = data?.brandAliasName

//             expect(body.status).to.equal(200)
//             expect(body.message).to.equal("Brand already exists")
//             expect(data.brandAliasName).to.equal(payload.brandAliasName)
//             expect(data.brandActiveStatus).to.equal(true)
//             expect(data.brandContactEmail).to.equal(payload.brandContactEmail)
//             expect(data.brandMaxProducts).to.equal(payload.brandMaxProducts)
//         })
//     })
// })