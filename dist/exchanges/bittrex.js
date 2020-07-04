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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exchange_1 = require("./exchange");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
class BittrexExchange extends exchange_1.Exchange {
    constructor() {
        super(...arguments);
        this.exchangeId = 'bittrex';
    }
    fetchRates() {
        return __awaiter(this, void 0, void 0, function* () {
            const USD_BTC = new bignumber_js_1.default(yield this.fetchRate('USD', 'BTC'));
            const BTC_HIVE = new bignumber_js_1.default(yield this.fetchRate('BTC', 'HIVE'));
            const BTC_HBD = new bignumber_js_1.default(yield this.fetchRate('BTC', 'HBD'));
            if (isNaN(USD_BTC.toNumber()) || isNaN(BTC_HIVE.toNumber()) || isNaN(BTC_HBD.toNumber())) {
                return false;
            }
            const USD_HIVE = USD_BTC.multipliedBy(BTC_HIVE).toNumber();
            const USD_HBD = USD_BTC.multipliedBy(BTC_HBD).toNumber();
            this.rateUsdHive = USD_HIVE;
            this.rateUsdHbd = USD_HBD;
            return true;
        });
    }
    fetchRate(from, to) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = `https://api.bittrex.com/api/v1.1/public/getticker?market=${from}-${to}`;
            const request = yield fetch(endpoint);
            const response = yield request.json();
            if (response) {
                return (_a = response === null || response === void 0 ? void 0 : response.result) === null || _a === void 0 ? void 0 : _a.Last;
            }
            return null;
        });
    }
}
exports.BittrexExchange = BittrexExchange;
//# sourceMappingURL=bittrex.js.map