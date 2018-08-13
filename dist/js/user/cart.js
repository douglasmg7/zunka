// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // user.
    user: user,
    // Cart.
    cart: cart
  },
  methods: {
    changeProductQtd(product){
      // console.log(product._id);
      // console.log(product.qtd);
      axios({
        method: 'put',
        url: `cart/change-qtd/${product._id}/${product.qtd}`,
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;
          // Update nav-bar.
          document.getElementById('cart-qtd').innerHTML = this.cart.totalQtd;
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - changeProductQtd(), err: ${err}`);
      });
    },
    removeProduct(product){
      console.log(product._id);
      console.log(product.qtd);
      axios({
        method: 'put',
        url: `cart/remove/${product._id}`,
        headers: {'csrf-token' : csrfToken},
      })
      .then((res)=>{
        // Success.
        if (res.data.success) {
          this.cart = res.data.cart;          
        }
      })
      .catch((err)=>{
        alert('Erro interno, não foi possível atualizar o carrinho.');
        console.error(`Error - removeProduct(), err: ${err}`);
      });
    },  
    selectAddress(){
      window.location.href = '/checkout/shipping-address';
    }  
  },
  filters: { 
    currencyBr(value){ return accounting.formatMoney(value, "R$", 2, ".", ","); },
    // currencyInt(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[0];
    // },
    // currencyCents(value){
    //   return accounting.formatMoney(accounting.parse(value, ','), '', 2, '.', ',').split(',')[1];
    // }
  },
});