// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Warn message.
    warnMessage: '',
    // Password.
    oldPassword: '',
    // New password.
    newPassword: '',
    // New password confirmation.
    newPasswordConfirm: ''
  },
  methods: {
    save(){
      axios({
        method: 'post',
        url: `/user/access/edit-password`,
        headers: {'csrf-token' : csrfToken},
        data: { oldPassword: this.oldPassword, newPassword: this.newPassword, newPasswordConfirm: this.newPasswordConfirm }
      })
      .then((res)=>{
        // Successful change the name.
        if (res.data.success) {
          window.location.href = '/user/access';
        }
        // Something wrong.
        else
        {
          this.warnMessage = res.data.message;
        }
      })
      .catch((err)=>{
        console.error(`Error, err: ${err}`);
      });
    }
  },
});  