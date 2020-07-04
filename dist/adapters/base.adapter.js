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
class AdapterBase {
    constructor() {
        this['client'] = null;
        this['db'] = null;
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    loadActions() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    loadState() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Load state method not implemented in adapter');
        });
    }
    saveState(data) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Save state method not implemented in adapter');
        });
    }
    processBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    processOperation(op, blockNumber, blockId, prevBlockId, trxId, blockTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    processTransfer(operation, payload, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    processCustomJson(operation, payload, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
}
exports.AdapterBase = AdapterBase;
//# sourceMappingURL=base.adapter.js.map