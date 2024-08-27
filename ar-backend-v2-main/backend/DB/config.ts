import dotenv, { config } from "dotenv";
import { Sequelize, Options } from "sequelize"
type dialectOption = {
    useUTC: boolean,
    ssl?: {
        require: boolean,
        rejectUnauthorized: boolean
    }
}
config()
// const sequelize = new Sequelize(
//     "mydatabase" || process.env.DB_DATABASE_NAME,
//     "myuser" || process.env.DB_USERNAME,
//     "mypassword" || process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST || "localhost",
//     dialect: process.env.DB_USERNAME,
//     logging: false,
//     pool: {
//         max: +process.env.DB_POOL_MAX || 5,
//         min: +process.env.DB_POOL_MIN || 0,
//         acquire: +process.env.DB_POOL_ACQUIRE || 30000,
//         idle: +process.env.DB_POOL_IDLE || 10000
//     }
// });

let dialectOption: dialectOption = {
    useUTC: false,
}
let extraOptions: Options = {
    // host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "postgres",
    logging: process.env.SEQUELIZE_LOGGING === 'true' ? true : false,
    // logging: true,
    // timezone: '+05:30', // for writing to database
    dialectOptions: dialectOption,
    pool: {
        max: +(process.env.DB_POOL_MAX || 5),
        min: +(process.env.DB_POOL_MIN || 0),
        acquire: +(process.env.DB_POOL_ACQUIRE || 30000),
        idle: +(process.env.DB_POOL_IDLE || 10000)
    },
    replication: {
        read: [
            {
                host: process.env.DB_HOST_READ_HOST || "localhost",
                username: process.env.DB_USERNAME || "localhost",
                password: process.env.DB_PASSWORD,
            }
        ],
        write: {
            host: process.env.DB_HOST || "localhost",
            username: process.env.DB_USERNAME || "localhost",
            password: process.env.DB_PASSWORD,
        }
    }
}
if (!(process.env.DB_HOST?.includes('localhost'))) {
    dialectOption.ssl = {
        require: true,
        rejectUnauthorized: false
    }
}
const sequelize = new Sequelize(
    (process.env.DB_DATABASE_NAME || ""), "", "",
    // (process.env.DB_DATABASE_NAME || ""),
    // (process.env.DB_USERNAME || ""),
    // (process.env.DB_PASSWORD || ""),
    extraOptions
);


export default sequelize