pragma solidity ^0.4.18;

import './StandardToken.sol';
import './Ownable.sol';

contract TokenTimelock is StandardToken, Ownable {
  struct Ice {
    uint value;
    uint time;
  }
  mapping (address => Ice[]) beneficiary;

  event Freezing(address indexed to, uint value, uint time);
  event UnFreeze(address indexed to, uint time, uint value);
  event Crack(address indexed addr, uint time, uint value);

  function freeze(address _to, uint _releaseTime, uint _value) public onlyOwner {
    require(_to != address(0));
    require(_value > 0 && _value <= balances[owner]);

    // Check exist
    uint i;
    bool f;
    while (i < beneficiary[_to].length) {
      if (beneficiary[_to][i].time == _releaseTime) {
        f = true;
        break;
      }
      i++;
    }

    // Add data
    if (f) {
      beneficiary[_to][i].value = beneficiary[_to][i].value.add(_value);
    } else {
      Ice memory temp = Ice({
          value: _value,
          time: _releaseTime
      });
      beneficiary[_to].push(temp);
    }
    balances[owner] = balances[owner].sub(_value);
    Freezing(_to, _value, _releaseTime);
  }

  function unfreeze(address _to) public onlyOwner {
    Ice memory record;
    for (uint i = 0; i < beneficiary[_to].length; i++) {
      record = beneficiary[_to][i];
      if (record.value > 0 && record.time < now) {
        beneficiary[_to][i].value = 0;
        balances[_to] = balances[_to].add(record.value);
        UnFreeze(_to, record.time, record.value);
      }
    }
  }

  function clear(address _to, uint _time, uint _amount) public onlyOwner {
    for (uint i = 0; i < beneficiary[_to].length; i++) {
      if (beneficiary[_to][i].time == _time) {
        beneficiary[_to][i].value = beneficiary[_to][i].value.sub(_amount);
        balances[owner] = balances[owner].add(_amount);
        Crack(_to, _time, _amount);
        break;
      }
    }
  }

  function getBeneficiaryByTime(address _to, uint _time) public view returns(uint) {
    for (uint i = 0; i < beneficiary[_to].length; i++) {
      if (beneficiary[_to][i].time == _time) {
        return beneficiary[_to][i].value;
      }
    }
  }

  function getBeneficiaryById(address _to, uint _id) public view returns(uint, uint) {
    return (beneficiary[_to][_id].value, beneficiary[_to][_id].time);
  }

  function getNumRecords(address _to) public view returns(uint) {
    return beneficiary[_to].length;
  }
}
