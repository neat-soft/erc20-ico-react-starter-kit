import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import React, { Component } from 'react';
import { Row, Col, Input } from 'reactstrap';
import PropTypes from 'prop-types';
import Toggle from 'material-ui/Toggle';

const lightMuiTheme = getMuiTheme(lightBaseTheme);

class Sidebar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      paused: false,
      crowdsaleTokens: 0,
      totalSupply: 0
    };
  }

  componentWillMount() {
    this.updateInfo();
  }

  async componentWillReceiveProps() {
    this.updateInfo();
  }

  async updateInfo() {
    const { address, paused } = this.props.crowdsale;
    const { balanceOf, totalSupply } = this.props.token;

    const flag = await paused.call();
    const crowdsaleTokens = (await balanceOf(address)) / this.props.divider;
    const total = (await totalSupply.call()) / this.props.divider;

    this.setState({
      paused: flag,
      totalSupply: total,
      crowdsaleTokens
    });
  }

  async toogle(e, f) {
    const account = this.props.web3.account;
    const { unpause, pause } = this.props.crowdsale;
    const { messenger, successMessage, errorMessage } = this.props;

    try {
      let tx;
      if (f === true) {
        tx = await unpause({ from: account, gas: 100000 });
      } else {
        tx = await pause({ from: account, gas: 100000 });
      }
      messenger(successMessage(tx.receipt.blockNumber, tx.receipt.gasUsed));
    } catch (error) {
      messenger(errorMessage);
    }
  }

  render() {
    const { address, name, symbol, decimals, initialSupply } = this.props.token;
    const { paused, crowdsaleTokens, totalSupply } = this.state;
    return (
      <Col className="mySidebar">
        <div className="small-container">
          <Row>
            <Col>
              <h5>Token</h5>
              <hr className="my-2" />
            </Col>
          </Row>
          <Row><Col>Address</Col></Row>
          <Row className="form-group">
            <Col>
              <Input disabled value={address} />
            </Col>
          </Row>
          <Row>
            <Col>Name</Col>
            <Col className="displayValue">{name}</Col>
          </Row>
          <Row>
            <Col>Symbol</Col>
            <Col className="displayValue">{symbol}</Col>
          </Row>
          <Row>
            <Col>Decimals</Col>
            <Col className="displayValue">{decimals}</Col>
          </Row>
          <Row>
            <Col>Initial supply</Col>
            <Col className="displayValue">{initialSupply.toLocaleString()}</Col>
          </Row>
          <Row>
            <Col>Total supply</Col>
            <Col className="displayValue">{totalSupply.toLocaleString()}</Col>
          </Row>
          <Row>
            <Col>Crowdsale tokens</Col>
            <Col className="displayValue">{crowdsaleTokens.toLocaleString(undefined, { maximumFractionDigits: decimals })}</Col>
          </Row>
          <Row>
            <Col>
              <h5>Crowdsale contract</h5>
            </Col>
            <Col style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <MuiThemeProvider muiTheme={lightMuiTheme}>
                <Toggle
                  toggled={paused === false}
                  onToggle={(e, f) => this.toogle(e, f)}
                  style={{ width: '30%', marginBottom: 8 }}
                />
              </MuiThemeProvider>
            </Col>
          </Row>
          <hr className="my-2" />
          <Row><Col>Address</Col></Row>
          <Row className="form-group">
            <Col>
              <Input disabled value={this.props.crowdsale.address} />
            </Col>
          </Row>
          <Row><Col>Owner</Col></Row>
          <Row className="form-group">
            <Col>
              <Input disabled value={this.props.owner} />
            </Col>
          </Row>
        </div>
      </Col>
    );
  }
}

Sidebar.defaultProps = {
  token: {
    address: '',
    name: '',
    symbol: '',
    decimals: 0,
    initialSupply: 0
  }
};

Sidebar.propTypes = {
  web3: PropTypes.shape({
    account: PropTypes.string.isRequired
  }),
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    decimals: PropTypes.number.isRequired,
    initialSupply: PropTypes.number.isRequired,
    totalSupply: PropTypes.func.isRequired,
    balanceOf: PropTypes.func.isRequired
  }),
  crowdsale: PropTypes.shape({
    address: PropTypes.string.isRequired,
    paused: PropTypes.func.isRequired,
    unpause: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired
  }),
  divider: PropTypes.number.isRequired,
  owner: PropTypes.string.isRequired,
  messenger: PropTypes.func.isRequired,
  successMessage: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired
};

export default Sidebar;
