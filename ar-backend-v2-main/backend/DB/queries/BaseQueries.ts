import aux from '../../Utility/auxiliary'
import { CountOptions, FindOptions, Model, ModelStatic, Op, Order, Sequelize, WhereOptions } from 'sequelize'

class BaseQueryModel {
    constructor() { }

    async createData(tableName:any, data:any) {
        try {
            const result = await tableName.create({ ...data })
            return result
        } catch (error) {
            throw error
        }
    }

    async bulkCreateData(tableName:any, data:any) {
        try {
            const result = await tableName.bulkCreate(data)
            return result
        } catch (error) {
            throw error
        }
    }

    async getSingleDataByCondition(tableName:any, condition:any, excludeColumns:any[] = []) {
        try {
            const result = await tableName.findOne({
                where: { ...condition },
                returning: true,
                attributes: {
                    exclude: excludeColumns
                }
            })
            return result
        } catch (error) {
            throw error
        }
    }

    async findOrCreate(tableName:any, condition:any, newData:any) {
        try {
            const result = await tableName.findOrCreate({
                where: condition,
                defaults: newData
            })
            return result
        } catch (error) {
            throw error
        }
    }

    async update(tableName:ModelStatic<any>, condition:any, updateData:any, options:any={}) {
        try {
            const result = await tableName.update(updateData, {
                where: condition,
                returning: true,
                ...options
            })
            return result
        } catch (error) {
            throw error
        }
    }

    async getDetailsWInclude(tableName1:any, tableName2:any, condition1:any, condition2:any, excludeCol1:string[] = [], excludeCol2:string[] = []) {
        try {
            const result = await tableName1.findAll({
                where: condition1,
                returning: true,
                attributes: {
                    exclude: excludeCol1
                },
                include: [
                    {
                        model: tableName2,
                        where: condition2,
                        returning: true,
                        attributes: {
                            exclude: excludeCol2
                        },
                    }
                ]
            })
            return result
        } catch (error) {
            throw error
        }
    }

    async upsert(tableName:any, replacementData:any, updateOnDupCols:string[] = [], conflictAttribCols:string[] = []) {
        try {
            return await tableName.bulkCreate(replacementData, {
                updateOnDuplicate: updateOnDupCols,
                returning: true,
                conflictAttributes: conflictAttribCols,
            });
        } catch (error) {
            throw error;
        }
    }

    async getAllDataByCondition(tableName:any, condition:any, excludeColumns:string[] = []) {
        try {
            const result = await tableName.findAll({
                where: { ...condition },
                returning: true,
                raw: true,
                attributes: {
                    exclude: excludeColumns
                }
            })
            return result
        } catch (error) {
            throw error
        }
    }

    columnNamesExcept(columnName:any[],except:any[]){
        return columnName.filter(ele=> !except.includes(ele))
    }

    async deleteData(tableName: any, whereClause: WhereOptions, options:any={}){
        try {
            const result = await tableName.destroy({
                where: whereClause,
                ...options
            })
            return result
        } catch (error) {
            throw error
        }
    }
    async getDetailsWMultipleInclude(tableName:any, includeModels:any[], condition:any, excludeColumns:string[]=[]){
        try{
            const result=await tableName.findAll({
                where: condition,
                attributes:{
                    exclude:excludeColumns
                },
                include:includeModels
            });
            return result;
        }catch(error){
            throw error
        }
    }
    
}

export default BaseQueryModel;