const collection = require('../config/collection')
var db=require('../config/connection')
const bcrypt=require('bcrypt')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_51AA70HwTpnvfK',
    key_secret: 'LlcoCGuNdZ4xr3bIV1OWOm2a',
  });
module.exports={

    doSignUp:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.psw=await bcrypt.hash(userData.psw,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
                

           
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
             
            
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
           
            if(user){
                bcrypt.compare(userData.psw,user.psw).then((status)=>{
                    if(status){
                        console.log("success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("fail");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("2 fail");
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let proObj={
                item:[objectId(proId)],
                quantity:1
            }
            
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
               if(userCart){
                   let proExist=userCart.products.findIndex(product=> product.item==proId)
                   console.log('0000000');
                   console.log(proExist);
                   if(proExist!=-1){
                       db.get().collection(collection.CART_COLLECTION)
                           .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                           {
                               $inc:{'products.$.quantity':1}
                           }
                       ).then(()=>{
                           resolve()
                       })
                   }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                
                ).then((response)=>{
                    resolve()
                })
            }
               }else{
                  let cartObj={
                      user:objectId(userId),
                      products:[proObj]
               
                  } 
                  db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                      resolve()
                  })
               }
           
        })
    },
    getCartProduct:(userId)=>{
        return new Promise(async(resolve,reject)=>{
      let cartItems =await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                } 
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })
    },
    getProductAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if (cart){
                count=cart.products.length
            }
            resolve(count)
        })  
    },
    changeQuantity:(data)=>{
       quantity=Number(data.quantity)
        count=parseInt( data.count)
        return new Promise(async(resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(data.cart)},
                {
                    $pull:{products:{item:objectId(data.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{

                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(data.cart),'products.item':objectId(data.product)},
                {
                    $inc:{'products.$.quantity':count}
                }
            ).then((response)=>{
                resolve({status:true})
                 }) 
            }

        })
    },
    totalQuantity:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total =await db.get().collection(collection.CART_COLLECTION).aggregate([
                      {
                          $match:{user:objectId(userId)}
                      },
                      {
                          $unwind:'$products'
                      },
                      {
                          $project:{
                              item:'$products.item',
                              quantity:'$products.quantity'
                          }
                      },
                      {
                          $lookup:{
                              from:collection.PRODUCT_COLLECTION,
                              localField:'item',
                              foreignField:'_id',
                              as:'product'
      
                          }
                      },
                      {
                          $project:{
                              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                          }
                      },
                    {
                        $group:{
                            _id:null,   
                            total:{$sum:{$multiply:['$quantity','$product.Price']}}
                        }
                    },
                    // {
                    //     $group:{
                    //         _id:null,
                    //         total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    //     }
                    // }

                  ]).toArray()
                 
                  resolve(total[0].total)
              })
    },
    placeOrder:(order,product,total)=>{
        return new Promise((resolve,reject)=>{

            console.log(order,product,total);
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    name:order.Name,
                    email:order.Email,
                    number:order.Number,
                    pincode:order.Pincode,
                    totalAmount:total
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                product:product,
                status:status,
                date:new Date
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                console.log(response["ops"][0]["_id"]);
                resolve(response)

            })
        })

    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })

    },
    orderView:(userId)=>{
      
        return new Promise(async(resolve,reject)=>{
            let cartView=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            // console.log(cartView);
            resolve(cartView)
        })
    },
    orderItem:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
        console.log('***************************************');
            let item=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                } 
            ]).toArray()
            console.log("&&&&&&&&&&&&&&&&&&&&77");
            console.log(item);
            resolve(item)
        })
    },
    generateRazorpy:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total,  // amount in the smallest currency unit
                currency: "INR",
                receipt:""+objectId(orderId)
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log(err);
                  }else{
                       console.log('new order',order);

                resolve(order)  
                  }
             
              });
        })
    }

}