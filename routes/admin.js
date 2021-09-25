const { response } = require('express');
var express = require('express');
const { addProduct } = require('../helpers/product-helpers');
var router = express.Router();
var productHelpers =require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProduct().then((product)=>{
    res.render('admin/view-product',{product,admin:true})
  })
  
});
// router.get('/admin',(req,res)=>{
 
// })
router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  req.body.fileName=req.files.Image.name
  req.body.delete_flag="0"
  req.body.Price=parseInt(req.body.Price)
  productHelpers.addProduct(req.body,(result)=>{
    let image=req.files.Image
    fileName=image.name
    console.log(fileName);
   
    image.mv('./public/images/' + fileName,(err,done)=>{
      if(!err){
        res.render('admin/add-product')
      }else{
        console.log("image nottttt");
      }
    })
    
  })
})
router.get('/delete/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id',async(req,res)=>{

 let product=await productHelpers.findProduct(req.params.id)
 
    console.log(product);
    res.render('admin/edit-product',{product})
 
})
router.post('/edit-product/:id',(req,res)=>{
  req.body.Price=parseInt(req.body.Price)
  console.log(req.body);
  if(req.files === null ){
//  let product=await productHelpers.findProduct(req.params.id)

    req.body.fileName=req.body.ImageName
  }
  else{
     req.body.fileName=req.files.Image.name
    
       
      let image=req.files.Image
      fileName=image.name
    
     image.mv('./public/images/' + fileName)
    
  }
 
  productHelpers.editProduct(req.params.id,req.body).then(()=>{
     
     
    
     res.redirect('/admin')
  })
 
})
module.exports = router;  
