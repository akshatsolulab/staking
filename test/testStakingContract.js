const {expect} = require('chai');
const { ethers, upgrades } = require('hardhat');


describe("Testing fixed staking contract", async () => {

    let Contract;
    let stak;
    let perkTokenContract;
    let myTokenContract;
    const chainlinkAggregatorAddress = "0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF";
    const stakingEndTimestamp = 31536000;

    async function deployperkTokenContract () {
        const RewardContract = await ethers.getContractFactory("PerkToken")
        const rewardContract = await RewardContract.deploy();
        return rewardContract;
    }

    async function deploymyTokenContract() {
        const StableCoinContract = await ethers.getContractFactory("MyToken")
        const stableCoinContract = await StableCoinContract.deploy();
        return stableCoinContract;
    }

    before("Deploying proxy smartcontract", async function() {

        const [owner] = await ethers.getSigners();

        perkTokenContract = await deployperkTokenContract();
        myTokenContract = await deploymyTokenContract();

        Contract = await ethers.getContractFactory('Staking');

        stak = await upgrades.deployProxy(Contract, [
            perkTokenContract.address,
            myTokenContract.address,
            chainlinkAggregatorAddress,
            stakingEndTimestamp
        ], {kind: 'uups'});
    })

    describe("Deposit stable coins in pool", async function() {
        
        let contractBalanceBeforeDeposit;
        let amountToDeposit;

        before("Deposit tokens to staking contract", async function() {
            const [owner] = await ethers.getSigners();
            await myTokenContract.approve(stak.address, ethers.utils.parseEther('100000000000000000000000'));

            amountToDeposit = ethers.utils.parseEther('90');
            contractBalanceBeforeDeposit = await stak.totalStakedInPool();
            await stak.depositInPool(amountToDeposit);
        })

        it("Confirm deposit successful", async () => {
            const [owner] = await ethers.getSigners();
            let contractBalanceAfterDeposit = contractBalanceBeforeDeposit + amountToDeposit;
            expect(await stak.totalStakedInPool()).to.equal(contractBalanceAfterDeposit);
        })

        it("Check user's staked amount updated", async () => {
            const [owner] = await ethers.getSigners();
            let userInfo = await stak.userInfo(owner.address);
            let userStakedAmount = Math.trunc(ethers.utils.formatEther(`${userInfo.amountStaked}`))
            expect(userStakedAmount).to.equal(Math.trunc(ethers.utils.formatEther(String(amountToDeposit))))
        })
    })
    describe("issue the tokens and withdraw Tokens", async () => {
        before("Transfer MyToken to the staking contract", async () => {
            const [owner] = await ethers.getSigners();
            await perkTokenContract.transfer(stak.address, ethers.utils.parseEther('1000000000000000000000000000'));
            // wait for 30 sec
            function waitForTx(ms) {
                return new Promise((res) => {
                    setTimeout(res, ms);
                });
            }
            await waitForTx(30000).then(async () => {
                const tx = await stak.claimERC20RewardTokens();
                await tx.wait();
            })
        })

        it("withdraw the rewards within 1 month", async () => {
            const [owner] = await ethers.getSigners();
            let userInfo = await stak.userInfo(owner.address);
            let pendingReward = Number(((userInfo.amountStaked)*30)/(31536000)/1e4);
            expect(parseFloat(userInfo.rewardEarned)).to.be.above(pendingReward);
        })

        it("Withdraw Deposited Tokens from the pool", async () => {
            const [owner] = await ethers.getSigners();
            let userStablecoinBalanceBeforeWithdrawl = await myTokenContract.balanceOf(owner.address);
            let amountToWithdraw = ethers.utils.parseEther('90')
            await stak.unstake(amountToWithdraw);
            let userStablecoinBalanceAfterWithdrawl = await myTokenContract.balanceOf(owner.address);
            let expectedStablecoinBalance = parseInt((userStablecoinBalanceBeforeWithdrawl)) + parseInt(amountToWithdraw);
            // console.log({"before bal": userStablecoinBalanceBeforeWithdrawl, "expected": expectedStablecoinBalance});
            expect(parseInt((userStablecoinBalanceAfterWithdrawl))).to.equal(expectedStablecoinBalance);
        })
    }) 

    describe("Checking for the claimed rewards getting recieved", async () => {
        
        // For testing 365 days are converted in 365 minute and 365 minutes are converted in 365 seconds
        let userStablecoinBalanceBeforeWithdrawl;
        let amountToDeposit;
        before("Transfer reward tokens to staking contract and deposit stable coin", async () => {
            const [owner] = await ethers.getSigners();

            amountToDeposit = ethers.utils.parseEther('90');
            await stak.depositInPool(amountToDeposit);

            await perkTokenContract.transfer(stak.address, ethers.utils.parseEther('100000000000000000000000'));
            // wait for 90 sec
            function waitForTx(ms) {
                return new Promise((res) => {
                    setTimeout(res, ms);
                });
            }
            await waitForTx(90000).then(async () => {
                userStablecoinBalanceBeforeWithdrawl = await myTokenContract.balanceOf(owner.address);
                const tx = await stak.unstake(amountToDeposit);
                await tx.wait();
            })
        })

        it("Unstaking the tokens after an month", async () => {
            const [owner] = await ethers.getSigners();
            let userInfo = await stak.userInfo(owner.address);
            let pendingReward = Number(((userInfo.amountStaked)*(500)*90)/(31536000)/1e4);
            expect(parseFloat(userInfo.rewardEarned)).to.be.above(pendingReward);
        })

        it("Transfering the MyTokens to User's Profile", async () => {
            const [owner] = await ethers.getSigners();
            let userStablecoinBalanceAfterWithdrawl = await myTokenContract.balanceOf(owner.address);
            let expectedStablecoinBalance = parseInt((userStablecoinBalanceBeforeWithdrawl)) + parseInt(amountToDeposit);
            expect(parseInt((userStablecoinBalanceAfterWithdrawl))).to.equal(expectedStablecoinBalance);
        })
    })

    describe("Claim perks with extra APR based on amount staked", async () => {
        let userStablecoinBalanceBeforeWithdrawl;
        let userStablecoinBalanceAfterWithdrawl;
        let amountToDeposit;
        before("Deposit reward tokens to staking contract and deposit stable coin", async () => {
            const [owner] = await ethers.getSigners();

            amountToDeposit = ethers.utils.parseEther('150');
            await stak.depositInPool(amountToDeposit);

            await perkTokenContract.transfer(stak.address, ethers.utils.parseEther('1000000000000000000000000'));
            // wait
            function waitForTx(ms) {
                return new Promise((res) => {
                    setTimeout(res, ms);
                });
            }
            await waitForTx(90000).then(async () => {
                userStablecoinBalanceBeforeWithdrawl = await myTokenContract.balanceOf(owner.address);
                const tx = await stak.unstake(amountToDeposit);
                await tx.wait();
            })
        })

        it("Claim rewards with extra 2% for staking more than $100", async () => {
            const [owner] = await ethers.getSigners();
            let userInfo = await stak.userInfo(owner.address);
            let pendingReward = Number(((userInfo.amountStaked)*(200)*(300)*90)/(31536000)/1e4);
            expect(parseFloat(userInfo.rewardEarned)).to.be.above(pendingReward);
        })

    })

})