const collection = require('../config/collection')
var db=require('../config/connection')
var objectId=require('mongodb').ObjectId
module.exports={

    addProduct:(product,callback)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product)
        .then((data)=>{
            console.log(product);
           
            callback(data)
        })
    },
    getAllProduct:()=>{
        return new Promise(async(resolve,reject)=>{
          let product=await db.get().collection(collection.PRODUCT_COLLECTION).find({delete_flag:"0"}).toArray()
            resolve(product)
        })
        
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    findProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
                // console.log('))))))))))))))))))');
                // console.log(response);
            })
        })
    },
    editProduct:(proId,proData)=>{
      console.log('((((((((((((((99');
     
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
                {
                  $set:{
                       Name:proData.Name,
                       Catagory:proData.Catagory,
                       Description:proData.Description,
                       Price:proData.Price,
                        fileName:proData.fileName
                       } 
                }
            ).then((response)=>{
                
                console.log(response);
                resolve()
            })
        })
    }

}