var express = require('express');
const { emit, response } = require('../app');
var router = express.Router();
var productHelpers =require('../helpers/product-helpers')
const userHelpers =require('../helpers/user-helpers');
const { route } = require('./admin');
const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */

router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log('ddddddddddddddddddddddddddddddddddd');
  console.log(req.session.user);
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getProductAmount(req.session.user._id)
  }


  productHelpers.getAllProduct().then((product)=>{
    res.render('user/view-product',{product,user,cartCount})
  })
  
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{'loggin error:':req.session.logginErr})
    req.session.logginErr=false

  }
  
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
userHelpers.doSignUp(req.body).then((response)=>{
  console.log(req.body);
})
}) 
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user

      res.redirect('/')
    }else{
      req.session.logginErr='invalid userid or password'
      res.redirect('/login')
    }
  })
})     
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})   

  router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
    console.log('fff');
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      console.log("$$$$$$$$$$$$$$$$$");
      res.json({status:true})
    })
    
  })
  router.get('/carts',verifyLogin,async(req,res)=>{
       
   let products=await userHelpers.getCartProduct(req.session.user._id)
   let totalValue= await userHelpers.totalQuantity(req.session.user._id)
    res.render('user/carts',{products,user:req.session.user._id,totalValue})
  })  
  router.post('/change-product-quantity',(req,res,next)=>{
   console.log(req.body);
    
    userHelpers.changeQuantity(req.body).then(async(response)=>{
      response.total= await userHelpers.totalQuantity(req.session.user._id)
      res.json(response)
      
    })
  })
  router.get('/checkout',verifyLogin, async(req,res)=>{
    
    console.log(req.session.user);
    let total= await userHelpers.totalQuantity(req.session.user._id)
      
      res.render('user/place-order',{total,user:req.session.user})
    
  })
    router.post('/place-order',async(req,res)=>{
      let product=await userHelpers.getCartProductList(req.body.userId)
      let totalPrice=await userHelpers.totalQuantity(req.body.userId)
      userHelpers.placeOrder(req.body,product,totalPrice).then((orderId)=>{
        if(req.body['payment-method']=='COD'){
          res.json({status:true})
        }else{
          userHelpers.generateRazorpy(orderId,totalPrice).then((response)=>{
            res.json(response)
          })
        }
        
      })
      console.log(req.body)
    })
    router.get('/order-success',(req,res)=>{
      res.render('user/order-success',{user:req.session.user})
    })
    router.get('/order-list',verifyLogin,async(req,res)=>{
      let orderView=await userHelpers.orderView(req.session.user._id)
     
      res.render('user/order-list',{user:req.session.user,orderView})
    })
    router.get('/view-order/:id',async(req,res)=>{
      let orderItem=await userHelpers.orderItem(req.params.id)
      res.render('user/view-order',{user:req.session.user,orderItem})
    })
module.exports = router;
