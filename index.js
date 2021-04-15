require('dotenv').config();
const ccxt = require('ccxt');
const axios = require("axios");

const tick = async (config, binanceClient) => {
  const { asset, base, spread, allocation } = config;
  const market = `${asset}/${base}`;
  const timeslug = new Date();

  // get balance of base coin
  const balances = await binanceClient.fetchBalance();
  const baseBalance = balances.free[base];
  console.log("Base Balance for ",market, baseBalance)

  const fullMarket = await binanceClient.fetchTicker(market);
  // console.log("**** Market ",fullMarket[market]['limits']['cost']['min'])
  // console.log("**** Market ",fullMarket )

  //if base coin available then create a market buy and limit sell order
  if (baseBalance >= allocation) {
    //Send orders
    const buyPrice = allocation / fullMarket.ask; // buy on current market price
    binanceClient.createMarketBuyOrder(market, buyPrice).then((result) => {
      console.log(`- ${timeslug} - Created market buy order for '${market}' with ${result.amount}@${result.price}`)
      const sellVolume = result.amount;
      const sellPrice = result.price + (result.price * spread / 100); //this is the profit based on spread percentage
      binanceClient.createLimitSellOrder(market, sellVolume, sellPrice).then((sellResult) => {
        console.log(`- ${timeslug} - Created limit sell order for '${market}' with ${sellResult.amount}@${sellResult.price}`)
      });
    })
  }
};

const run = () => {
  const config = [
    {
      asset: "BTC", // this is the target coin
      base: "BUSD", // this is our base coin 
      allocation: 200,     // amount in base currency for which market buy order will be placed
      spread: 0.8,         // Percentage to book profit, based on which limit sell order will be placed
      tickInterval: 30000//2000  // Duration between each tick, in milliseconds
    },
    {
      asset: "BNB",
      base: "USDT",
      allocation: 200,     // amount in base currency for which market buy order will be placed
      spread: 0.8,         // Percentage to book profit, based on which limit sell order will be placed
      tickInterval: 30000//2000  // Duration between each tick, in milliseconds
    }
  ];
  const binanceClient = new ccxt.binance({
    apiKey: process.env.APIKEY,
    secret: process.env.SECRETKEY
  });

  // TEST CONFIG BEGINS
  // https://testnet.binance.vision/
  // https://testnet.binance.org/en/trade/BUSD-227_BNB
  binanceClient.set_sandbox_mode(true)
  // TEST CONFIG ENDS

  config.map((item) => {
    tick(item, binanceClient);
    setInterval(tick, item.tickInterval, item, binanceClient);
  });
};

run();