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
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const CONTRACT_NAME = 'hivedice';
const ACCOUNT = 'beggars';
const TOKEN_SYMBOL = 'HIVE';
const HOUSE_EDGE = 0.05;
const MIN_BET = 1;
const MAX_BET = 10;
// Random Number Generator
const rng = (previousBlockId, blockId, transactionId) => {
    const random = seedrandom_1.default(`${previousBlockId}${blockId}${transactionId}`).double();
    const randomRoll = Math.floor(random * 100) + 1;
    return randomRoll;
};
// Valid betting currencies
const VALID_CURRENCIES = ['HIVE'];
class DiceContract {
    create() {
        // Runs every time register is called on this contract
        // Do setup logic and code in here (creating a database, etc)
    }
    destroy() {
        // Runs every time unregister is run for this contract
        // Close database connections, write to a database with state, etc
    }
    // Updates the contract with information about the current block
    // This is a method automatically called if it exists
    updateBlockInfo(blockNumber, blockId, previousBlockId, transactionId) {
        // Lifecycle method which sets block info 
        this.blockNumber = blockNumber;
        this.blockId = blockId;
        this.previousBlockId = previousBlockId;
        this.transactionId = transactionId;
    }
    /**
     * Get Balance
     *
     * Helper method for getting the contract account balance. In the case of our dice contract
     * we want to make sure the account has enough money to pay out any bets
     *
     * @returns number
     */
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
    /**
     * Roll
     *
     * Automatically called when a custom JSON action matches the following method
     *
     * @param payload
     * @param param1 - sender and amount
     */
    roll(payload, { sender, amount }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Destructure the values from the payload
                const { roll } = payload;
                // The amount is formatted like 100 HIVE
                // The value is the first part, the currency symbol is the second
                const amountTrim = amount.split(' ');
                // Parse the numeric value as a real value
                const amountParsed = parseFloat(amountTrim[0]);
                // Format the amount to 3 decimal places
                const amountFormatted = parseFloat(amountTrim[0]).toFixed(3);
                // Trim any space from the currency symbol
                const amountCurrency = amountTrim[1].trim();
                // console.log(`Roll: ${roll}
                //             Amount parsed: ${amountParsed}
                //             Amount formatted: ${amountFormatted}
                //             Currency: ${amountCurrency}`);
                // Get the transaction from the blockchain
                const transaction = yield this._instance.getTransaction(this.blockNumber, this.transactionId);
                // Call the verifyTransfer method to confirm the transfer happened
                const verify = yield this._instance.verifyTransfer(transaction, sender, 'beggars', amount);
                // Get the balance of our contract account
                const balance = yield this.getBalance();
                // Transfer is valid
                if (verify) {
                    // Server balance is less than the max bet, cancel and refund
                    if (balance < MAX_BET) {
                        // Send back what was sent, the server is broke
                        yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] The server could not fufill your bet.`);
                        return;
                    }
                    // Bet amount is valid
                    if (amountParsed >= MIN_BET && amountParsed <= MAX_BET) {
                        // Validate roll is valid
                        if ((roll >= 2 && roll <= 96) && VALID_CURRENCIES.includes(amountCurrency)) {
                            // Roll a random value
                            const random = rng(this.previousBlockId, this.blockId, this.transactionId);
                            // Calculate the multiplier percentage
                            const multiplier = new bignumber_js_1.default(1).minus(HOUSE_EDGE).multipliedBy(100).dividedBy(roll);
                            // Calculate the number of tokens won
                            const tokensWon = new bignumber_js_1.default(amountParsed).multipliedBy(multiplier).toFixed(3, bignumber_js_1.default.ROUND_DOWN);
                            // Memo that shows in users memo when they win
                            const winningMemo = `You won ${tokensWon} ${TOKEN_SYMBOL}. Roll: ${random}, Your guess: ${roll}`;
                            // Memo that shows in users memo when they lose
                            const losingMemo = `You lost ${amountParsed} ${TOKEN_SYMBOL}. Roll: ${random}, Your guess: ${roll}`;
                            // User won more than the server can afford, refund the bet amount
                            if (parseFloat(tokensWon) > balance) {
                                yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] The server could not fufill your bet.`);
                                return;
                            }
                            // If random value is less than roll
                            if (random < roll) {
                                yield this._instance.transferHiveTokens(ACCOUNT, sender, tokensWon, TOKEN_SYMBOL, winningMemo);
                            }
                            else {
                                yield this._instance.transferHiveTokens(ACCOUNT, sender, '0.001', TOKEN_SYMBOL, losingMemo);
                            }
                        }
                        else {
                            // Invalid bet parameters, refund the user their bet
                            yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] Invalid bet params.`);
                        }
                    }
                    else {
                        try {
                            // We need to refund the user
                            yield this._instance.transferHiveTokens(ACCOUNT, sender, amountTrim[0], amountTrim[1], `[Refund] You sent an invalid bet amount.`);
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    // Called by our time-based action
    testauto() {
        console.log('test');
    }
}
exports.DiceContract = DiceContract;
//# sourceMappingURL=dice.contract.js.map