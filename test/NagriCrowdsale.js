const Crowdsale = artifacts.require("./Crowdsale.sol");
const Token = artifacts.require("./token/Token.sol");

const {nearlyEquals, invalidOpcodeOk, fail, balance, increaseTime, valueOrDefault} = require('../lib/tests_lib');
require('../lib/convert_lib').enhanceNumber(web3, Number);

contract('NagriCrowdsale tests', function (accounts) {
    const creator = accounts[0];
    const beneficiary = accounts[1];
    const investor = accounts[2];

    async function investmentFlow(investmentCallback) {
        const price = 10000000000000000;
        const cs = await prepareCrowdsale({price: price});
        const tok = cs.__token;

        const balB = balance(beneficiary);
        const balI = balance(investor);
        const tokBalI = await tok.balanceOf.call(investor);
        const valueEth = 5..ether();

        await investmentCallback(cs, valueEth);

        const balBAfter = balance(beneficiary);
        const balIAfter = balance(investor);
        const tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), 5));
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -5));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 0));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price);
    }

    it("Test started crowdsale", async function () {
        await investmentFlow(async function investmentCallback(cs, valueEth) {
            await cs.invest.sendTransaction({from: investor, value: valueEth});
        });
    });

    it("Test softCap", async function () {
        const price = 10000000000000000;
        const cs = await prepareCrowdsale({price: price, softCap: .2.ether()});
        const tok = cs.__token;

        const balB = balance(beneficiary);
        const balI = balance(investor);
        const tokBalI = await tok.balanceOf.call(investor);

        // ----- 1st investment -----
        const valueEth = .1.ether(); // less than softCap

        await cs.invest.sendTransaction({from: investor, value: valueEth});

        let balBAfter = balance(beneficiary);
        let balIAfter = balance(investor);
        let tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), 0), "we don't transfer before soft cap");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.1));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), .1));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price);

        // ----- 2nd investment -----
        const valueEth1 = .3.ether(); // .1 + .3 > softCap

        await cs.invest.sendTransaction({from: investor, value: valueEth1});

        balBAfter = balance(beneficiary);
        balIAfter = balance(investor);
        tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), .4), "we do transfer after soft cap");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.4));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 0));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price + valueEth1 * 1000000000000000000 / price);

        // ----- 3nd investment -----
        const valueEth2 = .15.ether(); // sum > softCap

        await cs.invest.sendTransaction({from: investor, value: valueEth2});

        balBAfter = balance(beneficiary);
        balIAfter = balance(investor);
        tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), .55), "we do transfer after soft cap");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.55));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 0));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price + valueEth1 * 1000000000000000000 / price + valueEth2 * 1000000000000000000 / price);
    });

    it("Test quantum", async function () {
        const price = 10000000000000000;
        const cs = await prepareCrowdsale({price: price, quantum: .2.ether()});
        const tok = cs.__token;

        const balB = balance(beneficiary);
        const balI = balance(investor);
        const tokBalI = await tok.balanceOf.call(investor);

        // ----- 1st investment -----
        const valueEth = .1.ether(); // .1 < quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth});

        let balBAfter = balance(beneficiary);
        let balIAfter = balance(investor);
        let tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), 0), "we don't transfer before quantum");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.1));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), .1));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price);

        // ----- 2nd investment -----
        const valueEth1 = .3.ether(); // .1 + .3 > quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth1});

        balBAfter = balance(beneficiary);
        balIAfter = balance(investor);
        tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), .4), "we do transfer after quantum");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.4));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 0));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price + valueEth1 * 1000000000000000000 / price);

        // ----- 3nd investment -----
        const valueEth2 = .15.ether(); // .15 < quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth2});

        balBAfter = balance(beneficiary);
        balIAfter = balance(investor);
        tokBalIAfter = await tok.balanceOf.call(investor);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), .4), "we don't transfer before quantum");
        assert(nearlyEquals(web3.fromWei(balIAfter - balI, "ether"), -.55));
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), .15));
        assert.equal(tokBalIAfter - tokBalI, valueEth * 1000000000000000000 / price + valueEth1 * 1000000000000000000 / price + valueEth2 * 1000000000000000000 / price);
    });

    async function withdrawFlow(withdrawCallback) {
        const cs = await prepareCrowdsale({quantum: .5.ether()});
        const balB = balance(beneficiary);
        const valueEth = .2.ether(); //  < quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth});

        const balBAfter = balance(beneficiary);
        const balCs = balance(cs.address);

        assert(nearlyEquals(web3.fromWei(balBAfter - balB, "ether"), 0), "we don't transfer before quantum");
        assert(nearlyEquals(web3.fromWei(balCs, "ether"), .2));

        await withdrawCallback(cs);

        const balBAfterWithdraw = balance(beneficiary);
        const balCsAfterWithdraw = balance(cs.address);

        assert(nearlyEquals(web3.fromWei(balBAfterWithdraw - balB, "ether"), .2));
        assert(nearlyEquals(web3.fromWei(balCsAfterWithdraw - 0, "ether"), 0));
    }

    it("Test withdraw", async function () {
        await withdrawFlow(async function withdrawCallback(cs) {
            await cs.withdraw.sendTransaction({from: creator});
        });
    });

    it("Test withdraw (wrong sender)", async function () {
        const cs = await prepareCrowdsale({quantum: .5.ether()});
        const valueEth = .2.ether(); //  < quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth});

        try {
            await cs.withdraw.sendTransaction({from: investor});
            fail('Should only withdraw when called by creator');
        } catch (e) {
            invalidOpcodeOk(e);
        }
    });

    it("Test withdraw (zero balance)", async function () {
        const cs = await prepareCrowdsale({quantum: .5.ether()});

        try {
            await cs.withdraw.sendTransaction({from: creator});
            fail('Should not withdraw with zero balance');
        } catch (e) {
            invalidOpcodeOk(e);
        }
    });

    it("Test withdraw (with softcap)", async function () {
        const cs = await prepareCrowdsale({quantum: 1..ether(), softCap: .5.ether()});
        const balB = balance(beneficiary);
        const valueEth = .3.ether(); //  < quantum
        await cs.invest.sendTransaction({from: investor, value: valueEth});

        try {
            await cs.withdraw.sendTransaction({from: creator});
            fail('Should not withdraw when < softCap');
        } catch (e) {
            invalidOpcodeOk(e);
        }
        const balBAfter1 = balance(beneficiary);

        assert(nearlyEquals(web3.fromWei(balBAfter1 - balB, "ether"), 0), "no withdrawal should happen still");

        const valueEth1 = .4.ether(); // .3 + .4 = .7 > quantum

        await cs.invest.sendTransaction({from: investor, value: valueEth1});

        await cs.withdraw.sendTransaction({from: creator});

        const balBAfter2 = balance(beneficiary);

        assert(nearlyEquals(web3.fromWei(balBAfter2 - balB, "ether"), .7), "withdrawal should happen");
    });

    it("Test not started crowdsale", async function () {
        try {
			const csInPast = await prepareCrowdsale({offsetFromNowSec: -100, lengthSec: 50});
            await csInPast.invest.sendTransaction({from: investor, value: .1.ether()});
            fail('Should not invest in finished CS');
        } catch (e) {
            invalidOpcodeOk(e)
        }

        try {
			const csNow = await prepareCrowdsale({offsetFromNowSec: -50, lengthSec: 100});
            await csNow.invest.sendTransaction({from: investor, value: .1.ether()});
        } catch (e) {
            fail('Shoul be able to invest in current CS')
        }

        try {
			const csInFuture = await prepareCrowdsale({offsetFromNowSec: 50, lengthSec: 50});
            await csInFuture.invest.sendTransaction({from: investor, value: .1.ether()});
            fail('Should not invest in not started CS');
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });

    it("Test min investment", async function () {
        const cs = await prepareCrowdsale({minInvestment: .01.ether()});

        try {
            await cs.invest.sendTransaction({from: investor, value: .001.ether()});
            fail('Should not be possible to invest under minimum')
        } catch (e) {
            invalidOpcodeOk(e)
        }

        try {
            await cs.invest.sendTransaction({from: investor, value: .05.ether()});
        } catch (e) {
            fail('Should be possible to invest above minimum')
        }
    });

    it("Test hard cap", async function () {
        const csSmallHardCap = await prepareCrowdsale({hardCap: .05.ether()});
        const csBigHardCap = await prepareCrowdsale({hardCap: 100..ether()});

        await csSmallHardCap.invest.sendTransaction({from: investor, value: .1.ether()});
        await csBigHardCap.invest.sendTransaction({from: investor, value: .1.ether()});

        try {
            await csSmallHardCap.invest.sendTransaction({from: investor, value: .1.ether()});
            fail('Must not be possible to invest after hard cap');
        } catch (e) {
            invalidOpcodeOk(e)
        }

        try {
            await csBigHardCap.invest.sendTransaction({from: investor, value: .1.ether()});
        } catch (e) {
            fail('Must be possible to invest before hard cap')
        }
    });
    it("zero length validation", async function () {
        try {
            await prepareCrowdsale({offsetFromNowSec: 10, lengthSec: 0});
            fail('Able to create length 0')
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });
    it("softCap < hardCap validation", async function () {
        try {
            await prepareCrowdsale({softCap: 10..ether(), hardCap: 5..ether()});
            fail('Able to create softCap > hardCap')
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });
    it("rest of validation", async function () {
        try {
            await prepareCrowdsale({price: 0});
            fail('Able to create price 0')
        } catch (e) {
            invalidOpcodeOk(e)
        }
        try {
            await prepareCrowdsale({beneficiary: '0x0'});
            fail('Able to create beneficiary 0')
        } catch (e) {
            invalidOpcodeOk(e)
        }
        try {
            await prepareCrowdsale({tokenAddr: '0x0'});
            fail('Able to create tokenAddr 0')
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });
    it("Test refund (not ended crowdsale)", async function () {
        const cs = await prepareCrowdsale({quantum: 2..ether()});
        const valueEth = 1..ether();
        await cs.invest.sendTransaction({from: investor, value: valueEth});
        try {
            await cs.refund.sendTransaction({from: investor});
            fail('Able to refund on not ended crowdsale')
        } catch (e) {
            invalidOpcodeOk(e)
        }
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 1));
    });
    it("Test refund (soft cap passed)", async function () {
        const cs = await prepareCrowdsale({
            quantum: 2..ether(),
            softCap: .8.ether(),
            offsetFromNowSec: 0,
            lengthSec: 3});
        
        const valueEth = 1..ether();
        await cs.invest.sendTransaction({from: investor, value: valueEth});

        incrTime(5); // close crowdsale

        try {
            await cs.refund.sendTransaction({from: investor});
            fail('Able to refund on crowdsale that reached soft cap')
        } catch (e) {
            invalidOpcodeOk(e)
        }

        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 1));
    });

    async function refundFlow(refundCallback) {
        const cs = await prepareCrowdsale({
            softCap: .8.ether(),
            offsetFromNowSec: 0,
            lengthSec: 3
        });
        const token = cs.__token;

        const valueEth = .5.ether();
        await cs.invest.sendTransaction({from: investor, value: valueEth});
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), .5));

        incrTime(5); // close crowdsale

        try {
            await refundCallback(cs);
            fail('Able to refund when tokens not yet approved by investor')
        } catch (e) {
            invalidOpcodeOk(e)
        }

        // TODO: can we improve usability for an investor?
        // Now we need this step to allow contract to take tokens back on refund
        await token.approve.sendTransaction(cs.address, await token.balanceOf.call(investor), {from: investor});

        await refundCallback(cs);
        assert(nearlyEquals(web3.fromWei(balance(cs.address) - 0, "ether"), 0));
    }

    it("Test successful refund", async function () {
        await refundFlow(async function refundCallback(cs) {
            await cs.refund.sendTransaction({from: investor});
        });
    });

    it("Test payable function (investment)", async function () {
        await investmentFlow(async function investmentCallback(cs, valueEth) {
            await cs.sendTransaction({from: investor, value: valueEth});
        });
    });

    it("Test payable function (refund)", async function () {
        await refundFlow(async function refundCallback(cs) {
            await cs.sendTransaction({from: investor});
        });
    });

    it("Test payable function (withdraw)", async function () {
        await withdrawFlow(async function withdrawCallback(cs) {
            incrTime(100); // crowdsale must have been finished
            await cs.sendTransaction({from: creator});
        });
    });
    it("Test payable function (not started)", async function () {
        const csInFuture = await prepareCrowdsale({offsetFromNowSec: 50, lengthSec: 50});

        try {
            await csInFuture.sendTransaction({from: investor, value: .1.ether()});
            fail('Should not invest in not started CS');
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });

    async function prepareCrowdsale(crowdsale) {
        const offsetFromNowSec = valueOrDefault(crowdsale.offsetFromNowSec, -100);
        const lengthSec = valueOrDefault(crowdsale.lengthSec, 200);
        const price = valueOrDefault(crowdsale.price, 10000000000000000);
        const softCap = valueOrDefault(crowdsale.softCap, 0);
        const hardCap = valueOrDefault(crowdsale.hardCap, 2000..ether());
        const quantum = valueOrDefault(crowdsale.quantum, 0);
        const _beneficiary = valueOrDefault(crowdsale.beneficiary, beneficiary);

        const tok = await Token.new(4000..ether());

        const tokenAddr = crowdsale.tokenAddr || tok.address;

        const cs = await Crowdsale.new(
            'Test CS',
            timeFromNowSec(offsetFromNowSec),
            lengthSec,
            price,			// token price
            softCap,
            hardCap,
            quantum,
            _beneficiary,// beneficiary
            tokenAddr	// token to sell (used for open crowdsale)
        );
        cs.__token = tok;
        await tok.approve(cs.address, 1000..ether());
        return cs;
    }

    function incrTime(seconds) {
        increaseTime(seconds);
        incrTime.currentDeltaSec += seconds;
    }
    incrTime.currentDeltaSec = 0;
    function timeFromNowSec(seconds) {
        return ((new Date().getTime() / 1000) | 0) + seconds + incrTime.currentDeltaSec;
    }
});
