import React, { Component } from 'react';
import { Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import moment from 'moment';

const timeFormat = 'D.MM.YYYY, HH:mm:ss';
const [
  START, DURATION, TOTALAMOUNT, MINCAP,
  RATE, MININVESTMENT, SMALLBONUS, BIGBONUS, SOLD, AMOUNTINVESTMENTS
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

class Statistics extends Component {
  constructor(props) {
    super(props);

    this.state = {
      preICO: Array(11).fill(0),
      ICO: Array(11).fill(0)
    };
  }

  async componentWillReceiveProps() {
    const { preICO, ICO } = this.props.crowdsale;
    const [_preICO, _ICO] = await Promise.all([preICO.call(), ICO.call()]);

    this.setState({
      preICO: this.conversionStageAttributes(_preICO),
      ICO: this.conversionStageAttributes(_ICO)
    });

    this.getInfoInvestors();
  }

  async getInfoInvestors() {
    const { balanceOf, getBeneficiaryById, getNumRecords } = this.props.token;
    const { getNumberInvestors, investors, getInvestments } = this.props.crowdsale;
    const ICO = this.state.ICO;
    const divider = this.props.divider;
    const numInvestors = (await getNumberInvestors.call()).toNumber();
    const arrInvestors = [];

    for (let i = 0; i < numInvestors; i += 1) {
      const address = await investors.call(i);
      const [available, numRecords, investmentsPreICO, investmentsICO] = await Promise.all([
        balanceOf(address),
        getNumRecords(address),
        getInvestments(0, address),
        getInvestments(1, address)
      ]);

      const inSixMonths = ICO[START].toNumber() + ICO[DURATION].toNumber();
      for (let id = 0; id < numRecords.toNumber(); id += 1) {
        const record = await getBeneficiaryById.call(address, id);
        if (inSixMonths === record[1].toNumber()) {
          arrInvestors.push({
            address,
            available: available.toNumber() / divider,
            frozenTokens: record[0].toNumber() / divider,
            investments: this.props.web3.fromWei(investmentsPreICO.toNumber() + investmentsICO.toNumber(), 'ether'),
            defrostTime: moment.unix(record[1]).format(timeFormat)
          });
        }
      }
    }
    this.setState({ investors: arrInvestors });
  }

  conversionStageAttributes(stage) {
    const fromWei = this.props.web3.fromWei;
    const divider = this.props.divider;
    return stage.map((value, index) => {
      switch (index) {
        case START:
          return value;
        case DURATION:
          return value;
        case TOTALAMOUNT:
        case SOLD:
          return value / divider;
        case MINCAP:
          return value / 100;
        case RATE:
          return value / 100;
        case MININVESTMENT:
          return fromWei(value, 'ether');
        case SMALLBONUS:
          return 100 / value;
        case BIGBONUS:
          return parseInt(value, 10);
        case AMOUNTINVESTMENTS:
          return Math.round(fromWei(value, 'ether') * 1E6) / 1E6;
        default:
          return value;
      }
    });
  }

  tokenFormatter = cell =>
    cell.toLocaleString(undefined, { maximumFractionDigits: this.props.decimals });

  render() {
    const decimals = this.props.decimals;
    const { preICO, ICO } = this.state;
    return (
      <div className="container">
        <h5>Information about the stages</h5>
        <hr className="my-2" />
        <Row>
          <Col md={{ size: 4, offset: 4 }} style={{ fontWeight: 'bold' }}>Pre-ICO</Col>
          <Col md={{ size: 4 }} style={{ fontWeight: 'bold' }}>ICO</Col>
        </Row>
        <Row>
          <Col>
            <div>Start</div>
            <div>Duration (days)</div>
            <div>Total amount (NEAT)</div>
            <div>Min cap (USD)</div>
            <div>Token rate (USD)</div>
            <div>Minimum investment (ETH)</div>
            <div>Contribution &gt;= 40 ETH</div>
            <div>Contribution &gt;= 100 ETH</div>
            <div>Sold tokens</div>
            <div>Amount of investments (ETH)</div>
          </Col>
          <Col style={{ fontStyle: 'italic' }}>
            <div>{moment.unix(preICO[START]).format(timeFormat)}</div>
            <div>{Math.round((preICO[DURATION] / 86400) * 10000) / 10000}</div>
            <div>{preICO[TOTALAMOUNT].toLocaleString()}</div>
            <div>{preICO[MINCAP].toLocaleString()}</div>
            <div>{preICO[RATE]}</div>
            <div>{preICO[MININVESTMENT].toLocaleString()}</div>
            <div>{preICO[SMALLBONUS]}%</div>
            <div>{preICO[BIGBONUS]}%</div>
            <div>{preICO[SOLD].toLocaleString(undefined, { maximumFractionDigits: decimals })}</div>
            <div>{preICO[AMOUNTINVESTMENTS].toLocaleString()}</div>
          </Col>
          <Col style={{ fontStyle: 'italic' }}>
            <div>{moment.unix(ICO[START]).format(timeFormat)}</div>
            <div>{Math.round((ICO[DURATION] / 86400) * 10000) / 10000}</div>
            <div>{ICO[TOTALAMOUNT].toLocaleString()}</div>
            <div>{ICO[MINCAP].toLocaleString()}</div>
            <div>{ICO[RATE]}</div>
            <div>{ICO[MININVESTMENT].toLocaleString()}</div>
            <div>{ICO[SMALLBONUS]}%</div>
            <div>{ICO[BIGBONUS]}%</div>
            <div>{ICO[SOLD].toLocaleString(undefined, { maximumFractionDigits: decimals })}</div>
            <div>{ICO[AMOUNTINVESTMENTS].toLocaleString()}</div>
          </Col>
        </Row>
        <h5>Information about investors</h5>
        <Row>
          <Col>
            <BootstrapTable data={this.state.investors} version="4" striped hover>
              <TableHeaderColumn dataField="address" isKey>Address</TableHeaderColumn>
              <TableHeaderColumn dataField="investments">Invt. (ETH)</TableHeaderColumn>
              <TableHeaderColumn dataField="available" dataFormat={this.tokenFormatter}>Available NEAT</TableHeaderColumn>
              <TableHeaderColumn dataField="frozenTokens" dataFormat={this.tokenFormatter}>Frozen NEAT</TableHeaderColumn>
              <TableHeaderColumn dataField="defrostTime">Defrost time</TableHeaderColumn>
            </BootstrapTable>
          </Col>
        </Row>
      </div>
    );
  }
}

Statistics.propTypes = {
  web3: PropTypes.shape({
    fromWei: PropTypes.func.isRequired
  }),
  token: PropTypes.shape({
    balanceOf: PropTypes.func.isRequired,
    getBeneficiaryById: PropTypes.func.isRequired,
    getNumRecords: PropTypes.func.isRequired
  }),
  crowdsale: PropTypes.shape({
    preICO: PropTypes.func.isRequired,
    ICO: PropTypes.func.isRequired,
    getNumberInvestors: PropTypes.func.isRequired,
    investors: PropTypes.func.isRequired,
    getInvestments: PropTypes.func.isRequired
  }),
  divider: PropTypes.number.isRequired,
  decimals: PropTypes.number.isRequired
};

export default Statistics;
