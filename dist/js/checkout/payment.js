// Vue.
let app = new Vue({
  el: '#app',
  data: {
    order: order
  },
  methods: {
    // Close de order.
    confirmPayment(payment){
      axios({
        method: 'post',
        url: window.location.href,
        headers:{'csrf-token' : csrfToken},
        data: { payment: payment }
      })
      .then(response => {
        // Correio answer.
        if (response.data.err) {
          console.log(response.data.err);
        } else {
          window.location.href = `/checkout/order-confirmation/${order._id}`
        }
      })
      .catch(err => {
        console.error(err);
      }) 
    },
  },
  computed: {
    deliveryDeadline: function(){
      if (order.shipping.correioResult.PrazoEntrega) {
        return order.shipping.correioResult.PrazoEntrega;
      } 
      else {
        return order.shipping.deadline;
      }
    },
    deliveryPrice: function(){
      if (order.shipping.correioResult.Valor) {
        return order.shipping.correioResult.Valor;
      } 
      else {
        return order.shipping.price;
      }
    }
  },
  filters: {
    formatMoney: function(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  }  
});
// app.test();
// Items.
let items = [];
for (var i = 0; i < order.items.length; i++) {
  let item = {
    name: order.items[i].name,
    // item.description: '',
    quantity: order.items[i].quantity,
    price: order.items[i].price,
    //- tax: "0.01",
    sku: order.items[i]._id,
    currency: "BRL"
  };
  items.push(item);
}
// Shipping address.
let shippingAddress = {
  recipient_name: order.shipping.address.name,
  line1: `${order.shipping.address.address}, ${order.shipping.address.addressNumber} - ${order.shipping.address.district}`,
  line2: order.shipping.address.complement,
  city: order.shipping.address.city,
  country_code: 'BR',
  postal_code: order.shipping.address.cep,
  phone: order.shipping.address.phone,
  state: order.shipping.address.state
};
// console.log(`shippingAddress: ${JSON.stringify(shippingAddress)}`);
// Paypal Express Checkout. 
// https://developer.paypal.com/docs/api/payments/
paypal.Button.render({
  env: 'sandbox', // production or sandbox,
  // env: 'production'
  commit: true, // Show a 'Pay Now' button.
  locale: 'pt_BR',
  style: {
    // size: 'small',
    size: 'medium',
    // size: 'large',
    // size: 'responsive',
    // color: 'blue',
    color: 'gold',
    // shape: 'rect',
    shape: 'pill',
    // label: 'checkout'
    // label: 'installment'
    // label: 'paypal'
    label: 'pay'
  },
  client: {
      sandbox:    'ASpmuFYrAVJcuEiBR5kP8lBdfEJqz4b8hsPQ0fKV7spzkiYFQc2BtA2q7M5vyXTPFuUELBiOpGmfhSZw',
      production: 'xxxxxxxxx'
  },
  // Set up the payment.
  payment: function(data, actions) {
    return actions.payment.create({
      payment: {
        intent: 'sale',   // Makes an immediate payment.
        payer: {
          payment_method: 'paypal'
        },
        transactions: [
          {
            // reference_id: 'asdfasdfasdfasdf', // Optional - i will use order _id.
            amount: {
              total: order.totalPrice,
              currency: "BRL",
              details: {
                subtotal: order.subtotalPrice,
                //- tax: "0.01",
                shipping: order.shipping.price,
                //- handling_fee: "0.01",
                //- shipping_discount: "-0.01",
                //- insurance: "0.01"
              }
            },
            description: 'Itens do carrinho.',
            // custom: 'EBAY_EMS_90048630024435',
            // soft_descriptor: 'ECHI5786786',
            // purchase_order: 'asefeaf',
            item_list: {
              items: items,
              shipping_address: shippingAddress
            }
          }
        ],
      }            
    });
  },
  // Execute the payment.
  onAuthorize: function(data, actions) {
    // Make a call to the REST api to execute the payment
    return actions.payment.execute()
      .then(function(payment) {
        // The payment is complete!
        // You can now show a confirmation message to the customer.
        app.confirmPayment(payment);
      }).catch(err=>{
        return next(err);
      });
  },
  // Buyer cancelled the payment.
  onCancel: function(data, actions) {
    console.log('Payment canceled.');

    // By default, the buyer is returned to the original page, but you're free to use this function to take them to a different page.
  },
  // An error occurred during the transaction.
  onError: function(err) {
    console.error(`Payment error: ${err}`);
  }
}, '#paypal-button');