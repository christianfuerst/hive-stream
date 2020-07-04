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
const base_adapter_1 = require("./base.adapter");
const mongodb_1 = require("mongodb");
class MongodbAdapter extends base_adapter_1.AdapterBase {
    constructor(uri, database, options = { useNewUrlParser: true, useUnifiedTopology: true }) {
        super();
        this.mongo = {
            uri: '',
            database: '',
            options: {}
        };
        this.mongo.uri = uri;
        this.mongo.database = database;
        this.mongo.options = options;
    }
    getDbInstance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = yield mongodb_1.MongoClient.connect(this.mongo.uri, this.mongo.options);
                this.db = this.client.db(this.mongo.database);
                return this.db;
            }
            catch (e) {
                throw e;
            }
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = yield mongodb_1.MongoClient.connect(this.mongo.uri, this.mongo.options);
                this.db = this.client.db(this.mongo.database);
                return true;
            }
            catch (e) {
                throw e;
            }
        });
    }
    loadActions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                yield this.getDbInstance();
            }
            const state = yield this.loadState();
            if (state) {
                return (state === null || state === void 0 ? void 0 : state.actions) ? state.actions : [];
            }
            return [];
        });
    }
    loadState() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.db) {
                    yield this.getDbInstance();
                }
                const collection = this.db.collection('params');
                const params = yield collection.findOne({});
                if (params) {
                    return params;
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    saveState(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.db) {
                    yield this.getDbInstance();
                }
                const collection = this.db.collection('params');
                yield collection.replaceOne({}, data, { upsert: true });
                return true;
            }
            catch (e) {
                throw e;
            }
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
            if (!this.db) {
                yield this.getDbInstance();
            }
            const collection = this.db.collection('transfers');
            const data = {
                id: this.transactionId,
                blockId: this.blockId,
                blockNumber: this.blockNumber,
                sender: metadata.sender,
                amount: metadata.amount,
                contractName: payload.name,
                contractAction: payload.action,
                ContractPayload: payload.payload
            };
            yield collection.insertOne(data);
            return true;
        });
    }
    processCustomJson(operation, payload, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                yield this.getDbInstance();
            }
            const collection = this.db.collection('customJson');
            const data = {
                id: this.transactionId,
                blockId: this.blockId,
                blockNumber: this.blockNumber,
                sender: metadata.sender,
                isSignedWithActiveKey: metadata.isSignedWithActiveKey,
                contractName: payload.name,
                contractAction: payload.action,
                ContractPayload: payload.payload
            };
            yield collection.insertOne(data);
            return true;
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.close();
            return true;
        });
    }
}
exports.MongodbAdapter = MongodbAdapter;
//# sourceMappingURL=mongodb.adapter.js.map