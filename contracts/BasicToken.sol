pragma solidity ^0.4.18;

import './ERC20Basic.sol';
import './SafeMath.sol';

contract BasicToken is ERC20Basic {
  using SafeMath for uint;

  mapping(address => uint) balances;

  function transfer(address _to, uint _value) public returns (bool) {
    require(_to != address(0));
    require(_value > 0 && _value <= balances[msg.sender]);

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  function balanceOf(address _owner) public constant returns (uint balance) {
    return balances[_owner];
  }
}
