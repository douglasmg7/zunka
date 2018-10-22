// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
};
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    product: product,
    search: '',
    selectedThumbnail: 0,   // Selected thumbnail image.
    cepDestiny: '',
    showEstimatedShipment: false,
    loadingEstimateShipment: false,
    cepErrMsg: '',
    deliveryMethod: '',
    deliveryPrice: 0,
    deliveryTime: 0,   // Delivery time in days.
  },
  methods: {
    // Accaunting.
    accountingParse: accounting.parse,
    // Get shimpment value from Correios.
    estimateShipment(){
      this.loadingEstimateShipment = true;
      axios({
        method: 'get',
        url:`/checkout/ship-estimate?productId=${this.product._id}&cepDestiny=${this.cepDestiny}`,
        headers:{'csrf-token' : csrfToken},
        data: { productId: this.product._id, cepDestiny: this.cepDestiny }
      })
      .then(response => {
        // Correio answer.
        if (response.data.err) {
          console.log(response.data.err);
          this.showEstimatedShipment = false;
          this.cepErrMsg = response.data.err;
        } else {
          this.cepErrMsg = '';
          this.deliveryMethod = 'Padrão';
          this.deliveryPrice = response.data.correio.Valor;
          this.deliveryTime =  `${response.data.correio.PrazoEntrega} dia(s)`;
          this.showEstimatedShipment = true;
        }
        this.loadingEstimateShipment = false;
      })
      .catch(err => {
        console.log('inside error.');
        console.error(err);
        this.loadingEstimateShipment = false;
        this.showEstimatedShipment = false;
      }) 
    },
    // Add product to cart.
    addToCart(){
      axios({
        method: 'put',
        url:`/cart/add/${this.product._id}`,
        headers:{'csrf-token' : csrfToken},
        data: { product: this.product }
      })
      .then(response => {
        // Product added to the cart.
        if (response.data.success) {
          window.location.href = `/?productAddedToCart=${this.product._id}`;
        }
      })
      .catch(err => {
        console.error(err);
      }) 
    }    
  },
  computed:{
    // Each line of product detail become one array item.
    productDetail(){
      if (this.product.storeProductDetail.trim() === '') {
        return new Array();
      }
      return this.product.storeProductDetail.split('\n');
    },
    // Each line become one array item.
    productDescription(){
      if (this.product.storeProductDescription.trim() === '') {
        return new Array();
      }
      return this.product.storeProductDescription.split('\n');
    },
    // Each line of technical information become a array item, each item in line separeted by ; become array item.
    productInformationTechnical(){
      let infoTech = [];
      // Avoid create elements if there is nothing.
      if (this.product.storeProductTechnicalInformation.trim() === '') {
        return infoTech;
      }
      this.product.storeProductTechnicalInformation.split('\n').forEach(function(info) {
        infoTech.push(info.split(';'));
      });
      return infoTech;
    },
    // Each line of additional information become a array item, each item in line separeted by ; become array item.
    productInformationAdditional(){
      let infoAdd = [];
      // Avoid create elements if there is nothing.
      if (this.product.storeProductAdditionalInformation.trim() === '') {
        return infoAdd;
      }
      this.product.storeProductAdditionalInformation.split('\n').forEach(function(info) {
        infoAdd.push(info.split(';'));
      });
      return infoAdd;
    }
  },    
  filters: { 
    currency(val){
      return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  },
});