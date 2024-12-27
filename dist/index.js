"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionTypes = exports.transactionStates = exports.transactionModes = exports.tokenNames = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const http_1 = tslib_1.__importDefault(require("http"));
const socket_io_1 = require("socket.io");
var tokenNames;
(function (tokenNames) {
    tokenNames["BTC"] = "BTC";
    tokenNames["SOL"] = "SOL";
    tokenNames["BNB"] = "BNB";
    tokenNames["ETH"] = "ETH";
    tokenNames["LTC"] = "LTC";
    tokenNames["TRX"] = "TRX";
    tokenNames["USDT"] = "USDT";
    tokenNames["USDTTRC20"] = "USDTTRC20";
    tokenNames["USD"] = "USD";
    tokenNames["NGN"] = "NGN";
})(tokenNames || (exports.tokenNames = tokenNames = {}));
var transactionModes;
(function (transactionModes) {
    transactionModes["bank"] = "bank";
    transactionModes["wallet"] = "wallet";
})(transactionModes || (exports.transactionModes = transactionModes = {}));
var transactionStates;
(function (transactionStates) {
    transactionStates["pending"] = "pending";
    transactionStates["success"] = "success";
    transactionStates["fail"] = "fail";
})(transactionStates || (exports.transactionStates = transactionStates = {}));
var transactionTypes;
(function (transactionTypes) {
    transactionTypes["buy"] = "buy";
    transactionTypes["withdraw"] = "withdraw";
    transactionTypes["fund"] = "fund";
    transactionTypes["sell"] = "sell";
})(transactionTypes || (exports.transactionTypes = transactionTypes = {}));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
    pingInterval: 24 * 60 * 60 * 1000,
    pingTimeout: 3 * 24 * 60 * 60 * 1000,
});
const PORT = 8000;
const USERS_ROOM = 'users';
function computeUserIdFromHeaders(headers) {
    return headers['x-user-id'] || null;
}
function handleSocketConnection(socket) {
    socket.on('update-dollz-to-ngn', arg => handleUpdateDollzToNgn(arg, socket));
    try {
        const userId = computeUserIdFromHeaders(socket.handshake.headers);
        if (userId) {
            console.log(userId);
            socket.join(userId);
            socket.join(USERS_ROOM);
            socket.leave(socket.id);
            socket.on('update-balance', handleUpdateBalance(userId, socket));
            socket.on('initiate-transaction', handleInitiateTransaction(socket));
        }
        else {
            console.log(socket.id);
        }
        socket.on('disconnect', handleDisconnect);
    }
    catch (error) {
        console.error('Error computing user ID:', error);
    }
}
function handleUpdateBalance(userId, socket) {
    return (updateMssg) => {
        console.log('update-balance', updateMssg.id);
        socket.to(userId).emit('update-balance', updateMssg);
    };
}
function handleInitiateTransaction(socket) {
    return (initTrans) => {
        console.log('initiate-transaction', initTrans.id);
        socket.broadcast.emit('initiate-transaction', initTrans);
    };
}
function handleUpdateDollzToNgn(arg, socket) {
    console.log('update-dollz-to-ngn', arg);
    socket.broadcast.emit('udtngn', arg);
    // io.emit('update-dollz-to-ngn', arg)
}
function handleDisconnect(reason) {
    console.log('disconnect', reason);
}
io.on('connection', handleSocketConnection);
server.listen(PORT, () => {
    console.log(`Server Listening on ${PORT}`);
});
