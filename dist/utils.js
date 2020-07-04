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
const hive_rates_1 = require("./hive-rates");
const dhive_1 = require("@hiveio/dhive");
const seedrandom_1 = __importDefault(require("seedrandom"));
const MAX_PAYLOAD_SIZE = 2000;
const MAX_ACCOUNTS_CHECK = 999;
exports.Utils = {
    // https://flaviocopes.com/javascript-sleep/
    sleep(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },
    // Fisher Yates shuffle
    shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    roundPrecision(value, precision) {
        const NUMBER_SIGN = value >= 0 ? 1 : -1;
        return parseFloat((Math.round((value * Math.pow(10, precision)) + (NUMBER_SIGN * 0.0001)) / Math.pow(10, precision)).toFixed(precision));
    },
    randomRange(min = 0, max = 2000) {
        return (!isNaN(min) && !isNaN(max) ? Math.floor(Math.random() * (max - min + 1)) + min : NaN);
    },
    randomString(length = 12) {
        let str = '';
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const max = characters.length - 1;
        for (let i = 0; i < length; i++) {
            str += characters[exports.Utils.randomRange(0, max)];
        }
        return str;
    },
    convertHiveAmount(amount, fiatSymbol, hiveSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fiatSymbol === hiveSymbol) {
                return amount;
            }
            const rates = new hive_rates_1.HiveRates();
            yield rates.fetchRates();
            const rate = rates.fiatToHiveRate(fiatSymbol, hiveSymbol);
            const total = amount / rate;
            return rate > 0 ? exports.Utils.roundPrecision(total, 3) : 0;
        });
    },
    jsonParse(str) {
        let obj = null;
        try {
            obj = JSON.parse(str);
        }
        catch (_a) {
            // We don't do anything
        }
        return obj;
    },
    getTransaction(client, blockNumber, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield client.database.getBlock(blockNumber);
            const exists = block.transaction_ids.includes(transactionId);
            const index = block.transaction_ids.indexOf(transactionId);
            if (!exists) {
                throw new Error(`Unable to find transaction ${transactionId} in block ${blockNumber}`);
            }
            return block.transactions[index];
        });
    },
    verifyTransfer(transaction, from, to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = transaction.operations[0][1];
            return (operation.from === from && operation.to === to && operation.amount === amount);
        });
    },
    transferHiveTokens(client, config, from, to, amount, symbol, memo = '') {
        const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
        return client.broadcast.transfer({ from, to, amount: `${parseFloat(amount).toFixed(3)} ${symbol}`, memo }, key);
    },
    transferHiveTokensMultiple(client, config, from, accounts, amount = '0', symbol, memo) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
            let completed = 0;
            for (const user of accounts) {
                const to = user.replace('@', '');
                yield client.broadcast.transfer({ from, to, amount: `${parseFloat(amount).toFixed(3)} ${symbol}`, memo }, key);
                completed++;
                yield this.sleep(3000);
            }
            if (completed === accounts.length) {
                return true;
            }
        });
    },
    getAccountTransfers(client, account, from = -1, max = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield client.call('condenser_api', 'get_account_history', [account, from, max]);
            const transfers = history.filter(tx => tx[1].op[0] === 'transfer');
            const actualTransfers = transfers.reduce((arr, tx) => {
                const transaction = tx[1].op[1];
                const date = new Date(`${tx[1].timestamp}Z`);
                transaction.date = date;
                arr.push(transaction);
                return arr;
            }, []);
            return actualTransfers;
        });
    },
    getApiJson(client, from = -1, limit = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield client.call('condenser_api', 'get_account_history', ['hiveapi', from, limit]);
            const customJson = history.filter(tx => tx[1].op[0] === 'custom_json');
            const actualJson = customJson.reduce((arr, tx) => {
                const transaction = tx[1].op[1];
                const date = new Date(`${tx[1].timestamp}Z`);
                transaction.date = date;
                arr.push(transaction);
                return arr;
            }, []);
            return actualJson;
        });
    },
    transferHiveEngineTokens(client, config, from, to, quantity, symbol, memo = '') {
        const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
        const json = {
            contractName: 'tokens',
            contractAction: 'transfer',
            contractPayload: {
                symbol: symbol.toUpperCase(),
                to,
                quantity,
                memo,
            }
        };
        return client.broadcast.json({ required_auths: [from], required_posting_auths: [], id: config.HIVE_ENGINE_ID, json: JSON.stringify(json) }, key);
    },
    transferHiveEngineTokensMultiple(client, config, from, accounts, symbol, memo, amount = '0') {
        return __awaiter(this, void 0, void 0, function* () {
            const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
            const payloads = [[]];
            let completed = 0;
            for (const user of accounts) {
                const account = user.account.replace('@', '');
                const quantity = user.amount ? parseFloat(user.amount.replace(',', '.')).toString() : parseFloat(amount).toString();
                // 0 means no quantity supplied (either in accounts or default)	
                if (parseFloat(quantity) > 0) {
                    const json = {
                        contractName: 'tokens',
                        contractAction: 'transfer',
                        contractPayload: {
                            symbol: symbol.toUpperCase(),
                            to: account,
                            quantity,
                            memo,
                        },
                    };
                    const lastPayloadSize = JSON.stringify(payloads[payloads.length - 1]).length;
                    const payloadSize = JSON.stringify(json).length;
                    if (payloadSize + lastPayloadSize > MAX_PAYLOAD_SIZE) {
                        payloads.push([json]);
                    }
                    else {
                        payloads[payloads.length - 1].push(json);
                    }
                }
            }
            for (const payload of payloads) {
                const requiredAuths = [from];
                const requiredPostingAuths = [];
                yield client.broadcast.json({ required_auths: requiredAuths, required_posting_auths: requiredPostingAuths, id: config.HIVE_ENGINE_ID, json: JSON.stringify(payload) }, key);
                completed++;
                if (completed !== (payloads.length) && completed !== 0) {
                    yield this.sleep(3000);
                }
            }
        });
    },
    issueHiveEngineTokens(client, config, from, to, symbol, quantity, memo = '') {
        const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
        const json = {
            contractName: 'tokens',
            contractAction: 'issue',
            contractPayload: {
                symbol,
                to,
                quantity,
                memo,
            },
        };
        if (config.DEBUG_MODE) {
            console.log(`Issuing Hive Engine Token: `, json, JSON.stringify(json));
        }
        return client.broadcast.json({ required_auths: [from], required_posting_auths: [], id: config.HIVE_ENGINE_ID, json: JSON.stringify(json) }, key);
    },
    issueHiveEngineTokensMultiple(client, config, from, accounts, symbol, memo, amount = '0') {
        return __awaiter(this, void 0, void 0, function* () {
            const key = dhive_1.PrivateKey.fromString(config.ACTIVE_KEY);
            const payloads = [[]];
            let completed = 0;
            for (const user of accounts) {
                const to = user.account.replace('@', '');
                const quantity = user.amount ? parseFloat(user.amount.replace(',', '.')).toString() : parseFloat(amount).toString();
                // 0 means no quantity supplied (either in accounts or default)
                if (parseFloat(quantity) > 0) {
                    const json = {
                        contractName: 'tokens',
                        contractAction: 'issue',
                        contractPayload: {
                            symbol: symbol.toUpperCase(),
                            to,
                            quantity,
                            memo,
                        },
                    };
                    const lastPayloadSize = JSON.stringify(payloads[payloads.length - 1]).length;
                    const payloadSize = JSON.stringify(json).length;
                    if (payloadSize + lastPayloadSize > MAX_PAYLOAD_SIZE) {
                        payloads.push([json]);
                    }
                    else {
                        payloads[payloads.length - 1].push(json);
                    }
                }
            }
            for (const payload of payloads) {
                const requiredAuths = [from];
                const requiredPostingAuths = null;
                yield client.broadcast.json({ required_auths: requiredAuths, required_posting_auths: requiredPostingAuths, id: config.HIVE_ENGINE_ID, json: JSON.stringify(payload) }, key);
                completed++;
                if (completed !== (payloads.length) && completed !== 0) {
                    yield this.sleep(3000);
                }
            }
        });
    },
    randomNumber(previousBlockId, blockId, transactionId) {
        const random = seedrandom_1.default(`${previousBlockId}${blockId}${transactionId}`).double();
        const randomRoll = Math.floor(random * 100) + 1;
        return randomRoll;
    },
    upvote(client, config, voter, votePercentage = '100.0', author, permlink) {
        const percentage = parseFloat(votePercentage);
        const key = dhive_1.PrivateKey.fromString(config.POSTING_KEY);
        if (percentage < 0) {
            throw new Error('Negative voting values are for downvotes, not upvotes');
        }
        const weight = this.votingWeight(percentage);
        return client.broadcast.vote({ voter, author, permlink, weight }, key);
    },
    downvote(client, config, voter, votePercentage = '100.0', author, permlink) {
        const weight = this.votingWeight(parseFloat(votePercentage)) * -1;
        const key = dhive_1.PrivateKey.fromString(config.POSTING_KEY);
        return client.broadcast.vote({ voter, author, permlink, weight }, key);
    },
    votingWeight(votePercentage) {
        return Math.min(Math.floor(parseFloat(votePercentage.toFixed(2)) * 100), 10000);
    },
    asyncForEach(array, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let index = 0; index < array.length; index++) {
                yield callback(array[index], index, array);
            }
        });
    },
    getTransferUrl(to, memo, amount, redirectUri) {
        return `https://hivesigner.com/sign/transfer?to=${to}&memo=${memo}&amount=${amount}&redirect_uri=${redirectUri}`;
    }
};
//# sourceMappingURL=utils.js.map