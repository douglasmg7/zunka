'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Warn message.
    warnMessage: '',
    // // Success message.
    // successMessage: successMessage,
    // Reset password token.
    resetPasswordToken: resetPasswordToken,
    // Password.
    password: '',
    // Password confirmation.
    passwordConfirm: ''
  },
  methods: {
    // Get products.
    resetPassword(){
      axios({
        method: 'post',
        url: `/user/reset-password/${this.resetPasswordToken}`,
        headers: {'csrf-token' : csrfToken},
        data: {password: this.password, passwordConfirm: this.passwordConfirm}
      })
      .then((res)=>{
        console.log(res.data);
        // Password reseted successful.
        if (res.data.success) {
          this.warnMessage = '';
          window.location.href = '/user/signin';
        }
        // Password not reseted.
        else {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error - resetPassword(), err: ${err}`);
      });
    }
  } 
});
