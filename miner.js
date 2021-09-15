const { ethers } = require('ethers');
require('log-timestamp');

rpc = 'https://rpc.ftm.tools/';

const pkey = process.env.PEENS; 		// store private key as env var $PEENS

const provider = new ethers.providers.JsonRpcProvider(rpc);
const signer = new ethers.Wallet(pkey, provider);

const myWallet = signer.address;

// var options = { gasPrice: 50000000000, gasLimit: 3000000};      // gwei
var options = { gasLimit: 3000000};      // gwei

const minerAbi = [{"constant":true,"inputs":[],"name":"ceoAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getMyMiners","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"rt","type":"uint256"},{"name":"rs","type":"uint256"},{"name":"bs","type":"uint256"}],"name":"calculateTrade","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"eth","type":"uint256"},{"name":"contractBalance","type":"uint256"}],"name":"calculateEggBuy","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"marketEggs","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sellEggs","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"amount","type":"uint256"}],"name":"devFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"seedMarket","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"ref","type":"address"}],"name":"hatchEggs","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getMyEggs","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"lastHatch","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"claimedEggs","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"hatcheryMiners","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"EGGS_TO_HATCH_1MINERS","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"eth","type":"uint256"}],"name":"calculateEggBuySimple","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"eggs","type":"uint256"}],"name":"calculateEggSell","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"referrals","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ceoAddress2","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"adr","type":"address"}],"name":"getEggsSinceLastHatch","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ref","type":"address"}],"name":"buyEggs","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
const minerContract = new ethers.Contract('0x69e7D335E8Da617E692d7379e03FEf74ef295899', minerAbi, signer);

const thrshld = 3600000;      // getEggsSinceLastHatch >> roughly 1 msec
// strat
const mod = 1;      //  1=always, 2=alternate every other

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function deposit(ftm=0, ref=myWallet) {
    await minerContract.buyEggs(ftm, ref, options);
    return console.log(">> spent " +ftm+ " FTM on eggs/miners");
}

async function compound(ref=myWallet) {
	await minerContract.hatchEggs(ref, options);
	return console.log(">> compounded");
}

async function harvest() {
    await minerContract.sellEggs(options);
    return console.log(">> claimed");
}


// main function
async function main() {
	while(true) {
        var contractBal = await minerContract.getBalance();
        var contractBalBn = await ethers.BigNumber.from(contractBal);
        for (loop=0; true; loop++) {
        	try {
                // var lastClaim = await minerContract.lastHatch(myWallet);
                var lastBalBn = contractBalBn;
                var contractBal = await minerContract.getBalance();
                var contractBalBn = await ethers.BigNumber.from(contractBal);
                console.log("contract: " + await ethers.utils.formatEther(contractBalBn) + " FTM");
                // sleep(1000);
        		var delta = await minerContract.getEggsSinceLastHatch(myWallet);
                await sleep(1000);
                // var delta = currentBlock - lastClaim;
                if (delta > thrshld) {
                    if (!(loop % mod)) {
                        await harvest();
                    } else {
                        await compound(myWallet);
                    }
                }
                bal = await ethers.utils.formatEther(await provider.getBalance(myWallet) );
                console.log("balance: " + bal + " FTM");
                await sleep(3600000);
        	}
        	catch (err) {
        		console.log(err);
        	}
        }
	}
}

main().then(console.log).catch(console.error);