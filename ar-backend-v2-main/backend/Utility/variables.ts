const BODY = 'BODY';
const PARAMS = 'PARAMS';
const QUERY = 'QUERY';
const ALL = `ALL`;
const BRAND_ROUTE = '/brand/:brandId';
const SUB_BRAND_ROUTE = '/brand/:brandId/subBrand/:subBrandId';
const POST_METHOD = 'post';
const GET_METHOD = 'get';
const PUT_METHOD = 'put';
const DELETE_METHOD = 'delete';
const PAGINATION = `/page/:pageNo/limit/:limit`;
const SEARCH_TERM = `/term/:term`;
const BODY_PARAMS = 'BODY-PARAMS';
const PARAMS_QUERY = 'PARAMS-QUERY';
const CATEGORY_ROUTE = '/category/:category';


export {
    SEARCH_TERM,
    PAGINATION,
    BODY, PARAMS, QUERY, BRAND_ROUTE, SUB_BRAND_ROUTE, POST_METHOD, GET_METHOD, PUT_METHOD, DELETE_METHOD, ALL, BODY_PARAMS, PARAMS_QUERY,
    CATEGORY_ROUTE
};