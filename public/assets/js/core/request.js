//Login form validation and handler
const loginUser = function(){
    userEmail = document.getElementById('userEmail').value;
    userPassword = document.getElementById('userPassword').value;
    if (userEmail == "" || userPassword == "") {
      demo.showNotification('bottom','center', 'warning', 'Enter email and password');
    }else{
      $.ajax({
        url: '/api/login',
        // dataType: "jsonp",
        data: {
          email: document.getElementById("userEmail").value,
          password: document.getElementById("userPassword").value
        },
        type: 'POST',
        success: function (data) {
          console.log(data);
          if(data.alert == 'true'){
            'use strict';
              resetToastPosition();
              $.toast({
                heading: data.alertType,
                text: data.message,
                showHideTransition: 'slide',
                icon: data.alertType,
                loaderBg: data.loaderBg,
                position: 'top-center'
              })
          }
          if(data.alertType == 'success'){
            dashboard2000();
          }
        },
        error: function (status, error) {
          console.log('Error: ' + error.message);
        }
      });
    }
}


//Register form validation and handler
const registerUser = function(){
    username = document.getElementById('username').value;
    email = document.getElementById('email').value;
    password = document.getElementById('password').value;
    confirmPassword = document.getElementById('confirmPassword').value;
    sponsorID = document.getElementById('sponsorID').value;
    checkbox = document.getElementById('checkbox');
  
    if (email == "" || password == "" || confirmPassword == "" || sponsorID == "" || username == "") {
        'use strict';
        resetToastPosition();
        $.toast({
          heading: '',
          text: 'Kindly fill in all the details in their provided columns',
          showHideTransition: 'slide',
          icon: 'warning',
          loaderBg: '#f96868',
          position: 'top-center'
        });
    }else{
      if(checkbox.checked){
        $.ajax({
          url: '/api/register',
          // dataType: "jsonp",
          data: {
            email: email,
            password: password,
            username: username,
            confirmPassword: confirmPassword,
            sponsorID: sponsorID
          },
          type: 'POST',
          success: function (data) {
            if(data.alert == 'true'){
              'use strict';
              resetToastPosition();
              $.toast({
                heading: data.alertType,
                text: data.message,
                showHideTransition: 'slide',
                icon: data.alertType,
                loaderBg: data.loaderBg,
                position: 'top-center'
              })
            }
            if(data.alertType == 'success'){
              login2000();
            }
          },
          error: function (status, error) {
            console.log('Error: ' + error.message);
          },
        });

      }else{
         'use strict';
        resetToastPosition();
        $.toast({
          heading: '',
          text: 'Kindly agree to the terms and conditions',
          showHideTransition: 'slide',
          icon: 'error',
          loaderBg: '#f2a654',
          position: 'top-center'
        });
      }
    }
}


//Bank details updation form
const bankDetails = function(){
  holdersName = document.getElementById('holdersName').value
  accountNumber = document.getElementById('accountNumber').value
  bankName = document.getElementById('bankName').value
  ifsc = document.getElementById('ifsc').value

  $.ajax({
    url: '/api/bankDetails',
    // dataType: "jsonp",
    data: {
      holdersName: holdersName,
      accountNumber: accountNumber,
      bankName: bankName,
      ifsc: ifsc
    },
    type: 'POST',
    success: function (data) {
      if( data.redirect == undefined){

      }else{
        login2000();
      }
      if(data.alert == 'true'){
        'use strict';
          resetToastPosition();
          $.toast({
            heading: data.alertType,
            text: data.message,
            showHideTransition: 'slide',
            icon: data.alertType,
            loaderBg: data.loaderBg,
            position: 'top-center'
          })
      }
      if(data.alertType == 'success'){
        dashboard2000();
      }
    },
    error: function (status, error) {
      console.log('Error: ' + error.message);
    },
  });


}


//Payment verification
const paymentVerification = function(){

  amount = document.getElementById('amount').value
  trnxId = document.getElementById('trnxId').value
  $.ajax({
    url: '/api/paymentVerification',
    // dataType: "jsonp",
    data: {
      amount: amount,
      trnxId: trnxId
    },
    type: 'POST',
    success: function (data) {
      if( data.redirect == undefined){
        if(data.alert == 'true'){
          'use strict';
            resetToastPosition();
            $.toast({
              heading: data.alertType,
              text: data.message,
              showHideTransition: 'slide',
              icon: data.alertType,
              loaderBg: data.loaderBg,
              position: 'top-center'
            })
        }
        if(data.alertType == 'success'){
         dashboard2000();
        }
      }else{
        login2000();
      }

    },
    error: function (status, error) {
      console.log('Error: ' + error.message);
    }
  });
}


//Withdraw button handler
const withdraw = function(){
  amount = document.getElementById('amount').value
  $.ajax({
    url: '/api/withdrawal',
    // dataType: "jsonp",
    data: {
      amount: amount
    },
    type: 'POST',
    success: function (data) {
      if( data.redirect == undefined){
        const availableBalance = function(){
          if(data.alert == 'true'){
            'use strict';
              resetToastPosition();
              $.toast({
                heading: data.alertType,
                text: data.message,
                showHideTransition: 'slide',
                icon: data.alertType,
                loaderBg: data.loaderBg,
                position: 'top-center'
              })
          }
          document.getElementById('availableBalance').innerHTML = data.availableBalance
        }
        $( document ).ready(function() {
            availableBalance();
        });
      }else{
        login2000();
      }
    },
    error: function (status, error) {
        console.log('Error: ' + error.message);
    },
  });
}


//Withdraw button handler
const transferToWallet = function(){
  amount = document.getElementById('amount').value
  $.ajax({
    url: '/transferToWallet',
    // dataType: "jsonp",
    data: {
      amount: amount
    },
    type: 'POST',
    success: function (data) {
      if( data.redirect == undefined){
        if(data.alert == 'true'){
          'use strict';
            resetToastPosition();
            $.toast({
              heading: data.alertType,
              text: data.message,
              showHideTransition: 'slide',
              icon: data.alertType,
              loaderBg: data.loaderBg,
              position: 'top-center'
            });
        }
        if(data.alertType == 'success'){
          dashboard2000();
        }
        
      }else{
        login2000();
      }
    },
    error: function (status, error) {
        console.log('Error: ' + error.message);
    },
  });
}
    






var dashboard2000 = function(){
  setTimeout(function () {
    window.location.href = "/dashboard";
  }, 2000);
}
var login2000 = function(){
  setTimeout(function () {
    window.location.href = "/";
  }, 2000);
}
