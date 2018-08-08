pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * Nagri Token is fixed supply ERC20 token.
 */
contract Token is StandardToken {
	string public constant symbol = "NGRX";
	string public constant name = "Nagri X";
	uint8 public constant decimals = 18;

	/**
	 * @dev Constructor that gives msg.sender all of existing tokens.
	 */
	function Token(uint256 _totalSupply) public {
		// total supply must not be zero
		require(_totalSupply > 0);
		totalSupply_ = _totalSupply;
		// init token balance of the owner, all tokens go to him
		balances[msg.sender] = _totalSupply;
	}
}
