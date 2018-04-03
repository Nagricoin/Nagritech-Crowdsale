const Token = artifacts.require("./token/Token.sol");

const {nearlyEquals, invalidOpcodeOk, fail} = require('../lib/tests_lib');
require('../lib/convert_lib').enhanceNumber(web3, Number);

const TOK_SYMB = "NGR";
const TOK_NAME = "Nagri Token";
const TOK_SUPPLY = 4000..ether();

contract('NagriToken tests', function (accounts) {
    it("Nagri token is deployed with correct values", async function () {
        const tok = await Token.new(TOK_SUPPLY);
        assert.equal(await tok.symbol(), TOK_SYMB, "Symbol name is incorrect");
        assert.equal(await tok.name(), TOK_NAME, "Name is incorrect");
        assert.equal((await tok.totalSupply.call()).toString(10), TOK_SUPPLY, "Total supply is incorrect");
    });
    it("Is impossible to deploy totalSupply 0", async function () {
        try {
            const tok = await Token.new(0);
            fail('Deployed totalSupply 0');
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });
    it("Is possible to do correct transfer", async function () {
        const tok = await Token.new(100);
        assert.equal((await tok.balanceOf.call(accounts[0])).toString(10), 100, 'Balance before is incorrect');
        assert.equal((await tok.balanceOf.call(accounts[1])).toString(10), 0, 'Balance before is incorrect');
        await tok.transfer(accounts[1], 15);
        assert.equal((await tok.balanceOf.call(accounts[0])).toString(10), 85, 'Balance after is incorrect');
        assert.equal((await tok.balanceOf.call(accounts[1])).toString(10), 15, 'Balance after is incorrect');
    });
    it("Is impossible to transfer more than have", async function () {
        const tok = await Token.new(100);
        try {
            await tok.transfer(accounts[1], 102);
            fail('transfered more than have');
        } catch (e) {
            invalidOpcodeOk(e)
        }
    });
});
