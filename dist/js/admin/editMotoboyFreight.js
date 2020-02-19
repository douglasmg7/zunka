'use strict';

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
        freight: freight,
        price: 0,
        maxWeight: 0,
    },
    created() {
        console.log(`freight: ${JSON.stringify(freight, null, 2)}`);
        // this.price = this.toReal(shippingPrice.price);
        // this.maxWeight = this.toKg(shippingPrice.maxWeight);
    },
    methods: {
        toReal(val) {
            return (val / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
        fromReal(val) {
            // console.log(`type of val: ${typeof val}`);
            // To a valid string number.
            // Regex remove all ',' but the last.
            val = val.replace('.', '').replace(/\,(?=[^,]*\,)/g, '').replace(',', '.');            
            val = parseFloat(val) * 100;
            val = parseInt(val);
            // console.log(`val: ${val}`);
            return val;
        },
        toKg(val) {
            return (val / 1000).toFixed(0);
        },
        toGrams(val) {
            return val * 1000;
        },
        // Set default address.
        save(){
            this.warnMessage = '';
            let headers = { 'csrf-token': csrfToken };
            let data = {
                region: shippingPrice.region,
                deadline: shippingPrice.deadline,
                maxWeight: this.toGrams(this.maxWeight),
                price: this.fromReal(this.price)
            };
            axios.post(`/admin/shipping/price/${this.shippingPrice._id}`, data, { headers: headers })
                .then(()=>{
                    window.location.href = '/admin/shipping/prices';
                })
                .catch((err)=>{
                    // System internal error.
                    if (err.response.status == 500) {
                        this.warnMessage = 'Alguma coisa deu errada :(';
                    } 
                    // Invalid form data.
                    else if (err.response.status = 422) {
                        console.log(JSON.stringify(err.response.data.erros[0], null, 2));
                        this.warnMessage = err.response.data.erros[0].msg;
                    }
                    else {
                        console.error(`save(). ${JSON.stringify(err, null, 2)}`);
                    }
                });
        },
        // Set default address.
        remove(){
            this.warnMessage = '';
            let headers = { 'csrf-token': csrfToken };
            axios.delete(`/admin/shipping/price/${this.shippingPrice._id}`, { headers: headers })
            .then(()=>{
                window.location.href = '/admin/shipping/prices';
            })
            .catch((err)=>{
                // System internal error.
                if (err.response.status == 500) {
                    this.warnMessage = 'Alguma coisa deu errada :(';
                } 
                // Invalid form data.
                else if (err.response.status = 422) {
                    console.log(JSON.stringify(err.response.data.erros[0], null, 2));
                    this.warnMessage = err.response.data.erros[0].msg;
                }
                else {
                    console.error(`delete(). ${JSON.stringify(err, null, 2)}`);
                }
            });
        }
    },
});