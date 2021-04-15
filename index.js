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

  const fullMarket = await binanceClient.fetchTicker(market);

  console.log(`- ${timeslug} - Base Balance for `,base, baseBalance)
  console.log(`- ${timeslug} - Latest price of ${asset} = ${fullMarket.ask}`)

  //if base coin available then create a market buy and limit sell order
  if (baseBalance >= allocation) {
    //Send orders
    const buyPrice = allocation / fullMarket.ask; // buy on current market price
    console.log(`- ${timeslug} - Creating market buy order for '${market}' with ${buyPrice} @ ${fullMarket.ask}`)
    binanceClient.createMarketBuyOrder(market, buyPrice).then((result) => {
      console.log(`- ${timeslug} - Created market buy order for '${market}' with ${result.amount} @ ${result.price}`)
      // console.log(result)
      const fees = result.fee.cost || 0;//this would be fees in asset coin, which we need to reduce from our limit order
      const sellVolume = result.amount - fees;
      const sellPrice = result.price + (result.price * spread / 100); //this is the profit based on spread percentage
      console.log(`- ${timeslug} - Creating limit sell order for '${market}' with ${sellVolume} @ ${sellPrice}`)
      binanceClient.createLimitSellOrder(market, sellVolume, sellPrice).then((sellResult) => {
        console.log(`- ${timeslug} - Created limit sell order for '${market}' with ${sellResult.amount} @ ${sellResult.price}`)
      });
    })
  }
};

const run = () => {
  const config = [
    {
      asset: "TRX", // this is the target coin
      base: "USDT", // this is our base coin 
      allocation: 39,     // amount in base currency for which market buy order will be placed
      spread: 0.8,         // Percentage to book profit, based on which limit sell order will be placed
      tickInterval: 10 * 60 * 1000  // 10 mins, Duration between each tick, in milliseconds
    },
    // {
    //   asset: "BNB",
    //   base: "BUSD",
    //   allocation: 200,     // amount in base currency for which market buy order will be placed
    //   spread: 0.8,         // Percentage to book profit, based on which limit sell order will be placed
    //   tickInterval: 10 * 60 * 1000  // 10 mins, Duration between each tick, in milliseconds
    // }
  ];
  const binanceClient = new ccxt.binance({
    apiKey: process.env.APIKEY,
    secret: process.env.SECRETKEY
  });

  // TEST CONFIG BEGINS
  // https://testnet.binance.vision/
  // https://testnet.binance.org/en/trade/BUSD-227_BNB
  // binanceClient.set_sandbox_mode(true)
  // TEST CONFIG ENDS

  config.map((item) => {
    tick(item, binanceClient);
    setInterval(tick, item.tickInterval, item, binanceClient);
  });
};

run();