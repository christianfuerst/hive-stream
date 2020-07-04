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
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const port = 5001;
class Api {
    constructor(streamer) {
        this.streamer = streamer;
        this.setupRoutes();
        this.server = app.listen(port, () => {
            console.log(`Running server on port ${port}`);
        });
    }
    setupRoutes() {
        app.get('/transfers', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const transfers = yield this.streamer.adapter.getTransfers();
            res.json(transfers);
        }));
        app.get('/transfers/contract/:contractName', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const transfers = yield this.streamer.adapter.getTransfersByContract(req.params.contractName);
            res.json(transfers);
        }));
        app.get('/transfers/account/:account', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const transfers = yield this.streamer.adapter.getTransfersByAccount(req.params.account);
            res.json(transfers);
        }));
        app.get('/transfers/block/:blockId', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const transfers = yield this.streamer.adapter.getTransfersByBlockid(req.params.blockId);
            res.json(transfers);
        }));
        app.get('/json', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const jsons = yield this.streamer.adapter.getJson();
            res.json(jsons);
        }));
        app.get('/json/contract/.:contractName', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const jsons = yield this.streamer.adapter.getJsonByContract(req.params.contractName);
            res.json(jsons);
        }));
        app.get('/json/account/:account', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const jsons = yield this.streamer.adapter.getJsonByAccount(req.params.account);
            res.json(jsons);
        }));
        app.get('/json/block/:blockId', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const jsons = yield this.streamer.adapter.getJsonByBlockid(req.params.blockId);
            res.json(jsons);
        }));
    }
}
exports.Api = Api;
//# sourceMappingURL=api.js.map