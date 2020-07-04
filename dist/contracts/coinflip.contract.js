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
const seedrandom_1 = __importDefault(require("seedrandom"));
const uuid_1 = require("uuid");
const CONTRACT_NAME = 'coinflip';
const ACCOUNT = 'beggars';
const TOKEN_SYMBOL = 'HIVE';
const VALID_CURRENCIES = ['HIVE'];
const MAX_AMOUNT = 20;
function rng(previousBlockId, blockId, transactionId, serverSeed, clientSeed = '') {
    const random = seedrandom_1.default(`${previousBlockId}${blockId}${transactionId}${clientSeed}${serverSeed}`).double();
    const randomRoll = Math.floor(random * 2) + 1;
    return randomRoll === 1 ? 'heads' : 'tails';
}
class CoinflipContract {
    create() {
        this.adapter = this._instance.getAdapter();
    }
    updateBlockInfo(blockNumber, blockId, previousBlockId, transactionId) {
        // Lifecycle method which sets block info 
        this.blockNumber = blockNumber;
        this.blockId = blockId;
        this.previousBlockId = previousBlockId;
        this.transactionId = transactionId;
    }
    flip(payload, { sender, amount }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { guess, seed } = payload;
            const VALID_GUESSES = ['heads', 'tails'];
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
                // User sent too much, refund the difference
                if (amountParsed > MAX_AMOUNT) {
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] You sent too much.`);
                    return;
                }
                // Invalid guess
                if (!VALID_GUESSES.includes(guess)) {
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] Invalid guess. Please only send heads or tails.`);
                    return;
                }
                const serverSeed = uuid_1.v4();
                const generatedGuess = rng(this.previousBlockId, this.blockId, this.transactionId, serverSeed, seed !== null && seed !== void 0 ? seed : '');
                if (generatedGuess === guess) {
                    yield this.adapter.addEvent(new Date(), CONTRACT_NAME, 'flip', payload, {
                        action: 'transfer',
                        data: {
                            date: new Date(),
                            guess,
                            serverSeed,
                            previousBlockId: this.previousBlockId,
                            blockId: this.blockId,
                            transactionId: this.transactionId,
                            userWon: 'true'
                        }
                    });
                    yield this._instance.transferHiveTokens(ACCOUNT, sender, (amountParsed * 2).toFixed(3), amountTrim[1], `[Winner] | Guess: ${guess} | Server Roll: ${generatedGuess} | Previous block id: ${this.previousBlockId} | BlockID: ${this.blockId} | Trx ID: ${this.transactionId} | Server Seed: ${serverSeed}`);
                    return;
                }
                yield this.adapter.addEvent(new Date(), CONTRACT_NAME, 'flip', payload, {
                    action: 'transfer',
                    data: {
                        guess,
                        serverSeed,
                        previousBlockId: this.previousBlockId,
                        blockId: this.blockId,
                        transactionId: this.transactionId,
                        userWon: 'false'
                    }
                });
                yield this._instance.transferHiveTokens(ACCOUNT, sender, '0.001', amountTrim[1], `[Lost] | Guess: ${guess} | Server Roll: ${generatedGuess} | Previous block id: ${this.previousBlockId} | BlockID: ${this.blockId} | Trx ID: ${this.transactionId} | Server Seed: ${serverSeed}`);
            }
        });
    }
}
exports.CoinflipContract = CoinflipContract;
//# sourceMappingURL=coinflip.contract.js.map