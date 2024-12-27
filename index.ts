import express from 'express';
import http from 'http';
import { DefaultEventsMap, Socket, Server } from 'socket.io';

export type Pocket = {
	id: string;
	name: string;
	duration: number;
	balance?: number;
};
type Payout = { bank: string; accountNo: string; code: string };
export type Profile = {
	id: string;
	email: string;
	firstName: string;
	pockets: Pocket[];
	userName: string;
	walletKey: string;
	transactions: string[];
	payout?: Payout;
	fetchedTransactions?: Transaction[];
	wallets: { balance: number; id: string }[];
};
export enum tokenNames {
	BTC = 'BTC',
	SOL = 'SOL',
	BNB = 'BNB',
	ETH = 'ETH',
	LTC = 'LTC',
	TRX = 'TRX',
	USDT = 'USDT',
	USDTTRC20 = 'USDTTRC20',
	USD = 'USD',
	NGN = 'NGN',
}
export enum transactionModes {
	bank = 'bank',
	wallet = 'wallet',
}
export enum transactionStates {
	pending = 'pending',
	success = 'success',
	fail = 'fail',
}
export enum transactionTypes {
	buy = 'buy',
	withdraw = 'withdraw',
	fund = 'fund',
	sell = 'sell',
}
type transactionNoId = {
	amountNGN: number;
	amountUSD?: number;
	from: keyof typeof tokenNames;
	convertTo?: keyof typeof tokenNames;
	transactionType: keyof typeof transactionTypes;
};
type transactionNoWallet = transactionNoId & { id: string };
export type transaction = transactionNoWallet & {
	toWallet: string;
	mode: keyof typeof transactionModes;
	proof?: string;
};
export type Transaction = transaction & {
	date: number;
	state: transactionStates;
	initiator: {
		profile: Profile;
	};
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: '*',
	},
	pingInterval: 24 * 60 * 60 * 1000,
	pingTimeout: 3 * 24 * 60 * 60 * 1000,
});

const PORT = 8000;
const USERS_ROOM = 'users';

function computeUserIdFromHeaders(headers): string | null {
	return headers['x-user-id'] || null;
}
function handleSocketConnection(
	socket: Socket<
		DefaultEventsMap,
		DefaultEventsMap,
		DefaultEventsMap,
		any
	>
) {
	socket.on('update-dollz-to-ngn', arg =>
		handleUpdateDollzToNgn(arg, socket)
	);
	try {
		const userId = computeUserIdFromHeaders(
			socket.handshake.headers
		);
		if (userId) {
			console.log(userId);

			socket.join(userId);
			socket.join(USERS_ROOM);
			socket.leave(socket.id);

			socket.on(
				'update-balance',
				handleUpdateBalance(userId, socket)
			);
			socket.on(
				'initiate-transaction',
				handleInitiateTransaction(socket)
			);
		} else {
			console.log(socket.id);
		}
		socket.on('disconnect', handleDisconnect);
	} catch (error) {
		console.error('Error computing user ID:', error);
	}
}

function handleUpdateBalance(userId: string, socket) {
	return (
		updateMssg: Transaction & {
			onApprove: { balance?: number; available?: number };
		}
	) => {
		console.log('update-balance', updateMssg.id);
		socket.to(userId).emit('update-balance', updateMssg);
	};
}

function handleInitiateTransaction(socket) {
	return (
		initTrans: Transaction & {
			onApprove: { balance?: number; available?: number };
		}
	) => {
		console.log('initiate-transaction', initTrans.id);
		socket.broadcast.emit('initiate-transaction', initTrans);
	};
}

function handleUpdateDollzToNgn(
	arg,
	socket: Socket<
		DefaultEventsMap,
		DefaultEventsMap,
		DefaultEventsMap,
		any
	>
) {
	console.log('update-dollz-to-ngn', arg);
	socket.broadcast.emit('udtngn', arg);

	// io.emit('update-dollz-to-ngn', arg)
}

function handleDisconnect(reason: string) {
	console.log('disconnect', reason);
}

io.on('connection', handleSocketConnection);

server.listen(PORT, () => {
	console.log(`Server Listening on ${PORT}`);
});
