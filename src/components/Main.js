/* eslint-disable */
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import moment from 'moment';

import React, { Component } from 'react';
import { Row, Col, Input } from 'reactstrap';
import PropTypes from 'prop-types';
import RaisedButton from 'material-ui/RaisedButton';

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const timeFormat = 'D.MM.YYYY, HH:mm:ss';

class Main extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: '0x00',
      balance: 0,
      amount: '',
      tokens: 0,
      availableTokens: 0,
      frozenTokens: [0, 0],
      investmentsPreICO: 0,
      investmentsICO: 0,
      records: []
    };
  }

  async componentWillReceiveProps() {
    const fromWei = this.props.web3.fromWei;
    const account = this.props.web3.eth.account;
    const { balanceOf, getBeneficiaryById, getNumRecords } = this.props.token;
    const getInvestments = this.props.crowdsale.getInvestments;

    const [
      availableTokens, investmentsPreICO, investmentsICO, numRecords
    ] = await Promise.all([
      balanceOf(account),
      getInvestments(0, account),
      getInvestments(1, account),
      getNumRecords(account)
    ]);
    const balance = await this.getBalance(account);

    let record;
    const records = [];
    for (let id = 0; id < numRecords.toNumber(); id += 1) {
      record = await getBeneficiaryById.call(account, id);
      if (record[0].toNumber() > 0) records.push(record);
    }

    this.setState({
      account,
      balance: fromWei(balance, 'ether'),
      availableTokens: availableTokens.toNumber(),
      investmentsPreICO: fromWei(investmentsPreICO.toNumber(), 'ether'),
      investmentsICO: fromWei(investmentsICO.toNumber(), 'ether'),
      records
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

  buyTokens() {
    const { account, sendTransaction } = this.props.web3.eth;
    const crowdsaleAddress = this.props.crowdsale.address;
    const { messenger, errorMessage } = this.props;

    sendTransaction({
      from: account,
      to: crowdsaleAddress,
      value: this.props.web3.toWei(this.state.amount, 'ether'),
      gas: 300000
    }, (error) => {
      if (error) {
        messenger(errorMessage);
      } else {
        messenger('The transaction was sent. Pending...');
      }
    });
  }

  async unfreezeTokens() {
    const unfreezeTokens = this.props.crowdsale.unfreezeTokens;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await unfreezeTokens({ from: this.props.web3.eth.account, gas: 200000 });
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  async refund(id) {
    const refund = this.props.crowdsale.refund;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      const tx = await refund(id, { from: this.props.web3.eth.account, gas: 200000 });
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  render() {
    const {
      account, balance, availableTokens,
      investmentsPreICO, investmentsICO,
      records
    } = this.state;
    const { divider, decimals } = this.props;

    return (
      <div className="container">
        <Row>
          <Col md={{ size: 10, offset: 1 }}>
            <h5>My Info</h5>
            <hr className="my-2" />
            <Row>
              <Col>
                <div>Address</div>
                <div>Balance (ETH)</div>
                <div>Pre-ICO Investments (ETH)</div>
                <div>ICO Investments (ETH)</div>
                <div>Available tokens</div>
              </Col>
              <Col style={{ fontStyle: 'italic' }}>
                <div className="displayValue">{account}</div>
                <div className="displayValue">{balance.toLocaleString()}</div>
                <div className="displayValue">{investmentsPreICO.toLocaleString()}</div>
                <div className="displayValue">{investmentsICO.toLocaleString()}</div>
                <div className="displayValue">{(availableTokens / divider).toLocaleString(undefined, { maximumFractionDigits: decimals })}</div>
              </Col>
            </Row>
            <Row>
              <Col><div><strong>Frozen tokens</strong></div></Col>
              <Col><div><strong>Defrost time</strong></div></Col>
            </Row>
            {records.map((record, index) => {
              return (
                <Row key={index}>
                  <Col><div>{(record[0] / divider).toLocaleString(undefined, { maximumFractionDigits: decimals })}</div></Col>
                  <Col><div>{moment.unix(record[1]).format(timeFormat)}</div></Col>
                </Row>
              );
            })}
            <Row>
              <Col md={{ size: 5 }}>
                <h5>Buy tokens</h5>
                <hr className="my-2" />
                <Row>
                  <Col md={{ size: 8 }}>
                    <Input
                      type="number"
                      value={this.state.amount}
                      onChange={e => this.setState({ amount: e.target.value })}
                      placeholder="Enter amount (ETH)"
                      onKeyDown={this.handleSubmit}
                    />
                  </Col>
                  <Col md={{ size: 4 }} style={{ textAlign: 'end' }}>
                    <MuiThemeProvider muiTheme={lightMuiTheme}>
                      <RaisedButton
                        label="Buy"
                        primary
                        onClick={() => this.buyTokens()}
                        style={{ width: 80 }}
                      />
                    </MuiThemeProvider>
                  </Col>
                </Row>
              </Col>
              <Col md={{ size: 7 }}>
                <h5>Other</h5>
                <hr className="my-2" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <MuiThemeProvider muiTheme={lightMuiTheme}>
                    <RaisedButton
                      label="Unfreeze"
                      primary
                      onClick={() => this.unfreezeTokens()}
                    />
                  </MuiThemeProvider>
                  <MuiThemeProvider muiTheme={lightMuiTheme}>
                    <RaisedButton
                      label="Pre-ICO refund"
                      secondary
                      onClick={() => this.refund(0)}
                    />
                  </MuiThemeProvider>
                  <MuiThemeProvider muiTheme={lightMuiTheme}>
                    <RaisedButton
                      label="ICO refund"
                      secondary
                      onClick={() => this.refund(1)}
                    />
                  </MuiThemeProvider>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}

Main.propTypes = {
  web3: PropTypes.shape({
    fromWei: PropTypes.func,
    eth: PropTypes.shape({
      account: PropTypes.string,
      getBalance: PropTypes.func,
      sendTransaction: PropTypes.func,
    }),
    toWei: PropTypes.func
  }),
  token: PropTypes.shape({
    balanceOf: PropTypes.func,
    getBeneficiaryById: PropTypes.func,
    getNumRecords: PropTypes.func
  }),
  crowdsale: PropTypes.shape({
    address: PropTypes.string,
    getInvestments: PropTypes.func,
    refund: PropTypes.func,
    unfreezeTokens: PropTypes.func
  }),
  divider: PropTypes.number,
  decimals: PropTypes.number.isRequired,
  messenger: PropTypes.func,
  successMessage: PropTypes.func,
  errorMessage: PropTypes.string
};

export default Main;
