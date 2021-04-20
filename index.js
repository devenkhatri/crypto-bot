require('dotenv').config();
const ccxt = require('ccxt');
const axios = require("axios");

const dashboard = [];

const showDashboard = () => {
  console.log("**DASHBOARD**", dashboard)
  let totalProfit = 0;
  let originalAmout = 1;
  dashboard.map((item, index) => {
    if(index==0){
      originalAmout = item.buyPrice * item.buyQuantity;
    }
    totalProfit += item.profit;
  })
  console.log("**TOTAL PROFIT**", totalProfit, " @ ", (totalProfit*100/originalAmout))
}

const tick = async (config, binanceClient) => {
  const { asset, base, spread, allocation } = config;
  const market = `${asset}/${base}`;
  const timeslug = new Date();

  // get balance of base coin
  const balances = await binanceClient.fetchBalance();
  const baseBalance = balances.free[base];

  const fullMarket = await binanceClient.fetchTicker(market);

  console.log(`- ${timeslug} - Base Balance for `, base, baseBalance)
  console.log(`- ${timeslug} - Latest price of ${asset} = ${fullMarket.ask}`)

  const openOrders = await binanceClient.fetchOpenOrders(market);

  //if there NO OPEN Order of this pair and if base coin available then create a market buy and limit sell order
  if (openOrders && openOrders.length <= 0 && baseBalance >= allocation) {
    //Send orders
    const buyPrice = allocation / fullMarket.ask; // buy on current market price
    //console.log(`- ${timeslug} - Creating market buy order for '${market}' with ${buyPrice} @ ${fullMarket.ask}`)
    binanceClient.createMarketBuyOrder(market, buyPrice).then((result) => {
      console.log(`- ${timeslug} - Created market buy order for '${market}' with ${result.amount} @ ${result.price}`)
      // console.log(result)
      const fees = result.fee.cost || 0;//this would be fees in asset coin, which we need to reduce from our limit order
      const sellVolume = result.amount;// - fees;
      const sellPrice = result.price + (result.price * spread / 100); //this is the profit based on spread percentage
      //console.log(`- ${timeslug} - Creating limit sell order for '${market}' with ${sellVolume} @ ${sellPrice}`)
      binanceClient.createLimitSellOrder(market, sellVolume, sellPrice).then((sellResult) => {
        console.log(`- ${timeslug} - Created limit sell order for '${market}' with ${sellResult.amount} @ ${sellResult.price}`)
        const logItem = {
          timeslug: timeslug,
          market: market,
          buyPrice: result.price,
          buyQuantity: result.amount,
          sellPrice: sellResult.price,
          sellQuantity: sellResult.amount,
          profit: (sellResult.price * sellResult.amount) - (result.price * result.amount)
        }
        dashboard.push(logItem)
        showDashboard()
      });
    })
  }
};

const run = () => {
  const config = [
    {
      asset: "DOGE", // this is the target coin
      base: "USDT", // this is our base coin 
      allocation: 18,     // amount in base currency for which market buy order will be placed
      spread: 0.4,         // Percentage to book profit, based on which limit sell order will be placed
      tickInterval: 0.1 * 60 * 1000  // 10 mins, Duration between each tick, in milliseconds
    },
    // {
    //   asset: "TRX", // this is the target coin
    //   base: "USDT", // this is our base coin 
    //   allocation: 39,     // amount in base currency for which market buy order will be placed
    //   spread: 0.8,         // Percentage to book profit, based on which limit sell order will be placed
    //   tickInterval: 10 * 60 * 1000  // 10 mins, Duration between each tick, in milliseconds
    // },
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