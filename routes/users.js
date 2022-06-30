const { response } = require("express");
const express = require("express");
const userHelper = require("../helpers/userHelper");
const router = express.Router();
const config = require("../config/otp");
const adminHelper = require("../helpers/adminHelper");
const async = require("hbs/lib/async");
const { route } = require("../app");
const upload = require("../middlewere/multer");
const client = require("twilio")(config.accountSID, config.authToken);

let rn = require("random-number");
const { Db } = require("mongodb");
let options = {
  min: 10000000,
  max: 99999999,
  integer: true,
};

// const instance = new Razorpay({
//   key_id: 'rzp_test_dvEiQE98PIBRAI',
//   key_secret: 'RatXLbroi7okrk5DQHDQvwIh',
// });

const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    req.session.cartCount = cartCount;

    next();
  } else {
    res.redirect("/login");
  }
};
const loggedInCheck = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/");
  }
  next();
};

// -----------------Otp Verification------------------

/* GET users listing. */

router.get("/", async function (req, res, next) {
  let cartCount = 0;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    req.session.cartCount = cartCount;
    req.session.userData = await userHelper.getUserData(req.session.user._id);
  }
  try {
    await userHelper.validateOffer();
    adminHelper.getAllProduct().then((products) => {
      adminHelper.getAllCategory().then(async (category) => {
        let banners = await adminHelper.getAllBanners();
        let CollectionCard = await adminHelper.getCollectionCards();
        req.session.category = category;

        res.render("user/index", {
          userUi: true,
          logedIn: req.session.loggedIn,
          products,
          category: req.session.category,
          cartCount: req.session.cartCount,
          banners,
          CollectionCard,
        });
      });
    });
  } catch (err) {
    res.redirect("/notfound");
  }
});

//login user

router.get("/login", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  }

  res.render("user/auth/login", { loginErr: req.flash.loginErr });
  req.flash.loginErr = null;
});

router.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    userHelper.doLogin(req.body).then((response) => {
      req.session.user = response.user;

      if (response.status) {
        userHelper.loginCheck(req.body).then(async (response) => {
          if (response.userstatus) {
            req.session.loggedIn = true;
            let user = await userHelper.getPhone(req.body.email);
            console.log("*********************");
            console.log(user.phone);
            console.log("******88888888888***************");
            let number = parseInt(user.phone);
            req.session.phone = number;

            //  await   client.verify
            //     .services(config.serviceSID)
            //     .verifications.create({
            //       to: `+91${number}`,
            //       channel: "sms",
            //     })
            //     .then((data) => {
            //       res.render("user/auth/loginOtpVerify", { userUi: false, number });

            //     });

            res.redirect("/");
          } else {
            req.flash.loginErr = "your Account is Blocked";
            res.redirect("/login");
            req.session.loggedIn = false;
          }
        });
      } else {
        req.flash.loginErr = "Invalid credentials";
        res.redirect("/login");
      }
    });
  }
});

// ***************Logout****************

router.get("/logout", (req, res) => {
  req.session.destroy().then(res.redirect("/"));
});

router.get("/signup", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/auth/signup", { signupErr: req.flash.signupError });
    req.flash.signupError = "";
  }
});

router.post("/signup", (req, res) => {
  userHelper.signUpCheck(req.body).then((response) => {
    if (response.status) {
      req.flash.signupError = "Account already exist";

      res.redirect("/signup");
    } else {
      var number = req.body.phone;
      req.session.phone = req.body.phone;
      req.session.userData = req.body;

      // console.log(user.number);
      req.session.loggedin = true;
      req.session.user = response.user;

      client.verify
        .services(config.serviceSID)
        .verifications.create({
          to: `+91${number}`,
          channel: "sms",
        })
        .then((data) => {
          req.session.number = req.body.phone;
          res.redirect("/otp-varify");
        });
    }
  });
});
//------------------------OTP VErification------------------------------
router.get("/otp-varify", (req, res) => {
  res.render("user/auth/otp-verify", {
    otpErr: req.session.otpErr,
    number: req.session.number,
    userUi: false,
  });
});

router.post("/verify-otp-login", (req, res) => {
  var otp = req.body.otp;
  console.log(otp);
  console.log("9999999999999999999999999");
  let number = req.session.phone;
  console.log(number);
  console.log("99999999999955555555555555555555555559999999999999");
  client.verify
    .services(config.serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: otp,
    })
    .then((data) => {
      if (data.status == "approved") {
        req.session.loggedIn = true;
        res.redirect("/login");
      } else {
        req.session.otpErr = "Invalid OTP";
        req.session.loggedIn = false;
        res.redirect("/otp-varify");
      }
    });
});

router.post("/verify-otp", (req, res) => {
  var otp = req.body.otp;
  console.log(otp);
  console.log("9999999999999999999999999");
  let number = req.session.phone;
  console.log(number);
  console.log("99999999999955555555555555555555555559999999999999");
  client.verify
    .services(config.serviceSID)
    .verificationChecks.create({
      to: `+91${number}`,
      code: otp,
    })
    .then((data) => {
      if (data.status == "approved") {
        userHelper.doSignUp(req.session.userData).then((response) => {
          res.redirect("/login");
        });
      } else {
        otpErr = "Invalid OTP";
        req.session.loggedIn = false;
        res.render("user/auth/otp-verify", { otpErr, number });
      }
    });
});

router.get("/verify-otp", function (req, res, next) {
  res.render("user/auth/otp-verify", { admin: true });
});

//----------------Product details------------------------

router.get("/product-details/:id", (req, res) => {
  var id = req.params.id;

  adminHelper.getProductDetails(id).then((product) => {
    // adminHelper.getAllCategory().then((category) => {
    if (!product) {
      res.redirect("/productnotfound");
    }

    res.render("user/pages/product_details", {
      userUi: true,
      logedIn: req.session.loggedIn,
      product,
      category: req.session.category,
      cartCount: req.session.cartCount,
    });

    // });
  });
});

//---------------------Cart-----------------------

router.get("/cart", verifyLogin, async (req, res) => {
  // adminHelper.getAllCategory().then((category) => {
  cartCount = await userHelper.getCartCount(req.session.user._id);
  let products = await userHelper.getCartProducts(req.session.user._id);
  let totalAmount = await userHelper.getTotalAmount(req.session.user._id);
  let addresses = await userHelper.getAddress(req.session.user._id);
  let cart = await userHelper.getCartByUser(req.session.user._id);
  let couponCodes = await adminHelper.getAllCoupons();
  req.session.totalAmount = totalAmount;
  res.render("user/pages/cart", {
    userUi: true,
    category: req.session.category,
    products,
    logedIn: req.session.loggedIn,
    cartCount: cartCount,
    user: req.session.user,
    totalAmount: req.session.totalAmount,
    addresses,
    couponCodes,
    couponcode: req.session.coupondata,
    userData: req.session.userData,
    couponmsg: req.session.couponmsg,
    cart,
  });
  // req.session.coupondata = null;
  // req.session.couponmsg=null
});

router.post("/applycodetocart", (req, res) => {
  req.session.coupondata = req.body.coupon_code;
  console.log(req.body);
  console.log("///////////////////");

  res.redirect("/cart");
});

router.get("/add-to-cart/:id", async (req, res) => {
  if (!req.session.loggedIn) {
    res.json({ loggedinstatus: true });
  } else {
    let uid = req.params.id;
    let userid = req.session.user._id;
    let product = await adminHelper.getProductDetails(uid);

    if (product.offer_status) {
      product.price = product.offer_price;
    }

    console.log(product);

    userHelper.addToCart(uid, userid, product).then(() => {
      res.json({ status: true });
    });
  }
});

//---------------cart product increment decrement------------------

router.post("/change-product-quantity", async (req, res) => {
  console.log(req.body);

  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.totalAmount = await userHelper.getTotalAmount(req.body.user);
    response.cartProductTotal = await userHelper.getCartProductTotal(
      req.session.user._id
    );

    // console.log(response);
    console.log(response);
    res.json(response);
  });
});
router.post("/remove-cart-product", (req, res) => {
  userHelper.removeCartProduct(req.body).then((response) => {
    res.json(response);
  });
});

//---------------add-default-address------------------

router.post("/add-default-address", (req, res) => {
  console.log(req.body);
  userHelper.getDefaultAddress(req.body.addressId).then(async (response) => {
    console.log(response);

    req.session.selectAddress = await response;
    res.redirect("/place-order");
  });
});

//------------------------place-order-----------------------------

router.get("/place-order", verifyLogin, async (req, res) => {
  if (!req.session.loggedIn) {
    res.redirect("/");
  }
  let addresses = await userHelper.getAddress(req.session.user._id);

  let totalAmount = await userHelper.getTotalAmount(req.session.user._id);

  res.render("user/pages/checkout", {
    userUi: true,
    category: req.session.category,
    cartCount: req.session.cartCount,
    totalAmount,
    user: req.session.user,
    logedIn: req.session.loggedIn,
    addresses,
    address: req.session.selectAddress,
  });
});

router.post("/place-order", verifyLogin, async (req, res) => {
  // console.log(req.body);
  req.session.orderdata = req.body;
  let orderId = rn(options);
  let products = await userHelper.getCartProducts(req.session.userData._id);
  let totalPrice = await userHelper.getTotalAmount(req.session.user._id);
  req.session.totalPrice = totalPrice;
  let userData = await userHelper.getUserData(req.session.user._id);
  //   if(req.body.payment_method=="online"){
  //   console.log(products)
  //        console.log("online payment ")
  //  console.log(totalPrice)
  //  userHelper.generateRazorPay(order)

  //   }

  //else
  if (req.body.payment_method == "cod") {
    totalPrice = totalPrice * 100;
    await userHelper
      .placeOrder(
        req.body,
        products,
        totalPrice,
        req.session.user._id,
        req.session.appliedCoupon
      )
      .then((orderId) => {
        res.json({ codsuccess: true });
        req.session.coupondata = null;
        req.session.couponmsg = null;
      });
  } else if (req.body.payment_method == "razorpay") {
    totalPrice = totalPrice * 100;
    // await userHelper.placeOrderOnline(req.body, products, totalPrice).then(async(orderId) => {
    req.session.recieptId = orderId;

    await userHelper
      .generateRazorPay(orderId, totalPrice)
      .then((paymentResponse) => {
        // console.log(userData);
        req.session.coupondata = null;
        req.session.couponmsg = null;
        res.json({ paymentResponse: paymentResponse, userData });
      });

    //   res.json({ payment_status: true });

    // res.json({ status: true });
    // });
  } else {
    userHelper
      .generatePaypal(totalPrice, products, req.session.orderdata)
      .then((response) => {
        response.paypal = true;
        req.session.coupondata = null;
        req.session.couponmsg = null;
        res.json({ response });
      });
  }
});

router.get("/success/:id", async (req, res) => {
  let payerId = req.query.PayerID;
  let paymentId = req.query.paymentId;
  let total = req.session.totalPrice;
  let data = req.session.orderdata;

  let products = await userHelper.getCartProducts(req.session.userData._id);

  userHelper.verifypaypal(payerId, paymentId, total).then((response) => {
    userHelper
      .placeOrderOnline(
        data,
        products,
        total,
        req.session.appliedCoupon,
        req.session.user._id
      )
      .then((response) => {
        res.redirect("/orders");
      });
  });
});

router.post("/verify-payment", async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.userData._id);
  console.log(products);
  let totalPrice = await userHelper.getTotalAmount(req.session.userData._id);
  console.log("/////////////////");

  await userHelper
    .verifyPayment(req.body)
    .then(async () => {
      console.log("payment Success,");
      await userHelper
        .placeOrderOnline(
          req.session.orderdata,
          products,
          totalPrice,
          req.session.appliedCoupon
        )
        .then(() => {
          console.log("payment Success, order placed");
          res.json({ paymentstatus: true });
        });
    })
    .catch((err) => {
      res.json({ paymentstatus: false });
    });
});

//------------------------user  account ---------------------------
router.get("/account", verifyLogin, async (req, res) => {
  console.log(req.session.userData);
  let userData = await userHelper.getUserData(req.session.user._id);
  res.render("user/pages/profile", {
    userUi: true,
    category: req.session.category,
    cartCount: req.session.cartCount,
    logedIn: req.session.loggedIn,
    userData: userData,
    user: req.session.user,
  });
}),
  //-----------------addresses-------------------

  router.get("/account-addresses", verifyLogin, async (req, res) => {
    let address = await userHelper.getAddress(req.session.userData._id);

    console.log(address);
    res.render("user/pages/account_addresses", {
      userUi: true,
      category: req.session.category,
      cartCount: req.session.cartCount,
      logedIn: req.session.loggedIn,
      userData: req.session.userData,
      user: req.session.user,
      address,
    });
  });

router.post("/add-address", async (req, res) => {
  console.log(req.session.userData);
  let userId = req.session.userData._id;

  await userHelper
    .addNewAddress(req.body, userId)
    .then(res.json({ status: true }));
}),
  router.get("/deleteAddress/:id", (req, res) => {
    console.log(req.params.id);
    console.log("++++++++++++++++++++++");
    userHelper.deleteAddress(req.params.id).then((response) => {
      res.json({ status: true });
    });
  }),
  router.post("/edit-address/:id", (req, res) => {
    console.log(req.body);
    console.log(req.params.id);
    console.log("++++++++++++++++++++++");
    userHelper.updateAddress(req.params.id, req.body).then((response) => {
      res.redirect("/account-addresses");
    });
  }),
  //------------------------edit-profile-----------------------------
  router.get("/edit-profile", verifyLogin, async (req, res) => {
    console.log(req.session.userData);

    let userData = await userHelper.getUserData(req.session.user._id);

    res.render("user/pages/edit-profile", {
      userUi: true,
      category: req.session.category,
      cartCount: req.session.cartCount,
      logedIn: req.session.loggedIn,
      userData: userData,
      user: req.session.user,
    });
  });

router.post("/edit-profile", upload.array("proImage"), (req, res, next) => {
  console.log(req.files);
  console.log(req.body);
  let proimg = {};

  req.files.forEach(function (files, index, ar) {
    console.log(req.files[index].filename);

    proimg.image = req.files[index].filename;
  });
  console.log(proimg);

  let userId = req.session.userData._id;
  console.log(userId);

  userHelper.editProfile(req.body, proimg, userId).then(() => {
    req.session.submit = true;
    res.redirect("/account");
  });
});

//------------------------Shop products-----------------------------

router.get("/shop-by-category/:id", async (req, res) => {
  let products = await userHelper.getProductByCategory(req.params.id);
  // let categoryname= await userHelper.getCategoryName(req.params.id)
  console.log(products);
  console.log("heres ");
  res.render("user/pages/shop", {
    userUi: true,
    category: req.session.category,
    cartCount: req.session.cartCount,
    logedIn: req.session.loggedIn,
    user: req.session.user,
    products,
    // categoryname
  });
});

//---------------account password change--------
router.get("/account-password-change", verifyLogin, async (req, res) => {
  let userData = await userHelper.getUserData(req.session.user._id);

  res.render("user/pages/changePassword", {
    userData,
    userUi: true,
    category: req.session.category,
    cartCount: req.session.cartCount,
    logedIn: req.session.loggedIn,

    user: req.session.user,
  });
});

router.post("/account-password-change", async (req, res) => {
  console.log(req.body);
  req.session.body = req.body;
  console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
  let userData = await userHelper.getUserData(req.session.user._id);

  await userHelper
    .doPasswordCheck(userData, req.body)
    .then(async (response) => {
      if (response.status) {
        await userHelper
          .changePassword(userData, req.session.body)
          .then((response) => {
            if (response.status) {
              // res.redirect('/account-password-change')
              res.json({ status: true });
            }
          });
      } else {
        res.json({ status: false });
      }
    });

  // res.render('user/pages/changePassword',{userData, userUi:true,
  //   category: req.session.category,
  //   cartCount: req.session.cartCount,
  //   logedIn: req.session.loggedIn,

  //   user: req.session.user,})
});

router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelper.getOrderByUser(req.session.user);
  console.log("-----------------------");
  console.log(orders);
  console.log("-----------------------");
  res.render("user/pages/allOrders", {
    userUi: true,
    category: req.session.category,
    cartCount: req.session.cartCount,
    logedIn: req.session.loggedIn,
    user: req.session.user,
    orders,
  });
});

router.get("/orders/:id", async (req, res) => {
  let orderDetails = await userHelper.getOrderDetails(req.params.id);
  let deliveryStatus = false;
  let cancelStatus = true;
  let returnStatus = true;
  if (orderDetails.status == "returned") {
    returnStatus = false;
    deliveryStatus = true;
    cancelStatus = false;
  }

  if (orderDetails.status == "shipped") {
    deliveryStatus = true;
    cancelStatus = false;
  }
  if (orderDetails.status == "cancelled") {
    cancelStatus = false;
  }
  res.render("user/pages/orderDetails", {
    userUi: true,
    orderDetails,
    deliveryStatus,
    cancelStatus,
    returnStatus,
  });
});

router.get("/cancel-order/:id", (req, res) => {
  console.log(req.params.id);
  userHelper.cancelOrder(req.params.id).then(res.json({ status: true }));
});
router.get("/return-order/:id", (req, res) => {
  console.log(req.params.id);
  userHelper.returnOrder(req.params.id).then(res.json({ status: true }));
});

router.get("/ship-order/:id", (req, res) => {
  console.log(req.params.id);
  userHelper.shipOrder(req.params.id).then(res.json({ status: true }));
});

router.get("/collection/:id", async (req, res) => {
  try {
    let products = await userHelper.getProductByCollection(req.params.id);
    console.log(products[0]);
    if (!products || products[0] == null) {
      res.redirect("/productnotfound");
    }

    res.render("user/pages/shop", {
      userUi: true,
      category: req.session.category,
      cartCount: req.session.cartCount,
      logedIn: req.session.loggedIn,
      user: req.session.user,
      products: products,
    });
  } catch (err) {
    res.redirect("/productnotfound");
  }
});

router.post("/apply-coupon", async (req, res) => {
  try {
    let totalAmount = req.session.totalAmount;

    let coupon = await userHelper.getCouponData(req.body);

    if (coupon == undefined) {
      res.json({ invalidCoupon: true });
    } else {
      console.log("6666666666666666");
      let usedCouponCheck = await userHelper.couponCheck(
        req.session.user._id,
        coupon.coupon_code
      );

      console.log(usedCouponCheck);
      if (!usedCouponCheck) {
        console.log(coupon, totalAmount);

        await userHelper
          .addcoupontocart(coupon, req.session.user._id)
          .then(async () => {
            let cart = await userHelper.getCartByUser(req.session.user._id);
            req.session.appliedCoupon = coupon;
            req.session.couponmsg = `coupon applied !! ₹ ${cart.coupon_offer} offer added`;
            res.json({ coupon, totalAmount, cart });
          });
      } else {
        res.json({ couponused: true });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/removecoupon/:id", async (req, res) => {
  await userHelper.removeCouponFromCart(req.params.id).then((response) => {
    req.session.coupondata = null;
    req.session.couponmsg = null;
    req.session.appliedCoupon = null;
    res.json({ removed: true });
  });
});

router.get("/add-to-wishlist/:id", async (req, res) => {
  if (!req.session.user) {
    res.json({ userloggedin: false });
  }

  let product = await userHelper.getProductDetails(req.params.id);

  let wishlistCheck = await userHelper.wishlistCheck(req.session.user, product);
  console.log(wishlistCheck.datastatus);
  if (wishlistCheck.datastatus) {
    res.json({ wishlistData: true });
  } else {
    await userHelper
      .addtoWishlist(req.session.user, req.params.id)
      .then((response) => {
        res.json({ addedtowishlist: true });
      });
  }
  console.log(req.params.id);
});



//-------------wish list ---------------------



router.get('/wishlist',verifyLogin, async(req,res)=>{

let wishlist= await userHelper.getwishlist(req.session.user)

res.render('user/pages/wishlist',{
  userUi:true,
   logedIn: req.session.loggedIn,
    category: req.session.category,
  cartCount: req.session.cartCount,
 products:wishlist
})


console.log(wishlist);




})


router.get("/removewishlist/:id",async(req,res)=>{

  
 await userHelper.removewishlist(req.params.id).then((response)=>{
    res.json({proremoved:true})

 })


})



module.exports = router;
