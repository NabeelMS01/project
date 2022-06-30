const express = require("express");
const req = require("express/lib/request");
const { response } = require("../app");
const adminHelper = require("../helpers/adminHelper");

const router = express.Router();
const controller = require("../controller/controller");
const upload = require("../middlewere/multer");
const async = require("hbs/lib/async");
const { Db, Admin } = require("mongodb");
const userHelper = require("../helpers/userHelper");

let admin = {
  email: "admin@gmail.com",
  password: "12345",
};
const varifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// -----------------Getting admin home page------------------

router.get("/", async (req, res) => {
  if (!req.session.admin) {
    res.redirect("/admin/login");
  } else {

    
    let orderByday = await adminHelper.getSalesDay();
    let totalRevenue = await adminHelper.getTotalRevenue();
    let totalOrders = await adminHelper.getAllOrders();


    let cardSale = await adminHelper.getCardSale();
    let paypal = await adminHelper.getPaypalSale();
    let codSale = await adminHelper.getCodSale();
    totalOrders = totalOrders.length;
    //  console.log(cardSale );

    res.render("admin/pages/home-admin", {
      admin: true,
      totalRevenue,
      totalOrders,
      orderByday,
      cardSale,
      paypal,
      codSale,
    });
  }



  
  // res.render('admin/login',{admin:true})
});

router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin");
  }

  res.render("admin/pages/authentication/login", {
    admin: true,
    adminlgnErr: req.flash("message"),
  });

  req.flash("message", null);
});

router.get("/logout", (req, res) => {
  req.session.destroy().then(res.redirect("/admin"));
});

router.post("/login", (req, res) => {
  if (req.body.email != admin.email) {
    req.flash("message", "invalid email");

    res.redirect("/admin/login");
  } else if (req.body.password != admin.password) {
    req.flash("message", "invalid email");

    res.redirect("/admin/login");
  } else if (
    req.body.email != admin.email &&
    req.body.password != admin.password
  ) {
    req.flash("message", "invalid email and password");

    res.redirect("/admin/login");
  } else {
    req.session.admin = true;
    res.redirect("/admin");
  }
});

// ----------------Order Management----------------

router.get("/all-orders", varifyLogin, async (req, res) => {
  let orders = await adminHelper.getAllOrders();

  console.log(orders);
  res.render("admin/pages/orderManagement/orders-admin", {
    admin: true,
    orders,
  });
});

router.get("/order-details/:id", varifyLogin, async (req, res) => {
  let order = await adminHelper.getOrderDetails(req.params.id);

  console.log(order);
  res.render("admin/pages/orderManagement/order-details", {
    admin: true,
    order,
  });
});

// ----------------User Management----------------

router.get("/all-users", varifyLogin, (req, res) => {
  adminHelper.getAllUser().then((users) => {
    res.render("admin/pages/userManagement/all-users", {
      admin: true,
      users,
      toast: req.flash("message"),
    });
  });
});

router.get("/block-user/:id",varifyLogin, (req, res) => {
  userId = req.params.id;
  adminHelper.blockUser(userId).then((response) => {
    res.json({ status: true });
  });
});

router.get("/unblock-user/:id", (req, res) => {
  userId = req.params.id;

  adminHelper.unBlockUser(userId).then((response) => {
    res.json({ status: true });
  });
});

// ----------------Product Management----------------

// ----------------All product----------------
router.get("/all-products", varifyLogin, (req, res) => {
  adminHelper.getAllProduct().then((products) => {
    res.render("admin/pages/productManagement/all-products", {
      admin: true,
      products,

      submit: req.session.submit,
    });
    req.session.submit = false;
    req.flash("message", null);
  });
});

// ----------------Add product----------------
router.get("/add-product", varifyLogin, async (req, res) => {
  let category = await adminHelper.getAllCategory();
  let subcategory = await adminHelper.getAllSubcategory();

  res.render("admin/pages/productManagement/add-product", {
    admin: true,
    submit: req.session.submit,
    category,
    subcategory,
  });

  req.session.submit = false;
});

router.post("/add-product", upload.array("multiImages"), (req, res, next) => {
  console.log("ivide***********************");
  console.log(req.file);
  console.log(req.body);
  let arr = [];

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    arr.push(req.files[index].filename);
  });

  adminHelper.addProduct(req.body, arr).then((data) => {
    req.session.submit = true;
    res.redirect("/admin/add-product");
  });
});

// ----------------view - product ----------------

router.get("/view-product/:id", varifyLogin, (req, res) => {
  var id = req.params.id;

  adminHelper.getProductDetails(id).then((product) => {
    res.render("admin/pages/productManagement/view-product.hbs", {
      admin: true,
      toast: req.flash("message"),
      product,
    });
  });
});

// ----------------edit - product ----------------

router.get("/edit-product/:id",varifyLogin, async (req, res) => {
  //   var id= req.params.id

  //   adminHelper.editProduct(id).then(

  let category = await adminHelper.getAllCategory();
  let subcategory = await adminHelper.getAllSubcategory();
  //   )
  var id = req.params.id;

  adminHelper.getProductDetails(id).then((product) => {
    console.log(product.name);

    res.render("admin/pages/productManagement/edit-product.hbs", {
      admin: true,
      product,
      category,
      subcategory,
    });

    req.session.submit = false;
  });
});

router.post("/edit-product/:id", upload.array("multiImages"), (req, res) => {
  var id = req.params.id;

  console.log("ivide***********************");
  console.log(req.files);
  console.log(req.body);
  let arr = [];

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    arr.push(req.files[index].filename);
  });

  adminHelper
    .updateProduct(id, req.body, arr)
    .then(
      (req.session.submit = "your edit is succesfull"),
      res.redirect("/admin/all-products")
    );
});

router.get("/delete-product/:id",varifyLogin, (req, res) => {
  id = req.params.id;
  adminHelper.deleteProduct(id).then((response) => {
    res.json({ status: true });
  });
});
//-------------------deactivate/activate product---------------

router.get("/deactivate-product/:id",varifyLogin, (req, res) => {
  id = req.params.id;
  adminHelper.deactivateProduct(id).then((response) => {
    res.redirect("/admin/all-products");
  });
});
router.get("/activate-product/:id", (req, res) => {
  id = req.params.id;
  adminHelper.activateProduct(id).then((response) => {
    res.redirect("/admin/all-products");
  });
});

// ----------------Category Management----------------

router.get("/view-category",varifyLogin, (req, res) => {
  adminHelper.getAllCategory().then(async (categories) => {
    let subCategory = await adminHelper.getAllSubcategory();
    console.log(subCategory);
    console.log("//////////////////88888888888888");
    res.render("admin/pages/categoryManagement/view-category", {
      admin: true,
      categories,
      subCategory,
    });
  });
});
//---------------add-category------------------------

router.get("/add-category",varifyLogin, async (req, res) => {
  let category = await adminHelper.getAllCategory();

  res.render("admin/pages/categoryManagement/add-category", {
    admin: true,
    category,
  });
});

router.post("/add-category", (req, res) => {
  adminHelper.addCategory(req.body).then((data) => {
    res.redirect("/admin/add-category");
  });
});

router.post("/add-subcategory", (req, res) => {
  adminHelper.addSubCategory(req.body).then((data) => {
    res.redirect("/admin/add-category");
  });
});

//---------------edit-category------------------------
router.get("/edit-subCategory/:id",varifyLogin, async (req, res) => {
  console.log("******************");
  console.log(req.params.id);
  console.log("******************");

  let subCategory = await adminHelper.getSubCategory(req.params.id);

  res.render("admin/pages/categoryManagement/edit-subCategory", {
    admin: true,
    subCategory,
  });
});

router.post("/edit-subCategory/:id", async (req, res) => {
  console.log("******************");
  console.log(req.params.id);
  console.log("******************");

  await adminHelper.editSubCategory(req.params.id).then();

  res.render("admin/pages/categoryManagement/edit-subCategory", {
    admin: true,
    subCategory,
  });
});

router.get("/edit-category/:id",varifyLogin, (req, res) => {
  adminHelper.getCategory(req.params.id).then((category) => {
    res.render("admin/pages/categoryManagement/edit-category", {
      admin: true,
      category,
    });
  });
});

router.post("/edit-category/:id", (req, res) => {
  var id = req.params.id;
  console.log("******************");
  console.log(req.body);
  adminHelper.editCategory(id, req.body).then((response) => {
    res.redirect("/admin/view-category");
  });
});

router.get("/delete-category/:id",varifyLogin, (req, res) => {
  var id = req.params.id;
  console.log("******************");
  console.log(req.body);
  adminHelper.deleteCategory(id).then((response) => {
    res.redirect("/admin/view-category");
  });
});

router.get("/offer-management",varifyLogin, (req, res) => {
  res.render("admin/pages/offerManagement/manageOffer", { admin: true });
});

router.get("/product-offer",varifyLogin, async (req, res) => {
  let products = await adminHelper.getAllProduct();

  res.render("admin/pages/offerManagement/productOffer", {
    admin: true,
    products,
  });
});

router.get("/add-product-offer/:id",varifyLogin, async (req, res) => {
  let product = await adminHelper.getProductDetails(req.params.id);

  res.render("admin/pages/offerManagement/add-product-offer", {
    admin: true,
    product,
  });
});

router.post("/add-product-offer/:id",varifyLogin, async (req, res) => {
  let product = await userHelper.getProductDetails(req.params.id);
  await adminHelper
    .addProductOffer(req.params.id, req.body, product)
    .then((response) => {
      console.log(response);
      res.json({ offerStatus: true });
    });
});
router.get("/remove-product-offer/:id",varifyLogin, async (req, res) => {
  await adminHelper.removeProductOffer(req.params.id).then((resolve) => {
    res.redirect("/admin/product-offer");
  });
});

router.get("/category-offer",varifyLogin, async (req, res) => {
  let category = await adminHelper.getAllCategory();

  res.render("admin/pages/offerManagement/categoryOffer", {
    admin: true,
    category,
  });
});

router.get("/add-category-offer/:id",varifyLogin, async (req, res) => {
  let category = await adminHelper.getCategory(req.params.id);

  res.render("admin/pages/offerManagement/add-category-offer", {
    admin: true,
    category,
  });
});

//---------------updations needed
router.post("/add-category-offer/:id", async (req, res) => {
  let category = await adminHelper.getCategory(req.params.id);

  await adminHelper
    .addCategoryOffer(req.params.id, req.body, category)
    .then(async (data) => {
      res.json({ offerStatus: true });

      //
    });
});

router.get("/remove-category-offer/:id",varifyLogin, async (req, res) => {
  console.log(req.params.id);
  await adminHelper.removeCategoryOffer(req.params.id).then((resolve) => {
    res.redirect("/admin/category-offer");
    console.log(req.params.id);
  });
});
//-------------coupon management--------------

router.get("/view-coupon",varifyLogin, async (req, res) => {
  let coupons = await adminHelper.getAllCoupons();

  res.render("admin/pages/offerManagement/viewCoupon", {
    admin: true,
    coupons,
  });
});

router.post("/add-coupon",varifyLogin, (req, res) => {
  console.log(req.body);
  adminHelper.addCouponCode(req.body).then((response) => {
    console.log("here");
    res.json({ status: true });
  });
});
router.get("/remove-code/:id",varifyLogin, (req, res) => {
  console.log(req.body);

  adminHelper.removeCouponCode(req.params.id).then((response) => {
    res.json({ status: true });
  });
});

//-----------------sales report--------------

router.get("/sales-report",varifyLogin, async (req, res) => {    
  let orders = await adminHelper.getAllOrders();
  console.log(orders);
let totalAmount=await adminHelper.getTotalRevenue()

  res.render("admin/pages/sales-report", { admin: true, orders,totalAmount });
});
router.post("/sales-report", async(req, res) => {  
  console.log(req.body);  
  let orders = await adminHelper.getAllOrdersByDate(req.body.from_date,req.body.end_date);

let totalAmount=await adminHelper.getTotalRevenueByDate(req.body.from_date,req.body.end_date)
 console.log(orders);
  res.render("admin/pages/sales-report", { admin: true, orders,totalAmount,startDate:req.body.from_date,endDate:req.body.end_date });
});

//------------------------banner management-------------------

router.get("/add-banners",varifyLogin, async (req, res) => {
  let subCategory = await adminHelper.getAllSubcategory();

  res.render("admin/pages/bannerManagement/addBanner", {
    admin: true,
    subCategory,
    bannerSuccess: req.session.bannerSuccess,
  });

  bannerSuccess = null;
});

router.post("/add-banners", upload.array("bannerimage"), async (req, res) => {
  console.log(req.files);
  console.log(req.body);
  let arr = [];

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    arr.push(req.files[index].filename);
  });

  await adminHelper.addBanner(req.body, arr).then((response) => {
    req.session.bannerSuccess = "banner added";
    res.redirect("/admin/add-banners");
  });
});

router.get("/view-banners/",varifyLogin, async (req, res) => {
  let banners = await userHelper.getAllBanners();

  res.render("admin/pages/bannerManagement/viewBanner", {
    admin: true,
    banners,
    bannerSuccess: req.session.bannerSuccess,
  });

  req.session.bannerSuccess = null;
});

router.get("/delete-banner/:id",varifyLogin, async (req, res) => {
  await adminHelper.deleteBanner(req.params.id).then((response) => {
    res.json({ status: true });
  });
});
router.get("/edit-banner/:id",varifyLogin, async (req, res) => {
  let subCategory = await adminHelper.getAllSubcategory();
  let banner = await adminHelper.getBannerDetails(req.params.id);
  console.log(banner);

  res.render("admin/pages/bannerManagement/editBanner", {
    admin: true,
    banner: banner,
    bannerId: req.params.id,
    subCategory,
  });
});

router.post(
  "/edit-banner/:id",
  upload.array("bannerimage"),
  async (req, res) => {
    console.log(req.files);
    console.log(req.body);
    let arr = [];

    req.files.forEach(function (files, index, ar) {
      console.log(req.files[index].filename);

      arr.push(req.files[index].filename);
    });

    await adminHelper
      .editBanner(req.params.id, req.body, arr)
      .then((response) => {
        req.session.bannerSuccess = "banner added";
        res.redirect("/admin/view-banners");
      });
  }
);

router.get("/deactivate-banner/:id",varifyLogin, async (req, res) => {
  await adminHelper.deactivateBanner(req.params.id).then((response) => {
    res.json({ status: true });
  });
});
router.get("/activate-banner/:id",varifyLogin, async (req, res) => {
  await adminHelper.activateBanner(req.params.id).then((response) => {
    res.json({ status: true });
  });
});

//--------------------collection card management --------------------


router.get("/add-collectionCard",varifyLogin, async (req, res) => {
  let subCategory = await adminHelper.getAllSubcategory();

  res.render("admin/pages/collectionCardManagement/addCollectionCard", {
    admin: true,
    bannerSuccess: req.session.bannerSuccess,
    subCategory,
  });
  req.session.bannerSuccess=null


});

router.post(
  "/add-collectionCard",
  upload.array("cardimage"),
  async (req, res) => {
    console.log(req.files);
    console.log(req.body);
    let arr = [];

    req.files.forEach(function (files, index, ar) {
      console.log(req.files[index].filename);

      arr.push(req.files[index].filename);
    });

    await adminHelper.addCardCollection(req.body, arr).then((response) => {
      req.session.bannerSuccess = "Collection Card added";
      res.redirect("/admin/add-collectionCard");
    });
  }
);

router.get('/view-collectionCard',varifyLogin,async(req,res)=>{
  let cardCollection =await adminHelper.getCollectionCards()

res.render('admin/pages/collectionCardManagement/viewCollectionCard',{admin:true,cardCollection,bannerSuccess:req.session.bannerSuccess})

})



router.get("/deactivate-collectionCard/:id",varifyLogin, async (req, res) => {
  await adminHelper.deactivatecollectionCard(req.params.id).then((response) => {
    res.json({ status: true });
  });
});
router.get("/activate-collectionCard/:id",varifyLogin, async (req, res) => {
  await adminHelper.activatecollectionCard(req.params.id).then((response) => {
    res.json({ status: true });
  });
});


router.get('/edit-collectionCard/:id',varifyLogin,async(req,res)=>{

  let cardCollection= await adminHelper.getCollectionCardDetails(req.params.id)

  res.render('admin/pages/collectionCardManagement/editCollectionCard',{admin:true,cardCollection})


})


router.post("/edit-collectionCard/:id",  upload.array("cardimage"),async(req,res)=>{
  
  console.log(req.files);
  console.log(req.body);
  let arr = [];

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    arr.push(req.files[index].filename);
  });

  await adminHelper.editCollectionCard(req.params.id, req.body, arr)
    .then((response) => {
      req.session.bannerSuccess = "card added";
      res.redirect("/admin/view-collectionCard");
    });
})


router.get("/delete-collectionCard/:id",varifyLogin, async (req, res) => {
   await adminHelper.deleteCollectionCard(req.params.id).then((response) => {
    res.json({ status: true });


    
  });
});





router.get("*",(req,res)=>{
  res.render('admin/pages/404',{admin:true})
  
  });

module.exports = router;
