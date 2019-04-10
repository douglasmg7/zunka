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
    // User.
    name: name
  },
  methods: {
    exit(){
      window.location.href = '/user/account';
    },
    save(){
      axios({
        method: 'post',
        url: `/user/access/edit-name`,
        headers: {'csrf-token' : csrfToken},
        data: { name: this.name }
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
