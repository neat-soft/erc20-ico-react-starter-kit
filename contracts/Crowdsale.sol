pragma solidity ^0.4.18;

import './SafeMath.sol';
import './NEAT20Token.sol';
import './Pausable.sol';

contract Crowdsale is Pausable {
  using SafeMath for uint;

  NEAT20Token public token = new NEAT20Token();

  struct Stage {
    uint id;
    uint start;
    uint duration;
    uint totalSupply;
    uint minCap;
    uint rate;
    uint minInvestment;
    uint smallBonus;
    uint bigBonus;
    uint sold;
    uint amountInvestments;
    mapping (address => uint) investments;
  }
  Stage public preICO;
  Stage public ICO;

  struct Addr {
    address addr;
    uint amount;
    uint time;
  }
  mapping (uint => Addr) public addresses;

  uint constant decimals = 1E8;
  uint public ethUSD;

  uint beforePreICOLimit = 125E13; // 12 500 000
  uint beforePreICOTokens;

  address public burner;
  address public withdrawalWallet;
  address[] public investors;

  event TransferWei(address indexed addr, uint amount);

  function Crowdsale(uint _startPreICO, uint _startICO, uint _durationPreICO, uint _durationICO, uint _ethUSD, address _burner) public {
    require(
      _startPreICO > now &&
      _startICO >= (_startPreICO + _durationPreICO * 1 hours) &&
      _ethUSD > 0 && _burner != address(0)
    );

    preICO = Stage({
      id: 0,
      start: _startPreICO,                 // setting
      duration: _durationPreICO * 1 hours, // 4 weeks = 28 days = 672 hours
      totalSupply: 375E13,                 // 37 500 000 NEAT
      minCap: 1E8,                         // 1 000 000 USD
      rate: 20,                            // 1 NEAT = 0.2 USD
      minInvestment: 5 ether,              // 5 ETH;
      smallBonus: 4,                       // 25% for people investing more or equal to 40 ETH
      bigBonus: 35,                        // 35% for people investing more or equal to 100 ETH
      sold: 0,
      amountInvestments: 0
    });
    ICO = Stage({
      id: 1,
      start: _startICO,                    // setting
      duration: _durationICO * 1 hours,    // 6 weeks = 42 days = 1008 hours
      totalSupply: 1125E13,                // 112 500 000 NEAT
      minCap: 5E8,                         // 5 000 000 USD
      rate: 20,                            // 1 NEAT = 0.2 USD
      minInvestment: 1E17,                 // 0.1 ETH
      smallBonus: 5,                       // 20% for people investing more or equal to 40 ETH
      bigBonus: 30,                        // 30% for contribution equal or more 100 ETH
      sold: 0,
      amountInvestments: 0
    });

    uint endTime = ICO.start + ICO.duration;

    // Owner
    token.freeze(owner, endTime + 180 days, 5E15); // 50 000 000
    investors.push(owner);

    // Founders
    addresses[0].amount = 5E15; // 50 000 000
    addresses[0].time = endTime + 180 days;

    // Bounty
    addresses[1].amount = 3125E11; // 3 125 000
    addresses[1].time = endTime + 180 days;

    // Marketing
    addresses[2].amount = 3125E12; // 31 250 000
    addresses[2].time = endTime;

    ethUSD = _ethUSD;
    burner = _burner;
  }

  function definitionStage() internal view returns(Stage) {
    if (now >= preICO.start && now < (preICO.start + preICO.duration)) {
      return preICO;
    } else if (
      now >= ICO.start &&
      now <= (ICO.start + ICO.duration) &&
      preICO.amountInvestments.mul(ethUSD).div(1 ether) >= preICO.minCap
    ) {
      return ICO;
    } else {
      revert();
    }
  }

  function freezeTokens(address _to, uint _time, uint _tokens) internal {
    if (
      token.getBeneficiaryByTime(_to, ICO.start + ICO.duration) == 0 &&
      token.getBeneficiaryByTime(_to, ICO.start + ICO.duration + 180 days) == 0
    ) investors.push(_to);
    token.freeze(_to, _time, _tokens);
  }

  function createTokens() public whenNotPaused payable {
    Stage memory currentStage = definitionStage();
    uint remainder = currentStage.totalSupply.sub(currentStage.sold);
    require(msg.value >= currentStage.minInvestment && remainder > 0);

    uint tokens = msg.value.mul(ethUSD).mul(decimals).div(1 ether).div(currentStage.rate);
    uint totalTokens = tokens;
    uint totalAmount = msg.value;

    // Check remainder
    if (tokens > remainder) {
      uint surrender = totalAmount.sub(remainder.mul(currentStage.rate).mul(1 ether).div(decimals).div(ethUSD));
      totalAmount = totalAmount.sub(surrender);
      totalTokens = remainder;
      TransferWei(msg.sender, surrender);
      msg.sender.transfer(surrender);
    } else {
      // BONUSES
      if (currentStage.id == 0) {
        // Presale bonuses (only for pre-ICO) - 20%
        totalTokens = totalTokens.add(tokens.div(5));
      } else {
        // Time-based bonuses (only for ICO)
        // Week 1: 15%; Week 2: 10%; Week 3: 5 %
        if (now <= currentStage.start + 1 weeks) {
          totalTokens = totalTokens.add(tokens.mul(15).div(100));
        } else if (now <= currentStage.start + 2 weeks) {
          totalTokens = totalTokens.add(tokens.div(10));
        } else if (now <= currentStage.start + 3 weeks) {
          totalTokens = totalTokens.add(tokens.div(20));
        }
      }

      // Volume-based bonuses
      if (totalAmount >= 100 ether) {
        totalTokens = totalTokens.add(tokens.mul(currentStage.bigBonus).div(100));
      } else if (totalAmount >= 40 ether) {
        totalTokens = totalTokens.add(tokens.div(currentStage.smallBonus));
      }

      if (totalTokens > remainder) totalTokens = remainder;
    }

    // Сounting and sending
    if (currentStage.id == 0) {
      preICO.sold = preICO.sold.add(totalTokens);
      preICO.investments[msg.sender] = preICO.investments[msg.sender].add(totalAmount);
      preICO.amountInvestments = preICO.amountInvestments.add(totalAmount);
    } else {
      ICO.sold = ICO.sold.add(totalTokens);
      ICO.investments[msg.sender] = ICO.investments[msg.sender].add(totalAmount);
      ICO.amountInvestments = ICO.amountInvestments.add(totalAmount);
    }

    freezeTokens(msg.sender, ICO.start + ICO.duration, totalTokens);
  }

  function setEthUSD(uint _rate) public onlyOwner {
    require(_rate > 0 && now <= (ICO.start + ICO.duration));

    ethUSD = _rate;
  }

  function withdrawal() public onlyOwner {
    require(withdrawalWallet != address(0));

    if (now > ICO.start && ICO.amountInvestments.mul(ethUSD).div(1 ether) >= ICO.minCap) {
      withdrawalWallet.transfer(this.balance);
    } else if (now > preICO.start && preICO.amountInvestments.mul(ethUSD).div(1 ether) >= preICO.minCap) {
      withdrawalWallet.transfer(preICO.amountInvestments);
    } else {
      revert();
    }
  }

  function refund(uint _id) public whenNotPaused {
    require(_id == 0 || _id == 1);
    Stage storage currentStage = (_id == 0 ? preICO : ICO);
    require(now > (currentStage.start + currentStage.duration));
    require(currentStage.amountInvestments.mul(ethUSD).div(1 ether) < currentStage.minCap);

    _id == 0 ? preICO.investments[msg.sender] = 0 : ICO.investments[msg.sender] = 0;
    token.clear(msg.sender, ICO.start + ICO.duration, token.getBeneficiaryByTime(msg.sender, ICO.start + ICO.duration));
    msg.sender.transfer(currentStage.investments[msg.sender]);
    TransferWei(msg.sender, currentStage.investments[msg.sender]);
  }

  function setWithdrawalAddress(address _addr) public onlyOwner {
    require(now < preICO.start && _addr != address(0));

    withdrawalWallet = _addr;
  }

  function manualSend(address _to, uint _value, uint _price) public onlyOwner {
    Stage memory currentStage = definitionStage();
    uint remainder = currentStage.totalSupply.sub(currentStage.sold);
    uint tokens = _value > remainder ? remainder : _value;
    uint totalAmount = tokens.mul(currentStage.rate).mul(1 ether).div(decimals).div(_price);

    if (currentStage.id == 0) {
      preICO.sold = preICO.sold.add(tokens);
      preICO.investments[_to] = preICO.investments[_to].add(totalAmount);
      preICO.amountInvestments = preICO.amountInvestments.add(totalAmount);
    } else {
      ICO.sold = ICO.sold.add(tokens);
      ICO.investments[_to] = ICO.investments[_to].add(totalAmount);
      ICO.amountInvestments = ICO.amountInvestments.add(totalAmount);
    }

    freezeTokens(_to, ICO.start + ICO.duration, tokens);
  }

  function manualSendBeforeCrowdsale(address _to, uint _value) public onlyOwner {
    require(now < preICO.start);

    uint remainder = beforePreICOLimit.sub(beforePreICOTokens);
    uint tokens = _value > remainder ? remainder : _value;
    beforePreICOTokens = beforePreICOTokens.add(tokens);

    freezeTokens(_to, ICO.start + ICO.duration, tokens);
  }

  function setAddress(uint _id, address _addr) public onlyOwner {
    require(now < preICO.start && _addr != address(0) && _id < 3);

    address previous = addresses[_id].addr;
    addresses[_id].addr = _addr;
    if (previous != address(0)) token.clear(previous, addresses[_id].time, addresses[_id].amount);
    token.freeze(_addr, addresses[_id].time, addresses[_id].amount);
  }

  function burnUnsoldTokens() public {
    require(msg.sender == owner || msg.sender == burner);
    require(now > (ICO.start + ICO.duration));

    token.burn();
  }

  function unfreezeTokens() public whenNotPaused {
    require(
      now > ICO.start + ICO.duration &&
      ICO.amountInvestments.mul(ethUSD).div(1 ether) >= ICO.minCap
    );

    token.unfreeze(msg.sender);
  }

  function getInvestments(uint _id, address _addr) public constant returns(uint) {
    require(_addr != address(0) && (_id == 0 || _id == 1));

    return (_id == preICO.id ? preICO.investments[_addr] : ICO.investments[_addr]);
  }

  function getFrozenTokens(address _to, uint _id) public constant returns(uint, uint) {
    var (value, time) = token.getBeneficiaryById(_to, _id);
    return (value, time);
  }

  function getNumberInvestors() public constant returns(uint) {
    return investors.length;
  }

  function() public payable {
    createTokens();
  }
}
