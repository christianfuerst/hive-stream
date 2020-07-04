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
class Exchange {
    constructor() {
        this.oneHour = 1000 * 60 * 60;
    }
    updateRates() {
        return __awaiter(this, void 0, void 0, function* () {
            const HOUR_AGO = Date.now() - this.oneHour;
            // Only fetch once per hour
            if (this.lastFetch && this.lastFetch < HOUR_AGO) {
                return false;
            }
            const rates = yield this.fetchRates();
            if (rates) {
                this.lastFetch = Date.now();
            }
            return rates;
        });
    }
    fetchRates() {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
}
exports.Exchange = Exchange;
//# sourceMappingURL=exchange.js.map