import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Snackbar from 'material-ui/Snackbar';

import React, { Component } from 'react';
import { Navbar, Col } from 'reactstrap';
import { Tabs, Tab } from 'material-ui/Tabs';
import SwipeableViews from 'react-swipeable-views';

import 'react-bootstrap-table/dist/react-bootstrap-table.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

import CrowdsaleContract from '../build/contracts/Crowdsale.json';
import getWeb3 from './utils/getWeb3';
import Main from './components/Main';
import Administration from './components/Administration';
import Statistics from './components/Statistics';
import Sidebar from './components/Sidebar';

const contract = require('truffle-contract');

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const errorMessage = 'Error! Сheck requirements!';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tab: 0,
      tokenAddress: '',
      owner: '',

      snackbar: false,
      message: ''
    };
  }

  async componentWillMount() {
    const web3 = (await getWeb3).web3;

    // Crowdsale initialization
    const crowdsale = contract(CrowdsaleContract);
    crowdsale.setProvider(web3.currentProvider);
    const instanceCrowdsale = await crowdsale.deployed();
    const tokenAddress = await instanceCrowdsale.token.call();

    // Token initialization
    const file = require('../build/contracts/NEAT20Token.json');
    const NEAT20Token = contract({ abi: file.abi });
    NEAT20Token.setProvider(web3.currentProvider);
    const instanceToken = NEAT20Token.at(tokenAddress);

    const [
      owner, tokenName, tokenSymbol, decimals, initialSupply
    ] = await Promise.all([
      instanceCrowdsale.owner.call(),
      instanceToken.name.call(), instanceToken.symbol.call(),
      instanceToken.decimals.call(), instanceToken.initialSupply.call()
    ]);
    const decimalsNum = decimals.toNumber();
    const divider = Math.pow(10, decimalsNum);

    this.setState({
      web3,

      // Crowdsale
      owner,
      instanceCrowdsale,
      divider,

      // Token
      instanceToken,
      token: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: decimalsNum,
        initialSupply: initialSupply.toNumber() / divider,
        totalSupply: instanceToken.totalSupply,
        balanceOf: instanceToken.balanceOf
      }
    });
  }

  updateOwner = owner => this.setState({ owner });

  tabChange = (tab) => {
    this.setState({ tab });
  };

  successMessage = (block, gasUsed) => `Success! Block Number: ${block}. Gas used ${gasUsed}`;

  messenger = (message) => {
    this.setState({
      snackbar: true,
      message
    });
  };

  handleRequestClose = () => {
    this.setState({
      snackbar: false,
    });
  };

  render() {
    const {
      web3, instanceToken,
      instanceCrowdsale, divider, token,
      owner, tab, snackbar, message
    } = this.state;
    if (!web3) return (<div className="wait">Web3 not initialized. Wait pls...</div>);
    return (
      <div className="App">
        <Navbar className="myNavbar">
          <div className="navbar-brand" style={{ fontSize: 25 }}>NEAT20 token ICO</div>
        </Navbar>
        <main className="myContainer">
          <Col md={{ size: 8 }} className="mainColumn">
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <Tabs onChange={this.tabChange} value={tab}>
                <Tab label="Main" value={0} />
                <Tab label="Administration" value={1} />
                <Tab label="Statistics" value={2} />
              </Tabs>
            </MuiThemeProvider>
            <SwipeableViews index={tab} onChangeIndex={this.tabChange}>
              <Main
                web3={{
                  fromWei: web3.fromWei,
                  eth: {
                    account: web3.eth.accounts ? web3.eth.accounts[0] : '',
                    getBalance: web3.eth.getBalance,
                    sendTransaction: web3.eth.sendTransaction,
                  },
                  toWei: web3.toWei
                }}
                token={{
                  balanceOf: instanceToken.balanceOf,
                  getBeneficiaryById: instanceToken.getBeneficiaryById,
                  getNumRecords: instanceToken.getNumRecords
                }}
                crowdsale={{
                  address: instanceCrowdsale.address,
                  getInvestments: instanceCrowdsale.getInvestments,
                  refund: instanceCrowdsale.refund,
                  unfreezeTokens: instanceCrowdsale.unfreezeTokens
                }}
                divider={divider}
                messenger={this.messenger}
                errorMessage={errorMessage}
                successMessage={this.successMessage}
                decimals={token.decimals}
              />
              <Administration
                web3={{
                  fromWei: web3.fromWei,
                  eth: {
                    account: web3.eth.accounts ? web3.eth.accounts[0] : '',
                    getBalance: web3.eth.getBalance
                  }
                }}
                divider={divider}
                crowdsale={{
                  address: instanceCrowdsale.address,
                  ethUSD: instanceCrowdsale.ethUSD,
                  withdrawalWallet: instanceCrowdsale.withdrawalWallet,
                  addresses: instanceCrowdsale.addresses,
                  owner: instanceCrowdsale.owner,
                  setEthUSD: instanceCrowdsale.setEthUSD,
                  setWithdrawalAddress: instanceCrowdsale.setWithdrawalAddress,
                  setFoundersAddress: instanceCrowdsale.setFoundersAddress,
                  setAddress: instanceCrowdsale.setAddress,
                  withdrawal: instanceCrowdsale.withdrawal,
                  manualSend: instanceCrowdsale.manualSend,
                  manualSendBeforeCrowdsale: instanceCrowdsale.manualSendBeforeCrowdsale,
                  transferOwnership: instanceCrowdsale.transferOwnership
                }}
                updateOwner={this.updateOwner}
                messenger={this.messenger}
                errorMessage={errorMessage}
                successMessage={this.successMessage}
              />
              <Statistics
                web3={{
                  fromWei: web3.fromWei,
                }}
                token={{
                  balanceOf: instanceToken.balanceOf,
                  getBeneficiaryById: instanceToken.getBeneficiaryById,
                  getNumRecords: instanceToken.getNumRecords
                }}
                crowdsale={{
                  preICO: instanceCrowdsale.preICO,
                  ICO: instanceCrowdsale.ICO,
                  getNumberInvestors: instanceCrowdsale.getNumberInvestors,
                  investors: instanceCrowdsale.investors,
                  getInvestments: instanceCrowdsale.getInvestments
                }}
                divider={divider}
                decimals={token.decimals}
              />
            </SwipeableViews>
          </Col>
          <Col md={{ size: 4 }} className="mainColumn">
            <div className="topSidebar" />
            <MuiThemeProvider muiTheme={lightMuiTheme}>
              <Snackbar
                open={snackbar}
                message={message}
                autoHideDuration={10000}
                onRequestClose={this.handleRequestClose}
              />
            </MuiThemeProvider>
            <Sidebar
              web3={{
                account: web3.eth.accounts ? web3.eth.accounts[0] : ''
              }}
              token={token}
              crowdsale={{
                address: instanceCrowdsale.address,
                paused: instanceCrowdsale.paused,
                unpause: instanceCrowdsale.unpause,
                pause: instanceCrowdsale.pause
              }}
              divider={divider}
              owner={owner}
              messenger={this.messenger}
              errorMessage={errorMessage}
              successMessage={this.successMessage}
            />
          </Col>
        </main>
      </div>
    );
  }
}

export default App;
