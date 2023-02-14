import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import React, { Component } from 'react';
import { Row, Col, Input } from 'reactstrap';
import PropTypes from 'prop-types';
import RaisedButton from 'material-ui/RaisedButton';

import '../css/Administration.css';

const lightMuiTheme = getMuiTheme(lightBaseTheme);

class Administration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      balanceContract: '',
      ethUSD: '',
      manualTokens: '',
      manualTokensBeforePreICO: '',
      manualAddress: '',
      manualAddressBeforePreICO: '',
      manualPrice: '',
      withdrawalAddress: '',
      newOwner: '',

      id: 0,
      address: '',
      addresses: []
    };
  }

  async componentWillReceiveProps() {
    const {
      address, ethUSD, withdrawalWallet, addresses, owner
    } = this.props.crowdsale;

    const [
      _ethUSD, _withdrawalAddress,
      _address0, _address1, _address2,
      _newOwner
    ] = await Promise.all([
      ethUSD.call(), withdrawalWallet.call(),
      addresses.call(0), addresses.call(1), addresses.call(2),
      owner.call()
    ]);
    const balance = await this.getBalance(address);
    const arr = [_address0, _address1, _address2];

    this.setState({
      address: arr[this.state.id][0],
      ethUSD: _ethUSD / 100,
      withdrawalAddress: _withdrawalAddress,
      addresses: [_address0, _address1, _address2],
      newOwner: _newOwner,
      balanceContract: this.props.web3.fromWei(balance, 'ether')
    });
  }

  getBalance(address) {
    return new Promise((resolve, reject) => {
      this.props.web3.eth.getBalance(address, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  // function setEthUSD(uint _rate) public onlyOwner
  async setEthUSD() {
    const setEthUSD = this.props.crowdsale.setEthUSD;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await setEthUSD(
        this.state.ethUSD * 100, { from: this.props.web3.eth.account, gas: 100000 }
      );
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  async setWithdrawalAddress() {
    const setWithdrawalAddress = this.props.crowdsale.setWithdrawalAddress;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await setWithdrawalAddress(
        this.state.withdrawalAddress, { from: this.props.web3.eth.account, gas: 100000
      });
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  async setAddress() {
    const { setAddress } = this.props.crowdsale;
    const { messenger, successMessage, errorMessage } = this.props;
    const { id, address } = this.state;

    try {
      const tx = await setAddress(id, address, { from: this.props.web3.eth.account, gas: 200000 });
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  async withdrawal() {
    const withdrawal = this.props.crowdsale.withdrawal;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await withdrawal({ from: this.props.web3.eth.account, gas: 200000 });
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  // function manualSend(address _to, uint _value) public onlyOwner
  async manualSend() {
    const manualSend = this.props.crowdsale.manualSend;
    const { divider, messenger, successMessage, errorMessage } = this.props;

    try {
      const { manualTokens, manualAddress, manualPrice } = this.state;
      const tx = await manualSend(
        manualAddress,
        manualTokens * divider,
        manualPrice * 100,
        { from: this.props.web3.eth.account, gas: 200000 }
      );

      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  // function manualSendBeforeCrowdsale(address _to, uint _value) public onlyOwner
  async manualSendBeforeCrowdsale() {
    const manualSendBeforeCrowdsale = this.props.crowdsale.manualSendBeforeCrowdsale;
    const { divider, messenger, successMessage, errorMessage } = this.props;

    try {
      const { manualTokensBeforePreICO, manualAddressBeforePreICO } = this.state;
      const tx = await manualSendBeforeCrowdsale(
        manualAddressBeforePreICO, manualTokensBeforePreICO * divider,
        { from: this.props.web3.eth.account, gas: 200000 }
      );
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  async transferOwnership() {
    const { transferOwnership, owner } = this.props.crowdsale;
    const { updateOwner, messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await transferOwnership(
        this.state.newOwner, { from: this.props.web3.eth.account, gas: 100000 }
      );
      updateOwner(await owner.call());
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  changeId = (id) => {
    this.setState({
      id,
      address: this.state.addresses[id][0]
    });
  }

  render() {
    const {
      id, withdrawalAddress, address, newOwner
    } = this.state;

    return (
      <div className="container">
        <Row>
          <Col>
            <h5>Set up ETH/USD</h5>
            <hr className="my-2" />
            <Row>
              <Col md={{ size: 7 }}>
                <Input
                  type="number"
                  value={this.state.ethUSD}
                  onChange={e => this.setState({ ethUSD: e.target.value })}
                  placeholder="Enter amount (USD)"
                  onKeyDown={this.handleSubmit}
                />
              </Col>
              <Col md={{ size: 5 }} style={{ textAlign: 'end' }}>
                <MuiThemeProvider muiTheme={lightMuiTheme}>
                  <RaisedButton
                    primary
                    label="Update"
                    onClick={() => this.setEthUSD()}
                    style={{ width: 130 }}
                  />
                </MuiThemeProvider>
              </Col>
            </Row>
          </Col>
          <Col>
            <h5>Withdrawal</h5>
            <hr className="my-2" />
            <Row>
              <Col md={{ size: 7 }}>
                <Input
                  type="number"
                  value={this.state.balanceContract}
                  onChange={e => this.setState({ ethUSD: e.target.value })}
                  disabled
                  onKeyDown={this.handleSubmit}
                />
              </Col>
              <Col md={{ size: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <MuiThemeProvider muiTheme={lightMuiTheme}>
                    <RaisedButton
                      primary
                      label="Withdraw"
                      onClick={() => this.withdrawal()}
                      className="adminButton"
                    />
                  </MuiThemeProvider>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
        <h5>Manual tokens send (before pre-ICO)</h5>
        <hr className="my-2" />
        <Row>
          <Col md={{ size: 3 }}>
            <Input
              type="number"
              value={this.state.manualTokensBeforePreICO}
              onChange={e => this.setState({ manualTokensBeforePreICO: e.target.value })}
              placeholder="Enter amount tokens"
              onKeyDown={this.handleSubmit}
            />
          </Col>
          <Col md={{ size: 6 }}>
            <Input
              value={this.state.manualAddressBeforePreICO}
              onChange={e => this.setState({ manualAddressBeforePreICO: e.target.value })}
              onKeyDown={this.handleSubmit}
              placeholder="0x6330a553fc93768f612722bb8c2ec78ac90b3bbc"
              className="adminInput"
            />
          </Col>
          <Col md={{ size: 3 }} style={{ textAlign: 'end' }}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <RaisedButton
                primary
                label="Send"
                onClick={() => this.manualSendBeforeCrowdsale()}
                className="adminButton"
              />
            </MuiThemeProvider>
          </Col>
        </Row>
        <h5>Manual tokens send</h5>
        <hr className="my-2" />
        <Row>
          <Col md={{ size: 3 }}>
            <Input
              type="number"
              value={this.state.manualTokens}
              onChange={e => this.setState({ manualTokens: e.target.value })}
              onKeyDown={this.handleSubmit}
              placeholder="Amount of tokens"
            />
          </Col>
          <Col md={{ size: 4 }}>
            <Input
              value={this.state.manualAddress}
              onChange={e => this.setState({ manualAddress: e.target.value })}
              onKeyDown={this.handleSubmit}
              placeholder="Address"
              className="adminInput"
            />
          </Col>
          <Col md={{ size: 2 }}>
            <Input
              value={this.state.manualPrice}
              onChange={e => this.setState({ manualPrice: e.target.value })}
              onKeyDown={this.handleSubmit}
              placeholder="Price (USD)"
            />
          </Col>
          <Col md={{ size: 3 }} style={{ textAlign: 'end' }}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <RaisedButton
                primary
                label="Send"
                onClick={() => this.manualSend()}
                className="adminButton"
              />
            </MuiThemeProvider>
          </Col>
        </Row>
        <h5>Addresses (before pre-ICO)</h5>
        <hr className="my-2" />
        <Row>
          <Col md={{ size: 3 }}>
            <div>Withdrawal address</div>
          </Col>
          <Col md={{ size: 6 }}>
            <Input
              value={withdrawalAddress}
              onChange={e => this.setState({ withdrawalAddress: e.target.value })}
              onKeyDown={this.handleSubmit}
              className="adminInput"
            />
          </Col>
          <Col style={{ textAlign: 'end' }}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <RaisedButton
                primary
                label="Set"
                onClick={() => this.setWithdrawalAddress()}
                className="adminButton"
              />
            </MuiThemeProvider>
          </Col>
        </Row>
        <Row>
          <Col md={{ size: 3 }}>
            <Input type="select" name="select" value={id} onChange={e => this.changeId(e.target.value)}>
              <option value="0">Founders</option>
              <option value="1">Bounty program</option>
              <option value="2">Marketing</option>
            </Input>
          </Col>
          <Col md={{ size: 6 }}>
            <Input
              value={address}
              onChange={e => this.setState({ address: e.target.value })}
              onKeyDown={this.handleSubmit}
              className="adminInput"
            />
          </Col>
          <Col style={{ textAlign: 'end' }}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <RaisedButton
                primary
                label="Set"
                onClick={() => this.setAddress()}
                className="adminButton"
              />
            </MuiThemeProvider>
          </Col>
        </Row>
        <h5>Transfer ownership</h5>
        <hr className="my-2" />
        <Row>
          <Col md={{ size: 8 }}>
            <Input
              value={newOwner}
              onChange={e => this.setState({ newOwner: e.target.value })}
              onKeyDown={this.handleSubmit}
              placeholder="0x7598bed25d2c7f283e5e7b38e91da6d80273bce8"
              className="adminInput"
            />
          </Col>
          <Col md={{ size: 4 }} style={{ textAlign: 'end' }}>
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <RaisedButton
                primary
                label="Transfer"
                onClick={() => this.transferOwnership()}
                className="adminButton"
              />
            </MuiThemeProvider>
          </Col>
        </Row>
      </div>
    );
  }
}

Administration.propTypes = {
  web3: PropTypes.shape({
    fromWei: PropTypes.func.isRequired,
    eth: PropTypes.shape({
      account: PropTypes.string.isRequired,
      getBalance: PropTypes.func.isRequired
    })
  }),
  crowdsale: PropTypes.shape({
    address: PropTypes.string.isRequired,
    owner: PropTypes.func.isRequired,
    ethUSD: PropTypes.func.isRequired,
    withdrawalWallet: PropTypes.func.isRequired,
    addresses: PropTypes.func.isRequired,
    setEthUSD: PropTypes.func.isRequired,
    setWithdrawalAddress: PropTypes.func.isRequired,
    setAddress: PropTypes.func.isRequired,
    withdrawal: PropTypes.func.isRequired,
    manualSend: PropTypes.func.isRequired,
    manualSendBeforeCrowdsale: PropTypes.func.isRequired,
    transferOwnership: PropTypes.func.isRequired
  }),
  divider: PropTypes.number.isRequired,
  updateOwner: PropTypes.func.isRequired,
  messenger: PropTypes.func.isRequired,
  successMessage: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired
};

export default Administration;
