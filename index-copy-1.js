
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.SECRETKEY
  });
//   console.log("****** binance",binance)
//   binance.prices().then((ticker)=>{
//     console.info(`Price of BNB: ${ticker.BNBUSDT}`);
//   })  

  binance.prices('BNBBTC', (error, ticker) => {
    console.info("Price of BNB: ", ticker.BNBBTC);
  });

  binance.futuresBalance().then((result)=>{
      console.log(result)
  });

  