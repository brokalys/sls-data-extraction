# Serverless Data Extraction Functions

[![Build Status](https://travis-ci.org/brokalys/sls-data-extraction.svg?branch=master)](https://travis-ci.org/brokalys/sls-data-extraction)
[![codebeat badge](https://codebeat.co/badges/d08012a9-e6bb-4b70-8113-37f4a31b6f6d)](https://codebeat.co/projects/github-com-brokalys-sls-data-extraction-master)

Takes care of extracting scheduled statistical data from the Brokalys real estate database.

## Requirements
- Node
- Yarn
- Serverless (installed globally)

## Installation
```sh
yarn install
```

## Usage
```sh
sls invoke local -f base-data-sell
```

### Available functions
- base-data-sell
- base-data-buy
- base-data-rent
- base-data-want-to-rent
- market-share

## Deployment
Deployment is taken care by travis. If, for some odd reason, it's required to deploy manually, it can be achieved by running the following command.

```sh
# In order to deploy all functions
sls deploy

# In order to deploy individual functions
sls deploy -f base-data-sell
```
