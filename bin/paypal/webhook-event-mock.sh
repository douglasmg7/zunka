#!/usr/bin/env bash

RES=$(curl -s -X POST localhost:3080/ext/ppp/webhook-listener/ \
  -H "Content-Type: application/json" \
  -d '{
		  "id": "WH-COC11055RA711503B-4YM959094A144403T",
		  "create_time": "2018-04-16T21:21:49.000Z",
		  "event_type": "CHECKOUT.ORDER.COMPLETED",
		  "resource_type": "checkout-order",
		  "resource_version": "2.0",
		  "summary": "Checkout Order Completed",
		  "resource": {
			"id": "5O190127TN364715T",
			"status": "COMPLETED",
			"intent": "CAPTURE",
			"gross_amount": {
			  "currency_code": "USD",
			  "value": "100.00"
			},
			"payer": {
			  "name": {
				"given_name": "John",
				"surname": "Doe"
			  },
			  "email_address": "buyer@example.com",
			  "payer_id": "QYR5Z8XDVJNXQ"
			},
			"purchase_units": [
			  {
				"reference_id": "d9f80740-38f0-11e8-b467-0ed5f89f718b",
				"amount": {
				  "currency_code": "USD",
				  "value": "100.00"
				},
				"payee": {
				  "email_address": "seller@example.com"
				},
				"shipping": {
				  "method": "United States Postal Service",
				  "address": {
					"address_line_1": "2211 N First Street",
					"address_line_2": "Building 17",
					"admin_area_2": "San Jose",
					"admin_area_1": "CA",
					"postal_code": "95131",
					"country_code": "US"
				  }
				},
				"payments": {
				  "captures": [
					{
					  "id": "3C679366HH908993F",
					  "status": "COMPLETED",
					  "amount": {
						"currency_code": "USD",
						"value": "100.00"
					  },
					  "seller_protection": {
						"status": "ELIGIBLE",
						"dispute_categories": [
						  "ITEM_NOT_RECEIVED",
						  "UNAUTHORIZED_TRANSACTION"
						]
					  },
					  "final_capture": true,
					  "seller_receivable_breakdown": {
						"gross_amount": {
						  "currency_code": "USD",
						  "value": "100.00"
						},
						"paypal_fee": {
						  "currency_code": "USD",
						  "value": "3.00"
						},
						"net_amount": {
						  "currency_code": "USD",
						  "value": "97.00"
						}
					  },
					  "create_time": "2018-04-01T21:20:49Z",
					  "update_time": "2018-04-01T21:20:49Z",
					  "links": [
						{
						  "href": "https://api.paypal.com/v2/payments/captures/3C679366HH908993F",
						  "rel": "self",
						  "method": "GET"
						},
						{
						  "href": "https://api.paypal.com/v2/payments/captures/3C679366HH908993F/refund",
						  "rel": "refund",
						  "method": "POST"
						}
					  ]
					}
				  ]
				}
			  }
			],
			"create_time": "2018-04-01T21:18:49Z",
			"update_time": "2018-04-01T21:20:49Z",
			"links": [
			  {
				"href": "https://api.paypal.com/v2/checkout/orders/5O190127TN364715T",
				"rel": "self",
				"method": "GET"
			  }
			]
		  },
		  "links": [
			{
			  "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-COC11055RA711503B-4YM959094A144403T",
			  "rel": "self",
			  "method": "GET"
			},
			{
			  "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-COC11055RA711503B-4YM959094A144403T/resend",
			  "rel": "resend",
			  "method": "POST"
			}
		  ],
		  "zts": 1494957670,
		  "event_version": "1.0"
	}'
)

echo $RES | jq -r .