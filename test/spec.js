'use strict';
const request = require('supertest');
const assert = require('chai').assert;
const expect = require('chai').expect;
const s = require('../config/s');
const nock = require('nock');
const Product = require('../model/product');
const Order = require('../model/order');
const User = require('../model/user');
const routeCheckout = require('../routes/routeCheckout');
const mobileNumber = require('../util/mobileNumber');

const path = require('path');
const fse = require('fs-extra');
const productUtil = require('../util/productUtil');

// Array with newest products.
let newestProducts;

describe('Zunka', function () {

    // Start and stop server.
    let server;
    before(function (done) {
        this.timeout(3000);
        server = require('../bin/www');


        setTimeout(function(){ done(); }, 1000);
    });
    after(function () {
        server.close(function(err) {
            if (err) {
                log.error(err.stack);
                process.exit(1)
            }
        });

    });

    // Site.
    describe("Site", ()=>{
        // Root page.
        it('/', done=>{
            request(server)
                .get('/')
                .expect(200, done);
        });
        // New products API.
        it('/api/new-products', done=>{
            request(server)
                .get('/api/new-products')
                .expect(200)
                .end((err, res)=>{
                    newestProducts = JSON.parse(res.text).products;
                    // console.log(`newestProducts.length: ${newestProducts.length}`);
                    expect(newestProducts).to.have.length.above(2);
                    done();
                });
        });
        // Banner admin page.
        it('Banner configuration', done=>{
            request(server)
                .get('/admin/banner')
                .end((err, res)=>{
                    assert.equal(res.statusCode, 200);
                    done();
                });
        });
        // Not found.
        it('404', function test404(done) {
            request(server)
                .get('/foo/bar')
                .expect(404, "Página não encontrada.", done);
        });
        // Check CPF, CNPJ and mobile number registred..
        it('function checkCpfCnpjMobileRegistred()', done=>{
            let user = new User();

            // Nothing.
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.false;

            // Only mobile number.
            user.cpf = "";
            user.cnpj = "";
            user.mobileNumber = "1";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.false;

            // Only CPF.
            user.cpf = "1";
            user.cnpj = "";
            user.mobileNumber = "";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.false;

            // Only CNPJ.
            user.cpf = "";
            user.cnpj = "1";
            user.mobileNumber = "";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.false;

            // CPF and CNPJ.
            user.cpf = "";
            user.cnpj = "1";
            user.mobileNumber = "";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.false;

            // Válid with cpf.
            user.cpf = "1";
            user.cnpj = "";
            user.mobileNumber = "1";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.true;

            // Válid with cnpj.
            user.cpf = "";
            user.cnpj = "1";
            user.mobileNumber = "1";
            expect(routeCheckout.checkCpfCnpjMobileRegistred(user)).to.be.true;

            done();
        });
        // Check if is a válid mobile number.
        it('Validate mobile number', done=>{
            expect(mobileNumber.isValid("")).to.be.false;
            expect(mobileNumber.isValid("313872023")).to.be.false;
            expect(mobileNumber.isValid("319993872023")).to.be.false;
            expect(mobileNumber.isValid("31938720236")).to.be.true;
            expect(mobileNumber.isValid("(31)93872-0236")).to.be.true;
            expect(mobileNumber.isValid("av3er1938gt720236")).to.be.false;
            expect(mobileNumber.isValid("(31)938720236")).to.be.true;
            done();
        });
        // Format mobile number.
        it('Format mobile number', done=>{
            expect(mobileNumber.format("")).to.be.eq("");
            expect(mobileNumber.format("313872023")).to.be.eq("");
            expect(mobileNumber.format("319993872023")).to.be.eq("");
            expect(mobileNumber.format("31938720236")).to.be.eq("(31) 9 3872-0236");
            expect(mobileNumber.format("(31)93872-0236")).to.be.eq("(31) 9 3872-0236");
            expect(mobileNumber.format("av3er1938gt720236")).to.be.eq("(31) 9 3872-0236");
            expect(mobileNumber.format("(31)938720236")).to.be.eq("(31) 9 3872-0236");
            done();
        });
    });

    describe("productUtil", ()=>{
        it('copyImageFiles', done=>{
            let src = "test_src";
            let dst = "test_dst";
            let srcPath = path.join(__dirname, '..', 'dist/img/', src)
            let dstPath = path.join(__dirname, '..', 'dist/img/', dst)

            // console.log(`__dirname: ${__dirname}`);

            // Get file names from source.
            let srcFiles = fse.readdirSync(srcPath);

            // Get file names from destiny.
            let dstFiles = fse.readdirSync(dstPath);
            // Clean destiny dir.
            for (let file of dstFiles) {
                // console.log(`destiny file: ${file}`);
                let rmFile = path.join(dstPath, file);
                // console.log(`file to remove: ${rmFile}`);
                fse.removeSync(rmFile);
            };

            productUtil.copyImageFiles("test_src","test_dst");
            dstFiles = fse.readdirSync(dstPath);
            // console.log(`dstFiles: ${dstFiles}`);

            for (let file of srcFiles) {
                // expect(dstFiles).to.includes(srcFiles);
                expect(dstFiles).to.deep.equal(srcFiles);
                // console.log(`source files: ${file}`);
            };
            // expect(products).to.have.length.above(0);
            done();
        });
    });

    describe("Zunkasrv", ()=>{
        // Get product ean.
        it('/setup/products-same-ean', done=>{
            let ean = '7899864928406'
            request(server)
                .get(`/setup/products-same-ean`)
                .query({ean: ean})
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .end((err, res)=>{
                    expect(res.status).to.be.equal(200);
                    // console.log(`res.status: ${res.status}`);
                    // console.log(`res.text: ${res.text}`);
                    let products = JSON.parse(res.text);
                    expect(products).to.have.length.above(0);
                    products.forEach(product=>{
                        console.log(`product title: ${product.storeProductTitle}`);
                        console.log(`product _id: ${product._id}`);
                        expect(product.ean).length.be.equal(ean);
                    });
                    done();
                });
        });
        // Get products similar titles.
        it('/setup/products-similar-title', done=>{
            // let title = '5490-M30S2';
            // let title = 'Computador All In One Dell Inspiron 5490-M30S2';
            let title = 'GABINETE COOLER MASTER MASTERBOX LITE 3.1 TG LATERAL EM VIDRO TEMPERADO ATX/E-ATX/MINI-ITX/MICRO-AT';
            request(server)
                .get(`/setup/products-similar-title`)
                .query({title: title})
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .end((err, res)=>{
                    expect(res.status).to.be.equal(200);
                    // console.log(res.text);
                    let products = JSON.parse(res.text);
                    expect(products).to.have.length.above(0);
                    products.forEach(product=>{
                        console.log(`product title: ${JSON.stringify(product.storeProductTitle, null, 2)}`);
                        expect(product.storeProductTitle).length.be.above(0);
                    });
                    done();
                });
            });
    });

    // Aldo.
    describe("Aldo", ()=>{
        // Get aldo products.
        it('/setup/products/aldo', done=>{
            request(server)
                .get('/setup/products/aldo')
                .auth(s.zunkaSite.user, s.zunkaSite.password)
                .expect(200)
                .end((err, res)=>{
                    // console.log(res.text);
                    let products = JSON.parse(res.text);
                    expect(products).to.have.length.above(0);
                    products.forEach(product=>{
                        expect(product.id).to.be.length(24);
                        expect(product.dealerProductId).length.be.above(2);
                        expect(product.dealerProductPrice).to.be.above(300);
                        expect(product.storeProductQtd).to.be.gte(0);
                    });
                    Product.findById(products[0].id, (err, productDb)=>{
                        expect(productDb.dealerName).to.be.eq('Aldo');
                        done();
                    });
                });
        });
        // Set aldo products quantity.
        it('/setup/product/quantity', done=>{
            // Find code to use.
            Product.findOne({ dealerName: "Aldo", dealerProductId: {$exists: true}, deletedAt: {$exists: false} }, (err, product)=>{
                // console.log(`product: ${JSON.stringify(product, null, 2)}`);
                let _id = product._id;
                let storeProductQtd = product.storeProductQtd + 1;
                if (storeProductQtd > 100) {
                    storeProductQtd = 1;
                }
                expect(_id).to.not.be.empty;
                // Test api.
                request(server)
                    .post('/setup/product/quantity')
                    .auth(s.zunkaSite.user, s.zunkaSite.password)
                    .send({_id: _id, storeProductQtd: storeProductQtd})
                    .end((err, res)=>{
                        // console.log(`res: ${JSON.stringify(res, null, 2)}`);
                        expect(res.statusCode).to.be.equal(200);
                        Product.findById(_id, (err, productUpdated)=>{
                            expect(productUpdated.storeProductQtd).to.be.eq(storeProductQtd);
                            done();
                        });
                    });
            });
        });
    });

    // Zoom API.
    describe("Zoom API", ()=>{
        const zoomOrderId = '31559839856'; 
        const zoomOrderTest = require(`./zoom/order-${zoomOrderId}.json`);

        before(done=> {
            // Order.deleteMany({externalOrderNumber: zoomOrderId}, err=>{
            Order.deleteMany({externalOrderNumber: {$exists: true}}, err=>{
                expect(err).to.be.null;
                done();
            })
        });

        // Not using auth anymore.
        // // Invalid auth.
        // it('Inválid authorization', done=>{
            // request(server)
                // .post('/ext/zoom/order-status')
                // .auth(s.zoomInternalAuth.user, "111")
                // .send({ "orderNumber": "5015679200", "status": "New" })
                // .expect(401, /Unauthorised/, done);
        // });

        // Hello.
        it('Hello', done=>{
            request(server)
                .get('/ext/zoom/hello')
                // .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .expect(200, /Hello!/, done);
        });
        // Invalid status.
        it('Order status invalid', done=>{
            request(server)
                .post('/ext/zoom/order-status')
                // .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                .send({ "orderNumber": "5015679200", "status": "Deleted" })
                .expect(400, /Unknown status: /, done);
        });
        it('New zoom order (produto não existe)', done=>{
            this.timeout(3000);
            // Mock request.
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderTest);
            // Url request.
            request(server)
                .post('/ext/zoom/order-status')
                .send({ "orderNumber": zoomOrderId, "status": "new" })
                .expect(200, 'Product(s) out of stock.', done);
        });
        it('New zoom order', done=>{
            Order.deleteMany({externalOrderNumber: {$exists: true}}, err=>{
                expect(err).to.be.null;
                // Request products in stock.
                zoomOrderTest.items = [
                    {
                        "amount": 2,
                        "total": newestProducts[0].storeProductPrice * 2,
                        "product_id": newestProducts[0]._id,
                        "product_name": newestProducts[0].storeProductTitle,
                        "product_price": newestProducts[0].storeProductPrice
                    },
                    {
                        "amount": 2,
                        "total": newestProducts[1].storeProductPrice * 2,
                        "product_id": newestProducts[1]._id,
                        "product_name": newestProducts[1].storeProductTitle,
                        "product_price": newestProducts[1].storeProductPrice
                    }
                ];
                // console.log(`zoomOrderTest: ${JSON.stringify(zoomOrderTest, null, 2)}`);
                // Mock request.
                nock(s.zoom.host)
                    .get(`/order/${zoomOrderId}`)
                    .reply(200, zoomOrderTest);
                // console.log(`stock product 1: ${newestProducts[0].storeProductQtd}`);
                // console.log(`stock product 2: ${newestProducts[1].storeProductQtd}`);
                // Add stock product to test sell.
                Product.updateMany({ _id: { $in:  [newestProducts[0]._id, newestProducts[1]._id] }}, { $inc: { storeProductQtd: 2 }}, err=>{
                    expect(err).to.be.null;
                    // Approved payment.
                    request(server)
                        .post('/ext/zoom/order-status')
                    // .auth(s.zoomInternalAuth.user, s.zoomInternalAuth.password)
                        .send({ "orderNumber": zoomOrderId, "status": "new" })
                        .end((err, res)=>{
                            expect(res.statusCode).to.be.equal(200);
                            // Check if order was created.
                            Order.find({}, {}).sort({"timestamps.placedAt": -1}).limit(1)
                                .then(docs=>{
                                    let orderDb = docs[0];
                                    expect(orderDb).to.not.be.null;
                                    expect(orderDb.externalOrderNumber).to.not.be.empty;
                                    expect(orderDb.externalOrderNumber).to.be.equal(zoomOrderTest.order_number);
                                    expect(orderDb.timestamps).to.not.be.null;
                                    expect(orderDb.timestamps.placedAt).to.not.be.null;
                                    expect(orderDb.timestamps.paidAt).to.be.undefined;
                                    expect(orderDb.status).to.be.equal('placed');
                                    // console.log(`orderDb.timestamps.placedAt: ${JSON.stringify(orderDb.timestamps.placedAt, null, 2)}`);
                                    // Now less 5 min.
                                    let someMunutesEarly = new Date();
                                    someMunutesEarly.setMinutes(someMunutesEarly.getMinutes - 2);
                                    // console.log(`type of orderDb.timestamps.paidAt: ${typeof orderDb.timestamps.paidAt}`);
                                    expect(orderDb.timestamps.placedAt).to.not.be.above(someMunutesEarly);
                                    expect(orderDb.items, "No one order item").to.not.be.empty;
                                    // Total price
                                    let totalPrice = 0;
                                    zoomOrderTest.items.forEach(item=>{
                                        totalPrice += item.total;
                                    });
                                    if (zoomOrderTest.total_discount_value) { totalPrice -= zoomOrderTest.total_discount_value };
                                    expect(parseFloat(orderDb.subtotalPrice)).to.be.above(0);
                                    // console.log(`orderDb.subtotalPrice: ${orderDb.subtotalPrice}`);
                                    // console.log(`totalPrice: ${totalPrice}`);
                                    expect(parseFloat(orderDb.subtotalPrice)).to.be.equal(totalPrice);
                                    // expect(parseFloat(orderDb.totalPrice)).to.be.equal(totalPrice + zoomOrderTest.shipping.freight_price);
                                    expect(orderDb.totalPrice).to.be.equal((totalPrice + zoomOrderTest.shipping.freight_price).toFixed(2));
                                    expect(orderDb.user_id.toString()).to.be.equal('123456789012345678901234');
                                    expect(orderDb.name).to.be.equal(zoomOrderTest.customer.first_name);
                                    expect(orderDb.email).to.be.equal('zoom@zoom.com.br');
                                    expect(orderDb.cpf).to.be.equal(zoomOrderTest.customer.cpf);
                                    expect(orderDb.mobileNumber).to.be.equal(zoomOrderTest.customer.user_phone);
                                    done();
                                    // // Delete created test order.
                                    // order.remove(err=>{
                                    // expect(err).to.be.null;
                                    // done();
                                    // });
                                }).catch(err=>{
                                    console.log(err.stack);
                                });
                        });
                });
            })
        });
        it('Approved payment zoom order', done=>{
            this.timeout(3000);
            // Mock request.
            zoomOrderTest.status = 'ApprovedPayment';
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderTest);
            // Url request.
            request(server)
                .post('/ext/zoom/order-status')
                .send({ "orderNumber": zoomOrderId, "status": "ApprovedPayment" })
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(200);
                    // Check if order was created.
                    Order.find({}, {}).sort({"timestamps.paidAt": -1}).limit(1)
                        .then(docs=>{
                            let orderDb = docs[0];
                            expect(orderDb).to.not.be.null;
                            expect(orderDb.externalOrderNumber).to.not.be.empty;
                            expect(orderDb.externalOrderNumber).to.be.equal(zoomOrderTest.order_number);
                            expect(orderDb.timestamps).to.not.be.null;
                            expect(orderDb.timestamps.placedAt).to.not.be.null;
                            expect(orderDb.timestamps.paidAt).to.not.be.null;
                            expect(orderDb.status).to.be.equal('paid');
                            // console.log(`orderDb.timestamps.placedAt: ${JSON.stringify(orderDb.timestamps.placedAt, null, 2)}`);
                            // Now less 5 min.
                            let someMunutesEarly = new Date();
                            someMunutesEarly.setMinutes(someMunutesEarly.getMinutes - 2);
                            // console.log(`type of orderDb.timestamps.paidAt: ${typeof orderDb.timestamps.paidAt}`);
                            expect(orderDb.timestamps.paidAt).to.not.be.above(someMunutesEarly);
                            expect(orderDb.items, "No one order item").to.not.be.empty;
                            // Total price
                            let totalPrice = 0;
                            zoomOrderTest.items.forEach(item=>{
                                totalPrice += item.total;
                            });
                            if (zoomOrderTest.total_discount_value) { totalPrice -= zoomOrderTest.total_discount_value };
                            expect(parseFloat(orderDb.subtotalPrice)).to.be.above(0);
                            // console.log(`orderDb.subtotalPrice: ${orderDb.subtotalPrice}`);
                            // console.log(`totalPrice: ${totalPrice}`);
                            expect(parseFloat(orderDb.subtotalPrice)).to.be.equal(totalPrice);
                            // expect(parseFloat(orderDb.totalPrice)).to.be.equal(totalPrice + zoomOrderTest.shipping.freight_price);
                            expect(orderDb.totalPrice).to.be.equal((totalPrice + zoomOrderTest.shipping.freight_price).toFixed(2));
                            expect(orderDb.user_id.toString()).to.be.equal('123456789012345678901234');
                            expect(orderDb.name).to.be.equal(zoomOrderTest.customer.first_name);
                            expect(orderDb.email).to.be.equal('zoom@zoom.com.br');
                            expect(orderDb.cpf).to.be.equal(zoomOrderTest.customer.cpf);
                            expect(orderDb.mobileNumber).to.be.equal(zoomOrderTest.customer.user_phone);
                            done();
                        }).catch(err=>{
                            console.log(err.stack);
                        });
                });
        });
        it('Canceled zoom order', done=>{
            this.timeout(3000);
            // Mock request.
            zoomOrderTest.status = 'Canceled';
            nock(s.zoom.host)
                .get(`/order/${zoomOrderId}`)
                .reply(200, zoomOrderTest);
            // Url request.
            request(server)
                .post('/ext/zoom/order-status')
                .send({ "orderNumber": zoomOrderId, "status": "Canceled" })
                .end((err, res)=>{
                    expect(res.statusCode).to.be.equal(200);
                    // Check if order was created.
                    Order.find({}, {}).sort({"timestamps.canceledAt": -1}).limit(1)
                        .then(docs=>{
                            let orderDb = docs[0];
                            expect(orderDb).to.not.be.null;
                            expect(orderDb.externalOrderNumber).to.not.be.empty;
                            expect(orderDb.externalOrderNumber).to.be.equal(zoomOrderTest.order_number);
                            expect(orderDb.timestamps).to.not.be.null;
                            expect(orderDb.timestamps.placedAt).to.not.be.null;
                            expect(orderDb.timestamps.canceledAt).to.not.be.null;
                            expect(orderDb.status).to.be.equal('canceled');
                            // console.log(`orderDb.timestamps.placedAt: ${JSON.stringify(orderDb.timestamps.placedAt, null, 2)}`);
                            // Now less 5 min.
                            let someMunutesEarly = new Date();
                            someMunutesEarly.setMinutes(someMunutesEarly.getMinutes - 2);
                            // console.log(`type of orderDb.timestamps.paidAt: ${typeof orderDb.timestamps.paidAt}`);
                            expect(orderDb.timestamps.canceledAt).to.not.be.above(someMunutesEarly);
                            expect(orderDb.items, "No one order item").to.not.be.empty;
                            // Total price
                            let totalPrice = 0;
                            zoomOrderTest.items.forEach(item=>{
                                totalPrice += item.total;
                            });
                            if (zoomOrderTest.total_discount_value) { totalPrice -= zoomOrderTest.total_discount_value };
                            expect(parseFloat(orderDb.subtotalPrice)).to.be.above(0);
                            // console.log(`orderDb.subtotalPrice: ${orderDb.subtotalPrice}`);
                            // console.log(`totalPrice: ${totalPrice}`);
                            // expect(parseFloat(orderDb.subtotalPrice)).to.be.equal(totalPrice);
                            // expect(parseFloat(orderDb.totalPrice)).to.be.equal(totalPrice + zoomOrderTest.shipping.freight_price);
                            expect(orderDb.subtotalPrice).to.be.equal(totalPrice.toFixed(2));
                            expect(orderDb.totalPrice).to.be.equal((totalPrice + zoomOrderTest.shipping.freight_price).toFixed(2));
                            expect(orderDb.user_id.toString()).to.be.equal('123456789012345678901234');
                            expect(orderDb.name).to.be.equal(zoomOrderTest.customer.first_name);
                            expect(orderDb.email).to.be.equal('zoom@zoom.com.br');
                            expect(orderDb.cpf).to.be.equal(zoomOrderTest.customer.cpf);
                            expect(orderDb.mobileNumber).to.be.equal(zoomOrderTest.customer.user_phone);
                            done();
                        }).catch(err=>{
                            console.log(err.stack);
                        });
                });
        });
    });
});