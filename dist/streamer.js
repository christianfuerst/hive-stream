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
const api_1 = require("./api");
const sqlite_adapter_1 = require("./adapters/sqlite.adapter");
const utils_1 = require("@hiveio/dhive/lib/utils");
const actions_1 = require("./actions");
const dhive_1 = require("@hiveio/dhive");
const utils_2 = require("./utils");
const config_1 = require("./config");
const moment_1 = __importDefault(require("moment"));
const sscjs_1 = __importDefault(require("sscjs"));
class Streamer {
    constructor(userConfig = {}) {
        this.customJsonSubscriptions = [];
        this.customJsonIdSubscriptions = [];
        this.customJsonHiveEngineSubscriptions = [];
        this.createClaimedAccountSubscriptions = [];
        this.commentSubscriptions = [];
        this.postSubscriptions = [];
        this.transferSubscriptions = [];
        this.attempts = 0;
        this.config = config_1.Config;
        this.blockNumberTimeout = null;
        this.latestBlockTimer = null;
        this.lastBlockNumber = 0;
        this.disableAllProcessing = false;
        this.contracts = [];
        this.actions = [];
        this.utils = utils_2.Utils;
        this.config = Object.assign(config_1.Config, userConfig);
        this.lastBlockNumber = this.config.LAST_BLOCK_NUMBER;
        this.username = this.config.USERNAME;
        this.postingKey = this.config.POSTING_KEY;
        this.activeKey = this.config.ACTIVE_KEY;
        this.hive = new sscjs_1.default(this.config.HIVE_ENGINE_API);
        this.client = new dhive_1.Client(this.config.API_NODES);
        this.registerAdapter(new sqlite_adapter_1.SqliteAdapter());
        new api_1.Api(this);
    }
    registerAdapter(adapter) {
        var _a;
        this.adapter = adapter;
        if ((_a = this === null || this === void 0 ? void 0 : this.adapter) === null || _a === void 0 ? void 0 : _a.create) {
            this.adapter.create();
        }
    }
    getAdapter() {
        return this.adapter;
    }
    /**
     * Register a new action
     *
     */
    registerAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const loadedActions = yield this.adapter.loadActions();
            for (const a of loadedActions) {
                const exists = this.actions.find(i => i.id === a.id);
                if (!exists) {
                    this.actions.push(new actions_1.TimeAction(a.timeValue, a.id, a.contractName, a.contractMethod, a.date));
                }
            }
            const exists = this.actions.find(a => a.id === action.id);
            if (!exists) {
                this.actions.push(action);
            }
        });
    }
    /**
     * Resets a specific action time value
     *
     * @param id
     *
     */
    resetAction(id) {
        const action = this.actions.find(i => i.id === id);
        if (action) {
            action.reset();
        }
    }
    registerContract(name, contract) {
        // Store an instance of the streamer
        contract['_instance'] = this;
        // Call the contract create lifecycle method if it exists
        if (contract && typeof contract['create'] !== 'undefined') {
            contract.create();
        }
        const storedReference = { name, contract };
        // Push the contract reference to be called later on
        this.contracts.push(storedReference);
        return this;
    }
    unregisterContract(name) {
        // Find the registered contract by it's ID
        const contractIndex = this.contracts.findIndex(c => c.name === name);
        if (contractIndex >= 0) {
            // Get the contract itself
            const contract = this.contracts.find(c => c.name === name);
            // Call the contract destroy lifecycle method if it exists
            if (contract && typeof contract.contract['destroy'] !== 'undefined') {
                contract.contract.destroy();
            }
            // Remove the contract
            this.contracts.splice(contractIndex, 1);
        }
    }
    /**
     * setConfig
     *
     * Allows specific configuration settings to be overridden
     *
     * @param config
     */
    setConfig(config) {
        Object.assign(this.config, config);
        // Set keys and username incase they have changed
        this.username = this.config.USERNAME;
        this.postingKey = this.config.POSTING_KEY;
        this.activeKey = this.config.ACTIVE_KEY;
        return this;
    }
    /**
     * Start
     *
     * Starts the streamer bot to get blocks from the Hive API
     *
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.DEBUG_MODE) {
                console.log('Starting to stream the Hive blockchain');
            }
            this.disableAllProcessing = false;
            const state = yield this.adapter.loadState();
            if (this.config.DEBUG_MODE) {
                console.log(`Restoring state from file`);
            }
            if (state === null || state === void 0 ? void 0 : state.lastBlockNumber) {
                if (state.lastBlockNumber) {
                    this.lastBlockNumber = state.lastBlockNumber;
                }
            }
            // Kicks off the blockchain streaming and operation parsing
            this.getBlock();
            this.latestBlockTimer = setInterval(() => { this.getLatestBlock(); }, this.config.BLOCK_CHECK_INTERVAL);
            return this;
        });
    }
    /**
     * Stop
     *
     * Stops the streamer from running
     */
    stop() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.disableAllProcessing = true;
            if (this.blockNumberTimeout) {
                clearTimeout(this.blockNumberTimeout);
            }
            if (this.latestBlockTimer) {
                clearInterval(this.latestBlockTimer);
            }
            if ((_a = this === null || this === void 0 ? void 0 : this.adapter) === null || _a === void 0 ? void 0 : _a.destroy) {
                this.adapter.destroy();
            }
            yield utils_1.sleep(800);
        });
    }
    getLatestBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const props = yield this.client.database.getDynamicGlobalProperties();
            if (props) {
                this.latestBlockchainTime = new Date(`${props.time}Z`);
            }
        });
    }
    getBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Load global properties from the Hive API
                const props = yield this.client.database.getDynamicGlobalProperties();
                // We have no props, so try loading them again.
                if (!props && !this.disableAllProcessing) {
                    this.blockNumberTimeout = setTimeout(() => {
                        this.getBlock();
                    }, this.config.BLOCK_CHECK_INTERVAL);
                    return;
                }
                // If the block number we've got is zero
                // set it to the last irreversible block number
                if (this.lastBlockNumber === 0) {
                    this.lastBlockNumber = props.head_block_number - 1;
                }
                if (this.config.DEBUG_MODE) {
                    console.log(`Head block number: `, props.head_block_number);
                    console.log(`Last block number: `, this.lastBlockNumber);
                }
                const BLOCKS_BEHIND = parseInt(this.config.BLOCKS_BEHIND_WARNING, 10);
                // We are more than 25 blocks behind, uh oh, we gotta catch up
                if (props.head_block_number >= (this.lastBlockNumber + BLOCKS_BEHIND) && this.config.DEBUG_MODE) {
                    console.log(`We are more than ${BLOCKS_BEHIND} blocks behind ${props.head_block_number}, ${(this.lastBlockNumber + BLOCKS_BEHIND)}`);
                }
                if (!this.disableAllProcessing) {
                    yield this.loadBlock(this.lastBlockNumber + 1);
                }
                // Storing timeout allows us to clear it, as this just calls itself
                if (!this.disableAllProcessing) {
                    this.blockNumberTimeout = setTimeout(() => { this.getBlock(); }, this.config.BLOCK_CHECK_INTERVAL);
                }
            }
            catch (e) {
                const message = e.message.toLowerCase();
                console.error(message);
            }
        });
    }
    // Takes the block from Hive and allows us to work with it
    loadBlock(blockNumber) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Load the block itself from the Hive API
            const block = yield this.client.database.getBlock(blockNumber);
            // The block doesn't exist, wait and try again
            if (!block) {
                yield utils_2.Utils.sleep(this.config.BLOCK_CHECK_INTERVAL);
                return;
            }
            // Get the block date and time
            const blockTime = new Date(`${block.timestamp}Z`);
            if (this.lastBlockNumber !== blockNumber) {
                this.processActions();
            }
            this.blockId = block.block_id;
            this.previousBlockId = block.previous;
            this.transactionId = block.transaction_ids[1];
            this.blockTime = blockTime;
            if ((_a = this.adapter) === null || _a === void 0 ? void 0 : _a.processBlock) {
                this.adapter.processBlock(block);
            }
            // Loop over all transactions in the block
            for (const [i, transaction] of Object.entries(block.transactions)) {
                // Loop over operations in the block
                for (const [opIndex, op] of Object.entries(transaction.operations)) {
                    // For every operation, process it
                    yield this.processOperation(op, blockNumber, block.block_id, block.previous, block.transaction_ids[i], blockTime);
                }
            }
            this.lastBlockNumber = blockNumber;
            this.saveStateToDisk();
        });
    }
    processOperation(op, blockNumber, blockId, prevBlockId, trxId, blockTime) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if ((_a = this.adapter) === null || _a === void 0 ? void 0 : _a.processOperation) {
            this.adapter.processOperation(op, blockNumber, blockId, prevBlockId, trxId, blockTime);
        }
        // Operation is a "comment" which could either be a post or comment
        if (op[0] === 'comment') {
            // This is a post
            if (op[1].parent_author === '') {
                this.postSubscriptions.forEach(sub => {
                    sub.callback(op[1], blockNumber, blockId, prevBlockId, trxId, blockTime);
                });
                // This is a comment
            }
            else {
                this.commentSubscriptions.forEach(sub => {
                    sub.callback(op[1], blockNumber, blockId, prevBlockId, trxId, blockTime);
                });
            }
        }
        // This is a transfer
        if (op[0] === 'transfer') {
            const sender = (_b = op[1]) === null || _b === void 0 ? void 0 : _b.from;
            const amount = (_c = op[1]) === null || _c === void 0 ? void 0 : _c.amount;
            const json = utils_2.Utils.jsonParse(op[1].memo);
            if ((json === null || json === void 0 ? void 0 : json[this.config.PAYLOAD_IDENTIFIER]) && ((_d = json === null || json === void 0 ? void 0 : json[this.config.PAYLOAD_IDENTIFIER]) === null || _d === void 0 ? void 0 : _d.id) === this.config.JSON_ID) {
                // Pull out details of contract
                const { name, action, payload } = json[this.config.PAYLOAD_IDENTIFIER];
                // Do we have a contract that matches the name in the payload?
                const contract = this.contracts.find(c => c.name === name);
                if (contract) {
                    if ((_e = this === null || this === void 0 ? void 0 : this.adapter) === null || _e === void 0 ? void 0 : _e.processTransfer) {
                        this.adapter.processTransfer(op[1], { name, action, payload }, { sender, amount });
                    }
                    if ((_f = contract === null || contract === void 0 ? void 0 : contract.contract) === null || _f === void 0 ? void 0 : _f.updateBlockInfo) {
                        contract.contract.updateBlockInfo(blockNumber, blockId, prevBlockId, trxId);
                    }
                    if (contract === null || contract === void 0 ? void 0 : contract.contract[action]) {
                        contract.contract[action](payload, { sender, amount });
                    }
                }
            }
            this.transferSubscriptions.forEach(sub => {
                if (sub.account === op[1].to) {
                    sub.callback(op[1], blockNumber, blockId, prevBlockId, trxId, blockTime);
                }
            });
        }
        // This is a custom JSON operation
        if (op[0] === 'custom_json') {
            let isSignedWithActiveKey = false;
            let sender;
            const id = (_g = op[1]) === null || _g === void 0 ? void 0 : _g.id;
            if (((_j = (_h = op[1]) === null || _h === void 0 ? void 0 : _h.required_auths) === null || _j === void 0 ? void 0 : _j.length) > 0) {
                sender = op[1].required_auths[0];
                isSignedWithActiveKey = true;
            }
            else if (((_l = (_k = op[1]) === null || _k === void 0 ? void 0 : _k.required_posting_auths) === null || _l === void 0 ? void 0 : _l.length) > 0) {
                sender = op[1].required_posting_auths[0];
                isSignedWithActiveKey = false;
            }
            const json = utils_2.Utils.jsonParse(op[1].json);
            if (json && (json === null || json === void 0 ? void 0 : json[this.config.PAYLOAD_IDENTIFIER]) && id === this.config.JSON_ID) {
                // Pull out details of contract
                const { name, action, payload } = json[this.config.PAYLOAD_IDENTIFIER];
                // Do we have a contract that matches the name in the payload?
                const contract = this.contracts.find(c => c.name === name);
                if (contract) {
                    this.adapter.processCustomJson(op[1], { name, action, payload }, { sender, isSignedWithActiveKey });
                    if ((_m = contract === null || contract === void 0 ? void 0 : contract.contract) === null || _m === void 0 ? void 0 : _m.updateBlockInfo) {
                        contract.contract.updateBlockInfo(blockNumber, blockId, prevBlockId, trxId);
                    }
                    if (contract === null || contract === void 0 ? void 0 : contract.contract[action]) {
                        contract.contract[action](payload, { sender, isSignedWithActiveKey }, id);
                    }
                }
            }
            this.customJsonSubscriptions.forEach(sub => {
                sub.callback(op[1], { sender, isSignedWithActiveKey }, blockNumber, blockId, prevBlockId, trxId, blockTime);
            });
            this.customJsonIdSubscriptions.forEach(sub => {
                const byId = this.customJsonIdSubscriptions.find(s => s.id === op[1].id);
                if (byId) {
                    sub.callback(op[1], { sender, isSignedWithActiveKey }, blockNumber, blockId, prevBlockId, trxId, blockTime);
                }
            });
            utils_2.Utils.asyncForEach(this.customJsonHiveEngineSubscriptions, (sub) => __awaiter(this, void 0, void 0, function* () {
                let isSignedWithActiveKey = null;
                let sender;
                if (op[1].required_auths.length > 0) {
                    sender = op[1].required_auths[0];
                    isSignedWithActiveKey = true;
                }
                else {
                    sender = op[1].required_posting_auths[0];
                    isSignedWithActiveKey = false;
                }
                const id = op[1].id;
                const json = utils_2.Utils.jsonParse(op[1].json);
                // Hive Engine JSON operation
                if (id === this.config.HIVE_ENGINE_ID) {
                    const { contractName, contractAction, contractPayload } = json;
                    try {
                        // Attempt to get the transaction from Hive Engine itself
                        const txInfo = yield this.hive.getTransactionInfo(trxId);
                        const logs = txInfo && txInfo.logs ? utils_2.Utils.jsonParse(txInfo.logs) : null;
                        // Do we have a valid transaction and are there no errors? It's a real transaction
                        if (txInfo && logs && typeof logs.errors === 'undefined') {
                            sub.callback(contractName, contractAction, contractPayload, sender, op[1], blockNumber, blockId, prevBlockId, trxId, blockTime);
                        }
                    }
                    catch (e) {
                        console.error(e);
                        return;
                    }
                }
            }));
        }
        if (op[0] === 'create_claimed_account') {
            this.createClaimedAccountSubscriptions.forEach(sub => {
                sub.callback(op[1], blockNumber, blockId, prevBlockId, trxId, blockTime);
            });
        }
    }
    processActions() {
        var _a;
        const blockDate = moment_1.default.utc(this.latestBlockchainTime);
        for (const action of this.actions) {
            const date = moment_1.default.utc(action.date);
            const frequency = action.timeValue;
            const contract = this.contracts.find(c => c.name === action.contractName);
            // Contract doesn't exist or action doesn't exist, carry on
            if (!contract || !((_a = contract === null || contract === void 0 ? void 0 : contract.contract) === null || _a === void 0 ? void 0 : _a[action.contractMethod])) {
                continue;
            }
            let difference = 0;
            switch (frequency) {
                case '3s':
                case 'block':
                    difference = date.diff(blockDate, 's');
                    // 3 seconds or more has passed
                    if (difference >= 3) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '10s':
                    difference = blockDate.diff(date, 's');
                    // 10 seconds or more has passed
                    if (difference >= 10) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '30s':
                    difference = blockDate.diff(date, 's');
                    // 30 seconds or more has passed
                    if (difference >= 30) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '1m':
                case 'minute':
                    difference = blockDate.diff(date, 'm');
                    // One minute has passed
                    if (difference >= 1) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '15m':
                case 'quarter':
                    difference = blockDate.diff(date, 'm');
                    // 15 minutes has passed
                    if (difference >= 15) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '30m':
                case 'halfhour':
                    difference = blockDate.diff(date, 'm');
                    // 30 minutes has passed
                    if (difference >= 30) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case 'hourly':
                case '1h':
                    difference = blockDate.diff(date, 'h');
                    // One our or more has passed
                    if (difference >= 1) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '12h':
                case 'halfday':
                    difference = blockDate.diff(date, 'h');
                    // Twelve hours or more has passed
                    if (difference >= 12) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case '24h':
                case 'day':
                    difference = blockDate.diff(date, 'd');
                    // One day (24 hours) has passed
                    if (difference >= 1) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
                case 'week':
                    difference = blockDate.diff(date, 'w');
                    // One week has passed
                    if (difference >= 1) {
                        contract.contract[action.contractMethod](action.payload);
                        action.reset();
                    }
                    break;
            }
        }
    }
    saveStateToDisk() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if ((_a = this.adapter) === null || _a === void 0 ? void 0 : _a.saveState) {
                this.adapter.saveState({ lastBlockNumber: this.lastBlockNumber, actions: this.actions });
            }
        });
    }
    saveToHiveApi(from, data) {
        return utils_2.Utils.transferHiveTokens(this.client, this.config, from, 'hiveapi', '0.001', 'HIVE', data);
    }
    getAccountTransfers(account, from = -1, limit = 100) {
        return utils_2.Utils.getAccountTransfers(this.client, account, from, limit);
    }
    transferHiveTokens(from, to, amount, symbol, memo = '') {
        return utils_2.Utils.transferHiveTokens(this.client, this.config, from, to, amount, symbol, memo);
    }
    transferHiveTokensMultiple(from, accounts = [], amount = '0', symbol, memo = '') {
        return utils_2.Utils.transferHiveTokensMultiple(this.client, this.config, from, accounts, amount, symbol, memo);
    }
    transferHiveEngineTokens(from, to, symbol, quantity, memo = '') {
        return utils_2.Utils.transferHiveEngineTokens(this.client, this.config, from, to, symbol, quantity, memo);
    }
    transferHiveEngineTokensMultiple(from, accounts = [], symbol, memo = '', amount = '0') {
        return utils_2.Utils.transferHiveEngineTokensMultiple(this.client, this.config, from, accounts, symbol, memo, amount);
    }
    issueHiveEngineTokens(from, to, symbol, quantity, memo = '') {
        return utils_2.Utils.issueHiveEngineTokens(this.client, this.config, from, to, symbol, quantity, memo);
    }
    issueHiveEngineTokensMultiple(from, accounts = [], symbol, memo = '', amount = '0') {
        return utils_2.Utils.issueHiveEngineTokensMultiple(this.client, this.config, from, accounts, symbol, memo, amount);
    }
    upvote(votePercentage = '100.0', username, permlink) {
        return utils_2.Utils.upvote(this.client, this.config, this.username, votePercentage, username, permlink);
    }
    downvote(votePercentage = '100.0', username, permlink) {
        return utils_2.Utils.downvote(this.client, this.config, this.username, votePercentage, username, permlink);
    }
    getTransaction(blockNumber, transactionId) {
        return utils_2.Utils.getTransaction(this.client, blockNumber, transactionId);
    }
    verifyTransfer(transaction, from, to, amount) {
        return utils_2.Utils.verifyTransfer(transaction, from, to, amount);
    }
    onComment(callback) {
        this.commentSubscriptions.push({
            callback
        });
    }
    onPost(callback) {
        this.postSubscriptions.push({
            callback
        });
    }
    onTransfer(account, callback) {
        this.transferSubscriptions.push({
            account,
            callback
        });
    }
    onCustomJson(callback) {
        this.customJsonSubscriptions.push({ callback });
    }
    onCustomJsonId(callback, id) {
        this.customJsonIdSubscriptions.push({ callback, id });
    }
    onCreateClaimedAccount(callback) {
        this.createClaimedAccountSubscriptions.push({ callback });
    }
    onHiveEngine(callback) {
        this.customJsonHiveEngineSubscriptions.push({ callback });
    }
}
exports.Streamer = Streamer;
//# sourceMappingURL=streamer.js.map