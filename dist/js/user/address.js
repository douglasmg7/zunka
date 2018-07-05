// Search for products.
function _search(text){
  window.location.href = `/?page=1&search=${text}`;
}
// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // Addresses.
    addresses: addresses,
  },
  methods: {
    // Add new address.
    addAddress(){
      window.location.href = 'address/add';
    },
    editAddress(addressId){
      window.location.href = `address/edit?addressId=${addressId}`;
    },
    // Remove address.
    removeAddress(addressId){
      if (confirm('Confirma a remoção do endereço ?')) {
        axios({
          method: 'put',
          url: `address/remove/${addressId}`,
          headers: {'csrf-token' : csrfToken},
        })
        .then((res)=>{
          // Address removed successful.
          if (res.data.success) {
            // Set deleted address on client side.
            for (let i=0; i < this.addresses.length; i++) {
              if (this.addresses[i]._id === addressId) {
                this.$delete(this.addresses, i);
              } 
            }
          }
        })
        .catch((err)=>{
          console.error(`Error - removeAddress(), err: ${err}`);
        });
      }
    },
    // Set default address.
    setDefaultAddress(addressId){
      if (confirm('Marcar como endereço padrão?')) {
        axios({
          method: 'put',
          url: `address/default/${addressId}`,
          headers: {'csrf-token' : csrfToken},
        })
        .then((res)=>{
          // Successful set address as default.
          if (res.data.success) {
            // Set default address on client side.
            for (let i=0; i < this.addresses.length; i++) {
              if (this.addresses[i]._id === addressId) {
                this.addresses[i].default = true;
              } else {
                this.addresses[i].default = false;
              }
            }
          }
        })
        .catch((err)=>{
          console.error(`Error - setDefaultAddress(), err: ${err}`);
        });
      }
    },
  } 
});