pragma solidity ^0.4.18;

contract ERC20Basic {
  uint public totalSupply;
  function balanceOf(address who) public constant returns (uint);
  function transfer(address to, uint value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint value);
}
