# Serverless Data Extraction Functions

[![Build Status](https://travis-ci.org/brokalys/sls-data-extraction.svg?branch=master)](https://travis-ci.org/brokalys/sls-data-extraction)
[![codebeat badge](https://codebeat.co/badges/d08012a9-e6bb-4b70-8113-37f4a31b6f6d)](https://codebeat.co/projects/github-com-brokalys-sls-data-extraction-master)

Takes care of extracting scheduled statistical data from the Brokalys real estate database.

## Requirements
- Node
- Yarn

## Installation
```sh
yarn install
```

## Usage
```sh
yarn start -- -f base-data-sell
```

### Available functions
- base-data-sell
- base-data-buy
- base-data-rent
- base-data-want-to-rent
- market-share
- regional-data-apartment-sell-monthly
- regional-price-per-sqm-apartment-sell-monthly
- regional-data-apartment-rent-monthly
- regional-price-per-sqm-apartment-rent-monthly
- regional-data-house-sell-monthly
- regional-price-per-sqm-house-sell-monthly
- regional-data-house-rent-monthly
- regional-price-per-sqm-house-rent-monthly
- regional-data-land-sell-monthly
- regional-price-per-sqm-land-sell-monthly
- regional-data-land-rent-monthly
- regional-price-per-sqm-land-rent-monthly
- regional-data-apartment-sell-monthly-lv
- regional-price-per-sqm-apartment-sell-monthly-lv
- regional-data-apartment-rent-monthly-lv
- regional-price-per-sqm-apartment-rent-monthly-lv
- regional-data-house-sell-monthly-lv
- regional-price-per-sqm-house-sell-monthly-lv
- regional-data-house-rent-monthly-lv
- regional-price-per-sqm-house-rent-monthly-lv
- regional-data-land-sell-monthly-lv
- regional-data-land-rent-monthly-lv

## Deployment
Deployment is taken care by travis. If, for some odd reason, it's required to deploy manually, it can be achieved by running the following command.

```sh
# In order to deploy all functions
yarn deploy

# In order to deploy individual functions
yarn deploy -- -f base-data-sell
```
