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
const utils_1 = require("@hiveio/dhive/lib/utils");
const utils_2 = require("./../utils");
const seedrandom_1 = __importDefault(require("seedrandom"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const CONTRACT_NAME = 'hivelotto';
const ACCOUNT = 'beggars';
const FEE_ACCOUNT = 'beggars';
const TOKEN_SYMBOL = 'HIVE';
const VALID_CURRENCIES = ['HIVE'];
const VALID_DRAW_TYPES = ['hourly', 'daily'];
// How much does a ticket cost?
const COST = 10;
// Minimum number of entries required for draws to payout
const MIN_ENTRIES_HOURLY = 25;
const MIN_ENTRIES_DAILY = 100;
// How many winners to pick for the hourly draw
const HOURLY_WINNERS_PICK = 3;
// How many winners to pick for the daily draw
const DAILY_WINNERS_PICK = 10;
// Max tickets per user, prevents users from harvesting by overwhelmingly buying tickets
const MAX_TICKETS_PER_USER = 3;
// The percentage the site keeps (5%)
const PERCENTAGE = 5;
const COLLECTION_LOTTERY = 'lottery';
const COLLECTION_SETTINGS = 'settings';
const COLLECTION_WINNERS = 'winners';
function rng(previousBlockId, blockId, transactionId, entropy, maximum = 100) {
    const random = seedrandom_1.default(`${previousBlockId}${blockId}${transactionId}${entropy}`).double();
    const randomRoll = Math.floor(random * maximum) + 1;
    return randomRoll;
}
class LottoContract {
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            this.adapter = this._instance.getAdapter();
            const db = this.adapter['db'];
            const collection = db.collection(COLLECTION_SETTINGS);
            const settings = yield collection.findOne({});
            if (!settings) {
                collection.insertOne({
                    contractInitiated: new Date(),
                    enabled: true
                });
            }
        });
    }
    destroy() {
        // Runs every time unregister is run for this contract
        // Close database connections, write to a database with state, etc
    }
    updateBlockInfo(blockNumber, blockId, previousBlockId, transactionId) {
        // Lifecycle method which sets block info 
        this.blockNumber = blockNumber;
        this.blockId = blockId;
        this.previousBlockId = previousBlockId;
        this.transactionId = transactionId;
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield this._instance['client'].database.getAccounts([ACCOUNT]);
            if (account === null || account === void 0 ? void 0 : account[0]) {
                const balance = account[0].balance.split(' ');
                const amount = balance[0];
                return parseFloat(amount);
            }
            return null;
        });
    }
    getPreviousUserTicketsForCurrentDrawType(type, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.adapter['db'];
            const collection = db.collection(COLLECTION_LOTTERY);
            const lotto = yield collection.find({ status: 'active', type: type }).limit(1).toArray();
            if (!lotto[0] || !lotto[0].entries) {
                return 0;
            }
            const userEntries = lotto[0].entries.filter(e => e.account === account);
            return userEntries.length;
        });
    }
    buy(payload, { sender, amount }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type } = payload;
            const amountTrim = amount.split(' ');
            const amountParsed = parseFloat(amountTrim[0]);
            const amountCurrency = amountTrim[1].trim();
            const transaction = yield this._instance.getTransaction(this.blockNumber, this.transactionId);
            const verify = yield this._instance.verifyTransfer(transaction, sender, ACCOUNT, amount);
            if (verify) {
                // User sent an invalid currency
                if (!VALID_CURRENCIES.includes(amountCurrency)) {
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] You sent an invalid currency.`);
                    return;
                }
                // User did not specify a valid entry type, refund them
                if (!VALID_DRAW_TYPES.includes(type)) {
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] You specified an invalid draw type`);
                    return;
                }
                // If the user has already entered the maximum allowed times, refund them
                const previousEntriesCount = yield this.getPreviousUserTicketsForCurrentDrawType(type, sender);
                if (previousEntriesCount === MAX_TICKETS_PER_USER) {
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] You have exceeded the allow number of entries`);
                    return;
                }
                // User sent too much, refund the difference
                if (amountParsed > COST) {
                    const difference = new bignumber_js_1.default(amountParsed).minus(COST).toFixed(3);
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, difference, amountTrim[1], `[Refund] A ticket costs ${COST} HIVE. You sent ${amount}. You were refunded ${difference} HIVE.`);
                    return;
                }
                // Get database reference from adapter
                const db = this.adapter['db'];
                const collection = db.collection(COLLECTION_LOTTERY);
                // Find an active lotto draw that is of status "active" and our type
                const lotto = yield collection.find({ status: 'active', type: type }).limit(1).toArray();
                // We have a lotto
                if (lotto.length) {
                    const draw = lotto[0];
                    draw.entries.push({
                        account: sender,
                        transactionId: this.transactionId,
                        date: new Date()
                    });
                    return yield collection.replaceOne({ _id: draw._id }, draw, { upsert: true });
                }
                // We need to create a new lotto, no active draws for this type
                const entries = [{
                        account: sender,
                        transactionId: this.transactionId,
                        date: new Date()
                    }];
                return yield collection.insertOne({ status: 'active', type: type, entries });
            }
        });
    }
    drawHourlyLottery() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.adapter['db'];
            const collection = db.collection(COLLECTION_LOTTERY);
            const lotto = yield collection.find({ status: 'active', type: 'hourly' }).limit(1).toArray();
            // We found an hourly draw
            if (lotto.length) {
                const draw = lotto[0];
                const total = draw.entries.length;
                // Number of entrants is less than the minimum
                if (total < MIN_ENTRIES_HOURLY) {
                    const entrants = draw.entries.reduce((arr, entrant) => {
                        arr.push(entrant.account);
                        return arr;
                    }, []);
                    yield this._instance.transferHiveTokensMultiple(ACCOUNT, entrants, '10.000', 'HIVE', '[Refund] The hourly lotto draw did not have enough contestants.');
                    return;
                }
                const balance = yield this.getBalance();
                // Number of entrants multiplied by the entry cost is the total for this draw
                const winningsAmount = new bignumber_js_1.default(total).multipliedBy(COST).toNumber();
                // Calculate how much the account gets to keep
                const percentageFee = new bignumber_js_1.default(winningsAmount).dividedBy(100).multipliedBy(PERCENTAGE);
                // The amount minus the percentage to pay out to winners
                const payoutTotal = new bignumber_js_1.default(winningsAmount).minus(percentageFee);
                // Amount each winner gets
                const amountPerWinner = new bignumber_js_1.default(payoutTotal).dividedBy(HOURLY_WINNERS_PICK).toFixed(3);
                // Send fee percentage to fee account
                if (ACCOUNT !== FEE_ACCOUNT) {
                    yield this._instance.transferHiveTokens(ACCOUNT, FEE_ACCOUNT, percentageFee.toFixed(3), 'HIVE', 'percentage fee');
                }
                // Winnings exceed balance
                if (payoutTotal.toNumber() > balance) {
                    throw new Error('Balance is less than amount to pay out');
                }
                const winners = yield this.getWinners(HOURLY_WINNERS_PICK, draw.entries);
                if (winners) {
                    const winnerStrings = winners.reduce((arr, winner) => {
                        arr.push(winner.account);
                        return arr;
                    }, []);
                    yield this._instance.transferHiveTokensMultiple(ACCOUNT, winnerStrings, amountPerWinner, TOKEN_SYMBOL, `Congratulations you won the hourly lottery. You won ${amountPerWinner} ${TOKEN_SYMBOL}. Winners: ${winnerStrings.join(', ')}`);
                    const losers = draw.entries
                        .filter(e => {
                        return !winnerStrings.includes(e.account);
                    })
                        .reduce((unique, value) => {
                        return unique.includes(value.account) ? unique : [...unique, value.account];
                    }, []);
                    if (losers) {
                        yield this._instance.transferHiveTokensMultiple(ACCOUNT, losers, '0.001', TOKEN_SYMBOL, `Sorry, you didn't win the hourly draw. Winners: ${winnerStrings.join(', ')}`);
                    }
                }
                return winners;
            }
        });
    }
    drawDailyLottery() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.adapter['db'];
            const collection = db.collection(COLLECTION_LOTTERY);
            const lotto = yield collection.find({ status: 'active', type: 'daily' }).limit(1).toArray();
            // We found an hourly draw
            if (lotto.length) {
                const draw = lotto[0];
                const total = draw.entries.length;
                // Number of entrants is less than the minimum
                if (total < MIN_ENTRIES_DAILY) {
                    for (const entrant of draw.entries) {
                        yield this._instance.transferHiveTokens(ACCOUNT, entrant.account, '10.000', 'HIVE', '[Refund] The hourly lotto draw did not have enough contestants.');
                        yield utils_2.Utils.sleep(3000);
                    }
                    return;
                }
                const balance = yield this.getBalance();
                // Number of entrants multiplied by the entry cost is the total for this draw
                const winningsAmount = new bignumber_js_1.default(total).multipliedBy(COST).toNumber();
                // Calculate how much the account gets to keep
                const percentageFee = new bignumber_js_1.default(winningsAmount).dividedBy(100).multipliedBy(PERCENTAGE);
                // The amount minus the percentage to pay out to winners
                const payoutTotal = new bignumber_js_1.default(winningsAmount).minus(percentageFee);
                // Amount each winner gets
                const amountPerWinner = new bignumber_js_1.default(payoutTotal).dividedBy(DAILY_WINNERS_PICK).toFixed(3);
                // Send fee percentage to fee account
                if (ACCOUNT !== FEE_ACCOUNT) {
                    yield this._instance.transferHiveTokens(ACCOUNT, FEE_ACCOUNT, percentageFee.toFixed(3), 'HIVE', 'percentage fee');
                }
                // Winnings exceed balance
                if (payoutTotal.toNumber() > balance) {
                    throw new Error('Balance is less than amount to pay out');
                }
                const winners = yield this.getWinners(DAILY_WINNERS_PICK, draw.entries);
                if (winners) {
                    const winnerStrings = winners.reduce((arr, winner) => {
                        arr.push(winner.account);
                        return arr;
                    }, []);
                    yield this._instance.transferHiveTokensMultiple(ACCOUNT, winnerStrings, amountPerWinner, TOKEN_SYMBOL, `Congratulations you won the daily lottery. You won ${amountPerWinner} ${TOKEN_SYMBOL}`);
                }
                return winners;
            }
        });
    }
    getWinners(count, entries) {
        return __awaiter(this, void 0, void 0, function* () {
            let winners = [];
            utils_2.Utils.shuffle(entries);
            for (const entry of entries) {
                if (winners.length < count) {
                    const winner = entries[rng(this.previousBlockId + `${seedrandom_1.default().double()}`, this.blockId + `${seedrandom_1.default().double()}`, this.transactionId + `${seedrandom_1.default().double()}`, seedrandom_1.default().double(), entries.length - 1)];
                    winners.push(winner);
                    yield utils_1.sleep(300);
                }
                else {
                    break;
                }
            }
            return winners;
        });
    }
}
exports.LottoContract = LottoContract;
//# sourceMappingURL=lotto.contract.js.map