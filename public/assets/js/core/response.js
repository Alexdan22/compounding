const bank = function(){
    $.ajax({
        url: "/api/bank",
        data:{
          bank:"required"
        },
        type: "POST",
        success:function(data){
            const billing = document.getElementById('billing_details');
            if(data.bank == "Not provided"){

                billing.innerHTML = `
                                        <div class="col-md-6 grid-margin stretch-card">
                                            <div class="card">
                                            <div class="card-body">
                                                <h4 class="card-title">Enter Bank details</h4>
                                                <form class="forms-sample material-form">
                                                <div class="form-group">
                                                    <input type="text" id="holdersName" name="holdersName" required="required" />
                                                    <label for="input" class="control-label">Account holder's Name</label><i class="bar"></i>
                                                </div>
                                                <div class="form-group">
                                                    <input type="text" id="accountNumber" name="accountNumber" required="required" />
                                                    <label for="input" class="control-label">Account number</label><i class="bar"></i>
                                                </div>
                                                <div class="form-group">
                                                    <input type="text" required="required" id="ifsc" name="ifsc" />
                                                    <label for="input" class="control-label">IFSC code</label><i class="bar"></i>
                                                </div>
                                                <div class="form-group">
                                                    <input type="text" required="required" id="bankName" name="bankName" />
                                                    <label for="input" class="control-label">Bank name</label><i class="bar"></i>
                                                </div>
                                                <div class="button-container">
                                                    <button type="button" onclick="bankDetails()" class="button btn-primary"><span>Submit</span></button>
                                                </div>
                                                </form>
                                            </div>
                                            </div>
                                        </div>`
            }else{
                const details = data.bankDetails;
              billing.innerHTML = `
                      <div class="row">
                        <div class="col-lg-4">
                          <div class="border-bottom text-center pb-4">
                            <div class="mb-3 mt-3">
                              <h5>Billing Details</h5>
                            </div>
                          </div>
                          <div class="py-4">
                            <p class="clearfix">
                              <span class="float-start">
                                Bank Holder Name
                              </span>
                              <span class="float-end text-muted">
                                `+details.name+`
                              </span>
                            </p>
                            <p class="clearfix">
                              <span class="float-start">
                                Account Number
                              </span>
                              <span class="float-end text-muted">
                                `+details.accountNumber+`
                              </span>
                            </p>
                            <p class="clearfix">
                              <span class="float-start">
                                IFSC Code
                              </span>
                              <span class="float-end text-muted">
                                `+details.ifsc+`
                              </span>
                            </p>
                            <p class="clearfix">
                              <span class="float-start">
                                Bank name
                              </span>
                              <span class="float-end text-muted">
                                `+details.bankName+`
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>`
            }
        },
        error: function(status, error){
          console.log('Error: ' + error.message);
        }
      });
}