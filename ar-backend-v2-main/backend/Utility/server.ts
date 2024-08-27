import express, { Request, Response } from 'express';
import cors from 'cors';
import { queryParser } from 'express-query-parser';
import brandRouter from '../Routes/brandRoutes';
import brandSettingRouter from '../Routes/brandSettingRoutes';
import categoryRouter from '../Routes/categoryRoutes';
import userRouter from '../Routes/userRoute';
import productRouter from '../Routes/productRoutes';
import uploadRouter from '../Routes/uploadRoutes';
import webhookRouter from '../Routes/webhookRoutes';
import morgan from 'morgan';
import compression from 'compression';

function createServer() {
    const app = express()
    app.use(compression())
    app.use(morgan('dev'))
    app.use(cors())
    app.use(express.json({
        limit: "1000mb"
    }));
    app.use(express.urlencoded({ extended: false }));
    app.use(
        queryParser({
            parseNull: true,
            parseUndefined: true,
            parseBoolean: true,
            parseNumber: true
        })
    )

    app.use('/brand', brandRouter)
    app.use('/brandSetting', brandSettingRouter)
    app.use('/category', categoryRouter)
    app.use('/user', userRouter)
    app.use('/product', productRouter)
    app.use('/upload', uploadRouter)
    app.use('/webhook', webhookRouter)
    app.get('/ping', (req: Request, res: Response) => {
        res.status(200).send('Up')
    })
    return app
}

export default createServer;