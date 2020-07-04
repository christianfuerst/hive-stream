"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bittrex_1 = require("./exchanges/bittrex");
class HiveRates {
    constructor() {
        this.fiatRates = [];
        this.hiveRates = [];
        this.oneHour = 1000 * 60 * 60;
    }
    fetchRates() {
        return __awaiter(this, void 0, void 0, function* () {
            let hiveAverage = 0;
            let hbdAverage = 0;
            let hiveCount = 0;
            let hbdCount = 0;
            let exchangesUpdated = false;
            const exchanges = [new bittrex_1.BittrexExchange()];
            for (const exchange of exchanges) {
                const updated = yield exchange.updateRates();
                if (updated) {
                    exchangesUpdated = true;
                    const usdHiveRate = exchange.rateUsdHive;
                    const usdHbdRate = exchange.rateUsdHbd;
                    if (usdHiveRate && usdHiveRate > 0) {
                        hiveAverage += usdHiveRate;
                        hiveCount++;
                    }
                    if (Math.pow(usdHbdRate, usdHbdRate) > 0) {
                        hbdAverage += usdHbdRate;
                        hbdCount++;
                    }
                }
            }
            const fiatRates = yield this.getFiatRates();
            if (hiveCount === 0 && hbdCount === 0) {
                return false;
            }
            if (hiveCount > 0) {
                hiveAverage = hiveAverage / hiveCount;
            }
            if (hbdCount > 0) {
                hbdAverage = hbdAverage / hbdCount;
            }
            for (const [symbol, value] of Object.entries(this.fiatRates)) {
                this.hiveRates[`USD_${symbol}`] = value;
                this.hiveRates[`${symbol}_HIVE`] = hiveAverage * value;
                this.hiveRates[`${symbol}_HBD`] = hbdAverage * value;
            }
            return true;
        });
    }
    fiatToHiveRate(fiatSymbol, hiveSymbol) {
        if (!this.hiveRates) {
            return null;
        }
        if (!this.hiveRates[`${fiatSymbol}_${hiveSymbol}`]) {
            return null;
        }
        return this.hiveRates[`${fiatSymbol}_${hiveSymbol}`];
    }
    getFiatRates(base = 'USD') {
        return __awaiter(this, void 0, void 0, function* () {
            const HOUR_AGO = Date.now() - this.oneHour;
            if (this.lastFetch && this.lastFetch < HOUR_AGO) {
                return false;
            }
            const request = yield fetch(`https://api.exchangeratesapi.io/latest?base=${base}`);
            const response = yield request.json();
            const exchangeRates = response === null || response === void 0 ? void 0 : response.rates;
            if (!exchangeRates) {
                return false;
            }
            this.fiatRates = exchangeRates;
            this.lastFetch = Date.now();
            return true;
        });
    }
}
exports.HiveRates = HiveRates;
//# sourceMappingURL=hive-rates.js.map