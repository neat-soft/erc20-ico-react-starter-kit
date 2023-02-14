pragma solidity ^0.4.18;

import './ERC20Basic.sol';

contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public constant returns (uint);
  function transferFrom(address from, address to, uint value) public returns (bool);
  function approve(address spender, uint value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint value);
}
