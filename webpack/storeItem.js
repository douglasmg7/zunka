/* eslint no-unused-vars: off */
'use strict';

// Vue components
import StoreItem from './storeItem.vue';

// event hub
window.eventHub = new Vue({
});

window.appVue = new Vue({
  el: '#app',
  render(h) {
    return h(StoreItem, {props: 
      {
        $http: this.$http,
        user: vueUser,
        product: vueProduct
      }
    });
  }
});