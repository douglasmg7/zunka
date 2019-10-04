'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
    el: '#app',
    data: {
        warnMessage: '',
        isNewShippingPrice: isNewShippingPrice,
        shippingPrice: shippingPrice
    },
    methods: {
        // Set default address.
        saveShippingPrice(shippingPriceId){
            axios({
                method: 'post',
                url: `/admin/shipping/price/edit`,
                headers: {'csrf-token' : csrfToken},
                data: { shippingPrice: this.shippingPrice },
                params: { isNewShippingPrice: isNewShippingPrice }
            })
            .then((res)=>{
                // Successful set address as default.
                if (res.data.success) {
                    console.log('success');
                    // window.location.href = '/user/address';
                }
                // Something wrong.
                else
                {
                    console.log('error');
                    this.warnMessage = res.data.message;
                }
            })
            .catch((err)=>{
                // System internal error.
                if (err.response.status == 500) {
                    this.warnMessage = err.response.data;
                } 
                // Invalid form data.
                else if (err.response.status = 422) {
                    console.log(JSON.stringify(err.response.data.erros[0], null, 2));
                    this.warnMessage = err.response.data.erros[0].msg;
                }
                else {
                    console.error(`Error saveShippingPrice(). ${JSON.stringify(err, null, 2)}`);
                }
            });
        }
    },
});