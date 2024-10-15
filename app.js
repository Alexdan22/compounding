//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const uuid = require("uuid");
const path = require('path');
const shortid = require('shortid');
const cors = require('cors');
const schedule = require('node-schedule');
const sdk = require('api')('@decentro/v1.0#pwx2s1ddlp6q9m73');
const { DateTime } = require('luxon');
const app = express();
const QRCode = require('qrcode')

app.set('view engine', 'ejs');

app.use(cors())

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static("public"));

app.use(cookieParser());

app.use(session({
    secret: process.env.RANDOM,
    saveUninitialized:false,
    resave: false
}));

mongoose.set('strictQuery', false);
// mongoose.connect("mongodb://localhost:27017/miningCompoundDB");
mongoose.connect("mongodb+srv://alex-dan:Admin-12345@cluster0.wirm8.mongodb.net/miningCompoundDB");


const timeZone = 'Asia/Kolkata';
const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


let d = new Date();
let year = currentTimeInTimeZone.year;
let month = currentTimeInTimeZone.month;
let date = currentTimeInTimeZone.day;
let hour = currentTimeInTimeZone.hour;
let minutes = currentTimeInTimeZone.minute;
let seconds = d.getSeconds();




const earningSchema = new mongoose.Schema({
  compoundIncome: Number,
  weeklySalary: Number,
  totalIncome: Number,
  directIncome: Number,
  levelIncome: Number,
  teamBuilder: Number,
  addition: Number,
  addition2: Number,
  availableBalance: Number
});
const compoundSchema = new mongoose.Schema({
  active: Number,
  interest: Number,
  total: Number,
  days: Number,
  percentage: Number
});
const bankDetailsSchema = new mongoose.Schema({
  name: String,
  accountNumber: String,
  bankName: String,
  ifsc: String
});
const transactionSchema = new mongoose.Schema({
  type: String,
  from: String,
  amount: Number,
  status: String,
  incomeType: String,
  userID: String,
  time:{
    date: String,
    month: String,
    year: String
  },
  trnxId: String
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  userID: {
    type: String,
    required: true
  },

  sponsorID: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  earnings: earningSchema,

  compound: compoundSchema,

  bankDetails: bankDetailsSchema,

  transaction: [transactionSchema],

  status: String,

  package: String,

  time: {
    date: String,
    month: String,
    year: String
  }

});
const adminSchema = new mongoose.Schema({
  email: String,
  payment:[
    {
      trnxId: String,
      email: String,
      amount: Number,
      username: String,
      time:{
        date: String,
        month: String,
        year: String,
        minutes: String,
        hour: String
      },
      status: String
    }
  ],
  withdrawal:[
    {
      trnxId: String,
      email: String,
      amount: Number,
      username: String,
      time:{
        date: String,
        month: String,
        year: String,
        minutes: String,
        hour: String
      },
    }
  ],
  taskLink: String
});
const paymentSchema = new mongoose.Schema({
  trnxId: String,
  email: String,
  amount: Number,
  username: String,
  time:{
    date: String,
    month: String,
    year: String,
    minutes: String,
    hour: String
  },
  status: String
})
const qrDataSchema = new mongoose.Schema({ text: String });


userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

const Admin = new mongoose.model("Admin", adminSchema);

const Payment = new mongoose.model("Payment", paymentSchema);

const Data = new mongoose.model('Data', qrDataSchema);

//ROUTES
app.get("/", function(req, res){
  const alert = "false";
  res.render("login", {alert});
});

app.get("/register", function(req, res){
  if(req.session.sponsorID){
    const alert = "false";
    const sponsor = 'true';
    const sponsorID = req.session.sponsorID;
    res.render("register", {
      sponID:req.session.sponsorID,
      alert,
      sponsor,
      sponsorID
    });
  }else {
    const alert = "false";
    const sponsor = "false"
    res.render("register", {
      alert,
      sponsor
    });
  }
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  try {
    const foundUser = await User.findOne({ email: req.session.user.email });
    if (!foundUser) {
      return res.redirect("/");
    }

    const {
      username: name,
      email,
      userID,
      earnings: {
        compoundIncome,
        totalIncome,
        directIncome: direct,
        levelIncome: level,
        weeklySalary,
        teamBuilder,
        addition,
        addition2,
        availableBalance
      },
      compound,
      status
    } = foundUser;

    const alert = 'nil';

    res.render("dashboard", {
      name,
      email,
      userID,
      weeklySalary,
      compoundIncome,
      teamBuilder,
      addition,
      addition2,
      totalIncome,
      direct,
      level,
      availableBalance,
      alert,
      compound,
      current: compound.active + compound.interest,
      status
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred. Please try again later.");
  }
});

app.get("/profile", async (req, res) =>{
  if (!req.session.user) {
    return res.redirect("/");
  }
  try {
    const foundUser = await User.findOne({ email: req.session.user.email });
    if (!foundUser) {
      return res.redirect("/");
    }
    
    const {
      username,
      email,
      status,
      userID,
      sponsorID
    } = foundUser;


    const foundSponsor = await User.findOne({userID: sponsorID});


    if(!foundSponsor){
      //With no Registered Sponsor ID
      
      res.render('profile', {username, email, userID,status, sponsorID});
    }else{
      //With registered sponsor ID
      const {
        sponsorName = username
      } = foundSponsor;

        res.render('profile', {username, email, userID,status,sponsorName, sponsorID});
    }

  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred. Please try again later.");
  }

});

app.get("/package", function(req, res){
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{
    res.status(200).send({success:'true'});
  }
});

app.get("/paymentGateway", async function(req, res) {
  if (!req.session.user) {
    res.redirect("/");
  } else {
    try {
      const foundUser = await User.findOne({ email: req.session.user.email });
      if (foundUser) {
        let data = await Data.findOne({});
        if (!data) {
          data = new Data({ text: "dummy@upiId" });
          await data.save();
          res.redirect('/dashboard');
        } else {
          res.render("payment", {
            name: foundUser.username,
            email: foundUser.email,
            alert: 'nil',
            upiId: data.text,
            status: foundUser.status
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/withdrawal", function(req, res){
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{

      User.findOne({email: req.session.user.email}, function(err, foundUser){
        if(err){
          console.log(err);
        }else{
          if(!foundUser.bankDetails){
            res.render('withdrawal', {
              name: foundUser.username,
              email: foundUser.email,
              bankDetails: "Not provided",
              availableBalance: foundUser.earnings.availableBalance,
              alert: 'nil'

            });
          }else{
          res.render('withdrawal', {
            name: foundUser.username,
            email: foundUser.email,
            bankDetails: "Provided",
            availableBalance: foundUser.earnings.availableBalance,
            alert: 'nil'

          });
          }
        }
        });
      }
});

app.get('/transaction', async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  } else {
    try {
      const foundUser = await User.findOne({ email: req.session.user.email });
      if (foundUser) {
        res.status(200).render('transaction',{
          name: foundUser.username,
          email: foundUser.email,
          transaction: foundUser.transaction,
          alert: 'nil'
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/adminLogin", function(req, res){
  res.render("adminLogin");
});

app.get("/admin", async function(req, res) {
  if (!req.session.admin) {
    res.redirect("/adminLogin");
  } else {
    try {
      const foundAdmin = await Admin.findOne({ email: process.env.ADMIN });
      const foundUsers = await User.find({});
      
      const total = foundUsers.length;
      const current = foundUsers.filter(activeUsers => activeUsers.status === 'Active');
      const review = foundUsers.filter(reviewRequired => reviewRequired.status === 'Review');
      const currentUsers = current.length;

      
      res.render("admin", {
        total,
        currentUsers,
        pendingApproval: foundAdmin.payment.length,
        pendingWithdraw: foundAdmin.withdrawal.length,
        payment: foundAdmin.payment,
        review,
        withdrawal: foundAdmin.withdrawal
      });
      
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/currentInvestors", function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    User.find({}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        let currentInvestor = [];
        foundUser.forEach(function(user){
          if(user.earnings.currentInvestment != 0){
            currentInvestor.push(user);
          }
        });
        res.render('investors', {
          currentInvestor
        });
      }
    })
  }
});

app.get("/register/:sponsorID", function(req, res){

  req.session.sponsorID = req.params.sponsorID;

  const alert = "false";
  const sponsor = 'true';
  const sponsorID = req.session.sponsorID;
  // res.render("register", {
  //   sponID:req.session.sponsorID,
  //   alert,
  //   sponsor,
  //   sponsorID
  // });
  res.redirect('/register');
});

app.get("/log-out", function(req, res){
  req.session.destroy();
  res.redirect("/");
});

app.get("/api/transactionID/:trnxId", function(req, res){
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{
    User.findOne({email:req.session.user.email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        const trnxId = req.params.trnxId;
        foundUser.transaction.forEach(function(transaction){
          if(transaction.trnxId == trnxId){
            res.status(200).send({foundTransaction: transaction});
          }
        })
      }
    })
  }
});

app.get('/idActivation', (req, res) => {
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{

    User.findOne({email: req.session.user.email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        res.status(200).send({
          name: foundUser.username,
          email: foundUser.email,
          availableBalance: foundUser.earnings.availableBalance,
          alert: 'nil'

        });
      }
      });
  }
});

app.get('/recurringCompound', async (req, res) => {

  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;

  if (req.session.admin) {
    try {
      
      const trnxID = String(Math.floor(Math.random()*999999999));
      const foundUsers = await User.find({});

      foundUsers.forEach(async (user) => {
        if (user.status === 'Active') {
          if (user.compound.days === 1) {
            // Handle to credit the compounding interest and reset the compound active

            const todaysInterest = Math.floor((user.compound.active + user.compound.interest) * user.compound.percentage);
            console.log(todaysInterest, user.compound.percentage)
            const lastDayInterest = Math.floor(todaysInterest +user.compound.interest);
            const updatedCompound = {
              active: 0,
              total: user.compound.total,
              days: 0,
              interest: 0,
              percentage: 0
            };

            await User.updateOne({ email: user.email }, { $set: { compound: updatedCompound } });

            await User.updateOne({ email: user.email }, { $set: { status: 'Idle' } });

            await User.updateOne({ email: user.email }, {
              $set: {
                earnings: {
                  compoundIncome: user.earnings.compoundIncome + lastDayInterest,
                  weeklySalary: user.earnings.weeklySalary,
                  totalIncome: user.earnings.totalIncome + lastDayInterest,
                  directIncome: user.earnings.directIncome,
                  levelIncome: user.earnings.levelIncome,
                  teamBuilder: user.earnings.teamBuilder,
                  addition: user.earnings.addition,
                  addition2: user.earnings.addition2,
                  availableBalance: user.earnings.availableBalance + lastDayInterest
                }
              }
            });

            const transaction = user.transaction;

              const newTrnx = {
                type: 'Credit',
                from: 'Compound',
                amount: lastDayInterest,
                status: 'success',
                trnxId: trnxID,
                time: {
                  date: date,
                  month: month,
                  year: year
                }
              };

              transaction.push(newTrnx);


              await User.updateOne({ email: user.email }, { $set: { transaction: transaction } });

          } else {
            // Handle for normal compounding
            const todaysInterest = Math.floor((user.compound.active + user.compound.interest) * user.compound.percentage);
            console.log(todaysInterest, user.compound.percentage)
            const updatedCompound = {
              active: user.compound.active,
              total: user.compound.total,
              days: user.compound.days - 1,
              interest: user.compound.interest + todaysInterest,
              percentage: user.compound.percentage
            };

            await User.updateOne({ email: user.email }, { $set: { compound: updatedCompound } });
          }
        }
      });

      res.redirect('/admin');
    } catch (err) {
      console.error(err);
    }
  } else {
    res.status(403).send("Unauthorized");
  }
});

app.get('/downline', (req, res) => {
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{
    User.findOne({email:req.session.userl.email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        User.findMany({sposnorID: foundUser.userID}, (err, downlines)=>{
          res.status(200).send({downlines})
        })
      }
    })
  }
})

app.get('/activeUsers', function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    User.find({}, function(err, foundUsers){
      if(err){
        console.log(err);
      }else{
        res.render('activeUsers', {foundUsers});
      }
    })
  }
});

app.get('/generateQR', async (req, res) => {
  try {
    // Fetch data from MongoDB
    const data = await Data.findOne();
    if (!data) {
      const qr = new Data({
        text: "dummy@upiId"
      });
      qr.save();
      return res.status(404).send('No data found');
    }

    // Generate QR code
    const textToQr = "upi://pay?pa=" + data.text + "&mc=5399&pn=Google Pay Merchant&oobe=fos123&q";
    QRCode.toDataURL(textToQr, (err, url) => {
      if (err) {
        return res.status(500).send('Error generating QR code');
      }
      res.status(200).send({ url });
    });
  } catch (error) {
    res.status(500).send('Server error');
    console.log(error)
  }
});

app.get("/adminUpdate", async function(req, res){
  try{
    const newAdmin = new Admin({
      email:process.env.ADMIN,
      payment:[],
      withdrawal:[]
    });
    newAdmin.save();
  }catch(err){
    console.log(err);
  }
});





//POSTS

app.post("/adminLogin", function(req, res){
  if(process.env.ADMIN === req.body.email){
    if(process.env.PASSWORD === req.body.password){
      req.session.admin = req.body;

      res.redirect('/admin');
    }else{
      //Not an User
      res.redirect('/adminLogin');
    }
  }else{
    //Not an User
    res.redirect('/adminLogin');
  }
}); //adw

app.post('/userPanel', function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
      if(req.body.type == "email"){
        User.findOne({email:req.body.input}, function(err, foundUser){
          if(err){
            console.log(err);
          }else{
            if(!foundUser){
              res.redirect('/admin');
            }else{
              req.session.user = {email:foundUser.email};
              res.redirect("/dashboard");
            }
          }
        });
      }else{
        User.findOne({userID:req.body.input}, function(err, foundUser){
          if(err){
            console.log(err);
          }else{
            if(!foundUser){
              res.redirect('/admin');
            }else{
              req.session.user = {email:foundUser.email};
              res.redirect("/dashboard");
            }
          }
        });
      }
    }
  }); //adw

app.post('/unsetBankDetails', function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    User.findOne({email:req.body.email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        if(!foundUser){
          res.redirect('/admin');
        }else{
          if(req.body.validation == "CONFIRM"){
            User.updateOne({email:req.body.email}, {$unset:{bankDetails:''}}, function(err){
              if(err){
                console.log(err);
              }else{
                res.redirect('/admin');
              }
            });
          }else{
            res.redirect('/admin');
          }
        }
      }
    });
  }
}); //adw

app.post('/api/login', async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });

    if (!foundUser) {
      return res.status(200).send({
        alertType: "warning",
        alert: "true",
        message: "Email or Password Invalid",
        loaderBg: '#57c7d4'
      });
    }

    if (req.body.password === foundUser.password) {
      req.session.user = req.body;
      return res.status(200).send({
        alertType: "success",
        alert: "true",
        message: "Login successful...",
        loaderBg: '#f96868'
      });
    } else {
      return res.status(200).send({
        alertType: "warning",
        alert: "true",
        message: "Email or Password Invalid",
        loaderBg: '#57c7d4'
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      alertType: "error",
      alert: "true",
      message: "An error occurred. Please try again later.",
      loaderBg: '#ff0000'
    });
  }
}); //adw

app.post('/api/register', async (req, res) => {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);

  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let userID = "MC" + String(Math.floor(Math.random() * 99999));
  
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    sponsorID: req.body.sponsorID,
    userID: userID,
    status: "Idle",
    earnings: {
      compoundIncome: 0,
      weeklySalary: 0,
      totalIncome: 0,
      directIncome: 0,
      levelIncome: 0,
      teamBuilder: 0,
      addition: 0,
      addition2: 0,
      availableBalance: 0
    },
    compound:{
      active: 0,
      totalCompound: 0,
      interest: 0,
      total: 0,
      days: 0
    },
    time: `${date}/${month}/${year}`,
    history: [],
    transaction: []
  });

  try {
    let foundUser = await User.findOne({ userID: userID });
    while (foundUser) {
      userID = "MC" + String(Math.floor(Math.random() * 99999));
      foundUser = await User.findOne({ userID: userID });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      const alertType = "warning";
      const alert = "true";
      const message = "The Email is already registered, Kindly login";
      const loaderBg = '#57c7d4';
      return res.status(200).send({ alertType, alert, message, loaderBg });
    }

    if (req.body.password !== req.body.confirmPassword) {
      const alertType = "warning";
      const alert = "true";
      const message = "Password did not match";
      const loaderBg = '#57c7d4';
      return res.status(200).send({ alertType, alert, message, loaderBg });
    }

    await newUser.save();
    const alertType = "success";
    const alert = "true";
    const loaderBg = '#f96868';
    const message = "Successfully created your Account";
    res.status(200).send({ alertType, alert, message, loaderBg });

  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});
 //adw

app.post("/api/bankDetails", async function(req, res) {
  if (!req.session.user) {
    return res.status(200).send({ redirect: true });
  }

  const bankDetails = {
    name: req.body.holdersName,
    accountNumber: req.body.accountNumber,
    bankName: req.body.bankName,
    ifsc: req.body.ifsc
  };

  try {
    await User.updateOne(
      { email: req.session.user.email },
      { $set: { bankDetails: bankDetails } }
    );

    const foundUser = await User.findOne({ email: req.session.user.email });

    res.status(200).send({
      alertType: "success",
      alert: "true",
      message: "Bank details updated successfully",
      loaderBg: '#f96868'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to update or retrieve bank details" });
  }
});

app.post('/reviewCompounding', async (req, res) =>{
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    try{
      const foundUser = await User.findOne({email:req.body.email});
      const percentageUpdating = {
        active: foundUser.compound.active,
        total: foundUser.compound.total,
        interest: foundUser.compound.interest,
        days: foundUser.compound.days,
        percentage: Number(req.body.compounding)
      }
      await User.updateOne({email:foundUser.email}, {$set:{compound:percentageUpdating}});
      await User.updateOne({email:foundUser.email}, {$set:{status:'Active'}});
      

      res.redirect('/admin');

    }catch(err){
      console.log(err);
    }
  }
})

app.post('/api/bank', async (req, res)=>{
  if (!req.session.user) {
    return res.status(200).send({ redirect: true });
  }else{
    try{
      const foundUser = await User.findOne({ email: req.session.user.email });
      if(!foundUser.bankDetails){
          res.status(200).send({bank:"Not provided"});
      }else{
          res.status(200).send({bank:'exist', bankDetails:foundUser.bankDetails});
      }
    }catch(err){

    }
  }
})

app.post("/api/paymentVerification", async function(req, res) {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);

  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;

  if (!req.session.user) {
    res.status(200).send({ redirect: true });
  } else {
    if (req.body.amount === "" || req.body.trnxId === "") {
      const alertType = "warning";
      const alert = "true";
      const loaderBg = '#57c7d4';
      const message = "Kindly fill all the given details";
      res.status(200).send({ alertType, alert, message, loaderBg });
    } else {
      try {
        const duplicate = await Payment.findOne({ trnxId: req.body.trnxId });
        if (duplicate) {
          const alertType = "warning";
          const alert = "true";
          const loaderBg = '#57c7d4';
          const message = "Transaction already exists";
          res.status(200).send({ alertType, alert, message, loaderBg });
        } else {
          const foundUser = await User.findOne({ email: req.session.user.email });
          if (foundUser) {
            const foundAdmin = await Admin.findOne({ email: process.env.ADMIN });
            const newPayment = {
              trnxId: req.body.trnxId,
              email: foundUser.email,
              amount: req.body.amount,
              username: foundUser.username,
              time: {
                date: date,
                month: month,
                year: year,
                minutes: minutes,
                hour: hour
              }
            };

            if (!foundAdmin) {
              const admin = new Admin({
                email: process.env.ADMIN,
                payment: [],
                withdrawal: []
              });
              await admin.save();

              await Admin.updateOne({ email: process.env.ADMIN }, { $set: { payment: [newPayment] } });
            } else {
              let pendingPayments = foundAdmin.payment;
              pendingPayments.push(newPayment);
              await Admin.updateOne({ email: process.env.ADMIN }, { $set: { payment: pendingPayments } });
            }

            const newTransaction = {
              type: 'Credit',
              from: 'Compounding',
              amount: req.body.amount,
              status: 'Pending',
              time: {
                date: date,
                month: month,
                year: year
              },
              trnxId: req.body.trnxId
            };
            let history = foundUser.transaction;
            history.push(newTransaction);
            await User.updateOne({ email: foundUser.email }, { $set: { transaction: history } });

            const newPaymentSchema = new Payment(newPayment);
            await newPaymentSchema.save();

            const alertType = "success";
            const alert = "true";
            const loaderBg = '#f96868';
            const message = "Payment details submitted.";
            res.status(200).send({ alertType, alert, message, loaderBg });
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
});
 //mc

app.post("/qrData", async (req, res) =>{
 if(!req.session.admin){
   res.redirect('/adminLogin');
 }else{
   try {
     // Fetch data from MongoDB
     const data = await Data.findOne();
     if (!data) {
       const qr = new Data({
         text: "dummy@upiId"
       });
       qr.save();
       res.redirect('/admin');
     }else{
           
       //Update QR or UPI details
       Data.updateOne({}, {$set:{text:req.body.upi}}, function(err){
         if(err){
           console.log(err);
         }
       });
       res.redirect('/admin');
     }
     

   } catch (error) {
     console.log(error);
   }

 }
});

app.post("/api/paymentGateway", function(req, res){
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{
    User.findOne({email:req.session.user.email}, function(err, foundUser){
      if(err){
        console.log(err);
      }else{
        if(foundUser.task.status != "Inactive"){
          res.status(200).send({plan: "Already enrolled"});
        }else{
          const amount = req.body.amount;
          const tier = req.body.tier;
          res.status(200).send({amount:amount, tier:tier,plan: "Not enrolled"});

        }
      }
    });
  }
});

app.post("/api/withdrawal", function(req, res){
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;
  if(!req.session.user){
    res.status(200).send({redirect:true});
  }else{
      User.findOne({email: req.session.user.email}, function(err, foundUser){
        if(err){
          console.log(err);
        }else{
            const newValue =  foundUser.earnings.availableBalance - Number(req.body.amount);
            //Minimum Withdrawal
            if(req.body.amount<149){
              const alertType = "warning";
              const alert = "true"
              const message = "Entered amount is less than Minimum withdraw"
              res.status(200).send({alertType:alertType, alert:alert, message:message,
              name: foundUser.username,
              email: foundUser.email,
              sponsorID: foundUser.sponsorID,
              availableBalance: foundUser.earnings.availableBalance
            });
          }  else{
            //lOW BALANCE
            if(foundUser.earnings.availableBalance < req.body.amount){
              const alertType = "warning";
              const alert = "true"
              const message = "Low balance!!"

              res.status(200).send({alertType:alertType, alert:alert, message:message,
                name: foundUser.username,
                email: foundUser.email,
                sponsorID: foundUser.sponsorID,
                availableBalance: foundUser.earnings.availableBalance
              });
            }else{
            //No Bank details
              if(!foundUser.bankDetails){
                const alertType = "warning";
                const alert = "true"
                const message = "Fill in you Bank Details to proceed"

                res.status(200).send({alertType:alertType, alert:alert, message:message,
                  name: foundUser.username,
                  email: foundUser.email,
                  sponsorID: foundUser.sponsorID,
                  availableBalance: foundUser.earnings.availableBalance
                });
              }else{
                let limitReached = false;
                foundUser.transaction.forEach(function(transaction){
                  if(transaction.from == "Withdraw"){
                    if(transaction.status != 'Failed'){
                      if(transaction.time.date == date && transaction.time.month == month){
                        limitReached = true;
                      }
                    }
                  }
                });
                if(limitReached == true){
                  const alertType = "warning";
                  const alert = "true"
                  const message = "Daily Withdrawal limit reached"

                  res.status(200).send({alertType:alertType, alert:alert, message:message,
                    name: foundUser.username,
                    email: foundUser.email,
                    sponsorID: foundUser.sponsorID,
                    availableBalance: foundUser.earnings.availableBalance
                  });
                }else{
                //New balnce update
                User.updateOne({email: req.session.user.email},
                  {$set:
                    {earnings:
                      {
                      currentPackage: foundUser.earnings.currentPackage,
                      totalPackage: foundUser.earnings.totalPackage,
                      totalIncome: foundUser.earnings.totalIncome,
                      directIncome: foundUser.earnings.directIncome,
                      levelIncome: foundUser.earnings.levelIncome,
                      royalIncome: foundUser.earnings.royalIncome,
                      teamAch: foundUser.earnings.teamAch,
                      franchiseAch: foundUser.earnings.franchiseAch,
                      availableBalance: newValue
                      }}}, function(error){
                  if(error){
                    console.log(error);
                  }else{
                    const trnxID = "T" + String(Math.floor(Math.random()*999999999));
                    //History and Transaction add up
                    let history = foundUser.history;
                    let transaction = foundUser.transaction;
                    const newTransaction = {
                      type: 'Debit',
                      from: 'Withdraw',
                      amount: req.body.amount,
                      status: 'Pending',
                      time:{
                        date: date,
                        month: month,
                        year: year
                      },
                      trnxId: trnxID
                    }
                    transaction.push(newTransaction);

                    User.updateOne({email: req.session.user.email}, {$set:{transaction:transaction}}, function(error){
                      if(error){
                        console.log(error);
                      }
                    });

                    Admin.findOne({email:process.env.ADMIN}, function(err, foundAdmin){
                      if(err){
                        console.log(err);
                      }else{
                        let withdrawal = foundAdmin.withdrawal;
                        const newWithdrawal = {
                          trnxId: trnxID,
                          amount: req.body.amount,
                          email: foundUser.email,
                          username: foundUser.username,
                          time:{
                            date: date,
                            month: month,
                            year: foundUser.bankDetails.bankName,
                            minutes: foundUser.bankDetails.accountNumber,
                            hour: foundUser.bankDetails.ifsc
                          }
                        }
                        withdrawal.push(newWithdrawal);
                        Admin.updateOne({email:process.env.ADMIN}, {$set:{withdrawal:withdrawal}}, function(err){
                          if(err){
                            console.log(err);
                          }
                        });
                      }
                    });
                    const alert = 'true';
                    const alertType = 'success';
                    const message = 'Withdrawal Success'

                    res.status(200).send({
                      alert:alert,
                      alertType:alertType,
                      message:message,
                      availableBalance: newValue
                    });
                  }
                });
                }
              }
            }
          }
        }

      });
  }

});

app.post('/planActivation', async (req, res) => {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);

  const year = currentTimeInTimeZone.year;
  const month = currentTimeInTimeZone.month;
  const date = currentTimeInTimeZone.day;
  const hour = currentTimeInTimeZone.hour;
  const minutes = currentTimeInTimeZone.minute;

  if (!req.session.admin) {
    res.redirect('/adminLogin');
  } else {
    const amount = Number(req.body.amount);
    const trnxId = Number(req.body.trnxId);
    const directPercentage = Number(req.body.directPercentage); 

    try {
      const foundUser = await User.findOne({ email: req.body.email });
      if (foundUser) {
        const foundAdmin = await Admin.findOne({ email: process.env.ADMIN });
        if (foundAdmin) {
          const foundPayment = await Payment.findOne({ trnxId: req.body.trnxId });

          const pendingPayments = foundAdmin.payment.filter(payment => payment.trnxId !== req.body.trnxId);

          await Admin.updateOne({ email: process.env.ADMIN }, { $set: { payment: pendingPayments } });

          if (req.body.approval === "false") {
            // Handle payment failure
            await Payment.updateOne({ trnxId: req.body.trnxId }, { $set: { trnxId: 'Failed transaction - ' + req.body.trnxId } });

            const updatedTransaction = foundUser.transaction.map(transaction => {
              if (transaction.trnxId === req.body.trnxId) {
                const modifiedTransaction = {
                  time: transaction.time,
                  type: transaction.type,
                  from: transaction.from,
                  amount: transaction.amount,
                  status: 'failed',
                  trnxId: transaction.trnxId,
                  _id: transaction._id
                };
                return modifiedTransaction;
              }
              return transaction;
            });
            
            
            try {
              const updateResult = await User.updateOne(
                { email: req.body.email },
                { $set: { transaction: updatedTransaction } }
              );
            } catch (error) {
              console.error("Error updating transaction:", error);
            }
            
            
            
            

          } else {
            await User.updateOne({ email: foundUser.email }, {
              $set: {
                compound: {
                  active: amount,
                  interest: 0,
                  total: Number(foundUser.compound.total + amount),
                  days: Number(req.body.compounding)
                }
              }
            });
            
          await User.updateOne({ email: foundUser.email }, { $set: { status: "Review" } });

            const updatedTransaction = foundUser.transaction.map(transaction => {
              if (transaction.trnxId === req.body.trnxId) {
                const modifiedTransaction = {
                  time: transaction.time,
                  type: transaction.type,
                  from: transaction.from,
                  amount: transaction.amount,
                  status: 'success',
                  trnxId: transaction.trnxId,
                  _id: transaction._id
                };
                return modifiedTransaction;
              }
              return transaction;
            });
            
            
            try {
              const updateResult = await User.updateOne(
                { email: req.body.email },
                { $set: { transaction: updatedTransaction } }
              );
            } catch (error) {
              console.error("Error updating transaction:", error);
            }

            const foundSponsor = await User.findOne({ userID: foundUser.sponsorID });
            if (foundSponsor) {
              await User.updateOne({ email: foundSponsor.email }, {
                $set: {
                  earnings: {
                    compoundIncome: foundSponsor.earnings.compoundIncome,
                    weeklySalary: foundSponsor.earnings.weeklySalary,
                    totalIncome: foundSponsor.earnings.totalIncome + Math.floor(amount * directPercentage),
                    directIncome: foundSponsor.earnings.directIncome + Math.floor(amount * directPercentage),
                    levelIncome: foundSponsor.earnings.levelIncome,
                    teamBuilder: foundSponsor.earnings.teamBuilder,
                    addition: foundSponsor.earnings.addition,
                    addition2: foundSponsor.earnings.addition2,
                    availableBalance: foundSponsor.earnings.availableBalance + Math.floor(amount * directPercentage)
                  }
                }
              });

              const transaction = foundSponsor.transaction;

              const newTrnx = {
                type: 'Credit',
                from: 'Direct',
                amount: Math.floor(amount * directPercentage),
                status: 'success',
                trnxId: trnxId,
                time: {
                  date: date,
                  month: month,
                  year: year
                }
              };

              transaction.push(newTrnx);


              await User.updateOne({ email: foundSponsor.email }, { $set: { transaction: transaction } });

              // Level Income - 1st Level
              const level1 = await User.findOne({ userID: foundSponsor.sponsorID });
              if (level1) {
                await User.updateOne({ email: level1.email }, {
                  $set: {
                    earnings: {
                      compoundIncome: level1.earnings.compoundIncome,
                      weeklySalary: level1.earnings.weeklySalary,
                      totalIncome: level1.earnings.totalIncome + Math.floor(amount * 0.03),
                      directIncome: level1.earnings.directIncome,
                      levelIncome: level1.earnings.levelIncome + Math.floor(amount * 0.03),
                      teamBuilder: level1.earnings.teamBuilder,
                      addition: level1.earnings.addition,
                      addition2: level1.earnings.addition2,
                      availableBalance: level1.earnings.availableBalance + Math.floor(amount * 0.03)
                    }
                  }
                });

                const transaction = level1.transaction;
  
                const newTrnx = {
                  type: 'Credit',
                  from: 'Level - 1',
                  amount: Math.floor(amount * 0.03),
                  status: 'success',
                  trnxId: trnxId,
                  time: {
                    date: date,
                    month: month,
                    year: year
                  }
                };
  
                transaction.push(newTrnx);

                await User.updateOne({ email: level1.email }, { $set: { transaction: transaction } });

                // Level Income - 2nd Level
                const level2 = await User.findOne({ userID: level1.sponsorID });
                if (level2) {
                  await User.updateOne({ email: level2.email }, {
                    $set: {
                      earnings: {
                        compoundIncome: level2.earnings.compoundIncome,
                        weeklySalary: level2.earnings.weeklySalary,
                        totalIncome: level2.earnings.totalIncome + Math.floor(amount * 0.02),
                        directIncome: level2.earnings.directIncome,
                        levelIncome: level2.earnings.levelIncome + Math.floor(amount * 0.02),
                        teamBuilder: level2.earnings.teamBuilder,
                        addition: level2.earnings.addition,
                        addition2: level2.earnings.addition2,
                        availableBalance: level2.earnings.availableBalance + Math.floor(amount * 0.02)
                      }
                    }
                  });

                  const transaction = level2.transaction;
    
                  const newTrnx = {
                    type: 'Credit',
                    from: 'Level - 2',
                    amount: Math.floor(amount * 0.02),
                    status: 'success',
                    trnxId: trnxId,
                    time: {
                      date: date,
                      month: month,
                      year: year
                    }
                  };
    
                  transaction.push(newTrnx);
  
                  await User.updateOne({ email: level2.email }, { $set: { transaction: transaction } });

                  // Level Income - 3rd Level
                const level3 = await User.findOne({ userID: level2.sponsorID });
                if (level3) {
                  await User.updateOne({ email: level3.email }, {
                    $set: {
                      earnings: {
                        compoundIncome: level3.earnings.compoundIncome,
                        weeklySalary: level3.earnings.weeklySalary,
                        totalIncome: level3.earnings.totalIncome + Math.floor(amount * 0.01),
                        directIncome: level3.earnings.directIncome,
                        levelIncome: level3.earnings.levelIncome + Math.floor(amount * 0.01),
                        teamBuilder: level3.earnings.teamBuilder,
                        addition: level3.earnings.addition,
                        addition2: level3.earnings.addition2,
                        availableBalance: level3.earnings.availableBalance + Math.floor(amount * 0.01)
                      }
                    }
                  });

                  const transaction = level3.transaction;
    
                  const newTrnx = {
                    type: 'Credit',
                    from: 'Level - 3',
                    amount: Math.floor(amount * 0.01),
                    status: 'success',
                    trnxId: trnxId,
                    time: {
                      date: date,
                      month: month,
                      year: year
                    }
                  };
    
                  transaction.push(newTrnx);
  
                  await User.updateOne({ email: level3.email }, { $set: { transaction: transaction } });
                }
                }
              }
            }
          }
        }
      }
      res.redirect('/admin');
    } catch (err) {
      console.error(err);
    }
  }
});

app.post("/api/creditWithdrawal", function(req, res){
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;
  if(!req.session.admin){
    res.redirect('/adminLogin')
  }else{
    if(req.body.approval == 'true'){
    Admin.findOne({email:process.env.ADMIN}, function(err, foundAdmin){
      if(err){
        console.log(err);
      }else{
        User.findOne({email:req.body.email}, function(err, foundUser){
          if(err){
            console.log(err);
          }else{

            //Updating Transaction History Success
            let updatedTransaction = [];

            foundUser.transaction.forEach(function(transaction){
              if(transaction.trnxId == req.body.trnxId){
                const newTrnx = {
                  type: transaction.type,
                  from: transaction.from,
                  amount: transaction.amount,
                  status: 'Success',
                  time:{
                    date: transaction.time.date,
                    month: transaction.time.month,
                    year: transaction.time.year
                  },
                  trnxId: transaction.trnxId
                }
                updatedTransaction.push(newTrnx);
              }else{
                updatedTransaction.push(transaction);
              }
            });
            //Updating Transaction array for User
            User.updateOne({email:req.body.email}, {$set:{transaction:updatedTransaction}}, function(err){
              if(err){
                console.log(err);
              }
            });

            //Update admin array
            let updatedArray = [];

            foundAdmin.withdrawal.forEach(function(transaction){
              if(transaction.trnxId != req.body.trnxId){
                updatedArray.push(transaction);
              }
            });
            Admin.updateOne({email:process.env.ADMIN}, {$set:{withdrawal:updatedArray}}, function(err){
              if(err){
                console.log(err);
              }
            });

          }
        });
      }
    });
    }else{

      Admin.findOne({email:process.env.ADMIN}, function(err, foundAdmin){
        if(err){
          console.log(err);
        }else{
          User.findOne({email:req.body.email}, function(err, foundUser){
            if(err){
              console.log(err);
            }else{
              //Updating User balance

              User.updateOne({email: req.body.email}, {$set:{earnings: {
                currentPackage: foundUser.earnings.currentPackage,
                totalPackage: foundUser.earnings.totalPackage,
                totalIncome: foundUser.earnings.totalIncome,
                directIncome: foundUser.earnings.directIncome,
                levelIncome: foundUser.earnings.levelIncome,
                royalIncome: foundUser.earnings.royalIncome,
                teamAch: foundUser.earnings.teamAch,
                franchiseAch: foundUser.earnings.franchiseAch,
                availableBalance: foundUser.earnings.availableBalance + Math.floor(Number(req.body.amount))
              }}},function(err){
                if(err){
                  console.log(err);
                }
              });

              //Updating Transaction History Success
              let updatedTransaction = [];

              foundUser.transaction.forEach(function(transaction){
                if(transaction.trnxId == req.body.trnxId){
                  const newTrnx = {
                    type: transaction.type,
                    from: transaction.from,
                    amount: transaction.amount,
                    status: 'Failed',
                    time:{
                      date: transaction.time.date,
                      month: transaction.time.month,
                      year: transaction.time.year
                    },
                    trnxId: transaction.trnxId
                  }
                  updatedTransaction.push(newTrnx);
                }else{
                  updatedTransaction.push(transaction);
                }
              });
              //Updating Transaction array for User
              User.updateOne({email:req.body.email}, {$set:{transaction:updatedTransaction}}, function(err){
                if(err){
                  console.log(err);
                }
              });

              //Update admin array
              let updatedArray = [];

              foundAdmin.withdrawal.forEach(function(transaction){
                if(transaction.trnxId != req.body.trnxId){
                  updatedArray.push(transaction);
                }
              });
              Admin.updateOne({email:process.env.ADMIN}, {$set:{withdrawal:updatedArray}}, function(err){
                if(err){
                  console.log(err);
                }
              });

            }
          });
        }
      });
    }
    res.redirect('/admin');
  }
}); //wts


app.post("/franchiseAch", function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    Admin.findOne({email:process.env.ADMIN}, function(err, foundAdmin){
      if(err){
        console.log(err);
      }else{
        if(!foundAdmin){
          res.redirect('/adminLogin');
        }else{
          User.findOne({email:req.body.email}, function(err, foundUser){
           if(err){
             console.log(err);
           }else{
             //Update User Franchise balance
                      User.updateOne({email: req.body.email},
                        {$set:
                          {earnings:
                            {
                            currentPackage: foundUser.earnings.currentPackage,
                            totalPackage: foundUser.earnings.totalPackage,
                            totalIncome: foundUser.earnings.totalIncome + Number(req.body.amount),
                            directIncome: foundUser.earnings.directIncome,
                            levelIncome: foundUser.earnings.levelIncome,
                            royalIncome: foundUser.earnings.royalIncome,
                            teamAch: foundUser.earnings.teamAch,
                            franchiseAch: foundUser.earnings.franchiseAch + Number(req.body.amount),
                            availableBalance: foundUser.earnings.availableBalance + Number(req.body.amount)
                            }}}, function(error){
                        if(error){
                          console.log(error);
                        }else{
                          //History and Transaction add up
                          const trnxID = "T" + String(Math.floor(Math.random()*999999999));
                          let history = foundUser.history;
                          let transaction = foundUser.transaction;
                          const newTransaction = {
                            type: 'Credit',
                            from: 'Club Earnings',
                            amount: req.body.amount,
                            status: 'Success',
                            time:{
                              date: date,
                              month: month,
                              year: year
                            },
                            trnxId: trnxID
                          }
                          transaction.push(newTransaction);

                          User.updateOne({email: req.body.email}, {$set:{transaction:transaction}}, function(error){
                            if(error){
                              console.log(error);
                            }
                          });
                        }
                      });
             res.redirect('/admin');
           }
          })
        }
      }
    })
  }
});




app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000 | http://localhost:3000");
});
