pragma solidity ^0.4.18;

import './TimelockToken.sol';

contract NEAT20Token is TokenTimelock {
  string public constant name = 'NEAT20';
  string public constant symbol = 'NEAT';
  uint32 public constant decimals = 8;
  uint public constant initialSupply = 25E15;

  function NEAT20Token() public {
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;
  }

  function burn() public onlyOwner {
    totalSupply = totalSupply.sub(balances[owner]);
    balances[owner] = 0;
  }
}
