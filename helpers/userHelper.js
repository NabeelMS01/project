const db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const { reject, promise } = require("bcrypt/promises");
const { response } = require("../app");
const { Db } = require("mongodb");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("node:path");
const { Hmac } = require("node:crypto");
const paypal = require("paypal-rest-sdk");
const { Console } = require("node:console");
const adminHelper = require("./adminHelper");
const paypalconfig = require("../config/paypal");
const { Resolver, resolveCaa } = require("node:dns");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AV05776SkKsp-OQsecJGn2PfDM0INFc0mJkZhiZnN2G0vrIqPsaW2nQVhUSE47oDslP69hu_502AeoBJ",
  client_secret:
    "EOU_Zb_8gbPFX-X-JANSlrm_8YcdtB5Ph57kSF_CEE1ULdTfWp69Bnqp6C_i06oGemWLy8jFwEF0lkIj",
});

var instance = new Razorpay({
  key_id: process.env.KEYID,
  key_secret: process.env.KEYSECRET,
});

module.exports = {
  //------------
  //------------------sign up check---------------------
  signUpCheck: (email) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let Email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: email.email });

      if (Email) {
        response.status = true;
        resolve(response);
      } else {
        resolve({ status: false });
      }
    });
  },

  //------------------login check---------------------
  loginCheck: (email) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let Email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: email.email });

      if (Email.status) {
        response.userstatus = true;
        resolve(response);
      } else {
        resolve({ userstatus: false });
      }
    });
  },

  //------------------sign up ---------------------

  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      console.log("bcrypt");
      userData.password = await bcrypt.hash(userData.password, 10);
      userData.status = true;
      userData.used_coupons = [];
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data);
        });
    });
  },

  //------------------login ---------------------
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let loginStatus = false;

      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
            console.log("Login succesful");
          } else {
            resolve({ status: false });
            console.log("Login failed");
          }
        });
      } else {
        resolve({ status: false });
        console.log("Login failed");
      }
    });
  },
  doPasswordCheck: (userData, bodyData) => {
    return new Promise(async (resolve, reject) => {
      console.log(bodyData.oldPassword);
      console.log("0------------00000");

      await bcrypt
        .compare(bodyData.old_password, userData.password)
        .then((status) => {
          console.log(status);
          console.log("0000000000000");
          let response = {};

          if (status) {
            response.status = true;
            resolve(response);
            console.log("Login succesful");
          } else {
            resolve({ status: false });
            console.log("Login failed");
          }
        });
    });
  },
  changePassword: (userData, dataBody) => {
    return new Promise(async (resolve, reject) => {
      console.log("++++++++++++++++++++++++");
      console.log(dataBody);
      console.log("++++++++++++++++++++++++");

      let password = await bcrypt.hash(dataBody.password, 10);

      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userData._id) },
          {
            $set: {
              password: password,
            },
          },
          { upsert: true }
        )
        .then(resolve({ status: true }));
    });
  },

  getPhone: (email) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: email })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getUserData: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userData = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });

      resolve(userData);
    });
  },

  addNewAddress: (data, userId) => {
    data.userId = ObjectId(userId);

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(data)
        .then(resolve());
    });
  },
  getDefaultAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: ObjectId(id) });
      console.log(address);
      console.log("9999999999999");
      resolve(address);
    });
  },
  getAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      let addresses = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ userId: ObjectId(id) })
        .toArray();
      console.log(addresses);

      resolve(addresses);
    });
  },
  deleteAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .deleteOne({ _id: ObjectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  updateAddress: (id, data) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              name: data.name,
              email: data.email,
              address: data.address,
              pincode: data.pincode,
              phone: data.phone,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  editProfile: (data, img, userId) => {
    console.log(data);
    console.log("2222222222222222222");

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              name: data.name,
              email: data.email,
              phone: data.phone,
              image: img.image,
            },
          },
          {
            upsert: true,
          }
        )
        .then(resolve());
    });
  },

  //------------------add to cart helper---------------------

  getCartCount: (id) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(id) });

      if (cart) {
        count = cart.products.length;
      }

      resolve(count);
    });
  },

  getCartByUser: (id) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(id) });
      resolve(cart);
    });
  },
  addToCart: (proId, userId, product) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images[0],
    };

    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                user: ObjectId(userId),
                "products.item": ObjectId(proId),
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };

        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },

  //------------------get product details --------------------

  getProductDetails: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(id) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  getCartProducts: (userId) => {


    console.log(userId);
   
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId._id) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    // console.log(details);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
            },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  removeCartProduct: (details) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          {
            _id: ObjectId(details.cart),
          },
          {
            $pull: { products: { item: ObjectId(details.product) } },
          }
        )
        .then((response) => {
          resolve({ removeCartProduct: true });
        });
    });
  },

  getCartProductTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartProductTotalAmount = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          // {
          //   $group: {
          //     _id: null,
          //     total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
          //   }
          // }
        ])
        .toArray();
      if (cartProductTotalAmount[0].total == undefined) {
        resolve({ status: true });
      } else {
        console.log(cartProductTotalAmount);

        console.log("************asdasdfasdf*****");
        console.log(cartProductTotalAmount[0].total);

        resolve(cartProductTotalAmount[0].total);
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartTotalAmount = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $cond: {
                    if: { $eq: ["$product.offer_status", true] },
                    then: { $multiply: ["$quantity", "$product.offer_price"] },
                    else: { $multiply: ["$quantity", "$product.price"] },
                  },

                  // $multiply: ["$quantity", "$product.price"]
                },
              },
            },
          },
        ])
        .toArray();

      let cartOffer = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });

      if (cartOffer) {
        if (cartOffer.coupon_offer_status) {
          cartTotalAmount[0].total =
            cartTotalAmount[0].total - cartOffer.coupon_offer;
        }
      }
      console.log("55555555555555");
      console.log(cartTotalAmount[0]);

      if (cartTotalAmount[0] === undefined) {
        resolve();
      } else {
        resolve(cartTotalAmount[0].total);
      }
    });

    // console.log("************asdasdfasdf*****");
    // console.log(cartTotalAmount[0].total);
  },

  getOrderDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      let orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: ObjectId(id) });
      resolve(orderDetails);
    });
  },

  //*****************************get  CArt product TOtal ------------------- */
  getCartProductTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartProductTotal = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();

      console.log(cartProductTotal);

      console.log("************asdasdfasdf*****");
      console.log(cartProductTotal);

      resolve(cartProductTotal);
    });
  },

  // ------------------place order--------------------
  placeOrder: (order, products, total, id, coupon) => {
    return new Promise(async (resolve, reject) => {
      let status = order["payment_method"] === "cod" ? "placed" : "pending";

      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.phone,
          address: order.address,
          email: order.email,
          pincode: order.pincode,
        },
        userId: ObjectId(order.userId),
        paymentMethod: order["payment_method"],
        products: products,
        totalAmount: total / 100,
        date: moment().local().format("DD-MM-YYYY"),
        order_time: new Date(),
        status: status,
        delivery_status: false,
      };

      if (coupon) {
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectId(id) },
            {
              $push: { used_coupons: coupon.coupon_code },
            }
          );
      }

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: ObjectId(order.userId) });
          console.log("333333333333333333333333333");
          console.log(response.insertedId.toString());
          resolve(response.insertedId.toString());
        });
    });
  },
  placeOrderOnline: (order, products, total, coupon, userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(total);

      let status = "placed";

      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.phone,
          address: order.address,
          email: order.email,
          pincode: order.pincode,
        },
        userId: ObjectId(order.userId),
        paymentMethod: order["payment_method"],
        products: products,
        totalAmount: total,
        date: moment().local().format("DD-MM-YYYY"),
        order_time: new Date(),
        status: status,
        delivery_status: false,
      };

      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then(async (response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: ObjectId(order.userId) });

          if (coupon) {
            await db
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: ObjectId(userId) },
                {
                  $push: { used_coupons: coupon.coupon_code },
                }
              );
          }

          resolve(response.insertedId.toString());
        });
    });
  },

  //--------------------- get product by category-----------------

  getProductByCategory: (name) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category_name: `${name}` })
        .toArray();
      console.log(products);
      resolve(products);
    });
  },

  //-----------------getProduct By Collection----------------

  getProductByCollection: (id) => {
    console.log(id);

    console.log("*********************+6++");
    return new Promise(async (resolve, reject) => {
      let products;
      try {
        products = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({ sub_category_id: ObjectId(id) })
          .toArray();
        resolve(products);
      } catch (err) {
        console.log(err);

        console.log(products);
        console.log("*********************+6++");

        resolve(products);
      }
    });
  },

  //---------------------razor Pay integration------------------

  generateRazorPay: (orderId, totalPrice) => {
    return new Promise((resolve, rject) => {
      var options = {
        amount: totalPrice, // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("new order");
        // console.log(order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      let crypto = require("node:crypto");

      let hash = crypto
        .createHmac("sha256", "3J69cSPac1Du7CjKKH9k8lKL")
        .update(
          details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        )
        .digest("hex");

      if (hash == details.payment.razorpay_signature) {
        console.log(hash);

        console.log("666666666666666");
        resolve();
      } else {
        reject();
      }
    });
  },
  //---------------------Paypal integration------------------

  generatePaypal: (total, products, order) => {
    console.log(total);
    console.log(products);
    console.log(order);
    return new Promise(async (resolve, reject) => {
      let create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `http://nabeelmampallil.com/success/${order.userId}?paymentMethod=${order.payment_method}&phone=${order.phone}`,
          cancel_url: "http://nabeelmampallil.com/cart",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Red sok Hat",
                  sku: "001",
                  price: total,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: total,
            },
            description: "This is the payment description.",
          },
        ],
      };
      console.log(create_payment_json);
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          payment.body = order;
          payment.products = products;
          payment.total = total;

          console.log(payment);
          resolve(payment);
        }
      });
    });
  },

  verifypaypal: (payerId, paymentId, total) => {
    return new Promise(async (resolve, reject) => {
      let execute_payment_json = {
        payer_id: payerId,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: total,
            },
          },
        ],
      };

    paypal.payment.execute(
        paymentId,
        execute_payment_json,
        function (error, payment) {
          if (error) {
            console.log(error.response);
            throw error;
          } else {
            console.log(JSON.stringify(payment));
            resolve();
          }
        }
      );
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      console.log(products);
      resolve(products);
    });
  },

  getOrderByUser: (user) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(user._id) })
        .sort({ date: -1 })
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "cancelled",
            },
          }
        )
        .then(resolve());
    });
  },

  returnOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "returned",
            },
          }
        )
        .then(resolve());
    });
  },

  shipOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "shipped",
            },
          }
        )
        .then(resolve());
    });
  },

  validateOffer: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      let i;

    

      for (i = 0; i < products.length; i++) {
        if (products[i].offer_status) {
          let nowDate = new Date().toISOString().split("T")[0];
          let endDate = products[i].offer_end.toISOString().split("T")[0];
          nowDate = new Date(nowDate);
          endDate = new Date(endDate);
          //  console.log(nowDate);
          //  console.log(endDate);
          if (nowDate >= endDate) {
            adminHelper.removeProductOffer(products[i]._id);
            console.log("delete Success ******************");
          }
        }
      }

      resolve();
    });
  },

  //------------------banner management-------------

  getAllBanners: () => {
    return new Promise(async (resolve, reject) => {
      let banners = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      resolve(banners);
    });
  },
  getCouponData: (data) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .aggregate([
          {
            $match: {
              coupon_code: data.coupon_code,
            },
          },
        ])
        .toArray();
      resolve(coupon[0]);
    });
  },
  couponCheck: (userId, couponCode) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });

      let list = user.used_coupons;
      let couponUsed = false;
      for (let i = 0; i <= list.length; i++) {
        couponUsed = false;

        if (list[i] == couponCode) {
          couponUsed = true;
          break;
        }
      }

      console.log(couponUsed);
      resolve(couponUsed);
    });
  },
  addcoupontocart: (coupon, id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: ObjectId(id) },
          {
            $set: {
              coupon_offer: coupon.offer,
              coupon_offer_status: coupon.status,
            },
          },
          {
            upsert: true,
          }
        );
      resolve();
    });
  },

  removeCouponFromCart: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              coupon_offer: parseInt(0),
              coupon_offer_status: false,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  wishlistCheck: (user, product) => {
    return new Promise(async (resolve, reject) => {
      let wishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: {
              userId: ObjectId(user._id),
            },
          },
          {
            $match: {
              product: ObjectId(product._id),
            },
          },
        ])
        .toArray();

      let wishlistData = false;

      if (wishlist[0]) {
        wishlistData = true;
        resolve({ datastatus: true });
      } else if (wishlist[0] == undefined) {
        console.log(wishlist);
        console.log("11111111111");
        resolve({ datastatus: false });
      } else {
        console.log(wishlist);
        console.log("22222222222");
        resolve({ datastatus: false });
      }
    });
  },

  addtoWishlist: (user, id) => {
    return new Promise(async (resolve, reject) => {
      let wishlist = {};

      wishlist.userId = ObjectId(user._id);
      wishlist.product = ObjectId(id);

      await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .insertOne(wishlist)
        .then((response) => {
          resolve({ addedtowishlist: true });
        });
    });
  },

  getwishlist: (user) => {
    return new Promise(async (resolve, reject) => {
      let wishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: {
              userId: ObjectId(user._id),
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "product",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $unwind: {
              path: "$product",

              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              product_id: "$product._id",
              product_name: "$product.name",
              product_price: "$product.price",
              product_offer_price: "$product.offer_price",
              product_offer_status: "$product.offer_status",
              product_image: "$product.images",
              preserveNullAndEmptyArrays: true,
            },
          },
        ])
        .toArray();

      resolve(wishlist);
    });
  },

  removewishlist:(id)=>{
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.WISHLIST_COLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{

        resolve()
      })
    })
  }



};
