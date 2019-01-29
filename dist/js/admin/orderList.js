'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
  el: '#app',
  data: {
    // All orders from search.
    orders: [],
    // Order selected index.
    orderSelecIndex: -1,
    // Order selected.
    orderSelec: {},
    // Curret page for pagination.
    page: 1,
    // Number of pages for pagination.
    pageCount: 1,
    // Text for search orders.
    searchOrder: '',
    // Show modal.
    showModal: false,
    // Window to change status.
    setStatusWindow: {
      show: false,
      message: '',
      showCheckboxUpdateStock: false,
      // Change to this status.
      status: '',
      // Update stock quantity when intem is canceled.
      updateStock: false,
    },
    // Filter.
    filter: {
      placed: true,
      paid: true,
      shipped: true,
      delivered: true,
      canceled: true
    }
  },
  created() {
    // On reload page use the query string for search, not the input search.
    this.getOrders();
  },
  watch: {
    filter: {
      handler(val){
        this.getOrders();
      },
      deep: true
    }
  },
  methods: {
    getOrders(page=1){
      // Orders status to show.
      let filter = [];
      for (let prop in this.filter) {
        if (this.filter[prop]){
          filter.push(prop);
        }
      }
      axios({
        method: 'get',
        url: `/admin/api/orders?page=${page}&search=${this.searchOrder}&filter=${JSON.stringify(filter)}`,
        headers:{'csrf-token' : csrfToken}
      })
      .then((res)=>{
        this.orders = res.data.orders;
        this.page = res.data.page;
        this.pageCount = res.data.pageCount;
      })
      .catch((err)=>{
        console.log(`Error - getOrders(), err: ${err}`);
      });
    },    
    // Show order detail on modal window.
    showOrderDetail(index){
      this.orderSelecIndex = index;
      this.orderSelec = this.orders[index];
      this.showModal = true;
    },
    // Hide order detail modal.
    hideOrderDetail(){
      this.showModal = false;
    },
    // Get status order.
    status(order){
      switch(order.status) {
        case 'canceled':
          return 'Cancelado';
        case 'delivered':
          return 'Entregue';
        case 'shipped':
          return 'Enviado';
        case 'paid':
          return 'Pago';
        case 'placed':
          return 'Aberto';
        default:
          return '';
      }
    },
    // Get order action.
    action(order){
      switch(order.status) {
        case 'canceled':
          return '-';
        case 'delivered':
          return '-';
      }
      if (order.payment.method === 'paypal') {
        switch(order.status) {
          case 'shipped':
            return '-';
          case 'paid':
            return 'Enviar';
          case 'placed':
            return 'Erro';
          default:
            return '';
        }
      } 
      // Money, only by motoboy.
      else if(order.payment.method === 'money'){
        switch(order.status) {
          case 'shipped':
            return '-';
          case 'paid':
            return 'Pago';
          case 'placed':
            return 'Enviar';
          default:
            return '';
        }
      } 
      else if(order.payment.method === 'transfer'){
        switch(order.status) {
          case 'shipped':
            return '-';
          case 'paid':
            return 'Enviar';
          case 'placed':
            return 'Verificar pagamento';
          default:
            return '';
        }
      }
    },    
    // Set order status from selected order.
    showSetStatusWindow(status){
      // Status to change.
      this.setStatusWindow.status = status;
      // Config window.
      switch (status){
        case 'paid':
          this.setStatusWindow.message = 'Confirma alteração do status para pago?';
          this.setStatusWindow.showCheckboxUpdateStock = false;
          this.setStatusWindow.show = true;
          break;
        case 'shipped':
          this.setStatusWindow.message = 'Confirma alteração do status para enviado?';
          this.setStatusWindow.showCheckboxUpdateStock = false;
          this.setStatusWindow.show = true;
          break;
        case 'delivered':
          this.setStatusWindow.message = 'Confirma alteração do status para entregue?';
          this.setStatusWindow.showCheckboxUpdateStock = false;
          this.setStatusWindow.show = true;
          break;
        case 'canceled':
          console.debug('canceled hit');
          this.setStatusWindow.message = 'Confirma alteração do status para cancelado?';
          this.setStatusWindow.showCheckboxUpdateStock = true;
          this.setStatusWindow.updateStock = true;
          this.setStatusWindow.show = true;
          break;
        default:
          return;
      }
    },
    // Set order status from selected order.
    setStatus(){
      axios({
        method: 'post',
        url: `/admin/api/order/status/${this.orderSelec._id}/${this.setStatusWindow.status}`,
        headers:{'csrf-token' : csrfToken},
        params: {updateStock: this.setStatusWindow.updateStock}
      })
      .then((res)=>{
        // Update selected order and orders.
        // console.log(`data: ${JSON.stringify(res.data)}`);
        this.orderSelec = res.data.order;
        this.$set(this.orders, this.orderSelecIndex, res.data.order);
        this.setStatusWindow.show = false;
      })
      .catch((err)=>{
        console.error(`Error - setStatus(), err: ${err}`);
        this.setStatusWindow.show = false;
      });
    }
  },
  filters: {
    // Format number to money format.
    formatMoney(val){
      return 'R$ ' + val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    // Format number to money format.
    formatDate(val){
      let d = new Date(val);
      return `${d.getDate()}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
    }
  }
});
