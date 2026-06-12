const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({
    suppressNotices:["yahooSurvey"]
});

(async () => {
    try {
        const quote = await yahooFinance.quote("TCS.NS");
        console.log(quote.regularMarketPrice);
    } catch (err) {
        console.error(err);
    }
})();