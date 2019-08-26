'use strict';

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
let app = new Vue({
	el: '#app',
	data: {
		order: order
	},
	created() {
		// console.log(`env: ${env}`);
	},
	methods: {
		// Confirm payment, called onAuthorize paypal button.
		// confirmPayment(payment){
			// axios({
				// method: 'post',
				// url: window.location.href,
				// headers:{'csrf-token' : csrfToken},
				// data: { payment: payment },
				// params: { method: 'paypal'}
			// })
			// .then(response => {
				// // Correio answer.
				// if (response.data.err) {
					// console.log(response.data.err);
				// } else {
					// window.location.href = `/checkout/order-confirmation/${order._id}`
				// }
			// })
			// .catch(err => {
				// console.error(err);
			// }) 
		// },
		// Close de order.
		closeOrder(){
			axios({
				method: 'post',
				url: `/checkout/close/order/${order._id}`,
				headers:{'csrf-token' : csrfToken},
			})
			.then(response => {
				// Correio answer.
				if (response.data.err) {
					console.log(response.data.err);
					alert(response.data.err);
				} else {
					window.location.href = `/checkout/confirmation/order/${order._id}`;
				}
			})
			.catch(err => {
				console.error(err);
			}); 
		},
		// Payment by credit card, using PayPal Plus (ppp).
		// payPalPlusPayment() {
			// axios({
				// method: 'post',
				// url: `/checkout/ppp/create-payment/${order._id}`,
				// headers:{'csrf-token' : csrfToken},
			// }).then(response => {
				// // Correio answer.
				// if (response.data.err) {
					// console.log(response.data.err);
				// } else {
					// console.log(JSON.stringify(response.data, null, 2));
					// if (response.data.success) {
						// window.location.href = `/checkout/ppp/approval-payment/${order._id}`
					// }
					// else {
						// window.location.href = `/error`
					// }
				// }
			// }).catch(err => {
				// console.error(err);
			// }) 
		// },
	},
	filters: {
		formatMoney: function(val){
			return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		}
	}  
});
// app.test();
// Items.
// let items = [];
// for (var i = 0; i < order.items.length; i++) {
	// let item = {
		// name: order.items[i].name,
		// // item.description: '',
		// quantity: order.items[i].quantity,
		// price: order.items[i].price,
		// //- tax: "0.01",
		// sku: order.items[i]._id,
		// currency: "BRL"
	// };
	// items.push(item);
// }
// // Shipping address.
// let shippingAddress = {
	// recipient_name: order.shipping.address.name,
	// line1: `${order.shipping.address.address}, ${order.shipping.address.addressNumber} - ${order.shipping.address.district}`,
	// line2: order.shipping.address.complement,
	// city: order.shipping.address.city,
	// country_code: 'BR',
	// postal_code: order.shipping.address.cep,
	// phone: order.shipping.address.phone,
	// state: order.shipping.address.state
// };