import BaseQueries from './BaseQueries';
import sequelize from '../config'
import { QueryTypes, BindOrReplacements } from 'sequelize';
import Sequelize from "sequelize";
import  userTokenModel from '../../Model/userTokenModel';
require('../association')

class UserQueries extends BaseQueries {
    constructor() {
        super()
    }
}

const queries = new UserQueries();
export default queries;