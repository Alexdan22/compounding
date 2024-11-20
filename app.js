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
const QRCode = require('qrcode');
const { log } = require('console');

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
const compoundLogSchema = new mongoose.Schema({
  interest: Number,
  compound: Number,
  time:{
    date: String,
    month: String,
    year: String
  }
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
const loanTransactionSchema = new mongoose.Schema({
  amount: Number,
      time: {
        date: String,
        month: String,
        year: String
      },
      type: String
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

  mobile:{
    type:Number,
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

  compoundLog: [compoundLogSchema],

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
});
const loanSchema = new mongoose.Schema({
  amount: Number,
  email: String,
  username: String,
  approval: String,
  aadhaar: Number,
  pan: String,
  mobile: Number,
  eligibility: {
    job: String,
    profession: String,
    income: String,
    loanAmount: Number
  },
  transaction: [loanTransactionSchema]
});

const qrDataSchema = new mongoose.Schema({ text: String });


userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

const Admin = new mongoose.model("Admin", adminSchema);

const Payment = new mongoose.model("Payment", paymentSchema);

const Data = new mongoose.model('Data', qrDataSchema);

const Loan = new mongoose.model('Loan', loanSchema);


//Automated Functions
var job = schedule.scheduleJob('0 1 * * *', async(scheduledTime) => {

  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);


  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;
  let hour = currentTimeInTimeZone.hour;
  let minutes = currentTimeInTimeZone.minute;
    try {
      
      const trnxID = String(Math.floor(Math.random()*999999999));
      const foundUsers = await User.find({});

      foundUsers.forEach(async (user) => {
        if (user.status === 'Active') {
          if (user.compound.days === 1) {
            // Handle to credit the compounding interest and reset the compound active to Idle

            const todaysInterest = Math.floor((user.compound.active + user.compound.interest) * user.compound.percentage);
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

              const compoundLog = user.compoundLog;

              const newcompoundLog = {
                interest: todaysInterest,
                compound: user.compound.active + user.compound.interest,
                time: {
                  date: date,
                  month: month,
                  year: year
                }
              };

              compoundLog.push(newcompoundLog);


              await User.updateOne({ email: user.email }, { $set: { compoundLog: compoundLog } });

          } else {
            // Handle for normal compounding
            const todaysInterest = Math.floor((user.compound.active + user.compound.interest) * user.compound.percentage);
            const updatedCompound = {
              active: user.compound.active,
              total: user.compound.total,
              days: user.compound.days - 1,
              interest: user.compound.interest + todaysInterest,
              percentage: user.compound.percentage
            };

            await User.updateOne({ email: user.email }, { $set: { compound: updatedCompound } });

            const compoundLog = user.compoundLog;

              const newcompoundLog = {
                interest: todaysInterest,
                compound: user.compound.active + user.compound.interest,
                time: {
                  date: date,
                  month: month,
                  year: year
                }
              };

              compoundLog.push(newcompoundLog);


              await User.updateOne({ email: user.email }, { $set: { compoundLog: compoundLog } });
          }
        }
      });

    } catch (err) {
      console.error(err);
    }
});


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

app.get("/register/:sponsorID", function(req, res){

  req.session.sponsorID = req.params.sponsorID;

  const alert = "false";
  const sponsor = 'true';
  const sponsorID = req.session.sponsorID;
  res.redirect('/register');
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  try {
    const foundUser = await User.findOne({ email: req.session.user.email });
    const foundLoan = await Loan.findOne({email: req.session.user.email});
    
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
      loan: foundLoan,
      current: compound.active + compound.interest,
      transaction: foundUser.compoundLog,
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
      sponsorID,
      mobile
    } = foundUser;


    const foundSponsor = await User.findOne({userID: sponsorID});


    if(!foundSponsor){
      //With no Registered Sponsor ID
      
      res.render('profile', {username, email, userID,status, mobile, sponsorID});
    }else{
      //With registered sponsor ID
        res.render('profile', {username, email, userID,status, mobile,sponsorName:foundSponsor.username, sponsorID});
    }

  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred. Please try again later.");
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

app.get("/withdrawal", async function(req, res) {
  if (!req.session.user) {
     res.redirect('/');
  }else{
    try {
      const foundUser = await User.findOne({ email: req.session.user.email });
      
      if (!foundUser) {
        return res.status(404).send("User not found");
      }
  
      const bankDetails = foundUser.bankDetails ? "Provided" : "Not provided";
      res.render('withdrawal', {
        name: foundUser.username,
        email: foundUser.email,
        bankDetails: bankDetails,
        availableBalance: foundUser.earnings.availableBalance,
        alert: 'nil'
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
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
      const foundLoan = await Loan.find({});
      
      const total = foundUsers.length;
      const current = foundUsers.filter(activeUsers => activeUsers.status === 'Active');
      const review = foundUsers.filter(reviewRequired => reviewRequired.status === 'Review');
      const pendingLoan = foundLoan.filter(pending => pending.approval === 'Pending')
      const currentUsers = current.length;

      
      res.render("admin", {
        total,
        currentUsers,
        pendingApproval: foundAdmin.payment.length,
        pendingWithdraw: foundAdmin.withdrawal.length,
        pendingLoan,
        payment: foundAdmin.payment,
        review,
        withdrawal: foundAdmin.withdrawal
      });
      
    } catch (err) {
      console.log(err);
    }
  }
});

app.get("/teamLevel", async (req, res) =>{
  if(!req.session.user){
    res.redirect('/');
  }else{
    try{
      const foundUser = await User.findOne({email:req.session.user.email});
      const direct = await User.find({sponsorID:foundUser.userID});
      const level1 = [];
      const level2 = [];
      const level3 = [];
      const level4 = [];
      const level5 = [];

      direct.forEach(async(user)=>{
       const foundLevel1 = await User.find({sponsorID:user.userID});

       Array.prototype.push.apply(level1, foundLevel1);
      });

      level1.forEach(async(user)=>{
        const foundLevel2 = await User.find({sponsorID:user.userID});
 
        Array.prototype.push.apply(level2, foundLevel2);
       });

       level2.forEach(async(user)=>{
        const foundLevel3 = await User.find({sponsorID:user.userID});
 
        Array.prototype.push.apply(level3, foundLevel3);
       });

       level3.forEach(async(user)=>{
         const foundLevel4 = await User.find({sponsorID:user.userID});
  
         Array.prototype.push.apply(level4, foundLevel4);
        });
 
        level4.forEach(async(user)=>{
         const foundLevel5 = await User.find({sponsorID:user.userID});
  
         Array.prototype.push.apply(level5, foundLevel5);
        });
        
        const total = direct + level1 + level2 + level3 + level4 + level5;

    }catch(err){
      console.log(err)
    }
  }
});

app.get("/current", async function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    try {
      const foundUser = await User.find({});
      let current = [];
        foundUser.forEach(function(user){
          if(user.status == 'Active'){
            current.push(user);
          }
        });
        res.render('users', {
          current
        });
    } catch (err) {
      console.log(err)
    }
  }
});

app.get("/totalUsers", async function(req, res){
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    try {
      const foundUser = await User.find({});

      res.render('users', {
        current: foundUser
      });
    } catch (err) {
      console.log(err)
    }
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

app.get('/downline', async (req, res) => {
  if (!req.session.user) {
    return res.status(200).send({ redirect: true });
  }else{
    try {
      const foundUser = await User.findOne({ email: req.session.user.email });
      
      const foundDirect = await User.find({sponsorID: foundUser.userID});
      let level1Downline = [];
      let level2Downline = [];
      let level3Downline = [];
      let level4Downline = [];
      let level5Downline = [];
      let level6Downline = [];
      let totalDownline =[];
      
      // Helper function to get downline members
      async function getDownline(sponsorID) {
        return await User.find({ sponsorID });
      }
      
      // Helper function to handle downline level
      async function handleDownline(currentLevel) {
        const nextLevel = [];
        await Promise.all(currentLevel.map(async (user) => {
          const downline = await getDownline(user.userID);
          nextLevel.push(...downline);
        }));
        return nextLevel;
      }
      
      async function calculateDownlines() {
        // Level 1 Downline
        level1Downline = await handleDownline(foundDirect);
      
        // Level 2 Downline
        level2Downline = await handleDownline(level1Downline);
      
        // Level 3 Downline
        level3Downline = await handleDownline(level2Downline);
      
        // Level 4 Downline
        level4Downline = await handleDownline(level3Downline);
      
        // Level 5 Downline
        level5Downline = await handleDownline(level4Downline);
        
        // Level 6 Downline
        level6Downline = await handleDownline(level5Downline);
      
      // Combine all downlines into totalDownline 
        totalDownline = [ 
          ...foundDirect, 
          ...level1Downline, 
          ...level2Downline, 
          ...level3Downline, 
          ...level4Downline, 
          ...level5Downline, 
          ...level6Downline 
        ];
        return totalDownline;
      }
      
      // Call the function to calculate downlines
      
      totalDownline = await calculateDownlines();
      const totalActive = totalDownline.filter(activeUsers => activeUsers.status === 'Active');
        
        const downlines = await User.find({ sponsorID: foundUser.userID });
        const current = downlines.filter(activeUsers => activeUsers.status === 'Active');
        res.status(200).send({ downlines, total:totalDownline.length, active:totalActive.length });
  
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
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
});

app.post('/userPanel', async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/adminLogin');
  }

  try {
    const { type, input } = req.body;
    const foundUser = type === "email" 
      ? await User.findOne({ email: input }) 
      : await User.findOne({ userID: input });

    if (!foundUser) {
      return res.redirect('/admin');
    }

    req.session.user = { email: foundUser.email };
    res.redirect("/dashboard");

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

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
});

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
    mobile: req.body.mobile,
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

    }else if (req.body.password !== req.body.confirmPassword) {
      const alertType = "warning";
      const alert = "true";
      const message = "Password did not match";
      const loaderBg = '#57c7d4';
      return res.status(200).send({ alertType, alert, message, loaderBg });

    }else if(String(req.body.mobile).length != 10){
      const alertType = "warning";
      const alert = "true";
      const message = "Invalid Mobile number";
      const loaderBg = '#57c7d4';
      return res.status(200).send({ alertType, alert, message, loaderBg });

    }else{

      await newUser.save();
      const alertType = "success";
      const alert = "true";
      const loaderBg = '#f96868';
      const message = "Successfully created your Account";
      res.status(200).send({ alertType, alert, message, loaderBg });
    }

  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

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
});

app.post('/transferToWallet', async (req, res) =>{
  if(!req.session.user){
    res.redirect('/');
  }else{
    try{
      const foundUser = await User.findOne({email: req.session.user.email});

      if(foundUser.compound.interest == 0){
        const alertType = "warning";
          const alert = "true";
          const loaderBg = '#57c7d4';
          const message = "Transfer failed";
          res.status(200).send({ alertType, alert, message, loaderBg });

      }else{
        
        if(foundUser.compound.interest < Number(req.body.amount)){
          const alertType = "warning";
          const alert = "true";
          const loaderBg = '#57c7d4';
          const message = "Low balance";
          res.status(200).send({ alertType, alert, message, loaderBg });
        }else{

          await User.updateOne({email:foundUser.email}, {$set:{compound:{
            active: foundUser.compound.active,
            total: foundUser.compound.total,
            interest: foundUser.compound.interest - Number(req.body.amount),
            days: foundUser.compound.days,
            percentage: foundUser.compound.percentage
          }}});

          await User.updateOne({ email: foundUser.email }, {
            $set: {
              earnings: {
                compoundIncome: foundUser.earnings.compoundIncome + Number(req.body.amount),
                weeklySalary: foundUser.earnings.weeklySalary,
                totalIncome: foundUser.earnings.totalIncome + Number(req.body.amount),
                directIncome: foundUser.earnings.directIncome,
                levelIncome: foundUser.earnings.levelIncome,
                teamBuilder: foundUser.earnings.teamBuilder,
                addition: foundUser.earnings.addition,
                addition2: foundUser.earnings.addition2,
                availableBalance: foundUser.earnings.availableBalance + Number(req.body.amount)
              }
            }
          });
      
          const trnxID = String(Math.floor(Math.random() * 999999999));
      
          const newTransaction = {
            type: 'Credit',
            from: 'Transfer',
            amount: req.body.amount,
            status: 'success',
            time: { date, month, year },
            trnxId: trnxID
          };
      
          await User.updateOne({ email: req.session.user.email }, {
            $push: { transaction: newTransaction }
          });
          const alertType = "success";
          const alert = "true";
          const loaderBg = '#f96868';
          const message = "Transferred interest successfully";
          res.status(200).send({ alertType, alert, message, loaderBg });
      
        }
      }
    }catch(err){
      console.log(err);
    }
  }
});

app.post('/creditCustom', async (req, res)=>{
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);

  let year = currentTimeInTimeZone.year;
  let month = currentTimeInTimeZone.month;
  let date = currentTimeInTimeZone.day;


  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    try {
      console.log(req.body);
      
      const foundUser = await User.findOne({email:req.body.email});
      if(req.body.type == 'club'){
        await User.updateOne({ email: foundUser.email }, {
          $set: {
            earnings: {
              compoundIncome: foundUser.earnings.compoundIncome,
              weeklySalary: foundUser.earnings.weeklySalary + Number(req.body.amount),
              totalIncome: foundUser.earnings.totalIncome + Number(req.body.amount),
              directIncome: foundUser.earnings.directIncome,
              levelIncome: foundUser.earnings.levelIncome,
              teamBuilder: foundUser.earnings.teamBuilder,
              addition: foundUser.earnings.addition,
              addition2: foundUser.earnings.addition2,
              availableBalance: foundUser.earnings.availableBalance + Number(req.body.amount)
            }
          }
        });
    
        const trnxID = String(Math.floor(Math.random() * 9999999));
    
        const newTransaction = {
          type: 'Credit',
          from: 'Club Income',
          amount: req.body.amount,
          status: 'success',
          time: { date, month, year },
          trnxId: trnxID
        };
    
        await User.updateOne({ email: foundUser.email }, {
          $push: { transaction: newTransaction }
        });
      }
      if(req.body.type == 'team'){
        await User.updateOne({ email: foundUser.email }, {
          $set: {
            earnings: {
              compoundIncome: foundUser.earnings.compoundIncome,
              weeklySalary: foundUser.earnings.weeklySalary,
              totalIncome: foundUser.earnings.totalIncome + Number(req.body.amount),
              directIncome: foundUser.earnings.directIncome,
              levelIncome: foundUser.earnings.levelIncome,
              teamBuilder: foundUser.earnings.teamBuilder + Number(req.body.amount),
              addition: foundUser.earnings.addition,
              addition2: foundUser.earnings.addition2,
              availableBalance: foundUser.earnings.availableBalance + Number(req.body.amount)
            }
          }
        });
    
        const trnxID = String(Math.floor(Math.random() * 9999999));
    
        const newTransaction = {
          type: 'Credit',
          from: 'Team Bonus',
          amount: req.body.amount,
          status: 'success',
          time: { date, month, year },
          trnxId: trnxID
        };
    
        await User.updateOne({ email: foundUser.email }, {
          $push: { transaction: newTransaction }
        });        
      }
      if(req.body.type == 'loan'){
        
      }
      res.redirect('/admin');
    } catch (err) {
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
       await Data.updateOne({}, {$set:{text:req.body.upi}});
       res.redirect('/admin');
     }
     

   } catch (error) {
     console.log(error);
   }

 }
});

app.post("/api/withdrawal", async function(req, res) {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);
  const { year, month, day: date, hour, minute: minutes } = currentTimeInTimeZone;

  if (!req.session.user) {
    return res.status(200).send({ redirect: true });
  }else{

    try {
      const foundUser = await User.findOne({ email: req.session.user.email });
  
      if (!foundUser) {
        return res.status(404).send("User not found");
      }
  
      const newValue = foundUser.earnings.availableBalance - Number(req.body.amount);
  
      if (req.body.amount < 149) {
        return res.status(200).send({
          alertType : "warning",
          alert : "true",
          loaderBg : '#57c7d4',
          message: "Entered amount is less than Minimum withdraw",
          name: foundUser.username,
          email: foundUser.email,
          sponsorID: foundUser.sponsorID,
          availableBalance: foundUser.earnings.availableBalance
        });
      }else if (foundUser.earnings.availableBalance < req.body.amount) {
        return res.status(200).send({
          alertType : "warning",
          alert : "true",
          loaderBg : '#57c7d4',
          message: "Low balance!!",
          name: foundUser.username,
          email: foundUser.email,
          sponsorID: foundUser.sponsorID,
          availableBalance: foundUser.earnings.availableBalance
        });
      }else if (!foundUser.bankDetails) {
        return res.status(200).send({
          alertType : "warning",
          alert : "true",
          loaderBg : '#57c7d4',
          message: "Fill in you Bank Details to proceed",
          name: foundUser.username,
          email: foundUser.email,
          sponsorID: foundUser.sponsorID,
          availableBalance: foundUser.earnings.availableBalance
        });
      }
  
      let limitReached = false;
      foundUser.transaction.forEach(transaction => {
        if (transaction.from === "Withdraw" && transaction.status !== 'failed' &&
            transaction.time.date === date && transaction.time.month === month) {
          limitReached = true;
        }
      });
  
      if (limitReached) {
        return res.status(200).send({
          alertType: "warning",
          alert: "true",
          message: "Daily Withdrawal limit reached",
          name: foundUser.username,
          email: foundUser.email,
          sponsorID: foundUser.sponsorID,
          availableBalance: foundUser.earnings.availableBalance
        });
      }else{
  
        await User.updateOne({ email: req.session.user.email }, {
          $set: {
            earnings: {
              compoundIncome: foundUser.earnings.compoundIncome,
              weeklySalary: foundUser.earnings.weeklySalary,
              totalIncome: foundUser.earnings.totalIncome,
              directIncome: foundUser.earnings.directIncome,
              levelIncome: foundUser.earnings.levelIncome,
              teamBuilder: foundUser.earnings.teamBuilder,
              addition: foundUser.earnings.addition,
              addition2: foundUser.earnings.addition2,
              availableBalance: newValue
            }
          }
        });
    
        const trnxID = String(Math.floor(Math.random() * 999999999));
    
        const newTransaction = {
          type: 'Debit',
          from: 'Withdraw',
          amount: req.body.amount,
          status: 'Pending',
          time: { date, month, year },
          trnxId: trnxID
        };
    
        await User.updateOne({ email: req.session.user.email }, {
          $push: { transaction: newTransaction }
        });
    
        const foundAdmin = await Admin.findOne({ email: process.env.ADMIN });
    
        if (foundAdmin) {
          const newWithdrawal = {
            trnxId: trnxID,
            amount: req.body.amount,
            email: foundUser.email,
            username: foundUser.username,
            time: {
              date,
              month,
              year,
              minutes,
              hour
            }
          };
    
          await Admin.updateOne({ email: process.env.ADMIN }, {
            $push: { withdrawal: newWithdrawal }
          });
        }
    
        res.status(200).send({
          alertType: "success",
          alert: "true",
          loaderBg: '#f96868',
          message: 'Withdrawal Success',
          availableBalance: newValue
        });
      }
  
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
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

app.post("/api/creditWithdrawal", async function(req, res) {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);
  const { year, month, day: date, hour, minute: minutes } = currentTimeInTimeZone;

  if (!req.session.admin) {
    return res.redirect('/adminLogin');
  }

  try {
    const foundAdmin = await Admin.findOne({ email: process.env.ADMIN });
    if (!foundAdmin) {
      return res.status(404).send("Admin not found");
    }else{
      const foundUser = await User.findOne({ email: req.body.email });
      if (!foundUser) {
        return res.status(404).send("User not found");
      }else{
        
        if (req.body.approval === 'true') {
  
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
    
          let updatedArray = foundAdmin.withdrawal.filter(transaction => transaction.trnxId !== req.body.trnxId);
          await Admin.updateOne({ email: process.env.ADMIN }, { $set: { withdrawal: updatedArray } });
        } else {
          await User.updateOne({ email: req.body.email }, {
            $set: {
              earnings: {
                compoundIncome: foundUser.earnings.compoundIncome,
                weeklySalary: foundUser.earnings.weeklySalary,
                totalIncome: foundUser.earnings.totalIncome,
                directIncome: foundUser.earnings.directIncome,
                levelIncome: foundUser.earnings.levelIncome,
                teamBuilder: foundUser.earnings.teamBuilder,
                addition: foundUser.earnings.addition,
                addition2: foundUser.earnings.addition2,
                availableBalance: foundUser.earnings.availableBalance + Math.floor(Number(req.body.amount))
              }
            }
          });
    
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
            await User.updateOne(
              { email: req.body.email },
              { $set: { transaction: updatedTransaction } }
            );
          } catch (error) {
            console.error("Error updating transaction:", error);
          }
    
          let updatedArray = foundAdmin.withdrawal.filter(transaction => transaction.trnxId !== req.body.trnxId);
          await Admin.updateOne({ email: process.env.ADMIN }, { $set: { withdrawal: updatedArray } });
        }
      }
  
    }


    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/check-eligibility", async (req, res)=>{
  if(!req.session.user){
    res.redirect('/');
  }else{
    try {
      const foundUser = await User.findOne({email:req.session.user.email});

      //Save the User details to loan database 
      const {
        name,
        mobile,
        aadhaar,
        pan,
        job,
        profession,
        income,
        amount
      } = req.body;

      const aadhaarUser = await Loan.findOne({aadhaar:aadhaar});
      const panUser = await Loan.findOne({pan:pan});
      const mobileUser = await Loan.findOne({mobile:mobile});
      

      if(aadhaarUser || panUser || mobileUser ){
        //Application submitted already
        const alertType = "warning";
        const alert = "true";
        const loaderBg = '#57c7d4';
        const message = "The application already exist.";
        res.status(200).send({ alertType, alert, message, loaderBg });
      }else{
        const newLoan = new Loan ({
          email: foundUser.email,
          username: name,
          approval: 'Pending',
          aadhaar: aadhaar,
          pan: pan,
          mobile: mobile,
          eligibility:{
            job: job,
            profession: profession,
            income: income,
            loanAmount: amount
          }
        });
  
        newLoan.save();
  
        const alertType = "success";
        const alert = "true";
        const loaderBg = '#f96868';
        const message = "Loan request submitted successfully.";
        res.status(200).send({ alertType, alert, message, loaderBg });
      }

    } catch (err) {
      console.log();
    }
  }
});

app.post('/api/loanApproval', async (req, res)=>{
  if(!req.session.admin){
    res.redirect('/adminLogin');
  }else{
    try {
      const {
        email,
        approval,
        amount
      } = req.body;

      const foundAdmin = await Admin.findOne({email:process.env.ADMIN});
      const foundLoan = await Loan.findOne({email:email});
      const foundUser = await User.findOne({email:email});
      if (approval == 'true') {

        foundLoan.approval = 'true';
        foundLoan.amount = amount;
        await foundLoan.save();


        res.redirect('/admin');

      } else {

        foundLoan.approval = 'false';
        foundLoan.email = `${foundLoan.email} - Rejected`
        await foundLoan.save();


        res.redirect('/admin');
      }
    } catch (err) {
      console.log(err);
      
    }
  }
});

app.post('/api/loanCredit', async (req, res) => {
  const timeZone = 'Asia/Kolkata';
  const currentTimeInTimeZone = DateTime.now().setZone(timeZone);

  const year = currentTimeInTimeZone.year;
  const month = currentTimeInTimeZone.month;
  const date = currentTimeInTimeZone.day;

  if (!req.session.admin) {
    res.redirect('/adminLogin');
  } else {
    try {
      
      const foundLoan = await Loan.findOne({ email:req.body.email });
      if (foundLoan) {

        if (req.body.type === 'credit') {
          let newValue = Number(foundLoan.amount + Number(req.body.amount));
          foundLoan.amount = newValue;

          let newTransaction = {
            amount: Number(req.body.amount),
            time: {
              date: date,
              month: month,
              year: year
            },
            type: "Repayment"
          };
          foundLoan.transaction.push(newTransaction);

          await foundLoan.save();
        } else if (req.body.type === 'debit') {
          let newValue = Number(foundLoan.amount - Number(req.body.amount));
          foundLoan.amount = newValue;

          let newTransaction = {
            amount: Number(req.body.amount),
            time: {
              date: date,
              month: month,
              year: year
            },
            type: "Transferred"
          };
          foundLoan.transaction.push(newTransaction);

          await foundLoan.save();
        }
      } else {
      }
    } catch (err) {
      console.error('Error saving loan:', err);
    }
    res.redirect('/admin');
  }
});

app.post('/unsetBankDetails', async (req, res) => {
  if (!req.session.admin) {
    res.redirect('/adminLogin');
  } else {
    try {
      const foundUser = await User.findOne({ email: req.body.email });
      if (!foundUser) {
        return res.redirect('/admin');
      }

      if (req.body.validation === "CONFIRM") {
        await User.updateOne({ email: req.body.email }, { $unset: { bankDetails: 1 } });
      }

      res.redirect('/admin');
    } catch (err) {
      console.error(err);
      res.redirect('/admin');
    }
  }
});





app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000 | http://localhost:3000");
});
