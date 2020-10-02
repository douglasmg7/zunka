'use strict';

const log = require('../config/log');
const axios = require('axios');
const Product = require('../model/product');
const jsdom = require('jsdom');
const emailSender = require('../config/email');

// Min stock quantity in stock dealer to permit sell.
const STOCK_PRODUCT_QTY_MIN = 1;

// Check aldo product quantity.
function checkStock(product, qty, cb) {
    try {
        // Not sell last ones.
        let checkQty = qty + STOCK_PRODUCT_QTY_MIN;

        // To get the last update.
        let now="2018-01-01T00:00:00-03:00";

        let url = `${process.env.ALLNATIONS_HOST}/ConsultaEstoqueProdutos?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `CodigoProduto=${product.dealerProductId}&` +
            `Data=${now}`;
        console.log(`url: ${url}`);

        let initTime = Date.now();
        axios.get(url)
            .then(response => {
                // log.debug(`Time to check allnation stock, product ${product._id}: ${Date.now() - initTime}ms, response.data: ${response.data}`);
                if (response.data.err) {
                    return cb(new Error(`Checking allnations stock. Allnations webservice response.data.err: ${response.data.err}`));
                } 

                // Get information from xml.
                let result = [];
                const dom = new jsdom.JSDOM(response.data);
                let stocks = dom.window.document.querySelectorAll("Estoques");
                stocks.forEach(estoque=>{
                    let stockProduct = {};
                    stockProduct.code = estoque.querySelector("CODIGO").textContent;
                    stockProduct.active = estoque.querySelector("ATIVO").textContent;
                    stockProduct.availability = estoque.querySelector("DISPONIVEL").textContent;
                    stockProduct.stockOrigin = estoque.querySelector("ESTOQUE").textContent;
                    stockProduct.stockQty = estoque.querySelector("ESTOQUEDISPONIVEL").textContent;
                    result.push(stockProduct);
                });

                // Get correct product.
                let receivedProduct;
                result.forEach(stockProduct=>{
                    // log.debug(`product.dealerProductLocation: ${product.dealerProductLocation}`);
                    // log.debug(`stockProduct: ${JSON.stringify(stockProduct)}`);
                    if (
                        product.dealerProductId == stockProduct.code.trim() &&
                        product.dealerProductLocation.toLowerCase() == stockProduct.stockOrigin.trim().toLowerCase()) 
                    {
                        receivedProduct = {
                            active: stockProduct.active && stockProduct.availability,
                            stock: stockProduct.stockQty
                        }
                    }
                });
                // Have some information.
                if (receivedProduct) {
                    // Update product.
                    let update = { storeProductQtd: receivedProduct.stock - STOCK_PRODUCT_QTY_MIN, dealerProductActive: receivedProduct.active };
                    if (!receivedProduct.active) {
                        update.storeProductCommercialize = false;
                    }
                    Product.updateOne({ _id: product._id }, update, err=>{
                        if (err) {
                            log.error(`Checking allnations product quantity (Product.updateOne()): ${err.stack}`);
                        } else {
                            log.debug(`Allnations product ${product.dealerProductId} stock was changed to ${parseInt(update.storeProductQtd, 10)}.`);
                        }
                    });
                    // Have stock.
                    if (receivedProduct.active && receivedProduct.stock >= checkQty) {
                        return cb(null, true);
                    } 
                    // Not have stock.
                    else {
                        return cb(null, false);
                    }
                } 
                // Could not get product stock.
                else {
                    return cb(new Error(`Checking aldo product quantity. Aldo webservice response.data: ${response.data.err}`));
                }
            })
            .catch(err => {
                return cb(new Error(`Checking allnations stock. axios catch: ${err.stack}`));
            }); 
    } catch(err) {
        return cb(new Error(`Checking allnation stock. catch: ${err}`));
    }
};

// Get booking information.
async function getBooking(item) {
    try{
        let url = `${process.env.ALLNATIONS_HOST}/RetornarReservas?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `PedidoCliente=${item._id}`;
        // log.debug(`getBooking for PedidoCliente: ${item._id}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
        } 
        // log.debug(`response.data: ${response.data}`);

        let result = [];
        const dom = new jsdom.JSDOM(response.data);
        let bookings = dom.window.document.querySelectorAll("Reservas");
        bookings.forEach(booking=>{
            let product = {};
            product.date = booking.querySelector("DATAHORA").textContent;
            product.codeClient = booking.querySelector("CODIGOCLIENTE").textContent;
            product.zunkasiteOrderItemId = booking.querySelector("CODIGOPEDIDOCLIENTE").textContent;
            product.code = booking.querySelector("CODIGOPRODUTO").textContent;
            product.quantity = booking.querySelector("QUANTIDADE").textContent;
            product.status = booking.querySelector("STATUS").textContent;
            switch(product.status) {
                case "1":
                    product.status = "pending";
                    break;
                case "2":
                    product.status = "confirmed";
                    break;
                case "3":
                    product.status = "generatedOrder";
                    break;
                case "4":
                    product.status = "canceled";
                    break;
                default:
                    product.status = "";
                    log.warn(`Allnations booking ${item._id} returned a invalid status: ${product.status}.`);
                    return null;
            }
            let cpfCnpjFinalClient = booking.querySelector("CPF_CNPJ_ClienteFinal");
            if (cpfCnpjFinalClient) {
                product.cpfCnpjFinalClient = cpfCnpjFinalClient.textContent;
            }
            let priceFinalClient = booking.querySelector("Valor_ClienteFinal");
            if (priceFinalClient) {
                product.priceFinalClient = priceFinalClient.textContent;
            }
            result.push(product);
        });
        // Supposed to be only one.
        if (result.length > 1) {
            log.warn(`Allnations booking ${item._id} returned ${result.length} booking, supposed to be only one, booking returned: ${JSON.stringify(result, null, 2)}`);
            return null;
        }
        if (result.length == 0) {
            log.warn(`Allnations booking ${item._id} returned no booking`);
            return null;
        }
        if (result[0].zunkasiteOrderItemId != item._id) {
            log.warn(`Allnations booking ${item._id} returned wrong order item id: ${result[0].zunkasiteOrderItemId}, supposed to be: ${item._id}`);
            log.warn(`booking result: ${JSON.stringify(result[0], null, 2)}`);
            return null;
        }
        if (result[0].code.trim() != item.dealerProductId) {
            log.warn(`Allnations booking ${item._id} returned wrong dealer product code: ${result[0].code}, supposed to be: ${item.dealerProductId}`);
            log.warn(`booking result: ${JSON.stringify(result[0], null, 2)}`);
            return null;
        }
        // log.debug(`result: ${JSON.stringify(result, null, 2)}`);
        return result[0];
    } catch(err) {
        log.error(`catch - Getting allnations booking information. ${err.stack}`);
        return null;
    }
}

// Make booking.
async function makeBooking(item) {
    try {
        // Only make a booking in production mode.
        if (process.env.NODE_ENV != 'production') {
            log.debug(`Allnations booking ${item._id} will not be made in ${process.env.NODE_ENV} mode.`);
            return;
        }

        let url = `${process.env.ALLNATIONS_HOST}/InserirReserva?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `PedidoCliente=${item._id}&` +
            `CodigoProduto=${item.dealerProductId}&` +
            `Qtd=${item.quantity}`;
        // console.log(`url: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
        } else {
            log.debug(`Allnations booking ${item._id} maked`);
            emailSender.sendMailToDev('New allnations booking.', `New allantios booking was made for item._id: ${JSON.stringify(item, null, 2)}`);
        }
    } catch(error) {
        log.error(`catch - Making allnations booking ${item._id}. ${err.stack}`);
    }
}

// Cancel booking.
async function cancelBooking(item) {
    try {
        // Only cancel a booking in production mode.
        if (process.env.NODE_ENV != 'production') {
            log.debug(`Allnations booking ${item._id} will not be canceled in ${process.env.NODE_ENV} mode.`);
            return;
        }
        let url = `${process.env.ALLNATIONS_HOST}/CancelarReserva?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `PedidoCliente=${item._id}`;
        // console.log(`url: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
        } else {
            log.debug(`Allnations booking ${item._id} canceled`);
        }
    } catch(error) {
        log.error(`catch - Canceling allnations booking ${item._id}. ${err.stack}`);
    }
}

// Confirm booking.
async function confirmBooking(item) {
    try {
        // Only confirm a booking in production mode.
        if (process.env.NODE_ENV != 'production') {
            log.debug(`Allnations booking ${item._id} will not be confirmed in ${process.env.NODE_ENV} mode.`);
            return;
        }

        let url = `${process.env.ALLNATIONS_HOST}/ConfirmarReserva?` +
            `CodigoCliente=${process.env.ALLNATIONS_USER}&` + 
            `Senha=${process.env.ALLNATIONS_PASS}&` +
            `PedidoCliente=${item._id}`;
        // console.log(`url: ${url}`);

        let response = await axios.get(url);
        if (response.data.err) {
            log.error(response.data.err);
        } else {
            log.debug(`Allnations booking ${item._id} confirmed`);
            emailSender.sendMailToDev('Allnations booking confirmed.', `Allantios booking was confirmed for item._id: ${JSON.stringify(item, null, 2)}`);
        }
    } catch(error) {
        log.error(`catch - Confirming allnations booking ${item._id}. ${err.stack}`);
    }
}

module.exports.checkStock = checkStock;
module.exports.getBooking = getBooking;
module.exports.makeBooking = makeBooking;
module.exports.cancelBooking = cancelBooking;
module.exports.confirmBooking = confirmBooking;
