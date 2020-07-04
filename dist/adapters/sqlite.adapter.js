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
const base_adapter_1 = require("./base.adapter");
const sqlite3_1 = require("sqlite3");
const path_1 = __importDefault(require("path"));
class SqliteAdapter extends base_adapter_1.AdapterBase {
    constructor() {
        super(...arguments);
        this.db = new sqlite3_1.Database(path_1.default.resolve(__dirname, 'hive-stream.db'));
    }
    getDb() {
        return this.db;
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.db.serialize(() => {
                    const params = `CREATE TABLE IF NOT EXISTS params ( id INTEGER PRIMARY KEY, lastBlockNumber NUMERIC, actions TEXT )`;
                    const transfers = `CREATE TABLE IF NOT EXISTS transfers ( id TEXT NOT NULL UNIQUE, blockId TEXT, blockNumber INTEGER, sender TEXT, amount TEXT, contractName TEXT, contractAction TEXT, contractPayload TEXT)`;
                    const customJson = `CREATE TABLE IF NOT EXISTS customJson ( id TEXT NOT NULL UNIQUE, blockId TEXT, blockNumber INTEGER, sender TEXT, isSignedWithActiveKey INTEGER, contractName TEXT, contractAction TEXT, contractPayload TEXT)`;
                    const events = `CREATE TABLE IF NOT EXISTS events ( id INTEGER PRIMARY KEY, date TEXT, contract TEXT, action TEXT, payload TEXT, data TEXT )`;
                    this.db
                        .run(params)
                        .run(transfers)
                        .run(customJson)
                        .run(events, () => {
                        resolve(true);
                    });
                });
            });
        });
    }
    loadActions() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.loadState();
            if (state) {
                return (state === null || state === void 0 ? void 0 : state.actions) ? state.actions : [];
            }
            return [];
        });
    }
    loadState() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT actions, lastBlockNumber FROM params LIMIT 1', (err, rows) => {
                    var _a;
                    if (!err) {
                        if (rows.length) {
                            const row = rows[0];
                            row.actions = (_a = JSON.parse(row.actions)) !== null && _a !== void 0 ? _a : [];
                            resolve(row);
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    saveState(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `REPLACE INTO params (id, actions, lastBlockNumber) VALUES(1, '${JSON.stringify(data.actions)}', '${data.lastBlockNumber}')`;
                this.db.run(sql, [], (err, result) => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    processOperation(op, blockNumber, blockId, prevBlockId, trxId, blockTime) {
        return __awaiter(this, void 0, void 0, function* () {
            this.blockNumber = blockNumber;
            this.blockId = blockId;
            this.prevBlockId = prevBlockId;
            this.transactionId = trxId;
        });
    }
    processTransfer(operation, payload, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO transfers (id, blockId, blockNumber, sender, amount, contractName, contractAction, contractPayload) 
            VALUES ('${this.transactionId}', '${this.blockId}', ${this.blockNumber}, '${metadata.sender}', '${metadata.amount}', '${payload.name}', '${payload.action}', '${JSON.stringify(payload.payload)}')`;
                this.db.run(sql, [], (err, result) => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    processCustomJson(operation, payload, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO customJson (id, blockId, blockNumber, sender, isSignedWithActiveKey, contractName, contractAction, contractPayload) 
            VALUES ('${this.transactionId}', '${this.blockId}', ${this.blockNumber},'${metadata.sender}', ${metadata.isSignedWithActiveKey}, '${payload.name}', '${payload.action}', '${JSON.stringify(payload.payload)}')`;
                this.db.run(sql, [], (err, result) => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    addEvent(date, contract, action, payload, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO events (date, contract, action, payload, data) 
            VALUES ('${date}', '${contract}', '${action}', '${JSON.stringify(payload)}', '${JSON.stringify(data)}')`;
                this.db.run(sql, [], (err, result) => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getTransfers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT id, blockId, blockNumber, sender, amount, contractName, contractAction, contractPayload FROM transfers', (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT id, date, contract, action, payload, data FROM events', (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a, _b;
                                row.payload = (_a = JSON.parse(row.payload)) !== null && _a !== void 0 ? _a : {};
                                row.data = (_b = JSON.parse(row.data)) !== null && _b !== void 0 ? _b : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getTransfersByContract(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, amount, contractName, contractAction, contractPayload FROM transfers WHERE contractName = ${contract}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getTransfersByAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, amount, contractName, contractAction, contractPayload FROM transfers WHERE sender = ${account}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getTransfersByBlockid(blockId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, amount, contractName, contractAction, contractPayload FROM transfers WHERE blockId = ${blockId}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getJson() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT id, blockId, blockNumber, sender, isSignedWithActiveKey, contractName, contractAction, contractPayload FROM customJson', (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getJsonByContract(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, isSignedWithActiveKey, contractName, contractAction, contractPayload FROM customJson WHERE contractName = ${contract}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getJsonByAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, isSignedWithActiveKey, contractName, contractAction, contractPayload FROM customJson WHERE sender = ${account}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    getJsonByBlockid(blockId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT id, blockId, blockNumber, sender, isSignedWithActiveKey, contractName, contractAction, contractPayload FROM customJson WHERE blockId = ${blockId}`, (err, rows) => {
                    if (!err) {
                        if (rows.length) {
                            resolve(rows.reduce((arr, row) => {
                                var _a;
                                row.contractPayload = (_a = JSON.parse(row.contractPayload)) !== null && _a !== void 0 ? _a : {};
                                arr.push(row);
                                return arr;
                            }, []));
                        }
                        else {
                            resolve(null);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (!err) {
                        resolve(true);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    }
}
exports.SqliteAdapter = SqliteAdapter;
//# sourceMappingURL=sqlite.adapter.js.map